import { describe, expect, test } from "bun:test";
import manifest from "@/package.json";
import { composeUserscriptBanner } from "@/build.ts";

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
