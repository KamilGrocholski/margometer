/**
 * The pieces of a markdown document a guard reads: a section between two headings, a table row as
 * its cells, and a cell with the document's backticks taken off.
 *
 * Five guards read a register this way. Three spelled `getCellsFromLine` and `getBareCell`
 * byte for byte identically and two spelled `getSection`, so a reader that stopped finding its
 * subject would have stopped in one file and gone on working in the others — which is the failure
 * a guard cannot see about itself.
 */

import { assert, assertNotStrictEquals } from "@std/assert";

const CELL_SEPARATOR = "|";
const BACKTICK = "`";

/** The slice between two headings, refused rather than returned empty where either is missing. */
export function getSection(text: string, from: string, to: string): string {
    const start = text.indexOf(from);
    assertNotStrictEquals(start, -1, `${from} is a section of the register`);
    const end = text.indexOf(to, start);
    assert(end > start, `${from} ends where ${to} starts`);
    return text.slice(start, end);
}

export function getCellsFromLine(line: string): string[] {
    const cells: string[] = [];
    let at = line.indexOf(CELL_SEPARATOR);
    assert(at >= 0, "a table line opens with a bar");
    let next = line.indexOf(CELL_SEPARATOR, at + 1);
    // The bound is the line's own length: a table row holds fewer cells than it holds characters.
    for (let held = 0; held < line.length; held += 1) {
        if (next === -1) break;
        cells.push(line.slice(at + 1, next).trim());
        at = next;
        next = line.indexOf(CELL_SEPARATOR, at + 1);
    }
    return cells;
}

/** The backticks are the document's, not the vocabulary's, so they come off before comparing. */
export function getBareCell(cell: string): string {
    const open = cell.indexOf(BACKTICK);
    if (open === -1) return cell;
    const close = cell.indexOf(BACKTICK, open + 1);
    if (close === -1) return cell;
    return cell.slice(open + 1, close);
}

/**
 * The document as one line. **A sentence is the unit, and `deno fmt` owns where it breaks**: it
 * wraps this register's prose at a hundred columns, so a claim read as a substring of a line is a
 * claim that stops being findable the day a word ahead of it changes length. AGENTS.md names the
 * same trap for the markers a guard searches for.
 */
export function getUnwrapped(text: string): string {
    const words: string[] = [];
    for (const line of text.split("\n")) {
        for (const word of line.split(" ")) {
            if (word.length === 0) continue;
            words.push(word);
        }
    }
    assert(words.length > 0, "a document being read says something");
    return words.join(" ");
}
