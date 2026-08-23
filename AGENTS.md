# AGENTS.md

The single source of rules for anyone — human or agent — working in this
repository. `CLAUDE.md` only imports this file. If a rule is not here, it is not
a rule.

Rules only. The reasoning behind each one lives where it can be checked: in the
file's own docblock, in the guard that holds it, and in git history.

---

## 1. Project

MargoMeter is a damage meter for [Margonem](https://www.margonem.pl/), a
browser-based turn-based RPG. It ships as a userscript drawing a statistics
panel over the running game.

**It reads and does nothing else.** No network requests, no automation, no
influence on how a fight plays out.

The data source is the **raw battle protocol** — the payload the game's own
engine receives. We read it by wrapping the engine's update function: the
original runs first, its return value comes back untouched.

Stack: Bun + TypeScript, zero runtime dependencies, one bundled userscript.
Only `tests/captured-fights/*.json` carried over from the previous incarnation;
git history before that point does not describe how things are done here.

---

## 2. Boundary Labels

| Tag | Meaning |
|---|---|
| `[ALWAYS]` | Do it every time. No judgment call. |
| `[ASK]` | Stop and ask the user before doing it. |
| `[NEVER]` | Do not do it. Not "prefer not to". |

| Scope | Meaning | Paths |
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

Untagged prose is context and does not bind. The files directly in `src/` are
`[any]`: the entry point may know every layer, and the version constant, the
phase names and the **production** half of the measuring seam know none. The
development half knows one — it imports `src/ui/cost-overlay.ts`, because the
overlay is where a development build draws what it measured, and the swap is what
keeps that module out of the file people install
(`src/userscript-instrument.ts`). A test is bound by the scope of the thing it
tests. Keep this table true — a scope whose path is gone is the first sign the
rules have drifted.

---

## 3. ALWAYS

- `[ALWAYS] [any]` **Run the validation command after every change**, including
  a one-line edit. §6.1.
- `[ALWAYS] [process]` **Prove a new test can fail.** Break what it covers,
  watch it go red, restore. Say in the commit what you broke and what lit up.
- `[ALWAYS] [any]` **Cite the source for any claim about the game** — its
  documentation, a client asset, or a measurement on the captures. Negative
  claims included. A quotation from the client carries its build. §7.6.
- `[ALWAYS] [any]` **A claim about a browser names the engine, the version and
  the date it was read** — §9.9. Somebody else's system, so the same shape §7.6
  gives the published help. The version is the **first** release with support,
  never the one that completes a partial implementation: the two differ by
  years, and the second is the number a compatibility table shows first.
- `[ALWAYS] [any]` **A measurement over the captures names the material it was
  taken on** — the file, or the set and its date. A figure scoped to "the
  captures" goes stale on the next recording. Where the claim is about every
  recording, say that and drop the figure.
- `[ALWAYS] [core]` **Make unknown input loud.** An unrecognised protocol key
  becomes an explicit unknown event and surfaces in the panel.
- `[ALWAYS] [any]` **Write English** — code, comments, tests, docs, commits. Two
  exceptions: field names inside captured material (§9.2), and **the text a
  person who plays the game reads**, which is Polish wherever it is composed —
  the panel, `CHANGELOG.md`, `README.md` (whose English is `README.en.md` beside
  it), the release notes in `tools/changelog.ts` and the published preview in
  `tools/preview-site.ts`. The list of files is not this rule's to keep: it is
  `tests/tools/source-layout.test.ts`'s, which admits one at a time and argues
  each. This sentence named three places while the guard admitted ten
  (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F11).
  Identifiers around a Polish string stay English, and a Polish sentence never
  carries our vocabulary or a key of the game's: a player is told what cannot be
  known, not why our reader cannot know it.
- `[ALWAYS] [process]` **Leave the gate green** — every commit on its own,
  including when one change is split across several.
- `[ALWAYS] [process]` **Work lands on `develop`; `main` is the latest release.**
  `main` is advanced only at a release and only by fast-forward, so its head is
  always exactly the newest `v*` tag. That is what lets the published preview and
  the file somebody installs be one build — README.md offers the page as what a
  release ships, and the offer is only true while this holds
  (`docs/specs/2026-08-18-main-is-what-you-can-install.md`).
- `[ALWAYS] [process]` **A release is pushed in three takts, and the wait is
  between the second and the third:** `develop`, then `main` once the `check` run
  that push started is **green**, then the tag. `main` is fast-forwarded to the
  **release commit** and not to whatever `develop` has grown since, which is what
  keeps the rule above true. The wait is not politeness: branch protection refuses
  `main` while the run is going, and that refusal is cheap — the tag going out
  first is not. `release.yml` fires on a tag push and on nothing else, so a tag
  arriving before `main` is refused by its own first step, and the later `main`
  push re-runs nothing: the version is tagged, the tree is right, and there is no
  release, which looks exactly like a release nobody asked for. Recover by making
  the tag arrive again — delete it on the remote and push it once more, onto the
  head of `main` where `main` has moved past it — safe exactly while no release
  was published from it. Paid for at `v0.8.0` on 2026-08-19
  (`docs/specs/2026-08-18-main-is-what-you-can-install.md`).

---

## 4. ASK FIRST

- `[ASK] [process]` **Committing or pushing.** Otherwise finish a round with the
  changes in the working tree and a summary.
- `[ASK] [core]` **Changing the data contract** — `src/core/battle-event.ts` and
  anything shaping what flows between decoder and aggregator.
- `[ASK] [any]` **Deleting or skipping a test**, including "it's obsolete".
- `[ASK] [any]` **Adding a dependency.** Zero runtime dependencies is a feature.
- `[ASK] [data]` **Touching anything under `tests/captured-fights/`.** §9.2.
- `[ASK] [any]` **Turning off a compiler flag or a guard test** to pass.
- `[ASK] [any]` **Adding a file nothing uses yet.** §7.1.

---

## 5. NEVER

- `[NEVER] [game]` **Send anything over the network from the userscript** — no
  `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`.
- `[NEVER] [game]` **Automate the game or change how a fight plays out.**
- `[NEVER] [data]` **Edit captured material to make a test pass.** If a capture
  contradicts the code, the code or the understanding is wrong.
- `[NEVER] [any]` **Copy the game's own prose into this repository.** Keys and
  identifiers are functional and may be stored; displayed sentences are somebody
  else's work. Player nicknames never enter the repo.
- `[NEVER] [core]` **Invent data the log does not carry.** Unknown is allowed, a
  guessed name is not. The one thing that is not a guess is an end the game's own
  documentation names — §9.6's third and fourth clauses, each narrow, listed and
  `[ASK]` to widen.
- `[NEVER] [any]` **Comment the obvious.** §9.3.
- `[NEVER] [any]` **Leave a number in prose that a machine could compute** —
  test counts, coverage, line counts. Measure at read time instead.
- `[NEVER] [any]` **Write to `TODO.md`.** The maintainer's hand-kept list: no
  edit, no reformat, no tick, no reordering, by any tool. Reading it is fine and
  git tracks it. What a round learns goes where §7.5 puts it. Its commit type is
  §7.2's.

  ⚠️ **The wall is narrower than the rule, and the rule is what binds.**
  `.claude/settings.json` denies `Edit`, `Write` and `NotebookEdit` against the
  file, and `tests/tools/agent-permissions.test.ts` re-earns those three. A
  permission list matches a **tool call**, and a shell writes with a redirect, a
  heredoc or `sed -i` — text no list of that shape can recognise without also
  refusing every command that merely mentions the file, `cat` included. So the
  shell is forbidden here and nowhere else
  (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F7). A round
  working through a terminal is the case this sentence exists for.

---

## 6. Commands

### 6.1 Validation

```bash
bun run check      # typecheck + tests + build — THE GATE, must pass
bun test           # tests only, while iterating
bun run typecheck  # types only
bun run build      # produces dist/margometer.user.js
```

The gate is one command so there is no version of "I ran the tests but not the
build".

- `[ALWAYS] [process]` **The local gate is the gate only against the lockfile.**
  A package in `node_modules` that `bun.lock` does not name is ambient type
  information CI will not have, and `tsc` uses it silently. When local and CI
  disagree, reproduce with `bun install --frozen-lockfile` before touching code.

### 6.2 Tooling

A tool arrives with the question it answers (§7.1).
`tools/margometer-tool-error.ts` answers none — it is the base the rest throw
from (§9.5).

| Tool | Answers |
|---|---|
| `tools/fight-dump-parser.ts` | *What is inside a captured fight?* Refuses anything unexpected. Library, not a CLI. |
| `tools/game-client-source.ts` | *What is the game serving?* `status` compares served against cached; `fetch` downloads into `.cache/`. §7.6. |
| `tools/protocol-key-table.ts` | *Which protocol keys does the client know?* `freeze` writes the frozen table. |
| `tools/decoding-status.ts` | *How much of the protocol do we read?* On demand — never quoted in prose (§5). |
| `tools/fight-report.ts` | *What would the panel show for this fight?* The per-combatant table over each capture. |
| `tools/drill-report.ts` | *What does a row open onto, and which rows open nothing?* `--cases` folds every capture into `docs/drill-levels.md`'s table. |
| `tools/payload-cost.ts` | *What does one payload cost, and where does the time go?* `bun run cost [runs]`. No DOM — the arithmetic under the panel, not the drawing of it. |
| `tools/help-article.ts` | *What does the game's documentation say?* `fetch`, `search` (non-zero on silence), `freeze`. §7.6. |
| `tools/captured-fight-intake.ts` | *Put this recording in the repository.* Substitutes nicknames, strips ability descriptions, refuses what it cannot redact. §9.2. |
| `tools/mutation-sweep.ts` | *Does this test light up when its subject breaks?* Refuses to start against a dirty tree, or against one whose gate is already red — where every mutant would be reported killed. A survivor is put to `tsc` before it is called one, so what the compiler refuses is reported apart from what nothing noticed. |
| `tools/preview-page.ts` | *What does the harness put in front of the panel?* The page as one string. Library, not a CLI. |
| `tools/preview-server.ts` | *What does the panel look like right now?* `bun run preview`. The gate cannot see a panel; this can. |
| `tools/preview-site.ts` | *What does it look like to somebody who installed nothing?* `bun run preview:site`. Nothing it writes is committed. |
| `tools/panel-screenshots.ts` | *What does the panel look like, as pictures for a README?* `bun run screenshots`. Four, for the current release only. §9.8. |
| `tools/changelog.ts` | *What does this release say for itself?* `notes <version>`; a version with no section refuses. |

---

## 7. Workflow Orchestration

### 7.1 Shape of a round

**Nothing exists before it is needed** — files, directories, modules, tools and
guards alike. A file is created in the commit that uses it; a directory appears
with its first file; a shared module appears at the **second** consumer; a guard
appears when there is something to guard; a tool appears with its question. The
intended shape (`core` → `game` → `ui`) is a direction, not scaffolding.

A round: understand the problem → change the smallest thing that addresses it →
validate (§6.1) → report (§7.4). If you catch yourself writing a plan, the
change deserves one written down before the code.

### 7.2 Commits

Conventional Commits, English: `type(scope): effect`. Types: `feat`, `fix`,
`perf`, `refactor`, `docs`, `test`, `build`, `chore`, and `todo`.

- `[ALWAYS] [any]` **`TODO.md` is committed on its own, as `todo: …`** — no
  scope, nothing else in the commit, so the maintainer's notes never arrive
  inside somebody's work and a `todo:` commit never hides a source change.
  Guarded by `tests/tools/todo-commits.test.ts`.

**The header names the effect, not the activity** — "blocked hits reach the
panel", not "add block handling".

**The body is the primary record of reasoning**, with no length limit: numbers
rather than adjectives, what decided it (a measurement, or taste — say which),
the rejected alternatives, what you broke and what lit up (§3), and what stays
open.

### 7.3 Parallelism and subagents

Independent tool calls go in one message. Delegate when answering means reading
across many files and you only need the conclusion; never a single-file lookup,
and never a search you have already delegated.

### 7.4 Reporting

End a round with: what changed, what you validated and what came back, what you
did **not** do and why. Report failures with the output, and say when a step was
skipped. Nothing is done until the gate is green.

### 7.5 What a round teaches

Three places, in order: **a guard**, if a machine can check it; **a rule here**,
if it needs judgment, naming the cost that produced it; **the commit message**,
if it is neither. There is no place for a file of accumulated lessons — an
append-only list with no consumer is the artefact this project deleted 14,000
lines of.

Rules that arrived this way, each paid for at least once:

- `[ALWAYS] [process]` **Restore a mutation from a copy, never with
  `git checkout`** — the file may carry uncommitted work.
- `[ALWAYS] [process]` **Read back the result of a scripted edit.** A pattern
  that no longer matches does nothing and says nothing.
- `[ALWAYS] [any]` **Extract structure with structure, not with a search.** A
  grepped list quietly includes its neighbours, and a minified name is a dated
  fuse — match the shape it appears in.
- `[ALWAYS] [process]` **A mutation that lights nothing is a finding** — a
  missing test or an inert line, and often the answer is to delete something.
- `[ALWAYS] [any]` **Test the boundary from both sides, and zero is the
  boundary.** Zero is the neutral element of every sum here, so a wrong edge
  moves no figure and changes what a figure means. A test at `0` needs one at
  `1` beside it, and one below where the type allows.
- `[ALWAYS] [any]` **A test that parses somebody else's output holds a
  transcript, never a typed sample.** A guess about another program's output is
  a claim about that program (§3).
- `[ALWAYS] [any]` **What decides is the status; what parses is description.**
  Where an exit code, a length or a type can carry the answer, parsed text may
  name and never judge.
- `[ALWAYS] [any]` **A rule narrowed in a docblock is a rule nobody else will
  read that way.** Where a round finds that the tree has stopped matching what a
  rule says, the rule moves — here — in the same commit. Qualifying it where only
  its one caller will see it leaves everybody else reading the absolute.
- `[ALWAYS] [process]` **`git add` before `bun run check`.** Half the gate lists
  what it reads with `git ls-files`, so a file written straight to disk is
  invisible to it: `cited-paths.test.ts` and `source-layout.test.ts` never see a
  new module, and the run is green because the file with the fault is not in the
  walk. Paid for twice — `tests/tools/measured-material.test.ts` records the same
  trap from the inside, having been unable to read its own prose for a commit.
- `[ALWAYS] [any]` **A guard narrower than the construct it owns reads exactly
  like a construct that is owned.** A register row is a claim that something is
  held in one place, and a green row is the whole of what anybody checks — so a
  pattern that misses the common spelling is worse than no row at all. Match the
  shape the tree actually writes: `libs/running-total.ts`'s row read `\w+\.get`,
  a map called by a bare name, while every map here hangs off a row — so two of
  the five copies the module was extracted to remove stayed in the file that
  imports it, in plain sight, under a green row
  (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F5).
- `[ALWAYS] [any]` **A test that reads a string back from the module that writes
  it holds the two to be the same, and neither to be right.** For anything a
  player reads, that is not a test — the sentence can be replaced by our
  vocabulary, by a key of the game's or by nothing at all, and every assertion
  still passes. Read the words, in words, at the point they are drawn. Paid for
  on nine of them at once, one being the row for what names neither end, which no
  recording has ever produced (F1, F4 of the same audit).

### 7.6 Working from the game's own sources

What a key means, which keys we do not read, how a message is assembled: that is
knowledge about someone else's system, so it comes from the source and is dated
by build. The build id is in the script filename and in the page as
`build = { version: … }`, readable with one light request.

| Channel | Host | What it gives |
|---|---|---|
| **production** | `<world>.margonem.pl` | What players run. Minified, no source maps. |
| **development** | `experimental.margonem.pl` | Readable — module paths and class names survive. |

- `[ALWAYS]` **Production decides.** A claim may be found in the development
  build — which lags production — but is confirmed against production.
- `[ALWAYS]` **Every claim about the game carries the build it was checked on.**
- Fetched sources live only in `.cache/`, outside git, by copyright requirement.
  Functional names may leave them; displayed prose may not (§5).
- Before working from the sources, compare the served build against the cache.
  If they differ, say so and propose fetching. Fetch with the tool, never with a
  pasted command.

#### The published help — a different source, not a third channel

`pomoc.margonem.pl` is the operator's documentation of the mechanics: the only
source that says what an effect *does*. No build id, so it has its own rules.

- `[ALWAYS]` **Read it with `tools/help-article.ts`**, not a summarising fetch —
  a summariser answers with the table of contents, and "not in the fetched text"
  then reads like "the game does not document it".
- `[ALWAYS]` **Search by the engine name**, which the help prints in parentheses
  beside the human one, **and search a prefixed key by its stem as well.** *Not
  found* and *not documented* are different claims; a claim of silence is
  refused unless it tried the stem.
- `[ALWAYS]` **A claim from the help carries the date it was read.**
- `[ALWAYS]` **Documentation settles a meaning; the captures settle a number.**
  Where they disagree, the disagreement is the finding.
- `[NEVER]` **Copy a sentence of it into the repository** — an entry carries the
  locator, the engine name, the read date, and our own words.

Reach for it without being asked: before filing or changing a verdict in
`docs/protocol-keys.md`; before any negative claim; when `decoding-status` puts
a key at the top of the unread list (unread key → help → measurement → guard →
entry); and when the tool reports its dump is a week old or more.

### 7.7 Reading the whole tree at once

An **audit** is one round that reads the whole repository and writes down what it
found, dated by the commit it read. It measures the half the gate cannot report,
since a guarded rule passes by construction: prose drifted from the tree,
duplication past §7.1's second consumer, an exported name no test names, a rule
written and never guarded. It is commissioned work, not a record — it ships
`open` and the round after it closes it.

What it covers, saying which it did: the gate, run, with numbers; the rules no
machine holds (§3, §5, §9, minus what `tests/tools/source-layout.test.ts`
re-earns); prose against the tree (§8's block, §2's table, `README.md`,
`NOTICE.md`); layering (§9.1) and the register of value readers (§9.5);
duplication against §7.1; coverage as a name and never a percentage; size and
split responsibility, which is judgment; and what it did not read.

- `[ALWAYS] [process]` **Say what was not read.** *Not looked at*, *looked at and
  clean* and *a finding* are three answers.
- `[ALWAYS] [process]` **An audit carries the commit it read.**
- `[ALWAYS] [process]` **A finding names a file, and a line where there is one.**
- `[ALWAYS] [process]` **Every finding closes into one of §7.5's three places, or
  is declined with a reason.** Leaving it open is not an answer.
- `[NEVER] [process]` **Fix while auditing** — reading and fixing are separate
  commits.
- `[NEVER] [docs]` **Append to a closed audit.** The next one is a new file.
- `[ALWAYS] [docs]` **Citations are held to the tree an audit read** by
  `tests/tools/cited-paths.test.ts` — the commit on its `Read at:` line, or the
  tree as it stands now, since a finding legitimately names both what it read and
  the guard its close created. That allowance is `docs/audits/` alone: every other
  document is a claim about now and is held to now. Write a finding whose close
  leaves its citation true; what the allowance buys is that a **later** rename
  cannot turn a dated record red and make editing one the only remedy, which the
  rule above forbids outright.
- `[ASK] [docs]` **Deleting an audit**, closed ones included.

The shape, held by `tests/tools/audit-status.test.ts`: `Status:` (`open` or
`closed`) and `Read at:` (a commit) under the title, then `## What was
measured`, `## Findings`, `## Looked at and clean`, `## What was not read`. A
finding is `### F1 — a title naming the effect`, its prose, then `*Where:*` a
path with a line and `*Closes:*` one of `open`, ``guard `tests/…` ``,
`rule §N.M`, `commit`, `declined — <reason>`. A `closed` audit has no finding
still saying `open`. Findings are ordered by the order they are to be closed,
and there is deliberately no severity word.

Open one without being asked: before a release tag; when the same class of fault
turns up in two rounds; when a round touches a layer no audit has read.

---

## 8. Structure

Reflects the tree as it is. **Update it in the same commit that changes the
tree**; held by `tests/tools/structure-block.test.ts`. Why a file is the way it
is belongs in its own docblock, not here.

```
AGENTS.md          These rules. The only place they live.
CLAUDE.md          One line importing AGENTS.md.
README.md          For players, in Polish: what this is, pictures of the panel,
                   what it does, how to install it, the live preview. No terms, no
                   licence, no notes for developers.
README.en.md       The same in English. The two are held to one skeleton by
                   tests/tools/readme-translations.test.ts — headings, pictures,
                   links — and never to one wording.
CHANGELOG.md       For players, in Polish. A release's notes are its section.
LICENSE            MIT — covers what was written here, and nothing else.
NOTICE.md          What of the game's is here, and on what basis.
TODO.md            The maintainer's list, by hand. `[NEVER]` written to (§5).
build.ts           Bundles src/, prepends the banner, writes the banner again on
                   its own so update polling keeps working. `--dev` swaps one
                   module and writes a second userscript that measures itself.
package.json       Version and scripts: the gate, the preview, the site, the cost.
bun.lock           What the gate is actually run against — §6.1.
tsconfig.json      Strict flags standing in for a linter, and the `@/*` alias.
tsconfig.userscript.json
                   The same, narrowed to what a browser has to have: `src/` and
                   `libs/` at the floor `docs/browser-support.md` states. Nothing
                   downlevels, so this is the floor — §9.9.
.gitignore         What never enters git, including the cache.
.github/workflows/ The gate on push; a `v*` tag into a release with the built
                   userscript attached, refused unless the tag sits on `main`;
                   the preview site published from `main`, which is the release.
.claude/settings.json
                   Denies the tool calls that would write to the maintainer's
                   list — the three that edit a file, never the shell (§5).
.claude/skills/verify/
                   How to drive the add-on in a browser and read what the panel
                   drew. Not a gate.
.cache/            Game client sources, fetched on demand. NOT tracked — §7.6.
screenshots/       The panel as pictures — §9.8.

docs/              A guarded register, a dated spec, a design a spec names, or a
                   dated and guarded audit. No status, no chronicle of rounds.
  browser-support.md
                   What the shipped file asks of a browser — §9.9.
  captured-fights.md
                   What each recording holds — who fought, at what levels, in
                   what professions, against whom, and how it ended — and how
                   much protocol the file carries. Re-earned from the material
                   both ways by tests/tools/captured-fight-register.test.ts.
  protocol-keys.md What has been looked into, key by key: verdict, evidence,
                   state. Guarded against the decoder and the frozen table.
  half-named-figures.md
                   Every shape the protocol can send where it names one end and
                   not the other, and what the panel draws for it. Read off the
                   panel and guarded by tests/ui/panel-view.test.ts.
  drill-levels.md  Every kind of row below the ranking and whether pressing it
                   opens anything. Verdicts, never counts — the counts are what
                   tools/drill-report.ts prints. Guarded both ways by
                   tests/tools/drill-report.test.ts.
  specs/           Dated design records. No index — the directory is one.
  audits/          This repository measured against its own rules — §7.7.
  design/panel.html
                   The panel as a page you can click. A drawing, not a source.

libs/              The bottom layer: true in any project — §9.1.
  assert.ts        Assertions and their failure type. Outside both hierarchies.
  number.ts        Every number read or written. Reading returns null, writing
                   asserts. Whole, fractional, and either-of-the-two.
  json.ts          JSON both ways: the value or the SyntaxError, never a bare
                   null; writing refuses a value with no JSON.
  timestamp.ts     Date.parse without the NaN.
  text-order.ts    Two pieces of text in order, by code unit, deterministic.
  record.ts        Narrowing to something with keys. Two readers: one admits an
                   array, one refuses it.
  running-total.ts A total a map carries, both ways: adding to one, and what one
                   comes to. Four readers, one and two levels deep.
  source-regions.ts
                   Where comments, text literals and patterns sit in a source
                   file. Patterns, not a parser.
  elapsed-spans.ts How long named pieces of work took. A count, a total and the
                   worst one per name — never a list of samples. Owns the clock.

src/
  userscript-version.ts  The version, substituted at build time. Any layer — §9.1.
  cost-phases.ts         What a measured phase is called, and what the table of
                         them heads its columns. Three readers, one spelling; a
                         whole and its parts never added together.
  userscript-instrument.ts
                         The seam a cost measurement goes through, and what it
                         costs when nobody is measuring: nothing. Swapped by
                         `build.ts --dev`, never branched at run time.
  userscript-instrument-development.ts
                         The same seam with a clock behind it. Nothing imports it
                         by name — the build resolves the one above to here.
  userscript-entry.ts    Reads the game off the page, decides every name we put
                         on it, holds the session, mounts the panel, and reaches
                         storage — for the panel's position and nothing else.
  core/                  Pure logic: no DOM, no timers, no engine — §9.1.
    margometer-error.ts  Base for everything the add-on throws — §9.5.
    game-build.ts        What a build id looks like, and where the client states
                         one. One reading for the add-on and the tools.
    protocol-message.ts  Grammar of one message. Structure only, reversible.
    battle-event.ts      What the decoder produces. The data contract — §4.
    combatant-roster.ts  Who is in the fight, and on which side. An ambiguous
                         name resolves to nobody, never to the first match.
    fight-decoder.ts     Messages → events. Drops nothing, invents nothing.
    combatant-health.ts  What a fight was entered with, what is held now, and what
                         a share stated about a whole side restores to each of it.
                         Every input refused rather than defaulted — §9.6.
    fight-statistics.ts  Events → the numbers a panel draws. Raw and applied kept
                         apart, units never totalled across, what could not be
                         read or attributed carried rather than dropped.
  game/                  All contact with the game client — §9.1.
    engine-battle-wrap.ts
                         The only code that changes a running game. Original
                         first, its value untouched, one layer, and a detach that
                         removes only ours.
    engine-warrior.ts    The client's own names for a combatant's fields. The
                         five two readers had to agree on, and no more.
    engine-roster.ts     Who is fighting, and which side is the player's — the
                         one thing core cannot know.
    engine-attachment.ts Finds the battle object, wraps it once, stops looking.
                         Stands down where another MargoMeter already has it.
    game-dictionary.ts   The client's own name for a thing, asked of the page. A
                         sentence with a hole in it is refused.
    battle-session.ts    One fight accumulated payload by payload. Pure.
    fight-capture.ts     The same fight, kept so it can be written to a file.
                         Redacts nothing — that is the intake tool's job.
  ui/                    Renders state handed to it — §9.1.
    panel-words.ts       Everything the panel puts in front of a reader: what it
                         calls each name of the game's own, what it says where the
                         game names nobody, and a number as it writes it.
    panel-screen.ts      Which screen the panel is on: what a screen can show and
                         the strips that switch, the key a drawn row carries, the
                         shape handed to the drawing, and what a click does to it.
    panel-look.ts        Every colour, space and radius, §9.7's arithmetic, and
                         the stylesheet spending them — as one string.
    panel-reading.ts     What the panel is handed, and the three questions asked
                         of a combatant.
    panel-drill.ts       What a row opens onto: the two levels below the ranking,
                         and the card either shows on hover — the same card at
                         every level, saying whose figures they are.
    panel-view.ts        One screen as data: ranking, pinned figure, denominator,
                         summary, warnings. No DOM.
    panel-element.ts     The same, drawn, and where it is drawn. One shadow root,
                         delegated events, region by region so one failure is its
                         own size — over a first section that touches no document
                         at all: where the panel sits and where a detail opens.
    cost-overlay.ts      What the add-on cost, drawn beside the panel and never
                         inside it. Development builds only.

tools/                   Never ships. §6.2 says what each answers.
  margometer-tool-error.ts   Base for everything the tooling throws — §9.5.
  fight-dump-parser.ts       Where the captures' Polish field names stop — §9.2.
  game-client-source.ts      The client bundle into the cache, with provenance.
  protocol-key-table.ts      The client's key list, lifted out of that bundle.
  decoding-status.ts         How much of the protocol we read.
  fight-report.ts            What a captured fight adds up to, per combatant.
  drill-report.ts            What is under each row, and which rows open nothing.
  payload-cost.ts            What a payload costs, replayed off the recordings.
  help-article.ts            The published help, fetched and searched.
  captured-fight-intake.ts   The gate a recording passes to become material.
  mutation-sweep.ts          §3's question asked of the tests already here.
  preview-page.ts            The harness page as one string, with its holes.
  preview-server.ts          That page in a browser, changing while you edit it.
  preview-site.ts            The same page written down, in Polish, for Pages.
  panel-screenshots.ts       The panel photographed, four screens, one release.
  changelog.ts               One version's section, plus which file to click.

tests/                     A test sits where its subject sits: `libs/`, `core/`,
                           `game/`, `ui/`, `tools/`. The entries below stay at
                           the root: material and shared readers.
  captured-fights/         Raw protocol from real fights. Evidence — §9.2.
  captured-fight-catalog.ts   Discovers it: each capture, health per combatant,
                              the rosters per call and per fight, and the fight as
                              the panel composes it — one reading, not ten.
  frozen-protocol-keys.ts     GENERATED. Every key the client knows, with build.
  frozen-help-phrases.ts      GENERATED. How often each cited phrase occurs in
                              the published help. Counts only.
  dated-document.ts           What specs and audits share: a filename that is a
                              date, and a date that has happened.
  git-history.ts              What this history can be asked, and when it cannot
                              be asked at all. Every answer is an exit status.
  class-names.ts              What a stylesheet styles and what a source assigns.
                              Shared by the panel's guard and the preview's.
  protocol-key-register.ts    Reads the register into entries — verdict, health
                              line, evidence, shape, help phrases.
```

---

## 9. Rules

### 9.1 Architecture

- `[ALWAYS] [core]` **Dependencies point one way:** `ui → core`, `game → core`,
  everything → `libs`, entry point → everything. `core` imports nothing but
  itself and `libs`.
- `[ALWAYS] [libs]` **`libs/` is the bottom layer** and knows nothing of the
  game, the protocol or the panel. It imports from `src/`, `tools/`, `tests/`
  never.
- `[ALWAYS] [core]` **`core` is pure** — no `document`, `window`,
  `localStorage`, timers, or knowledge that a game engine exists.
- `[ALWAYS] [game]` **All contact with the game client lives in `game/`.**
- `[ALWAYS] [tools]` **A tool may read `tests/`; a test may read a tool only as
  its subject or as the reader of the material.** Everywhere under `tests/`
  exactly two may be read — `tools/fight-dump-parser.ts`, so the live and offline
  paths cannot disagree about what a capture says, and
  `tools/margometer-tool-error.ts`, where the two hierarchies are proved disjoint
  (§9.5). Under `tests/tools/` a test also reads **the tool it is named for**, and
  any other only as a listed pair carrying its reason — the list is in
  `tests/tools/source-layout.test.ts` and each entry says why that test may not
  spell that tool's names a second time. The clause used to end at "names
  whichever tool it is about", which the guard held by not looking at the
  directory at all
  (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F8).
- `[ALWAYS] [any]` **`src/userscript-version.ts` is readable from any layer.**
- `[ALWAYS] [ui]` **The panel renders state handed to it.** It never computes a
  statistic **across combatants** — no re-aggregating the fight, no deriving one
  row's figure from another's. Folding a row's own maps into the cut a screen
  shows is the panel's work and lives in `src/ui/panel-reading.ts`: what a
  combatant took less what could be charged to somebody, per element. The clause
  read as an absolute while six such folds sat in `src/ui/`, and the qualification
  lived in one docblock rather than here
  (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F10).
- `[ALWAYS] [any]` **A file holds one subject, however long that subject runs.**
  What forces a split is a **second** subject — never a line count, and never a
  docblock that got long. The clause this replaces read *"prefer a narrow module;
  a file needing a table of contents needs splitting"*, and
  `docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md` (F26) applied it to
  `src/ui/panel-view.ts` by reading a table of contents off its **docblock**. The
  eight modules that came out of it each had to open by arguing why they were a
  file, and the cost of that was never counted against the cost it saved: 40+
  named imports at one file's head, a name spelled in nine places, and a `src/ui/`
  that reached 48% comment. A long file is not evidence; two subjects are.

### 9.2 Data

`tests/captured-fights/*.json` is raw protocol captured from real fights —
**evidence, not test data**:

- `[NEVER] [data]` Edit it to make anything pass.
- `[ASK] [data]` Any change at all, including reformatting.
- `[ALWAYS] [data]` **Field names inside these files stay in Polish**
  (`ladunek`, `komunikaty`, `wojownicyPrzed`, …) — renaming is editing the
  evidence. The boundary is the reader that parses them.
- `[ALWAYS] [data]` **Fixtures are discovered by reading the directory**, never
  by a hand-maintained list of names.
- `[ALWAYS] [data]` **An empty capture directory fails its own test.**
- Nicknames are substituted and ability descriptions stripped before material
  enters the repo, by tooling and never by hand.

Computed numbers do not belong in data files — only raw material does.

### 9.3 Code

- **No linter, by choice — the compiler replaces it.** `noUnusedLocals`,
  `noUnusedParameters`, `noUncheckedIndexedAccess`. `[ASK]` before weakening any.
- **Comments say WHY, never WHAT**, and only what earns it: a decision with a
  rejected alternative, a measurement, a constraint the game imposes, a trap
  someone will otherwise fall into twice.
- **Length is not the axis; what it carries is.** A comment may be as long as
  the decision inside it. What may never exist is one that only describes. "It
  is in the commit message" is no answer to a trap — a comment records what is
  true of the code as it stands.
- **Unknown is loud, never zero.** A failed parse returns `null` or an explicit
  unknown; it never substitutes `0` and never copies a neighbour.

**`[ALWAYS] [any]` A name this repository did not choose is spelled once, by the
file that reads it — and where two files must spell it, a guard holds them to one
vocabulary.** A field of the game's, a class our own stylesheet and our own
renderer both name, the brand a console line carries. The failure is never loud:
an unstyled row, a field reading `undefined`, a line that looks like the game's.
The panel still draws and the gate still passes.

**`[ASK] [any]` before collapsing a duplicate spelling in a test.** Some are
deliberate and are the whole of what the test proves: `tests/core/` restates the
protocol keys on purpose, because a test asserting *what the decoder reads* must
not read the decoder's own list. Two of those say so in a comment and the rest do
not, which is why an audit filed them as duplication and closed one
(`docs/specs/2026-08-18-a-name-we-did-not-choose.md`). A deliberate duplication
that does not say it is deliberate is an invitation to collapse it — so say it.

**`[ALWAYS] [any]` Imports are written from the repository root.**

```ts
import { parseFightDump } from "@/tools/fight-dump-parser.ts";   // yes
import { parseFightDump } from "../tools/fight-dump-parser.ts";  // no
import { CAPTURED_FIGHTS } from "./captured-fight-catalog.ts";   // no — even a sibling
```

`@/*` maps to the repository root (`tsconfig.json` → `paths`): a path reads the
same wherever it appears, and moving a file does not rewrite its neighbours'
imports. No depth at which `../../` is acceptable. Guarded by
`tests/tools/source-layout.test.ts`.

### 9.4 Naming

Follows the [naming cheatsheet][cheatsheet] by kettanaito. The binding subset
plus what it leaves open.

[cheatsheet]: https://github.com/kettanaito/naming-cheatsheet

**`[ALWAYS] [any]` A function name starts with the action it performs.**

| Action | Means |
|---|---|
| `get` | Accesses data immediately. `getFruitCount()` |
| `set` | Assigns a variable from one value to another. `setFruits(next)` |
| `reset` | Restores a variable to its initial state. `resetFruits()` |
| `remove` | Takes something **out of** somewhere. `removeFilter(name, filters)` |
| `delete` | Erases something from existence. `deletePost(id)` |
| `compose` | Creates new data **from** existing data. `composePageUrl(name, id)` |
| `handle` | Handles an action; the usual callback name. `handleClick()` |
| `parse` | Text → structure, throwing on anything unexpected. `parseFightDump(source)` |
| `decode` | Structure → **meaning**. `decodeFight(messages)` |
| `require` | A value narrowed to a type, or throws. `requireFiniteNumber(value, path)` |
| `expect` | Fails a test unless something holds. A test's action and nobody else's. |

You `add` to somewhere, so its inverse is `remove`; you `create` with no
destination, so its inverse is `delete`. `parse` and `decode` are not synonyms
and the split keeps the layers apart: `parseProtocolMessage` knows the grammar
and not what a key means, `decodeFight` the reverse. Other verbs are allowed
where they are more precise — `build`, `write`, `render` — but `[NEVER]` a
**synonym** for one in the table: no `fetch` where `get` fits, no `update` where
`set` fits.

**`[ALWAYS] [any]` Names follow A/HC/LC** — `prefix? + action + high context +
low context?`. `getMaximumHealthByCombatantId` = get + MaximumHealth +
ByCombatantId.

**`[ALWAYS] [any]` Boolean names carry a prefix:**

| Prefix | Means |
|---|---|
| `is` | A characteristic or state of the current context. `isBlue` |
| `has` | The context possesses a value or state. `hasProducts` |
| `should` | A positive conditional coupled with an action. `shouldUpdateUrl(url, expected)` |
| `min` / `max` | A boundary. `maxHits` |
| `prev` / `next` | A state transition. `prevPosts`, `nextPosts` |

- **S-I-D — short, intuitive, descriptive**, all three. `id` stays `id`; `hpp`
  becomes `percent`.
- **Reflect the expected result.** `isDisabled`, not `isEnabled` used negated.
- **No contractions.** `button`, not `btn`. Abbreviate only where the game does,
  and say so in a comment.
- **Do not duplicate the context a name already sits in.**
- **Singular is one thing, plural is a collection.**
- **Files are kebab-case and name their contents, not their category.**
  `utils.ts`, `helpers.ts`, `common.ts`, `misc.ts`, `index.ts` `[NEVER]` get
  created here. Guarded by `tests/tools/source-layout.test.ts`.
- **Types name the thing, not its shape.** `CombatantSnapshot`, not `Warrior` or
  `CombatantData`.

### 9.5 Errors

Throwing is right here, but only as a **local** mechanism: an exception of ours
reaching the game breaks the one promise the add-on makes.

**`[ALWAYS]` Every error we throw belongs to a branded hierarchy.** `[NEVER]` a
bare `new Error(...)`, `[NEVER]` `extends Error` outside a base file. The brand
goes in `name`, where the console shows it first.

| Base | Where | Name looks like |
|---|---|---|
| `MargoMeterError` — `src/core/margometer-error.ts` | ships to the browser | `MargoMeter/…` |
| `MargoMeterToolError` — `tools/margometer-tool-error.ts` | runs in a terminal | `MargoMeterTool/…` |

Deliberately disjoint, so a `catch` in the add-on cannot swallow a tool error
believing it caught its own. Both bases are **abstract**: every kind of failure
gets a named subclass and a `code`, so callers never match on message text.

- `[ALWAYS]` **Catch narrowly — exactly the error you expect.** One exception,
  and it is a place: **at the boundary with somebody else's program**, a `catch`
  takes everything. A call into the game, a read of the page — `localStorage`
  throws for being *read* where the browser forbids it — a document the game also
  writes to, and each region §9.6 isolates so its failure is its own size.
  Narrowing there would let a bug of ours escape into the game's call stack, which
  is the one promise this add-on makes. **Away from such a boundary a broad catch
  is a bug**, and most of the `catch` clauses in shipped code are at one. Written
  here because it was written nowhere: the rule above read as an absolute while
  one file's comment claimed to be the whole of the exception, naming "the only
  two in this repository"
  (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, F8). Nothing tells
  the two kinds apart mechanically — a `catch` is not where the boundary is
  visible — so it is read rather than checked, and §7.5's rule is why it is here:
  a qualification that lives in one file's docblock is one nobody else reads.
- `[ALWAYS]` **Pass the original in `cause` when wrapping.**
- **An expected failure in shipped code is DATA**, not an exception that
  propagates: it becomes an unknown event the panel can show. In `tools/`,
  throwing loudly is the correct behaviour.

**Assertions are a different category.** An error class and a `code` exist so a
failure can be recognised and handled; a broken invariant cannot be, so it gets
neither. `libs/assert.ts` sits outside both hierarchies: `AssertionFailure`, no
`code`, its own root.

- `[ALWAYS]` `assert` / `assertDefined` for what must never happen. `[NEVER]`
  for a failure you know can occur — that is an error class.
- `[ALWAYS]` The message names the **invariant**, not the condition.
- `[NEVER] [any]` **`!` in `libs/`, `src/` or `tools/`.** Use `assertDefined` —
  but first ask whether the type can be made precise; an assert over a type that
  could have been exact is covering for a loose type. Tests keep `!`.

**Reading a value: who produced it, and can anyone act on the failure.**

| Where the value came from | Mechanism | Why |
|---|---|---|
| **Inside** — our own regex or invariant guarantees it | `assert` / `assertDefined` | Nobody can handle it; a break means the program is wrong. |
| **Outside, in `tools/`** — a file, a fetched bundle | a branded subclass with a `code`, thrown | A tool refuses bad material loudly. |
| **Outside, in `src/`** — the live protocol | **data**: `null` → unknown event → a visible mark | An exception here reaches the game engine. |
| A default that makes the number look right | **never** | `0` is a measurement. |

Shape inward, magnitude outward: a captured group proves the shape and says
nothing about whether an id is past 2^53. `[NEVER] [any]` **a cast off
`JSON.parse`** — parsed text wearing a type is external data nobody checked.

**One way to read a value, and it lives in `libs/`.** `Number("")` is `0`,
`parseInt("12abc")` is `12`, `Date.parse("nope")` is `NaN` and `NaN > limit` is
`false`, `JSON.parse` throws and hands back `any` — each produces a value nobody
wrote.

**`[ALWAYS] [any]` A construct belongs to a primitive in `libs/` if it has more
than one spelling in JavaScript, or can answer with a value nobody wrote.**

| Owner | Owns | Reading gives |
|---|---|---|
| `libs/number.ts` | `Number()`, `parseInt`, `parseFloat`, `BigInt`, `toFixed`, `.toString(radix)`, `String()` on a number, unary `+`, `typeof … === "number"` | `getIntegerFromText`, `getDecimalFromText`, `getNumberFromText`, `getIntegerFromHexadecimalText`, `getIntegerFromValue`, `getFiniteNumberFromValue`. Writing asserts: `composeIntegerText`, `composeDecimalText`, `composeHexadecimalByteText` |
| `libs/json.ts` | `JSON.parse` and its `try`/`catch`, `JSON.stringify` | `getValueFromJsonText` → the value **or** the `SyntaxError`; `composeJsonText` refuses a value with no JSON |
| `libs/text-order.ts` | nothing — see below | `getTextOrder`, by code unit |
| `libs/timestamp.ts` | `Date.parse` | `getMillisecondsFromIsoText` |
| `libs/elapsed-spans.ts` | `performance.now()` | `getTimedResult`, and the tallies `composeSpanReport` reads back. `Date.now(` stays unowned — one spelling, no surprise |
| `libs/record.ts` | `typeof … === "object"`, which is `true` for `null` | `getRecordFromValue`, `getRecordOrArrayFromValue` — two readers, because a list arriving where an object belongs is a fault in one caller and legitimate in another |
| `libs/running-total.ts` | `map.set(key, (map.get(key) ?? 0) + amount)`, the map reached by a name **or** by a field | `setRunningTotal`, `setPairRunningTotal`, and the reading half `getTotalOfValues`, `getTotalsByInnerKey`. Here for §7.1's reason rather than §9.5's — not a value nobody wrote, but a spelling five copies proved would drift. The reading half is offered and **not** owned: a test that totals a map by hand is checking the subject's arithmetic against its own and must not borrow it (§9.3) |

Look in `libs/` first; if it is not there and meets the criterion, add it there
rather than at the call site, even for one caller. **Reading returns `null` and
throws nothing** — the caller picks assert, error or unknown. **Writing asserts**,
because the number is ours. A new primitive lands with its row here and in §8.

Guarded by `tests/tools/source-layout.test.ts`: no unbranded error, none outside
the base files, each file extending the base of its side, no `!` outside tests,
every construct in the register spelled only by its owner — in tests too — and
no cast off `JSON.parse`.

One construct has **no owner, and that is its register entry**: `localeCompare`
is spelled nowhere. An owner that owns nothing stops guarding, since the rule
proves an owner by finding the construct inside it. Bringing a collated order
back means a caller, a reader in `libs/`, and this becoming a row again — in
that order. One exception, the guard's rather than a licence: **a construct with
no name to search for** — `String(`, unary `+`, `* 1`, the two `typeof`
comparisons — **is held to `libs/`, `src/` and `tools/` only.**

### 9.6 UI

- The panel lives in a Shadow DOM, cut off from the game's stylesheet
  (`all: initial` on the host). We are a guest on someone else's page.
- `[ALWAYS] [any]` **Every name of ours a reader meets before the panel's
  contents carries the prefix `MargoMeter-`.**

  | Rung | Names | Prefixed |
  |---|---|---|
  | In the game's document | the panel's host, the anchor a download rides on | yes |
  | At the top of the shadow tree | the title bar, the body, the tooltip | yes |
  | Inside the panel | `.row`, `.tab`, the state words | **no** |
  | Anywhere | every CSS custom property | yes |

  The third rung is exempt on purpose — those names sit behind the shadow root,
  where the game's CSS cannot reach them. A custom property gets no protection
  from the shadow root at all: `all: initial` does not reset custom properties,
  so one the game declares on `:root` inherits straight through the host.
  Guarded three times, each over what is there rather than over the nodes we
  know about: `tests/game/engine-attachment.test.ts` for everything appended to
  the page, `tests/ui/panel-element.test.ts` for every child of the shadow root,
  `tests/tools/source-layout.test.ts` for every custom property in `src/`.
- Event handling is delegated at the root, never bound per row, so re-rendering
  cannot lose handlers.
- Panel state that survives a reload is validated on read.
- **The panel says what it does not know.** A number the log cannot attribute is
  shown as unattributed, never folded into a **combatant's** total.
- `[ALWAYS] [ui]` **A figure may be charged to a side by the end the game did
  name; a figure may never be charged to a person that way.** The protocol leaves
  a hole at one end or the other — an actor with no target, a target with no
  actor — and the other end places it: damage crosses sides, healing stays on
  one. One inference, in one function (`getPartCharged`), read by the rows and by
  the summary bar so the two cannot disagree. It rests on there being two sides
  and nobody harming their own, which the protocol states nowhere, so it is
  `[ASK]` to widen and it is held by a measurement rather than by a comment: over
  every capture it makes `Zadane · My` equal `Otrzymane · Oni` through different
  fields of the aggregate (`tests/ui/panel-view.test.ts`,
  `docs/specs/2026-08-18-two-ends-and-one-of-them-is-named.md`). Charging a
  *name* is still §5's flat no — a side has members, and a guess about which one
  would be ours.
- `[ALWAYS] [core]` **A figure the protocol states about a whole side may be sized
  onto its members only where the game states the arithmetic and this meter holds
  every input to it.** This is not the guess the clause above forbids: nothing is
  apportioned, and no member's share is inferred from another's. Each member's
  figure is computed from the game's own published formula, and having the formula
  is what makes the answer a reading rather than a share-out. Every input is
  refused rather than defaulted — maximum health, the health the fight was entered
  with, the health held at the moment, the caster having an ally at all, and no
  effect in play the documentation says reduces the result. A member missing one is
  left out **and the figure stays counted as unaccounted**, so a partial answer can
  never read as a whole one. `[ASK]` to widen to a second key, and held by a
  measurement rather than by a comment: the sized figures equal the health the
  snapshots record on every cast that stands alone in its engine call, and
  `tests/core/health-witness.test.ts` stopped skipping those calls and still agrees
  (`src/core/combatant-health.ts`,
  `docs/specs/2026-08-18-the-side-is-named-and-the-share-is-stated.md`).
- `[ALWAYS] [core]` **An end the protocol leaves out may be filled with a
  combatant the message already names, and only where the published help says the
  effect is that combatant's own.** The narrowest of these clauses: nothing is
  derived from a neighbour, from a slot or from what usually
  happens — the help says the effect belongs to the one it heals, so the giving end
  is the receiving end and there was never a second name to get wrong. The keys are
  listed in one place (`SELF_SOURCED_HEALING_KEYS`, `src/core/fight-decoder.ts`),
  each carries its engine name and read date, and each is stated in
  `docs/protocol-keys.md` on a `*Cause:*` line a guard re-earns from that list.
  Three limits, all of them load-bearing: **an announcement wins**, because a giver
  the protocol stated beats one read off documentation; **the restoring direction
  only**, since `heal` states a loss as readily as a gain and nothing documents a
  self-damage reading; and **a message naming nobody is untouched**, because the
  fill needs a name the message already carries. ⚠️ Held by a **citation** where
  the two clauses above are held by a measurement — the protocol states the figure
  already, so there is no arithmetic to close and nothing in the captures would
  differ if the help were wrong about whose effect it is. That is why it is `[ASK]`
  to add a fourth key, and why the damage keys arriving in the identical shape
  (`poison`, `fire`, `light`) are deliberately left with no cause at all
  (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`).
- `[ALWAYS] [core]` **An end the protocol leaves out may be filled from an earlier
  message of the same fight, where the published help states the link and the
  figure says which one.** The fourth and widest of these clauses, and the only one
  reaching past the message it reads. One pair exercises it
  (`WOUND_ANNOUNCEMENT_BY_TICK_KEY`, `src/core/fight-decoder.ts`): a wound ticks
  naming its victim and nobody else, and the blow that applied it named both ends.
  What makes it a reading rather than a search is the help's own arithmetic — the
  wound does not accumulate and is overwritten by the freshest application against
  that opponent, so a victim carries one at a time and the figure says which one is
  ticking. Held by a **measurement**: over every capture, each tick lands on a
  victim already wounded and states exactly what that wound announced, on material
  where three attackers wound one victim
  (`tests/core/injure-rule.test.ts`). Four limits, all load-bearing: **the freshest
  application only**, which is the help's rule and not a habit; **the figure must
  agree**, so a tick that cannot be identified is charged to nobody; **an
  application nobody is named for still replaces the one before it**, because the
  game overwrites it whoever landed it; and **no cap on ticks**, since the help
  counts turns and nothing here does (§10). The reading lives in
  `src/core/fight-statistics.ts` and cannot live in the decoder — that one decodes
  incrementally, so a carry inside it would reach only the ticks sharing an engine
  call with their application and would answer differently depending on how the
  game split its payloads. `[ASK]` before a second pair joins it, and the asking is
  about three things a key either has or has not: an announcement in the protocol,
  a figure on that announcement, and a documented rule making one application the
  owner of what is ticking. Every tick the client composes has been put to that
  test and only this one has all three — `poison`, `fire` and `light` are what the
  captures still leave half-named, and none of them has an announcing key at all
  (`docs/specs/2026-08-19-what-lets-a-tick-name-its-source.md`). `critwound`
  arrives in the same shape, announces no figure, and is deliberately unread
  (`docs/specs/2026-08-19-a-wound-remembers-who-dealt-it.md`).
- `[ALWAYS] [ui]` **A message naming neither end has no side, and the panel says
  so where no row can.** It rides the one pinned row standing apart from the
  ranking under `Wszyscy`, and under a side tab it is on no row at all and the
  summary bar names it. Zero in every recording, which is exactly why it is
  written down rather than left to be noticed.

**Failure in the UI.** Two obligations bind at once: the user must be able to
tell something is wrong, and nothing we do may stand between them and the game.
The rule that resolves every case — **a number that might be wrong must never
look like a number that is right.**

- `[NEVER] [ui]` **Interrupt.** No `alert`, `confirm`, `prompt`, modal, overlay,
  stolen focus or sound.
- `[NEVER] [ui]` **Vanish.** A failure never blanks the panel; only the part
  that failed is replaced, in place, by a short marker.
- `[ALWAYS] [ui]` **Render section by section, each isolated** — a structural
  requirement on the renderer, not a habit.
- `[ALWAYS] [ui]` **Put the warning where the consequence is**, next to the
  figure it concerns and not in a global banner.
- `[ALWAYS] [ui]` **Quiet by default, detail on demand.** Nothing animates,
  flashes or moves.
- `[NEVER] [ui]` **Swallow silently.** Every caught failure produces a visible
  mark and exactly one branded console entry — once, not per render.
- `[ALWAYS] [ui]` **Treat a failure as state, not a verdict.** Warnings are
  scoped to the fight that produced them and clear when a later one decodes
  cleanly.
- `[NEVER] [ui]` **Let an exception escape into the page.**
- `[ALWAYS] [ui]` **Keep "unknown" and "zero" apart on screen**, not only in the
  data. Zero happened and measured nothing; unknown could not be read.

Two severities are enough, and a third is `[ASK]`:

| Severity | Means | Shown as |
|---|---|---|
| **Suspect** | The numbers drew, but something was unreadable, so a total may be too low | A mark next to the affected figure; detail on demand |
| **Undrawn** | A section could not be rendered at all | That section replaced in place; everything else unaffected |

### 9.7 Design System

- **Tokens, not literals.** A raw hex in a rule is a bug.
- **Dark-first.** The panel sits over a dark game client.
- **Text on a coloured bar must clear WCAG AA contrast**, checked by a test
  rather than by eye.
- **Colour never carries meaning alone** — it accompanies a label or a number.

---

### 9.8 Screenshots

`screenshots/` holds the panel as pictures, for the version in `package.json` and
no other. Written by `tools/panel-screenshots.ts` and by nothing else — a set is
replaced, never added to
(`docs/specs/2026-08-18-a-picture-of-the-panel.md`).

Most of it is held by machines: `tests/tools/panel-screenshots.test.ts` puts the
sidecar's version against `package.json`, its **commit** against this history and
the directory against the sidecar, so a release cannot ship a set from the release
before it and a set cannot name a tree nobody can check out; the tool refuses to
shoot while `src/` or `libs/` carries uncommitted changes, so the commit it
records is one that draws the panel in the frame.
`tests/tools/tracked-text.test.ts` exempts the images by name so the sidecar
beside them stays text anyone can read.

Two things no machine here checks, and both were got wrong:

- `[ALWAYS] [any]` **Open every picture before it is committed.** The guards prove
  the set is current, complete and named — never that a panel is in the frame. A
  driver that clicked nothing produced four green shots of the same screen, and
  the only symptom was three files of identical size.
- `[ALWAYS] [any]` **Retake the set when the panel changes, not only when the
  version does.** A version says which release a set belongs to and moves once per
  release; the panel moves between them. A set taken eleven commits past `v0.7.0`
  showed a pinned row named `Bez sprawcy`, a figure the wound rule had since moved
  and a warning the sizing had since stopped — all four pictures, in `README.md`,
  with every guard green because `package.json` still read `0.7.0`
  (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F1). The
  sidecar's commit is what makes that readable rather than invisible; it is
  deliberately **not** guarded as currency, because a gate demanding a browser run
  from every round that touches `src/ui/` is a decision about how this repository
  is worked in, and `[ASK]` rather than a detail.
- `[NEVER] [any]` **Photograph a state the panel cannot be in.** The frame is a
  crop of a screen, not a screen: the 66vh cap is lifted for the picture because
  at 1080p it does not bind on any of these, and that is the whole licence. A
  screen assembled for the photograph is not a screenshot.

### 9.9 Browsers

`docs/browser-support.md` says what the shipped file asks of a browser and which
browsers answer. It exists because nothing else could notice: `build.ts` bundles
with `minify: false` and no `target`, so the ES level of the source **is** the ES
level a player's browser must have, and a round that reaches one construct
further moves the floor under everybody while every test stays green.

Three halves, held by three different things, and only one of them closes by
enumeration:

| Half | Held by | Complete |
|---|---|---|
| JavaScript | `tsconfig.userscript.json` — `src/` and `libs/` at the stated `lib` | yes, by the compiler |
| CSS | `tests/tools/browser-support.test.ts`, over `composePanelStyleText()` | yes — the stylesheet is one string |
| The DOM | the same guard, weakly: every entry is still spelled | **no**, and the register says so |

- `[ALWAYS] [ui]` **The panel is handed its document; it never reaches for one.**
  `src/ui/` declares the slice of the DOM it uses and takes it as an argument,
  which is what keeps that surface readable at all — a register of what the
  add-on asks of a browser is only true while the asking is declared rather than
  reached for. Guarded by `tests/tools/source-layout.test.ts`.
- `[ALWAYS] [ui]` **A feature above the floor degrades, and what it looks like
  below is part of its entry.** That is the whole content of a cosmetic floor;
  without it the register says a version and not a consequence.
- `[ASK] [ui]` **Before adding a construct that raises the floor.** Not
  forbidden — the floor is allowed to move — but it moves for every player at
  once, and that is a decision rather than a detail.

⚠️ **A degradation that leaves colour carrying a meaning alone is not cosmetic**,
whatever tier it sits in — §9.7 decides that one, and the register argues the
case rather than asserting it.

## 10. Glossary

| Term | Meaning |
|---|---|
| **fight** | One battle, start to finish. The unit everything is scoped to. |
| **turn** | One action by one combatant. ⚠️ Nothing here counts them: totals only, no rate, no divisor. |
| **roster** | The combatants on both sides, with side, level and profession. |
| **side** | Which team a combatant is on, as the game states it — a bare number. Which is the player's own is not in the protocol, so `core` groups sides and never favours one. |
| **protocol** | The raw payload the engine receives; our only data source. |
| **message** | One semicolon-delimited record inside the payload. |
| **key** | A named field inside a message — decides what the message means. |
| **hit** | A single damage number. One attack can carry several. |
| **raw / applied** | Damage before and after reduction. Their difference is **not** what a defence stopped — see `prevented`. |
| **prevented** | Damage the protocol says a defence stopped: absorption, magic absorption, a block. One component of the reduction, never the whole — armour and resistance reduce as well and are not reported. Taken over damage whose **raw** side the protocol states. |
| **destroyed** | A statistic of the target an attack reduced — armour and absorption in points, resistance in percentage points. Not damage, never totalled with it, and its members are not in one unit either. |
| **proc** | An effect that fired alongside an attack. Carries no figure. |
| **declaration** | A figure the protocol states that **no total here counts**: an input, an outcome in a unit this meter does not keep, or an outcome outside the fight. Read, never totalled. The test: *whatever this figure did, is it reported elsewhere, or in a unit no total keeps, or outside the fight?* |
| **skill** | A named ability a combatant used. Its announcement carries no key of the damage family, but damage aimed at a name and healing ride the announcement itself. |
| **element** | Damage type (fire, cold, physical, …), taken from the key. |
| **dot** | Damage over time, ticking outside a direct attack. |
| **unattributed** | A number the log does not tie to any actor. Shown, never guessed. §9.6 says when it may still be charged to a **side**. |
| **half-named** | A message stating one end of what happened and calling the other nobody. Two shapes, two rows, and they are different claims: *nieznany sprawca* is a figure whose actor the game left out, *nieznany cel* one whose target it did. A message naming neither end is neither of them and has no side. A **self-sourced** message is written this way and is not half-named — the missing end is one the documentation supplies — and an **earlier-named** one is not half-named either, because a message before it named the end this one leaves out. |
| **self-sourced** | A figure stated at one end where the help says the effect is that combatant's **own**, so both ends are the same person. Not half-named: there was never a second name. §9.6 lists the keys and why `poison`, `fire` and `light` are not among them. |
| **earlier-named** | A figure stating one end where an **earlier message of the same fight** named the other. Two people, both stated, one message apart — so neither half-named nor self-sourced. §9.6 carries the rule and its four limits. |
| **unaccounted** | Health the protocol says moved in an amount nobody can size — a figure whose inputs this meter does not hold. A figure we do not have, where **unattributed** is one we have and cannot place. What is left in it is the fight nobody watched the start of. |
