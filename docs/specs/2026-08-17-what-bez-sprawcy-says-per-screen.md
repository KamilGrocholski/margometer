# What `Bez sprawcy` says, on each of the four screens

Status: implemented

This narrows `docs/specs/2026-08-12-what-nobody-can-be-charged-with.md`, which
decided what the row **counts**. Nothing about the figure changes here. What
changes is what the row *says* when a reader asks it, which that spec left to
the noun and should have left to the direction.

## The defect, as it was reported

> `Bez sprawcy` on the `Zadane` and `Otrzymane` tabs shows healing, and it should
> not — it should show what belongs to the screen that is selected.

Two faults were behind it, and a third of the same family sat beside them.

### One word for two directions

`docs/protocol-keys.md` records that the client states a health **loss** under
`heal`, with a negative figure. The captures carry it: `heal=-92` and its like, 20
occurrences in each of the Hildur fights. The decoder is right — the health really
fell, and the health witness agrees — so those points are damage nobody can be
charged with, and they belong in the pinned figure.

What was wrong is that one table named `heal` once. Measured over
`tests/captured-fights/`, the loss side carries `poison`, `fire`, `injure` and
`heal`; the gain side carries `heal`, `heal_target`, `legbon_holytouch_heal` and
`legbon_lastheal`. `heal` is in both and nothing else is. Named once, a loss
printed as `leczenie 966` beneath a row of damage — healing on a damage screen,
which is exactly what was reported.

This is the fault `src/ui/panel-names.ts` already names for `fire` against `dmgf`,
one entry above: **two quantities under one label is a wrong number that looks
right.**

### One cut for two directions

`composePinnedRow` chose the breakdown by `isHealingMetric` alone. So damage always
got `Z czego` and healing always got `Komu`, whichever way round the reader was
reading. `Otrzymane` — the screen about who lost health — never named a victim, and
`Leczenie dane` — the screen about giving — listed the recipients of healing nobody
gave.

### A cut that did not close against its own figure

`getUnattributedDamageBySource` summed the rows' `healthLostBySource`, while the
figure over it also carried `unattributed.dealtApplied`. Zero on every capture, so
nothing showed. A fight joined in progress resolves no name at all
(`src/core/fight-decoder.ts`), and there it is the whole figure — a section quietly
totalling less than the row above it, which is the failure this project exists to
prevent, in miniature.

## The decision

**The figure follows the noun. The cut follows the direction.**

| Screen | Heading | What it lists |
|---|---|---|
| `Zadane` | `Z czego` | the elements of a blow with no striker, then the keys health fell under |
| `Otrzymane` | `Komu` | each combatant's own health lost and blows with no striker |
| `Leczenie dane` | `Z czego` | the keys the un-credited healing arrived under |
| `Leczenie` | `Komu` | each combatant's healing with no healer |

The figure staying per noun is not conservatism: the same points read from either
end, and that identity is what makes `Σ zadane + bez sprawcy = Σ otrzymane` hold.
It is measured on every capture in `tests/ui/panel-view.test.ts`.

Every one of the four cuts closes against the figure it hangs under, and where the
`Komu` cut cannot place a part of it, that part is a row rather than a silence.

### One sentence that names a limit of ours

`src/ui/panel-nobody.ts` says what the game does not say. The row closing a `Komu`
cut is the one thing in it that says what **we** cannot: the game did state a name
there, and no combatant in this fight answered to it
(`src/core/combatant-roster.ts`). Wording it as *gra nie mówi, komu* would be a
claim about the game that is false, and false in both directions at once — under
`Otrzymane` the unplaced part is a blow whose **attacker** did not resolve, not a
victim nobody named.

### What the aggregate had to grow

`CombatantStatistics.healedWithoutHealerBySource`, and it is not a narrowing anybody
can perform afterwards. `healedBySource` holds every point restored, the credited
ones included; the pinned row holds only the uncredited. Measured on
`tests/captured-fights/2026-08-12-tempest-grupa-vs-hildur-2.json`: 109 113 without a
healer against 123 506 summed over `healedBySource`. Written where
`healedByHealerId` is not, so the two partition `healed` and cannot drift apart.

`getDamageWithoutActor` is the damage twin of `getHealingWithoutHealer` and reads
the same way — what a row holds, less what it can put a name to. It is derived in
`src/ui/panel-reading.ts` rather than stored, because `takenByActorId` already
carries the named half.

## Rejected alternatives

**Four separate figures, one per screen.** The literal reading of the report, and
measured before it was declined: a strictly per-metric figure is
`unattributed.taken` on `Otrzymane` and `unattributed.healed` on `Leczenie`, and
both are **zero on every capture**. The row would vanish from two of the four
screens on all material we hold, which is the defect
`docs/specs/2026-08-12-what-nobody-can-be-charged-with.md` was written to close —
one screen used to say nothing at all. It would also drop the balance, which is the
one arithmetic claim the whole panel rests on.

**Dropping the `heal` loss from the damage figure.** It would make the word problem
go away by making the number wrong. The health fell; `+heal` with a negative figure
is how the client says so, and a meter that quietly leaves it out is the failure in
its purest form.

**Explaining the negative heal in the label.** The published help documents `heal`
as restoration only (`pomoc.margonem.pl`, article `view,372`, engine name `heal`,
read 2026-08-09) and accounts for no negative. Any word saying *why* the health fell
would be ours rather than the game's. `ujemne leczenie` states what the protocol
stated and stops there.

**Drawing both cuts on every screen.** Two sections under a tooltip that is already
three notes and a list, where one of them is always the question the reader did not
ask. The direction is what they chose by clicking a tab; answering it is the point.

**Naming the loss table by hand and checking it against a list.** A list only ever
forbids what somebody thought of. Both tables are re-measured off the captures, so
a key the next recording carries and neither table names fails the gate rather than
reaching a player as the game wrote it.
