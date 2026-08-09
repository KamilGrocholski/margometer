import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

/**
 * Holds `docs/specs/` to a shape.
 *
 * There is deliberately no index file. The previous incarnation kept one by
 * hand and it listed nine specs while the directory held eleven — the directory
 * is the index, and cannot disagree with itself.
 */

const SPECS_DIRECTORY = new URL("../docs/specs/", import.meta.url).pathname;
const SPEC_FILES = readdirSync(SPECS_DIRECTORY).filter((file) => file.endsWith(".md"));

const DATED_NAME = /^(\d{4})-(\d{2})-(\d{2})-[a-z0-9]+(-[a-z0-9]+)*\.md$/;
const STATUS_LINE = /^Status: (draft|implemented)$/;

test("there are specs to check", () => {
  expect(SPEC_FILES.length).toBeGreaterThan(0);
});

describe.each(SPEC_FILES)("%s", (file) => {
  const lines = readFileSync(SPECS_DIRECTORY + file, "utf8").split("\n");

  test("is named for the day it was written", () => {
    expect(file).toMatch(DATED_NAME);
    const date = file.slice(0, "yyyy-mm-dd".length);
    expect(Number.isNaN(Date.parse(date))).toBe(false);
    expect(Date.parse(date)).toBeLessThanOrEqual(Date.now());
  });

  // Third line, not somewhere in the body: a status that has to be searched for
  // is a status nobody updates. The commit that carries the file is what says
  // *when* — git already holds that, so the spec does not repeat it.
  test("states its status where it cannot be missed", () => {
    expect(lines[0]).toMatch(/^# .+/);
    expect(lines[2]).toMatch(STATUS_LINE);
  });

  test("records what was rejected, not only what was chosen", () => {
    expect(readFileSync(SPECS_DIRECTORY + file, "utf8")).toMatch(/^## Rejected alternatives$/m);
  });
});
