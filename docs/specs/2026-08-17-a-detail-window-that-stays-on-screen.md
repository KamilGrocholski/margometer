# A detail window that stays on screen

Status: implemented

This narrows one sentence of `docs/specs/2026-08-11-the-panel-that-drills.md`:
the detail opens beside the row it describes. Everything that spec decides about
*what* the detail says still stands. What changes is where it is allowed to be.

It also supersedes one clause of
`docs/specs/2026-08-12-the-height-a-fight-needs.md`, which rejected
`getBoundingClientRect` partly on the grounds that "the tooltip already refuses
to do the same". The panel's own ceiling stays exactly as that spec decided it —
in CSS, unmeasured, for the reason it gives. The detail window does not, and the
distinction is at the end of this file.

## The defect: docked to one side, capped on neither

The detail was placed by two rules and no arithmetic. The stylesheet docked it to
the panel's **left** (`right: calc(100% + 4px)`) and script wrote one number, its
`top`, as the pointer's distance below the panel's own top edge. Both are right
where the panel is: the top-right corner it starts in has the whole window to its
left and most of it below.

The panel is draggable, so neither holds.

- **Dragged near the left edge**, the detail opens off the left of the window.
  What is left of it is a strip, and there is nothing the reader can do about it:
  the detail cannot be scrolled or moved.
- **A row hovered near the bottom** opens a detail that runs off the bottom, for
  the same reason from the other axis: `top` was floored at zero and capped at
  nothing.

Both were reachable in the shipped panel, and one of them is what the panel is
for: the drill is read by hovering.

## The rule: the whole of it is on the screen

One sentence, and everything below is how it is kept.

**The detail is measured.** Filled, shown, and then asked how big it came out —
in that order, because a hidden node measures as nothing and a node measured
before it is filled measures as the previous row's detail. Its height rises with
the number of rows in it, so there is no constant that could stand in for the
measurement.

**One rule, on both axes: the side that has room.** The detail prefers a side; if
what it needs is not there, it takes the other; if neither has it, it is put
where it fits.

**Down the window.** The detail **begins** at the cursor while there is room
below it, and **ends** at the cursor when there is not. The pointer is on one of
its edges either way, and that is what ties the window to the row it was opened
from. Sliding it up until it fits would also be on the screen, and it would leave
the pointer somewhere in the middle of a detail, against a row it is not
describing.

**Across the window.** The panel's left while it fits there, the panel's right
when it does not — and the rule is symmetric, because the panel is draggable and
either side can be the one that has run out. The left is preferred because the
panel starts in the right-hand corner, which is where the room is. When *neither*
side is on the screen — a narrow window, or a panel dragged into a corner — the
detail is put where it fits and allowed to overlap the panel. That is a real cost
and the right trade: a window over the row it describes can still be read.

**And the last word is the clamp.** Whatever the two rules above chose, the
position is held inside the screen with the same margin the panel keeps at its
own corner. It is what makes the promise a promise rather than a case analysis
somebody has to have got right.

**And a ceiling, in CSS.** A detail longer than the window has no position that
shows all of it, so `max-height` bounds it to the window itself. That is the one
limit that cannot be placed around, and it is the only place anything is trimmed.

**The box is the box.** `all: initial` leaves the detail at `content-box`, under
which its padding and border sit outside the stated width — it was drawn 268px
wide while its placement worked in 250. It is `border-box` now, and a test holds
the drawn width to the number the placement uses.

**And the panel it is placed against is the panel on the screen.** The drag owns
the position: it writes it onto the host and hands it back, and the placement
reads that and nothing else. Reading the field the caller passed in at mount
instead is right until somebody moves the panel, and then it is a second source
for one number — a panel dragged to the left edge went on having its detail
placed against the right-hand corner, 254px off the screen. Every check that
mattered was blind to it: the tests supplied a position and never dragged, and
the browser harness positioned the host by hand, so the two could not disagree.
What found it was driving the built userscript through a real drag, and that is
now a test.

## What a reader sees change

- A panel dragged to the left edge shows its detail on the right of the panel,
  whole.
- A row hovered at the bottom of the window shows a detail that ends at the
  cursor and runs upward from it, whole.
- The detail still begins at the pointer's own height wherever there is room for
  it, which is every hover on a panel that has not been dragged near an edge.
- Nothing else moves.

## Rejected alternatives

- **Flipping instead of measuring**, which is what this shipped as first: below
  the middle of the window the detail's bottom landed on the pointer via
  `translateY(-100%)`, and a `max-height` of the room on the chosen side kept it
  inside the screen. It needs no measurement and it is wrong, which is why it is
  recorded here rather than quietly replaced. **A cap does not move a window, it
  cuts it.** The rows past the cap are not drawn, nothing says they are missing,
  and the detail cannot be scrolled to reach them — so "inside the window" was
  bought by making the thing the reader hovered for unreadable, which is the same
  complaint in a place that is harder to see.
- **Measuring the panel too, instead of taking its corner from placement.** It is
  one more layout read for a number this repository already has exactly, and two
  sources for one position is how a panel comes to be drawn in one place and
  reasoned about in another.
- **Following the pointer horizontally as well.** The panel lives in the
  right-hand corner, so a detail trailing the cursor lands on the rows it
  describes.
- **Aligning the detail to the row rather than to the pointer**, which is what
  the first incarnation of this add-on did. The cursor is the thing the reader is
  actually looking at, and a row is a rectangle whose top can be some way from
  it.
- **Scrolling a detail too tall for the window.** It never takes the pointer — it
  cannot, or it would cover the row it is describing and flicker — so a scrollbar
  would be an offer nobody could take.

## Why this measurement and not the panel's

The panel's ceiling stays in CSS. The two cases look alike and are not:

|  | the panel | the detail |
|---|---|---|
| changes | on every payload, seconds apart | never, once drawn |
| lives | for the whole fight | until the pointer moves |
| measured value spent | minutes later | in the same breath |

A figure read off the panel is stale before the next payload, and `100vh` is not.
A figure read off the detail describes a node that was built two statements
earlier and is placed two statements later, with nothing in between that could
change it. That is the whole of the difference, and it is why one of these is a
stylesheet rule and the other is a `getBoundingClientRect`.
