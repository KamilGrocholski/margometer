/** What a recording says about where it was taken: the world, and the browser in its own words. */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { initPageSurroundings, parseWorld, WORLD_UNKNOWN } from "#/src/game/page-surroundings.ts";

Deno.test("the world is the first label of the host, and a page with none is nobody's", () => {
    assertEquals(parseWorld("tempest.margonem.pl"), "tempest", "the first label");
    assertEquals(parseWorld("localhost"), "localhost", "a host of one label is that label");
    // ⚠️ Seen on a `file://` page, in v1: a world of nothing named a file with a hole in it.
    assertEquals(parseWorld(""), WORLD_UNKNOWN, "and an empty host is the word for unknown");
    assertEquals(parseWorld(".margonem.pl"), WORLD_UNKNOWN, "as is a host opening on a dot");
});

Deno.test("the page is read through its prototype, as a browser keeps a navigator", () => {
    class Navigator {
        get userAgent(): string {
            return "a browser that said so";
        }
    }
    const page = { location: { hostname: "luvia.margonem.pl" }, navigator: new Navigator() };
    const surroundings = initPageSurroundings(page);
    assertEquals(surroundings.readWorld(), "luvia", "the world off the host");
    assertEquals(surroundings.readUserAgent(), "a browser that said so", "and the browser");
});

Deno.test("a page that says nothing, or throws when asked, is answered as unknown", () => {
    const quiet = initPageSurroundings({ location: {}, navigator: { userAgent: "" } });
    assertEquals(quiet.readWorld(), WORLD_UNKNOWN, "no host is no world");
    assertStrictEquals(quiet.readUserAgent(), null, 'and an empty agent is none, never ""');
    const throwing = initPageSurroundings({
        get location(): unknown {
            throw new RangeError("a page torn down");
        },
        get navigator(): unknown {
            throw new RangeError("a page torn down");
        },
    });
    assertEquals(throwing.readWorld(), WORLD_UNKNOWN, "a page that throws states no world");
    assertStrictEquals(throwing.readUserAgent(), null, "and no browser");
    assertEquals(initPageSurroundings(null).readWorld(), WORLD_UNKNOWN, "nor does no page");
});
