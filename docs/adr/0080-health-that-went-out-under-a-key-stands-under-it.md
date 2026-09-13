# 0080. Health that went out under a key stands under it, on the damage screens too

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

`docs/unannounced-damage.md` was written to record how a figure reaches the row a damage section
closes against, and the measurement it took turned up something nobody had looked for.

⚠️ **The figure is a remainder, not a sum of blows.** `composeSkillCut` computes
`plain = total − held`, so anything reaching the section's total without reaching a skill's row
lands there. The count beside it is composed by a wholly different walk — `blowsWithoutSkill`, event
by event, blows only. Two numbers in one row, from two passes, neither derived from the other.

Measured over `captures/` on 2026-09-13, before this decision:

| screen      | the row held | of that, blows | of that, no blow at all |
| ----------- | ------------ | -------------- | ----------------------- |
| `Zadane`    | 2,146,007    | 2,115,744      | 30,263 — 1.4%           |
| `Otrzymane` | 2,781,901    | 2,115,744      | **666,157 — 23.9%**     |

Two paths put it there, both in `src/core/fight-statistics.ts`. `addWoundTick` charges a tick to
whoever left the wound and to no skill (**ADR 0022**), which is the `Zadane` share. On `Otrzymane`
`addHealthChangeEvent` adds every loss outside a blow, and the skills section had no row a key could
stand in, so poison, fire, a wound and the `heal` key below zero closed there. Seven keys, and their
figures summed to the residue exactly — the decomposition left nothing over.

⚠️ **Six rows over `captures/` stated a figure and no blows at all**, drawn as `Zwykły cios … ×0`,
every point in them a wound ticking. Since **ADR 0079** they carried a place in the order as well.

**The healing screens had never had this problem, and `DESIGN.md` already said why:** _health that
moved outside an announcement still moved under a key the game named, so the section lists those
keys by name and there is nothing left over._ The same sentence is true of damage. It was being
applied to one half of the panel.

## Decision

**A damage section lists the keys health went out under, as a healing section already does.** What
moved without a blow carrying it stands under the name the game gave it; what is left in the closing
row is blows the game named no skill to, and nothing else.

`CombatantFigures` gains `damageTakenWithoutSkillBySource` and `damageDealtWithoutSkillBySource` —
the exact counterparts of `healthRestoredWithoutSkillBySource`, which the damage side had never had.
`composeSkillRowsStated` folds them in through `composeSourceRows`, the same function the healing
screens use.

**A key on a damage screen opens nothing**, as it does not on `healthRestored`: a key names whoever
the health moved on, so a row on the receiving side has no second end to be cut by. Only
`healthGiven` keeps a key per person, and only there does one open.

⚠️ **And the pair inside it names the key too**, which is a second half this decision needed and
nearly shipped without. A pair is a section of its own, composed by its own walk, so naming a figure
`zranienie` on the level above while the level inside it folded the same points into `Zwykły cios`
would have been one program saying two things — 21 pairs and 30,263 points, and **no guard would
have noticed**: the columns come to a hundred on both levels, so only the names disagreed.
`damageDealtWithoutSkillByOpponentAndSource` is the cut that closes it, and one cut serves both
screens because `getPairGivingEnd` hands over whoever struck on either.

## Consequences

**The row now holds 2,115,744 on each damage screen** — the same figure from both ends, because it
is the same blows read from the striking side and the side struck. It was 2,146,007 and 2,781,901.
**No row states a figure with no blow under it**, where six did.

A reader on `Otrzymane` now sees `zatrucie`, `podpalenie`, `zranienie` and the rest under their own
names in the skills section, where before a quarter of that section's figure stood under a word for
a swing. ⚠️ **No new vocabulary was needed**: `HEALTH_LOSS_WORDS` already carried exactly the seven
keys the corpus produces, including `heal` below zero, and `getWordsForNamedPart` already answered
`source` on a damage screen. The panel had the words for a row it was not drawing.

107 key rows appear across `captures/`, at most 5 in one section and none in most — 56 of 285
sections gain any. The closing row's place in the order moves down accordingly, first in 137 of the
sections that draw one rather than 145, and it reaches an eighth place it never held.

`docs/drill-levels.md` gains `source` on both damage screens, and its line saying the damage screens
have none is gone. Neither census moved — `tests/ui/share-column.test.ts` counts columns and
`tests/ui/level-drawn.test.ts` counts levels, and this adds rows to sections that already existed
without opening a new level under any of them.

**Nothing in the draw layer changed.** `composeSkillSection` never branched on the kind of part, and
`tools/drill-report.ts` already knew `source`. The change is three cuts in core and three folds in
the reading.

⚠️ **A key now stands in two sections of one screen** — among what a figure was dealt with, and a
section lower among what it was made of. `DESIGN.md` carries that as the price and says why it beats
the alternative: the same word and number twice is checkable, and a quarter of `Otrzymane` standing
under a word for a swing was not. The two are separate columns, each coming to a hundred of its own
figure, so the rule that a column checks out is untouched.

## Alternatives

**Leave it and keep the document.** What the previous round did deliberately: record the mixture,
its size and its two paths, and take no decision. Rejected once the fix turned out to be the rule
the other half of the panel was already keeping — the asymmetry was the bug, not a cost.

**Rename the row instead**, to something covering blows and ticks at once. Rejected: it would give
up what **ADR 0079** had just measured — that the row is the game's own default action — to
accommodate figures that have their own names already.

**Take the non-blow figures out of the section's total** rather than giving them rows. Rejected:
`DESIGN.md` requires a drawn section to account for the whole of the figure over it, and a column
adding to ninety-something is the one thing a reader cannot check.

**Charge a tick to the skill that opened the wound.** It is knowable in principle — the blow that
wounded was announced. Rejected as a larger claim than this decision needs: **ADR 0022** settled
that a tick belongs to the wound rather than to a swing, and carrying an announcement that far is
its own question. `docs/unannounced-damage.md` records it as what this reading does not answer.

**Use the element cut that already exists.** `damageTakenByElement` holds these keys — and also
holds what a blow was made of, so a row built from it would draw a swing's figure twice and under
the wrong word. `src/ui/panel-words.ts` keeps the two vocabularies apart for exactly that reason.
