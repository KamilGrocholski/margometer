import { describe, expect, test } from "bun:test";

import { assertDefined } from "@/libs/assert.ts";
import { getGameBuildFromScriptName } from "@/src/core/game-build.ts";
import { isFightStart } from "@/src/game/battle-session.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import {
  composePreviewPage,
  PREVIEW_GAME_SCRIPT_NAME,
  type PreviewPageOptions,
  type PreviewWords,
} from "@/tools/preview-page.ts";

/**
 * The page, held to the things it can get wrong quietly.
 *
 * None of this needs a socket, because `composePreviewPage` is pure and the page
 * is where every past failure of this harness lived — the recipe it replaces
 * (`.claude/skills/verify/SKILL.md`) records two of them, and both were a page
 * that loaded and drew nothing rather than a page that errored. Now that it has
 * two consumers, the same is true of every hole in it: a published page carries
 * different words, different addresses and no reload stream, and each of those is
 * invisible until somebody opens the deployed URL.
 */

const FIGHT = assertDefined(CAPTURED_FIGHTS[0], "the catalog carries a capture to preview");

const WORDS: PreviewWords = {
  language: "en",
  title: "MargoMeter preview",
  start: "to start",
  backHint: "Replays the fight up to the previous entry",
  end: "to end",
  play: "play",
  pause: "pause",
  entry: "entry",
};

function composePageOfFight(overrides: Partial<PreviewPageOptions> = {}): string {
  return composePreviewPage({
    fightName: FIGHT.name,
    entryIndex: 0,
    payloads: FIGHT.dump.calls.map((call) => call.payload),
    fights: CAPTURED_FIGHTS.map((fight) => ({
      name: fight.name,
      address: `/?fight=${fight.name}&entry=0`,
    })),
    scriptDirectory: "/",
    words: WORDS,
    introduction: null,
    reloadScript: null,
    ...overrides,
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
    const bundleAt = page.indexOf("margometer.user.js");
    const driverAt = page.indexOf("var PREVIEW =");
    expect(engineAt).toBeGreaterThan(-1);
    expect(engineAt).toBeLessThan(bundleAt);
    expect(bundleAt).toBeLessThan(driverAt);
  });

  test("the decoy script names a build the add-on can read", () => {
    const named = /main\.min\d+\.js/.exec(composePageOfFight());
    expect(named).not.toBeNull();
    expect(getGameBuildFromScriptName(named?.[0] ?? "")).not.toBeNull();
    expect(PREVIEW_GAME_SCRIPT_NAME).toBe(named?.[0] ?? "");
  });

  test("the page replays the fight it was asked for, from where it was asked", () => {
    expect(composePageOfFight({ entryIndex: 7 })).toContain(`"entryIndex":7`);
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
    const page = composePageOfFight({ payloads: [{ m: ["</script><b>escaped</b>"] }] });
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
 * The four holes the second consumer opened, each of them a failure that shows
 * up on a deployed page and on nothing else.
 */
describe("what the caller decides and the page does not", () => {
  test("the picker goes where the caller said, not where the page decided", () => {
    const page = composePageOfFight({
      fights: [
        { name: "first", address: "./first.html" },
        { name: "second", address: "./second.html" },
      ],
    });
    expect(page).toContain(`"address":"./first.html"`);
    expect(page).toContain(`"address":"./second.html"`);
    expect(page).not.toContain(`"/?fight=`);
  });

  /**
   * ⚠️ **The one that would be permanent and silent.** A published page has no
   * `/reload` behind it, and the stream reconnects on its own — twice a second,
   * for as long as the tab is open — so the fragment has to be absent rather than
   * merely useless. Held from both sides: a page given one opens a stream.
   */
  test("a page with no reload script opens no stream, and one with it does", () => {
    expect(composePageOfFight()).not.toContain("EventSource");
    expect(composePageOfFight({ reloadScript: `new EventSource("/reload");` })).toContain(
      `new EventSource("/reload")`,
    );
  });

  test("the words the caller gave are the words the page draws", () => {
    const page = composePageOfFight({
      words: {
        language: "xx",
        title: "TITLE-MARK",
        start: "START-MARK",
        backHint: "BACK-MARK",
        end: "END-MARK",
        play: "PLAY-MARK",
        pause: "PAUSE-MARK",
        entry: "ENTRY-MARK",
      },
    });
    expect(page).toContain(`lang="xx"`);
    for (const mark of ["TITLE-MARK", "START-MARK", "BACK-MARK", "END-MARK", "PLAY-MARK"]) {
      expect(page).toContain(mark);
    }
    // The two the driver reads rather than the markup, so they have to survive
    // the settings and not only the buttons.
    expect(page).toContain(`"pause":"PAUSE-MARK"`);
    expect(page).toContain(`"entry":"ENTRY-MARK"`);
  });

  /**
   * GitHub Pages serves a project under a path of its own, so an absolute `src`
   * asks the domain root for a file belonging to no project — and the panel
   * simply never appears, while the same page is perfect on `file://` and on
   * localhost. Both tags, because parameterising one of the two is the shape of
   * the bug rather than its fix.
   */
  test("both script tags sit in the directory the caller named", () => {
    const page = composePageOfFight({ scriptDirectory: "./" });
    expect(page).toContain(`src="./${PREVIEW_GAME_SCRIPT_NAME}"`);
    expect(page).toContain(`src="./margometer.user.js"`);
    expect(page).not.toContain(`src="/`);
  });

  test("an introduction is drawn where there is one and nothing where there is not", () => {
    expect(composePageOfFight({ introduction: "INTRO-MARK" })).toContain("INTRO-MARK");
    expect(composePageOfFight()).not.toContain("preview-intro\"");
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
