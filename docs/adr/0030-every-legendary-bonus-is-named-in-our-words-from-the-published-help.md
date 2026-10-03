# 0030. Every legendary bonus is named in our words, from the published help

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

`develop ADR 0024` had the panel ask the player's own client for a key it had no word of its own
for, and four legendary bonuses were among those keys because their published names had not been
read: `+legbon_curse`, `+legbon_verycrit`, `-legbon_cleanse` and `-legbon_glare`. Where the client
cannot be asked — the preview, a test, a page with no game — the key stands as the game wrote it.

ADR 0029 put every legendary bonus in one run on the card. With six of them named in our words and
four asked of the client, the preview at `4ee873b` drew `-legbon_cleanse ×5` under a heading whose
other lines were names. Article view,372, read 2026-10-03, names all four: Klątwa, Cios bardzo
krytyczny, Płomienne oczyszczenie and Oślepienie.

## Decision

Decided with the maintainer on 2026-10-03.

**Every legendary bonus is named by the name the published help gives it, in
`LEGENDARY_BONUS_WORD_BY_KEY`, and the client is not asked about any of them.** The run names its
bonuses the same way whether or not a client stands behind the page, and `CLIENT_ID_BY_UNWORDED_KEY`
holds only the three keys the help does not carry.

Rejected: keeping the client's words where it can be asked and ours elsewhere. The same bonus would
be named two ways by where the panel runs, and the client words `-legbon_glare` as a sentence about
the next turn rather than as the bonus's name.

## Consequences

`develop ADR 0024` still governs the three keys left in `CLIENT_ID_BY_UNWORDED_KEY`. A legendary
bonus the game adds later stands as its key until it joins the table and `src/core/protocol-key.ts`.
