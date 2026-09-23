# 0112. A status says that it stands, and only two rows count turns

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

**ADR 0109** gave a status row in the tooltip the length its evidence supports: how far through an
announced cast is on the bearer, or the help's published length counted down from the moment the bit
lit, held at a floor of `1 z 5 tur` once the count reached it.

A reader reported the poison count wrong: a hit from whoever poisons renews the poison, so it runs
five turns again. Read on 2026-09-23, the report is right about the game and the row could not
follow it:

- **The help says what applies it, twice.** The weapon attributes `poison1, of_poison1` _są
  aplikowane na 5 tur po trafieniu przeciwnika obrażeniami o niezerowej wartości_, and the skill
  effect `poisonbon_poison-perw` _nakłada na przeciwnika obrażenia od trucizny na 5 tur_ on the same
  condition (article `view,372`). `frozen/skill-durations.ts` puts that effect on two skills, 82 and
  232 — Zatruta strzała.
- **The recordings follow the skill.** Over `captures/`, 24 closed runs of the poison bit, counted
  in the bearer's own turns from the last hit by what first lit it: 17 end at four or five, where
  counted from the lighting they reach 26. The same hunter's ordinary hits do not renew it — the bit
  goes out one to three turns after one, and six times in the very payload that carried one.
- **A weapon's application is invisible.** Poison from a weapon never shows as a figure in the hit;
  it arrives only as the tick. Nothing in a payload says who carries such a weapon, and learning it
  from which hit coincided with a lighting drew false renewals and wrong lengths.

So a count on a status row is exact only where nothing unannounced renews the status, and nothing in
the payload says when that is. The mask says a status **stands**; the game already knows that, and
draws its own icon for it.

## Decision

**A status row in the tooltip says that the status stands**, by the client's own name for it, and
the figure a cast over the bearer comes to where `core/carried-figure.ts` gives one. **No status row
counts turns**, from a cast, from the help, or from the mask.

**Two rows count turns, and only two**: a provocation — whose shout this add-on sees cast and counts
on the held character's own turns (**ADR 0103**) — and Dotyk anioła, whose lighting it sees. Both
keep **ADR 0109**'s `N z M tur`, what is left.

This supersedes **ADR 0109** for status rows; its shape for a counted length still binds the two
rows above. The decision is the maintainer's, 2026-09-23.

## Consequences

Easy: a status row can no longer be wrong about time, because it says nothing about it.
`TURNS_STATED_BY_STATUS_NAME` and the cast-dated length in `core/carried-figure.ts` go with the rows
they fed.

Hard: a player loses the countdown on a poison that nothing renewed, which was exact. That is the
price of not drawing the same shape where it was a floor.

Also: the mask's own count (`CarriedStatus.turnsElapsed`) is still read — the rounds under `design/`
measure with it — and is drawn nowhere, as ADR 0109 already had it.

## Alternatives

**Renewing the poison on a hit by a skill carrying `poisonbon_poison-perw`.** Exact for Zatruta
strzała, and the corpus backs it; wrong for a weapon's poison, which renews unseen, and the row
would show the two the same way.

**Keeping ADR 0109's floor.** It never overstated, and it read `1 z 5 tur` for the rest of a fight
in which the poison kept being renewed — which is what the reader reported as wrong.
