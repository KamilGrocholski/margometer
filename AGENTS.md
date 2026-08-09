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
  game's own documentation, its client asset, or a measurement on the captured fights.
  This includes negative claims ("the log doesn't say who applied the poison").
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

---

## 8. Structure

Reflects the tree as it is. **Update it in the same commit that changes the
tree** — a structure section that lists directories which do not exist is how
this document starts lying.

```
AGENTS.md          These rules. The only place they live.
CLAUDE.md          One line importing AGENTS.md.
README.md          For humans: what this is, how to build it, terms of service.

build.ts                 Bundles src/ into dist/ and prepends the userscript
                         banner. Also exports userscriptBanner() — the test is
                         its second consumer.
package.json             Version, scripts. `bun run check` is the gate.
tsconfig.json            Strict flags standing in for a linter, and the `@/*`
                         import alias — §9.3.
.github/workflows/       check.yml: the gate, nothing else yet.

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
  battle-event.test.ts
  captured-fight-catalog.test.ts
  protocol-message.test.ts
  source-layout.test.ts    Guards §9.3 imports-from-root plus §9.4 file and
                           function naming. Discovers files, never lists them.
  userscript-metadata.test.ts
```

The decoder, the aggregator, the game layer and the panel are yet to be written.

---

## 9. Rules

### 9.1 Architecture

- `[ALWAYS] [core]` **Dependencies point one way:** `ui → core`, `game → core`,
  entry point → everything. `core` imports from nothing but itself.
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

### 9.5 UI

- The panel lives in a Shadow DOM and is cut off from the game's stylesheet
  (`all: initial` on the host). We are a guest on someone else's page.
- Event handling is delegated at the root, not bound per row, so re-rendering
  never loses handlers.
- Panel state that survives a reload is validated on read — never trusted raw
  from storage.
- **The panel says what it does not know.** Numbers the log cannot attribute to
  anyone are shown as unattributed, not silently folded into someone's total.

### 9.6 Design System

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
