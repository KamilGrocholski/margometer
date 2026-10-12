# 0056. Every hint the panel gives is its own card

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

Every row of the panel and of the window beside it already explained itself on a card of the panel's
own (develop ADR 0086, develop ADR 0090). Six places in `src/ui/panel-element.ts` at `8df1157` still
set the browser's `title` instead: the four controls on the panel's bar, the fold on the helper's
bar, the shelf's pin, the crumb's own name, both bars (the drag hint) and both size grips. The
browser draws a `title`, not the sheet, so its face, its ink and when it opens are the browser's,
and `DESIGN.md` has no say over any of them. The maintainer's list asked for the panel to stop using
the browser's tooltips.

## Decision

Decided with the maintainer on 2026-10-12.

**A control, a pin and the crumb's name each open a card that names them, and nothing the panel
draws carries `title`.** A card that only names something opens the way a row's does, beside the
window it stands in. The controls and the pins say the same whatever the fight, and the bars they
stand on are drawn outside the register a draw resets, so their cards are registered once, when the
panel stands up. The crumb's name is registered with the draw, because it names the level open.

**The drag hint on the bars and on the size grips is dropped, not moved.** The grip mark and the
corner's two strokes say it before anybody tries (`DESIGN.md`, the panel is moved by its bar).

Rejected: **a card over the whole bar**, as far as the `title` reached. A card would open every time
the pointer crossed the bar on its way to a control or a row, to say what the grip already says.

Rejected: **a card on the grip mark alone.** It is the one thing on the bar that needs no
explaining.

Rejected: **nothing for the crumb's name.** The row a reader came from has the name in full on its
own card, but that row is gone once its level opens, and the crumb is where the name is cut.

## Consequences

- `tests/ui/panel-element.test.ts` draws every screen the panel has and finds no `title` on any of
  them. The controls' words are read off their cards.
- The words of the drag hints (`PANEL_WORDS.drag`, `PANEL_WORDS.resizeGrip`, `HELPER_WORDS.drag`)
  are gone, because nothing reads them.
