---
name: release
description: Cut a MargoMeter release with docs/releasing.md as the script, plus what an agent session adds — the pushes handed to the maintainer one takt at a time and each one checked through GitHub's public API. Use when the user says "release", "wydanie", or names a version to ship.
---

# Releasing MargoMeter

`docs/releasing.md` is every step, in order, and **G7** is the order of the pushes. **This skill
owns no step.** It adds what a session running the release has to know that a person at the keyboard
would not.

## The process

1. **Read `docs/releasing.md` whole**, and follow it section by section, ticking its checklists in
   the conversation.
2. **The audit against the last tag.** Every `[Niewydane]` entry and every "earlier" in it is held
   against `git show v<last>:<path>`, not against the decision records: a record written in the
   cycle describes the branch. The audit runs both ways — an entry for a change the release does not
   make, and a change with no entry.
3. **The pictures.** Before the release commit, compare `fight` and `entry` in
   `screenshots/taken-at.json` with the set being replaced. The set follows `LANDING_RECORDING` in
   `tools/preview-site.ts` and `UNDERWAY_ENTRY` in `tools/panel-shots.ts`, so a change to either
   mid-cycle photographs another fight, and every `alt` in both READMEs becomes a claim nobody has
   checked. Open every picture (`docs/releasing.md`, step 2).
4. **The pushes are the maintainer's.** Each takt goes to the user as one command to run with `!`,
   and the next is handed over only once the last one is seen through the API (**G1**, **G7**).
   `git fetch . develop:main` is local, and runs before the second push (`docs/releasing.md`, step
   4).
5. **Every state is read, never taken on word**, through GitHub's public API, which needs no
   credentials for a public repository:

   ```bash
   api=https://api.github.com/repos/KamilGrocholski/margometer
   curl -s "$api/actions/runs?branch=develop&per_page=3"   # the check run of a push: status, conclusion
   curl -s "$api/git/ref/heads/main"                       # where main stands on the remote
   curl -s "$api/releases/tags/v<version>"                 # the release, its body and its assets
   ```

6. **After the tag**, `docs/releasing.md` step 5, item by item; the two attached files are read from
   the release's `assets`, not assumed.

## Gotchas paid for

- **`Everything up-to-date` after pushing `main` is a failure**, when `main` was not advanced
  locally first (`docs/releasing.md`, step 4).
- **A picture can photograph the wrong state and look right.** A press that finds no row draws the
  ranking a second time, under the old `alt`. Open the half-named and card pictures and check what
  each shows.
- **The tag before a green `check` is the expensive order.** Branch protection refuses `main` while
  the run goes; nothing refuses a tag (**G7**).
