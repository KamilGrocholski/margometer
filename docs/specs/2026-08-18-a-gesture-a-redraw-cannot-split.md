# A gesture a redraw cannot split

Status: implemented

## What was wrong

From the maintainer's list: *"I have to click multiple times on any tab, and
button, to see the action, when the add-on is in the middle of drawing."*

The same complaint had been filed once already, as a claim about speed.
`docs/specs/2026-08-18-what-a-payload-costs.md` records it: *"the panel does not
always respond immediately to dragging, changing tabs, drilling in and going
back. That is a claim about latency with no instrument pointed at it."* The
instrument was built in that round, and it says the claim was misfiled.

**It is not latency.** `bun run cost 3` at `66a259f`, over every recording in
`tests/captured-fights/`, puts the worst whole payload between 0.50 ms and
1.49 ms — of which the fold is the largest part. The browser-side `dom` phase was
measured on 2026-08-18 at roughly 2 ms per redraw. Nothing there is a wait a hand
can feel, and no amount of tuning would have made the panel answer.

**It is the redraw taking the node out from under the gesture.** A browser
assembles `click` out of two moments and dispatches it only if both resolve to a
node still in the tree. Every tab, row and crumb was built inside `renderPanel`,
and `renderPanelInto` replaces the whole body on every payload — so a payload
landing between the press and the release detached what had been pressed, and no
`click` was dispatched at all. The reader pressed again.

The rate decides how often it bites, which is why it read as a speed problem:
`tools/payload-cost.ts` reports 42 of 44 engine calls redrawing on
`2026-08-15-tempest-grupa-vs-draugr-2` and 82 of 84 on
`2026-08-15-tempest-grupa-vs-hildur-2` — essentially every call the game makes
during a fight.

What makes this a defect rather than a trade is that half of the panel was
already immune, by a rule this repository had written down and then applied to
only one rung. `setPanelRoot` builds the title bar and its buttons once, with the
shadow root, and its docblock says why: *"a grab handle built inside the render
would be destroyed under the pointer by the next payload."* Everything below the
bar had no such protection.

## What was decided

**Every control the render draws answers to a press.** The delegated listener in
`renderPanel` moved from `click` to `pointerdown`. A press is one event; there is
nothing inside it for a redraw to land in the middle of. The guarantee therefore
holds whatever the payload rate, whatever a render costs, and whatever a later
measurement of either says.

**The primary button alone.** A right-press arrives as a `pointerdown` before the
menu event, and this panel spends the right button on going back — so acting on
every press would open a row and then step straight out of it. `PanelEvent` gains
an optional `button`, read as primary when the event does not say, which is how
the type already treats an absent coordinate.

**The title bar keeps its click**, and that is not an inconsistency: those nodes
outlive every render, so nothing can split their gesture, and a control that
hands over a file or writes to the clipboard is one to act on when the reader has
finished asking.

**Nothing else moved.** `src/userscript-entry.ts` is untouched; the mount still
draws on every payload exactly as before.

Held by three guards in `tests/ui/panel-element.test.ts`: a press alone drives
every control; nothing the render draws is waiting for a click, read off the
listeners of every node it built; and a non-primary press opens nothing while the
back gesture still works. Breaking it back to `"click"` lights eight tests;
dropping the button guard lights the third one alone.

## What was found and not acted on

**The hover detail goes away on a redraw and does not come back.** Same cause,
different half of `src/ui/panel-element.ts`: the detail is shown from
`pointerover`, which fires on *entry*. A payload landing while the pointer rests
on a row replaces that row with a new node the pointer never entered, so the
window is hidden and nothing brings it back until the reader moves their hand.
Left alone deliberately — the list asked for the gesture, and any fix here has to
be confirmed in a browser rather than in a fake.

## Rejected alternatives

**Holding the redraw back while a hand is down.** The panel would report a press
at its root and the mount would keep the newest reading without drawing it. It
preserves click semantics exactly, and it was turned down for what it costs to be
right about: the flush cannot go on `pointerup`, because replacing the tree there
eats the very click being saved, so it has to go on `click` — and a press that
ends without one (release outside the panel, where the shadow root never hears
it) then needs a bound so the meter cannot freeze. Three pieces of state and two
edge cases against one filter.

**Patching the DOM instead of rebuilding it.** This would keep the pressed node
alive and fix the hover detail as well. It is turned down for the third time, and
the reasons still stand: `composePanelMount` argues that "losing a hand-written
patcher's edge cases is worth more than the frames it would save", and the
maintainer declined the same rebuild on 2026-08-18 with the measurement in hand.
It is also the larger change made for the smaller reason — the press is free of
it either way.

**Lifting the tab strips out of the render, the way the title bar already is.**
It would have fixed the tabs, which is what the complaint names first, and left
every row and the crumb exactly as broken — and drilling into a row is the gesture
a fight uses most.

**Acting on the press only while a fight is being read.** A control that behaves
one way in a fight and another between fights is one nobody can learn. The whole
value of the press is that it does not depend on what else is happening.
