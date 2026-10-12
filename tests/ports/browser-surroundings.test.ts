/** What a recording says about where it was taken: the world, and the browser in its own words. */

import { assertStrictEquals } from "@std/assert";
import { initBrowserSurroundings, parseWorld } from "#/src/ports/browser-surroundings.ts";

Deno.test("the world is the first label of the host, and a page with none is nobody's", () => {
    assertStrictEquals(parseWorld("tempest.margonem.pl"), "tempest", "the first label");
    assertStrictEquals(parseWorld("localhost"), "localhost", "a host of one label is that label");
    // ⚠️ Seen on a `file://` page, in `develop`: a world of nothing named a file with a hole in it.
    assertStrictEquals(parseWorld(""), null, "and an empty host names no world");
    assertStrictEquals(parseWorld(".margonem.pl"), null, "nor does a host opening on a dot");
    assertStrictEquals(parseWorld("unknown.margonem.pl"), "unknown", "a world of any name is one");
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

Deno.test("a page that says nothing, or throws when asked, is answered with null", () => {
    const quiet = initBrowserSurroundings({ location: {}, navigator: { userAgent: "" } });
    assertStrictEquals(quiet.readWorld(), null, "no host is no world");
    assertStrictEquals(quiet.readUserAgent(), null, 'and an empty agent is none, never ""');
    const throwing = initBrowserSurroundings({
        get location(): unknown {
            throw new RangeError("a page torn down");
        },
        get navigator(): unknown {
            throw new RangeError("a page torn down");
        },
    });
    assertStrictEquals(throwing.readWorld(), null, "a page that throws states no world");
    assertStrictEquals(throwing.readUserAgent(), null, "and no browser");
    assertStrictEquals(
        initBrowserSurroundings(null).readWorld(),
        null,
        "nor does no page",
    );
});
