import { assert } from "@/libs/assert.ts";
import { getDecimalFromText, getIntegerFromText } from "@/libs/number.ts";
import type {
  BattleEvent,
  DamageAmount,
  DamageToNamedCombatantEvent,
} from "@/src/core/battle-event.ts";
import { getCombatantIdByName, type CombatantRoster } from "@/src/core/combatant-roster.ts";
import {
  parseProtocolMessage,
  ProtocolMessageFormatError,
  type ProtocolMessage,
} from "@/src/core/protocol-message.ts";

/**
 * Turns the protocol of one fight into events.
 *
 * Two rules hold for every message, and everything else is detail:
 *
 *   1. No message is dropped. A message the decoder cannot read still produces
 *      an event, and that event says so. A number that is quietly too low looks
 *      exactly like a number that is right.
 *   2. Nothing is invented. A key with no meaning yet is reported as unread,
 *      never guessed at from a neighbouring key.
 */

/** Names arrive as one string. The game has no escaping for a name containing this. */
const NAME_SEPARATOR = ", ";

const OUTCOME_KEYS: Record<string, "won" | "lost"> = {
  winner: "won",
  loser: "lost",
};

/**
 * The client does not spell out damage keys. Its default branch recognises them
 * by shape — a sign, then `dmg`, then a token naming the kind — and treats
 * anything else as a parameter it does not know. We mirror that rather than
 * listing the family, because the game can add a kind without changing this.
 */
const DAMAGE_MARKER = "dmg";
const DEALT_SIGN = "+";

function getDamageAmount(parameter: { key: string; value: string | null }): DamageAmount | null {
  if (parameter.value === null) return null;
  const amount = getIntegerFromText(parameter.value);
  if (amount === null) return null;
  return { damageType: parameter.key.slice(1), amount };
}

function isDamageKey(key: string): boolean {
  return key.slice(1, 1 + DAMAGE_MARKER.length) === DAMAGE_MARKER;
}

/**
 * `amount,kind,name(percent%)` — the recipient arrives as a name here, not as an
 * id, and the health it states is that combatant's, not the message target's.
 */
const DAMAGE_TO_NAMED_KEY = "+oth_dmg";
const NAMED_WITH_PERCENT = /^(.*)\((\d+\.\d\d)%\)$/;

function decodeDamageToNamedCombatant(
  value: string | null,
  actorId: number | null,
  roster: CombatantRoster | null,
): DamageToNamedCombatantEvent | null {
  if (value === null) return null;

  const [rawAmount, kind, rawName] = value.split(",");
  if (rawAmount === undefined || kind === undefined || rawName === undefined) return null;

  const amount = getIntegerFromText(rawAmount);
  if (amount === null) return null;

  const named = NAMED_WITH_PERCENT.exec(rawName);
  // The `??` closes a gap in the type, not a real branch — `(.*)` always
  // captures once the pattern matched. It falls into the check below rather than
  // asserting, because an assertion here would travel into the game engine.
  const targetName = named === null ? rawName : (named[1] ?? "");
  // Damage against nobody is not damage we can attribute, and a blank name would
  // travel on looking like one.
  if (targetName === "") return null;

  const rawPercent = named?.[2];
  const targetHealthPercent = rawPercent === undefined ? null : getDecimalFromText(rawPercent);
  if (rawPercent !== undefined && targetHealthPercent === null) return null;

  return {
    kind: "damage-to-named-combatant",
    actorId,
    targetName,
    targetId: roster === null ? null : getCombatantIdByName(roster, targetName),
    targetHealthPercent,
    damage: { damageType: `${DAMAGE_MARKER}${kind}`, amount },
  };
}

/**
 * Health moving outside an attack: which way it goes, and which slot holds the
 * combatant it happens to.
 *
 * Both are ours to supply. The protocol states a magnitude and leaves the
 * direction to the key; measured on the captured fights, healing added and the
 * rest subtracted is the only one of the four combinations under which the
 * stated percentages close. The slot is measured too — all but `heal_target`
 * put their subject in the actor slot of a message whose target is nobody.
 *
 * `injure` and `+injure` are different keys and only this one moves health.
 */
const HEALTH_CHANGE_KEYS: Record<string, { sign: number; isOnTarget: boolean }> = {
  heal: { sign: 1, isOnTarget: false },
  legbon_holytouch_heal: { sign: 1, isOnTarget: false },
  heal_target: { sign: 1, isOnTarget: true },
  poison: { sign: -1, isOnTarget: false },
  injure: { sign: -1, isOnTarget: false },
};

/** Two of these carry a second, comma-separated figure that nothing here explains. */
const VALUE_SEPARATOR = ",";

/**
 * Every named key the decoder claims to understand. Exported so a guard can hold it
 * against the keys the game actually knows — a key we handle that the client
 * has never heard of means we invented a meaning.
 */
export const UNDERSTOOD_PROTOCOL_KEYS: readonly string[] = [
  ...Object.keys(OUTCOME_KEYS),
  ...Object.keys(HEALTH_CHANGE_KEYS),
  DAMAGE_TO_NAMED_KEY,
];

function decodeMessage(message: string, roster: CombatantRoster | null): BattleEvent[] {
  let parsed: ProtocolMessage;
  try {
    parsed = parseProtocolMessage(message);
  } catch (error) {
    // Narrow on purpose. A bare `catch` would also swallow broken assertions
    // and turn a bug of ours into "the game changed its format" — the most
    // expensive kind of wrong number this project can produce.
    if (!(error instanceof ProtocolMessageFormatError)) throw error;
    return [{ kind: "unknown-message", message, reason: error.message }];
  }

  const events: BattleEvent[] = [];
  const unreadKeys: string[] = [];
  const dealt: DamageAmount[] = [];
  const taken: DamageAmount[] = [];

  for (const parameter of parsed.parameters) {
    const { key, value } = parameter;

    if (key === DAMAGE_TO_NAMED_KEY) {
      const damage = decodeDamageToNamedCombatant(
        value,
        parsed.actor?.combatantId ?? null,
        roster,
      );
      if (damage === null) unreadKeys.push(key);
      else events.push(damage);
      continue;
    }

    const healthChange = HEALTH_CHANGE_KEYS[key];
    if (healthChange !== undefined) {
      const [magnitude, ...rest] = (value ?? "").split(VALUE_SEPARATOR);
      const amount = magnitude === undefined ? null : getIntegerFromText(magnitude);
      if (amount === null) {
        unreadKeys.push(key);
        continue;
      }
      const subject = healthChange.isOnTarget ? parsed.target : parsed.actor;
      events.push({
        kind: "health-change",
        combatantId: subject?.combatantId ?? null,
        amount: amount * healthChange.sign,
        source: key,
      });
      // The health figure is read; a second figure beside it is not. Reporting
      // the key as unread as well is the honest half-and-half: the number is
      // usable, and something in the message still is not understood.
      if (rest.length > 0) unreadKeys.push(key);
      continue;
    }

    if (isDamageKey(key)) {
      const damage = getDamageAmount(parameter);
      // A damage key whose value will not read as a number is worse than an
      // unknown key: it looks like a figure and is not one.
      if (damage === null) unreadKeys.push(key);
      else if (key.startsWith(DEALT_SIGN)) dealt.push(damage);
      else taken.push(damage);
      continue;
    }

    const result = OUTCOME_KEYS[key];
    if (result !== undefined && value !== null) {
      const combatantNames = value.split(NAME_SEPARATOR);
      // `"".split(", ")` is `[""]`, so an empty value reads as a side holding one
      // nameless combatant. A side we cannot match against anyone is unread.
      if (combatantNames.every((name) => name !== "")) {
        events.push({ kind: "fight-outcome", result, combatantNames });
        continue;
      }
    }
    unreadKeys.push(key);
  }

  if (dealt.length > 0 || taken.length > 0) {
    events.push({
      kind: "attack",
      actorId: parsed.actor?.combatantId ?? null,
      targetId: parsed.target?.combatantId ?? null,
      dealt,
      taken,
    });
  }

  // Reported even when the message also produced something readable: a message
  // half understood is not the same as a message understood.
  if (unreadKeys.length > 0) {
    events.push({
      kind: "unknown-message",
      message,
      reason: `no meaning yet for ${unreadKeys.join(", ")}`,
    });
  }

  // A message carrying no parameters at all says nothing, and saying nothing
  // back would be the one thing rule 1 forbids. Never seen in captured
  // material, but it is a possible message rather than an impossible state, so
  // it gets reported rather than crashing the panel.
  if (events.length === 0) {
    events.push({ kind: "unknown-message", message, reason: "carries no parameters" });
  }

  // Rule 1, now held by construction. This can only fire if a future edit
  // breaks that — which is exactly when silence would be most expensive.
  assert(events.length > 0, "every message produces at least one event");
  return events;
}

/**
 * The roster is optional because a fight can be joined already in progress, and
 * a missing roster must degrade to "we cannot say who" rather than to a guess or
 * to nothing decoded at all.
 */
export function decodeFight(
  messages: readonly string[],
  roster: CombatantRoster | null = null,
): BattleEvent[] {
  return messages.flatMap((message) => decodeMessage(message, roster));
}
