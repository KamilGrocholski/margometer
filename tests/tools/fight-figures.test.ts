/**
 * The figures report, over a recording and over cuts handed to it. That it prints what `develop`
 * prints is `deno task fight:develop`'s to show; these hold what the text says on its own.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { indexCombatantRoster } from "#/src/core/combatant-roster.ts";
import {
    formatCutText,
    formatFigureReport,
    formatRecordedFigures,
    formatRecordingName,
} from "#/tools/fight-figures.ts";
import { RecordingReadError } from "#/tools/margometer-tool-error.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";

/** Four calls, one fighter against three boars, and an outcome: the shortest there is to read. */
const SHORT = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";

Deno.test("a recording's report is headed by it and says what the reading could not do", () => {
    const lines = formatFigureReport(lookupRecordedFight(SHORT));
    assertStrictEquals(lines[0], "", "a report opens on a blank line, as develop's does");
    assertStrictEquals(lines[1], "=== 2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none ===");
    assertStrictEquals(lines[2], "  payloads 4   reader's side 1   over");
    assert(lines.includes("  —— side 1 (1) ——"), "the reader's side is stated with its count");
    assert(lines.includes("  —— side 2 (3) ——"), "and so is the other");
    assert(lines.includes("    unread, key unknown          0"), "a count of none is printed");
    assert(lines.includes("    messages lost                0"), "and so is what never arrived");
    assertEquals(lines.slice(-3), [
        "  —— how it ended ——",
        "    won:  Gracz 1",
        "    lost: Odyniec, Odyniec, Locha",
    ], "and it ends on who won and who lost, by name");
});

Deno.test("an empty cut says so, and a cut is written largest first, ties by key", () => {
    assertStrictEquals(formatCutText(new Map(), null), "—", "an empty cut is not a missing line");
    const cut = new Map([["fire", 5], ["cold", 5], ["dmg", 9]]);
    assertStrictEquals(formatCutText(cut, null), "dmg 9  cold 5  fire 5");
    assertStrictEquals(formatCutText(new Map([["dmg", 1]]), null), "dmg 1", "one part is one");
});

Deno.test("an id in a cut is named through the roster, and a key that is no id is not", () => {
    const roster = indexCombatantRoster([
        { id: 7, name: "Odyniec", side: 2, profession: "", level: 1, healthMaximum: 10 },
    ]);
    const cut = new Map([["7", 3], ["dmg", 2], ["8", 1]]);
    assertStrictEquals(
        formatCutText(cut, roster),
        "Odyniec 3  dmg 2  8 1",
        "an id the roster holds is its name, and one it does not stays the id",
    );
    assertStrictEquals(formatCutText(cut, null), "7 3  dmg 2  8 1", "and no roster asks none");
});

Deno.test("a heading is the file's name without its directory or suffix", () => {
    assertStrictEquals(formatRecordingName("captures/one-fight.json"), "one-fight");
    assertStrictEquals(formatRecordingName("one-fight.json"), "one-fight");
    assertStrictEquals(formatRecordingName("captures/notes.txt"), "notes.txt");
});

Deno.test("a path that is no recording is refused by name, and one that is, is reported", () => {
    const error = assertThrows(
        () => formatRecordedFigures(["captures/no-such-fight.json"]),
        RecordingReadError,
    );
    assertStrictEquals(error.name, "MargoMeterTool/RecordingRead");
    const text = formatRecordedFigures([SHORT]);
    assert(text.startsWith(`material ${SHORT}\n\n=== `), "the material is the path it was handed");
    assertStrictEquals(text.split("\n=== ").length, 2, "and one recording is one report");
});
