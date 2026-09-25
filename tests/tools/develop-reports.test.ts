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
    selectDevelopMaterial,
} from "#/tools/develop-reports.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";

const SHORT_NAME = "2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none";
const SHORT = `captures/${SHORT_NAME}.json`;
const OTHER_NAME = "2026-08-11-tempest-tancerz-vs-wermont-1786441768914-none";
const OTHER = `captures/${OTHER_NAME}.json`;

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

Deno.test("a recording develop never read is named apart, and the rest are compared", () => {
    const one = lookupRecordedFight(SHORT);
    const other = lookupRecordedFight(OTHER);
    const material = { material: "captures/", fights: [one, other] };
    const none = selectDevelopMaterial(material, new Set([SHORT_NAME, OTHER_NAME]));
    assertEquals(none.newer, [], "nothing admitted since is nothing named");
    assertStrictEquals(none.shared.fights.length, 2);
    const newer = selectDevelopMaterial(material, new Set([SHORT_NAME]));
    assertEquals(newer.newer, [OTHER_NAME], "one admitted since is named");
    assertEquals(newer.shared.fights, [one], "and left out of what is compared");
    assertStrictEquals(newer.shared.material, "captures/", "under the material it was taken from");
});
