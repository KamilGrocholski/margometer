# The side is named, and the share is stated

Status: implemented

This supersedes one row of
`docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md` — the survey there
lists *a heal reaching a whole side* as **refused — read, never sized**. It is
sized now, and the reason it was refused turned out to be about this repository
rather than about Margonem.

## What was asked for

> Fix understated healing data — healed n times the whole team without a given
> amount

That sentence is the panel's own. `src/ui/panel-view.ts` drew
`Leczenie całej drużyny N razy bez podanej liczby — leczenie jest zaniżone.`, and
it was true: **1 604 444 points of healing across the corpus reached no row at
all** — more healing than the panel was reporting in total.

## What the protocol states, and what it does not

`healall_per` states a **share** and names only the caster:

```
469657=87.63;469657=87.63;tspell=…;skillId=79;healall_per=30
```

Read the **actor** slot for the caster. It is usually the target too, but four of
the 85 casts in the corpus state a different id there, so reading the target slot
would credit the wrong combatant four times.

The arithmetic was already measured green in `tests/core/team-heal-rule.test.ts`:

```
restored = min( floor(share/100 × maximumHealth),
                max(0, entryHealth − currentHealth) )
```

for every side-mate of the caster who is standing, nobody on the other side. The
share the protocol states is already weakened — `30 → 22.5 → 15` grouped by
caster, the first terms of `1 − 0.25n`.

## The four clauses the help states, and what closes each

Article `view,372`, `pasywny healall_per`, read 2026-08-18.

| clause | closed by |
|---|---|
| a share of the whole team's maximum | the roster's `maximumHealth` |
| weakens 25% of base per use | nothing — the protocol states the **result** |
| cannot restore past the health the fight began with | the entry health, unwound |
| halved where the caster has no allies | the roster: refuse unless a side-mate other than the caster is standing |

And a fifth the entry names: reducible by `lowheal_per-enemies`. Two findings
settled it.

**`heal_per-enemies` is not a reducer of this key.** The reducer's own help entry
names what it reduces — `healall_per`, `heal_per`, `combo_heal_per` — and
`heal_per-enemies` is in none of them; it modifies the healing that comes off
equipment, a different bullet of the help's own account of where health comes
from. Half the clause closed by citation, no code.

**`lowheal_per-enemies` is announced in the protocol.** Production build
`1786514810315` composes it in the battle-log switch as
`_t("msg_lowheal_per-enemies val", {"%val%": …})` — a message carrying a figure,
the shape its sibling `poison_lowdmg_per-enemies` arrives in and this decoder
already reads. So a fight whose messages never mention it is a fight where the
reduction was not in play, and *not carried* stops being *not noticed*. The key
itself stays unread: no capture holds one, and reading a shape never seen would be
describing a message we have never met (§5). One occurrence anywhere in a fight
refuses every cast in it.

## Where the arithmetic lives, and why not in the decoder

`src/core/combatant-health.ts`, consumed by `composeFightStatistics`.

`src/game/battle-session.ts` decodes **incrementally**: it appends the events of
new messages and freezes them. A decoder carrying running health would answer
differently depending on how the game happened to split its payloads, permanently
— and its one piece of state is deliberately bounded to "exactly one message
forward". Entry health is not knowable until the opening payload's events exist,
which is *after* `decodeFight` has run on them.

The fold is rebuilt from every event on every payload, in message order. Same
events, same roster, same entry health in, same statistics out. That property is
what makes the incremental/from-scratch split safe, and a stateful decoder would
have destroyed it.

## Entry health is unwound, not read

**The health first seen is not the health entered with.** The payload that opens a
fight carries that payload's own messages, and the warriors it states are the
state *after* them. `2026-08-14-tempest-grupa-vs-hildur` opens with the boss
casting at the whole side — one message, ten `+oth_dmg` figures — before any
snapshot exists.

Read naively, **0 of 85 casts** can be sized. Unwound —
`entry = stated − everything decoded up to that point` — that fight returns all
eleven combatants at exactly their maximum.

⚠️ **And the snapshot is not the earliest thing a fight says.** Unwinding the
snapshot alone reaches 71 of 85, and refuses two captures outright:
`2026-08-15-tempest-grupa-vs-draugr-1` and `2026-08-15-tempest-grupa-vs-hildur-1`
open with 297 and 354 messages and no snapshot beside them, so the first snapshot
sits *after* eight casts nothing can size — and an unwind cannot pass through
health it does not have.

The messages in that opening state health percentages of their own, and in both
captures **every one of the eleven combatants is stated before the first cast**.
So the anchor is the first statement about each combatant, whichever kind it is,
and the snapshot is the fallback for whoever the messages never name. That reaches
**all 85**.

Five of those eleven are first named by a `step` or by a skill announcement —
messages with no figure of their own — which is why `DeclarationEvent` and
`SkillUsedEvent` carry a health percentage now. It is the only thing they state.

⚠️ **The snapshot still wins wherever it can be used, and the order is measured.**
It states whole health; a percentage states two decimal places of a pool in the
tens of thousands. Preferring the percentage put three of 110 readings a point
wrong — the error lands on the cap, exactly as it does in the resync. The
statement is a rescue for the case the snapshot cannot answer, never an
improvement on it.

It refuses rather than guesses: a combatant whose first statement comes after a
figure we cannot size, or with no maximum known, or unwound above the maximum, or
to nothing at all.

## The stated percentage is a bound, not a value

The cap needs to know where somebody stands, so a running health total is carried
the length of the fight. The protocol restates a combatant's health every time it
names them, which is the only thing that can *contradict* that total — an unread
movement leaves no other trace.

Two places against a pool in the tens of thousands quantises to about a point and
a half, and that lands squarely on the cap term. So a stated percentage `p` is
read as the interval `[(p−0.005)/100·m, (p+0.005)/100·m]`: the running total is
**kept** where it lies inside, and replaced only where it falls outside.

| variant | readings matching the snapshots |
|---|---|
| running total + bounded resync | **110 of 110, worst error 0** |
| unconditional resync | 102 of 110, 8 wrong by a point |
| no resync at all | 110 of 110 |

Never a resync at `p ≤ 0`: a combatant the game has clamped to zero says where
they are, not how much reached them.

⚠️ **The third row is the honest one and it was nearly written down wrong.** The
corpus does not distinguish the bound from having no resync at all, because every
health movement in every capture is one the decoder reads — nothing has ever
drifted. What the resync is for is the case the material has not produced: health
that moved for a reason we could not read, which a running total cannot notice on
its own and which the cap is then taken against. That is held by a hand-built
fight, not by a recording, and this row says so rather than implying a measurement
that does not exist (§3).

Against §7.1 — *nothing exists before it is needed* — this is the one piece of
machinery here the captures do not require. It is kept because the running total
is the input to a cap, an undetected drift moves a figure nobody could check, and
the decoder reading every health-moving key is an assumption the health witness
re-earns every run rather than a fact. Worth revisiting if it ever costs anything.

## What it comes to

- **All 85 casts sized**, 850 recipients, **1 604 444 points** recovered. No
  capture is left warning about healing it could not place.
- **110 of 110** isolable readings equal the health the snapshots record, exactly.
  The reader never sees a snapshot — it seeds once from an unwound entry health and
  carries a running total — so that is two independent routes to one number.
- **The health witness stopped skipping these calls and agrees.** Coverage rose in
  twelve of the fourteen fights carrying the key (790 → 945, 392 → 624, 679 → 825,
  …) with no disagreement anywhere. Those calls used to be declined outright. The
  two that did not move are the two with no entry health, whose casts are still
  unsizeable.
- The panel's warning now fires in two of the fourteen fights that carry a cast,
  and falls silent in the other twelve.
- Total healing over the corpus: **1 145 411 → 2 462 651**. The rise is exactly the
  sum of the sized figures, which is what says nothing was counted twice.

## The partial answer

A cast sized for six of eight side-mates draws the six **and** keeps its
`unaccounted-health` event, so the reading downstream still counts the fight as
having healing it could not place. A cast sized for nobody draws nothing. A share
of `0` — four occurrences — sizes everyone at zero and is a *whole* answer:
nothing is missing, so nothing may warn.

## Rejected alternatives

**Measuring the residual across engine-call snapshots.** Exact and free of every
help clause, but the session keeps a flat message list: call boundaries and
per-call health would have to be plumbed from `game` into `core`. Too invasive for
what the arithmetic already gives.

**A `HealthStatedEvent` per side segment.** More faithful to what the client does
— it applies the percentages before it looks at a single key — and measured
identical at 110 of 110. It roughly doubles the event list a 6 030-message fight
keeps, for no gain.

**Sizing inside the decoder.** The append path would freeze a partial answer, and
the answer would depend on how the game split its payloads.

**Charging the recipients without the caster.** The protocol names the caster in
the actor slot. Leaving them uncredited would be refusing a reading the game
actually states.

## Cost

`src/game/battle-session.ts` asks for a measurement before the aggregate side
grows, so here it is, and it is two numbers rather than one.

`bun run cost`, whole-fight time summed over every capture: **272.09 ms → 380.02
ms**, about 40% more. That is the batch figure — every payload of every capture
replayed back to back — and it is the honest headline for the arithmetic.

The figure a player feels is the worst single payload, and it does not move:
**2.33 ms before, 1.94 ms after**, the difference being run-to-run jitter on a
number that small. A turn-based game sends a payload every few seconds.

⚠️ **The cost is in `getHealthReadingOfEvent`**, which allocates two arrays per
event so that the two walks over a fight cannot disagree about which end of a
message an event belongs to. That was a deliberate trade: the walks were written
out twice first, and one of them was wrong. If the batch figure ever matters, the
fix is to hand the reader somewhere to write rather than to inline the switch
again.
