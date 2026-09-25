# 0004. The frozen readings are `develop`'s at the revision the recordings are read at

- **Status:** Superseded by ADR 0005
- **Date:** 2026-09-25

## Context

The bundle carries three tables lifted from the game: `frozen/aura-turns.ts`,
`frozen/blows-granted.ts` and `frozen/buff-bits.ts`. Their headers name the tasks that write them,
`game:skills` and `game:buffs`, and this branch has neither. `develop` has them, with the routine
`develop:frozen/AGENTS.md` describes (`game:readings status | refresh`). W10 sends a work round to
that routine until this branch has its own.

This branch is proven by holding its figures to the ones `develop` @ `RECORDINGS_REVISION` draws
(`docs/design.md` §12, W8), and `deno task fight:develop` does that on both reports. Both branches
decode with those tables. `blows-granted` decides how far an announcement reaches, so a table
refreshed here and not there moves the figures on this side alone. The comparison would then show a
difference no code made.

Porting the freezers is 2136 lines across six tools of `develop`'s at `fa1dcce` (client source,
keys, buffs, skills, help, readings), most of them reaching the network. On 2026-09-25 the three
tables here were byte for byte `develop`'s at `fa1dcce`.

## Decision

**The frozen readings of this branch are `develop`'s at `RECORDINGS_REVISION`, byte for byte.**
Refreshing them is `develop`'s routine. A reading moves here only when the revision moves, copied
from `develop` at that revision, and never refreshed on this branch. Decided with the maintainer on
2026-09-25.

`tests/repository/frozen-readings.test.ts` holds it. Every file under `frozen/` must equal
`git show <revision>:<path>`. A file `develop` does not have at the revision is flagged too.

## Consequences

- W10 is met on `develop`. A round that needs readings current refreshes them there, moves
  `RECORDINGS_REVISION` in `tests/recording-revision.ts`, copies the readings, and reruns
  `fight:develop`.
- The headers in `frozen/` name `develop`'s tasks, and stay as `develop` wrote them.
- No freezer is written here until this branch is to stand without `develop` (C9).

## Rejected

**Porting the freezers now.** The branch would stand on its own, but a refresh here would take the
tables away from what `fight:develop` compares against, and the proof would stop meaning what it
says.

**A status-only port.** It asks the game what `develop`'s `game:readings status` already asks, about
tables that are `develop`'s.
