# 0008. A failure is an `Error` returned beside the value

- **Status:** Accepted
- **Date:** 2026-09-26

## Context

The design round of 2026-09-24 made a failure a record `{ kind }` carried in
`Result = { ok, value } | { ok, error }` (`git show 93cd78d:libs/result.ts`). At that revision it
stood at 78 `err(` calls, 19 `*_FAILURE` vocabularies of about 50 kinds, 68 calls to `callForeign`
or `runGuarded`, and 57 places branching on `.kind`. Every call site unwrapped a box to reach the
value. The `ok` discriminant needed its own exception to N8. A failure met below another was carried
by copying fields, because a record has no `cause`. The console printed a record without a stack.

## Decision

Decided with the maintainer on 2026-09-26.

**A function that can fail returns `Value | SomeFailure`, with no box.** A call site branches with
`if (value instanceof Error)`, or on the class it expects. `Result`, `Ok`, `Err`, `Fault`, `ok()`,
`err()` and every `*_FAILURE` vocabulary are gone.

**A failure is a class that extends `Error`, one class per reason.** Its `name` is a literal equal
to its class name. That literal keeps two classes with the same fields apart for the compiler, which
compares structure. It is also the key `FAILURE_FATES` is held complete by:
`{ readonly [Name in RuntimeFailure["name"]]: FailureFate }`. Its `message` stays empty (E3), and a
failure met below it is its `cause`.

**`libs/errors.ts` holds only what this tree calls, shaped like Go's `errors`:** `Caught`, `Known`
and `attempt`, imported as a namespace, so a call site reads `errors.attempt(…)`. `attempt` is the
one broad catch. It answers the value, or a `Caught` whose `cause` is whatever was thrown. It
replaces both `callForeign` and `runGuarded`, whose failures already met the same fate, `defect`. A
thrown value is always wrapped and never passed on as it is. A bare `TypeError` would carry
`name: string`, and one such member makes `RuntimeFailure["name"]` a `string` and the table's
completeness nothing.

**`unknown` cannot stand beside a failure.** `unknown | Caught` is `unknown`, and then nothing asks
the caller to check. So `attempt` answers `Known<Value>`, which is `never` where `Value` is
`unknown` or `any`. A call reading a value nobody typed narrows it inside the call. `parseJson`
answers `JsonValue`, which is the one level a caller branches on and a level no `Error` fits.

**The guards move with it.** `tests/repository/throws.test.ts` holds that every failure class of the
bundle names itself by a `name` no other class of it takes, and that outside the bundle nothing
extends `Error` but `tools/margometer-tool-error.ts`. `broad-catches.test.ts` and
`handed-callbacks.test.ts` read `attempt`.

## Consequences

Measured on 2026-09-26, Deno 2.9.7, on an AMD Ryzen 5 5500:

- **The userscript** (`dist/margometer.user.js`, `0.19.0-dev`) went from 430 277 to 430 028 bytes.
- **All 35 recordings of `captures/`, 1376 payloads, replayed through `replayFightPayloads`** took
  51.6 ms before and 51.1 ms after, which is within the spread of either run. The decoder leaves 0
  of their 13 862 messages unread, so no `UnreadMessage` is created on that material.
- ⚠️ **An unread message costs more.** The benchmark was 4096 messages from `captures/`, each with
  an unknown key appended so every one is unread, run through `decodePayloadMessages`. It took 12.1
  ms at `93cd78d` and 27.0 ms after, about 3.6 µs more per unread message. That is the stack an
  `Error` captures, paid in the game's own `updateData` (T3). S3 calls this a finding, and it stays
  open: `UnreadMessage` is still an `Error`.

`ErrorOptions` becomes a runtime dependency of the bundle, because it now passes a `cause`
(`docs/browser-support.md`).

## Rejected

- **`instanceof` against one base class of our own.** A value read from the page may itself be an
  `Error`. This was ruled out by `Known`, and by `attempt` wrapping whatever it catches, rather than
  by a second base.
- **A `fate` declared on each class.** It would put a policy that belongs to `src/runtime/` into
  `core/` and `game/`, against `docs/design.md` §4.
- **One class per family with a `reason` field.** That field is `kind` under another name.
- **Both mechanisms side by side while the tree moved over.** The `Result` module went out in the
  same change that brought `libs/errors.ts`.
