/**
 * The widest fight the panel can draw: a full cast, with both unnamed rows beside it.
 *
 * No recording states this. The corpus is ten against one, and none of it carries a blow the
 * protocol gave no target, so twenty rows with `Nieznany sprawca` and `Nieznany cel` drawn
 * beside them has never been on a screen. The material is the fabricated ten-a-side — the only
 * twenty-person fight there is — with the one blow its script does not state added through the
 * decoder, and the whole of it drawn, because a bound that fails inside a region says nothing.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { type CombatantRoster, MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import { composePanelHost, type PanelView } from "@/src/ui/panel-element.ts";
import {
    composePanelReading,
    NOTHING_MISSED,
    type PanelMetric,
    type PanelReading,
} from "@/src/ui/panel-reading.ts";
import type { PanelSideChoice } from "@/src/ui/panel-screen.ts";
import { composeFakeDocument, type FakeElement, getTextsByClass } from "@/tests/fake-document.ts";
import { composeFabricatedFight } from "@/tools/fabricated-fight.ts";
import { composeFightReplay } from "@/tools/fight-replay.ts";

/** The screen that pins two figures at once, which is what puts two unnamed rows on one list. */
const BOTH_ENDS_SCREEN: PanelMetric = "damageTakenApplied";
const SCREENS: PanelMetric[] = [
    "damageDealtApplied",
    "damageTakenApplied",
    "healthGiven",
    "healthRestored",
];
const CHOICES: PanelSideChoice[] = ["everyone", "reader", "opposing"];
/**
 * What the words say, spelled out rather than read back off the module that writes them: a test
 * taking `PANEL_WORDS` for its expectation passes just as well when the panel says nothing.
 */
const WITHOUT_ACTOR = "Nieznany sprawca";
const WITHOUT_TARGET = "Nieznany cel";
const UNKNOWN_TARGET_BLOW = 700;
const SHOWN_LIST = "shown";

/**
 * The fabricated fight already states a blow with no striker; it states none with no target, so
 * `takenByNobody` is zero over the whole script and one screen pins one figure where it can pin
 * two. The blow is written at the striker's own closing percentage, so the health it states
 * moves nothing and no witness reads a heal out of it.
 */
function composeWidestFight(): {
    roster: CombatantRoster;
    statistics: FightStatistics;
    readerSide: number | null;
} {
    const fabricated = composeFabricatedFight();
    const replay = composeFightReplay({
        name: "fabricated",
        calls: fabricated.calls.map((call) => call.payload),
    });
    const [striker] = fabricated.warriors;
    assert(striker !== undefined, "the fight fields somebody to strike with");
    const percent = ((striker.health / striker.healthMaximum) * 100).toFixed(2);
    const blow =
        `${striker.id}=${percent};0;+dmg=${UNKNOWN_TARGET_BLOW};-dmg=${UNKNOWN_TARGET_BLOW}`;
    const events = [...replay.reading.events, ...decodeFightMessages([blow], replay.roster)];
    return {
        roster: replay.roster,
        statistics: composeFightStatistics(events, composeTeamHeals(events, replay.roster)),
        readerSide: replay.reading.readerSide,
    };
}

/** The view the drawing tests stand in, so each of them says only what it is changing. */
function composeShownView(reading: PanelReading, metric: PanelMetric, side: PanelSideChoice) {
    return {
        listName: SHOWN_LIST,
        reading,
        current: metric,
        side,
        hasReaderSide: true,
        shelf: [],
        isOnShelf: false,
        storage: "local",
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        halfNamed: null,
        halfNamedDrill: null,
        place: null,
        isCollapsed: false,
    } satisfies PanelView;
}

/** The panel with that view on it, and whatever a region refused to draw while it went up. */
function drawShownView(view: PanelView): { host: FakeElement; failures: unknown[] } {
    const failures: unknown[] = [];
    const panel = composePanelHost(
        composeFakeDocument(),
        () => {},
        (failure) => failures.push(failure),
    );
    panel.show(view);
    return { host: panel.element as FakeElement, failures };
}

Deno.test("the widest fight there is fields a full cast, with both ends left out", () => {
    const { roster, statistics } = composeWidestFight();
    assertStrictEquals(roster.byId.size, MAXIMUM_COMBATANTS, "ten a side is the widest roster");
    assertStrictEquals(statistics.unreadMessages, 0, "and nothing in it went unread");
    assert(statistics.dealtByNobody > 0, "a blow the protocol gave no striker");
    assert(statistics.takenByNobody > 0, "and one it gave no target");
    assertStrictEquals(statistics.byNeitherEnd, 0, "neither of them left both ends out");
});

Deno.test("a full cast with both ends unknown draws its rows and both unnamed ones", () => {
    const { roster, statistics, readerSide } = composeWidestFight();
    const reading = composePanelReading(
        statistics,
        roster,
        BOTH_ENDS_SCREEN,
        "everyone",
        readerSide,
        NOTHING_MISSED,
    );
    assertStrictEquals(reading.rows.length, MAXIMUM_COMBATANTS, "a row for everybody in it");
    assertEquals(
        reading.pinned.map((one) => one.end),
        ["actor", "target"],
        "and both ends the protocol can leave out are pinned beside them",
    );
    assert(reading.rows.every((one) => one.shareText.length > 0), "every row states its share");

    const { host, failures } = drawShownView(
        composeShownView(reading, BOTH_ENDS_SCREEN, "everyone"),
    );
    assertEquals(failures, [], "the widest screen there is costs the reader no region");
    assertEquals(getTextsByClass(host, "undrawn"), [], "and leaves no region standing undrawn");
    const names = getTextsByClass(host, "row-name");
    assertStrictEquals(
        names.length,
        MAXIMUM_COMBATANTS + reading.pinned.length,
        "a name for everybody in the fight, and one for each end the game left out",
    );
    assertEquals(
        names.slice(MAXIMUM_COMBATANTS),
        [WITHOUT_ACTOR, WITHOUT_TARGET],
        "which say, in words, which end the game left out",
    );
});

Deno.test("no screen and no side of the widest fight costs the reader a region", () => {
    const { roster, statistics, readerSide } = composeWidestFight();
    for (const metric of SCREENS) {
        for (const side of CHOICES) {
            const reading = composePanelReading(
                statistics,
                roster,
                metric,
                side,
                readerSide,
                NOTHING_MISSED,
            );
            assert(reading.rows.length <= MAXIMUM_COMBATANTS, `${metric} ${side}: inside the cast`);
            const { host, failures } = drawShownView(composeShownView(reading, metric, side));
            assertEquals(failures, [], `${metric} ${side}: a region the reader was not shown`);
            assertEquals(getTextsByClass(host, "undrawn"), [], `${metric} ${side}: undrawn`);
            assertStrictEquals(
                getTextsByClass(host, "row-name").length,
                reading.rows.length + reading.pinned.length,
                `${metric} ${side}: every row of the reading is a row on the screen`,
            );
        }
    }
});
