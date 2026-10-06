# 0041. An ended charge draws no length

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

**ADR 0040** made every length Pomocnik draws the turns it has left, a charge's among them, and gave
no exception for a charge that had already ended. The row and the card of a broken charge went on
counting down to a blow that would never land. Over `captures/` as it stood on 2026-10-06, 31
moments with a broken charge standing in Pomocnik drew `1 tura` to `3 tury` beside `przerwane`. A
struck charge has run all its turns, so the same counter said `0 tur` beside `wykonane`.

Before **ADR 0040** the counter ran the other way, so a broken charge read `1 z 4`, and v0.22.1 drew
it that way: how far it got, which the dots beside it say as well.

## Decision

Decided with the maintainer on 2026-10-06.

**A charge that has ended, broken or struck, draws no length**, neither on its row nor on its card.
Its dots stay, lit up to the turns that passed, and the word for its end stands on the band's
heading and under the blow's name on its card. The row draws no figure cell at all, as the row of
whoever is holding somebody draws none, and the card is the blow's name and the line under it with
no figure.

**A charge still being made ready keeps its turns left**, `Zostało 2 tury`, as **ADR 0040** set
them.

This supersedes **ADR 0040** on a charge that has ended.

Rejected: **`x z y` for an ended charge, as before ADR 0040.** It says how far the charge got, but
the figure in that cell would then count up on one row and down on the row above it, and one cell
read two ways is what **ADR 0040** removed.

Rejected: **`0 tur` on a struck charge and nothing on a broken one.** `0 tur` is true of a charge
that ran out, but it gives one row two rules, chosen by an end the dots already show.

Rejected: **an empty cell where the figure stood.** It would hold the dots where a charging row
draws them, but the counter's width varies with its noun, so no two rows lined up before either, and
the holder's row already draws nothing where it has no length.

## Consequences

An ended charge's row ends at its dots, and its card states no `Zostało`. A reader tells a broken
charge from a struck one by the word and by how many dots are lit, and nothing in the row counts.

`formatTurnsLeft` in `src/ui/panel-words.ts` is unchanged; `src/ui/panel-element.ts` asks it only
for a charge still charging.
