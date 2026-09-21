/**
 * `docs/auras-standing.md`'s lifetime section against every recording, both ways round.
 *
 * Two claims live there and neither may be remembered: what the mask does, which is measured, and
 * what the help dates a length to, which is cited key by key and counted in `frozen/`. The reader
 * over each table is proved by a row it must take and a row it must not.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { type BitRow, composeBitRows, composeLightingRows } from "@/tools/aura-lifetime.ts";
import { FROZEN_BUFF_BITS } from "@/frozen/buff-bits.ts";
import { FROZEN_HELP_PHRASES } from "@/frozen/help-phrases.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

const REGISTER_PATH = "docs/auras-standing.md";
const KEY_REGISTER_PATH = "docs/protocol-keys.md";
const HEADING = "## Whose turns a length is counted in";
const BIT_CELLS = 9;
const CLAUSE_CELLS = 3;

function getSectionText(said: string): string {
    const at = said.indexOf(HEADING);
    assert(at !== -1, "the document carries the section this guard reads");
    return said.slice(at);
}

function getTableCells(line: string, count: number): string[] | null {
    if (!line.startsWith("| ")) return null;
    const cells = line.split("|").slice(1, -1).map((one) => one.trim());
    if (cells.length !== count) return null;
    return cells;
}

/** The measured register, read back out of its own table by its own columns. */
export function getDocumentedBits(said: string): BitRow[] {
    const rows: BitRow[] = [];
    for (const line of getSectionText(said).split("\n")) {
        const cells = getTableCells(line, BIT_CELLS);
        if (cells === null) continue;
        const bitName = (cells[0] ?? "").replaceAll("`", "");
        if (!Number.isSafeInteger(Number(cells[1]))) continue;
        rows.push({
            bit: rows.length,
            bitName,
            lightings: Number(cells[1]),
            together: Number(cells[3]),
            apart: Number(cells[4]),
            agreeing: Number(cells[5]),
            apartAgreeing: Number(cells[6]),
            ownTurnsCommon: Number(cells[7]),
            ownTurnsCommonRuns: Number(cells[8]),
        });
    }
    return rows;
}

/** What the document's own `shared` column says, which no row of the tool carries as a field. */
function getDocumentedShared(said: string): number[] {
    const found: number[] = [];
    for (const line of getSectionText(said).split("\n")) {
        const cells = getTableCells(line, BIT_CELLS);
        if (cells === null) continue;
        if (!Number.isSafeInteger(Number(cells[1]))) continue;
        found.push(Number(cells[2]));
    }
    return found;
}

export interface ClauseRow {
    clause: string;
    keys: string[];
}

/** The help's clauses, read back out of the table that states which keys carry each one. */
export function getDocumentedClauses(said: string): ClauseRow[] {
    const rows: ClauseRow[] = [];
    for (const line of getSectionText(said).split("\n")) {
        const cells = getTableCells(line, CLAUSE_CELLS);
        if (cells === null) continue;
        const clause = (cells[0] ?? "").replaceAll("`", "");
        if (!clause.startsWith("wykonanych") && !clause.startsWith("od tur")) {
            if (!clause.startsWith("tur ukończonych")) continue;
        }
        const keys = (cells[1] ?? "").split(",").map((one) => one.trim().replaceAll("`", ""));
        rows.push({ clause, keys: keys.filter((one) => one.length > 0) });
    }
    return rows;
}

Deno.test("every row the register states is one the recordings produce, and the other way", () => {
    const measured = composeBitRows(composeLightingRows(readRecordingPaths()));
    assert(measured.length > 0, "the corpus lights something");
    assertEquals(
        getDocumentedBits(Deno.readTextFileSync(REGISTER_PATH)),
        measured,
        "the lifetime register against what the tool reads off captures/",
    );
});

Deno.test("the shared column is the two it is made of", () => {
    const said = Deno.readTextFileSync(REGISTER_PATH);
    const documented = getDocumentedBits(said);
    const shared = getDocumentedShared(said);
    assertStrictEquals(shared.length, documented.length, "every row states what it shared");
    for (const [at, row] of documented.entries()) {
        assertStrictEquals(
            shared[at],
            row.together + row.apart,
            `${row.bitName}: shared is the together and the apart`,
        );
    }
});

Deno.test("a lighting no single clock explains is on the material", () => {
    const measured = composeBitRows(composeLightingRows(readRecordingPaths()));
    const apartAgreeing = measured.reduce((sum, row) => sum + row.apartAgreeing, 0);
    assert(apartAgreeing > 0, "the corpus holds a lighting that went out at several moments");
    for (const row of measured) {
        assert(row.apartAgreeing <= row.agreeing, `${row.bitName}: apart and agreeing is agreeing`);
        assert(row.apart <= row.together + row.apart, `${row.bitName}: apart is part of shared`);
    }
});

Deno.test("the register names the statuses the client registers, in the client's own order", () => {
    const documented = getDocumentedBits(Deno.readTextFileSync(REGISTER_PATH));
    assertEquals(
        documented.map((row) => row.bitName),
        [...FROZEN_BUFF_BITS.bits],
        "the register's rows against the frozen bit table, in order",
    );
});

/**
 * The help claim standing under one key's own entry. The tie between a clause and a key is
 * **where the line sits**, never what it spells: `aura-adddmg2_per-meele` claims the help under
 * the shorter `adddmg2`, because that is the spelling the article carries.
 */
function getHelpLineForKey(register: string, key: string): string | null {
    const at = register.indexOf(`### \`${key}\``);
    if (at === -1) return null;
    for (const line of register.slice(at).split("\n")) {
        if (line.startsWith("### ") && !line.includes(`\`${key}\``)) return null;
        if (line.startsWith("_Help:_")) return line;
    }
    return null;
}

Deno.test("every clause the document cites is counted, and cited by the keys it names", () => {
    const clauses = getDocumentedClauses(Deno.readTextFileSync(REGISTER_PATH));
    assert(clauses.length > 0, "the document states which clause dates which key");
    const register = Deno.readTextFileSync(KEY_REGISTER_PATH);
    for (const row of clauses) {
        const counted = Object.entries(FROZEN_HELP_PHRASES.counts)
            .find(([phrase]) => phrase === row.clause);
        assert(counted !== undefined, `${row.clause}: the frozen counts carry it`);
        assert((counted[1] ?? 0) > 0, `${row.clause}: and the help says it at least once`);
        for (const key of row.keys) {
            const said = getHelpLineForKey(register, key);
            assert(said !== null, `${key}: the key register carries an entry claiming the help`);
            assert(said.includes(row.clause), `${key}: and its claim cites ${row.clause}`);
        }
    }
});

Deno.test("the readers take the row they must and leave the row they must not", () => {
    const flagged = `${HEADING}\n\n| \`speed_up\` | 1 | 1 | 0 | 1 | 1 | 1 | 8 | 2 |\n`;
    const taken = getDocumentedBits(flagged);
    assertStrictEquals(taken.length, 1, "a row stating nine figures is read");
    assertStrictEquals(taken[0]?.ownTurnsCommon, 8, "and is read by its own columns");

    const heading =
        `${HEADING}\n\n| status | lit | shared | together | apart | a | b | own | runs |\n`;
    assertStrictEquals(getDocumentedBits(heading).length, 0, "a heading row is not a reading");

    const narrow = `${HEADING}\n\n| \`speed_up\` | 1 | 1 | 0 | 1 |\n`;
    assertStrictEquals(getDocumentedBits(narrow).length, 0, "and neither is a row of five");

    const clause =
        `${HEADING}\n\n| \`od tur przeciwników\` | \`active_decblock_per-enemies\` | x |\n`;
    assertStrictEquals(getDocumentedClauses(clause).length, 1, "a clause row is read");
    const other = `${HEADING}\n\n| \`aura-sa_per\` | \`something\` | x |\n`;
    assertStrictEquals(getDocumentedClauses(other).length, 0, "a row naming no clause is not one");
});
