# 0049. An attempt is as pure as the call it is handed

- **Status:** Accepted
- **Date:** 2026-10-09

## Context

ADR 0018 gave every verb of N2 a purity, and `attempt` took **none**: it is where a broad catch
stands (**E4**), and a catch was read as reaching outside. `tests/repository/purity.test.ts` holds
P1 by following a call to the name it is made through, and every module here imports
`libs/errors.ts` whole, as `errors`, so `errors.attempt(...)` is a member call the guard never
followed. Audit 8fdfe95 taught the guard to follow a module imported whole, and on 2026-10-09 it
then flagged eight calls of `attempt` from a strong or weak function:

- `parseJson` and `encodeJson` in `libs/json-text.ts`, which catch what `JSON.parse` and
  `JSON.stringify` throw;
- `parseDeclaredVersion` in `tools/build-userscript.ts` and `isSameBesideVersion` in
  `tools/panel-shots.ts` (twice), which catch what `parseJsonc` throws;
- `addGuardedListener` in `src/ui/panel-listener.ts` and `addViewFailureGuarded` in
  `src/ui/view-failure.ts`, which guard a callback at its handover (**E10**);
- `isTreeComplete` in `tools/develop-reports.ts`, which stats a file.

Seven of the eight touch nothing a strong or weak function may not: what `attempt` adds to a call is
a `try`, which reaches nothing. The eighth reached the file system, under a predicate's name.

## Decision

Decided with the maintainer on 2026-10-08.

**`attempt` is _either_, as `read` is: it has the purity of the call it is handed.** P1 lets a
strong or weak function call it, and N2's table says so.

**The guard follows a call through a module imported whole.** `errors.attempt` is read as `attempt`
in `libs/errors.ts`, and a name of none reached that way is flagged as one reached directly.

**A function that reaches outside under a strong verb takes the verb that says so.**
`isTreeComplete` is `readTreeComplete`.

Rejected: **`attempt` stays _none_, and the seven callers take verbs of none.** `parseJson` would
have to stop being a `parse`, and every strong function calling it would fall to none with it,
though nothing in that chain reaches outside.

Rejected: **the guard looks inside the closure an attempt is handed.** A closure is often built
elsewhere and handed in as a value, and the guard reads calls by name; following one closure would
be a second reading of P1 with a different edge.

## Consequences

- What an `attempt` is handed is held by reading: a strong function can hand it a call of none, and
  no guard sees it.
- A module imported whole is no longer a way past P1.
