import { assert } from "@/libs/assert.ts";
import { getDecimalFromText, getIntegerFromText } from "@/libs/number.ts";
import type {
  BattleEvent,
  DamageAmount,
  DamageToNamedCombatantEvent,
  PreventedDamage,
  DeclaredEffect,
  StatisticDestruction,
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
 * What an attack reports besides its figures: a defence that stopped part of it,
 * a statistic of the target it destroyed, an effect that fired with it.
 *
 * Listed rather than recognised by shape, because the client names them too —
 * mostly one case per key, and the absorption pair sharing one — unlike the
 * damage family, which it matches by offset. Mirroring that means a key the game
 * adds tomorrow stays unread and loud instead of being folded into a figure by a
 * pattern that was never about it.
 */
const PREVENTED_DAMAGE_KEYS = ["-absorb", "-absorbm", "-blok"];
/**
 * `_per` names the share the skill declares, not the figure these report: the
 * captures carry values into the thousands, which is a quantity of absorption
 * and could not be a percentage. Trusting the suffix would have put a share into
 * a slot holding points.
 */
const STATISTIC_DESTRUCTION_KEYS = ["+acdmg", "+resdmg", "+abdest_per", "+abmdest_per"];
/**
 * Effects that fired with the blow and state no figure. Measured on the
 * captures: every occurrence arrives without a value.
 *
 * Membership is decided by the client, not by the shape of the name: the game
 * composes a sentence for each of these that interpolates nothing. A key whose
 * sentence has a `%val%` hole belongs elsewhere even where our own material
 * happens to carry no value for it — `+legbon_holytouch` is that case, and it
 * stays unread for it.
 */
const PROC_KEYS = [
  "+crit",
  "+pierce",
  "+stun",
  "+freeze",
  "+legbon_curse",
  "+legbon_verycrit",
  "+superspell-dispel",
  "+acdmg_destroyed",
  "-legbon_cleanse",
  "-tenacity",
];

/**
 * The two halves of a skill announcement, read together because neither is the
 * whole of it: the name is what the player sees, the id is what the game calls
 * it, and 15 of the 197 announcements carry only the first.
 *
 * The client itself does nothing with the id — its branch is an empty `break`,
 * there so the key does not fall through to the unknown-parameter notice.
 * Production build `1785244275300`.
 */
const SKILL_NAME_KEY = "tspell";
const SKILL_ID_KEY = "skillId";

/**
 * What an announcement declares about the skill it announces.
 *
 * Every one of these rides a message carrying `tspell` and none rides a blow —
 * measured across both captures, and the reason they are read here rather than
 * anywhere near a figure. Each states an **input**: a cost, a grant, a share the
 * skill will apply. What it comes to arrives later as ordinary damage, already
 * computed, so nothing downstream may add one to a statistic
 * (`docs/protocol-keys.md`, and `battle-event.ts` on `DeclaredEffect`).
 *
 * Reading them is what stops the panel warning about them: they marked 111
 * occurrences unread, and an unread key means *this total may be low* — which
 * none of these could ever cause.
 *
 * The shape is checked rather than assumed. A value that will not read as a
 * whole number sends the key back to unread, so the day one of these starts
 * carrying something else, it is loud instead of silently dropped.
 */
const SKILL_DECLARATION_KEYS = [
  "active_decblock_per",
  "active_decblock_per-enemies",
  "active_block_per",
  "alllowdmg",
  "allslow_per",
  "aura-ac_per",
  "aura-resall",
  "aura-sa_per",
  "mana",
  "energy",
  // Settled long before there was a slot for them, and by the same argument:
  // both state what the announced skill will spend or destroy, and what that
  // comes to arrives later as ordinary figures.
  "active_absorbdest_per",
  "combo-max",
];

/**
 * What a blow declares about itself.
 *
 * Neither is a figure of damage, and both were left unread for exactly that
 * reason until there was somewhere honest to put them:
 *
 *   - `-poison_lowdmg_per` is the share by which the blow was already weakened,
 *     so the damage keys beside it have it applied. Reading it as points would
 *     invent a unit; reading it as a reduction would subtract it twice.
 *   - `+injure` announces a deep wound worth a share of the damage just taken.
 *     The wound itself arrives on later calls as its own `injure` message, which
 *     the decoder does read — counting the announcement as well would land the
 *     same wound twice.
 *
 * Both are held to their measured rules by `tests/core/poison-reduction-rule.test.ts`
 * and `tests/core/injure-rule.test.ts`.
 */
const BLOW_DECLARATION_KEYS = [
  "-poison_lowdmg_per",
  "+injure",
  // Outcomes rather than inputs, and read for the other half of the rule: energy
  // and attack speed are units no total here keeps, so neither can shorten one.
  // Both ride a critical hit in every occurrence the captures carry.
  "+engback",
  "+critslow_per",
];

/**
 * Keys that are the whole of their message and report nothing that happened to
 * anybody: a turn marker, a skill being prepared, a line for the client's own
 * log, the experience at the end, an aura declared once for the fight.
 *
 * Measured: each is the only key in its message, without exception — which is why
 * they need an event of their own rather than a slot on a blow. Two of them carry
 * text rather than a figure, and one carries no value at all.
 *
 * `step` looks like a turn boundary and is not read as one. The protocol does not
 * say that, and neither does this list: what is read is that the message stated
 * `step` about a combatant (`docs/protocol-keys.md`).
 */
const STANDALONE_DECLARATION_KEYS = [
  "step",
  "prepare",
  "txt",
  "+exp",
  "poison_lowdmg_per-enemies",
];

/**
 * The one declaration whose value is a combatant's name rather than a figure:
 * `shout` states who the skill forces its targets to attack.
 */
const SKILL_SHOUT_KEY = "shout";

/**
 * Every named key the decoder claims to understand. Exported so a guard can hold it
 * against the keys the game actually knows — a key we handle that the client
 * has never heard of means we invented a meaning.
 */
export const UNDERSTOOD_PROTOCOL_KEYS: readonly string[] = [
  ...Object.keys(OUTCOME_KEYS),
  ...Object.keys(HEALTH_CHANGE_KEYS),
  ...PREVENTED_DAMAGE_KEYS,
  ...STATISTIC_DESTRUCTION_KEYS,
  ...PROC_KEYS,
  ...SKILL_DECLARATION_KEYS,
  ...BLOW_DECLARATION_KEYS,
  ...STANDALONE_DECLARATION_KEYS,
  SKILL_SHOUT_KEY,
  SKILL_NAME_KEY,
  SKILL_ID_KEY,
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
    // No key to name: the grammar failed before there were parameters to read.
    return [{ kind: "unknown-message", message, reason: error.message, unreadKeys: [] }];
  }

  const events: BattleEvent[] = [];
  const unreadKeys: string[] = [];
  const dealt: DamageAmount[] = [];
  const taken: DamageAmount[] = [];
  const prevented: PreventedDamage[] = [];
  const destroyed: StatisticDestruction[] = [];
  const procs: string[] = [];
  const blowDeclared: DeclaredEffect[] = [];
  const standalone: DeclaredEffect[] = [];
  // Read after the loop rather than inside it: the two keys are one fact, and
  // nothing guarantees the protocol writes them in a fixed order.
  let skillName: string | null = null;
  let skillId: number | null = null;
  const declared: DeclaredEffect[] = [];

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

    if (key === SKILL_NAME_KEY) {
      // A blank name would travel on looking like a skill nobody can name.
      if (value === null || value === "") unreadKeys.push(key);
      else skillName = value;
      continue;
    }

    if (key === SKILL_ID_KEY) {
      const id = value === null ? null : getIntegerFromText(value);
      if (id === null) unreadKeys.push(key);
      else skillId = id;
      continue;
    }

    if (SKILL_DECLARATION_KEYS.includes(key)) {
      const amount = value === null ? null : getIntegerFromText(value);
      if (amount === null) unreadKeys.push(key);
      else declared.push({ effect: key, amount, text: null });
      continue;
    }

    if (key === SKILL_SHOUT_KEY) {
      // A blank name would travel on as a combatant nobody can find, which is
      // the same fault as a blank skill name a few lines up.
      if (value === null || value === "") unreadKeys.push(key);
      else declared.push({ effect: key, amount: null, text: value });
      continue;
    }

    if (PREVENTED_DAMAGE_KEYS.includes(key)) {
      const amount = value === null ? null : getIntegerFromText(value);
      if (amount === null) unreadKeys.push(key);
      else prevented.push({ prevention: key.slice(1), amount });
      continue;
    }

    if (STATISTIC_DESTRUCTION_KEYS.includes(key)) {
      const amount = value === null ? null : getIntegerFromText(value);
      if (amount === null) unreadKeys.push(key);
      else destroyed.push({ statistic: key.slice(1), amount });
      continue;
    }

    if (STANDALONE_DECLARATION_KEYS.includes(key)) {
      // A figure where there is one, the text where there is not, and neither
      // where the key carries no value — all three are readings, and none is a
      // number anything totals.
      const amount = value === null ? null : getIntegerFromText(value);
      standalone.push({
        effect: key,
        amount,
        text: amount === null ? value : null,
      });
      continue;
    }

    if (BLOW_DECLARATION_KEYS.includes(key)) {
      const amount = value === null ? null : getIntegerFromText(value);
      if (amount === null) unreadKeys.push(key);
      else blowDeclared.push({ effect: key, amount, text: null });
      continue;
    }

    if (PROC_KEYS.includes(key)) {
      // A figure beside one of these is something the captures never showed and
      // nothing here explains. The key goes back to unread rather than being
      // read as a bare flag with a number quietly dropped beside it.
      if (value === null) procs.push(key.slice(1));
      else unreadKeys.push(key);
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

  // Anything the blow reported, not only its figures: a message carrying `+crit`
  // and nothing else still describes an attack, and emitting nothing for it
  // would drop it. Never seen in the captures, where every one of the 256
  // annotations rides a message that also carries damage.
  // A declaration counts as something reported: a message stating only that a
  // blow was weakened still describes a blow, and dropping it would lose the one
  // thing that message says.
  const reported = [dealt, taken, prevented, destroyed, procs, blowDeclared].some(
    (of) => of.length > 0,
  );
  if (reported) {
    events.push({
      kind: "attack",
      actorId: parsed.actor?.combatantId ?? null,
      targetId: parsed.target?.combatantId ?? null,
      dealt,
      taken,
      prevented,
      procs,
      destroyed,
      declared: blowDeclared,
    });
  }

  if (skillName !== null) {
    events.push({
      kind: "skill-used",
      actorId: parsed.actor?.combatantId ?? null,
      targetId: parsed.target?.combatantId ?? null,
      skillName,
      skillId,
      declared,
    });
  } else {
    if (skillId !== null) {
      // An id with no name is a skill nothing can put on screen, and the captures
      // have never sent one — 0 of 197. Reported rather than turned into an event
      // whose name we would have to invent.
      unreadKeys.push(SKILL_ID_KEY);
    }
    // A declaration with no announcement to belong to has nowhere to go, and
    // dropping it would be the silent loss the unread list exists to prevent.
    // Never seen: every occurrence in the captures rides a `tspell` message.
    for (const declaration of declared) unreadKeys.push(declaration.effect);
  }

  if (standalone.length > 0) {
    events.push({
      kind: "declaration",
      combatantId: parsed.actor?.combatantId ?? null,
      declared: standalone,
    });
  }

  // Reported even when the message also produced something readable: a message
  // half understood is not the same as a message understood.
  if (unreadKeys.length > 0) {
    events.push({
      kind: "unknown-message",
      message,
      reason: `no meaning yet for ${unreadKeys.join(", ")}`,
      unreadKeys,
    });
  }

  // A message carrying no parameters at all says nothing, and saying nothing
  // back would be the one thing rule 1 forbids. Never seen in captured
  // material, but it is a possible message rather than an impossible state, so
  // it gets reported rather than crashing the panel.
  if (events.length === 0) {
    events.push({
      kind: "unknown-message",
      message,
      reason: "carries no parameters",
      unreadKeys: [],
    });
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
