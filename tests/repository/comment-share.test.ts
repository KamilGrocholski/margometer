/**
 * C4 and C16: a file's docblock runs to eight lines of prose at most, and no directory of the
 * program or its tools is past its share of comment. A comment line counts where it carries a
 * word: a docblock's marks and the blank line between its paragraphs are punctuation.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import {
    composeSample,
    readCommentTexts,
    readSourceFiles,
    SOURCE_DIRECTORIES,
    type SourceFile,
} from "#/tests/source-tree.ts";

interface CommentShare {
    worded: number;
    held: number;
}

const DOCBLOCK_PROSE_MAXIMUM = 8;
const DIRECTORY_SHARE_PERCENT_MAXIMUM = 22;
const DIRECTORY_ROOTS = ["src/", "tools/"];
const DOCBLOCK_OPENER = "/**";
const COMMENT_MARGIN = "*";
/** How a docblock sets a command apart from its prose, as Markdown reads an indented block. */
const LISTING_INDENT = "    ";

Deno.test("a docblock counts its prose, and not its marks, its breaks or a command", () => {
    const listed = composeSample([
        "/**",
        " * What it is for.",
        " *",
        " * And how.",
        " *",
        " *     deno task shots --release",
        " */",
        "export const HELD = 1;",
    ]);
    assertStrictEquals(countDocblockProse(listed), 2, "two lines of prose");
    const opensOnCode = composeSample(["export const HELD = 1; // A word."]);
    assertStrictEquals(countDocblockProse(opensOnCode), 0, "a file opening on code has none");
});

function countDocblockProse(file: SourceFile): number {
    if (!file.text.startsWith(DOCBLOCK_OPENER)) return 0;
    const docblock = readCommentTexts(file)[0];
    assert(docblock !== undefined, "a file opening on a docblock has a comment");
    let counted = 0;
    for (const line of docblock.split("\n")) {
        const text = readCommentLineText(line);
        if (text.startsWith(LISTING_INDENT)) continue;
        if (hasWord(text)) counted += 1;
    }
    return counted;
}

/** A comment line past its margin: the space and the star a block writes before its text. */
function readCommentLineText(line: string): string {
    const trimmed = line.trimStart();
    const text = trimmed.startsWith(COMMENT_MARGIN) ? trimmed.slice(COMMENT_MARGIN.length) : line;
    return text.startsWith(" ") ? text.slice(1) : text;
}

/** A letter in any alphabet, or a digit: what a word is made of, and punctuation is not. */
function hasWord(text: string): boolean {
    for (const character of text) {
        if (character.toLowerCase() !== character.toUpperCase()) return true;
        if (character >= "0") {
            if (character <= "9") return true;
        }
    }
    return false;
}

Deno.test("no docblock runs past eight lines of prose", () => {
    const over: string[] = [];
    for (const file of readSourceFiles(SOURCE_DIRECTORIES)) {
        const prose = countDocblockProse(file);
        if (prose > DOCBLOCK_PROSE_MAXIMUM) over.push(`${file.path} at ${prose}`);
    }
    assertEquals(over, [], "C4");
});

Deno.test("a file's share counts the comment lines carrying a word, over the lines it holds", () => {
    const sample = composeSample([
        "/**",
        " * One.",
        " *",
        " * Two.",
        " */",
        "export const HELD = 1; // Three.",
        "",
    ]);
    assertEquals(
        readCommentShare(sample),
        { worded: 3, held: 6 },
        "the marks and the tail are not",
    );
});

function readCommentShare(file: SourceFile): CommentShare {
    let worded = 0;
    for (const comment of readCommentTexts(file)) {
        for (const line of comment.split("\n")) {
            if (hasWord(readCommentLineText(line))) worded += 1;
        }
    }
    const lines = file.text.split("\n");
    const held = lines[lines.length - 1] === "" ? lines.length - 1 : lines.length;
    assert(worded <= held, "a comment line is a line of the file");
    return { worded, held };
}

Deno.test("no directory of the program or its tools is past its share of comment", () => {
    const shares = new Map<string, CommentShare>();
    for (const file of readSourceFiles(SOURCE_DIRECTORIES)) {
        if (!DIRECTORY_ROOTS.some((root) => file.path.startsWith(root))) continue;
        const directory = file.path.slice(0, file.path.lastIndexOf("/"));
        const share = readCommentShare(file);
        const summed = shares.get(directory) ?? { worded: 0, held: 0 };
        shares.set(directory, {
            worded: summed.worded + share.worded,
            held: summed.held + share.held,
        });
    }
    assert(shares.size > 0, "there are directories to measure");
    const over: string[] = [];
    for (const [directory, share] of shares) {
        if (share.worded * 100 >= DIRECTORY_SHARE_PERCENT_MAXIMUM * share.held) {
            over.push(`${directory} at ${share.worded} of ${share.held}`);
        }
    }
    assertEquals(over, [], "C16");
});
