# Drill levels

Every kind of row the panel draws below the ranking, and whether pressing it
opens anything. The decision behind the verdicts is
`docs/specs/2026-08-19-a-row-opens-only-what-it-does-not-say.md`; this is the
whole of what it comes to, case by case.

**Read off the panel, not written from memory**, and held by
`tests/tools/drill-report.test.ts` — the guard composes every breakdown of every
capture through `tools/drill-report.ts` and refuses a row of the tables below
that the tree does not produce, or a case the tree produces and the tables do not
name. A line here that stops being true fails the gate.

**No counts.** How many rows of each kind a recording holds is a number that
changes with the next one, so it is measured rather than written down (§5):

```bash
bun tools/drill-report.ts --cases                       # the tables, with counts
bun tools/drill-report.ts <capture> [metric]            # one recording, row by row
```

## The three levels

| level | what it lists | how you get there |
|---|---|---|
| the ranking | one row per combatant, by the chosen figure | the screen a tab opens on |
| the breakdown | that combatant's figure in up to three cuts | pressing a ranking row |
| the deep level | one pair, or one skill, of that combatant | pressing a breakdown row |

The deep level is the last rung: **nothing on it opens**, in any metric. The
ranking's rows all open, in any metric. Everything below is the two tables here.

## The verdicts

| verdict | means |
|---|---|
| `always` | every row of this kind opens |
| `never` | no row of this kind opens |
| `sometimes` | it depends on what the level below would hold — the conditions are named under the tables |

A verdict outside that list is refused rather than read as silence.

## The breakdown

| metric | section | row kind | opens |
|---|---|---|---|
| `Zadane` | `KOMU` | person | `sometimes` |
| `Zadane` | `CZYM (UMIEJĘTNOŚCI)` | skill | `always` |
| `Zadane` | `CZYM (UMIEJĘTNOŚCI)` | leaf | `never` |
| `Zadane` | `CZYM (UMIEJĘTNOŚCI)` | closing row | `never` |
| `Zadane` | `TYP OBRAŻEŃ` | source | `never` |
| `Otrzymane` | `OD KOGO` | person | `sometimes` |
| `Otrzymane` | `OD KOGO` | missing end | `never` |
| `Otrzymane` | `TYP OBRAŻEŃ` | source | `never` |
| `Leczenie dane` | `KOMU` | person | `sometimes` |
| `Leczenie dane` | `CZYM (UMIEJĘTNOŚCI)` | skill | `sometimes` |
| `Leczenie dane` | `CZYM (UMIEJĘTNOŚCI)` | leaf | `never` |
| `Leczenie` | `OD KOGO` | person | `sometimes` |
| `Leczenie` | `CZYM (UMIEJĘTNOŚCI)` | skill | **`never`** |
| `Leczenie` | `CZYM (UMIEJĘTNOŚCI)` | leaf | `never` |
| `Leczenie` | `OD CZEGO` | source | `never` |

Two absences are the design rather than a gap. **`Otrzymane` has no skills
section at all** — the protocol names what hit you and never what the other side
chose — and **`Leczenie dane` has no source section**, because the keys the game
states belong to whoever received the health, so a giver has none.

**And some rows in a skills section are not skills.** Under `Zadane`, damage
charged to a combatant that no blow of theirs carried — a wound ticking turns
after the blow that applied it (§9.6) — stands there as a `leaf`, under the game's
own word for the key. It is a row rather than part of the closing row below it
because that row says *a blow nothing announced* and counts how many, and a wound
is neither.

Under both healing metrics the whole of what no announcement covered is such
rows. `heal`, `legbon_holytouch_heal` and `legbon_lastheal` are named by the game
and announced by nothing, so the section lists them by the key and there is no
closing row on either healing screen at either level — which is why neither table
above has one. None of these rows opens: the protocol states no count for them and
no second cut of them.

## The deep level

| metric | section | row kind | opens |
|---|---|---|---|
| `Zadane` | `KOMU — …` | leaf | `never` |
| `Zadane` | `CZYM — …` | leaf | `never` |
| `Zadane` | `CZYM — …` | closing row | `never` |
| `Zadane` | `TYP OBRAŻEŃ` | leaf | `never` |
| `Otrzymane` | `CZYM — …` | leaf | `never` |
| `Otrzymane` | `CZYM — …` | closing row | `never` |
| `Otrzymane` | `TYP OBRAŻEŃ` | leaf | `never` |
| `Leczenie dane` | `KOMU — …` | leaf | `never` |
| `Leczenie dane` | `CZYM — …` | leaf | `never` |
| `Leczenie` | `CZYM — …` | leaf | `never` |

`Otrzymane` and `Leczenie` have no `KOMU — …` because their skill rows do not
open: under `Otrzymane` there are none, and under `Leczenie` they are the row the
next section is about.

## The three cells that say `sometimes`

**A person, in any metric.** The level under a person is *what the two of you did
to each other* — the skills one announced against the other, plus what the game
named without announcing: damage types and wounds under damage, healing keys under
healing. It opens where an announcement named at least one skill for that pair, or
where that second cut holds more than one row. It does not where the level would be
a single row repeating the figure just pressed — every blow between them
unannounced and of one type, or a pair whose whole healing is one key.

**A skill under `Leczenie dane`.** The level under it is *who this skill reached*.
It opens where the skill reached somebody other than the combatant in focus, and
does not where the only person it healed was them — a self-cast, where the level
would name the reader back to themselves.

**A skill under `Leczenie` is the one cell with no condition at all**, and the
reason it is bolded above. The level under it is narrowed to the combatant the row
was entered from, so it can only ever hold one row bearing the reader's own name
and the figure they pressed. Not sometimes: never, by construction — which is
what `docs/specs/2026-08-11-the-panel-that-drills.md` drew from the day it was
specified, without an arrow.

## Where a closing row goes instead

A row that opens nothing is not a row that says nothing. What no announcement
covered still stands in its section, so the parts add up to the figure above them.

**On the damage screens that row is `Zwykły cios`**, and under `Zadane` it carries
**how many blows** — the question a plain attack raises. That count is why a
section of one such row is drawn rather than suppressed as a repetition: it says
something the figure above it does not.

**On the healing screens there is no such row.** What no announcement covered is
named by the key the game stated it under, so nothing is left over to close
against. The row that used to stand there said the game had not told us, and the
game had — the panel was printing the same keys one section lower under
`OD CZEGO`.

## Shapes the recordings do not carry

The tables state what the seventeen captures produce. Three shapes the protocol
allows are absent from all of them, so no verdict is claimed:

| shape | where it would sit |
|---|---|
| a missing target — `Nieznany cel` | `Zadane` and `Leczenie dane`, in the section the level is about |
| a missing actor — `Nieznany sprawca` | `Leczenie`, in the section the level is about |
| a deep level short of the entry it was opened from | the `KOMU — …` sections, as a `missing end` row |

Each is drawn by a hand-built fight in `tests/ui/panel-view.test.ts` and by
`docs/half-named-figures.md`, which is the register for the half-named shapes
themselves. None of them opens anything: a row naming nobody has nobody to open.
