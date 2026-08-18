/**
 * §3's rule that a measurement over the captured fights names the material it was
 * taken on, re-earned over every comment this repository writes.
 *
 * **The fault it exists for, spelled three times a commit apart.** `1 794 of
 * 1 794 captured entries`, `20 of 400 engine calls`, `22 of 26 comparisons` —
 * every one of them exactly right when typed, every one silently wrong the next
 * time a recording arrived, and nothing anywhere went red. The third audit filed
 * nine of them and declined to correct them a fourth time, because correcting
 * them was never the missing part: it had already been done twice, and the
 * replacement sentence written to close the second audit's finding was
 * invalidated by the very next commit
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F3).
 *
 * A recording never changes — it is evidence (§9.2) — so a figure scoped to one
 * by name is true for good, and a figure scoped to *the captures* has a date on
 * it that nobody wrote down. That is the same fix §7.6 applies to a quotation
 * from the client and §7.7 to a finding about the tree: give the claim its
 * referent.
 *
 * ⚠️ **This is a pattern, and it is deliberately the narrow one.** It catches a
 * count written in digits and misses one written in words — "Two occurrences in
 * the whole material" was false for rounds and this would not have flagged it.
 * The wide version was built and thrown away: admitting `two`…`twenty` took the
 * sweep from 5 sentences to 38, of which 2 were real. A guard that is wrong nine
 * times out of ten is one somebody turns off, which is the argument
 * `tracked-text.test.ts` makes for leaving evidence out of its own sweep.
 * Narrow and quiet beats wide and ignored; the words are what §3 is for.
 *
 * The remedy for a false positive is the same as for a true one — name the
 * recording — so being flagged wrongly costs a citation the sentence is better
 * for having. It cost exactly that twice on this file's own prose, one sentence
 * quoting the bad examples without backticks and one counting something else
 * beside the word `captures`.
 *
 * ⚠️ **It reads itself only once it is tracked.** The walk is `git ls-files`, so
 * for the whole of the commit that introduced it this file was invisible to it —
 * which is why those two sentences went in green and came out red one commit
 * later. A guard that cannot see its own prose is one that has never been run
 * against the hardest text in the repository to get right, which is its own.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getCommentRangesFromSource } from "@/libs/source-regions.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

/** Phrases that scope a claim to all the material, which grows. */
const WHOLE_MATERIAL =
  /\b(the captures|captured (entries|calls|messages|fights)|the whole material|the material|every capture)\b|tests\/captured-fights\/(?!\d)/i;

/**
 * A count of two digits or more.
 *
 * Two rather than one because an index and a protocol value are routinely a
 * single digit — "every capture carries `init` on call 0" counts nothing. The
 * thousands separator here is the narrow no-break space this repository writes
 * figures with, so `1 794` is one count and not two.
 */
const DIGIT_COUNT = /(?<![\w.%§-])\d{2,}(?:[   ]\d{3})*(?![\w.%])|\b\d[   ]\d{3}\b/;

/**
 * What gives a figure its referent: a recording named by its dated filename, or
 * a commit the tree can be read at.
 *
 * A date alone is enough because every capture filename opens with one and
 * `tests/tools/cited-paths.test.ts` already holds the path itself to existing —
 * so this guard never has to know what a capture is called.
 */
const DATED = /\d{4}-\d\d-\d\d|`[0-9a-f]{7,40}`/;

const SOURCE_ROOTS = ["libs", "src", "tools", "tests", "build.ts"];
const DOCUMENTS = ["AGENTS.md", "README.md", "README.en.md", "NOTICE.md"];

function getTrackedSourceFiles(): string[] {
  return execFileSync("git", ["ls-files", ...SOURCE_ROOTS], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => file.endsWith(".ts"));
}

/**
 * Every sentence of prose this repository writes, flattened out of its comment.
 *
 * Sentences rather than lines, because these comments wrap: the count and the
 * phrase that scopes it routinely sit on different lines, and a line-at-a-time
 * reader would see neither half beside the other.
 */
function getProseSentences(file: string): string[] {
  const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
  const comments = file.endsWith(".ts")
    ? getCommentRangesFromSource(source).map((range) => source.slice(range.start, range.end))
    : [source];
  return comments.flatMap((comment) =>
    comment.replace(/\n\s*\*?\s?/g, " ").split(/(?<=[.:;!?])\s+/),
  );
}

function getUndatedCounts(file: string): string[] {
  return getProseSentences(file).filter((sentence) => {
    if (!WHOLE_MATERIAL.test(sentence)) return false;
    if (DATED.test(sentence)) return false;
    // A figure inside backticks is a protocol value, a path, a section number or
    // an identifier — never a count of the material. Stripping them is what took
    // this from noise to a guard: `+oth_dmg=4439, ,Gracz 5(66.95%)` and
    // `skillId=86` are examples of the game's own writing, not measurements of
    // ours.
    return DIGIT_COUNT.test(sentence.replace(/`[^`]*`/g, " "));
  });
}

const FILES = [...getTrackedSourceFiles(), ...DOCUMENTS];

describe("a measurement over the captured fights names its material", () => {
  // Either half going to zero turns the check below green without it checking
  // anything, which is what a walker that stopped walking looks like.
  test("there is prose to read, and it says something about the material", () => {
    expect(FILES.length).toBeGreaterThan(0);
    const scoped = FILES.flatMap((file) =>
      getProseSentences(file).filter((sentence) => WHOLE_MATERIAL.test(sentence)),
    );
    expect(scoped.length).toBeGreaterThan(0);
  });

  test("no sentence counts the whole of it without saying which recording", () => {
    const undated = FILES.flatMap((file) =>
      getUndatedCounts(file).map((sentence) => `${file}: ${sentence.trim().slice(0, 120)}`),
    );
    expect(undated).toEqual([]);
  });
});
