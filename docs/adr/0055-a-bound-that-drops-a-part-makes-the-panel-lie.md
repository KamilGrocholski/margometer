# 0055. A bound sums what it will not draw

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

Every section the panel draws carries a bound, because it is drawn and **S11** asks a drawn
collection for a stated maximum. The skills section folds every caster's announcement names into one
list and holds it at `MAXIMUM_SKILLS`; the keys beside it are held at `MAXIMUM_CUT_PARTS`.

A section is also a cut of the figure over it, and it closes against that figure with a remainder
row: `total` less what the rows came to. On the two damage screens that row is worded `Zwykły
cios`
— a plain blow, one the game announced nothing before.

The two met badly. A part the bound would not give a row to was **dropped**, so its figure never
reached the sum the remainder is taken from, so it landed in the remainder — and the panel said the
game had announced nothing about a blow the game had announced. A display bound turned a true claim
into a false one, in the one direction this project exists to prevent: not a figure that is short
and marked, but a figure that is wrong and looks right.

It is unreachable on today's material: 81 announcement names over `captures/`, 2026-08-30, against a
bound of 256. That is headroom rather than safety — the names are the game's and the corpus is 28
fights of one world.

## Decision

**A bound sums what it will not draw into a row of its own, and never drops it.**

The figure of every part past the bound is carried out of the fold, counted as held — because the
game did name it — and drawn as one row worded `pozostałe`, with a sentence on its card saying there
were too many to show each. So the remainder row goes back to meaning what it says, and the column
still comes to the figure over it.

**It stands between the named rows and the one that closes the section**, because it is neither:
what it holds was named, and what the closing row holds was not. It opens onto nothing — a sum of
parts nobody can list is a level of no figure.

## Consequences

Easy: a bound can be chosen for what a section should draw rather than for what it must never reach,
because meeting one now costs a row rather than a wrong sentence.

Paid: `SkillCut` carries a third row and every hand-made one in the tests states it. And the two
writers' bounds moved again — a section is two closing rows wide now, not one, which
`tests/ui/share-bound.test.ts` derives rather than restates.

Obliges: a fold added later has to answer this question too. The three that exist —
`composeSkillRowsReceived`, `composeSourceRows` and `getGivenSourceCut` — hand back what they could
not fit; a fourth that drops instead puts the panel back where it was.

Not done here: the kind cut's own bound (`addFoldedCut`) drops the same way, and its remainder row
reads `Bez podanego typu`. The keys there are elements — seventeen of them across the corpus,
against a bound of 64 — so the fold has never been near it and the shape of the fix is the one above
when it is.

## Alternatives

- **Raise the bounds until nothing is ever dropped.** `core/` bounds one combatant's names at 256
  and a fight at twenty combatants, so a bound of 5120 would be unreachable by construction — and a
  section that may draw 5120 rows is not a section, and the shares and the cards would have to be
  bounded to match.
- **Keep the biggest rather than the first encountered.** It is the better choice of which to draw
  and the card's own run of kinds already makes it. It is not this decision: sorting the fold before
  bounding it changes which rows a reader sees, and dropping without a row would still lie.
- **Count the dropped figure as held and draw no row for it.** The remainder would be honest and the
  column would come to less than a hundred, which is the failure `tests/ui/share-column.test.ts`
  exists to catch.
- **Let each fold keep its own rest and draw its own row.** Two bounds sit on the path from a
  giver's keys to the section that draws them, so a reader would meet two rows saying the same thing
  about one figure. The rest travels to whoever draws the section instead.
