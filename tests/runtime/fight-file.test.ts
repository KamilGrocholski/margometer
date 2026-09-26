/**
 * The recording a reader hands over, written and read back.
 *
 * The shape is a contract: what this writes has to be the shape every file in
 * `captures/` already is, or new material cannot be set beside admitted material. So the
 * test that matters reads a recording out of git and checks the envelope against it, key by key.
 */

import {
    assert,
    assertEquals,
    assertInstanceOf,
    AssertionError,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { JsonUnwritable, parseJson } from "#/libs/json-text.ts";
import { isRecord, type UnknownRecord } from "#/libs/unknown-value.ts";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import { decodePayloadMessages } from "#/src/core/fight-decoder.ts";
import { tallyFightFigures } from "#/src/core/fight-figures.ts";
import { getFightView } from "#/src/core/fight-session.ts";
import { initCombatantFigures, tallyFightStatistics } from "#/src/core/fight-statistics.ts";
import { NO_CAPTURE } from "#/src/game/fight-capture.ts";
import {
    encodeFightFile,
    encodeFightReport,
    type FileCalls,
    type FileSubject,
    type FileSurroundings,
    FileUnserializable,
} from "#/src/runtime/fight-file.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { readRecordedFights, replayRecordedFight } from "#/tests/recorded-fights.ts";

/**
 * The newest envelope. `formatVersion` does not identify the shape (every recording of
 * `captures/` states 1, and four envelopes exist among them), so the contract is the
 * newest, named rather than found.
 */
const NEWEST = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";
const ADD_ON_VERSION = "0.0.0-test";

const SURROUNDINGS: FileSurroundings = {
    world: "tempest",
    gameBuild: "53XkBRxF",
    capturedAt: "2026-08-29T10:11:12.345Z",
    userAgent: "a browser that said so",
    addOnVersion: ADD_ON_VERSION,
};

const LIVE_EMPTY: FileCalls = NO_CAPTURE;

Deno.test("the envelope is the one every admitted recording already carries", () => {
    const admitted = readFile(readRecordingText(NEWEST));
    const written = readFile(writeFile(LIVE_EMPTY, null).text);
    // Two keys an admitted recording gains at intake and this never writes.
    const atIntake = ["namesSubstituted", "descriptionsRemoved"];
    const owed = Object.keys(admitted).filter((key) => !atIntake.includes(key));
    const composed = Object.keys(written);
    // The one key the other way: intake takes the figures back off before admitting.
    assertEquals(composed.filter((key) => key !== "report"), owed, "the same keys, in that order");
    assertEquals(
        composed[composed.indexOf("report") + 1],
        "droppedCalls",
        "and the figures stand above the calls, where a reader opening the file meets them",
    );
    assertEquals(written.formatVersion, 4, "the envelope that may carry them says which one it is");
    assertEquals(written.addOnVersion, ADD_ON_VERSION, "with the build that wrote it");
    assertEquals(written.world, "tempest", "the world it was taken on");
    assertEquals(written.gameBuild, "53XkBRxF", "the client's own build");
    assertEquals(written.isTruncated, false, "and a tail nothing was cut off");
});

function readFile(text: string): UnknownRecord {
    const parsed = parseJson(text);
    assert(!(parsed instanceof Error), "a recording written as text reads back as JSON");
    assert(isRecord(parsed), "and reads back as a record");
    return parsed;
}

function readRecordingText(path: string): string {
    return Deno.readTextFileSync(path);
}

function writeFile(calls: FileCalls, subject: FileSubject | null, around = SURROUNDINGS) {
    const file = encodeFightFile(calls, subject, around);
    assert(!(file instanceof Error), "a recording is written as text");
    return file;
}

Deno.test("a recording nobody measured says null, where one measured says a number", () => {
    const call = {
        index: 0,
        payload: { foo: 1 },
        messages: ["one"],
        combatantsBefore: null,
        combatantsAfter: null,
    };
    const kept = readFile(
        writeFile({ calls: [call], droppedCalls: null, isTruncated: null }, null).text,
    );
    assertEquals(kept.droppedCalls, null, "what nobody counted is absent, never none dropped");
    assertEquals(kept.isTruncated, null, "and a tail nobody could ask about is not a whole one");
    const calls = kept.calls;
    assert(Array.isArray(calls), "the calls are a list");
    const first = calls[0];
    assert(isRecord(first), "and each one a record");
    assertEquals(first.index, 0, "numbered as it was kept");
    assertEquals(first.payload, { foo: 1 }, "carrying the payload as the game sent it");
    assertEquals(first.combatantsBefore, null, "a snapshot nobody read is absent, never empty");
    assertEquals(first.combatantsAfter, null, "on either side of the call");
    assertEquals(first.messages, ["one"], "while what was read is written as it was read");

    const live = readFile(writeFile(LIVE_EMPTY, null).text);
    assertEquals(live.droppedCalls, 0, "a recording collected live counted, and none were");
    assertEquals(live.isTruncated, false, "and says its tail is whole, which is a measurement");
});

Deno.test("a recording that could not read its surroundings says so rather than inventing", () => {
    const blind = { ...SURROUNDINGS, gameBuild: null, userAgent: null };
    const written = readFile(writeFile(LIVE_EMPTY, null, blind).text);
    assertEquals(written.gameBuild, null, "a build nobody stated is absent, never a stand-in");
    assertEquals(written.userAgent, null, "and so is a browser that said nothing of itself");
    assertThrows(
        () => encodeFightFile(LIVE_EMPTY, null, { ...SURROUNDINGS, gameBuild: "" }),
        AssertionError,
        "a build it could not read is absent, never empty",
    );
    assertThrows(
        () => encodeFightFile(LIVE_EMPTY, null, { ...SURROUNDINGS, userAgent: "" }),
        AssertionError,
        "and so is a browser that said nothing of itself",
    );
});

Deno.test("the figures travel with the calls, and nothing is written where none were read", () => {
    const blank = readFile(writeFile(LIVE_EMPTY, null).text);
    assertEquals(blank.report, null, "a fight nobody read is said to be none, never an empty one");

    const text = writeFile(LIVE_EMPTY, composeEmptySubject()).text;
    const report = readFile(text).report;
    assert(isRecord(report), "a fight that was read is written into the recording beside it");
    assertEquals(report.payloads, 1, "with what it was built from");
    assertEquals(report.combatants, {}, "and a cast of nobody, which is a reading and not a gap");
    assert(!("addOnVersion" in report), "what qualifies the numbers stands once, in the envelope");
    assert(!text.includes('MargoMeter"'), "so the add-on's name is not in the file twice");
});

/** A fight read from one payload with nobody in it: the smallest subject there is. */
function composeEmptySubject(): FileSubject {
    const roster = indexCombatantRoster([]);
    return {
        statistics: tallyFightStatistics([], new Map()),
        roster,
        place: null,
        payloads: 1,
        messagesLost: 0,
        isOver: false,
    };
}

Deno.test("a file is named for the world, both versions and the moment", () => {
    const name = writeFile(LIVE_EMPTY, null).name;
    assertEquals(
        name,
        `margometer-tempest-53XkBRxF-${ADD_ON_VERSION}-2026-08-29T10-11-12-345Z.json`,
        "the world, the game's build, ours, then the moment",
    );
    const blind = writeFile(LIVE_EMPTY, null, { ...SURROUNDINGS, gameBuild: null }).name;
    assertStringIncludes(blind, "-none-", "a build the page never stated is said to be none");
    assert(!name.slice(0, -".json".length).includes(":"), "no colon reaches a file's name");
    assertStringIncludes(
        name,
        "10-11-12-345Z",
        "and the moment's point is a dash, as its colons are",
    );
});

/**
 * **Every fight-wide figure the aggregate holds reaches the file a reader is handed.** Read off a
 * tallied aggregate rather than off a list typed here, so a figure arriving in `FightStatistics`
 * fails this until it is written out.
 */
Deno.test("every fight-wide figure the aggregate holds is written into the handover", () => {
    const subject = composeEmptySubject();
    const counted = Object.entries(subject.statistics)
        .filter(([, value]) => typeof value === "number")
        .map(([name]) => name);
    assert(counted.length > 0, "the aggregate holds figures beside its rows");
    const written = readFile(writeFile(LIVE_EMPTY, subject).text).report;
    assert(isRecord(written), "a fight that was read is written into the recording");
    assertEquals(
        counted.filter((name) => !(name in written)),
        [],
        "a figure the aggregate counts and the handover does not carry",
    );
});

Deno.test("every figure of a row is written, for each combatant and for the totals", () => {
    const report = encodeFightReport(composeFoughtSubject());
    const owed = Object.keys(initCombatantFigures()).sort();
    const combatants = report.combatants;
    assert(isRecord(combatants), "the report holds a row per combatant");
    assertEquals(Object.keys(combatants).sort(), ["1", "2"], "one per combatant it counted");
    for (const row of [combatants["1"], combatants["2"], report.totals]) {
        assert(isRecord(row), "every row is a record");
        assertEquals(Object.keys(row).sort(), owed, "holding every figure a row counts");
    }
    const dealer = combatants["1"];
    assert(isRecord(dealer), "the dealer has a row");
    assertEquals(dealer.damageDealtByOpponent, { "2": 100 }, "a cut is an object, not a map");
    assertEquals(dealer.damageDealtByOpponentAndKind, { "2": { dmg: 100 } }, "a pair cut too");
    assertEquals(dealer.procsWhenStriking, {}, "and an empty cut is an empty object");
});

/** Two combatants, a skill announced and its blow, and a blow glued to it landing nothing. */
function composeFoughtSubject(): FileSubject {
    const roster = indexCombatantRoster([
        { id: 1, name: "Gracz 1", side: 1, profession: "w", level: 40, healthMaximum: 1000 },
        { id: 2, name: "Gracz 2", side: 2, profession: "w", level: 40, healthMaximum: 1000 },
    ]);
    const messages = [
        "1=90.00;2=80.00;tspell=Cios;skillId=1;+dmg=100;-dmg=100",
        "1=90.00;2=80.00;+dmg=100;-blok=100;-dmg=0",
    ];
    const events =
        decodePayloadMessages(messages, { roster, standing: null, tables: BLOWS_GRANTED })
            .events;
    const statistics = tallyFightStatistics(events, new Map());
    return { statistics, roster, place: null, payloads: 1, messagesLost: 0, isOver: false };
}

/** Two swings under one name, which is the row the panel draws for it (`develop ADR 0078`). */
Deno.test("a skill row in the file carries its blows, which is what the panel drew it for", () => {
    const report = encodeFightReport(composeFoughtSubject());
    const combatants = report.combatants;
    assert(isRecord(combatants), "the report holds a row per combatant");
    const row = combatants["1"];
    assert(isRecord(row), "and the dealer has one");
    const skills = row.skills;
    assert(isRecord(skills), "with the skills it announced");
    assertEquals(skills["Cios"], {
        name: "Cios",
        uses: 1,
        dealt: 100,
        blows: 2,
        dealtByOpponent: { "2": 100 },
        restored: 0,
        restoredByOpponent: {},
    }, "the row states the blows beside what they dealt");
});

Deno.test("a value JSON has no text for is refused as unserializable, with its cause", () => {
    const call = {
        index: 0,
        payload: { big: 1n },
        messages: [],
        combatantsBefore: null,
        combatantsAfter: null,
    };
    const file = encodeFightFile(
        { calls: [call], droppedCalls: 0, isTruncated: false },
        null,
        SURROUNDINGS,
    );
    assertInstanceOf(file, FileUnserializable, "a payload the writer cannot write is no file");
    assertInstanceOf(file.cause, JsonUnwritable, "said as unserializable");
    assertInstanceOf(file.cause.cause, errors.Caught, "caught where the writer threw");
    assertInstanceOf(file.cause.cause.cause, TypeError, "with what the writer threw");
});

Deno.test("every recording, replayed and written, reads back whole", () => {
    let files = 0;
    for (const fight of readRecordedFights()) {
        const view = getFightView(replayRecordedFight(fight));
        assert(view !== null, `${fight.path}: the replay produced a fight`);
        const figures = tallyFightFigures(view);
        const subject: FileSubject = {
            statistics: figures.statistics,
            roster: view.roster,
            place: { mapName: "Mapa", x: 1, y: 2 },
            payloads: view.payloadsApplied,
            messagesLost: view.messagesLost,
            isOver: view.isOver,
        };
        const calls = fight.updates.map((payload, index) => ({
            index,
            payload,
            messages: fight.payloads[index] ?? [],
            combatantsBefore: null,
            combatantsAfter: null,
        }));
        const kept = { calls, droppedCalls: null, isTruncated: null };
        const read = readFile(writeFile(kept, subject).text);
        assertEquals(read.calls, JSON.parse(JSON.stringify(calls)), `${fight.path}: the calls`);
        const report = read.report;
        assert(isRecord(report), `${fight.path}: the report`);
        assertEquals(report.payloads, fight.updates.length, `${fight.path}: every call counted`);
        const roster = JSON.parse(JSON.stringify([...view.roster.byId.values()]));
        assertEquals(report.roster, roster, `${fight.path}: and the cast as it was read`);
        files += 1;
    }
    assert(files > 0, "the recordings were there to write");
});

/** Probes: each was a mutation that lit nothing until it was written out here. */
Deno.test("a row writes each figure the aggregate counted, and not a stand-in", () => {
    const subject = composeFoughtSubject();
    const report = encodeFightReport(subject);
    const combatants = report.combatants;
    assert(isRecord(combatants), "the report holds a row per combatant");
    const row = combatants["1"];
    assert(isRecord(row), "and the dealer has one");
    const counted = subject.statistics.byCombatantId.get(1);
    assert(counted !== undefined, "the aggregate counted the dealer");
    for (const [name, value] of Object.entries(counted)) {
        if (typeof value !== "number") continue;
        assertEquals(row[name], value, `${name} is written as it was counted`);
    }
    assertEquals(row.blowsStruck, 2, "two swings, which is what the row states");
});

Deno.test("what qualifies the figures is written as the fight stated it", () => {
    const place = { mapName: "Mapa", x: 12, y: 34 };
    const subject = { ...composeEmptySubject(), place, payloads: 2, messagesLost: 3, isOver: true };
    const report = encodeFightReport(subject);
    assertEquals(report.place, place, "where it was fought");
    assertEquals(report.payloads, 2, "what it was built from");
    assertEquals(report.messagesLost, 3, "what never reached the decoder");
    assertEquals(report.isOver, true, "and whether it ended");
    const open = encodeFightReport({ ...subject, isOver: false, place: null });
    assertEquals(open.isOver, false, "a fight still going says so");
    assertEquals(open.place, null, "and a place nobody read is none");
});

Deno.test("a recording is indented, so a difference between two is a thing a person reads", () => {
    const text = writeFile(LIVE_EMPTY, null).text;
    assertStringIncludes(text, '\n  "formatVersion": 4,', "two spaces, a key to a line");
});
