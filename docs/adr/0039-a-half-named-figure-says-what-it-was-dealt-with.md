# 0039. A half-named figure says what it was dealt with, from a cut kept for it

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

**ADR 0038** opened the pinned rows onto the end the game **did** name, person by person. A reader
pressing `Nieznany sprawca` learns whose health went, and still does not learn the thing they were
looking at the row to find out: **what it was dealt with.**

The material carries it. Over `captures/` on 2026-09-01 the 609,078 points nobody was named for
striking arrive almost entirely on `health-change` events — health dropping with no striker — and
every one of them states the key it dropped under:

| key       |  points | share |
| --------- | ------: | ----: |
| `poison`  | 543,391 | 89.2% |
| `anguish` |  24,208 |  4.0% |
| `wound`   |  22,957 |  3.8% |
| `heal`    |   8,348 |  1.4% |
| `fire`    |   7,497 |  1.2% |
| `light`   |   2,677 |  0.4% |

The aggregator dropped it. `dealtByNobody` and the three per-combatant figures under it were
scalars, and the key went into `damageTakenByElement` — the flat cut that also holds everything a
**named** striker dealt that combatant. A half-named figure cannot be cut back out of that: the rows
carrying it took damage from named strikers as well, and no arithmetic over the two separates them.

## Decision

**Each half-named figure is kept beside a cut of itself, by the key the protocol stated it under.**
Four cuts, each written on the same line as the count it belongs to:

| beside                   | cut                              |
| ------------------------ | -------------------------------- |
| `damageTakenFromNobody`  | `damageTakenFromNobodyByElement` |
| `damageDealtToNobody`    | `damageDealtToNobodyByElement`   |
| `healthRestoredByNobody` | `healthRestoredByNobodyBySource` |
| `byNeitherEnd`           | `byNeitherEndByElement`          |

- **The cut is written where the count is**, never derived afterwards. A key reaching one and not
  the other is what `getHalfNamedKindBalance` fails on, in the shipped build, beside the three
  balances already asserted there.
- **The panel folds them; it does not compute them.** Which people are folded is the reader's choice
  — a side narrows the fold — and `src/core/` cannot know what they narrowed it to. What `src/core/`
  holds is each person's own cut against each person's own figure, which is what makes the fold
  total the figure over it.
- **The fold is the same walk the figure was summed from.** `composeHalfNamedParts` yields the
  people once, and both sections of the level read that list, so the two cuts under one pinned row
  are two cuts of one number rather than two numbers.
- **No name is derived.** The key is what the protocol wrote, and `docs/protocol-keys.md` owns what
  each one means. Which end the game left out is still the only thing the row says about a person.

## Consequences

A pinned row opens onto two sections: whom the figure reached, and what it was dealt with. On the
richest recording in the corpus its 13,427 points read `poison` 7,195, `fire` 4,104, `wound` 1,700,
`light` 428 — and the same figure, on the same level, as `Amaimon Soploręki` 10,534, `Gracz 2` 1,955
and `Gracz 9` 938. Both come to 13,427, which is the property the balance in `src/core/` buys.

**A pinned row can have no `no kind` row.** Everywhere else a kind cut may fall short of the figure
over it and the panel draws the shortfall; here the assertion above rules the shortfall out, so the
row the code would draw for it can never be drawn. `docs/drill-levels.md` records that under what
the code cannot draw rather than under what the recordings do not carry — it is a decision, not a
gap in the material.

Three of the four cuts are zero across every recording, for the same reason their counts are:
`takenByNobody`, `givenByNobody` and `byNeitherEnd` are. Their shape is held by fights built by
hand, as **ADR 0038**'s cases already are.

`composeElementSection` now takes a cut and its figure rather than an opened row's reading, because
two levels draw it. That is the whole of the change in the drawing: the pinned level's kinds are the
same rows, ranked the same way, worded by the same table.

## Alternatives

**Cut `damageTakenByElement` down by what the named strikers dealt.** It needs a per-striker,
per-key cut on every row and a subtraction across it, and it states the answer as a difference of
two large numbers — where a single missed blow reads as a plausible key rather than as a failure.
The cut kept for the purpose is one addition at the point the key is known.

**Say the dominant key in the row's tip instead.** Cheaper, and it answers the common case: 89.2% of
the corpus is `poison`. It is also the reading that cannot be checked — a share stated with no rows
under it is a figure a reader has to take on faith, and this panel exists so they do not have to.

**Leave it, on the ground that a key is not a name.** The bound **ADR 0013** and **ADR 0036** draw
is around _who_, and it is untouched by _what_: the key is stated by the protocol against the
movement itself, not inferred from an end it left out.
