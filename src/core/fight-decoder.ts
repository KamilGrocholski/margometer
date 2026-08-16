import { assert } from "@/libs/assert.ts";
import { getDecimalFromText, getIntegerFromText, getNumberFromText } from "@/libs/number.ts";
import type {
  AnnouncedSkill,
  AttackEvent,
  BattleEvent,
  DamageAmount,
  DamageToNamedCombatantEvent,
  HealingToNamedCombatantEvent,
  HealthChangeEvent,
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
 * Damage the client names instead of shaping — the one exception to the rule
 * above, and it needs one because the shape rule cannot reach it.
 *
 * `thirdatt` is the Third Blow, an extra auxiliary attack the help documents as
 * `of-thirdatt` (read 2026-08-09). It arrives as an ordinary raw/applied pair
 * and carries no `dmg` marker, so the family rule walks straight past both
 * halves and the meter simply lost that damage.
 *
 * ⚠️ **Earned on the health arithmetic, not on the name.** Before it was read,
 * `tests/core/health-witness.test.ts` disagreed eight times in
 * `2026-08-12-tempest-grupa-vs-draugr-2`, every one of them in the direction of
 * too little damage decoded; reading the applied half closes all eight and
 * introduces no disagreement anywhere else. That is the protocol's own stated
 * percentages settling it, which is the only evidence this repository accepts
 * for a key that moves health.
 *
 * The value is the damage type as well, so a Third Blow shows as its own kind
 * rather than being folded into a weapon element it is not.
 */
const DAMAGE_KEYS_BY_NAME = ["+thirdatt", "-thirdatt"];

/**
 * `amount,kind,name(percent%)` — the recipient arrives as a name here, not as an
 * id, and the health it states is that combatant's, not the message target's.
 *
 * ⚠️ **The kind is trimmed, and a blank one is the plain element.** 66
 * occurrences in the captures write that field as a single space
 * (`+oth_dmg=4439, ,Gracz 5(66.95%)`), which made `dmg ` a second element
 * alongside `dmg` and drew two rows a reader cannot tell apart — 107 952 points
 * of physical damage under a label that looked like the one above it. Production
 * build `1785244275300` spends this field on one thing, `<b class=dmg"+D[1]+">`,
 * and a class attribute of `"dmg "` **is** the class `dmg`, so the game itself
 * never made the distinction we were making.
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
    announced: null,
    actorId,
    targetName,
    targetId: roster === null ? null : getCombatantIdByName(roster, targetName),
    targetHealthPercent,
    damage: { damageType: `${DAMAGE_MARKER}${kind.trim()}`, amount },
  };
}

/**
 * Healing stated against a name, and the one key that does it.
 *
 * **Two members, in the order the client reads them**: production build
 * `1786514810315` splits this value on the comma and renders `%val%` from the
 * second member and `%val2%` from the first — so the figure comes first and the
 * name second, the opposite way round from `+oth_dmg`, which is why this cannot
 * share that reader.
 *
 * The percentage the name carries is the combatant's health with this healing
 * already in: measured on the one occurrence the material holds, a target at
 * 25.32% of 19047 took 1633 and ends the message at 63.00%, which is
 * 4823 − 1633 + 8810. The help documents the effect firing below 18% of the pool
 * (article view,372, engine name `lastheal`, read 2026-08-12), and 3190 is
 * 16.75% — so both halves of the rule close on our own material.
 */
const HEALING_TO_NAMED_KEY = "legbon_lastheal";

function decodeHealingToNamedCombatant(
  key: string,
  value: string | null,
  roster: CombatantRoster | null,
): HealingToNamedCombatantEvent | null {
  if (value === null) return null;

  const [rawAmount, rawName] = value.split(VALUE_SEPARATOR);
  if (rawAmount === undefined || rawName === undefined) return null;

  const amount = getIntegerFromText(rawAmount);
  // Healing that took health away would be this reader misunderstanding its own
  // key, not the game reporting a loss — the loss keys are elsewhere.
  if (amount === null || amount < 0) return null;

  const named = NAMED_WITH_PERCENT.exec(rawName);
  const targetName = named === null ? rawName : (named[1] ?? "");
  if (targetName === "") return null;

  const rawPercent = named?.[2];
  const targetHealthPercent = rawPercent === undefined ? null : getDecimalFromText(rawPercent);
  if (rawPercent !== undefined && targetHealthPercent === null) return null;

  return {
    kind: "healing-to-named-combatant",
    targetName,
    targetId: roster === null ? null : getCombatantIdByName(roster, targetName),
    targetHealthPercent,
    amount,
    source: key,
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
  // Elemental damage over time, and the client writes it as `poison`'s twin:
  // production build 1786514810315 composes both from the actor slot, both split
  // on the separator below, and the same bundle counts `fire` into its own damage
  // sum (`updateStat("damage-fire", …)`). `light` and `frost` sit in that branch
  // beside it and the captures carry neither, so they stay unread and loud (§3).
  fire: { sign: -1, isOnTarget: false },
};

/**
 * This family may state a second figure after the health one, and the client
 * splits on it too — `injure`, `poison` and `heal` each compose a different
 * sentence when the value has two members, production build `1786441768914`.
 *
 * The member is a **signed change of something**: production build
 * `1786441768914` shows its magnitude and derives *increased* or *decreased*
 * from its sign. Which quantity changed is named only in the sentence the client
 * fetches at run time, so it stays unestablished, and the sign is kept because
 * the client keeps it. It is carried as a declaration rather than read, because
 * the one thing measured about it is that it is not health — both calls are judged by
 * `tests/core/health-witness.test.ts` and agree on the very messages carrying it.
 */
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
  "+of_crit",
  "-legbon_cleanse",
  "-tenacity",
  "-evade",
  // Both settled the same way as the twelve above, on production build
  // 1786514810315: `msg_+fastarrow` and `msg_-contra` are composed with no
  // `%val%` hole, against the `msg_-blok %val%` branch in the same switch. The
  // captures agree — neither ever arrives carrying a value.
  "+fastarrow",
  "-contra",
  // The sibling `+legbon_curse` was recorded as the one a later capture would
  // arrive carrying, and it has. Settled the same way as the twelve above, on
  // production build 1786514810315: `msg_-legbon_glare` is composed with no
  // `%val%` hole, and the help documents it as an event rather than a figure —
  // the holder, on taking a hit, costs the opponent their next action (article
  // view,372, engine name `glare`, read 2026-08-12).
  "-legbon_glare",
  // Settled the same way, on production build 1786514810315: `msg_-pierceb` is
  // composed with no `%val%` hole. It is the one proc here that belongs to the
  // **defence** — the help gives it as an event that can only occur after
  // `+pierce` has, and that switches off the effects that event triggers
  // (article view,372, engine name `pierceb`, read 2026-08-09). All three
  // occurrences carry `+pierce` in the same message.
  "-pierceb",
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
 * measured across every capture, and the reason they are read here rather than
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
  // A share the aura will add to melee damage. Same argument as the rest: what
  // it comes to arrives later as ordinary damage, already applied.
  "aura-adddmg2_per-meele",
];

/**
 * The two an announcement states **without** a figure.
 *
 * They cannot go in the list above, which sends a key back to unread when its
 * value will not read as a whole number — that check is what makes the shape of
 * a declaration loud, and relaxing it for these would blind it for all of them.
 * So they get their own list, exactly as `+legbon_holytouch` does on the blow
 * side, and a value arriving on one is loud rather than silently dropped.
 *
 * Production build 1786514810315 composes both with no `%val%`: `en-regen-cast`
 * interpolates two combatant names and no figure, and `+spell-taken_dmg-all`
 * interpolates nothing at all.
 */
const VALUELESS_SKILL_DECLARATION_KEYS = ["+spell-taken_dmg-all", "en-regen-cast"];

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
  // Energy again, and taken rather than given back: the help documents `endest`
  // as destroying a fixed number of the opponent's energy points (article
  // view,372, read 2026-08-12), and production build 1786514810315 composes it
  // as `msg_-endest %val%`. Energy is a unit no total here keeps.
  "-endest",
  // Neither states health: measured, every occurrence either sits on a message
  // where both sides state a percentage the decoded damage reproduces exactly, or
  // on a call the team heal makes uncomparable. What `-legbon_facade` counts is
  // still unknown — what is settled is that it is not health.
  "-legbon_facade",
  "+critpoison_per",
  // Four more shares a blow states about itself, each composed by production
  // build 1786514810315 as a figure (`msg_+critsa %val%`, `msg_-legbon_critred
  // %val%`, `msg_+legbon_puncture %val%`, `eng_game_only_val_+crush %val%`) and
  // each stating an input to damage the keys beside it already carry.
  "+critsa",
  "-legbon_critred",
  "+legbon_puncture",
  "+crush_physical",
  // Rage, which the help documents as a buff raising physical damage by 10% for a
  // number of turns after a critical hit (article view,372 at the engine name
  // `rage`, read 2026-08-09). Production build 1786514810315 composes it as
  // `msg_+rage %val%`, an attack figure — an input to the damage the `dmg` keys
  // beside it already report, and in a unit no total here keeps.
  "+rage",
  /**
   * ⚠️ **The one that looks like damage and is not.** `+taken_dmg` rides every
   * blow that carries `-dmga`, all 199 of them, and the tempting reading is that
   * it is the raw half of that applied figure — the help documents
   * `taken_dmg_per` as damage added to what the target takes, reduced by armour.
   *
   * The material refuses it: a raw figure cannot be smaller than its own applied
   * counterpart, and `+taken_dmg` is smaller in 31 of the 199 and never once
   * larger. So it states a component of the added damage, not the whole of it,
   * and the whole is already reported as `-dmga` — which the shape rule reads.
   * Counting it would add the same damage twice.
   *
   * The client agrees: it composes this one as `eng_game_only_val_+taken_dmg
   * %val%`, sharing that branch with `+crush` and `+critpierce`, while `-dmga`
   * falls to the default branch that recognises damage by shape. Production
   * build 1786514810315.
   */
  "+taken_dmg",
];

/**
 * The declaration that carries **no value**, and is read only while it carries
 * none.
 *
 * `+legbon_holytouch` arrives valueless in the captures, exactly as a flag does,
 * but production build `1785244275300` composes its sentence with a `%val%` hole
 * — so the client expects a figure this occurrence does not send. Reading it as a
 * flag outright would settle from one message what the game settles, and the
 * figure would vanish the first time one arrived. A value sends it back to
 * unread, which is where that disagreement belongs.
 */
const VALUELESS_BLOW_DECLARATION_KEYS = ["+legbon_holytouch"];

/**
 * Keys the decoder **reads and cannot account for**: the protocol says health
 * moved and states no figure any row could take.
 *
 * Exported because the health witness needs it. "Understood" and "the replay can
 * add it" are different properties, and conflating them would make the witness
 * stop skipping these calls the moment the key was read — every one of them would
 * then disagree, for the good reason that the health really did move.
 *
 * `healall_per` restores a floored share of maximum to everyone on the caster's
 * side, capped at the health each began the fight with. The share is stated; the
 * recipients are not, and the cap has one reading in the material that refuses it
 * — so a figure drawn from it would be too high wherever the cap binds, which is
 * 84 of 120 side-mates, and too high is the direction the panel cannot mark
 * (`docs/protocol-keys.md`).
 */
export const UNATTRIBUTABLE_HEALTH_KEYS: readonly string[] = ["healall_per"];

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
  // Energy regained, stated on its own and in a unit no total here keeps.
  "en-regen",
  // What the winner of a duel is paid, in a currency held outside the fight: the
  // help gives it a section of its own (view,372 at the heading "Punkty
  // Honoru", read 2026-08-12) and the client composes it as `msg_+ph %val%`, production build
  // 1786514810315. It states no side, which is why it belongs here.
  "+ph",
  // Health restored by a talisman **after the fight has ended**, which is the
  // third shape a declaration takes here and the only one that is in a unit
  // this meter does keep — see `DeclaredEffect`. Three sources agree and the
  // last of them is our own: the help gives it as `hp restored = min(afterheal,
  // hp start - hp current)` under talismans acting after the battle (article
  // view,372, engine name `afterheal`, read 2026-08-09); production build
  // 1786514810315 composes `msg_afterheal %name% %val%`; and every occurrence
  // arrives after `winner`/`loser` with the recipients' health unmoved in the
  // payload's own snapshots, each of them well below their maximum.
  "afterheal",
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
  ...VALUELESS_BLOW_DECLARATION_KEYS,
  ...VALUELESS_SKILL_DECLARATION_KEYS,
  ...DAMAGE_KEYS_BY_NAME,
  ...UNATTRIBUTABLE_HEALTH_KEYS,
  SKILL_SHOUT_KEY,
  SKILL_NAME_KEY,
  SKILL_ID_KEY,
  DAMAGE_TO_NAMED_KEY,
  HEALING_TO_NAMED_KEY,
];

type MessageReading = {
  /** The actor slot of the message itself — not of any one event on it. */
  actorId: number | null;
  events: BattleEvent[];
};

function decodeMessage(message: string, roster: CombatantRoster | null): MessageReading {
  let parsed: ProtocolMessage;
  try {
    parsed = parseProtocolMessage(message);
  } catch (error) {
    // Narrow on purpose. A bare `catch` would also swallow broken assertions
    // and turn a bug of ours into "the game changed its format" — the most
    // expensive kind of wrong number this project can produce.
    if (!(error instanceof ProtocolMessageFormatError)) throw error;
    // No key to name: the grammar failed before there were parameters to read.
    return {
      actorId: null,
      events: [{ kind: "unknown-message", message, reason: error.message, unreadKeys: [] }],
    };
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

    if (key === HEALING_TO_NAMED_KEY) {
      const healing = decodeHealingToNamedCombatant(key, value, roster);
      if (healing === null) unreadKeys.push(key);
      else events.push(healing);
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
      const declaredBeside: DeclaredEffect[] = [];
      events.push({
        kind: "health-change",
        announced: null,
        combatantId: subject?.combatantId ?? null,
        amount: amount * healthChange.sign,
        source: key,
        declared: declaredBeside,
      });
      // The health figure is read; a second one beside it is carried without
      // being read. A member that will not read as a number goes back to unread
      // — the shape is checked here as everywhere else.
      for (const stated of rest) {
        const extra = getNumberFromText(stated);
        if (extra === null) unreadKeys.push(key);
        else declaredBeside.push({ effect: key, amount: extra, text: null });
      }
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

    if (VALUELESS_SKILL_DECLARATION_KEYS.includes(key)) {
      if (value === null) declared.push({ effect: key, amount: null, text: null });
      else unreadKeys.push(key);
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

    if (VALUELESS_BLOW_DECLARATION_KEYS.includes(key)) {
      if (value === null) blowDeclared.push({ effect: key, amount: null, text: null });
      else unreadKeys.push(key);
      continue;
    }

    if (UNATTRIBUTABLE_HEALTH_KEYS.includes(key)) {
      events.push({
        kind: "unaccounted-health",
        source: key,
        combatantId: parsed.actor?.combatantId ?? null,
        // Either spelling: the protocol states `30` and `22.5` for this key in
        // the same fight.
        declaredShare: value === null ? null : getNumberFromText(value),
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

    if (DAMAGE_KEYS_BY_NAME.includes(key) || isDamageKey(key)) {
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
      announced: null,
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
  return { actorId: parsed.actor?.combatantId ?? null, events };
}

/** The figures a skill can be glued to. Nothing else carries `announced`. */
function isGluable(
  event: BattleEvent,
): event is AttackEvent | DamageToNamedCombatantEvent | HealthChangeEvent {
  return (
    event.kind === "attack" ||
    event.kind === "damage-to-named-combatant" ||
    event.kind === "health-change"
  );
}

/**
 * Whose figure this is, for the purpose of the glue.
 *
 * A health change is the exception and the reason this function exists: its own
 * combatant is the one **healed**, so asking it "whose is this" would bind a heal
 * to the person who received it. It has no actor of its own, so the announcement
 * is the only candidate, and the caller has already checked that the message it
 * arrived on belongs to the announcer.
 */
function getGlueActor(
  event: AttackEvent | DamageToNamedCombatantEvent | HealthChangeEvent,
  announcer: number | null,
): number | null {
  return event.kind === "health-change" ? announcer : event.actorId;
}

/**
 * The roster is optional because a fight can be joined already in progress, and
 * a missing roster must degrade to "we cannot say who" rather than to a guess or
 * to nothing decoded at all.
 *
 * ⚠️ **This is not a `map` over messages, and cannot be.** The game glues a
 * message carrying `skillId` to the one after it (`AnnouncedSkill`), so a figure
 * knows which skill it belongs to only in the company of its neighbour. The
 * state below is that neighbourhood and nothing more: it reaches exactly one
 * message forward and is dropped whatever the next message turns out to be.
 *
 * The alternative — a rule reaching further, "the last skill this combatant
 * announced" — is what a reader would reinvent from the panel, and it is wrong:
 * 32 of the 197 announcements in the group capture are followed by a message
 * belonging to somebody else, and a rule that waits for a match would eventually
 * hand one of them the wrong skill.
 */
export function decodeFight(
  messages: readonly string[],
  roster: CombatantRoster | null = null,
): BattleEvent[] {
  const events: BattleEvent[] = [];
  let carried: AnnouncedSkill | null = null;

  for (const message of messages) {
    const { actorId, events: produced } = decodeMessage(message, roster);
    const announcement = produced.find((event) => event.kind === "skill-used") ?? null;
    const announced: AnnouncedSkill | null = announcement && {
      skillName: announcement.skillName,
      skillId: announcement.skillId,
      actorId: announcement.actorId,
    };

    // An announcement binds the figures on its own message; anything else binds
    // only what the message before it announced, and only if it is that
    // combatant's message. The check is on the MESSAGE's actor, not the event's:
    // a heal names its recipient, so an event-level check would bind the skill to
    // whoever was healed.
    const binding = announced ?? (carried !== null && actorId === carried.actorId ? carried : null);
    if (binding !== null) {
      for (const event of produced) {
        if (!isGluable(event)) continue;
        if (getGlueActor(event, binding.actorId) !== binding.actorId) continue;
        event.announced = binding;
      }
    }

    // Exactly one message forward, whatever that message turns out to be.
    carried = announced;
    events.push(...produced);
  }

  return events;
}
