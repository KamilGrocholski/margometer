# 0079. A row naming what the game named takes a place

- **Status:** Accepted
- **Date:** 2026-09-12

## Context

`e1b5a52` gave every row holding no place in the ranking a hatched bar, because a blank number cell
is read as the next place in the order and the closing row of a damage section is often the largest
figure in its own cut. The reasoning was right for what that row was then: **a claim about absence**
— what no announcement covered, which might have been a skill we failed to glue.

**ADR 0078** changed what it holds. The row is now the blows the game numbered a turn for and named
no skill to: 1,580 of them over `captures/`, with `midStrike === 0` re-earned on every run by
`tests/core/granted-blow-rule.test.ts`. That is the **default action** the published help describes
at article `view,372` §1.4 and §2.3 — a thing the game names, not a figure we could not place.

⚠️ **And the rule the hatch came from was already only half true.** At the pair level the same row
**takes a place and draws a solid bar**: `composePairParts` hands `at + 1` to every entry of
`pair.parts` and the closing row is one of them (`PairPart = NamedPart | { kind: "plain" }`). Only
the opened level hatched it. `tests/ui/level-drawn.test.ts` could not see the difference, because
its check asks whether a row's number and its bar agree **with each other** — and both come from one
branch, so a pair-level row carrying a number and no hatch is coherent. The rule was inconsistent;
no row was.

**The pair level also carried the defect its own comment warns about.** `composePairParts`:
_"Appending the keys after an ordered list of skills puts a key larger than every skill at the
bottom of the column, which is the one thing a list of bars says without being read."_ — and it
appended the closing row after the sort, with a number on it.

## Decision

**A row takes a place when it names something the game named.** `person`, `skill`, `source`, `kind`
and now `closing` take one and draw a solid bar. What keeps the hatch is a claim about **absence**
(`half-named`, `neither end`), a remainder its own cut does not explain (`no kind`), or a **sum of
several** rows a bound would not draw (`pozostałe`), whose figure grows with how many we could not
fit rather than with what any one of them did.

**Its figure decides where it stands, as every other row's does** — a number that disagreed with the
position would be worse than no number. On a tie it goes first, because `getTextForNamedPart`
answers the empty text for it and the order's tie-break is lexical.

**Both levels, and the pair's ordering is fixed with it**, so the two stop saying different things
about one row.

⚠️ **This narrows the ordering half of ADR 0055, and nothing else of it.** That decision put
`pozostałe` between the named rows and the closing one, _"because it is neither"_ — true while both
stood outside the order. The closing row has taken a place since, so "between the two" no longer
names a position and the sum falls to the end as the section's only unplaced row. What ADR 0055
settled is untouched: what a bound will not draw is never folded into the row below it.

## Consequences

**In half the sections a reader opens, the first row now reads `Zwykły cios`.** Over `captures/` on
2026-09-12, of the **289** sections that draw one it stands first in **145**, second in 66, third in
53, and lower in 25. That is the whole of what a reader sees change, and it is information rather
than noise: it says most of the damage went out as plain attacks rather than skills. It is also what
this decision is buying, and the reason the count is written here rather than left to a screenshot.

**Nothing else on the screen moves.** No row is added or removed, so every column of shares comes to
a hundred exactly as before and `tests/ui/share-column.test.ts`'s census of 44,337 columns does not
shift. The register of what opens onto what is untouched, so `docs/drill-levels.md` and
`tests/tools/drill-report.test.ts` stand.

**Three guards were needed, because none of the existing ones could see this.** The whole change
passed a green suite of 970 before one was written — which is the finding, not the reassurance.
`getPlacesWrongfullyHeld` asks **which** kinds take a place, where `getPlacesMismarked` beside it
only asks whether a row's two halves agree. `getPlacesOutOfOrder` reads the numbers a section states
in the order they are drawn and requires them to run, which is the only thing tying the reading's
"which place" to the sheet's "where". And a corpus walk holds the pair level's parts to
largest-first.

**One is held by the compiler instead.** `ClosingRow extends PlainRow` with a non-null `place`, so
the row summing a bound has no such field to carry: `rest` taking a place is now a type error rather
than a test. A shared shape with a nullable place left the wrong number on the wrong row unwritable
only by agreement.

⚠️ **`pozostałe` is drawn nowhere in `captures/`** — 0 sections of 289 — because it appears only
past `MAXIMUM_SKILLS`, which no recording approaches. Its ordering is held by a hand-built sample in
`tests/ui/panel-element.test.ts` and by nothing over the material.

## Alternatives

**Leave it hatched.** What stood until now. Rejected once the row stopped being a claim about
absence: a reader is told the panel could not name this, where the panel can name it — it is the
default action, and the guard now proves the row holds nothing else.

**Give it a number but keep it last.** The smallest change, and incoherent: a row carrying `1.`
under a row carrying `13.` is a bar at the bottom of a column saying it is the top of one.

**Give `pozostałe` a place too, on one rule for both.** Simpler to state and rejected on what the
figure means: it is a sum of several rows, so ranking it against single ones compares a total with
its parts. The maintainer settled this.

**Narrow it to `damageDealtApplied`**, where the row also carries a count of blows. Rejected: the
two damage screens read the same figure from two ends, and a rule that placed a row on one and
hatched it on the other would have to be defended every time somebody switched screens.

**Fold the closing row into the sorted `rows` array**, as the pair level models it. Rejected for
this round: `SkillCut.plain` is what `composeCutShares` and a family of assertions in
`tests/ui/panel-reading.test.ts` stand on, and the move buys nothing the place field does not.
