# What the licence covers, and what it does not

MargoMeter is [MIT licensed](LICENSE). That covers **the code and documentation
written in this repository**, and nothing else.

Margonem is a game by **Garmory sp. z o.o. sp.k.** This add-on is not affiliated
with them, not authorised by them and not reviewed by them. The name "Margonem",
the logos, the artwork, the text and the client's code belong to the operator;
MIT does not cover them and could not, because they are not ours to license.

---

## What of the game's is in this repository

The add-on has to speak to the game, so some things from it must be here. What
exactly, and on what basis:

### Protocol keys — `tests/frozen-protocol-keys.ts`

Every key the client branches on when it reads a battle message, lifted from the
production bundle by `tools/protocol-key-table.ts`. These are **functional
names** in a wire format — `+abdest`, `-blok`, `heal` — of the same kind as a
field name in a file format. Without them the protocol cannot be read at all,
and interoperability is provided for separately in copyright law (art. 75(2)(3)
of the Polish Copyright Act; Directive 2009/24/EC art. 6).

**No sentences from the game are in that file.** The client also holds a
translation table turning each key into a sentence for the player. Those
sentences are the operator's own writing, they are not needed to decode
anything, and they are deliberately absent. The add-on reads them from the
running game at run time instead, which also means it shows them in whatever
language the player's client uses.

### Recorded fights — `tests/captured-fights/*.json`

Recordings of the author's own fights, kept as the server sent them. They are
what lets the decoder be checked against something other than itself.

Two things in them are worth naming plainly rather than leaving for someone to
discover:

- **The older recording carries a `render` field** — 38 sentences the game
  client composed for the on-screen log. No code here reads it, and none will:
  the reader in `tools/fight-dump-parser.ts` skips the field on purpose. It is
  left in place because cutting it would mean editing evidence, which this
  project forbids itself. It is a record of one player's own session, not an
  extract from the game's dictionary.
- **`txt=` fields name items** dropped at the end of a fight, again as part of
  that session's own record.

**Player nicknames are not here.** Everyone with a player id is substituted —
`Gracz 1`, `Gracz 2`, … — before material enters the repository, and a test holds
the files to it rather than trusting the tooling that did the substitution.
Monster names are left as they are: they are not people, and they are what the
recording is evidence about.

### Client source — `.cache/`, never committed

`tools/game-client-source.ts` downloads the game client so that questions about
the protocol can be answered from the source instead of from memory. It is
someone else's copyrighted work: it is read locally, it stays in `.cache/`,
which git ignores, and a test asserts nothing under that path is ever tracked.

---

## What is deliberately not here

- the game's sentences, in any form;
- any nickname belonging to another player;
- artwork, sounds or any other asset;
- any part of the client's source.

---

If anything here is wrong, Garmory can reach the author through the repository
and it will be corrected or removed.
