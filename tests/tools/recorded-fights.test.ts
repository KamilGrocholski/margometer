/**
 * The recordings as the preview reads them, and the one claim the preview's rewind stands on.
 *
 * Stepping back is replaying from the first call, which is only sound while every recording opens
 * on a payload that resets the session. That is measured over `captures/` here rather than
 * assumed, because a recording arriving without it would make the rewind silently wrong.
 */

import {
    assert,
    assertEquals,
    assertInstanceOf,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import { isFightStart } from "@/src/game/battle-session.ts";
import {
    getPreviewRecordedFight,
    getRecordedFightAt,
    getRecordedFightCalls,
    getRecordedFightNames,
    getRecordedFights,
    PREVIEW_FIGHT_NAME,
} from "@/tools/recorded-fights.ts";
import { PreviewBuildError, RecordingReadError } from "@/tools/margometer-tool-error.ts";

Deno.test("the recordings are the directory, not a list somebody typed", () => {
    const names = getRecordedFightNames();
    assert(names.length > 0, "there is material to draw");
    assertEquals([...names].sort(), names, "and it arrives in an order a picker can be read in");
    for (const name of names) {
        assert(!name.endsWith(".json"), "a picker offers a fight, not a filename");
    }
});

Deno.test("a recording nothing filed is refused rather than read as empty", () => {
    assertThrows(
        () => getRecordedFightCalls("no-such-fight-was-ever-recorded"),
        Error,
        undefined,
        "a name nobody filed is a refusal",
    );
    const refused = assertThrows(() => getRecordedFightCalls("2026-08-04"));
    assertInstanceOf(refused, Error, "and it is an error, whatever the reading tripped on");
});

Deno.test("every fight carries its calls, and one of them is the one a preview opens on", () => {
    const fights = getRecordedFights();
    assert(fights.length > 1, "there is more than one fight to choose between");
    for (const fight of fights) {
        assert(fight.calls.length > 0, `${fight.name} carries the calls the add-on would see`);
    }
    const opened = getPreviewRecordedFight(fights);
    assertEquals(opened.name, PREVIEW_FIGHT_NAME, "the named recording is the one handed back");
    assertEquals(
        fights.filter((fight) => fight.name === PREVIEW_FIGHT_NAME).length,
        1,
        "and the directory carries it exactly once",
    );
    assertThrows(
        () => getPreviewRecordedFight(fights.filter((fight) => fight.name !== PREVIEW_FIGHT_NAME)),
        PreviewBuildError,
        PREVIEW_FIGHT_NAME,
        "a set without it is a refusal, not a preview quietly opening on something else",
    );
});

Deno.test("every recording opens on a payload that resets the session", () => {
    const without: string[] = [];
    for (const fight of getRecordedFights()) {
        if (!isFightStart(fight.calls[0])) without.push(fight.name);
    }
    assertEquals(without, [], "a recording whose first call would not rewind the preview");
});

/**
 * The route that need not be material: what decides whether an intake is worth starting is what
 * the file carries, and asking that after the redaction step is the wrong way round.
 */
Deno.test("a recording opens at a path, named for its file and not for where it sat", () => {
    const path = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
    const fight = getRecordedFightAt(path);
    assertEquals(
        fight.name,
        "2026-08-06-tempest-grupa-vs-hildur-1785244275300-none",
        "the suffix is not a name",
    );
    assertEquals(fight.calls, getRecordedFightCalls(fight.name), "both routes read one file");
});

Deno.test("a file that is not a recording refuses under the reader's own brand", () => {
    const missing = assertThrows(
        () => getRecordedFightAt("captures/no-such-recording-was-ever-made.json"),
        RecordingReadError,
    );
    assertStringIncludes(missing.message, "open", "a path that is not there says so");
    const unreadable = assertThrows(() => getRecordedFightAt("deno.lock"), RecordingReadError);
    assertStringIncludes(
        unreadable.message,
        "calls",
        "and a file listing no call says that instead",
    );
});
