import { spawnSync } from "node:child_process";
import { describe, expect, test } from "bun:test";
import {
  CACHE_ROOT,
  GameSourceError,
  getBuildFromPage,
  getCachedBundle,
  getCachedClientSource,
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

/**
 * What the cache answers when there is nothing in it, which is the state every
 * machine that has not fetched is in — including the one running CI.
 *
 * ⚠️ **Neither reader was named anywhere under `tests/` for the life of this
 * file**, so the difference between them had never been asked
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F11). They
 * answer an empty cache in two deliberately different ways, and that split is the
 * only thing here a test can hold without a network: `.cache/` is outside git
 * (§7.6), so what it holds is a property of the machine and not of the tree.
 */
describe("reading a cache that may not be there", () => {
  const NEVER_FETCHED = "development";

  test("the two readers disagree about an empty cache on purpose", () => {
    const cached = getCachedClientSource(NEVER_FETCHED);

    if (cached === null) {
      // Nothing fetched: the manifest reader reports it and the bundle reader
      // refuses, because a caller asking for source has nothing to be handed and
      // a caller asking whether anything is cached has its answer.
      expect(() => getCachedBundle(NEVER_FETCHED)).toThrow(GameSourceError);
      return;
    }

    // Fetched on this machine: then the manifest says which build, and the
    // bundle reader hands back something to read rather than throwing.
    expect(cached.build.length).toBeGreaterThan(0);
    expect(getCachedBundle(NEVER_FETCHED).length).toBeGreaterThan(0);
  });

  // A channel that is not one is refused before any path is composed, so a
  // typo cannot read a directory nobody meant.
  test("refuses to read a cache for something that is not a channel", () => {
    expect(() => getChannelFromArgument("productio")).toThrow(GameSourceError);
  });
});

/**
 * The cache this tool writes into, and git's own opinion of it.
 *
 * §7.6 keeps fetched sources out of the repository by copyright requirement, and
 * until this the whole promise was one path here agreeing with one line in
 * `.gitignore`. Nothing compared them, so a root moved out from under the ignore
 * rule would leave somebody else's material sitting in `git status`
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 *
 * Asked of `git check-ignore` rather than by reading `.gitignore`: git is what
 * decides, and a pattern read by hand is a second implementation of matching
 * rules this repository has no reason to own. `-q` so the status carries the
 * answer and nothing is parsed (§7.5).
 */
function isIgnoredByGit(path: string): boolean {
  const done = spawnSync("git", ["check-ignore", "-q", path], {
    cwd: new URL("../../", import.meta.url).pathname,
  });
  return done.status === 0;
}

describe("what the tool writes outside git", () => {
  test("caches under a path git is told to ignore", () => {
    expect(CACHE_ROOT).toContain("/.cache/");
    expect(isIgnoredByGit(CACHE_ROOT), CACHE_ROOT).toBe(true);
  });
});
