# 0034. Every row under an end left out says so, at every level

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

A pinned row's card says three things: what the game did not state, whether the figure is already
counted in the list above, and, where a side is showing, what the shown team is to it. It also has a
run of what the figure was dealt with (`develop ADR 0038`, `develop ADR 0041`).

One level down it said less. The same row inside an opened figure, or under an opened part, said
only the first sentence (`develop ADR 0038`). `develop ADR 0041` rejected the run there because that
row did not open, and a card that previews a level needs the level to exist. Since ADR 0016 the row
opens wherever the keys kept for it add up to its figure. Over `captures/` on 2026-10-03, all 68
such rows on `damageTaken` open (`deno task panel:drill --cases`).

Rows standing _under_ a pinned row said nothing about the end the game left out. That covers the
people and keys on its own level, and on the level under that. The `no kind` row said nothing at
all.

The maintainer's list put it as: an unknown target or striker should say on the second level what it
says on the first.

## Decision

Decided with the maintainer on 2026-10-03.

**The end an opened figure left out shows the run of its kinds wherever the level under it is
kept.** It is the same cut that level draws, and it shows on exactly the rows that open, so
`develop ADR 0041`'s condition holds. Under an opened part the row shows no run, because nothing
keeps a part's figure cut by the end it left out.

**Inside an opened figure and under a part, that row says three things:**

1. what the game did not state;
2. that the part is inside the figure over its section;
3. which row under the list also holds it, named by the label the reader sees.

`healthGiven` has no third sentence, because a heal is always written with whoever received it, so
that screen draws no such row.

Rejected: the side sentence. Neither level takes a side choice, because one person's figure is the
same whichever side is showing. A sentence saying the figure was narrowed to the shown team would
claim something that never happened.

Rejected: calling the row under the list "przypięty". In the panel's words that already means a kept
fight on the shelf, so one word would carry two meanings.

**Every person, key and summed row standing under a pinned row says which end the game left out.**
This applies on its own level and on the level under it. A person's card says it after the
suspicions and before the sentence saying its figures are the whole fight's, because that sentence
answers for every figure on the card and this one only for the row's own.

**A `no kind` row says the game stated no kind for it**, worded for damage or for healing.

Rejected: a sentence table of its own for the rows under a pinned row. The sentence they need is the
one the pinned row already says, so a second table would be a copy that drifts.

## Consequences

A card over a half-named row inside an opened figure grows by two sentences and, where the row
opens, a run of kinds. Cards on the levels under a pinned row grow by one sentence each.
`presentCard` takes the sentence as a field, and it is `null` wherever both ends were named.

No recording draws a `no kind` row yet, so its sentence is held on figures built by hand.
