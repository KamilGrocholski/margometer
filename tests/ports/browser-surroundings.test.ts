/** What a recording says about where it was taken: the world, and the browser in its own words. */

import { assertStrictEquals } from "@std/assert";
import {
    initBrowserSurroundings,
    parseWorld,
    WORLD_UNKNOWN,
} from "#/src/ports/browser-surroundings.ts";

Deno.test("the world is the first label of the host, and a page with none is nobody's", () => {
    assertStrictEquals(parseWorld("tempest.margonem.pl"), "tempest", "the first label");
    assertStrictEquals(parseWorld("localhost"), "localhost", "a host of one label is that label");
    // ⚠️ Seen on a `file://` page, in v1: a world of nothing named a file with a hole in it.
    assertStrictEquals(parseWorld(""), WORLD_UNKNOWN, "and an empty host is the word for unknown");
    assertStrictEquals(parseWorld(".margonem.pl"), WORLD_UNKNOWN, "as is a host opening on a dot");
});

Deno.test("the page is read through its prototype, as a browser keeps a navigator", () => {
    class Navigator {
        get userAgent(): string {
            return "a browser that said so";
        }
    }
    const page = { location: { hostname: "luvia.margonem.pl" }, navigator: new Navigator() };
    const surroundings = initBrowserSurroundings(page);
    assertStrictEquals(surroundings.readWorld(), "luvia", "the world off the host");
    assertStrictEquals(surroundings.readUserAgent(), "a browser that said so", "and the browser");
});

Deno.test("a page that says nothing, or throws when asked, is answered as unknown", () => {
    const quiet = initBrowserSurroundings({ location: {}, navigator: { userAgent: "" } });
    assertStrictEquals(quiet.readWorld(), WORLD_UNKNOWN, "no host is no world");
    assertStrictEquals(quiet.readUserAgent(), null, 'and an empty agent is none, never ""');
    const throwing = initBrowserSurroundings({
        get location(): unknown {
            throw new RangeError("a page torn down");
        },
        get navigator(): unknown {
            throw new RangeError("a page torn down");
        },
    });
    assertStrictEquals(throwing.readWorld(), WORLD_UNKNOWN, "a page that throws states no world");
    assertStrictEquals(throwing.readUserAgent(), null, "and no browser");
    assertStrictEquals(
        initBrowserSurroundings(null).readWorld(),
        WORLD_UNKNOWN,
        "nor does no page",
    );
});
