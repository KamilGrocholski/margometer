# 0050. The list keeps the place a reader was at

- **Status:** Accepted
- **Date:** 2026-09-04

## Context

`.list` is the one region that scrolls (**ADR 0031**), and every redraw replaces it whole:
`composeRegionInPlace` builds the next element and hands it `replaceWith`. A new element starts at
its top, so a reader reading a list lost their place on every payload the game delivered — 117 per
fight over `captures/`, measured 2026-08-30 — and on every fold, and on every way back out of a
level. `tests/e2e/panel-scroll.spec.ts` asserted exactly that, as _the redraw starts the region
again_.

Which lists overflow is arithmetic. The list stands at the rows it promises: eleven under everybody,
ten under a side, and never fewer once a row is opened (`DESIGN.md`, **ADR 0014**). A reading
carries up to twenty rows, so a ranking of more than eleven combatants overflows. No recording holds
one — the largest shape in `docs/captured-fights.md` is `10 vs 1` — which is why the browser suite
reaches an overflowing region by opening a level instead: 491 pixels of rows in a 437 pixel region,
measured on Chrome 152 on 2026-09-02.

## Decision

**A position is kept per place a reader stands in, and put back when they stand there again.** A
place is every field of `ScreenState` that decides which list is drawn, plus the fight it is drawn
from; `composeListName` in `src/ui/panel-screen.ts` composes the name, because `ARCHITECTURE.md`
names that file the owner of where the reader is. A level opened for the first time starts at its
top. A new fight is a place nobody has been.

**The position is read before any region is redrawn, and written after every region is standing.**
Both halves are load-bearing and neither is obvious. A region taken away grows the list under it and
the browser answers a taller box by clamping the position on it, so a read taken partway through a
redraw reads a number the reader never chose: measured on Chrome 152.0.7977.64 on 2026-09-04, going
back from a level takes the crumb away and 54 pixels became 34 as the crumb went. The same fact read
the other way round is why the position goes back on last.

**A slot neither remembers nor is restored.** A fold, a panel waiting for its first fight and a
region that could not be drawn all put something in the region that does not scroll, and a zero
written from one of those is a position nobody took.

**It is memory, and the maximum is stated.** `src/ui/panel-scroll.ts` keeps at most 32 places and
drops the one kept longest ago (**S11**).

## Consequences

Easy: a reader watching a fight keeps their place while it is fought, and a reader who opens
somebody's figure and comes back out is where they were. That is the whole of what this is for.

Paid: the panel now reads one number off the browser per redraw, and the order of `show` is a rule
rather than an arrangement. It is stated where it is spelled and held by
`tests/e2e/panel-scroll.spec.ts`, which is the only place it can be held — the fake document lays
nothing out, so every unit test here passes with the order wrong.

Paid: a place a reader visited and left holds its position until 32 more places push it out. What
comes back is a number and never a row, so a list that has since lost rows is clamped by the browser
rather than restored to nothing.

Obliges: a new region that scrolls is a second subject for `src/ui/panel-scroll.ts`, and a
`PanelView` that stops carrying `listName` is a panel that quietly shares one place between two
lists.

## Alternatives

- **One position, belonging to whatever is drawn now.** Smaller, and it answers the payloads — but
  the way back out of a level is where the complaint started, and it answers nothing there.
- **Deriving the name inside the panel**, from the view it is handed. It costs no field and no
  change to the entry, and it recomputes a fact `ui/panel-screen.ts` owns. A field missed in the
  derivation is two places sharing one name, which shows up as a list that jumps to somewhere the
  reader never was.
- **Not replacing the region at all** — reconciling the rows in place, which would keep the position
  with no memory at all. That is the DOM rebuild measured and declined on 2026-08-18: the panel is
  fast enough and the rebuild is the expensive change.
- **Keeping the position in the browser's store**, beside the fold and the panel's own corner. A
  position that outlived a reload would open a fight the page no longer holds partway down a ranking
  the reader has not seen.
