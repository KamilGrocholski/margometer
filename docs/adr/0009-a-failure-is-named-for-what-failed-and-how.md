# 0009. A failure is named for what failed and how

- **Status:** Accepted
- **Date:** 2026-09-26

## Context

ADR 0008 made every failure a class extending `Error`, and left two questions open: whether
`attempt` is the right name for the one broad catch, and whether a failure class ends in `Error`, as
`TypeError` in JavaScript and `PathError` in Go do. Read on 2026-09-26, `FAILURE_FATES` keyed 37
classes. Most were a subject and its state (`EngineAbsent`, `StoreRefused`, `PayloadsExceeded`). A
union of them was `…Failure` (`StoreFailure`, `EngineFailure`), and every class of `tools/` ended in
`…Error`, one per tool, thrown (E13). Six read as something other than a failure:
`DetachForeignLayer` as a function, `MarkUnknown` as an imperative, `AnotherReader` as a domain
type, `NoFightOnScreen` with its negation in front (N15), `JsonNothing` naming no subject's state,
and `RefusedAfterRotation` with no subject.

## Decision

Decided with the maintainer on 2026-09-26.

**A failure class is a subject and its state (N20), and never ends in `Error`.** `CONTEXT.md` calls
the concept a failure and keeps "error" out of what a player reads; `Error` is the mechanism that
gives it a `cause` and a stack, and `extends Error` already says so (N9, N11). The suffix stays
where it means something else: `…Failure` is a family, `…Error` a tool's thrown class.

**The six are renamed:** `DetachForeignLayer` to `WrapCovered`, `MarkUnknown` to `MarkValueUnknown`,
`AnotherReader` to `EngineAlreadyWrapped`, `NoFightOnScreen` to `StandingFightAbsent`, `JsonNothing`
to `JsonTextAbsent`, `RefusedAfterRotation` to `RotationRefused`. `UnreadMessage` stays: it is the
message `CONTEXT.md` calls unread, and its state. `Caught` stays: its subject is whatever was
thrown.

**`attempt` keeps its name, and joins N2's table.** Lodash's `_.attempt(func)` does the same thing:
it calls, and answers the result or the error caught. Read as `errors.attempt(…)`, it pairs with
`Caught`.

## Consequences

A name crosses into the console and the e2e suite's allowed lines (`tests/e2e/panel-boot.spec.ts`),
so the rename changes what a console states for these six. No stored key and nothing of the file
format carries a failure's `name`.

## Rejected

- **`…Error` on every failure of the bundle.** It names the mechanism, not the thing, and would make
  a class and a tool's exception read alike.
- **`catch` for `attempt`.** A reserved word, which could be exported only under an alias.
- **`guard` or `callGuarded`.** "Guard" already means a leaving `if` (S14), a callback's handover
  (E10) and a test of the register.
- **`tryCall`** carries a keyword in the name; **`catchThrown`** names the mechanism.
- **A guard for N20.** The states a failure can be in are an open list; the rule is `by-reading`.
