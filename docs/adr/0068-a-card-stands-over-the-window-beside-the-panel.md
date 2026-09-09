# 0068. A card stands over the window beside the panel

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

Three things overlap inside the one shadow root: the panel's frame, the window beside it, and the
card a pointer opens. Only two of them said where they stood. `:host` carried `z-index: 9999`, which
is the add-on against the **game's** page; the window beside the panel carried **the same
constant**, which is a different question; and the card carried none at all.

So inside the root the window won on its layer and the card won nothing, and a reader who dragged
the window over the panel found it covering the card they had just pointed at.

The constant was one name doing two jobs — over the game, and over each other — which is why the
second one was never decided.

## Decision

**Inside the root the order is: the frame, then the window, then the card.** A `LAYER` token states
the two that need one; the frame takes none and sits under both.

**A card is the one thing a reader asked for by pointing**, so nothing they did not point at is
drawn over it. The window may be dragged wherever the reader likes, the panel included — that is
what makes it a window — and the card still answers.

`PLACE.layer` keeps its own job and now has only that one: the host against the game's page.

## Consequences

The two questions are separable in the source, so raising the add-on above something on the game's
page can no longer silently reorder anything inside the root.

**The guard is a paint-order reading, not a hit test**, and this cost two wrong tests to learn. A
drag of the window onto the row cannot open a card at all: the window takes the pointer, so the row
never sees the hover. And `elementFromPoint` measures nothing here — the card is
`pointer-events: none`, so hit-testing skips it and answers with whatever child of the window lay
underneath, which is how a test passed with the layers inverted. What holds it is
`elementsFromPoint`, topmost first, with the card made hit-testable for the probe alone: the one
property the test changes, and never the layer it is testing.

## Alternatives

**Ordering by DOM position instead of a layer.** The root appends the frame, the card and the window
in that order, so the window is last and wins. Reordering the appends would work today and says
nothing about intent — the next person to add a child would have to know that the order is load-
bearing, with nothing in the source saying so.

**Giving the card the host's constant too.** Three things on one number is what produced this, and a
tie is decided by DOM order, which is the thing that needed deciding.
