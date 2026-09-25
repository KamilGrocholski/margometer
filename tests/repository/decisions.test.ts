/**
 * The decision records under `docs/adr/`: numbered from one without a gap, each titled by its own
 * number, dated, and carrying a status a record can hold. A record superseded names the one that
 * replaced it, and that one names it back, so neither half of a replacement stands alone.
 */

import { assert, assertEquals, assertExists } from "@std/assert";

interface DecisionRecord {
    number: number;
    path: string;
    title: string;
    status: string;
    date: string;
    supersedes: string | null;
}

const DECISIONS_DIRECTORY = "docs/adr/";
const NUMBER_WIDTH = 4;
const TITLE_OPENER = "# ";
const STATUS_OPENER = "- **Status:** ";
const DATE_OPENER = "- **Date:** ";
const SUPERSEDES_OPENER = "- **Supersedes:** ";
const ACCEPTED = "Accepted";
const SUPERSEDED_OPENER = "Superseded by ";
const RECORD_NAME = "ADR ";
/** How many lines a record's header runs to before its first section. */
const HEADER_LINES_MAXIMUM = 8;
const DATE_LENGTH = "2026-09-25".length;

Deno.test("decision numbering runs from one without a gap, and each title states its own", () => {
    const records = readDecisionRecords();
    assert(records.length > 0, "there are decisions to read");
    assertEquals(records.map((one) => one.number), records.map((_, index) => index + 1), "no gap");
    for (const record of records) {
        const stated = `${formatDecisionNumber(record.number)}. `;
        assert(record.title.startsWith(stated), `${record.path} is titled by its own number`);
    }
});

function readDecisionRecords(): DecisionRecord[] {
    const records: DecisionRecord[] = [];
    for (const entry of Deno.readDirSync(DECISIONS_DIRECTORY)) {
        if (!entry.isFile) continue;
        const path = DECISIONS_DIRECTORY + entry.name;
        records.push(readDecisionRecord(path, Deno.readTextFileSync(path)));
    }
    return records.sort((one, other) => one.number - other.number);
}

function readDecisionRecord(path: string, text: string): DecisionRecord {
    const name = path.slice(DECISIONS_DIRECTORY.length);
    const number = Number(name.slice(0, NUMBER_WIDTH));
    assert(Number.isSafeInteger(number), `${path} opens on its number`);
    const header = text.split("\n").slice(0, HEADER_LINES_MAXIMUM);
    const title = header[0] ?? "";
    assert(title.startsWith(TITLE_OPENER), `${path} opens on its title`);
    return {
        number,
        path,
        title: title.slice(TITLE_OPENER.length),
        status: readDecisionRecordField(path, header, STATUS_OPENER) ?? "",
        date: readDecisionRecordField(path, header, DATE_OPENER) ?? "",
        supersedes: readDecisionRecordField(path, header, SUPERSEDES_OPENER),
    };
}

function readDecisionRecordField(
    path: string,
    header: readonly string[],
    opener: string,
): string | null {
    const line = header.find((one) => one.startsWith(opener));
    if (line === undefined) return null;
    const value = line.slice(opener.length);
    assert(value.length > 0, `${path}: ${opener.trim()} states something`);
    return value;
}

function formatDecisionNumber(number: number): string {
    return String(number).padStart(NUMBER_WIDTH, "0");
}

Deno.test("every decision is dated, and carries a status a record can hold", () => {
    for (const record of readDecisionRecords()) {
        assertEquals(record.date.length, DATE_LENGTH, `${record.path} is dated as a day`);
        assert(!Number.isNaN(Date.parse(record.date)), `${record.path}: the date is one`);
        if (record.status === ACCEPTED) continue;
        assert(record.status.startsWith(SUPERSEDED_OPENER), `${record.path}: a status it can hold`);
    }
});

Deno.test("a record superseded names its replacement, and the replacement names it back", () => {
    const records = readDecisionRecords();
    const byName = new Map(records.map((one) => [formatDecisionName(one.number), one]));
    for (const record of records) {
        const name = formatDecisionName(record.number);
        if (record.status.startsWith(SUPERSEDED_OPENER)) {
            const replacing = byName.get(record.status.slice(SUPERSEDED_OPENER.length));
            assertExists(replacing, `${record.path} is superseded by a record that exists`);
            assertEquals(replacing.supersedes, name, `${replacing.path} names what it replaced`);
        }
        if (record.supersedes === null) continue;
        const replaced = byName.get(record.supersedes);
        assertExists(replaced, `${record.path} supersedes a record that exists`);
        assert(replaced !== record, `${record.path} never supersedes itself`);
        const status = `${SUPERSEDED_OPENER}${name}`;
        assertEquals(replaced.status, status, `${replaced.path} says it was replaced`);
    }
});

function formatDecisionName(number: number): string {
    return RECORD_NAME + formatDecisionNumber(number);
}
