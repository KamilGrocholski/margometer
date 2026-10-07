# 0044. Assertion density is held where it stands, and only rises

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

**S5** asked for at least two assertions per function that takes something, across `libs/`,
`src/core/`, `src/ports/`, `src/runtime/` and `tools/`, closures counted, and no guard counted it.
Measured on 2026-10-07 through `tests/source-tree.ts`, as the rule counts:

| Directory      | Assertions | Functions | Density |
| -------------- | ---------: | --------: | ------: |
| `libs/`        |         72 |        45 |    1.60 |
| `src/core/`    |        294 |       183 |    1.61 |
| `src/ports/`   |         39 |        80 |    0.49 |
| `src/runtime/` |        111 |       160 |    0.69 |
| `tools/`       |        598 |       663 |    0.90 |
| all five       |      1 114 |     1 131 |    0.98 |

`develop` @ `fa1dcce` stood at 2.03, counted without closures. The rewrite returns a failure beside
the value where `develop` asserted (ADR 0008), and **A12** refuses an assertion the compiler already
guarantees. Two per function from here is some 1 150 assertions, most of which **A12** would strike
out again. A rule broken on every count is a wish (`AGENTS.md`, _Authority_).

## Decision

Decided with the maintainer on 2026-10-07, who asked for the proposal to be taken.

**Each of the five directories holds the density it stood at, cut down to a tenth, and a change that
brings one under its floor fails the gate.** A floor is raised when its directory's density has
risen past the next tenth, in the commit that raises it; it is never lowered to pass. The cut to a
tenth is the slack **S5** asked for: deleting an assertion **A12** calls none never reddens the
gate.

**Two per function stops being the bound.** A new function brings what it can state, and the floor
says whether a directory is gaining or losing that, which is what a reader can act on.

Rejected: a round of assertions to two. Some 1 150 of them, most of them restating what the types
hold.

Rejected: one floor over all five. `src/core/` at 1.61 would carry `src/ports/` at 0.49, and a
directory losing its assertions would hide behind one gaining them.

## Consequences

`tests/repository/assertion-density.test.ts` holds **S5**, and joins the guard register.
`src/ports/` and `src/runtime/` stand lowest; raising them is a round of its own.
