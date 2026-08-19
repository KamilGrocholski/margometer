# The whole tree, read a fourth time

Status: closed
Read at: fee5870

The fourth audit, and the first since the tree roughly doubled. The third one
read `760dffc`; between that commit and this one there are 77 commits and 174
changed files — six new recordings, three new registers, 24 new specs, a
released version, `README.en.md`, `screenshots/`, `tsconfig.userscript.json`,
two `libs/` primitives, the measuring seam, twelve `src/ui/` modules, six tools
and about twenty-five guards. Four rules in `AGENTS.md` had never been audited at
all: §7.7 itself, §9.8, §9.9, and §9.6's four inference clauses.

Two of §7.7's triggers were met. A release tag was cut — `v0.7.0`, with `main`
pinned to it — and rounds since have touched layers no audit has read.

⚠️ **The reading was widened into all three things the third audit listed as not
read**, and every one of them answered. `docs/protocol-keys.md` was read by hand
and F3 is what came back; `tests/ui/panel-view.test.ts` was read end to end and
F4 carries one line of it; the spec bodies were read and are the one widening
that produced nothing. The mutation sweep was run for the first time by an audit,
and F2 is the most expensive thing in this document.

The gate is green at `fee5870`, so nothing below is a bug a machine here can see.
F2 is the exception that proves the shape of the rest: it is a defect a machine
*could* see and does not.

## What was measured

`bun run check` at `fee5870`. The working tree carries one modification —
`TODO.md`, the maintainer's own, uncommitted — and nothing else; no guard reads
that file's contents, so the gate is the tree's:

```
tsc --noEmit                     no output, exit 0
tsc --noEmit -p tsconfig.userscript.json
                                 no output, exit 0
bun test                         5153 pass, 0 fail, 1546592 expect() calls
                                 79 files, 5.00 s
bun run build.ts                 dist/margometer.user.js, dist/margometer.meta.js
```

That figure is the tree before this document exists: `tests/tools/audit-status.test.ts`
runs its shape checks once per audit and once per finding, so writing this adds
tests to the count.

Five tools were run for their answers rather than as subjects:

```
bun tools/decoding-status.ts     7128 messages, 7128 fully read,
                                 0 carrying an unread key
bun tools/fight-report.ts        17 captures; the unattributed row is zero in
                                 every one, and no capture holds an unreadable
                                 message
bun tools/drill-report.ts --cases
                                 2867 breakdown rows over 17 captures
bun run cost                     every recording replayed, per phase
bun tools/changelog.ts notes 0.7.0
                                 the section exists and reads as a player's
```

**The served build was compared against the cache** — §7.6's check, which the
third audit declined. `bun tools/game-client-source.ts status` on 2026-08-19
answers `production served 1786514810315 cached 1786514810315 current` and
`development served 1781609507010 cached 1781609507010 current`. Neither is
stale, so nothing was fetched, and the production build the register cites most
often is the one being served. `tests/frozen-help-phrases.ts` records its dump as
fetched `2026-08-18T05:09:40.752Z`, inside §7.6's week.

Three things were measured rather than read.

**The material**, by a script reading the JSON rather than grepping it, over the
seventeen recordings held on 2026-08-19: 870 engine calls, 7 128 messages, 830
payloads carrying both `m` and `mi` with equal lengths in 830 of 830 and 40
carrying neither, 846 payloads carrying `w` with 4 036 entries between them in
fragments of 1 to 11, 18 712 snapshot entries, and `init` on exactly one call per
recording.

**The import graph**, rebuilt from all 530 `from "@/…"` specifiers in `libs/`,
`src/`, `tools/` and `tests/`. No dynamic `import()` and no side-effect import
anywhere, so the specifier list is the whole graph.

**The mutation sweep**, run for the first time by an audit and scoped to code
added since `760dffc`. It refuses a dirty tree, and the maintainer's `TODO.md`
edit is one, so it was run in a detached worktree at `fee5870` rather than by
touching the working tree:

```
libs/running-total.ts              2 mutants    0 survived
libs/elapsed-spans.ts              9 mutants    0 survived
src/userscript-instrument.ts       0 mutants    (nothing to mutate)
src/cost-phases.ts                 8 mutants    8 survived
src/ui/panel-row-key.ts           41 mutants   10 survived
src/core/combatant-health.ts     116 mutants   36 survived
```

176 mutants, 54 survivors, none killed by shape alone.

Read in full: `libs/` (9 files), `src/core/` (7), `src/game/` (6), `src/ui/`
(19), the four files at the root of `src/`, `tools/` (16), `build.ts`, the
meta-guards under `tests/tools/`, `AGENTS.md`, `NOTICE.md`, `README.md`,
`CHANGELOG.md`, all three `.github/workflows/`, both `tsconfig` files,
`.claude/settings.json`, `docs/browser-support.md`, `docs/half-named-figures.md`,
`docs/protocol-keys.md` and the 28 spec bodies. The four pictures in
`screenshots/` were opened, which is what §9.8 asks and what no machine here can
do.

## Findings

### F1 — the four pictures in the README show a panel the add-on no longer draws

`screenshots/` was taken on 2026-08-18 at 13:47Z and carries `"version": "0.7.0"`,
which is still what `package.json` says. `tests/tools/panel-screenshots.test.ts`
compares those two strings and the directory against the sidecar, and passes.
What it cannot compare is the panel.

The sidecar names the fight: `2026-08-15-tempest-grupa-vs-hildur-4`. Composing
that fight through today's tree, on the screen the first picture shows
(`Otrzymane`, `Wszyscy`), the panel draws a pinned row reading
**`Nieznany sprawca 38 800 (8%)`** and **no warning**. The picture shows
`Bez sprawcy 40 932 (8%)` and a warning about team healing without a stated
figure. Three separate changes have landed since the shutter: the row was
renamed and split in two (`0258b0f`), the wound moved to the attacker who applied
it so 2 132 points left that row (`3ec33db`), and the team heal became a figure
so the warning stopped (`docs/specs/2026-08-18-the-side-is-named-and-the-share-is-stated.md`).
`screenshots/panel-breakdown.png` and `screenshots/panel-deep.png` carry the same
three; `panel-deep.png` also shows a lone `Zwykły cios 61 305 (100%)` cross-section
that `docs/specs/2026-08-19-a-row-opens-only-what-it-does-not-say.md` stopped
drawing.

The pictures were not even current when they were taken: `v0.7.0` is `66a259f`
and the shot is eleven commits past it, six of them touching the panel. So the
set matches neither the release whose number it carries nor the tree it sits in,
and the version string — the only thing the guard reads — was already the wrong
question.

§9.8 says the set is for the version in `package.json` and no other, which is
true and is why nothing is red. A reader on `develop` is looking at a panel that
cannot be produced.

*Where:* `screenshots/taken-at.json:2`
*Closes:* guard `tests/tools/panel-screenshots.test.ts`

### F2 — the unwind's sign can be flipped and the whole gate stays green

`src/core/combatant-health.ts:277` is where a combatant's entry health is unwound
from the first statement the fight makes about them: `stated − everything decoded
so far`. Change that `-` to a `+` and `bun test` reports 5153 pass, 0 fail.

It is not inert. `bun tools/fight-report.ts` under the mutant differs on two
recordings — `2026-08-15-tempest-grupa-vs-draugr-1` and
`2026-08-15-tempest-grupa-vs-hildur-1` — and differs by a lot: `Gracz 2`'s
healing received goes from 8 946 to 112, `Gracz 5`'s from 8 988 to 1 456, and
side 1's total from 93 590 to 60 107. Those are exactly the two recordings
`docs/protocol-keys.md` names as the ones whose opening payload carries no
snapshot, so they are the only two that reach this line at all — and they are
the two the entry-health reader was rewritten for.

The whole of §9.6's clause about sizing a share onto a side rests on this module,
and its argument is that every input is refused rather than defaulted because
*too high is the one direction the panel cannot mark*. A 98% error in the other
direction is not marked either.

The sweep says the same thing about the module more broadly: 36 of 116 mutants
survive, and they cluster on the refusals — `percent <= 0` at `:272` and `:410`,
`entryHealth <= 0` at `:304`, the standing-ally test at `:344`, the stated-health
bounds at `:95` and `:97`, and the `=== → !==` flips on nine of the event-kind
branches. The file's own docblock already says the recordings exercise the
restraint and not the correction, and points at
`tests/core/combatant-health.test.ts` for the rest; that is the half this
measures, and the answer is that the hand-built fights do not reach it.

⚠️ **What the close reached, and what it left.** Six tests went in — the unwind
from a statement rather than a snapshot, the clamp at both ends of the fight, the
tolerance on both of its edges, and a combatant on one point read as standing —
and each was watched failing against the line it covers. The sweep run again puts
the file at 21 survivors from 116, down from 36. What is left is one cluster: the
`===` and `||` branches of `getHealthReadingOfEvent`, where each event kind states
which slot moved health and which stated it. Nothing there is unread — every one
is exercised through some fight — but nothing distinguishes the kinds from each
other, which is a round of its own and is written here rather than left for a
fifth audit to rediscover.

*Where:* `src/core/combatant-health.ts:277`
*Closes:* guard `tests/core/combatant-health.test.ts`

### F3 — the register of measurements is the one file the measurement guard does not read

`tests/tools/measured-material.test.ts` re-earns §3's rule that a figure over the
captures names its material. It walks `git ls-files libs src tools tests
build.ts` for `.ts`, plus four documents by name: `AGENTS.md`, `README.md`,
`README.en.md`, `NOTICE.md`. Nothing under `docs/` is in either list — so
`docs/protocol-keys.md`, which is 2 401 lines of measurements over the captures,
is the one file in the repository the guard cannot see.

What that costs is visible inside single entries. Each one carries a `*Shape:*`
line the register's own guard re-measures on every gate, and many carry a count
in their `*Evidence:*` prose that nothing re-measures. In 30 entries the two
disagree, and the prose is the stale half:

| entry | `*Shape:*` says | the prose beside it says |
|---|---|---|
| `-absorb` | 434 occurrences | 45 occurrences |
| `-absorbm` | 211 | 27 |
| `-blok` | 76 | 9 — "the rarest of the seven" |
| `+crit` | 561 | "All 52 occurrences arrive with no value" |
| `+acdmg` | 473 | 41 |
| `+resdmg` | 671 | 61 — "the most frequent of the nine" |
| `-poison_lowdmg_per` | 611 | 68 |
| `active_absorbdest_per` | 348 | 43, twice |
| `combo-max` | 304 | 31 |
| `active_decblock_per` | 215 | 26 |
| `+abmdest_per` | 186 | 18 each |
| `mana` | 89 | 15 |
| `+critslow_per` | 9 | "all 7 occurrences ride a blow carrying `+crit`" |

and seventeen more of the same shape. Every `*Shape:*` figure above was
re-measured against the seventeen recordings held on 2026-08-19 and every one is
right, which is the guard doing its job; every prose figure beside it is a
measurement from an earlier set of recordings.

The `+engback` entry is the one to read twice. Its own paragraph says *a count in
prose goes stale silently* and then states two — "the 13 occurrences the first
capture carried" and "13 of the 78 occurrences now" — against a `*Shape:*` line
reading 233. Three generations of this class have now been filed
(`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F3), a guard was
written for it, and the file most made of the figures it guards was left outside
its walk.

⚠️ **What the close found, which the reading had not.** Naming the recording each
figure was taken on made every one of them true again — every count above is
exactly what `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`
carries, so nothing had to be re-measured to be corrected. What did have to be
corrected is four **universals** the widening exposed, and those are claims rather
than counts: `active_absorbdest_per` reads `every value 5` where three later
recordings state `8` beside it, `active_block_per` reads `every value 15` against
`11` and `20`, `allslow_per` reads `every value 14` against `12`, and `energy`
reads `every one beside mana` where 22 of its 46 occurrences are. `+taken_dmg`
carried a fifth: `it rides every blow carrying -dmga, all 199 of them`, where nine
blows carry `-dmga` alone. Each is now stated against the recording it was
measured on, with what the wider material shows beside it.

*Where:* `docs/protocol-keys.md:855`
*Closes:* guard `tests/tools/measured-material.test.ts`

### F4 — a count written in words is a count the guard cannot see, and one of them is false

`tests/tools/measured-material.test.ts` matches a count of two digits or more,
and its docblock says so: the wide version admitting `two`…`twenty` was built and
thrown away because it flagged 38 sentences of which 2 were real. That trade is
defensible. What it leaves is a shape somebody keeps writing, and four of them
are in the tree:

- `src/ui/panel-combatant-detail.ts:73` — "it has one now, and the captures carry
  three", of `-evade`. **The captures carry eight**: eight occurrences of the key
  across four recordings, and eight counted onto rows by the aggregate. The
  sentence was written on 2026-08-12 when three was right, and carried across
  verbatim into this file on 2026-08-18 when it was not.
- `src/ui/panel-figure-text.ts:23` — "Measured over the captures as they stand:
  eleven ranked rows printed `0%` beside a figure". Neither the material nor the
  screens it counted are named, so the figure cannot be re-earned: over every
  metric and every side tab at 17 recordings, 45 ranked rows print `<1%`. The two
  examples the sentence names are both reproducible; the total is not locatable
  under any reading of it.
- `src/ui/panel-view.ts:441` — "All seventeen resolve every name". True today,
  and true only until the eighteenth recording.
- `src/game/battle-session.ts:9` — "holds between 1 and 11 of 11 warriors". True
  today; the scoping phrase sits in the previous sentence, which is what puts it
  out of the guard's reach even though the count is in digits.

The same shape appears in a test that counts its own table:
`tests/ui/panel-view.test.ts:2584` says "These are the twelve fights the protocol
can produce" above a list of **sixteen**, and that list is the machine-checkable
half of `docs/half-named-figures.md`.

*Where:* `src/ui/panel-combatant-detail.ts:73`
*Closes:* commit

### F5 — the row-key grammar is spelled again in a tool, and a mutant proves nothing notices

`src/ui/panel-row-key.ts` exists because the grammar of a drawn row's key was a
convention three files held separately
(`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F17). It is now
imported by `panel-view.ts`, `panel-drill.ts` and `panel-state.ts` — and
re-spelled as literals by a fourth reader, `tools/drill-report.ts:70-71`:
`"unannounced"`, `"leaf:unannounced"`, `"no-actor"`, `"no-target"`. That tool may
import the module — §9.1 lets a tool read `src/ui/`, and this one already imports
`panel-state.ts`, `panel-metric.ts`, `panel-reading.ts` and `panel-view.ts`.

The sweep settles that nothing holds the two spellings together: mutating
`src/ui/panel-row-key.ts:32`'s `"no-target"` to another string survives the whole
gate, as do `"nothing"`, `"back"`, `"combatant"`, `"target"` and `"skill"` at
`:84-88`. A rename on one side would leave `drill-report` classifying those rows
as something else, and `docs/drill-levels.md` is written from that tool and
guarded against that tool (`tests/tools/drill-report.test.ts`) — so the register
would follow the drift rather than catch it.

This is §9.3's rule about a name spelled twice, with the failure it names: the
panel still draws, and the gate still passes.

*Where:* `tools/drill-report.ts:71`
*Closes:* commit

### F6 — the captures' own field names are spelled in a second tool, and the quietest drift makes the redaction gate a no-op

§9.2 says the Polish field names inside `tests/captured-fights/*.json` stay as
they are and that **the boundary is the reader that parses them** — singular. §8
says the same of `tools/fight-dump-parser.ts`: *where the captures' Polish field
names stop*. Six of them do not stop there. `tools/captured-fight-intake.ts`
spells `ladunek`, `wojownicyPrzed`, `wojownicyPo`, `przy`, `swiat` and `wpisy`
itself, and nothing holds the two files to one vocabulary.

Two of those drift loudly and one does not. A misspelled `ladunek` leaves every
combatant undecided between player and monster and the intake throws by design.
A misspelled `wpisy` does not: `getCalls` at `tools/captured-fight-intake.ts:357`
reads the field, hands an absent one to `getArray`, and gets back an empty list —
so no name is collected, no id is undecided, no substitution is made, and the
recording enters the repository with every nickname in it. That is the one
promise `NOTICE.md` makes that is about a person rather than about a licence.

The tools that read a *recording* are deliberately excluded from
`src/game/engine-warrior.ts`'s ownership of the game's field names, and that
argument is written down and correct — but it is about the **game's** names. The
capture format's own names are ours, they are shared by exactly two files, and
§9.3's second clause is the one that applies: where two files must spell it, a
guard holds them to one vocabulary.

*Where:* `tools/captured-fight-intake.ts:357`
*Closes:* commit

### F7 — the wall in front of `TODO.md` does not stand in front of the tool the work is done with

§5 says `TODO.md` gets "no edit, no reformat, no tick, no reordering, **by any
tool**", and names `.claude/settings.json` as where the tool calls are denied.
The deny list holds six rules, covering `Edit`, `Write` and `NotebookEdit` under
two spellings each. `tests/tools/agent-permissions.test.ts` re-earns exactly
those three tools.

`Bash` is not among them, and `Bash` writes files: `sed -i`, a heredoc, `>`. An
agent working through the shell — which is how a session that prefers shell tools
works by default — passes straight through the wall, and the rule's own sentence
says the wall is what enforces it.

Nothing has gone wrong: git history shows `TODO.md` touched only by `todo:`
commits, which `tests/tools/todo-commits.test.ts` holds. The finding is that the
enforcement is narrower than the rule by exactly the tool most likely to be
reached for, and that the guard re-earns the narrow version.

*Where:* `.claude/settings.json:3`
*Closes:* rule §5

### F8 — §9.1's clause about which tools a test may read stops at the door of `tests/tools/`

§9.1 says a test may read a tool "only as its subject or as the reader of the
material", and that `tests/tools/` "names whichever tool it is about". The guard
(`tests/tools/source-layout.test.ts`, the last case of its `layers` block)
excludes `tests/tools/` from the check entirely, so inside that directory any
test may read any tool.

One does. `tests/tools/tracked-text.test.ts:5` imports `composeShotFileName` and
`PANEL_SHOTS` from `tools/panel-screenshots.ts`, and its subject is neither that
tool nor the captured material — it is which tracked files are text. The import
is the right call on §9.3's terms, since the image names would otherwise be
spelled twice; it is simply not what §9.1 says is allowed, and the rule's
enforcement stops one directory short of noticing.

Rule and guard disagree, in the direction that lets the tree do more than the
rule permits. Which of the two moves is the closing round's call.

*Where:* `tests/tools/tracked-text.test.ts:5`
*Closes:* guard `tests/tools/source-layout.test.ts`

### F9 — §2 says the measuring seam knows no layer; half of it imports the panel

`AGENTS.md:52` says the files directly in `src/` are `[any]`: "the entry point
may know every layer, while the version constant, the phase names and the two
halves of the measuring seam know none."

`src/userscript-instrument-development.ts:25` imports `@/src/ui/cost-overlay.ts`.
That is a layer, and it is deliberate — the overlay is where a development build
draws what it measured, and `src/userscript-instrument.ts`'s docblock argues at
length that the import must be on this side and not the other, because the
production half's import would put the overlay in the file people install.

So the code is right and the sentence is wrong, which is the direction that goes
unnoticed: §2's table is what decides which rules bind a file, and this file is
the one place in `src/` where the answer given is not the answer the tree gives.
Nothing guards §2's prose — `tests/tools/source-layout.test.ts` holds four
layers by allowlist and the root of `src/` is in none of them.

*Where:* `src/userscript-instrument-development.ts:25`
*Closes:* rule §2

### F10 — §9.1 says the panel never computes a statistic, and six of them live in `src/ui/`

`AGENTS.md:550`: "The panel renders state handed to it. It never computes a
statistic itself."

`src/ui/panel-reading.ts` computes six — `getMetricValue` adds two fields of the
aggregate together, `getHealingWithoutHealer`, `getDamageWithoutActor`,
`getDamageWithoutActorByElement`, `getHealthLostWithoutActor` and
`getHealthLostCausedBySource` each fold a row's maps into a figure the aggregate
does not hold. They are correct and they are argued for, but the argument is one
sentence inside `getHealthLostCausedBySource`: "§9.1's line is about a statistic
derived across *other* rows, which this is not."

A qualification that narrows a rule belongs in the rule (§7.5). As it stands the
rule reads absolute, one file's docblock reads it narrowly, and a reader
comparing the two has to decide which is binding — which is the same fault as a
guard that holds less than its rule, told from the other end.

*Where:* `src/ui/panel-reading.ts:125`
*Closes:* rule §9.1

### F11 — §3 names three places English may be dropped, and ten files drop it

`AGENTS.md:81` gives the exception: "the text a player reads, which is Polish —
the panel, `CHANGELOG.md`, and `README.md`, whose English is `README.en.md`
beside it."

`tests/tools/source-layout.test.ts:892` is the guard, and its list admits ten
files. Seven are the panel's and are inside the exception. Three are not:
`src/userscript-version.ts` (the phrase a build nobody made goes by),
`tools/changelog.ts` (six lines of Polish a player reads on every release) and
`tools/preview-site.ts` (the published preview, which is a page a player opens
without installing anything). `tools/captured-fight-intake.ts` is a fourth and
sits under §3's *other* exception, the captured material.

Each of the three carries a paragraph in the guard arguing its own admission, and
each argument holds. The list of places is the part that has not moved: it was
written when the panel and two documents were all there was, and the round that
widened the guard to `tools/` recorded that two sentences of §8 had been surviving
on a technicality (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`,
F4) without widening §3 itself.

*Where:* `AGENTS.md:81`
*Closes:* rule §3

### F12 — §8 puts `settings.json` beside the verify skill, and it is two directories away

`AGENTS.md:376`, in the structure block's entry for `.claude/skills/verify/`:
"`settings.json` beside it denies the tool calls that would write to the
maintainer's list (§5)."

It is not beside it. The skill is `.claude/skills/verify/SKILL.md` and the
settings are `.claude/settings.json`, which is where §5 correctly says they are
and where `tests/tools/agent-permissions.test.ts` reads them from. The structure
block is the one place in `AGENTS.md` that claims to say where things sit, and
`tests/tools/structure-block.test.ts` cannot reach this one: it asks `git
ls-files` for `libs`, `src`, `tools` and the repository root, so everything under
`.claude/`, `.github/`, `docs/`, `screenshots/` and `tests/` is described by
prose alone.

This is the third audit's F24 in a new file — that one found `settings.local.json`
described as sitting beside the verify skill, and the round that closed it moved
the sentence to a file that also does not sit there.

*Where:* `AGENTS.md:376`
*Closes:* commit

### F13 — two modules whose whole purpose is one spelling have nothing pinning the spelling

`src/cost-phases.ts` exists so that a phase name is written once: "Three readers
spell them… A name written twice is two names that eventually disagree." All
eight of its mutants survive. Every phase name — `payload`, `gesture`, `drag`,
`session`, `capture`, `reading`, `view`, `dom` — can be changed to anything at
all with the gate green, because all three readers import the constant and no
test asserts what any of them puts on a screen or in a terminal.

`src/ui/panel-row-key.ts` answers the same way for six of its ten survivors, and
F5 is what makes one of those six consequential. The other four survivors there
are boundaries: `divider < 0` at `:94` and `owner < 0` at `:110` can each become
`<= 0` or `< 1` unnoticed, which is §7.5's rule about testing a boundary from
both sides going unmet on a key whose grammar the module was written to own.

The two files together are the honest answer to §3's question asked of tests that
were never asked it: a constant imported by everything that reads it is held by
the compiler to be *the same*, and by nothing at all to be *right*.

*Where:* `src/cost-phases.ts:21`
⚠️ **Two of the eighteen were real and are closed; the rest are the tool.** Read
again on 2026-08-19, eleven of `src/ui/panel-row-key.ts`'s survivors are strings
inside its two **type** unions, which no mutation sweep here can kill — it runs
`bun test` and not the gate, so nothing typechecks a mutant. Three more are the
`< 0` boundaries, where a divider at position 0 answers `nothing` either way. What
was left is one uncovered branch — the answer for a key that *has* a divider and a
word nobody here wrote — and `tools/mutation-sweep.ts` now says in its own
docblock what a `(text)` survivor on a `type` line means.

*Closes:* declined — a constant every reader imports is one the compiler already holds to be the same, and the words reach a terminal and a development overlay and nothing else, so a test pinning them would have no consumer but itself; the survivors that something outside could read were the row keys, which F5 closes. The one place the phase names are spelled again is `docs/specs/2026-08-18-what-a-payload-costs.md`, and `src/cost-phases.ts` now says so.

## Looked at and clean

Each of these looks like a fault from a distance, or is a place a fault would
hide, and neither is. They are here because *not looked at*, *looked at and
clean* and *a finding* are three answers, and the first goes missing by silence
(§7.7).

- **The layering graph matches §9.1 everywhere the rule draws a line.** Rebuilt
  from all 530 specifiers: `libs/` reaches upward nowhere, `src/core/` imports
  only itself and `libs/`, `src/ui/` never imports `src/game/`, `src/game/` never
  imports `src/ui/` or the entry point, and only `src/userscript-entry.ts` knows
  every layer. Outside `tests/tools/`, the only tools any test reads are the two
  §9.1 permits — F8 is about the directory the guard skips, not about a
  violation.
- **Every shared module has a second consumer.** `libs/` runs from 4 consumers
  (`elapsed-spans.ts`) to 47 (`number.ts`), and the five shared readers at the
  root of `tests/` from 2 to 43. §7.1's rule that a shared module appears at the
  second consumer holds with nothing to spare and nothing left over.
- **§9.5's register is true, including the row that owns nothing.** No `!`
  outside tests, no bare `new Error(`, no cast off `JSON.parse`, no
  `localeCompare` anywhere in `libs/`, `src/`, `tools/` or `tests/` — the one
  construct the table says is spelled nowhere is spelled nowhere.
- **The browser floor is what `tsconfig.userscript.json` says it is.** No
  `toSorted`, `Object.hasOwn` or `structuredClone` in shipped code; the two
  mentions of the last are comments explaining why it is not used.
  `docs/browser-support.md` carries its read date, names its source, and says in
  its own words which of its three halves is not complete.
- **The three registers no audit had read are held to the tree.**
  `docs/half-named-figures.md` against `tests/ui/panel-view.test.ts`'s table of
  every shape the protocol can send, `docs/drill-levels.md` against
  `tools/drill-report.ts --cases`, `docs/browser-support.md` against
  `composePanelStyleText()`. F4's last paragraph is about a sentence over that
  table, not about the table.
- **`docs/protocol-keys.md`'s `*Shape:*` lines are all right.** Twenty-one keys
  were re-counted against the seventeen recordings held on 2026-08-19 —
  `-absorb` 434, `+crit` 561, `heal` 1236, `poison` 496, `fire` 12, `injure` 151,
  `healall_per` 85, `heal_target` 78, `legbon_holytouch_heal` 133,
  `legbon_lastheal` 5, `winner` and `loser` 17 each, and nine more — and every
  one matches. F3 is about the prose beside them.
- **§9.6's four inference clauses each say what holds them, and each does.**
  `SELF_SOURCED_HEALING_KEYS` is three keys and `docs/protocol-keys.md` carries
  exactly three `*Cause:* the subject's own` entries; `WOUND_ANNOUNCEMENT_BY_TICK_KEY`
  is one pair with one `*Cause:* the wound's attacker` entry; `poison` and `fire`
  both read `*Cause:* nobody` and say why in their own entries; `getPartCharged`
  and the sizing in `src/core/combatant-health.ts` are each held by a measurement
  the tests re-run. F2 is about the coverage under the last of those, not about
  the clause.
- **`NOTICE.md`'s checkable claims hold.** Exactly one recording carries a
  `render` field and it carries 38 sentences, which is the figure the document
  states; the screenshots section that the third audit's F1 and F2 produced is
  accurate, including the two words it calls load-bearing.
- **`README.md` and `README.en.md` against the tree.** Every command they name is
  in `package.json`, the install path matches the banner and
  `.github/workflows/release.yml`, the browser sentence matches
  `docs/browser-support.md`, and the preview link matches what
  `.github/workflows/pages.yml` publishes and from where.
- **The three workflows.** The gate on every branch, the release refused unless
  the tag is an ancestor of `main` and `package.json` agrees with it, the page
  published from `main` — which is what makes README's offer of the preview true
  (§3, `docs/specs/2026-08-18-main-is-what-you-can-install.md`).
- **`CHANGELOG.md`.** `package.json` is `0.7.0` and that section exists;
  `bun tools/changelog.ts notes 0.7.0` composes it; the `[Niewydane]` section
  above it carries the work since.
- **The 28 spec bodies.** Read end to end, and the widening that produced
  nothing. They name seven functions that no longer exist under those names and
  several counts from earlier sets of recordings, and neither is filed: a spec is
  a dated record of a decision, its filename carries the date, and both prior
  audits ruled the same way on the same sentences. Where a decision has been
  replaced the newer spec says so and names the older one.
- **`.claude/settings.json` and the verify skill.** The deny list is what §5
  describes and what its guard re-earns; F7 is about what it does not cover and
  F12 about where §8 says it lives.
- **The panel's failure discipline.** Every `catch` in `src/ui/` is §9.6's
  region isolation rather than §9.5's laxity, and the once-per-fight console rule
  is met in `src/userscript-entry.ts` by construction and asserted by
  `tests/game/engine-attachment.test.ts`.
- **Size, recorded rather than filed.** The four largest functions are
  `composeFightStatistics` (442 lines), `decodeMessage` (301), `renderPanel`
  (288) and `composePanelMount` (245); the four largest source files are
  `src/ui/panel-view.ts` (1 162), `src/ui/panel-element.ts` (1 157),
  `src/userscript-entry.ts` (1 076) and `src/core/fight-decoder.ts` (1 061). Each
  of the four functions is one fold or one render with its reason written above
  it, and `TODO.md` carries the maintainer's own view pushing the other way — that
  `src/ui/` has too many files. Both pressures are real and this audit decides
  neither.

## What was not read

- **`tests/captured-fights/` was not opened as prose.** It was measured as data —
  17 files, 870 calls, 7 128 messages, 18 712 snapshot entries — and never read
  for its wording; it is evidence (§9.2).
- **`docs/design/panel.html` was not read.** §8 calls it a drawing and not a
  source, and the third audit's finding about the ability names embedded in it
  was closed by a guard that now re-earns their absence on every run.
- **The mutation sweep covered six files of the twenty-three added since
  `760dffc`.** Not swept, by name: `src/ui/panel-drill.ts`,
  `src/ui/panel-combatant-detail.ts`, `src/ui/panel-metric.ts`,
  `src/ui/panel-nobody.ts`, `src/ui/panel-reading.ts`, `src/ui/panel-shape.ts`,
  `src/ui/panel-figure-text.ts`, `src/ui/panel-tip-placement.ts`,
  `src/ui/cost-overlay.ts`, `src/game/engine-warrior.ts`,
  `src/userscript-instrument-development.ts`, `tools/drill-report.ts`,
  `tools/payload-cost.ts`, `tools/panel-screenshots.ts`, `tools/preview-page.ts`,
  `tools/preview-server.ts` and `tools/preview-site.ts`. Each mutant costs a full
  `bun test`, and the six that were swept cost 176 of them.
- **`tests/ui/panel-element.test.ts` and `tests/game/engine-attachment.test.ts`
  were outlined and grepped, not read line by line.** Their subjects were read in
  full and their test names were read in full — which is coverage as a name — but
  the third audit's standing note about the two largest test files is only half
  closed: `tests/ui/panel-view.test.ts` was read end to end and these two were
  not.
- **The panel was not run.** `.claude/skills/verify/` is how it would have been
  looked at, and F1 was settled by composing the view rather than by drawing it.
- **Nothing was fetched from the game or from the help.** The served build was
  compared and matched, so the question never arose; every claim in this document
  about either source is a claim about what the register already records.
- **`docs/audits/`'s three prior bodies were read only for their status, their
  findings and the passages `AGENTS.md` and the guards cite.** Where this document
  says a finding recurs, the claim rests on those passages.
