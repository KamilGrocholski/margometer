/**
 * The panel, as a directory of files somebody else can open.
 *
 * `deno task preview` answers the same question for whoever has this repository checked out; this
 * answers it for whoever has not, so the panel can be looked at without installing a userscript
 * into a game that has not authorised one. Nothing written here is ever committed: the pages carry
 * a recording's calls inlined, which is how the replay stays synchronous, and the output goes
 * under `dist/`, which git does not carry. `NOTICE.md` says what a published page holds.
 */

import { assert, assertEquals } from "@std/assert";
import { getVersionForRun } from "@/tools/declared-version.ts";
import { composeUserscriptFiles, USERSCRIPT_NAME } from "@/tools/build-userscript.ts";
import {
    composePreviewPage,
    PREVIEW_GAME_SCRIPT_NAME,
    type PreviewFightLink,
    type PreviewWords,
} from "@/tools/preview-page.ts";
import {
    getPreviewRecordedFight,
    getRecordedFights,
    type RecordedFight,
} from "@/tools/recorded-fights.ts";

const OUTPUT_DIRECTORY = "dist/preview";
const HOMEPAGE = "https://github.com/KamilGrocholski/margometer";

/**
 * Polish here, English in `tools/preview-server.ts`, over the same page: **L2** puts the text a
 * player reads in Polish, and a published page is read by players.
 */
const PREVIEW_SITE_WORDS: PreviewWords = {
    language: "pl",
    title: "MargoMeter — podgląd",
    placeName: "Podgląd",
    start: "od początku",
    backHint: "Odtwarza walkę do poprzedniego wpisu",
    end: "do końca",
    play: "odtwórz",
    pause: "pauza",
    entry: "wpis",
};

/**
 * Three things and no more: that this is a recording rather than a live game, that everything is
 * counted in the reader's own browser, and where the add-on itself is. A visitor who does not know
 * the first would read the panel as a live connection to somebody's account, which is the one
 * misunderstanding this page could cause.
 */
const PREVIEW_SITE_INTRODUCTION = [
    "<strong>MargoMeter</strong> to licznik obrażeń do Margonem.",
    "Poniżej odtwarzana jest nagrana walka — panel liczy ją w tej przeglądarce,",
    "tak samo jak liczyłby ją w grze. Nic nie łączy się tu z grą, nic nie jest wysyłane",
    "i nic tu nie zostaje.",
    `<a href="${HOMEPAGE}">kod źródłowy</a>`,
    "·",
    `<a href="${HOMEPAGE}/releases/latest">instalacja</a>`,
].join(" ");

/** What a browser is handed, before anything writes it down. */
export interface PreviewSiteFile {
    name: string;
    text: string;
}

function composeFightPageName(name: string): string {
    assert(name.length > 0, "a page is filed under the fight it draws");
    assert(!name.endsWith(".html"), "and gains the suffix here rather than carrying one");
    return `${name}.html`;
}

/**
 * Relative, which is the whole of what a published page cannot get wrong twice: a host serves a
 * project under a path of its own, so an address beginning at the domain root asks for a file
 * belonging to no project — and the same page then opens from disk and from a server as well.
 */
function composeFightAddress(name: string): string {
    const address = `./${encodeURIComponent(composeFightPageName(name))}`;
    assert(address.startsWith("./"), "nothing here is addressed from a domain root");
    return address;
}

function composeFightLinks(fights: readonly RecordedFight[]): PreviewFightLink[] {
    assert(fights.length > 0, "there is something to offer");
    // No process here, so there is nowhere to fetch a fight from and a pick stays a navigation.
    // The calls a page has are its own, inlined in it.
    const links = fights.map((fight) => ({
        name: fight.name,
        address: composeFightAddress(fight.name),
        callsAddress: null,
    }));
    assert(links.every((link) => link.callsAddress === null), "and nothing to ask for one from");
    return links;
}

function composePageOfFight(fight: RecordedFight, links: readonly PreviewFightLink[]): string {
    assert(fight.calls.length > 0, "a page is written for a fight there is something to play");
    assert(links.length > 0, "and every other fight is offered beside it");
    return composePreviewPage({
        fightName: fight.name,
        // The finished fight, where a server opens on nothing: a visitor's first sight should be
        // the thing the add-on is for. The empty panel is a state worth looking at and
        // `od początku` reaches it, which is why that button exists.
        entryIndex: fight.calls.length,
        calls: fight.calls,
        fights: links,
        scriptDirectory: "./",
        words: PREVIEW_SITE_WORDS,
        introduction: PREVIEW_SITE_INTRODUCTION,
        // No process behind these pages, so nothing to listen to.
        appendedScript: null,
    });
}

/** Every page of the site, which needs no bundle and therefore touches nothing. */
export function composePreviewSitePages(): PreviewSiteFile[] {
    const fights = getRecordedFights();
    const links = composeFightLinks(fights);
    const landing = getPreviewRecordedFight(fights);
    const pages: PreviewSiteFile[] = [
        { name: "index.html", text: composePageOfFight(landing, links) },
    ];
    for (const fight of fights) {
        pages.push({
            name: composeFightPageName(fight.name),
            text: composePageOfFight(fight, links),
        });
    }
    assertEquals(pages.length, fights.length + 1, "a page each, and the one a visitor lands on");
    assertEquals(new Set(pages.map((page) => page.name)).size, pages.length, "each filed once");
    return pages;
}

/**
 * The pages, plus the two scripts they name. The decoy is a real file here where a server answers
 * it with a 404: only its `src` attribute is ever read, but a host that answers a miss with its
 * own HTML turns the tag into a syntax error in every visitor's console — on a page whose whole
 * purpose is to look like nothing is wrong.
 */
export async function composePreviewSiteFiles(version: string): Promise<PreviewSiteFile[]> {
    assert(version.length > 0, "a published page states the version it draws");
    const bundle = await composeUserscriptFiles(
        version,
        `${OUTPUT_DIRECTORY}/${USERSCRIPT_NAME}`,
    );
    assert(bundle.script.length > 0, "the pages carry the add-on they are a preview of");
    const files = [
        ...composePreviewSitePages(),
        { name: USERSCRIPT_NAME, text: bundle.script },
        {
            name: PREVIEW_GAME_SCRIPT_NAME,
            text: "// Nothing reads this file. Its name carries the build id the page states.\n",
        },
    ];
    assert(files.length > 2, "and the two scripts every page names");
    return files;
}

async function writePreviewSiteFiles(version: string): Promise<string> {
    const files = await composePreviewSiteFiles(version);
    await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });
    for (const file of files) {
        await Deno.writeTextFile(`${OUTPUT_DIRECTORY}/${file.name}`, file.text);
    }
    assert(files.length > 0, "a site that was written has something in it");
    console.log(`${OUTPUT_DIRECTORY}, ${files.length} files`);
    return OUTPUT_DIRECTORY;
}

if (import.meta.main) {
    const written = await writePreviewSiteFiles(getVersionForRun(Deno.args));
    console.log(`serve that directory, or let .github/workflows/pages.yml publish it`);
    console.log(`opened from disk it works too: ${written}/index.html`);
}
