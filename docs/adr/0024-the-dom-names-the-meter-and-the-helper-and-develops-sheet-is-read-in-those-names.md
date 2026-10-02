# 0024. The DOM names the meter and the helper, and `develop`'s sheet is read in those names

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

ADR 0023 named the panel's two windows the meter and the helper in every name of ours. It left the
DOM on `develop`'s words, `panel` and `standing`, because `tests/ui/panel-look.test.ts` holds the
sheet to `develop`'s byte for byte (**W8**). A rename there reddened that test at the first helper
rule. The test reports only the first difference, and every helper rule after it differed too.

In the sheet `develop` @ `fa1dcce` composes, read on 2026-10-02, the two windows are named in 14
rules and 3 CSS variables:

- 11 rules under `.MargoMeter-standing` and `.standing-…`;
- 3 under `.panel`;
- the variables `--MargoMeter-standing-top`, `--MargoMeter-standing-left` and
  `--MargoMeter-panel-top`.

Beyond the sheet, the windows' names stood in four places:

- the grip marks (`data-grip`, `data-size-grip`);
- the helper's fold mark (`data-standing-fold`);
- its tip keys (`standing:`);
- the region the helper is drawn as.

So `CLASS.helper` held `"MargoMeter-standing"`, a name of ours over a word of `develop`'s.

## Decision

Decided with the maintainer on 2026-10-02.

**The DOM speaks the windows' own names.** The meter's class is `meter`, and its variables are
`--MargoMeter-meter-…`. The helper's classes are `MargoMeter-helper` and `helper-…`, and its
variables `--MargoMeter-helper-…`. Both grip marks, the fold mark, the tip keys and the region name
the window they belong to.

**`develop`'s sheet is spelled ours before it is compared.** `DEVELOP_SPELLINGS` in the sheet's test
lists five pairs, `develop`'s word against ours, and the comparison then runs to the byte as before.
A pair whose word `develop`'s sheet no longer spells fails on its own, so the table cannot carry a
dead entry. A value that moved is still a departure, because the table renames and changes nothing
else. Dropping a pair, or changing a declaration in a helper rule, reddens the test.

Rejected: a departure per rule in `SHEET_DEPARTURES`. That would take 14 entries, each setting a
rule aside whole, so a value moved inside one would pass unseen. The table keeps every one of those
rules compared.

Rejected: keeping `develop`'s words in the DOM. A reader of the tree met `CLASS.helper` holding
`standing`, which is the overload ADR 0023 removed from the names.

## Consequences

Nothing a player sees moves. The classes, variables and marks are the panel's own, inside its shadow
root, and the game's sheet cannot reach them. The browser suite's selectors move with them. The
storage keys do not move (`docs/design.md`, Ask first). A design token named for the panel, such as
`SURFACE.panel` or `panelWidthPixels`, is `DESIGN.md`'s and stays.
