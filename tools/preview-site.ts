/**
 * The panel as one page somebody without this repository can open: the preview GitHub Pages
 * publishes. The page is `tests/e2e/game-page.ts`, the one the browser suite drives and
 * `deno task preview` serves, over one recording, with a band offering the add-on and a strip
 * stepping the fight, both in Polish because a player reads them (L2). The output goes under
 * `dist/preview/`, which git does not carry; the page inlines a recording's calls.
 *
 *     deno task preview:site [--release]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { STORE_KEY } from "#/src/game/browser-store.ts";
import { PLACE, SPACE_PIXELS, STANDING } from "#/src/ui/panel-look.ts";
import { composePanelPage, GAME_SCRIPT_NAME } from "#/tests/e2e/game-page.ts";
import { lookupRecordedFight, type RecordedFight } from "#/tests/recorded-fights.ts";
import {
    parseDeclaredVersion,
    readDevelopmentVersion,
    readUserscriptFiles,
    USERSCRIPT_DOWNLOAD_ADDRESS,
    USERSCRIPT_NAME,
} from "./build-userscript.ts";

/** What a browser is handed, before anything writes it down. */
export interface PreviewSiteFile {
    name: string;
    text: string;
}

/** The fight `develop`'s published page opened on, so the page a visitor knows stays the page. */
export const LANDING_RECORDING = "captures/2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json";
const OUTPUT_DIRECTORY = "dist/preview";
const LANDING_PAGE = "index.html";
const HOMEPAGE = "https://github.com/KamilGrocholski/margometer";
const RELEASE_FLAG = "--release";
const CONFIGURATION_FILE = "deno.json";
const THROUGH_PARAMETER = "wpis";
/** One entry of the replay on screen; the landing recording runs about half a minute at this. */
const PLAY_STEP_MILLISECONDS = 300;
/** What the band leaves free on its right: both windows, their inset, and a gap either side. */
const WINDOWS_ACROSS_PIXELS = PLACE.insetPixels * 4 + PLACE.widthPixels + STANDING.widthPixels;
/** The game page's own colour, so the panel stands on what it stands on in the game. */
const PAGE_COLOUR = "#14171c";

/** Every file of the site: the page, the bundle it runs, and the decoy it takes a build id off. */
export async function composePreviewSiteFiles(version: string): Promise<PreviewSiteFile[]> {
    assert(version.length > 0, "a published page states the build it draws");
    const bundle = await readUserscriptFiles(version);
    const files = [
        {
            name: LANDING_PAGE,
            text: composeSitePage(lookupRecordedFight(LANDING_RECORDING), version),
        },
        { name: USERSCRIPT_NAME, text: bundle.script },
        // A real file where a server answers a miss: a host answering one with its own HTML turns
        // the tag into a syntax error in every visitor's console.
        {
            name: GAME_SCRIPT_NAME,
            text: "// Nothing reads this file; its name carries a build id.\n",
        },
    ];
    assertStrictEquals(files.length, 3, "one page and the two scripts it names");
    return files;
}

/**
 * The finished fight, which is what the add-on is for, with the strip to replay it from the
 * start. The page feeds nothing itself: the band's script feeds as far as the address says, so
 * `od początku` is a reload at nought rather than a second fight the shelf would keep.
 */
export function composeSitePage(fight: RecordedFight, version: string): string {
    assert(fight.updates.length > 0, "a page is written for a fight there is something to play");
    return composePanelPage({
        calls: fight.updates,
        fedThrough: 0,
        engine: "before",
        doesLoadTwice: false,
        place: "Podgląd",
        userscriptName: USERSCRIPT_NAME,
        scriptDirectory: "./",
        title: "MargoMeter — podgląd",
        language: "pl",
        beforeBundle: `<script>${composeWindowsSeeded()}</script>\n`,
        afterDriver: `${composeSiteBand(version)}\n<script>${composeSiteStrip()}</script>\n`,
    });
}

/**
 * Both windows put in the top right corner before the add-on reads where they stand, by the same
 * stored place a reader's drag writes. A panel opening centred covers the band, and a drag
 * written here instead would be a second copy of how the panel moves.
 */
function composeWindowsSeeded(): string {
    const helperOffset = PLACE.insetPixels + PLACE.widthPixels + SPACE_PIXELS.wide +
        STANDING.widthPixels;
    return `(function setWindowsSeeded() {
  try {
    var top = ${PLACE.insetPixels};
    var panelLeft = Math.max(0, window.innerWidth - ${PLACE.insetPixels + PLACE.widthPixels});
    var helperLeft = Math.max(0, window.innerWidth - ${helperOffset});
    localStorage.setItem(${JSON.stringify(STORE_KEY.panelPlace)},
      JSON.stringify({ left: panelLeft, top: top }));
    localStorage.setItem(${JSON.stringify(STORE_KEY.helperPlace)},
      JSON.stringify({ left: helperLeft, top: top }));
  } catch (reason) {
    console.warn("MargoMeter/Preview", reason);
  }
})();`;
}

/**
 * What the add-on is, what it needs, and the button. `chrome://extensions` stays plain text: a
 * browser refuses that navigation from a page, so a link there does nothing and reads as broken.
 * Every figure the sentence promises is one the panel draws, which is the whole test of it.
 */
function composeSiteBand(version: string): string {
    assert(USERSCRIPT_DOWNLOAD_ADDRESS.startsWith("https://"), "the button hands over the file");
    return `<style>
body { margin: 0; background: ${PAGE_COLOUR}; color: #e3e7ea; font: 15px/1.55 system-ui, sans-serif; }
.preview-band { box-sizing: border-box; padding: 40px 40px 120px;
  max-width: min(42em, calc(100vw - ${WINDOWS_ACROSS_PIXELS}px)); }
.preview-band h1 { font-size: 28px; margin: 0 0 8px; }
.preview-band a { color: #8cc4ff; }
.preview-band ul { padding-left: 20px; }
.preview-offer { display: inline-block; margin: 12px 0 4px; padding: 10px 20px; border-radius: 6px;
  background: #2f7d4f; color: #fff !important; font-weight: 600; text-decoration: none; }
.preview-version { margin: 0; color: #9aa4ad; font-size: 13px; }
.preview-strip { position: fixed; left: 16px; bottom: 16px; display: flex; flex-wrap: wrap;
  gap: 6px; align-items: center; padding: 8px 10px; border-radius: 6px; background: #1f252c;
  font-size: 13px; }
.preview-strip button { font: inherit; padding: 3px 9px; }
</style>
<header class="preview-band">
<h1>MargoMeter</h1>
<p>Licznik obrażeń do Margonem: kto ile zadał, kto ile oberwał i czym.</p>
<p>Zanim zainstalujesz:</p>
<ul>
<li>Menedżer skryptów: <a href="https://www.tampermonkey.net/">Tampermonkey</a> albo
<a href="https://violentmonkey.github.io/">Violentmonkey</a>.</li>
<li><strong>W Chrome i Edge włącz obsługę skryptów użytkownika</strong> w chrome://extensions.
Bez tego nic się nie uruchomi i nic o tym nie powie.</li>
</ul>
<a class="preview-offer" href="${USERSCRIPT_DOWNLOAD_ADDRESS}">Zainstaluj MargoMeter</a>
<p class="preview-version">wersja ${version}</p>
<p>Potem zacznij walkę — panel pojawi się sam, jak ten obok.</p>
<p>Obok nagrana walka i panel, który dodatek rysuje nad grą. Kliknij wiersz, żeby zobaczyć, z czego
się wziął. <a href="${HOMEPAGE}">Kod źródłowy</a>.</p>
</header>
<div class="preview-strip" id="preview-strip">
<button data-step="start">od początku</button>
<button data-step="1">+1</button>
<button data-step="10">+10</button>
<button data-step="play" id="preview-play">odtwórz</button>
<button data-step="end">do końca</button>
<span id="preview-fed"></span>
</div>`;
}

/**
 * The fight fed as far as the address says, the whole of it where it says nothing, and the strip
 * that steps it. Every handler is guarded where it is handed over (E10): a throw out of a
 * listener unwinds into a loop that drops it, and the strip would stop answering with no word.
 */
function composeSiteStrip(): string {
    return `(function setSiteStrip() {
  var probe = window.margometerE2e;
  var fed = document.getElementById("preview-fed");
  var play = document.getElementById("preview-play");
  var timer = null;
  var total = probe.fed + probe.remaining();
  var show = function () {
    fed.textContent = "wpis " + probe.fed + " z " + total;
    var address = new URL(location.href);
    address.searchParams.set(${JSON.stringify(THROUGH_PARAMETER)}, String(probe.fed));
    history.replaceState(null, "", address);
  };
  var stop = function () {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    play.textContent = "odtwórz";
  };
  var stepPlayed = function () {
    try {
      if (probe.remaining() === 0) { stop(); return; }
      probe.feed(1);
      show();
    } catch (reason) { stop(); console.warn("MargoMeter/Preview", reason); }
  };
  var handlePress = function (event) {
    try {
      var step = event.target.getAttribute("data-step");
      if (step === null) return;
      if (step === "play") {
        if (timer !== null) { stop(); return; }
        play.textContent = "pauza";
        timer = window.setInterval(stepPlayed, ${PLAY_STEP_MILLISECONDS});
        return;
      }
      stop();
      if (step === "start") {
        location.search = "?" + ${JSON.stringify(THROUGH_PARAMETER)} + "=0";
        return;
      }
      probe.feed(step === "end" ? probe.remaining() : Number(step));
      show();
    } catch (reason) { console.warn("MargoMeter/Preview", reason); }
  };
  document.getElementById("preview-strip").addEventListener("click", handlePress);
  var stated = Number(new URL(location.href).searchParams.get(${
        JSON.stringify(THROUGH_PARAMETER)
    }));
  var through = Number.isSafeInteger(stated) && stated >= 0 && location.search !== "" ? stated : total;
  probe.feed(through);
  show();
})();`;
}

/** The release number where the run says it stands on the release tree, marked `-dev` otherwise. */
export function readSiteVersion(args: readonly string[]): string {
    if (!args.includes(RELEASE_FLAG)) return readDevelopmentVersion();
    return parseDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
}

if (import.meta.main) {
    const files = await composePreviewSiteFiles(readSiteVersion(Deno.args));
    await Deno.mkdir(OUTPUT_DIRECTORY, { recursive: true });
    for (const file of files) {
        await Deno.writeTextFile(`${OUTPUT_DIRECTORY}/${file.name}`, file.text);
    }
    console.log(`${OUTPUT_DIRECTORY}: ${files.map((file) => file.name).join(", ")}`);
}
