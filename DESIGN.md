# Design system: the quiet instrument

## What this document is

**A specification, not a description.** The tokens below are carried from the panel v1 shipped
(`git show develop:src/ui/panel-look.ts`) and the rules from what that panel had to satisfy. Nothing
here is evidence that anything is drawn yet — `ARCHITECTURE.md` carries what exists, and what of
this document the tree does not yet meet.

## North star

MargoMeter is an **instrument sitting on somebody else's screen**. It is not a product surface
competing for attention — the game is what the reader is looking at, and the panel is what they
glance at between turns. Everything below follows from that: dark, dense, still, and legible at a
glance without being loud.

The visual system carries one job that ordinary design systems do not: **it has to show doubt**. A
figure the protocol could not fully feed must be visibly different from one it could, without the
panel shouting, and without colour being the only thing that says so.

## Named rules

Quotable, and each one settles a real argument.

- **The Guest Rule.** Nothing of ours reaches past the shadow root, and nothing of the game's
  reaches in. `all: initial` on the host — plus prefixed custom properties, which `all: initial`
  does **not** reset.
- **The Token Rule.** A raw hex, pixel or radius in a rule is a bug. Every value comes from a token.
- **The Colour Never Alone Rule.** Colour never carries meaning by itself. It always accompanies a
  label, a number or a shape.
- **The Zero Is Not Unknown Rule.** Zero happened and measured nothing; unknown could not be read.
  They never share a glyph, a colour or a column.
- **The Suspect Is Adjacent Rule.** A mark sits next to the figure it concerns — never in a banner
  over the whole screen, and never on a cut of a figure that cannot carry it.
- **The Quiet Panel Rule.** Nothing animates, flashes, pulses or moves, and **nothing interrupts** —
  no `alert`, `confirm`, `prompt`, modal, overlay, stolen focus or sound. Detail appears on demand
  and disappears the same way.
- **The Section Is Its Own Size Rule.** A failure replaces its own section in place. It never blanks
  the panel and never resizes what still drew.
- **The Frame Is Not A Screen Rule.** A screenshot is a crop of a real screen. Two halves, held by
  different things: the tool **refuses to shoot** while `src/` carries uncommitted changes and
  records the commit beside the set, so "this came from a real build" is checkable. Whether the
  state shown is **reachable** is not checkable from a PNG, so it is a standing obligation rather
  than a rule: **open every picture before committing it.** v1 shipped four green shots of the same
  screen from a driver that clicked nothing, and the only symptom was three files of identical size.

## Colour

Dark-first, because the panel sits over a dark game client. There is no light theme: the host is
dark, and a light panel over it would be the brightest thing on the display.

### Surfaces

| Token           | Value     | Use                                                   |
| --------------- | --------- | ----------------------------------------------------- |
| `surface`       | `#17171c` | The panel body.                                       |
| `surfaceRaised` | `#1f1f26` | Title bar, tooltip, anything standing above the body. |
| `track`         | `#24242a` | The unfilled part of a bar.                           |
| `border`        | `#2c2c35` | Separations. Never a shadow where a border will do.   |

### Text

| Token       | Value     | Use                                                     |
| ----------- | --------- | ------------------------------------------------------- |
| `text`      | `#e7e7ea` | Figures and names.                                      |
| `textQuiet` | `#9a9aa6` | Labels, units, denominators — everything the eye skips. |
| `inkDark`   | `#14141a` | Ink on a light-enough bar.                              |
| `inkLight`  | `#ffffff` | Ink on a dark-enough bar.                               |

**Text on a coloured bar clears WCAG AA contrast, checked by a test rather than by eye.** Which of
the two inks a bar would take is computed from the bar's colour, not chosen by hand; nothing is
printed on a bar at present, and the pair is what proves the tint keeps every hue readable.

### Signals

| Token            | Value     | Means                                                         |
| ---------------- | --------- | ------------------------------------------------------------- |
| `ours`           | `#6fbf8b` | The reader's own side.                                        |
| `theirs`         | `#e0736f` | The other side.                                               |
| `suspect`        | `#c98500` | A figure that may be short.                                   |
| `UNKNOWN_COLOUR` | `#8a8a80` | Desaturated on purpose: unknown is the absence of a category. |

`ours` and `theirs` are **not** green-good and red-bad: they are two sides, and the panel takes no
view on which one the reader should be pleased about.

### The palette

Eight hues, spent on the professions and on nothing else, assigned by the game's own letter rather
than by rank, so the same profession is the same colour in every fight:

`#3987e5` `#008300` `#d55181` `#c98500` `#199e70` `#d95926` `#9085e9` `#e66767`

**A hue says who somebody is.** A cut of a figure — a kind of damage, a key health went out under,
the part the protocol named nobody for — is drawn in `UNKNOWN_COLOUR` and worded outright instead.
An opened row puts the two lists one above the other, and a fire row wearing a warrior's orange
there would be the panel answering a question nobody asked of it.

A bar is drawn at `barTint` `0.55` over `track`, which is what keeps eight saturated hues from
competing with the figures printed over them. The tint is measured rather than chosen: at full
strength the green clears only 3.71:1 against dark ink, under the 4.5:1 the floor asks for, and no
single ink clears every hue — tinting keeps the text on the panel's own surface instead, and the
worst pairing across the palette becomes 5.25:1. Past about 0.6 the green fails again.

## Typography

The panel inherits nothing and asks for nothing: no web font, no download, no layout shift. It uses
the reader's system UI stack, at one size, with weight and colour carrying the hierarchy instead of
scale.

- **Figures** — the reader's eye target. Full `text`, tabular where columns must align.
- **Names** — same size, same weight, `text`.
- **Labels and units** — `textQuiet`. A unit never competes with the number it qualifies.
- **Every line height is a whole number of pixels**, so every box in the panel lands on the pixel
  grid. A factor leaves a fractional line box, and a browser then rounds a bar and the glyphs on it
  apart — by a different fraction on every screen.
- **A row centres its ink, not its box.** Centring the line box leaves the ink high, because a
  face's ascent is taller than its descent, so a row carries the difference as padding above its
  contents. `text-box` would answer it too and is rejected: it clips the descenders off a Polish
  nickname. **ADR 0015.**
- **A count is spelled the way Polish spells it**, which is three ways, and that belongs to the
  words module rather than to a formatter.

## Space and size

A 2-pixel base, because the panel is dense and a 4-pixel base doubles its height for no gain in
legibility.

| Token            | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| `spaceHalf`      | `2px`                                                           |
| `spaceSmall`     | the base step                                                   |
| `spaceRegion`    | `5px` down the panel, `7px` across it — what insets a region    |
| `spaceWide`      | `8px`, which is also the inset the panel sits at                |
| `rowHeight`      | `18px`                                                          |
| `maxHeightShare` | `66vh`                                                          |
| `tipWidth`       | fixed, so a tooltip never reflows against its own content       |
| `lineHeight`     | `15px` — whole pixels, and what a counted card is multiplied by |
| `panelWidth`     | `260px` — narrow on purpose: the panel is a guest               |
| `panelInset`     | `8px` from the corner it is anchored to                         |
| `panelLayer`     | high enough to clear the game's own windows                     |

**Every row is the same height**, accent included. A row whose background is taller than its
neighbour reads as a different kind of row, and it is not one.

**The `66vh` cap is real and binds in play.** It is lifted only for a screenshot, and that is the
whole of the licence — see _The Frame Is Not A Screen Rule_.

## Shape and depth

| Token          | Value                         | Use                              |
| -------------- | ----------------------------- | -------------------------------- |
| `radius`       | `8px`                         | The panel, the tooltip.          |
| `radiusSmall`  | `3px`                         | Bars, and anything inside a row. |
| `windowShadow` | `0 6px 20px rgb(0 0 0 / 55%)` | The tooltip, off the page.       |

Flat first. Hierarchy comes from `surface` against `surfaceRaised` and from borders — the panel
itself is separated from the game by its border and by the bar standing over it, not by a shadow.
The single shadow lifts the tooltip off the page, which is the one thing here that floats over
something of ours.

## Components

**Title bar.** `surfaceRaised`, one line, always. It stands **over** the panel rather than inside
it, carrying the top two corners while the panel carries the bottom two, and it holds the name, the
version and the controls. It stays one line as the version number grows — a bar that wraps moves
everything below it, and `0.10.1` exists because one character of a version number did exactly that.
Where the fight is being fought is **not** on it: that is the header's, on a line of its own.

**A control says what a press would do**, never what the panel already is, so its mark and its
sentence both change with the state — where it has one. Folded, the panel is this bar and nothing
else: what stands under it is composed empty rather than composed and hidden, because a fight
redraws every few seconds. The fold is the outermost thing on the bar in every window a reader has
met, so the other three stand left of it: the shelf, then the two that hand the fight over. Those
three have no state to say, so their marks read the same always.

**Header.** What the fight is, as a headcount, and how it went. Where it is being fought goes on a
second line and nowhere else: beside the headcount a map's name plus a tile had about thirty
characters of a 260-pixel panel, so the one thing answering _where_ was the one thing being cut.

**Ranking row.** A place in the ranking, a name, a figure and its share. The bar is an element
behind the text at `barTint`, with a three-pixel cap at full strength on the edge it starts from:
the tint is what keeps the figures printed over it readable, and the cap gives the hue back where no
text sits. **Its length is the row against the biggest figure on screen**, never against the whole —
the top row of a ten-person fight is a full bar, and the share in brackets is what states the
fraction.

⚠️ **The row says a profession in its hue and in nothing else.** Six professions cannot be made
mutually distinguishable by hue on this background, so a reader who cannot separate two of them has
nothing else in the row to read: the answer is stated once, in the one channel colour vision
carries. `ARCHITECTURE.md` carries this under its known gaps.

**Pinned row.** Stands apart from the ranking, below it and outside the list, for figures that
belong to no combatant. It is a row, not a footnote: same height, same shape — with a dashed rule
cutting it off the ranking and a hatched bar, because it is not a combatant and must not look like
one at a glance.

**Shelf row.** A fight already fought, as a row of the same height as a ranking's: when it was, how
big it was, where, and how it went, in that order — the place is the only cell allowed to shorten,
so it stands second to last. The fight going on now is a row like the rest and is drawn once: while
it is both the live one and a kept one, it keeps the live row's wording and the kept row's pin.

**The pin is inside the row and is not part of it.** It is the one control that outranks the row it
sits in, and it does so structurally: a press lands on the innermost element, and the pin is left
out of what carries the row's own mark. It is a box of the row's own height rather than a glyph,
because ★ and ☆ are not one width on every platform, and a row that resized under the hand that had
just pressed it is what a box fixes. A pin is drawn only where there is something to pin — a fight
nothing has written down yet is not in the rotation, and a control that does nothing is worse than
one that is not there.

**Where the shelf is kept is a strip, under the way back and over the list.** The three answers
stand in the order they keep longest, behind a word that says what they answer, because three
choices side by side are three words nobody can order without being told what they are about. It is
the only strip drawn while the shelf is up, and it is about the list rather than about a fight.

**Three levels, and the third has two shapes.** The ranking lists people; pressing one opens their
own figure cut by the other end of each movement, by what it was announced with, and by what it was
made of; and pressing a row inside **that** opens the third — the pair and what passed between the
two, where a person was pressed, or whom it reached, where an announcement was. Both are entered
from the second level and neither from the other, so the panel is never more than three deep.
Nothing on the third opens: the protocol states no further cut of it. A row opens only where the
level under it would say something the row does not — a pair whose every blow was unannounced and of
one kind is the figure just pressed under another heading, and pressing it would spend a gesture on
nothing. Which kind of row that comes to on each screen is `docs/drill-levels.md`'s to say, and it
is measured rather than claimed.

**A row that opens says so, and a row that does not stays silent about it.** Half the rows of one
section leading somewhere and none of them saying which is a panel that teaches a reader to stop
pressing: the cursor is the only other answer, and it is read after the gesture rather than before
it. So the instruction rides the detail every row already opens on hover, at every level and not
only on the ranking — and it is never printed where pressing does nothing, because an affordance
that lies is worse than none.

**Every column of shares comes to a hundred.** A section that is drawn accounts for the whole of the
figure over it, and a reader who adds a column and gets ninety-four cannot tell a missing figure
from a figure that was never there — telling those two apart is what this panel is for. What the
named rows do not hold is accounted for in one of two ways, and which one turns on whether the game
said anything about it. **On the damage screens it closes into `Zwykły cios`**, because a swing the
game granted no ability to is all the game says. **On the healing screens it does not close at
all**: health that moved outside an announcement still moved under a key the game named, so the
section lists those keys by name and there is nothing left over. A row saying the game had not told
us, where the game had, is a claim — and the keys were already on screen a section lower.

**A row states nothing as `0%` and anything at all as at least `<1%`**, and the two are never
swapped: `0%` is a measurement — this combatant did nothing — and `<1%` is a figure too small to
carry a point. A `<1%` row spends no point of the column, so the shares printed beside it still come
to a hundred. Both rules are held by `tests/ui/share-column.test.ts`, over every recording, screen,
seat and rung.

**A cut that only repeats the figure above it is not drawn.** The section a level is _about_ is
always drawn; the cross-sections beside it answer to this. The exemption is the row that closes a
skills section, and only where it counts something: `Zwykły cios 2 644 (100% · ×8)` says eight blows
where the figure above says none.

**Section heading.** Over each cut of an opened figure, carrying the figure it stands over, and
stuck to the top of the list while its own section scrolls: a figure read under the wrong heading is
the one thing a drill must never allow. Its quiet is a composited colour rather than an `opacity`,
because an opacity would let a bar ghost through it.

**Summary bar.** The fight's own strip. This is where a gap that names nobody is said, because no
row can carry it. It is a reading's summary, **not** a banner — the distinction is that it always
shows, rather than appearing when something goes wrong.

**Tab strips.** Two rows, three questions: which quantity on the upper, then which way round and
whose rows sharing the lower — the direction against the left edge and the sides against the right,
held apart by a gap that is a node rather than a margin, because it is absent with the direction it
follows. They share a row because the vertical budget is the list's: every strip is a row of the
ranking the reader does not get. Quiet until hover or current; the current one is marked by more
than colour, standing on `surfaceRaised`. The nouns are upper case and the directions lower, because
two strips of equal weight read as two lists of the same kind of thing and these are not. The sides
are drawn only where the client said which side is the reader's own, so a strip is never offered
that cannot tell the sides apart. While the shelf is up nothing on any strip is marked: the shelf
covers the screens rather than being one of them.

**The list.** The one region that scrolls and the one that gives way when the ceiling is lower than
the panel wants to be. An opened row grows it to what its cuts need and never shrinks it below the
ranking it was opened from, so pressing a row cannot shorten the window under the hand. Every other
region says the same thing at any height, so there is nothing to take off them. Its height is
arithmetic — the rows it promises times what a row costs — so changing the type size cannot quietly
break the promise: eleven bars under everybody, ten under a side, and never fewer once a row is
opened, because pressing a row must not shorten the window under the hand. Its scrollbar gutter is
reserved whether or not a scrollbar shows, and the two regions drawing a bar outside it reserve one
too, so a bar means the same length in all three.

**Tooltip.** `surfaceRaised`, fixed width, opens on hover and follows the cursor's vertical
position. It states its own type and its own ink, because `all: initial` on the host reaches it and
the panel's own rules do not — a region hanging off the root that paints a ground and leaves the
rest to inheritance is drawn in the browser's serif, in black. It opens on whichever side of the
panel has room for it — to the left while the panel sits in its corner, and to the right once the
panel has been dragged far enough left that a leftward tooltip would be drawn off the screen. Its
vertical position is clamped between the inset and the viewport's foot, and where the two cross the
top edge wins: a window hanging off the bottom beats one whose first line is off the top.

**Nothing here is measured off the document.** The page states its own size, the pointer states
where it is, and the height is arithmetic — the lines the draw counted times what a line costs, plus
the rule and the air each run of them spends over itself. A wrapping sentence is counted at a floor
of characters per line, so the count is never short: a card reserving a line it did not need stands
higher up the screen, which is the direction that keeps it on one.

**On a ranking row the tooltip is a card.** The name in full, then what they are and how far along
on one line under it — which is where the hue on the bar is finally said in words, and the only
place it is. Then all four figures rather than the one the screen is showing, with that one in bold;
under each, the part of it the protocol named only that row's end of; then how they fought, then
what the screen itself asks about, and last what qualifies every figure above. A figure stated
before reduction carries the sentence that says not to subtract it. Nowhere else is it a card: a
skill, a kind, a fight on the shelf and a row inside an opened figure each get the name their own
cell had to cut.

**One run of the card is the screen's, and only that one.** The screen about striking states the
criticals as a share of the blows struck, the hardest blow, what else fired, and what those blows
destroyed on the other side — under a heading, because points of armour and percentage points of
resistance are two quantities and never one sum. The screen about being struck states what a defence
stopped with the defences it is made of under it, what fired on that combatant's side of somebody
else's blow, and the hardest blow that reached them. Both healing screens state nothing there: the
protocol says less on that side and a run invented to match would be matched out of nothing. **ADR
0019.**

**A line of a card never folds.** Its height is arithmetic and a stat line is counted as one, so a
label too long for the column is cut with an ellipsis rather than wrapped — a card that folded a
line would stand lower on the screen than it was measured for, which is the one direction that takes
it off the bottom.

**The panel is moved by its bar.** The grip says so before anybody tries it, and the whole bar is
the handle — except its controls, where a press is that control's. A title bar's worth of the panel
always stays on screen, because what goes off the edge with it is the thing you grab, and the only
remedy left would be clearing storage. Where the reader put it survives a reload; a page that will
not say how big it is is not dragged from a guessed origin at all.

**Suspect mark.** Rides the row it was named for, at every drill level, in `suspect` plus a glyph.
It says a figure may be short and never says by how much.

**Undrawn marker.** Replaces one section in place, at that section's size, in `textQuiet`. It is the
least interesting thing on screen on purpose.

## Motion and interaction

- Nothing animates. No transition, no fade, no pulse, no reveal.
- Events are delegated at the root, never bound per row, so re-rendering cannot lose a handler and a
  click during a redraw is not swallowed.
- Hover shows detail; leaving hides it. There is no state a reader can get stuck in.
- Nothing interrupts: no `alert`, `confirm`, `prompt`, modal or overlay, no stolen focus, no sound.

## Accessibility

- WCAG AA contrast on every text-over-colour pairing, held by a test.
- Colour is never the only signal — _The Colour Never Alone Rule_.
- The panel is keyboard-reachable and does not trap focus.
- A reader who has asked for reduced motion loses nothing, because there is no motion.

## Do

- Spend a token, always.
- Put a warning where its consequence is.
- Let the game be the loud thing on the screen.
- Keep every row the same height.
- Show the reader what could not be read.

## Don't

- Add a raw colour, radius or pixel to a rule.
- Signal anything with colour alone.
- Animate, flash, or move something the reader did not touch.
- Blank the panel because one section failed.
- Photograph a state the panel cannot be in.
- Let a figure that might be short look exactly like one that is not.
