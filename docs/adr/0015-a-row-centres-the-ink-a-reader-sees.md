# 0015. A row centres the ink a reader sees, and it takes the whole panel onto the pixel grid

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

A reader looking at the panel in Chrome reported that the text inside a bar sits high: the air over
it is visibly shorter than the air under it.

**ADR 0014 had already measured that and answered it no.** The row's box is centred exactly, and the
ink inside it is not — caps start 4.503px down an 18px row and the baseline lands at 12.503px. That
record calls it 0.5px and leaves it, having rejected the one instrument it weighed.

The figure it weighed was the **computed** one. Counting device pixel rows off a screenshot instead,
Chrome 152 on 2026-08-29, `dist/preview.html` at `2026-08-12-tempest-grupa-vs-hildur-1.json`, device
scale 1, the ranking's bar is 18 rows, the figures printed on it are 8, and they sit **4 rows down
with 6 under them**. What the reader sees is a whole pixel out, because **Chrome paints a text box
at a whole device pixel** and a correction under one does not cross a boundary.

**The first answer to that was two pixels of padding over a row's contents, and it was wrong.** It
put the ranking at 5 and 5, and the same reader came back with the screen one level down: `KOMU`,
under a combatant opened from the ranking, still read 4 and 6. Measured there, the bar is painted at
rows 153…170 and the figures at 157…164.

The reason is in the row's own position. On the ranking a row's top is `113.219`; one level down,
where a crumb stands over the list, it is `152.562`. **Chrome rounds a box and the glyphs inside it
separately**, so at `.219` the bar snaps up to 113 and stays under its text, while at `.562` it
snaps up to 153 and takes a pixel out from over it. A padding measured against one fraction is wrong
at every other one.

Those fractions are ours. The panel stated its line heights as factors — `11px/1.35` in the body and
`11px/1.2` in the title bar — so a line box was 14.85px and 13.2px, and **every box in the panel
stood off the pixel grid**, at a fraction that changed with what each screen puts above its list.

## Decision

**Every line height in the panel is a whole number of pixels**, stated as one: `15px` in the body
and `13px` in the title bar. Padding, borders and the row's own height are already whole, so with
the line boxes whole every box in the panel lands on the pixel grid and a bar and its ink round
together.

**On that grid a row carries `ROW_INK_DROP` over its contents and nothing under them**, against a
`border-box` height, and it is one pixel. The arithmetic is exact and the paint has nothing left to
round: with the face's ascent, descent and cap height as Chrome reports them for `system-ui` at 11px
here — 10, 3 and 8 — a drop of `P` puts the baseline at `9 + (ascent - descent) / 2 + P / 2`, which
at `P = 1` is 13.0 in an 18px row, with the caps at 5.0. Five over and five under, whatever the line
height is: `P` is `cap - (ascent - descent)` and the line height cancels.

The row's **border box stays `rowHeight`**, so a list is still as tall as the rows it promises and
ADR 0014's arithmetic is untouched.

## Consequences

- **Every bar on every screen reads 5 device rows over the figures and 5 under**: the ranking, the
  screen under a combatant, the screen under a skill, the fight shelf and the pinned block, counted
  the same way on the same page. Every row on all five now sits at a whole pixel.
- **A line box grows 0.15px in the body and loses 0.2px in the title bar.** A section heading is the
  one place it shows: its line box was 13.5px at 10px type and is now 15px, so the heading stands
  21px rather than 19.5px. The air ADR 0014 gave it, 4px over and 2px under, is unchanged — what
  grew is inside its own text box.
- **The drop is right for the face `system-ui` resolves to here**, because
  `cap - (ascent -
  descent)` is a fact about a face. A face whose descent sits differently wants a
  different drop, and the guard therefore holds the **shape** — whole-pixel line heights,
  `border-box`, the drop carried above and nothing under, and a row whose cells land on a whole
  pixel — not the number.
- **One box can still land off the grid**, and it is the list when the panel is clamped by the
  viewport: `flex: 0 1 auto` shrinks it to a fraction, which moves the summary strip under it. Rows
  are laid out from the list's top, which is whole, so no bar is affected.
- `tests/ui/panel-look.test.ts` holds both halves. Nothing in the tree lays anything out, so where
  the ink lands cannot be guarded; the figures above are what a screenshot re-takes.

## Alternatives

**`text-box: trim-both cap alphabetic`.** ADR 0014's, and still rejected for the reason it gives:
`.row-name` carries `overflow: hidden` for its ellipsis, a trimmed box ends at the baseline, and
`Wyjagpy Jgpq` renders as `v lapa`. Rendered again under this round's change, with the same nickname
and `Śćźęłó ygpqj` beside it, every tail and every diacritic is drawn whole.

**Two pixels of drop, and leave the line heights as factors.** What this round tried first. It puts
the ranking at 5 and 5 and leaves `KOMU` at 4 and 6, because it corrects for one screen's fraction
and there is a different one on the next screen. The finding is that a fraction cannot be corrected
for — it has to stop being there.

**One pixel of drop, and leave the line heights as factors.** The arithmetic's own answer, and
invisible: at `113.219` it moves nothing a reader can see, which is what sent this round looking at
paint rather than at layout in the first place.

**Round the fractions away region by region**, giving each a whole height. Rejected: it is the same
fix written once per region, with nothing holding a new region to it, and the fractions all come
from one place.

**Leaving it.** What 0014 decided, on a figure that was true and was not the one a reader sees.
