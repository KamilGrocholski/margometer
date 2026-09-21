# 0098. A person beside the panel is answered by what their row cut

- **Status:** Superseded by 0100 in part
- **Date:** 2026-09-18

## Context

Every person's row in the window beside the panel is drawn by one function,
`composeStandingPersonElement`, and four sections hand it a person: `Teraz`, the casters opened
under a `Co stoi` row, and both rows of `Prowokacja` — whoever is holding somebody and whoever they
hold.

Two of that row's cells shorten. `.row-name` ellipsises like every name cell the panel draws, and on
a holding row the okrzyk is the cell that gives way first, down to a floor it never goes under
(**ADR 0097**, whose measurement is in `src/ui/panel-look.ts` beside the rule it set: a nickname
drawn at 3 pixels of the 42 it wanted, Chrome on 2026-09-18). Both okrzyki are long — the two
spellings run seventeen and eighteen characters — so the cell that gives way is cut on any row that
carries one.

A card is attached by two steps a builder performs itself: the reading goes into the register under
a key, and that key is written on the row and on every span inside it. This builder did neither. It
was the one row builder in the tree taking no register, so a pointer on those rows was answered by
nothing at all — no card, no cursor, and no mark saying there was anything to reach. What either
cell cut was cut for good, and `DESIGN.md` had promised a card wherever a person's row stands.

The obvious answer was that promise read literally: the card the ranking opens, with the profession
in words, the level, and the figures of the whole fight. `StandingReading` carries none of them. It
holds a name, a hue, a side, a skill and a count of turns, because the window says what is standing
on the fight and never what anybody has done in it.

## Decision

**Every person's row in the window beside the panel registers a card of its own**, keyed by the
section that drew it and by the ids that section already keys the row by, under the window's own
`standing:` prefix — which is what opens the card beside that window rather than beside the panel
(**ADR 0086**, **ADR 0090**).

**What it says is what the row said, whole**: the name, folded over as many lines as it takes; the
okrzyk or the skill the row is about, on the line under it; and the turns the row states, where it
states any. It is **not** a person's card — no profession, no level, no figure of the fight — and it
never restates the turns on a row that deliberately leaves them to the row above (**ADR 0067**).

**The rows take the leaf's cursor**, which is what the panel already draws on a row that answers a
pointer and opens nothing.

The rows of the charge band are not this: they name a skill and not a person.

## Consequences

The window's register goes from one card per counted row to one per row it draws for a person. Its
widest shape is the arithmetic in `tests/ui/share-bound.test.ts`, which states it against the
register's own bound rather than leaving it to be re-derived.

A holder's turns are now said twice — in the row's own cell and on the card — and the character they
hold states none. That asymmetry is **ADR 0067**'s and is deliberate: the turns are the cast's.

Since **ADR 0097** an okrzyk stands in both sections at once, so the same caster and the same skill
name two different rows. That is why the key names the section rather than the pair alone, and why
the held row's key carries its cast as well as the character: a key that leans on somebody else's
keying fails silently the day that keying moves, because the register refuses a duplicate without a
word and the second row then wears the first's card.

`Teraz` is keyed by a word rather than by an id, because there is one such row whoever stands on it.
A card left open while the turn moves therefore renames itself to whoever stands there now, which is
what the row under the pointer says.

A card of a name and a line under it has no run to give up, so it cannot answer a window too short
for it the way a ranking card does — already stated in **ADR 0096**'s Consequences and now reachable
from one row further.

**ADR 0032 is not superseded.** It decided the card of the panel's own rows, at a time when this
window did not exist, and it goes on binding there.

## Alternatives

**The ranking's person card, in this window.** Refused. The reading behind the window carries no
figure of the fight, so the card would have to compose a second reading of the fight for a window
that is not showing one — and **ADR 0069** keeps a card to what names its own person, which is a
harder promise here than in the ranking.

**A `title` attribute on the cut cell.** Refused. It would put two tooltip vocabularies in front of
one reader, one of them the browser's own delay, ink and placement, in a panel whose whole look is
its own (`DESIGN.md`). The panel uses `title` for its chrome — a grip, a control, a pin — and for
nothing a row says.

**The `Prowokacja` section alone**, which is where the gap was noticed. Refused. One builder draws
all four kinds of person row, and a rule that reached three of them would be held by whoever
remembered it rather than by the code.

**Letting the name fold in the row instead.** Refused by **ADR 0097**'s own measurement: the row has
three cells, the turns may not fold, and a folding name is what that decision had already rejected
when it made the okrzyk the cell that gives way.
