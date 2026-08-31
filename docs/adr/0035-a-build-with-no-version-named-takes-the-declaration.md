# 0035. A build with no version named takes the declaration and marks it

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

**ADR 0012** put the version into the bundle by writing over a literal, and **ADR 0018** declared it
once, in `deno.json`. Neither said where a build gets the number when nobody hands it one, and the
answer they left was the literal itself: `deno task build` fell back to `BUILD_VERSION`, so every
build outside `.github/workflows/release.yml` produced a file calling itself `0.0.0-dev`.

Two things follow from that, and both were measured on this tree. A release built by hand needs the
number typed at the call site — `deno run -A tools/build-userscript.ts 0.11.0` — which is the one
place the declaration and the built file can disagree with nobody comparing them. And the panel in
every preview, and in every photograph `screenshots/` carries, states `0.0.0-dev`, which names
neither the work it was built from nor a release.

## Decision

A build handed no version reads `deno.json` and builds at the declaration with `-dev` after it:
`0.11.0-dev` for the tree this record was written on. A build handed one builds at exactly that,
which is what a tag does.

`tools/declared-version.ts` owns both readings. It is a module of its own because
`tools/build-userscript.ts` needs the declaration and `tools/changelog.ts` already imports the built
file's names: the reader living in the changelog would be a cycle, and one that throws rather than
resolving, since those names are read while the module is still evaluating.

`src/build-version.ts` is unchanged and still states `0.0.0-dev`. It is the marker a build writes
over, never a number anything is built at — **ADR 0012** stands whole.

## Consequences

- The number is typed nowhere. `deno task build`, the preview, the preview site and the photographs
  all state the declaration, and the release workflow states the tag.
- **A development build is still not a release, and now says which one it is not.** `0.11.0-dev`
  sorts below `0.11.0` under semantic versioning, so a copy installed from a hand-built file is
  offered the release rather than left believing it already has it.
- This replaces one sentence of **ADR 0018**'s consequences — that `deno task build` falls back to
  `BUILD_VERSION` and a tree nobody tagged keeps saying `0.0.0-dev`. Everything else both records
  decided stands, which is why neither is superseded.
- A tree whose `deno.json` declares no version can no longer be built at all, where before it built
  at `0.0.0-dev`. `DeclaredVersionError` says so, and the failure is the one **E7** asks a tool for:
  loud, in a terminal, before a file exists.
- The photographs now carry a version that changes at every release, so a release that reshoots them
  is a release that changes `screenshots/`. `DESIGN.md` already asks for the set to be taken again
  on the tree that ships.

## Alternatives

**Build at the bare declaration, as v1 did.** `0.10.1` substituted `package.json`'s version into the
bundle and marked nothing, and a build off `develop` claimed the released number. Rejected: the
panel would then say `0.11.0` on a tree that is not `0.11.0`, and a screenshot of it is evidence for
a claim about a release nobody can check.

**Keep `0.0.0-dev` and add a task that passes the declaration.** No code moves, and the workflow
already reads the declaration. Rejected: the number stays typed at a call site, and the gate's own
build keeps producing a file that names no work — which is what made a preview's panel unreadable as
evidence in the first place.

**Compose the marker from the git state — a commit, or whether the tree is clean.** More honest
still, and rejected as a second source of truth for what a build is: the declaration is a fact of
the tree, a working copy's cleanliness is a fact of the moment, and a version that changes on an
unsaved edit is a version no photograph can be filed under.
