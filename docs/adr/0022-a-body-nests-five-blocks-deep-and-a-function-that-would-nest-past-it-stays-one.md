# 0022. A body nests five blocks deep, and a function that would nest past it stays one

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

ADR 0018 took the 70 lines away and made S4 write every function called from one place into its
caller, unless its verb is strong. Read from the parser on 2026-10-01 at `ee0edfc`, over the
top-level declarations of `libs/`, `src/` and `tools/`:

- 964 of 1083 functions stood under 31 lines, 98 between 31 and 70, and 6 over 150;
- `initPanelView` (`src/ui/panel-element.ts`) stood at 1260 lines, 711 of them one closure,
  `renderScreen`, drawing every region of the panel in place;
- `tallyFightStatistics` (`src/core/fight-statistics.ts`) stood at 608, `tallyDrillCases`
  (`tools/drill-report.ts`) at 283, and `decodeMessageReading` (`src/core/fight-decoder.ts`) at 169.

Counting the blocks a statement stands in, its own function's body included, 1161 of 1169
declarations went no deeper than five; the other eight went to six, seven, eight and ten, and the
ten was `initPanelView`. `initPageTooltip` (`src/game/margonem-engine-tooltip.ts`) had taken a
function into itself by turning each `return` into a labelled `break`.

Carmack's mail on inlined code, the source ADR 0018 cites, asks to **consider** inlining a function
called from one place, and names the enemy as state changed out of the order a reader sees it in;
work that is close to purely functional he asks to make completely so. The regions of `renderScreen`
each build an element that did not exist and hand it back, so the sequence his argument protects is
the assignments `regions.header = …`, `regions.nouns = …` in the caller, and not the bodies under
them. Jonathan Blow and Casey Muratori write code in place first and pull a function out when the
same thing is written a second time: compression rather than a cut by length. Through
`src/ui/panel-element.ts`, one line made an element and the next set its text, again and again.

## Decision

Decided with the maintainer on 2026-10-01.

**Depth bounds a body, and length still does not.** A body nests at most five blocks deep, counting
its own: a braced block, a `case`, and every arrow a statement stands in, braced or not. A lambda
written inside a statement adds nothing to it. This is **S16**. Five is where the tree stood on the
date above: it passes 1161 of 1169 declarations and the sequences of the entries (`initRuntime`,
`renderFrame`, `onRuntimeIntent`), and stops the eight that had taken their steps in.

**S4 yields to S16.** A function called from one place stays one where, written as a block where it
is called, it would nest past the bound. The guard reads that off the call: the depth of the call,
plus the depth of the body under its declaration.

**A pair written twice is a function**, which S4 already allowed: `renderText` makes an element
holding one text, in the 49 places the pair stood once the regions had come out.

What moved, measured the same way on the same day after the change:

- `renderScreen` went to 106 lines; each region is a `render…Region` function, and the assignments
  stay in it in the order the panel draws them. `initPanelView` went to 448;
- `tallyFightStatistics` went to 324: each half of a blow, of damage stated against a name and of
  health moving outside a blow is an `add…` function, and the announced wound is a strong `lookup…`;
- `tallyDrillCases` hands each opened level to an `add…ToTally`, `decodeMessageReading` a valued key
  to `addValuedKey`, and `initPageTooltip` the block on one fighter to `writeWarriorBlock`;
- three were flattened where they stood, by a guard clause, a dropped block or `.flat()`.

Rejected: **the 70 lines back**, which ADR 0018 rejected for cutting a long `tally…` in two at the
page. Depth cuts where nesting is, and a flat run of steps stands whatever its length.

Rejected: **exempting weak verbs from S4 as well**, which would have brought back some 50 `add…`
helpers: P1 already makes a weak function's call name every change it makes. It is a second
mechanism beside depth, and depth brought back the ones a reader stumbled on.

Rejected: **measuring depth by indentation.** A call wrapped over several lines indents its
arguments, and that is the formatter's choice of where to break and not a level of the code.

## Consequences

- `tests/repository/nesting-depth.test.ts` holds S16, and `tests/repository/called-once.test.ts`
  reads S4's exception off the same count, both through `countEnclosingBlocks` in
  `tests/source-tree.ts`.
- `renderListLevel` (`src/ui/panel-element.ts`) stands at 398 lines: the shelf and six levels of the
  list, each an `if` that draws and returns, none deeper than the bound. S4 keeps them in it, and
  nothing in S16 asks otherwise. Open, and the maintainer's: whether a flat function of that length
  is one to leave.
