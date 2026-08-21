# The code, read for its smells

Status: open
Read at: 7097aee

The fifth audit, and the first that is not the whole tree. The fourth read
`fee5870` two days ago and spent itself on the prose half — §2's table, §8's
block, both READMEs, the three registers, the 28 spec bodies — and every one of
its thirteen findings was closed in `8982c55`. Reading that half again now would
mostly re-confirm a commit that is two days old.

What has moved since is the **code**: 20 commits, 103 files, 5 899 lines added
and 4 270 removed. `src/ui/` went from 17 files to 8 across five `refactor(ui)`
commits, `0b4af78` took out comments that only describe, and §9.1's splitting
clause was rewritten in `7815a23` from *prefer a narrow module* to **a file
holds one subject; what forces a split is a second subject**. Nothing had read
the merged files against the rule that authorised the merge.

So this one reads `libs/`, `src/`, `tools/` and `build.ts` for the faults a green
gate cannot report: a decision written twice, a boundary nothing stands on, a
comment that has stopped being true of the code under it, a construct with an
owner that two call sites ignore, and a sentence a player reads that nothing
holds to anything. The prose half is named in *What was not read* rather than
re-read.

The gate is green at `7097aee`, so nothing below is a bug a machine here can see.
The first four are defects a machine *could* see and does not, and all four came
back from one instrument: `src/ui/panel-drill.ts` — the file the drill was folded
into — survives 57 of its 200 mutations once the tool's own blind spot is taken
out. The worst any file had measured before was `src/core/combatant-health.ts` at
36 of 116, and that one produced the fourth audit's most expensive finding.

## What was measured

`bun run check` at `7097aee`. The working tree carries one modification —
`TODO.md`, the maintainer's own, uncommitted — and no guard reads that file's
contents, so the gate is the tree's:

```
tsc --noEmit                     no output, exit 0
tsc --noEmit -p tsconfig.userscript.json
                                 no output, exit 0
bun test                         5024 pass, 0 fail, 1546727 expect() calls
                                 72 files, 5.43 s
bun run build.ts                 dist/margometer.user.js, dist/margometer.meta.js
```

That figure is the tree before this document exists: `tests/tools/audit-status.test.ts`
runs its shape checks once per audit and once per finding, so writing this adds
tests to the count.

Four tools were run for their answers rather than as subjects, over the
seventeen recordings held on 2026-08-21:

```
bun tools/decoding-status.ts     7128 messages, 7128 fully read,
                                 0 carrying an unread key
bun tools/fight-report.ts        17 captures; `unattributed` is zero in all six
                                 columns on every one, and none holds an
                                 unreadable message
bun tools/drill-report.ts --cases
                                 2867 breakdown rows over 17 captures
bun run cost                     every recording replayed, per phase
```

Six things were measured by script rather than read, each reading the tree
through `git ls-files` and the comment ranges through `libs/source-regions.ts`
rather than through a search (§7.5):

**Comment density**, by line, over the tracked `.ts` files: `libs/` 58%,
`src/core/` 51%, `src/game/` 52%, `src/ui/` 45%, `tools/` 31%, `tests/` 32%,
the four files at the root of `src/` 48%, `build.ts` 58%. `0b4af78` is the
commit that was supposed to move these and `src/ui/` is where it moved them.

**The import graph**, rebuilt from all 469 `from "@/…"` specifiers. No dynamic
`import()` and no side-effect import anywhere, so the specifier list is the whole
graph.

**Repeated blocks**: every run of six or more consecutive non-trivial lines
appearing twice or more, comments and blank lines excluded. Fourteen windows,
over seven distinct duplications — three of them import lists.

**Every `catch` clause** in `libs/`, `src/`, `tools/` and `build.ts`: 20, of
which 4 narrow on `instanceof` and 16 do not.

**Every function name** against §9.4's table: 140 `get`, 129 `compose`, 24
`write`, 18 `set`, 13 `is`, 10 `require`, 9 `render`, 7 `parse`, 6 `has`, 5
`remove`, 4 `decode`, 4 `assert`, 3 `should`, 1 `reset`, and nothing else.

**Every exported value**, against every file that names it: ten are referenced by
no source file but the one that declares them, and `resetSpans` is an eleventh
whose only other mention in the tree is a sentence about it (F7).

**The mutation sweep**, in a detached worktree at `7097aee` because it refuses a
dirty tree and the maintainer's `TODO.md` edit is one:

```
src/ui/panel-reading.ts    26 mutants     2 survived
src/ui/panel-words.ts     101 mutants     4 survived
src/ui/panel-drill.ts     200 mutants    67 survived
```

327 mutants, 73 survivors, none of the kills by shape alone. Ten of the 73 are
the tool's own blind spot and are not read as findings: `bun test` is what runs
per mutant, so a string the **compiler** constrains — a member of a type union,
a `kind` inside a typed literal — cannot be killed by it. That was checked
rather than assumed: mutating `src/ui/panel-drill.ts:179` and `:203` in the
worktree and running `tsc --noEmit` gives `TS2322` and `TS2367`. What is left is
63, and 57 of them are in one file.

**Two argument swaps, run as experiments** in that worktree and restored from a
copy. 57 places in the tree take two adjacent parameters of the same primitive
type, where a caller can transpose them and the compiler cannot object. The two
whose transposition would be worst were tried: `composePairSkillEntries(…,
combatantId, otherId, …)` at `src/ui/panel-drill.ts:962` reddens 17 tests, and
`composeRankedRow(…, whole, largestShown, …)` at `src/ui/panel-view.ts:1060`
reddens 37.

Read in full: `libs/` (9 files), `src/core/combatant-health.ts`,
`src/core/fight-decoder.ts`'s decoders, `src/game/engine-battle-wrap.ts`,
`src/game/game-dictionary.ts`, `src/game/engine-attachment.ts`,
`src/ui/panel-reading.ts`, `src/ui/panel-words.ts`, `src/ui/panel-screen.ts`,
and the docblock of every file in `libs/`, `src/` and `tools/`.

## Findings

### F1 — a name of the game's, spelled twice in one file, and no spelling of it stands on anything

`src/ui/panel-drill.ts` counts critical hits at `:121` and `:122` by asking the
row's proc map for `"crit"` and `"legbon_verycrit"`, and then at `:215` filters
those same two tokens out of the effects line — because a hit counted in the
`kryt.` counter must not be counted again as an effect. Four spellings of two
names, two of which have to agree with the other two.

All four survive the sweep. Change either token at `:121`/`:122` and the counter
reads `kryt. 0` while the effect list gains a row; change either at `:215` and the
same hits are counted in both places. The gate stays green both ways, and the
panel goes on drawing.

`"resdmg"` at `:152` is a third of the same kind: it is the one token whose figure
is a percentage rather than points, and the conditional printing the `%` sign
survives being pointed at a token that does not exist. A figure in the wrong unit
is what §10 keeps `destroyed` apart from damage for.

All three are the game's names, not ours, and all three are already spelled in
`src/ui/panel-words.ts` — `crit` and `legbon_verycrit` as keys of `EFFECT_NAMES`,
`resdmg` in `DESTRUCTION_NAMES`. §9.3 is exact about this: *a name this repository
did not choose is spelled once, by the file that reads it — and where two files
must spell it, a guard holds them to one vocabulary*, and the failure it names is
the one here: never loud, the panel still draws, the gate still passes.

*Where:* `src/ui/panel-drill.ts:215`
*Closes:* open

### F2 — twenty-one edges that can be moved with the gate green, and most of them are zero

§7.5 states the rule and what it cost: *"Test the boundary from both sides, and
zero is the boundary. Zero is the neutral element of every sum here, so a wrong
edge moves no figure and changes what a figure means. A test at `0` needs one at
`1` beside it."*

Twenty-one lines in the two swept composing files carry an edge that survives
being moved, and most of them are that boundary. Two are in
`src/ui/panel-reading.ts`, at `:156` and `:192`:
`if (rest > 0) without.set(element, rest)`, the last line of the two cuts that
close a pinned row against its figure. Moved to `> 1`, a leftover of one point per
element is dropped, and the cut no longer sums to the figure standing over it with
nothing on screen to say so — on a panel whose rule is that a number that might be
wrong must never look like a number that is right (§9.6).

The other nineteen are in `src/ui/panel-drill.ts`, and fourteen are the same idea
everywhere a section decides whether it exists: `row.largestBlow > 0` at `:129`,
`row.healthLost > 0` at `:199`, `row.healthLostCaused > 0` at `:203`, the
`amount > 0` filters at `:209`, `:227`, `:239` and `:431`, the `largest > 0` a
bar's fill is divided by at `:288`, `orphan > 0` at `:455` and `:948`,
`amount <= 0` at `:571` and `:761`, and `rest > 0` at `:620` and `:814`. Ten of
those can also be turned from `>` into `>=`, which is the other side of the same
edge: a section that draws a row for a figure of nothing.

The remaining five are a different shape and are recorded rather than argued: the
`0` a fold is seeded with at `:277`, a `?? 0` default at `:896`, the
`Math.max(rest, 0)` at `:626`, the `plainBlows > 0` that decides whether a count
is shown at `:628`, and the `> 1` at `:352` that F3 names.

The sweep is what makes this a count rather than an impression, and the count is
the finding: it is one missing test written twenty-one times.

*Where:* `src/ui/panel-drill.ts:288`
*Closes:* open

### F3 — every list the drill draws is sorted, and no test says in which direction

Six of the seven arithmetic mutations that survive `src/ui/panel-drill.ts` are
comparators: `other.amount - one.amount` at `:603`, `:686`, `:774` and `:984`,
and `other - one` at `:432` and `:922`. Turning any of them into `+` leaves the
gate green.

A comparator that returns a sum is not a small error — it orders by nothing in
particular and puts the rows in whatever order the engine's sort happens to
produce. The drill exists to answer *what is this figure made of*, and the answer
is read down the list: the largest contributor first, the way the ranking above it
reads. `tests/ui/panel-drill.test.ts` asserts what the rows are and what they add
up to; nothing asserts which comes first.

The seventh survivor is `getPairCutSize` at `:368`, where `byElement.size +
bySource.size` can become a subtraction. That figure decides, through `> 1` at
`:352`, whether a row opens anything at all — so a cut of one element and one
source, which is two rows, comes out as zero and the row becomes a leaf. That one
is not about order, and `docs/drill-levels.md` is the register it would contradict.

*Where:* `src/ui/panel-drill.ts:603`
*Closes:* open

### F4 — nine strings a player reads can be changed to anything at all

Between them, the two swept files leave nine player-facing strings that no test
holds — and the separator between two of them.

Six are in `src/ui/panel-drill.ts`: the profession fallback at `:177`, the two
section labels at `:204` and `:205`, the effects heading at `:218`, the `" · "`
that joins the counters at `:219`, the note at `:236` about a figure the game
states only part of, and the healing cut's heading at `:701`. Three are in
`src/ui/panel-words.ts`: `NOBODY_TENDED_NOTE` at `:226`, and both halves of
`NEITHER_END_LEFTOVER` at `:437` and `:438` — the label `Nie do przypisania` and
the sentence beside it. Each can be replaced by `"mutation-sweep"` with 5 024
tests green.

They are not untested. Every test that touches them reads them **back from the
module that writes them**: `tests/ui/panel-words.test.ts:427` and `:495` take
`getNeitherEndLeftover()` and compare it against itself, and
`tests/ui/panel-view.test.ts:1984` asserts the panel prints
`getNeitherEndLeftover().label`. That holds the two sides to be *the same*. It
cannot hold either to be *right*, which is the distinction the fourth audit drew
over `src/cost-phases.ts` and declined on the grounds that those words reach a
terminal and a development overlay
(`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F13). These reach a
player, and §3 makes a claim about them that nothing checks: a Polish sentence
never carries our vocabulary or a key of the game's.

The pair at `:437` is the one to weigh. It is what the panel says about the figure
naming neither end — zero in every recording, which §9.6 says is *exactly why it is
written down rather than left to be noticed*. The row nobody has ever seen is the
row nothing checks.

*Where:* `src/ui/panel-words.ts:437`
*Closes:* open

### F5 — the owner of a running total has no row in the register, and two copies it replaced are still there

`libs/running-total.ts` exists because the same three tokens —
`map.set(key, (map.get(key) ?? 0) + amount)` — were written out in four files
across three layers (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`,
F16). Its own docblock names the copies it was extracted from and says two of
them were in `src/core/fight-statistics.ts`.

Both are still there. `src/core/fight-statistics.ts:696` and `:747` write
`skill.dealtByTargetId.set(event.targetId, (skill.dealtByTargetId.get(event.targetId) ?? 0) + landed)`
by hand, in a file that imports `setRunningTotal` at line 34 and calls it and its
pair form twenty-two times. The commit that created the owner (`99c096a`)
left five such sites in this file; three have since been rewritten and these two
have not.

What lets that stand is that **`libs/running-total.ts` is the one primitive
`libs/` holds that §9.5's register does not list.** The register's table names
`libs/number.ts`, `libs/json.ts`, `libs/text-order.ts`, `libs/timestamp.ts`,
`libs/elapsed-spans.ts` and `libs/record.ts`, and
`tests/tools/source-layout.test.ts` re-earns every row of it by finding the
construct spelled outside its owner. A running total has no row, so nothing looks
for it, and §8's own note on the file — *"Adding to a total a map already
carries"* — is a description rather than a claim anything checks.

The module's docblock is right about the failure and is watching it happen:
*"Writing it out five times is how one of them would eventually have been written
differently."*

One site is not the same case and belongs in the decision rather than in the
guard: `tools/decoding-status.ts:100` counts into a plain object, which
`setRunningTotal`'s `Map` signature does not take.

*Where:* `src/core/fight-statistics.ts:696`
*Closes:* open

### F6 — the reading that decides which end states health is written twice, and nothing tells its branches apart

`getHealthReadingOfEvent` in `src/core/combatant-health.ts:134` answers, per
event kind, which slot moved health and which stated it. Two of its branches
carry the same eight lines verbatim — `attack` at `:143` and `skill-used` at
`:188` — each spreading both ends' stated percentages into a list, and a third at
`:200` is the same fold for one end.

The fourth audit measured what that costs from the other side: 21 of the file's
116 mutants survive, and what is left after its close *"is one cluster: the `===`
and `||` branches of `getHealthReadingOfEvent`, where each event kind states
which slot moved health and which stated it. Nothing there is unread — every one
is exercised through some fight — but nothing distinguishes the kinds from each
other, which is a round of its own and is written here rather than left for a
fifth audit to rediscover"* (F2). This is that fifth audit, and the duplication is
the half the sweep could not name: two branches with one body are two branches no
test can distinguish, because there is nothing to distinguish.

The file is where §9.6's clause about sizing a share onto a side rests, and that
clause's whole argument is that every input is refused rather than defaulted.

*Where:* `src/core/combatant-health.ts:188`
*Closes:* open

### F7 — the decoder reads `name(percent%)` twice, and only one of the two copies carries the traps

`src/core/fight-decoder.ts:152` and `:215` hold the same six lines: run
`NAMED_WITH_PERCENT` over the raw name, fall back to the whole string, refuse a
blank name, read the percentage where there is one, refuse a percentage that will
not read.

The first copy carries two comments, and each records a decision somebody would
otherwise take again: why the `??` is a gap in the type rather than a branch, and
why a blank name is refused rather than passed on. The second copy has neither.
Neither copy says anything about the third refusal in the block — an unreadable
percentage refusing the whole message rather than nulling the field — which is
the one with the longest reach. Its docblock argues at length why these two decoders
cannot share a reader — the members arrive in the opposite order, which is true
of the **splitting** — and then repeats the half that is identical.

Nothing holds the two together. This is the shape §9.3 names: the panel still
draws and the gate still passes while one copy learns something the other does
not.

*Where:* `src/core/fight-decoder.ts:215`
*Closes:* open

### F8 — "the only two in this repository" names two of sixteen

`src/game/engine-battle-wrap.ts:249` argues for the breadth of the catches under
it: *"The catches below are deliberately broad — the only two in this repository
that are."*

Three of them are in that block. Thirteen more are elsewhere: `game-dictionary.ts:82`,
`engine-attachment.ts:109`, six in `src/ui/panel-element.ts`, three in
`src/userscript-entry.ts`, and two in `tools/preview-server.ts`. Of the twenty
`catch` clauses in `libs/`, `src/`, `tools/` and `build.ts`, four narrow on
`instanceof` and sixteen do not.

Every one of the sixteen is defensible, and that is the finding rather than an
exoneration. They sit where this add-on touches somebody else's page —
`localStorage` that can throw for being read at all, a dictionary belonging to
the game, a DOM the game also writes to, a region isolated so that its failure is
its own size (§9.6). §9.5 says **catch narrowly — exactly the error you expect**
and names no exception; §9.6 requires the isolation that makes sixteen of them
necessary; and the only place the tension is written down is one comment that
claims to be the whole of it.

*Where:* `src/game/engine-battle-wrap.ts:250`
*Closes:* open

### F9 — a `libs/` primitive whose only caller is the test that keeps it alive

`libs/elapsed-spans.ts:93` exports `resetSpans`. Nothing in `libs/`, `src/`,
`tools/` or `build.ts` calls it; `tests/libs/elapsed-spans.test.ts:111` does, and
that is the whole of its use.

It is not inert in the ordinary way, because the design above it leans on it:
`SpanRecorder`'s docblock at `:36` argues that the type is a wrapper around the
map rather than the map itself *"so a caller holding a recorder cannot quietly
become a caller holding somebody's totals: `resetSpans` empties it in place, and
everything that was handed the recorder keeps writing to the same one
afterwards."* The reason for the wrapper is a function no caller has ever wanted.

`tests/tools/named-exports.test.ts` passes, and says in its own docblock why it
would: *"Naming an export is not testing it… What this catches is the weaker and
more common thing: an export nothing under `tests/` has ever mentioned."* This is
the case one rung below that — an export one test mentions and nothing needs —
and §7.1's rule is that nothing exists before it is needed.

*Where:* `libs/elapsed-spans.ts:93`
*Closes:* open

### F10 — a function that is one function because two callers needed it, and the second caller is gone

`src/ui/panel-words.ts:481` holds `composeSpacedThousands`, and its docblock
says: *"One function because two kinds of number need it and only one had it: a
rate read `39362,0/t` beside a total reading `354 258`, which is the same figure
written two ways on one row."*

There is no rate. Nothing in `libs/`, `src/` or `tools/` prints one, and §10's
entry for a turn says why — *nothing here counts them: totals only, no rate, no
divisor*.
`composeFigureText` at `:447` is the only caller left, three lines above it.

The function is right and the sentence is the reason somebody would keep it
separate. What the reader is told is that a second caller is out there, when what
is true is that the second caller was removed and its argument stayed.

*Where:* `src/ui/panel-words.ts:478`
*Closes:* open

### F11 — "the drawing is a separate file and a thin one" stands over the largest file in the repository

`src/ui/panel-view.ts:4` explains the split between deciding and drawing:
*"The drawing is a separate file and a thin one, because everything worth getting
right is here."*

`src/ui/panel-element.ts` is 1 427 lines and 27 functions, the largest source
file in the tree — `src/ui/panel-view.ts` itself is 1 150. It was 1 157 at
`fee5870`, and the file-reduction round put the rest on it: `eb2832c` folded 286
lines of placement in, which is where the panel sits and where a detail window
opens. Its own docblock argues, correctly, that that section touches no document
and can be checked without one — which is an argument about testability, not
about thinness.

The sentence matters because of what it is for: it is what a reader consults
before deciding which of the two files a new decision belongs in, and it tells
them the other one is thin.

*Where:* `src/ui/panel-view.ts:4`
*Closes:* open

### F12 — one fold, seven spellings, in the layer that has a module for exactly this

Totalling a two-level map — `Map<id, Map<token, number>>` down to one number, or
down to one map — is written out seven times in `src/ui/`:
`panel-reading.ts:127`, `:149`, `:174`, `:185` and `:207`, `panel-view.ts:446`,
and `panel-drill.ts:401`. Five of the seven are in the module whose docblock says
the folds live there because both the ranking and the drill ask the same three
questions of a combatant.

Four of those five are two pairs of twins: `getDamageWithoutActor` and
`getHealthLostWithoutActor` are the same function over a different field, and so
are `getDamageWithoutActorByElement` and `getHealthLostWithoutActorBySource`.
Each pair is the same arithmetic — sum the inner maps, subtract from the row's
own figure, clamp at zero — with two different maps named in it, and the pair
carries two separate `Math.max(0, …)` and two separate `rest > 0` boundaries,
which is what makes F2 two findings' worth of the same missing test rather than
one.

A third spelling sums the same shape with `+=` in `panel-view.ts:446`, and a
fourth reads `[...map.values()].reduce(…)` at `panel-reading.ts:105`. The writing
half of this idea has an owner in `libs/` and eight consumers; the reading half
has none.

Whether the answer is a reader in `libs/`, a parameter where two twins stand, or
nothing at all is a judgment this audit does not make — it is filed because
§7.1's second consumer arrived five times inside one file and nobody noticed.

*Where:* `src/ui/panel-reading.ts:127`
*Closes:* open

## Looked at and clean

Each of these looks like a fault from a distance, or is a place a fault would
hide, and neither is. They are here because *not looked at*, *looked at and
clean* and *a finding* are three answers (§7.7).

- **Naming is exact.** Every one of the 373 named functions in `libs/`, `src/`,
  `tools/` and `build.ts` begins with an action from §9.4's table, and the whole
  distribution is fourteen verbs. No synonym for a table verb is used anywhere:
  no `fetch` where `get` fits, no `update` where `set` fits.
- **The layering graph matches §9.1 everywhere the rule draws a line.** Rebuilt
  from all 469 specifiers: `libs/` reaches upward nowhere, `src/core/` imports
  only itself and `libs/`, `src/ui/` never imports `src/game/`, `src/game/` never
  imports `src/ui/` or the entry point, and only `src/userscript-entry.ts` knows
  every layer.
- **A transposed argument is caught, at both places it would cost most.** 57
  adjacent same-typed parameter pairs exist, and the two whose swap would draw
  somebody else's figures were swapped in a worktree: 17 tests red at
  `src/ui/panel-drill.ts:962`, 37 at `src/ui/panel-view.ts:1060`. The shape is a
  risk the compiler cannot hold; the tests hold it.
- **The repeated blocks are what they look like.** The fourteen windows collapse
  to seven duplications: three import lists, one repeated signature and one
  record literal in `src/ui/panel-drill.ts` — a shape, not a decision — and the
  two decisions F6 and F7 name, each of which the detector found in several
  overlapping windows.
- **No colour is written twice.** Every hexadecimal literal in `src/ui/` is
  inside `src/ui/panel-look.ts`'s token tables, and §9.7's rule that a raw hex in
  a rule is a bug holds with nothing outside them.
- **Every test asserts something.** Three of the 5 024 have no `expect(` in
  their own body — two in `tests/tools/audit-status.test.ts` and
  `tests/tools/spec-status.test.ts` that call `expectDatedName`, and the tip
  placement matrix in `tests/ui/panel-element.test.ts:1516` that calls
  `expectOnScreen` — and each of the three helpers holds the assertion.
- **An export named only by a test is a testing seam, not dead code.** Six of
  them sit in `src/ui/panel-element.ts` — `composeClampedPosition`,
  `composeDefaultPosition`, `composeDraggedPosition`,
  `composePositionDeclarations`, `composeTipDeclarations` and `renderPanel` —
  and each is called inside its own file. They were cross-module exports before
  the merge and stayed exported afterwards, which is the surface being wider than
  it needs rather than a name nothing uses. F9 is the one case where nothing
  calls it at all.
- **§9.5's discipline holds where a machine holds it.** No bare `new Error(`, no
  `!` outside tests, no cast off `JSON.parse`, no `localeCompare` anywhere — the
  one construct the register says is spelled nowhere is spelled nowhere. F5 is
  about the primitive that has no row in that table.
- **The material answers the same as it did two days ago.** 7 128 of 7 128
  messages fully read, `unattributed` zero in all six columns on all 17
  recordings, no unreadable message in any of them, 2 867 breakdown rows.
- **The merged `src/ui/` files each open by arguing that they are one subject**,
  and each argument is about what the parts have in common rather than about
  where they came from. `src/ui/panel-screen.ts` names four parts and says why
  none can move without the others; `src/ui/panel-words.ts` names §3's line as
  the thing that holds its three; `src/ui/panel-reading.ts` says it is one module
  rather than a half of the composing, and that it would otherwise import the
  drill back. F11 is about a sentence in the file that was not merged.

## What was not read

- **The prose half of the repository was not read.** `AGENTS.md`, `README.md`,
  `README.en.md`, `NOTICE.md`, `CHANGELOG.md`, `docs/protocol-keys.md`,
  `docs/half-named-figures.md`, `docs/drill-levels.md`,
  `docs/browser-support.md`, the 29 spec bodies and the four prior audits were
  read only where a finding above cites them. The fourth audit read all of them
  at `fee5870`, 20 commits ago, and closed what it found in `8982c55`.
- **Five of the eight files in `src/ui/` were not swept**, and neither was
  anything in `libs/`, `src/core/`, `src/game/`, `tools/` or at the root of
  `src/`. Not swept, by name: `src/ui/panel-view.ts`, `src/ui/panel-element.ts`,
  `src/ui/panel-screen.ts`, `src/ui/panel-look.ts` and `src/ui/cost-overlay.ts`.
  Each mutant costs a full `bun test` and the three files that were swept cost
  327 of them.
- **`src/ui/panel-element.ts`, `src/ui/panel-view.ts`, `src/ui/panel-drill.ts`,
  `src/userscript-entry.ts`, `src/core/fight-statistics.ts` and `tools/` were
  read by outline, by docblock and by each of the six scripted passes — not line
  by line.** Their exports, imports, signatures, comment ranges, catch clauses
  and repeated blocks were all read; their bodies were opened where a pass
  pointed at them. F1, F2, F3, F5 and F11 are what that reading and the sweep
  found in them.
- **The tests were read as subjects, not as prose.** Every test file was read for
  what it names and what it asserts; none was read end to end.
- **`tests/captured-fights/` was not opened.** It was used as material by the
  four tools above; it is evidence (§9.2).
- **The panel was not run**, and `docs/design/panel.html` was not read.
- **Nothing was fetched from the game or from the published help.** No finding
  above is a claim about either, so the question never arose.
