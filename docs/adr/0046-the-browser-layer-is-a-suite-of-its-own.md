# 0046. The browser layer is a suite of its own, and it brings a driver

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

The suite covers the pipeline end to end already. `tests/userscript-entry.test.ts` drives every
layer at once over real recordings — the wrapped engine method fed one payload at a time, the drawn
panel read back and pressed. `tests/ui/panel-element.test.ts` and `tests/ui/panel-reading.test.ts`
cover the drawing. `tests/tools/fight-replay.test.ts` runs the decoder two ways and compares.

Every one of them draws into `tests/fake-document.ts`, and that fake has been wrong once. Its own
docblock carries the finding: it offered a listener on the host as well as on the shadow root,
handed that listener the pressed element, and so let a panel that could never work on a page pass
every test. It was found by `deno task preview` — by a person opening a browser — and not by the
gate.

What that leaves unheld is a list, not a feeling. Nothing in the tree runs the **built file**: every
test imports TypeScript modules, so a bundle a browser refuses, a banner that broke the first
statement, or a top-level construct past the floor has nothing to fail. Nothing resolves CSS:
`tests/ui/panel-look.test.ts` does arithmetic over the token values, which is a different claim from
the engine having applied them inside a shadow root. Nothing drives real input: the `verify` skill
records that a synthetic `PointerEvent` makes `setPointerCapture` throw for a pointerId no real
pointer owns, and the guarded handler then swallows the whole drag — a trap invisible to the fake
and to `deno task screenshots` alike. Nothing uses real storage: "the position survived a reload"
rests today on a `Map` that cannot refuse and is never cleared between documents. And nothing
asserts `PRODUCT.md`'s fourth pillar — that the panel never costs the reader an exception — because
there has been no console to read.

The one real-browser step in the tree, `deno task screenshots`, is manual, deliberately outside the
gate, and photographs rather than asserts.

Measured 2026-09-01 on Chrome 152.0.7977.64: one `--headless=new` run of a trivial page is 0.46 s
wall. The three tests this decision lands with, bundle build included, take 3 s.

## Decision

The browser layer is **`deno task e2e`**, a suite of its own under `tests/e2e/`, and it is not part
of `deno task check`. The gate asks for no browser and stays runnable on a machine with none;
`--ignore=tests/e2e` in `deno.json` is where that is spelled. CI runs both, `docs/releasing.md`
names both, and **W9** says a change under `src/` is not done until the second is green as well.

It asserts **only what a fake document cannot**: the built file running, a press retargeted by a
real shadow root, the sheet as an engine resolves it, real input, real storage, and a fight reaching
the end of a page with the console shut. It does not re-drive tabs, drills, cards or the shelf —
`tests/userscript-entry.test.ts` owns those and keeps them.

It is driven by `jsr:@astral/astral`, and that is a dependency where the four `@std` packages were
the whole of what this repository had. It is launched with `path` pointing at the Chrome
`tools/installed-browser.ts` finds, never one downloaded, and a machine with none is refused loudly.
Nothing under `src/` may import it; `tools/build-userscript.ts` reads the built file for a way out
regardless, so the ban is held rather than promised.

The suite stands up its **own page** rather than reusing `tools/preview-page.ts`. That page replaces
`localStorage` and `sessionStorage` with a forgetting store so a published preview leaves nothing
behind, and appends its script after the bundle has run. Both are right for the preview and fatal
here. The cost is a second stub spelling the client's own names, which is **N13**, so
`tests/repository/game-vocabulary.test.ts` holds the two stubs to one vocabulary.

## Consequences

Easy: a browser truth becomes assertable. A regression in retargeting, in the sheet, in a drag, in
persistence or in the promise not to throw into the game now has somewhere to fail before a person
opens a page.

Hard: two commands where there was one, and **W1** no longer covers everything. A contributor is
told by **W9** rather than by the gate, which is a rule held by reading until CI catches it.

Owed: `@astral/astral` is now watched like any dependency — it pulls `@deno/graph` and `@std/io`
transitively, and a version of it that moves under this repository is this repository's problem. The
suite is bounded in the same way the rest is: a bounded wait, an assertion at its end, and a browser
found rather than fetched.

## Alternatives

**Inside `deno task check`.** One command, no second thing to remember, and CI needs no step —
`ubuntu-latest` ships Chrome. Rejected because the gate is the one command this repository asks a
contributor to run, and a gate that cannot go green without an installed browser stops being that.

**Skipped where no browser is found.** Rejected outright. `documents.test.ts` proves every reader on
a sample it must flag and one it must not, precisely because a guard that stops finding its subject
goes green. A suite that passes by not running is that failure with a friendlier name.

**Chrome DevTools Protocol by hand,** over `--remote-debugging-port` and Deno's own WebSocket. No
dependency, and about 250 lines of protocol this repository would then own, including a version that
moves under it. Rejected: the dependency is the smaller thing to maintain, and **C17** asks the
library first.

**One-shot `--headless=new --dump-dom`,** extending what `tools/panel-screenshots.ts` already does —
zero new dependencies, and the machinery is written. Rejected because it loads the page once and
reads it once: no reload, so no persistence claim; no console after `load`; and no real input, so
the drag stays untestable. Three of the six things this suite exists for.
