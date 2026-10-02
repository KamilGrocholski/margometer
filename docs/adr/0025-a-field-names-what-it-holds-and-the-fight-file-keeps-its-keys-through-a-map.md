# 0025. A field names what it holds, and the fight file keeps its keys through a map

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

ADR 0023 and ADR 0024 renamed functions, types and the DOM. Fields and variables still carried the
old words. Read at `5ca02c2` on 2026-10-02 by three reviews, one per layer:

- `held` named at least seven different things in `src/ui/` alone, and the same again in `core/`,
  `game/` and `runtime/`;
- `reading` still named a `FightState`, a `…Content` and a key's meaning;
- `standing` named the element about to be replaced, the helper's position and a `TurnStanding`;
- `page` named the browser's `window`;
- `SkillFigures.restoredByOpponent` held the health a skill gave, keyed by whom it healed, mostly
  allies;
- the box a row opens was `Tip…` in about 450 names and `card` in the words a player reads.

Two constraints stood in the way. `ReportRow` and `ReportSkill` in `src/runtime/fight-file.ts` were
keyed off `CombatantFigures` and `SkillFigures`, so a field's name was its key in the fight file,
whose format is `develop`'s version 4. And `BattleEvent` is a carried-over contract.

## Decision

Decided with the maintainer on 2026-10-02.

**A field is named for what it holds, and the file keeps its keys.** `REPORT_KEY_BY_FIGHT_FIELD`,
`REPORT_KEY_BY_ROW_FIELD` and `REPORT_KEY_BY_SKILL_FIELD` map each renamed field to the key the file
has always written. The report types and the encoders read them, so the old key is spelled once
(**N13**). For example, `sideHealsUnsized` is written as `castsUnplaced`, `healthGivenByReceiver` on
a skill as `restoredByOpponent`, and `healthRestoredByKey` as `healthRestoredBySource`. The report
encoded from every one of the 36 recordings under `captures/` came out byte for byte the same before
and after, read on 2026-10-02.

Rejected: changing the file's keys. That would make a version 5 of the format, which every tool and
the intake would then have to read beside version 4.

Rejected: leaving the figures' names alone because the file is keyed off them. The misleading names
would then stay in every file that reads a figure.

**`BattleEvent` keeps its fields.** `source` is a key of the protocol and `declaredShare` is a
percentage, and both are named as `develop` named them. Renaming them is the carried-over contract,
and the maintainer kept it.

**Ours is a card, the game's is a tooltip.** Every `Tip…`, `TIP_…` and `tip` of ours is `Card…`,
`CARD_…` and `card`. That covers the DOM too: `MargoMeter-card`, `card-…`, `data-card`. The sheet's
test spells `develop`'s `MargoMeter-tip` and `.tip-` ours, as ADR 0024 does for the windows. The
game's own names stay as the game spells them: `createWarriorTip`, `getTipData`, `concatTip`, and
the preview's column of the game's tooltips.

**The meter's width is a token of the meter.** `panelWidthPixels` is `meterWidthPixels`, and
`DESIGN.md`'s `panelWidth` is `meterWidth`. `SURFACE.panel` stays, because it is the body of both
windows. This replaces ADR 0024's sentence keeping the width token.

## Consequences

A spread literal is not checked for excess properties. `{ ...createScreenState(false), current }`
kept compiling after `current` became `metric` and set nothing. Four such literals in three test
files did exactly that, and an array of levels spread the same way; they reddened only on what they
then measured. A field renamed by hand is therefore searched for as a key in every object literal,
not only where the compiler reports.

Open, and the maintainer's call: `DEFECT_KIND`'s words `kept`, `keeping` and `reading`, which reach
the console; `fromLeft`/`fromTop` in `panel-drag.ts`, which mean a position for a move and a size
for a resize; and `…ByKind`, whose keys are an element, a pool or a protocol key.
