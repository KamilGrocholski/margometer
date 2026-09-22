# 0110. Turns taken and turns lost stand on one line, divided and never added

- **Status:** Accepted
- **Date:** 2026-09-22

## Context

**ADR 0049** put the turns a combatant lost on the card as a sub-line: `Tury wykonane` with
`utracone` beneath it, drawn only above nought, the shape **ADR 0095** settled for a count a second
key narrows.

**Turns are not that shape.** A sub-line under a figure says _this is a part of what is above it_,
and every other one on the card is — blows behind no skill are blows, critical blows struck with the
off-hand are critical blows. A turn nobody spent is not a turn that was taken. The two are halves of
one story that may never be summed, which the card already says at its foot: _Gra nie podaje, ile
tur ktoś dostał, tylko co w nich zrobił._

**And it was drawn on exactly half the cards.** Over `captures/` on 2026-09-22, 35 recordings:
**312** combatants took a turn and **156** of them lost one, 410 lost turns in all. So half the
cards carried a second line and half did not, and the group of counters changed shape between two
cards a reader opened one after the other.

**A drawn nought is not free, and that is what decided the second half of this record.** `lost` is
read by the shape of a sentence and never by its words (**ADR 0049**), so a world wording the
announcement otherwise yields nought for **everybody** in the fight. Under 0049 that cost nothing: a
nought drew no sub-line, so nothing on screen became false. A nought written into the line would be
**E10**'s substitute for a read that never worked — `0` where the answer is _unread_.

## Decision

**One line, both figures, divided by a slash and never added:** `Tury wykonane/utracone` — `37 / 4`.

**A combatant who lost no turn reads `37 / 0`,** because the line stands either way and the nought
costs the card nothing. Under 0049 that half vanished, and a half that vanishes says only that the
panel stopped mentioning it — a reader cannot tell it from a figure that was dropped.

**The second figure stands only where this reading was heard at all, and the witness is the fight.**
Where anybody in the fight lost a turn, the shape-reading is known to work on this world and every
other nought on that fight is a measurement. Where nobody did, the card falls back to
`Tury
wykonane` and the single figure it has — the second half is unread, not none. The witness is a
**boolean and never a count**: `CONTEXT.md` forbids a fight-wide total of turns, and what is needed
here is whether the reading fired, not how often.

**The slash never breaks**, on the space `composeFigureText` spaces thousands on: a figure folded
across two lines reads as a number half its size (`DESIGN.md`).

**There is no third figure, and there is no room for one.** `wykonane + utracone` is not the turns
the game granted somebody — 0049 said so, `CONTEXT.md` says so under _Turn_, and
`docs/turns-taken.md` keeps `granted` in a register measured off the game's own numbering and draws
it nowhere.

**This takes the drawing half of ADR 0049 and leaves the rest standing.** How a lost turn is read —
by the shape of the sentence and never by its words — is untouched, and so is its refusal to let the
two figures be added.

## Consequences

Easy: the counters group is the same height on every card that states turns, and 156 of the 312 over
the corpus are a line shorter. The panel's own arithmetic for the card needed no change — the figure
is composed into the value cell, the way a critical rate already is, so no rule of the sheet and no
line cost moved.

Hard: **the longer label sits on the bound with nothing to spare.** A word added to it is cut by the
column with nothing saying it was cut, and the character count in `tests/ui/blow-vocabulary.test.ts`
cannot see the caveat glyph beside it — what measures the drawn width is
`tests/e2e/panel-tip.spec.ts`, in the browser (**ADR 0088**).

Hard: **the card now draws one of two labels, and a guard has to hold both.** The longer one opens
with the shorter, so a register carrying only `Tury wykonane/utracone` satisfies a bare search for
the shorter — `tests/tools/turn-count.test.ts` asks for each inside its own backticks for that
reason.

**What it still cannot say**, and this is the cost that remains: a quiet fight and a world this
reading cannot hear draw the same card. Four of the 35 recordings are quiet that way, 2026-09-22.
Nothing on screen is false there — the second figure is simply absent — but nothing says which of
the two it is either.

**A second witness was looked for, measured, and put where it does reach.** The protocol's own stun
keys are language-free, so they were the candidate for licensing the nought in a quiet fight. They
cannot: the corpus carries **140** stuns against **410** lost turns and six recordings read lost
turns with no stun at all, so their absence is no evidence that nothing was lost. The direction they
**do** hold is the other one — **25** of the 35 recordings state a stun and every one of them reads
a lost turn as well, the closest being four lost against five stuns. So a stun stated with nothing
heard is the shape-reading having stopped working, and that is now a red gate
(`tests/tools/turn-count.test.ts`) rather than a quiet nought, which is the failure **ADR 0049**
named and could not see. The quiet fight stays illegible; the broken reading no longer is.

## Alternatives

**Keep the sub-line.** It is the shape ADR 0095 argued for, and the argument does not reach: that
rule exists because two rows of one count made a reader add them, and these two may never be added
at all. It also leaves the shape jumping between cards on half the corpus.

**Draw the nought unconditionally.** One rule instead of two, and it was the first cut of this
record. Refused: on a world worded otherwise every card would read `/ 0` and state as measured a
thing nobody measured, which is exactly what **E10** is about.

**License the nought off the stun keys.** Measured and refused, above: their absence says nothing,
because a turn goes missing for more reasons than this key. They earned a guard, not a figure.

**Carry the witness as a count in `FightStatistics.totals`.** It would be one line in the aggregator
and free at the panel. Refused: `CONTEXT.md` says a turn has no fight-wide total, and the question
here is not how many — it is whether the reading fired at all, which a boolean answers without
inventing a figure somebody would later divide by.

**A third figure, `przyznane`, as the sum.** Refused. It is the one number this register is built to
say nobody has, and the sentence at the foot of the card denies it in the reader's own language.

**A `TipLine` that holds several cells.** It draws the same thing and costs the card's DOM, the
sheet, `getTipLineCost` and a measurement of its own in the browser. The value cell already takes a
composed figure elsewhere — `912 (34%)` for a critical rate — so nothing new was needed.

**Drop `Tury` and word the longer label `Wykonane/utracone`.** Seventeen characters, and room to
spare. Refused: `wykonane` is the game's own verb for this count and `Tury` is what says these are
turns at all — `tests/tools/turn-count.test.ts` holds the labels against the register that argues
for them for that reason.
