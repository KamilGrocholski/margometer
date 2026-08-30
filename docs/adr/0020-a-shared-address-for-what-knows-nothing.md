# 0020. A shared address for what knows nothing of this project

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

`ARCHITECTURE.md` said there is no `libs/` layer: a primitive lives beside its consumer, and the
construct register keeps "one way to read a value" from losing its address.

The register was the mechanism standing in for a shared address, and measuring it on 2026-08-30
found it had not held. Three rows were stale, and no guard reads it:

| Row              | Said                               | Was                                |
| ---------------- | ---------------------------------- | ---------------------------------- |
| `JSON.parse`     | owner `tests/recorded-fight.ts`    | that file had stopped spelling it  |
| `JSON.stringify` | **planned**, at its first consumer | seven sites, one of them its owner |
| `Date.parse`     | **planned**, at its first consumer | `tools/help-article.ts`            |

Where the register said "planned, named at its first consumer", the consumer had arrived and the row
had not moved. A row moves when somebody writes it, and nobody writes a row for a construct that has
nowhere to go.

The same shape showed in code. The walk `getEndOfRun` now holds stood written three times, in
`src/core/protocol-number.ts`, `tools/protocol-key-table.ts` and `tools/help-article.ts`, with three
assertion messages identical word for word: "a run never ends before it starts", "and never past
what it walked", "one character is looked at". **C7** forbids a regular expression, so every reader
of text walks it, and every reader wrote the walk again.

`src/core/unknown-reading.ts` was the case that named the problem. It imported `@std/assert` and
nothing else, named nothing of this game, and was read from `src/core/`, `src/game/`, `src/ui/`,
`tools/` and `tests/` — twenty-three files. It was a library in everything but its address, and its
address said it was part of the fight decoder's layer.

## Decision

`libs/` holds what knows nothing of this project. The rule is one sentence and a machine holds it:
**nothing under `libs/` imports a layer** — not `@/src`, not `@/tools`, not `@/tests`, not
`@/frozen`. It imports `@std/` and its own siblings.

An import test is necessary and not sufficient, and `src/core/protocol-number.ts` is why: it imports
nothing of this project and knows it anyway, because `HEALTH_PERCENT_PLACES` carries a measurement
over `captures/`. So the guard reads the text too — a file under `libs/` naming the recordings or
the game is a file in the wrong place.

That measurement is also where the file splits. The integer half is text arithmetic; the health and
share half is the protocol. Only the half that knows nothing moves.

## Consequences

- **`tests/source-paths.ts` and `tests/repository/sources.test.ts` gained the directory.** Without
  it S1, S2, S4, S5, C5, C8 and C16 would not have applied to `libs/` at all: the move would have
  weakened the guarantees it was made to keep. This is the cost that is easiest to miss.
- **C8 is untouched, and the first draft of this decision had it wrong.** A separate `@libs/` prefix
  looked tidy and would have broken the rule it was meant to serve — C8 maps `@/` to the repository
  root "and nothing else", so one prefix is the whole scheme. `libs/` is addressed as `@/libs/…`
  like everything else.
- **`src/core/game-build.ts` keeps its own walk, and that is not an oversight.** It is the only
  consumer of an alphanumeric run, so **C9** keeps the predicate beside it. Moving its twelve lines
  out would also have pushed the file from 25.8% comment to 29% and broken **C5** — and every line
  of that comment is a dated build-id citation, which **ADR 0016** rejected deleting by name, for
  this file. A rule met a threshold and the rule won.
- **What moved is smaller than what was proposed.** Only `getEndOfRun` and `isDigitAt` had a second
  consumer; `isWhitespaceAt`, `isSameAsciiTextAt` and the letter predicate had one each and stayed
  where they were. C9 is measured per export, not per idea.
- **The register still has no guard**, and whether "nowhere else" reaches `tests/` is open.
  `Number()` stands in its owner and in twelve test sites that read a written figure back.
  `ARCHITECTURE.md` carries this under the register itself.

## Alternatives

**Keep the rule and dedup in place.** Rejected on where the code would land. A primitive used only
by `tools/protocol-key-table.ts` and `tools/help-article.ts` would sit in `src/` and ship to a
browser for nobody, or sit in `tools/` where `src/` cannot reach it.

**A Deno workspace member, so the compiler refuses a layer import.** Stronger than a test, and this
tree prefers what a compiler holds. Rejected for now on cost: a second `deno.json` and a bundler
path to re-prove, against a guard that is twenty lines and reads like the twelve already in
`tests/repository/`. It is the shape to reach for if `libs/` grows.

**Publish it as a package.** The boundary would be physical rather than checked. Rejected: a second
release process beside **G7** for two modules nothing outside this repository reads.

**Split by whether it ships rather than by what it knows.** Rejected: the two cuts disagree.
`libs/unknown-reading.ts` ships and `libs/text-walk.ts` reaches a browser through `protocol-number`,
while the same walk serves two tools that never ship at all.
