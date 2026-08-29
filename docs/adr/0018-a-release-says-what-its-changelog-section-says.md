# 0018. A release says what its changelog section says, and the version is declared once

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

A release published from this repository is two things a stranger sees: a file they install, and a
body of text telling them what changed. The text has to be written for somebody who plays the game
and has never read this repository — `PRODUCT.md` says the reader's language is Polish, and
`CHANGELOG.md` is the one document here written for them.

A tag is also the moment two numbers have to agree and nothing else compares them. `deno.json`
declares no version until this decision, `src/build-version.ts` states `0.0.0-dev` — the constant a
build writes over, never the number of a release (**ADR 0012**) — and the tag is pushed by hand. v1
held the same three apart with `package.json`, and this tree has no npm manifest (**ADR 0001**).

## Decision

The body of a release is that version's section of `CHANGELOG.md`, lifted by `tools/changelog.ts`. A
version the file says nothing about is refused, loudly, before anything is published.

The version is declared once, in `deno.json`'s `version` field. Three things are then held level:
the tag against the declaration, in `.github/workflows/release.yml`; the declaration against a
section, in `tests/tools/changelog.test.ts`; and the declaration against the built file, by the
workflow rebuilding `dist/` at the tag's version and reading the banner back.

The declaration is read by walking the text of `deno.json`, which carries comments and is therefore
not JSON that `JSON.parse` accepts.

## Consequences

- A release cannot go out saying nothing about itself, and the refusal happens at the step that
  composes the notes rather than after they are public.
- Writing a section is work somebody does by hand at each release. `[Niewydane]` is where it
  accumulates between them, and the move of that section under a number is the release's first act.
- The declared version is not what a development build says. `deno task build` still takes the
  number as an argument and falls back to `BUILD_VERSION`, so a tree nobody tagged keeps saying
  `0.0.0-dev` (**ADR 0012**), and the workflow builds again at the tag's version before publishing.
- The tool's own words are English and the file it reads is Polish. It never looks inside an entry:
  the boundary is the heading, which is what keeps **L2**'s exception to one file.

## Alternatives

**Generate the notes from the commit subjects.** Free, and what most repositories do. Rejected
because **G2** asks a header to name an effect in this repository's vocabulary — "blocked hits reach
the panel" — and that is a sentence about the tree, not about the game. A player reading a list of
them learns nothing they can act on, which is exactly what the changelog's own rules are written
against.

**Derive the version from the tag alone, with nothing in the tree to disagree with it.** One number,
and no drift by construction. Rejected: with nothing declared, neither guard above has anything to
compare, and both catch their mistake while it is still cheap — a tag is pushed once and is
expensive to take back.

**Carry v1's `package.json` for the version alone.** Rejected under **ADR 0001**: nothing else here
reads one, and a manifest kept for a single field invites the rest of it back.

**Read `deno.json` with a parser for JSON with comments.** Correct, and the standard library has
one. Rejected as a dependency with no second consumer (**C9**): the declaration is one line, and the
walk that finds it is proved on a sample it must read and a sample it must not.
