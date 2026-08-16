# AGENTS.md

The single source of rules for anyone — human or agent — working in this
repository. `CLAUDE.md` only imports this file. If a rule is not here, it is not
a rule.

---

## 1. Project

MargoMeter is a damage meter for [Margonem](https://www.margonem.pl/), a
browser-based turn-based RPG. It ships as a userscript that draws a statistics
panel over the running game.

**It reads and does nothing else.** No network requests, no automation, no
influence on how a fight plays out. It counts what already happened.

The data source is the **raw battle protocol** — the payload the game's own
engine receives from the server. We read it by wrapping the engine's update
function: the original runs first, its return value comes back untouched.

Stack: Bun + TypeScript, zero runtime dependencies, one bundled userscript as
output.

**This tree was rebuilt from scratch.** Only `tests/captured-fights/*.json` carried
over from the previous incarnation; every other file is new. Do not look to git
history before that point for how things "used to be done" — the conventions
here supersede it.

---

## 2. Boundary Labels

Rules below are tagged so you can tell at a glance whether one binds the file
you are touching.

**Strength** — how much room you have:

| Tag | Meaning |
|---|---|
| `[ALWAYS]` | Do it every time. No judgment call. |
| `[ASK]` | Stop and ask the user before doing it. |
| `[NEVER]` | Do not do it. Not "prefer not to". |

Untagged prose is context and reasoning — read it, but it does not bind.

**Scope** — where a rule applies:

| Tag | Meaning | Paths |
|---|---|---|
| `[any]` | Everywhere in the repo | — |
| `[libs]` | True in any project; knows nothing of this one | `libs/` |
| `[core]` | Pure logic: decoding, aggregation, contracts | `src/core/` |
| `[game]` | Anything touching the live game client | `src/game/` |
| `[ui]` | The panel and everything it draws | `src/ui/` |
| `[data]` | Material captured from the game | `tests/captured-fights/` |
| `[tools]` | Runs in a terminal, never ships | `tools/`, `build.ts` |
| `[docs]` | The register, the specs and the audits | `docs/` |
| `[process]` | Commits, validation, workflow | `.github/workflows/`, `.claude/skills/verify/` |

Two files sit directly in `src/` and are `[any]`, for opposite reasons.
`src/userscript-entry.ts` is allowed to know every layer at once, so no narrower
scope would be true of it. `src/userscript-version.ts` knows **no** layer — it is
a build-time constant substituted from `package.json` — so no narrower scope
would be true of it either, and §9.1 lets every layer read it. Naming only the
first left the file every layer reads bound by nothing
(`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F23).

⚠️ **This table is the map — keep it true.** A scope whose path no longer
exists, or a directory missing from this table, is the first sign the rules have
drifted from the tree. `tests/` outside `tests/captured-fights/` is deliberately
absent: a test is bound by the scope of the thing it tests.

---

## 3. ALWAYS

- `[ALWAYS] [any]` **Run the validation command after every change**, including
  a one-line edit. See §6.1. "It's too small to break anything" is how it breaks.
- `[ALWAYS] [process]` **Prove a new test can fail.** After writing a test,
  break the thing it covers and confirm it goes red, then restore. A test that
  cannot fail is worse than no test: it reports safety that is not there. Say in
  the commit message what you broke and what lit up.
- `[ALWAYS] [any]` **Cite the source for any claim about the game.** If a
  sentence would be true in someone else's repository reading the same protocol,
  it is a claim about the game, not about us — and it needs a reference to the
  game's own documentation, its client asset, or a measurement on the captured
  fights. This includes negative claims ("the log doesn't say who applied the
  poison"). **A quotation from the client carries the build it was read on** —
  without one it is dated to the day someone copied it, not to a state of the
  game. Procedure: §7.6.
- `[ALWAYS] [any]` **A measurement over the captured fights names the material it
  was taken on.** A recording is evidence and never changes (§9.2), so a figure
  scoped to one — "of the 197 announcements in
  `2026-08-06-tempest-grupa-vs-hildur.json`" — is true for good. A figure scoped
  to *the captures* is true until the next recording arrives, which is a date
  nobody wrote down: `1 794 of 1 794 captured entries` and `20 of 400 engine
  calls` were both exactly right when typed and both silently wrong within a
  fortnight. Name the file, or name the set and when it was that — `the 8
  captures of 2026-08-12`. Where the claim is about *every* recording rather than
  about a count, say that and drop the figure: "numbers in every captured entry"
  outlives its own arithmetic.

  ⚠️ **This is not §5's rule inverted, and the two have to be read together.** §5
  refuses a number nobody can re-derive from a fixed thing — test counts, file
  counts, a count of our own artefacts — because it has no referent and goes
  stale by construction. This rule is about a figure that *is* the citation §3
  demands, and the fix is the same one §7.6 applies to the client and §7.7 to an
  audit: give it its referent. A measurement without one is not evidence, it is a
  number.

  **Paid for three times, one commit apart each.** The third audit filed nine of
  them as F3 and declined to correct them again, because
  `src/game/fight-capture.ts:251` had been rewritten one round earlier to close
  the *second* audit's finding of the same shape and was invalidated by the very
  next commit. Correcting the figures was never the missing part; it had been
  done twice.
- `[ALWAYS] [core]` **Make unknown input loud.** A protocol key the decoder does
  not recognise becomes an explicit "unknown" event and surfaces in the panel.
  Silence is the failure mode that costs the most here: a number that is quietly
  too low looks exactly like a number that is right.
- `[ALWAYS] [any]` **Write English** — code, comments, test names,
  documentation, commit messages. Two exceptions, and neither is a matter of
  taste: §9.2 (field names inside captured material) and **the text a player
  reads, which is Polish** — the game is Polish and so are the people playing it,
  while this rule is about the repository reading as one thing. The boundary is
  the string itself: identifiers around it stay English, and a Polish sentence
  never carries our vocabulary — no `protokół`, no `klucz`, no `komunikat`, no
  key of the game's. A player is told what cannot be known, not why our reader
  cannot know it (`docs/specs/2026-08-11-the-panel-that-drills.md`).
- `[ALWAYS] [process]` **Leave the gate green.** Every commit passes §6.1 on its
  own, including when you split one change across several commits.

---

## 4. ASK FIRST

- `[ASK] [process]` **Committing or pushing.** Finish a round with changes in
  the working tree and a summary, unless told otherwise.
- `[ASK] [core]` **Changing the data contract** (`src/core/battle-event.ts` and
  anything that shapes what flows between decoder and aggregator). A field added
  to a type and forgotten downstream produces numbers that quietly shrink.
- `[ASK] [any]` **Deleting or skipping a test.** Including "it's obsolete" —
  especially then.
- `[ASK] [any]` **Adding a dependency.** This project has zero runtime
  dependencies and that is a feature.
- `[ASK] [data]` **Touching anything under `tests/captured-fights/`.** See §9.2.
- `[ASK] [any]` **Turning off a compiler flag or a guard test** to make
  something pass. The flag is the point.
- `[ASK] [any]` **Adding a file nothing uses yet.** See §7.1.

---

## 5. NEVER

- `[NEVER] [game]` **Send anything over the network from the userscript.** No
  `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`. This is checkable in the
  source and people do check it.
- `[NEVER] [game]` **Automate the game or change how a fight plays out.** No
  clicking, no synthesised input, no altering the engine's behaviour or its
  return values.
- `[NEVER] [data]` **Edit captured material to make a test pass.** The material is
  evidence. If a capture contradicts the code, the code is wrong or the
  understanding is — fix that, or record the discrepancy.
- `[NEVER] [any]` **Copy the game's own prose into this repository.** Key names
  and identifiers are functional and may be stored; the sentences the game
  displays are someone else's work. Player nicknames likewise: they never enter
  the repo.
- `[NEVER] [core]` **Invent data the log does not carry.** The protocol does not
  say who applied a damage-over-time effect or who healed. Showing "unknown" is
  allowed; guessing a name is not.
- `[NEVER] [any]` **Comment the obvious.** See §9.3.
- `[NEVER] [any]` **Leave a number in prose that a machine could compute.**
  Test counts, coverage, line counts and file counts go stale silently. If it
  can be measured, measure it at read time instead of writing it down.

---

## 6. Commands

### 6.1 Validation

```bash
bun run check      # typecheck + tests + build — THE GATE, must pass
```

Run it after every change. It is deliberately one command so there is no version
of "I ran the tests but not the build" — the build assembles the userscript and
can fail on its own.

- `[ALWAYS] [process]` **The local gate is the gate only against the lockfile.**
  A package sitting in `node_modules` that `bun.lock` does not name is ambient
  type information CI will not have, and `tsc` will use it without saying so.
  Paid for once: `@types/jsdom` had drifted in unlocked, its `NodeListOf` is
  iterable where the `lib` this repository sets makes it merely indexable, and a
  cast in `src/userscript-entry.ts` typechecked here and failed on the runner.
  Green locally and red in CI is the one failure the gate cannot report, so when
  the two disagree, **reproduce it against the lockfile before touching the code**
  — `bun install --frozen-lockfile` is what the runner does.

```bash
bun test           # tests only, while iterating
bun run typecheck  # types only
bun run build      # produces dist/margometer.user.js
```

### 6.2 Tooling

Tools are added when a question needs answering, not in advance (§7.1). Each one
that exists is listed here with what it answers. `tools/margometer-tool-error.ts`
is the exception and stays out of the table: it answers no question, it is the
base every tool below throws from (§9.5).

| Tool | Answers |
|---|---|
| `tools/fight-dump-parser.ts` | *What is inside a captured fight?* Parses dump files field by field and refuses anything unexpected. Library, not a CLI. |
| `tools/game-client-source.ts` | *What is the game serving, and give me its source.* `status` compares served build against the cache; `fetch [channel]` downloads into `.cache/` with provenance. §7.6. |
| `tools/protocol-key-table.ts` | *Which protocol keys does the client know?* Lifts them from the cached production bundle; `freeze` writes `tests/frozen-protocol-keys.ts`. |
| `tools/decoding-status.ts` | *How much of the protocol do we read?* Messages, events by kind, unread keys by frequency. Computed on demand — these figures never go into prose (§5). |
| `tools/fight-report.ts` | *What would the panel show for this fight?* Runs the decoder and the aggregate over each capture and prints the per-combatant table — everything the numbers hold, including what the panel has no room for. Prints the sides in the game's own numbering, the row nobody can be charged with, the messages it could not read with their reasons, and both sides of the outcome by name. |
| `tools/help-article.ts` | *What does the game's own documentation say about this mechanic?* `fetch` caches an article, `search` prints raw context around a phrase and exits non-zero when there is none, `freeze` writes `tests/frozen-help-phrases.ts` so the register's help claims are re-counted on every gate. §7.6. |
| `tools/captured-fight-intake.ts` | *This recording is worth keeping — put it in the repository.* Substitutes player nicknames, removes the game's ability descriptions, and writes the result into `tests/captured-fights/`. Refuses anything it cannot redact with certainty, and names the step that stays a person's. §9.2. |
| `tools/mutation-sweep.ts` | *Does this test light up when the thing it covers breaks?* Changes one character of meaning at a time, runs the gate, and reports what nothing noticed — §3's question, asked of code already here rather than only of a test being written. Writes mutants into the working tree, so it refuses to start against a dirty one. |
| `tools/changelog.ts` | *What does this release say for itself?* Cuts one version's section out of `CHANGELOG.md` and adds the note saying which attached file to click. `notes <version>` prints it; a version with no section refuses rather than publishing silence. |

---

## 7. Workflow Orchestration

### 7.1 Shape of a round

**Nothing exists before it is needed.** This applies to files, directories,
helper modules, tools and guards alike:

- A file is created in the commit that uses it. There are no files "for later" —
  the compiler enforces this (§9.3).
- A directory appears with its first file.
- A shared module appears at the **second** consumer, not the first.
- A guard test appears when there is something to guard: the layering rule lands
  with the second layer, not the first.
- A tool appears alongside the question it answers.

The intended shape (`core` → `game` → `ui`) is a **direction, not scaffolding**.

A round: understand the problem → change the smallest thing that addresses it →
validate (§6.1) → report (§7.4). If you catch yourself writing a plan, the
change is big enough to deserve one written down before the code.

### 7.2 Commits

Conventional Commits, English: `type(scope): effect`.

Types in use: `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`, `chore`.

**The header names the effect, not the activity** — "blocked hits reach the
panel", not "add block handling".

**The body is the primary record of reasoning.** The diff already shows what
changed; the message has to say *why this and not something else*. No length
limit. A one-line body on a non-trivial change is a gap, not brevity. Include:

- **Numbers, not adjectives.** "269 → 62 ms over 190 recordings", not "faster".
- **What decided it** — a measurement, or taste. Say which.
- **Rejected alternatives.** The code never records what was not chosen.
- **Whether the test can fail** — what you broke, what lit up (§3).
- **What stays open.** "Fixed" must not imply more than it does.

### 7.3 Parallelism and subagents

- Independent tool calls go in one message so they run concurrently.
- Delegate to a subagent when answering would mean reading across many files and
  you only need the conclusion. Do not delegate a single-file lookup.
- Do not run a search yourself that you have already delegated.

### 7.4 Reporting

End a round with: what changed, what you validated and what came back, what you
did **not** do and why. Report failures with the output. If a step was skipped,
say so. Do not describe work as done until the gate is green.

### 7.5 What a round teaches

A round that discovers something durable has three places to put it, and the
order matters:

1. **A guard**, if a machine can check it. Always the first choice.
2. **A rule in this file**, if it needs judgment. Second choice, and it should
   name the cost that produced it.
3. **The commit message**, if it is neither — dated, immutable, and enough.

What there is **no** place for: a file of accumulated lessons. An append-only
list with no producer and no consumer is the artefact this project deleted
14,000 lines of, and its weakness is not the writing but the not-reading. A
lesson that stays a lesson is inert; a lesson that becomes a guard or a rule
starts binding.

Rules that arrived this way, each paid for once:

- `[ALWAYS] [process]` **Restore a mutation from a copy, never with
  `git checkout`.** The file may be carrying uncommitted work from the round in
  progress, and `git checkout` takes it silently.
- `[ALWAYS] [process]` **Read back the result of a scripted edit.** A
  search-and-replace whose pattern no longer matches does nothing and says
  nothing — it looks exactly like one that worked.
- `[ALWAYS] [any]` **Extract structure with structure, not with a search.** A
  list gathered by grepping a whole file quietly includes its neighbours: two
  keys entered the first key table from a switch that had nothing to do with
  battle messages. Paid for twice, and the second time from the other side:
  `tools/protocol-key-table.ts` anchored on `O[0]){`, a name the **minifier**
  chose, and refused the next build entirely because it called the same variable
  `y`. A minified name is a dated fuse — match the shape it appears in. The test
  that should have caught it named `O` too, which is how a guard comes to agree
  with the bug it was written to prevent.
- `[ALWAYS] [process]` **A mutation that lights nothing is a finding.** Either
  the test is missing or the code is inert. Twice here it was the second, and
  both times the answer was to delete something rather than to add a test.
- `[ALWAYS] [any]` **Test the boundary from both sides, and zero is the boundary.**
  Paid for in three consecutive rounds, in three different layers, and every time
  it was the same shape: a comparison against `0` that no test stood either side
  of. `landed > 0`, `amount >= 0`, `amount < 0`, `statedCount > 0`,
  `lostMessages: 0` — thirteen surviving mutants between them, and not one
  changed a total on the captured material.

  That is exactly why it keeps happening: **zero is the neutral element of every
  sum here**, so getting the edge wrong moves no figure and changes what a figure
  *means*. A blow that landed nothing becomes a blow that never reached anybody;
  healing of nothing becomes a wound; a count of nothing becomes a message lost.
  §9.6 spends a paragraph keeping "measured nothing" apart from "could not be
  read", and this comparison is where the two touch.

  So: a test at `0` needs one at `1` beside it, and one below where the type
  allows it. A case sitting well clear of the edge holds one side of it — written
  as `30`, the smallest blow the game can report went missing from the drill and
  the suite stayed green.
- `[ALWAYS] [any]` **A test that parses somebody else's output holds a transcript
  of it, never a sample somebody typed.** Paid for twice, and the second time
  expensively. `tools/mutation-sweep.ts` looked for `(fail)` in what `bun test`
  prints; the runner prints `✗` inside escape codes, so every failure parsed as
  none — and the test beside it asserted against a hand-written sample, under a
  comment claiming it was the shape the runner produces. A guess about another
  program's output is a claim about that program (§3), so it carries the same
  burden: paste what it actually printed, or do not assert on it.
- `[ALWAYS] [any]` **What decides is the status; what parses is description.** A
  verdict derived from text somebody else formatted fails in the worst direction
  — silently, and toward "nothing is wrong". The same sweep derived "this mutant
  survived" from an empty list of failing files rather than from the exit code,
  so a cosmetic parser bug became a tool reporting that no test in this
  repository can fail. Where an exit code, a length or a type can carry the
  answer, the parsed text may only name and never judge.

### 7.6 Working from the game's own sources

Some questions can only be settled by reading the game client: what a protocol
key means, which keys the decoder does **not** know, in what order the engine
assembles a message. That is knowledge about someone else's system, so it comes
from the source and it is **dated by build**, because the game changes.

**Two channels, and they are not interchangeable:**

| Channel | Host | What it gives |
|---|---|---|
| **production** | `<world>.margonem.pl` | What players actually run. Minified, no source maps. |
| **development** | `experimental.margonem.pl` | Readable — original module paths and class names survive. |

The build id appears both in the script filename (`main.min<build>.js`) and in
the page as `build = { version: … }`, so it can be read with one light request
without downloading megabytes.

⚠️ **The readable channel is not the channel the material came from.** At the
time of writing the development build is *older* than production — it lags, it
does not lead — while the captured fights come from production. So:

- `[ALWAYS]` **Production decides.** A claim may be *found* in the development
  build, because that is the one a human can read, but it is **confirmed against
  production** before anything is built on it. The note records both builds when
  both were used.
- `[ALWAYS]` **Every claim about the game carries the build it was checked on.**
  A quotation without a build is dated to the day someone copied it, not to a
  state of the game.

**Where the files live, and what may leave.** Fetched sources exist only in
`.cache/`, which is outside git — a copyright requirement, not tidiness. What
may be lifted out of them are **functional names**: protocol keys, identifiers.
What may never be is the prose the game displays (§5). The cache records its own
provenance — channel, build, world, when it was fetched — because a directory
that does not say what it holds is a directory nobody can trust.

**When to re-fetch, and what I do without being asked.** Before basing a
decision on the sources I read the served build with one light request and
compare it to the cache. If they differ, or the cache is empty, **I say so and
propose fetching** rather than quietly working from something stale. If they
match, I say nothing and carry on.

Fetching is done by a tool in this repo, never by a command pasted from memory,
so that what was downloaded can be repeated exactly. It appears in §6.2 once it
exists.

### The published help — a different source, not a third channel

`pomoc.margonem.pl` is the operator's own documentation of the mechanics. It has
no build id and no readable twin, so the rules above do not transfer; it needs
its own, and it earns them because it is **the only source that says what an
effect does**. The client bundle says which keys exist and composes sentences
from them; it does not say that a wound is worth 15% of the damage taken.

- `[ALWAYS]` **Read it with `tools/help-article.ts`**, not with a summarising
  fetch. The mechanics article is large enough that a summariser answers with its
  table of contents, and "not found in the fetched text" then reads exactly like
  "the game does not document it". That false negative has been written into a
  register as a fact before.
- `[ALWAYS]` **Search by the engine name, not by a word.** The help prints it in
  parentheses beside the human name — `Unik ( evade )` — and that parenthesis is
  the only thing joining an article to a protocol key. A bare word matches longer
  words too and pushes the real hit past the limit.
- `[ALWAYS]` **Search a prefixed key by its stem as well.** A protocol key may
  carry a prefix the help does not: `-legbon_facade` is documented as `facade`,
  and searching `legbon_facade` and `legbon` found neither. The register carried
  "not documented — nothing establishes what the number counts" for that key on
  the strength of those two searches, and it was simply wrong. *Not found* and
  *not documented* are different claims, and this is how the wrong one gets
  written down: the phrases tried are recorded, and the one that would have
  worked was not among them.

  **Paid for twice.** The same rule was broken again on four keys of the same
  family — `verycrit`, `curse`, `cleanse`, `holytouch` — which the help documents
  and the register filed as undocumented, because the searches were `legbon` and
  the full key. Recording the phrases was never the missing part; it had been
  done. So the phrases now live on a `*Help:*` line the register defines, a claim
  of silence is **refused unless it tried the stem**, and every phrase is
  re-counted against `tests/frozen-help-phrases.ts`. A guard that only re-measured
  the phrases someone listed would have agreed with the bug.
- `[ALWAYS]` **A claim from the help carries the date it was read**, the way a
  claim from the client carries its build — the help has no build id, so the date
  is the only thing dating it. Guarded in the register by
  `tests/core/protocol-key-register.test.ts`.
- `[ALWAYS]` **Documentation settles a meaning; the captures settle a number.**
  Where the two disagree, the disagreement is the finding — the help does not
  overrule a measurement on our own material.
- `[NEVER]` **Copy a sentence of it into the repository.** Not even as evidence:
  an entry carries the locator (`view,372`, the engine name, the read date) and
  our own words. NOTICE.md says the game's prose is absent here in any form, and
  that has to stay true.

**When I reach for it, without being asked.** The rules above say how to read the
help and what may leave it; without this paragraph they say nothing about opening
it at all, and an agent that never does breaks none of them. That omission is not
hypothetical — it is why this channel sat unused for the whole life of the
register while §3 admitted it from the start. So:

- **Before filing or changing a verdict in `docs/protocol-keys.md`.** The
  register is where a claim about the game stops being a working note, so it is
  the last place a guess should arrive unchecked.
- **Before writing a negative claim** — "the protocol does not say who healed",
  "nothing documents this". I ask, and I record the phrases I tried, because
  *not found* and *not documented* are different claims and only one of them is
  usually true. The tool exits non-zero on silence so that difference is visible
  to a script and not only to whoever read the terminal.
- **When `bun tools/decoding-status.ts` puts a key at the top of the unread
  list.** That list is where the next question comes from, the help is where it
  gets asked, and the captures are what settle it. The shape of the round:
  unread key → help → measurement → guard → entry.
- **When the dump is a week old or more**, which the tool prints on its first
  line: I say so and re-fetch before deciding, the same way I compare the served
  build before working from a cached bundle. Reporting the age is the tool's
  job; doing something about it is mine.

### 7.7 Reading the whole tree at once

An **audit** is one round that reads the whole repository and writes down what it
found, dated by the commit it read. It measures this repository against its own
rules — which is a different job from every other document here. A spec records a
decision before the code exists; `docs/protocol-keys.md` records claims about
someone else's system; an audit records the state of ours on a day.

**Why one is needed at all, when §6.1 is a gate.** The gate can only be green.
Every rule a machine holds passes by construction, so a guarded rule is exactly
the rule an audit has least to say about. What it reads is the other half: the
prose that has drifted from the tree, the duplication that crossed §7.1's second
consumer without anybody counting, the exported name no test names, the rule that
was written and never guarded. None of those turns anything red, and all of them
are how a tree stops resembling its own description.

⚠️ **An audit is admitted here on one condition, and it is the condition §8's
first note exists to enforce: it is commissioned work, not a record.** It ships
`open` and the round after it closes it. A file of findings nobody acts on is
precisely the artefact §7.5 refuses — an append-only list with a producer and no
consumer — and the only thing separating this from that is that the next commit
is already the consumer. Two commits, and the second one is not optional.

**What an audit covers.** Not "the code": the code is what the gate reads. These,
and it says which it did:

1. **The gate**, run, with its output written down as numbers rather than as
   "passing" (§5).
2. **The rules no machine holds.** §3, §5 and §9 in full, minus what
   `tests/tools/source-layout.test.ts` already re-earns.
3. **Prose against the tree** — §8's block, §2's scope table, `README.md`,
   `NOTICE.md`. §8 says a block listing what does not exist "is how this document
   starts lying"; an audit is when somebody checks whether it has.
4. **Layering** (§9.1) and the register of value readers (§9.5).
5. **Duplication**, against §7.1: a concept spelled twice is a module overdue,
   and a concept spelled twice *differently* is a decision nobody made.
6. **Coverage** — an exported name that no test names. Not a percentage: a name.
7. **Size and split responsibility**, which is judgment and says so.
8. **What it did not read.**

- `[ALWAYS] [process]` **Say what was not read.** *Not looked at*, *looked at and
  clean*, and *a finding* are three answers, and an audit that offers two of them
  turns the first into the second by silence. This is §7.6's rule about the
  published help arriving from the other side, and it was paid for twice there.
- `[ALWAYS] [process]` **An audit carries the commit it read**, the way a claim
  about the game carries its build. A finding with no tree under it is dated to
  the day somebody typed it, not to a state of this repository.
- `[ALWAYS] [process]` **A finding names a file, and a line where there is one.**
  An observation that cannot be pointed at is an impression, and belongs in the
  commit message where it will not be mistaken for a measurement.
- `[ALWAYS] [process]` **Every finding closes into one of §7.5's three places — a
  guard, a rule, a commit — or is declined with a reason.** Declining is a real
  answer and the vocabulary has a word for it; leaving it open is not.
- `[NEVER] [process]` **Fix while auditing.** The reading and the fixing are
  separate commits, because a finding repaired in the same breath is a finding
  whose reasoning nobody can read back. It also keeps the audit honest about
  what the tree looked like: a file fixed before it was written down never
  appears, and the count of what was wrong quietly becomes the count of what was
  hard to fix.
- `[NEVER] [docs]` **Append to a closed audit.** The next one is a new file at a
  new commit. An audit that grows is a chronicle with a date on the wrong end.
- `[ALWAYS] [docs]` **An audit is dated to a commit and its citations are held
  to the tree.** `tests/tools/cited-paths.test.ts` walks `docs/` and knows
  nothing of history, so a finding whose close renames or removes a file has to
  be reworded in the closing commit. Paid for on the first audit's own last
  finding, which was "this test is named for the wrong thing" and became a dead
  citation the moment it was fixed. Write the finding so that closing it leaves
  the citation true — name the file that will exist, and say what was wrong
  about the old name rather than spelling it.
- `[ASK] [docs]` **Deleting an audit**, closed ones included. A closed audit is
  the only record of what was declined and why.

**The shape.** Held by `tests/tools/audit-status.test.ts`, and the part a machine
can re-earn is written in a vocabulary this section defines — the same split
`docs/protocol-keys.md` makes between an entry's prose and its `*Shape:*` line:

```
# The whole tree, read once

Status: open
Read at: a54ea70

## What was measured

## Findings

### F1 — a title naming the effect, not the activity

Prose: what is wrong, and what it costs.

*Where:* `src/game/engine-roster.ts:103`
*Closes:* open

## Looked at and clean

## What was not read
```

`Status:` is `open` or `closed`. `Read at:` is the commit the tree was read at.
`*Closes:*` is one of `open`, ``guard `tests/…` ``, `rule §N.M`, `commit`, or
`declined — <reason>`, and a `closed` audit has no finding still saying `open`.

Findings are ordered by the order they are to be closed. **There is deliberately
no severity word**: the register has none either, and a vocabulary of three
severities is three arguments per finding about which one it is, none of which
changes what gets done.

**When I reach for one, without being asked.** The rules above say what an audit
is and nothing about opening one, and an agent that never does breaks none of
them — which is the omission §7.6 had to be amended for. So:

- **Before a release tag.** A release is the moment the tree stops being ours
  alone, and `CHANGELOG.md` says what changed, not what is true.
- **When the same class of fault turns up in two different rounds.** Twice is
  the point at which "I fixed it" stops being the right response and "how many
  more are there" starts being the question.
- **When a round touches a layer no audit has read.** The directory is the index,
  as it is for `docs/specs/` — what is not in it has not been read.

---

## 8. Structure

Reflects the tree as it is. **Update it in the same commit that changes the
tree** — a structure section that lists directories which do not exist is how
this document starts lying.

```
AGENTS.md          These rules. The only place they live.
CLAUDE.md          One line importing AGENTS.md.
README.md          For humans: what this is, how to install and build it, terms
                   of service.
CHANGELOG.md       For players, and the only *document* here written in Polish
                   (§3) — the panel's own words are Polish too, and those are
                   source rather than prose. A release's notes are its section, verbatim, so
                   this is the only place a release says what changed. Entries
                   are typed and a released section is frozen — somebody already
                   has that version.
LICENSE            MIT — covers what was written here, and nothing else.
NOTICE.md          What of the game's is in this repository, and on what basis.

build.ts                 Bundles src/ into dist/ and prepends the userscript
                         banner. Writes the banner a second time on its own, as
                         `margometer.meta.js`, because 0.5.0 polls for that name
                         and a release without it stops every copy installed from
                         that version — silently. Also exports
                         composeUserscriptBanner() and both filenames, whose
                         second consumers are the test and the release notes.
package.json             Version, scripts. `bun run check` is the gate.
bun.lock                 What the gate is actually run against. Listed here
                         because §6.1 turns on it: a package `node_modules` holds
                         and this file does not name is ambient type information
                         CI will not have, which is the one failure the local
                         gate cannot report.
tsconfig.json            Strict flags standing in for a linter, and the `@/*`
                         import alias — §9.3.
.gitignore               What never enters git, including `.cache/` — which
                         `tests/tools/source-layout.test.ts` reads rather than
                         trusts (§7.6).
.github/workflows/       check.yml: the gate. release.yml: what a `v*` tag turns
                         into — the gate again, then the built userscript
                         attached to a GitHub release, because the banner's
                         `@updateURL` points at that asset and a release without
                         it breaks updates silently. Also the one place the tag
                         and `package.json` are compared.
.claude/skills/verify/   How to run the add-on rather than test it: the browser
                         harness that puts the built userscript in front of a
                         captured fight. Not a rule and not a gate — the gate is
                         §6.1 and cannot see a panel. `.claude/settings.local.json`
                         sits a directory above it and stays out of git, per
                         machine.

.cache/                  Game client sources, fetched on demand. NOT tracked and
                         never published — §7.6. Absent until first fetched.

docs/
  protocol-keys.md       What has been looked into, key by key: verdict,
                         evidence, state. Guarded both ways against the decoder
                         and the frozen table.
  specs/                 Dated design records. No index — the directory is one.
  audits/                This repository measured against its own rules, on a
                         day, at a commit — §7.7. Each one ships open and the
                         round after it closes it, which is the whole of what
                         separates the directory from a chronicle.
  design/panel.html      The panel, as a page you can click: the agreed layout
                         driven by the two captured fights, so a decision about
                         it can be looked at instead of imagined. Standalone by
                         necessity — a file opened from disk can fetch nothing —
                         and therefore a copy of the numbers rather than a second
                         reader of them. **It is a drawing, not a source**: where
                         it and the add-on disagree, the add-on is right and this
                         is stale.

  ⚠️ docs/ may hold a GUARDED register, a DATED spec, a design a spec points at,
  or a DATED and GUARDED audit naming the commit it read — and nothing else. No
  status, no progress, no chronicle of rounds. That sentence is the only thing
  standing between this directory and what the previous one became, and the
  audit is admitted by §7.7 on the condition that keeps it true: it is
  commissioned work with a consumer, closed by the round that follows it.

  ⚠️ The design is admitted on one condition, and it is the condition the rest of
  this directory is held to: **a spec has to name it**, so it cannot outlive the
  decision it illustrates without `tests/tools/cited-paths.test.ts` noticing.

libs/
  assert.ts              Assertions and their failure type. Depends on nothing;
                         outside both error hierarchies — §9.5.
  number.ts              Every number read or written. Reading returns null and
                         throws nothing, so the caller picks assert, error or
                         unknown; writing asserts, because the number is ours.
                         Whole, fractional, and either-of-the-two are three
                         questions and three readers — the third arrived at its
                         third caller, per §9.5.
  json.ts                JSON in both directions. Reading puts JSON.parse's
                         try/catch in one place and replaces its `any` with
                         `unknown`, returning the value or the SyntaxError and
                         never a bare null. Writing asserts, because
                         JSON.stringify answers `undefined` — the value, not the
                         text — for `undefined`, a function or a symbol, under a
                         return type saying `string`. §9.5.
  timestamp.ts           Date.parse without the NaN, and without the shapes it
                         accepts by surprise.
  text-order.ts          Putting two pieces of text in order, and saying which
                         question is being asked. `localeCompare` with no locale
                         reads the runtime's default, so the order belongs to the
                         machine rather than to the data — two tools sorted their
                         output that way. Two readers: deterministic code-unit
                         order for anything a machine diffs, and collated order
                         for anything a person reads, with the locale required
                         rather than defaulted.
  record.ts              Narrowing an unknown value to something with keys, which
                         `typeof` alone answers `"object"` for `null`. Two
                         readers because there were two questions: thirteen sites
                         in ten files had answered them both ways, eight
                         admitting an array as a record and five refusing one,
                         and neither group was wrong — the live client may send
                         either, a stored position may not.
  running-total.ts       Adding to a total a map already carries, where a key
                         nobody has seen starts at zero. One spelling in
                         JavaScript, so §9.5's criterion does not put it here —
                         §7.1's second consumer does, five times over: the same
                         three tokens sat in `fight-statistics.ts` twice, in
                         `panel-view.ts`, in `battle-session.ts` and twice in
                         `decoding-status.ts`, across three layers. A counter
                         over a map knows nothing of the game, the protocol or
                         the panel. Two readers, because a total per **pair**
                         starts its outer key at a map and its inner at a zero,
                         and that is two starting values in one expression.
  source-regions.ts      Where the comments, the text literals and the patterns
                         sit in a piece of source. One fact, wanted in two
                         shapes: the guards
                         read source with its comments gone, the mutation sweep
                         reads the spans it must not touch. Patterns and not a
                         parser, and the cost is in the safe direction for both —
                         a quotation mark in prose hides a span rather than
                         inventing one.

src/
  userscript-version.ts  What version this is, substituted at build time from
                         `package.json` — one source, because a constant here
                         would be a second and they would part company at the
                         first release nobody edited twice. Two readers: the
                         title bar, because reports arrive as screenshots, and
                         the copied report, because a figure without its version
                         cannot be tied to a release. Its fallback is the fourth
                         Polish string that ships, and the one no diacritic can
                         find — so the guard names the phrase instead (§3).
  userscript-entry.ts    Bundle entry point, and the only file that reads the
                         game off the page and writes a name back onto it. Wires the game to the reading, holds the session,
                         and mounts the panel — including the rule that the
                         console hears about a failing section once per fight and
                         not once per render, and its page-scoped twin: a reading
                         that throws and a recording that throws each say so once
                         and count the rest, on separate channels so neither
                         spends the other's one line. What the meter is told is a
                         value and not a literal at the call, because the literal
                         was missing an option for the life of the project and
                         nothing could see it — the guard reads the names off the
                         type. Says once per fight, in our own vocabulary and with
                         the fault names, what the panel says to the player in
                         theirs — the pair somebody needs to report it. Also the
                         only file that reaches
                         storage, which it does for one thing: where the panel was
                         last dragged to. A browser that refuses storage costs the
                         position and nothing else.
  core/
    margometer-error.ts  Base for everything the add-on throws — §9.5.
    game-build.ts        What a game build id looks like, and the two places the
                         client states one — a script filename and an inline
                         object. In `core` because it is the only layer both an
                         add-on file and a tool may read, and both must read it
                         the same way or the number in a recording and the number
                         in the cache stop meaning the same thing (§7.6).
    protocol-message.ts  Grammar of one message: two sides, then key/value
                         segments. Structure only, strict, reversible.
    battle-event.ts      What the decoder produces. Grows one variant at a time,
                         and holds three lines: a figure that measures something,
                         one the protocol merely declares, and health that moved
                         where nobody can be credited — §10. Health stated against
                         a **name** rather than an id is two variants and not one
                         signed variant, because damage and healing arrive under
                         keys with nothing in common and the client reads their
                         values in opposite orders.
    combatant-roster.ts  Who is in the fight, so a name the protocol states can
                         be matched to an id, and which side each is on. An
                         ambiguous name resolves to nobody — never to the first
                         match.
    fight-decoder.ts     Messages → events. Drops nothing, invents nothing.
                         Takes the roster; without one, names resolve to nobody.
                         A key it cannot read is named, one entry per occurrence,
                         so the panel can say which.
    fight-statistics.ts  Events → the numbers a panel draws, per combatant and
                         per side. Raw and applied kept apart, units never
                         totalled across, and what could not be read, attributed
                         or placed on a side carried rather than dropped. A
                         declaration reaches no figure, said as an empty case
                         rather than by falling through — the compiler refuses a
                         variant nobody decided about. Holds what a drill needs
                         and nothing derives cheaply: who hit whom, what moved
                         health when no blow did, who healed whom where the game
                         said, and a skill's figures — healing GIVEN, which is
                         not the row's healing received and says so. Healing is
                         the one quantity kept in both directions, because it is
                         the one that reads in both: a row holds what it received
                         and what it gave, and deriving the second from everybody
                         else's first would be a statistic computed in `ui` (§9.1).
                         The two are held to being one reading transposed, and to
                         balancing against what nobody announced.
  game/
    engine-battle-wrap.ts
                         The only code here that changes a running game: it
                         replaces `Engine.battle.updateData` so the protocol can
                         be read. Its own file so the whole of our contact with
                         the game is one sitting's reading. Original first, its
                         value untouched, no exception of ours escaping, and a
                         detach that removes only our layer — by identity, since
                         two copies of one build carry the same marker and either
                         one's remover would otherwise tear out the other's.
                         Refuses to wrap where any MargoMeter already is,
                         whatever version it claims: reading the marker's value
                         as a version meant an older copy of ours was not
                         recognised, a second layer went on, and every figure was
                         counted twice. Answers with what it
                         read rather than with a list: a payload that mentions no
                         messages and one whose shape we no longer recognise were
                         the same empty answer, so a renamed field read every
                         fight as zero. The companion count the client itself
                         never reads is what tells them apart — positive evidence
                         that messages were stated, so losing it costs a witness
                         and can never invent an alarm.
    engine-roster.ts     Who is fighting, read live, and — from `myteam` — which
                         side is the player's. The one thing `core` cannot know,
                         decided here so no core type has to carry it. Says how
                         many entries named somebody and could not be read, which
                         its own docblock had called the caller's business while
                         no caller counted it. Only an entry naming somebody
                         counts: the list is mostly health deltas, so counting
                         every refusal would report a few hundred drops a fight
                         and be noise rather than a warning. That the entries
                         split cleanly into naming everybody and naming nobody is
                         measured on the captures, not assumed.
    engine-attachment.ts Finds the battle object, which may not exist yet, wraps
                         it once and stops looking. The game does not replace it,
                         so this is a search and not a watch. Where another
                         MargoMeter already has the fight it stands down and says
                         which of the two happened — a copy that quietly draws
                         nothing reads as broken and gets reported as broken. A
                         battle object it is refused is said once and the search
                         goes on: the wrap's refusal used to escape the timer into
                         the game's page, and again every tick for the rest of the
                         minute. Both spellings of the engine are tried on their
                         `battle` and not on their presence.
    game-dictionary.ts   The client's own name for a thing, read from the page it
                         draws over: the game ships a dictionary keyed by
                         identifiers and exposes the lookup, so a player is told
                         what their own client calls an effect, in their own
                         language, and nothing of that wording is written down
                         here. Only a **name** counts — an answer still carrying
                         a `%val%` hole is a sentence with the figure cut out and
                         is refused, so the panel says its own short word instead.
    battle-session.ts    One fight accumulated payload by payload: `init` opens
                         it, the roster arrives in fragments that merge, and
                         `myteam` arrives once or never. The fight is kept decoded
                         against the roster it was read with, **by identity** —
                         keyed on the roster's size instead, a fragment that
                         corrected a name left every event already read attributed
                         under the old one, and damage stated against that name
                         reached nobody for the rest of the fight. Counts the fights it has
                         watched open, which is the only thing surviving the
                         reset — a warning is scoped to one fight (§9.6). Counts
                         what could not be read out of a payload too, by kind and
                         with the losses that could be sized, which needs no
                         scoping of its own: the reset is what a fight start
                         returns to. A payload with a fault changes the session
                         even when it carries nothing, because the caller redraws
                         on identity and a count nobody looks at is a count that
                         is not there.
                         Pure — the mutable variable belongs to whoever drives it.
    fight-capture.ts     The same fight kept so it can be written to a file: the
                         payload copied whole, and the combatants as the fight
                         held them before and after the call. The other direction
                         of `tools/fight-dump-parser.ts` — the same format, so a
                         new recording stands beside the ones already captured.
                         Thinned as it is collected; redacts nothing, because
                         redaction is the intake tool's job and this file's output
                         never enters git.
  ui/
    panel-names.ts       What the panel calls each name of the game's own: the
                         client's identifier for it, and a phrase of ours for
                         where the game has none or is not there to be asked.
                         The identifier is functional and may be stored; the
                         sentence it resolves to never is (NOTICE.md). Ours is
                         what every test and every browser without the game sees,
                         so it is a real answer rather than a placeholder.
    panel-row-key.ts     The key a drawn row carries, composed and read in one
                         place. It was a convention three files held separately —
                         `panel-view.ts` wrote the keys, `panel-element.ts`
                         invented one more for the breadcrumb, `panel-state.ts`
                         took them apart by comparing prefixes — and nothing
                         stated it. What a key **means** is a value rather than a
                         prefix each caller reads, so what an unrecognised one
                         opens is decided once. A skill's own key can carry a
                         colon, because it is the game's identifier where there
                         was one and the skill's name where there was not.
    panel-state.ts       What a click does to the panel's state: four pure
                         functions, a state and a control in, the part that
                         changes out. They lived among the wiring in the entry
                         point, which is `[any]` so that it may do the wiring —
                         not so that it may keep code knowing no layer at all.
    panel-stylesheet.ts  The panel's stylesheet, as one string. Out of
                         `panel-element.ts` because it was 330 lines of CSS
                         beside a renderer, a drag and a tooltip, and because it
                         takes nothing and returns a string — the split with the
                         fewest edges rather than merely the biggest.
    panel-tokens.ts      Every colour, space and radius, named once, plus the
                         contrast arithmetic a test needs to hold them to §9.7.
                         The bar tint is a measured value, not a taste. Two of the
                         lengths are numbers first and CSS second, because the
                         first drag has to work out where the stylesheet already
                         put a corner-anchored panel. The share of the window the
                         panel may cover is a taste, and says so.
    panel-placement.ts   Where the panel sits, as a value: the corner it starts
                         in, where a drag lands, and what a remembered position
                         has to prove before it is believed. No DOM, so the clamp
                         that keeps the panel reachable is checkable on its own.
                         Writes the top edge twice, once as a length CSS can
                         subtract: the ceiling that keeps the panel above the
                         bottom of the screen is measured from it, and CSS cannot
                         read an inline `top` back out.
    panel-view.ts        What the panel shows, as data — and, with the tooltips
                         and region names in `panel-element.ts` and the phrases
                         in `panel-names.ts`, one of the four files that ship
                         whose strings are Polish (§3), which is a claim
                         `tests/tools/source-layout.test.ts` now re-measures
                         rather than a sentence beside a filename. One ranking on
                         two axes — a noun and a direction — with a side filter,
                         totals only, the drill and its breadcrumb, what a
                         combatant with nothing gets instead of empty sections,
                         and the row for what nobody can be charged with — on all
                         four screens, because every one of them has something to
                         say about it and one of them used to say nothing. The
                         direction decides what: on two the figure stands apart, on
                         two it is already inside the rows, and that one fact fixes
                         the sentence, the screen's denominator and whether the
                         summary needs a third part. Holds that summary too — the
                         fight in two figures and what belongs to neither side,
                         which is the same whole every bracket divides by, on every
                         screen and not only the ranking. The axes
                         are derived and the metric stays the one field the state
                         holds, so a pair with no figure behind it is a screen
                         that cannot be expressed. Entering an opponent asks
                         *with what*, so that level lists the skills used on them
                         and closes them against that pair's own figure, with the
                         damage types beside it as a second cut of the same
                         number; a cut of one row is not drawn, because it repeats
                         the total standing over it. Every token of the game's
                         is named before it reaches a label — by the running
                         client where it has a name for it, otherwise by
                         `panel-names.ts` — and one nobody has named travels as
                         the game wrote it rather than as a guess, with the
                         captures swept so that last rung is never what a player
                         actually meets. Takes its own input type and its own
                         function type for that naming, so `ui` names no
                         direction to `game` — including what the engine layer
                         could not read, declared structurally here and optional,
                         because a caller with no engine truthfully has nothing to
                         say about it and nothing to say is not zero. That gap is
                         said **above** everything the decoder qualifies: those
                         lines suspect a total, these state that the material
                         never arrived, and where nothing counted how much the
                         sentence loses its figure rather than gaining a nought.
                         Says how
                         many bars the list asks for and which screen it is —
                         a floor the ranking keeps and a breakdown only grows past,
                         and an identity nothing draws, so a redraw can be told
                         from a move and the reader keeps their place. No ceiling
                         here: what a list may have is a question about a screen,
                         and this file knows nothing about screens. No DOM, so
                         all of it is checkable.
    panel-element.ts     The same, drawn. Takes a document as an argument, opens
                         one shadow root, listens at that root for every control
                         it draws, and renders region by region so that one
                         failure is the size of the thing that failed. The right
                         button goes back from anywhere in the panel. The title
                         bar the panel is dragged by — and the three buttons on
                         it, one copy, one for the raw material, one collapse —
                         is built with the shadow root and not with the render,
                         because a redraw replaces everything the render made,
                         and a fight redraws every few seconds. That redraw is also
                         why the one number this file reads back out of a document
                         is read at all: where the reader had scrolled to, taken
                         off the old list and handed to the new one. Holds the
                         ceiling too — the panel against the window, and the list
                         as the only region that gives way to it. The summary's bar
                         draws a segment per part that has a figure and no bar at
                         all where there is nothing to divide, because a split of
                         zero is a measurement of nothing.

tools/
  margometer-tool-error.ts
                         Base for everything the tooling throws — §9.5.
  fight-dump-parser.ts   Parses captured fight material. The boundary where the
                         files' Polish field names stop — §9.2. The engine call's
                         own argument is carried through unparsed, so the live
                         path can be replayed against the same material without
                         this file and `src/game/` both deciding its shape.
  game-client-source.ts  Fetches the client bundle into .cache/, with provenance,
                         and compares the cached build against the served one.
  protocol-key-table.ts  Lifts the client's key list out of that bundle; `freeze`
                         writes tests/frozen-protocol-keys.ts.
  decoding-status.ts     How much of the protocol we read, computed on demand.
  fight-report.ts        What a captured fight adds up to, per combatant — the
                         aggregate printed against real material, side by side
                         with what it could not read and who the game said won.
  help-article.ts        Fetches an article of the game's published help into
                         .cache/ and prints raw context around a phrase. Prints
                         the age of the dump, and says NOT FOUND out loud —
                         silence is a claim too, so it also exits non-zero. Its
                         `freeze` counts the phrases the register cites into
                         tests/frozen-help-phrases.ts, so a claim about somebody
                         else's document stops being prose.
  captured-fight-intake.ts
                         The gate a recording passes to become material: player
                         nicknames substituted, the game's own ability
                         descriptions removed, both counted in the file itself.
                         Refuses rather than guesses — `npc` alone says who is a
                         person — and ends by naming the reading no test does.
  mutation-sweep.ts      §3's question, asked of the tests already here: change
                         one character of meaning, run the gate, and see whether
                         anything goes red. What nothing notices is a finding of
                         one of two kinds — an untested behaviour or an inert
                         line — and which is a person's reading. Mutants go into
                         the real files because that is what `bun test` reads, so
                         the original is held in memory and written back after
                         every run and it refuses to start against a dirty tree.
                         A kill by a guard that reads source as text is counted
                         apart: it says the spelling changed, not the behaviour.
  changelog.ts           One version's section of CHANGELOG.md, which is what a
                         release says, plus the note telling a reader which of
                         the two attached files to click. A pure function with a
                         test rather than `sed` in a YAML step: a line that only
                         runs when a tag is pushed shows its typo at the most
                         expensive moment. A version with no section refuses.

tests/
  captured-fights/       Raw battle protocol captured from real fights.
                         Evidence — §9.2.
  captured-fight-catalog.ts
                         Discovers that directory; exposes each capture, maximum
                         and starting health per combatant — different numbers,
                         only the second is what a team heal caps against, and the
                         second is missing for a combatant no snapshot ever saw
                         alive rather than reported as zero —
                         and the rosters, per call and per whole fight, the
                         latter deduplicated by id, without which every name in
                         a fight resolves to nobody.
  frozen-protocol-keys.ts
                         GENERATED by tools/protocol-key-table.ts. Every key the
                         client knows, with the build it was read from.
  frozen-help-phrases.ts GENERATED by tools/help-article.ts. How often each
                         phrase the register cites occurs in the published help,
                         with the dump those counts came from. Counts only — the
                         help's own sentences stay out of the repository, and a
                         count is our measurement rather than a piece of it.
  dated-document.ts      The one thing `docs/specs/` and `docs/audits/` share: a
                         filename that is a date, and a date that has happened.
                         Sharing it was rejected once and the rejection was
                         re-read rather than inherited — the objection was to a
                         module holding a single regex, and by the time it was
                         looked at again the two guards agreed on a regex *and* a
                         five-line check. Everything they disagree about — the
                         status vocabulary, the required sections — stayed where
                         it was, so neither file needs the other open.
  protocol-key-register.ts
                         Reads docs/protocol-keys.md into entries — verdict,
                         health line, evidence. The register's own guard and the
                         health witness both start here; a misspelled health
                         verdict is refused rather than read as silence, a
                         citation of the published help is held to carrying the
                         date it was read on, and each entry's `*Shape:*` line —
                         how many occurrences, where they sit, what they state —
                         is parsed into a structure a test re-measures. The
                         `*Help:*` line is the same for the published help, and
                         adds the one rule counting cannot supply: a claim that
                         the help is silent is refused unless it tried the key's
                         stem, which is the name the help prints. Its test
                         also holds the register against the captures: a key the
                         material carries and nobody has looked at fails the gate
                         rather than waiting in `decoding-status` for someone to
                         run the tool.

  ⚠️ A test sits where the thing it tests sits. The entries above the directories
  are the exception and stay at the root: they are material and shared readers
  rather than tests, the tools that generate a frozen table write it to that
  exact path, and `@/…` imports are absolute — so moving them would rewrite
  twenty files to no purpose. Named rather than counted, because the count was
  wrong the first time something was added beside them.

  libs/
    assert.test.ts  json.test.ts  number.test.ts  record.test.ts
    running-total.test.ts  timestamp.test.ts

  core/                  The decoder and the aggregate, and every claim about the
                         game held to the captures — those rules guard what the
                         decoder reads, so they live beside it.
    health-witness.test.ts   Decoded damage against the health the protocol
                             states — two sources nothing here reconciles. How
                             much of each fight it reaches is recorded per
                             capture: the floor was "more than none", which is
                             three and a half thousand comparisons below the real
                             figure and would have let the strongest guard here
                             go quiet without a word. Both
                             sides of every message, whole calls skipped where a
                             health figure cannot be added, and each health
                             verdict in the register re-earned on every run. Also
                             that a figure stated against a name resolves to a
                             combatant: over the calls the replay can use, and
                             over the roster a running fight holds, which are not
                             the same set and only the second reaches a capture
                             whose whole fight arrives in one call.
    last-heal-rule.test.ts   The rule for `legbon_lastheal`, which the witness
                             cannot reach: the capture carrying it has no snapshot
                             taken before its messages, so the health either side
                             comes from the protocol's own percentages, two
                             messages of them. The figure closes the gap between
                             them, the blow before it left the combatant under the
                             share the help documents, and the healing reaches the
                             named row while no giver is credited with it.
    injure-rule.test.ts      The rule the register states for `+injure`: the
                             share it announces — of the **main** blow, not of
                             everything that landed with it, which is the
                             narrowing four group fights forced — and that it is
                             read as a declaration so the wound is not counted
                             twice.
    absorption-destruction-rule.test.ts
                             What `+abdest_per` and `+abmdest_per` report: points
                             and not the share their names suggest, falling by at
                             least the smallest share any caster announces, down
                             to the floor of zero. The share belongs to the
                             caster and not to the skill — two are stated and
                             nobody states both — and the one reader that reports
                             without ever announcing is named rather than
                             filtered away.
    poison-reduction-rule.test.ts
                             The rule for `-poison_lowdmg_per`: once per
                             combatant damaged rather than per damage element,
                             always carrying a figure, and held to making no
                             health claim — which is what leaves the witness free
                             to earn the figures beside it.
    proc-rule.test.ts        What may be read as a flag: decoded from the
                             captures rather than from the decoder's list, plus
                             the key that looks like one and is refused because
                             the client states a figure for it.
    team-heal-rule.test.ts   What `healall_per` restores: a floored share of
                             maximum reaching one side only, the weakening the
                             protocol has already applied — counted per fight,
                             because a caster met in two of them starts again at
                             the base — the dead, who are reached and restored
                             nothing, and the cap, which one reading in the
                             material refuses. That refusal is why no figure is
                             drawn from it and the panel says the healing is
                             missing instead.
    skill-announcement-rule.test.ts
                             What an announcement carries: no key of the damage
                             family, but damage aimed at a name and healing ride
                             it in the same message — the correction of a claim
                             the register had settled wrong. Plus `combo-max`.
    announced-skill-rule.test.ts
                             What the game glues to an announcement, and what it
                             refuses to: one message forward, same combatant, and
                             a heal bound to whoever announced rather than to
                             whoever received it. That last one is written from a
                             mutation that lit nothing — the rule was right and
                             the test was missing (§7.5).
    fight-statistics.test.ts The aggregate: every figure landed is also a figure
                             taken, raw and applied stay different numbers, and
                             anything the log ties to nobody reaches the bucket
                             instead of a row. Says why a fight-scale check
                             against the snapshots is absent.
    declaration-rule.test.ts
                             What the protocol states that no total counts, and
                             the test a key passes to be read that way: every
                             standalone key alone in its message, the aggregate
                             computed twice and agreeing, the three keys the
                             health arithmetic settled, and the one it cannot —
                             where the healing is reported missing rather than
                             unknown.
    combatant-roster.test.ts The rule this module's own docblock calls the
                             failure the project exists to prevent: a name two
                             combatants answer to resolves to nobody, and one
                             person listed twice is still that person — which it
                             was not, for as long as ambiguity counted entries
                             rather than combatants.
    battle-event.test.ts  fight-decoder.test.ts  margometer-error.test.ts
    protocol-key-register.test.ts  protocol-message.test.ts

  game/
    fight-capture.test.ts    The recording as a file, and the round trip that
                             matters: what `src/game/fight-capture.ts` writes is
                             read back by `tools/fight-dump-parser.ts`, so a
                             new recording stands beside the ones already kept.
    engine-battle-wrap.test.ts
                             The promises the wrap makes to the game: original
                             first, its value untouched, no exception of ours
                             escaping, one layer, and a detach that leaves the
                             object as it was found.
    engine-attachment.test.ts
                             Finding the game on an injected clock, and the whole
                             add-on driven end to end by a captured fight through
                             the entry point the userscript actually runs. Also
                             the one loop no other file can close: a drag on a
                             mounted panel, and the position the next page opens
                             with — and the other one, the panel asking the
                             running client for a name: the two halves of that
                             live on opposite sides of §9.1 and this is the file
                             allowed to hold both.
    game-dictionary.test.ts  What counts as a label and what does not — the sign
                             dropped, a hole refused — and every way a page can
                             fail to answer: no lookup, no entry, the wrong kind
                             of value, a fault reading it. All four give our own
                             word rather than an exception the game would catch.
    engine-roster.test.ts    The layer that decides which side is ours, held
                             directly at last: what a warrior needs to be read,
                             the side `myteam` states and the null that is a real
                             answer, and the array **identity** the session leans
                             on to skip re-reading a fight — a contract that was
                             a comment and is now a `toBe`.
    battle-session.test.ts   How a fight is assembled from payloads: where one
                             ends, a roster that only ever grows, a side
                             remembered from the one payload that states it, a
                             fight count that outlives the reset, and a payload
                             carrying nothing that hands back the very session it
                             was given — except where it corrected somebody or
                             could not be read, which are changes with no figure.

  ui/
    panel-state.test.ts      The four reducers on their own: which level a key
                             opens, what a skill key may carry, and the guard
                             that stops `78` opening combatant `7`. Driven only
                             through the view until an audit asked what one of
                             them returns.
    panel-names.test.ts      The vocabulary held to saying each thing differently
                             from every other thing — and, since a sweep put a
                             sentinel through every entry with nothing going
                             red, to saying what it was written to say: the
                             tables are recorded entry by entry, so changing what
                             the panel calls something is one line of a diff and
                             has to be meant. Also — two quantities under one
                             label is a wrong number that looks right — to asking
                             a different question for each, and to asking nothing
                             at all about a token the client has no name for.
    panel-view.test.ts       Every sentence the panel says, recorded rather than
                             described — the §3 sweeps below check the words for
                             what they must not say and pass just as happily when
                             one phrase becomes a different phrase, which is how
                             55 string literals here took a sentinel with nothing
                             going red. Driven by the hand-written fight and not
                             the captures, because the drill names skills and
                             combatants and those are the game's own prose (§5).
                             Also: what the panel decides, without a document: the
                             ranking and its numbering, the height it asks for —
                             a floor of eleven bars the ranking keeps exactly and a
                             breakdown may only grow past, held on the captures
                             because the hand-written fight is too small to reach
                             it — which screen a redraw is of, the drill
                             and what closes each section against the row it was
                             entered from, the cut of one row that is not drawn at
                             all, zero and unknown as two different sentences —
                             and a sweep over every screen the panel has holding
                             its Polish to §3, so no word of ours and no key of
                             the game's reaches a player. That sweep runs twice:
                             once against words written down by hand, and once
                             against every token the captures actually carry,
                             because a hand-written list only ever forbids what
                             somebody thought of — two keys reached the screen as
                             the game wrote them for as long as they were missing
                             from it. Also that no bar is drawn past the end of
                             its track, which the hand-written fight cannot show
                             and the captures can. And the balance
                             the whole panel rests on, measurable only since both
                             directions of both nouns draw the row: what nobody can
                             be charged with comes to one figure and one share read
                             from either end, which is `Σ zadane + bez sprawcy = Σ
                             otrzymane` on real material. The summary is held to
                             closing against that same whole — it used to sum the
                             rows alone and draw up to 88% of a fight as nothing.
    panel-element.test.ts    The panel drawn, against §9.6 and §9.7, on a fake
                             document: what survives a region failing, that the
                             root serves every control, that a handler cannot
                             escape into the page, that the right button goes back
                             from anywhere, that the row saying something is
                             missing sits outside the scrolling, and that every
                             bar clears AA by measurement — each colour in the
                             role it is actually used in. The drag is here too,
                             including the one property the design exists for: it
                             still works after twenty redraws. The window is here
                             as well: that the panel is capped against the screen
                             and the list is the one region that gives way, and
                             that a redraw hands the reader back the place they had
                             scrolled to — a fight redraws every few seconds, so
                             without it a long list cannot be read at all. The
                             summary under the list is here at last: it was drawn in
                             every test in this file and asserted in none, which is
                             how it came to divide the fight in two while a fifth of
                             it belonged to neither side.
    panel-placement.test.ts  The arithmetic that decides whether the panel can be
                             dragged somewhere it cannot be dragged back from, and
                             what a stored position has to prove on read.
    panel-row-key.test.ts    The grammar itself, which nothing held before: the
                             round trip, so what one end writes the other reads
                             back as the same thing. `panel-state.test.ts` guards
                             one parser against the mis-slicing bug and says
                             nothing about whether the keys it is handed are the
                             keys the view composes.
    panel-tokens.test.ts     The one thing `panel-element.test.ts` cannot reach,
                             because it only ever hands this module colours that
                             can be measured: what happens to one that cannot.
                             `getProfessionInk` read `?? 0` on both sides, so two
                             unmeasurable colours came to `0` and `0`, `0 >= 0`
                             chose dark ink, and a badge nobody had measured
                             shipped as confidently as one that had been. Held now
                             to refusing, and to refusing with an **assertion** —
                             every colour reaching it is one of ours, so a null
                             means a token in that file is malformed and nobody
                             can handle it (§9.5).

  tools/                 The tooling, the build, and the rules the repository
                         holds itself to.
    source-layout.test.ts    Guards §9.3 imports-from-root plus §9.4 file and
                             function naming, §9.5 errors, assumptions and the
                             register of value readers, §9.6 no blocking dialogs,
                             §9.1 layering and §5 no network, §7.6 nothing
                             fetched enters git. Discovers files, never lists
                             them — which is why it keeps working after a move
                             like this one. Also that a docblock is followed by a
                             declaration and never by a second docblock: the
                             first of two is the orphan, because a reader
                             attaches it to whatever the second one already
                             claims. §5's language rules are three here
                             and not one: which files may **ship** Polish, and —
                             since the first reads shipped strings with the
                             comments stripped and so could see neither — that no
                             entry of the client's dictionary is **quoted**
                             anywhere, hole and Polish words together, and that no
                             name the game gave an ability is written down outside
                             the recordings. Comments, tests and `docs/` included
                             for both. The ability names are read off the captures
                             rather than listed, so the check cannot fall behind
                             the next recording. The register of owned constructs
                             holds four more that are not value readers at all —
                             the decoder's damage-key shape and the key it names a
                             combatant with, the messages of a whole recording,
                             and the running total — because §7.1's second
                             consumer had arrived for each of them several times
                             over. Which files may ship Polish now
                             reads `tools/` too — a release's notes are read by
                             every player who installs an update and are composed
                             there, so "not in the bundle" was never a reason to
                             be unwatched.
    cited-paths.test.ts      Every repository path this repository names in its
                             own text — documents and source comments alike —
                             points at a file that exists, every directory it
                             names is there, and every §N.M it cites is a section
                             these rules have. The move above left citations
                             behind across five files and nothing noticed; "held
                             by `x`" is the sentence that stops a reader checking
                             whether anything holds it.
    structure-block.test.ts  The block above, against the tree it describes: every
                             name in it exists, and every tracked file under
                             `libs/`, `src/` and `tools/` appears. Reads the block
                             by its indentation, not by searching it — §7.5. §8's
                             "update it in the same commit" had been prose only,
                             and this found a file that had never been listed.
    changelog.test.ts        The release gate, as a test: the version in
                             `package.json` has a section, that section stops at
                             its neighbour, a number inside an entry is not
                             mistaken for a heading, and every entry in the file
                             opens with its kind. A number bumped without a
                             section would publish a release saying nothing.
    audit-status.test.ts     §7.7's shape, and the one rule that keeps an audit
                             from becoming the thing §8 refuses: a closed one has
                             no finding left open. Also that the commit it says
                             it read is a commit — checked where the clone is
                             deep enough to look, which CI's is not.
    mutation-sweep.test.ts   The half of the sweep that decides what to break,
                             held without breaking anything: a comment is not
                             code, a module's name is not text the add-on says,
                             and the one that matters — what it changes, it
                             changes back byte for byte. The other half writes
                             mutants into a working tree, and a test of that is a
                             test that can leave one changed.
    game-client-source.test.ts
                             The tool that decides whether the cache is stale,
                             which had no test while its twin had one: the build
                             read off a page, the inline object beating a stale
                             script tag, and a channel check that no longer
                             admits `toString` off the prototype chain.
    measured-material.test.ts
                             §3's rule that a measurement over the captures names
                             the material it was taken on. A recording never
                             changes, so a figure scoped to one by name is true
                             for good and a figure scoped to *the captures* has a
                             date nobody wrote down — which is how `1 794 of
                             1 794 captured entries` was right when typed and
                             wrong a fortnight later, three times, one commit
                             apart. Deliberately narrow: it reads a count in
                             digits and not one in words, because admitting the
                             words took it from 5 sentences to 38 of which 2 were
                             real, and a guard that is wrong nine times in ten is
                             one somebody turns off.
    tracked-text.test.ts     Every file this repository writes, held to being text
                             a text tool can read. A literal NUL made the wrap's
                             own test file binary, so `grep -r` skipped all of it
                             in silence and a coverage sweep reported four of its
                             exports as named by nothing; the audit describing
                             that then did the same in the sentence describing it.
                             Reads bytes rather than asking `file`, which calls an
                             ESC byte text — there was one of those too. The
                             captures are left out on purpose: they are evidence,
                             and a guard whose only remedy is editing evidence is
                             one that gets turned off.
    captured-fight-intake.test.ts
                             The gate a recording passes to enter the repository:
                             every nickname substituted, the game's own ability
                             descriptions gone, and a refusal where either cannot
                             be done with certainty rather than a guess.
    captured-fight-catalog.test.ts  decoding-status.test.ts  help-article.test.ts
    protocol-key-table.test.ts  spec-status.test.ts  userscript-metadata.test.ts
```

Every layer named above exists. What the panel does, down to the words it says,
is `docs/specs/2026-08-11-the-panel-that-drills.md`; what it refuses to do is the
section of rejected alternatives that closes it. No fight is remembered once the
next begins. Exactly one thing survives a reload, and it is not a measurement:
where the panel was dragged to.

---

## 9. Rules

### 9.1 Architecture

- `[ALWAYS] [core]` **Dependencies point one way:** `ui → core`, `game → core`,
  everything → `libs`, entry point → everything. `core` imports from nothing but
  itself and `libs`.
- `[ALWAYS] [libs]` **`libs/` is the bottom layer.** It holds things true in any
  project — the assertion primitive, the value readers, narrow helper types —
  and knows nothing about the game, the protocol or the panel. It imports from
  `src/`, `tools/` and `tests/` never. The moment it reaches upwards it stops
  being shared code and becomes a second core, which is how a shared directory
  turns into a junk drawer.
- `[ALWAYS] [core]` **`core` is pure** — no `document`, no `window`, no
  `localStorage`, no timers, no knowledge that a game engine exists. This is
  what makes the decoder and the aggregator testable without a browser and
  without the game, and it is not negotiable for convenience.
- `[ALWAYS] [game]` **All contact with the game client lives in `game/`.** One
  place to audit, one place to break.
- `[ALWAYS] [tools]` **A tool may read `tests/`; a test may read a tool only as
  its subject or as the reader of the material — never for a tool's answer.**
  The captures live under `tests/captured-fights/`, so a tool that answers a
  question about them has to reach them: `tools/fight-report.ts` and
  `tools/decoding-status.ts` both do, through `tests/captured-fight-catalog.ts`.
  The other direction is real too, and it has exactly two shapes. `tests/tools/`
  is where the tools are tested, so a file there names whichever tool it is
  about. Everywhere else under `tests/`, two files in `tools/` may be read and no
  others: `tools/fight-dump-parser.ts`, because captured material is read with
  one reader on both sides and a second would let the live path and the offline
  path disagree about what a capture says; and `tools/margometer-tool-error.ts`,
  which is named as a subject where the two error hierarchies are proved
  disjoint (§9.5).

  ⚠️ **Paid for on arrival.** This clause first read "nothing in `tests/` reads a
  tool for its material", and `tests/captured-fight-catalog.ts` had been doing
  precisely that since before it was written — so a rule added to close an audit
  finding was false the day it landed, and nothing went red, because no guard
  held this direction at all. A rule nobody is held to is the shape the finding
  it closed was about
  (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F9).
- `[ALWAYS] [any]` **`src/userscript-version.ts` is readable from any layer.**
  It is a build-time constant and nothing else — substituted from
  `package.json`, knowing nothing of the protocol, the game or the panel. Two
  layers read it: `ui` draws it in the title bar, because reports arrive as
  screenshots, and the entry point puts it in the copied report. Neither is one
  of the four directions above, and it is named here for the reason the clause
  above it was rewritten — an undrawn edge is one nobody can be held to
  (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F10).
- `[ALWAYS] [ui]` **The panel renders state handed to it.** It never computes
  statistics itself.
- Prefer a narrow module over a broad one. A file that needs a table of contents
  needs splitting instead.

### 9.2 Data

`tests/captured-fights/*.json` is raw protocol captured from real fights. It is
**evidence, not test data**, and the difference is operative:

- `[NEVER] [data]` Edit it to make anything pass.
- `[ASK] [data]` Any change at all, including reformatting.
- `[ALWAYS] [data]` **Field names inside these files stay in Polish**
  (`ladunek`, `komunikaty`, `wojownicyPrzed`, …). This is the sole exception to
  the English rule: renaming them would be editing the evidence. The boundary is
  the reader that parses them — Polish names stop there and go no further.
- `[ALWAYS] [data]` **Fixtures are discovered by reading the directory**, never
  by a hand-maintained list of names. A file dropped in is checked immediately
  rather than sitting dead.
- `[ALWAYS] [data]` **An empty capture directory fails its own test.** A loop
  over nothing is green and proves nothing.
- Player nicknames are substituted before material enters the repo; game-written
  ability descriptions are stripped. Both are done by tooling, not by hand.

Computed numbers do not belong in data files — only raw material does. Our own
numbers belong in code, where they can be regenerated.

### 9.3 Code

- **No linter, by choice — the compiler replaces it.** `noUnusedLocals` and
  `noUnusedParameters` make dead code a compile error rather than something to
  read past. `noUncheckedIndexedAccess` makes indexing prove itself. `[ASK]`
  before weakening any of these; they exist to catch code that does not exist
  yet.
- **Comments say WHY, never WHAT.** The code already says what it does.
- **Comment only what earns it:** a decision with a rejected alternative, a
  measurement, a constraint imposed by the game, a trap someone will otherwise
  fall into twice. `[NEVER]` comment the obvious — no `// increment counter`, no
  restating a signature in prose above it.
- **Keep comments short.** A few lines. If a comment needs paragraphs, the
  reasoning belongs in the commit message and the comment points at it.
- **Unknown is loud, never zero.** A parse that fails returns `null` or an
  explicit unknown; it does not substitute `0` and it does not copy a neighbour.

**`[ALWAYS] [any]` Imports are written from the repository root.**

```ts
import { parseFightDump } from "@/tools/fight-dump-parser.ts";   // yes
import { parseFightDump } from "../tools/fight-dump-parser.ts";  // no
import { CAPTURED_FIGHTS } from "./captured-fight-catalog.ts";  // no — even a sibling
```

`@/*` maps to the repository root (`tsconfig.json` → `paths`). Two reasons, and
the second is the one that matters: a path reads the same wherever it appears,
so you can tell what is being imported without first working out where you are;
and moving a file no longer rewrites the imports of its neighbours. There is no
depth at which `../../` is acceptable, and no exception for same-directory
imports — mixing the two styles is how you end up needing to know both.

Imports are guarded by `tests/tools/source-layout.test.ts`, which discovers the
files rather than listing them.

### 9.4 Naming

This project follows the [naming cheatsheet][cheatsheet] by kettanaito. Read it
once; what follows is the binding subset plus the decisions it leaves open.

[cheatsheet]: https://github.com/kettanaito/naming-cheatsheet

**`[ALWAYS] [any]` A function name starts with the action it performs.**

The action is not decoration — it tells the reader what the call *does* to the
world before they read the arguments:

| Action | Means |
|---|---|
| `get` | Accesses data immediately. `getFruitCount()` |
| `set` | Assigns a variable from one value to another. `setFruits(next)` |
| `reset` | Restores a variable to its initial state. `resetFruits()` |
| `remove` | Takes something **out of** somewhere. `removeFilter(name, filters)` |
| `delete` | Erases something from existence. `deletePost(id)` |
| `compose` | Creates new data **from** existing data. `composePageUrl(name, id)` |
| `handle` | Handles an action; the usual name for a callback. `handleClick()` |

`remove` or `delete`? Look at the opposites: you `add` an item **to somewhere**,
so its inverse is `remove`; you `create` something with no destination, so its
inverse is `delete`.

Two more actions this project adds, because parsing is most of what it does, and
neither is covered above:

| Action | Means |
|---|---|
| `parse` | Turns text into a structure, throwing on anything unexpected. `parseFightDump(source)` |
| `decode` | Turns a structure into **meaning**. `decodeFight(messages)` |
| `require` | Returns a value narrowed to a type, or throws. `requireFiniteNumber(value, path)` |
| `expect` | Fails a test unless something holds. `expectDatedName(file)` — a test's action and nobody else's, and **not** a synonym for `assert`, which is §9.5's broken invariant and throws outside a test. |

`parse` and `decode` are not synonyms and the split is load-bearing here.
`parseProtocolMessage` knows the grammar and nothing about what a key means;
`decodeFight` knows what keys mean and nothing about the grammar. Keeping the
verbs apart keeps the layers apart.

Other verbs are allowed when they describe the action more precisely than
anything above — `build`, `write`, `render`. What is `[NEVER]` allowed is a
**synonym** for one already in the table: no `fetch` or `retrieve` where `get`
fits, no `update` where `set` fits. Two words for one action means every reader
has to check which one this codebase uses.

**`[ALWAYS] [any]` Names follow A/HC/LC:**

```
prefix? + action (A) + high context (HC) + low context? (LC)
```

`getMaximumHealthByCombatantId` = get (A) + MaximumHealth (HC) + ByCombatantId (LC).

**`[ALWAYS] [any]` Boolean names carry a prefix:**

| Prefix | Means |
|---|---|
| `is` | A characteristic or state of the current context. `isBlue` |
| `has` | The context possesses a value or state. `hasProducts` |
| `should` | A positive conditional coupled with an action. `shouldUpdateUrl(url, expected)` |
| `min` / `max` | A boundary. `maxHits` |
| `prev` / `next` | A state transition. `prevPosts`, `nextPosts` |

**S-I-D — short, intuitive, descriptive.** All three at once. Length is not the
goal, precision is: `id` stays `id`, but `hpp` becomes `percent`, because nobody
outside the game's own source knows what the third `p` stood for.

**Reflect the expected result.** `isDisabled`, not `isEnabled` used negated.

**No contractions.** `button`, not `btn`. `message`, not `msg`. Abbreviate only
where the game itself does, and say so in a comment when you do.

**Avoid duplicating the context a name already sits in.** Inside
`fight-dump-parser.ts` the function is `parseEngineCall`, not
`parseFightDumpEngineCall`.

**Singular is one thing, plural is a collection.** `combatant` holds one;
`combatants` holds many. A plural name that holds one value is a lie about the
data structure.

**Files are kebab-case and name their contents, not their category.**
`utils.ts`, `helpers.ts`, `common.ts`, `misc.ts` and `index.ts` are names nobody
can predict the contents of, and `[NEVER]` get created here — `index.ts` also
makes every editor tab read the same. Guarded by
`tests/tools/source-layout.test.ts`.

**Types name the thing, not its shape.** `CombatantSnapshot`, not `Warrior`,
`W` or `CombatantData` — `Data` says nothing that the type itself does not.

### 9.5 Errors

Throwing is right here, but only as a **local** mechanism. The add-on wraps a
function belonging to the game engine, so an exception of ours reaching the game
breaks the one promise the add-on makes.

**`[ALWAYS]` Every error we throw belongs to a branded hierarchy.**
`[NEVER]` a bare `new Error(...)`, and `[NEVER]` `extends Error` outside a base
file. The add-on shares a console with the game and with other add-ons; an error
that does not say whose it is costs whoever reports it and costs us reading the
report. The brand goes in `name`, where the console shows it first:
`MargoMeter/ProtocolMessageFormat`.

**Two hierarchies, one per world.**

| Base | Where | Name looks like |
|---|---|---|
| `MargoMeterError` — `src/core/margometer-error.ts` | ships to the browser | `MargoMeter/…` |
| `MargoMeterToolError` — `tools/margometer-tool-error.ts` | runs in a terminal | `MargoMeterTool/…` |

They are deliberately disjoint. A `catch` in the add-on must not swallow a tool
error believing it caught its own. Both bases are **abstract**: every kind of
failure gets a named subclass and a `code`, so callers tell them apart without
matching on message text.

**`[ALWAYS]` Catch narrowly — exactly the error you expect.** A bare
`catch (error)` around a call that can fail in one known way will also swallow
bugs, and a bug disguised as "the game changed" is the most expensive kind of
wrong number this project can produce.

**`[ALWAYS]` Pass the original in `cause` when wrapping.** Without it, all that
survives a `JSON.parse` failure is our own sentence, and the position the parser
choked on — the only useful part — is gone.

**An expected failure in shipped code is DATA, not an exception that
propagates.** The game changes its format, so the message becomes an "unknown"
event the panel can show. The parser may throw because it has exactly one caller
whose job is to convert that into an event.

**In `tools/`, throwing is the correct behaviour.** A tool handed bad material
refuses it loudly rather than reading half of it and carrying on.

#### Assertions are a different category

An error class and a `code` exist so that someone can **recognise a failure and
handle it**. That only makes sense for failures we know *can* happen. A broken
invariant cannot be handled — the only correct response is to fix the program —
so it gets neither.

`libs/assert.ts` therefore sits outside both hierarchies: `AssertionFailure`,
no `code`, its own root, `name = "MargoMeter/Assertion"`. This is the `Result`
versus `panic!` split, and it pays for itself immediately: a `catch` testing
`instanceof MargoMeterError` will not treat a broken assertion as a domain
failure, because it is not one. That falls out of the types instead of needing
discipline.

- `[ALWAYS]` Use `assert` / `assertDefined` for what must never happen.
  `[NEVER]` use them for a failure you know can occur — that is an error class.
- `[ALWAYS]` The message names the **invariant**, not the condition:
  `"SIDE_PATTERN captures the id"`, not `"id is not undefined"`. Where it broke
  comes from the stack, which gives the exact file and line.
- `[NEVER] [any]` **`!` (non-null assertion) in `libs/`, `src/` or `tools/`.**
  It is an assumption that says nothing when it turns out wrong: `undefined`
  travels on and surfaces as a bad number a layer later, where the cause is no
  longer visible. Use `assertDefined` — but first ask whether the type can
  simply be made precise. **An assert over a type that could have been exact is
  covering for a loose type**, and the fix belongs in the type.
- Tests keep `!`. A wrong assumption there fails the test anyway.

#### Reading a value: which of the three

The question is not "how much do I trust this variable". It is **who produced
the value**, and **can anyone act on the failure**:

| Where the value came from | Mechanism | Why |
|---|---|---|
| **Inside** — our own regex just matched it, our own invariant guarantees it | `assert` / `assertDefined` | Nobody can handle it; a break means the program is wrong. No `code`, travels up. |
| **Outside, in `tools/`** — a file, a fetched bundle | a branded subclass with a `code`, thrown | A tool refuses bad material loudly rather than reading half of it. |
| **Outside, in `src/`** — the live protocol | **data**: `null` → an explicit unknown event → a visible mark in the panel | An exception here reaches the game engine, and the user has to see that a number may be too low. |
| A default that makes the number look right | **never** | `0` is a measurement. Substituting it is the failure this project exists to prevent. |

The same value can need two of these in one function: a pattern that captured a
group proves the **shape**, so a missing group is an assertion — but it says
nothing about **magnitude**, and an id past 2^53 is the game's business, not
ours. Shape inward, magnitude outward.

- `[NEVER] [any]` **A cast off `JSON.parse`.** `as SomeType` on parsed text is
  external data wearing a type: nothing was checked, and the first absent field
  surfaces as `undefined` a layer later, where its cause is no longer visible.

#### One way to read a value, and it lives in `libs/`

JavaScript offers several spellings for reading the same value and they disagree
quietly. `Number("")` is `0`, `parseInt("12abc")` is `12`, `Date.parse("nope")`
is `NaN` and `NaN > limit` is `false`, `JSON.parse` throws and hands back `any`.
Each of those produces a value nobody wrote, and a number that is quietly wrong
looks exactly like a number that is right — the failure this project exists to
prevent.

So there is **one** way to read each, it lives in `libs/`, and everything else
asks it. What that costs when it is not followed: two files knowing what a
"valid id" is, disagreeing by a fraction, and a capture joining against a
combatant who does not exist.

**`[ALWAYS] [any]` A construct belongs to a primitive in `libs/` if it has more
than one spelling in JavaScript, or if it can answer with a value nobody wrote.**
`Number("")` → `0` is both. `new Date().toISOString()` is neither, and stays
where it is used — the criterion is what keeps this rule from swallowing every
line in the repository.

The register, and the file that owns each:

| Owner | Owns | Reading gives |
|---|---|---|
| `libs/number.ts` | `Number()`, `parseInt`, `parseFloat`, `BigInt`, `toFixed`, `.toString(radix)`, `String()` on a number, unary `+`, `typeof … === "number"` | reading: `getIntegerFromText`, `getDecimalFromText`, `getNumberFromText`, `getIntegerFromHexadecimalText`, `getIntegerFromValue`, `getFiniteNumberFromValue` → `number \| null`. Writing asserts instead: `composeIntegerText`, `composeDecimalText`, `composeHexadecimalByteText` |
| `libs/json.ts` | `JSON.parse` and its `try`/`catch`, `JSON.stringify` | reading: `getValueFromJsonText` → a reading carrying the value **or** the `SyntaxError`, so the caller still has something to put in `cause`. Writing asserts: `composeJsonText` refuses a value with no JSON rather than handing back `undefined` under a type saying `string` |
| `libs/text-order.ts` | `localeCompare` | `getTextOrder` → deterministic, by code unit, for anything a machine compares. `getCollatedTextOrder` → collated, with the locale required, for anything a person reads |
| `libs/timestamp.ts` | `Date.parse` | `getMillisecondsFromIsoText` → `number \| null` |
| `libs/record.ts` | `typeof … === "object"`, which is `true` for `null` | `getRecordFromValue`, `getRecordOrArrayFromValue` → `Record<string, unknown> \| null`. Two readers because a list arriving where an object belongs is a fault in one caller and a legitimate shape in another |

How to proceed when you need one:

1. **Look in `libs/` first.** It is there — use it.
2. **It is not there and it meets the criterion — add it there**, not at the call
   site. Also when there is only one caller: §7.1's "a shared module appears at
   the second consumer" is about modules, not about a function in a module that
   already exists.
3. **Reading returns `null` and throws nothing.** `libs/` does not decide policy —
   the caller picks assert, thrown error or unknown per the table above, and only
   the caller knows which. **Writing asserts instead**, because the number being
   written is one we produced: `composeIntegerText` refuses `1e21` rather than
   handing back the text `"1e+21"`.
4. **A new primitive lands with its entry in the guard's register** (below) and
   in §8. A primitive nobody is held to is a primitive with a second copy
   somewhere by next week.

Guarded by `tests/tools/source-layout.test.ts`: no unbranded error, no error
class outside the base files, each file extends the base belonging to its side,
no non-null assertions outside tests, **every construct in the register spelled
only by its owner — in tests too**, each owner still spelling what it owns, and
no cast off `JSON.parse`. The guards read source with its comments stripped — a
rule has to be explainable in the file it binds.

One exception, and it is the guard's rather than a licence: **a construct with no
name to search for is held to `libs/`, `src/` and `tools/` only.** `String(`,
unary `+`, `* 1` and the two `typeof` comparisons are patterns and not
identifiers, so `String(error)` in a test label matches while reading no value at
all, and no regex can tell the two apart. Written down here because it was the
guard's decision and not the rule's, which is a disagreement between two
documents that each claim to be the register
(`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F11).

### 9.6 UI

- The panel lives in a Shadow DOM and is cut off from the game's stylesheet
  (`all: initial` on the host). We are a guest on someone else's page.
- Event handling is delegated at the root, not bound per row, so re-rendering
  never loses handlers.
- Panel state that survives a reload is validated on read — never trusted raw
  from storage.
- **The panel says what it does not know.** Numbers the log cannot attribute to
  anyone are shown as unattributed, not silently folded into someone's total.

#### Failure in the UI — decided before any of it is written

The panel is a guest on someone else's page, drawn over a game the person is
actually playing. Two obligations pull against each other and **both** bind:
the user must be able to tell that something is wrong, and nothing we do may
stand between them and the game.

The rule that resolves every case below: **a number that might be wrong must
never look like a number that is right.**

- `[NEVER] [ui]` **Interrupt.** No `alert`, `confirm` or `prompt`; no modal, no
  overlay covering the game, no dialog to dismiss before continuing, no focus
  stolen, no sound. There is no failure in a damage meter worth a click from
  someone mid-fight.
- `[NEVER] [ui]` **Vanish.** A failure never blanks the panel. Whatever can
  still be drawn is drawn; only the part that failed is replaced, in place, by
  a short marker saying it could not be drawn. Losing the whole panel because
  one row misbehaved is a worse outcome than the misbehaving row.
- `[ALWAYS] [ui]` **Render section by section, each isolated.** A section that
  throws takes only itself down. This is what makes the rule above achievable
  rather than aspirational, so it is a structural requirement on the renderer,
  not a habit.
- `[ALWAYS] [ui]` **Put the warning where the consequence is.** The question a
  user actually has is *can I trust this number* — so the answer belongs next to
  that number, not in a global banner. Totals that may be too low are marked at
  the total; a combatant whose figures are incomplete is marked on that row.
- `[ALWAYS] [ui]` **Quiet by default, detail on demand.** The mark is small and
  static. What it means, and how to report it, comes on hover or click. Nothing
  animates, flashes or moves to attract attention.
- `[NEVER] [ui]` **Swallow silently.** Every caught failure produces both a
  visible mark and exactly one branded console entry — **once**, not per render.
  A repeat is counted, not reprinted; a render loop logging sixty times a second
  is itself a way of disturbing the user.
- `[ALWAYS] [ui]` **Treat a failure as state, not as a verdict.** Warnings are
  scoped to the fight that produced them and clear when a later fight decodes
  cleanly. Nothing gets permanently wedged, and nothing asks for a reload unless
  there is genuinely nothing else left.
- `[NEVER] [ui]` **Let an exception escape into the page.** Every event handler
  we register catches its own. An add-on that breaks the game's own scripts has
  done far more damage than one that shows a wrong number.
- `[ALWAYS] [ui]` **Keep "unknown" and "zero" apart on screen**, not only in the
  data. Zero means it happened and measured nothing; unknown means we could not
  read it. Rendering the second as the first is the exact failure this whole
  project is built to avoid.

Two severities are enough, and adding a third is `[ASK]`:

| Severity | Means | Shown as |
|---|---|---|
| **Suspect** | The numbers drew fine, but something was unreadable, so a total may be too low | A mark next to the affected figure; detail on demand |
| **Undrawn** | A section could not be rendered at all | That section replaced in place by a short marker; everything else unaffected |

Landed with the first UI file, and each still there: a test that a section which
throws leaves its neighbours rendered; a test that no code path calls `alert`,
`confirm` or `prompt`; a test that a handler which throws does not propagate out
of the shadow root; and a test that unread-key counts from the decoder reach the
panel instead of stopping at the aggregate.

The last of those went unmet for as long as `UnknownMessageEvent` carried only
the decoder's prose: counting per key needed the contract widened, which is
`[ASK]` under §4. It was asked, and the event now carries the keys themselves —
so the panel names them, and a reader can look one up here and in
`docs/protocol-keys.md` rather than reading a sentence they can do nothing with.

### 9.7 Design System

- **Tokens, not literals.** Colours, spacing and radii are named; a raw hex in a
  rule is a bug.
- **Dark-first.** The panel sits over a dark game client.
- **Text on a coloured bar must clear WCAG AA contrast**, checked by a test
  rather than by eye.
- **Colour never carries meaning alone** — it accompanies a label or a number.
- Concrete token values land with the first UI file, not before.

---

## 10. Glossary

Terms from the game, fixed here so module names do not drift apart.

| Term | Meaning |
|---|---|
| **fight** | One battle, start to finish. The unit everything is scoped to. |
| **turn** | One action by one combatant. Not a round of the whole roster. ⚠️ **Nothing here counts them.** The panel shows totals only — no rate, no divisor. Two readings were built and both were withdrawn; what was measured about them is in the commit that removed the feature, so it does not have to be measured again. |
| **roster** | The combatants on both sides, with side, level and profession. |
| **side** | Which team a combatant is on, as the game states it — a bare number. Which of them is the player's *own* is neither in the protocol nor in a capture, which does not record who recorded it; only the game layer can ask the client. So `core` groups sides and never favours one. |
| **protocol** | The raw payload the engine receives; our only data source. |
| **message** | One semicolon-delimited record inside the protocol payload. |
| **key** | A named field inside a message — decides what the message means. |
| **hit** | A single damage number. One attack can carry several. |
| **raw / applied** | Damage before and after reduction. Their difference is **not** what a defence stopped — see `prevented`. |
| **prevented** | Damage the protocol says a defence stopped: absorption, magic absorption, a block. One component of the reduction, never the whole — armour and resistance reduce as well and the protocol reports neither, so the rest of the gap is unattributable. Measured over every captured message carrying a defence: the gap is wider on most of them and **narrower on none** — the direction is the claim, and a tally here would be a figure with no date on it (§3). ⚠️ The gap is taken over damage whose **raw** side the protocol states — added damage (`dmga`) arrives applied with no raw counterpart, and counting it makes the gap too narrow to hold what a defence stopped. |
| **destroyed** | A statistic of the target an attack reduced — armour and absorption in points, elemental resistance in percentage points. Not damage, and never totalled with it; the members are not in one unit either, so they are not totalled with each other. |
| **proc** | An effect that fired alongside an attack. Carries no figure: the protocol states the name and stops. |
| **declaration** | A figure the protocol states that **no total here counts**: an *input* (a share a skill will apply, what it costs, a weakening the figures beside it already have), an outcome in a *unit this meter does not keep* (energy, attack speed, combination points, experience), or an outcome *outside the fight* whatever its unit (`afterheal`, a talisman restoring health once the battle is over). Read, and **never totalled with anything**. The test a key must pass: *whatever this figure did, is it reported elsewhere, or in a unit no total keeps, or outside the fight?* `healall_per` fails it — the health it restores is stated nowhere else, during the fight — so it stays unread and its warning is true. |
| **skill** | A named ability a combatant used. Its announcement carries no key of the damage family, but it is not always a message of its own: damage aimed at a name, and healing, ride the announcement itself. That the figure is the skill's doing is still not stated, so tying the two remains an inference, not a reading. |
| **element** | Damage type (fire, cold, physical, …), taken from the key. |
| **dot** | Damage over time, ticking outside a direct attack. |
| **unattributed** | A number the log does not tie to any actor. Shown, never guessed. |
| **unaccounted** | Health the protocol says moved in an amount nobody can size: a heal that reaches a whole side while the message names only the caster. Distinct from **unattributed**, which is a figure we have and cannot place — this is a figure we do not have. The panel states it ahead of anything it merely suspects, because it is the one warning that is certain rather than a maybe. |
