# 0072. A fight the game runs itself numbers no turn

- **Status:** Accepted
- **Date:** 2026-09-09

## Context

The maintainer plays fights on the auto key and the window beside the panel said something false
about every one of them. `F` is that key:
`n[HotKeysData_default.name.hotAutoFight] = ["F",
".auto-fight-btn, .auto-fight-cancel-btn", …]`,
production build `Cl9U89Zr`, read 2026-09-09.

**The game stops numbering turns while it is running the fight.** Measured over `captures/` on
2026-09-09, across 1135 payloads: 24 state `auto` on and **not one of them carries
`turns_warriors`**; 24 state it off and carry a queue; the rest state nothing about it either way.
Four recordings hand a fight over mid-way — `2026-08-11-tempest-tancerz-vs-wermont` at payload 1,
`2026-08-25-luvia-grupa-vs-mamlambo-auto` at 2, `2026-08-26-luvia-grupa-vs-draugr` at 1,
`2026-08-27-luvia-grupa-vs-amaimon-2` at 109 — and in every one the queue stops at exactly that
payload and never returns.

`src/game/fight-underway.ts` keeps the last statement across a payload carrying no queue, which is
right for the one mid-fight gap every long recording has and wrong for the rest of an auto fight. So
the window drew one of two false readings, both replayed off the corpus:

- **A statement that had stopped being true.** 24 of the 30 recordings ended with an ordinal and a
  holder under `Teraz` on a fight already over, and `2026-08-27-luvia-grupa-vs-amaimon-2` drew
  `tura 308` for the whole of the auto fight that finished it. The panel's own ranking marked nobody
  at the same moment, because **ADR 0066** had already decided that a fight which is over numbers
  nobody's turn — a rule the second window never applied.
- **„Nie wiadomo, czyja tura."** on the six recordings that carry no queue at all. That sentence
  says the game numbered a turn and this reading could not take it, which is not what happened.

## Decision

**A turn is drawn only while the game is numbering one, and the window names why where it is not.**

The envelope's `auto` is read in `src/game/fight-underway.ts`, beside `myteam` and `turns_warriors`,
and a payload saying the game is running the fight takes the kept statement away rather than leaving
it standing. It is kept once seen and replaced by the game's own word, because the client keeps it
the same way — `updateData` takes `r.auto` through `parseInt` into `isAuto`.

The window's `Teraz` row then has four states and a sentence for three of them:

| state        | drawn                             | said                                 |
| ------------ | --------------------------------- | ------------------------------------ |
| `held`       | `tura N` and the holder's row     | —                                    |
| `unread`     | the ordinal, where one was stated | „Nie wiadomo, czyja tura."           |
| `afterFight` | nothing                           | „Walka się skończyła."               |
| `onAuto`     | nothing                           | „Szybka walka — gra nie podaje tur." |

**`onAuto` outranks `afterFight`**, because both are true of every fight fought on the auto key and
only the first says why there is no turn to draw.

## Consequences

Over the corpus the window now ends 9 recordings on the auto sentence and 21 on the ended one, and
draws a stale ordinal on none, against 24 before. The suppression is at the reading rather than in
the window, so `getTurnHolderId` needed no change and the ranking's `▸` mark cannot disagree with
the sentence beside it: on `2026-08-27-luvia-grupa-vs-amaimon-2` both stop at payload 109.

`tools/turn-count.ts` and `tools/turn-reading.ts` read `readTurnStatement` off the raw payloads, so
`docs/turns-taken.md` and `docs/reading-a-turn.md` are untouched — the grading still stands on
everything the game ever stated, which is what an `in a lump` verdict is measured from.

Obliged later: `tools/panel-screenshots.ts` takes every shot at the recording's last payload, so the
published picture of the window will say „Walka się skończyła." where it used to say
`tura 267 · Amaimon Soploręki` — correct, and no longer a picture of the turn line. Taking the set
at an earlier payload changes how every shot is taken and is not decided here.

## Alternatives

**The `isOver` rule alone**, mirroring ADR 0066 in the window and reading no new key. It reaches the
six recordings delivered with `endBattle` in the opening payload and leaves the other four stale for
as long as the auto fight runs — `tancerz-vs-wermont` payloads 1 and 2, `amaimon-2` payload 109 —
where a reader is actually watching. Refused: the case that is wrong is the one the reader is
looking at.

**Only the newest payload's statement counts**, dropping the carry-over entirely. Needs no key at
all and is honest by construction, but every long recording has a payload mid-fight carrying no
queue — index 1, 2, 4 or 5 across the corpus — so the window would blink to „Nie wiadomo, czyja
tura." and the ranking mark would blink off with it, once a fight, for no reason a reader could see.

**One sentence for both states**, „Nikt nie ma tury.". Fewer words to keep true, and it answers
neither of the two questions a reader has: whether the fight is over, and why a fight that is not
has no turn.
