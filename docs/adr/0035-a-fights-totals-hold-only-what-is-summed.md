# 0035. A fight's totals hold only what is summed

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

`FightStatistics.totals` was typed `CombatantFigures`, the whole of a combatant's row, while
`tallyTotals` summed eleven of its fields. Every other field stayed at the value
`createCombatantFigures` gives it: a count of blows, of turns taken and lost, the largest blow, and
every cut. The fight file wrote that row under `report.totals` with all of those fields, so a file
said `blowsStruck: 0` and `turnsTaken: 0` for a fight of hundreds of each. `CONTEXT.md` says turns
have no fight-wide total, and AGENTS.md **E6** says a nought is a measurement. `develop` @ `fa1dcce`
did the same (`composeTotals`).

Nothing reads a report back. Intake, replay and the tools rebuild figures from the payloads, and
over `captures/` and `tools/` on 2026-10-03 the only readers of `report.totals` were two tests.

## Decision

Decided with the maintainer on 2026-10-03.

**`totals` is a `FightTotals`: the eleven fields a sum across combatants means anything for, and
nothing else.** These are damage dealt and taken (raw, applied and absorbed), damage prevented,
health restored and given. The fight file writes those eleven under `report.totals`, in the order
`TOTALLED_FIELDS` states, under the names its rows give them. A count, a cut or a largest blow stays
on the combatant's row, the only place it was measured.

**The file stays version 4.** Nothing reads `report.totals` back, so no reader has to tell the two
shapes apart, and a version raised for a block nobody parses would make every reader of the envelope
branch for nothing.

Rejected: keeping the shape and writing `null` in the fields nobody sums. The file would go on
carrying forty fields that mean nothing, and `null` (E6) states the game did not say something,
which is not why they are empty.

Rejected: keeping the zeros, with a note that they are not measured. A reader of the file meets the
zero and not the note.

## Consequences

- A fight file written from this commit on holds eleven figures under `report.totals`, where it held
  every figure of a row. Files already in `captures/` keep theirs, which nothing reads.
- `tools/fight-figures.ts` draws the fight's own line as the six columns alone. The cuts and blows
  it printed under that line were the zeros above.
- The panel reads `totals` only for the four metrics a list draws, all of which are summed.
