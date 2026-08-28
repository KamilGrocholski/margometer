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
 * **Not derivable from `dealt` minus `taken`.** Measured over every captured
 * message that carries one: the difference equals the sum of these figures in a
 * minority of them and **exceeds it in all the rest, never falling below it**.
 * Armour and resistance reduce as well and the protocol reports neither, so the
 * remainder is real and unattributable — reading the gap as absorption would
 * state a number nobody sent. Stated as a direction rather than as a tally
 * because the tally is a figure with no date on it (§3);
 * `tests/core/battle-event.test.ts` re-measures the direction on whatever
 * material is there.
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
  /**
   * The health the protocol states for each of them, as a share of their maximum,
   * once this blow is in.
   *
   * Carried rather than dropped because it is the only thing in a fight that can
   * *contradict* a running health total: everything else here is a movement we
   * read, and a movement we failed to read leaves no trace at all. The protocol
   * restates where a combatant actually stands every time it names them, which is
   * how `src/core/combatant-health.ts` can tell a total that drifted from one that
   * did not (`docs/protocol-keys.md`, on the client applying these before it looks
   * at a single key).
   *
   * Null where the protocol stated a bare id, which it does for one side of a
   * message routinely.
   */
  actorHealthPercent: number | null;
  targetHealthPercent: number | null;
  /** Before reduction — what the attacker put out. */
  dealt: DamageAmount[];
  /**
   * After reduction — what the target actually lost. Measured at `c2aa329`, when
   * the two readings were first told apart and the tree held 2 recordings: health
   * drop matched the sum of these in 22 of 26 comparisons and the sum of `dealt`
   * in none of them. `tests/core/health-witness.test.ts` has re-earned it on
   * every recording since, which is why the figure does not need restating —
   * it is the day the reading was decided, not a running total (§3).
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
 * Healing the protocol reports against a **name** rather than an id, on a
 * message whose actor and target are somebody else's fight.
 *
 * The mirror of `DamageToNamedCombatantEvent` and separate from it for the
 * reason that variant exists at all: the figure belongs to a combatant the
 * message does not put in either slot, so it needs the name and what a roster
 * could make of it. Splitting healing from damage rather than signing one
 * variant follows the protocol — the two arrive under keys with nothing in
 * common, and the client reads their values differently.
 *
 * **No actor in the message, and the giver is not read from one.** The actor is
 * whoever struck the blow this rode in on, so crediting them would be inventing a
 * healer the log does not name (§5) — and four of the five occurrences ride a
 * group blow whose target is a third party, so the other slot is wrong too.
 *
 * ⚠️ **The giver is the combatant this event names, and that took a rule change.**
 * The help says the bonus is the *holder's* own and that the holder is the one
 * healed, so both ends are one person. This comment used to argue the opposite —
 * that documentation about a mechanic is not something the protocol states, so
 * nobody may be credited — and the argument had a hole in it: the panel was not
 * silent about the giver, it drew `Nieznany sprawca`, *the game does not say who
 * healed*. That is a claim about the game and a false one (§3). §9.6's third
 * clause is what the choice actually was
 * (`docs/specs/the-ends-a-figure-names.md`); the fill happens
 * in `fight-statistics.ts`, off `SELF_SOURCED_HEALING_KEYS`, so this event keeps
 * stating only what the message did.
 *
 * **No announcement either.** This fires on damage taken, not on a skill used,
 * so gluing it to the announcement standing over the message would credit the
 * attacker's skill with healing its own victim.
 */
export type HealingToNamedCombatantEvent = {
  kind: "healing-to-named-combatant";
  targetName: string;
  /** Who that name belongs to, once a roster could say — null on all three ways it cannot. */
  targetId: number | null;
  /** Health the protocol states for that combatant once this healing is in. */
  targetHealthPercent: number | null;
  amount: number;
  /** The protocol key as written, so a row can say which effect restored this. */
  source: string;
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
  /**
   * The health the protocol states for that combatant once this movement is in,
   * as a share of their maximum. Null where it stated a bare id.
   *
   * The same reading as `AttackEvent`'s, and here for the same reason.
   */
  healthPercent: number | null;
  /**
   * The protocol key as written.
   *
   * ⚠️ **Who caused it is not in this message, and for one key it is in an earlier
   * one.** A wound ticks with nobody in the other slot and the blow that applied it
   * named both ends, so `src/core/fight-statistics.ts` charges the tick to that
   * attacker where the figure identifies the application (§9.6). Nothing is added
   * to this event for it: the key and the figure are all the join needs, and a
   * field here would put the same reading in two places.
   */
  source: string;
  /**
   * What the key stated **beside** the health figure, where it stated anything.
   *
   * The value of this family may carry a second comma-separated member, and the
   * client renders a different sentence when it does. Its **shape** is settled —
   * production build `1786441768914` shows its magnitude and derives *increased*
   * or *decreased* from its sign — and its **subject** is not: which quantity
   * changed is named only in the sentence, which the client fetches at run time.
   * `heal`, `poison` and `fire` all carry one, and the material holds hundreds.
   *
   * ⚠️ **This said "two occurrences in the whole material" and was false long
   * before anybody noticed** — a figure over the captures with nothing dating it,
   * which is the fault §3 now names. It survived two audits because a wrong count
   * reads exactly like a right one.
   *
   * It is carried rather than read, on the one thing that **is** measured: the
   * health arithmetic closes on every call carrying one, and on the very messages
   * that carry it, so whatever the member states, it is not health. That is the whole of
   * what a `DeclaredEffect` claims (`docs/protocol-keys.md`).
   */
  declared: DeclaredEffect[];
  /**
   * The skill this movement was glued to.
   *
   * The only place in this **event** a healer can come from: the key states who was
   * healed and never who did it. Measured on
   * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`, 248 814 of the
   * 346 284 points restored carry an announcement.
   *
   * ⚠️ **Where nothing announced it, the key can still answer, and this field is
   * asked first.** Three keys are the healed combatant's own effect on the help's
   * word, so `fight-statistics.ts` falls back to `SELF_SOURCED_HEALING_KEYS`
   * (§9.6). An announcement wins over that fallback, because a giver the protocol
   * stated beats one read off documentation — which is why the order is stated
   * here rather than left to whichever branch is written first.
   */
  announced: AnnouncedSkill | null;
};

/**
 * Something the protocol states that **no total here counts**.
 *
 * Three kinds qualify, and the register says which each key is:
 *
 *   - an **input** rather than an outcome — what a skill costs, what it grants,
 *     the share by which a blow was already weakened before it was reported;
 *   - an outcome in a **unit this meter does not keep** — energy returned, attack
 *     speed slowed, combination points spent;
 *   - an outcome **outside the fight this meter is scoped to**, whatever its
 *     unit. `afterheal` is the one, and it is the only member in a unit that is
 *     kept: a talisman restores health once the battle is over. The help gives
 *     the arithmetic as `min(afterheal, hp start - hp current)` and puts it after
 *     the fight (article view,372, read 2026-08-09); every occurrence arrives
 *     after `winner`/`loser`; and the payload's own snapshots do not move,
 *     with each recipient well below their maximum. A meter whose unit is
 *     the fight counts it nowhere — but it is read, so the figure is on screen
 *     rather than absent.
 *
 * ⚠️ **Nothing downstream may total one.** `alllowdmg=5` says a skill lowers the
 * opposing side's damage by a share; it does not say anybody's damage fell, and
 * by how much is a question the later blows answer on their own, already reduced.
 * `-poison_lowdmg_per=10` is the same shape from the other end: the figures beside
 * it have it applied, so adding it anywhere would subtract a reduction twice.
 *
 * ⚠️ **The test a key must pass to land here**, and it is not "we understand it":
 * *whatever this figure did, is it reported elsewhere, or in a unit no total here
 * keeps, or outside the fight?* `healall_per` is the key that fails it — the health it
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
 * version of this comment claimed both. Measured on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`:
 * none of its 197 announcements carries a key of the damage *family*, which is
 * what had been checked — but 33 of them carry a figure all the same, 24 as
 * `+oth_dmg` and 9 as a key the register lists as moving health, in the same
 * message as the skill name.
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
   * Often the actor itself, and sometimes nobody: of that same capture's 197
   * announcements, 44 name the user in both slots and 15 name no target at all.
   */
  targetId: number | null;
  /**
   * The health the protocol states for each of them, as a share of their maximum.
   *
   * An announcement carries no figure of its own, so this looks like the last
   * place worth reading one — and it is the **first** thing a fight says about
   * most combatants. `src/core/combatant-health.ts` unwinds what somebody entered
   * a fight with from the earliest statement about them, and in a capture whose
   * opening carries the whole fight, five of eleven combatants are first named by
   * an announcement and nothing else.
   */
  actorHealthPercent: number | null;
  targetHealthPercent: number | null;
  /**
   * As the protocol states it, which is the name the player's own client shows
   * — so it arrives in their language and is never stored here (NOTICE.md).
   */
  skillName: string;
  /**
   * The game's own identifier, where the message carried one. Null on 15 of that
   * capture's 197 announcements, which is why the name is what this event is
   * built on.
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
  /**
   * The health the protocol states for that combatant, as a share of their
   * maximum. Read for the same reason an announcement's is: `step` names somebody
   * and states where they stand, and that is often the earliest thing a fight says
   * about them (`src/core/combatant-health.ts`).
   */
  healthPercent: number | null;
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
  /**
   * The skill the game glued this cast to.
   *
   * Every occurrence in the captures carries one — the key only ever arrives on a
   * `tspell` announcement — so this is what puts a sized cast on its skill's row
   * rather than on no skill at all.
   */
  announced: AnnouncedSkill | null;
};

/**
 * Healing the protocol stated about a whole **side**, sized onto its members.
 *
 * ⚠️ **Derived, and the only event here that is.** Everything else in this union
 * is a reading of something the protocol wrote down; this is the game's own
 * published arithmetic applied to three figures the protocol does not state —
 * maximum health, the health the fight was entered with, and the health each
 * member held at the moment. That is why it is a kind of its own rather than a
 * handful of `health-change`s: a `health-change` promises a figure the game
 * stated, and folding these in would put a derivation behind that promise with
 * nothing able to tell them apart again.
 *
 * It is produced by `src/core/combatant-health.ts` and by nothing else — never by
 * the decoder, which sees only messages and would have to be told the three
 * figures it cannot know.
 *
 * ⚠️ **It does not replace `unaccounted-health` unless every member was sized.**
 * A cast that reached eight side-mates and could be sized for six emits this
 * carrying the six *and* leaves the unaccounted event standing, so a partial
 * answer can never be read as a whole one (§9.6).
 */
export type TeamHealEvent = {
  kind: "team-heal";
  /** The caster, read from the message's actor slot — never from its target. */
  casterId: number;
  /** The protocol key the share was stated on. */
  source: string;
  /** The share the protocol stated, already weakened by the game. */
  declaredShare: number;
  /**
   * What was restored, per combatant. Never empty: a cast this meter could size
   * for nobody produces no event of this kind at all, because a map of nothing is
   * indistinguishable from a heal that healed nothing.
   */
  restoredByCombatantId: ReadonlyMap<number, number>;
  announced: AnnouncedSkill | null;
};

export type FightOutcomeEvent = {
  kind: "fight-outcome";
  /**
   * `"drawn"` is the fight ending with no winner at all, which the protocol
   * states on the winners' own key rather than a key of its own — see the
   * decoder. It is not a third side; it is the absence of the other two.
   */
  result: "won" | "lost" | "drawn";
  /**
   * Named by the protocol as text, not by id. Which of these is "us" is not
   * knowable from the message alone.
   *
   * **Empty for `"drawn"`**, where the protocol names nobody — and empty is the
   * whole of what it says there, so a reader must not take an empty list for a
   * side it failed to read.
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
  /**
   * The ends the message itself named — its actor slot, its target slot, in
   * protocol order and without a repeat where both segments state one combatant.
   *
   * Read off `ProtocolMessage`'s two side segments and nowhere else. That is what
   * makes a mark on somebody's row a reading rather than a guess: the grammar
   * states the ends before it states a single key, so a message given up on for a
   * key it does not know still knows exactly whom it was about.
   *
   * **Empty is a claim, and it is the same claim twice**: the grammar failed
   * before there were slots to read, or the message wrote `0` at both ends. It
   * never means nothing was unread — like `unreadKeys` above, this event exists
   * only where something was.
   */
  combatantIds: readonly number[];
};

export type BattleEvent =
  | AttackEvent
  | DamageToNamedCombatantEvent
  | HealingToNamedCombatantEvent
  | HealthChangeEvent
  | SkillUsedEvent
  | DeclarationEvent
  | UnaccountedHealthEvent
  | TeamHealEvent
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
  "healing-to-named-combatant",
  "health-change",
  "skill-used",
  "declaration",
  "unaccounted-health",
  "team-heal",
  "fight-outcome",
  "unknown-message",
] as const satisfies
  readonly BattleEvent["kind"][];
