/**
 * `docs/auras-standing.md`'s shout register against every recording, both ways round.
 *
 * The claim it holds is the one the panel's clock now rests on: the held character strikes
 * whoever shouted for three of their own turns. A register nobody re-earns is a measurement that
 * outlives its material, so the table is read back and held to what the tool produces.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { composeHoldingReading, getStruckShare, type HoldingRow } from "@/tools/shout-holding.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

const REGISTER_PATH = "docs/auras-standing.md";
const HEADING = "## How long a shout holds somebody";
const CELLS = 4;

/** The register, read back out of its own table under its own heading. */
export function getDocumentedTurns(said: string): HoldingRow[] {
    const at = said.indexOf(HEADING);
    assert(at !== -1, "the document carries the section this guard reads");
    const rows: HoldingRow[] = [];
    for (const line of said.slice(at).split("\n")) {
        if (!line.startsWith("| ")) continue;
        const cells = line.split("|").slice(1, -1).map((one) => one.trim());
        if (cells.length !== CELLS) continue;
        const turnsElapsed = Number(cells[0]);
        if (!Number.isSafeInteger(turnsElapsed)) continue;
        rows.push({
            turnsElapsed,
            atShouter: Number(cells[1]),
            atSomebodyElse: Number(cells[2]),
        });
    }
    return rows;
}

/** The share each row states, which the tool never carries as a field. */
function getDocumentedShares(said: string): number[] {
    const at = said.indexOf(HEADING);
    const found: number[] = [];
    for (const line of said.slice(at).split("\n")) {
        if (!line.startsWith("| ")) continue;
        const cells = line.split("|").slice(1, -1).map((one) => one.trim());
        if (cells.length !== CELLS) continue;
        if (!Number.isSafeInteger(Number(cells[0]))) continue;
        found.push(Number((cells[3] ?? "").replace("%", "")));
    }
    return found;
}

Deno.test("every turn the register states is one the recordings produce, and the other way", () => {
    const measured = composeHoldingReading(readRecordingPaths());
    assert(measured.rows.length > 0, "the corpus holds a shout that somebody was struck under");
    assertEquals(
        getDocumentedTurns(Deno.readTextFileSync(REGISTER_PATH)),
        measured.rows,
        "the shout register against what the tool reads off captures/",
    );
});

Deno.test("the share each row states is the share of the two counts beside it", () => {
    const said = Deno.readTextFileSync(REGISTER_PATH);
    const rows = getDocumentedTurns(said);
    const shares = getDocumentedShares(said);
    assertStrictEquals(shares.length, rows.length, "every row states a share");
    for (const [at, row] of rows.entries()) {
        assertStrictEquals(
            shares[at],
            getStruckShare(row.atShouter, row.atSomebodyElse),
            `turn ${row.turnsElapsed}: the share is the two counts beside it`,
        );
    }
});

/**
 * The claim the panel's clock rests on, held as a claim rather than as a table: the turns the
 * published table dates a shout for are total, and the one after it is not.
 */
Deno.test("a shout is total for the turns the table dates it, and falls after", () => {
    const measured = composeHoldingReading(readRecordingPaths());
    const stated = FROZEN_AURA_TURNS.shouts[0]?.turns;
    assert(stated !== undefined, "the frozen table dates a shout");
    assert(
        FROZEN_AURA_TURNS.shouts.every((one) => one.turns === stated),
        "and dates every shout the same, which is what one boundary stands on",
    );
    const inside = measured.rows.filter((row) => row.turnsElapsed <= stated);
    const after = measured.rows.filter((row) => row.turnsElapsed > stated);
    assert(inside.length > 0, "the corpus reaches the turns the table dates");
    assert(after.length > 0, "and goes past them");
    const struck = (rows: readonly HoldingRow[]) => ({
        at: rows.reduce((sum, row) => sum + row.atShouter, 0),
        away: rows.reduce((sum, row) => sum + row.atSomebodyElse, 0),
    });
    const held = struck(inside);
    const freed = struck(after);
    const baseline = getStruckShare(measured.baseline.atShouter, measured.baseline.atSomebodyElse);
    assert(
        getStruckShare(held.at, held.away) > baseline,
        "inside the stated turns they strike the shouter more than they did before the shout",
    );
    assert(
        getStruckShare(freed.at, freed.away) < baseline,
        "and past them they strike the shouter less, which is the edge the clock stands on",
    );
});

Deno.test("the reader takes the row it must and leaves the row it must not", () => {
    const taken = getDocumentedTurns(`${HEADING}\n\n| 2 | 61 | 0 | 100% |\n`);
    assertStrictEquals(taken.length, 1, "a row stating four figures is read");
    assertStrictEquals(taken[0]?.atShouter, 61, "and is read by its own columns");
    const heading = `${HEADING}\n\n| turn | at the shouter | elsewhere | share |\n`;
    assertStrictEquals(getDocumentedTurns(heading).length, 0, "a heading row is not a reading");
    const wide = `${HEADING}\n\n| 2 | 61 | 0 | 100% | 8 |\n`;
    assertStrictEquals(getDocumentedTurns(wide).length, 0, "and neither is a row of five");
});
