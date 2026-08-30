# Browser support

What the shipped userscript needs from a browser, measured off the tree rather than assumed. The CSS
half is held to it by `tests/tools/browser-support.test.ts`; the JavaScript half is held by nothing
here, which the section on it states.

The register exists because nothing else could notice. `tools/build-userscript.ts` bundles with
`minify: false` and no `target`, so **the ES level of the source is the ES level a player's browser
must have** — there is no downlevelling anywhere and no polyfill of anything. A round that reaches
for a newer construct raises the bar for every player, silently, and the gate goes green.

**Read at:** 2026-08-18. Every version below comes from MDN's `browser-compat-data`, read that day
at `https://raw.githubusercontent.com/mdn/browser-compat-data/main/`. Versions are the **first**
release with support, taken from the earliest `version_added` in each engine's history — not from
the entry that completes a partial implementation, which is a different and later number.

## The floor

|                       | Chrome / Edge | Firefox | Safari |
| --------------------- | ------------- | ------- | ------ |
| **Runs correctly**    | 93            | 91      | 16     |
| **Looks as designed** | 121           | 97      | 26.2   |

Two tiers because they answer different questions and one number would lose a true fact either way.
Between the rows the panel counts correctly, draws every figure and every warning, and differs only
in the scrollbar and one hatch — so calling those browsers unsupported would be false, and calling
them fully supported would be too.

Every current desktop release clears both. The gap that lasted longest is Safari's:
`scrollbar-color` reached it in 26.2, and before that the panel's list carries the platform
scrollbar instead of the thin tinted one.

⚠️ **One property is spelled twice, once with a `-webkit-` prefix**, because Safari answers it under
no other name — see `### Prefixed` below.

## The one it is developed against

**Chrome is the browser this add-on is developed and measured against, from 2026-08-29.** It is what
most people playing Margonem use, and the floor above is what everybody else gets.

The two are different claims and the distinction is the point of this section. The floor says which
engines the panel works on, and it still covers three. This says which engine a **measurement** is
taken on when one is needed, and there has to be one: a browser picks the face `system-ui` resolves
to, so the same rule lays out differently on Chrome and on Firefox, and on the same engine across
two systems. A layout figure taken on an engine nobody plays on answers a question nobody asked.

What follows from it:

- A measurement of how the panel lays out is taken in Chrome, and carries its version and the date
  it was taken on, as **V3** asks of any claim about a browser. `deno task preview` writes
  `dist/preview.html`, which stands the add-on up against a recording with no game and no network;
  headless Chrome reads it from disk.
- A measurement already in the tree that names another engine stays as it was taken. It was true of
  that engine on that date, and rewriting it would be inventing a reading nobody took.
- Being the target buys Chrome nothing in the tables below. A construct still needs an entry with
  every engine's first supporting version, and a Chrome-only construct still raises the floor.

## CSS

The stylesheet is one string, `composeStyleSheet()` in `src/ui/panel-look.ts`, so what it spells is
enumerable: every property, every `property: value` pair, every function and every selector. The
guard reads that enumeration and requires each one to appear below, in a table or in the settled
list. A property added with no entry here fails the gate, **and so does an entry here naming
something the sheet no longer spells** — a register that only grows describes a panel that stopped
existing. `line-height` and `first-of-type` outlived their rules that way, and were found by the
guard's first run on 2026-08-29.

### What sets the floor

| Construct                      | Tier  | Chrome / Edge | Firefox | Safari |
| ------------------------------ | ----- | ------------- | ------- | ------ |
| `overscroll-behavior`          | runs  | 63            | 59      | 16     |
| `overscroll-behavior: contain` | runs  | 63            | 59      | 16     |
| `mask-image`                   | looks | 120           | 53      | 15.4   |
| `scrollbar-gutter`             | looks | 94            | 97      | 18.2   |
| `scrollbar-width`              | looks | 121           | 64      | 18.2   |
| `scrollbar-color`              | looks | 121           | 64      | 26.2   |

What each one looks like below its floor, which is the whole content of a cosmetic floor and the
reason the tier column is not enough on its own:

- **`overscroll-behavior: contain`** (`src/ui/panel-look.ts`, on `.list`). A wheel that runs out of
  the list turns into a scroll of the game underneath. That is the one degradation here that reaches
  outside the panel, which is why it is `runs` and not `looks`: we are a guest on someone else's
  page. The versions above are its first support; the engines mark that support partial, and the
  excluded case — a scroll container with no scrollable overflow — is not the panel's, whose list
  overflows whenever the rule matters.
- **`mask-image`** (on `.pinned .bar`). The unattributed row's bar loses its diagonal hatch and
  renders solid. Cosmetic rather than a §9.7 failure, and the distinction is worth stating: the
  hatch is a second channel on a row that is **already labelled in words**, so colour is not left
  carrying the meaning alone. Chrome's number is high because it is the **unprefixed** property;
  Chrome had `-webkit-mask-image` from 1 and Safari from 4, and the prefix is deliberately not
  spelled. That is where the line sits: below its floor this property degrades and the row still
  reads, so a prefix would buy back a hatch — while the one property that is prefixed buys back a
  defect.
- **`scrollbar-gutter: stable`** (on `.list`, `.pinned` and `.sides-region`). The gutter is no
  longer reserved, so rows shift sideways when the scrollbar appears and disappears between two
  payloads — the exact jump the comment above that declaration was written to prevent. The three
  regions still agree with each other, which is the other thing the declaration is for: only `.list`
  can ever show a scrollbar, and the two below it reserve the same gutter so that a bar is one
  length wherever it is drawn. Below the floor none of them reserves anything, so the bars stay
  equal and what is lost is the list's jump alone.
- **`scrollbar-width` / `scrollbar-color`**. The platform scrollbar, at platform width and platform
  colour, instead of the thin tinted one. The width is the gutter's as well, and all three regions
  ask for it in the same words, so a platform gutter widens their insets together rather than one of
  them.

### Prefixed

| Construct             | Chrome / Edge | Firefox | Safari |
| --------------------- | ------------- | ------- | ------ |
| `-webkit-user-select` | 1             | 49      | 3      |
| `user-select`         | 54            | 69      | never  |

**Safari has never supported `user-select` unprefixed** — only `-webkit-user-select`, since
Safari 3. `src/ui/panel-look.ts` spells both, in both of the rules that need them: the title bar the
panel is dragged by, and the tabs. While it spelled only the standard property, the declaration did
nothing on Safari — dragging the panel selected the text under the cursor, and so did a drag that
started on a row. That was neither a floor nor a degradation but a defect, filed by the round that
read this register and fixed by the round after it.

Neither row is a floor on its own, and neither is in the tier arithmetic above. Between them they
cover every engine in scope; separately they cannot, and one of them says `never`. That `never` is
why the two sit here rather than in **Settled**: `tests/tools/browser-support.test.ts` requires a
row carrying one to have a prefixed counterpart spelled by the stylesheet as many times as the bare
property is, so a third rule reaching for `user-select` cannot quietly leave Safari out again.

### Settled

Everything else `composeStyleSheet()` spells. Each predates both tiers in every engine in scope by
years, so no version is quoted: the claim is only that it is below the floor, and the floor is set
above.

Properties: `align-items` · `align-self` · `all` · `background` · `border` · `border-bottom` ·
`border-radius` · `border-top` · `bottom` · `box-shadow` · `box-sizing` · `color` · `cursor` ·
`display` · `flex` · `flex-direction` · `flex-wrap` · `font` · `font-size` · `font-style` ·
`font-variant-numeric` · `font-weight` · `gap` · `height` · `justify-content` · `left` ·
`letter-spacing` · `margin` · `margin-bottom` · `margin-left` · `margin-right` · `margin-top` ·
`max-height` · `min-height` · `min-width` · `opacity` · `overflow` · `overflow-x` · `overflow-y` ·
`padding` · `padding-bottom` · `padding-left` · `padding-right` · `padding-top` · `pointer-events` ·
`position` · `right` · `text-align` · `text-overflow` · `text-transform` · `top` · `touch-action` ·
`white-space` · `width` · `z-index`

Pairs: `-webkit-user-select: none` · `align-items: baseline` · `align-items: center` ·
`align-self: center` · `align-self: stretch` · `all: initial` · `background: currentColor` ·
`background: transparent` · `border: solid` · `border-bottom: none` · `border-top: dashed` ·
`border-top: solid` · `box-shadow: inset` · `box-sizing: border-box` · `color: inherit` ·
`cursor: help` · `cursor: move` · `cursor: pointer` · `display: block` · `display: flex` ·
`display: none` · `flex: auto` · `flex: none` · `flex-direction: column` · `flex-wrap: wrap` ·
`font: sans-serif` · `font: system-ui` · `font-style: italic` · `font-variant-numeric: tabular-nums`
· `justify-content: center` · `justify-content: space-between` · `margin-left: auto` ·
`mask-image: transparent` · `overflow: hidden` · `overflow-x: hidden` · `overflow-y: auto` ·
`pointer-events: none` · `position: absolute` · `position: fixed` · `position: relative` ·
`position: sticky` · `scrollbar-color: transparent` · `scrollbar-gutter: stable` ·
`scrollbar-width: thin` · `text-align: center` · `text-align: right` · `text-overflow: ellipsis` ·
`text-transform: uppercase` · `touch-action: none` · `user-select: none` · `white-space: nowrap`

Functions: `calc` · `clamp` · `min` · `repeating-linear-gradient` · `rgb` · `var`

Selectors: `host` · `hover`

## The DOM

| Construct               | Where                       | Chrome / Edge | Firefox | Safari |
| ----------------------- | --------------------------- | ------------- | ------- | ------ |
| `replaceChildren`       | `src/ui/panel-element.ts`   | 86            | 78      | 14     |
| `attachShadow`          | `src/ui/panel-element.ts`   | 53            | 63      | 10     |
| `setPointerCapture`     | `src/ui/panel-element.ts`   | 55            | 59      | 13     |
| `getBoundingClientRect` | `src/ui/panel-element.ts`   | 2             | 3       | 4      |
| `Blob`                  | `src/userscript-entry.ts`   | 5             | 4       | 6      |
| `createObjectURL`       | `src/userscript-entry.ts`   | 19            | 19      | 6      |
| `localStorage`          | `src/game/browser-store.ts` | 4             | 3.5     | 4      |
| `sessionStorage`        | `src/userscript-entry.ts`   | 4             | 2       | 4      |
| `getItem`               | `src/game/browser-store.ts` | 4             | 3.5     | 4      |
| `setItem`               | `src/game/browser-store.ts` | 4             | 3.5     | 4      |
| `removeItem`            | `src/game/browser-store.ts` | 4             | 3.5     | 4      |

The five storage rows were read on **2026-08-26**, from the same source as the rest; every other row
carries the date at the top of this document. All five sit so far below both tiers that they cannot
move the floor, and they are listed for the opposite reason — this is the one part of the add-on
that can fail on a browser that supports it perfectly.

⚠️ **The quota is not in this register, and its absence is the entry.** How much an origin may keep
differs by engine, by profile and by how much that origin already holds, and none of it is readable
from a page. The add-on therefore never predicts one: it writes, catches the refusal, gives up its
oldest unpinned fight and writes again (`src/game/browser-store.ts`, `src/game/kept-fights.ts`).
That matters more here than anywhere else in this table, because the origin is shared with the game
— which keeps everything under one key, rewrites it whole on every change, and catches nothing
(`git show develop:docs/specs/a-fight-you-can-go-back-to.md`).

⚠️ **This is the half that is not complete, and saying so is the point.** The CSS above is
enumerable and the JavaScript below is held by a compiler; the DOM is neither. What bounds it
instead is §9.1's injection discipline: `src/ui/` takes the document as an argument and reaches for
no browser global at all — `PanelNode`, `PanelHost` and `PanelDocument` in `src/ui/panel-element.ts`
are the whole slice it uses, and `HostPage` in `src/userscript-entry.ts` is the whole slice the
entry point uses. That is guarded by `tests/repository/sources.test.ts`, so the surface stays
declared rather than ambient, and the table above stays readable against those declarations by a
person. It is not guarded to be exhaustive, and nothing here claims it is.

Nothing needing a manager's cooperation is used: no `GM_*`, no `fetch`, `XMLHttpRequest`,
`WebSocket` or `sendBeacon` (§5), no `innerHTML`, no `eval`, no external script. The banner is
`@grant none`, so the script runs in the page's own context and the page's CSP has nothing of ours
to refuse.

## JavaScript

⚠️ **Held by nothing in this tree, and the floor below is a claim rather than a check.** Two lines
would hold it: a `lib` deciding which library **members** exist, and a `target` deciding which
**syntax** is allowed. `deno.json` states `lib` as `esnext` and no `target` at all, so a round that
reaches past this floor for either passes the gate without a word. `ARCHITECTURE.md` carries it as a
known gap. The two constructs that decide where the floor is:

| Construct      | Where                          | Chrome / Edge | Firefox | Safari |
| -------------- | ------------------------------ | ------------- | ------- | ------ |
| `ErrorOptions` | `src/core/margometer-error.ts` | 93            | 91      | 15     |
| `replaceAll`   | `src/game/fight-capture.ts`    | 85            | 77      | 13.1   |

`ErrorOptions` is why the lib is ES2022 and not ES2021, and it is a **type** dependency rather than
a runtime one: the base class accepts and forwards `options`, and no shipped caller passes a
`cause`. An engine below 93 does not throw on the two-argument `new Error(...)` — it ignores the
second argument. The floor is stated at what has to be there rather than at what currently happens
to work, because the first is a promise and the second is an accident.

### Patterns, and the part no compiler holds

⚠️ **A regular expression's syntax is checked against `target` and against nothing else, and the
check is partial.** Measured on 2026-08-27 against v1's tree, by putting a pattern into
`git show develop:src/game/game-dictionary.ts` and restoring the file from a copy: with `target`
inherited as `ESNext`, `/[\p{ASCII}--[a-z]]/v` in shipped code typechecked clean. Narrowing `target`
refuses it — `error TS1501`. Dropped to `ES2017` for the same probe, the compiler refuses
`/(?<name>x)/` by name and accepts both `/(?<=x)y/` and `/\p{L}/u` without a word.

This tree states no `target`, so none of that check is in force here — and **C7** is what stands
instead: there is no pattern in `src/` or `tools/` to check. So of the pattern constructs above this
floor a compiler that had a target would catch the `v` flag and miss two. First release with
support, from `browser-compat-data`, read 2026-08-27:

- **lookbehind**, `(?<=…)` — Chrome 62, Firefox 78, Safari 16.4. This is the cheap mistake: a couple
  of characters, and the other two engines have had it since long before the floor, so only Safari
  moves and only by a fraction.
- **the `(?i:…)` modifier** — Chrome 125, Firefox 132, Safari 26.

Neither is spelled under `src/` or `libs/`, which is why neither has a row in the table above: a row
names a construct the file beside it still spells, and the floor at the top of this page is the
maximum over the rows. A tool may spell either harmlessly, because tools never ship.

⚠️ **A pattern above the floor does not degrade, and it does not even fail where it is written.** A
library member the engine lacks fails at the call, which is a place: something reached for it, and
the failure is that thing's size. A pattern whose syntax the engine cannot parse is an _early_
SyntaxError — it is refused while the file is being read, before a line of it has run. The bundle
never parses, so the reader sees no panel and no console line of ours. `new RegExp` differs only in
when — `src/core/game-build.ts` builds two at module scope, so those throw while the add-on is
starting. There is no degraded state to describe here, which is why §9.9's `[ASK]` binds with
nothing to weigh (`git show develop:docs/specs/2026-08-27-a-pattern-the-floor-never-covered.md`).

## Installing it

The browser matters less than the userscript manager, and on one browser the manager needs the
reader's permission before it may run anything.

| Browser       | Manager                                   | What the reader has to do                                                                                                                                                         |
| ------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Firefox       | Tampermonkey, Violentmonkey, Greasemonkey | Install the extension. Nothing else.                                                                                                                                              |
| Chrome / Edge | Tampermonkey, Violentmonkey               | Install the extension, then turn on **Allow User Scripts** on the extension's own page in `chrome://extensions`. Without it no userscript runs at all, and the failure is silent. |
| Safari        | Userscripts, Tampermonkey for Safari      | Install the app, then enable it in Safari's extension settings.                                                                                                                   |

The banner asks for nothing unusual — `@grant none`, `@noframes`, `@run-at document-idle`, no
`@require` and no `@resource` — so no manager is excluded by what the script needs, only by whether
it exists for that browser.

## Not checked

Three answers, and they are different: _not looked at_, _looked at and clean_, and _a finding_.

- **Only Firefox has ever been run.** Every version above is read from `browser-compat-data`, not
  observed. The one engine this repository actually drives is Firefox, through
  `tools/preview-server.ts` and `tools/panel-screenshots.ts`. Chrome and Safari are **not looked
  at**, and neither is on the machine that wrote this.
- **Two CSS decisions were measured in Firefox specifically** and have no counterpart anywhere else:
  the shadow offsets in `src/ui/panel-look.ts` and the tinted-bar contrast in
  `src/ui/panel-look.ts`. Both say so where they are written. Whether either holds in another engine
  is **not looked at**.
- **Mobile is out of scope, and not only because of a browser.** The detail card opens on
  `pointerover` and the panel is moved by dragging its title bar; a touch screen has no hover and no
  cursor to outrun. The limit is the panel's design, not the platform's support, so a manager that
  runs on a phone would not make it usable. That is **a finding**, and it belongs to the panel
  rather than to this register.
- **Chrome's user-scripts toggle is documented from the vendor's page, not reproduced.** Nobody here
  has clicked it.
