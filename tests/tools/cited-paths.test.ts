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
 */
const CITATION = new RegExp(
  String.raw`\b(${AUTHORED_ROOTS.join("|")})/[A-Za-z0-9._/-]*\.(ts|md|json|js|yml)\b`,
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
  // The four at the root are where the rules themselves live, so they are where
  // a stale citation costs the most.
  ...readdirSync(REPOSITORY_ROOT).filter((file) => file.endsWith(".md")),
];

type Citation = { path: string; citedIn: string };

const CITATIONS: Citation[] = AUTHORED_FILES.flatMap((file) =>
  [...readFileSync(REPOSITORY_ROOT + file, "utf8").matchAll(CITATION)]
    // A glob names a set, and a set is not somewhere `existsSync` can look.
    // `tests/captured-fights/*.json` is the only one, and §9.2 is where it is
    // held to being read by discovery rather than by name.
    .filter((match) => !match[0].includes("*"))
    .map((match) => ({ path: match[0], citedIn: file })),
);

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
});
