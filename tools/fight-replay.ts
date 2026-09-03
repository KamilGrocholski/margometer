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

import { assert, assertStrictEquals } from "@std/assert";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeFightStatistics, type FightStatistics } from "@/src/core/fight-statistics.ts";
import {
    addPayloadToSession,
    type BattleSession,
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

/** The fight as it stood after one payload, beside the payload that put it there. */
export interface FightReplayStep {
    payload: unknown;
    replay: FightReplay;
}

/**
 * What was replayed, named beside it. **V4**: a report over anything but the corpus is a claim
 * about that file and not about this repository, so the material travels with the figures.
 */
export interface ReplayedMaterial {
    material: string;
    replays: FightReplay[];
}

/** The same, before anything was replayed — for a reader that needs the payloads themselves. */
export interface RecordedMaterial {
    material: string;
    fights: RecordedFight[];
}

/**
 * What a session has come to, or nothing where it has not yet been handed a fight.
 *
 * ⚠️ **The reading is copied, because `getFightFromSession` hands out the session's own arrays.**
 * Live there is one reading at a time and nothing notices; a step-by-step replay holds several at
 * once, and every one of them would grow as the next payload arrived. Read straight, each step
 * then reports the whole fight and every delta between two of them is nothing.
 */
function composeReplayOfSession(name: string, session: BattleSession): FightReplay | null {
    assert(name.length > 0, "a replay is named for the recording it came from");
    const held = getFightFromSession(session);
    if (held === null) return null;
    const reading: FightReading = {
        ...held,
        events: [...held.events],
        messagesByPayload: held.messagesByPayload.map((messages) => [...messages]),
    };
    const statistics = composeFightStatistics(
        reading.events,
        composeTeamHeals(reading.events, reading.roster),
    );
    assert(reading.payloads > 0, "a fight that was read was built from something");
    assert(statistics.unreadMessages >= 0, "and states what it could not read, even as none");
    assert(reading.events.length === held.events.length, "the copy holds what the session did");
    return { name, reading, roster: reading.roster, statistics };
}

export function composeFightReplay(fight: RecordedFight): FightReplay {
    assert(fight.name.length > 0, "a replay is named for the recording it came from");
    assert(fight.calls.length > 0, "and is built from at least one call");
    const session = composeBattleSession();
    for (const call of fight.calls) addPayloadToSession(session, call);
    const replay = composeReplayOfSession(fight.name, session);
    if (replay === null) {
        throw new RecordingReadError(`${fight.name} carries no payload the add-on would read`);
    }
    return replay;
}

/**
 * The same chain stopped after each payload, which is what a reading graded against a statement
 * the game makes payload by payload needs. A payload arriving before there is a fight to read
 * yields no step, so a step is always a fight and never an empty one.
 *
 * Cost: the figures are recomposed from the whole event list at every step, and `deno task
 * actions --cases` walks the whole corpus this way in about half a second, 2026-09-01 (**S3**).
 * The longest recording carries 111 payloads, which is what keeps the square small.
 */
export function composeFightReplaySteps(fight: RecordedFight): FightReplayStep[] {
    assert(fight.name.length > 0, "a replay is named for the recording it came from");
    assert(fight.calls.length > 0, "and is built from at least one call");
    const session = composeBattleSession();
    const steps: FightReplayStep[] = [];
    for (const call of fight.calls) {
        addPayloadToSession(session, call);
        const replay = composeReplayOfSession(fight.name, session);
        if (replay !== null) steps.push({ payload: call, replay });
    }
    assert(steps.length <= fight.calls.length, "a payload leaves the fight in one state, not two");
    if (steps.length === 0) {
        throw new RecordingReadError(`${fight.name} carries no payload the add-on would read`);
    }
    return steps;
}

/**
 * The corpus where nothing was named, the named files otherwise. Every tool routes through this,
 * so no two of them can mean something different by "the material".
 */
export function composeRecordedMaterial(paths: readonly string[]): RecordedMaterial {
    assert(paths.every((path) => path.length > 0), "a named recording is named by a path");
    const fights = paths.length === 0
        ? getRecordedFights()
        : paths.map((path) => getRecordedFightAt(path));
    assert(fights.length > 0, "and something was there to read");
    return {
        material: paths.length === 0 ? `${RECORDING_DIRECTORY}/` : paths.join(" "),
        fights,
    };
}

export function composeReplayedMaterial(paths: readonly string[]): ReplayedMaterial {
    const recorded = composeRecordedMaterial(paths);
    const replays = recorded.fights.map((fight) => composeFightReplay(fight));
    assertStrictEquals(
        replays.length,
        recorded.fights.length,
        "every recording read is a recording replayed",
    );
    assert(replays.length > 0, "and something was replayed");
    return { material: recorded.material, replays };
}
