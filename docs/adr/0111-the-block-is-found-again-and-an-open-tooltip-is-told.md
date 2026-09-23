# 0111. The block is found again, and an open tooltip is told

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

**ADR 0105** put one line into the tooltip the game already shows, written after the engine's own
call and **never read back**; **ADR 0107** made it a block, one `concatTip` per row, with a fighter
who has nothing to say not written to at all. Both assumed the client rebuilds a fighter's tooltip
only while updating them, so the add-on wrote to whom a payload restated.

A reader saw the rows come and go: there on one hover, gone on the next, back on the third, while
the game's own tooltip stood every time. Read on production build `Bb28FQty` (fetched 2026-09-15),
2026-09-22 and 2026-09-23:

- **The client rebuilds more than it restates.** `createWarriorTip` has one caller, `updateWarrior`,
  and `updateWarrior` has three: the restating update, and two in `setFocusOnWarriors`, which runs
  after every payload carrying `w` (`isset(r.w)`, `isset` being `t!==void 0`) and updates each
  warrior whose `getFocusedBy()` answers with `{focusedBy:null}`, then the hero's own `focus` with
  `{focusedBy:<the hero's name>}`. Rows written to the restated alone went missing from the focused
  fighter on every payload that did not restate them.
- **`concatTip` triggers nothing.** It writes `allTips[r]=i+"<br>"+t` and stops. `tip` writes the
  registry and triggers `tipupdate`, on which the client draws an open tooltip again. So a payload
  that rebuilt the fighter under the pointer drew it without the rows, and nothing drew them back.

The first answer, in `de382cc`, followed the client's focus pass: remember whom it left focused and
ask `getFocusedBy()` whom it focuses now. It needed the client's own reading to be exact — the
`focusedBy` field keeps a name the closure has let go of, and reading the field cost 147 second
blocks over `captures/` — and it could never cover an update this repository had not found. Over
`captures/` in an ordinary group fight, where the hero states `focus: 0`, that pass rebuilds nobody,
so it did not answer the report if the report came from one.

Titan Helper, another add-on writing into the same registry, reads the tooltip with `getTipData`,
cuts its own previous block out, and writes the whole string back with `tip`. That is what makes it
indifferent to who rebuilt what, and what makes an open tooltip draw its rows.

## Decision

**The writer remembers the block it left on each fighter, and that block is the one thing read
back.** `getTipData` answers the registry's string; where the remembered block is in it, a changed
block replaces it, and an unchanged one is left alone; where it is not, the game rebuilt that
tooltip and the block goes on again. Nothing else in the string is read, parsed or kept.

**Every fighter the page draws is written on every payload**, each with the rows they should carry
now. A fighter left with nothing to say has the block taken off — which supersedes ADR 0107's _not
written to at all_ — and one that never carried a block is not touched.

**A block goes on through `concatTip` and comes off through `tip`.** `concatTip` writes the `<br>`,
so the break is still the client's own and this add-on hands over **no markup**; `tip` is handed the
registry's own string less ours. Where that would leave the empty string — the client's word for
deleting the tooltip — the block stays.

**An open tooltip is told.** After the rows go on, `trigger("tipupdate")` on the same holders: the
event `tip` itself triggers, handled by the client's own code, which draws the registry again.

**The memory is one board's worth.** A fighter the page no longer draws is forgotten on the payload
that finds them gone, so the map never outgrows `MAXIMUM_COMBATANTS` (**S11**).

## Consequences

Easy: the writer no longer needs to know which of the client's updates rebuilt whom. A focus pass,
an update not found yet, a rebuild this repository will never read — each costs the rows until the
next payload, and never a second block.

Hard: **the add-on now reads the registry**, which ADR 0105 refused and `SECURITY.md` has to say. It
reads the string only to find its own block in it, and a block another add-on appended after ours
stands where it stood.

Hard: **a detach leaves the last block standing** until the game next rebuilds that fighter's
tooltip, which it does on the fighter's next update — as it did before.

Also: the rows for every fighter are composed on every payload rather than for the restated, so the
cost measured beside `writeCarriedToTooltips` moved, and that docblock carries the new figure.

Also: a second copy of the add-on on the same page would not know the first one's block. A second
copy stands down (`SECURITY.md`), so the case is one this record names rather than meets.

## Alternatives

**Following the client's rebuilds, as `de382cc` did.** Exact where the list of rebuilds is complete
and wrong the day the client adds one, and it left an open tooltip drawing the string without rows.

**Writing the whole block with `tip`, as Titan Helper does.** One call instead of a row each, and
the break between rows would be a `<br>` of ours — markup this add-on would be handing over, which
ADR 0107 and `SECURITY.md` refuse.

**A marker around the block**, Titan Helper's `<titanHelperPlus>` tag, found again by a regular
expression. It is markup in somebody else's string, and **C7** refuses the expression; the exact
text of the last block finds it without either.
