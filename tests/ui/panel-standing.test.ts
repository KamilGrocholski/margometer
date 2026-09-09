/**
 * The window beside the panel: what it reads, and what it draws.
 *
 * The rows are the panel's own by construction, so what is checked here is what the window adds —
 * the two sides counted apart, what a press opens, and the two states a fight can leave it in.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import type { AuraStanding, ProvocationStanding } from "@/src/core/aura-standing.ts";
import { composePanelHost, type PanelPress } from "@/src/ui/panel-element.ts";
import { composeStandingReading, MAXIMUM_PROVOKED } from "@/src/ui/panel-standing.ts";
import { getColourForProfession, SIGNAL } from "@/src/ui/panel-look.ts";
import { STANDING_WORDS } from "@/src/ui/panel-words.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
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
        { ordinal: 248, combatantId: 12 },
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
        null,
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
            null,
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
        null,
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
        { ordinal: 48, combatantId: 21 },
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
        ordinal: 48,
        combatantId: 21,
    }, null);
    const alone = getElementsWithin(getWindow(draw(seatless).host));
    assertEquals(alone.filter((one) => one.className === "bar-cap").length, 1, "the cap stands");
    assertEquals(alone.filter((one) => one.className === "row-side"), [], "and no rule does");
});

Deno.test("a press opens the casters under a row, and a second press shuts them", () => {
    const standings = [composeStanding(11), composeStanding(12)];
    const shut = composeStandingReading(standings, [], ROSTER, OURS, null, null);
    const { host, pressed } = draw(shut);
    assertEquals(getTextsByClass(getWindow(host), "row-name").length, 1, "the skill, and nobody");
    const row = getElementsWithin(getWindow(host))
        .find((one) => one.attributes.get("data-standing") !== undefined);
    assertExists(row, "a counted row carries the mark a press is read off");
    pressElement(host, "pointerdown", row);
    assertEquals(pressed, [{ kind: "standing", stated: "264" }], "which names the skill opened");

    const open = composeStandingReading(standings, [], ROSTER, OURS, null, 264);
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

Deno.test("a row nobody opened stays shut, and an id nothing stands under opens nothing", () => {
    const reading = composeStandingReading([composeStanding(11)], [], ROSTER, OURS, null, 999);
    assertStrictEquals(reading.openSkillId, null, "an id no row carries opens no row");
    assertEquals(
        getTextsByClass(getWindow(draw(reading).host), "row-name"),
        ["Piętno bestii"],
        "so the window draws the counted rows and nothing under them",
    );
});

Deno.test("a fight with nothing standing says so, and one with no turn says that too", () => {
    const reading = composeStandingReading([], [], ROSTER, OURS, null, null);
    const { host } = draw(reading);
    const said = getTextsByClass(getWindow(host), "empty");
    assertEquals(
        said,
        [STANDING_WORDS.turnUnread, STANDING_WORDS.nothingStands],
        "both are readings rather than an absence of one",
    );
});

Deno.test("a folded window is its bar, and a fight it knows nothing about draws no body", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    const host = panel.element as FakeElement;
    panel.showStanding(
        composeStandingReading([composeStanding(11)], [], ROSTER, OURS, null, null),
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
    panel.showStanding(composeStandingReading([], [], ROSTER, OURS, null, null), false);
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

Deno.test("a provoked character stands in a section of their own, held by somebody", () => {
    const reading = composeStandingReading(
        [],
        [composeProvocation(21, 11)],
        ROSTER,
        OURS,
        null,
        null,
    );
    const { host } = draw(reading);
    assertEquals(
        getTextsByClass(getWindow(host), "row-name"),
        ["Renegat 1"],
        "the person a shout is holding, and never the caster",
    );
    assertEquals(
        getTextsByClass(getWindow(host), "row-value figure"),
        ["2 z 5 tur"],
        "with what has passed of what the table gives it",
    );
    assertEquals(
        getTextsByClass(getWindow(host), "standing-holder-part"),
        ["od Gracz 1 ·", "Wyzywający okrzyk"],
        "and under them who is holding them, with which of the two skills",
    );
});

Deno.test("a fight holding only a provocation is not a fight where nothing stands", () => {
    const reading = composeStandingReading(
        [],
        [composeProvocation(21, 11)],
        ROSTER,
        OURS,
        null,
        null,
    );
    assertEquals(
        getTextsByClass(getWindow(draw(reading).host), "empty"),
        [STANDING_WORDS.turnUnread],
        "the turn is unread, and the standing section says nothing of the sort",
    );
});

Deno.test("the provoked stop at their stated maximum, and one under it is drawn whole", () => {
    // **W5**: the bound is a boundary, so the row below it is asserted beside it. The clamp is
    // what stands in for an assertion here, because this layer asserts nothing (**A11**).
    const many: ProvocationStanding[] = [];
    for (let at = 0; at < MAXIMUM_PROVOKED + 4; at += 1) many.push(composeProvocation(21, 11));
    const over = composeStandingReading([], many, ROSTER, OURS, null, null);
    assertStrictEquals(over.provoked.length, MAXIMUM_PROVOKED, "past it, the rest are dropped");
    const under = composeStandingReading(
        [],
        many.slice(0, MAXIMUM_PROVOKED - 1),
        ROSTER,
        OURS,
        null,
        null,
    );
    assertStrictEquals(under.provoked.length, MAXIMUM_PROVOKED - 1, "one below it, all of them");
});

Deno.test("a whole-team skill says nothing about whom, because there is nothing to say", () => {
    const reading = composeStandingReading([composeStanding(11)], [], ROSTER, OURS, null, 264);
    assertEquals(
        getTextsByClass(getWindow(draw(reading).host), "standing-holder-part"),
        [],
        "a cast reaching a whole side carries no line about who is under it",
    );
});
