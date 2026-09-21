# Design system: the quiet instrument

## What this document is

**A specification, not a description.** The tokens below are carried from the panel v1 shipped
(`git show v0.10.1:src/ui/panel-look.ts`) and the rules from what that panel had to satisfy. Nothing
here is evidence that anything is drawn yet — `ARCHITECTURE.md` carries what exists, and what of
this document the tree does not yet meet.

## North star

MargoMeter is an **instrument sitting on somebody else's screen**. It is not a product surface
competing for attention — the game is what the reader is looking at, and the panel is what they
glance at between turns. Everything below follows from that: dark, dense, still, and legible at a
glance without being loud.

The visual system carries one job that ordinary design systems do not: **it has to show suspicion**.
A figure the protocol could not fully feed must be visibly different from one it could, without the
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
| `surface`       | `#0f161d` | The panel body.                                       |
| `surfaceRaised` | `#171e25` | Title bar, tooltip, anything standing above the body. |
| `track`         | `#1b232a` | The unfilled part of a bar.                           |
| `border`        | `#232b33` | Separations. Never a shadow where a border will do.   |

### Text

| Token       | Value     | Use                                                     |
| ----------- | --------- | ------------------------------------------------------- |
| `text`      | `#e3e7ea` | Figures and names.                                      |
| `textQuiet` | `#979fa8` | Labels, units, denominators — everything the eye skips. |
| `inkDark`   | `#0d1319` | Ink on a light-enough bar.                              |
| `inkLight`  | `#ffffff` | Ink on a dark-enough bar.                               |

**Text on a coloured bar clears WCAG AA contrast, checked by a test rather than by eye.** Which of
the two inks a bar would take is computed from the bar's colour, not chosen by hand; nothing is
printed on a bar at present, and the pair is what proves the tint keeps every hue readable.

### Signals

| Token            | Value     | Means                                                         |
| ---------------- | --------- | ------------------------------------------------------------- |
| `ours`           | `#00d083` | The reader's own side.                                        |
| `theirs`         | `#ff8685` | The other side.                                               |
| `suspect`        | `#ed9c00` | A figure that may be short.                                   |
| `caveat`         | `#6bb5ff` | A figure answering a narrower question than its label.        |
| `defect`         | `#ed78ff` | What the panel itself could not do.                           |
| `UNKNOWN_COLOUR` | `#9299a0` | Desaturated on purpose: unknown is the absence of a category. |

`ours` and `theirs` are **not** green-good and red-bad: they are two sides, and the panel takes no
view on which one the reader should be pleased about. **They are this sheet's names and nothing
else's**: `CONTEXT.md` puts `ours` on **Side**'s `_Avoid_` list, so what the panel _reads_ calls the
two `reader` and `opposing`, and these two words stop at the stylesheet.

`defect` is a magenta because every other family already means something here: green and red are the
two sides, amber is a suspicion about a figure, grey is the absence of a category, and the six below
are the professions. Measured 2026-09-15 on Euclidean distance in sRGB, it sits 124 from its nearest
neighbour among the twelve this sheet spends, and clears 7.57:1 against the panel, over the 4.5:1
the floor asks of text.

`caveat` is a blue. Measured the same day and the same way, `#6bb5ff` sits 106 from its nearest
neighbour, and clears 8.40:1 on the panel, 7.75:1 on a card and 7.33:1 on a row. It needed an ink at
all because the one it had was the label's: a glyph in `textQuiet` standing beside a label in
`textQuiet` is a mark nobody sees.

**No signal and no profession share a hue, and the closest pair of the twelve stands 64.6 apart.**
That is the rule this sheet is held to rather than a happy result: `suspect` and the palette's
fourth colour were once the same value, at a distance of nought, and the exemption written here to
excuse it — that one lived in a bar and the other beside a figure — was held by nothing.

### The palette

Six hues, one per profession and spent on nothing else, assigned by the game's own letter rather
than by rank, so the same profession is the same colour in every fight:

`#157cd0` `#3f8e2b` `#bb4a7f` `#9d6f00` `#008e71` `#c2502b`

**Six, because the game has six.** The register carried eight until 2026-09-15 and `PROFESSION_HUES`
spent six of them; the two nobody drew were a hue waiting for a profession that does not exist, and
one of them stood 15.6 from `theirs` (**C9**).

**A hue says who somebody is.** A cut of a figure — a kind of damage, a key health went out under,
the part the protocol named nobody for — is drawn in `UNKNOWN_COLOUR` and worded outright instead.
An opened row puts the two lists one above the other, and a fire row wearing a warrior's orange
there would be the panel answering a question nobody asked of it.

A bar is drawn at `barTint` `0.55` over `track`, which is what keeps six saturated hues from
competing with the figures printed over them. The tint is measured rather than chosen: at full
strength the blue clears 4.35:1 at best against either ink, under the 4.5:1 the floor asks for, and
no single ink clears every hue — tinting keeps the text on the panel's own surface instead, and the
worst pairing across the palette becomes 6.12:1. Past 0.77 the blue fails again. Measured
2026-09-15.

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
| `spaceSmall`     | `4px` — the base step                                           |
| `spaceRegion`    | `5px` down the panel, `7px` across it — what insets a region    |
| `spaceWide`      | `8px`, which is also the inset the panel sits at                |
| `rowHeight`      | `18px`                                                          |
| `maxHeightShare` | `66vh`                                                          |
| `tipWidth`       | `250px` — a maximum, and a card is as wide as what it says      |
| `lineHeight`     | `15px` — whole pixels, and what a counted card is multiplied by |
| `panelWidth`     | `260px` — narrow on purpose: the panel is a guest               |
| `panelInset`     | `8px` — the air a panel keeps from an edge it is pushed against |
| `panelLayer`     | high enough to clear the game's own windows                     |

**Every row is the same height**, accent included. A row whose background is taller than its
neighbour reads as a different kind of row, and it is not one.

**A panel nobody has moved opens in the middle of the window.** It is the reader's own screen and
the panel is the thing they came for, so it is put where they are already looking rather than in a
corner they have to find. It is centred on `maxHeightShare` and not on the height it happens to
have: a panel centred on its waiting bar walks down the screen as the rows arrive. Dragged once, it
is wherever they left it, and that is what is kept. Where the page states no size there is nothing
to centre against, and the sheet's own corner at `panelInset` stands instead. **ADR 0029.**

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
met, so the other two stand left of it: the shelf, then the one that hands the fight over. Those two
have no state to say, so their marks read the same always.

**Header.** What the fight is, as a headcount, and how it went. Where it is being fought goes on a
second line and nowhere else: beside the headcount a map's name plus a tile had about thirty
characters of a 260-pixel panel, so the one thing answering _where_ was the one thing being cut.

**Ranking row.** A place in the ranking, a name, a figure and its share. The bar is an element
behind the text at `barTint`, with a three-pixel cap at full strength on the edge it starts from:
the tint is what keeps the figures printed over it readable, and the cap gives the hue back where no
text sits. **Its length is the row against the biggest figure on screen**, never against the whole —
the top row of a ten-person fight is a full bar, and the share in brackets is what states the
fraction.

**A row says which side it stands on, on the edge opposite the cap.** The left three pixels are the
profession's — the bar's cap at full strength — and the open row's inset shadow is on that side too,
so the side takes the right edge: **left says who somebody is, right says whose side they are on.**
A two-pixel rule in `ours` or `theirs`, inside the row's own overflow, spending no width the name
could have had. It is drawn on every level a person stands on and in the window beside the panel,
never on a row with nobody behind it, and **never at all on a fight the client named no side of the
reader's own on** — a panel that cannot place somebody says nothing rather than drawing a grey
answer.

**A row that names two things says which of them gives way.** In the window beside the panel, the
row for whoever is holding somebody carries three cells: the holder's name, the okrzyk they hold
with in the quiet ink, and the cast's turns. The name is sized by its own text, the turns do not
fold, and the **okrzyk** is what shrinks — down to a floor it never goes under, because a cut that
leaves nothing says less than no okrzyk at all. The panel's ordinary rule gives the name whatever is
left over instead, which on this row drew a nickname at three pixels. The measurements and the floor
are `src/ui/panel-look.ts`'s, beside the rule they set. **ADR 0097.**

The rule is colour, so it carries a word: the card names the side in full — `Mag (120) · My` — which
is what _Colour Never Alone_ asks and what the strip under the list already anchors the two inks to.
The lightness of the name was measured and refused instead: a row's name sits over its own bar, and
over the worst bar in the palette the plain ink clears the AA floor at 6.12 while the quiet ink
reaches 2.84 against 4.5, with the last neutral grey that clears it indistinguishable from plain
(measured over the whole palette, 2026-09-15). **ADR 0065.**

⚠️ **The row says a profession in its hue and in nothing else, and that is a decision.** Six
professions cannot be made mutually distinguishable by hue on this background, so the hue is a hint
and the card a reader opens by pointing is the answer — it names the profession in words. A second
channel in the row was tried and removed on 2026-08-29: a letter beside every name took width from
the one cell that has to shorten, to say a thing the card already said. **ADR 0023.**

⚠️ **What that refusal measures is _every row_, and until 2026-09-15 nothing here measured it.** The
three marks below stand on the exemption it grants, and each says it reaches some rows rather than
all of them; none of them said how many, and a name the panel shortens is cut with an ellipsis,
which overflows no box. `tests/e2e/panel-marks.spec.ts` now asks the rows actually paying: a name on
a row wearing a mark is shown whole, or the mark took it.

**The ranking marks whose turn it is**, before the name, on the one row the game is numbering. It
stands on the same argument as the suspect mark below: a mark that reaches one row is not the second
channel the paragraph above refuses, which would stand on every row to say a thing the card already
says. `▸` measures 9.53px in Chrome 152 on 2026-09-15, against 13.88 for the suspect mark the panel
already carries — and it toggles against nothing, which is what ★/☆ failed at. A fight already over
numbers nobody's turn and a fight read off the shelf is a moment that has passed, so both draw no
mark at all. **ADR 0066.**

**A row whose figure means less than its label wears the caveat mark**, in the same place and on the
same argument, and the two stand together where a row earns both. It costs a row 14px in Chrome 152
on 2026-09-15 — a 10px ring and the air after it — against 13.88 for the suspect mark and 9.53 for
the turn mark, and it is the one mark whose cost is held rather than reasoned about: what every row
wearing it takes off a level's longest skill name is `tests/e2e/panel-marks.spec.ts`'s to say.
**ADR 0089.**

**And it is the one mark this panel draws rather than spells.** `ⓘ` was a codepoint until
2026-09-15, when it was measured at 5.5px of ink against 8.67 for `O` at the panel's own 11px — and
at the same 5.5 under `system-ui`, `sans-serif`, DejaVu Sans, Liberation Sans, Noto Sans, Arial,
Segoe UI, Cantarell and Ubuntu alike, none of them carrying U+24D8 and every one falling back to a
single condensed face. What a reader met beside a figure was a vertical sliver. A ring with a border
is a circle wherever the panel is opened, which a codepoint is not — and the figure this page had
been quoting all along was the **cell**, which kept its width whatever shape stood inside it.
**ADR 0092.**

**A row whose own figure is short wears the suspect mark**, before the name and drawn only there. It
is not the second channel the paragraph above refuses: that one would stand on every row to say a
thing the card already says, and this stands on the rows a suspicion actually reaches — none of the
rows in `captures/`. What it opens onto is the sentence naming whose figure is short, which the
sentence under the list cannot: that one qualifies every row at once, and a reader looking at one of
them had no way to ask whether it meant theirs. _Put a suspicion where its consequence is._

**Pinned row.** Stands apart from the ranking, below it and outside the list, for figures that
belong to no combatant. It is a row, not a footnote: same height, same shape — with a dashed rule
cutting it off the ranking, which is the region's own and says it stands outside the list.

**A row with no place in the ranking wears a hatched bar, wherever it stands.** The pinned row is
one of them and not the only one: rows stand _inside_ the list with a number cell left blank, and a
blank cell is not an accent — it is read as the next place in the order. So the hatch follows the
claim rather than the region: `person`, `skill`, `source`, `kind` and `closing` rows take a place
and keep a solid bar; `half-named`, `no kind` and `neither end` take none and are hatched, as is the
row summing what a bound left out. `docs/drill-levels.md` owns which kinds those are.

**A row takes a place when it names something the game named.** That is the whole of the test, and
it is why `closing` changed sides on 2026-09-12: the row holds the blows the game numbered a turn
for and named no skill to, which is the default action its own help describes — not a figure we
could not place. What earns the hatch is a claim about **absence** (`half-named`, `neither end`), a
remainder its own cut does not explain (`no kind`), or a **sum of several** rows a bound would not
draw, whose figure grows with how many we could not fit rather than with what any one of them did.
**ADR 0079**, and what it costs is there: over `captures/` on 2026-09-12 the closing row stands
first in **145 of the 289** sections that draw one.

It spends nothing to say it — no height, no width, no hue, and no second glyph the row would have to
shorten a name for (**ADR 0023**). It is a shape, so _Colour Never Alone_ is satisfied twice over:
every one of these rows is already labelled in words.

**Outside the ranking.** A section under the pinned rows, over the summary bar, standing under the
same dashed rule they do — because it says the same thing about itself: what is below the rule is
not in the list. It carries a heading where they do not, so a reader meeting a figure belonging to
nobody is told what the section is before they read the number.

**It is drawn only where there is a figure for it**, and there is one only where the screen's own
count and the rows disagree. A section standing empty under every fight would be a claim the panel
makes about all of them; one that appears is the panel saying _this much of the screen is not on any
row above_, which nothing else here can say. Its row takes no place and wears the hatch, by the same
test every other placeless row is judged by: its figure grows with what we could not put anywhere
rather than with what anybody did. It opens nothing — what it is made of is the one thing nobody can
state about it.

**Shelf row.** A fight already fought, as a row of the same height as a ranking's: when it was, how
big it was, where, and how it went, in that order — the place is the only cell allowed to shorten,
so it stands second to last. The fight going on now is a row like the rest and is drawn once: while
it is both the live one and a kept one, it keeps the live row's wording and the kept row's pin.

**When it was is a day and a time, on every row** — `13 wrz 21:05`, the month as a word and the day
in two digits, so the cell is one width whichever day it falls on. A shelf holds twenty fights and a
pinned one outlives the rotation, so a column of bare times is several days reading as one evening.
The place is what pays for the width, on every row and not only on the rows that span days, and it
pays enough that **on a dated row the place is a hint and the tip is the answer** — the name the
cell had to cut is drawn whole there. **ADR 0084** carries the measurement.

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
two, where a person was pressed, or whom it reached, where a skill, a key or a kind was. Both are
entered from the second level and neither from the other, so the panel is never more than three
deep. Nothing on the third opens: the protocol states no further cut of it.

**A pinned row opens too, onto its own second level.** It stands under the ranking rather than on
it, so what it opens is a branch beside the one a person's row opens: two sections, and nothing
under either. The first is the end the game **did** name, person by person, headed by the row and
not by the screen — so `Otrzymane` heads its two pinned rows differently (**ADR 0038**). The second
is what the figure was dealt with, headed like any kind cut, and it is the section a reader came
for: the row names nobody, and this is the question it can still answer (**ADR 0039**).

**Both of its sections open, and onto each other.** A person there opens onto the keys their own
share moved under, a key onto the people carrying it — one fold read both ways round, so neither is
a figure the other cannot be checked against. That is this branch's third level, and like the other
branch's it opens no further.

**Every row with a level under it opens, and only what has none stays shut.** A cut of one row is
not a repetition to be spared: it states what the figure over it was made of, which the heading
never does. What decides the answer is whether the statistics keep a second cut of that row — and
where they do not, the row wears the leaf's cursor and its card promises nothing. Which kind of row
that comes to on each screen is `docs/drill-levels.md`'s to say, and it is measured rather than
claimed. **ADR 0034.**

**A row that opens says so, and a row that does not stays silent about it.** Half the rows of one
section leading somewhere and none of them saying which is a panel that teaches a reader to stop
pressing: the cursor is the only other answer, and it is read after the gesture rather than before
it. So the instruction rides the detail every row already opens on hover, at every level and not
only on the ranking — and it is never printed where pressing does nothing, because an affordance
that lies is worse than none.

**The way back says both gestures, and it is the only thing that does.** A level is left by a press
on the crumb or by a press of the other button anywhere on the panel, and the second is the cheaper
of the two because it needs no aiming. The crumb is drawn only where a level is open, so a card
standing on it is read at a moment when both do something — which is the condition above, met where
a row on the ranking cannot meet it. That is why the right press is named there and on no row's
card. **ADR 0086.**

**Every column of shares comes to a hundred.** A section that is drawn accounts for the whole of the
figure over it, and a reader who adds a column and gets ninety-four cannot tell a missing figure
from a figure that was never there — telling those two apart is what this panel is for. What the
named rows do not hold is accounted for in one of two ways, and which one turns on whether the game
said anything about it, and **both ways are on every screen** since **ADR 0080**. Health that moved
outside an announcement moved under a key the game named, so the section lists those keys by name;
what is left over is blows the game granted no skill to, which is all the game says about them, and
on the damage screens that closes into `Zwykły cios`. A row saying the game had not told us, where
the game had, is a claim.

⚠️ **A key stands in two sections of one screen, and that is the price.** It is named here, among
what a figure was dealt **with**, and again a section lower among what it was **made of** — the same
word and the same number twice. The alternative was worse and is what the panel did until
2026-09-13: fold it into a row named for a swing, where a quarter of `Otrzymane` stood under a word
for something it was not. A figure counted twice in one column would break the rule above; these are
two columns, each coming to a hundred of its own figure.

**A row states nothing as `0%` and anything at all as at least `<1%`**, and the two are never
swapped: `0%` is a measurement — this combatant did nothing — and `<1%` is a figure too small to
carry a point. A `<1%` row spends no point of the column, so the shares printed beside it still come
to a hundred. Both rules are held by `tests/ui/share-column.test.ts`, over every recording, screen,
seat and rung.

**Every cut that holds a row is drawn, however few rows it holds.** A section of one row states the
figure over it a second time and states what that figure was made of: `Zwykły cios` says how many
blows where the heading says none, a lone announcement says which skill it was, and a lone key says
the game's own word for what moved the health. The heading carries a figure and never a name, so the
one row under it is the answer and not an echo. **ADR 0034.**

**Section heading.** Over each cut of an opened figure, carrying the figure it stands over, and
stuck to the top of the list while its own section scrolls: a figure read under the wrong heading is
the one thing a drill must never allow. Its quiet is a composited colour rather than an `opacity`,
because an opacity would let a bar ghost through it.

**A heading says what its level is cut by, and never which row was opened.** The crumb over it has
just said whose figure this is and which part of it stands open, so a heading repeating that name
spends the width twice and grows as long as whatever the game called the skill. Five headings, all
of them constants, and none of them longer than `TYP OBRAŻEŃ`.

⚠️ **A figure never folds.** It is one word — the gap between its thousands is a space that offers
no place to break — and the cell it stands in never gives way; the words beside it are what
shortens, cut with an ellipsis. A figure that broke across two lines in a row 18 pixels tall was
read as a number half its size, which is worse than a figure not drawn at all.

**Summary bar.** The fight's own strip. This is where a gap that names nobody is said, because no
row can carry it. It is a reading's summary, **not** a banner — the distinction is that it always
shows, rather than appearing when something goes wrong.

**Strips.** Two rows, three questions: which quantity on the upper, then which way round and whose
rows sharing the lower — the direction against the left edge and the sides against the right, held
apart by a gap that is a node rather than a margin, because it is absent with the direction it
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
opened, because pressing a row must not shorten the window under the hand. It scrolls without
drawing a scrollbar, so it gives up no width to one, and neither does either region that draws a bar
outside it: a row is inset equally on both sides and a bar means the same length in all three. **ADR
0031.** And it keeps the place a reader scrolled to: a payload arriving, a fold, or a level opened
and left behind all give the list back where they found it, and a level opened for the first time
starts at its top. **ADR 0050.**

**Tooltip.** `surfaceRaised`, **as wide as what it says up to a stated bound**, opens on hover and
follows the cursor's vertical position. It states its own type and its own ink, because
`all: initial` on the host reaches it and the panel's own rules do not — a region hanging off the
root that paints a ground and leaves the rest to inheritance is drawn in the browser's serif, in
black. It opens beside the window whose row it names — the panel, or the window standing beside it —
and beside **that** window alone: to its left while there is room there, and to its right once there
is not. **The side is decided by the bound and never by this card's own width**, or a card of two
words would find room where the card before it found none and a reader crossing two rows would watch
it jump the window. What is pinned is the edge **facing** that window, so a card stands the same gap
from the rows it explains at whatever width it draws. Neither window reads where the other is
standing. **ADR 0090**, **ADR 0091.** Its vertical position is clamped between the inset and the
viewport's foot, and where the two cross the top edge wins: a window hanging off the bottom beats
one whose first line is off the top.

**Nothing here is measured off the document.** The page states its own size, the pointer states
where it is, and the height is arithmetic — the lines the draw counted times what a line costs, plus
the rule and the air each run of them spends over itself. A line that wraps is counted at a floor of
characters per line, so the count is never short: a card reserving a line it did not need stands
higher up the screen, which is the direction that keeps it on one.

**The width is the sheet's, and it is the one thing here nobody counts.** A card is laid out at its
content's own width under the bound, so what decides it is the browser's own type metrics — which
differ by the machine the reader is on, and which no arithmetic in this tree could stand in for. The
height arithmetic survives it: a card is narrower than the bound only where every line on it already
fits one, so the floor above is never counting a wrap the card no longer has. **ADR 0091.**

**A card taller than the window gives up a run rather than being cut around.** The block of the
fight's own figures stands whatever the window, and so do the notes — a suspicion is a claim about a
figure above it — so what goes is the counters and the runs between them, the last one first, at a
run's own edge and never inside one. A card that gave anything up says so, in one sentence. Nothing
scrolls: the card takes no pointer, because a press on it belongs to the row underneath.
**ADR 0054.**

**Wherever a person's row stands in the panel, the tooltip is a card.** The name in full, then what
they are and how far along on one line under it — which is where the hue on the bar is finally said
in words, and the only place it is. Then the figures of the whole fight under a heading naming that
scope — every one they have rather than the one the screen is showing, with that one in bold, and
the screen's own standing even at nought while the others do not: a screen showing somebody at
nothing has to say nothing, and the rest at nought answer nobody. Under each, the part of it the
protocol named only that row's end of; then how they fought at each end, and last what qualifies
every figure above — **the gaps naming this person, and no others** (**ADR 0069**): one naming
nobody is said under the ranking, once.

**Every block is cut by what its figures are a sum over, and its heading names that.** A figure
stated before reduction stands in the run of the end it belongs to and never under a figure of the
whole fight, which is a sum over more messages than it is: drawn there it read as a part of the
number above it and was smaller than that number on a quarter of the cards the recordings compose.
It is worded as what the protocol **stated** rather than as a scope, because a scope would be a
claim about coverage the protocol does not keep. The sentence it still carries names no pair of
figures — it states what the game does not report and leaves every subtraction a reader might try
void at once, because one named pair licenses the rest by omission. A count sharing a block with a
figure of damage wears the sign that marks it a count. **ADR 0087.** **A card whose row states a
narrower figure says so**, in one sentence under the suspicions and over the instruction: the card
is about the person and its figures are the fight's, while the row it stands over is one cut of
them. Nowhere else is it a card, because nowhere else is there a fight's worth of figures to compose
one from: a skill, a kind, a fight on the shelf and every person standing in the window beside the
panel each get the name their own cell had to cut, whole and over as many lines as it takes.

**A row in the window beside the panel is answered by what it cut, and not by a card.** That
window's reading carries no figure of the fight, so there is no card to compose there — what stands
instead is the name whole, the okrzyk or the skill the row is about under it, and the turns the row
states. It reaches **every row that window draws** and not its person rows alone: a rule about the
kind of thing a row names is held by whoever remembers it, while a rule about its rows is held by a
walk over them. **ADR 0098**, widened by **ADR 0100**.

**A blow being made ready is a row like any other, so it answers the same way.** Its name folds
whole, and under it stands whoever is making it ready — which is the one place that person is named
in words, the row having only their hue — with what became of the blow beside them at either end.
Then the turns the client's own envelope states, under the word a cast's card uses. The band's
heading says what became of the first charge; each card says what became of its own. **ADR 0100.**

**A row the protocol left an end of says which end, and where its figure stands.** It is not a card
and names nobody — that is what the row is — but the two lines every leaf gets are not an answer to
what a reader is looking at. Under the ranking it says three things: what the game did not state,
whether the figure is already counted in the list above it, and — only where a side is showing —
what the shown team is to it. Inside an opened figure and under an opened part it says the first
alone: the other two are about a ranking and a side, and neither level has one. **ADR 0038.**

**And under the ranking it also states what that figure was dealt with**, in a run of its own
between the figure and the sentences: the same rows the level under the row draws, ranked the same
way and worded by the same table, so the card is that level seen early rather than a second reading
of it. What will not fit on the card is summed into one line rather than dropped, because a run
short of the figure over it is a run that misstates it. **ADR 0041.**

**Both runs stand, on every screen, each under the heading naming its end.** The run about striking
states what the protocol stated before reduction, the criticals as a share of the blows struck, what
else fired, and what those blows destroyed on the other side — under a heading of its own, because
points of armour and percentage points of resistance are two quantities and never one sum. The run
about being struck states the same figure before reduction, what a defence stopped with the defences
it is made of under it, and what fired on that combatant's side of somebody else's blow. **Neither
run states a hardest figure**: the one the aggregate holds is not scoped to blows, and a heading
naming blows over it was a claim the figure does not keep (**ADR 0088**). Which end a key belongs to
is read per key and never off its sign, so the heading is what says whose each line is. A run that
came to nothing is not drawn, and neither is its heading. **ADR 0032.**

**A count a second key narrows is one row, with the narrower count under it.** The row states what
the mechanic came to and the line below it says how much of that was the narrower thing — the
criticals with the ones off the auxiliary weapon under them, the deep wounds with the weakened ones.
Two rows in place of that made a reader add them to answer the question the mechanic's own name
asks, and on a combatant whose every wound was weakened the row answering it was not drawn at all.
**ADR 0095.**

**A figure's line never folds, and the words a card opens with always do.** The height is
arithmetic, and what decides which way a line goes is whether the arithmetic counts it: a stat line
and a heading are counted as one, so a label too long for its column is cut with an ellipsis rather
than wrapped, and `MAXIMUM_LABEL_CHARACTERS` is where that bound sits. The name, the line under it
and the sentences at the foot are counted at the lines they fold to, so they fold — the name on a
**lower** floor than the rest, because it alone is drawn bold and bold is wider. A line that folds
uncounted is what stands a card lower on the screen than it is tall, which is the one direction that
takes it off the bottom. **ADR 0096.**

**The panel is moved by its bar.** The grip says so before anybody tries it, and the whole bar is
the handle — except its controls, where a press is that control's. A title bar's worth of the panel
always stays on screen, because what goes off the edge with it is the thing you grab, and the only
remedy left would be clearing storage. Where the reader put it survives a reload; a page that will
not say how big it is is not dragged from a guessed origin at all.

**Suspect mark.** Rides the row it was named for, at every drill level, in `suspect` plus a glyph.
It says a figure may be short and never says by how much.

**Caveat mark.** Rides the figure whose label names more than the figure counts, in a glyph of its
own and in `caveat`. It stands **before** the value, because that column is right-aligned in tabular
figures and a glyph behind it would offset the lines carrying one against the lines that do not. It
goes on the line a figure states and never on a sub-line under it, which is read through the line
above it. Its sentence stands at the foot of the card, **once however many figures there wear that
mark**, and the sentences are composed from the marks rather than worked out a second time — so a
glyph pointing at nothing, or a sentence nothing points at, is not something this panel can draw.
**ADR 0088**, and its ink is **ADR 0089**'s.

**It rides a row of the list too**, where that row's own figure is the narrower one — the row
closing a damage section, and nothing else today. It is the same glyph, the same ink and the same
sentence, read off one field, so a row cannot wear a mark its card does not explain. What earns it
the exemption **ADR 0023** grants is measured rather than argued: over `captures/` on 2026-09-15 it
reaches **274 of the 7,903 rows** the panel draws over 1,312 levels, which is 3.5% of them, and the
label it stands before is eleven characters the game never lengthens. A mark on every row was
measured too, and refused — `tests/e2e/panel-marks.spec.ts` holds the cost that decided it.

**Undrawn marker.** Replaces one section in place, at that section's size, in `textQuiet`. It is the
least interesting thing on screen on purpose.

**Defect list.** Stands under the suspicions, in `defect` plus a glyph of its own, and is drawn only
where something failed. One line per kind of failure, each saying what the panel could not do and
how many times. It is the one mark that is about the add-on rather than about the fight, which is
why it sits apart from the figures instead of beside one — Suspect Is Adjacent binds a mark to the
figure it concerns, and a defect concerns none.

## Motion and interaction

- Nothing animates. No transition, no fade, no pulse, no reveal.
- Events are delegated at the root, never bound per row, so re-rendering cannot lose a handler and a
  click during a redraw is not swallowed.
- Hover shows detail; leaving hides it. There is no state a reader can get stuck in.
- Nothing interrupts: no `alert`, `confirm`, `prompt`, modal or overlay, no stolen focus, no sound.

## Accessibility

- WCAG AA contrast on every text-over-colour pairing, held by a test that reads the shipped sheet:
  every ink it prints words in, over each ground it is drawn on. A rule filling a bar segment spells
  `color:` too, and those are held at the graphical floor instead — named, never exempted. The
  thinnest pairing is the heading over the panel at 5.22, and the thinnest of the signal inks is
  `defect` over `track` at 6.61 — measured 2026-09-15.
- Colour is never the only signal — _The Colour Never Alone Rule_.
- **Nothing the panel draws can be reached from a keyboard, and that is a finding.** Every control
  is a `div` or a `span` listening for a press or a hover; no element it puts in the page is
  focusable and no key is read anywhere in `src/`. What it does not do is take anything away — it
  steals no focus and traps none, so whatever the page underneath could reach before it can still be
  reached.
- A reader who has asked for reduced motion loses nothing, because there is no motion.

## Do

- Spend a token, always.
- Put a suspicion where its consequence is.
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
