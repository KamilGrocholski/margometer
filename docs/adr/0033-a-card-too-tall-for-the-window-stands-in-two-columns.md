# 0033. A card too tall for the window stands in two columns

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

A card taller than the room the window leaves gave up its runs, the last one first, and said so
(`develop ADR 0054`). Over `captures/` on 2026-10-03 the tallest card is 38 lines and the median 24
(`deno task panel:cards --tallest`). The tallest stands 681px at the middle type step in Chrome 154,
and in a window 620px tall it gave up its last run, "Otrzymane bonusy legendarne", whole. A fight of
ten against ten, which the recordings do not hold yet, adds rows to the runs about legendary bonuses
and to every cut of a card.

## Decision

Decided with the maintainer on 2026-10-03.

**A card too tall for the window in one column stands in two, each as wide as the one bound, before
anything is given up.** The block of the fight's own figures opens the first column; the second
opens at the run that leaves the two closest in height, counted by the same lines the height
arithmetic counts. The notes stand across the foot of both. Only where two columns do not fit either
are runs given up, the last one first, as before.

**The side a card of two columns opens on is decided by the width of two**, twice the bound and the
air between them, through the same placement that decides it for one (`develop ADR 0091`). One
function states that width for the stylesheet and for the placement.

Rejected: giving up the detail under a line before a whole run. It keeps every run on a short card,
but it still takes something away from a card the screen has room for beside it.

Rejected: a card that scrolls. The card takes no pointer, because a press on it belongs to the row
underneath (`develop ADR 0054`).

## Consequences

A card a reader saw cut on a short window now stands twice as wide and whole. On a screen narrower
than two bounds the card is clamped to the screen, and its columns then draw narrower than the
floors its notes are counted at assume, so a note in a column may run a line longer than counted.
