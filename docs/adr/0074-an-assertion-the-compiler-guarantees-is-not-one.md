# 0074. An assertion the compiler guarantees is not one, so the floor moves under it

- **Status:** Accepted
- **Date:** 2026-09-10

## Context

**S5 was sitting on its own bound.** Measured 2026-09-10 over `054ea73` with the working tree: the
guard reported `2.00 assertions per function across 563 functions`. The rule asks for two, so 563
functions ask for 1126 assertions and the tree spelled 1128. **The margin was two assertions**, and
nothing said so — the figure only appears when the guard fails.

**Six of the assertions holding it up cannot fail.** Of the eleven `assert(typeof …)` spellings in
`libs/`, `project/`, `src/` and `tools/`, six check a value the compiler has already narrowed. Each
was found mechanically: the line was deleted, `deno check` was run, and the tree still type-checked
with nothing else changed.

| assertion                         | what the compiler already knew                        |
| --------------------------------- | ----------------------------------------------------- |
| `libs/json-text.ts:21`            | the parameter is declared `text: string`              |
| `tools/build-userscript.ts:64`    | the same, and the `throw` below it is the real check  |
| `tools/protocol-key-shape.ts:120` | `if (value === null) return` narrowed it a line up    |
| `tools/protocol-key-shape.ts:220` | the parameter is declared `line: string`              |
| `tools/help-article.ts:334`       | `writing.text` is narrowed by the `isOk` discriminant |
| `tools/protocol-key-table.ts:334` | the same value, in the same shape                     |

The other five earn their place, and the split is worth writing down. `libs/json-text.ts:41` narrows
an `unknown` and is the guard **C13** asks for rather than a cast. `tools/preview-page.ts:119`
checks what the standard library's own types get wrong: `JSON.stringify` is typed as returning
`string` and returns `undefined` for a function, a symbol and `undefined` itself. The three in
`src/game/browser-store.ts` check an object handed over by the game's page, which is **E5**'s
boundary and where a type is a claim rather than a fact.

**So the rule stood in the way of the rule.** **W4** says a mutation that lights nothing is a
finding and that the answer is often to delete something. Deleting these six takes the figure to
`1.99` and reddens the gate: a measure meant to make the program safer was the only thing keeping
six lines that cannot check anything.

**The bound had already been narrowed three times to keep the tree above it.** **ADR 0007** measured
it by directory rather than over the whole tree. **ADR 0051** narrowed it twice more — once for the
layer **A11** forbids to assert, once for a declaration handed nothing. A fourth narrowing landed
the same day as this record, counting the closures a file writes inside its functions. Each was
correct on its own, and together they are a bound that has only ever moved towards the tree.

## Decision

**The six are deleted, and an assertion the compiler already guarantees is not an assertion.** It
states nothing a caller could break, occupies the numerator of a safety measure, and reads to the
next person as a check that has been thought about.

**S5's floor moves to `1.9`, and it moves to leave room.** The tree stands at `1.99` with the noise
gone. A floor set at where the tree happens to stand is the trap this record exists to name, so the
number sits far enough below that deleting an assertion **W4** asks to be deleted is never what
reddens the gate. That margin is the point of the figure, not slack in it.

**The rule keeps saying two is what a function should carry.** The floor is what a machine holds the
average to; **A1** and **A2** are what a reader holds a function to, and they were never a number.

## Consequences

Easy: an inert assertion can now be deleted the day it is found, which is what **W4** asks. The
figure states a margin rather than a coincidence, and `AGENTS.md` says what the floor is for.

Hard: the floor is lower, so a real fall in assertion density has further to travel before a machine
notices. That is the trade — the guard was not catching that fall either, because the tree was
pinned to the bound by lines that check nothing.

Owed later: a fifth narrowing of the denominator is a signal that the average over a whole tree is
the wrong measure, not that the number is wrong. The measure a tree-wide average cannot make is a
per-file one, and nothing here decides that yet.

## Alternatives

**Keep the floor at two and write six real assertions.** It passes, and it is adding code to satisfy
a measure — the thing **ADR 0016** already had to name once for comment. The six places wanting an
assertion would have been chosen because six were needed, not because six were missing.

**Keep the six.** They cost one line each and the gate stays green. But every one of them reads as a
check to whoever meets it next, and the register would have to say why a mechanically-provable
tautology is kept — a document nobody can act on.

**Exclude compiler-guaranteed assertions from the numerator mechanically.** The detection used here
is sound and repeatable: delete the line, run `deno check`. It is also a type-check per assertion,
which is seconds per line against a gate that runs in about a minute, and it answers only for the
spellings a walk can find. Rejected on cost, not on principle.
