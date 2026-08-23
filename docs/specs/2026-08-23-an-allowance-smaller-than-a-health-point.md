# An allowance smaller than a health point allows nothing

Status: implemented

Two recordings arrived on 2026-08-23 and one of them would not size its team
heals. The reason is not in the recording. `src/core/combatant-health.ts` grants
a reading an allowance expressed as a share of the pool, and compares it against
a quantity that is always a whole number — so on any pool under 20 000 the
allowance is smaller than the smallest thing it could ever admit, and the branch
holding it is dead.

## What the two recordings showed

`tests/captured-fights/2026-08-23-tempest-grupa-vs-hildur.json` is an ordinary
group fight: its opening snapshot is positive, entry health comes off it whole,
and all eleven combatants are read exactly.

`tests/captured-fights/2026-08-23-tempest-grupa-vs-hildur-auto.json` is the
auto-resolved one. The whole battle arrives in a single engine call and the first
snapshot after it has every player clamped to zero, so no entry health can come
from a snapshot at all — every one of them is unwound from the first **health
percentage** its messages state. A percentage carries two decimal places, which on
these pools is worth about a point and a half, and the reading lands within one of
the truth:

| combatant | unwound to | verdict |
|---|---|---|
| `445202`, `447544`, `466063`, `466476`, `467968` | exactly their maximum | read |
| `439250`, `441390`, `459132`, `466747` | their maximum − 1 | read |
| `441419` (maximum `18947`) | `18948` | **refused** |

Ten of the eleven entered a boss fight at full health, and the eleventh almost
certainly did too. What separates the last row from the four above it is nothing
about the fight — it is which side of the maximum a one-point rounding error fell
on.

## Why the refusal is unconditional below 20 000

`getEnteredHealth` reads:

```ts
if (unwound <= maximumHealth) return unwound;
return unwound - maximumHealth <= (STATED_PERCENT_TOLERANCE / 100) * maximumHealth
  ? maximumHealth
  : null;
```

Past the first line, `unwound - maximumHealth` is a positive **integer**: maximum
health is whole, and every health movement this meter decodes is whole — measured,
not assumed, over all 8 204 movements the twenty recordings decode as of
2026-08-23, none of them fractional. So the smallest value that expression can
take is `1`, and the allowance admits it only when

```
(0.005 / 100) × maximumHealth ≥ 1     ⟺     maximumHealth ≥ 20 000
```

Of the 66 distinct pools in the corpus, **43 are under that**. For every one of
them the second line is exactly equivalent to `return null`, and the whole reading
degrades to `unwound <= maximumHealth`. The allowance was written to absorb the
rounding of a stated percentage and it cannot absorb the only amount that rounding
can ever produce.

The sibling check `isWithinStatedHealth` looks like the same mistake and is not:
there a whole running total is compared against `(percent / 100) × maximum`, which
is continuous, so a sub-point window is meaningful and does its job. The
difference is that one comparison has a whole number on both sides and the other
does not.

## What it cost

The refusal is per combatant and final, so `441419` had no entry health for the
whole fight. They stand on the caster's side of all six `healall_per` casts, and
`composeCast` sizes only members it holds every input for — so every cast came out
short by one member and stayed counted as unaccounted (§9.6).

**No figure was wrong. A warning was.** With the entry health restored, all six
casts size all ten members, and `441419` receives exactly `0` from each — they
were still on their entry health when every cast landed, so the cap gave them
nothing. The panel had been reporting *healing this meter could not size* where
the answer was available and was zero, which is the one distinction §9.6 makes
about this screen: zero happened and measured nothing, unknown could not be read.

## The change

One floor, in `getEnteredHealth`:

```ts
Math.max(1, (STATED_PERCENT_TOLERANCE / 100) * maximumHealth)
```

An allowance denominated in health points is never less than one health point,
because health is whole. Measured over the twenty recordings held on 2026-08-23,
**one reading changes**: `441419` goes from refused to `18947`. Nothing else in
the corpus moves.

Clamping to the maximum cannot overstate anything. Maximum health is a ceiling the
game itself enforces, and the entry figure is used as the ceiling on restored
health — so this can only ever loosen a cap that was too tight, never invent room
that did not exist. That is the direction of error this project accepts; the other
one it does not (§9.6).

## What the corpus does not settle

Two mutations of the new line survive the gate and are recorded rather than
papered over (§7.5). Replacing the expression with a flat `1` reddens nothing, and
so does raising the floor to `2`.

The first says the share term is untested here, not that it is inert: it can only
matter to a combatant unwound from percentages on a pool past 40 000, and every
pool that large in this material belongs to a boss that states a snapshot instead.
It is kept because it is the derivation — a percentage to two places is worth that
much of the pool — and dropping it would leave a bare constant with no argument
behind it.

The second is inherent. The corpus holds exactly one reading at an overshoot of
one and none at two, so nothing in it can tell the two floors apart. The value is
derived from health being whole rather than fitted to the material, and no test
pretends otherwise.

## What is deliberately left alone

The four combatants unwound to `maximum − 1` keep that figure. The same
rounding produced them, but a combatant genuinely sitting one point below their
maximum is indistinguishable from one rounded there, and no evidence separates the
two. The error is bounded at one point per member per cast and runs in the
understating direction, which is the direction that is allowed to be wrong. Pulling
them up to the maximum would be a guess dressed as a reading.

## Rejected alternatives

**Widen `STATED_PERCENT_TOLERANCE` itself.** It would fix this and loosen every
other use of the constant, including `isWithinStatedHealth`, where the window is
correctly sized and the corpus does not exercise the correction at all. One
constant serving two comparisons with different arithmetic is what produced this;
raising it would spread the mistake rather than remove it.

**Floor both comparisons, from one shared reader.** Tried and measured: applying
the same floor to `isWithinStatedHealth` changes no reading anywhere in the corpus.
A shared reader would read tidier, but the two comparisons are not the same claim —
one is whole against whole, the other whole against continuous — and collapsing
them would hide the very distinction this document exists to record. §7.1: the
second consumer has to actually want the same thing.

**Retry a refused combatant against their next statement.** The refusal is final by
design, and the reason stands: a reading that contradicts itself says the unwind is
wrong, not that the statement was. That is a different defect from this one and
this change does not touch it.

**Take the entry health from the snapshot anyway.** The snapshot in that recording
is the game's clamp at zero, which says where somebody stands and not how much
reached them. `composeEntryHealthByCombatantId` already refuses it for that reason
and the reason has not changed.

**Leave it, and record the recording as a known exception.** This is what the round
of 2026-08-23 did as an interim, naming the recording in
`tests/core/combatant-health.test.ts` and `tests/core/fight-statistics.test.ts`.
It kept the gate honest but it wrote a defect of ours into two tests as though it
were a property of the material, and the next recording under 20 000 would have
joined it.
