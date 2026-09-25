/**
 * The build that makes a region give way, held to the source it edits. ⚠️ **A reader over source
 * that stops finding its subject is the whole risk here**: it would build a panel that gives nothing
 * way, photograph it, and hand back pictures of a healthy panel under the names of the states they
 * were meant to show. So both guards are held against `src/ui/panel-element.ts` on every run, and
 * the marker is held out of everything the bundle carries.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { PANEL_MARK } from "#/src/ui/panel-intent.ts";
import { PANEL_REGION } from "#/src/ui/panel-words.ts";
import { readBundleFiles } from "#/tests/source-tree.ts";
import { GivingWayError } from "#/tools/margometer-tool-error.ts";
import {
    composeGivingWayShot,
    composeGivingWaySource,
    DEFAULT_INTO,
    GIVING_WAY_MARKER,
    GIVING_WAY_REGIONS,
    PANEL_FILE,
    readGivingWayFlags,
    REGION_ANCHOR,
    REGIONS_ASKED_MAXIMUM,
    TIP_ANCHOR,
} from "#/tools/panel-giving-way.ts";
import { SHOT_DIRECTORY } from "#/tools/panel-shots.ts";

Deno.test("both guards this edits are still the panel's, and each stands once", () => {
    const source = Deno.readTextFileSync(PANEL_FILE);
    assertStrictEquals(source.split(REGION_ANCHOR).length - 1, 1, "every region's guard, once");
    assertStrictEquals(source.split(TIP_ANCHOR).length - 1, 1, "and the card's, once");
});

Deno.test("a region asked for reaches both guards, and one asked for with it arrives too", () => {
    const source = Deno.readTextFileSync(PANEL_FILE);
    const given = composeGivingWaySource(source, [PANEL_REGION.list]);
    assert(given !== source, "the source came back changed");
    // The list the added lines test against, and never a name that merely occurs in the panel:
    // `list` is a word the source spells for its own reasons.
    assertStrictEquals(given.split(`["list"].includes(region)`).length - 1, 1, "every region's");
    assertStrictEquals(given.split(`["list"].includes(PANEL_REGION.tip)`).length - 1, 1, "card");
    assertStrictEquals(given.split(GIVING_WAY_MARKER).length - 1, 2, "one line in each guard");
    const both = composeGivingWaySource(source, [PANEL_REGION.list, PANEL_REGION.sides]);
    assert(both.includes(`["list","sides"].includes(region)`), "two of them arrive as two");
});

/** The samples it must refuse: a panel with either guard written another way, or twice. */
Deno.test("a source not carrying each guard once is refused, not edited into nothing", () => {
    const refused = [REGION_ANCHOR, TIP_ANCHOR, `${REGION_ANCHOR}${REGION_ANCHOR}${TIP_ANCHOR}`];
    for (const source of refused) {
        assertThrows(
            () => composeGivingWaySource(source, [PANEL_REGION.list]),
            GivingWayError,
            "the guard this edits",
        );
    }
    const carried = composeGivingWaySource(`${REGION_ANCHOR}${TIP_ANCHOR}`, [PANEL_REGION.list]);
    assert(carried.includes(GIVING_WAY_MARKER), "and one carrying both, once each, is edited");
});

Deno.test("every region the panel words is one to ask for, and nothing else is", () => {
    assertEquals(GIVING_WAY_REGIONS, Object.values(PANEL_REGION), "the panel's own, in order");
    assertEquals(readGivingWayFlags([]).regions, GIVING_WAY_REGIONS, "none asked is every one");
    const asked = readGivingWayFlags(["--region", "list", "--region", "tip"]);
    assertEquals(asked.regions, [PANEL_REGION.list, PANEL_REGION.tip], "each asked, in order");
    assertThrows(
        () => readGivingWayFlags(["--region", "list", "--region", "nowhere"]),
        GivingWayError,
        "no region of the panel is called nowhere",
    );
});

Deno.test("regions are asked for up to the bound and refused one past it", () => {
    const flags = (count: number) => {
        return Array.from({ length: count }, () => ["--region", "list"]).flat();
    };
    const at = readGivingWayFlags(flags(REGIONS_ASKED_MAXIMUM));
    assertStrictEquals(at.regions.length, REGIONS_ASKED_MAXIMUM, "the bound itself is asked");
    assertThrows(() => readGivingWayFlags(flags(REGIONS_ASKED_MAXIMUM + 1)), GivingWayError);
});

Deno.test("the flags a person gives are read, and what is not one is refused", () => {
    const read = readGivingWayFlags(["--shots", "--port", "4190", "--browser", "/bin/chrome"]);
    assertEquals(
        { port: read.port, browser: read.browser, doesShoot: read.doesShoot, into: read.into },
        { port: 4190, browser: "/bin/chrome", doesShoot: true, into: DEFAULT_INTO },
    );
    assertStrictEquals(readGivingWayFlags([]).doesShoot, false, "serving is what it does alone");
    assertThrows(() => readGivingWayFlags(["--port", "four"]), GivingWayError, "not a number");
    assertThrows(() => readGivingWayFlags(["list"]), GivingWayError, "not a flag this reads");
});

/** `screenshots/` is the set a README shows, and a picture of a defect there reads as the panel. */
Deno.test("the pictures go anywhere but where the READMEs read theirs", () => {
    for (const into of [SHOT_DIRECTORY, `${SHOT_DIRECTORY}/under`, `./${SHOT_DIRECTORY}`]) {
        assertThrows(() => readGivingWayFlags(["--into", into]), GivingWayError, "READMEs");
    }
    const beside = readGivingWayFlags(["--into", `${SHOT_DIRECTORY}-giving-way`]);
    assertStrictEquals(beside.into, `${SHOT_DIRECTORY}-giving-way`, "a name beside it is not it");
    assert(DEFAULT_INTO.startsWith("dist/"), "and by default they go where git carries nothing");
});

/**
 * A region that failed is stated at the next draw, so every picture draws twice; the card is drawn
 * only under a pointer, so its picture hovers first; and the strips cannot be pressed when they
 * are what gave way.
 */
Deno.test("each picture reaches the state it is named for, and no further", () => {
    const pressed = { doesHover: false, mark: PANEL_MARK.screen, at: 0 };
    const folded = { doesHover: false, mark: PANEL_MARK.helperFold, at: 0 };
    assertEquals(composeGivingWayShot(PANEL_REGION.list).steps, [pressed], "a draw more");
    assertEquals(composeGivingWayShot(PANEL_REGION.strips).steps, [folded, folded], "no strips");
    const tip = composeGivingWayShot(PANEL_REGION.tip);
    assertStrictEquals(tip.steps[0]?.doesHover, true, "the card is opened by a pointer over it");
    assertEquals(tip.steps.slice(1), [pressed], "and stated at the draw after");
    const names = GIVING_WAY_REGIONS.map((region) => composeGivingWayShot(region).name);
    assertStrictEquals(new Set(names).size, GIVING_WAY_REGIONS.length, "one name per region");
});

/**
 * The promise the design rests on: the seam lives in a copy of the tree and never in the tree.
 * Held over the sources rather than a built file, because the reader of the sources is what would
 * have to change for this to stop being true.
 */
Deno.test("nothing a reader installs carries the line that makes a region give way", () => {
    const files = readBundleFiles();
    assert(files.length > 0, "the walk reached what a reader installs, rather than nothing");
    const carried = files.filter((file) => file.text.includes(GIVING_WAY_MARKER));
    assertEquals(carried.map((file) => file.path), [], "a source that ships carries the marker");
});
