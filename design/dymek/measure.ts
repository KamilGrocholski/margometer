/**
 * What the round stands on: what the two legendary bonuses do over the corpus, what a combatant
 * is carrying when a payload restates them, and how tall a block of ours would stand.
 *
 * Run by hand, and it earns no `deno task` entry because it has one consumer (**C9**):
 *
 *     deno run -A design/dymek/measure.ts
 *
 * ⚠️ **The clock here is the bearer's, not the caster's.** A legendary bonus is the holder's own
 * (`docs/protocol-keys.md`, _Cause:_ the subject's own), so a run is counted in their turns the
 * way `src/core/carried-status.ts` counts one — taken and lost both.
 */

import { assert } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    composeTurnStanding,
    getTurnOpener,
    NO_TURN_STANDING,
    type TurnStanding,
} from "@/src/core/fight-statistics.ts";
import { composeCarriedTooltipLine, getWordsForStatusBit } from "@/src/ui/panel-words.ts";
import { readStatedIdsFromPayload } from "@/src/game/engine-warrior.ts";
import { FROZEN_BUFF_BITS } from "@/frozen/buff-bits.ts";
import { PLACE, SHAPE, SPACE, SURFACE, TEXT } from "@/src/ui/panel-look.ts";
import {
    composeFightReplay,
    composeFightReplaySteps,
    composeRecordedMaterial,
    type FightReplay,
} from "@/tools/fight-replay.ts";
import type { RecordedFight } from "@/tools/recorded-fights.ts";
import { RecordingReadError } from "@/tools/margometer-tool-error.ts";

const MEASURED_FILE = "design/dymek/measured.json";

/**
 * The three keys this round is about, spelled where the round reads them. `docs/protocol-keys.md`
 * owns what each one means; these are the tokens, not the meaning (**C15**).
 */
const HOLYTOUCH_PROC = "+legbon_holytouch";
const HOLYTOUCH_HEAL = "legbon_holytouch_heal";
const LASTHEAL = "legbon_lastheal";

/** The published help states three turns for the effect; the corpus is asked whether it shows. */
const HOLYTOUCH_TURNS_PUBLISHED = 3;
/** Past the turns any run in `captures/` stands for, so the walk that follows one is bounded. */
const MAXIMUM_RUN_TURNS = 32;
/** More of anything than the corpus carries, so every walk below states a bound (**S2**). */
const MAXIMUM_EVENTS = 100_000;
const MAXIMUM_PAYLOADS = 4096;

/** One combatant's clock, kept the way `carried-status.ts` keeps one. */
interface TurnClock {
    standing: TurnStanding;
    turnsByCombatantId: Map<number, number>;
}

function composeTurnClock(): TurnClock {
    return { standing: NO_TURN_STANDING, turnsByCombatantId: new Map() };
}

function addTurnToClock(clock: TurnClock, combatantId: number | null): void {
    assert(clock.turnsByCombatantId.size >= 0, "a clock holds a count per combatant");
    if (combatantId === null) return;
    const taken = (clock.turnsByCombatantId.get(combatantId) ?? 0) + 1;
    assert(taken > 0, "a turn that was counted was counted at least once");
    clock.turnsByCombatantId.set(combatantId, taken);
}

function getTurnsTaken(clock: TurnClock, combatantId: number): number {
    assert(Number.isSafeInteger(combatantId), "a clock is asked about a combatant by identity");
    const taken = clock.turnsByCombatantId.get(combatantId) ?? 0;
    assert(taken >= 0, "and a count of turns never runs backwards");
    return taken;
}

/** The clock moved by one event, in the order `carried-status.ts` moves it. */
function setClockPastEvent(clock: TurnClock, event: BattleEvent): void {
    assert(event.kind.length > 0, "an event handed to the clock states its kind");
    addTurnToClock(clock, getTurnOpener(event, clock.standing));
    if (event.kind === "turn-lost") addTurnToClock(clock, event.combatantId);
    clock.standing = composeTurnStanding(event, clock.standing);
}

/** One combatant's open run of the effect, kept while the corpus says it is still standing. */
interface HolytouchRun {
    turnsAtLighting: number;
    heals: number;
    healed: number;
    turnsAtLastHeal: number;
}

interface HolytouchMeasured {
    declarations: number;
    heals: number;
    healsZero: number;
    healed: number;
    healsWithNoDeclaration: number;
    healsPerRunClosed: [number, number][];
    healsPerRunOpenAtEnd: [number, number][];
    turnsSpannedByRun: [number, number][];
    healsInOneRunMaximum: number;
    turnsPublished: number;
}

interface LasthealMeasured {
    events: number;
    fights: number;
    combatants: number;
    healedLeast: number;
    healedMost: number;
    percentAfterLeast: number;
    percentAfterMost: number;
    twiceInOneFight: number;
}

/** A tally kept as pairs, because a sheet draws the distribution and not a mean. */
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
 * could not be taken is not the figure zero (**E10**), and a sheet would draw the substitute.
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

/** True where the blow declared the effect, which is the only statement that it was applied. */
function getHolytouchDeclared(event: BattleEvent): boolean {
    assert(event.kind.length > 0, "an event asked about states its kind");
    if (event.kind !== "attack") return false;
    return event.declared.some((declared) => declared.effect === HOLYTOUCH_PROC);
}

/**
 * What the effect does over the corpus, counted on each holder's own clock.
 *
 * ⚠️ **A second declaration closes the run before it.** Re-applying while the effect stands is
 * what shortens an observed run, so the two ways a run ends are counted apart: a run cut by a
 * later declaration says nothing about how long the effect lasts.
 */
function composeHolytouchMeasured(replays: readonly FightReplay[]): HolytouchMeasured {
    assert(replays.length > 0, "the effect is measured over something");
    const closed: number[] = [];
    const openAtEnd: number[] = [];
    const spans: number[] = [];
    let declarations = 0;
    let heals = 0;
    let healsZero = 0;
    let healed = 0;
    let healsWithNoDeclaration = 0;
    for (const replay of replays) {
        const clock = composeTurnClock();
        const runByCombatantId = new Map<number, HolytouchRun>();
        assert(replay.reading.events.length <= MAXIMUM_EVENTS, "a fight's events are bounded");
        for (const event of replay.reading.events) {
            setClockPastEvent(clock, event);
            if (getHolytouchDeclared(event)) {
                assert(event.kind === "attack", "only a blow declares the effect");
                if (event.actorId !== null) {
                    declarations += 1;
                    const before = runByCombatantId.get(event.actorId);
                    if (before !== undefined) {
                        closed.push(before.heals);
                        spans.push(before.turnsAtLastHeal - before.turnsAtLighting);
                    }
                    const turnsAtLighting = getTurnsTaken(clock, event.actorId);
                    runByCombatantId.set(event.actorId, {
                        turnsAtLighting,
                        heals: 0,
                        healed: 0,
                        turnsAtLastHeal: turnsAtLighting,
                    });
                }
            }
            if (event.kind !== "health-change") continue;
            if (event.source !== HOLYTOUCH_HEAL) continue;
            if (event.combatantId === null) continue;
            heals += 1;
            if (event.amount === 0) healsZero += 1;
            healed += event.amount;
            const run = runByCombatantId.get(event.combatantId);
            if (run === undefined) {
                healsWithNoDeclaration += 1;
                continue;
            }
            run.heals += 1;
            run.healed += event.amount;
            run.turnsAtLastHeal = getTurnsTaken(clock, event.combatantId);
        }
        for (const run of runByCombatantId.values()) {
            openAtEnd.push(run.heals);
            spans.push(run.turnsAtLastHeal - run.turnsAtLighting);
        }
    }
    const longest = [...closed, ...openAtEnd].reduce((most, one) => Math.max(most, one), 0);
    return {
        declarations,
        heals,
        healsZero,
        healed,
        healsWithNoDeclaration,
        healsPerRunClosed: composeTally(closed),
        healsPerRunOpenAtEnd: composeTally(openAtEnd),
        turnsSpannedByRun: composeTally(spans),
        healsInOneRunMaximum: longest,
        turnsPublished: HOLYTOUCH_TURNS_PUBLISHED,
    };
}

/**
 * The bonus that fires once. What the panel could say about it is the figure and where the
 * holder stood afterwards, both of which the value states: `amount,name(percent%)`.
 */
function composeLasthealMeasured(replays: readonly FightReplay[]): LasthealMeasured {
    assert(replays.length > 0, "the bonus is measured over something");
    const healedAmounts: number[] = [];
    const percentsAfter: number[] = [];
    const combatants = new Set<string>();
    let fights = 0;
    let twiceInOneFight = 0;
    for (const replay of replays) {
        let inThisFight = 0;
        const healedHere = new Set<number>();
        for (const event of replay.reading.events) {
            if (event.kind !== "healing-to-named-combatant") continue;
            if (event.source !== LASTHEAL) continue;
            inThisFight += 1;
            healedAmounts.push(event.amount);
            if (event.targetHealthPercent !== null) percentsAfter.push(event.targetHealthPercent);
            if (event.targetId !== null) {
                combatants.add(`${replay.name}/${event.targetId}`);
                if (healedHere.has(event.targetId)) twiceInOneFight += 1;
                healedHere.add(event.targetId);
            }
        }
        assert(inThisFight >= 0, "a fight carries no negative count of them");
        if (inThisFight > 0) fights += 1;
    }
    assert(healedAmounts.length > 0, "the corpus carries the bonus at all");
    const sortedHealed = [...healedAmounts].sort((one, other) => one - other);
    const sortedPercent = [...percentsAfter].sort((one, other) => one - other);
    return {
        events: healedAmounts.length,
        fights,
        combatants: combatants.size,
        healedLeast: getValueAt(sortedHealed, 0),
        healedMost: getMost(sortedHealed),
        percentAfterLeast: getValueAt(sortedPercent, 0),
        percentAfterMost: getMost(sortedPercent),
        twiceInOneFight,
    };
}

/** Who is standing under the effect, and who has already spent the bonus, after these events. */
interface LegendStanding {
    underHolytouch: Set<number>;
    spentLastheal: Set<number>;
}

/**
 * The two legendary rows as they would stand after one payload. Recomposed from the whole event
 * list per step, which is what `composeFightReplaySteps` does with the figures too: the longest
 * recording carries 111 payloads, so the square stays small.
 *
 * ⚠️ **The effect goes out on the holder's turns, not on the heals counted.** A run cut short by
 * a death would otherwise stand lit for the rest of the fight, and the row would outlive it.
 */
function composeLegendStanding(events: readonly BattleEvent[]): LegendStanding {
    assert(events.length <= MAXIMUM_EVENTS, "a standing is composed over a bounded list");
    const clock = composeTurnClock();
    const runByCombatantId = new Map<number, HolytouchRun>();
    const spentLastheal = new Set<number>();
    for (const event of events) {
        setClockPastEvent(clock, event);
        if (getHolytouchDeclared(event)) {
            assert(event.kind === "attack", "only a blow declares the effect");
            if (event.actorId !== null) {
                const turnsAtLighting = getTurnsTaken(clock, event.actorId);
                runByCombatantId.set(event.actorId, {
                    turnsAtLighting,
                    heals: 0,
                    healed: 0,
                    turnsAtLastHeal: turnsAtLighting,
                });
            }
        }
        if (event.kind === "health-change") {
            if (event.source === HOLYTOUCH_HEAL) {
                if (event.combatantId !== null) {
                    const run = runByCombatantId.get(event.combatantId);
                    if (run !== undefined) run.heals += 1;
                }
            }
        }
        if (event.kind === "healing-to-named-combatant") {
            if (event.source === LASTHEAL) {
                if (event.targetId !== null) spentLastheal.add(event.targetId);
            }
        }
    }
    const underHolytouch = new Set<number>();
    for (const [combatantId, run] of runByCombatantId) {
        assert(run.heals <= MAXIMUM_RUN_TURNS, "a run stays inside the turns a walk bounds it to");
        const elapsed = getTurnsTaken(clock, combatantId) - run.turnsAtLighting;
        assert(elapsed >= 0, "a clock never runs behind the turn the effect lit on");
        if (elapsed < HOLYTOUCH_TURNS_PUBLISHED) underHolytouch.add(combatantId);
    }
    return { underHolytouch, spentLastheal };
}

interface BlockMeasured {
    payloads: number;
    restatedCombatants: number;
    carriedRows: [number, number][];
    chargeRows: number;
    holytouchRows: number;
    lasthealRows: number;
    rowsInBlock: [number, number][];
    rowsHalf: number;
    rowsNineteenOfTwenty: number;
    rowsMaximum: number;
    saysNothing: number;
    lineTodayLongest: number;
}

/**
 * How tall the block stands, per fighter the payload restated — which is the only set anything
 * is written onto (`src/game/engine-warrior.ts`, `readStatedIdsFromPayload`).
 */
function composeBlockMeasured(fights: readonly RecordedFight[]): BlockMeasured {
    assert(fights.length > 0, "the block is measured over something");
    const carried: number[] = [];
    const rows: number[] = [];
    let payloads = 0;
    let restatedCombatants = 0;
    let chargeRows = 0;
    let holytouchRows = 0;
    let lasthealRows = 0;
    let saysNothing = 0;
    let lineTodayLongest = 0;
    for (const fight of fights) {
        const steps = composeFightReplaySteps(fight);
        assert(steps.length <= MAXIMUM_PAYLOADS, "a recording's payloads are bounded");
        for (const step of steps) {
            payloads += 1;
            const stated = readStatedIdsFromPayload(step.payload);
            const legend = composeLegendStanding(step.replay.reading.events);
            for (const combatantId of stated) {
                restatedCombatants += 1;
                const statuses = step.replay.reading.carriedStatuses.filter((one) =>
                    one.combatantId === combatantId
                );
                const hasCharge = step.replay.reading.chargedSkills.some((one) =>
                    one.combatantId === combatantId
                );
                const underHolytouch = legend.underHolytouch.has(combatantId);
                const spentLastheal = legend.spentLastheal.has(combatantId);
                if (hasCharge) chargeRows += 1;
                if (underHolytouch) holytouchRows += 1;
                if (spentLastheal) lasthealRows += 1;
                const inBlock = statuses.length + (hasCharge ? 1 : 0) +
                    (underHolytouch ? 1 : 0) + (spentLastheal ? 1 : 0);
                carried.push(statuses.length);
                rows.push(inBlock);
                if (inBlock === 0) saysNothing += 1;
                const line = composeCarriedTooltipLine(statuses, null);
                if (line !== null) lineTodayLongest = Math.max(lineTodayLongest, line.length);
            }
        }
    }
    const sorted = [...rows].sort((one, other) => one - other);
    return {
        payloads,
        restatedCombatants,
        carriedRows: composeTally(carried),
        chargeRows,
        holytouchRows,
        lasthealRows,
        rowsInBlock: composeTally(rows),
        rowsHalf: getShareAt(sorted, 0.5),
        rowsNineteenOfTwenty: getShareAt(sorted, 0.95),
        rowsMaximum: getMost(sorted),
        saysNothing,
        lineTodayLongest,
    };
}

/**
 * The nine statuses as a reader outside the panel meets them. ⚠️ **Asked without a dictionary**,
 * which is what the preview page hands the panel: no `_t` stands on it, so the key as the game
 * wrote it is the label, and a sheet drawing the client's word would be drawing a word nobody
 * measured.
 */
function composeBitsMeasured() {
    const said = FROZEN_BUFF_BITS.bits.map((_, bit) => getWordsForStatusBit(bit, null));
    assert(said.length === FROZEN_BUFF_BITS.bits.length, "every bit the table names is asked");
    const longest = said.reduce((most, one) => Math.max(most, one.length), 0);
    assert(longest > 0, "and a label has letters in it");
    return { gameBuild: FROZEN_BUFF_BITS.gameBuild, said, charactersLongest: longest };
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

function composeMeasured() {
    const recorded = composeRecordedMaterial([]);
    const replays = recorded.fights.map((fight) => composeFightReplay(fight));
    assert(replays.length === recorded.fights.length, "every recording read is one replayed");
    return {
        takenAt: new Date().toISOString().slice(0, "YYYY-MM-DD".length),
        material: `${recorded.material}, ${recorded.fights.length} recordings`,
        tokens: composeTokensMeasured(),
        bits: composeBitsMeasured(),
        holytouch: composeHolytouchMeasured(replays),
        lastheal: composeLasthealMeasured(replays),
        block: composeBlockMeasured(recorded.fights),
    };
}

if (import.meta.main) {
    const measured = composeMeasured();
    Deno.writeTextFileSync(MEASURED_FILE, `${JSON.stringify(measured, null, 4)}\n`);
    console.log(`${MEASURED_FILE} written over ${measured.material}`);
}
