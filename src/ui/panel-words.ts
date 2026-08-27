/**
 * Everything the panel puts in front of a reader: a name of the game's own turned
 * into a label, the sentences said where the game named nobody, and a number as
 * text.
 *
 * One subject — the panel's vocabulary as a player meets it — and it was three
 * files. What decides the split that matters is not which of the three a string
 * came from but §3's line, which holds across all of them: **the strings are
 * Polish and nothing else here is.** A sentence a player reads never carries our
 * vocabulary. It says what cannot be known, not why our reader cannot know it,
 * and never a key of the game's or a word of ours.
 *
 * Who names a thing is the one rule worth keeping in sight: the running client
 * where it has a name for the thing, and this repository where it has not. A
 * token nobody has named travels as the game wrote it rather than as a guess
 * (§5 — unknown is allowed, a guessed name is not).
 */

import { composeIntegerText } from "@/libs/number.ts";
import {
  getMetricNoun,
  type PanelFightOutcome,
  type PanelMetric,
  type PanelNoun,
  type PanelStorageChoice,
} from "@/src/ui/panel-screen.ts";

/** How a token is named, in the two places a name can come from. */
export type TokenName = {
  /**
   * The client's identifier for this name, or null where the dictionary holds
   * no name for it — only a sentence, or only a bare figure.
   */
  id: string | null;
  /** Ours. What the player reads when the client cannot answer. */
  fallback: string;
};

/**
 * A name out of the running client, or null.
 *
 * Declared here rather than imported: §9.1 names no direction from `ui` to
 * `game`, so the panel says what it needs and the entry point supplies it.
 */
export type TranslateLabel = (id: string) => string | null;

/**
 * The client keeps these in its `eq_prof` category, as capitalised headings for
 * a character sheet. A row in a ranking is not a heading, so these stay ours.
 */
export const PROFESSION_NAMES: Record<string, TokenName> = {
  w: { id: null, fallback: "wojownik" },
  p: { id: null, fallback: "paladyn" },
  t: { id: null, fallback: "tropiciel" },
  h: { id: null, fallback: "łowca" },
  m: { id: null, fallback: "mag" },
  b: { id: null, fallback: "tancerz ostrzy" },
};

/**
 * The letter in a damage key, in the player's words.
 *
 * ⚠️ **Not a taxonomy of elements, though it reads like one.** The game answers
 * three different questions with this one letter and picks whichever it has:
 * element (`f`, `l`, `c`), weapon or slot (none, `d`, `o`), reach (`g`), and
 * `a` for damage nothing reduces. So a figure keyed `dmgg` has no element we
 * know — the label says what the game said, not what we wish it had.
 *
 * All ours, and the sentence that used to earn that was wider than the reading
 * behind it: it said the client names no element **anywhere**. What is true is
 * narrower and is the half that matters here — the **battle log** names none. It
 * composes a damage line out of the figure and the recipient and spends the kind
 * on a CSS class.
 *
 * ⚠️ **Elsewhere the client does label damage kinds, and they are still not
 * these.** A character's statistics panel carries a row per kind, each labelled
 * from the `stat-damage-…` family (production build `1786514810315`). Six of the
 * nine tokens below have a counterpart there and three have none; the family also
 * carries a row for poison, which in this protocol is a health-loss key and no
 * element at all. And the six are worded for that panel rather than for a row of
 * ours: they agree with the noun *attack*, or say which source the damage comes
 * *from*, where every entry below is a quantity of *obrażenia*. A table half
 * filled from it would put two grammars in one column, which is the fault the
 * paragraph above is about in a different guise.
 *
 * `thirdatt` is ours for a second reason — its own entry resolves to `+%val%`, a
 * hole and no name — so its name comes from the help, which calls it the Third
 * Blow under the engine name `of-thirdatt` (article view,372, read 2026-08-09).
 */
export const ELEMENT_NAMES: Record<string, TokenName> = {
  dmg: { id: null, fallback: "fizyczne" },
  dmgd: { id: null, fallback: "dystansowe" },
  dmgo: { id: null, fallback: "broń pomocnicza" },
  dmgf: { id: null, fallback: "ogień" },
  dmgc: { id: null, fallback: "zimno" },
  dmgl: { id: null, fallback: "błyskawica" },
  dmga: { id: null, fallback: "nieuchronne" },
  // The element the help gives as damage from poison: the blow puts physical
  // damage in and applies poison behind it (article `view,372`, engine name
  // `dmgp`, read 2026-08-26). The word this took is the one the tick below used
  // to carry, and the tick moved rather than this one — the pattern the whole
  // table follows: the element is the plain noun, the thing ticking afterwards is
  // what it does.
  dmgp: { id: null, fallback: "trucizna" },
  dmgg: { id: null, fallback: "globalne" },
  thirdatt: { id: null, fallback: "trzeci cios" },
};

/**
 * Effects that fire with a blow. The protocol states the token and stops, and
 * this is the one family the client does name — every entry here is a name in
 * the dictionary rather than a sentence, which is why every entry has an id.
 */
export const EFFECT_NAMES: Record<string, TokenName> = {
  crit: { id: "msg_+crit", fallback: "cios krytyczny" },
  of_crit: { id: "msg_+of_crit", fallback: "cios krytyczny bronią pomocniczą" },
  legbon_verycrit: { id: "msg_+legbon_verycrit", fallback: "cios bardzo krytyczny" },
  evade: { id: "msg_-evade", fallback: "unik" },
  fastarrow: { id: "msg_+fastarrow", fallback: "szybka strzała" },
  contra: { id: "msg_-contra", fallback: "kontratak" },
  pierce: { id: "msg_+pierce", fallback: "przebicie" },
  pierceb: { id: "msg_-pierceb", fallback: "zablokowane przebicie" },
  stun: { id: "msg_+stun", fallback: "ogłuszenie" },
  // The monster's own stun, in the arrow-shaped one of the five variants the
  // client spells. A separate entry rather than a second name for the one above:
  // `docs/protocol-keys.md` records them as different keys off different
  // statistics, and folding them would count one effect under the other's label.
  "stun2-d": { id: "msg_+stun2-d", fallback: "potężne ogłuszenie strzałą" },
  // The bare member of that same family, off the same statistic. The word drops
  // only the shape: the help gives `stun2` as costing the Player two turns where
  // `stun` above costs one, which is what "potężne" carries in the entry beside
  // it (article `view,372`, engine name `stun2`, read 2026-08-25).
  stun2: { id: "msg_+stun2", fallback: "potężne ogłuszenie" },
  // The frost-shaped member of that family, and the word has to differ from the
  // bare one above for the reason every entry here differs: two variants under
  // one label would stand over two counts. Which of the five it is comes from
  // the development build `1781609507010`, which keeps the rendered sentence in
  // a comment beside the branch; production `53XkBRxF` composes `msg_+stun2-c`
  // and carries no wording to confirm it with, so the id is what a player
  // actually reads and this phrase is ours (§7.6).
  "stun2-c": { id: "msg_+stun2-c", fallback: "potężne ogłuszenie mrozem" },
  // What a blow announces when it applies the wound whose ticks the loss table
  // below carries. Two words for one effect on purpose: this counts blows that
  // applied it and that one counts the health it took, so a shared label would
  // stand over two quantities — the fault the whole of this file's guard exists
  // for.
  wound: { id: "msg_+wound", fallback: "nałożona głęboka rana" },
  freeze: { id: "msg_+freeze", fallback: "zamrożenie" },
  legbon_curse: { id: "msg_+legbon_curse", fallback: "klątwa" },
  legbon_cleanse: { id: "msg_-legbon_cleanse", fallback: "płomienne oczyszczenie" },
  legbon_glare: { id: "msg_-legbon_glare", fallback: "oślepienie" },
  // The client renders this one through a sentence named for `dispel` rather
  // than for the key, which `docs/protocol-keys.md` already records. What that
  // sentence says is not what our phrase used to: a special blow is
  // interrupted, and no spell is dispelled.
  "superspell-dispel": { id: "msg_+dispel", fallback: "przerwany cios specjalny" },
  acdmg_destroyed: { id: "msg_+acdmg_destroyed", fallback: "pancerz zniszczony do końca" },
  tenacity: { id: "msg_-tenacity", fallback: "wytrwałość" },
};

/**
 * The two tokens the panel counts on their own, spelled here and read there.
 *
 * A critical hit is counted in the counters line and **must not** be repeated in
 * the effects line beside it, so two places have to agree about what a critical
 * hit is called. Both were spelled where they were used — twice each, two of them
 * having to match the other two — and every spelling could be changed with the
 * gate green: the counter reads nothing while the effect list grows a row, or the
 * same hits are counted twice
 * (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F1). The game chose
 * these names, so §9.3 puts them in one place and a guard holds that place to
 * `EFFECT_NAMES` above (`tests/ui/panel-words.test.ts`).
 */
export const CRITICAL_TOKEN = "crit";
export const VERY_CRITICAL_TOKEN = "legbon_verycrit";

/** Both, for a reader that wants them out of a list rather than counted. */
export const CRITICAL_EFFECT_TOKENS: readonly string[] = [CRITICAL_TOKEN, VERY_CRITICAL_TOKEN];

/**
 * The log entry for each is a sentence: it names the defence, then the figure it
 * took off and the damage it took it off. A name with the figure cut out of it is
 * not a label, so there is nothing in it to ask for.
 *
 * ⚠️ **The client does hold a bare label for each of these, and it names the
 * other thing.** A combatant's defence rows are labelled from the `def-…`
 * family — the one `heal` is asked through further down (production build
 * `1786514810315`). Those name the **statistic**: how much this combatant
 * absorbs, that they have a block at all. A row here is the damage one of them
 * stopped on a particular blow, which is a figure and not a stat, and that is why
 * every word below is a participle. Asking for the label would put the name of a
 * capacity over a measurement of what it did.
 */
export const DEFENCE_NAMES: Record<string, TokenName> = {
  absorb: { id: null, fallback: "pochłonięte" },
  absorbm: { id: null, fallback: "pochłonięte magicznie" },
  blok: { id: null, fallback: "zablokowane" },
};

/**
 * The one destroyed statistic stated in **percentage points** rather than in
 * points, which is what decides whether the figure is drawn with a `%`. Spelled
 * here for `EFFECT_NAMES`'s reason and held to the table below the same way.
 */
export const PERCENT_DESTRUCTION_TOKEN = "resdmg";

/**
 * Sentences too. Worth naming what changed anyway: the `_per` pair is announced
 * as destroying **absorption**, not the "osłona" this table used to invent for
 * it, and `acdmg` is the figure whose floor `acdmg_destroyed` announces — two
 * quantities that used to share one label.
 *
 * ⚠️ **One of the four has a bare label in the client after all**, in the
 * statistics family rather than in the log: `stat-acdmg`, which says what this
 * table's `acdmg` says already (production build `1786514810315`). Its neighbour
 * `stat-acmdmg` is not this table's `resdmg` — it is keyed on a statistic the
 * battle protocol never sends, and `tests/frozen-protocol-keys.ts` is where that
 * can be checked rather than assumed from the spelling. The `_per` pair has no
 * counterpart at all. So there is exactly one row here that could be handed to
 * the client, it would draw the same word in Polish and the player's own in any
 * other language, and whether to hand it over is a decision about what a player
 * reads rather than a fault to close quietly.
 */
export const DESTRUCTION_NAMES: Record<string, TokenName> = {
  acdmg: { id: null, fallback: "niszczenie pancerza" },
  resdmg: { id: null, fallback: "niszczenie odporności magicznych" },
  abdest_per: { id: null, fallback: "zniszczona absorpcja" },
  abmdest_per: { id: null, fallback: "zniszczona absorpcja magiczna" },
};

/**
 * Where health went when no blow moved it — **two tables, one per direction.**
 *
 * ⚠️ **One key is in both, and that is the whole reason for the split.**
 * `docs/protocol-keys.md` records that the client states a health *loss* under
 * `heal` with a negative figure, and the captures carry it: measured over
 * `tests/captured-fights/`, the loss side holds `poison`, `fire`, `injure` and
 * `heal`, the gain side holds `heal`, `heal_target`, `legbon_holytouch_heal` and
 * `legbon_lastheal` — `heal` alone on both. Named once for both, one word stood
 * over health that rose and health that fell on the damage screens, which is the
 * fault the comment on `fire` below already names: **two quantities under one
 * label is a wrong number that looks right.** They are the same effect, so what
 * the two tables keep apart is the direction and never the mechanism.
 *
 * Neither table is a list of what the game may send: `getPhrase` falls back to the
 * token itself, so an unnamed key still reaches the panel as the game wrote it.
 * What the tables are held to is being exhaustive over the *material*, which
 * `tests/ui/panel-words.test.ts` re-measures off the captures rather than listing.
 */
export const HEALTH_LOSS_SOURCE_NAMES: Record<string, TokenName> = {
  // Not "trucizna", which is `dmgp`'s word above for the damage element: this is
  // the poisoning ticking afterwards, and two quantities under one label is a
  // wrong number that looks right — the same split `fire` and `light` carry a few
  // lines down. It **was** "trucizna" for as long as no recording carried the
  // element; `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon.json`
  // brought one, and the pair had to part the way the other two already had.
  poison: { id: null, fallback: "zatrucie" },
  // Not "ogień", which is `dmgf`'s word above for the damage element: this is the
  // burn ticking afterwards, and two quantities under one label is a wrong number
  // that looks right. The client's own entry for it is a sentence with two holes,
  // so there is no name to ask it for.
  fire: { id: null, fallback: "podpalenie" },
  // The same split one element over: `dmgl` above is "błyskawica", the damage a
  // blow of that element lands, and this is what goes on crackling afterwards.
  // The client's entry for it is a sentence with two holes, like `fire`'s, so
  // there is no name to ask it for either.
  light: { id: null, fallback: "porażenie" },
  // The old phrase was "rana", which is the game's word for `wound` — a
  // different key, and one this meter also reads. That key is the entry below,
  // and the two words have to stay apart: they are separate damage types with
  // separate rules, and one label over both is a wrong number that looks right.
  injure: { id: null, fallback: "zranienie" },
  // The deep wound a weapon applies, ticking after the blow that announced it.
  // No id, because the client's entry for the tick is a sentence with holes in it
  // — the announcement above is the one with a name to ask for.
  wound: { id: null, fallback: "głęboka rana" },
  /**
   * The gain side's `heal` below zero — the same effect, draining.
   *
   * ⚠️ **It read `ujemne leczenie` because nothing accounted for the minus, and
   * something does.** The help states this statistic's accumulated value as the sum
   * of `heal` and `adest` over equipment and blessings, and `adest` as an item
   * bonus that lowers the owner's share of it (`pomoc.margonem.pl`, article
   * `view,372`, engine names `heal` and `adest`, read 2026-08-22). Past zero the
   * effect runs the other way, so the word may name the mechanism instead of
   * standing off from it — the earlier phrase was right to refuse a reason nobody
   * had, and there is one now.
   *
   * Measured over `tests/captured-fights/` on 2026-08-22: a negative `heal` is in
   * the eight Hildur recordings and in no other, on one combatant per fight, at a
   * magnitude that does not vary across the fights that combatant appears in — 92
   * and 101. It falls toward zero by 5% of that initial value per trigger, which is
   * the decay the help states for `heal`, and reaches it in the twenty triggers
   * each recording holds. One of the two carries none of it in an earlier fight, so
   * it follows the equipment rather than the character or the opponent.
   *
   * ⚠️ **The help and the material disagree on one point, and §7.6 keeps the
   * disagreement rather than settling it:** that same section states the
   * accumulated value cannot fall below zero, and the recordings held on 2026-08-22
   * carry it at −92 and −101 for twenty triggers apiece.
   */
  heal: { id: null, fallback: "ujemne przywracanie życia" },
  // The bleed a legendary bonus lays on the target of a blow, ticking for five
  // turns afterwards. The word names the bleeding and not the bonus: the bonus
  // has a name of the game's, and the row is about the health going out of the
  // combatant, the way `fire` above is about the burning rather than about the
  // fire element. No id — the client's entry for the tick is a sentence with
  // holes in it, and the announcement carries no figure worth naming a row for.
  anguish: { id: null, fallback: "krwawienie" },
};

export const HEALTH_GAIN_SOURCE_NAMES: Record<string, TokenName> = {
  /**
   * ⚠️ **Not somebody healing somebody — a statistic of the combatant it names.**
   * The help documents `heal` as an effect over time laid on the Character, firing
   * before the action of the Player it is assigned to and restoring that
   * Character's own health, and heads its section with the game's own name for the
   * mechanic (`pomoc.margonem.pl`, article `view,372`, engine name `heal`, read
   * 2026-08-22). Under `leczenie` it stood beside the two keys below, which really
   * are one combatant healing another, and nothing on the row said the difference.
   *
   * **The one entry of this family the client states as a name.** `def-heal` is
   * what it labels the `heal` row of a warrior's statistics with, so it carries no
   * hole and comes back as a label rather than as a sentence (production build
   * `1786514810315`). That is what makes an id possible here at all: the phrase
   * beside it is ours, and a player reads their own client's wording in their own
   * language (NOTICE.md).
   */
  heal: { id: "def-heal", fallback: "przywracanie życia" },
  // `msg_heal_target %target% %val%` — a sentence about a named combatant being
  // healed, so there is no label to ask for and the word is ours (production build
  // `1786514810315`). It follows the verb that sentence is built on, which is not
  // the one the row above wants: this key is a heal somebody cast, and that one is
  // the caster's own statistic (dictionary read on production `1785244275300`).
  heal_target: { id: null, fallback: "uleczenie wskazanego" },
  // Its own id resolves to a sentence; the proc that causes it resolves to the
  // effect's name, and the name is what a row wants. The register ties the two
  // keys already, so this is a reading rather than a guess.
  legbon_holytouch_heal: { id: "msg_+legbon_holytouch", fallback: "dotyk anioła" },
  legbon_lastheal: { id: null, fallback: "ostatni ratunek" },
  // The client's own entry is `msg_healall_per %name% %val%` — a sentence with two
  // holes rather than a name, so there is nothing to ask the dictionary for
  // (production build `1786514810315`). It is worded about the caster's **allies**
  // rather than about a whole team, and the phrase follows it: a side in this
  // protocol is a bare number and its members are who the effect reached
  // (dictionary read on production `1785244275300`).
  healall_per: { id: null, fallback: "uleczenie sojuszników" },
  // The client composes this one with `msg_heal_target`, the same sentence
  // `heal_target` above gets, so its own entry is a sentence with holes and there
  // is nothing to ask the dictionary for (production build `1786514810315`).
  // The word is ours and it has to differ from that row's: this is a monster
  // restoring its own health, not somebody healing somebody, and one label over
  // both would put a monster's own recovery under a heal that was cast.
  npc_heal: { id: null, fallback: "regeneracja potwora" },
  // The client's own entry is `msg_aura-bandage %val% %name%` — a sentence with
  // two holes rather than a name, so there is nothing to ask the dictionary for
  // (production build `53XkBRxF`). The word names what the player did and not
  // the skill that did it: the row stands over every use of the effect, and the
  // skill's own name rides the announcement beside it.
  bandage: { id: null, fallback: "bandażowanie" },
};

/**
 * A name for a token: the client's, then ours, then the token itself.
 *
 * The last rung is deliberate and is the whole reason this is one function: the
 * game can send something we have never named, and a row that vanished or read
 * "nieznane" would hide a real figure behind our own ignorance. What the player
 * sees then is ugly and true.
 */
export function getPhrase(
  names: Record<string, TokenName>,
  token: string,
  translate: TranslateLabel | null,
): string {
  const name = names[token];
  if (name === undefined) return token;
  const stated = name.id === null || translate === null ? null : translate(name.id);
  return stated ?? name.fallback;
}

/**
 * The two rows' names, wherever they stand.
 *
 * ⚠️ **They were one row called `Bez sprawcy`, and the name was the smaller half
 * of what was wrong.** The protocol leaves a hole at one end or the other — an
 * actor with no target, a target with no actor — and one row cannot say which,
 * so the figure that had no name for *who* stood beside a figure that had no name
 * for *whom* and both were called the same thing. Two rows, two names, and the
 * team derived from whichever end the game did state
 * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`).
 *
 * Neither says "bez", because neither is a figure the panel failed to place: it
 * knows the team, it does not know the person.
 */
export const NO_ACTOR_LABEL = "Nieznany sprawca";
export const NO_TARGET_LABEL = "Nieznany cel";

const NOBODY_DEALT_NOTE = "Gra nie mówi, kto to zadał — wiadomo tylko, że życia ubyło.";
const NOBODY_HEALED_NOTE = "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.";
const NOBODY_STRUCK_NOTE = "Gra nie mówi, w kogo — wiadomo tylko, że cios wszedł.";
const NOBODY_TENDED_NOTE = "Gra nie mówi, komu — wiadomo tylko, że leczenie weszło.";

/**
 * Where a figure stands when no row above holds it. One sentence, because the
 * answer does not vary: a row nobody carries stands apart from the list.
 */
const APART_NOTE = "Nikt tego nie ma na swoim wierszu — dlatego stoi osobno.";

/** What the game did not say, per noun. The limit, never our reason for it. */
const PINNED_LIMIT_NOTES: Record<PanelNoun, string> = {
  damage: NOBODY_DEALT_NOTE,
  healing: NOBODY_HEALED_NOTE,
};

export function getNoActorLimitNote(metric: PanelMetric): string {
  return PINNED_LIMIT_NOTES[getMetricNoun(metric)];
}

/**
 * Where the figure stands against the list above it — the sentence that decides
 * whether a reader may add it to what they have just read.
 *
 * Under a given direction the rows are the actors and nobody claims this, so the
 * shares really do come to a hundred with it included. Under a received one the
 * rows are the people it reached, so it is already among them and the shares on
 * that screen overlap. Four sentences and not two: the compiler counts the rows,
 * and the screen that had neither of them said nothing at all.
 */
const PINNED_STANDING_NOTES: Record<PanelMetric, string> = {
  dealt: APART_NOTE,
  taken: "Te obrażenia są już policzone wyżej, u tych, którym ubyło życia.",
  healingGiven: APART_NOTE,
  healed: "To leczenie jest już policzone wyżej, u tych, którzy je dostali.",
};

export function getNoActorStandingNote(metric: PanelMetric): string {
  return PINNED_STANDING_NOTES[metric];
}

/**
 * What the figure covers once the reader has picked a side — **and the direction
 * decides it, because only one of the two can be narrowed at all.**
 *
 * Under a **received** direction the list is the people the health moved on. The
 * game names them and the roster puts them on a side, so the figure narrows the
 * same way the list does and the sentence says which end it was counted by.
 *
 * Under a **given** direction there is no actor; that is what the row is. So no
 * tab narrows the figure and it stands outside the list's own arithmetic — no
 * bar, no bracket. **This sentence is what the missing bracket says in words**,
 * and it is the whole of what tells the reader the figure beside it is the
 * fight's rather than this team's.
 *
 * ⚠️ **Both given sentences used to end "nie należy do żadnej drużyny", and the
 * bar under them now says otherwise.** A figure with no actor still has the side
 * the game named at the *other* end, and `composeSides` charges it there
 * (`docs/specs/2026-08-18-a-tick-nobody-swung-still-has-a-side.md`). The limit
 * that is left is the one that was always the true half: no combatant carries it,
 * so no row above can be read as holding any of it. The sentence says where it
 * did go instead, because a reader who finds the same points inside `My` one
 * region down is owed that and not left to work it out.
 *
 * ⚠️ **The four used to be two, one per noun, and that is what broke.** A given
 * screen and a received one said the same thing about a figure that had been
 * narrowed by the victim on both — so `Zadane · Oni` pinned what that side *lost*
 * over a list of what it *dealt*, and put it in the denominator: 38.7% of one
 * screen, and 100% of `Leczenie dane · Oni`
 * (`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`).
 *
 * Four entries rather than two, for the reason every table in this file has four:
 * the compiler asks about a fifth screen instead of letting it inherit whichever
 * wording came first.
 */
const PINNED_SCOPE_NOTES: Record<PanelMetric, string> = {
  dealt: "Tylko z pokazanej drużyny — to ona to zadała, choć gra nie mówi kto.",
  taken: "Tylko z pokazanej drużyny — liczone po tym, komu ubyło życia.",
  healingGiven: "Tylko z pokazanej drużyny — to ona to wyleczyła, choć gra nie mówi kto.",
  healed: "Tylko z pokazanej drużyny — liczone po tym, komu przybyło życia.",
};

/** Asked only where a side is picked: under `Wszyscy` there is no scope to state. */
export function getNoActorScopeNote(metric: PanelMetric): string {
  return PINNED_SCOPE_NOTES[metric];
}

/**
 * The second row's sentences: the figure whose **target** the game did not name.
 *
 * Fewer tables than the first row needs, and each one is as long as its answer
 * really varies. What the game left out depends on the noun and not on the
 * direction — a blow that found nobody is a blow that found nobody, read from
 * either end — so the limit is two sentences. Where the figure stands never
 * varies at all: no ranked row holds it on any screen that draws it, so it is one
 * sentence. The heading is one word, true wherever it is read.
 *
 * ⚠️ **Exhaustive per metric anyway, including the screen that does not draw the
 * row.** Under `Zadane` these points sit on the striker's own row and the panel
 * shows no second row for them (`HOLE_STANDING` in `src/ui/panel-view.ts`) — but
 * that is arithmetic, not vocabulary, and a table with a hole in it would be a
 * table nobody could reuse the day the arithmetic moves. The sentence is written
 * and it is true.
 */
const NO_TARGET_LIMIT_NOTES: Record<PanelNoun, string> = {
  damage: NOBODY_STRUCK_NOTE,
  healing: NOBODY_TENDED_NOTE,
};

export function getNoTargetLimitNote(metric: PanelMetric): string {
  return NO_TARGET_LIMIT_NOTES[getMetricNoun(metric)];
}

/** Never inside the list above it — see `APART_NOTE`. */
export function getNoTargetStandingNote(): string {
  return APART_NOTE;
}

/** What the cut under it lists: the end the game *did* name. */
export function getNoTargetBreakdownHeading(): string {
  return "Kto";
}

/**
 * What the figure covers once a side is picked. One sentence, and it says what
 * the shown team *is* to the points rather than which end they were counted by.
 *
 * ⚠️ **The end they were counted by is not the team's own end.** Under
 * `Otrzymane` the game named the striker and the team shown is the one facing
 * them, so a sentence naming that end would read as this team having swung. What
 * every screen that draws this row has in common is the other half: the points
 * are the shown team's, and which of its members they belong to is what the game
 * did not say.
 *
 * ⚠️ **Neither given screen draws the row, so the sentence is not written for
 * them** — there the actor is named and their own total holds the figure
 * (`HOLE_STANDING` in `src/ui/panel-view.ts`). Nor would this wording be true
 * under `Zadane`: the one nobody can name would be on the *other* team.
 */
const NO_TARGET_SCOPE_NOTE = "Tylko z pokazanej drużyny — gra nie mówi, kogo z niej.";

export function getNoTargetScopeNote(): string {
  return NO_TARGET_SCOPE_NOTE;
}

/**
 * What the row holds that no pair does, and which end of the pair is missing.
 *
 * The two directions are short for **different reasons** and a shared sentence
 * would be wrong on two screens: under a received direction nobody swung or
 * healed, under a given one somebody did and the game named a target this fight
 * has nobody to match. Four entries, so the compiler asks about a fifth screen
 * rather than letting it inherit whichever wording came first.
 *
 * The two received directions say what the pinned row says, by reading the same
 * constant rather than by repeating it.
 */
const MISSING_COUNTERPARTS: Record<PanelMetric, { label: string; note: string }> = {
  dealt: { label: NO_TARGET_LABEL, note: NOBODY_STRUCK_NOTE },
  taken: { label: NO_ACTOR_LABEL, note: NOBODY_DEALT_NOTE },
  healingGiven: { label: NO_TARGET_LABEL, note: NOBODY_TENDED_NOTE },
  healed: { label: NO_ACTOR_LABEL, note: NOBODY_HEALED_NOTE },
};

export function getMissingCounterpart(metric: PanelMetric): { label: string; note: string } {
  return MISSING_COUNTERPARTS[metric];
}

/**
 * What the pinned row's own breakdown is a cut of — **one rule, and it turns on
 * the direction rather than on the noun.**
 *
 * A figure with no actor can be cut two ways: by what the game named it with, and
 * by whom it reached. Which of them belongs on screen is the question the reader
 * is already asking — under a given direction they are reading about *what was
 * done*, under a received one about *whom it happened to*. Both cuts branched on
 * the noun alone until now, so `Otrzymane` never said who lost the health and
 * `Leczenie dane` listed the recipients of healing nobody gave.
 *
 * Four entries rather than a pair keyed by direction: the compiler asks about a
 * fifth screen, which is what this file exists to make it do.
 */
const PINNED_BREAKDOWN_HEADINGS: Record<PanelMetric, string> = {
  dealt: "Z czego",
  taken: "Komu",
  healingGiven: "Z czego",
  healed: "Komu",
};

export function getNoActorBreakdownHeading(metric: PanelMetric): string {
  return PINNED_BREAKDOWN_HEADINGS[metric];
}

/**
 * The line closing a cut against the figure standing over it: the part that names
 * **neither** end.
 *
 * ⚠️ **It says nothing about what the game said, and that is the point.** Every
 * other sentence in this file names a limit of the *protocol*; this one covers two
 * different ways of having no end at all. The game may have stated a name that
 * matched nobody in this fight's roster (`src/core/combatant-roster.ts`), or it
 * may have written `0` in both side segments. "Gra nie mówi" would be false in the
 * first case and "imię nie pasuje" in the second, so the sentence says only what
 * is true of both: neither end is known.
 *
 * ⚠️ **One sentence and not four, because nothing about it varies by screen.** It
 * was four entries with two of them null, back when the leftover could only close
 * a `Komu` cut. It now rides whichever row stands apart from the ranking
 * (`getHoleCarryingNeitherEnd` in `src/ui/panel-view.ts`) and says the same thing
 * wherever it lands — a table of one repeated value would be four places for one
 * fact to drift.
 */
const NEITHER_END_LEFTOVER = {
  label: "Nie do przypisania",
  note: "Ta część nie trafiła na żaden wiersz — nie wiadomo ani kto, ani komu.",
};

export function getNeitherEndLeftover(): { label: string; note: string } {
  return NEITHER_END_LEFTOVER;
}

/** Thousands spaced, as the game itself writes them. */
export function composeFigureText(value: number): string {
  return composeSpacedThousands(composeIntegerText(Math.round(value)));
}

/**
 * A count and its noun, in the three forms Polish asks for.
 *
 * The rule is the language's and not ours: one takes one form; a count whose last
 * digit is 2, 3 or 4 takes a second, unless it is one of the teens, which do not;
 * everything else takes a third. Nothing about the fight decides it, which is why
 * it lives beside the words rather than beside the figures.
 *
 * ⚠️ **Three forms because two is a trap that looks like it works.** The panel
 * wrote every counted sentence as `count === 1 ? a : b`, and three of the four
 * were right — not because two forms are enough, but because the case governed by
 * each of those sentences happens to spell the second and third form alike.
 * `Nie dotarło …` is the one that does not, and it read *3 zdarzeń* for the whole
 * of its life. A caller still passes the same word twice where the grammar really
 * does repeat it, and that is the point: it says so, where a ternary said nothing.
 *
 * ⚠️ **The forms are the caller's, because the sentence around them decides
 * which.** The same noun takes different ones under different verbs — *odczytać*
 * negated governs the genitive throughout, *dotrzeć* does not — so a table keyed by
 * noun would be wrong for half the sentences that used it.
 */
export function composeCountedText(count: number, forms: [string, string, string]): string {
  const figure = composeFigureText(count);
  const [one, few, many] = forms;
  if (count === 1) return `${figure} ${one}`;
  const last = Math.abs(count) % 10;
  const teens = Math.abs(count) % 100;
  const isFew = last >= 2 && last <= 4 && !(teens >= 12 && teens <= 14);
  return `${figure} ${isFew ? few : many}`;
}

/**
 * What a row says about its own figures being short, and it is two different
 * claims (§9.6's two severities, arriving on one row).
 *
 * The first is a suspicion: something naming this combatant could not be read, and
 * nothing says which of their figures it would have moved — so it says *may be*,
 * about all of them. The second is not a suspicion at all: healing they gave went
 * out in an amount the game never states, so that one figure **is** low. The
 * certain one is said first, for the reason the fight's own strip says it first —
 * ranking what is missing under what might be missing buries the only line that is
 * not a guess.
 *
 * Neither carries a key of the game's or a word of ours (§3). A player is being
 * told a number may be low; why this reader could not read it is a question for
 * the report they can download, not for the row.
 */
export function composeUnreadableRowNote(count: number): string {
  return `Nie dało się odczytać ${composeCountedText(count, ["zdarzenia", "zdarzeń", "zdarzeń"])} z jej udziałem — jej liczby mogą być zaniżone.`;
}

export function composeUnaccountedHealingRowNote(count: number): string {
  return `Uleczyła sojuszników ${composeCountedText(count, ["raz", "razy", "razy"])} bez podanej liczby — jej leczenie jest zaniżone.`;
}

/** What the card calls the block those two sentences sit in. */
export const ROW_WARNING_HEADING = "Czego nie wiadomo";

/**
 * The mark itself, and it is a glyph rather than a colour.
 *
 * §9.7 forbids colour carrying a meaning alone, and this is the one place on the
 * panel where the meaning is *do not trust this number yet* — the reading nobody
 * can recover from a hue. The colour is the same one the fight's own warnings
 * wear; the glyph is what survives it being invisible.
 */
export const ROW_WARNING_MARK = "⚠";

/**
 * A share, and the one case where rounding it would print a lie.
 *
 * ⚠️ **A figure that is there must not read as a figure that is not** (§9.6). A
 * share under half a point rounds to `0%`, which on a panel that keeps *zero* and
 * *could not be read* apart is the third thing neither of them means: something
 * happened, and it was too small to round to. Measured over every recording on
 * 2026-08-19, across the four metrics and the three side tabs: 45 ranked rows
 * print this floor, and without it every one of them would read `0%` beside a
 * figure — 1 741 dealt on
 * `tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-1.json`, 966 taken on
 * `2026-08-15-tempest-grupa-vs-hildur-2.json` — and the pinned row joined them
 * the moment its figure narrowed to one side.
 *
 * A floor rather than a second decimal place: the reader is being told the figure
 * is small, and `0,2%` down a column of whole numbers is a precision the rest of
 * the panel does not claim. Zero itself still prints `0%`, because there it is the
 * measurement.
 */
export function composeShareText(share: number): string {
  return composeSharePointsText(Math.round(share * 100), share > 0);
}

/** A share already reduced to whole points, with the floor above spent where it is owed. */
function composeSharePointsText(points: number, isPresent: boolean): string {
  if (points === 0 && isPresent) return "<1%";
  return `${composeIntegerText(points)}%`;
}

/**
 * Every share of one whole, written so **what the reader adds up comes to what
 * the panel says it is a share of.**
 *
 * ⚠️ **Rounding each share on its own is what broke it.** Eleven rows rounded
 * apart from one another lose up to half a point each in the same direction, and
 * the column then states a fight that is not the one it is a column of. Measured
 * over every recording on 2026-08-22, across the four metrics and the three side
 * tabs: of the 188 screens drawing a figure, 78 printed a set of shares that did
 * not add to 100 — 30 of them a point over, 18 a point under, and the worst three
 * points out on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json` under
 * `Zadane · Wszyscy`. The figures beside them were right the whole time: only the
 * text was wrong, which is the kind of wrong a reader checks the panel against.
 *
 * The largest remainder decides who gets the points that are left: every row
 * takes its whole points, and the ones whose discarded fraction was biggest take
 * one more each until the hundred is spent. That is the method, and it is chosen
 * over a second decimal place because a decimal place does not close it —
 * `33,3%` three times adds to `99,9%` and the column still does not sum.
 *
 * ⚠️ **Equal figures take the point together or not at all, and that is worth a
 * point of precision.** The plain method hands the last point to one row of a
 * tie, and on a group fight a tie is not two rows but seven: under
 * `Otrzymane · Wszyscy` on
 * `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-4.json` seven
 * combatants stand on 11 178 apiece, and it printed `3%` beside one of them and
 * `2%` beside the other six (read 2026-08-22). Two identical numbers with
 * different shares beside them read as a panel that cannot add up, which is worse
 * than either fault this function exists to fix.
 *
 * So a group of equal figures is one candidate costing as many points as it has
 * members: where the points left will not cover the group, it is passed over and
 * a smaller remainder is paid instead. The seven now read `2%` and the point goes
 * to a row three hundredths of a point behind them. Over every recording, on all
 * 204 screens, no two equal figures print different shares.
 *
 * The fallback is the sum: where nothing but a tie is left to pay, the tie is
 * split, earliest row first, because the column adding up is the promise and the
 * evenness is the courtesy. Position is what decides inside a split — stable
 * rather than accidental, since the panel redraws every few seconds and a bracket
 * flickering between two rows would be worse than either — and in the ranking
 * position is the figure, so the point goes to the higher row. Nothing subtler
 * breaks a tie, because nothing subtler survives the arithmetic: `1/6` and `4/6`
 * discard the same third in mathematics and not in floating point, where the two
 * differ in the last bits and any comparison fine enough to see it is deciding on
 * noise.
 *
 * A share the panel refuses to round to zero (`<1%` above) takes no point and
 * states none, so it neither breaks the sum nor reads as nothing.
 */
export function composeShareTexts(amounts: readonly number[], whole: number): string[] {
  if (whole <= 0) return amounts.map(() => composeSharePointsText(0, false));

  const shares = amounts.map((amount, index) => {
    const exact = (amount / whole) * 100;
    const points = Math.floor(exact);
    return { index, amount, points, remainder: exact - points };
  });

  // What the whole itself rounds to, which is a hundred only where the amounts
  // fill it: a screen may divide by a whole holding a figure it does not draw, and
  // then the shares are right to add to less.
  const spent = shares.reduce((sum, share) => sum + share.points, 0);
  let left = Math.round(shares.reduce((sum, share) => sum + share.points + share.remainder, 0)) - spent;

  const groups = new Map<number, { remainder: number; index: number; members: typeof shares }>();
  for (const share of shares) {
    // A share with nothing discarded is a whole number of points already, and
    // handing it one more would print a share it does not have.
    if (share.remainder <= 0) continue;
    const group = groups.get(share.amount);
    if (group === undefined) {
      groups.set(share.amount, { remainder: share.remainder, index: share.index, members: [share] });
    } else {
      group.members.push(share);
    }
  }
  const byRemainder = [...groups.values()].sort(
    (one, other) => other.remainder - one.remainder || one.index - other.index,
  );

  // Left over once every group that fits has been paid whole. A group passed over
  // here is passed over for good: what is left only ever falls.
  const unpaid: Array<typeof shares> = [];
  for (const group of byRemainder) {
    if (group.members.length > left) {
      unpaid.push(group.members);
      continue;
    }
    for (const share of group.members) share.points += 1;
    left -= group.members.length;
  }

  // Where nothing but a group too big to pay for is left, the column adding up
  // wins and the group is split, earliest row first.
  for (const members of unpaid) {
    for (const share of members) {
      if (left <= 0) break;
      share.points += 1;
      left -= 1;
    }
    if (left <= 0) break;
  }

  return shares.map((share) => composeSharePointsText(share.points, share.amount > 0));
}

/**
 * How a fight ended, from the reader's seat, in one word each.
 *
 * Here rather than beside the header that first drew them: the shelf of kept
 * fights says the same three words a row at a time, and two modules composing
 * `wygrana` themselves is the drift §9.3 is about. A draw is the one that needs
 * no seat — the game states it by naming nobody, so it is the same word for
 * everyone in the fight.
 */
const OUTCOME_LABELS: Record<PanelFightOutcome, string> = {
  won: "wygrana",
  lost: "przegrana",
  drawn: "remis",
};

export function getOutcomeLabel(outcome: PanelFightOutcome): string {
  return OUTCOME_LABELS[outcome];
}

/** What the shelf of kept fights is called, and the way off it. */
export const FIGHTS_TITLE = "Walki";
export const FIGHTS_BACK_LABEL = "‹ wróć";

/**
 * The shelf before anything is on it.
 *
 * It says what will happen rather than only what has not, because an empty shelf
 * is indistinguishable from a broken one: a reader who has fought and sees
 * nothing needs to know the add-on keeps a fight when it **ends**.
 */
export const FIGHTS_EMPTY = "Nic tu jeszcze nie ma — walka trafia tutaj, kiedy się skończy.";

/** The fight happening now, which is on the shelf and is not kept anywhere. */
const LIVE_FIGHT_TIME = "teraz";
const LIVE_FIGHT_OUTCOME = "trwa";

/**
 * When a fight was put on the shelf, on the reader's own clock.
 *
 * Two digits either side, because a column of times that jumps between four and
 * five characters reads as a column of different things. Nothing at all where the
 * fight carries no readable time: §9.3's unknown is loud, and `00:00` is a
 * measurement of nothing wearing the shape of one.
 */
export function getFightTimeText(
  at: { hour: number; minute: number } | null,
  isLive: boolean,
): string {
  if (isLive) return LIVE_FIGHT_TIME;
  if (at === null) return "";
  return `${composeTwoDigitText(at.hour)}:${composeTwoDigitText(at.minute)}`;
}

function composeTwoDigitText(value: number): string {
  const digits = composeIntegerText(value);
  return digits.length >= 2 ? digits : `0${digits}`;
}

/**
 * How big the fight was, side against side — the reader's own first, the way
 * every other pairing on the panel is ordered.
 *
 * The multiplication sign and not the letter `v`: `4v4` is English shorthand, and
 * a Polish panel that borrowed it would be the one place a reader met a word that
 * is not theirs (§3). Empty where the fight names nobody, which the shelf then
 * draws as a row with a time and an outcome and no size — true, and not a zero.
 */
export function composeSideCountsText(counts: readonly number[]): string {
  if (counts.length === 0) return "";
  return counts.map((count) => composeIntegerText(count)).join("×");
}

/**
 * How a fight on the shelf ended, or that it has not.
 *
 * ⚠️ **The outcome comes first, and the live fight is the reason.** A fight that
 * has stated a winner is over whether or not the next one has begun — driven in
 * Firefox on 2026-08-26, where the row for a fight the reader had just won read
 * *trwa* until they started another.
 */
export function getFightOutcomeText(
  outcome: PanelFightOutcome | null,
  isLive: boolean,
): string {
  if (outcome !== null) return OUTCOME_LABELS[outcome];
  return isLive ? LIVE_FIGHT_OUTCOME : "";
}

/** What a pin does, said in words — the mark alone does not say (§9.7). */
export function getPinTitle(isPinned: boolean): string {
  return isPinned ? "Odepnij — będzie mogła zniknąć" : "Przypnij, żeby nie zniknęła";
}

export const PIN_MARK = "★";
export const UNPINNED_MARK = "☆";

/** Where the fights are kept, and the three places they can be. */
export const STORAGE_LABEL = "Trzymaj";

const STORAGE_LABELS: Record<PanelStorageChoice, string> = {
  local: "na stałe",
  session: "do zamknięcia karty",
  memory: "tylko teraz",
};

export function getStorageLabel(choice: PanelStorageChoice): string {
  return STORAGE_LABELS[choice];
}

/**
 * What the shelf says when the browser would not take a fight.
 *
 * It says the fight is gone rather than that a write failed, because that is the
 * consequence the reader has: a fight they can no longer open. Nothing here names
 * a quota, a store or an exception — those are ours (§3).
 *
 * ⚠️ **One remedy, because only one is still the reader's.** It offered two while
 * the shelf had a strip for how many fights to keep — *trzymaj mniej walk* was
 * the first of them — and a sentence pointing at a control that is not on the
 * screen is worse than one that points at nothing.
 */
export const STORE_REFUSED_WARNING =
  "Przeglądarka nie przyjęła tej walki — nie została zapisana. Odepnij którąś, żeby zrobić miejsce.";

/**
 * The other way a fight fails to arrive, and it is the reader's own doing.
 *
 * Its own sentence rather than the one above, because the remedy is different and
 * naming the wrong one is worse than saying nothing: nothing about the browser is
 * wrong here, every slot the shelf has is holding something the reader pinned.
 */
export const EVERY_SLOT_PINNED_WARNING =
  "Wszystkie miejsca są zajęte przez przypięte walki — ta się nie zapisała.";

/**
 * What the shelf says when the browser would not keep the reader's own answer.
 *
 * Its own sentence again, and the shortest of the three, because the consequence
 * is the smallest: nothing was lost and nothing moved. It says the control did
 * nothing rather than that a write failed — a reader who clicked *na stałe* and
 * was quietly left on *tylko teraz* would find out by closing the tab.
 */
export const CHOICE_REFUSED_WARNING =
  "Przeglądarka nie zapisała tego wyboru — zostaje tak, jak było.";

/**
 * A run of digits, spaced every three from the right — as the game writes them.
 *
 * ⚠️ **It argued for itself by naming a second caller that no longer exists.**
 * The sentence read "one function because two kinds of number need it", the
 * second being a per-turn rate — and §10 says nothing here counts turns, so the
 * rate went and the argument stayed
 * (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F10). It is separate
 * for a plainer reason: `composeFigureText` above rounds and this spaces, and a
 * caller that has a run of digits already has no rounding to ask for.
 */
function composeSpacedThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
