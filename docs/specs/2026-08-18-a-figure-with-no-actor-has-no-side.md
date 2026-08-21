# A figure with no actor has no side

Status: implemented

This narrows the round that shipped as `b8f0f23` earlier today, and restores for
half of the screens what `docs/specs/2026-08-11-the-panel-that-drills.md` decided
and that round overturned. Both stay as written. Nothing about a *received*
screen changes here.

## The defect, as it was reported

> AGAIN the problem with `Bez sprawcy` where the calculation for `Oni` damage
> done and damage received is invalid, is the same, but now always

The third report of the same row in three rounds, and the first one to name the
symptom that identifies the cause: **the same**.

`getPinnedValue` branched on the *noun* and never on the direction, so under a
side tab both screens of a noun reduced to

```
Σ over admitted rows of (row.healthLost + row.taken − Σ takenByActorId)
```

— a purely **received-end** figure. On `Otrzymane` that is right: the list above
is the people the health moved on, and the figure is counted by the same end. On
`Zadane` the list is what a side *dealt*, and `getFigureOutsideRows` then added
that received-end figure into the screen's denominator.

Measured over every file in `tests/captured-fights/`, read 2026-08-18, decoding
each with its own roster:

| screen | what the pinned figure took of it |
|---|---|
| `Zadane · Oni`, `2026-08-15-tempest-grupa-vs-hildur-2.json` | **38.7%** — 44 464 against 70 398 dealt |
| `Zadane · Oni`, `2026-08-14-tempest-grupa-vs-draugr-1.json` | 30.3% |
| `Zadane · Oni`, `2026-08-04-tempest-lowca-vs-odyncze.json` | 58.6% |
| `Leczenie dane · Oni`, every Hildur capture | **100%** — the ranking is empty and the row was the whole screen |

So every ranked row's bracket on `Zadane · Oni` was deflated by up to 38.7% by a
figure nobody on that screen dealt. A wrong number that looks right, which is the
one thing §9.6 forbids outright.

### Two more of the same cause

**The arithmetic the docblock rested on is false.** `getPinnedValue` claimed
`Σ zadane + bez sprawcy = Σ otrzymane` held "per side as well as per fight". It
holds fight-wide — 685 920 + 49 318 = 735 238 on
`tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json` — and on no
capture per side: side 1 of `2026-08-15-tempest-grupa-vs-hildur-2.json` is
355 900 + 966 against 71 364 taken. The test standing for it
(`tests/ui/panel-view.test.ts`) asserted only that the two directions state the
*same figure*, which was the construction rather than the balance: both reached
it down one arm and could not disagree.

**One screen already stated two figures for one thing.** On `Zadane · Oni` the
pinned row said 44 464 while the summary bar's `Bez strony` directly under it
said the fight's 45 430, because `composeSides` reads the fight scope. Two
regions of one screen answering with two different wholes is the exact defect
`docs/specs/2026-08-12-what-nobody-can-be-charged-with.md` was written to close,
reopened one region up.

## The decision

**A figure with no actor has no side, so a side tab cannot narrow it — and it is
not part of what one side dealt.**

| screen | the figure | in the denominator | bar and bracket |
|---|---|---|---|
| `Zadane` · `Leczenie dane` · `Wszyscy` | the fight's | yes | yes |
| `Zadane` · `Leczenie dane` · `My` / `Oni` | **the fight's** | **no** | **no** |
| `Otrzymane` · `Leczenie` · any tab | the side's, as `b8f0f23` made it | only what no row holds | yes |

One predicate decides all of it — `isPinnedInsideWhole` in
`src/ui/panel-view.ts`, read by the denominator, the bracket, the bar and the
scale the bar is measured on. Four sites spelling one condition is how two of
them come to disagree, which is the fault `b8f0f23` itself named when it lifted
`isAdmittedByTeam` out of the ranking.

**The cut travels with the figure.** `getUnattributedDamageBySource` and
`getUnattributedHealingBySource` are asked for under a given direction and
nowhere else, so both go back to reading the whole fight; their side filter and
their `Wszyscy` guards come out, and the `state` parameter with them. A cut
totalling one side beneath a figure stating the fight is the same failure in
miniature.

**The sentence carries what the bracket no longer does.** `PINNED_SCOPE_NOTES` in
`src/ui/panel-words.ts` was two wordings, one per noun, because the figure was
narrowed the same way on all four screens. It is four now, parted by direction: a
received screen names the end it was counted by, a given one says the figure is
the whole fight's and belongs to no team. The missing bracket and that sentence
have to arrive together — a bracket alone divides by a whole its numerator is not
in, and a missing bracket alone is a figure with nothing saying what it is a
figure of.

### Why the row does not simply move back, whole

`b8f0f23` narrowed both directions for a real reason: a fight-wide numerator over
one side's denominator printed 320% under `Leczenie · Oni` on
`tests/captured-fights/2026-08-11-tempest-tancerz-vs-wermont.json`, and `(0%)`
beside a five-figure number where the other side received no healing. That was
the wrong half to drop. The *figure* was what did not belong on a received
screen, and it is narrowed there still — so 320% cannot come back, and it is the
given screens, which never had a whole containing the figure, that lose the
bracket instead.

## What is measured

- The ranked rows close their screen: on every capture × every tab under `Zadane`
  and `Leczenie dane`, the pinned figure is outside the whole and states no share.
  Before this it took 61% / 39% of `Zadane · Oni` on the Hildur capture.
- A share is stated on exactly the screens with a whole containing it, as an
  equality rather than as two skips, so the exception cannot widen unnoticed.
- The received direction still closes `My + Oni + nie do przypisania` against the
  fight; the given direction states the fight's figure on all three tabs; and the
  two agree under `Wszyscy`, which is where `Σ zadane + bez sprawcy = Σ otrzymane`
  is a fact rather than a construction — the two now reach it down different arms.
- The `Z czego` cut is the fight's on every tab and closes against the figure over
  it, on a fight built by hand: every recording resolves every striker, so the
  element half of that cut is empty in all of them and a mutation here lights
  nothing over the captures.

## Rejected alternatives

**The fight's figure, kept inside the denominator.** The pre-`b8f0f23` shape for
the given screens only, and the cheapest change: the bracket could no longer
exceed a hundred, because the received screens stay narrowed. It still divides a
side's rows by a whole containing a figure they are not part of — 39% of
`Zadane · Oni` — and it still hands `Leczenie dane · Oni` a row saying 100% over
an empty ranking. The bracket was the symptom; the denominator is the claim.

**Dropping the row on a given screen under a side tab.** The literal reading of
"it has no side". It is silence on two of four screens, which is the defect
`docs/specs/2026-08-12-what-nobody-can-be-charged-with.md` exists to close, and
it hides the largest single limit the protocol imposes on exactly the screens a
reader spends most time on.

**Keeping the figure side-scoped and only removing it from the denominator.**
The bracket goes and the sentence changes, but the figure on `Zadane · Oni` is
still what that side *lost* — an answer to the question the other tab asks,
printed under this one. It fixes the arithmetic and leaves the reading wrong.

**Wording the sentence per noun again, with the direction in the label.** Two
sentences and a label that changes is three places one fact lives. The tables in
`src/ui/panel-words.ts` are four entries so the compiler asks about a fifth
screen; making one of them two would be the drift they exist to prevent.

**Following this in `docs/design/panel.html`.** Unchanged, for the reason
`docs/specs/2026-08-12-the-height-a-fight-needs.md` gives: the drawing is a copy
of the numbers, not a second reader of them.
