/**
 * What stands the suite up: the built file served over a real origin, and a real Chrome pointed
 * at it.
 *
 * An origin and not a `data:` URL, because two of these tests are about `localStorage` and an
 * opaque origin has none. One server and one browser per test, both let go of in `finally`, so a
 * test that fails takes nothing with it and each starts on storage nobody has written to.
 */

import { assert } from "@std/assert";
import { delay } from "@std/async";
import { launch, type Page } from "@astral/astral";
import { composeUserscriptFiles, USERSCRIPT_NAME } from "@/tools/build-userscript.ts";
import { getDevelopmentVersion } from "@/tools/declared-version.ts";
import {
    BROWSER_VARIABLE,
    getBrowserAsked,
    readInstalledBrowser,
} from "@/tools/installed-browser.ts";
import {
    type BrowserPageOptions,
    composeBrowserPage,
    GAME_SCRIPT_NAME,
} from "@/tests/e2e/browser-page.ts";

/** The window every test lays out in, wide enough that nothing is clipped by the frame. */
const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 900;

/**
 * The bundle, built once for the whole run. `composeUserscriptFiles` shells out to a bundler, so
 * building it per test would be most of what the suite costs.
 */
let building: Promise<string> | null = null;

function readUserscriptForTests(): Promise<string> {
    if (building === null) {
        building = composeUserscriptFiles(getDevelopmentVersion()).then((files) => files.script);
    }
    assert(building !== null, "the build is asked for once and awaited by everybody after");
    return building;
}

/** The version the file under test states, for a page that has to recognise its own build. */
export function getVersionForTests(): string {
    const version = getDevelopmentVersion();
    assert(version.length > 0, "a build states the version it is");
    return version;
}

interface BrowserHost {
    url: string;
    stop(): Promise<void>;
}

/**
 * The page, the bundle and the decoy, and nothing else. The decoy answers with an empty script
 * rather than a miss: a host that answers a miss with its own HTML turns the tag into a syntax
 * error, and only its `src` attribute is ever read.
 */
function setBrowserHost(page: string, bundle: string): BrowserHost {
    assert(page.length > 0, "a host serves a page that says something");
    assert(bundle.length > 0, "and a bundle that does something");
    const server = Deno.serve({ port: 0, onListen: () => {} }, (request) => {
        const path = new URL(request.url).pathname;
        if (path === `/${USERSCRIPT_NAME}`) {
            return new Response(bundle, { headers: { "content-type": "text/javascript" } });
        }
        if (path === `/${GAME_SCRIPT_NAME}`) {
            return new Response("", { headers: { "content-type": "text/javascript" } });
        }
        if (path === "/") {
            return new Response(page, { headers: { "content-type": "text/html" } });
        }
        return new Response("not here", { status: 404 });
    });
    return {
        url: `http://localhost:${server.addr.port}`,
        stop: () => server.shutdown(),
    };
}

/**
 * A Chrome this machine already has, never one downloaded. Without `path` astral fetches a
 * browser into a cache of its own, which would mean this suite measured an engine nobody chose
 * and a first run that silently took minutes. A machine with none is refused loudly.
 */
async function launchBrowserForTests(profile: string) {
    const found = await readInstalledBrowser(
        getBrowserAsked(null, Deno.env.get(BROWSER_VARIABLE) ?? null),
    );
    assert(found.length > 0, "a browser was found before one is launched");
    return await launch({
        path: found,
        headless: true,
        args: [
            `--user-data-dir=${profile}`,
            "--disable-gpu",
            "--no-first-run",
            "--hide-scrollbars",
            `--window-size=${WINDOW_WIDTH},${WINDOW_HEIGHT}`,
        ],
    });
}

/** How long a browser is given to stop writing to the profile it was handed. */
const PROFILE_TRIES = 20;
const PROFILE_WAIT_MILLISECONDS = 50;

/**
 * The profile taken away once the browser has finished with it.
 *
 * `browser.close()` returns before Chrome has flushed its own profile, so a removal straight
 * after it is refused with `Directory not empty` — measured on Chrome 152, 2026-09-01, on every
 * one of three runs. The wait is bounded and its exhaustion is an assertion, never a leak nobody
 * is told about (**S2**).
 */
async function setProfileRemoved(profile: string): Promise<void> {
    assert(profile.length > 0, "a profile that was made is the one taken away");
    for (let attempt = 0; attempt < PROFILE_TRIES; attempt += 1) {
        try {
            await Deno.remove(profile, { recursive: true });
            return;
        } catch {
            // The browser has not let go of it yet, which is the question this is asking.
            await delay(PROFILE_WAIT_MILLISECONDS);
        }
    }
    assert(false, `the browser never let go of ${profile}`);
}

/**
 * One test's whole world: a server, a browser, and the page open on a fight already replayed into
 * it. The replay is synchronous and finished before `load`, so there is nothing to wait for.
 */
export async function withBrowserPage(
    options: BrowserPageOptions,
    handle: (page: Page, url: string) => Promise<void>,
): Promise<void> {
    const bundle = await readUserscriptForTests();
    const host = setBrowserHost(composeBrowserPage(options), bundle);
    try {
        await withOpenedPage(host.url, handle);
    } finally {
        await host.stop();
    }
}

/**
 * The same, over many fights in one browser. A launch is most of what a page costs here — 0.9 s
 * against 0.1 s for a page, measured on Chrome 152, 2026-09-01 — so a claim asked of every
 * recording is asked inside one.
 */
export async function withBrowserPagesOver(
    fights: readonly BrowserPageOptions[],
    handle: (page: Page, at: number) => Promise<void>,
): Promise<void> {
    assert(fights.length > 0, "a sweep is over recordings there are some of");
    const bundle = await readUserscriptForTests();
    const profile = await Deno.makeTempDir({ prefix: "margometer-e2e-" });
    try {
        const browser = await launchBrowserForTests(profile);
        try {
            for (const [at, fight] of fights.entries()) {
                const host = setBrowserHost(composeBrowserPage(fight), bundle);
                try {
                    const page = await browser.newPage(host.url);
                    await handle(page, at);
                    await page.close();
                } finally {
                    await host.stop();
                }
            }
        } finally {
            await browser.close();
        }
    } finally {
        await setProfileRemoved(profile);
    }
}

/** A browser of its own, and one page in it, both let go of whatever the handler did. */
async function withOpenedPage(
    url: string,
    handle: (page: Page, url: string) => Promise<void>,
): Promise<void> {
    assert(url.length > 0, "a page is opened on an address");
    const profile = await Deno.makeTempDir({ prefix: "margometer-e2e-" });
    try {
        const browser = await launchBrowserForTests(profile);
        try {
            const page = await browser.newPage(url);
            await page.setViewportSize({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
            await handle(page, url);
            await page.close();
        } finally {
            await browser.close();
        }
    } finally {
        await setProfileRemoved(profile);
    }
}
