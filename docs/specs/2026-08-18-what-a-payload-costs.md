# What a payload costs

Status: implemented

## What was wrong

`src/game/battle-session.ts` carries figures nothing can take again. Reading
every message of a fight on every payload cost 4 ms on the worst payload of a
603-message recording and 39 ms at 6 030, and 13.7 s across that one fight;
keeping the events brought the worst payload to 4.3 ms. Those numbers are the
reason the append path exists, and they were taken by hand, once, and written
into a comment.

The same docblock says the fold beside them has never been measured at all. So
one side of a trade had a number and the other had an adjective, and the
instruction "measure before changing it" pointed at nothing a person could run.

Nothing in `libs/`, `src/` or `tools/` spelled `performance.now`, `Date.now` for
a duration, or held a counter. The gate cannot see a panel and could not see a
millisecond either.

Beside it in the maintainer's list: the panel does not always respond
immediately to dragging, changing tabs, drilling in and going back. That is a
claim about latency with no instrument pointed at it.

## What was decided

**Two surfaces, because there are two questions.**

`tools/payload-cost.ts` replays every recording through the live per-payload
path — `composeNextSession`, `composeFightReading`, `composePanelView` — and
prints what each phase cost, as the median of several runs after a discarded
warm-up. It is repeatable, it runs in the gate's own language, and it measures
everything a browser is not needed for. It says so in its own heading rather
than letting a total read as the whole cost.

A **development build** carries the rest. `bun run build:dev` writes
`dist/margometer.dev.user.js`, which draws a table in the corner of the page:
what a payload cost, what a gesture cost, what a drag cost, and the parts of
each. That is where the DOM, the game's own dictionary and the hand on the mouse
are.

**The names are shared and written once.** `src/cost-phases.ts` holds them, and
the terminal report and the overlay both read it. A whole (`payload`, `gesture`,
`drag`) contains its parts (`session`, `capture`, `reading`, `view`, `dom`), and
nothing adds the two together.

**The build swaps a module; it does not branch.** `src/userscript-instrument.ts`
is a pass-through and a no-op. `build.ts --dev` resolves that one specifier to
`src/userscript-instrument-development.ts`, which holds the recorder and draws
the overlay. The production bundle therefore never reaches the recorder, the
overlay or the clock, and `tests/tools/userscript-development.test.ts` checks
that over the built text rather than over the intention.

**`core` keeps no clock.** Nothing under `src/core/` is instrumented, and neither
is `src/game/battle-session.ts` — both are documented as checkable without an
engine, a browser or a clock. The split that matters survives: `session` is the
decoding and `reading` is the fold. Per-function detail is the offline tool's,
where wrapping anything costs nothing anybody installs.

**`src/ui/` is handed a function, not a vocabulary.** The drag is the one phase
inside the panel, and §9.1 forbids that layer reaching for the seam or the phase
names. `PanelPlacement.getTimedResult` takes no name: the caller arrives with one
already bound, so the panel knows neither what a phase is called nor that a clock
exists.

**The overlay says what it cannot know.** Firefox offers no heap figure at all,
so the heap line reads "not offered by this browser" rather than a zero — §9.6
keeps unknown and zero apart on screen and not only in the data. Firefox also
rounds `performance.now` to whole milliseconds, which is a limit on the reading
rather than on the code: it is recorded where the drawing is, so a `worst ms` of
1.0 is not read as a millisecond.

**No telemetry, and nothing new to enforce it.** Every figure is drawn on the
machine that took it. `[NEVER] [game]` already forbids the userscript sending
anything, and `tests/tools/source-layout.test.ts` already holds it.

## Rejected alternatives

**A build-time flag and a dead branch.** Tried first, and it does not work: Bun
substitutes a `define` and leaves the branch. Measured on 1.3.14 with
`minify: false`, a flag defined as `false` arrives as `var flag = false`, the
`if (flag)` under it survives verbatim, and so does every module the branch
imports. The recorder, the overlay and `performance.now` would all have shipped
inside the file people install, switched off.

**A sampling profiler instead of named spans.** The bundle is unminified, so a
browser's own profiler keeps every function name and would give a deeper picture
than eight phases. It was turned down because it answers a different question:
a profile is something a person reads once in a devtools panel, and what the
maintainer's list asks for is a figure that can be taken again next month and
compared. Nothing stops both — a profiler still works on this build.

**A cost screen inside the panel.** Nearest to hand, and it would have put a
developer's table of English phase names inside a panel that speaks Polish to a
player (§3) and is swept screen by screen by `tests/ui/panel-view.test.ts`. Its
own host outside the panel is excused from neither rule; it simply is not the
panel.

**Instrumenting `src/core/`.** It would have given the decode and the fold their
own rows in the browser. It also puts a clock inside the layer whose whole
promise is that it can be checked without one, and the offline tool already
calls both functions directly.

**Measuring the heap offline.** `Bun.gc(true)` around a replay reported 0 KiB on
the short recordings and −375 KiB on `2026-08-06-tempest-grupa-vs-hildur` in the
same run: the session is smaller than the noise of the method. A zero printed
from that would be exactly the substitution §9.3 forbids. What the report counts
instead is exact — messages, events and characters the finished session holds.

**One userscript with the overlay behind a run-time switch.** It would have meant
one file to install. It also means shipping the recorder to every player and
asking them to trust a switch, when the same thing is had by building a second
file that says `MargoMeter (dev)` in its name and never polls for an update.
