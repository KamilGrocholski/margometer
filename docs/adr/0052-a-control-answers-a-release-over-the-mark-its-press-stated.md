# 0052. A control answers a release over the mark its press stated

- **Status:** Accepted
- **Date:** 2026-10-11

## Context

The panel acted on `pointerdown`, a choice `develop` made in `f4b024f` on 2026-08-18, whose body
holds the measurement that follows. A browser dispatches `click` only where the press and the
release land on a node still in the tree. On `develop` a payload redrew the whole body, and by
`bun run cost 3` at `66a259f` 82 of the 84 engine calls of `2026-08-15-tempest-grupa-vs-hildur-2`
did, so a click pressed during a fight mostly went nowhere. Acting on the press closed that, and
opened two costs: a gesture could not be called off by sliding away before letting go, and the panel
acted on the down stroke where every other control a reader meets acts on the release.

This tree still replaces what it draws: a stale frame swaps the list's rows (`renderListRows`) and
replaces every other region (`renderInPlace`). Measured on Chrome 154.0.8037.57, 2026-10-11, by
`tests/e2e/panel-level.spec.ts` with the listener put on `click`: a real mouse pressed on a row, one
payload fed and drawn, the mouse released over the row drawn again, and no level opened. With the
listener on `pointerup` and the marks compared, it did.

## Decision

Decided with the maintainer on 2026-10-11.

**A control acts on the release, where the release reads the intent its press read.** The press
keeps what `readPanelIntent` reads off its target; the release reads its own target and calls
`onIntent` only where `isPanelIntentSame` says the two agree. The marks are compared and never the
nodes, so a row drawn again between the two moments still answers, and a release anywhere else calls
the gesture off.

**A press carried out of the panel is let go of there.** A release outside the shadow root never
reaches the root, so the `pointerout` whose `relatedTarget` none of the root's windows holds drops
the press waiting; otherwise a press on a row, a release outside and a second press brought back
would open the row the first one named. A hand wandering inside the panel keeps it, as a browser's
click does.

**A stray mark is said at the release**, as `GestureDropped` from the `click` listener, once a
gesture.

**The drag still starts at the press.** A grab is the down stroke by nature, and nothing waits on a
release to begin one.

Rejected: **the browser's own `click`.** The measurement above: a redraw between the two moments
eats it, and a fight redraws on almost every call.

Rejected: **holding frames back while a button is down**, which keeps the browser's `click`. A
release outside the panel never reaches the root, so the hold needs a timeout or the meter freezes,
and the state reaches into `src/runtime/` for a gesture the view can settle alone. `develop` turned
it down in `f4b024f` for the same cost.

Rejected: **staying on the press.** It is the two costs in the context, kept for a guarantee the
compared marks give as well.

## Consequences

- `PANEL_LISTENER` gains `click`, the listener a dropped gesture now names.
- A test drives a control with a press and a release (`clickElement` in `tests/fake-document.ts`);
  the crawl dispatches both.
- A press without a release asks for nothing, which a test pressing alone now reads as a gesture not
  yet made.
