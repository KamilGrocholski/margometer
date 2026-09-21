/**
 * Whom a provoked character actually strikes, turn by turn, once a shout has named them.
 *
 *     deno task fight:shout [path…]
 *
 * The protocol never says a shout ended, so `ADR 0059` filed its length as unwitnessed. This is
 * the witness it did not look for: what the held character does. `docs/auras-standing.md` is this
 * report written down, and `ADR 0103` is what the panel does with it.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { composeIntegerText } from "@/libs/number-text.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    composeAuraTurnsBySkillId,
    composeFightStandings,
    composeShoutsBySkillId,
    PROVOCATION_KEY,
    type StatedSkills,
} from "@/src/core/aura-standing.ts";
import {
    composeTurnStanding,
    getTurnOpener,
    NO_TURN_STANDING,
} from "@/src/core/fight-statistics.ts";
import { composeFightReplay } from "@/tools/fight-replay.ts";
import { getRecordedFightAt } from "@/tools/recorded-fights.ts";
import { AuraLifetimeError } from "@/tools/margometer-tool-error.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

/** Past the turns any shout the table dates runs for, so the report stays a stated bound. */
const MAXIMUM_TURNS_REPORTED = 8;
/** Past the episodes one corpus can hold, so each walk carries one. */
const MAXIMUM_EPISODES = 65536;
const TURN_COLUMN = 11;

const DATED: StatedSkills = {
    turnsBySkillId: composeAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
    shoutsBySkillId: composeShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
};

/** One of the held character's turns after a shout, over whatever material was walked. */
export interface HoldingRow {
    /** How many of their own turns had opened since the shout when the blow was struck. */
    turnsElapsed: number;
    atShouter: number;
    atSomebodyElse: number;
}

/** What the same characters were doing before a shout named them, which a row has to beat. */
export interface HoldingBaseline {
    episodes: number;
    atShouter: number;
    atSomebodyElse: number;
}

export interface HoldingReading {
    rows: HoldingRow[];
    baseline: HoldingBaseline;
}

interface Tally {
    atShouter: number;
    atSomebodyElse: number;
}

function addStruck(tally: Tally, isAtShouter: boolean): void {
    if (isAtShouter) tally.atShouter += 1;
    else tally.atSomebodyElse += 1;
    assert(tally.atShouter >= 0, "a count of blows at the shouter is not negative");
    assert(tally.atSomebodyElse >= 0, "and neither is a count of the blows elsewhere");
}

/**
 * Every combatant's own clock after each event, the way `composeAuraWalk` counts one — turns taken
 * and lost both, because a turn granted and spent on nothing still passed for whoever had it.
 */
function composeClocks(events: readonly BattleEvent[]): Map<number, number>[] {
    const clocks: Map<number, number>[] = [];
    const turns = new Map<number, number>();
    let standing = NO_TURN_STANDING;
    for (const event of events) {
        const opener = getTurnOpener(event, standing);
        if (opener !== null) turns.set(opener, (turns.get(opener) ?? 0) + 1);
        if (event.kind === "turn-lost") {
            if (event.combatantId !== null) {
                const id = event.combatantId;
                turns.set(id, (turns.get(id) ?? 0) + 1);
            }
        }
        standing = composeTurnStanding(event, standing);
        clocks.push(new Map(turns));
    }
    assertStrictEquals(clocks.length, events.length, "a clock is read after every event");
    assert([...turns.values()].every((one) => one > 0), "and a combatant counted took a turn");
    return clocks;
}

function isShoutAnnouncement(event: BattleEvent): boolean {
    if (event.kind !== "skill-used") return false;
    return event.declared.some((one) => one.effect === PROVOCATION_KEY);
}

interface Episode {
    provokedId: number;
    casterId: number;
    at: number;
    turnsAtShout: number;
}

/** Every shout, resolved to the characters it named, with each one's own clock at the moment. */
function composeEpisodes(events: readonly BattleEvent[], replay: {
    roster: Parameters<typeof composeFightStandings>[2];
}, clocks: readonly Map<number, number>[]): Episode[] {
    const found: Episode[] = [];
    for (const [at, event] of events.entries()) {
        if (!isShoutAnnouncement(event)) continue;
        if (event.kind !== "skill-used") continue;
        const standing = composeFightStandings(events.slice(0, at + 1), DATED, replay.roster);
        for (const one of standing.provocations) {
            if (one.casterId !== event.actorId) continue;
            assert(
                found.length < MAXIMUM_EPISODES,
                "a corpus holds no more episodes than its bound",
            );
            const turnsAtShout = clocks[at]?.get(one.provokedId) ?? 0;
            assert(turnsAtShout >= 0, "a character shouted at is on a clock that has not run back");
            assert(one.provokedId !== one.casterId, "and a shout never holds whoever threw it");
            found.push({ provokedId: one.provokedId, casterId: one.casterId, at, turnsAtShout });
        }
    }
    return found;
}

/**
 * One episode's blows, counted by how many of the held character's own turns had opened. It stops
 * at the next shout of any kind: **ADR 0062** says a later one replaces whatever held them, so a
 * blow past that belongs to the shout that arrived and never to this one.
 */
function addEpisodeToTally(
    events: readonly BattleEvent[],
    clocks: readonly Map<number, number>[],
    episode: Episode,
    byTurn: Map<number, Tally>,
): void {
    assert(episode.at < events.length, "an episode stands at a place inside the recording");
    assert(episode.turnsAtShout >= 0, "and on a clock the held character had already reached");
    for (const [later, next] of events.slice(episode.at + 1).entries()) {
        if (isShoutAnnouncement(next)) break;
        if (next.kind !== "attack") continue;
        if (next.actorId !== episode.provokedId) continue;
        if (next.targetId === null) continue;
        const now = clocks[episode.at + 1 + later];
        const elapsed = (now?.get(episode.provokedId) ?? 0) - episode.turnsAtShout;
        if (elapsed < 0) continue;
        if (elapsed > MAXIMUM_TURNS_REPORTED) continue;
        const tally = byTurn.get(elapsed) ?? { atShouter: 0, atSomebodyElse: 0 };
        addStruck(tally, next.targetId === episode.casterId);
        byTurn.set(elapsed, tally);
    }
}

/** The same pair before the shout landed, which is what a turn's share has to beat. */
function addEpisodeToBaseline(
    events: readonly BattleEvent[],
    episode: Episode,
    tally: Tally,
): void {
    assert(episode.at <= events.length, "a baseline is read from before the shout landed");
    for (const past of events.slice(0, episode.at)) {
        if (past.kind !== "attack") continue;
        if (past.actorId !== episode.provokedId) continue;
        if (past.targetId === null) continue;
        addStruck(tally, past.targetId === episode.casterId);
    }
}

/** Every episode over whatever material was named, the whole corpus where nothing was. */
export function composeHoldingReading(paths: readonly string[]): HoldingReading {
    const named = paths.length === 0 ? readRecordingPaths() : paths;
    if (named.length === 0) throw new AuraLifetimeError("no recording was there to walk");
    const byTurn = new Map<number, Tally>();
    const baseline: Tally = { atShouter: 0, atSomebodyElse: 0 };
    let episodes = 0;
    for (const path of named) {
        const replay = composeFightReplay(getRecordedFightAt(path));
        const events = replay.reading.events;
        const clocks = composeClocks(events);
        for (const episode of composeEpisodes(events, replay, clocks)) {
            episodes += 1;
            addEpisodeToTally(events, clocks, episode, byTurn);
            addEpisodeToBaseline(events, episode, baseline);
        }
    }
    const rows = [...byTurn.keys()].sort((one, other) => one - other).map((turnsElapsed) => {
        const tally = byTurn.get(turnsElapsed) ?? { atShouter: 0, atSomebodyElse: 0 };
        return { turnsElapsed, ...tally };
    });
    assert(rows.length <= MAXIMUM_TURNS_REPORTED + 1, "no more turns reported than the bound");
    assert(episodes >= rows.length, "a turn reported stands on at least one episode");
    assert(
        rows.every((row) => row.turnsElapsed >= 0),
        "and every turn reported is one that passed",
    );
    return { rows, baseline: { episodes, ...baseline } };
}

/** A share as whole percent, which is what a register states and a guard re-earns. */
export function getStruckShare(atShouter: number, atSomebodyElse: number): number {
    const total = atShouter + atSomebodyElse;
    assert(atShouter >= 0, "a share is taken over blows that were counted");
    assert(atSomebodyElse >= 0, "and over the blows that went elsewhere as well");
    if (total === 0) return 0;
    const share = Math.round(100 * atShouter / total);
    assert(share <= 100, "a share of the blows struck is no more than all of them");
    return share;
}

function writeHoldingReport(reading: HoldingReading): void {
    const { episodes, atShouter, atSomebodyElse } = reading.baseline;
    assert(episodes > 0, "a report stands on at least one episode");
    console.log(
        `${composeIntegerText(episodes)} episodes; before the shout ${
            composeIntegerText(getStruckShare(atShouter, atSomebodyElse))
        }% of their blows already went at whoever would shout`,
    );
    console.log(`${"turn".padStart(TURN_COLUMN)}  at shouter  elsewhere  share`);
    for (const row of reading.rows) {
        console.log(
            `${composeIntegerText(row.turnsElapsed).padStart(TURN_COLUMN)}  ${
                composeIntegerText(row.atShouter).padStart(10)
            }  ${composeIntegerText(row.atSomebodyElse).padStart(9)}  ${
                composeIntegerText(getStruckShare(row.atShouter, row.atSomebodyElse))
            }%`,
        );
    }
}

if (import.meta.main) {
    writeHoldingReport(composeHoldingReading(Deno.args));
}
