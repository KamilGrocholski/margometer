# 0088. A figure that means narrower says so, and says it once

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

Two things stood on the card at once and only one of them was a reading anybody could stand behind.

**`Największy cios` named a scope the figure does not keep.** `damageDealtBlowLargest` is raised in
`addBlowStruck` and again in `addNamedDamageEvent`, and the second is damage the game states against
a name — already reduced, riding somebody else's swing, and never a blow. **ADR 0087** measured it
standing above the largest actual blow on **15 of the 296 rows** over `captures/` and rejected a
block heading that counted blows for exactly that reason. The line itself went on standing under
`W ciosach zadanych`, which is the same claim in a heading instead of a label, and `CONTEXT.md` said
the opposite in so many words: _the hardest blow is one of them_. That was a **V6** disagreement
between a document and the code, left open on 2026-09-14 by `c9bc0e3` because settling it changes
what the figure means.

**And the figure was not alone in meaning narrower than it says.** `Zatrzymane` is one component of
the reduction and never the whole (`CONTEXT.md`); `Tury wykonane` counts what was spent, and the
game numbers what was granted (`docs/turns-taken.md`). Each has a document and an ADR. None had a
sentence on screen. The one figure that did — the figure before reduction — carried its sentence
through a condition of its own (`getIsRawStated`), which is one mechanism for one figure and no
answer for the next.

Measured over `captures/` on 2026-09-14 with `deno task panel:cards`, over the 1,184 cards the
corpus composes:

- removing the hardest figure takes a line off **every** card, two off **1,032**, and a whole run
  **with its heading** off **660** — on those, that run held nothing else;
- the card's height falls from a median of 25 lines to 22 and from 31 at its tallest to 29.

## Decision

**`Największy cios` and `Największy przyjęty cios` leave the panel. The figures stay in the
aggregate.** A caveat repairs a figure that says less than a reader thinks; it does not repair a
label that names the wrong thing. `damageDealtBlowLargest` and `damageTakenBlowLargest` go on being
counted, handed over in the fight file and printed by `deno task fight:figures`, where the reader
has the other figures beside them and the type's own docblock within reach.

**A figure whose label names more than the figure counts wears a mark of its own, and its sentence
stands once at the foot of the card.** This is the **fourth severity**, granted here against the
`[ASK]` `ARCHITECTURE.md` held: `suspect` says a figure may be short because something in _this_
fight could not be read, and a caveat says the figure is complete and answers a narrower question
whatever was recorded. One glyph over both would make the permanent look temporary and the temporary
look permanent, which is the collapse `CONTEXT.md` opens its own section by refusing.

**A caveat is owed where the narrowing is already written down as a property of what the game
reports — not of our reading — and where no neighbouring line answers it.** Two qualify:
`reduction`, for the figure stated before reduction and for what a defence stopped, and `turns`.

**The sentences are composed from the marks.** `composeCardCaveatLines` reads the lines the card has
already built, so a glyph pointing at a sentence the card did not draw, or a sentence no glyph
points at, is not something this panel can express.

**The mark stands before the value, on a stated figure and never on a sub-line under one, and it
rides no row of the list.** The value column is right-aligned in tabular figures; a glyph behind it
offsets the lines that have one against the lines that do not. A sub-line is read through the line
above it. And a row has one cell allowed to shorten, which holds a name (**ADR 0023**).

## Consequences

- The card's median height goes from 25 lines to **24** and its tallest stays at **31** — the two
  figures out and the second sentence in, netting a line. Notes per card go from a median of 2 to 3.
- `CARD_WORDS.damageNote` stops existing as its own entry; its sentence and the history of its two
  earlier wordings move to `CAVEAT_NOTES.reduction`. There is one way for a card to owe a sentence
  about a figure, not two.
- `CONTEXT.md`'s **Blow** entry is corrected rather than quietly trimmed: it now says the hardest
  figure is **not** one of the blows and that the panel states it nowhere. That closes the **V6**
  disagreement by making the document true of the code.
- **A guard that had been green on a claim its own name made is fixed.**
  `tests/ui/blow-vocabulary.test.ts` is called _no label a card draws is longer than the column it
  is drawn in_ and walked `PROC_WORDS`, `DEFENCE_WORDS` and `DESTROYED_WORDS` — not `CARD_WORDS`. So
  `Największy przyjęty cios`, at 24 characters against a bound of 22, was cut by the sheet on every
  card that drew it while the docblock over `MAXIMUM_LABEL_CHARACTERS` said every word in the module
  was inside the bound. The walk now covers the table, and which entries are labels in the cut
  column and which are sentences that wrap is a register held both ways.
- **What the glyph costs the label column is held in pixels, not characters.** A character count
  cannot see a cell beside the one it is counting, and the arithmetic said `Podane przed redukcją`
  at 21 characters had 20 left once the glyph was allowed for. In Chrome it is not cut:
  `tests/e2e/panel-tip.spec.ts` compares every card label's drawn width against the width it is
  given, and the check was proved to bite by lengthening that label until it was cut.
- `deno task panel:cards` exists, and the numbers **ADR 0087** stated by hand — 1,184 cards, a
  median of 25, a tallest of 31 — are reproducible by a command for the first time (**V5**).

## Alternatives

**Keep the hardest figure and give it a caveat.** Consistent with the rule this ADR writes, and
rejected: the sentence would have to say the figure is not what its own label calls it, under a
heading that says so too. A caveat narrows a true name; it cannot rescue a false one.

**Keep it under a different name** — _Największe pojedyncze trafienie_, and out of the two blow
headings. Rejected on cost against worth: it needs a fourth block on a card whose height was the
thing being paid down, to state a figure no reader has asked for, and the corpus says 660 of the
1,184 cards would carry that block for this figure alone.

**Narrow the figure to blows** by dropping the two `getLargerBlow` calls in `addNamedDamageEvent`.
The name becomes true. Rejected on the measurement already in `fight-statistics.ts`: for a party
fought by one boss with an area attack, damage stated against a name is the **only** landing anybody
records — 149 of the 249 rows that took damage over `captures/` are named by nothing else — so the
figure would go blank on most of the rows that have one.

**One glyph for both claims.** Cheapest by a wide margin and refused by `CONTEXT.md`'s own opening
sentence. A mutation setting the caveat's glyph to the suspect's turns three tests red.

**A `TipClaim` union on both the stat line and the note**, with the glyph chosen from one table.
Considered and dropped: it makes a stat line carrying a _suspicion_ representable while nothing
composes one, and it moves the suspect glyph — which today is part of the note's own text, and
therefore already counted in what that note costs the card's height — into a second mechanism. The
mark a note wears goes on being part of its text, so a caveat sentence costs its lines the same way
a suspicion's does and there is no cost to forget.

**A separate screen listing what every figure means.** Rejected: it is a feature, and the direction
since 2026-08-03 is the quality of what is already drawn. It also puts the explanation one press
away from the figure, which is the opposite of what `DESIGN.md` asks of a mark.
