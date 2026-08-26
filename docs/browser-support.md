# Browser support

What the shipped userscript needs from a browser, measured off the tree rather
than assumed, and held to it by `tests/tools/browser-support.test.ts` and by
`tsconfig.userscript.json`.

The register exists because nothing else could notice. `build.ts` bundles with
`minify: false` and no `target`, so **the ES level of the source is the ES level
a player's browser must have** — there is no downlevelling anywhere and no
polyfill of anything. A round that reaches for a newer construct raises the bar
for every player, silently, and the gate goes green.

**Read at:** 2026-08-18. Every version below comes from MDN's
`browser-compat-data`, read that day at
`https://raw.githubusercontent.com/mdn/browser-compat-data/main/`. Versions are
the **first** release with support, taken from the earliest `version_added` in
each engine's history — not from the entry that completes a partial
implementation, which is a different and later number.

## The floor

| | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| **Runs correctly** | 93 | 91 | 16 |
| **Looks as designed** | 121 | 97 | 26.2 |

Two tiers because they answer different questions and one number would lose a
true fact either way. Between the rows the panel counts correctly, draws every
figure and every warning, and differs only in the scrollbar and one hatch — so
calling those browsers unsupported would be false, and calling them fully
supported would be too.

Every current desktop release clears both. The gap that lasted longest is
Safari's: `scrollbar-color` reached it in 26.2, and before that the panel's list
carries the platform scrollbar instead of the thin tinted one.

⚠️ **One property is spelled twice, once with a `-webkit-` prefix**, because
Safari answers it under no other name — see `### Prefixed` below.

## CSS

The stylesheet is one string, `composePanelStyleText()` in
`src/ui/panel-look.ts`, so what it spells is enumerable: every property,
every `property: value` pair, every function and every selector. The guard reads
that enumeration and requires each one to appear below, in the table or in the
settled list. A property added with no entry here fails the gate.

### What sets the floor

| Construct | Tier | Chrome / Edge | Firefox | Safari |
|---|---|---|---|---|
| `overscroll-behavior` | runs | 63 | 59 | 16 |
| `overscroll-behavior: contain` | runs | 63 | 59 | 16 |
| `mask-image` | looks | 120 | 53 | 15.4 |
| `scrollbar-gutter` | looks | 94 | 97 | 18.2 |
| `scrollbar-width` | looks | 121 | 64 | 18.2 |
| `scrollbar-color` | looks | 121 | 64 | 26.2 |

What each one looks like below its floor, which is the whole content of a
cosmetic floor and the reason the tier column is not enough on its own:

- **`overscroll-behavior: contain`** (`src/ui/panel-look.ts`, on `.list`).
  A wheel that runs out of the list turns into a scroll of the game underneath.
  That is the one degradation here that reaches outside the panel, which is why
  it is `runs` and not `looks`: we are a guest on someone else's page. The
  versions above are its first support; the engines mark that support partial,
  and the excluded case — a scroll container with no scrollable overflow — is
  not the panel's, whose list overflows whenever the rule matters.
- **`mask-image`** (on `.pinned .bar`). The unattributed row's bar loses its
  diagonal hatch and renders solid. Cosmetic rather than a §9.7 failure, and the
  distinction is worth stating: the hatch is a second channel on a row that is
  **already labelled in words**, so colour is not left carrying the meaning
  alone. Chrome's number is high because it is the **unprefixed** property;
  Chrome had `-webkit-mask-image` from 1 and Safari from 4, and the prefix is
  deliberately not spelled. That is where the line sits: below its floor this
  property degrades and the row still reads, so a prefix would buy back a
  hatch — while the one property that is prefixed buys back a defect.
- **`scrollbar-gutter: stable`** (on `.list`, `.pinned` and `.sides-region`). The
  gutter is no longer reserved, so rows shift sideways when the scrollbar appears
  and disappears between two payloads — the exact jump the comment above that
  declaration was written to prevent. The three regions still agree with each
  other, which is the other thing the declaration is for: only `.list` can ever
  show a scrollbar, and the two below it reserve the same gutter so that a bar is
  one length wherever it is drawn. Below the floor none of them reserves anything,
  so the bars stay equal and what is lost is the list's jump alone.
- **`scrollbar-width` / `scrollbar-color`**. The platform scrollbar, at platform
  width and platform colour, instead of the thin tinted one. The width is the
  gutter's as well, and all three regions ask for it in the same words, so a
  platform gutter widens their insets together rather than one of them.

### Prefixed

| Construct | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| `-webkit-user-select` | 1 | 49 | 3 |
| `user-select` | 54 | 69 | never |

**Safari has never supported `user-select` unprefixed** — only
`-webkit-user-select`, since Safari 3. `src/ui/panel-look.ts` spells both,
in both of the rules that need them: the title bar the panel is dragged by, and
the tabs. While it spelled only the standard property, the declaration did
nothing on Safari — dragging the panel selected the text under the cursor, and
so did a drag that started on a row. That was neither a floor nor a degradation
but a defect, filed by the round that read this register and fixed by the round
after it.

Neither row is a floor on its own, and neither is in the tier arithmetic above.
Between them they cover every engine in scope; separately they cannot, and one
of them says `never`. That `never` is why the two sit here rather than in
**Settled**: `tests/tools/browser-support.test.ts` requires a row carrying one
to have a prefixed counterpart spelled by the stylesheet as many times as the
bare property is, so a third rule reaching for `user-select` cannot quietly
leave Safari out again.

### Settled

Everything else `composePanelStyleText()` spells. Each predates both tiers in
every engine in scope by years, so no version is quoted: the claim is only that
it is below the floor, and the floor is set above.

Properties: `align-items` · `align-self` · `all` · `background` · `border` · `border-bottom` ·
`border-radius` · `border-top` · `bottom` · `box-shadow` · `box-sizing` ·
`color` · `cursor` · `display` · `flex` · `flex-direction` · `flex-wrap` · `font` ·
`font-size` · `font-style` · `font-variant-numeric` · `font-weight` · `gap` ·
`height` · `justify-content` · `left` · `letter-spacing` · `line-height` ·
`margin` · `margin-bottom` · `margin-left` · `margin-right` · `margin-top` ·
`max-height` · `min-height` · `opacity` · `overflow` · `overflow-x` ·
`overflow-y` · `padding` · `padding-bottom` · `padding-left` · `padding-right` ·
`padding-top` · `pointer-events` · `position` · `right` · `text-align` ·
`text-overflow` · `text-transform` · `top` · `touch-action` · `white-space` ·
`width` · `z-index`

Pairs: `-webkit-user-select: none` · `align-items: baseline` ·
`align-items: center` · `align-self: center` · `all: initial` · `background: transparent` ·
`border: solid` · `border-bottom: none` ·
`border-top: dashed` · `border-top: solid` · `box-shadow: inset` ·
`box-sizing: border-box` ·
`color: inherit` · `cursor: help` · `cursor: move` · `cursor: pointer` ·
`display: block` · `display: flex` · `flex: auto` · `flex: none` ·
`flex-direction: column` · `flex-wrap: wrap` · `font: sans-serif` ·
`font: system-ui` ·
`font-style: italic` · `font-variant-numeric: tabular-nums` ·
`justify-content: center` · `justify-content: space-between` ·
`margin-left: auto` · `mask-image: transparent` · `overflow: hidden` ·
`overflow-x: hidden` · `overflow-y: auto` · `pointer-events: none` ·
`position: absolute` · `position: fixed` · `position: relative` ·
`position: sticky` · `scrollbar-color: transparent` ·
`scrollbar-gutter: stable` · `scrollbar-width: thin` · `text-align: center` ·
`text-overflow: ellipsis` · `text-transform: uppercase` · `touch-action: none` ·
`user-select: none` · `white-space: nowrap`

Functions: `calc` · `min` · `repeating-linear-gradient` · `rgb` · `var`

Selectors: `first-of-type` · `host` · `hover`

## The DOM

| Construct | Where | Chrome / Edge | Firefox | Safari |
|---|---|---|---|---|
| `replaceChildren` | `src/ui/panel-element.ts` | 86 | 78 | 14 |
| `attachShadow` | `src/ui/panel-element.ts` | 53 | 63 | 10 |
| `setPointerCapture` | `src/ui/panel-element.ts` | 55 | 59 | 13 |
| `getBoundingClientRect` | `src/ui/panel-element.ts` | 2 | 3 | 4 |
| `Blob` | `src/userscript-entry.ts` | 5 | 4 | 6 |
| `createObjectURL` | `src/userscript-entry.ts` | 19 | 19 | 6 |
| `localStorage` | `src/userscript-storage.ts` | 4 | 3.5 | 4 |
| `sessionStorage` | `src/userscript-storage.ts` | 4 | 2 | 4 |
| `getItem` | `src/userscript-storage.ts` | 4 | 3.5 | 4 |
| `setItem` | `src/userscript-storage.ts` | 4 | 3.5 | 4 |
| `removeItem` | `src/userscript-storage.ts` | 4 | 3.5 | 4 |

The five storage rows were read on **2026-08-26**, from the same source as the
rest; every other row carries the date at the top of this document. All five sit
so far below both tiers that they cannot move the floor, and they are listed for
the opposite reason — this is the one part of the add-on that can fail on a
browser that supports it perfectly.

⚠️ **The quota is not in this register, and its absence is the entry.** How much
an origin may keep differs by engine, by profile and by how much that origin
already holds, and none of it is readable from a page. The add-on therefore never
predicts one: it writes, catches the refusal, gives up its oldest unpinned fight
and writes again (`src/userscript-storage.ts`, `src/game/kept-fights.ts`). That
matters more here than anywhere else in this table, because the origin is shared
with the game — which keeps everything under one key, rewrites it whole on every
change, and catches nothing
(`docs/specs/2026-08-26-a-fight-you-can-go-back-to.md`).

⚠️ **This is the half that is not complete, and saying so is the point.** The
CSS above is enumerable and the JavaScript below is held by a compiler; the DOM
is neither. What bounds it instead is §9.1's injection discipline: `src/ui/`
takes the document as an argument and reaches for no browser global at all —
`PanelNode`, `PanelHost` and `PanelDocument` in `src/ui/panel-element.ts` are
the whole slice it uses, and `HostPage` in `src/userscript-entry.ts` is the
whole slice the entry point uses. That is guarded by
`tests/tools/source-layout.test.ts`, so the surface stays declared rather than
ambient, and the table above stays readable against those declarations by a
person. It is not guarded to be exhaustive, and nothing here claims it is.

Nothing needing a manager's cooperation is used: no `GM_*`, no `fetch`,
`XMLHttpRequest`, `WebSocket` or `sendBeacon` (§5), no `innerHTML`, no `eval`,
no external script. The banner is `@grant none`, so the script runs in the
page's own context and the page's CSP has nothing of ours to refuse.

## JavaScript

Held by `tsconfig.userscript.json`, not by this table: it typechecks `src/` and
`libs/` at `lib: ["ES2022", "DOM"]`, so reaching past the floor fails the gate
by name. The two constructs that decide where that floor is:

| Construct | Where | Chrome / Edge | Firefox | Safari |
|---|---|---|---|---|
| `ErrorOptions` | `src/core/margometer-error.ts` | 93 | 91 | 15 |
| `replaceAll` | `src/game/fight-capture.ts` | 85 | 77 | 13.1 |

`ErrorOptions` is why the lib is ES2022 and not ES2021, and it is a **type**
dependency rather than a runtime one: the base class accepts and forwards
`options`, and no shipped caller passes a `cause`. An engine below 93 does not
throw on the two-argument `new Error(...)` — it ignores the second argument. The
floor is stated at what has to be there rather than at what currently happens to
work, because the first is a promise and the second is an accident.

## Installing it

The browser matters less than the userscript manager, and on one browser the
manager needs the reader's permission before it may run anything.

| Browser | Manager | What the reader has to do |
|---|---|---|
| Firefox | Tampermonkey, Violentmonkey, Greasemonkey | Install the extension. Nothing else. |
| Chrome / Edge | Tampermonkey, Violentmonkey | Install the extension, then turn on **Allow User Scripts** on the extension's own page in `chrome://extensions`. Without it no userscript runs at all, and the failure is silent. |
| Safari | Userscripts, Tampermonkey for Safari | Install the app, then enable it in Safari's extension settings. |

The banner asks for nothing unusual — `@grant none`, `@noframes`,
`@run-at document-idle`, no `@require` and no `@resource` — so no manager is
excluded by what the script needs, only by whether it exists for that browser.

## Not checked

Three answers, and they are different: *not looked at*, *looked at and clean*,
and *a finding* (§7.7).

- **Only Firefox has ever been run.** Every version above is read from
  `browser-compat-data`, not observed. The one engine this repository actually
  drives is Firefox, through `tools/preview-server.ts` and
  `tools/panel-screenshots.ts`. Chrome and Safari are **not looked at**, and
  neither is on the machine that wrote this.
- **Two CSS decisions were measured in Firefox specifically** and have no
  counterpart anywhere else: the shadow offsets in `src/ui/panel-look.ts`
  and the tinted-bar contrast in `src/ui/panel-look.ts`. Both say so where
  they are written. Whether either holds in another engine is **not looked at**.
- **Mobile is out of scope, and not only because of a browser.** The detail card
  opens on `pointerover` and the panel is moved by dragging its title bar; a
  touch screen has no hover and no cursor to outrun. The limit is the panel's
  design, not the platform's support, so a manager that runs on a phone would
  not make it usable. That is **a finding**, and it belongs to the panel rather
  than to this register.
- **Chrome's user-scripts toggle is documented from the vendor's page, not
  reproduced.** Nobody here has clicked it.
