# 0032. The card counts the legendary bonuses that reached its combatant, and names no giver

- **Status:** Accepted
- **Date:** 2026-10-03
- **Supersedes:** ADR 0031

## Context

ADR 0031 put somebody else's legendary bonuses on the card of whoever they reached, each by its
count and, under it, each giver with theirs. At `15913a7` the givers stood in one folding line under
their bonus, `Gracz 2 (2), Gracz 5 (1)`, so that a fight of ten opponents would not cost a line per
giver.

Over `captures/` on 2026-10-03 the tallest card is 38 lines, 681px at the middle type step in Chrome
154, and at a window 620px tall the received run is the one the card gives up whole. A fight of ten
against ten, which the recordings do not hold yet, would add a giver line under each bonus.

## Decision

Decided with the maintainer on 2026-10-03.

**A bonus that acts on the blow's other end is counted on that end too, and the card states it in a
run of its own after the holder's, by its count alone.** A curse a person threw and one thrown at
them still never share a line; whose each one was is not said. The maintainer asked for the number
of bonuses and nothing more.

**A bonus held for the whole fight reaches nobody on the card.** Its one message names the first
blow of the many it acts on, so a count of who it reached would name one attacker of several.

**A bonus acting on its holder alone reaches nobody**: Płomienne oczyszczenie, Dotyk anioła and
Ostatni ratunek.

Rejected: each giver under their bonus, on a line of their own (`0a9085e`) or in one folding line
(`15913a7`). Either costs the card height that grows with the number of opponents, for a question
the maintainer does not ask of it.

Rejected: one run with a mark on each line saying which way it went. The two questions — what mine
did, and what was done to me — would be read off a glyph rather than off a heading.

## Consequences

`FightStatistics.legendaryBonuses` holds two counts by key, on the holder and on whoever was
reached, still beside the rows and so outside the fight file. Nothing keeps whose bonus reached
whom.
