# 0103. A shout runs on the turns of whoever it holds

- **Status:** Accepted
- **Date:** 2026-09-21

## Context

**ADR 0101** found that a side-wide effect runs on each bearer's turns, and left the shout out of
it: no status bit stands for a provocation and the published help dates `shout` nowhere, so the
document said the claim was neither carried nor refused. **ADR 0102** then gave the shout's figure a
caveat saying nothing states a clock for it at all.

That was looking for the wrong kind of witness. A status is a thing the game states; a provocation
is a thing the game **makes somebody do**, and what they do is in every recording.

`tools/shout-holding.ts` reads it. Over `captures/`, counted on the held character's own turns and
stopped at the next shout of any kind (**ADR 0062**), the provoked strike whoever shouted on 185 of
their first 187 turns. The same characters, before the shout named them, already sent 79% of their
blows that way — most recordings are a group against one — and from their fourth turn on the share
falls **through** that baseline. On the caster's turns the same blows show no edge anywhere.

The edge sits where the published table puts it: three turns, and three of **theirs**.

## Decision

**A provocation is counted on the turns of the character it holds**, from the turn count they were
on when the shout landed. `composeAuraWalk` now keeps that number beside the cast, because the
moment a shout lands has to be read on the clock it will be measured against.

**A shout covers the next three turns they take.** It lands on the caster's turn, so nothing of the
held character's has passed yet — the figure opens at `0 z 3 tur` and the row goes when a fourth
turn of theirs opens. The boundary is the measurement's, not arithmetic's: their third turn is still
96%, and their fourth is already under the baseline.

**The figure moves to the row of whoever is carrying it**, superseding **ADR 0067** on the half that
stated it once under the caster. One cast holding two characters is two counts on two clocks;
stating one of them under the holder would pick a character without saying which.

**The caveat goes**, superseding **ADR 0102** on the shout's half. It said nothing states a clock
for a shout, and something does.

## Consequences

Easy: the panel already knew everything this needs. The shout names the characters it holds and the
roster resolves them (**ADR 0064**), and every combatant's turns have been counted since **ADR
0048**. No new reading, no inference, nothing added to the bundle.

Hard: **rows now leave earlier, and one corpus reading got smaller for it.** The shout register
counts what was seen standing at a step, and a shout whose held character had already taken four
turns by the next payload is no longer seen at all — `Wyzywający okrzyk` drops from ten casters to
eight. That is the old clock having held rows open past the game, not a reading lost.

Also: **the two halves of one okrzyk now run on two clocks as well as two lengths.**
`Wyzywający
okrzyk` holds somebody for three of their turns and debuffs the other side for five of
the caster's, and `tests/core/aura-standing.test.ts` walks both.

## Alternatives

**Leaving the shout alone and keeping the caveat.** What the round was going to do, until the
witness turned up. Keeping a sentence that says nothing is known, when something is, is worse than
never having written it.

**Reading the target slot instead of the shouted names.** **ADR 0064** settled that already: the
value names every provoked character, and the slot agrees 158 times out of 158 but says one.

**Taking the turns off a provocation entirely.** Considered as the honest answer to an unwitnessed
length, and the measurement made it unnecessary. It would have removed the one figure on that row
that is now the best-evidenced in the window.
