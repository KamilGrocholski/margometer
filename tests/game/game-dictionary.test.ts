/**
 * ⚠️ **Every string below is ours.** What is quoted is the **shape** — a leading sign, a `%…%`
 * hole, a trailing full stop, space — which is the client's own template syntax, read on
 * production build `53XkBRxF` (2026-08-25), and not prose. The words between pass through
 * untouched, so an English placeholder walks the branches a Polish sentence would.
 */

import { assertEquals, assertInstanceOf, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { initPageDictionary, parseLabel } from "#/src/game/game-dictionary.ts";
import { PAGE_READING, PageReadingAbsent } from "#/src/game/page-reading.ts";

const CRITICAL_ID = "msg_+crit";

Deno.test("a label drops the sign that says which way the effect went", () => {
    assertEquals(parseLabel("+Critical hit"), "Critical hit", "a sign the client prefixes");
    assertEquals(parseLabel("-Evade"), "Evade", "in either direction");
    assertEquals(parseLabel("Critical hit"), "Critical hit", "and an entry carrying none");
});

Deno.test("a label drops a full stop the client ends a line with, and the space around it", () => {
    assertEquals(parseLabel("+Armour destroyed outright."), "Armour destroyed outright");
    assertEquals(parseLabel("  Evade  "), "Evade", "and the space either side of it");
});

/**
 * ⚠️ **A sentence with the figure cut out of it is not a label.** One shape comes back as a verb
 * beside its object with the number gone; another ends on the preposition that governed the hole.
 */
Deno.test("a sentence with a hole in it is refused, wherever the hole sits", () => {
    assertEquals(parseLabel("-Blocked %val% damage"), null, "a hole in the middle");
    assertEquals(parseLabel("+Armour destruction by %val%"), null, "and one at the end");
    assertEquals(parseLabel("%name%: %val% damage from poison."), null, "and two of them");
    assertEquals(parseLabel("+%val%"), null, "and an entry that is all hole and no name");
});

Deno.test("an entry with no words in it is refused, and a lone mark is not a word", () => {
    assertEquals(parseLabel(""), null, "nothing at all");
    assertEquals(parseLabel("+ "), null, "a sign and a space");
    assertEquals(parseLabel("."), null, "and a full stop standing alone");
    assertEquals(parseLabel("%"), "%", "though one mark is not a hole, and is a name");
});

Deno.test("a page with no game on it lends no dictionary", () => {
    expectAbsent(initPageDictionary({}).readLabel(CRITICAL_ID), "never loaded");
    const stated = initPageDictionary({ _t: "not a function" }).readLabel(CRITICAL_ID);
    expectAbsent(stated, "nor where it is not one");
    expectAbsent(initPageDictionary(null).readLabel(CRITICAL_ID), "nor with no page");
    expectAbsent(initPageDictionary("a page").readLabel(CRITICAL_ID), "nor a string");
});

function expectAbsent(read: unknown, message: string): void {
    assertInstanceOf(read, PageReadingAbsent, message);
    assertStrictEquals(read.reading, PAGE_READING.label, `${message}: the reading named`);
}

Deno.test("a reader answers what the client answers, and nothing where it answers nothing", () => {
    const asked: unknown[][] = [];
    const dictionary = initPageDictionary({
        _t: (...args: unknown[]) => {
            asked.push(args);
            return args[0] === CRITICAL_ID ? "+Critical hit" : undefined;
        },
    });
    assertEquals(dictionary.readLabel(CRITICAL_ID), "Critical hit", "the label inside it");
    // A miss falls off the end of `_t` — development build `1781609507010`.
    expectAbsent(dictionary.readLabel("msg_nothing_here"), "and no answer is no answer");
    expectAbsent(dictionary.readLabel("slow", "buff"), "whatever it is filed under");
    assertEquals(asked[2], ["slow", null, "buff"], "which is handed on as the client's category");
});

Deno.test("an answer of the wrong kind is no answer either", () => {
    const dictionary = initPageDictionary({ _t: () => 42 });
    expectAbsent(dictionary.readLabel(CRITICAL_ID), "which refuses what is not text");
});

/** The exception must not travel on: the panel is drawn inside a call the game made (E5). */
Deno.test("a dictionary that throws leaves the panel drawing its own word", () => {
    const dictionary = initPageDictionary({
        // A real fault rather than a thrown Error: a torn-down page context looks like this.
        _t: (): string => (undefined as unknown as { missing: () => string }).missing(),
    });
    const read = dictionary.readLabel(CRITICAL_ID);
    assertInstanceOf(read, Error, "the failure comes back as no label");
    assertInstanceOf(read, errors.Caught, "the page's own");
});

Deno.test("an answer past the bound is no label, and never an assertion inside a card", () => {
    const dictionary = initPageDictionary({ _t: () => "x".repeat(4097) });
    expectAbsent(dictionary.readLabel(CRITICAL_ID), "the answer is refused as no label");
    const fits = initPageDictionary({ _t: () => "x".repeat(4096) });
    assertEquals(fits.readLabel(CRITICAL_ID), "x".repeat(4096), "and one at the bound is read");
});
