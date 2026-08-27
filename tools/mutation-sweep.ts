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
 * ⚠️ **A mutant the compiler refuses is not a survivor, and this used to report
 * it as one.** What runs per mutant is `bun test`, and a string inside a type
 * union or a `kind` in a typed literal changes no behaviour a test could see — so
 * every one of them came back alive. The old reason for leaving `tsc` out was
 * that "a typecheck per mutant would cost more than the run", which is measured
 * and false: 2.1 s against 5.4 s at `af3f1ec`
 * (`docs/audits/2026-08-21-the-rest-of-the-code-read-for-its-smells.md`, F3).
 *
 * So the typecheck runs, and it runs **only on a mutant that survived the tests**
 * — a minority of any sweep — which is what makes it nearly free: the kills stay
 * exactly as fast as they were. What the compiler refuses is reported apart from
 * the survivors and counted with the kills, because the gate is what refused it.
 * Reading a survivor list is then reading a list of gaps, which is what it always
 * claimed to be: 14 of `src/core/battle-event.ts`'s 24 and every one of
 * `src/core/fight-decoder.ts`'s 15 were the compiler's, and both files are
 * otherwise held.
 *
 * ⚠️ **A mutant killed only by a guard of shape is barely killed.**
 * `tests/tools/source-layout.test.ts` and its neighbours read source as text, so
 * they fail on changes no behaviour depends on. Reported apart from the rest,
 * because a guard agreeing with the bug it was written to prevent is the failure
 * §7.5 names, and counting those as kills would let this tool make the same one.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { composeIntegerText, getIntegerFromText } from "@/libs/number.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import {
  getEndOfDigits,
  isDigitAt,
  isWhitespaceAt,
  isWordCharacterAt,
  isWordStart,
} from "@/libs/text-runs.ts";
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
  /**
   * Survived the tests, and the compiler refuses it.
   *
   * Counted with the kills rather than the survivors: `bun run check` is the gate
   * and `tsc` is half of it, so a mutant it will not compile is one the gate
   * catches. Asked only of a survivor, which is why the sweep did not get slower
   * for it.
   */
  isRefusedByCompiler: boolean;
};

/**
 * One kind of change, and how the tree has to be spelling something for it to
 * apply.
 *
 * `spaced` is an operator with whitespace either side, `word` a phrase with a
 * word boundary either side, and the other two carry their own reading because
 * what they replace is not a fixed string.
 */
type Rule =
  | { operator: string; kind: "spaced"; before: string; after: string }
  | { operator: string; kind: "word"; before: string; after: string }
  | { operator: string; kind: "negation" }
  | { operator: string; kind: "number" };

/**
 * One place a rule applies, and what is there.
 *
 * ⚠️ **What it replaces that with is composed later, and that is not tidiness.**
 * A number is mutated to one more than itself, and `2 ** 53 - 1` composed to its
 * successor is a broken invariant rather than a mutant — `libs/number.ts` states
 * that bound in its own docblock and `tests/libs/number.test.ts` in a case, both
 * of which are prose and neither of which is mutated. Composing here would reach
 * them before the ranges below throw them away, and the sweep would die reading
 * a comment. Found by putting this reader against the pattern it replaced over
 * every tracked file, which is the only reason it is written down rather than
 * discovered by somebody running the tool.
 */
type Found = { offset: number; before: string };

/**
 * Every operator is matched between whitespace, and that is the whole of how
 * this stays out of trouble: the tree is formatted, so a binary operator has
 * whitespace either side and `+=`, `++` and `a[-1]` do not. Reading the bare
 * character would mutate all three into something that does not parse, and an
 * unparseable mutant is killed by everything while proving nothing.
 *
 * ⚠️ **Whitespace and not a literal space, and that was worth seventeen
 * mutants.** The rules used to be written as ` && ` — a space on each side —
 * which is not how a condition spanning several lines is spelled: the operator
 * ends the line, and the character after it is a newline. So every multi-line
 * boolean in this repository was invisible to the sweep, silently, and those are
 * the most logic-dense expressions there are. Found by the guard written to hold
 * the convention this comment claims
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F15).
 *
 * The fences are read and never replaced: the operator alone goes, and the
 * whitespace the tree already had stays where it was.
 */
const RULES: Rule[] = [
  { operator: "comparison", kind: "spaced", before: ">", after: ">=" },
  { operator: "comparison", kind: "spaced", before: ">=", after: ">" },
  { operator: "comparison", kind: "spaced", before: "<", after: "<=" },
  { operator: "comparison", kind: "spaced", before: "<=", after: "<" },
  { operator: "equality", kind: "spaced", before: "===", after: "!==" },
  { operator: "equality", kind: "spaced", before: "!==", after: "===" },
  { operator: "arithmetic", kind: "spaced", before: "+", after: "-" },
  { operator: "arithmetic", kind: "spaced", before: "-", after: "+" },
  { operator: "arithmetic", kind: "spaced", before: "*", after: "/" },
  { operator: "arithmetic", kind: "spaced", before: "/", after: "*" },
  { operator: "logic", kind: "spaced", before: "&&", after: "||" },
  { operator: "logic", kind: "spaced", before: "||", after: "&&" },
  { operator: "negation", kind: "negation" },
  { operator: "number", kind: "number" },
  { operator: "return", kind: "word", before: "return true", after: "return false" },
  { operator: "return", kind: "word", before: "return false", after: "return true" },
  { operator: "return", kind: "word", before: "return null", after: "return undefined" },
];

/** What may sit before a `!` for it to be a negation rather than part of `!==`. */
const BEFORE_NEGATION = "(=,[";
/** What the negation has to be applied to. Letters as well, which are read as a class. */
const AFTER_NEGATION = "([$_";

function isLetterAt(source: string, index: number): boolean {
  const character = source[index];
  if (character === undefined) return false;
  return (character >= "a" && character <= "z") || (character >= "A" && character <= "Z");
}

function getSpacedMatches(source: string, before: string): Found[] {
  const found: Found[] = [];
  for (let at = source.indexOf(before); at !== -1; at = source.indexOf(before, at + 1)) {
    if (!isWhitespaceAt(source, at - 1)) continue;
    if (!isWhitespaceAt(source, at + before.length)) continue;
    found.push({ offset: at, before });
  }
  return found;
}

function getWordMatches(source: string, before: string): Found[] {
  const found: Found[] = [];
  for (let at = source.indexOf(before); at !== -1; at = source.indexOf(before, at + 1)) {
    if (!isWordStart(source, at)) continue;
    if (isWordCharacterAt(source, at + before.length)) continue;
    found.push({ offset: at, before });
  }
  return found;
}

/**
 * A `!` that negates something, taken with the character in front of it.
 *
 * The character in front is part of what is read and is written back unchanged,
 * so the negation is the only thing that goes. What is in front is also what
 * keeps `!==` out of this: an equality's `!` follows a value, and a value is in
 * neither the class below nor whitespace.
 */
function getNegationMatches(source: string): Found[] {
  const found: Found[] = [];
  for (let at = source.indexOf("!"); at !== -1; at = source.indexOf("!", at + 1)) {
    const lead = source[at - 1];
    if (lead === undefined) continue;
    if (!BEFORE_NEGATION.includes(lead) && !isWhitespaceAt(source, at - 1)) continue;

    const next = source[at + 1];
    if (next === undefined) continue;
    if (!isLetterAt(source, at + 1) && !AFTER_NEGATION.includes(next)) continue;

    found.push({ offset: at - 1, before: `${lead}!` });
  }
  return found;
}

/**
 * A whole number, and one more than it.
 *
 * Fenced on both sides by a word boundary, which is what keeps a run of digits
 * inside a name out: `a1` is a name and `x[0]` is a number. A run this cannot
 * read is one past 2^53, and it declines rather than composing a neighbour of
 * itself.
 */
function getNumberMatches(source: string): Found[] {
  const found: Found[] = [];
  let index = 0;
  while (index < source.length) {
    if (!isDigitAt(source, index)) {
      index += 1;
      continue;
    }
    const end = getEndOfDigits(source, index);
    if (isWordStart(source, index) && !isWordCharacterAt(source, end)) {
      found.push({ offset: index, before: source.slice(index, end) });
    }
    index = end;
  }
  return found;
}

function getRuleMatches(source: string, rule: Rule): Found[] {
  if (rule.kind === "spaced") return getSpacedMatches(source, rule.before);
  if (rule.kind === "word") return getWordMatches(source, rule.before);
  if (rule.kind === "negation") return getNegationMatches(source);
  return getNumberMatches(source);
}

/** What the rule puts there instead, or null where it looked and declined. */
function composeAfter(rule: Rule, before: string): string | null {
  if (rule.kind === "spaced" || rule.kind === "word") return rule.after;
  // The character in front of the negation, written back unchanged.
  if (rule.kind === "negation") return before.slice(0, 1);

  const value = getIntegerFromText(before);
  return value === null ? null : composeIntegerText(value + 1);
}

const MODULE_KEYWORDS = ["from", "import", "require"];
const TEST_FILE_SUFFIX = ".test.ts";
const HEADER_TERMINATOR = ":";

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
  // Read backwards from the literal, which is the same shape the other way
  // round: whitespace, an optional opening bracket, whitespace, the keyword.
  let index = start;
  while (index > 0 && isWhitespaceAt(source, index - 1)) index -= 1;
  if (source[index - 1] === "(") {
    index -= 1;
    while (index > 0 && isWhitespaceAt(source, index - 1)) index -= 1;
  }

  return MODULE_KEYWORDS.some((keyword) => {
    const at = index - keyword.length;
    return at >= 0 && source.startsWith(keyword, at) && isWordStart(source, at);
  });
}

export function composeMutations(source: string, file: string): Mutation[] {
  const comments = getCommentRangesFromSource(source);
  const texts = getTextRangesFromSource(source);
  const mutations: Mutation[] = [];

  for (const rule of RULES) {
    for (const { offset, before } of getRuleMatches(source, rule)) {
      // Comments are not code, and a literal's contents are mutated whole below
      // rather than one operator at a time.
      if (isInsideRange(comments, offset, offset + before.length)) continue;
      if (isInsideRange(texts, offset, offset + before.length)) continue;

      const after = composeAfter(rule, before);
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
const ESCAPE_OPEN = "\u001b[";
const ESCAPE_CLOSE = "m";
const ESCAPE_BODY = ";";

/**
 * The line with its colours off.
 *
 * A run that opens an escape and never closes it is left alone rather than cut
 * to the end of the line: it is not an escape, and swallowing the rest would
 * take a test name with it.
 */
function composeWithoutEscapes(line: string): string {
  let kept = "";
  let from = 0;
  for (;;) {
    const at = line.indexOf(ESCAPE_OPEN, from);
    if (at === -1) return kept + line.slice(from);

    let index = at + ESCAPE_OPEN.length;
    while (isDigitAt(line, index) || line[index] === ESCAPE_BODY) index += 1;

    if (line[index] !== ESCAPE_CLOSE) {
      kept += line.slice(from, at + 1);
      from = at + 1;
      continue;
    }
    kept += line.slice(from, at);
    from = index + 1;
  }
}

/**
 * The file a block of results belongs to, off a line that is nothing but its
 * name and a colon.
 *
 * There has to be something in front of the suffix — a bare `.test.ts:` names no
 * file — and nothing in the line may be whitespace, which is what keeps a
 * sentence ending in a filename from reading as a header.
 */
function getTestFileHeader(line: string): string | null {
  if (!line.endsWith(`${TEST_FILE_SUFFIX}${HEADER_TERMINATOR}`)) return null;

  const name = line.slice(0, -HEADER_TERMINATOR.length);
  if (name.length <= TEST_FILE_SUFFIX.length) return null;
  for (let index = 0; index < name.length; index += 1) {
    if (isWhitespaceAt(name, index)) return null;
  }
  return name;
}

export function getFailingTestFiles(output: string): string[] {
  const failing: string[] = [];
  let current: string | null = null;
  for (const raw of output.split("\n")) {
    const line = composeWithoutEscapes(raw).trim();
    const header = getTestFileHeader(line);
    if (header !== null) {
      current = header;
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

/**
 * What a runner killed for running too long answers with, as this one spells it.
 *
 * Read off Bun 1.3.14 on 2026-08-26 rather than assumed: a timed-out `spawnSync`
 * comes back `status: null`, `signal: "SIGTERM"` and an error whose `code` is
 * this, and a runner that is not on the path comes back `code: "ENOENT"`. The
 * `code` is what tells them apart, and `tests/tools/mutation-sweep.test.ts` asks
 * the runner itself rather than holding a sample somebody typed (§7.5).
 */
const TIMEOUT_CODE = "ETIMEDOUT";

/**
 * Whether a spawn that failed is one mutant's doing or the machine's.
 *
 * ⚠️ **`spawnSync` puts both in one field, and the two are opposites.** A runner
 * that cannot be started is true of every run that follows; a runner that ran too
 * long is true of the one mutant that hung it, and the next would have run.
 * Reading the second as the first cost a whole sweep of
 * `src/game/kept-fights.ts`: its 180th mutant flips the filter in the one
 * unbounded loop in the file, the suite ran to the two-minute limit, and the
 * throw unwound past the point where the report is written — so 179 finished
 * mutants, roughly 28 minutes of `bun test`, reached nothing. `composeMutations`
 * is deterministic and that mutant is last, so every future run reached 179/180
 * and threw again
 * (`docs/audits/2026-08-26-the-whole-tree-read-a-fifth-time.md`, F4).
 */
export function isTimeoutFailure(error: unknown): boolean {
  return getRecordFromValue(error)?.["code"] === TIMEOUT_CODE;
}

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
  //
  // A timeout is the other half of that field and the opposite claim, so it is an
  // unfinished mutant and the sweep goes on — `isTimeoutFailure` says why.
  if (result.error !== undefined) {
    if (!isTimeoutFailure(result.error)) {
      throw new MutationSweepError("the gate could not be run", { cause: result.error });
    }
    return { isRed: null, failing: [] };
  }

  // A mutant that stops the suite from loading at all produces no failure line
  // and is still a kill, so the status decides and the names only describe.
  return {
    isRed: result.status === null ? null : result.status !== 0,
    failing: getFailingTestFiles(`${result.stdout ?? ""}\n${result.stderr ?? ""}`),
  };
}

/**
 * Whether the compiler refuses the tree as it stands.
 *
 * `bun run typecheck` rather than `tsc` directly: the second config —
 * `tsconfig.userscript.json`, the browser floor §9.9 states — is half of what the
 * gate checks, and a mutant that only that one refuses is refused just the same.
 *
 * A runner that cannot start throws, for `getGateOutcome`'s reason: it is true of
 * every mutant that follows, and a report of a thousand unclassified survivors
 * says nothing anybody can act on. In a detached worktree that means
 * `bun install` before sweeping.
 *
 * ⚠️ **A timeout throws here and does not there, and the asymmetry is the point.**
 * A mutant can make the test suite loop for ever — that is F4's whole case — and
 * no mutant can make `tsc` loop, so a typecheck that does not finish is the
 * machine and not the mutation. This is also reached only for a survivor, so
 * swallowing it would turn one unclassified answer into a survivor reported as
 * one the compiler accepts.
 */
function getIsRefusedByCompiler(): boolean {
  const result = spawnSync("bun", ["run", "typecheck"], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
    timeout: RUN_TIMEOUT_MILLISECONDS,
  });
  if (result.error !== undefined) {
    throw new MutationSweepError("the typecheck could not be run", { cause: result.error });
  }
  if (result.status === null) {
    throw new MutationSweepError("the typecheck did not finish");
  }
  return result.status !== 0;
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
      // Only a survivor is worth a typecheck, and only a survivor pays for one.
      const isRefusedByCompiler = run.isRed === false && getIsRefusedByCompiler();
      writeFileSync(path, original);
      outcomes.push({
        mutation,
        isKilled: run.isRed,
        killedBy: run.isRed === true ? run.failing : [],
        isShapeOnly: isShapeOnlyKill(run),
        isRefusedByCompiler,
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

/**
 * Where a mutant sits on its line, one-based.
 *
 * A survivor used to name a line and an operator, and `src/ui/panel-view.ts`
 * carries `if (!isCharged(id)) continue;` twice — one held, one not — so the
 * report named a place a reader could not find
 * (`docs/audits/2026-08-21-the-rest-of-the-code-read-for-its-smells.md`, F3). The
 * offset was there all along; only the printing stopped short of it.
 */
function getColumnOfMutation(mutation: Mutation): number {
  const source = readFileSync(REPOSITORY_ROOT + mutation.file, "utf8");
  return mutation.offset - (source.lastIndexOf("\n", mutation.offset - 1) + 1) + 1;
}

function composeMutationLine(mutation: Mutation, trailing: string): string {
  return (
    `  ${mutation.file}:${composeIntegerText(mutation.line)}` +
    `:${composeIntegerText(getColumnOfMutation(mutation))}  ` +
    `${mutation.before} → ${mutation.after}  (${trailing})`
  );
}

function writeSweepReport(outcomes: MutationOutcome[]): void {
  const survived = outcomes.filter(
    (outcome) => outcome.isKilled === false && !outcome.isRefusedByCompiler,
  );
  const refused = outcomes.filter((outcome) => outcome.isRefusedByCompiler);
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
    const alive = forFile.filter(
      (outcome) => outcome.isKilled === false && !outcome.isRefusedByCompiler,
    ).length;
    console.log(
      `${composeIntegerText(forFile.length).padStart(5)} mutants  ` +
        `${composeIntegerText(alive).padStart(4)} survived   ${file}`,
    );
  }

  console.log();
  console.log("survivors");
  for (const { mutation } of survived) console.log(composeMutationLine(mutation, mutation.operator));

  console.log();
  console.log("refused by the compiler, so killed by the gate");
  for (const { mutation } of refused) console.log(composeMutationLine(mutation, mutation.operator));

  console.log();
  console.log("killed only by a guard reading source as text");
  for (const { mutation, killedBy } of shapeOnly) {
    console.log(composeMutationLine(mutation, killedBy.join(", ")));
  }

  if (unfinished.length > 0) {
    console.log();
    console.log("the gate never finished, so these are neither");
    for (const { mutation } of unfinished) {
      console.log(composeMutationLine(mutation, mutation.operator));
    }
  }

  console.log();
  console.log(
    `${composeIntegerText(outcomes.length)} mutants, ` +
      `${composeIntegerText(outcomes.length - survived.length - unfinished.length)} killed, ` +
      `${composeIntegerText(survived.length)} survived, ` +
      `${composeIntegerText(refused.length)} refused by the compiler, ` +
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
