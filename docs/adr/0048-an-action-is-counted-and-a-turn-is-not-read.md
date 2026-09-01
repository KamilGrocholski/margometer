# 0048. An action is counted, and a turn is not read

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

`a01bf11` removed turns from the panel entirely on 2026-08-12. Its body is the record of why: the
turn axis forecast was contradicted by the game's own later statements, message runs could not see a
combatant taking two turns in a row, and a fast fight — the case the maintainer actually plays —
arrives in one payload stating one ordinal, so the divisor was one and two of three tabs went dead
and stayed dead.

That body names a third reading it says works, **counting actions**, and then declines to build it:
"a divisor is not something to land on a tired afternoon: it multiplies into every figure on screen,
and being wrong about it is invisible in exactly the way this project exists to prevent." It left
one figure to be argued with — 8 / 3 / 1 over the boar recording — and no code.

Three things measured on 2026-09-01 decide what happens next.

**The reading is already in the tree.** `sum(skills[*].uses) + blowsWithoutSkill` over
`src/core/fight-statistics.ts` is an announcement, or a blow carrying none, per combatant. Nothing
under `src/` has to change to count it.

**The definition `a01bf11` describes is not the one it had.** That reading charges the boar
recording 8 / 1 and not 8 / 3 / 1. The four missing actions are `step` declarations — the game's own
word for a combatant who moved and struck nothing. Counting those as well reproduces 8 / 3 / 1
exactly, which is what says the definition recovered is that one rather than a near neighbour. The
commit body was describing its implementation loosely, and only the control figure caught it.

**There is a reference `a01bf11` never had.** `current` names who acts **next**: the payload
carrying it states whose turn is beginning, and that turn's actions arrive in the payload after it.
Grading a payload against its own `current` puts every recording at `never`; grading it against the
one before puts most of the corpus at `always` or `sometimes`. That is a statement of the game's own
to check an action count against, payload by payload, rather than the whole-fight ratios `a01bf11`
was working with.

## Decision

**An action is counted and named an action; a turn is neither counted nor named.** The count is what
this repository observed — an announcement, a blow carrying none, or a `step` — and it makes no
claim about the game's numbering. `PRODUCT.md`'s non-goal and `CONTEXT.md`'s **Turn** entry stand
unchanged.

**The count is graded before it is drawn.** `tools/action-count.ts` grades both definitions against
`current` and `docs/actions-taken.md` carries the verdicts, held by
`tests/tools/action-count.test.ts`. Nothing reaches `CombatantFigures` or the panel in this round.

**Nothing divides by it.** If the count ever reaches the panel it is a count on a card, beside
`blowsStruck`. A wrong count is then visibly wrong on one line rather than quietly moving every
figure on the screen, which is the failure mode the withdrawn rate strip had.

**The reading is read twice and the two must agree**: off the rows, which is what a panel would
draw, and off the events, where an action the protocol named no actor for is visible and a row
cannot hold one. A disagreement is a finding.

## Consequences

Easy: deciding whether the figure is good enough to draw, on evidence rather than on a commit body
somebody has to find. The register says recording by recording whether the combatant the game named
went on to act, and a recording the corpus gains is graded the day it is admitted.

Hard: two definitions are carried where one would do. That is deliberate for as long as the choice
between them is live — `stepped` grades no worse than `struck` anywhere in the corpus and better in
places, but it is a wider claim about what the game means by `step`, and `docs/protocol-keys.md`
declines to call that key a turn boundary.

Obliged later: a second round to put the figure on the panel, or a note here saying it did not earn
its place. Until one of those happens `TODO.md` keeps the item, by the maintainer's hand.

Also obliged: `tools/fight-replay.ts` now hands out a **copy** of the reading rather than the
session's own arrays. `getFightFromSession` aliases them, which is invisible while one reading
exists at a time and silently wrong the moment a caller holds several — every step reported the
whole fight and every delta between two of them was nothing. The step-by-step replay is the first
caller to hold several; the next one inherits the copy.

## Alternatives

**The turn axis forecast.** `turns_warriors` states ten entries, nine of them turns not yet taken.
`a01bf11` measured it contradicted by the game's own later statements 3% of the time one turn ahead
and 28% at nine. Rejected there, and nothing since changes it.

**Message runs.** Consecutive messages of one actor, numbered by the ordinals the game states.
`a01bf11` measured it attributing 1202 of 1228 ordinals and agreeing with the forecast on 91.2% of
those both named — but it cannot see a combatant taking two turns in a row, which is the norm in the
fights this add-on is used in. Rejected there.

**Ship the count straight onto the panel.** The measurements in `a01bf11`'s body are good enough to
act on, and skipping the grading would have saved this round. It was rejected because those
measurements no longer describe this tree: the boar control moved, and the reason it moved was a
definition nobody had written down. A figure that multiplies is worth one round of evidence.

**Call it a turn anyway.** The count would then be falsifiable in the way **V6** wants, and the
disagreement with the game would be the finding. Rejected for the same reason `PRODUCT.md` rules
turns out: in a fast fight the game states one ordinal and this count states many, so the panel
would be contradicting the game on the screen of the person who just played the fight.
