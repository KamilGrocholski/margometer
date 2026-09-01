# 0043. A failure at a handover has nobody to catch it

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

The proposal on the table was "every asynchronous call is wrapped in a `try`/`catch`, the ones that
throw included". Measured over `2211278` on 2026-09-01, the scope it names is empty where the stakes
are highest and already decided where it is not.

- **`src/`, `libs/` and `project/` carry no `async`, `await`, `Promise` or `.then` at all.** Every
  asynchronous call in this repository is in `tools/` — six files — and in `Deno.test`.
- **In `tools/` the rule would undo a decision already made.** There are 40 calls to `Deno`'s file
  system there and 13 `try` blocks. `Deno.readTextFileSync` in `tools/declared-version.ts` throwing
  `NotFound` reaches the process boundary, which prints the failure with the line that raised it and
  exits non-zero — read by whoever ran it and by CI. That is **E7**, and a hand-written `catch`
  there prints less unless it adds context, which **E6** already governs.

The hazard the proposal is reaching for is real, and it is not asynchrony. It is **a throw that
unwinds into a loop this project does not run** — an event listener, a clock's step, a promise's
continuation. There is nobody there to read it. Five places had one:

- **`src/game/engine-attachment.ts`** — `readBattleFromPage` reaching a field of the game's own
  object, and the bound on looks. It lands in the browser's timer, which drops it and fires again in
  250ms: **four reports a second for as long as the page is open.**
- **`src/ui/panel-element.ts`, four root listeners** — the press path to `writeTextToFile`: a `Blob`
  over a recording of hundreds of kilobytes, `createObjectURL`, and `click()`, which the
  `try`/`finally` there cleans up after and rethrows. The panel looks untouched, no file arrives,
  and no mark reaches anybody.
- **`src/userscript-entry.ts`** — `revokeObjectURL` in a `setTimeout` step, landing the same way.
- **`tools/preview-server.ts`** — `void readFileEvents(watcher, state)`: an unhandled rejection
  while the server keeps serving.
- **`tools/preview-server.ts`** — `void preview.stop().then(() => Deno.exit(0))`: a rejected
  shutdown never reaches `Deno.exit`, so Ctrl+C hangs on a server that has stopped answering.

Two further things were true of that list. **A7** says a failed assertion becomes state at the
nearest boundary, and in the three `src/` places the nearest boundary was the browser's dispatch —
so **A7** did not hold where it was most needed. And the answer was already written down 60 lines
from one of them: `setGuarded` in `src/ui/panel-drag.ts` wraps all four of its listeners and catches
the pointer capture apart from them, with the reason beside it. Three handovers did this and three
did not.

**E5** was already short a row. It enumerates four boundaries and calls a fifth `[ASK]`, and
`panel-drag.ts` has held a broad catch at an unlisted one — the browser calling a listener of ours —
since it was written.

## Decision

**A failure is handled where somebody can read it, and the process boundary is one such place.** So
the blanket wrap is refused and the hazard is named instead. Three rules join `AGENTS.md`, and
**E5** gains its fifth row: a callback somebody else calls, inbound, where a failure becomes that
gesture dropped and marked once.

- **E12.** Every callback handed to an API this project did not author is guarded at the handover.
- **E13.** A promise is awaited, or handed a rejection handler in the same statement; `void` on a
  call that answers one discards a failure, not a value. The one exception is the top-level
  `if (import.meta.main)` block, where **E7**'s loud throw is the mark.
- **S13.** What the bundle carries is synchronous.

**S13 states a property the tree already had rather than one it has to reach.** It is here because
**E5**'s inbound boundary is the wrapped engine call, taken from the game's own stack: a promise
there answers the game before the fight is read, and the `try` around a synchronous call catches no
rejection arriving after it. Undoing it — storage that only answers asynchronously, say — is a
decision, and a later ADR is where it belongs.

## Consequences

- **The five places were converted in the commit the rules landed in**, because a rule stated over a
  tree that breaks it is a wish (**ADR 0042**). A look that threw is still a look, so the search in
  `engine-attachment.ts` runs out where a search finding nothing runs out, and the page stops paying
  for it; the first failure is reported once, the rest are held (**E11**).
- **`src/ui/panel-listener.ts` is the second consumer of the guard `panel-drag.ts` had alone**, so
  it became a module of its own (**C9**). The drag keeps its own clearing of the grab, because a
  grab left standing moves the panel under the next pointer that crosses it.
- **`dist/margometer.user.js` grew 1,215 bytes**, 307,908 to 309,123, measured 2026-09-01 either
  side of the conversion. Guards ship: **A5** keeps assertions in the build and this keeps the `try`
  around them. The figure is the cost of the decision, not a budget.
- **Three guards, and each proved on the tree.** `tests/repository/errors.test.ts` reads `src/` for
  a handover whose function does not open on a `try`, and `tools/` for a `void` over a call with no
  rejection handler; `tests/repository/sources.test.ts` reads what the bundle carries for the four
  spellings of asynchrony. Removing the `try` from `panel-listener.ts`, the rejection handler from
  `preview-server.ts` and adding an `async` to `src/game/engine-place.ts` each lit the guard that
  covers it, naming the line.
- **The guards read less than the rules bind, and `ARCHITECTURE.md` says so.** **E12**'s reader
  knows a fixed list of handover spellings and does not read `tools/`, where a failure in a
  `Deno.serve` handler still becomes a 500 and a log line that somebody reads.

## Alternatives

**A `try`/`catch` around every `await` and every call that can throw.** Rejected on what it would
cost and what it would not buy: it collides with **E7**, needs a fifth kind of boundary in **E5**'s
table for `tools/`, and would turn 40 loud file-system failures into 40 quiet ones whose `catch`
could only print less than the process boundary already prints. It also finds none of the three
failures in `src/`, which are synchronous.

**A global `unhandledrejection` listener instead of E13.** Rejected: the add-on shares a page and a
console with the game and with whatever else is installed, so a global listener catches rejections
that are not ours and signs them with our brand — the opposite of what **E1** is for.

**Leaving E5 at four boundaries.** Rejected: `panel-drag.ts` has held a broad catch at the fifth
since it was written, and an unlisted broad catch is what **E5** says is indistinguishable from a
swallowed bug.

**Stopping the search on its first failure.** Rejected: a getter on the game's object that refuses
once during load would disable the add-on for that page for good. The bound that already existed —
240 looks, a minute — is the honest one, and a look that threw spends one.
