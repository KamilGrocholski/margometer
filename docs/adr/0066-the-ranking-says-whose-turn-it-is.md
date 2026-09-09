# 0066. The ranking says whose turn it is

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

The game numbers turns and names the character holding one. The panel read that already and said it
in one place: the window beside the panel, as a name under `Teraz`. A reader watching the ranking —
which is what the panel is for — had to look somewhere else to see whose turn was being drawn.

`DESIGN.md` refuses a second channel on a ranking row, and ADR 0023 carries why: a mark that stands
on **every** row is paid for out of the names, to say a thing the card already says. That argument
does not reach a mark that stands on one row, and the panel already carries such a mark: the suspect
mark, drawn before the name, on the rows a suspicion actually reaches.

## Decision

**A mark before the name, on the one row the game is numbering, on the ranking only.**

`▸`, in the quiet ink, in the same slot as the suspect mark and able to stand beside it. Off the
ranking there is no mark: a row inside an opened figure is a cut of a number, not a place in a turn
order.

**A fight that is over numbers nobody's turn, and neither does a fight read off the shelf.** Both
are decided at the entry, where whether the fight being drawn is the live one is known, and both
hand the panel `null`.

## Consequences

The mark costs the name on the row wearing it, and on no other. Measured in Chrome on 2026-09-09 at
the panel's own font stack and size: `▸` is 9.03px, against 13.36 for the `⚠` the panel already
draws in that slot and 9.88 for `★`.

The `★`/`☆` measurement in `DESIGN.md` is why this is a single glyph rather than a pair. That pair
walked the row sideways under the hand that had just pressed it, because the two glyphs are not one
width. This mark toggles against **nothing** — it is present or absent — so the row it is on changes
width once per turn and no row ever changes width against a different glyph.

That width change is the cost, and it is accepted: a row's name is the cell designed to shorten, the
change is one row's, and the ranking re-sorts under the reader every payload regardless.

## Alternatives

**A fixed-width slot on every ranking row.** No width change ever, at the price of ~9px off every
name permanently — which is exactly the cost ADR 0023 refused for the profession letter.

**A background tint on the holder's row.** Free of width and quiet, but colour alone, and it
competes with the `chosen` state a row already has.

**The name in bold.** Bold text is wider than plain, so it moves the same width the mark does, while
saying it in a channel typography already spends on hierarchy.

**Leave it to the window beside the panel.** That is the state that was there. The window says it in
words and goes on saying it; what it could not do is say it _on the row a reader is already looking
at_.
