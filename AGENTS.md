# AI agent instructions

These instructions apply to every directory unless a closer `AGENTS.md` overrides a rule for its
subtree.

## Authority and required context

Apply instructions in this order:

1. the closest `AGENTS.md` to the file being changed;
2. parent `AGENTS.md` files up to this root;
3. the canonical documents below;
4. skills in `.agents/skills/`;
5. `deno lint`, the tests, and CI as mechanical enforcement.

A local instruction may strengthen or replace a root rule **only when it states the exception
explicitly**, and it **never restates one**. A nested file repeating a parent rule has a duplicate
that will drift, and a reader cannot tell which copy is current. The same holds between the
canonical documents: **every rule has one owning document**, and the others point at it. A rule
restated in different words is worse than one restated verbatim, because the two drift without ever
looking different. Before deleting a restatement, **read the owner and confirm it says the thing** —
a dedup that removes the only copy is the expensive way to find out it was not a copy. A docblock is
not such a place: a rule narrowed where only its one caller will read it leaves everybody else
reading the absolute.

Read the documents relevant to the change:

- [`PRODUCT.md`](PRODUCT.md) — what this is for, feature tiers, non-goals.
- [`CONTEXT.md`](CONTEXT.md) — canonical domain terms. Read before naming anything.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — data flow, ownership, protected contracts, known gaps.
- [`SECURITY.md`](SECURITY.md) — mandatory for the game client, the network, stored data, and
  captured material.
- [`DESIGN.md`](DESIGN.md) — the panel's visual system.
- [`docs/adr/README.md`](docs/adr/README.md) — accepted decisions and their lifecycle.
- [`docs/releasing.md`](docs/releasing.md) — the steps a release runs, each citing what owns it.
- [`docs/protocol-keys.md`](docs/protocol-keys.md) — what each protocol key means, and how we know.
- [`docs/drill-levels.md`](docs/drill-levels.md) — which rows of the panel open, and which do not.
- [`docs/turns-taken.md`](docs/turns-taken.md) — what a turn count comes to, and what it does not
  claim.
- [`docs/reading-a-turn.md`](docs/reading-a-turn.md) — how a message becomes a turn, and which
  message a disagreement stands on.

**Target is not proof.** `PRODUCT.md` and the target sections of `ARCHITECTURE.md` are design
constraints, not evidence that a feature exists. Do not describe target behaviour as implemented
until code and verification agree.

**Every rule here is meant to be held by a machine.** The register at the end says which guard holds
which rule and which guards do not exist yet. A rule with no guard is held by reading alone, and
`ARCHITECTURE.md` lists it under known gaps until a guard arrives.

**A rule names the observation that breaks it.** A rule nobody can be shown to have violated is a
wish, and wishes accumulate. Where the observation cannot be named, the honest form is a measurement
or an `[ASK]`, not a firmer verb.

**A rule states what binds; its evidence lives in its ADR.** A rule that carries its own argument
has a duplicate, and the two drift. Where a rule ends in an ADR number, that is where the
measurement, the rejected alternatives and the cost are.

## Safety

The shapes every function here keeps, whatever it is doing. **S3, S8 and S9 stand where a hazard
this language does not have would be**; each states what binds instead.

- **S1.** Only simple, explicit control flow. No recursion, direct or indirect.
- **S2.** Every loop has a fixed upper bound; exceeding it fails an assertion rather than
  continuing.
- **S3.** The cost of one payload is **measured** over the recordings, never assumed, and a change
  to the decode path that raises it is a finding.
- **S4.** No function is longer than 70 lines, which is one printed page.
- **S5.** Assertion density averages at least two per **function that takes something**, across
  `libs/`, `project/`, `src/core/`, `src/game/` and `tools/` — the code that may throw. A function
  handed nothing has no precondition a caller could break, and counting it made the figure a number
  padded by assertions over literals the function wrote itself. What a reader touches is held by
  **A11** instead, and measures nothing here. **ADR 0007**, narrowed twice by **ADR 0051**. See
  **Assertions**.
- **S6.** Declare at the smallest possible scope, `const` by default, at the point of use.
- **S7.** Every return value is used or explicitly discarded; every parameter is checked. Held by
  the compiler.
- **S8.** No code is generated at build time beyond the version constant and the instrumentation
  module swap.
- **S9.** Never alias a mutable structure. A caller that must not mutate receives a reading, not the
  map.
- **S10.** Zero warnings, from the first day. A warning fails the gate.
- **S11.** Every collection that grows with input carries a **stated maximum** and an assertion at
  it — a retained list, a rendered row count, the messages one payload may carry. A new unbounded
  collection is `[ASK]`.
- **S12.** Split compound conditions into nested branches rather than `&&` chains, and state
  invariants positively: `if (index < count)`, not `if (index >= count)`.
- **S13. What the bundle carries is synchronous.** No `async`, `await`, `Promise` or `.then` in
  `src/`, or in the `libs/` modules it reaches. **E5**'s inbound boundary is the wrapped engine
  call, taken from the game's own stack: a promise there answers the game before the fight is read,
  and the `try` around a synchronous call catches no rejection arriving after it. **ADR 0043.**

## Assertions

- **A1.** Assert arguments, return values, preconditions, postconditions and invariants.
  _(`by-reading` whether an assertion covers the invariant that matters)_
- **A2.** Assert the positive space you expect **and** the negative space you do not. _(`by-reading`
  whether the negative space was the one worth asserting)_
- **A3.** Split compound assertions: `assert(a); assert(b);`, never `assert(a && b)`.
- **A4.** The message names the **invariant**, not the condition. _(`by-reading` whether a message
  names the invariant or the condition)_
- **A5.** Assertions are live in the shipped build. They are not removed for production.
- **A6.** Use `@std/assert`. There is no assertion module of our own: its only job would be to brand
  the failure, and **A7**'s boundary is what writes the branded line.
- **A7. A failed assertion becomes state at the nearest boundary** (**E5**, **E11**). A programmer
  error degrades to a missing section; it never reaches the game's call stack.
- **A8.** An assertion is not an error class, and `AssertionError` is in neither branded hierarchy.
  `assert` is for what must never happen; a failure you know can occur is data or a branded error.
  Assertions carry no `code`, because nobody can act on a broken invariant.
- **A9. Where a failure is read, the assertion that reports more is the one used.** In `tools/` and
  `tests/` a failure is read by whoever ran it, so a `@std/assert` function that says what `assert`
  cannot — the value, the diff, the narrowed type — is what stands there; where it discards the
  message naming the invariant, `assert` is. Which does which is measured, and **ADR 0040** carries
  the table. `===` takes the **strict** pair and never the deep one: deep equality turns an identity
  check into an assertion that fires on every copy, or worse, into one that passes where it should
  fail.
- **A10. What the bundle carries takes the plain `assert`** — `src/`, and the `libs/` modules it
  reaches. A broken invariant there becomes a missing section at **E5**'s boundary and the person in
  front of it reads none of the message, so the value in it is bought for nobody while the bundle
  carries a module per name. Where a figure needs the value to be read, it is read where a value can
  be read: in a test. And it imports that name by module path — `@std/assert/assert`, never the
  barrel: the barrel re-exports every module of the package, and the bundler keeps the top-level
  initialisers of the two it cannot prove pure. **ADR 0040.**
- **A11. The layer a reader touches asserts nothing.** `src/ui/`, `src/userscript-entry.ts` and
  `src/userscript-boot.ts` import no assertion and spell none: a broken invariant there is checked,
  degraded in place and recorded as a defect (**E14**). An assertion is for what must never happen,
  and what must never happen in front of a player is the panel stopping — which is what an assertion
  there does. Two releases were spent on one at a stated bound. **ADR 0051.**

## Errors

- **E1.** Two bases, split by **which side of the process throws**, not by layer. The brand goes in
  `name`, where a console shows it first — this add-on shares a console with the game and with other
  add-ons.

  | Base                  | Where                | Name looks like    |
  | --------------------- | -------------------- | ------------------ |
  | `MargoMeterError`     | ships to the browser | `MargoMeter/…`     |
  | `MargoMeterToolError` | runs in a terminal   | `MargoMeterTool/…` |

  Deliberately disjoint, so a `catch` in the add-on cannot swallow a tool's error believing it
  caught its own. Both are **abstract** and take a `code`. Never a bare `new Error`, never
  `extends Error` outside these two files.
- **E2. Every kind of failure has a class of its own, and neither base is ever thrown.** A subclass
  exists because a failure exists, not because a `catch` does — which is what leaves every catch
  something narrower than a base to name. Held by the compiler: the bases are abstract. **ADR
  0009**, superseding **ADR 0004**.
- **E3.** The `code` union exists so a brand is unique, greppable, and cannot be silently reused by
  a new failure. The compiler checks it. **Nothing branches on it at run time**, and nothing should
  — a caller that needs to tell two failures apart is the caller that earns a subclass under **E2**.
- **E4. Catch narrowly — exactly the error you expect.** The one exception is a **kind of place**,
  and the test is mechanical: **a broad catch is legal exactly where its `try` contains a call this
  project did not author.** Anywhere else it is a bug, and most of the `catch` clauses in shipped
  code sit at one of the five below.
- **E5. There are six boundaries in the add-on, and they are enumerable.** A new one is `[ASK]`,
  because an unlisted broad catch is indistinguishable from a swallowed bug.

  | Boundary                       | Direction | A failure there becomes               |
  | ------------------------------ | --------- | ------------------------------------- |
  | the add-on standing up         | inbound   | a copy that stood down, and said so   |
  | the wrapped engine call        | inbound   | a fight that decodes no further       |
  | one render region              | outbound  | that region undrawn, in place         |
  | browser storage                | outbound  | a refusal, which is an answer         |
  | the game's own page state      | outbound  | a reading marked unknown              |
  | a callback somebody else calls | inbound   | that gesture dropped, and marked once |

  Composing the reading a region draws is part of drawing it, so the render region's `try` covers
  both and no sixth row is earned by widening it. In `tools/` the same test applies and the
  boundaries are the network and a subprocess.
- **E6.** Pass the original in `cause` when wrapping.
- **E7.** An expected failure in `src/` is **data** — an explicit unknown the panel can show. In
  `tools/` it throws loudly.
- **E8. `ui/` throws nothing.** A panel failure is state, not an exception. **ADR 0004.**
- **E9.** Reading a value never throws: it returns `null`, and the caller picks assert, error or
  unknown. Writing asserts, because the number is ours.
- **E10.** Never substitute `0` for a failed read. Zero is a measurement. **Where the read could
  have carried the substitute** — `null` out of JSON, `undefined` written as no text at all — E9's
  `null` cannot say which happened, and the answer says whether it worked instead. **ADR 0021.**
- **E11. No failure is discarded silently.** Every caught failure leaves the mark **E5**'s table
  names for its boundary, where a reader can see it. Where a failure also reaches the console it is
  one branded entry, once, never per render, and the entry is the only place that holds a console.
  An empty `catch` breaks this. **ADR 0025.**
- **E12. Every callback handed to an API this project did not author is guarded at the handover** —
  an event listener, a scheduler's step, a promise's continuation. A throw out of one unwinds into a
  dispatch loop that drops it, so the gesture does nothing, no mark reaches anybody, and a clock
  repeats the same failure for as long as the page is open. This is where **A7** puts a broken
  invariant when the nearest boundary is a loop this project does not own. **ADR 0043.**
- **E13. A promise is awaited, or handed a rejection handler in the same statement.** `void` on a
  call that answers one discards a failure, not a value. One exception, and it is stated: the
  top-level `if (import.meta.main)` block, where **E7**'s loud throw is the mark and the exit code
  is what a person and CI read. **ADR 0043.**
- **E14. Nothing the bundle carries may stop the add-on.** `src/ui/`, `src/userscript-entry.ts` and
  `src/userscript-boot.ts` check every value crossing into them before using it, catch every call
  that can throw, and degrade in place — a bound clamps, a lookup falls back, a section stands
  undrawn — so a fight goes on being drawn. Every failure they swallow becomes a **defect** the
  panel states (`CONTEXT.md`), which is the mark **E11** asks of them.

  **`core/`, `game/` and the `libs/` under them go on throwing, and that is not an exception to
  this**: what binds is that no path from outside reaches them without one of **E5**'s boundaries
  between. A failure there costs a region, a reading, a shelf or a file, and never the add-on. The
  test is a path, not a file: **an entry into this program with no boundary on it is a bug**, and
  the six rows above are the whole list of where one may be. **ADR 0051.**

Who throws what. Where a broad catch is legal is **E5**'s table, not this one.

| Layer      | Throws                | Catches by type      |
| ---------- | --------------------- | -------------------- |
| primitives | nothing               | —                    |
| `core/`    | `MargoMeterError`     | its own format error |
| `game/`    | `MargoMeterError`     | its own wrap error   |
| `ui/`      | nothing               | —                    |
| entry      | nothing               | —                    |
| `tools/`   | `MargoMeterToolError` | almost never         |

## Naming

TypeScript idiom, with the naming rules stated here.

- **N1.** `camelCase` for functions and variables, `PascalCase` for types, `SCREAMING_SNAKE_CASE`
  for module constants, kebab-case for filenames.
- **N2.** A function name starts with the action it performs.

  | Action    | Means                                                                   |
  | --------- | ----------------------------------------------------------------------- |
  | `get`     | Accesses data immediately                                               |
  | `set`     | Assigns from one value to another                                       |
  | `read`    | Takes a value from **outside** this program — **N16**                   |
  | `write`   | Puts a value outside this program — **N16**                             |
  | `reset`   | Restores to the initial state                                           |
  | `remove`  | Takes something **out of** somewhere                                    |
  | `delete`  | Erases something from existence                                         |
  | `compose` | Creates new data **from** existing data                                 |
  | `handle`  | Handles an action; the usual callback name                              |
  | `parse`   | Text → structure, throwing on anything unexpected                       |
  | `decode`  | Structure → **meaning**                                                 |
  | `require` | A value narrowed to a type, or throws                                   |
  | `expect`  | Fails a test unless something holds — a test's action and nobody else's |

  You `add` to somewhere, so its inverse is `remove`; you `create` with no destination, so its
  inverse is `delete`. `parse` and `decode` are not synonyms, and the split keeps the layers apart.
  Other verbs are allowed where they are more precise, but never a **synonym** for one in the table.
- **N3.** Units and qualifiers go **last**, sorted by descending significance: `damageRawTotal`,
  `latencyMillisecondsMax` — never `maxLatencyMilliseconds`.
- **N4.** No abbreviations. `button`, not `btn`; `percent`, not `hpp`. Abbreviate only where the
  game does, and say so in a comment. _(`by-reading` whether a shortened word is an abbreviation or
  the game's own spelling)_
- **N5.** Related names get the same length where they can, so they line up: `source` and `target`,
  not `src` and `dest`. _(`by-reading` whether two related names line up)_
- **N6.** A helper called by one function is prefixed with that function's name; a callback goes
  last in the parameter list.
- **N7.** Names follow A/HC/LC — `prefix? + action + high context + low context?`.
- **N8.** Booleans carry a prefix, in the tense that fits: `is`, `was`, `will` for a state, `has`
  for what is held, `does` for what a thing can do, `should` for a condition with an action behind
  it, and `min`/`max`, `previous`/`next` for an edge.
- **N9.** Do not overload a name with context-dependent meanings, and do not duplicate the context a
  name already sits in.
- **N10.** Files are named for their contents, never their category. `utils.ts`, `helpers.ts`,
  `common.ts`, `misc.ts` and `index.ts` are never created here. _(`by-reading` whether a name is
  overloaded)_
- **N11.** Types name the thing, not its shape: `CombatantSnapshot`, not `CombatantData`.
- **N12.** Use the term `CONTEXT.md` gives, and never one it lists under `_Avoid_`.
- **N13.** A name this repository did not choose is spelled **once**, by the file that reads it.
  Where two files must spell it, a guard holds them to one vocabulary — the failure is never loud:
  an unstyled row, a field reading `undefined`, a console line that looks like the game's.
- **N14.** A unit is spelled in full, where **N3** puts it: `afterMilliseconds`, `healthPercent` —
  never `Ms`, `Sec`, `Pct`. **N4** forbids the shortening already; this names the case that keeps
  escaping it, because a unit reads as punctuation rather than as a word. **ADR 0042.**
- **N15.** A boolean names the state that holds and is negated where it is **read**: `!isDrawn`,
  never `isNotDrawn` or `hasNoRows`. A name carrying its own negation reads twice over the moment a
  caller negates it. `unattributed`, `unaccounted`, `undrawn` and `unread` are `CONTEXT.md`'s words
  for claims of their own (**N12**), not negations of ours.
- **N16. A value from outside this program is `read`; a value put outside it is `written`.** `get`
  and `set` are for what this program holds. Outside is **E5**'s boundaries — the game's page state
  and the browser's store here, a file, a subprocess and the network in `tools/`. `libs/` has no
  boundary: it is handed its values. **ADR 0042.**
- **N17.** A collection is plural and never says which container holds it: `combatants`, not
  `combatantList` — the type is in the signature, and the suffix goes stale the day a `Map` becomes
  an array. A map is named for the lookup it takes: `damageByElement`. _(`by-reading` whether a name
  ends in a container or in a word that happens to spell one)_

## Code

- **C1.** Order matters even where it does not change semantics. Important things near the top;
  within a module, types, then constants, then the exported entry, then its helpers.
- **C2. A comment earns its place by carrying one of four things, and nothing else:** a measurement,
  with the material and date it was taken on; a constraint somebody else's system imposes; a
  rejected alternative and why it lost; a trap that will otherwise be fallen into twice. Anything
  that only describes what the code does is deleted, however well written. _(`by-reading` whether a
  comment carries a measurement, a constraint, an alternative or a trap)_
- **C3.** A comment states what is true of the code **now**. Never how it came to be this way — no
  "used to", no "for a while this was". That is what a commit message and an ADR are for.
  _(`by-reading` whether a sentence describes the code now or how it got here)_
- **C4.** A file's docblock says what the file is for, in **at most eight lines**. Longer than that
  is not a docblock, it is an ADR that has not been written yet.
- **C5.** Comment share of a file stays under 25%. **ADR 0005.**
- **C6.** Comments are sentences — a space after the slashes, a capital letter, a full stop, or a
  colon when they introduce what follows. An end-of-line comment may be a phrase.
- **C7. No regular expressions.** Text is read by walking it. One exception, and it is somebody
  else's API: a bundler plugin's `onResolve({ filter })` takes nothing else. **ADR 0006.**
- **C8. Every import is written from the repository root**, with `@/` and the file's extension:
  `@/core/fight-decoder.ts`, never `../core/fight-decoder.ts` — not at any depth, not even for a
  sibling. `deno.json` maps `@/` to the repository root and nothing else, so one prefix is the whole
  scheme: a path reads the same wherever it appears, and moving a file rewrites no neighbour's
  imports.
- **C9.** Nothing exists before it is needed — files, directories, modules, tools and guards alike.
  A shared module appears at the **second** consumer.
- **C10.** A file holds one subject, however long that subject runs. What forces a split is a
  **second** subject, never a line count.
- **C11.** Never create a file that only re-exports; update the import to the real module.
- **C12.** `!` is never used in `src/` or `tools/`. Ask first whether the type can be made precise —
  an assert over a type that could have been exact is covering for a loose type. Tests keep `!`.
- **C13. A value never wears a type nobody checked.** A type assertion overrides the compiler rather
  than asking it, so a value is narrowed by a guard instead: `isRecord` and the readings in
  `libs/unknown-reading.ts`, a `value is X` predicate, an `instanceof`, or a `require…` under
  **N2**, which throws. `as const` and `satisfies` assert nothing — they check a literal against a
  type rather than overriding one. The case that keeps escaping is `JSON.parse`: parsed text wearing
  a type is external data nobody checked. Three crossings here have no narrowing to offer, and the
  register `tests/repository/type-assertions.test.ts` reads both ways names each — one place rather
  than the same reason in three files. A fourth is `[ASK]`. Tests keep the cast, as `!` under
  **C12**. **ADR 0044.**
- **C14. Self-documenting code first.** A name, a type and an assertion say what a sentence would
  and cannot go stale, so they are the first answer to "this needs explaining". Plain description
  belongs in the **file's docblock** — what the file is for and what is in it — and nowhere else.
  Below that line a comment earns its place by **C2** or it is deleted, however well written. **ADR
  0016.** _(`by-reading` whether a sentence says something a name could have said)_
- **C15.** A comment never restates what a canonical document owns; it **cites** it. `DESIGN.md`
  owns the panel's look, `docs/protocol-keys.md` a key's meaning, `docs/browser-support.md` an
  engine version, and an ADR its own decision. **And never twice in this tree** — a block standing
  in two places is one rule with two copies. **ADR 0016.** _(`by-reading` whether a sentence
  restates a document, as opposed to repeating one word for word)_
- **C16.** Comment share of a directory under `src/` or `tools/` stays under 22%. A file may sit
  near C5's ceiling; a directory may not, because a per-file bound cannot see a directory walking to
  it. **ADR 0016.**
- **C17. The standard library is asked before a function is written.** `@std` is carried already
  (**ADR 0001**), so a walk written here is a walk somebody else has tested. Where its edge case
  differs from the one needed, keep your own and **name the difference where the code stands** — an
  unexplained local copy is indistinguishable from not having looked. A new package is still a
  dependency, and **Ask first** still governs it. **ADR 0040.** _(`by-reading` whether the library
  was asked)_

## Language

- **L1.** Write English — code, comments, tests, documents, commits.
- **L2.** One exception: **the text a person who plays the game reads**, which is Polish wherever it
  is composed. Identifiers around a Polish string stay English. What arrives from the game keeps the
  game's own spelling — a payload's keys, a message's words — and is nobody here's to rename
  (`captures/AGENTS.md`). **ADR 0030.**
- **L3.** A Polish sentence never carries our vocabulary or a key of the game's: a player is told
  what cannot be known, not why our reader cannot know it.

## Evidence and claims

- **V1.** Cite the source for any claim about the game — its documentation, a client asset, or a
  measurement over `captures/`. Negative claims included. _(`by-reading` whether a citation is true,
  as opposed to present)_
- **V2.** A quotation from the client carries its build id; a claim from the published help carries
  the date it was read. _(`by-reading` whether a build id is the one the claim was read on)_
- **V3.** A claim about a browser names the engine, the version and the date it was read. The
  version is the **first** release with support, never the one that completes a partial
  implementation. Which engine a measurement is taken on is
  [`docs/browser-support.md`](docs/browser-support.md)'s to say.
- **V4.** A measurement over the recordings names the material it was taken on — the file, or the
  set and its date. Where the claim is about every recording, say that and drop the figure.
  _(`by-reading` whether the named material is the material measured)_
- **V5.** Never leave a number in prose that a machine could compute — test counts, coverage, line
  counts. Measure at read time.
- **V6.** Documentation settles a meaning; the recordings settle a number. Where they disagree, the
  disagreement is the finding. _(`by-reading` whether a disagreement was reported or quietly
  resolved)_

## Verification

- **W1.** Run `deno task check` after every change, including a one-line edit. Nothing is done until
  it is green.
- **W2.** `git add` before the gate. Part of it lists what it reads with `git ls-files`, so a file
  written straight to disk is invisible to it.
- **W3.** Prove a new test can fail: break what it covers, watch it go red, restore **from a copy**
  — never `git checkout`, because the file may carry uncommitted work. Report it under **G3**.
  _(`by-reading` whether the mutation lit what it claims to have lit)_
- **W4.** A mutation that lights nothing is a finding — a missing test or an inert line, and often
  the answer is to delete something. _(`by-reading` whether nothing lighting up was investigated)_
- **W5.** Test the boundary from both sides, and zero is a boundary. Zero is the neutral element of
  every sum here, so a wrong edge moves no figure and changes what a figure means. A test at `0`
  needs one at `1` beside it.
- **W6.** A test that parses another program's output holds a **transcript**, never a typed sample.
  A guess about another program's output is a claim about that program. _(`by-reading` whether a
  transcript is a transcript)_
- **W7.** Read back the result of a scripted edit, and read back the **whole unit** — the sentence,
  the rule, the paragraph — never only the line that changed. A pattern that no longer matches does
  nothing and says nothing; a line replaced inside a wrapped sentence leaves the half in front of it
  standing.
- **W8.** Never update a golden expectation merely to make a behaviour change pass. _(`by-reading`
  whether an expectation moved for a reason)_
- **W9. A change under `src/` is not done until `deno task e2e` is green as well.** The gate asks
  for no browser and stays runnable on a machine with none; that suite asks for the Chrome this
  machine has, and what it holds nothing else does — the built file running, a drag by a real
  pointer, a card a pointer opens and a redraw takes away, the one region that scrolls, a file the
  browser really takes, storage that survives a real reload, and a crawl of every control the panel
  draws. **ADR 0047.**
- **W10. A work round starts with the readings current.** What `frozen/` holds is evidence a guard
  stands on, and the gate cannot tell that one has gone behind the game: it reaches no network, and
  a gate that asked a world whether it may go green would be red whenever one is down. The
  observation is `deno task game:readings status` **exiting `1`** — a bundle fetched and never
  re-frozen, a dump past the floor it states. A world that did not answer exits `2` instead, and is
  not that observation: an outage is no evidence that anything moved. How a reading is refreshed is
  `frozen/AGENTS.md`'s.

## Git and releases

- **G1. Ask before committing or pushing.** Otherwise end a round with the changes in the working
  tree and a summary. _(`by-reading` whether permission was asked)_
- **G2.** Conventional Commits, English: `type(scope): effect`. The header names the **effect**, not
  the activity — "blocked hits reach the panel", not "add block handling". _(`by-reading` whether a
  header names the effect or the activity)_
- **G3.** The body is the primary record of reasoning, with no length limit: numbers rather than
  adjectives, what decided it, the rejected alternatives, what you broke and what lit up, and what
  stays open. A substantive change with a one-line body breaks this. _(`by-reading` whether a body
  is the record of the reasoning)_
- **G4.** `TODO.md` is committed on its own, as `todo: …` — no scope, nothing else in the commit.
- **G5.** Every commit leaves the gate green on its own, including when one change is split across
  several.
- **G6.** Work lands on `develop`; `main` is the latest release, advanced only at a release and only
  by fast-forward.
- **G7.** A release goes out in three takts, and the wait is between the second and the third:
  `develop`, then `main` once that push's `check` run is **green**, then the tag. Branch protection
  refuses `main` while the run is going, and that refusal is cheap — the tag going out first is not.
- **G8.** Never bypass a hook.

## Ask first

- Changing the data contract — anything shaping what flows between decoder and aggregator.
- Deleting or skipping a test, including "it's obsolete".
- Adding a dependency.
- Touching anything under `captures/`.
- Turning off a compiler flag, a lint rule, or a guard to pass.
- Adding a file nothing uses yet.
- Adding a construct that raises the browser floor.
- Widening any rule this repository marks `[ASK]`.

## Never

- **Send anything over the network from the userscript** (`SECURITY.md` owns the surface).
- **Automate the game or change how a fight plays out.**
- **Edit captured material to make a test pass** (`captures/AGENTS.md`).
- **Copy the game's own prose into this repository.** Keys and identifiers are functional and may be
  stored; displayed sentences are somebody else's work. Player nicknames never enter the repo.
- **Invent data the log does not carry.** Unknown is allowed, a guessed name is not.
- **Comment the obvious.**
- **Leave a number in prose that a machine could compute.**
- **Write to `TODO.md`** — the maintainer's hand-kept list. No edit, no reformat, no tick, no
  reordering, by any tool.

  The wall is narrower than the rule, and **the rule is what binds**. `.claude/settings.json` denies
  `Edit`, `Write` and `NotebookEdit` against the file. A permission list matches a **tool call**,
  and a shell writes with a redirect, a heredoc or `sed -i` — which no list of that shape can
  recognise without also refusing every command that merely mentions the file. So the shell is
  forbidden here and nowhere else.

  **A formatter is a tool, and this was learned the expensive way.** `deno fmt` rewrote this file on
  the first run of the gate — no tool call a permission list can see, no shell redirect, just the
  formatter doing its job over every markdown file it found. It is excluded in `deno.json`, with
  that reason written beside it. Any tool added later that walks the tree and writes gets the same
  exclusion **before** its first run, not after.

## Guard register

Every guard that **exists**. Nothing is listed here before it runs.

A rule outside this table is in one of two states, and they are different. A rule ending
**`by-reading`** carries an observation no machine can compute — whether a citation is true, whether
a comment carries what C2 asks. Those are permanent. Every other unlisted rule is **outstanding
work**: a machine could hold it and none does yet.

The marker is one code span on purpose. `deno fmt` owns the wrapping of every document here, and it
broke a three-word marker across a line in four rules the first time one was written — leaving a
guard that searched for the whole phrase reading those four as unmarked. **A token a guard looks for
is written so the formatter cannot split it.** The same holds the other way round for a guard that
reads source: `deno fmt` wraps a loop condition across three lines and a marker across two, so **a
reader over source reads the construct, not the line.**

**A reader is proved by a sample it must flag and a sample it must not.** The first catches a reader
that has stopped finding its subject; only the second catches one that finds too much. A guard here
counted one mark more than the document carried, stayed green for a round, and was found by counting
the same thing a second way.

| Guard                                         | Holds                                            |
| --------------------------------------------- | ------------------------------------------------ |
| `deno check`                                  | S7, S10, C12 in part                             |
| `deno lint`                                   | S10, S12 in part                                 |
| `deno fmt --check`                            | C6 indentation and prose wrapping                |
| `deno.json` fmt exclusion                     | `TODO.md` against the formatter                  |
| `deno test`                                   | every guard below                                |
| `tests/repository/documents.test.ts`          | the rule documents and this register             |
| `tests/repository/decisions.test.ts`          | the decision records                             |
| `tests/repository/sources.test.ts`            | S1, S2, S4, S5, S13, A10, A11, C5, C8, C15, C16  |
| `tests/repository/errors.test.ts`             | E1, E2, E11–E13, E14 part, each with a sample    |
| `tests/repository/unguarded-paths.test.ts`    | E14's paths, walked from the add-on standing up  |
| `tests/repository/names.test.ts`              | N1, N11, N14, N15, N16, each with a sample       |
| `tests/repository/type-assertions.test.ts`    | C13, with a register read both ways              |
| `tests/repository/protocol-keys.test.ts`      | register help claims against the frozen counts   |
| `tests/repository/readmes.test.ts`            | the two READMEs, and both against the shot set   |
| `tests/repository/cited-paths.test.ts`        | every rooted path a document cites               |
| `tests/repository/constructs.test.ts`         | the construct register, both ways                |
| `tests/repository/game-vocabulary.test.ts`    | N13 for the two pages standing a game up         |
| `tests/repository/fabricated-fights.test.ts`  | the wall between evidence and what was made up   |
| `tests/repository/libraries.test.ts`          | `libs/` and `project/` reaching into no layer    |
| `tests/tools/fabricated-fight.test.ts`        | the fabricated fight against the key register    |
| `tests/tools/turn-count.test.ts`              | `docs/turns-taken.md` against every recording    |
| `tests/tools/turn-reading.test.ts`            | `docs/reading-a-turn.md`, and it on the panel    |
| `tests/tools/browser-support.test.ts`         | `docs/browser-support.md` against the stylesheet |
| `tests/tools/captured-fight-register.test.ts` | `docs/captured-fights.md` against `captures/`    |
| `tests/tools/drill-report.test.ts`            | `docs/drill-levels.md` against every level drawn |
| `tests/ui/blow-vocabulary.test.ts`            | N13 for what a blow carried, against `captures/` |

A guard joins this table in the commit that makes it pass, and the known-gaps list shrinks by the
same rules in that commit.
