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
