# 0023. A profession is said in one channel, and the card is the answer

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

A ranking row says who somebody is in its hue: eight of them, assigned by the game's own letter so
the same profession is the same colour in every fight. `DESIGN.md` measures that six of the eight
cannot be made mutually distinguishable on the panel's background, so a reader who cannot separate
two hues cannot separate those two professions in the row.

A second channel was there and was removed on 2026-08-29: a letter beside every name. The row is 260
pixels wide and the name is the one cell allowed to shorten, so the letter was paid for by the names
— and the card a reader opens by pointing already names the profession in words.

This sat in `ARCHITECTURE.md` under known gaps, which said nothing replaces the letter yet. A gap is
a promise that something is owed. Nothing is.

## Decision

**The hue is a hint; the card is the answer.** A profession is said once in the row, in colour, and
in full words in the card a reader opens by pointing at the row. Nothing else in the row says it.

The gap closes as a decision rather than as work. `DESIGN.md` states it at the row, where somebody
reaching for a second channel will read it.

## Consequences

The row keeps its width for the names, which is what a reader is actually looking for, and the panel
keeps one answer per question rather than two spellings of one.

It obliges the card to keep naming the profession in words: it is not a nicety there, it is the only
place the answer is stated in a channel everybody has. A card that stopped naming it would take the
answer away entirely rather than make it quieter.

A reader who cannot separate two hues and does not point at the row does not learn the profession.
That is accepted, and it is the reason this is a decision with a cost written down rather than a gap
somebody will try to close by adding a glyph.

## Alternatives

**Put the letter back in the row.** It is the channel that works without a gesture, and it was
removed one day earlier for a reason that has not changed: it is paid for out of the names, and it
says a thing the card says better.

**A shape per profession.** Eight shapes are harder to learn than eight letters and cost the same
width. A reader who has to be taught a legend has not been told anything.

**Fewer professions per hue, or a palette with more separation.** The eight hues are the game's own
assignment; regrouping them would mean two professions sharing a colour, which is a worse answer
than one channel — a shared hue says two people are the same thing.
