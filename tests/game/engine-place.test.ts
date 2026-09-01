/**
 * Where a fight happened, asked of a client that may say all of it, some of it or none.
 *
 * The engine is handed in, so none of this needs a browser — and the last test here is the one
 * that keeps this file a reader rather than a caller.
 */

import { assert, assertEquals } from "@std/assert";
import { readPlaceFromEngine } from "@/src/game/engine-place.ts";

function composeEngine(mapName: unknown, x: unknown, y: unknown): Record<string, unknown> {
    return { map: { d: { name: mapName } }, hero: { d: { x, y } } };
}

Deno.test("the map and the tile are read off the client's own state", () => {
    const place = readPlaceFromEngine(composeEngine("Tempest", 12, 34));
    assertEquals(place, { mapName: "Tempest", x: 12, y: 34 }, "all three, as the page holds them");
});

Deno.test("a tile arrives as text as readily as a number", () => {
    const place = readPlaceFromEngine(composeEngine("Tempest", "12", "34"));
    assertEquals(place?.x, 12, "the client does arithmetic on one and comparisons on the other");
    assertEquals(place?.y, 34, "so both spellings are read");
    assertEquals(readPlaceFromEngine(composeEngine("Tempest", "east", 1))?.x, null, "and neither");
});

Deno.test("a tile of zero is a tile somebody stands on", () => {
    const place = readPlaceFromEngine(composeEngine("Tempest", 0, 0));
    assertEquals(place?.x, 0, "zero is where they are, not a failure to say where");
    assertEquals(place?.y, 0, "on both axes");
});

Deno.test("what the page will not say is null, and a page saying nothing is no place", () => {
    const loading = readPlaceFromEngine({ map: { d: {} }, hero: { d: { x: 12, y: 34 } } });
    assertEquals(loading, { mapName: null, x: 12, y: 34 }, "a map mid-load still leaves a tile");
    assertEquals(readPlaceFromEngine({ map: { d: {} }, hero: { d: {} } }), null, "and none of it");
    assertEquals(readPlaceFromEngine({}), null, "an engine holding neither says nothing");
    assertEquals(readPlaceFromEngine(null), null, "and what is not an engine says nothing either");
});

Deno.test("a page tearing itself down is a reading of nothing, not a failure of ours", () => {
    const throwing = {
        get map(): unknown {
            throw new TypeError("the context is gone");
        },
    };
    assertEquals(readPlaceFromEngine(throwing), null, "the throw stays inside this file");
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
    assertEquals(readPlaceFromEngine(engine)?.mapName, "Tempest", "the place is read");
    assertEquals(called, 0, "by reading properties, never by calling into somebody else's program");
    assert(typeof engine.hero.getCords === "function", "though the method was there to be called");
});
