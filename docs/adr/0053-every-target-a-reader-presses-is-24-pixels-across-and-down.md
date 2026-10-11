# 0053. Every target a reader presses is 24 pixels across and down

- **Status:** Accepted
- **Date:** 2026-10-11

## Context

WCAG 2.2's Success Criterion 2.5.8, Target Size (Minimum), level AA, read on w3.org 2026-10-11: a
target a pointer activates is at least 24 by 24 CSS pixels, or stands where a 24-pixel circle
centred on it meets no other target and no other such circle. Its other exceptions — an equivalent
control, a target inside a sentence, a user agent's own, an essential presentation — fit nothing the
panel draws.

Nothing in the panel was held to it. Measured by `tests/e2e/panel-targets.spec.ts` in Chrome
154.0.8037.57 on 2026-10-11, over `captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json`,
the small step drew a bar control at 19 by 15, a strip at 17 tall, a row at 18 (19 at the middle
step), an answer in the options at 18, a shelf's pin at 17 and the way back at 15, each standing
closer to another target than the circle allows. Only the size grip, 12 by 12, cleared by spacing.

## Decision

Decided with the maintainer on 2026-10-11.

**Every target a reader presses is 24 pixels across and down.** The maintainer asked for the size,
and not for the spacing the criterion would also take: a target kept small and passed by its spacing
passes only while its neighbours stand where they do. A browser lays the panel out, so a browser
holds the rule: the spec measures every marked target at every step of type, on the ranking, an
opened person, an opened part, the shelf, the options with a window sized, and both windows folded,
and also fails on a press offered where no mark it measures stands.

**A row is 24, 25 and 27 pixels at the three steps, and what is drawn is what is pressed.** Each
step's row grows by six, which keeps `develop ADR 0015`'s drop whole: eight pixels to spare under
the line at every step. The two pixels between rows stay outside the target.

**A bar control is a 24-pixel square at every step**, so the bar stands 29 high with half the air it
had over and under its controls. The icon keeps the title line's size, raised to even so it centres
on whole pixels in the control's even inside.

**A strip and the way back stand a row high; the reset in the options and a shelf's pin take the
whole row they sit in.**

**The size grip alone stays 12 by 12, held to the spacing instead.** A 24-pixel corner covers the
sides' figures at the panel's foot, which `tests/e2e/panel-size.spec.ts` forbids, and the spec holds
the spacing at every place it measures.

Rejected: **a band of 22, 23 and 25 with the gap between rows inside the target.** It is four pixels
a row shorter, but needs a transparent edge on every row and draws a target taller than the band a
reader sees. The maintainer chose the row that is what it looks like.

Rejected: **a control's frame kept small inside a larger hit area.** A target nobody can see the
edge of is a size the panel does not show.

## Consequences

- `TYPE_TOKENS`, `calculateControlHeightPixels` and `calculateBarHeight` in `src/ui/panel-look.ts`
  change, and so does every height counted in rows: the ranking stands six pixels taller a row.
- `TARGET_PIXELS_MINIMUM` names the least, and `tests/ui/panel-look.test.ts` holds the row and the
  bar control to it without a browser.
- `screenshots/` is taken again at the next release, by `docs/releasing.md`.
- Open, and the maintainer's to take up: 2.1.1 Keyboard (`DESIGN.md`, _Accessibility_) and 2.5.7
  Dragging Movements, since a window is moved and sized by dragging alone.
