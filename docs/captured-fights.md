# Captured fights

What each recording in `tests/captured-fights/` holds: who fought, on which side,
in what profession and at what level, and how much protocol the file carries. The
recordings themselves say none of this without being opened — a filename says
`grupa-vs-hildur` and the rest is a megabyte of JSON away — and the decision this
answers is taken often: what to record next.

A recording is evidence and never changes (§9.2), so a row here is true for good.
What changes is the set, which is why the numbers below are not written by hand.

**Read off the material, not written from memory**, and held by
`tests/tools/captured-fight-register.test.ts` — the guard composes the census from
every file in the directory and refuses a row the material does not produce, or a
recording the tables do not name. A line here that stops being true fails the
gate. It refuses rather than defaults: a combatant whose profession, level or
`npc` flag cannot be read stops the run instead of being counted as something.

Two words the tables use in this repository's sense and not the game's: **side**
is the team number as the game states it, and *ours* is the side the recording
player was on (`myteam`); **NPC** is what the payload's `npc` field says, which is
the only thing that distinguishes a monster from a person here.

## Shapes

How many of ours against how many of theirs, and how many recordings of each.

| shape | recordings |
|---|---|
| `1 vs 1` | `3` |
| `1 vs 2` | `1` |
| `1 vs 3` | `1` |
| `10 vs 1` | `17` |

## The fights

| recording | shape | outcome | ours | theirs | their largest health |
|---|---|---|---|---|---|
| `tests/captured-fights/2026-08-04-tempest-lowca-vs-odyncze.json` | `1 vs 3` | `ours won` | `1 player · h 1 · level 40` | `3 NPCs · w 3 · levels 40–41` | `763` |
| `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json` | `10 vs 1` | `ours won` | `10 players · h 1, m 2, p 2, t 1, w 4 · levels 93–120` | `1 NPC · m 1 · level 100` | `325584` |
| `tests/captured-fights/2026-08-11-tempest-tancerz-vs-wermont.json` | `1 vs 1` | `ours won` | `1 player · b 1 · level 85` | `1 NPC · w 1 · level 85` | `4522` |
| `tests/captured-fights/2026-08-12-experimental-tancerz-vs-wojownik.json` | `1 vs 1` | `theirs won` | `1 player · b 1 · level 85` | `1 player · w 1 · level 83` | `23629` |
| `tests/captured-fights/2026-08-12-tempest-grupa-vs-draugr-1.json` | `10 vs 1` | `ours won` | `10 players · h 2, m 3, p 1, t 1, w 3 · levels 63–83` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-12-tempest-grupa-vs-draugr-2.json` | `10 vs 1` | `ours won` | `10 players · b 2, m 2, p 2, t 2, w 2 · levels 63–83` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-1.json` | `10 vs 1` | `ours won` | `10 players · h 1, m 2, p 1, t 1, w 5 · levels 93–114` | `1 NPC · m 1 · level 100` | `325584` |
| `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json` | `10 vs 1` | `ours won` | `10 players · b 1, h 3, m 2, w 4 · levels 93–120` | `1 NPC · m 1 · level 100` | `279072` |
| `tests/captured-fights/2026-08-14-tempest-grupa-vs-draugr-1.json` | `10 vs 1` | `ours won` | `10 players · h 2, m 2, p 1, t 1, w 4 · levels 63–79` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-14-tempest-grupa-vs-draugr-2.json` | `10 vs 1` | `ours won` | `10 players · b 2, h 1, m 2, p 2, t 2, w 1 · levels 63–83` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-14-tempest-grupa-vs-hildur.json` | `10 vs 1` | `ours won` | `10 players · h 1, m 2, p 1, t 1, w 5 · levels 93–120` | `1 NPC · m 1 · level 100` | `325584` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-1.json` | `10 vs 1` | `ours won` | `10 players · h 2, m 1, p 2, t 1, w 4 · levels 63–79` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-2.json` | `10 vs 1` | `ours won` | `10 players · b 2, h 1, m 2, p 2, t 2, w 1 · levels 63–83` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-1.json` | `10 vs 1` | `theirs won` | `10 players · h 1, m 2, p 1, t 1, w 5 · levels 93–120` | `1 NPC · m 1 · level 100` | `325584` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-2.json` | `10 vs 1` | `ours won` | `10 players · h 1, m 2, p 1, t 1, w 5 · levels 93–120` | `1 NPC · m 1 · level 100` | `325584` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-3.json` | `10 vs 1` | `ours won` | `10 players · b 1, h 3, m 2, w 4 · levels 93–120` | `1 NPC · m 1 · level 100` | `279072` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-4.json` | `10 vs 1` | `ours won` | `10 players · b 1, h 3, m 2, w 4 · levels 93–120` | `1 NPC · m 1 · level 100` | `279072` |
| `tests/captured-fights/2026-08-17-tempest-grupa-vs-hildur.json` | `10 vs 1` | `theirs won` | `10 players · h 2, m 1, p 1, t 1, w 5 · levels 93–120` | `1 NPC · m 1 · level 100` | `325584` |
| `tests/captured-fights/2026-08-23-tempest-grupa-vs-hildur.json` | `10 vs 1` | `ours won` | `10 players · b 1, h 3, m 2, w 4 · levels 93–120` | `1 NPC · m 1 · level 100` | `279072` |
| `tests/captured-fights/2026-08-23-tempest-grupa-vs-hildur-auto.json` | `10 vs 1` | `theirs won` | `10 players · h 1, m 2, p 1, t 1, w 5 · levels 93–114` | `1 NPC · m 1 · level 100` | `325584` |
| `tests/captured-fights/2026-08-24-tempest-tropiciel-vs-centaur.json` | `1 vs 1` | `theirs won` | `1 player · t 1 · level 91` | `1 NPC · h 1 · level 99` | `30698` |
| `tests/captured-fights/2026-08-24-tempest-tropiciel-vs-centaury-auto.json` | `1 vs 2` | `ours won` | `1 player · t 1 · level 92` | `2 NPCs · h 1, w 1 · levels 97–99` | `4477` |

## The recordings

| recording | world | build | calls | messages |
|---|---|---|---|---|
| `tests/captured-fights/2026-08-04-tempest-lowca-vs-odyncze.json` | `tempest` | `1785244275300` | `4` | `18` |
| `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json` | `tempest` | `1785244275300` | `102` | `603` |
| `tests/captured-fights/2026-08-11-tempest-tancerz-vs-wermont.json` | `tempest` | `1786441768914` | `6` | `37` |
| `tests/captured-fights/2026-08-12-experimental-tancerz-vs-wojownik.json` | `experimental` | `1781609507010` | `3` | `157` |
| `tests/captured-fights/2026-08-12-tempest-grupa-vs-draugr-1.json` | `tempest` | `1786514810315` | `40` | `381` |
| `tests/captured-fights/2026-08-12-tempest-grupa-vs-draugr-2.json` | `tempest` | `1786514810315` | `80` | `472` |
| `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-1.json` | `tempest` | `1786514810315` | `111` | `591` |
| `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json` | `tempest` | `1786514810315` | `54` | `529` |
| `tests/captured-fights/2026-08-14-tempest-grupa-vs-draugr-1.json` | `tempest` | `1786514810315` | `62` | `365` |
| `tests/captured-fights/2026-08-14-tempest-grupa-vs-draugr-2.json` | `tempest` | `1786514810315` | `50` | `500` |
| `tests/captured-fights/2026-08-14-tempest-grupa-vs-hildur.json` | `tempest` | `1786514810315` | `91` | `609` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-1.json` | `tempest` | `1786514810315` | `18` | `453` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-2.json` | `tempest` | `1786514810315` | `44` | `473` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-1.json` | `tempest` | `1786514810315` | `18` | `480` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-2.json` | `tempest` | `1786514810315` | `84` | `502` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-3.json` | `tempest` | `1786514810315` | `51` | `479` |
| `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-4.json` | `tempest` | `1786514810315` | `52` | `479` |
| `tests/captured-fights/2026-08-17-tempest-grupa-vs-hildur.json` | `tempest` | `1786514810315` | `34` | `439` |
| `tests/captured-fights/2026-08-23-tempest-grupa-vs-hildur.json` | `tempest` | `1786514810315` | `23` | `546` |
| `tests/captured-fights/2026-08-23-tempest-grupa-vs-hildur-auto.json` | `tempest` | `1786514810315` | `3` | `358` |
| `tests/captured-fights/2026-08-24-tempest-tropiciel-vs-centaur.json` | `tempest` | `1786514810315` | `3` | `112` |
| `tests/captured-fights/2026-08-24-tempest-tropiciel-vs-centaury-auto.json` | `tempest` | `1786514810315` | `1` | `23` |

## What the material does not hold

Every gap below is readable off the tables above, and each is a reason to record
something rather than a defect.

- **No group fight between players.** One duel exists, and it was fought on
  `experimental` rather than on a live world — so nothing here says what the panel
  does when both sides heal, resurrect and drink.
- **No fight of more than two sides**, and none where more than three opponents
  stood on the other one. A wide enemy side is untested on real protocol.
- **No drawn fight.** The panel draws one, and every fight it draws it from is
  hand-built (`tests/ui/panel-view.test.ts`).
- **Two worlds only.** Everything but the duel comes from `tempest`.

A loss **is** held, in more than one recording — which is what the outcome column
is for, since nothing else in the tables would say so.

## Recordings that are not like the others

These differ in more than their numbers, and each is worth knowing about before it
is used as evidence.

- `tests/captured-fights/2026-08-04-tempest-lowca-vs-odyncze.json` — the oldest,
  written before the header settled: no `pominietych`, no `urwany`, and the only
  one carrying `render`, the game's own composed sentences, which nothing reads
  (`tools/fight-dump-parser.ts`). Also the only fight against more than one
  opponent.
- `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json` — carries
  `walka`, the fight number, from the format that could hold more than one fight
  per recording (`docs/specs/2026-08-11-capturing-a-fight-to-disk.md`).
- `tests/captured-fights/2026-08-12-experimental-tancerz-vs-wojownik.json` — the
  only fight between two players, and the only recording from `experimental`,
  whose build lags production (§7.6). The keys it brought were read the day it
  arrived (`05d712f`).
- `tests/captured-fights/2026-08-23-tempest-grupa-vs-hildur-auto.json` — the only
  fight the game settled by itself. Every payload carries `auto`, the whole
  battle arrives in one engine call with no snapshot before it, and the two calls
  after it carry snapshots and no messages at all. So it contributes nothing to
  the health witness, for the same reason the duel does not
  (`tests/core/health-witness.test.ts`), and it is the only recording whose
  opening call has to be unwound in full to say what anybody entered with.

  Because of that it is the only recording whose entry health comes entirely from
  stated percentages rather than from a snapshot — the first snapshot after the
  battle has every player clamped to zero, which says where they stand and not how
  much reached them. A percentage is worth about a point and a half on these pools,
  so five of the eleven land within one of their maximum. That is what caught a
  defect in the reader: one of the five landed a point *over*, and the allowance
  meant to absorb exactly that was smaller than a health point on their pool
  (`docs/specs/2026-08-23-an-allowance-smaller-than-a-health-point.md`).

- `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json`,
  `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-3.json` and
  `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-4.json` state a
  smaller maximum health for the same opponent than the other Hildur fights do.
  The opponent is the same; the strength it is met at is not, so a health figure
  quoted from one recording is a figure about that recording and not about the
  boss.
