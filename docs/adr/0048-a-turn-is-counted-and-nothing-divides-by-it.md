# 0048. A turn is counted, and nothing divides by it

- **Status:** Accepted
- **Date:** 2026-09-02

## Context

`a01bf11` removed turns from the panel entirely on 2026-08-12, and its body is the record of why:
the turn-order forecast was contradicted by the game's own later statements, message runs could not
see a combatant taking two turns in a row, and a fast fight — the case the maintainer actually plays
— arrives in one payload stating its numbering once, so the divisor was one and two tabs of three
went dead and stayed dead. That body named a third reading it said worked, counting actions, and
declined to build it: a divisor multiplies into every figure on screen.

`4f16e5c` picked the third reading up, measured it, and parked itself. Its own body lists what it
got wrong: it graded against `current`, a statement about **who**, where the queue's ordinal is a
statement about **how many**; and it repeated a claim that no key names a turn as though that
settled the envelope too.

What decides this round is a source neither of them had. The **published help** — article 372, read
2026-09-02 — says what a turn _is_:

- a turn is a **numbered action**, numbered from 1 upward, and only one character holds one at a
  time (§2.1);
- where the player lets the clock run out the server takes the action for them, so no turn passes
  without one (§2.2);
- the default actions are **two**, an attack and a step forward (§2.3);
- the extra attacks of a skill are **all one turn** (§2.1, and the `add_attacks` effect in §3.7);
- the client's own turn queue is a **prediction list** (§1.1), which is `turns_warriors`.

That is **V6** working as intended: the documentation settles the meaning and the recordings settle
the number. `CONTEXT.md` already defined a turn as one action by one combatant. The help says the
game defines it the same way, so counting actions is not a proxy for counting turns — it is counting
turns.

## Decision

**A turn is counted, per combatant, and called a turn taken.** `CombatantFigures.turnsTaken` holds
it and the card draws it beside `Ciosy`, under the game's own wording for the figure — the help
counts a combatant's turns with the same verb (§2.1). The game's numbering counts turns **granted**,
which is a larger number: a stunned combatant is given a turn and spends nothing on it. The
difference is measured rather than assumed, and `docs/turns-taken.md` carries it per recording. What
opens one is an announcement, a blow standing behind none, a `step` or a `prepare`; an extra attack
of an announcement still running does not, and neither does a `prepare` stated beside its own
combatant's action. `docs/turns-taken.md` owns the reading.

**Nothing divides by it.** No rate, no `na turę`, no per-turn share — the count stands on one line
of the card, where being wrong about it is visible on that line rather than moving every figure on
the screen. That is the failure mode the withdrawn rate strip had, and it is the one thing `4f16e5c`
had right.

**No fight-wide turn count is drawn.** The ordinal span would state one, and it is short by an
amount nothing states in the five recordings that join a fight in progress, and absent in a fight
the game numbers once. A figure that is silently short is what this project exists not to produce.

**Two questions are asked of the game's numbering, and they are tallied apart.** How **many** turns
passed between two of its statements is answerable across any advance — a turn taken and a turn
announced as spent on nothing are both turns it numbered, so both halves of what was seen are
counted against it. **Whose** the turn was is answerable only across an advance of one, because the
queue names the holder of the first ordinal and the nine above it are the forecast this ADR refuses
elsewhere. A wide boundary therefore grades the count and states nothing about the row.

Grading only the narrow ones was this decision's first form, and it was too weak by an order of
magnitude: it reached 451 turns of the 3552 the game numbered over `captures/`, and the narrow
boundary is the easy case. Asking the count of every boundary is the same reading held against eight
times the evidence, and it is what found the disagreements the register now lists.

**A stretch the game did not narrate is graded by nothing.** The payload's `mi` is a running index
over the fight's own messages; where it breaks, the game numbered messages it never sent here, and a
count held against those turns would be graded against silence. One boundary of the corpus earns
that refusal on 2026-09-03, and it is the whole of the one shortfall `docs/turns-taken.md` could not
previously account for.

**The wider grade stays beside the narrow one.** The stretch the game numbered end to end, where the
two figures do not meet and the shortfall is stated per recording — because a boundary grade says
what happened across each step and the stretch says what the fight came to, and a reader arguing
with the figure wants both.

## Consequences

Easy: the figure a reader asked for, on evidence rather than on a commit body somebody has to find.
A recording the corpus gains is graded the day it is admitted, and a reading that drifts fails the
gate rather than quietly moving a number.

Hard: `PRODUCT.md` loses a non-goal it has carried since `a01bf11`, and `CONTEXT.md`'s **Turn**
entry is rewritten. Both said this meter cannot honestly state a turn count. That was true of a
count with no reference; it is not true of one held against the game's own numbering at every
boundary the game both numbered and narrated.

Obliged now rather than later: the boundary grade produces a list of disagreements, all of them a
single turn and nearly all in one direction. Each is a claim that this reading opened a turn the
game did not number, and the two suppressions above are where such a turn would come from. The list
is the material a change to either has to be measured against, and it is not answered here — the
grading was rebuilt first on purpose, so that a change to the counting could be shown to help.

Also: two exceptions are carried in the reading rather than in a comment somewhere. They are
measured, they are named in `docs/turns-taken.md`, and a mutation of either lights the register.

Obliged later: the corpus is thin where it matters most. Nine of twenty-eight recordings state the
numbering once or not at all — five carry no queue in any payload and four carry exactly one — and
every one of them is a fast fight or an `auto` fight, which is exactly the shape the maintainer
plays. A recording of a long fight taken with the queue arriving would be the first material that
could contradict this.

## Alternatives

**Reading the turns a combatant lost, so the figure could be turns granted.** ⚠️ **Reversed by ADR
0049**, which reads the announcement's shape rather than its words. What is below was true of the
one road this ADR could see, and false as a statement about the announcement itself. The game states
a lost turn in a sentence of its own, naming the combatant. Reading it means matching the game's
prose inside the decoder, which today reads keys and nothing else — and `grooove.pl`'s corpus
carries that sentence in Polish on one world and in English on another, so a match would quietly
count nothing wherever the wording differs. It would be the first failure in this add-on that looks
exactly like a combatant who was never stunned. Refused, and the gap is stated instead.

**Counting by an enumerated list of action keys.** Checked against `captures/` on 2026-09-02: every
key on that list arrives on a skill announcement this reading already counts, and the only one
standing alone is a passive effect declared in a fight's opening payload — which such a list would
count as a turn. The event kinds say the same thing without the list going stale, and `a01bf11`
refused the list once already. ⚠️ The list was taken from `grooove.pl` and this entry said it was
how that reader counts. It is not: a later read of its engine found the list to be the minor half of
a rule that charges once per blow, so its figure is not this one. `docs/turns-taken.md` carries what
that reader does, and the alternative stands refused on the `captures/` check alone.

**Leave it at an action count and refuse the word.** `4f16e5c`'s decision, and it was right while
the only reference was `current`. The help settles the word, so refusing it now would mean the panel
carrying a name of ours beside a number the game agrees with.

**Fold every consecutive blow of one combatant into one turn.** It grades 99.6% against the sharp
test and destroys the one control this project has: over the boar recording it charges 4 turns where
`a01bf11`'s independent implementation and this one both charge 8. The queue hands a fast combatant
consecutive turns, so two default attacks in a row are two turns, and a fold that cannot tell them
from a two-hit skill buys accuracy where the game is watching by inventing it where it is not.

**Count `prepare` unconditionally.** Two graded steps of the corpus state a `prepare` beside the
same combatant's own blow, where the turn plainly went on the blow. Counting it there overstates.

**Draw the fight's turn count from the ordinal span.** Refused above, and worth restating as the
alternative it is: it is the one figure the game states outright, and it is unusable exactly where a
reader would most want it.

**Ship it without grading.** The measurements in `a01bf11`'s body were good enough to act on, and
skipping the grading would have saved two rounds. It is refused for the reason the register exists:
a figure whose only evidence is a commit message is a figure nobody can re-earn.
