/**
 * Every path a document or a comment cites, against the tree it cites into: this one, or the
 * revision a `develop:` or `git show` span names. A stale citation renders as a path, reads as a
 * fact and sends whoever follows it nowhere, and nothing compiles a sentence that would catch it.
 *
 * ⚠️ **Only a rooted path is a citation.** A module named by its layer (`core/fight-decoder.ts`) or
 * by its file alone (`panel-look.ts`) is prose about a module, and a reader taking those would flag
 * sentences that are not wrong — which is how a guard gets turned off.
 */

import { assert, assertEquals } from "@std/assert";
import { existsSync } from "@std/fs";
import { DEVELOP_REVISION } from "#/tests/recording-sources.ts";
import {
    composeSample,
    readCommentTexts,
    readSourceFiles,
    SOURCE_DIRECTORIES,
} from "#/tests/source-tree.ts";

interface Citation {
    path: string;
    document: string;
    revision: string | null; // null: this tree
}

/** A citation starts at one of these, which is what makes it a path rather than a name. */
const ROOTS = [
    ".agents/",
    ".github/",
    "captures/",
    "design/",
    "docs/",
    "fabricated/",
    "frozen/",
    "libs/",
    "project/",
    "screenshots/",
    "src/",
    "tests/",
    "tools/",
];
const ENDINGS = [".ts", ".md", ".json", ".js", ".yml", ".html", ".png"];
const SPAN_MARK = "`";
/** `AGENTS.md`'s spelling of a path in `develop` as it stood when this tree replaced it. */
const DEVELOP_MARK = "develop:";
const HISTORY_MARK = "git show ";
/** What separates the revision from the path inside a `git show` span, as `git` reads it. */
const HISTORY_SPLIT = ":";
/** What a revision carries when the shell works it out rather than a person writing it down. */
const SHELL_MARK = "$";
/** The maintainer's own list: it names what was, and no tool here reads it for the tree. */
const HAND_KEPT_LIST = "TODO.md";
const PLACE_MARK = " → ";

/**
 * A citation of a path that is absent on purpose, as `document → path`. Every entry is a decision
 * record, which states the tree on the day it was decided: the files that decision removed, and a
 * file in another repository. Each says only what is its own, because a list nobody has to justify
 * grows until it is the rule.
 */
const CITED_WHILE_ABSENT = [
    // TigerStyle's own file, in `tigerbeetle/tigerbeetle`.
    "docs/adr/0003-a-module-reads-top-down-in-tigerbeetles-order.md → docs/TIGER_STYLE.md",
    // The pin ADR 0005 removed, and the module that named the revision before `captures/` came in.
    "docs/adr/0004-the-frozen-readings-are-develops-at-the-revision.md → " +
    "tests/repository/frozen-readings.test.ts",
    "docs/adr/0004-the-frozen-readings-are-develops-at-the-revision.md → " +
    "tests/recording-revision.ts",
    // The pin this decision removed, and `develop`'s register, which it declined to port.
    "docs/adr/0005-the-readings-are-refreshed-here.md → tests/repository/frozen-readings.test.ts",
    "docs/adr/0005-the-readings-are-refreshed-here.md → docs/protocol-keys.md",
];

/**
 * The reader proved on a sample it must flag and one it must not: the first catches a reader that
 * has stopped finding its subject, and only the second catches one that finds too much.
 */
Deno.test("a rooted path is read as a citation, and a bare module name is not", () => {
    const read = readCitations("sample", "see `src/core/fight-decoder.ts` and `core/a.ts`");
    assertEquals(read.map((one) => one.path), ["src/core/fight-decoder.ts"], "the rooted one only");
    assertEquals(read.map((one) => one.revision), [null], "and it is read against this tree");
    assertEquals(readCitations("sample", "`utils.ts` is never created here"), [], "nor a name");
    assertEquals(readCitations("sample", "src/core/fight-decoder.ts"), [], "nor an unquoted path");
    assertEquals(readCitations("sample", "`src/core/` holds it"), [], "nor a directory");
    assertEquals(readCitations("sample", "`src/a.ts b`"), [], "nor a span with words in it");
});

/** Every citation in a text, walking its backticked spans: this repository quotes every path. */
function readCitations(document: string, text: string): Citation[] {
    const found: Citation[] = [];
    let at = 0;
    for (let count = 0;; count += 1) {
        assert(
            count <= text.length,
            "a walk passes two marks at every step, so the text bounds it",
        );
        const opened = text.indexOf(SPAN_MARK, at);
        if (opened === -1) return found;
        const closed = text.indexOf(SPAN_MARK, opened + 1);
        if (closed === -1) return found;
        at = closed + 1;
        const citation = readCitationsSpan(document, text.slice(opened + 1, closed));
        if (citation !== null) found.push(citation);
    }
}

/** The citation one span makes, or null where it names no path this guard could follow. */
function readCitationsSpan(document: string, span: string): Citation | null {
    if (span.startsWith(HISTORY_MARK)) return readCitationsSpanHistory(document, span);
    if (span.includes(" ")) return null;
    if (span.startsWith(DEVELOP_MARK)) {
        const path = span.slice(DEVELOP_MARK.length);
        return isRootedPath(path) ? { path, document, revision: DEVELOP_REVISION } : null;
    }
    return isRootedPath(span) ? { path: span, document, revision: null } : null;
}

function isRootedPath(text: string): boolean {
    if (!ROOTS.some((root) => text.startsWith(root))) return false;
    return ENDINGS.some((ending) => text.endsWith(ending));
}

/** `git show <revision>:<path>`, whole inside one span, read as the path at that revision. */
function readCitationsSpanHistory(document: string, span: string): Citation | null {
    const asked = span.slice(HISTORY_MARK.length);
    const split = asked.indexOf(HISTORY_SPLIT);
    if (split === -1) return null;
    const revision = asked.slice(0, split);
    const path = asked.slice(split + 1);
    if (revision.length === 0) return null;
    // A revision the shell computes resolves to nothing here, and `docs/releasing.md` spells its
    // audit step that way on purpose: a tag written there is right for one release only.
    if (revision.includes(SHELL_MARK)) return null;
    if (revision.includes(" ")) return null;
    return isRootedPath(path) ? { path, document, revision } : null;
}

Deno.test("a citation into history is read against the revision it names", () => {
    const develop = readCitations("sample", "as `develop:src/ui/panel-look.ts` drew it");
    assertEquals(develop.map((one) => one.revision), [DEVELOP_REVISION], "develop is fa1dcce");
    assertEquals(develop.map((one) => one.path), ["src/ui/panel-look.ts"], "without its mark");
    const shown = readCitations("sample", "see `git show v0.10.1:src/ui/panel-look.ts` today");
    assertEquals(shown.map((one) => one.revision), ["v0.10.1"], "the revision it names");
    assertEquals(shown.map((one) => one.path), ["src/ui/panel-look.ts"], "and the path at it");
    assertEquals(readCitations("sample", "`git show v0.10.1` and `git status`"), [], "no path");
    assertEquals(readCitations("sample", "`develop:path` names develop"), [], "nor a placeholder");
    const computed = readCitations("sample", '`git show "$(git describe main):docs/a.md"`');
    assertEquals(computed, [], "nor a revision the shell works out");
});

/** A comment is prose and is read; a template literal is code, and the same marks mean nothing. */
Deno.test("a comment of a source file is read, and its code is not", () => {
    const sample = composeSample([
        "/** Measured by `tools/a.ts`. */",
        "const shown = `src/b.ts`;",
        "// Held by `tests/c.ts`.",
    ]);
    const read = readCitations(sample.path, readCommentTexts(sample).join("\n"));
    assertEquals(read.map((one) => one.path), ["tools/a.ts", "tests/c.ts"], "the comments only");
});

Deno.test("every path this tree is cited for is in it, or is one this file excuses", () => {
    const tracked = readTrackedPaths();
    const dangling: string[] = [];
    for (const citation of readEveryCitation()) {
        if (citation.revision !== null) continue;
        if (tracked.has(citation.path)) continue;
        const place = formatCitation(citation);
        if (!CITED_WHILE_ABSENT.includes(place)) dangling.push(place);
    }
    assertEquals(dangling, [], "a citation renders as a path and sends a reader nowhere");
});

/** Every document and every source file's comments, read once for all the cases below. */
function readEveryCitation(): Citation[] {
    const found: Citation[] = [];
    for (const path of readGitLines(["ls-files", "*.md"])) {
        if (path === HAND_KEPT_LIST) continue;
        found.push(...readCitations(path, Deno.readTextFileSync(path)));
    }
    for (const file of readSourceFiles(SOURCE_DIRECTORIES)) {
        found.push(...readCitations(file.path, readCommentTexts(file).join("\n")));
    }
    assert(found.length > 0, "an empty reading of the tree is a finding, not a pass");
    return found;
}

function readGitLines(args: string[]): string[] {
    const asked = new Deno.Command("git", { args, stdout: "piped" }).outputSync();
    assert(asked.success, `git ${args.join(" ")} answers`);
    return new TextDecoder().decode(asked.stdout).split("\n").filter((line) => line !== "");
}

/** What git tracks and the disk still holds: CI sees only the first, a reader only the second. */
function readTrackedPaths(): Set<string> {
    const tracked = readGitLines(["ls-files"]).filter((path) => existsSync(path, { isFile: true }));
    assert(tracked.length > 0, "the tree tracks files");
    return new Set(tracked);
}

function formatCitation(citation: Citation): string {
    return citation.document + PLACE_MARK + citation.path;
}

/**
 * A citation into history goes as quietly wrong as one into the tree, and `develop` is where a
 * reader goes for the evidence of every rule carried over.
 */
Deno.test("every path cited at a revision is there at that revision", () => {
    const history = readEveryCitation().filter((citation) => citation.revision !== null);
    assert(history.length > 0, "the tree cites history, and it was read");
    const dangling: string[] = [];
    for (const citation of history) {
        const asked = new Deno.Command("git", {
            args: ["cat-file", "-e", `${citation.revision}:${citation.path}`],
            stderr: "null",
        }).outputSync();
        if (!asked.success) dangling.push(`${formatCitation(citation)} @ ${citation.revision}`);
    }
    assertEquals(dangling, [], "a citation renders as history and answers with nothing");
});

/**
 * The list from the other end. An entry that starts existing, or stops being cited, is an entry
 * nothing holds any more — and a list nobody prunes is how the exception becomes the rule.
 */
Deno.test("every citation this file excuses is still absent, and still made", () => {
    assert(CITED_WHILE_ABSENT.length > 0, "the list is read rather than assumed empty");
    const tracked = readTrackedPaths();
    const made = new Set(
        readEveryCitation().filter((one) => one.revision === null).map(formatCitation),
    );
    for (const place of CITED_WHILE_ABSENT) {
        const path = place.slice(place.indexOf(PLACE_MARK) + PLACE_MARK.length);
        assert(!tracked.has(path), `${path} is in the tree now and no longer needs excusing`);
        assert(made.has(place), `${place} is no longer cited`);
    }
});
