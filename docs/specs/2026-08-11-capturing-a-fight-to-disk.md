# Getting a fight out of the game and into the repository

Status: implemented

## Problem

This branch reads captured material and cannot produce any. The two files in
`tests/captured-fights/` were made by a pipeline that did not survive the
rewrite; on this tree the payload passes through `src/game/battle-session.ts`,
three fields are read out of it (`init`, `w`, `myteam`), and the object is
dropped. Nothing buffers a call, nothing snapshots a combatant, nothing
serialises.

That gap is not only in the code. `AGENTS.md` §9.2 states that nicknames are
substituted and ability descriptions stripped "**by tooling, not by hand**", and
`NOTICE.md` repeats the claim — both pointing at tooling this branch does not
have. Every question the register leaves open needs material the add-on cannot
currently collect, so the shortest route to more material was the one thing
missing.

## Solution

Two halves, and the boundary between them is the whole design.

**In the add-on:** `src/game/fight-capture.ts` keeps the current fight, and one
button in the panel's title bar writes it to a file. What comes out carries real
nicknames and the game's own ability descriptions. It never enters git.

**In the terminal:** `tools/captured-fight-intake.ts` performs both redactions
and writes the result into `tests/captured-fights/`. The cost is paid once, at
the moment material enters a public repository, where it is checkable — instead
of on every recording, where it would be in the way.

### Scope is one fight, and the buffer clears where the panel's does

Collecting is bounded by `isFightStart`: the recording clears on the `init` of
the next fight, exactly where `composeNextSession` clears the session. So the
recording offered is the one whose numbers the panel is showing, and "the fight
just ended, save it" needs no flag, no window and no fight numbering.

### The format is a contract

`composeCaptureText` writes precisely what `tools/fight-dump-parser.ts` reads —
Polish field names, `wersja: 1`. §9.2 puts the boundary of those names at the
reader that parses them; the writer is the same boundary from the other side.
Anything else would produce material that could not be set beside what is
already captured.

Three fields the previous incarnation wrote are gone, each on its own grounds:

- **`render` is not collected at all.** `NOTICE.md` names the 38 client-composed
  sentences in the older capture as an exception surviving only because cutting
  them would mean editing evidence. Material that never carried them needs no
  exception.
- **`otwarcie` is gone**, and with it the only reach into the page's DOM that
  `src/` ever had. Nothing reads it, and both captures on disk hold null.
- **No `walka`**, because one recording is one fight.

`build` is read from a script's filename — `main.min<build>.js`, the same place
`tools/game-client-source.ts` reads it — and is **null** when the page does not
say. The parser then refuses the file by name, which is the right outcome: §7.6
makes a client version part of what makes material comparable, and a recording
quietly claiming a build would be worse than one admitting it has none.

### Thinned as it is collected

Every call carrying messages is kept without exception; so is every call
introducing a payload shape or a combatant state not seen before. On the first
real recording the previous incarnation made, that dropped 565 of 569 calls — the
game polls `updateData` long after a fight is over — without losing anything a
kept call does not carry. The count goes into the file as `pominietych`.

At the ceiling collecting **stops** rather than dropping the oldest. The order is
the decision: a recording without the start of a fight is useless, one without
the end still carries material.

### The wrap gains a hook, and a second guard

A snapshot taken *before* the call is the only thing that cannot be reconstructed
afterwards, so `setBattleWrap` now calls `onBeforeOriginal` ahead of the original.

It has **its own `try`**, not shared with the reading. A single guard around both
would let a throw in the collector skip `onMessages` — a developer's tool for
gathering material stopping the meter from counting, which is the one failure
mode such a tool must not have. The same argument is repeated one layer up, where
the entry point guards the collector separately from the session.

### The button

Built with the shadow root rather than with the render, for the reason the title
bar itself is: a redraw replaces the container's children wholesale and a fight
redraws every few seconds. Listened for at the root, keyed on node identity —
the shape the tab strip and the drag already use — inside its own `try`, because
a handler that throws must not reach a page the game is also listening on.

It costs the drag nothing: `pointerdown` already requires the title bar itself as
its target, and the bar's label stays a bare text node, which is not an event
target. It is drawn only when something is listening for it, so it is never a
control that does nothing.

### What the intake tool refuses

Refusal is the substance of it. Both ways of being wrong are permanent, because
this repository does not rewrite its history.

- **A combatant it cannot place.** `npc` decides who is a player and nothing else
  does; it rides only in `ladunek.w`. The tempting shortcut — a negative id is a
  monster — is an unmeasured claim about the game.
- **Two players under one name.** `w` separates them by id, a message carries
  only the text.
- **A `ladunek.skills` array that is not a whole number of groups of ten.** The
  grouping is a claim about the game measured on one build, and cutting field 5
  out of a layout nobody has seen removes the wrong thing, on evidence.

Neither redaction is complete, and no test can make them so: each knows one
place. A nickname belonging to nobody in the roster walks through untouched. The
tool ends by saying so and naming the reading that stays a person's.

## Rejected alternatives

**A console probe, as the previous incarnation kept alongside its collector.** It
wraps `updateData` a second time, and the four promises `src/game/engine-battle-wrap.ts`
makes are all about there being exactly one layer — two, attached and detached
independently, destroy the third of them outright. The collector wraps nothing:
it is handed what already passes through.

**The clipboard instead of a file.** A recording is hundreds of kilobytes and
`navigator.clipboard` refuses often enough without a gesture that it cannot be
the only way out.

**A buffer surviving several fights, behind a developer flag.** This was the
previous incarnation's answer, and its argument was real: the key you are hunting
falls in a fight you did not plan. It was dropped because the panel already
answers "was this fight worth keeping" while the fight is still in the buffer,
and because the flag has to be turned on *before* it is needed — so it is off
precisely when it was wanted. What it costs is a fight noticed one fight too
late; what it buys is no flag, no settings window, no fight numbering and no
`--fight <n>`.

**Redacting in the browser.** It would mean no unredacted file ever existing,
which sounds strictly safer. Rejected because the redaction is the part most
likely to be wrong, and it is the part that must be re-runnable and testable
against material that is already here — `tests/tools/captured-fight-intake.test.ts`
holds it to being a fixed point on both captures. A redaction that only ever ran
once, in a browser, against a recording nobody kept, cannot be checked at all.

**Doing nothing when there is no fight to save.** Rejected as the silence §9.6
spends its length on. A recording stating `wpisy: []` is true, and it says the
add-on is attached and reading nothing — which is precisely the report someone
would otherwise have to guess at.

**Reading the build from a `build.version` global.** §7.6 records that the id
appears both there and in the script filename. The filename was chosen because it
is the one this repository already depends on — `tools/game-client-source.ts`
composes the bundle URL from it — so a number in a recording and a number in
`.cache/` mean the same thing by construction.

**Snapshotting combatants with `structuredClone`.** A combatant carries
references to DOM nodes and to the engine, so cloning one whole either throws or
drags half the game into the recording. Only the nine fields the existing
captures carry leave the game, with `hp` and `ac` copied one level deep because
they are live objects the game keeps mutating.

## Verification

`bun run check` green. Mutations checked, each lighting the intended test and
nothing else:

| what was broken | what lit up |
|---|---|
| the two guards in the wrap merged into one | a throwing before-hook stops neither the game nor the reading |
| the before-hook moved after the original | the before-hook runs ahead of the original |
| the payload held by reference | the payload is copied, not held by reference |
| `hp` held by reference | snapshots hold copies of the health the game keeps mutating |
| thinning without the protection for messages | every call carrying messages, however familiar it looks |
| the writer forgetting the before-snapshot | the round trip through the parser, on both captures |
| the writer renaming a field the parser reads | the same |
| the capture button's handler without its `try` | a handler that throws does not escape into the page |
| the button drawn with nobody listening | no button is drawn when nobody is listening for it |
| the title bar's text set after the button is appended | five button tests at once — see below |
| an id with no `npc` verdict guessed at | a combatant nobody can place stops the write |
| one name per id instead of a set | a name seen only in an earlier snapshot is still substituted |
| an unfamiliar `skills` layout accepted | an unfamiliar layout stops the write |
| ids sorted lexicographically | labels are numbered by id, as a number |

**One mutation lit nothing, and that was the finding.** Building the button and
*then* setting the title bar's text drops the button on the floor in a browser,
and the fake document reported a working panel — it held `textContent` as a plain
string. The fake now clears its children on assignment, the way a real DOM does,
which is the third DOM behaviour in `tests/ui/panel-element.test.ts` modelled because a
mutation walked past it. Only then did the ordering become checkable.

**The loop this round exists to close** is in `tests/game/engine-attachment.test.ts`:
a captured fight replayed through the entry point the userscript runs, the
recording composed from it, and that text read back by the offline parser and
decoded. Writer and reader are each checked alone elsewhere, and neither check
would notice the two drifting apart.

**Not checked by any test, and checked by hand instead:** `click()` on an anchor
does nothing in a fake document, so whether a file actually arrives needs a
browser, a real fight and a person.

## What stays open

- **The hand step is real.** A nickname tied to no combatant id — someone who
  left before the first snapshot, a name inside a loot message — passes through
  the substitution untouched. Measured on the previous incarnation, where a name
  planted only in `render` lit no guard at all.
- **Two rules for one question.** `tests/tools/captured-fight-catalog.test.ts`
  decides "this is a monster" by `id < 0`; the intake tool decides by `npc`,
  because `id < 0` is a claim about the game nobody measured. They agree on the
  material that is here. Reconciling them is `[ASK]` under §4 and is not part of
  this round.
- **The recording carries no `npc` in its snapshots**, exactly as the existing
  captures do not. It is not lost — it rides in `ladunek.w` — but it does mean
  the intake tool depends on the payload being recorded whole, and would refuse
  material collected any other way.
