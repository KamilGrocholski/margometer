---
name: verify
description: Run the built userscript against a captured fight in a real browser and see what the panel draws. Use when verifying a change to src/ at its actual surface rather than through tests.
---

# Verifying MargoMeter by running it

The add-on's surface is a browser page. `deno task check` is not that surface: it typechecks, runs
the suite and builds the bundle, and every one of those can be green while the panel is broken.

**`deno task e2e` is part of that surface and is not part of the gate** (`develop ADR 0047`). It
drives the built file in the Chrome this machine has: the bundle running, a drag by a real pointer,
the card a pointer opens, the file the browser really takes, storage across a real reload, and every
control on every screen pressed. Run it before calling a change to `src/` done (**W9**). What it
does not cover is whether a state is _reachable_, and whether what was drawn is what a person wanted
to see.

## The server

```bash
deno task preview        # http://127.0.0.1:8000/
```

The index lists every recording under `captures/`. `/fight/<name>?through=<n>` opens the page the
browser suite drives (`tests/e2e/game-page.ts`) with the fight fed `n` calls in, the whole fight
where `n` is missing or out of range. A strip at the bottom left steps it: `+1`, `+10`, `all`,
`restart`, and the counter writes `through` back into the address.

A change under `src/`, `libs/` or `frozen/` rebuilds and reloads every open page where it was. A
rebuild that **fails** does not reload: the strip prints the bundler's first line and the last good
bundle stays up. `tools/` and `tests/` are not watched, so editing the server or the page means
restarting it.

## The published page

```bash
deno task preview:site             # dist/preview/, marked -dev
deno task preview:site --release   # the number deno.json declares
```

The same page in Polish, with the install band, opening on the finished fight. Serve it **under a
path of its own**, as Pages does (`/margometer/`): an absolute `src` works everywhere except a
deployment. Then check the panel appears, the windows stand clear of the band, and the console is
empty.

## The screenshots

```bash
deno task panel:shots             # marked -dev
deno task panel:shots --release   # a release, and only a release
```

Six pictures into `screenshots/` with `taken-at.json` beside them. It refuses while `src/` carries
anything no commit holds, and a failed run leaves the previous set alone. Open every one: no machine
can say whether the state in a picture is reachable.

## Reading the panel back out

`document.getElementById("MargoMeter-Panel")`: every element the add-on puts in the page is named
that way. The shadow root is open, so `.shadowRoot.querySelector(…)` reaches inside.

| Selector                                                     | What it is                        |
| ------------------------------------------------------------ | --------------------------------- |
| `.row`, `.row-rank`, `.row-name`, `.row-value`, `.row-share` | a ranking row and its parts       |
| `.row-time`, `.row-size`, `.row-pin`                         | a shelf row's own cells           |
| `.bar`, `.bar-cap`                                           | the bar behind a row              |
| `.crumb`, `.crumb-back`, `.crumb-here`                       | the breadcrumb over an opened row |
| `.list`, `.empty`, `.pinned-region`, `.section-heading`      | the list and what stands in it    |
| `.sides`, `.sides-label`, `.sides-track`                     | the totals under the list         |
| `.undrawn`                                                   | a region that threw               |
| `.titlebar-version`, `[data-save]`                           | the version, `⭳` save             |
| `.titlebar-fights`, `.titlebar-button`                       | the shelf, and folding the panel  |

Presses and hovers are addressed by attribute: `[data-screen]`, `[data-side]`, `[data-row]`,
`[data-shelf]`, `[data-pin]`, `[data-tip]`, `[data-storage]`.

## Gotchas paid for

- **`pointerdown`, not `click`.** The panel listens for the press, because a payload landing between
  a press and a release detaches the pressed node. `node.click()` fires nothing at all.
- **A synthetic `PointerEvent` aborts a drag.** `setPointerCapture` throws for a pointerId no real
  pointer owns, and the guarded handler swallows the whole drag. Drive the mouse through the
  browser, as `deno task e2e` does.
- **The panel draws once a frame** (`docs/design.md` §10.4), so a reading taken straight after a
  press reads the panel as it stood before it. Wait for a frame first.
- **The world reads as the first label of the hostname**, `127` on the server. Correct behaviour,
  not a fault to chase.
- **The build script is a decoy.** `main.min<build>.js` is answered empty: only its `src` is read,
  for the build id a saved recording names.
