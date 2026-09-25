/**
 * The material a tool reports on: the recordings by default, a file on disk where one is named,
 * and each read the add-on's way or refused by name.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { RecordingReadError } from "#/tools/margometer-tool-error.ts";
import {
    formatRecordingName,
    readRecordedMaterial,
    replayMaterialSteps,
    replayRecordedMaterial,
    replayRecordedSteps,
} from "#/tools/recorded-material.ts";
import {
    lookupRecordedFight,
    readRecordedFight,
    readRecordedFights,
} from "#/tests/recorded-fights.ts";

/** A short fight of several calls, so every step can be read and the first differs from the last. */
const STEPPED = "captures/2026-09-19-luvia-tropiciel-vs-mag-Bb28FQty-0.17.0.json";

Deno.test("no path is every recording, each replayed with the messages it carried", () => {
    const material = readRecordedMaterial([]);
    assertStrictEquals(material.material, "captures/");
    assertStrictEquals(material.fights, readRecordedFights(), "the recordings, as read once");
    for (const { fight, reading } of replayRecordedMaterial(material)) {
        assertEquals(
            reading.messagesByPayload.flat(),
            fight.messages,
            `${fight.path}: the envelope takes out the messages the file states`,
        );
    }
});

Deno.test("a file that cannot be read as a recording is refused, whatever is wrong with it", () => {
    const missing = Deno.makeTempFileSync({ suffix: ".json" });
    Deno.removeSync(missing);
    expectRefused(missing, "is not a file this tool can open");
    for (
        const [text, reason] of [
            ["{", "is not JSON"],
            ["[]", "is not a record"],
            ['{"calls": {}}', "lists no calls"],
        ]
    ) {
        const path = Deno.makeTempFileSync({ suffix: ".json" });
        Deno.writeTextFileSync(path, text!);
        expectRefused(path, reason!);
        Deno.removeSync(path);
    }
});

function expectRefused(path: string, reason: string): void {
    const error = assertThrows(() => readRecordedMaterial([path]), RecordingReadError);
    assertStrictEquals(error.message, `${path} ${reason}`);
}

Deno.test("a file with a call the add-on refuses is refused, naming why", () => {
    const path = Deno.makeTempFileSync({ suffix: ".json" });
    Deno.writeTextFileSync(path, '{"calls": [{"messages": [], "payload": {"m": 5}}]}');
    const material = readRecordedMaterial([path]);
    Deno.removeSync(path);
    assertStrictEquals(material.fights.length, 1, "the file itself reads");
    assertThrows(
        () => replayRecordedMaterial(material),
        RecordingReadError,
        "the add-on refused a call",
    );
});

Deno.test("a fight stepped call by call ends where the whole replay stands", () => {
    const material = readRecordedMaterial([]);
    const whole = replayRecordedMaterial(material);
    for (const [at, { fight, steps }] of replayMaterialSteps(material).entries()) {
        assert(steps.length > 0, `${fight.path}: a recording read is stepped at least once`);
        assert(steps.length <= fight.updates.length, `${fight.path}: at most once per call`);
        assertEquals(
            steps.at(-1)?.reading.view,
            whole[at]?.reading.view,
            `${fight.path}: the last step is the fight the whole replay reads`,
        );
        assertStrictEquals(steps.at(-1)?.update, fight.updates.at(-1), "after the last call");
        const counts = steps.map((step) => step.reading.view.payloadsApplied);
        assertEquals(counts, [...counts].sort((one, other) => one - other), "one call at a time");
    }
});

Deno.test("a file whose calls open no fight is refused when stepped as when replayed", () => {
    const path = Deno.makeTempFileSync({ suffix: ".json" });
    Deno.writeTextFileSync(path, '{"calls": []}');
    const material = readRecordedMaterial([path]);
    Deno.removeSync(path);
    assertThrows(() => replayMaterialSteps(material), RecordingReadError, "carries no payload");
});

Deno.test("a cast of nobody is a snapshot, and a call stating none is not", () => {
    const call = { messages: [], payload: {} };
    const stated = (extra: object) =>
        readRecordedFight("one.json", { calls: [{ ...call, ...extra }] });
    assert(stated({ combatantsBefore: [] }).hasSnapshot, "a reading that found nobody counts");
    assert(stated({ combatantsAfter: [] }).hasSnapshot, "after a call as well as before it");
    assertStrictEquals(stated({}).hasSnapshot, false, "and a call stating neither is none");
    assertStrictEquals(stated({ combatantsBefore: null }).hasSnapshot, false, "null is none");
});

Deno.test("a heading is the file's name without its directory or suffix", () => {
    assertStrictEquals(formatRecordingName("captures/one-fight.json"), "one-fight");
    assertStrictEquals(formatRecordingName("one-fight.json"), "one-fight");
    assertStrictEquals(formatRecordingName("captures/notes.txt"), "notes.txt");
});

/**
 * A step is the chain's answer over the calls up to it, so the last one is the whole recording and
 * the first holds its first call alone. Zero calls into a fight is no step at all (W5).
 */
Deno.test("a recording stepped call by call ends where the whole of it is replayed", () => {
    const fight = lookupRecordedFight(STEPPED);
    const steps = replayRecordedSteps(fight);
    assertStrictEquals(steps.length, fight.updates.length, "a step for every call");
    assert(steps.length > 1, "and more than one of them, or the first is the last");
    for (const [index, step] of steps.entries()) {
        assertStrictEquals(step.update, fight.updates[index], `step ${index} is its own call`);
        assertStrictEquals(
            step.reading.messagesByPayload.length,
            index + 1,
            "and every one before",
        );
    }
    const material = { material: STEPPED, fights: [fight] };
    const whole = replayRecordedMaterial(material)[0]!.reading;
    assertEquals(steps.at(-1)!.reading.figures, whole.figures, "the last step is the whole fight");
    assertEquals(steps[0]!.record.messages, fight.payloads[0], "the first holds its call alone");
});
