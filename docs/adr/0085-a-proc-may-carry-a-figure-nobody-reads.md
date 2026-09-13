# 0085. A proc may carry a figure nobody reads

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

A blow announcing a deep wound carries `+wound`, valueless, and the panel draws it on the card as a
proc. A blow announcing a wound **something weakened** carries `+woundpoison` instead — the same
announcement from the same switch in the client, with a percentage written into a hole the sentence
closes with a `%`.

The proc reader took valueless keys only, so the second announcement never reached the card. What a
player saw therefore turned on a difference they could not see: two wounds on two blows, one drawn
and one absent, with nothing saying which had happened or why one row was shorter. `+woundpoison`
was read as a declaration instead, where the figure is kept and nothing draws it.

The figure cannot be read. Measured over
`captures/2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json`, 2026-09-11: all six occurrences
state `50`, the ticks that follow them state 177, 265, 353, 177, 265 and 177, and the blows they
ride carry `+dmgd` of 1139, 1284, 1205, 1952, 1292 and 1201. The figure moves with neither, so what
it is a share **of** is unsettled, and a share quoted against a wound would be a guess.

`docs/protocol-keys.md` carried this as an `[ASK]` rather than deciding it. The ask was put on
2026-09-13, in an audit round, and granted.

## Decision

**A proc is read as a proc whether or not it states a figure, and the figure is not read.**

The set is named rather than general: `PROCS_WITH_A_VALUE` in `src/core/fight-decoder.ts` holds
`+woundpoison` and nothing else, so every other member of `PROC_ENDS` still goes back to unread when
it arrives with a value. A `+crit=3` is a shape nobody has met and staying loud about it is the
point of the refusal.

The panel calls it `osłabiona rana`, its own word, fourteen characters under the column's bound of
twenty-two. The published help names nothing of the key (article `view,372`, read 2026-09-09), so
there is no name of the game's to take.

## Consequences

A weakened wound stands on the card beside an unweakened one, and a player reading two blows is told
the same thing about both.

It obliges the register to keep saying what the figure is not: the entry carries the six readings
above and quotes no share. The day the material settles what the percentage is taken off, reading it
is a new decision and not this one.

It also puts one exception into a reader that had none, which is a cost: `PROC_ENDS` no longer
answers "valueless" by itself, and a second key joining `PROCS_WITH_A_VALUE` needs the same
reasoning written down. The set is one line and is read both ways by the decoder's own assertion — a
key in it must be a key the proc table places.

## Alternatives

**Leave it a declaration and say so in the register.** Rejected: it leaves the hole where a player
can see it, and the entry saying why does not reach the panel.

**Read the figure as a share of the wound.** Rejected on the measurement above — it moves with
neither the tick nor the blow, so the share would be quoted against something nobody has identified.

**Take a value on every proc.** Rejected: it would read `+crit=3` as an ordinary critical and lose
the one signal that a shape nobody has met has arrived.

**Fold `+woundpoison` into `+wound` and draw one row.** Rejected: it puts a name this repository
chose on two of the game's own keys (**N13**), and the card would stop distinguishing a wound
something weakened from one nothing did.
