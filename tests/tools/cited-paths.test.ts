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

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";

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

const UNREADABLE_DIRECTORIES = ["node_modules", ".git", ".cache", "dist"];

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
const CITATION = new RegExp(
  String.raw`\b(${AUTHORED_ROOTS.join("|")})/[A-Za-z0-9._/-]*\.(ts|md|json|js|yml|html)\b`,
  "g",
);

/**
 * A directory named in prose or in a comment, which the pattern above cannot see.
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
const DIRECTORY_CITATION = new RegExp(
  String.raw`\b(${AUTHORED_ROOTS.join("|")})/(?:[A-Za-z0-9._-]+/)*`,
  "g",
);

function getAuthoredFiles(directory: string): string[] {
  const entries = readdirSync(REPOSITORY_ROOT + directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      return UNREADABLE_DIRECTORIES.includes(entry.name) ? [] : getAuthoredFiles(path);
    }
    return /\.(ts|md)$/.test(entry.name) ? [path] : [];
  });
}

const FILES_BY_ROOT = new Map(AUTHORED_ROOTS.map((root) => [root, getAuthoredFiles(root)]));

const AUTHORED_FILES = [
  ...[...FILES_BY_ROOT.values()].flat(),
  // The documents at the root are where the rules themselves live, so they are
  // where a stale citation costs the most. Counted by the line below rather than
  // stated here — the sentence said "the four" while there were five
  // (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F22).
  ...readdirSync(REPOSITORY_ROOT).filter((file) => file.endsWith(".md")),
];

type Citation = { path: string; citedIn: string };

/**
 * A web address, which is not a path into this repository however much it looks
 * like one.
 *
 * Found immediately: a comment citing an MDN article, whose address carries a
 * `docs` segment of its own with `Mozilla` under it, read as a citation of a
 * directory here that has never existed. The scheme is optional because a
 * comment often drops it, and what identifies an address without one is the dot
 * in its host — which no directory in this repository has.
 */
const WEB_ADDRESS = /\b(?:https?:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/\S*/gi;

function getCitationsOf(pattern: RegExp): Citation[] {
  return AUTHORED_FILES.flatMap((file) =>
    [...readFileSync(REPOSITORY_ROOT + file, "utf8").replace(WEB_ADDRESS, " ").matchAll(pattern)]
      // A glob names a set, and a set is not somewhere `existsSync` can look.
      // `tests/captured-fights/*.json` is the only one, and §9.2 is where it is
      // held to being read by discovery rather than by name.
      .filter((match) => !match[0].includes("*"))
      .map((match) => ({ path: match[0], citedIn: file })),
  );
}

const CITATIONS: Citation[] = getCitationsOf(CITATION);
const DIRECTORY_CITATIONS: Citation[] = getCitationsOf(DIRECTORY_CITATION);

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
  const SECTIONS = new Set(
    [...RULES.matchAll(/^#{2,4} (\d+(?:\.\d+)?)\.? /gm)].map((match) => match[1]),
  );
  const CITED = [...new Set([...RULES.matchAll(/§(\d+(?:\.\d+)?)/g)].map((match) => match[1]))];

  const CITED_ELSEWHERE = AUTHORED_FILES.flatMap((file) =>
    [...readFileSync(REPOSITORY_ROOT + file, "utf8").matchAll(/§(\d+(?:\.\d+)?)/g)].map(
      (match) => ({ section: match[1] ?? "", citedIn: file }),
    ),
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
