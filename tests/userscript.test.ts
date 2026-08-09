import { describe, expect, test } from "bun:test";
import pkg from "../package.json";
import { banner } from "../build.ts";

const HEAD = banner(pkg.version, pkg.description, pkg.homepage);
const field = (key: string): string[] =>
  [...HEAD.matchAll(new RegExp(`^// @${key}\\s+(.*)$`, "gm"))].map((m) => m[1]!.trim());

describe("userscript metadata", () => {
  test("is a closed metadata block", () => {
    expect(HEAD.startsWith("// ==UserScript==\n")).toBe(true);
    expect(HEAD.trimEnd().endsWith("// ==/UserScript==")).toBe(true);
  });

  // The version Tampermonkey sees has to be the version the repo claims;
  // a banner carrying a stale number offers updates that are not updates.
  test("version comes from package.json", () => {
    expect(field("version")).toEqual([pkg.version]);
  });

  test("declares no privileges and stays out of frames", () => {
    expect(field("grant")).toEqual(["none"]);
    expect(HEAD).toContain("// @noframes");
  });

  // A wrong @match is the failure mode with no symptom: the add-on simply never
  // runs, and nothing anywhere says so.
  test("matches game worlds on both domains, with a path pattern", () => {
    expect(field("match")).toEqual([
      "https://*.margonem.pl/*",
      "https://*.margonem.com/*",
    ]);
  });

  test("excludes the hosts that are the site rather than a world", () => {
    const excludes = field("exclude");
    for (const host of ["www", "forum", "commons", "pomoc"]) {
      expect(excludes).toContain(`https://${host}.margonem.pl/*`);
      expect(excludes).toContain(`https://${host}.margonem.com/*`);
    }
  });

  test("every exclude is covered by a match — an exclude for an unmatched host is dead", () => {
    const matched = (url: string): boolean =>
      field("match").some((pattern) => {
        const re = new RegExp(`^${pattern.replace(/\*/g, "[^/]*")}$`);
        return re.test(url);
      });
    for (const exclude of field("exclude")) expect(matched(exclude)).toBe(true);
  });
});
