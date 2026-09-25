/**
 * Where a fight happened, asked of a client that may say all of it, some of it or none.
 *
 * The page is handed in, so none of this needs a browser, and the test of `getCords` is the one
 * that keeps this file a reader rather than a caller.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { err, ok, RESULT_FAILURE } from "#/libs/result.ts";
import { initPagePlace } from "#/src/game/engine-place.ts";
import { PAGE_READ_FAILURE, PAGE_READING } from "#/src/game/page-reading.ts";

const ABSENT = err({ kind: PAGE_READ_FAILURE.absent, reading: PAGE_READING.place });

function composeEngine(mapName: unknown, x: unknown, y: unknown): Record<string, unknown> {
    return { map: { d: { name: mapName } }, hero: { d: { x, y } } };
}

function readPlaceOf(engine: unknown) {
    return initPagePlace({ Engine: engine }).readPlace();
}

Deno.test("the map and the tile are read off the client's own state", () => {
    const place = readPlaceOf(composeEngine("Tempest", 12, 34));
    assertEquals(place, ok({ mapName: "Tempest", x: 12, y: 34 }), "all three, as the page holds");
});

Deno.test("a tile arrives as text as readily as a number", () => {
    const place = readPlaceOf(composeEngine("Tempest", "12", "34"));
    assertEquals(place, ok({ mapName: "Tempest", x: 12, y: 34 }), "both spellings are read");
    const east = readPlaceOf(composeEngine("Tempest", "east", 1));
    assertEquals(
        east,
        ok({ mapName: "Tempest", x: null, y: 1 }),
        "and text naming no tile is none",
    );
});

Deno.test("a tile of zero is a tile somebody stands on", () => {
    const place = readPlaceOf(composeEngine("Tempest", 0, 0));
    assertEquals(place, ok({ mapName: "Tempest", x: 0, y: 0 }), "zero is where they are");
    const one = readPlaceOf(composeEngine(null, 1, 1));
    assertEquals(one, ok({ mapName: null, x: 1, y: 1 }), "and one beside it, with no map named");
});

Deno.test("what the page will not say is null, and a page saying nothing is no place", () => {
    const loading = readPlaceOf({ map: { d: {} }, hero: { d: { x: 12, y: 34 } } });
    assertEquals(loading, ok({ mapName: null, x: 12, y: 34 }), "a map mid-load leaves a tile");
    const onlyY = readPlaceOf({ map: { d: {} }, hero: { d: { y: 34 } } });
    assertEquals(onlyY, ok({ mapName: null, x: null, y: 34 }), "one axis is still a place");
    const onlyName = readPlaceOf({ map: { d: { name: "Tempest" } } });
    assertEquals(onlyName, ok({ mapName: "Tempest", x: null, y: null }), "and so is a name");
    assertEquals(readPlaceOf({ map: { d: {} }, hero: { d: {} } }), ABSENT, "none of it is none");
    assertEquals(readPlaceOf({}), ABSENT, "an engine holding neither says nothing");
    assertEquals(readPlaceOf(null), ABSENT, "and what is not an engine says nothing either");
    assertEquals(initPagePlace(null).readPlace(), ABSENT, "and nor does no page");
});

Deno.test("the engine is read by the page's call when the field holds none", () => {
    const page = { getEngine: () => composeEngine("Tempest", 1, 2) };
    assertEquals(initPagePlace(page).readPlace(), ok({ mapName: "Tempest", x: 1, y: 2 }), "read");
});

Deno.test("a page tearing itself down is a failure of theirs, not a reading of nothing", () => {
    const throwing = {
        get map(): unknown {
            throw new TypeError("the context is gone");
        },
    };
    const read = readPlaceOf(throwing);
    assert(!read.ok, "the throw is not an absent place");
    assertStrictEquals(read.error.kind, RESULT_FAILURE.foreignThrew, "it is named as theirs");
});

/** The page's own `getEngine` is called on the way in, and a page tearing down throws from it. */
Deno.test("a page whose own call throws is a failure of theirs, not a reading of nothing", () => {
    const thrown = new TypeError("the context is gone");
    const page = {
        getEngine: (): unknown => {
            throw thrown;
        },
    };
    const read = initPagePlace(page).readPlace();
    assertEquals(read, err({ kind: RESULT_FAILURE.foreignThrew, cause: thrown }), "with its cause");
});

Deno.test("the client's own method for this is never called", () => {
    let called = 0;
    const engine = {
        map: { d: { name: "Tempest" } },
        hero: {
            d: { x: 12, y: 34 },
            getCords: () => {
                called += 1;
                return "12 34";
            },
        },
    };
    assertEquals(
        readPlaceOf(engine),
        ok({ mapName: "Tempest", x: 12, y: 34 }),
        "the place is read",
    );
    assertEquals(called, 0, "by reading properties, never by calling into somebody else's program");
    assert(typeof engine.hero.getCords === "function", "though the method was there to be called");
});

/** Probes, each the answer to a mutation that lit nothing (W4). */
Deno.test("one axis alone is a place, and a tile of the wrong type is none, never zero", () => {
    const onlyX = readPlaceOf({ map: { d: {} }, hero: { d: { x: 12 } } });
    assertEquals(onlyX, ok({ mapName: null, x: 12, y: null }), "a tile on one axis is a place");
    const odd = readPlaceOf(composeEngine("Tempest", true, 34));
    assertEquals(odd, ok({ mapName: "Tempest", x: null, y: 34 }), "a tile nobody wrote is none");
});

Deno.test("the first spelling of the game that says anything is the one read", () => {
    const page = {
        Engine: composeEngine("Tempest", 1, 2),
        getEngine: () => composeEngine("Luvia", 3, 4),
    };
    assertEquals(initPagePlace(page).readPlace(), ok({ mapName: "Tempest", x: 1, y: 2 }), "Engine");
});
