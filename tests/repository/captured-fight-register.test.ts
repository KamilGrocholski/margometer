/**
 * `docs/captured-fights.md`, re-earned from the directory it describes. A row is true for good,
 * because a recording never changes, but the set does: what the guard composes is what the
 * material produces, and it refuses a row nothing produces and a recording no row names. The
 * recordings are read by `tests/recorded-fights.ts`, the one reader every suite goes through.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { parseJson } from "#/libs/json-text.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import { WARRIOR_FIELDS } from "#/src/game/engine-warrior.ts";
import { ENVELOPE_KEYS } from "#/src/game/payload-envelope.ts";
import { FILE_FIELD, NOTHING_STATED } from "#/src/runtime/fight-file.ts";
import { INTAKE_KEYS } from "#/tools/capture-intake.ts";
import { readRecordedFights, type RecordedFight } from "#/tests/recorded-fights.ts";

interface RecordedWarrior {
    side: number;
    profession: string;
    level: number;
    isPlayer: boolean;
}

const REGISTER_PATH = "docs/captured-fights.md";
const BACKTICK = "`";
const ROW_OPENER = "|";
/** What the register writes where a recording states no build, which some of them do not. */
const NO_BUILD = "none stated";
/** Past the row count of any table here, so each walk carries a stated bound. */
const ROWS_MAXIMUM = 256;
const CENSUS_HEADING = "## Shapes";
const CAST_HEADING = "## The fights";
const RECORDINGS_HEADING = "## The recordings";
/** How the register writes a range, and it is an en dash rather than a hyphen. */
const RANGE_MARK = "–";
const PART_MARK = " · ";

Deno.test("the reader knows a census row from every other line", () => {
    const row = "| `captures/a.json` | `tempest` | `1` | `0.9.0` | `4` | `18` |";
    assertEquals(readRecordingRows(row).length, 1, "a row naming a recording is one");
    assertEquals(readRecordingRows("| `1 vs 1` | `3` |"), [], "a row naming no recording is not");
    assertEquals(readRecordingRows("prose about `captures/a.json`"), [], "and neither is prose");
    // The sample the reader must not take for a census row: a fight's row states six cells too.
    assertEquals(isCountText("18"), true, "a count is digits");
    assertEquals(isCountText("1 NPC · m 1 · level 100"), false, "and a cast is not one");
    assertEquals(isCountText(""), false, "nor is a cell that says nothing");
});

/** The rows whose first cell names a recording, which is what a census row looks like. */
function readRecordingRows(text: string): string[][] {
    const found: string[][] = [];
    for (const line of text.split("\n")) {
        const cells = readRowCells(line);
        if ((cells[0] ?? "").startsWith("captures/")) found.push(cells);
    }
    return found;
}

/** Every backticked cell of a table row, in the order the row states them. */
function readRowCells(line: string): string[] {
    if (!line.trimStart().startsWith(ROW_OPENER)) return [];
    const found: string[] = [];
    let at = line.indexOf(BACKTICK);
    while (at !== -1) {
        assert(found.length <= ROWS_MAXIMUM, "the walk stays inside its stated bound");
        const closes = line.indexOf(BACKTICK, at + 1);
        if (closes === -1) break;
        found.push(line.slice(at + 1, closes));
        at = line.indexOf(BACKTICK, closes + 1);
    }
    return found;
}

/** A cell that is a count, which is how a census row is told from a fight's row of six. */
function isCountText(text: string): boolean {
    if (text.length === 0) return false;
    for (const character of text) {
        if (character < "0" || character > "9") return false;
    }
    return true;
}

Deno.test("a recording is filed under the two versions it states", () => {
    const fights = readRecordedFights();
    assert(fights.length > 0, "there is material to check");
    for (const fight of fights) {
        const build = readNameVersion(readEnvelopeText(fight.path, FILE_FIELD.gameBuild));
        const addOn = readNameVersion(readEnvelopeText(fight.path, FILE_FIELD.addOnVersion));
        assert(
            fight.path.endsWith(`-${build}-${addOn}.json`),
            `${fight.path}: is named for ${build} and ${addOn}, which is what it states`,
        );
    }
});

/** A field of the envelope as text, or the register's words for a field it does not state. */
function readEnvelopeText(path: string, field: string): string {
    const parsed = parseJson(Deno.readTextFileSync(path));
    assert(parsed.ok, `${path}: a recording is JSON`);
    assert(isRecord(parsed.value), `${path}: a recording is a record`);
    const value = parsed.value[field];
    if (value === undefined) return NO_BUILD;
    if (value === null) return NO_BUILD;
    assert(typeof value === "string", `${path}: ${field} is stated as text or as nothing`);
    return value;
}

/** What a filename says of a version, where the register says `none stated`. */
function readNameVersion(stated: string): string {
    return stated === NO_BUILD ? NOTHING_STATED : stated;
}

Deno.test("every recording is named by the register, and every row names one", () => {
    const rows = readRecordingRows(Deno.readTextFileSync(REGISTER_PATH));
    assert(rows.length > 0, "the register carries rows to check");
    const named = new Set(rows.map((cells) => cells[0] ?? ""));
    const held = new Set(readRecordedFights().map((fight) => fight.path));
    assertEquals([...held].filter((path) => !named.has(path)).sort(), [], "a recording unnamed");
    assertEquals([...named].filter((path) => !held.has(path)).sort(), [], "a row naming nothing");
});

/** The four a machine recomputes outright; the cast column has a test of its own below. */
Deno.test("what the register states of each recording is what the recording states", () => {
    const rows = readRecordingRows(Deno.readTextFileSync(REGISTER_PATH));
    let checked = 0;
    for (const fight of readRecordedFights()) {
        const counted = rows.filter((cells) => cells[0] === fight.path).find((cells) =>
            cells.length === 6 && isCountText(cells[4] ?? "") && isCountText(cells[5] ?? "")
        );
        assertExists(counted, `${fight.path}: no row states its world, versions, calls, messages`);
        const path = fight.path;
        assertEquals(counted[1], readEnvelopeText(path, FILE_FIELD.world), `${path}: the world`);
        assertEquals(counted[2], readEnvelopeText(path, FILE_FIELD.gameBuild), `${path}: build`);
        assertEquals(counted[3], readEnvelopeText(path, FILE_FIELD.addOnVersion), `${path}: ours`);
        assertEquals(counted[4], String(fight.updates.length), `${path}: the calls`);
        assertEquals(counted[5], String(fight.messages.length), `${path}: the messages`);
        checked += 1;
    }
    assertEquals(checked, readRecordedFights().length, "every recording was re-earned");
});

Deno.test("the cast each row states is the cast the recording's payloads state", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const rows = readRecordingRows(readSection(register, CAST_HEADING, RECORDINGS_HEADING));
    let checked = 0;
    for (const fight of readRecordedFights()) {
        const row = rows.find((cells) => cells[0] === fight.path);
        assertExists(row, `${fight.path}: no row states its cast`);
        const seat = readReaderSide(fight);
        const cast = [...indexRecordedWarriors(fight).values()];
        const ours = cast.filter((one) => one.side === seat);
        const theirs = cast.filter((one) => one.side !== seat);
        assertEquals(row[1], `${ours.length} vs ${theirs.length}`, `${fight.path}: the shape`);
        assertEquals(row[3], formatCastText(ours), `${fight.path}: the reader's side`);
        assertEquals(row[4], formatCastText(theirs), `${fight.path}: and the other`);
        checked += 1;
    }
    assertEquals(checked, readRecordedFights().length, "every recording's cast was re-earned");
});

/** The text between a heading and the next one named, which is where a table stands. */
function readSection(text: string, opening: string, closing: string): string {
    const start = text.indexOf(`\n${opening}\n`);
    assert(start !== -1, `the register has a section ${opening}`);
    const end = text.indexOf(`\n${closing}\n`, start);
    assert(end !== -1, `and one ${closing} after it`);
    return text.slice(start, end);
}

function readReaderSide(fight: RecordedFight): number {
    let side: number | null = null;
    for (const update of fight.updates) {
        if (side !== null) break;
        if (!isRecord(update)) continue;
        const stated = update[ENVELOPE_KEYS.readerSide];
        if (typeof stated === "number") side = stated;
        if (typeof stated === "string") side = Number(stated);
    }
    assertExists(side, `${fight.path}: no payload states the reader's own side`);
    return side;
}

/** Every warrior a recording's payloads state, by id, so one person is counted once. */
function indexRecordedWarriors(fight: RecordedFight): Map<number, RecordedWarrior> {
    const found = new Map<number, RecordedWarrior>();
    for (const update of fight.updates) {
        if (!isRecord(update)) continue;
        const warriors = update[ENVELOPE_KEYS.combatants];
        if (!isRecord(warriors)) continue;
        for (const stated of Object.values(warriors)) {
            if (!isRecord(stated)) continue;
            const id = stated[WARRIOR_FIELDS.id];
            const side = stated[WARRIOR_FIELDS.side];
            const level = stated[WARRIOR_FIELDS.level];
            const profession = stated[WARRIOR_FIELDS.profession];
            if (typeof id !== "number") continue;
            if (typeof side !== "number") continue;
            if (typeof level !== "number") continue;
            if (typeof profession !== "string") continue;
            const isPlayer = stated[INTAKE_KEYS.nonPlayer] === 0;
            found.set(id, { side, profession, level, isPlayer });
        }
    }
    assert(found.size > 0, `${fight.path}: no warrior was read out of its payloads`);
    assert(found.size <= ROWS_MAXIMUM, `${fight.path}: stays inside the bound this file walks by`);
    return found;
}

/** `10 players · h 1, m 2, p 2, t 1, w 4 · levels 93–120`, in the register's own words. */
function formatCastText(cast: readonly RecordedWarrior[]): string {
    assert(cast.length > 0, "a side with nobody on it is not a side this register writes");
    const players = cast.filter((one) => one.isPlayer).length;
    // Every side in `captures/` is all people or all monsters, so the register has one noun each.
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

Deno.test("the census of shapes is the shapes the recordings actually are", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const counted = new Map<string, number>();
    for (const fight of readRecordedFights()) {
        const seat = readReaderSide(fight);
        const cast = [...indexRecordedWarriors(fight).values()];
        const ours = cast.filter((one) => one.side === seat).length;
        const shape = `${ours} vs ${cast.length - ours}`;
        counted.set(shape, (counted.get(shape) ?? 0) + 1);
    }
    const stated = readRecordingTableRows(readSection(register, CENSUS_HEADING, CAST_HEADING));
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

/** Every backticked row of a table, whatever its first cell names. */
function readRecordingTableRows(section: string): string[][] {
    const found = section.split("\n").map(readRowCells).filter((cells) => cells.length > 0);
    assert(found.length > 0, "a section this guard reads carries a table");
    assert(found.length <= ROWS_MAXIMUM, "and stays inside the bound this file walks by");
    return found;
}
