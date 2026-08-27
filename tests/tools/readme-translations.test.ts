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

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getPartsSeparatedByWhitespace } from "@/libs/text-runs.ts";
import { getHeadingDepth } from "@/tests/document-lines.ts";

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
  const levels: number[] = [];
  for (const line of source.split("\n")) {
    const depth = getHeadingDepth(line);
    if (depth !== null) levels.push(depth);
  }
  return levels;
}

function getImagePaths(source: string): string[] {
  return getInlineLinks(source)
    .filter((link) => link.isPicture)
    .map((link) => link.target);
}

/**
 * Every `[label](target)` in the source, and whether the `!` in front of it
 * makes it a picture.
 *
 * A label runs to the first `]` and a target to the first `)`, which is the
 * whole grammar these two files use — no nested brackets, no titles in quotes.
 * A link either half of which never closes is not one.
 */
function getInlineLinks(source: string): { isPicture: boolean; target: string }[] {
  const links: { isPicture: boolean; target: string }[] = [];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== "[") continue;
    const labelEnd = source.indexOf("]", index + 1);
    if (labelEnd === -1) break;
    if (source[labelEnd + 1] !== "(") {
      index = labelEnd;
      continue;
    }
    const targetEnd = source.indexOf(")", labelEnd + 2);
    if (targetEnd === -1) break;
    if (targetEnd > labelEnd + 2) {
      links.push({ isPicture: source[index - 1] === "!", target: source.slice(labelEnd + 2, targetEnd) });
    }
    index = targetEnd;
  }
  return links;
}

/**
 * Where a reference definition at the foot of a section points.
 *
 * `[name]: target`, with the target the only thing on the rest of the line —
 * two of them would be a line this cannot read rather than a link it may
 * silently halve.
 */
function getDefinedLinkTarget(line: string): string | null {
  if (!line.startsWith("[")) return null;
  const labelEnd = line.indexOf("]");
  if (labelEnd <= 1 || line[labelEnd + 1] !== ":") return null;
  const stated = getPartsSeparatedByWhitespace(line.slice(labelEnd + 2));
  return stated.length === 1 ? (stated[0] ?? null) : null;
}

/**
 * Where the links go, from both spellings Markdown offers: the inline target and
 * the reference definition at the foot of a section. The pictures are kept out
 * by the mark in front of them — an image is an inline link with a `!` before
 * the bracket — and they are counted separately above.
 */
function getLinkTargets(source: string): string[] {
  const inline = getInlineLinks(source)
    .filter((link) => !link.isPicture)
    .map((link) => link.target);
  const defined: string[] = [];
  for (const line of source.split("\n")) {
    const target = getDefinedLinkTarget(line);
    if (target !== null) defined.push(target);
  }
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
