/**
 * The rows that open onto another level, and the two ways back out.
 *
 * `docs/drill-levels.md` says the panel is three levels deep and that nothing on the third opens.
 * Both claims are held here in a browser rather than taken.
 */

import { expect, test } from "@/tests/e2e/panel-fixture.ts";
import { DESCENDING } from "@/tests/e2e/panel-crawler.ts";
import { readPanelShape } from "@/tests/e2e/panel-probe.ts";

test("a ranking row opens onto its own level, and says where the reader is", async ({ panel }) => {
    await expect(panel.at(".crumb-here"), "nothing is open to begin with").toHaveCount(0);
    const standing = await readPanelShape(panel.page);

    await panel.at("[data-row]").first().click();

    await expect(panel.at(".crumb-here"), "the crumb names the level").toHaveCount(1);
    await expect(panel.at("[data-back]"), "and offers the way out").toHaveCount(1);
    const named = await panel.at(".crumb-here").innerText();
    expect(named.length, "the level is named after somebody").toBeGreaterThan(0);
    expect(await readPanelShape(panel.page), "and the panel is drawing something else")
        .not.toBe(standing);
    await panel.expectHonest("a row opened");
});

test("the way back lands exactly where it left, both ways of asking", async ({ panel }) => {
    const standing = await readPanelShape(panel.page);

    await panel.at("[data-row]").first().click();
    await panel.at("[data-back]").click();
    expect(await readPanelShape(panel.page), "the crumb takes the reader back").toBe(standing);

    await panel.at("[data-row]").first().click();
    // The cheapest gesture the panel has: a press of the other button, anywhere on it.
    await panel.at(".list").click({ button: "right" });
    expect(await readPanelShape(panel.page), "and so does a press of the menu button").toBe(
        standing,
    );
});

test("the third level is the last, and back pops one rung at a time", async ({ panel }) => {
    const first = await readPanelShape(panel.page);
    await panel.at("[data-row]").first().click();
    const second = await readPanelShape(panel.page);

    const parts = panel.at("[data-skill], [data-source], [data-kind]");
    await expect(parts, "the opened level holds parts to press").not.toHaveCount(0);
    await parts.first().click();
    const third = await readPanelShape(panel.page);
    expect(third, "and one of them opened a third level").not.toBe(second);
    await panel.expectHonest("the third level");

    let deeper = 0;
    for (const mark of DESCENDING) deeper += await panel.at(mark).count();
    expect(deeper, "nothing on the third level opens onto a fourth").toBe(0);

    await panel.at("[data-back]").click();
    expect(await readPanelShape(panel.page), "back goes up one rung").toBe(second);
    await panel.at("[data-back]").click();
    expect(await readPanelShape(panel.page), "and one more brings the ranking back").toBe(first);
});

test("a row nobody was named on opens onto the end the game did name", async ({ panel }) => {
    const pinned = panel.at("[data-unnamed]");
    await expect(pinned, "the fight left something half-named").not.toHaveCount(0);
    const standing = await readPanelShape(panel.page);
    const which = await pinned.first().getAttribute("data-unnamed");
    expect(which === "actor" || which === "target", "it names the end it leaves out").toBe(true);

    await pinned.first().click();

    expect(await readPanelShape(panel.page), "and pressing it opens a level").not.toBe(standing);
    await panel.expectHonest("a pinned row opened");
    await panel.at("[data-back]").click();
    expect(await readPanelShape(panel.page), "with a way back to where it stood").toBe(standing);
});
