/**
 * The card height report: one card per ranking row of every screen, and the summary written off
 * them. That the heights are the panel's is `src/ui/panel-tip.ts`'s to hold; these hold the text.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { PANEL_METRIC, SCREEN_ORDER } from "#/src/ui/panel-screen.ts";
import {
    type CardHeight,
    formatHeightReport,
    formatTallestReport,
    tallyCardHeights,
} from "#/tools/card-height.ts";
import { readRecordedMaterial, replayRecordedMaterial } from "#/tools/recorded-material.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
const HILDUR_NAME = "2026-08-06-tempest-grupa-vs-hildur-1785244275300-none";
/** What `--tallest` lists, which the tool states as a screenful. */
const TALLEST_LISTED = 12;

Deno.test("a recording opens a card per ranking row on every screen, and the report sums them", () => {
    const heights = tallyCardHeights(replayRecordedMaterial(readRecordedMaterial([HILDUR])));
    assertEquals(heights.length % SCREEN_ORDER.length, 0, "the same rows on every screen");
    for (const screen of SCREEN_ORDER) {
        assert(heights.some((one) => one.screen === screen), `${screen} opens cards`);
    }
    assert(heights.every((one) => one.recording === HILDUR_NAME), "each names its recording");
    const report = formatHeightReport(heights);
    assertStrictEquals(report[0], `cards          ${heights.length}`, "the count comes first");
    const distribution = (report.at(-1) ?? "").split(" ").filter((one) => one.includes(":"));
    const counted = distribution.reduce((sum, one) => sum + Number(one.split(":")[1]), 0);
    assertStrictEquals(counted, heights.length, "and the distribution accounts for every card");
});

Deno.test("a median is the middle card, and the lower middle of an even count", () => {
    assertEquals(
        formatHeightReport([3, 1, 2].map(composeHeight)).slice(1, 3),
        ["lines median   2", "lines tallest  3"],
        "an odd count has one middle",
    );
    assertEquals(
        formatHeightReport([4, 1, 3, 2].map(composeHeight)).slice(1, 3),
        ["lines median   2", "lines tallest  4"],
        "an even count takes the lower of its two",
    );
    assertEquals(
        formatHeightReport([7].map(composeHeight)).slice(1, 3),
        ["lines median   7", "lines tallest  7"],
        "and one card is its own middle",
    );
});

function composeHeight(lines: number): CardHeight {
    return {
        recording: HILDUR_NAME,
        screen: PANEL_METRIC.healthGiven,
        name: `card ${lines}`,
        lines,
        groups: 1,
        notes: 0,
    };
}

Deno.test("the tallest are listed tallest first, a screenful of them and no more", () => {
    const many = Array.from({ length: TALLEST_LISTED + 1 }, (_, at) => composeHeight(at + 1));
    const listed = formatTallestReport(many);
    assertStrictEquals(listed.length, TALLEST_LISTED, "a screenful");
    assertStrictEquals(
        listed[0],
        `${TALLEST_LISTED + 1} lines  healthGiven  card ${TALLEST_LISTED + 1}  ${HILDUR_NAME}`,
        "the tallest first, with where it was opened",
    );
    assertStrictEquals(formatTallestReport(many.slice(0, 1)).length, 1, "and one is listed as one");
});
