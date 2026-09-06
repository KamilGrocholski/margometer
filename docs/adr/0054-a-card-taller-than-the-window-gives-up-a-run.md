# 0054. A card taller than the window gives up a run

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

The card a row opens is `position:fixed`, 250 pixels wide, `overflow:hidden`, and takes no pointer
so a press underneath still reaches the row it describes. Its top edge is clamped against a height
the draw **counts** — lines and runs — rather than one anybody measures, because nothing in
`src/ui/panel-tip.ts` measures a document.

Where the counted height is more than the window holds, the clamp's ceiling falls below its floor
and CSS answers with the floor: the card opens at the inset and the box takes the bottom off it.

Measured on Chrome 152.0.7977.64, 2026-09-06, over
`captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`:

| Window | Card holds | Card shows |
| ------ | ---------- | ---------- |
| 900 px | 533 px     | 533 px     |
| 600 px | 533 px     | 533 px     |
| 560 px | 533 px     | 533 px     |
| 480 px | 533 px     | 464 px     |

So the edge is a 549 px window, and under it the card loses the end of itself — about four and a
half lines at 480 px — with no scrollbar, no mark and no way to reach what went. On a panel whose
whole argument is that a figure which may be short must look different from one that is not, and
that zero and unknown never share a glyph, content disappearing in silence is the failure this
project exists to prevent.

The tallest card the corpus composes is 33 lines over 5 runs. The four figures come first, then the
counters, then the two runs, then the notes — so what a clip takes is the notes, which carry the
suspicions.

## Decision

**A card that will not fit gives up whole runs, from the last inward, and says that it did.**

The four figures stand whatever the window: they are what a card is for. The notes stand too — a
suspicion is a claim that a figure above it may be wrong, and that outranks how somebody fought. So
what is given up is the counters and the two runs between them, the last one first, and the card
carries one sentence saying a part of it is not there (`CARD_WORDS.cut`).

**The cut falls at a run's own edge**, never inside one, so a reader never meets half a line.

**The height is worked out once, in `getTipHeight`** (`src/ui/panel-look.ts`), and written onto the
element as one property the sheet spends. It used to be worked out twice — the sheet rebuilt it in
`calc` from two counts the draw wrote — which was enough while nothing else needed the number. The
trim needs it, and a trim and a clamp at two heights would put the notice on a card that fitted or
leave one that did not without it.

Where the page states no height there is no trim: a window nothing can size is not one to cut
against, and that is every panel a test draws.

## Consequences

Easy: a reader on a short window is told, and what they are told is true of the card in front of
them rather than of the one that would have been drawn.

Paid: on a window under 549 px a reader loses a run they would have had on a taller one, and the
panel does not say which. Naming it would be our vocabulary in a Polish sentence (**L3**), and the
run is one hover and a taller window away.

Paid: `getTipSize` and `getTipHeight` are now two steps of one answer rather than one, and a change
to `LINE_HEIGHT`, `SPACE.small` or the group rule has to move in both the tokens and the arithmetic
that reads them. `tests/e2e/panel-tip.spec.ts` holds the count against what Chrome draws, in the
direction that matters: the count is at or above the drawing, never under it.

Obliges: a run added to the card has to decide where it sits in the order of sacrifice, which is
`composeGroupsWithout`'s and is stated there.

## Alternatives

- **Let the card scroll.** It takes no pointer, so there is nothing to scroll it with, and a tooltip
  a reader has to scroll while the pointer that opened it must not move is not a tooltip. Giving it
  pointer events back would take the press that opens a row away from the row.
- **Drop `max-height` and let it overflow the window.** The same content is lost, further away, and
  with no box saying where it ended.
- **Shrink the type or the spacing on a short window.** A media query changing `line-height` puts
  the sheet and `getTipHeight` at different numbers on exactly the windows where the arithmetic has
  to be right.
- **Two columns.** Nothing would be lost: the card is 250 px in a window at least four times that.
  It doubles the card's width, and where it stands is already decided by whether 250 px fit beside
  the panel (**ADR 0019**) — so a card that fitted vertically would start falling off sideways.
  Refused for now rather than on principle: it is the only alternative that loses nothing, and it
  becomes worth its cost the day a card is routinely too tall on a window a reader actually uses.
- **Say it is cut and clip anyway.** The notice would be at the bottom of the card, which is the
  part being cut.
