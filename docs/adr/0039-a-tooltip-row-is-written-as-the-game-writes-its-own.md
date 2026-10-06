# 0039. A tooltip row is written as the game writes its own

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

The add-on's block sits under the game's own lines in a fighter's tooltip, and the two used
different punctuation. `develop ADR 0116` made every counter a bare `x z y` pair, and the rows put
`·` between a name and what it says: `Dotyk anioła · 1 z 3`, `Sprowokowany przez Gracz 2 · 2 z 3`,
`Ostatni ratunek · wykorzystany`. A status with a figure and the two counting rows used a plain
space: `Spowolnienie 14%`, `Tury wykonane 14`, `Prowokuje 10 postaci`.

The game writes the lines above ours another way. On development build `hb9Z0D4r`, read 2026-10-06,
the `one-warrior-tip` template and the dictionary give a label, a colon, then the value:
`Życie: %val%` (`life_percent`), `Energia: %val%` and `Mana: %val%` filled as `40/100`
(`energy_amount`, `mana_amount`), `Pancerz` followed by `:` in the template. A charge reads
`Pożoga: 50% (2 tury)`, with the turns left in brackets and their noun picked by `turnTranslation`
from `turn`, `turns` and `turn5`.

## Decision

Decided with the maintainer on 2026-10-06.

**A row of ours in the tooltip is a label, a colon and what it says, as the game's rows are.**
`Tury wykonane: 14`, `Ostatni ratunek: wykorzystany`, `Prowokuje: 10 postaci`, `Spowolnienie: 14%`.
A status with nothing to add stays its name alone, `Zatrucie`.

**A count of heals is a bare pair with a slash, as the game writes its energy:**
`Dotyk anioła: 1/3`.

**Turns left carry their noun in brackets, as the game writes a charge's:**
`Sprowokowany przez: Gracz 2 (2 tury)`. A count past what the table gives or below none still says
`Nie wiadomo` in their place.

**Pomocnik is not touched.** Its counters stay `x z y`, as `develop ADR 0116` set them, because the
game draws nothing in that window to match.

This supersedes `develop ADR 0116` on how a counter is written in the tooltip. The order of the rows
it set stands.

Rejected: **the colon with `x z y` kept.** It matched the game's punctuation and left the numbers
the panel's own way. It lost on the maintainer's choice, for the game's notation throughout.

Rejected: **`x/y` everywhere, the provocation as `(2/3)`.** One notation for both counters. It lost
because the game writes a charge's turns left with a noun beside the percent, not as a pair.

## Consequences

One provocation now reads two ways on two surfaces: `(2 tury)` in the tooltip, `2 z 3` in Pomocnik.
That is the cost `develop ADR 0108` once took two sections down over. It is taken here because each
surface now matches what stands next to it.

`formatCounter` in `src/ui/panel-words.ts` draws the panel's counters only. The tooltip has its own
two, `formatTooltipFraction` and `formatTooltipTurnsLeft`.
