# 0057. Damage stated by name is still its striker's turn

- **Status:** Accepted
- **Date:** 2026-09-07

## Context

`docs/turns-taken.md` graded this count against the game's own numbering and carried a finding it
did not answer: every disagreement ran one way. Measured over all 29 recordings on 2026-09-07,
before this decision: **998 boundaries graded, 980 exact, 16 over, 2 under, 1 untold, 451 placings
and none elsewhere.** A boundary counting **over** is a turn this reading opened where the game
numbered none.

The shape behind all 16 was one suppression failing open. A `prepare` stated beside its own
combatant's action rides that action's turn; where it stands alone, the turn went on it. Which
events count as that combatant's action was decided by `composeTurnStanding`, and it answered a
blow, an announcement and a declaration — everything else fell through to a standing of nobody.

Damage a blow reports **by name** fell through. The protocol splits one strike in two: a blow aimed
at the message's target carries `?dmg*`, and what landed on somebody the message names carries
`+oth_dmg`, whose cause `docs/protocol-keys.md` reads off the message actor. Both are one combatant
striking, and nothing about the split is a statement about turns. So a boss whose skill hits five
enemies by name, then states its preparation, was read as having acted, stopped acting, and then
spent a fresh turn preparing — twice over where two preparations followed.

Measured over `captures/` on 2026-09-07: of 179 preparations opening a turn while the message before
them named their own combatant, **32 stood directly after damage stated by name**. The other 141
stood after health moving on that combatant — a tick of poison or a regeneration, which is nobody's
action.

## Decision

**An event that names who struck says who acted, whichever way the protocol reports its damage.**
`composeTurnStanding` answers `damage-to-named-combatant` with its actor, exactly as it answers a
blow, and only the events that name nobody's action — health moving, a half-named figure, a message
that went unread — clear the standing.

The reading of `+oth_dmg` itself does not change, and neither does what opens a turn. What changes
is which events end one.

## Consequences

Over the corpus the count drops by **33 turns** — 32 preparations and one riding another — and the
grading, re-measured the same day, comes to **995 exact, 0 over, 3 under**, with the 451 placings
still exact and none elsewhere. Twelve recordings move from `sometimes` to `always`.

The second reading agrees with it. `short` — what the ordinal says went missing — and `lost` — the
turns the game itself announces as spent on nothing — are now exact on 15 of the 19 recordings the
question can be asked of, against 9 before; on nine of the others the game used to announce **more**
lost turns than the ordinal had room for, which was the over-count seen from the other side.

⚠️ **One boundary that read `exact` now reads `under`**, on
`2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0`: a turn opened where the game numbered none stood
against a turn the game numbered and this reading opens nothing for, and removing the first exposed
the second. That is a finding rather than a cost of this change (**V6**), and it joins the two
boundaries already short. Nothing here answers them.

A figure a player reads moves: `Tury wykonane` falls by one or two on the rows this touched, most of
them a boss's. No row is deleted — `tools/fight-figures.ts` prints the same rows on both sides of
this decision — and nothing divides by a turn, so no other figure moves at all (**ADR 0048**).

## Alternatives

**Leave it, and keep the list.** What `docs/turns-taken.md` did until now: state the direction, name
the two suppressions that can fail open, and change nothing. It stops being the honest answer once
the material says which of the two failed and how often.

**Carry the striking combatant through named damage as well**, so an announcement's extra attacks
survive it. Rejected: it reaches the suppression that makes an extra attack part of its
announcement's turn, and a bare blow arriving after named damage would then be swallowed. No
measurement asks for it, and the corpus's over-count was entirely preparations.

**Suppress every preparation whose combatant the message before it named.** The simplest rule, and
wrong: 141 of the 179 in the corpus stand behind health moving on that combatant, which is not them
acting. It would have taken the count far under the game's numbering.
