# 0096. The name a card opens with folds, and the count folds with it

- **Status:** Accepted
- **Date:** 2026-09-18

## Context

**ADR 0084** put the day in front of the hour on every kept row, and took the width out of the one
cell allowed to shorten. It stated the cost and accepted it: measured in Chrome on the e2e fixture,
2026-09-13, the place cell fell from 65 pixels to 25, where ten characters already ellipsise. What
made that affordable was written into the decision — _on a dated row the place is a hint and the tip
is the answer_, and _the shelf row's tip already exists to hand back the name its cell had to cut_.

The card was not handing it back. `composeShelfRow` passes the whole place into the reading, and
then the sheet cut it a second time: `.tip-name` carried `overflow:hidden`, `text-overflow:ellipsis`
and `white-space:nowrap`, so the answer to a cut name was a cut name. The same rule stood over every
card's name — a person's, a skill's, a kind's and the crumb's — against a line of `DESIGN.md` that
promises each of them the name its own cell had to cut.

The reason it had not simply been deleted is the height. A card is counted, never measured: the
lines the draw counted times what a line costs, written onto `--MargoMeter-tip-height`, which is
what `composeTipTop`'s `clamp()` keeps the card's foot on the screen by and what `composeTipWithin`
trims runs against. `getTipSize` opened with `let lines = reading.subtitle === null ? 1 : 2` — the
name and the line under it were each **assumed** to be one line. A name folding against a count that
reserved one line is a card standing lower on the screen than it is tall, losing its last line with
no scrollbar and no mark, because the box carries `overflow:hidden` and takes no pointer.

The line under the name was already in that state. `.tip-subtitle` spells no `white-space`, so it
has always folded, and it was always counted as one.

## Decision

**The name a card opens with folds, and the arithmetic counts the lines it folds to.** The sheet
states `overflow-wrap:break-word` and nothing that cuts. `getTipSize` counts the name on a floor of
its own and the line under it on the floor a sentence already uses.

**The name's floor is lower than a sentence's, because the name alone is drawn bold.**
`NAME_CHARACTERS_PER_LINE` is 27 against `NOTE_CHARACTERS_PER_LINE`'s 32. Measured in Chrome 152 on
2026-09-18 at 240 pixels of type — the 250px bound less the card's padding and its border — over the
31 names `captures/` carries, composed into the place shape a shelf row states and read at every
prefix length: 2,211 readings, of which 27 under-counts none and 28 under-counts four.

**Counting low is the direction this is wrong in.** A card reserving a line it did not need stands
higher up the screen, which is the direction that keeps it on one.

**Every card's name folds, not the shelf's alone.** The promise `DESIGN.md` makes is made to the
skill, the kind and the crumb in the same sentence.

## Consequences

**No card in `captures/` changes height.** The longest name any recording carries is 25 characters,
under the floor, so the corpus exercises none of this: `deno task panel:cards` reads the same 1,208
cards at the same median of 24 lines and the same tallest at 31, before and after. What folds in a
real game is the place, and a place reaches the panel off the game's own page state — no recording
carries one. That is why the claim that holds this is in `tests/e2e/` and not in a unit test: a fake
document folds nothing, so it reads a name that is whole while the browser draws one that is cut.

**A floor over characters cannot see where a line broke.** What it is short by is a name whose last
word is long, and the margin between 27 and the measured capacity is what absorbs that. The one case
measured past the margin is an unbroken run of capitals: 60 of them draw four lines and count three.
A real name is not that, and a card carries the air to survive one line of it.

**The shelf's card can give nothing up.** `composeTipWithin` drops whole runs, and a shelf card has
none — `groups: []`. A name tall enough to overflow a short window therefore stands clipped and says
nothing, where a ranking card in the same window would give up a run and say so (**ADR 0054**). This
was already true of a card with fewer than two runs and is now reachable by a long enough name.
Nobody has seen it; it is written down because the next round should not have to find it.

**`docs/browser-support.md` gains one construct and no floor moves.** `overflow-wrap` is Chrome 23,
Edge 18, Firefox 49, Safari 7, read from MDN `browser-compat-data` on 2026-09-18 — years under the
stated floor of Chrome 93, Firefox 91, Safari 16, which is what puts it in the settled list rather
than in a tier.

## Alternatives

**Keep the ellipsis and hang the whole name off a `title` attribute.** No arithmetic at all.
Rejected: a native tooltip over a tooltip, on a box that takes no pointer, is a hint for a hint —
and the card exists precisely because a row's own cell had to cut.

**Widen the card for a long name.** Rejected by **ADR 0091** before this: the side a card opens on
is decided by the bound and never by the card's own width, so widening moves where cards stand, and
a long enough name would find a length that cuts anyway.

**A two-line clamp.** The height stays trivial, and the ellipsis comes back on exactly the names
long enough to need this most.

**Fold the shelf's card alone.** A second class beside `.tip-name` and a flag through `TipReading`
that every composer has to answer, with the height arithmetic made conditional on it — for a promise
already made to the skill and the kind.

**`word-break: break-all` in place of `overflow-wrap: break-word`.** Splits a word where a space was
free, so an ordinary place name breaks mid-word.

**`overflow-wrap: anywhere`.** Its only difference here is that it shrinks the min-content width,
and the card is laid out at `max-content` under a bound. It would buy nothing and cost support:
Chrome 80, Firefox 65, Safari 15.4 against `break-word`'s Chrome 1, Firefox 3.5, Safari 1.

**Count the name by wrapping its words greedily rather than by `ceil(characters / floor)`.** It
models raggedness and the broken word exactly, and it is what the sheet really does. Rejected for
the shape the tree already uses for a sentence, and because the margin in the floor is what absorbs
raggedness there too — with the cost stated above rather than hidden.

**Measure the drawn name.** Correct by construction, and rejected for the reason **ADR 0091**
rejected it: it widens `PanelElement` for a number a pinned edge does not need, against a panel
whose height is arithmetic by design.
