/**
 * What the preview answers, without a server standing: the pages, the bundle, the misses, and the
 * stream a rebuild is told on. That the page draws a panel in Chrome is the browser suite's, which
 * drives the same page (`tests/e2e/game-page.ts`).
 */

import { assert, assertEquals, assertStrictEquals, assertStringIncludes } from "@std/assert";
import {
    answerPreviewRequest,
    LISTENERS_MAXIMUM,
    openPreviewEvents,
    type PreviewListeners,
    type PreviewState,
    tellPreviewListeners,
} from "#/tools/preview-server.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";

/** Four calls, so every count a test states is one a reader can check against the file. */
const SHORT = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
const SHORT_NAME = "2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none";
const STATE: PreviewState = {
    script: "built();",
    failure: null,
    fights: [lookupRecordedFight(SHORT)],
};

Deno.test("the index links every recording, and the bundle is the last one built", async () => {
    const index = answerPreviewRequest(new URL("http://p/"), STATE);
    assertStrictEquals(index.status, 200);
    assertStringIncludes(
        await index.text(),
        `<a href="/fight/${SHORT_NAME}">${SHORT_NAME}</a> (4)`,
    );
    const script = answerPreviewRequest(new URL("http://p/margometer.user.js"), STATE);
    assertStrictEquals(await script.text(), "built();");
    assertStrictEquals(script.headers.get("content-type"), "text/javascript");
});

Deno.test("a fight opens where the address says, inside the fight, and whole otherwise", async () => {
    for (
        const [query, fed] of [
            ["", 4],
            ["?through=0", 0],
            ["?through=1", 1],
            ["?through=4", 4],
            ["?through=5", 4],
            ["?through=-1", 4],
            ["?through=two", 4],
        ] as const
    ) {
        const page = answerPreviewRequest(new URL(`http://p/fight/${SHORT_NAME}${query}`), STATE);
        assertStrictEquals(page.status, 200, query);
        const html = await page.text();
        assertStringIncludes(html, `"fedThrough":${fed}}`, `${query} opens after ${fed} calls`);
        assertStringIncludes(html, `<script src="/margometer.user.js"></script>`);
        assertStringIncludes(html, `<span>${SHORT_NAME}</span>`, "under the strip naming it");
    }
});

Deno.test("a recording nobody has and a path nobody serves are misses, and the icon is not", () => {
    assertStrictEquals(answerPreviewRequest(new URL("http://p/fight/nobody"), STATE).status, 404);
    assertStrictEquals(answerPreviewRequest(new URL("http://p/elsewhere"), STATE).status, 404);
    assertStrictEquals(answerPreviewRequest(new URL("http://p/favicon.ico"), STATE).status, 204);
});

Deno.test("a page listening is told a rebuild, and one gone is dropped rather than written to", async () => {
    const listeners: PreviewListeners = new Set();
    const opened = openPreviewEvents(listeners);
    assertStrictEquals(opened.headers.get("content-type"), "text/event-stream");
    assertStrictEquals(listeners.size, 1, "the page is held");
    const reader = opened.body!.getReader();
    const decoder = new TextDecoder();
    assertStrictEquals(decoder.decode((await reader.read()).value), ": open\n\n");
    tellPreviewListeners(listeners, "reload");
    assertStrictEquals(decoder.decode((await reader.read()).value), "data: reload\n\n");
    await reader.cancel();
    assertStrictEquals(listeners.size, 0, "a page that closed its stream is let go");
    tellPreviewListeners(listeners, "reload");
    assertEquals(listeners.size, 0, "and telling nobody is nothing");
});

Deno.test("a stream that closed under a page is dropped the next time pages are told", () => {
    const listeners: PreviewListeners = new Set();
    openPreviewEvents(listeners);
    const [held] = [...listeners];
    held!.close();
    tellPreviewListeners(listeners, "reload");
    assertStrictEquals(listeners.size, 0, "a write the stream refuses lets the page go");
});

Deno.test("past the bound a page is refused a stream rather than held", () => {
    const listeners: PreviewListeners = new Set();
    const opened: Response[] = [];
    for (let index = 0; index < LISTENERS_MAXIMUM; index += 1) {
        opened.push(openPreviewEvents(listeners));
    }
    assertStrictEquals(listeners.size, LISTENERS_MAXIMUM);
    assertStrictEquals(openPreviewEvents(listeners).status, 503, "one past the bound is refused");
    assert(opened.every((one) => one.status === 200), "and every one up to it was not");
    for (const one of opened) one.body!.cancel();
});
