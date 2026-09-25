/**
 * Two reports held section by section, or as one text, on texts written here. Reading `develop`'s
 * own tree is left to `deno task fight:develop`, because it runs another branch's program.
 */

import { assertEquals, AssertionError, assertStrictEquals, assertThrows } from "@std/assert";
import {
    compareReportSections,
    compareWholeReports,
    formatComparison,
    indexReportSections,
} from "#/tools/develop-reports.ts";

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
    const comparison = compareReportSections(REPORT, REPORT);
    assertEquals(comparison.agreedNames, ["one", "two"]);
    assertEquals(comparison.differences, []);
    assertEquals(formatComparison("figures", comparison), ["figures: 2 agree, 0 differ"]);
});

Deno.test("one figure changed is one difference, at the line it stands on", () => {
    const changed = REPORT.replace("Gracz 1        99", "Gracz 1       100");
    const comparison = compareReportSections(REPORT, changed);
    assertEquals(comparison.agreedNames, ["two"]);
    assertStrictEquals(comparison.differences.length, 1);
    assertStrictEquals(comparison.differences[0]!.name, "one");
    assertStrictEquals(comparison.differences[0]!.lineIndex, 1, "the line under the payloads");
    assertEquals(formatComparison("figures", comparison), [
        "≠ one, line 2 of its report",
        "      payloads 4",
        "  -     Gracz 1        99",
        "  +     Gracz 1       100",
        "figures: 1 agree, 1 differ",
    ]);
});

Deno.test("a report one line longer differs where the shorter one ends", () => {
    const longer = REPORT.replace("  payloads 2", "  payloads 2\n  still going");
    const difference = compareReportSections(REPORT, longer).differences[0]!;
    assertStrictEquals(difference.name, "two");
    assertStrictEquals(difference.lineIndex, 1);
    const shown = formatComparison("figures", { agreedNames: [], differences: [difference] });
    assertEquals(shown.slice(-3, -1), ["  - (develop's report ends)", "  +   still going"]);
});

Deno.test("a recording one side reports and the other does not is a difference", () => {
    const onlyOne = REPORT.slice(0, REPORT.indexOf("=== two ==="));
    const comparison = compareReportSections(REPORT, onlyOne);
    assertEquals(comparison.agreedNames, ["one"]);
    assertStrictEquals(comparison.differences[0]!.rewriteLines, null);
    assertEquals(formatComparison("figures", comparison).slice(0, 2), [
        "≠ two",
        "  this branch prints nothing for it",
    ]);
    const reversed = compareReportSections(onlyOne, REPORT).differences[0]!;
    assertStrictEquals(reversed.developLines, null, "and the same held the other way round");
});

Deno.test("no recording on one side against one on the other is a difference, not agreement", () => {
    const one = "=== one ===\n  payloads 1\n";
    const none = compareReportSections("material captures/\n", one);
    assertEquals(none.agreedNames, []);
    assertStrictEquals(none.differences.length, 1);
    const both = compareReportSections("material captures/\n", "material captures/\n");
    assertEquals(formatComparison("figures", both), ["figures: 0 agree, 0 differ"]);
});

Deno.test("a whole report is one section, its trailing blanks aside", () => {
    const status = "recordings   35\nmessages   13862\n\n";
    const agreed = compareWholeReports("decoding", status, "recordings   35\nmessages   13862\n");
    assertEquals(agreed.agreedNames, ["decoding"], "a printer's last newline is not a line");
    const changed = compareWholeReports("decoding", status, status.replace("13862", "13861"));
    assertStrictEquals(changed.differences[0]!.name, "decoding");
    assertStrictEquals(changed.differences[0]!.lineIndex, 1);
    const empty = compareWholeReports("decoding", "", status);
    assertStrictEquals(empty.differences[0]!.lineIndex, 0, "an empty report differs at once");
});
