/**
 * What the panel says where the game names only one end — §10's **half-named**,
 * in the player's words.
 *
 * **Two rows and not one, because the hole comes at either end.** A blow whose
 * actor the game left out and a blow whose target it left out are different
 * things to be told, and both were called `Bez sprawcy` until the team could be
 * derived from whichever end was stated
 * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`). The second row
 * needs fewer tables than the first: less about it varies by screen, and each
 * table here is as long as its answer really is.
 *
 * Three screens' worth of sentences about one thing: the row pinned under the
 * ranking, the row that closes a breakdown section, and the row that closes a
 * skill's own level. They were spread across the file that composed all three,
 * and two of them had already been written out twice byte for byte — rewording
 * one would have left the panel saying two different things about one limit, on
 * two screens, with neither test noticing because each records its own screen's
 * phrases against itself
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F18).
 *
 * Readers rather than tables, so the sentence for a screen is looked up in one
 * place and the tables stay exhaustive per metric: the compiler asks about a fifth
 * screen instead of letting it inherit whichever wording came first.
 *
 * **The strings are Polish and nothing else here is** (§3): each says what cannot
 * be known, never why our reader cannot know it.
 */

import { getMetricNoun, type PanelMetric, type PanelNoun } from "@/src/ui/panel-metric.ts";

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
