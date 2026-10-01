# 0019. Each event's entry is the name the design gives it

- **Status:** Accepted
- **Date:** 2026-10-01

## Context

ADR 0018 made P2 a rule — each event changes state at one point — and left the shape of its guard
open. Two readings were on the table, and both missed:

- **Reachability from the entries of `docs/design.md` §10.** Every `render…` reaches back to
  `startMargoMeter` through the callbacks it hands the page, so the graph separates nothing.
- **Direct callers, by verb.** A gesture's entry is an `on…` as the frame's is, so a verb that lets
  the frame draw lets a gesture draw too, which is what P2 exists to forbid.

Read on 2026-10-01 at `14223de`, a guard over direct callers met three things in `src/`:

- `markStale` called the frame's drawing itself where the page lends no frame (§10.4), under the
  name `renderRuntimeFrame`, so the one entry that draws was named twice and called from two places.
- The payload's entry is the `onPayload` method of an object `initLiveFight` builds. The guards'
  shared caller climb names declared functions only, and found `initLiveFight` there.
- `onHover` in `src/ui/panel-element.ts` draws the card as the pointer reaches a row. §10 described
  no such event.

## Decision

Decided with the maintainer on 2026-10-01.

**Each entry is the name the heading of its section in `docs/design.md` §10 gives it, and the guard
reads that name off the design.** It takes the first name in code of §10.4's heading for the frame,
§10.7's for the card and §10.2's for the payload, as the purity guard reads N2's table. The code and
the design then call an entry the same thing, or the gate is red.

- **The frame's entry is `onFrame`**, which `markStale` hands the page and calls itself where no
  frame is lent. Every drawing goes through it.
- **§10.2's heading names `onPayload`**, the method under the game's `updateData`.
- **The card is an event of its own, §10.7, entered at `onHover`.** It is the view's own state —
  which key is open, where the card stands — reaches neither the runtime nor the session, and
  answers the pointer with no frame between.

**A `render…` is called by a render, an init, the frame or the card; a `commit…` by a commit, a
replay or the payload.** An init stands the view up at the start (§10.1); a replay commits into a
session it made itself. A gesture neither draws nor commits: it sets the flag.

**The guard climbs to an object's method as to a declared function.** `tests/repository/` shares one
caller climb for S1, P1 and S4, and that one stays as it is; P2's names a method by its key.

Rejected: **verbs alone.** The gesture is `onIntent`, and anything that let `on…` draw would let it.

Rejected: **reachability.** Every render reaches back to the start, as the context measured.

Rejected: **the card drawn in the frame.** It would follow the pointer a frame late, and the view
would have to be handed `markStale` for a state the runtime never reads.

## Consequences

- `tests/repository/event-entries.test.ts` holds P2 over `src/`. It met the tree green once
  `renderRuntimeFrame` was `onFrame` and §10.7 named the card.
- A new entry is a new section of §10 and a new heading the guard reads. A function drawing from
  anywhere else is a finding, either in the code or in the design.
