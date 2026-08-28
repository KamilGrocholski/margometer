# Security policy

This is not only a disclosure policy. Most of it is engineering boundaries that bind every change,
because MargoMeter runs inside somebody else's page, on somebody else's account, over somebody
else's protocol.

## Supported versions

Fixes target the current release on `main` and the next one from `develop`. Older userscript
versions are not patched in place; a reader on an old version updates.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting on this repository. **Do not open a public issue for a
security problem**, and do not include a working exploit in the first report — describe the class of
problem and how to reach it.

A useful report says what an attacker controls, what they reach, and on which browser and game world
it was observed. Fixes are prepared privately and published with the advisory once a patched release
exists.

## The reading boundary

The add-on **reads**. This is the whole security model, and everything else is a consequence.

- **Nothing leaves the browser.** No `fetch`, no `XMLHttpRequest`, no `WebSocket`, no `sendBeacon`,
  no image or stylesheet request of ours, no redirect. A change adding an outbound call is not a
  feature to be reviewed; it is out of scope for this project.
- **Nothing is automated.** The add-on never sends an action, never chooses a target, never presses
  anything on the reader's behalf.
- **The engine's own call runs first and its return value comes back untouched.** We wrap the update
  function; we do not replace it. One wrap, and a detach that removes only ours.
- **No exception of ours escapes into the page.** Every call crossing into somebody else's program,
  or arriving from one, is wrapped — four such boundaries exist and they are listed (`AGENTS.md`
  **E4**, **E5**). A bug of ours degrades to a missing panel section.
- **Where another MargoMeter already holds the engine, we stand down** rather than wrap a second
  time.

## Being a guest on the page

- The panel lives in a Shadow DOM with `all: initial` on the host, cut off from the game's
  stylesheet.
- **Every name a reader meets before the panel's contents carries the `MargoMeter-` prefix** — the
  host element, the anchor a download rides on, the title bar, the body, the tooltip, and **every
  CSS custom property**. Custom properties get no protection from the shadow root: `all: initial`
  does not reset them, so one the game declares on `:root` inherits straight through the host.
- Names _inside_ the panel are exempt on purpose — they sit behind the shadow root where the game's
  CSS cannot reach them.
- The panel is handed its document; it never reaches for one. That is what keeps the surface we ask
  of a browser declared rather than assumed.

## Data the reader's browser holds

- The origin belongs to the game, not to us. **No quota is ever assumed**, and a refusal to store is
  an answer the panel handles, not an error it throws. `localStorage` can throw for merely being
  _read_ where the browser forbids it, which is one of the places a broad catch is correct.
- State that survives a reload is **validated on read**. Anything unrecognised is dropped, never
  trusted into a figure.
- Nothing is written that the reader did not produce by playing. No identifiers of ours, no
  fingerprint, no counter.
- A kept fight stores the **inputs** and never the computed numbers, so a reading is always
  re-derived by the current code rather than restored from an older version's arithmetic.

## Captured material

`captures/` is raw protocol from real fights, and real fights have real people in them.

- **Player nicknames never enter this repository.** They are substituted by tooling before a
  recording is admitted, never by hand.
- Ability descriptions are stripped for the same reason the rest of the game's prose stays out: it
  is somebody else's work.
- A recording the intake tool cannot redact is **refused**, not admitted with a warning.
- Never edit captured material to make anything pass (`captures/AGENTS.md`).

## The game's own sources

- Fetched client bundles live only in `.cache/`, outside git, by copyright requirement.
- Functional names — keys, identifiers, field names — may leave that cache. **Displayed sentences
  may not.**
- Fetch with the tooling, never with a pasted command, so provenance and build id are recorded with
  the file.

## Third-party code in the shipped file

The bundle carries Deno standard-library modules alongside our own code. Two obligations follow:

- `NOTICE.md` names what is bundled and under what licence.
- The **browser floor is checked over the built bundle**, not over our sources, because the ES level
  of code we did not write is not ours to set. A construct above the floor is an early SyntaxError:
  the bundle never loads, so the reader sees no panel and no console line of ours.

## Verification

- `deno lint`, `deno check` and the tests are the mechanical enforcement, and a warning fails the
  gate.
- **Never turn off a compiler flag, a lint rule or a guard to make something pass.** That is
  `[ASK]`, and the answer is usually that the code is wrong.
- A rule about this file's subject matter is held by a guard wherever a machine can hold it — the
  outbound-call ban and the name prefixes both are, over what is actually in the tree rather than
  over the nodes we remember adding.
