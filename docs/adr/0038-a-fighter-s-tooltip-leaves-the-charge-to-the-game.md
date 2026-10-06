# 0038. A fighter's tooltip leaves the charge to the game

- **Status:** Accepted
- **Date:** 2026-10-06

## Context

`develop ADR 0115` put a row into the add-on's block in a fighter's tooltip for the special blow
being made ready, `Cios specjalny · Pożoga · 2 z 4`, and `develop ADR 0116` kept it second in the
block. Neither record mentions what the game's own part of that tooltip already says.

The game's part says the charge. On production build `DHSqC3Uh` and development build `hb9Z0D4r`,
both read 2026-10-06, `createWarriorTip` fills the `one-warrior-tip` template and calls
`fillTipSuperCast` on it. That method reads the warrior's `super_cast` and fills the template's
`.sc-content` section: the label `#super-cast`, whose dictionary entry is `Cios specjalny:`; the
blow's name; the share passed as a percent; and the turns left, counted down with the client's noun.
Where no charge is stated it takes the section's `active` class away. The same method and section
are in the client copies of 2026-08-04 (`.cache/margonem-klient-1785244275300.js` and the
development copy of that day). So the duplicate dates from `develop ADR 0115` itself, not from a
change on the game's side.

A player hovering a monster that was making a blow ready saw the charge twice, once in the game's
section and once in ours below it. They reported it on 2026-10-06.

## Decision

Decided with the maintainer on 2026-10-06.

**The add-on's block in a fighter's tooltip says nothing of a charge.** The game's section names the
blow and how far its charge has run. Our row said the same with a different notation, so it told a
reader nothing new.

**Pomocnik keeps its charge section.** The window is not the game's, and nothing else on the screen
says there who is making which blow ready.

Rejected: **keeping the row for the pair Pomocnik draws.** It would make the tooltip agree with the
window. That cost two statements of one charge a few rows apart in one tooltip, one counting up and
one counting down, which is the complaint `develop ADR 0108` took two sections down over.

Rejected: **hiding the game's section and keeping ours.** That changes how the game draws its own
tooltip. The add-on only writes rows into it (`CONTEXT.md`, **tooltip**).

## Consequences

`TooltipContent` in `src/ui/panel-words.ts` has no `charge`, and `ROWS_BESIDE_THE_STATUSES` is six.
The block's order from `develop ADR 0116` stands without the charge row. The seam test in
`tests/runtime/carried-tooltip.test.ts` now checks the opposite: across the recordings, a fighter
the envelope states charging carries no charge row of ours.

If the game ever stops drawing `.sc-content`, the charge leaves the tooltip with nobody saying so.
Bringing the row back would then be a new decision, taken against the build that dropped the
section.
