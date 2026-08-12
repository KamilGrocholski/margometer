# Turns the messages carry

Status: implemented

Supersedes one section of `docs/specs/2026-08-12-the-turn-axis.md` — *"What is a
measurement and what is the game's forecast"*. Everything else that file decides
stands: the divisor is still the reader's to pick, the control is still the
`Sumy` · `Na turę postaci` · `Na turę walki` strip, and a fight the game numbered
only once still has no rate at all.

That file established the fight's turn count as the span of ordinals the game
states, and that half is untouched. Its other half — *who took which turn* — it
took from the same envelope field's forecast. This file replaces the source of
that half with the messages.

## What was wrong

`turns_warriors` is ten entries wide, and the two halves of it are not the same
kind of claim:

- Its **least entry** is the turn being taken. It equals the envelope's `current`
  in **374 of 374** payloads across the corpus, and it rises strictly across all
  **367** transitions. That is a statement.
- Its **other nine** forecast who acts on turns not yet taken. Measured against
  the ordinals later seen: right 45/45 for the very next turn, **84/96** further
  out. That is a prediction.

Per-combatant turns came from the second. So a row could be credited with a turn
on the strength of a schedule, and an ordinal the forecast never reached counted
as *nobody's* even where the fight plainly narrates who acted in it. On
`2026-08-12-tempest-grupa-vs-draugr-1` that was **29 turns of 198** filed as
nobody's; the messages account for every one of them.

## Where a turn boundary actually is

**Not in any key.** Measured over all seven captures — 2631 messages, 81 distinct
keys, against the 236 the client branches on — nothing names a turn, a round, an
end or a next. `step` is the only key shaped like one and it is not one: 64
occurrences against 1228 turns, 23 of them in a fight numbered over 283 turns,
and `2026-08-11-tempest-tancerz-vs-wermont` runs start to finish without a single
one.

**It is who is speaking.** The consecutive messages one combatant is the actor of
are one turn's narration — a **run**. Two measurements make runs usable:

- The first message of a payload is spoken by the combatant the **previous**
  payload named as acting — **367/367**. So a payload narrates the turns from the
  one that was in progress up to the one it now states.
- A message naming nobody **continues the run it follows**. Giving it a run of its
  own attributes 1025 of 1228 ordinals and leaves 37 payloads unreconciled;
  continuing the run attributes **1202** and leaves **3**. The mechanism is a mass
  stun in `2026-08-12-tempest-grupa-vs-draugr-2` call 37 — regeneration tick,
  `0;0` line, next combatant's tick, `0;0` line, thirteen times over — where the
  line marks the turn that just happened rather than a turn of its own. It also
  means the end-of-fight keys need no special case: they name nobody, so
  structurally they open nothing.

## Numbered, never counted

⚠️ **A run count is not a turn count**, and reading it as one is a mistake this
project has already paid for. The previous incarnation counted an uninterrupted
stretch of one combatant's actions as a single turn and read eight attacks as
four, doubling every rate — its own aggregate carries the tombstone comment, on
the `main` branch, which is where that tree still lives. A combatant can take two
turns in a row — both solo captures show `{"1": …, "2": …}` naming the same
combatant — and no run boundary exists between them.

So the ordinals number the runs. With `base` the ordinal the previous payload
stated and `n` runs, run *i* takes `base + i`, and the numbering must **close**:
the last run's ordinal is the stated one when its actor is the combatant that
ordinal names, and one less otherwise. Where it closes, every run keeps its
number. Where it does not, only the opening run keeps one — the previous payload
vouched for that one — and the rest of the span stays nobody's. Measured, 3
payloads of 379 carrying messages.

Nothing is trimmed and no run is merged into its neighbour. A turn narrated
across a payload boundary is written twice with the same ordinal, so it counts
once; measured, that happens 139 times and the two halves never disagree about
who acted.

## What the numbers now mean

`fightTurns` is unchanged in kind and in value. The two that change:

| | was | is |
|---|---|---|
| `turnsByCombatantId` | ordinals the forecast named | ordinals a run filled |
| `turnsWithoutActor` | ordinals the forecast never reached | ordinals no run filled |

Corpus-wide the second went **3 → 26**, and the rise is the honest direction: a
forecast names somebody for a turn nothing shows happening. Per capture it fell
to zero on three of the five group fights and rose on two — the largest single
contributor is one gap between payloads wider than the ten turns the prediction
reaches.

A third figure is kept and reaches no total: **turns past the numbering**, where
somebody acted and no ordinal counts them. It is the glossary's `unattributed` /
`unaccounted` split applied to turns — an ordinal with nobody in it is not the
same gap as somebody with no ordinal. It stays in `tools/fight-report.ts` and out
of the panel, because a third warning competes with the two that already earn
their place (§9.6).

The invariant is unchanged and now holds by construction, both terms counting
ordinals inside the span:

```
sum(turnsByCombatantId) + turnsWithoutActor === fightTurns
```

## What is not settled

The reading was challenged after it was built — *if a lot of it comes out wrong,
better to leave it alone* — and that is a question about **correctness**, which
the coverage figure above does not answer. What the material can and cannot settle:

**Where the game states the truth, both readings are perfect.** For the 374
ordinals a payload states as being taken, the message reading and the forecast
reading are each wrong **0 times**, and they never disagree. There is no
demonstrated error anywhere in the material.

**They disagree on 102 interior ordinals — 8.8%** — and every one sits *between*
payloads, where neither has ground truth. The disagreement is not spread evenly:

| gap the payload covers | ordinals | disagreements |
|---|---|---|
| 1–6 | 811 | 26 (3.2%) |
| 7–16 | 484 | 88 (18%) |

That is the boundary of the forecast's ten-turn reach, and the forecast's own
reliability falls off across it. Measured without reference to any message — how
often a statement about an ordinal is overruled by a later statement about the
same one — it is contradicted 3% of the time one turn ahead, 11% at four, 21% at
seven and **28% at nine**. In a wide gap the freshest forecast about an interior
ordinal *is* a distant statement no later payload arrived to revise, so it carries
that error. The messages differ from it less often than it differs from itself,
which is why the disagreement needs no error on the messages' side to explain it.

**What genuinely cannot be checked.** Inside a wide payload the mapping run *i* →
ordinal `base + i` rests on each run being exactly one turn. It can be wrong in a
compensating case: one combatant taking two consecutive turns while another turn
emits no message at all, so the counts still balance and the closure check still
passes. Nothing in the material distinguishes that from the straightforward
reading. It is why the guard for this is a **cross-check between the two readings**
rather than a claim that either is the standard — `tests/game/turn-axis.test.ts`
holds their agreement at 88%, measured 91.2%, and catches a drift in either
direction including the forecast quietly coming back.

**What it costs on screen**: a median of 1–2 turns per combatant against totals of
13–48. The largest single move is one row gaining 9 turns in
`2026-08-12-tempest-grupa-vs-draugr-1` — a fight where the forecast left 29 of 198
turns named for nobody and the messages account for every one.

## Rejected alternatives

**Picking the keys that count as a turn.** This is what the round was asked for,
and the material refuses it: no key is a boundary, and the closest candidate
fires 64 times in 1228 turns. Recorded because "surely one of the keys means
this" is the first thing anyone will think, and the measurement is the only answer
to it.

**`step` as a turn boundary** — refused a second time, and for a reason
independent of the first. `docs/protocol-keys.md` refuses it because the protocol
does not say so; this file refuses it because it does not fit either, being alone
in its message 64 times out of 64 while turns number in the hundreds.

**A message naming nobody as a turn of its own.** 83.5% of ordinals attributed
against 97.9%, and 37 unreconciled payloads against 3. It was the reading this
round started with, and the measurement reversed it.

**Attributing only inside payloads narrow enough to trust.** The cautious answer
to the section above: where a payload covers more turns than the forecast reaches,
keep only the two runs anchored to a statement — the first, vouched for by the
previous payload, and the last, pinned by the closure check — and leave the middle
to nobody. It buys certainty at a price nothing justifies:

| rule | attributed | left as nobody's |
|---|---|---|
| as built | 1202/1228 (97.9%) | 26 |
| only gaps of six or fewer | 787/1228 (64.1%) | 441 |
| only gaps of four or fewer | 654/1228 (53.3%) | 574 |

441 turns as nobody's would put the warning on every fight and make every rate a
lower bound by a third — trading a disagreement that is probably the forecast's
fault for a certainty that the panel knows almost nothing.

**Front-anchoring a shortfall instead of refusing the payload.** Where runs and
ordinals disagree, number the runs from the base anyway and let the tail fall
where it falls: 2 unattributed ordinals rather than 26, bought with up to 24
ordinals labelled by arithmetic nothing grounds. A cheaper number is not a better
one.

**Splitting a run at its regeneration tick.** `heal` opens 437 of the 437 runs
that carry one, so it looks like a start-of-turn marker and would split two
consecutive turns by one combatant. It cannot be a rule: only a third of turns
carry one at all, and the opening turns of the wermont capture carry none.

**Counting runs as turns where the game numbers none.** It would give the two solo
captures a rate they do not have today. Refused: it puts a measurement of ours
under the name the game's own statement carries everywhere else, and those two
captures are exactly where a reader could not tell the difference.

**Dropping the trailing run instead of numbering it.** The same fact spelled two
ways — the trailing run is the next turn beginning early — but dropping it throws
away the comparison that catches a disagreement. Measured, the actor check is
load-bearing: without it attribution falls to 74.9% and 140 payloads stop
reconciling.

**Giving every decoded event its turn.** Approved in the round that produced this
file, then withdrawn: nothing on screen consumes it yet, and §7.1 says a field
exists when something needs it. It is a contract change with no product behind it,
so it waits for the feature that wants it.

**Counting a turn lost.** A `0;0` line stands immediately after the run of the
combatant who forfeited, so unlike the previous incarnation — which deleted its
lost-turn counter because stun keys sit on the *attacker's* message — there is a
lead here. It is a lead from one payload and not a measurement, and it has to be
told apart from loot lines and the end of a fight. Its own round.
