# A row opens only what it does not already say

Status: implemented

The drill has three levels and the panel has always refused to *draw* a section
that repeats the figure standing over it — `composeCrossSection` in
`src/ui/panel-drill.ts`, whose own docblock names `Leczenie` as the screen that
produced three such sections in a row. This is the same rule one rung earlier, on
the **affordance**: a row is drawn drillable only where the level under it adds a
name the reader did not already have.

## What was asked for

> After the healing changes for `actor` and `target` prove, that the view and the
> logic is correct - probably a useless drill exists in the healing tabs

## The logic was correct; the drill was not

Re-measured off the composers over the captures as the set stood 2026-08-19,
with the entry health fed in:

- healing given and healing received are **2 749 855** each, equal, which is
  `docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`'s reading arriving
  intact at the panel.
- **No `Nieznany sprawca` row** survives on either healing screen, in any capture,
  on any side tab.
- The two healing rankings are identical in **4 of 17** fights — the solo ones,
  where every heal really is the fighter's own — so `Leczenie dane` has not
  collapsed into `Leczenie`.

What was wrong was the level below. Every drillable row of every breakdown, in
every metric, opened and classified:

| the row | drills | opened one row: the reader's own name | opened one row: a closing row | opened something new |
|---|---|---|---|---|
| `Leczenie` → a skill | **250** | **250** | 0 | **0** |
| `Leczenie dane` → a skill | 59 | 13 | 0 | 46 |
| `Leczenie` → a person | 330 | 0 | 86 | 244 |
| `Leczenie dane` → a person | 330 | 0 | 86 | 244 |
| `Zadane` → a skill | 223 | 0 | 0 | 223 |
| `Zadane` → a person | 262 | 0 | 6 | 256 |
| `Otrzymane` → a person | 262 | 0 | 6 | 256 |

**The 250 are degenerate by construction.** Under `Leczenie` the level below a
skill narrows to the combatant already in focus — it has to, because the row was
entered from what that skill gave *this* combatant and the rest of the skill is
deliberately absent — so it can only ever draw one row, bearing the reader's own
name and the figure they just clicked. Not sometimes: 250 of 250.

`docs/specs/2026-08-11-the-panel-that-drills.md` drew that section without an
arrow the day it was specified. The code had said otherwise ever since, and the
two healing rounds turned 34 dead clicks into 250.

The rest are self-sourced heals with nothing announced over them: `CZYM — <name>`
holding one `Nie wiadomo, czym … (100%)` row, and no element cut beside it because
healing has none at all.

## What changed

`isDrillable` was a constant `true` in two places and is a question now,
answered by **composing what the level would hold** — never by a second rule
about it. A predicate written alongside `composeDeepLists` is two spellings of
one question and the disagreement is silent: an arrow leading nowhere, or none
where there was something to see (§9.3). So `shouldOpenPair` calls the level's
own `composeNamedPairSkillEntries` and `getPairReading`, and `shouldOpenSkill`
calls its own `getSkillPairs` — three readers lifted out of `composeDeepLists`
for that and for nothing else.

`src/ui/panel-element.ts` already registers a row's key only where the row is
drillable, so a leaf press is inert with nothing added there and nothing added in
`src/ui/panel-state.ts`.

**Every degenerate bucket goes to zero and every other count is unchanged** —
223, 256, 244, 46, 244, 256 before and after. Nothing that had something to say
lost its arrow.

One consequence worth stating rather than discovering:
`2026-08-04-tempest-lowca-vs-odyncze` now offers **no third level at all**. A solo
hunter announces nothing all fight and every pair it fought carries one element,
so every level below that fight's breakdown would have been the figure restated.
That is the rule working. It cost the sweep its per-capture floor, which asked
that each capture drilled at least once; the floor is rows met now, and *is there
a level at all* is asked of the corpus per metric one test below — the shape
over-reach would actually arrive in.

## What the rule uncovered, and the section that had to come back

The first reading of this change defended one capture badly. Asked whether the
loss scales with the number of opponents, the corpus answers **no, and the other
way round**: 98 screens lost their third level, and 89 of them are healing a
combatant gave themselves, where the level below was the row written twice. Only
9 are damage, and every one is in the two duels — no group fight lost a damage
drill at all. More opponents means more announced skills and more elements in a
pair, so the level below has more to say, not less.

But those 9 were a real loss, and chasing it found an older defect one rung up.
`composeCrossSection` hid the skills cut wherever it held a single row, on the
grounds that one row repeats the total standing over it. **`Zwykły cios 2 644
(100% · ×8)` does not.** It says eight blows where the figure above says none,
and the count is the whole question a plain attack raises — a combatant who
announced nothing all fight has no other row that can carry it. So for exactly
those combatants the panel never said it, and the drill below was the only place
left holding it: without the count, and one click away.

The suppression now asks what the one row is rather than only how many rows there
are, and the exemption is the **closing row's alone**. Over the captures that
draws **27** cuts that were hidden, all of them under `Zadane`.

⚠️ **It was written wider first — any row carrying a count — and the measurement
took it back.** That drew 58, and the extra 31 are lone *announced* skills, which
is a different case entirely: at the deep level a named skill states its own use
count while the closing row states none, so of the 31, **31 are reachable** by
opening any person the skill was used on, and of the 27, **none** is reachable
anywhere. The wide rule read well and drew 31 sections repeating what a click
already showed, which is §7.1's line — the smallest thing that addresses the
problem — failed by a criterion chosen for its shape rather than for what it was
measured to catch.

The element and source cuts carry no count at all and stay hidden, which is the
case the suppression was written for in the first place.

What is left silent is silent honestly: **90** breakdowns still say nothing beyond
their first list, and they are `Otrzymane` — where the protocol never states what
hit you, so there is no skills cut to draw — and self-heals, where the recipient
is the row itself.

## What the guard holds

`tests/game/engine-attachment.test.ts`, *opens what each row promised* — the
sweep that caught the empty self-heal level in `58e3b95`. It keeps its two
assertions and gains a third: the level a drillable row opens holds a row that is
neither the row's own label, nor the name of the combatant in focus, nor one of
the keys that carry a figure and no name.

**And it was reading a corpus 1 604 444 points of healing short.**
`composeFightStatistics` sizes the team heals against the entry health, its third
argument defaults to none, and this harness never passed it — so the sweep had
never seen a sized `healall_per`. Feeding it takes the healing pairs it opens from
140 to 330 and the healing skill rows from 34 to 250. That is why the level under
them went unread for the two rounds after `healall_per` started reaching rows, and
it is the finding this round would have been worth having on its own.

Three mutations were watched. Both halves of the affordance, put back to `true`:
the skill half reddens 14 of
17 captures, the pair half all 17. The closing-row clause in
`composeCrossSection` was mutated twice — dropped entirely, and widened back to
any row with a count — and each reddens two tests across two files.

## Rejected alternatives

**Leaving it.** 250 of 250 is not a corner case.

**Drawing the level and saying it is empty.** The panel already answers this one
rung up by not drawing the section; a second answer to the same question is worse
than either alone.

**A predicate alongside `composeDeepLists` instead of composing the level.**
Cheaper per render and wrong the first time either side moves, with nothing loud
about it — §9.3's *a name this repository did not choose is spelled once*, applied
to a rule rather than to a name.

**Exempting every row that carries a count.** Elegant, and 31 of the 58 cuts it
draws restate a skill the reader reaches by opening the row above. The criterion
that survives measurement is the narrower one, and it is narrower for a reason
that can be checked rather than argued: nothing else in the panel states how many
blows nobody announced.

**Healing only.** The damage cases are the same shape at a smaller count — 6 under
`Zadane`, 6 under `Otrzymane`, all of them a pair whose every blow was unannounced
and whose one element cannot make a cross-section. A rule that holds for three
metrics and not the fourth is not a rule.

**Keeping the healing-received branch of `getSkillPairs` as dead code.** It is the
opposite of dead: the narrowing is what `shouldOpenSkill` reads to make that row a
leaf. What did die is the exception beside it — `composeDeepLists` no longer needs
to refuse a closing row under `Leczenie`, because nothing can open that level.
