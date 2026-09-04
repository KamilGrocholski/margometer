# 0052. The protocol names nobody for a status, and the panel says nothing

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

The maintainer's list asked who applied each effect. **ADR 0050** reads what is standing; this is
whether it can say who put it there.

The mask carries no caster. So the question is whether one can be inferred from what arrives beside
it, and there are two roads, because the two families are different things: a wound arrives as a key
on somebody's blow, and a slow as a skill somebody announced. Both were measured over all 457
moments a bit turns on in `captures/`, taking the payload the mask changed in and the one before it,
on 2026-09-03:

| bit | status       | episodes | by skill | by key |
| --: | ------------ | -------: | -------: | -----: |
|   0 | `deep_wound` |        4 |        0 |      2 |
|   1 | `wound`      |       39 |        0 |     16 |
|   3 | `poisoned`   |       48 |       10 |      1 |
|   4 | `fire`       |        5 |        2 |      0 |
|   5 | `swow_down`  |      130 |       33 |      3 |
|   6 | `speed_up`   |      223 |       70 |     11 |
|   8 | `shock`      |        7 |        1 |      0 |

Each column counts the episodes naming **exactly one** caster. The best is `speed_up` by skill, at
70 of 223, and 34 of the remainder name several.

The reason is in the material, not in the reading. **When a bit turns on, no message targeting the
bearer says so.** The keys standing on those messages are `tspell`, `skillId`, `+dmg`, `-dmg`,
`+dmgd` and `+crit` — a blow, and nothing naming what it left behind. The bit is the client being
told the result; the protocol never reports the cause.

## Decision

**The panel names no caster for a status, and says nothing about one.** No column, no sub-line, no
"probably". A status stands under its own name and its length, and that is the whole of it.

**The measurement stays, and is re-earned on every gate.** `docs/statuses-standing.md` carries both
columns and `tests/tools/status-standing.test.ts` holds the document to the recordings both ways. A
refusal recorded once and never re-measured is how a "we checked" outlives the check.

**The bar is ADR 0049's, and it is stated rather than felt.** That record rejected an attribution
measured at **84.6%** with the sentence this one is held to: wrong on one row in six is not a figure
to draw. Nothing here reaches a third of that.

**A family that later clears it ships alone.** The register is per bit for that reason: this is not
one verdict about statuses, it is seven, and material naming a cause would move one of them without
moving the others.

## Consequences

Easy: nothing on screen can be wrong about who did what, because nothing on screen claims it.

Hard: the feature as asked for is not delivered whole, and the half that is missing is the half a
player would most like. `docs/statuses-standing.md` says which half and why, so the question is not
asked again from memory.

Also: `by key` reads 16 of 39 for `wound`, which looks like a signal and is not. A first, looser
measurement over whole message text put that family at 94.9% and was an artefact of matching the
word `wound` anywhere in a line — including in keys that are ordinary damage. The careful reading
matches a parsed key against a family and requires the message to name the bearer as its target. The
looser number is written down here because it is the mistake this shape invites.

## Alternatives

**Charging it to the nearest attacker.** **ADR 0022** rejected exactly this for a tick, in the words
that fit here: a guess wearing a measurement's clothes.

**Widening the window past one payload.** It raises the count naming _someone_ and lowers the count
naming _one_ — at two payloads `speed_up` already names several 34 times. A wider window names
whoever cast anything at all.

**Naming a caster only where a family names exactly one.** The honest version, and it draws a caster
on 116 of 457 episodes and leaves 341 blank. A column that is empty three times in four is a column
about our reading rather than about the fight.

**Waiting for more material.** Reasonable, and it is what the register is for — but the shape of the
failure is not a thin corpus. It is that the protocol states the effect and never the cause.
