/**
 * What the panel shows, as a shape — the contract between the composing and the
 * drawing, and nothing else.
 *
 * Its own file so that `src/ui/panel-element.ts` depends on the shape rather than
 * on the module that fills it: the drawing took six names out of
 * `panel-view.ts` and so could not be read, tested or reasoned about without the
 * whole of the composing in the graph. Types only, so there is nothing here to
 * execute and nothing to disagree with — where a figure comes from is the
 * composing's business, and what it looks like is the stylesheet's.
 *
 * **The strings are Polish** wherever one of these fields is filled (§3); no
 * sentence is written down here.
 */

import type { PanelMetricTab, PanelTeamTab } from "@/src/ui/panel-metric.ts";

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
  isDrillable: boolean;
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
  /** The two control strips, and both speak in metrics (`panel-metric.ts`). */
  nounTabs: PanelMetricTab[];
  /**
   * Empty where the noun has only one direction — `Leczenie` until healing given
   * has a figure behind it. A control that is drawn and does nothing is worse
   * than one that is absent (§9.6), so it is not drawn.
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
