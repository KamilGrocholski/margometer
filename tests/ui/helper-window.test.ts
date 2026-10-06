/**
 * The window beside the panel: what it reads, and what it draws.
 *
 * The rows are the panel's own by construction, so what is checked here is what the window adds —
 * the two sides counted apart, what a press opens, and the two states a fight can leave it in.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import type { ProvocationStanding } from "#/src/core/aura-standing.ts";
import type { ChargedSkillStanding, ChargedSkillState } from "#/src/core/charged-skill.ts";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import type { TurnStatement } from "#/src/core/fight-session.ts";
import { PANEL_WINDOW } from "#/src/ui/panel-choice.ts";
import { PANEL_INTENT, type PanelIntent } from "#/src/ui/panel-intent.ts";
import { formatColour, lookupColourForProfession, SIGNAL } from "#/src/ui/panel-palette.ts";
import {
    HELPER_ABSENCE,
    presentHelper,
    PROVOKED_MAXIMUM,
    type StandingTurn,
} from "#/src/ui/panel-helper.ts";
import { getWordsForTurnState, HELPER_WORDS, PANEL_WORDS } from "#/src/ui/panel-words.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getPanelWithin,
    getTextsByClass,
    pointAtElement,
    pressElement,
} from "#/tests/fake-document.ts";
import { readCard } from "#/tests/drawn-card.ts";
import { initTestView, NOTHING_WAITING } from "#/tests/panel-view.ts";

const OURS = 1;
const THEIRS = 2;

const ROSTER = indexCombatantRoster([
    { id: 11, name: "Gracz 1", side: OURS, profession: "m", level: 40, healthMaximum: 100 },
    { id: 12, name: "Gracz 2", side: OURS, profession: "w", level: 40, healthMaximum: 100 },
    { id: 21, name: "Renegat 1", side: THEIRS, profession: "t", level: 40, healthMaximum: 100 },
]);

/**
 * Both cells of a person's row shorten — the name by the panel's own rule, the okrzyk down to the
 * floor `develop ADR 0097` gave it — and until `develop ADR 0098` no row here carried a card, so
 * what either of them cut was cut for good. A nickname past the 27 characters a card's name folds
 * at is what makes the claim mean something: the row states a prefix, the card states the lot.
 */
const CUT_NAME = "NajdluzszyNickJakiPrzeszedl";

const CUT_ROSTER = indexCombatantRoster([
    { id: 11, name: CUT_NAME, side: OURS, profession: "m", level: 40, healthMaximum: 100 },
    { id: 21, name: "Renegat 1", side: THEIRS, profession: "t", level: 40, healthMaximum: 100 },
]);

/**
 * A blow long enough that the name cell has to cut it, so the card's claim means something: the
 * row states a prefix and the card states the lot. `CUT_NAME` does the same for a person's row.
 */
const CUT_BLOW = "Lodowe Pandemonium Obrońcy Pustkowi";

Deno.test("whoever holds the turn is drawn as a person, hue, side and all", () => {
    // ⚠️ The `Teraz` row drew a bare name: no cap and no rule, so the one character a reader is
    // watching hardest was the one the window said least about. A player is a player wherever
    // they stand (`develop ADR 0065`).
    const reading = presentHelper(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn({ ordinal: 48, combatantId: 21 }),
    );
    assertEquals(reading.turnHolder?.name, "Renegat 1", "the roster places whoever holds it");
    const { host } = draw(reading);
    const row = getElementsWithin(getWindow(host))
        .find((descendant) => descendant.className.split(" ")[0] === "row");
    assertExists(row, "and they are drawn as a row");
    assertEquals(
        row.children.find((child) => child.className === "bar-cap")?.getAttribute("style"),
        `background:${formatColour(lookupColourForProfession("t"))}`,
        "wearing their own profession's hue",
    );
    assertEquals(
        row.children.find((child) => child.className === "row-side")?.getAttribute("style"),
        `color:${formatColour(SIGNAL.theirs)}`,
        "and the rule saying which side they stand on",
    );
    // **W5: zero is a boundary.** The same turn, on a fight with no seat to read from: the hue
    // stands, because it is theirs, and the rule does not, because nothing can place them.
    const seatless = presentHelper(
        [],
        [],
        ROSTER,
        null,
        {
            statement: { ordinal: 48, combatantId: 21 },
            isOver: false,
            isOnAuto: false,
        },
    );
    const alone = getElementsWithin(getWindow(draw(seatless).host));
    assertEquals(
        alone.filter((descendant) => descendant.className === "bar-cap").length,
        1,
        "the cap stands",
    );
    assertEquals(
        alone.filter((descendant) => descendant.className === "row-side"),
        [],
        "and no rule does",
    );
});

/** A fight underway, numbered or not — what the window is handed wherever the turn is not it. */
function composeTurn(
    statement: TurnStatement | null,
    over: Partial<StandingTurn> = {},
): StandingTurn {
    return { statement, isOver: false, isOnAuto: false, ...over };
}

function draw(reading: ReturnType<typeof presentHelper>): {
    host: FakeElement;
    pressed: PanelIntent[];
} {
    const document = composeFakeDocument();
    const pressed: PanelIntent[] = [];
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    panel.renderHelper(reading, false);
    return { host: panel.element as FakeElement, pressed };
}

function getWindow(host: FakeElement): FakeElement {
    // Folded, the frame wears a second class — which is how it says so.
    const helperWindow = getElementsWithin(host)
        .find((descendant) => descendant.className.split(" ")[0] === "MargoMeter-helper");
    assertExists(helperWindow, "the window stands beside the panel, under the same root");
    return helperWindow;
}

/**
 * `develop ADR 0072`. Both halves of the boundary: the same statement stands while the fight is
 * being fought, and stands on nothing the moment the game stops numbering — which it does when the
 * fight ends and when the reader hands it over on the auto key.
 */
Deno.test("a turn the game has stopped numbering is not drawn, and the window says why", () => {
    const stated = { ordinal: 267, combatantId: 21 };
    const underway = presentHelper(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(stated),
    );
    assertStrictEquals(underway.turnState, "held", "a fight being fought is one being numbered");
    assertStrictEquals(underway.turnOrdinal, 267, "so the ordinal is drawn");
    assertEquals(underway.turnHolder?.name, "Renegat 1", "and whoever the game numbered it for");

    const after = presentHelper(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(stated, { isOver: true }),
    );
    assertStrictEquals(after.turnState, "afterFight", "a fight that is over numbers nobody's");
    assertStrictEquals(after.turnOrdinal, null, "so the last ordinal is not drawn as now");
    assertStrictEquals(after.turnHolder, null, "and nobody is drawn holding it");
    assertEquals(
        getTextsByClass(getWindow(draw(after).host), "empty"),
        [getWordsForTurnState("afterFight"), HELPER_WORDS.nothingHappens],
        "the window says the fight ended, and never that the turn could not be read",
    );

    const running = presentHelper(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(stated, { isOnAuto: true }),
    );
    assertStrictEquals(running.turnState, "onAuto", "a fight the game runs itself numbers none");
    assertStrictEquals(running.turnOrdinal, null, "so what it stated before is not drawn either");
    assertEquals(
        getTextsByClass(getWindow(draw(running).host), "empty"),
        [getWordsForTurnState("onAuto"), HELPER_WORDS.nothingHappens],
        "and says which kind of fight it is",
    );

    // Both are true of every fight fought on the auto key, and only one of them says why there
    // is no turn to draw.
    const both = presentHelper(
        [],
        [],
        ROSTER,
        OURS,
        composeTurn(stated, { isOver: true, isOnAuto: true }),
    );
    assertStrictEquals(both.turnState, "onAuto", "so a fight the game ran itself says that");
});

/**
 * Both halves in one place: the gesture the window must not answer, and the one the panel still
 * must. Held apart by `contains` at the root, because the caster's name a hand lands on carries no
 * attribute saying which of the two windows drew it. `develop ADR 0071`.
 */
Deno.test("a right press in the window moves nothing, and one on the panel steps back", () => {
    const reading = presentHelper(
        [composeProvocation(21, 11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host, pressed } = draw(reading);
    const names = getElementsWithin(getWindow(host)).filter((descendant) =>
        descendant.className === "row-name"
    );
    // The deepest element under the hand, which is the holder's own name on their row.
    const inside = names.find((nameCell) => nameCell.textContent === "Gracz 1");
    assertExists(inside, "whoever is holding somebody stands on a row of their own");
    pressElement(host, "contextmenu", inside);
    assertEquals(pressed, [], "a right press in the window beside the panel asks for nothing");

    pressElement(host, "contextmenu", getPanelWithin(host));
    assertEquals(
        pressed,
        [{ kind: PANEL_INTENT.close }],
        "and one on the panel is still the way back",
    );
});

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
        // The shout's own three and not the five its debuff runs: one okrzyk states both, and a
        // fixture carrying the wrong one of them reads as the bug `develop ADR 0097` was about.
        turnsStated: 3,
        ...over,
    };
}

Deno.test("a fight with nothing standing says so, and one with no turn says that too", () => {
    const reading = presentHelper([], [], ROSTER, OURS, composeTurn(null));
    const { host } = draw(reading);
    const said = getTextsByClass(getWindow(host), "empty");
    assertEquals(
        said,
        [getWordsForTurnState("unread"), HELPER_WORDS.nothingHappens],
        "both are readings rather than an absence of one",
    );
});

Deno.test("a folded window is its bar, whether or not there is a fight under it", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const host = panel.element as FakeElement;
    panel.renderHelper(
        presentHelper(
            [composeProvocation(21, 11)],
            [],
            ROSTER,
            OURS,
            composeTurn(null),
        ),
        true,
    );
    assertEquals(getTextsByClass(getWindow(host), "row-name"), [], "folded, no row is composed");
    const bar = getElementsWithin(getWindow(host)).find((descendant) =>
        descendant.className === "helper-bar"
    );
    assertExists(bar, "and the bar it folded to is still there to press");
    assertStrictEquals(
        bar.attributes.get("data-grip"),
        "helper",
        "wearing its own window's name",
    );
    panel.renderHelper(HELPER_ABSENCE.noFightYet, true);
    assertEquals(getTextsByClass(getWindow(host), "empty"), [], "folded, no sentence either");
});

Deno.test("before a fight the window says what the panel says, and never an empty box", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const host = panel.element as FakeElement;
    panel.renderHelper(HELPER_ABSENCE.noFightYet, false);
    const window = getWindow(host);
    assertEquals(
        getTextsByClass(window, "empty"),
        [PANEL_WORDS.noFightYet],
        "a fight nobody has seen is said, once",
    );
    assertEquals(getTextsByClass(window, "row-name"), [], "with nobody drawn under it");
    const body = getElementsWithin(window).find((descendant) =>
        descendant.className === "helper-body"
    );
    assertExists(body, "in the body that closes the box under the bar");

    panel.renderHelper(HELPER_ABSENCE.betweenFights, false);
    assertEquals(
        getTextsByClass(getWindow(host), "empty"),
        [HELPER_WORDS.nothingHappens],
        "between fights nothing is going on, while the panel draws the one it kept",
    );

    panel.renderHelper(HELPER_ABSENCE.fightUnread, false);
    assertEquals(
        getTextsByClass(getWindow(host), "empty"),
        [PANEL_WORDS.fightUnread],
        "a fight that would not read is never said to be no fight",
    );
});

Deno.test("the window's fold is its own, and never the panel's", () => {
    const document = composeFakeDocument();
    const pressed: PanelIntent[] = [];
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    const host = panel.element as FakeElement;
    panel.renderHelper(
        presentHelper([], [], ROSTER, OURS, composeTurn(null)),
        false,
    );
    const control = getElementsWithin(getWindow(host))
        .find((descendant) => descendant.attributes.get("data-helper-fold") !== undefined);
    assertExists(control, "the window's bar carries a fold of its own");
    assert(
        control.attributes.get("data-fold") === undefined,
        "and never the panel's, which would put both windows away at once",
    );
    pressElement(host, "pointerdown", control);
    assertEquals(
        pressed,
        [{ kind: PANEL_INTENT.fold, window: PANEL_WINDOW.helper }],
        "so the press is the window's own",
    );
});

Deno.test("a shout is drawn under whoever is holding it, and the turns are the held's", () => {
    // ⚠️ Inverted on 2026-09-09: the held character led and the holder hung under them as a
    // sentence. `develop ADR 0067` carries the fold and why it is not the alternative develop ADR
    // 0062 refused.
    const reading = presentHelper(
        [composeProvocation(21, 11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "row-name"),
        ["Gracz 1", "Renegat 1"],
        "whoever is holding, and under them whom",
    );
    assertEquals(
        getTextsByClass(getWindow(host), "row-value figure"),
        ["1 tura"],
        "the length stands on the character being held, and never on whoever holds them",
    );
    const rows = getElementsWithin(getWindow(host)).filter((descendant) =>
        descendant.className.split(" ")[0] === "row"
    );
    assertEquals(
        rows.map((row) => row.className.includes("helper-under")),
        [false, true],
        "and the held character is the one nested under the row above it",
    );
    assertEquals(
        rows.map((row) =>
            row.children.find((child) => child.className === "bar-cap")
                ?.getAttribute("style")
        ),
        [
            `background:${formatColour(lookupColourForProfession("m"))}`,
            `background:${formatColour(lookupColourForProfession("t"))}`,
        ],
        "each wearing their own profession, holder and held alike",
    );
    assertEquals(
        rows.map((row) =>
            row.children.find((child) => child.className === "row-side")
                ?.getAttribute("style")
        ),
        [`color:${formatColour(SIGNAL.ours)}`, `color:${formatColour(SIGNAL.theirs)}`],
        "and their own side, which is what a shout crosses",
    );
});

/**
 * ⚠️ **develop ADR 0067 drew the okrzyk's name nowhere**, on the ground that both of them ran three
 * turns and covered six, so naming one distinguished nothing. Their side-wide halves are not the
 * same length — three against five — so it distinguishes what a reader is looking at.
 * `develop ADR 0097`.
 */
Deno.test("the row holding somebody names the okrzyk, and the held row does not", () => {
    const reading = presentHelper(
        [composeProvocation(21, 11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "helper-cast"),
        ["Wyzywający okrzyk"],
        "the cast is named once, on the row of whoever is holding with it",
    );
    const rows = getElementsWithin(getWindow(host)).filter((descendant) =>
        descendant.className.split(" ")[0] === "row"
    );
    assertEquals(
        rows.map((row) => row.children.some((child) => child.className === "helper-cast")),
        [true, false],
        "and the character held carries no cast of their own, because they cast nothing",
    );
    assertEquals(
        getTextsByClass(getWindow(host), "row-share"),
        [HELPER_WORDS.castSeparator],
        "divided from the name by the mark, in the quiet ink the separator is drawn in",
    );
});

Deno.test("a holder the roster cannot place is still drawn, and says so", () => {
    const reading = presentHelper(
        [composeProvocation(21, -1)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    // **A11**: this layer asserts nothing, so a caster nobody can place falls back rather than
    // taking the section down with it.
    assertEquals(
        getTextsByClass(getWindow(host), "row-name"),
        [PANEL_WORDS.withoutActor, "Renegat 1"],
        "the shout is still holding somebody, whoever threw it",
    );
    const rows = getElementsWithin(getWindow(host)).filter((descendant) =>
        descendant.className.split(" ")[0] === "row"
    );
    assertEquals(
        rows[0]?.children.filter((child) => child.className === "row-side").length,
        0,
        "and nothing places them on a side, so they wear no rule",
    );
});

Deno.test("a fight holding only a provocation is not a fight where nothing stands", () => {
    const reading = presentHelper(
        [composeProvocation(21, 11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertEquals(
        getTextsByClass(getWindow(draw(reading).host), "empty"),
        [getWordsForTurnState("unread")],
        "the turn is unread, and the helper says nothing of the sort",
    );
});

/**
 * ⚠️ **The clamp below is tested with a fixture built out of the bound, so it moves with it.**
 * Lowering `PROVOKED_MAXIMUM` from 12 to 2 drops ten of twelve provoked characters out of the
 * window and reddens nothing — measured 2026-09-11. What the clamp working cannot say is that the
 * bound is the right one, so the bound is tied to what shouting can hold. **S11**'s fourth shape.
 *
 * ⚠️ **Both sides may be shouting, and that is what the older bound missed.** It covered one
 * shout — a whole opposing side, which is half a fight — and a fabricated ten-a-side stands two,
 * one per side, holding 20 characters at once; the window drew 12 of them. Nobody is held twice
 * (`develop ADR 0062`), so the ceiling is one row per combatant and no more.
 */
Deno.test("the provoked stop at their stated maximum, and one under it is drawn whole", () => {
    // **W5**: the bound is a boundary, so the row below it is asserted beside it. The clamp is
    // what stands in for an assertion here, because this layer asserts nothing (**A11**).
    const many: ProvocationStanding[] = [];
    for (let index = 0; index < PROVOKED_MAXIMUM + 4; index += 1) {
        many.push(composeProvocation(21, 11));
    }
    // Counted in characters and not in groups: the clamp stands before the fold, so the bound is
    // on the people the section draws however few casts they arrive under (`develop ADR 0067`).
    const countHeld = (reading: ReturnType<typeof presentHelper>) =>
        reading.provocations.reduce((sum, provocation) => sum + provocation.provoked.length, 0);
    const over = presentHelper(many, [], ROSTER, OURS, composeTurn(null));
    assertStrictEquals(countHeld(over), PROVOKED_MAXIMUM, "past it, the rest are dropped");
    const under = presentHelper(
        many.slice(0, PROVOKED_MAXIMUM - 1),
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    assertStrictEquals(countHeld(under), PROVOKED_MAXIMUM - 1, "one below it, all of them");
});

Deno.test("a charge wears the hue of whoever is making it, and one dot per turn", () => {
    const reading = presentHelper(
        [],
        [composeCharge()],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const charged = reading.chargedSkills[0];
    assertExists(charged, "the band draws the charge the fight states");
    assertStrictEquals(charged.colour, lookupColourForProfession("t"), "in the maker's own hue");
    assertStrictEquals(charged.sideRelation, "opposing", "and says which side is making it");

    const { host } = draw(reading);
    const window = getWindow(host);
    assertEquals(
        getTextsByClass(window, "section-words").includes(HELPER_WORDS.chargedSkill),
        true,
        "the band heads itself with the game's own name for it",
    );
    const pips = getElementsWithin(window).filter((descendant) =>
        descendant.className.split(" ")[0] === "helper-pip"
    );
    assertStrictEquals(pips.length, 4, "one dot per turn the whole charge runs");
    const lit = pips.filter((pip) => pip.className.includes("helper-pip-lit"));
    assertStrictEquals(lit.length, 2, "and the ones that have passed are the ones lit");
});

function composeCharge(
    over: Partial<ChargedSkillStanding> = {},
): ChargedSkillStanding {
    return {
        combatantId: 21,
        skillName: "Lodowe Pandemonium",
        turnsElapsed: 2,
        turnsStated: 4,
        state: "charging",
        endedAtOrdinal: null,
        ...over,
    };
}

Deno.test("a charge that is over wears no hue, and the heading says which end it came to", () => {
    for (const [state, said] of [["struck", "wykonane"], ["broken", "przerwane"]] as const) {
        const reading = presentHelper(
            [],
            [composeCharge({ state, endedAtOrdinal: 12 })],
            ROSTER,
            OURS,
            composeTurn(null),
        );
        const charged = reading.chargedSkills[0];
        assertExists(charged, `a ${state} charge is still drawn for its turn`);
        assertStrictEquals(charged.colour, SIGNAL.unknown, "in no profession's hue");
        const { host } = draw(reading);
        assertEquals(
            getTextsByClass(getWindow(host), "figure").includes(said),
            true,
            `the heading says ${said} beside the band's own name`,
        );
    }
});

Deno.test("a fight charging nothing draws no band at all", () => {
    const reading = presentHelper([], [], ROSTER, OURS, composeTurn(null));
    assertEquals(reading.chargedSkills, [], "nothing is being made ready");
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "section-words").includes(HELPER_WORDS.chargedSkill),
        false,
        "so the window looks exactly as it did before this band existed",
    );
});

Deno.test("a charge names the figures the game states, and never a percentage", () => {
    const reading = presentHelper(
        [],
        [composeCharge({ turnsElapsed: 1, turnsStated: 4 })],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    const figures = getTextsByClass(getWindow(host), "row-value figure");
    assertEquals(figures.includes("3 tury"), true, "what is left of what the game states");
    assertEquals(figures.some((figure) => figure.includes("%")), false, "and no share of anything");
});

Deno.test("every person's row in the window carries a card, and no two share one", () => {
    // One cast holding two characters, because that is the shape where the ids in a key have to
    // carry whoever is held: both rows stand under one caster and one okrzyk.
    const reading = presentHelper(
        [composeProvocation(21, 11), composeProvocation(12, 11)],
        [],
        ROSTER,
        OURS,
        composeTurn({ ordinal: 48, combatantId: 12 }),
    );
    const { host } = draw(reading);
    const rows = getPersonRows(host);
    assertStrictEquals(rows.length, 4, "the turn's holder, whoever is holding, and the two held");
    const keys = rows.map((row) => row.getAttribute("data-card"));
    assert(keys.every((key) => key !== null), "each of them says which card it opens");
    assertStrictEquals(
        new Set(keys).size,
        keys.length,
        "and no row wears its neighbour's, which the register would refuse in silence",
    );
});

/** Every row a person stands on, in the order the window draws them. */
function getPersonRows(host: FakeElement): FakeElement[] {
    return getElementsWithin(getWindow(host)).filter((descendant) => {
        const classes = descendant.className.split(" ");
        if (classes[0] !== "row") return false;
        return classes.includes("leaf");
    });
}

Deno.test("the card of a row holding somebody hands back the name and the okrzyk whole", () => {
    const reading = presentHelper(
        [composeProvocation(21, 11)],
        [],
        CUT_ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    const rows = getPersonRows(host);
    const holding = rows[0];
    assertExists(holding, "the row of whoever is holding stands first");
    const name = holding.children.find((child) => child.className === "row-name");
    assertExists(name, "and it draws the name in the cell that shortens");
    pointAtElement(host, "pointermove", name, 200);
    const card = readCard(host);
    assertEquals(card.name, [CUT_NAME], "the card opens with the whole nickname");
    assertEquals(
        card.subtitle,
        ["Wyzywający okrzyk"],
        "and names the okrzyk under it, which is the cell that gives way first",
    );
    // `develop ADR 0103`: the length is the held character's, so it is on their row and not on this
    // one.
    assertStrictEquals(card.groups, 0, "and states no turns, which are not this cast's to state");
});

/**
 * **W5: zero is a boundary.** The card above states one figure and this one states none, which is
 * the difference between a card with a run and a card that is a name and a line under it.
 */
Deno.test("a held character's card states the turns the shout has left on them", () => {
    const reading = presentHelper(
        [composeProvocation(21, 11)],
        [],
        CUT_ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    const held = getPersonRows(host)[1];
    assertExists(held, "the character held stands under whoever is holding them");
    pointAtElement(host, "pointermove", held, 200);
    const card = readCard(host);
    assertEquals(card.name, ["Renegat 1"], "their card opens with their own name");
    assertEquals(
        card.subtitle,
        ["Wyzywający okrzyk"],
        "and names what is holding them, which their row leaves to the row above",
    );
    assertEquals(
        card.stated.map((line) => [line.label, line.value]),
        [[HELPER_WORDS.turnsLeft, "1 tura"]],
        "and states a length of their own, counted on their turns (**develop ADR 0103**)",
    );
    assertEquals(card.notes, [], "with no sentence under it, because the clock is now theirs");
});

Deno.test("the row under `Teraz` carries a card of the name alone", () => {
    const reading = presentHelper(
        [],
        [],
        CUT_ROSTER,
        OURS,
        composeTurn({ ordinal: 48, combatantId: 11 }),
    );
    const { host } = draw(reading);
    const row = getPersonRows(host)[0];
    assertExists(row, "whoever the turn is numbered for is drawn as a person");
    pointAtElement(host, "pointermove", row, 200);
    const card = readCard(host);
    assertEquals(card.name, [CUT_NAME], "the whole nickname, which the row had to cut");
    assertEquals(card.subtitle, [], "nothing under it, because no cast is what this row is about");
    assertStrictEquals(card.groups, 0, "and no figure, because the row states none");
});

Deno.test("every row the window draws carries a card, the charge band included", () => {
    const reading = presentHelper(
        [composeProvocation(21, 11), composeProvocation(12, 11)],
        [composeCharge(), composeCharge({ combatantId: 11, skillName: "Szarża" })],
        ROSTER,
        OURS,
        composeTurn({ ordinal: 48, combatantId: 12 }),
    );
    const { host } = draw(reading);
    assertStrictEquals(reading.chargedSkills.length, 2, "two blows are being made ready");
    assertEquals(
        getRowsWithoutCard(host),
        [],
        "and no row in the window answers a pointer with nothing",
    );

    const keys = getElementsWithin(getWindow(host))
        .filter((descendant) => descendant.className.split(" ")[0] === "row")
        .map((descendant) => descendant.getAttribute("data-card"));
    assertStrictEquals(
        new Set(keys).size,
        keys.length,
        "and no row wears its neighbour's, which the register would refuse in silence",
    );
});

/**
 * Every row this window draws, whether it names a person or a blow. Read off the class the sheet
 * styles a row with, so a row builder nobody remembered to look at is in the walk the day it is
 * written — which is the whole of what `develop ADR 0100` asks of this file.
 */
function getRowsWithoutCard(host: FakeElement): string[] {
    const without: string[] = [];
    for (const descendant of getElementsWithin(getWindow(host))) {
        if (descendant.className.split(" ")[0] !== "row") continue;
        if (descendant.attributes.get("data-card") !== undefined) continue;
        without.push(`${descendant.className}:${descendant.textContent}`);
    }
    return without;
}

/**
 * The sample the walk must flag. A reader proved only on a window where everything is marked
 * cannot tell one that finds every row from one that has stopped finding any — and a walk that
 * found nothing would read exactly like the claim above passing.
 */
Deno.test("a row drawn without a card is what that walk reports", () => {
    const document = composeFakeDocument();
    const window = document.createElement("div") as FakeElement;
    window.className = "MargoMeter-helper";
    const marked = document.createElement("div") as FakeElement;
    marked.className = "row leaf";
    marked.setAttribute("data-card", "helper:charge:21");
    const bare = document.createElement("div") as FakeElement;
    bare.className = "row leaf";
    bare.textContent = "Lodowe Pandemonium";
    window.append(marked);
    window.append(bare);
    const host = document.createElement("div") as FakeElement;
    host.shadow = [window];

    assertEquals(
        getRowsWithoutCard(host),
        ["row leaf:Lodowe Pandemonium"],
        "the row with no mark is named, and the row beside it is not",
    );
});

/**
 * `develop ADR 0103`. One cast holding two characters is two counts on two clocks, so the figure
 * left the holder's row for the rows of whoever is carrying it. This card states the cast and no
 * length, which is what makes the length on the row below it unambiguous.
 */
Deno.test("the holder's card states no length, because the length is not the cast's", () => {
    const reading = presentHelper(
        [composeProvocation(21, 11)],
        [],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    const holding = getPersonRows(host)[0];
    assertExists(holding, "the row of whoever is holding stands first");
    pointAtElement(host, "pointermove", holding, 200);
    const card = readCard(host);
    assertStrictEquals(card.groups, 0, "the holder's card states no turns of anybody's");
    assertEquals(card.notes, [], "and owes no sentence, because it draws no figure");
});

Deno.test("the card of a charge names the blow whole, whoever is making it, and the turns", () => {
    const reading = presentHelper(
        [],
        [{ ...composeCutCharge(), turnsElapsed: 1 }],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    const row = getElementsWithin(getWindow(host))
        .find((descendant) => descendant.getAttribute("data-card") === "helper:charge:21");
    assertExists(row, "the charge stands as a row of its own, keyed by whoever is making it");
    pointAtElement(host, "pointermove", row, 200);
    const card = readCard(host);
    assertEquals(card.name, [CUT_BLOW], "the card opens with the blow the row had to cut");
    assertEquals(
        card.subtitle,
        ["Renegat 1"],
        "and names whoever is making it ready, which the row says in a hue alone",
    );
    assertEquals(
        card.stated.map((line) => [line.label, line.value]),
        [[HELPER_WORDS.turnsLeft, "3 tury"]],
        "the turns left, under the word a held character's card states its own under",
    );
});

function composeCutCharge(state: ChargedSkillState = "charging"): ChargedSkillStanding {
    return composeCharge({
        skillName: CUT_BLOW,
        state,
        endedAtOrdinal: state === "charging" ? null : 12,
    });
}

Deno.test("a charge that is over says on its own card which end it came to", () => {
    for (const [state, said] of [["struck", "wykonane"], ["broken", "przerwane"]] as const) {
        const reading = presentHelper(
            [],
            [composeCutCharge(state)],
            ROSTER,
            OURS,
            composeTurn(null),
        );
        const { host } = draw(reading);
        const row = getElementsWithin(getWindow(host))
            .find((descendant) => descendant.getAttribute("data-card") === "helper:charge:21");
        assertExists(row, `a ${state} charge is still a row for the turn it stands`);
        pointAtElement(host, "pointermove", row, 200);
        assertEquals(
            readCard(host).subtitle,
            [`Renegat 1 ${HELPER_WORDS.castSeparator} ${said}`],
            `the line under the name carries ${said}, which the band's heading states once`,
        );
    }
});

/**
 * ADR 0041. A charge that ended draws no length: beside the word naming its end, the turns it had
 * left are a future that never runs. A broken one stopped mid-way and a struck one ran out, so the
 * one the old counter would have said `3 tury` of and the one it would have said `0 tur` of are
 * both here, beside one still being made ready that keeps its count.
 */
Deno.test("an ended charge states no length on its row or its card, and a charging one does", () => {
    const cases = [
        ["charging", 1, 1, "3 tury"],
        ["broken", 1, 1, null],
        ["struck", 4, 4, null],
    ] as const;
    for (const [state, turnsElapsed, litExpected, turnsLeft] of cases) {
        const reading = presentHelper(
            [],
            [{ ...composeCutCharge(state), turnsElapsed }],
            ROSTER,
            OURS,
            composeTurn(null),
        );
        const { host } = draw(reading);
        const row = getElementsWithin(getWindow(host))
            .find((descendant) => descendant.getAttribute("data-card") === "helper:charge:21");
        assertExists(row, `a ${state} charge stands as a row`);
        const pips = getElementsWithin(row).filter((descendant) =>
            descendant.className.split(" ")[0] === "helper-pip"
        );
        assertStrictEquals(pips.length, 4, `a ${state} charge keeps a dot per turn it runs`);
        assertStrictEquals(
            pips.filter((pip) => pip.className.includes("helper-pip-lit")).length,
            litExpected,
            `and the ${state} charge's dots say how far it got`,
        );
        assertEquals(
            getElementsWithin(row)
                .filter((descendant) => descendant.className.split(" ").includes("row-value"))
                .map((descendant) => descendant.textContent),
            turnsLeft === null ? [] : [turnsLeft],
            `the ${state} charge's row states the turns left only while it is being made ready`,
        );
        pointAtElement(host, "pointermove", row, 200);
        const card = readCard(host);
        assertEquals(card.name, [CUT_BLOW], `the ${state} charge's card still names the blow`);
        assertEquals(
            card.stated.map((line) => [line.label, line.value]),
            turnsLeft === null ? [] : [[HELPER_WORDS.turnsLeft, turnsLeft]],
            `and the ${state} charge's card states the turns left only while it is being made ready`,
        );
        assertStrictEquals(
            card.groups,
            turnsLeft === null ? 0 : 1,
            `so the ${state} charge's card holds no empty run under its name`,
        );
    }
});

/**
 * Every dot is a node in its own right, and a card is read off the node under the hand and never
 * walked up from. Unmarked, the run of them is the widest hole on the row.
 */
Deno.test("a pointer on any part of a charge's row keeps its card open, every dot included", () => {
    const reading = presentHelper(
        [],
        [composeCharge()],
        ROSTER,
        OURS,
        composeTurn(null),
    );
    const { host } = draw(reading);
    const row = getElementsWithin(getWindow(host))
        .find((descendant) => descendant.getAttribute("data-card") === "helper:charge:21");
    assertExists(row, "the charge is drawn as a row");
    const inside = getElementsWithin(row).slice(1);
    assert(inside.length > 4, "the row is drawn out of parts, the dots among them");
    const dots = inside.filter((descendant) => descendant.className.split(" ")[0] === "helper-pip");
    assertStrictEquals(dots.length, 4, "one dot per turn the whole charge runs");

    const deaf: string[] = [];
    for (const descendant of inside) {
        if (descendant.getAttribute("data-card") === "helper:charge:21") continue;
        deaf.push(`${descendant.className}:${descendant.textContent}`);
    }
    assertEquals(deaf, [], "and every one of them names the same card as the row");
});

/**
 * The window's register starts afresh on each of its draws, so a card open over a row the window
 * no longer draws closes at the next frame rather than going on describing a charge that ended.
 */
Deno.test("a card open over a row the window stopped drawing closes at the next frame", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const host = panel.element as FakeElement;
    const charging = presentHelper([], [composeCharge()], ROSTER, OURS, composeTurn(null));
    panel.renderHelper(charging, false);
    const row = getElementsWithin(host).find((descendant) =>
        (descendant.attributes.get("data-card") ?? "").startsWith("helper:charge:")
    );
    assertExists(row, "the charge's row carries a card");
    pointAtElement(host, "pointermove", row, 200);
    assertEquals(readCard(host).className, "MargoMeter-card", "which opens under the pointer");
    panel.renderHelper(presentHelper([], [], ROSTER, OURS, composeTurn(null)), false);
    panel.renderWaiting({ ...NOTHING_WAITING });
    assertEquals(
        readCard(host).className,
        "MargoMeter-card card-hidden",
        "and closes once the row it named is gone",
    );
});
