/**
 * The browser suite's settings: where it looks, which engine it drives, and what it leaves behind.
 *
 * It is deliberately not part of `deno task check` — the gate asks for no browser and stays
 * runnable on a machine with none. **ADR 0047.**
 */

import { defineConfig, devices } from "@playwright/test";

/** What names a browser for a run that argues none, spelled as `tools/installed-browser.ts` does. */
const BROWSER_VARIABLE = "MARGOMETER_BROWSER";
/**
 * Wide enough that nothing the panel draws is clipped by the frame, and tall enough that a drag
 * to the bottom edge has somewhere to go.
 */
const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 900;
/**
 * A test that has not answered in half a minute is stuck: every press the panel takes is
 * sub-millisecond and every wait here is on a redraw. The crawl is the one exception and asks
 * for its own, where it stands.
 */
const TEST_MILLISECONDS = 30_000;

const asked = process.env[BROWSER_VARIABLE];

export default defineConfig({
    testDir: "./tests/e2e",
    testMatch: "**/*.spec.ts",
    fullyParallel: true,
    // A browser test that passes on the second attempt is a finding, not a pass.
    retries: 0,
    forbidOnly: process.env.CI !== undefined,
    globalSetup: "./tests/e2e/build-once.ts",
    timeout: TEST_MILLISECONDS,
    // Both under `dist/`, which `.gitignore` already carries: a run leaves no untracked file.
    outputDir: "./dist/e2e/results",
    reporter: [["list"], ["html", { outputFolder: "./dist/e2e/report", open: "never" }]],
    use: {
        ...devices["Desktop Chrome"],
        // The Chrome this machine has, never one Playwright downloaded: `docs/browser-support.md`
        // takes its measurements on the engine the game's readers run, and a bundled Chromium is
        // a different build. A machine with none fails loudly here rather than running nothing.
        channel: asked === undefined ? "chrome" : undefined,
        ...(asked === undefined ? {} : { launchOptions: { executablePath: asked } }),
        viewport: { width: WINDOW_WIDTH, height: WINDOW_HEIGHT },
        trace: "retain-on-failure",
    },
    projects: [{ name: "chrome" }],
});
