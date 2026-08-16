/**
 * What the panel shows, as data.
 *
 * The drawing is a separate file and a thin one, because everything worth
 * getting right is here: which rows exist, in what order, how long each bar is,
 * what each figure is divided by, and which of them cannot be trusted. None of
 * that needs a browser to check, and there is no browser in the test runner.
 *
 * §9.1 holds even inside `ui/`: nothing here computes a statistic. It takes what
 * the aggregate produced and decides how to present it.
 *
 * **The strings are Polish and nothing else here is** (§3). A sentence a player
 * reads never carries our vocabulary: it says what cannot be known, not why our
 * reader cannot know it. Every name of the game's own — a key, an effect token —
 * is named before it reaches a label, and `src/ui/panel-names.ts` decides by
 * whom: the running client where it has a name for the thing, and this
 * repository where it has not. A token nobody has named travels as the game
 * wrote it rather than as a guess.
 */

import { composeDecimalText, composeIntegerText } from "@/libs/number.ts";
import { getCollatedTextOrder } from "@/libs/text-order.ts";
import { getCombatantIdByName, type CombatantRoster } from "@/src/core/combatant-roster.ts";
import type {
  CombatantStatistics,
  FightStatistics,
  SkillStatistics,
} from "@/src/core/fight-statistics.ts";
import {
  DEFENCE_NAMES,
  DESTRUCTION_NAMES,
  EFFECT_NAMES,
  ELEMENT_NAMES,
  getPhrase,
  HEALTH_SOURCE_NAMES,
  PROFESSION_NAMES,
  type TokenName,
  type TranslateLabel,
} from "@/src/ui/panel-names.ts";
import { getProfessionColour, UNKNOWN_COLOUR } from "@/src/ui/panel-tokens.ts";
import { setRunningTotal } from "@/libs/running-total.ts";

/**
 * What the panel is handed.
 *
 * Declared here rather than imported from `src/game/battle-session.ts`, where the
 * running add-on composes it. §9.1 lets `ui` depend on `core` and on `libs`, and
 * names no direction from `ui` to `game`; a type import is still a direction, and
 * it is the one that would make the panel unusable without an engine.
 *
 * `FightReading` satisfies this structurally, so the entry point — the one file
 * that may know both — keeps passing the same value through untouched.
 */
export type PanelReading = {
  statistics: FightStatistics;
  roster: CombatantRoster;
  /** Which side is the watcher's own, when the game said. Never guessed. */
  ourSide: number | null;
  isFromFightStart: boolean;
  /**
   * What the game handed over that never became part of the fight.
   *
   * Declared here rather than imported, the same way `ourSide` and
   * `isFromFightStart` are: the shape is `game`'s to produce and this file must
   * not learn that a game engine exists (§9.1). Structural typing is what lets
   * both be true.
   *
   * **Optional here and required there.** A caller with no engine — the offline
   * tools, every test in this file — truthfully has nothing to say about it, and
   * saying nothing is not the same as saying zero. The producer cannot leave it
   * out, which is where forgetting it would matter.
   */
  engineReading?:
    | {
        /** Keyed by what was wrong; the keys are `game`'s vocabulary, not ours. */
        unreadablePayloadsByFault: ReadonlyMap<string, number>;
        lostMessages: number;
        unreadableCombatants: number;
      }
    | undefined;
};

export const PANEL_METRICS = ["dealt", "taken", "healingGiven", "healed"] as const;
export type PanelMetric = (typeof PANEL_METRICS)[number];

export const PANEL_TEAMS = ["all", "mine", "enemy"] as const;
export type PanelTeam = (typeof PANEL_TEAMS)[number];

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
export const PANEL_NOUNS = ["damage", "healing"] as const;
export type PanelNoun = (typeof PANEL_NOUNS)[number];

export const PANEL_DIRECTIONS = ["given", "received"] as const;
export type PanelDirection = (typeof PANEL_DIRECTIONS)[number];

const METRIC_AXES: Record<PanelMetric, { noun: PanelNoun; direction: PanelDirection }> = {
  dealt: { noun: "damage", direction: "given" },
  taken: { noun: "damage", direction: "received" },
  healingGiven: { noun: "healing", direction: "given" },
  healed: { noun: "healing", direction: "received" },
};

/**
 * Everything the reader has chosen, and nothing they have not.
 *
 * Held by the caller rather than inside this module: a view composed from state
 * is a function, and a function is what a test can drive through every screen the
 * panel has without a browser.
 */
export type PanelState = {
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
    metric: "dealt",
    team: "all",
    focusCombatantId: null,
    focusTargetId: null,
    focusSkill: null,
    isCollapsed: false,
  };
}

const METRIC_LABELS: Record<PanelMetric, string> = {
  dealt: "Zadane",
  taken: "Otrzymane",
  healingGiven: "Leczenie dane",
  healed: "Leczenie",
};

const TEAM_LABELS: Record<PanelTeam, string> = {
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
 * The two questions every branch below used to ask by naming a metric.
 *
 * *Which quantity* and *which way round* are independent, and spelling them as
 * one name meant a fourth screen could not be added without revisiting twenty
 * conditions that each looked like they were about `dealt`. Most were about
 * **given**.
 */
function isHealingMetric(metric: PanelMetric): boolean {
  return METRIC_AXES[metric].noun === "healing";
}

function isGivenMetric(metric: PanelMetric): boolean {
  return METRIC_AXES[metric].direction === "given";
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

function composeDirectionTabs(
  current: PanelMetric,
): Array<{ metric: PanelMetric; label: string; isSelected: boolean }> {
  const noun = METRIC_AXES[current].noun;
  const metrics = getMetricsByNoun(noun);
  if (metrics.length < 2) return [];
  return metrics.map((metric) => ({
    metric,
    label: DIRECTION_LABELS[noun][METRIC_AXES[metric].direction],
    isSelected: metric === current,
  }));
}

/** Thousands spaced, as the game itself writes them. */
export function composeFigureText(value: number): string {
  return composeSpacedThousands(composeIntegerText(Math.round(value)));
}

/**
 * A run of digits, spaced every three from the right.
 *
 * One function because two kinds of number need it and only one had it: a rate
 * read `39362,0/t` beside a total reading `354 258`, which is the same figure
 * written two ways on one row.
 */
function composeSpacedThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function composeShareText(share: number): string {
  return `${composeDecimalText(share * 100, 0)}%`;
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
   * The share, and the other measure, in one bracket beside the figure.
   *
   * **Null where the figure has no share to state**, which is not the same as a
   * share of nothing: the pinned row is fight-wide, so under a side filter its
   * figure is not inside the denominator the rest of the screen divides by, and
   * a percentage of the wrong whole came out at 320%. Nullable rather than
   * empty, so the compiler asks the question at every row that is built.
   */
  bracketText: string | null;
  /** Whether a click goes anywhere. A leaf that offered one would be a lie. */
  canDrill: boolean;
  /** Detail on demand (§9.6). Empty means there is nothing more to say. */
  detail: PanelDetailLine[];
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
   * has one. Under a given direction this is the pinned row's own figure seen
   * from the other question: a blow with no actor has no side to be put on.
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
   * The two control strips, and both speak in metrics.
   *
   * A tab carries the metric it would switch *to*, so the drawing reports one
   * kind of choice however many axes the panel grows: which figure. The rule that
   * a noun keeps the reader's direction lives here, where it is checkable without
   * a browser, rather than in the file that draws buttons.
   */
  nounTabs: Array<{ metric: PanelMetric; label: string; isSelected: boolean }>;
  /**
   * Empty where the noun has only one direction — `Leczenie` until healing given
   * has a figure behind it. A control that is drawn and does nothing is worse
   * than one that is absent (§9.6), so it is not drawn.
   */
  directionTabs: Array<{ metric: PanelMetric; label: string; isSelected: boolean }>;
  teamTabs: Array<{ team: PanelTeam; label: string; isSelected: boolean }>;
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
   * may have is a question about the screen, and this file knows nothing about
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
   * The figure nobody can be charged with, pinned below the list.
   *
   * Outside `lists` because it is outside the scrolling: it is the one row that
   * says *something here is missing*, and it must not be able to leave the screen.
   *
   * **On all four screens of the ranking, and on none of the breakdowns.** Every
   * tab has something here to say — two of them that the figure stands apart, two
   * that it is already inside the rows — and for a whole release one of the four
   * said nothing at all. A breakdown gets none of it: there the shortfall is that
   * combatant's, and it closes their own section rather than standing over it.
   */
  pinnedRow: PanelRow | null;
  /** The fight, on every screen. Null only where the game never said which side is ours. */
  sides: PanelSides | null;
  /** One sentence each, in the player's words. Empty when the reading was clean. */
  warnings: string[];
};

const EMPTY_ROW: CombatantStatistics = {
  dealtRaw: 0,
  dealtApplied: 0,
  dealtAppliedByElement: new Map(),
  taken: 0,
  takenByElement: new Map(),
  healed: 0,
  healthLost: 0,
  prevented: new Map(),
  destroyed: new Map(),
  procsOnBlowsStruck: new Map(),
  skillsUsed: 0,
  blowsStruck: 0,
  largestBlow: 0,
  blowsWithoutSkill: 0,
  dealtByTargetId: new Map(),
  takenByActorId: new Map(),
  healthLostBySource: new Map(),
  healedBySource: new Map(),
  healedByHealerId: new Map(),
  healingGiven: 0,
  healingGivenByCombatantId: new Map(),
  skills: new Map(),
};

function getRow(reading: PanelReading, combatantId: number): CombatantStatistics {
  return reading.statistics.byCombatantId.get(combatantId) ?? EMPTY_ROW;
}

function getName(reading: PanelReading, combatantId: number): string {
  return reading.roster.byId.get(combatantId)?.name ?? `#${composeIntegerText(combatantId)}`;
}

/**
 * What a combatant's figure is for this metric.
 *
 * **Taken is a blow plus health that fell on its own**, and the two are separate
 * in the aggregate for a reason that does not apply here: they differ by whether
 * anyone can be charged with them, and to the combatant losing the health that is
 * no difference at all. Measured on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`:
 * leaving the second out would show the boss 49 318 short, 13% of everything
 * that hit it.
 */
function getMetricValue(row: CombatantStatistics, metric: PanelMetric): number {
  if (metric === "dealt") return row.dealtApplied;
  if (metric === "taken") return row.taken + row.healthLost;
  if (metric === "healingGiven") return row.healingGiven;
  return row.healed;
}

/** The share of a bar this figure fills, and never a `NaN` that would blank the rest. */
function getFill(value: number, largest: number): number {
  if (largest <= 0) return 0;
  return value / largest;
}

/** The bracket beside the figure: what share of the whole it is. */
function composeBracket(share: number): string {
  return `(${composeShareText(share)})`;
}

/**
 * Whether the pinned figure is inside the denominator this screen divides by.
 *
 * The pinned row is fight-wide and says so, but `getWholeOnScreen` under a side
 * filter is the rows that filter admits. Under a *given* direction that is still
 * one whole containing the figure — `getFigureOutsideRows` adds it. Under a
 * *received* one it does not: the health landed on somebody, so what is added is
 * only the part no row holds at all, which is zero on every capture. A fight-wide
 * numerator over one side's denominator then reads as a share of something that
 * does not exist.
 *
 * ⚠️ **Measured, not feared.** Over the material as it stood when this was
 * decided, a fifth of the filtered received screens printed a share above a
 * hundred — 320% under `Leczenie · Oni` on
 * `tests/captured-fights/2026-08-11-tempest-tancerz-vs-wermont.json`, 248% under
 * `Leczenie · My` on
 * `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json` — and two
 * printed `(0%)` beside a five-figure number, because the opposing side received
 * no healing and the denominator was zero. Both are the same fault from opposite
 * ends, and §9.6 forbids the second twice over: a real figure drawn as nothing.
 */
function hasShareOnScreen(state: PanelState): boolean {
  return state.team === "all" || isGivenMetric(state.metric);
}

/** Everyone the current filter admits, biggest first. */
function getRankedIds(reading: PanelReading, state: PanelState): number[] {
  const ids = [...reading.statistics.byCombatantId.keys()].filter((id) => {
    const side = reading.roster.byId.get(id)?.side ?? null;
    if (state.team === "all") return true;
    if (side === null || reading.ourSide === null) return false;
    return state.team === "mine" ? side === reading.ourSide : side !== reading.ourSide;
  });

  return ids.sort((one, other) => {
    const byValue =
      getMetricValue(getRow(reading, other), state.metric) -
      getMetricValue(getRow(reading, one), state.metric);
    // A stable second key, so two combatants on zero do not swap places between
    // renders — the panel redraws every few seconds and a list that reshuffles
    // under the eye is unreadable.
    return byValue !== 0
      ? byValue
      : getCollatedTextOrder(getName(reading, one), getName(reading, other), "pl");
  });
}

/**
 * The counters line: how somebody fought, in one sentence.
 *
 * ⚠️ **Still no dodges, and the reason has changed.** It used to be that the
 * decoder had no entry for `-evade`; it has one now, and the captures carry three.
 * What stops it becoming `uniki 3` here is whose it would be: every flag is
 * counted against **whoever swung**, so on a row it means blows that combatant
 * threw and somebody dodged — not times they dodged. Under that label it would be
 * read as the second, so it stays among the effects, where the heading says the
 * figures belong to the blow (`CombatantStatistics.procsOnBlowsStruck`).
 */
function composeCounters(row: CombatantStatistics): string[] {
  // The bracket belongs to the number it breaks down: blows nobody announced are
  // part of the blows, not a second kind of thing standing beside them.
  const counters = [
    `ciosy ${composeFigureText(row.blowsStruck)}${
      row.blowsWithoutSkill > 0 ? ` (w tym ${composeFigureText(row.blowsWithoutSkill)} zwykłe)` : ""
    }`,
  ];

  const critical = row.procsOnBlowsStruck.get("crit") ?? 0;
  const veryCritical = row.procsOnBlowsStruck.get("legbon_verycrit") ?? 0;
  // The bracket belongs to the number it breaks down: very critical hits are part
  // of critical ones, and standing beside them as their own member would invite
  // adding the two.
  counters.push(
    `kryt. ${composeFigureText(critical)}${veryCritical > 0 ? ` (w tym ${composeFigureText(veryCritical)} bardzo)` : ""}`,
  );
  if (row.largestBlow > 0) counters.push(`maks. cios ${composeFigureText(row.largestBlow)}`);
  return counters;
}

function composeStat(label: string, value: string, isStrong = false): PanelDetailLine {
  return { kind: "stat", label, value, isStrong };
}

/**
 * Everything a combatant's row says on demand.
 *
 * The order answers the question a person actually has, in the order they have
 * it: who is this, how much of each, over how many turns, how they fought, what
 * fired, what was stopped. The metric on screen is the one in bold — the others
 * are there so that "he dealt a lot, but how much did he take" needs no click.
 */
function composeCombatantDetail(
  reading: PanelReading,
  combatantId: number,
  state: PanelState,
  translate: TranslateLabel | null,
): PanelDetailLine[] {
  const row = getRow(reading, combatantId);
  const combatant = reading.roster.byId.get(combatantId);
  const lines: PanelDetailLine[] = [{ kind: "title", text: getName(reading, combatantId) }];

  const profession = combatant?.profession ?? null;
  const level = combatant?.level ?? null;
  if (profession !== null || level !== null) {
    const named = profession === null ? "nieznana profesja" : getPhrase(PROFESSION_NAMES, profession, translate);
    lines.push({
      kind: "heading",
      text: level === null ? named : `${named} (${composeIntegerText(level)})`,
    });
  }

  for (const metric of PANEL_METRICS) {
    const value = getMetricValue(row, metric);
    lines.push(
      composeStat(METRIC_LABELS[metric], composeFigureText(value), metric === state.metric),
    );
    // Taken is the one figure made of two readings, so it says so where it
    // stands rather than leaving the difference to be discovered.
    if (metric === "taken" && row.healthLost > 0) {
      lines.push(composeStat("  z ciosów", composeFigureText(row.taken)));
      lines.push(composeStat("  bez sprawcy", composeFigureText(row.healthLost)));
    }
  }

  if (row.skillsUsed > 0) {
    lines.push(composeStat("Użycia umiejętności", composeFigureText(row.skillsUsed)));
  }
  lines.push({ kind: "note", text: composeCounters(row).join(" · ") });

  const effects = [...row.procsOnBlowsStruck]
    .filter(([token]) => token !== "crit" && token !== "legbon_verycrit")
    .map(([token, count]) => `${getPhrase(EFFECT_NAMES, token, translate)} ×${composeFigureText(count)}`);
  if (effects.length > 0) {
    lines.push({ kind: "heading", text: "Efekty w ciosach" });
    lines.push({ kind: "note", text: effects.join(" · ") });
  }

  // Two blocks rather than one `·`-joined line, and they are separated because the
  // figures are not the same kind of thing: one is damage that did not arrive, the
  // other is a statistic of this combatant that an attacker reduced. Strung
  // together they read as one list of "defence stuff" and invited an addition
  // across units that §10 forbids.
  const stopped = [...row.prevented].filter(([, amount]) => amount > 0);
  if (stopped.length > 0) {
    lines.push({ kind: "heading", text: "Zatrzymane" });
    for (const [token, amount] of stopped) {
      lines.push(composeStat(getPhrase(DEFENCE_NAMES, token, translate), composeFigureText(amount)));
    }
    // Said once, where the figures are: a defence is one part of the reduction and
    // the protocol reports neither armour nor resistance, so these do not add up to
    // what a blow lost on the way in (§10).
    lines.push({ kind: "note", text: "To część tego, co nie doszło — reszty gra nie podaje." });
  }

  const destroyed = [...row.destroyed].filter(([, amount]) => amount > 0);
  if (destroyed.length > 0) {
    lines.push({ kind: "heading", text: "Zniszczone" });
    for (const [token, amount] of destroyed) {
      lines.push(composeStat(getPhrase(DESTRUCTION_NAMES, token, translate), composeDestructionText(token, amount)));
    }
  }

  // The only instruction the panel gives, and it is true at every level: there is
  // always somewhere to go back to once there is somewhere to go into.
  lines.push({ kind: "note", text: "LPM — rozbicie · PPM — powrót" });
  return lines;
}

/** One ranking row. The bar is measured against the biggest figure on screen. */
function composeRankedRow(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  rank: number,
  whole: number,
  largest: number,
  translate: TranslateLabel | null,
): PanelRow {
  const raw = getMetricValue(getRow(reading, combatantId), state.metric);
  return {
    key: `combatant:${composeIntegerText(combatantId)}`,
    rank,
    label: getName(reading, combatantId),
    profession: reading.roster.byId.get(combatantId)?.profession ?? null,
    colour: getProfessionColour(reading.roster.byId.get(combatantId)?.profession ?? null),
    fill: getFill(raw, largest),
    valueText: composeFigureText(raw),
    bracketText: composeBracket(whole > 0 ? raw / whole : 0),
    canDrill: true,
    detail: composeCombatantDetail(reading, combatantId, state, translate),
  };
}

/**
 * Damage nobody can be charged with — ticking poison, a wound delivered later.
 *
 * Fight-wide even under a side filter, because there is no actor to split it by.
 * Splitting it by *victim* would be a different axis than the list uses and would
 * read as if that side had dealt it, so the detail says the scope out loud
 * instead.
 */
function getUnattributedDamage(reading: PanelReading): number {
  let total = reading.statistics.unattributed.dealtApplied;
  for (const row of reading.statistics.byCombatantId.values()) total += row.healthLost;
  return total;
}

function getUnattributedDamageBySource(reading: PanelReading): Map<string, number> {
  const sources = new Map<string, number>();
  for (const row of reading.statistics.byCombatantId.values()) {
    for (const [token, amount] of row.healthLostBySource) {
      setRunningTotal(sources, token, amount);
    }
  }
  return sources;
}

/**
 * A destroyed statistic, with its unit — because the members do not share one.
 *
 * `+resdmg` is stated in **percentage points** while `+acdmg` and the two
 * absorption keys are in points, despite what `_per` in their names suggests
 * (`docs/protocol-keys.md`). Carrying the unit in the value is what keeps the
 * block honest without a total: four bare figures under one heading read as four
 * of the same thing, and adding them would be the mistake §10 names.
 */
function composeDestructionText(token: string, amount: number): string {
  return token === "resdmg" ? `${composeFigureText(amount)}%` : composeFigureText(amount);
}

/** Healing that arrived with no announcement over it, and so with no healer. */
function getHealingWithoutHealer(row: CombatantStatistics): number {
  const named = [...row.healedByHealerId.values()].reduce((sum, one) => sum + one, 0);
  return Math.max(0, row.healed - named);
}

/**
 * What the pinned row will say, before there is a row to say it.
 *
 * Its own function because the bar's scale has to know it: the row is measured
 * against the largest figure **on screen**, and it is itself on screen. Measured
 * on the captures — under `Leczenie` this figure beats every ranked row in most
 * of them, by more than half again at the widest — and a fill over one is
 * clipped by
 * `.row { overflow: hidden }` into a bar that looks exactly like a full one.
 *
 * ⚠️ **It depends on the noun and not on the direction, and that is the whole
 * point of it.** The same points read from either end: given plus this is
 * everything received, so the row is what makes the two directions balance
 * instead of disagree. Measured on every capture, both nouns — the figure
 * and its share come out identical under `Zadane` and `Otrzymane` (on
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`, 49 318 and
 * 6.7% against Hildur), which is `Σ dealt + unattributed = Σ taken` said in the
 * panel's own arithmetic.
 */
function getPinnedValue(reading: PanelReading, state: PanelState): number {
  if (!isHealingMetric(state.metric)) return getUnattributedDamage(reading);
  return (
    [...reading.statistics.byCombatantId.values()].reduce(
      (sum, row) => sum + getHealingWithoutHealer(row),
      0,
    ) + reading.statistics.unattributed.healed
  );
}

/**
 * The part of this screen's quantity that **no row holds** — what the rows are
 * short of the fight by, and the one thing three decisions now share.
 *
 * **The direction settles it.** A figure with no actor is on nobody's *given* row
 * by definition, so under `Zadane` and `Leczenie dane` it is the pinned figure
 * entire. Under a received direction the health it moved landed on somebody and is
 * counted there, and what is left over is only what the aggregate could not place
 * at all: a target or a recipient that did not resolve. Zero on every capture,
 * and read rather than written as zero — a figure that happens to be
 * zero because nothing has broken yet is exactly the kind this panel exists not
 * to miss.
 *
 * Three callers and one fact, which is why it is a function: the screen's whole
 * grows by this, the summary's third part is this, and the sentence the pinned row
 * says about itself turns on whether it is the whole figure or the remainder.
 */
function getFigureOutsideRows(reading: PanelReading, state: PanelState): number {
  if (isGivenMetric(state.metric)) return getPinnedValue(reading, state);
  return isHealingMetric(state.metric)
    ? reading.statistics.unattributed.healed
    : reading.statistics.unattributed.taken;
}

/**
 * What every share on this screen is a share of — **one figure, used by every
 * bracket the screen draws.**
 *
 * ⚠️ **The ranking and the pinned row used to divide by different things.** The
 * rows divided by the ranking and summed to 100%; the pinned row divided by the
 * ranking plus itself. Under `Zadane` that showed as rows adding to 107% and
 * nobody noticed; under `Leczenie dane` it showed as a ranking summing to 100%
 * beside a row saying 79%, which is two answers to two questions printed as
 * though they answered one.
 *
 * The whole is what is **on screen**: the rows the filter admits, plus whatever
 * no row holds — counted once. Under a received direction the pinned figure is
 * already inside the rows, because health nobody can be charged with still landed
 * on somebody; only the part belonging to nobody at all is outside. So the two
 * brackets there answer one question about one whole and still overlap, which is
 * the truth about them: they are two cuts of the same quantity, and the pinned row
 * says so in its own words rather than by arithmetic.
 */
function getWholeOnScreen(reading: PanelReading, state: PanelState, total: number): number {
  return total + getFigureOutsideRows(reading, state);
}

/** What the game did not say, per noun. The limit, never our reason for it. */
const PINNED_LIMIT_NOTES: Record<PanelNoun, string> = {
  damage: "Gra nie mówi, kto to zadał — wiadomo tylko, że życia ubyło.",
  healing: "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.",
};

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

function composePinnedRow(
  reading: PanelReading,
  state: PanelState,
  whole: number,
  largest: number,
  translate: TranslateLabel | null,
): PanelRow | null {
  const isHealing = isHealingMetric(state.metric);

  const value = getPinnedValue(reading, state);
  if (value <= 0) return null;

  const lines: PanelDetailLine[] = [
    { kind: "title", text: "Bez sprawcy" },
    { kind: "note", text: PINNED_LIMIT_NOTES[METRIC_AXES[state.metric].noun] },
    { kind: "note", text: PINNED_STANDING_NOTES[state.metric] },
  ];
  if (isHealing) {
    lines.push({ kind: "heading", text: "Komu" });
    for (const [id, row] of [...reading.statistics.byCombatantId].sort(
      ([, one], [, other]) => getHealingWithoutHealer(other) - getHealingWithoutHealer(one),
    )) {
      const amount = getHealingWithoutHealer(row);
      if (amount > 0) lines.push(composeStat(getName(reading, id), composeFigureText(amount)));
    }
  } else {
    // The source key both ways round: it is the only name the log has for these
    // points, and a reader on `Otrzymane` wants it exactly as much — their own
    // row already tells them how much, never what.
    lines.push({ kind: "heading", text: "Z czego" });
    for (const [token, amount] of [...getUnattributedDamageBySource(reading)].sort(
      ([, one], [, other]) => other - one,
    )) {
      lines.push(composeStat(getPhrase(HEALTH_SOURCE_NAMES, token, translate), composeFigureText(amount)));
    }
  }
  if (state.team !== "all") {
    lines.push({
      kind: "note",
      text: "Z całej walki — bez sprawcy nie ma czego przypisać do strony.",
    });
  }

  return {
    key: "nobody",
    rank: null,
    label: "Bez sprawcy",
    profession: null,
    colour: UNKNOWN_COLOUR,
    // Measured against the same figure every other bar is, or the row that says
    // something is missing would look like the largest thing in the fight.
    fill: getFill(value, largest),
    valueText: composeFigureText(value),
    bracketText: hasShareOnScreen(state) ? composeBracket(whole > 0 ? value / whole : 0) : null,
    canDrill: false,
    detail: lines,
  };
}

type BreakdownEntry = {
  key: string;
  label: string;
  profession: string | null;
  colour: string;
  amount: number;
  canDrill: boolean;
  /** Announced skills carry theirs; nothing else has one. */
  uses: number | null;
  detail: PanelDetailLine[];
};

/** One section of a breakdown. Its total equals the figure it was entered from. */
function composeBreakdownList(
  heading: string,
  entries: readonly BreakdownEntry[],
): PanelList | null {
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const largest = entries.reduce((most, entry) => Math.max(most, entry.amount), 0);

  return {
    heading,
    totalText: composeFigureText(total),
    rows: entries.map((entry) => ({
      key: entry.key,
      rank: null,
      label: entry.label,
      profession: entry.profession,
      colour: entry.colour,
      fill: largest > 0 ? entry.amount / largest : 0,
      valueText: composeFigureText(entry.amount),
      bracketText: `(${composeShareText(total > 0 ? entry.amount / total : 0)}${entry.uses === null ? "" : ` · ×${composeFigureText(entry.uses)}`})`,
      canDrill: entry.canDrill,
      detail: entry.detail,
    })),
  };
}

/**
 * What the row holds that no pair does, and which end of the pair is missing.
 *
 * The two directions are short for **different reasons** and a shared sentence
 * would be wrong on two screens: under a received direction nobody swung or
 * healed, under a given one somebody did and the game named a target this fight
 * has nobody to match. Four entries, so the compiler asks about a fifth screen
 * rather than letting it inherit whichever wording came first.
 */
const MISSING_COUNTERPARTS: Record<PanelMetric, { label: string; note: string }> = {
  dealt: {
    label: "Nie wiadomo, w kogo",
    note: "Gra nie mówi, w kogo — wiadomo tylko, że cios wszedł.",
  },
  taken: {
    label: "Bez sprawcy",
    note: "Gra nie mówi, kto to zadał — wiadomo tylko, że życia ubyło.",
  },
  healingGiven: {
    label: "Nie wiadomo, komu",
    note: "Gra nie mówi, komu — wiadomo tylko, że leczenie weszło.",
  },
  healed: {
    label: "Bez sprawcy",
    note: "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.",
  },
};

/** Who this combatant hit, or who hit them, or who healed them. */
function composeOpponentEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
): BreakdownEntry[] {
  const row = getRow(reading, combatantId);
  const pairs: Array<readonly [number, number]> =
    state.metric === "dealt"
      ? [...row.dealtByTargetId].map(
          ([id, byElement]) => [id, [...byElement.values()].reduce((sum, one) => sum + one, 0)] as const,
        )
      : state.metric === "taken"
        ? [...row.takenByActorId].map(
            ([id, byElement]) => [id, [...byElement.values()].reduce((sum, one) => sum + one, 0)] as const,
          )
        : state.metric === "healingGiven"
          ? [...row.healingGivenByCombatantId]
          : [...row.healedByHealerId];

  const entries: BreakdownEntry[] = pairs
    .filter(([, amount]) => amount > 0)
    .sort(([, one], [, other]) => other - one)
    .map(([id, amount]) => ({
      key: `target:${composeIntegerText(id)}`,
      label: getName(reading, id),
      profession: reading.roster.byId.get(id)?.profession ?? null,
      colour: getProfessionColour(reading.roster.byId.get(id)?.profession ?? null),
      amount,
      canDrill: true,
      uses: null,
      detail: [],
    }));

  // The part with no counterpart stands in the same section, or the section would
  // total less than the row it was entered from with nothing saying why.
  //
  // ⚠️ Taken as the row's own figure minus what the pairs hold, rather than named
  // per metric. Spelled out, two of the four cases were simply missing: the pairs
  // are only written where the other end **resolved**, while the row's figure is
  // added whatever happened, so a target the roster cannot place left the section
  // short. Measured on a fight whose target name is not in the roster — the shape
  // a fight joined in progress gives, since names then resolve to nobody — a
  // combatant ranked at 400 opened onto no sections at all.
  const orphan = getMetricValue(row, state.metric) - pairs.reduce((sum, [, amount]) => sum + amount, 0);
  if (orphan > 0) {
    const missing = MISSING_COUNTERPARTS[state.metric];
    entries.push({
      key: "nobody",
      label: missing.label,
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount: orphan,
      canDrill: false,
      uses: null,
      detail: [{ kind: "note", text: missing.note }],
    });
  }

  return entries;
}

/**
 * The row that closes a section against the row above it.
 *
 * Keyed by the two metrics that reach it rather than by all three, so the
 * compiler refuses a metric nobody decided about — the previous spelling was a
 * ternary defaulting `taken` into the wording for `dealt`, which was only right
 * because of an early return forty lines above it.
 */
const CLOSING_LABELS: Record<PanelMetric, string> = {
  dealt: "Zwykły cios",
  taken: "Zwykły cios",
  // Never reached: healing given is by definition what an announcement carried,
  // so the section already closes against the row. Decided rather than defaulted,
  // because a table that guesses is the thing this table exists to prevent.
  healingGiven: "Nie wiadomo, czym",
  healed: "Nie wiadomo, czym",
};

const CLOSING_NOTES: Record<PanelMetric, string> = {
  dealt:
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
  taken:
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
  healingGiven: "Nic nie zapowiedziało tego leczenia, więc gra nie mówi, co je dało.",
  healed: "Nic nie zapowiedziało tego leczenia, więc gra nie mówi, co je dało.",
};

/**
 * What this combatant did it with, or what was done to them.
 *
 * Under `Leczenie` the section counts what the row counts — healing **received**,
 * so it is built from everybody else's skills aimed here, not from this
 * combatant's own. Their own skills answer how much they *gave*, which is a
 * different quantity and does not add up to the same total (`SkillStatistics`).
 */
function composeSkillEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
): BreakdownEntry[] {
  // Nothing announces a blow you take: the protocol names what hit you, never
  // what the other side chose. So `Otrzymane` has no skills section at all, and
  // the three metrics below are the only ones the labels have to answer for.
  if (state.metric === "taken") return [];

  const entries: BreakdownEntry[] = [];
  /**
   * The owner rides in the key, in every metric that reaches here.
   *
   * Under `Zadane` it is always the combatant in focus and looks redundant; one
   * shape of key is still worth more than two, because the entry point parses it
   * and a second shape is a second parser to keep honest.
   */
  const setEntry = (
    ownerId: number,
    key: string,
    skill: SkillStatistics,
    amount: number,
  ): void => {
    if (amount <= 0) return;
    entries.push({
      key: `skill:${composeIntegerText(ownerId)}:${key}`,
      label: skill.skillName,
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount,
      canDrill: true,
      uses: skill.uses,
      detail: [],
    });
  };

  if (state.metric === "dealt") {
    for (const [key, skill] of getRow(reading, combatantId).skills) {
      setEntry(combatantId, key, skill, skill.dealtApplied);
    }
  } else if (state.metric === "healingGiven") {
    // Their own skills, and the figure a skill restored to somebody else — the
    // one `SkillStatistics` warns must not be read as the row's own healing.
    for (const [key, skill] of getRow(reading, combatantId).skills) {
      setEntry(combatantId, key, skill, skill.healed);
    }
  } else {
    for (const [ownerId, row] of reading.statistics.byCombatantId) {
      for (const [key, skill] of row.skills) {
        setEntry(ownerId, key, skill, skill.healedByCombatantId.get(combatantId) ?? 0);
      }
    }
  }

  entries.sort((one, other) => other.amount - one.amount);

  /**
   * What no announcement covered closes the section against the row above it —
   * and under `Zadane` it says **how many times**, because that is the question
   * a plain attack raises: a combatant who never announces anything otherwise
   * appears only as a figure with no shape.
   *
   * It is drawn even when it landed nothing, and that is the point: three blows
   * that were all blocked are three blows, and a section that skipped them would
   * say the combatant did not swing.
   */
  const row = getRow(reading, combatantId);
  const total = getMetricValue(row, state.metric);
  const named = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const rest = total - named;
  const plainBlows = state.metric === "dealt" ? row.blowsWithoutSkill : 0;
  if (rest > 0 || plainBlows > 0) {
    entries.push({
      key: "unannounced",
      label: CLOSING_LABELS[state.metric],
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount: Math.max(rest, 0),
      canDrill: false,
      uses: plainBlows > 0 ? plainBlows : null,
      detail: [{ kind: "note", text: CLOSING_NOTES[state.metric] }],
    });
  }

  return entries;
}

/** What the figures were made of, by the name the game gave each. */
function composeSourceEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  translate: TranslateLabel | null,
): BreakdownEntry[] {
  const row = getRow(reading, combatantId);
  const compose = (
    names: Record<string, TokenName>,
    tokens: ReadonlyMap<string, number>,
    colour: string,
  ): BreakdownEntry[] =>
    [...tokens].map(([token, amount]) => ({
      key: `source:${token}`,
      label: getPhrase(names, token, translate),
      profession: null,
      colour,
      amount,
      canDrill: false,
      uses: null,
      detail: [],
    }));

  // The source keys the game states belong to whoever received the health, so a
  // giver has none. An empty list here is a section that is not drawn, which is
  // the honest answer rather than repeating the recipients under a second name.
  if (state.metric === "healingGiven") return [];
  if (state.metric === "healed") return compose(HEALTH_SOURCE_NAMES, row.healedBySource, UNKNOWN_COLOUR);

  const entries = compose(
    ELEMENT_NAMES,
    state.metric === "dealt" ? row.dealtAppliedByElement : row.takenByElement,
    UNKNOWN_COLOUR,
  );
  if (state.metric === "taken") {
    entries.push(...compose(HEALTH_SOURCE_NAMES, row.healthLostBySource, UNKNOWN_COLOUR));
  }
  return entries.sort((one, other) => other.amount - one.amount);
}

const OPPONENT_HEADINGS: Record<PanelMetric, string> = {
  dealt: "KOMU",
  taken: "OD KOGO",
  healingGiven: "KOMU",
  healed: "OD KOGO",
};

const SOURCE_HEADINGS: Record<PanelMetric, string> = {
  dealt: "TYP OBRAŻEŃ",
  taken: "TYP OBRAŻEŃ",
  // Healing given has no source cut: the keys the game names belong to whoever
  // received the health, and there is no second map stating them for the giver.
  healingGiven: "OD CZEGO",
  healed: "OD CZEGO",
};

/**
 * The deepest level: one opponent, or one skill, of the combatant in focus.
 *
 * A cross-section of a single row repeats the total standing over it, so it is
 * not drawn at all.
 *
 * "bez żywiołu 100%" under a figure that already says the same number is not a
 * second reading of anything — and three such sections in a row, which is what
 * `Leczenie` produced, read as a panel that has run out of things to say. The
 * list a level is *about* is always drawn; only the cross-sections beside it
 * answer to this.
 */
function composeCrossSection(
  heading: string,
  entries: readonly BreakdownEntry[],
): PanelList | null {
  return entries.length > 1 ? composeBreakdownList(heading, entries) : null;
}

/**
 * The skills behind one pair's figure — what this combatant used *on that one
 * opponent*, rather than across the fight.
 *
 * The section closes against the pair's own total the way the fight-wide one
 * closes against the combatant's: what no announcement covered is a row, not a
 * silence, or the parts would sum to less than the figure they were entered from
 * and nothing would say why.
 */
function composePairSkillEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  otherId: number,
  pairTotal: number,
): BreakdownEntry[] {
  const entries: BreakdownEntry[] = [];
  // Whose skills answer for this pair, and it turns on the **direction** rather
  // than on the figure: mine when I gave it, theirs when I received it. Written
  // as `=== "dealt"` it read as a fact about damage and was a fact about giving,
  // which is why healing given could not be added without rewriting the line.
  const ownerId = isGivenMetric(state.metric) ? combatantId : otherId;
  const subjectId = isGivenMetric(state.metric) ? otherId : combatantId;

  for (const [, skill] of getRow(reading, ownerId).skills) {
    const amount = isHealingMetric(state.metric)
      ? (skill.healedByCombatantId.get(subjectId) ?? 0)
      : (skill.dealtByTargetId.get(subjectId) ?? 0);
    if (amount <= 0) continue;
    entries.push({
      key: `leaf:skill:${skill.skillName}`,
      label: skill.skillName,
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount,
      canDrill: false,
      uses: skill.uses,
      detail: [],
    });
  }

  entries.sort((one, other) => other.amount - one.amount);

  const named = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const rest = pairTotal - named;
  if (rest > 0) {
    entries.push({
      key: "leaf:unannounced",
      label: CLOSING_LABELS[state.metric],
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount: rest,
      canDrill: false,
      uses: null,
      detail: [{ kind: "note", text: CLOSING_NOTES[state.metric] }],
    });
  }
  return entries;
}

/**
 * The deepest level: one opponent, or one skill, of the combatant in focus.
 *
 * Entering through an opponent asks *with what* — so the level lists skills, and
 * the elements stand beside them as a second cut of the same figure. Entering
 * through a skill asks the mirror question, *on whom*.
 */
function composeDeepLists(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
  translate: TranslateLabel | null,
): PanelList[] {
  if (state.focusSkill !== null) {
    // The owner is stated rather than searched for. Looking the key up across
    // every row and taking the first match was a coin toss whenever two
    // combatants announce the same skill, which every group capture does.
    const skill = getRow(reading, state.focusSkill.ownerId).skills.get(state.focusSkill.key);
    if (skill === undefined) return [];

    // Under `otrzymane` the skill belongs to somebody else and the row was
    // entered from what it gave *this* combatant, so the level narrows to that
    // one pair. Under `dane` the skill is their own and the question is who all
    // of it reached, so nothing is filtered away.
    const pairs = !isHealingMetric(state.metric)
      ? [...skill.dealtByTargetId]
      : isGivenMetric(state.metric)
        ? [...skill.healedByCombatantId]
        : [...skill.healedByCombatantId].filter(([id]) => id === combatantId);

    const entries: BreakdownEntry[] = pairs
      .sort(([, one], [, other]) => other - one)
      .map(([id, amount]) => ({
        key: `leaf:${composeIntegerText(id)}`,
        label: getName(reading, id),
        profession: reading.roster.byId.get(id)?.profession ?? null,
        colour: getProfessionColour(reading.roster.byId.get(id)?.profession ?? null),
        amount,
        canDrill: false,
        uses: null,
        detail: [],
      }));

    // ⚠️ **The one level in the panel that closed against nothing.** A skill's
    // figure is added whatever the other end did, its pairs only where that end
    // resolved, so this list could total less than the entry it was opened from
    // and say nothing about the difference. Not under `Leczenie`: there the pairs
    // are narrowed to the one the level was entered through, so the rest of the
    // skill is deliberately absent and there is nothing to be short of.
    const closeAgainst = state.metric === "healed" ? null : isHealingMetric(state.metric) ? skill.healed : skill.dealtApplied;
    const orphan =
      closeAgainst === null ? 0 : closeAgainst - entries.reduce((sum, entry) => sum + entry.amount, 0);
    if (orphan > 0) {
      const missing = MISSING_COUNTERPARTS[state.metric];
      entries.push({
        key: "nobody",
        label: missing.label,
        profession: null,
        colour: UNKNOWN_COLOUR,
        amount: orphan,
        canDrill: false,
        uses: null,
        detail: [{ kind: "note", text: missing.note }],
      });
    }

    const list = composeBreakdownList(`KOMU — ${skill.skillName}`, entries);
    return list === null ? [] : [list];
  }

  const otherId = state.focusTargetId;
  if (otherId === null) return [];

  // Which end of the pair the figures are read from turns on the direction, not
  // on the quantity — the same correction as in `composePairSkillEntries`.
  const from = isGivenMetric(state.metric) ? getRow(reading, combatantId) : getRow(reading, otherId);
  const to = isGivenMetric(state.metric) ? otherId : combatantId;
  const byElement = isHealingMetric(state.metric)
    ? new Map<string, number>()
    : (from.dealtByTargetId.get(to) ?? new Map<string, number>());
  const pairTotal = isHealingMetric(state.metric)
    ? [...from.skills.values()].reduce(
        (sum, skill) => sum + (skill.healedByCombatantId.get(to) ?? 0),
        0,
      )
    : [...byElement.values()].reduce((sum, one) => sum + one, 0);

  const heading = `CZYM — ${getName(reading, otherId)}`;
  const skills = composeBreakdownList(
    heading,
    composePairSkillEntries(reading, state, combatantId, otherId, pairTotal),
  );
  const elements = composeCrossSection(
    SOURCE_HEADINGS[state.metric],
    [...byElement]
      .sort(([, one], [, other]) => other - one)
      .map(([token, amount]): BreakdownEntry => ({
        key: `leaf:${token}`,
        label: getPhrase(ELEMENT_NAMES, token, translate),
        profession: null,
        colour: UNKNOWN_COLOUR,
        amount,
        canDrill: false,
        uses: null,
        detail: [],
      })),
  );

  return [skills, elements].filter((list): list is PanelList => list !== null);
}

/**
 * Zero is a reading and unknown is a limit, and they are two sentences.
 *
 * The first states what the game counted. The second — quieter, and only where
 * something in this fight really has no actor — states what cannot be checked.
 * Healing gets no second sentence on purpose: the game always names who was
 * healed, so nothing received is a complete answer, and what it does not name is
 * *who healed*, which is said in the breakdown rather than in place of a figure.
 */
const NOTHING_TEXTS: Record<PanelMetric, string> = {
  dealt: "Nie zadała nikomu obrażeń.",
  taken: "Nic jej nie ubyło.",
  healingGiven: "Nikogo nie leczyła.",
  healed: "Nikt jej nie leczył.",
};

const NOTHING_LIMIT_TEXTS: Partial<Record<PanelMetric, string>> = {
  dealt:
    "Część obrażeń w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z nich są jej.",
  // A healer on zero is the reading most likely to be short: on this material most
  // healing carries no announcement, so nothing ties it to whoever cast it.
  healingGiven:
    "Część leczenia w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z niego jest jej.",
};

/** Every warning the reading carries, each as one sentence a player can act on. */
function composeWarnings(reading: PanelReading): string[] {
  const warnings: string[] = [];
  const { unreadableMessages, unaccountedHealthBySource } = reading.statistics.reading;

  if (!reading.isFromFightStart) {
    warnings.push("Panel wpiął się w trakcie tej walki — to nie są jej pełne liczby.");
  }

  /**
   * Ahead of everything below, because these two say the material never arrived.
   *
   * The lines further down qualify a fight that *was* read: a heal without a
   * figure, a message carrying a key we have no meaning for. These say that part
   * of the fight never reached the reader at all, which is a larger claim and a
   * different repair. Neither carries a key of the game's or a word of ours — a
   * player is told what cannot be known, not why our reader cannot know it (§3).
   */
  const engine = reading.engineReading;
  if (engine !== undefined) {
    const unreadablePayloads = [...engine.unreadablePayloadsByFault.values()].reduce(
      (sum, count) => sum + count,
      0,
    );
    if (engine.lostMessages > 0) {
      warnings.push(
        `Nie dotarło ${composeFigureText(engine.lostMessages)} ${engine.lostMessages === 1 ? "zdarzenie" : "zdarzeń"} z tej walki — liczby są zaniżone.`,
      );
    } else if (unreadablePayloads > 0) {
      // Something was lost and nothing said how much, so the sentence carries no
      // figure rather than carrying a zero (§9.6: unknown and zero stay apart).
      warnings.push("Część tej walki nie dotarła do panelu — liczby są zaniżone.");
    }
    if (engine.unreadableCombatants > 0) {
      warnings.push(
        `Nie dało się odczytać ${composeFigureText(engine.unreadableCombatants)} ${engine.unreadableCombatants === 1 ? "postaci" : "postaci"} ze składu — część liczb może trafić nie do tej osoby.`,
      );
    }
  }

  // The certain one before the maybe: this says healing *is* short, by an amount
  // the game never states. Ranking it under "something was unreadable" would bury
  // the only line here that is not a suspicion.
  const unaccounted = [...unaccountedHealthBySource.values()].reduce((sum, count) => sum + count, 0);
  if (unaccounted > 0) {
    warnings.push(
      `Leczenie całej drużyny ${composeFigureText(unaccounted)} ${unaccounted === 1 ? "raz" : "razy"} bez podanej liczby — leczenie jest zaniżone.`,
    );
  }

  if (unreadableMessages > 0) {
    warnings.push(
      `Nie dało się odczytać ${composeFigureText(unreadableMessages)} ${unreadableMessages === 1 ? "zdarzenia" : "zdarzeń"} walki — liczby mogą być zaniżone.`,
    );
  }

  return warnings;
}

/** Whether any of those names belongs to somebody on the watcher's own side. */
function hasOurSide(reading: PanelReading, names: readonly string[]): boolean {
  return names.some((name) => {
    const id = getCombatantIdByName(reading.roster, name);
    return id !== null && reading.roster.byId.get(id)?.side === reading.ourSide;
  });
}

/**
 * "wygrana" or "przegrana" **from the watcher's seat**, or nothing at all.
 *
 * The protocol names both sides and says nothing about which is the reader's, so
 * the answer is composed here, where `ourSide` is. Where the game never said
 * `myteam`, or where no name resolves, the header says nothing — a fight the
 * panel cannot place is not a fight it may call a loss.
 */
function getOutcomeText(reading: PanelReading): string | null {
  const outcome = reading.statistics.outcome;
  if (outcome === null || reading.ourSide === null) return null;
  if (hasOurSide(reading, outcome.wonNames)) return "wygrana";
  if (hasOurSide(reading, outcome.lostNames)) return "przegrana";
  return null;
}

function composeTitle(reading: PanelReading): string {
  const sizes = [...reading.statistics.bySide]
    .sort(([one], [other]) => {
      if (reading.ourSide === one) return -1;
      if (reading.ourSide === other) return 1;
      return one - other;
    })
    .map(([, group]) => composeIntegerText(group.combatantIds.length));

  const unplaced = reading.statistics.combatantIdsWithoutSide.length;
  if (sizes.length === 0) return "brak składu";
  return `${sizes.join(" vs ")}${unplaced > 0 ? ` +${composeIntegerText(unplaced)}` : ""}`;
}

/**
 * The fight in two figures, and what belongs to neither.
 *
 * ⚠️ **It used to draw a part of the fight as the whole of it.** The two sides
 * were summed off the rows and nothing else, so under `Zadane` the bar was short
 * by everything with no actor — by a few per cent to a fifth, across the
 * captures as they stood — and under `Leczenie dane` by well over half, while
 * the pinned row **directly above it**
 * stated that very figure. Two regions of one screen answering with two different
 * wholes, which is the defect the brackets were fixed for one region up. The third
 * part closes it: mine plus enemy plus nobody is the figure every bracket on the
 * screen divides by.
 *
 * **Fight-scope even under a side filter, and even inside a breakdown.** What it
 * answers is how the fight is going, and that question does not change when the
 * list narrows — only the label does, because two figures of a different scale
 * standing under one combatant's breakdown would be read as that combatant's.
 */
function composeSides(reading: PanelReading, state: PanelState): PanelSides | null {
  if (reading.ourSide === null) return null;

  let mine = 0;
  let enemy = 0;
  let nobody = getFigureOutsideRows(reading, state);
  for (const [id, row] of reading.statistics.byCombatantId) {
    const side = reading.roster.byId.get(id)?.side ?? null;
    const value = getMetricValue(row, state.metric);
    // A combatant the roster cannot place was dropped here silently, while
    // `composeTitle` was counting them in its `+N`. They have no side, and no
    // side is what the third part is for.
    if (side === null) nobody += value;
    else if (side === reading.ourSide) mine += value;
    else enemy += value;
  }

  const whole = mine + enemy + nobody;
  const sides = `${TEAM_LABELS.mine} / ${TEAM_LABELS.enemy}`;
  return {
    mineText: composeFigureText(mine),
    enemyText: composeFigureText(enemy),
    label: state.focusCombatantId === null ? sides : `Cała walka · ${sides}`,
    // Not `Bez sprawcy`, though on the screens where it is large it is the same
    // points: a combatant with no side lands here too, and they have an actor.
    // The chain is the pinned row's own — no actor, so nothing to put on a side.
    nobody: nobody > 0 ? { label: "Bez strony", text: composeFigureText(nobody) } : null,
    // From raw sums: the bar shows the share of the fight, and a share of two
    // rates with different divisors is not a share of anything.
    shares: whole > 0 ? { mine: mine / whole, enemy: enemy / whole, nobody: nobody / whole } : null,
  };
}

/**
 * The ranking's height, in bars, and the least any screen may be.
 *
 * Ten is the most one side fields, eleven the most a whole fight does — measured
 * on the captures, where a group fight is ten of ours against one. A bigger fight
 * scrolls rather than growing the window: a ranking is watched during a fight, and
 * a height that changed as combatants joined would move it under the hand.
 */
const RANKING_ROWS = 11;
const SIDE_ROWS = 10;

/** A section costs its rows plus the heading standing over them. */
function getRowsNeeded(lists: readonly PanelList[]): number {
  return lists.reduce((rows, list) => rows + list.rows.length + 1, 0);
}

/**
 * What the ranking shows, and the floor for everything opened from it.
 *
 * A breakdown reached from this list is never shorter than it — clicking a row
 * must not shorten the window under the hand, which is what the shipped panel did
 * until now: a breakdown of one section drew a window a fifth the height.
 */
function getFloorRows(team: PanelTeam): number {
  return team === "all" ? RANKING_ROWS : SIDE_ROWS;
}

/**
 * What a screen is, so a redraw of it can be told from a move to another one.
 *
 * Nothing draws this. It is here rather than in the file that draws because it is
 * a fact about the state, checkable without a document — and the drawing half has
 * no other way to know: every node is built again on every payload, so the
 * reader's own scroll position is kept across the first and dropped on the second.
 */
function composeLevelKey(state: PanelState): string {
  const composeIdText = (value: number | null): string =>
    value === null ? "" : composeIntegerText(value);
  return [
    state.metric,
    state.team,
    composeIdText(state.focusCombatantId),
    composeIdText(state.focusTargetId),
    state.focusSkill === null
      ? ""
      : `${composeIdText(state.focusSkill.ownerId)}/${state.focusSkill.key}`,
  ].join("|");
}

/**
 * `translate` is how the panel asks the running client what it calls something
 * (`src/ui/panel-names.ts`). It defaults to nobody having asked, which is a real
 * state and not a convenience: the fallbacks are what a player sees wherever the
 * game is not on the page — and every test in this repository runs there.
 */
export function composePanelView(
  reading: PanelReading,
  state: PanelState,
  translate: TranslateLabel | null = null,
): PanelView {
  const ranked = getRankedIds(reading, state);
  const total = ranked.reduce((sum, id) => sum + getMetricValue(getRow(reading, id), state.metric), 0);
  // Computed once, here, and handed to both kinds of row — a second call site
  // deciding its own denominator is how the two came to disagree.
  const whole = getWholeOnScreen(reading, state, total);

  const shell = {
    title: composeTitle(reading),
    outcomeText: getOutcomeText(reading),
    nounTabs: PANEL_NOUNS.map((noun) => ({
      metric: composeMetricAfterNoun(noun, state.metric),
      label: NOUN_LABELS[noun],
      isSelected: noun === METRIC_AXES[state.metric].noun,
    })),
    directionTabs: composeDirectionTabs(state.metric),
    teamTabs: PANEL_TEAMS.map((team) => ({
      team,
      label: TEAM_LABELS[team],
      isSelected: team === state.team,
    })),
    // Ten under a filter because that is the most a side fields; eleven when the
    // list can hold both. A breakdown raises this below, and never lowers it.
    visibleRows: getFloorRows(state.team),
    levelKey: composeLevelKey(state),
    warnings: composeWarnings(reading),
  };

  const focusId = state.focusCombatantId;
  if (focusId === null) {
    // The bar is measured against the biggest figure on screen, not against the
    // first row: a pinned row below can exceed it.
    const largestShown = ranked.reduce(
      (most, id) => Math.max(most, getMetricValue(getRow(reading, id), state.metric)),
      getPinnedValue(reading, state),
    );

    return {
      ...shell,
      crumb: null,
      lists: [
        {
          heading: null,
          totalText: null,
          rows: ranked.map((id, index) =>
            composeRankedRow(reading, state, id, index + 1, whole, largestShown, translate),
          ),
        },
      ],
      emptyText: ranked.length === 0 ? "Nikogo tu jeszcze nie ma." : null,
      emptyLimitText: null,
      pinnedRow: composePinnedRow(reading, state, whole, largestShown, translate),
      sides: composeSides(reading, state),
    };
  }

  const deep = state.focusTargetId !== null || state.focusSkill !== null;
  const crumb: PanelCrumb = deep
    ? {
        backLabel: `‹ ${getName(reading, focusId)}`,
        hereLabel:
          state.focusSkill !== null
            ? // Off the owner's row, not the focused one: under `Leczenie` the
              // skill belongs to whoever healed, and reading it off the combatant
              // being healed found nothing and said `umiejętność` instead.
              (getRow(reading, state.focusSkill.ownerId).skills.get(state.focusSkill.key)
                ?.skillName ?? "umiejętność")
            : getName(reading, state.focusTargetId ?? focusId),
        profession: null,
      }
    : {
        backLabel: "‹ skład",
        hereLabel: getName(reading, focusId),
        profession: reading.roster.byId.get(focusId)?.profession ?? null,
      };

  if (deep) {
    const lists = composeDeepLists(reading, state, focusId, translate);
    return {
      ...shell,
      visibleRows: Math.max(getRowsNeeded(lists), getFloorRows(state.team)),
      crumb,
      lists,
      emptyText: lists.length === 0 ? "Nie ma czego pokazać." : null,
      emptyLimitText: null,
      pinnedRow: null,
      sides: composeSides(reading, state),
    };
  }

  if (getMetricValue(getRow(reading, focusId), state.metric) === 0) {
    /**
     * Zero landed is not zero done, and the difference is the whole complaint
     * this answers: a combatant who swung and was blocked every time read as one
     * who did nothing. The count comes from the same place the panel's own
     * counters do, so the two cannot disagree.
     *
     * Two forms and not three: `raz` spells the paucal and the genitive plural
     * the same way — 2 razy, 5 razy — so the rule most Polish nouns need does
     * not apply to the only word this says.
     */
    const blows = getRow(reading, focusId).blowsStruck;
    const swung =
      state.metric === "dealt" && blows > 0
        ? ` Uderzyła ${composeFigureText(blows)} ${blows === 1 ? "raz" : "razy"} — nic nie weszło.`
        : "";

    return {
      ...shell,
      crumb,
      lists: [],
      emptyText: `${NOTHING_TEXTS[state.metric]}${swung}`,
      // Against the figure this metric actually pins, not against damage: under
      // `Leczenie dane` the thing that cannot be checked is unannounced healing.
      emptyLimitText:
        getPinnedValue(reading, state) > 0 ? (NOTHING_LIMIT_TEXTS[state.metric] ?? null) : null,
      pinnedRow: null,
      sides: composeSides(reading, state),
    };
  }

  const lists = [
    composeBreakdownList(OPPONENT_HEADINGS[state.metric], composeOpponentEntries(reading, state, focusId)),
    composeCrossSection("CZYM (UMIEJĘTNOŚCI)", composeSkillEntries(reading, state, focusId)),
    composeCrossSection(SOURCE_HEADINGS[state.metric], composeSourceEntries(reading, state, focusId, translate)),
  ].filter((list): list is PanelList => list !== null);

  return {
    ...shell,
    visibleRows: Math.max(getRowsNeeded(lists), getFloorRows(state.team)),
    crumb,
    lists,
    emptyText: lists.length === 0 ? NOTHING_TEXTS[state.metric] : null,
    emptyLimitText: null,
    pinnedRow: null,
    sides: composeSides(reading, state),
  };
}
