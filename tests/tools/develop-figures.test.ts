/**
 * Two figures reports held recording by recording, on texts written here. Reading `develop`'s own
 * tree is left to `deno task fight:develop`, because it runs another branch's program.
 */

import { assertEquals, AssertionError, assertStrictEquals, assertThrows } from "@std/assert";
import {
    compareFigureReports,
    formatComparison,
    indexReportSections,
} from "#/tools/develop-figures.ts";

const REPORT = [
    "material captures/",
    "",
    "=== one ===",
    "  payloads 4",
    "    Gracz 1        99",
    "",
    "=== two ===",
    "  payloads 2",
    "",
].join("\n");

Deno.test("a report is cut at its headings, above the first and trailing blanks left out", () => {
    const sections = indexReportSections(REPORT);
    assertEquals([...sections.keys()], ["one", "two"]);
    assertEquals(sections.get("one"), ["  payloads 4", "    Gracz 1        99"]);
    assertEquals(sections.get("two"), ["  payloads 2"]);
    assertStrictEquals(indexReportSections("material captures/\n").size, 0, "none is none");
    assertThrows(
        () => indexReportSections("=== one ===\n=== one ===\n"),
        AssertionError,
        "one is reported once",
    );
});

Deno.test("two alike reports agree on every recording, and differ on none", () => {
    const comparison = compareFigureReports(REPORT, REPORT);
    assertEquals(comparison.agreedNames, ["one", "two"]);
    assertEquals(comparison.differences, []);
    assertEquals(formatComparison(comparison), ["2 recordings agree, 0 differ"]);
});

Deno.test("one figure changed is one difference, at the line it stands on", () => {
    const changed = REPORT.replace("Gracz 1        99", "Gracz 1       100");
    const comparison = compareFigureReports(REPORT, changed);
    assertEquals(comparison.agreedNames, ["two"]);
    assertStrictEquals(comparison.differences.length, 1);
    assertStrictEquals(comparison.differences[0]!.name, "one");
    assertStrictEquals(comparison.differences[0]!.lineIndex, 1, "the line under the payloads");
    assertEquals(formatComparison(comparison), [
        "≠ one, line 2 of its report",
        "      payloads 4",
        "  -     Gracz 1        99",
        "  +     Gracz 1       100",
        "1 recordings agree, 1 differ",
    ]);
});

Deno.test("a report one line longer differs where the shorter one ends", () => {
    const longer = REPORT.replace("  payloads 2", "  payloads 2\n  still going");
    const difference = compareFigureReports(REPORT, longer).differences[0]!;
    assertStrictEquals(difference.name, "two");
    assertStrictEquals(difference.lineIndex, 1);
    assertEquals(formatComparison({ agreedNames: [], differences: [difference] }).slice(-3, -1), [
        "  - (develop's report ends)",
        "  +   still going",
    ]);
});

Deno.test("a recording one side reports and the other does not is a difference", () => {
    const onlyOne = REPORT.slice(0, REPORT.indexOf("=== two ==="));
    const comparison = compareFigureReports(REPORT, onlyOne);
    assertEquals(comparison.agreedNames, ["one"]);
    assertStrictEquals(comparison.differences[0]!.rewriteLines, null);
    assertEquals(formatComparison(comparison).slice(0, 2), [
        "≠ two",
        "  this branch prints no report for it",
    ]);
    const reversed = compareFigureReports(onlyOne, REPORT).differences[0]!;
    assertStrictEquals(reversed.developLines, null, "and the same held the other way round");
});

Deno.test("no recording on one side against one on the other is a difference, not agreement", () => {
    const one = "=== one ===\n  payloads 1\n";
    const none = compareFigureReports("material captures/\n", one);
    assertEquals(none.agreedNames, []);
    assertStrictEquals(none.differences.length, 1);
    const both = compareFigureReports("material captures/\n", "material captures/\n");
    assertEquals(formatComparison(both), ["0 recordings agree, 0 differ"]);
});
