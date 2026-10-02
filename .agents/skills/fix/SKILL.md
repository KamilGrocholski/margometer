---
name: fix
description: Fix MargoMeter from a fight file the add-on saved — replay it, reproduce what the player saw (a warning, a defect, an unread message, a wrong figure), hold it with a test, fix it, gate it. Use when the user hands over a fight file with a complaint, or says "fix", "napraw", "błąd", "ostrzeżenie", "warning", "defekt".
argument-hint: <fight.json> [what went wrong]
---

# Fixing MargoMeter from a saved fight

The file handed over is: `$ARGUMENTS`. Where no path came with it, ask for one before anything else.

**This skill owns no rule.** The file's format is `docs/design.md` §11 and
`src/runtime/fight-file.ts`; the fate of every failure is `docs/design.md` §10.5. What the file
**does not carry** decides the whole procedure: its `report` holds the counts the add-on had when it
saved — unread messages by cause, messages lost, casts unplaced, figures by nobody — and nothing of
the defects, the console lines or the unread keys themselves. Those come back only by replaying the
file. Where the player's complaint is not in the request, ask what they saw — the panel's text, the
console line, a screenshot — because the file will not say.

## Before anything

1. **The readings are current** (**W10**): `deno task margonem:readings status`, the `readings`
   skill. The file's `gameBuild` against the frozen build says whether the game moved since.
2. **Read the envelope**, with `jq` or `deno eval` over the file — never with a bare `jsr:` import,
   which writes to `deno.lock`: `formatVersion`, `addOnVersion`, `gameBuild`, `droppedCalls`,
   `isTruncated`, whether any call carries `combatantsBefore`, and every count in `report`.
3. **No nickname leaves the file** (_Never_): not into the conversation, a test, a document or a
   commit body. Speak of a combatant by its id or its side.

## The process

1. **The version.** Where `addOnVersion` is behind `develop`, read `CHANGELOG.md` and
   `git log v<addOnVersion>..develop` for the symptom. A reader behind `develop` is not the game
   moving, and a fix already made is the answer, named by its commit.
2. **Replay on `develop`**: `deno task fight:decoding <path>` and `deno task fight:figures <path>`.
   Set their counts beside the file's `report`:

   | On `develop`         | Means                                          |
   | -------------------- | ---------------------------------------------- |
   | lower than `report`  | fixed since that release: name the commit      |
   | equal to `report`    | reproduced: carry on                           |
   | higher than `report` | a regression since that release: a finding     |
   | the file refused     | `tools/recorded-material.ts` names the refusal |

3. **Reproduce in the browser**: `deno task preview --from <path>`, and the `verify` skill for
   reading the panel. The branded console line and the defect the panel states appear only here. A
   symptom that neither the replay nor the page shows is reported as not reproduced, with what was
   tried; ask for more rather than fix a guess.
4. **Place it.** Where the symptom leads:

   | Symptom                                        | Where to look                                                                         |
   | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
   | an unread key (`unknown-key`)                  | `src/core/protocol-key.ts`, `docs/protocol-keys.md`, as the `intake` skill's step 4   |
   | grammar refused, no parameter                  | `src/core/fight-decoder.ts`                                                           |
   | messages lost, calls dropped, a truncated file | `src/ports/fight-capture.ts`                                                          |
   | casts unplaced, figures by nobody, neither end | `src/core/fight-statistics.ts`                                                        |
   | a defect the panel states                      | its kind in `src/runtime/defect-ledger.ts`, its fate in `src/runtime/failure-fate.ts` |
   | the panel's parts disagree with its whole      | `src/runtime/panel-frame.ts`, `src/ui/panel-content.ts`                               |
   | a figure wrong with no mark at all             | `fight:turns`, `fight:auras`, `panel:drill` over the file, against their documents    |

5. **Hold it before fixing it** — a test that is red on `develop` (**W3**):
   - **A file with snapshots**: ask whether it goes into `captures/` (_Ask first_). On a yes, the
     `intake` skill carries it, and the recording is what the test reads.
   - **A file from the shelf** (every snapshot `null`), or a no: the smallest test in the layer the
     symptom was placed in — the few messages rewritten into `tests/core/`, or the add-on stood up
     over `tests/runtime-world.ts` for a defect. Ids and numbers may be kept; names may not.
6. **The fix**, then the `gate` skill (**W1**), `deno task e2e` for a change under `src/` (**W9**),
   and the `mutate` skill over the new test.
7. **Back to the file.** `fight:decoding <path>` and `preview --from <path>` again: the symptom is
   gone. `deno task fight:develop` says nothing else moved over the corpus (**W8**).
8. **Report**, and the `commit` skill after asking (**G1**): the symptom, the counts before and
   after, where it was placed, the test and what its mutation lit.

## The checklist

- [ ] The symptom reproduced before any fix, or reported as not reproduced.
- [ ] The file's `report` beside `develop`'s replay, both in the summary.
- [ ] A test red before the fix and green after, proved by a mutation.
- [ ] No nickname anywhere in the diff or the commit body.
- [ ] `captures/` touched only through `deno task capture:intake`, and only after a yes.

## Gotchas paid for

- **The `report` is the old version's.** Its counts are what the release that wrote it read, not
  what `develop` reads; comparing it with a replay is the point, not a check to skip.
- **`fight:develop` takes no path.** It compares `develop` @ `fa1dcce` with this tree over
  `captures/` alone; a file outside the tree is replayed by the `fight:*` tools that take one.
- **A shelf file replays but never goes in.** Intake refuses it (`develop ADR 0053`): the snapshots
  are the one check of the decoder that is not the decoder.
- **`preview --from` refuses a name `captures/` already carries.** A file that went through intake
  is opened as `?fight=<name>` on a plain `deno task preview`, without `--from`.
- **The file does not name the defect.** A defect is state in the page that wrote it; the preview is
  the only place it comes back.
