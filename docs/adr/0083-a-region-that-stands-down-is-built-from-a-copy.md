# 0083. A region that stands down is built from a copy, and the tree keeps no seam

- **Status:** Accepted
- **Date:** 2026-09-13

## Context

The panel answers a failure by degrading in place: a region that will not compose is replaced by a
marker, the reader is told once in the list of defects, and a fight goes on being drawn (**ADR
0051**, **E14**). Three states come out of that — a region undrawn, the defect line under it, and a
fight that would not read at all — and **not one of them can be reached from any protocol message**.
Nothing in `captures/` produces one, and nothing a fabricated fight can state produces one either:
they are answers to our own failures, not to the game's.

So they had never been looked at. They were shown three times during this round by editing
`src/ui/panel-element.ts` by hand, taking a picture and putting the file back — which works, and
leaves the tree one interrupted command away from a panel that refuses to draw.

The maintainer asked for a view under a name that says what it is.

## Decision

**`tools/panel-giving-way.ts` builds the bundle from a copy of the tree with one line added, and
serves or photographs it.** `deno task preview:giveway --region list` stands a preview beside the
ordinary one; `deno task panel:giveway` writes a picture per region instead.

**The copy is the whole of the decision.** `src/` carries no seam, no flag and no branch; the file a
reader installs is bit for bit the file it would have been, and that is held by a guard rather than
by this sentence — `tests/tools/panel-giving-way.test.ts` refuses a marker in anything under `src/`.

**The line is found by an anchor the gate holds.** A reader over source that stops finding its
subject is the whole risk: it would build a panel that gives nothing way, photograph it, and hand
back pictures of a healthy panel under the names of the states they were meant to show. So the three
lines it edits are held against `src/ui/panel-element.ts` on every run, and the sample that must be
refused — a panel whose guard is written another way — is written out.

**What is thrown is the marker itself, and not an error.** `composeRegion` catches anything and the
defect keeper reads nothing off what it caught, so a value is enough. A `new Error` would have been
one this tree wrote, which **E1** binds wherever it is written — the first draft of this tool wrote
one and `tests/repository/errors.test.ts` refused it, correctly.

## Consequences

**The states are reachable by a command, and the product is untouched.** `deno task build` reads the
repository as it always did; only this tool hands `composeUserscriptFiles` another tree, which is
the one parameter that changed anywhere outside `tools/`.

**Every check that stands over a build still stands over this one.** The copy is bundled by the same
function, so the outbound-call refusal `SECURITY.md` asks for and the version stamping run over the
giving-way bundle as well.

⚠️ **A picture of a region that stands down is a picture of a defect, and it is written under
`dist/`.** `screenshots/` is the set a README points at and `DESIGN.md` owns what may join it;
nothing here writes there, because a reader meeting one of these in a README would read a broken
panel as the panel.

Hard: the tool copies four directories and a configuration file per run, and a build is a build. It
is a debugging command and is priced as one.

## Alternatives

**A module the bundle carries, swapped at build time.** What **S8** names, and the first design:
`src/ui/` would hold a function answering `false` and the preview would swap it for one that reads a
list. Rejected — it puts a seam for a tool into the file a player runs, and **S8**'s clause names
instrumentation, which this tree does not have. A rule widened for a debugging command is a rule
widened.

**A second configuration file mapping one import elsewhere.** `deno bundle` takes `--config`, so a
second one could swap the module without a copy. Rejected: it would restate `deno.json`'s compiler
options, and two configurations drift where one of them is only ever read by a tool nobody runs
daily.

**Patching the page instead of the bundle.** The panel is handed `environment.document` and makes
every element through it, so a preview page could patch `createElement` to throw. Rejected as
untargetable: every region is composed of the same tags, so the only handle is the ordinal of a
call, which changes with any edit to the panel.

**Leaving it at a hand edit.** What this round did three times. Rejected on the maintainer's ask,
and on the one real hazard of it: an interrupted run leaves `src/` holding a panel that will not
draw, and the gate is the only thing that would say so.
