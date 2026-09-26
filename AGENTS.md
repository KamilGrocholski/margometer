# AI agent instructions

This is MargoMeter as written again from nothing on `rewrite/2026-09`, which replaced `develop` @
`fa1dcce` on 2026-09-25. Its rules are `develop`'s at that commit, rewritten for the design round of
2026-09-24, and its architecture is [`docs/design.md`](docs/design.md)'s. A rule carried over from
`develop` keeps its evidence in `develop`'s decision records, cited as `develop ADR NNNN`. This
tree's own are `docs/adr/`, numbered from 0001 and cited as `ADR NNNN`, and a decision that changes
a rule here writes one.

These instructions apply to every directory unless a closer `AGENTS.md` overrides a rule for its
subtree.

## Authority and required context

Apply instructions in this order:

1. the closest `AGENTS.md` to the file being changed;
2. parent `AGENTS.md` files up to this root;
3. the canonical documents below;
4. `deno lint`, the tests and CI as mechanical enforcement, from the commit that brings them.

A local instruction may strengthen or replace a root rule **only when it states the exception
explicitly**, and it **never restates one**. A nested file repeating a parent rule has a duplicate
that will drift, and a reader cannot tell which copy is current. The same holds between the
canonical documents: **every rule has one owning document**, and the others point at it. A rule
restated in different words is worse than one restated verbatim, because the two drift without ever
looking different. Before deleting a restatement, **read the owner and confirm it says the thing**.

The documents this tree carries:

- [`docs/design.md`](docs/design.md) — layers, ports, types, the process, the failure map, the
  boundaries, the file format, the build order.
- [`PRODUCT.md`](PRODUCT.md) — what the add-on is for.
- [`CONTEXT.md`](CONTEXT.md) — the canonical domain terms.
- [`SECURITY.md`](SECURITY.md) — the game client, the network, stored data and captured material.
- [`DESIGN.md`](DESIGN.md) — the panel's look.
- [`NOTICE.md`](NOTICE.md) — what of somebody else's this repository and its published page hold.
- [`CHANGELOG.md`](CHANGELOG.md) — what a player is told changed, release by release.
- [`docs/releasing.md`](docs/releasing.md) — every step of cutting a release.
- [`docs/browser-support.md`](docs/browser-support.md) — the browser floor and what holds it.
- [`docs/captured-fights.md`](docs/captured-fights.md) — what each recording holds.
- [`docs/drill-levels.md`](docs/drill-levels.md) — which rows of the panel open, level by level.
- [`docs/auras-standing.md`](docs/auras-standing.md) — what stands on a side, whom a shout holds,
  and for how long, re-earned off the recordings.
- [`docs/turns-taken.md`](docs/turns-taken.md) — the turns each combatant took, against the game's
  numbering of them.
- [`docs/reading-a-turn.md`](docs/reading-a-turn.md) — how a message becomes a turn, and where that
  reading and the game disagree.
- [`docs/protocol-keys.md`](docs/protocol-keys.md) — what each protocol key means, and how that is
  known.

A document joins this list in the commit that creates it (**C9**). **`develop:path` and
`develop ADR NNNN` name `develop` as it stood at `fa1dcce`**, before this rewrite replaced it:
`git show fa1dcce:<path>` reads either. What was carried over from there no longer wears the prefix.

**Target is not proof.** `docs/design.md` is a design constraint, not evidence that a feature
exists. Do not describe target behaviour as implemented until code and verification agree.

**Every rule here is meant to be held by a machine.** The register at the end says which guard holds
which rule, and **only guards that exist are in it**. A rule with no guard is held by reading alone.

**A rule names the observation that breaks it.** A rule nobody can be shown to have violated is a
wish, and wishes accumulate. Where the observation cannot be named, the honest form is a measurement
or an `[ASK]`, not a firmer verb.

**A rule states what binds; its evidence lives in its decision record.** A rule that carries its own
argument has a duplicate, and the two drift.

## Structure

The tree, one line per file, and one per directory under `tests/`, `captures/` and `screenshots/`.
What a file is for is its own docblock's to say (**C4**); a line here is the way to it, and a file
joins it in the commit that creates the file.

- `.gitignore` — what git never carries: the built userscript, client sources, npm's installs,
  fabricated fights
- `AGENTS.md` — the rules every change binds to, and the register of the guards that hold them
- `CHANGELOG.md` — what a reader is told changed, release by release, in Polish
- `CLAUDE.md` — points Claude Code at `AGENTS.md`
- `CONTEXT.md` — the canonical domain terms, and the spellings each one forbids
- `DESIGN.md` — the panel's look: its tokens and the rules they satisfy
- `LICENSE` — the MIT licence covering what was written here
- `NOTICE.md` — what in this repository and its published page is somebody else's, and on what basis
- `PRODUCT.md` — what the add-on is for, and what it never does
- `README.en.md` — the English front page: what the add-on is, how it looks, how to install it
- `README.md` — the Polish front page, the counterpart of `README.en.md`
- `SECURITY.md` — the boundaries on the game client, the network, stored data and captured material
- `TODO.md` — the maintainer's hand-kept list; no tool writes it
- `deno.json` — the released version, the tasks (`check` is the gate), formatter, lint and compiler
  settings
- `deno.lock` — the lock of the Deno packages the tree imports
- `package-lock.json` — the lock of the npm packages the browser suite installs
- `package.json` — npm's manifest for the browser suite alone: Playwright and its one task
- `playwright.config.ts` — the browser suite's settings: where it looks, which engine it drives,
  what it leaves

- `.agents/skills/verify/SKILL.md` — the skill for running the built userscript over a recording in
  a real browser

- `.claude/settings.json` — Claude Code's permissions: the deny list that walls off `TODO.md`

- `.github/workflows/check.yml` — the gate on every push and pull request: `deno task check`
- `.github/workflows/pages.yml` — publishes the preview page to GitHub Pages from `main`, after the
  gate
- `.github/workflows/release.yml` — turns a tag into a release carrying the userscript and its
  metadata file

- `docs/auras-standing.md` — what one skill stood on a side, whom a shout held, how long either
  stood, over `captures/`
- `docs/browser-support.md` — the browser floor the shipped userscript needs, measured off the tree
- `docs/captured-fights.md` — what each recording in `captures/` holds: who fought, where, and how
  much protocol
- `docs/design.md` — the architecture: layers, ports, types, the process, the failure map, the file
  format
- `docs/drill-levels.md` — every kind of row the panel draws, and whether pressing it opens anything
- `docs/protocol-keys.md` — every protocol key looked into: its verdict, its shape over the
  recordings, and the evidence
- `docs/reading-a-turn.md` — how a message becomes a turn, and every message where that and the
  game's numbering disagree
- `docs/releasing.md` — every step of cutting a release, in order
- `docs/turns-taken.md` — the turns each combatant took, graded recording by recording against the
  game's numbering

- `docs/adr/0001-a-vocabulary-is-an-object.md` — a closed set of our own strings is an object, its
  list the object's values
- `docs/adr/0002-a-sibling-is-imported-by-dot-and-the-rest-from-the-root.md` — a sibling is imported
  by `./`, everything else from the root by `#/`
- `docs/adr/0003-a-module-reads-top-down-in-tigerbeetles-order.md` — a module reads top-down:
  imports, types, constants, then functions, entry first
- `docs/adr/0004-the-frozen-readings-are-develops-at-the-revision.md` — superseded by ADR 0005:
  `frozen/` pinned to `develop`'s readings
- `docs/adr/0005-the-readings-are-refreshed-here.md` — the readings of the game in `frozen/` are
  refreshed by this tree's own tools
- `docs/adr/0006-an-if-that-does-not-leave-has-an-else.md` — an `if` that does not leave has an
  `else`, and a guard is exempt
- `docs/adr/0007-the-protocol-key-register-is-carried-and-a-help-freeze-counts-what-it-cites.md` —
  `develop`'s key register carried, and the help counts taken from its claims
- `docs/adr/0008-a-failure-is-an-error-returned-beside-the-value.md` — a failure is an `Error` class
  returned beside the value, and `attempt` the one catch
- `docs/adr/0009-a-failure-is-named-for-what-failed-and-how.md` — a failure class is a subject and
  its state, never `…Error`, and `attempt` keeps its name

- `frozen/AGENTS.md` — the rules for the dated readings of the game: written by tooling, never by
  hand
- `frozen/aura-turns.ts` — the skills reaching more than one combatant, and the turns the published
  table gives each
- `frozen/blows-granted.ts` — the skills the published table grants an extra attack, and the fewest
  granted at any level
- `frozen/buff-bits.ts` — the statuses a combatant's `buffs` mask is read by, in bit order, with the
  build id
- `frozen/help-phrases.ts` — counts of phrases in one article of the published help
- `frozen/protocol-keys.ts` — every protocol key the game client branches on, with the build id
- `frozen/skill-durations.ts` — skill ids, effect keys and the turns the published table states for
  each

- `libs/html-text.ts` — markup read as the words a person would have seen in it, by walking the text
- `libs/json-text.ts` — JSON text read into a value and a value written back, each answering whether
  it worked
- `libs/number-range.ts` — a number held between two ends, where the bottom wins when the ends cross
- `libs/number-text.ts` — numbers read out of text by walking it, and written back into it
- `libs/errors.ts` — the one broad catch, `attempt`, and `Caught`, the failure it answers
- `libs/text-walk.ts` — walking text one character at a time against a caller's predicate
- `libs/unknown-value.ts` — reading a value nobody typed, one field at a time, naming our field on
  failure
- `libs/vocabulary.ts` — the vocabulary type, and the check of a string arriving from outside
  against one

- `project/browser-lib.json` — compiler settings that type-check the bundle as a browser program,
  not a Deno one
- `project/browser-lib.lock` — the lock kept apart for that browser type-check

- `src/build-version.ts` — the version the panel and a file state; the build writes over it
- `src/userscript-boot.ts` — the script the userscript runs: the page's window handed to the entry
  as it was found
- `src/userscript-entry.ts` — the add-on standing up: the window read into ports, the tables
  composed, the runtime started

- `src/core/aura-standing.ts` — what one skill put on more than one combatant, how far through it
  is, and whom a shout holds
- `src/core/battle-event.ts` — `BattleEvent`, the data contract the decoder produces and everything
  above it reads
- `src/core/carried-figure.ts` — what a status a combatant carries comes to, where anything may be
  said of it
- `src/core/carried-status.ts` — what each combatant is carrying now, and for how many of their own
  turns
- `src/core/charged-skill.ts` — the charged skill a combatant is making ready, and what became of it
- `src/core/combatant-health.ts` — health read out of the stated share, and side-wide casts sized
  onto each combatant
- `src/core/combatant-roster.ts` — who is in the fight, matching a combatant the protocol names to
  the one it means
- `src/core/fight-decoder.ts` — messages to what happened; a key with no meaning yet leaves the
  message unread
- `src/core/fight-figures.ts` — the figures of one fight, tallied from its view and verified in one
  place
- `src/core/fight-session.ts` — one fight accumulated payload by payload, prepared then committed
  whole
- `src/core/fight-statistics.ts` — the figures a panel draws, raw and applied and unattributed kept
  apart
- `src/core/legendary-standing.ts` — the two legendary bonuses a fighter's tooltip can state: the
  running one and the spent one
- `src/core/protocol-key.ts` — what a protocol key means: the one owner of it
- `src/core/protocol-message.ts` — the grammar of one message: its two ends and its keys, nothing
  about meaning
- `src/core/protocol-number.ts` — the numbers the protocol states, in the shapes it states them in
- `src/core/turn-clock.ts` — whose turn an event opens, the one clock every figure and status counts
  turns on

- `src/game/browser-store.ts` — the store a browser lends, wrapped so a refusal is an answer
- `src/game/engine-battle.ts` — the running fight on the page, and the wrap of the engine's
  `updateData`
- `src/game/engine-place.ts` — where a fight is happening, read off the game client's own state
- `src/game/engine-tooltip.ts` — our rows appended to the tooltip the game client shows for a
  fighter
- `src/game/engine-warrior.ts` — a payload's warrior entries read into the roster's shape, with each
  mask and charge
- `src/game/fight-capture.ts` — the fight as it happened, thinned as it is collected, kept for a
  recording
- `src/game/fight-place.ts` — where a fight was fought: the map's name and the reader's square on it
- `src/game/game-build.ts` — the build id read out of the client bundle's file name
- `src/game/game-dictionary.ts` — asking the running game client what the reader's own copy calls
  something
- `src/game/page-clock.ts` — the page's clock, owning every moment the runtime states
- `src/game/page-console.ts` — the page's console: one branded line per kind of failure
- `src/game/page-file.ts` — hands a file to the browser's downloads, through a blob and an object
  URL
- `src/game/page-frame.ts` — the page's animation frame, the one moment the panel draws, guarded at
  the handover
- `src/game/page-interval.ts` — the page's own timer for a repeating step, guarded at the handover
- `src/game/page-reading.ts` — a reading of the page's own state that came back empty, shown as
  unknown
- `src/game/page-surroundings.ts` — what a recording states about where it was taken: the world and
  the browser
- `src/game/payload-envelope.ts` — one engine call read into a `PayloadRecord`, every bound on it
  checked once
- `src/game/warrior-snapshot.ts` — the combatants the running fight holds, copied for a recording

- `src/runtime/carried-tooltip.ts` — the add-on's rows onto every fighter tooltip, gathered from the
  readers that know them
- `src/runtime/defect-ledger.ts` — what could not be done and how often, counted by kind and undrawn
  region
- `src/runtime/engine-search.ts` — finding the engine and getting the wrap onto it, with an end to
  the search
- `src/runtime/failure-fate.ts` — `FAILURE_FATES`: every failure kind mapped to a fate, held
  complete by the compiler
- `src/runtime/fight-file.ts` — the fight as a file: the engine calls and their figures, in the
  carried-over format
- `src/runtime/fight-handover.ts` — the fight on screen, handed over as a file
- `src/runtime/fight-reading.ts` — the view and figures a panel and a file are drawn from, live or
  replayed from the shelf
- `src/runtime/live-fight.ts` — the fight going on, read one engine call at a time, each step under
  its own guard
- `src/runtime/margometer-runtime.ts` — where the layers meet: settings and shelf opened, engine
  wrapped, drawing per frame
- `src/runtime/opened-reading.ts` — what stands under the rows a reader opened in the drill
- `src/runtime/panel-frame.ts` — the one drawing per frame: tooltips, the window beside the panel,
  then the panel
- `src/runtime/runtime-intent.ts` — one intent executed: the screen moved, shelf and settings
  written, a file handed over
- `src/runtime/screen-intent.ts` — where an intent leaves the panel's screen: pure moves over the
  screen state
- `src/runtime/settings.ts` — what a reader chose about the panel, kept in the store field by field
- `src/runtime/shelf-keeper.ts` — the shelf as the running add-on holds it: fights, store, last
  answer, readings
- `src/runtime/shelf.ts` — the fights a reader can go back to, stored as payloads and never as
  figures

- `src/ui/panel-card.ts` — what a row's card says on demand: every figure a combatant has, at any
  level
- `src/ui/panel-choice.ts` — what a reader chooses about the panel, which the runtime keeps
- `src/ui/panel-document.ts` — the surface the panel asks of a browser's document, declared rather
  than assumed
- `src/ui/panel-drag.ts` — where a window sits, and how a reader moves it by its grip
- `src/ui/panel-element.ts` — the panel, drawn into a document it is handed
- `src/ui/panel-intent.ts` — what the reader asked for, read off the element they pressed
- `src/ui/panel-listener.ts` — the one listener handed to the browser, and the guard on it
- `src/ui/panel-look.ts` — the panel's tokens, the classes its rules select, and the stylesheet
  built from both
- `src/ui/panel-palette.ts` — the colours a reading names: the signal inks and the profession
  palette
- `src/ui/panel-reading.ts` — one screen's worth of a fight: the rows, in the order they are drawn
- `src/ui/panel-screen.ts` — which screen the panel is on, and the questions the strips ask to move
  it
- `src/ui/panel-scroll.ts` — where a reader left the scrolling region, kept per list across redraws
- `src/ui/panel-standing.ts` — what the window beside the panel says: whose turn, what is charging,
  who holds whom
- `src/ui/panel-tip.ts` — the detail window, and the register the drawn rows fill for it
- `src/ui/panel-words.ts` — everything the reader reads: the only Polish in `src/`
- `src/ui/ranked-order.ts` — the order of a ranking, with a tie-break that keeps it stable
- `src/ui/tip-reading.ts` — what a card says, as a shape of figure, sub-line, heading and note
- `src/ui/view-failure.ts` — what the panel could not do, as records the runtime counts

- `tools/aura-lifetime.ts` — how long a status stands on the mask, and whether one lighting goes out
  together: `fight:life`
- `tools/aura-standing.ts` — what stands on a side, whom a shout holds, how many sources stand at
  once: `fight:auras`
- `tools/buff-bit-table.ts` — lifts the statuses the `buffs` mask is read by from the client bundle:
  `game:buffs`
- `tools/build-userscript.ts` — builds the userscript a reader installs, and checks the built text:
  `build`
- `tools/capture-intake.ts` — turns a recording the add-on wrote into material in `captures/`:
  `capture:intake`
- `tools/card-height.ts` — how tall the card a ranking row opens stands, over the recordings:
  `panel:cards`
- `tools/changelog.ts` — a version's `CHANGELOG.md` section as release notes, and the declared
  version: `release:notes`
- `tools/decoding-status.ts` — how much of the protocol the decoder reads, in `develop`'s text:
  `fight:decoding`
- `tools/develop-reports.ts` — this tree's reports held against `develop`'s at the pinned revision:
  `fight:develop`
- `tools/drill-report.ts` — which rows of the panel open onto another level, over the recordings:
  `panel:drill`
- `tools/fabricated-fight.ts` — a fight nobody fought, ten a side, written under `fabricated/`
  outside git: `fight:fabricate`
- `tools/fight-figures.ts` — what a recording adds up to per combatant, as a terminal table:
  `fight:figures`
- `tools/game-client-source.ts` — fetches and dates the game client's JavaScript into `.cache/`:
  `game:client`
- `tools/game-readings.ts` — whether the readings in `frozen/` are current, and the refresh:
  `game:readings`
- `tools/help-article.ts` — the published help, cached, searched and its phrase counts frozen:
  `game:help`
- `tools/help-claim-register.ts` — the claims `docs/protocol-keys.md` makes of the published help,
  read back into phrases
- `tools/margometer-tool-error.ts` — `MargoMeterToolError`, the abstract base every tool failure
  extends
- `tools/panel-giving-way.ts` — the panel with a region that will not draw, built from a copy of the
  tree: `preview:giveway`, `panel:giveway`
- `tools/panel-shots.ts` — photographs the panel in each state worth showing into `screenshots/`:
  `panel:shots`
- `tools/preview-page.ts` — the page both previews draw: the game page, the bar, the tooltips
  column, a store that forgets, and the install band
- `tools/preview-server.ts` — serves the preview with a picker, rebuilt and reloaded on change,
  saying a failed build: `preview`, `preview:fabricated`
- `tools/preview-site.ts` — builds the one-page preview GitHub Pages publishes, which keeps nothing
  and plays its fight once: `preview:site`
- `tools/preview-state.ts` — what `deno task preview` carries in its address across a reload
- `tools/protocol-key-shape.ts` — what each key states about itself over the recordings, beside the
  register's line: `game:shape`
- `tools/protocol-key-table.ts` — lifts every protocol key the game client branches on from its
  bundle: `game:keys`
- `tools/recorded-material.ts` — the recordings a tool reports on, each fight replayed through the
  runtime's chain, whole or call by call
- `tools/shout-holding.ts` — whom a character a shout named strikes, turn by turn after it:
  `fight:shout`
- `tools/skill-table.ts` — every published skill and the turns its effects run for: `game:skills`
- `tools/turn-count.ts` — the turns each recording's combatants took, graded against the game's
  numbering: `fight:turns`
- `tools/turn-reading.ts` — what each message came to under the turn rule, and the openers in
  dispute: `fight:openers`

- `tests/` — shared test support (fake window and document, simulator, recording readers, a
  register's table reader) and the entry and simulation suites
- `tests/core/` — the suites of `src/core/`, and the decoding rules held over the recordings
- `tests/e2e/` — the browser suite: Playwright on Node driving the built userscript in Chrome,
  outside the gate
- `tests/game/` — the suites of `src/game/`, the page adapters, and a session replayed from the
  recordings
- `tests/libs/` — the suites of `libs/`
- `tests/repository/` — the guards the register in `AGENTS.md` names, each holding a rule over the
  tree
- `tests/runtime/` — the suites of `src/runtime/`
- `tests/tools/` — the suites of `tools/`
- `tests/ui/` — the suites of `src/ui/`, and the bounds and wording of what the panel draws

- `captures/` — the recordings: raw protocol from real fights, evidence rather than test data,
  changed only by intake

- `screenshots/` — the panel's pictures the READMEs show, with `taken-at.json` naming the commit,
  version and recording

## Safety

The shapes every function here keeps, whatever it is doing. **S3, S8 and S9 stand where a hazard
this language does not have would be**; each states what binds instead.

- **S1.** Only simple, explicit control flow. No recursion, direct or indirect. **A body is written
  over lines**, because every reader of one here reads it by its lines.
- **S2.** Every loop has a fixed upper bound; exceeding it fails an assertion rather than
  continuing.
- **S3.** The cost of one payload is **measured** over the recordings, never assumed, and a change
  to the decode path that raises it is a finding.
- **S4.** No function is longer than 70 lines, which is one printed page.
- **S5.** Assertion density averages at least two per **function that takes something and may
  assert**, across `libs/`, `src/core/`, `src/game/`, `src/runtime/` and `tools/`, counting the
  closures a file writes inside its functions as the functions they are. A function handed nothing
  has no precondition a caller could break; one **E12** forbids to assert has none it may state.
  **The floor a machine holds this to sits below the two**, so that deleting an assertion **A12**
  calls no assertion is never what reddens the gate. `develop ADR 0007`, `0051`, `0074`.
- **S6.** Declare at the smallest possible scope, `const` by default, at the point of use.
- **S7.** Every return value is used or explicitly discarded; every parameter is checked. Held by
  the compiler.
- **S8.** No code is generated at build time beyond the version constant and the instrumentation
  module swap.
- **S9.** Never alias a mutable structure. A caller that must not mutate receives a reading, not the
  map.
- **S10.** Zero warnings, from the first day. A warning fails the gate.
- **S11.** Every collection that grows with input carries a **stated maximum**, and the maximum
  binds. **How it binds is the layer's**: an assertion, where **A11** allows one; a clamp and a
  defect in the layer a reader touches; a returned failure where exceeding it is expected (**E1**);
  a throw in `tools/`; or a bound another layer already enforces, tied to this one by a test rather
  than restated. A stated maximum nothing reads is not a bound, and a new unbounded collection is
  `[ASK]`.
- **S12.** Split compound conditions into nested branches rather than `&&` chains, and state
  invariants positively: `if (index < count)`, not `if (index >= count)`.
- **S13. What the bundle carries is synchronous.** No `async`, `await`, `Promise` or `.then` in
  `src/`, or in the `libs/` modules it reaches. A promise at the wrapped engine call answers the
  game before the fight is read, and the `try` around a synchronous call catches no rejection
  arriving after it. `develop ADR 0043`.
- **S14. An `if` that does not leave has an `else`.** An `if` whose body ends by leaving — `return`,
  `continue`, `break`, `throw` — is a guard, and what follows it is its `else`. Any other `if`
  handles in its `else` the case it did not take, or asserts there what holds (**A2**): a value set
  before the `if` for that case is set in the `else`, and two `if` over a condition and its negation
  are one `if` and its `else`. An `if` stands alone only where its negative space is empty — nothing
  happens there, and nothing holds there but the negation of its own condition. ADR 0006.
  _(`by-reading` whether the negative space had something to say)_

## Assertions

- **A1.** Assert arguments, return values, preconditions, postconditions and invariants.
  _(`by-reading` whether an assertion covers the invariant that matters)_
- **A2.** Assert the positive space you expect **and** the negative space you do not. _(`by-reading`
  whether the negative space was the one worth asserting)_
- **A3.** Split compound assertions: `assert(a); assert(b);`, never `assert(a && b)`.
- **A4.** The message names the **invariant**, not the condition. _(`by-reading` whether a message
  names the invariant or the condition)_
- **A5.** Assertions are live in the shipped build. They are not removed for production.
- **A6.** Use `@std/assert`. There is no assertion module of our own.
- **A7. A failed assertion becomes state at the nearest boundary**, through `attempt` (**E4**). A
  programmer error degrades to a missing section; it never reaches the game's call stack.
- **A8. An assertion is not a failure.** `assert` is for what must never happen. A failure you know
  can occur is returned (**E1**), and an `AssertionError` is never matched by `instanceof`:
  `attempt` wraps it in a `Caught` like any other throw.
- **A9. Where a failure is read, the assertion that reports more is the one used.** In `tools/` and
  `tests/` a `@std/assert` function that says what `assert` cannot — the value, the diff, the
  narrowed type — is what stands there; where it discards the message naming the invariant, `assert`
  is. `===` takes the **strict** pair and never the deep one. `develop ADR 0040`.
- **A10. What the bundle carries takes the plain `assert`** — `src/`, and the `libs/` modules it
  reaches — imported by module path, `@std/assert/assert`, never the barrel. `develop ADR 0040`.
- **A11. The layer a reader touches asserts nothing.** `src/ui/`, `src/userscript-entry.ts` and
  `src/userscript-boot.ts` import no assertion and spell none: a broken invariant there is checked,
  degraded in place and recorded as a defect (**E12**). `develop ADR 0051`.
- **A12. An assertion the compiler already guarantees is not one.** The observation is mechanical:
  delete the line and run `deno check` — where the tree still type-checks and no narrowing was lost,
  the assertion was never holding anything. A value crossing one of **E5**'s boundaries is the case
  this does **not** name. `develop ADR 0074`.

## Errors

The shapes are `docs/design.md` §3; the fate of each failure is its §10.5.

- **E1. Two kinds of failure, and they never share a mechanism.** A failure that can happen — the
  game did not send a field, storage refused, a message does not parse — is **returned** beside the
  value, never thrown. A broken invariant is an **assertion**. Nothing the bundle carries throws on
  purpose except an assertion; the only other exceptions it meets are thrown by code it did not
  write. **A bound on what arrives from outside is checked once, at the edge that reads it**, and
  fails as a returned failure there; past the edge the same bound is an assertion, because only a
  bug of ours can break it. A failure class exists only where its reason changes what happens next —
  a failure that would end in the same defect as a broken invariant is not given a class of its own.
- **E2. What can fail answers `Value | SomeFailure`, and nothing else.** There is no box and no
  combinator: every call site branches with `if (value instanceof Error)`, or on the class it
  expects, which is **S1**'s explicit control flow. `unknown` beside a failure is `unknown`, so a
  call reading a value nobody typed narrows it inside `attempt`, which refuses `unknown` by its
  type. ADR 0008.
- **E3. A failure is a class extending `Error`, one per reason, never a record and never a
  sentence.** Its `name` is a literal spelled as its class is, which **E7**'s table is keyed by, and
  its `message` stays empty. A failure met below it is its `cause`. A bound in it is
  `maximum: number`, filled from the constant that owns the number — a literal in the type is a
  second copy. A name the game chose never appears in it: a failure names **our** field (**N13**).
- **E4. A broad catch stands in exactly one function**: `attempt` in `libs/errors.ts`, whose `try`
  holds a call into code this project did not write or our own at a boundary, and which answers what
  the call returned or a `Caught` carrying what was thrown. Each call to it sits at one of **E5**'s
  boundaries. Any other `catch` is a bug.
- **E5. There are six boundaries in the add-on, and they are enumerable.** A new one is `[ASK]`,
  because an unlisted broad catch is indistinguishable from a swallowed bug. Where each stands is
  `docs/design.md` §10.6.

  | Boundary                       | Direction | A failure there becomes               |
  | ------------------------------ | --------- | ------------------------------------- |
  | the add-on standing up         | inbound   | a copy that stood down, and said so   |
  | the wrapped engine call        | inbound   | a payload that did not land           |
  | one render region              | outbound  | that region undrawn, in place         |
  | browser storage                | outbound  | a refusal, which is an answer         |
  | the game's own page state      | outbound  | a reading marked unknown              |
  | a callback somebody else calls | inbound   | that gesture or frame dropped, marked |

  In `tools/` the boundaries are the network and a subprocess.
- **E6. `null` or a failure: the reason decides.** `T | null` in a domain type means the protocol
  did not state it, which is a fact. A reading returns `T | null` where it has **one** reason to
  fail and its name already says it (`parseInteger`); it returns a failure where it has more than
  one, or where the reason must travel on (which field failed). **Never substitute `0` for a failed
  read.** Zero is a measurement. `develop ADR 0021`.
- **E7. Every failure meets a fate, and the compiler holds the table.** `FAILURE_FATES` maps the
  `name` of every class in `RuntimeFailure` to one fate; a new class without an entry fails
  `deno check`. Branching on the class is what a failure class is for.
- **E8. Writing asserts, because the number is ours.** A writer (`format…`, `encode…`) asserts its
  input; a reader never throws.
- **E9. No failure is discarded silently.** Every failure leaves the mark **E5**'s table names for
  its boundary, where a reader can see it. Where a failure also reaches the console it is one
  branded entry, once per kind, never per render. `develop ADR 0025`.
- **E10. Every callback handed to an API this project did not author is guarded at the handover** —
  an event listener, a frame callback. A throw out of one unwinds into a dispatch loop that drops
  it, so the gesture does nothing and no mark reaches anybody. `develop ADR 0043`.
- **E11. A promise is awaited, or handed a rejection handler in the same statement.** One exception:
  the top-level `if (import.meta.main)` block of a tool, where a loud throw is the mark and the exit
  code is what a person and CI read. `develop ADR 0043`.
- **E12. Nothing the bundle carries may stop the add-on.** `src/ui/`, `src/userscript-entry.ts` and
  `src/userscript-boot.ts` check every value crossing into them, catch every call that can throw and
  degrade in place, and every failure they swallow becomes a **defect** the panel states. The test
  is a path, not a file: **an entry into this program with no boundary on it is a bug**.
  `develop ADR 0051`.
- **E13. A tool fails loudly, with a class of its own.** `tools/` throws subclasses of the abstract
  `MargoMeterToolError`, each passing its own `code`, with the original in `cause` when wrapping.
  The brand goes in `name` (`MargoMeterTool/…`), because a console shows it first. Never a bare
  `new Error`, and outside the bundle never `extends Error` but in that one file. The bundle's
  failure classes are returned, never thrown (**E1**). `develop ADR 0009`.

## Interfaces

- **I1. An interface exists where there are two implementations.** A port — an interface over
  something this program does not control — has the real one over the page and the simulated one,
  and that is what earns it one (`docs/design.md` §5). A pure function has one implementation and
  stays a function: a method call is harder to follow than a named call, for a reader and for a
  guard.
- **I2.** An object that holds state may be described by an interface with one implementation,
  because the interface describes an object that exists anyway, rather than wrapping a function.
- **I3.** Where a consumer must be handed a function, it takes a parameter of a function type, at
  the **second** consumer (**C9**), and never an object wrapping one method.

## Naming

TypeScript idiom, with the naming rules stated here.

- **N1.** `camelCase` for functions and variables, `PascalCase` for types, `SCREAMING_SNAKE_CASE`
  for module constants, kebab-case for filenames.
- **N2. A function name starts with the action it performs**, and each verb means one kind of work.
  Most come from TigerBeetle, whose functions name their work rather than reaching for one verb.

  | Action              | Means                                                                       |
  | ------------------- | --------------------------------------------------------------------------- |
  | `init`              | Creates an object that holds state; its parameters are `…Options`           |
  | `deinit`            | Gives back what an object holds outside itself: a wrap, a frame, a listener |
  | `open`              | Loads durable state into memory at start                                    |
  | `on`                | Reacts to input from outside; the callback name                             |
  | `prepare`           | Reads and computes a transition, touching nothing                           |
  | `commit`            | Writes a prepared transition; cannot fail                                   |
  | `execute`           | Performs one operation on state                                             |
  | `verify`            | Asserts the invariants of a whole structure                                 |
  | `get`               | Accesses what this program holds, immediately                               |
  | `set`               | Assigns from one value to another                                           |
  | `lookup`            | Finds something that may not be there                                       |
  | `read`              | Takes a value from **outside** this program — **N16**                       |
  | `write`             | Puts a value outside this program — **N16**                                 |
  | `parse`             | Text → structure                                                            |
  | `decode`            | Structure → **meaning**                                                     |
  | `encode`            | Meaning → structure or text for somebody else to read                       |
  | `tally`             | Sums figures                                                                |
  | `index`             | Builds a map to look things up in                                           |
  | `replay`            | Walks events from the start to what stands now                              |
  | `present`           | Turns figures into what a screen shows                                      |
  | `render`            | Builds or updates DOM                                                       |
  | `format`            | Writes a value as text a person reads                                       |
  | `add` / `remove`    | Puts something into somewhere / takes it out                                |
  | `create` / `delete` | Brings something into existence / erases it                                 |
  | `reset`             | Restores to the initial state                                               |
  | `require`           | A value narrowed to a type, or throws — `tools/` only (**E1**)              |
  | `expect`            | Fails a test unless something holds — a test's action and nobody else's     |
  | `attempt`           | Calls what may throw, answering its value or a `Caught` (**E4**)            |
  | `compose`           | A new value made of several, where no verb above fits                       |

  `compose` is the residue, not the default. Other verbs are allowed where they are more precise,
  but never a **synonym** for one in the table.
- **N3.** Units and qualifiers go **last**, sorted by descending significance: `damageRawTotal`,
  `latencyMillisecondsMaximum`, and a shouted constant the same way: `ROWS_MAXIMUM`, never
  `MAXIMUM_ROWS`. A bound is a qualifier like any other, and TigerBeetle spells it last everywhere
  (`message_size_max`).
- **N4.** No abbreviations. `button`, not `btn`; `percent`, not `hpp`; `Maximum`, not `max`.
  Abbreviate only where the game does, and say so in a comment. _(`by-reading` whether a shortened
  word is an abbreviation or the game's own spelling)_
- **N5.** Related names get the same length where they can, so they line up: `source` and `target`,
  not `src` and `dest`. _(`by-reading` whether two related names line up)_
- **N6.** A helper called by one function is prefixed with that function's name; a callback goes
  last in the parameter list.
- **N7.** Names follow A/HC/LC — `prefix? + action + high context + low context?`.
- **N8.** Booleans carry a prefix, in the tense that fits: `is`, `was`, `will` for a state, `has`
  for what is held, `does` for what a thing can do, `should` for a condition with an action behind
  it.
- **N9.** Do not overload a name with context-dependent meanings, and do not duplicate the context a
  name already sits in.
- **N10.** Files are named for their contents, never their category. `utils.ts`, `helpers.ts`,
  `common.ts`, `misc.ts` and `index.ts` are never created here.
- **N11.** Types name the thing, not its shape: `CombatantSnapshot`, not `CombatantData`.
- **N12.** Use the term `CONTEXT.md` gives, and never one it lists under `_Avoid_`. _(`by-reading`
  whether a word names the concept it is forbidden for)_
- **N13. A name this repository did not choose is spelled once**, in the map of the adapter that
  reads it (`ENVELOPE_KEYS`, `WARRIOR_FIELDS`), keyed by a name of ours. Everything past the adapter
  — a record, a failure, a defect, a console line — carries our name. Where two files must spell
  one, a guard holds them to one vocabulary.
- **N14.** A unit is spelled in full, where **N3** puts it: `afterMilliseconds`, `healthPercent` —
  never `Ms`, `Sec`, `Pct`. `develop ADR 0042`.
- **N15.** A boolean names the state that holds and is negated where it is **read**: `!isDrawn`,
  never `isNotDrawn` or `hasNoRows`.
- **N16. A value from outside this program is `read`; a value put outside it is `written`.** `get`
  and `set` are for what this program holds. Outside is **E5**'s boundaries. `libs/` has no
  boundary: it is handed its values. `develop ADR 0042`.
- **N17.** A collection is plural and never says which container holds it: `combatants`, not
  `combatantList`. A map is named for the lookup it takes: `damageByElement`.
- **N18. A closed set of our own strings has one vocabulary object**, its type derived from it and
  its list, where a list is wanted, from its values:
  `const STORAGE_CHOICE = { local: "local", session: "session", memory: "memory" } as const`,
  `type StorageChoice = VocabularyWord<typeof STORAGE_CHOICE>` and
  `const STORAGE_CHOICES = Object.values(STORAGE_CHOICE)`. Code names a word by its key,
  `STORAGE_CHOICE.local`, never by the literal. A string arriving from outside is checked against
  the list with `isOneOf`, **and only there** — a string our own code wrote is the compiler's to
  check (**A12**). ADR 0001. No `enum`, which emits an object nobody here writes (**S8**), and no
  `Object.freeze`, which would check at run time what `as const` already forbids. **One exception: a
  protocol message's key** stays a `string`, because the set is the game's and grows. The decoder's
  `getKeyReading` decides whether a key means anything, and an unknown one is an unread message,
  never a type error.
- **N19. Every union with a `kind` has a vocabulary object**, so the string stands once and every
  variant, construction and `case` reaches it by symbol:
  `const OPENED_PART = { skill: "skill", source: "source" } as const` and
  `{ kind: typeof OPENED_PART.skill }`. The key is the name for code; the value is what reaches a
  console or a file. A failure is a class (**E3**), never a union with a `kind`.
- **N20. A failure class is named for what failed and how**, a subject and its state:
  `EngineAbsent`, `StoreRefused`, `PayloadsExceeded`. A union of them that a function answers is
  `…Failure`, and a tool's thrown class is `…Error` (**E13**). A failure of the bundle never ends in
  `Error`, which names the mechanism `extends Error` already states. ADR 0009. _(`by-reading`
  whether a name says what failed and how)_

## Code

- **C1. A module reads top-down, in TigerBeetle's order: imports, types, constants, then functions,
  the entry first.** A constant a type is derived from (`typeof`), a vocabulary above all, stands
  with the types. A function the module does not export stands under the first function that calls
  it and before the next exported one, so a helper is read after its caller and inside its caller's
  run; in a test file each case opens a run as an export does. ADR 0003. _(`by-reading` which export
  is the entry)_
- **C2. A comment earns its place by carrying one of four things, and nothing else:** a measurement,
  with the material and date it was taken on; a constraint somebody else's system imposes; a
  rejected alternative and why it lost; a trap that will otherwise be fallen into twice.
  _(`by-reading` whether a comment carries a measurement, a constraint, an alternative or a trap)_
- **C3.** A comment states what is true of the code **now**. Never how it came to be this way.
  _(`by-reading` whether a sentence describes the code now or how it got here)_
- **C4.** A file's docblock says what the file is for, in **at most eight lines of prose**. The
  lines showing how a tool is run do not count.
- **C5.** Comment share of a file stays under 25%, counting the comment lines that carry a word.
  `develop ADR 0016`, `0075`.
- **C6.** Comments are sentences — a space after the slashes, a capital letter, a full stop, or a
  colon when they introduce what follows. An end-of-line comment may be a phrase.
- **C7. No regular expressions**, in either spelling. Text is read by walking it. A new exception is
  `[ASK]`. `develop ADR 0006`.
- **C8. An import from the file's own directory is `./name.ts`; every other one is written from the
  repository root, `#/path.ts`.** Never `../`, never `./` into a subdirectory, never `#/` for a
  sibling, and always the file's extension. ADR 0002.
- **C9.** Nothing exists before it is needed — files, directories, modules, tools, guards and
  documents alike. A shared module appears at the **second** consumer.
- **C10.** A file holds one subject, however long that subject runs. What forces a split is a
  **second** subject, never a line count.
- **C11.** Never create a file that only re-exports; update the import to the real module.
- **C12.** `!` is never used in `src/` or `tools/`. Ask first whether the type can be made precise.
  Tests keep `!`.
- **C13. A value never wears a type nobody checked.** A type assertion overrides the compiler rather
  than asking it, so a value is narrowed by a guard instead: `isRecord` and the field readers
  `docs/design.md` §3 gives, a `value is X` predicate, an `instanceof`. `as const` and `satisfies`
  assert nothing. The case that keeps escaping is `JSON.parse`. A crossing that has no narrowing to
  offer is `[ASK]`, and the first one starts a register. Tests keep the cast. `develop ADR 0044`.
- **C14. Self-documenting code first.** A name, a type and an assertion say what a sentence would
  and cannot go stale. Plain description belongs in the **file's docblock** and nowhere else.
  `develop ADR 0016`.
- **C15.** A comment never restates what a canonical document owns; it **cites** it. **And never
  twice in this tree.** `develop ADR 0016`.
- **C16.** Comment share of a directory under `src/` or `tools/` stays under 22%.
- **C17. The standard library is asked before a function is written.** Where its edge case differs
  from the one needed, keep your own and **name the difference where the code stands**. A new
  package is a dependency, and **Ask first** governs it. `develop ADR 0040`.

## Language

- **L1.** Write English — code, comments, tests, documents, commits. An identifier never carries a
  Polish character.
- **L2.** One exception: **the text a person who plays the game reads**, which is Polish wherever it
  is composed. What arrives from the game keeps the game's own spelling. `develop ADR 0030`.
- **L3.** A Polish sentence never carries our vocabulary or a key of the game's: a player is told
  what cannot be known, not why our reader cannot know it.

## Evidence and claims

- **V1.** Cite the source for any claim about the game — its documentation, a client asset, or a
  measurement over the recordings (`captures/`). Negative claims included.
- **V2.** A quotation from the client carries its build id; a claim from the published help carries
  the date it was read.
- **V3.** A claim about a browser names the engine, the version and the date it was read. The
  version is the **first** release with support.
- **V4.** A measurement over the recordings names the material it was taken on — the file, or the
  set and its date.
- **V5.** Never leave a number in prose that a machine could compute. Measure at read time.
- **V6.** Documentation settles a meaning; the recordings settle a number. Where they disagree, the
  disagreement is the finding.

## Verification

- **W1.** Run the gate after every change, including a one-line edit. The gate is `deno task check`,
  **from the commit that creates it**; a commit made before it exists says in its body that nothing
  was gated.
- **W2.** `git add` before the gate, by path.
- **W3.** Prove a new test can fail: break what it covers, watch it go red, restore **from a copy**
  — never `git checkout`. Confirm the break landed before reading the verdict, and prove a mutation
  by what it moved, not by what it matched.
- **W4.** A mutation that lights nothing is a finding — a missing test or an inert line.
- **W5.** Test the boundary from both sides, and zero is a boundary. A test at `0` needs one at `1`
  beside it.
- **W6.** A test that parses another program's output holds a **transcript**, never a typed sample.
- **W7.** Read back the result of a scripted edit, and read back the **whole unit** — the sentence,
  the rule, the paragraph — never only the line that changed.
- **W8.** Never update a golden expectation merely to make a behaviour change pass. The figures
  `develop` @ `fa1dcce` draws for a recording it held are the expectation, and a difference is a
  finding in one of the two (`docs/design.md` §12).
- **W9.** A change under `src/` is not done until the end-to-end suite is green as well, from the
  commit that brings the suite. `develop ADR 0047`.
- **W10.** A work round that relies on frozen readings of the game starts with them current, by
  `frozen/AGENTS.md`: `deno task game:readings status`, and `refresh` where one went behind (ADR
  0005).

## Git

- **G1. Ask before committing or pushing.** Otherwise end a round with the changes in the working
  tree and a summary.
- **G2.** Conventional Commits, English: `type(scope): effect`. The header names the **effect**, not
  the activity.
- **G3.** The body is the primary record of reasoning, with no length limit: numbers rather than
  adjectives, what decided it, the rejected alternatives, what you broke and what lit up, and what
  stays open.
- **G4.** `TODO.md` is committed on its own, as `todo: …` — no scope, nothing else in the commit.
- **G5.** Every commit leaves the gate green on its own, including when one change is split across
  several.
- **G6.** Work lands on `develop`; `main` is the latest release, advanced only at a release and only
  by fast-forward.
- **G7.** A release goes out in three takts, and the wait is between the second and the third:
  `develop`, then `main` once that push's `check` run is **green**, then the tag. Branch protection
  refuses `main` while the run is going, and that refusal is cheap — the tag going out first is not.
  `docs/releasing.md` is every step.
- **G8.** Never bypass a hook.

## Ask first

- Changing a contract `docs/design.md` names as carried over: `BattleEvent`, the wrap semantics, the
  file format, the storage keys.
- Deleting or skipping a test, including "it's obsolete".
- Adding a dependency.
- Touching anything under `captures/` but through `deno task capture:intake`, on any branch.
- Turning off a compiler flag, a lint rule, or a guard to pass.
- Adding a file nothing uses yet.
- Adding a construct that raises the browser floor.
- Widening any rule this repository marks `[ASK]`.

## Never

- **Send anything over the network from the userscript** (`SECURITY.md` owns the surface).
- **Automate the game or change how a fight plays out.**
- **Edit captured material to make a test pass.**
- **Copy the game's own prose into this repository.** Keys and identifiers are functional and may be
  stored; displayed sentences are somebody else's work. Player nicknames never enter the repo.
- **Invent data the log does not carry.** Unknown is allowed, a guessed name is not.
- **Comment the obvious.**
- **Leave a number in prose that a machine could compute.**
- **Write to `TODO.md`** — the maintainer's hand-kept list — by any tool, on any branch. Two walls
  stand in front of it, `.claude/settings.json`'s deny list and the formatter's exclusion in
  `deno.json`, and both are narrower than the rule: a tool that walks the tree and writes gets its
  own exclusion **before** its first run.

## Guard register

Every guard that **exists**. Nothing is listed here before it runs.

Every rule not in it is held by reading until a guard for it runs, and a guard joins this table in
the commit that makes it pass. A rule ending **`by-reading`** carries an observation no machine can
compute, and stays out of this table for good.

**A reader is proved by a sample it must flag and a sample it must not.** The first catches a reader
that has stopped finding its subject; only the second catches one that finds too much.

| Guard                                              | Holds                     |
| -------------------------------------------------- | ------------------------- |
| `deno check`, strict, with unused names an error   | S7                        |
| `tests/repository/declaration-order.test.ts`       | C1                        |
| `tests/repository/function-length.test.ts`         | S4                        |
| `tests/repository/regular-expressions.test.ts`     | C7                        |
| `tests/repository/import-paths.test.ts`            | C8                        |
| `tests/repository/non-null-assertions.test.ts`     | C12                       |
| `tests/repository/synchronous-bundle.test.ts`      | S13                       |
| `tests/repository/assert-imports.test.ts`          | A6, A10                   |
| `tests/repository/throws.test.ts`                  | E1, E3, E13               |
| `tests/repository/names.test.ts`                   | N1, N10                   |
| `tests/repository/layers.test.ts`                  | `docs/design.md` §4       |
| `tests/repository/browser-suite-keys.test.ts`      | N13                       |
| `tests/repository/reader-layer.test.ts`            | A11                       |
| `tests/repository/skill-durations.test.ts`         | ADR 0005                  |
| `tests/repository/redacted-names.test.ts`          | `captures/AGENTS.md`      |
| `tests/repository/captured-fight-register.test.ts` | `docs/captured-fights.md` |
| `tests/repository/fabricated-fights.test.ts`       | `captures/AGENTS.md`      |
| `tests/repository/protocol-keys.test.ts`           | `docs/protocol-keys.md`   |
| `tests/repository/cited-paths.test.ts`             | C3, C15                   |
| `tests/repository/broad-catches.test.ts`           | E4                        |
| `tests/repository/handed-callbacks.test.ts`        | E10                       |
| `tests/repository/type-assertions.test.ts`         | C13                       |
| `tests/repository/control-flow.test.ts`            | S1                        |
| `tests/repository/comment-share.test.ts`           | C4, C16                   |
| `tests/repository/design-tokens.test.ts`           | `DESIGN.md`               |
| `tests/repository/changelog.test.ts`               | `CHANGELOG.md`            |
| `tests/repository/documents.test.ts`               | this file                 |
| `tests/repository/decisions.test.ts`               | `docs/adr/`               |
| `tests/repository/workflows.test.ts`               | `.github/workflows/`      |
| `tests/repository/readmes.test.ts`                 | the two READMEs           |
| `deno check --config project/browser-lib.json`     | the browser floor         |
| `requireBundleInBrowser` in the build              | Never: the network        |
