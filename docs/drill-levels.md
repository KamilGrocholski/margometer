# Drill levels

Every kind of row the panel draws, and whether pressing it opens anything.

**Read off the panel, not written from memory.** `tests/tools/drill-report.test.ts` composes every
level of every recording through `tools/drill-report.ts` and refuses a row of the table below that
the tree does not produce, or a case the tree produces that the table does not name. A line here
that stops being true fails the gate.

**No counts.** How many rows of each kind a recording holds changes with the next one, so it is
measured rather than written down (**V5**):

```bash
deno task drill --cases                    # the table, with the counts behind each verdict
deno task drill captures/<file>.json       # one recording, level by level
deno task drill --screen healthGiven       # one screen of it
```

## The five views, at three levels

**The panel is three levels deep, and the third has two shapes on each of its two branches.** `pair`
and `part` are both a press away from `opened` and neither is reachable from the other, so a reader
counting how far down they can go counts three. `unnamed` sits on the second level off a branch of
its own — it is opened from a row standing under the ranking rather than from one on it — and
`unnamed cut` is that branch's third, reached from either of the two sections `unnamed` draws.

| view          | level | what it lists                                             | how a reader gets there                                      |
| ------------- | ----- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `ranking`     | 1     | one row per combatant, by the chosen figure               | the screen a tab opens on                                    |
| `opened`      | 2     | that combatant's figure, in up to three cuts              | pressing a ranking row                                       |
| `unnamed`     | 2     | the end the game **did** name, and what it was dealt with | pressing a pinned row under the ranking                      |
| `pair`        | 3     | what one of them did to the other, by skill and by key    | pressing a person in the opened row's `KOMU` / `OD KOGO` cut |
| `part`        | 3     | whom one row of a cut reached, person by person           | pressing a skill, a key or a kind inside the opened row      |
| `unnamed cut` | 3     | one person's own keys, or one key's own people            | pressing either kind of row on the `unnamed` level           |

**A row opens wherever there is a level under it.** What decides it is never whether that level
would say something new — a cut of one row states what the figure over it was made of, which the
heading never does, and a reader who cannot press a row learns nothing at all. What stays shut is
what the statistics keep no second cut of, and **ADR 0034** carries the argument.

**Nothing on the third level opens, on either branch.** Every row on the second does: under a pinned
row the two sections are one fold read both ways round, so a person opens onto their own keys and a
key onto its own people, and past that there is nothing kept to draw. The rungs are entered by
different marks: a person carries `data-row`, a pinned row carries `data-unnamed` naming the end it
leaves out, and a part carries one of `data-skill`, `data-source` and `data-kind` — one attribute
per kind of row, so what a press asks for is read off the node rather than parsed out of it. Every
mark goes on the row **and on every cell in it**, because a listener reads what was pressed off the
node under the hand and walks no ancestors.

## The kinds of row

| row           | what it stands for                                                 |
| ------------- | ------------------------------------------------------------------ |
| `person`      | somebody the roster holds                                          |
| `half-named`  | the end the protocol left out — `Nieznany sprawca`, `Nieznany cel` |
| `skill`       | an announcement, under the name it was made by                     |
| `source`      | a key the game named with nothing announced in front of it         |
| `closing`     | what no announcement covered, as one row — `Zwykły cios`           |
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

| screen               | level         | row          | opens       |
| -------------------- | ------------- | ------------ | ----------- |
| `damageDealtApplied` | `ranking`     | `person`     | `always`    |
| `damageDealtApplied` | `ranking`     | `half-named` | `always`    |
| `damageDealtApplied` | `opened`      | `person`     | `always`    |
| `damageDealtApplied` | `opened`      | `skill`      | `always`    |
| `damageDealtApplied` | `opened`      | `closing`    | `never`     |
| `damageDealtApplied` | `opened`      | `kind`       | `always`    |
| `damageDealtApplied` | `pair`        | `skill`      | `never`     |
| `damageDealtApplied` | `pair`        | `closing`    | `never`     |
| `damageDealtApplied` | `pair`        | `kind`       | `never`     |
| `damageDealtApplied` | `part`        | `person`     | `never`     |
| `damageDealtApplied` | `unnamed`     | `person`     | `always`    |
| `damageDealtApplied` | `unnamed`     | `kind`       | `always`    |
| `damageDealtApplied` | `unnamed cut` | `person`     | `never`     |
| `damageDealtApplied` | `unnamed cut` | `kind`       | `never`     |
| `damageTakenApplied` | `ranking`     | `person`     | `always`    |
| `damageTakenApplied` | `ranking`     | `half-named` | `always`    |
| `damageTakenApplied` | `opened`      | `person`     | `always`    |
| `damageTakenApplied` | `opened`      | `half-named` | `never`     |
| `damageTakenApplied` | `opened`      | `skill`      | `always`    |
| `damageTakenApplied` | `opened`      | `closing`    | `never`     |
| `damageTakenApplied` | `opened`      | `kind`       | `sometimes` |
| `damageTakenApplied` | `pair`        | `skill`      | `never`     |
| `damageTakenApplied` | `pair`        | `closing`    | `never`     |
| `damageTakenApplied` | `pair`        | `kind`       | `never`     |
| `damageTakenApplied` | `part`        | `person`     | `never`     |
| `damageTakenApplied` | `unnamed`     | `person`     | `always`    |
| `damageTakenApplied` | `unnamed`     | `kind`       | `always`    |
| `damageTakenApplied` | `unnamed cut` | `person`     | `never`     |
| `damageTakenApplied` | `unnamed cut` | `kind`       | `never`     |
| `healthGiven`        | `ranking`     | `person`     | `always`    |
| `healthGiven`        | `opened`      | `person`     | `always`    |
| `healthGiven`        | `opened`      | `skill`      | `always`    |
| `healthGiven`        | `opened`      | `source`     | `always`    |
| `healthGiven`        | `pair`        | `skill`      | `never`     |
| `healthGiven`        | `pair`        | `source`     | `never`     |
| `healthGiven`        | `part`        | `person`     | `never`     |
| `healthRestored`     | `ranking`     | `person`     | `always`    |
| `healthRestored`     | `opened`      | `person`     | `always`    |
| `healthRestored`     | `opened`      | `skill`      | `always`    |
| `healthRestored`     | `opened`      | `source`     | `never`     |
| `healthRestored`     | `opened`      | `kind`       | `never`     |
| `healthRestored`     | `pair`        | `skill`      | `never`     |
| `healthRestored`     | `pair`        | `source`     | `never`     |
| `healthRestored`     | `part`        | `person`     | `never`     |

## The one cell that says `sometimes`

**A kind inside an opened row, on `damageTakenApplied`.** The level under it lists who dealt the
figure that kind, read by turning the cut of a cut round: it opens where the protocol named the
other end of at least one blow that carried it, and stays shut where it named none.

The shut ones are the bare movement, and nothing else — 58 rows over `captures/` on 2026-08-31,
across all 28 recordings: `poison` 32, `heal` 9, `fire` 6, `light` 4, `anguish` 4, `wound` 3. Each
is a key the game states against the combatant it happened to, with nobody at the other end of it,
so `damageTakenByOpponentAndKind` holds nothing under that name while `damageTakenByElement` holds
the figure. The dealing screen has no such row, because a figure this combatant dealt was dealt to
somebody: `damageDealtApplied` opens all 602 of its kind rows.

## What opens, in numbers

Over `captures/` on 2026-09-01: of the rows a reader meets inside an opened row, **4,917 open and
1,049 do not**, and the third level they reach holds **4,361 person rows**. The shut thousand is
`closing`, `half-named`, and the key and kind rows on the screens whose statistics keep no second
cut of them — never a row the panel decided against.

The pinned rows open onto **90 person rows and 102 kind rows**, 45 and 51 on each damage screen. The
people are the same 45 read from both ends: on `Zadane` they are who lost the health nobody was
named for striking, on `Otrzymane` the same figure cut by the same people — one row per person the
count reaches, which is what `getHalfNamedBalance` in `src/core/fight-statistics.ts` asserts it is
the sum of.

The kinds are the second cut of that same figure, and they are what a reader came for: over
`captures/` on 2026-09-01 the 609,078 points nobody was named for striking are 89.2% `poison`, then
`anguish`, `wound`, `heal`, `fire` and `light` — six keys, in 51 rows across the 28 recordings.
Composed through the panel and tallied straight off the events, the two agree to the point.

Both of those sections open, onto **116 rows on each damage screen** — 58 keys reached from a person
and 58 people reached from a key. They are one fold read both ways round, so the two counts are
equal by construction rather than by coincidence.

## Where a row that opens nothing still says something

A row that opens nothing is not a row that says nothing. What no announcement covered still stands
in its section so the parts add up to the figure over them, and the two screens do it differently.

**On the damage screens it closes into `Zwykły cios`**, and under `damageDealtApplied` that row
carries how many blows — the question a plain attack raises, and a number the figure alone cannot
state. The count is that screen's alone: the protocol states no number of anything against one
opponent rather than another, and on `damageTakenApplied` the announcement was somebody else's, so a
count read off the reader's own row would be their own swings under somebody else's heading. **On
the healing screens nothing closes at all**: health that moved outside an announcement still moved
under a key the game named, so the section lists those keys as `source` rows. `DESIGN.md` owns that
rule; `docs/protocol-keys.md` owns what each key means.

## An announcement is kept on the row that made it

⚠️ **This document said the opposite until 2026-08-31, and the recordings said otherwise all
along.** It read: _nothing announces a blow you take; the protocol names what hit you and never what
the other side chose_ — which was a claim about the protocol standing on a fact about our own
aggregation. The protocol does announce, on both sides: 25 of the 31 combatants on side 2 across
`captures/` announce something, Amaimon, Hildur, Draugr, Centaur and Mamlambo among them, and 79.5%
of all applied damage in the corpus stands under an announcement — 8,201,200 of 10,321,302, read
2026-08-31.

What is true is narrower. `SkillFigures` hangs off the record of whoever **made** the announcement,
so a figure somebody received carries no announcement of its own. `damageTakenApplied` therefore
reads its `skill` rows off the striker's row and closes the rest against `Zwykły cios` — the same
walk `healthRestored` has always made over `restoredByOpponent`, `getPairGivingEnd` turning on the
direction rather than on the noun.

**Which is what a received skill row opens onto.** A section folds every caster's announcement under
one name — two healers both announcing `Leczenie ran` are one row — and the level under it is the
column that says which of them it came from. It is read by walking everybody's record for that name,
because that is where an announcement is kept.

## What the code cannot draw

Absent from the register because no input reaches them, and each is a decision written in the source
rather than a gap in the material:

- **`healthGiven` has no `kind` cut**, and neither healing screen has one inside a pair. The keys
  the protocol names belong to whoever received the health.
- **The damage screens have no `source` row.** Those are healing's, where a key names the cause.
- **Neither healing screen has a `closing` row**, at either level — `composeSkillCut` asserts as
  much, and the pair's parts come to its figure exactly.
- **A key on `healthRestored` opens nothing, and neither does a kind.** Both cuts are flat on the
  receiving side: a key names whoever received the health, so nothing is kept beside it saying who
  gave it. On `healthGiven` the same key opens, because the cut there is kept per receiver.
- **A pair has no `no kind` row.** Its figure is read off the cut its kinds come from, so there is
  nothing for them to fall short of.
- **Nothing under a pinned row opens past the third level.** A pair between somebody and nobody is
  not a pair, a key of one person's keys is a cut of a cut nothing keeps, and the end the game left
  out is the one thing this panel will not name (**ADR 0013**, **ADR 0036**).
- **A pinned row has no `no kind` row.** Its kinds are folded from cuts that
  `src/core/fight-statistics.ts` asserts total the very figures they were folded beside, so there is
  nothing for them to fall short of. **ADR 0039.**
- **`neither end` stands only under a figure standing `apart`, and only under `Wszyscy`.** A `cut`
  is summed over rows the ranking already draws and nobody's row is not one of them; under one side
  the charge is read off a row, and there is no row to read it off. **ADR 0038.**

## What the recordings do not carry

Shapes the code would draw, absent from `captures/`, so no verdict is claimed. Each would be a
`never` — a row naming nobody has nobody to open — but that is reasoning and not a measurement:

- a `half-named` row on either healing screen, at either level, and on `damageDealtApplied` inside
  an opened row;
- a `no kind` row on any level that could hold one. Under a pinned row it is not absent but
  impossible, which is the bullet above rather than this one;
- a `half-named` row on the third level, under a part;
- a `neither end` row under a pinned one. `byNeitherEnd` is zero over every recording, so the row
  the code draws for it has never been drawn from material.

`tests/ui/panel-element.test.ts` and `tests/ui/panel-reading.test.ts` draw several of these from
fights built by hand, which is where their shape is held.
