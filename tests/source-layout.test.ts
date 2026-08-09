import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const REPOSITORY_ROOT = new URL("../", import.meta.url).pathname;
const SOURCE_DIRECTORIES = ["src", "tools", "tests"];

function getTypeScriptFiles(directory: string): string[] {
  return readdirSync(REPOSITORY_ROOT + directory, { recursive: true, encoding: "utf8" })
    .filter((entry) => entry.endsWith(".ts"))
    .map((entry) => `${directory}/${entry}`);
}

const SOURCE_FILES = [...SOURCE_DIRECTORIES.flatMap(getTypeScriptFiles), "build.ts"];

/**
 * AGENTS.md §9.4. The canonical actions from the naming cheatsheet, plus the
 * ones this project adds because parsing is most of what it does. A verb that
 * is a synonym of one already here does not get added — two words for one
 * action means every reader has to check which one this codebase uses.
 */
const ACTION_VERBS = [
  "get",
  "set",
  "reset",
  "remove",
  "delete",
  "compose",
  "handle",
  "parse",
  "require",
  "build",
  "write",
  "render",
];
/** Booleans read as a statement rather than an action. */
const BOOLEAN_PREFIXES = ["is", "has", "should"];

// Discovered rather than listed, so a new directory cannot quietly opt out of
// the conventions below.
test("there are source files to check", () => {
  expect(SOURCE_FILES.length).toBeGreaterThan(0);
});

describe("import paths", () => {
  // AGENTS.md §9.3. A relative import reads differently depending on where it
  // sits, so you cannot tell what it points at without first working out where
  // you are — and moving a file rewrites its neighbours' imports.
  test.each(SOURCE_FILES)("%s imports from the repository root", (file) => {
    const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
    const specifiers = [...source.matchAll(/\bfrom\s+"([^"]+)"/g)].map((match) => match[1]!);
    const relative = specifiers.filter((specifier) => specifier.startsWith("."));
    expect(relative).toEqual([]);
  });
});

describe("file names", () => {
  // A file called `utils.ts` is a file nobody can predict the contents of.
  test.each(SOURCE_FILES)("%s is kebab-case and names its contents", (file) => {
    const basename = file.split("/").pop()!;
    expect(basename).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*(\.test)?\.ts$/);
    expect(["utils.ts", "helpers.ts", "misc.ts", "common.ts", "index.ts"]).not.toContain(basename);
  });
});

describe("function names", () => {
  const allowed = new RegExp(`^(${[...ACTION_VERBS, ...BOOLEAN_PREFIXES].join("|")})[A-Z]`);

  // A name without an action tells you what a function is about but not what
  // calling it does — whether it reads, writes or creates.
  test.each(SOURCE_FILES)("%s names functions by the action they perform", (file) => {
    const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
    const declared = [...source.matchAll(/\bfunction\s+([A-Za-z][A-Za-z0-9]*)\s*\(/g)].map(
      (match) => match[1]!,
    );
    const arrows = [...source.matchAll(/\bconst\s+([A-Za-z][A-Za-z0-9]*)\s*=\s*(?:async\s*)?\(/g)]
      .map((match) => match[1]!)
      // Arrow constants that are values, not functions, are caught by the same
      // pattern; SCREAMING_CASE names are never functions here.
      .filter((name) => name !== name.toUpperCase());

    for (const name of [...declared, ...arrows]) {
      expect(name, `${file}: ${name}`).toMatch(allowed);
    }
  });
});
