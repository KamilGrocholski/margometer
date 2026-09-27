---
name: intake
description: Take a fight recording the add-on wrote into MargoMeter's captures/ and carry everything that follows it — decoding, the key register, the registers the tools print, the corpus sums. Use when the user hands over a recording, a file from a reader, or says "intake", "nagranie", "nowa walka".
---

# Taking a recording in

A recording is evidence, not test data, and `captures/` changes only through
`deno task capture:intake` (_Ask first_, _Never_). **This skill owns no rule.** The redaction and
the naming are `tools/capture-intake.ts`'s; what each recording holds is
`docs/captured-fights.md`'s.

## Before anything

1. **The readings are current** (**W10**): `deno task game:readings status`.
2. **Replay the file first**: `deno task fight:decoding <file>`. A `no snapshot` line means the file
   is a report from the shelf, not a recording, and intake will refuse it: the combatants before and
   after are the one check of the decoder that is not the decoder. An unread key is tallied by name.
3. **A file from a reader** with unread keys: find the version it was written by, and whether
   `develop` already reads that key (`git merge-base --is-ancestor <fix> <the release>`). A reader
   behind `develop` is not the game moving.

## The process

1. `deno task capture:intake <recording.json> --name <slug>`.
2. **Read what it wrote.** Names are replaced only where a combatant id carries them; the run ends
   by naming what a person has to read. No nickname enters the tree (_Never_).
3. **The register.** Its entry in `docs/captured-fights.md`.
4. **The decoder**, where a key went unread: its meaning in `src/core/protocol-key.ts`, its entry in
   `docs/protocol-keys.md`, then `deno task game:shape` for the `_Shape:_` lines and
   `deno task game:help freeze` where the entry cites the help.
5. **The registers the tools print**, each against its document: `fight:turns` →
   `docs/turns-taken.md`, `fight:openers` → `docs/reading-a-turn.md`, `fight:auras` →
   `docs/auras-standing.md`, `panel:drill` → `docs/drill-levels.md`.
6. **The suite**, `deno test -A`: a corpus sum that moved because the material grew is re-pinned,
   and the body says which and by how much. A figure that moved on a recording already there is a
   finding, never a re-pin (**W8**).
7. **The gate** (**W1**), and the `commit` skill: the recording and what it drags along in one
   commit, after a person has read it.

## The checklist

- [ ] `fight:decoding` read before intake, and its tally in the body.
- [ ] No player nickname anywhere in the diff. `tests/repository/redacted-names.test.ts` holds the
      names the messages carry to the roster; the rest is a person's reading.
- [ ] The register entry, and every document a tool prints, rewritten from the tool's output.
- [ ] Every re-pinned sum named in the body with its old and new value.
- [ ] Nothing under `captures/` touched by hand.

## Gotchas paid for

- **`game:shape` only reports.** Rewriting many `_Shape:_` lines at once takes a one-off script that
  imports `tallyKeyShapes` and `formatShapeLine` from `tools/protocol-key-shape.ts`. It has to stand
  inside the tree, under `fabricated/` which git ignores, for `#/` to resolve.
- **Two close numbers mean different things.** "The corpus states N of them" in
  `docs/turns-taken.md` is the turns-lost sum pinned in `tests/core/fight-statistics.test.ts`, not
  the count of turn-lost events `fight:decoding` prints.
- **`docs/auras-standing.md` is a hand copy** of what `fight:auras` prints, held to the material by
  its test: a change to how a status is dated means rewriting its rows.
- **A key with no material** can still be read: an entry marked decoded with no `_Shape:_` line, and
  a fabricated fight to hold it (`tools/fabricated-fight.ts`).
