# 0010. Sizing a share onto a side

- **Status:** Accepted
- **Date:** 2026-08-28

## Context

`healall_per` states a **share** and names only the caster. What it restores is stated nowhere else
in the protocol, so leaving it unread leaves a healing total short with nothing saying by how much,
and reading it as a declaration would silence a warning that is telling the truth.

Turning the share into health needs three figures the protocol never states: each member's maximum,
the health they entered the fight with, and the health they held when the cast landed. The first
comes from the combatant snapshots, the second is unwound from the first statement about each
combatant, and the third is the running reading the protocol restates every time it names somebody.

Measured over `captures/`, 2026-08-30: 115 casts across 22 recordings, shares of 30, 22.5, 15, 7.5
and five other values, four of them zero.

## Decision

A cast is sized onto **the caster's own side**, member by member:

```
restored = min(floor(share × maximum ÷ 100), entryHealth − healthHeld)
```

- **The caster is the actor slot.** Eight of the 115 name a different combatant in the target, so
  reading that slot would credit the wrong one.
- **The share is of the maximum, and it floors.** A share landing on 5629.5 moved 5629.
- **The cap is the entry health.** Dropping it reports 126% more healing than happened.
- **A cast lowers the next cast's headroom.** What one put back is health the next cannot put back
  again, and without that two casts between two statements each size against the health before the
  first.
- **A member missing any of the three is not sized, and the cast says so.** A partly sized cast
  keeps both readings: the figures for the members it could place, and the cast still counted as
  unplaced.
- **A cast on a side a reducer reached is refused whole.** `lowheal_per-enemies` reduces the healing
  of the side its own caster faced, by an amount the protocol never states, so a cast there cannot
  be sized at all — and reporting it short would be worse than reporting it missing.
- **A value with two members is not read.** The client composes a different sentence for one, no
  occurrence carries one, and reading the first member would be a figure rather than a refusal.

The sizing lives in `core/combatant-health.ts` and nowhere else. It is **derived**, not decoded: the
decoder sees messages and could not know any of the three figures.

## Consequences

- The health witness judges these calls now, and agrees. Of 17,958 comparisons between the
  protocol's own percentages and what was read, 17,286 agreed before the sizing and **17,729 agree
  after it** — 443 disagreements closed and none opened. The one remaining case where health
  vanishes is gap 12's payload, which no reading of this key touches.
- What is left is 133 comparisons where health still appears: casts this reading could not size,
  which is exactly what the unaccounted reading goes on saying.
- A recording that admits a fight with an unknown maximum will produce a partly sized cast, and the
  panel must draw both halves of it. That obligation is the reason `isWhole` exists.
- The reducer's rule rests on the published help rather than on the protocol, which states nothing
  about it. The material agrees — the only recording carrying the reducer has it cast by one side at
  the other, and every cast on the unreduced side sizes.

## Alternatives

**Leave it unread.** What it buys is honesty about one key at the price of a healing total that is
short in fourteen of twenty-eight fights, with the panel unable to say by how much. Rejected: the
figure is derivable and the derivation is checkable against the protocol's own percentages.

**Size without the cap.** Simpler, and it needs no entry health at all. Rejected on the measurement:
126% more healing than the percentages allow.

**Cap at the maximum instead of at the entry health.** Rejected: the readings that separate the two
caps sat exactly at their entry health while short of maximum and gained nothing.

**Size the other side too.** Rejected: the help scopes the effect to the caster's own side, and
every reading in the material closes with that scope.
