/**
 * Every path a document cites, against the tree it cites into.
 *
 * A stale citation is the quietest kind of wrong: it renders as a path, reads as a fact, and sends
 * whoever follows it nowhere. Nothing else here catches one — a document is not compiled.
 *
 * ⚠️ **Only a rooted path is a citation.** This repository also names a module by its layer
 * (`core/fight-decoder.ts`) or by its file alone (`panel-look.ts`), and both are prose about a
 * module rather than a path into the tree. A guard reading those would flag some thirty sentences
 * that are not wrong, which is how a guard gets turned off.
 */

import { assert, assertEquals } from "@std/assert";
import { existsSync } from "@std/fs";

/** A citation starts at one of these, which is what makes it a path rather than a name. */
const ROOTED_AT = [
    ".agents/",
    ".github/",
    "captures/",
    "docs/",
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
/**
 * How a citation into this repository's own history is written: `git show <ref>:<path>`, whole,
 * inside one span. v1 is readable there and absent here, so a path inside one is not a path into
 * this tree — it is held against the history instead, by the reader below.
 */
const HISTORY_MARK = "git show ";
/** What separates the ref from the path inside such a span, as `git` itself reads it. */
const HISTORY_SPLIT = ":";
/** What a ref carries when the shell works it out rather than a person writing it down. */
const SHELL_MARK = "$";

/**
 * A path a document names on purpose while it does not exist. Every entry is an ADR, and the
 * reason is one: an ADR is a dated snapshot, never edited to agree with the tree it now sits in
 * (`docs/adr/README.md`). Said once here, so the next entry is not another copy of it; each says
 * only what is its own, because a list nobody has to justify grows until it is the rule.
 */
const CITED_WHILE_ABSENT: Record<string, string> = {
    // The address ADR 0020 moved this file from.
    "src/core/unknown-reading.ts": "docs/adr/0020-a-shared-address-for-what-knows-nothing.md",
    // The module accumulating one fight; `src/game/fight-underway.ts` since `battle` and `session`
    // were read off **Fight**'s `_Avoid_` list.
    "src/game/battle-session.ts": "docs/adr/0017-the-panel-is-served-and-published.md",
    // The tool that decision replaced, named in the past tense.
    "tools/build-preview.ts": "docs/adr/0017-the-panel-is-served-and-published.md",
    // The module ADR 0046's suite launched a browser through; ADR 0047 replaced that suite.
    "tools/installed-browser.ts": "docs/adr/0046-the-browser-layer-is-a-suite-of-its-own.md",
    // Two recordings under the names they were filed as before ADR 0030 renamed every one of them.
    "captures/2026-08-06-tempest-grupa-vs-hildur.json":
        "docs/adr/0022-a-tick-belongs-to-the-wound-that-is-ticking.md",
    "captures/2026-08-15-tempest-grupa-vs-hildur-3.json":
        "docs/adr/0022-a-tick-belongs-to-the-wound-that-is-ticking.md",
};

function getDocumentPaths(): string[] {
    const listed = new TextDecoder().decode(
        new Deno.Command("git", { args: ["ls-files", "*.md"] }).outputSync().stdout,
    );
    const paths = listed.split("\n").filter((one) => one !== "" && one !== "TODO.md");
    assert(paths.length > 0, "there are documents to read");
    return paths;
}

interface Citation {
    path: string;
    document: string;
}

/** Backticked spans only: this repository writes every path it means as a path inside one. */
function getCitations(document: string, source: string): Citation[] {
    const found: Citation[] = [];
    let at = 0;
    for (let guard = 0; guard < source.length; guard += 1) {
        const opened = source.indexOf(SPAN_MARK, at);
        if (opened === -1) break;
        const closed = source.indexOf(SPAN_MARK, opened + 1);
        if (closed === -1) break;
        const span = source.slice(opened + 1, closed);
        at = closed + 1;
        if (span.startsWith(HISTORY_MARK)) continue;
        if (span.includes(" ")) continue;
        if (!ROOTED_AT.some((root) => span.startsWith(root))) continue;
        if (!ENDINGS.some((ending) => span.endsWith(ending))) continue;
        found.push({ path: span, document });
    }
    return found;
}

interface HistoryCitation {
    reference: string;
    path: string;
    document: string;
}

/** The same spans the reader above skips, read for what they do point at. */
function getHistoryCitations(document: string, source: string): HistoryCitation[] {
    const found: HistoryCitation[] = [];
    let at = 0;
    for (let guard = 0; guard < source.length; guard += 1) {
        const opened = source.indexOf(SPAN_MARK, at);
        if (opened === -1) break;
        const closed = source.indexOf(SPAN_MARK, opened + 1);
        if (closed === -1) break;
        const span = source.slice(opened + 1, closed);
        at = closed + 1;
        if (!span.startsWith(HISTORY_MARK)) continue;
        const asked = span.slice(HISTORY_MARK.length);
        const split = asked.indexOf(HISTORY_SPLIT);
        if (split === -1) continue;
        const reference = asked.slice(0, split);
        const path = asked.slice(split + 1);
        if (reference.length === 0) continue;
        if (path.length === 0) continue;
        // A ref the shell computes is not one a reader can resolve, and `docs/releasing.md`
        // spells its audit step that way on purpose: the tag is asked for rather than written,
        // because a number written there is right for one release and wrong for every one after.
        if (reference.includes(SHELL_MARK)) continue;
        if (reference.includes(" ")) continue;
        found.push({ reference, path, document });
    }
    return found;
}

function getEveryCitation(): Citation[] {
    const found: Citation[] = [];
    for (const document of getDocumentPaths()) {
        found.push(...getCitations(document, Deno.readTextFileSync(document)));
    }
    assert(found.length > 0, "an empty reading of the documents is a finding, not a pass");
    return found;
}

const CITED = getEveryCitation();

function getEveryHistoryCitation(): HistoryCitation[] {
    const found: HistoryCitation[] = [];
    for (const document of getDocumentPaths()) {
        found.push(...getHistoryCitations(document, Deno.readTextFileSync(document)));
    }
    return found;
}

const CITED_IN_HISTORY = getEveryHistoryCitation();

/**
 * The reader proved on a sample it must flag and one it must not: the first catches a reader that
 * has stopped finding its subject, and only the second catches one that finds too much.
 */
Deno.test("a rooted path is read as a citation, and a bare module name is not", () => {
    const read = getCitations(
        "sample",
        "see `src/core/fight-decoder.ts` and `core/battle-event.ts`",
    );
    assertEquals(read.map((one) => one.path), ["src/core/fight-decoder.ts"], "the rooted one only");
    assertEquals(getCitations("sample", "`utils.ts` is never created here"), [], "nor a bare name");
    assertEquals(getCitations("sample", "src/core/fight-decoder.ts"), [], "nor an unquoted path");
});

/** v1 is readable and absent, so a path inside one of these is not a path into this tree. */
Deno.test("a citation into v1's history is not read as a path at all", () => {
    const whole = getCitations("sample", "at `git show v0.10.1:tools/fight-report.ts` today");
    assertEquals(whole, [], "the reference and its path are one span, and the span is skipped");
});

/**
 * The same reader on both samples: a span that is a reference into the history is read as one,
 * and a span merely opening with the same words is not. A reference with no path after the ref
 * says nothing a reader could follow, so it is not one either.
 */
Deno.test("a reference into the history is read, and one that looks like it is not", () => {
    const read = getHistoryCitations(
        "sample",
        "see `git show v0.10.1:src/ui/panel-look.ts` and `git status` today",
    );
    assertEquals(read.map((one) => one.reference), ["v0.10.1"], "the reference it names");
    assertEquals(read.map((one) => one.path), ["src/ui/panel-look.ts"], "and the path at it");
    assertEquals(getHistoryCitations("sample", "`git show v0.10.1`"), [], "a ref with no path");
    assertEquals(getHistoryCitations("sample", "`src/ui/panel-look.ts`"), [], "nor a bare path");
    const computed = getHistoryCitations("sample", '`git show "$(git describe main):a.md"`');
    assertEquals(computed, [], "nor a ref the shell works out, which resolves to nothing here");
});

/**
 * A citation into the history reads exactly as a citation into the tree does, and goes as quietly
 * wrong: `develop` is the working branch, so a path cited there for v1 answers with the file as it
 * stands today — the one the sentence beside it says it is not.
 */
Deno.test("every reference a document cites resolves, and so does the path at it", () => {
    const dangling: string[] = [];
    for (const citation of CITED_IN_HISTORY) {
        const asked = new Deno.Command("git", {
            args: ["cat-file", "-e", `${citation.reference}:${citation.path}`],
        }).outputSync();
        if (asked.success) continue;
        dangling.push(`${citation.document} → ${citation.reference}:${citation.path}`);
    }
    assertEquals(dangling, [], "a reference renders as history and answers with nothing");
    assert(CITED_IN_HISTORY.length > 0, "the documents cite history, and it was read");
});

Deno.test("every path a document cites exists, or is one this file says does not", () => {
    const dangling: string[] = [];
    for (const citation of CITED) {
        if (existsSync(citation.path, { isFile: true })) continue;
        if (CITED_WHILE_ABSENT[citation.path] === citation.document) continue;
        dangling.push(`${citation.document} → ${citation.path}`);
    }
    assertEquals(dangling, [], "a citation renders as a path and sends a reader nowhere");
});

/**
 * The list from the other end. An entry that starts existing, or stops being cited, is an entry
 * nothing holds any more — and a list nobody prunes is how the exception becomes the rule.
 */
Deno.test("every path this file excuses is still absent, and still cited where it says", () => {
    for (const [path, document] of Object.entries(CITED_WHILE_ABSENT)) {
        assert(
            !existsSync(path, { isFile: true }),
            `${path} exists now and no longer needs excusing`,
        );
        const cited = CITED.some((one) => one.path === path && one.document === document);
        assert(cited, `${document} no longer cites ${path}`);
    }
    assert(
        Object.keys(CITED_WHILE_ABSENT).length > 0,
        "the list is read rather than assumed empty",
    );
});
