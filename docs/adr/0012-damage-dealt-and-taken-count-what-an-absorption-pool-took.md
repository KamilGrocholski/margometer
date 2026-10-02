# 0012. Damage dealt and taken count what an absorption pool took

- **Status:** Accepted
- **Date:** 2026-09-27

## Context

`Zadane` and `Otrzymane` drew `applied`: the health a blow took off, which
`tests/core/health-witness.test.ts` holds to the percentages the protocol restates. Absorption,
magical absorption and a block all stood outside it, under `Zatrzymane` on the card of the combatant
struck, as what a defence stopped.

The game's published help does not describe absorption as a chance on each blow. Article view,372,
in the dump fetched 2026-09-27, draws it from a pool the character begins the fight with, lowers the
pool by what it stops, and caps any renewal at that starting pool. A block is described as a chance.
So a point absorption stopped was spent on the target the way a point of health is. It went into
something the target had and has no longer.

Measured on 2026-09-27 over the 35 recordings of `captures/`, through `tools/recorded-material.ts`:

- 1,472,310 points were absorbed. 1,456,326 of them sat on the side the reader was not on, nearly
  all of it Hildur. Across the eleven Hildur recordings, Hildur's absorption took 22.7% to 46.6% of
  the health and absorption Hildur lost.
- Against Hildur, the share of one reader-side dealer's damage that went into a pool ran from 0% to
  85.3%. Counting it reorders the reader's side in 10 of those 11 recordings.
- All 946 absorption figures ride a blow naming both ends, and 703 ride an announcement. A pool's
  figure is one number per pool, and 601 of them ride a blow landing in two elements or more.
  `absorbm` beside cold and lightning alone is 103 of them.

## Decision

Decided with the maintainer on 2026-09-27.

**What a combatant dealt and took is the health a blow took off plus what it drained from an
absorption pool, at both ends and in every cut the panel draws.** `damageDealt` and `damageTaken`
are the figures `Zadane` and `Otrzymane` draw. The cuts by the other end, by skill, without a skill,
to and from nobody, and the hardest blow all use the same sum, so every level of the panel adds up
to the figure over it. `damageDealtApplied` and `damageTakenApplied` stay health alone, which is
what the percentages witness. Which defence drains a pool is `src/core/protocol-key.ts`'s table.

**A pool is a kind of its own in the cut by kind, beside the elements.** Its part of a blow is never
shared out among the blow's elements, because the protocol does not say which element it stopped.
The `…ByElement` cuts are renamed `…ByKind` for the same reason: absorption is not an element. The
card draws each pool's part as a line under `Zadane` and `Otrzymane`.

**`Zatrzymane` keeps what drains nothing: a block.** An absorbed point is part of what was taken and
cannot also stand beside it, or the card would count it twice.

**The saved file's report mirrors the figures.** It gains the new fields, the renamed cuts carry
their new names, and cuts that kept their names change meaning, dated by the file's own
`addOnVersion`. `formatVersion` stays 4: the version covers the calls, and intake drops the report.

Rejected: **health only.** It keeps every figure equal to `develop`'s, but it ranks a dealer by who
reached the pool first and by which pool their element fed. Against Hildur that decides the order
more often than not.

Rejected: **counting a block as well.** A block takes nothing from the target, so a point it stopped
was spent on nothing. Counting it would reward swinging into a shield.

Rejected: **sharing a pool's part among the blow's elements, in proportion.** That would put under
an element a figure the protocol never stated, which is inventing data.

Rejected: **summing health and absorption in the panel.** Every cut would have to arrive in two
halves, and the sum would be recomputed in each of the half-dozen places a figure is drawn, in a
layer that may not assert (**A11**).

Rejected: **freezing the report at `develop`'s meanings, or renaming every field that changed
meaning.** Freezing needs a health-only copy of every cut that nothing but the file reads. Renaming
moves some sixteen fields through the panel, the tools and the tests to guard a report that intake
discards.

## Consequences

- **The figures depart from `develop`'s on purpose** (`docs/design.md` §12). On 2026-09-27,
  `deno task fight:develop` agrees on 10 recordings and differs on the 25 where a pool took part of
  a blow with its dealer named. The differences are only these:
  - the prevented column, whose total fell by exactly the 1,472,310 absorbed;
  - the cut lines by kind and by the other end;
  - the hardest blow, which grew on 71 lines and fell on none;
  - two new lines of what was absorbed.

  Every other column of every row is `develop`'s.
- Six counts the tests held over the recordings moved:
  - the kind rows drawn, by 189, which is the number of pools per combatant and end read off the
    events;
  - the levels walked;
  - the share columns;
  - the place of the closing row;
  - the pair recording `tests/ui/panel-content.test.ts` reads both shapes of pair from.

  Each count returned to its old value with both pools read as a chance. That shows absorption, and
  nothing else, moved them.
- A player sees a different ranking wherever a pool stood, which is a **Zmiana** in the changelog.
- `+absorb` and `+absorbm`, the pool being refilled, are still read and counted by nothing.
- The Polish notes on damage the game tied to no attacker say who took it, not that health went down
  (`UNNAMED_END_NOTES` and the two `takenWithNoActor` notes in `src/ui/panel-words.ts`), so they
  stay true of a pool on such a blow. No recording holds one yet.
