---
name: commit
description: Make a commit in MargoMeter — the process from a dirty tree to a commit on develop, and the checklist of what must hold before it. Use when the user asks for a commit, or a round of work is done and about to be committed.
---

# Committing to MargoMeter

A commit here is a record somebody reads a year later to learn why the tree is the way it is, so the
body carries the reasoning and the gate carries the proof. **This skill owns no rule.** Every line
below points at the rule it checks, and the rule's owner is where to read it in full.

## The process

1. **Only on request** (**G1**). Without one, the round ends with the changes in the working tree
   and a summary, and this skill stops here.
2. **Look.** `git status`, `git diff`, `git branch --show-current`: the branch is `develop`
   (**G6**).
3. **Split.** One change per commit, each leaving the gate green on its own (**G5**). `TODO.md`
   never rides along: if the maintainer asked for it, it is a commit of its own (**G4**).
4. **Stage by path** (**W2**), never `git add -A` or `git add .`. Then `git diff --cached --stat`,
   and read the list against step 3.
5. **The checklist** below, over the staged diff. An item that fails is fixed or asked about, never
   noted in the body and committed anyway.
6. **The gate.** `deno task check` after staging (**W1**). Where the commit touches `src/`,
   `deno task e2e` as well (**W9**). Note the test count and whether e2e ran.
7. **The message**, written to a file in the scratchpad: the header (**G2**), the body (**G3**), the
   gate line, the attribution trailer. Then `git commit -F <file>`, with no `--no-verify` (**G8**).
8. **Read back.** `git log -1 --stat` and `git status`: the commit holds what step 4 staged and the
   tree holds what was left for later. **No push** (**G1**); a release is `docs/releasing.md`'s.

## The checklist

### What is staged

- [ ] The branch is `develop`, never `main` (**G6**).
- [ ] Only the paths this commit is about; nothing left over from a probe or another change
      (**G5**).
- [ ] `TODO.md` absent, or alone in a `todo: …` commit (**G4**, Never).
- [ ] `captures/` changed only by `deno task capture:intake` (Ask first).
- [ ] `frozen/` changed only by its tools, never by hand (`frozen/AGENTS.md`).
- [ ] `deno.lock` moved only by a dependency the commit adds, not by a probe (Gotchas).
- [ ] No built, fetched or fabricated output: `dist/`, `.cache/`, `fabricated/` (`.gitignore`).

### What the change drags along

- [ ] A file added, moved or deleted has its row in the Structure of `AGENTS.md` (**C9**).
- [ ] A new canonical document joins the list in `AGENTS.md`, in this commit (**C9**).
- [ ] A new guard joins the register, in the commit that makes it pass (Guard register).
- [ ] A rule changed has its decision record in `docs/adr/`, numbered next (`AGENTS.md` intro).
- [ ] A change a player can see has one Polish sentence under `[Niewydane]` (`CHANGELOG.md` header).
- [ ] Every comment and docblock the diff touches says what is true now (**C3**, **C4**).
- [ ] No number in prose that a machine could compute (**V5**).
- [ ] No quotation of the game's prose, no player nickname (Never, `NOTICE.md`).

### Asked before, not after

- [ ] A contract carried over — `BattleEvent`, the wrap, the file format, storage keys (Ask first).
- [ ] A test deleted or skipped, for any reason (Ask first).
- [ ] A dependency added (Ask first).
- [ ] A compiler flag, a lint rule or a guard turned off (Ask first).
- [ ] A rule marked `[ASK]` widened, or a construct raising the browser floor (Ask first).

### Evidence

- [ ] Every new test was seen red under a mutation and restored from a copy (**W3**).
- [ ] A mutation that lit nothing is reported, not dropped (**W4**).
- [ ] No golden expectation moved to make a behaviour change pass (**W8**).
- [ ] The frozen readings were current, if the round relied on them (**W10**).
- [ ] `deno task check` green on what is staged (**W1**, **W2**).
- [ ] `deno task e2e` green, or the body says why it was not run (**W9**).

### The message

- [ ] Header `type(scope): effect`, English, naming the effect and not the activity (**G2**).
- [ ] Body: numbers, what decided it, rejected alternatives, what stays open (**G3**).
- [ ] Body: which mutations were made and what each reddened (**W3**).
- [ ] Last lines: the gate with its test count, e2e or why not, then the attribution trailer.

## The message's shape

Taken from `ac7f9e4` and `a8ea18d`. Wrapped at about 75 columns; a list where the items are
parallel.

```
<type>(<scope>): <the effect, in the tree's own words>

<What stood before, and why it had to move — with the numbers.>

<What changed, and what decided it.>

Rejected: <an alternative>, because <what it would have cost>.

W3: <the break> reddened <the test>; <the next break> reddened <the next>.
Both restored from a copy.

Open: <what this leaves for later, and whose call it is>.

Gate green (<N> tests). <e2e green (<M> in Chrome) | Nothing under `src/`, so e2e not run (W9).>

Co-Authored-By: <the trailer the session's attribution names>
```

A section with nothing to say is left out, never filled with "none".

## Gotchas paid for

- **`git add -A` picks up `TODO.md`.** `git restore --staged TODO.md` takes it off the index without
  touching the maintainer's file.
- **A probe moves `deno.lock`.** A `deno eval` importing `jsr:@std/…` with no version writes an
  entry to the lock. `git diff --stat deno.lock` after every probe, and restore it from a copy.
- **Mutations one at a time.** Several at once kill the runner and read like a W4 finding.
- **A new file with no row** reddens `tests/repository/documents.test.ts` with the path unlisted,
  and a row with no file reddens it the other way.
- **`-F`, not `-m`.** A message with backticks and newlines does not survive the shell's quoting.
