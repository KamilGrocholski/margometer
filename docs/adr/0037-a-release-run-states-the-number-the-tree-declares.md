# 0037. A run that says it is the release states the number the tree declares

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

**ADR 0035** decided that a build handed no version takes the declaration and marks it `-dev`. It
left one consequence written down and unheld: _"a release that reshoots them is a release that
changes `screenshots/`"_ — with nothing able to carry a release number into a shoot. Measured on
this tree: `v0.11.0` is tagged at `d872c0a`, and the five pictures that tag ships show a title bar
reading `MargoMeter 0.11.0-dev`. The version on the front page of this repository is not a version
anybody can install.

The published page is the same fault with a sentence claiming otherwise.
`.github/workflows/pages.yml` runs on a push to `main`, `main` is the latest release (**G6**), and
`tools/preview-site.ts` built at the marked version like everything else — while both READMEs tell a
reader the page is drawn by the file from the latest release. Read on Chrome 152, 2026-08-31, the
panel on it stated `0.11.0-dev`.

Neither is caught by anything. A PNG has no version to typecheck, and the published page is looked
at by people who have never read this repository.

## Decision

A run states the declaration, bare, exactly where it is **told** it stands on the tree that ships:
`--release`, read by `getVersionForRun` in `tools/declared-version.ts`, which owns every reading of
a version here. Everything else keeps **ADR 0035**'s mark, which is why that record is not
superseded — a build that was told nothing still says it is not a release.

Two things take the flag and no third does: `deno task screenshots`, whose pictures are what a
reader is shown, and `deno task preview:site`, which `pages.yml` runs with it. `deno task preview`
never does; a server on a working copy is not a release.

The set says which version it was taken at. `screenshots/taken-at.json` carries `version` beside
`commit`, for the reason the sidecar already carries `commit`: a picture cannot say which build drew
it. Two guards read it — `tests/tools/panel-screenshots.test.ts` holds it to the declaration on
every push, and `.github/workflows/release.yml` holds it to the tag, which is the only place the
`-dev` mark itself can be caught.

## Consequences

- Taking the set again is part of a release rather than a thing somebody remembers, and the gate
  says so: a version bumped with no reshoot turns `deno task check` red naming both numbers.
- A tag whose set is stale, or whose set was taken without the flag, fails before anything is
  public. The two guards catch different faults and neither catches the other's.
- The number is still typed nowhere. The flag says which tree a run stands on; `deno.json` says what
  that tree is.
- A set taken between releases states the declaration marked `-dev`, and the guard accepts either.
  The bare set is a release's own act.
- `docs/releasing.md` is the sequence this obliges somebody to follow, written down because it is
  run a few times a year by one person.

## Alternatives

**Type the number: `deno task screenshots --version 0.12.0`.** One flag fewer and no reading. This
is the shape **ADR 0035** moved away from — the one place the declaration and the built file can
disagree with nothing comparing them — and a photograph is where a wrong number is least visible.

**Shoot bare always, and drop the mark from the pictures.** Simplest of all. Rejected for exactly
the reason **ADR 0035** rejected the bare declaration for builds: a picture of a panel saying
`0.12.0` taken on a tree that is not `0.12.0` is evidence for a claim about a release nobody can
check, and a screenshot outlives the tree it was taken on.

**Infer it from the git state — a clean tree, or a tree standing on a tag.** No flag at all.
Rejected under **ADR 0035**, which already refused a version composed from the state of a working
copy; and the shoot refuses a dirty `src/` anyway, so "clean" would mean every set, which is the
alternative above wearing a different hat.

**Leave the pictures marked and change the READMEs to say so.** Cheapest, and honest. Rejected
because the mark answers a question the reader did not ask: somebody looking at the front page is
deciding whether to install this, and `-dev` beside the name reads as a warning about the add-on
rather than a fact about the photograph.
