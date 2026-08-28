# Sizing a share onto a side

Status: implemented

`healall_per` states a **share** of a whole side's health and names only the
caster. This is how that becomes a figure per member, which inputs are refused
rather than defaulted, and which casts are not sized at all.

Three rounds between 2026-08-18 and 2026-08-27 arrived at this. AGENTS.md §9.6
carries the rule; what is here is the arithmetic, the material behind it, and the
alternatives that were rejected.

---

## 1. What the protocol states

```
469657=87.63;469657=87.63;tspell=…;skillId=79;healall_per=30
```

The **actor** slot is the caster. It is usually the target too, but four of the
85 casts in the corpus state a different id there, so reading the target slot
would credit the wrong combatant four times.

The share the protocol states is already weakened — `30 → 22.5 → 15` grouped by
caster, the first terms of `1 − 0.25n`.

## 2. The arithmetic, and the four clauses it closes

```
restored = min( floor(share/100 × maximumHealth),
                max(0, entryHealth − currentHealth) )
```

for every side-mate of the caster who is standing, and nobody on the other side
(`tests/core/team-heal-rule.test.ts`).

Article `view,372`, `pasywny healall_per`, read 2026-08-18:

| clause | closed by |
|---|---|
| a share of the whole team's maximum | the roster's `maximumHealth` |
| weakens 25% of base per use | nothing — the protocol states the **result** |
| cannot restore past the health the fight began with | the entry health, unwound |
| halved where the caster has no allies | the roster: refuse unless a side-mate other than the caster is standing |

**Having the formula is what makes this a reading rather than a share-out.**
Nothing is apportioned and no member's figure is inferred from another's.

### Where it lives, and why not in the decoder

`src/core/combatant-health.ts`, consumed by `composeFightStatistics`.

`src/game/battle-session.ts` decodes **incrementally**. A decoder carrying
running health would answer differently depending on how the game happened to
split its payloads, permanently — and entry health is not knowable until the
opening payload's events exist, which is *after* `decodeFight` has run on them.
The fold is rebuilt from every event on every payload: same events, same roster,
same entry health in, same statistics out.

## 3. Entry health is unwound, not read

**The health first seen is not the health entered with.** The payload that opens
a fight carries that payload's own messages, and the warriors it states are the
state *after* them. `2026-08-14-tempest-grupa-vs-hildur` opens with the boss
casting at the whole side — one message, ten `+oth_dmg` figures — before any
snapshot exists.

Read naively, **0 of 85 casts** can be sized. Unwound —
`entry = stated − everything decoded up to that point` — that fight returns all
eleven combatants at exactly their maximum.

⚠️ **And the snapshot is not the earliest thing a fight says.** Unwinding the
snapshot alone reaches 71 of 85 and refuses two captures outright:
`2026-08-15-tempest-grupa-vs-draugr-1` and `2026-08-15-tempest-grupa-vs-hildur-1`
open with 297 and 354 messages and no snapshot beside them, so the first snapshot
sits *after* eight casts nothing can size — and an unwind cannot pass through
health it does not have.

The messages in that opening state health percentages of their own, and in both
captures every one of the eleven combatants is stated before the first cast. So
the anchor is the first statement about each combatant, whichever kind it is, and
the snapshot is the fallback for whoever the messages never name. That reaches
**all 85**. Five of those eleven are first named by a `step` or by a skill
announcement, which is why `DeclarationEvent` and `SkillUsedEvent` carry a health
percentage — it is the only thing they state.

⚠️ **The snapshot still wins wherever it can be used, and the order is measured.**
It states whole health; a percentage states two decimal places of a pool in the
tens of thousands. Preferring the percentage put three of 110 readings a point
wrong. The statement is a rescue for the case the snapshot cannot answer, never
an improvement on it.

### The allowance that allowed nothing

`getEnteredHealth` granted an unwound figure sitting *above* the maximum an
allowance expressed as a share of the pool, and compared it against a quantity
that is always whole:

```
(0.005 / 100) × maximumHealth ≥ 1     ⟺     maximumHealth ≥ 20 000
```

Maximum health is whole, and every health movement this meter decodes is whole —
measured over all 8 204 movements the twenty recordings decoded as of 2026-08-23,
none of them fractional. So the smallest value the comparison can take is `1`,
and of the 66 distinct pools in the corpus **43 are under 20 000**. For every one
of them the branch was exactly equivalent to `return null`.

It cost one combatant on `2026-08-23-tempest-grupa-vs-hildur-auto.json` — unwound
to `18948` against a maximum of `18947` — their entry health for the whole fight,
which left all six of that fight's casts short by one member and counted as
unaccounted. **No figure was wrong. A warning was.** With the entry health
restored, all six casts size all ten members and that combatant receives exactly
`0` from each: they were still on their entry health when every cast landed.

The sibling check `isWithinStatedHealth` looks like the same mistake and is not —
there a whole running total is compared against `(percent / 100) × maximum`, which
is continuous. The difference is that one comparison has a whole number on both
sides and the other does not.

## 4. The stated percentage is a bound, not a value

The cap needs to know where somebody stands, so a running health total is carried
the length of the fight. The protocol restates a combatant's health every time it
names them, which is the only thing that can *contradict* that total.

Two places against a pool in the tens of thousands quantises to about a point and
a half, which lands squarely on the cap term. So a stated percentage `p` is read
as the interval `[(p−0.005)/100·m, (p+0.005)/100·m]`: the running total is **kept**
where it lies inside, and replaced only where it falls outside. Never a resync at
`p ≤ 0` — a combatant the game has clamped to zero says where they are, not how
much reached them.

| variant | readings matching the snapshots |
|---|---|
| running total + bounded resync | **110 of 110, worst error 0** |
| unconditional resync | 102 of 110, 8 wrong by a point |
| no resync at all | 110 of 110 |

⚠️ **The third row is the honest one.** The corpus does not distinguish the bound
from having no resync at all, because every health movement in every capture is
one the decoder reads — nothing has ever drifted. What the resync is for is the
case the material has not produced: health that moved for a reason we could not
read. That is held by a hand-built fight, not by a recording, and this row says
so rather than implying a measurement that does not exist (§3).

Against §7.1 this is the one piece of machinery here the captures do not require.
It is kept because the running total is the input to a cap, an undetected drift
moves a figure nobody could check, and the decoder reading every health-moving key
is an assumption the health witness re-earns every run rather than a fact.

## 5. Which side a reducer reaches

`lowheal_per-enemies` is an effect the help says lowers this healing. It names
`healall_per`, `heal_per` and `combo_heal_per` as the three it reduces, and the
help does not say whether the protocol states the share before or after the
reduction — so a fight mentioning it anywhere once had **every** cast in it
refused.

That was too much, and the first material to carry the key showed it.
`tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon-2.json` had all three of
its casts refused and its two casters' rows marked, while **one of its own party**
was the one casting the reducer, at the monster.

Article `view,372` at the engine name `lowheal_per-enemies`, read 2026-08-27: the
effect lowers the healing active-skill effects give every character on the
**opposing** team, applied and fired on the initiation layer at the opponent. The
`-enemies` suffix is the one `active_decblock_per-enemies` uses for the same
distinction, and the protocol names the caster on the announcement the
declaration rides — so the side the effect reaches is stated, not inferred.

**The material turns that citation into a reading.** Two of that recording's
three casts stand alone in their engine call, so the health each of the ten
members moved can be compared against the snapshots on either side.
**Twenty comparisons, every one exact, with the share applied unreduced**
(`tests/core/combatant-health.test.ts`). The three shares stated are 30, 30 and
22.5 — and 22.5 is 30 less a quarter of it, the article's own rule, not `27`
applied to anything. Had the reduction reached this side and the protocol not
pre-applied it, those twenty figures would each be short by 27%.

The measurement says nothing whatever about a cast on the side the reduction
**did** reach. No recording anywhere holds one, and that case is still refused.

### The rule, and its four limits

A cast is refused where a reducer of the same fight was declared from a side
other than the one it was cast on. Each limit is a refusal:

- **A reducer this reader cannot place reaches every side** — the fight-wide
  refusal exactly as it stood. Two ways in: an occurrence whose caster the roster
  cannot resolve, and one arriving among an `unknown-message`'s unread keys,
  which names the ends of its message without saying which slot each came from.
- **Every other side, not "the other one".** The protocol states a side as a bare
  number and never how many there are (§10), so a fight holding three has all but
  the caster's own refused.
- **Fight-wide in time.** One occurrence disqualifies its sides for the whole
  fight and not for the casts after it: the effect is declared once and applies
  from the initiation layer.
- **Both shapes are still read** — the declaration and the unread key — so
  removing the key from `SKILL_DECLARATION_KEYS` cannot switch the refusal off in
  silence.

`heal_per-enemies` is **not** a reducer of this key: the reducer's own help entry
names what it reduces and that is not among them. Half the clause closed by
citation, no code.

`[ASK]` before a second reducer key joins it.

## 6. A partial answer stays partial

A cast sized for six of eight side-mates draws the six **and** keeps its
`unaccounted-health` event, so the reading downstream still counts the fight as
having healing it could not place. A cast sized for nobody draws nothing. A share
of `0` — four occurrences — sizes everyone at zero and is a *whole* answer:
nothing is missing, so nothing may warn.

## 7. What it came to

- **All 85 casts sized**, 850 recipients, **1 604 444 points** recovered.
- **110 of 110** isolable readings equal the health the snapshots record,
  exactly. The reader never sees a snapshot — it seeds once from an unwound entry
  health and carries a running total — so that is two independent routes to one
  number.
- **The health witness stopped skipping these calls and agrees.** Coverage rose
  in twelve of the fourteen fights carrying the key (790 → 945, 392 → 624,
  679 → 825, …) with no disagreement anywhere. The two that did not move are the
  two with no entry health.
- Total healing over the corpus: **1 145 411 → 2 462 651**, the rise being exactly
  the sum of the sized figures — which is what says nothing was counted twice.

### Cost

`bun run cost`, whole-fight time summed over every capture: **272.09 ms → 380.02
ms**, about 40% more. That is the batch figure. The figure a player feels is the
worst single payload, and it does not move: **2.33 ms before, 1.94 ms after**, the
difference being run-to-run jitter on a number that small. A turn-based game sends
a payload every few seconds.

⚠️ **The cost is in `getHealthReadingOfEvent`**, which allocates two arrays per
event so the two walks over a fight cannot disagree about which end of a message
an event belongs to. A deliberate trade: the walks were written out twice first,
and one of them was wrong. If the batch figure ever matters, the fix is to hand
the reader somewhere to write rather than to inline the switch again.

## Rejected alternatives

**Measuring the residual across engine-call snapshots.** Exact and free of every
help clause, but the session keeps a flat message list: call boundaries and
per-call health would have to be plumbed from `game` into `core`.

**A `HealthStatedEvent` per side segment.** More faithful to what the client does
— it applies the percentages before it looks at a single key — and measured
identical at 110 of 110. It roughly doubles the event list a 6 030-message fight
keeps, for no gain.

**Sizing inside the decoder.** The append path would freeze a partial answer, and
the answer would depend on how the game split its payloads.

**Charging the recipients without the caster.** The protocol names the caster in
the actor slot; leaving them uncredited would refuse a reading the game states.

**Leaving the reducer refused fight-wide.** Honest, and also wrong about the one
fight that carries it: it counts healing as unsizable while the snapshots size it
exactly, and marks two players' rows for a shortfall that is not there. §9.6's
warning-on-a-row exists so a figure that is short says so; a warning on a figure
that is whole spends the same credit and cannot be told apart from the real thing.

**Applying the reduction ourselves where it does reach a side.** The help does not
say whether the protocol states the share before or after it, and a share reduced
twice is as wrong as one not reduced at all — in the direction the panel cannot
mark.
