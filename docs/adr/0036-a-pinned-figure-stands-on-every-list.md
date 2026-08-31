# 0036. A pinned figure stands on every list, charged to the side it is on

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

The panel draws figures the protocol half-named as rows pinned under the ranking —
`Nieznany
sprawca` and `Nieznany cel`. Until this decision they were drawn under `Wszyscy` only:
`composePinnedFigures` returned nothing for either one-side list, on the reasoning that a figure
belonging to nobody belongs to no side either.

The strip above the same list had already answered otherwise. **ADR 0013** charges a half-named
figure to the side derived from the end the game **did** name — damage crosses, healing does not —
and `composePanelSides` spends that rule on every screen, whatever the reader narrowed the list to.
So the two halves of one screen disagreed, and the disagreement was a number:

Measured through `composePanelReading` over `captures/` on 2026-08-31, 28 recordings of which 27
state two sides:

| reading                                | points     |
| -------------------------------------- | ---------- |
| `Zadane`, both one-side lists together | 10,312,458 |
| `Zadane`, both sides on the strip      | 10,920,428 |
| the difference                         | 607,970    |

The difference is the whole of `dealtByNobody`. A reader on `Zadane · My` saw a ranking short of the
strip beside it by every point of damage nobody was named for, with no row saying so. On `Otrzymane`
there was no shortfall — that figure stands as a cut of rows the list already holds — but the
sentence went missing all the same. `takenByNobody`, `givenByNobody` and `byNeitherEnd` are zero
over the corpus, so for those three the question is decided in code rather than in material.

## Decision

**A pinned figure stands on every list, and a one-side list charges it the way the strip does.**

- A figure standing **`apart`** is charged by ADR 0013's rule: `getPartCharged` turns the side of
  the row the game did name into the side the figure belongs to. There is one copy of that rule, and
  both the strip and the ranking read it.
- A figure standing as a **`cut`** is summed over the rows the list is showing, because on those
  screens the listed row **is** the named end. No inference is involved.
- What names **neither** end is charged to nobody and stays under `Wszyscy`, as does a combatant the
  roster cannot place. Both are refusals, not a third side.
- No **name** is derived, on any list. The pinned row goes on saying only which end the game left
  out, which is `ARCHITECTURE.md`'s bound.

The invariant this buys is asserted where it is composed: **a one-side list divides its shares by
the figure the strip states for that side**, pinned rows included.

## Consequences

The gap closes: the same measurement over `captures/` on 2026-08-31 reads 0 on all four screens, and
the total under `Wszyscy` does not move.

**The mirror pays for it, and it is measured rather than argued.** Over all 54 seats of the corpus,
what a side dealt with no striker named — `apart` on `Zadane` — equals what the other side took from
nobody — the `cut` on `Otrzymane` — to the point, at 607,970 together. The two are summed from
different fields of the statistics, so a crossing rule that stopped crossing lights up
`tests/ui/panel-reading.test.ts` rather than quietly moving a figure.

A one-side list now has a part of its hundred that no row holds, exactly as `Wszyscy` does, so the
shares on it are of that side **including** what the protocol left half-named. That is the whole the
strip states, which is the point.

## Alternatives

**Leave it under `Wszyscy` only.** The reading this replaces. It leaves the ranking short of the
strip by 607,970 points over the corpus, silently, on the one view where a reader is looking at
their own side — the failure this project exists to prevent.

**Show only the figures standing as a `cut`.** They need no inference at all, so this is the cheap
half. It restores the sentence on `Otrzymane` and leaves the gap on `Zadane` exactly where it was,
which is the screen the gap is on.

**Charge the figure to whichever side is showing.** The guess ADR 0013 already rejected: the filter
is the reader's choice about what to look at and says nothing about who dealt a blow. The rule kept
here derives the side from the end the game named, and from nothing else.
