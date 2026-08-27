---
name: verify
description: Run the built userscript against a captured fight in a real browser and capture what the panel draws. Use when verifying a change to src/ at its actual surface rather than through tests.
---

# Verifying MargoMeter by running it

The add-on's surface is a browser page. `bun test` is not that surface, and two
comments in `src/userscript-entry.ts` say so out loud — the download path and
`shouldStartHere` were both wrong in ways every test passed through.

**The page is no longer something you build.** It was a recipe here for the life
of two audits and nobody ever ran it; it is now `tools/preview-server.ts`, so
what is left in this document is the half a tool cannot hold — how to drive it,
what a synthetic pointer does that a real one does not, and which flows are worth
driving at all.

## The server

```bash
bun run preview                     # http://localhost:4173
bun run preview --port 8080
bun run preview --fight 2026-08-14-tempest-grupa-vs-hildur
```

It builds in memory, so nothing has to be built first and `dist/` is never
touched. The page carries the whole fight, replays it synchronously, and offers a
strip at the bottom left: capture picker, build status, and `◀ ▶ play to end`
with an `entry N / total` counter.

**Picking a capture replays it into the page that is open**, so the panel keeps
the tab, wherever it was dragged to and whether it was minimized — none of which
a reload keeps here, see the storage gotcha below. The page fetches
`/payloads?fight=<name>` and feeds it; the fight left behind goes onto the shelf,
exactly as it would in game
(`docs/specs/2026-08-27-picking-a-capture-keeps-the-panel.md`). A published page
has no process to ask and still navigates.

The address is the whole of the state:

```
http://localhost:4173/?fight=<capture-name>&entry=<n>
```

`entry` is where the replay stops, clamped to the fight's length. `entry=0` is
the panel before anything has arrived; the last entry is the finished fight.
Both matter — most of what a screenshot needs to show is at one end or the other.

⚠️ **`#start` beats `entry`, and the `od początku` button reaches it by opening
the page again.** Before the first payload is the one state a replay cannot
reach — feeding nothing leaves the add-on holding the fight it already has — so
the button reloads and the hash carries the ask across, which is also the only
way the published page can say it. A screenshot of a page that clicks that
button gets nothing: Firefox exits on a navigation during `load`. Photograph
`…#start` directly, or watch the two requests in a server log.

**Hot reloading.** A change under `src/`, `libs/` or `package.json` rebuilds and
reloads the page at the entry you were on. A rebuild that **fails** does not
reload: the strip turns red and prints the build log, and the last good panel
stays up. So a red strip means your edit did not compile, not that the panel
broke.

## The screenshot

**Four of them are a command now.** `bun run screenshots` retakes the set in
`screenshots/` that `README.md` shows — the ranking on damage taken, the two
levels below it and the detail card — and `tools/panel-screenshots.ts` holds the
whole recipe below, plus the two traps it does not: the panel listens for
`pointerdown` rather than `click`, and `spawnSync` deadlocks against a server in
the same process. Reach for that when the four states it covers are the ones you
want, and for the rest of this page when they are not.

Firefox is at `/usr/bin/firefox` and takes one without Playwright:

```bash
MOZ_HEADLESS=1 timeout 120 firefox --profile "$PROFILE" --no-remote \
  --window-size 1280,900 --screenshot "$OUT.png" \
  "http://localhost:4173/?fight=2026-08-14-tempest-grupa-vs-hildur&entry=91"
```

- `--profile "$(mktemp -d)"` always. A shared profile is shared state, and the
  download prefs below have to go somewhere.
- **It waits for `load` and nothing after it.** That is why the preview page
  carries its fight inline and replays it synchronously — an earlier version
  fetched the capture and photographed itself empty, with the strip still saying
  `loading`, which looks exactly like a panel that failed to draw. Anything *you*
  add to the page has the same deadline.
- There is no console and no second interaction. **Write what you observed into a
  `<pre>` on the page** — row texts read back out of the shadow root, the stored
  position, what the console saw. The screenshot then carries its own evidence.

## Reading the panel back out

`document.getElementById("MargoMeter-Panel")` — every element the add-on puts in
the page is named that way, and its `data-margometer-version` says which build
you are looking at. Nothing the *harness* draws is: its own chrome is `preview-`,
so `MargoMeter-` still means "the add-on's" on this page.

The shadow root is `mode: "open"`, so `.shadowRoot.querySelector(…)` reaches
inside. Its three children are prefixed too — `.MargoMeter-titlebar`,
`.MargoMeter-body`, `.MargoMeter-tip` — and everything below them is not, because
nothing outside the shadow root can see those.

| Selector | What it is |
|---|---|
| `.row`, `.row-rank`, `.row-name`, `.row-value`, `.row-share`, `.row-badge` | a ranking row and its parts |
| `.bar`, `.bar-cap` | the bar behind a row |
| `.tab`, `.tabs` | the metric and direction strips |
| `.crumb`, `.crumb-back`, `.crumb-here` | the drill breadcrumb |
| `.list`, `.empty`, `.pinned` | the scrolling list, its empty case, the row pinned under it |
| `.section-heading` | a heading inside a drill level |
| `.sides`, `.sides-label`, `.sides-track`, `.sides-region` | the summary under the list |
| `.warning` | a total that may be too low, and why |
| `.undrawn` | a region that could not be rendered at all |
| `.titlebar-version` | the version, why reports can be screenshots |
| `.titlebar-copy` | `⧉` copy the report |
| `.titlebar-raw` | `{ }` save the recording |
| `.titlebar-button` (bare) | `—` collapse |

## Gotchas paid for

- **A synthetic `PointerEvent` aborts the drag.** `setPointerCapture` throws
  `InvalidPointerId` for a pointerId no real pointer owns, and
  `panel-element.ts` calls it *before* the grab is recorded, so the guarded
  handler swallows the whole drag. Stub `bar.setPointerCapture` /
  `releasePointerCapture` on the title bar before dispatching, and say so in the
  report. A real pointer does not hit this.
- **The world reads as `localhost`.** `getWorldFromPage` takes the first label of
  the hostname, so a preview says `localhost` where a real page says `tempest`.
  That is correct behaviour, not a fault to chase — and it is *not* the empty
  string that a `file://` page used to produce, which was a real bug and is fixed.
- **Nothing the add-on stores outlives the page.** The harness installs its own
  store over `localStorage` and `sessionStorage` before the bundle runs, so a
  visitor to the published preview is not left holding somebody's demo fight
  (`docs/audits/2026-08-26-the-whole-tree-read-a-fifth-time.md`, F7) — and every
  reload therefore starts at the default corner, expanded, with the shelf empty.
  *"The position survived a reload"* is **not** testable on this page; drive
  `getStoreFromPage` directly, or read the key back inside the one document. What
  does survive is a pick, which no longer reloads.
- **Downloads work under `--screenshot`** — the file lands before Firefox exits.
  Prefs in `$PROFILE/user.js`: `browser.download.folderList=2`,
  `browser.download.dir`, `browser.download.useDownloadDir=true`,
  `browser.helperApps.neverAsk.saveToDisk="application/json"`.
- **The build script 404s on purpose.** `/main.min<build>.js` is a decoy: only its
  `src` attribute is read, and without it the build is `null` in any recording
  saved.

## Flows worth driving

Step to `entry=0` and check the panel says it has nothing rather than drawing
zeroes · scrub forward and watch rows appear · jump to the end and check the
numbers against `bun tools/fight-report.ts` (they agree exactly — two independent
paths over one capture) · drag, reload, and reload again with a corrupt stored
position · click each tab and drill into a row and back out · click save and parse
the file back with `tools/fight-dump-parser.ts` · save before any fight · make the
game's own `updateData` throw · load with no `Engine` at all.

For the last two, edit the stub in `composePreviewPage` — it is one string in
`tools/preview-page.ts`, and a change there needs the server restarted, because
the watcher deliberately does not watch itself.

The same page is published by `tools/preview-site.ts`, in Polish and opening on
the finished fight. What is worth driving there and nowhere else: that the panel
appears at all under a path of its own (`python3 -m http.server` from `dist/`,
opened at `/preview/` — an absolute `src` works everywhere except a deployment),
and that the console is empty, which is where a reload stream reconnecting to
nothing and a decoy answered with HTML would show.

## Reading a saved recording back

`tools/fight-dump-parser.ts` imports `@/…`, so a script outside the repo needs a
`tsconfig.json` beside it mapping `"@/*"` to the repository root.
