/**
 * Which screen the panel is on: what a screen can show, what it is called, what a
 * row on it is keyed by, the shape it takes, and what a click does to it.
 *
 * One subject with four parts, and they were four files. A tab exists exactly
 * where a metric does; a row key is how a click on one screen names the next; the
 * shape is what that screen hands to the drawing; the reducer is the same nesting
 * read from the other end. None of them can be changed without the others being
 * right, and each of the four opened by arguing why it was a file (§9.1).
 *
 * ⚠️ **Nothing here reaches the composing.** That was the shape's reason for
 * being its own file, and it survives the merge — better than survives it:
 * `src/ui/panel-element.ts` now depends on this one module instead of three, and
 * still on nothing that fills a screen. Types, vocabulary and pure functions
 * only; where a figure comes from is `src/ui/panel-view.ts`'s business and what it
 * looks like is `src/ui/panel-look.ts`'s.
 *
 * ⚠️ **A skill's key can contain a colon, and that is the whole difficulty of the
 * grammar below.** It is the game's identifier where the message stated one and
 * the skill's **name** where it did not, so it carries whatever the game wrote.
 * The owner is split off the front and everything after the first divider is
 * taken whole. Without that, `78` slices to the owner id `7` — a row that quietly
 * opens somebody else's figures, which is the defect this shape exists to end
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F17).
 *
 * **The strings are Polish and nothing else here is** (§3). Keeping the metric
 * table private and exporting the strips is what stops a caller composing a tab
 * of its own from the pieces — the tabs are the vocabulary as the reader meets it.
 */

import { composeIntegerText, getIntegerFromText } from "@/libs/number.ts";

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
 * `tests/ui/panel-screen.test.ts` refuses a noun with one direction, and whoever
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

/** The rows that are one word, because they open nothing and identify nothing. */
export const BACK_ROW_KEY = "back";
/**
 * The two rows for what the protocol left half-named. Two keys because they are
 * two rows on one screen, and a key is what tells a redraw which is which.
 */
export const NO_ACTOR_ROW_KEY = "no-actor";
export const NO_TARGET_ROW_KEY = "no-target";
export const UNANNOUNCED_ROW_KEY = "unannounced";

const COMBATANT = "combatant";
const TARGET = "target";
const SKILL = "skill";
/** The deepest rows, which are read for nothing: a leaf opens no further level. */
const LEAF = "leaf";
/** A row naming what a figure came *from* — a damage element, a health-loss key. */
const SOURCE = "source";
const DIVIDER = ":";

export function composeCombatantRowKey(combatantId: number): string {
  return `${COMBATANT}${DIVIDER}${composeIntegerText(combatantId)}`;
}

export function composeTargetRowKey(combatantId: number): string {
  return `${TARGET}${DIVIDER}${composeIntegerText(combatantId)}`;
}

export function composeSkillRowKey(ownerId: number, key: string): string {
  return `${SKILL}${DIVIDER}${composeIntegerText(ownerId)}${DIVIDER}${key}`;
}

export function composeLeafRowKey(token: string): string {
  return `${LEAF}${DIVIDER}${token}`;
}

/**
 * A row naming what a figure came from rather than who it reached.
 *
 * Here for the reason every other composer is here, and it arrived late: the
 * breakdown wrote `` `source:${token}` `` by hand — one caller reproducing the
 * divider and the word either side of it, which is this module's design coming
 * apart — and `tools/drill-report.ts` read the prefix back with a third spelling
 * of its own (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F5).
 */
export function composeSourceRowKey(token: string): string {
  return `${SOURCE}${DIVIDER}${token}`;
}

/**
 * Which of the five kinds a drawn row's key is, for a reader that classifies rows
 * rather than acting on one.
 *
 * `getRowKeyMeaning` below answers what a *click* does and folds everything that
 * opens nothing into one answer, which is right for the panel and useless to
 * anything counting what the panel drew. Two readers rather than one, because a
 * reader that needed both would otherwise take the keys apart itself — which is
 * exactly what the offline report was doing.
 */
export type RowKeyKind = "combatant" | "target" | "skill" | "source" | "leaf" | "other";

export function getRowKeyKind(key: string): RowKeyKind {
  const divider = key.indexOf(DIVIDER);
  if (divider < 0) return "other";
  const kind = key.slice(0, divider);
  if (kind === COMBATANT) return "combatant";
  if (kind === TARGET) return "target";
  if (kind === SKILL) return "skill";
  if (kind === SOURCE) return "source";
  if (kind === LEAF) return "leaf";
  return "other";
}

/**
 * A leaf naming a skill.
 *
 * The namespace is what keeps it apart from the other two kinds of leaf token —
 * a combatant id and a damage type — which share the level with it. A skill is
 * called whatever the game called it, so nothing rules out one named for a
 * number.
 *
 * Here rather than at the call site, which composed `skill:` by hand: this
 * module exists so that the divider and the word either side of it are decided
 * in one place, and a caller reproducing them is that design coming apart
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 */
export function composeSkillLeafRowKey(skillName: string): string {
  return composeLeafRowKey(`${SKILL}${DIVIDER}${skillName}`);
}

/**
 * What a key means, as a value rather than as a prefix somebody compares.
 *
 * `nothing` covers every key that opens no level — the bare words, a leaf, and
 * anything this module did not compose. A caller that switched on the prefix
 * would have to decide what an unknown one means; here it is decided once.
 */
export type RowKeyMeaning =
  | { opens: "nothing" }
  | { opens: "back" }
  | { opens: "combatant"; combatantId: number }
  | { opens: "target"; combatantId: number }
  | { opens: "skill"; ownerId: number; key: string };

export function getRowKeyMeaning(key: string): RowKeyMeaning {
  if (key === BACK_ROW_KEY) return { opens: "back" };

  const divider = key.indexOf(DIVIDER);
  if (divider < 0) return { opens: "nothing" };
  const kind = key.slice(0, divider);
  const rest = key.slice(divider + 1);

  if (kind === COMBATANT || kind === TARGET) {
    const combatantId = getIntegerFromText(rest);
    // A row whose id will not read leads nowhere, rather than opening somebody
    // else's breakdown.
    if (combatantId === null) return { opens: "nothing" };
    return kind === COMBATANT
      ? { opens: "combatant", combatantId }
      : { opens: "target", combatantId };
  }

  if (kind === SKILL) {
    const owner = rest.indexOf(DIVIDER);
    if (owner < 0) return { opens: "nothing" };
    const ownerId = getIntegerFromText(rest.slice(0, owner));
    if (ownerId === null) return { opens: "nothing" };
    return { opens: "skill", ownerId, key: rest.slice(owner + 1) };
  }

  return { opens: "nothing" };
}

/**
 * One line of what a row says on demand.
 *
 * A shape rather than a paragraph, because the panel draws these differently: a
 * heading opens a section, a pair lines its figure up in a column, a note runs
 * to the width of the tooltip. Handing the drawing one string and a newline
 * would put that decision in the renderer, where it cannot be checked.
 */
export type PanelDetailLine =
  | { kind: "title"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "stat"; label: string; value: string; isStrong: boolean }
  | { kind: "note"; text: string };

export type PanelRow = {
  /**
   * What this row *is*, for a click to act on. Prefixed so the same combatant id
   * cannot be mistaken for a skill's, and so a leaf can be told from a way in.
   */
  key: string;
  /** 1-based in the ranking, null in a breakdown — position there is not a rank. */
  rank: number | null;
  label: string;
  profession: string | null;
  /** Bar colour. Says what somebody is; the name says who. */
  colour: string;
  /** 0–1, against the largest row of the same list. */
  fill: number;
  valueText: string;
  /**
   * The share, and the other measure, in one bracket beside the figure — **null
   * where this row is not part of the whole the screen divides by.**
   *
   * ⚠️ **It has been nullable twice and is not now, and the third answer is the
   * one that closed it.** It was nullable because the pinned row was fight-wide
   * under a side filter and a percentage of the wrong whole came out at 320%; it
   * stopped being nullable when both scopes were made to narrow together; it went
   * back to nullable when a figure with no actor was held to have no side, so that
   * on `Zadane · Oni` no denominator on the screen contained it
   * (`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md`).
   *
   * Every one of those was the same fault seen from a different side: the figure
   * and the whole were scoped differently. They are not any more — the team is
   * derived from the end the game named, so the row narrows exactly as the list
   * does (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`). Every row
   * on every screen is inside a whole and states its share of it.
   */
  bracketText: string;
  /** Whether a click goes anywhere. A leaf that offered one would be a lie. */
  isDrillable: boolean;
  /** Detail on demand (§9.6). Empty means there is nothing more to say. */
  detail: PanelDetailLine[];
  /**
   * Why this row's figures might not be what happened. Empty is a clean reading.
   *
   * §9.6 puts a warning next to the figure it concerns, and until this existed the
   * panel could only say *something in this fight was unreadable* under everything
   * else, leaving the reader to work out whose totals that cost
   * (`docs/specs/2026-08-24-a-warning-on-the-row-it-shortens.md`).
   *
   * **A list rather than a flag**, because a row can be short for two reasons at
   * once and they are not the same claim — one says a figure *may* be low, the
   * other that one *is*. A boolean would draw one mark over both with nothing able
   * to tell them apart again. The sentences are also in `detail`, which is where a
   * reader meets them; they are here as well so the drawing can mark the row
   * without reading a card to find out whether it should.
   */
  warnings: string[];
};

export type PanelList = {
  /** Null in the ranking: one continuous list needs no heading. */
  heading: string | null;
  totalText: string | null;
  rows: PanelRow[];
};

export type PanelCrumb = {
  /** Where the right button goes back to, by name. */
  backLabel: string;
  hereLabel: string;
  profession: string | null;
};

export type PanelSides = {
  mineText: string;
  enemyText: string;
  /** Whose the two figures are. Colour alone never carries a meaning (§9.7). */
  label: string;
  /**
   * What belongs to neither side, named and counted — absent where every point
   * has one, which is every capture in the repository.
   *
   * ⚠️ **Not the pinned row's figure any more.** A blow with no actor still has
   * the side the game named at the other end, and the bar charges it there
   * (`docs/specs/2026-08-18-a-tick-nobody-swung-still-has-a-side.md`). What is
   * left here is what has no side at *either* end: a figure naming neither, and a
   * combatant the roster cannot place.
   */
  nobody: { label: string; text: string } | null;
  /**
   * The three parts of one whole, from raw sums. **Null where there is nothing
   * to divide** — a bar drawn from zero is a measurement of nothing, and this
   * used to draw a half-and-half split of it (§9.6).
   */
  shares: { mine: number; enemy: number; nobody: number } | null;
};

export type PanelView = {
  title: string;
  outcomeText: string | null;
  /**
   * Where the fight was fought, worded — or null where nothing said.
   *
   * Null rather than `""` for `outcomeText`'s reason one line up: the header is
   * three things beside each other and a missing one is missing, not blank.
   */
  placeText: string | null;
  /** The two control strips, and both speak in the metrics named above. */
  nounTabs: PanelMetricTab[];
  /**
   * The noun above turned round: two tabs, always. It read "empty where the noun
   * has only one direction" for as long as `Leczenie` was such a noun, which
   * stopped being true when healing given got a figure behind it — and stayed
   * written for two rounds after
   * (`docs/specs/2026-08-12-two-axes-and-the-other-direction.md`).
   */
  directionTabs: PanelMetricTab[];
  teamTabs: PanelTeamTab[];
  crumb: PanelCrumb | null;
  /**
   * How many bars the list asks for before it scrolls.
   *
   * Eleven under `Wszyscy`, ten under a side filter — ten is the most a side
   * fields. A number rather than a stylesheet rule so the height is computed from
   * the row token and cannot drift when the type size changes.
   *
   * ⚠️ **A breakdown gets as many as it needs, and never fewer than the ranking**,
   * and neither half of that is an inconsistency. The ranking is a list somebody
   * watches during a fight, so a height that changed as combatants joined would
   * move the window under their hand — a bigger fight scrolls instead. A breakdown
   * is opened deliberately, and it has three sections whose whole point is to be
   * compared with each other: at eleven the last two sat under the fold and the
   * panel looked like it had lost them, and at its own size it used to *shrink* on
   * the way in.
   *
   * ⚠️ **There is no ceiling here, and that is not an omission.** What a breakdown
   * may have is a question about the screen, and the composing knows nothing about
   * screens — the stylesheet caps the panel against the window and against the
   * share of it we are willing to cover.
   */
  visibleRows: number;
  /**
   * What screen this is, so a redraw of it can be told from a move to another.
   *
   * The one field nothing draws. The drawing half keeps the reader's scroll
   * position across a redraw of the same screen and drops it when they navigated;
   * it cannot work that out for itself, because a redraw builds every node again.
   */
  levelKey: string;
  lists: PanelList[];
  /** What a combatant with nothing in this metric gets instead of empty lists. */
  emptyText: string | null;
  /** And, only where it is true, what cannot be checked about them. */
  emptyLimitText: string | null;
  /**
   * The figures the protocol left half-named, pinned below the list — none, one,
   * or two of them.
   *
   * Outside `lists` because they are outside the scrolling: these are the rows
   * that say *something here is missing*, and they must not be able to leave the
   * screen.
   *
   * **Two, because the hole comes at one end or the other** — an actor with no
   * target, a target with no actor — and they are different things to be told
   * (`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`). A list rather
   * than a pair of fields, so the drawing need not know how many there are.
   *
   * **On all four screens of the ranking, and on none of the breakdowns.** Every
   * tab has something here to say, and for a whole release one of the four said
   * nothing at all. A breakdown gets none of it: there the shortfall is that
   * combatant's, and it closes their own section rather than standing over it.
   */
  pinnedRows: PanelRow[];
  /** The fight, on every screen. Null only where the game never said which side is ours. */
  sides: PanelSides | null;
  /** One sentence each, in the player's words. Empty when the reading was clean. */
  warnings: string[];
};

/**
 * What the panel shows before it has seen a fight at all.
 *
 * ⚠️ **Its own shape rather than a `PanelView` with every field emptied**, and the
 * difference is §9.6's: a view states a fight, and here there is none. The route
 * this refuses is one line — compose a view from an empty session — and it says
 * three untrue things at once. The header would read `brak składu`, as though a
 * fight had arrived with nobody in it. The warning strip would say the panel wired
 * itself in mid-fight, because an empty session is not from a fight start. And
 * every total would be `0`, which is a measurement of nothing rather than the
 * absence of one.
 *
 * So the whole of it is one sentence and a height. There is nothing here for a
 * control to act on, which is why there is no control: one that is drawn and does
 * nothing is worse than one that is not there.
 */
export type PanelWaiting = {
  /** Polish, like every filled field above (§3). */
  text: string;
  /**
   * The ranking's floor, in bars.
   *
   * Carried rather than left to the stylesheet's own fallback so the two numbers
   * cannot part company: the body a reader meets first is the height the list will
   * be, and a panel that arrives as a strip under its own title bar reads as
   * broken rather than as empty.
   */
  visibleRows: number;
};

/**
 * Which of the two screens the panel is on.
 *
 * A screen rather than a level: `fights` is not below the ranking and does not
 * open out of a row, so nothing in the drill grammar above can express it. It
 * lists **fights** where every other screen lists people, which is why it is a
 * second shape handed to a second drawing rather than a `PanelView` with the
 * combatants swapped out — the same argument `PanelWaiting` makes above.
 */
export const PANEL_SCREENS = ["fight", "fights"] as const;

export type PanelScreen = (typeof PANEL_SCREENS)[number];

/**
 * The three places a reader may keep their fights, as the panel spells them.
 *
 * ⚠️ **Spelled twice on purpose, and held to one vocabulary by a guard** (§9.3).
 * `src/userscript-storage.ts` owns the stores themselves and sits at the root of
 * `src/`, which `src/ui/` may not import — the panel is handed its document and
 * reaches for nothing, and a module carrying `localStorage` inside it is exactly
 * what that rule keeps out of here. So the names are here as vocabulary and
 * `tests/ui/panel-screen.test.ts` refuses the day the two lists stop agreeing.
 */
export const PANEL_STORAGE_CHOICES = ["local", "session", "memory"] as const;

export type PanelStorageChoice = (typeof PANEL_STORAGE_CHOICES)[number];

/**
 * One fight as the panel is handed it, before it is worded.
 *
 * ⚠️ **The clock is `{ hour, minute }` and not a timestamp**, because reading a
 * local wall clock off one means constructing a date, and §9.1 keeps `src/ui/`
 * to what it was handed. Null where the fight carries no readable time — which
 * is the honest answer and not midnight (§9.3).
 */
export type PanelKeptFight = {
  id: string;
  /** The fight the payloads are about, which is called *teraz* rather than a time. */
  isLive: boolean;
  /**
   * Whether there is anything to pin, which is not the same question as `isLive`
   * and was written as though it were.
   *
   * ⚠️ **A fight is live and kept at the same time, for as long as the gap between
   * it ending and the next one starting.** Driven in Firefox on 2026-08-26: the
   * shelf drew the finished fight twice — once as *teraz · trwa* and once as its
   * own kept row — because the two questions had one field between them. They are
   * one row now, and this is what still lets it be pinned.
   */
  isPinnable: boolean;
  isPinned: boolean;
  isSelected: boolean;
  at: { hour: number; minute: number } | null;
  /** How many fought on each side, the reader's own first. */
  sideCounts: readonly number[];
  /** Where it was fought, when the game said. Null on every fight kept before it did. */
  place: PanelPlace | null;
  /** From the reader's seat, and null where nothing places them in it. */
  outcome: PanelFightOutcome | null;
};

export type PanelFightOutcome = "won" | "lost" | "drawn";

/**
 * Where a fight happened, as the panel is handed it.
 *
 * Declared here and not imported from `src/game/`, the way `PanelReading` is and
 * for the same reason: §9.1 names no direction from `ui` to `game`, and a type
 * import is still a direction. `FightPlace` satisfies this structurally, so the
 * entry point passes the same value through untouched.
 *
 * Each member falls out on its own, because the client answers each of them
 * separately — a map part-way through loading answers none of the three.
 */
export type PanelPlace = {
  mapName: string | null;
  x: number | null;
  y: number | null;
};

/** One control on the fights screen, and the choice it carries. */
export type PanelStorageTab = { choice: PanelStorageChoice; label: string; isSelected: boolean };

/** One kept fight as a row, worded. */
export type PanelFightRow = {
  id: string;
  isLive: boolean;
  isPinnable: boolean;
  isPinned: boolean;
  isSelected: boolean;
  /** What the pin says it will do, since the mark alone does not say (§9.7). */
  pinTitle: string;
  timeText: string;
  sizesText: string;
  /**
   * Where it was, in the one cell on the row that can grow.
   *
   * ⚠️ **Last of the four, because it is the only one that may be cut.** The clock,
   * the size and the outcome are each as wide as they need to be and no wider, and
   * the place takes what is left — so a fight kept before there was a map to read
   * draws exactly the row it always drew, and a long name shortens instead of
   * pushing the size off the end.
   */
  placeText: string;
  /**
   * The whole place, for the tooltip the cell above carries.
   *
   * Two fields and not one, because they are two different answers: the cell
   * shows as much as it can draw without lying, and this is what a reader gets by
   * asking. The tile is here and not there — an ellipsis through `(128,214)`
   * leaves a number nobody wrote (§9.6).
   */
  placeTitle: string;
  outcomeText: string;
};

/**
 * The fights screen as data.
 *
 * Its own shape rather than a `PanelView` with the fields emptied, for
 * `PanelWaiting`'s reason: a view states a fight, and this states a shelf of
 * them. Every field a `PanelView` has would be answering a question nobody asked
 * here — which metric, whose breakdown, what share of what.
 */
export type PanelFightsView = {
  title: string;
  /** The way back to the fight, for a hand that would rather click than gesture. */
  backLabel: string;
  rows: PanelFightRow[];
  /** What stands where the rows would be. Null once there is one. */
  emptyText: string | null;
  storageLabel: string;
  storageTabs: PanelStorageTab[];
  /** One sentence each, in the reader's words. Empty when nothing is wrong. */
  warnings: string[];
  visibleRows: number;
};

/**
 * Everything the reader has chosen, and nothing they have not.
 *
 * Held by the caller rather than inside the composing: a view composed from state
 * is a function, and a function is what a test can drive through every screen the
 * panel has without a browser. It is declared here, beside the four functions that
 * produce one, rather than in `panel-view.ts` which only ever reads it.
 */
export type PanelState = {
  /**
   * Which screen, and it is deliberately not a level.
   *
   * `composeStateAfterBack` steps out of it before it steps out of a drill,
   * because the fights screen stands over the drill rather than under it: a
   * reader who opened the shelf while a breakdown was up is asking to leave the
   * shelf, not to close the breakdown they cannot see.
   */
  screen: PanelScreen;
  metric: PanelMetric;
  team: PanelTeam;
  /** Whose breakdown is open, and how far into it. */
  focusCombatantId: number | null;
  focusTargetId: number | null;
  /**
   * Which skill is open, and **whose**.
   *
   * The owner travels with the key because a key alone does not identify one:
   * two combatants announcing the same skill share it, and under `Leczenie` the
   * section is built from everybody else's skills, so the row that was clicked
   * belongs to somebody other than the combatant in focus. Measured on the group
   * capture — two combatants announce the same skill and both heal the same
   * target, 11 733 and 10 204 — and picking the first match opened the wrong one.
   *
   * One pair rather than two loose fields: two optionals that must be set and
   * cleared together are an invariant five call sites have to remember, and §9.5
   * puts an assumption like that in the type instead.
   */
  focusSkill: { ownerId: number; key: string } | null;
  isCollapsed: boolean;
};

export function composeDefaultState(): PanelState {
  return {
    screen: "fight",
    metric: "dealt",
    team: "all",
    focusCombatantId: null,
    focusTargetId: null,
    focusSkill: null,
    isCollapsed: false,
  };
}

/**
 * What a clicked row does to the state.
 *
 * The key is the view's own and its prefix is what says which level was clicked;
 * reading it here rather than passing three optional ids keeps `ui` free of the
 * question "which of these is set".
 */
export function composeStateFromRow(state: PanelState, key: string): Partial<PanelState> {
  const meaning = getRowKeyMeaning(key);
  switch (meaning.opens) {
    case "back":
      return composeStateAfterBack(state);
    case "combatant":
      return {
        focusCombatantId: meaning.combatantId,
        focusTargetId: null,
        focusSkill: null,
      };
    case "target":
      return { focusTargetId: meaning.combatantId, focusSkill: null };
    case "skill":
      return {
        focusSkill: { ownerId: meaning.ownerId, key: meaning.key },
        focusTargetId: null,
      };
    case "nothing":
      // A row that opens no level, said as a case rather than by falling
      // through: the compiler refuses a meaning nobody decided about.
      return {};
  }
}

/**
 * A side tab chooses who is on the list, so choosing one closes the breakdown.
 *
 * Further than the metric goes, and the asymmetry is the point: the same
 * combatant exists in every metric, so switching metric keeps them in focus —
 * but a side filter decides *who is on the list at all*, and can put the one in
 * focus off it. Measured against the alternative: while a breakdown is open the
 * team changes nothing on screen at either level, so a tab that only dropped the
 * deep level would still look chosen while the panel did not move.
 *
 * Rejected: dropping the focus only when the filter excludes them. That needs
 * the admission rule outside `ui`, where this file would hold a second copy of
 * the ranking's logic — §9.1's line, spent on a nicety.
 */
export function composeStateAfterTeam(team: PanelTeam): Partial<PanelState> {
  return { team, focusCombatantId: null, focusTargetId: null, focusSkill: null };
}

/**
 * Both control strips land here, because both answer the same question: which
 * figure. What they share is the reset, and the deep level is the part that must
 * go.
 *
 * ⚠️ **A deep level does not survive turning the figure round.** Under
 * `Leczenie · otrzymane` an open skill belongs to whoever cast it — somebody
 * other than the combatant in focus — while under `Leczenie · dane` the skills
 * are the combatant's own. Carrying `focusSkill` across the flip opens a key that
 * is not on that side of the join, and the same is true of `focusTargetId`, whose
 * end of the pair the direction decides. The combatant stays: they exist in every
 * metric, which is the asymmetry `composeStateAfterTeam` above is about.
 */
export function composeStateAfterMetric(metric: PanelMetric): Partial<PanelState> {
  return { metric, focusTargetId: null, focusSkill: null };
}

/**
 * One level out, and only one: the way back is as small a step as the way in.
 *
 * The shelf comes first because it is not a level. It covers the whole panel, so
 * a drill left open underneath is not something the reader can see to be leaving
 * — closing that first would spend their gesture on a screen nobody is looking
 * at, and they would press again.
 */
export function composeStateAfterBack(state: PanelState): Partial<PanelState> {
  if (state.screen === "fights") return { screen: "fight" };
  if (state.focusTargetId !== null || state.focusSkill !== null) {
    return { focusTargetId: null, focusSkill: null };
  }
  return { focusCombatantId: null };
}

/** The shelf, over whatever the reader was reading — nothing below it moves. */
export function composeStateAfterFightsOpened(): Partial<PanelState> {
  return { screen: "fights" };
}

/**
 * A fight picked off the shelf, which is a different fight and so a different
 * ranking.
 *
 * The drill goes for `composeStateAfterFightStart`'s reason and not a weaker one:
 * a breakdown is opened on somebody, and the somebody belongs to the fight it was
 * opened in. The metric and the side stay, because those are standing choices
 * about which figure is being read — which is the same asymmetry the whole file
 * keeps.
 */
export function composeStateAfterFightChosen(): Partial<PanelState> {
  return { screen: "fight", focusCombatantId: null, focusTargetId: null, focusSkill: null };
}

/**
 * A new fight puts the reader back at the top of the tab they chose.
 *
 * The one reducer here that no gesture produces: what changed is the fight, and
 * the levels below the ranking are the part of the state that belonged to the
 * one that is over. A breakdown left open across the boundary is not wrong — the
 * rows under it are the new fight's — it is somewhere nobody asked to be, and
 * the way out of it is a right-press the reader has to already know about.
 *
 * ⚠️ **What is *not* returned is the decision.** `metric` and `team` stay,
 * because a tab is a standing choice about which figure is being read rather
 * than a level that was opened; `isCollapsed` stays because it is the window and
 * not the view. It is the asymmetry `composeStateAfterTeam` above argues from
 * the other end: a side filter drops the drill because it decides who is on the
 * list, and nothing here decides that.
 *
 * Takes no state, which is what says it is not a step: every other reducer here
 * has to read where the reader is, and this one goes to the same place from
 * everywhere.
 *
 * ⚠️ **Every sentence above is about a reader watching the fight that is
 * starting**, so the entry point applies it to that reader and to no other: a
 * reader on a fight off the shelf keeps their levels, because the rows under them
 * belong to the fight they chose and not to the one the game has just begun
 * (`src/userscript-entry.ts`). Said here as well as there, because a reader of
 * this file would otherwise read the paragraph above as an absolute (§7.5).
 */
export function composeStateAfterFightStart(): Partial<PanelState> {
  return { focusCombatantId: null, focusTargetId: null, focusSkill: null };
}
