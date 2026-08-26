/**
 * The pictures in `screenshots/`, and the two things about them a machine can
 * hold.
 *
 * ⚠️ **No browser runs here.** The gate has to pass on a machine that has none
 * and in CI, which is promised none — so what a screenshot *contains* is checked
 * by a person opening it, once, in the round that takes it. That is stated rather
 * than left implied: this file proves the set is current and reachable, never that
 * a panel is in the frame.
 *
 * What is left for the gate is the half that rots on its own. A set taken two
 * releases ago looks exactly like one taken this morning, and a selector renamed
 * in `src/ui/panel-element.ts` turns every future run into a set of pictures of a
 * marker — both silent, and both caught below.
 */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { composeSourceWithoutComments } from "@/libs/source-regions.ts";
import manifest from "@/package.json";
import { getValueFromJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import { getAssignedClassNames } from "@/tests/class-names.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { isAncestorOfHead, isShallowRepository } from "@/tests/git-history.ts";
import {
  composeShotAddress,
  composeShotFileName,
  composeTakenAt,
  getBrowserCommand,
  getFightByName,
  getScreenshotFileNames,
  PANEL_SHOTS,
  PanelScreenshotError,
  SCREENSHOTS_DIRECTORY,
  SHOT_CLASSES,
  TAKEN_AT_NAME,
  TAKEN_TAB_INDEX,
  writePanelScreenshots,
  type PanelShot,
} from "@/tools/panel-screenshots.ts";

const TAKEN_AT_PATH = SCREENSHOTS_DIRECTORY + TAKEN_AT_NAME;

/**
 * The sidecar, read the way anything from outside is read.
 *
 * No cast off the parse (§9.5): what is on disk was written by this tool a
 * release ago and nothing guarantees it still has the shape the type claims — a
 * hand-edited file is exactly the case worth failing on, and a cast would let it
 * through to a comparison that quietly reads `undefined`.
 */
function getTakenAtRecord(): Record<string, unknown> {
  const reading = getValueFromJsonText(readFileSync(TAKEN_AT_PATH, "utf8"));
  if (reading.syntaxError !== null) throw reading.syntaxError;
  const record = getRecordFromValue(reading.value);
  if (record === null) throw reading.syntaxError ?? new SyntaxError(`${TAKEN_AT_PATH} is not an object`);
  return record;
}

describe("the set in screenshots/", () => {
  // A loop over nothing is green and proves nothing — the rule the captures'
  // catalogue is held to, and it holds for any set discovered rather than listed.
  test("there are shots to take", () => {
    expect(PANEL_SHOTS.length).toBeGreaterThan(0);
  });

  test("every shot has a file and every file belongs to a shot", () => {
    const wanted = [...PANEL_SHOTS.map(composeShotFileName), TAKEN_AT_NAME].sort();
    expect(getScreenshotFileNames()).toEqual(wanted);
  });

  /**
   * The whole of "screenshots are for one release".
   *
   * A version bump is what makes this red, and retaking the set is what makes it
   * green again — so the obligation lands in the release that incurred it rather
   * than on a checklist somebody reads afterwards. It is the shape
   * `tests/tools/changelog.test.ts` already uses for `CHANGELOG.md`.
   */
  test("the set says which release it is of, and it is this one", () => {
    expect(getTakenAtRecord()["version"]).toBe(manifest.version);
  });

  /**
   * The other half of "for one release", and the half a version string cannot
   * carry: **which panel is in the frame.**
   *
   * A version says which release a set belongs to. Between two releases the
   * version does not move and the panel does — a set taken eleven commits past
   * `v0.7.0` showed a row the panel had stopped drawing, with every guard green
   * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F1). So the
   * sidecar names a commit, the tool refuses to write one while `src/` or `libs/`
   * is uncommitted, and this asks the repository whether that commit is really in
   * this history.
   *
   * ⚠️ **Deliberately an ancestry check and not a currency one.** The strict
   * version — the sidecar's commit against the newest commit touching `src/ui/`
   * or `src/core/` — is the one that would have gone red the day F1 was created,
   * and it turns every round that touches the panel into a round that must drive
   * a browser. That is a decision about how this repository is worked in rather
   * than a defect a guard can settle on its own, so §9.8 carries it as an
   * obligation on the person and this carries the part a machine can hold: the
   * set names a tree, and the tree is one somebody else can check out.
   *
   * `actions/checkout@v4` clones at depth 1, so the object is asked for only
   * where history exists — `tests/tools/audit-status.test.ts`'s arrangement, for
   * its reason.
   */
  test("the set says which panel is in the frame, and it is one this history has", () => {
    const stated = getTakenAtRecord()["commit"];
    expect(typeof stated).toBe("string");
    expect(stated).toMatch(/^[0-9a-f]{7,40}$/);
    if (isShallowRepository()) return;
    expect(isAncestorOfHead(String(stated))).toBe(true);
  });

  test("the set names the capture it was taken on", () => {
    const names: unknown[] = CAPTURED_FIGHTS.map((capture) => capture.name);
    expect(names).toContain(getTakenAtRecord()["fight"]);
  });

  test("the sidecar lists exactly the images beside it", () => {
    expect(getTakenAtRecord()["images"]).toEqual(PANEL_SHOTS.map(composeShotFileName));
  });
});

/**
 * Every class the driver reaches through is one the panel actually assigns.
 *
 * Read out of the source rather than out of a render, for
 * `tests/ui/panel-class-names.test.ts`'s reason: half of these sit on a branch —
 * a row that can be drilled, the lower of two strips — and a render only
 * exercises what it is driven through.
 */
describe("the classes the driver clicks", () => {
  const ASSIGNED = getAssignedClassNames(
    composeSourceWithoutComments(
      readFileSync(new URL("../../src/ui/panel-element.ts", import.meta.url).pathname, "utf8"),
    ),
  );

  test("the panel assigns some", () => {
    expect(ASSIGNED.size).toBeGreaterThan(0);
  });

  test.each(Object.values(SHOT_CLASSES))("%s is a class the panel puts on a node", (name) => {
    expect(ASSIGNED.has(name)).toBe(true);
  });
});

describe("the tab the driver presses", () => {
  /**
   * ⚠️ **A missing tab is `-1`, and `-1` addresses the last element of nothing.**
   * The driver reads its index out of `composeDirectionTabs`, so a fifth screen
   * that reorders the strip is caught here rather than by a picture of the wrong
   * one.
   */
  test("the direction strip has a tab for damage taken", () => {
    expect(TAKEN_TAB_INDEX).toBeGreaterThanOrEqual(0);
  });
});

/**
 * ⚠️ **A browser is looked for, never assumed at `/usr/bin/firefox`.** That is
 * the objection `docs/specs/2026-08-17-a-panel-you-can-watch-change.md` raised
 * against folding a screenshot mode into the preview server, and the tool answers
 * it here rather than in prose.
 */
describe("the browser it will use", () => {
  test("is what the caller named, resolved", () => {
    expect(getBrowserCommand("sh")).toBe(Bun.which("sh")!);
  });

  test("refuses a name nothing on this machine answers to", () => {
    expect(() => getBrowserCommand("margometer-no-such-browser")).toThrow(PanelScreenshotError);
  });

  test("refuses a path that is there and is not executable", () => {
    expect(() => getBrowserCommand("/etc/hostname")).toThrow(PanelScreenshotError);
  });
});

describe("the address of one shot", () => {
  const shot: PanelShot = { name: "taken", width: 292, height: 480 };

  test("carries the capture, the last entry and the shot", () => {
    const address = new URL(composeShotAddress("http://localhost:4173/", "a-fight", 52, shot));
    expect(address.searchParams.get("fight")).toBe("a-fight");
    expect(address.searchParams.get("entry")).toBe("52");
    expect(address.searchParams.get("shot")).toBe("taken");
  });

  // Zero is the boundary and it is a state the panel has: entry 0 is the panel
  // before anything arrived, which is a reachable address and not a mistake.
  test("survives entry zero", () => {
    const address = new URL(composeShotAddress("http://localhost:4173/", "a-fight", 0, shot));
    expect(address.searchParams.get("entry")).toBe("0");
  });

  test("escapes a capture name that would end the query", () => {
    const address = new URL(composeShotAddress("http://localhost:4173/", "a&b=c", 1, shot));
    expect(address.searchParams.get("fight")).toBe("a&b=c");
  });
});

describe("what it refuses", () => {
  test("a capture that is not there, by name", () => {
    expect(() => getFightByName("no-such-fight")).toThrow(PanelScreenshotError);
  });

  test("and the refusal is branded", () => {
    try {
      getFightByName("no-such-fight");
      expect.unreachable();
    } catch (error) {
      expect((error as Error).name).toBe("MargoMeterTool/PanelScreenshot");
      expect((error as PanelScreenshotError).code).toBe("PanelScreenshot");
    }
  });

  test("a browser nothing can find", async () => {
    await expect(
      writePanelScreenshots({ browser: "/nowhere/margometer-no-such-browser" }),
    ).rejects.toThrow(PanelScreenshotError);
  });

  test("the newest capture is the default subject", () => {
    expect(getFightByName(null).name).toBe(CAPTURED_FIGHTS.at(-1)!.name);
  });
});

describe("what the sidecar is composed of", () => {
  test("the version it is written at, not the one it was written from", () => {
    expect(composeTakenAt("a-fight", "2026-08-18T00:00:00.000Z", "abc1234").version).toBe(
      manifest.version,
    );
  });

  test("and the capture, the moment and the commit it was handed", () => {
    const takenAt = composeTakenAt("a-fight", "2026-08-18T00:00:00.000Z", "abc1234");
    expect(takenAt.fight).toBe("a-fight");
    expect(takenAt.takenAt).toBe("2026-08-18T00:00:00.000Z");
    expect(takenAt.commit).toBe("abc1234");
  });
});
