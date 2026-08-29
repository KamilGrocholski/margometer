/**
 * The photographed set, and the sidecar that says where it came from.
 *
 * The directory is not there until somebody shoots one, so the reader is proved on samples first
 * — a set it must flag and a set it must not — and only then let near the tree. A guard over a
 * directory that does not exist passes by having nothing to find.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { getValueFromJsonText, isRecord } from "@/src/core/unknown-reading.ts";
import { PanelShotError } from "@/tools/margometer-tool-error.ts";
import {
    composeFrameFromReport,
    composePanelShots,
    composeShotScript,
    getBrowserAsked,
    getReportFromDom,
    SIDECAR_NAME,
} from "@/tools/panel-screenshots.ts";

const SHOT_DIRECTORY = "screenshots";

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
    assert(held.includes(SIDECAR_NAME), "a set carries the sidecar saying where it came from");
    const written = getValueFromJsonText(
        Deno.readTextFileSync(`${SHOT_DIRECTORY}/${SIDECAR_NAME}`),
    );
    assert(isRecord(written), "and the sidecar is a record");
    const named = written.shots;
    assert(Array.isArray(named), "naming the pictures it stands beside");
    assertEquals(getSetDisagreements(held, named as string[]), [], "DESIGN.md: the set is the set");
});

Deno.test("a state is reached by a press and never by a click", () => {
    const script = composeShotScript(`setPressed("[data-row]", 0);`);
    assert(script.includes("pointerdown"), "the panel listens for a press, so a press is sent");
    assert(!script.includes(".click("), "a click fires nothing at all, and reports success");
    assert(script.includes("maxHeight"), "the height cap is lifted for the photograph");
    assert(script.includes("preview-strip"), "and the harness takes its own chrome out of frame");
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
    const asked = getBrowserAsked("firefox", "chromium");
    assertEquals(asked[0], "firefox", "what was asked for is looked for first");
    assert(asked.includes("google-chrome"), "and Chrome is in the list either way");
});
