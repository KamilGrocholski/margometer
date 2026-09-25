/**
 * `docs/design.md` §12's proof, run by hand: the reports `develop` prints at `RECORDINGS_REVISION`,
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
import { callForeign } from "#/libs/result.ts";
import { RECORDINGS_REVISION } from "#/tests/recording-revision.ts";
import { formatDecodingStatus } from "./decoding-status.ts";
import { formatRecordedFigures } from "./fight-figures.ts";
import { DevelopReportError } from "./margometer-tool-error.ts";

/** One section the two reports do not print alike: a recording, or a whole report. */
export interface ReportDifference {
    name: string;
    /** Null where that side printed nothing under the name at all. */
    developLines: readonly string[] | null;
    rewriteLines: readonly string[] | null;
    /** The first line the two differ on; the shorter one's length where one runs out. */
    lineIndex: number;
}

export interface ReportComparison {
    agreedNames: string[];
    differences: ReportDifference[];
}

const HEADING_OPEN = "=== ";
const HEADING_CLOSE = " ===";
/** Past the corpus by an order of magnitude: 35 recordings and 4571 lines, 2026-09-25. */
const SECTIONS_MAXIMUM = 1_000;
const LINES_MAXIMUM = 200_000;
const CONTEXT_LINES = 3;
/** Where `develop`'s tree is taken out to; `.cache/` is git's to ignore. */
const CACHE_DIRECTORY = ".cache";
/** Written last, so a tree cut short by a failure is taken out again rather than trusted. */
const COMPLETE_MARK = ".complete";
/** What its reports read: the configuration, the layers, the tools and the recordings. */
const DEVELOP_PATHS = ["deno.json", "deno.lock", "libs", "src", "frozen", "project", "tools"];
const DEVELOP_RECORDINGS = "captures";
const FIGURES_TASK = "fight:figures";
const DECODING_TASK = "fight:decoding";

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
        const lineIndex = lookupFirstDifference(developLines, rewriteLines);
        if (lineIndex === null) comparison.agreedNames.push(name);
        else comparison.differences.push({ name, developLines, rewriteLines, lineIndex });
    }
    assertStrictEquals(
        comparison.agreedNames.length + comparison.differences.length,
        names.length,
        "every section either report names is agreed or differs",
    );
    return comparison;
}

/** Null where the two are alike line for line; zero where one side has nothing to compare. */
function lookupFirstDifference(
    developLines: readonly string[] | null,
    rewriteLines: readonly string[] | null,
): number | null {
    if (developLines === null) return 0;
    if (rewriteLines === null) return 0;
    const shorter = Math.min(developLines.length, rewriteLines.length);
    for (let index = 0; index < shorter; index += 1) {
        if (developLines[index] !== rewriteLines[index]) return index;
    }
    if (developLines.length === rewriteLines.length) return null;
    return shorter;
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
    const lines = text.split("\n");
    assert(lines.length <= LINES_MAXIMUM, "a report stays inside the lines it is bounded to");
    while (lines.at(-1) === "") lines.pop();
    return lines;
}

/**
 * A report cut at its headings. What stands above the first — the material it was taken on — is
 * no recording's, and the blank line closing a section is the next heading's.
 */
export function indexReportSections(text: string): Map<string, string[]> {
    const lines = text.split("\n");
    assert(lines.length <= LINES_MAXIMUM, "a report stays inside the lines it is bounded to");
    const sections = new Map<string, string[]>();
    let current: string[] | null = null;
    for (const line of lines) {
        const name = lookupHeadingName(line);
        if (name !== null) {
            assertStrictEquals(sections.has(name), false, `${name} is reported once`);
            current = [];
            sections.set(name, current);
        } else if (current !== null) current.push(line);
    }
    for (const section of sections.values()) {
        while (section.at(-1) === "") section.pop();
    }
    assert(
        sections.size <= SECTIONS_MAXIMUM,
        "a report stays inside the sections it is bounded to",
    );
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
    const start = Math.max(0, difference.lineIndex - CONTEXT_LINES);
    const context = difference.developLines.slice(start, difference.lineIndex);
    const lines = [
        `${heading}, line ${formatInteger(difference.lineIndex + 1)} of its report`,
        ...context.map((line) => `    ${line}`),
        `  - ${difference.developLines[difference.lineIndex] ?? "(develop's report ends)"}`,
        `  + ${difference.rewriteLines[difference.lineIndex] ?? "(this branch's report ends)"}`,
    ];
    assert(context.length <= CONTEXT_LINES, "the context is the lines just over the difference");
    return lines;
}

/**
 * What `develop` prints for `task`, from its own tree taken out of git at `revision`. The
 * recordings go with it, read by its reader exactly as it reads them on its own branch.
 */
export function readDevelopReport(revision: string, task: string): string {
    assert(revision.length > 0, "develop is read at a revision");
    assert(task.length > 0, "and by one of its tasks");
    const directory = `${CACHE_DIRECTORY}/develop-${revision}`;
    if (!isTreeComplete(directory)) writeDevelopTree(revision, directory);
    const output = new Deno.Command(Deno.execPath(), {
        args: ["task", "--quiet", task],
        cwd: directory,
        stdout: "piped",
        stderr: "piped",
    }).outputSync();
    if (!output.success) {
        const said = new TextDecoder().decode(output.stderr);
        throw new DevelopReportError(`develop's ${task} exited ${output.code}: ${said}`);
    }
    const text = new TextDecoder().decode(output.stdout);
    assert(text.length > 0, "a report that ran says something");
    return text;
}

function isTreeComplete(directory: string): boolean {
    assert(directory.length > 0, "a tree is looked for somewhere");
    const mark = callForeign(() => Deno.statSync(`${directory}/${COMPLETE_MARK}`));
    if (mark.ok) return mark.value.isFile;
    if (mark.error.cause instanceof Deno.errors.NotFound) return false;
    throw new DevelopReportError(`${directory} cannot be looked at`, { cause: mark.error.cause });
}

/** Taken out afresh, so nothing a half-finished run left behind is read. */
function writeDevelopTree(revision: string, directory: string): void {
    assert(revision.length > 0, "a tree is taken out at a revision");
    emptyDirSync(directory);
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
    Deno.removeSync(archive);
    Deno.writeTextFileSync(`${directory}/${COMPLETE_MARK}`, `${revision}\n`);
    assert(isTreeComplete(directory), "a tree taken out is marked whole");
}

function runDevelopCommand(command: string, args: readonly string[]): void {
    assert(command.length > 0, "a subprocess is named");
    const output = new Deno.Command(command, { args: [...args], stderr: "piped" }).outputSync();
    if (!output.success) {
        const said = new TextDecoder().decode(output.stderr);
        throw new DevelopReportError(`${command} ${args.join(" ")} answered: ${said}`);
    }
}

if (import.meta.main) {
    const figures = compareReportSections(
        readDevelopReport(RECORDINGS_REVISION, FIGURES_TASK),
        formatRecordedFigures([]),
    );
    const decoding = compareWholeReports(
        DECODING_TASK,
        readDevelopReport(RECORDINGS_REVISION, DECODING_TASK),
        formatDecodingStatus([]),
    );
    for (const line of formatComparison(FIGURES_TASK, figures)) console.log(line);
    for (const line of formatComparison(DECODING_TASK, decoding)) console.log(line);
    const differ = figures.differences.length + decoding.differences.length;
    if (differ > 0) Deno.exitCode = 1;
}
