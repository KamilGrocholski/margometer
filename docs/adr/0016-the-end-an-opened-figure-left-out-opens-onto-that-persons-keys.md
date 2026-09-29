# 0016. The end an opened figure left out opens onto that person's keys

- **Status:** Accepted
- **Date:** 2026-09-29

## Context

Inside an opened row, the `KOMU` or `OD KOGO` cut closes with a row for the end the protocol left
out: `Nieznany sprawca` on `Otrzymane` and `Leczenie otrzymane`, `Nieznany cel` on `Zadane`. The row
was a leaf. `docs/drill-levels.md` gave the reason for all half-named rows inside an opened figure:
the statistics keep no second cut of them. `src/ui/panel-reading.ts` repeated `develop ADR 0038`'s
argument over the pinned level: a pair between somebody and nobody is not a pair.

`develop ADR 0039` removed the premise. Every combatant's part of a half-named figure is kept beside
it, cut by the key it was stated under (`damageTakenFromNobodyByKind`, `damageDealtToNobodyByKind`,
`healthRestoredByNobodyBySource`). The pinned branch reads that cut on its third level, as a person
opened under `Nieznany sprawca`. The same person, opened from the ranking, reached the same figure
and could not press it. `TODO.md` asks for it to open.

The row inside an opened figure is a remainder: the figure less what the named people hold.
`verifyFightStatistics` asserts the half-named balance over the fight, not per person. Over
`captures/` on 2026-09-29, 35 recordings, the row stood in 64 opened figures, every one of them on
`Otrzymane`, and in all 64 the remainder, the person's `damageTakenFromNobody` and the sum of its
keys were the same number. `Zadane` and `Leczenie otrzymane` drew no such row.

## Decision

Decided with the maintainer on 2026-09-29.

**The half-named row inside an opened figure opens onto a third-level view, `unnamed pair`: that
person's own part of the figure, by key.** It is the level a pinned row reaches through the same
person, entered from the other side. It is pressed by `data-unnamed` naming the end, as a pinned row
is, and the way back leads to the person. Nothing on it opens.

**It opens only where the keys kept for it total the row.** The panel layer asserts nothing
(**A11**). A row whose keys fall short of it stays a leaf rather than opening onto a level that does
not add up to the figure over it.

**Healing given stays shut.** Nothing keeps health given to nobody, so there is no cut to open.

Rejected: **send the press to the pinned branch**, onto the `unnamed cut` for that person. It would
reuse the view unchanged, but the way back would land on the pinned level rather than on the person.
On `Zadane` the figure is pinned on another screen, `Otrzymane`, so the press would also change the
screen.

## Consequences

- `ScreenState.openUnnamedEnd` may now stand beside `openRowId`. There it is the rung under the
  person, and it closes before they do. `verifyScreenState` asserts that no pair and no part stands
  beside it.
- `OpponentCut.unnamed` carries `doesOpenPair`. `presentDrill` decides it from the same composer
  that draws the level, `presentOpenedUnnamed`, so the two cannot disagree.
- `docs/drill-levels.md` gains the view. Its register moves `damageTaken · opened · half-named` to
  `always` and adds `unnamed pair · kind · never`. `Zadane` and `Leczenie otrzymane` are held by
  fights built in `tests/ui/panel-reading.test.ts` until a recording carries them.
- The half-named row on a part's level stays shut. It is already on the third level.
