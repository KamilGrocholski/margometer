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

/** Code only: comments dropped, string bodies blanked, quotes kept so offsets survive. */
export function getCodeOutsideStrings(line: string): string {
    const commentAt = line.indexOf("//");
    const source = commentAt === -1 ? line : line.slice(0, commentAt);
    let code = "";
    let quote = "";
    let index = 0;
    while (index < source.length) {
        const character = source.charAt(index);
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
        if (QUOTES.includes(character)) quote = character;
        code += character;
        index += 1;
    }
    assert(code.length <= source.length + 1, "blanking never grows a line");
    assert(!code.includes("//"), "a comment is dropped before quotes are read");
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
