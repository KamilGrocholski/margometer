/**
 * The share writer's own bound against the widest column the panel can ask it for.
 *
 * Goal: catch a screen wider than the writer, where the rows past the bound print no share, without
 * a word. Method: the arithmetic tying the writer's constant to the panel's own, plus a column as
 * wide as the widest section there is, written and added up.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { CUT_PARTS_MAXIMUM, SKILLS_MAXIMUM } from "#/src/ui/panel-reading.ts";
import { formatShares, SHARES_MAXIMUM } from "#/src/ui/panel-words.ts";
import { parseSharePoints } from "#/tests/share-text.ts";

const HUNDRED = 100;

/**
 * The widest section, which is the skills section on `damageTakenApplied`: every striker's names at
 * `SKILLS_MAXIMUM`, the keys no announcement covered, and **two** rows closing it — what the bound
 * would not give a row to, and what no announcement covered at all (`develop ADR 0055`).
 */
const WIDEST_SECTION = SKILLS_MAXIMUM + CUT_PARTS_MAXIMUM + 2;

Deno.test("the share writer holds every row the widest section can draw", () => {
    assert(
        SHARES_MAXIMUM >= WIDEST_SECTION,
        `${SHARES_MAXIMUM} shares is under the ${WIDEST_SECTION} rows a skill cut may come to`,
    );
});

Deno.test("a section as wide as the panel allows states a share on every row", () => {
    const amounts = Array.from({ length: WIDEST_SECTION }, (_, at) => at + 1);
    const whole = amounts.reduce((sum, one) => sum + one, 0);
    const shares = formatShares(amounts, whole);

    assertStrictEquals(
        shares.length,
        amounts.length,
        "one share is written for every row that was drawn",
    );
    const sum = shares.reduce((held, text) => held + parseSharePoints(text), 0);
    assertEquals(sum, HUNDRED, "and the column a reader adds up comes to the whole");
});

/** The sample it must flag: past the writer's own bound the answer is short, and says nothing. */
Deno.test("a column past the writer's bound is short, which is why the bound is held", () => {
    const amounts = Array.from({ length: SHARES_MAXIMUM + 1 }, () => 1);
    const shares = formatShares(amounts, amounts.length);

    assertStrictEquals(shares.length, SHARES_MAXIMUM, "the writer answers for what it took");
    assert(
        shares.length < amounts.length,
        "so a section past it would draw a row with no share on it",
    );
});

/**
 * The bound itself, and the two ends below it. A test standing only past the bound cannot tell a
 * writer that stops **at** it from one that stops a row early, and zero is a boundary like any
 * other (**W5**): an empty column is what a section drawn before anything landed asks for.
 */
Deno.test("the writer answers at its own bound, at one row, and at none", () => {
    const full = Array.from({ length: SHARES_MAXIMUM }, () => 1);
    const shares = formatShares(full, full.length);
    assertStrictEquals(shares.length, SHARES_MAXIMUM, "a column exactly as wide as the bound");
    const sum = shares.reduce((held, text) => held + parseSharePoints(text), 0);
    assertEquals(sum, HUNDRED, "and it still comes to the whole");

    const alone = formatShares([7], 7);
    assertStrictEquals(alone.length, 1, "one row is one share");
    assertStrictEquals(parseSharePoints(alone[0] ?? ""), HUNDRED, "and it holds all of it");

    assertEquals(formatShares([], 0), [], "a column of nothing states nothing");
});
