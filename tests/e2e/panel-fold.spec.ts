/**
 * The panel folded away and brought back: what goes, what stays, and what the browser is told.
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";
import { readPanelShape } from "@/tests/e2e/panel-probe.ts";

/** The one key the fold is written under, named as `src/userscript-entry.ts` names it. */
const FOLD_KEY = "MargoMeter-folded";
/** What the control reads while the panel is open, and while it is away. */
const FOLD_MARK = "—";
const UNFOLD_MARK = "+";

test("folding takes the body away and leaves the bar to bring it back by", async ({ panel }) => {
    await expect(panel.at(".MargoMeter-body.folded"), "it starts open").toHaveCount(0);
    await expect(panel.at("[data-fold]"), "and offers the control that folds it").toHaveText(
        FOLD_MARK,
    );
    const open = await panel.place();
    await expect(panel.at(".list .row"), "with a ranking drawn").not.toHaveCount(0);

    await panel.at("[data-fold]").click();

    await expect(panel.at(".MargoMeter-body.folded"), "the body is folded away").toHaveCount(1);
    await expect(panel.at(".list .row"), "and the ranking with it").toHaveCount(0);
    await expect(panel.at("[data-fold]"), "the mark turns round").toHaveText(UNFOLD_MARK);
    await expect(panel.at(".MargoMeter-titlebar"), "the bar stays").toHaveCount(1);
    const folded = await panel.place();
    expect(folded.height, "and the panel takes less of the page").toBeLessThan(open.height);
    expect(await panel.stored(FOLD_KEY), "the browser is told").not.toBeNull();
});

test("unfolding gives back exactly what folding took", async ({ panel }) => {
    const standing = await readPanelShape(panel.page);

    await panel.at("[data-fold]").click();
    await panel.at("[data-fold]").click();

    expect(await readPanelShape(panel.page), "row for row, and the mark back the way it was").toBe(
        standing,
    );
    await panel.expectHonest("a panel folded and opened again");
});

test("a panel folded away is still folded when the reader comes back", async ({ panel }) => {
    await panel.at("[data-fold]").click();
    await expect(panel.at(".MargoMeter-body.folded")).toHaveCount(1);

    await panel.page.reload();

    await expect(panel.host, "a second boot of the same file puts a panel up").toHaveCount(1);
    await expect(panel.at(".MargoMeter-body.folded"), "and it comes back folded").toHaveCount(1);
    await expect(panel.at(".list .row"), "with nothing drawn under the bar").toHaveCount(0);
});
