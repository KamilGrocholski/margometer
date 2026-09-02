# 0046. The browser layer is a suite of its own, and it brings a driver

- **Status:** Superseded by 0047
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

⚠️ **That list above reads better than it measures, and the measurement is why this record says what
it says.** Fifteen browser tests were written against it first, then six defects were injected into
`src/` one at a time — the root listener moved to the host, the stylesheet appended outside the
shadow root, the store writing to memory, the wrapper dropping the game's return value, the build
not stamping its version, a semicolon lost between two declarations of the concatenated sheet. The
existing gate reddened on **all six**; the fifteen browser tests caught nothing it did not. Two of
the list's claims were simply stale: the historical retargeting bug is now prevented by the type
rather than by the fake, because `PanelElement` carries no `addEventListener` at all, and the sheet
is reached by `tests/ui/panel-look.test.ts` more closely than a computed style reaches it.

What survives that measurement is narrow and real: nothing runs the **built file**, and no source
mutation can demonstrate the gap because `deno bundle` does not emit broken JavaScript from valid
TypeScript — the risk is a toolchain moving, not a line changing. That alone would not have been
worth a dependency. What made it worth one is the crawl in the Decision below, which asks a
different kind of question.

Measured 2026-09-01 on Chrome 152.0.7977.64: one `--headless=new` run of a trivial page is 0.46 s
wall, and a press inside the panel is 0.61 ms.

## Decision

The browser layer is **`deno task e2e`**, a suite of its own under `tests/e2e/`, and it is not part
of `deno task check`. The gate asks for no browser and stays runnable on a machine with none;
`--ignore=tests/e2e` in `deno.json` is where that is spelled. CI runs both, `docs/releasing.md`
names both, and **W9** says a change under `src/` is not done until the second is green as well.

**It presses everything the panel draws.** Not a list of browser truths somebody sat down and
enumerated — a crawl: every screen, every control on it, every level under that, each opened and
closed behind, with the panel held to the same invariants at every stop. Nothing thrown, nothing
said, no region given way, no row reading `undefined`, and a way back that lands exactly where it
left, character for character.

That last invariant is the reason the crawl earns its place where an enumerated suite did not.
Measured 2026-09-01 before this was written: of six defects injected into `src/`, the existing gate
caught **all six**, and a suite of fifteen hand-written browser tests caught nothing it did not. A
written test asserts a state somebody thought of. Nobody thinks of the state reached by opening the
third row of the second level of the fourth screen and stepping back twice, and that is where the
crawl looks. What it cannot do is judge whether what was drawn is _right_ — it holds the panel
standing and honest, not correct.

The state space is measured rather than assumed. One recording, one screen: 84 controls on the first
level, 3038 on the second, **zero** on the third, 6244 presses in 3.8 s at 0.61 ms a press, which is
the panel redrawing itself. Twelve screens of that is a minute, and the whole corpus at that depth
would be twenty — so one recording is crawled to the bottom and all of them are crawled to the first
level.

Two claims of other documents are now held in a browser rather than taken: `docs/drill-levels.md`'s
third level is the last, held by there being nothing on it to press; and **ADR 0034**'s every row
with a level under it opens, held by no press anywhere changing nothing.

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
