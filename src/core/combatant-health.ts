/**
 * The health a combatant holds through a fight, and what a share stated about a
 * whole side restores to each of them.
 *
 * The protocol never states a figure for a team heal. It states a **share**, and
 * names only the caster (`docs/protocol-keys.md`, `healall_per`). Turning that
 * into health needs three figures the protocol does not carry — each combatant's
 * maximum, the health they entered the fight with, and the health they hold at
 * the moment — and this is where the two that can be derived are derived and the
 * third is asked for.
 *
 * ⚠️ **Every input is refused rather than defaulted.** A share applied against a
 * maximum we guessed, or capped against an entry health we assumed, produces a
 * figure that is too high — and too high is the one direction the panel cannot
 * mark, because nothing downstream would know it had happened (§9.6). So a
 * combatant missing any input is left out of the cast, and the cast stays counted
 * as unaccounted for.
 */

import { setRunningTotal } from "@/libs/running-total.ts";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { SIDE_SHARE_HEALTH_KEYS } from "@/src/core/fight-decoder.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";

/**
 * What each combatant entered the fight holding — the ceiling restored health
 * cannot pass, which the help states of restored health generally rather than of
 * one skill (`docs/protocol-keys.md`).
 *
 * ⚠️ **Maximum health is deliberately not here.** The roster already carries it
 * and is already handed to every reader below, so a second copy would be one more
 * place for the same fact to be stated differently (§9.3). This is the one figure
 * nothing else holds: it is a property of a *moment* — the fight's first — and
 * the roster is a property of the fight.
 */
export type FightEntryHealth = ReadonlyMap<number, number>;

/**
 * A fight nothing could be read for: joined in progress, or opened by a payload
 * whose own messages cannot be unwound.
 *
 * The default every caller gets, so a reader that knows none of this degrades to
 * the behaviour that predates it rather than to a wrong number.
 */
export const NO_ENTRY_HEALTH: FightEntryHealth = new Map();

/**
 * The effect the help says reduces this healing, by the name it would arrive
 * under.
 *
 * Never decoded — no recording carries it, and reading a shape this repository
 * has never met would be describing a message we have never seen (§5). It is
 * named here for its **absence**: the client composes it into the battle log with
 * a figure in it (production build `1786514810315`), so a fight that never
 * mentions it is a fight where the reduction was not applied. That is what turns
 * *not observed* into *not in play*, and without it no cast could be sized at all.
 */
const HEALING_REDUCER_KEY = "lowheal_per-enemies";

/** The protocol states health to two places, so a stated share is this wide. */
const STATED_PERCENT_TOLERANCE = 0.005;

/** What the protocol's stated share of a maximum comes to, in health points. */
function getHealthFromStatedPercent(percent: number, maximumHealth: number): number {
  return Math.round((percent / 100) * maximumHealth);
}

/**
 * Whether a running total is still consistent with the health the protocol
 * states.
 *
 * ⚠️ **The stated percentage is a bound, not a value, and the difference is
 * measured.** Two places against a pool in the tens of thousands quantises to
 * about a point and a half, and that lands squarely on the cap term. Overwriting
 * the exact running total with the rounded figure every time one is stated puts 8
 * of 110 readings a point wrong; keeping the total wherever the protocol does not
 * contradict it puts none wrong.
 *
 * ⚠️ **The recordings do not exercise the correction, only the restraint.**
 * Removing the resync entirely reproduces every one of those readings too, across
 * the seventeen recordings held on 2026-08-19: every health movement in them is
 * one the decoder reads, so nothing has ever drifted. What this holds is the case
 * that material has not produced and the witness exists to catch: health that
 * moved for a reason we could not read. A running total has
 * no way to notice that on its own, and the cap is taken against it. Held by a
 * hand-built fight in `tests/core/combatant-health.test.ts` rather than by the
 * captures, which is stated here so the next person does not go looking for the
 * recording that justifies it.
 */
function isWithinStatedHealth(
  currentHealth: number,
  percent: number,
  maximumHealth: number,
): boolean {
  const lowest = ((percent - STATED_PERCENT_TOLERANCE) / 100) * maximumHealth;
  const highest = ((percent + STATED_PERCENT_TOLERANCE) / 100) * maximumHealth;
  return currentHealth >= lowest && currentHealth <= highest;
}

/**
 * What one side-mate gets: the floored share of their maximum, capped by the room
 * between where they stand and where they started.
 *
 * Both halves are measured on every capture that carries the key, and neither is
 * optional — dropping the cap reports 81% more healing than happened
 * (`tests/core/team-heal-rule.test.ts`).
 */
function getRestoredHealth(
  declaredShare: number,
  maximumHealth: number,
  entryHealth: number,
  currentHealth: number,
): number {
  // A combatant at zero is reached by the cast and restored nothing — measured,
  // and stated here because the cap alone would not say it: somebody who died at
  // full health has room below their entry figure and still gains nothing.
  if (currentHealth <= 0) return 0;
  return Math.min(
    Math.floor((declaredShare / 100) * maximumHealth),
    Math.max(0, entryHealth - currentHealth),
  );
}

/**
 * How one event moves health, and what health it states.
 *
 * One reader for both, because both walks below need both and they must agree
 * about which end of a message an event belongs to. A movement is what we decoded;
 * a statement is what the protocol says the combatant holds **after** it — the
 * client applies the percentages before it looks at a single key
 * (`docs/protocol-keys.md`), so a statement is read after its own event's movement
 * and never before.
 */
function getHealthReadingOfEvent(event: BattleEvent): {
  movements: readonly (readonly [number, number])[];
  statements: readonly (readonly [number, number])[];
} {
  switch (event.kind) {
    case "attack": {
      const taken = event.taken.reduce((total, damage) => total + damage.amount, 0);
      return {
        movements: event.targetId === null ? [] : [[event.targetId, -taken]],
        statements: [
          ...(event.actorId === null || event.actorHealthPercent === null
            ? []
            : [[event.actorId, event.actorHealthPercent] as const]),
          ...(event.targetId === null || event.targetHealthPercent === null
            ? []
            : [[event.targetId, event.targetHealthPercent] as const]),
        ],
      };
    }
    case "damage-to-named-combatant": {
      if (event.targetId === null) return { movements: [], statements: [] };
      return {
        movements: [[event.targetId, -event.damage.amount]],
        statements:
          event.targetHealthPercent === null ? [] : [[event.targetId, event.targetHealthPercent]],
      };
    }
    case "healing-to-named-combatant": {
      if (event.targetId === null) return { movements: [], statements: [] };
      return {
        movements: [[event.targetId, event.amount]],
        statements:
          event.targetHealthPercent === null ? [] : [[event.targetId, event.targetHealthPercent]],
      };
    }
    case "health-change": {
      if (event.combatantId === null) return { movements: [], statements: [] };
      return {
        movements: [[event.combatantId, event.amount]],
        statements: event.healthPercent === null ? [] : [[event.combatantId, event.healthPercent]],
      };
    }
    case "team-heal": {
      return { movements: [...event.restoredByCombatantId], statements: [] };
    }
    /**
     * Neither of these moves health, and both state it. They are here because the
     * *earliest* thing a fight says about a combatant is very often an
     * announcement or a `step`, and that is exactly what an entry health is
     * unwound from.
     */
    case "skill-used": {
      return {
        movements: [],
        statements: [
          ...(event.actorId === null || event.actorHealthPercent === null
            ? []
            : [[event.actorId, event.actorHealthPercent] as const]),
          ...(event.targetId === null || event.targetHealthPercent === null
            ? []
            : [[event.targetId, event.targetHealthPercent] as const]),
        ],
      };
    }
    case "declaration": {
      return {
        movements: [],
        statements:
          event.combatantId === null || event.healthPercent === null
            ? []
            : [[event.combatantId, event.healthPercent]],
      };
    }
    default:
      return { movements: [], statements: [] };
  }
}

function hasUnsizedHealth(event: BattleEvent): boolean {
  return event.kind === "unaccounted-health";
}

/**
 * What each combatant entered the fight holding, unwound from the first thing the
 * fight said about them.
 *
 * ⚠️ **The health first seen is not the health entered with.** The payload that
 * opens a fight carries that payload's own messages, and anything it states — a
 * snapshot or a percentage inside a message — is the state *after* them. So every
 * reading is unwound: `entry = stated − everything decoded up to that point`.
 *
 * ⚠️ **And the snapshot is not the earliest thing the fight says.** This began by
 * unwinding the snapshot alone, and refused two captures outright — the ones whose
 * opening payload carries 354 and 297 messages with no snapshot beside them, so
 * the first snapshot sits *after* eight casts nothing could size. The messages in
 * that opening state health percentages of their own, and in both captures every
 * one of the eleven combatants is stated before the first cast. So the anchor is
 * **the first statement about each combatant**, whichever kind it is, and the
 * snapshot is the fallback for anyone the messages never name.
 *
 * Refusals, each of them a health nobody could have held:
 *
 *   - a combatant whose first statement comes **after** a figure we cannot size —
 *     an unwind cannot pass through health it does not have, and a team heal in
 *     the opening is exactly that;
 *   - a combatant with no maximum, or one unwound above it, or to nothing at all.
 *
 * A refusal is per combatant and final: a reading that contradicts itself is not
 * retried against the next statement, because the contradiction says the unwind is
 * wrong rather than that the statement was.
 */
export function composeEntryHealthByCombatantId(
  statedHealthByCombatantId: ReadonlyMap<number, number>,
  maximumHealthByCombatantId: ReadonlyMap<number, number>,
  events: readonly BattleEvent[],
): Map<number, number> {
  const movedSoFar = new Map<number, number>();
  /** What the first statement about each combatant unwinds to, before checking. */
  const fromFirstStatement = new Map<number, number>();
  let hasPassedUnsizedHealth = false;

  for (const event of events) {
    if (hasUnsizedHealth(event)) {
      hasPassedUnsizedHealth = true;
      continue;
    }
    const { movements, statements } = getHealthReadingOfEvent(event);
    for (const [combatantId, amount] of movements) {
      setRunningTotal(movedSoFar, combatantId, amount);
    }
    // Nothing is recorded once a figure we cannot size has gone past: from there
    // on, every statement is about a health this reader cannot account for.
    if (hasPassedUnsizedHealth) continue;
    for (const [combatantId, percent] of statements) {
      if (fromFirstStatement.has(combatantId)) continue;
      // A combatant the game has clamped to zero says where they are and not how
      // much reached them, so the unwind cannot start from one (§9.3).
      if (percent <= 0) continue;
      const maximumHealth = maximumHealthByCombatantId.get(combatantId);
      if (maximumHealth === undefined) continue;
      fromFirstStatement.set(
        combatantId,
        getHealthFromStatedPercent(percent, maximumHealth) - (movedSoFar.get(combatantId) ?? 0),
      );
    }
  }

  const entry = new Map<number, number>();
  const combatantIds = new Set([...statedHealthByCombatantId.keys(), ...fromFirstStatement.keys()]);
  for (const combatantId of combatantIds) {
    /**
     * ⚠️ **The snapshot wins wherever it can be used, and the order is measured.**
     * It states whole health; a percentage states two decimal places of a pool in
     * the tens of thousands, which quantises to about a point and a half. Reading
     * the percentage in preference put three of 110 readings a point wrong — the
     * error lands on the cap, exactly as it does in the resync. The statement is a
     * rescue for the case the snapshot cannot answer, never an improvement on it.
     */
    const fromSnapshot = hasPassedUnsizedHealth
      ? undefined
      : statedHealthByCombatantId.get(combatantId);
    const entryHealth =
      fromSnapshot === undefined
        ? fromFirstStatement.get(combatantId)
        : fromSnapshot - (movedSoFar.get(combatantId) ?? 0);
    if (entryHealth === undefined) continue;

    const maximumHealth = maximumHealthByCombatantId.get(combatantId);
    if (maximumHealth === undefined) continue;
    if (entryHealth <= 0 || entryHealth > maximumHealth) continue;
    entry.set(combatantId, entryHealth);
  }
  return entry;
}

/** Everyone the roster puts on this combatant's side, the combatant included. */
function getSideByCombatantId(roster: CombatantRoster, casterId: number): number[] {
  const caster = roster.byId.get(casterId);
  if (caster === undefined) return [];
  return [...roster.byId.values()]
    .filter((combatant) => combatant.side === caster.side)
    .map((combatant) => combatant.id);
}

/** One cast, sized as far as the inputs reach. */
type Cast = {
  restoredByCombatantId: Map<number, number>;
  /** Whether every member of the caster's side could be sized. */
  isWhole: boolean;
};

function composeCast(
  casterId: number,
  declaredShare: number,
  roster: CombatantRoster,
  entryHealthByCombatantId: FightEntryHealth,
  currentByCombatantId: ReadonlyMap<number, number>,
): Cast | null {
  const side = getSideByCombatantId(roster, casterId);
  if (side.length === 0) return null;

  /**
   * The clause the help states and no recording can reach: the effect is half as
   * strong where the caster has no allies in the fight. Every capture carrying
   * this key is a group fight, so the halving is never observed — which is
   * exactly why it is refused rather than applied. A standing side-mate other
   * than the caster is the one reading of "allies" that cannot be too generous.
   */
  const hasStandingAlly = side.some(
    (combatantId) => combatantId !== casterId && (currentByCombatantId.get(combatantId) ?? 0) > 0,
  );
  if (!hasStandingAlly) return null;

  const restoredByCombatantId = new Map<number, number>();
  let isWhole = true;
  for (const combatantId of side) {
    const maximumHealth = roster.byId.get(combatantId)?.maximumHealth ?? null;
    const entryHealth = entryHealthByCombatantId.get(combatantId);
    const currentHealth = currentByCombatantId.get(combatantId);
    if (maximumHealth === null || entryHealth === undefined || currentHealth === undefined) {
      isWhole = false;
      continue;
    }
    restoredByCombatantId.set(
      combatantId,
      getRestoredHealth(declaredShare, maximumHealth, entryHealth, currentHealth),
    );
  }
  if (restoredByCombatantId.size === 0) return null;
  return { restoredByCombatantId, isWhole };
}

/**
 * The fight's events with every team heal this meter can size turned into a
 * figure, and every one it cannot left exactly as it was.
 *
 * Walked in message order with a running health total per combatant, because the
 * cap needs to know where somebody stands and nothing else in the pipeline keeps
 * that. The total is seeded from the entry health, moved by every event the
 * decoder read, and **checked** against the health the protocol restates each
 * time it names a combatant — see `isWithinStatedHealth` for why that is a check
 * and not an assignment.
 *
 * ⚠️ **A sized cast does not always replace the event it came from.** Where a
 * member of the side could not be sized, the `unaccounted-health` event stays
 * beside the `team-heal`, so the reading downstream still counts this fight as
 * having healing it could not place (§9.6). Only a cast whose whole side was
 * sized takes its unaccounted event's place.
 */
export function composeSizedTeamHeals(
  events: readonly BattleEvent[],
  roster: CombatantRoster | null,
  entryHealthByCombatantId: FightEntryHealth,
): BattleEvent[] {
  /**
   * One occurrence anywhere in the fight disqualifies every cast in it, rather
   * than the casts after it. The help does not say whether the protocol
   * pre-applies this reduction the way it demonstrably pre-applies the weakening,
   * so the shares stated in such a fight cannot be trusted in either direction.
   */
  const isReduced = events.some(
    (event) => event.kind === "unknown-message" && event.unreadKeys.includes(HEALING_REDUCER_KEY),
  );
  if (roster === null || isReduced) return [...events];

  // Bound after the guard so the narrowing survives into the closure below.
  const known = roster;

  const currentByCombatantId = new Map(entryHealthByCombatantId);
  const sized: BattleEvent[] = [];

  function setStatedHealth(combatantId: number, percent: number): void {
    // A combatant the protocol states at nothing has been clamped by the game, and
    // the clamp hides whatever overkill went past it — so it says where they are
    // and not how much reached them. Never a resync (§9.3: unknown is not zero).
    if (percent <= 0) return;
    const maximumHealth = known.byId.get(combatantId)?.maximumHealth ?? null;
    if (maximumHealth === null) return;
    const currentHealth = currentByCombatantId.get(combatantId);
    if (currentHealth !== undefined && isWithinStatedHealth(currentHealth, percent, maximumHealth)) {
      return;
    }
    currentByCombatantId.set(combatantId, getHealthFromStatedPercent(percent, maximumHealth));
  }

  for (const event of events) {
    const casterId = event.kind === "unaccounted-health" ? event.combatantId : null;
    const declaredShare = event.kind === "unaccounted-health" ? event.declaredShare : null;
    if (
      event.kind === "unaccounted-health" &&
      SIDE_SHARE_HEALTH_KEYS.includes(event.source) &&
      casterId !== null &&
      declaredShare !== null
    ) {
      const cast = composeCast(
        casterId,
        declaredShare,
        known,
        entryHealthByCombatantId,
        currentByCombatantId,
      );
      if (cast === null) {
        sized.push(event);
        continue;
      }

      // The unaccounted event stays where the answer is partial, so the reading
      // downstream cannot mistake some of a cast for all of it.
      if (!cast.isWhole) sized.push(event);
      sized.push({
        kind: "team-heal",
        casterId,
        source: event.source,
        declaredShare,
        restoredByCombatantId: cast.restoredByCombatantId,
        announced: event.announced,
      });
      for (const [combatantId, restored] of cast.restoredByCombatantId) {
        setRunningTotal(currentByCombatantId, combatantId, restored);
      }
      continue;
    }

    sized.push(event);
    const { movements, statements } = getHealthReadingOfEvent(event);
    for (const [combatantId, amount] of movements) {
      setRunningTotal(currentByCombatantId, combatantId, amount);
    }
    for (const [combatantId, percent] of statements) setStatedHealth(combatantId, percent);
  }

  return sized;
}
