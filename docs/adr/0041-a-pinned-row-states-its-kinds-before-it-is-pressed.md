# 0041. A pinned row states its kinds on the card, before anybody presses it

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

**ADR 0039** kept a cut of each half-named figure by the key the protocol stated it under, and drew
it on the level a press opens. The card over the row went on saying what the game left out, where
the figure stands against the ranking, and — under a chosen side — what the shown team is to it.

**The question that row is pointed at is not among them.** A reader hovering `Nieznany sprawca`
wants to know what took the health, and the answer is one press away on every screen that pins a
figure. Over `captures/` on 2026-09-01 that answer is short: `deno task drill` over the whole corpus
composes 51 kind rows under the pinned rows of each damage screen, spread over 28 pinned figures —
10 of them state one key, 14 state two, 3 state three and 1 states four. There is no case in the
material where the answer needs a level to hold it.

**ADR 0039 rejected saying it on the card, and the sentence it rejected is not this one.** What it
turned down was the dominant key _instead of_ the level: _"a share stated with no rows under it is a
figure a reader has to take on faith, and this panel exists so they do not have to."_ The level was
built, and it stands. What the card states now is that level's own rows — every one of them, in its
order, with its figures and its shares — and a press checks them.

## Decision

**A pinned row's card states what its figure was dealt with, as a run of its own.**

- The run is the **same cut the level draws**, from the same walk. `composePinnedFigures` folds it
  once, beside the figure it sums, and both the card and the level under the row read that fold.
- It stands **between the figure and the sentences**, under the heading the level uses for the same
  section — `TYP OBRAŻEŃ` on the damage screens, `OD CZEGO` on the healing ones. Each row is worded
  by the table that screen's own rows are worded by, and a key no table holds arrives as the game
  wrote it (**ADR 0011**).
- **Six kinds, and what is left of them summed into one line.** A card is not a level: it is
  measured in lines and placed by arithmetic, so the run carries a stated maximum. What overflows is
  summed rather than dropped — a run short of the figure over it misstates that figure.
- **Only a pinned row gets one.** Every other row falls back on the card it had, in one run, so
  nothing else on the panel changes by a line.

## Consequences

- The panel answers, without a press, the question the row exists to raise. `zatrucie` is 89.2% of
  the half-named damage over the corpus (**ADR 0039**), and it is now read on hover.
- **The card and the level cannot disagree**, because there is one fold. A cut folded from a
  different set of people fails `tests/ui/panel-reading.test.ts` over every recording, and the row's
  own kinds are asserted to come to the row's own figure.
- **The card carries no `no kind` row and asserts it cannot.** `getHalfNamedKindBalance` in
  `src/core/fight-statistics.ts` writes every key where it writes the count, so a pinned figure's
  kinds are the whole of it (**ADR 0039**). The assertion sits where the run is composed, which is
  where a later change would break it.
- **One word runs past the label column and is cut by the sheet.** `heal` reads
  `ujemne przywracanie życia`, which is longer than `MAXIMUM_LABEL_CHARACTERS`, and it stands on
  1.4% of the half-named damage. Shortening it would move the row's own name on the level below and
  break its pairing with the restoring key of the same name, so it is cut rather than reworded. The
  height is unaffected: a line of a card is one line whatever it holds.
- The overflow line is drawn by no recording. It is reachable — `takenWithNoTarget` folds the ten
  keys a blow can carry together with the seven a bare movement can — so it is held by a fight built
  in `tests/ui/panel-element.test.ts` rather than by material.
- `docs/drill-levels.md` is untouched. No row gained a level, and the panel is still three deep.

## Alternatives

**Say the dominant key alone, in one line.** Cheapest, and it answers the common case. Rejected on
what it does to the uncommon one: a reader whose fight spread its half-named damage over four keys
would be told about one of them, and told nothing about the reading being partial. The run costs
three lines more and states the whole.

**Leave the card as it was, on the ground that the level already answers this.** Rejected on where
the answer sits. A reader hovers before they press, and a card that lists three sentences about what
cannot be known while withholding what can is a card that teaches them not to press either.

**Give the same run to the half-named row inside an opened figure.** That row keeps the same kind of
cut and would read the same way. Rejected: it does not open (**ADR 0038**), so the run there would
be exactly the figure taken on faith that ADR 0039 refused. Where a card previews a level, the level
has to be there.

**Compose the run only when a card is opened.** It is what `TipCompose` exists for, and it would
save the fold on rows nobody points at. Rejected on shape: a reading is data, and a closure inside
one is a figure nothing downstream can compare. The cost bought is two folds of at most twenty maps
per redraw, against a ranking that walks every combatant in the same pass.
