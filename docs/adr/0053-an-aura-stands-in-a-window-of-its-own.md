# 0053. An aura stands in a window of its own, and states what has passed

- **Status:** Accepted
- **Date:** 2026-09-04

## Context

**ADR 0050** read the payload's own status mask and drew it on the hover card. The maintainer
refused both halves: not that presentation, and not that subject. What he asked for was the things
that sit on **several people at once** — "2 piętna bestii są aktywne, no to patrz, ile trwają
jeszcze, kiedy są puszczone" — standing **beside** the panel rather than behind a pointer.

That is a different source, and everything about it is stated where the mask stated nothing.

- **Which skill.** The announcement carries `skillId` and `tspell`.
- **Who cast it.** The actor slot, which **ADR 0010** already fixes as the caster. Measured over
  `captures/` on 2026-09-03: **894 of 894** team-wide declarations name an actor, and **590 of 590**
  of the messages carrying them resolve that actor against the recording's own roster.
- **How long it runs.** The published skill table states `key=value@turns`.
- **How much has passed.** Counted in the caster's own turns, from the turn the cast stood on.

The objection **ADR 0050** raised against a countdown does not survive the move. It said the
duration is per skill level and no payload states a level for anybody but the reader — true in
general, and **false for every skill that reaches a side**: of the 90 effect entries stating a
duration, 88 state the same one at all ten levels, and the two that vary reach one combatant.

The other objection was **ADR 0052**, which refused to name who set a status. That refusal stands
and does not reach here: a bit turning on is announced by nothing, while an aura **is** an
announcement.

`Piętno bestii` is skill 264, `taken_dmg_per-all`, eight turns at every level. It is cast 20 times
over the corpus by 10 casters, and two of them run at once in
`captures/2026-08-26-luvia-grupa-vs-draugr-53XkBRxF-0.8.1.json`.

## Decision

**An aura is read from the announcement that cast it**, joined to the published table **by `skillId`
and never by the effect key.** The wire and the table spell the same effect differently —
`+spell-taken_dmg-all` against `taken_dmg_per-all`, `aura-adddmg2_per-meele` against
`aura-adddmg2_per-meele_physical` — so a key-name join silently loses the very skill this was asked
for. `src/core/aura-standing.ts` owns which keys reach more than one combatant.

**The remainder is stated as elapsed of total — `3 z 8 tur` — and never as a countdown.** The
protocol announces the cast and never mentions it again: no confirmation, no refresh, no expiry
anywhere in the corpus. Both halves drawn are honest on their own, one counted here and one
published by the game, and the subtraction is the reader's because the join between them is
witnessed by nothing. The register says that in those words.

**The strip is a window of its own**, dragged and remembered apart from the panel
(`MargoMeter-auras-place`), and **it appears and disappears by itself** — drawn while something is
running, gone when the last cast runs out, so it leaves the screen after a fight with no control to
press.

**It is built the way the panel is and not the way the card is.** A bar of `surfaceRaised` carrying
the top two corners and its own `data-auras-grip`, a body of `surface` carrying the bottom two, one
border around each, and **no shadow** — `DESIGN.md` gives the single shadow to the card alone,
because that is the one thing here that floats over something of ours. The bar is the window's own
child beside the body rather than inside it, exactly as the panel's is, so a redraw never takes the
handle out from under a hand dragging by it.

**It opens beside the panel, level with it.** Not centred: `composeDefaultPosition` centres what it
is given, and centring both put the strip exactly under the panel — where the panel paints over it
and a reader sees nothing at all.

**Where the two windows overlap the panel wins.** The strip is a root child like the card, and a
positioned element paints over a static one whatever the order — which left a fold button
unclickable underneath it in Chrome on 2026-09-04. The bar and the frame are positioned for that
reason and for no other.

**Casts of one skill by two people are two rows under one heading**, because that is the question:
not "is it up" but "how many, and how far through is each".

**A skill stating several team-wide effects is drawn under the longest of them**, so a skill is not
called over while part of it is still running. `docs/auras-standing.md` names the one skill where
that hides a split.

## Consequences

Easy: the thing the maintainer actually asked for, with no guess in it. Who cast it is the game's
own word, how long it runs is the game's own published figure, and how much has passed is counted.

Hard: **nothing in the material can check the countdown.** The two skills whose effect the status
mask can see run 22 and 52 turns against a stated 8, because a bit is a side's whole exposure and
not one cast — anybody's cast sets it and two casters keep it set. So the stated half rests on the
published table alone. Drawing it as elapsed-of-total rather than as a remainder is what keeps that
honest, and the register states the limit rather than leaving it to be discovered.

Also: eight casts in the corpus arrive under `tcustom` with no `skillId` — bard songs — and can
never be dated. They reach no row. Five more skills the table dates are cast in no recording at all,
which is the thin-corpus gap `TODO.md` already complains about.

Also: **two of the three faults in this were only visible in a picture.** A fold button unclickable
under the strip, and a strip drawn exactly under the panel — every unit test passed through both,
and `tests/e2e/` plus a screenshot are what found them. The first is now held by
`tests/e2e/panel-reload.spec.ts`, the second by `tests/ui/panel-drag.test.ts`.

Also: the bundle carries a table of thirteen numbers rather than every effect of 226 skills, which
would have been 53 kB against a built file of 321 kB. `frozen/aura-turns.ts` is derived at freeze
time by `src/core/aura-standing.ts`'s own rule, so the judgement is written once.

## Alternatives

**A countdown.** `5 tur` rather than `3 z 8`. Rejected: it reads as measured and is not, and nothing
witnesses the end. The elapsed-of-total form states two figures this repository can stand behind and
lets the reader subtract.

**Drawing it on the card, as ADR 0050 did.** Rejected by the maintainer in the words this record
opens with. A card answers one combatant and hides behind a pointer; the question here is what is up
across the fight, and it has to be readable without one.

**A second host in the page.** Rejected: `SECURITY.md`'s guest rule puts everything a reader meets
inside one shadow root under one name, and a second host would need its own copy of the sheet.

**Importing the frozen table into `core/`.** Rejected: `core` reads nothing but itself, `libs` and
the standard library (`ARCHITECTURE.md`). Whoever holds the reading hands it over, which is the
shape `heals` and the status episodes already use.

**Nailing the strip to the panel's right edge.** Rejected: it would be the first thing here that
does not answer the screen it stands on, and a panel dragged to the right edge would push it off.
Two windows, two corners, and the reader decides.
