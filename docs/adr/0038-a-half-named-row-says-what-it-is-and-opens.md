# 0038. A half-named row says what it is, and opens onto the end the game did name

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

`Nieznany sprawca` and `Nieznany cel` stand under the ranking with a figure and a share, and say
nothing else. Hovering one opens the two lines `composeRowTipReading` gives every row with nobody
behind it: what the figure is a figure of, and its share of the screen. Pressing one does nothing.

Two questions go unanswered, and one of them is a trap. **The first is what the game left out**,
which a reader can guess from the label. **The second is whether the figure is already inside the
list above it**, which they cannot: `PinnedStanding` says `apart` on `Zadane` and `Leczenie dane`
and `cut` on `Otrzymane` and `Leczenie otrzymane`, and a bar looks the same either way. A reader
adding the `Otrzymane` row to the rows over it double-counts every point of it — 607,970 over
`captures/`, read 2026-08-31 (**ADR 0036**).

`0.10.1` answered both, in a card that also said what a chosen side narrowed the figure to. The
rewrite dropped all three sentences and the level under the row, and `CHANGELOG.md` announced the
loss under `0.11.0`.

**The level was never missing from the statistics.** `getHalfNamedBalance` in
`src/core/fight-statistics.ts` asserts, in the shipped build, that

```
dealtByNobody = Σ damageTakenFromNobody + byNeitherEnd
takenByNobody = Σ damageDealtToNobody   + byNeitherEnd
givenByNobody = Σ healthRestoredByNobody
```

so the end the game **did** name is kept per combatant, and the panel already walks those three
fields to size the pinned rows. **ADR 0034** says a row opens wherever the statistics keep a cut
under it. This one has kept one all along.

## Decision

**A half-named row states what the game left out, and opens onto the end it did name.**

- Three sentences on the card: what was not said, where the figure stands against the ranking, and —
  only where a side is showing — what the shown team is to it. The third is asked only then, because
  under `Wszyscy` there is no scope to state.
- The rows inside an opened figure and under an opened part get the **first** sentence and no other.
  The second is about the ranking and the third about a side, and neither level has one.
- Pressing a pinned row opens `KOMU` where the actor was left out and `OD KOGO` where the target
  was, person by person, ranked like every other list. Nothing on that level opens.
- What named **neither** end closes the section as `Nie do przypisania`, under `Wszyscy` and beside
  a figure standing `apart` — the two places it is inside the figure over it.
- **No name is derived, on any level.** The row goes on saying only which end the game left out, and
  the level shows only the end it stated. **ADR 0013** and **ADR 0036**'s bound is untouched.
- The pinned figure and the level under it are **one walk**. `getPinnedApart` and
  `getHalfNamedTotal` are gone; `composeHalfNamedParts` returns the people, and the row's figure is
  their sum plus what named neither end.

## Consequences

- The pinned rows open onto 90 person rows over `captures/`, 45 on each damage screen, measured
  2026-09-01. The healing screens pin nothing over this corpus, so their three cases are held by
  fights built in `tests/ui/panel-reading.test.ts` rather than by material.
- **A predicate can no longer disagree with the composer**, which is ADR 0034's own lesson spent
  again. The row's figure is asserted equal to the fight's own count under `Wszyscy` —
  `assertPinnedTotalsTheFight` — and that assertion is what proves the level totals the row.
- `PINNED_SHAPES` replaces five `if`s over `metric` with one table over a five-name union, so a
  screen cannot acquire an end it states no figure for, and every table of sentences is keyed by the
  case rather than by a screen-and-end pair with three unreachable cells.
- A ranking screen now carries two kinds of mark. `data-unnamed` names an end rather than a
  combatant, because nobody stands behind the row to be named by an id — and
  `tests/tools/drill-report.test.ts` holds the cursor to both.
- `docs/drill-levels.md` gains a fifth view and moves `half-named` at `ranking` from `never` to
  `always`. The panel is still three levels deep: `unnamed` sits on the second, off a branch of its
  own.
- A reader on `Otrzymane` is told the figure is already counted above them. That sentence is the
  whole reason the row was worth opening at all.

## Alternatives

**Say the sentences and leave the row shut.** The cheap half, and it answers the trap. Rejected
because it puts the affordance and the answer in different places for the second time in this tree —
ADR 0034 rejected the same shape for a key row, and the reasoning has not changed: a reader told a
figure is made of something, and given no way to see what, is a reader taught to stop asking.

**Split the row into the separate unknowns behind it.** The level a reader might expect: three
unnamed strikers as three rows. **It cannot be built.** `addAttackEvent` adds an unnamed end to a
scalar and discards the event, so nothing downstream can tell one from another. This is a limit of
the aggregation and would stay one even if the aggregation kept more: the protocol states no
identity to keep.

**Charge `byNeitherEnd` to a side so the level is the same under every choice.** Rejected for the
reason ADR 0013 rejected it: the charge is derived from the end the game named, and this figure has
neither. It stays under `Wszyscy`, where the count it belongs to stands.
