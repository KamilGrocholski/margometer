# 0060. A grip says which window it drags

- **Status:** Accepted
- **Date:** 2026-09-08

## Context

The maintainer asked for the helper as **a separate window** — moved, minimised, and found where it
was left. `SECURITY.md`'s guest rule allows no second host: everything a reader meets lives inside
one shadow root under one name. So the second window is a child of the same root, as the hover card
already is.

Every listener the panel has sits **at that root**, and each one was written when there was one
window under it. Read before anything was built, three of them treat a second window as the panel:

1. `setPanelDrag` starts a drag on any target carrying a **valueless** `data-grip`, and writes the
   position onto whatever host it was handed. A press on the second bar would drag the panel and
   overwrite `MargoMeter-place`.
2. `composePositionStyle` writes `--MargoMeter-panel-top` beside the top, so a second window using
   it would rewrite the panel's own height ceiling on every drag.
3. The `contextmenu` listener fires `{kind:"back"}` for a right press **anywhere** under the root.

## Decision

**A grip carries the name of the window it drags**, and a drag refuses any other:
`setGripMark(grip, windowName)`, and `setPanelDrag` takes the name it answers to. Two names, `panel`
and `standing`, spelled once each in `src/ui/panel-drag.ts` (**N13**).

**Each window states its own ceiling**, under its own custom property. Sharing one had the second
window rewriting the first one's.

**The second window opens beside the panel, level with it, and never centred.**
`composeDefaultPosition` centres what it is given, so centring both puts the second exactly under
the first — where the panel paints over it and a reader sees nothing at all.

**Its fold and its corner are its own two keys** — `MargoMeter-pomocnik-folded` and
`MargoMeter-pomocnik-place` — beside the panel's four. Two windows, two answers: folding the panel
over a fight a reader is watching must not take the other one with it. `ARCHITECTURE.md`'s rule on
stored preferences binds them from the first release.

**It folds and it does not close.** The fold takes the body and leaves the bar, so the gesture that
put it away is the gesture that brings it back. There is no close control: nothing would bring the
window back.

**The frame is positioned, deliberately.** A positioned element paints over a static one whatever
the tree order, so a window laid out any other way could cover a control of the panel's and take its
press.

## Consequences

Easy: the drag, the clamp, the stored corner and the fold are all the panel's own, reused rather
than written again — `setPanelDrag` already took its host and its bar as arguments.

Hard: **a bare `[data-grip]` no longer names one thing.** The browser suite measured the bar with
`page.locator("[data-grip]").first()`, which now matches two, and `readPanelShape` serialised every
root child but the card. Both were fixed in the commit that added the window; anything else reading
the root by shape has to say which window it means.

Also: a right press anywhere under the root still steps the panel back a level, the second window
included. That is left as it is and stated here, because a right press on the helper is a gesture
nobody has asked for a meaning for — and inventing one would be a second way to move the panel's
screen.

## Alternatives

**A second shadow host.** Rejected: `SECURITY.md`'s guest rule puts everything a reader meets inside
one root under one name, and a second host would need its own copy of the sheet.

**A second attribute — `data-grip-standing`.** It works, and it leaves the panel's grip meaning "any
window" for the next one added. Naming the value scales; adding an attribute per window does not.

**A region inside the panel's own frame.** No second window at all, and no second anything to move
or fold. Rejected by the maintainer on 2026-09-08: the helper is to be moved and minimised on its
own, and a region has no bar to do either by.
