/**
 * The published preview, held to the faults that only appear once it is
 * published.
 *
 * Every one of these passes on a page opened from disk and on a page served by
 * `bun run preview`: an address beginning at the domain root, a reload stream
 * reconnecting to nothing, a picker offering a file nobody wrote. The deployment
 * is the only place they show, and it is the one place nobody is watching.
 *
 * Nothing here writes a file — `composePreviewSitePages` is pure and needs no
 * bundle, so the pages are read as text (`tools/preview-site.ts`).
 */

import { describe, expect, test } from "bun:test";

import { USERSCRIPT_FILENAME } from "@/build.ts";
import { assertDefined } from "@/libs/assert.ts";
import { hasAnyCharacterIn } from "@/libs/text-runs.ts";
import { getElements } from "@/tests/markup-parts.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { PREVIEW_GAME_SCRIPT_NAME } from "@/tools/preview-page.ts";
import {
  composePreviewSiteFiles,
  composePreviewSitePages,
  PreviewSiteError,
} from "@/tools/preview-site.ts";

const PAGES = composePreviewSitePages();

/** The letters Polish has and English does not — one of them is enough. */
const POLISH_LETTERS = "ąćęłńóśźż";

const INTRODUCTION_CLASS = "preview-intro";

/**
 * Every capture the picker offers, as the address it would open.
 *
 * Read out of the settings the page carries rather than off a control, because
 * the picker is built from them in the browser and there is no markup to read
 * here.
 */
function getOfferedAddresses(page: string): string[] {
  const opening = `"address":"./`;
  const addresses: string[] = [];
  for (let at = page.indexOf(opening); at !== -1; at = page.indexOf(opening, at + 1)) {
    const start = at + opening.length;
    const end = page.indexOf(`"`, start);
    if (end !== -1) addresses.push(page.slice(start, end));
  }
  return addresses;
}

function getPageByName(name: string): string {
  const page = PAGES.find((file) => file.name === name);
  return assertDefined(page, "the site composed the page this test asked for").text;
}

describe("what the site is made of", () => {
  test("a page for every capture, and one to land on", () => {
    const names = PAGES.map((file) => file.name);
    expect(names).toContain("index.html");
    for (const fight of CAPTURED_FIGHTS) expect(names).toContain(`${fight.name}.html`);
    expect(PAGES.length).toBe(CAPTURED_FIGHTS.length + 1);
  });

  /**
   * The landing page is a rule over the directory rather than a name: the newest
   * capture, because the oldest is a short solo hunt and a visitor asking what
   * the panel looks like is answered by a group fight.
   */
  test("the page it lands on is the capture the rule picks", () => {
    const newest = assertDefined(CAPTURED_FIGHTS.at(-1), "there is a capture to land on");
    expect(getPageByName("index.html")).toBe(getPageByName(`${newest.name}.html`));
  });

  test("the bundle it ships is the file a person installs", async () => {
    const files = await composePreviewSiteFiles();
    const bundle = files.find((file) => file.name === USERSCRIPT_FILENAME);
    expect(bundle?.text.startsWith("// ==UserScript==")).toBe(true);
  });

  /**
   * ⚠️ **A real file, where the server answers this name with a 404.** Only the
   * `src` attribute is read, but a host that answers a miss with its own HTML
   * error page puts `SyntaxError: expected expression, got '<'` in the console of
   * a page whose whole point is to look like nothing is wrong.
   */
  test("the build the page names is a file the site writes", async () => {
    const files = await composePreviewSiteFiles();
    expect(files.map((file) => file.name)).toContain(PREVIEW_GAME_SCRIPT_NAME);
  });

  test("the site names its own failures", () => {
    expect(new PreviewSiteError("nothing to publish").name).toBe(
      "MargoMeterTool/PreviewSite",
    );
  });
});

describe("what a published page may not do", () => {
  /**
   * The dead-link class, and the reason it is asked of every page rather than by
   * clicking: the picker on each of them offers every capture, so one page named
   * differently from the address that reaches it is a broken control on every
   * page of the site at once.
   */
  test("every address the picker offers is a file the site writes", () => {
    const written = new Set(PAGES.map((file) => file.name));
    const offered = new Set<string>();
    for (const page of PAGES) {
      for (const address of getOfferedAddresses(page.text)) {
        offered.add(decodeURIComponent(address));
      }
    }
    expect(offered.size).toBe(CAPTURED_FIGHTS.length);
    expect([...offered].filter((address) => !written.has(address))).toEqual([]);
  });

  /**
   * ⚠️ **The failure that is permanent and silent.** There is no `/reload` behind
   * a published page, and the stream reconnects on its own — twice a second, for
   * as long as the tab is open.
   */
  test("no published page opens a stream", () => {
    for (const page of PAGES) expect(page.text).not.toContain("EventSource");
  });

  /**
   * The same claim about the same absence, one route further. Picking a capture
   * on the development server fetches its payloads and replays them in place; a
   * published page has no process to ask, so every link says so and a pick stays
   * the navigation it always was.
   */
  test("no published page has anywhere to fetch a capture from", () => {
    for (const page of PAGES) {
      expect(page.text).toContain(`"payloadsAddress":null`);
      expect(page.text).not.toContain("/payloads");
    }
  });

  /**
   * GitHub Pages serves this project under a path of its own, so anything asked
   * of the domain root is asked of a project that is not this one — and the panel
   * simply never appears, while the same page is perfect on `file://` and on
   * localhost.
   */
  test("nothing on a published page is asked of the domain root", () => {
    for (const page of PAGES) {
      expect(page.text).not.toContain(`src="/`);
      expect(page.text).not.toContain(`href="/`);
    }
  });

  /**
   * §9.6's question, asked of a *site* page rather than of the shared template:
   * the words and the introduction are text nobody else reads, so this is the one
   * place a `MargoMeter-` of the harness's own could arrive.
   */
  test("nothing the published harness draws is named as the add-on's", () => {
    for (const page of PAGES) {
      const markup = page.text.split("<script")[0] ?? "";
      expect(markup).toContain("preview-strip");
      expect(markup).not.toContain("MargoMeter-");
    }
  });
});

describe("what a published page says", () => {
  // §3: the text a player reads is Polish, and a published page is read by
  // players. Held on the markup, which is the half a visitor actually sees.
  /**
   * ⚠️ **The element, not the name.** Asked as `toContain("preview-intro")` this
   * passed with no introduction drawn at all, because the stylesheet in the head
   * spells the same word — a mutation removing the sentence lit nothing (§7.5).
   */
  test("the strip and the introduction speak Polish", () => {
    const markup = getPageByName("index.html").split("<script")[0] ?? "";
    expect(markup).toContain(`lang="pl"`);
    const introduction = getElements(markup, "p").filter((one) =>
      one.attributes.includes(`class="${INTRODUCTION_CLASS}"`),
    );
    expect(introduction.length).toBe(1);
    expect(hasAnyCharacterIn(introduction[0]?.text ?? "", POLISH_LETTERS)).toBe(true);
    // The strip's own words, which are a separate table from the sentence above.
    // Read off the buttons rather than "everything after the strip", because the
    // stylesheet names it first and that slice is a CSS rule body.
    const labels = getElements(markup, "button").map((one) => one.text);
    expect(labels.length).toBeGreaterThan(0);
    expect(hasAnyCharacterIn(labels.join(" "), POLISH_LETTERS)).toBe(true);
  });

  // Where the server opens on nothing, because whoever started it is usually
  // chasing the early states.
  test("a published page opens on the finished fight", () => {
    for (const fight of CAPTURED_FIGHTS) {
      expect(getPageByName(`${fight.name}.html`)).toContain(
        `"entryIndex":${fight.dump.calls.length}`,
      );
    }
  });
});
