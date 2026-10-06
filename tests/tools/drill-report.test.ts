/**
 * The drill register, held against the panel both ways.
 *
 * A guard that only refused a case the document does not name would stay green while the document
 * grew rows nothing draws; one that only refused an unnamed row would stay green while the panel
 * stopped drawing half of them. So the two lists are compared as sets, and each reader is proved
 * by a sample it must flag and a sample it must not.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertExists,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import { isOneOf } from "#/libs/vocabulary.ts";
import { PANEL_MARK } from "#/src/ui/panel-intent.ts";
import { CLASS } from "#/src/ui/panel-look.ts";
import { NOTHING_SUSPECT, presentScreen } from "#/src/ui/panel-content.ts";
import { SCREEN_ORDER, SIDE_CHOICE } from "#/src/ui/panel-screen.ts";
import {
    DRILL_ROWS,
    DRILL_RUNG,
    DRILL_RUNGS,
    DRILL_VERDICT,
    DRILL_VERDICTS,
    formatCaseReport,
    formatDrillReport,
    tallyDrillCases,
} from "#/tools/drill-report.ts";
import {
    readRecordedMaterial,
    type ReplayedFight,
    replayRecordedMaterial,
} from "#/tools/recorded-material.ts";
import { composeFakeDocument, type FakeElement, getElementsWithin } from "#/tests/fake-document.ts";
import { initTestView } from "#/tests/panel-view.ts";
import { composeShownScreen } from "#/tests/shown-screen.ts";

/** One row of the register, as the document writes it. */
interface RegisterRow {
    screen: string;
    rung: string;
    row: string;
    verdict: string;
}

const REGISTER_PATH = "docs/drill-levels.md";
const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
const REGISTER_HEADING = "## The register";
const SOMETIMES_HEADING = "## The cells that say";
const SHUT_HEADING = "## What stays shut, and why";
/** The opening of the one sentence that names them, and the whole of how it is found. */
const SHUT_OPENING = "Inside an opened row they are";
const SECTION_OPENER = "## ";
const CELL_OPENER = "| ";
const CELL_SEPARATOR = "|";
const BACKTICK = "`";
const KEY_SEPARATOR = " | ";
/** A kind row a level under a person: the unnamed pair's, and the unnamed cut's. */
const NESTED_KIND = "        kind    ";
/** The side the announcement paragraph counts, as the roster numbers it. */
const SIDE_COUNTED = 2;

Deno.test("the register reader finds the register, and nothing else in the file", () => {
    const sample = `${REGISTER_HEADING}\n\n| screen | level | row | opens |\n| - | - | - | - |\n` +
        "| `healthGiven` | `opened` | `skill` | `sometimes` |\n";
    assertEquals(
        parseRegisterRows(sample).map(formatRegisterKey),
        ["healthGiven | opened | skill | sometimes"],
        "the reader works",
    );
    // The sample it must not flag: every other table in the document, and a row of the register's
    // own vocabulary tables, which carry two cells rather than four.
    const elsewhere = "| `healthGiven` | `opened` | `skill` | `sometimes` |\n" +
        `${REGISTER_HEADING}\n| \`always\` | every row of this kind opens |\n` +
        "| screen | level | row | opens |\n";
    assertEquals(parseRegisterRows(elsewhere), [], "a table outside the register is not one");
});

/**
 * The register's own table and no other in the file, read by the heading it sits under: the
 * document carries four other tables, and a reader that took them would count vocabularies.
 */
function parseRegisterRows(text: string): RegisterRow[] {
    const rows: RegisterRow[] = [];
    for (const line of parseSectionLines(text, REGISTER_HEADING)) {
        if (!line.startsWith(CELL_OPENER)) continue;
        const [screen, rung, row, verdict] = parseRowCells(line).map(parseBareCell);
        if (screen === undefined) continue;
        if (rung === undefined) continue;
        if (row === undefined) continue;
        if (!isOneOf(DRILL_VERDICTS, verdict)) continue;
        rows.push({ screen, rung, row, verdict });
    }
    return rows;
}

/** The lines under a heading, up to the next heading of its rank. */
function parseSectionLines(text: string, heading: string): string[] {
    const lines = text.split("\n");
    const opened = lines.findIndex((line) => line.startsWith(heading));
    if (opened === -1) return [];
    const rest = lines.slice(opened + 1);
    const closed = rest.findIndex((line) => line.startsWith(SECTION_OPENER));
    return closed === -1 ? rest : rest.slice(0, closed);
}

function parseRowCells(line: string): string[] {
    const cells = line.split(CELL_SEPARATOR).map((cell) => cell.trim());
    return cells.slice(1, -1);
}

/** The backticks are the document's, not the vocabulary's, so they come off before comparing. */
function parseBareCell(cell: string): string {
    const spans = parseBackticked(cell);
    return spans[0] ?? cell;
}

/** Every run between a pair of backticks on one line, in the order written. */
function parseBackticked(line: string): string[] {
    const spans: string[] = [];
    let backtickAt = line.indexOf(BACKTICK);
    // The bound is the line's own length: a line holds fewer pairs than it holds characters.
    for (let held = 0; held < line.length; held += 1) {
        if (backtickAt === -1) break;
        const closes = line.indexOf(BACKTICK, backtickAt + 1);
        if (closes === -1) break;
        spans.push(line.slice(backtickAt + 1, closes));
        backtickAt = line.indexOf(BACKTICK, closes + 1);
    }
    return spans;
}

function formatRegisterKey(registerRow: RegisterRow): string {
    return [registerRow.screen, registerRow.rung, registerRow.row, registerRow.verdict].join(
        KEY_SEPARATOR,
    );
}

Deno.test("the register names every case the panel produces, and no case it does not", () => {
    const measured = new Set(tallyDrillCases(readCorpus()).map(formatRegisterKey));
    const written = new Set(
        parseRegisterRows(Deno.readTextFileSync(REGISTER_PATH)).map(formatRegisterKey),
    );
    assert(written.size > 0, "the register carries rows");
    assertEquals(
        [...measured].filter((caseKey) => !written.has(caseKey)).sort(),
        [],
        `${REGISTER_PATH}: the panel draws a case the register does not`,
    );
    assertEquals(
        [...written].filter((caseKey) => !measured.has(caseKey)).sort(),
        [],
        `${REGISTER_PATH}: the register names a case the panel does not draw`,
    );
});

function readCorpus(): ReplayedFight[] {
    return replayRecordedMaterial(readRecordedMaterial([]));
}

Deno.test("every case is one of the vocabularies the register states", () => {
    const cases = tallyDrillCases(readHildur());
    assert(cases.length > 0, "the recording produces cases");
    for (const drillCase of cases) {
        assertArrayIncludes(
            SCREEN_ORDER,
            [drillCase.screen],
            `${drillCase.screen} is a screen the strips draw`,
        );
        assertArrayIncludes(
            DRILL_RUNGS,
            [drillCase.rung],
            `${drillCase.rung} is a level the panel has`,
        );
        assertArrayIncludes(
            DRILL_ROWS,
            [drillCase.row],
            `${drillCase.row} is a kind of row the panel draws`,
        );
        assertArrayIncludes(
            DRILL_VERDICTS,
            [drillCase.verdict],
            `${drillCase.verdict} is a verdict`,
        );
        assert(
            drillCase.opens + drillCase.shut > 0,
            "and a case counted was counted at least once",
        );
    }
});

function readHildur(): ReplayedFight[] {
    return replayRecordedMaterial(readRecordedMaterial([HILDUR]));
}

/**
 * The verdict for a ranking row is the one cell no reading can answer: the mark is written by the
 * element layer without asking anybody, so the tool states it and the drawn panel is held here.
 */
Deno.test("every row of every ranking carries the mark that opens it", () => {
    const [replayed] = readHildur();
    assertExists(replayed, "the recording replays");
    const { view, figures } = replayed.reading;
    for (const screen of SCREEN_ORDER) {
        const reading = presentScreen(
            figures.statistics,
            view.roster,
            screen,
            SIDE_CHOICE.everyone,
            view.readerSide,
            NOTHING_SUSPECT,
        );
        const panel = initTestView(composeFakeDocument());
        panel.render(composeShownScreen(reading, screen));
        const drawn = getElementsWithin(panel.element as FakeElement)
            .filter((fakeElement) => fakeElement.className.split(" ")[0] === CLASS.row);
        assert(drawn.length > 0, `${screen}: the ranking drew rows`);
        const opening = drawn.filter((fakeElement) => fakeElement.attributes.has(PANEL_MARK.row));
        assertStrictEquals(
            opening.length,
            reading.rows.length,
            `${screen}: every combatant row opens`,
        );
        // A pinned row is marked by an end rather than by a combatant: nobody stands behind it to
        // be named by an id (`develop ADR 0038`).
        const pinned = drawn.filter((fakeElement) =>
            fakeElement.attributes.has(PANEL_MARK.unnamed)
        );
        assertStrictEquals(
            pinned.length,
            reading.pinned.length,
            `${screen}: every pinned row opens`,
        );
        for (const row of drawn) {
            const doesOpen = row.attributes.has(PANEL_MARK.row) ||
                row.attributes.has(PANEL_MARK.unnamed);
            assertStrictEquals(
                row.className.split(" ").includes(CLASS.rowDrillable),
                doesOpen,
                `${screen}: a row's cursor says what its mark says`,
            );
        }
    }
});

Deno.test("the report is the composition, a line per case under one heading", () => {
    const cases = tallyDrillCases(readHildur());
    const lines = formatCaseReport(cases);
    assertStringIncludes(lines[0] ?? "", "verdict", "the table is headed");
    assertStrictEquals(
        lines.length,
        cases.length + 1,
        "and holds a line per case under that heading",
    );
    cases.forEach((drillCase, index) => {
        const line = lines[index + 1] ?? "";
        for (const word of [drillCase.screen, drillCase.rung, drillCase.row, drillCase.verdict]) {
            assertStringIncludes(
                line,
                word,
                `${drillCase.screen} ${drillCase.rung} ${drillCase.row} is on its line`,
            );
        }
    });
});

Deno.test("a recording walked row by row names whom each level was opened from", () => {
    const [replayed] = readHildur();
    assertExists(replayed, "the recording replays");
    const lines = formatDrillReport(replayed, ["healthGiven", "healthRestored"]);
    assertArrayIncludes(
        lines,
        ["=== 2026-08-06-tempest-grupa-vs-hildur-1785244275300-none ==="],
        "named for its file",
    );
    assertArrayIncludes(lines, ["  --- healthGiven ---"], "and for the screens it walked");
    assertArrayIncludes(lines, ["  --- healthRestored ---"], "both of them");
    assert(lines.some((line) => line.includes("person  opens")), "some rows of it open");
    // The receiving side keeps a key flat, with nobody beside it, so its rows open onto nothing.
    assert(lines.some((line) => line.includes("source leaf")), "and some do not");
    assert(
        !lines.some((line) => line.includes("--- damageDealt ---")),
        "a screen nobody asked for is not walked",
    );
});

Deno.test("a kind row under a person is worded off the row the panel drew", () => {
    const nested = readCorpus()
        .flatMap((replayed) => formatDrillReport(replayed, SCREEN_ORDER))
        .filter((line) => line.startsWith(NESTED_KIND));
    assert(nested.length > 0, "the corpus walks a kind row under a person");
    assertEquals(
        nested.filter((line) => !line.startsWith(`${NESTED_KIND}leaf `)),
        [],
        "both levels it stands on are `never` in the register, and the panel draws them so",
    );
});

Deno.test("every verdict of `sometimes` is explained, and every explanation is of one", () => {
    const sample = `${SOMETIMES_HEADING}\n\n### \`healthGiven\` · \`skill\`\n\nWhy.\n`;
    assertEquals(parseExplainedCells(sample), ["healthGiven | skill"], "the reader works");
    // The sample it must not flag: the same heading standing outside the section, and one inside
    // it naming a single thing, which is not a cell.
    const elsewhere = `### \`healthGiven\` · \`skill\`\n${SOMETIMES_HEADING}\n\n### \`kind\`\n`;
    assertEquals(parseExplainedCells(elsewhere), [], "a heading outside the section is not one");
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const uncertain = parseRegisterRows(register)
        .filter((registerRow) => registerRow.verdict === DRILL_VERDICT.sometimes)
        .map((registerRow) => [registerRow.screen, registerRow.row].join(KEY_SEPARATOR));
    assert(uncertain.length > 0, "the register carries a verdict that depends on something");
    const explained = parseExplainedCells(register);
    assertEquals(
        uncertain.filter((cell) => !explained.includes(cell)).sort(),
        [],
        `${REGISTER_PATH}: a cell says \`sometimes\` and nothing says on what`,
    );
    assertEquals(
        explained.filter((cell) => !uncertain.includes(cell)).sort(),
        [],
        `${REGISTER_PATH}: a cell is explained that no longer says \`sometimes\``,
    );
});

/**
 * The headings under `## The cells that say`, as the screen and row each names. A heading is the
 * unit because `deno fmt` never wraps one, where the paragraph under it is wrapped at a hundred
 * columns.
 */
function parseExplainedCells(text: string): string[] {
    const cells: string[] = [];
    for (const line of parseSectionLines(text, SOMETIMES_HEADING)) {
        if (!line.startsWith("### ")) continue;
        const [screen, row] = parseBackticked(line);
        if (screen === undefined) continue;
        if (row === undefined) continue;
        cells.push([screen, row].join(KEY_SEPARATOR));
    }
    return cells;
}

/**
 * ⚠️ **The half of the register nothing else holds.** The table says what each cell's verdict is;
 * this says which kinds are the shut ones, which is the sentence that goes stale when a row starts
 * opening.
 */
Deno.test("the kinds said to stay shut are the kinds that stay shut, both ways round", () => {
    const sample = `${SHUT_HEADING}\n\n${SHUT_OPENING} \`kind\` and\n\`closing\` — and so on.\n`;
    assertEquals(parseKindsSaidShut(sample), ["closing", "kind"], "the reader works");
    // The two it must not flag: the sentence standing outside the section, and a paragraph of the
    // section that is not the one naming them.
    const elsewhere = `${SHUT_OPENING} \`kind\`.\n${SHUT_HEADING}\n\nSomething else, \`skill\`.\n`;
    assertEquals(parseKindsSaidShut(elsewhere), [], "a sentence outside the section is not one");
    const later = `${SHUT_HEADING}\n\n${SHUT_OPENING} \`kind\`.\n\nLater, \`closing\`.\n`;
    assertEquals(
        parseKindsSaidShut(later),
        ["kind"],
        "nor is a paragraph after the one naming them",
    );
    const said = parseKindsSaidShut(Deno.readTextFileSync(REGISTER_PATH));
    assert(said.length > 0, "the document names the kinds that stay shut");
    const shut = new Set<string>();
    for (const drillCase of tallyDrillCases(readCorpus())) {
        if (drillCase.rung !== DRILL_RUNG.opened) continue;
        if (drillCase.shut === 0) continue;
        shut.add(drillCase.row);
    }
    assertEquals(
        said.filter((kind) => !shut.has(kind)),
        [],
        `${REGISTER_PATH}: a kind is said to stay shut that opens wherever the panel draws it`,
    );
    assertEquals(
        [...shut].sort().filter((kind) => !said.includes(kind)),
        [],
        `${REGISTER_PATH}: a kind stays shut and the document does not say so`,
    );
});

/**
 * The kinds the document says stay shut, read out of the one paragraph that names them, as a
 * paragraph because `deno fmt` owns where it wraps. Only a run that is a row kind is taken: the
 * paragraph cites a path and a task in backticks beside the kinds.
 */
function parseKindsSaidShut(text: string): string[] {
    let said = "";
    for (const line of parseSectionLines(text, SHUT_HEADING)) {
        if (said.length > 0) {
            if (line.length === 0) break;
        } else if (!line.startsWith(SHUT_OPENING)) continue;
        said = `${said} ${line}`;
    }
    const kinds = new Set<string>();
    for (const named of parseBackticked(said)) {
        if (isOneOf(DRILL_ROWS, named)) kinds.add(named);
    }
    return [...kinds].sort();
}

/**
 * ⚠️ **The paragraph on what stands under an announcement argues from figures.** A figure arguing a
 * point is the last one that may be left unearned, because the argument goes on reading as though
 * it were measured.
 */
Deno.test("what stands under an announcement is what the register says it is", () => {
    let dealtTotal = 0;
    let underAnnouncement = 0;
    let onSide = 0;
    let announcingOnSide = 0;
    for (const replayed of readCorpus()) {
        const { statistics } = replayed.reading.figures;
        const { roster } = replayed.reading.view;
        for (const [combatantId, figures] of statistics.byCombatantId) {
            dealtTotal += figures.damageDealt;
            for (const skill of figures.skills.values()) underAnnouncement += skill.damageDealt;
            if (roster.byId.get(combatantId)?.side !== SIDE_COUNTED) continue;
            onSide += 1;
            if (figures.skills.size > 0) announcingOnSide += 1;
        }
    }
    assert(dealtTotal > 0, "the corpus holds damage dealt to take a share of");
    assert(onSide > 0, "and combatants on the side the paragraph is about");
    const register = parseUnwrapped(Deno.readTextFileSync(REGISTER_PATH));
    const share = ((underAnnouncement / dealtTotal) * 100).toFixed(1);
    assertStringIncludes(
        register,
        `${announcingOnSide} of the ${onSide} combatants on side ${SIDE_COUNTED}`,
        `${REGISTER_PATH}: how many of them announce anything`,
    );
    assertStringIncludes(
        register,
        `${share}% of all damage dealt`,
        `${REGISTER_PATH}: the share standing under an announcement`,
    );
    assertStringIncludes(
        register,
        `${formatGrouped(underAnnouncement)} of ${formatGrouped(dealtTotal)}`,
        `${REGISTER_PATH}: the two figures that share is taken between`,
    );
});

/** The document as one line, because `deno fmt` owns where its sentences break. */
function parseUnwrapped(text: string): string {
    return text.split("\n").join(" ").split(" ").filter((word) => word.length > 0).join(" ");
}

/** A figure grouped the way the register writes one: `10,787,341`. */
function formatGrouped(figure: number): string {
    assert(Number.isSafeInteger(figure), "a figure written into prose is a whole number");
    return figure.toLocaleString("en-US");
}
