/**
 * What one skill put on a whole side, whom it stood on, and how many stood at once — against the
 * turns the published table states for it.
 *
 *     deno task fight:auras [path…]
 *
 * The register in `docs/auras-standing.md` is this report written down, and
 * `tests/tools/aura-standing.test.ts` holds the document to what this produces, both ways.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { composeIntegerText } from "@/libs/number-text.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    type AuraReach,
    type AuraStanding,
    composeAuraTurnsBySkillId,
    composeFightStandings,
    composeShoutsBySkillId,
    isTeamWideKey,
    PROVOCATION_KEY,
    type StatedSkills,
} from "@/src/core/aura-standing.ts";
import { composeFightReplaySteps } from "@/tools/fight-replay.ts";
import { getRecordedFightAt } from "@/tools/recorded-fights.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

/** Past every skill the published table dates, so each walk carries a stated bound. */
const MAXIMUM_SKILLS = 1024;
const NAME_COLUMN = 22;

const DATED: StatedSkills = {
    turnsBySkillId: composeAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
    shoutsBySkillId: composeShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
};

/** One skill, over whatever material was replayed. */
export interface AuraRow {
    skillId: number;
    /** The game's own spelling, as the announcement carried it. */
    skillName: string;
    /** How many combatants were ever seen carrying it, over the material. */
    casters: number;
    /** How many recordings it stands in at all. */
    recordings: number;
    /** The most standing at one moment, which is the rows the window would draw under it. */
    standingAtOnce: number;
    /** What the published table states, and what a row leaves on. */
    turnsStated: number;
    /** Which side it reaches, or null where nothing settles it. */
    reach: AuraReach | null;
}

/**
 * One effect key, and how many casts of it stood together at a moment.
 *
 * The published help caps a standing effect at **two sources from different Players**, so a moment
 * with three is a moment where the panel would have to drop one. This register is what says the
 * corpus reaches that case at all.
 */
export interface SourceRow {
    key: string;
    /** Moments where exactly two different combatants held it together. */
    momentsWithTwo: number;
    /** Moments where three or more did, which is where the cap bites. */
    momentsPastTwo: number;
    /** Moments where one combatant held it twice, which the help counts as one source. */
    momentsFromOne: number;
    /** The most that ever stood together, whoever cast them. */
    sourcesAtOnce: number;
}

/** What the two okrzyki come to: one state per character held, whoever shouted last. */
export interface ProvocationRow {
    skillId: number;
    skillName: string;
    /** Combatants ever seen holding somebody with it. */
    casters: number;
    /** Recordings it is the holder in at the end of at least one payload. */
    recordings: number;
    /** The most characters held by it at one moment. */
    heldAtOnce: number;
    turnsStated: number;
    /** The fewest characters the published table says it covers, at any skill level. */
    coverageMinimum: number;
    /** The most characters one cast of it was ever seen to name at once. */
    namedAtOnce: number;
}

interface AuraTally {
    row: AuraRow;
    casterIds: Set<number>;
    paths: Set<string>;
}

function addStandingsToTally(
    tallies: Map<number, AuraTally>,
    standings: readonly AuraStanding[],
    path: string,
): void {
    const atOnce = new Map<number, number>();
    for (const standing of standings) {
        atOnce.set(standing.skillId, (atOnce.get(standing.skillId) ?? 0) + 1);
        const held = tallies.get(standing.skillId) ?? {
            row: {
                skillId: standing.skillId,
                skillName: standing.skillName,
                casters: 0,
                recordings: 0,
                standingAtOnce: 0,
                turnsStated: standing.turnsStated,
                reach: standing.reach,
            },
            casterIds: new Set<number>(),
            paths: new Set<string>(),
        };
        held.casterIds.add(standing.casterId);
        held.paths.add(path);
        held.row.reach = standing.reach;
        tallies.set(standing.skillId, held);
    }
    for (const [skillId, count] of atOnce) {
        const held = tallies.get(skillId);
        if (held === undefined) continue;
        if (count > held.row.standingAtOnce) held.row.standingAtOnce = count;
    }
    assert(atOnce.size <= MAXIMUM_SKILLS, "a moment stays inside the stated bound");
    assert(tallies.size <= MAXIMUM_SKILLS, "and so does the register it is added to");
}

/**
 * Every step of every recording, because what stands is a reading of a **moment**: `at once` is
 * the most that ever stood together, and by the last payload of a fight some have run out.
 */
export function composeAuraRows(paths: readonly string[]): AuraRow[] {
    const tallies = new Map<number, AuraTally>();
    for (const path of paths) {
        const fight = getRecordedFightAt(path);
        for (const step of composeFightReplaySteps(fight)) {
            const held = composeFightStandings(
                step.replay.reading.events,
                DATED,
                step.replay.reading.roster,
            );
            addStandingsToTally(tallies, held.standings, path);
        }
    }
    const rows: AuraRow[] = [];
    for (const tally of tallies.values()) {
        rows.push({
            ...tally.row,
            casters: tally.casterIds.size,
            recordings: tally.paths.size,
        });
    }
    assertStrictEquals(rows.length, tallies.size, "a skill is registered once");
    assert(rows.every((one) => one.turnsStated > 0), "and each carries the turns it was dated by");
    return rows.sort((left, right) => left.skillId - right.skillId);
}

/** The figures one announcement declared, by the key that carried each. */
function composeAmountsFromCast(event: BattleEvent): Map<string, number | null> {
    const found = new Map<string, number | null>();
    if (event.kind !== "skill-used") return found;
    for (const one of event.declared) {
        if (!isTeamWideKey(one.effect)) continue;
        found.set(one.effect, one.amount);
    }
    return found;
}

/**
 * How many sources of one key stand together, over every moment of every recording.
 *
 * A **source** is a combatant, not a cast: the help caps the effect at two sources *from different
 * Players*, so two casts by one combatant are one source and the panel already refreshes them into
 * one row.
 */
export function composeSourceRows(paths: readonly string[]): SourceRow[] {
    const tallies = new Map<string, SourceRow>();
    for (const path of paths) {
        const amounts = new Map<string, Map<string, number | null>>();
        for (const step of composeFightReplaySteps(getRecordedFightAt(path))) {
            const reading = step.replay.reading;
            for (const event of reading.events) {
                if (event.kind !== "skill-used") continue;
                if (event.actorId === null) continue;
                const declared = composeAmountsFromCast(event);
                if (declared.size === 0) continue;
                amounts.set(`${event.actorId}/${event.skillId}`, declared);
            }
            const held = composeFightStandings(reading.events, DATED, reading.roster).standings;
            const casters = new Map<string, number[]>();
            for (const one of held) {
                for (
                    const key of (amounts.get(`${one.casterId}/${one.skillId}`) ?? new Map()).keys()
                ) {
                    const seen = casters.get(key) ?? [];
                    seen.push(one.casterId);
                    casters.set(key, seen);
                }
            }
            assert(casters.size <= MAXIMUM_SKILLS, "a moment stays inside the stated bound");
            for (const [key, held] of casters) {
                const row = tallies.get(key) ?? {
                    key,
                    momentsWithTwo: 0,
                    momentsPastTwo: 0,
                    momentsFromOne: 0,
                    sourcesAtOnce: 0,
                };
                const sources = new Set(held).size;
                if (sources === 2) row.momentsWithTwo += 1;
                if (sources > 2) row.momentsPastTwo += 1;
                if (held.length > sources) row.momentsFromOne += 1;
                if (sources > row.sourcesAtOnce) row.sourcesAtOnce = sources;
                tallies.set(key, row);
            }
        }
    }
    const rows = [...tallies.values()].filter((one) => one.sourcesAtOnce > 1);
    // Plain comparison rather than `localeCompare`: the keys are the game's own ASCII spellings,
    // and `docs/browser-support.md` registers that construct as spelled nowhere in this tree.
    return rows.sort((left, right) => (left.key < right.key ? -1 : 1));
}

/** The side a cast reaches, as the register writes it. `—` is nothing settling it, not both. */
const REACH_WORDS: Record<string, string> = {
    "casters-side": "caster's",
    "other-side": "other",
    "both-sides": "both",
};

/** The most characters one announcement of a skill named, by the skill it was announced on. */
function composeNamedByCast(events: readonly BattleEvent[]): Map<number, number> {
    const found = new Map<number, number>();
    for (const event of events) {
        if (event.kind !== "skill-used") continue;
        if (event.skillId === null) continue;
        for (const one of event.declared) {
            if (one.effect !== PROVOCATION_KEY) continue;
            if (one.text === null) continue;
            const named = one.text.split(", ").filter((name) => name.length > 0).length;
            if (named > (found.get(event.skillId) ?? 0)) found.set(event.skillId, named);
        }
    }
    return found;
}

/** The same walk, over what a shout holds rather than over what stands on a side. */
export function composeProvocationRows(paths: readonly string[]): ProvocationRow[] {
    const tallies = new Map<
        number,
        { row: ProvocationRow; casterIds: Set<number>; paths: Set<string> }
    >();
    for (const path of paths) {
        for (const step of composeFightReplaySteps(getRecordedFightAt(path))) {
            const reading = step.replay.reading;
            const held = composeFightStandings(reading.events, DATED, reading.roster).provocations;
            const atOnce = new Map<number, number>();
            for (const one of held) {
                atOnce.set(one.skillId, (atOnce.get(one.skillId) ?? 0) + 1);
                const tally = tallies.get(one.skillId) ?? {
                    row: {
                        skillId: one.skillId,
                        skillName: one.skillName,
                        casters: 0,
                        recordings: 0,
                        heldAtOnce: 0,
                        turnsStated: one.turnsStated,
                        coverageMinimum: DATED.shoutsBySkillId.get(one.skillId)?.coverageMinimum ??
                            0,
                        namedAtOnce: 0,
                    },
                    casterIds: new Set<number>(),
                    paths: new Set<string>(),
                };
                tally.casterIds.add(one.casterId);
                tally.paths.add(path);
                tallies.set(one.skillId, tally);
            }
            for (const [skillId, count] of atOnce) {
                const tally = tallies.get(skillId);
                if (tally === undefined) continue;
                if (count > tally.row.heldAtOnce) tally.row.heldAtOnce = count;
            }
            for (const [skillId, count] of composeNamedByCast(reading.events)) {
                const tally = tallies.get(skillId);
                if (tally === undefined) continue;
                if (count > tally.row.namedAtOnce) tally.row.namedAtOnce = count;
            }
            assert(tallies.size <= MAXIMUM_SKILLS, "the register stays inside its stated bound");
        }
    }
    const rows: ProvocationRow[] = [];
    for (const tally of tallies.values()) {
        rows.push({ ...tally.row, casters: tally.casterIds.size, recordings: tally.paths.size });
    }
    assertStrictEquals(rows.length, tallies.size, "a skill is registered once");
    return rows.sort((left, right) => left.skillId - right.skillId);
}

function writeProvocationReport(rows: readonly ProvocationRow[]): void {
    console.log(`\nwhat a shout holds\n`);
    console.log(
        `${"id".padStart(4)}  ${"skill".padEnd(NAME_COLUMN)} ${"casters".padStart(7)}` +
            ` ${"fights".padStart(6)} ${"at once".padStart(7)} ${"stated".padStart(6)}` +
            ` ${"covers".padStart(6)} ${"names".padStart(9)}`,
    );
    for (const row of rows) {
        console.log(
            `${composeIntegerText(row.skillId).padStart(4)}  ${row.skillName.padEnd(NAME_COLUMN)}` +
                ` ${composeIntegerText(row.casters).padStart(7)}` +
                ` ${composeIntegerText(row.recordings).padStart(6)}` +
                ` ${composeIntegerText(row.heldAtOnce).padStart(7)}` +
                ` ${composeIntegerText(row.turnsStated).padStart(6)}` +
                ` ${composeIntegerText(row.coverageMinimum).padStart(6)}` +
                ` ${composeIntegerText(row.namedAtOnce).padStart(9)}`,
        );
    }
    assert(NAME_COLUMN > 0, "and each has a column to stand in");
}

function writeSourceReport(rows: readonly SourceRow[]): void {
    console.log(`\nhow many sources of one key stand together\n`);
    console.log(
        `${"key".padEnd(30)} ${"two".padStart(6)} ${"past two".padStart(8)}` +
            ` ${"one twice".padStart(9)} ${"at once".padStart(7)}`,
    );
    for (const row of rows) {
        console.log(
            `${row.key.padEnd(30)} ${composeIntegerText(row.momentsWithTwo).padStart(6)}` +
                ` ${composeIntegerText(row.momentsPastTwo).padStart(8)}` +
                ` ${composeIntegerText(row.momentsFromOne).padStart(9)}` +
                ` ${composeIntegerText(row.sourcesAtOnce).padStart(7)}`,
        );
    }
}

function writeAuraReport(rows: readonly AuraRow[], material: string): void {
    console.log(`what stands, over ${material}\n`);
    console.log(
        `${"id".padStart(4)}  ${"skill".padEnd(NAME_COLUMN)} ${"on".padStart(4)}` +
            ` ${"fights".padStart(6)} ${"at once".padStart(7)} ${"stated".padStart(6)}` +
            ` ${"reaches".padStart(8)}`,
    );
    for (const row of rows) {
        console.log(
            `${composeIntegerText(row.skillId).padStart(4)}  ${row.skillName.padEnd(NAME_COLUMN)}` +
                ` ${composeIntegerText(row.casters).padStart(4)}` +
                ` ${composeIntegerText(row.recordings).padStart(6)}` +
                ` ${composeIntegerText(row.standingAtOnce).padStart(7)}` +
                ` ${composeIntegerText(row.turnsStated).padStart(6)}` +
                ` ${(row.reach === null ? "—" : REACH_WORDS[row.reach] ?? "—").padStart(8)}`,
        );
    }
    assert(material.length > 0, "and names the material it was taken over");
}

if (import.meta.main) {
    const stated = Deno.args.filter((one) => !one.startsWith("--"));
    const paths = stated.length > 0 ? stated : readRecordingPaths();
    const material = stated.length > 0
        ? `${composeIntegerText(paths.length)} named recordings`
        : `${composeIntegerText(paths.length)} recordings in captures/`;
    writeAuraReport(composeAuraRows(paths), material);
    writeProvocationReport(composeProvocationRows(paths));
    writeSourceReport(composeSourceRows(paths));
}
