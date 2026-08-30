# 0009. A class per failure, and no base is ever thrown

- **Status:** Accepted
- **Date:** 2026-08-28

## Supersedes

[0004](0004-a-subclass-per-catch-not-per-module.md), which had a subclass exist only where a `catch`
named it, and the base thrown with a code everywhere else.

## Context

0004 was decided on v1's numbers: seventeen error classes, three ever caught by type, thirteen of
them in `tools/` with one caught, and `.code` never read anywhere. Those numbers are still true of
v1, and the conclusion drawn from them — that most classes were a naming convention wearing a type
system — was fair.

What the rewrite showed is the cost on the other side, and it is not a matter of taste.

`core/fight-decoder.ts` has to turn a message it cannot parse into an event saying so. Under 0004
the grammar threw the base with a code, so the decoder's catch had to read:

```ts
if (!(failure instanceof MargoMeterError)) throw failure;
```

That catch names **every failure the browser side can raise**, present and future. The first other
kind of failure in `core/` would have been swallowed as a message nobody could read — turned into
data, silently, which is the exact failure mode this project is built to prevent. **E4** asks for a
catch of exactly the error expected, and under 0004 there was nothing narrower to name.

0004 also made the wrong shape the cheap one. Its guard — a subclass no `catch` names is dead — is
satisfied by not declaring the class, so the path of least resistance was the base with a code, and
the broad catch followed from it.

## Decision

**Every kind of failure has a class of its own, and neither base is ever thrown.**

Both bases are **abstract**, so the rule is held by the compiler rather than by reading: a
`new MargoMeterError(…)` no longer type-checks. A subclass passes its own `code` to the base, and
the `code` union stays for what it does — a brand that is unique, greppable and impossible to reuse
silently.

A subclass exists because a failure exists, not because a `catch` exists. What a catch names is then
always narrower than a base, and **E4** becomes enforceable rather than aspirational.

## Consequences

- Every `catch` in the tree can name exactly what it expects. The decoder catches
  `ProtocolMessageFormatError` and lets anything else past, which is what turns a new failure into a
  loud one instead of an unread message.
- More classes than 0004 would have allowed, and that is the accepted cost. The guard against dead
  weight is no longer "somebody catches it" but the union: a code exists only where a failure does,
  and the compiler refuses a second use of one.
- The guard changes with the rule. `tests/repository/errors.test.ts` no longer asks that a subclass
  be named by a catch; it asks that no base be constructed outside its own file, which is the rule
  this ADR states and which the abstract bases already refuse.
- A failure with no obvious catch — most of `tools/` — still gets a class. It costs a declaration
  and buys a name in a stack trace that says which failure it was, not which side of the process it
  came from.

## Alternatives

**Keep 0004.** It is measured, it is recent, and it produced fewer classes. Rejected because its
numbers say what v1's classes _were used for_, not what a base thrown raw _costs_: one broad catch
in the one place a failure has to become data. The count it optimised is cheaper to carry than the
silence it allowed.

**Keep the base concrete and forbid throwing it by a reading guard.** Rejected: the compiler can
hold it outright, and a rule a machine can hold is not left to a reader (`AGENTS.md`).

**Drop `code` now that a class names the failure.** Rejected. The brand in `name` is what a bug
report carries, and the union is what stops two failures sharing a brand — neither is supplied by
the class name alone, because a bundler is free to rename a class and not a string.
