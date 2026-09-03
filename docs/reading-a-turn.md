# Reading a turn

How one message becomes a turn, and every message where that reading and the game's own numbering
disagree.

**This does not say what opens a turn.** [`docs/turns-taken.md`](turns-taken.md) owns that, together
with what the count comes to and what it does not claim. What is here is the step before it: how a
message reaches the rule at all, and which message a disagreement is standing on.

**Read off the recordings, not written from memory.** `tests/tools/turn-reading.test.ts` composes
the register below through `tools/turn-reading.ts` and refuses a row the tree does not produce and a
reading the register omits. The same test holds the reading against the aggregate the panel draws,
so the two cannot count a fight differently.

```bash
deno task turns:reading                        # the disputed openers
deno task turns:reading --keys                 # what each key stands behind
deno task turns:reading captures/<file>.json   # one recording, message by message
```

⚠️ **No message is written down here, and none is printed.** A `prepare` states the client's own
display text and so does an announcement, which is nobody here's to keep (`captures/AGENTS.md`). The
register names a payload and a message by number and the walk prints the message's **keys**; the
message itself is one file away, in `captures/`, where it already lives.

## What a message goes through

Four steps, and the rule is applied at the third:

1. **The payload's messages are decoded in order.** An announcement is glued to the message after it
   and no further, so what a message decodes to depends on the one before it — and on nothing else.
   `src/core/fight-decoder.ts` owns the gluing.
2. **One message becomes one or more events.** A blow, the health it moved, the damage it dealt to
   somebody it named, the announcement it rode — each is an event of its own, and nothing on any of
   them says they arrived together.
3. **Every event is asked whether it opens a turn**, and every event moves the standing, whether it
   opened one or not. `getTurnOpener` and `composeTurnStanding` in `src/core/fight-statistics.ts`
   are that rule, and `tools/turn-reading.ts` imports them rather than restating them.
4. **The standing carries across payloads**, because the aggregate walks one flat list of events and
   a payload boundary leaves no mark on it.

## Where the standing is decided by something that is not a turn

⚠️ **An event that is nobody's action clears the standing.** `composeTurnStanding` answers a blow,
an announcement and a declaration; everything else falls through to a standing of nobody — a tick of
poison, a figure the protocol half-named, a message that went unread.

That is the mechanism the register below exposes, and it turns on a distinction that is about **how
damage is reported** rather than about turns:

| the message before states | it decodes to                 | the standing after it | a `prepare` next |
| ------------------------- | ----------------------------- | --------------------- | ---------------- |
| a `?dmg*` figure          | an attack                     | that combatant acted  | rides its turn   |
| an `+oth_dmg` figure      | damage to a combatant by name | nobody acted          | opens a turn     |

Both are one combatant striking. `docs/protocol-keys.md` owns what each key means, and it is the
protocol's own split: a blow aimed at the message's target carries the first, and damage that landed
on somebody the message names carries the second. Nothing about that split is a statement about
turns, and the reading turns on it anyway.

## The register

Every opener the game's own numbering disputes: a turn opened on a `prepare` whose combatant was
named by the message before it, standing inside a stretch the game numbered and this count did not
match. `from` and `to` are that stretch's ordinals and `counted` is what was counted inside it —
`docs/turns-taken.md` carries the advance each was measured against.

**A row is not a proof that this message is the error.** It is the one opener in a disputed stretch
whose suppression could have gone the other way. Where a stretch is over by one, that is a strong
claim; where it is short, the opener is contested and is not the shortfall.

| recording                                               | payload | message | combatant | from | to  | counted | key       |
| ------------------------------------------------------- | ------- | ------- | --------- | ---- | --- | ------- | --------- |
| 2026-08-06-tempest-grupa-vs-hildur-1785244275300-none   | 25      | 2       | -10000249 | 57   | 59  | 3       | `prepare` |
| 2026-08-12-tempest-grupa-vs-draugr-1-1786514810315-none | 11      | 20      | -10000234 | 45   | 57  | 13      | `prepare` |
| 2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none | 40      | 9       | -10000252 | 97   | 106 | 10      | `prepare` |
| 2026-08-12-tempest-grupa-vs-hildur-2-1786514810315-none | 17      | 31      | -10000253 | 57   | 73  | 17      | `prepare` |
| 2026-08-14-tempest-grupa-vs-draugr-1-1786514810315-none | 46      | 15      | -10000631 | 141  | 149 | 9       | `prepare` |
| 2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none | 15      | 15      | -10000544 | 67   | 77  | 11      | `prepare` |
| 2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none | 22      | 14      | -10000544 | 126  | 133 | 8       | `prepare` |
| 2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none | 33      | 21      | -10000544 | 171  | 181 | 11      | `prepare` |
| 2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none | 10      | 2       | -10000545 | 192  | 194 | 3       | `prepare` |
| 2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none | 14      | 21      | -10000545 | 205  | 220 | 14      | `prepare` |
| 2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none | 14      | 22      | -10000545 | 205  | 220 | 14      | `prepare` |
| 2026-08-15-tempest-grupa-vs-hildur-3-1786514810315-none | 10      | 10      | -10000551 | 20   | 27  | 8       | `prepare` |
| 2026-08-15-tempest-grupa-vs-hildur-4-1786514810315-none | 10      | 10      | -10000551 | 20   | 27  | 8       | `prepare` |
| 2026-08-17-tempest-grupa-vs-hildur-1786514810315-none   | 5       | 5       | -10006793 | 81   | 87  | 7       | `prepare` |
| 2026-08-25-luvia-grupa-vs-draugr-none-none              | 34      | 3       | -10124094 | 303  | 305 | 3       | `prepare` |
| 2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0      | 10      | 4       | -10003924 | 12   | 16  | 5       | `prepare` |
| 2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0      | 28      | 36      | -10003924 | 65   | 83  | 19      | `prepare` |
| 2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0      | 41      | 7       | -10003924 | 119  | 123 | 5       | `prepare` |

## What each turn was opened by

Every turn, by the answer the rule gave rather than by the key beside it. This one **partitions** —
one turn is opened by exactly one event, so the column is the corpus's turns and nothing is counted
twice. What each opener means is `docs/turns-taken.md`'s; the names here are the rule's own, the
event kind and, for a declaration, the key that decided it.

| opened by             | turns |
| --------------------- | ----- |
| `skill-used`          | 3349  |
| `attack`              | 1434  |
| `declaration/prepare` | 200   |
| `declaration/step`    | 171   |

## The keys a turn was read off

Every key that arrived on a message which opened a turn or stated one spent on nothing.

| column     | counts                                                          |
| ---------- | --------------------------------------------------------------- |
| `messages` | the messages the key arrived on                                 |
| `opened`   | how many of those opened a turn, whatever it was that opened it |
| `adds`     | how many would not have opened one without this key             |
| `lost`     | how many stated a turn nobody spent                             |

**`adds` is the causal column, and it is measured rather than reasoned.** The key is taken out of
the message, the message is read again against the standing it actually met, and where the turn is
then gone or somebody else's, the key added it. Four keys in the corpus ever answer to that, and
their sum plus the turns opened by a blow is the whole of the count above.

⚠️ **`opened` is not `adds`, and the gap between them is the point of carrying both.** A key with a
large `opened` and no `adds` was on the message and decided nothing: a key riding every blow shows
the count of the blows it rode. Only `adds` is a claim about cause.

⚠️ **A blow adds no key at all, and that is a finding rather than a gap.** Its figures arrive in
pairs — raw beside applied — so taking either away leaves the other and the message is a blow still.
What opens a turn there is that the message carries a figure at all, which is a property of no
single key. Those turns are the `attack` row of the table above and appear in no `adds` cell.

**`messages` is not `docs/protocol-keys.md`'s occurrence count**, and the two disagree wherever a
message carries the same key more than once — an attack naming several combatants states its
reduction against each of them. That register counts the occurrences; this one counts the messages.

| key                           | messages | opened | adds | lost |
| ----------------------------- | -------- | ------ | ---- | ---- |
| `tspell`                      | 3342     | 3342   | 3342 | 0    |
| `skillId`                     | 3003     | 3003   | 0    | 0    |
| `+dmgd`                       | 1485     | 770    | 0    | 0    |
| `-dmgd`                       | 1485     | 770    | 0    | 0    |
| `+dmgc`                       | 1361     | 469    | 0    | 0    |
| `active_absorbdest_per`       | 465      | 465    | 0    | 0    |
| `+resdmg`                     | 1176     | 458    | 0    | 0    |
| `-dmga`                       | 1229     | 453    | 0    | 0    |
| `-dmgc`                       | 1313     | 451    | 0    | 0    |
| `+dmg`                        | 1726     | 445    | 0    | 0    |
| `-dmg`                        | 1726     | 445    | 0    | 0    |
| `+taken_dmg`                  | 1206     | 438    | 0    | 0    |
| `combo-max`                   | 434      | 434    | 0    | 0    |
| `+acdmg`                      | 928      | 404    | 0    | 0    |
| `+crit`                       | 903      | 333    | 0    | 0    |
| `active_decblock_per`         | 305      | 305    | 0    | 0    |
| `+oth_dmg`                    | 466      | 293    | 0    | 0    |
| `+dmgl`                       | 675      | 231    | 0    | 0    |
| `-poison_lowdmg_per`          | 485      | 228    | 0    | 0    |
| `+pierce`                     | 388      | 205    | 0    | 0    |
| `prepare`                     | 302      | 200    | 200  | 0    |
| `+dmgf`                       | 492      | 194    | 0    | 0    |
| `-dmgl`                       | 608      | 194    | 0    | 0    |
| `-absorb`                     | 624      | 180    | 0    | 0    |
| `step`                        | 171      | 171    | 171  | 0    |
| `active_block_per`            | 154      | 154    | 0    | 0    |
| `shout`                       | 154      | 154    | 0    | 0    |
| `mana`                        | 128      | 128    | 0    | 0    |
| `heal_target`                 | 117      | 117    | 0    | 0    |
| `healall_per`                 | 115      | 115    | 0    | 0    |
| `active_decblock_per-enemies` | 107      | 107    | 0    | 0    |
| `alllowdmg`                   | 107      | 107    | 0    | 0    |
| `-dmgf`                       | 325      | 104    | 0    | 0    |
| `allslow_per`                 | 104      | 104    | 0    | 0    |
| `-blok`                       | 175      | 94     | 0    | 0    |
| `aura-sa_per`                 | 75       | 75     | 0    | 0    |
| `+abdest_per`                 | 257      | 71     | 0    | 0    |
| `+abmdest_per`                | 257      | 71     | 0    | 0    |
| `energy`                      | 70       | 70     | 0    | 0    |
| `+dmgo`                       | 348      | 62     | 0    | 0    |
| `-dmgo`                       | 333      | 62     | 0    | 0    |
| `+spell-taken_dmg-all`        | 59       | 59     | 0    | 0    |
| `-absorbm`                    | 301      | 53     | 0    | 0    |
| `aura-adddmg2_per-meele`      | 47       | 47     | 0    | 0    |
| `+injure`                     | 76       | 41     | 0    | 0    |
| `aura-ac_per`                 | 41       | 41     | 0    | 0    |
| `aura-resall`                 | 41       | 41     | 0    | 0    |
| `+fastarrow`                  | 54       | 28     | 0    | 0    |
| `+acdmg_destroyed`            | 43       | 20     | 0    | 0    |
| `-evade`                      | 39       | 19     | 0    | 0    |
| `+engback`                    | 347      | 18     | 0    | 0    |
| `+crush_physical`             | 23       | 15     | 0    | 0    |
| `+legbon_holytouch`           | 58       | 15     | 0    | 0    |
| `+legbon_anguish`             | 18       | 12     | 0    | 0    |
| `+legbon_verycrit`            | 30       | 11     | 0    | 0    |
| `+of_crit`                    | 72       | 10     | 0    | 0    |
| `+stun2-c`                    | 9        | 8      | 0    | 0    |
| `+thirdatt`                   | 24       | 8      | 0    | 0    |
| `-legbon_facade`              | 15       | 8      | 0    | 0    |
| `-thirdatt`                   | 24       | 8      | 0    | 0    |
| `-legbon_cleanse`             | 25       | 7      | 0    | 0    |
| `-legbon_critred`             | 11       | 7      | 0    | 0    |
| `tcustom`                     | 7        | 7      | 7    | 0    |
| `+critsa`                     | 38       | 5      | 0    | 0    |
| `en-regen-cast`               | 5        | 5      | 0    | 0    |
| `+stun2`                      | 4        | 4      | 0    | 0    |
| `-pierceb`                    | 6        | 4      | 0    | 0    |
| `lowheal_per-enemies`         | 4        | 4      | 0    | 0    |
| `+legbon_curse`               | 12       | 3      | 0    | 0    |
| `+legbon_puncture`            | 7        | 3      | 0    | 0    |
| `legbon_lastheal`             | 12       | 3      | 0    | 0    |
| `-contra`                     | 3        | 2      | 0    | 0    |
| `removedot-allies`            | 2        | 2      | 0    | 0    |
| `+absorb`                     | 2        | 1      | 0    | 0    |
| `+critpoison_per`             | 10       | 1      | 0    | 0    |
| `+rage`                       | 2        | 1      | 0    | 0    |
| `-legbon_glare`               | 3        | 1      | 0    | 0    |
| `-tenacity`                   | 20       | 1      | 0    | 0    |
| `bandage`                     | 1        | 1      | 0    | 0    |
| `critmval-allies`             | 1        | 1      | 0    | 0    |
| `critval-allies`              | 1        | 1      | 0    | 0    |
| `removeslow-allies`           | 1        | 1      | 0    | 0    |
| `removestun-allies`           | 1        | 1      | 0    | 0    |
| `txt`                         | 342      | 0      | 0    | 319  |

## What this cannot answer

- **Which opener in a stretch is the wrong one, where more than one is contested.** The game numbers
  the stretch and not the messages inside it, so a stretch carrying two contested openers says one
  of them and never which.
- **A stretch whose count is wrong and whose openers are all uncontested.** The corpus carries such
  a stretch, and it has no row here at all: nothing in it was opened on a contested `prepare`, so
  what went wrong there is a suppression that held rather than one that failed.
- **Whether a contested opener that the game agrees with is right.** Most of them are, and the
  register does not carry them: a stretch the numbering counts right is a stretch where every opener
  inside it stands.
- **Anything about a fight the game numbered once.** No stretch, no dispute, and no row — the same
  limit `docs/turns-taken.md` states, for the same recordings.
- **Which key a turn was opened _on_, where several could have.** The tally credits every key on the
  message, because the rule reads events and not keys: by the time it answers, which key produced
  the event it is looking at is gone.
- **Anything about a fight nobody recorded.** Every row is a claim about `captures/` and about
  nothing else (**V4**).
