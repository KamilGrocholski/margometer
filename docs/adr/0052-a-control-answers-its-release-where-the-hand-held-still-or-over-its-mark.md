# 0052. A control answers its release where the hand held still or let go over its mark

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
payload fed and drawn, the mouse released over the row drawn again, and no level opened.

A fight also reorders the ranking. The maintainer found it on 2026-10-11, against a build comparing
the press's mark with the release's alone: a row pressed and overtaken before the hand let go
released over somebody else's row, and nothing opened. The same suite holds it: on
`2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0.json`, fed through 12 calls, a hand held still
over a row while payloads arrive one at a time ends over another row, and with the marks alone
deciding, no level opened.

## Decision

Decided with the maintainer on 2026-10-11.

**A control acts on the release, for what its press asked for, where the hand held still or let go
over a mark stating the same.** The press keeps the intent `readPanelIntent` reads off its target
and where the pointer was. The release calls `onIntent` with the press's intent where the pointer
travelled less than a drag's start in either axis, whatever a frame moved under it; where the hand
moved, or a document states no place, it reads its own target and acts only where
`isPanelIntentSame` says the two marks agree. Marks are compared and never nodes, so a row drawn
again still answers.

**Still is under Blink's own threshold for starting a drag:** `kDragThresholdX`/`Y` in
`third_party/blink/renderer/core/input/mouse_event_manager.cc`, `main` read 2026-10-11, where a
travel of 4 pixels in either axis has moved. macOS builds take 3 there, and the larger is taken: a
hand on a Mac is held still one pixel further than its browser would hold it.

**A press carried out of the panel is let go of there.** A release outside the shadow root never
reaches the root, so the `pointerout` whose `relatedTarget` none of the root's windows holds drops
the press waiting; otherwise a press on a row, a release outside and a second press brought back
would open the row the first one named. A hand wandering inside the panel and back keeps it, as a
browser's click does.

**A stray mark is said where it is read**: by the press, or by a release that moved onto one, once a
gesture.

**The drag still starts at the press.** A grab is the down stroke by nature, and nothing waits on a
release to begin one.

Rejected: **the browser's own `click`.** A redraw between the two moments eats it, and a fight
redraws on almost every call.

Rejected: **the marks alone deciding.** The ranking moves a row from under a still hand, and the
release then names a reader who was never pressed.

Rejected: **the press's intent wherever the release lands inside the panel.** It keeps a reordered
row answering, and opens a row the reader had deliberately slid away from.

Rejected: **holding frames back while a button is down**, which keeps the browser's `click`. A
release outside the panel never reaches the root, so the hold needs a timeout or the meter freezes,
and the state reaches into `src/runtime/` for a gesture the view can settle alone. `develop` turned
it down in `f4b024f` for the same cost.

Rejected: **staying on the press.** It is the two costs in the context, kept for a guarantee the
still hand gives as well.

## Consequences

- `PANEL_LISTENER` gains `click`, the listener a release that moved onto a stray mark names.
- A test drives a control with a press and a release (`clickElement` in `tests/fake-document.ts`);
  the crawl dispatches both. A test stating no place is decided by the marks.
- A press without a release asks for nothing, which a test pressing alone now reads as a gesture not
  yet made.
