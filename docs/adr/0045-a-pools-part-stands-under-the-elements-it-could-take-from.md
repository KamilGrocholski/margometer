# 0045. A pool's part stands under the elements it could take from

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

ADR 0012 counted what an absorption pool took as dealt and taken. To keep every cut summing to the
figure above it, it also made each pool a kind of its own in the cut by kind. `TYP OBRAŻEŃ`
therefore drew `absorpcja` and `absorpcja magiczna` beside the elements. Neither is a type of
damage: nothing deals absorption. A pool is the struck combatant's defence, and the damage it took
was of some element.

The game's published help, article view,372 in the dump fetched 2026-10-06 and read 2026-10-07, says
which elements each pool reduces:

- physical absorption reduces physical damage;
- it never reduces auxiliary damage;
- it reduces ranged damage only for a character who has learned `absorbd`;
- magical absorption reduces fire, cold and lightning.

Measured on 2026-10-07 over `captures/` through `replayRecordedMaterial`, taking each pool's figure
against the elements in the raw half of the blow it rides:

- Physical absorption took 979,166 points. On every blow carrying it, exactly one of `dmg` and
  `dmgd` put something out. 24,791 of those points rode a blow that also landed auxiliary damage.
- Magical absorption took 493,360 points. 67,155 of them rode a blow with exactly one of fire, cold
  and lightning. 303,841 rode cold with lightning, and 122,364 rode fire with cold.
- Every pool's figure rode at least one of its own elements. No blow carried all three magical
  elements beside magical absorption.
- An element can put something out in the raw half and land nothing. 37 blows of magical absorption
  over raw cold, ranged and fire landed no fire at all.

## Decision

Decided with the maintainer on 2026-10-07.

**A pool's part joins the cut by kind under the one element of the blow it could have taken from.**
Which elements a pool takes from is the help's, held in `src/core/protocol-key.ts` beside the
mechanism. The candidates are read off the raw half, because an element a pool took whole is missing
from the applied half.

**Where the blow carried several of the pool's elements, the part stands under all of them at once,
said as one or another: `zimno lub błyskawice`.** The protocol states one figure per pool, and why
no split of it can be recovered is `docs/protocol-keys.md`'s, at `-absorbm`. A row that names every
candidate states everything it says, and claims no element it does not. Where none of the pool's
elements rode the blow, the part stands under every one of them, since it took from one of those all
the same. No recording holds that case yet.

**The figures do not move.** `Zadane`, `Otrzymane`, the hardest blow, the cuts by the other end and
by skill, and the lines of what a pool took under `Zadane` and `Otrzymane` stay as ADR 0012 drew
them. Only the cut by kind changes.

**The bound on a cut counts these kinds at the edge.** `prepareCutKeys` counts the kind each pool's
part will stand under. Before this, it never counted the pools' own kinds, so the assertion past the
edge was the only thing holding them.

Rejected: **closing the part into `Bez podanego typu`.** That row is the regression guard of
`tests/ui/panel-content.test.ts`, held to never appear on a recording. It is ours, not the game's.
Giving it a meaning the protocol can reach would leave a forgotten writer unseen.

Rejected: **drawing health alone under `TYP OBRAŻEŃ`.** The section would stop summing to the figure
over it, and the pairs that take their total off the cut by both ends would disagree with the cut by
one.

Rejected: **sharing a part among its candidates, in proportion.** That puts under an element a
figure the protocol never stated, which ADR 0012 already turned down.

Rejected: **one row for every part the blow does not place.** It would say less than the candidate
rows say, for no fewer rows: the material holds two such pairs.

## Consequences

- On 2026-10-07 over `captures/`, the kind rows the corpus draws fell from 2,351 to 2,208. That is
  193 pool rows gone and 50 candidate rows added, and nothing else moved them. The levels walked
  went from 17,494 to 17,208 and the share columns from 53,941 to 53,226, each a multiple of the
  same 143.
- The saved file's report carries the new kind keys in its `…ByKind` cuts, dated by `addOnVersion`.
  `formatVersion` stays 4, for the reason ADR 0012 gives.
- A player sees elements where `absorpcja` stood, which is a **Zmiana** in the changelog.
- What each pool takes from is the help's. A recording where a pool's figure rides none of its
  elements would contradict the help, and it is a finding (V6).
