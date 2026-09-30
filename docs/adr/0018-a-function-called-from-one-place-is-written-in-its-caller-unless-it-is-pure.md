# 0018. A function called from one place is written in its caller, unless it is pure

- **Status:** Accepted
- **Date:** 2026-09-30

## Context

`AGENTS.md` S4 held every function to 70 lines, "one printed page", and N6 prefixed a helper called
by one function with that function's name. Nothing said which functions touch state and which do
not, though the design leans on the difference: `core/` is pure transitions (`docs/design.md` T4), a
payload is prepared and then committed (`src/core/fight-session.ts`), and one frame draws however
many changes a flag collected (T8).

John Carmack argues the other way on length, in the emails and the article collected at
`cbarrete.com/carmack.html` (read on 2026-09-30). A function called from one place is better written
in its caller, as a block under a comment, so that the state changes a step makes are read in the
order they happen and nobody calls half of a sequence. A function that reads only its parameters and
returns a value is safe from that failure, and "when overwhelmed, factor blocks into pure
functions". Where a language cannot state purity, he asks for it in the type system, as `const` does
and as D's `pure` does, in a strong and a weak form.

Read from the parser on 2026-09-30 at `56cafa7`, over the top-level function declarations of
`libs/`, `src/` and `tools/`, a function mentioned anywhere but as a callee counting as a value:

- 1271 functions, 844 of them not exported;
- 565 of those called from exactly one function and never handed on as a value;
- 341 of the 565 named with a verb that reads only its parameters, and 224 with one that changes
  something: 170 of those in `src/`, 3 in `libs/`, 51 in `tools/`;
- 87 of the 565 carry N6's prefix;
- 14 functions in `src/` stood between 60 and 70 lines.

`initRuntime` and `initRuntimeState` (`src/runtime/margometer-runtime.ts`) are one sequence of about
a hundred lines, cut in two at the page. `readPayloadEnvelope` (`src/game/payload-envelope.ts`)
calls four pieces of itself, each once. `renderPanelBodyFoot` stood some 1400 lines under the one
line that calls it (`src/ui/panel-element.ts`).

Over the same tree, taking N2's verbs for what each function does, 43 calls in 19 functions went
from a verb that reads only its parameters, or changes only what it is handed, to one that reaches
further, and in 8 places a function of the first kind changed a map or an array it was handed.

## Decision

Decided with the maintainer on 2026-09-30.

**Length stops deciding where a function ends, and S4 states what does instead.** The number is kept
for the subject it had, the end of a function, rather than left empty: the guard over `AGENTS.md`
numbers each prefix without a gap, and renumbering S5 to S14 would move every bold reference to them
across the tree. ADR 0006 cites "S4's page" as it stood on its date.

**A function's verb states its purity, in D's two strengths.** N2's table gains a column:

- **strong** — reads only its parameters and module constants, changes none of them, and returns a
  value: `prepare`, `verify`, `get`, `lookup`, `parse`, `decode`, `encode`, `tally`, `index`,
  `replay`, `present`, `format`, `compose`, `create`, `require`, `expect`, and the predicates **N8**
  names;
- **weak** — changes only what it is handed: `add`, `remove`, `set`, `reset`;
- **none** — anything else, and every verb outside the table;
- **either** — `read`, whose verb says where a value comes from (N16) and not what reaching it
  touches: `readPayloadEnvelope` reads a value it is handed, `readStorageChoice` a store.

A strong or weak function calls only strong, weak and `read` functions, and a strong one changes
nothing it is handed. That is **P1**.

**A function called from one place is written in its caller, unless it is strong.** Its body becomes
a braced block, headed by a one-line comment that names the step, which is Carmack's style C. A
function handed on as a value is not called, and stays one. That is **S4**, and N6's prefix goes
with it: a strong helper is named by its own verb.

**Each event changes state at one point** (**P2**): `render…` is called by a `render…` or by the
frame's entry, and a `commit…` by the payload's. **A strong function takes readings** (**P3**), and
**a module holds no state of its own** (**P4**).

**A block's heading is a fifth thing a comment may carry** (C2), and it does not count toward C5 and
C16's share, because it stands where a function's name stood.

Rejected: **keeping 70 lines, or lifting them only for the entries.** The maintainer chose to remove
the limit outright. A limit kept for pure functions alone would still cut a long `tally…` in two at
the page, which is the split S4 undoes.

Rejected: **purity read off the layer**, `core/` and `libs/` pure and the rest not. `present…` in
`src/ui/panel-reading.ts` and the `compose…Rules` of `src/ui/panel-look.ts` are pure in a layer that
draws, and `src/core/fight-statistics.ts` changes accumulators through 19 `add…` helpers, each
called once. A layer cannot say which.

Rejected: **`read` as none.** N16 names a value's provenance, and 46 calls from strong and weak
functions to `read…` read a value they were handed. Counting them would push a rename onto N16's
vocabulary to state what P1 already states by the caller's verb.

Rejected: **Carmack's "always execute, then inhibit or ignore the results".** In the game's stack
only what must runs (T3), and the frame already runs every step, each under its own guard.

Rejected: **each impure function's state written in its comment**, the article's first action item.
C14 wants a type to say it, and P4 hands state down as a parameter, which says it.

## Consequences

- The guard of the 70 lines, under `tests/repository/`, is deleted with them.
- `tests/repository/comment-share.test.ts` leaves a block's heading out of the share.
- S4 and P1 to P4 are held by reading until their guards run. The findings above are what a P1 guard
  meets first: `compose…` functions that initialise or draw, `init…` used for a plain record, and
  weak listeners that report to the console.
- S4 moves some two hundred functions into their callers. `src/core/fight-statistics.ts` takes its
  `add…` helpers into `tallyFightStatistics`, and `src/ui/panel-element.ts` its `render…` pieces
  into the functions that call them. A strong helper stays where C1 puts it.
- S5 counts per function, so every function S4 removes raises the density, and an assertion of a
  helper's precondition that its caller already guarantees becomes one A12 deletes.
- Open, and the maintainer's: whether a guard for P2 reads direct callers or reachability from the
  entries of `docs/design.md` §10. Every `render…` reaches back to `startMargoMeter` through the
  callbacks, so reachability alone separates nothing.
