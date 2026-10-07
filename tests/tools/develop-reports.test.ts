/**
 * Two reports held section by section, or as one text, on texts written here. Reading `develop`'s
 * own tree is left to `deno task fight:develop`, because it runs another branch's program.
 */

import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import {
    compareReportSections,
    compareWholeReports,
    formatComparison,
    indexReportSections,
    LINES_MAXIMUM,
    SECTIONS_MAXIMUM,
    selectDevelopMaterial,
} from "#/tools/develop-reports.ts";
import { DevelopReportError } from "#/tools/margometer-tool-error.ts";
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
        DevelopReportError,
        "one is reported twice",
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
    assertEquals(comparison.differences[0]!.lineIndices, [1], "the line under the payloads");
    assertEquals(formatComparison("figures", comparison), [
        "≠ one, 1 lines of its report",
        "      payloads 4",
        "  line 2",
        "  -     Gracz 1        99",
        "  +     Gracz 1       100",
        "figures: 1 agree, 1 differ",
    ]);
});

/** A line known to differ never hides the ones after it, which is what the comparison is for. */
Deno.test("every line two reports differ on is a line of the difference, not the first alone", () => {
    const status = "recordings   35\nmessages   13862\nlost   0\n";
    const twice = status.replace("35", "36").replace("lost   0", "lost   1");
    const difference = compareWholeReports("decoding", status, twice).differences[0]!;
    assertEquals(difference.lineIndices, [0, 2], "the first and the last");
    assertEquals(
        formatComparison("decoding", { agreedNames: [], differences: [difference] }).slice(1, -1),
        [
            "  line 1",
            "  - recordings   35",
            "  + recordings   36",
            "  line 3",
            "  - lost   0",
            "  + lost   1",
        ],
        "each shown with both sides",
    );
});

Deno.test("a report one line longer differs where the shorter one ends", () => {
    const longer = REPORT.replace("  payloads 2", "  payloads 2\n  still going");
    const difference = compareReportSections(REPORT, longer).differences[0]!;
    assertStrictEquals(difference.name, "two");
    assertEquals(difference.lineIndices, [1]);
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
    const oneSection = "=== one ===\n  payloads 1\n";
    const none = compareReportSections("material captures/\n", oneSection);
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
    assertEquals(changed.differences[0]!.lineIndices, [1]);
    const empty = compareWholeReports("decoding", "", status);
    assertEquals(empty.differences[0]!.lineIndices, [0, 1], "an empty report differs at once");
});

Deno.test("a recording develop never read is named apart, and the rest are compared", () => {
    const shortFight = lookupRecordedFight(SHORT);
    const otherFight = lookupRecordedFight(OTHER);
    const material = { material: "captures/", fights: [shortFight, otherFight] };
    const none = selectDevelopMaterial(material, new Set([SHORT_NAME, OTHER_NAME]));
    assertEquals(none.newer, [], "nothing admitted since is nothing named");
    assertStrictEquals(none.shared.fights.length, 2);
    const newer = selectDevelopMaterial(material, new Set([SHORT_NAME]));
    assertEquals(newer.newer, [OTHER_NAME], "one admitted since is named");
    assertEquals(newer.shared.fights, [shortFight], "and left out of what is compared");
    assertStrictEquals(newer.shared.material, "captures/", "under the material it was taken from");
});

Deno.test("a report is read up to its bound on lines, and refused one past it", () => {
    // A heading, the lines under it, and the empty line after the printer's last newline.
    const atBound = `=== one ===\n${"  payloads 1\n".repeat(LINES_MAXIMUM - 2)}`;
    assertStrictEquals(atBound.split("\n").length, LINES_MAXIMUM, "the sample sits on it");
    const sections = indexReportSections(atBound);
    assertStrictEquals(sections.get("one")?.length, LINES_MAXIMUM - 2, "every line, at the bound");
    const pastBound = `${atBound}\n`;
    const past = `a report of ${LINES_MAXIMUM + 1} lines, past the ${LINES_MAXIMUM}`;
    assertThrows(() => indexReportSections(pastBound), DevelopReportError, past);
    assertThrows(() => compareWholeReports("decoding", "", pastBound), DevelopReportError, past);
});

Deno.test("a report is read up to its bound on sections, and refused one past it", () => {
    const reporting = (count: number) =>
        Array.from({ length: count }, (_, order) => `=== r${order} ===\n  payloads 1`).join("\n");
    const atBound = indexReportSections(reporting(SECTIONS_MAXIMUM));
    assertStrictEquals(atBound.size, SECTIONS_MAXIMUM, "every section, at the bound");
    assertThrows(
        () => indexReportSections(reporting(SECTIONS_MAXIMUM + 1)),
        DevelopReportError,
        `a report of ${SECTIONS_MAXIMUM + 1} sections, past the ${SECTIONS_MAXIMUM}`,
    );
});
