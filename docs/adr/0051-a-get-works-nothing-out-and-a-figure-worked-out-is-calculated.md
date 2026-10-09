# 0051. A get works nothing out, and a figure worked out is calculated

- **Status:** Accepted
- **Date:** 2026-10-09

## Context

N2 gives `get` to accessing what this program holds, immediately, and has no verb for a figure
worked out of a function's parameters by arithmetic. `get` took them: on 2026-10-09 twenty-two
functions of `libs/`, `src/` and `tools/` named `get…` answered a sum, a product, a ratio, a
rounding or a difference, among them `getControlHeightPixels`, `getContrastRatio`, `getBarFill`,
`getHealthPercent` and the two comparators `getRankedOrder` and `getKeyTallyOrder`. The comparators
wore `get` because `compare` is not in the table, and a verb outside it is of none, which P1 refuses
to their strong callers.

The verbs here come from TigerBeetle. Its source at `main` on 2026-10-09 declares 4422 functions,
126 of them `get_…`, and every one reaches what is already held: a message from a pool
(`get_message`), an element of a ring buffer (`get_ptr`), an entry of a cache (`get_or_tombstone`).
A figure it works out is named by its noun (`sector_floor`, `size`, `members_count`,
`encode_size_max`), and where a verb is wanted it is `calculate_`, seven times, `calculate_checksum`
among them.

## Decision

Decided with the maintainer on 2026-10-09.

**`calculate` joins N2's table, strong: it works a figure out of its parameters by arithmetic.** A
noun alone is not open to this tree, whose functions are an action and its object (N22), so
TigerBeetle's verb for the same work is taken.

**A `get` works nothing out, and a guard holds it.** `tests/repository/get-verb.test.ts` flags an
arithmetic operator, a compound assignment of one or a `Math` call in a `get…`, a closure inside it
counted as its body. A `+` joining words is no arithmetic. Arithmetic choosing an index
(`rows[rows.length - 1]`) is access, and arithmetic inside an assertion's arguments states a bound
rather than an answer, so neither is flagged.

**Where a verb of the table says more, it is taken over `calculate`.** A sum is `tally`'s
(`tallyGivenSourceCut`), a number held in its range `clamp`'s (`clampPositionWithin`), and the rest
`calculate…`, the comparators among them (`calculateRankedOrder`).

Rejected: **an exception for comparators.** A comparator subtracts, which is the work this record
names, and an exception by name is a rule nobody can read off the code.

Rejected: **`compose` for the figures.** It is the residue (N2), and a name in it says nothing of
the work.

## Consequences

- Twenty-two functions are renamed, with their callers in `tests/` and the two documents citing
  them; no behaviour moves.
- A function reaching an element by a computed index stays `get`; one that works the element out is
  not one.
