# 0010. The structure is a document of its own

- **Status:** Accepted
- **Date:** 2026-09-27

## Context

`AGENTS.md` carried the tree as tables, one row per file, under its own `## Structure`. Read on
2026-09-27, that section ran from line 69 to line 300 of 745, so 232 lines of every session's
context were a map a session reads only when a file comes or goes. The rest of the file is rules,
and a rule is read on every change. `tests/repository/documents.test.ts` held the tables to the
tracked files, and nothing in it needed them to stand in `AGENTS.md`.

## Decision

Decided with the maintainer on 2026-09-27.

**The map stands in `docs/structure.md`, and the rules stay in `AGENTS.md`.** The tables move
unchanged, with the sentence that says a row is the way to a file's docblock (**C4**). `AGENTS.md`
lists the document with the others it stands on, and the guard reads the rows from there.

Rejected: dropping the tables for the docblocks and `git ls-files`. The rows are what a reader scans
to find where a thing lives, and a docblock is read only once the file is found.

Rejected: keeping the tables and shortening the rows. The cost is the count of rows, not their
width, and it grows with every file.

## Consequences

A file added, moved or deleted takes its row in `docs/structure.md`, and the guard reddens the same
way it did. `AGENTS.md` loses the section, so a session that needs the map reads the document, which
the commit skill's checklist names.
