/**
 * Every repository path this repository cites in its own text has to exist.
 *
 * The rule arrived by being broken. Moving the tests into `tests/core/` and
 * `tests/tools/` left citations pointing at the old layout — measured by running
 * this guard against that commit: 13 distinct dead paths across five files, 22
 * occurrences in all, in `docs/protocol-keys.md`, in §7.6 and §9 of `AGENTS.md`,
 * in the doc comment of `src/core/battle-event.ts` and in two tests that had just
 * been moved themselves. Nothing noticed for two commits. Every one of them read
 * as a promise that some named file re-earns a claim, and every one of them was a
 * promise nobody could follow.
 *
 * A stale citation is worse than no citation: "held by `x`" is the sentence that
 * stops a reader checking whether anything holds it at all. That makes this the
 * first choice of the three places a round can put what it learns (AGENTS.md
 * §7.5) — a machine can check it, so a machine does.
 *
 * Source comments count. `src/core/battle-event.ts` carried two of the seventeen,
 * and a comment pointing at a file that is not there misleads exactly as far as a
 * document does.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import {
  getEndOfDigits,
  isWhitespaceAt,
  isWordCharacterAt,
  isWordStart,
} from "@/libs/text-runs.ts";
import { getHeadingDepth } from "@/tests/document-lines.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

/**
 * Directories a citation may point into: everything the repository tracks and
 * writes by hand.
 *
 * `dist/` is deliberately absent — `bun run check` runs the tests before the
 * build, so on a fresh checkout the bundle does not exist yet and a guard over
 * it would fail for a reason that has nothing to do with the citation. `.cache/`
 * likewise: it is outside git by copyright requirement (§7.6), so it is empty on
 * any machine that has not fetched.
 */
const AUTHORED_ROOTS = ["libs", "src", "tools", "tests", "docs"];


/**
 * A path in prose or in a comment. Deliberately not limited to backticked spans:
 * a citation written without them misleads just as far, and requiring the
 * backticks would make the guard depend on how carefully the stale line was
 * typed.
 *
 * An extension is required, which is what keeps directory mentions like
 * `tests/captured-fights/` and `docs/specs/` out — those name a place, and the
 * place is what §8's structure block already describes.
 *
 * ⚠️ **`html` joined the list the day something was cited with it**, and it
 * arrived one comment too late: `docs/design/panel.html` was admitted to the
 * repository on the stated condition that a spec name it and this guard hold
 * the name — and the pattern did not know the extension, so for one commit the
 * condition was prose. A list of extensions is a list of what can go stale
 * without anybody hearing about it.
 */
const CITED_EXTENSIONS = [".ts", ".md", ".json", ".js", ".yml", ".html"];

/** What a path is written with, and nothing a sentence around it carries. */
const PATH_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._/-";

/**
 * Every path with an extension, from the longest run of path characters after
 * each root.
 *
 * The longest is what settles a name carrying an extension inside another one —
 * a backup or an archive written after the suffix. The run is read to its end
 * and the citation is the **last** extension in it that no word continues from,
 * which is what a greedy pattern backing off the end of its match answered.
 *
 * ⚠️ Written without an example, deliberately: a path spelled in this file is a
 * citation like any other, and the guard below would ask whether the example
 * exists.
 */
function getCitedPaths(text: string): string[] {
  const cited: string[] = [];
  let index = 0;
  while (index < text.length) {
    const root = getRootAt(text, index);
    if (root === null) {
      index += 1;
      continue;
    }
    const end = getEndOfRun(text, index, PATH_CHARACTERS);
    const cut = getLastExtensionEnd(text, index, end);
    if (cut === null) {
      index += 1;
      continue;
    }
    cited.push(text.slice(index, cut));
    index = cut;
  }
  return cited;
}

/**
 * Which root is written at `index`, if one is.
 *
 * ⚠️ **A citation is read once and the reader moves past it.** One root sits
 * inside another's path — the tooling's guards live under the tests — so a walk
 * that started afresh at every root would read the inner one as a second
 * citation, of a file nothing has under that name.
 */
function getRootAt(text: string, index: number): string | null {
  if (!isWordStart(text, index)) return null;
  return AUTHORED_ROOTS.find((root) => text.startsWith(`${root}/`, index)) ?? null;
}

function getLastExtensionEnd(text: string, start: number, end: number): number | null {
  for (let cut = end; cut > start; cut -= 1) {
    if (isWordCharacterAt(text, cut)) continue;
    const run = text.slice(start, cut);
    if (CITED_EXTENSIONS.some((extension) => run.endsWith(extension))) return cut;
  }
  return null;
}

function getEndOfRun(text: string, start: number, characters: string): number {
  let end = start;
  while (end < text.length && characters.includes(text[end] ?? "")) end += 1;
  return end;
}

/** What a directory segment is written with — a path's characters, less the slash. */
const SEGMENT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-";

/**
 * A directory named in prose or in a comment, which the reader above cannot see:
 * the root itself, and as many complete segments after it as are written.
 *
 * A segment counts only where the slash closing it is there — `src/ui/panel` is
 * a citation of `src/ui/`, because a tail with no slash after it is a file's
 * name or an ordinary word, and neither is a place.
 *
 * ⚠️ **Its absence was paid for.** `README.md` told every reader that the material
 * carried over from the previous incarnation lives in a `tests/fixtures`
 * directory — written here without its slash, because with one this comment would
 * be a dead citation itself. The directory is `tests/captured-fights/` and has
 * been for the whole life of this tree. The guard above requires the extension —
 * "the place is what §8's structure block already describes" — but §8's block
 * covers `libs/`, `src/` and `tools/`, so nothing described that one, and nothing
 * noticed.
 *
 * A directory citation misleads exactly as far as a file citation: it sends
 * somebody to a place that is not there, and the reader who cannot find it does
 * not conclude the document is wrong.
 */
function getCitedDirectories(text: string): string[] {
  const cited: string[] = [];
  let index = 0;
  while (index < text.length) {
    const root = getRootAt(text, index);
    if (root === null) {
      index += 1;
      continue;
    }
    let end = index + root.length + 1;
    for (;;) {
      const segment = getEndOfRun(text, end, SEGMENT_CHARACTERS);
      if (segment === end || text[segment] !== "/") break;
      end = segment + 1;
    }
    cited.push(text.slice(index, end));
    index = end;
  }
  return cited;
}

/**
 * What the walk reads, which is a different list from the one above and goes
 * stale in the opposite direction.
 *
 * ⚠️ **The list above says what may be cited; this one says what gets read**, and
 * a file outside it is a file whose citations nobody follows. The walk was five
 * directories plus `*.md` at the repository root, so every tracked file that
 * cites and is not Markdown sat outside it. Measured at `a8b8204`, three did:
 * `build.ts` (§7.1 twice, §9.6, eight paths), `tsconfig.userscript.json` (§9.3,
 * §6.1, four paths) and `.github/workflows/release.yml` (§7.5, three paths) —
 * the bundler, the floor the shipped file asks of a browser, and the pipeline
 * that cuts a release. Every one of them still resolved, so nothing was broken;
 * what was missing was anyone who would notice when one stopped.
 *
 * The listing is `git ls-files`, as in `tests/tools/measured-material.test.ts`.
 * That is what retires the list of directories to skip: `node_modules/`,
 * `.cache/` and `dist/` are outside git, so they are absent by the same fact
 * that makes them absent from a fresh checkout, rather than by being remembered.
 */
const READ_EXTENSIONS = [".ts", ".md", ".json", ".yml"];

/**
 * Two files the listing reaches and this guard must not read, each for its own
 * reason.
 *
 * `TODO.md` is a scope rather than a hole: it is the maintainer's hand-kept list
 * and no tool may write to it (§5), so a task naming a file that does not exist
 * yet — which is what a to-do list is made of — would be a red gate whose only
 * remedy is an edit nobody here is allowed to make.
 *
 * `tests/captured-fights/` is raw protocol, not prose (§9.2): a path-shaped run
 * of characters inside a recording is the game's own writing, and editing a
 * capture to satisfy a guard is the one thing that directory forbids outright.
 * It stayed out by accident while the walk took only `.ts` and `.md`, and says
 * so here now that the walk takes `.json`.
 *
 * Both are left out for the reason `tests/tools/tracked-text.test.ts` leaves the
 * images out.
 */
function isReadable(file: string): boolean {
  if (file === "TODO.md") return false;
  if (file.startsWith("tests/captured-fights/")) return false;
  return READ_EXTENSIONS.some((extension) => file.endsWith(extension));
}

function getAuthoredFiles(): string[] {
  return execFileSync("git", ["ls-files"], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter(isReadable);
}

const AUTHORED_FILES = getAuthoredFiles();

const FILES_BY_ROOT = new Map(
  AUTHORED_ROOTS.map((root) => [
    root,
    AUTHORED_FILES.filter((file) => file.startsWith(`${root}/`)),
  ]),
);

type Citation = { path: string; citedIn: string };

const SCHEMES = ["https://", "http://"];

const HOST_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";

/**
 * Every web address blanked, because an address is not a path into this
 * repository however much it looks like one.
 *
 * Found immediately: a comment citing an MDN article, whose address carries a
 * `docs` segment of its own with `Mozilla` under it, read as a citation of a
 * directory here that has never existed. What identifies an address is the full
 * stop in its host — which no directory in this repository has — followed by a
 * slash; everything up to the next whitespace belongs to it. The scheme is taken
 * with the address where one is written, and is optional because a comment often
 * drops it.
 */
function composeWithoutWebAddresses(text: string): string {
  let kept = "";
  let index = 0;
  while (index < text.length) {
    const end = getEndOfWebAddress(text, index);
    if (end === null) {
      kept += text[index];
      index += 1;
      continue;
    }
    kept += " ";
    index = end;
  }
  return kept;
}

function getEndOfWebAddress(text: string, start: number): number | null {
  if (!isWordStart(text, start)) return null;
  const scheme = SCHEMES.find((one) => text.startsWith(one, start));
  let index = start + (scheme?.length ?? 0);

  let stops = 0;
  for (;;) {
    const run = getEndOfRun(text, index, HOST_CHARACTERS);
    if (run === index) return null;
    index = run;
    if (text[index] !== ".") break;
    stops += 1;
    index += 1;
  }
  if (stops === 0 || text[index] !== "/") return null;
  return getEndOfAddressTail(text, index);
}

function getEndOfAddressTail(text: string, start: number): number {
  let index = start;
  while (index < text.length && !isWhitespaceAt(text, index)) index += 1;
  return index;
}

function getCitationsOf(getPaths: (text: string) => string[]): Citation[] {
  return AUTHORED_FILES.flatMap((file) =>
    getPaths(composeWithoutWebAddresses(readFileSync(REPOSITORY_ROOT + file, "utf8")))
      // A glob names a set, and a set is not somewhere `existsSync` can look.
      // `tests/captured-fights/*.json` is the only one, and §9.2 is where it is
      // held to being read by discovery rather than by name.
      .filter((path) => !path.includes("*"))
      .map((path) => ({ path, citedIn: file })),
  );
}

const CITATIONS: Citation[] = getCitationsOf(getCitedPaths);
const DIRECTORY_CITATIONS: Citation[] = getCitationsOf(getCitedDirectories);

describe("paths the repository cites in its own text", () => {
  // Both counted, because either one going to zero turns the check below green
  // without it checking anything — a walker that stopped finding files reads
  // exactly like a repository with nothing wrong in it.
  test("there are documents to read, and citations in them", () => {
    expect(AUTHORED_FILES.length).toBeGreaterThan(0);
    expect(CITATIONS.length).toBeGreaterThan(0);
  });

  /**
   * Per root, because the count above is not enough on its own: the four
   * documents at the repository root carry citations by themselves, so the whole
   * walk over `src/`, `tests/` and the rest can stop working while the total
   * stays comfortably above zero. Measured — that is not hypothetical, it is
   * what the mutation that broke the walker actually did.
   *
   * It doubles as the check §2 asks for. A root here that no longer exists is
   * the first sign the rules have drifted from the tree, and this fails on it
   * rather than quietly reading one directory fewer.
   */
  test.each(AUTHORED_ROOTS)("`%s/` is a directory the walk actually reaches", (root) => {
    expect(FILES_BY_ROOT.get(root)?.length ?? 0).toBeGreaterThan(0);
  });

  test("every one of them names a file that exists", () => {
    const missing = CITATIONS.filter(
      (citation) => !existsSync(REPOSITORY_ROOT + citation.path),
    ).map((citation) => `${citation.citedIn} cites ${citation.path}`);
    expect([...new Set(missing)].sort()).toEqual([]);
  });

  test("and every directory named is a directory that is there", () => {
    expect(DIRECTORY_CITATIONS.length).toBeGreaterThan(CITATIONS.length);
    const missing = DIRECTORY_CITATIONS.filter(
      (citation) => !existsSync(REPOSITORY_ROOT + citation.path),
    ).map((citation) => `${citation.citedIn} cites ${citation.path}`);
    expect([...new Set(missing)].sort()).toEqual([]);
  });
});

/**
 * The number a heading of the rules opens with — `## 9`, `### 9.6`, and the
 * trailing full stop some of them carry.
 *
 * Depth two to four, because that is where the rules number themselves: the
 * title above and anything deeper are prose with a number in them at most.
 */
function getNumberedHeadings(rules: string): string[] {
  const numbered: string[] = [];
  for (const line of rules.split("\n")) {
    const depth = getHeadingDepth(line);
    if (depth === null || depth < 2 || depth > 4) continue;
    const stated = getSectionNumberAt(line, depth + 1);
    if (stated === null) continue;
    const after = line[depth + 1 + stated.length];
    if (after === " " || (after === "." && line[depth + 2 + stated.length] === " ")) {
      numbered.push(stated);
    }
  }
  return numbered;
}

/** Every `§9.6` written anywhere, as the number alone. */
function getCitedSections(text: string): string[] {
  const cited: string[] = [];
  for (let at = text.indexOf(SECTION_MARK); at !== -1; at = text.indexOf(SECTION_MARK, at + 1)) {
    const stated = getSectionNumberAt(text, at + SECTION_MARK.length);
    if (stated !== null) cited.push(stated);
  }
  return cited;
}

const SECTION_MARK = "§";

/**
 * A section number at `start`: digits, and one group of digits after a full stop
 * where there is one. A second full stop ends it — `§9.6.1` is read as `9.6`,
 * which is what the pattern this replaces answered and what keeps a sentence's
 * own full stop out of the number.
 */
function getSectionNumberAt(text: string, start: number): string | null {
  const chapter = getEndOfDigits(text, start);
  if (chapter === start) return null;
  if (text[chapter] !== ".") return text.slice(start, chapter);
  const part = getEndOfDigits(text, chapter + 1);
  return text.slice(start, part === chapter + 1 ? chapter : part);
}

/**
 * Every section of the rules this repository cites is a section it has.
 *
 * What this catches is renumbering: §9.6 becoming §9.7 orphans every `§9.6` in
 * the tree at once, and there are dozens. What it cannot catch is a citation
 * pointing at a section that exists and says something else — three of those were
 * in the tree when this was written, all reading §7.5 where §7.6 was meant. That
 * is a judgment call, so it is a rule and a fix rather than a guard, and this is
 * only the half a machine can hold.
 */
describe("sections of the rules the repository cites", () => {
  const RULES = readFileSync(REPOSITORY_ROOT + "AGENTS.md", "utf8");
  const SECTIONS = new Set(getNumberedHeadings(RULES));
  const CITED = [...new Set(getCitedSections(RULES))];

  const CITED_ELSEWHERE = AUTHORED_FILES.flatMap((file) =>
    getCitedSections(readFileSync(REPOSITORY_ROOT + file, "utf8")).map((section) => ({
      section,
      citedIn: file,
    })),
  );

  test("the rules have numbered sections, and cite their own", () => {
    expect(SECTIONS.size).toBeGreaterThan(10);
    expect(CITED.length).toBeGreaterThan(10);
  });

  test("every section cited anywhere exists", () => {
    const dangling = CITED_ELSEWHERE.filter(({ section }) => !SECTIONS.has(section)).map(
      ({ section, citedIn }) => `${citedIn} cites §${section}`,
    );
    expect([...new Set(dangling)].sort()).toEqual([]);
  });
});
