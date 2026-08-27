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
import { composeUnwrappedProse } from "@/tests/document-lines.ts";
import {
  getEndOfDigits,
  getEndOfWhitespace,
  getWordOccurrences,
  hasDigitsAt,
  isDigitAt,
  isWhitespaceAt,
  isWordCharacterAt,
} from "@/libs/text-runs.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

/** Phrases that scope a claim to all the material, which grows. */
const WHOLE_MATERIAL_PHRASES = [
  "the captures",
  "captured entries",
  "captured calls",
  "captured messages",
  "captured fights",
  "the whole material",
  "the material",
  "every capture",
];

/**
 * The directory itself, where what follows it is not a date — a path naming one
 * recording scopes the claim to that recording, and the bare directory scopes it
 * to everything in there.
 */
const MATERIAL_DIRECTORY = "tests/captured-fights/";

function hasWholeMaterialScope(sentence: string): boolean {
  const written = sentence.toLowerCase();
  if (WHOLE_MATERIAL_PHRASES.some((phrase) => getWordOccurrences(written, phrase).length > 0)) {
    return true;
  }
  for (
    let at = written.indexOf(MATERIAL_DIRECTORY);
    at !== -1;
    at = written.indexOf(MATERIAL_DIRECTORY, at + 1)
  ) {
    if (!isDigitAt(written, at + MATERIAL_DIRECTORY.length)) return true;
  }
  return false;
}

/**
 * A count of two digits or more.
 *
 * Two rather than one because an index and a protocol value are routinely a
 * single digit — "every capture carries `init` on call 0" counts nothing. The
 * thousands separator here is the narrow no-break space this repository writes
 * figures with, so `1 794` is one count and not two.
 */
const THOUSANDS_SEPARATORS = "\u00a0\u202f ";

/** What in front of a figure makes it something other than a count. */
const NOT_A_COUNT_BEFORE = ".%§-";

/** And what after it does — a decimal point, a per-cent sign, a word. */
const NOT_A_COUNT_AFTER = ".%";

function isOneOf(character: string | undefined, characters: string): boolean {
  return character !== undefined && characters.includes(character);
}

/**
 * Whether the sentence states one.
 *
 * The groups of three are what the reading is careful about: `1 794` is one
 * count, so a run of two digits or more counts wherever nothing continues it —
 * and a lone digit counts only where a separator and exactly three digits follow
 * it, which is the smallest figure this repository writes with a separator in it.
 */
function hasDigitCount(sentence: string): boolean {
  let index = 0;
  while (index < sentence.length) {
    if (!isDigitAt(sentence, index)) {
      index += 1;
      continue;
    }
    const end = getEndOfDigits(sentence, index);
    // A word cannot continue into a figure either way; what only the longer form
    // refuses is a figure a decimal point, a per-cent sign or a section mark
    // introduces, because those make it something other than a count.
    const isWordOpen = !isWordCharacterAt(sentence, index - 1);
    const isCountOpen = isWordOpen && !isOneOf(sentence[index - 1], NOT_A_COUNT_BEFORE);
    const isClosed = !isWordCharacterAt(sentence, end) && !isOneOf(sentence[end], NOT_A_COUNT_AFTER);
    if (isCountOpen && end - index >= 2 && isClosed) return true;
    if (isWordOpen && end - index === 1 && isOneOf(sentence[end], THOUSANDS_SEPARATORS)) {
      const group = getEndOfDigits(sentence, end + 1);
      if (group === end + 4 && !isWordCharacterAt(sentence, group)) return true;
    }
    index = end;
  }
  return false;
}

/**
 * What gives a figure its referent: a recording named by its dated filename, or
 * a commit the tree can be read at.
 *
 * A date alone is enough because every capture filename opens with one and
 * `tests/tools/cited-paths.test.ts` already holds the path itself to existing —
 * so this guard never has to know what a capture is called.
 */
const HEXADECIMAL = "0123456789abcdef";

const SHORTEST_COMMIT = 7;

const LONGEST_COMMIT = 40;

const TICK = "`";

function hasDatedReferent(sentence: string): boolean {
  return hasCalendarDate(sentence) || hasTickedCommit(sentence);
}

function hasCalendarDate(sentence: string): boolean {
  for (let at = 0; at < sentence.length; at += 1) {
    if (!hasDigitsAt(sentence, at, 4) || sentence[at + 4] !== "-") continue;
    if (!hasDigitsAt(sentence, at + 5, 2) || sentence[at + 7] !== "-") continue;
    if (hasDigitsAt(sentence, at + 8, 2)) return true;
  }
  return false;
}

function hasTickedCommit(sentence: string): boolean {
  for (let at = sentence.indexOf(TICK); at !== -1; at = sentence.indexOf(TICK, at + 1)) {
    let end = at + 1;
    while (end < sentence.length && HEXADECIMAL.includes(sentence[end] ?? "")) end += 1;
    const length = end - at - 1;
    if (length >= SHORTEST_COMMIT && length <= LONGEST_COMMIT && sentence[end] === TICK) return true;
  }
  return false;
}

const SOURCE_ROOTS = ["libs", "src", "tools", "tests", "build.ts"];
const DOCUMENTS = ["AGENTS.md", "README.md", "README.en.md", "NOTICE.md"];

/**
 * ⚠️ **The registers were outside this walk, and they are what it is for.**
 * `docs/protocol-keys.md` is two thousand lines of measurements over the captured
 * fights and was the one file in the repository this guard could not see — so
 * thirty of its entries came to state a count in prose that its own machine-re-earned
 * `*Shape:*` line contradicted, one of them inside a paragraph warning that a count
 * in prose goes stale silently
 * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F3).
 *
 * Named by the directory rather than one by one: every guarded register sits
 * directly under `docs/`, and the two kinds of document that must **not** be swept
 * — specs and audits — sit in subdirectories of it. That is not a coincidence to
 * lean on quietly, it is §8's own arrangement, and it is why this is a
 * non-recursive listing rather than a list of four names somebody has to remember
 * to extend.
 *
 * A spec and an audit are **dated records**: a spec's filename carries the day the
 * decision was taken and an audit states the commit it read, so a figure inside
 * one is true of the tree it names and stays true. A register makes claims about
 * the material as it stands now, which is exactly the claim that rots. Both prior
 * audits ruled the same way on the same sentences.
 */
function getTrackedRegisters(): string[] {
  return execFileSync("git", ["ls-files", "--", ":(glob)docs/*.md"], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => file !== "");
}

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
  return comments.flatMap((comment) => getSentences(composeUnwrappedProse(comment)));
}

/** What ends a sentence, where whitespace follows it. */
const SENTENCE_ENDS = ".:;!?";

function getSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  let index = 0;
  while (index < text.length) {
    if (!isWhitespaceAt(text, index) || !isOneOf(text[index - 1], SENTENCE_ENDS)) {
      index += 1;
      continue;
    }
    sentences.push(text.slice(start, index));
    index = getEndOfWhitespace(text, index);
    start = index;
  }
  sentences.push(text.slice(start));
  return sentences;
}

/**
 * Every ticked span replaced by a space.
 *
 * A figure inside backticks is a protocol value, a path, a section number or an
 * identifier — never a count of the material.
 */
function composeWithoutTicked(text: string): string {
  let kept = "";
  let index = 0;
  for (;;) {
    const opening = text.indexOf(TICK, index);
    if (opening === -1) return kept + text.slice(index);
    const closing = text.indexOf(TICK, opening + 1);
    if (closing === -1) return kept + text.slice(index);
    kept += `${text.slice(index, opening)} `;
    index = closing + 1;
  }
}

function getUndatedCounts(file: string): string[] {
  return getProseSentences(file).filter((sentence) => {
    if (!hasWholeMaterialScope(sentence)) return false;
    if (hasDatedReferent(sentence)) return false;
    // Stripping the ticked spans is what took this from noise to a guard:
    // `+oth_dmg=4439, ,Gracz 5(66.95%)` and `skillId=86` are examples of the
    // game's own writing, not measurements of ours.
    return hasDigitCount(composeWithoutTicked(sentence));
  });
}

const REGISTERS = getTrackedRegisters();
const FILES = [...getTrackedSourceFiles(), ...DOCUMENTS, ...REGISTERS];

describe("a measurement over the captured fights names its material", () => {
  // Either half going to zero turns the check below green without it checking
  // anything, which is what a walker that stopped walking looks like.
  test("there is prose to read, and it says something about the material", () => {
    expect(FILES.length).toBeGreaterThan(0);
    // The registers are found by a directory listing, so an empty one would take
    // the file this guard exists for back out of the walk without a word.
    expect(REGISTERS.length).toBeGreaterThan(0);
    const scoped = FILES.flatMap((file) =>
      getProseSentences(file).filter((sentence) => hasWholeMaterialScope(sentence)),
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
