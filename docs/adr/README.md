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
- [0010](0010-sizing-a-share-onto-a-side.md) — Sizing a share onto a side. **Accepted**
- [0011](0011-wording-a-kind-of-damage.md) — Wording a kind of damage, and what carries none.
  **Accepted**
- [0012](0012-the-version-is-written-into-the-bundle.md) — The version is written into the bundle,
  not into the tree. **Accepted**
- [0013](0013-charging-a-half-named-figure-to-a-side.md) — A figure the protocol half-named is
  charged to a side by the end it did name: damage crosses, healing does not. **Accepted**
- [0014](0014-a-region-holding-rows-is-inset-equally.md) — A region holding rows is inset equally,
  and its height carries only rows. **Accepted**
- [0015](0015-a-row-centres-the-ink-a-reader-sees.md) — A row centres the ink a reader sees, and it
  takes the whole panel onto the pixel grid. **Accepted**
- [0016](0016-the-ceiling-became-the-target.md) — The ceiling became the target, so description
  moves to the docblock. **Accepted**
- [0017](0017-the-panel-is-served-and-published.md) — The panel is served while it is edited, and
  published once it is released. **Accepted**
- [0018](0018-a-release-says-what-its-changelog-section-says.md) — A release says what its changelog
  section says, and the version is declared once. **Accepted**
- [0019](0019-the-card-answers-the-screen-it-stands-on.md) — The card answers the screen it stands
  on, and a proc is placed by the register rather than by its sign. **Superseded by 0032**
- [0020](0020-a-shared-address-for-what-knows-nothing.md) — A shared address for what knows nothing
  of this project. **Accepted**
- [0021](0021-a-read-says-whether-it-worked.md) — A read says whether it worked, and the value sits
  behind it. **Accepted**
- [0022](0022-a-tick-belongs-to-the-wound-that-is-ticking.md) — A tick belongs to the wound that is
  ticking, and to the attacker who left it. **Accepted**
- [0023](0023-a-profession-is-said-in-one-channel.md) — A profession is said in one channel, and the
  card is the answer. **Accepted**
- [0024](0024-the-panel-asks-the-client-only-where-it-has-no-word.md) — The panel asks the client
  only where it has no word. **Accepted**
- [0025](0025-a-mark-is-the-answer-its-boundary-gives.md) — A mark is the answer its boundary gives,
  and not every one is a console line. **Accepted**
- [0026](0026-a-kept-fight-is-the-payloads-and-a-figure-is-memoised.md) — A kept fight is the
  payloads, and a figure is memoised rather than stored. **Accepted**
- [0027](0027-the-fight-is-handed-over-in-one-file.md) — The fight is handed over in one file, and
  intake takes the counted figures back off it. **Accepted**
- [0028](0028-a-preview-opens-on-one-finished-fight.md) — A preview opens on one finished fight, and
  the panel's state rides in the address. **Accepted**
- [0029](0029-a-panel-nobody-has-moved-opens-in-the-middle.md) — A panel nobody has moved opens in
  the middle of the window. **Accepted**
- [0030](0030-a-recording-says-who-wrote-it.md) — A recording is spelled in English, and says which
  builds it stands between. **Accepted**
- [0031](0031-the-list-scrolls-without-drawing-a-scrollbar.md) — The list scrolls without drawing a
  scrollbar, and no region reserves a gutter. **Accepted**
- [0032](0032-the-card-says-everything-wherever-a-person-stands.md) — The card says everything,
  wherever a person stands. **Accepted**
- [0033](0033-a-panel-with-no-live-fight-opens-on-the-shelf.md) — A panel with no live fight opens
  on the shelf. **Accepted**
- [0034](0034-every-row-with-a-level-under-it-opens.md) — Every row with a level under it opens, and
  every cut that holds a row is drawn. **Accepted**
- [0035](0035-a-build-with-no-version-named-takes-the-declaration.md) — A build with no version
  named takes the declaration and marks it. **Accepted**
- [0036](0036-a-pinned-figure-stands-on-every-list.md) — A pinned figure stands on every list,
  charged to the side it is on. **Accepted**
- [0037](0037-a-release-run-states-the-number-the-tree-declares.md) — A run that says it is the
  release states the number the tree declares. **Accepted**
- [0038](0038-a-half-named-row-says-what-it-is-and-opens.md) — A half-named row says what it is, and
  opens onto the end the game did name. **Accepted**
- [0039](0039-a-half-named-figure-says-what-it-was-dealt-with.md) — A half-named figure says what it
  was dealt with, from a cut kept for it. **Accepted**
- [0040](0040-the-standard-library-is-asked-first.md) — The standard library is asked before a
  function is written. **Accepted**
- [0041](0041-a-pinned-row-states-its-kinds-before-it-is-pressed.md) — A pinned row states its kinds
  on the card, before anybody presses it. **Accepted**
- [0042](0042-the-naming-convention-is-transplanted-not-copied.md) — A naming convention is
  transplanted, not copied. **Accepted**
- [0043](0043-a-failure-at-a-handover-has-nobody-to-catch-it.md) — A failure at a handover has
  nobody to catch it. **Accepted**
