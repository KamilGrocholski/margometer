# Frozen readings

Dated readings of the game, written by tooling and read by the guards that hold a claim to them.

Neither test material nor a recording: a recording in `captures/` is taken once and never taken
again, while a reading here is **replaced** whenever the game changes. What both have in common is
that they are evidence, and that no hand edits them.

## Never

- **Edit a file here by hand**, including its header. Regenerating is how a reading changes.
- **Trim a reading to make a claim pass.** The claim is wrong, or the reading is stale and the tool
  says so.

## Always

- **A reading carries what it was read on** — the build id for the client's key list, the date for
  the published help. A count with no provenance is a number nobody can re-earn.
- **The tool that writes a reading is the only thing that writes it**, and it writes here rather
  than into `tests/`: a guard reads this directory, and so does a tool.

## How a reading is refreshed

`deno task game:readings refresh` fetches the client bundle, the published help and the published
skill table, then writes each frozen file from what it has just fetched — in that order, because
every reading is dated by the fetch above it. `deno task game:readings status` asks the same
question and changes nothing: it exits `0` where every reading is the game's, `1` where one went
behind, and `2` where the world could not be asked at all. Neither takes a list of what to count: a
freeze counts again every phrase the table already holds, and
`deno task game:help freeze
<phrase> …` adds one before anything leans on it. **AGENTS.md W10** says
when the routine is run.

## Why they exist

The words the panel gives the kinds of damage and the defences are checked against these counts on
every run of the gate (`tests/ui/panel-words.test.ts`): a word the help prints nowhere is an
invention. A negative recorded from a search nobody re-runs is how four keys once came to be filed
as undocumented while the help described all four (`develop:docs/protocol-keys.md`).

The durations are here for the same reason and one more: they are the **only** source that says how
long an effect runs for, so a figure the panel draws beside a counted one rests on them alone
(**develop ADR 0058**). The bundle carries neither the durations nor the prose beside them, but the
two small tables derived from them: `frozen/aura-turns.ts`, which is what reaches more than one
combatant, and `frozen/blows-granted.ts`, which is how many blows an announcement **that names an
id** reaches (**develop ADR 0078**). Both are written by the same freeze off the same fetch, so all
three date together.
