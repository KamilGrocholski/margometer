# 0045. A recording of a fight already here is refused at the door

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

Ten recordings were offered as material on 2026-09-01. Five were already in `captures/`. Three
carried no call at all — an empty `wpisy`, written by add-on `0.10.1` twice on 2026-08-28 and once
on 2026-08-26. Two were replays of admitted recordings, played back through this repository's own
preview (`raport.place.mapName: "Preview"`, add-on `0.0.0-dev`) and downloaded again from it.

**`tools/capture-intake.ts` would have taken all five of the last two groups.** It refuses on a
taken path and on nothing else, and a path is `day-world-slug-build-addon`. A replay states the day
of the replay and the world it was replayed in, so the path is free. The two here would have landed
as `localhost` / build `1785244275300` beside material that is `tempest` / `1786514810315`, and as
`unknown` / build `none` beside material that is `tempest` / `1785244275300`.

The copies are worse than the originals, which is what makes this a hazard rather than clutter. A
replay carries the game's payloads and messages through unchanged and rebuilds the snapshots itself:
measured on `margometer-localhost-2026-08-30T20-57-52-542Z.json` against
`captures/2026-08-15-tempest-grupa-vs-hildur-4-1786514810315-none.json`, 52 of 52 payloads and every
one of 479 messages are identical, while a snapshot the recording states with 11 entries the replay
states with 9, in another order. `captures/AGENTS.md` says why that matters: the protocol never
states maximum health, the snapshots do, and they are the only independent check this project has.

Two figures decide what a duplicate can be read off. Over the 28 recordings in `captures/` on
2026-09-01 there are **28 distinct payload sequences and no collision**, so the payloads identify a
fight. And every recording admitted is a fixed point of the redaction
(`tests/tools/capture-intake.test.ts`), so the redacted form of an offered recording is comparable,
value for value, with a file already here — which the raw form is not, because redaction rewrites
`payload.w[].name` and `payload.skills`.

## Decision

**Intake refuses a recording carrying no call, and a recording whose payloads are those of a fight
already in `captures/`.** The second compares the **redacted** form, over the **payload sequence**
alone, and names the file it duplicates. The envelope is not consulted: what a replay states about
day, world and build is true of the replay and false of the material.

Both refusals stand at the door — `writeIntake` — and not inside `composeIntake`, because every
admitted recording is a duplicate of itself and the fixed-point test runs the redaction over all of
them.

## Consequences

- **A re-download of a fight already here now says so**, by name, instead of being filed a second
  time under whatever the envelope claimed. Four of the ten were run through the changed tool and
  each refused with the file it duplicates named; `captures/` held 28 files before and after.
- **A partial recording of an admitted fight is still admitted.** Its payload sequence differs, so
  this says nothing about it. That is the honest limit of a comparison over sequences, and naming it
  here is cheaper than a guard that pretends otherwise.
- **Intake now reads every admitted recording** to answer, roughly twenty megabytes on a tool a
  person runs by hand. Nothing else pays it.
- **`tools/recorded-fights.ts` gains a second caller**, which its docblock already anticipated: it
  opens a recording at any path, and deciding whether an intake is worth starting is what it named
  as the reason.
- **The empty case is a finding left open.** Add-on `0.10.1` wrote a recording of nothing three
  times in three days. The door now refuses those, but why they were written is about the capture
  path and is not answered here.

## Alternatives

**Compare the whole call, snapshots included.** Rejected on the measurement: the replays are exactly
the case where the snapshots differ, so this is the comparison that misses the recordings that
motivated the rule.

**Compare the raw recording, before redaction.** Rejected: everything in `captures/` is redacted, so
a fresh download carrying real nicknames would match nothing. Only one of the two replays would have
been caught — the one already carrying `Gracz 1`, having been replayed out of a redacted file.

**Trust the envelope — refuse a world the register does not know, or a build that disagrees.**
Rejected: it decides the wrong question. `localhost` and `unknown` are what the preview writes, and
a real fight on a new world would be refused while a replay stamped `tempest` would walk through.

**A file of fingerprints kept beside the recordings.** Rejected: it is a computed number, which
`captures/AGENTS.md` keeps out of that directory, and it would go stale the moment a recording was
admitted by any route that did not update it. Reading the material is slower and cannot drift.

**A repository test over `captures/` instead of a refusal at intake.** Rejected on when it fires: a
duplicate would already be committed, and evidence is not deleted once it is here. The door is the
only place where refusing costs nothing.
