# Architecture

Three layers of claim live in this file and they are kept apart on purpose:

- **Current** — what the tree holds at this commit. Checkable by opening it.
- **Target** — contracts a change must satisfy. Constraints, **not** evidence that anything already
  works.
- **Known gaps** — where the two differ, listed at the end.

`AGENTS.md`'s **Target is not proof** binds here in full.

## Current state

**This is a rewrite in progress.** At this commit the repository holds documents, evidence,
generated registers and the lower half of `core/`: the error base, the message grammar, the roster,
the data contract, seven decoder steps — the damage family, the keys that move health outside a
blow, the announcements the client glues to the message after them, damage and healing stated
against a name, the declarations no total counts, and how the fight ended — and the health
arithmetic, and the statistics over what the decoder produces. Nothing reads the game yet and
nothing is drawn. The v1 implementation remains readable in this repository's history on `develop`
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
LICENSE            MIT — covers what was written here, and nothing else.
TODO.md            The maintainer's list, by hand. Never written to by a tool.
deno.json          Tasks, formatter, linter, strictness, the `@/` alias.
deno.lock          What the gate is actually run against. A package the lock does not name is
                   ambient type information CI will not have.
.gitignore         What never enters git, including the cache.
.github/
  workflows/
    pages.yml      The preview published, on a push to `main`, once the gate is green.
    release.yml    What a tag turns into: the built file, and the notes its section carries.

src/
  build-version.ts     Which build this is. The one constant a build writes over — ADR 0012.
  userscript-boot.ts   What runs when the browser loads the built file, and the one cast.
  userscript-entry.ts  Where the layers meet: the game found, the payloads read, the panel drawn.
  core/
    battle-event.ts      The data contract: what the decoder produces, and nothing else.
    combatant-health.ts  Health read from a stated share, and how far off it can be.
    combatant-roster.ts  Who is in the fight, and which names resolve to one of them.
    fight-decoder.ts     What a key means. One key of the corpus is still named unread.
    game-build.ts        The build id the client states in its bundle's own filename.
    fight-statistics.ts  The figures a panel draws, with what nobody can be charged apart.
    margometer-error.ts  The abstract brand every failure that ships to the browser wears.
    protocol-message.ts  One message's grammar: both ends, then its parameters.
    protocol-number.ts   The numbers the protocol states, read out of its text.
    unknown-reading.ts   Reading a value nobody typed, answering null rather than throwing.
  game/
    battle-session.ts    One fight, accumulated payload by payload, in the order they arrive.
    browser-store.ts     The store a browser lends, wrapped so a refusal is an answer.
    engine-attachment.ts   Getting the wrap onto the game, and off again.
    engine-battle-wrap.ts  The one function here that changes the running game.
    engine-place.ts      Where a fight happened, asked of the client's own state.
    fight-capture.ts     The fight as it happened, in the shape a recording is admitted in.
    kept-fights.ts       The fights a reader can go back to: inputs kept, figures never.
    fight-report.ts      The figures as text a reader can paste, with what qualifies them.
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
tools/             Never ships. Each arrives with the question it answers.
  build-userscript.ts  The file a reader installs, the version written in, and two checks.
  capture-intake.ts    How a recording becomes material: two redactions, then a file.
  recorded-fights.ts   The recordings as a tool reads them: a name, and the calls made.
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
  game/
    battle-session.test.ts    Every recording replayed the way the game delivered it.
    browser-store.test.ts     A store that answers, and a browser that will not lend one.
    engine-attachment.test.ts   A page with a game, without one, or with a reader on it.
    engine-battle-wrap.test.ts  The promise the add-on makes to the page.
    engine-place.test.ts      A page that says all of it, some of it, or nothing.
    fight-capture.test.ts     The envelope, against the newest recording admitted.
    kept-fights.test.ts       A shelf that answers, refuses, or holds what nobody wrote.
    engine-warrior.test.ts    A payload's warriors, against the snapshots beside them.
  core/                    A test sits where its subject sits.
    battle-event.test.ts      Every variant the union holds, against what arrives.
    combatant-health.test.ts  The arithmetic, against the client's own three figures.
    combatant-roster.test.ts  Two of a name, one of nobody, and every recording.
    fight-decoder.test.ts     The blows, and what is left unread beside them.
    game-build.test.ts        Both names the client serves, and what is not one of them.
    health-witness.test.ts    What was read, against what the protocol says of itself.
    fight-statistics.test.ts  The figures, and the balance every point of damage keeps.
    protocol-message.test.ts  The grammar, over every message the recordings carry.
    unknown-reading.test.ts   What counts as a shape worth reading, list and null included.
  tools/
    browser-support.test.ts   Every construct the sheet spells, against the register, both ways.
    build-userscript.test.ts  The built file, read back: the banner, and no way out.
    capture-intake.test.ts    What intake refuses, and every admitted recording as a fixed point.
    recorded-fights.test.ts   The directory read, and the claim a rewind by replay stands on.
    preview-page.test.ts      The page, read back: the order of its scripts, and its escaping.
    preview-server.test.ts    Every route, against a bundle handed in rather than built.
    preview-site.test.ts      A page per recording, addressed relatively and asking nothing.
    panel-screenshots.test.ts The set against its sidecar, and the frame a report sizes.
    game-client-source.test.ts  Both names a world serves, and git asked about the cache.
    protocol-key-table.test.ts  The switch in either spelling, and the material against it.
    help-article.test.ts      A page turned into text, and a dump that says how old it is.
    changelog.test.ts         A section against its neighbours, and the release that has none.
  ui/
    panel-card.test.ts        Every figure a card states, and the parts it draws under them.
    panel-drag.test.ts        A panel kept on the screen, and put back where it was left.
    panel-element.test.ts     What the panel puts on a page, read back out of it.
    panel-look.test.ts        Contrast by arithmetic, and a sheet that spends tokens only.
    panel-reading.test.ts     A screen of a real fight, through every layer under it.
    panel-screen.test.ts      The screens there are, against what a reading composes for.
    panel-tip.test.ts         What the window draws, how tall it says it is, and what it drops.
    panel-words.test.ts       What the words must never say, and how Polish counts.
  repository/              Guards whose subject is this repository, not a layer of it.
    documents.test.ts      The rule documents and the guard register.
    decisions.test.ts      The decision records: numbering, index, lifecycle.
    sources.test.ts        S1, S2, C5, C15, C16, S4 and S5 over every TypeScript file.
    errors.test.ts         The error hierarchy, each reader proved on a sample first.
    names.test.ts          File names, exported functions and exported types.
    protocol-keys.test.ts  The register help claims, re-counted against the frozen table.
  recorded-fight.ts        The recordings, and where their Polish field names stop.
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
asserts, because the number is ours.

- `Number()`, `toFixed`, `String()` on a number — `src/core/protocol-number.ts`. Every reading is
  refused before it is taken: digits are proved to be digits, then the result is proved to be a safe
  integer, so no figure downstream is a neighbour of the one the game stated.
- `parseInt`, `parseFloat`, unary `+` — **planned**, named at its first consumer.
- `JSON.parse` — `tests/recorded-fight.ts`, the one reader of a recording. Its result is `unknown`
  and is walked with a predicate and `Array.isArray`; C13 forbids the cast that would skip that.
- `JSON.stringify` — **planned**, named at its first consumer.
- `Date.parse` — **planned**, named at its first consumer.
- `performance.now()` — **planned**, named at its first consumer.
- `typeof … === "object"`, which is `true` for `null` — `src/core/unknown-reading.ts`, where the
  `null` case is a line of `isRecord` rather than a clause of the first.
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
   a ranking row wears its place, its profession's badge and a bar measured against the biggest
   figure on screen, hovering a ranking row opens the card that states all four of a combatant's
   figures with the screen's own in bold, the part of each the protocol named one end of, how they
   fought and what qualifies the lot — and hovering any other row opens the name its own cell had to
   cut, the bar says which build drew it and the host carries the same number for a screenshot to be
   read by, the panel folds to that bar and comes back folded, a press on `{ }` hands the reader the
   fight as a recording in the shape intake reads, a press on the copy control hands them the
   figures as text, the panel carries the stylesheet `DESIGN.md` specifies and the strip that always
   states the screen's own total, and `deno task build` writes the file they install,
   `deno task preview` serves it over a recording and reloads it on a change under `src/`,
   `deno task preview:site` writes the same page down for somebody with no clone,
   `deno task screenshots` photographs it, and `deno task intake` redacts a recording and admits it
   to `captures/`. the header says how the fight went, the strip under the list totals the two sides
   and what belongs to neither, a doubt is said as a sentence under it, and the panel is moved by
   its bar and comes back where it was left. What is not written: **the third level of the drill**,
   which is v1's cut by skill. The card that says what a combatant's figures are made of is written;
   what it cannot say is v1's four extras — critical hits, the largest blow, the effects a blow
   fired and the statistics an attacker destroyed — because `core/` carries each of them on the
   events it produces — `+crit` among `PROC_KEYS`, the destroyed statistics on their own field, and
   every blow's own figures — and `fight-statistics.ts` aggregates none of the four. The rest of the
   tools and the release plumbing — `README.md` and the `check` workflow — are unwritten, and
   nothing yet consumes the photographs `.github/workflows/pages.yml` does not publish.

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
5. **The carried documents run past 100 columns.** `docs/protocol-keys.md` (7 lines),
   `docs/captured-fights.md` (60), `docs/browser-support.md` (5) and the `verify` skill (16) hold
   tables `deno fmt` aligns but never wraps. The line-length guard names them as excluded rather
   than skipping them quietly; rewrapping is a large diff on material this tree carries rather than
   authors, and waits until each document is next edited for its own reasons.
6. **Half of `docs/browser-support.md` is held and half is not.** Its CSS register is guarded by
   `tests/tools/browser-support.test.ts`, which enumerates what `composeStyleSheet()` spells and
   holds the document to it in both directions. Its **JavaScript** floor is the unheld half: the
   document describes one checked over sources, and the ES level that matters is the bundle's once
   the bundle carries standard-library code. `tsconfig.userscript.json` holds our own sources and
   nothing else, and the bundle-level guard has not landed.
7. **A ranking row states a profession in its hue alone.** The eight hues are assigned by the game's
   own letter and are stable across fights, but six professions cannot be made mutually
   distinguishable by hue on the panel's background — `DESIGN.md` measures that. The row carried the
   letter as a second channel until 2026-08-29 and no longer does, so a reader who cannot separate
   two hues cannot tell those two professions apart at all. Nothing replaces it yet.
8. **There is no drill register.** Every level v1 drew is drawn — a ranking, a row opened onto its
   three cuts, a pair opened onto what passed between the two, and a skill opened onto whom it
   reached — but nothing enumerates which rows open and which do not, the way v1's
   `docs/drill-levels.md` did from a tool that measured it both ways. That document is readable at
   `git show develop:docs/drill-levels.md`; the register here returns **generated**, not carried,
   when there is a tool to generate it from.
9. **Two commands in the `verify` skill still name v1.** `.agents/skills/verify/SKILL.md` carries
   the procedural knowledge for driving the add-on in a browser and reading what the panel drew, and
   its preview, screenshot and selector halves were corrected against this tree on 2026-08-29. What
   is left naming modules that do not exist here is `tools/fight-dump-parser.ts` and
   `tools/fight-report.ts`. Corrected module by module as each lands.
10. **A function declaration whose arrow sits on the next line is not counted.** `isFunctionOpener`
    in `tests/repository/sources.test.ts` reads a declaration from one line, so a named arrow
    wrapped across two is invisible to S4 and S5. The limit is pinned by a test rather than left to
    be discovered, and closes when a file in this tree is written that way.
11. **Every key in `captures/` is read, and no recording is short.** `healall_per` was the last, and
    ADR 0010 carries how a share stated about a whole side is sized onto its members. Measured over
    `captures/` on 2026-08-29: 115 casts across 22 recordings, every one of them whole, and no
    message anywhere unread — so the doubt mark never fires on the material this repository holds.
    It is held by probes only, and the next protocol change is what it exists for.
12. **A payload can move health with no message stating it.** Measured over `captures/`, 2026-08-28:
    of 17,958 comparisons between the health the protocol states about a combatant and the movement
    decoded from its own messages, 17,286 agree inside the reading's tolerance. Of the 672 that do
    not, 95 are a killing blow landing more than the health that was left, 576 are health restored
    by `healall_per`, which is unread, and **one is a payload that moves health with nothing saying
    so** — entry 83 of `2026-08-06-tempest-grupa-vs-hildur`, where the boss loses 8,062 of a 325,584
    pool while both messages of that payload are about other people. Nothing in the protocol
    accounts for it and only the snapshots show it, which is what the snapshots are for.
    `tests/core/health-witness.test.ts` pins the count at one, so a second cannot arrive unnoticed.
13. **The recursion guard misreads a one-line named arrow.** `getFunctionBodies` in
    `tests/repository/sources.test.ts` collects lines until the brace depth returns to zero, and a
    `const name = () => expression;` opens no brace — so every line after it is read as that
    function's body, and a later call to it reads as a call to itself. Found by writing one in
    `tests/userscript-entry.test.ts`, which now carries a block body and a comment saying why. A
    false positive is worse than a blind spot, so this is the next thing that guard should learn;
    gap 10 is the other half of the same reader.
14. **No release has been cut on this branch.** `CHANGELOG.md` is written, carried from v1 and
    opened with what the rewrite changed for a player; `tools/changelog.ts` composes the body of a
    release out of it, and `.github/workflows/release.yml` publishes one. **None of it has run
    here.** `README.md`, the `check` workflow and the screenshots are unwritten, so **G7**'s wait
    for a green `check` run has no run of its own, and the release path is held by its tests alone.
15. **Nothing says which side is the reader's.** `PanelRow.side` carries the game's own team number
    and nothing turns it into `ours` or `theirs`: that needs `Engine.hero.d.id` read against
    `warriorsList`, which `game/` has not done. The two tokens `DESIGN.md` states for it are unspent
    — a ranking row is coloured by profession instead, which needs no side. Whatever spends them
    will need a carrier that is not colour, so the two halves open together.
16. **A restatement in different words is unheld, and it is the worse kind.**
    `tests/repository/sources.test.ts` holds C15's second half by comparing block text, so a comment
    repeated word for word is a finding and one reworded is not — which is backwards from the cost,
    since two copies that read differently drift without ever looking like copies. Found by reading
    both sides: `src/ui/panel-look.ts` and `DESIGN.md` had disagreed for one release about whether a
    hue says **who** somebody is or **what** they are, and three comments named three tab strips
    over a panel that draws two. **ADR 0016.** C14 is unheld for the same reason and has no guard
    shape yet; the one that would hold it counts declarations carrying a docblock, which needs a
    parser this tree does not have.
