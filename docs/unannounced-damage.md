# What no announcement covered

The row a damage section closes against, what reaches its figure, and why that is not the same
question as what reaches the count beside it.

The panel draws it as `Zwykły cios`, wearing the caveat mark since **ADR 0089** — the one row of a
list that does. **ADR 0078** says how far an announcement reaches and **ADR 0079** why the row takes
a place among the rows above it; `DESIGN.md` owns how it is drawn and `docs/drill-levels.md` which
rows open onto another level. None of that is repeated here. What this document owns is the **path a
figure takes to get into it**.

**Read off the recordings, not written from memory.** `tests/tools/unannounced-damage.test.ts`
composes every figure below over `captures/` and asks this file to carry it word for word. A number
here that stops being true fails the gate.

```bash
deno task fight:figures      # the figures of every recording, combatant by combatant
deno task panel:drill        # which rows the panel draws, and which of them open
```

## The two numbers

The row carries a figure and, on `Zadane`, a count of blows beside it. ⚠️ **They are composed by two
different walks, and neither is derived from the other.**

The **count** is `blowsWithoutSkill` in `src/core/fight-statistics.ts`: one added for every attack
event whose announcement is null, charged to whoever struck. It counts blows and nothing else.

The **figure** is `plain` in `composeSkillCut` (`src/ui/panel-reading.ts`), and it is a
**remainder**: the figure over the section minus what the named rows hold. Nothing walks the blows
to compose it. So whatever reaches the figure over the section without reaching a skill's row lands
here — whether or not it was a blow.

That is what the rest of this document is about.

## From a message to the row

Four messages, each a transcript rather than a sample, and each the whole of a path.

**An announcement, and the blow that rode it.** Two messages: the first names the skill, the second
carries the damage. The blow reaches that skill's row and never this one.

```
15486=100.00;-10042309=0.06;tspell=Okrzyk bojowy;skillId=271
15486=100.00;-10042309=0.00;+dmg=917;-dmg=760
```

**A blow with nothing in front of it.** The same shape, and no announcement this combatant made
reaches it — so its applied damage lands here, and the count beside the row goes up by one.

```
482845=100.00;-161518=70.07;+dmgd=466;+acdmg=5;-dmgd=223
```

⚠️ **Neither of the two blows above says which it is.** Both carry keys of one family and nothing
else to tell them apart; what decides is the message before, and how far it reaches (**ADR 0078**).
`docs/protocol-keys.md` owns what each key means and how the family is recognised.

**A wound ticking.** One message, no blow in it, one end named. On `Zadane` it is charged to whoever
left the wound and reaches no skill, so it lands here. The count does not move — this was not a
swing.

```
-10000249=99.95;0;injure=148
```

**Health lost outside a blow.** The same shape under another key. On `Otrzymane` it lands here for
want of a row a key could stand in; on `Zadane` it reaches nobody's row at all unless a wound of
theirs is what ticked.

```
-10000243=25.11;0;poison=136,20
```

## What reaches the figure

| what                                  | which screen | how it gets there                     |
| ------------------------------------- | ------------ | ------------------------------------- |
| a blow standing under no announcement | both         | the attack event's own applied damage |

That is the whole table, and it was not always. ⚠️ **Until **ADR 0080** this row also held health
that went out under a key without a blow carrying it** — a tick of poison, a wound bleeding, the
`heal` key below zero. On `Otrzymane` that was 23.9% of it, and 6 rows over `captures/` held nothing
else, drawn as the closing row with `×0` beside them. The keys now stand under their own names, as
they always did on the healing screens, and what is left is blows.

Measured over `captures/` on 2026-09-19, the row holds **2,163,634** on each damage screen — the
same figure from both ends, because it is the same blows read from the striking side and from the
side struck. It is drawn in 174 sections of `Zadane` and 102 of `Otrzymane`, and the keys beside it
come to 113 rows.

## What never does

- **Neither healing screen closes at all.** `plain` is nought there by construction: one condition
  sends a movement to a skill's row or to the key cut, never to both and never to neither (**ADR
  0051**). The two healing entries in the panel's own table are never read.
- **Damage a blow reports against a name** (`+oth_dmg`, `docs/protocol-keys.md`) carries the
  announcement of the blow it rode, so it reaches a skill's row like any other figure. ⚠️ **That is
  a measurement and not a construction**: the corpus states 1,193 figures against a name and 0 of
  them stand under no announcement. Where one did, it would reach this row — the figure is a
  remainder, so it takes whatever no row named — and it reaches the cut under the row with it, so
  the level and the row over it cannot answer one press two ways (**ADR 0081**). The count beside
  the row does not move either way: a figure riding somebody else's blow is not a swing.
- **What a display bound would not draw** is summed into a row of its own and never folded in here
  (**ADR 0055**). That row holds what the game **did** name; this one holds what it did not.
- **Health that went out under a key** stands under that key (**ADR 0080**). It moved under a name
  the game gave it, so a row named for a swing is the wrong place for it — which is the rule the
  healing screens were already keeping.

## The bounds

Two constants decide what this row can come to.

`MAXIMUM_SKILLS`, in `src/core/fight-statistics.ts` and `src/ui/panel-reading.ts`, is 256, and it
bounds two different things under one name. In core it asserts how many skills **one combatant** may
be kept under; the widest over `captures/` holds 8. In the layer a reader touches it folds how many
names **one section** will draw, and a received section gathers every striker's, so the widest there
is a fight's own count: 31. It is a fold rather than an assertion there because an assertion would
stop the panel at exactly the moment the bound was reached. Past it a name joins the summed row
rather than this one — which is the whole of **ADR 0055**.

⚠️ **Both figures are measured 2026-09-13, and neither is the one the source cites.** The comments
beside the constant carry the count of distinct names over the whole corpus, which is a third number
again and bounds nothing: what the assertion holds is per combatant, and what the fold holds is per
section.

`MAXIMUM_BLOWS_GRANTED`, in `src/core/fight-decoder.ts`, is how many messages one announcement can
reach. It is 4. ⚠️ **No recording reaches it, and the material falsifies neither that number nor any
other** — the longest run of an announcer's own consecutive blows over `captures/` is 2, and the
longest run of anybody's is 3, both 2026-09-13. What picks the number is that the two ways of being
wrong do not cost the same: too low and a blow falls back into this row, where it stood before **ADR
0078**; too high and a combatant's plain blows are charged to whatever it announced before them.

## What this cannot answer

⚠️ **Whether a blow standing under no announcement is a plain attack, or one whose announcement this
reading did not reach.** Nothing in the message says which (see above), and the count is the whole
of the evidence: every blow in this row opened a turn of its own, which is what the game does for
its default action. A skill striking more times than the published table grants would still land
here, and no recording carries one — 0 runs of three after an announcement, 2026-09-13.

⚠️ **Whether a blow standing here was a further target of a wide swing.** `docs/protocol-keys.md`
owns what `+swing` is and states what the material cannot settle about it: whether the opponents the
effect reaches arrive as messages of their own. What this corpus adds is that the question cannot be
put to it at all — the published table gives the effect to **1** of the skills it serves, and not
one of the **51** skill ids the recordings announce is that skill. So the reading that would tell a
swing's second target from a plain attack is one a recording has to bring, and none here carries it.

⚠️ **What the tick of a wound was struck with.** A tick is charged to whoever left the wound (**ADR
0022**) and carries no announcement of its own, so it stands under its key rather than under the
skill that opened the wound. The skill is knowable in principle — the blow that wounded was
announced — and this reading does not carry it that far.

Pressing the row opens the cut of whoever stood at the other end of those blows (**ADR 0081**), so
_who hit me with plain blows_ is one press rather than a walk over the roster. It opens wherever it
holds a figure; a row drawn at nought — every blow stopped — has nothing under it to open onto.

Which blows the count holds, as against which the protocol announced, is
`tests/core/granted-blow-rule.test.ts`'s to re-earn: every blow standing under no announcement
opened a turn of its own.
