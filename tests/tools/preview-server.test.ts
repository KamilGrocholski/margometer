/**
 * The half of the preview only a running process can answer.
 *
 * What the page itself promises moved to `tests/tools/preview-page.test.ts` with
 * the module it tests; what is left here needs a socket, and that is the whole
 * boundary.
 *
 * ⚠️ **A server started here must be stopped in a `finally`.** An open reload
 * stream keeps `stop()` from resolving and an unclosed `fs.watch` handle keeps
 * the process alive, so a leak does not fail this file — it hangs the suite.
 */

import { describe, expect, test } from "bun:test";

import { BundleError, composeUserscriptFiles } from "@/build.ts";
import { assertDefined } from "@/libs/assert.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { PREVIEW_GAME_SCRIPT_NAME } from "@/tools/preview-page.ts";
import { setPreviewServer, PreviewServerError } from "@/tools/preview-server.ts";

const FIGHT = assertDefined(CAPTURED_FIGHTS[0], "the catalog carries a capture to preview");

describe("the routes, served", () => {
  test("the page, the bundle and two ways of asking for nothing", async () => {
    const preview = setPreviewServer({ port: 0, shouldWatch: false });
    try {
      const page = await fetch(`${preview.url}/?fight=${FIGHT.name}`);
      expect(page.status).toBe(200);
      expect(page.headers.get("content-type")).toContain("text/html");
      const markup = await page.text();
      expect(markup).toContain("preview-strip");
      // The served page is the one with a rebuild behind it, and it is the only
      // one of the two that may open the stream.
      expect(markup).toContain("EventSource");

      // The bundle rather than a path to one: what the preview draws has to be
      // the file a person installs, or it is a preview of something else.
      const bundle = await fetch(`${preview.url}/margometer.user.js`);
      expect(bundle.status).toBe(200);
      const script = await bundle.text();
      expect(script.startsWith("// ==UserScript==")).toBe(true);
      expect(script).toContain("MargoMeter");

      const missingFight = await fetch(`${preview.url}/?fight=no-such-fight`);
      expect(missingFight.status).toBe(404);

      // The decoy build script is expected to 404 here: only its `src` is ever
      // read, and there is a process to answer the miss with something that is
      // not markup. A published copy cannot say that — `tools/preview-site.ts`.
      const decoy = await fetch(`${preview.url}/${PREVIEW_GAME_SCRIPT_NAME}`);
      expect(decoy.status).toBe(404);
    } finally {
      preview.stop();
    }
  });

  test("an entry past the end of the fight is clamped rather than believed", async () => {
    const preview = setPreviewServer({ port: 0, shouldWatch: false });
    try {
      const response = await fetch(`${preview.url}/?fight=${FIGHT.name}&entry=99999`);
      expect(await response.text()).toContain(`"entryIndex":${FIGHT.dump.calls.length}`);
    } finally {
      preview.stop();
    }
  });
});

/**
 * What the failed-rebuild path depends on, and it is not obvious.
 *
 * ⚠️ **`Bun.build` rejects with an `AggregateError` unless `throw: false` is
 * passed**, so `build.ts`'s own `success` check was dead for the failure it was
 * written for, and the server's narrow `catch` would have missed every syntax
 * error made while editing `src/`. Held here because nothing else would notice:
 * a build that works reports nothing about how it fails.
 */
describe("a bundle that refuses", () => {
  test("composing the userscript answers rather than throwing on a good tree", async () => {
    const files = await composeUserscriptFiles();
    expect(files.script.startsWith("// ==UserScript==")).toBe(true);
    // The banner, byte for byte, and not a second composition of it.
    expect(files.script.startsWith(files.metadata)).toBe(true);
  });

  test("a bundle failure is ours, so a caller can tell it from a bug", () => {
    const failure = new BundleError("bundle failed");
    expect(failure.name).toBe("MargoMeterTool/Bundle");
  });

  test("the preview names its own failures too", () => {
    expect(new PreviewServerError("nothing to preview").name).toBe(
      "MargoMeterTool/PreviewServer",
    );
  });
});
