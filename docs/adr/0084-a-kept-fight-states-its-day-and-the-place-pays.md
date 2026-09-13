# 0084. A kept fight states its day, and the place pays for it

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

The shelf holds up to twenty fights (`MAXIMUM_KEPT`, `src/game/kept-fights.ts`) and a pinned one
stays until the reader unpins it, so a shelf spans days as a matter of course. Every row stated the
hour and the minute and nothing else — `21:05` over `21:05` over `21:05`, three fights that may be
three days apart reading as three fights in one evening.

The moment was never missing. `KeptFight.openedAt` is a millisecond epoch and has been since the
shelf was written; only the hour and the minute were ever read off it (`readClockFromPage`).

## Decision

**Every kept row states the day in front of the time, as `13 wrz 21:05`.** The live row keeps its
own word, `teraz`, because a fight going on now is not dated by anything.

**The day is on every row, not only on the rows that are not today's.** The alternative below was
the cheaper one and it was rejected: two row shapes in one column is a reader working out which
shape they are looking at before they can read either, and the shape changes under them at midnight
without the shelf having changed at all.

**The month is a word and the day is two digits.** `13 wrz 21:05` is twelve characters whichever
month and whichever day it falls on, which is the argument the clock already made for itself — _a
column of times jumping between four and five characters reads as a column of different things_. Two
numbers either side of a separator would have been shorter and would have asked the reader which
half was the month. The twelve are three letters each, so the column stays one width all year.

⚠️ **The place is what pays, and it pays more than the character count suggests.** `.row-time` is
`flex:none` and `.row-name` is the only cell allowed to shorten (`DESIGN.md`), so the whole of the
day comes out of the map name. Measured in Chrome on the e2e fixture, 2026-09-13, over the same kept
row drawn both ways: the time cell goes from 36 to 76 pixels of a 244-pixel row, and the place falls
from 65 pixels to 25 — where `E2E (1, 1)`, ten characters, ellipsises. It did not before. A real map
name is longer than that, so **on a dated row the place is a hint and the tip is the answer.** This
is the cost **ADR 0023** refused for the suspect mark, taken here on purpose: the mark was a
qualifier a row might carry, and this is the answer to _which fight am I looking at_.

**What keeps it affordable is that the place is not lost.** The shelf row's tip already exists to
hand back the name its cell had to cut, and it was drawing the whole place before this decision.

**A day nobody can name is no date at all.** `readClockFromPage` answers `null` where the page's
clock will not give a day or a month, and `getWordsForShelfTime` answers the empty string for a day
outside the calendar or a month outside the twelve — the refusal `00:00` has always had, extended to
the half in front of it. Neither ever prints a number in place of a word it could not find.

## Consequences

**Nothing stored changes and no shelf is dropped.** `SHELF_VERSION` stands: `openedAt` already held
the day and this only reads more of it, so a shelf written by the version before this one draws
dated rows without being touched.

**The twelve month words are held by the L3 guard.** They are spelled into a template, which
`tests/ui/panel-words.test.ts` says reaches no walk over its tables, so each of the twelve is pushed
through `getWordsForShelfTime` there by hand. A thirteenth would fail that test rather than reach a
reader.

**The clock shape is named once.** `FightMoment` in `src/ui/panel-reading.ts` replaces the inline
`{ hour, minute }` that had been spelled in seven places across three files; widening it was the
change, and it is now one edit rather than seven.

No browser floor moves. The day is read with `getDate` and `getMonth`, which are as old as `Date`,
and `docs/browser-support.md` gains no row.

## Alternatives

**A date only on the rows that are not today's.** Today's fights keep the bare `21:05` and older
ones carry the day, which is how the suspect and turn marks already work — drawn only on the rows
they reach, never taking width from every row (**ADR 0023**). Rejected on two counts. It needs a
_now_ to pivot on, which is a second clock read and a row whose wording changes at midnight while
the fight it describes has not moved. And it puts two shapes in one column: a reader scanning the
list has to notice which rows carry a date before the dates mean anything, which is most of what the
date was for.

**A day heading over each group of rows.** Costs no row width at all and states each day once. The
honest runner-up. Rejected as too much structure for the size of the answer: the list is walked by
presses, tips, the scroll position kept by name and the e2e crawl of every control, and a row that
is not a fight has to be excluded from each of them. `MAXIMUM_SHELF_ROWS` would stop being
`MAXIMUM_KEPT + 1`.

**The date in the tip alone.** The tip's `subtitle` was empty and the shelf row's tip already
exists, so this was free. Rejected because it does not answer the complaint: two fights a day apart
still read as neighbours, and a reader has to point at each row in turn to find out they are not.

**`Intl.DateTimeFormat` or `toLocaleDateString`.** Rejected. The panel is Polish by construction and
its clock is already hand-rolled rather than localised; a locale-dependent string would draw
whatever the reader's browser is set to under a panel that is Polish everywhere else, and it would
put a row with three measured version numbers into `docs/browser-support.md` to buy nothing.
