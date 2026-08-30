# Architecture

Three layers of claim live in this file and they are kept apart on purpose:

- **Current** — what the tree holds at this commit. Checkable by opening it.
- **Target** — contracts a change must satisfy. Constraints, **not** evidence that anything already
  works.
- **Known gaps** — where the two differ, listed at the end.

`AGENTS.md`'s **Target is not proof** binds here in full.

## Current state

**This is a rewrite in progress.** At this commit the repository holds documents, evidence,
generated registers, the whole of `core/` — the error base, the message grammar, the roster, the
data contract, the decoder, the health arithmetic and the statistics over what the decoder produces
— and the layers over it: `game/` reads a fight off the client and keeps it, `ui/` draws it, and the
tools build, serve, photograph and admit. What is not written is at the end of this file. The v1
implementation remains readable in this repository's history on `develop`
(`git show develop:src/core/fight-decoder.ts`), and is not the thing being described here.

```
AGENTS.md          Rules, authority order, guard register.
CLAUDE.md          One line importing AGENTS.md.
PRODUCT.md         What this is for, tiers, non-goals.
CONTEXT.md         Canonical domain terms.
ARCHITECTURE.md    This file.
SECURITY.md        Reading boundary, guest rules, captured material.
DESIGN.md          The panel's visual system.
NOTICE.md          What here is somebody else's, and on what basis.
CHANGELOG.md       What a player is told changed, release by release. The body of a release.
README.md          What this is and how to install it, in Polish, which is what a player reads.
README.en.md       The same, in English. The two are held to one set of pictures.
LICENSE            MIT — covers what was written here, and nothing else.
TODO.md            The maintainer's list, by hand. Never written to by a tool.
deno.json          Tasks, formatter, linter, strictness, the `@/` alias.
deno.lock          What the gate is actually run against. A package the lock does not name is
                   ambient type information CI will not have.
.gitignore         What never enters git, including the cache.
.github/
  workflows/
    check.yml      The gate, on every push and every pull request. The run G7 waits for.
    pages.yml      The preview published, on a push to `main`, once the gate is green.
    release.yml    What a tag turns into: the built file, and the notes its section carries.

libs/              Knows nothing of this project. Imports `@std/` and its own siblings.
  json-text.ts     JSON both ways, each answering whether it worked rather than with `null`.
  number-range.ts  A number held between two ends, and which end wins where there is no room.
  number-text.ts   Numbers read out of text and written back into it, refusing before reading.
  text-walk.ts     Walking text a character at a time, by a predicate the caller hands over.
  unknown-reading.ts   Reading a value nobody typed, answering null rather than throwing.
project/           Knows this project, belongs to no layer of it. Reads `libs/` only.
  repository-layout.ts  Where this repository keeps things: the root files, and the recordings.
src/
  build-version.ts     Which build this is. The one constant a build writes over — ADR 0012.
  userscript-boot.ts   What runs when the browser loads the built file, and the one cast.
  userscript-entry.ts  Where the layers meet: the game found, the payloads read, the panel drawn.
  core/
    battle-event.ts      The data contract: what the decoder produces, and nothing else.
    combatant-health.ts  Health read from a stated share, and how far off it can be.
    combatant-roster.ts  Who is in the fight, and which names resolve to one of them.
    fight-decoder.ts     What a key means, and what a key with no meaning leaves unread.
    game-build.ts        The build id the client states in its bundle's own filename.
    fight-statistics.ts  The figures a panel draws, with what nobody can be charged apart.
    margometer-error.ts  The abstract brand every failure that ships to the browser wears.
    protocol-message.ts  One message's grammar: both ends, then its parameters.
    protocol-number.ts   The shapes a percentage and a share are written in — a measurement.
  game/
    battle-session.ts    One fight, accumulated payload by payload, in the order they arrive.
    browser-store.ts     The store a browser lends, wrapped so a refusal is an answer.
    engine-attachment.ts   Getting the wrap onto the game, and off again.
    engine-battle-wrap.ts  The one function here that changes the running game.
    engine-place.ts      Where a fight happened, asked of the client's own state.
    fight-capture.ts     The fight as it happened, in the shape a recording is admitted in.
    game-dictionary.ts   What the player's own client calls a key this repository has no word for.
    kept-fights.ts       The fights a reader can go back to: the payloads kept, figures never.
    fight-report.ts      The figures of one fight, written into the recording beside them.
    engine-warrior.ts    The client's own field names, and the only file that spells them.
  ui/
    panel-card.ts        What a ranking row says on demand, out of the figures it holds.
    panel-drag.ts        Where the panel sits, and how a reader moves it.
    panel-element.ts     The panel drawn into a document it is handed, region by region.
    panel-look.ts        The panel's tokens, the classes its rules select, and the stylesheet.
    panel-reading.ts     One screen's worth of a fight, and one row's worth of a screen.
    panel-screen.ts      Which screen the panel is on, and the strips that say so.
    panel-tip.ts         The window a row opens on hover, and the register it is looked up in.
    panel-words.ts       Everything the reader reads, and the only Polish in `src/`.
    ranked-order.ts      The order a ranking is drawn in, and what decides a tie inside it.
tools/             Never ships. Each arrives with the question it answers.
  build-userscript.ts  The file a reader installs, the version written in, and two checks.
  capture-intake.ts    How a recording becomes material: two redactions, then a file.
  recorded-fights.ts   The recordings as a tool reads them: a name, and the calls made.
  fight-replay.ts      A recording put back through the layers that read it live.
  decoding-status.ts   What the decoder could not read, counted over whatever it is handed.
  fight-figures.ts     What a fight adds up to, per combatant, as a table at a terminal.
  drill-report.ts      Which rows of the panel open, measured level by level over a fight.
  preview-page.ts      The harness page, whole, as one string. It speaks neither language.
  preview-server.ts    That page served, rebuilt on a change under `src/`, and reloaded.
  preview-site.ts      That page written down, one per recording, for somebody with no clone.
  panel-screenshots.ts The panel photographed, at a frame measured off the panel itself.
  game-client-source.ts  The client fetched and dated, and the cache nothing published leaves.
  protocol-key-table.ts  Every key that client branches on, lifted out of its own switch.
  help-article.ts      The published help cached, searched raw, and counted into a reading.
  changelog.ts         The version this tree declares, and what a release says about it.
  margometer-tool-error.ts  The abstract brand a terminal failure wears, and the build's own.
captures/          28 recordings of real fights. Evidence — see its own AGENTS.md.
screenshots/       One set of the panel, with the sidecar naming the commit it was shot at.
frozen/            Dated readings of the game, written by tooling.
  AGENTS.md        Why no hand edits one, and what provenance each carries.
  protocol-keys.ts GENERATED. Every key the client knows, with its build.
  help-phrases.ts  GENERATED. How often each cited phrase occurs in the help.
docs/
  protocol-keys.md   What has been looked into, key by key: verdict, evidence, state.
  drill-levels.md    Which kind of row opens onto another level, and which is the last.
  captured-fights.md What each recording holds, and how much protocol it carries.
  browser-support.md What the shipped file asks of a browser.
  adr/               Decisions costly or surprising to reverse.
tests/
  AGENTS.md                What is true of a test here and nowhere else.
  game/
    battle-session.test.ts    Every recording replayed the way the game delivered it.
    browser-store.test.ts     A store that answers, and a browser that will not lend one.
    engine-attachment.test.ts   A page with a game, without one, or with a reader on it.
    engine-battle-wrap.test.ts  The promise the add-on makes to the page.
    engine-place.test.ts      A page that says all of it, some of it, or nothing.
    fight-capture.test.ts     The envelope, against the newest recording admitted.
    kept-fights.test.ts       A shelf that answers, refuses, runs out of room, or reads back.
    engine-warrior.test.ts    A payload's warriors, against the snapshots beside them.
    game-dictionary.test.ts   The shape of an entry, and a client that answers, misses or throws.
  core/                    A test sits where its subject sits.
    battle-event.test.ts      Every variant the union holds, against what arrives.
    combatant-health.test.ts  The arithmetic, against the client's own three figures.
    combatant-roster.test.ts  Two of a name, one of nobody, and every recording.
    fight-decoder.test.ts     The blows, and what is left unread beside them.
    game-build.test.ts        Both names the client serves, and what is not one of them.
    health-witness.test.ts    What was read, against what the protocol says of itself.
    fight-statistics.test.ts  The figures, and the balance every point of damage keeps.
    protocol-message.test.ts  The grammar, over every message the recordings carry.
    protocol-number.test.ts   The width a percentage is written at, and a share's two forms.
    absorption-destruction-rule.test.ts  Whose the share is: the caster's, across fights.
    anguish-rule.test.ts      The bleed charged to its victim, and the announcement with no figure.
    bandage-rule.test.ts      The figure as health, against the percentage stated before it.
    injure-rule.test.ts       Every tick against the wound ticking, and whom it is charged to.
    last-heal-rule.test.ts    The threshold it fires under, and which segments pair with it.
    npc-heal-rule.test.ts     The slot it is read in, and the occurrence stating nothing.
    skill-announcement-rule.test.ts  What rides an announcement, in either spelling of one.
    wound-rule.test.ts        The tick chained from a stated percentage, killing blow apart.
  tools/
    browser-support.test.ts   Every construct the sheet spells, against the register, both ways.
    build-userscript.test.ts  The built file, read back: the banner, and no way out.
    capture-intake.test.ts    What intake refuses, and every admitted recording as a fixed point.
    captured-fight-register.test.ts  The census, re-earned from the directory it describes.
    recorded-fights.test.ts   The directory read, and the claim a rewind by replay stands on.
    fight-replay.test.ts      One fight by two routes through the core, and every recording.
    decoding-status.test.ts   A sample it must flag, and the corpus it must not.
    fight-figures.test.ts     The table read back, and the reading block that prints at zero.
    drill-report.test.ts      The register against every level drawn, both ways round.
    preview-page.test.ts      The page, read back: the order of its scripts, and its escaping.
    preview-server.test.ts    Every route, against a bundle handed in rather than built.
    preview-site.test.ts      A page per recording, addressed relatively and asking nothing.
    panel-screenshots.test.ts The set against its sidecar, and the frame a report sizes.
    game-client-source.test.ts  Both names a world serves, and git asked about the cache.
    protocol-key-table.test.ts  The switch in either spelling, and the material against it.
    help-article.test.ts      A page turned into text, and a dump that says how old it is.
    changelog.test.ts         A section against its neighbours, and the release that has none.
  ui/
    blow-vocabulary.test.ts   Every key a blow carried, against the words the panel has for it.
    panel-card.test.ts        Every figure a card states, and the parts it draws under them.
    panel-drag.test.ts        A panel kept on the screen, and put back where it was left.
    panel-element.test.ts     What the panel puts on a page, read back out of it.
    panel-look.test.ts        Contrast by arithmetic, and a sheet that spends tokens only.
    panel-reading.test.ts     A screen of a real fight, through every layer under it.
    panel-screen.test.ts      The screens there are, against what a reading composes for.
    panel-tip.test.ts         What the window draws, how tall it says it is, and what it drops.
    panel-words.test.ts       What the words must never say, and how Polish counts.
    ranked-order.test.ts      The order two rows are drawn in, and the tie nothing breaks.
    share-column.test.ts      Every column of shares the panel draws, against the hundred.
  libs/                    A test sits where its subject sits.
    json-text.test.ts         Both directions, over the answers `null` used to stand for.
    number-range.test.ts      Every side of two ends, and the range with no room in it.
    number-text.test.ts       Text that looks like a number, against text that is one.
    unknown-reading.test.ts   What counts as a shape worth reading, list and null included.
  repository/              Guards whose subject is this repository, not a layer of it.
    documents.test.ts      The rule documents and the guard register.
    decisions.test.ts      The decision records: numbering, index, lifecycle.
    sources.test.ts        S1, S2, C5, C15, C16, S4 and S5 over every TypeScript file.
    errors.test.ts         The error hierarchy, each reader proved on a sample first.
    names.test.ts          File names, exported functions and exported types.
    protocol-keys.test.ts  The register help claims, re-counted against the frozen table.
    readmes.test.ts        The two READMEs to one skeleton, and both to one set of shots.
    cited-paths.test.ts    Every rooted path a document names, against the tree it names into.
    constructs.test.ts     The construct register, against the files it says own each reading.
    libraries.test.ts      `libs/` reaching no layer, and naming nothing of this project.
  recorded-fight.ts        The recordings, read through the constant that spells their fields.
  fake-document.ts         A document small enough to read, for a panel handed one.
  userscript-entry.test.ts  Every layer at once, driven the way a browser drives them.
  source-line.ts           A line of TypeScript with its string literals taken out.
  style-sheet.ts           The panel's stylesheet read back, for the guards that read it.
  source-paths.ts          Every TypeScript file under the directories that hold one.
.agents/skills/verify/     How to drive the add-on in a browser and read what it drew.
.claude/settings.json      Denies the tool calls that would write to the maintainer's list.
```

Held by `tests/repository/documents.test.ts`, both ways: every file is described here, and every
name here exists.

## Target layout

```
libs/                     Knows nothing of this project. A primitive, and nothing it is for.
project/                  Knows this project, belongs to no layer. Reads `libs/` only.
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

**Dependencies point one way:** `ui → core`, `game → core`, entry point → everything, and every
layer → `libs`. `core` imports nothing but itself, `libs` and the standard library. **`libs` imports
no layer at all** — that is what "knows nothing of this project" means, and it is the whole of the
rule. **ADR 0020**, superseding the sentence that said a primitive lives beside its consumer: the
construct register was the mechanism standing in for a shared address, and three of its rows had
drifted before anybody read them.

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
| Which side is the reader's | `game/battle-session.ts`   | The one thing `core` cannot know.     |
| Where a fight happens      | `game/engine-place.ts`     | Off client state, never wrapped.      |
| What the panel says        | `ui/panel-words.ts`        | The only Polish in `src/`.            |
| Which screen it is on      | `ui/panel-screen.ts`       | And whose row stands open over it.    |

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
asserts, because the number is ours. Where the value read could itself have been the `null`, the
answer says whether it worked and the value sits behind it (**E10**, **ADR 0021**).

- `Number()`, `toFixed`, `String()` on a number — `libs/number-text.ts`. Every reading is refused
  before it is taken: digits are proved to be digits, then the result is proved to be a safe
  integer, so no figure downstream is a neighbour of the one the game stated.
  `src/core/protocol-number.ts` states the width `captures/` carries and delegates the arithmetic,
  so the row keeps one address.
- `parseInt`, `parseFloat`, unary `+` — **planned**, named at its first consumer.
- `JSON.parse` — `libs/json-text.ts`, inside `getJsonReading`. Its result is `unknown` and is walked
  with a predicate and `Array.isArray`; C13 forbids the cast that would skip that. Measured
  2026-08-30 it is spelled in one further place, inside browser script this repository emits as
  text, which the owner cannot reach.
- `JSON.stringify` — `libs/json-text.ts`, inside `composeJsonWriting`, for anything this project
  writes and reads back. Measured 2026-08-30, it is spelled in four further places, each writing for
  somebody else rather than for us: an HTTP body, twice into a value escaped into a tag, and once
  inside browser script this repository emits as text. Those are **not** covered by the owner and
  the register does not pretend otherwise. The same measurement found a fifth that **was** ours —
  the sidecar naming a set of pictures, which this repository reads back — and it moved to the owner
  rather than earning a line here.
- `Date.parse` — `tools/help-article.ts`, which is the one caller that dates a cached dump.
- `performance.now()` — **planned**, named at its first consumer.
- `typeof … === "object"`, which is `true` for `null` — `libs/unknown-reading.ts`, where the `null`
  case is a line of `isRecord` rather than a clause of the first.
- `JSON.parse` answering `null`, and `JSON.stringify` answering `undefined` — `libs/json-text.ts`,
  which is why neither direction answers with a value. **ADR 0021.**
- `localeCompare` — **nobody**, spelled nowhere. Bringing a collated order back means a caller
  first, then a reader, then a row here, in that order.

A row names an owner so a reading has one address. `tests/repository/constructs.test.ts` reads this
section and holds it both ways. **It binds where the program is** — `libs/`, `project/`, `src/` and
`tools/`, the scope **S5** measures — because a test spelling `Number()` to read a written figure
back is the test doing its job rather than the owner losing its address; the register asked that
question and this is the answer. An owner that owns nothing stops guarding, which is why a row is
added when its first consumer arrives and not before.

Measuring by hand on 2026-08-30 found three rows stale — `JSON.parse` named a file that had stopped
spelling it, and `JSON.stringify` and `Date.parse` both said "planned" while carrying consumers —
and writing the guard found a fourth: `tools/fight-figures.ts` put a cut's key back through `Number`
rather than through the owner, so a key that is not an id asked the roster about `NaN`.

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
deno lint          zero warnings — S10
deno check         types, at the strictness deno.json states
deno test          the tests, including every guard in AGENTS.md's register
deno task build    the file a reader installs, and the checks over its built text
```

The browser floor is checked over the **built bundle**, not the sources, because the bundle carries
standard-library code whose ES level is not ours to set.

## Known gaps

Where the tree does not yet meet what this file states. Each is migration work, updated in the same
commit that opens or closes one.

1. **The add-on reads a fight, draws it, and keeps it.** Every key in `captures/` is read, the panel
   switches screens, pressing a row on any of them opens the figure cut by the other end of each
   movement, by what it was announced with and by what it was made of, pressing one of **those**
   rows opens the pair and what passed between the two or the skill and whom it reached, a finished
   fight goes on a shelf that says when each was, how big, where and how it went — a press reads one
   back off what was kept of it, a pin keeps one out of the rotation's reach, and a strip says where
   the shelf itself is kept — the header and every row on that shelf say where the fight was fought,
   a ranking row wears its place, its profession's hue and a bar measured against the biggest figure
   on screen, hovering a ranking row opens the card that states all four of a combatant's figures
   with the screen's own in bold, the part of each the protocol named one end of, how they fought
   and what qualifies the lot — and hovering any other row opens the name its own cell had to cut,
   the bar says which build drew it and the host carries the same number for a screenshot to be read
   by, the panel folds to that bar and comes back folded, a press on `⭳` hands the reader the fight
   in one file — the calls in the shape intake reads and the figures they came to beside them, the
   panel carries the stylesheet `DESIGN.md` specifies and the strip that always states the screen's
   own total, and `deno task build` writes the file they install, `deno task preview` serves it over
   a recording and reloads it on a change under `src/`, `deno task preview:site` writes the same
   page down for somebody with no clone, `deno task screenshots` photographs it, and
   `deno task intake` redacts a recording and admits it to `captures/`. The header says how the
   fight went, the strip under the list totals the two sides and what belongs to neither, a doubt is
   said as a sentence under it, and the panel is moved by its bar and comes back where it was left.
   Which rows of all that open and which are the last is `docs/drill-levels.md`'s to say, measured
   rather than claimed here. The card that says what a combatant's figures are made of is written,
   and so is the run of it the screen decides: the criticals against the blows struck, the hardest
   blow, what fired beside one and what it destroyed on the other side, and on the screen about
   being struck what a defence stopped, cut by the defence (**ADR 0019**). Two proc keys reach no
   row — `-tenacity` and `+superspell-dispel`, whose end article view,372 does not settle — and they
   are decoded and charged to nobody until material does, though the player's own client names them
   and five others on the card (**ADR 0024**). Both READMEs are written and show the set
   `deno task screenshots` takes, so the release plumbing is whole and unrun — which is what the gap
   below it is about.

2. **Few rules are guarded.** `AGENTS.md`'s register names every guard that exists. **Every other
   rule in that file is held by reading alone.** The register is the list; enumerating the unheld
   rules here would be a second list going stale against the first.
3. **Some documents run past 100 columns.** `docs/protocol-keys.md`, `docs/captured-fights.md`,
   `docs/browser-support.md`, `docs/drill-levels.md` and the `verify` skill hold tables `deno fmt`
   aligns but never wraps. The line-length guard names them as excluded rather than skipping them
   quietly, and the counts are its to state rather than this file's (**V5**); rewrapping is a large
   diff, on carried material or on a generated register, and waits until each is next edited for its
   own reasons.
4. **A JavaScript construct past the floor still passes the gate.**
   `tests/tools/browser-support.test.ts` holds `docs/browser-support.md`'s CSS half against the one
   string the stylesheet is, holds both halves' rows to the files they name, and re-earns both tiers
   as the maximum over the rows under them. What it cannot do is notice a **new** construct: the
   sources are not enumerable the way the sheet is, and neither compiler option that would stand in
   works here — measured 2026-08-30, `deno check` ignores `target` in `deno.json` and says so, and
   narrowing `lib` to `es2022` still accepts `findLast`, which is ES2023. v1 pinned its sources with
   a `tsconfig.userscript.json`; a tsc of our own is a dependency, and **ADR 0001** is why this tree
   has one toolchain. The document says all of this at the section itself.
5. **Every key in `captures/` is read, and no recording is short.** `healall_per` was the last, and
   ADR 0010 carries how a share stated about a whole side is sized onto its members. Measured over
   `captures/` on 2026-08-29: 115 casts across 22 recordings, every one of them whole, and no
   message anywhere unread — so the doubt mark never fires on the material this repository holds. It
   is held by probes only, and the next protocol change is what it exists for.
6. **A payload can move health with no message stating it.** Every comparison between the health the
   protocol states about a combatant and the movement decoded from its own messages agrees inside
   the reading's tolerance, bar three kinds: a killing blow landing more than the health that was
   left, health restored by a share the decoder states without an amount, and **one payload that
   moves health with nothing saying so** — entry 83 of `2026-08-06-tempest-grupa-vs-hildur`, where
   the boss loses 8,062 of a 325,584 pool while both messages of that payload are about other
   people. Nothing in the protocol accounts for it and only the snapshots show it, which is what the
   snapshots are for. `tests/core/health-witness.test.ts` is where the counts are, and it pins the
   last of the three at one so a second cannot arrive unnoticed. The figures stood here too until
   2026-08-30, in a second reckoning that counted the first two kinds as disagreements where the
   test does not — two numbers for one measurement, which **V5** is the rule against.
7. **No release has been cut on this branch.** `CHANGELOG.md` is written, carried from v1 and opened
   with what the rewrite changed for a player; `tools/changelog.ts` composes the body of a release
   out of it, `.github/workflows/check.yml` is the run **G7** waits for, and
   `.github/workflows/release.yml` publishes one. **None of it has run here.** The release path is
   held by its tests alone. What is written since is the front page: both READMEs, against a set of
   pictures shot at the commit that drew them, and `tests/repository/readmes.test.ts` holding the
   three to each other.
8. **A restatement in different words is unheld, and it is the worse kind.**
   `tests/repository/sources.test.ts` holds two bands of C15's second half now: a block standing
   twice **verbatim**, and a block standing in two **files** whatever its length — the second added
   after measuring found a bound on a fight's headcount word for word in three files and a tool's
   docblock in two, none of which the first band could see. What neither band reaches is a passage
   said again in **different words**, which is the band that costs most: two copies that read
   differently drift without ever looking like copies.

   **It is a large finding rather than a small one.** Measured over the comment blocks in `libs/`,
   `project/`, `src/` and `tools/` on 2026-08-30, sixty-eight pairs of blocks shared a run of eight
   words or more, and twenty-three do after six passes. Every pair left shares two runs or fewer,
   where the heaviest shared twenty-four: below that a shared run is as likely to be one phrase the
   domain gives both blocks as a copy, which is where a reader that finds too much begins. The ones
   read by hand were real, and half of them turned out to be pairs of sibling one-liners rather than
   passages: the same explanation of why a pin on an unwritten fight would be a control that does
   nothing, in `ui/panel-reading.ts` and in the entry; the two error bases each spelling out that no
   base is ever thrown, which **E2** owns. Each is editorial work — which copy survives, and whether
   the second should cite instead — so the band closes a few at a time rather than in one round.
