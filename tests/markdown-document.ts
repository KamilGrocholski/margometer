/**
 * The pieces of a markdown register a guard reads: a table row as its cells, the document's
 * backticks taken off, and the document's prose as one line. Shared, because a reader that stopped
 * finding its subject in one guard's copy would go on working in another's.
 */

import { assert } from "@std/assert";

const CELL_SEPARATOR = "|";
const BACKTICK = "`";

/** Every cell of a table row, trimmed and with one pair of the document's backticks off. */
export function parseTableCells(line: string): string[] {
    const cells: string[] = [];
    let at = line.indexOf(CELL_SEPARATOR);
    assert(at >= 0, "a table line opens with a bar");
    let next = line.indexOf(CELL_SEPARATOR, at + 1);
    // A row holds fewer cells than it holds characters, so its length bounds the walk.
    for (let held = 0; held < line.length; held += 1) {
        if (next === -1) break;
        cells.push(parseTableCellsBare(line.slice(at + 1, next).trim()));
        at = next;
        next = line.indexOf(CELL_SEPARATOR, at + 1);
    }
    return cells;
}

/** The backticks are the document's, not the vocabulary's, so they come off before comparing. */
function parseTableCellsBare(cell: string): string {
    const open = cell.indexOf(BACKTICK);
    if (open === -1) return cell;
    const close = cell.indexOf(BACKTICK, open + 1);
    if (close === -1) return cell;
    return cell.slice(open + 1, close);
}

/**
 * The document as one line. ⚠️ **`deno fmt` owns where a sentence breaks**, at a hundred columns,
 * so a claim read as part of one line stops being findable the day a word ahead of it changes length.
 */
export function parseUnwrappedText(text: string): string {
    const words: string[] = [];
    for (const line of text.split("\n")) {
        for (const word of line.split(" ")) {
            if (word.length > 0) words.push(word);
        }
    }
    assert(words.length > 0, "a document being read says something");
    return words.join(" ");
}
