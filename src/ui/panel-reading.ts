/**
 * What the panel is handed, and the three questions every part of it asks of a
 * combatant: which row, what are they called, how much for this metric.
 *
 * Below both the ranking and the drill, because both ask all three. Written as
 * one module rather than left in the composing and imported back out of it: the
 * drill was carved out of `panel-view.ts` and the two would otherwise import each
 * other, which is one module split down the middle rather than two modules.
 */

import { composeIntegerText } from "@/libs/number.ts";
import { setRunningTotal } from "@/libs/running-total.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import {
  composeEmptyCombatantStatistics,
  type CombatantStatistics,
  type FightStatistics,
} from "@/src/core/fight-statistics.ts";
import type { PanelMetric } from "@/src/ui/panel-screen.ts";

/**
 * What the panel is handed.
 *
 * Declared here rather than imported from `src/game/battle-session.ts`, where the
 * running add-on composes it. §9.1 lets `ui` depend on `core` and on `libs`, and
 * names no direction from `ui` to `game`; a type import is still a direction, and
 * it is the one that would make the panel unusable without an engine.
 *
 * `FightReading` satisfies this structurally, so the entry point — the one file
 * that may know both — keeps passing the same value through untouched.
 */
export type PanelReading = {
  statistics: FightStatistics;
  roster: CombatantRoster;
  /** Which side is the watcher's own, when the game said. Never guessed. */
  ourSide: number | null;
  isFromFightStart: boolean;
  /**
   * What the game handed over that never became part of the fight.
   *
   * Declared here rather than imported, the same way `ourSide` and
   * `isFromFightStart` are: the shape is `game`'s to produce and this file must
   * not learn that a game engine exists (§9.1). Structural typing is what lets
   * both be true.
   *
   * **Optional here and required there.** A caller with no engine — the offline
   * tools, every test of the panel — truthfully has nothing to say about it, and
   * saying nothing is not the same as saying zero. The producer cannot leave it
   * out, which is where forgetting it would matter.
   */
  engineReading?:
    | {
        /** Keyed by what was wrong; the keys are `game`'s vocabulary, not ours. */
        unreadablePayloadsByFault: ReadonlyMap<string, number>;
        lostMessages: number;
        unreadableCombatants: number;
      }
    | undefined;
};

/**
 * Built once rather than per call: `getRow` is asked three questions a row and
 * every ranking row asks them, and nothing here writes to a row.
 *
 * The twenty-three fields used to be spelled out here as well as in the two
 * places `src/core/fight-statistics.ts` spells them, which is one copy per layer
 * of a shape that grows a field at a time (§4). The aggregate owns it.
 */
const EMPTY_ROW: CombatantStatistics = composeEmptyCombatantStatistics();

export function getRow(reading: PanelReading, combatantId: number): CombatantStatistics {
  return reading.statistics.byCombatantId.get(combatantId) ?? EMPTY_ROW;
}

export function getName(reading: PanelReading, combatantId: number): string {
  return reading.roster.byId.get(combatantId)?.name ?? `#${composeIntegerText(combatantId)}`;
}

/**
 * What a combatant's figure is for this metric.
 *
 * **Taken is a blow plus health that fell on its own**, and the two are separate
 * in the aggregate for a reason that does not apply here: they differ by whether
 * anyone can be charged with them, and to the combatant losing the health that is
 * no difference at all. Measured on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`:
 * leaving the second out would show the boss 49 318 short, 13% of everything
 * that hit it.
 */
export function getMetricValue(row: CombatantStatistics, metric: PanelMetric): number {
  // And **dealt is a blow plus health taken off outside one**, which is the same
  // addition read from the other end: a wound charged to its attacker (§9.6) is
  // damage they did, and the aggregate keeps it apart from `dealtApplied` because
  // it is not a swing. Leaving it out would put the two ends of one figure on
  // different screens — the victim's `Otrzymane` counting it and the attacker's
  // `Zadane` not.
  if (metric === "dealt") return row.dealtApplied + row.healthLostCaused;
  if (metric === "taken") return row.taken + row.healthLost;
  if (metric === "healingGiven") return row.healingGiven;
  return row.healed;
}

/** Healing that arrived with no announcement over it, and so with no healer. */
export function getHealingWithoutHealer(row: CombatantStatistics): number {
  const named = [...row.healedByHealerId.values()].reduce((sum, one) => sum + one, 0);
  return Math.max(0, row.healed - named);
}

/**
 * A blow this combatant took whose striker nobody could name — the damage twin of
 * the healing above, and read the same way: what the row holds, less what it can
 * put a name to.
 *
 * ⚠️ **Not the same thing as `healthLost`, and adding them is the point.** Health
 * that fell outside a blow and a blow whose actor did not resolve are two ways for
 * damage to belong to nobody, and the pinned row counts both — so a cut of that row
 * by combatant has to as well, or it reports somebody's share as unplaceable while
 * their own row is holding it.
 *
 * The aggregate writes `takenByActorId` only where the actor resolved
 * (`src/core/fight-statistics.ts`), which is what makes the difference readable at
 * all. Zero on every capture, because every name in them resolves; a fight joined
 * in progress is where it is the whole figure.
 */
export function getDamageWithoutActor(row: CombatantStatistics): number {
  let named = 0;
  for (const byElement of row.takenByActorId.values()) {
    for (const amount of byElement.values()) named += amount;
  }
  return Math.max(0, row.taken - named);
}

/**
 * The same figure, kept apart by the element the game stated it under.
 *
 * The pinned row's `Z czego` cut used to read its elements off the fight-wide
 * bucket, which holds no combatant and therefore no side. Once the figure narrowed
 * to the side on screen the cut had to narrow with it, and this is the only place
 * the two ends meet: `takenByElement` is what a combatant took, `takenByActorId` is
 * the part of it somebody was named for, and the difference is what they took with
 * nobody to charge it to — per element, on their own row, where the roster can
 * place them.
 *
 * Read the same way `getDamageWithoutActor` is, and it sums to it, which is what
 * lets the cut close against the figure standing over it.
 */
export function getDamageWithoutActorByElement(row: CombatantStatistics): Map<string, number> {
  const named = new Map<string, number>();
  for (const byElement of row.takenByActorId.values()) {
    for (const [element, amount] of byElement) setRunningTotal(named, element, amount);
  }

  const without = new Map<string, number>();
  for (const [element, amount] of row.takenByElement) {
    const rest = amount - (named.get(element) ?? 0);
    if (rest > 0) without.set(element, rest);
  }
  return without;
}

/**
 * Health this combatant lost that nobody is charged with — the health-loss twin of
 * `getDamageWithoutActor`, and read the same way: what the row holds, less what it
 * can put a name to.
 *
 * ⚠️ **It was `row.healthLost` at four call sites until a wound acquired an
 * attacker.** Poison and fire still make up almost all of it — measured over
 * `tests/captured-fights/` as the set stood 2026-08-19, the charged part is 25 062
 * of it — so the pinned row goes on standing for something, and the difference is
 * exactly the part that now has a row of its own.
 */
export function getHealthLostWithoutActor(row: CombatantStatistics): number {
  let named = 0;
  for (const bySource of row.healthLostByActorId.values()) {
    for (const amount of bySource.values()) named += amount;
  }
  return Math.max(0, row.healthLost - named);
}

/** The same figure, kept apart by the key the game stated it under. */
export function getHealthLostWithoutActorBySource(
  row: CombatantStatistics,
): Map<string, number> {
  const named = new Map<string, number>();
  for (const bySource of row.healthLostByActorId.values()) {
    for (const [source, amount] of bySource) setRunningTotal(named, source, amount);
  }

  const without = new Map<string, number>();
  for (const [source, amount] of row.healthLostBySource) {
    const rest = amount - (named.get(source) ?? 0);
    if (rest > 0) without.set(source, rest);
  }
  return without;
}

/**
 * What this combatant took off others outside a blow, by the key that did it.
 *
 * A fold of their own row's map rather than a figure the aggregate keeps: the
 * total is already there as `healthLostCaused`, and this is the cut a breakdown
 * needs beside it. §9.1's line is about a statistic derived across *other* rows,
 * which this is not.
 */
export function getHealthLostCausedBySource(row: CombatantStatistics): Map<string, number> {
  const bySource = new Map<string, number>();
  for (const byTarget of row.healthLostCausedByTargetId.values()) {
    for (const [source, amount] of byTarget) setRunningTotal(bySource, source, amount);
  }
  return bySource;
}
