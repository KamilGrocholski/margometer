# 0017. The panel is served while it is edited, and published once it is released

- **Status:** Accepted
- **Date:** 2026-08-29

## Context

`deno task check` cannot see a panel. The gate typechecks, runs the suite and builds the bundle, and
every one of those can be green while the thing a player looks at is broken.

What stood in for the missing surface was `tools/build-preview.ts`: one `dist/preview.html` carrying
the bundle and every recording, opened from disk. It drew, and that is the whole of what it did.
There were no steps, so the panel before any call — the state a reader meets first — could not be
reached. There was no rebuild, so an edit to `src/ui/` cost a full `deno task build` and a manual
reload. Choosing another recording reloaded the page, which threw away the screen, the position and
the shelf along with it. And it answered nothing for the reader `DESIGN.md` addresses in _The Frame
Is Not A Screen Rule_ — the one who will not install an unauthorised userscript into a game and had
nowhere to look at the panel at all.

v1 solved the same three problems with three tools and a workflow, and that shape is what is carried
here. Measured while carrying it, on Chrome 152 and Deno 2.9.6, 2026-08-29:

- `deno bundle` writes to a path, so a preview that rebuilds has to be given one. Rebuilding into
  `dist/` churns what a release attaches and races the gate over it.
- `--dump-dom` floors the window at 500px wide; `--screenshot` honours whatever it is given. A frame
  derived from the width that was **asked for** rather than the one the page **reported** is wrong
  by 232px, and the picture looks fine.
- The card region stands in the panel whether or not a card is open, and an unopened one measures
  nothing. A frame sized to `min(panel, card)` without checking for width photographs the panel with
  the card off the left edge.

## Decision

**One page, three consumers, and every word a value.** `tools/preview-page.ts` composes the harness
whole; `tools/preview-server.ts` serves it and reloads it; `tools/preview-site.ts` writes it down;
`tools/panel-screenshots.ts` drives it in front of a browser. The page holds no Polish and no
English, because the served page is read by whoever is editing `src/` and the published one by a
player — **L2**, as a parameter rather than a branch.

**Stepping back is replaying.** `src/game/battle-session.ts` accumulates and has no rewind, but it
resets on the call a fight opens with, and every recording carries one first —
`tests/tools/recorded-fights.test.ts` measures that rather than assuming it. So a step back costs a
replay and not a reload, and the panel keeps the screen the reader chose.

**The published page keeps nothing.** It takes the store away before the bundle runs, so the add-on
is the one people install and a visitor is not left holding somebody's demo fight.

**A picture is taken at a frame measured off the panel.** Both edges come from what the page
reported about where the panel and its card landed, and everything drawn is anchored to the right
edge of the viewport, so the frame is the distance from the leftmost edge to that one.

## Consequences

Easy: looking at the panel while changing it, at any point in any recording, without building
anything. Looking at it from outside, with nothing installed. Photographing it without a browser
automation library.

Hard: the preview loads the real add-on, so anything the add-on writes to a store, a page or a
console it will do here too — which is why the store is taken away rather than mocked. And the
published pages carry the recordings' own engine calls; `NOTICE.md` states what that holds.

Obliged: `screenshots/` is guarded against its own sidecar from the first set, and the tool refuses
to shoot while `src/` carries anything no commit holds. Whether the state a picture shows is
reachable no guard can say, so opening every picture before committing it stays a standing
obligation — `DESIGN.md` owns it.

## Alternatives

**Keep the single page from disk.** It cannot rebuild, cannot step, and cannot be published under a
path of its own without the absolute-address hole that only shows up on a deployment.

**Inline the bundle in every page, as the single page did.** A published site would then carry 28
copies of it, and the served page could not show a rebuild without composing the whole document
again.

**One server, and let each shot choose its state from the address.** The shot's driver would have to
read a query, which is a value reader `src/core/` owns and the page may not do. A server per shot
costs a directory read and nothing else.

**Photograph at a fixed window size.** Two thirds of every image is background, and the card falls
off the left edge. Rejected in v1 for the first reason and re-measured here for the second.

**Publish from `develop`.** Today's problem with a branch name attached: the page a stranger judges
the add-on by would be drawn by code they cannot install.

**A guard that reads git state to check the screenshots are current.** It would answer a question
about the machine rather than about the code — the gate runs on forks and on shallow checkouts. The
tool's own refusal is where that belongs.
