---
name: review
description: Review a change in MargoMeter against its rules — the gate first, then a checklist of what no guard holds, each finding verified, ranked CRITICAL, HIGH, MEDIUM or LOW and reported in one fixed format. Use when the user asks for a review, "code review", "przejrzyj", "sprawdź zmiany", or before committing a change wider than one file.
---

# Reviewing a change in MargoMeter

A review here covers what the gate cannot see. What a guard in the register holds, the gate has
already said; the review reads what is left, most of all the rules `AGENTS.md` marks `by-reading`.
**This skill owns no rule.** It owns the levels and the format below, and every finding names the
rule it breaks. A change an agent wrote is read as hard as one a person wrote, for an abstraction
nobody needs, a shape that changes and an allocation in a loop most of all.

## The process

1. **The target.** By default the working tree and the index: `git status`, `git diff HEAD`. The
   user may name a range (`<rev>..<rev>`), a commit or a path instead; say which one was taken.
2. **The gate**, `deno task check` (**W1**), through the `gate` skill. Red is one `CRITICAL` finding
   naming the first red stage, and the review goes on over what can still be read. Where `src/`
   changed, `deno task e2e` too, or the header says why not (**W9**).
3. **Read whole.** Every changed file in full, the suite that holds it, and the owner of each rule
   the change touches. A diff hunk alone hides the `else` that is missing and the caller that
   breaks.
4. **The checklist**, item by item. An item the change does not touch is skipped without a word.
5. **Verify each finding** before it is written: read the code again and build the concrete case, an
   input or a state and the wrong result it leads to. A finding with no case is a `QUESTION`, never
   a level.
6. **Report** in the format below. The review edits nothing; fixes follow when the user asks.

## The levels

- **`CRITICAL`** — it breaks a _Never_: the network, the game automated, `TODO.md` written,
  `captures/` edited by hand, data invented. Or a path from the game into our code with no boundary
  on it (**E12**), a red gate, an _Ask first_ taken without asking.
- **`HIGH`** — the add-on states something wrong or stops stating it: a figure that differs from
  `develop`'s (**W8**), a failure swallowed with no mark (**E9**), a throw where a failure is
  returned (**E1**), a collection with no bound (**S11**), an assertion in the reader's layer
  (**A11**), a test deleted or skipped.
- **`MEDIUM`** — a rule held by reading is broken, with no wrong output yet: an `if` whose negative
  space had something to say (**S14**), an assertion missing or naming its condition (**A1**,
  **A2**, **A4**), a verb or a term used for something else (**N2**, **N12**, **N20**), a comment
  about the past (**C3**) or earning nothing (**C2**), a claim with no source (**V1**), a new test
  with no proof (**W3**), a boundary tested from one side (**W5**), a branch where a table would do
  (**C18**), a file or an interface before its second consumer (**C9**, **I1**).
- **`LOW`** — a name, a docblock or a comment that reads worse than it could, and states nothing
  wrong.

A finding takes the level of the heaviest thing it does, and one rule: the heaviest it breaks.
`CRITICAL` and `HIGH` block a commit. `MEDIUM` and `LOW` are fixed, or the commit body says why they
were left (**G3**).

## The checklist

### Simplicity

- [ ] Is this the simplest thing that works, with nothing built for a need nobody has yet (**C9**,
      **I1**, **I3**)?
- [ ] Can a reader new to the tree follow it in five minutes, from its names, types and assertions
      (**C14**, **S1**, **N2**)?
- [ ] Could a branch be data: a lookup in place of a `switch` or a run of `if` (**C18**)?
- [ ] Can any of it, or a dependency, be deleted with the gate still green (**C9**, **W4**, _Ask
      first_)?
- [ ] Is every record born whole, and nothing allocated per element that could stand outside the
      loop (**S15**, **S3**)?

### Boundaries and failures

- [ ] A failure that can happen is returned beside the value, and an assertion guards only what must
      never happen (**E1**, **A8**).
- [ ] Every call site branches on what can fail, and nothing substitutes zero for a failed read
      (**E2**, **E6**).
- [ ] A new broad catch is `attempt`, at one of **E5**'s boundaries, and a new boundary was asked
      for (**E4**, **E5**).
- [ ] Every failure leaves its mark, and reaches the console once per kind (**E9**).
- [ ] A callback handed to the browser or the game is guarded at the handover (**E10**).
- [ ] A path from the game into our code has a boundary on it (**E12**, **A7**).

### Shape

- [ ] Explicit control flow, no recursion, a bound on every loop (**S1**, **S2**).
- [ ] No mutable structure aliased; a caller that must not mutate gets a reading (**S9**).
- [ ] Every collection that grows with input has a maximum, and something reads it (**S11**).
- [ ] Compound conditions split, invariants stated positively (**S12**).
- [ ] Every `if` that does not leave has its `else`, or its negative space is empty (**S14**).
- [ ] A function keeps the purity its verb states: a strong one changes nothing it is handed, and a
      strong or weak one calls nothing of none (**P1**, **P3**).
- [ ] A function called from one place, whose verb is not strong, is a block in its caller under a
      one-line heading (**S4**); a state change stands in its event's entry (**P2**).

### Assertions

- [ ] Arguments, results and invariants asserted, positive and negative space (**A1**, **A2**).
- [ ] One condition per assertion, and the message names the invariant (**A3**, **A4**).
- [ ] Nothing asserted in `src/ui/` or the entry and boot (**A11**).
- [ ] No assertion the compiler already guarantees (**A12**).

### Names

- [ ] A function starts with the verb that says its work, from the table (**N2**).
- [ ] Qualifiers and units last and in full (**N3**, **N14**); booleans prefixed and negated where
      read (**N8**, **N15**).
- [ ] The term `CONTEXT.md` gives, never one it forbids (**N12**).
- [ ] A name the game chose spelled once, in its adapter's map (**N13**); `read` and `write` only
      across a boundary (**N16**).
- [ ] A closed set of strings is a vocabulary object, a union with a `kind` has one, a failure is
      named for what failed and how (**N18**, **N19**, **N20**).

### Comments and documents

- [ ] Each comment carries a measurement, a constraint, a rejected alternative, a trap or a step's
      heading (**C2**), and says what is true now (**C3**).
- [ ] A docblock says what the file is for (**C4**); description lives there and nowhere else
      (**C14**).
- [ ] Nothing a canonical document owns is restated (**C15**).
- [ ] The standard library was asked first (**C17**).
- [ ] Every claim about the game or a browser carries its source and date (**V1**, **V2**, **V3**,
      **V4**), and no number in prose is one a tool could compute (**V5**).
- [ ] English everywhere, Polish only for a player, and our words never in it (**L1**, **L2**,
      **L3**).
- [ ] What the change drags along is the `commit` skill's checklist, read from there.

### Tests

- [ ] Every new test was seen red, and a silent mutation reported (**W3**, **W4**) — the `mutate`
      skill.
- [ ] A boundary tested from both sides, zero beside one (**W5**).
- [ ] Another program's output held as a transcript (**W6**).
- [ ] No golden expectation moved to pass a change in behaviour (**W8**).
- [ ] A number guarded where the old path could not reach it; a table guarded entry by entry; a flow
      across layers tested where the layers join.

### Asked first, and never

- [ ] Every item of _Ask first_ and _Never_ in `AGENTS.md`, read against the diff.

## The format

The report is exactly this, in this order. The labels stay in English; the sentences are in the
conversation's language.

```
## Review: <the target>, <N> files, gate <green (<T> tests) | red at <stage>>, e2e <green | not run: <why>>

| CRITICAL | HIGH | MEDIUM | LOW |
| -------- | ---- | ------ | --- |
| <n>      | <n>  | <n>    | <n> |

Verdict: <BLOCKS COMMIT | READY WITH FIXES | READY>

### [<LEVEL>] <rule> · <path>:<line>

What: <one sentence: what is wrong>
Case: <the input or state, and the wrong result it leads to>
Fix: <what to change, in one or two sentences>

### QUESTION · <path>:<line>

<what is uncertain, and what would settle it>
```

- **Verdict:** `BLOCKS COMMIT` with any `CRITICAL` or `HIGH`, `READY WITH FIXES` with only `MEDIUM`
  or `LOW`, `READY` with none.
- **Order:** heaviest level first, then by path, then by line.
- **One place per finding.** The same fault in several places is one finding, at the first place,
  with the others listed under `What:`.
- **No findings** is the header, the table of zeros and `Verdict: READY`, and nothing else.
- Nothing is reported that the gate already reported, and nothing that was not verified.

## Gotchas paid for

- **The gate guards sums, not names.** Columns that add up to a hundred pass with the wrong names in
  them; a change to what the panel draws is read on the panel too (the `verify` skill).
- **A heading of a rule is not the rule.** Before a finding says "the tree forbids", read the points
  under the heading: a direction the summary seems to refuse may be one the rules name.
- **A second spelling of a changed value.** A token moved in one file may stand as a bare number in
  another; grep the old value before calling a change whole.
- **A green e2e on the middle of a box.** A test of position that asks about the centre passes a box
  overlapping by less than half its width; the edge is what to ask about.
