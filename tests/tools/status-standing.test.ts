/**
 * The status register, held against the recordings both ways.
 *
 * A guard that only refused a row the tree does not produce would stay green while the document
 * kept rows for bits nothing sets any more; one that only refused an unnamed bit would stay green
 * while every figure in it went stale. So the two lists are compared as sets, and the reader is
 * proved by a sample it must flag and a sample it must not.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { composeStatusCases, NAMING_OUTCOMES, type StatusCase } from "@/tools/status-standing.ts";
import { composeReplayedMaterial } from "@/tools/fight-replay.ts";
import { STATUS_KEYS } from "@/src/core/combatant-status.ts";

const REGISTER_PATH = "docs/statuses-standing.md";
/** The recording the document names for the length one status reached, and for the tenth bit. */
const SLOWED = "2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
const TENTH_BIT = "2026-08-25-luvia-grupa-vs-draugr-none-none.json";

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
 * The register's own table and no other in the file, read by the heading it sits under: the
 * document carries a second table and a reader taking that one would compare the wrong rows.
 */
export function getRegisterKeys(text: string): string[] {
    const found: string[] = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith("## The register")) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside) continue;
        if (!line.startsWith("| ")) continue;
        const cells = getCellsFromLine(line).map(getBareCell);
        if (cells.length !== 8) continue;
        const [bit] = cells;
        if (bit === undefined) continue;
        if (bit.length === 0) continue;
        if (Number.isNaN(Number(bit))) continue;
        found.push(cells.join(" | "));
    }
    return found;
}

/** The same line off the tree rather than off the document, so the two compare as sets. */
function composeMeasuredKey(one: StatusCase): string {
    const stated = one.turnsStated.length === 0 ? "—" : one.turnsStated.join("/");
    return [
        `${one.bit}`,
        one.key ?? "—",
        `${one.episodes}`,
        `${one.closed}`,
        `${one.turnsLongest}`,
        `${one.namingBySkill.one}`,
        `${one.namingByKey.one}`,
        stated,
    ].join(" | ");
}

function getMeasuredKeys(): string[] {
    return composeStatusCases(composeReplayedMaterial([]).replays).map(composeMeasuredKey);
}

Deno.test("the register reader finds a row of the register and nothing else", () => {
    const sample = [
        "## The register",
        "| bit | status | episodes | closed | longest | by skill | by key | stated |",
        "| --: | ------ | -------: | -----: | ------: | -------: | -----: | ------ |",
        "|   5 | `swow_down` | 130 | 66 | 52 | 33 | 3 | 2/8 |",
        "## Who set it",
        "|   9 | `never` | 1 | 1 | 1 | 1 | 1 | — |",
    ].join("\n");
    assertEquals(
        getRegisterKeys(sample),
        ["5 | swow_down | 130 | 66 | 52 | 33 | 3 | 2/8"],
        "the row under the register's own heading, with the backticks off",
    );
    // Both ways: a reader taking the second table would compare a row nobody measured.
    assert(!getRegisterKeys(sample).some((one) => one.includes("never")), "and no row past it");
});

Deno.test("every row of the register is one the recordings produce, and the reverse", () => {
    const written = getRegisterKeys(Deno.readTextFileSync(REGISTER_PATH));
    const measured = getMeasuredKeys();
    assert(written.length > 0, "the register names something, or this guard checks nothing");
    assertEquals(
        written.filter((one) => !measured.includes(one)),
        [],
        "a row the register states and the recordings do not produce",
    );
    assertEquals(
        measured.filter((one) => !written.includes(one)),
        [],
        "and a row the recordings produce that the register never states",
    );
});

Deno.test("the register names the two recordings its own sentences stand on", () => {
    const text = Deno.readTextFileSync(REGISTER_PATH);
    assertStringIncludes(text, SLOWED, "the fight the length of one status is quoted from");
    assertStringIncludes(text, TENTH_BIT, "and the one the tenth bit was found in");
});

/**
 * ⚠️ **A bit nothing sets has no row, and that is the claim.** A row for one would be a figure
 * about material this repository does not hold — so the two the corpus never states are named in
 * prose and nowhere in the table.
 */
Deno.test("a status the corpus never states is named in prose and never as a row", () => {
    const text = Deno.readTextFileSync(REGISTER_PATH);
    const measured = new Set(
        composeStatusCases(composeReplayedMaterial([]).replays).map((one) => one.key),
    );
    const absent = STATUS_KEYS.filter((key) => !measured.has(key));
    assert(absent.length > 0, "the corpus leaves a status unstated, or this guard checks nothing");
    for (const key of absent) {
        assertStringIncludes(text, key, "a status the corpus never states is still accounted for");
        assert(
            !getRegisterKeys(text).some((row) => row.includes(`| ${key} |`)),
            `${key} stands in prose and never as a row`,
        );
    }
});

Deno.test("an outcome the tool counts is one of the three it states", () => {
    assertEquals([...NAMING_OUTCOMES], ["one", "none", "several"], "and there are three of them");
    for (const one of composeStatusCases(composeReplayedMaterial([]).replays)) {
        const bySkill = NAMING_OUTCOMES.reduce((sum, at) => sum + one.namingBySkill[at], 0);
        const byKey = NAMING_OUTCOMES.reduce((sum, at) => sum + one.namingByKey[at], 0);
        assertEquals(bySkill, one.episodes, `${one.bit}: every episode was asked, by skill`);
        assertEquals(byKey, one.episodes, `${one.bit}: and every one of them by key`);
    }
});
