# 0042. A naming convention is transplanted, not copied

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

The µOS++ naming conventions — <https://micro-os-plus.github.io/develop/naming-conventions/>, read
2026-09-01 — are a C/C++ document, and that project moved to snake_case to line up with the ISO
standard library, MISRA and JSF. The letter of it does not reach TypeScript: a `_t` suffix, a
trailing `_` on a private member, a lowercase class name and `enum class` each collide with **N1**
or **N11**, which hold this tree to the idiom its readers already read.

Its substance mostly does, and half of it is already here. **N2**'s verb table is that document's
table. **N3** is its units rule, **N4** its "do not use contractions", **N9** its "a name should not
duplicate the context in which it is defined". What it says and this tree did not is four rules —
and the tree broke two of them, including inside the rule document. Measured over `2211278` on
2026-09-01:

- **A unit was shortened in seven names.** `atMs`, `everyMs` and `afterMs` in
  `src/game/engine-attachment.ts` and `src/userscript-entry.ts`, and the shouted spelling in
  `LOOK_EVERY_MS`, `STATE_WAIT_EVERY_MS`, `REBUILD_AFTER_QUIET_MS` and `KEEP_ALIVE_EVERY_MS`. Beside
  them stood `healthPercent`, spelled out. `AGENTS.md` carried two of its own: **N3**'s example was
  `latencyMsMax` and **N8** offered `prev` — both are what **N4** forbids, in the file that forbids
  it.
- **One boundary was spoken of in two vocabularies.** `src/game/browser-store.ts` declares `read`
  and `write` for the browser's store. Twenty-two functions across `src/game/` and
  `src/userscript-entry.ts` said `get` over the same kind of crossing — the game's page state
  arriving as `unknown` or as the payload's own `Record<string, unknown>`.

The other two cost nothing to state: no name in the tree welds a negation onto a boolean prefix, and
no collection is named for its container. A rule with no violation is still worth stating where a
guard can hold it — but only if the guard is proved on a sample it must flag, because a reader with
nothing to find looks exactly like one that has stopped working.

## Decision

**The convention is transplanted rather than copied: what it says is kept, how C spells it is not.**
Four rules join `AGENTS.md`, and **N2** gains the two verbs the third of them needs.

- **N14.** A unit is spelled in full, where **N3** puts it: `afterMilliseconds`, never `afterMs`.
- **N15.** A boolean names the state that holds and is negated where it is read — `!isDrawn`, never
  `isNotDrawn`. `unattributed`, `unaccounted`, `undrawn` and `unread` are `CONTEXT.md`'s words for
  claims of their own, not negations of ours.
- **N16.** A value from outside this program is `read`; a value put outside it is `written`. `get`
  and `set` are for what this program holds.
- **N17.** A collection is plural and never says which container holds it; a map is named for the
  lookup it takes.

**N8** widens to the six tenses the source gives — `is`, `was`, `will`, `has`, `does`, `should` —
and drops `prev` for `previous`.

## Consequences

- **`src/` was converted in the same commit the rules landed in**, because a rule stated over a tree
  that breaks it is a wish. Seven names spelled their unit out, and twenty-two `get` crossings
  became `read`: everything in `src/game/` that takes the game's own material, plus
  `readWorldFromPage`, `readGameBuildFromPage`, `readClockFromPage` and `readViewportFromPage` in
  the entry — where the environment's own method was already `readClock`.
- **The layer's boundary is now visible in its names.** In `src/game/` a function that takes
  `unknown` is reading the outside, and says so. `getFightFromSession` and `getIsEverySlotPinned`
  keep `get`: a `BattleSession` and a shelf of kept fights are this program's own.
- **`dist/margometer.user.js` grew 141 bytes**, 307,767 to 307,908, measured 2026-09-01 either side
  of the renames. Longer names ship. The figure is the cost of the decision, not a budget — there is
  no size guard here and this proposes none.
- **Three guards, and one rule a machine cannot hold.** `tests/repository/names.test.ts` reads every
  identifier for a shortened unit and for a welded negation, and reads `src/game/` and
  `src/userscript-entry.ts` for a `get` or `set` whose parameters cross. **N17** is `by-reading`:
  `CLASS.rowPinSet` is a pin that is set and `composeViewList` composes a list element, so a reader
  over container words would flag two names that are right.
- **`tools/` is left standing, and `ARCHITECTURE.md` says so.** Its `get` and `set` names that reach
  a file, a subprocess or the network are the same finding, but each needs a judgement of its own —
  `setPreviewServer` and `setRebuilt` are drift from **N2** rather than from **N16** — and the guard
  does not reach there. They are converted as each file is next edited for its own reasons.

## Alternatives

**snake_case, `_t`, a trailing `_` for a private member, lowercase type names.** Rejected: the
source's own spelling, and every one of them collides with **N1** or **N11**. TypeScript's compiler
holds visibility, so a suffix that says "private" says what the language already says.

**`fetch` for data that takes time.** Rejected, and it is the one transplant that would have been
actively dangerous: in a browser `fetch` **is** the network, which `SECURITY.md` forbids the
userscript entirely. A verb reading as an outbound call in a file that must never make one is worse
than no verb. An `await` already says a thing takes time.

**`do` for a private implementation.** Rejected: **N6** already prefixes a helper with its caller's
name, which says more than `do` does and is checked by reading the two names together.

**An accessor and a mutator sharing the property's name.** Rejected: it collides with **N2**'s
`get`/`set` split, and the arity-overload it depends on is a C++ shape TypeScript has no idiom for.

**`begin`/`end` for a boundary.** Rejected because the word is taken twice over: `CONTEXT.md` gives
**end** to the two ends of a message — the actor and the target — and `endBattle` is the game's own
key for the payload that finishes a fight. **N9** forbids the overload, so a boundary here takes
`first`/`last`.

**State the rules and leave the tree.** Rejected on what the audit found: two of the four were
already broken, one of them in `AGENTS.md` itself. A convention adopted without converting what it
condemns is a convention nobody has read.
