---
name: record-decision
description: Write a decision record (ADR) in MargoMeter's docs/adr/ — a rule changed, a direction chosen or rejected with the maintainer. Use when a rule in AGENTS.md is about to change, when the user says "ADR", "decision record", or asks to write down why something was decided.
---

# Recording a decision in MargoMeter

A decision record is where a rule's evidence lives, so the rule can state only what binds
(`AGENTS.md`, _Authority_). **This skill owns no rule**; the shape below is what
`tests/repository/decisions.test.ts` reads, and the rest is taken from the records already there.

## When one is written

- A rule in `AGENTS.md` changes, is added or is removed: always (`AGENTS.md`, the opening).
- A direction was chosen with the maintainer, and a reader would otherwise re-open it.
- Not for a fix that changes no rule: its reasoning is the commit body's (**G3**).

## The process

1. **The number.** `ls docs/adr/ | tail -1`, and the next one, four digits. No gap.
2. **The name.** The decision as a sentence, in kebab-case after the number: the title's words, not
   a topic. `0006-an-if-that-does-not-leave-has-an-else`, never `0006-else-branches`.
3. **The header**, within eight lines of the top:

   ```markdown
   # NNNN. The decision as a sentence

   - **Status:** Accepted
   - **Date:** YYYY-MM-DD
   - **Supersedes:** ADR NNNN
   ```

   The last line only where it replaces a record, and the replaced record's status then reads
   `Superseded by ADR NNNN`. `Accepted` and `Superseded by …` are the only statuses a record holds.
4. **Context.** What stood, measured: counts with the date and the material they were read on
   (**V4**), quotations with their build id or date (**V2**). No adjective where a number fits.
5. **Decision.** Opens with "Decided with the maintainer on YYYY-MM-DD." where it was. Each decision
   is one bold sentence, with the reasoning after it. Every alternative weighed is a `Rejected:`
   paragraph saying what it would have cost.
6. **Consequences.** What moves because of it, what a console or a file states differently, and what
   stays open and whose call it is.
7. **The rule, in the same commit.** `AGENTS.md` states what binds and cites `ADR NNNN`, not bold;
   the argument stays in the record. Where a rule is renumbered, every bold reference moves with it.
8. **The row** in the decision records' table of `docs/structure.md` (**C9**).
9. **The gate** (**W1**), and the commit through the `commit` skill, with the record and the rule
   together (**G5**).

## The checklist

- [ ] Numbered next, titled by its own number, dated, `Accepted`.
- [ ] A superseded record says so, and its replacement names it back.
- [ ] Every number in the context has its date and material (**V4**), and none is one a tool could
      state at read time instead (**V5**).
- [ ] The rule in `AGENTS.md` changed in the same commit, citing the record.
- [ ] The rule carries no argument: nothing in it repeats the record (**C15**).
- [ ] A row in `docs/structure.md`.

## Gotchas paid for

- **"Until this decision" describes the branch.** A record written mid-cycle says what the branch
  did, and the last release may already have done otherwise. Before a changelog entry leans on a
  record, read the last tag's tree.
- **Two records in flight take the same number.** Number at the commit, not at the first draft.
- **`develop ADR NNNN` is another numbering.** The records of `develop` at `fa1dcce` are cited that
  way and never bold; this tree's are `ADR NNNN`.
