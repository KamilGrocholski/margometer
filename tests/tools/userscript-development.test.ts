/**
 * The claim that the development build costs the people who install nothing.
 *
 * ⚠️ **Over the built text, not over the arrangement that is supposed to produce
 * it.** The first attempt at this was a `define` and a branch, which reads
 * exactly like a thing that would be removed and is not: measured on Bun 1.3.14
 * with `minify: false`, the constant is substituted and the branch — and every
 * module the branch imports — stays in the bundle. Any future arrangement is
 * free to be cleverer than the current one; what it may not be is unmeasured.
 *
 * The second half is the shape of the seam. `build.ts` resolves one specifier to
 * a different file, so nothing typechecks the two against each other: a
 * development build whose seam had drifted would not fail, it would quietly stop
 * measuring.
 */

import { describe, expect, test } from "bun:test";
import manifest from "@/package.json";
import {
  composeUserscriptBanner,
  composeUserscriptFiles,
  DEVELOPMENT_NAME,
  DEVELOPMENT_USERSCRIPT_FILENAME,
} from "@/build.ts";
import {
  CAPTURE_PHASE,
  DOM_PHASE,
  DRAG_PHASE,
  GESTURE_PHASE,
  PART_PHASES,
  PAYLOAD_PHASE,
  READING_PHASE,
  SESSION_PHASE,
  VIEW_PHASE,
  WHOLE_PHASES,
} from "@/src/cost-phases.ts";
import * as production from "@/src/userscript-instrument.ts";
import * as development from "@/src/userscript-instrument-development.ts";

const INSTRUMENT_MARKS = ["performance.now", "MargoMeter-Cost", "usedJSHeapSize"];

const [SHIPPED, DEVELOPED] = await Promise.all([
  composeUserscriptFiles(),
  composeUserscriptFiles(true),
]);

describe("the development build", () => {
  test.each(INSTRUMENT_MARKS)("leaves no %s in the file people install", (mark) => {
    expect(SHIPPED.script).not.toContain(mark);
  });

  test.each(INSTRUMENT_MARKS)("carries %s itself", (mark) => {
    expect(DEVELOPED.script).toContain(mark);
  });

  // Otherwise the guard above would pass on a build that produced nothing at all.
  test("is otherwise the same bundle, built the same way", () => {
    expect(DEVELOPED.script).toContain("MargoMeter-Panel");
    expect(SHIPPED.script).toContain("MargoMeter-Panel");
    expect(DEVELOPED.script.length).toBeGreaterThan(SHIPPED.script.length);
  });

  /**
   * Tampermonkey tells scripts apart by `@name`. A development copy sharing the
   * release's would replace it on install and be replaced back by the next
   * update check, which is why it carries neither URL: nothing on a release page
   * is this file.
   */
  test("installs beside a release rather than over it", () => {
    const banner = composeUserscriptBanner(
      manifest.version,
      manifest.description,
      manifest.homepage,
      true,
    );

    expect(banner).toContain(`@name         ${DEVELOPMENT_NAME}`);
    expect(banner).not.toContain("@updateURL");
    expect(banner).not.toContain("@downloadURL");
    expect(DEVELOPMENT_USERSCRIPT_FILENAME.endsWith(".user.js")).toBe(true);
  });

  test("leaves the released banner as it was", () => {
    const banner = composeUserscriptBanner(
      manifest.version,
      manifest.description,
      manifest.homepage,
    );

    expect(banner).toContain("@name         MargoMeter\n");
    expect(banner).toContain("@updateURL");
    expect(banner).toContain("@downloadURL");
  });

  /**
   * A phase in neither group is measured and never drawn — the overlay reads the
   * two lists and nothing else, so a name added to the vocabulary and forgotten
   * here would cost a payload its share and say nothing at all.
   */
  test("sorts every phase name into exactly one group", () => {
    const every = [
      PAYLOAD_PHASE,
      GESTURE_PHASE,
      DRAG_PHASE,
      SESSION_PHASE,
      CAPTURE_PHASE,
      READING_PHASE,
      VIEW_PHASE,
      DOM_PHASE,
    ];

    expect([...WHOLE_PHASES, ...PART_PHASES].sort()).toEqual([...every].sort());
    expect(WHOLE_PHASES.filter((name) => PART_PHASES.includes(name))).toEqual([]);
    expect(new Set(every).size).toBe(every.length);
  });

  test("keeps one shape across the seam it swaps", () => {
    expect(Object.keys(development).sort()).toEqual(Object.keys(production).sort());
  });

  // The pass-through is the whole of the production seam, and it is the one thing
  // about it that has to stay true: it runs the work and hands back its value.
  test("hands back the work's own value on both sides of the seam", () => {
    const wanted = { rows: 3 };

    expect(production.getTimedResult("view", () => wanted)).toBe(wanted);
    expect(development.getTimedResult("view", () => wanted)).toBe(wanted);
  });

  test("draws nothing on a page that has no document, on either side", () => {
    expect(() => production.setCostDrawn({})).not.toThrow();
    expect(() => development.setCostDrawn({})).not.toThrow();
  });
});
