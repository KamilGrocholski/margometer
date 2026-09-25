/**
 * The browser half of `deno task panel:shots`: Chrome opened as this suite opens it, the page served
 * from memory on this suite's origin, a state reached by a real pointer, and the windows measured.
 * It stands here because Playwright is this directory's to import; `tools/panel-shots.ts`, which
 * runs on Deno, decides the frame and writes the set.
 */

import { type Browser, chromium, type Page } from "@playwright/test";
import { GAME_SCRIPT_NAME, HOST_SELECTOR } from "./game-page.ts";
import { PAGE_ORIGIN, waitForFrame } from "./panel-page.ts";

/** A real press or a real hover, on the `at`th element carrying `mark` inside the panel. */
export interface PanelGesture {
    doesHover: boolean;
    mark: string;
    at: number;
}

/** An edge-to-edge rectangle, as the browser reports one. */
export interface PanelBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** What one picture is taken of: the page, the bundle it names, and the window it stands in. */
export interface PanelServed {
    html: string;
    scriptName: string;
    script: string;
    viewport: { width: number; height: number };
}

/** The variable's path where one is named, the Chrome this machine has otherwise. */
export async function launchPanelBrowser(executablePath: string | null): Promise<Browser> {
    if (executablePath === null) return await chromium.launch({ channel: "chrome" });
    return await chromium.launch({ executablePath });
}

/** The page open, drawn, and walked through each gesture with a frame after it. */
export async function openPanelPage(
    browser: Browser,
    served: PanelServed,
    gestures: readonly PanelGesture[],
): Promise<Page> {
    const page = await browser.newPage({ viewport: served.viewport });
    await routePanelPage(page, served);
    await page.goto(`${PAGE_ORIGIN}/`);
    await page.waitForSelector(HOST_SELECTOR);
    await waitForFrame(page);
    for (const gesture of gestures) {
        const target = page.locator(`${HOST_SELECTOR} [${gesture.mark}]`).nth(gesture.at);
        if (gesture.doesHover) await target.hover();
        else await target.click();
        await waitForFrame(page);
    }
    return page;
}

/** Everything the page asks the network for, answered from memory. */
async function routePanelPage(page: Page, served: PanelServed): Promise<void> {
    await page.route("**/*", (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === `/${served.scriptName}`) {
            return route.fulfill({ contentType: "text/javascript", body: served.script });
        }
        // An empty script and never a miss: only the tag's `src` is read, for the build id.
        if (path === `/${GAME_SCRIPT_NAME}`) {
            return route.fulfill({ contentType: "text/javascript", body: "" });
        }
        if (path === "/") return route.fulfill({ contentType: "text/html", body: served.html });
        return route.fulfill({ status: 404, body: "not here" });
    });
}

/**
 * The panel, then the window beside it, then the card where one is open and has a width. Null where
 * either window stands nowhere, which a picture would otherwise hide.
 */
export async function readPanelBoxes(
    page: Page,
    standingClass: string,
    tipClass: string,
): Promise<PanelBox[] | null> {
    const panel = await page.locator(HOST_SELECTOR).boundingBox();
    const standing = await page.locator(`${HOST_SELECTOR} .${standingClass}`).boundingBox();
    if (panel === null || standing === null) return null;
    const cards = page.locator(`${HOST_SELECTOR} .${tipClass}`);
    const card = await cards.count() === 0 ? null : await cards.first().boundingBox();
    const boxes = [panel, standing];
    if (card !== null && card.width > 0) boxes.push(card);
    return boxes;
}

/** A page let go without a picture, where the measurement refused one. */
export async function closePanelPage(page: Page): Promise<void> {
    await page.close();
}

/** The frame written as a picture, and the page let go either way. */
export async function writePanelPicture(page: Page, clip: PanelBox, path: string): Promise<void> {
    try {
        await page.screenshot({ path, clip });
    } finally {
        await page.close();
    }
}
