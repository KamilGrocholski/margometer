/**
 * The two places the client states a build id, read directly.
 *
 * Both exports were reached only through `getBuildFromPage` in
 * `tests/tools/game-client-source.test.ts`, so neither was named anywhere under
 * `tests/` and what each of them *refuses* had never been asked.
 *
 * ⚠️ **Why this module sits in `core` at all**, which is what makes covering it worth a
 * file: it is the one layer both an add-on file and a tool may read, and both must read
 * a build the same way. A recording states the build it was made against and the cache
 * states the build it holds; if the two were read by different patterns those numbers
 * would stop meaning the same thing (§7.6).
 */

import { describe, expect, test } from "bun:test";
import {
  getGameBuildFromInlineObject,
  getGameBuildFromScriptName,
  getGameBundleNameFromScriptName,
} from "@/src/core/game-build.ts";

/** A build id as the client wrote one until 2026-08-25 — thirteen digits, milliseconds. */
const BUILD = "1786514810315";

/**
 * And as it writes one since: eight characters of letters and digits, behind a
 * separating dot. Read off `tempest.margonem.pl` and `luvia.margonem.pl` on
 * 2026-08-25, which served `/js/main.min.53XkBRxF.js` — the shape that made three
 * recordings of that day carry no build at all (`src/core/game-build.ts`).
 */
const LETTERED_BUILD = "53XkBRxF";

describe("a build id in a script filename", () => {
  test("is read out of the name the client serves", () => {
    expect(getGameBuildFromScriptName(`main.min${BUILD}.js`)).toBe(BUILD);
  });

  test("is read where the id has letters in it and a dot before it", () => {
    expect(getGameBuildFromScriptName(`main.min.${LETTERED_BUILD}.js`)).toBe(LETTERED_BUILD);
  });

  test("is found inside the markup around it", () => {
    expect(
      getGameBuildFromScriptName(`<script src="/main.min${BUILD}.js"></script>`),
    ).toBe(BUILD);
  });

  test("is found in the markup the client serves today", () => {
    expect(
      getGameBuildFromScriptName(`<script src="/js/main.min.${LETTERED_BUILD}.js"></script>`),
    ).toBe(LETTERED_BUILD);
  });

  // Null and never a guess: a page that does not state a build is a page whose
  // build is unknown, and §9.3 keeps that apart from any particular number.
  test("is null where the name states none", () => {
    // The last two are what the looser token has to keep refusing: a bundle named
    // without any id, served with the id as a query parameter — which is a name
    // the client also wrote, and a build this reader deliberately does not take
    // from a place §7.6 never named.
    for (const text of [
      "",
      "main.min.js",
      "main.js",
      "<script src=\"/app.js\">",
      `<script src="js/main.min.js?v=${BUILD}">`,
      `<script src="main.min.js?v=${LETTERED_BUILD}">`,
    ]) {
      expect(getGameBuildFromScriptName(text), text).toBeNull();
    }
  });
});

/**
 * The name beside the id, and why it is a second export rather than something a
 * caller rebuilds: `main.min` + id + `.js` was every name the client served until
 * 2026-08-25, and composing that today asks for a file the server does not have.
 */
describe("the bundle's own filename", () => {
  test("is read whole, in both shapes the client has served", () => {
    expect(getGameBundleNameFromScriptName(`<script src="js/main.min${BUILD}.js">`)).toBe(
      `main.min${BUILD}.js`,
    );
    expect(
      getGameBundleNameFromScriptName(`<script src="/js/main.min.${LETTERED_BUILD}.js">`),
    ).toBe(`main.min.${LETTERED_BUILD}.js`);
  });

  test("carries the id the other reader answers with", () => {
    const markup = `<script src="/js/main.min.${LETTERED_BUILD}.js">`;
    const name = getGameBundleNameFromScriptName(markup) ?? "";

    expect(name).toContain(getGameBuildFromScriptName(markup) ?? "");
  });

  test("is null where the page names no bundle", () => {
    for (const text of ["", "main.min.js", `build = { version: ${BUILD} }`]) {
      expect(getGameBundleNameFromScriptName(text), text).toBeNull();
    }
  });
});

describe("a build id in the inline object", () => {
  test("is read out of the object a world page carries", () => {
    expect(getGameBuildFromInlineObject(`build = { version: ${BUILD} }`)).toBe(BUILD);
  });

  test("is read where the id has letters, quoted or not", () => {
    expect(getGameBuildFromInlineObject(`build = { version: ${LETTERED_BUILD} }`)).toBe(
      LETTERED_BUILD,
    );
    expect(getGameBuildFromInlineObject(`build = { version: "${LETTERED_BUILD}" }`)).toBe(
      LETTERED_BUILD,
    );
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
