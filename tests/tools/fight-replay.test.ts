/**
 * The recording put back through the layers that read it live, against what those layers say on
 * their own.
 *
 * The claim worth holding is that a tool and the panel do not disagree about a fight: the figures
 * here are compared with the ones `tests/ui/panel-reading.test.ts` composes off the same file, by
 * the other route through the same core.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { RecordingReadError } from "@/tools/margometer-tool-error.ts";
import { composeFightReplay, composeReplayedMaterial } from "@/tools/fight-replay.ts";
import { getRecordedFightAt } from "@/tools/recorded-fights.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** The one recording whose snapshots are both empty: a fight fought on auto arrives whole. */
const AUTO = "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json";

Deno.test("a replay states the figures the panel's own route states", () => {
    const replay = composeFightReplay(getRecordedFightAt(HILDUR));
    // The route `tests/ui/panel-reading.test.ts` takes: the snapshots for the roster, the payloads
    // decoded against it. The replay reaches the same figures off the payloads alone.
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));

    assertEquals(
        replay.statistics.totals.damageDealtApplied,
        statistics.totals.damageDealtApplied,
        "the two routes total the same applied damage",
    );
    assertEquals(
        replay.statistics.totals.healthRestored,
        statistics.totals.healthRestored,
        "and the same restored health",
    );
    assertEquals(
        replay.statistics.byCombatantId.size,
        statistics.byCombatantId.size,
        "and hold a row for the same people",
    );
});

Deno.test("the roster comes off the payloads, so an auto fight is not a fight of nobody", () => {
    assertEquals(getRecordedCombatants(AUTO), [], "the snapshots state nobody at all");
    const replay = composeFightReplay(getRecordedFightAt(AUTO));
    assert(replay.roster.byId.size > 0, "and the payload states the only roster there is");
    assert(replay.reading.payloads > 0, "off a fight that arrived in one call");
});

Deno.test("every recording replays, and states what it could not read", () => {
    const paths = getRecordingPaths();
    assert(paths.length > 0, "there is material to replay");
    for (const path of paths) {
        const replay = composeFightReplay(getRecordedFightAt(path));
        assertEquals(replay.name, path.slice("captures/".length, -".json".length), "named for it");
        assert(replay.reading.payloads > 0, `${path} was built from something`);
        assertEquals(replay.statistics.unreadMessages, 0, `${path} is read whole`);
    }
});

Deno.test("the material is named beside what was replayed", () => {
    const corpus = composeReplayedMaterial([]);
    assertEquals(corpus.material, "captures/", "nothing named is the corpus, and says so");
    assert(corpus.replays.length > 1, "which is more than one recording");
    const one = composeReplayedMaterial([HILDUR]);
    assertEquals(one.material, HILDUR, "a named file is the claim's own material");
    assertEquals(one.replays.length, 1, "and it is the only thing replayed");
});

Deno.test("a path that is not there refuses under a name a reader can place", () => {
    const refused = assertThrows(
        () => composeReplayedMaterial(["captures/no-such-recording-was-ever-made.json"]),
        RecordingReadError,
    );
    assert(refused.name.startsWith("MargoMeterTool/"), "the brand says which program refused");
});
