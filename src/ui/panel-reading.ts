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
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { CombatantStatistics, FightStatistics } from "@/src/core/fight-statistics.ts";
import type { PanelMetric } from "@/src/ui/panel-metric.ts";

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

const EMPTY_ROW: CombatantStatistics = {
  dealtRaw: 0,
  dealtApplied: 0,
  dealtAppliedByElement: new Map(),
  taken: 0,
  takenByElement: new Map(),
  healed: 0,
  healthLost: 0,
  prevented: new Map(),
  destroyed: new Map(),
  procsOnBlowsStruck: new Map(),
  skillsUsed: 0,
  blowsStruck: 0,
  largestBlow: 0,
  blowsWithoutSkill: 0,
  dealtByTargetId: new Map(),
  takenByActorId: new Map(),
  healthLostBySource: new Map(),
  healedBySource: new Map(),
  healedByHealerId: new Map(),
  healingGiven: 0,
  healingGivenByCombatantId: new Map(),
  skills: new Map(),
};

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
  if (metric === "dealt") return row.dealtApplied;
  if (metric === "taken") return row.taken + row.healthLost;
  if (metric === "healingGiven") return row.healingGiven;
  return row.healed;
}

/** Healing that arrived with no announcement over it, and so with no healer. */
export function getHealingWithoutHealer(row: CombatantStatistics): number {
  const named = [...row.healedByHealerId.values()].reduce((sum, one) => sum + one, 0);
  return Math.max(0, row.healed - named);
}
