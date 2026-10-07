/**
 * `docs/auras-standing.md`'s shout register against every recording, both ways round. The claim it
 * holds is the one the panel's clock rests on: the held character strikes whoever shouted for the
 * turns of their own that `frozen/aura-turns.ts` states a shout runs. A register nobody re-earns
 * is a measurement that outlives its material, so the table is read back and held to what the tool
 * produces.
 */

import { assert, assertEquals, assertExists, assertStrictEquals, assertThrows } from "@std/assert";
import { FROZEN_AURA_TURNS } from "#/frozen/aura-turns.ts";
import { ENVELOPE_KEYS, HEALTH_FIELDS, WARRIOR_FIELDS } from "#/src/ports/payload-envelope.ts";
import { FILE_FIELD } from "#/src/runtime/fight-file.ts";
import {
    BASELINE_TURN,
    type HoldingRow,
    tallyHoldingReading,
    tallyStruckShare,
} from "#/tools/shout-holding.ts";
import { readRecordedMaterial, replayRecordedMaterial } from "#/tools/recorded-material.ts";
import { RecordingReadError } from "#/tools/margometer-tool-error.ts";
import { readRecordedFight, type RecordedFight } from "#/tests/recorded-fights.ts";
import { parseTableInteger, parseTableRows } from "#/tests/register-table.ts";

const REGISTER_PATH = "docs/auras-standing.md";
const HEADING = "## How long a shout holds somebody";
const CELLS = 4;
const PERCENT = "%";
const MEASURED = tallyHoldingReading(replayRecordedMaterial(readRecordedMaterial([])));
/** Messages as `captures/2026-08-06-tempest-grupa-vs-hildur-…` carries them, on invented ids. */
const HELD_STRIKES_SHOUTER = "2=100.00;1=99.00;+dmgd=1616";
const HELD_STRIKES_ELSEWHERE = "2=100.00;3=99.00;+dmgd=1616";
const SHOUTER_STEPS = "1=100.00;0;step";
const SOMEBODY_ELSE_STEPS = "3=100.00;0;step";
const SHOUT_AT_HELD = "1=100.00;2=100.00;tspell=Okrzyk;skillId=188;shout=Wilk";

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
    for (const [rowIndex, row] of rows.entries()) {
        assertStrictEquals(
            shares[rowIndex],
            tallyStruckShare(row.atShouter, row.atSomebodyElse),
            `turn ${row.turnsElapsed}: the share is the two counts beside it`,
        );
    }
});

/** The share each row states, which the tool never carries as a field. */
function parseShareCells(text: string): number[] {
    const shares: number[] = [];
    for (const cells of parseTableRows(text, HEADING, CELLS)) {
        if (!Number.isSafeInteger(parseTableInteger(cells[0]))) continue;
        shares.push(parseTableInteger((cells[3] ?? "").replace(PERCENT, "")));
    }
    return shares;
}

Deno.test("the baseline the register states is the one the recordings produce", () => {
    const text = Deno.readTextFileSync(REGISTER_PATH);
    const stated = parseTableRows(text, HEADING, CELLS).filter((cells) =>
        cells[0] === BASELINE_TURN
    );
    assertStrictEquals(stated.length, 1, "the register states one baseline row");
    const [cells] = stated;
    assertEquals(
        {
            atShouter: parseTableInteger(cells?.[1]),
            atSomebodyElse: parseTableInteger(cells?.[2]),
            share: parseTableInteger((cells?.[3] ?? "").replace(PERCENT, "")),
        },
        {
            atShouter: MEASURED.baseline.atShouter,
            atSomebodyElse: MEASURED.baseline.atSomebodyElse,
            share: tallyStruckShare(MEASURED.baseline.atShouter, MEASURED.baseline.atSomebodyElse),
        },
        "the baseline row against what the tool reads off captures/",
    );
});

/**
 * The claim the panel's clock rests on, held as a claim rather than as a table: the turns the
 * published table dates a shout for stand above what the pair did before it, and every turn past
 * them stands below every turn inside.
 */
Deno.test("a shout is total for the turns the table dates it, and falls after", () => {
    const stated = FROZEN_AURA_TURNS.shouts[0]?.turns;
    assert(stated !== undefined, "the frozen table dates a shout");
    assert(
        FROZEN_AURA_TURNS.shouts.every((shout) => shout.turns === stated),
        "and dates every shout the same, which is what one boundary stands on",
    );
    const inside = MEASURED.rows.filter((row) => row.turnsElapsed <= stated);
    const after = MEASURED.rows.filter((row) => row.turnsElapsed > stated);
    assert(inside.length > 0, "the corpus reaches the turns the table dates");
    assert(after.length > 0, "and goes past them");
    const held = tallyStruck(inside);
    const baseline = tallyStruckShare(
        MEASURED.baseline.atShouter,
        MEASURED.baseline.atSomebodyElse,
    );
    const heldShare = tallyStruckShare(held.atShouter, held.atSomebodyElse);
    assertExists(baseline, "blows were struck before the shout");
    assertExists(heldShare, "and inside the stated turns");
    assert(
        heldShare > baseline,
        "inside the stated turns they strike the shouter more than they did before the shout",
    );
    const tallyRowShare = (row: HoldingRow) =>
        tallyStruckShare(row.atShouter, row.atSomebodyElse) ?? Number.NaN;
    const lowestInside = Math.min(...inside.map(tallyRowShare));
    const highestAfter = Math.max(...after.map(tallyRowShare));
    assert(
        highestAfter < lowestInside,
        "and every turn past them strikes the shouter less than any inside, which is the edge",
    );
});

function tallyStruck(rows: readonly HoldingRow[]): { atShouter: number; atSomebodyElse: number } {
    return {
        atShouter: rows.reduce((sum, row) => sum + row.atShouter, 0),
        atSomebodyElse: rows.reduce((sum, row) => sum + row.atSomebodyElse, 0),
    };
}

/**
 * A pair is shouted at twice, and struck before the first shout, between the two and after both.
 * Its baseline is the two blows before the first shout, once: a walk adding every earlier blow to
 * each episode reads those two twice and the held blow between besides, 3 of 5 at the shouter.
 */
Deno.test("a pair's baseline is read once, off the blows before its first shout", () => {
    const fight = composeShoutedFight([
        HELD_STRIKES_ELSEWHERE,
        SHOUTER_STEPS,
        HELD_STRIKES_SHOUTER,
        SHOUT_AT_HELD,
        HELD_STRIKES_SHOUTER,
        SOMEBODY_ELSE_STEPS,
        SHOUT_AT_HELD,
        HELD_STRIKES_SHOUTER,
    ]);
    const shouted = tallyHoldingReading(
        replayRecordedMaterial({ material: fight.path, fights: [fight] }),
    );
    assertEquals(
        shouted.baseline,
        { episodes: 2, pairs: 1, atShouter: 1, atSomebodyElse: 1 },
        "two shouts at one pair, and its baseline is what it did before the first",
    );
    assertStrictEquals(
        shouted.rows.reduce((sum, row) => sum + row.atShouter, 0),
        2,
        "while each held blow counts under the shout it fell under",
    );
});

/** One call, opening a fight of one shouter, one held and one bystander, carrying the messages. */
function composeShoutedFight(messages: readonly string[]): RecordedFight {
    const composeWarrior = (id: number, name: string, side: number) => ({
        [WARRIOR_FIELDS.id]: id,
        [WARRIOR_FIELDS.name]: name,
        [WARRIOR_FIELDS.side]: side,
        [WARRIOR_FIELDS.health]: { [HEALTH_FIELDS.maximum]: 1000, [HEALTH_FIELDS.now]: 1000 },
    });
    const payload = {
        [ENVELOPE_KEYS.isInit]: 1,
        [ENVELOPE_KEYS.combatants]: {
            1: composeWarrior(1, "Gracz 1", 1),
            2: composeWarrior(2, "Wilk", 2),
            3: composeWarrior(3, "Gracz 2", 1),
        },
        [ENVELOPE_KEYS.messages]: messages,
    };
    const call = { [FILE_FIELD.messages]: messages, [FILE_FIELD.payload]: payload };
    return readRecordedFight("shouted.json", { [FILE_FIELD.calls]: [call] });
}

Deno.test("a share over no blows is none, and one blow is all or nothing", () => {
    assertStrictEquals(tallyStruckShare(0, 0), null, "no blows struck is no share, not a nought");
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

/** What the recordings hold is the tool's input, so a walk past its bound is refused. */
Deno.test("the episodes a walk holds are refused past their bound", () => {
    const replayed = replayRecordedMaterial(readRecordedMaterial([]));
    const total = MEASURED.baseline.episodes;
    assertStrictEquals(
        tallyHoldingReading(replayed, total).baseline.episodes,
        total,
        "every episode, at the bound",
    );
    assertThrows(
        () => tallyHoldingReading(replayed, total - 1),
        RecordingReadError,
        "the recordings hold",
    );
    assertThrows(() => tallyHoldingReading(replayed, 0), RecordingReadError, "a recording holds");
});
