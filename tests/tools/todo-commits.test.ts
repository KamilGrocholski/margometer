/**
 * Holds §7.2's rule that `TODO.md` travels alone, and under its own type.
 *
 * `.claude/settings.json` denies the tool calls that would write to the file, and
 * `agent-permissions.test.ts` guards that the deny list is still there — together
 * they answer *who may edit it*. This answers a different question the same
 * paragraph raises: **what may ride along with it**. A round that closed a task
 * and ticked the box in the same commit would leave a diff in which the
 * maintainer's own note and the work are one change, and there is then no reading
 * of that commit that separates them.
 *
 * ⚠️ **A history guard can never be retrofitted, so it is dated.** Every commit
 * before the rule existed is beyond fixing — history is what it is — and a guard
 * that failed on `cb256d0` for not obeying a rule written afterwards would be
 * permanently red and therefore turned off within the week. So it names the last
 * commit that predates the rule and reads forward from there, the way an audit
 * names the commit it read (§7.7).
 */

import { execFileSync } from "node:child_process";
import { describe, expect, test } from "bun:test";
import { isWhitespaceAt } from "@/libs/text-runs.ts";

const RULE_BEGAN_AFTER = "b7ae4ab";

const TASK_LIST = "TODO.md";

/** §7.2: the type is bare, because there is exactly one file and no scope to name. */
const TODO_PREFIX = "todo: ";

/** The bare type, and something after it that is not more whitespace. */
function hasTodoSubject(subject: string): boolean {
  if (!subject.startsWith(TODO_PREFIX)) return false;
  return subject.length > TODO_PREFIX.length && !isWhitespaceAt(subject, TODO_PREFIX.length);
}

const REPOSITORY_ROOT = new URL("../..", import.meta.url).pathname;

/**
 * `actions/checkout@v4` clones at depth 1, so on the runner there is no history
 * to read and an unconditional check would be the CI-versus-local disagreement
 * §6.1 names, manufactured by a guard. The rule binds whoever is making the
 * commit, and that happens in a working tree with history in it.
 *
 * Rejected: `fetch-depth: 0` in `.github/workflows/check.yml`, for the reason
 * `audit-status.test.ts` gives — it clones `tests/captured-fights/` in full on
 * every run of the gate to re-earn something the committer already had.
 */
function hasHistory(): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${RULE_BEGAN_AFTER}^{commit}`], {
      cwd: REPOSITORY_ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

type Commit = { hash: string; subject: string; files: string[] };

/**
 * Every commit since the rule, with what it touched.
 *
 * Records are split on `\x01` and their two halves on `\x00`, because a subject
 * may contain anything a person can type and a filename may contain a newline —
 * the two characters git will not put in either. Parsed rather than asked
 * per-commit so the whole range costs one process.
 *
 * A merge lists no files under `--name-only` and so passes; this history is
 * linear, and a guard that had to reason about which parent a file came from
 * would be answering a question nobody here asks.
 */
function getCommitsSinceRule(): Commit[] {
  const printed = execFileSync(
    "git",
    ["log", "--format=%x01%H%x00%s", "--name-only", `${RULE_BEGAN_AFTER}..HEAD`],
    { cwd: REPOSITORY_ROOT, encoding: "utf8" },
  );

  return printed
    .split("\x01")
    .filter((record) => record.trim() !== "")
    .map((record) => {
      const [head = "", body = ""] = record.split("\x00");
      const [subject = "", ...files] = body.split("\n");
      return {
        hash: head.trim(),
        subject,
        files: files.map((file) => file.trim()).filter((file) => file !== ""),
      };
    });
}

describe("the maintainer's task list travels alone", () => {
  if (!hasHistory()) {
    // Not a skipped test (§4) — it is the whole of what a shallow clone can say,
    // and saying it out loud beats a silent pass.
    test("there is no history here to read, so the rule is held where it binds", () => {
      expect(hasHistory()).toBe(false);
    });
    return;
  }

  const commits = getCommitsSinceRule();
  const touching = commits.filter((commit) => commit.files.includes(TASK_LIST));
  // Loose on purpose, and the assertion below is strict: `todo(any): …` claims
  // the type without spelling it, and a filter that matched only the exact form
  // would let the one malformed spelling through as though it were some other
  // type entirely.
  const typed = commits.filter((commit) => commit.subject.startsWith("todo"));

  test.each(touching.map((commit) => [`${commit.hash.slice(0, 7)} ${commit.subject}`, commit]))(
    "%s changes the task list and nothing else",
    (_name, commit) => {
      expect(commit.files).toEqual([TASK_LIST]);
    },
  );

  test.each(touching.map((commit) => [`${commit.hash.slice(0, 7)} ${commit.subject}`, commit]))(
    "%s says so in its type",
    (_name, commit) => {
      expect(hasTodoSubject(commit.subject), commit.subject).toBe(true);
    },
  );

  /**
   * The other direction, which is the one that goes wrong quietly: a `todo:`
   * commit carrying a source file is a change nobody will look for under that
   * word, and the type would then mean less than nothing.
   */
  test.each(typed.map((commit) => [`${commit.hash.slice(0, 7)} ${commit.subject}`, commit]))(
    "%s is typed for the task list, so it carries only the task list",
    (_name, commit) => {
      expect(hasTodoSubject(commit.subject), commit.subject).toBe(true);
      expect(commit.files).toEqual([TASK_LIST]);
    },
  );

  /**
   * ⚠️ **Neither list above is required to have anything in it, and this is the
   * one place that emptiness is not the trap §9.2 names.** A stretch of work that
   * never touched the file is the normal case, and demanding a `todo:` commit
   * would be demanding the maintainer keep notes to keep the gate green. The
   * range was empty by construction on the commit that wrote this — the boundary
   * *was* `HEAD` — and fills from the next one.
   *
   * What would make the loops above silently vacuous is the boundary going missing
   * from the history, which is the one thing worth asserting: a rebase that drops
   * it turns every check here into a loop over nothing, and nothing goes red.
   */
  test("the commit the rule is dated to is still in this history", () => {
    // Ancestry and nothing else. Asking whether the boundary *touched* the file
    // would be a second claim about it that happens to be true today, and the
    // first thing to go wrong the day the boundary moves forward.
    const isAncestor = (): boolean => {
      try {
        execFileSync("git", ["merge-base", "--is-ancestor", RULE_BEGAN_AFTER, "HEAD"], {
          cwd: REPOSITORY_ROOT,
          stdio: "ignore",
        });
        return true;
      } catch {
        return false;
      }
    };
    expect(isAncestor()).toBe(true);
  });
});
