/**
 * The wall in front of `TODO.md`, held to still being there.
 *
 * §5 says no tool writes to that file: it is the maintainer's own task list,
 * kept by hand. §7.5 puts a guard first wherever a machine can hold a rule — and
 * what a machine here cannot hold is *who* edited a file, because a diff records
 * the change and never the hand. What it can hold is the tool call, denied in
 * `.claude/settings.json` before it runs.
 *
 * So this guards the one thing that would otherwise go quiet: the deny list
 * emptied, renamed or reduced to a subset of the tools that can write. Nothing
 * else in the tree reads that file, and a rule whose enforcement disappeared is
 * indistinguishable from a rule being obeyed.
 */

import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getValueFromJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

const SETTINGS_PATH = ".claude/settings.json";

/** The hand-kept file, and every tool call shaped like a write to it. */
const HAND_KEPT_FILE = "TODO.md";
const WRITING_TOOLS = ["Edit", "Write", "NotebookEdit"];

/**
 * Read the way §9.5 requires rather than with a cast: settings are a file on
 * disk, so every field is external data, and one arriving as `undefined` would
 * make the check below pass by finding nothing to object to.
 */
function getDenyRules(): string[] {
  const { value, syntaxError } = getValueFromJsonText(
    readFileSync(REPOSITORY_ROOT + SETTINGS_PATH, "utf8"),
  );
  expect(syntaxError).toBeNull();

  const permissions = getRecordFromValue(getRecordFromValue(value)?.["permissions"]);
  const deny = permissions?.["deny"];
  return Array.isArray(deny) ? deny.filter((rule): rule is string => typeof rule === "string") : [];
}

describe("the permissions this repository ships", () => {
  const DENY_RULES = getDenyRules();

  // Counted, because every check below is a search through this list, and a
  // search through nothing reports nothing wrong.
  test("there are deny rules to read", () => {
    expect(DENY_RULES.length).toBeGreaterThan(0);
  });

  test.each(WRITING_TOOLS)("`%s` cannot reach the hand-kept file", (tool) => {
    const covering = DENY_RULES.filter(
      (rule) => rule.startsWith(`${tool}(`) && rule.includes(HAND_KEPT_FILE),
    );
    expect(covering).not.toEqual([]);
  });

  /**
   * The wall and the sentence, held together. A deny rule with no rule behind it
   * is a setting somebody will read as arbitrary and drop; a rule with no deny
   * rule behind it is the half §7.5 says to write down only when a machine
   * cannot hold it — and here one can.
   */
  test("and the rules say so in words", () => {
    const rules = readFileSync(`${REPOSITORY_ROOT}AGENTS.md`, "utf8");
    expect(rules).toContain(`**Write to \`${HAND_KEPT_FILE}\`.**`);
  });
});
