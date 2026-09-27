---
name: write-document
description: Write or edit a Markdown document in MargoMeter — a canonical document, a section of AGENTS.md, a README, the changelog, a skill. Use before writing any .md in this tree, when moving text between documents, or when a guard over documents is red.
---

# Writing a document in MargoMeter

A document here is read by a person and by the guards in `tests/repository/`, and both read it
against the tree. **This skill owns no rule.** Every line points at the rule it applies, and the
rule's owner is where to read it in full.

## Where the text goes

Every rule has one owning document, and the others point at it (`AGENTS.md`, _Authority_). Before
writing a sentence, find its owner with `grep -rn` over the documents:

| The text is                                   | Its owner                                        |
| --------------------------------------------- | ------------------------------------------------ |
| how code here is written, and what binds      | `AGENTS.md`                                      |
| the architecture: layers, ports, the failures | `docs/design.md`                                 |
| a domain term, and the spellings it forbids   | `CONTEXT.md`                                     |
| the panel's look                              | `DESIGN.md`                                      |
| the game client, the network, stored data     | `SECURITY.md`                                    |
| a decision and the evidence that made it      | `docs/adr/`, through the `record-decision` skill |
| what a player is told changed                 | `CHANGELOG.md`, in Polish, as its header says    |
| where a file is                               | `docs/structure.md`                              |
| a procedure an agent follows                  | a skill under `.agents/skills/`                  |

A new canonical document joins the list in `AGENTS.md` and its row in `docs/structure.md`, in the
commit that creates it (**C9**).

## The process

1. **Read the owner** of every rule the text touches. Cite it rather than restate it (**C15**), and
   before deleting a restatement, confirm the owner says the thing (`AGENTS.md`, _Authority_).
2. **Write in English** (**L1**). Polish only where a player reads it (**L2**), and never with our
   vocabulary or a key of the game's (**L3**).
3. **Every claim carries its source.** The game: documentation, a client asset or the recordings
   (**V1**). A quotation from the client: its build id; from the published help: the date it was
   read (**V2**). A browser: engine, first version, date (**V3**). A measurement: the material
   (**V4**).
4. **No number a machine could compute** (**V5**). Either a tool states it at read time, or it is a
   measurement with its date and material, and nothing in between.
5. **What is true now** (**C3**). "Until this decision" and "earlier" belong to an ADR's context and
   to nothing else.
6. **A rule names the observation that breaks it**, and its argument lives in its decision record
   (`AGENTS.md`, _Authority_).
7. **Format and read back.** The edit hook runs `deno fmt` on the file; then read back the whole
   unit that changed, never only the line (**W7**).
8. **The gate** (**W1**), after staging the new file by path (**W2**).

## The checklist

- [ ] The text has one owner, and it is this document; everything else is a pointer.
- [ ] Every rule named in bold is one `AGENTS.md` states: `**E4**`, one per span.
- [ ] A rule of `develop`'s numbering is written `develop ADR NNNN`, never bold.
- [ ] Every path in backticks exists, or names the revision it exists at (`develop:…`).
- [ ] No quotation of the game's prose and no player nickname (Never, `NOTICE.md`).
- [ ] No number that a tool computes, and every measured one dated with its material (**V5**,
      **V4**).
- [ ] A new document is on the list in `AGENTS.md` and has its row (**C9**).
- [ ] A section heading a guard reads is spelled as the guard reads it.

## What the guards hold

| Held                                                  | By                                                 |
| ----------------------------------------------------- | -------------------------------------------------- |
| bold rule names, the list of documents, the structure | `tests/repository/documents.test.ts`               |
| every rooted path in backticks                        | `tests/repository/cited-paths.test.ts`             |
| a decision record's header and its superseding pair   | `tests/repository/decisions.test.ts`               |
| the changelog's sections and the declared version     | `tests/repository/changelog.test.ts`               |
| the two READMEs against each other                    | `tests/repository/readmes.test.ts`                 |
| the protocol key register against the client and help | `tests/repository/protocol-keys.test.ts`           |
| the register of recordings against `captures/`        | `tests/repository/captured-fight-register.test.ts` |

Everything else on this page is held by reading.

## Gotchas paid for

- **A placeholder path is a citation.** A rooted span with an ending, such as a made-up file under
  `docs/adr/` or `tests/`, is read as a path and reddens `tests/repository/cited-paths.test.ts`.
  Name the directory and describe the file in words.
- **A heading of a rule is not the rule.** Before writing "the tree forbids this", read the points
  under the heading: a summary sentence is often wider than what it summarises.
- **"Earlier" is relative to a branch.** A changelog entry or an ADR written during a cycle
  describes the branch, not the release. Audit against the last tag's tree with
  `git show v<last>:<path>` before telling a player something changed.
- **A probe that re-implements the code measures something else.** A number for a document is taken
  by importing from `src/`, never by rewriting its logic beside it.
- **A new file is invisible to the guards until it is staged.** They read `git ls-files`, so an
  unstaged document reads as absent.
