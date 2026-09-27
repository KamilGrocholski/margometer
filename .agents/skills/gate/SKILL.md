---
name: gate
description: Run MargoMeter's gate (deno task check) and turn a red one into a fix — which stage failed, which guard, which rule it holds, and what to change. Use when the gate or a test is red, when the user says "check", "gate", "bramka", or before calling any change done.
---

# Reading the gate in MargoMeter

The gate is `deno task check` (**W1**): one command, so there is no version of having run the tests
but not the lint. **This skill owns no rule.** A guard holds a rule, and the rule is what gets
satisfied; the guard is never what gets changed to pass (_Ask first_).

## The process

1. **Stage by path first** (**W2**). The guards read `git ls-files`, so an unstaged new file reads
   as absent and an unstaged deletion as present.
2. **Run it into a file**, so the failure can be read twice:
   `deno task check 2>&1 | tee <scratchpad>/gate.log`.
3. **Find the first red stage.** The task stops at the first one, in `deno.json`'s order:

   | Stage                                          | Red means                                                      |
   | ---------------------------------------------- | -------------------------------------------------------------- |
   | `deno fmt --check`                             | a file unformatted: `deno fmt <path>`                          |
   | `deno lint`                                    | a lint rule: fix the code, never an ignore comment             |
   | `deno check`                                   | a type error: narrow it (**C13**), never `!` (**C12**)         |
   | `deno check --config project/browser-lib.json` | a construct past the browser floor (`docs/browser-support.md`) |
   | `deno test -A`                                 | a suite or a guard: step 4                                     |
   | `deno task build`                              | the bundle: `tools/build-userscript.ts` names the check        |

4. **A red test.** Under `tests/repository/`, the guard register in `AGENTS.md` names the rule it
   holds: read the rule, then the assertion message, which names the invariant (**A4**). Anywhere
   else, the suite's layer is the directory it stands in. Run the one file while fixing:
   `deno test -A <the test file>`.
5. **Fix what the rule is about**, then the whole gate again (**W1**). A guard that seems wrong is a
   question for the maintainer, never an exclusion or a skip (_Ask first_).
6. **Where `src/` changed**, `deno task e2e` as well, outside the gate (**W9**).

## Reds seen before

| Red in                                                  | What it means                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `documents.test.ts`, `a file unlisted`                  | a tracked file with no row in `docs/structure.md` (**C9**)        |
| `documents.test.ts`, `a line naming nothing`            | a row, a list line or a register row whose file is gone           |
| `documents.test.ts`, `a document unlisted`              | a document not on the list in `AGENTS.md`                         |
| `documents.test.ts`, `a rule named in bold…`            | a rule named in bold that `AGENTS.md` does not state              |
| `cited-paths.test.ts`, `every path this tree is cited…` | a backticked path that moved or never was: fix the citation       |
| `comment-share.test.ts`                                 | **C4**, **C16**: cut the comment, never pad the code to dilute it |
| `function-length.test.ts`                               | **S4**: split by what it does, not at the seventieth line         |
| `declaration-order.test.ts`                             | **C1**: types, constants, then functions, the entry first         |
| `broad-catches.test.ts`                                 | **E4**: route the call through `attempt` at its boundary          |
| `control-flow.test.ts`                                  | **S1**: a function reaching itself, or a body written on one line |

All of them stand under `tests/repository/`.

## Gotchas paid for

- **A new file is not in the tree until it is staged.** Every guard reads `git ls-files`: a document
  written and not staged reads as a line naming nothing.
- **Several reds at once are read top-down.** A type error shifts line numbers and a moved file
  reddens three guards; fix the first stage, then run again.
- **A probe moves `deno.lock`.** A `deno eval` importing `jsr:@std/…` with no version writes to the
  lock, and the gate then runs against a lock nobody meant. The Bash hook says so; restore it from a
  copy.
- **A green gate is not a drawn panel.** Sums that add up to a hundred pass with the wrong names in
  the rows. A change to what the panel draws is seen through the `verify` skill as well.
