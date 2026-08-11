# The panel and its tabs

Status: implemented

What the add-on draws, decided before any of it was written. The rules it obeys
are already in `AGENTS.md` §9.6 (how the panel fails) and §9.7 (how it looks);
this is where they became a layout.

⚠️ **Four lines below were outgrown before this status caught up, and all are
corrected in place rather than left to disagree with the tree.** The tab strip
ships all three metrics rather than `dealt` alone, and the warning about unread
keys spent its first commits as exactly the banner this file rejects. The panel
has since become movable, which took two more: "nothing that moves" and "nothing
persists" were both written about a panel nobody could pick up. A spec that says
`draft` while its code ships is a spec nobody rereads.

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

## Where the panel sits

The corner is the stylesheet's: `top`, `right`, and a width, on `:host`. A page
where nothing was ever dragged needs no script to place the panel.

It is movable because the corner it defaults to is a corner the game itself
draws in, and the only remedy before this was editing the source.

- **A title bar is the grab area**, and it is built with the shadow root rather
  than with the render. This is the whole design, and the reason is timing: a
  redraw replaces everything the render made, a fight redraws every few seconds,
  and the moment someone reaches for the panel is the moment it is in the way of
  something. A handle built inside the render would be destroyed under the
  pointer exactly then.
- **The drag is delegated at the shadow root**, keyed on the title bar's
  identity — the same shape the tab strip uses, at a node that outlives a redraw.
  The pointer is captured, so a drag faster than a 310px bar is not dropped.
- **The panel cannot be dragged somewhere it cannot be dragged back from.** 64px
  of it stays on screen. Losing the grab area over the edge would leave clearing
  storage as the only remedy, which requires knowing this add-on stores anything.
- **A page that will not say how big it is clamps nothing, and refuses the first
  drag.** A corner-anchored panel has no `left` to read, so the first grab derives
  where it already was from the width and margin the stylesheet used; without a
  viewport there is nothing to derive it from, and a drag from a guessed origin
  would snatch the panel out from under the hand. §9.3: unknown is loud, and a
  viewport read as zero would pin the panel to the corner while looking like a
  panel that works.
- **Where it was left survives a reload**, and it is the only thing that does.
  It is validated on read (§9.6) — a fraction, a number as text, a missing field
  and a truncated write are all *no position*, which is the default corner. A
  browser that refuses storage costs the position and nothing else.

Nothing here is a measurement, which is why persisting it does not contradict
"one fight is enough to be wrong about first" below: a remembered *number* would
be a claim about a fight, and a remembered corner is a claim about a window.

## What this deliberately does not do

- **No third row of tabs**, no per-skill or per-element view. The protocol does
  not join a skill to its damage, so a per-skill ranking would be an inference
  dressed as a reading.
- **No table.** Rank, name, one figure — see above.
- **Nothing that moves on its own.** No animation, no flashing, no sound, no
  focus stealing. The user is playing a game. A drag is the exception that proves
  the line: it moves because a hand is moving it, and it stops the instant the
  hand does.
- **No history across fights** in this spec. One fight is enough to be wrong
  about first — and the position above is remembered because it is not a fight.
- **No resizing, and no collapsing.** Moving the panel answers the question those
  would ("it is in the way"), and each is a second thing to validate on read.
- **No controls in the title bar that are about the numbers.** The bar carries
  exactly one, and it is the exception that states the rule: it hands the fight
  over as a file rather than describing it, which is why it is not a tab. Design
  and refusals: `docs/specs/2026-08-11-capturing-a-fight-to-disk.md`.

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
- **Dragging the panel by anywhere on it.** The largest target, and the one where
  every press has to be decided into a drag or a click — with a tab strip already
  in the panel, a stray drag while aiming for a tab is easy and there is no
  threshold that makes it not so.
- **Measuring the panel with `getBoundingClientRect` to clamp it.** It would widen
  the DOM slice `src/ui/panel-element.ts` takes, and both fake documents, for a
  refinement nobody can see — and the panel's height changes with every payload,
  so what was measured is stale before the next move.
- **Reporting the position on every pointer move.** The caller writes it to
  storage; that would be a write per frame, and what someone settled on is where
  they stopped rather than everywhere they passed through.
- **The entry point applying the styles while the panel reported deltas.** Two
  files holding one position, and a payload landing mid-drag becomes something
  both of them have to be right about.
- **Showing `dealt - taken` as damage prevented.** Not what a defence stopped;
  `prevented` is one component and the protocol reports neither armour nor
  resistance (`src/core/battle-event.ts`).
- **Rendering the whole panel from one function.** A section that throws would
  take the panel with it; §9.6 requires section-by-section isolation, so the
  region split above is structural rather than cosmetic.
