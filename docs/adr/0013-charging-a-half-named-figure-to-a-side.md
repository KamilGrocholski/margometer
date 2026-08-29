# 0013. Charging a half-named figure to a side

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

The protocol routinely names one end of what happened and calls the other nobody: a blow whose
striker is unnamed lands on a combatant the message does name, and health restored with no
announcement reaches somebody the message does name. Measured over `captures/` on 2026-08-29:
353,990 of 3,755,729 points restored have no giver the reading can name, and every recording carries
damage with no actor.

The panel draws two figures under the ranking — the reader's side against the other — and that strip
has to total the fight. A half-named figure left out of both makes the strip short by an amount
nothing states; a half-named figure put on the side that happens to be showing is a guess.

`ARCHITECTURE.md` already binds the shape of the answer: **a figure may be charged to a side by the
end the game did name; a figure may never be charged to a person that way.**

## Decision

The end the protocol **did** name places the figure on a row, the roster places that row on a side,
and the missing end is derived from it by the noun:

- **Damage crosses.** What one side lost, the other dealt. A blow with no striker landing on one of
  ours is charged to the other side; a blow of ours that found no target is charged against them.
- **Healing does not.** It reaches its own side, so healer and healed are charged alike.

What names **neither** end is charged to nobody and stated apart, under a label of its own. So is a
combatant the roster cannot place: both are refusals, not a third side.

`core/fight-statistics.ts` keeps each row's own share of the three fight-wide counts —
`damageTakenFromNobody`, `damageDealtToNobody`, `healthRestoredByNobody` — and asserts that the
counts equal those sums plus what named neither end. `ui/panel-reading.ts` spends them; nothing else
may.

## Consequences

**The mirror is what pays for it, and it is measured rather than argued.** Over `captures/` on
2026-08-29, on all 27 recordings stating two sides: `Zadane · My` equals `Otrzymane · Oni` to the
point, and `Leczenie dane · My` equals `Leczenie · My`. The two arms reach the figure through
different fields of the statistics, so a blow between two of ours, or an end that stops resolving,
breaks the equality and lights up `tests/ui/panel-reading.test.ts` rather than quietly moving a
figure.

What names neither end is **zero on every recording** — the figure the rule cannot place is
invisible in the material, which is exactly why it is counted rather than assumed away.

It obliges the strip to stay fight-scope: it answers how the fight is going, and that question does
not change when the ranking narrows to one side. Only the label does.

## Alternatives

**Leave a half-named figure out of both sides.** It reads as a fight where less happened than did:
the strip would be short by an amount the protocol never states, which is the failure this project
exists to prevent.

**Charge it to the side the ranking is showing.** That is the guess: the filter is the reader's
choice about what to look at, and it says nothing about who dealt a blow.

**Derive the missing end for a person rather than a side.** A side has members, and picking one
would put somebody's name on a figure the game never gave them. The pinned rows say which end is
missing instead, on every screen.
