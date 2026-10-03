/**
 * The client's own JavaScript, asked for and dated.
 *
 * The readers run over invented markup: the game's page is somebody else's work and none of it
 * is stored here. The last test is the one that matters most — it asks **git** whether the cache
 * is ignored, because the promise that no bundle enters this repository is two spellings in two
 * files with nothing between them.
 */

import { assert, assertEquals, assertRejects, assertStrictEquals, assertThrows } from "@std/assert";
import {
    CACHE_ROOT,
    readCachedMargonemClientSource,
    readMargonemAnswerText,
    requireCachedMargonemClientSource,
    requireMargonemChannel,
    requireMargonemWorldPageBuild,
    requireMargonemWorldPageBundleAddress,
} from "#/tools/margonem-client-source.ts";
import {
    MargonemClientSourceError,
    MargonemUnreachableError,
} from "#/tools/margometer-tool-error.ts";

const OLDER_PAGE =
    `<script src="https://tempest.margonem.pl/js/main.min1786514810315.js"></script>`;
const NEWER_PAGE = `<script src="/js/main.min.53XkBRxF.js"></script>`;

Deno.test("both names the client has served give up their build and their file", () => {
    assertEquals(requireMargonemWorldPageBuild(OLDER_PAGE), "1786514810315", "the older name's id");
    assertEquals(requireMargonemWorldPageBuild(NEWER_PAGE), "53XkBRxF", "and the newer one's");
    assertEquals(
        requireMargonemWorldPageBundleAddress(NEWER_PAGE, "https://tempest.margonem.pl"),
        "https://tempest.margonem.pl/js/main.min.53XkBRxF.js",
        "the file is asked for under the name the page states, dot and all",
    );
});

Deno.test("a page that names no client is a page this refuses", () => {
    assertThrows(
        () => requireMargonemWorldPageBuild("<html><body>nothing here</body></html>"),
        MargonemClientSourceError,
    );
    assertThrows(
        () =>
            requireMargonemWorldPageBundleAddress(
                "<script src=/js/main.min.js></script>",
                "https://x.example",
            ),
        MargonemClientSourceError,
    );
});

Deno.test("a channel is one of the two, and nothing off a prototype", () => {
    assertEquals(requireMargonemChannel("production"), "production", "the one that decides");
    assertEquals(requireMargonemChannel("development"), "development", "the one for reading");
    // A lookup walking the prototype chain accepted `toString` once and sent a fetch at a function.
    assertThrows(() => requireMargonemChannel("toString"), MargonemClientSourceError);
    assertThrows(() => requireMargonemChannel("constructor"), MargonemClientSourceError);
});

Deno.test("a manifest missing a field is provenance nobody can date", () => {
    const whole = {
        channel: "production",
        build: "53XkBRxF",
        host: "https://tempest.margonem.pl",
        fetchedAt: "2026-08-25T21:29:23.840Z",
        bundlePath: ".cache/game-client/production/main.js",
    };
    assertEquals(
        requireCachedMargonemClientSource(whole, "production").build,
        "53XkBRxF",
        "a whole one",
    );

    const { fetchedAt: _dropped, ...truncated } = whole;
    assertThrows(
        () => requireCachedMargonemClientSource(truncated, "production"),
        MargonemClientSourceError,
    );
    assertThrows(
        () => requireCachedMargonemClientSource({ ...whole, channel: "development" }, "production"),
        MargonemClientSourceError,
    );
    assertThrows(
        () => requireCachedMargonemClientSource("not an object", "production"),
        MargonemClientSourceError,
    );
});

Deno.test("a manifest that stands and cannot be read is refused, and none is no reading", () => {
    const held = Deno.cwd();
    const directory = Deno.makeTempDirSync({ prefix: "margometer-cache-" });
    try {
        Deno.chdir(directory);
        assertStrictEquals(
            readCachedMargonemClientSource("production"),
            null,
            "nothing cached is an answer",
        );
        // A directory where the manifest stands: there, and no text to read off it.
        Deno.mkdirSync(`${CACHE_ROOT}production/provenance.json`, { recursive: true });
        assertThrows(
            () => readCachedMargonemClientSource("production"),
            MargonemClientSourceError,
            "cannot be read",
        );
    } finally {
        Deno.chdir(held);
        Deno.removeSync(directory, { recursive: true });
    }
});

Deno.test("an answer broken off after its status is a world that did not answer", async () => {
    const fetchHeld = globalThis.fetch;
    const broken = new ReadableStream({
        pull(controller) {
            controller.error(new TypeError("connection reset"));
        },
    });
    globalThis.fetch = () => Promise.resolve(new Response(broken));
    try {
        const refusal = await assertRejects(
            () => readMargonemAnswerText("https://x.example"),
            MargonemUnreachableError,
        );
        assert(
            refusal.cause instanceof TypeError,
            "the runtime's own failure travels as its cause",
        );
    } finally {
        globalThis.fetch = fetchHeld;
    }
});

Deno.test("an answer read to its end is the text, and a refusal is no answer", async () => {
    const fetchHeld = globalThis.fetch;
    try {
        globalThis.fetch = () => Promise.resolve(new Response("<html></html>"));
        assertEquals(await readMargonemAnswerText("https://x.example"), "<html></html>", "whole");
        globalThis.fetch = () => Promise.resolve(new Response("", { status: 503 }));
        await assertRejects(
            () => readMargonemAnswerText("https://x.example"),
            MargonemUnreachableError,
        );
    } finally {
        globalThis.fetch = fetchHeld;
    }
});

Deno.test("git is asked whether the cache is ignored, rather than a comment claiming it", () => {
    const asked = new Deno.Command("git", { args: ["check-ignore", CACHE_ROOT] }).outputSync();
    assert(CACHE_ROOT.startsWith(".cache/"), "the cache sits where the ignore rule names");
    assertEquals(asked.success, true, `git does not ignore ${CACHE_ROOT}`);
});
