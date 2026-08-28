# Architecture

Three layers of claim live in this file and they are kept apart on purpose:

- **Current** — what the tree holds at this commit. Checkable by opening it.
- **Target** — contracts a change must satisfy. Constraints, **not** evidence that anything already
  works.
- **Known gaps** — where the two differ, listed at the end.

`AGENTS.md`'s **Target is not proof** binds here in full.

## Current state

**This is a rewrite in progress.** At this commit the repository holds documents, evidence,
generated registers and the bottom of `core/`: the error base and the message grammar. Nothing reads
the game yet, nothing is aggregated and nothing is drawn. The v1 implementation remains readable in
this repository's history on `develop` (`git show develop:src/core/fight-decoder.ts`), and is not
the thing being described here.

```
AGENTS.md          Rules, authority order, guard register.
CLAUDE.md          One line importing AGENTS.md.
PRODUCT.md         What this is for, tiers, non-goals.
CONTEXT.md         Canonical domain terms.
ARCHITECTURE.md    This file.
SECURITY.md        Reading boundary, guest rules, captured material.
DESIGN.md          The panel's visual system.
NOTICE.md          What here is somebody else's, and on what basis.
LICENSE            MIT — covers what was written here, and nothing else.
TODO.md            The maintainer's list, by hand. Never written to by a tool.
deno.json          Tasks, formatter, linter, strictness, the `@/` alias.
deno.lock          What the gate is actually run against. A package the lock does not name is
                   ambient type information CI will not have.
.gitignore         What never enters git, including the cache.

src/
  core/
    margometer-error.ts  The brand every failure that ships to the browser wears.
    protocol-message.ts  One message's grammar: both ends, then its parameters.
captures/          28 recordings of real fights. Evidence — see its own AGENTS.md.
frozen/            Dated readings of the game, written by tooling.
  AGENTS.md        Why no hand edits one, and what provenance each carries.
  protocol-keys.ts GENERATED. Every key the client knows, with its build.
  help-phrases.ts  GENERATED. How often each cited phrase occurs in the help.
docs/
  protocol-keys.md   What has been looked into, key by key: verdict, evidence, state.
  captured-fights.md What each recording holds, and how much protocol it carries.
  browser-support.md What the shipped file asks of a browser.
  adr/               Decisions costly or surprising to reverse.
tests/
  AGENTS.md                What is true of a test here and nowhere else.
  core/                    A test sits where its subject sits.
    protocol-message.test.ts  The grammar, over every message the recordings carry.
  repository/              Guards whose subject is this repository, not a layer of it.
    documents.test.ts      The rule documents and the guard register.
    decisions.test.ts      The decision records: numbering, index, lifecycle.
    sources.test.ts        S1, S2, C5, S4 and S5 over every TypeScript file.
    errors.test.ts         The error hierarchy, each reader proved on a sample first.
    names.test.ts          File names, exported functions and exported types.
  source-line.ts           A line of TypeScript with its string literals taken out.
  source-paths.ts          Every TypeScript file under the directories that hold one.
.agents/skills/verify/     How to drive the add-on in a browser and read what it drew.
.claude/settings.json      Denies the tool calls that would write to the maintainer's list.
```

Held by `tests/repository/documents.test.ts`, both ways: every file is described here, and every
name here exists.

## Target layout

```
src/
  userscript-entry.ts     Reads the game off the page, decides every name we put on it,
                          holds the session, mounts the panel, reaches storage.
  core/                   Pure logic: no DOM, no timers, no engine.
  game/                   All contact with the game client.
  ui/                     Renders state handed to it.
tools/                    Never ships. Each tool arrives with the question it answers.
tests/                    A test sits where its subject sits.
dist/                     The built userscript. Not tracked.
.cache/                   Game client sources, fetched on demand. Not tracked.
```

**Dependencies point one way:** `ui → core`, `game → core`, entry point → everything. `core` imports
nothing but itself and the standard library. There is no `libs/` layer: a primitive lives beside its
consumer, and the construct register below is what keeps "one way to read a value" from losing its
address.

## Target system flow

```
game client (production bundle)
      │  engine update function
      ▼
engine wrap ──── original runs first, its value returned untouched
      │  raw payload
      ▼
battle session ── one fight accumulated payload by payload
      │  messages
      ▼
protocol message ── grammar only: structure, reversible, no meaning
      │
      ▼
fight decoder ── messages → battle events. Drops nothing, invents nothing.
      │  events + roster + health
      ▼
fight statistics ── events → the numbers a panel draws
      │  reading
      ▼
panel ── one shadow root, delegated events, region by region
```

Two things never join this line. **Where a fight is happening** is read off the client's own state,
because the protocol says none of it. **What a fight was entered with** comes from combatant
snapshots the recordings carry and the live client exposes — the protocol never states maximum
health, which is exactly what lets the decoder be checked against something other than itself.

## Target data ownership

One owner per fact, once each module exists. A second module reads it; it does not recompute it.

| Fact                       | Owner                      | Notes                                 |
| -------------------------- | -------------------------- | ------------------------------------- |
| Message grammar            | `core/protocol-message.ts` | Structure only, no key's meaning.     |
| What a key means           | `core/fight-decoder.ts`    | The reverse: meaning, not grammar.    |
| The data contract          | `core/battle-event.ts`     | Changing it is `[ASK]`.               |
| Who is in the fight        | `core/combatant-roster.ts` | An ambiguous name resolves to nobody. |
| Health entered and held    | `core/combatant-health.ts` | Every input refused, never defaulted. |
| Every figure a panel draws | `core/fight-statistics.ts` | Raw and applied kept apart.           |
| Which side is the reader's | `game/engine-roster.ts`    | The one thing `core` cannot know.     |
| Where a fight happens      | `game/engine-place.ts`     | Off client state, never wrapped.      |
| What the panel says        | `ui/panel-words.ts`        | The only Polish in `src/`.            |
| Which screen it is on      | `ui/panel-screen.ts`       |                                       |

**The panel never computes a statistic across combatants** — no re-aggregating the fight, no
deriving one row's figure from another's. Folding a row's own maps into the cut a screen shows _is_
the panel's work.

## Target contracts — reading what the protocol half-says

The protocol routinely names one end of what happened and calls the other nobody. What separates a
reading from a guess is a small set of narrow rules saying exactly when the missing end may be
filled, from what, and what happens when it cannot be. They rest on **measurements over
`captures/`**, not on argument — which is why they are not written out here as prose about code that
does not exist.

**Each becomes an ADR in the commit that lands the code realising it**, carrying the measurement
that holds it. Four are known to be needed, and v1 paid for all four; its reasoning is readable at
`git show develop:docs/specs/the-ends-a-figure-names.md` and
`git show develop:docs/specs/sizing-a-share-onto-a-side.md`.

Until then, one thing binds and is not deferred: **a figure may be charged to a side by the end the
game did name; a figure may never be charged to a person that way.** A side has members, and a guess
about which one would be ours.

## Target contracts — failure in the panel

Two obligations bind at once: the reader must be able to tell something is wrong, and nothing we do
may stand between them and the game. The rule that resolves every case: **a number that might be
wrong must never look like a number that is right.**

How a failure is drawn is `DESIGN.md`'s — the Quiet Panel, Section Is Its Own Size, Suspect Is
Adjacent and Zero Is Not Unknown rules. That a failure becomes state rather than an exception, and
is never discarded silently, is `AGENTS.md` **E8** and **E11**. Neither is restated here.

One contract is this document's own, because it is about attribution rather than drawing:

- **A gap reaches a row only where the protocol named whom it was about**, and it says a figure is
  short without ever saying by how much. A gap naming nobody stays in the fight's own summary. A cut
  of a figure never carries one — a shortfall cannot be placed onto one opponent or one skill, so
  the mark rides the combatant's own row at every level. `[ASK]` before a third kind of gap joins
  the two that exist: a gap placed on a row it was not named for is a guess wearing a warning's
  clothes.

Two severities are enough, and a third is `[ASK]`: **suspect** and **undrawn** (`CONTEXT.md`).

## Construct register

A construct belongs to a named owner file if it has **more than one spelling in JavaScript**, or can
answer with a value nobody wrote. `Number("")` is `0`, `parseInt("12abc")` is `12`,
`Date.parse("nope")` is `NaN` and `NaN > limit` is `false`, `JSON.parse` throws and hands back
`any`.

Reading returns `null` and throws nothing — the caller picks assert, error or unknown. Writing
asserts, because the number is ours.

- `Number()`, `toFixed`, `String()` on a number — `src/core/protocol-message.ts`. Every reading is
  refused before it is taken: digits are proved to be digits, then the result is proved to be a safe
  integer, so no figure downstream is a neighbour of the one the game stated.
- `parseInt`, `parseFloat`, unary `+` — **planned**, named at its first consumer.
- `JSON.parse` — `tests/core/protocol-message.test.ts`, the one reader of a recording. Its result is
  `unknown` and is walked with `in` and `Array.isArray`; C13 forbids the cast that would skip that.
- `JSON.stringify` — **planned**, named at its first consumer.
- `Date.parse` — **planned**, named at its first consumer.
- `performance.now()` — **planned**, named at its first consumer.
- `typeof … === "object"`, which is `true` for `null` — `tests/core/protocol-message.test.ts`, where
  the `null` case is a second assertion rather than a clause of the first.
- `localeCompare` — **nobody**, spelled nowhere. Bringing a collated order back means a caller
  first, then a reader, then a row here, in that order.

The register is guarded by finding each construct **inside its owner and nowhere else**, in tests
too. An owner that owns nothing stops guarding, which is why a row is added when its first consumer
arrives and not before.

## Protected contracts

Do not assume backward compatibility for unreleased internals. **Do** preserve these unless the
change carries an explicit migration:

- **The metadata file's URL.** Version 0.5.0 polls `releases/latest/download/margometer.meta.js` for
  updates. A release that does not attach that file leaves every copy installed from 0.5.0 checking
  a 404 — and a failed update check says nothing to the person running it. They stay on 0.5.0 for
  good.
- **The engine wrap's semantics.** Original first, its return value untouched, one layer, and a
  detach that removes only ours.
- **The captured-fight file format.** Field names inside those files are Polish and stay that way;
  renaming is editing the evidence.
- **Stored reader preferences.** A stored value whose meaning changes needs a migration or a new
  key, because the old one is already in browsers.
- **`main` is always exactly the newest `v*` tag.** That is what lets the published preview and the
  file somebody installs be one build.

## Quality gates

`deno task check` is the gate, and it is one command so there is no version of "I ran the tests but
not the build":

```
deno fmt --check   formatting, line length, indentation
deno lint          zero warnings — P10 R10
deno check         types, at the strictness deno.json states
deno test          the tests, including every guard in AGENTS.md's register
deno task build    the bundle, plus the browser-floor check over it
```

The browser floor is checked over the **built bundle**, not the sources, because the bundle carries
standard-library code whose ES level is not ours to set.

## Known gaps

Where the tree does not yet meet what this file states. Each is migration work, updated in the same
commit that opens or closes one.

1. **Only the bottom of `core/` exists.** The error base and the message grammar are written; the
   decoder, the roster, the health, the statistics, everything under `game/` and `ui/`, the entry
   point and `tools/` are not. Every "Target" section above is a constraint, not a description, and
   the layers named in them are unwritten unless the structure block lists them.
2. **Few rules are guarded.** `AGENTS.md`'s register names every guard that exists. **Every other
   rule in that file is held by reading alone.** The register is the list; enumerating the unheld
   rules here would be a second list going stale against the first.
3. **The construct register has no owners**, so the rule it encodes is unenforced. A row is added
   with its first consumer.
4. **Carried documents cite v1 module paths that do not exist here.** `docs/protocol-keys.md`,
   `docs/captured-fights.md` and `docs/browser-support.md` reference files such as
   `src/ui/panel-look.ts` and `tests/core/health-witness.test.ts`. Capture paths were rewritten to
   `captures/` and every cited recording was checked to exist; module citations are stale until the
   modules land. Closed by `tests/repository/cited-paths.test.ts`, which must tell **three kinds of
   citation** apart, because a guard that treats them alike fails on all of them: a **real** path,
   which must exist; a **target** path, which must not exist yet and appears only in a section this
   document marks as target; and a **counter-example**, cited precisely because it is forbidden —
   `utils.ts`, `../core/fight-decoder.ts`, a filename template. Established by running the check by
   hand.
5. **The frozen registers name `bun` in their regeneration header.** They are generated files and
   are not edited by hand; the header corrects itself on the first regeneration under Deno.
6. **The carried documents run past 100 columns.** `docs/protocol-keys.md` (7 lines),
   `docs/captured-fights.md` (60), `docs/browser-support.md` (5) and the `verify` skill (16) hold
   tables `deno fmt` aligns but never wraps. The line-length guard names them as excluded rather
   than skipping them quietly; rewrapping is a large diff on material this tree carries rather than
   authors, and waits until each document is next edited for its own reasons.
7. **`docs/browser-support.md` describes a floor held over sources**, which is no longer how it is
   held once the bundle carries standard-library code. Accurate about v1, stale about v2 until the
   bundle-level guard lands.
8. **There is no drill register.** v1's `docs/drill-levels.md` described panel behaviour this tree
   does not have, and its guard measured it both ways from a tool that does not exist either. It is
   readable at `git show develop:docs/drill-levels.md` and returns **generated**, not carried, when
   there is a panel to measure.
9. **The `verify` skill names the Bun toolchain.** `.agents/skills/verify/SKILL.md` carries the
   procedural knowledge for driving the add-on in a browser and reading what the panel drew — worth
   keeping verbatim, since no tool regenerates it — but its commands (`bun run preview`,
   `tools/fight-dump-parser.ts`) name a toolchain and modules this tree does not have. Corrected
   module by module as each lands.
10. **A function declaration whose arrow sits on the next line is not counted.** `isFunctionOpener`
    in `tests/repository/sources.test.ts` reads a declaration from one line, so a named arrow
    wrapped across two is invisible to S4 and S5. The limit is pinned by a test rather than left to
    be discovered, and closes when a file in this tree is written that way.
11. **No release exists on this branch.** `README.md`, `CHANGELOG.md`, the workflows and the
    screenshots are unwritten; the release contract above is inherited from v1 and unexercised here.
