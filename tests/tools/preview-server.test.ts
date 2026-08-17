import { describe, expect, test } from "bun:test";

import { BundleError, composeUserscriptFiles } from "@/build.ts";
import { assertDefined } from "@/libs/assert.ts";
import { getGameBuildFromScriptName } from "@/src/core/game-build.ts";
import { isFightStart } from "@/src/game/battle-session.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import {
  composePreviewPage,
  setPreviewServer,
  PreviewServerError,
} from "@/tools/preview-server.ts";

/**
 * The preview server, held to the two things it can get wrong quietly.
 *
 * Most of this needs no socket, because `composePreviewPage` is pure and the page
 * is where every past failure of this harness lived — the recipe it replaces
 * (`.claude/skills/verify/SKILL.md`) records two of them, and both were a page
 * that loaded and drew nothing rather than a page that errored.
 *
 * ⚠️ **A server started here must be stopped in a `finally`.** An open reload
 * stream keeps `stop()` from resolving and an unclosed `fs.watch` handle keeps
 * the process alive, so a leak does not fail this file — it hangs the suite.
 */

const FIGHT = assertDefined(CAPTURED_FIGHTS[0], "the catalog carries a capture to preview");

function composePageOfFight(entryIndex = 0): string {
  return composePreviewPage({
    fightName: FIGHT.name,
    entryIndex,
    payloads: FIGHT.dump.calls.map((call) => call.payload),
    fightNames: CAPTURED_FIGHTS.map((fight) => fight.name),
  });
}

describe("there is something to look at", () => {
  test("the catalog carries captures to preview", () => {
    expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
  });
});

describe("the page the harness draws", () => {
  /**
   * The one fault the skill calls out by name: `src/game/engine-roster.ts` reads
   * `w` and `src/game/fight-capture.ts` reads `warriorsList`, so a stub folding
   * into only the first leaves every combatant snapshot in a saved recording
   * empty — and says nothing about it.
   */
  test("the engine stub folds the roster into both names the add-on reads", () => {
    const page = composePageOfFight();
    expect(page).toContain("warriorsList");
    expect(page).toContain("Engine.battle.w[id]");
    expect(page).toContain("Engine.battle.warriorsList[id]");
  });

  // Order, not presence: the wrap goes on while the bundle's tag runs, so a
  // driver above it would feed a game nobody was reading.
  test("the game is defined before the bundle, and the bundle before the driver", () => {
    const page = composePageOfFight();
    const engineAt = page.indexOf("window.Engine =");
    const bundleAt = page.indexOf("/margometer.user.js");
    const driverAt = page.indexOf("var PREVIEW =");
    expect(engineAt).toBeGreaterThan(-1);
    expect(engineAt).toBeLessThan(bundleAt);
    expect(bundleAt).toBeLessThan(driverAt);
  });

  test("the decoy script names a build the add-on can read", () => {
    const named = /main\.min\d+\.js/.exec(composePageOfFight());
    expect(named).not.toBeNull();
    expect(getGameBuildFromScriptName(named?.[0] ?? "")).not.toBeNull();
  });

  test("the page replays the fight it was asked for, from where it was asked", () => {
    expect(composePageOfFight(7)).toContain(`"entryIndex":7`);
    expect(composePageOfFight()).toContain(FIGHT.name);
  });

  test("every payload of the fight travels in the page", () => {
    expect(composePageOfFight()).toContain(`"entryCount":${FIGHT.dump.calls.length}`);
  });

  /**
   * ⚠️ **An HTML parser ends a script block at the text `</script>`** and knows
   * nothing about the JavaScript string around it, so one in a recorded message
   * would spill the rest of the fight onto the page as markup. Driven with a
   * payload carrying the sequence rather than by reading the escape back, because
   * what matters is that the closing tag cannot appear, however it is spelled.
   */
  test("a payload that spells a closing tag cannot end the script", () => {
    const page = composePreviewPage({
      fightName: FIGHT.name,
      entryIndex: 0,
      payloads: [{ m: ["</script><b>escaped</b>"] }],
      fightNames: [FIGHT.name],
    });
    expect(page).not.toContain("</script><b>");
    expect(page).toContain("<\\/script>");
  });

  /**
   * §9.6's question, kept answerable on a preview page: two tests read a document
   * and ask whether everything named `MargoMeter-` says whose it is. The harness
   * is not the add-on's, so nothing it draws may borrow that name — otherwise the
   * page teaches the opposite of what those tests check.
   */
  test("nothing the harness draws is named as the add-on's", () => {
    const markup = composePageOfFight().split("<script")[0] ?? "";
    expect(markup).toContain("preview-strip");
    expect(markup).not.toContain("MargoMeter-");
  });

  test("the picker offers every capture rather than a list somebody typed", () => {
    const page = composePageOfFight();
    for (const fight of CAPTURED_FIGHTS) expect(page).toContain(fight.name);
  });
});

/**
 * The rewind rests on this and nothing else.
 *
 * Going back a step re-feeds the fight from its first payload, which is only a
 * rewind because that payload resets the session — `composeNextSession` starts
 * over on `init`. A recording arriving without it, or carrying a second one part
 * way through, would make the button land somewhere nobody asked for and no
 * figure on screen would look wrong. So it is re-measured on every recording
 * here rather than written down once as a count (§3).
 */
describe("the fight start every capture opens with", () => {
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s starts its fight on its first payload and nowhere else",
    (_name, fight) => {
      const starts = fight.dump.calls
        .map((call, index) => (isFightStart(call.payload) ? index : -1))
        .filter((index) => index >= 0);
      expect(starts).toEqual([0]);
    },
  );
});

describe("the routes, served", () => {
  test("the page, the bundle and two ways of asking for nothing", async () => {
    const preview = setPreviewServer({ port: 0, shouldWatch: false });
    try {
      const page = await fetch(`${preview.url}/?fight=${FIGHT.name}`);
      expect(page.status).toBe(200);
      expect(page.headers.get("content-type")).toContain("text/html");
      expect(await page.text()).toContain("preview-strip");

      // The bundle rather than a path to one: what the preview draws has to be
      // the file a person installs, or it is a preview of something else.
      const bundle = await fetch(`${preview.url}/margometer.user.js`);
      expect(bundle.status).toBe(200);
      const script = await bundle.text();
      expect(script.startsWith("// ==UserScript==")).toBe(true);
      expect(script).toContain("MargoMeter");

      const missingFight = await fetch(`${preview.url}/?fight=no-such-fight`);
      expect(missingFight.status).toBe(404);

      // The decoy build script is expected to 404: only its `src` is ever read.
      const decoy = await fetch(`${preview.url}/main.min1785244275300.js`);
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
