/**
 * Every name this repository exports is named by some test.
 *
 * **Not a percentage — a name.** That is the shape all three audits asked the
 * question in, and it is the shape a machine can answer: coverage as a fraction
 * says a file is 80% read and cannot say *which* export nothing has ever called.
 *
 * ⚠️ **Three audits, three counts, and the class never closed.** The first closed
 * by removing one `export`; the second found one that could not lose its export
 * because `noUnusedLocals` would then refuse the file, and named three more
 * "recorded without findings of their own"; the third measured rather than
 * sampled and got eleven, plus a module written to close the second audit's
 * duplication finding that no test executed at all
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F10 and F11).
 * Twice was where §7.7 says the question becomes how many there are; this is the
 * answer being kept at zero instead of re-measured a fourth time.
 *
 * **What it is not.** Naming an export is not testing it — a test that imports a
 * function and never asserts on its answer passes here. What this catches is the
 * weaker and more common thing: an export nothing under `tests/` has ever
 * mentioned, which is a surface nobody has looked at and, often, one nobody
 * needed. Half of what it found the round it was written lost its `export`
 * rather than gaining a test.
 *
 * Types are left out. A type has no runtime behaviour to exercise, `tsc` already
 * refuses one nobody can satisfy, and requiring every exported type to be named
 * would be a rule about import style rather than about what is checked.
 */

import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getEndOfWordCharacters, getWordOccurrences } from "@/libs/text-runs.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

/** A runtime export: something a test could call, hold or compare. */
const EXPORTED_KINDS = ["const ", "function ", "async function ", "class "];

const EXPORT_OPENING = "export ";

/**
 * The name an `export` line declares, or null where the line declares no value.
 *
 * A type is deliberately not one of the kinds: `tsc` already refuses a type
 * nobody can satisfy, and a rule about naming one would be a rule about import
 * style rather than about what is checked.
 */
function getExportedName(line: string): string | null {
  if (!line.startsWith(EXPORT_OPENING)) return null;
  const declared = line.slice(EXPORT_OPENING.length);
  const kind = EXPORTED_KINDS.find((one) => declared.startsWith(one));
  if (kind === undefined) return null;
  const name = declared.slice(kind.length, getEndOfWordCharacters(declared, kind.length));
  return name === "" ? null : name;
}

/**
 * ⚠️ **The tree, not the index.** `git ls-files` cannot see a file that has not
 * been added yet, so a guard walking it is blind to the very test somebody is
 * writing — and blind to itself for the whole of the commit that introduces it.
 * That was paid for one round earlier, on
 * `tests/tools/measured-material.test.ts`, which went in green and came out red
 * one commit later.
 */
function getSourceFiles(...roots: string[]): string[] {
  return roots.flatMap((root) =>
    root.endsWith(".ts")
      ? [root]
      : readdirSync(REPOSITORY_ROOT + root, { recursive: true, encoding: "utf8" })
          .filter((entry) => entry.endsWith(".ts"))
          .map((entry) => `${root}/${entry}`),
  );
}

const SOURCE_FILES = getSourceFiles("libs", "src", "tools", "build.ts");
const TEST_FILES = getSourceFiles("tests");

/** Every test file's text at once: what matters is that *something* names it. */
const EVERYTHING_TESTS_SAY = TEST_FILES.map((file) =>
  readFileSync(REPOSITORY_ROOT + file, "utf8"),
).join("\n");

function getExportedValues(file: string): string[] {
  return readFileSync(REPOSITORY_ROOT + file, "utf8")
    .split("\n")
    .flatMap((line) => getExportedName(line) ?? []);
}

describe("every exported value is named by a test", () => {
  // Both counted, for `cited-paths.test.ts`'s reason: a walk that stopped
  // finding files reads exactly like a repository with nothing wrong in it, and
  // this check goes green the moment either side is empty.
  test("there are exports to look for, and tests to look in", () => {
    expect(SOURCE_FILES.flatMap(getExportedValues).length).toBeGreaterThan(0);
    expect(TEST_FILES.length).toBeGreaterThan(0);
  });

  test("none of them is named nowhere", () => {
    const unnamed = SOURCE_FILES.flatMap((file) =>
      getExportedValues(file)
        .filter((name) => getWordOccurrences(EVERYTHING_TESTS_SAY, name).length === 0)
        .map((name) => `${file}: ${name}`),
    );
    expect(unnamed).toEqual([]);
  });
});
