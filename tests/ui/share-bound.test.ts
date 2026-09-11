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
import { MAXIMUM_TIPS } from "@/src/ui/panel-tip.ts";
import { composeShareTexts, MAXIMUM_SHARES } from "@/src/ui/panel-words.ts";

const HUNDRED = 100;
/** What a row holding something too small to state a point prints, in place of a share. */

/**
 * The widest section, which is the skills section on a healing screen: every caster's names at
 * `MAXIMUM_SKILLS`, the keys no announcement covered, and **two** rows closing it — what the
 * bound would not give a row to, and what no announcement covered at all (**ADR 0055**).
 */
const WIDEST_SECTION = MAXIMUM_SKILLS + MAXIMUM_CUT_PARTS + 2;
/** What a section costs a draw beyond its rows: the row named for nobody, and its heading. */
const SECTION_EXTRAS = 2;
/**
 * And the widest screen: an opened row's three sections, their extras, and the two pinned. The cut
 * by key carries a third row of its own — a fold there is bounded too (**ADR 0055**).
 */
const WIDEST_SCREEN = MAXIMUM_COMBATANTS + SECTION_EXTRAS +
    (WIDEST_SECTION + 1) +
    (MAXIMUM_CUT_PARTS + SECTION_EXTRAS + 1) + 2;

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
