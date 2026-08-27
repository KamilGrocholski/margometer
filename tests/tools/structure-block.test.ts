/**
 * §8's structure block, held to the tree it claims to describe.
 *
 * §8 opens with "Update it in the same commit that changes the tree", and until
 * now nothing checked that it had been. The rule had already been broken twice:
 * the move at 42444ef left the block describing `tests/` as it used to be, and
 * `src/core/margometer-error.ts` had been sitting in the tree — tested, and named
 * in §9.5's table of the two error hierarchies — without ever appearing in the
 * block. The first run of this guard is what found the second one.
 *
 * `cited-paths.test.ts` cannot cover this, which is why there are two guards and
 * not one. §8 lists bare filenames indented into a tree — `panel-view.ts`, never
 * `src/ui/panel-view.ts` — and that guard's pattern requires a root directory, so
 * the whole block is invisible to it.
 *
 * **Extracted with structure, not with a search** (§7.5). A token grep over the
 * block picks up the block's own prose: descriptions name `check.yml` and
 * `dist/margometer.user.js`, and a wrapped description line begins `banner.`,
 * which any filename pattern is happy to match. Indentation is the only thing
 * separating an entry from a sentence about one, so indentation is what this
 * reads.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getPartsSeparatedByWhitespace } from "@/libs/text-runs.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

/**
 * Measured on the block as it stands: entries sit at indent 0, 2 and 4, and a
 * wrapped description at 25 or 29. Nothing lands between, so the threshold has
 * room on both sides rather than sitting against the data.
 */
const MAXIMUM_ENTRY_INDENT = 8;

const FILE_EXTENSIONS = [".ts", ".md", ".json", ".js", ".yml"];

/**
 * `.cache/` is in the block and absent from disk on purpose — §7.6 keeps fetched
 * game sources out of git, so it exists only on a machine that has fetched.
 */
const ABSENT_BY_DESIGN = ".cache/";

type StructureEntry = { name: string; indent: number; path: string };

function getStructureBlockText(): string {
  const afterHeading = readFileSync(REPOSITORY_ROOT + "AGENTS.md", "utf8").split(
    "## 8. Structure",
  )[1];
  return afterHeading === undefined ? "" : (afterHeading.split("```")[1] ?? "");
}

/**
 * Indentation is the directory stack: a name ending in `/` becomes the parent of
 * everything indented under it, which is what turns `protocol-message.ts` into
 * `src/core/protocol-message.ts`.
 *
 * Two shapes in the block defeat a simpler reading, and both are load-bearing:
 * the `⚠️` notes are prose wrapped at the same indent as an entry, so they are
 * skipped to their blank line; and some lines carry several filenames at once
 * (`assert.test.ts  json.test.ts  …`). Hence the split — the first token of an
 * entry line is always a name, and a later one only when it carries an
 * extension. That is what keeps `Version, scripts.` out while letting
 * `timestamp.test.ts` in.
 */
function parseStructureBlock(block: string): StructureEntry[] {
  const entries: StructureEntry[] = [];
  const directoryStack: string[] = [];
  let isInsideNote = false;

  for (const line of block.split("\n")) {
    if (line.trim() === "") {
      isInsideNote = false;
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent > MAXIMUM_ENTRY_INDENT) continue;
    if (line.trimStart().startsWith("⚠")) {
      isInsideNote = true;
      continue;
    }
    if (isInsideNote) continue;

    const [first, ...rest] = getPartsSeparatedByWhitespace(line);
    const names = [
      first ?? "",
      ...rest.filter((token) => FILE_EXTENSIONS.some((extension) => token.endsWith(extension))),
    ];
    for (const name of names) {
      directoryStack.length = indent / 2;
      entries.push({ name, indent, path: directoryStack.join("") + name });
      if (name.endsWith("/")) directoryStack[indent / 2] = name;
    }
  }
  return entries;
}

const ENTRIES = parseStructureBlock(getStructureBlockText());

/**
 * `git ls-files` rather than a directory walk, because "tracked" is exactly what
 * §8 describes: a file git does not know about is not part of the tree the block
 * is claiming to reflect, and `dist/` and `.cache/` fall out for free.
 *
 * `tests/` is deliberately not asked for. §8 summarises it on purpose — several
 * tests share one line and others are described only in prose — so demanding an
 * entry per file would be holding the block to a shape it never claimed.
 */
function getTrackedSourceFiles(): string[] {
  return execFileSync("git", ["ls-files", "--", "libs", "src", "tools"], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => file.endsWith(".ts"));
}

const TRACKED_SOURCE_FILES = getTrackedSourceFiles();

/**
 * The root, which the walk above skips because it asks for three directories by
 * name.
 *
 * Asked for separately rather than by widening that call, because the root is
 * the one place the block enumerates file by file with no summarising: every
 * root file has its own entry and its own sentence, so demanding one per file is
 * holding the block to a shape it does claim. `bun.lock` had been tracked
 * without an entry for the life of this tree, and it is the file §6.1's rule
 * about the gate turns on
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F7).
 */
function getTrackedRootFiles(): string[] {
  return execFileSync("git", ["ls-files"], { cwd: REPOSITORY_ROOT, encoding: "utf8" })
    .split("\n")
    .filter((file) => file !== "" && !file.includes("/"));
}

const TRACKED_ROOT_FILES = getTrackedRootFiles();

describe("§8's structure block against the tree", () => {
  /**
   * Both counted, and the lesson is `cited-paths.test.ts`'s: with its walker
   * mutated to return nothing, two of its three tests stayed green. A parser
   * that silently matches nothing reads exactly like a block with nothing wrong
   * in it.
   */
  test("the block was found, and the tree was read", () => {
    expect(ENTRIES.length).toBeGreaterThan(0);
    expect(TRACKED_SOURCE_FILES.length).toBeGreaterThan(0);
    expect(TRACKED_ROOT_FILES.length).toBeGreaterThan(0);
  });

  test("every name it lists exists", () => {
    const missing = ENTRIES.filter(
      (entry) => entry.path !== ABSENT_BY_DESIGN && !existsSync(REPOSITORY_ROOT + entry.path),
    ).map((entry) => entry.path);
    expect(missing).toEqual([]);
  });

  /**
   * The direction that catches the failure §8 exists to prevent — a file added
   * and the block left describing the tree before it. Matched on the filename
   * rather than the resolved path, because the block is what states where a file
   * sits, and holding it to its own claim about the directory would fail twice
   * for one mistake.
   */
  test("every tracked source file appears in it", () => {
    const listed = new Set(ENTRIES.map((entry) => entry.name));
    const absent = TRACKED_SOURCE_FILES.filter((file) => !listed.has(file.split("/").pop() ?? ""));
    expect(absent).toEqual([]);
  });

  test("every tracked file at the root appears in it", () => {
    const listed = new Set(ENTRIES.map((entry) => entry.name));
    expect(TRACKED_ROOT_FILES.filter((file) => !listed.has(file))).toEqual([]);
  });
});
