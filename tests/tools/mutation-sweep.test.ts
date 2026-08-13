import { describe, expect, test } from "bun:test";
import {
  composeMutatedSource,
  composeMutations,
  getFailingTestFiles,
  getSweptFiles,
  MutationSweepError,
  type Mutation,
} from "@/tools/mutation-sweep.ts";

/**
 * The half of the sweep that decides what to break, held without breaking
 * anything.
 *
 * The other half writes mutants into the working tree and runs the gate, and it
 * is deliberately not exercised here: a test that mutates the files a test run
 * is reading is a test that can leave the tree changed when it fails. What
 * protects that half is stated where it lives — a refusal to start against a
 * dirty tree, and the original written back from memory after every run.
 *
 * ⚠️ **The load-bearing test is the round trip.** Everything else here is about
 * finding good mutants; that one is about giving the file back. A sweep that
 * loses a byte of somebody's source has done more damage than every finding it
 * could ever report.
 */

const SAMPLE = [
  'import { getIntegerFromText } from "@/libs/number.ts";',
  "",
  "// a comment with a > b and 12 in it",
  "/* and a block one with === and a string \"here\" */",
  "function getThing(count: number): string {",
  '  if (count > 3 && count !== 0) return "many";',
  '  const text = `a template with ${count} in it`;',
  "  return text;",
  "}",
].join("\n");

function getMutationsOf(source: string): Mutation[] {
  return composeMutations(source, "sample.ts");
}

function getOperatorsAt(source: string, needle: string): string[] {
  const offset = source.indexOf(needle);
  return getMutationsOf(source)
    .filter((mutation) => mutation.offset >= offset && mutation.offset < offset + needle.length)
    .map((mutation) => mutation.operator);
}

describe("what gets mutated", () => {
  test("every family this sweep knows produces a mutant", () => {
    const source = [
      "const a = x > 1;",
      "const b = x === y;",
      "const c = x + y;",
      "const d = x && y;",
      "const e = !x;",
      'const f = "word";',
      "function isThing(): boolean { return true; }",
    ].join("\n");
    expect([...new Set(getMutationsOf(source).map((mutation) => mutation.operator))].sort()).toEqual(
      ["arithmetic", "comparison", "equality", "logic", "negation", "number", "return", "text"],
    );
  });

  /**
   * A mutant inside a comment survives every test that will ever be written, so
   * it is not evidence of anything — it is the report filling up with noise
   * until nobody reads the survivors, which is the failure mode of the whole
   * exercise rather than a rough edge.
   */
  test("a comment is not code", () => {
    expect(getOperatorsAt(SAMPLE, "// a comment with a > b and 12 in it")).toEqual([]);
    expect(getOperatorsAt(SAMPLE, '/* and a block one with === and a string "here" */')).toEqual([]);
  });

  // The interior of a literal is mutated whole, below — one operator at a time
  // inside a sentence produces a hundred mutants of one string.
  test("an operator inside a literal is left to the text rule", () => {
    const source = 'const label = "raw > applied and a === b";';
    expect(getMutationsOf(source).map((mutation) => mutation.operator)).toEqual(["text"]);
  });

  test("a literal is replaced whole, and a template is left alone", () => {
    const text = getMutationsOf(SAMPLE).filter((mutation) => mutation.operator === "text");
    expect(text.map((mutation) => mutation.before)).toEqual(['"many"']);
  });

  /**
   * Mutating a module specifier breaks the import, which kills the mutant by
   * making the file unloadable. Every test in the suite goes red and not one of
   * them was asked a question.
   */
  test("the name of a module is not text the add-on says", () => {
    const specifiers = getMutationsOf(SAMPLE).filter((mutation) =>
      mutation.before.includes("@/libs/"),
    );
    expect(specifiers).toEqual([]);
  });

  test("an empty literal has nothing to say differently", () => {
    expect(getMutationsOf('const nothing = "";')).toEqual([]);
  });

  test("a number is moved by one, and a digit inside a name is not a number", () => {
    const source = "const size = 41;\nconst name = thing2;";
    const numbers = getMutationsOf(source).filter((mutation) => mutation.operator === "number");
    expect(numbers.map((mutation) => `${mutation.before}→${mutation.after}`)).toEqual(["41→42"]);
  });

  // `!==` is an equality operator with a negation inside it, and dropping that
  // `!` leaves `==`, which is a different rule about a different thing.
  test("a negation is dropped, but not out of an inequality", () => {
    const source = "const a = !ready;\nconst b = x !== y;";
    const negations = getMutationsOf(source).filter(
      (mutation) => mutation.operator === "negation",
    );
    expect(negations.length).toBe(1);
    expect(composeMutatedSource(source, negations[0] as Mutation)).toContain("const a = ready;");
  });

  test("a mutation carries the line a person would look at", () => {
    const source = "const a = 1;\nconst b = 2;\nconst c = 3;";
    const third = getMutationsOf(source).find((mutation) => mutation.before === "3");
    expect(third?.line).toBe(3);
  });
});

describe("applying one", () => {
  /**
   * The one that matters. Every mutant is written into the file a person is
   * working in, and the only thing standing between this tool and their source
   * is that the change it makes can be taken back exactly.
   */
  test("what it changes, it changes back byte for byte", () => {
    for (const mutation of getMutationsOf(SAMPLE)) {
      const mutated = composeMutatedSource(SAMPLE, mutation);
      expect(mutated).not.toBe(SAMPLE);
      const restored =
        mutated.slice(0, mutation.offset) +
        mutation.before +
        mutated.slice(mutation.offset + mutation.after.length);
      expect(restored).toBe(SAMPLE);
    }
  });

  test("it changes exactly the span it named", () => {
    const mutation = getMutationsOf(SAMPLE).find((one) => one.operator === "text")!;
    expect(SAMPLE.slice(mutation.offset, mutation.offset + mutation.before.length)).toBe(
      mutation.before,
    );
  });

  // A mutation is composed against one reading of a file and applied to
  // another only if something has gone wrong in between. Refusing loudly is the
  // difference between a failed run and a file quietly holding a mutant.
  test("it refuses a file that no longer reads the way it was measured", () => {
    const mutation = getMutationsOf(SAMPLE)[0] as Mutation;
    expect(() => composeMutatedSource(`x\n${SAMPLE}`, mutation)).toThrow(MutationSweepError);
  });
});

describe("reading what the gate said", () => {
  // The shape `bun test` prints: the file as a heading, its failures beneath it.
  const OUTPUT = [
    "bun test v1.3.14 (0d9b296a)",
    "",
    "tests/libs/record.test.ts:",
    "error: expect(received).toBeNull()",
    "(fail) refusing a list > refuses an array [0.11ms]",
    "(fail) refusing a list > refuses an empty array [0.02ms]",
    "tests/ui/panel-view.test.ts:",
    "(fail) the ranking > numbers its rows [1.20ms]",
    "Ran 2 tests across 2 files.",
  ].join("\n");

  test("names every file that went red, once each", () => {
    expect(getFailingTestFiles(OUTPUT)).toEqual([
      "tests/libs/record.test.ts",
      "tests/ui/panel-view.test.ts",
    ]);
  });

  test("a green run names nobody", () => {
    expect(getFailingTestFiles("bun test v1.3.14\n\n 2000 pass\n 0 fail\n")).toEqual([]);
  });
});

describe("what gets swept", () => {
  /**
   * Discovered rather than listed, for `source-layout.test.ts`'s reason: a file
   * added to a directory nobody re-reads is a file this never asks a question
   * about, and its absence looks exactly like a clean sweep.
   */
  test("everything that ships or supports shipping, and no test", () => {
    const files = getSweptFiles();
    expect(files).toContain("src/core/fight-decoder.ts");
    expect(files).toContain("libs/number.ts");
    expect(files).toContain("tools/mutation-sweep.ts");
    expect(files).toContain("build.ts");
    expect(files.filter((file) => file.includes(".test."))).toEqual([]);
    expect(files.filter((file) => file.startsWith("tests/"))).toEqual([]);
  });

  test("and every one of them is somewhere to break", () => {
    expect(getSweptFiles().length).toBeGreaterThan(0);
  });
});
