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
  the published help — and it is the **first** read that gave this content (ADR 0011). A count with
  no provenance is a number nobody can re-earn.
- **The tool that writes a reading is the only thing that writes it**, and it writes here rather
  than into `tests/`: a guard reads this directory, and so does a tool.

## How a reading is refreshed

`deno task margonem:readings refresh` fetches the client bundle, the published help and the
published skill table, then freezes each reading from what it has just fetched — in that order,
because every reading is dated by the fetch above it. A file whose content did not move stays as it
stands, date and all, so `git diff frozen/` after a refresh shows only what the game changed (ADR
0011). `deno task margonem:readings status` asks the same question and changes nothing: it exits `0`
where every reading is the game's, `1` where one went behind, and `2` where the world could not be
asked at all. `deno task margonem:readings preview` reads the development channel's client against
what is frozen and names the keys and the bits it adds, drops or moves; it exits `1` where there are
any, and writes nothing here. A refresh and a status take no list of what to count: a freeze counts
every phrase a `_Help:_` line of `docs/protocol-keys.md` cites, and
`deno task margonem:help freeze <phrase> …` adds one before a claim leans on it (ADR 0007).
**AGENTS.md W10** says when the routine is run.

## Why they exist

What `docs/protocol-keys.md` claims of the help, and the words the panel gives the kinds of damage
and the defences, are checked against these counts on every run of the gate
(`tests/repository/protocol-keys.test.ts`, `tests/ui/panel-words.test.ts`): a word the help prints
nowhere is an invention. A negative recorded from a search nobody re-runs is how four keys once came
to be filed as undocumented while the help described all four (`docs/protocol-keys.md`).

The durations are here for the same reason and one more: they are the **only** source that says how
long an effect runs for, so a figure the panel draws beside a counted one rests on them alone
(**develop ADR 0058**). The bundle carries neither the durations nor the prose beside them, but the
two small tables derived from them: `frozen/aura-turns.ts`, which is what reaches more than one
combatant, and `frozen/blows-granted.ts`, which is how many blows an announcement **that names an
id** reaches (**develop ADR 0078**). Both are written by the same freeze off the same fetch, so all
three date together.
