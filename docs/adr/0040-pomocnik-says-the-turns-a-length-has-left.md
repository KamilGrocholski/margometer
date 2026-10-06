# 0040. Pomocnik says the turns a length has left

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

**ADR 0039** wrote the tooltip's rows the game's way and left Pomocnik on the bare pair of
`develop ADR 0116`. One shout then read two ways on two surfaces: `(2 tury)` in the tooltip and
`2 z 3` on the row of whoever it held in Pomocnik. A charge read `2 z 4` in Pomocnik, counting what
had passed, while the game's own tooltip section for the same charge says the turns left with their
noun. On development build `hb9Z0D4r`, read 2026-10-06, `fillTipSuperCast` writes
`total_turns - turn` through `turnTranslation`, which picks `turn`, `turns` or `turn5`.

The game has no window like Pomocnik, so nothing on its side stands beside it to match. The bar it
draws over a fighter making a blow ready is cut into a part per turn and filled to what has passed.
Pomocnik's dots already do the same.

## Decision

Decided with the maintainer on 2026-10-06.

**Every length Pomocnik draws is the turns it has left, with their noun: `2 tury`.** That holds for
the row of a charge, the row of a held character, and the card of either, under one label,
`Zostało`. One function draws it, `formatTurnsLeft` in `src/ui/panel-words.ts`, and the tooltip's
provocation uses the same one.

**The charge's dots stay, lit up to what has passed**, as the game's bar fills. The figure beside
them now counts the other way, as the game's tooltip does beside its bar.

This supersedes **ADR 0039** on Pomocnik, and `develop ADR 0115` and `develop ADR 0116` on a
charge's pair and on every counter being a bare pair.

Rejected: **the charge as the game's tooltip writes it, `50% (2 tury)`.** It matches the game word
for word, but at twelve characters it takes the room the blow's name needs, and the dots already say
the share.

Rejected: **`x/y`, as the game writes its energy.** It keeps today's directions, the charge up and
the shout down. It lost because the game writes turns left with their noun, and a pair would leave
one shout reading two ways again.

## Consequences

A charge and a shout now read alike wherever they stand: `2 tury` in Pomocnik, `(2 tury)` in our
tooltip rows, and `(2 tury)` in the game's own section for a charge. `formatCounter` is gone, and so
is `HELPER_WORDS.turnsPassed`, `Minęło`, which no card states any more.

A charge's row counts down beside dots that fill up. Nothing in the row says which way the figure
runs but its noun.
