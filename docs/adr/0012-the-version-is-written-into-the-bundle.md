# 0012. The version is written into the bundle, not into the tree

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

`DESIGN.md` states that the title bar carries the version, and the `verify` skill reads
`data-margometer-version` off the host to say which build a screenshot is of. Both need `src/` to
know a number that does not exist until a release states one: `deno task build` takes it as an
argument, and until this decision it reached the userscript banner and stopped there.

`AGENTS.md` **S8** permits exactly one thing to be generated at build time — "the version constant"
— and says nothing about how. This records the how, because a build that rewrites its own output is
surprising to find and the failure it can have is silent.

## Decision

`src/build-version.ts` states `BUILD_VERSION` as a plain string literal. The build replaces that
literal in the **bundled text**, after bundling and before the banner is prepended, and throws
`UserscriptBuildError` when the literal is not in the bundle at all.

The literal is never rewritten in the tree. A build leaves `src/` exactly as it found it, so a
working tree is never dirty for having built, and a development build honestly says `0.0.0-dev`.

The constant is spelled once and never composed. A bundler keeps a string literal whole and mangles
nothing inside it, which is the whole of what makes the substitution reach every place the constant
was inlined; a version assembled from parts would be invisible to it.

## Consequences

- The panel and the host attribute say the same number the banner does, and `tools/` spells the
  development version in no file of its own.
- **A silent failure becomes a loud one.** A refactor that composed the version, or a bundler that
  stopped emitting the literal, would otherwise ship every release with the panel claiming
  `0.0.0-dev` and nothing failing. The throw is what makes that a build error, and
  `tests/tools/build-userscript.test.ts` pins it from both sides: the substitution over a text that
  has the constant, and the refusal of one that does not.
- `src/build-version.ts` carries no docblock. It cannot: **C5** caps a file at a quarter comment,
  and a file holding one constant has no room for a sentence. The file's name and its one export are
  what say what it is for, and this record is where the reasoning lives.

## Alternatives

**Generate `src/build-version.ts` at build time.** The obvious reading of S8, and rejected because
every build would then dirty the working tree with a file nobody edited — which makes `git status`
useless after a build and puts a released number into a diff that has no business carrying one.

**Read the version out of the userscript banner at run time.** The number is already in the shipped
file, a few lines above the code. Rejected: a userscript reaches its own metadata through `GM_info`,
which needs a grant, and the banner states `@grant none` — asking the page for nothing is a
`SECURITY.md` promise worth more than a string.

**Spell the literal in `tools/` and again in `src/`, with the build's throw holding them level.**
The disagreement would in fact be caught, since a mismatch means the marker is not in the bundle.
Rejected under **N13**: the failure reads as "the bundle states no version to write over", which
names neither file, and a reader chasing it learns the rule the hard way.
