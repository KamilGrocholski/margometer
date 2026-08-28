# 0002. Assertions live in the shipped build, and a boundary turns a failure into state

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

Two rules point in opposite directions and both are load-bearing.

**S5** asks for an assertion density averaging two per function, and the assertion rules sharpen it:
assert arguments, return values, pre- and postconditions and invariants; assert the positive space
you expect and the negative space you do not; split compound assertions. The purpose is that an
assertion downgrades a catastrophic correctness bug into a liveness bug.

The one promise this add-on makes is that **an exception of ours never reaches the game's call
stack**. A liveness bug inside somebody else's engine is not a downgrade — it is the worst outcome
available, worse than a wrong number.

Disabling assertions after testing, where the code is performance-critical, was the easy exit: strip
them from the production bundle. That exit is wrong here for a specific reason. The failure this
project most fears is a figure that is quietly short in a reader's browser, which is exactly the
case a development-only assertion never sees.

## Decision

Assertions are **live in the shipped build** and are not stripped for production. Density averages
at least two per function, as **S5** states.

A failure — a failed assertion included — becomes state at the nearest boundary: the affected region
is replaced in place by a marker, and exactly one branded console entry is written, once, not per
render.

**A boundary is a kind of site, not a single site.** There are four, and `AGENTS.md` **E5**
enumerates them, because an unlisted broad catch cannot be told apart from a swallowed bug. The test
is mechanical: a broad catch is legal exactly where its `try` contains a call this project did not
author.

An assertion is not an error class. It carries no `code`, because nobody can act on a broken
invariant, and it sits outside both branded hierarchies.

## Consequences

- A programmer error degrades to a missing panel section. The game sees nothing, the reader sees
  that something is wrong, and the rest of the panel keeps drawing.
- The renderer **must** be structured region by region, so that "the affected section" is a real
  unit. This stops being a stylistic preference and becomes a structural requirement.
- Broad `catch` clauses are correct at that boundary and are bugs anywhere else. Nothing tells the
  two apart mechanically — a `catch` is not where a boundary is visible — so this is read rather
  than checked, which is why it is written here and in `AGENTS.md` rather than in one file's
  docblock.
- Assertions cost something in the hot decode path. That cost is accepted and is measurable by the
  payload-cost tooling; if it ever stops being acceptable, this ADR is superseded rather than
  quietly worked around.

## Alternatives

**Strip assertions in the production build.** Fastest code for the reader, and the exit named above.
Rejected: the worst case — a wrong figure in a reader's browser — is precisely the one nobody would
then observe.

**Assertions only at boundaries, no density rule.** Avoids the `assert(true)` padding that **S5**
itself forbids. Rejected because it makes the rule unmeasurable, and an unmeasurable rule was v1's
most reliable source of drift.
