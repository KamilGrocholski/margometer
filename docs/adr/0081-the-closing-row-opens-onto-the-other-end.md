# 0081. The closing row opens onto whoever stood at the other end

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

Every other row of an opened figure opens. A skill's does, because `SkillFigures` keeps a
`dealtByOpponent` beside each announcement; a kind's does, off the cut kept per opponent and kind.
The row closing a damage section did not, and the register recorded that as `never` without saying
why.

⚠️ **The figures were there all along, reachable only the long way round.** A pair — a person opened
from the opponent section — composes its own `plain = total − held`, so the same numbers could be
had by opening every opponent in turn and collecting the closing row from each. Over `captures/` on
2026-09-13, 404 pairs carry one. A reader asking _who hit me with plain blows_ had to walk the
roster and add up by hand.

⚠️ **And the reason it did not open was not the one it looks like.** The row carries no `skillId`,
which is true and irrelevant: a cut by opponent is keyed by **combatant**, not by a skill's id, and
`dealtByOpponent` holds combatant ids. What the row lacked was any record of its own — no
announcement, so no `SkillFigures`, so no cut hanging off one. A missing key, not a missing id.

## Decision

**The row opens onto whoever stood at the other end of the blows it holds.**

`CombatantFigures` gains `damageDealtWithoutSkillByOpponent` and
`damageTakenWithoutSkillByOpponent`, fed from the branch of `addAttackEvent` that already tells an
announced blow from one standing under none. Both ends are kept, so a received figure needs no walk
over everybody's skills the way a received **skill** row does.

**`OpenedPart` is a type of its own, and `NamedPart` keeps its meaning.** What a reader may open is
the named parts and the closing row; what `NamedPart` is for is a part the **game** named, and the
closing row is the one standing for what it named nothing about. The union was already spelled by
hand in three signatures — `getTextForNamedPart`, `getWordsForNamedPart`, `getKeyForNamedPart` — so
this names what those three had been saying.

The mark states a constant rather than a name, because the row has none, and `composeNameForPart`
spells `plain:` for the place a reader was left at (**ADR 0050**).

## Consequences

**One press where a roster walk stood.** The row opens in 258 sections over `captures/` and stays
shut in 1 — a combatant whose every unannounced blow was stopped, so there is a row at nought with
nothing under it. `damageTakenApplied` opens `always`, `damageDealtApplied` `sometimes`, and the
register carries both.

202 person rows appear under the new level, and `tests/ui/level-drawn.test.ts`'s census of levels
grows with them.

⚠️ **`tools/drill-report.ts` had the verdict wired shut.** It passed `false` for this row rather
than reading the flag, so the register would have gone on saying `never` however the panel behaved.
Two lines, and worth naming: a register re-earned from a tool that answers a constant is re-earning
the constant.

The guard that matters is not that the row opens but that the level **agrees with the row over it**:
the figure is a remainder and the cut under it is a second walk, so a disagreement would be the
panel answering one press two ways. `tests/tools/unannounced-damage.test.ts` holds the total and
every opponent of it against the row, over every recording.

One claim moved in `tests/ui/panel-element.test.ts`: the closing row was the single leaf of an
opened level, and now nothing on that level of that fight stays shut. That is the decision, written
where a reader of the test will meet it.

## Alternatives

**Leave it shut and say so.** What the register did. Rejected once the figures turned out to be
reachable already: a panel that holds a number and will not show it where a reader asks is worse
than one that does not hold it.

**Add `plain` to `NamedPart`.** One type instead of two, and it would have made `composeNameForPart`
and the mark fall out without a constant. Rejected: the name would then be false for a quarter of
its own members, and `NamedPart`'s whole job is to stand for what the game named.

**Compose the cut at read time by walking the pairs.** No new field, and the expression exists — it
is what a reader does by hand today. Rejected: the same figure would then be composed two ways, by
`composePairParts` and here, and the two would drift the way the pair level and the opened level
drifted in **ADR 0080** with nothing watching.

**Key the cut by skill id.** There is none, which is where the question started. Kept here because
it is the answer a reader expects and the wrong one: a cut by opponent never wanted an id.
