# 0054. The steps of type are 12, 13 and 14 pixels

- **Status:** Accepted
- **Date:** 2026-10-11

## Context

ADR 0013 gave the reader three steps of type, 11, 12 and 13px, and ADR 0017 made the middle one what
a reader who chose none reads. ADR 0053 then made every row a target's least, 24 pixels at the small
step, so an 11px line stood with nine pixels of air in a row drawn for it at 18.

The maintainer asked on 2026-10-11 whether the type could be larger.

Two things tie a size of type to the rest of its row in `TYPE_TOKENS`. A row less its drop and its
line is even (`develop ADR 0015`), so a size cannot grow inside an unchanged row. And every width is
measured at its size: the rank cell, a cast's floor, and the panel, which is what its bar asks. With
ADR 0053's 24-pixel controls the bars ask more than the panels held. Measured in Chrome
154.0.8037.57 on 2026-10-11, over the browser suite's recording, the bar asks 293.39px at 12px,
307.19 at 13px and 321.36 at 14px, for the name, `0.23.0-dev` and four controls on one line.

## Decision

Decided with the maintainer on 2026-10-11.

**The steps are 12, 13 and 14px, and the middle one, 13px, is still what a reader who chose none
reads.** The small step takes the 12px row's measurements and the middle the 13px row's, so both
keep what ADR 0013 measured; only the 14px row is new.

**The 14px row is measured the way ADR 0013 measured the others**, through the same Chrome, the
method first reproducing the 11, 12 and 13px figures it was taken with: `20.` at 22.27px, so a rank
cell of 27; `Wyzywa` at 57.55px, so a cast's floor of 58. Its line is 20 and its row 29, which
leaves the eight pixels under the line every step leaves; its ring is 14, the next even one; its
card bound and window beside are 318 and 268, the 11px widths scaled and made even as the other
steps' are.

**Each panel stands two past what its bar asks**, as ADR 0017 set the middle one: 296, 310 and
324px. Narrower, the version gives way on a bar a reader's own font did not widen, which is the
fallback `src/ui/panel-look.ts` keeps for that font and not a width to draw at.

Rejected: **the middle step's default moved to 13px with the steps kept at 11, 12 and 13.** It is
one line, but it leaves the smallest type a reader can choose at 11px in a row drawn 24 tall.

Rejected: **larger type inside the rows ADR 0053 drew.** A 12px line in a 24-pixel row sets its ink
on a half pixel, and every width measured at 11px would cut more of a name.

## Consequences

- A reader who chose a step keeps its name and reads it a pixel larger: the stored word does not
  change, so nothing is migrated.
- The unit tests that work a window's place out in pixels take the small step, and their figures are
  worked out at 296px.
- `tests/ui/panel-look.test.ts` holds the sheet against `develop`'s at the one size `develop` drew,
  through `composeStyleSheetForTokens`, since no step is that size any longer.
- What a card never gives up — its figures and its notes — drew 332 px for the browser suite's first
  row at 13px in Chrome 154 on 2026-10-11, so a window under 352 px tall still clips it with the
  card saying something was given up. It held at 12px; a larger step only moves where it begins.
- `screenshots/` is taken again at the next release, by `docs/releasing.md`.
