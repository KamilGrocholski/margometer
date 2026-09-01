# 0040. The standard library is asked before a function is written

- **Status:** Accepted
- **Date:** 2026-09-01

## Context

**ADR 0001** ended v1's zero-dependency rule and said the standard library "is used freely,
including in `src/`". Permission is not a habit, and nothing said to look there **first**. Measured
on 2026-09-01 over the tree at `cd0b574`:

- Fifty files under `libs/`, `project/`, `src/` and `tools/` import `@std/assert`, and every one of
  them imports `assert` and nothing else. `assertEquals`, `assertThrows` and `AssertionError` are
  spelled in `tests/` alone. The module re-exports twenty-seven files; four names are used.
- `existsAsFile` stands byte-identical in `tests/repository/cited-paths.test.ts` and
  `tests/repository/documents.test.ts` —
  `try { return Deno.statSync(path).isFile } catch
  { return false }`, which is `@std/fs`
  `existsSync(path, { isFile: true })`. It also breaks **C9**, which puts a shared module at the
  second consumer.

The audit that found those looked at every `@std/*` package against every hand-written utility here,
and the shipped half came back nearly empty. That is ADR 0001 working: `libs/getValueWithin` is a
clamp the library does not have, `libs/number-text.ts` and `libs/text-walk.ts` are strict digit
walkers with no equivalent that does not want a regular expression (**C7**, **ADR 0006**),
`libs/json-text.ts` is **ADR 0021**'s answer shape rather than `@std/json`'s streaming parser, and
`libs/unknown-reading.ts` is validation the library deliberately omits. What was left was six
duplicates, all of them in `tools/` and `tests/`.

The assertion half was the opposite: around two and a half thousand call sites, all of them
`assert`. Whether a more specific function is better is not a matter of taste, and reading
`@std/assert` 1.0.19 — the version `deno.lock` pins — settles it. Two spellings run through that
module, and they behave in opposite directions when a message is passed:

| Function                | Our message  | Also reports    | Narrows           |
| ----------------------- | ------------ | --------------- | ----------------- |
| `assertExists`          | **appended** | the value       | `NonNullable<T>`  |
| `assertEquals`          | **appended** | a diff          | no                |
| `assertStrictEquals`    | **appended** | a diff          | `T`               |
| `assertNotEquals`       | **appended** | both values     | no                |
| `assertNotStrictEquals` | **appended** | both values     | no                |
| `assertInstanceOf`      | **appended** | the two types   | `InstanceType<T>` |
| `assertStringIncludes`  | **appended** | what is missing | no                |
| `assertArrayIncludes`   | **appended** | what is missing | no                |
| `assertGreater`         | **replaces** | nothing         | no                |
| `assertGreaterOrEqual`  | **replaces** | nothing         | no                |
| `assertLess`            | **replaces** | nothing         | no                |
| `assertLessOrEqual`     | **replaces** | nothing         | no                |
| `assertFalse`           | **replaces** | nothing         | `Falsy`           |

The first group builds `Expected actual: … ${msg}` and throws that. The second is `msg ?? \`Expect
${actual} > ${expected}\``, so the moment a message names the invariant — which **A4** requires —
the values it was going to report are gone. The comparison family is therefore a straight loss here:
it trades the invariant's name for nothing, and what it offers instead is two numbers with no
sentence saying which rule they broke.

Read 2026-09-01 at `greater.ts:29`, `greater_or_equal.ts:34`, `less.ts:28`, `less_or_equal.ts:34`,
`false.ts:23`, `exists.ts:26`, `equals.ts:54`, `strict_equals.ts:41`, `not_equals.ts:39`,
`instance_of.ts:34`, `string_includes.ts:27` and `array_includes.ts:71`.

## Decision

**Before a function is written here, the standard library is asked whether it already has one.**
Where it does, it is imported. Where its edge case differs from the one needed, the local function
stays and **the difference is named where the code stands** — which is what makes the next reader
able to tell a decision from an oversight.

For assertions the same question has a measured answer, and **A9** states it: where a `@std/assert`
function reports what `assert` cannot — the value, the diff, the narrowed type — that function is
used; where it discards the message naming the invariant, `assert` is. The table above is the list.

**Where a failure is read decides which assertion stands there.** In `tools/` and `tests/` it is
read by whoever ran it, so the specific function earns its place. Inside the bundle it does not:
**ADR 0002** turns a broken invariant into a missing section at **E5**'s boundary, the player reads
none of the message, and the maintainer who wants the value can read it in a test over the same
material. So `src/` and the `libs/` modules it reaches keep the plain `assert` — **A10** — and this
is a rule about the reader rather than about the byte, though the byte is what made it visible.

**`===` takes `assertStrictEquals` and `!==` takes `assertNotStrictEquals`, never the deep pair.**
`assertEquals` compares deeply, and a copy is deeply equal to what it was copied from:
`assert(copied !== value, "a snapshot holds a copy")` in `src/game/engine-warrior.ts` becomes an
assertion that fires on every capture. The failure is worse in the other direction — an identity
comparison rewritten deep **passes** where it should fail, and nothing says so. The strict pair
matches `===` on every value a program here holds, and carries an `asserts` clause besides.

## Consequences

- **A new package is still a dependency.** It goes in `deno.json` `imports` and in `deno.lock`, and
  `AGENTS.md`'s "Ask first" still governs. What this decision removes is the habit of not looking,
  not the conversation about carrying something.
- **A package that reaches `src/` reaches two more documents.** `NOTICE.md` names what the bundle
  carries, and the browser floor is measured over `dist/margometer.user.js` rather than over the
  sources — **ADR 0001**, `docs/browser-support.md`. A package that stays in `tools/` or `tests/`
  touches neither, which is where all six of this round's adoptions sit.
- **The bundle is what drew the line, and the figure is why.** `dist/margometer.user.js` measured
  305,259 bytes at `a68a4e9`. Converting everywhere took it to 324,695; converting only what runs in
  a terminal leaves it at 306,518. **The conversion inside the bundle cost 18,177 bytes, 6%**,
  against 1,259 for the assertions this round rewrote to say something. There is no size guard here
  and this does not propose one — the number is the evidence for **A10**, not a budget.
- **`assertExists` removes work **C12** used to force.** It narrows to `NonNullable<T>`, so a
  reading proved present no longer needs `?.` behind it, and `src/` and `tools/` keep their ban on
  `!` without paying for it.
- **The counter had to move first.** S5 is measured by name, and no other name in `@std/assert`
  holds `assert(` inside it, so every converted assertion would have counted as none.
  `tests/repository/sources.test.ts` carries the widened list and a control that reads both ways.
- **Two-thirds of the assertions here do not move, and that is the finding, not the leftover.**
  Every `>`, `>=`, `<` and `<=`, every `Number.isFinite`, every `typeof`, every free predicate and
  every negated `includes` keeps `assert` and the sentence naming what must hold.

## Alternatives

**Leave it a habit, recorded in a commit message.** Rejected on evidence: ADR 0001 gave the
permission a year of tree to act in, and fifty files still import one name. Nothing reads a habit.

**Teach S5's counter any identifier beginning with `assert`.** Rejected. `src/ui/panel-reading.ts`
holds `assertPinnedTotalsTheFight` and `assertWholeIsTheSide`, each grouping several assertions
behind one name; counting either as one would raise the measured density while the code lost
assertions, and nothing would have said so.

**Convert the comparison family too, for consistency.** Rejected on the measurement above. It reads
tidier and says less: `assertGreater(rows.length, 0)` reports the two numbers, and
`assertGreater(rows.length, 0, "a list drawn has rows")` reports neither them nor anything else.

**`@std/expect` in place of `@std/assert`.** Rejected. **A6** chose the module, and a second
assertion vocabulary in the same tree is the duplication this decision exists to remove.

**`@std/path` `join` for the paths built with `${directory}/${name}`.** Rejected: every path here is
POSIX, repository-relative and compared literally in a guard. `join` would bring separator choice
and normalisation to a place with no separator question, and change what those comparisons mean.

**`@std/collections` in `src/`.** Rejected per site rather than in principle. `getLargestFigure`
answers `0` on an empty list where `maxOf` answers `undefined`; the sorts route through
`src/ui/ranked-order.ts`, a two-key comparator `sortBy` cannot express; the tallies are on `Map`,
which `aggregateGroups` does not take; and `distinct` is `[...new Set(array)]` spelled longer. Each
would add bundle to a browser for a line.

**`@std/semver`, `@std/fmt/printf`, `@std/media-types`, `@std/encoding`.** Rejected as no duplicate:
`tools/declared-version.ts` compares versions for equality and never orders them; the fixed-width
columns are named constants rather than a format string; `tools/preview-server.ts` has four fixed
routes and no extension lookup; and `src/ui/panel-look.ts` reads a colour that may be `rgb(…)` and
must answer `null`, where `decodeHex` takes bare hex and throws.
