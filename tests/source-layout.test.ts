import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const REPOSITORY_ROOT = new URL("../", import.meta.url).pathname;
const SOURCE_DIRECTORIES = ["libs", "src", "tools", "tests"];
/** Everything that ships or supports shipping. Tests are held to looser rules. */
const NON_TEST_DIRECTORIES = ["libs/", "src/", "tools/"];

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
  "decode",
  "assert",
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

describe("layers", () => {
  // AGENTS.md §9.1. `libs/` is the bottom: things true in any project. The
  // moment it reaches upwards it stops being shared code and becomes a second
  // core, which is how a shared directory turns into a junk drawer.
  test.each(SOURCE_FILES.filter((file) => file.startsWith("libs/")))(
    "%s depends on nothing above it",
    (file) => {
      const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
      const reachingUp = [...source.matchAll(/\bfrom\s+"@\/(src|tools|tests)\//g)].map(
        (match) => match[0],
      );
      expect(reachingUp).toEqual([]);
    },
  );
});

describe("assumptions", () => {
  // AGENTS.md §9.5. `!` is an assumption that says nothing when it turns out
  // wrong: `undefined` travels on and surfaces as a bad number a layer later,
  // where the cause is no longer visible. `assertDefined` says it out loud.
  test.each(SOURCE_FILES.filter((file) => NON_TEST_DIRECTORIES.some((d) => file.startsWith(d))))(
    "%s states its assumptions instead of asserting non-null",
    (file) => {
      const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
      const nonNull = [...source.matchAll(/[\w\]"')]!(?=[.,;)\s]|$)/gm)]
        .map((match) => match[0])
        .filter((match) => !match.startsWith("!"));
      expect(nonNull, file).toEqual([]);
    },
  );
});

describe("errors", () => {
  // AGENTS.md §9.5. The add-on shares a console with the game and with other
  // add-ons; an error that does not say whose it is costs whoever reports it.
  const BASE_FILES = [
    "libs/assert.ts",
    "src/core/margometer-error.ts",
    "tools/margometer-tool-error.ts",
  ];
  const ADD_ON_BASE = "MargoMeterError";
  const TOOLING_BASE = "MargoMeterToolError";

  test.each(SOURCE_FILES)("%s throws no unbranded error", (file) => {
    const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
    expect([...source.matchAll(/\bnew Error\s*\(/g)].length, file).toBe(0);
  });

  test.each(SOURCE_FILES)("%s declares no error class outside the two bases", (file) => {
    if (BASE_FILES.includes(file)) return;
    const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
    expect([...source.matchAll(/\bextends\s+Error\b/g)].length, file).toBe(0);
  });

  // Two hierarchies, one per world: the add-on runs inside the game's page, the
  // tooling runs in a terminal. Nothing should catch one thinking it caught the
  // other, so the side a file sits on decides which base it may extend.
  test.each(SOURCE_FILES)("%s extends the base belonging to its side", (file) => {
    if (BASE_FILES.includes(file)) return;
    const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
    const bases = [...source.matchAll(/\bextends\s+(MargoMeter\w*Error)\b/g)].map((m) => m[1]!);
    const expected = file.startsWith("src/") ? ADD_ON_BASE : TOOLING_BASE;
    for (const base of bases) expect(base, file).toBe(expected);
  });
});

describe("function names", () => {
  // The verb may be the whole name — `assert(condition)` needs no noun after it.
  const allowed = new RegExp(`^(${[...ACTION_VERBS, ...BOOLEAN_PREFIXES].join("|")})([A-Z]|$)`);

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
