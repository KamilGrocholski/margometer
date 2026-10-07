/**
 * How long a status really stands on a combatant, read off what the add-on says each one carries
 * after each payload (`src/core/carried-status.ts`), so a combatant who has fallen carries nothing
 * and a run is as long as the add-on counts it, on the bearer's own clock. It asks one question:
 * when one moment lights a status on several combatants at once, do they all lose it at one
 * moment, or each at their own Nth turn. `docs/auras-standing.md` is this report written down.
 *
 *     deno task fight:life [--cases] [recording.json …]
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { formatInteger } from "#/libs/number-text.ts";
import { FROZEN_STATUS_BITS } from "#/frozen/status-bits.ts";
import { CALLS_MAXIMUM } from "#/src/ports/fight-capture.ts";
import {
    formatRecordingName,
    readRecordedMaterial,
    type ReplayedStep,
    replayMaterialSteps,
    type SteppedFight,
} from "./recorded-material.ts";
import { RecordingReadError } from "./margometer-tool-error.ts";

/** One combatant carrying one status from the step it lit to the step it went out. */
interface StatusRun {
    combatantId: number;
    bit: number;
    litAt: number;
    wentOutAt: number;
    /** Turns of their own on the add-on's clock, from the lighting to the step it went out. */
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

/** A status standing at one step, as the add-on counted it there. */
interface StandingRun {
    combatantId: number;
    bit: number;
    /** Null where it already stood at the recording's first payload: no lighting was seen. */
    litAt: number | null;
    turnsElapsed: number;
    turnsAtLighting: number;
}

/** Past the number of lightings one recording can hold, for the same reason. */
const RUNS_MAXIMUM = 65536;
const NAME_WIDTH = 22;
const CASES_FLAG = "--cases";

/** Every lighting over the material, recording by recording. */
export function replayLightingRows(stepped: readonly SteppedFight[]): LightingRow[] {
    assert(stepped.length > 0, "a walk stands on at least one recording");
    const lightings: LightingRow[] = [];
    for (const { fight, steps } of stepped) {
        const name = formatRecordingName(fight.path);
        for (const row of composeLightingRows(name, replayStatusRuns(steps))) lightings.push(row);
    }
    if (lightings.length > RUNS_MAXIMUM) {
        throw new RecordingReadError(
            `the recordings hold more lightings than the ${RUNS_MAXIMUM} walked`,
        );
    }
    assert(
        lightings.every((row) => row.fight.length > 0),
        "and every lighting names its recording",
    );
    return lightings;
}

/**
 * Every run of every status in one recording, closed ones only: an open one has no length. A run
 * lights at the step the add-on first says it is carried and goes out at the first step it no
 * longer does. A bit the frozen table does not name is passed over, having no row to land in.
 */
function replayStatusRuns(steps: readonly ReplayedStep[]): StatusRun[] {
    assert(steps.length <= CALLS_MAXIMUM, "a recording carries no more payloads than the bound");
    const closed: StatusRun[] = [];
    let standing = new Map<string, StandingRun>();
    for (const [stepIndex, step] of steps.entries()) {
        const carried = new Map<string, StandingRun>();
        for (const status of step.reading.view.carriedStatuses) {
            if (status.bit >= FROZEN_STATUS_BITS.bits.length) continue;
            const key = `${formatInteger(status.combatantId)}/${formatInteger(status.bit)}`;
            const before = standing.get(key);
            let litAt: number | null;
            if (before !== undefined) {
                assert(
                    status.turnsElapsed >= before.turnsElapsed,
                    "a run's clock never runs backwards",
                );
                litAt = before.litAt;
            } else if (stepIndex === 0) litAt = null;
            else litAt = stepIndex;
            const turnsNow = step.reading.view.turnsByCombatantId.get(status.combatantId) ?? 0;
            carried.set(key, {
                combatantId: status.combatantId,
                bit: status.bit,
                litAt,
                turnsElapsed: status.turnsElapsed,
                turnsAtLighting: before?.turnsAtLighting ?? turnsNow - status.turnsElapsed,
            });
        }
        for (const [key, run] of standing) {
            if (carried.has(key)) continue;
            if (run.litAt === null) continue;
            // ⚠️ The length runs to the step it went out at, as the published lengths count it:
            // the last turn it stood at is one short of that, or more where a payload skipped.
            const turnsAtGoingOut = step.reading.view.turnsByCombatantId.get(run.combatantId) ?? 0;
            assert(run.litAt < stepIndex, "a status goes out after the step it lit at");
            assert(
                turnsAtGoingOut >= run.turnsAtLighting,
                "a clock never runs backwards over one recording",
            );
            closed.push({
                combatantId: run.combatantId,
                bit: run.bit,
                litAt: run.litAt,
                wentOutAt: stepIndex,
                ownTurns: turnsAtGoingOut - run.turnsAtLighting,
            });
        }
        standing = carried;
    }
    if (closed.length > RUNS_MAXIMUM) {
        throw new RecordingReadError(`a recording holds more runs than the ${RUNS_MAXIMUM} walked`);
    }
    return closed;
}

/** The runs of one recording gathered into cohorts: one status, one step, everyone it lit on. */
function composeLightingRows(name: string, runs: readonly StatusRun[]): LightingRow[] {
    const byMoment = new Map<string, StatusRun[]>();
    for (const run of runs) {
        const key = `${formatInteger(run.bit)}/${formatInteger(run.litAt)}`;
        byMoment.set(key, [...(byMoment.get(key) ?? []), run]);
    }
    assert(name.length > 0, "the runs of a recording are gathered under its name");
    const rows = [...byMoment.values()].map((gathered) => composeLightingRow(name, gathered));
    assertStrictEquals(rows.length, byMoment.size, "every moment gathered is a moment reported");
    return rows.sort((row, otherRow) => row.litAt - otherRow.litAt);
}

function composeLightingRow(name: string, gathered: readonly StatusRun[]): LightingRow {
    const [firstRun] = gathered;
    assertExists(firstRun, "a lighting stands on at least one bearer");
    const bitName = FROZEN_STATUS_BITS.bits[firstRun.bit];
    assertExists(bitName, "and on a status the frozen table names");
    const endings = new Set(gathered.map((run) => run.wentOutAt));
    const ownTurnsEach = gathered.map((run) => run.ownTurns).sort((turns, otherTurns) =>
        turns - otherTurns
    );
    assert(endings.size <= gathered.length, "and never on more endings than bearers");
    assert(gathered.every((run) => run.bit === firstRun.bit), "one lighting is one status");
    return {
        fight: name,
        bit: firstRun.bit,
        bitName,
        litAt: firstRun.litAt,
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
    const rows: BitRow[] = [];
    for (const [bit, bitName] of FROZEN_STATUS_BITS.bits.entries()) {
        const mine = lightings.filter((row) => row.bit === bit);
        const shared = mine.filter((row) => row.bearers > 1);
        const apart = shared.filter((row) => row.endings > 1);
        const common = tallyBitRowsCommonTurns(mine);
        rows.push({
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
    assertStrictEquals(rows.length, FROZEN_STATUS_BITS.bits.length, "every frozen bit has a row");
    assert(
        rows.every((row) => row.together + row.apart <= row.lightings),
        "and no row shares more lightings than it saw",
    );
    return rows;
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
    let mode = { length: 0, runs: 0 };
    for (
        const [length, runs] of [...runsByLength].sort((tally, otherTally) =>
            tally[0] - otherTally[0]
        )
    ) {
        if (runs > mode.runs) mode = { length, runs };
    }
    assert(mode.runs >= 0, "a mode over nothing counts nothing");
    return mode;
}

/** Whether every bearer of one lighting carried it for the same count of their own turns. */
function isLightingAgreeing(row: LightingRow): boolean {
    assert(row.ownTurnsEach.length > 0, "a lighting stands on at least one bearer");
    return new Set(row.ownTurnsEach).size === 1;
}

function formatBitReport(rows: readonly BitRow[]): string[] {
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
function formatLightingCases(lightings: readonly LightingRow[]): string[] {
    assert(lightings.length <= RUNS_MAXIMUM, "the cases reported stay inside the walk's bound");
    return lightings.filter((row) => row.bearers > 1).map((row) => {
        const turns = row.ownTurnsEach.map((ownTurns) => formatInteger(ownTurns)).join(", ");
        return `${row.fight}  ${row.bitName} lit at ${formatInteger(row.litAt)} on ` +
            `${formatInteger(row.bearers)}, out at ${formatInteger(row.endings)} steps, ` +
            `own turns ${turns}`;
    });
}

if (import.meta.main) {
    const paths = Deno.args.filter((argument) => argument !== CASES_FLAG);
    const lightings = replayLightingRows(replayMaterialSteps(readRecordedMaterial(paths)));
    const cases = Deno.args.includes(CASES_FLAG) ? formatLightingCases(lightings) : [];
    console.log([...cases, ...formatBitReport(tallyBitRows(lightings))].join("\n"));
}
