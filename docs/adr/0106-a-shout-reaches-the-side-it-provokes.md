# 0106. A shout reaches the side it provokes

- **Status:** Accepted
- **Date:** 2026-09-22

## Context

`src/core/aura-standing.ts` held `shout` as reaching the **caster's own side**. It was the one entry
in that table with neither a name that states a side — every other is `-enemies`, `-all`, `-allies`
or `aura-` — nor a measurement beside it, which `allslow_per` has.

**The help says the opposite, in the clause that defines the effect.** Its table of skill effects:
_zmusza Postacie, na które nałożony jest efekt, do obierania za cel ataku Postaci, która użyła
umiejętności_, and the effect lands on _Gracza, będącego celem umiejętności oraz losowo na pozostałą
liczbę Graczy_ (article `view,372`, read 2026-09-22). Nobody forces an ally to strike them; the
affected are opponents, and the characters the value names are the ones **carrying** the effect
rather than a target anybody is pointed at.

**The corpus says the same and leaves no room.** Over `captures/` on 2026-09-22, across 166
announcements of `shout`, **168 of 168 named characters stand on the side opposing the caster** —
none on the caster's own, and none the roster could not place.

**The reading came from a paraphrase, and it had spread.** `docs/protocol-keys.md` recorded the
effect as _forcing covered characters to attack a chosen target_, **ADR 0061** reasoned from that
sentence, `docs/auras-standing.md` restated it, `REACH_BY_KEY` encoded it, and
`tests/core/aura-standing.test.ts` defended it with a comment saying `Wyzywający okrzyk` points its
own side at somebody. Four live copies of one misreading, and the guard that should have caught it
was holding it up: its `both-sides` case was a pair that does not disagree.

## Decision

**`shout` reaches the other side.** It is entered with the help's clause and the 168 of 168 beside
it, so the next reader of that table finds the reason where the value is.

**Two verdicts in `docs/auras-standing.md` move with it**, and both become what the skills do:
`Prowokujący okrzyk` reaches **both** — it provokes the other side and raises its own side's melee
damage in one announcement — and `Wyzywający okrzyk` reaches **the other alone**, its `both` having
come from nothing but the wrong entry.

**A key with no side in its name carries a citation or a measurement.** That is what the entry was
missing, and it is the only reason it could be wrong for as long as it was. **Held by
`tests/core/aura-standing.test.ts`**, which reads the table out of the source and asks for a comment
beside every key whose name does not say its side — it found a second one on its first run,
`alllowdmg`, and that entry now cites the register.

## Consequences

Easy: nothing the panel draws changes. `reach` is read by `core/aura-standing.ts` and by
`tools/aura-standing.ts`, which prints the register, and by nothing a reader sees — **ADR 0062**
already refused to draw whom a side-wide cast reached.

Hard: **the test that defended the old reading had to be rewritten, not deleted.** Its rule — keys
that disagree reach both sides — is sound, and it now stands on `shout` with
`aura-adddmg2_per-meele`, which is the announcement that really does both. The pair it used before
has a test of its own saying what it actually does.

Also: **ADR 0061's premise is one of the four copies.** Its decision stands — a cast names only whom
the game names — and its text stays, as `docs/adr/README.md` requires. This record is what a reader
who finds that premise should find next.

## Alternatives

**Leaving `casters-side` and calling the corpus thin.** Ten provocations stand at the end of a
recording, which is thin; counting every announcement instead gives 168, which is not. The help
settles the meaning either way (**V6**), and the two agree.

**Reading the side off the target slot per cast instead of off the key.** The slot names one of the
provoked, so it would answer for that one character and say nothing about the rest — and **ADR
0010** measured what reading that slot costs on every other cast. The key is the thing the help
documents, so the key is where the answer belongs.
