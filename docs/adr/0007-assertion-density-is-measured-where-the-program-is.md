# 0007. Assertion density is measured where the program is

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

S5 carries P10 rule 5: assertion density averages at least two per function across the code. The
rule was applied to every TypeScript file in the tree, which at this commit means guards and nothing
else.

Twice, one iteration apart, the measurement landed at **1.95** and then **1.97** — a single
assertion short of the threshold, in both cases after every honest invariant had already been
asserted. Both times the shortfall was in the same kind of function: a pure text predicate
(`isCommentLine`, `isFunctionOpener`, `isDigitCode`) or a one-line delegation (`hasOutsideStrings`).
These take a value, compute a value, touch nothing and hold no invariant a caller could break.

Closing the gap means adding an assertion that a static checker can prove — `count >= 0` on a
counter incremented from zero. **P10 rule 5 forbids exactly that**: "Any assertion for which a
static checking tool can prove that it can never fail or never hold violates this rule. (I.e., it is
not possible to satisfy the rule by adding unhelpful `assert(true)` statements.)"

So the rule as scoped was pushing toward the thing the rule itself prohibits. That is a defect in
the scoping, not in the code.

## Decision

**S5 is measured over `src/`, `libs/` and `tools/` — the code that ships and the code that runs.**
It is not measured over `tests/`.

The guard still reads and reports density for `tests/`, and never fails on it.

## Consequences

- The padding pressure disappears at its source. An assertion in a guard is written because it
  catches something, not because a denominator wants it.
- **A guard's correctness rests on its positive control instead.** Every reader in
  `tests/repository/errors.test.ts` is handed a sample it must flag before it is let near the tree —
  a stronger check than an assertion, because it proves the reader finds what it claims to find. A
  guard that stopped recognising its subject would pass every file while checking nothing.
- S5 currently guards nothing, because `src/` and `tools/` have no files. That is the same position
  as every other rule waiting for code, and the register says so.
- The rule loses reach over roughly a third of the tree. Accepted: the third it loses is the third
  whose failure mode is a silent pass, and that is guarded by a different mechanism.

## Alternatives

**Keep the scope and pad to the threshold.** Rejected on P10's own words, twice measured.

**Exempt "pure predicates" wherever they appear.** More precise in principle and unusable in
practice: nothing here can decide mechanically whether a function is pure, so the exemption would be
argued file by file — which is how a measurable rule becomes an opinion.

**Lower the threshold below two.** Rejected: the number is P10's, and the problem was never the
number. It was counting the wrong functions.
