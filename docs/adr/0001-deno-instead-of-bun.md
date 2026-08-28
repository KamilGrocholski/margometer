# 0001. Deno instead of Bun

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

MargoMeter v1 through v0.10.1 ran on Bun: `bun test`, `bun run typecheck` over two `tsconfig` files,
and a hand-written `build.ts` bundling `src/` into one userscript. The gate was three commands
stitched into one npm script.

That arrangement worked, but three of its properties turned into standing costs:

- **The linter question stayed open.** `AGENTS.md` v1 said "no linter, by choice — the compiler
  replaces it", and compensated with a 1,796-line guard test enforcing style by reading source text.
  **S10** asks for zero warnings from a static analyser on the first day.
- **Formatting was unenforced**, so line length and indentation were argued rather than checked.
- **The toolchain was several tools.** A standing argument for one toolbox over several says for one
  standardised toolbox over an array of specialised instruments.

Deno 2.9.6 supplies `fmt`, `lint`, `check`, `test` and `bundle` as one binary with one config file.
`deno bundle` was removed in Deno 2.0 and returned by 2.4; it supports `--platform=browser`, which
is what this project needs.

## Decision

The v2 rewrite runs on Deno. `deno.json` carries the tasks, the formatter settings, the lint rules,
the strictness flags and the `@/` alias. The gate is
`deno fmt --check && deno lint && deno check && deno test && deno task build`, one task, so there is
no version of "I ran the tests but not the build".

The standard library is used freely, including in `src/` — which ends v1's "zero runtime
dependencies" rule. See Consequences.

## Consequences

**Easier.** S10 is satisfied by a real analyser rather than by a guard test reading source text.
Formatting stops being a matter of taste. Contributors install one binary.

**Harder, and these are obligations rather than regrets:**

- The shipped bundle now carries code this project did not write. `NOTICE.md` must name it and its
  licence.
- **The browser floor moves from the sources to the bundle.** v1 held it with a narrowed `tsconfig`
  over `src/` and `libs/`; that no longer covers everything shipped, because the ES level of
  standard-library code is not ours to set. The floor is now checked over `dist/margometer.user.js`.
- `@std/assert` throws an `AssertionError` outside our branded hierarchy. This is consistent with
  the existing position that an assertion is a different category from an error, and the boundary in
  ADR 0002 catches it regardless.
- The repository requires Deno with a working `deno bundle`. `deno.json` states the version.

## Alternatives

**Stay on Bun and add a linter.** Would have satisfied S10 with the smallest change. Rejected
because it adds a tool rather than removing several, and leaves formatting and bundling where they
were.

**Deno, but keep the standard library out of `src/`.** Considered seriously: it would have preserved
"zero runtime dependencies" as a feature and kept the floor checkable over the sources. Rejected by
the maintainer in favour of using the library the toolchain ships with. The floor guard over the
bundle is the price, and it is written down as such.

**`jsr:@deno/emit` instead of `deno bundle`.** Would have worked on any Deno 2.x, but reintroduces a
dependency and a bespoke build script to replace a subcommand.
