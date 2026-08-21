# The rest of the code, read for its smells

Status: open
Read at: af3f1ec

The sixth audit, and the second of the same day. The fifth read the code at
`7097aee` and named five of the eight files in `src/ui/` and the whole of
`libs/`, `src/core/`, `src/game/` and `tools/` as unswept, and the bodies of the
six largest files as read by outline rather than line by line. Its twelve
findings closed in `af3f1ec`. This one is the half it said it had not read, asked
for by name.

Where the fifth found four defects in one file, this one finds that the same
question answered elsewhere comes back almost clean — `src/core/fight-statistics.ts`,
`src/core/fight-decoder.ts` and `src/core/battle-event.ts` are held to a standard
`src/ui/panel-drill.ts` is not — and that the instrument used to say so reports a
whole class of its answers in a way no reader can act on.

Three of the findings below are about the seams rather than the code: what a test
composes its material from, what the development overlay and the terminal report
each call the same column, and where a file's own argument sits. One is about
this repository's own instrument.

The gate is green at `af3f1ec`.

## What was measured

`bun run check` at `af3f1ec`, on a tree carrying one modification — `TODO.md`,
the maintainer's own:

```
tsc --noEmit                     no output, exit 0
tsc --noEmit -p tsconfig.userscript.json
                                 no output, exit 0
bun test                         5095 pass, 0 fail, 1549455 expect() calls
                                 72 files, 5.4 s
bun run build.ts                 dist/margometer.user.js, dist/margometer.meta.js
```

**The mutation sweep, over five files no sweep had ever touched**, in three
detached worktrees at `af3f1ec` running in parallel — the tool now refuses a tree
whose gate is already red, which is what makes a parallel run readable at all:

```
src/core/fight-statistics.ts    78 mutants     3 survived
src/core/battle-event.ts        24 mutants    14 survived
src/core/fight-decoder.ts      233 mutants    15 survived
src/ui/panel-view.ts           243 mutants    65 survived
src/ui/panel-screen.ts         119 mutants    24 survived
```

and the fifth audit's three files swept again after its closes, which is how this
round starts:

```
src/ui/panel-reading.ts         24 mutants     0 survived
src/ui/panel-words.ts          104 mutants     1 survived
src/ui/panel-drill.ts          190 mutants    27 survived
```

**A survivor list is not a list of gaps, and reading it as one is how this round
began.** Every survivor above was put to `tsc`, and eleven were re-run by hand.
Of `src/core/battle-event.ts`'s 14, every one is a member of a type union that
the compiler refuses; of the decoder's 15, the same, plus one arithmetic mutation
that cannot change an answer — `amount * sign` becomes `amount / sign` where
`sign` is `1` or `-1`. `src/core/` carries, after that reading, **no surviving
mutant that changes what the add-on computes**.

`src/ui/panel-view.ts`'s 65 do not reduce that far, and they do not stand either:
of the nine lines sampled by hand, four are caught by the gate when the obvious
mutation is made — which means the tool mutated a **different occurrence on the
same line** and its report cannot say which (F3) — three are figures that are
zero in every recording, so two operators agree on the material, and two are
real. One of the two is F1.

**Two timings, because a claim in this repository rests on them.** On this
machine at `af3f1ec`: `tsc --noEmit` 2.1 s, `bun test` 5.4 s.

Six scripted passes over the whole tree, reading it through `git ls-files` and
comments through `libs/source-regions.ts`: every string literal spelled in more
than one file (105 of them), every repeated run of five or more lines in `tools/`
and in `tests/`, every `catch`, every type assertion (10), every first docblock's
position, and every call composing statistics over captured material (10).

**What a fixture is made of, measured rather than read** (F2): composing every
recording with and without the entry health, and comparing what each says
healing came to.

What was read, and how far: `src/game/battle-session.ts` from `composeNextEvents`
to the end; `src/ui/panel-look.ts` down to its token tables;
`src/ui/cost-overlay.ts` down to its declarations; `src/userscript-entry.ts` from
`composeFailureSink` through the wrap inside `setMargoMeter`;
`src/core/fight-decoder.ts`'s two named-combatant decoders and every line the
sweep pointed at; `libs/running-total.ts` and `libs/elapsed-spans.ts` whole; and
the docblock of every file the passes above named. No large file was read line by
line, which is the same admission the fifth audit made and the reason this one
leans on the sweep.

## Findings

### F1 — one line of the panel's arithmetic is written twice and tested once

`src/ui/panel-view.ts` cuts a pinned figure by what it was named with, and it
does it twice: `getNoActorDamageBySource` at `:293` and `getNoActorHealingBySource`
at `:336`. Both open the same way, with the same line — `if (!isCharged(id))
continue;` — which is what keeps the cut to the side on screen.

Drop the negation on line 293 and 17 tests go red. Drop the identical negation on
line 336 and **nothing does**.

What the healing side would then show is every combatant's unhealed share except
the ones the screen is about — the figure inverted, on the row the panel pins
under a side tab, with the label and the bracket unchanged. It is the same fault
`docs/specs/2026-08-18-a-figure-with-no-actor-has-no-side.md` was written for,
reachable again through the half nothing holds.

The two functions are the twins §9.3 warns about, one line apart in the file, and
the tests grew on one of them.

*Where:* `src/ui/panel-view.ts:336`
*Closes:* open

### F2 — four of the ten fixtures compose a fight the panel would not draw

Ten places compose statistics over captured material. Four of them leave out the
entry health, and one of those leaves out the roster as well:

| where | roster | entry health |
|---|---|---|
| `tests/core/fight-statistics.test.ts:64` | yes | yes |
| `tests/core/injure-rule.test.ts:322` | **no** | **no** |
| `tests/game/engine-attachment.test.ts:1764` | yes | yes |
| `tests/ui/panel-drill.test.ts:59` | yes | **no** |
| `tests/ui/panel-drill.test.ts:339` | yes | yes |
| `tests/ui/panel-view.test.ts:1207` | yes | yes |
| `tests/ui/panel-words.test.ts:298` | yes | **no** |
| `tests/ui/panel-words.test.ts:314` | yes | **no** |
| `tools/drill-report.ts:129` | yes | yes |
| `tools/fight-report.ts:100` | yes | yes |

What the missing argument costs is not small. Composing every recording both ways:
on **14 of the 17**, healing more than doubles once the entry health is passed —
122 648 against 346 284 on `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`,
27 082 against 93 590 on `2026-08-15-tempest-grupa-vs-draugr-1.json` — and the
`unaccounted-health` count falls to zero, because that is precisely what the entry
health is for: sizing what the game states about a whole side.

The two tools carry a comment saying they read *the same reading the panel is held
to*. The tests carry nothing, and `tests/ui/panel-drill.test.ts:59` is the fixture
the whole file runs on — every assertion about what a breakdown holds, including
the four this repository added today, is made against a fight whose healing is
less than half of what the panel would show. Nothing there is wrong: the
assertions are about a section closing against the row it was entered from, which
is true either way. What is missing is anybody having decided it.

`tests/captured-fight-catalog.ts` is where this would live: it already hands out
the material, the roster and the messages, and it is the one file every one of
these ten reads.

*Where:* `tests/ui/panel-drill.test.ts:59`
*Closes:* open

### F3 — the sweep reports what it cannot be asked about, and the figure its silence rests on is wrong

`tools/mutation-sweep.ts:22` says why the typecheck is not run per mutant:
*"because a typecheck per mutant would cost more than the run and a mutant that
fails to compile is not a behaviour anybody could have tested."*

Both halves are trouble. The cost is measured above and it is the other way
round: `tsc --noEmit` takes 2.1 s where `bun test` takes 5.4. Running the
typecheck **first** would make those mutants *cheaper* than they are now, because
a mutant tsc refuses needs no test run at all.

And the second half argues for not counting such a mutant — which is exactly what
the tool does not do. It reports it as a survivor, in the same list as a real
one, marked only by an operator name. What that costs is the whole of this
round's reading: 14 of `battle-event.ts`'s 24, every one of the decoder's 15, 7
of the drill's 27, and 10 of the 73 the fifth audit read. Every one of them had
to be put to `tsc` by hand to be dismissed, and the fifth audit dismissed a class
of them by sampling two.

⚠️ **And the report names a line, not an occurrence.** `src/ui/panel-view.ts`
carries `if (!isCharged(id)) continue;` twice — at `:293`, where the negation is
held, and at `:336`, where it is not. A survivor line reading `:938 / → *` on a
line with three divisions is the same problem in the ordinary case: the reader
cannot reproduce the mutant without re-running the tool over the file. The
`Mutation` the tool builds carries the offset that would settle it; the line it
prints does not.

*Where:* `tools/mutation-sweep.ts:24`
*Closes:* open

### F4 — the fifth audit's boundary finding closed less than its own note claims

`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F2, named twenty-one
edges and its close note names three as left over: the fill divisor, a fold's `0`
seed and one `Math.max(rest, 0)`.

Swept again after that close, `src/ui/panel-drill.ts` returns 27 survivors. Seven
are the compiler's (F1). The other twenty are edges, and they are not three:
`row.skillsUsed > 0` at `:215`, the `amount > 0` filter at `:437`, `orphan > 0` at
`:461` and `:958`, `amount <= 0` at `:577` and `:771`, `rest > 0` at `:626` and
`:824`, `plainBlows > 0` at `:634`, the `?? 0` at `:906`, the metric comparison at
`:193`, and a comparator at `:932` that the new ordering tests do not reach.

The close was honest about being partial and wrong about the size of the part.
That is worth its own finding rather than a correction, because the shape recurs:
a close that ends with *what is left is named* is trusted, and the naming was done
by reading the finding rather than by sweeping again.

*Where:* `src/ui/panel-drill.ts:437`
*Closes:* open

### F5 — one table, two files, and the module that exists to stop exactly this

`src/ui/cost-overlay.ts` draws what the add-on cost beside the panel in a
development build; `tools/payload-cost.ts` prints the same figures in a terminal.
Both spell the same four column headings — `phase`, `calls`, `total ms`,
`worst ms` — and both hold a `NAME_COLUMN` and a `NUMBER_COLUMN` of their own.

`src/cost-phases.ts` exists in this repository because *a name written twice is
two names that eventually disagree*, and it holds the phase names the rows are
keyed by. The headings above those rows were left out of it, so the vocabulary of
one table is decided in two files with nothing holding them together — §9.3's
case, and the failure is the quiet one: the overlay and the report drift and both
go on printing.

The same file takes its colours from `PANEL_TOKENS` and writes its spacing by
hand: `"8px"` three times where `PANEL_PIXELS.space` is `8`. §9.7's rule is that a
raw hex in a rule is a bug; the spacing is the same argument one step down, and
the overlay is where the two conventions meet in one declaration list.

*Where:* `src/ui/cost-overlay.ts:32`
*Closes:* open

### F6 — the decoder spreads both ends of a message by hand, nine times

`src/core/fight-decoder.ts` reads the two ends of a parsed message —
`parsed.actor?.combatantId ?? null`, `parsed.target?.combatantId ?? null` and the
two health percentages beside them — at `:722`, `:840`, `:911`, `:927`, `:951` and
`:984`, nine spellings of `?.combatantId ?? null` in all, five of the health pair.

This is the shape the fifth audit's F6 collapsed one module away, in
`src/core/combatant-health.ts`, where the same four lines stood in two branches
and no test could tell them apart. Here they are the same four lines in five
places, each building a different event kind out of them.

Nothing is wrong today. What the fifth audit paid for is that a fold repeated per
branch is a fold nothing distinguishes, and this is the larger instance of it in
the file that decides what every event means.

*Where:* `src/core/fight-decoder.ts:911`
*Closes:* open

### F7 — a heading that cannot be drawn

`SOURCE_HEADINGS` in `src/ui/panel-drill.ts:711` gives every metric a heading for
the cut of what a figure was made of, and `healingGiven`'s is `OD CZEGO`. Two
lines above it, `composeSourceEntries` returns an empty list for that metric and
says why: the source keys the game states belong to whoever received the health,
so a giver has none.

So the entry is vocabulary for a section that cannot exist. It survives the sweep
for that reason and no other — nothing can read it. The comment explaining why the
list is empty sits in the function; the table entry that outlives the explanation
sits where a reader looking for the four headings finds four.

*Where:* `src/ui/panel-drill.ts:711`
*Closes:* open

### F8 — a third of the tree puts its own argument below its imports

Forty-two of the 133 tracked TypeScript files open with imports and put the
docblock that argues for the file after them. In the worst of them the argument
is on line 50, under 48 lines of import: `src/ui/panel-drill.ts`. In
`src/core/fight-decoder.ts` it is on line 23, in `src/ui/panel-element.ts` on 16,
in `tests/ui/panel-words.test.ts` on 140.

Ninety-one files do the opposite. Nothing decides it, and the convention that
wins in a file is whichever the last round used — which makes the first thing a
reader sees a list of names in a repository whose whole discipline is that a file
argues for itself before it does anything.

*Where:* `src/ui/panel-drill.ts:50`
*Closes:* open

### F9 — five test files say nothing about why they exist

`tests/libs/assert.test.ts`, `tests/libs/json.test.ts`,
`tests/libs/timestamp.test.ts`, `tests/core/protocol-message.test.ts` and
`tests/core/margometer-error.test.ts` carry no docblock at all — not at the top,
not anywhere.

Every other test in this repository opens by saying what it is for, and several
say what they are **not** for, which is the half that stops a later round
widening them into something else. The five above are the four smallest subjects
in the tree and its error hierarchy; the hierarchy one is the file that proves the
two error bases are disjoint (§9.5), which is a claim worth a sentence.

*Where:* `tests/core/margometer-error.test.ts:1`
*Closes:* open

## Looked at and clean

- **`src/core/` is held.** After the compiler is asked about every survivor,
  neither `fight-statistics.ts` (78 mutants), `battle-event.ts` (24) nor
  `fight-decoder.ts` (233) carries a mutation that changes an answer and passes.
  The one that looks like it does — `amount * sign` becoming `amount / sign` — is
  a multiplication by `1` or `-1`, where the two operators agree.
- **The fifth audit's closes hold.** `src/ui/panel-reading.ts` returns no
  survivor at all; `src/ui/panel-words.ts` returns one, the `100` inside
  `composeShareText`'s `<1%` floor, where moving it changes the threshold by five
  thousandths of a point. Its F4 holds in the other direction too: every sentence
  it pinned is dead, and the one this round found unpinned — the waiting panel's
  `"Nikogo tu jeszcze nie ma."` at `src/ui/panel-view.ts:1068`, which is what a
  player reads before anybody has swung — is in the file it did not read.
- **`src/ui/panel-screen.ts` is the compiler's.** Of its 24 survivors, 17 are
  members of its two unions and its detail-line kinds; the remaining seven are the
  `< 0` divider tests the fourth audit already recorded, where a divider at
  position 0 answers `nothing` either way
  (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F13).
- **Two of the panel's figures that looked unheld are held by the material, not
  by a test, and the difference is worth knowing.** `mine + enemy + nobody` at
  `src/ui/panel-view.ts:926` and the pair added at `:474` both survive a flipped
  sign because their third term is zero in every recording — which is what §9.6
  says about the figure naming neither end, and why it is written down rather than
  left to be noticed.
- **Every absolute claim in a comment was checked and each holds.** Twenty-five
  sentences of the form *the only one*, *nothing else does*, *no other file* —
  including `tests/game/engine-warrior.test.ts:16`'s claim to be the only place in
  `src/game/` that spells a field of the game's, which the literal sweep confirms.
- **The shared string literals are the compiler's.** Of 105 literals spelled in
  more than one file, the great majority are members of a type union — event
  kinds, metrics, row kinds — where a disagreement is a compile error. The
  remainder are the game's own field names, spelled in `src/game/engine-warrior.ts`
  and in `tools/fight-dump-parser.ts`, which is the split §9.1 argues for.
- **`tools/` holds no duplication past its import lists.** One repeated block, in
  `tools/mutation-sweep.ts`, printing two survivor lists the same way.
- **Ten type assertions, each argued.** Every `as` outside `libs/record.ts` is at
  the page boundary or narrows a checked string into a union, and each carries the
  check above it.
- **`src/game/battle-session.ts` and `src/ui/panel-look.ts` read clean end to
  end.** The session's identity rule, its reset order and its entry-health read
  are each argued where they sit; the look holds every colour in one table and
  composes the tokens from the numbers rather than beside them.

## What was not read

- **Not swept:** `src/ui/panel-element.ts`, `src/ui/panel-look.ts`,
  `src/ui/cost-overlay.ts`, `src/userscript-entry.ts`, all of `src/game/`, all of
  `libs/`, all of `tools/` and `build.ts`. `src/ui/panel-element.ts` is the one
  that matters most of those: it is the largest file in the tree and the only one
  that touches a document.
- **Of `src/ui/panel-view.ts`'s 65 survivors, nine lines were sampled by hand and
  the rest were read only against `tsc`.** The two that are real are named in F1
  and below; what the other fifty-odd are is not established here, and the reason
  it is not is F3.
- **Read by outline rather than line by line:** `src/ui/panel-element.ts` past its
  first section, `src/userscript-entry.ts` past `setMargoMeter`, all of `tools/`,
  and `tests/` other than the fixtures F2 measures.
- **The prose half was not read at all.** The registers, both READMEs,
  `NOTICE.md`, `CHANGELOG.md` and the specs were read by the fourth audit at
  `fee5870`; nothing here re-reads them.
- **`tests/captured-fights/` was not opened**, and the panel was not run.
