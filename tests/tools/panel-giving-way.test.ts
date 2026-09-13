/**
 * The build that makes a region stand down, held to the source it edits.
 *
 * ⚠️ **A reader over source that stops finding its subject is the whole risk here.** It would
 * build a panel that gives nothing way, serve it, photograph it, and say nothing — a set of
 * pictures of a healthy panel under the names of the states they were meant to show. So the
 * anchor is held against `src/ui/panel-element.ts` on every run, and the marker is held out of
 * everything the bundle carries.
 */

import { assert, assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import {
    composeGivingWaySource,
    getRegionsUnknown,
    GIVING_WAY_ANCHOR,
    GIVING_WAY_REGIONS,
} from "@/tools/panel-giving-way.ts";
import { PanelShotError } from "@/tools/margometer-tool-error.ts";
import { REGION_WORDS } from "@/src/ui/panel-words.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const PANEL_FILE = "src/ui/panel-element.ts";
/** What the added line says, and what nothing a reader installs may ever say. */
const MARKER = "given way on purpose";

Deno.test("the line this edits is still the line the panel carries, and only one of it", () => {
    const source = Deno.readTextFileSync(PANEL_FILE);
    assertEquals(
        source.split(GIVING_WAY_ANCHOR).length - 1,
        1,
        `${PANEL_FILE}: the region guard this edits is not there once`,
    );
});

Deno.test("a region asked for reaches the source, and the source comes back changed", () => {
    const source = Deno.readTextFileSync(PANEL_FILE);
    const given = composeGivingWaySource(source, ["list"]);
    assert(given !== source, "the source came back changed");
    assertStringIncludes(given, MARKER, "carrying the line that makes a region stand down");
    // The list the added line tests against, and never a name that merely occurs in the panel:
    // `sides` is a region the source spells for its own reasons.
    assertStringIncludes(given, `["list"].includes(region)`, "naming the region asked for");
    const both = composeGivingWaySource(source, ["list", "sides"]);
    assertStringIncludes(both, `["list","sides"].includes(region)`, "two of them arrive as two");
});

/** The sample it must refuse: a panel whose guard has been written another way. */
Deno.test("a source no longer carrying the guard is refused, not edited into nothing", () => {
    assertThrows(
        () => composeGivingWaySource("function composeRegion() { return compose(); }", ["list"]),
        PanelShotError,
        "region guard",
    );
});

Deno.test("a name that is not a region is named back, and every real one passes", () => {
    assertEquals(getRegionsUnknown(GIVING_WAY_REGIONS), [], "every region the panel has passes");
    assertEquals(
        getRegionsUnknown(["list", "nowhere"]),
        ["nowhere"],
        "and one it has not is named",
    );
    assertEquals(
        [...GIVING_WAY_REGIONS].sort(),
        Object.keys(REGION_WORDS).sort(),
        "the regions offered are the panel's own, read from its words",
    );
    assert(GIVING_WAY_REGIONS.length > 1, "and there is more than one to ask for");
});

/**
 * The promise the whole design rests on: the seam lives in a copy of the tree and never in the
 * tree. Held over the sources rather than over a built file, because a build is a minute and a
 * reader of the sources is the thing that would have to change for this to stop being true.
 */
Deno.test("nothing a reader installs carries the line that makes a region stand down", () => {
    const carried: string[] = [];
    for (const path of getSourcePaths()) {
        if (!path.startsWith("src/")) continue;
        if (!Deno.readTextFileSync(path).includes(MARKER)) continue;
        carried.push(path);
    }
    assertEquals(carried, [], "a source that ships carries the tool's own marker");
});
