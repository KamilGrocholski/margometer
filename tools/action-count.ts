/**
 * What a fight's actions come to, and how they stand against the game's own `current`.
 *
 *     deno task actions                        the register, over the corpus
 *     deno task actions --cases                the counts behind each verdict
 *     deno task actions captures/<file>.json   one recording, payload by payload
 *
 * An action is what a combatant did on their turn — never a turn itself, and
 * `docs/actions-taken.md` carries the verdicts and what they do not claim. The figures come off
 * the replay, so this and the panel cannot disagree about a fight (`tools/fight-replay.ts`).
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import { STEP_KEY } from "@/src/core/fight-decoder.ts";
import type { CombatantFigures, FightStatistics } from "@/src/core/fight-statistics.ts";
import { composeIntegerText } from "@/libs/number-text.ts";
import { getNumberFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import { ActionCountError } from "@/tools/margometer-tool-error.ts";
import {
    composeFightReplaySteps,
    composeRecordedMaterial,
    type FightReplay,
    type FightReplayStep,
} from "@/tools/fight-replay.ts";
import type { RecordedFight } from "@/tools/recorded-fights.ts";

/**
 * The key the game states whose turn is beginning under, spelled here because this is the one
 * file that reads it (**N13**). It names who acts **next**: measured over `captures/` on
 * 2026-09-01, the actions it points at arrive in the payload after the one carrying it, and
 * grading it against the payload that carries it puts every recording at `never`.
 */
const CURRENT_KEY = "current";

/** A run names a handful of recordings; this is far past that. */
const MAXIMUM_ARGUMENTS = 256;
/** Past every recording the corpus holds, and past what one sitting would name by hand. */
const MAXIMUM_RECORDINGS = 4096;
/** The longest recording in `captures/` carries 111 payloads, 2026-09-01. */
const MAXIMUM_PAYLOADS = 100000;

/**
 * The two definitions this round grades, and the reason there are two. `struck` is the reading
 * `a01bf11`'s commit body describes. `stepped` is the one its deleted implementation actually
 * had: over the boar recording `struck` comes to 8 / 0 / 0 / 1 and `stepped` to 8 / 0 / 1 / 3,
 * which is the 8 / 3 / 1 that commit reports (2026-09-01).
 */
export const ACTION_READINGS = ["struck", "stepped"] as const;
export type ActionReading = (typeof ACTION_READINGS)[number];

/**
 * What one graded payload came to. `empty` grades nothing and is counted apart: a payload with no
 * action in it says neither that the reading works nor that it does not.
 */
export const ACTION_OUTCOMES = ["alone", "leading", "silent", "empty"] as const;
export type ActionOutcome = (typeof ACTION_OUTCOMES)[number];

/** `in a lump` is a recording the game numbered once, which grades against nothing at all. */
export const ACTION_VERDICTS = ["always", "sometimes", "never", "in a lump"] as const;
export type ActionVerdict = (typeof ACTION_VERDICTS)[number];

/** One fight's actions under one reading, and whose they were. */
export interface ActionTally {
    byCombatantId: Map<number, number>;
    /** The part the protocol named no actor for. No row can hold it, by construction. */
    unattributed: number;
    total: number;
}

export interface ActionGrade {
    name: string;
    reading: ActionReading;
    verdict: ActionVerdict;
    total: number;
    unattributed: number;
    alone: number;
    leading: number;
    silent: number;
    empty: number;
}

/** Whether one event is an action under this reading, and who took it. */
function getActorOfAction(event: BattleEvent, reading: ActionReading): number | null | undefined {
    if (event.kind === "skill-used") return event.actorId;
    if (event.kind === "attack") {
        if (event.announced !== null) return undefined;
        return event.actorId;
    }
    if (event.kind !== "declaration") return undefined;
    if (reading !== "stepped") return undefined;
    for (const declared of event.declared) {
        if (declared.effect === STEP_KEY) return event.combatantId;
    }
    return undefined;
}

/** Every action the events carry, kept by whose it was so a payload's own can be told apart. */
export function composeActionTally(
    events: readonly BattleEvent[],
    reading: ActionReading,
): ActionTally {
    const byCombatantId = new Map<number, number>();
    let unattributed = 0;
    let total = 0;
    for (const event of events) {
        const actorId = getActorOfAction(event, reading);
        if (actorId === undefined) continue;
        total += 1;
        if (actorId === null) unattributed += 1;
        else byCombatantId.set(actorId, (byCombatantId.get(actorId) ?? 0) + 1);
    }
    assert(byCombatantId.size <= MAXIMUM_COMBATANTS, "a fight stays inside its stated bound");
    assert(total >= unattributed, "an action nobody was named for is still an action");
    return { byCombatantId, unattributed, total };
}

/** One row's own actions, as the statistics already hold them: announced, or swung bare. */
function getActionsCharged(figures: CombatantFigures): number {
    assert(figures.blowsWithoutSkill >= 0, "a row swung no less than nothing");
    let charged = figures.blowsWithoutSkill;
    for (const [, skill] of figures.skills) {
        assert(skill.uses >= 0, "an announcement was made no less than never");
        charged += skill.uses;
    }
    return charged;
}

function getActionsChargedToRows(statistics: FightStatistics): number {
    let charged = 0;
    for (const [combatantId, figures] of statistics.byCombatantId) {
        assert(Number.isSafeInteger(combatantId), "a row belongs to an id that was read");
        charged += getActionsCharged(figures);
    }
    assert(charged >= 0, "a fight holds no less than no action at all");
    return charged;
}

/**
 * The `struck` reading read a second way — off the rows rather than off the events — and the
 * assertion that holds the two together. This is the one that matters to a panel: what a row
 * would draw is `skills[*].uses` and `blowsWithoutSkill`, which no event list is consulted for.
 */
export function composeActionTallyOfReplay(
    replay: FightReplay,
    reading: ActionReading,
): ActionTally {
    assert(replay.name.length > 0, "a count is taken of a recording with a name");
    const tally = composeActionTally(replay.reading.events, reading);
    if (reading !== "struck") return tally;
    assertStrictEquals(
        getActionsChargedToRows(replay.statistics),
        tally.total - tally.unattributed,
        "the rows and the events count the same actions",
    );
    return tally;
}

/** Whom the game says acts next, or nothing where this payload said nothing about it. */
function getNamedCurrent(payload: unknown): number | null {
    if (!isRecord(payload)) return null;
    if (!(CURRENT_KEY in payload)) return null;
    return getNumberFromUnknown(payload[CURRENT_KEY]);
}

/** What one payload added, row by row — the actions taken while it was being delivered. */
function composeActionDelta(
    standing: ReadonlyMap<number, number>,
    now: ReadonlyMap<number, number>,
): Map<number, number> {
    const delta = new Map<number, number>();
    for (const [combatantId, actions] of now) {
        const before = standing.get(combatantId) ?? 0;
        assert(actions >= before, "a count of actions never falls as a fight goes on");
        if (actions > before) delta.set(combatantId, actions - before);
    }
    assert(delta.size <= MAXIMUM_COMBATANTS, "a payload is acted in by the people in the fight");
    return delta;
}

/** How one payload's actions stood against the combatant the payload before it named. */
export function getOutcome(delta: ReadonlyMap<number, number>, named: number): ActionOutcome {
    assert(Number.isSafeInteger(named), "the game names who acts next by number");
    let total = 0;
    for (const [, actions] of delta) total += actions;
    assert(total >= 0, "a payload carried no less than nothing");
    if (total === 0) return "empty";
    const mine = delta.get(named) ?? 0;
    if (mine === 0) return "silent";
    if (total === 1) return "alone";
    return "leading";
}

/** Every payload that followed one naming `current`, graded against what that payload said. */
function composeOutcomes(
    steps: readonly FightReplayStep[],
    reading: ActionReading,
): ActionOutcome[] {
    assert(steps.length > 0, "a recording is graded over the payloads it carried");
    assert(steps.length <= MAXIMUM_PAYLOADS, "and over no more of them than it is bounded to");
    const outcomes: ActionOutcome[] = [];
    let standing = new Map<number, number>();
    let named: number | null = null;
    for (const step of steps) {
        const now = composeActionTally(step.replay.reading.events, reading).byCombatantId;
        if (named !== null) outcomes.push(getOutcome(composeActionDelta(standing, now), named));
        standing = now;
        named = getNamedCurrent(step.payload);
    }
    assert(outcomes.length < steps.length + 1, "the first payload is graded against nothing");
    return outcomes;
}

/**
 * The verdict a recording earns. An `empty` payload grades nothing, so a fight whose graded
 * payloads are all empty is `in a lump` beside one the game never numbered twice — both are
 * recordings this reading has no statement of the game's to stand against.
 */
export function getVerdict(outcomes: readonly ActionOutcome[]): ActionVerdict {
    let graded = 0;
    let silent = 0;
    for (const outcome of outcomes) {
        if (outcome === "empty") continue;
        graded += 1;
        if (outcome === "silent") silent += 1;
    }
    assert(silent <= graded, "a payload graded silent is a payload that was graded");
    if (graded === 0) return "in a lump";
    if (silent === 0) return "always";
    if (silent === graded) return "never";
    return "sometimes";
}

function composeGradeOfReading(
    fight: RecordedFight,
    steps: readonly FightReplayStep[],
    reading: ActionReading,
): ActionGrade {
    const last = steps[steps.length - 1];
    assert(last !== undefined, "a recording that was stepped through has a last step");
    const outcomes = composeOutcomes(steps, reading);
    const tally = { alone: 0, leading: 0, silent: 0, empty: 0 };
    for (const outcome of outcomes) tally[outcome] += 1;
    const counted = composeActionTallyOfReplay(last.replay, reading);
    return {
        name: fight.name,
        reading,
        verdict: getVerdict(outcomes),
        total: counted.total,
        unattributed: counted.unattributed,
        ...tally,
    };
}

/** One recording, graded once per reading — which is the comparison this round exists to make. */
export function composeActionGrades(fights: readonly RecordedFight[]): ActionGrade[] {
    assert(fights.length > 0, "a register is measured over something");
    assert(fights.length <= MAXIMUM_RECORDINGS, "and over no more than it is bounded to");
    const grades: ActionGrade[] = [];
    for (const fight of fights) {
        assert(fight.name.length > 0, "a grade is given to a recording with a name");
        const steps = composeFightReplaySteps(fight);
        for (const reading of ACTION_READINGS) {
            grades.push(composeGradeOfReading(fight, steps, reading));
        }
    }
    assertStrictEquals(
        grades.length,
        fights.length * ACTION_READINGS.length,
        "every recording is graded under every reading",
    );
    return grades;
}

const NAME_WIDTH = 68;
const READING_WIDTH = 10;
const VERDICT_WIDTH = 12;
const COUNT_WIDTH = 9;

/**
 * The register the document carries: a recording, and the verdict each reading earned on it. No
 * counts (**V5**) — a verdict holds while the corpus grows, and the numbers behind it do not.
 */
export function composeGradeRegister(grades: readonly ActionGrade[]): string[] {
    assert(grades.length > 0, "a register states the grades it was handed");
    const byName = new Map<string, Map<ActionReading, ActionVerdict>>();
    for (const grade of grades) {
        const held = byName.get(grade.name) ?? new Map<ActionReading, ActionVerdict>();
        held.set(grade.reading, grade.verdict);
        byName.set(grade.name, held);
    }
    assert(byName.size <= grades.length, "a recording is registered once");
    const headings = ACTION_READINGS.map((one) => one.padEnd(VERDICT_WIDTH)).join("");
    const lines = [`  ${"recording".padEnd(NAME_WIDTH)}${headings}`];
    for (const [name, verdicts] of byName) {
        const cells = ACTION_READINGS.map((reading) => {
            const verdict = verdicts.get(reading);
            assert(verdict !== undefined, "every reading graded every recording");
            return verdict.padEnd(VERDICT_WIDTH);
        });
        lines.push(`  ${name.padEnd(NAME_WIDTH)}${cells.join("")}`);
    }
    return lines;
}

/** The same, with what stands behind each verdict — which is why the register carries none. */
export function composeCaseReport(grades: readonly ActionGrade[]): string[] {
    assert(grades.length > 0, "a report states the grades it was handed");
    const headings = ["actions", "nobody's", ...ACTION_OUTCOMES];
    const lines = [
        `  ${"recording".padEnd(NAME_WIDTH)}${"reading".padEnd(READING_WIDTH)}${
            "acts".padEnd(VERDICT_WIDTH)
        }${headings.map((one) => one.padStart(COUNT_WIDTH)).join("")}`,
    ];
    for (const grade of grades) {
        const counts = [
            grade.total,
            grade.unattributed,
            grade.alone,
            grade.leading,
            grade.silent,
            grade.empty,
        ];
        lines.push(
            `  ${grade.name.padEnd(NAME_WIDTH)}${grade.reading.padEnd(READING_WIDTH)}${
                grade.verdict.padEnd(VERDICT_WIDTH)
            }${counts.map((one) => composeIntegerText(one).padStart(COUNT_WIDTH)).join("")}`,
        );
    }
    return lines;
}

/** What one payload came to under one reading, as the walk prints it. */
function composeWalkPart(
    previous: FightReplayStep | null,
    step: FightReplayStep,
    reading: ActionReading,
    named: number | null,
): string {
    const before = previous === null
        ? new Map<number, number>()
        : composeActionTally(previous.replay.reading.events, reading).byCombatantId;
    const now = composeActionTally(step.replay.reading.events, reading).byCombatantId;
    const delta = composeActionDelta(before, now);
    let total = 0;
    for (const [, actions] of delta) total += actions;
    assert(total >= 0, "a payload carried no less than nothing");
    const outcome = named === null ? "ungraded" : getOutcome(delta, named);
    return `${reading.padEnd(8)}${composeIntegerText(total).padStart(3)} ${outcome.padEnd(9)}`;
}

/** One recording walked payload by payload, which is where a verdict can be argued with. */
export function composeActionReport(fight: RecordedFight): string[] {
    assert(fight.name.length > 0, "a walk is headed by the recording it was taken on");
    const steps = composeFightReplaySteps(fight);
    assert(steps.length <= MAXIMUM_PAYLOADS, "a walk stays inside the recording's stated bound");
    const lines = ["", `=== ${fight.name} ===`];
    let previous: FightReplayStep | null = null;
    let named: number | null = null;
    let at = 0;
    for (const step of steps) {
        at += 1;
        const whom = named === null ? "\u2014" : composeIntegerText(named);
        const parts = ACTION_READINGS.map((one) => composeWalkPart(previous, step, one, named));
        lines.push(
            `  payload ${composeIntegerText(at).padStart(4)}  named ${whom.padStart(12)}  ${
                parts.join("  ")
            }`,
        );
        previous = step;
        named = getNamedCurrent(step.payload);
    }
    assert(at > 0, "a recording that was walked carried a payload");
    return lines;
}

interface ActionArguments {
    isCases: boolean;
    paths: string[];
}

function getArguments(stated: readonly string[]): ActionArguments {
    assert(stated.length <= MAXIMUM_ARGUMENTS, "a run is given no more arguments than are read");
    const parsed = parseArgs([...stated], { boolean: ["cases"] });
    const paths = parsed._.filter((one): one is string => typeof one === "string");
    if (paths.length !== parsed._.length) {
        throw new ActionCountError("a recording is named by a path and never by a number");
    }
    assertEquals(paths.length, parsed._.length, "every argument that is not a flag is a path");
    return { isCases: parsed.cases, paths };
}

if (import.meta.main) {
    const asked = getArguments(Deno.args);
    const recorded = composeRecordedMaterial(asked.paths);
    console.log(`material ${recorded.material}`);
    if (asked.isCases) {
        for (const line of composeCaseReport(composeActionGrades(recorded.fights))) {
            console.log(line);
        }
    } else if (asked.paths.length > 0) {
        for (const fight of recorded.fights) {
            for (const line of composeActionReport(fight)) console.log(line);
        }
    } else {
        for (const line of composeGradeRegister(composeActionGrades(recorded.fights))) {
            console.log(line);
        }
    }
}
