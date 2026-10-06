/**
 * The two writers holding a bound of their own — the shares a column prints, the cards a draw
 * registers — against the widest thing the panel can ask either of them for.
 *
 * Goal: catch a screen wider than a writer, where the rows past the bound print no share and carry
 * no card, both without a word. Method: the arithmetic tying each writer's constant to the panel's
 * own, plus a column as wide as the widest section there is, written and added up.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { CUT_PARTS_MAXIMUM, SKILLS_MAXIMUM } from "#/src/ui/panel-content.ts";
import { CARDS_DRAWN_MAXIMUM } from "#/src/ui/panel-element.ts";
import { CHARGED_ROWS_MAXIMUM, PROVOKED_MAXIMUM } from "#/src/ui/panel-helper.ts";
import { formatSharesApportioned, SHARES_MAXIMUM } from "#/src/ui/panel-words.ts";
import { parseSharePoints } from "#/tests/share-text.ts";

const HUNDRED = 100;

/**
 * The widest section, which is the skills section on `damageTaken`: every striker's names at
 * `SKILLS_MAXIMUM`, the keys no announcement covered, and **two** rows closing it — what the bound
 * would not give a row to, and what no announcement covered at all (`develop ADR 0055`).
 */
const WIDEST_SECTION = SKILLS_MAXIMUM + CUT_PARTS_MAXIMUM + 2;
/** What a section costs a draw beyond its rows: the row named for nobody, and its heading. */
const SECTION_EXTRAS = 2;
/**
 * What the panel's window registers beside its list, one card each: the crumb over an open level,
 * the fight's line in the header, and the row of what no row holds under the list.
 */
const AROUND_LIST_CARDS = 3;
/**
 * And the widest screen: an opened row's three sections and their extras, the two pinned, and
 * what stands around the list. The cut by key carries a third row of its own — what no kind was
 * stated for — and a fold there is bounded too (`develop ADR 0055`).
 */
const WIDEST_SCREEN = COMBATANTS_MAXIMUM + SECTION_EXTRAS +
    (WIDEST_SECTION + 1) +
    (CUT_PARTS_MAXIMUM + SECTION_EXTRAS + 1) + 2 + AROUND_LIST_CARDS;

/**
 * And the widest the window beside the panel draws: the row the turn is numbered for, the charge
 * band, and the provocation section — a held character and the cast holding them, because the
 * clamp is over the pairs and the widest is one cast each (`develop ADR 0098`). The band is counted
 * because every row that window draws carries a card (`develop ADR 0100`).
 */
const WIDEST_HELPER_WINDOW = 1 + CHARGED_ROWS_MAXIMUM + PROVOKED_MAXIMUM * 2;

Deno.test("the share writer holds every row the widest section can draw", () => {
    assert(
        SHARES_MAXIMUM >= WIDEST_SECTION,
        `${SHARES_MAXIMUM} shares is under the ${WIDEST_SECTION} rows a skill cut may come to`,
    );
});

Deno.test("the card register holds every row the widest screen can draw", () => {
    assert(
        CARDS_DRAWN_MAXIMUM >= WIDEST_SCREEN,
        `${CARDS_DRAWN_MAXIMUM} cards is under the ${WIDEST_SCREEN} rows one screen may come to`,
    );
});

/**
 * The window beside the panel fills a register of its own, because it is drawn apart from the
 * panel and the panel's own draw resets the panel's (`develop ADR 0086`), so its width is asked
 * separately.
 */
Deno.test("the card register holds every row the window beside the panel can draw", () => {
    assert(
        CARDS_DRAWN_MAXIMUM >= WIDEST_HELPER_WINDOW,
        `${CARDS_DRAWN_MAXIMUM} cards is under the ${WIDEST_HELPER_WINDOW} rows that window draws`,
    );
});

Deno.test("a section as wide as the panel allows states a share on every row", () => {
    const amounts = Array.from({ length: WIDEST_SECTION }, (_, index) => index + 1);
    const whole = amounts.reduce((sum, amount) => sum + amount, 0);
    const shares = formatSharesApportioned(amounts, whole);

    assertStrictEquals(
        shares.length,
        amounts.length,
        "one share is written for every row that was drawn",
    );
    const sum = shares.reduce((held, text) => held + parseSharePoints(text), 0);
    assertStrictEquals(sum, HUNDRED, "and the column a reader adds up comes to the whole");
});

/** The sample it must flag: past the writer's own bound the answer is short, and says nothing. */
Deno.test("a column past the writer's bound is short, which is why the bound is held", () => {
    const amounts = Array.from({ length: SHARES_MAXIMUM + 1 }, () => 1);
    const shares = formatSharesApportioned(amounts, amounts.length);

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
    const shares = formatSharesApportioned(full, full.length);
    assertStrictEquals(shares.length, SHARES_MAXIMUM, "a column exactly as wide as the bound");
    const sum = shares.reduce((held, text) => held + parseSharePoints(text), 0);
    assertStrictEquals(sum, HUNDRED, "and it still comes to the whole");

    const alone = formatSharesApportioned([7], 7);
    assertStrictEquals(alone.length, 1, "one row is one share");
    assertStrictEquals(parseSharePoints(alone[0] ?? ""), HUNDRED, "and it holds all of it");

    assertEquals(formatSharesApportioned([], 0), [], "a column of nothing states nothing");
});
