# The whole tree, read a fifth time

Status: closed
Read at: 75096ad

The seventh audit, and the fifth that reads the whole tree. The fourth read
`fee5870` on 2026-08-19; the fifth and sixth read only the code, at `7097aee` and
`af3f1ec`, and both named the prose half as not read at all. Since `fee5870`
there are 54 commits and 184 changed files; since `af3f1ec`, 32 commits and 125.

Three of §7.7's triggers are met at once. A release tag is coming — `TODO.md`
carries *Audit before v0.9.0 release* as the one item in progress. Rounds since
have touched a layer no audit has read: the shelf landed this morning in
`75096ad`, and `src/game/kept-fights.ts`, `src/userscript-storage.ts` and the
shelf half of `src/userscript-entry.ts` had never been read by anything but their
own guards. And the same class of fault has turned up in two rounds — the
screenshots, which F8 below is the second audit in a row to file.

The gate is green at `75096ad`, so nothing below is a bug a machine here can see.
F1 is the exception that proves the shape of the rest: a silent path that loses
the reader's fights, in code whose own type docblock forbids exactly the mistake
that makes it possible.

## What was measured

`bun run check` at `75096ad`. The working tree carries one modification —
`TODO.md`, the maintainer's own, uncommitted — and nothing else; no guard reads
that file's contents, so the gate is the tree's:

```
tsc --noEmit                     no output, exit 0
tsc --noEmit -p tsconfig.userscript.json
                                 no output, exit 0
bun test                         6332 pass, 0 fail, 2 186 979 expect() calls
                                 82 files, 8.47 s
bun run build.ts                 dist/margometer.user.js, dist/margometer.meta.js
```

That figure is the tree before this document exists: `tests/tools/audit-status.test.ts`
runs its shape checks once per audit and once per finding, so writing this adds
tests to the count.

Five tools were run for their answers rather than as subjects, over the 25
recordings held on 2026-08-26:

```
bun tools/decoding-status.ts     9 995 messages, 9 995 fully read,
                                 0 carrying an unread key
bun tools/fight-report.ts        25 captures; the unattributed row is zero in
                                 every one, no capture holds an unreadable
                                 message, and no capture holds an unaccounted
                                 healing cast
bun tools/drill-report.ts --cases
                                 4 173 breakdown rows over 25 captures, and
                                 docs/drill-levels.md came back byte-identical
bun run cost                     every recording replayed, per phase; the worst
                                 single payload in the set costs 2.78 ms
bun tools/changelog.ts notes 0.8.1
                                 the section exists and reads as a player's;
                                 `notes 0.9.0` refuses, there being no section
```

`bun tools/game-client-source.ts status` reports production `53XkBRxF` and
development `1781609507010`, both current against the cache, so §7.6's
compare-before-working obligation is met and nothing was fetched.

**The gate was also run against a clean checkout of the same commit**, in a
throwaway worktree at `75096ad` with `bun install --frozen-lockfile` — the
arrangement §6.1 asks for when local and CI could disagree. It is green there
too, and **exactly one `expect()` differs**: 2 186 978 against 2 186 979,
reproducibly. The one that differs is `tests/tools/game-client-source.test.ts`,
and it differs on purpose — it branches on whether `.cache/development` was
fetched on this machine, which its own docblock calls "a property of the machine
and not of the tree". Nothing else in 82 files reads the working tree.

**The mutation sweep** was run in that same worktree, so no mutant could ever be
written into a file holding uncommitted work, and `TODO.md` was never touched
(§5):

```
bun tools/mutation-sweep.ts src/userscript-storage.ts
                                 13 mutants, 13 killed, 0 survived,
                                 0 refused by the compiler, 0 unfinished,
                                 0 of the kills by shape alone
bun tools/mutation-sweep.ts src/game/kept-fights.ts
                                 no answer — 179 of 180 ran and the tool threw
                                 the lot away on the 180th (F4)
```

## Findings

### F1 — A place the browser refused is drawn as chosen, and the fights it moved are gone

`ValueStore` in `src/userscript-storage.ts:71` opens with an absolute: *"`setText`
answers whether it landed, **and every caller has to look**. A store that returns
`void` on refusal is the silence §9.6 spends its length on."*

Two callers do not look, and they are the two that decide where a reader's fights
live. `onStorageChosen` and `onKeepLimitChosen` each write the settings and
discard the answer.

Driven with a store that takes everything except the settings key — which is a
`localStorage` the game has already filled, the case `src/userscript-storage.ts`
spends its whole docblock on:

```
before:                     {"storage":"local","keepLimit":5,"hasStoreRefused":false}
after choosing session:     {"storage":"session","keepLimit":5,"hasStoreRefused":false}
settings actually stored:   null
after choosing a limit of 20: {"storage":"session","keepLimit":20,…}
settings actually stored:   null
next page load reads:       {"storage":"local","keepLimit":5,…}
```

The panel says the choice was taken. Nothing was written. `hasStoreRefused` stays
false, so neither `STORE_REFUSED_WARNING` nor `EVERY_SLOT_PINNED_WARNING` is
drawn — the shelf has a sentence for a fight that would not save and none for a
choice that would not save.

The fights go with it. `onStorageChosen` empties the old store *before* it moves
(`src/userscript-entry.ts:876`), so with one fight already kept:

```
localStorage holds fights: true          shelf rows: 1
after the move — localStorage: false     sessionStorage: true
panel says: {"storage":"session", hasStoreRefused:false}
next load reads settings: {"storage":"local"}
next load shelf rows: 0
```

The reader's kept fights — pinned ones included — are in `sessionStorage`, and the
add-on will never look there again, because the answer that would have sent it
there is the thing that did not save. §9.6's rule reaches this exactly: a number
that might be wrong must never look like a number that is right, and here it is a
choice rather than a number.

`setStoredPosition` at `src/userscript-entry.ts:505` also discards the answer and
is **not** part of this: it says so on its own line — *"a failure to write is a
panel that forgets — not a broken panel"* — and a forgotten drag costs a drag.

No test drives a refusing settings store. `tests/userscript-entry.test.ts:430`
tests the write landing and nothing tests it not landing.

*Where:* `src/userscript-entry.ts:878`
*Closes:* guard `tests/userscript-entry.test.ts`

### F2 — A new fight closes the levels of an old fight somebody is reading

`composeStateAfterFightStart` clears the drill — `focusCombatantId`,
`focusTargetId`, `focusSkill` — and argues for it in one sentence
(`src/ui/panel-screen.ts:812`): *"the levels below the ranking are the part of the
state that belonged to the one that is over … A breakdown left open across the
boundary is not wrong — the rows under it are the new fight's — it is somewhere
nobody asked to be."*

Every clause of that is about a reader watching the live fight. The caller applies
it to everybody. At `src/userscript-entry.ts:1247` the reset runs on the payload
that starts a fight, unconditionally, while `latest` is held back four lines
later — `if (isShowingLive) latest = reading;` at `:1272` — precisely so that a
reader on a kept fight keeps seeing it.

So a reader two levels into a fight from an hour ago, at the moment the player
starts a new one, is put back at the top of the tab. The rows under them are not
the new fight's; they are the kept fight's, and they were where somebody asked to
be. The reducer's own reason for existing is false in the one case the shelf
created.

*Where:* `src/userscript-entry.ts:1247`
*Closes:* guard `tests/game/engine-attachment.test.ts`

### F3 — At a limit of zero one rotation honours a pin and the other drops it

`src/game/kept-fights.ts` states an absolute twice, once per rotation: *"A pinned
fight is never given up to make room, even when that means writing nothing."*

At a limit of zero it is false in one of them, and the two disagree:

```
keeping at 0, one pinned held:  {"fights":[],"dropped":["pinned"],"isRefused":true}
trimming to 0, one pinned held: {"fights":["pinned"],"dropped":[],"isRefused":true}
keeping at 1, one pinned held:  {"fights":["pinned"],"dropped":[],"isRefused":true}
```

`composeKeptFightsAfterKeeping` short-circuits at `:280` before the loop that
protects a pin, so zero is the one limit where keeping drops a pinned fight —
while trimming to the same zero keeps it, and keeping at *one* keeps it. There is
a test at zero (`tests/game/kept-fights.test.ts:125`) and it holds an unpinned
fight, so §7.5's *test the boundary from both sides* is met on one side of the
boundary and not on the axis that matters.

Nothing reaches it today: `PANEL_KEEP_LIMITS` offers 3, 5, 10 and 20
(`src/ui/panel-screen.ts:574`) and `getSettingsFromStoredText` refuses anything
below 1. What is filed is the divergence itself — two functions, one stated rule,
opposite answers, no guard between them.

A smaller thing in the same file, mentioned here rather than as its own finding:
identity is a signal in these functions — `composeKeptFightsAfterPin` and
`composeKeptFightsAfterRemoval` hand back the list they were given where nothing
changed, and `composeKeptFightsWithinLimit` does the same on its success path —
but its all-pinned return hands back a copy with `dropped` empty, so a caller
reading identity is told something changed when nothing did.

*Where:* `src/game/kept-fights.ts:280`
*Closes:* guard `tests/game/kept-fights.test.ts`

### F4 — One hanging mutant throws away the whole sweep, and it is the last one every time

The instrument was pointed at the two files no sweep had ever reached.
`src/userscript-storage.ts` came back **13 mutants, 13 killed, 0 survived, 0
refused by the compiler, 0 of the kills by shape alone** — the second file to come
back with nothing surviving, after `src/ui/panel-reading.ts` at 24 mutants
(`docs/audits/2026-08-21-the-rest-of-the-code-read-for-its-smells.md`). Worth
saying beside F1: the module is wholly held, and what is not held is that its
callers read the answer it hands back.

`src/game/kept-fights.ts` has no score, and cannot get one. Its 180th mutant is
`!==` → `===` on line 626, inside the one unbounded loop in the file:

```
held = held.filter((other) => other !== oldestUnpinned);   // src/game/kept-fights.ts:626
```

Flipped, the filter keeps the fight it was meant to drop, so `held` never
shrinks, so `for (;;)` at `:611` never reaches either exit. `bun test` runs until
`RUN_TIMEOUT_MILLISECONDS` — two minutes — and `spawnSync` reports that as
`result.error`.

Which is where the tool loses everything. `getGateOutcome` at
`tools/mutation-sweep.ts:320` treats any `result.error` as fatal, and argues it
well for the case it was written for: *"A runner that cannot be started is not a
mutant nobody noticed … it is true of every run that follows."* That is true of
`ENOENT` and false of `ETIMEDOUT`. A timeout is a property of one mutant; the
181st would have run. `spawnSync` puts both in the same field, so both take the
same throw.

The throw unwinds through `files.flatMap(...)` at `:561`, and the report is
written only after that expression finishes — so nothing reaches disk. Measured
here: 179 of 180 mutants ran, roughly 28 minutes of `bun test`, and every outcome
was discarded by the 180th. `composeMutations` is deterministic and this one is
last, so every future run reaches 179/180 and throws again.

The tool already has the vocabulary for the case. `GateOutcome` carries
`isRed: boolean | null`, commented *"`isRed` is null where the gate never
finished"*, and the summary line prints an `unfinished` count that a timeout can
never reach, because the throw happens first. What the storage run printed was
`0 unfinished` — a number that is structurally always zero.

Two things this does not say. The mutant is not a defect in
`setKeptFightsThatFit`: `getOldestUnpinned` returns a member of `held`, so the
list does shrink and the loop does terminate. And the restore held — the worktree
came back clean even on the throwing path, so §7.5's rule about never restoring
with `git checkout` was not tested by this.

*Where:* `tools/mutation-sweep.ts:320`
*Closes:* guard `tests/tools/mutation-sweep.test.ts`

### F5 — The panel's delegated-event root is spelled twice, and only a comment holds the two together

§9.6 makes the event root structural: *"Event handling is delegated at the root,
never bound per row, so re-rendering cannot lose handlers."* The shelf gave that
root a second consumer and nothing was extracted, which is §7.1's second-consumer
rule going unanswered.

`renderPanel` (`src/ui/panel-element.ts:656`) and `renderFights` (`:1019`) each
declare their own `handleGuarded`, their own `pointerdown` listener with the same
`if ((event.button ?? 0) !== 0) return;` guard, and their own `contextmenu`
listener with the same `preventDefault` and the same call to `onBack`. Two copies
of each, exactly; `renderWaiting` has none and needs none.

The decision behind them is written once. `renderPanel:702` carries the whole
argument — the press and never the click, the defect it replaces, the rejected
alternative of holding a redraw back while a hand is down — and `renderFights:1051`
carries a two-line note saying *"for `renderPanel`'s reason"*. A reader changing
the one with the argument has nothing pointing them at the one without it, and
§7.5 has this exact receipt already: `libs/running-total.ts` was extracted because
one spelling in five places had drifted, and two of the copies then survived under
a green guard.

Nothing has drifted yet. The finding is that nothing would say so.

*Where:* `src/ui/panel-element.ts:1043`
*Closes:* guard `tests/ui/panel-element.test.ts`

### F6 — A spec still in draft says the add-on writes nothing down

`docs/specs/2026-08-26-the-game-says-the-fight-again.md` landed in `cbc3764`. Two
commits later, on the same day, `75096ad` made three of its present-tense
sentences false. §7.7 allows a dated tree only to `docs/audits/`; every other
document is a claim about now.

Under `## Where the add-on stands today`, at `:29`:

- *"Nothing is written down."* — `src/game/kept-fights.ts` writes finished fights
  down, under `margometer.kept-fights`.
- *"The one thing this add-on remembers across a page is where the panel was
  dragged to."* — it now also remembers the kept fights and the reader's two
  choices, `margometer.fight-settings` beside them.
- *"the type it reaches storage through has exactly two methods on purpose"* —
  `ValueStore` has three: `getText`, `setText`, `removeText`.

The argument rests on them, which is why this is not a typo. Its rejected
alternative — a saved tape in `sessionStorage` — is rejected for charging *"a
stored copy of somebody's fight, a freshness rule, a validator, and a replay on
every page load"*. Three of those four are now paid for by the shelf, so the
rejection reads differently than it did the morning it was written, and a reader
picking the spec up to decide what to do next would be costing an alternative
against a tree that no longer exists.

The `draft` status itself is right: the three commits the spec proposes are not
written, and its own *What stays open* is honest.

*Where:* `docs/specs/2026-08-26-the-game-says-the-fight-again.md:29`
*Closes:* commit

### F7 — The published preview keeps a stranger's demo fight in their browser

`shouldStartHere` asks one question — *"am I in a page"* — and answers it with
`scope.document !== undefined` (`src/userscript-entry.ts:420`). The preview
harness stubs `window.Engine` and loads the real bundle, so on
`kamilgrocholski.github.io` the add-on runs whole, shelf included, against that
origin's real `localStorage`.

Which means the published page now writes. A visitor who lets the recording play
to its end has that fight written down under `margometer.kept-fights`, plus
`margometer.fight-settings` and `margometer.panel-position`, and a second visit
opens onto a shelf holding what the first one left — up to five fights at roughly
34 kB each on the current set. Nobody decided this; it followed from the shelf.

The page's introduction is deliberately three sentences and no more
(`tools/preview-site.ts:62`): that the fight is a recording, that everything is
counted in the reader's own browser, and where the add-on is. The second stretches
to cover this and was not written for it.

Not filed as a defect, and there is a real case for leaving it exactly as it is —
the preview's whole purpose is to be the add-on rather than a mock of it, and a
shelf that forgot itself would be the one part that was pretending. What is filed
is that the choice has not been made.

`tools/panel-screenshots.ts` is **not** affected and was checked: it opens a fresh
profile per shot (`:296`) for a reason already written down, so the pictures can
never be of a panel carrying the last run's shelf.

*Where:* `tools/preview-site.ts:70`
*Closes:* guard `tests/tools/preview-page.test.ts`

### F8 — Pictures of a panel that has moved fifteen commits, in both READMEs

The second audit in a row to file this, which is §7.7's own trigger for opening
one. `docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md` F1 was a set
taken eleven commits past `v0.7.0` with every guard green; the guard written to
make that readable is doing its job, and nobody has read it.

`screenshots/taken-at.json:3` names `bf3f4c8`. Between that commit and `75096ad`
there are fifteen commits touching `src/ui/`, `src/core/` or `src/userscript-entry.ts`,
and at least three of them change what is in frame:

- `0a53e9b` put `ROW_WARNING_MARK` — `⚠` — beside the name of any combatant
  something could not be read about. No picture has one.
- `75096ad` put `☰` on the title bar. No picture has one.
- `487ec04` made every bar one width. Its own commit message says the defect was
  *"measured off `screenshots/panel-taken.png` at v0.8.1 — ranking rows ending at
  x=269 on a 260px panel, both of those at x=275"*. The repository used one of
  these four pictures as evidence of a bug, fixed the bug, and left the picture in
  `README.md` and `README.en.md`.

Both READMEs put the pictures above everything else, so they are the first thing a
player sees.

Checked and clean, so that the close is not wider than the fault: the sidecar's
`"version": "0.8.1"` against a `bf3f4c8` whose own `package.json` reads `0.8.0` is
**correct**, not a second fault. `tools/panel-screenshots.ts` records the version
it is written at rather than the one it was written from
(`tests/tools/panel-screenshots.test.ts:234`), and `src/` and `libs/` are
byte-identical between `bf3f4c8` and the release commit `6e7ab09` — so those
pictures are the v0.8.1 panel, taken at the last commit that drew it. The guard
holds ancestry and refuses currency deliberately, saying so at `:96`, because a
currency check *"turns every round that touches the panel into a round that must
drive a browser"*. §9.8 carries the currency half as an obligation on a person.
This is that obligation, unmet.

Closing it needs a browser and every picture opened by hand, which is why it is
last: it should be the round immediately before the tag, after F1, F2, F3 and F4
have finished moving the panel.

*Where:* `screenshots/taken-at.json:3`
*Closes:* guard `tests/tools/panel-screenshots.test.ts`

## Looked at and clean

- **`src/userscript-storage.ts`, read line by line.** The refusal-as-data shape,
  the three places, the fall back to memory rather than to the other browser
  store, and the property access done *inside* the `try` because a forbidding
  browser throws on the access rather than answering `undefined`. Its `catch`
  clauses are the one place §9.5 names as its exception and it says so. Its
  quotation of the client carries build `53XkBRxF`, cached 2026-08-25 and read
  2026-08-26 — §7.6's shape, in full.
- **`src/game/kept-fights.ts`, read line by line** apart from what F3 names. The
  inputs-not-numbers decision, the `STORED_FIELDS` table and its argument for
  spelling three of the game's own names without following the game, the
  three-answer `getNullableIntegerFromValue`, and the read path that drops a fight
  rather than repairing it.
- **§9.1's layering, by hand.** `src/core/` holds no `document`, `window`,
  `localStorage` or timer — every apparent hit is the word *documents* in prose.
  `src/ui/` reaches for no global; every `document` in it is the injected
  argument. `src/userscript-storage.ts` sits at the root of `src/` and argues why
  it belongs to no layer.
- **The two storage vocabularies.** `STORAGE_CHOICES` in `src/userscript-storage.ts`
  and `PANEL_STORAGE_CHOICES` in `src/ui/panel-screen.ts` are a deliberate second
  spelling — `ui` may not import the storage module — and
  `tests/ui/panel-screen.test.ts:564` holds them equal.
- **The shelf's Polish, read in words.** `tests/ui/panel-words.test.ts:974–1000`
  writes every sentence out literally rather than reading it back from the module
  that composes it, and `tests/ui/panel-element.test.ts:2042` finds a control by
  its Polish label. That is §7.5's last rule met on the newest words in the tree,
  the round after it was paid for on nine older ones.
- **Where the shelf's warnings are drawn.** `STORE_REFUSED_WARNING` and
  `EVERY_SLOT_PINNED_WARNING` go into `composeFightsView`'s own `warnings`
  (`src/ui/panel-view.ts:1302`), which is the shelf's strip and not the fight's —
  §9.6's *put the warning where the consequence is*, correctly.
- **`docs/browser-support.md`.** The five storage rows were added and dated
  2026-08-26, the quota's absence is written as an entry rather than left out, and
  the document says in its own words that the DOM half is not exhaustive. The CSS
  half is enumerable and guarded; the JavaScript half is the compiler's.
- **`CHANGELOG.md`'s `[Niewydane]`.** Fourteen entries against 32 commits, in
  Polish, in the required order, carrying no key of the game's and no vocabulary
  of ours. Nothing user-visible from those commits is missing from it.
- **`docs/protocol-keys.md`'s newest entry.** `anguish` at `:556` carries the
  engine name, the help article and its read date, the production build it was
  read on, the material, and the argument for why an announcement is *not* enough
  — which is the shape §9.6's fourth clause asks for. The register carries claims
  against two production builds because the bundle's name changed on 2026-08-25;
  each carries its own, which is what §7.6 asks and not drift.
- **Every measurement over the captures carries its material.** The seven
  surviving `seventeen`-recording figures — in `src/core/combatant-health.ts:81`,
  `src/ui/panel-drill.ts:367`, `src/ui/panel-view.ts:993` and four tests — each say
  *held on* or *as they stood* with a date, or cite the dated audit that took them.
  §3 is met; what those figures describe is now a third of the set, which is the
  rule working rather than failing.
- **Coverage as a name.** `tests/tools/named-exports.test.ts` holds it at zero and
  is green, so no runtime export in the tree goes unnamed by any test.
- **The registers that are guarded both ways** — `docs/drill-levels.md`,
  `docs/captured-fights.md`, `docs/half-named-figures.md` — were re-derived rather
  than read: `drill-report --cases` rewrote its table byte-identically, and the
  other two fail their own guards on a stale line.
- **§5's wall.** `.claude/settings.json` denies exactly the three file-editing
  tools against `TODO.md`, in both spellings, as §8 describes. The shell is
  forbidden by rule and not by wall, which the rule says.
- **`tools/panel-screenshots.ts`'s fresh profile per shot**, checked because F7
  raised the question.
- **§9.7.** WCAG AA is measured over every bar in `tests/ui/panel-element.test.ts`,
  and `src/ui/panel-look.ts:116` records the one palette colour that failed at
  3.71:1 and what was done about it.
- **The redraw while a kept fight is on screen.** `renderLatest()` runs on every
  live payload even when the panel is showing a fight from the shelf, so the view
  and DOM phases are spent redrawing something static. Left alone deliberately:
  the worst payload in the set costs 2.78 ms whole, and this repository has already
  decided once that the panel's cost is sufficient and the code does not move for
  it.

## What was not read

- **The panel was not run.** `.claude/skills/verify/` is how it would have been.
  F1, F2 and F3 were settled by driving the modules directly, and F8 is a claim
  about pictures rather than about a running panel — but nothing here has seen the
  shelf drawn, and the shelf is the newest interactive surface in the tree.
- **The sweep answered one file of the two it was pointed at.**
  `src/game/kept-fights.ts` is measured nowhere — F4 says why, and says the same
  will be true of the next attempt until the instrument changes.
- **Everything else is still unswept**, carrying the fifth and sixth audits' debt
  unchanged: `src/ui/panel-element.ts`, `src/ui/panel-look.ts`,
  `src/ui/panel-screen.ts`, `src/ui/panel-words.ts`, `src/ui/panel-view.ts`,
  `src/ui/panel-drill.ts`, `src/ui/panel-reading.ts`, `src/ui/cost-overlay.ts`,
  `src/userscript-entry.ts`, the rest of `src/game/`, all of `libs/`, all of
  `tools/` and `build.ts`. `src/userscript-entry.ts` is the one that matters most
  of those now: F1 and F2 are both in it, and it is the file the shelf grew into.
- **Read by outline rather than line by line:** `src/ui/panel-element.ts` past the
  two render roots F5 names, `src/ui/panel-view.ts`, `src/ui/panel-drill.ts`,
  `src/core/fight-decoder.ts`, `src/core/fight-statistics.ts`, and all of `tools/`
  except `preview-site.ts`, `preview-page.ts` and `panel-screenshots.ts`.
- **`docs/protocol-keys.md` was read at its newest entry and its build citations,
  not end to end.** Its 3 036 lines were last read whole by the fourth audit at
  `fee5870`.
- **The six spec bodies other than the two the shelf rests on were read for their
  status and their citations, not as arguments.** The two that were read whole are
  `2026-08-26-a-fight-you-can-go-back-to.md` and
  `2026-08-26-the-game-says-the-fight-again.md`, because F1, F3 and F6 are about
  what they authorise.
- **`tests/ui/panel-view.test.ts`, `tests/ui/panel-element.test.ts` and
  `tests/game/engine-attachment.test.ts` were grepped, not read.** They are the
  three largest test files in the tree and the standing note about them is now
  three audits old.
- **`tests/captured-fights/` was not opened as prose.** It was measured as data —
  25 files, 9 995 messages — and never read for its wording; it is evidence (§9.2).
- **`docs/design/panel.html` was not read**, for the fourth audit's reason.
- **Nothing was fetched from the game or from the published help.** The served
  build was compared and matched, so the question never arose; every claim here
  about either source is a claim about what the register already records.
- **The four prior audits were read only for their status, their findings and the
  passages `AGENTS.md` and the guards cite.** Where this document says a finding
  recurs, the claim rests on those passages.
