# 0076. The way out is held by the object, not by the method

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

`SECURITY.md`'s first rule is the whole security model: **nothing leaves the browser**. It names six
routes — `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, an image or stylesheet request of
ours, and a redirect. `tests/repository/reading-boundary.test.ts` held it by walking `libs/` and
`src/` for an **ambient** name out of a list, ambient because `page.navigator.userAgent` is a
reading the add-on depends on and a reader that took a dotted name would forbid reading the page.

**Three of the six routes could not be caught by that reader, and two of them were never in its
list.** Measured on 2026-09-11, each as a real call inserted into `src/core/game-build.ts` and run
through the whole of `deno task check`:

| Inserted into `src/core/`                    | Gate                                    |
| -------------------------------------------- | --------------------------------------- |
| `navigator.sendBeacon(url, "")`              | 923 passed                              |
| `location.href = url`                        | 923 passed                              |
| `document.createElement("img")` with a `src` | 923 passed                              |
| `globalThis["fet" + "ch"](url)`              | refused, by `deno check` under `strict` |
| `fetch`                                      | refused, by this guard                  |

`sendBeacon` was in the list and could never fire: it has no ambient form, so every occurrence sits
behind a dot and every occurrence was skipped. The redirect and the tag were in the document's prose
and in no list at all — the guard checked that every name **it** looks for is named in `SECURITY.md`
and never the other way round, so prose could name a route the guard had never heard of.

## Decision

**A route reached through an object is held by forbidding the object, and a route reached by naming
a tag is held by the tag name.**

- `location` and `navigator` join the ambient list. `sendBeacon` and a redirect both go through one
  of them, so forbidding the object catches what forbidding the method cannot.
- **A property declaration is not a use.** The entry declares what a page must state —
  `location: { hostname?: string }` and `navigator: { userAgent?: string }` — and reading those off
  the page it was handed is how the add-on knows which world it is in. Exactly two such lines exist,
  and the reader skips a name that opens a line and is followed by a colon.
- **`createElement` is held by its tag name, against the four this add-on builds**: `a`, `div`,
  `span`, `style`. None of the four fetches when it is appended. A fifth is `[ASK]`, and the tag
  name is read off the line itself because it is a string the other reader takes out.

## Consequences

- **The three routes fail now**, each proved by a real call and by a sample that must not fire:
  `document.createElement("div")` and `page.navigator.userAgent` stay green.
- **`window` is not on the list.** It has exactly one ambient use, `startFromWindow(window)` in
  `src/userscript-boot.ts`, which is the handover the whole design rests on. Holding it would need a
  bound rather than a refusal, and nothing has asked for one.
- **`document` is not on the list either**, and cannot be: the bundle names it 330 times.
- **The reverse gap stays open in part.** The guard still checks only that every name it looks for
  is named in `SECURITY.md`. What closed here is the three routes that prose named and the list did
  not; a seventh route added to the prose alone would still be held by nobody.
- **This says nothing about the built file.** The walk reads sources under `libs/` and `src/`, which
  is what the bundle is made of, and not `dist/margometer.user.js`.
