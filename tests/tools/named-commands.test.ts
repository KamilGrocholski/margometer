/**
 * Every command this repository names — the scripts and the workflow steps — and
 * what the gate is made of.
 *
 * §6.1 says the gate is one command so there is no version of "I ran the tests but
 * not the build". That arrived as prose and nothing held it: the two places a
 * command can be named without anybody choosing to type it — `package.json`'s
 * scripts and `.github/workflows/` — were read by no test.
 *
 * The pair to `tests/tools/agent-permissions.test.ts`, and for its reason: what no
 * machine here can hold is whether somebody ran a tool, and what it can hold is the
 * place a tool has to be named to run without being asked.
 *
 * ⚠️ **Commands, not the file's text.** A workflow here carries more comment than
 * YAML, so a search over the whole file would go red on a comment. What is read is
 * the `run:` steps, and block scalars are read with them because
 * `.github/workflows/release.yml` puts most of its commands inside `run: |`. A
 * reader that stopped at the inline shape would pass that file while looking at two
 * of its steps.
 *
 * ⚠️ **A workflow git does not track does not run**, so the list comes from
 * `git ls-files`: a new one written straight to disk is invisible here until it is
 * staged, which is §7.5's trap and not this guard's to solve.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { getValueFromJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

const WORKFLOWS_DIRECTORY = ".github/workflows";


/**
 * Read the way §9.5 requires rather than with a cast: `package.json` is a file on
 * disk, so every field is external data, and a `scripts` object arriving as
 * `undefined` would make every search below pass by finding nothing to object to.
 */
function getScripts(): Record<string, string> {
  const { value, syntaxError } = getValueFromJsonText(
    readFileSync(REPOSITORY_ROOT + "package.json", "utf8"),
  );
  expect(syntaxError).toBeNull();

  const scripts = getRecordFromValue(getRecordFromValue(value)?.["scripts"]);
  const named: Record<string, string> = {};
  for (const [name, command] of Object.entries(scripts ?? {})) {
    if (typeof command === "string") named[name] = command;
  }
  return named;
}

function getWorkflowFiles(): string[] {
  return execFileSync("git", ["ls-files", "--", WORKFLOWS_DIRECTORY], {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => file !== "");
}

const LIST_ITEM_PREFIX = "- ";
const RUN_KEY = "run:";

/** What a value of `|` or `>` says: the command is the lines indented below. */
const BLOCK_SCALAR_HEADS = ["|", ">", "|-", ">-", "|+", ">+"];

/**
 * The `run:` steps of one workflow, in the order the file writes them.
 *
 * **Extracted with structure, not with a search** (§7.5). Indentation is the
 * whole of what separates a block scalar's lines from the key that follows it, so
 * indentation is what this reads: a step is a list item, its key may sit behind
 * `- `, and the key's own column — the dash counted in — is what the lines under
 * it are measured against.
 *
 * `runs-on:` is why the key is matched with its colon rather than as a word. A
 * comment line is skipped at the top level and kept inside a block, where `#` is
 * the shell's and part of the command.
 */
function getRunCommandsFromWorkflow(source: string): string[] {
  const lines = source.split("\n");
  const commands: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    index += 1;

    const trimmed = line.trimStart();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const isListItem = trimmed.startsWith(LIST_ITEM_PREFIX);
    const keyText = isListItem ? trimmed.slice(LIST_ITEM_PREFIX.length) : trimmed;
    if (!keyText.startsWith(RUN_KEY)) continue;

    const keyIndent =
      line.length - trimmed.length + (isListItem ? LIST_ITEM_PREFIX.length : 0);
    const value = keyText.slice(RUN_KEY.length).trim();
    if (!BLOCK_SCALAR_HEADS.includes(value)) {
      commands.push(value);
      continue;
    }

    const block: string[] = [];
    while (index < lines.length) {
      const next = lines[index] ?? "";
      const isOutdented =
        next.trim() !== "" && next.length - next.trimStart().length <= keyIndent;
      if (isOutdented) break;
      block.push(next.trim());
      index += 1;
    }
    commands.push(block.join("\n"));
  }
  return commands;
}

const SCRIPTS = getScripts();
const WORKFLOW_FILES = getWorkflowFiles();

const COMMANDS_BY_WORKFLOW = new Map(
  WORKFLOW_FILES.map((file) => [
    file,
    getRunCommandsFromWorkflow(readFileSync(REPOSITORY_ROOT + file, "utf8")),
  ]),
);

const WORKFLOW_COMMANDS = [...COMMANDS_BY_WORKFLOW.values()].flat();

/**
 * Everything below is a search, and a search through nothing reports nothing
 * wrong — `agent-permissions.test.ts` counts its deny rules for the same reason,
 * and `structure-block.test.ts` records a walker mutated to return nothing
 * leaving two of three tests green.
 */
describe("the commands this repository names", () => {
  test("there are scripts and workflows to read", () => {
    expect(Object.keys(SCRIPTS).length).toBeGreaterThan(0);
    expect(WORKFLOW_FILES.length).toBeGreaterThan(0);
  });

  test.each(WORKFLOW_FILES)("%s yielded at least one command", (file) => {
    expect(COMMANDS_BY_WORKFLOW.get(file) ?? [], file).not.toEqual([]);
  });

  // The inline shape, which is what a reader gets right first.
  test("and the gate is among what was read", () => {
    expect(WORKFLOW_COMMANDS).toContain("bun run check");
  });

  /**
   * The block shape, which is the one that goes quiet. Taken from
   * `.github/workflows/release.yml`'s ancestry check — the first `run: |` in the
   * tree, and a step whose whole content sits below its key.
   */
  test("and so is what a block scalar carries", () => {
    const inBlocks = WORKFLOW_COMMANDS.filter((command) =>
      command.includes("git merge-base --is-ancestor"),
    );
    expect(inBlocks).not.toEqual([]);
  });
});

/**
 * §6.1's first sentence, made mechanical: the gate is one command so there is no
 * version of "I ran the tests but not the build" — and no version of one that
 * sweeps, either. Written out rather than read off the rule's own code block,
 * because a guard that takes its expectation from the document it is checking
 * holds the two to be the same and neither to be right (§7.5).
 */
describe("§6.1's gate", () => {
  const GATE_LINKS = ["bun run typecheck", "bun test", "bun run build"];

  test("is typecheck, tests and build, and nothing else", () => {
    const gate = SCRIPTS["check"] ?? "";
    expect(gate.split("&&").map((link) => link.trim())).toEqual(GATE_LINKS);
  });
});
