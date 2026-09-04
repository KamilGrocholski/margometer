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
each reading is dated by the fetch above it. `deno task game:readings status` asks the same question
and changes nothing: it exits `0` where every reading is the game's, `1` where one went behind, and
`2` where the world could not be asked at all. Neither takes a list of what to count: the phrases
come from the claims `docs/protocol-keys.md` makes, which is what a count is for. **AGENTS.md W10**
says when the routine is run.

## Why they exist

A verdict in `docs/protocol-keys.md` that the help does or does not document a key is checked
against these counts on every run of the gate. The skill table is read the same way: it is the only
source that states how many turns an effect runs for, and what the recordings show is graded against
it rather than against a memory of it. A negative recorded from a search nobody re-runs is how four
keys once came to be filed as undocumented while the help described all four.
