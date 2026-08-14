# The whole tree, read again

Status: closed
Read at: e0098fd

The second audit, twenty commits after the first. The gate was green at
`a54ea70` and is green here, so again nothing below is a bug a machine can see.
What is below is the other half: the prose that has drifted from the tree, the
rules no guard holds, the guards that hold less than the rule they were written
for, and the code nothing needs.

Two of §7.7's triggers were met rather than one. A round touched layers no audit
has read — `src/ui/panel-state.ts`, `src/ui/panel-stylesheet.ts`,
`libs/record.ts`, `libs/source-regions.ts` and `tools/mutation-sweep.ts` did not
exist when the first audit was written. And the same class of fault turned up in
two rounds twice over: an export with no consumer outside its own file (F9 last
time, F22 and F24 here), and a sentence stating a count the tree contradicts
(F10 last time, F2, F3, F4 and F8 here).

⚠️ **One finding invalidated part of this audit's own reading, and that is why
it is F1.** A source file in `tests/` carries literal NUL bytes, so every
`grep -r` over the tree has been silently skipping it. The coverage sweep run for
§7.7 item 6 concluded that four exports of `src/game/engine-battle-wrap.ts` were
named by no test; all four are imported at the top of the test file the search
could not read. Those four claims were withdrawn before they became findings.
Nothing else here rests on a text search alone.

## What was measured

`bun run check` at `e0098fd`, working tree clean:

```
tsc --noEmit          no output, exit 0
bun test              2177 pass, 0 fail, 409572 expect() calls
                      47 files, 1286 ms
bun run build.ts      dist/margometer.user.js, dist/margometer.meta.js
```

Taken before this file existed, and it does not reproduce afterwards:
`tests/tools/audit-status.test.ts` runs its shape checks once per audit and once
per finding, so writing this document adds 61 tests to that count. The figure
above is the tree at `e0098fd`, which is what an audit measures.

Read in full: `libs/` (6 files), `src/core/` (7), `src/game/` (6), `src/ui/` (7),
`src/userscript-entry.ts`, `src/userscript-version.ts`, `tools/` (10),
`build.ts`, the meta-guards under `tests/tools/`, `AGENTS.md`, `NOTICE.md`,
`README.md`, `CHANGELOG.md` and `.github/workflows/`. Against them: §2, §3, §5,
§7.1, §8, §9.1, §9.3, §9.4, §9.5, §9.6, §9.7 and §10.

Two things were measured rather than read. The import graph was rebuilt by hand
from every `from "@/…"` specifier in `libs/`, `src/`, `tools/` and `tests/`, and
every figure a comment in `src/game/` states was re-computed against the eight
captures — 400 engine calls — with a script that reads the JSON rather than
grepping it.

⚠️ **Closed across two rounds, and the first of them is why `Read at:` matters.**
`F1` and `F9` were closed on their own; the remaining twenty-four followed in one
round after that. Every finding below describes the tree at `e0098fd` and is left
in the tense it was written in — what changed is the `*Closes:*` line, which is
the only part of a finding that is about the present.

## Findings

### F1 — a test file that no text tool can read

`tests/game/engine-battle-wrap.test.ts` joins two lists with a separator written
as **two literal NUL bytes in the source** rather than as the escape `\u0000`. TypeScript
accepts it and bun runs it, so the gate has never had anything to say. What it
costs is everything else: `file` reports the file as `data`, and GNU `grep -r`
treats it as binary and skips it without a word.

That is 572 lines invisible to every search over this tree — and they are the
lines holding the promises the add-on makes to the game, which §9.1 calls the one
place to audit. The failure is not theoretical: this audit's own coverage sweep
reported `setBattleWrap`, `removeBattleWrap`, `EngineBattleWrapError` and
`EngineBattle` as named by no test, and all four are imported at the head of that
file. A search that quietly omits a file is §7.5's "extract structure with
structure, not with a search" arriving from a side nobody had looked at: the
grep was right about every file it read.

It is first because every other search in this repository, and in this audit, is
wrong until it is fixed.

⚠️ **This document reproduced the fault while describing it.** The sentence above
was first written with a literal NUL where the escape now stands, so the audit
went into git as a binary blob — `1 file changed, 0 insertions(+)` — and F1 would
have applied to the file reporting F1. Nothing warned: no editor, no gate, no
review of the diff, because there was no diff to read. That is the whole of the
finding in one line, and it is why the close has to be a guard rather than a
correction: the byte is invisible at every point a person would look.

*Where:* `tests/game/engine-battle-wrap.test.ts:539`
*Closes:* guard `tests/tools/tracked-text.test.ts`

### F2 — three sentences say the panel divides by turns, and nothing counts turns

§6.2 says `tools/fight-report.ts` "prints the turn axis too, because every rate
divides by it and it is not in a message". §8 says the same tool prints "the
turns the game numbered, which the panel divides by", and that
`tests/captured-fight-catalog.ts` holds "the turns a whole capture came to,
because two tests need them and one of them is checking the other".

Neither file contains any turn code at all, and no test asks either of them for
one. §10 states the opposite in the same document, as a ⚠️: *nothing here counts
them; the panel shows totals only — no rate, no divisor*. `README.md` says it
too. This is residue of the two readings withdrawn in `a01bf11`, still being
described as a live feature by the section whose own opening says that listing
what does not exist is how this document starts lying.

*Where:* `AGENTS.md:189`
*Closes:* commit

### F3 — "every capture on disk holds null", and six of the eight do not hold it

`src/game/fight-capture.ts` explains why `otwarcie` is no longer collected and
ends: "nothing reads it, and every capture on disk holds null". Measured across
`tests/captured-fights/`: the key is present and null in two captures and
**absent entirely** from the other six.

What makes it worth a finding rather than a typo is where it came from. The
sentence was **edited by `e0098fd`** — the commit titled "the prose stops
counting the captures wrong" — from a true claim about two captures into a false
claim about eight. The generalisation is exactly what the newer writer path
stopped emitting, so the round that was fixing this class of fault created a
fresh instance of it, one commit before this audit read the tree. The older
wording survives in `docs/specs/2026-08-11-capturing-a-fight-to-disk.md`, where
it is still true, because a spec is dated.

*Where:* `src/game/fight-capture.ts:247`
*Closes:* commit

### F4 — a fourth file ships Polish, and the guard written for that cannot see the word

`src/userscript-version.ts` falls back to a Polish phrase when nothing was
substituted at build time, and that phrase reaches the player: the title bar
draws it at `src/ui/panel-element.ts:615`, and the copied report carries it.

`tests/tools/source-layout.test.ts` holds a frozen list of the files allowed to
carry Polish, and its docblock says a fifth one appearing "is a decision somebody
should have to make on purpose". The list holds three, so the fourth arrived
without anybody making that decision — because the guard detects Polish by
diacritic, and this phrase has none. A frozen list is the right shape (no pattern
can tell a label from an identifier); what is missing is that the detector
deciding *what to freeze against* is narrower than the rule.

The count is stated four times and no two agree: `AGENTS.md:568` and `:838` say
three, `CHANGELOG.md:22` says three, `tools/changelog.ts:8` says one. This is
F10 of the first audit, in the same sentence, one file further along.

*Where:* `src/userscript-version.ts:12`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F5 — §2's scope table has stopped naming two directories of the tree

The table gives a path for `libs/`, `src/core/`, `src/game/`, `src/ui/`,
`tests/captured-fights/`, `tools/` with `build.ts`, and `docs/`. Every path it
lists exists. Two tracked directories appear in no row: `.github/workflows/` and
`.claude/skills/verify/` — both of which §8 describes at length, and neither of
which any scope tag reaches.

The table's own ⚠️ says a directory missing from it "is the first sign the rules
have drifted from the tree", and grants exactly one exemption, for `tests/`
outside the captures. Whether these two want a scope of their own or an
exemption sentence is the question; being absent without either is not an answer
the table admits.

*Where:* `AGENTS.md:66`
*Closes:* commit

### F6 — §8's block enumerates the test files and misses two

`tests/game/fight-capture.test.ts` and `tests/tools/captured-fight-intake.test.ts`
appear nowhere in `AGENTS.md`, while every other file in both directories is
named — five of the six under `tests/game/`, thirteen of the fourteen under
`tests/tools/`. Both are the tests of modules §8 does describe.

`tests/tools/structure-block.test.ts` asks `git ls-files` for `libs`, `src` and
`tools` only, and says why: §8 summarises `tests/` on purpose, several tests
share a line, and demanding an entry per file would be demanding a different
document. That reasoning covers a test folded into a shared line. It does not
cover a test named nowhere at all, in a block that names its fifty-seven
neighbours.

*Where:* `AGENTS.md:1096`
*Closes:* commit

### F7 — five docblocks in shipped source sit above the wrong declaration

A doc comment immediately followed by a second doc comment: the first documents
nothing, and reads as though it described what follows it.

- `src/core/fight-decoder.ts:422` describes the standalone declaration keys,
  which are declared thirty lines later; the block and export for
  `UNATTRIBUTABLE_HEALTH_KEYS` sit between them.
- `src/core/fight-statistics.ts:26` describes `CombatantStatistics`, declared at
  `:63`; `SkillStatistics` sits between.
- `src/ui/panel-view.ts:985` describes what a skill section counts; the block for
  the closing row follows it immediately.
- `src/userscript-entry.ts:249` reads "The one global read in the add-on, and its
  one global write" and now heads a type. It belonged to the assignment at
  `:795`. The claim is also not true as written and §8 repeats it:
  `src/game/engine-attachment.ts:130` defaults to `setInterval` and
  `clearInterval` when no clock is injected.
- `tests/captured-fight-catalog.ts:24` describes `CAPTURED_FIGHTS`, declared at
  `:77`.

Eight more of the same shape are in tests. Each is individually harmless and the
class is not: §9.3 admits a comment only where it earns its place, and a comment
attached to the wrong thing has stopped earning it — a reader takes the reasoning
for the next declaration's, which is how a decision gets applied to something
nobody decided it about.

*Where:* `src/core/fight-decoder.ts:422`
*Closes:* commit

### F8 — the count the fixing commit did not reach

Eleven sentences still say "both" or "the two" of a corpus of eight:
`src/core/fight-statistics.ts:229`, `src/game/battle-session.ts:7`,
`src/game/engine-roster.ts:142`, `src/game/fight-capture.ts:8`, `:29` and `:51`,
`AGENTS.md:1172`, and four tests.

Recorded apart from F3 because the direction is different and it matters. Every
one of these was **re-measured against all eight captures and the substance
holds** — one winner and one loser per fight, `init` on call 0 and never again, a
call with an empty warrior list in each, `wersja: 1` throughout, `npc` absent
from all 8 515 snapshot entries. Only the count word is wrong, which is why
nothing has ever gone red over it: these are claims that got *more* true as
material arrived and kept the arithmetic of when there were two.

*Where:* `src/game/fight-capture.ts:8`
*Closes:* commit

### F9 — §9.1's newest sentence was false on the day it was written

§9.1 says: *"A tool may read `tests/`; nothing in `tests/` reads a tool for its
material."* That clause was added one round ago, by the commit closing the first
audit's F16.

`tests/captured-fight-catalog.ts` imports `parseFightDump`,
`getMaximumHealthByCombatantId` and `getStartingHealthByCombatantId` from
`tools/fight-dump-parser.ts` and calls all three to build `CAPTURED_FIGHTS` —
the material every core, game and ui test measures against. So the directory
graph holds the cycle the rule denies:
`tools/fight-report.ts` → `tests/captured-fight-catalog.ts` →
`tools/fight-dump-parser.ts`.

The catalog argues its case well in its own docblock — read with the same reader
the tooling uses, so the live path and the offline path cannot disagree about
what a capture says. The finding is not that the code is wrong. It is that a rule
was written to close a finding, the tree already contradicted it, and **no guard
holds the `tests → tools` direction at all**: the layer tests cover `libs`,
`src/core`, `src/ui` and `src/game`, and stop there. A rule nobody is held to is
the shape the first audit's F16 was supposed to end.

*Where:* `tests/captured-fight-catalog.ts:6`
*Closes:* rule §9.1

### F10 — the guard closes the cycle on one side and leaves it open on the other

`tests/tools/source-layout.test.ts` forbids `game → ui` and
`game → the entry point`, and says why: the entry point is the file allowed to
know every layer, so nothing may know it back. The `ui` test directly above it
forbids only `ui → src/game/`. **`ui → the entry point` would pass the gate**,
and the warning block on that same test records that this exact class of edge —
a `src/ui` file reaching outside its layer — already broke a direction in silence
once, through a type import that compiles away.

The weaker form is live today: `src/ui/panel-element.ts:35` imports
`USERSCRIPT_VERSION` from `src/userscript-version.ts`, which is none of core,
game, ui or the entry point — a fifth thing at the root of `src/`, on an edge
§9.1 draws nowhere. Nothing is wrong at run time; §8 states the two readers on
purpose. It is the first audit's F16 again: the graph §9.1 draws is not the graph
the tree has, and an undrawn edge is one nobody can be held to.

*Where:* `tests/tools/source-layout.test.ts:152`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F11 — §9.5's register has drifted from the guard that holds it

§9.5's table lists three owners. The guard holds four: `libs/record.ts` owns the
`typeof … === "object"` narrowing, its own docblock cites §9.5 as the rule that
admits it, and §8 describes it — but it is absent from the table that §9.5's own
first instruction ("look in `libs/` first — it is there") sends a reader to.
§9.5's fourth instruction says a new primitive lands with its entry in the
guard's register **and** in §8; it landed in both, and not in §9.5.

The same table omits `.toString(` with a radix from the "Owns" column, which the
guard has owned since the first audit's F7 closed, and omits the whole write side
from "Reading gives" — `composeIntegerText`, `composeDecimalText`,
`composeHexadecimalByteText` and `getIntegerFromHexadecimalText` — although rules
3 and 4 spend a paragraph on the difference between reading and writing.

Second limb, in the other direction: §9.5 ends by binding the register "in tests
too", and the guard binds only half of it that way. The unnamed coercions —
`String(`, unary `+`, `* 1`, `typeof … === "number"`, `typeof … === "object"` —
are checked in `libs/`, `src/` and `tools/` and not in `tests/`, for a reason
written in the guard and absent from the rule. It is the rule that is wrong here,
not the exemption: `tests/core/fight-statistics.test.ts:447` spells `String(id)`
as a test label, which is not a value being read.

*Where:* `AGENTS.md:1555`
*Closes:* rule §9.5

### F12 — the one owner nothing holds to spelling what it owns

`tests/tools/source-layout.test.ts` runs a test for each owner asserting that it
still spells the construct it owns, and its comment says why: a primitive that
quietly stopped doing the thing it owns would leave every file passing while
nothing was reading values at all.

That test iterates the owned-construct list, and `libs/record.ts` has no row in
it — it appears only in the exemption further down. So if `libs/record.ts`
stopped doing its `null` check, the guard written for exactly that failure would
pass. `tests/libs/record.test.ts` would catch it, which is the reason nothing is
broken today and not a reason the guard should agree with the bug it exists to
prevent (§7.5).

*Where:* `tests/tools/source-layout.test.ts:273`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F13 — the sweep's per-file table is judged by the parser the same file says must not judge

`tools/mutation-sweep.ts` counts a file's survivors from `killedBy.length === 0`
in its per-file table, and the report's totals from `!isKilled` at the bottom.
`killedBy` is parsed out of what `bun test` printed; `isKilled` is the exit
status. A mutant that stops the suite loading at all turns the gate red and
produces no failure line to read — so it is a kill in the total and a survivor in
the table above it, and the two halves of one report disagree.

This is §7.5's rule — *what decides is the status; what parses is description* —
broken in the file whose own docblock records paying for it once already, in the
same field, for the same reason.

*Where:* `tools/mutation-sweep.ts:358`
*Closes:* commit

### F14 — a run that never happened reads as a kill

The verdict comes from `result.status !== 0`. `spawnSync` sets `status` to `null`
when it times out and when the process cannot be spawned at all, and `null` is
not `0` — so both read as red, which reads as killed. `result.error` is never
looked at, and the timeout is 120 seconds against a suite that takes under two.

A mutant that hangs the suite is therefore reported as killed. Worse, on a
machine where `bun` is not on the path the sweep reports **every mutant killed**:
a tool whose whole purpose is finding tests that cannot fail, answering that none
of them can. That is the same failure the docblock above `isKilled` was written
about, surviving in the one place the fix did not reach.

*Where:* `tools/mutation-sweep.ts:268`
*Closes:* commit

### F15 — the sweep's operators rest on a convention nothing holds

The rule list explains that every operator is written with the spaces around it,
and that this is what keeps the sweep out of trouble, "because the tree is
formatted". Nothing formats it. There is no prettier, biome, dprint or
editorconfig in the repository, no `format` script, and no formatting step in
either workflow — §9.3 removes the linter deliberately and puts the compiler in
its place, and the compiler does not care about spaces.

Written `a+b`, no mutant is generated there, and the report says nothing was
found — silently, in the direction that costs, because the value of that report
is its survivors.

Measured at this commit: every binary operator in `libs/`, `src/`, `tools/` and
`build.ts` carries its spaces; the only matches for the unspaced forms are inside
string and regex literals. So the convention holds, and nothing holds the
convention.

*Where:* `tools/mutation-sweep.ts:98`
*Closes:* guard `tests/tools/mutation-sweep.test.ts`

### F16 — `JSON.stringify` has three uncoordinated answers, one of them a state key

It is not in §9.5's register, and it meets both halves of the criterion: it
returns `undefined` rather than a string for `undefined`, a function or a symbol,
and it turns `NaN` and `±Infinity` into `null`.

The tree already holds three different decisions about it, and no file says which
it meant:

- `src/ui/panel-placement.ts:118` refuses it and writes the JSON by hand, with
  the trap spelled out — "a position that quietly stops round-tripping is the
  silent failure this project is built against".
- `src/game/fight-capture.ts:231` writes `JSON.stringify(value ?? null)`, which
  is a defence against the `undefined` return with nothing saying so.
- `src/game/fight-capture.ts:219` and `src/userscript-entry.ts:705` use it bare.

Where it can bite is the second `fight-capture.ts` site: that call composes the
identity key deciding whether a combatant snapshot changed, so an `undefined`
member makes two different states share one key and a call leaves a recording
with no mark. This is the sentence `libs/record.ts` was written to close, for a
different construct, one directory over.

*Where:* `src/game/fight-capture.ts:219`
*Closes:* rule §9.5

### F17 — numbers written into the DOM by interpolation, in the layer that draws them

`src/ui/panel-view.ts` puts every number a player reads through
`composeIntegerText`, `composeDecimalText` or `composeFigureText`.
`src/ui/panel-element.ts` interpolates four of them raw:

- `:181` and `:519` write a percentage from a fraction, so a fill of one tenth
  becomes `width: 10.000000000000002%`. `panel-view.ts` already rounds the same
  quantity through `composeDecimalText` for the text beside it.
- `:457` writes the row count into a custom property. `${1e21}` is `"1e+21"` and
  `${NaN}` is `"NaN"`; either makes the declaration invalid and the list's height
  wrong with nothing marked. `composeIntegerText` asserts on exactly those two.
- `:735` writes a coordinate taken from a pointer event, which is fractional on a
  scaled display.

The guard cannot see any of it: the register matches `String(`, and a template
literal is the same coercion in a spelling no pattern in the list covers. So one
layer holds two answers to "how do we write a number into the DOM", and the
disciplined one is the file that computes the numbers while the loose one is the
file that draws them.

*Where:* `src/ui/panel-element.ts:181`
*Closes:* commit

### F18 — the build-number pattern, written twice across a layer boundary

`/main\.min(\d{10,})\.js/` is spelled at `src/userscript-entry.ts:349` and at
`tools/game-client-source.ts:58`. The comment above the first one **names the
second**: the same place the tool reads it, "so the number in a recording and the
number in the cache mean the same thing".

The coupling was noticed, written down, and then left to a sentence. If the two
drift, a recording claims a build the cache never fetched, and §7.6's rule that
material without the client's version is not comparable material stops holding
without anything going red. `tools/game-client-source.ts:55` carries a third
spelling of the same build-id shape.

*Where:* `src/userscript-entry.ts:349`
*Closes:* commit

### F19 — the tool that re-implements the grammar whose owner it imports

`tools/decoding-status.ts` removes one key from a message by splitting on `";"`,
splitting each segment on `"="`, and skipping the first two because they are the
sides. All three of those facts belong to `src/core/protocol-message.ts` — the
separator, the key/value split, the two-sides rule and the rebuild — and the tool
**already imports that module** for something else.

§9.4 makes the `parse`/`decode` split load-bearing: the grammar lives in one
place and what a key means lives in another, and keeping the verbs apart keeps
the layers apart. This is the grammar half spelled outside its owner, in the tool
whose output is the queue §7.6 says the next question comes from. A change to the
grammar leaves it reporting against the old one.

*Where:* `tools/decoding-status.ts:34`
*Closes:* commit

### F20 — "the messages of a captured fight", spelled seventeen times

`fight.dump.calls.flatMap((call) => call.protocolMessages)` appears seventeen
times across eleven test files under `tests/core/`, `tests/game/`, `tests/ui/`
and `tests/tools/`.

The module that would own it exists and already owns this class of thing:
`tests/captured-fight-catalog.ts` holds `composeRosterOfFight`, whose docblock
says it is "one function rather than three copies because three callers needed
it". §7.1 puts a shared module at the second consumer; this is inside a module
that already exists, which §9.5's third instruction says does not even need the
threshold argued.

*Where:* `tests/captured-fight-catalog.ts:67`
*Closes:* commit

### F21 — two tools order their output by whatever machine ran them

`src/ui/panel-view.ts:506` breaks ties between equal figures with
`localeCompare(…, "pl")`. `tools/fight-report.ts:40` and
`tools/decoding-status.ts:111` call `localeCompare` with no locale, which reads
the runtime's default — so the order of both tools' output is a property of the
machine rather than of the data.

It meets §9.5's criterion squarely: more than one spelling (`localeCompare`,
`Intl.Collator`, `<`) and an answer nobody wrote. `decoding-status` is the tool
whose ranking decides what gets investigated next, so two people comparing its
output on differently configured machines see a difference that is not in the
protocol.

*Where:* `tools/decoding-status.ts:111`
*Closes:* rule §9.5

### F22 — an export that exists to keep the compiler quiet

`RESERVED_COLOURS` has **exactly one occurrence in this repository: its own
declaration.** Nothing reads it — not code, not a test, not `docs/`, not
`docs/design/panel.html`.

It cannot simply lose the `export` either. The eight series colours are
destructured on one line, six of them go to the profession table, and this
constant is the only reader of the remaining two. As a local it would be an
unused local, and `noUnusedLocals` would refuse the file. So **the `export` is
what stops the compiler from reporting two names nothing draws** — §9.3 puts the
compiler in place of a linter precisely to catch code that does not exist yet,
and this is the one construct that switches it off. The comment beside it
explains the local ("kept named so the palette's shape stays visible"); nothing
explains the export.

*Where:* `src/ui/panel-tokens.ts:62`
*Closes:* commit

### F23 — a count kept for nobody

`composeFailureSink` returns a `report` and a `getSilenced`. Both call sites that
ship take `.report` and drop the object, so nothing holds a reference through
which the count could ever be read. Its docblock says the repeats are counted
"so a report can say how many followed the one that printed" —
`composeReportText` carries no such field, and nothing else asks.

The only reference outside the file is a test, which is what makes it look
wanted. §7.1: nothing exists before it is needed, and a counter with no reader is
either a report field that was never written or a line that should go.

*Where:* `src/userscript-entry.ts:103`
*Closes:* commit

### F24 — three names, and no test names any of them

Not a percentage — three names (§7.7):

- `composeSourceWithBlankedComments` at `libs/source-regions.ts:63` is exported
  and referenced only inside its own file. Same shape as the first audit's F9,
  which closed by removing the export.
- `composeFigureText` at `src/ui/panel-view.ts:237` formats **every number the
  player reads**, has twenty-seven callers inside its own file and no reference
  anywhere under `tests/`.
- `getPhraseCounts` at `tools/help-article.ts:305` is what `freeze` uses to
  produce `tests/frozen-help-phrases.ts`. So the counts that re-earn the
  register's help claims on every run of the gate are produced by a function
  nothing tests — the guard is held to its input and its input is held to
  nobody.

Recorded without findings of their own, for whoever closes this one:
`USERSCRIPT_VERSION`, `FightStatistics`, `BattleSession` and `PAGE_HANDLE` are
named by no test either, and `tools/fight-report.ts` — 130 lines, no exports —
is named nowhere under `tests/` at all.

*Where:* `libs/source-regions.ts:63`
*Closes:* guard `tests/ui/panel-view.test.ts`

### F25 — the stylesheet states §9.7 and breaks it

`src/ui/panel-stylesheet.ts` opens by saying that everything it draws with is a
token and that "a raw hex in a rule here is a bug". The same file writes `#000`
in the hatch mask at `:297` and a shadow colour at `:345`, neither of which is in
`PANEL_TOKENS`. It also spells a radius raw in five rules, and writes the two
lengths of `PANEL_TOKENS.spaceRegion` as bare numbers in two more — the token
that exists so those two cannot drift.

Nothing holds §9.7's token rule as text. `tests/ui/panel-element.test.ts`
measures contrast, which is the other half of §9.7, and neither of these two
colours is on a path it measures.

*Where:* `src/ui/panel-stylesheet.ts:297`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F26 — size, recorded again against a bigger file

`src/ui/panel-view.ts` was 1598 lines when the first audit's F17 declined
splitting it. It is 1722 now, and holds number formatting, the label vocabulary,
the ranking, the drill, the warnings, the title, the sides summary and the height
arithmetic. `src/userscript-entry.ts` is 833 and
`src/core/fight-decoder.ts` is 870.

Recorded rather than argued, and recorded because a decline inherited in silence
stops being a decision. The argument that closed F17 — all of them read linearly,
all are the most heavily tested code here, and a split moves the risk rather than
removing it — has to be made against the file as it is now, not as it was.

*Where:* `src/ui/panel-view.ts`
*Closes:* declined — all three still read linearly and are the most heavily tested code here, and the round that read them found their faults in single lines rather than in the shape; a split moves the risk rather than removing it, and none of them needs a table of contents to be read in order

## Looked at and clean

Each of these looks like a fault from a distance and is not. They are here
because *not looked at*, *looked at and clean* and *a finding* are three answers,
and the first goes missing by silence (§7.7).

- **The layering graph matches §9.1 everywhere the rule draws a line.** Built by
  hand from every specifier: `libs/` reaches upward nowhere, `src/core/` imports
  only itself and `libs/` and names no browser global, `src/ui/` never imports
  `src/game/`, `src/game/` never imports `src/ui/` or the entry point, and only
  `src/userscript-entry.ts` knows every layer. F9 and F10 are about edges the
  rule does **not** draw.
- **No network anywhere in `src/` or `libs/`** — no `fetch`, `XMLHttpRequest`,
  `WebSocket` or `sendBeacon`. Searched directly rather than inferred from the
  guard being green.
- **No `!` outside tests, no bare `new Error(`, no `any`, no `@ts-ignore`, no
  `TODO`/`FIXME`/`HACK`, no cast off `JSON.parse`.** Zero hits each.
- **Every function declaration in `libs/`, `src/`, `tools/` and `build.ts` starts
  with a verb §9.4 admits** — checked by parsing the declarations rather than by
  eye, zero exceptions. No contracted identifier, no `index.ts` or `utils.ts`.
- **`??` against `||` on numbers: forty-one sites and every one is `??`.** There
  is no `|| 0` in the tree, which is the spelling that turns a measured zero into
  a substituted one — the failure §9.5's last table row exists for.
- **Every regex `exec` result is null-checked or `assertDefined`-ed before it is
  indexed.**
- **The broad `catch` blocks in `src/ui/` are §9.6's isolation, not §9.5's
  laxity.** §9.5 asks for a narrow catch around a call that fails one known way;
  these sit around arbitrary render code, §9.6 makes the isolation a structural
  requirement, and `renderRegionInto` is where that requirement is met rather
  than habitually observed.
- **Eight figures stated in `src/game/` comments reproduce exactly**: the 400
  engine calls and the 380 payloads carrying messages, the 1 794 roster entries
  and the bimodality the definition rests on, the boar capture delivering all 18
  of its messages in one payload, the 157 messages on call 0 of the experimental
  capture, `NOTICE.md`'s 38 sentences in the older recording's `render`, and the
  43 entries `tests/ui/panel-names.test.ts` records.
- **`NOTICE.md` and `README.md` read in full against the code, and every claim
  holds.** The frozen key table carries keys and no prose; `render` is skipped
  for the stated reason; nicknames are substituted and a test holds the files to
  it; `.cache/` is untracked and asserted so; the wrap runs the original first
  and returns its value untouched; the release attaches both built files and
  compares the tag against `package.json`.
- **`CHANGELOG.md`'s released section read entry by entry against the tree**;
  every behavioural claim is true of the code at this commit.
- **Every spec in `docs/specs/` is `Status: implemented`**, and
  `docs/design/panel.html` is named by three of them, so §8's condition for
  admitting it into `docs/` holds.
- **`tests/frozen-help-phrases.ts` was fetched five days before this reading**,
  inside the week §7.6 sets before a re-fetch is owed.
- **`libs/record.ts` and `libs/source-regions.ts` are well argued** and each
  names the trap it closes. F12 and F24 are about a guard and a test, not about
  the code.

## What was not read

- **`docs/protocol-keys.md`'s entries were not re-earned.**
  `tests/core/protocol-key-register.test.ts` re-measures every one against the
  captures and the frozen tables on each run, so reading them by hand measures
  the guard rather than the register.
- **The served game build was not compared against `.cache/`.** §7.6's check is a
  network request, and an audit is a reading of this tree. The cached bundle was
  fetched five days before this reading.
- **The mutation sweep was not run.** F13, F14 and F15 are readings of the tool's
  source, not of its output; a sweep runs the whole gate once per mutant and
  writes into the working tree, which is its own round.
- **`tests/captured-fights/` was not opened as prose.** It was measured as data —
  eight files, 400 calls, 8 515 snapshot entries — and never read for its
  wording; it is evidence (§9.2).
- **`docs/design/panel.html` was not read.** §8 calls it a drawing and not a
  source, so a disagreement there is not a finding about the code.
- **`docs/specs/` was read for its status lines and its path claims**, not
  sentence by sentence. The stale capture counts of F8 are in several specs too,
  and are not filed: a spec is a dated record of a decision.
- **`src/ui/panel-view.ts` and `src/ui/panel-element.ts` were not read end to
  end** — the parts §8 makes claims about, plus everything F17, F25 and F26
  touch.
- **The panel was not run.** `.claude/skills/verify/` is how it would have been
  looked at, and the gate cannot see a panel either.
- **Dynamic `import()` was not searched for** when the graph was built. A spot
  check found none; it was not proved.
