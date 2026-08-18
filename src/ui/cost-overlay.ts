/**
 * What the add-on cost, drawn beside the panel in a development build.
 *
 * Its own host in the game's document rather than a screen inside the panel, and
 * that is structural rather than tidy: the panel speaks Polish to a player (§3),
 * every one of its screens is swept by `tests/ui/panel-view.test.ts`, and a
 * developer's table of phase names in English would have to be excused from both.
 * Outside the panel it is excused from neither — it simply is not the panel.
 *
 * Renders what it is handed and computes nothing (§9.1). The split between a
 * whole and its parts arrives already made, because it is the same split the
 * terminal report makes and neither gets to decide it twice.
 *
 * ⚠️ **Firefox rounds the clock to whole milliseconds, so read a small figure as
 * a bound and not a measurement.** Measured on 140.13.0esr over
 * `2026-08-06-tempest-grupa-vs-hildur` replayed whole: every duration this drew
 * came back a whole number — 268.0, 200.0, 26.0, 23.0, 9.0, 7.0, 1.0 — which is
 * `privacy.reduceTimerPrecision` clamping `performance.now` at 1 ms. A phase
 * costing a tenth of that reads as 0 or as 1 depending on where it fell. Totals
 * over a hundred calls still rank the phases; a single `worst ms` of 1.0 does
 * not mean a millisecond. Chromium reports finer, and turning that preference
 * off in `about:config` does too.
 */

import { composeDecimalText, composeIntegerText } from "@/libs/number.ts";
import type { ElapsedSpan } from "@/libs/elapsed-spans.ts";
import { PANEL_TOKENS } from "@/src/ui/panel-tokens.ts";

/** §9.6, rung one: a name of ours in the game's own document carries the prefix. */
export const COST_OVERLAY_ID = "MargoMeter-Cost";

const NAME_COLUMN = 10;
const NUMBER_COLUMN = 10;

/**
 * Where it sits and what it looks like, once, when it is first put on the page.
 *
 * ⚠️ **`pointer-events: none`.** We are a guest over a game somebody is playing,
 * and a developer's table that swallowed a click on whatever is under it would
 * be changing how a fight goes — the one thing the add-on promises never to do.
 * It is read, never touched.
 */
const OVERLAY_DECLARATIONS: readonly (readonly [name: string, value: string])[] = [
  ["position", "fixed"],
  ["right", "8px"],
  ["bottom", "8px"],
  // Under the maximum a page can ask for, so anything the game deliberately puts
  // on top stays on top.
  ["z-index", "2147483646"],
  ["margin", "0"],
  ["padding", "8px"],
  ["font", "11px/1.4 ui-monospace, monospace"],
  ["white-space", "pre"],
  ["pointer-events", "none"],
  ["background", PANEL_TOKENS.surface],
  ["color", PANEL_TOKENS.text],
  ["border", `1px solid ${PANEL_TOKENS.border}`],
];

export type CostOverlayNode = {
  id: string;
  textContent: string;
  style: { setProperty(name: string, value: string): void };
  append(...nodes: CostOverlayNode[]): void;
  replaceChildren(...nodes: CostOverlayNode[]): void;
};

export type CostOverlayDocument = {
  createElement(tag: string): CostOverlayNode;
  getElementById?: ((id: string) => CostOverlayNode | null) | undefined;
  body?: { append(...nodes: CostOverlayNode[]): void } | undefined;
};

export type CostReading = {
  /** `payload`, `gesture`, `drag` — each contains the parts below it. */
  wholes: readonly ElapsedSpan[];
  /** `session`, `capture`, `reading`, `view`, `dom`. */
  parts: readonly ElapsedSpan[];
  /**
   * Heap the browser admits to, or `null` where it offers no figure.
   *
   * ⚠️ **`null` is not zero, and here the difference is a whole browser.**
   * `performance.memory` is Chrome's and not a standard; Firefox — which is what
   * the recipe in `.claude/skills/verify/SKILL.md` drives — has nothing to say.
   * A zero drawn there would read as "this add-on holds no memory", which is the
   * one thing it certainly does (§9.6).
   */
  heapBytes: number | null;
};

function composeSpanLine(span: ElapsedSpan): string {
  return (
    `  ${span.name.padEnd(NAME_COLUMN)}` +
    `${composeIntegerText(span.calls).padStart(6)}` +
    `${composeDecimalText(span.totalMs, 1).padStart(NUMBER_COLUMN)}` +
    `${composeDecimalText(span.worstMs, 1).padStart(NUMBER_COLUMN)}`
  );
}

/**
 * The overlay as lines of text, which is the whole of what it says.
 *
 * Pure and exported so the reading can be checked without a document — the
 * drawing below is then only where the lines go.
 */
export function composeCostLines(reading: CostReading): readonly string[] {
  return [
    "MargoMeter cost — since this page loaded",
    `  ${"phase".padEnd(NAME_COLUMN)}${"calls".padStart(6)}${"total ms".padStart(NUMBER_COLUMN)}${"worst ms".padStart(NUMBER_COLUMN)}`,
    "whole",
    ...reading.wholes.map(composeSpanLine),
    "parts of it",
    ...reading.parts.map(composeSpanLine),
    reading.heapBytes === null
      ? "heap  not offered by this browser"
      : `heap  ${composeIntegerText(Math.round(reading.heapBytes / 1024 / 1024))} MiB`,
  ];
}

/**
 * The overlay, drawn or redrawn in place.
 *
 * Found by its own id rather than kept in a variable, so a second call cannot
 * leave a second table on the page — the panel is mounted once and this is
 * redrawn on every payload, which is exactly the asymmetry that grows a page a
 * node at a time.
 */
export function setCostOverlayDrawn(
  document: CostOverlayDocument,
  reading: CostReading,
): void {
  const found = document.getElementById?.(COST_OVERLAY_ID) ?? null;
  const host = found ?? document.createElement("pre");
  host.id = COST_OVERLAY_ID;
  if (found === null) {
    for (const [name, value] of OVERLAY_DECLARATIONS) host.style.setProperty(name, value);
    document.body?.append(host);
  }
  host.textContent = composeCostLines(reading).join("\n");
}
