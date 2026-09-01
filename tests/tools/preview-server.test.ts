/**
 * The routes a preview server answers, held against a bundle that is handed in.
 *
 * The bundler is injected rather than run: what is under test is which page a request gets and
 * what a reload stream says, and a real bundle would add a subprocess to every one of them.
 */

import { assert, assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { setPreviewServer } from "@/tools/preview-server.ts";
import {
    getPreviewRecordedFight,
    getRecordedFightNames,
    getRecordedFights,
} from "@/tools/recorded-fights.ts";

const BUNDLE = "window.__margometerPreviewBundle = 1;\n";

function composeTestServer() {
    const preview = setPreviewServer({
        port: 0,
        shouldWatch: false,
        readBundle: () => Promise.resolve(BUNDLE),
    });
    assert(preview.port > 0, "a server under test listened somewhere");
    assertStringIncludes(preview.url, `${preview.port}`, "and says where");
    return preview;
}

Deno.test("the page route draws what it was asked for, and refuses what nobody filed", async () => {
    const preview = composeTestServer();
    try {
        const names = getRecordedFightNames();
        const asked = names[1] ?? "";
        assert(asked.length > 0, "there is a second recording to ask for by name");
        const answer = await fetch(`${preview.url}/?fight=${encodeURIComponent(asked)}&entry=3`);
        const page = await answer.text();
        assertEquals(answer.status, 200, "a recording that exists is drawn");
        assertStringIncludes(page, asked, "and the page says which one it is");
        assertStringIncludes(page, `"entryIndex":3`, "stopping where the address said");

        const missing = await fetch(`${preview.url}/?fight=nobody-recorded-this`);
        assertEquals(missing.status, 404, "and a name nobody filed is refused");
        await missing.body?.cancel();
    } finally {
        await preview.stop();
    }
});

Deno.test("an address that names no entry opens on the finished fight", async () => {
    const preview = composeTestServer();
    try {
        const answer = await fetch(`${preview.url}/`);
        const page = await answer.text();
        assertEquals(answer.status, 200, "the address a reader is handed draws");
        const fight = getPreviewRecordedFight(getRecordedFights());
        assertStringIncludes(page, fight.name, "the one fight every preview opens on");
        assert(
            page.includes(`"entryIndex":${fight.calls.length}`),
            "counted to the end, which is what somebody starting this came to look at",
        );
        assert(fight.calls.length > 0, "and the end of a fight is past its first call");
    } finally {
        await preview.stop();
    }
});

Deno.test("a rebuild reloads the page carrying what the harness had on screen", async () => {
    const preview = composeTestServer();
    try {
        const answer = await fetch(`${preview.url}/`);
        const page = await answer.text();
        assertStringIncludes(
            page,
            `new EventSource("/reload")`,
            "a served page listens for a rebuild",
        );
        assert(
            page.includes(`"/?fight=" + encodeURIComponent(name) + composePreviewStateHash()`),
            "and comes back on the fight it was on, carrying the state it was in",
        );
        assert(
            !page.includes(`+ "&entry=" + fedCount`),
            "the entry rides in that hash, not beside it",
        );
    } finally {
        await preview.stop();
    }
});

Deno.test("an entry past the end of a fight is clamped to it rather than refused", async () => {
    const preview = composeTestServer();
    try {
        const answer = await fetch(`${preview.url}/?entry=99999999`);
        const page = await answer.text();
        assertEquals(answer.status, 200, "an address nobody could reach still draws");
        const at = page.indexOf(`"entryIndex":`);
        const count = page.indexOf(`"entryCount":`);
        assert(at > 0, "the page states where the replay stops");
        assert(count > at, "beside the length it was clamped against");
        assert(!page.includes(`"entryIndex":99999999`), "and it is not the number that was asked");
    } finally {
        await preview.stop();
    }
});

Deno.test("the calls route hands a fight over with no page in front of it", async () => {
    const preview = composeTestServer();
    try {
        const name = getRecordedFightNames()[0] ?? "";
        const answer = await fetch(`${preview.url}/calls?fight=${encodeURIComponent(name)}`);
        const calls = await answer.json();
        assert(Array.isArray(calls), "the calls arrive as a list");
        assert(calls.length > 0, "with something in it to feed");

        const unnamed = await fetch(`${preview.url}/calls`);
        assertEquals(unnamed.status, 404, "nothing asks for calls without saying whose");
        await unnamed.body?.cancel();
    } finally {
        await preview.stop();
    }
});

Deno.test("the bundle is served under the name the page asks for it by", async () => {
    const preview = composeTestServer();
    try {
        const answer = await fetch(`${preview.url}/margometer.user.js`);
        assertEquals(await answer.text(), BUNDLE, "what was built is what is served");
        assertEquals(answer.status, 200, "and it is served as an answer, not as a refusal");

        const decoy = await fetch(`${preview.url}/main.min1785244275300.js`);
        assertEquals(decoy.status, 404, "the decoy's 404 is expected: only its `src` is read");
        await decoy.body?.cancel();
    } finally {
        await preview.stop();
    }
});

Deno.test("the reload stream opens, and stopping the server takes it with it", async () => {
    const preview = composeTestServer();
    const answer = await fetch(`${preview.url}/reload`);
    assertEquals(answer.headers.get("content-type"), "text/event-stream", "a stream is opened");
    const body = answer.body;
    assertExists(body, "and it carries one");
    const reader = body.getReader();
    const first = await reader.read();
    const opening = new TextDecoder().decode(first.value);
    assertStringIncludes(opening, "retry:", "saying how soon a browser should come back");
    await reader.cancel();
    await preview.stop();
});
