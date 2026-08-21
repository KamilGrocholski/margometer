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

import { composeDecimalText, composeIntegerText } from "@/libs/number.ts";
import { getMetricNoun, type PanelMetric, type PanelNoun } from "@/src/ui/panel-screen.ts";

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
 * All ours, and not for want of asking: the client names no element anywhere.
 * It composes a damage line out of the figure and the recipient and spends the
 * kind on a CSS class. `thirdatt` is ours for a second reason — its own entry
 * resolves to `+%val%`, a hole and no name — so its name comes from the help,
 * which calls it the Third Blow under the engine name `of-thirdatt` (article
 * view,372, read 2026-08-09).
 */
export const ELEMENT_NAMES: Record<string, TokenName> = {
  dmg: { id: null, fallback: "fizyczne" },
  dmgd: { id: null, fallback: "dystansowe" },
  dmgo: { id: null, fallback: "broń pomocnicza" },
  dmgf: { id: null, fallback: "ogień" },
  dmgc: { id: null, fallback: "zimno" },
  dmgl: { id: null, fallback: "błyskawica" },
  dmga: { id: null, fallback: "nieuchronne" },
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
 * All sentences in the dictionary: each names the defence, then the figure it
 * took off and the damage it took it off. A name with the figure cut out of it
 * is not a label, so these keep a short noun of ours.
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
 * `legbon_lastheal` — `heal` alone on both. Named once for both, it printed as
 * `leczenie` under `Bez sprawcy` on the damage screens, which is the fault the
 * comment on `fire` below already names: **two quantities under one label is a
 * wrong number that looks right.**
 *
 * Neither table is a list of what the game may send: `getPhrase` falls back to the
 * token itself, so an unnamed key still reaches the panel as the game wrote it.
 * What the tables are held to is being exhaustive over the *material*, which
 * `tests/ui/panel-words.test.ts` re-measures off the captures rather than listing.
 */
export const HEALTH_LOSS_SOURCE_NAMES: Record<string, TokenName> = {
  poison: { id: null, fallback: "trucizna" },
  // Not "ogień", which is `dmgf`'s word above for the damage element: this is the
  // burn ticking afterwards, and two quantities under one label is a wrong number
  // that looks right. The client's own entry for it is a sentence with two holes,
  // so there is no name to ask it for.
  fire: { id: null, fallback: "podpalenie" },
  // The old phrase was "rana", which is the game's word for `wound` — a
  // different key, and one this meter also reads.
  injure: { id: null, fallback: "zranienie" },
  /**
   * The healing key with a figure below zero — health that fell.
   *
   * The word says what the protocol stated and no more. The published help
   * documents `heal` as restoration only (`pomoc.margonem.pl`, article `view,372`,
   * `heal`, read 2026-08-09) and nothing there accounts for a negative, so a name
   * explaining *why* the health fell would be ours rather than the game's (§5).
   */
  heal: { id: null, fallback: "ujemne leczenie" },
};

export const HEALTH_GAIN_SOURCE_NAMES: Record<string, TokenName> = {
  heal: { id: null, fallback: "leczenie" },
  heal_target: { id: null, fallback: "leczenie na wskazanego" },
  // Its own id resolves to a sentence; the proc that causes it resolves to the
  // effect's name, and the name is what a row wants. The register ties the two
  // keys already, so this is a reading rather than a guess.
  legbon_holytouch_heal: { id: "msg_+legbon_holytouch", fallback: "dotyk anioła" },
  legbon_lastheal: { id: null, fallback: "ostatni ratunek" },
  // The client's own entry is `msg_healall_per %name% %val%` — a sentence with two
  // holes rather than a name, so there is nothing to ask the dictionary for
  // (production build `1786514810315`).
  healall_per: { id: null, fallback: "leczenie całej drużyny" },
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
  if (share > 0 && share * 100 < 0.5) return "<1%";
  return `${composeDecimalText(share * 100, 0)}%`;
}

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
