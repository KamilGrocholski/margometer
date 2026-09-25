/**
 * A register's pipe table, read back out of its document from under its own heading, so a suite
 * can hold what a document states to what a tool produces. A row is read by its count of cells,
 * which is what tells one table from the next under the same heading.
 */

import { assert } from "@std/assert";
import { parseInteger } from "#/libs/number-text.ts";

const ROW_OPENER = "| ";
const CELL_MARK = "|";
const LINE_BREAK = "\n";

/** Every row of exactly `cells` cells from the heading down, each cell trimmed. */
export function parseTableRows(text: string, heading: string, cells: number): string[][] {
    const at = text.indexOf(heading);
    assert(at !== -1, `the document carries ${heading}`);
    assert(cells > 0, "a row is read by a count of cells");
    const rows: string[][] = [];
    for (const line of text.slice(at).split(LINE_BREAK)) {
        if (!line.startsWith(ROW_OPENER)) continue;
        const found = line.split(CELL_MARK).slice(1, -1).map((one) => one.trim());
        if (found.length === cells) rows.push(found);
    }
    return rows;
}

/**
 * A cell's figure, or NaN where it states none, so a comparison with what a tool produced fails
 * rather than a row going missing.
 */
export function parseTableInteger(cell: string | undefined): number {
    return parseInteger(cell ?? "") ?? Number.NaN;
}
