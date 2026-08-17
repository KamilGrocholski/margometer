# Everyone in the fight has a row, from the first payload

Status: implemented

Who the ranking lists, and why the answer stopped being "whoever the protocol has
mentioned". Everything else the panel decides — the drill, the pinned row, the
heights, the summary — is untouched by this and stays where it was decided.

## The defect: a row that is missing says there is no such person

The ranking was built from `FightStatistics.byCombatantId`, and the aggregate
creates a row for somebody the moment the protocol **names** them — as an actor,
as a target, as the subject of a health change. That is exactly right as a record
of what was measured, and it is the wrong list to draw: a combatant who has not
acted yet, and whom nothing has hit or healed, is simply absent from the panel.

A player reading the list cannot tell that from a fight they are not in. The one
thing this panel exists to avoid is a number that is wrong looking like a number
that is right, and a missing row is that failure with the number removed
altogether.

**Measured on the captures, decoding only the first engine call of each fight
against the roster that call carried:**

| capture | in the roster | on the list |
|---|---|---|
| `2026-08-06-tempest-grupa-vs-hildur` | 11 | 2 |
| `2026-08-12-tempest-grupa-vs-hildur-1` | 11 | 2 |
| `2026-08-15-tempest-grupa-vs-hildur-2` | 11 | 3 |
| `2026-08-04-tempest-lowca-vs-odyncze` | 4 | 0 |
| `2026-08-11-tempest-tancerz-vs-wermont` | 2 | 0 |
| `2026-08-14-tempest-grupa-vs-hildur` | 11 | 11 |

And it is not one payload's problem. Replaying each capture call by call, the
number of calls where somebody in the roster has no row: **21 of 102** on
`2026-08-06-tempest-grupa-vs-hildur`, 16 of 111 on
`2026-08-12-tempest-grupa-vs-hildur-1`, 11 of 52 on
`2026-08-15-tempest-grupa-vs-hildur-4`, 2 of 4 on the boar fight. Four of the
seventeen captures are complete from their first call.

⚠️ **Over a whole fight the two lists are identical, on every capture.** Everyone
rostered is eventually named. That is why no test in the tree could see this:
every capture-driven assertion runs on the finished fight, where the two sets
coincide and either one draws the same rows. The defect lives entirely in the
middle of a fight, which is the only time anybody is looking.

## The rule: the aggregate is read, not reseeded

**`byCombatantId` stays keyed on events.** It is a record of what was measured
and the tree holds it to that in six places
(`tests/core/fight-statistics.test.ts`). Seeding it from the roster would make
`bySide`, `combatantIdsWithoutSide` and every consumer answer a question none of
them was asked, and would erase the difference between *present* and *counted* —
which is a real difference and the one this page is about.

So the aggregate gains a **reader**: `getCombatantIdsInFight(statistics, roster)`.
The roster's ids in the roster's own order, then anyone the aggregate counted
whom the roster cannot place. Two questions, two lists, one place each.

**The union, not the roster.** Keying the ranking on the roster alone would drop
a combatant the protocol states figures against before any roster fragment names
them — which is what keying on the aggregate was avoiding in the first place, and
the shape `tests/core/fight-statistics.test.ts` already holds. Trading one
silence for the other is not a fix.

**A row of zeros is a reading.** §9.6 keeps zero and unknown apart, and this is
zero: the fight has stated nothing about that combatant, and nothing is what the
row says. The panel already had every part of it — `getRow` answers with an empty
row, `getName` with the roster's name, `getFill` guards a zero scale, and
drilling in gives *"Nie zadała nikomu obrażeń."* rather than empty sections. What
was missing was the id.

## The order, at the moment every figure is zero

At the start of a fight the whole list is one tie, so what breaks it decides what
a player first sees. It is the **game's own order**: the roster keeps first-seen
order (`src/game/engine-roster.ts`), so the opening screen reads the way the
client listed the warriors, and it stays that way across the redraw that happens
every few seconds.

That replaces a tie-break on the collated name, which sorted strangers into one
alphabetical block across both sides. The collation had exactly one caller, so
`getCollatedTextOrder` left `libs/` with it — and `localeCompare` is now spelled
nowhere in the tree, held by `tests/tools/source-layout.test.ts` as a construct
with no owner rather than one with an owner that never calls it.

## The header counts what the list draws

`composeTitle` read `statistics.bySide`, which counts the combatants the
aggregate *measured*. The two were the same list for as long as the ranking was
built the same way; once it is not, the header states `2 vs 1` above eleven rows
for the opening of every group fight. It counts the same set now, so the
disagreement cannot be written.

The **summary** under the list is deliberately not touched: it sums figures, and
a row of zeros adds nothing to any of them. Every bracket on every screen keeps
the denominator it had.

## What the copied report says

`⧉` copies a report holding everyone the panel drew, with zeros for a combatant
nothing has named. A report is read beside the screenshot it arrived with, and a
list of eleven rows above a report holding two is a discrepancy whoever reads it
has to resolve before they can start. The full roster was already in the report;
this makes its two halves agree.

`tools/fight-report.ts` lists the same set for the same reason. ⚠️ On the
captures its output is unchanged but for one line-pair: over a whole fight the
two sets coincide, and the only difference is that two combatants tied on `0`
dealt in `2026-08-15-tempest-grupa-vs-hildur-1` now sit in roster order rather
than in the order the protocol first named them.

## What a reader sees change

- The list is the fight's roster from the first payload, in the game's order.
- Somebody who has not swung yet is on `0`, and rises out of the zero block as
  the fight goes on, without the window changing height — eleven bars was already
  the floor, and eleven is the roster of every group capture.
- The header agrees with the list it stands over.
- A copied report holds the same people as the screenshot.

## Rejected alternatives

- **Seeding `byCombatantId` from the roster.** One line in the aggregate, and it
  answers everything at once — the ranking, the header, the report and the tool
  all follow with no other change. It is refused because it redefines a
  measurement: `bySide` would group people nothing measured, `combatantIdsWithoutSide`
  would change meaning, and a reader asking "who did this fight mention" would
  get "who was in it". The distinction is cheap to keep and impossible to
  recover once merged.
- **Keying the ranking on the roster alone.** Drops the combatant the roster
  cannot place, which is a shape the tree already tests for and the reason the
  ranking was keyed on the aggregate to begin with.
- **A mark distinguishing "has not acted yet" from "did nothing".** The protocol
  does not carry the difference — a combatant with no message to their name and
  one whose every blow was blocked are the same silence at this level — so the
  mark would be ours rather than a reading, which is what §5 refuses. The drill
  already says the honest version: *"Uderzyła N razy — nic nie weszło."* where
  there were blows, the plain sentence where there were none.
- **Ordering the zero block alphabetically**, as the collated tie-break did. It
  is an order of ours laid over one the game already has, and it puts the two
  sides through each other at the exact moment a player is looking for their own
  team.
- **Ordering it by side, ours first.** Better than an alphabet and still ours;
  the roster order already groups the sides on every capture, because that is how
  the client lists them.
- **Leaving the header on `bySide`.** It is one line of the panel disagreeing
  with the region under it, which is the defect
  `docs/specs/2026-08-12-what-nobody-can-be-charged-with.md` closed for the
  summary and would have reopened here.
- **Growing the list to hold everyone.** Still rejected, and unchanged from
  `docs/specs/2026-08-12-the-height-a-fight-needs.md`: eleven bars is a floor a
  bigger fight scrolls past. What changes is that the common fight now fills it
  from the first payload instead of filling up over the first twenty.
