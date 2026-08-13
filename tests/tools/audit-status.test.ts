import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";

/**
 * Holds `docs/audits/` to §7.7's shape.
 *
 * The load-bearing test is the last one: a **closed** audit has no finding still
 * saying `open`. Everything else here is shape, and shape is not what an audit
 * directory fails at — it fails by filling up with readings nobody acted on,
 * which is the artefact §7.5 refuses and the one §8's first note names. An audit
 * is admitted to `docs/` because the round after it closes it; this is the half
 * of that condition a machine can hold.
 *
 * `spec-status.test.ts` cannot cover this. It reads `docs/specs/`
 * non-recursively, so an audit is invisible to it, and the two documents want
 * different things anyway — a spec states what was rejected, an audit states
 * what was not read.
 *
 * ⚠️ **Rejected: sharing the dated-name pattern with `spec-status.test.ts`.**
 * The two agree on exactly one regex and disagree on the status vocabulary, the
 * required sections and everything below the heading. §7.1 puts a shared module
 * at the second consumer, and this would be one — but a module holding a single
 * regex makes each guard readable only with the other one open, which is a worse
 * trade than the duplication it removes.
 */

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;
const AUDITS_DIRECTORY = new URL("../../docs/audits/", import.meta.url).pathname;
const AUDIT_FILES = readdirSync(AUDITS_DIRECTORY).filter((file) => file.endsWith(".md"));

const DATED_NAME = /^(\d{4})-(\d{2})-(\d{2})-[a-z0-9]+(-[a-z0-9]+)*\.md$/;
const STATUS_LINE = /^Status: (open|closed)$/;

/**
 * Abbreviated or whole, because git accepts both and an audit is written by
 * pasting what `git log` printed.
 */
const READ_AT_LINE = /^Read at: ([0-9a-f]{7,40})$/;

/**
 * All four, and "Looked at and clean" is not decoration: §7.7 turns on *not
 * looked at*, *looked at and clean* and *a finding* being three answers. An
 * audit offering two of them converts the first into the second by silence,
 * which is the failure §7.6 paid for twice on the published help.
 */
const REQUIRED_SECTIONS = [
  "## What was measured",
  "## Findings",
  "## Looked at and clean",
  "## What was not read",
];

const FINDING_HEADING = /^### (F\d+) — .+$/gm;
const WHERE_LINE = /^\*Where:\* .+$/m;
const CLOSES_LINE = /^\*Closes:\* (.+)$/m;

/**
 * §7.7's vocabulary, and the three middle forms are §7.5's three places a round
 * can put what it learns. `declined` carries its reason on the same line,
 * because a decline whose reason lives in the prose above it is a decline nobody
 * can re-read against the finding.
 */
const CLOSES_VOCABULARY =
  /^(open|guard `[^`]+`|rule §\d+(\.\d+)?|commit|declined — .+)$/;

type Finding = { id: string; body: string };

function getFindingsSection(text: string): string {
  const afterHeading = text.split("\n## Findings\n")[1];
  return afterHeading === undefined ? "" : (afterHeading.split("\n## ")[0] ?? "");
}

function getFindings(text: string): Finding[] {
  const section = getFindingsSection(text);
  const headings = [...section.matchAll(FINDING_HEADING)];
  return headings.map((heading, index) => {
    const start = heading.index ?? 0;
    const next = headings[index + 1]?.index ?? section.length;
    return { id: heading[1] ?? "", body: section.slice(start, next) };
  });
}

/**
 * `actions/checkout@v4` clones at depth 1, so on the runner every commit but
 * HEAD is absent and an unconditional resolve would turn the gate red for every
 * audit ever written — the CI-versus-local disagreement §6.1 names, manufactured
 * on purpose by a guard. The shape is checked everywhere; the object is checked
 * where audits are actually written, which is a working tree with history in it.
 *
 * Rejected: `fetch-depth: 0` in `.github/workflows/check.yml`. It makes the
 * check unconditional at the cost of cloning the whole history — including
 * `tests/captured-fights/` — on every run of the gate, to re-earn one line of
 * one document.
 */
function isShallowRepository(): boolean {
  return (
    execFileSync("git", ["rev-parse", "--is-shallow-repository"], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    }).trim() === "true"
  );
}

function hasCommit(revision: string): boolean {
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

// An empty directory passes every loop below without running one, which reads
// exactly like a directory of clean audits — §9.2's rule for the captures, and
// it holds here for the same reason.
test("there are audits to check", () => {
  expect(AUDIT_FILES.length).toBeGreaterThan(0);
});

describe.each(AUDIT_FILES)("%s", (file) => {
  const text = readFileSync(AUDITS_DIRECTORY + file, "utf8");
  const lines = text.split("\n");
  const findings = getFindings(text);

  test("is named for the day the tree was read", () => {
    expect(file).toMatch(DATED_NAME);
    const read = getMillisecondsFromIsoText(file.slice(0, "yyyy-mm-dd".length));
    expect(read).not.toBeNull();
    expect(read).toBeLessThanOrEqual(Date.now());
  });

  // Third and fourth lines, for `spec-status.test.ts`'s reason: a status that has
  // to be searched for is a status nobody updates.
  test("states its status and the commit it read where neither can be missed", () => {
    expect(lines[0]).toMatch(/^# .+/);
    expect(lines[2]).toMatch(STATUS_LINE);
    expect(lines[3]).toMatch(READ_AT_LINE);
  });

  /**
   * A finding dated to the day somebody typed it is what §7.6 refuses for a
   * claim about the game, and the reason transfers exactly: without the tree
   * under it, "at `src/ui/panel-view.ts:216`" names a line that may not be the
   * line anybody meant.
   */
  test("names a commit that is one", () => {
    const stated = READ_AT_LINE.exec(lines[3] ?? "")?.[1];
    expect(stated).toBeDefined();
    if (isShallowRepository()) return;
    expect(hasCommit(stated ?? "")).toBe(true);
  });

  test.each(REQUIRED_SECTIONS)("says %s", (section) => {
    expect(text).toContain(`\n${section}\n`);
  });

  test("has findings, and they are numbered without a gap", () => {
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.map((finding) => finding.id)).toEqual(
      findings.map((_, index) => `F${index + 1}`),
    );
  });

  describe.each(findings.map((finding) => [finding.id, finding] as const))(
    "%s",
    (_id, finding) => {
      test("points at something", () => {
        expect(finding.body).toMatch(WHERE_LINE);
      });

      test("says how it closes, in the vocabulary §7.7 defines", () => {
        const stated = CLOSES_LINE.exec(finding.body)?.[1];
        expect(stated).toBeDefined();
        expect(stated ?? "").toMatch(CLOSES_VOCABULARY);
      });
    },
  );

  /**
   * The one that matters. Everything above is shape; this is the condition on
   * which §8 admits the directory at all — an audit is commissioned work, and
   * one that calls itself finished while findings sit open is the chronicle that
   * sentence exists to refuse.
   */
  test("is not closed while a finding is open", () => {
    if (STATUS_LINE.exec(lines[2] ?? "")?.[1] !== "closed") return;
    const open = findings
      .filter((finding) => CLOSES_LINE.exec(finding.body)?.[1] === "open")
      .map((finding) => finding.id);
    expect(open).toEqual([]);
  });
});
