# 0049. A turn nobody spent is read by shape, not by words

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

**ADR 0048** put a turn count on the card and named the gap it leaves: the game numbers turns
**granted**, the panel counts turns **taken**, and a combatant who is stunned is given a turn and
spends nothing on it. Over `captures/` that difference is 175 turns inside the stretches the game
numbers, one-directional, on 18 of 19 recordings.

0048 refused to read them, and it refused the right thing for the wrong reason. It saw one road —
matching the sentence the server composes — and that road is language-dependent: `grooove.pl`'s
corpus carries the same announcement in Polish on one world and English on another, so a match on
the words would quietly count nothing wherever the wording differs, a failure that looks exactly
like a combatant nobody stunned.

There is a second road, and it reads no words at all. The sentence has a **shape**, and the shape is
the same in both languages:

- it opens with the combatant's own name, which this add-on already holds in the roster;
- the game puts a separator after that name;
- and it does **not** end in a full stop, which is how the game's other lines about a combatant do.

Measured over `captures/` on 2026-09-03, with no other condition: **319 matches, all 319 of them a
turn nobody spent, nothing missed and nothing else caught.** The three lines saying a combatant
struck a target already dead end in a full stop and fall out; loot lines put a colon after the name
and never match.

## Decision

**`txt` is opened for one reading and no other.** The decoder asks whether a `txt` message has that
shape and emits `TurnLostEvent`, which carries an **id** — the name is resolved where it is read and
none of the sentence travels further. `docs/protocol-keys.md`'s `txt` entry still says nothing of it
is stored, because nothing is.

**The count is per combatant and stands under the turns they took**, as a sub-line: `Tury wykonane`
with `utracone` beneath it. Two halves of one story, and neither divides anything.

**Both halves are what was seen, not what was scheduled.** `turnsTaken + turnsLost` is not the
number of turns the game gave that combatant, and no document here says it is.

**The register carries the count against the game's own numbering.** `docs/turns-taken.md` states
`short` — what the ordinal says went missing — beside `lost` — what the sentences announce. The gate
holds both as numbers and **does not demand they agree**: they come to 177 against 175 over the
corpus, exact on nine recordings, and a guard forcing equality would one day make somebody bend one
of the two.

## Consequences

Easy: the figure a reader would otherwise compute wrongly in their head. A player stunned eleven
times sees eleven, instead of wondering why their turn count is short.

Hard: the decoder now reads a key it read nothing from, and the shape it reads is the server's, not
a protocol key. A world whose announcement is shaped differently yields zero — and zero draws no
sub-line, so nothing on screen becomes false, but nothing says the reading found nothing either.
That limit is written into `docs/turns-taken.md` rather than left to be discovered.

Also unexplained, and kept that way: `2026-08-06-tempest-grupa-vs-hildur` states 22 missing turns
and announces 11, all of them the boss's, on the oldest build in the corpus. Eleven turns have no
account. The register shows both numbers rather than picking one.

## Alternatives

**Matching the sentence.** 0048's refusal, and it still stands — this reads the shape instead, and
the shape is what survives translation.

**Deriving it from the stun keys.** `+stun` occurs 101 times and `+stun2*` 17 against 319 announced
losses, so the keys do not predict the count even approximately. The help explains why: a stun's
length is cut by a reduction the protocol does not state.

**Attributing it by position** — charging the loss to whoever's messages stand before it. Measured
84.6% (270 of 319), because a combatant who loses a turn often produces no message at all around it.
Wrong on one row in six is not a figure to draw.

**Attributing it from the turn queue.** The ordinal says how many turns went missing, never whose:
every one of them sits in a gap wider than one turn, which is exactly where the queue stops stating
who acts and starts forecasting it. Measured at every step the game numbers a single turn apart:
zero losses, so the window where attribution is certain contains no material at all.
