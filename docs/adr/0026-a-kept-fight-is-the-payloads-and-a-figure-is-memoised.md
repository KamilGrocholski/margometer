# 0026. A kept fight is the payloads, and a figure is memoised rather than stored

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

There are two ways to hold a fight in this tree, and only one of them survives a version of the
add-on that reads the protocol differently.

`captures/` holds the raw payload under `ladunek`. `tools/recorded-fights.ts` lifts that field and
nothing else, and `tools/fight-replay.ts` feeds it to `addPayloadToSession` — the chain
`src/userscript-entry.ts` runs live. `captures/` states the add-on that wrote it under `dodatek`:
2026-08-30 five recordings name 0.8.1 or 0.9.0 and twenty-three name nothing, and all 28 replay
through the decoder this tree ships.

`src/game/kept-fights.ts` holds something else: `messagesByPayload`, which is the `m` list of each
payload, and `combatants`, which is this repository's extraction under
`src/game/engine-warrior.ts`'s `WARRIOR_FIELDS`. Everything else the payload carried is gone at the
moment of writing. A key the decoder learns to read after the write cannot reach a fight already on
the shelf, and a change to how a warrior is read cannot be applied backwards. `SHELF_VERSION` then
makes it worse rather than better: a shelf of another version is dropped whole, so the reader's
history is the price of every change to our own reading.

**The shelf also stores figures, against the rule it states.** `SECURITY.md` and the file's own
docblock both say a kept fight stores the inputs and never the computed numbers. Three fields say
otherwise: `outcome` is `composeFightStatistics(…).outcome` frozen at keep time
(`src/userscript-entry.ts`), and `messagesLost` and `hasJoinedInProgress` are counters the session
derived. Under **V6** that disagreement between a document and the material is the finding, and it
is what this record settles.

Measured over `captures/`, all 28 recordings, 2026-08-30, on Deno 2.9.6 / V8 15.0.245.2. A shelf of
twenty, in the two shapes — the heaviest twenty recordings, and the newest twenty:

|                              | messages and cast | raw payloads                  |
| ---------------------------- | ----------------- | ----------------------------- |
| the text, heaviest twenty    | 725 K             | 2520 K                        |
| the text, newest twenty      | 624 K             | 1801 K                        |
| parsing it, heaviest twenty  | 1.4 ms            | 10.8 ms                       |
| twenty rows, outcome frozen  | 0.0 ms            | —                             |
| twenty rows, outcome derived | 33.0 ms           | 34.5 ms                       |
| one fight derived            | —                 | 1.29 ms median, 3.18 ms worst |

**The payload shape is 1.5 ms of the 34.5.** Decoding is what the row costs, and it costs very
nearly the same whichever of the two shapes it decodes from — so the storage question and the
draw-cost question are separable, which they did not look like from the code.

The thinning rule in `src/game/fight-capture.ts` is what makes the raw figure affordable at all: it
keeps a call carrying messages, or introducing a payload shape or a combatant state not seen before.
Over the corpus it kept 1108 of 3285 delivered calls, and the sizes above are measured on what it
kept, not on what arrived.

One measurement decides the shape of the answer rather than the choice. `draw()` runs on **every
payload** — `handlePayload` calls `showAndMount`, which reaches `composeShelfRows`, which calls
`getOutcomeForKept` for every fight on the shelf. The corpus delivers 117 payloads per fight on
average. Deriving twenty rows on every draw is 34.5 ms × 117 ≈ **4.0 s of decoding per fight**.
Freezing the outcome was buying something real; what it was buying was a memo the panel never had.

## Decision

**A kept fight stores the payloads the game delivered, thinned by `src/game/fight-capture.ts`'s
rule, and the metadata the payloads do not carry.** The metadata is `openedAt`, `place`, `isPinned`
and the build the client was on. Nothing derived is written, and the sentence in `SECURITY.md`
becomes true rather than aspirational.

`place` stays metadata and is not an exception to that: it is read off the page by
`src/game/engine-place.ts` and was never in a payload.

**Every figure a shelf row states is derived through `addPayloadToSession`** — the chain
`tools/fight-replay.ts` already uses, so a fight off the shelf and a fight off a recording cannot
disagree — **and memoised in the keeper's own memory, keyed by `openedAt`.** The memo is memory and
never the store: it dies with the tab, which is the point. A figure that survives a reload is a
figure an older version computed, which is the thing this record is removing.

The memo is filled at two moments and no others: once for the whole shelf when the panel starts, at
34.5 ms for the heaviest twenty, and once per fight when a fight lands on the shelf, at 3.18 ms
worst. A draw reads it.

**The store's refusal drives the rotation.** `BrowserStore.write` already answers `boolean`. A shelf
that will not fit drops its oldest unpinned fight and writes again, under a fixed loop bound
(**S2**) and a stated maximum (**S11**), rather than holding a constant chosen against a quota
`SECURITY.md` forbids assuming.

## Consequences

- **A fight kept by this version is read by the next one.** The decoder gaining a key reaches back
  over the whole shelf, which is what the shelf could not do and a recording always could.
- **The shelf and a recording become one shape with two destinations**, and one reader. `N13` then
  covers both with one vocabulary instead of two spellings of a payload.
- **All three frozen figures become derivable, and none of them is a loss.** `messagesLost` is `mi`
  against `m` and both are in the payload; `hasJoinedInProgress` is whether the first payload
  carried `init`; `outcome` is the statistics. The comment in `keepFight` that admits deriving the
  outcome would mean decoding the fight again is answered by the memo, not by the store.
- **`SHELF_VERSION` stops versioning our reading.** It still drops a shelf whole when it moves, but
  what it now describes is the envelope around the payloads, which changes when we change it and not
  when the decoder learns something.
- **Between 2.9× and 3.5× the storage, on an origin that belongs to the game** (`SECURITY.md`). The
  refusal-driven rotation is what keeps that honest; without it this decision is a shelf that
  silently stops writing.
- **The game's prose and real nicknames now sit in `localStorage` for as long as the shelf holds
  them.** It is the reader's own fight in the reader's own browser and it is already in the page,
  but it is now written without the reader asking for a file, and _Data the reader's browser holds_
  in `SECURITY.md` gains that sentence. It is a decision, not a side effect.
- **The thinning rule could in principle drop a witness of a lost message**, and `captures/` has the
  same blind spot: a call whose `m` holds only text no reader takes has no messages, so it is
  droppable once its shape and its cast have been seen, while its `mi` still counts them. Measured
  over `captures/`, all 28 recordings, 2026-08-30: of 1048 payloads carrying both keys, none holds a
  message that does not read back and none states more than was read. Unobserved, and not created
  here — a recording has always been thinned by this rule.
- **Measured after the change, and the memo pays for itself exactly.** A full shelf of twenty with a
  twenty-first fight running, driven through the entry the way a browser drives it, 2026-08-30: 65.3
  ms per payload against 64.7 ms for the frozen-outcome version this replaced — the same within
  noise, over 18 derivations for 111 payloads. What is left is the panel rebuilding twenty rows on
  every draw, which predates this record and is unchanged by it.
- **The memo is keyed on the moment a fight opened, which is the shelf's identity everywhere.** Two
  fights under one moment would leave it answering with the first, and a monotonic clock cannot
  produce that. The line that drops a re-kept fight's entry is therefore held by reading: no test
  reaches it, and it stands because `keep` already defends the reader's pin against the same case.

## Alternatives

**Keep the messages and derive the outcome.** Fixes the frozen-figures half and leaves the frozen-
extraction half — the half that started this. Measured at 33.0 ms against 34.5, so it buys 4% of the
draw cost for none of the reach. Rejected: the expensive part of the shelf was never its arithmetic,
it was that our reading of a warrior is baked into it.

**Store the payloads and the derived figures both.** Rejected on the family **E10** belongs to: two
copies of one fact drift, and here the derived copy wins every time because it is cheaper to read.
That is the mechanism that produced the state this record is undoing.

**IndexedDB.** The real answer to the quota, and the quota it allows is larger by orders of
magnitude — this repository states no figure for either, which is `SECURITY.md`'s rule. Rejected now
on the shape of the boundary and not on storage: its reads are asynchronous, `ui/` is handed a
document and draws synchronously, and `src/game/browser-store.ts` states its whole surface as three
synchronous calls. That is a boundary change. It earns its own record on the day the refusal-driven
rotation is **measured** to be dropping fights a reader wanted.

**Compress before writing.** Would pay most of the 2.9× back. Rejected twice over: a compression
stream raises the browser floor, which is `[ASK]`, and it costs the one property that makes a stored
fight worth having — that it can be lifted out of the store and handed to `tools/fight-replay.ts`
exactly as it stands.

**Hold fewer fights.** Rejected as the decision, kept as the mechanism. As a constant it trades the
reader's history against a quota nobody measured; under the refusal-driven rotation the number is
the browser's answer rather than ours.
