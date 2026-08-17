/**
 * The two places the client states a build id, read directly.
 *
 * Both exports were reached only through `getBuildFromPage` in
 * `tests/tools/game-client-source.test.ts`, so neither was named anywhere under
 * `tests/` and what each of them *refuses* had never been asked
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F11).
 *
 * ⚠️ **Why this module sits in `core` at all**, which is what makes covering it
 * worth a file: it is the one layer both an add-on file and a tool may read, and
 * both must read a build the same way. A recording states the build it was made
 * against and the cache states the build it holds; if the two were read by
 * different patterns those numbers would stop meaning the same thing (§7.6).
 */

import { describe, expect, test } from "bun:test";
import {
  getGameBuildFromInlineObject,
  getGameBuildFromScriptName,
} from "@/src/core/game-build.ts";

/** A build id as the client actually writes one — thirteen digits, milliseconds. */
const BUILD = "1786514810315";

describe("a build id in a script filename", () => {
  test("is read out of the name the client serves", () => {
    expect(getGameBuildFromScriptName(`main.min${BUILD}.js`)).toBe(BUILD);
  });

  test("is found inside the markup around it", () => {
    expect(
      getGameBuildFromScriptName(`<script src="/main.min${BUILD}.js"></script>`),
    ).toBe(BUILD);
  });

  // Null and never a guess: a page that does not state a build is a page whose
  // build is unknown, and §9.3 keeps that apart from any particular number.
  test("is null where the name states none", () => {
    for (const text of ["", "main.min.js", "main.js", "<script src=\"/app.js\">"]) {
      expect(getGameBuildFromScriptName(text), text).toBeNull();
    }
  });
});

describe("a build id in the inline object", () => {
  test("is read out of the object a world page carries", () => {
    expect(getGameBuildFromInlineObject(`build = { version: ${BUILD} }`)).toBe(BUILD);
  });

  test("is null where the page states none", () => {
    for (const text of ["", "build = {}", "version: nothing"]) {
      expect(getGameBuildFromInlineObject(text), text).toBeNull();
    }
  });
});

/**
 * The two readers are not each other, which is the whole reason there are two:
 * a page carries a script tag that may be stale and an inline object that is
 * not, and §7.6 has the inline one beating the tag. A single reader that matched
 * either would make that ordering impossible to state.
 */
test("neither reader answers where the other one does", () => {
  expect(getGameBuildFromInlineObject(`main.min${BUILD}.js`)).toBeNull();
  expect(getGameBuildFromScriptName(`build = { version: ${BUILD} }`)).toBeNull();
});
