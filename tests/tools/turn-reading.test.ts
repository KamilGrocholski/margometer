/**
 * The message reading, held against the recordings both ways, and against the panel's own count.
 *
 * Two guards that answer different questions. The register is compared as a set in both
 * directions, so a row nobody produces and a dispute nobody wrote both fail. The drift guard is
 * the one that matters more: this reading walks the events itself rather than through
 * `composeFightStatistics`, so nothing but a test stops the two from counting a fight differently.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import {
    composeDisputedReadings,
    composeDisputeRegister,
    composeKeyTally,
    composeMessageReadings,
    composeReadingReport,
    type DisputedReading,
    type KeyTally,
} from "@/tools/turn-reading.ts";
import { composeFightReplay } from "@/tools/fight-replay.ts";
import { getRecordedFightAt, getRecordedFights } from "@/tools/recorded-fights.ts";

const REGISTER_PATH = "docs/reading-a-turn.md";
/** The recording carrying the most disputed openers, which is where a walk is worth reading. */
const DISPUTED = "captures/2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none.json";

interface RegisterRow {
    name: string;
    payload: string;
    at: string;
    combatantId: string;
    from: string;
    to: string;
    counted: string;
    key: string;
}

function getCellsFromLine(line: string): string[] {
    const cells: string[] = [];
    let at = line.indexOf("|");
    assert(at >= 0, "a table line opens with a bar");
    let next = line.indexOf("|", at + 1);
    // The bound is the line's own length: a table row holds fewer cells than it holds characters.
    for (let held = 0; held < line.length; held += 1) {
        if (next === -1) break;
        cells.push(line.slice(at + 1, next).trim());
        at = next;
        next = line.indexOf("|", at + 1);
    }
    return cells;
}

/** The backticks are the document's, not the vocabulary's, so they come off before comparing. */
function getBareCell(cell: string): string {
    const open = cell.indexOf("`");
    if (open === -1) return cell;
    const close = cell.indexOf("`", open + 1);
    if (close === -1) return cell;
    return cell.slice(open + 1, close);
}

/**
 * The register's own table and no other in the file. Read by the heading it sits under, because
 * the document carries a vocabulary table too and a reader that took that one would compare a
 * sentence against a recording.
 */
function getRegisterRows(text: string): RegisterRow[] {
    const found: RegisterRow[] = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith("## The register")) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside) continue;
        if (!line.startsWith("| ")) continue;
        const cells = getCellsFromLine(line).map(getBareCell);
        const [name, payload, at, combatantId, from, to, counted, key] = cells;
        if (name === undefined) continue;
        if (payload === undefined) continue;
        if (at === undefined) continue;
        if (combatantId === undefined) continue;
        if (from === undefined) continue;
        if (to === undefined) continue;
        if (counted === undefined) continue;
        if (key === undefined) continue;
        if (!name.startsWith("2026-")) continue;
        found.push({ name, payload, at, combatantId, from, to, counted, key });
    }
    return found;
}

function composeRegisterKey(one: RegisterRow): string {
    return `${one.name} | ${one.payload} | ${one.at} | ${one.combatantId} | ${one.from} | ` +
        `${one.to} | ${one.counted} | ${one.key}`;
}

/** The same line off the tree rather than off the document, so the two can be compared as sets. */
function composeMeasuredKey(one: DisputedReading): string {
    return `${one.name} | ${one.payload} | ${one.at} | ${one.combatantId} | ${one.from} | ` +
        `${one.to} | ${one.counted} | ${one.key}`;
}

Deno.test("the register reader finds the register, and nothing else in the file", () => {
    const sample = "## The register\n\n| recording | payload | message | combatant | from | to " +
        "| counted | key |\n| - | - | - | - | - | - | - | - |\n" +
        "| 2026-08-06-tempest | 25 | 2 | -10000249 | 57 | 59 | 3 | `prepare` |\n";
    assertEquals(
        getRegisterRows(sample).map(composeRegisterKey),
        ["2026-08-06-tempest | 25 | 2 | -10000249 | 57 | 59 | 3 | prepare"],
        "the reader works",
    );
    // The sample it must not flag: a row standing before the heading, and the vocabulary table,
    // whose first cell is a phrase rather than a recording.
    const elsewhere = "| 2026-08-06-tempest | 25 | 2 | -10000249 | 57 | 59 | 3 | `prepare` |\n" +
        "## The register\n| a `?dmg*` figure | an attack | that combatant acted |\n" +
        "| recording | payload | message | combatant | from | to | counted | key |\n";
    assertEquals(getRegisterRows(elsewhere), [], "a table outside the register is not one");
});

Deno.test("the register names every disputed opener, and no opener that is not", () => {
    const measured = new Set(composeDisputeRegister(getRecordedFights()).map(composeMeasuredKey));
    const written = new Set(
        getRegisterRows(Deno.readTextFileSync(REGISTER_PATH)).map(composeRegisterKey),
    );
    assert(written.size > 0, "the register carries rows");
    const unwritten = [...measured].filter((one) => !written.has(one)).sort();
    assertEquals(unwritten, [], `${REGISTER_PATH}: an opener is disputed that the register omits`);
    const undisputed = [...written].filter((one) => !measured.has(one)).sort();
    assertEquals(undisputed, [], `${REGISTER_PATH}: the register names a dispute nothing produces`);
});

/**
 * The guard the whole tool rests on. This reading applies the rule event by event itself; the
 * panel applies it inside `composeFightStatistics`. Nothing in the types stops the two from
 * drifting, so the turns one finds are held against the turns the other draws, per combatant, on
 * every recording the corpus carries.
 */
Deno.test("what this reading counts is what the panel draws, on every recording", () => {
    let checked = 0;
    for (const fight of getRecordedFights()) {
        const taken = new Map<number, number>();
        const lost = new Map<number, number>();
        for (const reading of composeMessageReadings(fight)) {
            if (reading.openerId !== null) {
                taken.set(reading.openerId, (taken.get(reading.openerId) ?? 0) + 1);
            }
            if (reading.lostId === null) continue;
            lost.set(reading.lostId, (lost.get(reading.lostId) ?? 0) + 1);
        }
        const figures = composeFightReplay(fight).statistics.byCombatantId;
        for (const [combatantId, drawn] of figures) {
            assertStrictEquals(
                taken.get(combatantId) ?? 0,
                drawn.turnsTaken,
                `${fight.name}: the turns read and the turns drawn differ for ${combatantId}`,
            );
            assertStrictEquals(
                lost.get(combatantId) ?? 0,
                drawn.turnsLost,
                `${fight.name}: the turns lost read and drawn differ for ${combatantId}`,
            );
            checked += 1;
        }
    }
    assert(checked > 0, "the corpus carries rows to hold the two readings against each other");
});

/**
 * A disputed opener is contested **and** inside a stretch the game says is wrong. Both halves are
 * load-bearing: the corpus carries contested openers inside stretches the numbering counts right,
 * and dropping the second half would put every one of them in the register.
 */
Deno.test("a contested opener the game's numbering agrees with is no dispute", () => {
    let contested = 0;
    let disputed = 0;
    for (const fight of getRecordedFights()) {
        for (const reading of composeMessageReadings(fight)) {
            if (reading.isContested) contested += 1;
        }
        disputed += composeDisputedReadings(fight).length;
    }
    assert(contested > disputed, "a stretch counted right leaves its contested openers standing");
    assertStrictEquals(disputed, 18, "the openers the numbering disputes, 2026-09-03");
});

/** The key table's own rows, read by the heading it sits under and by nothing else. */
function getKeyRows(text: string): string[] {
    const found: string[] = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith("## The keys a turn was read off")) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside) continue;
        if (!line.startsWith("| `")) continue;
        const cells = getCellsFromLine(line).map(getBareCell);
        const [key, messages, opened, lost] = cells;
        if (key === undefined) continue;
        if (messages === undefined) continue;
        if (opened === undefined) continue;
        if (lost === undefined) continue;
        found.push(`${key} | ${messages} | ${opened} | ${lost}`);
    }
    return found;
}

function composeTallyKey(one: KeyTally): string {
    return `${one.key} | ${one.messages} | ${one.opened} | ${one.lost}`;
}

Deno.test("the key table names every key a turn was read off, and no key that was not", () => {
    const measured = new Set(composeKeyTally(getRecordedFights()).map(composeTallyKey));
    const written = new Set(getKeyRows(Deno.readTextFileSync(REGISTER_PATH)));
    assert(written.size > 0, "the key table carries rows");
    const unwritten = [...measured].filter((one) => !written.has(one)).sort();
    assertEquals(unwritten, [], `${REGISTER_PATH}: a key stands behind a turn and is not written`);
    const untallied = [...written].filter((one) => !measured.has(one)).sort();
    assertEquals(untallied, [], `${REGISTER_PATH}: the table names a key nothing produces`);
});

/**
 * The one claim the table makes that a reader could act on: a turn nobody spent is read off one
 * key and no other, and that key opens no turn of its own. Both halves, because a key that both
 * opened and lost turns would make the two columns mean the same thing.
 */
Deno.test("a turn nobody spent is read off one key, and that key opens none", () => {
    const tally = composeKeyTally(getRecordedFights());
    const losing = tally.filter((one) => one.lost > 0);
    assertStrictEquals(losing.length, 1, "one key states a turn nobody spent");
    const only = losing[0];
    assert(only !== undefined, "and it is there to be read");
    assertStrictEquals(only.key, "txt", "the key the game writes its sentence on");
    assertStrictEquals(only.opened, 0, "and it opens no turn of its own");
    assert(tally.every((one) => one.opened <= one.messages), "a key opens no more than it arrives");
});

Deno.test("a walk states a line for every message the recording carried", () => {
    const fight = getRecordedFightAt(DISPUTED);
    const readings = composeMessageReadings(fight);
    const lines = composeReadingReport(fight);
    assertStrictEquals(lines.length, readings.length + 2, "a blank line, a heading, then the walk");
    assert(readings.length > 0, "the recording carried messages to read");
    // Zero is a boundary and so is one (**W5**): the first message of a fight is read against a
    // standing of nobody, and it is a message like any other.
    const first = readings[0];
    assert(first !== undefined, "the first message is one of them");
    assertStrictEquals(first.payload, 0, "and it sits in the payload that opened the fight");
});

/** No message of the game's reaches the register or the walk — only its keys and its number. */
Deno.test("neither the register nor a walk carries a word the game wrote", () => {
    const fight = getRecordedFightAt(DISPUTED);
    const messages = composeFightReplay(fight).reading.messagesByPayload.flat();
    const written = Deno.readTextFileSync(REGISTER_PATH) + composeReadingReport(fight).join("\n");
    let checked = 0;
    for (const message of messages) {
        const stated = message.split(";").find((field) => field.startsWith("prepare="));
        if (stated === undefined) continue;
        const text = stated.slice("prepare=".length);
        assert(text.length > 0, "a preparation states what is being made ready");
        assert(!written.includes(text), `${REGISTER_PATH}: the game's own wording is written down`);
        checked += 1;
    }
    assert(checked > 0, "the recording states a preparation to check against");
});
