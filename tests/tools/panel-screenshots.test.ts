/**
 * The photographed set, and the sidecar that says where it came from.
 *
 * The directory is not there until somebody shoots one, so the reader is proved on samples first
 * — a set it must flag and a set it must not — and only then let near the tree. A guard over a
 * directory that does not exist passes by having nothing to find.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { PLACE, SPACE, TIP } from "@/src/ui/panel-look.ts";
import { CONFIGURATION_FILE } from "@/project/repository-layout.ts";
import { getDeclaredVersion, isVersionOfTree } from "@/tools/declared-version.ts";
import { PanelShotError } from "@/tools/margometer-tool-error.ts";
import {
    composeFrameFromReport,
    composePanelShots,
    composeShotAddress,
    composeShotScript,
    FRAME_PARAMETER,
    getReportFromDom,
    MEASURING_WIDTH,
    SHOT_DIRECTORY,
    SIDECAR_NAME,
} from "@/tools/panel-screenshots.ts";

/** A length off the panel's own stylesheet, which states them all in whole pixels. */
function getSheetLength(stated: string): number {
    return getIntegerFromText(stated.slice(0, -2))!;
}

/** What the directory holds against what the sidecar names, in both directions. */
function getSetDisagreements(held: readonly string[], named: readonly string[]): string[] {
    assert(named.length >= 0, "a sidecar names however many pictures it names");
    const found: string[] = [];
    for (const name of held) {
        if (name === SIDECAR_NAME) continue;
        if (!named.includes(name)) found.push(`${name} is there and unnamed`);
    }
    for (const name of named) {
        if (!held.includes(name)) found.push(`${name} is named and gone`);
    }
    return found;
}

Deno.test("the reader flags a set at odds with its sidecar, and passes one that is not", () => {
    const agreeing = getSetDisagreements([SIDECAR_NAME, "a.png"], ["a.png"]);
    assertEquals(agreeing, [], "a set that says what it holds is a set nobody has to chase");
    const leftOver = getSetDisagreements([SIDECAR_NAME, "a.png", "b.png"], ["a.png"]);
    assertEquals(
        leftOver.length,
        1,
        "a picture from a larger set cannot sit there looking current",
    );
    const missing = getSetDisagreements([SIDECAR_NAME], ["a.png"]);
    assertEquals(missing.length, 1, "and a sidecar cannot name a picture nobody can open");
});

Deno.test("whatever is in the directory agrees with the sidecar standing beside it", () => {
    let held: string[] = [];
    try {
        held = [...Deno.readDirSync(SHOT_DIRECTORY)].map((entry) => entry.name);
    } catch {
        // No set has been taken yet, which is a tree with nothing to disagree about.
        return;
    }
    assertArrayIncludes(
        held,
        [SIDECAR_NAME],
        "a set carries the sidecar saying where it came from",
    );
    const reading = getJsonReading(
        Deno.readTextFileSync(`${SHOT_DIRECTORY}/${SIDECAR_NAME}`),
    );
    assert(reading.isOk, "and the sidecar is JSON");
    const written = reading.value;
    assert(isRecord(written), "and the sidecar is a record");
    const named = written.shots;
    assert(Array.isArray(named), "naming the pictures it stands beside");
    assertEquals(getSetDisagreements(held, named as string[]), [], "DESIGN.md: the set is the set");
});

/**
 * The version the panel in the pictures states, against the version this tree is. A number bumped
 * for a release with no reshoot leaves the release before it on the front page, and every picture
 * still opens at the right size: the sidecar is the only thing that says which build drew them.
 * `isVersionOfTree` is proved on samples in `tests/tools/declared-version.test.ts`.
 */
Deno.test("the set was taken at a version this tree is", () => {
    let sidecar = "";
    try {
        sidecar = Deno.readTextFileSync(`${SHOT_DIRECTORY}/${SIDECAR_NAME}`);
    } catch {
        // No set has been taken yet, which is a tree with no version to disagree about.
        return;
    }
    const reading = getJsonReading(sidecar);
    assert(reading.isOk, "the sidecar beside the set is JSON");
    assert(isRecord(reading.value), "and is a record");
    const stated = reading.value.version;
    assert(typeof stated === "string", "saying the version the set was taken at");
    const declared = getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
    assert(
        isVersionOfTree(stated, declared),
        `the set says ${stated} and the tree declares ${declared} — take the set again`,
    );
});

Deno.test("a state is reached by a press and never by a click", () => {
    const script = composeShotScript(`setPressed("[data-row]", 0);`);
    assertStringIncludes(
        script,
        "pointerdown",
        "the panel listens for a press, so a press is sent",
    );
    assert(!script.includes(".click("), "a click fires nothing at all, and reports success");
    assertStringIncludes(script, "maxHeight", "the height cap is lifted for the photograph");
    assertStringIncludes(
        script,
        "preview-strip",
        "and the harness takes its own chrome out of frame",
    );
});

Deno.test("the panel stands where it is photographed before anything is pressed", () => {
    const script = composeShotScript(`setPressed("[data-row]", 0);`);
    const taken = script.indexOf("setPanelInCorner();");
    const pressed = script.indexOf(`setPressed("[data-row]", 0);`);
    assert(taken > 0, "the panel is taken to the corner the frame is measured against");
    assert(pressed > 0, "and the state is reached by the presses that were asked for");
    assert(taken < pressed, "in that order: a card opens on the side the panel stood on");
    assertStringIncludes(script, "[data-grip]", "the panel is moved by its own bar");
    assertStringIncludes(
        script,
        `setPointer("pointerup"`,
        "and let go of, which is when it is kept",
    );
    assert(
        script.includes(`get("${FRAME_PARAMETER}")`),
        "to the corner of the frame it is taken at, which the address is what states",
    );
});

Deno.test("the picture is taken at the address that was measured, told its frame", () => {
    const measured = "http://localhost:8000/?fight=a&entry=2";
    assertEquals(
        composeShotAddress(measured, 276),
        `${measured}&${FRAME_PARAMETER}=276`,
        "the same fight at the same entry, and the width it will be photographed at",
    );
    assertThrows(
        () => composeShotAddress(measured, 0),
        Error,
        undefined,
        "a frame of no width is not a picture anybody asked for",
    );
});

Deno.test("the window measured in holds the card beside the panel, not over it", () => {
    const room = MEASURING_WIDTH - getSheetLength(PLACE.width) - getSheetLength(PLACE.inset) * 2 -
        getSheetLength(SPACE.small);
    assert(
        room >= getSheetLength(TIP.width),
        "a window with no room beside the panel flips the card onto the figures it explains",
    );
});

Deno.test("every picture in the set is named once, and named as a picture", () => {
    const shots = composePanelShots();
    const names = shots.map((shot) => shot.name);
    assertEquals(new Set(names).size, names.length, "no two shots write the same file");
    for (const shot of shots) {
        assert(shot.name.endsWith(".png"), `${shot.name} is written as a picture`);
        assert(shot.steps.length > 0, `${shot.name} is of a state something reached`);
    }
});

Deno.test("the frame comes off the viewport the page stood in, not off what was asked for", () => {
    const dom = `<html><body><pre id="preview-report" hidden="">` +
        `{"viewport":500,"left":232,"bottom":402,"rows":11}</pre></body></html>`;
    const report = getReportFromDom(dom);
    assertEquals(composeFrameFromReport(report), [276, 410], "the panel, and its inset each side");

    const card = getReportFromDom(dom.replace(`"left":232`, `"left":-22`));
    assertEquals(composeFrameFromReport(card), [530, 410], "a card off the panel is made room for");

    assertThrows(
        () => composeFrameFromReport({ left: 0, bottom: 10 }),
        PanelShotError,
        undefined,
        "a report that never said where it stood cannot size a frame",
    );
});

Deno.test("a page that wrote nothing down is a refusal, not a frame of some other size", () => {
    assertThrows(
        () => getReportFromDom("<html><body></body></html>"),
        PanelShotError,
        undefined,
        "a dumped page with no report in it",
    );
});
