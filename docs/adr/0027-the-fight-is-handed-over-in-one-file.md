# 0027. The fight is handed over in one file

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

The title bar carried two controls that hand a fight over. `⧉` wrote the counted figures to the
clipboard — a few kilobytes of English keys, meant to be pasted into a message. `{ }` wrote the
recording to a file — the calls the game made, in the game's own Polish, running to hundreds of
kilobytes and meant to be attached to one. Both were worded for a bug report, both opened with
`Do zgłoszeń:`, and the second was drawn at `opacity:0.55`, which reads as an affordance for
somebody who wrote the code.

The panel is not only a developer's any more. Two controls that both mean _hand this fight over_ ask
a reader to know which artefact the person on the other end wants, and the reader has no way to
know. Nothing else on the bar asks a question like that.

The two artefacts also stated the same five facts twice: the recording as `wersja`, `dodatek`,
`przy`, `swiat`, `build` and `przegladarka`, the report as `addOn`, `game`, `browser` and
`capturedAt`. A comment in `src/game/fight-report.ts` said `browser` existed so the two could not
disagree about what was known — a duplication defended rather than removed.

## Decision

**One control on the bar, and one file behind it.** The recording envelope carries a `raport` block,
above `wpisy`, holding what the figures came to; `null` there says no fight was read, which is a
statement and not a gap. What qualifies the numbers stands once, in the envelope around them. The
report's own outer envelope is gone with `composeReportText`, and `composeReportFight` is what
`src/game/fight-capture.ts` calls.

**`tools/capture-intake.ts` removes that block before admitting a recording.** `captures/AGENTS.md`
holds this repository's material to raw evidence: a computed number admitted beside the calls it was
derived from is one version's arithmetic frozen against the evidence, and a later reader could not
tell which of the two a test had failed against. The removal runs first, before the two redactions,
because it is the one step that only takes data away — the block carries nicknames of its own, and
every step after it has that much less to walk.

The envelope version moves to 2. It says which writer wrote a file, never what shape the file is in:
a recording admitted states 2 and carries no `raport`, because intake took it out.

## Consequences

The reader presses one thing, and what they hand over answers both questions somebody could ask of
it — what the game said, and what this made of it — with the figure and its material in the same
file. There is no clipboard path left in `src/`, so `navigator.clipboard`, its rejection boundary
and the branded line it wrote are gone.

The file is larger than the recording was, by the size of one report. Nothing measures that yet.

Anything reading a recording written by this version must expect a key the older ones do not carry.
Nothing in `tools/` or `tests/` branches on `wersja`, so the number buys provenance and nothing else
— which is stated here so a later reader does not take it for a shape.

## Alternatives

**Keep both controls.** Rejected: the question they ask the reader is one the reader cannot answer,
and it is asked on every fight.

**Download the report and drop the recording.** Rejected: the recording is what `captures/` is made
of, what intake admits, and what every test over that material stands on. The smaller file is the
one that cannot be replaced.

**Nest the report's own envelope inside `raport`.** Rejected: it puts the build, the world, the
client and the browser in one file twice, and two copies in one artefact drift exactly as two
artefacts did.
