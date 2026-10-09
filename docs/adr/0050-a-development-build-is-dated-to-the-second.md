# 0050. A development build is dated to the second

- **Status:** Accepted
- **Date:** 2026-10-09

## Context

ADR 0047 dates the preview server's build to the minute it was built, `0.22.1-dev.202610081432`, so
that a script manager polling after an edit is offered it. The server rebuilds on every saved change
while it watches, and a manager installs a build only where the polled `@version` is higher than the
one it holds. Two edits saved within one minute build two copies with one version, and a manager
that took the first is never offered the second. Audit 8fdfe95 found this on 2026-10-08, against the
record's own claim that a manager polling after an edit is offered the edit.

## Decision

**The version carries the second the build was made, in UTC, as one number:
`0.22.1-dev.20261008143205`.** It is still one numeric identifier and still read once per build, so
everything else ADR 0047 decided stands: the name, the namespace, the server as the place it is
polled, and the release untouched.

Rejected: **a counter of builds since the server started.** It restarts at one with every server, so
a manager holding a build from an earlier run would be offered nothing until the count passed it.

Rejected: **milliseconds.** Seventeen digits run past the largest integer a JavaScript number holds
exactly, which has sixteen, so a manager comparing the parts of a version as numbers would round two
builds into one.

## Consequences

- A fight saved by the development copy names its second in the file name, which
  `tools/capture-intake.ts` accepts as a version as it accepted the minute.
- ADR 0047's minute is replaced by this record and nothing else of it.
