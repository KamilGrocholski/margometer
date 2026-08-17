# The panel before the first fight

Status: implemented

What the add-on draws between the moment it mounts and the moment a fight
reaches it. Until now the answer was *nothing*, and the whole of this page is
about why that was not a small omission.

## The defect: a waiting panel and a dead one are the same picture

The title bar is built with the shadow root and outlives every render — that is
deliberate, and `docs/specs/2026-08-12-the-height-a-fight-needs.md` leans on it:
a redraw replaces the body, and a bar built inside the render would be destroyed
under the pointer of whoever was dragging it. The body, though, was only ever
filled from a reading, and there is no reading before the first payload:

```ts
const renderLatest = (): void => {
  if (latest === null) return;      // src/userscript-entry.ts
```

So a fresh page held a bar with nothing under it. Three things follow, and the
third is the one that made it worth a spec.

- **Nothing said the add-on was alive.** A bar and no body is what an add-on that
  has crashed looks like, and it is also what a *collapsed* panel looks like —
  `renderPanelInto` empties the same container for a collapse, and
  `tests/ui/panel-element.test.ts` asserts that emptiness as correct, because for
  a collapse it is. Two states, one picture, and no way for a player to tell
  which they had.
- **The collapse button did nothing.** It flipped `state.isCollapsed` and called
  a function that returned before drawing. The one control on the bar was inert
  until the first payload, which is exactly the case §9.6 refuses: a control that
  is drawn and does nothing.
- **No test could see it.** The panel's own tests hand a view to a render, so
  they never reach the branch; the view's tests never touch a document. The
  decision is one line in the entry point, and the entry point is the only place
  in the tree where both halves are in scope.

## The rule: one sentence, at the height the ranking will have

**The body says `Nie było jeszcze walki.` and nothing else.** No tab strips, no
side summary, no row for what nobody can be charged with, and no figure of any
kind.

**It is drawn at the ranking's own height** — eleven bars, from the same
`RANKING_ROWS` the ranking divides its own list by. A body one line tall under a
title bar is the shape of a collapsed panel again, which is the thing this exists
to end.

**It is one region**, drawn through the same wrapper every other region uses, so
a throw is replaced in place rather than blanking the body (§9.6). It is the only
region there is, which makes that wrapper look redundant and is precisely why it
is not: the failure would be the whole panel.

**It carries no state of its own.** No detail map, no scroll memory, no listener.
There is no row to open, no tab to choose and nowhere to go back to, and the
state is one-way — `latest` is set on the first reading and never set back, so
this is what the panel drew *before* a fight and never what it returns to after
one.

## What a reader sees change

- A panel on a fresh page is a panel, and says why it has no numbers.
- Waiting and collapsed are two different pictures.
- The collapse button works from the first paint.
- The panel still grows when the first payload lands, by the header, the two
  control strips and the summary. That is stated rather than hidden — see the
  rejection below.

## Rejected alternatives

- **Composing a view from an empty session.** One line —
  `composeFightReading(composeEmptySession())` — and it says three untrue things.
  The header would read `brak składu`, as though a fight had arrived with nobody
  in it. The warning strip would say the panel wired itself in mid-fight, because
  an empty session is not from a fight start. And every total would print `0`,
  which under §9.6 is a *measurement* of nothing rather than the absence of one —
  the distinction the whole panel is built around.
- **Drawing the full chrome with an empty list.** It reserves the exact height a
  fight will need and nothing jumps on the first payload, which is the one thing
  the choice above gives up. It buys that with three strips of controls that
  change a screen with nothing on it: `Zadane` and `Otrzymane` over an empty list
  are the same empty list. §9.6 already prefers an absent control to a dead one,
  and `directionTabs` is empty on `Leczenie` for exactly that reason.
- **Reserving the height of the whole panel rather than of the list.** The same
  objection reached from the other side: the only honest way to reserve it is to
  draw the chrome, and hiding drawn controls behind `visibility` is drawing them.
- **A second quiet line under the sentence**, the way `emptyLimitText` sits under
  `emptyText` elsewhere. Those two lines are a fact and a *limit* on what can be
  known about it, and there is no limit here — a fight that has not started is not
  a fight we failed to measure.
- **Tagging `PanelView` so one render could serve both.** A discriminant on the
  view would be carried by every screen and every test that builds one, so that a
  state none of them can be could be told apart from them. The two share one line
  — the collapse — and share it by being written twice.
- **Clearing the panel back to this state when a fight ends.** A fight does not
  end as far as the panel is concerned; the next one replaces it, and the figures
  of the last one are what somebody reads after it. Nothing here is a reason to
  change that.
