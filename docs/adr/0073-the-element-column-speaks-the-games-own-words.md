# 0073. The element column speaks the game's own words

- **Status:** Accepted
- **Date:** 2026-09-10

## Context

**ADR 0011** decided that a damage kind is worded by this repository, in one table, and that the
client's own `stat-damage-…` family is not read: it words seven of the ten for a character sheet, in
a masculine singular that a column of `obrażenia` cannot take. It recorded that three were "worded
nowhere" — `dmga`, `dmgg` and `thirdatt` — and that sentence is true of the dictionary it was
measuring, production build `1785244275300`, read 2026-08-28.

Nobody asked the **published help**. Article view,372, read 2026-09-10, words all of them and does
it twice over: a `Typ obrażeń` table naming the types, and an item-bonus list naming each again
beside the engine name of the bonus that raises it — `dmgmulphysical`, `dmgmulpoison`, `dmgmulfire`,
`dmgmulfrost`, `dmgmullight`, `dmgmulcombo`. The client has no case label for any of these keys —
`frozen/protocol-keys.ts` carries one, `dmg`, and the family entry in `docs/protocol-keys.md` says
why — so the article is the only place a name could ever have come from.

Four of the ten words did not match what it prints. Two were inventions in the game's own subject
area, and two were the game's own concepts under words the game never uses: `błyskawica` where the
article has only the plural and the singular occurs **not once**; `trzeci atak` where the event is
`Trzeci cios` and `trzeci atak` occurs **not once**; `broń pomocnicza`, which names the weapon where
the article names the damage; and `globalne`, which names nothing at all — its single occurrence in
the article is a chat setting.

**`globalne` is the one that says how this happened.** `dmgg` is real and it is drawn: it reaches
the panel through `+oth_dmg`'s middle member, which the client appends to `dmg` to build a class
attribute — `'<b class=dmg' + mm[1] + '>'`, development build `1781609507010` — and the corpus
states it from exactly one skill, `Śpiew zagłady`, which article view,372 does not carry and the
frozen skill table does not hold. So there was a kind on the screen with no name anywhere, and a
guard reading _every kind every recording states is one the panel has a word for_. A rule demanding
a word for every kind, in a repository whose rule is that a guessed name is a claim about the
protocol, produces exactly one thing. It produced `globalne`.

## Decision

**Every word in `ELEMENT_WORDS` is one the published help prints, and the table is held to that by a
guard.** `tests/ui/panel-words.test.ts` re-earns each against `frozen/help-phrases.ts`, which
`docs/protocol-keys.md` cites on the `?dmg*` family entry and on the `thirdatt` pair.

**A kind the help does not name is left out rather than invented**, and reaches a reader as the
game's own token — which is what **ADR 0011** already asks for, and is visible where an invention is
not.

**The guard that forced the invention is replaced by one that registers it.** A kind is worded from
a source, **or** it stands in a register of kinds nobody names, carrying the reason and the date it
was last asked for. `tests/ui/panel-reading.test.ts` holds that register and reads it both ways: a
kind with no word and no entry fails, and so does an entry that has since earned a word. `dmgg` is
its only member.

This does not reverse **ADR 0011**. The table is still this repository's, still one table, still in
`ui/panel-words.ts`, and the client's family is still not read. What changes is where a word in it
comes from: the article, rather than whoever typed it.

## Consequences

- A word here is a claim about the game and moves only when the article does — **V1** rather than
  taste. Four changed in the commit that made this: `pomocnicze`, `błyskawice`, `trzeci cios`, and
  `dmgg` removed.
- The guard is a floor and not a ceiling, and the register's own header draws the same line: **the
  count states an occurrence, the prose states what it means.** `globalne` occurred once while
  naming a chat setting, so a reader stopping at the count would have blessed it. Whether the
  article prints a word _as this type's name_ stays a person's reading.
- A new kind the article does not yet name cannot be worded here. That is the cost, it is
  deliberate, and the token a reader sees instead is the signal to go and ask. It costs a player
  something real: `dmgg` now draws as `dmgg` where it read `globalne`, on the fights carrying
  `Śpiew zagłady`. A token nobody can read beats a word nobody can check, because only one of the
  two ever gets corrected.
- The column no longer reads in one grammar, and that is the article's grammar rather than ours:
  `fizyczne`, `dystansowe`, `pomocnicze` and `nieuchronne` are adjectives, `ogień`, `zimno`,
  `błyskawice` and `trucizna` are the nouns the `Typ obrażeń` table uses. **ADR 0011** claimed one
  grammar for the column and never had it — `ogień` sat beside `fizyczne` from the first day.

## Alternatives

**Keep the four and cite nothing.** What it buys is a column somebody already reads without
complaint. Rejected: two of the four are words the game never uses for anything, and `Zwykły cios`
and `nieuchronne` were both validated this round by asking the article — asking it for eight words
and not for the other two is where the next wrong word comes from.

**Keep `globalne` and let the new guard bless it.** It would have passed — the article does carry
the word, once, about a chat setting. Rejected, and it is why this ADR says a count is a floor: a
guard going green on `globalne` would be a reader finding too much, which is the failure this
repository has already been caught by once.

**Read `g` off what it does, which is what was done the first time.** `CHANGELOG.md` still carries
the release note that introduced the word — `globalne` glossed as blows striking everyone at once —
and the reading is not silly: every message carrying `g` aims `+oth_dmg` at several targets at once,
31 of 31. Rejected, because the property is not the letter's. Measured 2026-09-10 over `captures/`,
`c` does the same on 22 messages, `f` on 22, `p` on 3 and plain damage on 39, and each of those is
named for its element rather than for its spread; `a` never does it at all and is `nieuchronne`. So
the evidence that produced the word fits four other letters and distinguishes nothing. A meaning
inferred from behaviour a key shares with its siblings is the exact shape of a guess that looks like
a reading.

**Word the whole column ourselves, in one grammar, and say so.** Honest and self-consistent, and it
was **ADR 0011**'s intent. Rejected: it puts this repository's vocabulary in front of a player who
is reading the game's everywhere else, and it makes a disagreement with the article unfalsifiable —
there would be nothing left to guard.

**Take the client's `stat-damage-…` family after all.** Rejected for **ADR 0011**'s reason, which
this ADR does not disturb: the grammar is a character sheet's and three of the ten are not in it.
