/**
 * How many turns a fight's combatants took, and how that count stands against the game's own
 * numbering of them: `develop:tools/turn-count.ts` at `DEVELOP_REVISION`, printing its text.
 *
 *     deno task fight:turns                        the register, over the recordings
 *     deno task fight:turns --cases                the counts behind each verdict
 *     deno task fight:turns captures/<file>.json   one recording, boundary by boundary
 *
 * The count is the tally's (`src/core/fight-statistics.ts`) and every step the runtime's chain
 * (`tools/recorded-material.ts`); what is here is the reference it is graded against.
 * `docs/turns-taken.md` carries the verdicts and what they do not claim.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { formatInteger } from "#/libs/number-text.ts";
import { getListField, getNumberField, isRecord } from "#/libs/unknown-value.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { MESSAGES_MAXIMUM } from "#/src/core/fight-decoder.ts";
import type { TurnStatement } from "#/src/core/fight-session.ts";
import type { FightStatistics } from "#/src/core/fight-statistics.ts";
import { CALLS_MAXIMUM } from "#/src/game/fight-capture.ts";
import { ENVELOPE_KEYS } from "#/src/game/payload-envelope.ts";
import type { RecordedFight } from "#/tests/recorded-fights.ts";
import { TurnCountError } from "./margometer-tool-error.ts";
import {
    formatRecordingName,
    readRecordedMaterial,
    type ReplayedStep,
    replayRecordedSteps,
} from "./recorded-material.ts";

/**
 * What one boundary's **count** came to, against the turns the game numbered across it, however
 * far the ordinal moved: a count of turns can be held against that without knowing whose they were.
 */
export const TURN_OUTCOME = { exact: "exact", over: "over", under: "under" } as const;
export type TurnOutcome = VocabularyWord<typeof TURN_OUTCOME>;

/**
 * And what its **placing** came to, which needs a boundary of exactly one turn: wider than that,
 * who held the ordinals between is the queue's forecast, which `docs/turns-taken.md` refuses.
 */
export const TURN_PLACING = { exact: "exact", elsewhere: "elsewhere" } as const;
export type TurnPlacing = VocabularyWord<typeof TURN_PLACING>;

/** `in a lump` is a recording the game never numbered twice: nothing to grade at all. */
export const TURN_VERDICT = {
    always: "always",
    sometimes: "sometimes",
    never: "never",
    inLump: "in a lump",
} as const;
export type TurnVerdict = VocabularyWord<typeof TURN_VERDICT>;

/**
 * One stretch between two statements of the game's, graded. `counted` is the turns taken and the
 * turns announced as spent on nothing, because the game numbers both (`develop ADR 0049`).
 */
export interface TurnBoundary {
    from: number;
    to: number;
    advance: number;
    counted: number;
    outcome: TurnOutcome;
    /** Null where the advance was wider than one turn, so nothing here can say whose it was. */
    placing: TurnPlacing | null;
    /** False where the game's message numbering broke across it, and it is graded by nothing. */
    isNarrated: boolean;
}

export interface TurnGrade {
    name: string;
    verdict: TurnVerdict;
    turns: number;
    /** The boundaries graded, which the three counts below divide. */
    bounded: number;
    exact: number;
    over: number;
    under: number;
    /** And the ones refused a grade: the game numbered messages across them it never sent here. */
    untold: number;
    placed: number;
    elsewhere: number;
    /** Null where the game never numbered twice: no stretch, which is not one of none (E6). */
    stretch: TurnStretch | null;
}

/**
 * What the game granted between its first ordinal and its last, against what was counted inside.
 * The difference is no error: a stunned combatant is granted a turn and spends it on nothing.
 */
export interface TurnStretch {
    granted: number;
    taken: number;
    short: number;
    lost: number;
}

/** What was counted since the last statement of the game's, and whether all of it was told. */
interface TurnDelta {
    taken: ReadonlyMap<number, number>;
    lost: ReadonlyMap<number, number>;
    isNarrated: boolean;
}

interface TurnArguments {
    isCases: boolean;
    paths: string[];
}

export const TURN_OUTCOMES: readonly TurnOutcome[] = Object.values(TURN_OUTCOME);
export const TURN_PLACINGS: readonly TurnPlacing[] = Object.values(TURN_PLACING);
export const TURN_VERDICTS: readonly TurnVerdict[] = Object.values(TURN_VERDICT);

/**
 * The payload's own witness of whose turn is in progress. The runtime reads the queue and never
 * this, so it is spelled here, the one reader of it (N13).
 */
const WITNESS_KEYS = { holder: "current" } as const;
const ARGUMENTS_MAXIMUM = 256;
const RECORDINGS_MAXIMUM = 4096;
const NAME_WIDTH = 68;
const VERDICT_WIDTH = 16;
const COLUMN_WIDTH = 9;
const COUNT_WIDTH = 11;
/** A stretch nobody has, written so it cannot be read as a stretch that came to zero (E6). */
export const NO_STRETCH = "—";

/** Each recording graded once, which is the comparison the register exists to make. */
export function composeTurnGrades(fights: readonly RecordedFight[]): TurnGrade[] {
    assert(fights.length > 0, "a register is measured over something");
    assert(fights.length <= RECORDINGS_MAXIMUM, "and over no more than it is bounded to");
    const grades: TurnGrade[] = [];
    for (const fight of fights) {
        grades.push(composeTurnGrade(fight, replayRecordedSteps(fight)));
    }
    assertStrictEquals(grades.length, fights.length, "every recording is graded once");
    return grades;
}

function composeTurnGrade(fight: RecordedFight, steps: readonly ReplayedStep[]): TurnGrade {
    const last = steps.at(-1);
    assert(last !== undefined, "a recording that was stepped through has a last step");
    verifyQueueHolders(steps);
    const boundaries = composeTurnBoundaries(steps);
    const tally = { exact: 0, over: 0, under: 0 };
    const outcomes: TurnOutcome[] = [];
    let untold = 0;
    let placed = 0;
    let elsewhere = 0;
    for (const boundary of boundaries) {
        if (!boundary.isNarrated) {
            untold += 1;
            continue;
        }
        tally[boundary.outcome] += 1;
        outcomes.push(boundary.outcome);
        if (boundary.placing === null) continue;
        placed += 1;
        if (boundary.placing === TURN_PLACING.elsewhere) elsewhere += 1;
    }
    assert(placed <= boundaries.length, "a boundary placed is a boundary graded");
    assert(untold <= boundaries.length, "a boundary nobody was told about is a boundary");
    return {
        name: formatRecordingName(fight.path),
        verdict: getTurnVerdict(outcomes),
        turns: tallyTurnDelta(indexTurnsTakenByCombatantId(last.reading.figures.statistics)),
        bounded: outcomes.length,
        ...tally,
        untold,
        placed,
        elsewhere,
        stretch: composeTurnStretch(steps),
    };
}

/** The queue's least ordinal against the payload's own witness: a disagreement is this reader. */
function verifyQueueHolders(steps: readonly ReplayedStep[]): void {
    for (const step of steps) {
        const stated = step.record.turnStatement;
        if (stated === null) continue;
        const named = readCurrentHolder(step.update);
        if (named === null) continue;
        assertStrictEquals(
            stated.combatantId,
            named,
            "the queue's least ordinal is held by the combatant the payload names",
        );
    }
}

function readCurrentHolder(update: unknown): number | null {
    if (!isRecord(update)) return null;
    const holder = getNumberField(update, WITNESS_KEYS, "holder");
    if (!holder.ok) return null;
    return holder.value;
}

/**
 * The stretch the game numbered. Both ends are its statements, and the turns counted are those the
 * payloads **after** the first one delivered, so neither end charges a turn nobody numbered.
 */
function composeTurnStretch(steps: readonly ReplayedStep[]): TurnStretch | null {
    assert(steps.length > 0, "a stretch is measured over the payloads a recording carried");
    let first: TurnStatement | null = null;
    let last: TurnStatement | null = null;
    const atFirst = { taken: 0, lost: 0 };
    const atLast = { taken: 0, lost: 0 };
    for (const step of steps) {
        const stated = step.record.turnStatement;
        if (stated === null) continue;
        const statistics = step.reading.figures.statistics;
        const taken = tallyTurnDelta(indexTurnsTakenByCombatantId(statistics));
        const lost = tallyTurnsLost(statistics);
        if (first === null) {
            first = stated;
            atFirst.taken = taken;
            atFirst.lost = lost;
        }
        last = stated;
        atLast.taken = taken;
        atLast.lost = lost;
    }
    if (first === null) return null;
    if (last === null) return null;
    if (last.ordinal === first.ordinal) return null;
    const granted = last.ordinal - first.ordinal;
    const taken = atLast.taken - atFirst.taken;
    const lost = atLast.lost - atFirst.lost;
    assert(granted > 0, "a stretch the game numbered twice runs forwards");
    assert(taken >= 0, "and a count of turns never falls as a fight goes on");
    assert(lost >= 0, "and neither does a count of the turns nobody spent");
    return { granted, taken, short: granted - taken, lost };
}

function tallyTurnsLost(statistics: FightStatistics): number {
    let lost = 0;
    for (const figures of statistics.byCombatantId.values()) {
        assert(figures.turnsLost >= 0, "a row lost no less than no turn at all");
        lost += figures.turnsLost;
    }
    return lost;
}

/** Every row's turns as the tally holds them, which is what a panel draws. */
function indexTurnsTakenByCombatantId(statistics: FightStatistics): Map<number, number> {
    const byCombatantId = new Map<number, number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        assert(figures.turnsTaken >= 0, "a row took no less than no turn at all");
        if (figures.turnsTaken > 0) byCombatantId.set(combatantId, figures.turnsTaken);
    }
    assert(byCombatantId.size <= COMBATANTS_MAXIMUM, "a fight stays inside its stated bound");
    return byCombatantId;
}

function tallyTurnDelta(delta: ReadonlyMap<number, number>): number {
    assert(delta.size <= COMBATANTS_MAXIMUM, "a delta is acted in by the people in the fight");
    let total = 0;
    for (const turns of delta.values()) total += turns;
    assert(total >= 0, "a payload carried no less than nothing");
    return total;
}

/**
 * Every stretch between two statements of the game's, graded. The count is held against the
 * advance however wide it is; what a wide one cannot state is whose the turns were, and that is
 * left unanswered rather than filled from the queue's forecast.
 */
export function composeTurnBoundaries(steps: readonly ReplayedStep[]): TurnBoundary[] {
    assert(steps.length > 0, "a recording is graded over the payloads it carried");
    assert(steps.length <= CALLS_MAXIMUM, "and over no more of them than it is bounded to");
    const boundaries: TurnBoundary[] = [];
    let taken = new Map<number, number>();
    let lost = new Map<number, number>();
    let stated: TurnStatement | null = null;
    let expected: number | null = null;
    let isNarrated = true;
    for (const step of steps) {
        if (isNarrated) isNarrated = isPayloadNarrated(step.update, expected);
        expected = getMessageIndexAfter(step.update, expected);
        const statistics = step.reading.figures.statistics;
        const takenNow = indexTurnsTakenByCombatantId(statistics);
        const lostNow = indexTurnsLostByCombatantId(statistics);
        const arriving = step.record.turnStatement;
        if (stated !== null) {
            if (arriving !== null) {
                const delta: TurnDelta = {
                    taken: composeTurnDelta(taken, takenNow),
                    lost: composeTurnDelta(lost, lostNow),
                    isNarrated,
                };
                const graded = composeTurnBoundary(stated, arriving, delta);
                if (graded !== null) boundaries.push(graded);
            }
        }
        taken = takenNow;
        lost = lostNow;
        if (arriving === null) continue;
        stated = arriving;
        isNarrated = true;
    }
    assert(boundaries.length < steps.length, "the first payload is graded against nothing");
    return boundaries;
}

/**
 * True where this payload's messages pick up where the last payload's left off. A payload stating
 * none, and a fight whose numbering has not been seen, have nothing to break: only a break is false.
 */
function isPayloadNarrated(update: unknown, expected: number | null): boolean {
    if (expected === null) return true;
    assert(expected >= 0, "a numbering already seen runs from the fight's own start");
    const indices = readMessageIndices(update);
    if (indices === null) return true;
    const first = indices[0];
    if (first === undefined) return true;
    assert(Number.isSafeInteger(first), "a message is numbered by a whole number");
    return first === expected;
}

/**
 * Where the payload's messages sit in the game's own running numbering of them, which the envelope
 * reads only for its length. Over `captures/` on 2026-09-03 it runs unbroken through every
 * recording but one, and that one skips 26 messages this client was never sent.
 */
function readMessageIndices(update: unknown): number[] | null {
    if (!isRecord(update)) return null;
    const stated = getListField(update, ENVELOPE_KEYS, "messagesStated", MESSAGES_MAXIMUM);
    if (!stated.ok) return null;
    if (stated.value === null) return null;
    const indices: number[] = [];
    for (const one of stated.value) {
        if (typeof one !== "number") return null;
        if (!Number.isFinite(one)) return null;
        indices.push(one);
    }
    assertStrictEquals(indices.length, stated.value.length, "every index stated is an index read");
    return indices;
}

/** Where the game's own numbering of the messages stands once this payload's are in. */
function getMessageIndexAfter(update: unknown, expected: number | null): number | null {
    const indices = readMessageIndices(update);
    if (indices === null) return expected;
    const last = indices.at(-1);
    if (last === undefined) return expected;
    assert(Number.isSafeInteger(last), "a message is numbered by a whole number");
    assert(last >= 0, "and numbered from the fight's own start");
    return last + 1;
}

/** The same lost turns row by row, so a boundary can be graded the way the taken ones are. */
function indexTurnsLostByCombatantId(statistics: FightStatistics): Map<number, number> {
    const byCombatantId = new Map<number, number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        assert(figures.turnsLost >= 0, "a row lost no less than no turn at all");
        if (figures.turnsLost > 0) byCombatantId.set(combatantId, figures.turnsLost);
    }
    assert(byCombatantId.size <= COMBATANTS_MAXIMUM, "a fight stays inside its stated bound");
    return byCombatantId;
}

/** What one payload added, row by row: the turns taken while it was being delivered. */
function composeTurnDelta(
    before: ReadonlyMap<number, number>,
    after: ReadonlyMap<number, number>,
): Map<number, number> {
    const delta = new Map<number, number>();
    for (const [combatantId, turns] of after) {
        const held = before.get(combatantId) ?? 0;
        assert(turns >= held, "a count of turns never falls as a fight goes on");
        if (turns > held) delta.set(combatantId, turns - held);
    }
    assert(delta.size <= COMBATANTS_MAXIMUM, "a payload is acted in by the people in the fight");
    return delta;
}

function composeTurnBoundary(
    stated: TurnStatement,
    arriving: TurnStatement,
    delta: TurnDelta,
): TurnBoundary | null {
    const advance = arriving.ordinal - stated.ordinal;
    if (advance < 1) return null;
    assert(Number.isSafeInteger(stated.combatantId), "the game names a holder by number");
    const counted = tallyTurnDelta(delta.taken) + tallyTurnDelta(delta.lost);
    const mine = (delta.taken.get(stated.combatantId) ?? 0) +
        (delta.lost.get(stated.combatantId) ?? 0);
    assert(mine <= counted, "what one combatant did is part of what everybody did");
    return {
        from: stated.ordinal,
        to: arriving.ordinal,
        advance,
        counted,
        outcome: getTurnOutcome(counted, advance),
        placing: getTurnPlacing(counted, mine, advance),
        isNarrated: delta.isNarrated,
    };
}

/** How many turns were counted against how many the game numbered, and nothing about whose. */
export function getTurnOutcome(counted: number, advance: number): TurnOutcome {
    assert(counted >= 0, "a stretch carried no less than nothing");
    assert(advance > 0, "and the game numbered it forwards");
    if (counted === advance) return TURN_OUTCOME.exact;
    if (counted > advance) return TURN_OUTCOME.over;
    return TURN_OUTCOME.under;
}

/**
 * Whose turn the one that passed was charged to, or null where nothing can say: the game must have
 * numbered one turn, or the queue names the holder of only the first of several, and one must have
 * been counted. `elsewhere` names the wrong person, a worse failure than miscounting.
 */
export function getTurnPlacing(counted: number, mine: number, advance: number): TurnPlacing | null {
    assert(counted >= 0, "a stretch carried no less than nothing");
    assert(mine >= 0, "and the named combatant no less of it");
    assert(advance > 0, "and the game numbered it forwards");
    if (advance !== 1) return null;
    if (counted !== 1) return null;
    if (mine === 1) return TURN_PLACING.exact;
    return TURN_PLACING.elsewhere;
}

/** A recording the game numbered once is `in a lump`: nothing for a count to stand against. */
export function getTurnVerdict(outcomes: readonly TurnOutcome[]): TurnVerdict {
    let wrong = 0;
    for (const outcome of outcomes) {
        if (outcome !== TURN_OUTCOME.exact) wrong += 1;
    }
    assert(wrong <= outcomes.length, "a step graded wrong is a step that was graded");
    if (outcomes.length === 0) return TURN_VERDICT.inLump;
    if (wrong === 0) return TURN_VERDICT.always;
    if (wrong === outcomes.length) return TURN_VERDICT.never;
    return TURN_VERDICT.sometimes;
}

/** The register with what stands behind each verdict, which is why the register carries none. */
export function formatCaseReport(grades: readonly TurnGrade[]): string[] {
    assert(grades.length > 0, "a report states the grades it was handed");
    const headings = ["turns", "bounded", ...TURN_OUTCOMES, "untold", "placed", "elsewhere"];
    const lines = [
        `  ${"recording".padEnd(NAME_WIDTH)}${"the game agrees".padEnd(VERDICT_WIDTH)}${
            headings.map((one) => one.padStart(COUNT_WIDTH)).join("")
        }`,
    ];
    for (const grade of grades) {
        const counts = [
            grade.turns,
            grade.bounded,
            grade.exact,
            grade.over,
            grade.under,
            grade.untold,
            grade.placed,
            grade.elsewhere,
        ];
        lines.push(
            `  ${grade.name.padEnd(NAME_WIDTH)}${grade.verdict.padEnd(VERDICT_WIDTH)}${
                counts.map((one) => formatInteger(one).padStart(COUNT_WIDTH)).join("")
            }`,
        );
    }
    return lines;
}

/**
 * The register the document carries: a verdict beside how much of the numbering it was earned
 * over, and the whole stretch beside it. A verdict without its coverage would hold while most of
 * the numbering went ungraded.
 */
export function formatGradeRegister(grades: readonly TurnGrade[]): string[] {
    assert(grades.length > 0, "a register states the grades it was handed");
    const headings = ["steps", "agreed", "granted", "taken", "short", "lost"];
    const lines = [
        `  ${"recording".padEnd(NAME_WIDTH)}${"the game agrees".padEnd(VERDICT_WIDTH)}` +
        headings.map((one) => one.padStart(COLUMN_WIDTH)).join(""),
    ];
    for (const grade of grades) {
        const cells = [...formatGradeRegisterBounded(grade), ...formatGradeRegisterStretch(grade)];
        lines.push(
            `  ${grade.name.padEnd(NAME_WIDTH)}${grade.verdict.padEnd(VERDICT_WIDTH)}` +
                cells.map((one) => one.padStart(COLUMN_WIDTH)).join(""),
        );
    }
    return lines;
}

function formatGradeRegisterBounded(grade: TurnGrade): string[] {
    assert(grade.exact <= grade.bounded, "a boundary agreed with is a boundary graded");
    if (grade.bounded === 0) return [NO_STRETCH, NO_STRETCH];
    return [grade.bounded, grade.exact].map(formatInteger);
}

function formatGradeRegisterStretch(grade: TurnGrade): string[] {
    const stretch = grade.stretch;
    if (stretch === null) return [NO_STRETCH, NO_STRETCH, NO_STRETCH, NO_STRETCH];
    assert(stretch.granted > 0, "a stretch the game numbered twice runs forwards");
    return [stretch.granted, stretch.taken, stretch.short, stretch.lost].map(formatInteger);
}

/**
 * One recording walked boundary by boundary, which is where a verdict can be argued with. A
 * payload stating no ordinal opens no boundary and gets no line.
 */
export function formatTurnWalk(fight: RecordedFight): string[] {
    const boundaries = composeTurnBoundaries(replayRecordedSteps(fight));
    const lines = ["", `=== ${formatRecordingName(fight.path)} ===`];
    for (const boundary of boundaries) lines.push(formatTurnWalkLine(boundary));
    if (boundaries.length === 0) lines.push("  the game numbered this fight once, or not at all");
    assert(lines.length > 2, "a walk says something about the recording it was taken on");
    return lines;
}

function formatTurnWalkLine(boundary: TurnBoundary): string {
    assert(boundary.advance > 0, "a boundary the game numbered runs forwards");
    const placing = boundary.placing === null ? "" : ` ${boundary.placing}`;
    const graded = boundary.isNarrated
        ? `${boundary.outcome}${placing}`
        : "not narrated, and graded by nothing";
    return `  ordinal ${formatInteger(boundary.from).padStart(6)} ->` +
        `${formatInteger(boundary.to).padStart(6)}` +
        `  counted ${formatInteger(boundary.counted).padStart(3)}` +
        ` of ${formatInteger(boundary.advance).padStart(3)}  ${graded}`;
}

export function parseTurnArguments(stated: readonly string[]): TurnArguments {
    assert(stated.length <= ARGUMENTS_MAXIMUM, "a run is given no more arguments than are read");
    const parsed = parseArgs([...stated], { boolean: ["cases"] });
    const paths: string[] = [];
    for (const one of parsed._) {
        if (typeof one !== "string") {
            throw new TurnCountError("a recording is named by a path and never by a number");
        }
        paths.push(one);
    }
    assertStrictEquals(
        paths.length,
        parsed._.length,
        "every argument that is not a flag is a path",
    );
    return { isCases: parsed.cases, paths };
}

if (import.meta.main) {
    const asked = parseTurnArguments(Deno.args);
    const recorded = readRecordedMaterial(asked.paths);
    const lines = [`material ${recorded.material}`];
    if (asked.isCases) lines.push(...formatCaseReport(composeTurnGrades(recorded.fights)));
    else if (asked.paths.length > 0) lines.push(...recorded.fights.flatMap(formatTurnWalk));
    else lines.push(...formatGradeRegister(composeTurnGrades(recorded.fights)));
    console.log(lines.join("\n"));
}
