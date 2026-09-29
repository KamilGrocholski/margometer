# 0014. The fight line holds the place, and a card says which fight it was

- **Status:** Accepted
- **Date:** 2026-09-28

## Context

Over the ranking, the panel spends four lines before the first row: the headcount with the outcome,
the place on a line of its own in the small type, and two rows of strips. `DESIGN.md` put the place
on its own line in `58ddda9` (develop, 2026-08-29), because beside the headcount a map's name plus a
tile had about thirty characters of a 260px panel, and the place was what got cut. `TODO.md` asks
for a ranking that takes less space.

Measured in Chrome 154 on 2026-09-28, through the built userscript over the 35 recordings in
`captures/`, each fed to its end at each type step. The height from the bar to the first row is 83,
88 and 95px at 11, 12 and 13px. With the place on the headcount's line it is 68, 72 and 77px. The
widest headcount and outcome in the corpus is `10 vs 1` beside `PRZEGRANA`. Beside it, the place has
136, 140 and 165px. Of four map names in the published help (`pomoc.margonem.pl`, article 372, read
2026-09-27), `Wilcza Nora p.1 (18, 4)` fits whole at every step. `Mroczna Pieczara p.0`,
`Kuźnia Giriela - pracownia` and `Kopalnia Krwawego Szaleństwa` are cut at every step.

The add-on reads when a fight opened and where, and the shelf states both. It reads the world off
the page's host, but only when a fight is handed over as a file (`src/game/page-surroundings.ts`).
It does not know which combatant is the reader, only which side is (`myteam`). On a shelf row, the
card states the place alone.

The client names its own warrior in a fight by its hero's id. Production build `Bb28FQty`, fetched
2026-09-27, defines the hero's `this.getId=()=>this.d.id,this.getNick=()=>this.d.nick`, and its own
practice fights key the hero's warrior `w:{[Engine.hero.getId()]:{originalId:Engine.hero.getId()`.

## Decision

Decided with the maintainer on 2026-09-28, over the design canvas made that day.

**The place stands on the headcount's line, after the outcome and against the right edge.** The
headcount and the outcome never shorten. The map's name gives way and the tile `(x, y)` stays whole,
because the tile is what changes from one square to the next. This saves one line of type over the
ranking at every step. The strips are unchanged.

**Pointing at that line opens a card saying which fight it was:** its headcount and outcome, when it
opened, where in full, the world, and the reader's character by name, profession and level. The
place that the line had to cut is drawn whole on the card. **A shelf row opens the same card**,
where it stated the place alone. A line with nothing to say is left off the card. It never states
that something is unknown.

**The reader's character is found by the hero's id, read off `Engine.hero.d.id` when a fight opens,
as the place is.** The id is looked up among the fight's combatants, which already carry the name,
the profession and the level. A kept fight stores the id as `readerId`. A shelf that holds none, or
an id matching nobody in the fight, draws no character line. The shelf version stays 3: a fight kept
before this reads back with no id, which is the truth about it.

**The fight file does not change.** The id stays on the shelf, and the shelf never leaves the
browser (`SECURITY.md`).

Rejected: **the whole place cut from its end.** At every step the tile goes first.
`Mroczna Pieczara
p.0 (10, 4)` at 11px keeps its name and loses its square.

Rejected: **two lines, with the three choices packed into the second.** The noun, direction and side
strips would share one line only with their words shortened, and a shortened word is one a reader
has to learn.

Rejected: **one control naming the screen, opening a list of the four screens.** It adds an
interaction to save a line. `TODO.md` keeps a select for the strips as its own question.

Rejected: **the fight on the title bar.** The bar holds the name, the version and the controls on
one line whatever the version says (`DESIGN.md`).

Rejected: **the hero's nick, level and profession read off `Engine.hero.d` and stored as words.**
The fight's own combatant already carries all three as the fight stated them. A second copy could
disagree with the ranking drawn under it.

## Consequences

- `DESIGN.md`'s Header says the place shares the headcount's line and gives way first. The title
  bar's last sentence no longer sends the place to a line of its own.
- The sheet departs from `develop`'s in the header's rules, and `SHEET_DEPARTURES` names them.
- A new port reads the hero's id off the game's page state, which is an existing boundary (**E5**).
  A page that states no id gets a fight with no character line, and no defect.
- The card's lines are counted like every other card's, so it fits the viewport by the same
  arithmetic.
- Tiles above three digits and map names longer than the help's are not measured. What gives way is
  still the name, so a longer one costs the name and never the tile.
