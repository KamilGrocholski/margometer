# A heal nobody announced was still named

Status: implemented

The panel had a row saying it could not tell what restored a combatant's health,
standing over health three protocol keys had named. This is what that row became,
and what had to move in the aggregate before it could become anything.

## What was asked for

> `Leczenie` calls regeneration "Nie wiadomo, czym" - it is
> `heal`/`legbon_holytouch_heal`/`legbon_lastheal`, the game announces no skill,
> so name the row by the key

## The defect

Under `Leczenie` and `Leczenie dane`, the `CZYM (UMIEJĘTNOŚCI)` section lists the
skills an announcement named and then closes against the row above it, so the
parts add up to the figure they were entered from. That closing row was called
**`Nie wiadomo, czym`**, with a note reading *nic nie zapowiedziało tego leczenia,
więc gra nie mówi, co je dało*.

The second half of that sentence is false. Nothing **announced** the healing, and
the game did say what it was: `heal`, `legbon_holytouch_heal` and
`legbon_lastheal`, all three decoded, all three named in
`docs/protocol-keys.md`, all three carrying a `*Cause:*` line the published help
settles (`docs/specs/2026-08-19-a-heal-nobody-gave-was-their-own.md`). A missing
announcement is not the game's silence, and a player does not read that row as a
statement about announcements.

⚠️ **And the three are not one mechanic, which is why the row is per key rather
than one row for all of them.** The ask above calls them regeneration; only `heal`
is that — the help documents it as a statistic of the character, restoring the
character's own health before their action while they hold less than they entered
with. `legbon_holytouch_heal` and `legbon_lastheal` are **legendary bonuses** — the
register describes each on its own terms and on its own reading of the help, and
neither reading is this one's to restate.

What the three share is one narrow thing: the help says each effect belongs to the
combatant it heals, which is what put them on `SELF_SOURCED_HEALING_KEYS`. That
list answers *whose*, never *what kind* — a round reading it as a kind would
collapse two bonuses into a character's statistic. The panel keeps them apart by
the only name that cannot be got wrong, the key the game stated: `leczenie`,
`dotyk anioła` and `ostatni ratunek` are three rows and never one.

The figure was not small, and the answer was already on screen. Measured on
`tests/captured-fights/2026-08-17-tempest-grupa-vs-hildur.json` with
`bun tools/drill-report.ts 2026-08-17-tempest-grupa-vs-hildur healed`, one
combatant's section read:

```
[CZYM (UMIEJĘTNOŚCI)] 32 057
  <a skill somebody announced>  13 493
  <another>                      2 037
  Nie wiadomo, czym             16 527
[OD CZEGO] 32 057
  leczenie całej drużyny 15 530
  ostatni ratunek        11 077
  leczenie                5 450
```

The two skill names are the game's own and stand in as placeholders here (§5);
the tool prints them, and `tests/tools/source-layout.test.ts` is what noticed they
had been copied into this file.

`11 077 + 5 450 = 16 527`, exactly: the makeup of the unnamed row was printed one
heading lower, in the panel's own words. Over the eighteen recordings the row
stood 113 times under `Leczenie`, 46 under `Leczenie dane` and 36 at each of the
two pair levels.

⚠️ **`src/ui/panel-drill.ts` carried a comment saying the giving side never
reached it.** That was true when it was written and stopped being true when the
three keys acquired a healer without acquiring an announcement — the giver of a
self-sourced heal is the combatant it healed, so `Leczenie dane` reached the row
too.

## Why the panel could not answer for itself

§9.1 lets the panel fold a row's own maps and forbids it to derive a statistic
across other rows. This was neither: the split did not exist anywhere.

| map | holds | drops |
|---|---|---|
| `healedBySource` | every point restored, by key | whether anything announced it |
| `healedByHealerId` | every point restored, by healer | the key |
| `healingGivenByCombatantId` | every point given, by recipient | the key |
| `SkillStatistics.healedByCombatantId` | what an announcement covered | the key, always |

No arithmetic over those four recovers *what no announcement covered, by key*. So
the aggregate had to hold it, and the one place to write it is
`setHealingTotals` — already the single reading every heal goes through, for all
three call sites and in both directions.

## The change

**`src/core/fight-statistics.ts`** gains two maps on `CombatantStatistics`,
`healedWithoutSkillByHealerId` and `healingGivenWithoutSkillByCombatantId`. Both
are `Map<number, Map<string, number>>` — the shape every damage pair map already
has and the shape the healing pair maps were the only ones to lack. Keyed by the
counterpart as well as by the key, so the pair level and the fight-wide level are
answered from one map instead of two that could disagree.

The condition deciding what counts as covered is `hasAnnouncer`, spelled once and
read by `setSkillTotals` and `setHealingTotals` — they are complements, and two
spellings of a complement drift into counting a heal in both halves or in neither.

**`src/ui/panel-reading.ts`** folds each map back for the fight-wide level, the
receiving side taking in `healedWithoutHealerBySource` as well — a heal with no
healer is a heal with no announcement, so the two partition the unannounced half
between them.

**`src/ui/panel-drill.ts`** draws them as rows in the skills section, exactly as
`composeWoundEntries` has drawn `zranienie` there under `Zadane`, and for that
function's stated reason. The closing row then has nothing left to stand for, so
`CLOSING_LABELS` and `CLOSING_NOTES` narrow to the two damage metrics and the type
refuses a healing lookup. `Nie wiadomo, czym` and its note leave the tree.

Two things surfaced while doing it, both reachable before and neither reached by
any recording:

- The pair section appended its key rows **after** sorting, so a key larger than
  every skill in the pair sat at the bottom of the column. A wound could have done
  the same and none ever did.
- The pair's second section would have drawn the healing keys a second time, out
  of `HEALTH_LOSS_SOURCE_NAMES`, where `heal` means a health *loss* and reads
  *ujemne leczenie*. A healing pair now has no second section at all: it has no
  elements, so the section would have repeated the one above it under a new
  heading.

## What holds it

A measurement, over every capture, in two halves that fail differently:

- `tests/ui/panel-drill.test.ts` totals each healing screen by hand — the keys
  plus the skills — and asserts it equals the figure the section is under. This is
  what licenses the closing row's retirement: a skill or a key accounts for every
  point, exactly.
- The same file asserts that **no drawn row** under either healing metric, at
  either level, carries `UNANNOUNCED_ROW_KEY`, while counting the damage closing
  rows so neither half can pass by finding nothing. The first check cannot see
  this, because a section short by a point is suppressed rather than drawn wrong
  where it holds one row.

`tests/core/fight-statistics.test.ts` holds the maps themselves: one reading
transposed, never exceeding the healing they are part of, and — on fights built by
hand — an announced and an unannounced heal under the same key landing in opposite
halves.

`docs/drill-levels.md` and `tests/tools/drill-report.test.ts` hold the register
both ways: four `closing row` cells under healing are gone, and two `leaf` cells
took their place.

## Rejected alternatives

**Leave the row and reword it.** *"Nic tego nie zapowiedziało"* would have been
true and would have cost nothing. It still answers a question nobody asked: a
player wants to know what healed them, the panel knew, and a truthful row that
withholds a known answer is not better than a false one — it is the same row with
a better excuse.

**Derive the split in the panel from `SELF_SOURCED_HEALING_KEYS`.** On this
material every unannounced heal is under one of those three keys, so the panel
could have subtracted the announced skills from `healedBySource` and assumed the
remainder was theirs. That is a property of the corpus, not of the protocol — an
unannounced `heal_target` is a shape the protocol can send — and it would put a
reading of the keys into the renderer, where §9.1 says it does not go.

**A flat `WithoutSkillBySource` map per direction.** Simpler, and the fight-wide
level is all it would have served. The pair level would then have needed two more
maps or a second rule about which pairs may show a key, and the pair level is where
the row stood 72 of its 231 times.

**Show the keys under `OD CZEGO` only and drop the closing row.** The section
under `Leczenie` already lists them, so this looks like it costs nothing — but it
is the wrong section: `OD CZEGO` cuts **all** the healing by key, announced
included, and would have left the skills section summing to less than the figure
above it with nothing saying why. `Leczenie dane` has no such section at all.

**Retake nothing and leave `screenshots/`.** Considered and refused only after
looking: none of the four pictures opens a healing breakdown, so no picture in
`README.md` shows a row this change moves (§9.8).
