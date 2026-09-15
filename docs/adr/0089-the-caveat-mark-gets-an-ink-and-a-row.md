# 0089. The caveat mark gets an ink of its own, and the row whose figure is the narrower one

- **Status:** Accepted
- **Date:** 2026-09-15

## Context

**ADR 0088** granted the fourth severity and drew it in no ink at all: a caveat is an explanation
rather than an alarm, so the glyph stayed in `textQuiet`, the colour of the label it stands beside.
Looked at in a browser that is a glyph nobody sees — `textQuiet` against `textQuiet` is a contrast
of 1.00 — while the three severities around it each carry a hue. The same record refused the mark a
row of the list, citing **ADR 0023**: the row has one cell allowed to shorten and it holds a name.

Two figures decided what follows, and both were taken over `captures/` on 2026-09-15.

**A mark on every row is what ADR 0023 measured, and the caveat would have been one.** Asked which
ranking rows would wear the mark if a person's row wore it whenever their card carried any caveat
sentence, the answer is **296 of 296 on each of the four screens, 1,184 of 1,184 cards** — `turns`
on 1,176 of them, `reduction` on 1,180. That is not a near miss of ADR 0023's test; it is its worked
example with a wider glyph.

**A mark on the row whose own figure is the narrower one reaches 3.5% of the list.** Counted by
drawing every level of every recording — 1,312 of them — the mark lands on **274 of 7,903 rows**,
which is the closing row of a damage section and nothing else. The same 274 falls out of
`deno task panel:drill` a second way, as 173 closing rows on `damageDealtApplied` and 101 on
`damageTakenApplied`.

**What that costs the name was never held anywhere.** A name the panel shortens is cut with an
ellipsis, which overflows no box, so every check in `tests/e2e/` read a cut name and an uncut one
the same. Measured for the first time here: `ⓘ` is 9.5px in Chrome, against 13.36 for the suspect
mark and 9.03 for the turn mark, and with every row wearing it a level's longest skill name loses
4px to it. The row it does ride carries an eleven-character label the game never lengthens.

Also found while measuring, and reported rather than resolved (**V6**): `SIGNAL.suspect` and the
palette's fourth profession colour are the same value, `#c98500`, at a distance of nought — so
`DESIGN.md`'s "eight hues, spent on the professions and on nothing else" has not been true for as
long as the suspect mark has had a colour, and no guard holds either sentence.

## Decision

**The caveat mark is drawn in `caveat`, a blue of its own, and so is the sentence it points at.**
`#66baf6` sits 69 from its nearest neighbour among the fourteen colours the sheet spends and 70 from
the palette's own blue, and clears 8.44:1 on the panel, 7.74:1 on a card and 7.29:1 on a row. A
signal sharing a family with a profession is not a collision: a hue says who somebody is **in a
bar**, and a mark beside a figure is read against no bar.

**The mark rides a row of the list where that row's own figure is the narrower one, and nowhere
else.** Today that is the row closing a damage section. A person's row does not wear it for what
their card says, because the figure on that row is complete; the mark stands at the figure it is
about, which is what _Suspect Is Adjacent_ asks.

**One field answers both the glyph and the sentence.** A row hands over which caveat it owes, the
glyph is drawn off that field and the sentence composed off the same line by the function a card
uses, so a row cannot wear a mark nothing explains or carry a sentence no mark points at.

**The register is not the card's any more**, and it is spelled `CAVEATS` rather than `CARD_CAVEATS`.
The closing row takes the third entry, `unannounced`, and the sentence it was already saying moves
there whole — two registers of sentences for one claim is one rule in two copies.

**A note at the foot of a card carries a tone rather than a flag.** `plain`, `suspect` or `caveat`,
one field with three values, so the pair a second boolean would allow cannot be spelled. The glyph
stays inside the note's own text, where the card's height arithmetic already counts it — that half
of what ADR 0088 refused still binds.

## Consequences

The three row marks now stand on a measurement rather than on a sentence: what each costs the name
it stands before is held by `tests/e2e/panel-marks.spec.ts`, which asks the rows actually paying.
Proved by marking every row, which cut a name by 4px and turned it red.

A fourth caveat costs whatever its sentence costs in card height and nothing else, until one is owed
by a figure that is also a row — that one has to answer the width question again, and the guard is
there to answer it.

`docs/unannounced-damage.md` and `docs/drill-levels.md` describe a row that now carries a mark, and
`getNoteForUnannounced` is gone: a caller wanting that sentence asks `getNoteForCaveat`.

## Alternatives

**Keep the glyph in `textQuiet` and make it bolder or bigger.** Rejected: the three severities
beside it are told apart by hue and a glyph each, and a fourth told apart by weight alone reads as
emphasis on the label rather than as a claim about the figure. It also leaves the sentence at the
foot of the card in the same grey as every other note.

**`#0095c7`, a quieter cyan.** Clears the distance floor and reads more like an explanation than an
alarm, but sits at 4.50:1 on a row against a floor of 4.5 — it would become the thinnest pairing in
the panel and move the sentence in `DESIGN.md` that names the current one. Refused on margin.

**`#5b9ad6`, inside the palette blue's own family.** Defensible on the `suspect` precedent, and
refused because the precedent is a finding rather than a rule: writing a second one makes the
tension harder to remove rather than easier.

**A filled disc rather than `ⓘ`.** Cheaper to see at 11px and says nothing about what it means; the
circled letter carries its own word, which is what _Colour Never Alone_ asks of a mark now that the
colour says something too.

**A person's row wears the mark when their card carries any caveat.** This is what was asked for
first, and the measurement above is why it is not what was built: 1,184 of 1,184. A mark on every
row is the second channel ADR 0023 removed, and a mark that never distinguishes anything costs the
name cell for nothing.

**Widen the criterion to cover what this reading cannot reach yet** — the tick of a wound whose
skill is knowable in principle, a wide swing's further targets. Weighed and dropped as unnecessary:
the closing row qualifies under the criterion already written, because the game names no skill for
those blows whatever we read. Widening it would have put a recording-dependent claim under the one
severity `ARCHITECTURE.md` says does not depend on the recording, and no sentence dividing caveat
from suspect survives that.

**A second flag on the note beside `isSuspect`.** Refused for the reason ADR 0088 refused a claim
union: it makes a note that is both representable while nothing composes one.
