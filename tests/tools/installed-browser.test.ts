/**
 * Where a run looks for a browser, and what it does when it finds none.
 *
 * The order is the claim being held: `docs/browser-support.md` says a measurement is taken in
 * Chrome, so Chrome has to be in the list whatever else a caller argued for. The reader is proved
 * on both samples — one it must find and one it must not — because a reader that answers with the
 * first candidate whatever the machine holds would pass the negative case alone.
 */

import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { InstalledBrowserError } from "@/tools/margometer-tool-error.ts";
import { getBrowserAsked, readInstalledBrowser } from "@/tools/installed-browser.ts";

const ABSENT = "margometer-no-such-browser";

Deno.test("what was argued is looked for first, and Chrome is looked for either way", () => {
    const asked = getBrowserAsked("firefox", "chromium");
    assertEquals(asked[0], "firefox", "what was asked for is looked for first");
    assertEquals(asked[1], "chromium", "then what the environment names");
    assertEquals(asked.includes("google-chrome"), true, "and Chrome is in the list either way");

    const bare = getBrowserAsked(null, null);
    assertEquals(bare[0], "google-chrome", "a run arguing nothing looks for Chrome first");
});

Deno.test("the first candidate that answers is the one taken", async () => {
    // Deno stands in for a browser here: what is being held is that the reader asks the machine
    // rather than trusting the list, and any binary that answers `--version` proves that.
    const found = await readInstalledBrowser([ABSENT, Deno.execPath()]);
    assertEquals(found, Deno.execPath(), "the absent name is stepped over, not returned");
});

Deno.test("a machine with none is refused under a name a reader can place", async () => {
    const failure = await assertRejects(
        () => readInstalledBrowser([ABSENT]),
        InstalledBrowserError,
        undefined,
        "a name nothing on this machine answers to",
    );
    assertEquals(failure.name, "MargoMeterTool/InstalledBrowser", "the brand is in the name");
    assertStringIncludes(failure.message, ABSENT, "and the refusal says what was tried");
});
