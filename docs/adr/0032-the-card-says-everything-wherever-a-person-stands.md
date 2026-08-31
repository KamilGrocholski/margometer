# 0032. The card says everything, wherever a person stands

- **Status:** Accepted
- **Date:** 2026-08-31

## Supersedes

[0019](0019-the-card-answers-the-screen-it-stands-on.md), which had one run of the card be the
screen's and the healing screens carry none, and which was decided the day before this one.

## Context

0019 cut the card to the screen it stands on, and the panel was rewritten around it. Two things
about that turned out to be wrong on the material, and one of them is not a matter of taste.

**Three-quarters of what the card can say is hidden.** Measured over `captures/` on 2026-08-31, 265
ranking cards per screen: on _obrażenia zadane_ 248 of them carry a struck run the screen was
refusing to draw, a mean of 2.5 lines and at most 6; on _obrażenia otrzymane_ 244 carry a striking
run, a mean of 5.9 and at most 11; on both healing screens every one of the 265 carries both, a mean
of 8.4 lines and at most 15. A reader on a healing screen was told how much somebody healed and
nothing whatever about how they fought, and the released 0.10.1 told them.

**The card stands on one row in four.** It is composed on a ranking row alone, so of the rows a
reader meets one and two levels down, 2,529 stand for somebody the roster holds — 2,066 in the ends
an opened figure reached and 463 under an opened skill (`captures/`, 2026-08-31) — and every one of
them opened a name, a figure and a share. v0.10.1 composed the same card at all three levels. The
rewrite dropped it, and nothing recorded that as a decision.

The bound the card is drawn against is 64 lines, and the tallest card 0019's shape composed was 25.

## Decision

**The card is the same wherever a person's row stands, and it states both runs on every screen. The
screen decides which of the four figures is bold, and nothing else.**

- Both runs stand, each under a heading naming its end — what they did when they struck, and what
  happened when somebody struck them. A run that came to nothing is not drawn, and neither is its
  heading.
- The card is composed for a ranking row, for a person in the cut an opened figure reached, and for
  a person under an opened skill. **A row with nobody behind it has no card**: a skill, a kind, an
  end the protocol left out and a fight on the shelf keep the name their own cell had to cut.
- **A card standing over a row that states a narrower figure says so**, in one sentence under the
  doubts and over the instruction. The card is about the person and its figures are the fight's; the
  row under it is one cut of them, and on the ranking the two are the same number.
- The instruction goes on being drawn only where pressing leads somewhere, so a card on the last
  rung promises nothing (`docs/drill-levels.md`).

**What 0019 decided and this record keeps.** Which end a proc belongs to is read per key from
`docs/protocol-keys.md` and never from its sign — `+legbon_curse` fires when its holder attacks and
`-legbon_cleanse` when its holder is struck, on messages of one shape — and a key the register
refuses an end is charged to nobody. A rate is taken of **blows**, because nothing here counts a
turn (`PRODUCT.md`). Points of armour and percentage points of resistance stand under a heading and
never under a sum.

## Consequences

- The tallest card any recording composes is 33 lines, measured over every combatant, screen and
  place a card stands in over `captures/` on 2026-08-31, against the bound of 64. `getTipSize`
  carries that measurement, and a change that raises it is read there.
- `Zatrzymane` returns to the two healing screens, which 0019 removed it from.
- The heading is what says whose a line is, so the two headings are load-bearing and not decoration:
  a card drawing both runs with neither heading reads as one list of things that fired.
- `OpponentRow` carries the figures a card states, the way a ranking row does, and one function
  composes them for both. A drill row therefore costs what a ranking row costs, which is 20 rows'
  worth per redraw at most and was already being paid on the ranking.
- The four cards of one combatant now differ only in which figure is bold. That is worth a test, and
  has one — four cards agreeing with each other agree just as well when a run has been dropped from
  all of them, so the run is also asserted on one screen outright.

## Alternatives

**0019's shape, kept.** No work, and the card stays short. Rejected on the material above: the
healing screens carry no run at all, and a reader wanting the criticals has to change tabs and lose
the figure they were reading.

**The screen's run first, the rest under it.** Everything is said, and the screen still leads.
Rejected: it gives the card two orders, and a reader comparing two combatants across two screens is
then comparing differently ordered cards — which is the confusion the bold figure already answers,
paid for twice.

**A card on every row, including a skill and a kind.** It would make one rule with no exception.
Rejected: there is nobody behind those rows. The only card composable there is the card of the
person whose level it is, which would name somebody the row does not, one line under a heading that
already names them.

**No sentence about scope.** The card would look identical at every level. Rejected: 2,529 rows
would then stand under a card whose figures are the fight's while the row states a cut, and nothing
on screen would say which of the two the reader is looking at — telling those apart is what this
panel is for.
