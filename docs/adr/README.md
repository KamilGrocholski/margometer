# Architecture decision records

An ADR records a decision that is **costly or surprising to reverse**. Everything else lives in the
commit that made it — an append-only list of lessons with no consumer is the artefact this project
deleted 14,000 lines of.

Three questions decide whether something needs one:

1. Would undoing it touch many files, the published contract, or the reader's installed copy?
2. Would somebody arriving later be surprised that it was decided this way?
3. Was there a real trade-off, with an alternative that could have been chosen?

All three, or it is a commit message.

## Format

One file, `NNNN-short-title.md`, four digits, sequential, never renumbered. Headings, in order:

```
# NNNN. Title

- **Status:** Proposed | Accepted | Superseded by NNNN | Deprecated
- **Date:** YYYY-MM-DD

## Context
What was true that forced a choice. Facts and measurements, not intentions.

## Decision
What was decided, in the present tense, as a rule.

## Consequences
What this makes easy, what it makes hard, and what it obliges somebody to do later.

## Alternatives
What else was on the table and why it lost.
```

## Lifecycle

- **Proposed** — written down, not yet binding.
- **Accepted** — binding. The rules it implies are in `AGENTS.md` or the relevant document.
- **Superseded by NNNN** — a later ADR replaced it. The file stays; history is not edited.
- **Deprecated** — no longer binding and nothing replaced it.

A status change is its own commit, and the ADR says which one superseded it. Never delete an ADR and
never renumber one: a decision that was wrong is more useful visible than gone.

**An ADR restates the rule it decided, and that is not duplication.** It is a dated snapshot: it
must stay readable on its own years later, and it must keep saying what was decided **then**, even
after the rule moves. When the rule changes, a new ADR supersedes this one — the old text is never
edited to agree with the new rule.

## Index

- [0001](0001-deno-instead-of-bun.md) — Deno instead of Bun. **Accepted**
- [0002](0002-assertions-live-in-the-shipped-build.md) — Assertions live in the shipped build, and a
  boundary turns a failure into state. **Accepted**
- [0003](0003-captures-at-the-repository-root.md) — Captured fights live at the repository root.
  **Accepted**
- [0004](0004-a-subclass-per-catch-not-per-module.md) — An error subclass exists per `catch`, not
  per module. **Superseded by 0009**
- [0005](0005-a-ceiling-on-comment.md) — A ceiling on comment, and three rules that give it shape.
  **Accepted**
- [0006](0006-no-regular-expressions.md) — No regular expressions. **Accepted**
- [0007](0007-assertion-density-is-measured-where-the-program-is.md) — Assertion density is measured
  where the program is. **Accepted**
- [0008](0008-the-decoder-produces-a-union-of-event-kinds.md) — The decoder produces a union of
  event kinds. **Accepted**
- [0009](0009-a-class-per-failure-and-no-base-is-thrown.md) — A class per failure, and no base is
  ever thrown. **Accepted**
