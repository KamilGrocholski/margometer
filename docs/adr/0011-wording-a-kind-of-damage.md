# 0011. Wording a kind of damage, and what carries none

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

A row opened is cut twice, and the second cut is by the kind of damage each blow carried. The
protocol states that kind as a key — `dmg`, `dmgf`, `thirdatt` — and the battle log never words it:
it composes its line out of the figure and the recipient and spends the kind on a class attribute.
So the panel has a column of tokens and nothing to draw them as.

The client words seven of the ten elsewhere, in the `stat-damage-…` family a character sheet uses.
Dictionary of build `1785244275300`, read 2026-08-28: `stat-damage-normal` reads `Fizyczny`,
`stat-damage-cold` reads `Od zimna`, `stat-damage-offhand` reads `Broń pom.`. Two grammars in one
family — an adjective agreeing with a masculine noun, and a phrase naming a source — and every row
in this cut is a quantity of `obrażenia`, which is neuter and plural. Three of the ten are worded
nowhere: `dmga`, `dmgg`, and `thirdatt`, whose own entry `msg_+thirdatt %val%` resolves to `+%val%`
— a hole and no name. Its sibling `skills_of-thirdatt %val%` reads `%val%% szans na 3 atak`.

The figure being cut is not always wholly accounted for. Health that moves down outside a blow is
stated on a key of its own, carrying the movement and no kind. Measured over `captures/` on
2026-08-29: 45 of 530 combatant-and-screen pairs are short this way, in 28 of the recordings, and
every one of them on damage taken — which is the only screen where the protocol states a bare
movement.

## Decision

**A kind is worded by this repository, in one table, and the client's own table is not read.** The
table sits in `ui/panel-words.ts` with the rest of the Polish. A kind the table does not hold is
drawn under the game's own token, the way a row with no skill announced is named by its key: a
guessed name is a claim about the protocol.

**What no kind was stated for is a row of its own, pinned below the kinds.** It is never spread over
the kinds that were stated, and never dropped. The cut therefore states
`stated + withoutElement ==
total`, and only that.

## Consequences

- Ten words are this repository's to keep current. A kind the game adds reaches a reader as a bare
  token until somebody adds it, which is visible rather than silent — and a guard fails the moment a
  recording states a kind the table does not hold.
- The column reads in one grammar. `fizyczne`, `ogień`, `trzeci atak` all sit after `obrażenia`.
- A reader who adds up the kinds and reaches less than the figure is told where the rest went,
  rather than left to find it.
- Nothing may assert that the kinds come to the figure. The assertion that they come to no **more**
  than the figure stands, and is the one that would catch a double count.

## Alternatives

**Take the client's seven and word the other three.** What it buys is the game's own vocabulary for
most of the column. Rejected: seven of them are worded for a character sheet, where the noun is
masculine singular, and three would have to be invented anyway — so the column would carry two
grammars and an invented word, rather than one grammar and no invention.

**Draw the token for every kind and word none.** Honest and unreadable: `dmgo` is not a word in any
language a player of this game reads.

**Spread what carries no kind over the kinds that were stated, by share.** Rejected: it invents data
the log does not carry, and it moves a figure a reader could otherwise check.

**Fold what carries no kind into a `Nie wiadomo` row.** Rejected: nothing is unknown here. The
protocol stated what it had, and what it had did not include a kind — which is a different sentence
from one this reader could not read.
