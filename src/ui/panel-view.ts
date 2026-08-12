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
 * is turned into a Polish phrase before it reaches a label, and where we have no
 * phrase for one it travels as the game wrote it rather than as a guess.
 */

import { composeDecimalText, composeIntegerText } from "@/libs/number.ts";
import { getCombatantIdByName, type CombatantRoster } from "@/src/core/combatant-roster.ts";
import type {
  CombatantStatistics,
  FightStatistics,
  SkillStatistics,
} from "@/src/core/fight-statistics.ts";
import { getProfessionColour, UNKNOWN_COLOUR } from "@/src/ui/panel-tokens.ts";

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
  /** Turns each combatant took. The divisor for what they dealt. */
  turnsByCombatantId: ReadonlyMap<number, number>;
  /** Turns the fight took. The divisor for what was done *to* somebody. */
  fightTurns: number;
};

export const PANEL_METRICS = ["dealt", "taken", "healed"] as const;
export type PanelMetric = (typeof PANEL_METRICS)[number];

export const PANEL_TEAMS = ["all", "mine", "enemy"] as const;
export type PanelTeam = (typeof PANEL_TEAMS)[number];

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
  /** Rate rather than total, everywhere at once — see `getDivisor`. */
  perTurn: boolean;
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
   * capture — two combatants both announce `Leczenie ran` and both heal the same
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
    perTurn: false,
    focusCombatantId: null,
    focusTargetId: null,
    focusSkill: null,
    isCollapsed: false,
  };
}

const METRIC_LABELS: Record<PanelMetric, string> = {
  dealt: "Zadane",
  taken: "Otrzymane",
  healed: "Leczenie",
};

const TEAM_LABELS: Record<PanelTeam, string> = {
  all: "Wszyscy",
  mine: "My",
  enemy: "Oni",
};

const PROFESSION_NAMES: Record<string, string> = {
  w: "wojownik",
  p: "paladyn",
  t: "tropiciel",
  h: "łowca",
  m: "mag",
  b: "tancerz ostrzy",
};

/**
 * The letter in a damage key, in the player's words.
 *
 * ⚠️ **Not a taxonomy of elements, though it reads like one.** The game answers
 * three different questions with this one letter and picks whichever it has:
 * element (`f`, `l`, `c`), weapon or slot (none, `d`, `o`), reach (`g`), and
 * `a` for damage nothing reduces. So a figure keyed `dmgg` has no element we
 * know — the label says what the game said, not what we wish it had.
 */
const ELEMENT_NAMES: Record<string, string> = {
  dmg: "fizyczne",
  dmgd: "dystansowe",
  dmgo: "broń pomocnicza",
  dmgf: "ogień",
  dmgc: "zimno",
  dmgl: "błyskawica",
  dmga: "nieuchronne",
  dmgg: "globalne",
};

/** Effects that fire with a blow. Ours to phrase; the game only sends the token. */
const EFFECT_NAMES: Record<string, string> = {
  crit: "trafienie krytyczne",
  legbon_verycrit: "bardzo silne trafienie krytyczne",
  pierce: "przebicie",
  stun: "ogłuszenie",
  freeze: "zamrożenie",
  legbon_curse: "klątwa",
  legbon_cleanse: "oczyszczenie",
  "superspell-dispel": "rozproszenie zaklęcia",
  acdmg_destroyed: "zniszczony pancerz",
  tenacity: "wytrwałość",
};

const DEFENCE_NAMES: Record<string, string> = {
  absorb: "pochłonięte",
  absorbm: "pochłonięte magicznie",
  blok: "zablokowane",
};

const DESTRUCTION_NAMES: Record<string, string> = {
  acdmg: "zniszczony pancerz",
  resdmg: "zniszczona odporność",
  abdest_per: "zniszczona osłona",
  abmdest_per: "zniszczona osłona magiczna",
};

/** Where health went when no blow moved it. */
const HEALTH_SOURCE_NAMES: Record<string, string> = {
  poison: "trucizna",
  injure: "rana",
  heal: "leczenie",
  heal_target: "leczenie na wskazanego",
  legbon_holytouch_heal: "leczenie z efektu",
};

/**
 * A phrase for a token, or the token itself.
 *
 * The fallback is deliberate and is the whole reason this is one function: the
 * game can send something we have never named, and a row that vanished or read
 * "nieznane" would hide a real figure behind our own ignorance. What the player
 * sees then is ugly and true.
 */
function getPhrase(names: Record<string, string>, token: string): string {
  return names[token] ?? token;
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

/**
 * A rate keeps one decimal: at this scale the whole part alone loses the
 * difference between two combatants.
 *
 * The comma is the separator, because the reader is Polish and so is the game
 * they are reading it over. It is swapped here rather than in `libs/number.ts`:
 * that file writes a number for a machine to read back, and this one writes it
 * for a person — the same figure, two audiences, and only one of them wants a
 * decimal point.
 */
function composeRateText(value: number): string {
  const [whole = "", fraction = ""] = composeDecimalText(value, 1).split(".");
  return `${composeSpacedThousands(whole)},${fraction}/t`;
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
  /** The share, and the other measure, in one bracket beside the figure. */
  bracketText: string;
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
  /** 0–1 of the bar that belongs to our side. From raw sums, never from a rate. */
  mineShare: number;
};

export type PanelView = {
  title: string;
  outcomeText: string | null;
  metricTabs: Array<{ metric: PanelMetric; label: string; isSelected: boolean }>;
  teamTabs: Array<{ team: PanelTeam; label: string; isSelected: boolean }>;
  perTurn: { label: string; isSelected: boolean };
  crumb: PanelCrumb | null;
  /**
   * How many bars fit before the list scrolls.
   *
   * Eleven under `Wszyscy`, ten under a side filter — ten is the most a side
   * fields. A number rather than a stylesheet rule so the height is computed from
   * the row token and cannot drift when the type size changes.
   *
   * ⚠️ **A breakdown gets as many as it needs, up to a ceiling**, and that is not
   * an inconsistency. The ranking is a list somebody watches during a fight, so a
   * height that changes as combatants join would move the window under their
   * hand; a breakdown is opened deliberately, and it has three sections whose
   * whole point is to be compared with each other. At eleven the last two sat
   * under the fold and the panel looked like it had lost them.
   */
  visibleRows: number;
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
   */
  pinnedRow: PanelRow | null;
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
 * no difference at all. Measured on the group capture: leaving the second out
 * would show the boss 49 318 short, 13% of everything that hit it.
 */
function getMetricValue(row: CombatantStatistics, metric: PanelMetric): number {
  if (metric === "dealt") return row.dealtApplied;
  if (metric === "taken") return row.taken + row.healthLost;
  return row.healed;
}

/**
 * What a figure is divided by under `na turę`.
 *
 * Dealt divides by the combatant's own turns — the question is how much they get
 * out of one action. Taken and healed divide by the fight's, because both happen
 * on everyone else's turns too. One divisor for both would make one of them
 * answer a question nobody asked.
 *
 * Never zero: a fight whose turns were never stated would otherwise turn every
 * rate into a division by zero, which is a number nobody wrote (§9.5).
 */
function getDivisor(reading: PanelReading, combatantId: number | null, metric: PanelMetric): number {
  if (metric !== "dealt") return Math.max(reading.fightTurns, 1);
  if (combatantId === null) return Math.max(reading.fightTurns, 1);
  return Math.max(reading.turnsByCombatantId.get(combatantId) ?? 0, 1);
}

function composeValueText(value: number, perTurn: boolean): string {
  return perTurn ? composeRateText(value) : composeFigureText(value);
}

/**
 * The bracket beside the leading figure: the share, and then the *other* measure.
 *
 * Both are true and they say different things — somebody who lost turns has a low
 * total and mighty blows — so the switch decides which one leads rather than
 * which one is visible.
 */
function composeBracket(share: number, other: string): string {
  return `(${composeShareText(share)} · ${other})`;
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
    return byValue !== 0 ? byValue : getName(reading, one).localeCompare(getName(reading, other), "pl");
  });
}

/**
 * The counters line: how somebody fought, in one sentence.
 *
 * ⚠️ **No dodges.** The client knows `-evade`, neither capture carries one and the
 * decoder has no entry for it — so `uniki 0` would be an unknown wearing the
 * costume of a measurement (§9.6). It joins when the key is read.
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
): PanelDetailLine[] {
  const row = getRow(reading, combatantId);
  const combatant = reading.roster.byId.get(combatantId);
  const lines: PanelDetailLine[] = [{ kind: "title", text: getName(reading, combatantId) }];

  const profession = combatant?.profession ?? null;
  const level = combatant?.level ?? null;
  if (profession !== null || level !== null) {
    const named = profession === null ? "nieznana profesja" : getPhrase(PROFESSION_NAMES, profession);
    lines.push({
      kind: "heading",
      text: level === null ? named : `${named} (${composeIntegerText(level)})`,
    });
  }

  for (const metric of PANEL_METRICS) {
    const value = getMetricValue(row, metric);
    const shown = state.perTurn ? value / getDivisor(reading, combatantId, metric) : value;
    lines.push(
      composeStat(METRIC_LABELS[metric], composeValueText(shown, state.perTurn), metric === state.metric),
    );
    // Taken is the one figure made of two readings, so it says so where it
    // stands rather than leaving the difference to be discovered.
    if (metric === "taken" && row.healthLost > 0) {
      lines.push(composeStat("  z ciosów", composeFigureText(row.taken)));
      lines.push(composeStat("  bez sprawcy", composeFigureText(row.healthLost)));
    }
  }

  lines.push(composeStat("Tury", composeFigureText(reading.turnsByCombatantId.get(combatantId) ?? 0)));
  if (row.skillsUsed > 0) {
    lines.push(composeStat("Użycia umiejętności", composeFigureText(row.skillsUsed)));
  }
  lines.push({ kind: "note", text: composeCounters(row).join(" · ") });

  const effects = [...row.procsOnBlowsStruck]
    .filter(([token]) => token !== "crit" && token !== "legbon_verycrit")
    .map(([token, count]) => `${getPhrase(EFFECT_NAMES, token)} ×${composeFigureText(count)}`);
  if (effects.length > 0) {
    lines.push({ kind: "heading", text: "Efekty w ciosach" });
    lines.push({ kind: "note", text: effects.join(" · ") });
  }

  const stopped = [
    ...[...row.prevented].map(([token, amount]) => `${getPhrase(DEFENCE_NAMES, token)} ${composeFigureText(amount)}`),
    ...[...row.destroyed].map(([token, amount]) => `${getPhrase(DESTRUCTION_NAMES, token)} ${composeFigureText(amount)}`),
  ];
  if (stopped.length > 0) lines.push({ kind: "note", text: stopped.join(" · ") });

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
  total: number,
  largest: number,
): PanelRow {
  const raw = getMetricValue(getRow(reading, combatantId), state.metric);
  const divisor = getDivisor(reading, combatantId, state.metric);
  const shown = state.perTurn ? raw / divisor : raw;
  const largestShown = state.perTurn ? largest : largest;

  return {
    key: `combatant:${composeIntegerText(combatantId)}`,
    rank,
    label: getName(reading, combatantId),
    profession: reading.roster.byId.get(combatantId)?.profession ?? null,
    colour: getProfessionColour(reading.roster.byId.get(combatantId)?.profession ?? null),
    fill: largestShown > 0 ? shown / largestShown : 0,
    valueText: composeValueText(shown, state.perTurn),
    // The share is always of the raw sums: it describes the shape of the fight,
    // not its pace, and a share of rates has no meaning to read off.
    bracketText: composeBracket(
      total > 0 ? raw / total : 0,
      state.perTurn ? composeFigureText(raw) : composeRateText(raw / divisor),
    ),
    canDrill: true,
    detail: composeCombatantDetail(reading, combatantId, state),
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
      sources.set(token, (sources.get(token) ?? 0) + amount);
    }
  }
  return sources;
}

/** Healing that arrived with no announcement over it, and so with no healer. */
function getHealingWithoutHealer(row: CombatantStatistics): number {
  const named = [...row.healedByHealerId.values()].reduce((sum, one) => sum + one, 0);
  return Math.max(0, row.healed - named);
}

function composePinnedRow(
  reading: PanelReading,
  state: PanelState,
  total: number,
  largest: number,
): PanelRow | null {
  const isHealing = state.metric === "healed";
  if (state.metric === "taken") return null;

  const value = isHealing
    ? [...reading.statistics.byCombatantId.values()].reduce(
        (sum, row) => sum + getHealingWithoutHealer(row),
        0,
      ) + reading.statistics.unattributed.healed
    : getUnattributedDamage(reading);
  if (value <= 0) return null;

  const lines: PanelDetailLine[] = [{ kind: "title", text: "Bez sprawcy" }];
  if (isHealing) {
    lines.push({ kind: "note", text: "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło." });
    lines.push({ kind: "heading", text: "Komu" });
    for (const [id, row] of [...reading.statistics.byCombatantId].sort(
      ([, one], [, other]) => getHealingWithoutHealer(other) - getHealingWithoutHealer(one),
    )) {
      const amount = getHealingWithoutHealer(row);
      if (amount > 0) lines.push(composeStat(getName(reading, id), composeFigureText(amount)));
    }
  } else {
    lines.push({
      kind: "note",
      text: "Gra nie mówi, kto to zadał — dlatego stoi osobno, a nie na czyimś wierszu.",
    });
    lines.push({ kind: "heading", text: "Z czego" });
    for (const [token, amount] of [...getUnattributedDamageBySource(reading)].sort(
      ([, one], [, other]) => other - one,
    )) {
      lines.push(composeStat(getPhrase(HEALTH_SOURCE_NAMES, token), composeFigureText(amount)));
    }
  }
  if (state.team !== "all") {
    lines.push({
      kind: "note",
      text: "Z całej walki — bez sprawcy nie ma czego przypisać do strony.",
    });
  }

  const divisor = Math.max(reading.fightTurns, 1);
  const shown = state.perTurn ? value / divisor : value;

  return {
    key: "nobody",
    rank: null,
    label: "Bez sprawcy",
    profession: null,
    colour: UNKNOWN_COLOUR,
    // Measured against the same figure every other bar is, or the row that says
    // something is missing would look like the largest thing in the fight.
    fill: largest > 0 ? shown / largest : 0,
    valueText: composeValueText(shown, state.perTurn),
    bracketText: `(${composeShareText(total + value > 0 ? value / (total + value) : 0)})`,
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

/**
 * One section of a breakdown.
 *
 * `divisor` carries `na turę` inwards: the switch has to mean the same thing at
 * every level, and one divisor for the whole section keeps its total equal to the
 * figure it was entered from.
 */
function composeBreakdownList(
  heading: string,
  entries: readonly BreakdownEntry[],
  divisor: number,
  perTurn: boolean,
): PanelList | null {
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const largest = entries.reduce((most, entry) => Math.max(most, entry.amount), 0);

  return {
    heading,
    totalText: composeValueText(perTurn ? total / divisor : total, perTurn),
    rows: entries.map((entry) => ({
      key: entry.key,
      rank: null,
      label: entry.label,
      profession: entry.profession,
      colour: entry.colour,
      fill: largest > 0 ? entry.amount / largest : 0,
      valueText: composeValueText(perTurn ? entry.amount / divisor : entry.amount, perTurn),
      bracketText: `(${composeShareText(total > 0 ? entry.amount / total : 0)}${entry.uses === null ? "" : ` · ×${composeFigureText(entry.uses)}`})`,
      canDrill: entry.canDrill,
      detail: entry.detail,
    })),
  };
}

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
  const orphan =
    state.metric === "taken"
      ? row.healthLost
      : state.metric === "healed"
        ? getHealingWithoutHealer(row)
        : 0;
  if (orphan > 0) {
    entries.push({
      key: "nobody",
      label: "Bez sprawcy",
      profession: null,
      colour: UNKNOWN_COLOUR,
      amount: orphan,
      canDrill: false,
      uses: null,
      detail: [
        {
          kind: "note",
          text:
            state.metric === "taken"
              ? "Gra nie mówi, kto to zadał — wiadomo tylko, że życia ubyło."
              : "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.",
        },
      ],
    });
  }

  return entries;
}

/**
 * What this combatant did it with, or what was done to them.
 *
 * Under `Leczenie` the section counts what the row counts — healing **received**,
 * so it is built from everybody else's skills aimed here, not from this
 * combatant's own. Their own skills answer how much they *gave*, which is a
 * different quantity and does not add up to the same total (`SkillStatistics`).
 */
/**
 * The row that closes a section against the row above it.
 *
 * Keyed by the two metrics that reach it rather than by all three, so the
 * compiler refuses a metric nobody decided about — the previous spelling was a
 * ternary defaulting `taken` into the wording for `dealt`, which was only right
 * because of an early return forty lines above it.
 */
const CLOSING_LABELS: Record<"dealt" | "healed", string> = {
  dealt: "Zwykły cios",
  healed: "Nie wiadomo, czym",
};

const CLOSING_NOTES: Record<"dealt" | "healed", string> = {
  dealt:
    "Cios, przed którym nie stała żadna umiejętność. Gra nie odróżnia go od dodatkowego zamachu, który sama jej dała.",
  healed: "Nic nie zapowiedziało tego leczenia, więc gra nie mówi, co je dało.",
};

function composeSkillEntries(
  reading: PanelReading,
  state: PanelState,
  combatantId: number,
): BreakdownEntry[] {
  // Nothing announces a blow you take: the protocol names what hit you, never
  // what the other side chose. So `Otrzymane` has no skills section at all, and
  // the two metrics below are the only ones the labels have to answer for.
  if (state.metric === "taken") return [];

  const entries: BreakdownEntry[] = [];
  /**
   * The owner rides in the key, in both metrics.
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
): BreakdownEntry[] {
  const row = getRow(reading, combatantId);
  const compose = (
    names: Record<string, string>,
    tokens: ReadonlyMap<string, number>,
    colour: string,
  ): BreakdownEntry[] =>
    [...tokens].map(([token, amount]) => ({
      key: `source:${token}`,
      label: getPhrase(names, token),
      profession: null,
      colour,
      amount,
      canDrill: false,
      uses: null,
      detail: [],
    }));

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
  healed: "OD KOGO",
};

const SOURCE_HEADINGS: Record<PanelMetric, string> = {
  dealt: "TYP OBRAŻEŃ",
  taken: "TYP OBRAŻEŃ",
  healed: "OD CZEGO",
};

/** The deepest level: one opponent, or one skill, of the combatant in focus. */
function composeDeepList(reading: PanelReading, state: PanelState, combatantId: number): PanelList | null {
  const divisor = state.perTurn ? getDivisor(reading, combatantId, state.metric) : 1;

  if (state.focusSkill !== null) {
    // The owner is stated rather than searched for. Looking the key up across
    // every row and taking the first match was a coin toss whenever two
    // combatants announced the same skill, which the group capture does.
    const skill = getRow(reading, state.focusSkill.ownerId).skills.get(state.focusSkill.key);
    if (skill === undefined) return null;

    const pairs =
      state.metric === "healed"
        ? [...skill.healedByCombatantId].filter(([id]) => id === combatantId)
        : [...skill.dealtByTargetId];

    return composeBreakdownList(
      `KOMU — ${skill.skillName}`,
      pairs
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
        })),
      divisor,
      state.perTurn,
    );
  }

  const otherId = state.focusTargetId;
  if (otherId === null) return null;

  // Healing names a caster rather than a target, so the level below one is what
  // they cast — the same question, "with what", from the other side.
  if (state.metric === "healed") {
    const skills = [...getRow(reading, otherId).skills]
      .map(([key, skill]) => ({
        key: `leaf:${key}`,
        label: skill.skillName,
        profession: null,
        colour: UNKNOWN_COLOUR,
        amount: skill.healedByCombatantId.get(combatantId) ?? 0,
        canDrill: false,
        uses: skill.uses,
        detail: [],
      }))
      .filter((entry) => entry.amount > 0);
    return composeBreakdownList(`CZYM — ${getName(reading, otherId)}`, skills, divisor, state.perTurn);
  }

  const from = state.metric === "dealt" ? getRow(reading, combatantId) : getRow(reading, otherId);
  const to = state.metric === "dealt" ? otherId : combatantId;
  const byElement = from.dealtByTargetId.get(to) ?? new Map<string, number>();

  return composeBreakdownList(
    `CZYM — ${getName(reading, otherId)}`,
    [...byElement]
      .sort(([, one], [, other]) => other - one)
      .map(([token, amount]): BreakdownEntry => ({
        key: `leaf:${token}`,
        label: getPhrase(ELEMENT_NAMES, token),
        profession: null,
        colour: UNKNOWN_COLOUR,
        amount,
        canDrill: false,
        uses: null,
        detail: [],
      })),
    divisor,
    state.perTurn,
  );
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
  healed: "Nikt jej nie leczył.",
};

const NOTHING_LIMIT_TEXTS: Partial<Record<PanelMetric, string>> = {
  dealt:
    "Część obrażeń w tej walce jest bez sprawcy — nie da się sprawdzić, czy któreś z nich są jej.",
};

/** Every warning the reading carries, each as one sentence a player can act on. */
function composeWarnings(reading: PanelReading): string[] {
  const warnings: string[] = [];
  const { unreadableMessages, unaccountedHealthBySource } = reading.statistics.reading;

  if (!reading.isFromFightStart) {
    warnings.push("Panel wpiął się w trakcie tej walki — to nie są jej pełne liczby.");
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

function composeSides(reading: PanelReading, state: PanelState): PanelSides | null {
  if (reading.ourSide === null) return null;

  let mine = 0;
  let enemy = 0;
  let mineTurns = 0;
  for (const [id, row] of reading.statistics.byCombatantId) {
    const side = reading.roster.byId.get(id)?.side ?? null;
    if (side === null) continue;
    const value = getMetricValue(row, state.metric);
    if (side === reading.ourSide) {
      mine += value;
      mineTurns += reading.turnsByCombatantId.get(id) ?? 0;
    } else enemy += value;
  }

  const enemyTurns = Math.max(reading.fightTurns - mineTurns, 1);
  const mineDivisor = state.metric === "dealt" ? Math.max(mineTurns, 1) : Math.max(reading.fightTurns, 1);
  const enemyDivisor = state.metric === "dealt" ? enemyTurns : Math.max(reading.fightTurns, 1);

  return {
    mineText: composeValueText(state.perTurn ? mine / mineDivisor : mine, state.perTurn),
    enemyText: composeValueText(state.perTurn ? enemy / enemyDivisor : enemy, state.perTurn),
    label: `${TEAM_LABELS.mine} / ${TEAM_LABELS.enemy}`,
    // From raw sums: the bar shows the share of the fight, and a share of two
    // rates with different divisors is not a share of anything.
    mineShare: mine + enemy > 0 ? mine / (mine + enemy) : 0.5,
  };
}

/** The ranking's height, in bars. Ten is the most one side fields. */
const RANKING_ROWS = 11;
const SIDE_ROWS = 10;

/**
 * How tall a breakdown may grow before it scrolls.
 *
 * A ceiling rather than no limit: a fight of twenty against twenty would
 * otherwise draw a window taller than the game it sits on.
 */
const BREAKDOWN_ROWS = 24;

/** A section costs its rows plus the heading standing over them. */
function getRowsNeeded(lists: readonly PanelList[]): number {
  return lists.reduce((rows, list) => rows + list.rows.length + 1, 0);
}

export function composePanelView(reading: PanelReading, state: PanelState): PanelView {
  const ranked = getRankedIds(reading, state);
  const total = ranked.reduce((sum, id) => sum + getMetricValue(getRow(reading, id), state.metric), 0);

  const shell = {
    title: composeTitle(reading),
    outcomeText: getOutcomeText(reading),
    metricTabs: PANEL_METRICS.map((metric) => ({
      metric,
      label: METRIC_LABELS[metric],
      isSelected: metric === state.metric,
    })),
    teamTabs: PANEL_TEAMS.map((team) => ({
      team,
      label: TEAM_LABELS[team],
      isSelected: team === state.team,
    })),
    perTurn: { label: "na turę", isSelected: state.perTurn },
    // Ten under a filter because that is the most a side fields; eleven when the
    // list can hold both. A breakdown overrides this below.
    visibleRows: state.team === "all" ? RANKING_ROWS : SIDE_ROWS,
    warnings: composeWarnings(reading),
  };

  const focusId = state.focusCombatantId;
  if (focusId === null) {
    // The bar is measured against the biggest figure ON SCREEN, which under a
    // rate is not the biggest total: somebody who acted twice can out-rate the
    // combatant above them. Taking the first row's figure would draw a bar past
    // the end of its row.
    const largestShown = ranked.reduce((most, id) => {
      const value = getMetricValue(getRow(reading, id), state.metric);
      return Math.max(most, state.perTurn ? value / getDivisor(reading, id, state.metric) : value);
    }, 0);

    return {
      ...shell,
      crumb: null,
      lists: [
        {
          heading: null,
          totalText: null,
          rows: ranked.map((id, index) =>
            composeRankedRow(reading, state, id, index + 1, total, largestShown),
          ),
        },
      ],
      emptyText: ranked.length === 0 ? "Nikogo tu jeszcze nie ma." : null,
      emptyLimitText: null,
      pinnedRow: composePinnedRow(reading, state, total, largestShown),
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
    const list = composeDeepList(reading, state, focusId);
    const lists = list === null ? [] : [list];
    return {
      ...shell,
      visibleRows: Math.min(Math.max(getRowsNeeded(lists), 1), BREAKDOWN_ROWS),
      crumb,
      lists,
      emptyText: list === null ? "Nie ma czego pokazać." : null,
      emptyLimitText: null,
      pinnedRow: null,
      sides: null,
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
      emptyLimitText:
        getUnattributedDamage(reading) > 0 ? (NOTHING_LIMIT_TEXTS[state.metric] ?? null) : null,
      pinnedRow: null,
      sides: null,
    };
  }

  const divisor = state.perTurn ? getDivisor(reading, focusId, state.metric) : 1;
  const lists = [
    composeBreakdownList(
      OPPONENT_HEADINGS[state.metric],
      composeOpponentEntries(reading, state, focusId),
      divisor,
      state.perTurn,
    ),
    composeBreakdownList(
      "CZYM (UMIEJĘTNOŚCI)",
      composeSkillEntries(reading, state, focusId),
      divisor,
      state.perTurn,
    ),
    composeBreakdownList(
      SOURCE_HEADINGS[state.metric],
      composeSourceEntries(reading, state, focusId),
      divisor,
      state.perTurn,
    ),
  ].filter((list): list is PanelList => list !== null);

  return {
    ...shell,
    visibleRows: Math.min(Math.max(getRowsNeeded(lists), 1), BREAKDOWN_ROWS),
    crumb,
    lists,
    emptyText: lists.length === 0 ? NOTHING_TEXTS[state.metric] : null,
    emptyLimitText: null,
    pinnedRow: null,
    sides: null,
  };
}
