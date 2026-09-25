/**
 * Intake on recordings written here, with nobody's real name in them. That it redacts as
 * `develop`'s intake does was measured over every raw file on the maintainer's machine; these
 * hold each step on its own and each refusal by what it names.
 */

import {
    assert,
    assertEquals,
    assertStrictEquals,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import {
    composeIntake,
    composeIntakeName,
    composePseudonymisedRecording,
    composeRecordingInEnglish,
    isSlugText,
    REMOVED_DESCRIPTION,
    removeSkillDescriptions,
    requireCallsCarried,
    requireRecordingIsNew,
    requireSnapshotsCarried,
} from "#/tools/capture-intake.ts";
import { CaptureIntakeError } from "#/tools/margometer-tool-error.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";

const SHORT = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";

Deno.test("an older recording is spelled in English, and an English one passes unchanged", () => {
    const older = { wersja: 1, swiat: "tempest", wpisy: [{ nr: 0, ladunek: {}, komunikaty: [] }] };
    assertEquals(composeRecordingInEnglish(older), {
        formatVersion: 1,
        world: "tempest",
        calls: [{ index: 0, payload: {}, messages: [] }],
    });
    const english = composeFight();
    assertEquals(composeRecordingInEnglish(english), english, "every name is its own translation");
});

/** A player, two monsters, and a player whose name holds the first one's. */
function composeFight(): Record<string, unknown> {
    return {
        capturedAt: "2026-09-25T10:00:00.000Z",
        world: "tempest",
        gameBuild: "1785244275300",
        addOnVersion: "0.20.0",
        report: { dealt: 1 },
        calls: [{
            index: 0,
            messages: ["0;0;txt=Anna hits Wilk", "0;0;txt=Annabelle heals Anna"],
            payload: {
                w: {
                    "7": { id: 7, name: "Anna", npc: 0 },
                    "-3": { id: -3, name: "Wilk", npc: 1 },
                    "9": { id: 9, name: "Annabelle", npc: 0 },
                    "-4": { id: -4, name: "Smok", npc: 2 },
                },
                skills: ["1", "Cios", "0", "0", "0", "Prose.", "", "", "", ""],
            },
            combatantsAfter: [{ id: 7, name: "Anna" }],
        }],
    };
}

Deno.test("players are numbered by id, longest name first, and a monster keeps its name", () => {
    const named = composePseudonymisedRecording(composeFight());
    assertEquals([...named.substitutions], [["Anna", "Gracz 1"], ["Annabelle", "Gracz 2"]]);
    const text = JSON.stringify(named.recording);
    assertStringIncludes(text, "txt=Gracz 1 hits Wilk", "a monster is the game's, not a person");
    assertStringIncludes(
        text,
        '"name":"Smok"',
        "and only a zero says person, whatever else is said",
    );
    assertStringIncludes(text, "txt=Gracz 2 heals Gracz 1", "and a name inside a name is whole");
    assert(!text.includes("Anna"), "no player's name is left anywhere");
    assertStrictEquals(named.changed, 6, "two messages, two roster entries, one snapshot");
});

Deno.test("a combatant nobody says is a player or a monster is refused, never guessed", () => {
    const fight = composeFight();
    const calls = fight.calls as { combatantsAfter: unknown[] }[];
    calls[0]!.combatantsAfter.push({ id: 11, name: "Nieznany" });
    assertThrows(() => composePseudonymisedRecording(fight), CaptureIntakeError, "combatant 11");
});

Deno.test("two players sharing a name are refused, since a message carries only the text", () => {
    const fight = composeFight();
    const payload = (fight.calls as { payload: { w: Record<string, unknown> } }[])[0]!.payload;
    payload.w["12"] = { id: 12, name: "Anna", npc: 0 };
    assertThrows(() => composePseudonymisedRecording(fight), CaptureIntakeError, "share the name");
});

Deno.test("an ability's prose goes, a marker already there stays, and a strange layout stops", () => {
    const fight = composeFight();
    const skills = (fight.calls as { payload: { skills: string[] } }[])[0]!.payload.skills;
    assertStrictEquals(removeSkillDescriptions(fight).removed, 1);
    assertStrictEquals(skills[5], REMOVED_DESCRIPTION);
    assertStrictEquals(skills[1], "Cios", "the ability's name is functional and stays");
    assertStrictEquals(removeSkillDescriptions(fight).removed, 0, "a second pass removes nothing");
    skills[5] = "(opis z gry — zdjęty, NOTICE.md)";
    assertStrictEquals(removeSkillDescriptions(fight).removed, 0, "nor does an older marker");
    skills.push("extra");
    assertThrows(
        () => removeSkillDescriptions(fight),
        CaptureIntakeError,
        "not whole groups of 10",
    );
});

Deno.test("the whole intake drops the report and adds its counts to what the file carried", () => {
    const first = composeIntake(composeFight());
    assert(first.wasReportRemoved, "the counted figures go");
    assertEquals(first.recording, JSON.parse(first.text), "the text is the recording");
    const written = first.recording as Record<string, unknown>;
    assertStrictEquals("report" in written, false);
    assertStrictEquals(written.namesSubstituted, 6);
    assertStrictEquals(written.descriptionsRemoved, 1);
    const carried = { ...composeFight(), namesSubstituted: 4, descriptionsRemoved: 2 };
    const again = composeIntake(carried).recording as Record<string, unknown>;
    assertStrictEquals(again.namesSubstituted, 10, "a count is added to, never overwritten");
    const unreadable = { ...composeFight(), namesSubstituted: "4" };
    assertThrows(() => composeIntake(unreadable), CaptureIntakeError, "not a count");
});

Deno.test("a file with no call, or with no snapshot on any call, is not material", () => {
    assertThrows(() => requireCallsCarried({ calls: [] }), CaptureIntakeError, "no call");
    requireCallsCarried(composeFight());
    const shelved = { calls: [{ messages: [], payload: {} }] };
    assertThrows(() => requireSnapshotsCarried("x.json", shelved), CaptureIntakeError);
    requireSnapshotsCarried("x.json", {
        calls: [{ messages: [], payload: {}, combatantsBefore: [] }],
    });
});

Deno.test("a fight already in the corpus is refused by its payloads, whatever its envelope", () => {
    const fight = lookupRecordedFight(SHORT);
    const offered = {
        world: "elsewhere",
        calls: fight.updates.map((payload) => ({ messages: [], payload, combatantsAfter: [] })),
    };
    assertThrows(
        () => requireRecordingIsNew("x.json", offered, [fight]),
        CaptureIntakeError,
        `already material as \`${SHORT}\``,
    );
    const changed = { calls: offered.calls.slice(1) };
    requireRecordingIsNew("x.json", changed, [fight]);
});

Deno.test("a file is named for its day, world, fight, build and version, or `none`", () => {
    const fight = composeFight();
    assertStrictEquals(
        composeIntakeName(fight, "grupa-vs-wilk"),
        "2026-09-25-tempest-grupa-vs-wilk-1785244275300-0.20.0.json",
    );
    const unstated = { ...fight, gameBuild: "", addOnVersion: undefined };
    assertStrictEquals(composeIntakeName(unstated, "a"), "2026-09-25-tempest-a-none-none.json");
    assertThrows(() => composeIntakeName(fight, "Grupa"), CaptureIntakeError, "kebab-case");
    assertThrows(() => composeIntakeName({ ...fight, gameBuild: "../x" }, "a"), CaptureIntakeError);
    assertThrows(() => composeIntakeName({ ...fight, world: "a/b" }, "a"), CaptureIntakeError);
    assertThrows(
        () => composeIntakeName({ ...fight, capturedAt: "2026-9-25" }, "a"),
        CaptureIntakeError,
    );
});

Deno.test("a slug is lower-case words joined by single dashes", () => {
    assert(isSlugText("a"));
    assert(isSlugText("grupa-vs-hildur-1"));
    assertStrictEquals(isSlugText(""), false);
    assertStrictEquals(isSlugText("-a"), false);
    assertStrictEquals(isSlugText("a-"), false);
    assertStrictEquals(isSlugText("a--b"), false);
    assertStrictEquals(isSlugText("a_b"), false);
});
