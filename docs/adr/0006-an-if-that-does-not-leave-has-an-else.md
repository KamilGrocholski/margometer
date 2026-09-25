# 0006. An `if` that does not leave has an `else`

- **Status:** Accepted
- **Date:** 2026-09-25

## Context

TigerStyle (`TIGER_STYLE.md` in `tigerbeetle/tigerbeetle`, read on 2026-09-25) says, beside
splitting compound conditions: "consider whether a single if does also need a matching else branch,
to ensure that the positive and negative spaces are handled or asserted." `AGENTS.md` carried the
split (S12) and the asserting of both spaces in general (A2), but nothing about the `else`.

Read from the parser on 2026-09-25, over `libs/`, `src/`, `tools/` and `frozen/`:

- 1234 guards, meaning an `if` whose body ends by leaving;
- 273 other `if` with no `else`. That counts the closing `if` of an `else if` chain, and includes 15
  that only asserted.

## Decision

Decided with the maintainer on 2026-09-25.

**An `if` that does not leave has an `else`, and a guard is exempt.** The rest of the body is a
guard's `else`, and TigerBeetle writes its guards the same way. **S14** gives the forms the `else`
takes: the case it did not take, handled or asserted; a value set before the `if` for that case; and
a second `if` over the negated condition.

**An `if` stands alone where its negative space is empty.** This covers two cases:

- **nothing happens there**, as in `if (name.length > 0) found.push(name)`;
- **nothing holds there but the negation of the condition itself.** An `else assert` restating it is
  one **A12** calls none, and in the layer a reader touches **A11** forbids any.

Whether a space is empty is a judgement, so the rule is `by-reading`.

The scope is S1's and S5's: the program and its tools, not `tests/`.

## Consequences

All 273 sites were read. Ten changed, and the rest have an empty negative space:

- **Asserted where the `if` had hidden an impossibility.** The `if` gave way to an assertion,
  because its negative case cannot happen: in `src/core/combatant-health.ts`, a health read off a
  percentage always has a pool, and a sized cast always has a caster's side.
- **An `else` assertion saying what the compiler does not know.** In `src/runtime/fight-reading.ts`,
  only an empty shelf names no newest fight.
- **A value set before the `if` moved into the `else`.** This happened in
  `src/core/fight-decoder.ts` (`getTokenFromKey`), `src/core/fight-session.ts` (`hasClosed`),
  `src/core/turn-clock.ts` (`isStriking`) and `src/game/fight-capture.ts` (`isKept`).
- **Two `if` over a condition and its negation merged into one `if` and its `else`.** This happened
  twice in `src/core/fight-statistics.ts` (damage taken from nobody or from an opponent) and once in
  `src/ui/ranked-order.ts`.

Kind dispatch written as sibling `if` over one vocabulary (`addUnreadMessage`, `addFightOutcome`)
stays as it is. Folding it into `else if` would let a bare closing `else` absorb a word added to the
vocabulary, and the compiler would say nothing.

## Rejected

- **Every `if`, guards included.** That is about 1500 sites, with the rest of each body moved into
  an `else { }`. Nesting would grow by one level per guard, against S4's page. TigerBeetle does not
  do it either.
- **A helper function for every `if` whose negative space is empty, so the `if` inside becomes a
  guard.** That would add about 130 functions. Each adds to S5's denominator, which already stood at
  1.19 against 2.
- **An empty `else {}` carrying a comment.** `deno lint` (`no-empty`) wants the comment, which then
  carries none of C2's four things, and C5 and C16 would count it.
- **A machine guard.** Whether a negative space is empty cannot be computed. A register of the ~260
  sites where it is empty would move with every edit to them.
