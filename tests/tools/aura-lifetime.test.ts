/**
 * `docs/auras-standing.md`'s lifetime section against every recording, both ways round. Two claims
 * live there and neither may be remembered: what the mask does, which is measured, and what the
 * help dates a length to, which is cited key by key and counted in `frozen/`. Each reader over a
 * table is proved by a row it must take and a row it must not.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";
import { FROZEN_HELP_PHRASES } from "#/frozen/help-phrases.ts";
import { type BitRow, replayLightingRows, tallyBitRows } from "#/tools/aura-lifetime.ts";
import { readRecordedMaterial, replayMaterialSteps } from "#/tools/recorded-material.ts";
import { DEVELOP_REVISION } from "#/tests/recording-sources.ts";
import { parseTableInteger, parseTableRows } from "#/tests/register-table.ts";

interface ClauseRow {
    clause: string;
    keys: string[];
}

const REGISTER_PATH = "docs/auras-standing.md";
/**
 * The key register this section's clauses are cited from. It is `develop`'s until this tree
 * carries one, so it is read out of git at the revision `develop:` names.
 */
const KEY_REGISTER_PATH = "docs/protocol-keys.md";
const HEADING = "## Whose turns a length is counted in";
const BIT_CELLS = 9;
const CLAUSE_CELLS = 3;
/** The help's own wording for whose turns a length runs on, as the clause table quotes it. */
const CLAUSE_OPENERS = ["wykonanych", "od tur", "tur ukończonych"];
const QUOTE = "`";
const HELP_MARK = "_Help:_";
const ENTRY_MARK = "### ";
const LIGHTINGS = replayLightingRows(replayMaterialSteps(readRecordedMaterial([])));

Deno.test("every row the register states is one the recordings produce, and the other way", () => {
    const measured = tallyBitRows(LIGHTINGS);
    assert(measured.length > 0, "the corpus lights something");
    assertEquals(
        parseBitRows(Deno.readTextFileSync(REGISTER_PATH)),
        measured,
        "the lifetime register against what the tool reads off captures/",
    );
});

/** The measured register, read back out of its own table by its own columns. */
function parseBitRows(text: string): BitRow[] {
    const rows: BitRow[] = [];
    for (const cells of parseTableRows(text, HEADING, BIT_CELLS)) {
        const lightings = parseTableInteger(cells[1]);
        if (!Number.isSafeInteger(lightings)) continue;
        rows.push({
            bit: rows.length,
            bitName: (cells[0] ?? "").replaceAll(QUOTE, ""),
            lightings,
            together: parseTableInteger(cells[3]),
            apart: parseTableInteger(cells[4]),
            agreeing: parseTableInteger(cells[5]),
            apartAgreeing: parseTableInteger(cells[6]),
            ownTurnsCommon: parseTableInteger(cells[7]),
            ownTurnsCommonRuns: parseTableInteger(cells[8]),
        });
    }
    return rows;
}

Deno.test("the shared column is the two it is made of", () => {
    const text = Deno.readTextFileSync(REGISTER_PATH);
    const documented = parseBitRows(text);
    const shared = parseSharedCells(text);
    assertStrictEquals(shared.length, documented.length, "every row states what it shared");
    for (const [at, row] of documented.entries()) {
        assertStrictEquals(
            shared[at],
            row.together + row.apart,
            `${row.bitName}: shared is the together and the apart`,
        );
    }
});

/** What the document's own `shared` column says, which no row of the tool carries as a field. */
function parseSharedCells(text: string): number[] {
    const found: number[] = [];
    for (const cells of parseTableRows(text, HEADING, BIT_CELLS)) {
        if (!Number.isSafeInteger(parseTableInteger(cells[1]))) continue;
        found.push(parseTableInteger(cells[2]));
    }
    return found;
}

Deno.test("a lighting no single clock explains is on the material", () => {
    const measured = tallyBitRows(LIGHTINGS);
    const apartAgreeing = measured.reduce((sum, row) => sum + row.apartAgreeing, 0);
    assert(apartAgreeing > 0, "the corpus holds a lighting that went out at several moments");
    for (const row of measured) {
        assert(row.apartAgreeing <= row.agreeing, `${row.bitName}: apart and agreeing is agreeing`);
        assert(row.apart <= row.together + row.apart, `${row.bitName}: apart is part of shared`);
    }
});

Deno.test("the register names the statuses the client registers, in the client's own order", () => {
    const documented = parseBitRows(Deno.readTextFileSync(REGISTER_PATH));
    assertEquals(
        documented.map((row) => row.bitName),
        [...FROZEN_BUFF_BITS.bits],
        "the register's rows against the frozen bit table, in order",
    );
});

Deno.test("every clause the document cites is counted, and cited by the keys it names", () => {
    const clauses = parseClauseRows(Deno.readTextFileSync(REGISTER_PATH));
    assert(clauses.length > 0, "the document states which clause dates which key");
    const register = readDevelopText(KEY_REGISTER_PATH);
    const counts = new Map<string, number>(Object.entries(FROZEN_HELP_PHRASES.counts));
    for (const row of clauses) {
        const counted = counts.get(row.clause);
        assert(counted !== undefined, `${row.clause}: the frozen counts carry it`);
        assert(counted > 0, `${row.clause}: and the help says it at least once`);
        for (const key of row.keys) {
            const said = lookupHelpLine(register, key);
            assert(said !== null, `${key}: the key register carries an entry claiming the help`);
            assert(said.includes(row.clause), `${key}: and its claim cites ${row.clause}`);
        }
    }
});

/** The help's clauses, read back out of the table that states which keys carry each one. */
function parseClauseRows(text: string): ClauseRow[] {
    const rows: ClauseRow[] = [];
    for (const cells of parseTableRows(text, HEADING, CLAUSE_CELLS)) {
        const clause = (cells[0] ?? "").replaceAll(QUOTE, "");
        if (!CLAUSE_OPENERS.some((opener) => clause.startsWith(opener))) continue;
        const keys = (cells[1] ?? "").split(",").map((one) => one.trim().replaceAll(QUOTE, ""));
        rows.push({ clause, keys: keys.filter((one) => one.length > 0) });
    }
    return rows;
}

function readDevelopText(path: string): string {
    const shown = new Deno.Command("git", {
        args: ["show", `${DEVELOP_REVISION}:${path}`],
        stdout: "piped",
    }).outputSync();
    assert(shown.success, `develop:${path} is there at ${DEVELOP_REVISION}`);
    return new TextDecoder().decode(shown.stdout);
}

/**
 * The help claim standing under one key's own entry. The tie between a clause and a key is
 * **where the line sits**, never what it spells: `aura-adddmg2_per-meele` claims the help under
 * the shorter `adddmg2`, because that is the spelling the article carries.
 */
function lookupHelpLine(register: string, key: string): string | null {
    const at = register.indexOf(`${ENTRY_MARK}${QUOTE}${key}${QUOTE}`);
    if (at === -1) return null;
    for (const line of register.slice(at).split("\n")) {
        if (line.startsWith(ENTRY_MARK)) {
            if (!line.includes(`${QUOTE}${key}${QUOTE}`)) return null;
        }
        if (line.startsWith(HELP_MARK)) return line;
    }
    return null;
}

Deno.test("the readers take the row they must and leave the row they must not", () => {
    const flagged = `${HEADING}\n\n| \`speed_up\` | 1 | 1 | 0 | 1 | 1 | 1 | 8 | 2 |\n`;
    const taken = parseBitRows(flagged);
    assertStrictEquals(taken.length, 1, "a row stating nine figures is read");
    assertStrictEquals(taken[0]?.ownTurnsCommon, 8, "and is read by its own columns");

    const heading =
        `${HEADING}\n\n| status | lit | shared | together | apart | a | b | own | runs |\n`;
    assertStrictEquals(parseBitRows(heading).length, 0, "a heading row is not a reading");

    const narrow = `${HEADING}\n\n| \`speed_up\` | 1 | 1 | 0 | 1 |\n`;
    assertStrictEquals(parseBitRows(narrow).length, 0, "and neither is a row of five");

    const clause =
        `${HEADING}\n\n| \`od tur przeciwników\` | \`active_decblock_per-enemies\` | x |\n`;
    assertStrictEquals(parseClauseRows(clause).length, 1, "a clause row is read");
    const other = `${HEADING}\n\n| \`aura-sa_per\` | \`something\` | x |\n`;
    assertStrictEquals(parseClauseRows(other).length, 0, "a row naming no clause is not one");
});
