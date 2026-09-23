# 0116. The tooltip keeps one order, and a counter is a bare pair

- **Status:** Accepted
- **Date:** 2026-09-23

## Context

**ADR 0107** ordered the add-on's block in a fighter's tooltip by what a reader acts on first, and
**ADR 0115** put the charge at the top of it. Under the name the rows ran: the charge, the okrzyk
from either end, the statuses in the order the client registers the mask's bits, Dotyk anioła,
Ostatni ratunek, and the turns taken last.

Three counters stood in the block, each written its own way: the charge as the client's pair with no
noun, `2 z 4`; the okrzyk as what is left, with a noun, `2 z 3 tur` (**ADR 0109**); Dotyk anioła as
the heals given, with a noun, `1 z 3 uleczeń` (**ADR 0113**). Pomocnik drew the okrzyk's remainder
with the noun too, `Zostało · 1 z 3 tur`.

The maintainer read the block on the preview page, 2026-09-23, and set both: one order that does not
move with what a fighter carries, and every counter as the pair alone.

## Decision

**The block keeps one order, whatever a fighter carries**: the turns taken, the charge, Ostatni
ratunek, Dotyk anioła, the slow (`swow_down`), the haste (`speed_up`), the okrzyk — first how many a
fighter's own shout holds, then who is holding them — and then every other status in mask order. A
row that has nothing to say is left out and the others keep their places relative to each other.

**Every counter is a bare pair, `x z y`**, counting up or down: the charge, the okrzyk, Dotyk
anioła, and the okrzyk's remainder in Pomocnik. One function draws all of them, `composeCounterText`
in `src/ui/panel-words.ts`, and it refuses a figure below nought or past what is stated, as the two
it replaces did. A **sentence** that counts, on a card or under a figure, keeps its noun:
`3 z 5 wiadomości bez odczytu` is not a counter.

This supersedes **ADR 0115** on the order, **ADR 0113** on the noun Dotyk anioła's figure carries,
and **ADR 0109** on the noun a remainder carries. The decision is the maintainer's, 2026-09-23.

## Consequences

Easy: a row is found where it was the last time a fighter was hovered. The slow and the haste, which
change who acts next, stand above the okrzyk and above every other status, whatever bit the client
registered them under.

Hard: three fractions in one block now read alike while two of them count up and one down. Only the
row's own name says which way a pair runs — `Cios specjalny` and `Dotyk anioła` count what has
passed, `Sprowokowany przez` what is left. **ADR 0113** kept its noun precisely so the two would not
read as one figure, and that protection is given up.

Also: a turns row comes first where it stands, so the charge is first under the name only when a
fight was walked into or no turn has been taken yet (`addTurnsRow`). The guard over the charge in
`tests/userscript-entry.test.ts` reads it under the turns.

## Alternatives

**Keep ADR 0115's order, by what a reader acts on first.** It puts the blow about to land at the
top. It lost on the maintainer's choice: an order that changes with what a fighter carries means a
row has to be looked for every time.

**Keep the nouns on the counters.** They say what is counted and in which direction. They lost on
the maintainer's choice, and the direction now rests on the row's name.

**Bare pairs in the tooltip, `tur` kept in Pomocnik.** The window has room for the noun. It lost on
the maintainer's word — every counter, wherever one stands — and it would have had one okrzyk read
two ways on two surfaces, the complaint **ADR 0108** took two sections down over.
