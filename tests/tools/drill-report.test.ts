/**
 * The drill register, held against the panel both ways.
 *
 * A guard that only refused a case the document does not name would stay green while the document
 * grew rows nothing draws; one that only refused an unnamed row would stay green while the panel
 * stopped drawing half of them. So the two lists are compared as sets, and each reader is proved
 * by a sample it must flag and a sample it must not.
 */

import { assert, assertArrayIncludes, assertEquals } from "@std/assert";
import { getBareCell, getCellsFromLine } from "@/tests/markdown-document.ts";
import { composeFakeDocument, type FakeElement, getElementsWithin } from "@/tests/fake-document.ts";
import { composePanelHost } from "@/src/ui/panel-element.ts";
import { composePanelReading, NOTHING_SUSPECT } from "@/src/ui/panel-reading.ts";
import {
    composeCaseReport,
    composeDrillCases,
    composeDrillReport,
    DRILL_ROWS,
    DRILL_RUNGS,
    DRILL_VERDICTS,
} from "@/tools/drill-report.ts";
import { composeFightReplay, composeReplayedMaterial } from "@/tools/fight-replay.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";
import { assertStringIncludes } from "@std/assert";
import { getRecordedFightAt } from "@/tools/recorded-fights.ts";
import { SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import { composeShownScreen } from "@/tests/shown-screen.ts";

const REGISTER_PATH = "docs/drill-levels.md";
const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
const SOMETIMES_HEADING = "## The cells that say";
const SHUT_HEADING = "## What stays shut, and why";
/** The opening of the one sentence that names them, and the whole of how it is found. */
const SHUT_OPENING = "Inside an opened row they are";
/** The rung that sentence is about: the rows a reader meets inside an opened row. */
const SHUT_RUNG = "opened";
const BACKTICK = "`";

/**
 * The place these views stand in. Every test here reads what was drawn rather than where the
 * region was left, so one name says they are all the same place; the scroll tests name their own.
 */

/**
 * One row of the register, as the document writes it. The heading is not a row and neither is the
 * rule under a `|---|` divider, so a cell that is not one of the vocabularies is skipped rather
 * than read as a case nobody produced.
 */
interface RegisterRow {
    screen: string;
    rung: string;
    row: string;
    verdict: string;
}

/**
 * The register's own table and no other in the file. Read by the heading it sits under, because
 * the document carries four other tables and a reader that took all of them would count the
 * vocabularies as cases.
 */
function getRegisterRows(text: string): RegisterRow[] {
    const found: RegisterRow[] = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith("## The register")) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside) continue;
        if (!line.startsWith("| ")) continue;
        const cells = getCellsFromLine(line).map(getBareCell);
        const [screen, rung, row, verdict] = cells;
        if (screen === undefined || rung === undefined) continue;
        if (row === undefined || verdict === undefined) continue;
        if (!DRILL_VERDICTS.includes(verdict as never)) continue;
        found.push({ screen, rung, row, verdict });
    }
    return found;
}

function composeRegisterKey(one: RegisterRow): string {
    return `${one.screen} | ${one.rung} | ${one.row} | ${one.verdict}`;
}

Deno.test("the register reader finds the register, and nothing else in the file", () => {
    const sample = "## The register\n\n| screen | level | row | opens |\n| - | - | - | - |\n" +
        "| `healthGiven` | `opened` | `skill` | `sometimes` |\n";
    assertEquals(
        getRegisterRows(sample).map(composeRegisterKey),
        ["healthGiven | opened | skill | sometimes"],
        "the reader works",
    );
    // The sample it must not flag: every other table in the document, and a row of the register's
    // own vocabulary tables, which carry two cells rather than four.
    const elsewhere = "| `healthGiven` | `opened` | `skill` | `sometimes` |\n## The register\n" +
        "| `always` | every row of this kind opens |\n" +
        "| screen | level | row | opens |\n";
    assertEquals(getRegisterRows(elsewhere), [], "a table outside the register is not one");
});

Deno.test("the register names every case the panel produces, and no case it does not", () => {
    const cases = composeDrillCases(composeReplayedMaterial([]).replays);
    const measured = new Set(
        cases.map((one) => `${one.screen} | ${one.rung} | ${one.row} | ${one.verdict}`),
    );
    const written = new Set(
        getRegisterRows(Deno.readTextFileSync(REGISTER_PATH))
            .map(composeRegisterKey),
    );
    assert(written.size > 0, "the register carries rows");
    const unwritten = [...measured].filter((one) => !written.has(one)).sort();
    assertEquals(unwritten, [], `${REGISTER_PATH}: the panel draws a case the register does not`);
    const undrawn = [...written].filter((one) => !measured.has(one)).sort();
    assertEquals(
        undrawn,
        [],
        `${REGISTER_PATH}: the register names a case the panel does not draw`,
    );
});

Deno.test("every case is one of the vocabularies the register states", () => {
    const cases = composeDrillCases([composeFightReplay(getRecordedFightAt(HILDUR))]);
    assert(cases.length > 0, "the recording produces cases");
    for (const one of cases) {
        assertArrayIncludes(
            SCREEN_ORDER,
            [one.screen],
            `${one.screen} is a screen the strips draw`,
        );
        assertArrayIncludes(DRILL_RUNGS, [one.rung], `${one.rung} is a level the panel has`);
        assertArrayIncludes(DRILL_ROWS, [one.row], `${one.row} is a kind of row the panel draws`);
        assertArrayIncludes(DRILL_VERDICTS, [one.verdict], `${one.verdict} is a verdict`);
        assert(one.opens + one.shut > 0, "and a case counted was counted at least once");
    }
});

/**
 * The verdict for a ranking row is the one cell no reading can answer: the mark is written by the
 * element layer without asking anybody, so the tool states it rather than measuring it. Held here
 * instead, off the drawn panel — a ranking that stopped marking its rows would leave the register
 * saying `always` with nothing behind it.
 */
Deno.test("every row of every ranking carries the mark that opens it", () => {
    const replay = composeFightReplay(getRecordedFightAt(HILDUR));
    for (const screen of SCREEN_ORDER) {
        const reading = composePanelReading(
            replay.statistics,
            replay.roster,
            screen,
            "everyone",
            replay.reading.readerSide,
            NOTHING_SUSPECT,
        );
        const document = composeFakeDocument();
        const panel = composePanelHost(document, () => {}, () => {});
        panel.show(composeShownScreen(reading, screen));
        const drawn = getElementsWithin(panel.element as FakeElement)
            .filter((one) => one.className.split(" ")[0] === "row");
        const opening = drawn.filter((one) => one.attributes.get("data-row") !== undefined);
        assert(drawn.length > 0, `${screen}: the ranking drew rows`);
        assertEquals(opening.length, reading.rows.length, `${screen}: every combatant row opens`);
        // A pinned row is marked by an end rather than by a combatant, and it is the only row on
        // this screen that is: nobody stands behind it to be named by an id (**ADR 0038**).
        const pinned = drawn.filter((one) => one.attributes.get("data-unnamed") !== undefined);
        assertEquals(pinned.length, reading.pinned.length, `${screen}: every pinned row opens`);
        // And the mark and the cursor agree: a row marked `leaf` that carried either mark would
        // open under a cursor saying it does not, which is the panel saying two things at once.
        for (const row of drawn) {
            const doesOpen = row.attributes.get("data-row") !== undefined ||
                row.attributes.get("data-unnamed") !== undefined;
            assertEquals(
                row.className.includes("drillable"),
                doesOpen,
                `${screen}: a row's cursor says what its mark says`,
            );
        }
    }
});

Deno.test("the report is the composition, and states the material it was taken on", () => {
    const cases = composeDrillCases([composeFightReplay(getRecordedFightAt(HILDUR))]);
    const lines = composeCaseReport(cases);
    assert(lines[0]?.includes("verdict"), "the table is headed");
    assertEquals(lines.length, cases.length + 1, "and holds a line per case under that heading");
    for (const one of cases) {
        assert(
            lines.some((line) => line.includes(one.screen) && line.includes(one.verdict)),
            `${one.screen} ${one.rung} ${one.row} is on the table`,
        );
    }
});

Deno.test("a recording walked row by row names whom each level was opened from", () => {
    const replay = composeFightReplay(getRecordedFightAt(HILDUR));
    const lines = composeDrillReport(replay, ["healthGiven", "healthRestored"]);
    assert(
        lines.includes("=== 2026-08-06-tempest-grupa-vs-hildur-1785244275300-none ==="),
        "named for its file",
    );
    assertArrayIncludes(lines, ["  --- healthGiven ---"], "and for the screens it walked");
    assertArrayIncludes(lines, ["  --- healthRestored ---"], "both of them");
    assert(lines.some((line) => line.includes("person  opens")), "some rows of it open");
    // The receiving side keeps a key flat, with nobody beside it, so its rows open onto nothing.
    assert(lines.some((line) => line.includes("source leaf")), "and some do not");
    assert(
        !lines.some((line) => line.includes("--- damageDealtApplied ---")),
        "a screen nobody asked for is not walked",
    );
});

/**
 * The headings under `## The cells that say`, as the screen and row each names. A heading is the
 * unit because `deno fmt` never wraps one, where the paragraph under it is wrapped at a hundred
 * columns and a pair of names read out of prose would stop being findable the day a word ahead of
 * them changes length.
 */
function getExplainedCells(text: string): string[] {
    const found: string[] = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith(SOMETIMES_HEADING)) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside) continue;
        if (!line.startsWith("### ")) continue;
        const named = getBackticked(line);
        const [screen, row] = named;
        if (screen === undefined) continue;
        if (row === undefined) continue;
        found.push(`${screen} | ${row}`);
    }
    return found;
}

/** Every run between a pair of backticks on one line, in the order written. */
function getBackticked(line: string): string[] {
    const found: string[] = [];
    let at = line.indexOf(BACKTICK);
    // The bound is the line's own length: a line holds fewer pairs than it holds characters.
    for (let held = 0; held < line.length; held += 1) {
        if (at === -1) break;
        const closes = line.indexOf(BACKTICK, at + 1);
        if (closes === -1) break;
        found.push(line.slice(at + 1, closes));
        at = line.indexOf(BACKTICK, closes + 1);
    }
    return found;
}

Deno.test("every verdict of `sometimes` is explained, and every explanation is of one", () => {
    const sample = `${SOMETIMES_HEADING}\n\n### \`healthGiven\` · \`skill\`\n\nWhy.\n`;
    assertEquals(getExplainedCells(sample), ["healthGiven | skill"], "the reader works");
    // The sample it must not flag: the same heading standing outside the section, and one inside
    // it naming a single thing, which is not a cell.
    const elsewhere = `### \`healthGiven\` · \`skill\`\n${SOMETIMES_HEADING}\n\n### \`kind\`\n`;
    assertEquals(getExplainedCells(elsewhere), [], "a heading outside the section is not one");
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const uncertain = getRegisterRows(register)
        .filter((one) => one.verdict === "sometimes")
        .map((one) => `${one.screen} | ${one.row}`);
    assert(uncertain.length > 0, "the register carries a verdict that depends on something");
    const explained = getExplainedCells(register);
    assertEquals(
        uncertain.filter((one) => !explained.includes(one)).sort(),
        [],
        `${REGISTER_PATH}: a cell says \`sometimes\` and nothing says on what`,
    );
    assertEquals(
        explained.filter((one) => !uncertain.includes(one)).sort(),
        [],
        `${REGISTER_PATH}: a cell is explained that no longer says \`sometimes\``,
    );
});

/**
 * The kinds the document says stay shut, read out of the one paragraph that names them. Read as a
 * paragraph rather than as a line, because `deno fmt` owns where this prose wraps and a reader
 * over a line would take whichever half of the sentence the formatter left it.
 *
 * Only a run that is a row kind is taken: the paragraph cites a path and a task in backticks
 * beside the kinds, and the vocabulary is what tells the two apart.
 */
function getKindsSaidShut(text: string): string[] {
    const found: string[] = [];
    let inside = false;
    let said = "";
    for (const line of text.split("\n")) {
        if (line.startsWith(SHUT_HEADING)) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside) continue;
        if (said.length > 0 && line.length === 0) break;
        if (said.length === 0 && !line.startsWith(SHUT_OPENING)) continue;
        said = `${said} ${line}`;
    }
    for (const named of getBackticked(said)) {
        if (!DRILL_ROWS.some((one) => one === named)) continue;
        if (found.includes(named)) continue;
        found.push(named);
    }
    return found.sort();
}

/**
 * ⚠️ **The half of the register nothing else holds.** The table above says what each cell's
 * verdict is; this says which kinds are the shut ones, which is the sentence that goes stale when
 * a row starts opening — as `closing` did, a release before anything asked.
 */
Deno.test("the kinds said to stay shut are the kinds that stay shut, both ways round", () => {
    const sample = `${SHUT_HEADING}\n\n${SHUT_OPENING} \`kind\` and\n\`closing\` — and so on.\n`;
    assertEquals(getKindsSaidShut(sample), ["closing", "kind"], "the reader works");
    // The two it must not flag: the sentence standing outside the section, and a paragraph of the
    // section that is not the one naming them.
    const elsewhere = `${SHUT_OPENING} \`kind\`.\n${SHUT_HEADING}\n\nSomething else, \`skill\`.\n`;
    assertEquals(getKindsSaidShut(elsewhere), [], "a sentence outside the section is not one");
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const said = getKindsSaidShut(register);
    assert(said.length > 0, "the document names the kinds that stay shut");
    const shut = new Set<string>();
    for (const one of composeDrillCases(composeReplayedMaterial([]).replays)) {
        if (one.rung !== SHUT_RUNG) continue;
        if (one.shut === 0) continue;
        shut.add(one.row);
    }
    assertEquals(
        said.filter((one) => !shut.has(one)),
        [],
        `${REGISTER_PATH}: a kind is said to stay shut that opens wherever the panel draws it`,
    );
    assertEquals(
        [...shut].sort().filter((one) => !said.includes(one)),
        [],
        `${REGISTER_PATH}: a kind stays shut and the document does not say so`,
    );
});

/** A figure grouped the way the register writes one: `10,787,341`. */
function composeGroupedFigure(figure: number): string {
    assert(Number.isSafeInteger(figure), "a figure written into prose is a whole number");
    assert(figure >= 0, "and a sum over the corpus is never below nothing");
    return figure.toLocaleString("en-US");
}

/**
 * ⚠️ **The paragraph that overturned this document's earlier claim, and the figures it stands on
 * were read once.** Every one of them had gone stale by 2026-09-17 — the corpus had grown by five
 * recordings and the share had moved from 80.1% to 79.7%, the side-2 count from 25 of 31 to 30 of
 * 37. A figure arguing a point is the last one that may be left unearned, because the argument
 * goes on reading as though it were measured.
 */
Deno.test("what stands under an announcement is what the register says it is", () => {
    let appliedTotal = 0;
    let underAnnouncement = 0;
    let onSideTwo = 0;
    let announcingOnSideTwo = 0;
    for (const replay of composeReplayedMaterial(readRecordingPaths()).replays) {
        for (const [combatantId, figures] of replay.statistics.byCombatantId) {
            appliedTotal += figures.damageDealtApplied;
            let dealt = 0;
            for (const skill of figures.skills.values()) dealt += skill.dealt;
            underAnnouncement += dealt;
            const member = replay.roster.byId.get(combatantId);
            if (member?.side !== 2) continue;
            onSideTwo += 1;
            if (figures.skills.size > 0) announcingOnSideTwo += 1;
        }
    }
    assert(appliedTotal > 0, "the corpus holds applied damage to take a share of");
    assert(onSideTwo > 0, "and combatants on the side the paragraph is about");

    const register = Deno.readTextFileSync(REGISTER_PATH);
    const share = ((underAnnouncement / appliedTotal) * 100).toFixed(1);
    assertStringIncludes(
        register,
        `${announcingOnSideTwo} of the ${onSideTwo} combatants on side 2`,
        `${REGISTER_PATH}: how many of them announce anything`,
    );
    assertStringIncludes(
        register,
        `${share}%\nof all applied damage`,
        `${REGISTER_PATH}: the share standing under an announcement`,
    );
    assertStringIncludes(
        register,
        `${composeGroupedFigure(underAnnouncement)} of ${composeGroupedFigure(appliedTotal)}`,
        `${REGISTER_PATH}: the two figures that share is taken between`,
    );
});
