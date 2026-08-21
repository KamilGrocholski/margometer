# A panel you can watch change

Status: implemented

## What was wrong

`bun run check` cannot see a panel. The gate typechecks, runs the suite and
builds the bundle, and every one of those can be green while the thing a player
actually looks at is broken — which has happened twice and is written into
`src/userscript-entry.ts` as comments, for the download path and for
`shouldStartHere`.

What stood in for the missing surface was `.claude/skills/verify/SKILL.md`: a
recipe telling whoever read it to hand-write an HTML page, stub `Engine`, embed a
capture with `</` escaped, and point headless Firefox at `file://`. It was
detailed and it was correct. **Nobody ever ran it** — two audits record that
(`docs/audits/2026-08-13-the-whole-tree-read-once.md`,
`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`), and by the time
anybody looked it had drifted: three of the six selectors it named no longer
existed, and one of its gotchas had been fixed in the tree.

That is §7.5's shape exactly — a lesson written down, with a producer and no
consumer. The fix is not to correct the recipe again. It is to make the recipe a
thing that runs.

There is a second cost, and it is the one that decided the shape. Three of the
four open items in the maintainer's list are about states nobody can currently
look at: the panel before any data has arrived, every combatant at the start of a
fight, the tip near a window edge. A harness that replays a whole fight and stops
answers none of them.

## What was decided

**A preview server, with the replay stepped.**

`bun run preview` serves the built userscript over a captured fight at
`http://localhost:4173`, watches `src/`, `libs/` and `package.json`, and reloads
the page on a rebuild — at the entry the reader was on, so an edit to `src/ui/`
redraws the screen they were already looking at.

Four decisions worth keeping.

### The bundle is composed in memory, and it is the same bundle

`build.ts` kept its bundling private and only ever wrote to `dist/`. The server is
its second consumer, so `composeUserscriptFiles()` moved out of the writer per
§7.1. What must not be spelled twice is `format: "iife"`, `minify: false` and the
version substituted from `package.json` — a preview built on different settings is
a preview of something nobody installs.

⚠️ Doing this surfaced a bug that had been there all along: **`Bun.build` rejects
with an `AggregateError` rather than returning `success: false`**, so `build.ts`'s
own check was dead for the failure it was written for, and a build error came out
under somebody else's error class. Measured by appending a syntax error to
`src/ui/panel-words.ts`. `throw: false` is what makes the check real, and it
is what lets the server catch `BundleError` narrowly (§9.5).

### A failed rebuild does not reload

It pushes the build log, the strip turns red, and the last good panel stays on
screen. Blanking what somebody was looking at because they saved mid-keystroke is
§9.6's rule in the tooling's own voice — and a silent failure would be worse,
because a stale panel and a fresh one look identical.

### Backward is a replay, not a reload

`src/game/battle-session.ts` accumulates and has no rewind. But it *resets* on a
payload carrying `init`, and every recording in `tests/captured-fights/` carries
`init` exactly once and on its first payload — measured, and re-measured per
capture on every run by `tests/tools/preview-page.test.ts`, because a recording
arriving without it would send the button somewhere nobody asked for and no figure
on screen would look wrong.

So stepping back re-feeds the fight from zero. It costs a replay, which is
instant, and it keeps the panel's own state — the screen the reader had chosen and
the row they had drilled into — which a reload throws away.

### The fight travels in the page

⚠️ **Firefox's `--screenshot` waits for `load` and nothing after it.** The first
version fetched the capture over HTTP and photographed itself empty with the strip
still saying `loading` — indistinguishable from a panel that failed to draw. The
payloads are therefore inlined and the replay is synchronous, which is what the
old recipe had been doing all along, for this reason, without saying so.

`</` is escaped on the way in, because an HTML parser ends a script block at that
text and knows nothing about the JavaScript string around it.

### Two things about `Bun.serve` that had to be measured

Both silently break the feature and neither is visible in the type:

1. **`idleTimeout` defaults to 10 seconds and kills an idle reload stream.** Hot
   reloading would work for ten seconds after the page opened and then stop, with
   nothing on screen saying why. `idleTimeout: 0`, plus a keep-alive.
2. **An open stream keeps `server.stop()` from resolving** — it waited out the
   timeout. `stop(true)`, or the test suite hangs rather than fails.

## Rejected alternatives

- **Correcting the recipe again.** The cheapest change and the one already tried:
  the document had been right when written and drifted anyway, because nothing
  reads it on a schedule. A guard cannot hold prose about a browser; a tool that
  gets run can.
- **A WebSocket instead of Server-Sent Events.** Reload is one direction and one
  message. SSE needs no handshake, no protocol and no library, and it reconnects
  on its own. The two `Bun.serve` findings above apply either way, so the socket
  would have bought nothing.
- **Watching `dist/` and letting `bun run build` drive it.** It would keep the
  server ignorant of bundling, but it churns `dist/` on every keystroke, races
  `bun run check`, and makes a failed build indistinguishable from a slow one.
- **`bun --watch tools/preview-server.ts` as the reload mechanism.** It restarts
  the process, which drops every open stream and throws away the last good
  bundle — losing precisely the failed-rebuild behaviour above. It stays the way
  to work *on the server*, and is documented as that.
- **Tearing down `globalThis.margometer` and re-injecting the script tag** instead
  of reloading on a rebuild. It would keep scroll and storage, but it leans on
  `hasOtherMargoMeter` internals to unstick itself, and a second execution that
  gets it wrong logs `already-running-here` and draws nothing — which reads as a
  broken build.
- **A `--screenshot` mode in the tool.** It would fold the whole recipe in, but it
  hard-wires `/usr/bin/firefox` and a profile's download prefs into `tools/`. The
  server prints a URL; driving a browser stays the skill's job.
- **Serving the capture's raw bytes at a route.** Dropped once the payloads were
  inlined, and it was wrong anyway: the file's field names are Polish and §9.2
  stops them at `tools/fight-dump-parser.ts`. `call.payload` is the raw engine
  argument carried through unparsed, which is what the page needs and what that
  field exists for.
- **A dev strip along the top of the page.** The panel is `position: fixed` in the
  top-right at `z-index: 9999`, so a top strip sits under it. Bottom-left, below
  that layer, is the one region neither the panel's corner nor its tooltip claims.
