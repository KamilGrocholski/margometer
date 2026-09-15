# 0090. A card opens beside the window whose row it names

- **Status:** Accepted
- **Date:** 2026-09-15

## Context

Two windows stand under the one root, and both of them draw rows that open a card: the panel, and
the window beside it (**ADR 0086** gave that one's rows their card).

Where each of the three stands was decided twice, by the same arithmetic, against the same anchor.
`composeStandingPosition` puts the second window a gap to the panel's left, and `composeTipLeft` put
the card a gap to the panel's left — the second window's own strip. The card is the wider of the two
and stands over it (**ADR 0068**), so a card opened from a row of that window was drawn across the
window it came from, from the pointer downwards.

Measured on a 1920×1080 viewport at `e3f4262`, with both windows where nobody has moved them: the
panel opens at 807, the window at 555 and runs to 803, and the card was placed at 507 and ran to 803
— **248 pixels of overlap, which is the whole width of the window**. The rows a reader was pointing
at were the rows the card covered.

Nothing said this was wrong. `DESIGN.md` stated the rule against the panel and the panel only, and
the e2e claim that holds the side rule hovers a row of the panel, where the answer is right.

## Decision

**A card opens beside the window whose row it names**, on whichever side of **that** window has room
for it — to the left while there is room, and to the right once the window stands far enough left
that a leftward card would be drawn off the screen.

`DESIGN.md` owns the sentence. The arithmetic takes the window's name, and `WINDOW_WIDTHS` in
`src/ui/panel-drag.ts` is the one place each window's width is read for it.

**The key decides which window**, because the key is what the handle already holds for the card that
is open. The handle is handed `getLeft(key)` and never learns what a key means: which prefix belongs
to which window is `src/ui/panel-element.ts`'s, where the rows are drawn.

**A window reads its own corner and nothing else.** The flip is to the anchor's own right edge, a
gap away, and where the other window is standing is not consulted. The alternative was written and
reverted in this same round: a flip past both windows put **the panel's own card beside the second
window** the moment the panel was dragged left of it — at 487 against a panel ending at 306, out
past the rows it explains and beside a window the reader was not pointing at.

**A card standing over the window it was not opened from stays decided.** The panel's card opens
left and lands on the second window; the second window's card, with no room on its left, flips right
and lands on the panel. Both are **ADR 0068**: a card is the thing a reader pointed at, and the
window is not. What was never decided, and is what this record fixes, is a card covering the rows it
was itself opened from.

## Consequences

**ADR 0068 stands unchanged.** It says who wins where two things overlap; this says not to put them
there in the first place, for a card and its own window. A reader who drags the window onto a card
still sees the card.

A third window would have to name its width in `WINDOW_WIDTHS` and its prefix beside the other's.
Nothing fails loudly if it does not: it would inherit the panel's answer, which is the failure this
record is about, so the guard is a placement claim per window and not a type.

**The claim is made about edges, never centres.** `cc481f2` spent a release on a card that
overlapped by 43 pixels while a test measuring its centre stayed green;
`tests/e2e/panel-standing.spec.ts` asks the same question of the second window the same way, at a
width where the flip is the branch taken, and asks the panel's own card where it went when the panel
was dragged hard left.

The fallback is unchanged: a card whose window states no position is left where the sheet puts it
(**E14**), which is beside the panel. No page a reader is on reaches it — `setPanelDrag` computes an
opening position for both windows from the first frame.

## Alternatives

**Move the second window's default place instead.** It fixes the corner nobody has moved and nothing
else: the window is draggable, so a reader who puts it back beside the panel gets the defect back.
The card is the thing that has to answer where it opens.

**Open the card upward from the pointer.** It was the first reading of the complaint — the card runs
down over the lower rows — but the covering is horizontal. Upward, the card would cover the rows
above instead.

**Give the second window no cards.** They were put there deliberately (**ADR 0086**): the rows open
onto who cast what, and nothing else said so.

**Step past both windows when flipping right.** Written and reverted in this round. It came from a
real measurement — at 1280 a flipped card from the second window stands on 296 of the panel's 306
pixels — and it does prevent that. What it cost was found by using the panel: the rule is symmetric,
so the **panel's** card steps past the second window too, and a panel dragged left of that window
opened its cards beside it rather than beside itself. Placement that reads two corners moves a card
for a reason the reader did nothing to cause, and the covering it prevents is **ADR 0068**'s, which
is decided.
