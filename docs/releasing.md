# Releasing

Every step of cutting a release, in order. A release happens a few times a year and is run by one
person, which is the interval at which an unwritten sequence is re-derived wrongly.

**Each step names what it is and cites what owns it.** Nothing here restates a rule: where a step
ends in a pointer, that pointer is where the rule lives.

## 0. What a release is here

Two files change together — `CHANGELOG.md` moves `[Niewydane]` under a number, and `deno.json` gains
that number — and then three pushes go out in an order that matters. What a tag turns into is
`.github/workflows/release.yml`'s to do, and nothing after the tag is by hand but the checks in
step 5.

Which branch holds what: **G6**. The order the three pushes go in, and where the wait is: **G7**.

## 1. Before the number moves

- [ ] On `develop`, working tree clean, `deno task check` green, `deno task e2e` green.
- [ ] `deno task game:readings status` — every reading current (**W10**). A release standing on a
      table the game has moved past draws figures the game no longer means.
- [ ] `deno task fight:decoding` — nothing newly unread over `captures/`. A release that decodes
      less than the last one is a finding, not a release.
- [ ] Both READMEs, sentence by sentence, and the band the published page opens with
      (`tools/preview-site.ts`). Every claim on any of the three is about what a stranger is about
      to install.
- [ ] `screenshots/` is the set `develop` took at `0.19.0`, and no tool here retakes it. Where the
      panel's look changed since, the set is retaken by hand before the release commit, and
      `screenshots/taken-at.json` states the number it was taken at.

## 2. The release commit

Move what has accumulated under `[Niewydane]` to the new number with its date, and bump the
declaration in `deno.json` — both in one commit. How a section is written and what the move is: the
header comment of `CHANGELOG.md`. Why the section is the body of the release, and why the
declaration is in one place: **develop ADR 0018**.

```
build(release): <the number>, and what it is
```

`deno task check` refuses a declaration with no section (`tests/repository/changelog.test.ts`), so
this commit is where a forgotten section is caught rather than at the tag.

## 3. The gate

- [ ] `git add`, then `deno task check` — **W2**, **W1**.
- [ ] Every commit in the release leaves it green on its own — **G5**.
- [ ] `deno task e2e` — the built file in a real Chrome, outside the gate on purpose — **W9**.

## 4. Push, in three takts

The branches, the order and the one wait: **G7**.

```bash
git push origin develop
# Wait here. The run this waits for is `check` on that push, and it has to be green.
git fetch . develop:main
git push origin main
git tag "v${version}" && git push origin "v${version}"
```

⚠️ **`main` is advanced before it is pushed, and forgetting it fails silently.** The local `main` is
still standing on the release before this one, so `git push origin main` pushes that, matches the
remote, and answers `Everything up-to-date`, which reads exactly like the push having worked. It
cost a takt on `v0.12.0`.

`git fetch . develop:main` is the advance without a checkout, and it **refuses anything but a
fast-forward**, which is what **G6** asks of `main`. Measured on git 2.39.5, 2026-09-01: a rewind
prints `! [rejected] … (non-fast-forward)`, leaves the ref where it was and exits `1`, where
`git branch -f main develop` takes the same rewind without a word and exits `0`.

Permission for each push is asked for, every time — **G1**.

## 5. After the tag

`.github/workflows/release.yml` builds again at the tag's version, holds the tag to the declaration
and to `main`, and publishes. `.github/workflows/pages.yml` publishes the page from `main`. Then, by
hand:

- [ ] **Both files are attached** — `margometer.user.js` and `margometer.meta.js`. An installed copy
      polls the second for its next version, and a release without it leaves every copy checking a
      404 for good, silently.
- [ ] Install the published file into a browser and open a fight. The panel's title bar states the
      released number.
- [ ] **The same file is posted to Greasy Fork** — the asset this release attached, never a local
      build. A copy installed there polls Greasy Fork's own copy and never this repository's, so a
      release skipped there leaves those copies where they are (**develop ADR 0099**).
- [ ] The published page states the same number, in its band and in its panel.
- [ ] The release notes read as the changelog section, with the install note under them.

## What is held by a machine, and what is not

| Held                                                 | By                                     |
| ---------------------------------------------------- | -------------------------------------- |
| the declaration has a section, and it says something | `tests/repository/changelog.test.ts`   |
| the tag and the declaration agree                    | `.github/workflows/release.yml`        |
| the built files carry the tagged version             | `.github/workflows/release.yml`        |
| the tag sits on `main`                               | `.github/workflows/release.yml`        |
| the file stays inside what the second host takes     | `tests/tools/build-userscript.test.ts` |

Everything else on this page is held by somebody reading it: the audits in step 1, the pictures, and
the install and the post to the second host in step 5.
