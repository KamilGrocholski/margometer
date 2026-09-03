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
deno task turns:reading                        # the register below
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
- **Anything about a fight nobody recorded.** Every row is a claim about `captures/` and about
  nothing else (**V4**).
