/**
 * What the panel says where the game names nobody — §10's **unattributed**, in
 * the player's words.
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

/** The row's own name, wherever it stands. */
export const NOBODY_LABEL = "Bez sprawcy";

const NOBODY_DEALT_NOTE = "Gra nie mówi, kto to zadał — wiadomo tylko, że życia ubyło.";
const NOBODY_HEALED_NOTE = "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.";

/** What the game did not say, per noun. The limit, never our reason for it. */
const PINNED_LIMIT_NOTES: Record<PanelNoun, string> = {
  damage: NOBODY_DEALT_NOTE,
  healing: NOBODY_HEALED_NOTE,
};

export function getPinnedLimitNote(metric: PanelMetric): string {
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
  dealt: "Nikt tego nie ma na swoim wierszu — dlatego stoi osobno.",
  taken: "Te obrażenia są już policzone wyżej, u tych, którym ubyło życia.",
  healingGiven: "Nikt tego nie ma na swoim wierszu — dlatego stoi osobno.",
  healed: "To leczenie jest już policzone wyżej, u tych, którzy je dostali.",
};

export function getPinnedStandingNote(metric: PanelMetric): string {
  return PINNED_STANDING_NOTES[metric];
}

/** Said where the pinned figure is fight-wide and the list on screen is not. */
export const NOBODY_SCOPE_NOTE = "Z całej walki — bez sprawcy nie ma czego przypisać do strony.";

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
  dealt: {
    label: "Nie wiadomo, w kogo",
    note: "Gra nie mówi, w kogo — wiadomo tylko, że cios wszedł.",
  },
  taken: {
    label: NOBODY_LABEL,
    note: NOBODY_DEALT_NOTE,
  },
  healingGiven: {
    label: "Nie wiadomo, komu",
    note: "Gra nie mówi, komu — wiadomo tylko, że leczenie weszło.",
  },
  healed: {
    label: NOBODY_LABEL,
    note: NOBODY_HEALED_NOTE,
  },
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

export function getPinnedBreakdownHeading(metric: PanelMetric): string {
  return PINNED_BREAKDOWN_HEADINGS[metric];
}

/**
 * The row closing a `Komu` cut against the figure standing over it.
 *
 * ⚠️ **It says nothing about what the game said, and that is the point.** Every
 * other sentence in this file names a limit of the *protocol*; this one names a
 * limit of ours. The game did state a name here — it simply matched nobody in the
 * roster this fight was read with, so no row can hold the figure
 * (`src/core/combatant-roster.ts`). Wording it as "gra nie mówi, komu" would be a
 * claim about the game that is false (§3), and it would be false in both
 * directions at once: under `Otrzymane` the unplaced part is a blow whose
 * **attacker** did not resolve, not a victim nobody named.
 *
 * ⚠️ **Null under a given direction is decided, not missing.** There the cut is by
 * source, and every point of the figure carries the key that stated it — the
 * aggregate writes the total and its per-token map in one breath
 * (`src/core/fight-statistics.ts`), so nothing can be left over. Spelled as four
 * entries so a fifth screen is a question rather than an inheritance.
 */
const UNPLACED_LEFTOVER = {
  label: "Nie do przypisania",
  note: "Ta część nie trafiła na żaden wiersz — imię z niej nie pasuje do nikogo w tej walce.",
};

const PINNED_LEFTOVERS: Record<PanelMetric, { label: string; note: string } | null> = {
  dealt: null,
  taken: UNPLACED_LEFTOVER,
  healingGiven: null,
  healed: UNPLACED_LEFTOVER,
};

export function getPinnedLeftover(metric: PanelMetric): { label: string; note: string } | null {
  return PINNED_LEFTOVERS[metric];
}
