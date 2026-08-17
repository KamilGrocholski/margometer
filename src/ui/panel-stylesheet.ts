/**
 * The panel's stylesheet, as one string.
 *
 * It sat inside `panel-element.ts` beside the renderer, the drag and the
 * tooltips — 330 lines of CSS in a file that already held four other jobs, and
 * the largest single extractable unit in the tree when
 * `docs/audits/2026-08-13-the-whole-tree-read-once.md` (F13) went looking. It
 * takes nothing and returns a string, which is why it was the split with the
 * fewest edges rather than merely the biggest.
 *
 * Everything it draws with is a token (§9.7): a raw hex in a rule here is a bug,
 * and `panel-tokens.ts` is where a colour is decided and where the contrast
 * arithmetic that holds it to AA lives.
 */

import { composeColourOver, PANEL_TOKENS } from "@/src/ui/panel-tokens.ts";

/**
 * `all: initial` on the host, because the game's stylesheet is not ours to
 * inherit and a panel that changes shape when the game restyles itself is a
 * panel nobody can trust to be readable.
 *
 * The placement that never changes is here rather than written onto the host in
 * script: the corner is where the panel starts, and a page where nothing was ever
 * dragged should need no JavaScript to put it there. `display` is restated
 * because `all: initial` resets it to `inline`, on which a fixed width means
 * nothing.
 *
 * ⚠️ **The list's height is arithmetic, not a number typed in.** The spec
 * promises at least eleven bars under `Wszyscy` and ten under a filter; both are
 * computed from the row height so that changing the type size cannot quietly
 * break the promise, and the count arrives as a custom property the render sets.
 *
 * ⚠️ **The floor is arithmetic and the ceiling is the window.** How many rows the
 * list asks for is the view's decision; how many it may have is this file's, and
 * it is one `max-height` on the host — so the panel cannot reach past the bottom
 * edge of a screen this file never measures.
 */
export function composePanelStyleText(): string {
  const t = PANEL_TOKENS;
  return `
:host {
  all: initial;
  /*
   * A column, so the list can be the one region that gives way to the ceiling
   * below. Restated after \`all: initial\` for the same reason \`display: block\`
   * was: the reset turns it into \`inline\`, on which none of this means anything.
   */
  display: flex;
  flex-direction: column;
  position: fixed;
  /*
   * Where the top edge is, as a value the ceiling can subtract. Written by
   * placement on every move, defaulted here so a page where nothing was ever
   * dragged needs no script — and \`all\` does not reset custom properties, which
   * is what makes a default in this rule survive the line above.
   */
  --MargoMeter-panel-top: ${t.space};
  top: var(--MargoMeter-panel-top);
  right: ${t.space};
  /*
   * ⚠️ **The panel never reaches past the bottom of the screen, and never covers
   * more of it than the token allows.** In CSS rather than measured: the panel's
   * height changes with every payload, so anything read out of the document is
   * stale before the next one. That the detail window below *is* measured is not
   * the same case and does not reopen this one — it is rebuilt and placed in one
   * breath, while the panel is measured once and drawn against for minutes. The
   * gap left at the bottom is the margin the panel starts with at the top.
   */
  max-height: min(calc(100vh - var(--MargoMeter-panel-top) - ${t.space}), ${t.maxHeightShare});
  z-index: ${t.layer};
}
.MargoMeter-titlebar {
  /* Never the region that shrinks: it is the thing you grab. */
  flex: none;
  display: flex;
  align-items: center;
  gap: ${t.spaceSmall};
  padding: ${t.spaceSmall} ${t.space};
  font: 11px/1.2 system-ui, sans-serif;
  letter-spacing: 0.06em;
  color: ${t.textQuiet};
  background: ${t.surfaceRaised};
  border: 1px solid ${t.border};
  border-bottom: none;
  border-radius: ${t.radius} ${t.radius} 0 0;
  box-sizing: border-box;
  width: ${t.width};
  /* The affordance is the cursor and the grip; nothing animates to advertise it. */
  cursor: move;
  user-select: none;
  touch-action: none;
}
.titlebar-button {
  padding: 0 ${t.spaceSmall};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  color: ${t.textQuiet};
  background: ${t.surface};
  /* Overrides the move cursor the bar sets: inheriting it would promise a drag
     from the one place in the bar that does not drag. */
  cursor: pointer;
}
.titlebar-button:hover { color: ${t.text}; }
.titlebar-version { color: ${t.textQuiet}; opacity: 0.7; font-size: 10px; }
.titlebar-copy { margin-left: auto; }
/* Dimmed because it is not for the player: it hands over the raw material. */
.titlebar-raw { opacity: 0.55; }
.titlebar-raw:hover { opacity: 1; }
/*
 * What every render draws into. It carries a class for one reason: a flex item
 * whose overflow is visible refuses to shrink below its own content, so without
 * \`min-height: 0\` here the ceiling on the host would stop at this node and never
 * reach the list.
 */
.MargoMeter-body { display: flex; flex-direction: column; min-height: 0; }
/*
 * No padding of its own: every region below is inset by the same step instead,
 * which is what lets the list run the full width of the panel and the rules
 * between regions reach both edges.
 */
.panel {
  font: 11px/1.35 system-ui, sans-serif;
  width: ${t.width};
  color: ${t.text};
  background: ${t.surface};
  border: 1px solid ${t.border};
  /* Square at the top: the title bar above it carries those two corners. */
  border-radius: 0 0 ${t.radius} ${t.radius};
  box-sizing: border-box;
  /* The other half of the chain the ceiling travels down — see .MargoMeter-body. */
  display: flex;
  flex-direction: column;
  min-height: 0;
}
/*
 * ⚠️ **Only the list gives way.** When the ceiling is lower than the panel wants
 * to be, the shortfall has to come out of somewhere, and every region but one
 * says the same thing at any height: a header, two strips of controls, the row
 * for what nobody can be charged with, the summary, a warning. There is nothing
 * to take off them, so they are told not to offer any — the list, which has a
 * fold and a scrollbar, takes all of it.
 *
 * The second rule is more specific rather than merely later: a \`.panel > *\` moved
 * below it would otherwise take the list's shrinking away without a word.
 * \`.undrawn\` needs no rule of its own — it is a \`.panel > *\` like the region it
 * replaced.
 */
.panel > * { flex: none; }
.panel > .list { flex: 0 1 auto; }
.tabs { display: flex; gap: ${t.spaceHalf}; padding: ${t.spaceRegion}; padding-bottom: 0; }
/* Every strip after the first sits closer to it: they are one control, in rows.
   A sibling selector rather than a class, so a third strip needed no new rule and
   sides-of did not have to become a name for something it is not. */
.tabs + .tabs { padding-top: ${t.radiusSmall}; }
.tab {
  padding: 1px ${t.spaceSmall};
  border-radius: ${t.radiusSmall};
  color: ${t.textQuiet};
  background: transparent;
  cursor: pointer;
  user-select: none;
}
.tab.selected { color: ${t.text}; background: ${t.surfaceRaised}; }
/* Holds the side filter against the right edge, so the row reads as the two
   controls it is rather than one strip of five words. */
.tabs-gap { flex: 1; }
.crumb { display: flex; gap: ${t.space}; align-items: baseline; padding: ${t.spaceRegion}; padding-bottom: 0; }
.crumb-back { cursor: pointer; color: ${t.textQuiet}; }
.crumb-back:hover { color: ${t.text}; }
.crumb-here { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/*
 * The list is the only thing that scrolls, and the only thing that gives way.
 *
 * Its height is what the view asked for: eleven bars under \`Wszyscy\`, ten under a
 * filter, and as many as a breakdown needs — never fewer than the ranking it was
 * opened from, so clicking into a combatant cannot shorten the window under the
 * hand. The ceiling on the host takes height back out of here and nowhere else.
 *
 * ⚠️ **Content box, deliberately.** The height above is the rows' own; the 12px of
 * padding sits outside it. Adding \`box-sizing: border-box\` would fold the padding
 * in and leave eleven bars a hair too tall for the list holding them, which shows
 * up as a scrollbar on a list that fits.
 */
.list {
  padding: ${t.spaceRegion};
  padding-bottom: ${t.spaceRegionAcross};
  height: calc(var(--MargoMeter-rows, 11) * (${t.rowHeight} + ${t.spaceHalf}) + ${t.spaceLarge});
  overflow-y: auto;
  overflow-x: hidden;
  /* Reserved whether or not a scrollbar is showing: it appears and disappears
     between two payloads, and a panel whose rows jump sideways every few seconds
     while somebody is reading them is worse than eleven pixels of margin. */
  scrollbar-gutter: stable;
  /* A wheel that has run out of list stops here rather than turning into a scroll
     of the game we are a guest on. */
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: ${t.border} transparent;
}
/*
 * Not uppercased by the stylesheet, which is what it did until a heading started
 * carrying a name: CZYM — GRACZ 4 shouts somebody name at them. The fixed
 * headings are written in capitals where they are composed, so a name keeps the
 * case the game gave it.
 */
/*
 * ⚠️ **It stays at the top edge while its own section scrolls**, so a figure is
 * never read under the wrong heading — a breakdown stacks three of them and the
 * one you are looking at is the one that matters.
 *
 * The background and the \`z-index\` are not decoration and cannot be dropped: a
 * row's bar is absolutely positioned and comes later in the tree, so a sticky
 * heading without both is painted over by the bars sliding under it.
 *
 * ⚠️ **The quiet is in the colour now, not in an \`opacity\`.** It read the same
 * either way while the heading stood still; sticking it over a scrolling row does
 * not, because \`opacity\` fades the background with the text and a bar would ghost
 * through it. The colour is the same composite the browser was making, computed
 * once instead.
 */
.section-heading {
  position: sticky;
  /* Up by the list's own inset, because that padding is inside the scroll's clip
     and the row scrolling away would otherwise show through it — see the token. */
  top: -${t.spaceRegionDown};
  z-index: 1;
  background: ${t.surface};
  display: flex;
  justify-content: space-between;
  color: ${composeColourOver(t.textQuiet, t.surface, 0.85) ?? t.textQuiet};
  letter-spacing: 0.08em;
  font-size: 10px;
  padding: ${t.spaceSmall} ${t.spaceHalf} ${t.spaceHalf};
}
.row {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${t.rowHeight};
  padding: 0 ${t.spaceSmall};
  margin-bottom: ${t.spaceHalf};
  border-radius: ${t.radiusSmall};
  background: ${t.track};
  overflow: hidden;
}
.row.drillable { cursor: pointer; }
.row.leaf { cursor: help; }
.bar { position: absolute; left: 0; top: 0; bottom: 0; opacity: ${t.barTint}; }
/*
 * The colour at full strength, on the edge the bar starts from.
 *
 * The bar itself is tinted so the text on it stays readable — see the tint
 * token — which costs the hue the palette was validated at; the cap gives it
 * back somewhere no text sits. It says whose, while the length says how much.
 */
.bar-cap { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: ${t.radiusSmall} 0 0 ${t.radiusSmall}; }
.row-rank, .row-name, .row-value { position: relative; }
.row-rank { color: ${t.textQuiet}; font-variant-numeric: tabular-nums; padding-right: ${t.spaceSmall}; }
/*
 * The profession, as a letter. It is the channel that survives colour blindness,
 * which is the whole reason the palette can stay as it is — so it is not
 * decoration and it is not optional where the game stated a profession.
 */
.row-badge {
  position: relative;
  flex: none;
  width: 13px;
  height: 13px;
  margin-right: ${t.spaceSmall};
  border-radius: ${t.radiusSmall};
  font-size: 9px;
  font-weight: 700;
  line-height: 13px;
  text-align: center;
}
.row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.row-value { font-variant-numeric: tabular-nums; padding-left: ${t.space}; font-weight: 600; }
.row-share { color: ${t.textQuiet}; padding-left: ${t.spaceSmall}; font-weight: 400; }
/*
 * The one row that says something is missing, and so the one row that never
 * scrolls away: it sits outside the list, above the side summary.
 */
/*
 * The row for what nobody can be charged with, and it is drawn as what it is.
 *
 * A dashed rule cuts it off the ranking above, and the bar is hatched rather
 * than solid — it is not a combatant, so it must not look like one at a glance.
 * The colour is the one for "we cannot say", which is the same thing the hatch
 * says in another channel (§9.7: never colour alone).
 */
.pinned { padding: 0 ${t.spaceRegionAcross} ${t.spaceRegionAcross}; }
.pinned .row { margin-top: ${t.spaceSmall}; border-top: 1px dashed ${t.border}; height: calc(${t.rowHeight} + 5px); }
.pinned .bar, .pinned .bar-cap { top: 4px; }
.pinned .bar {
  opacity: 0.4;
  mask-image: repeating-linear-gradient(-45deg, ${t.maskInk} 0 4px, transparent 4px 8px);
}
.pinned .bar-cap { opacity: 0.7; }
.header { display: flex; justify-content: space-between; align-items: baseline; padding: ${t.spaceRegion}; padding-bottom: 0; }
.header-outcome { color: ${t.textQuiet}; text-transform: uppercase; font-size: 10px; }
.empty { color: ${t.textQuiet}; padding: ${t.space} ${t.spaceHalf}; }
/*
 * The one list with nothing above the sentence, so the sentence is what the box
 * is for. Everywhere else \`.empty\` is a line under rows or under a heading and
 * reads correctly where it lands; here it would sit in the top corner of a box
 * eleven bars tall, which reads as a panel that lost the rest of itself.
 */
.list-waiting { display: flex; align-items: center; justify-content: center; text-align: center; }
/* The limit on what can be known reads quieter than the fact above it. */
.empty-limit { display: block; margin-top: ${t.spaceSmall}; font-size: 10px; opacity: 0.85; }
.sides-region { padding: ${t.spaceRegion}; padding-bottom: ${t.spaceRegionAcross}; border-top: 1px solid ${t.border}; }
.sides {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.sides-label { color: ${t.textQuiet}; font-weight: 400; opacity: 0.8; }
/* Quieter and smaller than the confrontation above it: it is the part of the
   fight that has nobody to be on a side of, not a third team. */
.sides-spare { margin-top: ${t.spaceSmall}; font-size: 10px; }
.sides-spare .sides-label { color: inherit; }
.sides-track { display: flex; height: 4px; margin-top: ${t.spaceSmall}; border-radius: ${t.radiusSmall}; overflow: hidden; background: ${t.track}; }
.warning { color: ${t.suspect}; padding: 0 ${t.spaceRegionAcross} ${t.spaceRegionDown}; }
.warning:first-of-type { padding-top: 5px; border-top: 1px solid ${t.border}; }
/*
 * The detail, as a window of ours rather than the browser's own tooltip.
 *
 * It never takes the pointer, so it cannot cover the row that summoned it and
 * flicker — and so nothing in it can be scrolled, which is why what it says has
 * to be *placed* onto the screen rather than trimmed to it.
 *
 * Everything below the width is a starting point rather than the last word:
 * src/ui/panel-tip-placement.ts writes a left and a top over it on every hover
 * that has a window to fit into. What is here is where the detail sits when
 * nothing does — a page that would not say how big it is, or a document with no
 * layout to measure.
 */
.MargoMeter-tip {
  /*
   * Absolute against the host, which is itself fixed, so the panel's own corner
   * is the anchor — and the placement writes in that same frame rather than
   * converting to the screen and back. Docked to the left of the panel: it lives
   * in the right-hand corner, so a detail trailing the cursor lands on the rows
   * it is describing.
   */
  position: absolute;
  right: calc(100% + ${t.spaceSmall});
  width: ${t.tipWidth};
  /*
   * ⚠️ **The width is arithmetic, so the box has to be the one that was
   * measured.** \`all: initial\` leaves this at \`content-box\`, under which the
   * padding and the border sit *outside* the token: the detail was drawn 268px
   * wide while its placement worked in 250, and a window whose width nobody can
   * state is one that gets put down a border's worth off the screen. Measured in
   * Firefox, on the four corners of a 1280x900 window.
   */
  box-sizing: border-box;
  padding: ${t.spaceSmall} ${t.space};
  font: 11px/1.4 system-ui, sans-serif;
  color: ${t.text};
  background: ${t.surface};
  border: 1px solid ${t.border};
  border-radius: ${t.radius};
  box-shadow: ${t.windowShadow};
  pointer-events: none;
  /*
   * ⚠️ **The one limit that cannot be placed around, so it is placed against.**
   * A detail longer than the screen has no position that shows all of it, and
   * src/ui/panel-tip-placement.ts keeps the top edge in preference to the
   * bottom — so this bounds the height to the window itself, which is the one
   * ceiling that leaves the arithmetic a position it can satisfy. In CSS because
   * 100vh re-evaluates itself, including on a resize nothing here listens for:
   * the same reasoning as the panel's own ceiling above.
   */
  max-height: calc(100vh - ${t.space} - ${t.space});
  overflow: hidden;
  z-index: ${t.layer};
}
.tip-title { font-weight: 600; margin-bottom: 2px; }
.tip-heading {
  margin-top: ${t.spaceSmall};
  padding-top: ${t.spaceSmall};
  border-top: 1px solid ${t.border};
  color: ${t.textQuiet};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 10px;
}
.tip-stat { display: flex; justify-content: space-between; gap: ${t.space}; }
.tip-stat.strong { font-weight: 600; }
.tip-stat-value { font-variant-numeric: tabular-nums; }
.tip-note { color: ${t.textQuiet}; margin-top: 2px; }
.undrawn { color: ${t.textQuiet}; font-style: italic; }
`.trim();
}

