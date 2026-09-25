# 0002. A sibling is imported by `./`, and everything else from the root by `#/`

- **Status:** Accepted
- **Date:** 2026-09-25

## Context

`AGENTS.md` C8, carried over from `develop`, wrote every import from the repository root under the
`@/` alias, a sibling included: `src/game/engine-tooltip.ts` imported the file beside it as
`@/src/game/engine-battle.ts`. An import line then says nothing about distance. A file that leans on
its own directory and one that reaches across two layers read alike, and the directory's name is
spelled again on every line of a module that only talks to its neighbours.

`@/` is also the prefix npm gives a scoped package (`@std/assert` stands beside it in `deno.json`),
so the two kinds of import were told apart by the character after the at sign.

## Decision

Decided with the maintainer on 2026-09-25.

**An import from the importing file's own directory is `./name.ts`. Every other import of ours is
`#/path.ts`, from the repository root.** `deno.json` maps `#/` to `./`. `../` is never written, and
neither is `./` into a subdirectory or `#/` for a file in the same directory, so each import has one
spelling and the spelling says whether it leaves the directory. The extension is always written.

`tests/repository/import-paths.test.ts` holds it. The guards that follow an import to a file
(`layers.test.ts`, and the bundle walk in `tests/source-tree.ts`) read both spellings through one
function, `lookupImportedPath`.

## Consequences

- Before the change, 814 imports in 165 files of `libs/`, `src/` and `tests/` were `@/`. They were
  rewritten by one script, and the formatter rejoined the lines that got shorter.
- Deno 2.9.7 resolves `#/` from the import map like any other key, and `deno check` and `deno lint`
  read it, checked on 2026-09-25.

## Rejected

**`@/` for everything, as `develop` has it.** One spelling everywhere is simpler to hold with a
guard. It lost because an import then hides whether it leaves the directory, which is the thing a
reader of a layered tree most wants to see at the top of a file.

**Relative paths at any depth (`../../libs/result.ts`).** It shows the distance, but a moved file
breaks every `../` in it, and counting dots is how a reader gets the layer wrong.
