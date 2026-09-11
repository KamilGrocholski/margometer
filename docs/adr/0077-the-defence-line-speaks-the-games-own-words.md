# 0077. The defence line speaks the game's own words

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

**ADR 0073** decided that every word in `ELEMENT_WORDS` is one the published help prints, and put a
guard on it. Its Decision names that table and only that table. `DEFENCE_WORDS` — the words the card
draws under `Zatrzymane`, one per defence that stopped part of a blow — sat outside it, worded by
this repository and checked by nobody, with a docblock that said so: "in the player's words".

Two of the three were inventions, and the same question nobody had asked about `nieuchronne` had not
been asked here either. Measured over the cached dump of article view,372, fetched 2026-09-09 and
read 2026-09-11:

| The panel drew       | The article prints                       |
| -------------------- | ---------------------------------------- |
| `wchłonięcie`        | the stem `wchłon…` occurs **not once**   |
| `absorpcja`          | as a heading, and through the whole text |
| `absorpcja magiczna` | in the nominative, wherever it names it  |
| `absorpcja fizyczna` | **not once** in the nominative           |

`blok` was already right, and is the case that shows why this was invisible: it is the client's own
token and a word the article prints, so the one member a reader would have checked was the one that
could not be wrong.

**The asymmetry between the two absorptions is the article's, not ours.** It names three of them —
physical, magical and ranged — and qualifies the physical one only in the oblique cases, where it is
contrasting it with the other two. The nominative it prints is bare. So the panel draws `absorpcja`
against `absorpcja magiczna`, which reads as an inconsistency and is a reading.

## Decision

**Every word in `DEFENCE_WORDS` is one the published help prints, held by the same guard as
`ELEMENT_WORDS`.** `tests/ui/panel-words.test.ts` re-earns both tables against
`frozen/help-phrases.ts` through one reader, proved on a word the frozen table counts and a word
nothing counts. `docs/protocol-keys.md` cites the phrases on the `-absorb` and `-absorbm` entries,
which is where `deno task game:help freeze` takes its list from.

This changes nothing about how the table is keyed, where it lives, or what the card does with it.
What changes is where a word in it comes from: the article, rather than whoever typed it.

## Consequences

- **Two words move**, and a player who learned the old ones has to learn these: `wchłonięcie` →
  `absorpcja`, `wchłonięcie magiczne` → `absorpcja magiczna`. That is the cost, it is paid once, and
  it is paid towards the vocabulary the player is reading everywhere else in the game.
- **A defence the article does not name cannot be worded here**, which is **ADR 0073**'s cost
  carried over unchanged. The token a reader sees instead is the signal to go and ask.
- **`absorbd` is the case waiting to test that**, and it is why this consequence is not theoretical.
  The article names `absorpcja dystansowa` and the frozen skill table carries the key, but no
  recording in `captures/` has ever stated it, so the guard that asks _every defence a recording
  states is one the panel words_ has nothing to fire on. Nothing is written for it here: a word
  nobody can exercise is the shape of the invention this record is about. **ADR 0073**'s register of
  kinds nobody names is not extended to it either — that register is for a thing that reaches the
  screen with no name, and this one does not reach the screen at all.
- **The count stays a floor and not a ceiling.** Whether the article prints a word _as this
  defence's name_ is a person's reading, the way it is for an element — the line states an
  occurrence, the prose states what it means.

## Alternatives

**Leave `DEFENCE_WORDS` ours and say so.** It is what the docblock already claimed, and it is
self-consistent. Rejected for **ADR 0073**'s reason: it puts this repository's vocabulary in front
of a player reading the game's everywhere else, and it makes a disagreement with the article
unfalsifiable, because there is nothing left to guard.

**Draw `absorpcja fizyczna`, so the two read in one grammar.** Symmetrical, and it is what a person
writing the pair from scratch would reach for. Rejected: the nominative occurs not once in the
article, so it would be a word the game does not use — which is exactly what `błyskawica` was, and
what this pair of records exists to stop. A column that reads oddly because the source reads oddly
is a reading; one that reads evenly because we evened it is not.

**Widen ADR 0073 instead of writing this.** Cheaper by one file. Rejected: 0073's Decision names
`ELEMENT_WORDS` outright, and editing an accepted record to cover a table it never measured would
leave its Context arguing for a decision wider than the evidence it carries.
