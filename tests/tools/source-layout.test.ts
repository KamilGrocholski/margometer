import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import {
  composeSourceWithBlankedComments,
  composeSourceWithoutComments,
  getCommentRangesFromSource,
  getTextRangesFromSource,
} from "@/libs/source-regions.ts";
import { CAPTURED_FIGHTS, getMessagesOfFight } from "@/tests/captured-fight-catalog.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;
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
 * The patterns themselves moved to `libs/source-regions.ts` when
 * `tools/mutation-sweep.ts` became their second consumer (§7.1): it wants the
 * spans rather than the stripped text, and two spellings of "where the comments
 * are" is exactly the drift §7.5 keeps paying for.
 */
function getSourceWithoutComments(file: string): string {
  return composeSourceWithoutComments(readFileSync(REPOSITORY_ROOT + file, "utf8"));
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
        ...source.matchAll(
          /\b(document|window|localStorage|sessionStorage|setTimeout|setInterval)\b/g,
        ),
      ].map((match) => match[1]);
      expect(reachingOut, file).toEqual([]);
    },
  );

  /**
   * §9.1 lists the directions that exist — `ui → core`, `game → core`, everything
   * → `libs`, entry point → everything — and `ui → game` is not one of them.
   *
   * ⚠️ **Arrived by being broken, and by a type import.** `panel-view.ts` took
   * `FightReading` from `src/game/battle-session.ts`; nothing failed, because a
   * type import compiles away. What it cost was the direction: the panel could no
   * longer be read, tested or reused without the engine module in the graph, and
   * the guard above covered `core` only, so the gate stayed green over it.
   *
   * ⚠️ **The entry point is on this list too, and was not.** The guard below it
   * closes `game → the entry point` and says why — it is the file allowed to know
   * every layer, so nothing may know it back — while this one forbade only
   * `ui → game`, leaving the same cycle open on the other side
   * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F10).
   * `src/userscript-version.ts` is deliberately not forbidden: §9.1 names it as
   * readable from any layer, and the panel draws it in the title bar.
   */
  test.each(SOURCE_FILES.filter((file) => file.startsWith("src/ui/")))(
    "%s draws what core produced, without reaching for the game or the wiring",
    (file) => {
      const source = getSourceWithoutComments(file);
      const reachingOut = [
        ...source.matchAll(/\bfrom\s+"@\/src\/(game\/|userscript-entry\.ts)/g),
      ].map((match) => match[0]);
      expect(reachingOut, file).toEqual([]);
    },
  );

  /**
   * §9.1 from the last side that had no guard at all. `game → ui` is not one of
   * the directions listed, and `game → entry point` would close the only cycle
   * the graph could have — the entry point is the file allowed to know every
   * layer, so nothing may know it back.
   *
   * Neither exists today; this exists because the guard above it records that a
   * **type import** broke a direction in silence once already, and nothing here
   * was watching this side.
   */
  test.each(SOURCE_FILES.filter((file) => file.startsWith("src/game/")))(
    "%s reads the game for core, without reaching for the panel or the wiring",
    (file) => {
      const source = getSourceWithoutComments(file);
      const reachingOut = [
        ...source.matchAll(/\bfrom\s+"@\/src\/(ui\/|userscript-entry\.ts)/g),
      ].map((match) => match[0]);
      expect(reachingOut, file).toEqual([]);
    },
  );

  /**
   * §9.1's last direction, and the only one that had no guard at all.
   *
   * ⚠️ **The rule it holds was false the day it was written.** It first read
   * "nothing in `tests/` reads a tool for its material", added to close an audit
   * finding about an undrawn edge — while `tests/captured-fight-catalog.ts` had
   * been reading `tools/fight-dump-parser.ts` for exactly that all along. Nothing
   * went red, because this side of the graph was the one side no test looked at
   * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F9).
   *
   * What the rule now says is what the tree does, and the split is subject
   * against answer. `tests/tools/` is where the tools are tested, so it names
   * whichever one it is about. Everywhere else, two files are readable and no
   * others: the reader of the captured material, so that the live path and the
   * offline path cannot disagree about what a capture says, and the tool error
   * base, which is named as a subject when the two hierarchies are proved
   * disjoint.
   */
  const TOOLS_A_TEST_MAY_READ = [
    "@/tools/fight-dump-parser.ts",
    "@/tools/margometer-tool-error.ts",
  ];

  test.each(
    SOURCE_FILES.filter(
      (file) => file.startsWith("tests/") && !file.startsWith("tests/tools/"),
    ),
  )("%s reads a tool for the material or not at all", (file) => {
    const source = getSourceWithoutComments(file);
    const reachingOut = [...source.matchAll(/\bfrom\s+"(@\/tools\/[^"]+)"/g)]
      .map((match) => match[1] ?? "")
      .filter((specifier) => !TOOLS_A_TEST_MAY_READ.includes(specifier));
    expect(reachingOut, file).toEqual([]);
  });
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
  const RECORD = "libs/record.ts";
  const TEXT_ORDER = "libs/text-order.ts";

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
    // The write side, and it belongs here for the same reason the read side
    // does: `JSON.stringify` answers `undefined` — the value, not the text —
    // for `undefined`, a function or a symbol, while its return type says
    // `string`. Three call sites had made three different decisions about that
    // and none of them said so (F16).
    { pattern: /\bJSON\.stringify\s*\(/g, owner: JSON_TEXT },
    { pattern: /\bDate\.parse\s*\(/g, owner: TIMESTAMP },
    // A radix, not `.toString()` alone: writing a number in another base has the
    // same way of answering with something nobody wrote as reading one does —
    // `(-1).toString(16)` is `"-1"` — and it was the one conversion in `src/`
    // that `libs/` did not own, under the contrast arithmetic §9.7 makes a floor.
    { pattern: /\.toString\s*\(\s*\d+\s*\)/g, owner: NUMBER },
    // `localeCompare` with no locale reads the runtime's default, so the order
    // it gives belongs to the machine rather than to the data — and two tools
    // sorted their output with it (F21). The owner splits the deterministic
    // question from the one a person reads, and requires the locale.
    { pattern: /\.localeCompare\s*\(/g, owner: TEXT_ORDER },
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
    { pattern: /\bString\s*\(/g, owner: NUMBER },
    { pattern: /[=(,[:]\s*\+[A-Za-z_$"'(]/g, owner: NUMBER },
    { pattern: /\*\s*1\b/g, owner: NUMBER },
    { pattern: /typeof\s+[\w.[\]"']+\s*===?\s*"number"/g, owner: NUMBER },
    // `typeof x === "object"` is true for `null`, so every site pairs it with a
    // null check by hand — thirteen of them across ten files, of which eight
    // admitted an array as a record and five refused one. Two answers to one
    // question, and no file saying which it meant.
    { pattern: /typeof\s+[\w.[\]"']+\s*[!=]==?\s*"object"/g, owner: RECORD },
  ];

  /**
   * ⚠️ **Both lists, and `libs/record.ts` is why.** This iterated
   * `OWNED_CONSTRUCTS` alone, which has no row for the record narrowing — that
   * construct lives in `UNNAMED_COERCIONS` below. So the one owner this test was
   * written for could have stopped doing its `null` check and every file here,
   * `record.ts` included, would still have passed: the guard agreeing with the
   * bug it exists to prevent, in the shape §7.5 keeps paying for
   * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F12).
   */
  const EVERY_OWNED_CONSTRUCT = [...OWNED_CONSTRUCTS, ...UNNAMED_COERCIONS];

  test.each([...new Set(EVERY_OWNED_CONSTRUCT.map(({ owner }) => owner))])(
    "%s still spells what it owns",
    (owner) => {
      const source = getSourceWithoutComments(owner);
      const spelled = EVERY_OWNED_CONSTRUCT.filter(
        (construct) => construct.owner === owner,
      ).flatMap(({ pattern }) => [...source.matchAll(pattern)].map((match) => match[0]));
      expect(spelled.length, owner).toBeGreaterThan(0);
    },
  );


  test.each(SOURCE_FILES.filter((file) => NON_TEST_DIRECTORIES.some((d) => file.startsWith(d))))(
    "%s asks the primitives instead of coercing by hand",
    (file) => {
      if (file === NUMBER || file === RECORD) return;
      const source = getSourceWithoutComments(file);
      const coerced = UNNAMED_COERCIONS.flatMap(({ pattern }) =>
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
      // `[\s\S]` and a bounded span rather than `.`: the pattern used to stop at
      // the end of the line, so a cast written one line below its parse was
      // invisible to it. Bounded because an unbounded reach would join a parse
      // at the top of a file to an unrelated `as` at the bottom.
      const asserted = [...source.matchAll(/JSON\.parse\b[\s\S]{0,200}?\bas\b.*/g)].map(
        (match) => match[0],
      );
      expect(asserted, file).toEqual([]);
    },
  );
});

describe("fetched game sources", () => {
  // AGENTS.md §7.6. The game client is someone else's copyrighted work; we may
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

/**
 * AGENTS.md §9.7's first line: **a raw hex in a rule is a bug.**
 *
 * It was prose only, and `src/ui/panel-stylesheet.ts` broke it in the docblock
 * that states it — pure black in a hatch mask and a shadow colour, neither a
 * token, beside a sentence reading "everything it draws with is a token"
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F25). The contrast half
 * of §9.7 has been measured since the first UI file landed; this is the half
 * nothing was watching.
 *
 * ⚠️ **Colours only, and that is a boundary rather than an oversight.** §9.7
 * names spacing and radii too, and those are named where two rules share one —
 * but a font size, a badge's width and a hatch's pitch are one rule each, and a
 * guard demanding a token per number would be a guard demanding a token nobody
 * reads twice. A colour has no such case: it either belongs to the palette that
 * was validated for contrast, or it is a value nobody checked.
 */
describe("the colours", () => {
  const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;

  /** Where a colour is decided, and the only place one may be written down. */
  const PALETTE = "src/ui/panel-tokens.ts";

  const DRAWING = SOURCE_FILES.filter(
    (file) => file.startsWith("src/ui/") && file !== PALETTE,
  );

  test("there are files that draw", () => {
    expect(DRAWING.length).toBeGreaterThan(0);
  });

  test.each(DRAWING)("%s draws with tokens rather than with colours", (file) => {
    const source = getSourceWithoutComments(file);
    const written = [...source.matchAll(COLOUR_LITERAL)].map((match) => match[0]);
    expect(written, file).toEqual([]);
  });

  // The other direction, for the reason the Polish list gives: a guard that only
  // forbids passes perfectly once the palette is empty.
  test("and the palette still holds some", () => {
    const source = getSourceWithoutComments(PALETTE);
    expect([...source.matchAll(COLOUR_LITERAL)].length).toBeGreaterThan(0);
  });
});

/**
 * A docblock describes the declaration under it, and nothing else can be under
 * it.
 *
 * ⚠️ **Two `/** *\/` blocks back to back is an orphan**, and the first one is the
 * orphan: whatever it describes, the reader will attach it to the declaration the
 * second block already claims. Five of them were found in shipped source by one
 * audit; the commit that closed a *different* finding of the next audit created
 * another, in `tests/captured-fight-catalog.ts`, where a full docblock for
 * `CAPTURED_FIGHTS` sat above `getMessagesOfFight`'s own and the constant it
 * described was declared 25 lines later
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F6).
 *
 * That is why this is a guard and not a third careful reading: the last round
 * proved by example that reading is not enough, and this is the one shape of the
 * fault a machine can see without knowing what any of the prose means.
 */
describe("a docblock and the declaration under it", () => {
  /**
   * ⚠️ **A file's own docblock is the exception, and the only one.** Several
   * modules open with one and follow it immediately with the first declaration's;
   * that block describes the module, so nothing is orphaned. It is told apart by
   * where it starts and not by what it says: the module's block is the first
   * thing in the file, and any other block back-to-back with the next one has
   * lost whatever it was written above.
   */
  function getOrphanedDocblocks(file: string): string[] {
    const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
    const docblocks = getCommentRangesFromSource(source).filter((range) =>
      source.slice(range.start, range.start + 3) === "/**",
    );
    // Blanked rather than removed, so an offset still means what it did. Most
    // modules here put their own docblock *after* the imports, so "first thing in
    // the file" has to mean "nothing but imports has happened yet".
    const blanked = composeSourceWithBlankedComments(source);
    const isModuleBlock = (at: number): boolean =>
      blanked.slice(0, at).replace(/import[\s\S]*?;/g, "").trim() === "";

    return docblocks.flatMap((range, index) => {
      const next = docblocks[index + 1];
      if (next === undefined) return [];
      if (source.slice(range.end, next.start).trim() !== "") return [];
      if (isModuleBlock(range.start)) return [];
      return [`${file}:${source.slice(0, range.start).split("\n").length}`];
    });
  }

  test("there are docblocks to check", () => {
    const blocks = SOURCE_FILES.flatMap((file) =>
      getCommentRangesFromSource(readFileSync(REPOSITORY_ROOT + file, "utf8")),
    );
    expect(blocks.length).toBeGreaterThan(0);
  });

  test("no docblock is followed by another with nothing in between", () => {
    expect(SOURCE_FILES.flatMap(getOrphanedDocblocks)).toEqual([]);
  });
});

/**
 * AGENTS.md §3. Which files speak Polish, and it is a short list on purpose.
 *
 * §3 admits exactly one kind of exception in shipped code — **the text a player
 * reads** — and everything around it stays English. That was prose until
 * `docs/audits/2026-08-13-the-whole-tree-read-once.md` (F10) checked it: §8's
 * structure block claimed two files carried Polish strings and four did, because
 * nothing re-measured the sentence beside a filename.
 *
 * ⚠️ **Frozen as a list rather than a rule, and the list is the point.** No
 * pattern can tell a label a player reads from a Polish identifier that slipped
 * in, so what a machine can hold is *which files are allowed to*. A further one
 * appearing is a decision somebody should have to make on purpose.
 *
 * ⚠️ **Paid for again: a Polish phrase can carry no diacritic.**
 * `src/userscript-version.ts` has shipped `"z drzewa"` to the title bar since the
 * version was substituted at build time, and this guard could not see it — the
 * detector below looks for a letter that phrase does not contain. So the count
 * was wrong in four documents while the guard that exists to re-measure it stayed
 * green (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F4). An entry may
 * now carry the phrase that makes it Polish, and where it does, the phrase is
 * what gets re-measured instead of the letter.
 */
describe("the language of the strings", () => {
  const POLISH_LETTER = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

  /**
   * `panel-view.ts` and `panel-element.ts` are the panel's own words — its rows,
   * its tooltips, its region names. `panel-names.ts` is what the add-on calls a
   * thing the running client has no name for: a phrase of ours, written by us,
   * never a quotation of the game's (`NOTICE.md`). `userscript-version.ts` says
   * what a build nobody made is called, in the title bar beside the number.
   *
   * `src/userscript-entry.ts` was one of these until F11 of the first audit turned
   * the copied report's keys into the aggregate's own names, and
   * `src/game/game-dictionary.ts` is deliberately absent — its Polish is a
   * quotation inside a comment, which the stripper above removes and which no
   * player ever reads.
   *
   * ⚠️ **`tools/changelog.ts` is the fifth, and it was invisible for the same
   * reason F4 of the last audit found a fourth.** The walk below read `src/` and
   * `libs/` only, so six lines of Polish a player reads on every release sat
   * outside it — and two sentences in §8 stayed true on a technicality nobody had
   * written down, one calling `CHANGELOG.md` the only *document* here in Polish
   * and one calling the panel trio plus the version file the files that *ship*
   * Polish. This file is neither a document nor shipped in the userscript, and
   * "neither" is not a reason to be unwatched
   * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F4).
   */
  const SPEAKS_POLISH: Array<{ file: string; phrase?: string }> = [
    { file: "src/ui/panel-element.ts" },
    { file: "src/ui/panel-names.ts" },
    { file: "src/ui/panel-view.ts" },
    { file: "src/userscript-version.ts", phrase: '"z drzewa"' },
    { file: "tools/changelog.ts" },
    /**
     * A sixth, found by widening the walk and not by the audit that asked for
     * it. Its Polish is neither a player's nor ours: it is the marker the
     * **previous incarnation's** tooling wrote where a description came out, and
     * it sits in a capture this repository still holds. Recognising only today's
     * spelling would make the tool remove that marker as though it were prose
     * from the game — rewriting evidence to match a newer convention, which §9.2
     * forbids. The string is admitted because deleting it would be the fault.
     */
    { file: "tools/captured-fight-intake.ts" },
  ];

  function getPolishStrings(file: string): string[] {
    const source = getSourceWithoutComments(file);
    return getTextRangesFromSource(source)
      .map((range) => source.slice(range.start, range.end))
      .filter((text) => POLISH_LETTER.test(text));
  }

  /**
   * Everything that reaches a person, which is not the same as everything that
   * ships in the bundle: a release's notes are read by every player who installs
   * an update, and they are composed in `tools/`.
   */
  const SHIPPED = SOURCE_FILES.filter((file) =>
    NON_TEST_DIRECTORIES.some((directory) => file.startsWith(directory)),
  );

  test("there are shipped files to read", () => {
    expect(SHIPPED.length).toBeGreaterThan(0);
  });

  // Both directions, for `cited-paths.test.ts`'s reason: a list that only forbids
  // catches nothing when the reader stops finding anything at all.
  test("only the files allowed to speak Polish do", () => {
    const listed = SPEAKS_POLISH.map((entry) => entry.file);
    const speaking = SHIPPED.filter((file) => getPolishStrings(file).length > 0);
    expect(speaking.filter((file) => !listed.includes(file))).toEqual([]);
  });

  test("and each of them still does", () => {
    for (const { file, phrase } of SPEAKS_POLISH) {
      if (phrase === undefined) {
        expect(getPolishStrings(file).length, file).toBeGreaterThan(0);
        continue;
      }
      // Nothing to detect — the phrase carries no letter this reader knows, which
      // is the whole reason the entry names it. Changing what the panel says here
      // is one line of a diff and has to be meant.
      expect(getSourceWithoutComments(file), file).toContain(phrase);
    }
  });

  /**
   * §5's other half, and the one nothing here could see: the game's own
   * **sentences**, quoted rather than shipped.
   *
   * Three of them were written out verbatim in four files — twice in a docblock
   * arguing why a sentence with its figure cut out is not a label, once above
   * `DEFENCE_NAMES`, and four times as test data, one a whole sentence with its
   * full stop. A fifth site in `docs/specs/` carried two of them again and no
   * audit had found it. `NOTICE.md` promises a reader the game's prose is absent
   * here in any form, which is checkable in thirty seconds with `grep`
   * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F1).
   *
   * The guard above cannot reach any of it. It reads **shipped strings** with
   * the comments stripped, and every occurrence was a comment or a test.
   *
   * **What is recognisable.** A dictionary entry is prose with the client's own
   * template holes in it. Those holes are functional tokens of the same kind as a
   * protocol key, so quoting one beside the identifier that composes it is a
   * citation this repository makes everywhere and must keep making. What is a
   * quotation is a hole with **the game's words around it**, and the detector for
   * "the game's words" is the one already sitting above this test.
   *
   * ⚠️ **It misses an entry whose Polish carries no diacritic**, which is the
   * same weakness `SPEAKS_POLISH` was amended for and it is not fixable here: two
   * of the nine spans removed in the round that wrote this had none, and a reader
   * took them out by hand. It also cannot see a dictionary *name*, which is a
   * bare word indistinguishable from one of ours. That half stays §5's to enforce;
   * this holds the half that recurs, because a hole is what makes an entry worth
   * quoting in an argument about holes.
   */
  const CLIENT_HOLE = /%[a-z][a-z0-9_]*%/i;
  /**
   * No single-quoted form on purpose: an apostrophe in prose opens one and
   * swallows the paragraph after it, which turned four files into false hits the
   * first time this was run. This repository quotes with double quotes and
   * backticks.
   */
  const QUOTED_SPAN = /`[^`\n]*`|"[^"\n]*"/g;

  /** Documents included: a spec is where two of these had been sitting unread. */
  const QUOTING_FILES = [
    ...SOURCE_FILES,
    ...execFileSync("git", ["ls-files", "docs"], { cwd: REPOSITORY_ROOT, encoding: "utf8" })
      .split("\n")
      .filter((file) => file.endsWith(".md")),
    "AGENTS.md",
    "NOTICE.md",
    "README.md",
    "CHANGELOG.md",
  ];

  function getQuotedEntries(file: string): string[] {
    const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
    // Wrapped first: a comment or a paragraph puts one quotation on two lines,
    // and a line-at-a-time reader saw neither half whole.
    const flat = source.replace(/\n\s*\*?\s?/g, " ");
    return [...flat.matchAll(QUOTED_SPAN)]
      .map((match) => match[0])
      .filter((span) => CLIENT_HOLE.test(span) && POLISH_LETTER.test(span));
  }

  test("there are files to read, and the client's holes are quoted in them", () => {
    expect(QUOTING_FILES.length).toBeGreaterThan(0);
    const quoting = QUOTING_FILES.filter((file) =>
      CLIENT_HOLE.test(readFileSync(REPOSITORY_ROOT + file, "utf8")),
    );
    expect(quoting.length).toBeGreaterThan(0);
  });

  test("no entry of the client's dictionary is quoted, hole and words together", () => {
    const quoted = QUOTING_FILES.flatMap((file) =>
      getQuotedEntries(file).map((span) => `${file}: ${span.slice(0, 80)}`),
    );
    expect(quoted).toEqual([]);
  });

  /**
   * And the game's own names for its abilities, which `NOTICE.md` promises
   * appear nowhere here but the recordings.
   *
   * That promise was false in five files, and the audit that raised it found two
   * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F2). One of
   * the three it missed is the sharpest: `tests/ui/panel-view.test.ts` is driven
   * by a hand-written fight rather than by the captures **because** the drill
   * names skills and those are the game's prose — and its hand-written fight
   * announced one of the game's own abilities.
   *
   * ⚠️ **The list comes from the material, never from a hand-written one.** A
   * denylist somebody types is a denylist that falls behind the next recording,
   * which is §9.2's rule for the captures pointed at prose: read the directory,
   * do not name the files. Every `tspell=` value the captures carry is a name the
   * operator wrote, so the captures are the list.
   *
   * Short names are left out. A name of four letters or fewer is as likely to be
   * an ordinary Polish word the panel legitimately uses, and the four files
   * allowed to speak Polish would start failing on their own vocabulary — which
   * is the false positive that gets a guard turned off.
   */
  const SHORTEST_ABILITY_NAME = 5;

  const ABILITY_NAMES = [
    ...new Set(
      CAPTURED_FIGHTS.flatMap((fight) =>
        getMessagesOfFight(fight).flatMap((message) =>
          message
            .split(";")
            .filter((segment) => segment.startsWith("tspell="))
            .map((segment) => segment.slice("tspell=".length)),
        ),
      ),
    ),
  ].filter((name) => name.length >= SHORTEST_ABILITY_NAME);

  test("the captures carry ability names to look for", () => {
    expect(ABILITY_NAMES.length).toBeGreaterThan(0);
  });

  test("no name the game gave an ability is written down outside the recordings", () => {
    const written = QUOTING_FILES.flatMap((file) => {
      const source = readFileSync(REPOSITORY_ROOT + file, "utf8");
      return ABILITY_NAMES.filter((name) => source.includes(name)).map(
        (name) => `${file}: ${name}`,
      );
    });
    expect(written).toEqual([]);
  });
});
