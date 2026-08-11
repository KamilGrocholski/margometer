---
name: verify
description: Run the built userscript against a captured fight in a real browser and capture what the panel draws. Use when verifying a change to src/ at its actual surface rather than through tests.
---

# Verifying MargoMeter by running it

The add-on's surface is a browser page. `bun test` is not that surface, and two
comments in `src/userscript-entry.ts` say so out loud — the download path and
`shouldStartHere` were both wrong in ways every test passed through. What
follows is the recipe that worked; it needs no dependency the repository does
not already have.

## The handle

Firefox is at `/usr/bin/firefox` and takes a screenshot without Playwright:

```bash
MOZ_HEADLESS=1 timeout 120 firefox --profile "$PROFILE" --no-remote \
  --window-size 1280,900 --screenshot "$OUT.png" "file://$PAGE"
```

- `--profile "$(mktemp -d)"` always. A shared profile is shared state, and the
  download prefs below have to go somewhere.
- It waits for `load`, so anything the page does synchronously is in the frame.
- There is no console and no second interaction. **Write what you observed into
  a `<pre>` on the page** — row texts read back out of the shadow root, the
  stored position, what the console saw. The screenshot then carries its own
  evidence.

## The page

Order matters: the game, then the bundle, then the driver.

1. `window.Engine = { battle: { w: {}, warriorsList: {}, myteam: null, updateData(payload) {…} } }`.
   The original folds `payload.w` into **both** `w` and `warriorsList` and
   returns a sentinel. ⚠️ Both names are needed: `src/game/engine-roster.ts`
   reads `w`, `src/game/fight-capture.ts` reads `warriorsList` — with only `w`
   every `wojownicyPrzed`/`wojownicyPo` in a saved recording comes out empty and
   nothing says why.
2. `<script src="./main.min1785244275300.js">` — a 404 is fine, only the `src`
   attribute is read, and without it the build is `null` in any recording saved.
3. `<script src=…>` the built `dist/margometer.user.js`, unmodified.
4. The capture, embedded as `<script type="application/json">` with `</` escaped
   — `file://` cannot fetch it, and a local server is more moving parts than
   this needs. Replay `wpisy[i].ladunek` through `Engine.battle.updateData`;
   100 of 102 entries carry `ladunek.m`, so the payload alone reproduces what
   the live wrap reads.

Find the panel with `[...document.body.querySelectorAll("*")].find(e => e.shadowRoot)`
— the shadow root is `mode: "open"`. Useful selectors: `.titlebar`,
`.titlebar-save`, `.tab`, `.section`, `.row-name`, `.row-value`, `.mark`
(its `title` is the detail).

## Gotchas paid for

- **A synthetic `PointerEvent` aborts the drag.** `setPointerCapture` throws
  `InvalidPointerId` for a pointerId no real pointer owns, and
  `panel-element.ts` calls it *before* the grab is recorded, so the guarded
  handler swallows the whole drag. Stub `bar.setPointerCapture` /
  `releasePointerCapture` on the title bar before dispatching, and say so in the
  report. A real pointer does not hit this.
- **`file://` gives each file its own origin.** Two different harness pages do
  not share `localStorage`, so "the position survived a reload" has to be one
  page loaded twice, deciding its phase from what is already in storage.
- **Downloads work under `--screenshot`** — the file lands before Firefox
  exits. Prefs in `$PROFILE/user.js`:
  `browser.download.folderList=2`, `browser.download.dir`,
  `browser.download.useDownloadDir=true`,
  `browser.helperApps.neverAsk.saveToDisk="application/json"`.
- **`swiat` comes out `""` on `file://`** because there is no hostname and
  `getWorld` only guards against absent, not empty.

## Flows worth driving

Replay a fight · click each tab and check the numbers against
`bun tools/fight-report.ts` (they agree exactly — two independent paths over
one capture) · drag, reload, and reload again with a corrupt stored position ·
click save and parse the file back with `tools/fight-dump-parser.ts` · save
before any fight · feed malformed payloads and check the mark names the key ·
make the game's own `updateData` throw · load with no `Engine` at all.

## Reading a saved recording back

`tools/fight-dump-parser.ts` imports `@/…`, so a script outside the repo needs a
`tsconfig.json` beside it mapping `"@/*"` to the repository root.
