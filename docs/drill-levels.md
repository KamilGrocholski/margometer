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

## The four views, at three levels

**The panel is three levels deep, and the third has two shapes.** `pair` and `skill` are both a
press away from `opened` and neither is reachable from the other, so a reader counting how far down
they can go counts three.

| view      | level | what it lists                                          | how a reader gets there                                            |
| --------- | ----- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| `ranking` | 1     | one row per combatant, by the chosen figure            | the screen a tab opens on                                          |
| `opened`  | 2     | that combatant's figure, in up to three cuts           | pressing a ranking row                                             |
| `pair`    | 3     | what one of them did to the other, by skill and by key | pressing a person in the opened row's `KOMU` / `OD KOGO` section   |
| `skill`   | 3     | whom that one skill reached, person by person          | pressing a skill in the opened row's `CZYM (UMIEJĘTNOŚCI)` section |

**Nothing on the third level opens**, in either shape and on any screen. The two are entered by
different marks — a person carries `data-row`, a skill carries `data-skill`, set at the one place in
`src/ui/panel-element.ts` that sets it — which is why a skill row wears the leaf's cursor while
still opening something.

## The kinds of row

| row          | what it stands for                                                 |
| ------------ | ------------------------------------------------------------------ |
| `person`     | somebody the roster holds                                          |
| `half-named` | the end the protocol left out — `Nieznany sprawca`, `Nieznany cel` |
| `skill`      | an announcement, under the name it was made by                     |
| `source`     | a key the game named with nothing announced in front of it         |
| `closing`    | what no announcement covered, as one row — `Zwykły cios`           |
| `kind`       | what a figure was made of                                          |
| `no kind`    | the part of a figure its kinds do not account for                  |

## The verdicts

| verdict     | means                                                                     |
| ----------- | ------------------------------------------------------------------------- |
| `always`    | every row of this kind opens                                              |
| `never`     | no row of this kind opens                                                 |
| `sometimes` | it depends on what the level below would hold — the rules are named below |

A verdict outside that list is refused rather than read as silence.

## The register

| screen               | level     | row          | opens       |
| -------------------- | --------- | ------------ | ----------- |
| `damageDealtApplied` | `ranking` | `person`     | `always`    |
| `damageDealtApplied` | `ranking` | `half-named` | `never`     |
| `damageDealtApplied` | `opened`  | `person`     | `sometimes` |
| `damageDealtApplied` | `opened`  | `skill`      | `never`     |
| `damageDealtApplied` | `opened`  | `closing`    | `never`     |
| `damageDealtApplied` | `opened`  | `kind`       | `never`     |
| `damageDealtApplied` | `pair`    | `skill`      | `never`     |
| `damageDealtApplied` | `pair`    | `closing`    | `never`     |
| `damageDealtApplied` | `pair`    | `kind`       | `never`     |
| `damageTakenApplied` | `ranking` | `person`     | `always`    |
| `damageTakenApplied` | `ranking` | `half-named` | `never`     |
| `damageTakenApplied` | `opened`  | `person`     | `sometimes` |
| `damageTakenApplied` | `opened`  | `half-named` | `never`     |
| `damageTakenApplied` | `opened`  | `skill`      | `never`     |
| `damageTakenApplied` | `opened`  | `closing`    | `never`     |
| `damageTakenApplied` | `opened`  | `kind`       | `never`     |
| `damageTakenApplied` | `pair`    | `skill`      | `never`     |
| `damageTakenApplied` | `pair`    | `closing`    | `never`     |
| `damageTakenApplied` | `pair`    | `kind`       | `never`     |
| `healthGiven`        | `ranking` | `person`     | `always`    |
| `healthGiven`        | `opened`  | `person`     | `sometimes` |
| `healthGiven`        | `opened`  | `skill`      | `sometimes` |
| `healthGiven`        | `opened`  | `source`     | `never`     |
| `healthGiven`        | `pair`    | `skill`      | `never`     |
| `healthGiven`        | `pair`    | `source`     | `never`     |
| `healthGiven`        | `skill`   | `person`     | `never`     |
| `healthRestored`     | `ranking` | `person`     | `always`    |
| `healthRestored`     | `opened`  | `person`     | `sometimes` |
| `healthRestored`     | `opened`  | `skill`      | `never`     |
| `healthRestored`     | `opened`  | `source`     | `never`     |
| `healthRestored`     | `opened`  | `kind`       | `never`     |
| `healthRestored`     | `pair`    | `skill`      | `never`     |
| `healthRestored`     | `pair`    | `source`     | `never`     |

## The four cells that say `sometimes`

**A person inside an opened row, on the damage screens.** The level under them is what passed
between the two, and it opens where that says something the row does not: where the blows between
them carried more than one kind, or where an announcement named one for that pair. Both screens ask
it and both ask it of the **striker's** row, so the two answer alike — 429 pairs open and 7 do not,
the same count on either, over `captures/` on 2026-08-31. It stays shut where the level would be the
figure just pressed under another heading: every blow between them unannounced and of one type.

**A person inside an opened row, on the healing screens.** The same question, answered by composing
the level and counting it, because healing draws one section rather than two. It opens where that
section would hold more than one row, or where its one row names a **skill** — the announcement says
which one, which the person row above it does not, and on `healthRestored` nothing else states which
of them cast which. It stays shut where that one row is a key: every such pair in the recordings is
somebody and themselves, and the keys are already on screen a section lower.

**A skill under `healthGiven`.** The level under it lists whom that skill put health into, person by
person — the section it stands in says what a combatant healed **with**, and this says **whom** each
of those reached. It opens where it reached somebody other than the combatant it was opened from,
and does not where the only person it healed was them — a self-cast, whose level would name the
reader back to themselves.

⚠️ **That condition decides whether it opens and never what it lists.** Once open the level names
everybody the skill reached, whoever announced it included: health somebody put into themselves is
health they gave, and it stands inside the figure on the row that was pressed. A level built from
the same narrowing closed against a smaller number and said nothing about the difference.

**A skill under `healthRestored` is `never`, and not by an absent condition.** The level there is
narrowed to the pair it was entered through, so it can only ever hold one row bearing the reader's
own name and the figure they pressed. `composeSkillReading` answers `null` for every screen but
`healthGiven`, which is that decision written where the compiler keeps it.

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

## A section that is not drawn at all

Separate from every verdict above, and it removes the row rather than shutting it: `getIsRepetition`
in `src/ui/panel-element.ts` drops a whole cross-section whose one row would equal the figure
standing over it. `DESIGN.md` owns that rule and the two exemptions the skills section carries, so a
row in the register above may be produced here and still not reach the panel.

⚠️ **The rule reaches the kinds at both levels and the announcements only at the opened one.** A
pair whose striker announced nothing draws its section all the same, holding one `closing` row at
the whole of the figure above it — 42 of the 429 drawn pair sections on each damage screen, over
`captures/` on 2026-08-31, and the same 42 pairs on either. Deliberate, and the cost of the other
answer is what decided it: neither exemption fits — a pair states no count of blows — so dropping
the section would be dropping the one place that says the game announced nothing here.

## What the code cannot draw

Absent from the register because no input reaches them, and each is a decision written in the source
rather than a gap in the material:

- **`healthGiven` has no `kind` cut**, and neither healing screen has one inside a pair. The keys
  the protocol names belong to whoever received the health.
- **The damage screens have no `source` row.** Those are healing's, where a key names the cause.
- **Neither healing screen has a `closing` row**, at either level — `composeSkillCut` asserts as
  much, and the pair's parts come to its figure exactly.
- **Only `healthGiven` has a `skill` level at all.** `composeSkillReading` answers `null` otherwise.
- **A pair has no `no kind` row.** Its figure is read off the cut its kinds come from, so there is
  nothing for them to fall short of.

## What the recordings do not carry

Shapes the code would draw, absent from `captures/`, so no verdict is claimed. Each would be a
`never` — a row naming nobody has nobody to open — but that is reasoning and not a measurement:

- a `half-named` row on either healing screen, at either level, and on `damageDealtApplied` inside
  an opened row;
- a `no kind` row anywhere;
- a `half-named` row under an opened skill.

`tests/ui/panel-element.test.ts` and `tests/ui/panel-reading.test.ts` draw several of these from
fights built by hand, which is where their shape is held.
