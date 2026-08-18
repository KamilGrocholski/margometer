import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

/**
 * `README.md` and `README.en.md` held to one skeleton.
 *
 * GitHub renders `README.md` and nothing else on the front page, so a second
 * language is a second file — and the second file is where the drift lives. A
 * screenshot added to one, a release link changed in one, a section that exists
 * only in Polish: all four of those render perfectly and read as finished work,
 * because the reader of one translation never sees the other.
 *
 * ⚠️ **The prose is deliberately not compared, and it is not comparable.** A
 * translation is not a transformation of its source and no machine here can say
 * whether two sentences mean the same thing. What it can say is that the two
 * documents have the same shape: the same run of headings, the same pictures in
 * the same order, the same places the links go. That is the half that rots
 * silently — a wrong sentence is visible to anybody who reads it, a missing
 * screenshot is visible to nobody who reads only one file.
 *
 * The switcher is checked from both ends rather than by matching one line: what
 * makes two files one document to a reader is that each one offers the other,
 * and a switcher pointing at a file that does not link back is the same
 * dead end as no switcher at all.
 */

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

const POLISH = "README.md";
const ENGLISH = "README.en.md";

/** The pair itself, which is the one link the two files must *not* share. */
const TRANSLATIONS = [POLISH, ENGLISH];

function getSource(file: string): string {
  return readFileSync(REPOSITORY_ROOT + file, "utf8");
}

/**
 * Levels rather than titles: `## Instalacja` and `## Install` are the same
 * heading, and the only thing about them a translation must keep is where they
 * sit and how deep they are.
 */
function getHeadingLevels(source: string): number[] {
  return [...source.matchAll(/^(#{1,6}) \S/gm)].map((match) => match[1]!.length);
}

function getImagePaths(source: string): string[] {
  return [...source.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]!);
}

/**
 * Where the links go, from both spellings Markdown offers: the inline target and
 * the reference definition at the foot of a section. The lookbehind is what
 * keeps the pictures out — an image is an inline link with a `!` in front of it,
 * and they are counted separately above.
 */
function getLinkTargets(source: string): string[] {
  const inline = [...source.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]!);
  const defined = [...source.matchAll(/^\[[^\]]+\]:\s*(\S+)$/gm)].map((match) => match[1]!);
  return [...inline, ...defined].filter((target) => !TRANSLATIONS.includes(target));
}

/**
 * The same set, in an order neither file chose. Where a picture's position is
 * part of the layout and compared as a sequence, a link's is not: the release
 * link may sit in a different sentence in each language and still be the same
 * offer.
 */
function getSortedLinkTargets(source: string): string[] {
  return [...new Set(getLinkTargets(source))].sort();
}

describe("README.md and README.en.md", () => {
  // Every reader here can match nothing and stay green — an empty run equals an
  // empty run — which is what a pattern that stopped matching looks like from
  // the outside (`tests/tools/cited-paths.test.ts` learned it on its walker).
  test("both were read, and there is a skeleton in them to compare", () => {
    for (const file of TRANSLATIONS) {
      const source = getSource(file);
      expect(getHeadingLevels(source).length).toBeGreaterThan(0);
      expect(getImagePaths(source).length).toBeGreaterThan(0);
      expect(getLinkTargets(source).length).toBeGreaterThan(0);
    }
  });

  test("run the same headings, at the same depth, in the same order", () => {
    expect(getHeadingLevels(getSource(ENGLISH))).toEqual(getHeadingLevels(getSource(POLISH)));
  });

  test("show the same pictures, in the same order", () => {
    expect(getImagePaths(getSource(ENGLISH))).toEqual(getImagePaths(getSource(POLISH)));
  });

  test("send their links to the same places", () => {
    expect(getSortedLinkTargets(getSource(ENGLISH))).toEqual(
      getSortedLinkTargets(getSource(POLISH)),
    );
  });

  test.each([
    [POLISH, ENGLISH],
    [ENGLISH, POLISH],
  ])("%s offers %s on its first line", (file, other) => {
    const firstLine = getSource(file).split("\n")[0] ?? "";
    expect(firstLine).toContain(`(${other})`);
  });
});
