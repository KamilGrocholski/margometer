/**
 * What a dymek could say about one fighter when both sides are full: the figure each standing
 * effect carries, whether that figure can be pinned to the fighter it is drawn beside, and how
 * tall the append would stand.
 *
 * Run by hand, and it earns no `deno task` entry because it has one consumer (**C9**):
 *
 *     deno run -A design/dziesiec/measure.ts
 *
 * ⚠️ **The corpus holds no fight of ten against ten.** Everything here is measured over ten
 * against one; what twenty would come to is arithmetic, kept apart under `tenOnTen`.
 */

import { assert } from "@std/assert";
import type { BattleEvent, DeclaredEffect } from "@/src/core/battle-event.ts";
import {
    type AuraStanding,
    composeAuraTurnsBySkillId,
    composeFightStandings,
    composeShoutsBySkillId,
    getReachFromEffects,
    PROVOCATION_KEY,
    type StatedSkills,
} from "@/src/core/aura-standing.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import { NAME_SEPARATOR } from "@/src/core/fight-decoder.ts";
import {
    composeCountedNoun,
    COUNTED_NOUNS,
    getWordsForStatusBit,
} from "@/src/ui/panel-words.ts";
import { readStatedIdsFromPayload } from "@/src/game/engine-warrior.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import { FROZEN_BUFF_BITS } from "@/frozen/buff-bits.ts";
import { PLACE, SHAPE, SPACE, SURFACE, TEXT } from "@/src/ui/panel-look.ts";
import {
    composeFightReplay,
    composeFightReplaySteps,
    composeRecordedMaterial,
    type FightReplay,
    type FightReplayStep,
} from "@/tools/fight-replay.ts";
import type { RecordedFight } from "@/tools/recorded-fights.ts";
import { RecordingReadError } from "@/tools/margometer-tool-error.ts";

const MEASURED_FILE = "design/dziesiec/measured.json";

/**
 * The keys this round asks a figure of, spelled where it reads them. `docs/protocol-keys.md` owns
 * what each one means and `docs/auras-standing.md` the unit each one is in (**C15**).
 */
const FIGURE_KEYS = [
    "allslow_per",
    "aura-sa_per",
    "aura-ac_per",
    "aura-resall",
    "alllowdmg",
    "active_decblock_per-enemies",
    "aura-adddmg2_per-meele",
] as const;

/** The two bits the mask carries that a figure key above is ever said to move. */
const WITNESSED = [
    { bit: "swow_down", key: "allslow_per" },
    { bit: "speed_up", key: "aura-sa_per" },
] as const;

const HOLYTOUCH_PROC = "+legbon_holytouch";
const LASTHEAL = "legbon_lastheal";
/** Cited from `design/dymek/measured.json`, where the denominator was witnessed rather than read. */
const HOLYTOUCH_TURNS = 3;

/** More of anything than the corpus carries, so every walk below states a bound (**S2**). */
const MAXIMUM_EVENTS = 100_000;
const MAXIMUM_PAYLOADS = 4096;

function composeTally(counted: readonly number[]): [number, number][] {
    assert(counted.length <= MAXIMUM_EVENTS, "a tally is taken over a bounded list");
    const byValue = new Map<number, number>();
    for (const one of counted) {
        assert(Number.isSafeInteger(one), "a tally counts whole numbers");
        byValue.set(one, (byValue.get(one) ?? 0) + 1);
    }
    return [...byValue].sort((one, other) => one[0] - other[0]);
}

/**
 * One reading out of a sorted list. It throws rather than substituting, because a figure that
 * could not be taken is not the figure zero (**E10**).
 */
function getValueAt(sorted: readonly number[], at: number): number {
    assert(at >= 0, "a reading is taken at a place in the list");
    assert(at < sorted.length, "and inside it");
    const one = sorted[at];
    if (one === undefined) throw new RecordingReadError(`nothing stands at ${at} of the reading`);
    return one;
}

function getShareAt(sorted: readonly number[], share: number): number {
    assert(sorted.length > 0, "a share is taken of something");
    assert(share >= 0, "and of a share that is a share");
    const at = Math.min(sorted.length - 1, Math.floor(sorted.length * share));
    return getValueAt(sorted, at);
}

function getMost(sorted: readonly number[]): number {
    assert(sorted.length > 0, "the largest reading is taken of something");
    return getValueAt(sorted, sorted.length - 1);
}

function composeStatedSkills(): StatedSkills {
    const stated = {
        turnsBySkillId: composeAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
        shoutsBySkillId: composeShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
    };
    assert(stated.turnsBySkillId.size > 0, "the published table dates something");
    assert(stated.shoutsBySkillId.size > 0, "and states a shout of its own");
    return stated;
}

/** The published table, read once: a walk that recomposed it per payload read it 1 376 times. */
const STATED_SKILLS = composeStatedSkills();

function getBitFor(named: string): number {
    const bit = FROZEN_BUFF_BITS.bits.findIndex((one) => one === named);
    assert(bit >= 0, "a status this round asks about is one the frozen table names");
    assert(bit < FROZEN_BUFF_BITS.bits.length, "and stands inside the table");
    return bit;
}

/** What one announcement declared, by key, where the key carried a figure at all. */
function composeAmountsFromDeclared(declared: readonly DeclaredEffect[]): Map<string, number> {
    assert(declared.length <= MAXIMUM_EVENTS, "an announcement declares a bounded list");
    const found = new Map<string, number>();
    for (const one of declared) {
        if (one.amount === null) continue;
        found.set(one.effect, one.amount);
    }
    return found;
}

/**
 * The one line the add-on wrote into a tooltip **on the date this round was taken**, composed
 * here because the shipped composer now writes a row at a time, and since **ADR 0109** writes
 * no count off the mask at all. Same words, same separators, so the figure below stays
 * comparable with what was measured then.
 */
function composeLineAsMeasured(statuses: readonly { bit: number; turnsElapsed: number }[]): string {
    assert(statuses.length >= 0, "a line is composed of what somebody carries");
    const said = statuses.map((one) =>
        `${getWordsForStatusBit(one.bit, null)} ${
            composeCountedNoun(one.turnsElapsed, COUNTED_NOUNS.turns)
        }`
    );
    assert(said.length === statuses.length, "and says one thing about each of them");
    if (said.length === 0) return "";
    return `MargoMeter \u00b7 ${said.join(", ")}`;
}

interface FigureMeasured {
    casts: number;
    withFigure: number;
    values: [number, number][];
}

/**
 * What each key states on the wire, counted over every announcement carrying it. The figure is
 * decoded already — `DeclaredEffect.amount` — and dropped before it reaches the panel, which is
 * `ARCHITECTURE.md`'s known gap 17.
 */
function composeFiguresMeasured(replays: readonly FightReplay[]): Record<string, FigureMeasured> {
    assert(replays.length > 0, "a figure is measured over something");
    const found: Record<string, FigureMeasured> = {};
    for (const key of FIGURE_KEYS) {
        const values: number[] = [];
        let casts = 0;
        for (const replay of replays) {
            assert(replay.reading.events.length <= MAXIMUM_EVENTS, "a fight's events are bounded");
            for (const event of replay.reading.events) {
                if (event.kind !== "skill-used") continue;
                for (const declared of event.declared) {
                    if (declared.effect !== key) continue;
                    casts += 1;
                    if (declared.amount !== null) values.push(declared.amount);
                }
            }
        }
        found[key] = { casts, withFigure: values.length, values: composeTally(values) };
    }
    return found;
}

/** The latest figures each cast of a skill by one caster declared, keyed the way a cast is. */
function composeAmountsByCast(events: readonly BattleEvent[]): Map<string, Map<string, number>> {
    assert(events.length <= MAXIMUM_EVENTS, "a walk over a fight is bounded");
    const byCast = new Map<string, Map<string, number>>();
    for (const event of events) {
        if (event.kind !== "skill-used") continue;
        if (event.skillId === null) continue;
        if (event.actorId === null) continue;
        byCast.set(`${event.skillId}/${event.actorId}`, composeAmountsFromDeclared(event.declared));
    }
    return byCast;
}

/** True where a cast by somebody on `casterSide` reaches a bearer standing on `bearerSide`. */
function getReachCovers(key: string, casterSide: number, bearerSide: number): boolean {
    assert(key.length > 0, "a reach is asked of a key");
    assert(Number.isSafeInteger(casterSide), "and of two sides the roster states");
    const reach = getReachFromEffects([{ effect: key }]);
    if (reach === null) return false;
    if (reach === "both-sides") return true;
    if (reach === "casters-side") return casterSide === bearerSide;
    return casterSide !== bearerSide;
}
/**
 * One cast that could be standing over a bearer: the figure it declared, and when it was made.
 * **Not a claim that it landed on them** — a cast reaching a side never says whom it reached
 * (**ADR 0061**). It is what the dymek would have to stand on, and counting them is how this
 * round asks whether it may.
 */
interface MatchedCast {
    skillId: number;
    skillName: string;
    casterId: number;
    figure: number;
    /** Where this cast fell among the announcements of the fight, so a walk can say which is later. */
    ordinal: number;
    turnsStated: number;
}

/** When each cast was announced, keyed the way a cast is: the later cast of a pair wins. */
function composeCastOrdinals(events: readonly BattleEvent[]): Map<string, number> {
    assert(events.length <= MAXIMUM_EVENTS, "a walk over a fight is bounded");
    const found = new Map<string, number>();
    let at = 0;
    for (const event of events) {
        if (event.kind !== "skill-used") continue;
        if (event.skillId === null) continue;
        if (event.actorId === null) continue;
        at += 1;
        found.set(`${event.skillId}/${event.actorId}`, at);
    }
    assert(at >= found.size, "a cast announced twice is one cast, counted at its later turn");
    return found;
}

function composeMatchedCasts(
    standings: readonly AuraStanding[],
    roster: CombatantRoster,
    at: { amounts: Map<string, Map<string, number>>; ordinals: Map<string, number> },
    asked: { bearerSide: number; key: string },
): MatchedCast[] {
    assert(asked.key.length > 0, "a cast is matched against a key");
    assert(standings.length <= MAXIMUM_EVENTS, "and over a bounded list of standings");
    const found: MatchedCast[] = [];
    for (const standing of standings) {
        const caster = roster.byId.get(standing.casterId);
        if (caster === undefined) continue;
        const castKey = `${standing.skillId}/${standing.casterId}`;
        const figure = at.amounts.get(castKey)?.get(asked.key);
        if (figure === undefined) continue;
        if (!getReachCovers(asked.key, caster.side, asked.bearerSide)) continue;
        found.push({
            skillId: standing.skillId,
            skillName: standing.skillName,
            casterId: standing.casterId,
            figure,
            ordinal: at.ordinals.get(castKey) ?? 0,
            turnsStated: standing.turnsStated,
        });
    }
    return found;
}

/** What two sources come to, which is the only figure the cap ever leaves standing. */
function getSumOfTwo(figures: readonly number[]): number {
    assert(figures.length > 0, "a sum of two is taken of something");
    const first = figures[0] ?? 0;
    const second = figures[1] ?? 0;
    return first + second;
}

/**
 * ⚠️ **The help says the two highest, and a reader says the two latest.** Compared on the sum,
 * not on which casts they are: two casts of equal figure are the same answer whichever pair is
 * kept, and a difference that moves no figure is not a difference anybody could see.
 */
function getLatestComeToHighest(matched: readonly MatchedCast[]): boolean {
    assert(matched.length >= 2, "two sources are compared where there are two");
    const byOrdinal = [...matched].sort((one, other) => other.ordinal - one.ordinal);
    const byFigure = [...matched].sort((one, other) => other.figure - one.figure);
    const latest = getSumOfTwo(byOrdinal.map((one) => one.figure));
    const highest = getSumOfTwo(byFigure.map((one) => one.figure));
    return latest === highest;
}

interface AttributionTally {
    standing: number[];
    alone: number[];
    elapsedWhenAlone: number[];
    latestAgree: number;
    latestDiffer: number;
    latestAgreePastTwo: number;
    latestDifferPastTwo: number;
    denominatorFits: number;
    denominatorOverflows: number;
}

function composeAttributionTally(): AttributionTally {
    return {
        standing: [],
        alone: [],
        elapsedWhenAlone: [],
        latestAgree: 0,
        latestDiffer: 0,
        latestAgreePastTwo: 0,
        latestDifferPastTwo: 0,
        denominatorFits: 0,
        denominatorOverflows: 0,
    };
}

/**
 * One bearer at one moment: how many casts stand over them, whether the two a reader would keep
 * are the two the game keeps, and whether the length off the mask still fits the table's turns.
 */
function setAttributionFromMatched(
    matched: readonly MatchedCast[],
    turnsElapsed: number,
    tally: AttributionTally,
): void {
    assert(turnsElapsed >= 0, "a status has stood for a count of turns that never runs backwards");
    assert(matched.length <= MAXIMUM_EVENTS, "and over a bounded list of casts");
    tally.standing.push(matched.length);
    const alone = matched[0];
    if (matched.length === 1) {
        if (alone !== undefined) {
            tally.alone.push(alone.figure);
            tally.elapsedWhenAlone.push(turnsElapsed);
            if (turnsElapsed < alone.turnsStated) tally.denominatorFits += 1;
            else tally.denominatorOverflows += 1;
        }
        return;
    }
    if (matched.length < 2) return;
    const agrees = getLatestComeToHighest(matched);
    if (agrees) tally.latestAgree += 1;
    else tally.latestDiffer += 1;
    if (matched.length <= 2) return;
    if (agrees) tally.latestAgreePastTwo += 1;
    else tally.latestDifferPastTwo += 1;
}

interface AttributionMeasured {
    bearerMoments: number;
    castsStanding: [number, number][];
    figureWhenAlone: [number, number][];
    momentsWithNoCast: number;
    momentsWithOneCast: number;
    momentsPastOneCast: number;
    elapsedWhenAlone: [number, number][];
    latestAgree: number;
    latestDiffer: number;
    latestAgreePastTwo: number;
    latestDifferPastTwo: number;
    denominatorFits: number;
    denominatorOverflows: number;
}

function composeAttributionFromTally(tally: AttributionTally): AttributionMeasured {
    assert(tally.standing.length >= 0, "a tally is read after it was taken");
    assert(tally.alone.length <= tally.standing.length, "and one moment is counted once");
    return {
        bearerMoments: tally.standing.length,
        castsStanding: composeTally(tally.standing),
        figureWhenAlone: composeTally(tally.alone),
        momentsWithNoCast: tally.standing.filter((count) => count === 0).length,
        momentsWithOneCast: tally.alone.length,
        momentsPastOneCast: tally.standing.filter((count) => count > 1).length,
        elapsedWhenAlone: composeTally(tally.elapsedWhenAlone),
        latestAgree: tally.latestAgree,
        latestDiffer: tally.latestDiffer,
        latestAgreePastTwo: tally.latestAgreePastTwo,
        latestDifferPastTwo: tally.latestDifferPastTwo,
        denominatorFits: tally.denominatorFits,
        denominatorOverflows: tally.denominatorOverflows,
    };
}

interface ProvocationMeasured {
    announcements: number;
    namesPerAnnouncement: [number, number][];
    namesMost: number;
    heldAtOnce: [number, number][];
    heldMost: number;
    turnsElapsed: [number, number][];
    nameCharactersLongest: number;
    tenNamesInOneLine: number;
}

/**
 * Whom a shout names, and how far through each of them is. The length is the **held character's**
 * own — one cast holding two is two counts on two clocks (**ADR 0103**).
 */
function composeProvocationMeasured(
    replays: readonly FightReplay[],
    fights: readonly RecordedFight[],
): ProvocationMeasured {
    assert(replays.length > 0, "a shout is measured over something");
    const perAnnouncement: number[] = [];
    const nameLengths: number[] = [];
    let announcements = 0;
    for (const replay of replays) {
        for (const event of replay.reading.events) {
            if (event.kind !== "skill-used") continue;
            for (const declared of event.declared) {
                if (declared.effect !== PROVOCATION_KEY) continue;
                if (declared.text === null) continue;
                const names = declared.text.split(NAME_SEPARATOR).filter((one) => one.length > 0);
                announcements += 1;
                perAnnouncement.push(names.length);
                for (const name of names) nameLengths.push(name.length);
            }
        }
    }
    const held: number[] = [];
    const elapsed: number[] = [];
    for (const fight of fights) {
        for (const step of composeFightReplaySteps(fight)) {
            const stated = composeFightStandings(
                step.replay.reading.events,
                STATED_SKILLS,
                step.replay.reading.roster,
            );
            held.push(stated.provocations.length);
            for (const one of stated.provocations) elapsed.push(one.turnsElapsed);
        }
    }
    const sortedNames = [...nameLengths].sort((one, other) => one - other);
    const longest = sortedNames.length === 0 ? 0 : getMost(sortedNames);
    return {
        announcements,
        namesPerAnnouncement: composeTally(perAnnouncement),
        namesMost: perAnnouncement.length === 0 ? 0 : getMost([...perAnnouncement].sort((one, other) => one - other)),
        heldAtOnce: composeTally(held),
        heldMost: held.length === 0 ? 0 : getMost([...held].sort((one, other) => one - other)),
        turnsElapsed: composeTally(elapsed),
        nameCharactersLongest: longest,
        tenNamesInOneLine: longest * 10 + NAME_SEPARATOR.length * 9,
    };
}

/** Who is under the effect, and who has spent the bonus, as one payload leaves them. */
interface LegendStanding {
    underHolytouch: Set<number>;
    spentLastheal: Set<number>;
}

/**
 * ⚠️ **Counted per payload rather than per event**, which is the granularity a dymek is written
 * at: the turn a run lit on is the count the statistics stated at the payload the declaration
 * arrived in.
 */
function setLegendStanding(
    step: FightReplayStep,
    litAtTurns: Map<number, number>,
    declarations: Map<number, number>,
): LegendStanding {
    assert(litAtTurns.size <= MAXIMUM_EVENTS, "a fight lights a bounded number of runs");
    const spentLastheal = new Set<number>();
    const seen = new Map<number, number>();
    for (const event of step.replay.reading.events) {
        if (event.kind === "attack") {
            if (event.actorId === null) continue;
            if (!event.declared.some((one) => one.effect === HOLYTOUCH_PROC)) continue;
            seen.set(event.actorId, (seen.get(event.actorId) ?? 0) + 1);
        }
        if (event.kind === "healing-to-named-combatant") {
            if (event.source !== LASTHEAL) continue;
            if (event.targetId === null) continue;
            spentLastheal.add(event.targetId);
        }
    }
    const underHolytouch = new Set<number>();
    for (const [combatantId, count] of seen) {
        const taken = step.replay.statistics.byCombatantId.get(combatantId)?.turnsTaken ?? 0;
        if (count > (declarations.get(combatantId) ?? 0)) litAtTurns.set(combatantId, taken);
        declarations.set(combatantId, count);
        const lit = litAtTurns.get(combatantId) ?? taken;
        if (taken - lit < HOLYTOUCH_TURNS) underHolytouch.add(combatantId);
    }
    return { underHolytouch, spentLastheal };
}

interface BlockMeasured {
    payloads: number;
    restatedCombatants: number;
    rowsInBlock: [number, number][];
    rowsHalf: number;
    rowsNineteenOfTwenty: number;
    rowsMaximum: number;
    saysNothing: number;
    turnsRows: number;
    statusRows: number;
    holytouchRows: number;
    lasthealRows: number;
    provokedRows: number;
    shoutingRows: number;
    lineTodayLongest: number;
    turnsTaken: [number, number][];
    /** The same block with every standing effect naming its casts instead of standing as one row. */
    rowsPerSkill: [number, number][];
    rowsPerSkillHalf: number;
    rowsPerSkillNineteenOfTwenty: number;
    rowsPerSkillMaximum: number;
}

/** What this walk answers at once, over one pass of the corpus rather than three. */
interface WalkMeasured {
    block: BlockMeasured;
    attribution: Record<string, AttributionMeasured>;
}

/** The key each witnessed bit is moved by, read once off the frozen table. */
const KEY_BY_BIT = new Map(WITNESSED.map((one) => [getBitFor(one.bit), one.key] as const));

/** What one payload holds that a matched cast is read against, composed once per step. */
interface StepReading {
    amounts: Map<string, Map<string, number>>;
    ordinals: Map<string, number>;
}

/**
 * Every bearer of a witnessed status at this moment, counted into its bit's tally — and the
 * count kept per bearer, because the block below asks the same question about the same statuses
 * and a second matching would walk the standings twice.
 */
function setStepAttribution(
    step: FightReplayStep,
    standings: readonly AuraStanding[],
    at: StepReading,
    kept: { tallyByBit: Map<number, AttributionTally>; matchedByCarried: Map<string, number> },
): void {
    assert(standings.length <= MAXIMUM_EVENTS, "a step states a bounded list of standings");
    assert(kept.tallyByBit.size > 0, "and something is being counted into");
    const roster = step.replay.reading.roster;
    for (const carried of step.replay.reading.carriedStatuses) {
        const key = KEY_BY_BIT.get(carried.bit);
        if (key === undefined) continue;
        const bearer = roster.byId.get(carried.combatantId);
        if (bearer === undefined) continue;
        const matched = composeMatchedCasts(standings, roster, at, {
            bearerSide: bearer.side,
            key,
        });
        kept.matchedByCarried.set(`${carried.combatantId}/${carried.bit}`, matched.length);
        const tally = kept.tallyByBit.get(carried.bit);
        if (tally === undefined) continue;
        setAttributionFromMatched(matched, carried.turnsElapsed, tally);
    }
}

/**
 * How many rows one fighter's statuses would take if each named the casts standing over it. A
 * status nothing announced stays **one** row — the bare status, as today — because naming no
 * skill is what this repository does with a cause nobody stated.
 */
function getSkillRowsForStatuses(
    statuses: readonly { combatantId: number; bit: number }[],
    matchedByCarried: ReadonlyMap<string, number>,
): number {
    assert(statuses.length <= MAXIMUM_EVENTS, "a fighter carries a bounded list of statuses");
    let rows = 0;
    for (const status of statuses) {
        const matched = matchedByCarried.get(`${status.combatantId}/${status.bit}`) ?? 0;
        rows += matched === 0 ? 1 : matched;
    }
    assert(rows >= statuses.length, "and naming a cast never makes a status say less");
    return rows;
}

/**
 * How tall the append would stand under the whole of what this round was asked for — the turns
 * taken, the two legendary bonuses, the statuses off the mask, and the provocation from either
 * end — per fighter the payload restated, which is the only set anything is written onto.
 */
/**
 * How tall the append would stand under the whole of what this round was asked for — the turns
 * taken, the two legendary bonuses, the statuses off the mask, and the provocation from either
 * end — per fighter the payload restated, which is the only set anything is written onto.
 */
function composeWalkMeasured(fights: readonly RecordedFight[]): WalkMeasured {
    assert(fights.length > 0, "the corpus is walked over something");
    const rows: number[] = [];
    const perSkill: number[] = [];
    const taken: number[] = [];
    const tallyByBit = new Map([...KEY_BY_BIT.keys()].map((bit) =>
        [bit, composeAttributionTally()] as const
    ));
    const count = {
        payloads: 0,
        restated: 0,
        turns: 0,
        statuses: 0,
        holytouch: 0,
        lastheal: 0,
        provoked: 0,
        shouting: 0,
        nothing: 0,
        longest: 0,
    };
    for (const fight of fights) {
        const litAtTurns = new Map<number, number>();
        const declarations = new Map<number, number>();
        const steps = composeFightReplaySteps(fight);
        assert(steps.length <= MAXIMUM_PAYLOADS, "a recording's payloads are bounded");
        for (const step of steps) {
            count.payloads += 1;
            const legend = setLegendStanding(step, litAtTurns, declarations);
            const stated = composeFightStandings(
                step.replay.reading.events,
                STATED_SKILLS,
                step.replay.reading.roster,
            );
            const at: StepReading = {
                amounts: composeAmountsByCast(step.replay.reading.events),
                ordinals: composeCastOrdinals(step.replay.reading.events),
            };
            const matchedByCarried = new Map<string, number>();
            setStepAttribution(step, stated.standings, at, { tallyByBit, matchedByCarried });
            for (const combatantId of readStatedIdsFromPayload(step.payload)) {
                count.restated += 1;
                const statuses = step.replay.reading.carriedStatuses.filter((one) =>
                    one.combatantId === combatantId
                );
                const turnsTaken = step.replay.statistics.byCombatantId.get(combatantId)
                    ?.turnsTaken ?? 0;
                const provoked = stated.provocations.filter((one) =>
                    one.provokedId === combatantId
                ).length;
                const shouting = stated.provocations.some((one) => one.casterId === combatantId);
                const beside = (turnsTaken > 0 ? 1 : 0) +
                    (legend.underHolytouch.has(combatantId) ? 1 : 0) +
                    (legend.spentLastheal.has(combatantId) ? 1 : 0) + provoked +
                    (shouting ? 1 : 0);
                count.statuses += statuses.length;
                if (turnsTaken > 0) count.turns += 1;
                if (legend.underHolytouch.has(combatantId)) count.holytouch += 1;
                if (legend.spentLastheal.has(combatantId)) count.lastheal += 1;
                count.provoked += provoked;
                if (shouting) count.shouting += 1;
                if (statuses.length + beside === 0) count.nothing += 1;
                rows.push(statuses.length + beside);
                perSkill.push(getSkillRowsForStatuses(statuses, matchedByCarried) + beside);
                taken.push(turnsTaken);
                const line = composeLineAsMeasured(statuses);
                count.longest = Math.max(count.longest, line.length);
            }
        }
    }
    const sorted = [...rows].sort((one, other) => one - other);
    const sortedPerSkill = [...perSkill].sort((one, other) => one - other);
    const attribution: Record<string, AttributionMeasured> = {};
    for (const one of WITNESSED) {
        const tally = tallyByBit.get(getBitFor(one.bit));
        if (tally === undefined) continue;
        attribution[one.bit] = composeAttributionFromTally(tally);
    }
    return {
        attribution,
        block: {
            payloads: count.payloads,
            restatedCombatants: count.restated,
            rowsInBlock: composeTally(rows),
            rowsHalf: getShareAt(sorted, 0.5),
            rowsNineteenOfTwenty: getShareAt(sorted, 0.95),
            rowsMaximum: getMost(sorted),
            saysNothing: count.nothing,
            turnsRows: count.turns,
            statusRows: count.statuses,
            holytouchRows: count.holytouch,
            lasthealRows: count.lastheal,
            provokedRows: count.provoked,
            shoutingRows: count.shouting,
            lineTodayLongest: count.longest,
            turnsTaken: composeTally(taken),
            rowsPerSkill: composeTally(perSkill),
            rowsPerSkillHalf: getShareAt(sortedPerSkill, 0.5),
            rowsPerSkillNineteenOfTwenty: getShareAt(sortedPerSkill, 0.95),
            rowsPerSkillMaximum: getMost(sortedPerSkill),
        },
    };
}

/** What the sheets draw at, so no figure on one is a number somebody typed (**V5**). */
function composeTokensMeasured() {
    return {
        surface: SURFACE,
        text: TEXT,
        panelWidth: PLACE.width,
        rowHeight: SPACE.rowHeight,
        spaceSmall: SPACE.small,
        spaceWide: SPACE.wide,
        radius: SHAPE.radius,
        radiusSmall: SHAPE.radiusSmall,
    };
}

/**
 * ⚠️ **Not a measurement.** The corpus holds no fight of ten against ten, so what twenty comes to
 * is arithmetic over the shapes above and is labelled here rather than mixed in with them.
 */
function composeTenOnTen(block: BlockMeasured, provocation: ProvocationMeasured) {
    assert(block.restatedCombatants > 0, "the arithmetic stands on something measured");
    assert(provocation.nameCharactersLongest >= 0, "and on a name length taken from the corpus");
    return {
        material: "none — arithmetic over the rows above, at twenty combatants",
        combatants: 20,
        appendsPerPayload: 20,
        rowsAcrossOneBoard: block.rowsMaximum * 20,
        shoutNamesPublishedMaximum: 10,
        shoutLineCharacters: provocation.tenNamesInOneLine,
        provokedRowsUnderOneShout: 10,
    };
}

function composeMeasured() {
    const recorded = composeRecordedMaterial([]);
    const replays = recorded.fights.map((fight) => composeFightReplay(fight));
    assert(replays.length === recorded.fights.length, "every recording read is one replayed");
    const walk = composeWalkMeasured(recorded.fights);
    const provocation = composeProvocationMeasured(replays, recorded.fights);
    return {
        takenAt: new Date().toISOString().slice(0, "YYYY-MM-DD".length),
        material: `${recorded.material}, ${recorded.fights.length} recordings`,
        gameBuild: FROZEN_BUFF_BITS.gameBuild,
        tokens: composeTokensMeasured(),
        figures: composeFiguresMeasured(replays),
        attribution: walk.attribution,
        provocation,
        block: walk.block,
        tenOnTen: composeTenOnTen(walk.block, provocation),
    };
}

if (import.meta.main) {
    const measured = composeMeasured();
    Deno.writeTextFileSync(MEASURED_FILE, `${JSON.stringify(measured, null, 4)}\n`);
    console.log(`${MEASURED_FILE} written over ${measured.material}`);
}
