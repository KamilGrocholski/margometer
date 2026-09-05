# 0051. The layer a reader touches never fails

- **Status:** Accepted
- **Date:** 2026-09-05

## Context

Measured over `52a1c10` on 2026-09-05, `assert` is the **only** way the reader-facing layer can
throw. `src/ui/` spells 550 of them across 11 files and `src/userscript-entry.ts` 74, so 624 in all;
`src/userscript-boot.ts` is four lines and spells none. There is not one `throw` and not one `!` in
any of them, and `noUncheckedIndexedAccess` already forces every array and `Map` read to answer for
itself. So the failure this layer has is not a value nobody checked reaching the DOM. It is an
assertion firing.

**A5** keeps assertions in what ships, so those 624 are live in the reader's browser: the built file
carries 964 spellings of the word and three of `AssertionError` at 317,663 bytes, measured the same
day.

**Two of the last three releases were spent on this, and both were the same kind of assertion.**
`0.12.1` was a hotfix for
`MargoMeter/Panel AssertionError: a reading sizes no more rows than it
holds`, and `5ea947c` fixed
`and carries no more of them than a list draws`. Each is an **S11** bound: a stated maximum on a
collection that grows with input, asserted rather than clamped. The fight carried more rows than the
number written down, and the panel threw instead of drawing the rows it could. There are 21 such
maxima in this layer.

**One path has no boundary under it at all.** `composePanelReading` and the 135 assertions in
`src/ui/panel-reading.ts` run inside the entry's draw, **outside** `composeRegion`'s `try`
(`src/ui/panel-element.ts:1166`). The nearest catch is `src/game/engine-battle-wrap.ts:86`, which
counts failures and reports only the first (**E11**). So a reading assertion does not degrade a
region: the panel stops updating for the rest of the fight, one console line is written, and the
reader is told nothing. That is the exact failure **A7** exists to prevent, and it is the second
place **A7** has been found not to hold — **ADR 0043** was the first.

Of the six `catch` clauses in this layer, exactly one marks anything a reader can see: the `undrawn`
element `composeRegion` puts in place of a region. A gesture that threw, a pointer capture refused,
a revoke that failed and a store that would not answer each reach `page.console.error` and nowhere
else — and a console is not where somebody playing a game is looking.

`ARCHITECTURE.md` already carries the rule that decides this: **a number that might be wrong must
never look like a number that is right.** A panel frozen mid-fight is worse than either. It looks
exactly like a panel that is right.

## Decision

**`src/ui/`, `src/userscript-entry.ts` and `src/userscript-boot.ts` assert nothing and throw
nothing.** Every value crossing into them is checked before it is used, every call that can throw is
caught, and a broken expectation degrades in place — clamped, truncated, skipped or fallen back —
rather than unwinding. `libs/`, `core/` and `game/` go on throwing; this layer is what catches them.

Two rules join `AGENTS.md`:

- **A11.** The layer a reader touches asserts nothing.
- **E14.** That layer never fails, and every failure it swallows becomes a defect it states.

**A failure there becomes a defect** — a third severity beside **suspect** and **undrawn**, which
`ARCHITECTURE.md` reserved as `[ASK]` and which is hereby granted. A defect is a failure of the
add-on itself rather than of the reading, and the panel says so in a section of its own: what it
could not do and how many times, in plain Polish, never why. **L3** binds — no `AssertionError`
text, no identifier of ours, no key of the game's reaches a sentence a player reads. The failure
itself stays in the console, once per kind (**E11**).

**No sixth boundary joins E5.** Composing the reading a region draws is part of drawing it, so the
guard that already exists is widened to cover it rather than a row being added to a table whose
whole value is that it is short.

**S5's scope narrows to where assertions are still required** — `libs/`, `project/`, `src/core/`,
`src/game/` and `tools/`. Measured with the guard's own counter at `52a1c10`: the reader-facing
layer stands at 624 assertions over 311 functions, or 2.006; the rest at 1,016 over 508, or exactly
**2.000**; the whole scope at 1,640 over 819, or 2.002. The threshold stays at two, because two is
what the narrowed scope measures.

## Consequences

- **The narrowed scope clears S5 with no headroom at all.** 1,016 over 508 is 2.000 against a floor
  of 2.000. The next commit that removes an assertion from `libs/`, `project/`, `src/core/`,
  `src/game/` or `tools/` without adding one turns the guard red. That is the rule working and not a
  fragility to be papered over: **ADR 0007** already refused to close a gap of this kind by hand,
  because the assertions available to close it are the ones a static checker can already prove.
- **The conversion cannot move that figure**, because every file it touches is outside the narrowed
  scope. The series is safe against its own guard.
- **21 stated maxima stop being assertions and stay maxima.** **S11** asks for a stated bound and an
  assertion at it; in this layer the assertion becomes a clamp and a defect. The bound is still
  written down and still enforced — what changes is that exceeding it costs a row rather than the
  fight.
- **The panel gains a region that is usually empty.** It is drawn from a snapshot taken before a
  draw begins, so a defect recorded during one appears at the next: nothing a defect does can ask
  for a redraw, which is the loop this design must not have.
- **A11 and E14 are held by reading until the conversion lands.** A rule stated over a tree that
  breaks it is a wish (**ADR 0042**), so the guard arrives in the commit the last assertion leaves,
  and `ARCHITECTURE.md` carries the gap until then.
- **What this layer loses is the assertion as documentation.** 624 sentences naming an invariant go
  out of the tree. **C14** is why that is affordable: a name, a type and a check say what those
  sentences said, and the ones worth keeping become checks rather than comments.

## Alternatives

**Strip assertions from the production build instead.** Rejected, and **ADR 0002** is the standing
reason: the failure this project most fears is a figure that is quietly short in a reader's browser,
and an assertion removed is a wrong number drawn confidently. It also fixes nothing here — the panel
that froze would go on freezing, silently, one line further down.

**Wrap the whole draw in one `try` and leave the assertions in.** Rejected. It is what
`composeRegion` already does for six of seven regions, and the two hotfixes happened anyway: a
caught assertion still costs the reader the region, and a bound assertion inside a list means the
whole list is lost for one row over the maximum. Catching a failure is not the same as not having
one.

**A third error base, so the panel could tell its own failures from everybody's.** Rejected; **ADR
0009** and **ADR 0004** carry the measurement. v1 had seventeen error classes and read `.code`
nowhere. A defect is state the panel draws, not a class somebody catches, and this layer throws
nothing for a base to brand.

**Keep one severity and put defects in the warnings block.** Rejected. `CONTEXT.md` defines
**suspect** as a drawn figure that may be short, and a panel that could not draw a region has not
got a figure to qualify. Two claims in one list is how a reader learns to skip both.
