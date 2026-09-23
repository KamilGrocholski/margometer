# 0114. The game's windows stand over the panel

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

The host carried `z-index: 9999`, a number measured against nothing the game does. It won every
argument: a dialog of the game's, its tooltips, its menus and its captcha all opened **under** the
panel. **ADR 0068** separated that number from the order inside the root; it never decided what the
number should be.

Read on the stylesheet `/css/style.BLVAkooC.css`, served beside bundle `Bb28FQty` by
`tempest.margonem.pl`, 2026-09-23:

- `body` is `position: fixed`, and the client scales it with a `transform`. Either makes it the
  stacking context. Its one child in the served page is `.game-window-positioner`, which is not
  positioned, so every layer the client builds inside it stacks in **body's** context — the same one
  the host stands in, since `src/userscript-entry.ts` appends it to `document.body`, after the
  positioner.
- `.layer` is `z-index: 10`, and the interface layer takes it: the map, the battle and the two HUD
  columns either side. Together they are opaque over the whole screen.
- Every layer holding something a player opens stands **above 10**: the windows, the chat and the
  alerts at 11, the sticky tips, the tutorial and the zoom at 12, the loader at 13, the console at
  14, the popup menus at 15, the mobile alerts at 17 and 111, the captcha at 25, the tip layer at
  112. The bundle itself writes nothing above 123 (read 2026-09-22, `ARCHITECTURE.md`).
- Two layers besides the interface stand at exactly 10: the drop-to-delete target and the low-health
  vignette (which a second rule raises to 22).

## Decision

**The host takes the game's interface layer, `10`, and wins it by standing after it in `body`.**
Everything the game draws over its own interface is drawn over the panel too, and the panel is drawn
over the map and the HUD.

A tie decided by tree order is what **ADR 0068** refused inside the root. It is taken here because
the order is the game's page and not ours to arrange, and because no integer stands between 10 and
11.

## Consequences

A game window dragged over the panel hides it, and so does one of the game's tooltips — which is
what a player asked for. The card and the window beside the panel stand inside the host's own
stacking context, so they go under a game window with it; the order among them is still **ADR
0068**'s.

The tie rests on one fact about their page: the positioner comes before the host in `body`. It is in
the served HTML, and the host is appended when the add-on stands up, so it holds while the game
serves the page it serves today.

**Nothing re-reads the stylesheet.** A game that renumbers its layers moves the panel over or under
its windows and turns no guard red. `tests/e2e/panel-layer.spec.ts` holds the order against the two
numbers read here; whether those are still the game's is `ARCHITECTURE.md`'s known gap.

## Alternatives

**Under 10.** Under the interface layer the panel is under the map and both HUD columns, which cover
the whole screen: nothing of it would be seen.

**Inside the game's own window layer, as its first child.** Every window appended later would stand
over it without a number. It puts a node of ours inside their tree, where the window manager
reorders children and restacks them by a counter of its own, and ties the add-on standing up to a
class name of theirs existing when it does.

**Keeping 9999.** Over the captcha and over their tooltips, which is the fault.
