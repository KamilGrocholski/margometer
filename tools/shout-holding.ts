/**
 * Whom a provoked character actually strikes, turn by turn, once a shout has named them. The
 * protocol never says a shout ended, so its length is witnessed by nothing it states; this reads
 * the witness it does carry, what the held character does. Whom a shout holds is
 * `src/core/aura-standing.ts`'s answer, and `docs/auras-standing.md` is this report written down.
 *
 *     deno task fight:shout [recording.json …]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { formatInteger } from "#/libs/number-text.ts";
import { replayAuraStandings } from "#/src/core/aura-standing.ts";
import { BATTLE_EVENT, type BattleEvent } from "#/src/core/battle-event.ts";
import type { FightView } from "#/src/core/fight-session.ts";
import { PROVOCATION_KEY } from "#/src/core/protocol-key.ts";
import { addEventTurns, NO_TURN_STANDING } from "#/src/core/turn-clock.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";
import {
    readRecordedMaterial,
    type ReplayedFight,
    replayRecordedMaterial,
} from "./recorded-material.ts";

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

interface StruckTally {
    atShouter: number;
    atSomebodyElse: number;
}

interface Episode {
    provokedId: number;
    casterId: number;
    at: number;
    turnsAtShout: number;
}

/** Past the turns any shout the table dates runs for, so the report stays a stated bound. */
const TURNS_REPORTED_MAXIMUM = 8;
/** Over no blows, where a share would be a number nobody measured. */
const NO_SHARE = "—";
/** Past the episodes one corpus can hold, so each walk carries one. */
const EPISODES_MAXIMUM = 65536;
const TURN_WIDTH = 11;
const STATED_SKILLS = composeRuntimeTables().tooltip.statedSkills;

/** Every episode over the material. */
export function tallyHoldingReading(replayed: readonly ReplayedFight[]): HoldingReading {
    assert(replayed.length > 0, "a walk stands on at least one recording");
    const byTurn = new Map<number, StruckTally>();
    const baseline: StruckTally = { atShouter: 0, atSomebodyElse: 0 };
    let episodes = 0;
    for (const { reading } of replayed) {
        const events = reading.view.events;
        const clocks = replayClocks(events);
        for (const episode of replayEpisodes(reading.view, clocks)) {
            episodes += 1;
            assert(episodes <= EPISODES_MAXIMUM, "a corpus holds no more episodes than its bound");
            // Add the episode's blows, by how many of the held character's own turns had opened.
            {
                // It stops at the next shout of any kind: a later one replaces whatever held them
                // (`develop ADR 0062`), so a blow past that belongs to the shout that arrived.
                assert(
                    episode.at < events.length,
                    "an episode stands at a place inside the recording",
                );
                assert(
                    episode.turnsAtShout >= 0,
                    "and on a clock the held character had already reached",
                );
                for (const [later, laterEvent] of events.slice(episode.at + 1).entries()) {
                    if (isShoutAnnouncement(laterEvent)) break;
                    if (laterEvent.kind !== BATTLE_EVENT.attack) continue;
                    if (laterEvent.actorId !== episode.provokedId) continue;
                    if (laterEvent.targetId === null) continue;
                    const now = clocks[episode.at + 1 + later];
                    const elapsed = (now?.get(episode.provokedId) ?? 0) - episode.turnsAtShout;
                    if (elapsed < 0) continue;
                    if (elapsed > TURNS_REPORTED_MAXIMUM) continue;
                    const tally = byTurn.get(elapsed) ?? { atShouter: 0, atSomebodyElse: 0 };
                    addStruck(tally, laterEvent.targetId === episode.casterId);
                    byTurn.set(elapsed, tally);
                }
            }
            // Add the same pair before the shout landed, which is what a turn's share has to beat.
            {
                assert(
                    episode.at <= events.length,
                    "a baseline is read from before the shout landed",
                );
                for (const past of events.slice(0, episode.at)) {
                    if (past.kind !== BATTLE_EVENT.attack) continue;
                    if (past.actorId !== episode.provokedId) continue;
                    if (past.targetId === null) continue;
                    addStruck(baseline, past.targetId === episode.casterId);
                }
            }
        }
    }
    const rows = [...byTurn.keys()].sort((turns, otherTurns) => turns - otherTurns).map(
        (turnsElapsed) => {
            const tally = byTurn.get(turnsElapsed) ?? { atShouter: 0, atSomebodyElse: 0 };
            return { turnsElapsed, ...tally };
        },
    );
    assert(rows.length <= TURNS_REPORTED_MAXIMUM + 1, "no more turns reported than the bound");
    assert(episodes >= rows.length, "a turn reported stands on at least one episode");
    return { rows, baseline: { episodes, ...baseline } };
}

/**
 * Every combatant's own clock after each event, on the clock `src/core/turn-clock.ts` states:
 * turns taken and lost both, because a turn granted and spent on nothing still passed.
 */
function replayClocks(events: readonly BattleEvent[]): Map<number, number>[] {
    const clocks: Map<number, number>[] = [];
    const turns = new Map<number, number>();
    let standing = NO_TURN_STANDING;
    for (const event of events) {
        standing = addEventTurns(turns, event, standing);
        clocks.push(new Map(turns));
    }
    assertStrictEquals(clocks.length, events.length, "a clock is read after every event");
    assert([...turns.values()].every((clock) => clock > 0), "and a combatant counted took a turn");
    return clocks;
}

/** Every shout, resolved to the characters it named, with each one's own clock at the moment. */
function replayEpisodes(view: FightView, clocks: readonly Map<number, number>[]): Episode[] {
    const episodes: Episode[] = [];
    for (const [eventIndex, event] of view.events.entries()) {
        if (event.kind !== BATTLE_EVENT.skillUsed) continue;
        if (!isShoutAnnouncement(event)) continue;
        const upTo = { ...view, events: view.events.slice(0, eventIndex + 1) };
        for (const provocation of replayAuraStandings(upTo, STATED_SKILLS).provocations) {
            if (provocation.casterId !== event.actorId) continue;
            const turnsAtShout = clocks[eventIndex]?.get(provocation.provokedId) ?? 0;
            assert(turnsAtShout >= 0, "a character shouted at is on a clock that has not run back");
            assert(
                provocation.provokedId !== provocation.casterId,
                "and a shout never holds whoever threw it",
            );
            episodes.push({
                provokedId: provocation.provokedId,
                casterId: provocation.casterId,
                at: eventIndex,
                turnsAtShout,
            });
        }
    }
    assert(episodes.length <= EPISODES_MAXIMUM, "a fight holds no more episodes than the bound");
    return episodes;
}

function isShoutAnnouncement(event: BattleEvent): boolean {
    if (event.kind !== BATTLE_EVENT.skillUsed) return false;
    return event.declared.some((declared) => declared.effect === PROVOCATION_KEY);
}

function addStruck(tally: StruckTally, isAtShouter: boolean): void {
    if (isAtShouter) tally.atShouter += 1;
    else tally.atSomebodyElse += 1;
    assert(tally.atShouter >= 0, "a count of blows at the shouter is not negative");
    assert(tally.atSomebodyElse >= 0, "and neither is a count of the blows elsewhere");
}

/**
 * A share as whole percent, which is what a register states and a guard re-earns. Null over no
 * blows at all, which is no share rather than a share of nothing (E6).
 */
export function tallyStruckShare(atShouter: number, atSomebodyElse: number): number | null {
    const total = atShouter + atSomebodyElse;
    assert(atShouter >= 0, "a share is taken over blows that were counted");
    assert(atSomebodyElse >= 0, "and over the blows that went elsewhere as well");
    if (total === 0) return null;
    const share = Math.round(100 * atShouter / total);
    assert(share <= 100, "a share of the blows struck is no more than all of them");
    return share;
}

function formatHoldingReport(reading: HoldingReading): string[] {
    const { episodes, atShouter, atSomebodyElse } = reading.baseline;
    assert(episodes > 0, "a report stands on at least one episode");
    const before = formatStruckShare(tallyStruckShare(atShouter, atSomebodyElse));
    return [
        `${formatInteger(episodes)} episodes; before the shout ${before} of their blows ` +
        `already went at whoever would shout`,
        `${"turn".padStart(TURN_WIDTH)}  at shouter  elsewhere  share`,
        ...reading.rows.map((row) => {
            const share = tallyStruckShare(row.atShouter, row.atSomebodyElse);
            return `${formatInteger(row.turnsElapsed).padStart(TURN_WIDTH)}  ` +
                `${formatInteger(row.atShouter).padStart(10)}  ` +
                `${formatInteger(row.atSomebodyElse).padStart(9)}  ${formatStruckShare(share)}`;
        }),
    ];
}

function formatStruckShare(share: number | null): string {
    if (share === null) return NO_SHARE;
    return `${formatInteger(share)}%`;
}

if (import.meta.main) {
    const replayed = replayRecordedMaterial(readRecordedMaterial(Deno.args));
    console.log(formatHoldingReport(tallyHoldingReading(replayed)).join("\n"));
}
