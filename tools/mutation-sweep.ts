/**
 * Whether a test lights up when the thing it covers breaks.
 *
 * §3 asks this of every **new** test and the commits record the answer. Nothing
 * asks it of the ones already here, and a green gate cannot: a test that cannot
 * fail passes exactly like a test that holds something. §7.5 has the receipts —
 * twice a mutation lit nothing, and twice the answer was to delete code rather
 * than to add a test.
 *
 * So: change one character of meaning, run the gate, and see whether anything
 * goes red. A change nothing notices is a finding, and it is one of two — either
 * the behaviour is untested, or the code is inert. Which of the two is a
 * person's reading, not this tool's.
 *
 * **What it does to the working tree, and what protects it.** Mutants are
 * written into the real files, because `bun test` reads the real files. The
 * original is held in memory and written back after every single run — §7.5's
 * rule, and the reason it exists: `git checkout` would take whatever
 * uncommitted work was in the file. On top of that the sweep refuses to start
 * against a dirty tree, so the only thing it can ever be holding is a commit.
 *
 * ⚠️ **A mutation inside a type can never be killed here, and the report does not
 * say so.** What runs per mutant is `bun test`, not the gate: `tsc` is not in it,
 * because a typecheck per mutant would cost more than the run and a mutant that
 * fails to compile is not a behaviour anybody could have tested. The consequence
 * is that every string inside a type alias survives by construction — eleven of
 * `src/ui/panel-screen.ts`'s eighteen survivors are its two unions, read
 * 2026-08-19 — so a survivor list is read with the file open, and a `(text)`
 * mutation on a `type` line is nothing to act on
 * (`docs/audits/2026-08-19-the-whole-tree-read-a-fourth-time.md`, F13).
 *
 * ⚠️ **A mutant killed only by a guard of shape is barely killed.**
 * `tests/tools/source-layout.test.ts` and its neighbours read source as text, so
 * they fail on changes no behaviour depends on. Reported apart from the rest,
 * because a guard agreeing with the bug it was written to prevent is the failure
 * §7.5 names, and counting those as kills would let this tool make the same one.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { assertDefined } from "@/libs/assert.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number.ts";
import { getCommentRangesFromSource, getTextRangesFromSource } from "@/libs/source-regions.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class MutationSweepError extends MargoMeterToolError {
  constructor(message: string, options?: ErrorOptions) {
    super("MutationSweep", message, options);
  }
}

const REPOSITORY_ROOT = new URL("../", import.meta.url).pathname;

/** Everything that ships or supports shipping. Tests mutate nothing. */
const SWEPT_DIRECTORIES = ["libs", "src", "tools"];
const SWEPT_FILES = ["build.ts"];

/**
 * Guards that read source as text. A mutant only these object to changed the
 * spelling of the tree and not what it does.
 */
const SHAPE_GUARDS = [
  "tests/tools/source-layout.test.ts",
  "tests/tools/structure-block.test.ts",
  "tests/tools/cited-paths.test.ts",
];

/** Long enough for the whole gate, short enough that a hang is not a hang. */
const RUN_TIMEOUT_MILLISECONDS = 120_000;

export type Mutation = {
  file: string;
  offset: number;
  /** One-based, because a finding names a file and a line (§7.7). */
  line: number;
  before: string;
  after: string;
  operator: string;
};

export type MutationOutcome = {
  mutation: Mutation;
  /**
   * Whether the gate went red, or **null where the gate never finished**.
   *
   * The verdict comes from the exit status alone, and a run with no exit status
   * has no verdict to give: `spawnSync` answers `status: null` on a timeout, and
   * `null !== 0` reads as red, which reads as killed. A mutant that hangs the
   * suite was therefore reported as a kill — silently, in the direction that
   * costs, because the value of the report is its survivors
   * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F14). Three states,
   * so the three counts add up to the number of mutants and nobody has to guess
   * where the difference went.
   *
   * ⚠️ **It used to be `killedBy.length > 0`, and that made the parser the
   * judge.** The comment beside the runner has always said "the status decides
   * and the names only describe" — for a mutant that stops the suite loading at
   * all, there is no failure line to read. Deriving the verdict from the names
   * said the opposite, so the day the runner changed its failure marker every
   * kill in every report became a survivor: a tool for finding tests that cannot
   * fail, reporting that none of them can.
   */
  isKilled: boolean | null;
  /** Test files that failed, where the output could be read. Descriptive only. */
  killedBy: string[];
  /** Killed, but only by a guard reading source as text. */
  isShapeOnly: boolean;
};

type Rule = {
  operator: string;
  pattern: RegExp;
  composeAfter: (match: RegExpMatchArray) => string | null;
};

/**
 * Every operator is matched between whitespace, and that is the whole of how
 * this stays out of trouble: the tree is formatted, so a binary operator has
 * whitespace either side and `+=`, `++` and `a[-1]` do not. A pattern of the
 * bare character would mutate all three into something that does not parse, and
 * an unparseable mutant is killed by everything while proving nothing.
 *
 * ⚠️ **`\s` and not a literal space, and that was worth seventeen mutants.** The
 * patterns used to be written as ` && ` — a space on each side — which is not
 * how a condition spanning several lines is spelled: the operator ends the line,
 * and the character after it is a newline. So every multi-line boolean in this
 * repository was invisible to the sweep, silently, and those are the most
 * logic-dense expressions there are. Found by the guard written to hold the
 * convention this comment claims
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F15).
 *
 * The lookarounds are what keep the operator out of the match: replacing it with
 * the bare spelling leaves the whitespace the tree already had.
 */
const RULES: Rule[] = [
  { operator: "comparison", pattern: /(?<=\s)>(?=\s)/g, composeAfter: () => ">=" },
  { operator: "comparison", pattern: /(?<=\s)>=(?=\s)/g, composeAfter: () => ">" },
  { operator: "comparison", pattern: /(?<=\s)<(?=\s)/g, composeAfter: () => "<=" },
  { operator: "comparison", pattern: /(?<=\s)<=(?=\s)/g, composeAfter: () => "<" },
  { operator: "equality", pattern: /(?<=\s)===(?=\s)/g, composeAfter: () => "!==" },
  { operator: "equality", pattern: /(?<=\s)!==(?=\s)/g, composeAfter: () => "===" },
  { operator: "arithmetic", pattern: /(?<=\s)\+(?=\s)/g, composeAfter: () => "-" },
  { operator: "arithmetic", pattern: /(?<=\s)-(?=\s)/g, composeAfter: () => "+" },
  { operator: "arithmetic", pattern: /(?<=\s)\*(?=\s)/g, composeAfter: () => "/" },
  { operator: "arithmetic", pattern: /(?<=\s)\/(?=\s)/g, composeAfter: () => "*" },
  { operator: "logic", pattern: /(?<=\s)&&(?=\s)/g, composeAfter: () => "||" },
  { operator: "logic", pattern: /(?<=\s)\|\|(?=\s)/g, composeAfter: () => "&&" },
  {
    // The lookahead keeps `!==` out of it, and the leading character is put back
    // so the negation is the only thing that goes.
    operator: "negation",
    pattern: /([(\s=,[])!(?=[A-Za-z_$([])/g,
    composeAfter: (match) => match[1] ?? "",
  },
  {
    operator: "number",
    pattern: /\b\d+\b/g,
    composeAfter: (match) => {
      const value = getIntegerFromText(match[0]);
      return value === null ? null : composeIntegerText(value + 1);
    },
  },
  { operator: "return", pattern: /\breturn true\b/g, composeAfter: () => "return false" },
  { operator: "return", pattern: /\breturn false\b/g, composeAfter: () => "return true" },
  { operator: "return", pattern: /\breturn null\b/g, composeAfter: () => "return undefined" },
];

/** What a mutated literal says instead. Nothing in the tree says it already. */
const TEXT_SENTINEL = '"mutation-sweep"';

function getLineOfOffset(source: string, offset: number): number {
  return source.slice(0, offset).split("\n").length;
}

function isInsideRange(ranges: Array<{ start: number; end: number }>, from: number, to: number) {
  return ranges.some((range) => from < range.end && range.start < to);
}

/**
 * A literal naming a module is not text this add-on says — mutating it breaks
 * the import, which kills the mutant by making the file unloadable and measures
 * nothing about any test.
 */
function isModuleSpecifier(source: string, start: number): boolean {
  return /\b(from|import|require)\s*\(?\s*$/.test(source.slice(0, start));
}

export function composeMutations(source: string, file: string): Mutation[] {
  const comments = getCommentRangesFromSource(source);
  const texts = getTextRangesFromSource(source);
  const mutations: Mutation[] = [];

  for (const rule of RULES) {
    for (const match of source.matchAll(rule.pattern)) {
      const offset = assertDefined(match.index, "matchAll states where it matched");
      const before = match[0];
      // Comments are not code, and a literal's contents are mutated whole below
      // rather than one operator at a time.
      if (isInsideRange(comments, offset, offset + before.length)) continue;
      if (isInsideRange(texts, offset, offset + before.length)) continue;

      const after = rule.composeAfter(match);
      if (after === null || after === before) continue;
      mutations.push({
        file,
        offset,
        line: getLineOfOffset(source, offset),
        before,
        after,
        operator: rule.operator,
      });
    }
  }

  for (const range of texts) {
    const before = source.slice(range.start, range.end);
    if (before.startsWith("`")) continue;
    if (before.length <= 2) continue;
    if (before === TEXT_SENTINEL) continue;
    if (isModuleSpecifier(source, range.start)) continue;
    mutations.push({
      file,
      offset: range.start,
      line: getLineOfOffset(source, range.start),
      before,
      after: TEXT_SENTINEL,
      operator: "text",
    });
  }

  return mutations.sort((left, right) => left.offset - right.offset);
}

export function composeMutatedSource(source: string, mutation: Mutation): string {
  const found = source.slice(mutation.offset, mutation.offset + mutation.before.length);
  if (found !== mutation.before) {
    throw new MutationSweepError(
      `${mutation.file}:${mutation.line} no longer reads ${mutation.before} at ${mutation.offset}`,
    );
  }
  return (
    source.slice(0, mutation.offset) +
    mutation.after +
    source.slice(mutation.offset + mutation.before.length)
  );
}

/**
 * What `bun test` marks a failed test with, once its colours are taken off.
 *
 * ⚠️ **Reading the wrong one cost this tool every verdict it ever gave.** The
 * marker was `(fail)`, which the runner in use does not print — it prints `✗`,
 * inside escape codes, so every failure parsed as no failure at all. The test
 * that should have caught it asserted against a sample somebody had typed by
 * hand, under a comment claiming it was "the shape `bun test` prints". That is a
 * guard agreeing with the bug it was written to prevent (§7.5), and it is the
 * second time in this repository that a hand-written sample of somebody else's
 * output has done it.
 *
 * Both spellings are accepted, because which one appears is the runner's
 * business and not a thing worth breaking on. What makes that safe rather than
 * hopeful is that **this function no longer decides anything** — the exit status
 * does, and these names only describe.
 */
const FAILURE_MARKERS = ["✗", "(fail)"];

/** Escape codes, which the runner writes even when nothing is a terminal. */
const ANSI = /\x1b\[[0-9;]*m/g;

export function getFailingTestFiles(output: string): string[] {
  const failing: string[] = [];
  let current: string | null = null;
  for (const raw of output.split("\n")) {
    const line = raw.replace(ANSI, "").trim();
    const header = /^(\S+\.test\.ts):$/.exec(line);
    if (header !== null) {
      current = header[1] ?? null;
      continue;
    }
    const isFailure = FAILURE_MARKERS.some((marker) => line.startsWith(marker));
    if (isFailure && current !== null && !failing.includes(current)) {
      failing.push(current);
    }
  }
  return failing;
}

/** `isRed` is null where the gate never finished — see `MutationOutcome`. */
type GateOutcome = { isRed: boolean | null; failing: string[] };

function getGateOutcome(isBailing: boolean): GateOutcome {
  const result = spawnSync("bun", isBailing ? ["test", "--bail=1"] : ["test"], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
    timeout: RUN_TIMEOUT_MILLISECONDS,
  });

  // ⚠️ **A runner that cannot be started is not a mutant nobody noticed.** It is
  // the same `status: null` a timeout gives, and read as red it would report
  // every mutant killed on a machine with no `bun` on its path — a tool for
  // finding tests that cannot fail, answering that none of them can. Thrown
  // rather than counted, because it is true of every run that follows and a
  // report of five thousand unfinished runs says nothing anybody can act on.
  if (result.error !== undefined) {
    throw new MutationSweepError("the gate could not be run", { cause: result.error });
  }

  // A mutant that stops the suite from loading at all produces no failure line
  // and is still a kill, so the status decides and the names only describe.
  return {
    isRed: result.status === null ? null : result.status !== 0,
    failing: getFailingTestFiles(`${result.stdout ?? ""}\n${result.stderr ?? ""}`),
  };
}

/**
 * Whether the only thing that went red reads source as text.
 *
 * One function because the run loop asked it twice, once to decide on a second
 * run without `--bail` and once to record the outcome — and a predicate spelled
 * twice is where the two come to disagree (§7.1).
 */
function isShapeOnlyKill(run: GateOutcome): boolean {
  return (
    run.isRed === true &&
    run.failing.length > 0 &&
    run.failing.every((failing) => SHAPE_GUARDS.includes(failing))
  );
}

/**
 * ⚠️ **A sweep against a tree that is already red reports every mutant killed.**
 * A kill here is "the suite went red with the mutant in", and a suite that was
 * red without it goes red with it too — so a single unrelated failure turns the
 * whole run into a green report saying every test can fail. Paid for on a
 * detached worktree whose scratch commit tripped `todo-commits.test.ts`: every
 * mutant of three files came back killed, one of them a mutation that had just
 * been watched surviving by hand
 * (`docs/audits/2026-08-21-the-code-read-for-its-smells.md`, the closing round's
 * re-measurement).
 *
 * One run before the first mutant, which is nothing beside the hundreds that
 * follow. The clean-tree check above cannot see this: a tree with no changes in
 * it can still be one whose suite does not pass.
 */
function assertGateIsGreen(): void {
  const outcome = getGateOutcome(false);
  if (outcome.isRed === null) {
    throw new MutationSweepError("the gate did not finish before the first mutant was written");
  }
  if (outcome.isRed) {
    throw new MutationSweepError(
      "the gate is already red without a mutant in it, so every mutant would be reported " +
        `killed; red: ${outcome.failing.join(", ")}`,
    );
  }
}

function assertCleanWorkingTree(): void {
  const result = spawnSync("git", ["status", "--porcelain"], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new MutationSweepError("git could not say whether the tree is clean");
  }
  if ((result.stdout ?? "").trim() !== "") {
    throw new MutationSweepError(
      "the working tree carries changes; this writes mutants into the files themselves and " +
        "will not put anything at risk that a commit cannot restore",
    );
  }
}

export function getSweptFiles(): string[] {
  const discovered = SWEPT_DIRECTORIES.flatMap((directory) =>
    readdirSync(REPOSITORY_ROOT + directory, { recursive: true, encoding: "utf8" })
      .filter((entry) => entry.endsWith(".ts"))
      .map((entry) => `${directory}/${entry}`),
  );
  return [...discovered, ...SWEPT_FILES].sort();
}

function getMutationOutcomesOfFile(file: string): MutationOutcome[] {
  const path = REPOSITORY_ROOT + file;
  const original = readFileSync(path, "utf8");
  const mutations = composeMutations(original, file);
  const outcomes: MutationOutcome[] = [];

  const handleInterrupt = () => {
    writeFileSync(path, original);
    process.exit(130);
  };
  process.on("SIGINT", handleInterrupt);
  process.on("SIGTERM", handleInterrupt);

  try {
    for (const [index, mutation] of mutations.entries()) {
      writeFileSync(path, composeMutatedSource(original, mutation));
      let run = getGateOutcome(true);
      // Only when nothing but a text search objected: the question is whether
      // any behaviour noticed, and under `--bail` the first failure is the only
      // one anybody saw.
      if (isShapeOnlyKill(run)) run = getGateOutcome(false);
      writeFileSync(path, original);
      outcomes.push({
        mutation,
        isKilled: run.isRed,
        killedBy: run.isRed === true ? run.failing : [],
        isShapeOnly: isShapeOnlyKill(run),
      });
      process.stderr.write(
        `\r${file}  ${composeIntegerText(index + 1)}/${composeIntegerText(mutations.length)}   `,
      );
    }
  } finally {
    writeFileSync(path, original);
    process.off("SIGINT", handleInterrupt);
    process.off("SIGTERM", handleInterrupt);
  }

  return outcomes;
}

function writeSweepReport(outcomes: MutationOutcome[]): void {
  const survived = outcomes.filter((outcome) => outcome.isKilled === false);
  const unfinished = outcomes.filter((outcome) => outcome.isKilled === null);
  const shapeOnly = outcomes.filter((outcome) => outcome.isShapeOnly);

  const byFile = new Map<string, MutationOutcome[]>();
  for (const outcome of outcomes) {
    byFile.set(outcome.mutation.file, [...(byFile.get(outcome.mutation.file) ?? []), outcome]);
  }

  console.log();
  for (const [file, forFile] of byFile) {
    // ⚠️ **`isKilled`, not `killedBy.length`.** This line counted survivors from
    // the parsed output while the totals below counted them from the exit
    // status, so a mutant that stopped the suite loading — red, with no failure
    // line to read — was a kill in one half of the report and a survivor in the
    // other. The file's own docblock records paying for exactly this once
    // already (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F13).
    const alive = forFile.filter((outcome) => outcome.isKilled === false).length;
    console.log(
      `${composeIntegerText(forFile.length).padStart(5)} mutants  ` +
        `${composeIntegerText(alive).padStart(4)} survived   ${file}`,
    );
  }

  console.log();
  console.log("survivors");
  for (const { mutation } of survived) {
    console.log(
      `  ${mutation.file}:${composeIntegerText(mutation.line)}  ` +
        `${mutation.before} → ${mutation.after}  (${mutation.operator})`,
    );
  }

  console.log();
  console.log("killed only by a guard reading source as text");
  for (const { mutation, killedBy } of shapeOnly) {
    console.log(
      `  ${mutation.file}:${composeIntegerText(mutation.line)}  ` +
        `${mutation.before} → ${mutation.after}  (${killedBy.join(", ")})`,
    );
  }

  if (unfinished.length > 0) {
    console.log();
    console.log("the gate never finished, so these are neither");
    for (const { mutation } of unfinished) {
      console.log(
        `  ${mutation.file}:${composeIntegerText(mutation.line)}  ` +
          `${mutation.before} → ${mutation.after}  (${mutation.operator})`,
      );
    }
  }

  console.log();
  console.log(
    `${composeIntegerText(outcomes.length)} mutants, ` +
      `${composeIntegerText(outcomes.length - survived.length - unfinished.length)} killed, ` +
      `${composeIntegerText(survived.length)} survived, ` +
      `${composeIntegerText(unfinished.length)} unfinished, ` +
      `${composeIntegerText(shapeOnly.length)} of the kills by shape alone`,
  );
}

if (import.meta.main) {
  const asked = process.argv.slice(2);
  const files = asked.length > 0 ? asked : getSweptFiles();
  assertCleanWorkingTree();
  assertGateIsGreen();
  writeSweepReport(files.flatMap((file) => getMutationOutcomesOfFile(file)));
}
