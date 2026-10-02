# 0026. A name says Margonem, and the way it is reached

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

ADR 0023 gave the game one prefix, `Game…`, and the engine object a second, `GameEngine…`. Read off
`docs/names.md` at `0e390f7` on 2026-10-02, 71 names held the word `Game`. Most of them told a
reader the owner but not the way in:

- `initGamePlace`, `initGameHero`, `initGameTooltip` and `initGameBattle` read through
  `window.Engine`, and only the engine object's own failures said so (`GameEngineAbsent`).
- `initGameDictionary` calls the client's global `_t`, and `initGameBuild` reads the bundle's name
  off the page's scripts. Neither reaches the engine.
- `readGameWarriorEntries` reads the payload's `w`, which is protocol, not anything the client
  holds.
- In `tools/`, `GameChannel` and `GameSourceError` name requests to `margonem.pl`. In `tests/`,
  `FakeGame` and `composeGame` stand for a whole page, and `composeEngine` for the engine alone.

The maintainer read the register and could not tell, from a name, whether a value came from the
engine, the client or the page.

## Decision

Decided with the maintainer on 2026-10-02.

**A name says Margonem and the way it is reached.**

| Way in                                                  | Prefix            |
| ------------------------------------------------------- | ----------------- |
| `window.Engine`: its battle, hero, map, warriors        | `MargonemEngine…` |
| the client outside the engine: `_t`, the bundle's name  | `MargonemClient…` |
| the game reached more than one way, or over the network | `Margonem…`       |
| the browser                                             | `Browser…`        |
| the protocol's words (payload, message, key), and ours  | none              |

So the names read `initMargonemEnginePlace`, `MargonemEngineAbsent`, `initMargonemClientDictionary`,
`MargonemValueAbsent`, `readPayloadWarriorEntries`, `MargonemChannel`. The files move with them:
`game-battle.ts` becomes `margonem-engine-battle.ts`, `warrior-snapshot.ts` becomes
`margonem-engine-warriors.ts`, `game-dictionary.ts` becomes `margonem-client-dictionary.ts`, and
their suites follow. A simulation wears the prefix of what it simulates (`FakeMargonem`,
`composeMargonemEngine`).

This answers what ADR 0023 rejected `Engine…` and `Client…` for: a reader had to know both were the
game's. With `Margonem` in front, the name says the owner and the channel at once.

Rejected: `Game` plus the channel (`GameEngine…`, `GameClient…`). It is shorter, but `Game` is a
word every sentence about the add-on uses, and the maintainer reads `Margonem` as the name of a
thing, not a category.

**A key a file or a store keeps is not renamed with the field of ours.** The fight file and the
shelf store `gameBuild` (`develop` wrote it, and the file format and the storage keys are carried
over). The field of ours is `margonemClientBuild`, and the key is spelled once, in the map that
writes and reads it (ADR 0025). Writing the shelf went through the object's own field names. It now
goes through `FIGHT_FIELDS`, as reading it already did.

**`Game` is retired from identifiers, and a guard holds it.** `tests/repository/names.test.ts` flags
any identifier in `frozen/`, `libs/`, `src/`, `tests/` or `tools/` with a word `Game` or `GAME`. A
lower-case `game` that opens a key a file keeps (`gameBuild` in `frozen/` and in a recording) is the
file's spelling and is not a word of a name of ours.

## Consequences

**N21** in `AGENTS.md` states the table and its observation. `CONTEXT.md`'s **Game client** and
**Engine** entries name `MargonemClient…` and `MargonemEngine…`, and add `Game` to what a name
avoids. A tool's console brand moves with its class: `MargoMeterTool/MargonemClientSource`.

What stays, and the maintainer's call:

- the layer's directory, `src/game/`, which `docs/design.md` §4 names and which holds the browser's
  ports beside the game's;
- the tasks `game:*`, which hooks, skills and the headers of `frozen/` name, and which only a
  re-freeze can rewrite in `frozen/`.
