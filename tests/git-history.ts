/**
 * What this repository's own history can be asked, and when it cannot be asked
 * at all.
 *
 * Three guards need the same two answers — is there history here, and is this
 * object in it — and until this file they spelled the first one twice, word for
 * word, in `tests/tools/audit-status.test.ts` and
 * `tests/tools/panel-screenshots.test.ts`. A third caller was what §7.1 asks a
 * shared module to wait for.
 *
 * ⚠️ **`--is-shallow-repository` is git's name and is spelled once, here.** Every
 * one of these questions is answered by an **exit status**, never by parsing what
 * git printed (§7.5): a revision this repository has never heard of and one on an
 * abandoned branch answer the same way, which is the answer the callers ask for.
 *
 * `actions/checkout@v4` clones at depth 1, so on the gate there is no history to
 * ask. Every caller checks `isShallowRepository()` first and stands down rather
 * than failing — `fetch-depth: 0` was rejected, because it clones the whole of
 * `tests/captured-fights/` on every run of the gate to re-earn a handful of lines
 * (`tests/tools/audit-status.test.ts`).
 */

import { execFileSync } from "node:child_process";

const REPOSITORY_ROOT = new URL("../", import.meta.url).pathname;

/** Whether this checkout has history behind it, or only the commit it is on. */
export function isShallowRepository(): boolean {
  return (
    execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    }).trim() === "true"
  );
}

export function hasCommit(revision: string): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${revision}^{commit}`], {
      cwd: REPOSITORY_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function isAncestorOfHead(revision: string): boolean {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", revision, "HEAD"], {
      cwd: REPOSITORY_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Whether this path was ever in this repository — at any commit, under this name.
 *
 * ⚠️ **Not "is it in that tree", which is the narrower question and the wrong
 * one.** The first draft of the caller asked whether a path was in the tree an
 * audit read, or in the tree now, and it was red inside the hour: the third audit
 * names `panel-tokens.test.ts` — a guard its own finding created
 * *afterwards* and a later round then renamed. Neither tree had it, and yet the
 * citation had been true on the day it was written and every day after until the
 * rename. Whether it was ever real is the question a dated record actually
 * raises, and `git log` answers it without needing to know which commit to ask.
 *
 * Empty output is the answer, so the status cannot carry it: `git log` over a
 * path nothing ever touched exits zero and prints nothing (§7.5 — what decides is
 * the status, except where the status cannot decide, and then the length can).
 */
export function hasPathInHistory(path: string): boolean {
  return (
    execFileSync("git", ["log", "-1", "--format=%H", "--", path], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    }).trim() !== ""
  );
}
