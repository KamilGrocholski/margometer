# 0036. The caveat letter is drawn, and every bar control is one box

- **Status:** Accepted
- **Date:** 2026-10-04

## Context

Two marks on the panel came out off centre. Both were measured in Chrome 154 at device scale 1 on
2026-10-04, on `dist/preview/index.html` (0.22.0-dev, the medium type step, the preview's
recording):

- **The caveat ring's `i` sat high.** The ring is 12px, so its inside is rows 5 to 14. The letter's
  ink covered rows 6 to 11, which left one pixel between it and the ring above and three below. The
  ring itself was drawn since `develop ADR 0092`, but the letter in it was still a glyph, a 7px `i`
  centred by its em box with `line-height:1`. An em box holds the descent under the baseline, and an
  `i` has none, so its ink lands above the middle. How far above depends on the face, which the
  panel does not choose.
- **The four title-bar controls stood at four widths.** Each was `padding:0 4px` around its own
  glyph: ⚙ 21.48px, ☰ 21.48, ⭳ 16.73, — 22.73. The ⚙'s ink also stood a pixel left of its box's
  middle.
- **With the four boxes made equal, the glyphs still stood off centre.** Weighing each glyph's ink
  against its box at device scales 1, 1.25, 1.5 and 2 the same day, ⭳ stood 2.06 to 2.67 device
  pixels under the middle at every scale, — up to 1.37 under from 1.25 up, and every glyph 0.3 to
  0.9 to the left. A glyph's ink stands where its face draws it within its advance and its line, and
  nothing about the box around it can move that.

## Decision

Decided with the maintainer on 2026-10-04.

**The caveat mark's letter is drawn as a dot over a stem, and the `i` stays the element's text at no
size.** `develop ADR 0092`'s argument for the ring, that a drawn shape is the same wherever the
panel is opened and a codepoint is not, holds for the letter just as well. The geometry comes from
the ring: one clear pixel above and below, a stem two pixels wide, a dot as tall as the stem is
wide, and a one-pixel gap between them. The ring is even at every step (10, 12, 12), so its inside
is even and the stem stands on whole pixels. With the rule written into the page, the letter stood
one pixel clear above and below, and four to either side, in the medium ring. The `i` stays in the
DOM so that a copy, a test's dump and a reader of the text still read it.

**Every bar control is one box, `getControlWidthPixels` wide and `getControlHeightPixels` tall.**
The height is the line plus its two rules, which is what the bar's height already counted. The width
is that height plus `SPACE_PIXELS.small` (19, 20 and 21px). The four come to 80px on the medium step
against 82.4 before, so no step's bar asks for more than its measured width.

**And each draws its icon rather than its glyph**: an SVG on a ten-unit square, its shapes laid out
about the middle, set as a mask over a square of the control's own colour in its `::before`. The
square is the box's inside less two pixels of air above and below (9, 10 and 11px), so it stands on
whole pixels in every box, and flex centres it. The glyph stays the control's text at no size, so a
copy and the tests that read a control's mark still read it. With the rule written into the page,
every icon's ink stood within 0.04 device pixels of its box's middle at device scales 1 and 2, and
within half a pixel at 1.25. The mask follows `color`, so the hover lightens an icon as it did a
glyph. `-webkit-mask-image` is spelled beside `mask-image`, because an icon unmasked is a solid
square (`docs/browser-support.md`).

Rejected: nudging the glyph down with `padding-top:1px`. The offset belongs to the face, and the
panel draws in `system-ui`, which is a different face on every reader's machine.

Rejected: square controls at the bar's 16px. At `border-radius` they became circles, and `—` and
`☰` met the rule at both sides.

Rejected: equal boxes around the glyphs, the first form of this decision. It evened the widths and
left the ink where each face draws it, which is the second measurement above.

Rejected: SVG elements in the control. `PanelDocument` offers `createElement` alone, so every test
double would need `createElementNS`; a mask in the sheet draws the same shape and touches no port.

Rejected: icons drawn from boxes and gradients alone. The rule, the bars and the plus can be, but
not the arrow's head or the gear.

## Consequences

- `TypeTokens.markLetterPixels` is gone. The ring's size is the only token the mark has.
- The sheet departs from `develop`'s at `.titlebar-button` and at the caveat rule, and it adds the
  `::before` and `::after` rules. `tests/ui/panel-look.test.ts` names each one, and checks at every
  step that the letter's air adds up on both axes.
- `tests/e2e/panel-type.spec.ts` checks at every step that the controls of both bars come out as one
  size, and that the drawing each control really wears is laid out about the middle of its square,
  by the browser's own `getBBox`, folded and not.
- No face has to carry ⭳ or ⚙ any more, which was a trap the save mark's comment had kept open.
- The icons' strokes are not on whole pixels at every step, so at device scale 1 their edges are
  softer than a hinted glyph's. That is what one drawing across three sizes costs.
