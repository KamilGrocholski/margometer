import { describe, expect, test } from "bun:test";
import {
  GameSourceError,
  getBuildFromPage,
  getChannelFromArgument,
} from "@/tools/game-client-source.ts";

/**
 * The tool that decides whether the cached client is stale.
 *
 * It had no test at all until `docs/audits/2026-08-13-the-whole-tree-read-once.md`
 * (F2, F4), while its structural twin `tools/help-article.ts` — same fetch, same
 * cache, same provenance manifest — has one.
 *
 * Nothing here reaches the network. What is testable is the part §7.6 actually
 * rests on: reading a build id off a page, and refusing a channel that is not
 * one. The fetching and the writing are the halves that need a live host, and
 * they are named in this file as what it does not cover.
 */

describe("the build id on a world page", () => {
  test("is read from the inline build object", () => {
    expect(getBuildFromPage("var build = { version: 1785244275300 };")).toBe("1785244275300");
  });

  test("is read from a script filename when there is no inline object", () => {
    expect(getBuildFromPage('<script src="/js/main.min1785244275300.js"></script>')).toBe(
      "1785244275300",
    );
  });

  /**
   * The inline object wins where a page carries both, and the two disagreeing is
   * not hypothetical — a page can be served while a cached script tag lags.
   * Reading the filename first would date a claim to a build the page is no
   * longer running.
   */
  test("prefers the inline object to the filename", () => {
    const page = 'version: 1785244275300 <script src="/js/main.min1781609507010.js">';
    expect(getBuildFromPage(page)).toBe("1785244275300");
  });

  test("reads a build stated with the spacing the client actually uses", () => {
    expect(getBuildFromPage("version:1785244275300")).toBe("1785244275300");
  });

  /**
   * A refusal rather than a null, because §9.5 puts a tool that was handed bad
   * material on the loud side: a build id nobody could read must not become a
   * comparison that quietly reports the cache current.
   */
  test.each([
    ["a page with no build on it", "<html><body>nothing here</body></html>"],
    ["a number too short to be one", "version: 178524"],
    ["an empty page", ""],
  ])("refuses %s", (_what, page) => {
    expect(() => getBuildFromPage(page)).toThrow(GameSourceError);
  });

  test("says whose the error is, in the name the console shows first", () => {
    try {
      getBuildFromPage("");
      expect.unreachable();
    } catch (error) {
      expect((error as Error).name).toBe("MargoMeterTool/GameSource");
    }
  });
});

describe("the channel named on the command line", () => {
  test.each(["production", "development"])("admits %s", (channel) => {
    expect(getChannelFromArgument(channel)).toBe(channel);
  });

  /**
   * ⚠️ The check used to be `target in CHANNEL_HOSTS`, and `in` walks the
   * prototype chain — so `toString`, `constructor` and `valueOf` passed it and
   * reached a lookup that handed back a function where a host belonged. §7.6
   * keeps the two channels apart on purpose, and a check admitting a third thing
   * is not keeping them apart.
   */
  test.each(["toString", "constructor", "valueOf", "hasOwnProperty", "__proto__"])(
    "refuses %s, which the prototype chain would have admitted",
    (inherited) => {
      expect(() => getChannelFromArgument(inherited)).toThrow(GameSourceError);
    },
  );

  test.each([["a misspelling", "productio"], ["nothing", ""], ["a world name", "tempest"]])(
    "refuses %s",
    (_what, value) => {
      expect(() => getChannelFromArgument(value)).toThrow(GameSourceError);
    },
  );
});
