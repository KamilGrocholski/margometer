---
name: audit
description: Audit the whole MargoMeter tree at one commit against the rules no guard holds — split by layer across parallel subagents, every finding verified by the session, reported in the review skill's format with the decisions left to the maintainer set apart. Use when the user says "audyt", "audit", "przejrzyj całe drzewo", or after a release.
---

# Auditing the tree in MargoMeter

`review` reads a change; an audit reads the whole tree at one commit, most of all the rules
`AGENTS.md` marks `by-reading`, which nothing has read since they were written. **This skill owns no
rule**, and it owns neither the levels, the checklist nor the format: those are the `review` skill's
and are read from there (**C15**). It owns the split, the prompt a slice takes, the verification and
what follows.

## The process

1. **The target.** One commit, `HEAD` by default, named by its short hash in the report. The slices
   read the working tree, so a dirty one is said in the header. Never `git stash`: it takes
   `TODO.md` along. The user may narrow the audit to one slice.
2. **The gate**, through the `gate` skill, and `deno task e2e` (**W9**). Red is one `CRITICAL`, as
   in `review`, and the audit goes on over what can still be read.
3. **The split.** Every slice goes out in **one message**, as a `general-purpose` agent, and never
   with `isolation: "worktree"`, whose tree starts from an older commit:

   | Slice     | Reads                                                                    |
   | --------- | ------------------------------------------------------------------------ |
   | libs      | `libs/`                                                                  |
   | core      | `src/core/`                                                              |
   | ports     | `src/ports/`                                                             |
   | runtime   | `src/runtime/`                                                           |
   | ui, panel | the first half of `src/ui/` by lines, with `src/userscript-entry.ts`     |
   | ui, rest  | the second half of `src/ui/`, with `src/userscript-boot.ts`              |
   | tools, A  | the first half of `tools/` by lines                                      |
   | tools, B  | the second half of `tools/`                                              |
   | documents | the documents `AGENTS.md` lists, both READMEs, and every file's docblock |

   The sizes move, so they are measured, not written here (**V5**). A slice far past the others is
   halved by its file list, as `src/ui/` and `tools/` are:

   ```bash
   for d in libs src/core src/ports src/runtime src/ui tools; do
     printf '%-12s %6s\n' "$d" "$(git ls-files "$d/*.ts" | xargs cat | wc -l)"; done
   ```

4. **The prompt a slice takes**, filled in per slice:

   ```
   Audit <slice> of MargoMeter at <hash>, read-only: edit nothing, stage nothing.
   Read AGENTS.md whole, the closest AGENTS.md to each file, and in
   .agents/skills/review/SKILL.md the sections "The levels" and "The checklist".
   Read every file of <file list> whole, and the suite under tests/ that holds it.
   Skip what a guard in AGENTS.md's register holds: the gate has said it.
   A figure is held against develop with `git show fa1dcce:<path>` (W8).
   Return each finding as: rule · path:line · What · Case (the input or state, and
   the wrong result) · Fix · the level you propose. No case: return it as a
   QUESTION. The same fault in several places is one finding listing them.
   ```

   The documents slice reads for **V1** to **V5**, **C3**, **C4**, **C15**, and the _Never_ items on
   the game's prose and player nicknames, in comments as well as in documents.
5. **Verify every finding** in this session before it is written: read the code again and build the
   case. A slice's finding is a claim. Before one is reported, look for the decision that already
   settled it: `git log --grep=Rejected`, `docs/adr/`. A finding about a verb is held against
   **N2**'s table and the callers **P1** reads. Unverified is a `QUESTION` or nothing.
6. **The report** is `review`'s format, its header `## Audit: <hash>, <N> files, gate <…>, e2e <…>`,
   and after the findings one more section, `### For the maintainer`: every finding that waits on an
   _Ask first_ or on a choice of direction, each with its options. The audit edits nothing.
7. **The fixes** follow only when the user asks: one commit per layer or per decision, through the
   `commit` skill, each proved through `mutate` (**W3**). The body names the audit it closes, by
   version or hash, and a finding that turned out wrong goes in as `Rejected:` with its reason
   (**G3**).

## The checklist

- [ ] Every slice returned, and none was dropped for size.
- [ ] Every finding verified with its case, or a `QUESTION`.
- [ ] Nothing reported that the gate already reported.
- [ ] One place per finding, the others listed under `What:`.
- [ ] Every finding needing an _Ask first_ or a direction stands under _For the maintainer_.
- [ ] `git status` shows the tree as the audit found it.

## Gotchas paid for

- **A verb outside the table makes a function of none.** The 0.22.0 audit proposed renaming the
  ranking's comparator to a `compare…` verb; `compare` is not in **N2**'s table, so the rename made
  it "none" and **P1** reddened its seven strong callers. The finding was wrong.
- **A silent path is a decision, not a fix.** The shelf's three (a refused delete, fights dropped on
  open, a store fallen back to memory) each needed a fate the maintainer chose, and a design change
  in `docs/design.md` §10.5.
- **The game's prose hides in comments.** Two of the client's sentences stood quoted in
  `src/ui/panel-words.ts`; no guard reads for them, and a slice told only about code passes them.
- **A bound borrowed from the wrong owner reads right.** `src/core/carried-figure.ts` bounded the
  status bits by the casts' maximum; and a bound asserted before the insert lets one past it.
- **A path the recordings never reach moves no figure.** Its proof is a test of its own, never the
  corpus suites staying green.
