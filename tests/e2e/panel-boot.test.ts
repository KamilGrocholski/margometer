/**
 * The file a reader installs, run by a browser.
 *
 * Every other test in this repository imports TypeScript modules. This one loads what
 * `deno task build` writes — the userscript banner and the bundle under it — and asks whether it
 * executes at all. A bundler that emitted something a browser refuses, a banner that broke the
 * first statement, a top-level construct past the floor: none of them has anything to fail today.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { getRecordedEngineUpdates } from "@/tests/recorded-fight.ts";
import { getVersionForTests, withBrowserPage } from "@/tests/e2e/browser-host.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

Deno.test("the file a reader installs runs, and puts a panel on the page", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    assert(calls.length > 0, "the recording carries calls to replay");
    await withBrowserPage(
        { calls, entryIndex: calls.length, doesLoadTwice: false },
        async (page) => {
            const found = await page.evaluate(() => {
                const host = document.getElementById("MargoMeter-Panel");
                if (host === null) return null;
                return {
                    version: host.getAttribute("data-margometer-version"),
                    hasRoot: host.shadowRoot !== null,
                    rows: host.shadowRoot === null
                        ? 0
                        : host.shadowRoot.querySelectorAll("[data-row]").length,
                };
            });
            assert(found !== null, "the bundle ran and put its host in the page");
            assertEquals(found.version, getVersionForTests(), "and it says which build it is");
            assertEquals(found.hasRoot, true, "and the shadow root it draws into is open");
            assert(found.rows > 0, "and the fight it was fed reached the ranking");
        },
    );
});

Deno.test("the banner the build writes stands over the bundle a browser runs", async () => {
    const calls = getRecordedEngineUpdates(HILDUR);
    await withBrowserPage(
        { calls, entryIndex: 1, doesLoadTwice: false },
        async (page, url) => {
            const answer = await fetch(`${url}/margometer.user.js`);
            const served = await answer.text();
            assertStringIncludes(served, "// ==UserScript==", "the file opens with its banner");
            assertStringIncludes(served, `@version      ${getVersionForTests()}`, "at the version");
            const drawn = await page.evaluate(() =>
                document.getElementById("MargoMeter-Panel") !== null
            );
            assertEquals(drawn, true, "and the same file put a panel up");
        },
    );
});
