# 0091. A card is as wide as what it says

- **Status:** Accepted
- **Date:** 2026-09-15

## Context

Every card the panel opened was 296px wide, because the stylesheet said `width: 296px` and nothing
else decided it. That is right for the card a person's row opens — four figures, both runs, the
counters and the notes, which fill it — and wrong for every card that is not one.

The second window's card is the case that shows it. It holds a skill name and one instruction:
`Szadź` over `LPM — kto rzucił`, sixteen characters on two lines. Measured in Chrome 152 on
2026-09-15 over `2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0`, laid out at its own content's
width it comes to **117px**, and `Podwójny dech` to 121px. It was drawn at 296px — two and a half
times the room it asked for, standing over the rows of the window it came from.

The width is also the one number about a card this tree cannot work out. The height is arithmetic —
lines times what a line costs — and that works because a line is a line whatever font the machine
resolves `system-ui` to. A width is not: it is the sum of the advances of the characters actually
drawn, in a face that is Segoe UI on Windows, and something else on every other desktop. An
arithmetic here would be a measurement taken on one machine and shipped to everybody.

## Decision

**The card is laid out at `max-content` under a stated maximum, and the maximum is the old fixed
width.** `TIP.widthMaximum` is that bound, and it clamps rather than sizes. The sheet also holds the
card inside the viewport, which the bound alone does not answer.

**The placement pins the edge facing the window, never a left offset worked out from the bound.**
`composeTipAcross` answers which screen edge a card is measured from and how far: `right` for a card
standing to its window's left, `left` for one flipped to the other side. A left offset computed from
the bound puts a 296px card in exactly the right place and a 117px card 179px away from the window
it belongs to — the same place, a different card, and nothing about the arithmetic looking wrong.

**Which side a card opens on is still decided by the bound.** Not by the width of the card in hand:
a short card would find room on the left where the card before it found none, and a reader crossing
two rows of one list would watch the card jump from one side of the window to the other. This is the
half of **ADR 0090** that does not move.

## Consequences

The height arithmetic is untouched, and the reason is worth stating because it is not obvious. A
note's `max-content` is its **unwrapped** width, so a card is narrower than the bound only where
every note on it already fits one line — and `NOTE_CHARACTERS_PER_LINE`, the floor that counts a
wrapping sentence, is never counting a wrap the card no longer has. Measured over the same
recording: every card's height, narrow and wide alike, is the pixel it was before.

Nothing in `src/` knows what a card draws at, which is what keeps `src/ui/panel-tip.ts` free of
measurement. The cost is that the two claims a width makes are the browser's to answer, so they are
held in `tests/e2e/panel-tip.spec.ts` and nowhere else: that a card of a name and a sentence is
narrower than a card of four figures, and that both stand the same gap from their own window.

One clamp is spent on the bound where it could have been spent on the width: a card flipped to the
right of a window near the screen's right edge is placed as though it were the widest card there is.
It therefore stands a little further left than it had to. It is on the screen, which is what that
line is for, and reaching the case at all needs a window narrow enough to hold neither side.

`width: max-content` and `max-width` join `docs/browser-support.md`. Both are years under the floor.

## Alternatives

**Count the width in characters, as the height is counted in lines.** It is the shape this tree
already uses, and `NOTE_CHARACTERS_PER_LINE` is the precedent. It was rejected on the measurement
above: a per-character advance is a property of the face the machine resolves, so the figure would
be read off this Linux Chrome and shipped to players running Segoe UI. Counting high enough to be
safe everywhere gives most cards the bound back, which is the bug.

**Measure the drawn card with `getBoundingClientRect` and place from that.** Exact, and one layout
read per hover rather than per frame. Rejected because it widens `PanelElement` — the narrow
interface that lets every claim about the panel be held without a browser — for one number, and
because the pair it replaces is already exact: a pinned edge needs no width at all.

**Leave it.** The card was legible and nothing was cut. Rejected because the second window's card
covered the rows underneath the row being pointed at, which is what the reader opened it to see —
the same complaint **ADR 0090** was written for, at a smaller scale and from the other direction.
