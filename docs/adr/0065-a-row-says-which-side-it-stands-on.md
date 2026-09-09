# 0065. A row says which side it stands on, and its hue goes on saying who it is

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

The panel answered "whose side is this?" only away from the row: the strips that narrow to a side,
and the two figures under the list. A reader looking at a name had to move their eye off it, or open
a card by pointing, to place that person. `DESIGN.md` stated that as a decision and listed what it
had refused — the edge a bar grows from, a rule under the row, a mark before the name — on the
grounds that the two channels a row has were both spoken for.

The cost of that decision was being paid twice, and the second payment was invisible. The window
beside the panel draws people too, and it had the same problem with nowhere to put the answer, so it
took the only channel it had: `getColourForRow` painted a caster's row `ours` or `theirs` **whenever
the client named the reader's side**, and the caster's profession went unsaid. That is the one place
in the tree where a person was drawn without their own hue, and it existed only because the side had
nowhere else to go.

It also guessed. It decided which casters were the reader's own by `row.casters.slice(0, row.ours)`
— a positional read that is correct only where every caster on one side happens to have been pushed
before every caster on the other.

## Decision

**The side takes the row's right edge; the hue stays the profession's everywhere.**

A two-pixel rule at `right: 0`, inside the row's own overflow, in `ours` or `theirs`. The left three
pixels were already spoken for twice — the bar's cap at full strength, and the open row's inset
shadow — so the two edges divide the two questions: **left says who somebody is, right says whose
side they are on.**

It is drawn on every level a person stands on, and on the caster and provoked rows in the window
beside the panel. It is drawn on no row with nobody behind it, and **on nothing at all where the
client named no side of its own** — `nobody` draws no element, not a grey one.

`getColourForRow` is deleted. A caster's row wears their profession's hue, as every other person's
row in the panel already did.

## Consequences

The rule is colour, and _The Colour Never Alone Rule_ binds it, so **the card names the side in
words**: the subtitle becomes `Mag (120) · My`, using the words the strips already say to a player.
That obligation is now load-bearing in the same way ADR 0023 made the card's profession word
load-bearing — a card that stopped naming the side would leave the rule speaking alone.

**ADR 0023 is untouched.** Nothing here adds a second profession channel to the row. The profession
is still said once in the row, in hue, and in words on the card.

A fight the client named no side of the reader's own on gets none of this. That is the honest answer
and not a gap: `CONTEXT.md` says a panel that cannot tell one side from the other lists everybody
rather than guessing, and a grey rule on every row would be an answer where there is none.

The window beside the panel no longer says which side cast a skill _on the caster's row_. It still
says it where it always counted: the two figures on the skill's own row, which is what ADR 0063 made
that row for. What was lost there was a guess; what was gained is the caster's profession.

## Alternatives

**Split the ranking into two sections, headed by side.** The strongest signal and free of width.
Refused: it breaks a single ranking sorted by figure, which is what a damage meter is. A reader
comparing the two biggest numbers in the fight would have to compare across a heading.

**A dot or a letter before the name.** Refused for the reason ADR 0023 refused the profession
letter: it is paid for out of the one cell that has to shorten, and it would be paid on every row.

**The left edge, moving the cap.** The cap at full strength is the only place the profession's hue
is stated undiluted — the bar itself is tinted to `0.55` so figures stay readable over it. Moving it
would take the profession's clearest statement to make room for the side's.

**Leave the standing window painting sides and give the ranking nothing.** This is the state that
was there, and it is what made the inconsistency invisible: two windows drawing people, answering
two different questions with one channel.
