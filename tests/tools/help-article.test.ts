/**
 * The published help, turned into text and searched.
 *
 * Every sample here is invented: the help is the operator's own writing and none of its
 * sentences enter this repository (NOTICE.md). What the frozen table is held to is its own
 * shape and the article it names — the counts themselves are a measurement, not a fixture.
 */

import { assert, assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import { FROZEN_HELP_PHRASES } from "@/frozen/help-phrases.ts";
import {
    CACHE_ROOT,
    composeAgeText,
    FROZEN_HELP_BANNER,
    getFragments,
    getOccurrenceCount,
    getPhraseCounts,
    getTextFromHtml,
    MECHANICS_ARTICLE,
    requireArticleId,
    requireCachedHelpArticle,
} from "@/tools/help-article.ts";
import { HelpArticleError } from "@/tools/margometer-tool-error.ts";

const READ_AT = "2026-08-09T12:00:00.000Z";
const READ_AT_MILLISECONDS = Date.parse(READ_AT);
const MILLISECONDS_PER_DAY = 86_400_000;

Deno.test("what a browser reads as machinery never reaches the search", () => {
    // Strip the tags before the script bodies and the page's own code stays in the result, where
    // a search hits it and reports machinery as documentation.
    const text = getTextFromHtml("<p>Blok</p><script>var evade = 1;</script><p>Unik</p>");
    assertEquals(text, "Blok Unik", "the script's body came out with its tag");
    assert(!text.includes("evade"), "and took the name inside it along");
    assertEquals(getTextFromHtml("<style>a{b:c}</style><p>1 &lt; 2</p>"), "1 < 2", "style too");
});

Deno.test("an entity is unescaped as many times as the page escaped it", () => {
    // Each pass runs over what the one before produced, so `&amp;lt;` reaches `<`. One pass over
    // the original stops at `&lt;`, which is a different answer to the same input.
    assertEquals(getTextFromHtml("<p>a &amp;lt; b</p>"), "a < b", "twice-escaped comes out once");
    assertEquals(getTextFromHtml("<p>a&nbsp;b</p>"), "a b", "and a space that was not one");
});

Deno.test("two hits inside one window read as one fragment, and two far apart as two", () => {
    const near = `${"a".repeat(50)}NEEDLE${"b".repeat(10)}NEEDLE${"c".repeat(50)}`;
    assertEquals(getFragments(near, "needle", 90, 6).length, 1, "one window, one slice");
    assertEquals(getOccurrenceCount(near, "needle"), 2, "though the count still says two");

    // Keying a repeat on the fragment's first characters collapses two hits preceded by the same
    // content — a table, a repeated heading — and the hit from elsewhere vanishes silently.
    const block = `${"x".repeat(40)}NEEDLE${"y".repeat(40)}`;
    const far = `${block}${"z".repeat(500)}${block}`;
    const fragments = getFragments(far, "needle", 90, 6);
    assertEquals(fragments.length, 2, "identical surroundings are not the same hit");
    assertEquals(fragments[0]?.slice(0, 60), fragments[1]?.slice(0, 60) ?? "", "identical, kept");
});

Deno.test("a search states what it will not do", () => {
    const text = Array.from({ length: 5 }, () => `NEEDLE${"q".repeat(400)}`).join("");
    assertEquals(getFragments(text, "needle", 100, 3).length, 3, "no more than asked for");
    assertEquals(getFragments(text, "absent", 100, 3), [], "and nothing where there is nothing");
    assertThrows(() => getFragments(text, "", 100, 3), HelpArticleError, "empty phrase");
});

Deno.test("a dump says how old it is, and says it loudly once it is worth re-fetching", () => {
    assertEquals(composeAgeText(READ_AT, READ_AT_MILLISECONDS), "read 2026-08-09 12:00 UTC, today");
    assertEquals(
        composeAgeText(READ_AT, READ_AT_MILLISECONDS + MILLISECONDS_PER_DAY),
        "read 2026-08-09 12:00 UTC, yesterday",
        "the day after",
    );
    const week = composeAgeText(READ_AT, READ_AT_MILLISECONDS + 7 * MILLISECONDS_PER_DAY);
    assertStringIncludes(week, "7 days ago", "a week is stated in days");
    assertStringIncludes(week, "re-fetch", "and is the point at which the tool says so");
    const day = composeAgeText(READ_AT, READ_AT_MILLISECONDS + 6 * MILLISECONDS_PER_DAY);
    assert(!day.includes("re-fetch"), "the day before it is not");
    assert(composeAgeText("not a date", READ_AT_MILLISECONDS).includes("stale"), "nor is a guess");
});

Deno.test("an article this cannot date is an article it will not answer from", () => {
    const whole = {
        article: "372",
        url: "https://pomoc.margonem.pl/index/view,372",
        fetchedAt: READ_AT,
        textPath: ".cache/help/372/text.txt",
        textLength: 400132,
    };
    assertEquals(requireCachedHelpArticle(whole, "372").textLength, 400132, "a whole manifest");
    const { fetchedAt: _dropped, ...truncated } = whole;
    assertThrows(() => requireCachedHelpArticle(truncated, "372"), HelpArticleError);
    assertThrows(
        () => requireCachedHelpArticle({ ...whole, article: "9" }, "372"),
        HelpArticleError,
    );
    assertThrows(() => requireArticleId("mechanika"), HelpArticleError, "not a number");
    assertEquals(requireArticleId("372"), "372", "and one that is");
});

Deno.test("counts are deduplicated and sorted, so a re-freeze shows real change only", () => {
    const counts = getPhraseCounts("blok blok crit", ["crit", "blok", "crit"]);
    assertEquals(counts, [["blok", 2], ["crit", 1]], "asked twice, counted once, in order");
    assertEquals(getPhraseCounts("blok", ["absent"]), [["absent", 0]], "a zero is an answer");
});

Deno.test("the frozen counts name the article they were taken from", () => {
    assertEquals(FROZEN_HELP_PHRASES.article, MECHANICS_ARTICLE, "the one this tool reads");
    assert(FROZEN_HELP_PHRASES.fetchedAt.length > 0, "and the dump they were taken from");
    assert(Object.keys(FROZEN_HELP_PHRASES.counts).length > 0, "there are counts in the table");
    assert(CACHE_ROOT.startsWith(".cache/"), "the dump itself stays where nothing publishes it");
});

/**
 * The frozen counts against the generator that writes them, the same way the key table is held.
 * A regeneration needs the cached dump and CI has none; the banner needs nothing.
 */
Deno.test("the frozen phrases stand under the banner their generator writes", () => {
    const frozen = Deno.readTextFileSync("frozen/help-phrases.ts");
    assert(FROZEN_HELP_BANNER.length > 0, "the generator states a banner");
    assert(
        frozen.startsWith(FROZEN_HELP_BANNER),
        "frozen/help-phrases.ts was written by an older version of its generator",
    );
});
