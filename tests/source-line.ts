/**
 * A line of TypeScript, read for what it is: its code without strings, and whether it is comment.
 *
 * A guard that reads source for a forbidden spelling reads its own samples too, and a
 * scanner that meets an apostrophe in prose runs to the end of the line believing it is
 * inside a literal. Both were paid for. C7 forbids a pattern, so this walks.
 */

import { assert } from "@std/assert";

const QUOTES = "\"'`";
const COMMENT_OPENERS = ["//", "/*", "*/", "*"];

/** Whether a line carries comment and nothing a reader of code should count. */
export function isCommentLine(line: string): boolean {
    const trimmed = line.trimStart();
    assert(trimmed.length <= line.length, "trimming never lengthens a line");
    return COMMENT_OPENERS.some((opener) => trimmed.startsWith(opener));
}

/**
 * Whether a comment line carries a word, as opposed to the frame around one.
 *
 * ⚠️ **A docblock's opening and closing lines, and the blank continuation between its
 * paragraphs, are punctuation.** Counting them charged a share to the shape of a comment rather
 * than to its text, and the tree pressed against C5 on lines carrying no word. **ADR 0075.**
 */
export function hasCommentWord(line: string): boolean {
    if (!isCommentLine(line)) return false;
    let held = line.trimStart();
    for (const opener of COMMENT_OPENERS) {
        if (!held.startsWith(opener)) continue;
        held = held.slice(opener.length);
        break;
    }
    for (const one of held) {
        if (one >= "a" && one <= "z") return true;
        if (one >= "A" && one <= "Z") return true;
        if (one >= "0" && one <= "9") return true;
    }
    return false;
}

/**
 * Code only: comments dropped, string bodies blanked, quotes kept so offsets survive.
 *
 * ⚠️ **A comment is found on the same walk as the quotes, never before it.** Cutting the line at
 * its first `//` first read `"https://…"` as a comment opening inside a literal: the quote never
 * closed, and every call, assertion and construct written after it was blanked for the seven
 * guards standing on this reader. Measured 2026-09-10, 22 lines in the tree carry one.
 */
export function getCodeOutsideStrings(line: string): string {
    let code = "";
    let quote = "";
    let index = 0;
    while (index < line.length) {
        const character = line.charAt(index);
        if (character === "\\") {
            code += quote === "" ? "\\" : " ";
            code += " ";
            index += 2;
            continue;
        }
        if (quote !== "") {
            code += " ";
            if (character === quote) quote = "";
            index += 1;
            continue;
        }
        if (character === "/") {
            if (line.charAt(index + 1) === "/") break;
        }
        if (QUOTES.includes(character)) quote = character;
        code += character;
        index += 1;
    }
    assert(code.length <= line.length + 1, "blanking never grows a line");
    assert(!code.includes("//"), "no comment survives into the code a guard reads");
    return code;
}

export function countCallsOutsideStrings(line: string, names: readonly string[]): number {
    const code = getCodeOutsideStrings(line);
    let count = 0;
    let steps = 0;
    for (const name of names) {
        assert(name.length > 0, "a name to search for is never empty");
        let index = code.indexOf(name + "(");
        while (index !== -1) {
            steps += 1;
            assert(steps <= code.length, "the scan stays inside the line's bound");
            const before = index === 0 ? " " : code.charAt(index - 1);
            const isWordCharacter = before === "." || (before >= "a" && before <= "z");
            if (!isWordCharacter) count += 1;
            index = code.indexOf(name + "(", index + name.length);
        }
    }
    assert(count >= 0, "a count never falls below nothing");
    assert(count <= code.length, "a line holds no more calls than characters");
    return count;
}

export function hasOutsideStrings(line: string, needle: string): boolean {
    return getCodeOutsideStrings(line).includes(needle);
}
