# Drill levels

Every kind of row the panel draws, and whether pressing it opens anything.

**Read off the panel, not written from memory.** `tests/tools/drill-report.test.ts` composes every
level of every recording through `tools/drill-report.ts` and refuses a row of the table below that
the tree does not produce, or a case the tree produces that the table does not name. A line here
that stops being true fails the gate.

**No counts.** How many rows of each kind a recording holds changes with the next one, so it is
measured rather than written down (**V5**):

```bash
deno task panel:drill --cases               # the table, with the counts behind each verdict
deno task panel:drill captures/<file>.json  # one recording, level by level
deno task panel:drill --screen healthGiven  # one screen of it
```

## The levels, three deep

`DESIGN.md` owns the shape — three levels, a branch under the ranking and one under a pinned row,
and a row that opens wherever a level stands under it (`develop ADR 0034`). This table names the
levels that shape draws, as `tools/drill-report.ts` names them.

| level          | depth | what it lists                                             | how a reader gets there                                      |
| -------------- | ----- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `ranking`      | 1     | one row per combatant, by the chosen figure               | the screen a strip opens on                                  |
| `opened`       | 2     | that combatant's figure, in up to three cuts              | pressing a ranking row                                       |
| `unnamed`      | 2     | the end the game **did** name, and what it was dealt with | pressing a pinned row under the ranking                      |
| `pair`         | 3     | what one of them did to the other, by skill and by key    | pressing a person in the opened row's `KOMU` / `OD KOGO` cut |
| `part`         | 3     | whom one row of a cut reached, person by person           | pressing a skill, a key or a kind inside the opened row      |
| `unnamed pair` | 3     | the end that person's figure left out, by key             | pressing the half-named row in the opened row's cut          |
| `unnamed cut`  | 3     | one person's own keys, or one key's own people            | pressing either kind of row on the `unnamed` level           |

The half-named row inside an opened figure reaches the keys of the `unnamed` level from the other
side: that person's own part of the figure the pinned row stands for, kept beside it by
`develop ADR 0039`. The rungs are entered by different marks: a person carries `data-row`, a pinned
row and a half-named row inside an opened figure carry `data-unnamed` naming the end they leave out,
and a part carries one of `data-skill`, `data-source` and `data-kind` — one attribute per kind of
row, so what a press asks for is read off the node rather than parsed out of it. Every mark goes on
the row **and on every cell in it**, because a listener reads what was pressed off the node under
the hand and walks no ancestors.

## The kinds of row

| row           | what it stands for                                                 |
| ------------- | ------------------------------------------------------------------ |
| `person`      | somebody the roster holds                                          |
| `half-named`  | the end the protocol left out — `Nieznany sprawca`, `Nieznany cel` |
| `skill`       | an announcement, under the name it was made by                     |
| `source`      | a key the game named with nothing announced in front of it         |
| `closing`     | what no announcement covered, as one row — `Zwykły cios`, marked   |
| `kind`        | what a figure was made of                                          |
| `no kind`     | the part of a figure its kinds do not account for                  |
| `neither end` | the part of a half-named figure that named no end at all           |

## The verdicts

| verdict     | means                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| `always`    | every row of this kind opens                                              |
| `never`     | no row of this kind opens                                                 |
| `sometimes` | it depends on what the level below would hold — the rules are named below |

A verdict outside that list is refused rather than read as silence.

## The register

| screen           | level          | row          | opens       |
| ---------------- | -------------- | ------------ | ----------- |
| `damageDealt`    | `ranking`      | `person`     | `always`    |
| `damageDealt`    | `ranking`      | `half-named` | `always`    |
| `damageDealt`    | `opened`       | `person`     | `always`    |
| `damageDealt`    | `opened`       | `skill`      | `always`    |
| `damageDealt`    | `opened`       | `source`     | `never`     |
| `damageDealt`    | `opened`       | `closing`    | `sometimes` |
| `damageDealt`    | `opened`       | `kind`       | `always`    |
| `damageDealt`    | `pair`         | `skill`      | `never`     |
| `damageDealt`    | `pair`         | `source`     | `never`     |
| `damageDealt`    | `pair`         | `closing`    | `never`     |
| `damageDealt`    | `pair`         | `kind`       | `never`     |
| `damageDealt`    | `part`         | `person`     | `never`     |
| `damageDealt`    | `unnamed`      | `person`     | `always`    |
| `damageDealt`    | `unnamed`      | `kind`       | `always`    |
| `damageDealt`    | `unnamed cut`  | `person`     | `never`     |
| `damageDealt`    | `unnamed cut`  | `kind`       | `never`     |
| `damageTaken`    | `ranking`      | `person`     | `always`    |
| `damageTaken`    | `ranking`      | `half-named` | `always`    |
| `damageTaken`    | `opened`       | `person`     | `always`    |
| `damageTaken`    | `opened`       | `half-named` | `always`    |
| `damageTaken`    | `opened`       | `skill`      | `always`    |
| `damageTaken`    | `opened`       | `source`     | `never`     |
| `damageTaken`    | `opened`       | `closing`    | `always`    |
| `damageTaken`    | `opened`       | `kind`       | `sometimes` |
| `damageTaken`    | `pair`         | `skill`      | `never`     |
| `damageTaken`    | `pair`         | `source`     | `never`     |
| `damageTaken`    | `pair`         | `closing`    | `never`     |
| `damageTaken`    | `pair`         | `kind`       | `never`     |
| `damageTaken`    | `part`         | `person`     | `never`     |
| `damageTaken`    | `unnamed pair` | `kind`       | `never`     |
| `damageTaken`    | `unnamed`      | `person`     | `always`    |
| `damageTaken`    | `unnamed`      | `kind`       | `always`    |
| `damageTaken`    | `unnamed cut`  | `person`     | `never`     |
| `damageTaken`    | `unnamed cut`  | `kind`       | `never`     |
| `healthGiven`    | `ranking`      | `person`     | `always`    |
| `healthGiven`    | `opened`       | `person`     | `always`    |
| `healthGiven`    | `opened`       | `skill`      | `always`    |
| `healthGiven`    | `opened`       | `source`     | `always`    |
| `healthGiven`    | `pair`         | `skill`      | `never`     |
| `healthGiven`    | `pair`         | `source`     | `never`     |
| `healthGiven`    | `part`         | `person`     | `never`     |
| `healthRestored` | `ranking`      | `person`     | `always`    |
| `healthRestored` | `opened`       | `person`     | `always`    |
| `healthRestored` | `opened`       | `skill`      | `always`    |
| `healthRestored` | `opened`       | `source`     | `never`     |
| `healthRestored` | `opened`       | `kind`       | `never`     |
| `healthRestored` | `pair`         | `skill`      | `never`     |
| `healthRestored` | `pair`         | `source`     | `never`     |
| `healthRestored` | `part`         | `person`     | `never`     |

## The cells that say `sometimes`

One heading per cell, and the heading names the screen and the kind of row, because that pair is
what the register keys a verdict by. **How many of each open is not written here** — the counts
change with the next recording and `deno task panel:drill --cases` states them (**V5**).

### `damageTaken` · `kind`

The level under it lists who dealt the figure that kind, read by turning the cut of a cut round: it
opens where the protocol named the other end of at least one blow that carried it, and stays shut
where it named none.

The shut ones are the bare movement, and nothing else — a key the game states against the combatant
it happened to, with nobody at the other end of it, so `damageTakenByOpponentAndKind` holds nothing
under that name while `damageTakenByKind` holds the figure. The dealing screen has no such row,
because a figure this combatant dealt was dealt to somebody, and it opens every kind row it draws.

### `damageDealt` · `closing`

It opens onto whoever stood at the other end of the blows it holds (`develop ADR 0081`), and stays
shut where that cut holds nobody.

**The asymmetry with the receiving screen is this panel's own, not the protocol's.** A closing row
is drawn on `damageDealt` where the combatant swung and landed nothing — `composeSkillCut` draws it
on a figure of nought as long as blows stood behind it, because a section that skipped them would
say the combatant never swung — and a figure of nought was dealt to nobody, so there is no cut under
it. `damageTaken` draws no such row at all: there the row needs a figure, and a figure somebody lost
was taken off somebody. Measured over `captures/` on 2026-09-25, one row in the corpus is shut, and
it is that case exactly: nought, with seven blows behind it.

## What stays shut, and why

How many rows of each kind a recording holds is `deno task panel:drill --cases`'s to state. What
this section carries is the half that does not move with the next recording: **which** kinds are the
shut ones.

Inside an opened row they are `source`, `kind` and `closing` — the key and kind rows on the screens
whose statistics keep no second cut of them, and the closing row drawn at nought, which is the case
the section above names. Never a row the panel decided against, and
`tests/tools/drill-report.test.ts` holds that list to what the tool reports, both ways round.

The half-named row inside an opened figure opens only where the keys kept for it total it, because
`src/core/` asserts that balance over the fight and not per person. Over `captures/` on 2026-09-29
it did in every row drawn.

The pinned rows open onto people and onto keys. The people are the same set read from both ends: on
`Zadane` they are who lost the health nobody was named for striking, on `Otrzymane` the same figure
cut by the same people — one row per person the count reaches, which is what `verifyFightStatistics`
in `src/core/fight-statistics.ts` asserts it is the sum of.

The kinds are the second cut of that same figure, and they are what a reader came for: the points
nobody was named for striking, under the key each of them moved out under. Composed through the
panel and tallied straight off the events, the two agree to the point.

Both of those sections open, onto a row per key reached from a person and a row per person reached
from a key. They are one fold read both ways round, so the two counts are equal by construction
rather than by coincidence.

## Where a row that opens nothing still says something

A row that opens nothing is not a row that says nothing. What no announcement covered still stands
in its section so the parts add up to the figure over them, and the two screens do it differently.

**On the damage screens it closes into `Zwykły cios`**, which takes a place among the rows above it
(`develop ADR 0079`) — it holds the blows the game numbered a turn for and named no skill to, and
that is a thing the game names. It wears the caveat mark, because what the game names there is that
the blows landed and not what they were dealt with (`develop ADR 0089`). The one other row wearing
it is a kind naming several elements, whose part the game states once for the whole blow (ADR 0045).
`Zwykły cios` holds nothing else (`develop ADR 0080`): health that went out under a key, without a
blow carrying it, stands under that key here as it does on healing. Under `damageDealt` that row
also carries how many blows — the question a plain attack raises, and a number the figure alone
cannot state. The count is that screen's alone: the protocol states no number of anything against
one opponent rather than another, and on `damageTaken` the announcement was somebody else's, so a
count read off the reader's own row would be their own swings under somebody else's heading. **On
the healing screens nothing closes at all**: health that moved outside an announcement still moved
under a key the game named, so the section lists those keys as `source` rows. `DESIGN.md` owns that
rule; `docs/protocol-keys.md` owns what each key means.

## An announcement is kept on the row that made it

⚠️ **The protocol announces on both sides, and _nothing announces a blow you take_ is a trap**
(`develop ADR 0078`): a claim about the protocol standing on a fact about our own aggregation. 34 of
the 41 combatants on side 2 across the 37 recordings of `captures/` announce something, Amaimon,
Hildur, Draugr, Centaur and Mamlambo among them (`deno task fight:figures`, 2026-10-06), and 80.9%
of all damage dealt in the corpus stands under an announcement — 11,200,306 of 13,851,581, read
2026-10-04, what a pool took counted in as ADR 0012 counts it.

What is true is narrower. `SkillFigures` hangs off the record of whoever **made** the announcement,
so a figure somebody received carries no announcement of its own. `damageTaken` therefore reads its
`skill` rows off the striker's row and closes the rest against `Zwykły cios` — the same walk
`healthRestored` makes over `healthGivenByReceiver`, `getPairGivingEnd` turning on the direction
rather than on the noun.

**Which is what a received skill row opens onto.** A section folds every caster's announcement under
one name — two healers both announcing `Leczenie ran` are one row — and the level under it is the
column that says which of them it came from. It is read by walking everybody's record for that name,
because that is where an announcement is kept.

## What the code cannot draw

Absent from the register because no input reaches them, and each is a decision written in the source
rather than a gap in the material:

- **`healthGiven` has no `kind` cut**, and neither healing screen has one inside a pair. The keys
  the protocol names belong to whoever received the health.
- **A `source` row on a damage screen opens nothing**, where the same row on `healthGiven` does. A
  key names whoever the health moved on, so a row on the receiving side has no second end to be cut
  by — the same reason `healthRestored`'s keys are leaves. The row **closing** a damage section is
  not in this class and opens (`develop ADR 0081`): it holds blows, and a blow always has two ends.
- **Neither healing screen has a `closing` row**, at either level — `composeSkillCut` asserts as
  much, and the pair's parts come to its figure exactly.
- **A key on `healthRestored` opens nothing, and neither does a kind.** Both cuts are flat on the
  receiving side: a key names whoever received the health, so nothing is kept beside it saying who
  gave it. On `healthGiven` the same key opens, because the cut there is kept per receiver.
- **A pair has no `no kind` row.** Its figure is read off the cut its kinds come from, so there is
  nothing for them to fall short of.
- **Nothing under a pinned row opens past the third level.** A pair between somebody and nobody is
  not a pair, a key of one person's keys is a cut of a cut nothing keeps, and the end the game left
  out is the one thing this panel will not name (`develop ADR 0013`, `develop ADR 0036`).
- **A pinned row has no `no kind` row.** Its kinds are folded from cuts that
  `src/core/fight-statistics.ts` asserts total the very figures they were folded beside, so there is
  nothing for them to fall short of. `develop ADR 0039`.
- **`neither end` stands only under a figure standing `apart`, and only under `Wszyscy`.** A `cut`
  is summed over rows the ranking already draws and nobody's row is not one of them; under one side
  the charge is read off a row, and there is no row to read it off. `develop ADR 0038`.

## What the recordings do not carry

Shapes the code would draw, absent from `captures/`, so no verdict is claimed. Each would be a
`never` — a row naming nobody has nobody to open — but that is reasoning and not a measurement:

- a `half-named` row on either healing screen, at either level, and on `damageDealt` inside an
  opened row;
- a `no kind` row on any level that could hold one. Under a pinned row it is not absent but
  impossible, which is the bullet above rather than this one;
- a `half-named` row on the third level, under a part;
- a `neither end` row under a pinned one. `damageByNeitherEnd` is zero on each of the 37 recordings
  of `captures/` (`deno task fight:figures`, "named neither end", 2026-10-06), so the row the code
  draws for it is drawn from no material.

`tests/ui/panel-element.test.ts` and `tests/ui/panel-content.test.ts` draw several of these from
fights built by hand, which is where their shape is held.
