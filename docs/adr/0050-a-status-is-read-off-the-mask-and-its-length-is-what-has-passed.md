# 0050. A status is read off the mask, and its length is what has passed

- **Status:** Accepted
- **Date:** 2026-09-03

## Context

The maintainer's list asked for the effects standing on a combatant: what they are, who applied
them, how long they will still run, and how much of that is left.

The game states them, and states nothing else about them. `payload.w.<id>.buffs` is a single
integer, present in every one of the 28 recordings — 4954 warrior records carry it and 57 do not,
which is a difference the reading keeps rather than flattening to zero (**E10**). The client reads
it bit by bit (`updateWarriorBuffs`, development build `1781609507010`) and tips nine of them from
`buffNames`: `deep_wound`, `wound`, `critical_deep_wound`, `poisoned`, `fire`, `swow_down`,
`speed_up`, `frostbite`, `shock`.

There is no duration in it, no caster, and no count of what is left. Nor is either anywhere else: no
message key in the corpus states a remaining turn count, none of the 96 keys `docs/protocol-keys.md`
decodes does, and neither do the 234 the client's own battle switch branches on.

One source does state a duration, and it is not the protocol. The published skill table
(`https://public-api.margonem.pl/we_get/skills/`, read 2026-09-03) writes an effect as
`key=value@turns` — `slowfreeze_per=45@2`, `aura-sa_per=20@8`.

⚠️ **The mask cannot be graded against it, and this record first said it could.** An earlier draft
put `speed_up` at 8 turns against `aura-sa_per=…@8`; that figure came from a proxy counting turns by
the payload's `current` changing, and the count this tree actually keeps says **22**, with
`swow_down` at 52 against a stated 8. Neither is a contradiction: a bit says a combatant is under
**some** such effect and not under one cast, so anybody's cast sets the same bit and a side with two
casters keeps it set continuously. The mask measures a side's whole exposure.

So the length here is counted in the bearer's own turns and graded against nothing — the register
says so in those words, and **ADR 0053** is where a stated duration is used, for a subject the mask
does not blur.

## Decision

**A status is read off the payload's own mask, and `src/core/combatant-status.ts` owns what a bit
means** — as `core/fight-decoder.ts` owns what a message key means. Statuses ride the roster path
rather than the message path, because that is what they are: payload state about a combatant, read
by `game/engine-warrior.ts` and never a `BattleEvent`.

**The walk reads further than the client does.** Its loop stops at bit 8; the mask `1056` sets bit
10 twelve times over `captures/`. The walk runs to the last bit a shift reaches below the sign, and
a bit past the nine is drawn as the bit it is — `Nieznany stan (10)` — never guessed a name for.
**V6**: the disagreement between what the game sends and what its own client reads is the finding.

**The length is what has already passed, counted in the bearer's own turns** — taken and lost both,
because a turn nobody spent still passed for whoever is carrying the status. **ADR 0022** puts the
cross-payload register in `core/fight-statistics.ts`, and the episodes are anchored on indices into
the fight's own events so the count needs no clock and no second pass.

**Nothing states how long a status has left, so nothing here says.** No countdown, no prediction, no
figure derived from the skill table for a bit of this mask. **ADR 0048**'s ban is untouched: nothing
is divided by a turn.

**The reading is kept and nothing draws it.** It reached the hover card in a first round and the
maintainer refused that presentation — a per-combatant status is not what he wanted seen, and **ADR
0053** draws the thing that is. What stays is the reading, `tools/status-standing.ts` and
`docs/statuses-standing.md`: this is the measurement 0053's own register is read beside.

**An episode is not one application, and the register says so.** A status reapplied before it wears
off never clears the bit, so the mask reads as one long spell — `Hildur Muza Śmierci` carries
`swow_down` for 47 of her own turns where the table states two. Both are true of different
questions, and `docs/statuses-standing.md` is where that is written down.

**A status the game had already set when this reader first saw the combatant is marked as such**, on
the run itself, so a length short by an unstated amount is never read as a measured one.

## Consequences

Easy: the corpus can be asked what stands on whom and for how long, which is the measurement **ADR
0053** needed before it could say what its own stated durations are worth.

Hard: the count answers a question next to the one a player asks. They want to know when the poison
stops; this says how long it has run. Both the register and this record say which one it is, and
nothing on screen states either — for this subject.

Also: 73 of the 201 statuses standing at the end of a recording were already set when their
combatant was first seen, so nearly two in five carry the short-count mark. That is the honest rate
and not a defect of the reading.

## Alternatives

**Predicting the remainder from the skill table.** Rejected twice over: the duration is per skill
level, which no payload states for an enemy, and it would need the caster identified — which **ADR
0052** measures and refuses. A countdown built on both would be the number that might be wrong
looking exactly like one that is right.

**Counting the length in payloads.** Exact, and meaningless to a person: a payload is not a unit
anybody plays in.

**Counting it across the whole fight's turns.** What `current` changing gives, and it disagrees with
the one published figure by an order of magnitude — a median of 11 against a stated 2, because it
counts everybody's turns rather than the bearer's.

**Reading only the nine bits the client reads.** It would have lost bit 10 silently, which is the
one genuinely new thing the mask carries.

**Emitting a `BattleEvent` per status.** Rejected: **ADR 0008** grows the union with the decoder
step that produces it, and no message produces this. The mask is warrior state, and the roster is
already read that way.
