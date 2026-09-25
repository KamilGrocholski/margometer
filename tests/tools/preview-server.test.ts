/**
 * The routes a preview server answers, held against a bundle that is handed in: which page a
 * request gets and what a reload stream says. A real bundle would add a subprocess to each, so the
 * bundler is injected rather than run. That the page draws a panel is checked by driving it.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertStrictEquals,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import { lookupRecordedFight, readRecordedFights } from "#/tests/recorded-fights.ts";
import { PreviewServeError, UserscriptBuildError } from "#/tools/margometer-tool-error.ts";
import {
    initPreviewServer,
    LISTENERS_MAXIMUM,
    openPreviewEvents,
    readPreviewFlags,
    RELOAD_SCRIPT,
    type ReloadListener,
    tellPreviewListeners,
} from "#/tools/preview-server.ts";
import { LANDING_RECORDING } from "#/tools/preview-site.ts";
import { formatRecordingName } from "#/tools/recorded-material.ts";

const BUNDLE = "window.previewBundle = 1;\n";
/** The least a recording holds for the server to draw it: one call, naming nobody. */
const OPENED_AT_A_PATH = JSON.stringify({ calls: [{ payload: { w: {} }, messages: [] }] });

Deno.test("the page route draws what it was asked for, and refuses what nobody filed", async () => {
    const preview = initTestServer();
    try {
        const asked = readRecordingNames()[1];
        assertExists(asked, "there is a second recording to ask for by name");
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

function initTestServer(fromPaths: readonly string[] = []) {
    const preview = initPreviewServer({
        port: 0,
        shouldWatch: false,
        readBundle: () => Promise.resolve(BUNDLE),
        fromPaths,
    });
    assert(preview.port > 0, "a server under test listened somewhere");
    return preview;
}

function readRecordingNames(): string[] {
    return readRecordedFights().map((fight) => formatRecordingName(fight.path));
}

Deno.test("an address that names nothing opens on the landing fight, finished", async () => {
    const preview = initTestServer();
    try {
        const page = await (await fetch(`${preview.url}/`)).text();
        const fight = lookupRecordedFight(LANDING_RECORDING);
        assertStringIncludes(
            page,
            formatRecordingName(fight.path),
            "the fight every preview opens",
        );
        assertStringIncludes(page, `"entryIndex":${fight.updates.length}`, "counted to its end");
        assertStringIncludes(page, `id="preview-fight"`, "with a picker for every other one");
    } finally {
        await preview.stop();
    }
});

Deno.test("an entry is clamped into the fight, and one that is no number is refused", async () => {
    const preview = initTestServer();
    try {
        const calls = lookupRecordedFight(LANDING_RECORDING).updates.length;
        for (
            const [asked, opened] of [["-1", 0], ["0", 0], ["1", 1], ["99999999", calls]] as const
        ) {
            const page = await (await fetch(`${preview.url}/?entry=${asked}`)).text();
            assertStringIncludes(page, `"entryIndex":${opened}`, `${asked} opens at ${opened}`);
        }
        const refused = await fetch(`${preview.url}/?entry=two`);
        assertEquals(refused.status, 400, "a count nobody can read is not guessed at");
        await refused.body?.cancel();
    } finally {
        await preview.stop();
    }
});

Deno.test("a rebuild reloads the page carrying what the harness had on screen", async () => {
    const preview = initTestServer();
    try {
        const page = await (await fetch(`${preview.url}/`)).text();
        assertStringIncludes(page, `new EventSource("/reload")`, "a served page listens");
        assertStringIncludes(page, "composePreviewStateHash()", "and comes back where it stood");
        assertStringIncludes(page, "build ok", "and says the build it drew was one");
    } finally {
        await preview.stop();
    }
});

Deno.test("a rebuild on a page already at its own address reloads it all the same", () => {
    // An address differing only in its fragment is a navigation inside the document: without the
    // reload a page that had reloaded once never came back from a second rebuild.
    assertStringIncludes(RELOAD_SCRIPT, "if (next === here) window.location.reload();");
    assertStringIncludes(RELOAD_SCRIPT, "else window.location.href = next;", "and otherwise goes");
    assertStringIncludes(RELOAD_SCRIPT, "renderBuildLog(event.data)", "a failure shows the log");
});

Deno.test("the calls route hands a fight over with no page in front of it", async () => {
    const preview = initTestServer();
    try {
        const name = readRecordingNames()[0] ?? "";
        const calls = await (await fetch(`${preview.url}/calls?fight=${encodeURIComponent(name)}`))
            .json();
        assert(Array.isArray(calls), "the calls arrive as a list");
        assert(calls.length > 0, "with something in it to feed");
        const unnamed = await fetch(`${preview.url}/calls`);
        assertEquals(unnamed.status, 404, "nothing asks for calls without saying whose");
        await unnamed.body?.cancel();
    } finally {
        await preview.stop();
    }
});

Deno.test("the bundle is served under its name, and the decoy is never a miss", async () => {
    const preview = initTestServer();
    try {
        const answer = await fetch(`${preview.url}/margometer.user.js`);
        assertEquals(await answer.text(), BUNDLE, "what was built is what is served");
        const decoy = await fetch(`${preview.url}/main.min1785244275300.js`);
        assertEquals(decoy.status, 200, "only its `src` is read, and a miss is a console line");
        await decoy.body?.cancel();
        const elsewhere = await fetch(`${preview.url}/elsewhere`);
        assertEquals(elsewhere.status, 404, "while a path nobody serves is a miss");
        await elsewhere.body?.cancel();
    } finally {
        await preview.stop();
    }
});

Deno.test("a tree that does not build answers the script with the log, not a blank", async () => {
    const preview = initPreviewServer({
        port: 0,
        shouldWatch: false,
        readBundle: () => Promise.reject(new UserscriptBuildError("the bundler refused: line 1")),
    });
    try {
        const answer = await fetch(`${preview.url}/margometer.user.js`);
        assertEquals(answer.status, 500, "the page's script is refused");
        assertStringIncludes(await answer.text(), "line 1", "and says why");
    } finally {
        await preview.stop();
    }
});

Deno.test("a page listening is told a rebuild, and one gone is dropped", async () => {
    const listeners = new Set<ReloadListener>();
    const opened = openPreviewEvents(listeners);
    assertStrictEquals(opened.headers.get("content-type"), "text/event-stream");
    assertStrictEquals(listeners.size, 1, "the page is held");
    const reader = opened.body!.getReader();
    const decoder = new TextDecoder();
    assertStrictEquals(decoder.decode((await reader.read()).value), "retry: 500\n\n");
    tellPreviewListeners(listeners, "failed", "one\ntwo");
    assertStrictEquals(
        decoder.decode((await reader.read()).value),
        "event: failed\ndata: one\ndata: two\n\n",
        "a log of many lines is one event of many data lines",
    );
    await reader.cancel();
    assertStrictEquals(listeners.size, 0, "a page that closed its stream is let go");
});

Deno.test("a stream that closed under a page is dropped the next time pages are told", () => {
    const listeners = new Set<ReloadListener>();
    openPreviewEvents(listeners);
    const [held] = [...listeners];
    held!.close();
    tellPreviewListeners(listeners, "rebuilt", "ok");
    assertStrictEquals(listeners.size, 0, "a write the stream refuses lets the page go");
});

Deno.test("past the bound a page is refused a stream rather than held", () => {
    const listeners = new Set<ReloadListener>();
    const opened: Response[] = [];
    for (let index = 0; index < LISTENERS_MAXIMUM; index += 1) {
        opened.push(openPreviewEvents(listeners));
    }
    assertStrictEquals(listeners.size, LISTENERS_MAXIMUM);
    assertStrictEquals(openPreviewEvents(listeners).status, 503, "one past the bound is refused");
    assert(opened.every((one) => one.status === 200), "and every one up to it was not");
    for (const one of opened) one.body!.cancel();
});

Deno.test("a fight opened at a path is drawn beside the recordings", async () => {
    const directory = Deno.makeTempDirSync();
    const path = `${directory}/opened-at-a-path.json`;
    Deno.writeTextFileSync(path, OPENED_AT_A_PATH);
    const preview = initTestServer([path]);
    try {
        const answer = await fetch(`${preview.url}/?fight=opened-at-a-path`);
        assertEquals(answer.status, 200, "a fight opened at a path is one the server draws");
        assertStringIncludes(await answer.text(), "opened-at-a-path", "and says which one");
        assert(!readRecordingNames().includes("opened-at-a-path"), "while captures/ is untouched");
    } finally {
        await preview.stop();
        Deno.removeSync(directory, { recursive: true });
    }
});

Deno.test("a path whose name a recording already carries is refused, not drawn over it", () => {
    const directory = Deno.makeTempDirSync();
    const taken = readRecordingNames()[0];
    assertExists(taken, "there is a recording whose name can be collided with");
    const path = `${directory}/${taken}.json`;
    Deno.writeTextFileSync(path, OPENED_AT_A_PATH);
    try {
        assertThrows(() => initTestServer([path]), PreviewServeError, taken);
    } finally {
        Deno.removeSync(directory, { recursive: true });
    }
});

Deno.test("the flags are read by walking them, and one nobody reads is refused", () => {
    assertEquals(readPreviewFlags([]), { port: 4173, fight: null, fromPaths: [] }, "none given");
    assertEquals(
        readPreviewFlags(["--port", "0", "--fight", "a", "--from", "x", "--from", "y"]),
        { port: 0, fight: "a", fromPaths: ["x", "y"] },
        "each, and `--from` as often as it is given",
    );
    assertThrows(() => readPreviewFlags(["--site"]), PreviewServeError, "--site");
    assertThrows(() => readPreviewFlags(["--nothing", "x"]), PreviewServeError, "--nothing");
});
