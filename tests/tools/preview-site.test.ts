/**
 * The published site, composed and read back without writing a file.
 *
 * What matters here is everything a page cannot ask a process for: its addresses are relative,
 * its picker navigates rather than fetches, and nothing in it reconnects to a route that is not
 * there. Each of those is silent when it is wrong — a page that loads cleanly and shows nothing.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertExists,
    assertStringIncludes,
} from "@std/assert";
import { composePreviewSitePages } from "@/tools/preview-site.ts";
import { getPreviewRecordedFight, getRecordedFights } from "@/tools/recorded-fights.ts";

Deno.test("there is a page for every recording, and one a visitor lands on", () => {
    const pages = composePreviewSitePages();
    const fights = getRecordedFights();
    const names = pages.map((page) => page.name);
    assertEquals(names.length, fights.length + 1, "a page each, plus the landing");
    assertArrayIncludes(names, ["index.html"], "which is the name a host serves a directory by");
    for (const fight of fights) {
        assertArrayIncludes(names, [`${fight.name}.html`], `${fight.name} has a page of its own`);
    }
});

Deno.test("the page a visitor lands on is the fight every preview opens on, finished", () => {
    const pages = composePreviewSitePages();
    const landing = pages.find((page) => page.name === "index.html");
    assertExists(landing, "there is a landing page");
    const opened = getPreviewRecordedFight(getRecordedFights());
    assertStringIncludes(
        landing.text,
        opened.name,
        "and it draws the recording the tools all name",
    );
    assertEquals(
        landing.text,
        pages.find((page) => page.name === `${opened.name}.html`)?.text,
        "which is the same page under its own name, so a visitor lands where a link points",
    );
    assert(
        landing.text.includes(`"entryIndex":${opened.calls.length}`),
        "opened at the end of it, which is the thing the add-on is for",
    );
});

Deno.test("nothing on a published page asks a domain root, or a process, for anything", () => {
    const pages = composePreviewSitePages();
    assert(pages.length > 1, "there are pages to read");
    const rooted: string[] = [];
    const streaming: string[] = [];
    const fetching: string[] = [];
    for (const page of pages) {
        if (page.text.includes(`src="/`)) rooted.push(page.name);
        if (page.text.includes("EventSource")) streaming.push(page.name);
        if (!page.text.includes(`"callsAddress":null`)) fetching.push(page.name);
    }
    assertEquals(rooted, [], "an absolute address asks for a file belonging to no project");
    assertEquals(streaming, [], "a page nobody rebuilds reconnects to nothing, twice a second");
    assertEquals(fetching, [], "and a pick here is the navigation it always was");
});

Deno.test("a published page speaks to a player, in the language a player reads", () => {
    const pages = composePreviewSitePages();
    const landing = pages[0];
    assertExists(landing, "there is a page to read");
    assertStringIncludes(landing.text, `lang="pl"`, "the document says which language it is in");
    assertStringIncludes(landing.text, "od początku", "and the strip is written in it");
    assertStringIncludes(
        landing.text,
        "licznik obrażeń",
        "with a sentence for a reader who arrived",
    );
    assert(!landing.text.includes("build ok"), "and no claim about a build nobody ran");
});
