# 0082. A screen is counted twice, and the difference is drawn

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

The ranking's shares came to a hundred on every screen, every seat and every rung of every
recording, and `tests/ui/share-column.test.ts` held them there over 44,337 columns. **The guard was
true and the claim under it was not the one a reader takes from it.**

`composePanelReading` divided each row by a whole it summed out of those same rows — the listed
figures plus the pinned figures standing apart. A whole derived from the numerators cannot fail to
cover them. So the column came to a hundred whatever had fallen out on the way to it: a row a bound
cut, a person the roster refused, a figure the statistics held that nothing drew. The reader adds
the column, gets a hundred, and has no way to learn that the hundred is a hundred of what survived.

Two things found while looking, both of them figures the decoder read and nothing counted:

- `addHealthChangeEvent` returned on a movement naming nobody unless it was a loss. A positive one —
  health the protocol says came back, to nobody it named — reached no total at all.
- `addNamedHealingEvent` returned on a name the roster could not place, dropping the whole event.

Neither was unread, neither was suspect, neither was on a row. They were **not there**, which is the
one state this repository has no vocabulary for and no way to notice: `getAppliedBalance` and
`getRestoredBalance` both balanced, because a figure absent from both sides of an equation balances
it perfectly.

`captures/` carries none of either, so no measurement over the corpus could have found them and none
did. They were found by reading every `return` in the aggregator.

## Decision

**A screen is counted twice, and the difference is a row.**

The first count is what it was: the rows, plus the pinned figures standing apart. The second is
taken from `FightStatistics` and never looks at a row — the fight's own total for that screen, plus
the one fight-wide bucket that is on nobody's row. Under one side it is the strip's own figure,
which **ADR 0036** already holds the list to.

The difference stands under the list, in a section of its own headed `POZA RANKINGIEM`, and it joins
the hundred: the shares are divided by the second count, so the column a reader adds up is the whole
of what the screen holds rather than the whole of what it managed to draw. Where the rows come to
**more** than the second count the panel says the figures disagree (**ADR 0051**), because that is a
drawn figure being wrong rather than short.

Health the protocol says came back to nobody it named is counted, under the key it came back on, in
`restoredToNobody` — which is the fourth of those buckets and the first that reaches no row.

## Consequences

**The hundred becomes an observation.** A row lost to a bound, a person the roster refused, a bucket
nobody drew: each now moves a figure a reader can see, where each used to move every share on the
screen down by the same fraction and leave nothing behind.

**It is zero on every recording, and that is the point of it.** The section is drawn by a probe and
by nothing in `captures/`, so this decision buys nothing today and is worth what it is worth the
first time the protocol grows something this panel has no row for. A guard that only fires on
material this repository already holds is a guard for a problem already solved.

**The row is outside the register of drill levels.** It opens nothing and no recording draws it, so
`docs/drill-levels.md` earns no row for it — the same standing as the shapes its own last section
names as absent from the corpus.

**One word is now spoken for.** `pozostałe` is the row summing what a bound would not draw (**ADR
0055**, **ADR 0079**) and the section is not allowed to borrow it; `CONTEXT.md` lists it under
_Avoid_ for this concept so the two cannot converge later.

## Alternatives

**Leave the figures uncounted and widen a suspicion instead.** A suspicion says a total may be short
and never by how much, because nothing states one. Here something does state one — two counts of the
same screen, differing by exactly that much — and reporting a number you have as a sentence saying
you have none is the failure this project is against, in the other direction.

**Put the figure on a pinned row.** The three pinned rows are figures the protocol **half**-named:
the game stated one end and the row says which end is missing. This figure names no end, because it
is not one thing — it is whatever stopped reaching a row. Charging it to the pinned vocabulary would
collapse a claim about the game into a claim about the panel, which `CONTEXT.md` opens by
forbidding.

**Assert the two counts are equal, as the panel used to.** That is what **ADR 0051** took out of
this layer, and for this exact hazard: an assertion here stops the panel at the moment a reader most
needs it, and a fight in front of a player is the worst possible place to be right about arithmetic.
