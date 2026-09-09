/**
 * The window beside the panel: what it reads, and what it draws.
 *
 * The rows are the panel's own by construction, so what is checked here is what the window adds —
 * the two sides counted apart, what a press opens, and the two states a fight can leave it in.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertNotStrictEquals,
    assertStrictEquals,
} from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import type { AuraStanding, ProvocationStanding } from "@/src/core/aura-standing.ts";
import type { TurnStatement } from "@/src/game/fight-underway.ts";
import { composePanelHost, type PanelPress } from "@/src/ui/panel-element.ts";
import {
    composeStandingReading,
    MAXIMUM_PROVOKED,
    type StandingTurn,
} from "@/src/ui/panel-standing.ts";
import { getColourForProfession, SIGNAL } from "@/src/ui/panel-look.ts";
import { getWordsForTurnState, PANEL_WORDS, STANDING_WORDS } from "@/src/ui/panel-words.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getPanelWithin,
    getTextsByClass,
    pressElement,
} from "@/tests/fake-document.ts";

const OURS = 1;
const THEIRS = 2;

const ROSTER = composeCombatantRoster([
    { id: 11, name: "Gracz 1", side: OURS, profession: "m", level: 40, healthMaximum: 100 },
    { id: 12, name: "Gracz 2", side: OURS, profession: "w", level: 40, healthMaximum: 100 },
    { id: 21, name: "Renegat 1", side: THEIRS, profession: "t", level: 40, healthMaximum: 100 },
]);

function composeStanding(
    casterId: number,
    skillId = 264,
    over: Partial<AuraStanding> = {},
): AuraStanding {
    return {
        skillId,
        skillName: skillId === 264 ? "Piętno bestii" : "Szadź",
        casterId,
        turnsElapsed: 3,
        turnsStated: 8,
        reach: "other-side",
        chosenTargetId: null,
        ...over,
    };
}

function composeProvocation(
    provokedId: number,
    casterId: number,
    over: Partial<ProvocationStanding> = {},
): ProvocationStanding {
    return {
        provokedId,
        skillId: 188,
        skillName: "Wyzywający okrzyk",
        casterId,
        turnsElapsed: 2,
        turnsStated: 5,
        ...over,
    };
}

/** A fight underway, numbered or not — what the window is handed wherever the turn is not it. */
function composeTurn(
    statement: TurnStatement | null,
    over: Partial<StandingTurn> = {},
): StandingTurn {
    return { statement, isOver: false, isOnAuto: false, ...over };
}

function draw(reading: ReturnType<typeof composeStandingReading> | null): {
    host: FakeElement;
    pressed: PanelPress[];
} {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    panel.showStanding(reading, false);
    return { host: panel.element as FakeElement, pressed };
}

function getWindow(host: FakeElement): FakeElement {
    // Folded, the frame wears a second class — which is how it says so.
    const found = getElementsWithin(host)
        .find((one) => one.className.split(" ")[0] === "MargoMeter-standing");
    assertExists(found, "the window stands beside the panel, under the same root");
    return found;
}

Deno.test("one row per skill, and the sides counted apart where the client named one", () => {
    const reading = composeStandingReading(
        [composeStanding(11), composeStanding(12), composeStanding(21)],
        [],
        ROSTER,
        OURS,
        composeTurn({ ordinal: 248, combatantId: 12 }),
        null,
    );
    assertStrictEquals(reading.rows.length, 1, "three casts of one skill are one row");
    assertStrictEquals(reading.rows[0]?.ours, 2, "two of them the reader's own");
    assertStrictEquals(reading.rows[0]?.theirs, 1, "and one the other side's");
    const { host } = draw(reading);
    // Two figures the colour tells apart, as the strip under the ranking states its sides —
    // never one figure with a mark in it. A slash there would read as a fraction beside `3 z 8`.
    assertEquals(
        getTextsByClass(getWindow(host), "standing-ours"),
        ["2"],
        "the reader's own side, in the ink the panel gives it",
    );
    assertEquals(
        getTextsByClass(getWindow(host), "standing-theirs"),
        ["1"],
        "and the other side's, in the other",
    );
    assertEquals(
        getTextsByClass(getWindow(host), "row-share"),
        [STANDING_WORDS.sideSeparator],
        "with a separator drawn quiet, because it divides nothing",
    );
});

Deno.test("a caster wears their own profession, and the side is said on the edge", () => {
    // ⚠️ The row used to be painted `ours`/`theirs` and the caster's profession was lost with it.
    // A player is a player wherever they stand, so the hue stays theirs and the side takes the
    // edge opposite the cap. **ADR 0065.**
    const reading = composeStandingReading(
        [composeStanding(11), composeStanding(21)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
        264,
    );
    const casters = reading.rows[0]?.casters ?? [];
    assertEquals(casters.map((one) => one.sidePart), ["ours", "theirs"], "one of each side");
    const { host } = draw(reading);
    const caps = getElementsWithin(getWindow(host)).filter((one) => one.className === "bar-cap");
    assertEquals(
        caps.map((one) => one.getAttribute("style")),
        [
            `background:${getColourForProfession("m")}`,
            `background:${getColourForProfession("t")}`,
        ],
        "the cap is the profession's and never the side's",
    );
    const rules = getElementsWithin(getWindow(host)).filter((one) => one.className === "row-side");
    assertEquals(
        rules.map((one) => one.getAttribute("style")),
        [`color:${SIGNAL.ours}`, `color:${SIGNAL.theirs}`],
        "and the rule on the edge is what says whose side they cast from",
    );
    // **W5: zero is a boundary.** The same two casters, on a fight the client named no side of
    // the reader's own on: the caps stand, and no rule does.
    const seatless = draw(
        composeStandingReading(
            [composeStanding(11), composeStanding(21)],
            [],
            ROSTER,
            null,
            composeTurn(null),
            264,
        ),
    );
    const window = getWindow(seatless.host);
    assertEquals(
        getElementsWithin(window).filter((one) => one.className === "bar-cap").length,
        2,
        "both casters are still drawn",
    );
    assertEquals(
        getElementsWithin(window).filter((one) => one.className === "row-side").length,
        0,
        "and neither wears a rule, because nothing can place them",
    );
});

Deno.test("a fight nothing named a side on counts nobody apart", () => {
    // `CONTEXT.md`: a panel that cannot tell one side from the other lists everybody rather than
    // guessing, so the row says how many and never whose.
    const reading = composeStandingReading(
        [composeStanding(11), composeStanding(21)],
        [],
        ROSTER,
        null,
        composeTurn(null),
        null,
    );
    assertStrictEquals(reading.rows[0]?.ours, null, "no side of the reader's own was stated");
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "row-value figure"),
        ["2"],
        "a plain count, which is a different claim from two figures",
    );
    const caster = reading.rows[0]?.casters[0];
    assertExists(caster, "and there is somebody it stands on");
    assertStrictEquals(
        caster.sidePart,
        "nobody",
        "and nobody can be placed on a side, so no row wears a rule",
    );
});

Deno.test("whoever holds the turn is drawn as a person, hue, side and all", () => {
    // ⚠️ The `Teraz` row drew a bare name: no cap and no rule, so the one character a reader is
    // watching hardest was the one the window said least about. A player is a player wherever
    // they stand (**ADR 0065**).
    const reading = composeStandingReading(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn({ ordinal: 48, combatantId: 21 }),
        null,
    );
    assertEquals(reading.holder?.name, "Renegat 1", "the roster places whoever holds it");
    const { host } = draw(reading);
    const row = getElementsWithin(getWindow(host)).find((one) => one.className === "row");
    assertExists(row, "and they are drawn as a row");
    assertEquals(
        row.children.find((one) => one.className === "bar-cap")?.getAttribute("style"),
        `background:${getColourForProfession("t")}`,
        "wearing their own profession's hue",
    );
    assertEquals(
        row.children.find((one) => one.className === "row-side")?.getAttribute("style"),
        `color:${SIGNAL.theirs}`,
        "and the rule saying which side they stand on",
    );
    // **W5: zero is a boundary.** The same turn, on a fight with no seat to read from: the hue
    // stands, because it is theirs, and the rule does not, because nothing can place them.
    const seatless = composeStandingReading([], [], ROSTER, null, {
        statement: { ordinal: 48, combatantId: 21 },
        isOver: false,
        isOnAuto: false,
    }, null);
    const alone = getElementsWithin(getWindow(draw(seatless).host));
    assertEquals(alone.filter((one) => one.className === "bar-cap").length, 1, "the cap stands");
    assertEquals(alone.filter((one) => one.className === "row-side"), [], "and no rule does");
});

/**
 * **ADR 0072.** Both halves of the boundary: the same statement stands while the fight is being
 * fought, and stands on nothing the moment the game stops numbering — which it does when the
 * fight ends and when the reader hands it over on the auto key.
 */
Deno.test("a turn the game has stopped numbering is not drawn, and the window says why", () => {
    const stated = { ordinal: 267, combatantId: 21 };
    const underway = composeStandingReading([], [], ROSTER, OURS, composeTurn(stated), null);
    assertStrictEquals(underway.turnState, "held", "a fight being fought is one being numbered");
    assertStrictEquals(underway.turnOrdinal, 267, "so the ordinal is drawn");
    assertEquals(underway.holder?.name, "Renegat 1", "and whoever the game numbered it for");

    const after = composeStandingReading(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(stated, { isOver: true }),
        null,
    );
    assertStrictEquals(after.turnState, "afterFight", "a fight that is over numbers nobody's");
    assertStrictEquals(after.turnOrdinal, null, "so the last ordinal is not drawn as now");
    assertStrictEquals(after.holder, null, "and nobody is drawn holding it");
    assertEquals(
        getTextsByClass(getWindow(draw(after).host), "empty"),
        [getWordsForTurnState("afterFight"), STANDING_WORDS.nothingStands],
        "the window says the fight ended, and never that the turn could not be read",
    );

    const running = composeStandingReading(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(stated, { isOnAuto: true }),
        null,
    );
    assertStrictEquals(running.turnState, "onAuto", "a fight the game runs itself numbers none");
    assertStrictEquals(running.turnOrdinal, null, "so what it stated before is not drawn either");
    assertEquals(
        getTextsByClass(getWindow(draw(running).host), "empty"),
        [getWordsForTurnState("onAuto"), STANDING_WORDS.nothingStands],
        "and says which kind of fight it is",
    );

    // Both are true of every fight fought on the auto key, and only one of them says why there
    // is no turn to draw.
    const both = composeStandingReading(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(stated, { isOver: true, isOnAuto: true }),
        null,
    );
    assertStrictEquals(both.turnState, "onAuto", "so a fight the game ran itself says that");
});

/** **W5**: the same two states on a fight the game never numbered at all. */
Deno.test("a fight nobody numbered says what it is, and never that it went unread", () => {
    const unread = composeStandingReading([], [], ROSTER, OURS, composeTurn(null), null);
    assertStrictEquals(
        unread.turnState,
        "unread",
        "a fight underway states one and this read none",
    );

    const auto = composeStandingReading(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(null, { isOver: true, isOnAuto: true }),
        null,
    );
    assertStrictEquals(auto.turnState, "onAuto", "and a fight the game ran itself states none");
    assertNotStrictEquals(
        getWordsForTurnState("onAuto"),
        getWordsForTurnState("unread"),
        "which are two answers, said in two sentences",
    );
});

Deno.test("a press opens the casters under a row, and a second press shuts them", () => {
    const standings = [composeStanding(11), composeStanding(12)];
    const shut = composeStandingReading(standings, [], ROSTER, OURS, composeTurn(null), null);
    const { host, pressed } = draw(shut);
    assertEquals(getTextsByClass(getWindow(host), "row-name").length, 1, "the skill, and nobody");
    const row = getElementsWithin(getWindow(host))
        .find((one) => one.attributes.get("data-standing") !== undefined);
    assertExists(row, "a counted row carries the mark a press is read off");
    pressElement(host, "pointerdown", row);
    assertEquals(pressed, [{ kind: "standing", stated: "264" }], "which names the skill opened");

    const open = composeStandingReading(standings, [], ROSTER, OURS, composeTurn(null), 264);
    const drawn = draw(open);
    assertEquals(
        getTextsByClass(getWindow(drawn.host), "row-name"),
        ["Piętno bestii", "Gracz 1", "Gracz 2"],
        "and opened, the casters stand under the skill they cast",
    );
    assertEquals(
        getTextsByClass(getWindow(drawn.host), "row-value figure").slice(1),
        ["3 z 8 tur", "3 z 8 tur"],
        "each saying what has passed of what the table states, never what is left",
    );
});

/**
 * Both halves in one place: the gesture the window must not answer, and the one the panel still
 * must. Held apart by `contains` at the root, because the caster's name a hand lands on carries no
 * attribute saying which of the two windows drew it. **ADR 0071.**
 */
Deno.test("a right press in the window moves nothing, and one on the panel steps back", () => {
    const reading = composeStandingReading(
        [composeStanding(11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
        264,
    );
    const { host, pressed } = draw(reading);
    const names = getElementsWithin(getWindow(host)).filter((one) => one.className === "row-name");
    // The deepest element under the hand, which is a caster's name inside the opened row.
    const inside = names.find((one) => one.textContent === "Gracz 1");
    assertExists(inside, "the caster stands under the row that was opened");
    pressElement(host, "contextmenu", inside);
    assertEquals(pressed, [], "a right press in the window beside the panel asks for nothing");

    pressElement(host, "contextmenu", getPanelWithin(host));
    assertEquals(pressed, [{ kind: "back" }], "and one on the panel is still the way back");
});

Deno.test("a row nobody opened stays shut, and an id nothing stands under opens nothing", () => {
    const reading = composeStandingReading(
        [composeStanding(11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
        999,
    );
    assertStrictEquals(reading.openSkillId, null, "an id no row carries opens no row");
    assertEquals(
        getTextsByClass(getWindow(draw(reading).host), "row-name"),
        ["Piętno bestii"],
        "so the window draws the counted rows and nothing under them",
    );
});

Deno.test("a fight with nothing standing says so, and one with no turn says that too", () => {
    const reading = composeStandingReading([], [], ROSTER, OURS, composeTurn(null), null);
    const { host } = draw(reading);
    const said = getTextsByClass(getWindow(host), "empty");
    assertEquals(
        said,
        [getWordsForTurnState("unread"), STANDING_WORDS.nothingStands],
        "both are readings rather than an absence of one",
    );
});

Deno.test("a folded window is its bar, and a fight it knows nothing about draws no body", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    const host = panel.element as FakeElement;
    panel.showStanding(
        composeStandingReading([composeStanding(11)], [], ROSTER, OURS, composeTurn(null), null),
        true,
    );
    assertEquals(getTextsByClass(getWindow(host), "row-name"), [], "folded, no row is composed");
    const bar = getElementsWithin(getWindow(host)).find((one) => one.className === "standing-bar");
    assertExists(bar, "and the bar it folded to is still there to press");
    assertStrictEquals(
        bar.attributes.get("data-grip"),
        "standing",
        "wearing its own window's name",
    );
    panel.showStanding(null, false);
    assertEquals(getTextsByClass(getWindow(host), "row-name"), [], "and a fight nobody has seen");
});

Deno.test("the window's fold is its own, and never the panel's", () => {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    const host = panel.element as FakeElement;
    panel.showStanding(
        composeStandingReading([], [], ROSTER, OURS, composeTurn(null), null),
        false,
    );
    const control = getElementsWithin(getWindow(host))
        .find((one) => one.attributes.get("data-standing-fold") !== undefined);
    assertExists(control, "the window's bar carries a fold of its own");
    assert(
        control.attributes.get("data-fold") === undefined,
        "and never the panel's, which would put both windows away at once",
    );
    pressElement(host, "pointerdown", control);
    assertEquals(pressed, [{ kind: "standing-fold" }], "so the press is the window's own");
});

Deno.test("a shout is drawn under whoever is holding it, and the turns are the cast's", () => {
    // ⚠️ Inverted on 2026-09-09: the held character led and the holder hung under them as a
    // sentence. **ADR 0067** carries the fold and why it is not the alternative ADR 0062 refused.
    const reading = composeStandingReading(
        [],
        [composeProvocation(21, 11)],
        ROSTER,
        OURS,
        composeTurn(null),
        null,
    );
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "row-name"),
        ["Gracz 1", "Renegat 1"],
        "whoever is holding, and under them whom",
    );
    assertEquals(
        getTextsByClass(getWindow(host), "row-value figure"),
        ["2 z 5 tur"],
        "the turns stand once, on the cast, and never on the character it holds",
    );
    const rows = getElementsWithin(getWindow(host)).filter((one) =>
        one.className.split(" ")[0] === "row"
    );
    assertEquals(
        rows.map((one) => one.className.includes("standing-under")),
        [false, true],
        "and the held character is the one nested under the row above it",
    );
    assertEquals(
        rows.map((one) =>
            one.children.find((part) => part.className === "bar-cap")
                ?.getAttribute("style")
        ),
        [
            `background:${getColourForProfession("m")}`,
            `background:${getColourForProfession("t")}`,
        ],
        "each wearing their own profession, holder and held alike",
    );
    assertEquals(
        rows.map((one) =>
            one.children.find((part) => part.className === "row-side")
                ?.getAttribute("style")
        ),
        [`color:${SIGNAL.ours}`, `color:${SIGNAL.theirs}`],
        "and their own side, which is what a shout crosses",
    );
});

Deno.test("one cast holding two characters is one row, and states its turns once", () => {
    // The case the fold exists for. `captures/` holds it once, in the fight written from side 2:
    // one shout naming two players, measured 2026-09-09.
    const reading = composeStandingReading(
        [],
        [composeProvocation(11, 21), composeProvocation(12, 21)],
        ROSTER,
        OURS,
        composeTurn(null),
        null,
    );
    assertStrictEquals(reading.provoked.length, 1, "one caster, so one group");
    assertStrictEquals(reading.provoked[0]?.provoked.length, 2, "holding both of them");
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "row-name"),
        ["Renegat 1", "Gracz 1", "Gracz 2"],
        "the holder once, and both they hold under them",
    );
    assertEquals(
        getTextsByClass(getWindow(host), "row-value figure"),
        ["2 z 5 tur"],
        "one figure and not two: over `captures/` every such cast stated one",
    );
    // **ADR 0062**: the heading counts characters held, which the fold does not change.
    assertEquals(
        getTextsByClass(getWindow(host), "figure").filter((one) => one === "2").length,
        1,
        "and the heading goes on counting the people, never the casts",
    );
});

Deno.test("two casters holding apart stand apart, in the order the fight named them", () => {
    const reading = composeStandingReading(
        [],
        [composeProvocation(21, 12), composeProvocation(11, 21)],
        ROSTER,
        OURS,
        composeTurn(null),
        null,
    );
    assertEquals(
        reading.provoked.map((one) => one.casterName),
        ["Gracz 2", "Renegat 1"],
        "a group first named stands higher, so none moves under the hand",
    );
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "row-name"),
        ["Gracz 2", "Renegat 1", "Renegat 1", "Gracz 1"],
        "each holder with their own under them",
    );
});

Deno.test("a holder the roster cannot place is still drawn, and says so", () => {
    const reading = composeStandingReading(
        [],
        [composeProvocation(21, -1)],
        ROSTER,
        OURS,
        composeTurn(null),
        null,
    );
    const { host } = draw(reading);
    // **A11**: this layer asserts nothing, so a caster nobody can place falls back rather than
    // taking the section down with it.
    assertEquals(
        getTextsByClass(getWindow(host), "row-name"),
        [PANEL_WORDS.withoutActor, "Renegat 1"],
        "the shout is still holding somebody, whoever threw it",
    );
    const rows = getElementsWithin(getWindow(host)).filter((one) =>
        one.className.split(" ")[0] === "row"
    );
    assertEquals(
        rows[0]?.children.filter((part) => part.className === "row-side").length,
        0,
        "and nothing places them on a side, so they wear no rule",
    );
});

Deno.test("a fight holding only a provocation is not a fight where nothing stands", () => {
    const reading = composeStandingReading(
        [],
        [composeProvocation(21, 11)],
        ROSTER,
        OURS,
        composeTurn(null),
        null,
    );
    assertEquals(
        getTextsByClass(getWindow(draw(reading).host), "empty"),
        [getWordsForTurnState("unread")],
        "the turn is unread, and the standing section says nothing of the sort",
    );
});

Deno.test("the provoked stop at their stated maximum, and one under it is drawn whole", () => {
    // **W5**: the bound is a boundary, so the row below it is asserted beside it. The clamp is
    // what stands in for an assertion here, because this layer asserts nothing (**A11**).
    const many: ProvocationStanding[] = [];
    for (let at = 0; at < MAXIMUM_PROVOKED + 4; at += 1) many.push(composeProvocation(21, 11));
    // Counted in characters and not in groups: the clamp stands before the fold, so the bound is
    // on the people the section draws however few casts they arrive under (**ADR 0067**).
    const countHeld = (reading: ReturnType<typeof composeStandingReading>) =>
        reading.provoked.reduce((sum, one) => sum + one.provoked.length, 0);
    const over = composeStandingReading([], many, ROSTER, OURS, composeTurn(null), null);
    assertStrictEquals(countHeld(over), MAXIMUM_PROVOKED, "past it, the rest are dropped");
    const under = composeStandingReading(
        [],
        many.slice(0, MAXIMUM_PROVOKED - 1),
        ROSTER,
        OURS,
        composeTurn(null),
        null,
    );
    assertStrictEquals(countHeld(under), MAXIMUM_PROVOKED - 1, "one below it, all of them");
});

Deno.test("a whole-team skill says nothing about whom, because there is nothing to say", () => {
    const reading = composeStandingReading(
        [composeStanding(11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
        264,
    );
    assertStrictEquals(reading.provoked.length, 0, "a cast reaching a whole side holds nobody");
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "section-words"),
        [STANDING_WORDS.now, STANDING_WORDS.standing],
        "so no section is drawn to name whom it is under",
    );
});
