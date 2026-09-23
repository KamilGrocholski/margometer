# 0115. A charge stands first in a fighter's tooltip

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

**ADR 0108** split what the add-on says between two surfaces: the window says what is true of the
fight, the tooltip what is true of one fighter. The special blow being made ready stayed in the
window, Pomocnik, and reached the tooltip not at all — although a charge is carried by one fighter,
and the envelope states it on that fighter's own record (`super_cast`,
`src/game/engine-warrior.ts`).

The maintainer asked for it in the tooltip as well, and at the top of it: of everything a fighter's
block can say, the charge is the blow the fight is about to take. **ADR 0107** ordered the block by
what a reader acts on first and put the okrzyk there.

A charge carries the client's own pair: the turns passed of the whole it states, `turn` of
`total_turns`. Pomocnik restates that pair as it is, `2 z 4`. Every other length in the tooltip
counts down, what is left (**ADR 0109**); **ADR 0112** named the provocation and Dotyk anioła as the
only two rows carrying turns.

Measured over `captures/`, 35 recordings, 2026-09-23: 82 charges, 33 of one turn, 22 of two, 23 of
three and 4 of four. Every `super_cast` in them stands on a monster (`docs/protocol-keys.md`).

## Decision

**A charge still running is the first row under the add-on's name**:
`Cios specjalny · Pożoga · 2 z 4`. The label is the client's own, as Pomocnik draws it; the blow is
named as the envelope names it; the figure is **the client's pair, counting up, with no noun** —
exactly what Pomocnik draws for the same charge.

**An ended charge puts no row in.** A charge that struck or was broken stands in Pomocnik for the
turn it ended on, and the tooltip says nothing of it.

**Pomocnik keeps its charge section as it was.** This adds a place the charge is said; it takes none
away.

This supersedes **ADR 0107** on the order of the block, and **ADR 0112** on the count of rows
carrying turns — the charge is a third, restating the client's figures rather than counting any. The
decision is the maintainer's, 2026-09-23.

## Consequences

Easy: a player hovering the monster sees what it is making ready without looking away to the window.

Hard: the tooltip now carries two fractions of turns a row apart in opposite directions — the charge
counts up, the provocation down. The provocation's noun, `1 z 3 tur`, and the charge's lack of one
are all that tell them apart.

Also: the block has one more named row beside the statuses, so `ROWS_BESIDE_THE_STATUSES` in
`src/ui/panel-words.ts` is seven, and the bound the writer holds in `src/game/engine-tooltip.ts`
still covers it.

## Alternatives

**What is left, as the provocation counts.** It keeps every length in the tooltip one direction. It
lost because Pomocnik draws the client's own pair for the same charge, so one charge would read as
two different numbers on two surfaces — the complaint that took two sections down in **ADR 0108**.

**A word and a noun on the figure**, `minęło 2 z 4 tur`. It says what the pair means, and it was the
first shape written. It lost on the maintainer's choice, for the bare pair Pomocnik already draws;
it also needed a genitive singular the counted nouns do not spell, `z 1 tury`, for the commonest
charge.

**No blow's name.** Shorter, `Cios specjalny · 2 z 4`. It lost because the tooltip would not say
which blow is coming, and a monster has several: Amaimon makes three different ones ready in
`captures/2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json`.

**The ended charge as well**, `Cios specjalny · Pożoga · przerwane` for one turn. It lost on the
maintainer's choice: the tooltip says what is happening to a fighter now, and Pomocnik already says
how a charge ended.
