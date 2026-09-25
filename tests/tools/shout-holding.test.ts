/**
 * `docs/auras-standing.md`'s shout register against every recording, both ways round. The claim it
 * holds is the one the panel's clock rests on: the held character strikes whoever shouted for three
 * of their own turns. A register nobody re-earns is a measurement that outlives its material, so
 * the table is read back and held to what the tool produces.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { FROZEN_AURA_TURNS } from "#/frozen/aura-turns.ts";
import { type HoldingRow, tallyHoldingReading, tallyStruckShare } from "#/tools/shout-holding.ts";
import { readRecordedMaterial, replayRecordedMaterial } from "#/tools/recorded-material.ts";
import { parseTableInteger, parseTableRows } from "#/tests/register-table.ts";

const REGISTER_PATH = "docs/auras-standing.md";
const HEADING = "## How long a shout holds somebody";
const CELLS = 4;
const PERCENT = "%";
const MEASURED = tallyHoldingReading(replayRecordedMaterial(readRecordedMaterial([])));

Deno.test("every turn the register states is one the recordings produce, and the other way", () => {
    assert(MEASURED.rows.length > 0, "the corpus holds a shout that somebody was struck under");
    assertEquals(
        parseHoldingRows(Deno.readTextFileSync(REGISTER_PATH)),
        MEASURED.rows,
        "the shout register against what the tool reads off captures/",
    );
});

/** The register, read back out of its own table under its own heading. */
function parseHoldingRows(text: string): HoldingRow[] {
    const rows: HoldingRow[] = [];
    for (const cells of parseTableRows(text, HEADING, CELLS)) {
        const turnsElapsed = parseTableInteger(cells[0]);
        if (!Number.isSafeInteger(turnsElapsed)) continue;
        rows.push({
            turnsElapsed,
            atShouter: parseTableInteger(cells[1]),
            atSomebodyElse: parseTableInteger(cells[2]),
        });
    }
    return rows;
}

Deno.test("the share each row states is the share of the two counts beside it", () => {
    const text = Deno.readTextFileSync(REGISTER_PATH);
    const rows = parseHoldingRows(text);
    const shares = parseShareCells(text);
    assertStrictEquals(shares.length, rows.length, "every row states a share");
    for (const [at, row] of rows.entries()) {
        assertStrictEquals(
            shares[at],
            tallyStruckShare(row.atShouter, row.atSomebodyElse),
            `turn ${row.turnsElapsed}: the share is the two counts beside it`,
        );
    }
});

/** The share each row states, which the tool never carries as a field. */
function parseShareCells(text: string): number[] {
    const found: number[] = [];
    for (const cells of parseTableRows(text, HEADING, CELLS)) {
        if (!Number.isSafeInteger(parseTableInteger(cells[0]))) continue;
        found.push(parseTableInteger((cells[3] ?? "").replace(PERCENT, "")));
    }
    return found;
}

/**
 * The claim the panel's clock rests on, held as a claim rather than as a table: the turns the
 * published table dates a shout for are total, and the one after it is not.
 */
Deno.test("a shout is total for the turns the table dates it, and falls after", () => {
    const stated = FROZEN_AURA_TURNS.shouts[0]?.turns;
    assert(stated !== undefined, "the frozen table dates a shout");
    assert(
        FROZEN_AURA_TURNS.shouts.every((one) => one.turns === stated),
        "and dates every shout the same, which is what one boundary stands on",
    );
    const inside = MEASURED.rows.filter((row) => row.turnsElapsed <= stated);
    const after = MEASURED.rows.filter((row) => row.turnsElapsed > stated);
    assert(inside.length > 0, "the corpus reaches the turns the table dates");
    assert(after.length > 0, "and goes past them");
    const held = tallyStruck(inside);
    const freed = tallyStruck(after);
    const baseline = tallyStruckShare(
        MEASURED.baseline.atShouter,
        MEASURED.baseline.atSomebodyElse,
    );
    assert(
        tallyStruckShare(held.atShouter, held.atSomebodyElse) > baseline,
        "inside the stated turns they strike the shouter more than they did before the shout",
    );
    assert(
        tallyStruckShare(freed.atShouter, freed.atSomebodyElse) < baseline,
        "and past them they strike the shouter less, which is the edge the clock stands on",
    );
});

function tallyStruck(rows: readonly HoldingRow[]): { atShouter: number; atSomebodyElse: number } {
    return {
        atShouter: rows.reduce((sum, row) => sum + row.atShouter, 0),
        atSomebodyElse: rows.reduce((sum, row) => sum + row.atSomebodyElse, 0),
    };
}

Deno.test("a share over no blows is none, and one blow is all or nothing", () => {
    assertStrictEquals(tallyStruckShare(0, 0), 0, "no blows struck is no share, not a division");
    assertStrictEquals(tallyStruckShare(1, 0), 100, "one blow at the shouter is all of them");
    assertStrictEquals(tallyStruckShare(0, 1), 0, "and one elsewhere is none");
});

Deno.test("the reader takes the row it must and leaves the row it must not", () => {
    const taken = parseHoldingRows(`${HEADING}\n\n| 2 | 61 | 0 | 100% |\n`);
    assertStrictEquals(taken.length, 1, "a row stating four figures is read");
    assertStrictEquals(taken[0]?.atShouter, 61, "and is read by its own columns");
    const heading = `${HEADING}\n\n| turn | at the shouter | elsewhere | share |\n`;
    assertStrictEquals(parseHoldingRows(heading).length, 0, "a heading row is not a reading");
    const wide = `${HEADING}\n\n| 2 | 61 | 0 | 100% | 8 |\n`;
    assertStrictEquals(parseHoldingRows(wide).length, 0, "and neither is a row of five");
});
