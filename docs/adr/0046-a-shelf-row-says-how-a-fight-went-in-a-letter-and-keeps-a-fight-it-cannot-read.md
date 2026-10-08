# 0046. A shelf row says how a fight went in a letter, and keeps a fight it cannot read

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

A shelf row ended in the outcome's word, `wygrana`, `przegrana`, `remis` or `ucieczka`, in
`textQuiet`, the same ink as the time and the headcount. The header over the ranking said the same
word, upper case, in the same ink. Nothing on the shelf said that a kept fight was short of
something, though the ranking under the same fight said it in sentences.

A kept fight whose payloads no longer replayed left the shelf without a trace. `presentShelfRows`
skipped it, and the one mark it left was the `kept` defect under the list. Its pin stayed in the
store, holding a slot the rotation could not take back.

The fight a row opens is chosen without asking whether it reads, so a row for such a fight could not
simply be pressable. The screen a kept fight that will not read stands on is `renderWaiting`'s, and
`WaitingContent` has no shelf. A reader pressed onto it is left there until a reload, or until the
fight drops off the shelf.

Measured on 2026-10-08 off `src/ui/panel-palette.ts`, the relative luminance of `ours` is 0.468 and
that of `theirs` 0.400. The two signal inks differ mostly in hue. To a reader who sees no difference
between red and green, a mark carried by those two inks alone is one mark.

## Decision

Decided with the maintainer on 2026-10-08, over five variants drawn on a design canvas.

**A shelf row ends in the outcome's first letter, W, P, R or U, in the ink of the side that took the
fight.** A win is in `ours` and a loss in `theirs`. A draw and an escape name no side
(`src/core/battle-event.ts`), so they keep `textQuiet`. The ink says which side took the fight, as
it says which side a figure belongs to everywhere else, and so `ours` and `theirs` still say nothing
about which side a reader should be pleased about. The letter stands in a box of the row's own
height, as the pin does at the other end, because W and R are not one width. A fight going on draws
no letter: its time already says `teraz`. The card under a row still says the word, and so does the
header, which is the ranking's and stays in words.

**The header's word takes the same ink.** It stays the word, upper case, so a reader who looks at
one fight sees one colour for it in both places.

**A fight short of something wears the suspect mark before its place, and its card says the
sentences.** They are the sentences under a ranking, without the one only a healing screen carries,
because a shelf row stands on no screen.

**A kept fight that will not read keeps its row, and the row opens nothing.** It states its time,
its place and its pin, and no headcount or ending. Its last cell carries the defect's mark in
`defect`, because what failed is the panel's reading and not the fight. Its card says, in a note in
`defect`, that it will not open or save. The row carries no fight mark, so a press on it asks for
nothing and the reader stays on the shelf.

Rejected: **the word, in the side's ink.** It keeps every rule as it stood, but it spends the width
the place is cut for on every row, to say what a letter says in one character.

Rejected: **a dot in the side's ink, with the word only on the card.** It breaks `DESIGN.md`'s
_Colour Never Alone_. Measured above, `ours` and `theirs` are nearly one lightness, so for a reader
who cannot tell them apart every ended fight is the same dot. A draw and an escape would be two
identical grey dots even for a reader who can.

Rejected: **a stripe on the row's edge.** It cannot carry a shape, so it is colour alone for good.
It stands on the edge `.row.chosen` already marks.

Rejected: **a drawn shape for each ending (▲, ▼, `=`, `»`).** It carries meaning without colour, but
`PanelDocument` builds no SVG element. Every shape the panel draws is a mask or a pseudo-element,
and a letter is text a copy of the row still reads.

Rejected: **keeping a fight that will not read pressable, and giving the waiting screen a shelf.**
That moves a screen to make room for a row that has nothing to show, and the card already says what
pressing would have found.

## Consequences

- `ShelfRow` keeps no field of its own for either state. Its card, `FightCardContent`, carries
  `suspicions` and `isUnread`, and the row reads both from there.
- `composeFightSuspicions` is the fight's sentences without the healing one, and the ranking's
  `composeSuspicions` adds that one to it.
- `ours` and `theirs` print text now, so the contrast test holds them at the text floor, over
  `track` and `surface`, rather than at the graphical floor it held the sides bar's fills to.
- A card's note gains a `defect` tone.
- Open, and the maintainer's call: a kept fight that will not read stays on the shelf until the
  rotation takes it or a reader unpins it. Nothing offers to delete it.
