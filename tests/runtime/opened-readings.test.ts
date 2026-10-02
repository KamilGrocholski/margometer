/**
 * What stands under the rows a reader opened, asked with screens built by hand: a person's row
 * and an end left out open at once, which is the rung under that person's figure, and the same
 * pair with a mark naming the other end, which no row of that screen writes.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { composeFightView } from "#/src/core/fight-session.ts";
import { tallyFightState } from "#/src/runtime/fight-state.ts";
import { presentOpenedLevels } from "#/src/runtime/panel-frame.ts";
import { lookupPinnedCase, presentOpenedLevel, UNNAMED_END } from "#/src/ui/panel-content.ts";
import { createScreenState, PANEL_METRIC } from "#/src/ui/panel-screen.ts";
import { lookupRecordedFight, replayRecordedFight } from "#/tests/recorded-fights.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

Deno.test("a person's row and the end their figure left out open at once are the rung under it", () => {
    const view = composeFightView(replayRecordedFight(lookupRecordedFight(HILDUR)));
    assertExists(view, "the recording opens a fight");
    const reading = tallyFightState(view);
    const metric = PANEL_METRIC.damageTaken;
    const end = UNNAMED_END.actor;
    assertExists(lookupPinnedCase(metric, end), "this screen has a pinned row to open");
    const { statistics } = reading.figures;
    const person = [...view.roster.byId.keys()].find((one) =>
        presentOpenedLevel(statistics, view.roster, metric, one)?.byOpponent.unnamed?.doesOpenPair
    );
    assertExists(person, "and somebody whose figure left that end out");
    const screen = { ...createScreenState(false), current: metric };

    const pinned = presentOpenedLevels(reading, { ...screen, openUnnamedEnd: end });
    assert(pinned.halfNamed !== null, "a pinned row alone opens");
    const row = presentOpenedLevels(reading, { ...screen, openRowId: person });
    assert(row.drill !== null, "and so does a person's row alone");
    assertEquals(row.halfNamedDrill, null, "with nothing under it until the end is pressed");

    const both = presentOpenedLevels(reading, {
        ...screen,
        openUnnamedEnd: end,
        openRowId: person,
    });
    assert(both.drill !== null, "the two open at once keep the person's figure");
    assertEquals(both.halfNamed, null, "and draw no pinned level beside it");
    assertExists(both.halfNamedDrill, "but the rung under it");
    assert(both.halfNamedDrill.opened === "person", "which is that person's own keys");
    assertEquals(both.halfNamedDrill.row.combatantId, person, "and nobody else's");
    assertEquals(
        both.halfNamedDrill.total,
        both.drill.byOpponent.unnamed?.figure,
        "totalling the row it was opened from",
    );

    const other = UNNAMED_END.target;
    const stray = presentOpenedLevels(reading, {
        ...screen,
        openUnnamedEnd: other,
        openRowId: person,
    });
    assertEquals(stray.halfNamedDrill, null, "a mark naming the other end opens nothing here");
});

/**
 * The keys are kept beside the figure and asserted to balance over the fight, not per person, so
 * a row they fall short of is built here by moving one point: the row stays shut, and a press left
 * over on it draws no level that would not add up to it.
 */
Deno.test("an end left out whose keys fall short of it opens nothing", () => {
    const view = composeFightView(replayRecordedFight(lookupRecordedFight(HILDUR)));
    assertExists(view, "the recording opens a fight");
    const reading = tallyFightState(view);
    const metric = PANEL_METRIC.damageTaken;
    const { statistics } = reading.figures;
    const person = [...view.roster.byId.keys()].find((one) =>
        presentOpenedLevel(statistics, view.roster, metric, one)?.byOpponent.unnamed?.doesOpenPair
    );
    assertExists(person, "somebody's figure left the striker out");
    const figures = statistics.byCombatantId.get(person);
    assertExists(figures, "and their figures are kept");
    figures.damageTakenFromNobody -= 1;
    const drill = presentOpenedLevel(statistics, view.roster, metric, person);
    assertEquals(drill?.byOpponent.unnamed?.doesOpenPair, false, "the row no longer opens");
    const screen = { ...createScreenState(false), current: metric };
    const both = presentOpenedLevels(reading, {
        ...screen,
        openUnnamedEnd: UNNAMED_END.actor,
        openRowId: person,
    });
    assertEquals(both.halfNamedDrill, null, "and a press left over on it draws nothing");
});
