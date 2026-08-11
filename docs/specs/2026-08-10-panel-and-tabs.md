# The panel and its tabs

Status: implemented

What the add-on draws, decided before any of it was written. The rules it obeys
are already in `AGENTS.md` §9.6 (how the panel fails) and §9.7 (how it looks);
this is where they became a layout.

⚠️ **This file has been corrected in place twice, rather than left to disagree
with the tree.** First: the tab strip ships all three metrics rather than `dealt`
alone; the warning about unread keys spent its first commits as exactly the
banner this file rejected; and the panel became movable, which retired both
"nothing that moves" and "nothing persists". A spec that says `draft` while its
code ships is a spec nobody rereads.

⚠️ **Second, and larger: on 2026-08-11 the panel's layout was chosen against the
prior art of arcdps, Details!, Skada and ESO's meters, and five of the decisions
below were reversed.** Rank numbers, one flat ranking instead of a section per
side, a bar measured against the top row, a detail beside the panel, a footer
that spells the gaps out, and 11px. Each reversal is marked **CHANGED
2026-08-11** where the old decision stood, with what it cost — because three of
them cost something real and a spec that records only the new answer is a spec
that will re-litigate the same argument next year.

## The shape

One panel, in a Shadow DOM, over a dark game. It shows **one fight at a time** —
the one in progress, or the last one that finished. Everything on screen comes
from `composeFightStatistics`; the panel computes nothing (§9.1).

Regions, each rendered independently so that one failing takes only itself down
(§9.6):

1. **A tab strip** — which figure is being ranked.
2. **A header** — who is fighting whom, and the state of the reading.
3. **A ranking** — one row per combatant. **CHANGED 2026-08-11:** one flat list
   rather than a section per side.
4. **A footer** — what the reading is short of, in words. Added 2026-08-11.
5. **A detail** — one combatant's figures, beside the panel. Added 2026-08-11,
   and its own region for the same reason as the rest: it may fail alone.

The body is **11px** (CHANGED 2026-08-11, from 12px). Eleven combatants is the
largest fight on record; at twelve the flat ranking plus a footer runs past the
fold on a laptop. Nothing measures this — it is a judgement, and it is the one
line here a test cannot hold.

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

- **CHANGED 2026-08-11 — there is a rank number.** This file argued against one
  on the grounds that the rows are already in order, and that argument still
  holds while the order is by value: the digit repeats the position. It was
  asked for anyway and it is drawn. **What it would earn its place doing** is
  carrying the rank when the order is *not* by value — and the code is written
  for that already: `composeRankedRows` ranks by value and then lays the rows
  out, so a stable order would leave the number saying the only thing position
  no longer says. Until the order changes, this is a second number, exactly as
  written above.
- The figure is right-aligned and tabular, so the digits line up down the column
  and the eye compares lengths rather than reading each one.
- **CHANGED 2026-08-11 — the bar is measured against the top row, not against
  the total.** The top row now always fills the width, which makes neighbours
  easy to compare and is what every meter in the prior art does.
  **What it costs, and it is not nothing:** the bar and the percentage printed
  beside it are now *different quantities* — the bar ranks, the share states —
  so the bar can no longer be read off as a number. The sentence this replaced
  ("the share is written as well as drawn") was doing work: §9.7 says colour
  never carries meaning alone, and a bar whose length is the meaning is the same
  case. The share is still written, so the row is not silent; but the drawn
  thing and the written thing no longer agree, and that is a genuine loss.
  The alternative considered was printing the leader-relative percentage
  instead, which is a number about another row rather than about this one.
- **CHANGED 2026-08-11 — sides are no longer separated into sections.** One flat
  ranking, and each row says `us`, `them`, or the side's own number when the game
  never stated `myteam` — silence is still not a reason to guess
  (`src/core/combatant-roster.ts`). A combatant the roster could not place says
  `s?` rather than nothing, and is in the same list rather than under a heading
  of their own.
  **What it costs:** the total the shares are taken against is now the whole
  fight's, so both sides' shares sum to one and an enemy can outrank the party in
  the party's own meter. Per-side totals are gone from the screen with the
  headings. The side is text and not a coloured dot, because §9.7 forbids colour
  carrying a meaning alone and a dot beside the word would only repeat it.

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
- **CHANGED 2026-08-11 — and the same gaps are also spelled out in a footer.**
  ⚠️ **In addition to the mark, never instead of it.** §9.6 puts the warning
  where the consequence is, and the banner this file rejects below is one that
  *replaces* the mark; a summary that leaves every mark in place is a different
  thing. The mark answers *can I trust this figure*, which is a question about
  one number; the footer answers *what happened*, which needs a sentence and has
  nowhere else to go. A certain line is coloured differently from a suspected
  one, for the same reason zero and unknown never look alike: one says healing
  **is** short, the other that a total **may** be. Both halves are held by
  `tests/ui/panel.test.ts`, so deleting the mark to avoid saying it twice fails
  rather than reading as tidying.
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

- **No per-skill view, ever.** The protocol does not join a skill to its damage,
  so a per-skill ranking would be an inference dressed as a reading. The detail
  says so on screen rather than leaving the absence to be wondered about.
- **CHANGED 2026-08-11 — there is a per-element view, in the detail.** It was
  refused here alongside per-skill, and the two are not alike: the element is
  read off the damage key itself, so `dealtAppliedByElement` is a reading and not
  an inference. The aggregate has carried it since it was written and nothing
  drew it.
- **No table.** Rank, name, one figure — see above.
- **Nothing that moves on its own.** No animation, no flashing, no sound, no
  focus stealing. The user is playing a game. A drag is the exception that proves
  the line: it moves because a hand is moving it, and it stops the instant the
  hand does.
- **No history across fights** in this spec. One fight is enough to be wrong
  about first — and the position above is remembered because it is not a fight.
- **No resizing, and no collapsing.** Moving the panel answers the question those
  would ("it is in the way"), and each is a second thing to validate on read.
- **The detail is beside the panel, not inside a row.** Added 2026-08-11. A
  redraw arrives every few seconds, and a row that expands in place changes the
  height of everything under it — so the thing a reader was about to click moves
  out from under the pointer at the worst moment. Beside it, the ranking keeps
  its geometry. It hangs off the panel's **left** edge, which is the side with
  room from the default top-right corner; a panel dragged hard to the left takes
  the detail off screen, and that is open rather than solved — the remedy today
  is to move the panel back. Pressing the open row closes it, so the gesture
  undoes itself and no second control is needed.
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
- **A global warning banner** for unreadable keys — meaning one that **replaces**
  the mark at the total. §9.6 puts the warning where the consequence is: the
  question is *can I trust this number*, so the answer belongs beside that
  number. The footer added 2026-08-11 is not this: every mark stays, and a test
  holds both.
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
