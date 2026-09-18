# Architecture decision records

An ADR records a decision that is **costly or surprising to reverse**. Everything else lives in the
commit that made it — an append-only list of lessons with no consumer is the artefact this project
deleted 14,000 lines of.

Three questions decide whether something needs one:

1. Would undoing it touch many files, the published contract, or the reader's installed copy?
2. Would somebody arriving later be surprised that it was decided this way?
3. Was there a real trade-off, with an alternative that could have been chosen?

All three, or it is a commit message.

## Format

One file, `NNNN-short-title.md`, four digits, sequential, never renumbered. Headings, in order:

```
# NNNN. Title

- **Status:** Proposed | Accepted | Superseded by NNNN[ in part[, and by NNNN in part]] | Deprecated
- **Date:** YYYY-MM-DD

## Context
What was true that forced a choice. Facts and measurements, not intentions.

## Decision
What was decided, in the present tense, as a rule.

## Consequences
What this makes easy, what it makes hard, and what it obliges somebody to do later.

## Alternatives
What else was on the table and why it lost.
```

## Lifecycle

- **Proposed** — written down, not yet binding.
- **Accepted** — binding. The rules it implies are in `AGENTS.md` or the relevant document.
- **Superseded by NNNN** — a later ADR replaced it. The file stays; history is not edited. Where the
  later record took over only half of what this one decided, the status says `in part` and the rest
  of it still binds; where two records split it between them, both are named. Every number in a
  status is a decision that exists, and never this one's own (`tests/repository/decisions.test.ts`).
- **Deprecated** — no longer binding and nothing replaced it.

A status change is its own commit, and the ADR says which one superseded it. Never delete an ADR and
never renumber one: a decision that was wrong is more useful visible than gone.

**An ADR restates the rule it decided, and that is not duplication.** It is a dated snapshot: it
must stay readable on its own years later, and it must keep saying what was decided **then**, even
after the rule moves. When the rule changes, a new ADR supersedes this one — the old text is never
edited to agree with the new rule.

## Index

- [0001](0001-deno-instead-of-bun.md) — Deno instead of Bun. **Accepted**
- [0002](0002-assertions-live-in-the-shipped-build.md) — Assertions live in the shipped build, and a
  boundary turns a failure into state. **Accepted**
- [0003](0003-captures-at-the-repository-root.md) — Captured fights live at the repository root.
  **Accepted**
- [0004](0004-a-subclass-per-catch-not-per-module.md) — An error subclass exists per `catch`, not
  per module. **Superseded by 0009**
- [0005](0005-a-ceiling-on-comment.md) — A ceiling on comment, and three rules that give it shape.
  **Superseded by 0016**
- [0006](0006-no-regular-expressions.md) — No regular expressions. **Accepted**
- [0007](0007-assertion-density-is-measured-where-the-program-is.md) — Assertion density is measured
  where the program is. **Accepted**
- [0008](0008-the-decoder-produces-a-union-of-event-kinds.md) — The decoder produces a union of
  event kinds. **Accepted**
- [0009](0009-a-class-per-failure-and-no-base-is-thrown.md) — A class per failure, and no base is
  ever thrown. **Accepted**
- [0010](0010-sizing-a-share-onto-a-side.md) — Sizing a share onto a side. **Accepted**
- [0011](0011-wording-a-kind-of-damage.md) — Wording a kind of damage, and what carries none.
  **Accepted**
- [0012](0012-the-version-is-written-into-the-bundle.md) — The version is written into the bundle,
  not into the tree. **Accepted**
- [0013](0013-charging-a-half-named-figure-to-a-side.md) — A figure the protocol half-named is
  charged to a side by the end it did name: damage crosses, healing does not. **Accepted**
- [0014](0014-a-region-holding-rows-is-inset-equally.md) — A region holding rows is inset equally,
  and its height carries only rows. **Accepted**
- [0015](0015-a-row-centres-the-ink-a-reader-sees.md) — A row centres the ink a reader sees, and it
  takes the whole panel onto the pixel grid. **Accepted**
- [0016](0016-the-ceiling-became-the-target.md) — The ceiling became the target, so description
  moves to the docblock. **Accepted**
- [0017](0017-the-panel-is-served-and-published.md) — The panel is served while it is edited, and
  published once it is released. **Accepted**
- [0018](0018-a-release-says-what-its-changelog-section-says.md) — A release says what its changelog
  section says, and the version is declared once. **Accepted**
- [0019](0019-the-card-answers-the-screen-it-stands-on.md) — The card answers the screen it stands
  on, and a proc is placed by the register rather than by its sign. **Superseded by 0032**
- [0020](0020-a-shared-address-for-what-knows-nothing.md) — A shared address for what knows nothing
  of this project. **Accepted**
- [0021](0021-a-read-says-whether-it-worked.md) — A read says whether it worked, and the value sits
  behind it. **Accepted**
- [0022](0022-a-tick-belongs-to-the-wound-that-is-ticking.md) — A tick belongs to the wound that is
  ticking, and to the attacker who left it. **Accepted**
- [0023](0023-a-profession-is-said-in-one-channel.md) — A profession is said in one channel, and the
  card is the answer. **Accepted**
- [0024](0024-the-panel-asks-the-client-only-where-it-has-no-word.md) — The panel asks the client
  only where it has no word. **Accepted**
- [0025](0025-a-mark-is-the-answer-its-boundary-gives.md) — A mark is the answer its boundary gives,
  and not every one is a console line. **Accepted**
- [0026](0026-a-kept-fight-is-the-payloads-and-a-figure-is-memoised.md) — A kept fight is the
  payloads, and a figure is memoised rather than stored. **Accepted**
- [0027](0027-the-fight-is-handed-over-in-one-file.md) — The fight is handed over in one file, and
  intake takes the counted figures back off it. **Accepted**
- [0028](0028-a-preview-opens-on-one-finished-fight.md) — A preview opens on one finished fight, and
  the panel's state rides in the address. **Accepted**
- [0029](0029-a-panel-nobody-has-moved-opens-in-the-middle.md) — A panel nobody has moved opens in
  the middle of the window. **Accepted**
- [0030](0030-a-recording-says-who-wrote-it.md) — A recording is spelled in English, and says which
  builds it stands between. **Accepted**
- [0031](0031-the-list-scrolls-without-drawing-a-scrollbar.md) — The list scrolls without drawing a
  scrollbar, and no region reserves a gutter. **Accepted**
- [0032](0032-the-card-says-everything-wherever-a-person-stands.md) — The card says everything,
  wherever a person stands. **Accepted**
- [0033](0033-a-panel-with-no-live-fight-opens-on-the-shelf.md) — A panel with no live fight opens
  on the shelf. **Accepted**
- [0034](0034-every-row-with-a-level-under-it-opens.md) — Every row with a level under it opens, and
  every cut that holds a row is drawn. **Accepted**
- [0035](0035-a-build-with-no-version-named-takes-the-declaration.md) — A build with no version
  named takes the declaration and marks it. **Accepted**
- [0036](0036-a-pinned-figure-stands-on-every-list.md) — A pinned figure stands on every list,
  charged to the side it is on. **Accepted**
- [0037](0037-a-release-run-states-the-number-the-tree-declares.md) — A run that says it is the
  release states the number the tree declares. **Accepted**
- [0038](0038-a-half-named-row-says-what-it-is-and-opens.md) — A half-named row says what it is, and
  opens onto the end the game did name. **Accepted**
- [0039](0039-a-half-named-figure-says-what-it-was-dealt-with.md) — A half-named figure says what it
  was dealt with, from a cut kept for it. **Accepted**
- [0040](0040-the-standard-library-is-asked-first.md) — The standard library is asked before a
  function is written. **Accepted**
- [0041](0041-a-pinned-row-states-its-kinds-before-it-is-pressed.md) — A pinned row states its kinds
  on the card, before anybody presses it. **Accepted**
- [0042](0042-the-naming-convention-is-transplanted-not-copied.md) — A naming convention is
  transplanted, not copied. **Accepted**
- [0043](0043-a-failure-at-a-handover-has-nobody-to-catch-it.md) — A failure at a handover has
  nobody to catch it. **Accepted**
- [0044](0044-a-value-never-wears-a-type-nobody-checked.md) — A value never wears a type nobody
  checked. **Accepted**
- [0045](0045-a-recording-of-a-fight-already-here-is-refused.md) — A recording of a fight already
  here is refused at the door. **Accepted**
- [0046](0046-the-browser-layer-is-a-suite-of-its-own.md) — The browser layer is a suite of its own,
  and it brings a driver. **Superseded by 0047**
- [0047](0047-the-browser-layer-comes-back-on-playwright.md) — The browser layer comes back, on
  Playwright, and asks the machine for its Chrome. **Accepted**
- [0048](0048-a-turn-is-counted-and-nothing-divides-by-it.md) — A turn is counted, and nothing
  divides by it. **Accepted**
- [0049](0049-a-turn-nobody-spent-is-read-by-shape.md) — A turn nobody spent is read by shape, not
  by words. **Accepted**
- [0050](0050-the-list-keeps-the-place-a-reader-was-at.md) — The list keeps the place a reader was
  at. **Accepted**
- [0051](0051-the-layer-a-reader-touches-never-fails.md) — The layer a reader touches never fails.
  **Accepted**
- [0052](0052-a-wheel-turn-outlives-the-payload-that-lands-in-it.md) — A wheel turn outlives the
  payload that lands in it. **Accepted**
- [0053](0053-the-file-is-the-fight-on-screen.md) — The file is the fight on screen. **Accepted**
- [0054](0054-a-card-taller-than-the-window-gives-up-a-run.md) — A card taller than the window gives
  up a run. **Superseded by 0087 in part**
- [0055](0055-a-bound-that-drops-a-part-makes-the-panel-lie.md) — A bound sums what it will not
  draw. **Superseded by 0079 in part**
- [0056](0056-a-fight-broken-off-is-neither-a-loss-nor-a-draw.md) — A fight broken off is neither a
  loss nor a draw. **Accepted**
- [0057](0057-damage-stated-by-name-is-still-its-strikers-turn.md) — Damage stated by name is still
  its striker's turn. **Accepted**
- [0058](0058-the-skill-table-is-a-frozen-reading.md) — The skill table is a frozen reading, and the
  descriptions stay out. **Accepted**
- [0059](0059-what-stands-says-what-has-passed-and-never-what-is-left.md) — What stands says what
  has passed, and never what is left. **Accepted**
- [0060](0060-a-grip-says-which-window-it-drags.md) — A grip says which window it drags.
  **Accepted**
- [0061](0061-a-cast-stands-on-a-side-and-names-only-whom-the-game-names.md) — A cast stands on a
  side, and names only whom the game names. **Superseded by 0062 in part**
- [0062](0062-a-shout-holds-one-character-and-the-last-one-wins.md) — A shout holds one character,
  and the last one wins. **Superseded by 0063 in part, and by 0067 in part**
- [0063](0063-a-shout-covers-a-count-so-the-panel-names-the-count.md) — A shout covers a count, so
  the panel names the count. **Superseded by 0064 in part**
- [0064](0064-a-shout-names-the-provoked-so-the-panel-reads-them.md) — A shout names the provoked,
  so the panel reads them. **Accepted**
- [0065](0065-a-row-says-which-side-it-stands-on.md) — A row says which side it stands on, and its
  hue goes on saying who it is. **Accepted**
- [0066](0066-the-ranking-says-whose-turn-it-is.md) — The ranking says whose turn it is.
  **Accepted**
- [0067](0067-a-shout-is-drawn-under-whoever-is-holding-it.md) — A shout is drawn under whoever is
  holding it. **Superseded by 0097 in part**
- [0068](0068-a-card-stands-over-the-window-beside-the-panel.md) — A card stands over the window
  beside the panel. **Accepted**
- [0069](0069-a-card-says-only-what-names-its-own-person.md) — A card says only the gaps that name
  its own person. **Accepted**
- [0070](0070-a-warning-says-how-big-it-is-and-whom-it-reaches.md) — A warning says how big it is,
  whom it reaches, and what could not be read. **Accepted**
- [0071](0071-a-right-press-belongs-to-the-window-it-lands-in.md) — A right press belongs to the
  window it lands in. **Accepted**
- [0072](0072-a-fight-the-game-runs-itself-numbers-no-turn.md) — A fight the game runs itself
  numbers no turn. **Accepted**
- [0073](0073-the-element-column-speaks-the-games-own-words.md) — The element column speaks the
  game's own words. **Accepted**
- [0074](0074-an-assertion-the-compiler-guarantees-is-not-one.md) — An assertion the compiler
  guarantees is not one, so the floor moves under it. **Accepted**
- [0075](0075-a-comment-is-counted-by-its-words.md) — A comment is counted by its words, not by the
  lines it is written over. **Accepted**
- [0076](0076-the-way-out-is-held-by-the-object-not-by-the-method.md) — The way out is held by the
  object, not by the method. **Accepted**
- [0077](0077-the-defence-line-speaks-the-games-own-words.md) — The defence line speaks the game's
  own words. **Accepted**
- [0078](0078-a-granted-blow-is-still-its-announcements.md) — A granted blow is still its
  announcement's. **Accepted**
- [0079](0079-a-row-naming-what-the-game-named-takes-a-place.md) — A row naming what the game named
  takes a place. **Accepted**
- [0080](0080-health-that-went-out-under-a-key-stands-under-it.md) — Health that went out under a
  key stands under it, on the damage screens too. **Accepted**
- [0081](0081-the-closing-row-opens-onto-the-other-end.md) — The closing row opens onto whoever
  stood at the other end. **Accepted**
- [0082](0082-a-screen-is-counted-twice-and-the-difference-is-drawn.md) — A screen is counted twice,
  and the difference is drawn. **Accepted**
- [0083](0083-a-region-that-stands-down-is-built-from-a-copy.md) — A region that stands down is
  built from a copy, and the tree keeps no seam. **Accepted**
- [0084](0084-a-kept-fight-states-its-day-and-the-place-pays.md) — A kept fight states its day, and
  the place pays for it. **Accepted**
- [0085](0085-a-proc-may-carry-a-figure-nobody-reads.md) — A proc may carry a figure nobody reads.
  **Superseded by 0094 in part, and by 0095 in part**
- [0086](0086-the-crumb-names-the-way-back.md) — The crumb names the way back, and a row still does
  not. **Accepted**
- [0087](0087-a-card-groups-by-what-a-figure-is-a-sum-over.md) — A card groups by what a figure is a
  sum over. **Accepted**
- [0088](0088-a-figure-that-means-narrower-says-so-and-says-it-once.md) — A figure that means
  narrower says so, and says it once. **Superseded by 0089 in part**
- [0089](0089-the-caveat-mark-gets-an-ink-and-a-row.md) — The caveat mark gets an ink of its own,
  and the row whose figure is the narrower one. **Accepted**
- [0090](0090-a-card-opens-beside-the-window-whose-row-it-names.md) — A card opens beside the window
  whose row it names. **Accepted**
- [0091](0091-a-card-is-as-wide-as-what-it-says.md) — A card is as wide as what it says.
  **Accepted**
- [0092](0092-the-caveat-mark-is-drawn-not-spelled.md) — The caveat mark is drawn, not spelled.
  **Accepted**
- [0093](0093-a-lookup-table-is-named-for-the-lookup-it-takes.md) — A lookup table is named for the
  lookup it takes. **Accepted**
- [0094](0094-the-proc-that-may-carry-a-figure-is-a-family.md) — The proc that may carry a figure is
  a family, not one key. **Superseded by 0095 in part**
- [0095](0095-a-weakened-wound-is-a-deep-wound.md) — A weakened wound is a deep wound, and the card
  counts it as one. **Accepted**
- [0096](0096-the-name-a-card-opens-with-folds.md) — The name a card opens with folds, and the count
  folds with it. **Accepted**
- [0097](0097-an-okrzyk-stands-twice-because-the-table-dates-it-twice.md) — An okrzyk is two dated
  halves on one announcement: the side-wide one stands, the shout holds, and the row names which
  okrzyk it is. **Accepted**
- [0098](0098-a-person-beside-the-panel-is-answered-by-what-their-row-cut.md) — A person beside the
  panel is answered by what their row cut. **Accepted**
