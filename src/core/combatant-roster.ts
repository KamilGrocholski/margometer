/**
 * Who is in the fight, so that a combatant the protocol names can be matched to
 * the combatant it means.
 *
 * The protocol identifies people two ways and never reconciles them itself: by
 * id in the side segments of every message, and by name inside a handful of key
 * values. Damage stated against a name is real damage, and without this it
 * either goes to nobody or goes to a guess.
 *
 * **Names are not unique.** One captured fight fields two combatants called the
 * same thing. An ambiguous name resolves to nothing rather than to the first
 * match, because attributing real damage to the wrong combatant is the failure
 * this project exists to prevent, and it is worse than attributing it to no one.
 *
 * The roster carries what something reads. Team, level, profession and maximum
 * health all sit in the same material and are all deliberately absent: they join
 * when a consumer arrives, not before (AGENTS.md §7.1).
 */

/** Ids the roster could not tell apart by name. */
const AMBIGUOUS = null;

export type RosteredCombatant = {
  id: number;
  name: string;
};

export type CombatantRoster = {
  byId: ReadonlyMap<number, RosteredCombatant>;
  /** Null where more than one combatant answers to the name. */
  idByName: ReadonlyMap<string, number | null>;
};

export function composeCombatantRoster(
  combatants: readonly RosteredCombatant[],
): CombatantRoster {
  const byId = new Map<number, RosteredCombatant>();
  const idByName = new Map<string, number | null>();

  for (const combatant of combatants) {
    byId.set(combatant.id, combatant);
    idByName.set(combatant.name, idByName.has(combatant.name) ? AMBIGUOUS : combatant.id);
  }

  return { byId, idByName };
}

/** The id that name belongs to, or null when the roster cannot say which. */
export function getCombatantIdByName(roster: CombatantRoster, name: string): number | null {
  return roster.idByName.get(name) ?? null;
}
