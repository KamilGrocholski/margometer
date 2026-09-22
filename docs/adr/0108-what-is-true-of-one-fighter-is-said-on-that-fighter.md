# 0108. What is true of one fighter is said on that fighter

- **Status:** Accepted
- **Date:** 2026-09-22

## Context

**ADR 0107** gave this add-on a surface that answers about **one fighter**: the game's own tooltip,
a row per thing, under the pointer that already names whose row it is. The window beside the panel
was drawing two sections about the same subject, and drawing it worse.

**`Co stoi` counted on the wrong clock.** **ADR 0101** measured that a side-wide effect runs on the
turns of each character carrying it; the section counted the **caster's**, because a cast has no
bearer to be counted on and **ADR 0061** refuses to work one out — the reach and the sides give the
right bearer 84.6% of the time, and a name that is wrong one time in six is a name this panel does
not print. **ADR 0102** kept the figure and bought it with a caveat, `standingLength`.

**`Co kto nosi` had no denominator to draw.** The mask says what somebody carries and never how long
it runs (**ADR 0104**), so the section drew a bare count of turns, while the tooltip drew
`3 z 8 tur` for the same status on the same fighter, on that fighter's own clock
(`core/carried-figure.ts`). `docs/auras-standing.md` recorded the outcome plainly: a reader hovering
a fighter and reading the window saw **two numbers for one effect**.

The two repairs the window could have had were both refused before this round. One needs the bearers
of a cast, which is **ADR 0061**. The other needs a total for a mask bit, which the game publishes
nowhere.

## Decision

**The window says what is true of the fight; the tooltip says what is true of a fighter.** The
window keeps the turn in hand, the charge being made ready, and who is holding whom. `Co stoi` and
`Co kto nosi` are drawn no more, and the two caveats bought for them — `standingLength` and
`carriedLength` — go with the figures they qualified.

**`Prowokacja` stays, and it is the test of the rule rather than an exception to it.** A shout names
the characters it holds, by name, on the wire (**ADR 0064**), so each row is a person the game
itself named and the length on it is counted on that person's own turns (**ADR 0103**). A section
whose rows are people keeps its figures; a section whose rows are casts had none it could place.

**The readings stay in the core.** `core/aura-standing.ts` goes on composing the side-wide standings
and `core/carried-status.ts` the mask — the tooltip path reads both, and `tools/` reads the first
for `docs/auras-standing.md`. What ends is the drawing, not the reading.

## Consequences

Easy: two figures nobody could defend are gone, two caveats with them, and the window is shorter by
everything it drew per combatant. The register in `tests/ui/share-bound.test.ts` loses two terms.

Hard: **the reader loses the only place that named a caster.** A mask names no cast (**ADR 0104**)
and the tooltip names none either, so `who cast this on us` is now unanswerable anywhere in the
add-on. Whoever wants it back builds it on the bearer rather than on the cast, which is the round
**ADR 0102** already pointed at and did not take.

Also hard: **the window no longer answers about the whole board at once.** A tooltip answers about
the fighter under the pointer, so what was one glance is now one hover per fighter. That is the cost
of every figure in it being one somebody can be shown.

## Alternatives

**Keep `Co stoi` with a stronger caveat.** This is **ADR 0102** exactly, shipped for one release. A
sentence under a figure does not stop a reader taking the figure, and the sentence itself had to say
that the number is true of one person on the row and of nobody else the cast reached.

**Move the length onto the bearers inside the window.** It is the honest shape and it needs the
bearers of a cast, which **ADR 0061** measured and refused. Reopening it is a round of its own, on
the mask rather than on the announcement.

**Keep the rows and drop the figures.** A section saying `Piętno bestii` and nothing else says that
something is standing on somebody, which is what `Co kto nosi` said with a name attached — and that
section is going for its own reasons. Two sections short of an answer are not one answer.
