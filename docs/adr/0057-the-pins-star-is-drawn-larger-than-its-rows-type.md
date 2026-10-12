# 0057. The pin's star is drawn, larger than its row's type

- **Status:** Accepted
- **Date:** 2026-10-12

## Context

The shelf's pin was the glyph ★ or ☆ at the row's own type, centred in a box as wide as the row is
tall. Measured in Chrome 154 at device scale 2 on 2026-10-12, on the preview's recording at
`c702021` with the shelf open, its ink stood 9 by 8.5px in the 25px box of the small step, 10 by 9
in the 27px box of the medium one and 11 by 10 in the 29px box of the large one, in a hairline
outline. The maintainer found it too small.

A larger glyph would not have been a size the panel chooses: a glyph's ink is the face's, and ADR
0036 met it standing off its box's middle at every device scale.

## Decision

Decided with the maintainer on 2026-10-12.

**The star is drawn as the bar's icons are, a mask on the pin's own ink, and the glyph stays the
pin's text at no size.** A copy, a test reading the text and a reader of the DOM still meet ★ or ☆.
One path serves both states: outlined where nothing is pinned, filled where something is, with the
same stroke, so pressing the pin fills the star and does not grow it.

**The star is as tall as the row less six pixels either side, made even: 14, 16 and 18px** at the
three steps. Measured as above, its outline inks 14 by 13px, 15.5 by 15 and 17.5 by 17, and filled
it is half a pixel wider at the two larger steps. Even, because the pin's inside under the row's
one-pixel drop is: the star stands on whole pixels down, and across on a half, where none of its
points meets a pixel's edge either way.

Rejected: **the glyph at a larger `font-size`.** It grows, but by what the reader's face makes of
it, and it keeps standing where that face puts it.

## Consequences

- The pin's rule in `src/ui/panel-look.ts` writes `font-size:0`, a departure from `develop`'s sheet
  that `tests/ui/panel-look.test.ts` names, beside the two rules drawing the star.
- `tests/e2e/panel-type.spec.ts` reads the star's drawing off the mask the pin wears, both ways
  pressed, as it reads the bar's icons.
