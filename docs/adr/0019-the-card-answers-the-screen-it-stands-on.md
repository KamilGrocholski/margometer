# 0019. The card answers the screen it stands on

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

Hovering a ranking row opens a card stating all four of a combatant's figures with the screen's own
in bold. It could say more: `core/` already carries, on every `AttackEvent`, what fired beside the
blow (`procs`), which defence stopped part of it (`PreventedDamage.defence`), what it destroyed
(`destroyed`) and the blow's own figures. `fight-statistics.ts` aggregated none of the four —
`ARCHITECTURE.md` carried it as a known gap, and `grep` for `procs` outside the decoder and the
event type returned nothing at all.

Measured over `captures/` on 2026-08-30, 28 recordings, 11,906 messages, 3,870 blows: `+crit` rides
903 blows and `+of_crit` 72, of which 20 carry both — 955 critical blows, not 975. `-absorb` stops
part of 624 blows, `-absorbm` 301, `-blok` 175, and all three were folded into one number with the
defence discarded. `+acdmg` occurs 928 times in points of armour and `+resdmg` 1,176 in percentage
points of resistance. A combatant fires at most 8 distinct proc keys in a fight and a median of 1;
one blow fires at most 3.

So the question was not whether the card could say more, but what the extra says on a screen that
did not ask. A reader on _obrażenia otrzymane_ is asking what held, and a run of critical hits and
destroyed armour answers a different question — while a reader on _obrażenia zadane_ has no use for
which defence stopped what. Four screens times every new figure is a card that grows everywhere and
answers nowhere.

## Decision

**The card's identity, its four figures and its notes are the same on every screen. One run in the
middle — how they fought — is the screen's, and it is chosen exhaustively over `PanelMetric`.**

- _Obrażenia zadane_: the criticals as a share of blows struck, the hardest blow, the other procs
  that fired when they struck, and what their blows destroyed on the other side.
- _Obrażenia otrzymane_: what a defence stopped, cut by the defence, then the procs that fired on
  their side of somebody else's blow, then the hardest blow that reached them.
- Both healing screens state nothing there. The protocol says less on that side, and a run invented
  to match the damage screens would be matched out of nothing.

**Which end a proc belongs to is read per key from `docs/protocol-keys.md`, never from the sign.**
`+legbon_curse` fires when its holder attacks and `-legbon_cleanse` when its holder is struck, on
messages of one shape. A key the register refuses an end — `-tenacity` and `+superspell-dispel`,
which article view,372 does not name at all — is decoded and charged to **nobody**.

**A rate is taken of blows.** Nothing here counts a turn (`PRODUCT.md`), so the denominator is
`blowsStruck`, and the numerator counts blows rather than keys.

## Consequences

- `Zatrzymane` leaves the two healing screens, where it stood without answering their question. A
  reader wanting it switches a tab.
- The tallest card any recording composes is 25 lines, measured over `captures/` on 2026-08-30,
  against a bound of 64. A typical one grows by two or three lines, because a part that came to
  nothing is not drawn and the median combatant fires one proc.
- A stat line must never fold. `getTipSize` counts one, so the stylesheet cuts a long label with an
  ellipsis and `tests/ui/blow-vocabulary.test.ts` holds every word to the column's width. Without
  both, a word added later would stand the card lower than it was measured for.
- Damage stated against a name (`+oth_dmg`) now weighs into the hardest blow at both ends and into
  no count of blows at either. It had to: of the 249 rows that took damage over `captures/`, 149 are
  named by nothing else — a party fighting a boss with an area attack records no other landing — and
  a card reading off blows alone left the whole party's hardest hit blank.
- Three word tables are this repository's to keep current, under **ADR 0011**: a key they do not
  hold reaches a reader as the game's own token, and a recording carrying an unworded defence or
  destroyed statistic fails the gate. Six of the twenty proc keys are deliberately unworded.

## Alternatives

**The same card on every screen.** Simplest, and what the card did before. Rejected: every new
figure then appears on all four screens, including the two the protocol states nothing for, and the
card doubles in height to answer one question in four places.

**A card per screen, stating only that screen's figure.** Shorter and sharper. Rejected: comparing
all four figures at once is what the card is _for_ — `DESIGN.md` states it as the component's whole
job — and a reader would have to open four cards to get what one gives them now.

**Reading a proc's end off its sign.** One line instead of a table of twenty. Rejected on the
material: `+legbon_curse` is the striker's and `-legbon_cleanse` the struck combatant's, so the rule
charges half the table to the wrong row, and nothing on the panel would look wrong while it did.

**Wording every key, so no token reaches a reader.** Rejected: `-tenacity` is named nowhere in the
published help, and a name invented for it is a claim about a mechanic nobody here has established.
A visible token is the honest form and the guard fires the day somebody can replace it.

**Charging an unsettled proc to the striker, since most procs are the striker's.** Rejected for the
same reason: it would be right most of the time and wrong silently, which is the shape of every bug
this register exists to prevent.
