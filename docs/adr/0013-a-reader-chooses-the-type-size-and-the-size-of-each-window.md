# 0013. A reader chooses the type size and the size of each window

- **Status:** Accepted
- **Date:** 2026-09-27

## Context

The panel draws at one size: an 11px body on a 15px line, an 18px row, a 260px panel and a 210px
window beside it. The panel's height is arithmetic over its rows, under a `66vh` ceiling. The one
thing a reader chooses about it is where kept fights are stored, and that choice stands as a strip
over the shelf.

`596f95f` (2026-09-15) moved the default to 13px and a 306px panel. It was measured in Chrome 152
that day, over the panel's own mock at each step. At an unchanged 260px, the rank, figure and share
cells took 130px at 11px and 148px at 13px, so 12px was the last step that fit the width. Eleven
bars at 13px needed a window 640px tall, against 558px at 11px. `e57c2f6` took the default back to
11px the same day, because the maintainer found the result too big. That settled the default. It did
not settle whether a reader who wants larger type may have it.

`731a01b` (2026-09-04) rejected a settings window. A third window on somebody else's page was too
much, and a modal breaks the Quiet Panel Rule (`DESIGN.md`).

`TODO.md` asks for options that change the type size, and for resizing by a corner, the way an HTML
`textarea` resizes.

## Decision

Decided with the maintainer on 2026-09-27, over the design canvas made that day.

**The options open inside the panel, from a ⚙ control on its bar, the way ☰ opens the shelf.** They
cover the panel's screens as the shelf does, and are not a screen themselves. Where fights are kept
moves there, so the shelf is only the list of fights. The options can be reached before the first
fight: a control that does nothing is worse than one that is not there (`DESIGN.md`). ⚙ stands first
on the bar. The shelf, save and fold controls keep the places a reader knows, and save comes and
goes, so ⚙ placed between them would move.

**The type is drawn at one of three steps, 11, 12 and 13px, and 11px stays the default.** Each step
is a table of values measured in Chrome at that step: line, row, rank cell, the caveat ring, the
small type, the widths. None of them is scaled from another step. The step applies to both windows.
The sheet is composed from the chosen step's table, and the view swaps its text only when the step
changes.

**Each window is sized by a grip in its bottom-right corner, and keeps the size it was given.** This
holds for the panel and for the window beside it. The width and the height are both the reader's.
The height is fixed: the list scrolls inside it, and a short fight leaves an empty track under its
rows. A window with no stored size behaves as it did before this decision. A reset in the options
takes one window back to that. The grip is a second kind of grab on the drag's four guarded
listeners, and the size is written when the grip is released, as a position is.

**Three storage keys are added:** `MargoMeter-type`, `MargoMeter-size` and
`MargoMeter-pomocnik-size`. Each one is read field by field. A value that does not read falls back
to the default and leaves a `kept` defect, as the position does.

**The sheet departs from `develop`'s where this decision needs it, and only there.** The test that
held the sheet to `develop` @ `fa1dcce` byte for byte keeps holding every rule this decision does
not name. It also names the rules that moved and the rules that were added.

Rejected: **one scale factor over the whole panel**, whether `zoom`, `transform: scale` or every
length multiplied. A scaled line box stops being a whole pixel (`develop ADR 0015`). The ring and
the marks were each measured at a size, and nine pixels of ring carry no letter although the ratio
says they would (`develop ADR 0092`). `zoom` would also move Firefox's floor from 92 to 126
(`docs/browser-support.md`).

Rejected: **each step's values as custom properties under `:host([…])`.** The sheet guards add up
literal pixels, and a `var()` in every length would hide the arithmetic they hold. `:host()` as a
function is a selector the browser register does not yet carry. The host's `style` attribute belongs
to the drag, which rewrites it on every move.

Rejected: **CSS `resize` with a `ResizeObserver`.** That is a new callback handed to the browser and
a new browser API reached past `PanelDocument`, and the size would have to be read off the document,
which nothing here does.

Rejected: **themes.** The panel is dark because the client under it is dark (`DESIGN.md`). Every
colour was measured for contrast and for its distance from every other, and a second palette would
need all of it again.

## Consequences

- `DESIGN.md` loses two sentences: that the panel uses one size, and that the `66vh` ceiling is
  lifted only for a screenshot. A window the reader sized may stand taller than `66vh`, and the
  viewport still bounds it.
- The ranking's "eleven bars" becomes the reader's own number in a sized panel. No level changes the
  height of a sized panel, so "never fewer once a row is opened" holds without the arithmetic.
- The card measurements taken at 11px — the label cap and the note and name floors — are taken again
  at 12 and 13px, or a label cuts with nothing saying so.
- A scroll kept in pixels lands a little off its row after the step changes. That stays open.
