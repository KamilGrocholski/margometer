/**
 * The gate material passes on its way into the repository.
 *
 * Half of these are about what the tool **refuses**, which is the point of it: a recording it
 * cannot redact confidently must stop, because both ways of being wrong are permanent. The last
 * two hold it against the material already here, from both sides — the redaction is a fixed point
 * on every admitted recording, and the shape it depends on is the shape those files have.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import {
    composeIntake,
    composeIntakePath,
    composePseudonymisedRecording,
    isSlugText,
    REMOVED_DESCRIPTION,
    removeSkillDescriptions,
} from "@/tools/capture-intake.ts";
import { CaptureIntakeError } from "@/tools/margometer-tool-error.ts";
import { getRecordingPaths } from "@/tests/recorded-fight.ts";

/**
 * A recording in the shape the add-on writes. The names in it are invented for this file: nothing
 * here is anybody's, which is the one thing a test about nicknames must be able to say.
 */
function composeRecording(
    warriors: Record<string, unknown>,
    payload: Record<string, unknown> = {},
    messages: string[] = [],
): unknown {
    return {
        wersja: 1,
        przy: "2026-08-11T12:00:00.000Z",
        swiat: "tempest",
        wpisy: [{
            nr: 0,
            ladunek: { w: warriors, ...payload },
            komunikaty: messages,
            wojownicyPrzed: [],
            wojownicyPo: [],
        }],
    };
}

Deno.test("a player becomes a numbered label wherever the name is, and a monster does not", () => {
    const said = composePseudonymisedRecording(composeRecording(
        {
            "5": { id: 5, npc: 0, name: "Wiewiorka" },
            "-9": { id: -9, npc: 1, name: "Locha" },
        },
        {},
        ["winner=Wiewiorka;loser=Locha", "txt=Wiewiorka trafia Locha"],
    ));
    const written = JSON.stringify(said.recording);
    assert(!written.includes("Wiewiorka"), "the player's name is nowhere in the document");
    assert(written.includes("Locha"), "and the monster's is untouched, because it is nobody's");
    assert(written.includes("Gracz 1"), "the label stands where the name did");
    assertEquals(said.changed, 3, "once in `w` and once in each of the two messages it is in");
    assertEquals([...said.substitutions], [["Wiewiorka", "Gracz 1"]], "one name, one label");
});

Deno.test("a combatant nobody can be told the kind of stops the write", () => {
    // `npc` rides only in `ladunek.w`. A combatant known only from a snapshot has no `npc`, so
    // guessing is the only way through — and both guesses are permanent.
    const recording = composeRecording({ "5": { id: 5, npc: 0, name: "Wiewiorka" } });
    const held = recording as { wpisy: { wojownicyPo: unknown[] }[] };
    const call = held.wpisy[0];
    assert(call !== undefined, "the recording carries the call this is about");
    call.wojownicyPo = [{ id: 77, name: "Nieznajomy" }];
    assertThrows(
        () => composePseudonymisedRecording(recording),
        CaptureIntakeError,
        "77",
    );
});

Deno.test("two players under one name stop the write, because text cannot separate them", () => {
    assertThrows(
        () =>
            composePseudonymisedRecording(composeRecording({
                "5": { id: 5, npc: 0, name: "Blizniak" },
                "6": { id: 6, npc: 0, name: "Blizniak" },
            })),
        CaptureIntakeError,
        "Blizniak",
    );
});

Deno.test("a name that is also a label stops the write, because the file looks hand-edited", () => {
    assertThrows(
        () =>
            composePseudonymisedRecording(composeRecording({
                "5": { id: 5, npc: 0, name: "Gracz 2" },
                "6": { id: 6, npc: 0, name: "Wiewiorka" },
            })),
        CaptureIntakeError,
        "hand-edited",
    );
});

Deno.test("a longer name is substituted before the one inside it", () => {
    const said = composePseudonymisedRecording(composeRecording(
        {
            "5": { id: 5, npc: 0, name: "Kot" },
            "6": { id: 6, npc: 0, name: "KotBury" },
        },
        {},
        ["txt=KotBury trafia Kot"],
    ));
    const written = JSON.stringify(said.recording);
    assert(!written.includes("KotBury"), "the longer name went whole");
    assert(!written.includes("Kot "), "and the shorter one did too, rather than being eaten");
    assert(written.includes("Gracz 2 trafia Gracz 1"), "each name reached its own label");
});

Deno.test("the game's prose comes out and its functional names stay", () => {
    const abilities = [
        "239",
        "Podwójne trafienie",
        "5",
        "9",
        "4",
        "A sentence the game's authors wrote.",
        "reqp=t;lvl=25",
        "1/10",
        "energy=25",
        "",
    ];
    const recording = composeRecording({}, { skills: abilities });
    const said = removeSkillDescriptions(recording);
    assertEquals(said.removed, 1, "one description, which is the one prose field in the group");
    assertEquals(abilities[5], REMOVED_DESCRIPTION, "replaced by a marker that says what happened");
    assertEquals(abilities[1], "Podwójne trafienie", "the ability's name is functional and stays");
    assertEquals(abilities[6], "reqp=t;lvl=25", "and so are its requirements");
    assertEquals(removeSkillDescriptions(recording).removed, 0, "a second run has nothing to do");
});

Deno.test("an ability list of an unfamiliar shape stops the write", () => {
    // Groups of ten is a claim about the game. Cutting field 5 out of some other layout would
    // remove the wrong thing, on evidence.
    assertThrows(
        () => removeSkillDescriptions(composeRecording({}, { skills: ["one", "two", "three"] })),
        CaptureIntakeError,
        "groups of 10",
    );
});

Deno.test("the counts are written into the file, and a second run adds to them", () => {
    const first = composeIntake(composeRecording(
        { "5": { id: 5, npc: 0, name: "Wiewiorka" } },
        {},
        ["txt=Wiewiorka"],
    ));
    assertEquals(first.changed, 2, "the name in `w` and the name in the message");
    const firstReading = getJsonReading(first.text);
    assert(firstReading.isOk, "the intake is written as JSON");
    const written = firstReading.value;
    assert(isRecord(written), "the intake is written as a record");
    assertEquals(written.pseudonimow, 2, "and states what it substituted");
    assertEquals(written.opisow, 0, "and that there was no prose to take out");

    const again = composeIntake(written);
    assertEquals(again.changed, 0, "a redacted recording has no nickname left to substitute");
    const againReading = getJsonReading(again.text);
    assert(againReading.isOk, "the second intake is JSON too");
    const twice = againReading.value;
    assert(isRecord(twice), "the second intake is a record too");
    assertEquals(twice.pseudonimow, 2, "and the carried count is kept rather than written over");
});

Deno.test("a count nobody can read stops the write rather than being read as none", () => {
    const recording = composeRecording({ "5": { id: 5, npc: 0, name: "Wiewiorka" } });
    const held = recording as Record<string, unknown>;
    held.pseudonimow = "kilka";
    assertThrows(() => composeIntake(recording), CaptureIntakeError, "pseudonimow");
});

Deno.test("a path is the day, the world and what a person called it", () => {
    const recording = composeRecording({});
    assertEquals(
        composeIntakePath(recording, "grupa-vs-hildur"),
        "captures/2026-08-11-tempest-grupa-vs-hildur.json",
        "the day it was recorded, then where, then the name",
    );
    assertThrows(() => composeIntakePath(recording, "Grupa"), CaptureIntakeError, "kebab-case");
    assertThrows(() => composeIntakePath({ swiat: "tempest" }, "one"), CaptureIntakeError, "przy");
    assertThrows(
        () => composeIntakePath({ przy: "2026-08-11T12:00:00.000Z" }, "one"),
        CaptureIntakeError,
        "swiat",
    );
});

Deno.test("a slug is lower-case, and a dash never doubles or ends it", () => {
    assertEquals(isSlugText("grupa-vs-hildur"), true, "what every recording here is named with");
    assertEquals(isSlugText("hildur"), true, "one word is a slug");
    assertEquals(isSlugText(""), false, "nothing is not");
    assertEquals(isSlugText("Hildur"), false, "and neither is a capital");
    assertEquals(isSlugText("grupa--vs"), false, "nor a doubled dash");
    assertEquals(isSlugText("-hildur"), false, "nor one at the front");
    assertEquals(isSlugText("hildur-"), false, "nor one at the back");
    assertEquals(isSlugText("grupa vs"), false, "nor a space");
});

Deno.test("every recording already admitted is a fixed point of this tool", () => {
    // Both directions at once. That the redaction changes nothing says the material is redacted;
    // that the tool runs at all over 28 real files says the shapes it depends on are the shapes
    // those files have. A recording it refused would show up here as a throw.
    const paths = getRecordingPaths();
    assert(paths.length > 0, "there is material to hold this against");
    const moved: string[] = [];
    for (const path of paths) {
        const reading = getJsonReading(Deno.readTextFileSync(path));
        assert(reading.isOk, `${path} is JSON`);
        const intake = composeIntake(reading.value);
        if (intake.changed === 0 && intake.removed === 0) continue;
        moved.push(`${path}: ${intake.changed} names, ${intake.removed} descriptions`);
    }
    assertEquals(moved, [], "a recording in this repository that still has something to redact");
});
