import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { composeHexadecimalByteText } from "@/libs/number.ts";
import { composeShotFileName, PANEL_SHOTS } from "@/tools/panel-screenshots.ts";

/**
 * Every file this repository writes is text a text tool can read.
 *
 * ⚠️ **Paid for twice in one day.** `tests/game/engine-battle-wrap.test.ts`
 * joined two lists on a separator written as a literal NUL instead of an escape.
 * TypeScript accepts it and bun runs it, so the gate had nothing to say — and
 * `grep -r` skipped all 572 lines of it in silence, which is the file holding
 * the promises this add-on makes to the game. A coverage sweep then reported
 * four of the wrap's exports as named by no test; all four are imported at the
 * head of that file (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F1).
 *
 * The audit reporting it then did the same thing in the sentence describing it,
 * and went into git as a binary blob — `1 file changed, 0 insertions(+)` was the
 * only sign. That is the whole argument for a guard rather than for care: the
 * byte is invisible in the editor, in the diff and in the gate, so every place a
 * person would look is a place it cannot be seen.
 *
 * ⚠️ **Rejected: binding this to `.ts` files.** The second instance was a
 * Markdown document under `docs/`, so a guard over source alone would have
 * agreed with the bug it was written to prevent — the failure §7.5 names.
 *
 * ⚠️ **Rejected: asking `file(1)`, or git's own binary heuristic.** Both call a
 * file carrying an ESC byte text, and `tools/mutation-sweep.ts` was carrying one
 * — a raw escape character opening the pattern that strips escape codes. A
 * verdict derived from somebody else's heuristic is the shape §7.5 refuses:
 * where a byte can carry the answer, nothing else may judge.
 */

const REPOSITORY_ROOT = new URL("../../", import.meta.url).pathname;

/**
 * Tab, newline and carriage return. Everything else below a space, and the
 * delete character, is a byte nobody can see in the place they would look.
 */
const ALLOWED_CONTROL_BYTES = new Set([9, 10, 13]);

function isControlByte(byte: number): boolean {
  return (byte < 0x20 && !ALLOWED_CONTROL_BYTES.has(byte)) || byte === 0x7f;
}

/**
 * Two directories are left out, and neither for convenience.
 *
 * `tests/captured-fights/` is evidence, and §9.2 forbids editing it at all. A
 * guard whose only remedy is a rule this repository refuses to break is a guard
 * that would have to be turned off the first time it fired.
 *
 * `screenshots/` is images by intent, and that is the whole of the argument.
 * What this guard is about is a byte nobody can see **in a file a person reads as
 * text** — a NUL in a test that made `grep -r` skip it in silence, an ESC in a
 * document that went into git as a blob. A PNG is not read that way: there is no
 * editor view, no diff and no `grep` result for an exemption to hide something
 * from.
 *
 * ⚠️ **The sidecar in that directory stays inside this guard**, which is why the
 * exemption is written against the image names rather than against the directory.
 * `screenshots/taken-at.json` is the file that says which release the pictures are
 * of, it is read by a person and by `tests/tools/panel-screenshots.test.ts`, and a
 * JSON document parses perfectly well with a NUL inside it — exactly the failure
 * with no symptom this exists for.
 */
const UNREADABLE_BY_DESIGN = [
  (file: string) => file.startsWith("tests/captured-fights/"),
  (file: string) =>
    file.startsWith("screenshots/") && PANEL_SHOTS.some((shot) => file.endsWith(composeShotFileName(shot))),
];

function getWrittenFiles(): string[] {
  return execFileSync("git", ["ls-files"], { cwd: REPOSITORY_ROOT, encoding: "utf8" })
    .split("\n")
    .filter((file) => file !== "" && !UNREADABLE_BY_DESIGN.some((isExempt) => isExempt(file)));
}

const WRITTEN_FILES = getWrittenFiles();

// A loop over nothing is green and proves nothing — §9.2's rule for the
// captures, and it holds for any set discovered rather than listed.
test("there are files to read", () => {
  expect(WRITTEN_FILES.length).toBeGreaterThan(0);
});

describe.each(WRITTEN_FILES)("%s", (file) => {
  /**
   * Read as bytes rather than as text, and the scan is exact either way: every
   * byte of a multi-byte UTF-8 sequence is at least `0x80`, so a byte below
   * `0x20` is a code point below `0x20` and never part of a longer character.
   */
  test("carries no byte a reader cannot see", () => {
    const contents = readFileSync(REPOSITORY_ROOT + file);
    const found: string[] = [];
    let line = 1;
    for (const byte of contents) {
      if (byte === 10) line += 1;
      if (isControlByte(byte)) found.push(`${file}:${line} 0x${composeHexadecimalByteText(byte)}`);
    }
    expect(found).toEqual([]);
  });
});
