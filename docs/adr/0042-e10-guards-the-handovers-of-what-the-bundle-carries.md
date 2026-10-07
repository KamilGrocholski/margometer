# 0042. E10 guards the handovers of what the bundle carries

- **Status:** Accepted
- **Date:** 2026-10-07

## Context

**E10** asked for every callback handed to an API this project did not author to be guarded at the
handover, and named no scope. `tests/repository/handed-callbacks.test.ts`, its guard, reads the
bundle's files alone. The audit of `d78c4a0` found the page `tools/` composes for the preview and
the published site guarding two of its callbacks under a comment citing **E10**
(`tools/preview-site.ts`) and none of the others: the buttons, the play timer and the picker in
`tools/preview-page.ts`, the presses and the wait in `tools/preview-state.ts`.

What **E10** answers is `develop ADR 0043`'s hazard: inside the game's page, a throw out of our
callback unwinds into the game's own dispatch, which drops it, so the gesture does nothing and no
mark reaches anybody. On a page this project writes whole, nothing of anybody else's stands between
the callback and the browser, which reports an uncaught throw on its console.

## Decision

Decided with the maintainer on 2026-10-07, who asked for the proposal to be taken.

**E10 binds what the bundle carries: `src/`, and the `libs/` modules it reaches.** That is the scope
**S13** and **E12** name, and what its guard already reads. A page `tools/` writes is not handed to
anybody else's dispatch, and a throw there is said by the browser.

Rejected: guarding every callback of the preview page. Eleven handovers written inside strings no
guard reads, for a hazard the page does not have, and a comment-held rule nothing would check.

## Consequences

**E10** names its scope in `AGENTS.md`. The preview site's two guards stay, said for what they do: a
throw while placing the tips is one warning line rather than an uncaught error on a published page.
