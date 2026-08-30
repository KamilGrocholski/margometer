# 0003. Captured fights live at the repository root

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

The 28 recordings — 16 MB of raw battle protocol from real fights, with combatant snapshots the
protocol itself never states — lived in `tests/captured-fights/` for the whole of v1.

Two things were wrong with that address, and only the second is about tidiness.

**The material is read from both sides.** The gate reads it, and so do the tools: `fight-report`,
`decoding-status`, `drill-report`, `payload-cost`. v1's dependency rule said a test may read a tool
but a tool may not read a test — and then had to carve out an exception, because the tools needed
the recordings and the recordings were inside `tests/`.

**The name states the wrong thing.** `AGENTS.md` has insisted since v1 that this is **evidence, not
test data**: never edited to make anything pass, `[ASK]` to touch at all, and if a capture
contradicts the code then the code or the understanding is wrong. A directory named for the test
suite says the opposite of that with its own path.

## Decision

The recordings live at `captures/`, at the repository root, with their own `AGENTS.md`.

Nothing imports "upwards" to reach them, the dependency rule needs no exception, and the path says
what the files are.

## Consequences

- Roughly 130 path citations across the four carried documents were rewritten in the same commit.
  Every cited recording was checked to exist afterwards.
- `.gitignore`, the tooling and every future guard address `captures/` directly.
- 16 MB sits at the top level of the tree, which is honest: it is the single most valuable thing in
  the repository and the only part that cannot be regenerated.
- The recordings' own rules — Polish field names, redaction before intake, discovery by reading the
  directory — now have a local `AGENTS.md` at exactly the level they apply to.

## Alternatives

**`testdata/fights/`.** The Deno and Go convention, understood by anyone from those ecosystems and
skipped by some language tooling. Rejected for the same reason as `tests/`: the name says "test
data" and the whole rule set says it is not.

**Leave it at `tests/captured-fights/`.** Zero migration, and every existing citation keeps working.
Rejected because the rewrite was the one cheap moment to fix it, and the dependency-rule exception
would have outlived the reason for it.
