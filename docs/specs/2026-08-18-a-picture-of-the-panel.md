# A picture of the panel, for one release

Status: implemented

## What was wrong

`README.md` says what the panel shows and links to the published preview, and a
reader who will not install an unauthorised userscript into a game — the choice
the README itself calls reasonable — had nothing to look at without leaving for
another site. From the maintainer's list: *"Create and update screenshots after
each release, use `screenshots` dir to store it (probably a tool is needed)"*,
narrowed in conversation to damage taken, drilled to the bottom, one picture of
each level and one of the detail card, and **for one release only** — a set that
is replaced, never an archive that grows.

## What this reverses, and what it does not

`docs/specs/2026-08-17-a-panel-you-can-watch-change.md` rejected this once:

> **A `--screenshot` mode in the tool.** It would fold the whole recipe in, but
> it hard-wires `/usr/bin/firefox` and a profile's download prefs into `tools/`.
> The server prints a URL; driving a browser stays the skill's job.

That rejection stands for what it rejected, and neither half of its reason
survives into what was built. `tools/panel-screenshots.ts` is a tool of its own
rather than a mode of the server, so the server still does nothing but print a
URL; the browser is found — `--browser`, then `MARGOMETER_BROWSER`, then `PATH` —
and its absence is a branded refusal rather than a silent nothing; and there are
no download preferences because this tool downloads nothing.

What the server did learn is one option. `composePreviewPage` already had a hole
for a second half of its driver, filled by hot reloading and appended after the
replay finishes; it is now called `appendedScript` and has two callers. The
alternative was a second hole, which would have meant two scripts appended in an
order nobody declared.

## What the pictures are

Four, on the newest capture, at the last payload — the finished fight:

| File | The screen |
|---|---|
| `panel-taken.png` | The ranking, damage taken |
| `panel-breakdown.png` | One combatant's row opened: whom it involved, and what it was made of |
| `panel-deep.png` | That row opened again — the deepest level the panel has |
| `panel-tip.png` | The card a row opens on hover, beside the panel |

Every state is reached by the page itself. The driver runs synchronously after
the replay and before `load`, which is all Firefox's `--screenshot` waits for,
and the panel mounts on its first look and re-renders inside the event that
caused it — so nothing has to be waited for and no automation library is
involved.

## Three things that were paid for

**`pointerdown`, not `click`.** The panel moved its tabs and rows off `click`
because a payload landing between a press and a release detaches the pressed node
and the browser then dispatches nothing
(`docs/specs/2026-08-18-a-gesture-a-redraw-cannot-split.md`). `node.click()`
fired nothing at all, and the run reported four successful shots: three identical
pictures of the ranking, one per drill level. The only visible sign was that the
three files were the same size. The driver now says so where it dispatches, and
`tests/tools/panel-screenshots.test.ts` holds every class it reaches through to
what `src/ui/panel-element.ts` assigns.

**`spawnSync` deadlocks against a server in the same process.** The preview
server runs on this process's event loop, so a synchronous spawn blocks the loop
that would answer the browser's request: the page never arrives, the browser waits
for it, and the tool waits for the browser until its own timeout. Measured both
ways on the same address — 1.1 s against a server in another process, the full two
minutes against this one. It looked like a browser fault for as long as only the
browser was suspected.

**A failed run must not take the pictures with it.** Shooting into `screenshots/`
after emptying it means a machine with no browser is left with no screenshots and
a README pointing at four files that are gone — which the test naming a browser
nothing can find demonstrated by deleting the committed set. The shots are taken
into a temporary directory and moved in only once all four exist.

## The 66vh cap, and why the photograph lifts it

The panel stops at `min(100vh - top - 8px, 66vh)` and scrolls beyond it, so a
window sized to the panel always leaves about a third of the frame empty — the
dead space is `0.34 × height - 8` whatever the height, and the only way to fill
the frame is to lift the cap.

It is lifted for the photograph, and that is not a panel nobody can have: at 66vh
of a 1080p window the cap sits at 713px, above every one of these contents, so a
player at an ordinary screen sees exactly what the pictures show. The frame is not
a screen — it is a crop of one — and sizing the window to the content is what
makes the crop tight.

## For one release, held by a machine

`screenshots/taken-at.json` names the version, the capture and the moment, and
`tests/tools/panel-screenshots.test.ts` holds its version against
`package.json` — the shape `tests/tools/changelog.test.ts` already uses. A
version bump is red until the set is retaken, so the obligation lands inside the
release that incurred it. The same guard holds the directory to exactly the files
the sidecar names, so a picture left over from a larger set cannot sit there
looking current.

## What it costs

`tests/tools/tracked-text.test.ts` holds every tracked file to carrying no byte a
reader cannot see, and a PNG carries a great many. The exemption is written
against the image names rather than the directory, so the sidecar beside them
stays inside the guard: a JSON document parses perfectly well with a NUL in it,
which is the failure with no symptom that guard exists for.

`NOTICE.md` gains a section. The breakdown and the card show the game's own names
for abilities, which that document says are written down nowhere here outside the
recordings — true of every `.ts` and `.md` and re-earned on every run by
`tests/tools/source-layout.test.ts`, and a picture is neither, so the promise
would have quietly stopped being true with nothing going red.

## Rejected alternatives

- **Generating them into a git-ignored directory and publishing them with the
  Pages site.** It costs no guard and no binary in git, and "one release" comes
  free because Pages is built from `main`. It was put to the maintainer against
  committing and lost: images that live only on a published site are not in a
  fork, not in a clone, and not in the README of a tag somebody checked out.
- **A per-version archive.** Asked for and declined in the same sentence that
  asked for the tool. A directory of every release's pictures answers a question
  nobody has, and the guard that keeps one set current could not be written
  against it.
- **Cropping the images to the panel after the fact.** The exact frame, at any
  window size, for a dependency — and zero runtime dependencies is a feature.
  Sizing the window is the same result with nothing installed.
- **Photographing the harness page at 1280×900**, which is what
  `.claude/skills/verify/SKILL.md` does. It needs no page changes at all, and two
  thirds of every image is empty background with a preview strip in the corner —
  tooling a reader has no use for, in a picture meant to show them the add-on.
- **Addressing the tab by its label.** The labels are Polish and §3 keeps this
  file English; the index comes from `composeDirectionTabs`, so a fifth screen
  that reorders the strip is caught by a guard rather than by a picture of the
  wrong tab.
- **Keeping `reloadScript` and adding a second hole for the shot driver.** Two
  scripts appended in an order nobody declared, and the page would have had to
  care which of its two callers it was serving.
