# AI agent instructions

This branch, `rewrite/2026-09`, is MargoMeter written again from nothing. Its rules are `develop`'s
at `fa1dcce`, rewritten for the design round of 2026-09-24, and its architecture is
[`docs/design.md`](docs/design.md)'s. A rule carried over from `develop` keeps its evidence in
`develop`'s decision records, cited as `develop ADR NNNN`. This branch's own are `docs/adr/`,
numbered from 0001 and cited as `ADR NNNN`, and a decision that changes a rule here writes one.

These instructions apply to every directory unless a closer `AGENTS.md` overrides a rule for its
subtree.

## Authority and required context

Apply instructions in this order:

1. the closest `AGENTS.md` to the file being changed;
2. parent `AGENTS.md` files up to this root;
3. the canonical documents below;
4. `deno lint`, the tests and CI as mechanical enforcement, from the commit that brings them.

A local instruction may strengthen or replace a root rule **only when it states the exception
explicitly**, and it **never restates one**. A nested file repeating a parent rule has a duplicate
that will drift, and a reader cannot tell which copy is current. The same holds between the
canonical documents: **every rule has one owning document**, and the others point at it. A rule
restated in different words is worse than one restated verbatim, because the two drift without ever
looking different. Before deleting a restatement, **read the owner and confirm it says the thing**.

The documents this branch carries:

- [`docs/design.md`](docs/design.md) — layers, ports, types, the process, the failure map, the
  boundaries, the file format, the build order.

A document joins this list in the commit that creates it (**C9**). Until this branch carries its
own, `develop:PRODUCT.md` is what the add-on is for, `develop:CONTEXT.md` the canonical domain
terms, `develop:SECURITY.md` the rules for the game client, the network, stored data and captured
material, and `develop:DESIGN.md` the panel's look. They bind here as they bind there.

**Target is not proof.** `docs/design.md` is a design constraint, not evidence that a feature
exists. Do not describe target behaviour as implemented until code and verification agree.

**Every rule here is meant to be held by a machine.** The register at the end says which guard holds
which rule, and **only guards that exist are in it**. A rule with no guard is held by reading alone.

**A rule names the observation that breaks it.** A rule nobody can be shown to have violated is a
wish, and wishes accumulate. Where the observation cannot be named, the honest form is a measurement
or an `[ASK]`, not a firmer verb.

**A rule states what binds; its evidence lives in its decision record.** A rule that carries its own
argument has a duplicate, and the two drift.

## Safety

The shapes every function here keeps, whatever it is doing. **S3, S8 and S9 stand where a hazard
this language does not have would be**; each states what binds instead.

- **S1.** Only simple, explicit control flow. No recursion, direct or indirect. **A body is written
  over lines**, because every reader of one here reads it by its lines.
- **S2.** Every loop has a fixed upper bound; exceeding it fails an assertion rather than
  continuing.
- **S3.** The cost of one payload is **measured** over the recordings, never assumed, and a change
  to the decode path that raises it is a finding.
- **S4.** No function is longer than 70 lines, which is one printed page.
- **S5.** Assertion density averages at least two per **function that takes something and may
  assert**, across `libs/`, `src/core/`, `src/game/`, `src/runtime/` and `tools/`, counting the
  closures a file writes inside its functions as the functions they are. A function handed nothing
  has no precondition a caller could break; one **E12** forbids to assert has none it may state.
  **The floor a machine holds this to sits below the two**, so that deleting an assertion **A12**
  calls no assertion is never what reddens the gate. `develop ADR 0007`, `0051`, `0074`.
- **S6.** Declare at the smallest possible scope, `const` by default, at the point of use.
- **S7.** Every return value is used or explicitly discarded; every parameter is checked. Held by
  the compiler.
- **S8.** No code is generated at build time beyond the version constant and the instrumentation
  module swap.
- **S9.** Never alias a mutable structure. A caller that must not mutate receives a reading, not the
  map.
- **S10.** Zero warnings, from the first day. A warning fails the gate.
- **S11.** Every collection that grows with input carries a **stated maximum**, and the maximum
  binds. **How it binds is the layer's**: an assertion, where **A11** allows one; a clamp and a
  defect in the layer a reader touches; a `Result` failure where exceeding it is expected (**E1**);
  a throw in `tools/`; or a bound another layer already enforces, tied to this one by a test rather
  than restated. A stated maximum nothing reads is not a bound, and a new unbounded collection is
  `[ASK]`.
- **S12.** Split compound conditions into nested branches rather than `&&` chains, and state
  invariants positively: `if (index < count)`, not `if (index >= count)`.
- **S13. What the bundle carries is synchronous.** No `async`, `await`, `Promise` or `.then` in
  `src/`, or in the `libs/` modules it reaches. A promise at the wrapped engine call answers the
  game before the fight is read, and the `try` around a synchronous call catches no rejection
  arriving after it. `develop ADR 0043`.

## Assertions

- **A1.** Assert arguments, return values, preconditions, postconditions and invariants.
  _(`by-reading` whether an assertion covers the invariant that matters)_
- **A2.** Assert the positive space you expect **and** the negative space you do not. _(`by-reading`
  whether the negative space was the one worth asserting)_
- **A3.** Split compound assertions: `assert(a); assert(b);`, never `assert(a && b)`.
- **A4.** The message names the **invariant**, not the condition. _(`by-reading` whether a message
  names the invariant or the condition)_
- **A5.** Assertions are live in the shipped build. They are not removed for production.
- **A6.** Use `@std/assert`. There is no assertion module of our own.
- **A7. A failed assertion becomes state at the nearest boundary**, through `runGuarded` (**E4**). A
  programmer error degrades to a missing section; it never reaches the game's call stack.
- **A8. An assertion is not a failure.** `assert` is for what must never happen. A failure you know
  can occur is a `Result` (**E1**), and an `AssertionError` is never matched on by kind.
- **A9. Where a failure is read, the assertion that reports more is the one used.** In `tools/` and
  `tests/` a `@std/assert` function that says what `assert` cannot — the value, the diff, the
  narrowed type — is what stands there; where it discards the message naming the invariant, `assert`
  is. `===` takes the **strict** pair and never the deep one. `develop ADR 0040`.
- **A10. What the bundle carries takes the plain `assert`** — `src/`, and the `libs/` modules it
  reaches — imported by module path, `@std/assert/assert`, never the barrel. `develop ADR 0040`.
- **A11. The layer a reader touches asserts nothing.** `src/ui/`, `src/userscript-entry.ts` and
  `src/userscript-boot.ts` import no assertion and spell none: a broken invariant there is checked,
  degraded in place and recorded as a defect (**E12**). `develop ADR 0051`.
- **A12. An assertion the compiler already guarantees is not one.** The observation is mechanical:
  delete the line and run `deno check` — where the tree still type-checks and no narrowing was lost,
  the assertion was never holding anything. A value crossing one of **E5**'s boundaries is the case
  this does **not** name. `develop ADR 0074`.

## Errors

The shapes are `docs/design.md` §3; the fate of each failure is its §10.5.

- **E1. Two kinds of failure, and they never share a mechanism.** A failure that can happen — the
  game did not send a field, storage refused, a message does not parse — is **returned** as a
  `Result`, never thrown. A broken invariant is an **assertion**. Nothing the bundle carries throws
  on purpose except an assertion; the only other exceptions it meets are thrown by code it did not
  write. **A bound on what arrives from outside is checked once, at the edge that reads it**, and
  fails as a `Result` there; past the edge the same bound is an assertion, because only a bug of
  ours can break it. A `Result` travels only where its reason changes what happens next — a failure
  that would end in the same defect as a broken invariant is not given a type of its own.
- **E2. A `Result` is `{ ok: true, value } | { ok: false, error }`, and nothing else.** It has no
  combinators: every call site branches with `if (!result.ok)`, which is **S1**'s explicit control
  flow. `ok` carries no boolean prefix; that exception to **N8** is stated there.
- **E3. A failure is a record with a `kind`, never a class and never a sentence.** Its `kind` comes
  from a vocabulary (**N19**). A bound in it is `maximum: number`, filled from the constant that
  owns the number — a literal in the type is a second copy. A name the game chose never appears in
  it: a failure names **our** field (**N13**).
- **E4. A broad catch stands in exactly two functions**: `callForeign`, whose `try` holds only a
  call into code this project did not write, and `runGuarded`, which turns an assertion into
  `BrokenInvariant`. Each call to either sits at one of **E5**'s boundaries. Any other `catch` is a
  bug.
- **E5. There are six boundaries in the add-on, and they are enumerable.** A new one is `[ASK]`,
  because an unlisted broad catch is indistinguishable from a swallowed bug. Where each stands is
  `docs/design.md` §10.6.

  | Boundary                       | Direction | A failure there becomes               |
  | ------------------------------ | --------- | ------------------------------------- |
  | the add-on standing up         | inbound   | a copy that stood down, and said so   |
  | the wrapped engine call        | inbound   | a payload that did not land           |
  | one render region              | outbound  | that region undrawn, in place         |
  | browser storage                | outbound  | a refusal, which is an answer         |
  | the game's own page state      | outbound  | a reading marked unknown              |
  | a callback somebody else calls | inbound   | that gesture or frame dropped, marked |

  In `tools/` the boundaries are the network and a subprocess.
- **E6. `null` or `Result`: the reason decides.** `T | null` in a domain type means the protocol did
  not state it, which is a fact. A reading returns `T | null` where it has **one** reason to fail
  and its name already says it (`parseInteger`); it returns a `Result` where it has more than one,
  or where the reason must travel on (which field failed). **Never substitute `0` for a failed
  read.** Zero is a measurement. `develop ADR 0021`.
- **E7. Every failure meets a fate, and the compiler holds the table.** `FAILURE_FATES` maps every
  `kind` of `RuntimeFailure` to one fate; a new `kind` without an entry fails `deno check`.
  Branching on `kind` is what a failure record is for.
- **E8. Writing asserts, because the number is ours.** A writer (`format…`, `encode…`) asserts its
  input; a reader never throws.
- **E9. No failure is discarded silently.** Every failure leaves the mark **E5**'s table names for
  its boundary, where a reader can see it. Where a failure also reaches the console it is one
  branded entry, once per kind, never per render. `develop ADR 0025`.
- **E10. Every callback handed to an API this project did not author is guarded at the handover** —
  an event listener, a frame callback. A throw out of one unwinds into a dispatch loop that drops
  it, so the gesture does nothing and no mark reaches anybody. `develop ADR 0043`.
- **E11. A promise is awaited, or handed a rejection handler in the same statement.** One exception:
  the top-level `if (import.meta.main)` block of a tool, where a loud throw is the mark and the exit
  code is what a person and CI read. `develop ADR 0043`.
- **E12. Nothing the bundle carries may stop the add-on.** `src/ui/`, `src/userscript-entry.ts` and
  `src/userscript-boot.ts` check every value crossing into them, catch every call that can throw and
  degrade in place, and every failure they swallow becomes a **defect** the panel states. The test
  is a path, not a file: **an entry into this program with no boundary on it is a bug**.
  `develop ADR 0051`.
- **E13. A tool fails loudly, with a class of its own.** `tools/` throws subclasses of the abstract
  `MargoMeterToolError`, each passing its own `code`, with the original in `cause` when wrapping.
  The brand goes in `name` (`MargoMeterTool/…`), because a console shows it first. Never a bare
  `new Error`, never `extends Error` outside that one file. The bundle has no error class at all.
  `develop ADR 0009`.

## Interfaces

- **I1. An interface exists where there are two implementations.** A port — an interface over
  something this program does not control — has the real one over the page and the simulated one,
  and that is what earns it one (`docs/design.md` §5). A pure function has one implementation and
  stays a function: a method call is harder to follow than a named call, for a reader and for a
  guard.
- **I2.** An object that holds state may be described by an interface with one implementation,
  because the interface describes an object that exists anyway, rather than wrapping a function.
- **I3.** Where a consumer must be handed a function, it takes a parameter of a function type, at
  the **second** consumer (**C9**), and never an object wrapping one method.

## Naming

TypeScript idiom, with the naming rules stated here.

- **N1.** `camelCase` for functions and variables, `PascalCase` for types, `SCREAMING_SNAKE_CASE`
  for module constants, kebab-case for filenames.
- **N2. A function name starts with the action it performs**, and each verb means one kind of work.
  Most come from TigerBeetle, whose functions name their work rather than reaching for one verb.

  | Action              | Means                                                                       |
  | ------------------- | --------------------------------------------------------------------------- |
  | `init`              | Creates an object that holds state; its parameters are `…Options`           |
  | `deinit`            | Gives back what an object holds outside itself: a wrap, a frame, a listener |
  | `open`              | Loads durable state into memory at start                                    |
  | `on`                | Reacts to input from outside; the callback name                             |
  | `prepare`           | Reads and computes a transition, touching nothing                           |
  | `commit`            | Writes a prepared transition; cannot fail                                   |
  | `execute`           | Performs one operation on state                                             |
  | `verify`            | Asserts the invariants of a whole structure                                 |
  | `get`               | Accesses what this program holds, immediately                               |
  | `set`               | Assigns from one value to another                                           |
  | `lookup`            | Finds something that may not be there                                       |
  | `read`              | Takes a value from **outside** this program — **N16**                       |
  | `write`             | Puts a value outside this program — **N16**                                 |
  | `parse`             | Text → structure                                                            |
  | `decode`            | Structure → **meaning**                                                     |
  | `encode`            | Meaning → structure or text for somebody else to read                       |
  | `tally`             | Sums figures                                                                |
  | `index`             | Builds a map to look things up in                                           |
  | `replay`            | Walks events from the start to what stands now                              |
  | `present`           | Turns figures into what a screen shows                                      |
  | `render`            | Builds or updates DOM                                                       |
  | `format`            | Writes a value as text a person reads                                       |
  | `add` / `remove`    | Puts something into somewhere / takes it out                                |
  | `create` / `delete` | Brings something into existence / erases it                                 |
  | `reset`             | Restores to the initial state                                               |
  | `require`           | A value narrowed to a type, or throws — `tools/` only (**E1**)              |
  | `expect`            | Fails a test unless something holds — a test's action and nobody else's     |
  | `compose`           | A new value made of several, where no verb above fits                       |

  `compose` is the residue, not the default. Other verbs are allowed where they are more precise,
  but never a **synonym** for one in the table.
- **N3.** Units and qualifiers go **last**, sorted by descending significance: `damageRawTotal`,
  `latencyMillisecondsMaximum`, and a shouted constant the same way: `ROWS_MAXIMUM`, never
  `MAXIMUM_ROWS`. A bound is a qualifier like any other, and TigerBeetle spells it last everywhere
  (`message_size_max`).
- **N4.** No abbreviations. `button`, not `btn`; `percent`, not `hpp`; `Maximum`, not `max`.
  Abbreviate only where the game does, and say so in a comment. _(`by-reading` whether a shortened
  word is an abbreviation or the game's own spelling)_
- **N5.** Related names get the same length where they can, so they line up: `source` and `target`,
  not `src` and `dest`. _(`by-reading` whether two related names line up)_
- **N6.** A helper called by one function is prefixed with that function's name; a callback goes
  last in the parameter list.
- **N7.** Names follow A/HC/LC — `prefix? + action + high context + low context?`.
- **N8.** Booleans carry a prefix, in the tense that fits: `is`, `was`, `will` for a state, `has`
  for what is held, `does` for what a thing can do, `should` for a condition with an action behind
  it. **One exception, and it is stated here:** the discriminant `ok` of `Ok` and `Err` (**E2**),
  and nothing else.
- **N9.** Do not overload a name with context-dependent meanings, and do not duplicate the context a
  name already sits in.
- **N10.** Files are named for their contents, never their category. `utils.ts`, `helpers.ts`,
  `common.ts`, `misc.ts` and `index.ts` are never created here.
- **N11.** Types name the thing, not its shape: `CombatantSnapshot`, not `CombatantData`.
- **N12.** Use the term `develop:CONTEXT.md` gives, and never one it lists under `_Avoid_`.
  _(`by-reading` whether a word names the concept it is forbidden for)_
- **N13. A name this repository did not choose is spelled once**, in the map of the adapter that
  reads it (`ENVELOPE_KEYS`, `WARRIOR_FIELDS`), keyed by a name of ours. Everything past the adapter
  — a record, a failure, a defect, a console line — carries our name. Where two files must spell
  one, a guard holds them to one vocabulary.
- **N14.** A unit is spelled in full, where **N3** puts it: `afterMilliseconds`, `healthPercent` —
  never `Ms`, `Sec`, `Pct`. `develop ADR 0042`.
- **N15.** A boolean names the state that holds and is negated where it is **read**: `!isDrawn`,
  never `isNotDrawn` or `hasNoRows`.
- **N16. A value from outside this program is `read`; a value put outside it is `written`.** `get`
  and `set` are for what this program holds. Outside is **E5**'s boundaries. `libs/` has no
  boundary: it is handed its values. `develop ADR 0042`.
- **N17.** A collection is plural and never says which container holds it: `combatants`, not
  `combatantList`. A map is named for the lookup it takes: `damageByElement`.
- **N18. A closed set of our own strings has one vocabulary object**, its type derived from it and
  its list, where a list is wanted, from its values:
  `const STORAGE_CHOICE = { local: "local", session: "session", memory: "memory" } as const`,
  `type StorageChoice = VocabularyWord<typeof STORAGE_CHOICE>` and
  `const STORAGE_CHOICES = Object.values(STORAGE_CHOICE)`. Code names a word by its key,
  `STORAGE_CHOICE.local`, never by the literal. A string arriving from outside is checked against
  the list with `isOneOf`, **and only there** — a string our own code wrote is the compiler's to
  check (**A12**). ADR 0001. No `enum`, which emits an object nobody here writes (**S8**), and no
  `Object.freeze`, which would check at run time what `as const` already forbids. **One exception: a
  protocol message's key** stays a `string`, because the set is the game's and grows. The decoder's
  `getKeyReading` decides whether a key means anything, and an unknown one is an unread message,
  never a type error.
- **N19. Every union with a `kind` has a vocabulary object**, so the string stands once and every
  variant, construction and `case` reaches it by symbol:
  `const ENVELOPE_FAILURE = { payloadNotRecord: "payload-not-record" } as const` and
  `{ kind: typeof ENVELOPE_FAILURE.payloadNotRecord }`. The key is the name for code; the value is
  what reaches a console or a file.

## Code

- **C1.** Order matters even where it does not change semantics. Important things near the top;
  within a module, types, then constants, then the exported entry, then its helpers.
- **C2. A comment earns its place by carrying one of four things, and nothing else:** a measurement,
  with the material and date it was taken on; a constraint somebody else's system imposes; a
  rejected alternative and why it lost; a trap that will otherwise be fallen into twice.
  _(`by-reading` whether a comment carries a measurement, a constraint, an alternative or a trap)_
- **C3.** A comment states what is true of the code **now**. Never how it came to be this way.
  _(`by-reading` whether a sentence describes the code now or how it got here)_
- **C4.** A file's docblock says what the file is for, in **at most eight lines of prose**. The
  lines showing how a tool is run do not count.
- **C5.** Comment share of a file stays under 25%, counting the comment lines that carry a word.
  `develop ADR 0016`, `0075`.
- **C6.** Comments are sentences — a space after the slashes, a capital letter, a full stop, or a
  colon when they introduce what follows. An end-of-line comment may be a phrase.
- **C7. No regular expressions**, in either spelling. Text is read by walking it. A new exception is
  `[ASK]`. `develop ADR 0006`.
- **C8. An import from the file's own directory is `./name.ts`; every other one is written from the
  repository root, `#/path.ts`.** Never `../`, never `./` into a subdirectory, never `#/` for a
  sibling, and always the file's extension. ADR 0002.
- **C9.** Nothing exists before it is needed — files, directories, modules, tools, guards and
  documents alike. A shared module appears at the **second** consumer.
- **C10.** A file holds one subject, however long that subject runs. What forces a split is a
  **second** subject, never a line count.
- **C11.** Never create a file that only re-exports; update the import to the real module.
- **C12.** `!` is never used in `src/` or `tools/`. Ask first whether the type can be made precise.
  Tests keep `!`.
- **C13. A value never wears a type nobody checked.** A type assertion overrides the compiler rather
  than asking it, so a value is narrowed by a guard instead: `isRecord` and the field readers
  `docs/design.md` §3 gives, a `value is X` predicate, an `instanceof`. `as const` and `satisfies`
  assert nothing. The case that keeps escaping is `JSON.parse`. A crossing that has no narrowing to
  offer is `[ASK]`, and the first one starts a register. Tests keep the cast. `develop ADR 0044`.
- **C14. Self-documenting code first.** A name, a type and an assertion say what a sentence would
  and cannot go stale. Plain description belongs in the **file's docblock** and nowhere else.
  `develop ADR 0016`.
- **C15.** A comment never restates what a canonical document owns; it **cites** it. **And never
  twice in this tree.** `develop ADR 0016`.
- **C16.** Comment share of a directory under `src/` or `tools/` stays under 22%.
- **C17. The standard library is asked before a function is written.** Where its edge case differs
  from the one needed, keep your own and **name the difference where the code stands**. A new
  package is a dependency, and **Ask first** governs it. `develop ADR 0040`.

## Language

- **L1.** Write English — code, comments, tests, documents, commits. An identifier never carries a
  Polish character.
- **L2.** One exception: **the text a person who plays the game reads**, which is Polish wherever it
  is composed. What arrives from the game keeps the game's own spelling. `develop ADR 0030`.
- **L3.** A Polish sentence never carries our vocabulary or a key of the game's: a player is told
  what cannot be known, not why our reader cannot know it.

## Evidence and claims

- **V1.** Cite the source for any claim about the game — its documentation, a client asset, or a
  measurement over the recordings (`develop:captures/`). Negative claims included.
- **V2.** A quotation from the client carries its build id; a claim from the published help carries
  the date it was read.
- **V3.** A claim about a browser names the engine, the version and the date it was read. The
  version is the **first** release with support.
- **V4.** A measurement over the recordings names the material it was taken on — the file, or the
  set and its date.
- **V5.** Never leave a number in prose that a machine could compute. Measure at read time.
- **V6.** Documentation settles a meaning; the recordings settle a number. Where they disagree, the
  disagreement is the finding.

## Verification

- **W1.** Run the gate after every change, including a one-line edit. The gate is `deno task check`,
  **from the commit that creates it**; a commit made before it exists says in its body that nothing
  was gated.
- **W2.** `git add` before the gate, by path.
- **W3.** Prove a new test can fail: break what it covers, watch it go red, restore **from a copy**
  — never `git checkout`. Confirm the break landed before reading the verdict, and prove a mutation
  by what it moved, not by what it matched.
- **W4.** A mutation that lights nothing is a finding — a missing test or an inert line.
- **W5.** Test the boundary from both sides, and zero is a boundary. A test at `0` needs one at `1`
  beside it.
- **W6.** A test that parses another program's output holds a **transcript**, never a typed sample.
- **W7.** Read back the result of a scripted edit, and read back the **whole unit** — the sentence,
  the rule, the paragraph — never only the line that changed.
- **W8.** Never update a golden expectation merely to make a behaviour change pass. On this branch
  the figures `develop` @ `fa1dcce` draws for a recording are the expectation, and a difference is a
  finding in one of the two (`docs/design.md` §12).
- **W9.** A change under `src/` is not done until the end-to-end suite is green as well, from the
  commit that brings the suite. `develop ADR 0047`.
- **W10.** A work round that relies on frozen readings of the game starts with them current, by
  `develop`'s `frozen/AGENTS.md` until this branch carries its own.

## Git

- **G1. Ask before committing or pushing.** Otherwise end a round with the changes in the working
  tree and a summary.
- **G2.** Conventional Commits, English: `type(scope): effect`. The header names the **effect**, not
  the activity.
- **G3.** The body is the primary record of reasoning, with no length limit: numbers rather than
  adjectives, what decided it, the rejected alternatives, what you broke and what lit up, and what
  stays open.
- **G4.** Every commit leaves the gate green on its own, once there is a gate.
- **G5.** Work on the rewrite lands on `rewrite/2026-09`. Nothing here moves `develop` or `main`;
  how the rewrite reaches them is the maintainer's decision.
- **G6.** Never bypass a hook.

## Ask first

- Changing a contract `docs/design.md` names as carried over: `BattleEvent`, the wrap semantics, the
  file format, the storage keys.
- Deleting or skipping a test, including "it's obsolete".
- Adding a dependency.
- Touching anything under `captures/`, on any branch.
- Turning off a compiler flag, a lint rule, or a guard to pass.
- Adding a file nothing uses yet.
- Adding a construct that raises the browser floor.
- Widening any rule this repository marks `[ASK]`.

## Never

- **Send anything over the network from the userscript** (`develop:SECURITY.md` owns the surface).
- **Automate the game or change how a fight plays out.**
- **Edit captured material to make a test pass.**
- **Copy the game's own prose into this repository.** Keys and identifiers are functional and may be
  stored; displayed sentences are somebody else's work. Player nicknames never enter the repo.
- **Invent data the log does not carry.** Unknown is allowed, a guessed name is not.
- **Comment the obvious.**
- **Leave a number in prose that a machine could compute.**
- **Write to `TODO.md`** — the maintainer's hand-kept list — by any tool, on any branch. On this
  branch no wall stands in front of it yet: no permission list, no formatter exclusion. The rule
  binds without them, and a tool that walks the tree and writes gets the exclusion **before** its
  first run.

## Guard register

Every guard that **exists**. Nothing is listed here before it runs.

Every rule not in it is held by reading until a guard for it runs, and a guard joins this table in
the commit that makes it pass. A rule ending **`by-reading`** carries an observation no machine can
compute, and stays out of this table for good.

**A reader is proved by a sample it must flag and a sample it must not.** The first catches a reader
that has stopped finding its subject; only the second catches one that finds too much.

| Guard                                            | Holds               |
| ------------------------------------------------ | ------------------- |
| `deno check`, strict, with unused names an error | S7                  |
| `tests/repository/function-length.test.ts`       | S4                  |
| `tests/repository/regular-expressions.test.ts`   | C7                  |
| `tests/repository/import-paths.test.ts`          | C8                  |
| `tests/repository/non-null-assertions.test.ts`   | C12                 |
| `tests/repository/synchronous-bundle.test.ts`    | S13                 |
| `tests/repository/assert-imports.test.ts`        | A6, A10             |
| `tests/repository/throws.test.ts`                | E1, E13             |
| `tests/repository/names.test.ts`                 | N1, N10             |
| `tests/repository/layers.test.ts`                | `docs/design.md` §4 |
| `tests/repository/reader-layer.test.ts`          | A11                 |
