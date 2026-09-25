/**
 * The widest fight the panel can draw: a full cast, with both unnamed rows beside it.
 *
 * No recording states this. The corpus is ten against one, and none of it carries a blow the
 * protocol gave no target, so twenty rows with `Nieznany sprawca` and `Nieznany cel` drawn beside
 * them has never been on a screen. `develop` draws it off the fabricated ten-a-side, which this
 * branch does not carry; the cast here is built from messages instead, and the whole of it drawn,
 * because a bound that fails inside a region says nothing.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { indexTeamHeals } from "#/src/core/combatant-health.ts";
import {
    type CombatantRoster,
    COMBATANTS_MAXIMUM,
    indexCombatantRoster,
} from "#/src/core/combatant-roster.ts";
import { decodePayloadMessages } from "#/src/core/fight-decoder.ts";
import {
    countUnreadMessages,
    type FightStatistics,
    tallyFightStatistics,
} from "#/src/core/fight-statistics.ts";
import type { ShownScreen } from "#/src/ui/panel-element.ts";
import { NOTHING_SUSPECT, type ScreenReading } from "#/src/ui/panel-reading.ts";
import { presentScreen, UNNAMED_END } from "#/src/ui/panel-reading.ts";
import {
    PANEL_METRIC,
    type PanelMetric,
    type PanelSideChoice,
    SCREEN_ORDER,
    SIDE_CHOICE,
    SIDE_CHOICES,
} from "#/src/ui/panel-screen.ts";
import { composeFakeDocument, type FakeElement, getTextsByClass } from "#/tests/fake-document.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { initTestView } from "#/tests/panel-view.ts";
import { composeShownScreen } from "#/tests/shown-screen.ts";

/** The screen that pins two figures at once, which is what puts two unnamed rows on one list. */
const BOTH_ENDS_SCREEN: PanelMetric = PANEL_METRIC.damageTakenApplied;
/**
 * What the words say, spelled out rather than read back off the module that writes them: a test
 * taking `PANEL_WORDS` for its expectation passes just as well when the panel says nothing.
 */
const WITHOUT_ACTOR = "Nieznany sprawca";
const WITHOUT_TARGET = "Nieznany cel";
const OURS = 1;
const THEIRS = 2;

/**
 * Ten a side, every one of them striking the first of the other side, and three blows that leave
 * an end out: no striker, no target, and neither. `0` is the segment that names nobody.
 */
function composeWidestFight(): {
    roster: CombatantRoster;
    statistics: FightStatistics;
    readerSide: number | null;
} {
    const combatants = Array.from({ length: COMBATANTS_MAXIMUM }, (_, at) => ({
        id: at + 1,
        name: `Gracz ${at + 1}`,
        side: at % 2 === 0 ? OURS : THEIRS,
        profession: "w",
        level: 40,
        healthMaximum: 1000,
    }));
    const roster = indexCombatantRoster(combatants);
    const messages = combatants.map((one) => {
        const target = one.side === OURS ? 2 : 1;
        return `${one.id}=90.00;${target}=80.00;+dmg=${100 + one.id};-dmg=${100 + one.id}`;
    });
    messages.push("0;2=50.00;+dmg=10;-dmg=10", "1=90.00;0;+dmg=20;-dmg=20", "0;0;+dmg=30;-dmg=30");
    const context = { roster, standing: null, tables: BLOWS_GRANTED };
    const events = decodePayloadMessages(messages, context).events;
    const statistics = tallyFightStatistics(events, indexTeamHeals(events, roster));
    return { roster, statistics, readerSide: OURS };
}

function composeFullCastScreen(
    reading: ScreenReading,
    metric: PanelMetric,
    side: PanelSideChoice,
): ShownScreen {
    return { ...composeShownScreen(reading, metric), side, readerSide: OURS };
}

/** The panel with that view on it, and whatever a region refused to draw while it went up. */
function drawShownView(shown: ShownScreen): { host: FakeElement; failures: unknown[] } {
    const failures: unknown[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onFailure: (failure) => failures.push(failure),
    });
    failures.push(...panel.render(shown).undrawn);
    return { host: panel.element as FakeElement, failures };
}

Deno.test("the widest fight built here fields a full cast, with both ends left out", () => {
    const { roster, statistics } = composeWidestFight();
    assertStrictEquals(roster.byId.size, COMBATANTS_MAXIMUM, "ten a side is the widest roster");
    assertStrictEquals(countUnreadMessages(statistics), 0, "and nothing in it went unread");
    assert(statistics.dealtByNobody > 0, "a blow the protocol gave no striker");
    assert(statistics.takenByNobody > 0, "and one it gave no target");
});

Deno.test("a full cast with both ends unknown draws its rows and both unnamed ones", () => {
    const { roster, statistics, readerSide } = composeWidestFight();
    const reading = presentScreen(
        statistics,
        roster,
        BOTH_ENDS_SCREEN,
        SIDE_CHOICE.everyone,
        readerSide,
        NOTHING_SUSPECT,
    );
    assertStrictEquals(reading.rows.length, COMBATANTS_MAXIMUM, "a row for everybody in it");
    assertEquals(
        reading.pinned.map((one) => one.end),
        [UNNAMED_END.actor, UNNAMED_END.target],
        "and both ends the protocol can leave out are pinned beside them",
    );
    assert(reading.rows.every((one) => one.shareText.length > 0), "every row states its share");

    const { host, failures } = drawShownView(
        composeFullCastScreen(reading, BOTH_ENDS_SCREEN, SIDE_CHOICE.everyone),
    );
    assertEquals(failures, [], "the widest screen there is costs the reader no region");
    assertEquals(getTextsByClass(host, "undrawn"), [], "and leaves no region standing undrawn");
    const names = getTextsByClass(host, "row-name");
    assertStrictEquals(
        names.length,
        COMBATANTS_MAXIMUM + reading.pinned.length,
        "a name for everybody in the fight, and one for each end the game left out",
    );
    assertEquals(
        names.slice(COMBATANTS_MAXIMUM),
        [WITHOUT_ACTOR, WITHOUT_TARGET],
        "which say, in words, which end the game left out",
    );
});

Deno.test("no screen and no side of the widest fight costs the reader a region", () => {
    const { roster, statistics, readerSide } = composeWidestFight();
    let drawn = 0;
    for (const metric of SCREEN_ORDER) {
        for (const side of SIDE_CHOICES) {
            const reading = presentScreen(
                statistics,
                roster,
                metric,
                side,
                readerSide,
                NOTHING_SUSPECT,
            );
            assert(reading.rows.length <= COMBATANTS_MAXIMUM, `${metric} ${side}: inside the cast`);
            const { host, failures } = drawShownView(composeFullCastScreen(reading, metric, side));
            assertEquals(failures, [], `${metric} ${side}: a region the reader was not shown`);
            assertEquals(getTextsByClass(host, "undrawn"), [], `${metric} ${side}: undrawn`);
            // ⚠️ **The section under the list is a drawn row and is in neither list.** It is the
            // screen counted a second time (`develop ADR 0082`), so a count taken from the rows
            // alone is short by it wherever it draws.
            const outside = reading.outsideRanking === null ? 0 : 1;
            assertStrictEquals(
                getTextsByClass(host, "row-name").length,
                reading.rows.length + reading.pinned.length + outside,
                `${metric} ${side}: every row of the reading is a row on the screen`,
            );
            drawn += 1;
        }
    }
    assertStrictEquals(drawn, SCREEN_ORDER.length * SIDE_CHOICES.length, "every view was drawn");
});
