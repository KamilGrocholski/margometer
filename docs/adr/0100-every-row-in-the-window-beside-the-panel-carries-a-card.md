# 0100. Every row in the window beside the panel carries a card

- **Status:** Accepted
- **Date:** 2026-09-21

## Context

**ADR 0098** put a card on every **person's** row in the window beside the panel, and wrote the
exception into its own Decision: "The rows of the charge band are not this: they name a skill and
not a person."

That left one row builder in the tree taking no register. `composeChargedSkillElements` drew the one
row a charge stands on out of a bare `CLASS.row` — the only one in `src/` — so the row had no
`data-tip`, no card, and not even the cursor that says a pointer will be answered, because that
cursor rides `CLASS.rowLeaf`.

The row cuts two things. Its name cell is ellipsised by the same rule every name cell in the panel
obeys, and the blows this band draws are long: over `captures/` the names the envelope states run
past what 260 pixels of panel gives the cell. And whoever is making the blow ready is on the row
**only as colour** — the bar cap's hue and the rule on the row's edge. Nowhere in the window is
their name in words. `DESIGN.md`'s Colour Never Alone Rule is met by the row's own words for the
blow, but the person behind it is a hue and nothing else, and the band's heading names only what
became of the **first** charge it drew.

## Decision

**Every row the window beside the panel draws registers a card of its own**, whether it names a
person or a blow. The rule is the window's rows, not the kind of thing a row is about.

A charge's card says what its row had to cut: the blow's name, folded whole; whoever is making it
ready on the line under it, with what became of it at either end; and the turns the client's own
envelope states, under the word a cast's card already states its own turns under.

It is keyed by the combatant making the blow ready, under the window's own `standing:` prefix.

The rows take the leaf's cursor, as every row in that window that answers a pointer and opens
nothing already does.

## Consequences

`tests/ui/panel-standing.test.ts` holds the rule over the window's drawn rows rather than over the
ones a builder was remembered for: it walks every element the sheet styles as a row and reports the
ones with no card. It is proved both ways — a window where every row is marked, and a hand-built one
carrying a row that is not.

The band's heading states one state word, read off the first charge, while each card now states its
own row's. A band of two charges at different ends therefore reads right per row and approximately
in the heading — which is where that approximation already lived.

The register's widest shape grows by `MAXIMUM_CHARGED_ROWS`, which `src/ui/panel-standing.ts` now
exports for `tests/ui/share-bound.test.ts` to count.

Every dot of the charge is marked with the row's key. A card is read off the node under the pointer
and never walked up from, and the dots are the widest run of nodes on that row.

**ADR 0098 stands on its person rows.** Only its carve-out goes, which is why its status says
`in part`.

## Alternatives

**The heading's state word, and nothing else.** Refused. It says what became of a charge and nothing
about whose it is or what the blow is called, which is the half the row cut.

**A `title` attribute on the cut cell.** Refused, for the reason **ADR 0098** refused it: it would
put the browser's own tooltip vocabulary — its delay, ink and placement — in front of a reader of a
panel whose whole look is its own.

**The band left out, and the rule kept to people.** Refused. A rule about the kind of thing a row
names has to be re-decided by whoever writes the next builder, while a rule about the window's rows
is one a walk can hold. That is **ADR 0098**'s own argument for reaching all four person rows at
once, applied one step further out.
