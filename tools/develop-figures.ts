/**
 * `docs/design.md` §12's proof, run by hand: the figures report `develop` prints at
 * `RECORDINGS_REVISION`, from its own tree and its own tool, against the one this branch prints,
 * recording by recording. A difference is a finding in one of the two, never an expectation to
 * move (`AGENTS.md` W8). It stays out of the gate because it runs another branch's program.
 *
 *     deno task fight:develop
 */

import { assert, assertStrictEquals } from "@std/assert";
import { emptyDirSync } from "@std/fs";
import { formatInteger } from "#/libs/number-text.ts";
import { RECORDINGS_REVISION } from "#/tests/recording-revision.ts";
import { formatRecordedFigures } from "./fight-figures.ts";
import { DevelopReportError } from "./margometer-tool-error.ts";

/** One recording the two reports do not print alike. */
export interface FigureDifference {
    name: string;
    /** Null where that side printed no report for the recording at all. */
    developLines: readonly string[] | null;
    rewriteLines: readonly string[] | null;
    /** The first line the two differ on; the shorter report's length where one runs out. */
    lineIndex: number;
}

export interface FigureComparison {
    agreedNames: string[];
    differences: FigureDifference[];
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
/** What its `fight:figures` reads: the configuration, the layers, and the recordings. */
const DEVELOP_PATHS = ["deno.json", "deno.lock", "libs", "src", "frozen", "project", "tools"];
const DEVELOP_RECORDINGS = "captures";

/** Two whole reports, held recording by recording. */
export function compareFigureReports(developText: string, rewriteText: string): FigureComparison {
    const develop = indexReportSections(developText);
    const rewrite = indexReportSections(rewriteText);
    const names = [...new Set([...develop.keys(), ...rewrite.keys()])].sort();
    const comparison: FigureComparison = { agreedNames: [], differences: [] };
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
        "every recording either report names is agreed or differs",
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
        "a report stays inside the recordings it is bounded to",
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
export function formatComparison(comparison: FigureComparison): string[] {
    const lines: string[] = [];
    for (const difference of comparison.differences) {
        lines.push(...formatDifferenceLines(difference));
    }
    lines.push(
        `${formatInteger(comparison.agreedNames.length)} recordings agree, ` +
            `${formatInteger(comparison.differences.length)} differ`,
    );
    assert(lines.length > comparison.differences.length, "every difference is shown");
    return lines;
}

function formatDifferenceLines(difference: FigureDifference): string[] {
    const heading = `≠ ${difference.name}`;
    if (difference.developLines === null) return [heading, "  develop prints no report for it"];
    if (difference.rewriteLines === null) return [heading, "  this branch prints no report for it"];
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
 * What `develop` prints, from its own tree taken out of git at `revision` and its own task. The
 * recordings go with it, read by its reader exactly as it reads them on its own branch.
 */
export function readDevelopReport(revision: string): string {
    assert(revision.length > 0, "develop is read at a revision");
    const directory = `${CACHE_DIRECTORY}/develop-${revision}`;
    if (!isTreeComplete(directory)) writeDevelopTree(revision, directory);
    const output = new Deno.Command(Deno.execPath(), {
        args: ["task", "--quiet", "fight:figures"],
        cwd: directory,
        stdout: "piped",
        stderr: "piped",
    }).outputSync();
    if (!output.success) {
        const said = new TextDecoder().decode(output.stderr);
        throw new DevelopReportError(`develop's fight:figures exited ${output.code}: ${said}`);
    }
    const text = new TextDecoder().decode(output.stdout);
    assert(text.length > 0, "a report that ran says something");
    return text;
}

function isTreeComplete(directory: string): boolean {
    assert(directory.length > 0, "a tree is looked for somewhere");
    try {
        return Deno.statSync(`${directory}/${COMPLETE_MARK}`).isFile;
    } catch (cause) {
        if (cause instanceof Deno.errors.NotFound) return false;
        throw new DevelopReportError(`${directory} cannot be looked at`, { cause });
    }
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
    const comparison = compareFigureReports(
        readDevelopReport(RECORDINGS_REVISION),
        formatRecordedFigures([]),
    );
    for (const line of formatComparison(comparison)) console.log(line);
    if (comparison.differences.length > 0) Deno.exitCode = 1;
}
