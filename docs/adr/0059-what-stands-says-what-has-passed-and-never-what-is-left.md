# 0059. What stands says what has passed, and never what is left

- **Status:** Accepted
- **Date:** 2026-09-08

## Context

**ADR 0058** bought a duration. This is what the window does with it.

Everything about a cast that reaches a side is stated except its end:

- **Which skill.** The announcement carries `skillId` and `tspell`.
- **Who cast it.** The actor slot, which **ADR 0010** already fixes as the caster.
- **How long it runs.** The published table, frozen.
- **How much has passed.** Counted, in the caster's own turns, from the turn the cast stood on.

What is stated nowhere is that it ended. So the two halves come from two places, and the join
between them is witnessed by nothing.

## Decision

**A cast is read from the announcement that cast it**, joined to the published table **by `skillId`
and never by the effect key.** The wire and the table spell the same effect differently —
`+spell-taken_dmg-all` against `taken_dmg_per-all`, `aura-adddmg2_per-meele` against
`aura-adddmg2_per-meele_physical` — so a key-name join silently loses the very skill this was asked
for. `src/core/aura-standing.ts` owns which keys reach more than one combatant.

**The remainder is stated as elapsed of stated — `3 z 8 tur` — and never as a countdown.** Both
halves are honest on their own: one is counted here, one is published by the game. The subtraction
is the reader's, because the join is witnessed by nothing.

**A row leaves when the turns it was given have passed.** Without that the section is a list of what
was cast — a median of eight rows by the end of a fight (**ADR 0058**) — and its heading would be a
claim the panel cannot stand behind.

**The length is counted in the bearer's own turns, taken and lost both**, because a turn granted and
spent on nothing still passed for whoever is carrying it. A second cast by the same caster of the
same skill **refreshes** rather than adding a row.

**A skill stating several team-wide effects is dated by the longest of them**, so a skill is not
called over while part of it is still running. `Wyzywający okrzyk` runs one for three turns and two
for five; the row says five.

**A cast the table dates nothing for reaches no row.** Two kinds: `poison_lowdmg_per-enemies`, the
one team-wide key documented `alone in its message`, which decodes to a bare declaration carrying no
skill name and no id; and a cast arriving under `tcustom` with no `skillId` at all.

**Nothing states who applied a status, and the window says nothing about one.** That is a different
subject, drawn nowhere here.

## Consequences

Easy: the thing the maintainer asked for with no guess in it. Who cast it is the game's own word,
how long it runs is the game's own published figure, and how much has passed is counted.

Hard: **nothing in the material can check the stated half.** The protocol never mentions a cast
again, so the figure a row leaves on rests on the published table alone. Drawing it as elapsed of
stated rather than as a remainder is what keeps that honest — the panel never says `zostało 5`.

Also: the count is a second walk over the fight's events. `core/fight-statistics.ts` keeps nothing
positional, so "the caster's Nth turn" cannot be read off the aggregate — `getTurnOpener` and
`composeTurnStanding` are exported for exactly this, and the walk replays them.

## Alternatives

**A countdown.** `5 tur` rather than `3 z 8`. Rejected: it reads as measured and is not, and nothing
witnesses the end.

**Counting the length in payloads.** Exact, and meaningless to a person: a payload is not a unit
anybody plays in.

**Counting it across the whole fight's turns.** It counts everybody's turns rather than the
bearer's, so the same cast reads longer in a ten-a-side than in a duel.

**Joining the table by effect key.** The spelling differs between the wire and the page, and the
skill this feature was asked for — `Piętno bestii` — is one of the two the difference loses.
