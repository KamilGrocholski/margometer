# 0063. A shout covers a count, so the panel names the count

- **Status:** Superseded by 0064 in part
- **Date:** 2026-09-09

## Context

**ADR 0062** closed the provocation section with a line saying the game also catches others it does
not name, and dated a provocation the way an aura is dated. The maintainer asked whether the game
does not, after all, always name whom a shout is holding. It does not — and checking that turned up
two further faults in the same section.

**The wire names exactly one.** Measured over `captures/` on 2026-09-09: 158 shout occurrences,
every one of the form `shout=<one name>;…`, never a list. All 158 are cast by the players' side
against an opposing side holding **one**.

**The published table states a count, not a name.** Both skills carry
`shout=6@3,7@3,7@3,8@3,8@3,9@3,9@3,10@3,10@3,10@3` — six characters at skill level 1 rising to ten
at level 10 — and the table carries the game's own comment beside skill 25 (read 2026-09-08):

> `# shout to ilość przeciwników (randomowych) których zmusza się do ataku na siebie`

**Nothing else in the payload marks a provoked combatant.** The nine status bits the client tips are
`deep_wound`, `wound`, `critical_deep_wound`, `poisoned`, `fire`, `swow_down`, `speed_up`,
`frostbite`, `shock`. No provocation among them, so the roster is the only thing that can say who
else is under a shout.

**And the panel can usually tell there is no such other.** A side holds at most ten
(`src/core/combatant-roster.ts`), and the fewest a shout covers at any level is six. Where the
provoked side holds six or fewer, the smallest count the table states already reaches every one of
them — and the one figure the protocol does not carry, the caster's skill level, can only raise it.
Every recording in `captures/` is N against one, so ADR 0062's line was drawn in exactly the fights
where it could not be true.

**The provocation was dated by the wrong row.** It took the turns `composeAuraTurnsBySkillId` gives
the skill, which is the **longest** of its team-wide effects. For `Wyzywający okrzyk` that is
`alllowdmg` and `active_decblock_per-enemies` at five turns, while `shout` runs three: the window
drew `0 z 5 tur` under the word `Prowokacja`, holding a character two turns after the game had let
them go. `Prowokujący okrzyk` agreed at three only by coincidence.

## Decision

**A shout's value on the wire and its value in the table are two different readings of one key**,
and both are kept: the wire's is a character's name, read at run time and never stored
(`NOTICE.md`); the table's is a count of characters, frozen in `frozen/aura-turns.ts` beside the
turns.

**The count is the fewest the table states, across every skill level.** The protocol carries no
skill level, so six is what holds whatever the caster's is. A larger figure would be a guess about
somebody's character sheet.

**Where the opposing side is no bigger than that count, every one of it is provoked**, and the panel
names them all — one row each, the same caster and the same turns. The game naming one of them is an
accident of the wire, not a claim that the others are not held.

**Where it is bigger, only the character the announcement named can be said**, and the section
closes with the line ADR 0062 gave it, in `UNKNOWN_COLOUR`. That line is a claim, and it is drawn
only where it can be true.

**A shout is dated by its own row and never by the skill's longest effect.** A skill announcing a
provocation and a team-wide debuff in one message runs two clocks, and the provocation keeps its
own.

**A shout the frozen table states no count for is not drawn at all** — not as a provocation, and not
falling back to standing on a side. A cast the panel cannot date and cannot size is a cast it has
nothing honest to say about.

## Consequences

Easy: in a group fight the section becomes what a reader wants — who is on you, and for how long —
rather than one name out of six. And `Wyzywający okrzyk` stops overstating its hold by two turns.

Hard: **almost none of this is checkable on the material this repository holds.** Every recording is
N against one, so the opposing side is always one, the expansion always draws exactly the single row
it drew before, and the seven-or-more branch is never taken. What the corpus does settle is the
duration, and that every shout in it covers the whole of the side it was cast at — which
`tests/tools/aura-standing.test.ts` re-earns as `named one` being 0 in every row. The rest is held
by samples at the bound, from both sides. `TODO.md`'s first item is what would settle it.

Also: the expansion is over the **roster**, which is the fight's cast and not its survivors. A
character who has already fallen is still listed as held. Reading deaths here would need a health
reading joined to a cast, and the window has no other use for one.

## Alternatives

**Leaving the line unconditional.** It is one branch fewer and it is wrong in every fight the
repository has recorded. A line that cannot be true where it is drawn is worse than no line.

**Dropping the line entirely.** Honest in a small fight and silent in a large one, where the panel
would name one of ten and let a reader believe that was all of them.

**Naming the others.** The protocol never does, and article 372 says they are picked at random.

**Reading the count at the caster's actual level.** The wire carries no skill level, and a level
inferred from anything else would be a guess raising a figure the panel draws rows from.

**Keeping the aura's duration for the provocation too.** One duration per skill is simpler and it is
what drew `0 z 5 tur` under a three-turn effect.
