# A place for what we learned, that cannot rot

Status: implemented

## Problem

Work on this project keeps producing two kinds of durable knowledge:

- **about the game** — what a protocol key means, which keys turned out not to
  be protocol keys at all, which hypotheses were tested and rejected;
- **about working here** — traps that cost a round and would cost another.

Both currently live in commit messages only. That makes them dated and immutable,
which is right, but findable only through `git log --grep`, which in practice
means not findable. The concrete cost already paid: `attack` and `attack2` were
investigated, found not to be battle keys, and nothing outside one commit body
records it.

## Solution

A `docs/` directory holding **only** things that either carry a guard or cannot
age:

- `docs/protocol-keys.md` — a register of keys looked into: verdict, evidence,
  state. Guarded in both directions against the decoder and against the frozen
  key table, so it can neither get ahead of the code nor fall behind it.
- `docs/specs/` — dated design records for rounds that needed designing. A spec
  is a record of a moment, so it does not age; it only ages when it pretends to
  describe the present.
- `tools/decoding-status.ts` — progress **computed**, never written down.
- Process lessons become **rules in `AGENTS.md`**, with a guard where one is
  possible, rather than entries in a file.

The rule that holds the whole thing: `docs/` may contain a guarded register or a
dated spec. No status, no progress, no chronicle of rounds.

## Rejected alternatives

**A memory bank** (`activeContext.md`, `progress.md`, `systemPatterns.md`) — the
most common pattern in the field. Rejected because its own well-known weakness
is that it works only as well as the discipline maintaining it: no automatic
capture, no conflict resolution, no versioning beyond git. That is a description
of the 4,457-line register this project deleted, which carried 105 paragraphs of
the form "this used to say X until date Y".

**A `lessons.md`** the agent appends to. Same objection in a smaller package: an
append-only file with no producer and no consumer. A lesson that stays a lesson
is inert. A lesson that becomes a rule or a guard starts binding, and then the
file is redundant.

**A hidden `.ai/`** signalling "for tools, not for people". Rejected because
nothing here is for tools only — the key register is exactly what a human wants
in three months — and because a hidden directory is read less and corrected
less, which is the mechanism that rotted the previous `docs/`.

**A ratchet on the unread-key counter**, failing the gate if it rises. Attractive
and still possible, but it needs a stored baseline number, which is a new thing
to maintain. Deferred until the counter actually rises unnoticed.

## Verification

Guards land with the files: the register against decoder and game, spec status
shape, and invariants over `getDecodingStatus`. Each was checked by mutation —
an entry removed, an entry overclaiming, a spec without a status line.

## What stays open

The register covers protocol keys only. A question about the game that is not
about a key has nowhere to go yet; that file appears when the first one is
asked, not before.
