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

The add-on **reads**, and writes one line of text where the game already draws one. That is the
whole security model, and everything else is a consequence.

- **Nothing leaves the browser.** No `fetch`, no `XMLHttpRequest`, no `WebSocket`, no `sendBeacon`,
  no image or stylesheet request of ours, no redirect. A change adding an outbound call is not a
  feature to be reviewed; it is out of scope for this project.

  ⚠️ **The last two are reached through an object, not through a name of their own**, and that is
  why they are held that way: a redirect goes through the ambient `location` and a beacon through
  the ambient `navigator`, while a tag that fetches is made by `createElement` with a tag name this
  add-on does not otherwise use. The page the entry is handed carries `location` and `navigator` of
  its own and reading those is how the add-on knows which world it is in — so what is forbidden is
  the **ambient** one, and a tag is held by its name against the four this add-on builds. **ADR
  0076**, which carries the measurement.
- **Nothing is automated.** The add-on never sends an action, never chooses a target, never presses
  anything on the reader's behalf.
- **The engine's own call runs first and its return value comes back untouched.** We wrap the update
  function; we do not replace it. One wrap, and a detach that removes only ours.
- **No exception of ours escapes into the page.** Every call crossing into somebody else's program,
  or arriving from one, is wrapped — every such boundary is enumerated, and **E5** is where the list
  lives (`AGENTS.md`). How many there are is that table's to say and drifted twice here. A bug of
  ours degrades to a missing panel section.
- **Where another MargoMeter already holds the engine, we stand down** rather than wrap a second
  time.
- **One thing is written out, and it is text.** The add-on appends rows of its own to the tooltip
  the game already shows for a fighter — one call to the client's own `concatTip` per row, which
  holds its tooltips as strings in a registry of its own and writes the break between them itself,
  so a block of rows still costs this add-on no markup. **No node is made, moved, removed or
  styled**, and nothing of ours stands on the page.
- **What is read back is our own block, and only to take it off.** The registry's string is read
  with the client's `getTipData` to find the block this add-on left there; a changed one comes off
  through the client's `tip`, handed that string less ours, and whatever else stands in it — the
  game's, another add-on's — stays where it stood. After the rows go on, the add-on triggers
  `tipupdate`, the event the client's own `tip` triggers, and the client's own code draws an open
  tooltip again. The game rewrites a fighter's entry whenever it updates them, so a detach leaves
  the last block only until then. It is the only thing this add-on puts outside itself,
  `src/game/engine-tooltip.ts` is the only file that does it, and **develop ADR 0105**, **develop
  ADR 0107** and **develop ADR 0111** carry what it cost to decide.

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
- A kept fight stores the **payloads the game delivered** and never a computed number, so a reading
  is always re-derived by the current code rather than restored from an older version's arithmetic.
  **develop ADR 0026.**
- A shelf that will not fit asks for less: the oldest fight nobody pinned goes and the same shelf is
  offered again, rather than a size chosen against a quota nothing here assumes.
- **The shelf therefore holds the game's own prose and real nicknames** for as long as it holds a
  fight. It is the reader's own fight in the reader's own browser, and it is already in the page —
  but it is written without the reader asking for a file, which is a decision and not a side effect.
  Nothing of it leaves the browser: `captures/` is the only thing that travels, and intake redacts
  it.

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
- The **browser floor is held over everything the bundle carries**, ours and theirs alike, because
  the ES level of code we did not write is not ours to set. What the floor is and what holds it is
  `docs/browser-support.md`'s. The obligation is this file's: a construct above it is an early
  SyntaxError, so the bundle never loads and the reader sees no panel and no console line of ours.

## Verification

- `deno lint`, `deno check` and the tests are the mechanical enforcement, and a warning fails the
  gate.
- **Never turn off a compiler flag, a lint rule or a guard to make something pass.** That is
  `[ASK]`, and the answer is usually that the code is wrong.
- A rule about this file's subject matter is held by a guard wherever a machine can hold it — the
  outbound-call ban and the name prefixes both are, over what is actually in the tree rather than
  over the nodes we remember adding.
