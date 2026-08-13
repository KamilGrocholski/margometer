# What nobody can be charged with, on every screen that has it

Status: implemented

This supersedes one clause of `docs/specs/2026-08-11-the-panel-that-drills.md` —
"it appears under **Zadane** and **Leczenie**" — and adds what that file never
decided, because the region did not exist when it was written: what the summary
under the list contains. That file stays as written. Everything else it decides
about the row — below the list, outside the scrolling, whole-fight scope under a
side filter, not split by side — still stands, and this round leans on all four.

## The defect: four screens, three of them speaking

The panel has four screens and one figure that belongs to all of them: health the
protocol says moved with nobody to charge it to. Three screens said something
about it. The fourth said nothing.

`Otrzymane` opened `getPinnedValue` and `composePinnedRow` with
`if (state.metric === "taken") return`. The reasoning was sound and is still
sound — under that direction the points sit on the victim's own row, so the row
does not have to carry them. What does not follow is silence. `Leczenie` is the
**same case**, points already on the recipient's row, and it draws the row and
says so: *"To leczenie jest już policzone wyżej, u tych, którzy je dostali."*
Two screens in one situation, one of them explaining it and one of them mute.

The cost is not hypothetical. Under `Otrzymane` a reader adds up the rows, gets
the whole fight, and has no way to learn that 6.7% of it — 49 318 points against
Hildur — has no author at all. The one sentence the panel exists to say is the
one it did not say there.

## The second defect: the summary drew part of the fight as the whole of it

`composeSides` summed the combatant rows and nothing else. Measured across the
seven captures, as a share of the figure that screen's own brackets divide by:

| screen | outside the bar |
|---|---|
| `Zadane` | 1.3% – 18.6% |
| `Leczenie dane` | 55.6% – 88.3%, and 100% in two captures |
| `Otrzymane`, `Leczenie` | 0.0% |

On `2026-08-12-tempest-grupa-vs-hildur-2` under `Leczenie dane` the bar divided
14 393 points 100/0 while the pinned row **directly above it** stated 109 113.
Two regions of one screen answering with two different wholes — which is exactly
the defect `docs/specs/2026-08-12-two-axes-and-the-other-direction.md` fixed one
region up, in the brackets, and did not fix here.

And where there was nothing to divide, `mineShare` fell back to `0.5` and the bar
drew an even split of zero: a measurement of nothing, which §9.6 exists to forbid.

**Nothing guarded any of it.** No test in the repository referenced `sides`,
`mineText` or `mineShare`, and `getEveryString` — the sweep that keeps our
vocabulary off the screen — did not read the region either. It was drawn in every
test in `tests/ui/panel-element.test.ts` and asserted in none.

## The rule: the direction says where the figure already is

One fact settles all of it, and the panel already knew the fact — it is the
direction axis.

| noun | the figure | `zadane` / `dane` | `otrzymane` |
|---|---|---|---|
| damage | `unattributed.dealtApplied` + every row's `healthLost` | on no row | on the victims' rows |
| healing | healing above what the announcements credited, + `unattributed.healed` | on no row | on the recipients' rows |

From that one fact, three things fall out instead of being decided three times:

- **whether the screen's whole grows by it** — `getFigureOutsideRows`, which is
  now the only thing `getWholeOnScreen` adds;
- **which sentence the row says about itself** — `PINNED_STANDING_NOTES`, four
  entries because the compiler counts the rows and the screen that had no entry
  is the screen that said nothing;
- **whether the summary needs a third part** — the same function again.

**The figure depends on the noun and not on the direction, and that is what makes
it checkable.** Given plus this is everything received, so the two directions must
state one figure and one share. Measured on all seven captures, both nouns: they
do, to the point and to the percent — 49 318 and 7% under both `Zadane` and
`Otrzymane` against Hildur. That is `Σ dealt + unattributed = Σ taken`, the
sentence the 2026-08-11 spec wrote down, measured for the first time. It could not
be measured before: one of the two directions had no row to compare against.

## What the summary holds now

`My + Oni + Bez strony`, three parts of one whole, and that whole is the figure
every bracket on the screen divides by. Verified on all seven captures × four
screens: no screen is off by a point.

- A part with no figure draws no segment, and a whole of zero draws no bar.
- A combatant the roster cannot place lands in the third part. They used to be
  dropped from the summary in silence, while `composeTitle` was counting them in
  its `+N`. Zero on every capture — read anyway.
- The third part is **`Bez strony`, not `Bez sprawcy`**, though on the two screens
  where it is large they are the same points. A combatant with no side lands there
  too, and they have an actor. The chain is the pinned row's own, and the row
  already states it under a filter: no actor, so nothing to put on a side.
- Placed under the bar rather than between the two figures: the line above is a
  confrontation and reads as one, and this is not a third contestant.

## The summary stays on every screen

It used to vanish the moment a row was clicked — `sides: null` on all three
screens below the ranking — so the bottom of the panel moved out from under the
reader's hand at exactly the gesture that was supposed to tell them more.

It stays, and it keeps meaning the fight. Only the label changes, to
`Cała walka · My / Oni`, because two figures of the fight's scale standing under
one combatant's breakdown would be read as that combatant's.

The pinned row does **not** follow it down. In a breakdown the shortfall is that
combatant's, and it already closes their own first section from inside the list
(`composeOpponentEntries`); a fight-wide figure pinned over one person's breakdown
is a number that screen has nothing to say about.

## Rejected alternatives

- **Splitting the breakdown by side in the summary** — so that entering a
  combatant showed how their damage divided between the two teams. Measured:
  **0 of 137 breakdowns** across the seven captures have both sides non-zero, so
  the bar would draw 100/0 every single time. That is a cut of one row repeating
  the total standing over it, which `composeCrossSection` already refuses to draw
  one level up.
- **Leaving the summary two-part and printing the fight's total beside it.** Three
  figures of which two do not add to the third without arithmetic in the reader's
  head. The bar is the one thing on that line that can show a proportion; making
  it show a proportion of something else is worse than adding a segment.
- **A note saying the third part is outside the bar.** Cheapest, and it leaves the
  bar drawing 88% of a fight as 100%. A sentence does not correct a picture.
- **Keeping `Otrzymane` silent because the figure is on the rows.** That is the
  premise, not the conclusion. `Leczenie` is in the same position and says so, and
  a reader cannot tell "already counted" from "not counted" unless somebody tells
  them which.
- **One sentence for both received directions and one for both given ones.** Two
  entries instead of four, and the same table would have accepted a fifth screen
  silently. The four exist so the compiler asks the question.
- **Naming the summary's third part `Bez sprawcy`** to match the row above it.
  It would be wrong the moment a combatant has no side, and the two labels are not
  two names for one thing: one asks who did it, the other which team it goes to.
- **A new token for the third figure's colour.** `UNKNOWN_COLOUR` measures 5.13
  against the panel surface, clear of AA for text at the size it is written in, so
  a second grey would be a token nobody needed.
- **Making the pinned row drillable, now that it is on every screen.** Its detail
  already lists everything the log holds about those points — the source keys, or
  the recipients. A level below would be the same list with a breadcrumb over it.
- **Following this in `docs/design/panel.html`.** Unchanged, for the reason
  `2026-08-12-the-height-a-fight-needs.md` gives: the drawing is a copy of the
  numbers, not a second reader of them, and §8 decides that the add-on wins.
