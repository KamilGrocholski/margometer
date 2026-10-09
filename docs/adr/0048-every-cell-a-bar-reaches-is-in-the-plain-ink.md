# 0048. Every cell a bar reaches is in the plain ink

- **Status:** Accepted
- **Date:** 2026-10-09

## Context

`DESIGN.md` says text on a coloured bar clears WCAG AA, and `tests/ui/panel-look.test.ts` held it
over the tokens alone: each ink over `surface`, `raised` and `track`. A ranking row's bar is none of
those. It is the row's own hue at `barTint` over `track`, and it stands behind every cell of the
row, so the ground under a rank, a share or a turn mark is a bar wherever the row's figure is long
enough to reach it. The test never asked about that ground, and it read an ink at full strength
whatever `opacity` the element was drawn through.

Measured on 2026-10-08 against the palette in `src/ui/panel-palette.ts`, with the sheet's `BAR_TINT`
and the WCAG formula `getContrastRatio` states:

- the quiet ink over the worst profession's bar reads 2.84, and over the colourless bar a cut of a
  figure takes 2.25, against the 4.5 floor; the rank, the turn mark and the share were in it;
- the plain ink reads 4.84 over the colourless bar, the worst of them;
- the suspect mark reads 2.68 over its worst bar and the caveat mark 2.77, and on `track` 7.09 and
  7.33;
- the title bar's version, in the quiet ink at `opacity:0.7`, reads 3.77 off `raised`, where the
  token alone reads 6.28; the sides strip's label stood at `opacity:0.8` in the same ink.

## Decision

Decided with the maintainer on 2026-10-08.

**Every cell a bar can reach is printed in the plain ink.** The rank, the turn mark and the share
take `text`, as the name and the figure already did. The share keeps the quiet ink in the window
beside the panel, whose rows have no bar.

**A signal mark whose ink is its meaning stands on a ground of its own.** The suspect mark and the
caveat ring are drawn over `track`, which no bar reaches, rather than taking the plain ink: in the
plain ink they would stop saying what they say.

**No word is drawn through an `opacity`.** The version and the sides label lose theirs and keep the
quiet ink, which clears the floor at full strength. A bar's fill is dimmed and prints no word, so it
keeps its tint.

**The test reads the ground a cell stands on and the opacity it is drawn at.** Every cell of a
ranking row is held over every bar the sheet can draw, each hue at each tint a rule gives a bar, and
every ink is composed over its ground at the lowest opacity any rule gives the element before it is
measured. An element dimmed in an ink no rule names is refused, because nobody could check it.

Rejected: **a lighter quiet ink.** develop ADR 0065 measured it over the whole palette: the last
neutral grey that clears the floor over every bar is indistinguishable from the plain ink, so it
would end the distinction the quiet ink exists for.

Rejected: **cutting the bar short of the rank and the share.** The bar's length is the row against
the biggest figure on screen (`DESIGN.md`), and a bar that starts or stops at a cell would no longer
say that.

## Consequences

- A ranking row reads brighter at its two ends: the rank and the share no longer recede.
- The release screenshots move at the next `panel:shots --release`.
- The figures above are this record's; the test recomputes every pairing on each run, and a token or
  a palette change that breaks one turns it red.
