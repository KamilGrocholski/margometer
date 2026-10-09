/**
 * `docs/design.md` §12's proof, run by hand: the reports `develop` prints at `DEVELOP_REVISION`,
 * from its own tree and its own tasks, against the ones this branch prints. The figures are held
 * recording by recording, and the decoding status as one text. A difference is a finding in one
 * of the two, never an expectation to move (`AGENTS.md` W8). It stays out of the gate because it
 * runs another branch's program.
 *
 *     deno task fight:develop
 */

import { assert, assertStrictEquals } from "@std/assert";
import { emptyDirSync } from "@std/fs";
import { formatInteger } from "#/libs/number-text.ts";
import * as errors from "#/libs/errors.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { DEVELOP_REVISION } from "#/tests/recording-sources.ts";
import { formatMaterialStatus } from "./decoding-status.ts";
import { formatMaterialFigures } from "./fight-figures.ts";
import { DevelopReportError } from "./margometer-tool-error.ts";
import {
    formatRecordingName,
    readRecordedMaterial,
    type RecordedMaterial,
} from "./recorded-material.ts";

/** One section the two reports do not print alike: a recording, or a whole report. */
export interface ReportDifference {
    name: string;
    /** Null where that side printed nothing under the name at all. */
    developLines: readonly string[] | null;
    rewriteLines: readonly string[] | null;
    /**
     * The lines `develop` printed and this branch did not, and the other way round, in the order
     * they stand: a line one side added moves no line under it into a difference.
     */
    changes: readonly LineChange[];
}

export const LINE_CHANGE = { removed: "removed", added: "added" } as const;
export type LineChangeKind = VocabularyWord<typeof LINE_CHANGE>;

/** One line only one side printed: removed is `develop`'s, added is this branch's. */
export interface LineChange {
    kind: LineChangeKind;
    line: string;
}

export interface ReportComparison {
    agreedNames: string[];
    differences: ReportDifference[];
}

const HEADING_OPEN = "=== ";
const HEADING_CLOSE = " ===";
/** Past the corpus by an order of magnitude: 35 recordings and 4571 lines, 2026-09-25. */
export const SECTIONS_MAXIMUM = 1_000;
export const LINES_MAXIMUM = 200_000;
/**
 * The cells a comparison of two sections may fill: the longest section either report prints runs
 * to a few hundred lines, so a pair past this is a report gone wrong rather than a fight.
 */
export const COMPARED_CELLS_MAXIMUM = 4_000_000;
/** Where `develop`'s tree is taken out to; `.cache/` is git's to ignore. */
const CACHE_DIRECTORY = ".cache";
/** Written last, so a tree cut short by a failure is taken out again rather than trusted. */
const COMPLETE_MARK = ".complete";
/** What its reports read: the configuration, the layers, the tools and the recordings. */
const DEVELOP_PATHS = ["deno.json", "deno.lock", "libs", "src", "frozen", "project", "tools"];
const DEVELOP_RECORDINGS = "captures";
const FIGURES_TASK = "fight:figures";
const DECODING_TASK = "fight:decoding";

/**
 * What `develop` prints for `task`, from its own tree taken out of git at `revision`. The
 * recordings go with it, read by its reader exactly as it reads them on its own branch.
 */
function readDevelopReport(revision: string, task: string): string {
    assert(revision.length > 0, "develop is read at a revision");
    assert(task.length > 0, "and by one of its tasks");
    const directory = `${CACHE_DIRECTORY}/develop-${revision}`;
    if (!readTreeComplete(directory)) {
        // Write the tree out afresh, so nothing a half-finished run left behind is read.
        const emptied = errors.attempt(() => emptyDirSync(directory));
        if (emptied instanceof errors.Caught) {
            throw new DevelopReportError(`${directory} cannot be emptied`, { cause: emptied });
        }
        const archive = `${directory}.tar`;
        runDevelopCommand("git", [
            "archive",
            "--output",
            archive,
            revision,
            ...DEVELOP_PATHS,
            DEVELOP_RECORDINGS,
        ]);
        runDevelopCommand("tar", ["-xf", archive, "-C", directory]);
        const removed = errors.attempt(() => Deno.removeSync(archive));
        if (removed instanceof errors.Caught) {
            throw new DevelopReportError(`${archive} cannot be removed`, { cause: removed });
        }
        const marked = errors.attempt(() =>
            Deno.writeTextFileSync(`${directory}/${COMPLETE_MARK}`, `${revision}\n`)
        );
        if (marked instanceof errors.Caught) {
            throw new DevelopReportError(`${directory} cannot be marked whole`, { cause: marked });
        }
        assert(readTreeComplete(directory), "a tree taken out is marked whole");
    }
    const output = errors.attempt(() =>
        new Deno.Command(Deno.execPath(), {
            args: ["task", "--quiet", task],
            cwd: directory,
            stdout: "piped",
            stderr: "piped",
        }).outputSync()
    );
    if (output instanceof errors.Caught) {
        throw new DevelopReportError(`develop's ${task} would not start`, { cause: output });
    }
    if (!output.success) {
        const said = new TextDecoder().decode(output.stderr);
        throw new DevelopReportError(`develop's ${task} exited ${output.code}: ${said}`);
    }
    const text = new TextDecoder().decode(output.stdout);
    assert(text.length > 0, "a report that ran says something");
    return text;
}

function readTreeComplete(directory: string): boolean {
    assert(directory.length > 0, "a tree is looked for somewhere");
    const mark = errors.attempt(() => Deno.statSync(`${directory}/${COMPLETE_MARK}`));
    if (!(mark instanceof Error)) return mark.isFile;
    if (mark.cause instanceof Deno.errors.NotFound) return false;
    throw new DevelopReportError(`${directory} cannot be looked at`, { cause: mark });
}

function runDevelopCommand(command: string, args: readonly string[]): void {
    assert(command.length > 0, "a subprocess is named");
    const output = errors.attempt(() =>
        new Deno.Command(command, { args: [...args], stderr: "piped" }).outputSync()
    );
    if (output instanceof errors.Caught) {
        throw new DevelopReportError(`${command} would not start`, { cause: output });
    }
    if (!output.success) {
        const said = new TextDecoder().decode(output.stderr);
        throw new DevelopReportError(`${command} ${args.join(" ")} answered: ${said}`);
    }
}

/** Two figures reports, held recording by recording. */
export function compareReportSections(developText: string, rewriteText: string): ReportComparison {
    return compareSectionMaps(indexReportSections(developText), indexReportSections(rewriteText));
}

function compareSectionMaps(
    develop: ReadonlyMap<string, readonly string[]>,
    rewrite: ReadonlyMap<string, readonly string[]>,
): ReportComparison {
    const names = [...new Set([...develop.keys(), ...rewrite.keys()])].sort();
    const comparison: ReportComparison = { agreedNames: [], differences: [] };
    for (const name of names) {
        const developLines = develop.get(name) ?? null;
        const rewriteLines = rewrite.get(name) ?? null;
        const changes = composeLineChanges(developLines ?? [], rewriteLines ?? []);
        // A side that printed nothing under the name differs, even from another nothing.
        let isAlike = changes.length === 0;
        if (developLines === null) isAlike = false;
        if (rewriteLines === null) isAlike = false;
        if (isAlike) comparison.agreedNames.push(name);
        else comparison.differences.push({ name, developLines, rewriteLines, changes });
    }
    assertStrictEquals(
        comparison.agreedNames.length + comparison.differences.length,
        names.length,
        "every section either report names is agreed or differs",
    );
    return comparison;
}

/**
 * The lines one side printed and the other did not, by the longest run of lines both print in
 * order. `@std` keeps its line diff in `@std/internal`, which is no package to depend on.
 */
function composeLineChanges(
    developLines: readonly string[],
    rewriteLines: readonly string[],
): LineChange[] {
    const developCount = developLines.length;
    const rewriteCount = rewriteLines.length;
    assert(developCount <= LINES_MAXIMUM, "both reports were read inside the bound on lines");
    assert(rewriteCount <= LINES_MAXIMUM, "both of them");
    if ((developCount + 1) * (rewriteCount + 1) > COMPARED_CELLS_MAXIMUM) {
        throw new DevelopReportError(
            `a section of ${developCount} lines against ${rewriteCount} is past the ` +
                `${COMPARED_CELLS_MAXIMUM} cells a comparison fills`,
        );
    }
    // How many lines from each pair of places on run alike in order, filled from the ends back.
    const commonAfter: Int32Array[] = [];
    for (let developIndex = 0; developIndex <= developCount; developIndex += 1) {
        commonAfter.push(new Int32Array(rewriteCount + 1));
    }
    for (let developIndex = developCount - 1; developIndex >= 0; developIndex -= 1) {
        const row = commonAfter[developIndex];
        const below = commonAfter[developIndex + 1];
        assert(row !== undefined, "a row stands for every place on develop's side");
        assert(below !== undefined, "and one past its last line");
        for (let rewriteIndex = rewriteCount - 1; rewriteIndex >= 0; rewriteIndex -= 1) {
            row[rewriteIndex] = developLines[developIndex] === rewriteLines[rewriteIndex]
                ? (below[rewriteIndex + 1] ?? 0) + 1
                : Math.max(below[rewriteIndex] ?? 0, row[rewriteIndex + 1] ?? 0);
        }
    }
    const changes: LineChange[] = [];
    let developIndex = 0;
    let rewriteIndex = 0;
    for (let look = 0; look < developCount + rewriteCount; look += 1) {
        const developLine = developLines[developIndex];
        const rewriteLine = rewriteLines[rewriteIndex];
        if (developLine === undefined) {
            if (rewriteLine === undefined) break;
            changes.push({ kind: LINE_CHANGE.added, line: rewriteLine });
            rewriteIndex += 1;
            continue;
        }
        if (rewriteLine === undefined) {
            changes.push({ kind: LINE_CHANGE.removed, line: developLine });
            developIndex += 1;
            continue;
        }
        if (developLine === rewriteLine) {
            developIndex += 1;
            rewriteIndex += 1;
            continue;
        }
        const keptByRemoving = commonAfter[developIndex + 1]?.[rewriteIndex] ?? 0;
        const keptByAdding = commonAfter[developIndex]?.[rewriteIndex + 1] ?? 0;
        if (keptByRemoving >= keptByAdding) {
            changes.push({ kind: LINE_CHANGE.removed, line: developLine });
            developIndex += 1;
        } else {
            changes.push({ kind: LINE_CHANGE.added, line: rewriteLine });
            rewriteIndex += 1;
        }
    }
    assert(developIndex === developCount, "every line of develop's was walked");
    assert(rewriteIndex === rewriteCount, "and every line of this branch's");
    return changes;
}

/** Two reports with no sections, held as one text under the task that printed them. */
export function compareWholeReports(
    name: string,
    developText: string,
    rewriteText: string,
): ReportComparison {
    assert(name.length > 0, "a whole report is named for the task that printed it");
    const develop = new Map([[name, splitReportLines(developText)]]);
    const rewrite = new Map([[name, splitReportLines(rewriteText)]]);
    return compareSectionMaps(develop, rewrite);
}

/** The lines of a text, the blank ones a printer ends on left out. */
function splitReportLines(text: string): string[] {
    const lines = parseReportLines(text);
    while (lines.at(-1) === "") lines.pop();
    return lines;
}

/** A report's lines, refused past the bound: a printer running away is not a report. */
function parseReportLines(text: string): string[] {
    const lines = text.split("\n");
    if (lines.length > LINES_MAXIMUM) {
        throw new DevelopReportError(
            `a report of ${lines.length} lines, past the ${LINES_MAXIMUM} read`,
        );
    }
    return lines;
}

/**
 * A report cut at its headings. What stands above the first — the material it was taken on — is
 * no recording's, and the blank line closing a section is the next heading's.
 */
export function indexReportSections(text: string): Map<string, string[]> {
    const lines = parseReportLines(text);
    const sections = new Map<string, string[]>();
    let openSection: string[] | null = null;
    for (const line of lines) {
        const name = lookupHeadingName(line);
        if (name !== null) {
            if (sections.has(name)) throw new DevelopReportError(`${name} is reported twice`);
            openSection = [];
            sections.set(name, openSection);
        } else if (openSection !== null) openSection.push(line);
    }
    for (const section of sections.values()) {
        while (section.at(-1) === "") section.pop();
    }
    if (sections.size > SECTIONS_MAXIMUM) {
        throw new DevelopReportError(
            `a report of ${sections.size} sections, past the ${SECTIONS_MAXIMUM} read`,
        );
    }
    return sections;
}

function lookupHeadingName(line: string): string | null {
    if (!line.startsWith(HEADING_OPEN)) return null;
    if (!line.endsWith(HEADING_CLOSE)) return null;
    const name = line.slice(HEADING_OPEN.length, line.length - HEADING_CLOSE.length);
    return name.length > 0 ? name : null;
}

/** What a terminal is shown: each difference with the lines over it, then the count. */
export function formatComparison(caption: string, comparison: ReportComparison): string[] {
    assert(caption.length > 0, "a comparison is shown under the task it compared");
    const lines: string[] = [];
    for (const difference of comparison.differences) {
        lines.push(...formatDifferenceLines(difference));
    }
    lines.push(
        `${caption}: ${formatInteger(comparison.agreedNames.length)} agree, ` +
            `${formatInteger(comparison.differences.length)} differ`,
    );
    assert(lines.length > comparison.differences.length, "every difference is shown");
    return lines;
}

function formatDifferenceLines(difference: ReportDifference): string[] {
    const heading = `≠ ${difference.name}`;
    if (difference.developLines === null) return [heading, "  develop prints nothing for it"];
    if (difference.rewriteLines === null) return [heading, "  this branch prints nothing for it"];
    const removed = difference.changes.filter((change) => change.kind === LINE_CHANGE.removed);
    const lines = [
        `${heading}, ${formatInteger(removed.length)} lines only develop prints, ` +
        `${formatInteger(difference.changes.length - removed.length)} only this branch`,
    ];
    for (const change of difference.changes) {
        lines.push(`  ${change.kind === LINE_CHANGE.removed ? "-" : "+"} ${change.line}`);
    }
    assert(lines.length === difference.changes.length + 1, "every change is a line of its own");
    return lines;
}

/**
 * The recordings `develop` reported on, out of the ones in the tree: a recording admitted since
 * that revision is one `develop` never read, and is named apart rather than counted as a
 * difference.
 */
export function selectDevelopMaterial(
    material: RecordedMaterial,
    developNames: ReadonlySet<string>,
): { shared: RecordedMaterial; newer: string[] } {
    assert(developNames.size <= SECTIONS_MAXIMUM, "develop reported on a bounded material");
    const shared = material.fights.filter((fight) =>
        developNames.has(formatRecordingName(fight.path))
    );
    const newer = material.fights
        .filter((fight) => !developNames.has(formatRecordingName(fight.path)))
        .map((fight) => formatRecordingName(fight.path));
    assertStrictEquals(
        shared.length + newer.length,
        material.fights.length,
        "each is one or other",
    );
    return { shared: { material: material.material, fights: shared }, newer };
}

if (import.meta.main) {
    const developFigures = readDevelopReport(DEVELOP_REVISION, FIGURES_TASK);
    const developNames = new Set(indexReportSections(developFigures).keys());
    const chosen = selectDevelopMaterial(readRecordedMaterial([]), developNames);
    const figures = compareReportSections(developFigures, formatMaterialFigures(chosen.shared));
    const decoding = compareWholeReports(
        DECODING_TASK,
        readDevelopReport(DEVELOP_REVISION, DECODING_TASK),
        formatMaterialStatus(chosen.shared),
    );
    for (const name of chosen.newer) console.log(`+ ${name}: admitted since ${DEVELOP_REVISION}`);
    for (const line of formatComparison(FIGURES_TASK, figures)) console.log(line);
    for (const line of formatComparison(DECODING_TASK, decoding)) console.log(line);
    const differ = figures.differences.length + decoding.differences.length;
    if (differ > 0) Deno.exitCode = 1;
}
