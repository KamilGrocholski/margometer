/**
 * Who is fighting, read from the live game, and which side the player is on.
 *
 * `core` groups sides by their bare number and favours none, because a captured
 * fight does not record who recorded it (`src/core/combatant-roster.ts`). The
 * running game does know: it states `myteam` beside warriors carrying `team`.
 * So ours-and-theirs is decided **here and only here**, and no core type changes
 * to carry it.
 *
 * Everything is read defensively. This is someone else's object graph, reached
 * across a page context that can be torn down mid-read, so a shape we did not
 * expect produces `null` rather than an exception — and never a default that
 * would look like a measurement (§9.5).
 */

import { getIntegerFromValue } from "@/libs/number.ts";
import {
  composeCombatantRoster,
  type CombatantRoster,
  type RosteredCombatant,
} from "@/src/core/combatant-roster.ts";

/** What a fight's roster is, plus the one thing only the game can tell us. */
export type BattleRoster = {
  roster: CombatantRoster;
  /**
   * The side the player belongs to, or null when the game did not say.
   *
   * Null is a real state rather than a defect: read after the game has tidied up
   * at the end of a fight, `myteam` is simply gone. Guessing it would put every
   * row under the wrong heading, which is worse than showing sides unlabelled.
   */
  ourSide: number | null;
};

function getRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

/**
 * One warrior, or null if the entry does not carry what a row needs.
 *
 * A combatant without an id cannot be joined to anything the protocol says, and
 * one without a side cannot be grouped — so a partial entry is dropped rather
 * than filled in. The count of what was dropped is the caller's business.
 */
export function composeRosteredCombatant(value: unknown): RosteredCombatant | null {
  const warrior = getRecord(value);
  if (warrior === null) return null;

  const id = getIntegerFromValue(warrior["id"]);
  const side = getIntegerFromValue(warrior["team"]);
  const name = warrior["name"];
  if (id === null || side === null || typeof name !== "string" || name === "") return null;

  return { id, name, side };
}

/**
 * The warriors a battle payload or a battle object states, under `w`.
 *
 * The game keys them by id, so this reads values rather than assuming an array —
 * and reads the id from the entry itself rather than from the key, because the
 * entry is what the rest of the client uses.
 */
export function composeCombatantsFromBattle(battle: unknown): RosteredCombatant[] {
  const record = getRecord(battle);
  const warriors = getRecord(record?.["w"]);
  if (warriors === null) return [];

  const combatants: RosteredCombatant[] = [];
  for (const value of Object.values(warriors)) {
    const combatant = composeRosteredCombatant(value);
    if (combatant !== null) combatants.push(combatant);
  }
  return combatants;
}

/** The player's own side, as the game states it, or null when it does not. */
export function getOurSideFromBattle(battle: unknown): number | null {
  return getIntegerFromValue(getRecord(battle)?.["myteam"]);
}

/**
 * Merges a fresh snapshot into what is already known.
 *
 * **An empty snapshot takes nothing away, and this is the whole reason the
 * function exists.** Measured on the captured material: both fights contain a
 * call whose warrior list is empty, and the game can tidy its state before the
 * message that closes the fight. A roster that vanishes takes every name
 * resolution with it — and damage the protocol states against a name reaches a
 * row only through a name.
 *
 * First-seen order is kept: a later snapshot updates an entry in place rather
 * than moving it to the end.
 */
export function composeMergedCombatants(
  known: readonly RosteredCombatant[],
  snapshot: readonly RosteredCombatant[],
): RosteredCombatant[] {
  const byId = new Map(known.map((combatant) => [combatant.id, combatant]));
  for (const combatant of snapshot) byId.set(combatant.id, combatant);
  return [...byId.values()];
}

/**
 * The roster `core` consumes, built from what the game currently holds.
 *
 * `ourSide` travels beside it rather than inside `RosteredCombatant`: it is one
 * fact about the fight, not a property of each combatant, and putting it on every
 * row would invite eleven copies that can disagree.
 */
export function composeBattleRoster(combatants: readonly RosteredCombatant[], ourSide: number | null): BattleRoster {
  return { roster: composeCombatantRoster(combatants), ourSide };
}
