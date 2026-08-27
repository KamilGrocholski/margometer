/**
 * Holds `docs/specs/` to a shape.
 *
 * There is deliberately no index file. The previous incarnation kept one by
 * hand and it listed nine specs while the directory held eleven — the directory
 * is the index, and cannot disagree with itself.
 */

import { expectDatedName } from "@/tests/dated-document.ts";
import { getLabelledLine, hasLine } from "@/tests/document-lines.ts";
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";

const SPECS_DIRECTORY = new URL("../../docs/specs/", import.meta.url).pathname;
const SPEC_FILES = readdirSync(SPECS_DIRECTORY).filter((file) => file.endsWith(".md"));

const STATUS_LABEL = "Status: ";
const TITLE_LABEL = "# ";
const STATUSES = ["draft", "implemented"];
const REJECTED_HEADING = "## Rejected alternatives";

test("there are specs to check", () => {
  expect(SPEC_FILES.length).toBeGreaterThan(0);
});

describe.each(SPEC_FILES)("%s", (file) => {
  const lines = readFileSync(SPECS_DIRECTORY + file, "utf8").split("\n");

  test("is named for the day it was written", () => {
    expectDatedName(file);
  });

  // Third line, not somewhere in the body: a status that has to be searched for
  // is a status nobody updates. The commit that carries the file is what says
  // *when* — git already holds that, so the spec does not repeat it.
  test("states its status where it cannot be missed", () => {
    expect(getLabelledLine(lines[0] ?? "", TITLE_LABEL)).not.toBeNull();
    expect(STATUSES).toContain(getLabelledLine(lines[2] ?? "", STATUS_LABEL) ?? "");
  });

  test("records what was rejected, not only what was chosen", () => {
    expect(hasLine(readFileSync(SPECS_DIRECTORY + file, "utf8"), REJECTED_HEADING)).toBe(true);
  });
});
