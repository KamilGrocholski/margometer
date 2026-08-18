# Main is what you can install

Status: implemented

## What is wrong

`main` carries two jobs that pull against each other.

It is the tip of development: 69 commits sit between `v0.6.0` and `main` at
`d81a27e`, six days of work that no release ships. It is also the branch the
outside world is pointed at — `.github/workflows/pages.yml` publishes the
preview site on every push to it, and README.md opens with **"See it before you
install it"** over that link.

So the page a stranger judges the add-on by is drawn by code they cannot
install, and the file they install afterwards draws something else. README.md
already says this out loud in its developer section — the link "always shows the
panel `main` builds rather than the last release" — which is an accurate
sentence in the half of the document nobody deciding whether to install will
read.

Nothing about releases is broken; every tag is on `main` today, and
`git branch --contains` says so for all four. What is missing is a branch whose
name answers *what does the thing I can install do*, and there is no commit
anybody can point at for that except a tag.

## What is decided

**`main` is the latest release and nothing else. Work lands on `develop`.**

1. **Every non-release commit goes to `develop`.** `main` moves only at a
   release, and only by fast-forward, so `main` is always exactly one tagged
   commit — never a commit no tag names, never work in front of the tag.

2. **The release, in order.** On `develop`: move `[Niewydane]` in CHANGELOG.md
   under the new version with its date, bump `package.json`, commit.
   Fast-forward `main` to `develop`. Tag `v<version>` on `main`.

   No hand-checked step is added by this. `.github/workflows/release.yml`
   already refuses a tag whose `package.json` disagrees with it, and
   `tools/changelog.ts` already refuses a version with no section — both of
   which fail the release rather than publishing something that lies about
   itself.

3. **The preview publishes from `main`, which now means the release.** The
   trigger does not change; its meaning does. That is the point of the whole
   arrangement: the link in README.md stops being a demo of unreleased work and
   becomes what its own sentence claims — the panel the file on the releases
   page draws. `bun run preview` is what somebody working on `develop` looks at,
   and it always was.

4. **`.github/workflows/check.yml` needs no change.** Its trigger is an
   unqualified `push:` rather than a branch list, deliberately, after a named
   list outlived the branch it named by a month. `develop` is gated the day it
   exists.

5. **`main` is protected, and the protection does not require a pull request.**
   Force-push and deletion refused, and the `check` workflow required to pass.
   That last one costs nothing to arrange: `check.yml` runs on every branch, so
   a commit on `develop` already carries a green run by the time `main` is
   fast-forwarded onto it, and a commit that never passed cannot arrive.

   Requiring a pull request instead is the shape this was expected to take, and
   it is rejected below for a mechanical reason — it forbids the fast-forward
   point 1 rests on.

6. **One guard, in `release.yml`: the tagged commit must be contained in
   `main`.** §7.5 puts a machine first, and this is the only part of the model a
   machine can see. A tag pushed from `develop` by hand — the exact mistake this
   model creates, because before it there was only one branch to tag from —
   would otherwise publish a release built from a tree `main` does not hold, and
   the release would look perfectly normal. The check is one `git branch
   --contains` against `origin/main`, beside the two refusals point 2 names, and
   it is what point 5 leans on: with `main` one command away, this is the thing
   standing between a slip of the wrist and a published release.

   Everything else here is a habit, and a habit gets prose: AGENTS.md §8's
   workflows line and README.md's preview paragraph both state which branch is
   which, and both change in the round that carries this out.

7. **What it costs.** Two commands more per release for a repository with one
   maintainer, and a fix that has to reach players goes to `develop` and is
   fast-forwarded like any other release rather than committed onto `main`. The
   thing bought is a branch name that answers a question, and a preview link
   that is true.

The protection itself is thrown by hand in the repository's settings, as the
Pages switch was, and no file here can assert that it is on. What a file can
say is what happens when it is not, which is point 6.

**It was applied at a tag, and it had to be.** When this was written `main`
carried 69 commits past `v0.6.0`, so switching without releasing would have put
*`main` is the release* into README.md and AGENTS.md as a sentence that was false
for as long as the next version took. The round that applied it therefore cut
0.7.0 as part of the same work: prose and workflows first, then the version and
the tag, then `develop` branched off the tagged commit — which is the moment the
invariant costs nothing, because at a release `main` already is what this asks it
to be.

## Rejected alternatives

- **Keep one branch, and accept a preview of unreleased work.** The status quo,
  and it was chosen deliberately: `docs/specs/2026-08-17-a-preview-anybody-can-open.md`
  rejected deploying on a tag because the page would be "stale for most of the
  life of the repository, and the thing worth looking at is usually the thing
  just built". That reasoning is reversed here, and the reversal is about who is
  looking. *The thing just built* is the right answer for whoever built it —
  who has `bun run preview`, on a machine with the tree checked out, faster and
  without a deploy. It is the wrong answer for the reader the link is addressed
  to, who is deciding whether to install a file and cannot install this one.
- **Publish the preview from `develop`.** Keeps the page at the tip and hands
  the visitor a panel no release ships, which is today's problem with a branch
  name attached to it.
- **Publish both, at two addresses.** `main` at the root, `develop` under a
  path. Two deployments, and the sub-path has to travel through the
  `scriptDirectory` hole in `tools/preview-page.ts` — a hole whose whole purpose
  is that getting it wrong loads cleanly and shows nothing. One preview that is
  wrong for nobody beats two that need a caption explaining which is which.
- **Deploy the page on a `v*` tag instead of on a branch.** Rejected once
  already, in the spec above. It is also unnecessary now: with `main` pinned to
  the release, the branch trigger produces exactly what the tag trigger would,
  and there is one trigger rather than two.
- **Call the branch `dev`,** which is what the task asked for. `dev` is taken:
  `bun run build:dev`, `build.ts --dev` and
  `src/userscript-instrument-development.ts` all mean the build that measures
  itself, and a branch by that name puts two unrelated meanings on one word in a
  repository where §9.4 spends a section on names. `develop` is four characters
  longer and collides with nothing.
- **A release branch per version.** Bookkeeping for parallel maintenance of
  older versions, which nothing here does: `@updateURL` points every installed
  copy at `releases/latest`, so there is one supported version and it is the
  newest.
- **Protect `main` by requiring a pull request from `develop`.** The obvious
  reading of "protected", and it cannot coexist with point 1: through a pull
  request GitHub offers a merge commit, a squash or a rebase, and the last two
  write new commit objects, so `develop` stops being an ancestor of `main` and
  has to be re-synchronised after every release. A merge commit avoids that and
  can carry the tag itself — `main` would still be the release — but it gives up
  the identity that makes the model easy to state: head of `main`, tagged
  commit and the commit on `develop`, one object. What the requirement buys is
  review and a barrier against somebody else's push. There is no somebody else,
  the review would be the author's own, and the release's list of changes is in
  CHANGELOG.md, which is where `release.yml` reads the notes from anyway. It
  also has a trap for a single maintainer: with approvals required at one,
  nothing can ever merge, because a pull request cannot be approved by whoever
  opened it.

  This is a decision to revisit the day a second person commits here. Going from
  no-pull-request to pull-request costs nothing; coming back leaves merge
  commits in the history, which is untidy and breaks nothing.
- **Require a pull request and bypass it as the repository's owner.** Keeps the
  fast-forward and the rule at the same time, by having the rule describe
  something nobody follows — protection against the one person it exempts.
- **A guard that reads git state from the test suite** instead of from
  `release.yml`. The gate runs on forks, on shallow checkouts and on a tree with
  no remote; a test asserting where `main` is would answer a question about the
  machine rather than about the code. The release workflow is the one place the
  question is both meaningful and answerable.
