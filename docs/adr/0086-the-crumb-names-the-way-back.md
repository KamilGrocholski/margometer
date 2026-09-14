# 0086. The crumb names the way back, and a row still does not

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

The panel is three levels deep (**ADR 0034**) and has two ways out of a level: a left press on the
crumb, which carries `data-back`, and a right press anywhere on it, which **ADR 0060** put on the
root and **ADR 0071** narrowed to the panel's own window. One of those two is named nowhere, and it
is the cheaper one — the one that needs no aiming.

What the panel said about pressing, until this decision, was one sentence: `CARD_WORDS.gesture`,
`"LPM — rozbicie"`, on the card of every row that opens. Its docblock decided against naming the
right press beside it, and the reason holds: a reader on the ranking has nowhere to go back to, so a
ranking row's card would promise a gesture that does nothing where it is read. `DESIGN.md` states
that rule — an affordance that lies is worse than none.

The reason stops at the crumb. The crumb is drawn **only** where a level is open
(`composeCrumbRegion` returns an empty slot otherwise), so every card it could carry is read at a
moment when both gestures do something. There was no card there to carry one: `.crumb-back` wore
`data-back` and nothing else.

The window beside the panel had the same gap with the sentence already written for it.
`STANDING_WORDS.openRow`, `"LPM — kto rzucił"`, was in the words module with no reader in `src/`:
its rows wear `drillable` and open onto the casters under them, and carried no card mark, so the
card never opened. That is the state `DESIGN.md` names — rows leading somewhere and saying nothing
teach a reader to stop pressing.

## Decision

**The crumb carries a card, and that card names both ways back.** `CARD_WORDS.gestureBack` and
`CARD_WORDS.gestureBackAnywhere` stand on it, and on nothing else the panel draws.

**All three notes say what happens, not what a cut is called.** The row's reads
`"LPM — rozwiń wiersz"` and the crumb's two read `"LPM tutaj — wróć o krok"` and
`"PPM gdziekolwiek — wróć o krok"` — one naming the press, where it lands, and what it leaves
behind. _Rozbicie_ is the word for what a row opens onto and stays the word for it; it was never the
word for the gesture, and a reader meeting it on a card had to already know the panel.

**A row's card still does not name the right press.** The condition is not whether the gesture works
— it works everywhere — but whether what it does is something where the card is read. The crumb
answers that by existing; a ranking row does not.

**The mark goes on `.crumb-back` alone.** The listener reads `data-tip` off the node under the hand
and walks no ancestors, so the way back reaches the card and the name beside it is left alone.

**The rows of the window beside the panel carry their card**, which is the sentence that was already
written for them.

**The two windows keep two registers.** The window is drawn before the panel is (`drawStanding` runs
ahead of `drawFightOnPanel`), and the panel's draw calls `register.reset()` — which took every card
the window had registered with it. `TipRegister` splits: `TipLookup` is what the pointer asks, and
the handle is handed a reading over both registers rather than either one.

## Consequences

Easy: the crumb's card costs one key, and `tests/ui/share-bound.test.ts` carries it in the widest
screen's arithmetic. The window's register is asked separately, against the rows it clamps to.

Hard: a card key is now stated in two places that must not collide. `crumb:back` and the `standing:`
prefix are constants rather than composed off a row, which is what makes that checkable by reading.

Also: the crumb's card names the level it leaves, so a reader hovering it is told where the way back
goes as well as how to take it. That was free — the name was already on the span.

## Alternatives

**Print the right press in the crumb itself.** Rejected: it takes width from the one cell that has
to shorten, and it is the second channel **ADR 0023** removed once already — a thing standing on
every draw to say what a card says on demand.

**Name the right press on every row's card.** Rejected for the reason the original docblock gave and
this ADR does not overturn: on the ranking it would promise a gesture that does nothing.

**Teach the gestures on the waiting screen**, where the panel has a centred sentence and nothing
else to say. Rejected: there is no fight, so there is no row to press and no level to leave — the
instruction would be read at the one moment none of it is true.

**Delete `STANDING_WORDS.openRow` instead of wiring it.** Rejected: it would leave a window whose
rows open and say nothing, which is the defect rather than the tidy-up.

**Reset the panel's register later, so one register serves both.** Rejected: the reset is what keeps
a card from describing a row that has stopped being drawn, and moving it makes that guarantee depend
on the order two windows happen to be drawn in.
