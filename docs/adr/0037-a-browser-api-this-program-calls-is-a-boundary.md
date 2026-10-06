# 0037. A browser API this program calls is a boundary, and so is a tool's file system

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

E5 listed six boundaries in the add-on, and `docs/design.md` §10.6 said where each stands. Counted
on `db87b25`, 2026-10-06, 18 calls of `errors.attempt` in `src/ports/browser-console.ts`,
`browser-surroundings.ts`, `browser-time.ts` and `browser-file.ts` stood at none of them:

- a line written to the console;
- the page's address and the browser's name read off `location` and `navigator`;
- a date built and read for a moment, and for a timestamp;
- a frame and an interval asked for and cancelled, and the step each calls back;
- an object URL, an anchor and its click, a timeout and the URL's release, for a file.

Each holds a call into the browser, which this project did not write and which may throw, so each is
the broad catch E4 means. None is the game's page state, the storage, a render region or the wrapped
call. The steps the browser calls back (the frame's, the interval's, the timeout's) are "a callback
somebody else calls", though §10.6 named only a DOM listener and `onFrame`.

In `tools/`, E5 named the network and a subprocess. Of the 13 `attempt` calls there on the same
commit, 11 hold a read or a write of the file system (`Deno.readTextFileSync`, `statSync`,
`readDirSync`, `mkdirSync` with `writeTextFileSync`), and each turns `NotFound` into an answer or
rethrows a named error.

The audit of `0c55ae7` (2026-10-04) set these out, and a new boundary is `[ASK]`.

## Decision

Decided with the maintainer on 2026-10-06.

**The add-on has a seventh boundary: a browser API this program calls.** It is outbound. A failure
there becomes what the calling step makes of it: a reading marked unknown (a moment, the world, the
browser's name), a failure returned to the step (a frame, an interval, a file), or nothing where the
call was itself the mark (a console line). The steps the browser calls back stay "a callback
somebody else calls", and §10.6 now names the interval's step and a timeout's beside the frame's.

**A tool's boundaries are the network, a subprocess and the file system.** A file missing is an
answer a tool expects, and a tool states it rather than letting `Deno` throw it.

Rejected: filing each call under the nearest of the six by its fate. The world and the browser's
name would have gone under "the game's own page state", which names the game's and these are not; a
console line and a frame asked for match no row at all.

Rejected: moving these calls out of `attempt`. Each is into code this project did not write, and E10
and E12 want it guarded where it is made.

## Consequences

- E5 lists seven boundaries, and its sentence on `tools/` names the file system.
- §10.6 says where the seventh stands, port by port.
- `tests/repository/broad-catches.test.ts` is unchanged: it holds that `attempt` is the only broad
  catch, not where `attempt` is called. Tying a call to its boundary stays by reading.
