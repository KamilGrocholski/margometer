/**
 * One test's whole world: the built bundle served on a real origin, a game under it, and a fight
 * replayed into the panel through the game's own method.
 *
 * The page is served by intercepting requests rather than by standing a server up. The origin is
 * real either way, which is what `localStorage` needs, and a context per test is what makes the
 * store fresh without a profile to take away afterwards. **ADR 0047.**
 */

import { expect, type Locator, type Page, test as base } from "@playwright/test";
import {
    getRepositoryRoot,
    readBuiltUserscript,
    readBuiltVersion,
    USERSCRIPT_NAME,
} from "@/tests/e2e/build-once.ts";
import {
    composePanelPage,
    type EnginePresence,
    GAME_SCRIPT_NAME,
    PAGE_ORIGIN,
    readRecordedCalls,
} from "@/tests/e2e/panel-page.ts";

/** The host the add-on puts in the page, and the marks a test reaches its controls by. */
export const HOST_SELECTOR = "#MargoMeter-Panel";
/** What a region that gave way is drawn as. Nowhere in a healthy panel. */
export const UNDRAWN_SELECTOR = ".undrawn";
/** What no row a person reads may ever say. */
const NEVER_SAID = ["undefined", "NaN", "[object"];

export interface PanelOptions {
    /** The recording replayed, as a path from the repository root. */
    recording: string;
    /** How much of it the page has delivered by `load`: all of it, none, or a count. */
    fedThrough: number | "all" | "none";
    engine: EnginePresence;
    doesLoadTwice: boolean;
    /**
     * Whether the browser's clock is Playwright's before the page runs. It has to be installed
     * ahead of the scripts, or the poll the add-on already started keeps the real one.
     */
    doesFakeClock: boolean;
}

export interface PanelHandle {
    page: Page;
    /** The version the banner states, for a page that has to recognise its own build. */
    version: string;
    host: Locator;
    /** Everything under that mark, shadow root and all — Playwright's CSS pierces an open one. */
    at(selector: string): Locator;
    /** Deliver the next payloads through the game's own method, and answer how many have gone. */
    feed(count: number): Promise<number>;
    remaining(): Promise<number>;
    /** Deliver the recording again from its first payload, which opens a second fight. */
    rewind(): Promise<void>;
    place(): Promise<{ left: number; top: number; width: number; height: number }>;
    stored(key: string): Promise<string | null>;
    /** The last file the panel handed over, kept by the probe as the `Blob` was built. */
    saved(): Promise<string | null>;
    said(): Promise<string>;
    /** Nothing given way, and no row reading a value nobody composed. */
    expectHonest(where: string): Promise<void>;
}

/** What the page was told, and what it threw, gathered for the whole of one test. */
export interface PanelHonesty {
    allow(fragment: string): void;
}

interface PanelFixtures {
    honesty: PanelHonesty;
    panel: PanelHandle;
}

/** Read once per worker rather than once per test, because the build is the same file for all. */
interface PanelWorkerFixtures {
    built: { script: string; version: string };
}

/** Everything the page asks the network for, answered from memory. */
async function setPageServed(page: Page, script: string, html: string): Promise<void> {
    await page.route("**/*", (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === `/${USERSCRIPT_NAME}`) {
            return route.fulfill({ contentType: "text/javascript", body: script });
        }
        // An empty script and never a miss: a host answering one with its own HTML turns the tag
        // into a syntax error, and only the `src` attribute is ever read.
        if (path === `/${GAME_SCRIPT_NAME}`) {
            return route.fulfill({ contentType: "text/javascript", body: "" });
        }
        if (path === "/") return route.fulfill({ contentType: "text/html", body: html });
        return route.fulfill({ status: 404, body: "not here" });
    });
}

/** The handle a spec is given, once the page is open on a panel that has drawn something. */
function composePanelHandle(page: Page, version: string): PanelHandle {
    const at = (selector: string) => page.locator(selector);
    const said = () =>
        page.evaluate((selector) => {
            const host = document.querySelector(selector);
            return host?.shadowRoot?.textContent ?? "";
        }, HOST_SELECTOR);
    return {
        page,
        version,
        host: page.locator(HOST_SELECTOR),
        at,
        feed: (count) => page.evaluate((step) => globalThis.margometerE2e.feed(step), count),
        remaining: () => page.evaluate(() => globalThis.margometerE2e.remaining()),
        rewind: () => page.evaluate(() => globalThis.margometerE2e.rewind()),
        place: () =>
            page.evaluate((selector) => {
                const host = document.querySelector(selector);
                if (host === null) return { left: -1, top: -1, width: 0, height: 0 };
                const box = host.getBoundingClientRect();
                return {
                    left: Math.round(box.left),
                    top: Math.round(box.top),
                    width: Math.round(box.width),
                    height: Math.round(box.height),
                };
            }, HOST_SELECTOR),
        stored: (key) => page.evaluate((named) => globalThis.localStorage.getItem(named), key),
        saved: () =>
            page.evaluate(() => {
                const kept = globalThis.margometerE2e.saved;
                return kept.length === 0 ? null : (kept[kept.length - 1] ?? null);
            }),
        said,
        async expectHonest(where) {
            await expect(at(UNDRAWN_SELECTOR), `${where}: a region gave way`).toHaveCount(0);
            const drawn = await said();
            for (const never of NEVER_SAID) {
                expect(drawn, `${where}: a row reads ${never}`).not.toContain(never);
            }
        },
    };
}

export const test = base.extend<PanelFixtures & PanelOptions, PanelWorkerFixtures>({
    recording: ["captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json", {
        option: true,
    }],
    fedThrough: ["all", { option: true }],
    engine: ["before", { option: true }],
    doesLoadTwice: [false, { option: true }],
    doesFakeClock: [false, { option: true }],

    // Worker-scoped: the build is on disk by global setup, and reading it once per worker is the
    // difference between one file read and one per test.
    // ⚠️ Playwright reads a fixture's dependencies off the destructuring pattern of its first
    // argument and refuses anything else, so a fixture that needs none still has to destructure.
    // `playwright` is the harmless one to name; `deno lint` refuses the empty pattern.
    built: [async ({ playwright: _playwright }, use, workerInfo) => {
        const root = getRepositoryRoot(workerInfo.config);
        await use({ script: readBuiltUserscript(root), version: readBuiltVersion(root) });
    }, { scope: "worker" }],

    // Automatic, so `PRODUCT.md`'s fourth pillar — the panel never costs the reader an exception —
    // is asserted by every test in this suite rather than by the one that remembered to ask.
    honesty: [async ({ page }, use) => {
        const allowed: string[] = [];
        const loud: string[] = [];
        page.on("pageerror", (thrown) => loud.push(`threw ${String(thrown.message)}`));
        page.on("console", (said) => {
            if (said.type() !== "error" && said.type() !== "warning") return;
            loud.push(`said ${said.type()}: ${said.text()}`);
        });
        await use({ allow: (fragment) => allowed.push(fragment) });
        const unexpected = loud.filter((one) =>
            !allowed.some((fragment) => one.includes(fragment))
        );
        expect(unexpected, "the panel cost the reader nothing on the console").toEqual([]);
    }, { auto: true }],

    panel: async (
        { page, built, recording, fedThrough, engine, doesLoadTwice, doesFakeClock },
        use,
        info,
    ) => {
        const calls = readRecordedCalls(getRepositoryRoot(info.config), recording);
        const through = fedThrough === "all"
            ? calls.length
            : fedThrough === "none"
            ? 0
            : fedThrough;
        const html = composePanelPage({ calls, fedThrough: through, engine, doesLoadTwice });
        await setPageServed(page, built.script, html);
        if (doesFakeClock) await page.clock.install();
        await page.goto(`${PAGE_ORIGIN}/`);
        // A page standing no game up puts no panel in the document, and that is what its own
        // spec is about; every other test starts on a panel that has already drawn.
        if (engine === "before") await page.waitForSelector(HOST_SELECTOR);
        await use(composePanelHandle(page, built.version));
    },
});

export { expect };
