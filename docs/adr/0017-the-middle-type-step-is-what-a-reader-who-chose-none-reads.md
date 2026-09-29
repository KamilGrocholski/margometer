# 0017. The middle type step is what a reader who chose none reads

- **Status:** Accepted
- **Date:** 2026-09-29

## Context

ADR 0013 gave the reader three steps of type, 11, 12 and 13px, and kept 11px as the default. That
default was settled on 2026-09-15, when `e57c2f6` took the panel back from 13px because the
maintainer found it too big. Nobody had measured the middle step then: it came with ADR 0013, twelve
days later, with a table of its own (`TYPE_TOKENS` in `src/ui/panel-look.ts`).

The steps are released for the first time in 0.21.0. Until then no installed copy has written
`MargoMeter-type`, so every reader who updates reads the default.

The browser suite measured at the small step only. Moved to the middle one, it found two things,
measured in Chrome 154 on 2026-09-29 over the suite's recording:

- In the first opened level, `Zwykły cios` behind a caveat mark had 69.25px of the 70 it needs, and
  was cut. The middle panel was 272px, which is what its bar asks for the name, `0.20.0-dev` and
  four controls, and no more.
- The fight's line is 17px against a 16px line. Its 12px headcount and its 11px outcome and place
  are set on one baseline, and the smaller type's box stands a pixel lower. At 11 and 10px the line
  is 15 against 15, and at 13 and 12px it is 18 against 18.

## Decision

Decided with the maintainer on 2026-09-29, while cutting 0.21.0.

**A reader who chose no step reads the middle one, 12px.** 11px stays one press away in the options,
and a reader who chose it keeps it.

**The middle panel is 274px, two past what its bar asks,** so the name behind a mark is not cut. The
card's bound and the window beside the panel keep their widths.

**The fight's line may stand a pixel taller than a line at the middle step.** It is still one line,
and the pixel is where two sizes of type meet on one baseline.

Rejected: **keeping 11px and letting a reader who wants more choose it.** Every reader meets the
default first, and the maintainer wants that first sight to be the middle step.

Rejected: **13px.** That is `596f95f`'s size, which the maintainer rejected as too big.

Rejected: **releasing at 272px and leaving the cut name open.** A reader who never opens the options
would meet the cut in the first opened level of a fight.

## Consequences

- `TYPE_STEP_DEFAULT` names `TYPE_STEP.medium`. The unit tests that count a window's place or size
  in pixels take the small step by name, because their figures were worked out at 260px. The browser
  suite measures at the default and states its numbers for the middle step.
- `screenshots/` is taken at the middle step, because `panel:shots` takes the default.
- `DESIGN.md` still quotes pixels at the small step unless it says which: that is a convention of
  the page, not the default.
