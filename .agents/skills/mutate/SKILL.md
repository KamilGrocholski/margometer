---
name: mutate
description: Prove a test in MargoMeter can fail (W3) — break what it covers, watch it go red, restore from a copy — and treat a mutation that lights nothing as a finding (W4). Use after writing or changing a test or a guard, before a commit, or when the user asks to prove a test.
---

# Proving a test in MargoMeter

A test that cannot go red holds nothing, and a green run says nothing about it. **This skill owns no
rule**: the proof is **W3**, the finding is **W4**, and the record of both is the commit body
(**G3**).

## The process

1. **Pick the break.** The line the test claims to hold, and the **call** that reaches it: invert
   the condition at the call site, not only inside the body. A break inside a body can land in a
   branch something else already covers.
2. **Copy the file** into the scratchpad: `cp <file> <scratchpad>/<name>.copy`.
3. **One break.** Change a value or negate a condition. Do not delete a use: a constant left unused
   fails `deno check` first, which is the compiler's red and not the test's.
4. **Confirm it landed** before reading any verdict: `git diff <file>` shows the break and nothing
   else (**W3**).
5. **Run the narrowest file** that covers it: `deno test -A <the test file>`. Note which case went
   red and on what value.
6. **Restore from the copy**, never `git checkout` or `git restore` (**W3**):
   `cp <scratchpad>/<name>.copy <file> && cmp <file> <scratchpad>/<name>.copy`.
7. **Record it** for the commit body: `W3: <the break> reddened <the case>.`

## When nothing lights

Run the same break alone once more, on the one file. Still green: that is **W4**, a missing test or
an inert line. Report it and say which; never drop it from the body.

## The checklist

- [ ] One break per run, on the narrowest file (**W3**).
- [ ] The break seen in the diff before the verdict was read.
- [ ] The call site mutated, not only the body.
- [ ] A test at a boundary has its neighbour: zero and one, both sides (**W5**).
- [ ] Every file restored from its copy, and `git diff` back to the intended change.
- [ ] Each break and what it reddened, in the body; each silent one reported (**W4**).

## Gotchas paid for

- **Several breaks at once read as W4.** A break in a hot path fails so early that the others never
  run: eight at once lit four, the same eight one at a time lit all of them.
- **Past a boundary the message never shows.** Behind `attempt` an `AssertionError` becomes a
  `Caught` and a value, so the suite fails on the value and not on the message. Count the red cases;
  a grep for the message is not the proof.
- **A guard of a number passes without the mechanism** when the old path already reached that
  number. Choose material where the old path gives a different one, and read what was produced, not
  only the sum.
- **A seam between layers lights nothing.** Each side's suite is handed what the other would give;
  replacing the call that joins them with an empty value reddened nothing. The gluing layer needs a
  test over the recordings.
- **A guard over a table can pass on one entry.** A `some` over the rows holds the table to one
  word; break a single entry to see the guard notice it.
