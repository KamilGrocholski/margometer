/**
 * The two pages that stand a game up, held to one spelling of the client's own names — **N13**.
 *
 * `tools/preview-page.ts` and `tests/e2e/browser-page.ts` each carry a stub of `Engine`, because
 * each needs different things around it (`tests/e2e/browser-page.ts` says which). Neither name is
 * this repository's to choose, and a disagreement between them is never loud: the panel simply
 * draws nothing, or a snapshot comes out empty, on one page and not the other.
 */

import { assert, assertEquals } from "@std/assert";
import { getEndOfRun } from "@/libs/text-walk.ts";

const PREVIEW_PAGE = "tools/preview-page.ts";
const BROWSER_PAGE = "tests/e2e/browser-page.ts";
const STUB_OPENS = "window.Engine = {";
const STUB_CLOSES = "\n};";

function isNameAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    if (character >= "a" && character <= "z") return true;
    if (character >= "A" && character <= "Z") return true;
    return character >= "0" && character <= "9";
}

/** The stub itself, cut out of the file that composes it as a template. */
function getStubInText(text: string, path: string): string {
    const opened = text.indexOf(STUB_OPENS);
    assert(opened !== -1, `${path} stands a game up under the name the add-on looks for`);
    const closed = text.indexOf(STUB_CLOSES, opened);
    assert(closed > opened, `and ${path} closes it`);
    return text.slice(opened, closed);
}

/**
 * Every property name the stub states, which is the whole of the client's vocabulary in it: a key
 * is a run of name characters with a colon after it, and nothing else in these two blocks is.
 * Walked rather than matched — **C7**.
 */
function getNamesInStub(stub: string): string[] {
    const found = new Set<string>();
    for (let at = 0; at < stub.length; at += 1) {
        if (!isNameAt(stub, at)) continue;
        if (at > 0 && isNameAt(stub, at - 1)) continue;
        const end = getEndOfRun(stub, at, isNameAt);
        if (stub.charAt(end) === ":") found.add(stub.slice(at, end));
        at = end;
    }
    assert(found.size > 0, "a stub of the game states something");
    return [...found].sort();
}

Deno.test("the reader finds the names a stub states, and nothing standing beside them", () => {
    const sample =
        "window.Engine = {\n  battle: { w: {}, updateData: function handleCall() {} }\n};";
    assertEquals(
        getNamesInStub(getStubInText(sample, "a sample")),
        ["battle", "updateData", "w"],
        "the reader works",
    );
    const beside = "window.Engine = {\n  battle: { w: {} }\n};\nvar elsewhere = { nobody: 1 };";
    assertEquals(
        getNamesInStub(getStubInText(beside, "a sample")),
        ["battle", "w"],
        "and stops at the stub it was asked for",
    );
});

Deno.test("both pages spell the client's names the same way", () => {
    const preview = getNamesInStub(
        getStubInText(Deno.readTextFileSync(PREVIEW_PAGE), PREVIEW_PAGE),
    );
    const browser = getNamesInStub(
        getStubInText(Deno.readTextFileSync(BROWSER_PAGE), BROWSER_PAGE),
    );
    assertEquals(browser, preview, "two stubs of one game state one vocabulary");
    assert(browser.includes("updateData"), "carrying the call the add-on puts its wrap on");
    assert(browser.includes("warriorsList"), "and both names a snapshot is read under");
});
