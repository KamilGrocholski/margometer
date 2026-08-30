# 0025. A mark is the answer its boundary gives, and not every one is a console line

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

**E11** asked for two things of every caught failure: a mark a reader can see, **and** exactly one
branded console entry. The tree has never done the second, and the guard could not say so —
`tests/repository/errors.test.ts` holds that no `catch` is empty, which is the half a machine can
count.

Measured over `src/` on 2026-08-30, twelve `catch` sites, in two shapes.

**Five hand the failure to a reporter.** `src/ui/panel-element.ts`, `src/ui/panel-drag.ts` twice and
`src/game/engine-battle-wrap.ts` twice pass it to a callback that reaches `page.console.error` — the
one console this add-on has, injected at `src/userscript-entry.ts` and named nowhere else in `src/`.

**Seven turn the failure into an answer and write nothing.** Three in `src/game/browser-store.ts` (a
refusal), `src/game/engine-place.ts` (nothing known about the place), `src/game/game-dictionary.ts`
(no word from the player's client), the store choice in `src/userscript-entry.ts` (a store in memory
instead), and the decoder's format catch in `src/core/fight-decoder.ts` (an `unknown-message` event
the panel counts and shows as doubt).

Giving the seven a console entry would break **E11**'s own second clause in the same sentence: a
store is read on every save, the dictionary on every label the panel has no word for, the place on
every fight. Three of the seven run per render or per read.

It would also cost the shape the layers have. **E8** says `ui/` throws nothing and **E7** says an
expected failure in `src/` is data, so no file under `core/`, `game/` or `ui/` holds a console, and
handing one down through every layer to write a line nobody can act on is the opposite of what those
two rules bought.

**ADR 0002** decided the console entry for the boundary it was about — a render region replaced in
place by a marker — and that stands. What it never decided is that the other three boundaries of
**E5** must do the same.

## Decision

**E11** binds the **mark**, not the medium. Every caught failure leaves the mark **E5**'s table
names for its boundary, where a reader can see it: a fight that decodes no further, a region
undrawn, a refusal, a reading marked unknown.

Where a failure **also** reaches the console it is one branded entry, once, never per render,
written at the entry — the only place that holds a console.

## Consequences

- The seven sites stay as they are, and none gains a console line.
- A new `catch` states which boundary of **E5** it sits at and what answer it leaves. "It logs"
  stops being an answer to that question.
- Whether the mark is the one a reader needed stays read rather than counted. The guard holds the
  empty `catch`; `AGENTS.md`'s register is where that split is stated.
- Nothing counts console entries, so two lines for one failure remain possible and remain a finding
  found by reading.

## Alternatives

**Give the seven a console entry.** Faithful to **E11** as written. Rejected on the measurement
above: three of the seven run per render or per read, which the same sentence forbids, and the other
four would need a console threaded through `game/` and `core/` against **E7** and **E8**.

**Drop the console clause entirely.** Simpler to hold, and a guard could then hold all of **E11**.
Rejected: the single branded line at the render boundary is what **ADR 0002** bought, and it is how
a reader learns that the panel broke rather than the game.
