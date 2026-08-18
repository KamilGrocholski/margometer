# Two ends, and one of them is named

Status: implemented

This narrows `docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md` and
`docs/specs/2026-08-18-a-tick-nobody-swung-still-has-a-side.md`. Both stay as
written; the second of them decided for the summary bar what this decides for the
rows above it, and the first is the round whose reasoning this one replaces.

## What was asked for

> On `damage.dealt` I want to see "Bez sprawcy" `damage.dealt` for a specific
> team. […] There should be no such thing as "Bez sprawcy". I know, that
> sometimes a message has only actor or only target, but I SHOULD still be able
> to parse which team it is. If it's "trucizna", I know that it deals damage to
> enemies, therefore I know which team dealt and which received. If it's
> "leczenie", I know that is heals my team, therefore I know my team healed and
> my team received healing.

Two claims. The figure must be the shown team's on every one of the twelve
screens; and no figure the protocol half-names is beyond placing on a team.

## The defect, as it stood

The round before this charged the summary bar with the team derived from the end
the game did name. The row above the bar kept the old rule — the fight's figure,
on every tab — so on `Zadane · My` of
`tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-2.json` the row said
45 430 over a ranking summing to 355 900, while the bar directly under it put
44 464 of those same points inside `My`. The same points twice on one screen, one
of the two saying they were nobody's.

## The two holes

A message names an actor and calls the target nobody, or names the target and
calls the actor nobody (`src/core/protocol-message.ts` — `0` in a side segment is
the protocol naming nobody). Counted over all seventeen captures, read
2026-08-18:

| hole | shape | occurrences |
|---|---|---|
| **no actor** | `-10000547=99.60;0;poison=1317` | 1 895 messages of 7 128 |
| **no target** | `1=90.00;0;+dmg=300;-dmg=200` | 0 |
| **neither** | `0;0;+dmg=90;-dmg=70` | 0 |

The first is a health change: the subject sits in the actor slot and the target
is that `0` (`HEALTH_CHANGE_KEYS` in `src/core/fight-decoder.ts`). By protocol
key, summed over the set: `poison` 410 461, `injure` 25 062, `heal` stating a
loss 7 016, `fire` 1 419.

## The decision

**One row per hole, each charged to the team derived from the end the game did
name.** `Nieznany sprawca` and `Nieznany cel`, in place of the single
`Bez sprawcy`. The derivation is `getPartCharged` in `src/ui/panel-view.ts`:
damage crosses sides, healing does not.

Where each stands against the ranking is `HOLE_STANDING`, four screens by two
holes:

| screen | `Nieznany sprawca` | `Nieznany cel` |
|---|---|---|
| `Zadane` | apart from the rows, in the whole | **no row** — the actor is named and their own total holds it |
| `Otrzymane` | a cut of the rows | apart from the rows |
| `Leczenie dane` | apart | **no row** — as above |
| `Leczenie` | a cut | apart |

**The last column cost a change one layer down.** `dealtApplied` is credited to a
striker whether or not the blow found a name; `healingGiven` was credited only
where **both** ends resolved (`src/core/fight-statistics.ts`), so an announced
heal reaching a name this fight could not place was on no row and in no total —
and was filed under `healedWithoutHealerBySource`, healing *nobody gave*. The
announcement had named the giver, so the panel said "nic nie zapowiedziało tego
leczenia" about points something had announced: a claim about the game that is
false (§3), not merely a figure left out.

The aggregate credits the healer now, whatever became of the recipient. The
giver's own breakdown is keyed by recipient and therefore still short by those
points, and the drill names the shortfall on their row rather than hiding it.
Nothing in the captures moves — every name in all seventeen resolves — so this is
guarded by a hand-built fight in `tests/core/fight-statistics.test.ts` and another
in `tests/ui/panel-view.test.ts`.

**Every screen closes.** The ranking plus the rows standing apart is the bar's
figure for that tab, to the point, on every capture — 204 screens measured. On
hildur-2, `Zadane · My` is 355 900 + 44 464 = 400 364.

**So every row states a share again.** The bracket had gone from four screens
because the figure was scoped differently from the list under it; it is not any
more, and `bracketText` stopped being nullable — nothing produces a row without
one (`src/ui/panel-shape.ts`).

⚠️ **44 464 comes back to a side tab, and this is not the fix before it being
undone.** That round took the number off `Zadane · Oni`, where it stood for what
that side had *lost*; it now stands on `Zadane · My`, for what this side *dealt*.
Same figure, other tab, other claim — and `Zadane · Oni` reads 966, which is what
the enemy dealt with nobody to charge it to.

**What names neither end is the one figure still without a team.** It rides
whichever row stands apart under `Wszyscy` (`getHoleCarryingNeitherEnd`) and is
on no row at all under a side tab, where the summary bar names it as
`Bez strony`. Zero in every recording.

**The sentences follow the split.** `src/ui/panel-nobody.ts` gains a second set,
shorter than the first because less of it varies: what the game left out is two
sentences by noun, where the row stands is one, the heading is one word. The
leftover line collapsed from a four-entry table with two nulls to a single
sentence — it rides a different row on different screens now, and says the same
thing wherever it lands.

## What is measured

- **The closure**, over every capture: the ranking plus the rows standing apart
  is the bar's figure for that tab, on all twelve screens.
- **The mirror**, over every capture and read from both the row and the bar:
  `Zadane · My` equals `Otrzymane · Oni`, and `Leczenie dane · My` equals
  `Leczenie · My`. It is a measurement rather than a construction — the two arms
  reach the figure through different fields of the aggregate — so a blow between
  two of ours, or an end that stops resolving, breaks it.
- **The shares come to a hundred** on every screen, read off the drawn brackets
  and never off a total the view states.
- **The charge decides the cut, not only the figure**: on a hand-built fight with
  one element on each side, `Zadane · My` lists the one that fell on the enemy.
- **What names neither end** stays on the one row that carries it and out of every
  side tab, on hand-built fights, because no capture reaches the shape.
- **An announced heal whose recipient did not resolve** reaches the giver's total,
  their breakdown's missing-end row, and the pinned row on the received screen —
  none of which it reached before, and none of which the panel could have given it
  without the aggregate crediting the healer.

## Every case

Lifted into `docs/half-named-figures.md`, which is the register this decision
produced: every shape the protocol can send where it names one end and not the
other, and what the panel draws for it. A spec is read once; that table is looked
things up in.

## The one place this panel guesses

The claim is worth stating because it is checkable, and this is the survey behind
it, taken at this commit. Everywhere else the add-on either cites the client or
refuses:

| where | verdict |
|---|---|
| a skill glued to the figure after it (`src/core/battle-event.ts`) | **the client's own** — it appends `allM[i] + ',' + allM[i+1]`, production build `1785244275300`; only the same-actor condition is ours |
| a skill announcement beside a figure in its own message | **refused** — 33 of 197 carry one, and the protocol does not say the figure is the skill's doing |
| `abdest_per` against the blows that follow (`docs/protocol-keys.md`) | **refused** |
| a name matching two combatants (`src/core/combatant-roster.ts`) | **refused** — resolves to nobody, never to the first match |
| `team` arriving as text (`src/game/engine-roster.ts`) | **refused, and counted** |
| a heal reaching a whole side (§10, `unaccounted`) | **refused** — read, never sized |
| **`getPartCharged`** | **ours** — the team of the end the game did not name |

It holds while there are two sides and nobody harms their own. The protocol
states neither, so the mirror above is what pays for it: the assumption and the
measurement are the same claim.

## Rejected alternatives

**One row, team-scoped.** Half the ask, and it leaves the second hole where it
was: under `Leczenie dane` those points are in no total at all.

**Keeping the figure out of the whole and the bracket off.** The shape this
replaces. Every region of a screen must divide by one number, and a row inside the
bar's figure but outside the ranking's denominator is two numbers.

**A third row for what names neither end.** It belongs to no team, so it can only
ever draw under `Wszyscy` — a row that appears and vanishes with the tab, for a
figure that is zero in every recording. It rides the row that stands apart
instead, and the bar names it where no row can.

**Following this in `docs/design/panel.html`.** Unchanged, for the reason
`docs/specs/2026-08-12-the-height-a-fight-needs.md` gives: the drawing is a copy
of the numbers, not a second reader of them.
