# 0071. A right press belongs to the window it lands in

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

**ADR 0060** put the helper window under the panel's own shadow root, read the three listeners that
treat a second window as the panel, and fixed two of them. The third it left standing and said so:

> a right press anywhere under the root still steps the panel back a level, the second window
> included. That is left as it is and stated here, because a right press on the helper is a gesture
> nobody has asked for a meaning for.

The maintainer asked for one on 2026-09-09, from the game: a right press in **Pomocnik** takes the
main panel back a rung. It is the whole of the defect — `handlePressBack` drops `openPart`, then
`openPairId`, then `openRowId` and `openUnnamedEnd`, and `openStandingId` is never touched, so the
window a reader pressed does not move and the panel behind it does.

The listener reads attributes off the node under the hand and **walks no ancestors**, which is the
rule every press in this panel is read by. That is what makes the two windows indistinguishable
here: a caster's name inside the helper and a person's name inside the ranking are the same node to
it, and the bar, the padding and the window's own sentences carry no mark at all.

## Decision

**A right press inside the window beside the panel moves nothing.** The panel's drill stays where it
is, and the window answers no right press of its own: a reader who has not asked for a meaning is
not given one.

**The menu is still suppressed under the whole root.** `preventDefault` runs before anything decides
whose press it was, so what a reader meets over either window is the same: nothing. A browser menu
opening over one window and not the other would be the panel teaching two rules.

**Which window holds a press is answered by the tree, not by a mark.** `PanelElement` gains
`contains`, a fourth name on that surface — after the two **ADR 0052** added and the one the scroll
reads a region back by — and the back listener is handed the window to ask.
`docs/browser-support.md` carries its row.

## Consequences

Easy: one question, at one place, and a new element drawn inside that window is covered the day it
is drawn.

Hard: `tests/fake-document.ts` hands its listeners the element itself rather than a stand-in
carrying `getAttribute` — a window cannot be asked whether it holds an object that is not in it.
That is closer to what a browser does, and it is a change every test using the fake runs on.

Also: the hover card is a root child too, so a right press on a card still steps the panel back. The
pointer sits on the row rather than on the card while one is open, so nobody meets it; if that
changes, this is the decision to revisit.

## Alternatives

**The window gets its own way out**, closing `openStandingId`. Rejected for the reason 0060 gave and
this ADR does not overturn: nobody has asked for a meaning there, and a gesture invented for a
reader is a gesture they meet by accident.

**The browser's own menu opens over the window.** Rejected: the panel suppresses it everywhere else,
and the exception would have to be learned.

**A `data-window` mark on every element the window composes**, read the way every other press is. It
works and adds no name to the element surface — but it needs a guard walking the composed window to
hold it, and an element added later without the mark brings this defect back silently. The mark is
right for a control, which is what 0060 used it for, and wrong for a region.
