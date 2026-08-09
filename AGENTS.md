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
| `[process]` | Commits, validation, workflow | — |

⚠️ `[game]` and `[ui]` have no files yet; those paths appear as the code that
needs them is written (see §7.1). **This table is the map — keep it true.** A
scope whose path no longer exists, or a directory missing from this table, is
the first sign the rules have drifted from the tree.

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
- `[ALWAYS] [core]` **Make unknown input loud.** A protocol key the decoder does
  not recognise becomes an explicit "unknown" event and surfaces in the panel.
  Silence is the failure mode that costs the most here: a number that is quietly
  too low looks exactly like a number that is right.
- `[ALWAYS] [any]` **Write English** — code, comments, test names,
  documentation, commit messages. The one exception is §9.2.
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

```bash
bun test           # tests only, while iterating
bun run typecheck  # types only
bun run build      # produces dist/margometer.user.js
```

### 6.2 Tooling

Tools are added when a question needs answering, not in advance (§7.1). Each one
that exists is listed here with what it answers.

| Tool | Answers |
|---|---|
| `tools/fight-dump-parser.ts` | *What is inside a captured fight?* Parses dump files field by field and refuses anything unexpected. Library, not a CLI. |
| `tools/game-client-source.ts` | *What is the game serving, and give me its source.* `status` compares served build against the cache; `fetch [channel]` downloads into `.cache/` with provenance. §7.6. |
| `tools/protocol-key-table.ts` | *Which protocol keys does the client know?* Lifts them from the cached production bundle; `freeze` writes `tests/frozen-protocol-keys.ts`. |
| `tools/decoding-status.ts` | *How much of the protocol do we read?* Messages, events by kind, unread keys by frequency. Computed on demand — these figures never go into prose (§5). |

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
  battle messages.
- `[ALWAYS] [process]` **A mutation that lights nothing is a finding.** Either
  the test is missing or the code is inert. Twice here it was the second, and
  both times the answer was to delete something rather than to add a test.

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

---

## 8. Structure

Reflects the tree as it is. **Update it in the same commit that changes the
tree** — a structure section that lists directories which do not exist is how
this document starts lying.

```
AGENTS.md          These rules. The only place they live.
CLAUDE.md          One line importing AGENTS.md.
README.md          For humans: what this is, how to build it, terms of service.
LICENSE            MIT — covers what was written here, and nothing else.
NOTICE.md          What of the game's is in this repository, and on what basis.

build.ts                 Bundles src/ into dist/ and prepends the userscript
                         banner. Also exports userscriptBanner() — the test is
                         its second consumer.
package.json             Version, scripts. `bun run check` is the gate.
tsconfig.json            Strict flags standing in for a linter, and the `@/*`
                         import alias — §9.3.
.github/workflows/       check.yml: the gate, nothing else yet.

.cache/                  Game client sources, fetched on demand. NOT tracked and
                         never published — §7.6. Absent until first fetched.

docs/
  protocol-keys.md       What has been looked into, key by key: verdict,
                         evidence, state. Guarded both ways against the decoder
                         and the frozen table.
  specs/                 Dated design records. No index — the directory is one.

  ⚠️ docs/ may hold a GUARDED register or a DATED spec, and nothing else. No
  status, no progress, no chronicle of rounds. That sentence is the only thing
  standing between this directory and what the previous one became.

libs/
  assert.ts              Assertions and their failure type. Depends on nothing;
                         outside both error hierarchies — §9.5.
  number.ts              Every number read or written. Reading returns null and
                         throws nothing, so the caller picks assert, error or
                         unknown; writing asserts, because the number is ours.
  json.ts                JSON.parse with its try/catch in one place, and its
                         `any` replaced by `unknown`. Returns the value or the
                         SyntaxError, never a bare null — §9.5.
  timestamp.ts           Date.parse without the NaN, and without the shapes it
                         accepts by surprise.

src/
  userscript-entry.ts    Bundle entry point. Empty so far.
  core/
    protocol-message.ts  Grammar of one message: two sides, then key/value
                         segments. Structure only, strict, reversible.
    battle-event.ts      What the decoder produces. Grows one variant at a time.
    fight-decoder.ts     Messages → events. Drops nothing, invents nothing.

tools/
  fight-dump-parser.ts   Parses captured fight material. The boundary where the
                         files' Polish field names stop — §9.2.

tests/
  captured-fights/       Raw battle protocol captured from real fights.
                         Evidence — §9.2.
  captured-fight-catalog.ts
                         Discovers that directory; exposes each capture plus
                         maximum health per combatant.
  frozen-protocol-keys.ts
                         GENERATED by tools/protocol-key-table.ts. Every key the
                         client knows, with the build it was read from.
  protocol-key-register.ts
                         Reads docs/protocol-keys.md into entries. The register's
                         own guard and the health witness both start here; a
                         misspelled health verdict is refused rather than read as
                         silence.
  health-witness.test.ts   Decoded damage against the health the protocol
                           states — two sources nothing here reconciles. Both
                           sides of every message, whole calls skipped where a
                           health figure cannot be added, and each health verdict
                           in the register re-earned on every run.
  source-layout.test.ts    Guards §9.3 imports-from-root plus §9.4 file and
                           function naming, §9.5 errors, assumptions and the
                           register of value readers, §9.6 no blocking dialogs,
                           §7.6 nothing fetched enters git. Discovers files,
                           never lists them.
  assert.test.ts  battle-event.test.ts  captured-fight-catalog.test.ts
  decoding-status.test.ts  fight-decoder.test.ts  json.test.ts
  margometer-error.test.ts
  number.test.ts  protocol-key-register.test.ts  protocol-key-table.test.ts
  protocol-message.test.ts  spec-status.test.ts  timestamp.test.ts
  userscript-metadata.test.ts
```

The decoder, the aggregator, the game layer and the panel are yet to be written.

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

Imports are guarded by `tests/source-layout.test.ts`, which discovers the files
rather than listing them.

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
makes every editor tab read the same. Guarded by `tests/source-layout.test.ts`.

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
| `libs/number.ts` | `Number()`, `parseInt`, `parseFloat`, `BigInt`, `toFixed`, `String()` on a number, unary `+`, `typeof … === "number"` | `getIntegerFromText`, `getDecimalFromText`, `getIntegerFromValue`, `getFiniteNumberFromValue` → `number \| null` |
| `libs/json.ts` | `JSON.parse` and its `try`/`catch` | `getValueFromJsonText` → a reading carrying the value **or** the `SyntaxError`, so the caller still has something to put in `cause` |
| `libs/timestamp.ts` | `Date.parse` | `getMillisecondsFromIsoText` → `number \| null` |

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

Guarded by `tests/source-layout.test.ts`: no unbranded error, no error class
outside the base files, each file extends the base belonging to its side, no
non-null assertions outside tests, **every construct in the register spelled only
by its owner — in tests too**, each owner still spelling what it owns, and no
cast off `JSON.parse`. The guards read source with its comments stripped — a
rule has to be explainable in the file it binds.

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

Landing with the first UI file, not before: a test that a section which throws
leaves its neighbours rendered; a test that no code path calls `alert`,
`confirm` or `prompt`; a test that a handler which throws does not propagate out
of the shadow root; and a test that unread-key counts from the decoder reach the
panel instead of stopping at the aggregate.

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
| **turn** | One action by one combatant. Not a round of the whole roster. |
| **roster** | The combatants on both sides, with side, level and profession. |
| **side** | Which team a combatant is on, from the local player's perspective. |
| **protocol** | The raw payload the engine receives; our only data source. |
| **message** | One semicolon-delimited record inside the protocol payload. |
| **key** | A named field inside a message — decides what the message means. |
| **hit** | A single damage number. One attack can carry several. |
| **raw / applied** | Damage before and after reduction. Their difference is absorbed. |
| **proc** | An effect that fired alongside an attack. |
| **element** | Damage type (fire, cold, physical, …), taken from the key. |
| **dot** | Damage over time, ticking outside a direct attack. |
| **unattributed** | A number the log does not tie to any actor. Shown, never guessed. |
