/**
 * What a screen can show, what each is called, and the strips that switch between
 * them.
 *
 * The vocabulary and the controls in one file because they are one decision: a
 * tab exists exactly where a metric does, and a control that is drawn and does
 * nothing is worse than one that is absent (§9.6). Keeping the table private and
 * exporting the strips is what stops a caller composing a tab of its own from the
 * pieces — the tabs are the vocabulary as the reader meets it.
 *
 * **The strings are Polish and nothing else here is** (§3).
 */

export const PANEL_METRICS = ["dealt", "taken", "healingGiven", "healed"] as const;
export type PanelMetric = (typeof PANEL_METRICS)[number];

export const PANEL_TEAMS = ["all", "mine", "enemy"] as const;
export type PanelTeam = (typeof PANEL_TEAMS)[number];

/**
 * One control, and the choice it carries.
 *
 * Declared beside the vocabulary rather than with the rest of the output shape,
 * so the shape can depend on this file and this file on nothing: a tab is the
 * vocabulary as the reader meets it, and two modules importing each other's types
 * would be one module written twice.
 */
export type PanelMetricTab = { metric: PanelMetric; label: string; isSelected: boolean };
export type PanelTeamTab = { team: PanelTeam; label: string; isSelected: boolean };

/**
 * The two axes a metric sits on, and the reason they are not the state.
 *
 * `Zadane` and `Otrzymane` are two *directions* of one noun; `Leczenie` was a
 * noun with no direction, which is why healing given had nowhere to go. Naming
 * the axes separates them — but they stay **derived**, and the metric stays the
 * one field the state holds.
 *
 * Two fields would make `healing` × `given` expressible before there is a figure
 * behind it, and §9.5 puts an invariant like that in the type instead of in a
 * check five call sites have to remember. So the table below is the whole
 * vocabulary: a pair with no row is a screen that does not exist, and the
 * compiler counts the rows.
 */
const PANEL_NOUNS = ["damage", "healing"] as const;
export type PanelNoun = (typeof PANEL_NOUNS)[number];

const PANEL_DIRECTIONS = ["given", "received"] as const;
export type PanelDirection = (typeof PANEL_DIRECTIONS)[number];

const METRIC_AXES: Record<PanelMetric, { noun: PanelNoun; direction: PanelDirection }> = {
  dealt: { noun: "damage", direction: "given" },
  taken: { noun: "damage", direction: "received" },
  healingGiven: { noun: "healing", direction: "given" },
  healed: { noun: "healing", direction: "received" },
};

export const METRIC_LABELS: Record<PanelMetric, string> = {
  dealt: "Zadane",
  taken: "Otrzymane",
  healingGiven: "Leczenie dane",
  healed: "Leczenie",
};

export const TEAM_LABELS: Record<PanelTeam, string> = {
  all: "Wszyscy",
  mine: "My",
  enemy: "Oni",
};

const NOUN_LABELS: Record<PanelNoun, string> = {
  damage: "Obrażenia",
  healing: "Leczenie",
};

/**
 * The direction, worded per noun — because Polish does not use one word for both.
 *
 * Damage is *zadane*, healing is *dane*, and a single label covering both would
 * have to be ours rather than the language's. Lower case against the nouns' upper:
 * two strips of equal weight read as two lists of the same kind of thing, and
 * these are not — one picks the figure, the other turns it round.
 */
const DIRECTION_LABELS: Record<PanelNoun, Record<PanelDirection, string>> = {
  damage: { given: "zadane", received: "otrzymane" },
  healing: { given: "dane", received: "otrzymane" },
};

/**
 * The two questions every branch of the view used to ask by naming a metric.
 *
 * *Which quantity* and *which way round* are independent, and spelling them as
 * one name meant a fourth screen could not be added without revisiting twenty
 * conditions that each looked like they were about `dealt`. Most were about
 * **given**.
 */
export function isHealingMetric(metric: PanelMetric): boolean {
  return METRIC_AXES[metric].noun === "healing";
}

export function isGivenMetric(metric: PanelMetric): boolean {
  return METRIC_AXES[metric].direction === "given";
}

/** Which noun a metric belongs to, for anything worded per noun rather than per screen. */
export function getMetricNoun(metric: PanelMetric): PanelNoun {
  return METRIC_AXES[metric].noun;
}

function getMetricsByNoun(noun: PanelNoun): PanelMetric[] {
  return PANEL_METRICS.filter((metric) => METRIC_AXES[metric].noun === noun);
}

/**
 * The metric a noun tab switches to, keeping the direction the reader is already
 * reading in — so moving between nouns does not silently turn the figure round.
 * Where the new noun has no such direction there is nothing to keep, and the
 * first it does have is the honest answer rather than a tab that does nothing.
 */
function composeMetricAfterNoun(noun: PanelNoun, current: PanelMetric): PanelMetric {
  const wanted = METRIC_AXES[current].direction;
  const metrics = getMetricsByNoun(noun);
  const kept = metrics.find((metric) => METRIC_AXES[metric].direction === wanted);
  // A noun with no metric at all cannot be built: PANEL_NOUNS is derived from the
  // same table, so `metrics[0]` exists. Narrowing it costs one fallback and no
  // assertion — §9.5 prefers the exact type to an assert covering a loose one.
  return kept ?? metrics[0] ?? current;
}

/**
 * The upper strip: which quantity, one tab per noun.
 *
 * A tab carries the metric it would switch *to*, so the drawing reports one kind
 * of choice however many axes the panel grows: which figure. The rule that a noun
 * keeps the reader's direction lives here, where it is checkable without a
 * browser, rather than in the file that draws buttons.
 */
export function composeNounTabs(current: PanelMetric): PanelMetricTab[] {
  return PANEL_NOUNS.map((noun) => ({
    metric: composeMetricAfterNoun(noun, current),
    label: NOUN_LABELS[noun],
    isSelected: noun === METRIC_AXES[current].noun,
  }));
}

/**
 * The lower strip: the noun the reader is on, turned round.
 *
 * ⚠️ **It used to return nothing where a noun offered one direction, and that
 * branch never fired.** `Leczenie` was such a noun until healing given had a
 * figure behind it; since then every noun in `METRIC_AXES` has both, so the line
 * was inert — mutating the bound to `< 1` reddened nothing, which is §7.5's
 * finding rather than a spare safety net. What it was protecting against is worth
 * keeping, so it is a checked claim now instead of an unreachable line:
 * `tests/ui/panel-metric.test.ts` refuses a noun with one direction, and whoever
 * adds one decides then what a strip of one tab should do (§9.6 — a control that
 * is drawn and does nothing is worse than one that is absent).
 */
export function composeDirectionTabs(current: PanelMetric): PanelMetricTab[] {
  const noun = METRIC_AXES[current].noun;
  return getMetricsByNoun(noun).map((metric) => ({
    metric,
    label: DIRECTION_LABELS[noun][METRIC_AXES[metric].direction],
    isSelected: metric === current,
  }));
}

export function composeTeamTabs(current: PanelTeam): PanelTeamTab[] {
  return PANEL_TEAMS.map((team) => ({
    team,
    label: TEAM_LABELS[team],
    isSelected: team === current,
  }));
}
