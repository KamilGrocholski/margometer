# 0075. A comment is counted by its words, not by the lines it is written over

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

**ADR 0005** set C5 at 25% and **ADR 0016** set C16 at 22%, both over a count of _lines whose first
non-space characters open or continue a comment_. A TypeScript docblock writes three of those before
it writes a word: the line that opens it, the line that closes it, and a blank continuation between
every two paragraphs.

Measured over the tree on 2026-09-11, by directory, with the frame counted and without it:

| Directory   | Counted as ADR 0005 counts | Counting only lines carrying a word |
| ----------- | -------------------------- | ----------------------------------- |
| `libs/`     | 20.2%                      | 13.7%                               |
| `project/`  | 22.0%                      | 14.6%                               |
| `src/`      | 22.8%                      | 16.2%                               |
| `src/core/` | 22.7%                      | 14.9%                               |
| `src/game/` | 22.1%                      | 15.7%                               |
| `src/ui/`   | 21.5%                      | 15.1%                               |
| `tools/`    | 17.2%                      | 12.4%                               |

Across every `.ts` file in the tree, 2,748 of 9,361 counted comment lines carry no word at all.

**The two columns of ADR 0005's comparison were not the same measurement.** That ADR set 25% _"above
the worst figure measured above"_, and the figures it measured against were Zig files —
`replica.zig` at 15%, `journal.zig` at 23%. Zig has no block comment. Every line counted in that
column carries a word; nearly a third of the lines counted in ours do not.

Two things followed from the gap, and both were live when this was written.

**The guard floored the share before comparing**, so a rule reading _under 25%_ admitted anything
below 26%. ADR 0016 named this defect in passing — _"`src/ui/panel-screen.ts` at 26.0% was over C5:
it passed only because the guard floors the share before comparing"_ — and set C16 to 22 rather than
23 to compensate for it, rather than removing it. Read exactly on 2026-09-11, 24 files stood at or
over C5 and two directories over C16, with the gate green: `src/` at 22.8% and `src/core/` at 22.7%.

**What would have had to go to bring those figures down is what C2 asks a comment to carry.** The
comment in the two directories over C16 is dated measurements (609,078 points under `poison` over
`captures/`, 20 of 955 critical blows carrying both keys), constraints of the browser's, and traps.
Of the 24 files at or over C5, 23 fall under it the moment the frame is not counted.

## Decision

**A comment line counts against C5 and C16 where it carries a word.** `hasCommentWord` in
`tests/source-line.ts` is what says so: a line that opens a docblock, closes one, or continues one
with nothing on it is punctuation and is not counted. `isCommentLine` is unchanged and goes on
meaning what it meant — every guard that skips comment while reading code still skips all of it.

**The comparison is exact.** `Math.floor` is gone from both guards: a share reaching the ceiling is
over it, because the rules say _under_.

**The numbers stay at 25 and 22.** They are not re-derived here: the numerator is what moved, and it
moved towards what the figures in ADR 0005 were always measuring. At the new count the worst
directory in the tree is `src/` at 16.2%, inside the band that ADR held up as the standard.

## Consequences

- **C5 and C16 now mean what they say.** A file at exactly 25.0% is over, and so is a directory at
  exactly 22.0%. One file was: `tests/libs/html-text.test.ts` stood at 5 of 20, and its first note
  says the same thing in one line instead of two.
- **The headroom is real rather than borrowed.** Six points on the worst directory, against the two
  ADR 0016 measured — and none of it bought by deleting a measurement.
- **A docblock costs what it says and not how it is shaped.** Splitting one paragraph into two, or
  breaking a sentence across a line, no longer moves the figure. That was the perverse half: the
  cheapest way to pass was to write the same evidence with less punctuation around it.
- **The bound is easier to pass, and C2 is what holds the line.** C16 was the fence around C14, and
  a fence six points away is a weaker fence. What it fences against — a description over every
  declaration — is C14's to refuse, and the register says `tests/repository/sources.test.ts` holds
  neither of those by reading.

## Alternatives

- **Fix the floor and cut the comment.** Enforce both rules exactly against the count ADR 0005
  wrote, which meant about 110 comment lines out of 24 files and two directories. Rejected on
  reading them: they are dated measurements, constraints somebody else's system imposes, and traps —
  the four things C2 exists to keep. A measure that asks for those to be deleted is measuring the
  wrong thing.
- **Move the rule to what the guard did** — _at most 25 whole points_ — and change nothing else. It
  costs nothing and settles the disagreement, but it leaves the ceiling where a comparison of two
  different measurements put it, and leaves a third of the numerator being punctuation.
- **Count against lines of code rather than lines of file.** A denominator without blank lines is a
  different bound with no measurement behind it, and every figure in ADR 0005 and ADR 0016 would
  have to be re-taken before either number meant anything again.
- **Raise the ceiling.** 25 and 22 were set against measured material. Moving a ceiling to wherever
  the tree happens to stand is the failure ADR 0016 is named after.
