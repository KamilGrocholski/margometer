# 0021. A read says whether it worked, and the value sits behind it

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

**E9** says a read never throws: it returns `null`, and the caller picks assert, error or unknown.
That works for every reading in this tree except one, because for JSON the substitute is a value the
read can carry. `libs/unknown-reading.ts` answered `null` for five different facts:

| Call                            | Answered | Meant                                     |
| ------------------------------- | -------- | ----------------------------------------- |
| `getValueFromJsonText("null")`  | `null`   | the text carried `null`                   |
| `getValueFromJsonText("{oops")` | `null`   | the text would not parse                  |
| `composeJsonText(undefined)`    | `null`   | the value has no JSON text of its own     |
| `composeJsonText(cycle)`        | `null`   | the writer threw                          |
| `composeJsonText` → `""`        | `null`   | `getTextFromUnknown` folded empty text in |

Three consequences were already in the tree on 2026-08-30:

- `tools/game-client-source.ts`, `tools/help-article.ts` and `tools/capture-intake.ts` each tested
  the answer against `null` and reported **"unreadable"**. A cache manifest holding the text `null`
  parses, and was reported as corrupt.
- `src/game/fight-capture.ts` carried a workaround — `composeJsonText(value ?? null)` — with a
  comment saying the writer refuses `undefined`, because the caller could not tell that refusal from
  a writer that threw.
- The writer routed its result through `getTextFromUnknown`, so a write-failure check was being made
  by an emptiness check.

**E10** already forbids this shape one level down: never substitute `0` for a failed read, because
zero is a measurement. Here `null` is the measurement.

## Decision

`libs/json-text.ts` holds JSON both ways, and each direction answers whether it worked:

```ts
export type JsonReading =
    | { isOk: true; value: unknown }
    | { isOk: false; error: "unreadable"; cause: unknown };

export type JsonWriting =
    | { isOk: true; text: string }
    | { isOk: false; error: "nothing" | "unwritable"; cause: unknown };
```

`isOk`, not `ok`: **N8** gives a boolean a prefix. `error` is a string union and not a class,
because **ADR 0020** forbids `libs/` importing a layer and both error bases live in one. `cause`
carries what was thrown, which is **E6**'s word for it, and it is what **E11** asks for: the `catch`
used to discard a `SyntaxError` naming the position the text stopped making sense at.

`nothing` and `unwritable` stay apart because they are different failures. `JSON.stringify` answers
`undefined` for a value with no JSON text — `undefined` itself, a function, a symbol — without
throwing at all, and that is not a cycle.

## Consequences

- **E10 gained the sentence that covers a read whose substitute is a value it could carry**, and
  E9's `null` stands everywhere else. The two rules are one rule at different depths.
- **A malformed manifest now says where it broke.** The five tool sites that read JSON pass `cause`
  into their branded error, and four error subclasses were widened to accept `ErrorOptions` to take
  it — `PreviewBuildError`, `CaptureIntakeError`, `PanelShotError`, `ProtocolKeyTableError`.
  `GameSourceError` and `HelpArticleError` already had it.
- **A manifest holding `null` is now refused by the reader that knows what it wanted**, with "is not
  an object", rather than by a `=== null` test claiming the file was corrupt.
- **The construct register was wrong about its own subject, and measuring it is what found that.**
  It claimed every `JSON.stringify` outside the owner writes for somebody else. One of them — the
  sidecar naming a set of pictures, which this repository reads back — was ours, and moved to the
  owner.
- **About thirty call sites moved**, across `src/`, `tools/` and `tests/`, and none of them gained a
  helper: a test narrows with `assert(reading.isOk, …)`, which `@std/assert` already does through
  its `asserts` signature. **C9** is why there is no test helper module.
- **`getTextFromUnknown("")` still folds empty text into "not text".** Same class of conflation,
  left standing: `src/game/engine-warrior.ts` and `src/userscript-entry.ts` read the fold as it is
  today, so removing it is a behaviour change and not a shape change. It is a known gap, not a
  decision this record makes.

## Alternatives

**A tuple, `[value, error]`.** Shortest at the call site with destructuring. Rejected on **N11**: a
type names the thing, not its shape, and nothing else in this tree is read positionally.

**A generic `Result<T, E>`.** The general answer, and the one to reach for if a second subject needs
it. Rejected now on **C9** — nothing exists before its second consumer, and JSON is the first.

**A `code` field rather than `error`.** Rejected on **E3**, which owns that word: a `code` exists so
a brand is greppable, and _nothing branches on it at run time_. A caller does branch on this one, so
the same word would carry two meanings — **N9**.

**Assert instead of answering.** Rejected on **A8**: `assert` is for what must never happen, and a
file on disk that will not parse is a failure we know can occur. That makes it data.

**Keep one module and change only the answers.** Rejected on **C10**: JSON text ⇄ value is a second
subject beside narrowing an unknown value, and it has twenty consumers of its own. The same cut
**ADR 0020** made on `protocol-number.ts`.
