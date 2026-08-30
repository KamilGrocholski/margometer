# 0008. The decoder produces a union of event kinds

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

Everything above the decoder is shaped by what the decoder hands it, and the shape is expensive to
change later: the statistics, the panel's rows and every drill below them read it.

The protocol states a fight as messages, and a message is not one fact. Measured over `captures/`,
2026-08-28: of 11,906 messages, 3,870 carry a figure of the damage family, and one of those messages
routinely carries several — raw and applied per element, what a defence stopped, a statistic
reduced, and effects that state no figure at all. Raw never arrives without applied and applied
never without raw, in any of the 3,870.

v1 shipped a union of ten kinds against this material through v0.10.1, and its statistics layer
reads that union directly.

## Decision

`core/battle-event.ts` holds a **discriminated union**, one variant per kind of thing the protocol
reports, discriminated on `kind`. `AttackEvent` carries the several figures of one blow together —
`raw`, `applied`, `prevented`, `destroyed`, `procs` — rather than being split into an event per
figure.

**The union grows one variant at a time, with the decoder step that produces it.** A variant nothing
produces is dead weight, and `tests/core/battle-event.test.ts` fails on one by decoding every
recording and comparing what arrives against `BATTLE_EVENT_KINDS`.

## Consequences

- The pairing of raw and applied survives into the statistics, where the difference between them is
  a figure the panel shows. Neither half can be aggregated without the other in front of it.
- A reader of the union must switch on `kind`, and the compiler holds the switch exhaustive.
- v1's statistics layer ports onto this shape rather than being re-derived, which is where the
  numbers this project is trusted for actually live.
- The union will be long before the decoder is finished. That is the cost accepted here.

## Alternatives

**One figure, one event.** A stream of `{kind, actorId, targetId, element, raw, applied}` and a
statistics layer that is a sum. Rejected: one blow's figures belong together — a raw figure whose
applied half is a separate event has to be re-paired by whoever consumes it, and the pairing is the
thing that is measured, not something to rebuild downstream.

**The grammar's shape, meaning in the aggregator** — an event of the two ends plus the message's
key-value pairs, with the aggregator deciding what a key means. Rejected: `ARCHITECTURE.md` gives
`core/fight-decoder.ts` the ownership of what a key means, and moving that up would put the
register's evidence one layer away from the code that acts on it.
