# 0053. The file is the fight on screen

- **Status:** Accepted
- **Date:** 2026-09-06

## Context

A reader handed in `margometer-luvia-ne0iTNdg-0.14.0-2026-09-05T20-48-11-477Z.json`: 310 bytes,
`calls: []`, `droppedCalls: 0`, `report: null`. The panel in front of them was drawing a fight —
rows, figures, an outcome — and the file carried none of it.

Nothing failed. `getStandingFight` draws the newest kept fight where there is no live one (**ADR
0033**), and the save composed its file from `live.capture`, which after a page reload holds
nothing. The two answers to _which fight_ had drifted apart, and only one of them was on screen.

**This is the fourth such file.** Three arrived on 2026-08-26 and 2026-08-28 off `0.10.1`, which is
why `requireCallsCarried` exists (**ADR 0045**). That refusal is at the far end: it fires when the
maintainer runs an intake, days later, and tells the reader nothing.

What a shelf keeps is payloads (`src/game/kept-fights.ts`), and everything the panel draws from a
kept fight it derives by replaying them through the live chain — `composeKeptFigures` calls
`addPayloadToFight` and `composeFightFigures`, the same two the live fight goes through (**ADR
0026**). So the figures and the per-payload messages of a kept fight are **already** recoverable,
and were being thrown away at the one moment somebody asked for them.

What is not recoverable is the before-and-after snapshots: they are read off the engine's warrior
list while a fight is on, and there is no engine to ask afterwards.

Measured over the 28 recordings in `captures/` on 2026-09-06: **snapshots are 4.29 MB against 3.03
MB of payloads and 0.82 MB of messages — 52.7% of the material**, and the heaviest single fight
carries 436 KB of them. With `MAXIMUM_KEPT` at 20, keeping snapshots on the shelf is megabytes past
what a browser lends one origin.

## Decision

**The file is the fight the panel is standing on.** A save press hands over what `getStandingFight`
answers — the live fight, or the kept one the reader walked into — so the figures in the file are
the figures on the screen the press was made from.

**A fight off the shelf is rebuilt from its payloads**, through the chain that draws it. Its calls
carry the payload and the messages the decoder takes back out of it.

**What nobody measured is `null`, never a stand-in.** `combatantsBefore`, `combatantsAfter`,
`droppedCalls` and `isTruncated` are absent on such a file rather than empty or zero: zero dropped
calls is a measurement, and `[]` is a client that answered with no combatants (**E10**). The
envelope goes to `formatVersion` 4 to say a file may state them that way.

**The intake refuses a recording whose calls carry no snapshot.** `captures/AGENTS.md` says why and
it is not caution: the protocol never states maximum health, the snapshots do, and they are the only
check the decoder has that is not the decoder. Such a file is a **report** — what a reader hands
over when a number looks wrong (**ADR 0027**) — and it is not evidence.

**The save control is drawn only where there is a fight to hand over**, which is a live recording
with a call in it or a shelf with a fight on it. `DESIGN.md` already binds this: a control that does
nothing is worse than one that is not there.

## Consequences

- **A reader can hand over a fight that ended.** Until now the only fight anybody could put in a
  file was the one going on, which is not the one they are looking at between fights.
- **`captures/` gains no material from this path, and that is intended.** A shelf-sourced file is
  refused with a message naming the health witness rather than admitted as weaker evidence.
- **Two envelope shapes are in the world.** A reader on an older build still writes `formatVersion`
  3 with `[]` and `0`, and `tools/capture-intake.ts` goes on taking 1, 2 and 3.
- **The panel between fights has one control fewer**, and a panel that has read nothing has no save
  at all. Somebody who presses where the control used to be finds nothing there, which is the point.
- **The moment a file states is the fight's, not the press's.** A fight fought three days ago is
  filed under the day it was fought, which is what `composeIntakePath` names it by.
- **The world and the browser are still read off the page for a kept fight.** That is not a guess: a
  shelf is read out of one origin's store and a world is its own host, so a fight kept there was
  fought there.

## Alternatives

**Keep the snapshots on the shelf, so a kept fight is a whole recording.** Rejected by the
measurement above: 52.7% of the material, 436 KB for one fight, and the shelf already lives inside a
quota it has three answers for — refused, made room, every slot pinned. Tripling what a fight costs
to keep would spend the reader's shelf on evidence they cannot file anyway.

**Refuse the press and say why.** Built first, then dropped. It answers the maintainer's problem —
no more empty files — and not the reader's, who wanted the fight in front of them in a file. Worse,
in the case that produced the report the panel is drawing a fight while the sentence says there is
nothing to save, which reads as wrong however true it is. It also left a control that does nothing,
against `DESIGN.md`'s own rule.

**Hand over the empty envelope and let the intake refuse it, as now.** Rejected: it is the behaviour
that produced four useless files in eleven days, and the reader learns nothing at the moment they
could still do something about it.

**Write `[]` and `0` for what the shelf did not keep, and change no envelope.** Rejected. It is the
cheapest change here and it puts a measurement nobody took into evidence — `droppedCalls: 0` on a
file that never counted, and a snapshot list indistinguishable from a client that answered with no
combatants. **E10** exists for exactly this.
