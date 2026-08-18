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

### Dictionary identifiers — `src/ui/panel-names.ts`

The sentence above is done by that file and by `src/game/game-dictionary.ts`,
and they are named here because it is fair to ask what "reads them at run time"
comes to in practice.

The client's translation table is keyed by identifiers — `msg_+crit`,
`msg_-contra`, `msg_+dispel` — and exposes a lookup, `_t`, to the page the
add-on runs on. What is written down here is the **identifier** for each token
the panel can ask about: a functional name of the same kind as the protocol keys
above, and the join without which the lookup cannot be made. What comes back is
used and not stored, so a player sees their own client's wording in their own
language, and nothing of it ends up in a file, a test or a comment.

Beside each identifier is a short Polish phrase of **ours**, which is what the
panel draws where the client has no name for something, or is not on the page at
all. Those phrases are this repository's own writing. Where the game's wording
informed one, the entry says so in its own words; none of them is a quotation.

### Recorded fights — `tests/captured-fights/*.json`

Recordings of the author's own fights, kept as the server sent them. They are
what lets the decoder be checked against something other than itself.

Three things in them are worth naming plainly rather than leaving for someone to
discover:

- **The older recording carries a `render` field** — 38 sentences the game
  client composed for the on-screen log. No code here reads it, and none will:
  the reader in `tools/fight-dump-parser.ts` skips the field on purpose. It is
  left in place because cutting it would mean editing evidence, which this
  project forbids itself. It is a record of one player's own session, not an
  extract from the game's dictionary.
- **`txt=` fields name items** dropped at the end of a fight, say that a
  combatant lost a turn, and in the duel capture name what the fight was fought
  for — again as part of that session's own record.
- **`tspell=` fields name skills** the combatants used — the game's own names
  for its abilities, as the server sent them. The decoder reads this key and
  passes the name to the panel at run time, on the same footing as the
  sentences above: shown in the player's own language, and written down nowhere
  else here. No such name appears in a test, in `docs/`, or in a comment, and
  `tests/tools/source-layout.test.ts` re-earns that on every run — against the
  names the recordings actually carry rather than against a list somebody typed,
  so it cannot fall behind the next recording.

**Player nicknames are not here.** Everyone with a player id is substituted —
`Gracz 1`, `Gracz 2`, … — before material enters the repository, and a test holds
the files to it rather than trusting the tooling that did the substitution.
Monster names are left as they are: they are not people, and they are what the
recording is evidence about.

### The published preview — <https://kamilgrocholski.github.io/margometer/>

Those recordings are also what the published preview replays: one page per
capture, carrying that fight's engine payloads inlined so the panel can be
watched without installing anything. It is the same material as the section
above, on the same basis and from the same files — the page is written from
`tests/captured-fights/` by `tools/preview-site.ts` and never committed.

Three things about it are worth stating rather than leaving to be discovered:

- **The sentences the client composed are not on it.** The `render` field named
  above sits beside the engine payload in a recording, not inside it, and only
  the payload travels to the page. Nothing there was written by the game to be
  read by a person.
- **What does travel is what the server sent**: the `tspell=` and `txt=` values
  named above, which the panel shows the way it shows them in the game — read
  from the material and written down nowhere else.
- **No nickname is on it**, for the reason no nickname is in the repository:
  everyone with a player id was substituted before the material entered it.

The page also has no game beside it, so the client's own translation table is not
there to be asked; every name the panel draws for a protocol token is this
repository's own phrase (`src/ui/panel-names.ts`).

### The screenshots — `screenshots/`, committed

`README.md` shows four pictures of the panel, taken by
`tools/panel-screenshots.ts` off the same recordings and replaced whenever a
version is. They are pictures of our own panel, and two things in them came from
the game:

- **The names the server sent.** The `tspell=` and `txt=` values named above are
  drawn where the panel draws them, so an ability's name and a monster's name are
  legible in the breakdown and in the card. That is the same material as the
  published preview, on the same basis, and it is stated here because the section
  above says such a name is written down nowhere else — which is true of every
  `.ts` and `.md` in this repository and is re-earned on every run by
  `tests/tools/source-layout.test.ts`. A picture is neither, so nothing would have
  gone red had this gone unsaid.
- **No nickname**, for the reason no nickname is anywhere here: everyone with a
  player id was substituted before the material entered the repository, so the
  rows read `Gracz 1`, `Gracz 2`, and so on.

Nothing else of the game's is in them. There is no game beside the harness page,
so the client's translation table is not there to be asked and every name the
panel draws for a protocol token is this repository's own phrase
(`src/ui/panel-names.ts`); no sentence the client composed appears, for the reason
none appears on the preview.

### Client source — `.cache/`, never committed

`tools/game-client-source.ts` downloads the game client so that questions about
the protocol can be answered from the source instead of from memory. It is
someone else's copyrighted work: it is read locally, it stays in `.cache/`,
which git ignores, and a test asserts nothing under that path is ever tracked.

---

## What is deliberately not here

- the game's sentences, written down as text of ours — in a table, a comment, a
  test or a document. The one exception is named above and is not a copy of
  anything: a single recording carries the log its own session composed, and
  cutting it would mean editing evidence. Nothing here reads it and nothing here
  quotes it;
- any nickname belonging to another player;
- artwork, sounds or any other asset;
- any part of the client's source.

Two of those are held by a test rather than by this paragraph: no entry of the
client's dictionary is quoted anywhere, and no name the game gave an ability is
**written down as text** outside the recordings
(`tests/tools/source-layout.test.ts`). Both were promises here before they were
checks, and both were false while they were only promises.

Those two words are load-bearing, and they were added when the screenshots were.
That test reads `.ts` and `.md`; a picture is neither, and the section above says
what is legible in one rather than leaving the promise to be read wider than the
check behind it.

---

If anything here is wrong, Garmory can reach the author through the repository
and it will be corrected or removed.
