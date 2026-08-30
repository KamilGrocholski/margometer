/**
 * The recording, composed from a real one and read back.
 *
 * The shape is a contract: what this composes has to be the shape every file in `captures/`
 * already is, or new material cannot be set beside admitted material. So the test that matters
 * here reads a recording off disk and checks the envelope against it, key by key.
 */

import { assert, assertEquals } from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { BUILD_VERSION } from "@/src/build-version.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import type { ReportSubject } from "@/src/game/fight-report.ts";
import {
    type CaptureSurroundings,
    composeCaptureFileName,
    composeCaptureText,
    composeEmptyCapture,
    composeNextCapture,
} from "@/src/game/fight-capture.ts";

/**
 * The newest recording, and the newest envelope. **`formatVersion` does not identify the shape**:
 * measured over `captures/` on 2026-08-30, all 28 recordings state `1` and four different
 * envelopes exist among them — the oldest carries `otwarcie`, `zrodlo` and `odchudzonych`, which
 * nothing writes any more and the migration to English left alone, and only the five newest carry
 * `addOnVersion` and `userAgent`. So the contract this holds itself to is the newest, and it is
 * named rather than found.
 */
const NEWEST = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";

const SURROUNDINGS: CaptureSurroundings = {
    world: "tempest",
    gameBuild: "53XkBRxF",
    capturedAt: "2026-08-29T10:11:12.345Z",
    userAgent: "a browser that said so",
};

/** A fight read from one payload with nobody in it: the smallest subject there is. */
function composeEmptySubject(): ReportSubject {
    const roster = composeCombatantRoster([]);
    return {
        statistics: composeFightStatistics([], composeTeamHeals([], roster)),
        roster,
        place: null,
        payloads: 1,
        messagesLost: 0,
        isOver: false,
    };
}

function readCapture(text: string): Record<string, unknown> {
    const reading = getJsonReading(text);
    assert(reading.isOk, "a recording written as text reads back as JSON");
    const read = reading.value;
    assert(isRecord(read), "and reads back as a record");
    return read;
}

Deno.test("the envelope is the one every admitted recording already carries", () => {
    const admitted = readCapture(Deno.readTextFileSync(NEWEST));
    const written = readCapture(
        composeCaptureText(composeEmptyCapture(), SURROUNDINGS, null) ?? "",
    );
    // Two keys an admitted recording gains at intake and this never writes: the counts of what
    // was substituted. Everything else is written here, in the same spelling.
    const atIntake = ["namesSubstituted", "descriptionsRemoved"];
    const owed = Object.keys(admitted).filter((key) => !atIntake.includes(key));
    const composed = Object.keys(written);
    // The one key that goes the other way: intake takes the counted figures back off a recording
    // before admitting it, so an admitted one carries none (ADR 0027).
    assertEquals(composed.filter((key) => key !== "report"), owed, "the same keys, in that order");
    assertEquals(
        composed[composed.indexOf("report") + 1],
        "droppedCalls",
        "and the figures stand above the calls, where a reader opening the file meets them",
    );
    assertEquals(written.formatVersion, 3, "the envelope that may carry them says which one it is");
    assertEquals(
        written.addOnVersion,
        BUILD_VERSION,
        "with the build that wrote it, not the format's",
    );
    assertEquals(written.world, "tempest", "the world it was taken on");
    assertEquals(written.gameBuild, "53XkBRxF", "the client's own build");
    assertEquals(written.isTruncated, false, "and a tail nothing was cut off");
});

Deno.test("a recording that could not read its surroundings says so rather than inventing", () => {
    const blind = { ...SURROUNDINGS, gameBuild: null, userAgent: null };
    const written = readCapture(composeCaptureText(composeEmptyCapture(), blind, null) ?? "");
    assertEquals(written.gameBuild, null, "a build nobody stated is absent, never a stand-in");
    assertEquals(written.userAgent, null, "and so is a browser that said nothing of itself");
});

Deno.test("the figures travel with the calls, and nothing is written where none were read", () => {
    const blank = readCapture(composeCaptureText(composeEmptyCapture(), SURROUNDINGS, null) ?? "");
    assertEquals(blank.report, null, "a fight nobody read is said to be none, never an empty one");

    const subject = composeEmptySubject();
    const text = composeCaptureText(composeEmptyCapture(), SURROUNDINGS, subject) ?? "";
    const written = readCapture(text);
    const report = written.report;
    assert(isRecord(report), "a fight that was read is written into the recording beside it");
    assertEquals(report.payloads, 1, "with what it was built from");
    assertEquals(report.combatants, {}, "and a cast of nobody, which is a reading and not a gap");
    assert(!("addOnVersion" in report), "what qualifies the numbers stands once, in the envelope");
    assert(!text.includes('MargoMeter"'), "so the add-on's name is not in the file twice");
});

Deno.test("every call carrying messages is kept, and a call saying nothing new is dropped", () => {
    const nobody = { combatantsBefore: [], combatantsAfter: [] };
    const opening = composeNextCapture(composeEmptyCapture(), {
        payload: { init: "1" },
        messages: [],
        ...nobody,
    });
    assertEquals(opening.calls.length, 1, "the call that opens a fight is a shape nobody has seen");
    assertEquals(opening.droppedCalls, 0, "so nothing is dropped for it");

    const again = composeNextCapture(opening, { payload: { init: "1" }, messages: [], ...nobody });
    assertEquals(
        again.calls.length,
        1,
        "a second `init` starts the recording over, not adds to it",
    );

    const said = composeNextCapture(again, { payload: { m: ["x"] }, messages: ["x"], ...nobody });
    assertEquals(said.calls.length, 2, "a call carrying a message is kept whatever else it says");
    const repeated = composeNextCapture(said, { payload: { m: ["x"] }, messages: [], ...nobody });
    assertEquals(repeated.calls.length, 2, "and one repeating a shape with nothing to say is not");
    assertEquals(repeated.droppedCalls, 1, "it is counted instead, where the file will state it");
});

Deno.test("a state nobody has seen is kept even where the payload says nothing", () => {
    const opened = composeNextCapture(composeEmptyCapture(), {
        payload: { poll: 1 },
        messages: [],
        combatantsBefore: [],
        combatantsAfter: [],
    });
    const moved = composeNextCapture(opened, {
        payload: { poll: 1 },
        messages: [],
        combatantsBefore: [],
        combatantsAfter: [{
            id: 1,
            name: "somebody",
            team: 1,
            prof: "w",
            lvl: 60,
            hp: { max: 100, value: 90 },
            mana: null,
            energy: null,
            ac: null,
        }],
    });
    assertEquals(moved.calls.length, 2, "health that moved is kept though the payload repeats");
    assertEquals(moved.droppedCalls, 0, "and nothing is dropped for it");
});

Deno.test("what the game goes on changing is copied, not held by reference", () => {
    const payload: Record<string, unknown> = { init: "1", w: { 1: { name: "before" } } };
    const capture = composeNextCapture(composeEmptyCapture(), {
        payload,
        messages: [],
        combatantsBefore: [],
        combatantsAfter: [],
    });
    payload.w = { 1: { name: "after" } };
    const kept = capture.calls[0]?.payload;
    assert(isRecord(kept), "the call kept a payload");
    assertEquals(
        kept.w,
        { 1: { name: "before" } },
        "the recording holds the call as it arrived, not as the game left it",
    );
});

Deno.test("a file is named for the world, both versions and the moment", () => {
    const name = composeCaptureFileName(SURROUNDINGS);
    assertEquals(
        name,
        `margometer-tempest-53XkBRxF-${BUILD_VERSION}-2026-08-29T10-11-12-345Z.json`,
        "the world, the game's build, ours, then the moment",
    );
    const blind = composeCaptureFileName({ ...SURROUNDINGS, gameBuild: null });
    assert(blind.includes("-none-"), "a build the page never stated is said to be none");
    assert(!name.slice(0, -".json".length).includes(":"), "no colon reaches a file's name");
});
