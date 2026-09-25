/**
 * What stands under the rows a reader opened, asked with screens built by hand: one of them a
 * screen no gesture makes, a person's row and a pinned row open at once, which is a bug of ours to
 * be met as one rather than drawn around.
 */

import { assert, assertExists, AssertionError, assertThrows } from "@std/assert";
import { getFightView } from "#/src/core/fight-session.ts";
import { tallyFightReading } from "#/src/runtime/fight-reading.ts";
import { presentOpenedReadings } from "#/src/runtime/opened-reading.ts";
import { lookupPinnedCase, UNNAMED_END } from "#/src/ui/panel-reading.ts";
import { createScreenState, PANEL_METRIC } from "#/src/ui/panel-screen.ts";
import { lookupRecordedFight, replayRecordedFight } from "#/tests/recorded-fights.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

Deno.test("a person's row and a pinned row open at once is a bug met as one, not drawn", () => {
    const view = getFightView(replayRecordedFight(lookupRecordedFight(HILDUR)));
    assertExists(view, "the recording opens a fight");
    const reading = tallyFightReading(view);
    const metric = PANEL_METRIC.damageDealtApplied;
    const end = UNNAMED_END.actor;
    assertExists(lookupPinnedCase(metric, end), "this screen has a pinned row to open");
    const person = [...view.roster.byId.keys()][0];
    assertExists(person, "and somebody to open");
    const screen = { ...createScreenState(false), current: metric };

    const pinned = presentOpenedReadings(reading, { ...screen, openUnnamedEnd: end });
    assert(pinned.halfNamed !== null, "a pinned row alone opens");
    const row = presentOpenedReadings(reading, { ...screen, openRowId: person });
    assert(row.drill !== null, "and so does a person's row alone");
    assertThrows(
        () => presentOpenedReadings(reading, { ...screen, openUnnamedEnd: end, openRowId: person }),
        AssertionError,
        "never open at once",
    );
});
