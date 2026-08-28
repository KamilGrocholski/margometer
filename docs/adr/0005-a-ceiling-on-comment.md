# 0005. A ceiling on comment, and three rules that give it shape

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

v1's rule read: _"Comments say WHY, never WHAT, and only what earns it. Length is not the axis; what
it carries is."_ It was written against a real failure and it is the rule almost every codebase
writes.

Measured over `develop` at `171b0e2`, counting lines whose first non-space characters open or
continue a comment:

| Directory   | Lines | Comment | Share   |
| ----------- | ----- | ------- | ------- |
| `libs/`     | 839   | 456     | **54%** |
| `src/core/` | 3,910 | 2,075   | **53%** |
| `src/game/` | 2,550 | 1,308   | **51%** |
| `src/ui/`   | 7,432 | 3,521   | **47%** |
| `tools/`    | 4,950 | 1,683   | 34%     |

Worst single files: `src/core/battle-event.ts` at **75%** (446 of 592), `src/ui/panel-words.ts` at
61% (634 of 1,035), `src/game/engine-place.ts` at 63%.

Against a distributed database engine written under a comparable style, read on 2026-08-28 at its
`main`:

| File                  | Lines  | Comment | Share   |
| --------------------- | ------ | ------- | ------- |
| `src/stdx/stdx.zig`   | 1,279  | 107     | **8%**  |
| `src/lsm/tree.zig`    | 679    | 91      | **13%** |
| `src/vsr/replica.zig` | 12,459 | 1,911   | **15%** |
| `src/vsr/journal.zig` | 2,585  | 598     | **23%** |

A distributed database's consensus replica runs at 15%. A battle-log reader ran at 53%.

The rule failed for a reason worth naming: **"why, never what" has no upper bound and no shape.**
Every comment can be defended as "why" by whoever wrote it, and each one individually was. What
accumulated was a genre — file docblocks narrating the module's own history: which rule used to read
differently, what had no consumer for three releases, what was once filed as duplication and
collapsed. Genuinely informative, individually defensible, and half the source.

## Decision

Four rules replace one. Three give comment a shape, the fourth gives it a bound.

- **C2** — a comment carries a measurement, a constraint somebody else's system imposes, a rejected
  alternative, or a trap. Nothing else. Anything that only describes is deleted, however well
  written.
- **C3** — a comment states what is true **now**. Never how the code came to be this way. That is
  what a commit message and an ADR are for, and unlike a comment they are dated and searchable.
- **C4** — a file docblock is at most eight lines. Longer is an ADR that has not been written yet.
- **C5** — comment share of a file stays under 25%, which is above the worst figure measured above.

## Consequences

- **The history genre moves to ADRs, and does not disappear.** This is the whole trade, and it is a
  real cost: a warning attached to the line it concerns is read by whoever edits that line, and an
  ADR is not. What ADRs buy back is a date, a status, a supersession path, and an index — none of
  which a docblock has.
- C5 is **checkable**, which the old rule never was. A guard can count. That alone is the difference
  between a rule and an aspiration.
- C4 makes the pressure visible early: a docblock reaching nine lines is a prompt to write the ADR,
  not to trim adjectives.
- **A percentage can be gamed by padding code.** Accepted, because the failure it guards against is
  the opposite one and the direction of the incentive is right. If padding ever appears, C5 gains a
  companion rule rather than a higher ceiling.

## Alternatives

**Keep the v1 rule and enforce it by review.** It was enforced by review, by an author who cared,
for four releases, and produced 53%. Rejected on that record.

**A stricter ceiling — 15%, the replica figure measured above.** Rejected: this project must cite
sources for every claim about someone else's system, and those citations are comment. 25% leaves
room for the citations without leaving room for the essays.

**No ceiling, only C2 to C4.** The three shape rules are the substance, and the ceiling adds nothing
a careful author needs. Rejected for that exact reason: it is the careless direction the bound
exists for, and v1 proves the careful author is not the risk.
