/**
 * What the decoder produces and everything downstream consumes.
 *
 * The union grows one variant at a time, alongside the decoder step that
 * produces it. A variant nothing produces is not a placeholder for future work
 * — it is dead weight that our own test data keeps alive, and
 * `tests/core/battle-event.test.ts` fails on it.
 */

/**
 * One damage figure. The type token is the client's own — the key with its sign
 * removed, exactly what the client uses to style the number — so nothing is
 * invented here. What the token means in words comes from the game at run time.
 */
export type DamageAmount = {
  damageType: string;
  amount: number;
};

/**
 * Damage that did not land, and the defence the game credits with stopping it.
 *
 * **Not derivable from `dealt` minus `taken`.** Measured on the captured
 * fights: that difference equals the sum of these figures in 6 of the 68
 * messages carrying one, and exceeds it in the other 62. Armour and resistance
 * reduce as well and the protocol reports neither, so the remainder is real and
 * unattributable — reading the gap as absorption would state a number nobody
 * sent.
 */
export type PreventedDamage = {
  /** The client's own token — the key with its sign removed. */
  prevention: string;
  amount: number;
};

/**
 * A statistic of the target this attack reduced. Not damage, and not comparable
 * to damage: the game keeps armour and absorption in points and elemental
 * resistance in percentage points, and the protocol states the figure without
 * its unit. Kept apart from `dealt` for that reason — summed together they would
 * be a total of two different things, and the members of this family are not all
 * in one unit either.
 */
export type StatisticDestruction = {
  /** The client's own token — the key with its sign removed. */
  statistic: string;
  amount: number;
};

/**
 * The skill the game itself glued to this figure.
 *
 * **Not our inference.** The client appends the message *after* one carrying
 * `skillId` to that message and renders the pair as one action — the branch that
 * builds `allM[indexM] + ',' + allM[parseIndexM + 1]`, production build
 * `1785244275300`. Reading the two together is therefore how the fight is
 * composed, not a rule we invented about it.
 *
 * One condition is ours and it is narrower than the client's: **the glued
 * message must have the same actor.** The client only needs the pair to draw one
 * line; we need to know whose figure it is. Measured on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`: of 197
 * announcements, 133 are followed by a message with the same actor and **32 by a
 * message with a different one** — without the condition, an announcement takes
 * somebody else's blow.
 *
 * Null on everything the game did not glue, which is most of a fight.
 */
export type AnnouncedSkill = {
  /** As the protocol states it — the name the player's own client shows. */
  skillName: string;
  skillId: number | null;
  /**
   * Who announced it.
   *
   * Carried rather than derived, because on a health change the event's own
   * combatant is the one **healed**, and the announcer is the only thing in the
   * material that can stand for the healer.
   */
  actorId: number | null;
};

export type AttackEvent = {
  kind: "attack";
  /** Combatant ids, or null where the protocol named nobody on that side. */
  actorId: number | null;
  targetId: number | null;
  /** Before reduction — what the attacker put out. */
  dealt: DamageAmount[];
  /**
   * After reduction — what the target actually lost. Measured on the captured
   * fights: health drop matched the sum of these in 22 of 26 comparisons and
   * the sum of `dealt` in none of them.
   */
  taken: DamageAmount[];
  /** What a defence stopped. Belongs to the target, as `taken` does. */
  prevented: PreventedDamage[];
  /**
   * Effects that fired alongside the blow and carry **no figure at all** — the
   * protocol states the name and nothing else. A token here is a fact about the
   * attack, never a number, so nothing downstream may total them.
   */
  procs: string[];
  /** Statistics of the target this blow reduced. Belongs to the target too. */
  destroyed: StatisticDestruction[];
  /**
   * Shares the message states about the blow itself — a weakening already applied
   * to the figures beside them, or a wound announced here and delivered later.
   * Never totalled with anything: see `DeclaredEffect`.
   */
  declared: DeclaredEffect[];
  /** The skill the game glued this blow to, where it glued one. */
  announced: AnnouncedSkill | null;
};

/**
 * Damage the protocol reports against a **name** rather than an id, alongside
 * an attack aimed at someone else.
 *
 * Measured on the captured fights: in every call where the target's health fell
 * further than the attack accounted for, the shortfall equalled this figure
 * exactly. It is damage that landed, already reduced — there is no second
 * figure for it the way `dealt` and `taken` pair up.
 */
export type DamageToNamedCombatantEvent = {
  kind: "damage-to-named-combatant";
  actorId: number | null;
  targetName: string;
  /**
   * The combatant that name belongs to, once a roster could say. Null when
   * there was no roster, when the name is in none of it, or when more than one
   * combatant answers to it — all three mean the same thing downstream, which
   * is that this damage cannot be put on anyone's row.
   */
  targetId: number | null;
  /** Health the protocol states for that combatant once this damage is in. */
  targetHealthPercent: number | null;
  damage: DamageAmount;
  /** The skill the game glued this figure to, where it glued one. */
  announced: AnnouncedSkill | null;
};

/**
 * Health that moved outside an attack.
 *
 * One variant for healing and for damage over time, because the protocol tells
 * them apart only by which key it used and tells us nothing else about either:
 * there is no actor, no attacker, no source beyond the key itself. Splitting
 * them into `heal` and `damage-over-time` would put our reading of the key into
 * the type, and the client's own `heal` can state a loss as readily as a gain.
 *
 * Measured on the captured fights: applying these as signed health, healing up
 * and the rest down, closes the arithmetic against the percentages the protocol
 * states where before it could not be attempted at all.
 */
export type HealthChangeEvent = {
  kind: "health-change";
  /**
   * Whose health moved. The protocol puts them in the **actor** slot of a
   * message whose target is nobody — the slot holds the subject here, not an
   * attacker, and no message of this shape names anyone else.
   */
  combatantId: number | null;
  /** Signed: positive is health restored, negative is health lost. */
  amount: number;
  /** The protocol key as written. Who caused it is not in the log (§5). */
  source: string;
  /**
   * What the key stated **beside** the health figure, where it stated anything.
   *
   * The value of this family may carry a second comma-separated member, and the
   * client renders a different sentence when it does. Its **shape** is settled —
   * production build `1786441768914` shows its magnitude and derives *increased*
   * or *decreased* from its sign — and its **subject** is not: which quantity
   * changed is named only in the sentence, which the client fetches at run time.
   * Two occurrences in the whole material, `heal=3065,-45` and `poison=140,14`.
   *
   * It is carried rather than read, on the one thing that **is** measured: the
   * health arithmetic closes on both calls, and on the very messages that carry
   * it, so whatever the member states, it is not health. That is the whole of
   * what a `DeclaredEffect` claims (`docs/protocol-keys.md`).
   */
  declared: DeclaredEffect[];
  /**
   * The skill this movement was glued to.
   *
   * This is the only place a **healer** can come from: the key states who was
   * healed and never who did it, so where nothing was announced, nothing is
   * claimed — and that is most of the healing in a fight. Measured on the group
   * capture: 25 178 of 122 648 points restored carry an announcement.
   */
  announced: AnnouncedSkill | null;
};

/**
 * Something the protocol states that **no total here counts**.
 *
 * Two kinds qualify, and the register says which each key is:
 *
 *   - an **input** rather than an outcome — what a skill costs, what it grants,
 *     the share by which a blow was already weakened before it was reported;
 *   - an outcome in a **unit this meter does not keep** — energy returned, attack
 *     speed slowed, combination points spent.
 *
 * ⚠️ **Nothing downstream may total one.** `alllowdmg=5` says a skill lowers the
 * opposing side's damage by a share; it does not say anybody's damage fell, and
 * by how much is a question the later blows answer on their own, already reduced.
 * `-poison_lowdmg_per=10` is the same shape from the other end: the figures beside
 * it have it applied, so adding it anywhere would subtract a reduction twice.
 *
 * ⚠️ **The test a key must pass to land here**, and it is not "we understand it":
 * *whatever this figure did, is it either reported elsewhere or in a unit no
 * total here keeps?* `healall_per` is the key that fails it — the health it
 * restores is stated nowhere else in the protocol, so calling it a declaration
 * would silence a warning while the healing total really is short. It is read as
 * `UnaccountedHealthEvent` instead, which is the third answer this type is not.
 *
 * Getting that test right is the whole value of the type: nineteen keys spent the
 * life of the register marking their messages unread, which made the panel say a
 * total might be low because of a key that could never have lowered one. A
 * warning that fires when nothing is wrong is a warning nobody reads — and the
 * one that matters is the one it would be lost among.
 */
export type DeclaredEffect = {
  /** The client's own key, exactly as the protocol wrote it. */
  effect: string;
  /**
   * The figure stated, signed as the protocol signs it — `mana` states what the
   * resource does, which is fall, so it arrives negative. Null where the value is
   * not a figure, or where the key carries none at all.
   */
  amount: number | null;
  /**
   * The value where it was not a figure, exactly as it arrived: a combatant's
   * name for `shout`, a skill being prepared, the client's own log line for
   * `txt`. What each one means is the register's business, not this type's.
   *
   * Read at run time and stored nowhere here — these carry the game's own words
   * and other players' names (NOTICE.md).
   */
  text: string | null;
};

/**
 * A named skill a combatant used.
 *
 * **Not part of the blow**, but not a message of its own either, and an earlier
 * version of this comment claimed both. Measured on the captured fights: none of
 * the 197 announcements carries a key of the damage *family*, which is what had
 * been checked — but 33 of them carry a figure all the same, 24 as `+oth_dmg`
 * and 9 as a key the register lists as moving health, in the same message as the
 * skill name.
 *
 * So the protocol does sometimes put a skill beside a figure. What it still does
 * not state is that the figure is the skill's doing, so tying them remains an
 * inference rather than a reading, and the decoder emits the two as separate
 * events from the one message. Held by
 * `tests/core/skill-announcement-rule.test.ts`.
 */
export type SkillUsedEvent = {
  kind: "skill-used";
  actorId: number | null;
  /**
   * Often the actor itself, and sometimes nobody: measured, 44 of the
   * announcements name the user in both slots and 15 name no target at all.
   */
  targetId: number | null;
  /**
   * As the protocol states it, which is the name the player's own client shows
   * — so it arrives in their language and is never stored here (NOTICE.md).
   */
  skillName: string;
  /**
   * The game's own identifier, where the message carried one. Null on 15 of the
   * 197 announcements, which is why the name is what this event is built on.
   */
  skillId: number | null;
  /**
   * What the announcement states about the skill. Empty for most of them, and
   * empty is a reading rather than a gap: the announcement said nothing further.
   */
  declared: DeclaredEffect[];
};

/**
 * A message that states something and reports nothing that happened to anybody.
 *
 * Measured: every key that lands here is the **only** key in its message — a
 * turn marker, a skill being prepared, a line for the client's own log, the
 * experience at the end, an aura declared once for the fight. None of them rides
 * a blow or an announcement, so there is no event of another kind for them to
 * belong to, and without this one they would be indistinguishable from a key
 * nobody has read yet.
 *
 * It reports **no figure any statistic touches**, which is the same promise
 * `DeclaredEffect` makes everywhere else it appears.
 */
export type DeclarationEvent = {
  kind: "declaration";
  /**
   * The combatant the message names, where it names one. `step` and `prepare`
   * always name their actor; `txt` and `+exp` name nobody at all.
   */
  combatantId: number | null;
  declared: DeclaredEffect[];
};

/**
 * Health the protocol says moved, in an amount this meter cannot put on anybody.
 *
 * ⚠️ **The third state, and the one whose absence kept `healall_per` unread.**
 * Until this existed a key was either read — which promises nothing is missing —
 * or unread, which says only *no meaning yet*. `healall_per` is neither: it is
 * understood in every respect, and the health it restores is stated nowhere else
 * in the protocol, so reading it as anything else would have taken the warning
 * off a total that really is short.
 *
 * What it carries is deliberately not a figure of health. The share is stated,
 * the recipients are not, and the amount would need a cap the material refuses
 * once in twelve — so the honest reading is *this much is missing from the
 * healing, and we cannot say whose*. The panel says exactly that.
 */
export type UnaccountedHealthEvent = {
  kind: "unaccounted-health";
  /** The key that states health moved. */
  source: string;
  /**
   * Whom the protocol named. For `healall_per` that is the caster, never the
   * healed — which is the whole difficulty, and why no figure lands on a row.
   */
  combatantId: number | null;
  /** The share the protocol states, where it states one. Never health. */
  declaredShare: number | null;
};

export type FightOutcomeEvent = {
  kind: "fight-outcome";
  result: "won" | "lost";
  /**
   * Named by the protocol as text, not by id. Which of these is "us" is not
   * knowable from the message alone.
   */
  combatantNames: string[];
};

export type UnknownMessageEvent = {
  kind: "unknown-message";
  /** The message exactly as the protocol delivered it, so the panel can show it. */
  message: string;
  /** Why it was not understood: unreadable grammar, or keys with no meaning yet. */
  reason: string;
  /**
   * The keys with no meaning yet, exactly as the protocol wrote them, one entry
   * per occurrence.
   *
   * **Empty is a claim of its own**: the grammar itself was unreadable, or the
   * message carried no parameters at all, so there is no key to name. It never
   * means "nothing was unread" — this event exists only where something was.
   *
   * Carried as keys and not only as the prose in `reason` because a reader asking
   * *what is my total missing* can act on a key and cannot act on a sentence:
   * a key can be looked up in `docs/protocol-keys.md`, counted across a fight,
   * and reported to us verbatim.
   */
  unreadKeys: readonly string[];
};

export type BattleEvent =
  | AttackEvent
  | DamageToNamedCombatantEvent
  | HealthChangeEvent
  | SkillUsedEvent
  | DeclarationEvent
  | UnaccountedHealthEvent
  | FightOutcomeEvent
  | UnknownMessageEvent;

/**
 * Every variant the union currently holds. Kept as a value because the guard
 * has to iterate it at runtime; `satisfies` is what stops it drifting from the
 * type.
 */
export const BATTLE_EVENT_KINDS = [
  "attack",
  "damage-to-named-combatant",
  "health-change",
  "skill-used",
  "declaration",
  "unaccounted-health",
  "fight-outcome",
  "unknown-message",
] as const satisfies
  readonly BattleEvent["kind"][];
