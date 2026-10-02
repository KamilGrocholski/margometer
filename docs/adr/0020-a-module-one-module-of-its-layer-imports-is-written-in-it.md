# 0020. A module one module of its layer imports is written in it

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

`AGENTS.md` C9 said a shared module appears at the second consumer, and C10 that length never splits
a file. No guard held either, and ADR 0018 had just moved every function called from one place into
its caller, which left the same question one level up: a file whose one consumer is a sibling is a
function boundary with an import in front of it.

Read from the import graph of `src/` on 2026-10-01 at `8a8f83b`, counting only importers in `src/`:

- 73 files, 21623 lines, 704 top-level `export`s;
- 9 modules of a layer imported by exactly one module of the same directory: `fight-card.ts`,
  `panel-card.ts`, `panel-scroll.ts` and `panel-tip.ts` by `panel-element.ts`; `runtime-intent.ts`
  and `engine-search.ts` by `margometer-runtime.ts`; `opened-reading.ts` by `panel-frame.ts`;
  `protocol-message.ts` by `fight-decoder.ts`; `engine-warrior.ts` by `payload-envelope.ts`.

The maintainer asked how John Carmack and Jonathan Blow keep a tree of files. Carmack's argument on
inlining (the source ADR 0018 reads) is about any boundary, not only a function: a boundary is paid
for in jumps and in an interface, and pays back only where two sides use it. Blow keeps few, long
files, split by subject; Casey Muratori writes code in place and pulls it out at its second use,
which is C9 as it stood.

## Decision

Decided with the maintainer on 2026-10-01.

**A module of `src/core/`, `src/game/`, `src/runtime/` or `src/ui/` that exactly one other module of
its own directory imports is written in that module.** That is C9's observation, and
`tests/repository/single-importer.test.ts` holds it. A test is no consumer: it imports whatever the
merged module exports, and keeps its own file named for the subject it holds.

**The layers alone are counted.** The entry, its boot and `src/build-version.ts` stand above the
layers, and an import across a layer is `docs/design.md` §4's to keep apart, so
`src/core/fight-figures.ts` stays a file although `src/runtime/fight-state.ts` alone imports it.

**`panel-tip.ts` and `panel-card.ts` are written into `src/ui/panel-element.ts`**, which then runs
to some 4100 lines. The maintainer weighed them as subjects of their own and chose the merge: the
detail window is drawn by the panel and nothing else.

**The page's time is one file**, `src/game/browser-time.ts`. No guard asks for it: the clock, the
frame and the interval are three ports the entry reads, but `docs/design.md` §5 states them as one
group, "Time and the frame", and three files for one group is the split C10 forbids.

Rejected: **one file per layer**, Blow taken to the end. A layer holds more than one subject (the
decoder and the statistics in `core/`), and `docs/structure.md` stops being a map when every row is
a layer.

Rejected: **counting a test as a consumer.** 7 of the 9 are imported by a test or a tool, so each
would have had a second consumer, and the guard would have found 2 of them.

## Consequences

- Merging the nine moved two more in their wake: `tip-reading.ts`, whose other importers were the
  merged files, and `screen-intent.ts`, imported by `runtime-intent.ts`. `executeRuntimeIntent` and
  `resetScreenOnOpening` were called once and are not strong, so S4 wrote them into their callers.
- On 2026-10-01: 73 files to 60, 21623 lines to 21474, 704 `export`s to 689; the built userscript
  went from 478415 bytes to 478337.
- Test files keep the subject they hold (`tests/ui/card-window.test.ts`), and three are renamed for
  theirs: `tests/core/message-grammar.test.ts`, `tests/game/warrior-entries.test.ts` and
  `tests/runtime/opened-readings.test.ts`.
- A merge that drops an `export` can leave a function called once, which S4 then writes into its
  caller; `tests/repository/called-once.test.ts` names it.
