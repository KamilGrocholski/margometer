# 0031. The list scrolls without drawing a scrollbar

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

`.list`, `.pinned-region` and `.MargoMeter-sides` each asked for `scrollbar-gutter: stable` and
`scrollbar-width: thin`. Only the first can scroll; the other two carry `overflow: hidden` and
reserved a gutter solely so that a bar drawn in any of the three came out the same length.

The panel is `260px` with `box-sizing: border-box`, so a gutter is taken out of the panel rather
than added to it, and `spaceRegion` is `7px` a side. A reader therefore met `7px` of air on the left
of a row and the gutter plus `7px` on the right. The width comes off `.row-name`, the one cell that
is `flex: 1` with an ellipsis, so the gutter was being paid in characters of somebody's nickname.

What a gutter costs, measured on a 200px box as `200 - clientWidth`, in Chrome 152.0.7977.64 and
Firefox 140.13.0esr, both read on 2026-08-31:

| What the sheet spells                                | Chrome 152 | Firefox 140 |
| ---------------------------------------------------- | ---------- | ----------- |
| `scrollbar-gutter: stable` + `scrollbar-width: thin` | 10         | 6           |
| `scrollbar-gutter: stable`, no `scrollbar-width`     | 15         | 12          |
| `::-webkit-scrollbar { width: 6px }`, on its own     | 6          | 12          |
| `scrollbar-width: none`, gutter or no gutter         | 0          | 0           |

Two facts out of that table decided the rest. `thin` is **10px in Chrome and 6px in Firefox**, so
the panel was quietly costing the engine most people play in four pixels more than the other. And
from Chrome 121 a stated `scrollbar-width` or `scrollbar-color` makes the engine **ignore**
`::-webkit-scrollbar` — both spelled together measure 10, not 6 — so a narrower bar in Chrome is
reachable only by withholding the standard properties from it, which means an `@supports` split.

## Decision

**The list scrolls and no scrollbar is drawn in it.** `.list` states `scrollbar-width: none`; no
region states `scrollbar-gutter`, because with the bar gone a stable gutter reserves nothing and a
declaration that reserves nothing describes a panel that is not there.

**A row is inset equally on both sides**, which is what ADR 0014 says of every region holding rows
and what the gutter had been breaking in the across axis all along. A bar means one length in all
three regions because none of them gives anything up, rather than because all three give up the
same.

## Consequences

Easy: a row is 10px wider in Chrome and 6px wider in Firefox, all of it going to the nickname, and
the two engines now draw the same panel. The upper tier in `docs/browser-support.md` drops for two
engines — Safari from 26.2 to 18.2, and Firefox to the number `ErrorOptions` already asked for, so
there is no Firefox where the panel counts correctly and draws wrongly.

Paid: **nothing tells a reader there are rows below the fold.** The wheel, a touch drag and
`overscroll-behavior: contain` all work exactly as before; only the sight of the bar is gone. A
scroll shadow was offered and declined — it is a second thing to draw, and the list has been eleven
rows deep since it was built.

Paid: below `scrollbar-width`'s floor the platform bar comes back at platform width, taking that
width off the rows only while the list overflows, and `.pinned-region` and `.MargoMeter-sides` no
longer walk with it. That is the sideways jump the stable gutter existed to prevent, and it now
stands in Chrome 94-120 — a range already under the upper tier for other reasons.

Rejected, with what each cost:

- **A narrower bar in Chrome**, `::-webkit-scrollbar { width: 6px }` under
  `@supports not selector(::-webkit-scrollbar)` with `thin` kept for Firefox. Measured at 6 in both
  engines, so it works — but it buys 4px where this buys 10, puts a non-standard selector in the
  sheet against the prefix line ADR 0016's register draws, and nests braces that
  `tests/tools/browser-support.test.ts` parses by scanning for the next `}`, so the guard would have
  to be rewritten to read a rule inside a condition.
- **Dropping the gutter and keeping `thin`.** The list promises eleven rows and a ranking is usually
  longer, so the bar would be up most of the time and the 10px paid anyway — with the sideways jump
  added rather than avoided.
- **Leaving it.** Which is the 10px, stated.
