# 0113. Dotyk anioła counts the heals it has given, not the turns it has left

- **Status:** Superseded by 0116 in part
- **Date:** 2026-09-23

## Context

**ADR 0112** kept two rows in a fighter's tooltip that count turns, a provocation and Dotyk anioła,
both as **ADR 0109**'s `N z M tur`, what is left. For Dotyk anioła, what is left was the published
three turns less the holder's own turns since the blow that lit it.

The help says the effect is _rozłożony na 3 tury, którego każde wyzwolenie leczy Postaci 6% puli
punktów zdrowia_ (article `view,372`, read 2026-09-21). Each trigger arrives as a heal of its own,
`legbon_holytouch_heal` (`docs/protocol-keys.md`). The countdown did not use them. It counted turns,
and the effect is measured in heals.

Measured over `captures/`, 35 recordings, 2026-09-23. The walk ran through
`src/game/fight-underway.ts` payload by payload, and the holder's clock was the one the add-on
keeps:

- **Every heal is on the wire.** 70 lightings and 171 heals. No heal arrived without a lighting
  before it. 112 of the heals were for nought, on a holder already at full health, and they arrive
  all the same, so a count of them never skips one.
- **The heals do not keep to the holder's turns.** The third heal arrived one to four of the
  holder's turns after the lighting: 1, 14, 24 and 3 runs. In 7 runs it came inside the lighting's
  own payload, all three heals at once.
- **The countdown disagreed with the heals it was standing in for.** On 37 payloads all three heals
  had already been given and the row still stood. On 9 of those it read `3 z 3 tur`.
- **A run is cut short in two ways, and both are visible.** 9 runs were restarted by a second
  lighting after one or two heals. 12 were still open when the fight ended, at most two of the
  holder's turns after the lighting. 49 gave all three heals.

## Decision

**The Dotyk anioła row counts up, in heals**: `Dotyk anioła · 1 z 3 uleczeń`, where the first figure
is the heals the current run has given and the second is the three the help gives one lighting
(`HOLYTOUCH_HEALS_STATED` in `core/legendary-standing.ts`). The row stands at `0 z 3` from the
payload that lit it, and it goes on the payload that carries the third heal. A second lighting
restarts the count at nought.

**The provocation row keeps ADR 0109's shape**: turns, counting down. Its end is announced nowhere,
and what a held fighter asks is how long they still have to answer. The two fractions stand a row
apart in one tooltip, and the noun keeps them apart.

**The walk no longer reads the holder's clock.** `addPayloadToLegendaryStandings` and
`composeLegendaryStandings` no longer take `turnsByCombatantId`, and `LegendaryStanding` carries
`holytouchHealsGiven` in place of `holytouchTurnsElapsed`. This is a change to what flows from
`core/` to the tooltip, asked for by the maintainer, 2026-09-23.

This supersedes **ADR 0112** for Dotyk anioła. For the provocation, 0112 still binds.

## Consequences

Easy: the row says only what the game has already done. Each heal it counts is a message on the
wire, including a heal for nought.

Easy: the legendary walk no longer depends on the order it is fed in relative to the status walk,
which advances the clock.

Hard: a run the game ends early for any reason but a new lighting or the end of the fight would
stand at its count until the fight ends. Nothing announces such an end. No run over `captures/` did
this: every short run was one the fight ended inside.

Also: `tests/game/fight-underway.test.ts` replays every recording through the decoder and asks for
each count under three and never three. That holds the key the decoder emits to the key the walk
counts. The walk's own tests cannot: they compose the heal themselves, so a test and a walk spelling
the key the same wrong way agree.

## Alternatives

**Keep the countdown and end the row on the third heal.** That keeps two clocks for one effect. The
turn half is still the one that disagreed with the heals, and a reader would see a figure move on a
turn and the row go on a heal.

**Count the heals down**: `zostały 2 uleczenia`. It is just as witnessed at every step, but at the
lighting it promises three heals the game has not given yet. A fight that ends first, or a second
lighting, breaks that promise, and it happened in 21 runs. Counting up claims nothing that has not
happened.

**Keep a turn bound as a backstop**, ending the row after some number of the holder's turns without
a heal. No measured run needed it, and the number would be one this panel made up.

**Draw nothing until the first heal.** The effect stands from the lighting, and the first heal came
in the same holder turn in 29 of 66 runs. `0 z 3` is the true answer at the lighting and costs one
row.

**Sum what the heals gave.** `design/dymek/` rejected that first, and the reason still holds: two of
three triggers heal for nought, so the sum says how hurt the holder was, not how far the effect has
run.
