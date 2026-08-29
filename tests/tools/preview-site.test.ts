/**
 * The published site, composed and read back without writing a file.
 *
 * What matters here is everything a page cannot ask a process for: its addresses are relative,
 * its picker navigates rather than fetches, and nothing in it reconnects to a route that is not
 * there. Each of those is silent when it is wrong — a page that loads cleanly and shows nothing.
 */

import { assert, assertEquals } from "@std/assert";
import { composePreviewSitePages } from "@/tools/preview-site.ts";
import { getNewestRecordedFight, getRecordedFights } from "@/tools/recorded-fights.ts";

Deno.test("there is a page for every recording, and one a visitor lands on", () => {
    const pages = composePreviewSitePages();
    const fights = getRecordedFights();
    const names = pages.map((page) => page.name);
    assertEquals(names.length, fights.length + 1, "a page each, plus the landing");
    assert(names.includes("index.html"), "which is the name a host serves a directory by");
    for (const fight of fights) {
        assert(names.includes(`${fight.name}.html`), `${fight.name} has a page of its own`);
    }
});

Deno.test("the page a visitor lands on is the newest fight, finished", () => {
    const pages = composePreviewSitePages();
    const landing = pages.find((page) => page.name === "index.html");
    assert(landing !== undefined, "there is a landing page");
    const newest = getNewestRecordedFight(getRecordedFights());
    assert(landing.text.includes(newest.name), "and it draws the newest recording");
    assert(
        landing.text.includes(`"entryIndex":${newest.calls.length}`),
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
    assert(landing !== undefined, "there is a page to read");
    assert(landing.text.includes(`lang="pl"`), "the document says which language it is in");
    assert(landing.text.includes("od początku"), "and the strip is written in it");
    assert(landing.text.includes("licznik obrażeń"), "with a sentence for a reader who arrived");
    assert(!landing.text.includes("build ok"), "and no claim about a build nobody ran");
});
