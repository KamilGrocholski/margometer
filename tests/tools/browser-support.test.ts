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
 *   `src/` and `libs/` at `lib: ["ES2022", "DOM"]`. A compiler is a better guard
 *   than a regex and needs no help from this file.
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
import { composeSourceWithoutComments } from "@/libs/source-regions.ts";
import { composePanelStyleText } from "@/src/ui/panel-stylesheet.ts";

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
  const end = rest.search(/\n#{2,3} /);
  return end < 0 ? rest : rest.slice(0, end);
}

/** Data rows of every table in a section: the header and the rule are dropped. */
function getTableRows(section: string): string[][] {
  return section
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) =>
      line
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !/^[\s:-]*$/.test(cells.join("")))
    .filter((cells) => cells[0] !== "Construct" && cells[0] !== "");
}

/** What the register writes in code ticks, which is how it names a construct. */
function getNames(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]!);
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
  for (const rule of STYLE_TEXT.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    for (const found of rule[1]!.matchAll(/::?([\w-]+)/g)) selectors.add(found[1]!);
    for (const declaration of rule[2]!.matchAll(/(?:^|;)\s*([\w-]+)\s*:([^;]*)/g)) {
      const property = declaration[1]!;
      // A custom property is a name this repository chose, not a platform
      // construct with a version — `--MargoMeter-panel-top` is ours. What the
      // browser has to support is `var()` and custom properties as a feature,
      // which the register classifies once. The names themselves are held by
      // `tests/tools/source-layout.test.ts`, which requires the prefix (§9.6).
      if (property.startsWith("--")) continue;
      properties.add(property);
      for (const word of declaration[2]!.matchAll(/(?<![\w(#-])([a-zA-Z][\w-]*)(?![\w(-])/g)) {
        pairs.add(`${property}: ${word[1]!}`);
      }
    }
    for (const found of rule[2]!.matchAll(/([a-zA-Z][\w-]*)\(/g)) functions.add(found[1]!);
  }
  return { properties, pairs, functions, selectors };
}

const SURFACE = getStyleSurface();

const CSS_FLOOR_ROWS = getTableRows(getSection("### What sets the floor"));
const FINDING_ROWS = getTableRows(getSection("### A finding"));
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
const SETTLED = new Set(
  getNames(getSection("### Settled").replace(/^[\s\S]*?\nProperties:/, "Properties:")),
);

/** Every construct the register classifies as CSS, however it classifies it. */
const CLASSIFIED = new Set([
  ...SETTLED,
  ...CSS_FLOOR_ROWS.map((cells) => getNames(cells[0]!)[0]!),
  ...FINDING_ROWS.map((cells) => getNames(cells[0]!)[0]!),
]);

describe("the register was read", () => {
  // Every list below is a filter over text, and a filter that matches nothing
  // reads exactly like a repository with nothing to report. These are the
  // tests that tell the two apart.
  test.each([
    ["the tier table", TIER_ROWS.length],
    ["the CSS floor table", CSS_FLOOR_ROWS.length],
    ["the finding table", FINDING_ROWS.length],
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
