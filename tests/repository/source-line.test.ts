/**
 * The reader every other guard in this directory stands on, against samples it must read and
 * samples it must not. Seven guard files call `getCodeOutsideStrings`; until this file none of
 * them proved it, and what it got wrong it got wrong for all of them at once.
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import {
    countCallsOutsideStrings,
    getCodeOutsideStrings,
    hasOutsideStrings,
    isCommentLine,
} from "@/tests/source-line.ts";

Deno.test("a comment is dropped, and what stands before it is kept", () => {
    assertEquals(
        getCodeOutsideStrings("const held = read(); // a note about it"),
        "const held = read(); ",
        "code before the slashes survives, and the note does not",
    );
    assertEquals(
        getCodeOutsideStrings("// the whole line is a note"),
        "",
        "a line that is only a note reads as no code at all",
    );
});

/**
 * ⚠️ **The slashes of a protocol are not the slashes of a comment.** The reader used to cut the
 * line at the first `//` before it knew whether a quote was open, so `"https://…"` left an
 * unclosed quote and everything after it — calls, assertions, constructs — was blanked for every
 * guard standing on this. Measured 2026-09-10: 22 lines in the tree carry a `://` in a literal.
 */
Deno.test("a protocol inside a literal is not read as a comment", () => {
    const read = getCodeOutsideStrings('const host = "https://example.com"; readIt(host);');
    assertStringIncludes(read, "readIt(", "what stands after the literal is still code");
    assertEquals(
        countCallsOutsideStrings('const host = "https://x"; assert(host.length > 0);', ["assert"]),
        1,
        "and an assertion behind one is counted",
    );
    assertEquals(
        hasOutsideStrings('const opener = "//"; throw new Error("x");', "throw "),
        true,
        "a guard reading for a spelling still finds one written past a literal",
    );
});

Deno.test("what a literal holds is never read as code", () => {
    assertEquals(
        hasOutsideStrings('const spelling = "extends Error";', "extends Error"),
        false,
        "a spelling quoted as a sample is not the tree spelling it",
    );
    assertEquals(
        countCallsOutsideStrings('const shown = "assert(x)";', ["assert"]),
        0,
        "and a call written inside a string is not a call",
    );
});

Deno.test("an escape inside a literal never closes it", () => {
    assertEquals(
        hasOutsideStrings('const shown = "he said \\"assert(x)\\""; ', "assert("),
        false,
        "an escaped quote leaves the literal open, so what follows is still inside it",
    );
});

Deno.test("a line of comment is told from a line of code", () => {
    assertEquals(isCommentLine("    // a note"), true, "a note indented is still a note");
    assertEquals(isCommentLine(" * a docblock line"), true, "and so is a line of a docblock");
    assertEquals(isCommentLine("const held = 1;"), false, "code is not");
    assertEquals(isCommentLine('const path = "a/b";'), false, "and neither is a path in a literal");
});
