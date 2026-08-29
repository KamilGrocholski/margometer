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

| Token           | Value     | Use                                                     |
| --------------- | --------- | ------------------------------------------------------- |
| `text`          | `#e7e7ea` | Figures and names.                                      |
| `textQuiet`     | `#9a9aa6` | Labels, units, denominators — everything the eye skips. |
| `badgeInkDark`  | `#14141a` | Text on a light-enough bar.                             |
| `badgeInkLight` | `#ffffff` | Text on a dark-enough bar.                              |

**Text on a coloured bar clears WCAG AA contrast, checked by a test rather than by eye.** Which of
the two inks a bar gets is computed from the bar's colour, not chosen by hand.

### Signals

| Token            | Value     | Means                                                         |
| ---------------- | --------- | ------------------------------------------------------------- |
| `ours`           | `#6fbf8b` | The reader's own side.                                        |
| `theirs`         | `#e0736f` | The other side.                                               |
| `suspect`        | `#c98500` | A figure that may be short.                                   |
| `UNKNOWN_COLOUR` | `#8a8a80` | Desaturated on purpose: unknown is the absence of a category. |

`ours` and `theirs` are **not** green-good and red-bad: they are two sides, and the panel takes no
view on which one the reader should be pleased about.

### Element palette

Eight hues carry the damage elements, and they are assigned by key rather than by rank, so the same
element is the same colour in every fight:

`#3987e5` `#008300` `#d55181` `#c98500` `#199e70` `#d95926` `#9085e9` `#e66767`

A bar is drawn at `barTint` `0.55` against `track`, which is what keeps eight saturated hues from
competing with the figures printed over them.

## Typography

The panel inherits nothing and asks for nothing: no web font, no download, no layout shift. It uses
the reader's system UI stack, at one size, with weight and colour carrying the hierarchy instead of
scale.

- **Figures** — the reader's eye target. Full `text`, tabular where columns must align.
- **Names** — same size, same weight, `text`.
- **Labels and units** — `textQuiet`. A unit never competes with the number it qualifies.
- **A count is spelled the way Polish spells it**, which is three ways, and that belongs to the
  words module rather than to a formatter.

## Space and size

A 2-pixel base, because the panel is dense and a 4-pixel base doubles its height for no gain in
legibility.

| Token            | Value                                                     |
| ---------------- | --------------------------------------------------------- |
| `spaceHalf`      | `2px`                                                     |
| `spaceSmall`     | the base step                                             |
| `rowHeight`      | `18px`                                                    |
| `maxHeightShare` | `66vh`                                                    |
| `tipWidth`       | fixed, so a tooltip never reflows against its own content |
| `panelWidth`     | `260px` — narrow on purpose: the panel is a guest         |
| `panelInset`     | `8px` from the corner it is anchored to                   |
| `panelLayer`     | high enough to clear the game's own windows               |

**Every row is the same height**, accent included. A row whose background is taller than its
neighbour reads as a different kind of row, and it is not one.

**The `66vh` cap is real and binds in play.** It is lifted only for a screenshot, and that is the
whole of the licence — see _The Frame Is Not A Screen Rule_.

## Shape and depth

| Token          | Value                         | Use                                  |
| -------------- | ----------------------------- | ------------------------------------ |
| `radius`       | `8px`                         | The panel, the tooltip.              |
| `radiusSmall`  | `3px`                         | Bars, badges, anything inside a row. |
| `windowShadow` | `0 6px 20px rgb(0 0 0 / 55%)` | The panel against the game.          |

Flat first. Hierarchy comes from `surface` against `surfaceRaised` and from borders. The single
shadow exists to separate the panel from a game screen we do not control, not to decorate anything
inside it.

## Components

**Title bar.** `surfaceRaised`, one line, always. It carries the name, the version, where the fight
is being fought, and the controls, and it stays one line as the version number grows — a bar that
wraps moves everything below it. Where the client says nothing about the place, the bar says nothing
in its stead: an empty pair of brackets states a place, and nothing was stated.

**Ranking row.** A name, a bar, a figure. The bar is the row's background at `barTint`, not a
separate element, so the row height cannot disagree with the accent height.

**Pinned row.** Stands apart from the ranking, below it, for figures that belong to no combatant. It
is a row, not a footnote: same height, same shape.

**Summary bar.** The fight's own strip. This is where a gap that names nobody is said, because no
row can carry it. It is a reading's summary, **not** a banner — the distinction is that it always
shows, rather than appearing when something goes wrong.

**Tab strip.** Switches screens. Quiet until hover or current; the current one is marked by more
than colour.

**Tooltip.** `surfaceRaised`, fixed width, opens on hover and follows the cursor's vertical
position. It stays inside the viewport: when the panel sits near an edge, the tooltip moves rather
than clipping.

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
