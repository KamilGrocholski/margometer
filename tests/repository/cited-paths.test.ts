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
 * How a citation into this repository's own history is written: `git show develop:<path>`, whole,
 * inside one span. v1 is readable there and absent here, so a path inside one is not a path into
 * this tree and nothing about it is checked.
 */
const HISTORY_MARK = "git show ";

/**
 * A path a document names on purpose while it does not exist. Each entry carries why, because the
 * list is the one way past this guard and a list nobody has to justify grows until it is the rule.
 */
const CITED_WHILE_ABSENT: Record<string, string> = {
    // ADR 0020's Context: the address the decision moved this file **from**. An ADR is a dated
    // snapshot and is never edited to agree with the rule it changed (`docs/adr/README.md`).
    "src/core/unknown-reading.ts": "docs/adr/0020-a-shared-address-for-what-knows-nothing.md",
    // ADR 0017's Context: the tool the decision replaced, named in the past tense.
    "tools/build-preview.ts": "docs/adr/0017-the-panel-is-served-and-published.md",
    // ADR 0046's Decision: the module its suite launched a browser through. ADR 0047 replaced
    // that suite, and the module folded back into the one tool left asking the question.
    "tools/installed-browser.ts": "docs/adr/0046-the-browser-layer-is-a-suite-of-its-own.md",
    // ADR 0022's measurements, taken on two recordings under the names they were filed as before
    // ADR 0030 renamed every one of them after the two versions it states. An ADR is a dated
    // snapshot and is never edited to agree with the tree it now sits in
    // (`docs/adr/README.md`); the same material is in `captures/` under a longer name.
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

function getEveryCitation(): Citation[] {
    const found: Citation[] = [];
    for (const document of getDocumentPaths()) {
        found.push(...getCitations(document, Deno.readTextFileSync(document)));
    }
    assert(found.length > 0, "an empty reading of the documents is a finding, not a pass");
    return found;
}

const CITED = getEveryCitation();

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
    const whole = getCitations("sample", "at `git show develop:tools/fight-report.ts` today");
    assertEquals(whole, [], "the reference and its path are one span, and the span is skipped");
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
