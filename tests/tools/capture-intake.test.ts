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
    CALLS_MAXIMUM,
    composeIntake,
    composeIntakeName,
    composePseudonymisedRecording,
    composeRecordingInEnglish,
    isSlugText,
    NAMES_MAXIMUM,
    REMOVED_DESCRIPTION,
    removeSkillDescriptions,
    requireCallsCarried,
    requireRecordingIsNew,
    requireSnapshotsCarried,
    TEXT_CHARACTERS_MAXIMUM,
    VALUES_MAXIMUM,
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

Deno.test("a combatant stated a player in one payload and a monster in another is refused", () => {
    const fight = composeFight();
    const calls = fight.calls as Record<string, unknown>[];
    const again = { index: 1, messages: [], payload: { w: { "7": { id: 7, npc: 0 } } } };
    calls.push(again);
    const named = composePseudonymisedRecording(fight);
    assertStrictEquals(
        named.substitutions.get("Anna"),
        "Gracz 1",
        "the same word twice is one word",
    );
    again.payload.w["7"].npc = 1;
    assertThrows(
        () => composePseudonymisedRecording(fight),
        CaptureIntakeError,
        "combatant 7 is stated both a player and a monster",
    );
});

Deno.test("a name is replaced where it stands whole, and found inside a word it is refused", () => {
    const fight = composeFight();
    const call = (fight.calls as { messages: string[] }[])[0]!;
    call.messages.push("0;0;winner=Anna", "0;0;+oth_dmg=12,Anna(8.97%)");
    const named = JSON.stringify(composePseudonymisedRecording(fight).recording);
    assertStringIncludes(named, "winner=Gracz 1", "a name after a key's sign is whole");
    assertStringIncludes(named, ",Gracz 1(8.97%)", "and so is one between a comma and a bracket");
    call.messages.push("1;0;tspell=Annałowy cios");
    assertThrows(
        () => composePseudonymisedRecording(fight),
        CaptureIntakeError,
        "stands inside a longer word",
    );
});

Deno.test("a monster named with a player's name in it is refused, never half replaced", () => {
    const fight = composeFight();
    const payload = (fight.calls as { payload: { w: Record<string, unknown> } }[])[0]!.payload;
    payload.w["-5"] = { id: -5, name: "Annałowy wódz", npc: 1 };
    assertThrows(
        () => composePseudonymisedRecording(fight),
        CaptureIntakeError,
        "is named with the player name",
    );
});

Deno.test("two players sharing a name are refused, since a message carries only the text", () => {
    const fight = composeFight();
    const payload = (fight.calls as { payload: { w: Record<string, unknown> } }[])[0]!.payload;
    payload.w["12"] = { id: 12, name: "Anna", npc: 0 };
    assertThrows(() => composePseudonymisedRecording(fight), CaptureIntakeError, "share the name");
});

Deno.test("a skill's prose goes, a marker already there stays, and a strange layout stops", () => {
    const fight = composeFight();
    const skills = (fight.calls as { payload: { skills: string[] } }[])[0]!.payload.skills;
    assertStrictEquals(removeSkillDescriptions(fight).removed, 1);
    assertStrictEquals(skills[5], REMOVED_DESCRIPTION);
    assertStrictEquals(skills[1], "Cios", "the skill's name is functional and stays");
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
    const intake = composeIntake(composeFight());
    assert(intake.wasReportRemoved, "the counted figures go");
    assertEquals(intake.recording, JSON.parse(intake.text), "the text is the recording");
    const written = intake.recording as Record<string, unknown>;
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
    assertThrows(
        () => composeIntakeName({ ...fight, gameBuild: "1/2" }, "a"),
        CaptureIntakeError,
        "not something a name carries",
    );
    assertThrows(() => composeIntakeName({ ...fight, world: "a/b" }, "a"), CaptureIntakeError);
    assertThrows(
        () => composeIntakeName({ ...fight, capturedAt: "2026-9-25" }, "a"),
        CaptureIntakeError,
    );
});

/** The day and the world are composed in front of the slug, so a slug carrying them is refused. */
Deno.test("a slug opening with the day or the world is refused, naming the slug to pass", () => {
    const fight = composeFight();
    assertThrows(
        () => composeIntakeName(fight, "tempest-grupa-vs-wilk"),
        CaptureIntakeError,
        "pass `--name grupa-vs-wilk`",
    );
    assertThrows(
        () => composeIntakeName(fight, "2026-09-25-grupa-vs-wilk"),
        CaptureIntakeError,
        "pass `--name grupa-vs-wilk`",
    );
    assertThrows(() => composeIntakeName(fight, "tempest"), CaptureIntakeError, "already");
    // The samples that must not flag: the world inside a word, and later in the slug.
    assertStrictEquals(
        composeIntakeName(fight, "tempestowa-grupa"),
        "2026-09-25-tempest-tempestowa-grupa-1785244275300-0.20.0.json",
    );
    assertStrictEquals(
        composeIntakeName(fight, "grupa-vs-tempest"),
        "2026-09-25-tempest-grupa-vs-tempest-1785244275300-0.20.0.json",
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

Deno.test("a roll holds as many combatants as its bound, and one more is refused", () => {
    const monsters = (count: number) =>
        Array.from({ length: count }, (_, order) => [-1 - order, `Wilk ${order}`] as const);
    const atBound = composePseudonymisedRecording(
        composeRosterRecording(monsters(NAMES_MAXIMUM), 1),
    );
    assertStrictEquals(atBound.substitutions.size, 0, "at the bound, every monster keeps its name");
    assertThrows(
        () => composePseudonymisedRecording(composeRosterRecording(monsters(NAMES_MAXIMUM + 1), 1)),
        CaptureIntakeError,
        `${NAMES_MAXIMUM + 1} combatants named, past the ${NAMES_MAXIMUM}`,
    );
});

/** One payload whose roster states each id under its name, all players or all monsters. */
function composeRosterRecording(
    named: readonly (readonly [number, string])[],
    nonPlayer: number,
): Record<string, unknown> {
    const warriors: Record<string, unknown> = {};
    for (const [order, [id, name]] of named.entries()) {
        warriors[`entry${order}`] = { id, name, npc: nonPlayer };
    }
    return { calls: [{ index: 0, messages: [], payload: { w: warriors } }] };
}

Deno.test("one combatant is read under as many names as the bound, and one more is refused", () => {
    const names = (count: number) =>
        Array.from({ length: count }, (_, order) => [-1, `Wilk ${order}`] as const);
    const atBound = composePseudonymisedRecording(composeRosterRecording(names(NAMES_MAXIMUM), 1));
    assertStrictEquals(atBound.changed, 0, "at the bound, the monster's every name is kept");
    assertThrows(
        () => composePseudonymisedRecording(composeRosterRecording(names(NAMES_MAXIMUM + 1), 1)),
        CaptureIntakeError,
        `combatant -1 is named ${NAMES_MAXIMUM + 1} ways, past the ${NAMES_MAXIMUM}`,
    );
});

Deno.test("players' names are substituted up to the bound, and one more is refused", () => {
    // Two players, so neither one's names nor the roll reaches its own bound first.
    const half = NAMES_MAXIMUM / 2;
    const names = (id: number, count: number) =>
        Array.from({ length: count }, (_, order) => [id, `p${id}x${order}`] as const);
    const atBound = composePseudonymisedRecording(
        composeRosterRecording([...names(1, half), ...names(2, half)], 0),
    );
    assertStrictEquals(atBound.substitutions.size, NAMES_MAXIMUM, "every name, at the bound");
    assertStrictEquals(atBound.changed, NAMES_MAXIMUM, "and each replaced where it stands");
    assertThrows(
        () =>
            composePseudonymisedRecording(
                composeRosterRecording([...names(1, half), ...names(2, half + 1)], 0),
            ),
        CaptureIntakeError,
        `${NAMES_MAXIMUM + 1} player names, past the ${NAMES_MAXIMUM}`,
    );
});

Deno.test("a recording is read up to its bound on calls, and refused one past it", () => {
    const calling = (count: number) => ({ calls: new Array(count).fill({ index: 0 }) });
    requireCallsCarried(calling(CALLS_MAXIMUM));
    assertThrows(
        () => requireCallsCarried(calling(CALLS_MAXIMUM + 1)),
        CaptureIntakeError,
        `holds ${CALLS_MAXIMUM + 1}, past the ${CALLS_MAXIMUM}`,
    );
});

Deno.test("a recording is walked up to its bound on values, and refused one past it", () => {
    const atBound = composePseudonymisedRecording(composeValues(VALUES_MAXIMUM));
    assertStrictEquals(atBound.changed, 0, "at the bound, every value is walked and kept");
    assertThrows(
        () => composePseudonymisedRecording(composeValues(VALUES_MAXIMUM + 1)),
        CaptureIntakeError,
        `past the ${VALUES_MAXIMUM} values read`,
    );
});

/**
 * A recording whose walk takes exactly `count` steps: itself, its one list, and lists of noughts in
 * it. Short lists keep the walk's worklist short, and one list stands many times over, since the
 * walk does not ask whether it saw a value before.
 */
function composeValues(count: number): Record<string, unknown> {
    const width = 2048;
    const noughts = new Array(width).fill(0);
    const lists: unknown[] = [];
    let remaining = count - 2;
    while (remaining > 0) {
        const length = Math.min(width, remaining - 1);
        lists.push(length === width ? noughts : noughts.slice(0, length));
        remaining -= length + 1;
    }
    return { filler: lists };
}

Deno.test("a string is read up to its bound on characters, and refused one past it", () => {
    const writing = (count: number) => ({ filler: "x".repeat(count) });
    const atBound = composePseudonymisedRecording(writing(TEXT_CHARACTERS_MAXIMUM));
    assertEquals(atBound.recording, writing(TEXT_CHARACTERS_MAXIMUM), "every character, at it");
    const past = TEXT_CHARACTERS_MAXIMUM + 1;
    assertThrows(
        () => composePseudonymisedRecording(writing(past)),
        CaptureIntakeError,
        `a string of ${past} characters, past the ${TEXT_CHARACTERS_MAXIMUM}`,
    );
});
