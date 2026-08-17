# The whole tree, read a third time

Status: closed
Read at: 760dffc

The third audit, one commit after the second one closed. The gate was green at
`a54ea70`, green at `e0098fd` and is green here, so again nothing below is a bug
a machine can see. What is below is the other half: prose that has drifted from
the tree, rules no guard holds, guards that hold less than the rule they were
written for, and duplication that crossed §7.1's second consumer without anybody
counting.

Two of §7.7's triggers were met. A round touched material no audit has read —
`760dffc` brought three group fights in, taking `tests/captured-fights/` from
eight recordings to eleven. And the same class of fault has now turned up in
three consecutive rounds: a figure measured over the captures, written into
prose, invalidated by the next capture. `e0098fd` had it as F3, `a398017` fixed
the sentence, and `760dffc` broke the replacement one commit later. That is
`AGENTS.md`'s own test for when "I fixed it" stops being the right response, so
F3 below is written as a question about how many there are rather than as a
correction.

⚠️ **The reading was widened where the last audit said it had not read.**
`docs/audits/2026-08-14-the-whole-tree-read-again.md` listed `src/ui/panel-view.ts`
and `src/ui/panel-element.ts` as not read end to end, and dynamic `import()` as
not searched for. Both were read this time and the import search was run; F1, F5,
F17 and F18 come from that widening, and F1 is the most expensive thing in this
document.

## What was measured

`bun run check` at `760dffc`, working tree clean:

```
tsc --noEmit          no output, exit 0
bun test              2642 pass, 0 fail, 587360 expect() calls
                      48 files, 1.80 s
bun run build.ts      dist/margometer.user.js, dist/margometer.meta.js
```

Taken before this file existed, and it does not reproduce afterwards:
`tests/tools/audit-status.test.ts` runs its shape checks once per audit and once
per finding, so writing this document adds tests to that count. The figure above
is the tree at `760dffc`, which is what an audit measures.

Two tools were run for their answers rather than as subjects:

```
bun tools/decoding-status.ts   4262 messages, 4262 fully read,
                               0 carrying an unread key
bun tools/fight-report.ts      11 captures, and the row nobody can be
                               charged with is zero in every one
```

Read in full: `libs/` (7 files), `src/core/` (7), `src/game/` (6), `src/ui/` (7),
`src/userscript-entry.ts`, `src/userscript-version.ts`, `tools/` (10),
`build.ts`, the meta-guards under `tests/tools/`, `AGENTS.md`, `NOTICE.md`,
`README.md`, `CHANGELOG.md` and `.github/workflows/`. Against them: §2, §3, §4,
§5, §7.1, §8, §9.1, §9.2, §9.3, §9.4, §9.5, §9.6 and §10.

Three things were measured rather than read. The import graph was rebuilt by hand
from every `from "@/…"` specifier in `libs/`, `src/`, `tools/` and `tests/` — 73
edges, no dynamic `import()`, no side-effect import, so the specifier list is the
whole graph. Every exported name in `libs/`, `src/` and `tools/` — 240 of them,
cross-checked against `git grep -cE '^export '` so the extraction dropped
nothing — was searched for across the whole of `tests/`. And every figure a
comment states about the captures was re-computed against all eleven recordings
by a script that reads the JSON rather than grepping it: 603 engine calls, 576
payloads carrying messages and 27 without, 4262 messages, 2 739 roster entries in
588 payloads, 12 937 snapshot entries.

## Findings

### F1 — the game's own sentences are written down here, in four files

§5 says the sentences the game displays are someone else's work and are `[NEVER]`
copied into this repository. `NOTICE.md` states the same thing twice, once as a
promise about what is absent and once as the basis on which the material here is
kept at all. Three of the client's dictionary entries — its composed Polish
sentences, holes and all — are written out verbatim in four files:

- `src/game/game-dictionary.ts:13-14`, two of them, in the docblock arguing why a
  sentence with its figure cut out is not a label.
- `src/ui/panel-names.ts:17-18`, the same two, in the same argument told again.
- `src/ui/panel-names.ts:116`, a third, above `DEFENCE_NAMES`.
- `tests/game/game-dictionary.test.ts:30-32` and `:37`, four entries **as test
  data** — including one that is a complete sentence with its full stop, which is
  the least defensible of the set because nothing about it is a template.

What it costs is not hypothetical and not only legal. `src/game/game-dictionary.ts:48-50`
says in so many words that the dictionary is not in this repository and never
will be; it says it nine lines below two of its entries. `NOTICE.md` is the
document addressed to the party who would check, and this is checkable in thirty
seconds with `grep`. Nothing guards it: the Polish guard at
`tests/tools/source-layout.test.ts:586` holds a list of files allowed to *ship*
Polish strings, and every occurrence above is either a comment or a test, which
that guard reads past by construction.

*Where:* `src/ui/panel-names.ts:116`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F2 — NOTICE.md makes two checkable claims and neither is true

`NOTICE.md:74` closes the `tspell=` paragraph with the claim that the game's own
ability names are written down nowhere else here — "No such name appears in a
test, in `docs/`, or in a comment." Both halves fail:

- `docs/design/panel.html:529` embeds a `FIGHTS` literal holding seventeen of the
  game's ability names.
- `tests/core/team-heal-rule.test.ts:134` names one in a comment, written by
  `760dffc` — the commit this audit reads.

`NOTICE.md:93` then lists "the game's sentences, in any form" under what is
deliberately not here, thirty lines after `NOTICE.md:61-73` has admitted the
older recording's `render` field and the `txt=` sentences and explained why they
stay. §7.6 leans on the absolute reading of that line to justify its own
`[NEVER]`, so a rule takes its force from a sentence its own document has already
qualified.

The cost is the same in both directions: this is the one file where being wrong
is expensive to the reader it was written for, and a document that contradicts
itself thirty lines apart stops being read as a statement of fact.

*Where:* `NOTICE.md:74`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F3 — every figure measured over the captures went stale one commit after it was written, for the third time

Eight recordings became eleven at `760dffc`. Everything below was true at
`e0098fd` and is not true now:

| Where | Says | Is |
|---|---|---|
| `src/game/engine-battle-wrap.ts:79-81` | 400 engine calls, `mi` and `m` together in 380 payloads, lengths equal in 380 of 380 | 603 calls, 576 payloads, equal in 576 of 576 |
| `src/game/engine-battle-wrap.ts:121` | neither field present in 20 of 400 | 27 of 603 |
| `src/game/engine-roster.ts:51` | numbers in 1 794 of 1 794 entries | 2 739 of 2 739 |
| `src/game/engine-roster.ts:81-85` | the 8 captures, 1 794 entries in 389 payloads, 63 naming everybody and 1 731 nobody | 11 captures, 2 739 in 588, 96 and 2 643 |
| `src/game/fight-capture.ts:251` | two captures hold `otwarcie` as null, six recorded since do not carry it | two, and nine |
| `tests/core/battle-event.test.ts:104` | `+taken_dmg` smaller than the applied figure in 31 of its 199 occurrences | 359 occurrences |
| `tests/core/battle-event.test.ts:108` | 37 of the 241 defended blows | 336 defended messages |
| `AGENTS.md:1758` | the gap is wider in 220 of the 241 messages carrying a defence | wider in 313 of 336, equal in 23, narrower in none |
| `src/ui/panel-view.ts:715` | a figure and a share "against Hildur" | four captures now answer to that name |

Every substance claim survives — the roster split is still perfectly bimodal, the
companion count still never disagrees with the message list, the gap is still
never narrower than what a defence stopped. Only the figures moved, which is
precisely why this keeps happening: nothing goes red, and §3 requires the
measurement to be cited, so the citation is written by hand and then left.

`src/game/fight-capture.ts:251` is the one to read twice. That sentence was
**written by `a398017` to close this audit's predecessor's F3**, and `760dffc`
invalidated it one commit later. Three generations of the same fault on one line
is `AGENTS.md`'s own trigger for asking how many more there are rather than
correcting it again.

*Where:* `src/game/engine-roster.ts:81`
*Closes:* guard `tests/tools/measured-material.test.ts`

### F4 — a fifth file ships player-facing Polish, and the guard cannot see this one either

`tools/changelog.ts:54-63` is six lines of Polish prose appended to every
release's notes — a sentence a player reads, in source, outside the four files
§3's exception is written for.

The guard that exists to re-measure exactly this
(`tests/tools/source-layout.test.ts:586`) scopes itself to `src/` and `libs/` at
`tests/tools/source-layout.test.ts:600`, so `tools/` is unwatched. Two sentences
in §8 stay true only because of that: `AGENTS.md:568` calls `CHANGELOG.md` the
only *document* here written in Polish, and `AGENTS.md:861` calls the panel trio
plus the version file "the four files that ship whose strings are Polish". This
file is neither a document nor shipped in the userscript, so both sentences
survive on a technicality nobody wrote down and nobody can re-earn.

This is the shape of the last audit's F4 exactly — a further file carrying
Polish that the guard written for that question could not see — and the remedy
there was to widen what the guard reads.

*Where:* `tools/changelog.ts:54`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F5 — a deliberate null collapsed to zero, in the one place accessibility is decided

`src/ui/panel-tokens.ts:286-289`:

```ts
const dark = getContrastRatio(PANEL_TOKENS.badgeInkDark, colour) ?? 0;
const light = getContrastRatio(PANEL_TOKENS.badgeInkLight, colour) ?? 0;
return dark >= light ? PANEL_TOKENS.badgeInkDark : PANEL_TOKENS.badgeInkLight;
```

`getContrastRatio` returns `null` when either colour is unreadable, and
`src/ui/panel-tokens.ts:244-249` argues for that null against a throw — a
malformed token is a fact to report rather than an exception to handle. This
caller reports nothing: both nulls become `0`, `0 >= 0` is true, and a colour
nobody could measure ships dark ink as confidently as one that was measured.

§9.3's "unknown is loud, never zero" and §9.5's last table row both name this
substitution as the failure the project exists to prevent, and §9.7 makes the
contrast an accessibility floor rather than a taste. It is the clearest instance
of the pattern in the tree, and it is in the function that decides whether a
label can be read.

*Where:* `src/ui/panel-tokens.ts:286`
*Closes:* guard `tests/ui/panel-tokens.test.ts`

### F6 — a docblock above the wrong declaration, added by the commit that closed the finding about docblocks above the wrong declaration

`tests/captured-fight-catalog.ts:66-73` is a full docblock for `CAPTURED_FIGHTS`
— what it holds, why the directory is listed rather than named, why it is sorted.
It sits immediately above `getMessagesOfFight`'s own docblock at `:74-83`, and
the constant it describes is declared 25 lines later at `:90`. Two `/** */`
blocks back to back, the first orphaned.

`getMessagesOfFight` was added by `a398017` to close the previous audit's F20.
The previous audit's **F7** was "five docblocks in shipped source sit above the
wrong declaration". So the commit that closed one finding created another
instance of a different one, in the same round, which is what makes this worth a
finding rather than a fix in passing: nothing re-earns the pairing of a docblock
to its declaration, and the last round proved by example that reading is not
enough.

*Where:* `tests/captured-fight-catalog.ts:66`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F7 — `bun.lock` is the one tracked root file §8's block does not name

§8's structure block enumerates the root file by file — `AGENTS.md`, `CLAUDE.md`,
`README.md`, `CHANGELOG.md`, `LICENSE`, `NOTICE.md`, `build.ts`, `package.json`,
`tsconfig.json`, `.gitignore` — and omits `bun.lock`. Re-running the guard's own
indentation parser over the block against `git ls-files` leaves that one file
with neither an entry nor a covering directory entry.

It is not an incidental file. `AGENTS.md:160-168` builds an `[ALWAYS] [process]`
rule entirely on it — the local gate is the gate only against the lockfile, and
the one failure the gate cannot report is green here and red on the runner. §8
omits the file its own gate rule turns on.

Nothing catches it because `tests/tools/structure-block.test.ts:109` asks git for
`libs src tools` only, so the completeness half of that guard has never looked at
the root at all.

*Where:* `tests/tools/structure-block.test.ts:109`
*Closes:* guard `tests/tools/structure-block.test.ts`

### F8 — "43 entries" is 44

`AGENTS.md:1163` and `tests/ui/panel-names.test.ts:119` both state that a
mutation sweep put a sentinel through all 43 entries of `src/ui/panel-names.ts`
and nothing went red. The six exported tables hold 6 + 9 + 16 + 3 + 4 + 6 = 44,
and the recorded block in that test file holds 44 rows.

A count of our own artefacts in prose is what §5 forbids by name, and here it
costs the argument as well as the number: "a sentinel through all 43 entries and
nothing went red" reads as a measured hole, while 43 out of 44 reads as a
miscount.

*Where:* `tests/ui/panel-names.test.ts:119`
*Closes:* commit

### F9 — the copied report re-lists the data contract by hand

`src/userscript-entry.ts:726-767` writes out all 22 fields of
`CombatantStatistics` one at a time to turn the maps into something JSON can
hold. It is complete today — 22 named, 22 in the type.

Nothing holds it there. §4 makes the data contract an `[ASK]` for one stated
reason: "A field added to a type and forgotten downstream produces numbers that
quietly shrink." This is that downstream, and the consequence is specific — the
report is what a player pastes when something looks wrong, so a field added to
the aggregate and missed here is invisible in exactly the situation the report
exists for. The compiler cannot help: the function returns
`Record<string, unknown>`, which is satisfied by any subset.

*Where:* `src/userscript-entry.ts:726`
*Closes:* commit

### F10 — eleven exported names with no consumer and no test

Twenty-one exported runtime values are named nowhere under `tests/`. Eleven of
those also have no consumer outside their own file, so the `export` keyword on
them buys nothing that exists:

`PROFESSION_COLOURS` (`src/ui/panel-tokens.ts:57`), `PANEL_NOUNS` and
`PANEL_DIRECTIONS` (`src/ui/panel-view.ts:102`, `:105`), `PAGE_HANDLE`
(`src/userscript-entry.ts:146`), `RELEASE_INSTALL_NOTE` (`tools/changelog.ts:54`),
`getServedBuild` and `writeClientSourceCache` (`tools/game-client-source.ts:85`,
`:154`), and `getArticleUrl`, `getCachedHelpArticle`, `getServedArticleText`,
`writeHelpArticleCache` (`tools/help-article.ts:73`, `:198`, `:211`, `:220`).

This is the third round for the class. The first audit's F9 closed by removing an
export; the second audit's F22 found one that could not lose its `export` because
`noUnusedLocals` would then refuse the file, and its F24 named three more plus
`PAGE_HANDLE` and `USERSCRIPT_VERSION` "recorded without findings of their own".
Both of those are still here. Twice was the point at which §7.7 says the question
becomes how many there are; the answer, measured rather than sampled, is eleven.

*Where:* `src/ui/panel-tokens.ts:57`
*Closes:* guard `tests/tools/named-exports.test.ts`

### F11 — the module written to close the last audit's F21 is executed by no test

`libs/text-order.ts` exists because two tools ordered their output by whatever
locale the machine running them had — the previous audit's F21. Neither
`getTextOrder` (`libs/text-order.ts:28`) nor `getCollatedTextOrder` (`:40`) is
called anywhere under `tests/`. The file's only appearance there is as a path
string at `tests/tools/source-layout.test.ts:280`, where it is named as the file
allowed to spell `localeCompare` — a claim about *where* the call may live, which
says nothing about what it answers.

So the fix for "the order belongs to the machine rather than to the data" is
itself held by nothing: the guard would stay green if `getCollatedTextOrder`
returned the locale-default order it was written to replace.

Four more modules have no test file of their own, in decreasing order of how much
of them is reached incidentally by other tests: `src/core/game-build.ts` (neither
export named anywhere under `tests/`; both are reached only through
`getBuildFromPage`), `src/ui/panel-stylesheet.ts`, `src/ui/panel-tokens.ts` and
`libs/source-regions.ts`.

*Where:* `libs/text-order.ts:28`
*Closes:* guard `tests/libs/text-order.test.ts`

### F12 — three of §9.1's directions are held by denylist, not by the rule as written

§9.1 says `core` imports from nothing but itself and `libs/`, and the `ui` and
`game` clauses are the same shape. The guards are written the other way round —
as denials of the two sibling `src/` layers:

- `tests/tools/source-layout.test.ts:116` forbids `src/core/` importing
  `@/src/game/` or `@/src/ui/`.
- `tests/tools/source-layout.test.ts:160` forbids `src/ui/` importing
  `@/src/game/` or the entry point.
- `tests/tools/source-layout.test.ts:181` forbids `src/game/` importing
  `@/src/ui/` or the entry point.

So `src/core/**` importing `@/tools/…`, `@/tests/…` or `@/build.ts` lands green,
and the same for `ui` and `game`. `libs/` is the only layer guarded in the
general form — "reaches nothing above it" — which is why it is the only one where
the rule and the guard say the same thing.

No violation exists today; the graph was rebuilt by hand and matches §9.1
everywhere. The finding is the asymmetry, and it is the shape §9.1 was already
amended for once: an undrawn edge is one nobody can be held to.

*Where:* `tests/tools/source-layout.test.ts:116`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F13 — the decoder's damage-key shape rule, four spellings and a bare `4`

`src/core/fight-decoder.ts:58` decides what a damage key looks like, against a
named marker and its length. It is not exported, so four test files spell it
again with the offsets written out by hand:

- `tests/core/skill-announcement-rule.test.ts:25`
- `tests/core/proc-rule.test.ts:27`
- `tests/core/health-witness.test.ts:34`
- `tests/core/poison-reduction-rule.test.ts:25`

Two of them carry a comment saying this is the decoder's own shape rule, so
"damage key" means here what it means there — which is the sentence a shared
export makes true and a copy merely asserts. §7.5 already paid for the general
version of this twice, under "extract structure with structure, not with a
search": a rule about the *shape* of somebody else's name, copied by hand, is a
fuse.

*Where:* `src/core/fight-decoder.ts:58`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F14 — one protocol key, one name, three declarations

`DAMAGE_TO_NAMED_KEY` is declared under that exact name in three files —
`src/core/fight-decoder.ts:97`, `tests/core/skill-announcement-rule.test.ts:22`
and `tests/core/poison-reduction-rule.test.ts:22` — and written as a bare literal
in two more, `tests/tools/decoding-status.test.ts:63` and
`tests/core/protocol-key-register.test.ts:345`.

Well past §7.1's second consumer, and it is the same shape as F13 one level down:
the decoder owns what a key is called and three other files have taken a copy.

*Where:* `src/core/fight-decoder.ts:97`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F15 — the reader added to close the last audit's F20 is bypassed by three callers

`getMessagesOfFight` (`tests/captured-fight-catalog.ts:90`) exists because "the
messages of a captured fight" had been spelled seventeen times — the previous
audit's F20. Thirteen files use it now. Three still spell it by hand:

- `tools/fight-report.ts:72`, which already imports from that module.
- `tools/decoding-status.ts:91-92`, the nested-loop form, which also already
  imports from it.
- `tests/game/engine-attachment.test.ts:471-472`, as a local `getMessagesOf`.

A shared reader with a third of its callers outside it is worse than no shared
reader, because the next person reads the module and believes it is the only
spelling.

*Where:* `tools/fight-report.ts:72`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F16 — the running-total idiom, one private helper and five hand copies

`src/core/fight-statistics.ts:317` is `setRunningTotal` — add to what this token
already carries, starting one at zero. The same three-token expression is written
out at `src/core/fight-statistics.ts:312` (inside `setPairTotal`, in the same
file), `src/ui/panel-view.ts:677`, `src/game/battle-session.ts:155`,
`tools/decoding-status.ts:97` and `tools/decoding-status.ts:102`.

Five copies across four files and three layers. §9.5's rule for `libs/` is about
constructs with more than one spelling in JavaScript and this one has exactly one
— but §7.1's second consumer arrived long ago, and `libs/` is the layer a counter
over a map belongs to, since nothing about it knows the game, the protocol or the
panel.

*Where:* `src/core/fight-statistics.ts:317`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F17 — the panel's row-key grammar is a convention three files hold separately

A row key is composed in `src/ui/panel-view.ts` — `combatant:`, `target:`,
`skill:<owner>:<key>`, and the bare words `nobody`, `unannounced` and `leaf:…` —
invented a third time at `src/ui/panel-element.ts:453`, which sets `"back"` on a
breadcrumb node, and parsed by string comparison at `src/ui/panel-state.ts:28`,
`:31`, `:37` and `:41`.

Three files agree on a grammar by convention and nothing states it. This is the
"decision nobody made" case §7.7 item 5 names, and the cost is already on record:
`src/ui/panel-state.ts:47-57` documents a bug that came from mis-slicing one of
these keys, and `tests/ui/panel-state.test.ts` holds the reducer against it — so
what is guarded is one parser's handling of the grammar, never the grammar
itself.

*Where:* `src/ui/panel-state.ts:28`
*Closes:* guard `tests/ui/panel-row-key.test.ts`

### F18 — the same sentence a player reads, written twice

`src/ui/panel-view.ts:778` and `src/ui/panel-view.ts:914` are byte-identical, as
are `src/ui/panel-view.ts:779` and `src/ui/panel-view.ts:922`. Two exhaustive
per-metric tables, each defended in prose as having four entries so the compiler
asks about a fifth screen — and the tables are right. What is not right is that
the *sentences* are written twice: a reword of one is a panel that says two
different things about one limit, on two screens, and neither test would notice,
because `tests/ui/panel-view.test.ts` records each screen's phrases against
itself.

*Where:* `src/ui/panel-view.ts:778`
*Closes:* commit

### F19 — a substituted zero written back over the evidence

`tools/captured-fight-intake.ts:287-288` composes the header of the file it is
about to write:

```ts
pseudonimow: (getIntegerFromValue(header["pseudonimow"]) ?? 0) + named.changed,
opisow: (getIntegerFromValue(header["opisow"]) ?? 0) + described.removed,
```

Absent is a real case — a first intake has no such count, and zero is the right
reading. **Present but unreadable is not.** A count stored as text, as a
fraction, as anything the reader refuses, reads as zero here and is then written
into the recording as though the earlier redaction had substituted nothing. §9.2
makes this file the one place where a wrong number is written *onto the evidence*
rather than merely computed from it, and §9.5's table says a default that makes
the number look right is never the answer.

*Where:* `tools/captured-fight-intake.ts:287`
*Closes:* guard `tests/tools/captured-fight-intake.test.ts`

### F20 — the dated-name rule, byte-identical in two guards

`tests/tools/spec-status.test.ts:16` and `tests/tools/audit-status.test.ts:33`
declare the same regex under the same name, and the check built on it —
filename matches, date parses, date is not in the future — is duplicated at
`tests/tools/spec-status.test.ts:26-32` and `tests/tools/audit-status.test.ts:130-135`.

Recorded rather than argued, because the second file already rejected sharing:
`tests/tools/audit-status.test.ts:21-27` says a module holding a single regex
makes each guard readable only with the other one open. That decision was made
when the two agreed on one regex; they now agree on a regex and a five-line test,
which is a different trade, and it is the trade that has to be re-read rather
than the conclusion inherited.

*Where:* `tests/tools/audit-status.test.ts:33`
*Closes:* commit

### F21 — booleans with no prefix §9.4 admits

§9.4 requires `is`, `has`, `should`, `min`/`max` or `prev`/`next` on a boolean.
The guard checks the action verb on function declarations and nothing else, so
none of these is caught:

- `src/userscript-entry.ts:113` — `said`
- `src/userscript-entry.ts:174` — `read`, which is a verb, a noun and a past
  participle at once, in the file whose subject is reading
- `src/userscript-entry.ts:486`, `:489`, `:549` — `dragFailureSaid`,
  `captureFailureSaid`, `engineGapsSaid`
- `src/game/engine-attachment.ts:135` — `refusalSaid`
- `src/game/engine-battle-wrap.ts:294` — `wasOwnProperty`, where `prev` is the
  row §9.4 offers for a prior-state flag
- `src/ui/panel-view.ts:297` and `:864`, `src/ui/panel-element.ts:701` and `:880`
  — `canDrill`, `hidden`, `held`

The `…Said` family is the interesting one: seven of them spell one idea — this
has been reported once already — and none of them says so in the vocabulary §9.4
fixed for exactly that.

*Where:* `src/userscript-entry.ts:174`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F22 — two counts of our own artefacts, one of them in the code that computes it

`tests/tools/cited-paths.test.ts:100` describes the root `.md` files it is about
to read as "the four at the root". The line below reads the directory, and there
are five: `AGENTS.md`, `CHANGELOG.md`, `CLAUDE.md`, `NOTICE.md`, `README.md`. The
code is right and the prose beside it is not, which is the cheapest possible
instance of §5 and the one hardest to notice, since the number is never used.

`.github/workflows/release.yml:53` says 108 commits went into 0.6.0, as the
argument for release notes being a changelog section rather than a commit dump.
`git log v0.5.0..v0.6.0` is 110. The argument holds at either figure; the number
is a count of our own artefacts left in prose, and it was already wrong.

*Where:* `tests/tools/cited-paths.test.ts:100`
*Closes:* commit

### F23 — `src/userscript-version.ts` sits in no scope of §2

§2's table binds rules by path: `[core]` is `src/core/`, `[game]` is `src/game/`,
`[ui]` is `src/ui/`, and the note below the table names `src/userscript-entry.ts`
as the one file that is `[any]` because no narrower scope would be true of it.
`src/userscript-version.ts` sits directly in `src/` and is named by neither.

§9.1 does grant it cross-layer readability, and says so precisely because an
undrawn edge is one nobody can be held to — but that is the import rule, not the
scope table. §2's own warning is that a directory missing from the table is the
first sign the rules have drifted from the tree, and the file every layer reads
carries no tag at all, so no rule written with a scope demonstrably binds it.

*Where:* `AGENTS.md:53`
*Closes:* rule §2

### F24 — `settings.local.json` does not sit beside the verify skill

§8's entry for `.claude/skills/verify/` ends by saying `settings.local.json` sits
beside it and stays out of git, per machine. The file is at
`.claude/settings.local.json`, two levels up; `.claude/skills/verify/` holds one
file, `SKILL.md`.

Trivial on its own, and listed because it is a location claim inside the block
whose entire job is to state locations, in the one part of the tree
`tests/tools/structure-block.test.ts` does not walk.

*Where:* `AGENTS.md:599`
*Closes:* commit

### F25 — the gate still watches a branch that was merged, under a comment saying the work happens there

`.github/workflows/check.yml:8-11` runs the gate on `main` and `rewrite/**`, and
the comment above it explains that the rewrite happens on its own branch, so that
is where the gate is needed today.

`rewrite/2026-08` is an ancestor of `main` and its tip is the 0.5.0-era commit
`32f277d`. The work has been on `main` for the whole life of this tree, and
`AGENTS.md:36` describes the rewrite in the past tense. The pattern costs
nothing; the comment is a sentence about how this repository is worked on that
stopped being true, in the file a newcomer reads to find out how it is worked on.

*Where:* `.github/workflows/check.yml:8`
*Closes:* commit

### F26 — size, recorded a third time, and the prose ratio underneath it

`src/ui/panel-view.ts` was 1598 lines when the first audit's F17 declined
splitting it and 1722 at the second audit's F26. It is 1725 now.
`src/userscript-entry.ts` has gone 833 → 896 and `src/core/fight-decoder.ts`
870 → 887, and `decodeMessage` inside the latter is a single ~285-line
key-dispatch chain.

Recorded rather than argued, for the reason F26 gave: a decline inherited in
silence stops being a decision. The seams are now visible enough to name, which
they were not last time — `src/ui/panel-view.ts` splits along the label
vocabulary, the output shape, one screen's arithmetic and the drill, and its own
docblocks at `:355`, `:753` and `:1479` are a table of contents in prose, which
is §9.1's literal test.

Underneath it is a second measurement that is not about any one file. Five
shipped files run 65–79% comment by line — `libs/text-order.ts` at 78.6%,
`libs/record.ts` at 72.2%, `src/core/battle-event.ts` at 71.0%, `libs/json.ts` at
67.7%, `src/game/game-dictionary.ts` at 65.1%. §9.3 says a comment needing
paragraphs belongs in the commit message with the comment pointing at it, and
§9.3's first clause wants exactly what this prose is: measurements, rejected
alternatives, traps. The rule and the tree disagree, and only one of them can be
right. That is a finding about §9.3, not about those five files.

*Where:* `src/ui/panel-view.ts:1`
*Closes:* commit

## Looked at and clean

Each of these looks like a fault from a distance and is not. They are here
because *not looked at*, *looked at and clean* and *a finding* are three answers,
and the first goes missing by silence (§7.7).

- **The layering graph matches §9.1 everywhere the rule draws a line.** Rebuilt
  by hand from all 73 specifiers: `libs/` reaches upward nowhere and its only
  three imports are of `libs/assert.ts`; `src/core/` imports only itself and
  `libs/`; `src/ui/` never imports `src/game/`; `src/game/` never imports
  `src/ui/` or the entry point; only `src/userscript-entry.ts` knows every layer.
  The six edges from `tests/` into `tools/` all point at the two files §9.1
  permits. F12 is about how that is guarded, not about a violation.
- **No dynamic `import()` and no side-effect import anywhere** in `libs/`,
  `src/`, `tools/` or `tests/`. The previous audit listed this as not proved.
- **No network in `src/` or `libs/`** — no `fetch`, `XMLHttpRequest`, `WebSocket`
  or `sendBeacon`. Searched directly rather than inferred from the guard.
- **No blocking dialog anywhere**, no `!` outside tests, no bare `new Error(`, no
  cast off `JSON.parse`, no `index.ts` or `utils.ts`, no identifier contraction,
  no type named `…Data`, no non-English identifier or test name.
- **Every tracked file under `tests/` is named in §8's block** — all 5 in
  `tests/libs/`, 17 in `tests/core/`, 6 in `tests/game/`, 5 in `tests/ui/`, 15 in
  `tests/tools/` and the four readers at the root. This is where
  `tests/tools/structure-block.test.ts` does not reach and it is complete anyway.
- **§2's ten paths all exist**, and every top-level directory is covered by some
  scope. F23 is the one gap and it is a file, not a directory.
- **§6.2's table is exactly the ten files in `tools/`** — nine listed plus the
  error base explicitly excluded. No entry for a tool that does not exist, no
  tool missing.
- **`docs/` holds only what §8 admits** — one guarded register, nine dated specs,
  two dated audits, one design. Every spec is `Status: implemented`, every
  filename carries its date, and `docs/design/panel.html` is named by three
  specs, so §8's condition for admitting it holds. Both prior audits are `closed`
  with no finding left open.
- **`README.md` read in full against the tree.** Every command it names is in
  `package.json`, the built filenames match `build.ts`, "not minified" matches
  the build, the update path matches the banner and `.github/workflows/release.yml`,
  and it states no number a machine could compute.
- **`CHANGELOG.md`.** `package.json` is `0.6.0` and that section exists; every
  entry in the file opens with its kind.
- **`NOTICE.md`'s other claims hold.** Exactly one of the eleven captures carries
  a `render` field, which is the "older recording" the document names; every
  player id is substituted; `.cache/` is ignored and untracked;
  `tests/frozen-protocol-keys.ts` carries keys and no prose. F1 and F2 are about
  three sentences, not about the document's account of the material.
- **The frozen tables are current with the material.** The key table names
  production build `1786514810315`, which is the build `760dffc` recorded the new
  captures against, and `tests/frozen-help-phrases.ts` was fetched five days
  before this reading — inside the week §7.6 sets.
- **The aggregate finds nothing it cannot place.** `bun tools/fight-report.ts`
  puts zero in the unattributed row of all eleven captures, so
  `src/ui/panel-view.ts:737`'s claim that the figure is read rather than written
  as zero still describes a figure that is genuinely zero.
- **`src/core/combatant-roster.ts` and `src/ui/panel-placement.ts` are the model
  answers for §5** — an ambiguous name resolves to nobody and says why, a stored
  position proves itself before it is believed. F5 and F19 are what falling short
  of that standard looks like.
- **The broad `catch` blocks in `src/ui/` are §9.6's isolation, not §9.5's
  laxity**, and the once-per-fight console rule is met by construction in
  `src/userscript-entry.ts` rather than by habit.

## What was not read

- **`docs/protocol-keys.md`'s entries were not re-earned.**
  `tests/core/protocol-key-register.test.ts` re-measures every one against the
  captures and the frozen tables on each run, so reading them by hand measures
  the guard rather than the register. `bun tools/decoding-status.ts` was run and
  reports no unread key, which is the same guard from the other side.
- **The served game build was not compared against `.cache/`.** §7.6's check is a
  network request and an audit is a reading of this tree. `760dffc` compared both
  channels one commit ago and neither was stale.
- **The mutation sweep was not run.** It writes mutants into the working tree and
  runs the whole gate once per mutant, which is its own round. F13's and F16's
  duplication were found by reading, not by a sweep.
- **`tests/captured-fights/` was not opened as prose.** It was measured as data —
  eleven files, 603 calls, 4262 messages, 12 937 snapshot entries — and never
  read for its wording; it is evidence (§9.2).
- **`docs/design/panel.html` was read only for its embedded fight data**, which is
  where F2's half of the finding is. §8 calls it a drawing and not a source, so a
  disagreement between it and the panel is not a finding about the code — and the
  version string it carries is one such disagreement, deliberately not filed.
- **The nine spec bodies were not read sentence by sentence.** They carry the
  same stale capture counts F3 is about — "seven captures", "both captures",
  "8 fights, 400 engine calls" — and those are **not** filed. A spec is a dated
  record of a decision, its filename carries the date, and the previous audit
  ruled the same way on the same sentences.
- **The two prior audit bodies were read only for their status, their findings
  and the passages `AGENTS.md` and the guards cite.** Where this document says a
  finding recurs, the claim rests on those passages.
- **Test bodies outside the files quoted were outlined and grepped, not read
  through.** `tests/ui/panel-view.test.ts` (1 695 lines) and
  `tests/game/engine-attachment.test.ts` (1 539) are the second and third largest
  files in the repository and neither was read end to end.
- **Duplication was hunted by repeated-literal, repeated-regex and
  repeated-helper sweeps plus targeted reading.** F17 and F18 were found by
  reading rather than by any sweep, which is evidence that the same-decision-in-
  different-words kind is under-counted here rather than absent.
- **The panel was not run.** `.claude/skills/verify/` is how it would have been
  looked at, and the gate cannot see a panel either.
