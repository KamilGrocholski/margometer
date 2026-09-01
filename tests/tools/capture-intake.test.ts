/**
 * The gate material passes on its way into the repository.
 *
 * Half of these are about what the tool **refuses**, which is the point of it: a recording it
 * cannot redact confidently must stop, because both ways of being wrong are permanent. The last
 * two hold it against the material already here, from both sides — the redaction is a fixed point
 * on every admitted recording, and the shape it depends on is the shape those files have.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import {
    composeIntake,
    composeIntakePath,
    composePseudonymisedRecording,
    composeRecordingInEnglish,
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
        formatVersion: 3,
        capturedAt: "2026-08-11T12:00:00.000Z",
        world: "tempest",
        gameBuild: "1786514810315",
        addOnVersion: "0.10.1",
        calls: [{
            index: 0,
            payload: { w: warriors, ...payload },
            messages,
            combatantsBefore: [],
            combatantsAfter: [],
        }],
    };
}

/** The same recording as an add-on before **ADR 0030** wrote it: the envelope in Polish. */
function composeRecordingBeforeEnglish(warriors: Record<string, unknown>): unknown {
    return {
        wersja: 2,
        przy: "2026-08-11T12:00:00.000Z",
        swiat: "tempest",
        build: "1786514810315",
        dodatek: "0.10.1",
        wpisy: [{
            nr: 0,
            ladunek: { w: warriors },
            komunikaty: ["txt=Wiewiorka"],
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
    assertStringIncludes(
        written,
        "Locha",
        "and the monster's is untouched, because it is nobody's",
    );
    assertStringIncludes(written, "Gracz 1", "the label stands where the name did");
    assertEquals(said.changed, 3, "once in `w` and once in each of the two messages it is in");
    assertEquals([...said.substitutions], [["Wiewiorka", "Gracz 1"]], "one name, one label");
});

Deno.test("a combatant nobody can be told the kind of stops the write", () => {
    // `npc` rides only in `ladunek.w`. A combatant known only from a snapshot has no `npc`, so
    // guessing is the only way through — and both guesses are permanent.
    const recording = composeRecording({ "5": { id: 5, npc: 0, name: "Wiewiorka" } });
    const held = recording as { calls: { combatantsAfter: unknown[] }[] };
    const call = held.calls[0];
    assertExists(call, "the recording carries the call this is about");
    call.combatantsAfter = [{ id: 77, name: "Nieznajomy" }];
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
    assertStringIncludes(written, "Gracz 2 trafia Gracz 1", "each name reached its own label");
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
    assertEquals(written.namesSubstituted, 2, "and states what it substituted");
    assertEquals(written.descriptionsRemoved, 0, "and that there was no prose to take out");

    const again = composeIntake(written);
    assertEquals(again.changed, 0, "a redacted recording has no nickname left to substitute");
    const againReading = getJsonReading(again.text);
    assert(againReading.isOk, "the second intake is JSON too");
    const twice = againReading.value;
    assert(isRecord(twice), "the second intake is a record too");
    assertEquals(
        twice.namesSubstituted,
        2,
        "and the carried count is kept rather than written over",
    );
});

Deno.test("the figures the add-on counted stay out of the material, and the rest stays in", () => {
    const carrying = composeRecording({ "5": { id: 5, npc: 0, name: "Wiewiorka" } });
    const held = carrying as Record<string, unknown>;
    held.report = { payloads: 1, roster: [{ id: 5, name: "Wiewiorka" }] };
    const admitted = composeIntake(carrying);
    assertEquals(
        admitted.wasReportRemoved,
        true,
        "a recording carrying figures is admitted without",
    );
    const reading = getJsonReading(admitted.text);
    assert(reading.isOk, "what was written reads back as JSON");
    const written = reading.value;
    assert(isRecord(written), "and as a recording");
    assert(!("report" in written), "`captures/` holds raw material and no computed number");
    assert(!admitted.text.includes("Wiewiorka"), "and the names inside the block go with it");
    assert(Array.isArray(written.calls), "while the calls it was counted off stay");

    // The other sample, which is what says the step finds its subject rather than everything:
    // a recording carrying no figures is admitted whole, and says nothing was taken out.
    const plain = composeIntake(composeRecording({ "5": { id: 5, npc: 0, name: "Wiewiorka" } }));
    assertEquals(plain.wasReportRemoved, false, "a recording carrying none says so");
    const plainReading = getJsonReading(plain.text);
    assert(plainReading.isOk, "and it too reads back as JSON");
    const kept = plainReading.value;
    assert(isRecord(kept), "and as a recording");
    const atIntake = ["namesSubstituted", "descriptionsRemoved"];
    assertEquals(Object.keys(kept).filter((key) => !atIntake.includes(key)), [
        "formatVersion",
        "capturedAt",
        "world",
        "gameBuild",
        "addOnVersion",
        "calls",
    ], "with every key it arrived with");
});

Deno.test("a count nobody can read stops the write rather than being read as none", () => {
    const recording = composeRecording({ "5": { id: 5, npc: 0, name: "Wiewiorka" } });
    const held = recording as Record<string, unknown>;
    held.namesSubstituted = "kilka";
    assertThrows(() => composeIntake(recording), CaptureIntakeError, "namesSubstituted");
});

Deno.test("a path is the day, the world, what a person called it, and both versions", () => {
    const recording = composeRecording({});
    assertEquals(
        composeIntakePath(recording, "grupa-vs-hildur"),
        "captures/2026-08-11-tempest-grupa-vs-hildur-1786514810315-0.10.1.json",
        "the day it was recorded, where, the name, the game's build and ours",
    );
    const blind = { ...(recording as Record<string, unknown>), gameBuild: null };
    assertEquals(
        composeIntakePath(blind, "grupa-vs-hildur"),
        "captures/2026-08-11-tempest-grupa-vs-hildur-none-0.10.1.json",
        "a build nobody stated is said to be none, the word the register uses",
    );
    assertThrows(() => composeIntakePath(recording, "Grupa"), CaptureIntakeError, "kebab-case");
    assertThrows(
        () => composeIntakePath({ world: "tempest" }, "one"),
        CaptureIntakeError,
        "capturedAt",
    );
    assertThrows(
        () => composeIntakePath({ capturedAt: "2026-08-11T12:00:00.000Z" }, "one"),
        CaptureIntakeError,
        "world",
    );
    assertThrows(
        () =>
            composeIntakePath({ ...(recording as Record<string, unknown>), gameBuild: "a/b" }, "x"),
        CaptureIntakeError,
        "filename",
    );
});

/**
 * The one reader that still takes the older spelling, because a reader running an older add-on
 * downloads one today. What comes out is English, whichever went in. **ADR 0030.**
 */
Deno.test("a recording written before the envelope was English is admitted as English", () => {
    const older = composeRecordingBeforeEnglish({ "5": { id: 5, npc: 0, name: "Wiewiorka" } });
    const admitted = composeIntake(older);
    const reading = getJsonReading(admitted.text);
    assert(reading.isOk, "what was written reads back as JSON");
    const written = reading.value;
    assert(isRecord(written), "and as a recording");
    assertEquals(Object.keys(written), [
        "formatVersion",
        "capturedAt",
        "world",
        "gameBuild",
        "addOnVersion",
        "calls",
        "namesSubstituted",
        "descriptionsRemoved",
    ], "every envelope field under the name this repository spells it by");
    assertEquals(written.gameBuild, "1786514810315", "and what each of them held is what it held");
    assertEquals(admitted.changed, 2, "with the nicknames substituted as in any other recording");
    assertEquals(
        composeIntakePath(composeRecordingInEnglish(older), "grupa-vs-hildur"),
        "captures/2026-08-11-tempest-grupa-vs-hildur-1786514810315-0.10.1.json",
        "and it is filed under the two versions it stated in Polish",
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
