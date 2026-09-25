# 0003. A module reads top-down, in TigerBeetle's order

- **Status:** Accepted
- **Date:** 2026-09-25

## Context

`AGENTS.md` C1 said "types, then constants, then the exported entry, then its helpers", and no guard
held it. On 2026-09-25, before this change, the new guard found 509 declarations out of place in 42
of the 75 modules of `libs/` and `src/`, and 220 in 43 files of `tests/`. `src/ui/panel-words.ts`
alternated constants and functions from top to bottom, and `src/core/fight-statistics.ts` stood 33
helpers above the functions that call them, or past the next export.

TigerStyle (`docs/TIGER_STYLE.md` in `tigerbeetle/tigerbeetle`, read on 2026-09-25) states the
order: "a file is read top-down, so put important things near the top. The `main` function goes
first", and inside a struct "fields then types then methods". It leaves open what a TypeScript
module has to decide for itself: where a helper goes when a file exports several functions, and
where a vocabulary object stands, being a value and the declaration of a type at once.

## Decision

Decided with the maintainer on 2026-09-25.

**A module is imports, types, constants, then functions.** The entry comes first among the
functions. That is left to reading, because no machine knows which export a file is for.

- **A constant a type is derived from stands with the types.** A vocabulary (`AGENTS.md` N18) is the
  common case: `SHELF_FAILURE` stands beside `ShelfFailure`, not among the bounds.
- **A function the module does not export stands under the first function that calls it, and before
  the next exported one.** A helper is read after its caller and inside its caller's run, as
  TigerBeetle's top-down reading has it. A helper shared by two exports stands in the first one's
  run.
- **In a test file each `Deno.test` case opens a run, as an export does.** The cases are what the
  file is for, so a helper is read after the first case that uses it.

`tests/repository/declaration-order.test.ts` holds it. It reads each module's top-level statements
from the parser, and counts a name mentioned inside a function as a call, a callback handed on
included. A helper called only from a constant's initializer has no caller to stand under, and the
guard leaves it where it is.

## Consequences

- The tree was reordered in one change by a script that never edits a declaration, only moves it.
  Within a section, types and constants keep their relative order, and so do exported functions and
  cases. Helpers follow their callers depth first, in the order each caller first names them.
- A moved constant could have met the temporal dead zone if its initializer read a later one. The
  relative order of constants is kept, so none did. The suite, 1,024 tests, is green on the moved
  tree.
- One comment that had lost its declaration in an earlier move (`OutcomeResult`'s, in
  `src/ui/panel-reading.ts`) was found by the move and deleted, because `src/core/battle-event.ts`
  documents the vocabulary where it stands.

## Rejected

**Helpers all at the end, after every export.** It is the simpler rule to hold, and the one C1 read
as before. It lost because a reader then jumps from an export to the bottom of the file and back,
which is the reading TigerBeetle's order exists to avoid.

**A vocabulary among the constants, apart from its type.** It keeps "constants" meaning every
`const`. It lost because the type is then read above the object it is derived from, and a pair that
means one thing is split across two sections.
