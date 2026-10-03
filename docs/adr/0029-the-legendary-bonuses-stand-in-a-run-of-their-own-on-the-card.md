# 0029. The legendary bonuses stand in a run of their own on the card

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

A person's card put a legendary bonus among what else fired, in the run of the end it belongs to
(`develop ADR 0032`): `+legbon_curse` and `+legbon_verycrit` under the striking run,
`-legbon_cleanse` and `-legbon_glare` under the struck one. Those four were the only bonuses
counted. The other six the protocol names reached the statistics and were counted by nothing:
`+legbon_holytouch`, `+legbon_anguish`, `+legbon_puncture`, `-legbon_critred` and `-legbon_facade`
ride a blow as declarations, and `legbon_lastheal` arrives as healing stated against a name.

Over `captures/` on 2026-10-03, replayed through `tallyFightStatistics`, the ten stand as many times
as the `_Shape:_` lines of `docs/protocol-keys.md` count them. Two of them never stand twice on one
combatant in one fight: `-legbon_facade` (17) and `+legbon_puncture` (11). The client's dictionary,
build `1785244275300`, words both as lasting to the end of the fight.

## Decision

Decided with the maintainer on 2026-10-03.

**Every legendary bonus is counted on the combatant it belongs to, and the card reads them in one
run of their own.** Whose each one is comes from one table in `src/core/protocol-key.ts`, never from
the sign, and the run stands after the two blow runs. A reader asking what their bonuses did reads
one place, where before they had to know at which end each one fires.

**A bonus held for the whole fight is named once, in a sentence, and never counted.** A count of
`-legbon_facade` would read as one firing where the bonus stood throughout.

**The counts stand beside the rows of `FightStatistics` and never on them.** A row is what the fight
file writes down, and its type follows `CombatantFigures`; the file keeps its format.

Rejected: leaving each bonus in its end's run and counting the other six there. A reader would still
have to split one question over two headings, and the held two would sit as counts among procs.

Rejected: a count of `×1` for the held bonuses. It says something happened once.

Rejected: the counts as a field of `CombatantFigures`. It would change the file format, which
`AGENTS.md` lists under **Ask first**, and the maintainer chose to keep it.

## Consequences

The striking and struck runs no longer name any legendary bonus. A fight file is written as before,
so a file states no count of bonuses. Whether a blow struck at several targets repeats a bonus is
not measured: no recording in `captures/` is known to carry one.
