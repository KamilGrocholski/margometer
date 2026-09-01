/**
 * `docs/captured-fights.md`, re-earned from the directory it describes.
 *
 * A row here is true for good, because a recording never changes — but the set does, and a census
 * written by hand goes stale the moment one is admitted. What the guard composes is what the
 * material produces; what it refuses is a row nothing produces and a recording no row names.
 */

import { assert, assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import {
    getRecordedEngineUpdates,
    getRecordedMessages,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";
import { READER_SIDE_KEY } from "@/src/game/battle-session.ts";
import { WARRIOR_FIELDS } from "@/src/game/engine-warrior.ts";
import { CAPTURE_FIELDS, NOTHING_STATED } from "@/src/game/fight-capture.ts";
import { getNumberFromUnknown, getStatedTextFromUnknown } from "@/libs/unknown-reading.ts";

const REGISTER_PATH = "docs/captured-fights.md";
const BACKTICK = "`";
const ROW_OPENER = "|";
/** What the register writes where a recording states no build, which some of them do not. */
const NO_BUILD = "none stated";
/** The same absence in a filename, where a sentence has no room (`src/game/fight-capture.ts`). */
const NO_BUILD_IN_NAME = NOTHING_STATED;
/** Past the row count of any table here, so each walk carries a stated bound. */
const MAXIMUM_ROWS = 256;

/**
 * A cell that is a count. Both tables state six cells per row, so the census row is told from a
 * fight's row by what its last two hold: two counts there, a cast and a pool of health here.
 */
function isCountText(text: string): boolean {
    assert(text.length >= 0, "a cell offered is text");
    if (text.length === 0) return false;
    for (const character of text) {
        if (character < "0" || character > "9") return false;
    }
    return true;
}

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
    const reading = getJsonReading(Deno.readTextFileSync(path));
    assert(reading.isOk, `${path}: a recording is JSON`);
    const stated = reading.value;
    assert(isRecord(stated), `${path}: a recording is a record`);
    const value = stated[field];
    if (value === undefined) return NO_BUILD;
    if (value === null) return NO_BUILD;
    assert(typeof value === "string", `${path}: ${field} is stated as text or as nothing`);
    return value;
}

/** What a filename says of a version, where the register says `none stated`. */
function composeVersionInName(stated: string): string {
    assert(stated.length > 0, "a version read off a recording says something");
    if (stated === NO_BUILD) return NO_BUILD_IN_NAME;
    return stated;
}

/**
 * A name is read by whoever picks a recording without opening it — the preview's list, an
 * attachment on a report — so it is held to what the file says rather than to what a hand typed
 * at intake. **ADR 0030.**
 */
Deno.test("a recording is filed under the two versions it states", () => {
    const paths = getRecordingPaths();
    assert(paths.length > 0, "there is material to check");
    for (const path of paths) {
        const build = composeVersionInName(getEnvelopeField(path, CAPTURE_FIELDS.gameBuild));
        const addOn = composeVersionInName(getEnvelopeField(path, CAPTURE_FIELDS.addOnVersion));
        assertEquals(
            path.endsWith(`-${build}-${addOn}.json`),
            true,
            `${path}: is named for ${build} and ${addOn}, which is what it states`,
        );
    }
});

Deno.test("the reader knows a census row from every other line", () => {
    const row = "| `captures/a.json` | `tempest` | `1` | `0.9.0` | `4` | `18` |";
    assertEquals(getRecordingRows(row).length, 1, "a row naming a recording is one");
    assertEquals(getRecordingRows("| `1 vs 1` | `3` |"), [], "a row naming no recording is not");
    assertEquals(getRecordingRows("prose about `captures/a.json`"), [], "and neither is prose");
    // The sample the reader must not take for a census row: a fight's row states six cells too.
    assertEquals(isCountText("18"), true, "a count is digits");
    assertEquals(isCountText("1 NPC · m 1 · level 100"), false, "and a cast is not one");
    assertEquals(isCountText(""), false, "nor is a cell that says nothing");
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
        const counted = stated.find((cells) =>
            cells.length === 6 && isCountText(cells[4] ?? "") && isCountText(cells[5] ?? "")
        );
        assert(
            counted !== undefined,
            `${path}: no row states its world, both versions, calls and messages`,
        );
        assertEquals(
            counted[1],
            getEnvelopeField(path, CAPTURE_FIELDS.world),
            `${path}: the world`,
        );
        assertEquals(
            counted[2],
            getEnvelopeField(path, CAPTURE_FIELDS.gameBuild),
            `${path}: the build of the game`,
        );
        assertEquals(
            counted[3],
            getEnvelopeField(path, CAPTURE_FIELDS.addOnVersion),
            `${path}: the build of ours that wrote it`,
        );
        assertEquals(
            counted[4],
            String(getRecordedEngineUpdates(path).length),
            `${path}: the calls the engine made`,
        );
        assertEquals(
            counted[5],
            String(getRecordedMessages(path).length),
            `${path}: the messages they carried`,
        );
        checked += 1;
    }
    assertEquals(checked, getRecordingPaths().length, "every recording was re-earned");
});

/**
 * The cast column, composed rather than read.
 *
 * `docs/captured-fights.md` states who fought on each side, in what profession and at what level,
 * and until now that was held by reading alone: a row stating it wrongly passed the gate. The
 * shape column and the census above it were unheld for the same reason, and they are the same
 * arithmetic — a shape is how many of ours against how many of theirs.
 */
const CENSUS_HEADING = "## Shapes";
const CAST_HEADING = "## The fights";
const RECORDINGS_HEADING = "## The recordings";
/** How the register writes a range, and it is an en dash rather than a hyphen. */
const RANGE_MARK = "–";
const PART_MARK = " · ";

interface RecordedWarrior {
    side: number;
    profession: string;
    level: number;
    isPlayer: boolean;
}

/** Every warrior a recording's payloads state, by id, so one person is counted once. */
function getRecordedWarriors(path: string): Map<number, RecordedWarrior> {
    const found = new Map<number, RecordedWarrior>();
    for (const update of getRecordedEngineUpdates(path)) {
        if (!isRecord(update)) continue;
        const warriors = update[WARRIOR_FIELDS.warriors];
        if (!isRecord(warriors)) continue;
        for (const stated of Object.values(warriors)) {
            if (!isRecord(stated)) continue;
            const id = getNumberFromUnknown(stated[WARRIOR_FIELDS.identity]);
            const side = getNumberFromUnknown(stated[WARRIOR_FIELDS.side]);
            const level = getNumberFromUnknown(stated[WARRIOR_FIELDS.level]);
            const profession = getStatedTextFromUnknown(stated[WARRIOR_FIELDS.profession]);
            if (id === null || side === null || level === null || profession === null) continue;
            const nonPlayer = getNumberFromUnknown(stated[WARRIOR_FIELDS.nonPlayer]);
            found.set(id, { side, profession, level, isPlayer: nonPlayer === 0 });
        }
    }
    assert(found.size > 0, `${path}: no warrior was read out of its payloads`);
    assert(found.size <= MAXIMUM_ROWS, `${path}: stays inside the bound this file walks by`);
    return found;
}

function getReaderSide(path: string): number {
    let found: number | null = null;
    for (const update of getRecordedEngineUpdates(path)) {
        if (found !== null) break;
        if (!isRecord(update)) continue;
        found = getNumberFromUnknown(update[READER_SIDE_KEY]);
    }
    assertExists(found, `${path}: no payload states the reader's own side`);
    return found;
}

/** `10 players · h 1, m 2, p 2, t 1, w 4 · levels 93–120`, in the register's own words. */
function composeCastText(cast: readonly RecordedWarrior[]): string {
    assert(cast.length > 0, "a side with nobody on it is not a side this register writes");
    const players = cast.filter((one) => one.isPlayer).length;
    // Every side in `captures/` is all people or all monsters, so the register has one noun for
    // it. A side that mixed them would need a word this document does not have.
    assert(players === 0 || players === cast.length, "a side is all players or all NPCs");
    const noun = players === cast.length ? "player" : "NPC";
    const counted = `${cast.length} ${noun}${cast.length === 1 ? "" : "s"}`;
    const byProfession = new Map<string, number>();
    for (const one of cast) {
        byProfession.set(one.profession, (byProfession.get(one.profession) ?? 0) + 1);
    }
    const professions = [...byProfession].sort(([one], [other]) => one < other ? -1 : 1)
        .map(([letter, count]) => `${letter} ${count}`).join(", ");
    const levels = cast.map((one) => one.level);
    const lowest = Math.min(...levels);
    const highest = Math.max(...levels);
    const stated = lowest === highest
        ? `level ${lowest}`
        : `levels ${lowest}${RANGE_MARK}${highest}`;
    return [counted, professions, stated].join(PART_MARK);
}

function getSection(text: string, from: string, to: string): string {
    const start = text.indexOf(from);
    assertNotEquals(start, -1, `${from} is a section of the register`);
    const end = text.indexOf(to, start);
    assert(end > start, `${from} ends where ${to} starts`);
    return text.slice(start, end);
}

/** Every backticked row of a table, whatever its first cell names. */
function getTableRows(section: string): string[][] {
    const found: string[][] = [];
    for (const line of section.split("\n")) {
        const cells = getRowCells(line);
        if (cells.length === 0) continue;
        found.push(cells);
    }
    assert(found.length > 0, "a section this guard reads carries a table");
    assert(found.length <= MAXIMUM_ROWS, "and stays inside the bound this file walks by");
    return found;
}

Deno.test("the cast each row states is the cast the recording's payloads state", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const rows = getRecordingRows(getSection(register, CAST_HEADING, RECORDINGS_HEADING));
    let checked = 0;
    for (const path of getRecordingPaths()) {
        const row = rows.find((cells) => cells[0] === path);
        assertExists(row, `${path}: no row states its cast`);
        const seat = getReaderSide(path);
        const cast = [...getRecordedWarriors(path).values()];
        const ours = cast.filter((one) => one.side === seat);
        const theirs = cast.filter((one) => one.side !== seat);
        assertEquals(row[1], `${ours.length} vs ${theirs.length}`, `${path}: the shape`);
        assertEquals(row[3], composeCastText(ours), `${path}: who was on the reader's side`);
        assertEquals(row[4], composeCastText(theirs), `${path}: and who was on the other`);
        checked += 1;
    }
    assertEquals(checked, getRecordingPaths().length, "every recording's cast was re-earned");
});

Deno.test("the census of shapes is the shapes the recordings actually are", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const counted = new Map<string, number>();
    for (const path of getRecordingPaths()) {
        const seat = getReaderSide(path);
        const cast = [...getRecordedWarriors(path).values()];
        const ours = cast.filter((one) => one.side === seat).length;
        const shape = `${ours} vs ${cast.length - ours}`;
        counted.set(shape, (counted.get(shape) ?? 0) + 1);
    }
    const stated = getTableRows(getSection(register, CENSUS_HEADING, CAST_HEADING));
    assertEquals(
        stated.map((cells) => cells.join(" ")).sort(),
        [...counted].map(([shape, count]) => `${shape} ${count}`).sort(),
        "the census counts the shapes the material holds, and no others",
    );
    assert(
        counted.size > 1,
        "the material holds more than one shape, so the census says something",
    );
});
