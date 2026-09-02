# The browser suite

This directory is the only part of the repository that Deno does not run. It is `@playwright/test`,
on Node, driving the built userscript in the Chrome this machine has — **ADR 0047**.

The root's rules apply in full and are not repeated. What follows is only what is true here.

## Relaxed from the root

- **Assertions come from `@playwright/test`, not `@std/assert`** — **A6**'s exception, and the
  reason is the runtime: nothing here runs under Deno, so `jsr:` is not reachable. `expect` is what
  a failure is read through, and the message names the invariant the way **A4** asks.
- **A file is `*.spec.ts`, never `*.test.ts`.** `deno test -A` in the gate discovers the latter, and
  the extension is the whole of what keeps the gate from trying to run a Node suite.
- `!` is permitted, as everywhere under `tests/`.

## Always

- **No `Deno` API.** A file here is read by Playwright's loader and by `deno check`, and only the
  second of those has one. `node:` modules and `@/`-rooted imports are what reach across.
- **A gesture goes through the browser's own pointer.** `page.mouse`, `locator.click`,
  `locator.hover` — never a dispatched `PointerEvent`. `setPointerCapture` throws for a pointerId no
  real pointer owns and the guarded handler swallows the gesture, so a synthetic drag reports a
  panel that cannot be moved as one nobody moved. The crawl is the one exception, and it dispatches
  because it presses thousands of times inside the page rather than from out here.
- **A reading the browser animates is polled, not taken once.** A wheel turn is not finished when
  `mouse.wheel` answers.
