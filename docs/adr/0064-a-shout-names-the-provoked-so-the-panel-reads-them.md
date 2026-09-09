# 0064. A shout names the provoked, so the panel reads them

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

**ADR 0063** worked out whom a shout holds by arithmetic: the published table states a count of
characters, a side holds at most ten, so where the opposing side is no bigger than the count, every
one of it is provoked. It was the best reading available while every recording in `captures/` was N
against one, and it was inference standing where a reading belongs.

**The first fight between players settles it.**
`captures/2026-09-09-tempest-duet-vs-wojownik-ne0iTNdg-0.14.0.json` — two players against one, the
first recording written from side 2 — carries the announcement:

```
shout=Gracz 3, Gracz 2;active_decblock_per-enemies=10;alllowdmg=5
```

Both members of the opposing side, **named, separated by a comma and a space**. That is the grammar
`docs/protocol-keys.md` already documents at `winner`, which the same fight ends with
(`winner=Gracz 2, Gracz 3`), and which `src/core/fight-decoder.ts` already splits on. The maintainer
stated it a round earlier; this file is the evidence.

**The client agrees without settling it.** Its battle-log branch interpolates the value **whole**
into `msg_shout %name%` — _Uwaga %name2% została skupiona na %name%._ — where the neighbouring
`frost` branch splits its own on commas first (production build `1785244275300`, read 2026-09-09).
So the game prints a list unsplit rather than refusing one, and the sentence puts the value where a
subject goes.

## Decision

**The provoked are read off the value.** `src/core/aura-standing.ts` splits the `shout` effect's
text on the decoder's `NAME_SEPARATOR` and resolves each name through the roster.

**A name the roster cannot place is dropped, and never guessed at.** `getCombatantIdByName` answers
null both for a name nobody carries and for one two combatants answer to, and both are the same
answer here: that character is not held. The panel would rather hold fewer than hold the wrong one —
which is **ADR 0010**'s rule for the target slot, applied to a name.

**The expansion over the opposing side goes**, and with it the count it stood on. So does the line
closing the section — _i losowo inni, których gra nie nazywa_ — because the game names them all and
a claim about a rest is a claim about nobody. `ProvocationStanding.isWholeSide` and the
`.standing-others` rule go with it.

**The target slot is no longer read for the provocation.** It named one of the two here, so it was
never wrong; it is simply the poorer of two readings, and the value is the better one at any side
size.

**The published count stays frozen and is drawn nowhere.** `frozen/aura-turns.ts` keeps
`coverageMinimum` because it is a true reading of the published table and
`tests/tools/skill-table.test.ts` re-earns it off a transcript. `docs/auras-standing.md` reports it
and says outright that nothing branches on it.

## Consequences

Easy: the reading holds at any size of side, needs no arithmetic, and states only what the
announcement said. The corpus now exercises it — `tests/core/aura-standing.test.ts` names that
recording and asserts both characters are held.

Hard: **one recording is the whole of the evidence.** A shout naming three or more is still
unrecorded, and so is a value naming somebody the roster does not carry. Both are held by samples
rather than by material.

Also: the sentence _every recording is N against one_ was load-bearing in **ADR 0062** and **ADR
0063**, and it is no longer true. Those records keep their text, as `docs/adr/README.md` requires;
what they say about the corpus was true when it was written.

## Alternatives

**Keeping the expansion and reading the value only as a check.** Two readings that must agree, and
the arithmetic is the one that breaks first — at a side of seven it silently stops naming anybody it
could have named.

**Taking the first name of the value.** It is what a reader who had never seen a comma would write,
and it holds one of two in the very first fight that carries a list.

**Holding a name the roster cannot place, as an unknown row.** The panel has a vocabulary for what
the protocol named nobody for, and this is not that: the game named somebody, and this repository
could not find them. That is a defect to notice, not a row to draw — and no material shows it yet.
