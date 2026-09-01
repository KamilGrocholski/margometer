/**
 * A recording put back through the layers that read it live, so a tool and the panel cannot
 * disagree about a fight.
 *
 * The chain is `src/userscript-entry.ts`'s own: the session accumulates the payloads in the order
 * the game delivered them, the roster comes off what those payloads stated, and the figures are
 * composed from the events and the casts sized against them. Decoding the messages directly would
 * be a different reading — the decoder resolves a name through the roster, so a fight read without
 * one reports keys unread that the panel reads.
 */

import { assert, assertEquals } from "@std/assert";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import {
    addPayloadToSession,
    composeBattleSession,
    type FightReading,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import { RECORDING_DIRECTORY } from "@/project/repository-layout.ts";
import { RecordingReadError } from "@/tools/margometer-tool-error.ts";
import {
    getRecordedFightAt,
    getRecordedFights,
    type RecordedFight,
} from "@/tools/recorded-fights.ts";

/** One recording, and everything the add-on would have known about it. */
export interface FightReplay {
    name: string;
    reading: FightReading;
    roster: CombatantRoster;
    statistics: FightStatistics;
}

/**
 * What was replayed, named beside it. **V4**: a report over anything but the corpus is a claim
 * about that file and not about this repository, so the material travels with the figures.
 */
export interface ReplayedMaterial {
    material: string;
    replays: FightReplay[];
}

export function composeFightReplay(fight: RecordedFight): FightReplay {
    assert(fight.name.length > 0, "a replay is named for the recording it came from");
    assert(fight.calls.length > 0, "and is built from at least one call");
    const session = composeBattleSession();
    for (const call of fight.calls) addPayloadToSession(session, call);
    const reading = getFightFromSession(session);
    if (reading === null) {
        throw new RecordingReadError(`${fight.name} carries no payload the add-on would read`);
    }
    const statistics = composeFightStatistics(
        reading.events,
        composeTeamHeals(reading.events, reading.roster),
    );
    assert(reading.payloads > 0, "a fight that was read was built from something");
    assert(statistics.unreadMessages >= 0, "and states what it could not read, even as none");
    return { name: fight.name, reading, roster: reading.roster, statistics };
}

/**
 * The corpus where nothing was named, the named files otherwise. Both tools route through this,
 * so neither can mean something different by "the material" than the other does.
 */
export function composeReplayedMaterial(paths: readonly string[]): ReplayedMaterial {
    assert(paths.every((path) => path.length > 0), "a named recording is named by a path");
    const fights = paths.length === 0
        ? getRecordedFights()
        : paths.map((path) => getRecordedFightAt(path));
    const replays = fights.map((fight) => composeFightReplay(fight));
    assertEquals(replays.length, fights.length, "every recording read is a recording replayed");
    assert(replays.length > 0, "and something was replayed");
    return {
        material: paths.length === 0 ? `${RECORDING_DIRECTORY}/` : paths.join(" "),
        replays,
    };
}
