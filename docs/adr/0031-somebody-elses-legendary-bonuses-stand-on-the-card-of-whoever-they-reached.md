# 0031. Somebody else's legendary bonuses stand on the card of whoever they reached

- **Status:** Superseded by ADR 0032
- **Date:** 2026-10-03

## Context

ADR 0029 counted every legendary bonus on the combatant it belongs to. A card therefore said what a
person's own bonuses did and nothing about what somebody else's did to them: a curse thrown at a
player reached their card only as a lost turn, with nothing saying whose curse it was. The same
bonus can stand at both ends of one fight, a curse thrown and a curse taken.

Every bonus rides a blow, and the blow names both ends. Article view,372, read 2026-10-03, puts five
of them on the other end of the blow from their holder: Klątwa, Cios bardzo krytyczny and Krwawa
udręka on whoever was struck, Oślepienie and Krytyczna osłona on whoever struck. Over `captures/` on
2026-10-03 the next thing heard of whoever struck into a glare is a lost turn 8 times of 8, and of
whoever a curse struck 14 times of 17: two struck first, and one fight ended. Every one of the five,
each time it fired, named the other end.

## Decision

Decided with the maintainer on 2026-10-03.

**A bonus that acts on the blow's other end is counted on that end too, under whose bonus it was,
and the card states it in a run of its own after the holder's.** Each bonus stands by its count, and
under it each giver with theirs, so a curse a person threw and one thrown at them never share a
line.

**A bonus held for the whole fight reaches nobody on the card.** Its one message names the first
blow of the many it acts on, so a count of who it reached would name one attacker of several.

**A bonus acting on its holder alone reaches nobody**: Płomienne oczyszczenie, Dotyk anioła and
Ostatni ratunek.

Rejected: one run with a mark on each line saying which way it went. The two questions — what mine
did, and what was done to me — would be read off a glyph rather than off a heading.

Rejected: Fasada opieki and Przeszywająca skuteczność on the card of everyone they could have
reached. The message does not say who that was, and naming the first blow's other end would be a
guess presented as a count.

## Consequences

`FightStatistics.legendaryBonuses` holds both counts, still beside the rows and so outside the fight
file. Whom the two held bonuses reach stays unknown to the panel.
