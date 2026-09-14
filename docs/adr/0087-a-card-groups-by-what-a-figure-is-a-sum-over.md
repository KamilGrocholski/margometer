# 0087. A card groups by what a figure is a sum over

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

A person's card opened on four figures in the strip's order and hung two sub-lines under two of
them: the figure the protocol stated **before reduction**, at each end. A sub-line indented under a
figure reads as a part of it. It is not one.

`damageDealtRaw` and `damageTakenRaw` grow in `addAttackEvent` alone. `damageDealtApplied` and
`damageTakenApplied` grow there too, and again in `addNamedDamageEvent`, in `addWoundTick` and in
`addHealthChangeEvent` — damage stated against a name arrives already reduced and carries no raw
half, and health moving outside a blow states none either. So the two figures are sums over
different sets of messages, and neither bounds the other.

Measured over `captures/` on 2026-09-14, across the 1,184 cards the corpus composes:

- the sub-line stood **below** the figure it hung under on **296** of them;
- on **172** of those it stood below one figure and above the other **on the same card** — the boss
  rows, where an area attack lands on the party as damage stated against a name;
- the four figures, drawn unconditionally, printed **580** figures of nought, 0.49 to a card.

The reading is not wrong. Summed a third way — blows, plus damage stated against a name, plus health
moving outside a blow — the applied figure reconciles exactly, on all 296 combatant rows, with 0
discrepancies. What was wrong was where it stood.

**The qualifier tried first did not hold.** `surowe z ciosów` — _raw, from blows_ — was this card's
answer on 2026-08-31. It names a scope, and the scope is false: `-dmga`, which the published help
calls _obrażenia nieuchronne_, never carries a `+dmga` half, because nothing reduces it
(`docs/protocol-keys.md`). It is 9.1 % of all damage applied in blows. Counted against the blows'
own applied total the figure still stands short on 5 of the 113 rows stating one.

## Decision

**A card's blocks are cut by what their figures are a sum over, and each block's heading names
that.** Three: the fight, what was struck, what was taken. The figure stated before reduction stands
in the run of its own end, as a line, and never under a figure of the whole fight — there is nothing
above it there to be read as a part of.

**It is worded as what the protocol stated, not as what this reader summed.**
`Podane przed
redukcją`. A label naming a scope makes a claim about coverage; this one does not,
which is the register every other sentence in `src/ui/panel-words.ts` is written in (**L3**).

**The screen's own figure stands whatever it is; the other three stand only above nought.** A screen
showing somebody at nothing must say nothing — that is the answer to what was asked. The other three
at nought answer nobody.

**A count sharing a block with a figure of damage wears `×`.** `composeUsesText` already spells a
count that way.

## Consequences

- The sub-line below its own figure goes from 296 cards to **0**, and figures of nought from 580 to
  **145** — each of those the one a reader pointed at. The card's height falls from a median of 27
  lines to 25, and from 33 at its tallest to 31.
- `CARD_WORDS.damageNote` falls from six lines of the card to three, on the 1,180 of 1,184 cards
  that carry it. The block heading says what the figure is a sum over, so the sentence owes only the
  part no heading can carry: that the game reports neither armour nor resistance, and that no
  subtraction here recovers them.

  **It names no pair of figures, and the first attempt at the short form shows why.** Written as _do
  not subtract one number from the other_, it pointed at whichever two stood nearest — and once the
  figure before reduction had moved into the run, the nearest was `Zatrzymane` directly below it, a
  different pair from the one the sentence was written for. A sentence that forbids one subtraction
  licenses every other by omission. `z tych liczb` voids all of them. The fact stands before the
  consequence, because a sentence whose whole content is an instruction teaches nothing about the
  game.
- **ADR 0032** is narrowed, not reversed. Both runs still stand on every screen and still do not
  turn on it. What the screen now decides, beside which figure is bold, is which figure of nought is
  still worth a line.
- **ADR 0054**'s trim rule named "the four figures"; it now names the first block, which is no
  longer always four.
- A card is one line taller in headings than it would be without the first one. `W całej walce` is
  bought deliberately: the two blow headings only mean something against a named widest scope, and
  unnamed the widest reads as the default every other figure is a part of.

## Alternatives

**Hide the figure from the card.** It survives in the handed-over fight file and in
`deno task fight:figures`, so nothing would be lost permanently, and the three-line sentence would
go with it. Rejected: it is the only view of anything before reduction the panel offers, and the
complaint against it was where it stood, not that it was there.

**Word it a third time and leave it where it was.** Rejected: twice already, and the second attempt
is the one measured above. The adjacency is what a reader reads; no label survives being indented
under a larger number.

**Put the count of blows in the block heading** — `Z 22 ciosów zadanych`. It would make the scope
concrete rather than categorical. Rejected on measurement: `damageDealtBlowLargest` is **not**
blow-scoped. `addNamedDamageEvent` raises it with damage that was never a blow, and it stands above
the largest actual blow on 15 of the 296 rows. A heading counting blows over that line would fix one
false adjacency by writing another.

**Two columns, dealt against taken, in the manner of arcdps.** It removes the vertical component-of
reading just as completely and takes the median card to about 20 lines. Rejected for now on cost,
not on merit: the card would have to grow past 250 px, which re-opens the arithmetic deciding which
side of the panel it opens on, and it needs a `TipLine` carrying two values and a token for an empty
cell.

**Preview the level below on the card** — the cuts by element and by opponent, in the manner of
Details!. `composeDrillReading` composes them lazily from what the card already has in reach, so it
is no change to the data contract. Deferred: it is ten lines on a card whose height was the problem
being paid down here, and it needs a `TipLine` carrying a share and a bar.
