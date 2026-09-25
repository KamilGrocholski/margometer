/**
 * What the browser suite reads a page and the recordings with. The page itself is `game-page.ts`.
 *
 * Deliberately **not** `develop:tools/preview-page.ts`, which takes the browser's storage away and appends
 * its script after the bundle has run — so it can neither prove a place survives a reload nor see
 * a throw during boot. **`develop ADR 0047`.**
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";

/** Where the suite serves: the userscript's own `@match`, and a real origin, so storage works. */
export const PAGE_ORIGIN = "https://tempest.margonem.pl";
/** What `readWorldFromPage` takes off that hostname, and what the saved file then states. */
export const PAGE_WORLD = "tempest";

/**
 * The next animation frame, after which the panel has drawn whatever a gesture or a payload before
 * it asked for: the add-on draws once a frame (`docs/design.md` §10.4), and a callback asked for
 * after its own runs after it in the same frame. Every reading of the page waits for this first.
 */
export async function waitForFrame(page: Page): Promise<void> {
    await page.evaluate(() => new Promise<void>((settle) => requestAnimationFrame(() => settle())));
}

/** The payloads of a recording, in order, as the game delivered them. */
export function readRecordedCalls(rootDirectory: string, name: string): unknown[] {
    const text = readFileSync(join(rootDirectory, name), "utf8");
    const read = JSON.parse(text) as { calls?: { payload?: unknown }[] };
    const calls = read.calls ?? [];
    expect(calls.length, `${name} carries calls to replay`).toBeGreaterThan(0);
    return calls.map((call) => call.payload);
}
