# 0069. A card says only the gaps that name its own person

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

`composeCardNoteLines` composed a card's marked lines from two lists: the gaps charged to the person
the card is about, and the fight's own, sliced at four. The fight's list is the same one the region
under the ranking draws, so one sentence was written once under the list and again on every card
that opened. On a ten-a-side fight that is eleven copies of it.

On the row that was the **reason** for the fight's gap it was written twice on one card, because the
two lists say the same thing in two grammars. A caster whose team heal nobody could size, on a
healing screen, read this:

```
⚠ Nie udało się odczytać wszystkiego z jej udziałem — 2 wiadomości bez odczytu,
  więc jej liczby mogą być zaniżone.
⚠ Nie da się rozdzielić jej leczenia drużyny — 1 uleczenie bez podziału,
  więc jej leczenie może być zaniżone.
⚠ Nie udało się odczytać wszystkiego — 2 wiadomości bez odczytu,
  więc liczby mogą być zaniżone.
⚠ Nie da się rozdzielić leczenia drużyny — 1 uleczenie bez podziału,
  więc leczenie może być zaniżone.
```

Same counts, same claim, four lines. A reader who has learned that half of a list repeats the other
half has learned to skip the list, which is the failure ADR 0051 named when it kept defects out of
the suspicion list for the same reason.

Nothing in `captures/` fires either gap — 12 201 messages over 30 recordings on 2026-09-09, none
carrying unread and no cast unplaced — so this was never visible on the material this repository
holds. It is visible to a reader the moment the game states a key the decoder has no meaning for.

## Decision

**A card carries the gaps that name the person it is about, and no others.**

`CardSubject` and `CardPlace` no longer take the fight's list; the card's marked lines come from
`composeRowSuspicions` alone, bounded by `ROW_WARNINGS` where that list is built. `ARCHITECTURE.md`
already said the half of this rule that was being kept — _"A gap naming nobody stays in the fight's
own summary"_ — and the card was the place not keeping the other half.

The region under the ranking is untouched. It goes on saying the fight's own gaps, which is where a
claim qualifying every row at once belongs.

## Consequences

The two channels now answer two questions instead of one question twice. The sentence under the
ranking says **how much of this fight could not be read**; the mark on a row and the card it opens
say **whose figure is short**. `DESIGN.md` already argued the split — the sentence under the list
"qualifies every row at once, and a reader looking at one of them had no way to ask whether it meant
theirs" — and the card was answering both.

A card over a person no gap names now carries no marked line at all, where before it carried the
fight's. That is the intended loss: the sentence is still on screen, under the list, where it always
was, and a reader who wants it does not have to point at somebody to get it.

ADR 0054's trim is unaffected and gets easier: the notes it refuses to give up are shorter, so a
card gives up a run less often.

`ARCHITECTURE.md`'s tour sentence loses "and again on every card". The compiler holds the rest: with
no field to pass, a card cannot be handed a gap that names somebody else.

## Alternatives

**Drop only the exact double.** Keep the fight's list on the card and skip any whose kind the row
already said. Refused: it fixes the two lines a reader sees together and leaves the eleven copies,
and it makes what a card says depend on what that particular row was charged with — two readers
comparing cards would see different lists for the same fight.

**Keep the fight's list on the card, and drop the row's.** Refused outright: the row's sentence is
the only thing that says whose figure is short, and it is what the mark on the row was added to open
onto.

**Say the fight's gaps on the card only where no row can carry that kind** — joined in progress,
messages lost, a cast nobody was named for. Tempting, and it keeps a card self-contained. Refused
because "which kinds can name a row" is a rule a reader cannot see: two cards would carry different
subsets of the same list for reasons invisible on screen, and the region under the list already
draws all of them unconditionally.
