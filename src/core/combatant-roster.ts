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
 * The roster carries what something reads. Maximum health sits in the same
 * material and is deliberately absent: it joins when a consumer arrives, not
 * before (AGENTS.md §7.1). `side` joined when the aggregate needed to group
 * rows, and `level` when the panel's own detail line did.
 */

/** Ids the roster could not tell apart by name. */
const AMBIGUOUS = null;

export type RosteredCombatant = {
  id: number;
  name: string;
  /**
   * The team the game states, as a bare number.
   *
   * **Not "ours" or "theirs".** Which side the person watching belongs to is not
   * in this material — a captured fight does not record who recorded it — and it
   * is not in the protocol either. Only the game layer can say, because only it
   * can ask the client who the local player is. Until something hands that in,
   * two sides are two sides and neither is favoured.
   *
   * Measured on both captures: every combatant keeps the same team for the whole
   * fight, so this is a property of the roster rather than of a moment in it.
   */
  side: number;
  /**
   * The game's own one-letter profession code, or null where it said none.
   *
   * Carried for the panel, which colours a bar by profession rather than by
   * identity: two mages get one colour on purpose, because the question a colour
   * answers is "who is what", and who-is-who is the name beside it. Null is a
   * real answer — an unrecognised code must not borrow another profession's
   * colour.
   */
  profession: string | null;
  /**
   * The level the game states, or null where it stated none.
   *
   * Read for one line of the panel and no figure: it stands beside the
   * profession, because "mag" says what somebody is and "mag (105)" says how much
   * of it. Nothing divides by it and nothing ranks by it.
   */
  level: number | null;
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

  // Ambiguity is two combatants, not two entries. The same person listed twice —
  // which every caller today prevents by deduplicating on id first, and none of
  // them says so — used to make that person's own name resolve to nobody, so
  // every figure the protocol stated against it went unattributed.
  for (const combatant of combatants) {
    byId.set(combatant.id, combatant);
    const stated = idByName.get(combatant.name);
    const isSamePerson = stated === combatant.id;
    idByName.set(
      combatant.name,
      !idByName.has(combatant.name) || isSamePerson ? combatant.id : AMBIGUOUS,
    );
  }

  return { byId, idByName };
}

/** The id that name belongs to, or null when the roster cannot say which. */
export function getCombatantIdByName(roster: CombatantRoster, name: string): number | null {
  return roster.idByName.get(name) ?? null;
}
