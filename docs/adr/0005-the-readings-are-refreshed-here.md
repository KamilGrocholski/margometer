# 0005. The readings of the game are refreshed here

- **Status:** Accepted
- **Date:** 2026-09-25
- **Supersedes:** ADR 0004

## Context

ADR 0004 pinned `frozen/` to `develop` @ `RECORDINGS_REVISION` and left refreshing to `develop`'s
routine, because this branch was held to `develop` and `develop` carried the freezers. On 2026-09-25
the maintainer decided that this rewrite replaces `develop`. After that there is no other branch to
refresh a reading on, and W10 would point at a routine nobody can run.

`develop` @ `fa1dcce` carried six readings in `frozen/`. Three of them are in the bundle (the aura
turns, the blows granted, the status bits). The other three were read by tests out of git: the key
table, the help counts and the skill durations.

## Decision

**The freezers run on this branch, and write `frozen/` here.**

- `tools/game-client-source.ts`, `protocol-key-table.ts`, `buff-bit-table.ts`, `skill-table.ts`,
  `help-article.ts` and `game-readings.ts` are ported from `develop` @ `fa1dcce`. The tasks keep
  their names: `game:client`, `game:keys`, `game:buffs`, `game:skills`, `game:help` and
  `game:readings`.
- All six readings stand in `frozen/`, with `frozen/AGENTS.md`. Tests import them rather than
  reading `develop`'s out of git.
- Every rule a freeze applies is asked of `src/`, so a table and the add-on cannot read the game two
  ways (the maintainer's rule of 2026-09-25):
  - which effects reach a side is `lookupStatedTurns` in `src/core/aura-standing.ts`;
  - a bundle's name is `parseGameBundleName` beside `parseGameBuild`.
- A help freeze counts the phrases the table already holds, and any named. `develop`'s took them
  from `docs/protocol-keys.md`'s claims, a 2904-line register whose guard names `develop`'s
  constants, which this rewrite renamed. That register stays readable at `fa1dcce` and was not
  carried over.

**Proved against `develop`.** Run over the same `.cache/`, each port writes its reading byte for
byte as `develop`'s did:

- the key table: 234 keys, build `Bb28FQty`;
- the status bits: 9;
- the skill durations, 226 skills;
- the aura turns: 12;
- the blows granted: 3;
- the help counts: 119 phrases.

`deno task game:readings status` read all seven rows current on 2026-09-25.

## Consequences

- `tests/repository/frozen-readings.test.ts`, which held ADR 0004's pin, is removed with it.
- Two guards hold the readings instead:
  - `tests/repository/skill-durations.test.ts` checks that the three skill readings date together
    and derive by core's rule, and that every skill the corpus announces is one the table carries;
  - each generator's banner test holds a frozen file to the tool that writes it.
- `fight:develop` still compares figures with `develop` @ `fa1dcce`. A refresh that moves a table
  the decoder reads (`blows-granted`) can show a difference there, which is the game moving and not
  code. The comparison names what it was run against, so this is read off the report.
- W10 names this branch's routine.

## Rejected

**Keeping the pin, with `develop` alive beside this.** Two branches would then carry the same
add-on, and the maintainer chose one.

**Porting `docs/protocol-keys.md` and its guard in the same change.** The guard holds the register
to constant names this rewrite changed, so carrying it meant rewriting most of 2904 lines. What a
freeze needs from it, the list of phrases, is already in the frozen table.
