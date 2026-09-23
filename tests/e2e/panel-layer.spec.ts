/**
 * Where the panel stands among the game's own layers: over its interface, and under every window
 * it opens. **ADR 0114.**
 *
 * The game's page is stood in for by two blocks carrying its two numbers, put ahead of the host in
 * `body` as the served page puts its own. Read by paint order, topmost first, and never by a hit
 * test — **ADR 0068** paid for that lesson.
 */

import type { Page } from "@playwright/test";
import { expect, HOST_SELECTOR, test } from "@/tests/e2e/panel-fixture.ts";

/**
 * Read off `/css/style.BLVAkooC.css`, served beside bundle `Bb28FQty` by `tempest.margonem.pl`,
 * 2026-09-23: `.layer{z-index:10}` is the interface layer's, and 11 is the lowest a layer holding
 * a window, the chat or an alert stands at.
 */
const GAME_INTERFACE_LAYER = 10;
const GAME_WINDOW_LAYER_LOWEST = 11;

interface LayerStack {
    windowAt: number;
    hostAt: number;
    interfaceAt: number;
}

interface LayerStandIn {
    selector: string;
    interfaceLayer: number;
    windowLayer: number;
}

/**
 * Stand the game's page up under the panel, cover the left half of the panel with a window at
 * `windowLayer`, and read the stack at a point inside that half and at one outside it.
 */
function readLayerStacks(
    standIn: LayerStandIn,
): { covered: LayerStack; clear: LayerStack } | null {
    const host = document.querySelector(standIn.selector);
    if (host === null) return null;
    const box = host.getBoundingClientRect();
    // The game's own `body`: every layer of theirs is laid out against it and stacked in it.
    document.body.style.cssText += "position:fixed;width:100vw;height:100vh;";
    const positioner = document.createElement("div");
    const surface = document.createElement("div");
    surface.style.cssText =
        `position:absolute;inset:0;background:#000;z-index:${standIn.interfaceLayer};`;
    const covering = document.createElement("div");
    covering.style.cssText = `position:absolute;background:#444;z-index:${standIn.windowLayer};` +
        `left:${box.left}px;top:${box.top}px;width:${box.width / 2}px;height:${box.height}px;`;
    positioner.append(surface, covering);
    document.body.prepend(positioner);
    const readAt = (x: number): LayerStack => {
        const found = document.elementsFromPoint(x, box.top + box.height / 2);
        return {
            windowAt: found.indexOf(covering),
            hostAt: found.indexOf(host),
            interfaceAt: found.indexOf(surface),
        };
    };
    return {
        covered: readAt(box.left + box.width / 4),
        clear: readAt(box.left + (box.width * 3) / 4),
    };
}

/** The stand-in with a window at `windowLayer`, read once the panel has drawn. */
async function readStacksUnder(page: Page, windowLayer: number) {
    const standIn = {
        selector: HOST_SELECTOR,
        interfaceLayer: GAME_INTERFACE_LAYER,
        windowLayer,
    };
    const stacks = await page.evaluate(readLayerStacks, standIn);
    expect(stacks, "the panel stands on the page to be stood among").not.toBeNull();
    return stacks!;
}

test("a window of the game's stands over the panel", async ({ panel }) => {
    await expect(panel.host, "the panel is drawn to be covered").toBeVisible();
    const { covered } = await readStacksUnder(panel.page, GAME_WINDOW_LAYER_LOWEST);
    expect(covered.windowAt, "the window is in the stack at that point").toBeGreaterThanOrEqual(0);
    expect(covered.hostAt, "and so is the panel").toBeGreaterThanOrEqual(0);
    // Topmost first, so what stands over is the smaller index.
    expect(covered.windowAt, "and the game's window is drawn over the panel").toBeLessThan(
        covered.hostAt,
    );
});

test("the panel stands over the game's interface, map and HUD alike", async ({ panel }) => {
    const { clear } = await readStacksUnder(panel.page, GAME_WINDOW_LAYER_LOWEST);
    expect(clear.windowAt, "no window stands at this point").toBe(-1);
    expect(clear.interfaceAt, "the interface does").toBeGreaterThanOrEqual(0);
    expect(clear.hostAt, "and so does the panel").toBeGreaterThanOrEqual(0);
    expect(clear.hostAt, "and the panel is drawn over it, not under it").toBeLessThan(
        clear.interfaceAt,
    );
});

test("the reader tells a window under the panel from one over it", async ({ panel }) => {
    // The sample it must answer the other way: a block under the interface's own number.
    const { covered } = await readStacksUnder(panel.page, GAME_INTERFACE_LAYER - 1);
    expect(covered.windowAt, "the block is in the stack at that point").toBeGreaterThanOrEqual(0);
    expect(covered.hostAt, "and the panel stands over a block under it").toBeLessThan(
        covered.windowAt,
    );
});
