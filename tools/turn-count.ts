/**
 * How many turns a fight's combatants took, and how that count stands against the game's own
 * numbering of them.
 *
 *     deno task turns                        the register, over the corpus
 *     deno task turns --cases                the counts behind each verdict
 *     deno task turns captures/<file>.json   one recording, payload by payload
 *
 * The count itself is the aggregate's (`src/core/fight-statistics.ts`); what is here is the
 * reference it is graded against and nothing else. `docs/turns-taken.md` carries the verdicts and
 * what they do not claim. The figures come off the replay, so this and the panel cannot disagree
 * about a fight (`tools/fight-replay.ts`).
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import type { FightStatistics } from "@/src/core/fight-statistics.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { getNumberFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import { TurnCountError } from "@/tools/margometer-tool-error.ts";
import {
    composeFightReplaySteps,
    composeRecordedMaterial,
    type FightReplayStep,
} from "@/tools/fight-replay.ts";
import type { RecordedFight } from "@/tools/recorded-fights.ts";

/**
 * The queue of turns the client draws as its prediction list (published help, article 372 §1.1,
 * read 2026-09-02), spelled here because this is the one file that reads it (**N13**). It is an
 * envelope key and not a message key, which is why `docs/protocol-keys.md` has no entry for it.
 */
const TURN_QUEUE_KEY = "turns_warriors";
/**
 * Whom the game says holds the turn the queue's least ordinal numbers. Read only as a witness:
 * over `captures/` on 2026-09-02 it is the queue's own entry at that ordinal in every payload
 * carrying both, so a disagreement is this reader breaking rather than the game moving.
 */
const CURRENT_KEY = "current";

/** A run names a handful of recordings; this is far past that. */
const MAXIMUM_ARGUMENTS = 256;
/** Past every recording the corpus holds, and past what one sitting would name by hand. */
const MAXIMUM_RECORDINGS = 4096;
/** The longest recording in `captures/` carries 111 payloads, 2026-09-01. */
const MAXIMUM_PAYLOADS = 100000;
/** The queue is ten entries wide in all 1022 payloads carrying it, 2026-09-02. */
const MAXIMUM_QUEUE = 1024;

/**
 * What one graded step came to. A step is graded **only** where the game's ordinal advanced by
 * exactly one: one turn passed, the queue names whose it was, and no prediction is involved.
 */
export const TURN_OUTCOMES = ["exact", "over", "under", "elsewhere"] as const;
export type TurnOutcome = (typeof TURN_OUTCOMES)[number];

/** `in a lump` is a recording that never advanced its ordinal by one — nothing to grade. */
export const TURN_VERDICTS = ["always", "sometimes", "never", "in a lump"] as const;
export type TurnVerdict = (typeof TURN_VERDICTS)[number];

/** What the game stated about the turn in progress when a payload arrived. */
interface TurnStatement {
    ordinal: number;
    combatantId: number;
}

export interface TurnGrade {
    name: string;
    verdict: TurnVerdict;
    turns: number;
    exact: number;
    over: number;
    under: number;
    elsewhere: number;
    /**
     * The wider reading, over the stretch the game numbered — its first statement of an ordinal to
     * its last. Null where it never made two, which is a recording with no stretch rather than one
     * whose stretch came to nothing (**E10**).
     */
    stretch: TurnStretch | null;
}

/**
 * What the game granted over its numbered stretch, against what was counted inside it. They are
 * not the same figure and the difference is not an error: a turn granted to a combatant who is
 * stunned passes with nothing done, and `docs/turns-taken.md` states how that was measured.
 */
export interface TurnStretch {
    granted: number;
    taken: number;
    short: number;
    /** The turns the game announced as spent on nothing, inside the same stretch (**ADR 0049**). */
    lost: number;
}

/**
 * The turn in progress, as the payload's envelope states it: the queue's least ordinal, and whose
 * it is. Null where the payload carries no queue — five recordings carry none at all, and the
 * first payload of a fight is one of them everywhere else.
 */
function readTurnStatement(payload: unknown): TurnStatement | null {
    if (!isRecord(payload)) return null;
    const queue = payload[TURN_QUEUE_KEY];
    if (!isRecord(queue)) return null;
    const ordinals = Object.keys(queue);
    assert(ordinals.length <= MAXIMUM_QUEUE, "a queue stays inside its stated bound");
    let least: number | null = null;
    for (const stated of ordinals) {
        const ordinal = getIntegerFromText(stated);
        if (ordinal === null) return null;
        if (least === null) least = ordinal;
        else if (ordinal < least) least = ordinal;
    }
    if (least === null) return null;
    const combatantId = getNumberFromUnknown(queue[`${least}`]);
    if (combatantId === null) return null;
    return { ordinal: least, combatantId };
}

/** The same payload's own witness, which says who holds that ordinal in a second way. */
function readNamedCurrent(payload: unknown): number | null {
    if (!isRecord(payload)) return null;
    if (!(CURRENT_KEY in payload)) return null;
    return getNumberFromUnknown(payload[CURRENT_KEY]);
}

/** Every row's lost turns as the aggregate holds them, summed the way the stretch compares them. */
function getTurnsLost(statistics: FightStatistics): number {
    let lost = 0;
    for (const [, figures] of statistics.byCombatantId) {
        assert(figures.turnsLost >= 0, "a row lost no less than no turn at all");
        lost += figures.turnsLost;
    }
    return lost;
}

/** Every row's turns as the aggregate holds them, which is what a panel would draw. */
function composeTurnsByCombatantId(statistics: FightStatistics): Map<number, number> {
    const byCombatantId = new Map<number, number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        assert(figures.turnsTaken >= 0, "a row took no less than no turn at all");
        if (figures.turnsTaken > 0) byCombatantId.set(combatantId, figures.turnsTaken);
    }
    assert(byCombatantId.size <= MAXIMUM_COMBATANTS, "a fight stays inside its stated bound");
    return byCombatantId;
}

/** What one payload added, row by row — the turns taken while it was being delivered. */
function composeTurnDelta(
    standing: ReadonlyMap<number, number>,
    now: ReadonlyMap<number, number>,
): Map<number, number> {
    const delta = new Map<number, number>();
    for (const [combatantId, turns] of now) {
        const before = standing.get(combatantId) ?? 0;
        assert(turns >= before, "a count of turns never falls as a fight goes on");
        if (turns > before) delta.set(combatantId, turns - before);
    }
    assert(delta.size <= MAXIMUM_COMBATANTS, "a payload is acted in by the people in the fight");
    return delta;
}

/**
 * How one payload's turns stood against the one turn the game says passed. `elsewhere` is the
 * answer that matters most: turns were taken and none of them were the named combatant's, which
 * is the reading naming the wrong person rather than merely miscounting.
 */
export function getOutcome(delta: ReadonlyMap<number, number>, named: number): TurnOutcome {
    assert(Number.isSafeInteger(named), "the game names who holds a turn by number");
    let total = 0;
    for (const [, turns] of delta) total += turns;
    assert(total >= 0, "a payload carried no less than nothing");
    const mine = delta.get(named) ?? 0;
    if (total === 1) {
        if (mine === 1) return "exact";
        return "elsewhere";
    }
    if (total === 0) return "under";
    if (mine === 0) return "elsewhere";
    return "over";
}

/**
 * Every step the game numbered one turn apart, graded. A wider advance is not graded at all: it
 * covers turns this reading cannot line up one to one, and folding it in either direction would
 * be inventing evidence (`docs/turns-taken.md`).
 */
function composeOutcomes(steps: readonly FightReplayStep[]): TurnOutcome[] {
    assert(steps.length > 0, "a recording is graded over the payloads it carried");
    assert(steps.length <= MAXIMUM_PAYLOADS, "and over no more of them than it is bounded to");
    const outcomes: TurnOutcome[] = [];
    let standing = new Map<number, number>();
    let stated: TurnStatement | null = null;
    for (const step of steps) {
        const now = composeTurnsByCombatantId(step.replay.statistics);
        const arriving = readTurnStatement(step.payload);
        if (stated !== null) {
            if (arriving !== null) {
                if (arriving.ordinal - stated.ordinal === 1) {
                    outcomes.push(getOutcome(composeTurnDelta(standing, now), stated.combatantId));
                }
            }
        }
        standing = now;
        if (arriving !== null) stated = arriving;
    }
    assert(outcomes.length < steps.length + 1, "the first payload is graded against nothing");
    return outcomes;
}

/**
 * The stretch the game numbered, and what was counted inside it. Both ends are statements of the
 * game's: the turns counted are those delivered by the payloads **after** its first statement, so
 * neither end charges this reading with a turn nobody claimed to have numbered.
 */
function composeStretch(steps: readonly FightReplayStep[]): TurnStretch | null {
    assert(steps.length > 0, "a stretch is measured over the payloads a recording carried");
    let first: TurnStatement | null = null;
    let last: TurnStatement | null = null;
    let takenAtFirst = 0;
    let takenAtLast = 0;
    let lostAtFirst = 0;
    let lostAtLast = 0;
    for (const step of steps) {
        const stated = readTurnStatement(step.payload);
        if (stated === null) continue;
        let taken = 0;
        for (const [, turns] of composeTurnsByCombatantId(step.replay.statistics)) taken += turns;
        const lost = getTurnsLost(step.replay.statistics);
        if (first === null) {
            first = stated;
            takenAtFirst = taken;
            lostAtFirst = lost;
        }
        last = stated;
        takenAtLast = taken;
        lostAtLast = lost;
    }
    if (first === null) return null;
    if (last === null) return null;
    if (last.ordinal === first.ordinal) return null;
    const granted = last.ordinal - first.ordinal;
    const taken = takenAtLast - takenAtFirst;
    const lost = lostAtLast - lostAtFirst;
    assert(granted > 0, "a stretch the game numbered twice runs forwards");
    assert(taken >= 0, "and a count of turns never falls as a fight goes on");
    assert(lost >= 0, "and neither does a count of the turns nobody spent");
    return { granted, taken, short: granted - taken, lost };
}

/**
 * The verdict a recording earns. A recording the game never numbered two turns apart in a row is
 * `in a lump` — the fast fight `a01bf11` withdrew the whole feature over, where the game states
 * its numbering once and there is nothing for a count to stand against.
 */
export function getVerdict(outcomes: readonly TurnOutcome[]): TurnVerdict {
    let wrong = 0;
    for (const outcome of outcomes) {
        if (outcome !== "exact") wrong += 1;
    }
    assert(wrong <= outcomes.length, "a step graded wrong is a step that was graded");
    if (outcomes.length === 0) return "in a lump";
    if (wrong === 0) return "always";
    if (wrong === outcomes.length) return "never";
    return "sometimes";
}

/** The queue's own witness, asserted rather than reported: a disagreement is this reader broken. */
function requireQueueAgreesWithCurrent(steps: readonly FightReplayStep[]): number {
    let agreed = 0;
    for (const step of steps) {
        const stated = readTurnStatement(step.payload);
        const named = readNamedCurrent(step.payload);
        if (stated === null) continue;
        if (named === null) continue;
        assertStrictEquals(
            stated.combatantId,
            named,
            "the queue's least ordinal is held by the combatant the payload names",
        );
        agreed += 1;
    }
    return agreed;
}

function composeGradeOfFight(fight: RecordedFight, steps: readonly FightReplayStep[]): TurnGrade {
    const last = steps[steps.length - 1];
    assert(last !== undefined, "a recording that was stepped through has a last step");
    requireQueueAgreesWithCurrent(steps);
    const outcomes = composeOutcomes(steps);
    const tally = { exact: 0, over: 0, under: 0, elsewhere: 0 };
    for (const outcome of outcomes) tally[outcome] += 1;
    let turns = 0;
    for (const [, taken] of composeTurnsByCombatantId(last.replay.statistics)) turns += taken;
    const stretch = composeStretch(steps);
    return { name: fight.name, verdict: getVerdict(outcomes), turns, ...tally, stretch };
}

/** One recording, graded once — which is the comparison this register exists to make. */
export function composeTurnGrades(fights: readonly RecordedFight[]): TurnGrade[] {
    assert(fights.length > 0, "a register is measured over something");
    assert(fights.length <= MAXIMUM_RECORDINGS, "and over no more than it is bounded to");
    const grades: TurnGrade[] = [];
    for (const fight of fights) {
        assert(fight.name.length > 0, "a grade is given to a recording with a name");
        grades.push(composeGradeOfFight(fight, composeFightReplaySteps(fight)));
    }
    assertStrictEquals(grades.length, fights.length, "every recording is graded once");
    return grades;
}

const NAME_WIDTH = 68;
const VERDICT_WIDTH = 12;
const COUNT_WIDTH = 11;

/** A stretch nobody has, written so it cannot be read as a stretch that came to zero (**E10**). */
export const NO_STRETCH = "\u2014";

/**
 * The register the document carries: a recording, the verdict it earned, and how far the count
 * stands from the game's own numbering over the stretch it numbered. The verdict alone would hold
 * while a whole class of turns went missing between payloads, which is what the shortfall states.
 */
export function composeGradeRegister(grades: readonly TurnGrade[]): string[] {
    assert(grades.length > 0, "a register states the grades it was handed");
    const heading = `${"the game agrees".padEnd(VERDICT_WIDTH + 4)}${"granted".padStart(9)}` +
        `${"taken".padStart(9)}${"short".padStart(9)}${"lost".padStart(9)}`;
    const lines = [`  ${"recording".padEnd(NAME_WIDTH)}${heading}`];
    for (const grade of grades) {
        const stretch = grade.stretch;
        const cells = stretch === null
            ? [NO_STRETCH, NO_STRETCH, NO_STRETCH, NO_STRETCH]
            : [stretch.granted, stretch.taken, stretch.short, stretch.lost]
                .map(composeIntegerText);
        lines.push(
            `  ${grade.name.padEnd(NAME_WIDTH)}${grade.verdict.padEnd(VERDICT_WIDTH + 4)}${
                cells.map((one) => one.padStart(9)).join("")
            }`,
        );
    }
    return lines;
}

/** The same, with what stands behind each verdict — which is why the register carries none. */
export function composeCaseReport(grades: readonly TurnGrade[]): string[] {
    assert(grades.length > 0, "a report states the grades it was handed");
    const headings = ["turns", ...TURN_OUTCOMES];
    const lines = [
        `  ${"recording".padEnd(NAME_WIDTH)}${"the game agrees".padEnd(VERDICT_WIDTH + 4)}${
            headings.map((one) => one.padStart(COUNT_WIDTH)).join("")
        }`,
    ];
    for (const grade of grades) {
        const counts = [grade.turns, grade.exact, grade.over, grade.under, grade.elsewhere];
        lines.push(
            `  ${grade.name.padEnd(NAME_WIDTH)}${grade.verdict.padEnd(VERDICT_WIDTH + 4)}${
                counts.map((one) => composeIntegerText(one).padStart(COUNT_WIDTH)).join("")
            }`,
        );
    }
    return lines;
}

/** One recording walked payload by payload, which is where a verdict can be argued with. */
export function composeTurnReport(fight: RecordedFight): string[] {
    assert(fight.name.length > 0, "a walk is headed by the recording it was taken on");
    const steps = composeFightReplaySteps(fight);
    assert(steps.length <= MAXIMUM_PAYLOADS, "a walk stays inside the recording's stated bound");
    const lines = ["", `=== ${fight.name} ===`];
    let standing = new Map<number, number>();
    let stated: TurnStatement | null = null;
    let at = 0;
    for (const step of steps) {
        at += 1;
        const now = composeTurnsByCombatantId(step.replay.statistics);
        const delta = composeTurnDelta(standing, now);
        let taken = 0;
        for (const [, turns] of delta) taken += turns;
        const arriving = readTurnStatement(step.payload);
        const graded = stated === null || arriving === null
            ? "—"
            : arriving.ordinal - stated.ordinal === 1
            ? getOutcome(delta, stated.combatantId)
            : "—";
        const ordinal = arriving === null ? "—" : composeIntegerText(arriving.ordinal);
        const whom = stated === null ? "—" : composeIntegerText(stated.combatantId);
        lines.push(
            `  payload ${composeIntegerText(at).padStart(4)}  ordinal ${ordinal.padStart(6)}` +
                `  held by ${whom.padStart(12)}  turns ${composeIntegerText(taken).padStart(3)}` +
                `  ${graded}`,
        );
        standing = now;
        if (arriving !== null) stated = arriving;
    }
    assert(at > 0, "a recording that was walked carried a payload");
    return lines;
}

interface TurnArguments {
    isCases: boolean;
    paths: string[];
}

function getArguments(stated: readonly string[]): TurnArguments {
    assert(stated.length <= MAXIMUM_ARGUMENTS, "a run is given no more arguments than are read");
    const parsed = parseArgs([...stated], { boolean: ["cases"] });
    const paths = parsed._.filter((one): one is string => typeof one === "string");
    if (paths.length !== parsed._.length) {
        throw new TurnCountError("a recording is named by a path and never by a number");
    }
    assertEquals(paths.length, parsed._.length, "every argument that is not a flag is a path");
    return { isCases: parsed.cases, paths };
}

if (import.meta.main) {
    const asked = getArguments(Deno.args);
    const recorded = composeRecordedMaterial(asked.paths);
    console.log(`material ${recorded.material}`);
    if (asked.isCases) {
        for (const line of composeCaseReport(composeTurnGrades(recorded.fights))) {
            console.log(line);
        }
    } else if (asked.paths.length > 0) {
        for (const fight of recorded.fights) {
            for (const line of composeTurnReport(fight)) console.log(line);
        }
    } else {
        for (const line of composeGradeRegister(composeTurnGrades(recorded.fights))) {
            console.log(line);
        }
    }
}
