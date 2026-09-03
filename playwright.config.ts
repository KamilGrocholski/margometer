/**
 * The browser suite's settings: where it looks, which engine it drives, what it leaves behind, and
 * why it stands outside `deno task check` rather than in it — **W9**, and **ADR 0047**.
 */

import { defineConfig, devices } from "@playwright/test";

/** Spelled as `tools/panel-screenshots.ts` does, and held level by that tool's own guard. */
const BROWSER_VARIABLE = "MARGOMETER_BROWSER";
/** Wide enough to clip nothing the panel draws, tall enough for a drag to the bottom edge. */
const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 900;
/** A test unanswered in half a minute is stuck: every wait here is on a redraw. */
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
        // The Chrome this machine has, never one Playwright downloaded — **ADR 0047**.
        channel: asked === undefined ? "chrome" : undefined,
        ...(asked === undefined ? {} : { launchOptions: { executablePath: asked } }),
        viewport: { width: WINDOW_WIDTH, height: WINDOW_HEIGHT },
        trace: "retain-on-failure",
    },
    projects: [{ name: "chrome" }],
});
