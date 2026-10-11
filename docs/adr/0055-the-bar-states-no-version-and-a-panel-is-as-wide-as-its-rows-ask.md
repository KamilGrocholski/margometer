# 0055. The bar states no version, and a panel is as wide as its rows ask

- **Status:** Accepted
- **Date:** 2026-10-11

## Context

ADR 0054 made each panel two past what its bar asks: 296, 310 and 324 pixels at 12, 13 and 14px. The
bar held the name, the version and four 24-pixel controls (ADR 0053). Measured in Chrome
154.0.8037.57 on 2026-10-11 over the browser suite's recording, at 13px the name took about 101
pixels and `0.23.0-dev` 72, so the version alone set more than a fifth of the panel's width. The
maintainer asked whether the windows really had to be that wide.

## Decision

Decided with the maintainer on 2026-10-11.

**The bar states no version; the options do, under a heading of their own.** The host keeps stating
it in `data-margometer-version`, where anything outside the root reads it. Without it the bar asks
223.39, 231.19 and 238.97 pixels, so it no longer sets any panel's width.

**A panel is as wide as its rows ask.** At 12 and 13px that is the width those sizes were drawn at
before ADR 0054, 274 and 306, which hold a name, the rank, the figure and the share. At 14px the
rank, figure and share stand 160.38 pixels against 150.86 at 13px, measured the same day, so the
panel is 316: the 13px width with that difference added and made even, which gives a name the room
it has at 13px. One name of the suite's ranking is cut at 12px and none at 13 or 14px.

Rejected: **a tighter bar**, its gaps and its sides narrowed: about 14 pixels, with the version
still setting the width.

Rejected: **the version cut with an ellipsis at the old widths.** A number always cut is a number
nobody can read; the ellipsis stays a fallback for a reader's own font, never the drawing.

## Consequences

- The version label, its rule and the two tests that held it as a part of the bar's handle are gone;
  dragging by the bar is held by the bar's own tests.
- A bar too narrow for its controls has nothing left to give way. It holds them at 260 pixels, past
  any width a corner drag allows at 13px, and `tests/e2e/panel-options.spec.ts` says so.
