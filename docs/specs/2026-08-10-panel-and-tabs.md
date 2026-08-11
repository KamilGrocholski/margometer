# The panel and its tabs

Status: implemented

What the add-on draws, decided before any of it was written. The rules it obeys
are already in `AGENTS.md` §9.6 (how the panel fails) and §9.7 (how it looks);
this is where they became a layout.

⚠️ **Two lines below were outgrown before this status caught up, and both are
corrected in place rather than left to disagree with the tree.** The tab strip
ships all three metrics rather than `dealt` alone, and the warning about unread
keys spent its first commits as exactly the banner this file rejects. A spec that
says `draft` while its code ships is a spec nobody rereads.

## The shape

One panel, in a Shadow DOM, over a dark game. It shows **one fight at a time** —
the one in progress, or the last one that finished. Everything on screen comes
from `composeFightStatistics`; the panel computes nothing (§9.1).

Three regions, each rendered independently so that one failing takes only itself
down (§9.6):

1. **A header** — who is fighting whom, and the state of the reading.
2. **A tab strip** — which figure is being ranked.
3. **A ranking** — one row per combatant, grouped by side.

## Tabs are metrics, and the first one is damage dealt

A tab picks *which number the rows are ranked by*. It does not change who is
listed, so switching tabs never makes a combatant appear or vanish — the eye
keeps its place.

The first tab is **dealt**: `dealtApplied`, the damage a combatant actually
landed. **Taken** and **healed** shipped with it, and no separate spec was
written for either — a tab differs from its neighbours only in which field of
`CombatantStatistics` is ranked, so a spec per tab would be three files saying
the same sentence about a different field name. What a blow **destroyed** is not
a tab and does need its own spec when it comes: its members are not in one unit
(points of armour beside percentage points of resistance), so ranking them
against each other would be adding two different things — the mistake the
aggregate is built to prevent.

**`dealtRaw` is not a tab.** It is not comparable across combatants: damage the
protocol states against a name carries no raw figure, so a combatant working
through area damage would rank far lower on raw than on landed for a reason that
is about the protocol, not about them. It belongs in the detail of a row, labelled,
or nowhere.

## A row

Name, the figure, and the figure's share of the side. A row is read at a glance
during a fight, so nothing else goes in one.

- **No rank number.** The rows are already in order; a digit repeating their
  position is the second number this section was written to keep out.
- The figure is right-aligned and tabular, so the digits line up down the column
  and the eye compares lengths rather than reading each one.
- A bar behind the row shows the share of the side's total, and **the share is
  written as well as drawn**. This is where the section's own "one figure" rule
  gives way, and to a rule that outranks it: §9.7 says colour never carries
  meaning alone, and a bar whose *length* is the meaning is the same case. The
  alternative was a bar nobody could read a number off, which is a chart, not a
  meter.
- Sides are separated with their own heading and their own total. The player's
  own side is labelled as such, which the game states as `myteam`; when the game
  does not say, the sides are shown by number and neither is called ours. Silence
  is not a reason to guess (`src/core/combatant-roster.ts`).

## What the panel says when it does not know

This is the part that makes the panel worth trusting, and it is decided here
rather than left to whoever writes the markup.

- **Zero and unknown never look alike.** A combatant who dealt nothing shows `0`,
  because the log measured nothing for them and that is a reading. What could not
  be read is never a row of its own: the decoder cannot say whose figure a
  message it failed to read would have been, so the mark goes on the total that
  may be short of it — below — and never on a name it would be a guess about.
- **A suspect total is marked at the total**, not in a banner. `FightStatistics`
  carries `reading.unreadableMessages`; while it is non-zero the fight's totals
  carry a small static mark meaning *this may be low*, with the detail on hover.
- **A fight joined late says so.** The wrap can only start reading when the page
  gives it the battle object, and a short fight can arrive entirely in one
  payload — measured, the boar capture delivers all 18 messages in one call. So
  "attached after this fight began" is its own message, distinct from "some keys
  were unreadable"; the first means the numbers are *not* the fight, the second
  that they may be a little low.
- **Damage tied to nobody is shown**, in its own row at the foot of the ranking,
  never distributed across the combatants who might have caused it (§5, and
  `unattributed` in the aggregate).

## What this deliberately does not do

- **No third row of tabs**, no per-skill or per-element view. The protocol does
  not join a skill to its damage, so a per-skill ranking would be an inference
  dressed as a reading.
- **No table.** Rank, name, one figure — see above.
- **Nothing that moves.** No animation, no flashing, no sound, no focus stealing.
  The user is playing a game.
- **No history across fights** in this spec. One fight is enough to be wrong
  about first.

## Rejected alternatives

- **Tabs that also filter who is listed** (all / ours / theirs). Two controls in
  one strip, and the rank a combatant holds would depend on a second thing the
  eye has to track. Sides are already separated by heading, which answers the
  same question without a mode.
- **Ranking by `dealtRaw`.** Not comparable across combatants — see above.
- **A single "damage" tab merging dealt and taken.** They belong to different
  combatants in the same message; merging them is the mistake the aggregate is
  built to prevent.
- **A global warning banner** for unreadable keys. §9.6 puts the warning where
  the consequence is: the question is *can I trust this number*, so the answer
  belongs beside that number.
- **Showing `dealt - taken` as damage prevented.** Not what a defence stopped;
  `prevented` is one component and the protocol reports neither armour nor
  resistance (`src/core/battle-event.ts`).
- **Rendering the whole panel from one function.** A section that throws would
  take the panel with it; §9.6 requires section-by-section isolation, so the
  region split above is structural rather than cosmetic.
