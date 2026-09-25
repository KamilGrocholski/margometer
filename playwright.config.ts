/**
 * The browser suite's settings: where it looks, which engine it drives, what it leaves behind, and
 * why it stands outside `deno task check` rather than in it — **W9**, and `develop ADR 0047`.
 */

import { readFileSync } from "node:fs";
import { cpus, freemem } from "node:os";
import { defineConfig, devices } from "@playwright/test";

/** Spelled as `tools/panel-shots.ts` does, and held level by `tests/tools/panel-shots.test.ts`. */
const BROWSER_VARIABLE = "MARGOMETER_BROWSER";
/** Raises or lowers the count below, for somebody who knows what their machine has spare. */
const WORKERS_VARIABLE = "MARGOMETER_E2E_WORKERS";
/**
 * What one worker holds at its peak, in megabytes. Sampled once a second across a whole run,
 * 2026-09-22: 3266 MB at the peak and 3205 at the median.
 *
 * ⚠️ **One test in isolation is not what a worker costs.** The browser is held across tests, so a
 * worker costs what it has accumulated. The deepest crawl alone reads 2052 MB, and budgeting from
 * that allowed seven workers where there is room for four — this count's own failure mode.
 */
const WORKER_MEGABYTES = 3300;
/** Left for whoever is using the machine. A suite is not worth somebody's desktop swapping. */
const MEGABYTES_SPARED = 1024;
const MEGABYTES_PER_KILOBYTE = 1024;
const AVAILABLE_FIELD = "MemAvailable:";

/**
 * Memory this machine could hand out now, in megabytes.
 *
 * `freemem` answers Linux's `MemFree`, which counts the page cache as taken and so reads a busy
 * machine as having almost nothing — it said 2 GB where `MemAvailable` said 3. The kernel's own
 * figure is the one to divide by, and `freemem` stands where the file does not exist.
 */
function readAvailableMegabytes(): number {
    let text: string;
    try {
        text = readFileSync("/proc/meminfo", "utf8");
    } catch {
        return Math.floor(freemem() / MEGABYTES_PER_KILOBYTE / MEGABYTES_PER_KILOBYTE);
    }
    for (const line of text.split("\n")) {
        if (!line.startsWith(AVAILABLE_FIELD)) continue;
        const said = Number.parseInt(line.slice(AVAILABLE_FIELD.length).trim(), 10);
        if (Number.isSafeInteger(said)) return Math.floor(said / MEGABYTES_PER_KILOBYTE);
    }
    return Math.floor(freemem() / MEGABYTES_PER_KILOBYTE / MEGABYTES_PER_KILOBYTE);
}

/**
 * How many browsers run at once. **Playwright's own default is half the cores**, which was six
 * here against 3 GB free, and five crawls were killed mid-`evaluate` reporting `Channel closed`
 * (`tests/e2e/AGENTS.md`). A count taken off the cores cannot see what else the machine is doing;
 * this one is taken off what it has spare, and never more than the cores would have allowed.
 */
function getWorkerCount(): number {
    const asked = process.env[WORKERS_VARIABLE];
    if (asked !== undefined) {
        const said = Number.parseInt(asked, 10);
        if (Number.isSafeInteger(said)) {
            if (said > 0) return said;
        }
    }
    const spare = readAvailableMegabytes() - MEGABYTES_SPARED;
    const afforded = Math.floor(spare / WORKER_MEGABYTES);
    const allowed = Math.max(1, Math.floor(cpus().length / 2));
    if (afforded < 1) return 1;
    if (afforded > allowed) return allowed;
    return afforded;
}
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
    workers: getWorkerCount(),
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
        // The Chrome this machine has, never one Playwright downloaded — `develop ADR 0047`.
        channel: asked === undefined ? "chrome" : undefined,
        ...(asked === undefined ? {} : { launchOptions: { executablePath: asked } }),
        viewport: { width: WINDOW_WIDTH, height: WINDOW_HEIGHT },
        trace: "retain-on-failure",
    },
    projects: [{ name: "chrome" }],
});
