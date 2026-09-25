/**
 * How long a status really stands on a combatant, read off the mask each payload restates as the
 * add-on reads it, so a combatant who has fallen carries nothing (`src/game/engine-warrior.ts`).
 * It asks one question: when one moment lights a status on several combatants at once, do they all
 * lose it at one moment, or each at their own Nth turn. The clock is the figures' own, turns taken
 * and lost both; `docs/auras-standing.md` is this report written down.
 *
 *     deno task fight:life [--cases] [recording.json …]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { formatInteger } from "#/libs/number-text.ts";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";
import { STATUS_BITS_MAXIMUM } from "#/src/core/carried-status.ts";
import type { FightStatistics } from "#/src/core/fight-statistics.ts";
import {
    formatRecordingName,
    readRecordedMaterial,
    type ReplayedStep,
    replayMaterialSteps,
    type SteppedFight,
} from "./recorded-material.ts";

/** One combatant carrying one status from the step it lit to the step it went out. */
interface StatusRun {
    combatantId: number;
    bit: number;
    litAt: number;
    wentOutAt: number;
    /** Turns of their own, taken and lost both, from the lighting to the going out. */
    ownTurns: number;
}

/**
 * Every combatant whose same status lit at the same step: one application, as far as anything
 * here can see. Whether it was one cast is not asked, because the mask does not say.
 */
export interface LightingRow {
    fight: string;
    bit: number;
    bitName: string;
    litAt: number;
    bearers: number;
    /** How many distinct steps the cohort's runs ended at. One means they ended together. */
    endings: number;
    /** One length per bearer, in that bearer's own turns, ascending. */
    ownTurnsEach: number[];
}

/** One status over whatever material was walked. */
export interface BitRow {
    bit: number;
    bitName: string;
    lightings: number;
    together: number;
    apart: number;
    /** Lightings of more than one bearer whose own-turn lengths all agree. */
    agreeing: number;
    /** Of those, the ones that also ended at several moments: no clock on the caster makes one. */
    apartAgreeing: number;
    /** The run length most bearers carried, in their own turns, and how many carried it. */
    ownTurnsCommon: number;
    ownTurnsCommonRuns: number;
    /** The longest one bearer carried it, in their own turns: nought where it never went out. */
    ownTurnsLongest: number;
}

interface OpenRun {
    litAt: number;
    turnsAtLighting: number;
}

/** One combatant's mask at one step, and what the walk holds between steps. */
interface RunStep {
    at: number;
    combatantId: number;
    mask: number;
    turnsByCombatantId: ReadonlyMap<number, number>;
    open: Map<string, OpenRun>;
    held: Map<string, boolean>;
    closed: StatusRun[];
}

/** Past the payload count of the longest recording, so each walk carries a stated bound. */
const STEPS_MAXIMUM = 4096;
/** Past the number of lightings one recording can hold, for the same reason. */
const RUNS_MAXIMUM = 65536;
const NAME_WIDTH = 22;
const CASES_FLAG = "--cases";

/** Every lighting over the material, recording by recording. */
export function replayLightingRows(stepped: readonly SteppedFight[]): LightingRow[] {
    assert(stepped.length > 0, "a walk stands on at least one recording");
    const found: LightingRow[] = [];
    for (const { fight, steps } of stepped) {
        const name = formatRecordingName(fight.path);
        for (const row of indexLightingRows(name, replayStatusRuns(steps))) found.push(row);
    }
    assert(found.length <= RUNS_MAXIMUM, "the corpus holds no more lightings than the bound");
    assert(found.every((row) => row.fight.length > 0), "and every lighting names its recording");
    return found;
}

/** Every run of every status in one recording, closed ones only: an open one has no length. */
function replayStatusRuns(steps: readonly ReplayedStep[]): StatusRun[] {
    const closed: StatusRun[] = [];
    const open = new Map<string, OpenRun>();
    const held = new Map<string, boolean>();
    assert(steps.length <= STEPS_MAXIMUM, "a recording carries no more payloads than the bound");
    for (const [at, step] of steps.entries()) {
        const turnsByCombatantId = indexTurnsByCombatantId(step.reading.figures.statistics);
        for (const [combatantId, mask] of step.record.statusMasksByCombatantId) {
            addStatusRunStep({ at, combatantId, mask, turnsByCombatantId, open, held, closed });
        }
    }
    assert(closed.length <= RUNS_MAXIMUM, "a recording holds no more runs than the bound");
    return closed;
}

/**
 * Turns taken and lost both, which is the clock `src/core/aura-standing.ts` counts a cast on: a
 * turn granted and spent on nothing still passed for whoever is carrying it.
 */
function indexTurnsByCombatantId(statistics: FightStatistics): Map<number, number> {
    const found = new Map<number, number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        assert(figures.turnsTaken >= 0, "a clock counts turns taken and never owes them");
        assert(figures.turnsLost >= 0, "and counts turns lost the same way");
        found.set(combatantId, figures.turnsTaken + figures.turnsLost);
    }
    assert(found.size <= statistics.byCombatantId.size, "no more clocks than combatants");
    return found;
}

/** One combatant's mask at one step, against what they were holding at the step before. */
function addStatusRunStep(step: RunStep): void {
    const clock = step.turnsByCombatantId.get(step.combatantId) ?? 0;
    assert(clock >= 0, "a combatant's clock never runs behind the start of the fight");
    assert(step.at >= 0, "and a payload is at a place in the recording");
    for (let bit = 0; bit < FROZEN_BUFF_BITS.bits.length; bit += 1) {
        const key = `${formatInteger(step.combatantId)}/${formatInteger(bit)}`;
        const has = isBitSet(step.mask, bit);
        const was = step.held.get(key);
        step.held.set(key, has);
        if (was === undefined) continue;
        if (!was) {
            if (has) step.open.set(key, { litAt: step.at, turnsAtLighting: clock });
            continue;
        }
        if (has) continue;
        addStatusRunClosed(step, key, bit, clock);
    }
}

function isBitSet(mask: number, bit: number): boolean {
    assert(bit >= 0, "a bit is looked for at a position");
    assert(bit < STATUS_BITS_MAXIMUM, "and inside the integer a mask arrives as");
    return (mask >> bit & 1) === 1;
}

function addStatusRunClosed(step: RunStep, key: string, bit: number, clock: number): void {
    const opened = step.open.get(key);
    if (opened === undefined) return;
    step.open.delete(key);
    assert(clock >= opened.turnsAtLighting, "a clock never runs backwards over one recording");
    assert(opened.litAt <= step.at, "and a status goes out no earlier than it lit");
    step.closed.push({
        combatantId: step.combatantId,
        bit,
        litAt: opened.litAt,
        wentOutAt: step.at,
        ownTurns: clock - opened.turnsAtLighting,
    });
}

/** The runs of one recording gathered into cohorts: one status, one step, everyone it lit on. */
function indexLightingRows(name: string, runs: readonly StatusRun[]): LightingRow[] {
    const byMoment = new Map<string, StatusRun[]>();
    for (const run of runs) {
        const key = `${formatInteger(run.bit)}/${formatInteger(run.litAt)}`;
        byMoment.set(key, [...(byMoment.get(key) ?? []), run]);
    }
    assert(name.length > 0, "the runs of a recording are gathered under its name");
    const found = [...byMoment.values()].map((gathered) => indexLightingRowsOne(name, gathered));
    assertStrictEquals(found.length, byMoment.size, "every moment gathered is a moment reported");
    return found.sort((one, other) => one.litAt - other.litAt);
}

function indexLightingRowsOne(name: string, gathered: readonly StatusRun[]): LightingRow {
    const [first] = gathered;
    assert(first !== undefined, "a lighting stands on at least one bearer");
    const bitName = FROZEN_BUFF_BITS.bits[first.bit];
    assert(bitName !== undefined, "and on a status the frozen table names");
    const endings = new Set(gathered.map((run) => run.wentOutAt));
    const ownTurnsEach = gathered.map((run) => run.ownTurns).sort((one, other) => one - other);
    assert(endings.size <= gathered.length, "and never on more endings than bearers");
    assert(gathered.every((run) => run.bit === first.bit), "one lighting is one status");
    return {
        fight: name,
        bit: first.bit,
        bitName,
        litAt: first.litAt,
        bearers: gathered.length,
        endings: endings.size,
        ownTurnsEach,
    };
}

/**
 * One row per status. `apart` is the count this whole walk exists for: a moment that lit several
 * bearers and let them go at several moments is a moment no single clock accounts for.
 */
export function tallyBitRows(lightings: readonly LightingRow[]): BitRow[] {
    const found: BitRow[] = [];
    for (const [bit, bitName] of FROZEN_BUFF_BITS.bits.entries()) {
        const mine = lightings.filter((row) => row.bit === bit);
        const shared = mine.filter((row) => row.bearers > 1);
        const apart = shared.filter((row) => row.endings > 1);
        const common = tallyBitRowsCommonTurns(mine);
        found.push({
            bit,
            bitName,
            lightings: mine.length,
            together: shared.filter((row) => row.endings === 1).length,
            apart: apart.length,
            agreeing: shared.filter(isLightingAgreeing).length,
            apartAgreeing: apart.filter(isLightingAgreeing).length,
            ownTurnsCommon: common.length,
            ownTurnsCommonRuns: common.runs,
            ownTurnsLongest: Math.max(0, ...mine.flatMap((row) => row.ownTurnsEach)),
        });
    }
    assertStrictEquals(found.length, FROZEN_BUFF_BITS.bits.length, "every frozen bit has a row");
    assert(
        found.every((row) => row.together + row.apart <= row.lightings),
        "and no row shares more lightings than it saw",
    );
    return found;
}

/**
 * The length most runs of one status came to. A refresh nobody saw lands as a longer run rather
 * than as two, and the mode survives that where a mean would not.
 */
function tallyBitRowsCommonTurns(rows: readonly LightingRow[]): { length: number; runs: number } {
    const runsByLength = new Map<number, number>();
    for (const row of rows) {
        for (const own of row.ownTurnsEach) runsByLength.set(own, (runsByLength.get(own) ?? 0) + 1);
    }
    assert(runsByLength.size <= RUNS_MAXIMUM, "a status came to no more lengths than runs");
    let found = { length: 0, runs: 0 };
    for (const [length, runs] of [...runsByLength].sort((one, other) => one[0] - other[0])) {
        if (runs > found.runs) found = { length, runs };
    }
    assert(found.runs >= 0, "a mode over nothing counts nothing");
    return found;
}

/** Whether every bearer of one lighting carried it for the same count of their own turns. */
function isLightingAgreeing(row: LightingRow): boolean {
    assert(row.ownTurnsEach.length > 0, "a lighting stands on at least one bearer");
    return new Set(row.ownTurnsEach).size === 1;
}

export function formatBitReport(rows: readonly BitRow[]): string[] {
    assert(rows.length > 0, "a report stands on at least one status");
    const heading = `${"status".padEnd(NAME_WIDTH)}` +
        "  lit  shared  together  apart  agreeing  apart+agree  own  runs  longest";
    return [
        heading,
        ...rows.map((row) => {
            const cells = [
                formatInteger(row.lightings).padStart(3),
                formatInteger(row.together + row.apart).padStart(6),
                formatInteger(row.together).padStart(8),
                formatInteger(row.apart).padStart(5),
                formatInteger(row.agreeing).padStart(8),
                formatInteger(row.apartAgreeing).padStart(11),
                formatInteger(row.ownTurnsCommon).padStart(3),
                formatInteger(row.ownTurnsCommonRuns).padStart(4),
                formatInteger(row.ownTurnsLongest).padStart(7),
            ];
            return `${row.bitName.padEnd(NAME_WIDTH)}  ${cells.join("  ")}`;
        }),
    ];
}

/** Every lighting that reached more than one bearer, one line each. */
export function formatLightingCases(lightings: readonly LightingRow[]): string[] {
    assert(lightings.length <= RUNS_MAXIMUM, "the cases reported stay inside the walk's bound");
    return lightings.filter((row) => row.bearers > 1).map((row) => {
        const turns = row.ownTurnsEach.map((one) => formatInteger(one)).join(", ");
        return `${row.fight}  ${row.bitName} lit at ${formatInteger(row.litAt)} on ` +
            `${formatInteger(row.bearers)}, out at ${formatInteger(row.endings)} steps, ` +
            `own turns ${turns}`;
    });
}

if (import.meta.main) {
    const paths = Deno.args.filter((one) => one !== CASES_FLAG);
    const lightings = replayLightingRows(replayMaterialSteps(readRecordedMaterial(paths)));
    const cases = Deno.args.includes(CASES_FLAG) ? formatLightingCases(lightings) : [];
    console.log([...cases, ...formatBitReport(tallyBitRows(lightings))].join("\n"));
}
