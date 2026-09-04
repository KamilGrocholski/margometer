# 0054. The window stands, folds, and reads what the other side is making ready

- **Status:** Accepted
- **Date:** 2026-09-04
- **Supersedes, in part:** **ADR 0053** — its window rule only. Everything that record says about
  reading an aura still binds.

## Context

**ADR 0053** put an aura in a window beside the panel and made that window come and go with the
fight: _there while something is running and gone when nothing is_, on the grounds that an empty
window would be a box on the game saying nothing.

Thirteen mockups (`design/pomocnik/`, commit `3482771`) asked the window to do more — the statuses
already counted and drawn nowhere, whose Ostatni Ratunek has been spent, and what a colossus is
charging — and the maintainer answered them with two requirements: **a minimise button, and the
window visible all the time, like the main one.**

The second contradicts **ADR 0053** outright, and the first is why. A window a reader can put away
themselves is a different object from one that decides for them:

- **A window that vanishes on its own cannot be told from one that broke.** The panel's whole
  argument is that a figure which might be wrong must not look like one that is right; a window that
  is simply _absent_ says nothing about which of the two happened.
- **A fold is the reader's own answer** and it survives a reload, so the reason **ADR 0053** gave —
  that nobody wants an empty box — is now something the reader settles rather than the panel.
- The window is no longer only auras. What it draws is what stands, and _nothing stands_ is a
  reading rather than an absence of one.

The third thing this round settled is what a charge costs to read. **It costs nothing:** `prepare`
is already in `DECLARATION_KEYS`, `DeclaredEffect` already carries `text`, and 302 declarations
already reach the aggregate carrying `Nazwa(procent%)` intact. No contract moves.

Two figures decided the rest, both measured over `captures/` on 2026-09-04:

- **Every one of the 70 charge series in the corpus belongs to an NPC**, over 23 of the 28
  recordings. A charge is what the other side is doing, which is why it has a section of its own.
- **A full charge is followed by a blow of its own before that combatant's next `prepare` in 78 of
  84 cases**, and the other six are fights that end there. Below full, the same holds for only 43 of
  218 — the game strikes while it charges.

## Decision

**The window stands whatever the fight is doing, and folds by its own control.** The frame never
hides; the fold takes the body and leaves the bar, so the gesture that put it away is the gesture
that brings it back. The fold is the window's own, kept apart from the panel's and stored apart from
it: two windows, two answers.

**An empty body says so in one line.** `Nic nie stoi`, in `quiet`, the least interesting thing the
panel draws. It says the fight is quiet and never that the reading failed — a failure still replaces
its own region and says which one, as every region does.

**A charge is drawn as the percent the game states, and never as turns.** The step size says how
many stops a cycle has, and how many turns a stop costs is this repository's inference rather than
the game's word, so the figure drawn is the game's own. It carries no hatched remainder either:
where an aura's row is part counted and part published, a charge is stated outright.

**A full charge is spent by its own combatant's next blow; a partial one is not.** That is the rule
the two figures above buy, and the observation that breaks it is a row reading `100%` that outlives
a blow by the combatant it stands on.

**What the reader watches is a list in the same frame.** Not a second window — a second window for
the settings of the second window would be a third window on somebody else's page — and not a modal,
which _The Quiet Panel Rule_ forbids outright. The list states what stands under **every** subject,
the ones turned off included: a reader who cannot see that has no way to tell a quiet fight from a
hidden one.

**Statuses are the one subject that starts off.** They are read per combatant rather than per cast,
so in a ten-on-ten they cost more rows than everything else together.

## Consequences

- The window is wider — 200px against 170 — because a row now carries a bar behind its name.
- **The hue moved off the name and onto the bar.** A name in the side's own colour standing over a
  bar tinted from that same hue is the pairing `DESIGN.md` measured at 2.26 against a floor of 4.5;
  the plain ink over the worst bar in the palette clears 5.09. This was drawn, looked at, and
  changed before it shipped.
- A reader's stored corner survives: the placement key keeps the strip's own name.
- `docs/statuses-standing.md` and `docs/auras-standing.md` are unchanged — what those readings mean
  did not move, only where they are drawn.

## What this does not decide

- **Nothing about `focus`.** It is measured — 465 non-zero readings, all carried by an NPC, all
  pointing at the other side, none changing inside a fight — and the key register still reads _not
  looked into_. A measurement without a register entry is a note, not a reading.
- **Nothing about the turn queue, the armour or the resistances.** All three stand unread in every
  payload, and each is its own round.
- **Nothing about a countdown.** **ADR 0053** still forbids one and this record does not touch it.
