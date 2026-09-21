/**
 * How long a status really stands on a combatant, read off the mask the payload restates.
 *
 *     deno task fight:life [--cases] [path…]
 *
 * `w[].buffs` is the one channel that says what a combatant is carrying right now, and the panel
 * reads none of it (**ADR 0061**). This asks it one question: when one moment lights a status on
 * several combatants at once, do they all lose it at one moment, or each at their own Nth turn.
 * `docs/auras-standing.md` is this report written down.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { composeIntegerText } from "@/libs/number-text.ts";
import { getNumberFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import { FROZEN_BUFF_BITS } from "@/frozen/buff-bits.ts";
import type { FightStatistics } from "@/src/core/fight-statistics.ts";
import { composeFightReplaySteps, type FightReplayStep } from "@/tools/fight-replay.ts";
import { getRecordedFightAt } from "@/tools/recorded-fights.ts";
import { MAXIMUM_STATUS_BITS } from "@/tools/buff-bit-table.ts";
import { AuraLifetimeError } from "@/tools/margometer-tool-error.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

/** Past the payload count of the longest recording, so each walk carries a stated bound. */
const MAXIMUM_STEPS = 4096;
/** Past the number of lightings one recording can hold, for the same reason. */
const MAXIMUM_RUNS = 65536;
const NAME_COLUMN = 22;

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
 * here can see. Whether it was one cast is not asked — the mask does not say, and the question
 * this answers does not need it.
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
    /**
     * Of those, the ones that also ended at several moments — the figure this walk exists for.
     * One clock on the caster produces one ending, so a row here is a row no such clock explains.
     */
    apartAgreeing: number;
    /** The run length most bearers carried, in their own turns, and how many carried it. */
    ownTurnsCommon: number;
    ownTurnsCommonRuns: number;
}

function requireBitName(bit: number): string {
    const name = FROZEN_BUFF_BITS.bits[bit];
    if (name === undefined) throw new AuraLifetimeError(`no status is frozen for bit ${bit}`);
    assert(name.length > 0, "a bit that is frozen is named");
    return name;
}

/** The mask each combatant states in this payload, read off the wire rather than the reading. */
function getMaskByCombatantId(payload: unknown): Map<number, number> {
    const found = new Map<number, number>();
    if (!isRecord(payload)) return found;
    const warriors = payload["w"];
    if (!isRecord(warriors)) return found;
    for (const stated of Object.values(warriors)) {
        if (!isRecord(stated)) continue;
        const id = getNumberFromUnknown(stated["id"]);
        if (id === null) continue;
        const mask = getNumberFromUnknown(stated["buffs"]);
        if (mask === null) continue;
        assert(mask >= 0, "a mask the game states is a count of bits and never a sign");
        assert(Number.isSafeInteger(mask), "and an integer, because it is read bit by bit");
        found.set(id, mask);
    }
    return found;
}

/**
 * Turns taken and lost both, which is the clock `src/core/aura-standing.ts` counts a cast on — a
 * turn granted and spent on nothing still passed for whoever is carrying it (**ADR 0059**).
 */
function getTurnsByCombatantId(statistics: FightStatistics): Map<number, number> {
    const found = new Map<number, number>();
    for (const [id, figures] of statistics.byCombatantId) {
        assert(figures.turnsTaken >= 0, "a clock counts turns taken and never owes them");
        assert(figures.turnsLost >= 0, "and counts turns lost the same way");
        found.set(id, figures.turnsTaken + figures.turnsLost);
    }
    assert(found.size <= statistics.byCombatantId.size, "no more clocks than combatants");
    return found;
}

function isBitSet(mask: number, bit: number): boolean {
    assert(bit >= 0, "a bit is looked for at a position");
    assert(bit < MAXIMUM_STATUS_BITS, "and inside the integer a mask arrives as");
    return (mask >> bit & 1) === 1;
}

interface OpenRun {
    litAt: number;
    turnsAtLighting: number;
}

/** Every run of every status in one recording, closed ones only: an open one has no length. */
function composeFightRuns(steps: readonly FightReplayStep[]): StatusRun[] {
    const closed: StatusRun[] = [];
    const open = new Map<string, OpenRun>();
    const held = new Map<string, boolean>();
    assert(steps.length <= MAXIMUM_STEPS, "a recording carries no more payloads than the bound");
    for (const [at, step] of steps.entries()) {
        const masks = getMaskByCombatantId(step.payload);
        const turns = getTurnsByCombatantId(step.replay.statistics);
        for (const [id, mask] of masks) {
            addStepToRuns({ at, id, mask, turns, open, held, closed });
        }
    }
    assert(closed.length <= MAXIMUM_RUNS, "a recording holds no more runs than the bound");
    return closed;
}

interface RunStep {
    at: number;
    id: number;
    mask: number;
    turns: ReadonlyMap<number, number>;
    open: Map<string, OpenRun>;
    held: Map<string, boolean>;
    closed: StatusRun[];
}

/** One combatant's mask at one step, against what they were holding at the step before. */
function addStepToRuns(step: RunStep): void {
    const clock = step.turns.get(step.id) ?? 0;
    assert(clock >= 0, "a combatant's clock never runs behind the start of the fight");
    assert(step.at >= 0, "and a payload is at a place in the recording");
    for (let bit = 0; bit < FROZEN_BUFF_BITS.bits.length; bit += 1) {
        const key = `${step.id}/${composeIntegerText(bit)}`;
        const has = isBitSet(step.mask, bit);
        const was = step.held.get(key);
        step.held.set(key, has);
        if (was === undefined) continue;
        if (!was) {
            if (has) step.open.set(key, { litAt: step.at, turnsAtLighting: clock });
            continue;
        }
        if (has) continue;
        addClosedRun(step, key, bit, clock);
    }
}

function addClosedRun(step: RunStep, key: string, bit: number, clock: number): void {
    const opened = step.open.get(key);
    if (opened === undefined) return;
    step.open.delete(key);
    assert(clock >= opened.turnsAtLighting, "a clock never runs backwards over one recording");
    assert(opened.litAt <= step.at, "and a status goes out no earlier than it lit");
    step.closed.push({
        combatantId: step.id,
        bit,
        litAt: opened.litAt,
        wentOutAt: step.at,
        ownTurns: clock - opened.turnsAtLighting,
    });
}

/** The runs of one recording gathered into cohorts: one status, one step, everyone it lit on. */
function composeFightLightings(name: string, runs: readonly StatusRun[]): LightingRow[] {
    const byMoment = new Map<string, StatusRun[]>();
    for (const run of runs) {
        const key = `${composeIntegerText(run.bit)}/${composeIntegerText(run.litAt)}`;
        const gathered = byMoment.get(key) ?? [];
        gathered.push(run);
        byMoment.set(key, gathered);
    }
    assert(name.length > 0, "the runs of a recording are gathered under its name");
    const found = [...byMoment.values()].map((gathered) => composeLightingRow(name, gathered));
    assertStrictEquals(found.length, byMoment.size, "every moment gathered is a moment reported");
    return found.sort((one, other) => one.litAt - other.litAt);
}

function composeLightingRow(name: string, gathered: readonly StatusRun[]): LightingRow {
    const [first] = gathered;
    if (first === undefined) throw new AuraLifetimeError("a moment gathered nothing");
    const endings = new Set(gathered.map((run) => run.wentOutAt));
    const ownTurnsEach = gathered.map((run) => run.ownTurns).sort((one, other) => one - other);
    assert(gathered.length > 0, "a lighting stands on at least one bearer");
    assert(endings.size > 0, "and on at least one ending");
    assert(endings.size <= gathered.length, "and never on more endings than bearers");
    assert(gathered.every((run) => run.bit === first.bit), "one lighting is one status");
    return {
        fight: name,
        bit: first.bit,
        bitName: requireBitName(first.bit),
        litAt: first.litAt,
        bearers: gathered.length,
        endings: endings.size,
        ownTurnsEach,
    };
}

/** Every lighting over whatever material was named, the whole corpus where nothing was. */
export function composeLightingRows(paths: readonly string[]): LightingRow[] {
    const named = paths.length === 0 ? readRecordingPaths() : paths;
    if (named.length === 0) throw new AuraLifetimeError("no recording was there to walk");
    const found: LightingRow[] = [];
    for (const path of named) {
        const fight = getRecordedFightAt(path);
        const steps = composeFightReplaySteps(fight);
        for (const row of composeFightLightings(fight.name, composeFightRuns(steps))) {
            found.push(row);
        }
    }
    assert(found.length <= MAXIMUM_RUNS, "the corpus holds no more lightings than the bound");
    assert(found.every((row) => row.fight.length > 0), "and every lighting names its recording");
    return found;
}

/** Whether every bearer of one lighting carried it for the same count of their own turns. */
function isAgreeing(row: LightingRow): boolean {
    assert(row.ownTurnsEach.length > 0, "a lighting stands on at least one bearer");
    return new Set(row.ownTurnsEach).size === 1;
}

/**
 * The length most runs of one status came to, which is the figure the published table is held
 * against. A length is a run's own, so a refresh nobody saw lands here as a longer run rather
 * than as two — the mode is what survives that, and a mean would not.
 */
function getCommonOwnTurns(rows: readonly LightingRow[]): { length: number; runs: number } {
    const tally = new Map<number, number>();
    for (const row of rows) {
        for (const own of row.ownTurnsEach) tally.set(own, (tally.get(own) ?? 0) + 1);
    }
    assert(tally.size <= MAXIMUM_RUNS, "a status came to no more lengths than there were runs");
    let found = { length: 0, runs: 0 };
    for (const [length, runs] of [...tally].sort((one, other) => one[0] - other[0])) {
        if (runs > found.runs) found = { length, runs };
    }
    assert(found.runs >= 0, "a mode over nothing counts nothing");
    return found;
}

/**
 * One row per status. `apart` is the count this whole walk exists for: a moment that lit several
 * bearers and let them go at several moments is a moment no single clock accounts for.
 */
export function composeBitRows(lightings: readonly LightingRow[]): BitRow[] {
    const found: BitRow[] = [];
    for (const [bit, bitName] of FROZEN_BUFF_BITS.bits.entries()) {
        const mine = lightings.filter((row) => row.bit === bit);
        const shared = mine.filter((row) => row.bearers > 1);
        const common = getCommonOwnTurns(mine);
        found.push({
            bit,
            bitName,
            lightings: mine.length,
            together: shared.filter((row) => row.endings === 1).length,
            apart: shared.filter((row) => row.endings > 1).length,
            agreeing: shared.filter(isAgreeing).length,
            apartAgreeing: shared.filter((row) => row.endings > 1).filter(isAgreeing).length,
            ownTurnsCommon: common.length,
            ownTurnsCommonRuns: common.runs,
        });
    }
    assertStrictEquals(found.length, FROZEN_BUFF_BITS.bits.length, "every frozen bit has a row");
    assert(
        found.every((row) => row.together + row.apart <= row.lightings),
        "and no row shares more lightings than it saw",
    );
    return found;
}

function writeBitReport(rows: readonly BitRow[]): void {
    assert(rows.length > 0, "a report stands on at least one status");
    console.log(
        `${
            "status".padEnd(NAME_COLUMN)
        }  lit  shared  together  apart  agreeing  apart+agree  own  runs`,
    );
    for (const row of rows) {
        const cells = [
            composeIntegerText(row.lightings).padStart(3),
            composeIntegerText(row.together + row.apart).padStart(6),
            composeIntegerText(row.together).padStart(8),
            composeIntegerText(row.apart).padStart(5),
            composeIntegerText(row.agreeing).padStart(8),
            composeIntegerText(row.apartAgreeing).padStart(11),
            composeIntegerText(row.ownTurnsCommon).padStart(3),
            composeIntegerText(row.ownTurnsCommonRuns).padStart(4),
        ];
        console.log(`${row.bitName.padEnd(NAME_COLUMN)}  ${cells.join("  ")}`);
    }
}

function writeLightingCases(lightings: readonly LightingRow[]): void {
    assert(lightings.length <= MAXIMUM_RUNS, "the cases reported stay inside the walk's bound");
    for (const row of lightings) {
        if (row.bearers < 2) continue;
        const turns = row.ownTurnsEach.map((one) => composeIntegerText(one)).join(", ");
        console.log(
            `${row.fight}  ${row.bitName} lit at ${composeIntegerText(row.litAt)} on ` +
                `${composeIntegerText(row.bearers)}, out at ${
                    composeIntegerText(row.endings)
                } steps, own turns ${turns}`,
        );
    }
}

if (import.meta.main) {
    const paths = Deno.args.filter((one) => one !== "--cases");
    const lightings = composeLightingRows(paths);
    if (Deno.args.includes("--cases")) writeLightingCases(lightings);
    writeBitReport(composeBitRows(lightings));
}
