import { USERSCRIPT_VERSION } from "@/src/userscript-version.ts";
import { describe, expect, test } from "bun:test";
import { getEndOfDigits, isWhitespaceAt } from "@/libs/text-runs.ts";
import manifest from "@/package.json";
import {
  composeUserscriptBanner,
  METADATA_FILENAME,
  USERSCRIPT_FILENAME,
} from "@/build.ts";

const BANNER = composeUserscriptBanner(manifest.version, manifest.description, manifest.homepage);
/** What a directive line opens with, before the key. */
const DIRECTIVE_OPENING = "// @";

/**
 * What every line naming `key` states after it.
 *
 * The whitespace after the key is what tells one directive from another whose
 * name it begins — `@match` and `@matchless` are two keys, and only the space
 * says so.
 */
const getDirective = (key: string): string[] => {
  const opening = `${DIRECTIVE_OPENING}${key}`;
  return BANNER.split("\n")
    .filter((line) => line.startsWith(opening) && isWhitespaceAt(line, opening.length))
    .map((line) => line.slice(opening.length).trim());
};

const SCHEME = "https://";

const SUBDOMAIN_MARK = "*.";

/** The authority of an address: what stands between the scheme and the first slash. */
function getHostOf(address: string): string {
  const rest = address.slice(SCHEME.length);
  const slash = rest.indexOf("/");
  return slash === -1 ? rest : rest.slice(0, slash);
}

/**
 * Whether a manager reading `pattern` would run the add-on on `address`.
 *
 * ⚠️ **The bare-host rule is here on purpose and is looser than a host name.**
 * A pattern with no `*.` in front of it is modelled the way a manager models it,
 * as anything up to the first slash — so the guard cannot call the exclude for a
 * bare domain dead code while a manager still honours it.
 */
function isAddressMatchedBy(address: string, pattern: string): boolean {
  if (!address.startsWith(SCHEME) || !pattern.startsWith(SCHEME)) return false;
  const host = getHostOf(pattern);
  const authority = getHostOf(address);
  if (address.length <= SCHEME.length + authority.length) return false;

  const bare = host.startsWith(SUBDOMAIN_MARK) ? host.slice(SUBDOMAIN_MARK.length) : host;
  if (!authority.endsWith(bare)) return false;
  const before = authority.slice(0, authority.length - bare.length);
  if (!host.startsWith(SUBDOMAIN_MARK)) return true;
  // Whole labels, each with something in it: a name is either the host itself or
  // something with a full stop between it and the host.
  return before === "" || (before.endsWith(".") && before.length > 1);
}

/** Whether text opens the way a release number does: digits, point, digits, point, digits. */
function hasVersionOpening(text: string): boolean {
  let index = 0;
  for (let part = 0; part < 3; part += 1) {
    const end = getEndOfDigits(text, index);
    if (end === index) return false;
    if (part === 2) return true;
    if (text[end] !== ".") return false;
    index = end + 1;
  }
  return true;
}

describe("userscript metadata", () => {
  test("is a closed metadata block", () => {
    expect(BANNER.startsWith("// ==UserScript==\n")).toBe(true);
    expect(BANNER.trimEnd().endsWith("// ==/UserScript==")).toBe(true);
  });

  // The version Tampermonkey sees has to be the version the repo claims;
  // a banner carrying a stale number offers updates that are not updates.
  /**
   * ⚠️ **Every directive a manager reads by name, named here.** Each key was one
   * word in a list nothing checked: `@namespace` decides which script an update
   * belongs to, `@homepageURL` is where a player is sent to report anything, and
   * `@description` is the one line they see before installing. A mutation
   * renaming any of them left a block that still parses, still installs, and
   * quietly loses whatever the manager did with that line.
   */
  test("names every directive a manager reads, and fills each from the manifest", () => {
    for (const [key, value] of [
      ["name", "MargoMeter"],
      ["namespace", manifest.homepage],
      ["description", manifest.description],
      ["author", manifest.author],
      ["homepageURL", manifest.homepage],
    ] as const) {
      expect(BANNER, key).toContain(`// @${key}`);
      expect(BANNER, key).toContain(value);
    }
  });

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
      getDirective("match").some((pattern) => isAddressMatchedBy(url, pattern));

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

/**
 * The constant every layer is allowed to read (§9.1), and the one this file is
 * about from the other end.
 *
 * ⚠️ **It was named nowhere under `tests/`** — `tests/tools/source-layout.test.ts`
 * names the *phrase* it falls back to, as the one Polish string no diacritic can
 * find, which is a claim about the language of a literal and not about what the
 * constant answers
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F11).
 */
describe("the version the add-on says it is", () => {
  test("falls back to something that is not a release, when nobody built it", () => {
    // Under the test runner nothing substitutes the constant, so this is the
    // fallback path and the only one reachable without a build.
    expect(USERSCRIPT_VERSION.length).toBeGreaterThan(0);
    expect(USERSCRIPT_VERSION).not.toBe(manifest.version);
  });

  /**
   * A version nobody built must not read as one somebody did. The report a
   * player pastes carries this string, and a figure that cannot be tied to a
   * release is worse than one that says so.
   */
  test("does not look like a version number", () => {
    expect(hasVersionOpening(USERSCRIPT_VERSION), USERSCRIPT_VERSION).toBe(false);
  });

  test("is what the built userscript replaces, so the banner never carries it", () => {
    expect(BANNER).not.toContain(USERSCRIPT_VERSION);
  });
});
