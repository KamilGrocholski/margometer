# 0029. A panel nobody has moved opens in the middle of the window

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

The panel was anchored to the top right corner by the sheet, at `panelInset`, and `left` was not
written until the first drag derived one from the two numbers the sheet was built from
(`src/ui/panel-drag.ts`). Until then the panel had no position anybody could read, which is why
`composeTipLeft` takes a null and why the detail window's side was decided by "while the panel sits
in its corner".

The corner is where a panel hides. This one is the thing a reader opened the game with the add-on
for, and it is their own screen.

Centring it exactly needs a height, and the panel has no fixed one: it draws a title bar while
waiting and grows a row per combatant. Measuring the host would mean a `getBoundingClientRect` on
`PanelElement`, which is the interface that deliberately carries only what the panel uses, and the
fake document in the tests would have to answer it.

## Decision

**A panel nobody has moved opens in the middle of the window**, and it is put there at mount rather
than at the first grab — so the detail window, the card and the drag all read a position from the
first frame.

**It is centred on the tallest body the sheet allows**, `maxHeightShare`, and not on the height it
has at that moment: a panel centred on its waiting bar walks down the screen as the rows arrive. The
arithmetic is over tokens this file already reads, so nothing is measured off the document.

**Where the page states no size, the sheet's corner stands.** A position derived from a guess
snatches the panel out from under the hand on the first drag, which is the trap the corner-derived
default existed to avoid.

## Consequences

Easy: the panel is where the reader is already looking, and everything that draws beside it knows
where it is before anything is dragged.

Hard: it stands over the middle of the game's own window until it is moved, which is the fight for a
reader who has not dragged it yet. A drag is one press and it is remembered from then on.

Obliged: `tools/panel-screenshots.ts` puts the panel back in the corner before measuring, because
the frame it takes is the distance from the panel's left edge to the right edge of the viewport.

## Alternatives

**Centre it on the height it has.** Exact, and it needs `getBoundingClientRect` on the host — a new
method on `PanelElement` and in the fake document — for a panel that then walks down the screen as a
fight fills it.

**Centre it in CSS with a transform.** The browser gets it exactly right and the first drag then has
to read a position back off the host, which is the measurement above by another route, plus a
`transform` the drag has to remember to release.

**Centre across, keep the top inset.** Half a decision: the panel is still against an edge, and "the
middle" is not what anybody would call it.
