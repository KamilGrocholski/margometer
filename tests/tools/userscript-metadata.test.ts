import { describe, expect, test } from "bun:test";
import manifest from "@/package.json";
import {
  composeUserscriptBanner,
  METADATA_FILENAME,
  USERSCRIPT_FILENAME,
} from "@/build.ts";

const BANNER = composeUserscriptBanner(manifest.version, manifest.description, manifest.homepage);
const getDirective = (key: string): string[] =>
  [...BANNER.matchAll(new RegExp(`^// @${key}\\s+(.*)$`, "gm"))].map((match) => match[1]!.trim());

describe("userscript metadata", () => {
  test("is a closed metadata block", () => {
    expect(BANNER.startsWith("// ==UserScript==\n")).toBe(true);
    expect(BANNER.trimEnd().endsWith("// ==/UserScript==")).toBe(true);
  });

  // The version Tampermonkey sees has to be the version the repo claims;
  // a banner carrying a stale number offers updates that are not updates.
  test("version comes from package.json", () => {
    expect(getDirective("version")).toEqual([manifest.version]);
  });

  /**
   * ⚠️ **Neither may carry a version number.** A per-release URL has to be
   * edited on every release, and the release it is edited in is the one it
   * points at — so an installed copy is offered the version it is already
   * running. `releases/latest/download/` is GitHub's own redirect and stays
   * true without being touched.
   *
   * Both keys are checked because they are read at different moments:
   * `@updateURL` for the metadata poll, `@downloadURL` for the install that
   * follows it.
   */
  test("points at the release assets for its own updates, without naming a version", () => {
    const release = `${manifest.homepage}/releases/latest/download`;
    expect(getDirective("downloadURL")).toEqual([`${release}/${USERSCRIPT_FILENAME}`]);
    expect(getDirective("updateURL")).toEqual([`${release}/${METADATA_FILENAME}`]);
    for (const url of [...getDirective("downloadURL"), ...getDirective("updateURL")]) {
      expect(url).not.toContain(manifest.version);
    }
  });

  /**
   * ⚠️ **0.5.0 polls for `margometer.meta.js`, so the name is not ours to
   * change.** Every copy installed from that release asks for exactly this file
   * under `releases/latest/download/`, and a release without it leaves them all
   * checking a 404 — silently, which is what a failed update check does. The
   * assertion is on the literal name and not on the constant, because the
   * constant is the thing that must not drift.
   */
  test("keeps the metadata filename the previous release already polls for", () => {
    expect(METADATA_FILENAME).toBe("margometer.meta.js");
  });

  test("declares no privileges and stays out of frames", () => {
    expect(getDirective("grant")).toEqual(["none"]);
    expect(BANNER).toContain("// @noframes");
  });

  // A wrong @match is the failure mode with no symptom: the add-on simply never
  // runs, and nothing anywhere says so.
  test("matches game worlds on both domains, with a path pattern", () => {
    expect(getDirective("match")).toEqual([
      "https://*.margonem.pl/*",
      "https://*.margonem.com/*",
    ]);
  });

  test("excludes the hosts that are the site rather than a world", () => {
    const excludes = getDirective("exclude");
    for (const host of ["www", "forum", "commons", "pomoc"]) {
      expect(excludes).toContain(`https://${host}.margonem.pl/*`);
      expect(excludes).toContain(`https://${host}.margonem.com/*`);
    }
  });

  /**
   * ⚠️ **The bare domain is a host the match pattern covers.**
   *
   * `*.` followed by part of the hostname matches "the given host (and port) and
   * any of its subdomains" — `*://*.mozilla.org/*` is listed as matching
   * `https://mozilla.org/`
   * (developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns,
   * read 2026-08-11). So `www` was excluded while `margonem.pl` itself was not,
   * and the add-on ran on the operator's own front page. The asymmetry is the
   * defect; the symmetry below is what fixes it.
   */
  test("and the bare domain, which the match pattern also covers", () => {
    const excludes = getDirective("exclude");
    expect(excludes).toContain("https://margonem.pl/*");
    expect(excludes).toContain("https://margonem.com/*");
  });

  /**
   * The match simulation carries the bare-host rule too, so the two cannot
   * disagree: modelled with `[^/]*` alone, `https://margonem.pl/*` reads as an
   * exclude for a host nothing matches, and this guard would call the fix dead
   * code.
   */
  test("every exclude is covered by a match — an exclude for an unmatched host is dead", () => {
    const isMatchedByAnyPattern = (url: string): boolean =>
      getDirective("match").some((pattern) => {
        const host = pattern.replace(/^https:\/\//, "").replace(/\/.*$/, "");
        const subdomains = host.startsWith("*.") ? String.raw`([^/]+\.)*` : "[^/]*";
        const asRegExp = new RegExp(
          `^https://${subdomains}${host.replace(/^\*\./, "").replace(/\./g, String.raw`\.`)}/.*$`,
        );
        return asRegExp.test(url);
      });

    for (const exclude of getDirective("exclude")) {
      expect(isMatchedByAnyPattern(exclude), exclude).toBe(true);
    }
    // The simulation has to be able to say no, or the loop above proves nothing.
    expect(isMatchedByAnyPattern("https://margonem.example/*")).toBe(false);
  });

  // MIT travels with the copy, and the pasted file is the copy a user gets.
  test("carries the licence the repository is under", () => {
    expect(getDirective("license")).toEqual(["MIT"]);
  });
});
