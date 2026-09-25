/**
 * The panel, photographed, one picture per state worth showing, into `screenshots/` with
 * `taken-at.json` naming the commit, version, recording and moment of the set. `DESIGN.md` owns the
 * rule this obeys, _The Frame Is Not A Screen Rule_: it refuses to shoot while `src/` carries
 * anything no commit holds. The page is `tests/e2e/game-page.ts`, driven in Chrome by Playwright
 * as the browser suite drives it, with both windows seeded in the corner the READMEs show.
 * Whether a state shown is reachable no picture says: opening every one before committing stays.
 *
 *     deno task panel:shots [--release]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { encodeJson } from "#/libs/json-text.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { TIP_ATTRIBUTE } from "#/src/ui/panel-element.ts";
import { PANEL_MARK, type PanelMark } from "#/src/ui/panel-intent.ts";
import { STORE_KEY } from "#/src/game/browser-store.ts";
import { CLASS, PLACE, SPACE_PIXELS, STANDING } from "#/src/ui/panel-look.ts";
import { composePanelPage } from "#/tests/e2e/game-page.ts";
import {
    closePanelPage,
    launchPanelBrowser,
    openPanelPage,
    type PanelBox,
    readPanelBoxes,
    writePanelPicture,
} from "#/tests/e2e/panel-camera.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";
import { readUserscriptFiles, USERSCRIPT_NAME } from "./build-userscript.ts";
import { PanelShotError } from "./margometer-tool-error.ts";
import { LANDING_RECORDING, readSiteVersion } from "./preview-site.ts";
import { formatRecordingName } from "./recorded-material.ts";

/**
 * How far into the fight a picture is taken. A fight that has ended numbers nobody's turn and
 * holds no charge; a fight still going has nothing on the shelf, because a fight is kept where it
 * reaches its end. Neither moment draws both, which is why the set is taken at two.
 */
export const SHOT_MOMENT = { underway: "underway", over: "over" } as const;
export type ShotMoment = VocabularyWord<typeof SHOT_MOMENT>;

/** A real press or a real hover, on the `at`th element carrying a mark of the panel's own. */
export interface ShotStep {
    doesHover: boolean;
    mark: PanelMark | typeof TIP_ATTRIBUTE;
    at: number;
}

export interface PanelShot {
    name: string;
    moment: ShotMoment;
    steps: readonly ShotStep[];
}

/** One picture of a set, beside how much of the fight the panel in it had been handed. */
export interface TakenShot {
    name: string;
    entry: number;
}

/** What a picture cannot say about itself, written beside the set. */
export interface PanelShotRecord {
    commit: string;
    version: string;
    fight: string;
    takenAt: string;
    shots: TakenShot[];
}

export const SHOT_DIRECTORY = "screenshots";
export const SIDECAR_NAME = "taken-at.json";
/** Indented at `deno.json`'s width, because the gate formats every JSON file it tracks. */
const SIDECAR_INDENT_SPACES = 4;
/** Spelled as `playwright.config.ts` spells it, and held level with it by the test beside this. */
export const BROWSER_VARIABLE = "MARGOMETER_BROWSER";
/**
 * The payload the underway pictures are taken after: a fight going on with exactly one charge
 * standing and a turn of it left, far enough in that the ranking is filled. The test beside this
 * re-earns it over the recording, so a number that stops qualifying reddens rather than quietly
 * shifting what five of the pictures are of.
 */
export const UNDERWAY_ENTRY = 78;
/**
 * Wide enough that a card opens beside the panel rather than over it: a card takes whichever side
 * has room (`src/ui/panel-drag.ts`), and a window holding the panel alone flips it onto the figures.
 */
const VIEWPORT = { width: 1280, height: 900 };
/**
 * Strips are addressed by position, never by their Polish label (L2): two nouns, then two
 * directions (`src/ui/panel-screen.ts`), so the fourth is damage taken.
 */
const TAB_DAMAGE_TAKEN = 3;
const SHOTS_MAXIMUM = 16;

export function composePanelShots(): PanelShot[] {
    const taken = { doesHover: false, mark: PANEL_MARK.screen, at: TAB_DAMAGE_TAKEN };
    const firstRow = { doesHover: false, mark: PANEL_MARK.row, at: 0 };
    const shots: PanelShot[] = [
        { name: "panel-ranking.png", moment: SHOT_MOMENT.underway, steps: [taken] },
        { name: "panel-opened.png", moment: SHOT_MOMENT.underway, steps: [taken, firstRow] },
        {
            name: "panel-deep.png",
            moment: SHOT_MOMENT.underway,
            steps: [taken, firstRow, firstRow],
        },
        {
            // The row the ranking cannot hold, marked by the end it leaves out.
            name: "panel-half-named.png",
            moment: SHOT_MOMENT.underway,
            steps: [taken, { doesHover: false, mark: PANEL_MARK.unnamed, at: 0 }],
        },
        {
            name: "panel-card.png",
            moment: SHOT_MOMENT.underway,
            steps: [taken, { doesHover: true, mark: TIP_ATTRIBUTE, at: 0 }],
        },
        // The one picture of a fight that ended: a fight is kept where it reaches its end.
        {
            name: "panel-shelf.png",
            moment: SHOT_MOMENT.over,
            steps: [{ doesHover: false, mark: PANEL_MARK.shelf, at: 0 }],
        },
    ];
    assert(shots.length <= SHOTS_MAXIMUM, "a set stays inside its bound");
    assertStrictEquals(new Set(shots.map((shot) => shot.name)).size, shots.length, "each once");
    return shots;
}

/** Where a moment stands in a fight the game made this many calls over. */
export function lookupShotEntry(moment: ShotMoment, calls: number): number {
    assert(calls > UNDERWAY_ENTRY, "a fight photographed twice runs past the first moment");
    return moment === SHOT_MOMENT.over ? calls : UNDERWAY_ENTRY;
}

/**
 * The whole set, into a directory of its own first: a run failing part-way must not take the
 * pictures with it, or a README is left pointing at nothing.
 */
export async function writePanelShots(version: string): Promise<PanelShotRecord> {
    assert(version.length > 0, "a set is taken at a version the panel in it will state");
    const commit = readShotCommit();
    const fight = lookupRecordedFight(LANDING_RECORDING);
    const bundle = (await readUserscriptFiles(version)).script;
    const staging = await Deno.makeTempDir({ prefix: "margometer-shots-" });
    const browser = await launchShotBrowser();
    const taken: TakenShot[] = [];
    try {
        for (const shot of composePanelShots()) {
            const entry = lookupShotEntry(shot.moment, fight.updates.length);
            const html = composePanelPage({
                calls: fight.updates,
                fedThrough: entry,
                engine: "before",
                doesLoadTwice: false,
                place: "Podgląd",
                userscriptName: USERSCRIPT_NAME,
                beforeBundle: `<script>${composeWindowsSeeded()}</script>\n`,
            });
            await writeShot(browser, html, bundle, shot, `${staging}/${shot.name}`);
            taken.push({ name: shot.name, entry });
        }
        const fightName = formatRecordingName(fight.path);
        const takenAt = new Date().toISOString();
        const record = { commit, version, fight: fightName, takenAt, shots: taken };
        await moveShotsIn(staging, record);
        return record;
    } finally {
        await browser.close();
        await Deno.remove(staging, { recursive: true });
    }
}

/**
 * Both windows put in the top right corner before the add-on reads where they stand, by the same
 * stored place a reader's drag writes, so every picture frames them where the READMEs show them.
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

/** The Chrome the browser suite drives, or a refusal naming the variable that points at another. */
async function launchShotBrowser(): Promise<Awaited<ReturnType<typeof launchPanelBrowser>>> {
    try {
        return await launchPanelBrowser(Deno.env.get(BROWSER_VARIABLE) ?? null);
    } catch (cause) {
        throw new PanelShotError(`no Chrome to photograph with (${BROWSER_VARIABLE})`, { cause });
    }
}

/** The commit the set comes from, or a refusal: a set over uncommitted work names no build. */
function readShotCommit(): string {
    const carried = readGitText(["status", "--porcelain", "--", "src"]);
    if (carried.length > 0) {
        throw new PanelShotError(`src/ carries what no commit holds:\n${carried}`);
    }
    const commit = readGitText(["rev-parse", "HEAD"]);
    assert(!commit.includes("\n"), "a set names one commit");
    return commit;
}

function readGitText(args: readonly string[]): string {
    const asked = new Deno.Command("git", { args: [...args], stderr: "piped" }).outputSync();
    if (!asked.success) throw new PanelShotError(`git would not answer ${args.join(" ")}`);
    return new TextDecoder().decode(asked.stdout).trim();
}

/** One picture: the state reached in Chrome, the frame decided here, the picture written there. */
async function writeShot(
    browser: Awaited<ReturnType<typeof launchPanelBrowser>>,
    html: string,
    bundle: string,
    shot: PanelShot,
    path: string,
): Promise<void> {
    const served = { html, scriptName: USERSCRIPT_NAME, script: bundle, viewport: VIEWPORT };
    const page = await openPanelPage(browser, served, shot.steps);
    const boxes = await readPanelBoxes(page, CLASS.standing, CLASS.tip);
    if (boxes === null) {
        await closePanelPage(page);
        throw new PanelShotError(`${shot.name}: a window stands nowhere on the page`);
    }
    await writePanelPicture(page, composeShotClip(boxes, VIEWPORT.width), path);
}

/** Everything the set names, and nothing else: a leftover picture must not look current. */
async function moveShotsIn(staging: string, record: PanelShotRecord): Promise<void> {
    assert(record.shots.length > 0, "a set that is moved in has pictures in it");
    const kept = new Set<string>([...record.shots.map((shot) => shot.name), SIDECAR_NAME]);
    for (const held of Deno.readDirSync(SHOT_DIRECTORY)) {
        if (!kept.has(held.name)) await Deno.remove(`${SHOT_DIRECTORY}/${held.name}`);
    }
    for (const shot of record.shots) {
        await Deno.copyFile(`${staging}/${shot.name}`, `${SHOT_DIRECTORY}/${shot.name}`);
    }
    const text = encodeJson(record, SIDECAR_INDENT_SPACES);
    if (!text.ok) throw new PanelShotError("the sidecar naming the set cannot be written");
    await Deno.writeTextFile(`${SHOT_DIRECTORY}/${SIDECAR_NAME}`, `${text.value}\n`);
}

/**
 * The frame: from the leftmost window or card to the right edge, from the top to the lowest, with
 * the sheet's inset as air. ⚠️ **A panel that did not reach the corner is refused here**, the one
 * failure a picture hides: a set taken off a panel standing where it opened looks finished too.
 */
export function composeShotClip(boxes: readonly PanelBox[], viewportWidth: number): PanelBox {
    const [panel] = boxes;
    if (panel === undefined) throw new PanelShotError("a picture is of the panel");
    const standsFromRight = Math.round(viewportWidth - (panel.x + panel.width));
    if (standsFromRight !== PLACE.insetPixels) {
        throw new PanelShotError(
            `the corner was not reached: ${standsFromRight}px stands where ${PLACE.insetPixels}`,
        );
    }
    const left = Math.min(...boxes.map((box) => box.x)) - PLACE.insetPixels;
    const bottom = Math.max(...boxes.map((box) => box.y + box.height)) + PLACE.insetPixels;
    const x = Math.max(0, Math.floor(left));
    const clip = { x, y: 0, width: viewportWidth - x, height: Math.ceil(bottom) };
    assert(clip.width > PLACE.insetPixels, "a frame holds the panel and the air beside it");
    return clip;
}

if (import.meta.main) {
    const record = await writePanelShots(readSiteVersion(Deno.args));
    console.log(`${SHOT_DIRECTORY}: ${record.shots.length} pictures over ${record.fight}`);
    console.log(`at ${record.commit}, saying ${record.version}`);
    console.log("open every one before committing it — DESIGN.md leaves nobody an exemption");
}
