# 0014. A region holding rows is inset equally, and its height carries only rows

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

A reader reported that the panel's bars looked wrongly placed down the panel. Measured in Chrome 152
on 2026-08-29 against `dist/preview.html` at `2026-08-12-tempest-grupa-vs-hildur-1.json`, over the
shadow root with `getBoundingClientRect`:

| Region              | Over the first bar | Under the last |
| ------------------- | ------------------ | -------------- |
| `.list`             | 5px                | **21px**       |
| `.pinned-region`    | 4px                | **9px**        |
| `.MargoMeter-sides` | 5px                | 7px            |

Two independent causes, which had looked like one defect:

**The height reserved the padding a second time.** `:host` sets `all: initial`, which resets
`box-sizing` to `content-box`, and the list's rule never set it. Its height read
`calc(rows * (rowHeight + half) + spaceLarge)`, and `spaceLarge` was `12px` — exactly `spaceRegion`
down plus `spaceRegion` across, the list's own two paddings. Padding stands outside a content-box
height, so those 12px were reserved twice: once as padding and once as content nothing could fill.
The list stood 244px tall around 220px of rows and the slack fell under the last bar.

**Both regions holding rows asked for a longer step underneath than above.** Each spent
`spaceRegion` across — `7px`, the token `DESIGN.md` defines as the inset **across** the panel — as
its `padding-bottom`, while insetting the top by a shorter step. On top of that, `.row` carries
`margin-bottom: spaceHalf`, and the **last** row in a region carries it too, so the space a reader
sees under the last bar is that margin plus the padding. Neither rule carried a comment saying why,
which under C2 means the reason was never written.

## Decision

**A region that holds rows is inset underneath by what insets it above, less the margin the last row
carries.** One helper composes that, and the two regions holding rows spend it; a region holding no
rows is inset equally on both ends. The one deliberate exception is the section heading, whose air
below belongs to the rows it names — stated at the rule, because a round evening out the regions
would otherwise flatten it.

**A list's height is the rows it promises and nothing besides.** No term for the padding, because
`content-box` already puts the padding outside the height.

`spaceLarge` is deleted. Its only consumer was the term above, and its stated meaning — "what a list
costs beyond the rows it promises" — was the defect written down as a design token.

## Consequences

- The two regions read 5px and 4px at both ends, measured the same way on the same page. The ranking
  still promises eleven rows and shows exactly eleven: the content box is now `11 × 20px = 220px`,
  where before it was 232px and offered a sliver of a twelfth.
- `DESIGN.md`'s token table loses a row. Anything wanting `12px` again spends two tokens and says
  which two.
- **The panel gets its first guard that adds up a rule.** `tests/ui/panel-look.test.ts` reads the
  composed sheet, resolves the tokens and the one subtraction an inset spends, and holds both rules
  above. Nothing in the tree lays anything out, so this is what stands in for a browser; a defect
  that needs layout to see is still invisible to the gate.
- Comment share put `src/ui/panel-look.ts` over C5's ceiling, which is what produced this record.

## Alternatives

**`box-sizing: border-box` on the list, keeping the padding term.** Arithmetically equivalent and
rejected: it keeps a coupling between the height and the two paddings that nothing enforces, so
changing an inset silently changes how many rows fit. Dropping the term removes the coupling instead
of restating it.

**Leave the bottom insets and shorten the top ones to match.** Rejected: it takes 2px off the top of
every region to fix a gap under it, and the top insets were the ones already agreeing with
`DESIGN.md`.

**Even out the section heading too.** Rejected: 4px over and 2px under is what binds a heading to
the rows beneath it, and a heading equidistant from both sides reads as belonging to neither.

**`text-box: trim-both cap alphabetic`, to centre the ink rather than the box.** The row's text box
is already centred exactly — `.row-name` measures 14.844px tall at 1.578px from either edge of the
18px row, Chrome 152 on 2026-08-29 — but the ink inside it is not: caps start 4.5px down and the
baseline lands at 12.5px, so the cap band's centre is 8.5px against the row's 9.0px. The trim fixes
that and nothing else does, being the only instrument independent of the face `system-ui` resolves
to: with it the box measures 8.0px at 5.0px down, and the cap band's centre is 9.0px exactly.

Rejected, and the reason is not the 0.5px. `.row-name` carries `overflow: hidden` for its ellipsis,
and a trimmed box ends at the baseline: `clientHeight` 8 against `scrollHeight` 15, so 7px is
clipped. Rendered on the same page, `Wyjagpy Jgpq` came out as `v lapa` — every descender cut flat.
`overflow-y: visible` is no escape, because beside `overflow-x: hidden` it computes to `auto`.

Applying it to `.row-rank` and `.row-value` alone, which carry no `overflow`, was rejected with it:
it centres two cells and leaves the name 0.5px high, trading one offset the whole row shares for a
misalignment inside a single row.

It would also move the cosmetic floor — Chrome 133, Firefox 154, Safari 18.2 (browser-compat-data,
read 2026-08-29) against a floor standing at Chrome 121 and Firefox 97 — which `AGENTS.md` puts
under Ask first. That cost was never reached: the clipping settles it.
