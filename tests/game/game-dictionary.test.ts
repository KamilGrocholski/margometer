/**
 * ⚠️ **Every string below is ours.** What is quoted is the **shape** — a leading sign, a `%…%`
 * hole, a trailing full stop, space — which is the client's own template syntax, read on
 * production build `53XkBRxF` (2026-08-25), and not prose. The words between pass through
 * untouched, so an English placeholder walks the branches a Polish sentence would, and the
 * operator's writing stays out of this repository in any form (`NOTICE.md`).
 */

import { assert, assertEquals } from "@std/assert";
import { getDictionaryReader, getLabelFromEntry } from "@/src/game/game-dictionary.ts";

const CRITICAL_ID = "msg_+crit";

Deno.test("a label drops the sign that says which way the effect went", () => {
    assertEquals(getLabelFromEntry("+Critical hit"), "Critical hit", "a sign the client prefixes");
    assertEquals(getLabelFromEntry("-Evade"), "Evade", "in either direction");
    assertEquals(getLabelFromEntry("Critical hit"), "Critical hit", "and an entry carrying none");
});

Deno.test("a label drops a full stop the client ends a line with, and the space around it", () => {
    assertEquals(getLabelFromEntry("+Armour destroyed outright."), "Armour destroyed outright");
    assertEquals(getLabelFromEntry("  Evade  "), "Evade", "and the space either side of it");
});

/**
 * ⚠️ **A sentence with the figure cut out of it is not a label.** One shape comes back as a verb
 * beside its object with the number gone; another ends on the preposition that governed the hole.
 */
Deno.test("a sentence with a hole in it is refused, wherever the hole sits", () => {
    assertEquals(getLabelFromEntry("-Blocked %val% damage"), null, "a hole in the middle");
    assertEquals(getLabelFromEntry("+Armour destruction by %val%"), null, "and one at the end");
    assertEquals(getLabelFromEntry("%name%: %val% damage from poison."), null, "and two of them");
    assertEquals(getLabelFromEntry("+%val%"), null, "and an entry that is all hole and no name");
});

Deno.test("an entry with no words in it is refused, and a lone mark is not a word", () => {
    assertEquals(getLabelFromEntry(""), null, "nothing at all");
    assertEquals(getLabelFromEntry("+ "), null, "a sign and a space");
    assertEquals(getLabelFromEntry("."), null, "and a full stop standing alone");
    assertEquals(getLabelFromEntry("%"), "%", "though one mark is not a hole, and is a name");
});

Deno.test("a page with no game on it lends no dictionary", () => {
    assertEquals(getDictionaryReader({}), null, "nothing where the client never loaded");
    assertEquals(getDictionaryReader({ _t: "not a function" }), null, "nor where it is not one");
    assertEquals(getDictionaryReader(null), null, "and nothing where there is no page at all");
    assertEquals(getDictionaryReader("a page"), null, "nor where it is not an object graph");
});

Deno.test("a reader answers what the client answers, and nothing where it answers nothing", () => {
    const read = getDictionaryReader({
        _t: (id: string) => (id === CRITICAL_ID ? "+Critical hit" : undefined),
    });
    assert(read !== null, "a page with the dictionary on it lends a reader");
    assertEquals(read(CRITICAL_ID), "Critical hit", "the label inside what it answered");
    // A miss falls off the end of `_t` — development build `1781609507010`.
    assertEquals(read("msg_nothing_here"), null, "and no answer is taken for an answer");
});

Deno.test("an answer of the wrong kind is no answer either", () => {
    const read = getDictionaryReader({ _t: () => 42 });
    assert(read !== null, "the page still lends a reader");
    assertEquals(read(CRITICAL_ID), null, "which refuses what is not text");
});

/** The exception must not travel on: the panel is drawn inside a call the game made (**E5**). */
Deno.test("a dictionary that throws leaves the panel drawing its own word", () => {
    const read = getDictionaryReader({
        // A real fault rather than a thrown Error: a torn-down page context looks like this.
        _t: (): string => (undefined as unknown as { missing: () => string }).missing(),
    });
    assert(read !== null, "the page lends a reader");
    assertEquals(read(CRITICAL_ID), null, "and the failure comes back as no label");
});
