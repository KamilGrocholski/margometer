# 0027. A name says what it holds, and a function what it acts on

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

The maintainer asked for names that read like a sentence. N7 asks for `action + context`, and
nothing held it. Read off `docs/names.md` at `592a9aa` on 2026-10-02, a name counted once per
section:

- of 1975 functions, 1515 had three words or more, and 122 had one;
- of 1799 locals, 1253 had one word, and of 714 parameters, 529;
- a probe of the parse on the same tree found 2113 bindings named with a word that fits any value
  (`value`, `at`, `one`, `other`, `found`, `read`, `first`, `next` …): 1527 under `tests/`, 245
  under `tools/`, 184 under `src/ui/`, 62 under `src/core/`, 49 under `src/runtime/`, 30 under
  `src/ports/`, 14 under `libs/` and 3 in the entry;
- the same probe found 18 functions declared on their own whose name was a bare verb: five closures
  named `add`, two `guarded`, and `attempt`, `clamp`, `count`, `format`, `hide`, `release`,
  `substitute`, `timed`, `translate`, `wrap` and `write`.

Functions mostly read as sentences already. The gap is in what a value is called while it is held:
`fights.find((one) => one.openedAt === chosen)` says nothing a reader did not already know.

## Decision

Decided with the maintainer on 2026-10-02.

**A function declared on its own is an action and what it acts on.** `clamp(value, …)` becomes
`clampNumber(number, …)`, and a closure `add` names what it adds. A method is read with its
receiver, `store.read(key)` and `ledger.add(defect)`, and so is a function every importer reaches
through its module: `errors.attempt(call)` keeps its name, as ADR 0009 decided, because the
namespace is its object. Whether a method reads as a sentence is left to a reader; `drawing.keep()`,
which keeps the list's scroll and not the drawing, is the case it is for.

**A local or a parameter names what it holds, never a placeholder.** The placeholders are a closed
list, the words that fit any value: `a`, `at`, `b`, `current`, `data`, `element`, `entry`, `first`,
`found`, `item`, `last`, `next`, `node`, `one`, `other`, `part`, `previous`, `read`, `result`,
`value`. A lambda is no exception: `(one) => one.openedAt` becomes `(keptFight) => …`. A word of the
list inside a longer name says what it is of, and stands (`valueByName`, `previousRegion`). `x` and
`y` stay: a coordinate is named by its axis.

Rejected: every name a full sentence, types and files included. `readBuildIdFromBundleScriptName`
says what the module's name already says, and N9 forbids that.

Rejected: functions alone. The placeholders are where most of the gap stands, by the count above.

Rejected: `attemptCall` for `attempt`. It would reverse ADR 0009 for a name that reads as a sentence
through its module, at the cost of 80 calls in 35 files, three rules and two guards.

Rejected: an exception for a name the guard lists by hand. The namespace exemption is a property of
how the tree imports a module, so a second module read that way needs no edit to the guard.

## Consequences

**N22** in `AGENTS.md` states both halves and their observation, and
`tests/repository/name-shapes.test.ts` holds them. Its directories grow a layer per commit, from
`libs/` to `tests/`, so every commit leaves the gate green.

Names the game or the browser chose stay as they spell them (N13), and so do the keys a store or a
file keeps (_Ask first_).

Open: a method that reads as no sentence with its receiver is held by reading alone.
