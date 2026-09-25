/**
 * The message reading, held against the recordings both ways, and against the panel's own count.
 *
 * Two guards that answer different questions. The register is compared as a set in both
 * directions, so a row nobody produces and a dispute nobody wrote both fail. The drift guard is the
 * one that matters more: this reading walks the events itself rather than through the tally, so
 * nothing but a test stops the two from counting a fight differently.
 */

import {
    assert,
    assertEquals,
    assertStrictEquals,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import { parseTableCells, parseUnwrappedText } from "#/tests/markdown-document.ts";
import {
    lookupRecordedFight,
    readRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "#/tests/recorded-fights.ts";
import { BATTLE_EVENT, type BattleEvent } from "#/src/core/battle-event.ts";
import { PREPARE_KEY, TEXT_KEY } from "#/src/core/protocol-key.ts";
import { ENVELOPE_KEYS } from "#/src/game/payload-envelope.ts";
import { FILE_FIELD } from "#/src/runtime/fight-file.ts";
import { TurnReadingError } from "#/tools/margometer-tool-error.ts";
import { readRecordedMaterial, replayRecordedMaterial } from "#/tools/recorded-material.ts";
import {
    composeDisputedReadings,
    composeDisputeRegister,
    composeFightMessages,
    composeKeyTally,
    composeOpenerTally,
    type DisputedReading,
    type FightMessages,
    formatReadingWalk,
    type KeyTally,
    type OpenerTally,
    parseReadingArguments,
} from "#/tools/turn-reading.ts";

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

const REGISTER_PATH = "docs/reading-a-turn.md";
const REGISTER_HEADING = "## The register";
const KEYS_HEADING = "## The keys a turn was read off";
const OPENERS_HEADING = "## What each turn was opened by";
const SECTION_OPENER = "## ";
const ROW_OPENER = "| ";
const QUOTED_ROW_OPENER = "| `";
const RECORDING_OPENER = "2026-";
/** The event that leaves nobody having acted, which is what the third row of that table is. */
const HEALTH_MOVED: BattleEvent["kind"] = BATTLE_EVENT.healthChange;
/** The recording carrying the most disputed openers, which is where a walk is worth reading. */
const DISPUTED = "captures/2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none.json";
/** Combatant 1 announcing a skill, which opens their turn. */
const ANNOUNCEMENT = "1=100.00;2=100.00;tspell=Coś;skillId=1";
/** And making something ready, which rides a turn of theirs still standing. */
const PREPARATION = "1=100.00;0;prepare=Coś";
let walksHeld: FightMessages[] | null = null;

Deno.test("the register reader finds the register, and nothing else in the file", () => {
    const sample = "## The register\n\n| recording | payload | message | combatant | from | to " +
        "| counted | key |\n| - | - | - | - | - | - | - | - |\n" +
        "| 2026-08-06-tempest | 25 | 2 | -10000249 | 57 | 59 | 3 | `prepare` |\n";
    assertEquals(
        parseRegisterRows(sample).map(formatRegisterKey),
        ["2026-08-06-tempest | 25 | 2 | -10000249 | 57 | 59 | 3 | prepare"],
        "the reader works",
    );
    // The sample it must not flag: a row standing before the heading, and the vocabulary table,
    // whose first cell is a phrase rather than a recording.
    const elsewhere = "| 2026-08-06-tempest | 25 | 2 | -10000249 | 57 | 59 | 3 | `prepare` |\n" +
        "## The register\n| a `?dmg*` figure | an attack | that combatant acted |\n" +
        "| recording | payload | message | combatant | from | to | counted | key |\n";
    assertEquals(parseRegisterRows(elsewhere), [], "a table outside the register is not one");
});

/**
 * The register's own table and no other in the file. Read by the heading it sits under, because
 * the document carries a vocabulary table too, and a reader taking that one would compare a
 * sentence against a recording.
 */
function parseRegisterRows(text: string): RegisterRow[] {
    const found: RegisterRow[] = [];
    for (const line of parseSectionLines(text, REGISTER_HEADING)) {
        if (!line.startsWith(ROW_OPENER)) continue;
        const [name, payload, at, combatantId, from, to, counted, key] = parseTableCells(line);
        if (key === undefined) continue;
        if (!name!.startsWith(RECORDING_OPENER)) continue;
        found.push({
            name: name!,
            payload: payload!,
            at: at!,
            combatantId: combatantId!,
            from: from!,
            to: to!,
            counted: counted!,
            key,
        });
    }
    return found;
}

/** The lines under one heading, up to the next. */
function parseSectionLines(text: string, heading: string): string[] {
    const found: string[] = [];
    let isInside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith(heading)) isInside = true;
        else if (line.startsWith(SECTION_OPENER)) {
            if (isInside) break;
        }
        if (isInside) found.push(line);
    }
    return found;
}

function formatRegisterKey(one: RegisterRow): string {
    return `${one.name} | ${one.payload} | ${one.at} | ${one.combatantId} | ${one.from} | ` +
        `${one.to} | ${one.counted} | ${one.key}`;
}

Deno.test("the register names every disputed opener, and no opener that is not", () => {
    const measured = new Set(composeDisputeRegister(getWalks()).map(formatMeasuredKey));
    const written = new Set(
        parseRegisterRows(Deno.readTextFileSync(REGISTER_PATH)).map(formatRegisterKey),
    );
    assert(written.size > 0, "the register carries rows");
    const unwritten = [...measured].filter((one) => !written.has(one)).sort();
    assertEquals(unwritten, [], `${REGISTER_PATH}: an opener is disputed that the register omits`);
    const undisputed = [...written].filter((one) => !measured.has(one)).sort();
    assertEquals(undisputed, [], `${REGISTER_PATH}: the register names a dispute nothing produces`);
});

/** Every recording read once for every case that reads the whole of them. */
function getWalks(): FightMessages[] {
    if (walksHeld === null) walksHeld = composeFightMessages(readRecordedFights());
    return walksHeld;
}

/** The same line off the tree rather than off the document, so the two can be compared as sets. */
function formatMeasuredKey(one: DisputedReading): string {
    return `${one.name} | ${one.payload} | ${one.at} | ${one.combatantId} | ${one.from} | ` +
        `${one.to} | ${one.counted} | ${one.key}`;
}

/**
 * The guard the whole tool rests on. This reading applies the rule event by event itself; the
 * panel applies it inside the tally. Nothing in the types stops the two from drifting, so the
 * turns one finds are held against the turns the other draws, per combatant, on every recording.
 */
Deno.test("what this reading counts is what the panel draws, on every recording", () => {
    const replayed = replayRecordedMaterial(readRecordedMaterial([]));
    const walks = getWalks();
    assertStrictEquals(walks.length, replayed.length, "every recording is both read and drawn");
    let checked = 0;
    for (const [index, { reading }] of replayed.entries()) {
        const walk = walks[index]!;
        const taken = new Map<number, number>();
        const lost = new Map<number, number>();
        for (const one of walk.readings) {
            if (one.openerId !== null) taken.set(one.openerId, (taken.get(one.openerId) ?? 0) + 1);
            if (one.lostId !== null) lost.set(one.lostId, (lost.get(one.lostId) ?? 0) + 1);
        }
        for (const [combatantId, drawn] of reading.figures.statistics.byCombatantId) {
            assertStrictEquals(
                taken.get(combatantId) ?? 0,
                drawn.turnsTaken,
                `${walk.name}: the turns read and the turns drawn differ for ${combatantId}`,
            );
            assertStrictEquals(
                lost.get(combatantId) ?? 0,
                drawn.turnsLost,
                `${walk.name}: the turns lost read and drawn differ for ${combatantId}`,
            );
            checked += 1;
        }
    }
    assert(checked > 0, "the recordings carry rows to hold the two readings against each other");
});

/**
 * A disputed opener is contested **and** inside a stretch the game says is wrong. Both halves are
 * load-bearing: the recordings carry contested openers inside stretches the numbering counts right,
 * and dropping the second half would put every one of them in the register.
 */
Deno.test("a contested opener the game's numbering agrees with is no dispute", () => {
    let contested = 0;
    let disputed = 0;
    for (const walk of getWalks()) {
        contested += walk.readings.filter((one) => one.isContested).length;
        disputed += composeDisputedReadings(walk).length;
    }
    assert(contested > disputed, "a stretch counted right leaves its contested openers standing");
    assertStrictEquals(disputed, 3, "the openers the numbering disputes, 2026-09-25");
});

Deno.test("the key table names every key a turn was read off, and no key that was not", () => {
    const measured = new Set(composeKeyTally(getWalks()).map(formatTallyKey));
    const written = new Set(parseRowsUnder(Deno.readTextFileSync(REGISTER_PATH), KEYS_HEADING, 5));
    assert(written.size > 0, "the key table carries rows");
    const unwritten = [...measured].filter((one) => !written.has(one)).sort();
    assertEquals(unwritten, [], `${REGISTER_PATH}: a key stands behind a turn and is not written`);
    const untallied = [...written].filter((one) => !measured.has(one)).sort();
    assertEquals(untallied, [], `${REGISTER_PATH}: the table names a key nothing produces`);
});

function formatTallyKey(one: KeyTally): string {
    return `${one.key} | ${one.messages} | ${one.opened} | ${one.adds} | ${one.lost}`;
}

/**
 * A table's own rows under one heading, and no other's. The width tells two tables apart: the key
 * table's section also carries a two-column legend naming its columns in backticks, and a reader
 * taking every backticked row would compare a column name against a protocol key.
 */
function parseRowsUnder(text: string, heading: string, width: number): string[] {
    assert(width > 0, "a table is read at a width it states");
    const found: string[] = [];
    for (const line of parseSectionLines(text, heading)) {
        if (!line.startsWith(QUOTED_ROW_OPENER)) continue;
        const cells = parseTableCells(line);
        if (cells.length === width) found.push(cells.join(" | "));
    }
    return found;
}

Deno.test("the reader takes a table at its width, and the legend beside it at none", () => {
    const sample = "## The keys a turn was read off\n\n| column | counts |\n| - | - |\n" +
        "| `adds` | how many would not have opened one without this key |\n\n" +
        "| key | messages | opened | adds | lost |\n| - | - | - | - | - |\n" +
        "| `step` | 171 | 171 | 171 | 0 |\n";
    assertEquals(
        parseRowsUnder(sample, KEYS_HEADING, 5),
        ["step | 171 | 171 | 171 | 0"],
        "the five-column table is read and the two-column legend is not",
    );
});

/**
 * ⚠️ **The one sentence of that section a machine can re-earn, and it went stale twice before
 * anything did**: written with a date beside it, it read 141 against a corpus standing at 146. A
 * date is not a guard.
 */
Deno.test("the preparations that open a turn after health moved are the ones written down", () => {
    let onThatShape = 0;
    let opened = 0;
    for (const walk of getWalks()) {
        let before: readonly string[] = [];
        for (const reading of walk.readings) {
            if (reading.openerKey === PREPARE_KEY) {
                opened += 1;
                if (before.at(-1) === HEALTH_MOVED) onThatShape += 1;
            }
            before = reading.kinds;
        }
    }
    assert(onThatShape > 0, "the recordings carry the shape the sentence is about");
    assert(onThatShape < opened, "and carry a preparation opening a turn on some other shape");
    assertStringIncludes(
        parseUnwrappedText(Deno.readTextFileSync(REGISTER_PATH)),
        `The corpus stands ${onThatShape} preparations on that shape`,
        `${REGISTER_PATH}: how often a preparation opens a turn after health moved`,
    );
});

/**
 * The partition, and the arithmetic that says it is one. Every turn is opened by exactly one
 * event, so the openers sum to the recordings' turns; and every key that adds a turn adds one the
 * openers already counted, so the two columns close on each other with the blows left over.
 */
Deno.test("what opened the turns partitions them, and the keys all but the blows", () => {
    const openers = composeOpenerTally(getWalks());
    const written = new Set(
        parseRowsUnder(Deno.readTextFileSync(REGISTER_PATH), OPENERS_HEADING, 2),
    );
    assertEquals(
        new Set(openers.map(formatOpenerKey)),
        written,
        `${REGISTER_PATH}: the openers written and the openers measured are not the same set`,
    );
    let turns = 0;
    let blows = 0;
    for (const one of openers) {
        turns += one.turns;
        if (one.opener === BATTLE_EVENT.attack) blows += one.turns;
    }
    assertStrictEquals(turns, 5897, "every turn the recordings opened, 2026-09-25");
    let adds = 0;
    for (const one of composeKeyTally(getWalks())) adds += one.adds;
    assertStrictEquals(adds + blows, turns, "a turn is added by a key or opened by a blow");
    assert(blows > 0, "the recordings carry a turn no key accounts for");
});

function formatOpenerKey(one: OpenerTally): string {
    return `${one.opener} | ${one.turns}`;
}

/**
 * The one claim the table makes that a reader could act on: a turn nobody spent is read off one
 * key and no other, and that key opens no turn of its own. Both halves, because a key that both
 * opened and lost turns would make the two columns mean the same thing.
 */
Deno.test("a turn nobody spent is read off one key, and that key opens none", () => {
    const tally = composeKeyTally(getWalks());
    const losing = tally.filter((one) => one.lost > 0);
    assertStrictEquals(losing.length, 1, "one key states a turn nobody spent");
    const only = losing[0]!;
    assertStrictEquals(only.key, TEXT_KEY, "the key the game writes its sentence on");
    assertStrictEquals(only.opened, 0, "and it opens no turn of its own");
    assert(tally.every((one) => one.opened <= one.messages), "a key opens no more than it arrives");
});

Deno.test("a walk states a line for every message the recording carried", () => {
    const walk = composeFightMessages([lookupRecordedFight(DISPUTED)])[0]!;
    const lines = formatReadingWalk(walk);
    assertStrictEquals(lines.length, walk.readings.length + 2, "a blank, a heading, then the walk");
    assert(walk.readings.length > 0, "the recording carried messages to read");
    // Zero is a boundary and so is one (W5): the first message of a fight is read against a
    // standing of nobody, and it is a message like any other.
    const first = walk.readings[0]!;
    assertStrictEquals(first.payload, 0, "and it sits in the payload that opened the fight");
    assertStrictEquals(first.at, 0, "as the first message of it");
});

/** No message of the game's reaches the register or the walk: only its keys and its number. */
Deno.test("neither the register nor a walk carries a word the game wrote", () => {
    const fight = lookupRecordedFight(DISPUTED);
    const walk = composeFightMessages([fight])[0]!;
    const written = Deno.readTextFileSync(REGISTER_PATH) + formatReadingWalk(walk).join("\n");
    const opener = `${PREPARE_KEY}=`;
    let checked = 0;
    for (const message of fight.messages) {
        const stated = message.split(";").find((field) => field.startsWith(opener));
        if (stated === undefined) continue;
        const text = stated.slice(opener.length);
        assert(text.length > 0, "a preparation states what is being made ready");
        assert(!written.includes(text), `${REGISTER_PATH}: the game's own wording is written down`);
        checked += 1;
    }
    assert(checked > 0, "the recording states a preparation to check against");
});

Deno.test("a recording is named by a path, and a bare number is refused", () => {
    assertEquals(parseReadingArguments(["--keys"]), { isKeys: true, paths: [] }, "the flag alone");
    const paths = [DISPUTED];
    assertEquals(parseReadingArguments(paths), { isKeys: false, paths }, "and the paths as named");
    assertThrows(() => parseReadingArguments(["12"]), TurnReadingError, "never by a number");
});

/**
 * The turn standing carries across a payload boundary as the tally carries it. No recording shows
 * the difference, 2026-09-25: a standing started over at every payload reads the same corpus, so
 * this fight nobody fought is the one place a preparation meets its own combatant's turn across
 * two calls.
 */
Deno.test("a preparation in the next call rides the turn its combatant took in the one before", () => {
    const fight = composeUnfoughtFight([[ANNOUNCEMENT], [PREPARATION]]);
    const walk = composeFightMessages([fight])[0]!;
    assertEquals(
        walk.readings.map((one) => [one.payload, one.openerId]),
        [[0, 1], [1, null]],
        "the announcement opens the turn, and the preparation after it opens none",
    );
    assertStrictEquals(walk.readings[1]!.isContested, false, "a turn that did not open is not one");
    const drawn = replayRecordedMaterial({ material: fight.path, fights: [fight] })[0]!;
    const figures = drawn.reading.figures.statistics.byCombatantId.get(1)!;
    assertStrictEquals(
        figures.turnsTaken,
        1,
        "and the panel draws the one turn the reading counts",
    );
});

/** A recording of the calls given, the first opening the fight, in the file's own shape. */
function composeUnfoughtFight(payloads: readonly (readonly string[])[]): RecordedFight {
    const calls = payloads.map((messages, index) => {
        const payload = index === 0
            ? { [ENVELOPE_KEYS.isInit]: 1, [ENVELOPE_KEYS.messages]: messages }
            : { [ENVELOPE_KEYS.messages]: messages };
        return { [FILE_FIELD.messages]: messages, [FILE_FIELD.payload]: payload };
    });
    return readRecordedFight("unfought.json", { [FILE_FIELD.calls]: calls });
}
