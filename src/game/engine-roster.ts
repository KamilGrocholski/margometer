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
import { getRecordOrArrayFromValue } from "@/libs/record.ts";
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

/**
 * One warrior, or null if the entry does not carry what a row needs.
 *
 * A combatant without an id cannot be joined to anything the protocol says, and
 * one without a side cannot be grouped — so a partial entry is dropped rather
 * than filled in. The count of what was dropped is the caller's business, and
 * `composeRosterFragmentFromBattle` is the caller that keeps it; for the life of
 * this file that sentence said the same thing and nobody counted anything.
 *
 * ⚠️ **The side is read as a number and not as text, unlike `isFightStart`.**
 * That asymmetry is deliberate and was undocumented until it was worth stating:
 * `init` is read from both spellings because the captures state `"1"` and the
 * client compares with `==`, so mirroring its looseness is a reading of measured
 * behaviour. Here the opposite is measured — `id`, `team` and `lvl` arrive as
 * numbers in 1 794 of 1 794 captured entries — so accepting text would be
 * widening a reader past its evidence. What was actually wrong is that a
 * `team: "1"` vanished in silence; it is still refused, and now it is counted, so
 * the day the game changes its mind the counter is the evidence that makes
 * loosening this a decision rather than a guess.
 */
export function composeRosteredCombatant(value: unknown): RosteredCombatant | null {
  const warrior = getRecordOrArrayFromValue(value);
  if (warrior === null) return null;

  const id = getIntegerFromValue(warrior["id"]);
  const side = getIntegerFromValue(warrior["team"]);
  const name = warrior["name"];
  if (id === null || side === null || typeof name !== "string" || name === "") return null;

  // Absent rather than defaulted: a combatant whose profession the game did not
  // state must not be drawn as though it had one.
  const stated = warrior["prof"];
  const profession = typeof stated === "string" && stated !== "" ? stated : null;

  return { id, name, side, profession, level: getIntegerFromValue(warrior["lvl"]) };
}

/**
 * The fields an entry states when it is describing a person rather than a change
 * to one.
 *
 * ⚠️ **This is what makes "unreadable" a sound thing to count.** Nearly every
 * entry under `w` is refused, and almost all of those refusals are correct: the
 * list is a delta, so most entries carry an id and a health figure and nothing
 * else. Measured over the 8 captures — 1 794 entries in 389 payloads — **63
 * state all four of these, 1 731 state none, and none states some**. That the
 * split is perfectly bimodal is the whole licence for this definition; a counter
 * that counted every refusal would report ~1 700 phantom drops per fight, and a
 * warning that is wrong 1 731 times out of 1 794 is one nobody will read twice.
 */
const IDENTITY_FIELDS = ["name", "team", "prof", "lvl"] as const;

/** Whether the entry is describing somebody, and so ought to be readable. */
function hasStatedCombatant(value: unknown): boolean {
  const entry = getRecordOrArrayFromValue(value);
  if (entry === null) return false;
  return IDENTITY_FIELDS.some((field) => entry[field] !== undefined);
}

export type RosterFragment = {
  combatants: RosteredCombatant[];
  /**
   * Entries that named somebody and still could not be read.
   *
   * Zero in all 1 794 captured entries, which is the point: the day the game
   * renames one of the fields a row needs, this stops being zero instead of the
   * roster quietly getting smaller. A combatant who drops out does not merely go
   * missing from the list — damage stated against their name resolves to nobody
   * and lands in the pile the panel cannot charge anyone with, so a silent drop
   * moves real figures rather than only hiding a name.
   */
  unreadableEntries: number;
};

/**
 * The warriors a battle payload or a battle object states, under `w`.
 *
 * The game keys them by id, so this reads values rather than assuming an array —
 * and reads the id from the entry itself rather than from the key, because the
 * entry is what the rest of the client uses.
 */
export function composeRosterFragmentFromBattle(battle: unknown): RosterFragment {
  const record = getRecordOrArrayFromValue(battle);
  const warriors = getRecordOrArrayFromValue(record?.["w"]);
  if (warriors === null) return { combatants: [], unreadableEntries: 0 };

  const combatants: RosteredCombatant[] = [];
  let unreadableEntries = 0;
  for (const value of Object.values(warriors)) {
    const combatant = composeRosteredCombatant(value);
    if (combatant !== null) combatants.push(combatant);
    else if (hasStatedCombatant(value)) unreadableEntries += 1;
  }
  return { combatants, unreadableEntries };
}

/** The player's own side, as the game states it, or null when it does not. */
export function getOurSideFromBattle(battle: unknown): number | null {
  return getIntegerFromValue(getRecordOrArrayFromValue(battle)?.["myteam"]);
}

/**
 * Merges a fresh snapshot into what is already known.
 *
 * **An empty snapshot takes nothing away, and this is the whole reason the
 * function exists.** Measured on the captured material: every capture contains a
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
): readonly RosteredCombatant[] {
  const byId = new Map(known.map((combatant) => [combatant.id, combatant]));
  for (const combatant of snapshot) byId.set(combatant.id, combatant);
  const merged = [...byId.values()];

  /**
   * The same list back when the fragment said nothing new.
   *
   * ⚠️ **Identity is a promise the caller leans on**, not an optimisation kept
   * here for its own sake: the session decides whether a payload changed
   * anything by comparing this against what it held, and skips reading the fight
   * again when it did not. Comparing counts instead let a *renamed* combatant
   * through as "nothing happened" — the roster keeps its size when a fragment
   * corrects a name, and `battle-session.test.ts` caught exactly that.
   */
  const unchanged =
    merged.length === known.length &&
    merged.every((combatant, index) => {
      const before = known[index];
      return (
        before !== undefined &&
        before.id === combatant.id &&
        before.name === combatant.name &&
        before.side === combatant.side &&
        before.profession === combatant.profession &&
        before.level === combatant.level
      );
    });
  return unchanged ? known : merged;
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
