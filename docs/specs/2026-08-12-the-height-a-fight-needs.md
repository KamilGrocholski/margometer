# The height a fight needs, and the window it has to fit in

Status: implemented

This supersedes "The list is a fixed height, and one row never scrolls away" in
`docs/specs/2026-08-11-the-panel-that-drills.md`. That file stays as written.
Everything else it decides — the drill tree, `Bez sprawcy` below the list and
outside its scrolling, the title bar, the rank number — still stands, and so does
the sentence this one is built on: **eleven bars under `Wszyscy`, ten under a
filter**. What changes is what those two numbers *are*.

## The defect: three heights, and nothing above any of them

The old spec promised one height for every screen. The shipped panel had three,
and none of them was bounded by the screen it was drawn on.

- **The ranking** was a fixed 11 or 10 bars, which is right and stays.
- **A breakdown** sized itself to its sections, from one bar to twenty-four. So
  clicking a combatant with one section shortened the window to a fifth of the
  list it was opened from, and everything below the list — the summary, the
  warnings — jumped up under the reader's hand. That is the one thing the old
  spec's height section existed to prevent, and no test caught it: both
  assertions covered the ranking.
- **Nothing at all** capped the panel against the window. `:host` had no
  `max-height`, and placement clamps only the top-left corner, keeping 64px of
  panel on screen. A twenty-four-row breakdown is about 690px of panel; on a short
  window, or a panel dragged low, the bottom of it — including the figures — is
  simply off the screen with no way to reach it but dragging the whole panel back
  up.

And a fourth thing, which is about scrolling rather than height: **a fight redraws
every few seconds and every redraw built a new list**, so wherever the reader had
scrolled to was lost on the next payload. In a fight long enough to need scrolling
at all, the list could not be read.

## The rule: a floor in bars, a ceiling in windows

**The ranking is eleven bars under `Wszyscy` and ten under a side filter, fixed.**
The measurement behind those numbers, on the seven captures: 2, 4, 11, 11, 11, 11
and 11 combatants, and every group fight is ten of ours against one. So the common
case is a list that exactly fits with no scrollbar at all. A bigger fight scrolls
rather than growing the window — the old spec's rejection of "growing the list to
fit everyone" stands, and the reason is unchanged: a ranking is watched *during* a
fight, and a height that changed as combatants joined would move under the hand of
somebody reading it.

**A breakdown is never shorter than the ranking it was opened from, and grows to
hold its sections.** It has three of them and the whole point of three sections is
comparing them; at eleven bars the last two sat under the fold. Both halves of that
sentence are the same rule — the ranking's height is the floor, and only growth is
allowed — so a click can lengthen the window and can never shorten it.

**The ceiling is the window, and it is a stylesheet rule.** The panel may take
what is left below its own top edge, and never more than two thirds of the window,
whichever is less. The first keeps its figures on the screen; the second is taste,
said plainly: a damage meter that covers two thirds of somebody's game has stopped
being a guest.

Written in CSS rather than measured, for the reason the tooltip's placement is:
the panel's height changes with every payload, so anything read out of the document
is stale before the next one. `100vh` re-evaluates itself, including on a resize
nothing here listens for. The panel's top edge reaches CSS as
`--MargoMeter-panel-top`,
written by placement beside `top`, because CSS cannot read an inline `top` back
out.

**Only the list gives way.** When the ceiling is lower than the panel wants to be,
the shortfall comes out of the one region that has a fold — never out of the
header, the controls, the row for what nobody can be charged with, the summary or
a warning, all of which say the same thing at any height. The limit of this, and
it is stated rather than hidden: the chrome cannot shrink, so a reader who drags
the panel to the very bottom of the window gets a list of nothing and a panel that
reaches past the edge again. They put it there, and 64px of it stays grabbable.

**The reader's place in the list survives a redraw of the same screen**, and is
dropped when they moved to another. What "the same screen" means is the metric,
the side filter and the drill — anything that changes which rows are in the list.

## What a reader sees change

- A breakdown no longer shrinks on the way in.
- A tall breakdown is as tall as it needs to be, up to the window.
- Nothing of the panel is ever below the bottom edge, unless it was dragged there.
- A scrolled list stays where it was left while the fight goes on.
- A section heading stays at the top edge while its own section scrolls, so a
  figure is never read under the wrong heading.
- The scrollbar's gutter is reserved whether or not a scrollbar is showing, so
  the rows do not shift sideways when one appears between two payloads.
- A wheel that runs out of list stops there rather than scrolling the game behind.

## Rejected alternatives

- **Growing the ranking to fit everyone.** Still rejected, and now for a second
  reason as well as the first: with a floor of eleven the common fight already
  fits exactly, so growth would only ever be triggered by the rare big fight —
  paying for it with a window that moves while somebody watches it.
- **A ceiling counted in bars.** It is what the code had, at twenty-four, and it
  cannot answer the question it was standing in for: twenty-four bars is
  comfortable on one screen and off the bottom of another. A number of rows knows
  nothing about the window, and the window is what the reader is complaining about.
- **Measuring the panel with `getBoundingClientRect`.** The panel's height changes
  with every payload, so a measured ceiling is stale before the next one, and it
  would put the first layout read into `ui` — which the tooltip already refuses to
  do for the same reason.
- **Computing `max-height` in script from the viewport placement already asks for.**
  It reads better and it goes stale on a window resize, which nothing here listens
  for. `100vh` does not.
- **A `min-height` on the list, so it can never be squashed to nothing.** It trades
  a squashed panel for one that runs off the bottom again, and the reader chose
  where to put it.
- **Moving the list out of the render, into the shadow root, so the browser keeps
  the scroll position for free.** It is what the title bar and the tooltip do and
  it would need no memory at all — but the list sits in the middle of the region
  order, so a persistent list splits the render into two containers above and
  below it. That costs the property §9.6 leans on: one function drawing every
  region in reading order, each isolated. Two fields of state are cheaper.
- **Scrolling the reader to their own row, or to the top, when something changes.**
  §9.6: nothing moves unless a hand is moving it.
- **Following this change in `docs/design/panel.html`.** The drawing is a copy of
  the numbers, not a second reader of them, and §8 already decides that the add-on
  wins where the two disagree. What this changes is behaviour in a window — a
  ceiling, a fold, a scroll position across redraws — and a standalone page opened
  from disk shows none of it. Copying the rules there would produce a second source
  for a decision, which is the thing that directory is fenced against.
