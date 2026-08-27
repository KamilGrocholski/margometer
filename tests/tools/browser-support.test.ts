/**
 * `docs/browser-support.md` against the tree.
 *
 * The register answers "which browsers is this add-on usable in", and the answer
 * has exactly one property that makes it worth guarding: it is invalidated by
 * work that has nothing to do with it. `build.ts` bundles with `minify: false`
 * and no `target`, so a stylesheet gaining one property, or a module reaching
 * for one newer method, moves the floor under every player — and every test in
 * this repository stays green while it happens. Prose measured once and left
 * alone is the fault the last three audits kept filing.
 *
 * So the halves are split by what can hold them, and only one of the three is
 * here:
 *
 * - **JavaScript** is held by `tsconfig.userscript.json`, which typechecks
 *   `src/` and `libs/` at `lib: ["ES2022", "DOM"]` and `target: "ES2022"` — the
 *   first for library members, the second for syntax. A compiler is a better
 *   guard than a regex and needs no help from this file, with one exception the
 *   register states in its own words: the `target` check over pattern syntax is
 *   partial, and what it misses is held by nothing.
 * - **CSS** is held below, and it is the half that actually closes. The panel's
 *   stylesheet is one string, so what it spells is enumerable — every property,
 *   every `property: value` pair, every function, every selector — and each one
 *   must be classified in the register before the gate goes green.
 * - **The DOM** closes for neither, and the register says so in its own words.
 *   What is held here is the weaker claim: every construct the register names is
 *   still spelled by the file it names. A dead row is a lie in the same way a
 *   missing row is.
 *
 * ⚠️ **The enumeration is patterns, not a parser**, the same trade
 * `libs/source-regions.ts` documents. It reads the composed stylesheet rather
 * than the source that composes it, so the tokens interpolated into it are
 * present and a property hidden behind a conditional would not be.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { getNumberFromText } from "@/libs/number.ts";
import {
  getEndOfWhitespace,
  isEveryCharacterIn,
  isWordCharacterAt,
} from "@/libs/text-runs.ts";
import { getHeadingDepth, getTickedNames } from "@/tests/document-lines.ts";
import { getDeclarations, getStyleRules } from "@/tests/style-rules.ts";
import { composeSourceWithoutComments } from "@/libs/source-regions.ts";
import { composePanelStyleText } from "@/src/ui/panel-look.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;
const REGISTER_PATH = "docs/browser-support.md";
const REGISTER = readFileSync(REPOSITORY_ROOT + REGISTER_PATH, "utf8");

/** The engines the register claims on, in the order its tables print them. */
const ENGINES = ["chrome", "firefox", "safari"] as const;

/**
 * A heading, to the next heading of the same depth or shallower.
 *
 * `###` sections have to stop at the next `##` as well as at the next `###`,
 * which is why the search is for two-or-three hashes rather than for the same
 * string the section opened with.
 */
function getSection(heading: string): string {
  const start = REGISTER.indexOf(`${heading}\n`);
  if (start < 0) return "";
  const rest = REGISTER.slice(start + heading.length);
  return rest.slice(0, getNextSectionStart(rest));
}

/** Where the next `##` or `###` line begins, or the end of what was handed in. */
function getNextSectionStart(text: string): number {
  let at = 0;
  for (const line of text.split("\n")) {
    const depth = getHeadingDepth(line);
    if (at > 0 && depth !== null && depth >= 2 && depth <= 3) return at - 1;
    at += line.length + 1;
  }
  return text.length;
}

/** What a table row separates its cells with, and what its rule is drawn from. */
const CELL_SEPARATOR = "|";

const RULE_CHARACTERS = " \t:-";

function getTableRows(section: string): string[][] {
  const rows: string[][] = [];
  for (const line of section.split("\n")) {
    if (!line.startsWith(CELL_SEPARATOR)) continue;
    const cells = getTableCells(line);
    // The rule under the headings is punctuation rather than a row, and an empty
    // first cell is a row continued from the one above it.
    const written = cells.join("");
    if (written === "" || isEveryCharacterIn(written, RULE_CHARACTERS)) continue;
    if (cells[0] === "Construct" || cells[0] === "") continue;
    rows.push(cells);
  }
  return rows;
}

function getTableCells(line: string): string[] {
  const inside = line.slice(
    CELL_SEPARATOR.length,
    line.endsWith(CELL_SEPARATOR) ? line.length - CELL_SEPARATOR.length : line.length,
  );
  return inside.split(CELL_SEPARATOR).map((cell) => cell.trim());
}

/** What the register writes in code ticks, which is how it names a construct. */
function getNames(text: string): string[] {
  return getTickedNames(text);
}

/** A version cell as a number, or `null` where the register says `never`. */
function getVersion(cell: string): number | null {
  return getNumberFromText(cell);
}

const STYLE_TEXT = composeSourceWithoutComments(composePanelStyleText());

/**
 * What the stylesheet spells, in the four kinds the register classifies.
 *
 * Selectors are read from the text before a `{` rather than from the whole
 * sheet: `::?([\w-]+)` over everything answers with the value of any declaration
 * written without a space after its colon, which is a false finding nobody would
 * be able to act on.
 */
function getStyleSurface(): Record<"properties" | "pairs" | "functions" | "selectors", Set<string>> {
  const properties = new Set<string>();
  const pairs = new Set<string>();
  const functions = new Set<string>();
  const selectors = new Set<string>();
  for (const rule of getStyleRules(STYLE_TEXT)) {
    for (const name of getPseudoNames(rule.selector)) selectors.add(name);
    for (const declaration of getDeclarations(rule.body)) {
      const property = declaration.property;
      // A custom property is a name this repository chose, not a platform
      // construct with a version — `--MargoMeter-panel-top` is ours. What the
      // browser has to support is `var()` and custom properties as a feature,
      // which the register classifies once. The names themselves are held by
      // `tests/tools/source-layout.test.ts`, which requires the prefix (§9.6).
      if (property.startsWith("--")) continue;
      properties.add(property);
      for (const word of getValueWords(declaration.value)) pairs.add(`${property}: ${word}`);
    }
    for (const name of getCalledNames(rule.body)) functions.add(name);
  }
  return { properties, pairs, functions, selectors };
}

/**
 * A name, and how far it runs — a letter, then the characters a CSS name is
 * written with.
 */
const NAME_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

function isLetterAt(text: string, index: number): boolean {
  const character = text[index];
  if (character === undefined) return false;
  return (character >= "a" && character <= "z") || (character >= "A" && character <= "Z");
}

function getEndOfName(text: string, start: number): number {
  let end = start;
  while (end < text.length && NAME_CHARACTERS.includes(text[end] ?? "")) end += 1;
  return end;
}

/** Every pseudo-class and pseudo-element a selector names, one colon or two. */
function getPseudoNames(selector: string): string[] {
  const names: string[] = [];
  for (let index = 0; index < selector.length; index += 1) {
    if (selector[index] !== ":") continue;
    const start = selector[index + 1] === ":" ? index + 2 : index + 1;
    const end = getEndOfName(selector, start);
    if (end === start) continue;
    names.push(selector.slice(start, end));
    index = end - 1;
  }
  return names;
}

/**
 * The bare keywords in a value.
 *
 * What is deliberately not one: a name a bracket follows, which is a function
 * and is counted as one below; the tail of a hyphenated word or of a number,
 * because `12px` and `sans-serif` are one name each; and anything after a `#`,
 * which is a colour rather than a keyword.
 */
function getValueWords(value: string): string[] {
  const words: string[] = [];
  let index = 0;
  while (index < value.length) {
    const before = value[index - 1];
    if (!isLetterAt(value, index) || before === "(" || before === "#" || before === "-") {
      index += 1;
      continue;
    }
    if (isWordCharacterAt(value, index - 1)) {
      index += 1;
      continue;
    }
    const end = getEndOfName(value, index);
    if (value[end] !== "(") words.push(value.slice(index, end));
    index = end;
  }
  return words;
}

/** Every function a rule body calls, by the name in front of its bracket. */
function getCalledNames(body: string): string[] {
  const names: string[] = [];
  for (let index = 0; index < body.length; index += 1) {
    if (!isLetterAt(body, index)) continue;
    const end = getEndOfName(body, index);
    if (body[end] === "(") names.push(body.slice(index, end));
    index = end - 1;
  }
  return names;
}

const SURFACE = getStyleSurface();

/**
 * How many times the stylesheet declares one property.
 *
 * A count rather than a presence, because presence is what the defect below
 * slipped past: two rules spelled `user-select` and nothing spelled a prefix, and
 * a third rule spelling the bare property tomorrow would leave Safari out again
 * while a search for `-webkit-user-select` still found the other two.
 *
 * ⚠️ **The lookbehind is what stops the bare name counting its own fallback.**
 * `-webkit-user-select:` contains `user-select:`, so without it the two counts
 * are equal by construction and the check can never fail.
 */
function getDeclarationCount(property: string): number {
  let count = 0;
  for (let at = STYLE_TEXT.indexOf(property); at !== -1; at = STYLE_TEXT.indexOf(property, at + 1)) {
    if (STYLE_TEXT[at - 1] === "-" || isWordCharacterAt(STYLE_TEXT, at - 1)) continue;
    if (STYLE_TEXT[getEndOfWhitespace(STYLE_TEXT, at + property.length)] === ":") count += 1;
  }
  return count;
}

const CSS_FLOOR_ROWS = getTableRows(getSection("### What sets the floor"));
const PREFIXED_ROWS = getTableRows(getSection("### Prefixed"));
const DOM_ROWS = getTableRows(getSection("## The DOM"));
const JAVASCRIPT_ROWS = getTableRows(getSection("## JavaScript"));
const TIER_ROWS = getTableRows(getSection("## The floor"));
/**
 * The settled lists, and only the lists.
 *
 * ⚠️ **Read from the first label onwards, not from the whole section.** The
 * paragraph above them is prose, and prose here names things in code ticks like
 * prose everywhere else in this repository does — so harvesting the section
 * whole classified `composePanelStyleText()` as a CSS construct and then failed
 * for it not being one.
 */
const SETTLED = new Set(getNames(composeFromLabel(getSection("### Settled"), "\nProperties:")));

/** `text` from where `label` first stands, or the whole of it where it does not. */
function composeFromLabel(text: string, label: string): string {
  const at = text.indexOf(label);
  return at === -1 ? text : text.slice(at + 1);
}

/** Every construct the register classifies as CSS, however it classifies it. */
const CLASSIFIED = new Set([
  ...SETTLED,
  ...CSS_FLOOR_ROWS.map((cells) => getNames(cells[0]!)[0]!),
  ...PREFIXED_ROWS.map((cells) => getNames(cells[0]!)[0]!),
]);

describe("the register was read", () => {
  // Every list below is a filter over text, and a filter that matches nothing
  // reads exactly like a repository with nothing to report. These are the
  // tests that tell the two apart.
  test.each([
    ["the tier table", TIER_ROWS.length],
    ["the CSS floor table", CSS_FLOOR_ROWS.length],
    ["the prefixed table", PREFIXED_ROWS.length],
    ["the DOM table", DOM_ROWS.length],
    ["the JavaScript table", JAVASCRIPT_ROWS.length],
    ["the settled list", SETTLED.size],
  ])("%s has rows in it", (_what, count) => {
    expect(count).toBeGreaterThan(0);
  });

  test.each(["properties", "pairs", "functions", "selectors"] as const)(
    "the stylesheet spells %s",
    (kind) => {
      expect(SURFACE[kind].size).toBeGreaterThan(0);
    },
  );
});

describe("the CSS the panel spells is classified", () => {
  /**
   * The half that closes, and both directions matter for different reasons. An
   * unclassified construct is the floor moving without anybody deciding to move
   * it. A classified construct the stylesheet no longer spells is a register
   * describing a panel that no longer exists — which is worse than saying
   * nothing, because it reads as current.
   */
  test.each(["properties", "pairs", "functions", "selectors"] as const)(
    "every %s the stylesheet spells has an entry",
    (kind) => {
      const unclassified = [...SURFACE[kind]].filter((name) => !CLASSIFIED.has(name));
      expect(unclassified, REGISTER_PATH).toEqual([]);
    },
  );

  test("every entry is still spelled by the stylesheet", () => {
    const everything = new Set([
      ...SURFACE.properties,
      ...SURFACE.pairs,
      ...SURFACE.functions,
      ...SURFACE.selectors,
    ]);
    const stale = [...CLASSIFIED].filter((name) => !everything.has(name));
    expect(stale, REGISTER_PATH).toEqual([]);
  });
});

/**
 * What a `never` in a version cell is allowed to mean.
 *
 * It is the one cell whose value the arithmetic below cannot use: `getVersion`
 * reads it as no version and the tier maximum turns it into a `0`, which is
 * support nobody has. What makes such a row harmless is a prefixed spelling
 * beside every unprefixed one, and that is a claim about the stylesheet rather
 * than about the register — so it is checked against the stylesheet.
 *
 * This is the guard the `user-select` defect closed into
 * (`docs/browser-support.md`, `### Prefixed`): the register named the engine that
 * never had the property, the stylesheet spelled it twice with no fallback, and
 * every test here stayed green.
 */
describe("a construct an engine never had is spelled with a fallback", () => {
  /**
   * The property, not the construct: a pair row is `property: value`, and the
   * fallback question is about the property. The engine cells are the last three
   * of a row whether or not it carries a tier column.
   */
  const NEVER = [...CSS_FLOOR_ROWS, ...PREFIXED_ROWS]
    .map((cells) => ({
      property: getNames(cells[0]!)[0]!.split(":")[0]!.trim(),
      engines: cells.slice(-ENGINES.length),
    }))
    .filter(({ engines }) => engines.some((cell) => getVersion(cell) === null));

  test("there is a row saying never", () => {
    expect(NEVER.length).toBeGreaterThan(0);
  });

  test.each(NEVER)("$property is spelled beside a fallback, as often", ({ property }) => {
    const bare = getDeclarationCount(property);
    const found = [...SURFACE.properties].filter(
      (name) => name !== property && name.endsWith(`-${property}`),
    );
    expect(found, `nothing in the stylesheet falls back for ${property}`).not.toEqual([]);
    const counted = found.map((name) => `${name} x${getDeclarationCount(name)}`);
    expect(counted, REGISTER_PATH).toEqual(found.map((name) => `${name} x${bare}`));
  });
});

describe("the floor is what the tables add up to", () => {
  /**
   * The number a reader takes away is the one at the top, and it is the one
   * number in the document no row forces. Recomputing it here is what stops it
   * drifting from the table under it — the same shape as an audit whose findings
   * say `open` under a heading that says `closed`.
   *
   * `looks` is the maximum over **every** row rather than over the rows marked
   * `looks`: a browser that draws the panel as designed is also running it, so
   * the second tier can never sit below the first.
   *
   * ⚠️ **`### Prefixed` is deliberately not among the rows.** Those constructs
   * are two spellings of one thing and only the pair covers every engine; a
   * maximum over either row alone would be a floor nobody has to clear, and the
   * `?? 0` below would read the `never` cell as support. What holds them instead
   * is the fallback check above.
   */
  const RUNS = CSS_FLOOR_ROWS.filter((cells) => cells[1] === "runs").map((cells) => cells.slice(2));
  const LOOKS = CSS_FLOOR_ROWS.map((cells) => cells.slice(2));
  const OTHER = [...DOM_ROWS, ...JAVASCRIPT_ROWS].map((cells) => cells.slice(2));

  const TIERS = {
    "Runs correctly": [...RUNS, ...OTHER],
    "Looks as designed": [...LOOKS, ...OTHER],
  } as const;

  test.each(Object.keys(TIERS) as Array<keyof typeof TIERS>)(
    "the stated %s floor is the highest its rows require",
    (tier) => {
      const stated = TIER_ROWS.find((cells) => cells[0]!.includes(tier));
      expect(stated, tier).toBeDefined();
      const required = ENGINES.map((_engine, index) =>
        Math.max(...TIERS[tier].map((cells) => getVersion(cells[index]!) ?? 0)),
      );
      const claimed = ENGINES.map((_engine, index) => getVersion(stated![index + 1]!));
      expect(claimed, tier).toEqual(required);
    },
  );
});

describe("the register describes the tree it sits in", () => {
  /**
   * The DOM and JavaScript rows name a file, so the weaker claim is checkable:
   * whatever else is true, the construct is still there. Comments are stripped
   * for the reason every guard here strips them — the sentence explaining why a
   * construct is used outlives the construct, and a guard reading it stays green
   * over an empty file.
   */
  const NAMED = [...DOM_ROWS, ...JAVASCRIPT_ROWS].map((cells) => ({
    construct: getNames(cells[0]!)[0]!,
    file: getNames(cells[1]!)[0]!,
  }));

  test("there are rows naming a file", () => {
    expect(NAMED.length).toBeGreaterThan(0);
  });

  test.each(NAMED)("$file still spells $construct", ({ construct, file }) => {
    const source = composeSourceWithoutComments(readFileSync(REPOSITORY_ROOT + file, "utf8"));
    expect(source.includes(construct), `${file} no longer spells ${construct}`).toBe(true);
  });
});
