/**
 * The drill register, held against the panel both ways.
 *
 * A guard that only refused a case the document does not name would stay green while the document
 * grew rows nothing draws; one that only refused an unnamed row would stay green while the panel
 * stopped drawing half of them. So the two lists are compared as sets, and each reader is proved
 * by a sample it must flag and a sample it must not.
 */

import { assert, assertEquals } from "@std/assert";
import { composeFakeDocument, type FakeElement, getElementsWithin } from "@/tests/fake-document.ts";
import { composePanelHost } from "@/src/ui/panel-element.ts";
import { composePanelReading, NOTHING_MISSED } from "@/src/ui/panel-reading.ts";
import {
    composeCaseReport,
    composeDrillCases,
    composeDrillReport,
    DRILL_ROWS,
    DRILL_RUNGS,
    DRILL_VERDICTS,
} from "@/tools/drill-report.ts";
import { composeFightReplay, composeReplayedMaterial } from "@/tools/fight-replay.ts";
import { getRecordedFightAt } from "@/tools/recorded-fights.ts";
import { SCREEN_ORDER } from "@/src/ui/panel-screen.ts";

const REGISTER_PATH = "docs/drill-levels.md";
const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

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

function getCellsFromLine(line: string): string[] {
    const cells: string[] = [];
    let at = line.indexOf("|");
    assert(at >= 0, "a table line opens with a bar");
    let next = line.indexOf("|", at + 1);
    // The bound is the line's own length: a table row holds fewer cells than it holds characters.
    for (let held = 0; held < line.length; held += 1) {
        if (next === -1) break;
        cells.push(line.slice(at + 1, next).trim());
        at = next;
        next = line.indexOf("|", at + 1);
    }
    return cells;
}

/** The backticks are the document's, not the vocabulary's, so they come off before comparing. */
function getBareCell(cell: string): string {
    const open = cell.indexOf("`");
    if (open === -1) return cell;
    const close = cell.indexOf("`", open + 1);
    if (close === -1) return cell;
    return cell.slice(open + 1, close);
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
        assert(SCREEN_ORDER.includes(one.screen), `${one.screen} is a screen the strips draw`);
        assert(DRILL_RUNGS.includes(one.rung), `${one.rung} is a level the panel has`);
        assert(DRILL_ROWS.includes(one.row), `${one.row} is a kind of row the panel draws`);
        assert(DRILL_VERDICTS.includes(one.verdict), `${one.verdict} is a verdict`);
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
            NOTHING_MISSED,
        );
        const document = composeFakeDocument();
        const panel = composePanelHost(document, () => {}, () => {});
        panel.show({
            reading,
            current: screen,
            side: "everyone" as const,
            hasReaderSide: false,
            shelf: [],
            isOnShelf: false,
            storage: "local" as const,
            shelfWarnings: [],
            drill: null,
            pair: null,
            skill: null,
            place: null,
            isCollapsed: false,
        });
        const drawn = getElementsWithin(panel.element as FakeElement)
            .filter((one) => one.className.split(" ")[0] === "row");
        const opening = drawn.filter((one) => one.attributes.get("data-row") !== undefined);
        assert(drawn.length > 0, `${screen}: the ranking drew rows`);
        assertEquals(opening.length, reading.rows.length, `${screen}: every combatant row opens`);
        // And the mark and the cursor agree: a row marked `leaf` that carried `data-row` would
        // open under a cursor saying it does not, which is the panel saying two things at once.
        for (const row of drawn) {
            const opens = row.attributes.get("data-row") !== undefined;
            assertEquals(
                row.className.includes("drillable"),
                opens,
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
    const lines = composeDrillReport(replay, ["healthGiven"]);
    assert(
        lines.includes("=== 2026-08-06-tempest-grupa-vs-hildur-1785244275300-none ==="),
        "named for its file",
    );
    assert(lines.includes("  --- healthGiven ---"), "and for the screen it walked");
    assert(lines.some((line) => line.includes("person  opens")), "some rows of it open");
    assert(lines.some((line) => line.includes("person  leaf")), "and some do not");
    assert(
        !lines.some((line) => line.includes("--- damageDealtApplied ---")),
        "a screen nobody asked for is not walked",
    );
});
