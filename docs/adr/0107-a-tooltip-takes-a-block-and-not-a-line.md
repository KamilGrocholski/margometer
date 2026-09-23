# 0107. A tooltip takes a block, and not a line

- **Status:** Superseded by 0111 in part, and by 0115 in part
- **Date:** 2026-09-22

## Context

**ADR 0105** decided _one line, into the tooltip the game already shows_, and everything else it
decided still stands: the sentence is composed in `src/ui/panel-words.ts` so **L3**'s guard holds
it, it is written after the engine's own call, it opens with the add-on's name, a label carrying
markup is refused rather than escaped, nothing is read back, and a detach undoes nothing. This
record moves one clause of it and leaves the rest where it is.

The `design/dziesiec/` round asked what that line says beside **one fighter when both sides are
full**, and measured it over `captures/` (`design/dziesiec/measured.json`, 2026-09-21):

- A fighter has more than one thing to say in most payloads that restate them: the block runs to two
  rows at the median, four at nineteen of twenty, and seven at its tallest.
- Written as one sentence, those seven ran to **93 characters** — inside a tooltip the game sizes
  for a name and a profession.
- A fabricated ten a side stands **eleven**, so a bound taken off what the corpus had seen would
  have been one row under what was already happening.

The second measurement is what decided it. A line that long does not read as a list of facts; it
reads as a paragraph, and a reader hovering a fighter for a second reads the first two words.

## Decision

**One row per thing the add-on has to say, and one `concatTip` call per row.** The client writes
`allTips[id] + "<br>" + row` (production build `Bb28FQty`, read 2026-09-21), so the break between
rows is the game's own and a block of them costs this add-on **no markup at all** — which is what
keeps `SECURITY.md`'s _no node is made, moved, removed or styled_ true word for word.

**The name takes a row of its own.** Folded into the first row it indents that row past the others,
and the block stops reading as a list of one thing each.

**The rows stand in the order a reader acts on them**: the okrzyk changes whom somebody strikes
next, a status changes how they strike, a legendary bonus is spent or nearly over, and the turns are
the only row about the whole fight rather than about now.

**A fighter with nothing to say is not written to at all**, because an empty block still costs a
`<br>` of theirs.

**The block is clamped, never asserted.** `MAXIMUM_TOOLTIP_ROWS` is composed from the parts — the
statuses the client registers, plus the six rows beside them — and a fighter with one thing more to
say loses the row rather than stopping the panel (**A11**, **ADR 0051**).

## Consequences

The tooltip a player hovers is longer than the game made it, and on a fighter carrying a lot it is
noticeably longer. That is the cost, and it is paid to the one surface where the reader's own
character is named for us by the thing they are pointing at.

A row is now the unit, so anything the add-on learns to say lands as one more row rather than as a
longer sentence — which is how the two legendary bonuses and the turns arrived without this record
moving again.

Somebody adding a row owes the bound a part: `ROWS_BESIDE_THE_STATUSES` is a count of named rows,
not a number chosen to fit, and `tests/game/engine-tooltip.test.ts` holds the writer's own maximum
level with the composer's.

## Alternatives

**One dense line, as ADR 0105 wrote it.** It costs the tooltip one line instead of up to fifteen,
and it was the shape in hand. It lost on the measurement above: seven things came to 93 characters,
and the round's `Uklad` sheet drew that against the block for comparison. A reader cannot scan a
sentence for the one fact they hovered to find.

**A block shaped in columns**, label left and figure right, as the panel draws its own rows. It
reads best of the three and is refused outright: a column is markup, and this add-on writes a string
into somebody else's HTML. `SECURITY.md` owns that refusal.

**A window of our own over the board.** Rejected in **ADR 0105** and not reopened here — its reasons
are unchanged by how many rows the block has.
