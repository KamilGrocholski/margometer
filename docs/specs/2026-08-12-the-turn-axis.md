# The turn axis, and who chooses the divisor

Status: implemented

⚠️ **One section of this file is superseded** by
`docs/specs/2026-08-12-turns-the-messages-carry.md`: *"What is a measurement and
what is the game's forecast"*. Who took which turn is no longer read from the
prediction's nine look-ahead entries but measured from the messages. The fight's
turn count, the divisor control and everything else below stand.

Supersedes the rate paragraphs of
`docs/specs/2026-08-11-the-panel-that-drills.md` — its three metrics, its side
filter and everything else it decides stand.

That file said `na turę` divides everywhere at once and named the divisor per
metric. Both halves of the sentence turned out to be built on a turn count the
add-on had invented, so this file replaces the arithmetic and the control, and
leaves the rest alone.

## What was wrong

The add-on never read the game's turn number. It counted its own: a turn opened
whenever the envelope's `current` named somebody different from the payload
before, which counts **payloads that happened to arrive**.

| Capture | counted | the game's own numbering |
|---|---|---|
| `2026-08-06-tempest-grupa-vs-hildur` | 98 | **299** — ordinals 2 → 300 |
| `2026-08-04-tempest-lowca-vs-odyncze` | 1 | one ordinal stated, and no second |
| `2026-08-11-tempest-tancerz-vs-wermont` | 1 | one ordinal stated, and no second |

So every rate over the fight's turns was **3.05× too high** on the group capture,
and the per-combatant counts were a sample of who happened to be acting when a
payload landed: combatant `440952` was credited **2** turns where the game
scheduled ~22, an 11× error on their own row. Under `na turę` the ranking was
arbitrary rather than merely imprecise.

The two solo captures deliver their whole fight in a single payload, so the count
came to 1 and every rate equalled its own total — a substituted number reading as
a measurement, which is the failure the project exists to prevent (§9.5, §9.6).

A third error, small beside those: the previous reading treated a combatant acting
twice in a row as one turn, on a comment saying that never happens. Both solo
captures contain it — `{"1":482845,"2":482845,…}`.

## Where the turn actually is

`turns_warriors`, in the payload envelope. The client's own name for it is the
**turn prediction** — `updateTurnPredictions(turns)`, read on production build
**1786514810315** and development build **1781609507010** — and it is a map of
turn ordinal to combatant id, ten wide.

The client iterates it for order and never reads a key, so what the keys *mean* is
settled on the captures rather than in the source:

- the least ordinal is the turn being taken, and its combatant is the one
  `current` names — every payload of every capture that states both agrees;
- the ordinal rises strictly, 2 → 300 across 99 payloads, with no step backwards;
- consecutive payloads are 1 to 13 ordinals apart, so most turns pass unobserved.

`current` is therefore **not read**. It says what the least ordinal already says.
That agreement is a claim about the game, so it lives in
`tests/game/turn-axis.test.ts` as a guard rather than in a sentence here (§7.5).

There is no entry in `docs/protocol-keys.md`, and that is a decision: the register
covers keys inside a message, and this is the envelope the message arrived in.

## What is a measurement and what is the game's forecast

**The fight's turns are a measurement.** `lastTurn - firstTurn + 1`, the span of
ordinals actually stated. Nothing about it is inferred.

**A combatant's turns are the game's own schedule, as it last stated it.** The
prediction reaches ten turns ahead and gets revised — 66 of 685 re-observations
disagreed with an earlier one — so the freshest statement wins. Measured against
the ordinals later seen as the turn being taken: the entry for the very next turn
was right **45/45**; forecasts further out, **84/96**.

**Turns nobody was named for are counted apart.** Where payloads are more than ten
ordinals apart the prediction never covers the gap: 3 of the group capture's 299.
They reach a counter of their own and never a row, and while a rate is on screen
the panel says how many there were.

Three readings, three standings, and the panel is built so a reader is never asked
to tell them apart by eye: the fight's total is stated, a row's turns are stated,
and what is missing is said in words.

## The control

`Sumy` · `Na turę postaci` · `Na turę walki`, a strip of its own below the metric
and side rows.

**The metric no longer picks the divisor.** It used to: dealt divided by the
combatant's own turns and taken and healed by the fight's, under a single button
labelled `na turę`. Both figures are defensible and neither was named, so one
control meant two things on one screen and the reader had no way to ask for the
other. Now they ask, and the answer means the same at every level — the ranking,
every breakdown, every section total and the side summary — which is the one thing
the superseded spec got right and this keeps.

A strip rather than a corner of the side row, because the labels name their
divisors: measured, about 205px at `11px/1.35 system-ui` against the 244px the
panel has, and `Wszyscy / My / Oni` already takes ~100 of it. A label short enough
to share the row would be back to a `/t` nobody can attribute.

**The share in brackets and the side bar keep using raw sums.** Unchanged, and for
the unchanged reason: a share describes the shape of a fight, not its pace.

**Each side divides by its own turns**, summed from the turns themselves. The
arithmetic this replaces took the enemy's as the fight's less ours, which handed
them every turn nobody was named for and every turn of a combatant the roster
could not place, and deflated their rate by exactly that much.

## When there is no axis

Two of three captures, so this is ordinary rather than exotic.

- The two rate tabs are drawn **disabled**, and a disabled tab is simply not
  wired — it answers nothing rather than answering with a dash on every row.
- Every figure is a total, whatever the state holds. The choice **outlives a
  fight**, so a reader who picked a rate in one meets the next one still holding
  it; the choice is kept and comes back the moment a fight can serve it.
- A warning says the game did not state this fight's turns.
- A row's `Tury` reads `—`, not `0`. They certainly took some.

And where the axis exists but a particular combatant has no turns in it, that
figure alone reads `—/t`: the suffix keeps the column readable as a rate, and the
dash keeps it from being mistaken for `0,0/t` (§9.6).

## Rejected alternatives

**Counting a turn when `current` changes.** What this replaces. It counts payloads,
and the server narrates a fight as chattily as it likes.

**Counting `step` as a turn boundary.** `docs/protocol-keys.md` already refuses it
and still does: all 22 occurrences are a message holding nothing else, which is
what a turn boundary would look like — but the protocol does not say that.

**Dividing by 1 where the count is unknown.** It makes the rate equal the total and
puts a measurement's face on our ignorance.

**Keeping the metric-chosen divisor as a fourth "automatic" mode.** A fourth state
whose rule needs a paragraph, sitting beside three that need a word each. The
reason it existed was that nobody could ask for the other one; they can now.

**Counting only the turns we watched go by.** The purest reading — 99 of 299, no
inference at all — and it makes `Na turę postaci` useless: those 99 are a sample of
when payloads arrived, so the 11× error stays exactly where it was. The prediction
is the game's own statement about who acts when, and reading it is reading.

**Filling an unnamed ordinal with the last combatant seen.** It would take
`turnsWithoutActor` to zero and make the counts look complete. Three ordinals of
invention is still invention (§5).

**Resetting the axis when an ordinal goes backwards.** It can only mean a fight
that opened without `init`, and `init` is where a fight begins — a second boundary
would put that decision in two places. Such a payload moves nothing instead. Never
observed in any capture, so this is reasoning rather than measurement and is
written down as such.

**Two rate buttons with totals as neither selected.** Narrower, and it hides how to
get back: a reader has to discover that clicking the selected one turns it off.
`Sumy` is a state and is drawn as one.
