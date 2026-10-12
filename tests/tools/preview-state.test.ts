/**
 * What `deno task preview` carries in the address, run rather than read: both halves are text a
 * browser executes, so a test searching them for words would pass over a hash that composes into
 * something the reader hands back as nothing. They run here in a window of this file's making,
 * which also says what they may touch: a location, a history, the probe, and the store.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import {
    composePreviewStateReading,
    composePreviewStateWriting,
    STATE_TEXT_MAXIMUM,
    STATE_VALUE_MAXIMUM,
} from "#/tools/preview-state.ts";

interface PreviewStateReading {
    entry: number | null;
    screen: string | null;
    store: Record<string, string>;
}

Deno.test("what the harness writes into the address is what it reads back out of it", () => {
    const held = { place: `{"left":10,"top":20}`, folded: "1" };
    const hash = composeHashOfShown(held, { entry: 7, screen: "damageTaken" });
    const reading = readStateFromHash(hash);
    assertStrictEquals(reading.entry, 7, "the entry the replay stopped at");
    assertStrictEquals(reading.screen, "damageTaken", "the screen the panel was on");
    assertEquals(reading.store, held, "and every value the add-on had put in the store");
});

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
        margometerE2e: { fed: shown.entry },
    };
    const document = { addEventListener: () => {}, body: { children: [] } };
    const compose = new Function(
        "window",
        "document",
        "PREVIEW_STATE",
        "PREVIEW_STORE",
        `${composePreviewStateWriting()}\nreturn composePreviewStateHash();`,
    );
    return compose(window, document, state, store) as string;
}

function readStateFromHash(hash: string, warned: unknown[][] = []): PreviewStateReading {
    const readPreviewState = new Function(
        "window",
        "console",
        `${composePreviewStateReading()}\nreturn PREVIEW_STATE;`,
    );
    const console = { warn: (...said: unknown[]) => warned.push(said) };
    return readPreviewState({ location: { hash } }, console) as PreviewStateReading;
}

Deno.test("an address nobody composed reads as no state rather than as a wrong one", () => {
    for (
        const hash of ["", "#", "#e", "#e=", "#e=-1", "#e=1.5", "#e=x", "#k=not-json", "#k=[1,2]"]
    ) {
        const reading = readStateFromHash(hash);
        assertStrictEquals(reading.entry, null, `${hash} states no entry`);
        assertEquals(reading.store, {}, `${hash} states nothing the store should hold`);
    }
    const half = readStateFromHash("#e=3&k=%7B%22a%22%3A1%7D");
    assertStrictEquals(
        half.entry,
        3,
        "an entry beside a store nobody could read is still an entry",
    );
    assertEquals(half.store, {}, "and a value that is not text is not carried");
});

Deno.test("a part nobody could read is dropped alone, and said, while the rest still travels", () => {
    const warned: unknown[][] = [];
    const broken = readStateFromHash("#e=3&k=%7B&s=damageTaken", warned);
    assertStrictEquals(broken.entry, 3, "an entry beside a store that is not JSON is kept");
    assertStrictEquals(broken.screen, "damageTaken", "and so is the screen after it");
    assertEquals(broken.store, {}, "while the store holds nothing it could not read");
    const escaped = readStateFromHash("#e=%E0%A4%A&e=4", warned);
    assertStrictEquals(escaped.entry, 4, "a broken escape takes no other part down");
    assertStrictEquals(warned.length, 2, "and each part dropped is said once");
    assertStrictEquals(warned[0]?.[0], "MargoMeter/Preview", "under the page's own brand");
    const whole: unknown[][] = [];
    assertStrictEquals(readStateFromHash("#e=3&k=%7B%7D", whole).entry, 3, "a whole one");
    assertStrictEquals(whole.length, 0, "says nothing");
});

Deno.test("a value too long for an address does not travel, and one at the edge does", () => {
    const edge = "x".repeat(STATE_VALUE_MAXIMUM);
    const over = "x".repeat(STATE_VALUE_MAXIMUM + 1);
    const reading = readStateFromHash(
        composeHashOfShown({ edge, over }, { entry: 0, screen: null }),
    );
    assertStrictEquals(reading.store["edge"], edge, "the longest value that fits is carried");
    assertStrictEquals(
        reading.store["over"],
        undefined,
        "and the first one past it is left behind",
    );
    assertStrictEquals(reading.entry, 0, "zero is an entry, and the one the empty panel stands at");
    const atFirstCall = readStateFromHash(composeHashOfShown({}, { entry: 1, screen: null }));
    assertStrictEquals(atFirstCall.entry, 1, "and one past it is the first call");
});

/** The shelf is the value this is about: whole in the address it would take the rest down. */
Deno.test("one value nobody could carry does not take the small ones down with it", () => {
    const shelf = "x".repeat(STATE_TEXT_MAXIMUM * 2);
    const held = { shelf, place: `{"left":10,"top":20}` };
    const reading = readStateFromHash(composeHashOfShown(held, { entry: 2, screen: null }));
    assertStrictEquals(reading.store["place"], held.place, "the setting beside it still travels");
    assertStrictEquals(
        reading.store["shelf"],
        undefined,
        "and the one nobody could carry does not",
    );
});

Deno.test("a store too big for the whole address is dropped, and the rest still travels", () => {
    const held: Record<string, string> = {};
    for (let index = 0; index * STATE_VALUE_MAXIMUM < STATE_TEXT_MAXIMUM * 2; index += 1) {
        held[`key${index}`] = "x".repeat(STATE_VALUE_MAXIMUM);
    }
    const hash = composeHashOfShown(held, { entry: 4, screen: "healthGiven" });
    assert(hash.length <= STATE_TEXT_MAXIMUM, "an address stays inside the length it states");
    const reading = readStateFromHash(hash);
    assertStrictEquals(reading.entry, 4, "the entry survives the store being left behind");
    assertStrictEquals(reading.screen, "healthGiven", "and so does the screen");
    assertEquals(reading.store, {}, "the store is the part that goes, whole");
});
