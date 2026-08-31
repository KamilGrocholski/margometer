# Releasing

Every step of cutting a release, in order. A release happens a few times a year and is run by one
person, which is the interval at which an unwritten sequence is re-derived wrongly.

**Each step names what it is and cites what owns it.** Nothing here restates a rule: where a step
ends in a pointer, that pointer is where the rule lives, and this file is wrong the moment it says
the rule again in its own words.

## 0. What a release is here

Three files change together — `CHANGELOG.md` gains a section, `deno.json` gains a number,
`screenshots/` is taken again — and then three pushes go out in an order that matters. What a tag
turns into is `.github/workflows/release.yml`'s to do, and nothing after the tag is by hand.

Which branch holds what: **G6**. The order the three pushes go in, and where the wait is: **G7**.

## 1. Before the number moves

- [ ] On `develop`, working tree clean, `deno task check` green.
- [ ] `deno task decoding` — nothing newly unread over `captures/`. A release that decodes less than
      the last one is a finding, not a release.
- [ ] `deno task drill` — `docs/drill-levels.md` still says what is measured.
- [ ] Read the accepted decisions **against the tree of the last tag**, never against `develop`:
      `git show v0.11.0:docs/adr/README.md`. An audit run against the working tree reads every
      record as outstanding, including the ones the last release already shipped. The lifecycle a
      status may name is `docs/adr/README.md`'s.
- [ ] `ARCHITECTURE.md`'s known gaps — close what closed, and say what a release running has changed
      about the list.
- [ ] Both READMEs, sentence by sentence. Every claim on the front page is about what a stranger is
      about to install.

## 2. The release commit

Move what has accumulated under the new number with its date, and bump the declaration. How a
section is written and what the move is: the header comment of `CHANGELOG.md`. Why the section is
the body of the release, and why the declaration is in one place: **ADR 0018**.

The number itself is SemVer, and what `0.x` promises is the warning `CHANGELOG.md` opens with.

```
build(release): <the number>, and what it is
```

`deno task check` refuses a declaration with no section, so this commit is where a forgotten section
is caught rather than at the tag.

## 3. Photograph the panel at the number it ships as

```bash
deno task screenshots --release
```

The flag is what puts the release number on the panel in the pictures instead of the mark a build
nobody tagged wears — **ADR 0037**, standing on **ADR 0035**. Without it the front page shows a
version nobody can install, and no picture looks wrong.

- [ ] **Open all five.** No machine can say whether the state in a picture is reachable, and this is
      the standing obligation _The Frame Is Not A Screen Rule_ in `DESIGN.md` leaves nobody an
      exemption from.
- [ ] The title bar reads the bare number in every one of them.

```
docs(screenshots): the set is taken again, at <the number>
```

## 4. The gate

- [ ] `git add`, then `deno task check`. Part of the gate lists what it reads with `git ls-files`,
      so a file written straight to disk is invisible to it — **W2**, and **W1** for when the gate
      runs at all.
- [ ] Every commit in the release leaves it green on its own — **G5**.

## 5. Push, in three takts

The branches, the order and the one wait: **G7**. The tag is last, and the reason it is last is in
that rule and in `.github/workflows/release.yml`'s own comment — branch protection refuses `main`
while a run is going and that refusal is cheap, where a tag pushed early is not.

Permission for each push is asked for, every time — **G1**.

## 6. After the tag

`.github/workflows/release.yml` builds again at the tag's version, holds three things level, and
publishes. Then, by hand:

- [ ] **Both files are attached** — `margometer.user.js` and `margometer.meta.js`. The metadata one
      is not optional and the workflow's own banner says why: a version in the field polls it for
      its next version, and a release without it leaves every copy installed from that version
      checking a 404 for good, silently. The protected contract is in `ARCHITECTURE.md`.
- [ ] Install the published file into a browser and open a fight. The panel's title bar states the
      released number.
- [ ] The published preview — `.github/workflows/pages.yml` deploys it from `main` — states the same
      number. Its panel is built with the same flag as the pictures.
- [ ] The release notes read as the changelog section, with the install note under them.

## What is held by a machine, and what is not

| Held                                                 | By                                      |
| ---------------------------------------------------- | --------------------------------------- |
| the declaration has a section, and it says something | `tests/tools/changelog.test.ts`         |
| the set was taken at a version this tree is          | `tests/tools/panel-screenshots.test.ts` |
| the tag and the declaration agree                    | `.github/workflows/release.yml`         |
| the built files carry the tagged version             | `.github/workflows/release.yml`         |
| the set was taken at the tagged version, unmarked    | `.github/workflows/release.yml`         |
| the tag sits on `main`                               | `.github/workflows/release.yml`         |

Everything else on this page is held by somebody reading it: the audits in step 1, the five pictures
in step 3, and the install in step 6.
