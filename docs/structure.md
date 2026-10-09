# Structure

The tree, one row per file, and one per directory under `tests/`, `captures/` and `screenshots/`.
What a file is for is its own docblock's to say (**C4**); a row here is the way to it, and a file
joins it in the commit that creates the file. The rules every change binds to are `AGENTS.md`'s, and
this map stands apart from them because a session reads the rules every time and the map only when a
file comes or goes (ADR 0010).

| Path                   | For                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `.gitignore`           | what git never carries: the built userscript, client sources, npm's installs, fabricated fights |
| `AGENTS.md`            | the rules every change binds to, and the register of the guards that hold them                  |
| `CHANGELOG.md`         | what a reader is told changed, release by release, in Polish                                    |
| `CLAUDE.md`            | points Claude Code at `AGENTS.md`                                                               |
| `CONTEXT.md`           | the canonical domain terms, and the spellings each one forbids                                  |
| `DESIGN.md`            | the panel's look: its tokens and the rules they satisfy                                         |
| `LICENSE`              | the MIT licence covering what was written here                                                  |
| `NOTICE.md`            | what in this repository and its published page is somebody else's, and on what basis            |
| `PRODUCT.md`           | what the add-on is for, and what it never does                                                  |
| `README.en.md`         | the English front page: what the add-on is, how it looks, how to install it                     |
| `README.md`            | the Polish front page, the counterpart of `README.en.md`                                        |
| `SECURITY.md`          | the boundaries on the game client, the network, stored data and captured material               |
| `TODO.md`              | the maintainer's hand-kept list; no tool writes it                                              |
| `deno.json`            | the released version, the tasks (`check` is the gate), formatter, lint and compiler settings    |
| `deno.lock`            | the lock of the Deno packages the tree imports                                                  |
| `package-lock.json`    | the lock of the npm packages the browser suite installs                                         |
| `package.json`         | npm's manifest for the browser suite alone: Playwright and its one task                         |
| `playwright.config.ts` | the browser suite's settings: where it looks, which engine it drives, what it leaves            |

| Path                                      | For                                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `.agents/skills/audit/SKILL.md`           | the skill for auditing the whole tree at one commit, split by layer and verified          |
| `.agents/skills/commit/SKILL.md`          | the skill for making a commit: the process, and the checklist of what must hold before it |
| `.agents/skills/fix/SKILL.md`             | the skill for fixing the add-on from a fight file a player saved: replay, reproduce, hold |
| `.agents/skills/gate/SKILL.md`            | the skill for running the gate and turning a red one into a fix                           |
| `.agents/skills/intake/SKILL.md`          | the skill for taking a recording into `captures/` and what follows it                     |
| `.agents/skills/mutate/SKILL.md`          | the skill for proving a test can fail, and reporting one that cannot                      |
| `.agents/skills/readings/SKILL.md`        | the skill for starting a round on current readings of the game, and keeping them so       |
| `.agents/skills/record-decision/SKILL.md` | the skill for writing a decision record under `docs/adr/`                                 |
| `.agents/skills/release/SKILL.md`         | the skill for a release run from a session: pushes handed over, states read back          |
| `.agents/skills/review/SKILL.md`          | the skill for reviewing a change: the checklist, the levels, the one format               |
| `.agents/skills/verify/SKILL.md`          | the skill for running the built userscript over a recording in a real browser             |
| `.agents/skills/write-document/SKILL.md`  | the skill for writing a Markdown document in this tree                                    |

| Path                    | For                                                                               |
| ----------------------- | --------------------------------------------------------------------------------- |
| `.claude/settings.json` | Claude Code's permissions and hooks, holding what the guard register says of them |
| `.claude/skills`        | a link to `.agents/skills/`, through which Claude Code finds the skills           |

| Path                            | For                                                                      |
| ------------------------------- | ------------------------------------------------------------------------ |
| `.github/workflows/check.yml`   | the gate on every push and pull request: `deno task check`               |
| `.github/workflows/pages.yml`   | publishes the preview page to GitHub Pages from `main`, after the gate   |
| `.github/workflows/release.yml` | turns a tag into a release carrying the userscript and its metadata file |

| Path                      | For                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `docs/auras-standing.md`  | what one skill stood on a side, whom a shout held, how long either stood, over `captures/`   |
| `docs/browser-support.md` | the browser floor the shipped userscript needs, measured off the tree                        |
| `docs/captured-fights.md` | what each recording in `captures/` holds: who fought, where, and how much protocol           |
| `docs/design.md`          | the architecture: layers, ports, types, the process, the failure map, the file format        |
| `docs/drill-levels.md`    | every kind of row the panel draws, and whether pressing it opens anything                    |
| `docs/names.md`           | every name the tree spells, by what declares it and where, written by `deno task names`      |
| `docs/protocol-keys.md`   | every protocol key looked into: its verdict, its shape over the recordings, and the evidence |
| `docs/reading-a-turn.md`  | how a message becomes a turn, and every message where that and the game's numbering disagree |
| `docs/releasing.md`       | every step of cutting a release, in order                                                    |
| `docs/structure.md`       | this map of the tree, one row per file                                                       |
| `docs/turns-taken.md`     | the turns each combatant took, graded recording by recording against the game's numbering    |

| Path                                                                                                   | For                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/adr/0001-a-vocabulary-is-an-object.md`                                                           | a closed set of our own strings is an object, its list the object's values                                                                                      |
| `docs/adr/0002-a-sibling-is-imported-by-dot-and-the-rest-from-the-root.md`                             | a sibling is imported by `./`, everything else from the root by `#/`                                                                                            |
| `docs/adr/0003-a-module-reads-top-down-in-tigerbeetles-order.md`                                       | a module reads top-down: imports, types, constants, then functions, entry first                                                                                 |
| `docs/adr/0004-the-frozen-readings-are-develops-at-the-revision.md`                                    | superseded by ADR 0005: `frozen/` pinned to `develop`'s readings                                                                                                |
| `docs/adr/0005-the-readings-are-refreshed-here.md`                                                     | the readings of the game in `frozen/` are refreshed by this tree's own tools                                                                                    |
| `docs/adr/0006-an-if-that-does-not-leave-has-an-else.md`                                               | an `if` that does not leave has an `else`, and a guard is exempt                                                                                                |
| `docs/adr/0007-the-protocol-key-register-is-carried-and-a-help-freeze-counts-what-it-cites.md`         | `develop`'s key register carried, and the help counts taken from its claims                                                                                     |
| `docs/adr/0008-a-failure-is-an-error-returned-beside-the-value.md`                                     | a failure is an `Error` class returned beside the value, and `attempt` the one catch                                                                            |
| `docs/adr/0009-a-failure-is-named-for-what-failed-and-how.md`                                          | a failure class is a subject and its state, never `…Error`, and `attempt` keeps its name                                                                        |
| `docs/adr/0010-the-structure-is-a-document-of-its-own.md`                                              | the map of the tree stands in a document of its own, out of the rules every session reads                                                                       |
| `docs/adr/0011-a-reading-is-re-dated-only-when-its-content-moves.md`                                   | a frozen reading carries the first fetch that gave its content, and experimental is previewed                                                                   |
| `docs/adr/0012-damage-dealt-and-taken-count-what-an-absorption-pool-took.md`                           | damage dealt and taken are health plus what an absorption pool took, and a block stays apart                                                                    |
| `docs/adr/0013-a-reader-chooses-the-type-size-and-the-size-of-each-window.md`                          | a reader picks one of three measured type steps and sizes each window by its corner                                                                             |
| `docs/adr/0014-the-fight-line-holds-the-place-and-a-card-says-which-fight-it-was.md`                   | the place joins the fight's line and gives way first, and a card says which fight it was                                                                        |
| `docs/adr/0015-each-question-in-the-options-stands-under-a-heading-in-the-shape-its-answers-need.md`   | each question in the options stands under a heading, its answers in the shape they need                                                                         |
| `docs/adr/0016-the-end-an-opened-figure-left-out-opens-onto-that-persons-keys.md`                      | the end an opened figure left out opens onto that person's own keys                                                                                             |
| `docs/adr/0017-the-middle-type-step-is-what-a-reader-who-chose-none-reads.md`                          | a reader who chose no type step reads the middle one, 12px                                                                                                      |
| `docs/adr/0018-a-function-called-from-one-place-is-written-in-its-caller-unless-it-is-pure.md`         | a function called once is a block in its caller unless its verb is strong, and length ends none                                                                 |
| `docs/adr/0019-each-events-entry-is-the-name-the-design-gives-it.md`                                   | each event's entry is the name its heading in the design gives it, and the card is one                                                                          |
| `docs/adr/0020-a-module-one-module-of-its-layer-imports-is-written-in-it.md`                           | a module one sibling imports is written in it, and the page's time is one file                                                                                  |
| `docs/adr/0021-a-record-is-born-whole-and-a-fixed-choice-is-a-table.md`                                | a record has every field from its literal, a fixed choice is a lookup, and `any` and `@ts-` go with the cast                                                    |
| `docs/adr/0022-a-body-nests-five-blocks-deep-and-a-function-that-would-nest-past-it-stays-one.md`      | a body nests five blocks deep, and a function written in its caller past that stays one                                                                         |
| `docs/adr/0023-a-name-says-whether-a-thing-is-the-games-the-browsers-or-ours.md`                       | a name says whether a thing is the game's, the browser's or ours, and "reading" names one thing                                                                 |
| `docs/adr/0024-the-dom-names-the-meter-and-the-helper-and-develops-sheet-is-read-in-those-names.md`    | the DOM names the meter and the helper, and develop's sheet is compared in those names                                                                          |
| `docs/adr/0025-a-field-names-what-it-holds-and-the-fight-file-keeps-its-keys-through-a-map.md`         | a field names what it holds, the fight file keeps its keys through a map, and ours is a card                                                                    |
| `docs/adr/0026-a-name-says-margonem-and-the-way-it-is-reached.md`                                      | a name says Margonem and the way in: `MargonemEngine…`, `MargonemClient…`, `Margonem…`                                                                          |
| `docs/adr/0027-a-name-says-what-it-holds-and-a-function-what-it-acts-on.md`                            | a function says what it acts on, and a value what it is, never a placeholder                                                                                    |
| `docs/adr/0028-a-storage-key-names-the-window-it-keeps.md`                                             | a storage key is `MargoMeter-` and its setting's word, the meter's and the helper's named                                                                       |
| `docs/adr/0029-the-legendary-bonuses-stand-in-a-run-of-their-own-on-the-card.md`                       | the legendary bonuses are counted on their holder and read in a run of their own on the card                                                                    |
| `docs/adr/0030-every-legendary-bonus-is-named-in-our-words-from-the-published-help.md`                 | every legendary bonus is named by the published help, and the client is asked about none                                                                        |
| `docs/adr/0031-somebody-elses-legendary-bonuses-stand-on-the-card-of-whoever-they-reached.md`          | somebody else's bonuses stand on the card of whoever they reached, under whose they were                                                                        |
| `docs/adr/0032-the-card-counts-the-legendary-bonuses-that-reached-its-combatant-and-names-no-giver.md` | the card counts the bonuses that reached its combatant, and names no giver                                                                                      |
| `docs/adr/0033-a-card-too-tall-for-the-window-stands-in-two-columns.md`                                | a card too tall for the window stands in two columns before it gives up a run                                                                                   |
| `docs/adr/0034-every-row-under-an-end-left-out-says-so-at-every-level.md`                              | every row under an end the game left out says so at every level, with its kinds where they are kept                                                             |
| `docs/adr/0035-a-fights-totals-hold-only-what-is-summed.md`                                            | a fight's totals hold only the figures that are summed, and the file stays version 4                                                                            |
| `docs/adr/0036-the-caveat-letter-is-drawn-and-every-bar-control-is-one-box.md`                         | the caveat letter is drawn as a dot over a stem, and every bar control is one box with its mark centred                                                         |
| `docs/adr/0037-a-browser-api-this-program-calls-is-a-boundary.md`                                      | a browser API the add-on calls is a seventh boundary, and a tool's file system is one of its boundaries                                                         |
| `docs/adr/0038-a-fighter-s-tooltip-leaves-the-charge-to-the-game.md`                                   | a fighter's tooltip leaves the charge to the game's own section, and Pomocnik keeps its own                                                                     |
| `docs/adr/0039-a-tooltip-row-is-written-as-the-game-writes-its-own.md`                                 | a tooltip row is a label, a colon and its value, heals as `1/3` and turns left as `(2 tury)`, as the game writes its own                                        |
| `docs/adr/0040-pomocnik-says-the-turns-a-length-has-left.md`                                           | every length Pomocnik draws is the turns it has left with their noun, and the charge's dots stay                                                                |
| `docs/adr/0041-an-ended-charge-draws-no-length.md`                                                     | a charge broken or struck draws no length on its row or its card, and one still charging keeps its turns left                                                   |
| `docs/adr/0042-e10-guards-the-handovers-of-what-the-bundle-carries.md`                                 | E10 binds the bundle's handovers, which its guard reads; a page `tools/` writes is said by the browser                                                          |
| `docs/adr/0043-a-heal-of-its-own-announcer-hands-the-announcement-on.md`                               | a message that only heals its announcer hands the announcement on, so the blow after it opens no turn                                                           |
| `docs/adr/0044-assertion-density-is-held-where-it-stands-and-only-rises.md`                            | each directory S5 names holds the assertion density it stood at, to a tenth, and it only rises                                                                  |
| `docs/adr/0045-a-pools-part-stands-under-the-elements-it-could-take-from.md`                           | a pool's part stands under the one element it could take from, or under all of them as one or another                                                           |
| `docs/adr/0046-a-shelf-row-says-how-a-fight-went-in-a-letter-and-keeps-a-fight-it-cannot-read.md`      | a shelf row ends in the outcome's letter in the ink of the side that took it, and a fight it cannot read stays a row that opens nothing                         |
| `docs/adr/0047-a-development-build-installs-beside-the-release-under-a-name-of-its-own.md`             | the preview server's build installs as `MargoMeter Dev` beside the release, dated to the minute it was built, and polled where it was installed                 |
| `docs/adr/0048-every-cell-a-bar-reaches-is-in-the-plain-ink.md`                                        | a ranking row's rank, turn mark and share are in the plain ink over its bar, the signal marks on a ground of their own, and no word is drawn through an opacity |
| `docs/adr/0049-an-attempt-is-as-pure-as-the-call-it-is-handed.md`                                      | `attempt` is either, as `read` is, and the purity guard follows a call through a module imported whole                                                          |
| `docs/adr/0050-a-development-build-is-dated-to-the-second.md`                                          | the preview server's build is dated to the second, so two edits saved in one minute are both offered                                                            |
| `docs/adr/0051-a-get-works-nothing-out-and-a-figure-worked-out-is-calculated.md`                       | `calculate` joins N2 for a figure worked out, and a guard keeps arithmetic out of `get`                                                                         |

| Path                        | For                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `frozen/AGENTS.md`          | the rules for the dated readings of the game: written by tooling, never by hand            |
| `frozen/aura-turns.ts`      | the skills reaching more than one combatant, and the turns the published table gives each  |
| `frozen/blows-granted.ts`   | the skills the published table grants an extra attack, and the fewest granted at any level |
| `frozen/help-phrases.ts`    | counts of phrases in one article of the published help                                     |
| `frozen/protocol-keys.ts`   | every protocol key the game client branches on, with the build id                          |
| `frozen/skill-durations.ts` | skill ids, effect keys and the turns the published table states for each                   |
| `frozen/status-bits.ts`     | the statuses a combatant's `buffs` mask is read by, in bit order, with the build id        |

| Path                    | For                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `libs/html-text.ts`     | markup read as the words a person would have seen in it, by walking the text           |
| `libs/json-text.ts`     | JSON text read into a value and a value written back, each answering whether it worked |
| `libs/number-range.ts`  | a number held between two ends, where the bottom wins when the ends cross              |
| `libs/number-text.ts`   | numbers read out of text by walking it, and written back into it                       |
| `libs/errors.ts`        | the one broad catch, `attempt`, and `Caught`, the failure it answers                   |
| `libs/text-walk.ts`     | walking text one character at a time against a caller's predicate                      |
| `libs/unknown-value.ts` | reading a value nobody typed, one field at a time, naming our field on failure         |
| `libs/vocabulary.ts`    | the vocabulary type, and the check of a string arriving from outside against one       |

| Path                       | For                                                                               |
| -------------------------- | --------------------------------------------------------------------------------- |
| `project/browser-lib.json` | compiler settings that type-check the bundle as a browser program, not a Deno one |
| `project/browser-lib.lock` | the lock kept apart for that browser type-check                                   |

| Path                      | For                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `src/build-version.ts`    | the version the panel and a file state; the build writes over it                             |
| `src/userscript-boot.ts`  | the script the userscript runs: the page's window handed to the entry as it was found        |
| `src/userscript-entry.ts` | the add-on standing up: the window read into ports, the tables composed, the runtime started |

| Path                             | For                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/core/aura-standing.ts`      | what one skill put on more than one combatant, how far through it is, and whom a shout holds |
| `src/core/battle-event.ts`       | `BattleEvent`, the data contract the decoder produces and everything above it reads          |
| `src/core/carried-figure.ts`     | what a status a combatant carries comes to, where anything may be said of it                 |
| `src/core/carried-status.ts`     | what each combatant is carrying now, and for how many of their own turns                     |
| `src/core/charged-skill.ts`      | the charged skill a combatant is making ready, and what became of it                         |
| `src/core/combatant-health.ts`   | health read out of the stated share, and side-wide casts sized onto each combatant           |
| `src/core/combatant-roster.ts`   | who is in the fight, matching a combatant the protocol names to the one it means             |
| `src/core/fight-decoder.ts`      | a message's grammar, then what happened; a key with no meaning yet leaves the message unread |
| `src/core/fight-figures.ts`      | the figures of one fight, tallied from its view and verified in one place                    |
| `src/core/fight-session.ts`      | one fight accumulated payload by payload, prepared then committed whole                      |
| `src/core/fight-statistics.ts`   | the figures a panel draws, raw and applied and unattributed kept apart                       |
| `src/core/legendary-standing.ts` | the two legendary bonuses a fighter's tooltip can state: the running one and the spent one   |
| `src/core/protocol-key.ts`       | what a protocol key means: the one owner of it                                               |
| `src/core/protocol-number.ts`    | the numbers the protocol states, in the shapes it states them in                             |
| `src/core/turn-clock.ts`         | whose turn an event opens, the one clock every figure and status counts turns on             |

| Path                                      | For                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/ports/browser-store.ts`              | the store a browser lends, wrapped so a refusal is an answer                               |
| `src/ports/margonem-engine-battle.ts`     | the running fight on the page, and the wrap of the engine's `updateData`                   |
| `src/ports/margonem-engine-hero.ts`       | which combatant is the reader, read off the game client's own state as its hero's id       |
| `src/ports/margonem-engine-place.ts`      | where a fight is happening, read off the game client's own state                           |
| `src/ports/margonem-engine-tooltip.ts`    | our rows appended to the tooltip the game client shows for a fighter                       |
| `src/ports/fight-capture.ts`              | the fight as it happened, thinned as it is collected, kept for a recording                 |
| `src/ports/fight-place.ts`                | where a fight was fought: the map's name and the reader's square on it                     |
| `src/ports/margonem-client-build.ts`      | the build id read out of the client bundle's file name                                     |
| `src/ports/margonem-client-dictionary.ts` | asking the running game client what the reader's own copy calls something                  |
| `src/ports/browser-time.ts`               | the page's clock, animation frame and repeating timer, each step guarded at the handover   |
| `src/ports/browser-console.ts`            | the page's console: one branded line per kind of failure                                   |
| `src/ports/browser-file.ts`               | hands a file to the browser's downloads, through a blob and an object URL                  |
| `src/ports/margonem-value.ts`             | a value asked of the game that came back empty, shown as unknown                           |
| `src/ports/browser-surroundings.ts`       | what a recording states about where it was taken: the world and the browser                |
| `src/ports/payload-envelope.ts`           | one engine call read into a `PayloadRecord`, its warrior entries with each mask and charge |
| `src/ports/margonem-engine-warriors.ts`   | the combatants the running fight holds, copied for a recording                             |

| Path                                | For                                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/runtime/carried-tooltip.ts`    | the add-on's rows onto every fighter tooltip, gathered from the readers that know them          |
| `src/runtime/defect-ledger.ts`      | what could not be done and how often, counted by kind and undrawn region                        |
| `src/runtime/failure-fate.ts`       | `FAILURE_FATES`: every failure kind mapped to a fate, held complete by the compiler             |
| `src/runtime/fight-file.ts`         | the fight as a file: the engine calls and their figures, in the carried-over format             |
| `src/runtime/fight-handover.ts`     | the fight on screen, handed over as a file                                                      |
| `src/runtime/fight-state.ts`        | the view and figures a panel and a file are drawn from, live or replayed from the shelf         |
| `src/runtime/live-fight.ts`         | the fight going on, read one engine call at a time, each step under its own guard               |
| `src/runtime/margometer-runtime.ts` | where the layers meet: settings and shelf opened, engine searched for, each intent executed     |
| `src/runtime/panel-frame.ts`        | the one drawing per frame: tooltips, the window beside the panel, the panel and its opened rows |
| `src/runtime/settings.ts`           | what a reader chose about the panel, kept in the store field by field                           |
| `src/runtime/shelf-keeper.ts`       | the shelf as the running add-on holds it: fights, store, last answer, readings                  |
| `src/runtime/shelf.ts`              | the fights a reader can go back to, stored as payloads and never as figures                     |

| Path                       | For                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `src/ui/panel-choice.ts`   | what a reader chooses about the panel, which the runtime keeps                       |
| `src/ui/panel-document.ts` | the surface the panel asks of a browser's document, declared rather than assumed     |
| `src/ui/panel-drag.ts`     | where a window sits, how a reader moves it by its bar and sizes it by its corner     |
| `src/ui/panel-element.ts`  | the panel drawn into a document it is handed, and the cards its detail window shows  |
| `src/ui/panel-intent.ts`   | what the reader asked for, read off the element they pressed                         |
| `src/ui/panel-listener.ts` | the one listener handed to the browser, and the guard on it                          |
| `src/ui/panel-look.ts`     | the panel's tokens, the classes its rules select, and the stylesheet built from both |
| `src/ui/panel-palette.ts`  | the colours a reading names: the signal inks and the profession palette              |
| `src/ui/panel-content.ts`  | one screen's worth of a fight: the rows, in the order they are drawn                 |
| `src/ui/panel-screen.ts`   | which screen the panel is on, and the questions the strips ask to move it            |
| `src/ui/panel-helper.ts`   | what the window beside the panel says: whose turn, what is charging, who holds whom  |
| `src/ui/panel-words.ts`    | everything the reader reads: the only Polish in `src/`                               |
| `src/ui/ranked-order.ts`   | the order of a ranking, with a tie-break that keeps it stable                        |
| `src/ui/view-failure.ts`   | what the panel could not do, as records the runtime counts                           |

| Path                              | For                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tools/aura-lifetime.ts`          | how long a status stands on the mask, and whether one lighting goes out together: `fight:life`                           |
| `tools/aura-standing.ts`          | what stands on a side, whom a shout holds, how many sources stand at once: `fight:auras`                                 |
| `tools/build-userscript.ts`       | builds the userscript a reader installs, and checks the built text: `build`                                              |
| `tools/capture-intake.ts`         | turns a recording the add-on wrote into material in `captures/`: `capture:intake`                                        |
| `tools/card-height.ts`            | how tall the card a ranking row opens stands, over the recordings: `panel:cards`                                         |
| `tools/changelog.ts`              | a version's `CHANGELOG.md` section as release notes, and the declared version: `release:notes`                           |
| `tools/decoding-status.ts`        | how much of the protocol the decoder reads, in `develop`'s text: `fight:decoding`                                        |
| `tools/develop-reports.ts`        | this tree's reports held against `develop`'s at the pinned revision: `fight:develop`                                     |
| `tools/drill-report.ts`           | which rows of the panel open onto another level, over the recordings: `panel:drill`                                      |
| `tools/fabricated-fight.ts`       | a fight nobody fought, ten a side, written under `fabricated/` outside git: `fight:fabricate`                            |
| `tools/fight-figures.ts`          | what a recording adds up to per combatant, as a terminal table: `fight:figures`                                          |
| `tools/frozen-files.ts`           | what a freeze leaves in `frozen/`: a file re-dated only where its content moved                                          |
| `tools/margonem-client-source.ts` | fetches and dates the game client's JavaScript into `.cache/`: `margonem:client`                                         |
| `tools/margonem-readings.ts`      | whether the readings in `frozen/` are current, the refresh, and the development preview: `margonem:readings`             |
| `tools/help-article.ts`           | the published help, cached, searched and its phrase counts frozen: `margonem:help`                                       |
| `tools/help-claim-register.ts`    | the claims `docs/protocol-keys.md` makes of the published help, read back into phrases                                   |
| `tools/margometer-tool-error.ts`  | `MargoMeterToolError`, the abstract base every tool failure extends                                                      |
| `tools/payload-cost.ts`           | what one payload costs in the game's stack, and the frame's tally, over the recordings: `fight:cost`                     |
| `tools/panel-giving-way.ts`       | the panel with a region that will not draw, built from a copy of the tree: `preview:giveway`, `panel:giveway`            |
| `tools/panel-shots.ts`            | photographs the panel in each state worth showing into `screenshots/`: `panel:shots`                                     |
| `tools/preview-page.ts`           | the page both previews draw: the game page, the bar, the tooltips column, a store that forgets, and the install band     |
| `tools/preview-server.ts`         | serves the preview with a picker, rebuilt and reloaded on change, saying a failed build: `preview`, `preview:fabricated` |
| `tools/preview-site.ts`           | builds the one-page preview GitHub Pages publishes, which keeps nothing and plays its fight once: `preview:site`         |
| `tools/preview-state.ts`          | what `deno task preview` carries in its address across a reload                                                          |
| `tools/protocol-key-shape.ts`     | what each key states about itself over the recordings, beside the register's line: `margonem:shape`                      |
| `tools/protocol-key-table.ts`     | lifts every protocol key the game client branches on from its bundle: `margonem:keys`                                    |
| `tools/recorded-material.ts`      | the recordings a tool reports on, each fight replayed through the runtime's chain, whole or call by call                 |
| `tools/shout-holding.ts`          | whom a character a shout named strikes, turn by turn after it: `fight:shout`                                             |
| `tools/skill-table.ts`            | every published skill and the turns its effects run for: `margonem:skills`                                               |
| `tools/status-bit-table.ts`       | lifts the statuses the `buffs` mask is read by from the client bundle: `margonem:statuses`                               |
| `tools/turn-count.ts`             | the turns each recording's combatants took, graded against the game's numbering: `fight:turns`                           |
| `tools/turn-reading.ts`           | what each message came to under the turn rule, and the openers in dispute: `fight:openers`                               |

| Path                | For                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/`            | shared test support (fake window and document, simulator, recording readers, a register's table reader, the reader of each verb's purity) and the entry and simulation suites |
| `tests/core/`       | the suites of `src/core/`, and the decoding rules held over the recordings                                                                                                    |
| `tests/e2e/`        | the browser suite: Playwright on Node driving the built userscript in Chrome, outside the gate                                                                                |
| `tests/ports/`      | the suites of `src/ports/`, the page adapters, and a session replayed from the recordings                                                                                     |
| `tests/libs/`       | the suites of `libs/`                                                                                                                                                         |
| `tests/repository/` | the guards the register in `AGENTS.md` names, each holding a rule over the tree                                                                                               |
| `tests/runtime/`    | the suites of `src/runtime/`                                                                                                                                                  |
| `tests/tools/`      | the suites of `tools/`                                                                                                                                                        |
| `tests/ui/`         | the suites of `src/ui/`, and the bounds and wording of what the panel draws                                                                                                   |

| Path        | For                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `captures/` | the recordings: raw protocol from real fights, evidence rather than test data, changed only by intake |

| Path           | For                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| `screenshots/` | the panel's pictures the READMEs show, with `taken-at.json` naming the commit, version and recording |
