# The browser suite

This directory is the only part of the repository that Deno does not run. It is `@playwright/test`,
on Node, driving the built userscript in the Chrome this machine has — `develop ADR 0047`. Three
files are run by Deno as well: `game-page.ts`, the page itself, which `deno task preview` and
`deno task preview:site` serve and so imports nothing at all; and `panel-camera.ts` with the
`panel-page.ts` under it, which `deno task panel:shots` drives Chrome through, since Playwright is
this directory's to import. None of the three calls a `Deno` API.

The root's rules apply in full and are not repeated. What follows is only what is true here.

## Relaxed from the root

- **Assertions come from `@playwright/test`, not `@std/assert`** — **A6**'s exception, and the
  reason is the runtime: nothing here runs under Deno, so `jsr:` is not reachable. `expect` is what
  a failure is read through, and the message names the invariant the way **A4** asks.
- **A file is `*.spec.ts`, never `*.test.ts`.** `deno test -A` in the gate discovers the latter, and
  the extension is the whole of what keeps the gate from trying to run a Node suite.
- **Node's `node:` modules and `@playwright/test` are imported by their own names** — **C8**'s
  exception, held by `tests/repository/import-paths.test.ts`. Everything of ours is still `./` or
  `#/`, which Node resolves through the `imports` of `package.json`.
- `!` is permitted, as everywhere under `tests/`.

## Always

- **No `Deno` API.** A file here is read by Playwright's loader and by `deno check`, and only the
  second of those has one. `node:` modules and `#/`-rooted imports are what reach across.
- **A reading of the page waits for a frame first** (`waitForFrame`, in `panel-page.ts`). The panel
  draws once a frame (`docs/design.md` §10.4), so a reading taken straight after a gesture or a
  payload reads the panel as it stood before them. A locator's `expect` retries and needs none.
- **The recordings are read off `captures/`**, at `RECORDINGS_DIRECTORY` in
  `tests/recording-sources.ts`, as the Deno suites read them.
- **A gesture goes through the browser's own pointer.** `page.mouse`, `locator.click`,
  `locator.hover` — never a dispatched `PointerEvent`. `setPointerCapture` throws for a pointerId no
  real pointer owns and the guarded handler swallows the gesture, so a synthetic drag reports a
  panel that cannot be moved as one nobody moved. The crawl is the one exception, and it dispatches
  because it presses thousands of times inside the page rather than from out here. For the same
  reason it flushes the page's frames after each press rather than waiting for one, which is its
  second exception.
- **A reading the browser animates is polled, not taken once.** A wheel turn is not finished when
  `mouse.wheel` answers.
- **The suite takes its worker count from free memory, not from the cores.** One worker peaks at
  3266 MB across a whole run (measured 2026-09-22, sampling every Chrome process once a second; the
  deepest crawl alone reads 2052, which is the figure that underbudgets it), and Playwright's own
  default is half the cores — six on that machine, against 3 GB available. Five crawls were killed
  mid-`evaluate`, each reporting `Channel closed` and
  `Target page, context or browser has been closed`. `playwright.config.ts` now divides what the
  kernel says is available, keeps a gigabyte back for whoever is using the machine, and never
  exceeds what the cores would have allowed. `MARGOMETER_E2E_WORKERS` overrides it.
- **`Channel closed` is the one failure here that says nothing about the panel.** It is a browser
  that died, not an `expect` that fell. **The observation that tells the two apart is which tests
  fail**: a regression fails the same ones every run, and a machine out of memory fails a different
  set each time, with no `expect` among them.
