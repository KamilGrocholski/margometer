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
| `9 vs 1` | `1` |
| `10 vs 1` | `22` |

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
| `tests/captured-fights/2026-08-25-luvia-grupa-vs-mamlambo-auto.json` | `10 vs 1` | `ours won` | `10 players · b 1, h 1, m 1, p 1, t 3, w 3 · levels 36–52` | `1 NPC · b 1 · level 36` | `43092` |
| `tests/captured-fights/2026-08-25-luvia-grupa-vs-draugr-auto.json` | `10 vs 1` | `theirs won` | `10 players · h 3, m 1, p 2, t 3, w 1 · levels 48–85` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-25-luvia-grupa-vs-draugr.json` | `9 vs 1` | `theirs won` | `9 players · m 1, p 3, t 5 · levels 48–83` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-26-luvia-grupa-vs-draugr.json` | `10 vs 1` | `ours won` | `10 players · h 2, m 1, t 4, w 3 · levels 57–85` | `1 NPC · w 1 · level 60` | `184680` |
| `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon.json` | `10 vs 1` | `theirs won` | `10 players · b 1, h 1, p 2, t 3, w 3 · levels 83–100` | `1 NPC · p 1 · level 83` | `209110` |
| `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon-2.json` | `10 vs 1` | `ours won` | `10 players · b 2, m 4, t 2, w 2 · levels 83–107` | `1 NPC · p 1 · level 83` | `209110` |

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
| `tests/captured-fights/2026-08-25-luvia-grupa-vs-mamlambo-auto.json` | `luvia` | `none stated` | `4` | `308` |
| `tests/captured-fights/2026-08-25-luvia-grupa-vs-draugr-auto.json` | `luvia` | `none stated` | `3` | `462` |
| `tests/captured-fights/2026-08-25-luvia-grupa-vs-draugr.json` | `luvia` | `none stated` | `38` | `619` |
| `tests/captured-fights/2026-08-26-luvia-grupa-vs-draugr.json` | `luvia` | `53XkBRxF` | `3` | `487` |
| `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon.json` | `luvia` | `53XkBRxF` | `15` | `709` |
| `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon-2.json` | `luvia` | `53XkBRxF` | `111` | `715` |

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
- **Three worlds, and one of them once.** Everything but the duel and the six
  recordings from `luvia` comes from `tempest`; the duel is the one that happened
  once.

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
- `tests/captured-fights/2026-08-23-tempest-grupa-vs-hildur-auto.json` — the first
  fight the game settled by itself, and one of two. Every payload carries `auto`,
  the whole battle arrives in one engine call with no snapshot before it, and the
  two calls after it carry snapshots and no messages at all. So it contributes
  nothing to the health witness, for the same reason the duel does not
  (`tests/core/health-witness.test.ts`), and its opening call has to be unwound in
  full to say what anybody entered with.

  Because of that its entry health comes entirely from stated percentages rather
  than from a snapshot — the first snapshot after the
  battle has every player clamped to zero, which says where they stand and not how
  much reached them. A percentage is worth about a point and a half on these pools,
  so five of the eleven land within one of their maximum. That is what caught a
  defect in the reader: one of the five landed a point *over*, and the allowance
  meant to absorb exactly that was smaller than a health point on their pool
  (`docs/specs/2026-08-23-an-allowance-smaller-than-a-health-point.md`).

- `tests/captured-fights/2026-08-25-luvia-grupa-vs-mamlambo-auto.json` — **the
  first recording naming no build**, which is what its build column says. The
  add-on writes `null` where the page did not state one, and until this file
  arrived `tools/fight-dump-parser.ts` refused to read such a recording at all
  (`docs/specs/2026-08-25-a-recording-that-names-no-build.md`). So nothing dates
  it against the client, and a claim about how the game composed a message is not
  one this recording can settle — the messages, the snapshots and the percentages
  in it are unaffected. All three recordings of that day arrived the same way, and
  the reason turned out not to be the page: the client had started naming its
  bundle `main.min.53XkBRxF.js`, and the reader knew only ids that were numbers
  (`src/core/game-build.ts`). It reads both now, so a recording made after
  2026-08-25 carries a build again — these three cannot, being evidence (§9.2),
  and their column is a fact about them for good.

  It is also the only fight **entered by hand and finished on auto**: the opening
  call states `auto` as `0`, the third states `1`, and 304 of the 308 messages
  arrive in the closing call. Unlike the other auto recording it still has an
  opening snapshot, so the health witness judges it in full rather than declining
  it. Of the four keys it brought, `+stun2` and `npc_heal` are still in no other
  recording, while `anguish` and `+legbon_anguish` arrived here first and are in
  both Draugr fights of the same day (`docs/protocol-keys.md`).

- `tests/captured-fights/2026-08-25-luvia-grupa-vs-draugr-auto.json` — the second
  fight the game settled by itself, in the same shape as the first: `auto` on
  every payload, all 462 messages in the opening call, no snapshot before it, and
  the two calls after it carrying snapshots and nothing else. It contributes
  nothing to the health witness for that reason.

- `tests/captured-fights/2026-08-25-luvia-grupa-vs-draugr.json` — fought by hand
  and **the first recording whose opening call carries most of the fight anyway**:
  506 of its 619 messages arrive in it, opening with the opponent at full health
  and closing with it at 25.21% and four of the nine players already at zero. The
  37 calls after it arrive a turn at a time, which is what the witness judges —
  164 comparisons, against 0 for the recordings whose whole fight is in the
  opening call.

  It is also where a tick's missing figure is worst: two combatants apply the
  bleed `+legbon_anguish` announces to the same victim, and 25 `anguish` ticks
  come back off it naming nobody. And it is where `tcustom`, the second spelling
  of an announcement, arrived — five of the seven occurrences the material holds
  (`docs/protocol-keys.md`).

- `tests/captured-fights/2026-08-26-luvia-grupa-vs-draugr.json` — **the only
  recording of a fight joined in the middle**, and it is the game that restates
  it: the player reloaded the page mid-battle, so the opening call carries `init`
  together with the whole log from the fight's start, while `ladunek.w` states the
  health as it stands at the reload. 212 of its 487 messages arrive in that call,
  the rest in the one that ends the fight. It is also the first recording to carry
  a build again after the three of 2026-08-25 that name none — `53XkBRxF`, read
  off a bundle filename that is not a number (`src/core/game-build.ts`).

  ⚠️ **It is the one recording where the game contradicts itself about a
  combatant's health.** For ten of the eleven, the last percentage the opening
  call states is the percentage the snapshot after it reports. For the eleventh it
  is 53.61% against 52.21% — exactly the `heal_target=222` their own last
  announcement carries, so the log runs one heal further than the state the
  reload's `w` states. Nothing here decides which of the two is right; what the
  health witness does about it, and why it measures the gap rather than skipping
  it, is written where the skip would have been
  (`tests/core/health-witness.test.ts`).

  It is also where the declarations stopped riding `tspell` only: both its
  `tcustom` messages state effects — `aura-ac_per` with `aura-resall`, and
  `critval-allies` with `critmval-allies` — and the second pair is what the
  recording brought in that no other holds (`docs/protocol-keys.md`).

- `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon.json` — fought by hand
  against the **only opponent of profession `p`** in the material, and the second
  recording whose opening call carries most of the fight: 627 of its 709 messages
  arrive there, opening with everybody at full health and ending with four of the
  ten already at zero. The 14 calls after it arrive a turn at a time,
  which is what the witness judges — 107 comparisons.

  ⚠️ **The second recording where the game contradicts itself about a combatant's
  health**, and the entry above is the first. For ten of the eleven, the last
  percentage the opening call states is the percentage the snapshot after it
  reports; for id 7926 it is 17.85% against 16.26%, 419 points apart, and the
  call's own message then states exactly what the log's figure less its own damage
  comes to. Measured rather than skipped, in the same place and for the same
  reason as the first (`tests/core/health-witness.test.ts`).

  It brought two keys no other recording carries — `bandage`, a combatant
  restoring a share of their own pool, and `+stun2-c` — and the first `+oth_dmg`
  whose element is `p`, which the help gives as damage from poison and which the
  panel had no word for (`docs/protocol-keys.md`, `src/ui/panel-words.ts`). It is
  also the first recording carrying `-poison_lowdmg_per` on something that is not
  a blow: seven poison ticks state their own reduction beside them, which is what
  moved that key and `poison` to the weakest placement the register has.

- `tests/captured-fights/2026-08-27-luvia-grupa-vs-amaimon-2.json` — the **largest
  recording in the material** and the one against the entry above's opponent
  thirteen minutes later, with a different party. 715 messages over 111 engine
  calls, and 110 of those calls carry a snapshot: it is the first `luvia` recording
  split turn by turn rather than arriving with most of its log in the opening call,
  which is what makes it the widest health witness the corpus has — 1 083
  comparisons against 107 for its sibling, and no disagreement anywhere.

  ⚠️ **The only recording carrying `lowheal_per-enemies`, and therefore the only
  one where a team heal is refused.** A fight declaring the reducer has none of its
  casts sized (`src/core/combatant-health.ts`), so all three of its `healall_per`
  casts stay counted as healing nobody could place, and its two casters are the
  first rows any recording has marked. Read as evidence for the sizing this is a
  fight that says nothing; read as evidence for the refusal it is the only fight
  that says anything, and it is the first material to reach either the refusal or
  §9.6's warning-on-a-row.

  Two more things it settles, both by having a third of something. `+stun2-c` had
  been read on four occurrences in one recording; its five here ride the same
  monster's blows and are followed one-to-one by a turn-loss message, which its
  sibling's four were not — and all 20 of that monster's blows carry `+dmgc` here
  too, so a second recording still cannot say which variant it is. And
  `active_absorbdest_per` gained a third declared share, `6`: three casters
  announce in this one fight, each says one value and never another, which is the
  clearest evidence yet that the share belongs to the caster and not to the skill
  (`docs/protocol-keys.md`).

- `tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json`,
  `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-3.json` and
  `tests/captured-fights/2026-08-15-tempest-grupa-vs-hildur-4.json` state a
  smaller maximum health for the same opponent than the other Hildur fights do.
  The opponent is the same; the strength it is met at is not, so a health figure
  quoted from one recording is a figure about that recording and not about the
  boss.
