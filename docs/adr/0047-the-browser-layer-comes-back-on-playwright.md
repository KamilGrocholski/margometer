# 0047. The browser layer comes back, on Playwright, and asks the machine for its Chrome

- **Status:** Accepted
- **Date:** 2026-09-02

## Context

**ADR 0046** stood a browser suite up on `jsr:@astral/astral` and then measured it. Eight defects
were injected into `src/` one at a time: the gate caught eight, the browser suite caught seven, and
**no defect was found that only the browser caught**. That measurement was honest and the suite was
deleted on it — the tree in front of this record has no `tests/e2e/` at all, no `e2e` task, no
**W9**, and 0046 marked as no longer binding.

What the measurement asked was whether a browser catches a defect a unit test misses. What it did
not ask is how much of the panel anything presses. The suite it measured was fifteen hand-written
tests and a crawl of the rows. The panel is three levels deep across twelve screens, and beside the
rows it has: a bar that is a drag handle along part of its length and controls along the rest, a
hover card the pointer opens and a redraw takes away, one region that scrolls and must not hand the
turn to the page behind it, a file it hands to the browser as an object URL it revokes on the next
macrotask, a fold, a shelf of kept fights with three places to keep them, and four things that
survive a reload. None of that was pressed. `deno task check` cannot press it:
`tests/fake-document.ts` has no layout, no pointer, no storage and no download, and its own docblock
records the round it spent green over a panel that could never have worked on a page.

Measured 2026-09-02 on Chrome 152.0.7977.64: the whole suite below is 76 tests in 40 s over six
workers, and the deep crawl inside it is 37 s of that.

## Decision

The browser layer is **`deno task e2e`**, and it is `@playwright/test` under `tests/e2e/`. It is not
part of `deno task check`: the gate asks for no browser and stays runnable on a machine with none.
CI runs both, in two jobs; `docs/releasing.md` names both; **W9** says a change under `src/` is not
done until the second is green.

**It drives the built file.** `tests/e2e/build-once.ts` shells out to `deno task build` once a run
and the suite serves what that wrote. This is the one claim 0046's measurement left standing —
nothing else in the tree runs the file a reader installs.

**It presses everything, twice over.** Named tests for each thing a reader does: a drag by the bar
and by every element on it, at every edge of the window; every tab in all four strips; the rows that
open a level and the two ways back out; the card the pointer opens, keeps and loses; the one region
that scrolls; the fold; the shelf, its pins and its three stores; the file the browser really takes;
what a reload finds waiting and what it does not; and what the panel says before a fight, during
one, at its end and when the next begins. And beside them the crawl from 0046, ported: every control
on every screen, opened, walked and closed behind, with the way back landing on the markup it left,
character for character. A written test asserts a state somebody thought of; nobody thinks of the
state reached by opening the third row of the second level of the fourth screen and stepping back
twice.

**Nothing said and nothing thrown is asserted for every test in the suite**, by a fixture that runs
whether a test asks for it or not. That is `PRODUCT.md`'s fourth pillar, and it had no guard.

**The browser is the one this machine has** — `channel: "chrome"`, or whatever `MARGOMETER_BROWSER`
names — and never one Playwright downloaded. `docs/browser-support.md` takes its measurements on the
engine the game's readers run, and a bundled Chromium is a different build. A machine with none
fails loudly rather than running nothing.

**The suite stands up its own page** rather than reusing `tools/preview-page.ts`, which replaces
`localStorage` with a forgetting store and appends its script after the bundle has run. Both are
right for a published preview and fatal here. The cost is a second stub spelling the client's own
names, which is **N13**, so `tests/repository/game-vocabulary.test.ts` holds the two stubs to one
vocabulary. There is no server: requests are answered from memory on a real origin, which is what
`localStorage` needs, and a browser context per test is what makes the store fresh.

## The measurement

0046's question, asked again of this suite. Nine defects were injected into `src/` and `tools/` one
at a time, each restored from a copy before the next, and both suites run against each. Measured
2026-09-02, Chrome 152.0.7977.64.

| injected                                        | gate  | browser                             |
| ----------------------------------------------- | ----- | ----------------------------------- |
| the listener is handed the host, not the press  | red   | 27 tests over 11 of the 12 files    |
| the stylesheet is appended outside the root     | red   | 9 — drag, scroll, states, tip       |
| **the settings go to memory, not the store**    | green | 8 — drag, fold, reload, shelf, tabs |
| any child of the bar starts a drag              | red   | 31 — drag, crawl                    |
| the place is never clamped to the window        | red   | 1 — drag                            |
| **the object URL is released before the click** | green | 3 — save                            |
| the build does not stamp its version            | red   | 3 — boot, save                      |
| the way back pops two rungs at once             | red   | 2 — drill, crawl                    |
| a leaving of any element closes the card        | red   | 1 — tip                             |

**Two of the nine are caught only in a browser**, and they are not the ones a list would have
guessed. Both are things 0046 named as unheld and could not then demonstrate: a store that forgets
is a `Map` to `tests/fake-document.ts` and a real refusal to `localStorage`, and a file handed over
is an object URL a browser either takes or does not. Neither has anything to fail in the gate. That
is the answer 0046's eight-defect run came back without, and it is why this record is not a repeat
of it.

The sweep also lit three things about the suite itself, which is what **W4** is for. `deno check`
with no argument does not reach a `.spec.ts` — nothing imports one — so a spec calling a constant
nobody declared typechecked clean and failed in the browser; `deno task check` now names `tests/e2e`
a second time. One injected defect turned out to be unreachable rather than uncaught: the way back
cannot have a pair and a part open at once, so clearing both is no defect at all, and it was
replaced by one that is. And the card's test could not tell a listener that reads `relatedTarget`
from one that hides on anything, because a real crossing delivers a move after the leaving and the
move reopens the card — so the leaving is now delivered on its own, in the one place in the suite
that dispatches an event.

## Consequences

Easy: a browser truth becomes assertable. A regression in a drag, in the card, in the scroller, in
what a reload remembers, in the file handed over, or in the promise not to throw into the game now
has somewhere to fail before a person opens a page.

Hard: **this repository now has a `package.json`**, where it had seven `@std` packages and nothing
else. Two toolchains, two lockfiles, and `deno check` reads the suite through the `node_modules` npm
installed — so a fresh clone runs `npm ci` before the gate typechecks, and `deno.json` says
`"nodeModulesDir": "manual"` for that reason. Two commands where there was one, and **W1** no longer
covers everything; a contributor is told by **W9** rather than by the gate.

Owed: `@playwright/test` is watched like any dependency, and a version of it that moves under this
repository is this repository's problem. The suite is bounded the way the rest is — a stated maximum
on the crawl's presses, an assertion at it, and a browser found rather than fetched.

## Alternatives

**`jsr:@astral/astral` again**, which is what 0046 drove and the only browser driver on the Deno
side: no npm, one runtime, one runner, and the tests would import `tests/recorded-fight.ts` and
`tools/build-userscript.ts` directly. Rejected on four things this suite leans on and it does not
have. It has no download API, so the file handed over goes back to a wrapped `Blob` and the claim
stops being that a reader ends up with a file. It has no clock, so the minute-long attach poll is
waited out rather than run out — measured here, that one test goes from 1.9 s to 1.0 m. Its
`querySelector` does not pierce a shadow root, so every reading becomes a string in `evaluate`,
which is what the deleted suite carried. And it has no browser context, so a fresh store per test is
a browser launch plus the profile-removal retry loop `browser-host.ts` needed because Chrome does
not let go of a profile when it closes. The price paid instead is the `package.json` above, and it
is the larger of the two costs in every way except the one that matters here.

**Inside `deno task check`.** One command, no second thing to remember. Rejected because the gate is
the one command this repository asks a contributor to run, and a gate that cannot go green without
an installed browser stops being that.

**Skipped where no browser is found.** Rejected outright. `documents.test.ts` proves every reader on
a sample it must flag and one it must not, precisely because a guard that stops finding its subject
goes green. A suite that passes by not running is that failure with a friendlier name.

**Chrome DevTools Protocol by hand.** No dependency, and about 250 lines of protocol this repository
would then own. Rejected in 0046 already, on **C17**: the dependency is the smaller thing to
maintain.

**One-shot `--headless=new --dump-dom`,** extending what `tools/panel-screenshots.ts` does. Rejected
because it loads the page once and reads it once: no reload, so no persistence claim; no console
after `load`; and no real input, so the drag, the wheel and the hover stay untestable.
