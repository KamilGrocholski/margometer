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
 * ⚠️ **The dated name *is* shared, and the decision not to share it was
 * re-read rather than inherited.** This block used to argue that the two guards
 * agree on exactly one regex and that a module holding one regex makes each
 * readable only with the other open. That was true of a regex. They came to agree
 * on a regex **and** a five-line check — filename matches, date parses, date is
 * not in the future — which is a different trade
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F20).
 *
 * What moved to `tests/dated-document.ts` is exactly that one question. The two
 * still disagree about the status vocabulary, the required sections and
 * everything below the heading, and none of that went with it — so neither file
 * needs the other open to be read, which was the whole of the original
 * objection.
 */

import { expectDatedName } from "@/tests/dated-document.ts";
import { hasCommit, isCommitText, isShallowRepository } from "@/tests/git-history.ts";
import { getLabelledLine } from "@/tests/document-lines.ts";
import { isEveryCharacterIn } from "@/libs/text-runs.ts";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const AUDITS_DIRECTORY = new URL("../../docs/audits/", import.meta.url).pathname;
const DIGITS = "0123456789";

const AUDIT_FILES = readdirSync(AUDITS_DIRECTORY).filter((file) => file.endsWith(".md"));

const STATUS_LABEL = "Status: ";
const READ_AT_LABEL = "Read at: ";
const TITLE_LABEL = "# ";
const STATUSES = ["open", "closed"];

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

const FINDING_LABEL = "### F";
const FINDING_SEPARATOR = " — ";
const WHERE_LABEL = "*Where:* ";
const CLOSES_LABEL = "*Closes:* ";

/**
 * §7.7's vocabulary, and the three middle forms are §7.5's three places a round
 * can put what it learns. `declined` carries its reason on the same line,
 * because a decline whose reason lives in the prose above it is a decline nobody
 * can re-read against the finding.
 *
 * Read as fixed words and three prefixes rather than as one alternation: a guard
 * names a file in backticks, a rule names a section, and a decline states a
 * reason.
 */
const FIXED_CLOSES = ["open", "commit"];
const GUARD_PREFIX = "guard `";
const RULE_PREFIX = "rule §";
const DECLINED_PREFIX = "declined — ";

function isClosesVocabulary(stated: string): boolean {
  if (FIXED_CLOSES.includes(stated)) return true;
  if (stated.startsWith(GUARD_PREFIX)) {
    const named = stated.slice(GUARD_PREFIX.length);
    return named.endsWith("`") && named.length > 1 && !named.slice(0, -1).includes("`");
  }
  if (stated.startsWith(DECLINED_PREFIX)) return stated.length > DECLINED_PREFIX.length;
  if (!stated.startsWith(RULE_PREFIX)) return false;

  // `§N` or `§N.M`, and nothing after it.
  const section = stated.slice(RULE_PREFIX.length);
  const [chapter, part, ...rest] = section.split(".");
  if (rest.length > 0 || chapter === undefined) return false;
  if (!isEveryCharacterIn(chapter, DIGITS)) return false;
  return part === undefined || isEveryCharacterIn(part, DIGITS);
}

type Finding = { id: string; body: string };

function getFindingsSection(text: string): string {
  const afterHeading = text.split("\n## Findings\n")[1];
  return afterHeading === undefined ? "" : (afterHeading.split("\n## ")[0] ?? "");
}

/**
 * `### F1 — a title naming the effect`, or null.
 *
 * The number is read rather than matched so a heading numbered `F1a` is refused
 * the way the pattern refused it: everything between the label and the dash has
 * to be digits, and there has to be a title after the dash.
 */
function getFindingId(line: string): string | null {
  if (!line.startsWith(FINDING_LABEL)) return null;
  const dash = line.indexOf(FINDING_SEPARATOR);
  if (dash === -1) return null;

  const number = line.slice(FINDING_LABEL.length, dash);
  if (!isEveryCharacterIn(number, DIGITS)) return null;
  if (line.length === dash + FINDING_SEPARATOR.length) return null;
  return `F${number}`;
}

function getFindings(text: string): Finding[] {
  const section = getFindingsSection(text);
  const lines = section.split("\n");

  const starts: { id: string; at: number }[] = [];
  let at = 0;
  for (const line of lines) {
    const id = getFindingId(line);
    if (id !== null) starts.push({ id, at });
    at += line.length + 1;
  }

  return starts.map(({ id, at: start }, index) => ({
    id,
    body: section.slice(start, starts[index + 1]?.at ?? section.length),
  }));
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
    expectDatedName(file);
  });

  // Third and fourth lines, for `spec-status.test.ts`'s reason: a status that has
  // to be searched for is a status nobody updates.
  test("states its status and the commit it read where neither can be missed", () => {
    expect(getLabelledLine(lines[0] ?? "", TITLE_LABEL)).not.toBeNull();
    expect(STATUSES).toContain(getLabelledLine(lines[2] ?? "", STATUS_LABEL) ?? "");
    expect(isCommitText(getLabelledLine(lines[3] ?? "", READ_AT_LABEL) ?? "")).toBe(true);
  });

  /**
   * A finding dated to the day somebody typed it is what §7.6 refuses for a
   * claim about the game, and the reason transfers exactly: without the tree
   * under it, "at `src/ui/panel-view.ts:216`" names a line that may not be the
   * line anybody meant.
   */
  test("names a commit that is one", () => {
    const stated = getLabelledLine(lines[3] ?? "", READ_AT_LABEL);
    expect(stated).not.toBeNull();
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
        expect(getLabelledLine(finding.body, WHERE_LABEL)).not.toBeNull();
      });

      test("says how it closes, in the vocabulary §7.7 defines", () => {
        const stated = getLabelledLine(finding.body, CLOSES_LABEL);
        expect(stated).not.toBeNull();
        expect(isClosesVocabulary(stated ?? "")).toBe(true);
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
    if (getLabelledLine(lines[2] ?? "", STATUS_LABEL) !== "closed") return;
    const open = findings
      .filter((finding) => getLabelledLine(finding.body, CLOSES_LABEL) === "open")
      .map((finding) => finding.id);
    expect(open).toEqual([]);
  });
});
