/**
 * The preview harness's class names, held to one vocabulary.
 *
 * The same split the panel has, one layer out: the rules live in the `<style>`
 * block of `tools/preview-page.ts` and the strip's build status is written from
 * `tools/preview-server.ts`, with nothing holding the two together
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 *
 * ⚠️ **This one colours the signal that says the build failed.**
 * `.claude/skills/verify/SKILL.md` tells whoever is driving the preview that "a
 * red strip means your edit did not compile". `preview-ok` and `preview-bad` were
 * written in one file and styled in the other, and renaming either side left the
 * whole gate green — so the strip would have gone on printing a failed build in
 * the same colour as a good one, which is the one thing it exists to distinguish.
 */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { assertDefined } from "@/libs/assert.ts";
import { composeSourceWithoutComments } from "@/tests/source-regions.ts";
import { getPartsSeparatedByWhitespace } from "@/libs/text-runs.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { getAttributeValues } from "@/tests/markup-parts.ts";
import { getAssignedClassNames, getStyledClassNames } from "@/tests/class-names.ts";
import { composePreviewPage, type PreviewWords } from "@/tools/preview-page.ts";

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

/**
 * Both pages, because the two consumers draw different markup out of one
 * template: the served page has a reload stream and no introduction, the
 * published one the reverse. A rule for a node only one of them builds is styled
 * in both and worn in one, so asking either alone would report the other's
 * markup as a rule nothing wears.
 */
function composePage(appendedScript: string | null, introduction: string | null): string {
  return composePreviewPage({
    fightName: FIGHT.name,
    entryIndex: 0,
    payloads: FIGHT.dump.calls.map((call) => call.payload),
    fights: [
      { name: FIGHT.name, address: `/?fight=${FIGHT.name}&entry=0`, payloadsAddress: null },
    ],
    scriptDirectory: "/",
    words: WORDS,
    introduction,
    appendedScript,
  });
}

const PAGES = [composePage("// reload", null), composePage(null, "an introduction")];

const STYLED = getStyledClassNames(
  PAGES.map((page) => page.slice(page.indexOf("<style>"), page.indexOf("</style>"))).join("\n"),
);

/**
 * Worn in the markup of either page, or put on a node by the server.
 *
 * The server is read as source for the same reason the panel's renderer is: its
 * assignment sits on a branch — one class when the build is good and another when
 * it is not — and only one of the two would ever be photographed.
 */
const WORN = new Set([
  ...PAGES.flatMap((page) =>
    getAttributeValues(page.slice(page.indexOf("</style>")), "class").flatMap((value) =>
      getPartsSeparatedByWhitespace(value),
    ),
  ),
  ...getAssignedClassNames(
    composeSourceWithoutComments(
      readFileSync(new URL("../../tools/preview-server.ts", import.meta.url).pathname, "utf8"),
    ),
  ),
]);

describe("the preview harness's class names", () => {
  // Each direction is the other's insurance: a reader that silently stopped
  // matching would empty its set, and the opposite test would fail with every
  // name in it. A guard over two sets cannot be satisfied by finding nothing.
  test("there are class names on both sides to compare", () => {
    expect(STYLED.size).toBeGreaterThan(0);
    expect(WORN.size).toBeGreaterThan(0);
  });

  test("every class the harness wears has a rule", () => {
    expect([...WORN].filter((name) => !STYLED.has(name)).sort()).toEqual([]);
  });

  test("every rule the harness carries is worn", () => {
    expect([...STYLED].filter((name) => !WORN.has(name)).sort()).toEqual([]);
  });
});
