# The whole tree, read once

Status: open
Read at: a54ea70

The first audit, and the tree's first reading since it was rebuilt from scratch.
Nothing here is a bug the gate can see: it was green at this commit and it is
green now. What follows is the other half — the rules no machine holds, the
prose that has drifted from the tree, and the code no test names.

## What was measured

`bun run typecheck` and `bun test` at `a54ea70`, working tree clean:

```
tsc --noEmit          no output, exit 0
bun test              1735 pass, 0 fail, 369236 expect() calls
                      40 files, 1277 ms
```

Read in full: `libs/` (4 files), `src/core/` (6), `src/game/` (6), `src/ui/` (5),
`src/userscript-entry.ts`, `src/userscript-version.ts`, `tools/` (9), `build.ts`,
and the eleven meta-guards under `tests/tools/`. Against them: §3, §5, §7.1,
§9.1, §9.3, §9.4, §9.5, §9.6, §8's structure block and §2's scope table.

Every rule `tests/tools/source-layout.test.ts` re-earns was also searched for by
hand rather than assumed from a green run, on the principle that a guard agreeing
with the bug it was written to prevent has happened here before (§7.5). Those
searches are in **Looked at and clean**.

## Findings

### F1 — the layer that decides which side is ours is named by no test

`src/game/engine-roster.ts` is 146 lines and six exports, and not one test file
in the tree names the module or any function in it. It is covered only through
`tests/game/battle-session.test.ts`, which exercises it as a dependency.

What makes this worth a finding rather than a coverage statistic:
`composeMergedCombatants` returns the **same array reference** when a payload
adds nobody new, and `src/game/battle-session.ts` relies on that to skip reading
the fight again. That is a contract stated in a comment and held by nothing. It
is also the file that reads `myteam`, which is the single thing `core` cannot
know (§10, *side*) — a wrong answer there puts every row under the wrong
heading.

*Where:* `src/game/engine-roster.ts:103`
*Closes:* open

### F2 — the tool that decides whether the cache is stale has no test

`tools/game-client-source.ts` is 192 lines and seven exports with no test file.
Its structural twin `tools/help-article.ts` — same shape, same fetch-and-cache
concerns, same provenance manifest — has one.

`getBuildFromPage` is a pure two-regex function with a throw path, and it is what
§7.6's "I read the served build and compare it to the cache" rests on. A wrong
answer there is silent in the direction that costs: it reports the cache current
and the next claim about the game is dated to a build nobody is running.

*Where:* `tools/game-client-source.ts:53`
*Closes:* open

### F3 — the one untested primitive is in the directory whose whole job is being trustworthy

`getIntegerFromHexadecimalText` has **zero references anywhere under `tests/`**.
`tests/libs/number.test.ts` imports six of the file's eight exports and never
mentions this one; `getNumberFromText` is not imported there either, and is
exercised only incidentally from `tests/core/team-heal-rule.test.ts` and
`tests/core/protocol-key-register.test.ts`.

Its own docblock is a list of traps — `parseInt("zz", 16)` is `NaN`,
`parseInt("ffzz", 16)` is `255` — and nothing proves it avoids them. §9.5 admits
`libs/` on the argument that there is one way to read a value and everything asks
it; a reader nobody has asked a question of is that argument on credit.

*Where:* `libs/number.ts:56`
*Closes:* open

### F4 — a channel check that accepts `toString`

`if (!(target in CHANNEL_HOSTS))` uses `in`, which walks the prototype chain. So
`toString`, `constructor`, `valueOf` and the rest of `Object.prototype` pass the
validation, and the line below reads `CHANNEL_HOSTS[target]` — a function, not a
host.

Tools-only and nobody has typed it. It is a finding because it is an *input
check that does not check*, in the file that decides which of the two channels
§7.6 keeps apart is being read.

*Where:* `tools/game-client-source.ts:186`
*Closes:* open

### F5 — a roster listing one combatant twice loses that combatant's name

`composeCombatantRoster` marks a name ambiguous on the second **entry** carrying
it, not the second **id**. Feed it the same person twice — same id, same name —
and their name resolves to nobody, which means every figure the protocol states
against that name goes unattributed.

No caller does this today: `composeMergedCombatants` deduplicates by id, and
`tests/captured-fight-catalog.ts` does the same for a whole fight. So the
invariant is real, load-bearing, unstated and unasserted — the shape a latent
fault has before somebody adds a third caller.

*Where:* `src/core/combatant-roster.ts:74`
*Closes:* open

### F6 — "is this an object" is answered nine times, and the answers disagree

Narrowing `unknown` to a record is written nine times across eight files, in
three forms: named `getRecord` in `src/game/engine-roster.ts:36`, named
`getObject` in `tools/captured-fight-intake.ts:319`, unnamed inside a `require…`
in `tools/fight-dump-parser.ts:33`, `tools/help-article.ts:172` and
`tools/game-client-source.ts:94`, and inline at the use site in
`src/game/fight-capture.ts:120`, `src/game/battle-session.ts:134`,
`src/game/engine-battle-wrap.ts:61` and `src/ui/panel-placement.ts:109`.

**The forms are not equivalent.** The four in `src/game/` accept an array as a
record, because `typeof [] === "object"`; the five elsewhere reject one with
`Array.isArray`. Two answers to one question, and no file says which it meant.

⚠️ The obvious repair is the wrong one. `src/game/fight-capture.ts:120` reads
`warriorsList` off the live client, where an array is a legitimate shape, so
making every site reject arrays would change what the add-on records. The split
may well be correct — what is missing is anybody having decided it.

§9.5's criterion admits this squarely: `typeof x === "object"` answers `true` for
`null`, which is a value nobody wrote. §7.1 puts a shared module at the second
consumer, and this is the ninth.

*Where:* `src/game/engine-roster.ts:36`
*Closes:* open

### F7 — the one number conversion `libs/` does not own

`libs/number.ts` owns reading hexadecimal and owns writing decimal, and the write
side of hexadecimal is inline in the panel's colour arithmetic:
`.toString(16).padStart(2, "0")`.

`tests/tools/source-layout.test.ts`'s register does not list `.toString(` with a
radix, so nothing noticed. It is the asymmetry §9.5 exists to prevent — a
construct with more than one spelling, spelled outside its owner — and it sits
under the contrast arithmetic §9.7 makes an accessibility floor.

*Where:* `src/ui/panel-tokens.ts:235`
*Closes:* open

### F8 — the same colour pattern, written twice in one file

The `#rrggbb` pattern is byte-identical at both sites, and each is followed by
its own loop turning the three captures into channels with its own null
handling. One file, two readers of one format.

*Where:* `src/ui/panel-tokens.ts:204`
*Closes:* open

### F9 — an export with no consumer outside its own file

`getRelativeLuminance` is exported and used only at `src/ui/panel-tokens.ts:257`
and `:258`, inside the same file. `noUnusedLocals` cannot see an unused export,
so the compiler — which §9.3 puts in place of a linter — is blind to exactly this
one thing.

*Where:* `src/ui/panel-tokens.ts:203`
*Closes:* open

### F10 — §8 says two files are Polish, and four are

The structure block states that `src/ui/panel-view.ts`, with the tooltips and
region names in `src/ui/panel-element.ts`, is "one of the two files in the
repository whose strings are Polish (§3)".

`src/ui/panel-names.ts` holds twenty Polish strings — the profession names and
the damage elements — and `src/userscript-entry.ts:646` composes a report whose
every key is Polish. So the claim is wrong by two files, in the document whose
own opening says that listing what does not exist "is how this document starts
lying".

This is the failure `tests/tools/structure-block.test.ts` was built for, in the
half of the block that guard cannot see: it checks that the names in the block
exist, never that the sentences beside them are true.

*Where:* `AGENTS.md:604`
*Closes:* open

### F11 — a report in Polish that says its reader is us

`composeReportText` builds the copied diagnostic blob with Polish keys —
`zadane_surowe`, `bez_sprawcy`, `nieznane_klucze`. One line above
`ciosy_bez_umiejetnosci` sits the comment "a report is read by us, not by a
player".

§3 makes Polish the exception for **the text a player reads**, and that sentence
is the file disqualifying itself from it. The captured-material exception (§9.2)
does not reach a file we generate. Either the rule needs a third exception or the
keys are in the wrong language, and the comment argues for the second.

*Where:* `src/userscript-entry.ts:646`
*Closes:* open

### F12 — the cast guard stops at the end of the line

The rule §9.5 states is that there is no cast off `JSON.parse`. The guard reads
`/JSON\.parse\b.*\bas\b.*/`, which cannot cross a newline, so a cast written one
line below its parse is invisible to it.

Nine `unknown`→record casts exist across the tree and every one of them is
preceded by a real `typeof`/`null` check, so none is unsound today. That is the
finding: what is keeping them sound is the authors, and the guard has been
agreeing with them for free.

*Where:* `tests/tools/source-layout.test.ts:309`
*Closes:* open

### F13 — 330 lines of stylesheet inside the renderer

`composePanelStyleText()` runs from `src/ui/panel-element.ts:190` to `:519` and
is one template literal of CSS. It shares a file with the DOM renderer, the drag
implementation and the tooltip logic.

§9.1 says a file that needs a table of contents needs splitting. This is the
largest single extractable unit in the tree and the one with the fewest edges: it
takes nothing and returns a string.

*Where:* `src/ui/panel-element.ts:190`
*Closes:* open

### F14 — four pure functions in the file that is allowed to know everything

`composeStateFromRow`, `composeStateAfterTeam`, `composeStateAfterMetric` and
`composeStateAfterBack` decide what a click does to the panel's state. They touch
no page, no global and no layer, and they are the entry point's only code that
could be tested in isolation.

`src/userscript-entry.ts` is `[any]` because it is the one file allowed to know
every layer at once (§2). That is a licence to do the wiring, not a place to keep
pure functions that belong to `ui`.

*Where:* `src/userscript-entry.ts:539`
*Closes:* open

### F15 — the one test whose name does not say what it tests

`tests/ui/panel.test.ts` tests `src/ui/panel-element.ts`. Every other test file
in the tree is its subject's name plus `.test.ts`, which is what makes a missing
test findable by looking.

*Where:* `tests/ui/panel.test.ts`
*Closes:* open

### F16 — an edge between two layers that the rules do not mention

`tools/fight-report.ts:21` and `tools/decoding-status.ts:13` both import
`@/tests/captured-fight-catalog.ts`. §9.1 gives the direction of every other
edge in the tree and says nothing about this one; §2 gives `tools/` and
`tests/captured-fights/` separate scopes and no relation.

Nothing is wrong: the material genuinely lives there and a tool that reads it has
to reach it. The finding is that the graph §9.1 draws is not the graph the tree
has, and an undrawn edge is one nobody can be held to.

*Where:* `tools/fight-report.ts:21`
*Closes:* open

### F17 — three files carry more than a reader can hold

`src/ui/panel-view.ts` is 1598 lines and holds number formatting, the state
machine and the view composition. `decodeMessage` runs ~285 lines from
`src/core/fight-decoder.ts:505`; `composeFightStatistics` ~284 from
`src/core/fight-statistics.ts:352`.

Recorded, and recorded as judgment: all three read linearly, all three are the
most heavily tested code in the repository, and "large" is not by itself a
defect. What a reader has to hold at once is the cost; whether a split lowers it
or only moves it is the question the closing round has to answer.

*Where:* `src/ui/panel-view.ts`
*Closes:* open

### F18 — "no such name" and "ambiguous name" come back as the same answer

`getCombatantIdByName` returns `null` both when the roster has never heard the
name and when more than one combatant answers to it. §3 makes unknown input loud
and §9.6 keeps unknown and zero apart on screen; this collapses two readings one
step earlier, in the contract.

Widening it is a change to what flows between decoder and aggregator, which §4
makes `[ASK]`, and the panel has nothing it would do differently. Recorded so
that the next person to ask is asking about a decision rather than an oversight.

*Where:* `src/core/combatant-roster.ts:82`
*Closes:* open

### F19 — the test file where a failure does not say what broke

`tests/game/engine-attachment.test.ts` is 1154 lines and holds four subjects:
finding the game on an injected clock, the whole add-on driven end to end, the
drag loop, and the panel asking the running client for a name.

§8 states this as deliberate — it is the one file allowed to hold both sides of
§9.1's boundary, and the two loops it closes cannot be closed anywhere else.
Recorded because "deliberate" and "costless" are different, and the cost is that
a red run here does not localise.

*Where:* `tests/game/engine-attachment.test.ts`
*Closes:* open

## Looked at and clean

Each of these looks like a fault from a distance, and is not. They are recorded
because the third answer is the one that goes missing (§7.7).

- **`unattributed` and `unaccounted` are not two spellings of one idea.** They
  appear within twenty lines of each other at `src/userscript-entry.ts:666` and
  `:672`, and side by side at `src/core/fight-statistics.ts:357` and `:360`. §10
  defines them as different things — a figure we have and cannot place, versus a
  figure we do not have — and every use read here is the right one.
- **Every rule `tests/tools/source-layout.test.ts` holds was re-searched by
  hand**, not inferred from a green run: no non-null `!` outside tests, no bare
  `new Error(`, no `document`/`window`/`localStorage` in `src/core/`, no
  `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon` anywhere in `src/`, no
  relative import, no `index.ts` or `utils.ts`, no unowned `Number(`/`parseInt`/
  `JSON.parse`/`Date.parse`. Zero hits each.
- **The layering graph matches §9.1 exactly.** Built by hand from every `from
  "…"` in `src/` and `libs/`: `core` imports only itself and `libs`, `ui` never
  imports `game`, `game` never imports `ui` or the entry point, `libs` reaches
  upward nowhere, and only `src/userscript-entry.ts` knows all of them.
- **No `any`, no `ts-ignore`, no `eslint-disable`, no `TODO`/`FIXME`/`HACK` in
  the tree.** `tsconfig.json` runs `strict` plus `noUnusedLocals`,
  `noUnusedParameters`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitReturns`, `noImplicitOverride`, `noFallthroughCasesInSwitch` and
  `allowUnreachableCode: false`.
- **`build.ts`'s host matching is right.** The empty prefix in its non-game host
  list is there because `*.margonem.pl` also matches the bare domain, and it is
  cited in place.
- **`libs/` is the best-argued directory in the tree.** Four files, 225 lines,
  every docblock naming the trap it closes. F3 is about a missing test, not about
  the code.

## What was not read

- **`docs/protocol-keys.md`'s ~70 entries were not re-earned.**
  `tests/core/protocol-key-register.test.ts` re-measures every one against the
  captures and the frozen tables on each run, so re-reading them by hand would
  measure the guard rather than the register.
- **`docs/specs/`, `README.md`, `NOTICE.md` and `CHANGELOG.md` were read for
  their claims about paths and layout, not sentence by sentence for accuracy.**
  F10 came out of that reading; a second one at full depth could produce more.
- **`docs/design/panel.html` was not read at all.** §8 calls it a drawing and not
  a source, and the add-on is right where they disagree — so a discrepancy there
  is not a finding about the code.
- **No test was read for whether it can fail.** §3 requires a mutation per new
  test and the commits record them; a sweep re-breaking 1735 assertions is its
  own round, and it is the one this audit would recommend next.
- **`tests/captured-fights/` was not opened.** It is evidence (§9.2) and nothing
  here needed a claim about its contents.
- **The panel was not run.** This is a reading of the tree; `.claude/skills/verify/`
  is how it would have been looked at, and the gate cannot see a panel either.
