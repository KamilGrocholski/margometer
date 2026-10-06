/**
 * The card height report: one card per ranking row of every screen, and the summary written off
 * them. That the heights are the panel's is `src/ui/panel-element.ts`'s to hold; these hold the
 * text.
 */

import { assert, assertEquals, assertExists, assertStrictEquals, assertThrows } from "@std/assert";
import { PANEL_METRIC, SCREEN_ORDER } from "#/src/ui/panel-screen.ts";
import {
    addCardHeight,
    ARGUMENTS_MAXIMUM,
    type CardHeight,
    CARDS_MAXIMUM,
    formatHeightReport,
    formatTallestReport,
    parseCardArguments,
    tallyCardHeights,
} from "#/tools/card-height.ts";
import { CardHeightError } from "#/tools/margometer-tool-error.ts";
import { readRecordedMaterial, replayRecordedMaterial } from "#/tools/recorded-material.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
const HILDUR_NAME = "2026-08-06-tempest-grupa-vs-hildur-1785244275300-none";
/** The cheapest recording to replay, measured 2026-10-06: 8 cards in 0.2 ms. */
const CENTAUR = "captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json";
/** What `--tallest` lists, which the tool states as a screenful. */
const TALLEST_LISTED = 12;

Deno.test("a recording opens a card per ranking row on every screen, and the report sums them", () => {
    const heights = tallyCardHeights(replayRecordedMaterial(readRecordedMaterial([HILDUR])));
    assertStrictEquals(heights.length % SCREEN_ORDER.length, 0, "the same rows on every screen");
    for (const screen of SCREEN_ORDER) {
        assert(heights.some((height) => height.screen === screen), `${screen} opens cards`);
    }
    assert(heights.every((height) => height.recording === HILDUR_NAME), "each names its recording");
    const report = formatHeightReport(heights);
    assertStrictEquals(report[0], `cards          ${heights.length}`, "the count comes first");
    const distribution = (report.at(-1) ?? "").split(" ").filter((bucket) => bucket.includes(":"));
    const counted = distribution.reduce((sum, bucket) => sum + Number(bucket.split(":")[1]), 0);
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
    const many = Array.from({ length: TALLEST_LISTED + 1 }, (_, index) => composeHeight(index + 1));
    const listed = formatTallestReport(many);
    assertStrictEquals(listed.length, TALLEST_LISTED, "a screenful");
    assertStrictEquals(
        listed[0],
        `${TALLEST_LISTED + 1} lines  healthGiven  card ${TALLEST_LISTED + 1}  ${HILDUR_NAME}`,
        "the tallest first, with where it was opened",
    );
    assertStrictEquals(formatTallestReport(many.slice(0, 1)).length, 1, "and one is listed as one");
});

Deno.test("a run holds as many cards as its bound, and one more is refused", () => {
    const heights = Array.from({ length: CARDS_MAXIMUM - 1 }, () => composeHeight(1));
    addCardHeight(heights, composeHeight(2));
    assertStrictEquals(heights.length, CARDS_MAXIMUM, "the last card the bound holds is added");
    assertThrows(
        () => addCardHeight(heights, composeHeight(3)),
        CardHeightError,
        `more cards than the ${CARDS_MAXIMUM}`,
    );
    assertStrictEquals(heights.length, CARDS_MAXIMUM, "and the one refused is not");
});

Deno.test("fights are tallied up to the bound on cards, and the fight past it is refused", () => {
    // A fight opens a row on every screen at a time, so one fight past is the nearest a run of
    // fights comes to one card past; the card itself is the case above.
    const [fight] = replayRecordedMaterial(readRecordedMaterial([CENTAUR]));
    assertExists(fight, "the recording replays");
    const perFight = tallyCardHeights([fight]).length;
    assertStrictEquals(CARDS_MAXIMUM % perFight, 0, "the bound is whole fights of this one");
    const copies = (count: number) => Array.from({ length: count }, () => fight);
    const atBound = tallyCardHeights(copies(CARDS_MAXIMUM / perFight));
    assertStrictEquals(atBound.length, CARDS_MAXIMUM, "every card, at the bound");
    assertThrows(
        () => tallyCardHeights(copies(CARDS_MAXIMUM / perFight + 1)),
        CardHeightError,
        `more cards than the ${CARDS_MAXIMUM}`,
    );
});

Deno.test("arguments are read up to their bound, and refused one past it", () => {
    const naming = (count: number) => Array.from({ length: count }, () => HILDUR);
    assertStrictEquals(
        parseCardArguments(naming(ARGUMENTS_MAXIMUM)).paths.length,
        ARGUMENTS_MAXIMUM,
        "every path, at the bound",
    );
    assertThrows(
        () => parseCardArguments(naming(ARGUMENTS_MAXIMUM + 1)),
        CardHeightError,
        `more than ${ARGUMENTS_MAXIMUM} arguments`,
    );
});
