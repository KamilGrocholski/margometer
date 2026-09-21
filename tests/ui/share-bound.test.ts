/**
 * The two writers holding a bound of their own — the shares a column prints, the cards a draw
 * registers — against the widest thing the panel can ask either of them for.
 *
 * Goal: catch a screen wider than a writer, where the rows past the bound print no share and
 * carry no card, both without a word. Method: the arithmetic tying each writer's constant to the
 * panel's own, plus a column as wide as the widest section there is, written and added up. This
 * is the one place both may be read at once — `tests/ui/shelf-bound.test.ts`'s own shape.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { getPointsFromShareText } from "@/tests/share-text.ts";
import { MAXIMUM_CUT_PARTS, MAXIMUM_SKILLS } from "@/src/ui/panel-reading.ts";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import {
    MAXIMUM_CASTERS,
    MAXIMUM_CHARGED_ROWS,
    MAXIMUM_PROVOKED,
    MAXIMUM_STANDING_ROWS,
} from "@/src/ui/panel-standing.ts";
import { MAXIMUM_TIPS } from "@/src/ui/panel-tip.ts";
import { composeShareTexts, MAXIMUM_SHARES } from "@/src/ui/panel-words.ts";

const HUNDRED = 100;

/**
 * The widest section, which is the skills section on `damageTakenApplied`: every striker's names at
 * `MAXIMUM_SKILLS`, the keys no announcement covered, and **two** rows closing it — what the
 * bound would not give a row to, and what no announcement covered at all (**ADR 0055**).
 */
const WIDEST_SECTION = MAXIMUM_SKILLS + MAXIMUM_CUT_PARTS + 2;
/** What a section costs a draw beyond its rows: the row named for nobody, and its heading. */
const SECTION_EXTRAS = 2;
/** What the crumb costs the register, and it is one wherever a level is open (**ADR 0086**). */
const CRUMB_CARDS = 1;
/**
 * And the widest screen: an opened row's three sections, their extras, the two pinned, and the
 * crumb over the lot. The cut by key carries a third row of its own — a fold there is bounded too
 * (**ADR 0055**).
 */
const WIDEST_SCREEN = MAXIMUM_COMBATANTS + SECTION_EXTRAS +
    (WIDEST_SECTION + 1) +
    (MAXIMUM_CUT_PARTS + SECTION_EXTRAS + 1) + 2 + CRUMB_CARDS;

Deno.test("the share writer holds every row the widest section can draw", () => {
    assert(
        MAXIMUM_SHARES >= WIDEST_SECTION,
        `${MAXIMUM_SHARES} shares is under the ${WIDEST_SECTION} rows a skill cut may come to`,
    );
});

Deno.test("the card register holds every row the widest screen can draw", () => {
    assert(
        MAXIMUM_TIPS >= WIDEST_SCREEN,
        `${MAXIMUM_TIPS} cards is under the ${WIDEST_SCREEN} rows one screen may come to`,
    );
});

/**
 * And the widest that window: the row the turn is numbered for, the charge band, every skill row
 * it clamps to, the casters under the one row that is open, and the provocation section — a held
 * character and the cast holding them, because the clamp is over the pairs and the widest is one
 * cast each (**ADR 0098**). The band is counted because every row that window draws carries a
 * card and not the ones naming a person alone (**ADR 0100**).
 */
const WIDEST_STANDING_WINDOW = 1 + MAXIMUM_CHARGED_ROWS + MAXIMUM_STANDING_ROWS +
    MAXIMUM_CASTERS + MAXIMUM_PROVOKED * 2;

/**
 * The window beside the panel fills a register of its own, because it is drawn before the panel
 * and the panel's own draw resets the panel's (**ADR 0086**). So its width is asked separately,
 * and every person's row under a skill row registers a card of its own (**ADR 0098**).
 */
Deno.test("the card register holds every row the window beside the panel can draw", () => {
    assert(
        MAXIMUM_TIPS >= WIDEST_STANDING_WINDOW,
        `${MAXIMUM_TIPS} cards is under the ${WIDEST_STANDING_WINDOW} rows that window may come to`,
    );
});

Deno.test("a section as wide as the panel allows states a share on every row", () => {
    const amounts = Array.from({ length: WIDEST_SECTION }, (_, at) => at + 1);
    const whole = amounts.reduce((sum, one) => sum + one, 0);
    const shares = composeShareTexts(amounts, whole);

    assertStrictEquals(
        shares.length,
        amounts.length,
        "one share is written for every row that was drawn",
    );
    const sum = shares.reduce((held, text) => held + getPointsFromShareText(text), 0);
    assertEquals(sum, HUNDRED, "and the column a reader adds up comes to the whole");
});

/** The sample it must flag: past the writer's own bound the answer is short, and says nothing. */
Deno.test("a column past the writer's bound is short, which is why the bound is held", () => {
    const amounts = Array.from({ length: MAXIMUM_SHARES + 1 }, () => 1);
    const shares = composeShareTexts(amounts, amounts.length);

    assertStrictEquals(shares.length, MAXIMUM_SHARES, "the writer answers for what it took");
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
    const full = Array.from({ length: MAXIMUM_SHARES }, () => 1);
    const shares = composeShareTexts(full, full.length);
    assertStrictEquals(shares.length, MAXIMUM_SHARES, "a column exactly as wide as the bound");
    const sum = shares.reduce((held, text) => held + getPointsFromShareText(text), 0);
    assertEquals(sum, HUNDRED, "and it still comes to the whole");

    const alone = composeShareTexts([7], 7);
    assertStrictEquals(alone.length, 1, "one row is one share");
    assertStrictEquals(getPointsFromShareText(alone[0] ?? ""), HUNDRED, "and it holds all of it");

    assertEquals(composeShareTexts([], 0), [], "a column of nothing states nothing");
});
