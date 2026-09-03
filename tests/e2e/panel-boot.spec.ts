/**
 * The file a reader installs, run by a browser: whether it executes at all, whether it says which
 * build it is, and what it does on a page that offers it no game.
 *
 * Every other suite in this repository imports TypeScript modules, so a bundler that emitted
 * something a browser refuses has nothing to fail. This is where it fails. **ADR 0047.**
 */

import { expect, HOST_SELECTOR, test } from "@/tests/e2e/panel-fixture.ts";
import { ENGINE_ANSWER } from "@/tests/e2e/panel-page.ts";

/** The line every failure of the add-on's own is branded with, in the one console it holds. */
const FAILURE_LINE = "MargoMeter/Panel";
/** The attach poll gives up after 240 looks of 250 ms. Past that, and nowhere near a real wait. */
const PAST_THE_SEARCH = 70_000;

test("the file a reader installs runs, and puts a panel on the page", async ({ panel }) => {
    await expect(panel.host, "the bundle ran and put its host in the page").toHaveCount(1);
    await expect(panel.host).toHaveAttribute("data-margometer-version", panel.version);
    const hasRoot = await panel.page.evaluate((selector) => {
        return document.querySelector(selector)?.shadowRoot !== null;
    }, HOST_SELECTOR);
    expect(hasRoot, "the shadow root it draws into is open").toBe(true);
    await expect(panel.at("[data-row]")).not.toHaveCount(0);
    await panel.expectHonest("a fight replayed into a fresh page");
});

test("the banner stands over the bundle a browser runs", async ({ built, panel }) => {
    expect(built.script.startsWith("// ==UserScript=="), "the file opens with its banner").toBe(
        true,
    );
    expect(built.script, "at the version the bundle carries").toContain(panel.version);
    await expect(panel.host, "and the file under that banner runs").toHaveCount(1);
});

test("the wrap hands the game its own answer back", async ({ panel }) => {
    const answers = await panel.page.evaluate(() => globalThis.margometerE2e.answers);
    expect(answers.length, "the fight went through the wrapped method").toBeGreaterThan(0);
    const strange = answers.filter((answer) => answer !== ENGINE_ANSWER);
    expect(strange, "and every call got the game's own value back").toEqual([]);
});

test.describe("a page that offers no game", () => {
    test.use({ engine: "none", doesFakeClock: true });

    test("draws no panel, and says so once the search is over", async ({ panel, honesty }) => {
        honesty.allow("no game on this page");
        await expect(panel.host, "a page with no game gets no panel").toHaveCount(0);
        const said: string[] = [];
        panel.page.on("console", (line) => said.push(line.text()));
        // The search is a minute of polling. The clock is moved rather than waited out — the
        // claim is about what the add-on does when it gives up, not about how long that takes.
        // It is installed before the page runs (the fixture's `doesFakeClock`), because a clock
        // swapped in afterwards does not own the interval the add-on has already started. And it
        // is `runFor` rather than `fastForward`: measured on Playwright 1.62, the latter jumps the
        // clock and fires each due timer **once**, so a 250 ms poll advances one look, not 240.
        await panel.page.clock.runFor(PAST_THE_SEARCH);
        await expect.poll(() => said.join("\n"), {
            message: "the reader is told, in the branded line",
        }).toContain("no game on this page");
        expect(said.filter((line) => line.includes(FAILURE_LINE)).length, "once").toBe(1);
        await expect(panel.host, "and giving up draws nothing after all").toHaveCount(0);
    });
});

test.describe("a game that arrives after the first look", () => {
    test.use({ engine: "late", fedThrough: "none" });

    test("still gets a panel, on a later poll", async ({ panel }) => {
        await expect(panel.host, "a later poll found the game and drew").toHaveCount(1);
        const fed = await panel.feed(20);
        expect(fed, "and the fight reaches it through the wrap").toBe(20);
        await expect(panel.at("[data-row]")).not.toHaveCount(0);
        await panel.expectHonest("a game that arrived late");
    });
});

test.describe("the same file loaded twice", () => {
    test.use({ doesLoadTwice: true });

    test("leaves one panel, and the second copy stands down", async ({ panel, honesty }) => {
        honesty.allow("another reader holds the game");
        await expect(panel.host, "one panel, whatever the page loaded").toHaveCount(1);
        await panel.expectHonest("a page carrying the file twice");
    });
});
