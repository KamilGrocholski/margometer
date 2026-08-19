# What lets a tick name its source

Status: implemented

`docs/specs/2026-08-19-a-wound-remembers-who-dealt-it.md` filled one end of one key
from a message earlier in the fight, and AGENTS.md §9.6 made that a clause with
`[ASK]` on any second pair. This round asks the obvious next question of every key
rather than of the one that came up, and answers it: **there is no second pair**,
and what decides it is not resemblance but three separate things a key either has
or has not.

## What was asked for

> Check which keys can be parsed using a previous message — just like `injure`
> ("Zranienie")

## The test, taken off the case that passed it

A tick states a victim and nobody else. Filling the other end from an earlier
message needs all three of:

1. **an announcement in the protocol** — a key stating that the effect was applied,
   on a message that names both ends;
2. **a figure on that announcement** — so *which* application is ticking is read
   rather than assumed;
3. **a rule making one application the owner** — the published help saying the
   victim carries one at a time, so the freshest application is whose it is.

`injure` has all three. Nothing else has more than two, and two is not a join:
without the figure the tick is charged on a resemblance, and without the rule the
freshest attacker is simply the wrong one.

## Every tick the client composes

Production build `1786514810315` composes fifteen messages of the shape
`msg_<key> %name% %val%` — one combatant's name, one figure, the shape a tick
arrives in. Six of them state healing or mana rather than damage (`afterheal`,
`healall`, `healall_per`, `managain`, `manatransfer`, `receivemana`), and the
question does not arise for them: `healall_per` and `afterheal` are read already,
and none of the rest has ever reached a capture. The other nine are the ones a
damage figure can tick under:

| tick | announced by | figure on it | the help's rule for the type | verdict |
|---|---|---|---|---|
| `injure` | `+injure` | yes | overwritten by the freshest, no accumulation | **read** — §9.6's fourth clause |
| `critwound` | `+critwound` | **no** | the same type, the same rule | declined — nothing identifies which application, and no material |
| `wound` | `+wound`, `+of_wound` | **no** | **not** overwritten, **accumulates** | declined twice over |
| `poison` | nothing | — | not overwritten; a later hit extends it and the highest figure stands | declined |
| `fire` | nothing | — | overwritten by the freshest | declined — nothing states an application |
| `light` | nothing | — | overwritten by the freshest | unread key, no material |
| `frost`, `physical`, `absolute` | nothing | — | not among the types the table lists | unread keys, no material |

The rules come from the game's published help, article `view,372` (read
2026-08-19), which tables the five types of damage over time against whether a
fresh application overwrites what is ticking and whether applications accumulate.
The announcements come from the client's own key list
(`tests/frozen-protocol-keys.ts`, production build `1786514810315`): `+injure`,
`+critwound`, `+wound` and `+of_wound` exist, and there is no `+poison`, `+fire`,
`+light`, `+frost`, `+physical` or `+absolute` to read.

## What the captures leave standing

Decoding all seventeen recordings as the set stood 2026-08-19 and counting every
event that reaches the aggregate with an end the message did not name:

| | | answered by |
|---|---|---|
| `heal` | 1 236 | the help — the healed combatant's own (§9.6) |
| `poison` | 496 | **nothing** |
| `injure` | 151 | its `+injure`, one message or more earlier (§9.6) |
| `legbon_holytouch_heal` | 133 | the help, as `heal` |
| `healall_per` | 85 | the game's published arithmetic, sized onto the side (§9.6) |
| `fire` | 12 | **nothing** |
| `legbon_lastheal` | 5 | the help, as `heal` |

So the whole of what an earlier message could still be asked for is `poison` and
`fire`, and the table above is why neither can be. No attack event in the material
is missing an end at all, and no message names neither end.

## Why `fire` is the near miss and still a no

It is the one key with the *rule* and not the announcement: the type is
overwritten, so the freshest application would own the tick — and the protocol
never says an application happened. Reading the neighbouring message instead is
the alternative `docs/specs/2026-08-19-a-wound-remembers-who-dealt-it.md` already
rejected for wounds, and the material says what it would come to. In
`tests/captured-fights/2026-08-15-tempest-grupa-vs-draugr-1.json`, the only
recording carrying the key, all 12 ticks fall on one victim, the figure moves
across the fight (96, 97, 117 twice, then 124 for the last eight), and the blow
standing before them belongs to **eight different combatants** — so the neighbour
rule would deal one burning victim's damage out to most of the party.

## ⚠️ One limit on the reading already in place

The help's table gives the type `injure` ticks under as sourced by **two** events —
the injure event and the heavy wound — so a `+critwound` overwrites what a
`+injure` applied. `src/core/fight-statistics.ts` pairs a tick with an
announcement of its own key and requires the figures to agree, which is what keeps
that safe: after such an overwrite either the tick arrives under `critwound` and is
no concern of the pairing, or it arrives under `injure` stating the heavy wound's
figure and is charged to nobody. Both are the decline the clause already lists, and
neither can be watched happening until a recording carries `critwound`.

## What this round wrote down

No code changed — the sweep's answer is that nothing new can be read.

- `tests/core/protocol-key-register.test.ts` re-earns the missing announcement:
  every key the register charges to `nobody` is checked against the client's key
  list for the twin the client would spell it with, and the one key that has a twin
  is checked to be found by that same composition. The day the game ships
  `+poison`, the gate says so.
- `docs/protocol-keys.md` carries the answer per key: `poison` and `fire` say why
  no earlier message names them, and `wound` and `+wound` join `critwound` in the
  section for keys no capture has carried.
- AGENTS.md §9.6's fourth clause states the three-part test, so `[ASK]` on a second
  pair is a question with a checklist rather than a matter of taste.

## Rejected alternatives

**Charging a `fire` tick to whoever last struck the victim.** The measurement
above: eight combatants for twelve ticks on one victim. It is the same rule the
decoder already refuses for skills — waiting for a match and eventually handing
somebody another combatant's figure.

**Charging a `fire` tick to the skill announcement above it.** The help gives the
type's source as a skill requiring fire damage, so an announcement is at least the
right kind of thing. It states a skill name in the player's own language — which is
the operator's prose and stays out of this repository (§5) — and no figure; and in
the material the announcements standing over the ticks are ordinary blows by
whoever was acting — eight of the twelve carry a skill announcement of their own
and four carry none at all. That is the neighbour rule wearing a better hat.

**Adopting the `injure` join for `critwound` by analogy.** Same type, same
overwrite rule, and `+critwound` states no figure. The analogy is exactly what
would be charging damage on a resemblance, and `docs/protocol-keys.md` had already
declined it a round earlier.

**Widening the pair to `wound` because it is announced twice over.** `+wound` and
`+of_wound` carry no figure, and the type accumulates: several attackers' wounds
are one ticking figure, so even a figure would not name an owner. It is the one key
that fails all three parts of the test.

**Filing register entries for `frost`, `physical`, `absolute` and `light`.** They
tick in the same shape and nothing else is known about them: no capture carries
one, and the help's table does not list three of the four. An entry would be a
verdict with nothing behind it, which is the bulk `docs/protocol-keys.md` refuses
(§7.1).

**A general mechanism in the aggregate — carry every announcement forward, match
by figure.** There is nothing to feed it. One pair exists, it is already read, and
a second is `[ASK]`; a framework for keys that may never arrive is scaffolding
(§7.1).
