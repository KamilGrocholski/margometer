# 0021. A record is born whole, and a fixed choice is a table

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

The maintainer handed over a list of questions to put to every change: is this the simplest solution
that could work, can a junior programmer understand it in five minutes, could it be data instead of
code, can any of it or any dependency be deleted, are assumptions asserted and invariants checked,
does a strict type check pass with no `any` and no `@ts-ignore`; start simple, comments explain why
and a performance decision keeps its numbers, test algorithms alone and the whole on known data with
a picture for anything spatial, review generated code for hidden allocations, shape instability and
needless abstraction, and prefer plain data, plain functions and plain loops.

Most of the list already had an owner in `AGENTS.md`:

- the simplest thing, started simple and never ahead of its need: C9, I1, I3;
- plain data, functions and loops: S1, S2, S4, I1;
- what can be deleted: C9, W4's inert line, and _Ask first_ for a dependency;
- assumptions and invariants: A1, A2;
- comments with their reasons and numbers: C2, and S3 for the cost of a payload;
- tests on known data: W3 to W8 over the recordings in `captures/`, and the panel looked at through
  `deno task preview`, `deno task panel:shots` and the `verify` skill (W9);
- a reader new to the tree: C14, S1 and N2's verbs.

Three questions had none. Read from the parser on 2026-10-01 at `0d87df5`, over `libs/`, `src/` and
`tools/`:

- **`any` and the `@ts-` directives.** C13 named the cast and nothing else. `deno lint`'s
  recommended rules, which the gate runs, refuse `any` (`no-explicit-any`), but `ban-ts-comment`
  lets a directive through when it carries a description. The tree held 0 of either.
- **A shape that changes.** 1 place in the layers that build records: `src/game/engine-battle.ts`
  typed its wrap `{ [WRAP_MARKER]?: number }` and set the marker after the function was made. No
  `delete` of a property stood there; `src/ui/` and `src/userscript-entry.ts` held 10 optional
  properties, every one typing an object the page hands over.
- **A choice that could be data.** 5 `switch` statements, none mapping three constants onto
  constants; 5 runs of three or more `if` comparing one value by `===`, of which 1
  (`src/runtime/settings.ts`, the fold read back from storage) answers only literals, and one of its
  three constants is `null`, nothing stored, which answers the default. The other 4 answer a field
  of what they are handed, or narrow a type.

## Decision

Decided with the maintainer on 2026-10-01.

**The gaps become rules, and the questions go to the review.** Each question is asked in the
`review` skill's checklist, pointing at the rule that owns it.

**C13 names `any` and a `@ts-` directive beside the cast**, since both override the compiler as a
cast does. `deno lint` holds the first; `tests/repository/type-assertions.test.ts` reads every
comment of every source directory, tests included, for the second.

**S15: a record is born whole.** Every field comes from the literal that creates it, `null` where
nothing was stated, and no type in `libs/`, `src/core/`, `src/game/` or `src/runtime/` marks one
optional. `tests/repository/record-shapes.test.ts` holds it. A hidden allocation stays S3's: it is
measured on the recordings, not ruled on.

**C18: what can be a table is a table.** A choice answering one fixed value for another is a lookup,
and a branch stands where cases do different work. `null` is not counted among the constants:
nothing stored answers a default, which is different work from a mapping. It is held by reading:
with no case in the tree, a guard would be proved on its samples alone.

Rejected: **the questions verbatim in `AGENTS.md`.** Most of them restate C9, A1, C2 or S1 in other
words, which is the drift _Authority_ forbids, and none names an observation.

Rejected: **the questions in the review skill alone.** The three gaps would have stayed unnamed, and
a review finding must name the rule it breaks.

## Consequences

- `src/game/engine-battle.ts` builds its wrap with `Object.assign`, so the function carries its
  marker from its first reading; the wrap's semantics, a carried-over contract, do not move.
- `tests/source-tree.ts` reads a node's `operator` and `optional`.
- A guard for C18 is written when a second case would make its count worth reading.
