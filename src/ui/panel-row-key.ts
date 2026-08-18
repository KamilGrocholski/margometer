/**
 * The key a drawn row carries, composed and read in one place.
 *
 * **It was a convention three files held separately.** `panel-view.ts` composed
 * the keys, `panel-element.ts` invented one more of its own for the breadcrumb,
 * and `panel-state.ts` took them apart by comparing prefixes — three files
 * agreeing on a grammar that nothing stated, which is the "decision nobody made"
 * §7.7 names (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F17).
 *
 * The cost was already on record before the finding: `composeStateFromRow`
 * documents a bug that came from mis-slicing one of these keys, and a test holds
 * the reducer against it — so what was guarded was one parser's handling of the
 * grammar, never the grammar itself.
 *
 * ⚠️ **A skill's key can contain a colon, and that is the whole difficulty.** It
 * is the game's identifier where the message stated one and the skill's **name**
 * where it did not, so it carries whatever the game wrote. The owner is split off
 * the front and everything after the first divider is taken whole. Without that,
 * `78` slices to the owner id `7` — a row that quietly opens somebody else's
 * figures, which is the defect this shape exists to end.
 */

import { composeIntegerText, getIntegerFromText } from "@/libs/number.ts";

/** The rows that are one word, because they open nothing and identify nothing. */
export const BACK_ROW_KEY = "back";
export const NOBODY_ROW_KEY = "nobody";
export const UNANNOUNCED_ROW_KEY = "unannounced";

const COMBATANT = "combatant";
const TARGET = "target";
const SKILL = "skill";
/** The deepest rows, which are read for nothing: a leaf opens no further level. */
const LEAF = "leaf";
const DIVIDER = ":";

export function composeCombatantRowKey(combatantId: number): string {
  return `${COMBATANT}${DIVIDER}${composeIntegerText(combatantId)}`;
}

export function composeTargetRowKey(combatantId: number): string {
  return `${TARGET}${DIVIDER}${composeIntegerText(combatantId)}`;
}

export function composeSkillRowKey(ownerId: number, key: string): string {
  return `${SKILL}${DIVIDER}${composeIntegerText(ownerId)}${DIVIDER}${key}`;
}

/** A row at the bottom of the drill, keyed by whatever names it. */
export function composeLeafRowKey(token: string): string {
  return `${LEAF}${DIVIDER}${token}`;
}

/**
 * A leaf naming a skill.
 *
 * The namespace is what keeps it apart from the other two kinds of leaf token —
 * a combatant id and a damage type — which share the level with it. A skill is
 * called whatever the game called it, so nothing rules out one named for a
 * number.
 *
 * Here rather than at the call site, which composed `skill:` by hand: this
 * module exists so that the divider and the word either side of it are decided
 * in one place, and a caller reproducing them is that design coming apart
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 */
export function composeSkillLeafRowKey(skillName: string): string {
  return composeLeafRowKey(`${SKILL}${DIVIDER}${skillName}`);
}

/**
 * What a key means, as a value rather than as a prefix somebody compares.
 *
 * `nothing` covers every key that opens no level — the bare words, a leaf, and
 * anything this module did not compose. A caller that switched on the prefix
 * would have to decide what an unknown one means; here it is decided once.
 */
export type RowKeyMeaning =
  | { opens: "nothing" }
  | { opens: "back" }
  | { opens: "combatant"; combatantId: number }
  | { opens: "target"; combatantId: number }
  | { opens: "skill"; ownerId: number; key: string };

export function getRowKeyMeaning(key: string): RowKeyMeaning {
  if (key === BACK_ROW_KEY) return { opens: "back" };

  const divider = key.indexOf(DIVIDER);
  if (divider < 0) return { opens: "nothing" };
  const kind = key.slice(0, divider);
  const rest = key.slice(divider + 1);

  if (kind === COMBATANT || kind === TARGET) {
    const combatantId = getIntegerFromText(rest);
    // A row whose id will not read leads nowhere, rather than opening somebody
    // else's breakdown.
    if (combatantId === null) return { opens: "nothing" };
    return kind === COMBATANT
      ? { opens: "combatant", combatantId }
      : { opens: "target", combatantId };
  }

  if (kind === SKILL) {
    const owner = rest.indexOf(DIVIDER);
    if (owner < 0) return { opens: "nothing" };
    const ownerId = getIntegerFromText(rest.slice(0, owner));
    if (ownerId === null) return { opens: "nothing" };
    return { opens: "skill", ownerId, key: rest.slice(owner + 1) };
  }

  return { opens: "nothing" };
}
