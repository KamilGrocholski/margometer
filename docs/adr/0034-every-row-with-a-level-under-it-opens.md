# 0034. Every row with a level under it opens

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

Until this decision the panel asked a second question of every row inside an opened one: not whether
there was a level under it, but whether that level **would say something the row does not**. A pair
whose every blow was unannounced and of one kind stayed shut; a lone key row was dropped from its
section altogether, because `DESIGN.md` held that the keys stood again a section lower.

The two rules met on the commonest healing row there is. Amaimon in
`captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json` puts 16,273 points back into
himself under one key: the `KOMU` cut drew him as a single row that opened nothing, and the
`CZYM (UMIEJĘTNOŚCI)` section that would have named the key was dropped as a repetition. A reader
asking what he healed himself with was told nothing, twice, and the only signal that pressing was
pointless was the cursor — read after the gesture rather than before it.

The rules were also two spellings of one question. `getOpensPair` composed the level and counted it;
`getIsSkillRepetition` counted rows against the figure over them; `composeReachedCut` narrowed a
skill's cut to everybody but its caster to decide whether it opened. Each could disagree with the
composer beside it, and the disagreement is silent — an arrow leading nowhere, or none where there
was something to see.

Measured over `captures/` on 2026-08-31, of the rows a reader meets inside an opened row: 4,917 have
a level under them and 1,049 do not.

## Decision

**A row opens wherever the statistics hold a cut under it, and every cut that holds a row is
drawn.** Nothing is spared for repeating the figure over it: a section of one row states what that
figure was made of, which the heading never does.

The third level keeps one shape and gains two more ways in. A skill, a key or a kind of an opened
figure opens onto **whom it reached, person by person**, wherever a second cut exists:

- a skill on the giving screens, off `SkillFigures.dealtByOpponent` and `restoredByOpponent`;
- a skill on the receiving screens, by walking everybody's record for that name — which is the
  column the section itself does not have, because it folds every caster under one name;
- a key on `healthGiven`, off `healthGivenWithoutSkillByReceiverAndSource`;
- a kind on either damage screen, off `damage…ByOpponentAndKind`.

A skill cast on nobody but its caster opens and names the caster: health somebody put into
themselves is health they gave, and it stands inside the figure on the row that was pressed.

What stays shut is what the statistics keep no second cut of, and `docs/drill-levels.md` measures
which rows those are.

## Consequences

- The third level now holds 4,361 person rows over `captures/`, where it held only the levels one
  screen's skills opened onto.
- One question, asked once. `getOpensPair`, `getOpensSkill`, `composeReachedCut`, `getIsRepetition`
  and `getIsSkillRepetition` are gone; a row's mark is `composePartCut(...) !== null`, and the same
  call composes the level. A predicate can no longer disagree with the composer.
- A row's mark is its whole answer: the cursor, the note on its card and what a press resolves to
  are read off the one attribute it wears. A part row that opens now wears the drillable cursor,
  where it used to wear the leaf's while opening something.
- The mark goes on every cell of a row rather than on the row alone, because the listener reads the
  node under the hand and walks no ancestors. A press on a skill's name or figure used to be
  swallowed.
- `docs/drill-levels.md` keeps one `sometimes` where it had four, and `ScreenState` carries
  `openPart` in place of `openSkillName` — three kinds of part, one field, cleared on a screen flip
  like the pair.
- More rows can be pressed to no new information: a pair of one key opens onto that key. That is the
  cost, and it is a row's worth of screen against an answer a reader could not otherwise get.

## Alternatives

**Keep the rule for keys alone.** The narrowest fix for Amaimon's row: let a lone key open, leave
everything else. Rejected because the rule would then read "a row opens where the level says
something new, except keys, except skills that reached only their caster" — a list of exceptions
nobody can hold, and each one a place where the mark and the composer can drift apart.

**Draw the section but leave the row shut.** Cheaper: the key would be named on the opened row and
pressing it would do nothing. Rejected because it puts the affordance and the answer in different
places — the reader still meets a row that looks pressable, and the panel still teaches them to stop
pressing.

**A fourth level, so that a person inside a part level opens onto their pair.** Rejected as beyond
what the protocol states: the level under a part is already the last cut the statistics hold.
