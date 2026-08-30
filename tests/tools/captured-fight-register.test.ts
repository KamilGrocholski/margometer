/**
 * `docs/captured-fights.md`, re-earned from the directory it describes.
 *
 * A row here is true for good, because a recording never changes — but the set does, and a census
 * written by hand goes stale the moment one is admitted. What the guard composes is what the
 * material produces; what it refuses is a row nothing produces and a recording no row names.
 */

import { assert, assertEquals } from "@std/assert";
import { getValueFromJsonText, isRecord } from "@/src/core/unknown-reading.ts";
import {
    getRecordedEngineUpdates,
    getRecordedMessages,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const REGISTER_PATH = "docs/captured-fights.md";
const BACKTICK = "`";
const ROW_OPENER = "|";
/** The recordings' own field names, which stop at this file and `tests/recorded-fight.ts`. */
const WORLD_FIELD = "swiat";
const BUILD_FIELD = "build";
/** What the register writes where a recording states no build, which some of them do not. */
const NO_BUILD = "none stated";
/** Past the row count of any table here, so each walk carries a stated bound. */
const MAXIMUM_ROWS = 256;

/** Every backticked cell of a table row, in the order the row states them. */
function getRowCells(line: string): string[] {
    if (!line.trimStart().startsWith(ROW_OPENER)) return [];
    const found: string[] = [];
    let at = line.indexOf(BACKTICK);
    let looked = 0;
    while (at !== -1) {
        looked += 1;
        assert(looked <= MAXIMUM_ROWS, "the walk stays inside its stated bound");
        const closes = line.indexOf(BACKTICK, at + 1);
        if (closes === -1) break;
        found.push(line.slice(at + 1, closes));
        at = line.indexOf(BACKTICK, closes + 1);
    }
    return found;
}

/** The rows whose first cell names a recording, which is what a census row looks like. */
function getRecordingRows(text: string): string[][] {
    const found: string[][] = [];
    for (const line of text.split("\n")) {
        const cells = getRowCells(line);
        const first = cells[0] ?? "";
        if (!first.startsWith("captures/")) continue;
        found.push(cells);
    }
    return found;
}

function getEnvelopeField(path: string, field: string): string {
    const stated = getValueFromJsonText(Deno.readTextFileSync(path));
    assert(isRecord(stated), `${path}: a recording is a record`);
    const value = stated[field];
    if (value === null) return NO_BUILD;
    assert(typeof value === "string", `${path}: ${field} is stated as text or as nothing`);
    return value;
}

Deno.test("the reader knows a census row from every other line", () => {
    const row = "| `captures/a.json` | `tempest` | `1` | `4` | `18` |";
    assertEquals(getRecordingRows(row).length, 1, "a row naming a recording is one");
    assertEquals(getRecordingRows("| `1 vs 1` | `3` |"), [], "a row naming no recording is not");
    assertEquals(getRecordingRows("prose about `captures/a.json`"), [], "and neither is prose");
});

Deno.test("every recording is named by the register, and every row names one", () => {
    const rows = getRecordingRows(Deno.readTextFileSync(REGISTER_PATH));
    assert(rows.length > 0, "the register carries rows to check");
    const named = new Set(rows.map((cells) => cells[0] ?? ""));
    const held = new Set(getRecordingPaths());
    const missing = [...held].filter((path) => !named.has(path)).sort();
    const invented = [...named].filter((path) => !held.has(path)).sort();
    assertEquals(missing, [], "a recording the register does not name");
    assertEquals(invented, [], "a row naming a recording the directory does not hold");
});

/**
 * The four a machine can recompute outright. The cast column is not among them: it states
 * professions and a level range in a shape this reader does not compose, and stays held by reading.
 */
Deno.test("what the register states of each recording is what the recording states", () => {
    const rows = getRecordingRows(Deno.readTextFileSync(REGISTER_PATH));
    let checked = 0;
    for (const path of getRecordingPaths()) {
        const stated = rows.filter((cells) => cells[0] === path);
        const counted = stated.find((cells) => cells.length === 5);
        assert(
            counted !== undefined,
            `${path}: no row states its world, build, calls and messages`,
        );
        assertEquals(counted[1], getEnvelopeField(path, WORLD_FIELD), `${path}: the world`);
        assertEquals(counted[2], getEnvelopeField(path, BUILD_FIELD), `${path}: the build`);
        assertEquals(
            counted[3],
            String(getRecordedEngineUpdates(path).length),
            `${path}: the calls the engine made`,
        );
        assertEquals(
            counted[4],
            String(getRecordedMessages(path).length),
            `${path}: the messages they carried`,
        );
        checked += 1;
    }
    assertEquals(checked, getRecordingPaths().length, "every recording was re-earned");
});
