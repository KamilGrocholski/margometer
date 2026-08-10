import { execFileSync } from "node:child_process";
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
 * Source with its comments removed, because every guard below is a text search
 * and a comment is the one place a banned construct legitimately appears.
 *
 * Found the moment the first such guard landed: a comment explaining *why*
 * `Number()` is banned tripped the ban. Rewording the comment would have made
 * the trap permanent — the rules would be unexplainable in the files they bind.
 *
 * `//` is only treated as a comment at the start of a line or after whitespace,
 * so `https://…` inside a string survives.
 */
function getSourceWithoutComments(file: string): string {
  return readFileSync(REPOSITORY_ROOT + file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

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
    const source = getSourceWithoutComments(file);
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
      const source = getSourceWithoutComments(file);
      const reachingUp = [...source.matchAll(/\bfrom\s+"@\/(src|tools|tests)\//g)].map(
        (match) => match[0],
      );
      expect(reachingUp).toEqual([]);
    },
  );

  /**
   * AGENTS.md §9.1, and §7.1's rule about when a guard is allowed to exist: the
   * layering rule lands with the **second** layer, not the first. `src/game/` is
   * that second layer, so this arrives now rather than as scaffolding earlier.
   *
   * `core` is what makes the decoder and the aggregate testable without a
   * browser and without the game. One import of `game/` ends that quietly — the
   * tests keep passing until the day someone runs them somewhere there is no
   * `window`.
   */
  test.each(SOURCE_FILES.filter((file) => file.startsWith("src/core/")))(
    "%s keeps core independent of the game and the panel",
    (file) => {
      const source = getSourceWithoutComments(file);
      const reachingOut = [...source.matchAll(/\bfrom\s+"@\/src\/(game|ui)\//g)].map(
        (match) => match[0],
      );
      expect(reachingOut, file).toEqual([]);
    },
  );

  // §9.1 again, from the other side: contact with the game client lives in
  // `game/` so there is one place to audit and one place to break.
  test.each(SOURCE_FILES.filter((file) => file.startsWith("src/core/")))(
    "%s reaches for nothing the browser owns",
    (file) => {
      const source = getSourceWithoutComments(file);
      const reachingOut = [
        ...source.matchAll(/\b(document|localStorage|sessionStorage|setTimeout|setInterval)\b/g),
      ].map((match) => match[1]);
      expect(reachingOut, file).toEqual([]);
    },
  );
});

/**
 * AGENTS.md §5, the promise the add-on is judged on.
 *
 * "This is checkable in the source and people do check it" — so it is checked
 * here too, rather than left as a sentence in a readme. It binds everything that
 * ships, which is `src/`; the tooling downloads the client bundle and the help,
 * and is not part of the userscript.
 */
describe("the promise not to talk to the network", () => {
  test.each(SOURCE_FILES.filter((file) => file.startsWith("src/")))(
    "%s sends nothing anywhere",
    (file) => {
      const source = getSourceWithoutComments(file);
      const sending = [
        ...source.matchAll(/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\b/g),
      ].map((match) => match[1]);
      expect(sending, file).toEqual([]);
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
      const source = getSourceWithoutComments(file);
      const nonNull = [...source.matchAll(/[\w\]"')]!(?=[.,;)\s]|$)/gm)]
        .map((match) => match[0])
        .filter((match) => !match.startsWith("!"));
      expect(nonNull, file).toEqual([]);
    },
  );
});

describe("value parsing", () => {
  /**
   * AGENTS.md §9.5. Each of these has more than one spelling in JavaScript and a
   * way of answering with a value nobody wrote — `Number("")` is `0`,
   * `parseInt("12abc")` is `12`, `Date.parse("nope")` is `NaN`, `JSON.parse`
   * throws and hands back `any`. One file owns each, so there is one place to
   * read when the question is "what exactly does this accept".
   *
   * Every file is held to this, tests included: a test that reads a value its
   * own way is a test proving something other than what ships.
   */
  const NUMBER = "libs/number.ts";
  const JSON_TEXT = "libs/json.ts";
  const TIMESTAMP = "libs/timestamp.ts";

  const OWNED_CONSTRUCTS = [
    // `\bNumber\s*\(` and not `Number` alone: `Number.isInteger` and its
    // neighbours are checks, and banning the namespace would ban the checks too.
    { pattern: /\bNumber\s*\(/g, owner: NUMBER },
    // The `\b` also catches `Number.parseInt`, which is the same function.
    { pattern: /\bparseInt\s*\(/g, owner: NUMBER },
    { pattern: /\bparseFloat\s*\(/g, owner: NUMBER },
    { pattern: /\bBigInt\s*\(/g, owner: NUMBER },
    { pattern: /\.toFixed\s*\(/g, owner: NUMBER },
    { pattern: /\bJSON\.parse\s*\(/g, owner: JSON_TEXT },
    { pattern: /\bDate\.parse\s*\(/g, owner: TIMESTAMP },
  ];

  test.each(SOURCE_FILES)("%s reads values through the primitives", (file) => {
    const source = getSourceWithoutComments(file);
    const trespassing = OWNED_CONSTRUCTS.filter(({ owner }) => owner !== file).flatMap(
      ({ pattern }) => [...source.matchAll(pattern)].map((match) => match[0]),
    );
    expect(trespassing, file).toEqual([]);
  });

  // Without this the guard above could be satisfied by a primitive that quietly
  // stopped doing the thing it owns — every file would pass, and nothing would
  // be reading values at all. One match is enough per owner: which of its
  // constructs it needs is the primitive's business, not this file's.
  //
  // Comments stripped here too, and that is not symmetry for its own sake: the
  // first version read the file raw and stayed green while every real call in
  // `libs/number.ts` was mangled, because the docblock explaining `parseInt(`
  // still mentioned it.
  test.each([...new Set(OWNED_CONSTRUCTS.map(({ owner }) => owner))])(
    "%s still spells what it owns",
    (owner) => {
      const source = getSourceWithoutComments(owner);
      const spelled = OWNED_CONSTRUCTS.filter((construct) => construct.owner === owner).flatMap(
        ({ pattern }) => [...source.matchAll(pattern)].map((match) => match[0]),
      );
      expect(spelled.length, owner).toBeGreaterThan(0);
    },
  );

  /**
   * The coercions with no name to search for. Held to `libs/`, `src/` and
   * `tools/` only: `String(error)` in a test is not a number being read, and no
   * regex can tell the two apart.
   *
   * The unary `+` pattern is deliberately narrow — it catches `= +text` and
   * `(+text` and misses `a + b`. A guard that cried wolf on every addition would
   * be turned off within a week, and a missed spelling is cheaper than that.
   */
  const UNNAMED_COERCIONS = [
    /\bString\s*\(/g,
    /[=(,[:]\s*\+[A-Za-z_$"'(]/g,
    /\*\s*1\b/g,
    /typeof\s+[\w.[\]"']+\s*===?\s*"number"/g,
  ];

  test.each(SOURCE_FILES.filter((file) => NON_TEST_DIRECTORIES.some((d) => file.startsWith(d))))(
    "%s asks the primitives instead of coercing by hand",
    (file) => {
      if (file === NUMBER) return;
      const source = getSourceWithoutComments(file);
      const coerced = UNNAMED_COERCIONS.flatMap((pattern) =>
        [...source.matchAll(pattern)].map((match) => match[0]),
      );
      expect(coerced, file).toEqual([]);
    },
  );

  // A cast straight off `JSON.parse` is external data wearing a type. Nothing
  // was checked; the first field that is missing surfaces as `undefined` a layer
  // later, where what produced it is no longer visible.
  test.each(SOURCE_FILES.filter((file) => NON_TEST_DIRECTORIES.some((d) => file.startsWith(d))))(
    "%s validates parsed JSON instead of asserting its type",
    (file) => {
      const source = getSourceWithoutComments(file);
      const asserted = [...source.matchAll(/JSON\.parse\b.*\bas\b.*/g)].map((match) => match[0]);
      expect(asserted, file).toEqual([]);
    },
  );
});

describe("fetched game sources", () => {
  // AGENTS.md §7.5. The game client is someone else's copyrighted work; we may
  // read it locally to understand the protocol, and it may never be published.
  const CACHE_DIRECTORY = ".cache/";

  test("the cache directory is ignored by git", () => {
    const ignored = readFileSync(`${REPOSITORY_ROOT}.gitignore`, "utf8")
      .split("\n")
      .map((line) => line.trim());
    expect(ignored).toContain(CACHE_DIRECTORY);
  });

  // This is the one that matters. `.gitignore` does nothing for a file already
  // tracked, or added with `-f`, and "we ignore that directory" is exactly the
  // sentence someone would believe instead of checking.
  test("no fetched source is tracked in git", () => {
    const tracked = execFileSync("git", ["ls-files", "--", CACHE_DIRECTORY], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .filter((line) => line !== "");
    expect(tracked).toEqual([]);
  });
});

describe("interruption", () => {
  // AGENTS.md §9.6. The panel is drawn over a game someone is actually playing.
  // There is no failure in a damage meter worth a click from someone mid-fight,
  // so the blocking dialogs are banned outright rather than discouraged.
  test.each(SOURCE_FILES.filter((file) => NON_TEST_DIRECTORIES.some((d) => file.startsWith(d))))(
    "%s never blocks the page with a dialog",
    (file) => {
      const source = getSourceWithoutComments(file);
      const blocking = [...source.matchAll(/\b(?:window\.)?(alert|confirm|prompt)\s*\(/g)].map(
        (match) => match[1],
      );
      expect(blocking, file).toEqual([]);
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
    const source = getSourceWithoutComments(file);
    expect([...source.matchAll(/\bnew Error\s*\(/g)].length, file).toBe(0);
  });

  test.each(SOURCE_FILES)("%s declares no error class outside the two bases", (file) => {
    if (BASE_FILES.includes(file)) return;
    const source = getSourceWithoutComments(file);
    expect([...source.matchAll(/\bextends\s+Error\b/g)].length, file).toBe(0);
  });

  // Two hierarchies, one per world: the add-on runs inside the game's page, the
  // tooling runs in a terminal. Nothing should catch one thinking it caught the
  // other, so the side a file sits on decides which base it may extend.
  test.each(SOURCE_FILES)("%s extends the base belonging to its side", (file) => {
    if (BASE_FILES.includes(file)) return;
    const source = getSourceWithoutComments(file);
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
    const source = getSourceWithoutComments(file);
    const declared = [...source.matchAll(/\bfunction\s+([A-Za-z][A-Za-z0-9]*)\s*\(/g)].map(
      (match) => match[1]!,
    );
    // The `=>` is required: without it `const x = (a ?? b) as T` reads as a
    // parameter list and the guard fires on a plain value.
    const arrows = [
      ...source.matchAll(/\bconst\s+([A-Za-z][A-Za-z0-9]*)\s*=\s*(?:async\s*)?\([^)]*\)[^=;\n]*=>/g),
    ].map((match) => match[1]!);

    for (const name of [...declared, ...arrows]) {
      expect(name, `${file}: ${name}`).toMatch(allowed);
    }
  });
});
