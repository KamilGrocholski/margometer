# 0097. An okrzyk stands twice, because the table dates it twice

- **Status:** Accepted
- **Date:** 2026-09-18

## Context

**ADR 0067** settled that the okrzyk holding somebody is named nowhere:

> The skill name is drawn nowhere. Both shouts run 3 turns and cover 6, so naming which one it was
> distinguished nothing a reader can act on.

**That premise is false, and the published table is where it fails.** The two okrzyki announce
`shout` beside different keys, and `frozen/skill-durations.ts` dates those keys apart:

|  id | skill                | the shout half   | what else it announces                                                   |
| --: | -------------------- | ---------------- | ------------------------------------------------------------------------ |
|  25 | `Prowokujący okrzyk` | `shout`, 3 turns | `aura-adddmg2_per-meele` — the caster's own side                         |
| 188 | `Wyzywający okrzyk`  | `shout`, 3 turns | `active_decblock_per-enemies`, `alllowdmg` — the other side, **5 turns** |

`frozen/aura-turns.ts` states the side-wide half at 3 for skill 25 and **5** for skill 188. So one
okrzyk taunts and buffs its own side, the other taunts and debuffs the opposing side for two turns
longer than the taunt — and the panel drew neither the difference nor the name that would let a
reader infer it.

**The corpus carries both shapes, and one of them was recorded wrong.** Measured over `captures/` on
2026-09-18: `Wyzywający okrzyk` announces `shout` 118 times in 17 recordings, `Prowokujący okrzyk`
47 times in 6, and the two shapes never mix. `docs/protocol-keys.md` claimed at the `shout` entry
that _"every occurrence sits on an announcement that also carries `active_decblock_per-enemies` and
`alllowdmg`"_, which describes 118 of the 165 and none of the other 47. The register's own
`_Shape:_` lines carried the contradiction — `alllowdmg` at 118 against `shout` at 165 — and nothing
read them against each other. Corrected in the commit before this one (**V6**).

**The second half was read and then thrown away.** `src/core/aura-standing.ts` put a shouting cast
into the provoked map and never into the skill map, on the ground that _"drawing it twice would
count one cast as two things standing"_. With the two halves dated apart, they are two things.

## Decision

**An okrzyk stands in both registers, because the published table dates both of its halves.** Its
side-wide half stands among the whole-team casts on its own stated turns; its shout goes on holding
characters on the shout's own turns. A cast dated on one half only is read on that half alone, and
one dated on neither is no cast at all.

**The row holding somebody names the okrzyk**, after the holder's name and in the quiet ink. **ADR
0067**'s fold is unchanged — one row per cast with the characters it holds beneath — but the fold is
keyed by the cast rather than the caster, because a group drawn under a name must be a group that
cannot hold two.

**The section is otherwise untouched**, and so is **ADR 0062**: no reach line, no `na:`, no `w:`,
and the heading goes on counting characters held.

**What a `Co stoi` row draws is unchanged.** The okrzyk is an ordinary row of that section — the
name, the casters counted by side, and the turns a press away. It states no figure the others do
not.

## Consequences

**Skill 188 states two turn figures for one announcement, in two sections.** `Wyzywający okrzyk`
will read `1 z 5 tur` where it stands and `1 z 3 tur` where it holds. That is the finding rather
than a duplicate: the taunt really does end two turns before the debuff. Skill 25 reads `1 z 2 tur`
where it stands and `1 z 3 tur` where it holds: the table dates its side-wide half at 2 and its
shout at 3 (`frozen/skill-durations.ts`, read 2026-09-21). It read 3 in both places until then,
because the side-wide half was dated by the longest of every key reaching a side, the shout among
them — the mirror of what ADR 0063 forbade, and the same fold this decision undoes.

**Three cells now share one row, and the order they give way in is stated in the stylesheet.** The
panel's own rule gives a row's name `flex:1`, which is basis `0` — the name takes what is left
rather than what it needs. Measured in Chrome at the panel's own size on 2026-09-18, that drew
`Gracz 4` at 3px of the 42 it wanted, because the okrzyk had claimed the row's width as its basis
first. Reversing it erased the okrzyk to 4px behind a 25-character nickname instead. So the name is
sized by its own text and the cast takes what is left, down to a floor of 48px: `Wyzywa` is 49px and
`Prowok` 44px, and the two spellings differ from their first letter, so what survives a cut still
says which one.

**This is a browser-only claim and the unit suite was blind to it.**
`tests/e2e/panel-standing.spec.ts` holds it, and it holds the floor and the sizing separately — each
was proved by a mutation that lights it.

`docs/auras-standing.md` no longer says the two okrzyki are absent from the aura register. They are
in both tables, and their two rows are what re-earns the claim this record rests on: were the
okrzyki one shape, skill 25 would read `other` and 5 there rather than `caster's` and 3.

The source register in the same document gains `active_decblock_per-enemies`, `alllowdmg` and
`shout`, because an okrzyk that stands is counted like any other cast.

## Alternatives

**Naming the okrzyk and nothing else.** The literal ask, and the cheapest — `ProvocationStanding`
already carried `skillName`, so it is a drawing change and no more. It leaves the debuff invisible
and the five turns unstated, and the reader supplies the mechanic from their own knowledge of the
game. That is the half of the request that was written down rather than the half that was meant.

**Standing the half without naming the okrzyk.** The name would arrive anyway on the `Co stoi` row,
so nothing is lost outright — but the reader has to tie two sections together by eye to learn which
cast is holding them, and the `Prowokacja` row goes on refusing to say.

**Drawing which side the okrzyk reaches, under its row.** The clearest statement of what the buff or
debuff lands on. **ADR 0062** refused it, and the reason has not changed: `na: My` sat where a
nickname sits, in the ink a nickname is drawn in, and was read as a player called _My_.

**Leaving the turns folded into one figure.** One announcement, one length, one row — which is what
stood until now. It states the shorter of two lengths for both halves, so the debuff is drawn as
over two turns before it is.
