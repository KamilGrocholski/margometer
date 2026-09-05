# 0052. A wheel turn outlives the payload that lands in it

- **Status:** Accepted
- **Date:** 2026-09-05

## Context

**ADR 0050** keeps the reader's place across a redraw by reading the position off the region about
to go and writing it onto the one that stands next. It holds for a position that is standing still.
It does not hold for one that is moving.

A wheel turn is not a position. Chrome animates one on its compositor over the frames after the
event, and the animation belongs to the **element** being scrolled. So a payload landing inside a
turn costs it twice: `replaceWith` takes the scrolling element away, which throws the animation
away, and the position read a moment earlier — before the compositor had committed any of the turn —
is then written back over the replacement. The turn is not slowed or shortened. It is undone.

Measured on Chrome 152.0.7977.64, 2026-09-05, on the material **ADR 0050** cites (491 pixels of rows
in a 437 pixel region, so 54 pixels of travel), one payload fed at each delay after a 400 pixel
turn:

| Payload lands | Where the region ends up |
| ------------- | ------------------------ |
| 0 ms          | 0 — the turn is gone     |
| 50 ms         | 54                       |
| 100 ms        | 54                       |
| 200 ms        | 54                       |
| 400 ms        | 54                       |
| 800 ms        | 54                       |

So the window is under 50 ms wide. What makes it matter is how often something lands in it: the
preview plays a recording at one payload every 220 ms (`tools/preview-page.ts`), and the complaint
this ADR answers was made against the preview with play running — _sometimes I cannot scroll_.
`tests/e2e/panel-scroll.spec.ts` missed it because its wheel test polls the region to a standstill
**before** feeding anything, which is the one timing where nothing is lost.

## Decision

**The same list drawn again keeps the element the reader is scrolling.** The rows are composed
exactly as before and swapped into the standing region with one `replaceChildren`
(`setListRowsDrawn` in `src/ui/panel-scroll.ts`). The region's identity survives, so the browser
keeps both the reader's position and any turn still animating, and there is nothing for the panel to
put back.

**A different list is the region replaced, as it always was**, and **ADR 0050**'s pair runs in full:
the position kept under the name the reader is going to is what they land on. The name is the whole
of the test — `composeListName` already owns what counts as another place.

**So the position is written back only where the region was replaced.** Writing one onto a region
that never went is what takes a turn away, which is the defect above stated as a rule.

This narrows **ADR 0050** and supersedes nothing in it. Every claim it makes about reading before
any region is drawn and writing after all of them still binds, on the path where a region is
replaced.

## Consequences

Easy: a reader can scroll a ranking while a fight is being fought, or while the preview is playing,
and the turn goes where they aimed it.

Paid: one region is now drawn differently from every other in the panel, and a reader of
`panel-element.ts` has to know why. The reason is in `panel-scroll.ts`, which owns the region that
scrolls, and the branch is one line and a boolean.

Paid: `PanelElement` gained `children` and `replaceChildren`. The interface is the surface the panel
asks a document for, and it is now two names wider. Neither earns a row in
`docs/browser-support.md`, because a row there names a construct at or above the floor: from MDN's
`browser-compat-data`, read 2026-09-05, `replaceChildren` is Chrome 86, Firefox 78 and Safari 14
against a floor of 93, 91 and 16, and `children` predates all three by a decade. No floor moved.

Obliges: a second region that scrolls has to decide this question again, and **ADR 0050**'s
obligation already sends that case to `src/ui/panel-scroll.ts`.

## Alternatives

- **Reading the turn's destination instead of its current position.** This would keep the region
  replacement and fix the stale read. No browser exposes where an animated scroll is going; there is
  only the position it has reached. It cannot be written.
- **Reconciling the rows in place** — matching row against row and touching only what changed. That
  is the DOM rebuild measured and declined on 2026-08-18, and this is deliberately not it: the rows
  are still composed whole, and exactly one node is spared. The cost of a draw is unchanged bar one
  `replaceWith` becoming one `replaceChildren`.
- **Not redrawing the list while a wheel is in flight**, on a timer after the last wheel event. It
  would hold a payload's figures off the panel to protect a gesture, which is the wrong way round —
  the panel exists to show the fight — and it answers a question with a number nobody can defend.
- **Living with it.** The window is under 50 ms, which is nothing against a fight's own pace. It is
  not nothing against the preview's 220 ms, and the preview is where `src/` is read.
