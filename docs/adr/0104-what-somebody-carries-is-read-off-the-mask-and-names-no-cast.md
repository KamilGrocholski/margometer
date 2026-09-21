# 0104. What somebody carries is read off the mask, and names no cast

- **Status:** Accepted
- **Date:** 2026-09-21

## Context

**ADR 0101** found that a side-wide effect runs on each bearer's turns, and **ADR 0103** moved a
shout onto the turns of whoever it holds. The obvious next step is the same for an aura: a row per
ally, each with their own clock. The maintainer asked for it.

It cannot be done from the announcements. A cast names one end and never enumerates bearers, so
drawing a row per ally means **guessing** that a cast reached the caster's whole side, and **ADR
0049** rejected that at 84.6% with words that still bind: a mark saying "probably" does not make a
wrong row right.

That figure was re-measured rather than taken on trust, because the application is staggered — a
status lights on each bearer **at their own turn**, not at the cast — so a reading taken over a
window of payloads systematically misses everyone who has not moved yet. Three ways of counting
`Podwójny dech` against `speed_up` over `captures/`:

- over a window of payloads: **80.8%** of living side members, which is the old artefact;
- followed to each member's own eighth turn: **98.1%**, and dominated by bits that were **already
  lit** when the cast landed, so most of it is not evidence that this cast reached them;
- only where the bit was **not** already lit and then lit: **68.4%**, over 38 clean cases, and
  biased the other way — anybody the aura reached in the same payload is excluded as already lit.

So the truth sits between 68% and 98%, which is where **ADR 0049** measured it. The twelve misses
were looked at rather than assumed away: ten are ordinary living allies of levels 73 to 93 who took
turns and never carried it, and one of them misses three casts in a row in one recording. That is a
pattern this repository cannot explain, not noise.

## Decision

**A cast is not attributed to a bearer, and this is now the third reading saying so.** **ADR 0061**
stands.

**What each combatant carries is drawn instead, and it is read off the game's own statement.**
`w[].buffs` is one integer per combatant restated in every payload, its bits named in order by
`frozen/buff-bits.ts`. `src/core/carried-status.ts` turns it into a run per combatant per status,
counted in **their own** turns from the payload it first stood in.

**The section names no caster and no total**, because a mask states neither. `Co stoi` answers what
was cast; `Co kto nosi` answers what somebody is holding; neither finishes the other's sentence. The
figure is `3 tury` and never `3 z 8`: a denominator nobody published would be the invention this
record exists to refuse, and the card says so (`carriedLength`).

**A run keeps the turn it lit on.** A cast landing on a status already standing refreshes nothing
the mask can see, so re-reading the start would draw a length nobody carried.

**A payload saying nothing about somebody takes nothing away from them.** One stating only what
moved states no mask for anybody else, and clearing on that silence would drop a status every time a
short payload arrived.

**The nine statuses are named by the client**, asked under its own `buff` category and falling back
to the key as the game wrote it — the second and third rungs of **ADR 0024**. There is no first rung
here: this repository has no word for any of them, and inventing one would put a made-up label where
the game already has a real one.

## Consequences

Easy: it is the one per-combatant answer that guesses nothing, and it carries something no
announcement does — **an end that is witnessed**, which is what **ADR 0059** said the protocol never
gives.

Hard: **it is narrow, and the narrowness is the game's.** Nine statuses, covering attack speed and
damage over time. There is no bit for armour, resistances, block, critical force, damage taken,
reduced healing or a shout — so most of what `Co stoi` lists will never appear here, and the two
sections will look like they disagree when they are answering different questions.

Also: the client draws these nine as icons in its own window already. What it does not draw, and
what this adds, is **how long each has stood in that character's own turns**.

Also: a run that is refreshed reads as one long run, so a count can run well past any published
length. That is the mask's answer and not an error — and it is why the figure states no total.

## Alternatives

**A row per ally, marked as inferred.** What was asked for. Rejected on the measurement above, for
the third time and now with the artefact that flattered it named.

**Joining a status to the cast that lit it.** The bit says attack speed went up, not whose skill did
it — an item bonus and a teammate's aura are the same bit. **ADR 0061** named this and it holds.

**Saying nothing per combatant at all.** Where this stood before, and it leaves the one thing the
game does state per person unread.
