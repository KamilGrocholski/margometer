# What a release shows

Status: implemented

Three questions with one answer between them: which branch is the thing somebody
can install, what they can look at before installing it, and how the panel gets
photographed for a README.

Three rounds between 2026-08-17 and 2026-08-18 arrived at this.

---

## 1. `main` is the latest release, and nothing else

`main` used to carry two jobs that pulled against each other. It was the tip of
development — 69 commits sat between `v0.6.0` and it — and it was the branch the
outside world was pointed at, since Pages publishes on every push to it and
README.md opens with *"See it before you install it"* over that link. So the page
a stranger judged the add-on by was drawn by code they could not install.

**Work lands on `develop`. `main` moves only at a release, and only by
fast-forward**, so its head is always exactly one tagged commit.

### The release, in order

On `develop`: move `[Niewydane]` in CHANGELOG.md under the new version with its
date, bump `package.json`, commit. Fast-forward `main` to the **release commit**.
Tag `v<version>` on `main`.

⚠️ **Three pushes, and the wait is between the second and the third.** `develop`,
then `main` once the `check` run that first push started is **green**, then the
tag. Branch protection refuses `main` while a required run is in progress, and
that refusal is cheap — the tag going out first is not.

⚠️ **Fast-forward to the release commit, not to whatever `develop` has grown
since.** That is what keeps the identity true when work carries on while a
release is being cut.

No hand-checked step is added: `release.yml` already refuses a tag whose
`package.json` disagrees with it, and `tools/changelog.ts` already refuses a
version with no section.

### The one guard a machine can hold

**The tagged commit must be contained in `main`**, checked in `release.yml` with
one `git branch --contains` against `origin/main`. A tag pushed from `develop` by
hand — the exact mistake this model creates, because before it there was only one
branch to tag from — would otherwise publish a release built from a tree `main`
does not hold, and it would look perfectly normal.

`main` is protected: force-push and deletion refused, `check` required to pass.
That costs nothing to arrange, because `check.yml` runs on every branch, so a
commit on `develop` already carries a green run by the time `main` is
fast-forwarded onto it. The protection is thrown by hand in the repository's
settings and no file here can assert it is on; what a file can say is what happens
when it is not, which is the guard above.

### What the first release after this cost

`v0.8.0`, 2026-08-19. `develop` was pushed and `main` straight after it while the
`check` run was still going, so protection refused `main`:
`Required status check "check" is in progress`. **The tag went out anyway.**
`release.yml` fetched `origin/main` — still the commit `v0.7.0` names — found the
tag outside it and stopped on its own first step. The guard doing exactly what it
is for.

What the guard does not do is recover. `release.yml` triggers on a tag push and on
nothing else, so pushing `main` a minute later re-ran nothing: the version was
tagged, `main` contained it, `package.json` agreed, the gate was green — and the
releases page still had 0.7.0 at the top with no run left to notice. **A release
that never happened looks exactly like one nobody asked for**, which is why this
is written down rather than remembered.

Two recoveries, not equivalent. Re-running the failed workflow run works, because
the guard re-fetches `origin/main`. Making the tag arrive again — deleting it on
the remote and pushing it once more, safe precisely while no release was ever
published from it — is the one this model asks for when the fast-forward has also
carried commits that landed after the release commit. That is what happened: a
`todo:` commit sat on top, so `main`'s head was no longer the tagged commit.
Rewinding `main` instead is not available, because the protection refuses a
force-push, as it should.

**It was applied at a tag, and it had to be.** Switching without releasing would
have put *`main` is the release* into README.md and AGENTS.md as a sentence that
was false for as long as the next version took.

## 2. A panel you can watch change

`bun run check` cannot see a panel. The gate typechecks, runs the suite and builds
the bundle, and every one of those can be green while the thing a player looks at
is broken — which has happened twice.

What stood in for the missing surface was a recipe in
`.claude/skills/verify/SKILL.md` telling whoever read it to hand-write an HTML
page, stub `Engine`, embed a capture and point headless Firefox at `file://`. It
was detailed and correct. **Nobody ever ran it**, and by the time anybody looked
it had drifted: three of its six selectors no longer existed. That is §7.5's shape
exactly — a lesson written down, with a producer and no consumer. The fix is not
to correct the recipe again; it is to make the recipe a thing that runs.

**`bun run preview`** serves the built userscript over a captured fight at
`http://localhost:4173`, watches `src/`, `libs/` and `package.json`, and reloads
the page on a rebuild — at the entry the reader was on, so an edit to `src/ui/`
redraws the screen they were already looking at. The replay is stepped, which is
what lets the states nobody could otherwise look at be looked at: the panel before
any data, every combatant at the start of a fight, the tip near a window edge.

**The bundle is composed in memory, and it is the same bundle.**
`composeUserscriptFiles()` moved out of the writer at its second consumer (§7.1).
What must not be spelled twice is `format: "iife"`, `minify: false` and the
version substituted from `package.json` — a preview built on different settings is
a preview of something nobody installs.

⚠️ **`Bun.build` rejects with an `AggregateError` rather than returning
`success: false`**, which had been true all along and was surfaced by this.

## 3. A picture of the panel, for one release

A reader who will not install an unauthorised userscript into a game — the choice
README.md itself calls reasonable — had nothing to look at without leaving for
another site. Four pictures, on the newest capture, at the last payload:

| File | The screen |
|---|---|
| `panel-taken.png` | The ranking, damage taken |
| `panel-breakdown.png` | One combatant's row opened |
| `panel-deep.png` | That row opened again — the deepest level the panel has |
| `panel-tip.png` | The card a row opens on hover, beside the panel |

Every state is reached by the page itself. The driver runs synchronously after the
replay and before `load`, which is all Firefox's `--screenshot` waits for, so
nothing has to be waited for and no automation library is involved.

`tools/panel-screenshots.ts` is a tool of its own rather than a mode of the
server, so the server still does nothing but print a URL; the browser is found via
`--browser`, then `MARGOMETER_BROWSER`, then `PATH`, and its absence is a branded
refusal rather than a silent nothing.

### Three things that were paid for

**`pointerdown`, not `click`.** The panel moved its tabs and rows off `click`
because a payload landing between a press and a release detaches the pressed node.
`node.click()` fired nothing at all, and the run reported four successful shots:
three identical pictures of the ranking, one per drill level. **The only visible
sign was that the three files were the same size.**

**`spawnSync` deadlocks against a server in the same process.** The preview server
runs on this process's event loop, so a synchronous spawn blocks the loop that
would answer the browser's request. Measured both ways on the same address —
1.1 s against a server in another process, the full two minutes against this one.
It looked like a browser fault for as long as only the browser was suspected.

**A failed run must not take the pictures with it.** Shooting into `screenshots/`
after emptying it leaves a machine with no browser holding a README that points at
four files that are gone. The shots are taken into a temporary directory and moved
in only once all four exist.

### The 66vh cap, and why the photograph lifts it

The panel stops at `min(100vh - top - 8px, 66vh)` and scrolls beyond it, so a
window sized to the panel always leaves about a third of the frame empty — the
dead space is `0.34 × height - 8` whatever the height.

It is lifted for the photograph, and that is not a panel nobody can have: at 66vh
of a 1080p window the cap sits at 713px, above every one of these contents, so a
player at an ordinary screen sees exactly what the pictures show. **The frame is
not a screen — it is a crop of one**, and that is the whole licence (§9.8).

### Held by a machine, for one release

`screenshots/taken-at.json` names the version, the capture and the moment, and
`tests/tools/panel-screenshots.test.ts` holds its version against `package.json`.
A version bump is red until the set is retaken, so the obligation lands inside the
release that incurred it. The same guard holds the directory to exactly the files
the sidecar names, so a picture left over from a larger set cannot sit there
looking current.

`tests/tools/tracked-text.test.ts` exempts the images **by name** rather than by
directory, so the sidecar beside them stays inside the guard: a JSON document
parses perfectly well with a NUL in it.

`NOTICE.md` gains a section, because the breakdown and the card show the game's
own names for abilities — written down nowhere here outside the recordings, which
is re-earned on every run for every `.ts` and `.md`, and a picture is neither.

## Rejected alternatives

**Keep one branch, and accept a preview of unreleased work.** Deploying on a tag
was once rejected because the page would be stale for most of the life of the
repository, and the thing worth looking at is usually the thing just built. That
reasoning is reversed here, and the reversal is about **who is looking**: *the
thing just built* is the right answer for whoever built it, who has
`bun run preview`. It is the wrong answer for the reader the link is addressed to.

**Publish the preview from `develop`.** Today's problem with a branch name
attached to it.

**Publish both, at two addresses.** Two deployments, and the sub-path has to
travel through the `scriptDirectory` hole in `tools/preview-page.ts` — a hole
whose whole purpose is that getting it wrong loads cleanly and shows nothing.

**Call the branch `dev`,** which is what the list asked for. `dev` is taken:
`bun run build:dev`, `build.ts --dev` and
`src/userscript-instrument-development.ts` all mean the build that measures
itself.

**A release branch per version.** `@updateURL` points every installed copy at
`releases/latest`, so there is one supported version and it is the newest.

**Protect `main` by requiring a pull request from `develop`.** It cannot coexist
with the fast-forward: a squash or a rebase writes new commit objects, so
`develop` stops being an ancestor of `main`. A merge commit avoids that but gives
up the identity that makes the model easy to state — head of `main`, tagged commit
and the commit on `develop`, one object. It also has a trap for a single
maintainer: with approvals required at one, nothing can ever merge, because a pull
request cannot be approved by whoever opened it. Revisit the day a second person
commits here.

**A guard that reads git state from the test suite** instead of from
`release.yml`. The gate runs on forks, on shallow checkouts and on a tree with no
remote; a test asserting where `main` is would answer a question about the machine
rather than about the code.

**A WebSocket instead of Server-Sent Events** for the reload. Reload is one
direction and one message; SSE needs no handshake, no protocol and no library, and
it reconnects on its own.

**Watching `dist/` and letting `bun run build` drive it.** It churns `dist/` on
every keystroke, races `bun run check`, and makes a failed build
indistinguishable from a slow one.

**Tearing down `globalThis.margometer` and re-injecting the script tag** instead
of reloading. It leans on `hasOtherMargoMeter` internals to unstick itself, and a
second execution that gets it wrong logs `already-running-here` and draws nothing
— which reads as a broken build.

**Generating the pictures into a git-ignored directory and publishing them with
Pages.** It costs no guard and no binary in git. Put to the maintainer against
committing and lost: images that live only on a published site are not in a fork,
not in a clone, and not in the README of a tag somebody checked out.

**A per-version archive of screenshots.** Asked for and declined in the same
sentence that asked for the tool. A directory of every release's pictures answers
a question nobody has, and the guard that keeps one set current could not be
written against it.

**Cropping the images to the panel after the fact.** The exact frame at any window
size, for a dependency — and zero runtime dependencies is a feature.

**Photographing the harness page at 1280×900.** Two thirds of every image is empty
background with a preview strip in the corner — tooling a reader has no use for.

**Addressing the tab by its label.** The labels are Polish and §3 keeps these files
English; the index comes from `composeDirectionTabs`, so a fifth screen that
reorders the strip is caught by a guard rather than by a picture of the wrong tab.

**A dev strip along the top of the preview page.** The panel is `position: fixed`
in the top-right at `z-index: 9999`, so a top strip sits under it. Bottom-left is
the one region neither the panel's corner nor its tooltip claims.
