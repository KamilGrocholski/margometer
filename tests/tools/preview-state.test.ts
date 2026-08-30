/**
 * What the harness carries in the address, run rather than read: the two halves are text a
 * browser executes, so a test that only searched them for words would pass over a hash that
 * composes into something the reader hands back as nothing.
 *
 * Both halves are evaluated here in a window of this file's own making, which is also what says
 * what they are allowed to touch — a page's location, its history, and the store it was lent.
 */

import { assert, assertEquals } from "@std/assert";
import {
    composePreviewStateReading,
    composePreviewStateWriting,
    STATE_TEXT_MAXIMUM,
    STATE_VALUE_MAXIMUM,
} from "@/tools/preview-state.ts";

interface PreviewStateReading {
    entry: number | null;
    screen: string | null;
    store: Record<string, string>;
}

function readStateFromHash(hash: string): PreviewStateReading {
    const read = new Function("window", `${composePreviewStateReading()}\nreturn PREVIEW_STATE;`);
    return read({ location: { hash } }) as PreviewStateReading;
}

/** The writing half, standing where the driver stands it: after a store, with an entry reached. */
function composeHashOfShown(
    held: Record<string, string>,
    shown: { entry: number; screen: string | null },
): string {
    const state = { entry: null, screen: shown.screen, store: {} };
    const store = { readAll: () => ({ ...held }) };
    const window = {
        history: { replaceState: () => {} },
        setInterval: () => 0,
        clearInterval: () => {},
    };
    const document = { addEventListener: () => {}, body: { children: [] } };
    const compose = new Function(
        "window",
        "document",
        "PREVIEW_STATE",
        "PREVIEW_STORE",
        "fedCount",
        `${composePreviewStateWriting()}\nreturn composePreviewStateHash();`,
    );
    return compose(window, document, state, store, shown.entry) as string;
}

Deno.test("what the harness writes into the address is what it reads back out of it", () => {
    const held = { place: `{"left":10,"top":20}`, folded: "1" };
    const hash = composeHashOfShown(held, { entry: 7, screen: "damageTakenApplied" });
    const read = readStateFromHash(hash);
    assertEquals(read.entry, 7, "the entry the replay stopped at");
    assertEquals(read.screen, "damageTakenApplied", "the screen the panel was on");
    assertEquals(read.store, held, "and every value the add-on had put in the store");
});

Deno.test("an address nobody composed reads as no state rather than as a wrong one", () => {
    for (
        const hash of ["", "#", "#e", "#e=", "#e=-1", "#e=1.5", "#e=x", "#k=not-json", "#k=[1,2]"]
    ) {
        const read = readStateFromHash(hash);
        assertEquals(read.entry, null, `${hash} states no entry`);
        assertEquals(read.store, {}, `${hash} states nothing the store should hold`);
    }
    const half = readStateFromHash("#e=3&k=%7B%22a%22%3A1%7D");
    assertEquals(half.entry, 3, "an entry beside a store nobody could read is still an entry");
    assertEquals(half.store, {}, "and a value that is not text is not carried");
});

Deno.test("a value too long for an address does not travel, and one at the edge does", () => {
    const edge = "x".repeat(STATE_VALUE_MAXIMUM);
    const over = "x".repeat(STATE_VALUE_MAXIMUM + 1);
    const read = readStateFromHash(composeHashOfShown({ edge, over }, { entry: 0, screen: null }));
    assertEquals(read.store["edge"], edge, "the longest value that fits is carried");
    assertEquals(read.store["over"], undefined, "and the first one past it is left behind");
    assertEquals(read.entry, 0, "zero is an entry, and the one the empty panel stands at");
});

/**
 * The shelf is the value this is really about: written into the address whole it would take the
 * whole store past the length below, and everything small would be dropped along with it.
 */
Deno.test("one value nobody could carry does not take the small ones down with it", () => {
    const shelf = "x".repeat(STATE_TEXT_MAXIMUM * 2);
    const held = { shelf, place: `{"left":10,"top":20}` };
    const read = readStateFromHash(composeHashOfShown(held, { entry: 2, screen: null }));
    assertEquals(read.store["place"], held.place, "the setting beside it still travels");
    assertEquals(read.store["shelf"], undefined, "and the one nobody could carry does not");
});

Deno.test("a store too big for the whole address is dropped, and the rest still travels", () => {
    const held: Record<string, string> = {};
    for (let at = 0; at * STATE_VALUE_MAXIMUM < STATE_TEXT_MAXIMUM * 2; at += 1) {
        held[`key${at}`] = "x".repeat(STATE_VALUE_MAXIMUM);
    }
    const hash = composeHashOfShown(held, { entry: 4, screen: "healthGiven" });
    assert(hash.length <= STATE_TEXT_MAXIMUM, "an address stays inside the length it states");
    const read = readStateFromHash(hash);
    assertEquals(read.entry, 4, "the entry survives the store being left behind");
    assertEquals(read.screen, "healthGiven", "and so does the screen");
    assertEquals(read.store, {}, "the store is the part that goes, whole");
});
