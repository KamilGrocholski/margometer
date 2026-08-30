# 0022. A tick belongs to the wound that is ticking

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

`+injure` announces a deep wound inside the blow that left it, naming both ends. `injure` is that
wound ticking afterwards, in a message of its own, naming only the victim. They are different keys
and only the second moves health.

Until this decision nothing read the second past the health it moved, so every tick stood against
its victim and was **dealt by nobody**: measured over `captures/` on 2026-08-30, 28,521 points over
184 ticks in 13 of the 28 recordings, out of 637,599 that stood against nobody in all. Every
attacker who ever wounded was short by what their own wounds ticked for, and the panel said a total
was short without saying whose it was.

The join is available in the material. The game's published help, article `view,372` at the engine
name `injure` (read 2026-08-18), states that the damage does not accumulate and is overwritten by
the freshest value applied to that opponent — so a victim carries one wound at a time. Measured over
`captures/` on 2026-08-30: 76 wounds, every one of them naming an attacker, a victim and a figure;
184 ticks, every one landing on a victim already carrying a wound and stating **exactly** the figure
that wound announced. `captures/2026-08-15-tempest-grupa-vs-hildur-3.json` carries one victim
wounded by three different attackers, which is what makes _freshest_ a claim rather than a
coincidence.

## Decision

The freshest `+injure` against a victim is the wound that is ticking. An `injure` tick is charged to
the attacker who left that wound — on both rows, cut by the other end and by the key it moved under
— **when the tick states the figure that wound announced**. A tick stating anything else is charged
to nobody, as before.

It reaches neither count of blows and neither hardest blow. What ticks after a swing is not a swing,
and those two figures name one.

**The join is `core/fight-statistics.ts`'s, not the decoder's.** `game/battle-session.ts` decodes
each payload as the game delivers it, so the decoder never sees more than one payload at a time —
and a wound announced in one payload ticks in later ones. The statistics see the whole fight in
order, which is the smallest place the register can live.

## Consequences

Every point a wound ticked for now stands on the row that dealt it: 28,521 of 28,521 placed, none
left over, on 19 attacker rows over `captures/`, 2026-08-30.

A boss that both strikes and wounds now puts **two** kinds under its own row on each victim, so a
pair that used to hold one row holds two — and a pair holding more than one row opens. On
`captures/2026-08-06-tempest-grupa-vs-hildur.json` every pair on both damage screens opens, where
some did not before. Which rows open is measured rather than remembered (`docs/drill-levels.md`),
and two tests that needed a pair of each kind moved to material that still carries both.

It obliges the tick to keep stating its wound's figure. The day the game changes that, the join
stops being taken and the figures go back to standing against nobody rather than against a guess —
which is the failure being loud rather than silent, and `tests/core/injure-rule.test.ts` holds both
sides of it.

## Alternatives

**Make the join in the decoder.** It is where a key's meaning lives, and it is where the register
would be smallest. It cannot hold the state: decoding is per payload, and a wound outlives one.

**Charge the tick to the nearest attacker whatever figure it states.** It would place a handful more
points and would be a guess wearing a measurement's clothes — the figure is the only thing tying a
tick to one wound rather than to another, and a victim wounded by three attackers is exactly where
it would go wrong.

**Count the tick as a blow struck.** It would move the count of blows, the share of them that landed
critically and the hardest blow, all three of which answer questions about swings. A wound ticking
is not a swing.
