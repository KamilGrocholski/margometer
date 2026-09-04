/**
 * How many turns a fight's combatants took, and how that count stands against the game's own
 * numbering of them.
 *
 *     deno task fight:turns                        the register, over the corpus
 *     deno task fight:turns --cases                the counts behind each verdict
 *     deno task fight:turns captures/<file>.json   one recording, boundary by boundary
 *
 * The count itself is the aggregate's (`src/core/fight-statistics.ts`); what is here is the
 * reference it is graded against and nothing else. `docs/turns-taken.md` carries the verdicts and
 * what they do not claim. The figures come off the replay, so this and the panel cannot disagree
 * about a fight (`tools/fight-replay.ts`).
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import { MESSAGE_INDEX_KEY } from "@/src/game/battle-session.ts";
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
export const TURN_QUEUE_KEY = "turns_warriors";
/**
 * Whom the game says holds the turn the queue's least ordinal numbers. Read only as a witness:
 * over `captures/` on 2026-09-02 it is the queue's own entry at that ordinal in every payload
 * carrying both, so a disagreement is this reader breaking rather than the game moving.
 */
export const CURRENT_KEY = "current";

/** A run names a handful of recordings; this is far past that. */
const MAXIMUM_ARGUMENTS = 256;
/** Past every recording the corpus holds, and past what one sitting would name by hand. */
const MAXIMUM_RECORDINGS = 4096;
/** The longest recording in `captures/` carries 111 payloads, 2026-09-01. */
const MAXIMUM_PAYLOADS = 100000;
/** The queue is ten entries wide in all 1022 payloads carrying it, 2026-09-02. */
const MAXIMUM_QUEUE = 1024;
/** Past the 715 message indices the longest recording states, 2026-09-03. */
const MAXIMUM_MESSAGES = 65536;

/**
 * What one boundary's **count** came to, against the turns the game numbered across it. Every
 * boundary is graded this way, however far the ordinal moved: what a boundary states is how many
 * turns passed, and a count of turns can be held against that without knowing whose they were.
 */
export const TURN_OUTCOMES = ["exact", "over", "under"] as const;
export type TurnOutcome = (typeof TURN_OUTCOMES)[number];

/**
 * And what its **placing** came to — the sharper question, and the one that needs a boundary of
 * exactly one turn. Wider than that, the only source for who held the ordinals in between is the
 * queue's forecast, which `docs/turns-taken.md` measures and this reader refuses to lean on.
 */
export const TURN_PLACINGS = ["exact", "elsewhere"] as const;
export type TurnPlacing = (typeof TURN_PLACINGS)[number];

/** `in a lump` is a recording the game never numbered twice — nothing to grade at all. */
export const TURN_VERDICTS = ["always", "sometimes", "never", "in a lump"] as const;
export type TurnVerdict = (typeof TURN_VERDICTS)[number];

/** What the game stated about the turn in progress when a payload arrived. */
export interface TurnStatement {
    ordinal: number;
    combatantId: number;
}

/**
 * One stretch between two statements of the game's, graded. `counted` is both halves of what was
 * seen — the turns taken and the turns announced as spent on nothing — because the game numbers a
 * turn nobody spent the same as any other (**ADR 0049**).
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
    /** How many boundaries were graded, which is what the tally below is a tally of. */
    bounded: number;
    exact: number;
    over: number;
    under: number;
    /**
     * And how many were refused one: the game numbered messages across them that it never sent
     * here, so the turns inside were narrated to nobody and a count would be graded against
     * silence. One boundary of the corpus, 2026-09-03.
     */
    untold: number;
    /** And how many of those were narrow enough to say whose turn it was. */
    placed: number;
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
export function readTurnStatement(payload: unknown): TurnStatement | null {
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

/**
 * Where the payload's messages sit in the game's own running numbering of them. Read for the
 * break: over `captures/` on 2026-09-03 the index runs unbroken through every recording but one,
 * and that one skips 26 — messages the game numbered and this client was never sent. A stretch
 * with a break in it cannot be counted against, because the turns inside it were never narrated.
 */
function readMessageIndices(payload: unknown): number[] | null {
    if (!isRecord(payload)) return null;
    const stated = payload[MESSAGE_INDEX_KEY];
    if (!Array.isArray(stated)) return null;
    assert(stated.length <= MAXIMUM_MESSAGES, "a payload states no more messages than it may");
    const indices: number[] = [];
    for (const one of stated) {
        const index = getNumberFromUnknown(one);
        if (index === null) return null;
        indices.push(index);
    }
    assertStrictEquals(indices.length, stated.length, "every index stated is an index read");
    return indices;
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

/** The same lost turns row by row, so a boundary can be graded the way the taken ones are. */
function composeLostByCombatantId(statistics: FightStatistics): Map<number, number> {
    const byCombatantId = new Map<number, number>();
    for (const [combatantId, figures] of statistics.byCombatantId) {
        assert(figures.turnsLost >= 0, "a row lost no less than no turn at all");
        if (figures.turnsLost > 0) byCombatantId.set(combatantId, figures.turnsLost);
    }
    assert(byCombatantId.size <= MAXIMUM_COMBATANTS, "a fight stays inside its stated bound");
    return byCombatantId;
}

/** What a delta comes to over everybody in it. */
function getDeltaTotal(delta: ReadonlyMap<number, number>): number {
    assert(delta.size <= MAXIMUM_COMBATANTS, "a delta is acted in by the people in the fight");
    let total = 0;
    for (const [, turns] of delta) total += turns;
    assert(total >= 0, "a payload carried no less than nothing");
    return total;
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

/** How many turns were counted against how many the game numbered, and nothing about whose. */
export function getOutcome(counted: number, advance: number): TurnOutcome {
    assert(counted >= 0, "a stretch carried no less than nothing");
    assert(advance > 0, "and the game numbered it forwards");
    if (counted === advance) return "exact";
    if (counted > advance) return "over";
    return "under";
}

/**
 * Whose turn the one that passed was charged to, or null where nothing can say. Both conditions
 * are needed and neither implies the other: the game must have numbered exactly one turn across
 * the boundary, or the queue names the holder of only the first of several; and exactly one must
 * have been counted, or there is no single turn to charge. `elsewhere` is then the reading naming
 * the wrong person, which is a worse failure than miscounting and why the two are tallied apart.
 */
export function getPlacing(counted: number, mine: number, advance: number): TurnPlacing | null {
    assert(counted >= 0, "a stretch carried no less than nothing");
    assert(mine >= 0, "and the named combatant no less of it");
    assert(advance > 0, "and the game numbered it forwards");
    if (advance !== 1) return null;
    if (counted !== 1) return null;
    if (mine === 1) return "exact";
    return "elsewhere";
}

/** What the game numbered across one boundary, against what was counted inside it. */
function composeBoundary(
    stated: TurnStatement,
    arriving: TurnStatement,
    delta: TurnDelta,
): TurnBoundary | null {
    const advance = arriving.ordinal - stated.ordinal;
    if (advance < 1) return null;
    assert(Number.isSafeInteger(stated.combatantId), "the game names a holder by number");
    const counted = getDeltaTotal(delta.taken) + getDeltaTotal(delta.lost);
    const mine = (delta.taken.get(stated.combatantId) ?? 0) +
        (delta.lost.get(stated.combatantId) ?? 0);
    assert(mine <= counted, "what one combatant did is part of what everybody did");
    const placing = getPlacing(counted, mine, advance);
    return {
        from: stated.ordinal,
        to: arriving.ordinal,
        advance,
        counted,
        outcome: getOutcome(counted, advance),
        placing,
        isNarrated: delta.isNarrated,
    };
}

/** What was counted since the last statement of the game's, and whether all of it was told. */
interface TurnDelta {
    taken: ReadonlyMap<number, number>;
    lost: ReadonlyMap<number, number>;
    isNarrated: boolean;
}

/** Where the game's own numbering of the messages stands once this payload's are in. */
function getNextIndex(payload: unknown, expected: number | null): number | null {
    const indices = readMessageIndices(payload);
    if (indices === null) return expected;
    const last = indices[indices.length - 1];
    if (last === undefined) return expected;
    assert(Number.isSafeInteger(last), "a message is numbered by a whole number");
    assert(last >= 0, "and numbered from the fight's own start");
    return last + 1;
}

/**
 * True where this payload's messages pick up where the last payload's left off. A payload
 * carrying none says nothing either way, and a fight whose numbering has not been seen yet has
 * nothing to continue — both answer true, so a break is the only thing that answers false.
 */
function getIsNarrated(payload: unknown, expected: number | null): boolean {
    if (expected === null) return true;
    assert(expected >= 0, "a numbering already seen runs from the fight's own start");
    const indices = readMessageIndices(payload);
    if (indices === null) return true;
    const first = indices[0];
    if (first === undefined) return true;
    assert(Number.isSafeInteger(first), "a message is numbered by a whole number");
    return first === expected;
}

/**
 * Every stretch between two statements of the game's, graded. The count is held against the
 * advance however wide it is — a boundary states how many turns passed, and both halves of what
 * was seen are countable against that. What a wide one cannot state is whose they were, and
 * `composeBoundary` leaves that unanswered rather than filling it from the queue's forecast.
 */
export function composeBoundaries(steps: readonly FightReplayStep[]): TurnBoundary[] {
    assert(steps.length > 0, "a recording is graded over the payloads it carried");
    assert(steps.length <= MAXIMUM_PAYLOADS, "and over no more of them than it is bounded to");
    const boundaries: TurnBoundary[] = [];
    let taken = new Map<number, number>();
    let lost = new Map<number, number>();
    let stated: TurnStatement | null = null;
    let expected: number | null = null;
    let isNarrated = true;
    for (const step of steps) {
        if (isNarrated) isNarrated = getIsNarrated(step.payload, expected);
        expected = getNextIndex(step.payload, expected);
        const now = composeTurnsByCombatantId(step.replay.statistics);
        const nowLost = composeLostByCombatantId(step.replay.statistics);
        const arriving = readTurnStatement(step.payload);
        if (stated !== null) {
            if (arriving !== null) {
                const delta: TurnDelta = {
                    taken: composeTurnDelta(taken, now),
                    lost: composeTurnDelta(lost, nowLost),
                    isNarrated,
                };
                const graded = composeBoundary(stated, arriving, delta);
                if (graded !== null) boundaries.push(graded);
            }
        }
        taken = now;
        lost = nowLost;
        if (arriving === null) continue;
        stated = arriving;
        isNarrated = true;
    }
    assert(boundaries.length < steps.length + 1, "the first payload is graded against nothing");
    return boundaries;
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
 * The verdict a recording earns, over its counts. A recording the game numbered once is
 * `in a lump` — the fast fight `a01bf11` withdrew the whole feature over, where there is nothing
 * for a count to stand against at all.
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
    const boundaries = composeBoundaries(steps);
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
        if (boundary.placing === "elsewhere") elsewhere += 1;
    }
    assert(placed <= boundaries.length, "a boundary placed is a boundary graded");
    assert(untold <= boundaries.length, "a boundary nobody was told about is a boundary");
    const turns = getDeltaTotal(composeTurnsByCombatantId(last.replay.statistics));
    const stretch = composeStretch(steps);
    return {
        name: fight.name,
        verdict: getVerdict(outcomes),
        turns,
        bounded: outcomes.length,
        ...tally,
        untold,
        placed,
        elsewhere,
        stretch,
    };
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
 * The register the document carries: a recording, the verdict it earned, how much of its numbering
 * that verdict was earned over, and how far the count stands from the game's own numbering across
 * the whole stretch. A verdict without its coverage would hold while most of the numbering went
 * ungraded, which is the state this register was rebuilt out of.
 */
export function composeGradeRegister(grades: readonly TurnGrade[]): string[] {
    assert(grades.length > 0, "a register states the grades it was handed");
    const heading = `${"the game agrees".padEnd(VERDICT_WIDTH + 4)}${"steps".padStart(9)}` +
        `${"agreed".padStart(9)}${"granted".padStart(9)}${"taken".padStart(9)}` +
        `${"short".padStart(9)}${"lost".padStart(9)}`;
    const lines = [`  ${"recording".padEnd(NAME_WIDTH)}${heading}`];
    for (const grade of grades) {
        const stretch = grade.stretch;
        const bounded = grade.bounded === 0
            ? [NO_STRETCH, NO_STRETCH]
            : [grade.bounded, grade.exact].map(composeIntegerText);
        const wider = stretch === null
            ? [NO_STRETCH, NO_STRETCH, NO_STRETCH, NO_STRETCH]
            : [stretch.granted, stretch.taken, stretch.short, stretch.lost]
                .map(composeIntegerText);
        lines.push(
            `  ${grade.name.padEnd(NAME_WIDTH)}${grade.verdict.padEnd(VERDICT_WIDTH + 4)}${
                [...bounded, ...wider].map((one) => one.padStart(9)).join("")
            }`,
        );
    }
    return lines;
}

/** The same, with what stands behind each verdict — which is why the register carries none. */
export function composeCaseReport(grades: readonly TurnGrade[]): string[] {
    assert(grades.length > 0, "a report states the grades it was handed");
    const headings = ["turns", "bounded", ...TURN_OUTCOMES, "untold", "placed", "elsewhere"];
    const lines = [
        `  ${"recording".padEnd(NAME_WIDTH)}${"the game agrees".padEnd(VERDICT_WIDTH + 4)}${
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
            `  ${grade.name.padEnd(NAME_WIDTH)}${grade.verdict.padEnd(VERDICT_WIDTH + 4)}${
                counts.map((one) => composeIntegerText(one).padStart(COUNT_WIDTH)).join("")
            }`,
        );
    }
    return lines;
}

/** One line of the walk, which is the only place a boundary states its own two ordinals. */
function composeWalkLine(boundary: TurnBoundary): string {
    assert(boundary.advance > 0, "a boundary the game numbered runs forwards");
    const placing = boundary.placing === null ? "" : ` ${boundary.placing}`;
    const graded = boundary.isNarrated
        ? `${boundary.outcome}${placing}`
        : "not narrated, and graded by nothing";
    assert(graded.length > 0, "a walk line says what the boundary came to, or that it had none");
    return `  ordinal ${composeIntegerText(boundary.from).padStart(6)} ->` +
        `${composeIntegerText(boundary.to).padStart(6)}` +
        `  counted ${composeIntegerText(boundary.counted).padStart(3)}` +
        ` of ${composeIntegerText(boundary.advance).padStart(3)}  ${graded}`;
}

/**
 * One recording walked boundary by boundary, which is where a verdict can be argued with. A
 * payload stating no ordinal opens no boundary and gets no line: what is graded here is the
 * stretch between two statements of the game's, never a payload.
 */
export function composeTurnReport(fight: RecordedFight): string[] {
    assert(fight.name.length > 0, "a walk is headed by the recording it was taken on");
    const steps = composeFightReplaySteps(fight);
    assert(steps.length <= MAXIMUM_PAYLOADS, "a walk stays inside the recording's stated bound");
    const boundaries = composeBoundaries(steps);
    const lines = ["", `=== ${fight.name} ===`];
    for (const boundary of boundaries) lines.push(composeWalkLine(boundary));
    if (boundaries.length === 0) lines.push("  the game numbered this fight once, or not at all");
    assert(lines.length > 2, "a walk says something about the recording it was taken on");
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
