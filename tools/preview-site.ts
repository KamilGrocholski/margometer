/**
 * The panel, as a directory of files somebody else can open.
 *
 * `bun run preview` answers the same question for whoever has the repository
 * checked out; this answers it for whoever has not. It writes the harness page
 * once per capture, plus the bundle those pages load, and
 * `.github/workflows/pages.yml` publishes the result — so the panel can be looked
 * at without installing a userscript into a game that has not authorised it
 * (`NOTICE.md`).
 *
 * **Nothing written here is ever committed.** The pages carry a capture's engine
 * payloads inlined, which is how the replay stays synchronous
 * (`tools/preview-page.ts`), and those payloads carry the game's own names for
 * abilities and items. `tests/tools/source-layout.test.ts` refuses such a name in
 * any tracked source file or document, and NOTICE.md states what the published
 * page carries and on what basis. The output goes under `dist/`, which git
 * ignores.
 *
 * **The words here are Polish and the ones in `tools/preview-server.ts` are
 * English, on purpose.** §3 puts the text a player reads in Polish; a published
 * page is read by players, and a development server is read by whoever is editing
 * `src/`. That is why this file is on the list in
 * `tests/tools/source-layout.test.ts` naming what may speak Polish and the shared
 * page module is not.
 */

import { composeUserscriptFiles, USERSCRIPT_FILENAME } from "@/build.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";
import {
  composePreviewPage,
  PREVIEW_GAME_SCRIPT_NAME,
  type PreviewWords,
} from "@/tools/preview-page.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

export class PreviewSiteError extends MargoMeterToolError {
  constructor(reason: string, options?: ErrorOptions) {
    super("PreviewSite", reason, options);
  }
}

const OUTPUT_DIRECTORY = "./dist/preview";

/** What a browser is handed, before anything writes it down. */
export type PreviewSiteFile = {
  name: string;
  text: string;
};

const PREVIEW_SITE_WORDS: PreviewWords = {
  language: "pl",
  title: "MargoMeter — podgląd",
  start: "od początku",
  backHint: "Odtwarza walkę do poprzedniego wpisu",
  end: "do końca",
  play: "odtwórz",
  pause: "pauza",
  entry: "wpis",
};

/**
 * What the page says to somebody who did not start it.
 *
 * Three things and no more: that the fight is a recording rather than a live
 * game, that everything is counted in the reader's own browser, and where the
 * add-on itself is. A visitor who does not know the first would read the panel as
 * a live connection to somebody's account, which is the one misunderstanding this
 * page could cause.
 *
 * The second gained a third clause rather than a fourth sentence: the page takes
 * its own store away before the add-on loads (`tools/preview-page.ts`), so *nic
 * tu nie zostaje* is a fact about the visitor's browser and the shortest true
 * thing that can be said about it.
 */
const PREVIEW_SITE_INTRODUCTION = [
  "<strong>MargoMeter</strong> to licznik obrażeń do Margonem.",
  "Poniżej odtwarzana jest nagrana walka — panel liczy ją w tej przeglądarce,",
  "tak samo jak liczyłby ją w grze. Nic nie łączy się tu z grą, nic nie jest wysyłane",
  "i nic tu nie zostaje.",
  `<a href="https://github.com/KamilGrocholski/margometer">kod źródłowy</a>`,
  "·",
  `<a href="https://github.com/KamilGrocholski/margometer/releases/latest">instalacja</a>`,
].join(" ");

function composeFightPageName(fightName: string): string {
  return `${fightName}.html`;
}

/**
 * ⚠️ **Relative, and that is the whole of what a published page cannot get
 * wrong twice.** GitHub Pages serves a project under a path of its own, so an
 * address beginning at the domain root asks for a file belonging to no project —
 * and the same page is perfect opened from disk and from a development server.
 */
function composeFightAddress(fightName: string): string {
  return `./${encodeURIComponent(composeFightPageName(fightName))}`;
}

/**
 * Every page of the site, which needs no bundle and therefore no build.
 *
 * Split from the files below for `build.ts`'s reason: what can be composed
 * without touching anything is composed without touching anything, and the tests
 * for the pages then never write to disk or race `bun run build` over `dist/`.
 */
export function composePreviewSitePages(): PreviewSiteFile[] {
  /**
   * The capture the site lands on, as a rule over the discovered directory
   * rather than a filename somebody typed (§9.2).
   *
   * The newest, because the oldest recording here is a short solo hunt and fills
   * two rows: a visitor asking what the panel looks like is answered by a group
   * fight. `tests/captured-fight-catalog.ts` sorts the directory, and the names
   * begin with the date they were recorded on.
   */
  const landing = CAPTURED_FIGHTS.at(-1);
  if (landing === undefined) {
    throw new PreviewSiteError("no captured fights to publish");
  }

  const fights = CAPTURED_FIGHTS.map((fight) => ({
    name: fight.name,
    address: composeFightAddress(fight.name),
  }));

  function composePageOfFight(fight: (typeof CAPTURED_FIGHTS)[number]): string {
    const payloads = fight.dump.calls.map((call) => call.payload);
    return composePreviewPage({
      fightName: fight.name,
      /**
       * The finished fight, where the server opens on nothing.
       *
       * A visitor's first sight should be the thing the add-on is for — every row
       * populated, the totals a fight came to. The panel before any data has
       * arrived is a state worth looking at and `od początku` opens the page again
       * to reach it, which is why that button exists; it is a poor answer to "what
       * is this".
       */
      entryIndex: payloads.length,
      payloads,
      fights,
      scriptDirectory: "./",
      words: PREVIEW_SITE_WORDS,
      introduction: PREVIEW_SITE_INTRODUCTION,
      // No process behind these pages, so nothing to listen to.
      appendedScript: null,
    });
  }

  return [
    { name: "index.html", text: composePageOfFight(landing) },
    ...CAPTURED_FIGHTS.map((fight) => ({
      name: composeFightPageName(fight.name),
      text: composePageOfFight(fight),
    })),
  ];
}

/**
 * The pages, plus the two scripts they name.
 *
 * ⚠️ **The decoy is a real file here, where the server answers it with a 404.**
 * Only its `src` attribute is ever read — that is where the build id comes from —
 * but a host that answers a miss with its own HTML error page turns the tag into
 * `SyntaxError: expected expression, got '<'` in every visitor's console, on a
 * page whose whole purpose is to look like nothing is wrong.
 */
export async function composePreviewSiteFiles(): Promise<PreviewSiteFile[]> {
  const bundle = await composeUserscriptFiles();
  return [
    ...composePreviewSitePages(),
    { name: USERSCRIPT_FILENAME, text: bundle.script },
    {
      name: PREVIEW_GAME_SCRIPT_NAME,
      text: "// Nothing reads this file. Its name carries the build id the page states.\n",
    },
  ];
}

async function writePreviewSiteFiles(): Promise<void> {
  const files = await composePreviewSiteFiles();
  for (const file of files) {
    await Bun.write(`${OUTPUT_DIRECTORY}/${file.name}`, file.text);
  }
  console.log(`built ${OUTPUT_DIRECTORY}, ${files.length} files`);
  console.log("serve that directory, or let .github/workflows/pages.yml publish it");
}

if (import.meta.main) await writePreviewSiteFiles();
