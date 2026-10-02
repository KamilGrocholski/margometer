# 0023. A name says whether a thing is the game's, the browser's, or ours

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

`src/game/` holds the ports over what this program does not control (`docs/design.md` §5). Read at
`a38b76b` on 2026-10-02, 13 functions built one, every one named `initPage…`. "Page" meant the real
implementation as against the simulated one, not what the port reaches. That covered three owners:

- the game's engine (`initPagePlace`, `initPageHero`, `initPageEngine`, `initPageTooltip`);
- the game's client code outside it (`initPageDictionary` calls `_t`, `initPageBuild` reads the
  bundle's script name);
- the browser (`initPageStore`, `initPageClock`, `initPageFrames`, `initPageInterval`,
  `initPageConsole`, `initPageFile`, `initPageSurroundings`).

The maintainer read `initPagePlace` and could not tell whether it touched the engine, the page or
something else. One word stood for each of three owners, and nothing marked a name as ours.

The same reading at `9a882b7` found 25 types named `…Reading` with five meanings:

- what a key of the protocol means;
- the decoder's working state for one message;
- a fight with its figures tallied;
- what the panel is about to draw;
- what the client answered when asked.

## Decision

Decided with the maintainer on 2026-10-02.

**A name says whose the thing is.** A port over the game, its `init` and the failures it answers are
`Game…`: `initGamePlace`, `GamePlacePort`, `GameValueAbsent`. The game's `window.Engine` itself is
`GameEngine…` (`GameEngineAbsent`, `initGameEngineSearch`), so the object stays visible. A port over
the browser is `Browser…`: `initBrowserClock`, `BrowserClock`, `BrowserFileSink`. What is ours
carries neither. The protocol's words that `CONTEXT.md` gives (payload, message, key) are ours for
the game's material and take no prefix, and neither does a store with an implementation of ours
beside the browser's (`KeyValueStore`).

Rejected: `Engine…` and `Client…` as two prefixes. That is what this tree tried first, the same day.
It told the engine from the client, but a reader still had to know that both are the game's. One
prefix answers the question asked.

Rejected: `Game…` alone for the engine (`GameAbsent`, `readGame`). It is shorter, and it loses that
the name means `window.Engine` rather than the game at large.

**"Reading" names one thing again.** The five meanings each take their own word:

- a key's meaning is `KeyMeaning`;
- the decoder's work on one message is `ParametersDecoded`;
- the fight with its figures is `FightState` (`KeptFightState` off the shelf);
- what the panel draws is `…Content` (`ScreenContent`, `OpenedLevelContent`);
- a value asked of the game is `GameValue`.

`IntentReading`, a value read off a mark in the page, is a reading in the verb's own sense (**N16**)
and keeps the word.

Rejected: `TalliedFight` and `ClientAnswer`. The maintainer read both as foreign words for plain
things.

**The helper's classes keep `develop`'s word.** The window is named `Helper` in every name of ours.
Its classes, its CSS variables, its grip mark and its tip keys still say `standing`, because the
sheet is held to `develop`'s byte for byte (**W8**, `tests/ui/panel-look.test.ts`). Renaming them
would move every rule of the window away from `develop`'s for no difference a reader sees.

**The panel's main window is the meter.** "Panel" named both the whole the add-on draws and the
window with the ranking (`PANEL_WINDOW.panel`), which a reader of `PANEL_WINDOW.helper` beside it
could not tell apart. The window is `meter` in every name of ours and `Licznik` on screen, and the
panel stays the two windows together. Its grip mark and its CSS variables keep `develop`'s `panel`,
for the reason the helper's keep `standing`. The storage keys are a contract and do not move.

## Consequences

**N21** in `AGENTS.md` states the prefixes. `CONTEXT.md` names **Browser**, and its **Engine** and
**Game client** entries no longer forbid "Game", which now names their owner in code.

Files move with their names: `engine-*.ts` become `game-*.ts`, the browser's `page-*.ts` become
`browser-*.ts`, `page-reading.ts` becomes `game-value.ts`, `panel-reading.ts` becomes
`panel-content.ts`, `fight-reading.ts` becomes `fight-state.ts` and `panel-standing.ts` becomes
`panel-helper.ts`. A record citing a moved file cites it under its new path.

Open, and the maintainer's call: whether the helper's DOM words follow it to `helper`, which takes a
departure for each of its rules in `tests/ui/panel-look.test.ts` and a record naming them.
