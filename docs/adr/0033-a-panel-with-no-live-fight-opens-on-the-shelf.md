# 0033. A panel with no live fight opens on the shelf

- **Status:** Accepted
- **Date:** 2026-08-31

## Context

`startMargoMeter` puts the panel up when the wrap goes on, and until this decision it drew the
sentence saying there has been no fight whenever the session held none. A page loaded between fights
is exactly that page, and it is the ordinary one: a reader who walks into the game is holding a
shelf of up to twenty kept fights and a session of nothing.

**The shelf was unreachable there, and so was the strip saying where it is kept.** Both live on the
shelf screen, whose control is on the bar; the press set the screen and the panel redrew the waiting
sentence, because the same condition decided both. So the fights a reader had kept could be opened
only after the next fight had started, and the choice of where they are kept could not be changed at
all until then.

v0.10.1 did not have this. It opened on the fight that was on screen when the last page went away,
kept under a fifth browser key, and on the newest kept fight where the reader had chosen none — a
release note of `0.10.0` promises it in those words.

## Decision

**Where the session holds no fight and the shelf holds one, the panel draws the newest kept fight.**
The shelf, the pin and the storage strip are reachable from the first moment the panel is on the
page. Where the shelf is empty too, the waiting sentence stands as it did.

A fight the reader chose off the shelf still wins over both, and a live fight wins over the newest
kept the moment a payload arrives — so this answers only for the gap between fights.

## Consequences

Nothing is written down to make it work: the answer is read off the shelf that is already in the
store. What a reader loses against `0.10.1` is which fight they come back to — the newest rather
than the one they were reading — and `CHANGELOG.md` says so.

One condition decides one thing. `showFight` answers whether it drew, and every caller falls back to
the waiting sentence on that answer alone, so a fifth place asking `getFightFromSession` cannot
disagree with the other four.

## Alternatives

**The fifth key, as v1 had it.** It comes back to the fight that was on screen, which is a better
answer to _where was I_. Rejected for now: it is a fourth thing this add-on writes into somebody's
browser, and the gap it closes is the difference between two fights the reader can see side by side
on a shelf that is now one press away. **C9** — it arrives when the newest turns out to be the wrong
answer often enough to say so.

**Leave the waiting sentence and let the shelf open over it.** The control would work and the panel
would carry a screen with no fight behind it. Rejected: every row on that shelf opens a fight, so
the screen the reader lands on after one press is the one this decision draws anyway — reached by
two presses instead of none, with a sentence in front of it saying there has been no fight while
twenty are listed under it.
