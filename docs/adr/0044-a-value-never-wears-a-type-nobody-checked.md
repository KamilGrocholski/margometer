# 0044. A value never wears a type nobody checked

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

The proposal was the common one: avoid unsafe type assertions, because they perform no check at run
time, and reach for a type guard instead. Its worked example is a browser one —
`document.getElementById("myId") as HTMLInputElement`, then reading `.value` off something that may
not be an input.

**That example cannot happen here, and the reason is worth stating before the rule is.** `src/ui/`
never touches a real DOM: it is handed `PanelDocument` and `PanelElement`, structural interfaces
narrow enough to state exactly what the panel asks for, and `src/userscript-entry.ts` declares its
own `DownloadAnchor` rather than asking for `HTMLAnchorElement`. The real `window` enters the typed
world at one line, `src/userscript-boot.ts`.

Measured over `2211278` on 2026-09-01, across the 56 TypeScript files in `libs/`, `project/`, `src/`
and `tools/`: 35 spellings of `as const`, one `satisfies`, no old-style `<X>expr` cast, no cast off
`JSON.parse` — whose only owned spelling answers `unknown` in `libs/json-text.ts` — and no `!` in
`src/` or `tools/`, which is **C12** holding. The narrowing idiom is already uniform: `isRecord` and
the three `getXFromUnknown` readings in `libs/unknown-reading.ts`, the `is…` predicates, and the
`require…` functions **N2** already defines as "a value narrowed to a type, or throws".

So the rule is a codification rather than a clean-up — with one thing the codification found. **A
survey by reading counted two assertions in the shipped tree. The guard written for this counted
three.** The third is `src/game/game-dictionary.ts`, calling the client's own translate function. It
is the same crossing as `src/game/engine-battle-wrap.ts`: `typeof value === "function"` narrows to
`Function`, which answers `any` to a call, so a signature is named by assertion because a call
nobody typed is worse than the assertion that types it.

**C13** already owned the neighbouring case — never cast off `JSON.parse` — and a general rule
beside it would be two rules where one implies the other, which `AGENTS.md` calls worse than a
restatement word for word, because the two drift without ever looking different.

## Decision

**C13 widens in place to own the subject, keeping `JSON.parse` as the case that keeps escaping.** A
value is narrowed by a guard — `isRecord` and the readings in `libs/unknown-reading.ts`, a
`value is X` predicate, an `instanceof`, or a `require…` under **N2**. `as const` and `satisfies`
are not assertions: they check a literal against a type rather than overriding one. Tests keep the
cast, as they keep `!` under **C12**, because a test double is a type the program does not have.

**The three crossings that have no narrowing to offer are a register, read both ways.** Nothing
outside it asserts a type, and every file in it still does — a register naming a crossing that has
since stopped asserting is a finding of its own, the same shape the construct register has.

## Consequences

- **A fourth assertion costs a conversation.** It fails the gate until the register admits it, which
  is the effect asked for: the two that existed were each already worth a comment, and the third was
  found only because a machine counted.
- **The reason for each crossing is kept in one place**, the register's own docblock, rather than
  beside each of the three files. Two of them would otherwise carry the same explanation of what
  `typeof` cannot say about a function, and `tests/repository/sources.test.ts` reads a comment block
  standing in two files as one fact with two copies (**C15**).
- **`tests/repository/type-assertions.test.ts` is a guard of its own** rather than another test in
  `sources.test.ts`, whose row in the register cannot take another rule without pushing the table
  past the hundred columns `documents.test.ts` holds every document to. That the row had run out is
  a fair signal about how much that file now holds.
- **Nothing in the tree changed.** The rule is stated over a tree that already keeps it, which **ADR
  0042** warns is the case where a guard must be proved on a sample it must flag. This one is proved
  on six samples and on the tree, both ways: an assertion added to `src/core/game-build.ts` and a
  register entry whose file stopped asserting each lit the half that covers it.

## Alternatives

**A new C18 beside C13.** Rejected: **C13** is entirely implied by it, and two rules where one
implies the other is the duplication `AGENTS.md` names as worse than repeating one word for word.

**A new C18, with C13 deleted and C14–C17 renumbered.** Rejected on cost: `documents.test.ts` holds
rule numbering to no gaps, so every reference to those four in the documents, the decision records
and the guards' own failure messages would have to move with them, for a tidier number.

**A justifying comment above each assertion, checked by reading.** Rejected: all three already carry
one, so the rule would light nothing on the day it landed, and `by-reading` is what a rule takes
when no machine can hold it — here one can.

**Banning the assertion outright, with no register.** Rejected: the three crossings are real. A
browser's `Window`, and a value `typeof` says is callable, are places where the type system has
nothing to narrow with, and a rule that forbids what the tree must do is a rule that gets an
exception written into it in the first week.
