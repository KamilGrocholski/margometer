# 0047. A development build installs beside the release under a name of its own

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

A build off `develop` reached a script manager one way: `deno task build`, then
`dist/margometer.user.js` dragged into it by hand. That file carried the release's banner, the same
`@name MargoMeter`, the same `@namespace`, and `@updateURL` at
`releases/latest/download/margometer.meta.js`. A manager keys an installed script by its name and
namespace, so the copy replaced the release a player installs. It is also offered an update only
where the polled `@version` is higher, and develop ADR 0035 made `X-dev` sort below `X`. The next
update check therefore put the release back over it.

## Decision

Decided with the maintainer on 2026-10-08.

**The preview server's build is the development edition: `@name MargoMeter Dev`, under the release's
namespace, fetched and polled at the server itself.** `deno task preview` serves it at
`/margometer-dev.user.js` and its banner at `/margometer-dev.meta.js`. Opening the first in a
browser with a manager installs it beside the release. The page the server draws runs the same
build.

**Its version is the declaration, `-dev`, and the minute it was built in UTC as one number:
`0.22.1-dev.202610081432`.** The minute is read once per build, so a manager polling between two
rebuilds is offered nothing and one polling after an edit is offered the edit. It is one numeric
identifier because a separate `.HHMM` begins with a nought before ten o'clock, which semantic
versioning refuses.

**Only the preview server dates its build.** `deno task build`, `preview:site`, `panel:shots` and
the fabricated fights keep `X-dev` and the release's edition, so `dist/` and every release are what
they were.

Rejected: **a rolling `dev` prerelease on GitHub**, its assets overwritten by a workflow on every
push to `develop`. It would install on any machine, but it would refresh only on a push, and the
maintainer pushes rarely. It would also publish every unreleased build.

Rejected: **a development page on GitHub Pages.** The `github-pages` environment deploys from `main`
alone (`docs/releasing.md`), and a deploy replaces the whole site, so one artifact would have to be
built from two branches.

Rejected: **the date in `@name`.** Every day would be another script in the manager, each kept until
removed by hand.

Rejected: **the date alone, without the minute.** A second build on the same day would not be
offered.

Rejected: **the minute in every `-dev` build.** A photograph is filed under the version its panel
states, and develop ADR 0035 refused a version that moves with the moment for that reason.

## Consequences

- An installed development copy polls the port it was installed from. One installed from `--port N`
  is updated only while a server listens there.
- With both editions switched on, the one that runs second finds the engine wrapped and stands down
  (`MargonemEngineAlreadyWrapped`). The panel's title bar states which version is running.
- A fight saved by the development copy names its minute in the file name, which
  `tools/capture-intake.ts` accepts as a version.
- `tools/panel-giving-way.ts` hands the server its own build, which keeps the release's edition. It
  prints no install address, and nothing it serves is meant to be installed.
