---
name: verify
description: Run the built userscript against a captured fight in a real browser and capture what the panel draws. Use when verifying a change to src/ at its actual surface rather than through tests.
---

# Verifying MargoMeter by running it

The add-on's surface is a browser page. `deno task check` is not that surface: it typechecks, runs
the suite and builds the bundle, and every one of those can be green while the panel is broken.

## The server

```bash
deno task preview                     # http://localhost:4173
deno task preview --port 8080
deno task preview --fight 2026-08-23-tempest-grupa-vs-hildur
```

It builds into a temporary file, so nothing has to be built first and `dist/` is never touched. The
page carries the whole fight, replays it synchronously, and offers a strip at the bottom left:
recording picker, build status, and `◀ ▶ odtwórz do końca` with an `entry N / total` counter.

**Picking a recording replays it into the page that is open**, so the panel keeps its screen,
wherever it was dragged to and whether it was folded — none of which a reload keeps here, see the
storage note below. The page fetches `/calls?fight=<name>` and feeds it; the fight left behind goes
onto the shelf, exactly as it would in game.

The address is the whole of the state:

```
http://localhost:4173/?fight=<recording-name>&entry=<n>
```

`entry` is where the replay stops, clamped to the fight's length. The last entry is the finished
fight, and both ends matter — most of what is worth looking at is at one or the other.

⚠️ **`#start` beats `entry`, and `od początku` reaches it by opening the page again.** Before the
first call is the one state a replay cannot reach: feeding nothing leaves the add-on holding the
fight it already accumulated, so the counter would read `0 / 52` beside rows still carrying their
totals. Only a page that has fed nothing is the empty panel.

**Hot reloading.** A change under `src/` rebuilds and reloads the page at the entry you were on. A
rebuild that **fails** does not reload: the strip turns red and prints the build log, and the last
good panel stays up. So a red strip means your edit did not compile, not that the panel broke.
`tools/` is not watched — this process already imported it, so editing the server means restarting
it.

## The screenshots

```bash
deno task screenshots
deno task screenshots --browser /usr/bin/google-chrome   # or MARGOMETER_BROWSER
```

Five pictures into `screenshots/`, with `taken-at.json` beside them naming the commit, the recording
and the moment. It **refuses to shoot while `src/` carries anything no commit holds** — `DESIGN.md`
owns that rule — and a failed run leaves the previous set alone, because nothing moves in until
every picture exists.

Each shot is measured before it is taken: the page writes the panel's own edges into a hidden
`<pre>`, and the frame comes off that, so the picture is the panel and the air around it rather than
a third of a screen of background.

## Driving a browser by hand

Chrome, because it is what Margonem is played in and where the panel's layout is measured.

```bash
PROFILE=$(mktemp -d)
timeout 60 google-chrome --headless=new --disable-gpu --no-first-run --hide-scrollbars \
  --user-data-dir="$PROFILE" --window-size=300,900 \
  --screenshot=out.png "http://localhost:4173/?fight=<name>&entry=91"
```

- `--user-data-dir="$(mktemp -d)"` always. A shared profile is shared state between two runs.
- **It waits for `load` and nothing after it.** That is why the page carries its fight inline and
  replays it synchronously. Anything _you_ add to the page has the same deadline.
- ⚠️ **`--dump-dom` floors the window at 500px wide; `--screenshot` honours what it is given.**
  Measured on Chrome 152, 2026-08-29. A frame derived from the width you asked for rather than the
  one the page reports is wrong by the difference, and the picture looks perfectly fine.
- There is no console and no second interaction. **Write what you observed into a `<pre>` on the
  page** — row texts read back out of the shadow root, the stored position, what a handler saw. The
  screenshot then carries its own evidence.

## Reading the panel back out

`document.getElementById("MargoMeter-Panel")` — every element the add-on puts in the page is named
that way, and `data-margometer-version` says which build you are looking at. Nothing the _harness_
draws is: its own chrome is `preview-`, so `MargoMeter-` still means "the add-on's" on this page.

The shadow root is open, so `.shadowRoot.querySelector(…)` reaches inside. Its own children are
prefixed too — `.MargoMeter-titlebar`, `.MargoMeter-body`, `.MargoMeter-sides`, `.MargoMeter-tip` —
and everything below them is not, because nothing outside the shadow root can see those.

| Selector                                                     | What it is                        |
| ------------------------------------------------------------ | --------------------------------- |
| `.row`, `.row-rank`, `.row-name`, `.row-value`, `.row-share` | a ranking row and its parts       |
| `.row-time`, `.row-size`, `.row-pin`                         | a shelf row's own cells           |
| `.bar`, `.bar-cap`                                           | the bar behind a row              |
| `.tab`, `.tabs`, `.selected`                                 | a strip, and the tab you are on   |
| `.crumb`, `.crumb-back`, `.crumb-here`                       | the breadcrumb over an opened row |
| `.list`, `.empty`, `.pinned-region`, `.section-heading`      | the list and what stands in it    |
| `.sides`, `.sides-label`, `.sides-track`                     | the totals under the list         |
| `.warning`, `.undrawn`                                       | a low figure; a region that threw |
| `.titlebar-version`, `[data-save]`                           | the version, `⭳` save             |
| `.titlebar-fights`, `.titlebar-button`                       | the shelf, and folding the panel  |

Presses and hovers are addressed by attribute rather than by class: `[data-screen]` for both tab
strips in order, `[data-side]` for the audience strip, `[data-row]`, `[data-shelf]`, `[data-pin]`,
`[data-tip]`, `[data-storage]`.

## Gotchas paid for

- **`pointerdown`, not `click`.** The panel listens for the press, because a payload landing between
  a press and a release detaches the pressed node. `node.click()` fires nothing at all — in v1 that
  reported four successful shots of three identical pictures, and the only visible sign was that the
  files were the same size.
- **A synthetic `PointerEvent` aborts a drag.** `setPointerCapture` throws for a pointerId no real
  pointer owns, and the guarded handler swallows the whole drag. Stub
  `setPointerCapture`/`releasePointerCapture` on the title bar before dispatching, and say so in the
  report. A real pointer does not hit this.
- **The world reads as `localhost`.** `getWorldFromPage` takes the first label of the hostname, so a
  preview says `localhost` where a real page says `tempest`. Correct behaviour, not a fault to
  chase.
- **Nothing the add-on stores outlives the page.** The harness installs its own store over
  `localStorage` and `sessionStorage` before the bundle runs, so a visitor to the published preview
  is not left holding somebody's demo fight. _"The position survived a reload"_ is therefore not
  testable here; drive the store directly, or read the key back inside the one document. What does
  survive is a pick, which no longer reloads.
- **The build script 404s on purpose.** `/main.min<build>.js` is a decoy: only its `src` attribute
  is read, and without it a recording saved from the preview names no build.

## Flows worth driving

Step to `#start` and check the panel says it has nothing rather than drawing zeroes · scrub forward
and watch rows appear · jump to the end and check the figures against what the suite computes over
the same recording · drag, reload, and reload again with a corrupt stored position · press each tab
and open a row and step back out · press `{ }` and parse the file back · press `{ }` before any
fight · make the game's own `updateData` throw · load with no `Engine` at all.

For the last two, edit the stub in `tools/preview-page.ts` and restart the server — the watcher
deliberately does not watch itself.

## The published page

```bash
deno task preview:site
python3 -m http.server -d dist    # open /preview/
```

The same page in Polish, opening on the finished fight, with no process behind it. What is worth
driving there and nowhere else: that the panel appears at all under a path of its own — an absolute
`src` works everywhere except a deployment — and that the console is empty, which is where a decoy
answered with HTML and a reload stream reconnecting to nothing would both show.
