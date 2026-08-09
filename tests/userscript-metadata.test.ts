import { describe, expect, test } from "bun:test";
import manifest from "@/package.json";
import { userscriptBanner } from "@/build.ts";

const BANNER = userscriptBanner(manifest.version, manifest.description, manifest.homepage);
const directive = (key: string): string[] =>
  [...BANNER.matchAll(new RegExp(`^// @${key}\\s+(.*)$`, "gm"))].map((match) => match[1]!.trim());

describe("userscript metadata", () => {
  test("is a closed metadata block", () => {
    expect(BANNER.startsWith("// ==UserScript==\n")).toBe(true);
    expect(BANNER.trimEnd().endsWith("// ==/UserScript==")).toBe(true);
  });

  // The version Tampermonkey sees has to be the version the repo claims;
  // a banner carrying a stale number offers updates that are not updates.
  test("version comes from package.json", () => {
    expect(directive("version")).toEqual([manifest.version]);
  });

  test("declares no privileges and stays out of frames", () => {
    expect(directive("grant")).toEqual(["none"]);
    expect(BANNER).toContain("// @noframes");
  });

  // A wrong @match is the failure mode with no symptom: the add-on simply never
  // runs, and nothing anywhere says so.
  test("matches game worlds on both domains, with a path pattern", () => {
    expect(directive("match")).toEqual([
      "https://*.margonem.pl/*",
      "https://*.margonem.com/*",
    ]);
  });

  test("excludes the hosts that are the site rather than a world", () => {
    const excludes = directive("exclude");
    for (const host of ["www", "forum", "commons", "pomoc"]) {
      expect(excludes).toContain(`https://${host}.margonem.pl/*`);
      expect(excludes).toContain(`https://${host}.margonem.com/*`);
    }
  });

  test("every exclude is covered by a match — an exclude for an unmatched host is dead", () => {
    const matched = (url: string): boolean =>
      directive("match").some((pattern) => {
        const re = new RegExp(`^${pattern.replace(/\*/g, "[^/]*")}$`);
        return re.test(url);
      });
    for (const exclude of directive("exclude")) expect(matched(exclude)).toBe(true);
  });
});
