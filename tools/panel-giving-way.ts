/**
 * The panel with a region that will not draw, so the states a reader meets when something breaks
 * can be looked at instead of imagined: served beside the ordinary preview, or photographed one
 * picture per region under `dist/giving-way/` by `tools/panel-shots.ts`'s camera. None of them is
 * reachable from a protocol message. Nothing here reaches what a reader installs: the bundle is
 * built from a copy of the tree with the panel's two region guards edited, so `src/` carries no
 * seam and the released file is the file it would have been (`develop ADR 0083`).
 *
 *     deno task preview:giveway [--region NAME]… [--port N]
 *     deno task panel:giveway [--region NAME]… [--into DIRECTORY] [--browser PATH]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { copy } from "@std/fs";
import { relative, resolve } from "@std/path";
import { parseInteger } from "#/libs/number-text.ts";
import { isOneOf } from "#/libs/vocabulary.ts";
import { TIP_ATTRIBUTE } from "#/src/ui/panel-element.ts";
import { PANEL_MARK } from "#/src/ui/panel-intent.ts";
import { PANEL_REGION, type PanelRegion } from "#/src/ui/panel-words.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";
import { BUNDLE_ENTRY, readDevelopmentVersion, readUserscriptFiles } from "./build-userscript.ts";
import { GivingWayError } from "./margometer-tool-error.ts";
import {
    composeShotPage,
    launchShotBrowser,
    lookupShotEntry,
    type PanelShot,
    SHOT_DIRECTORY,
    SHOT_MOMENT,
    type ShotStep,
    writeShot,
} from "./panel-shots.ts";
import { initPreviewServer } from "./preview-server.ts";
import { LANDING_RECORDING } from "./preview-site.ts";

export interface GivingWayFlags {
    regions: PanelRegion[];
    port: number;
    into: string;
    browser: string | null;
    doesShoot: boolean;
}

/** Every region the panel words, and nothing spelled a second time here. */
export const GIVING_WAY_REGIONS = Object.values(PANEL_REGION);
/** What the added lines throw, and what nothing a reader installs may ever say. */
export const GIVING_WAY_MARKER = "given way on purpose";
export const PANEL_FILE = "src/ui/panel-element.ts";
/**
 * The two guards a region is drawn under: every region's, and the card's, which hides rather than
 * leaving a sentence. Each is held once in `PANEL_FILE` by the test beside this, because a reader
 * over source that stops finding its subject builds a panel that gives nothing way.
 */
export const REGION_ANCHOR = "    const rendered = errors.attempt(render);\n";
export const TIP_ANCHOR = "        const next = render();\n        standing.replaceWith(next);\n";
/** Everything the bundle entry reaches, and the lock its imports resolve by. */
const COPIED = ["src", "libs", "frozen", "deno.json", "deno.lock"];
/** Past the regions there are, which is what a person may ask for at once (S11). */
export const REGIONS_ASKED_MAXIMUM = 32;
/** Beside the preview's own, so a panel that gives way and one that does not stand at once. */
const DEFAULT_PORT = 4175;
/** Under `dist/`, never `SHOT_DIRECTORY`: a README showing one would show a broken panel. */
export const DEFAULT_INTO = "dist/giving-way";

/** The flags, with every region asked for checked against the panel's own list. */
export function readGivingWayFlags(args: readonly string[]): GivingWayFlags {
    const parsed = parseArgs([...args], {
        string: ["region", "port", "into", "browser"],
        boolean: ["shots"],
        collect: ["region"],
    });
    if (parsed._.length > 0) {
        throw new GivingWayError(`${parsed._.join(" ")} is not a flag this reads`);
    }
    if (parsed.region.length > REGIONS_ASKED_MAXIMUM) {
        throw new GivingWayError(`no more than ${REGIONS_ASKED_MAXIMUM} regions at once`);
    }
    const regions: PanelRegion[] = [];
    const unknown: string[] = [];
    for (const name of parsed.region) {
        if (isOneOf(GIVING_WAY_REGIONS, name)) regions.push(name);
        else unknown.push(name);
    }
    if (unknown.length > 0) {
        throw new GivingWayError(`no region of the panel is called ${unknown.join(", ")}`);
    }
    const port = parsed.port === undefined ? DEFAULT_PORT : parseInteger(parsed.port);
    if (port === null) throw new GivingWayError(`--port ${parsed.port} is not a number`);
    const into = parsed.into ?? DEFAULT_INTO;
    if (!relative(resolve(SHOT_DIRECTORY), resolve(into)).startsWith("..")) {
        throw new GivingWayError(`${into} is where the READMEs read their pictures from`);
    }
    return {
        regions: regions.length > 0 ? regions : [...GIVING_WAY_REGIONS],
        port,
        into,
        browser: parsed.browser ?? null,
        doesShoot: parsed.shots,
    };
}

/**
 * The panel's own source with the regions asked for made to give way. ⚠️ **What is thrown is the
 * marker and not an error**: both guards catch anything and keep nothing of what they caught, and
 * a `new Error` would be one this tree wrote, which **E13** binds in a copy of it too.
 */
export function composeGivingWaySource(source: string, regions: readonly PanelRegion[]): string {
    assert(regions.length > 0, "a build that gives way is told what gives way");
    assert(regions.length <= REGIONS_ASKED_MAXIMUM, "and is asked inside the stated bound");
    for (const anchor of [REGION_ANCHOR, TIP_ANCHOR]) {
        if (source.split(anchor).length !== 2) {
            throw new GivingWayError(`${PANEL_FILE} no longer carries once the guard this edits`);
        }
    }
    const named = JSON.stringify(regions);
    const region = `    const rendered = errors.attempt(() => {
        if (${named}.includes(region)) throw "${GIVING_WAY_MARKER}";
        return render();
    });
`;
    const tip = `        if (${named}.includes(PANEL_REGION.tip)) throw "${GIVING_WAY_MARKER}";
${TIP_ANCHOR}`;
    const written = source.replace(REGION_ANCHOR, region).replace(TIP_ANCHOR, tip);
    assertStrictEquals(written.split(GIVING_WAY_MARKER).length, 3, "both guards carry the line");
    return written;
}

/**
 * The built bundle of a copy of the tree carrying the edit. A copy and never the tree: a run that
 * failed part-way would otherwise leave `src/` holding a panel that refuses to draw.
 */
export async function readGivingWayBundle(regions: readonly PanelRegion[]): Promise<string> {
    assert(regions.length > 0, "a build that gives way is told what gives way");
    const root = await Deno.makeTempDir({ prefix: "margometer-giving-way-" });
    try {
        for (const name of COPIED) await copy(name, `${root}/${name}`);
        const source = await Deno.readTextFile(PANEL_FILE);
        const written = composeGivingWaySource(source, regions);
        await Deno.writeTextFile(`${root}/${PANEL_FILE}`, written);
        const built = await readUserscriptFiles(readDevelopmentVersion(), BUNDLE_ENTRY, root);
        // A copy whose imports resolved back into this tree builds the panel unedited.
        assert(built.script.includes(GIVING_WAY_MARKER), "the build is of the edited copy");
        return built.script;
    } finally {
        await Deno.remove(root, { recursive: true });
    }
}

/**
 * The picture of one region giving way, at the moment the underway set is taken. ⚠️ **A region
 * that fails is stated in the list of defects at the next draw, not the one it failed in**, and a
 * page between payloads draws nothing: each picture presses the strip already shown, which draws
 * again and changes nothing else — or, with the strips gone, folds the helper and unfolds it. The
 * card is drawn only under a pointer, so its picture hovers the first row that opens one first.
 */
export function composeGivingWayShot(region: PanelRegion): PanelShot {
    const hover: ShotStep = { doesHover: true, mark: TIP_ATTRIBUTE, at: 0 };
    const shown: ShotStep = { doesHover: false, mark: PANEL_MARK.screen, at: 0 };
    const fold: ShotStep = { doesHover: false, mark: PANEL_MARK.helperFold, at: 0 };
    const redraw = region === PANEL_REGION.strips ? [fold, fold] : [shown];
    const shot: PanelShot = {
        name: `giving-way-${region}.png`,
        moment: SHOT_MOMENT.underway,
        steps: region === PANEL_REGION.tip ? [hover, ...redraw] : redraw,
    };
    assert(shot.steps.length <= 2, "a region gives way at the moment, not after a walk to it");
    return shot;
}

/** One picture per region asked for, named for it, into a directory of the caller's choosing. */
export async function writeGivingWayShots(flags: GivingWayFlags): Promise<string[]> {
    assert(flags.regions.length > 0, "a set of pictures is of something");
    const fight = lookupRecordedFight(LANDING_RECORDING);
    const entry = lookupShotEntry(SHOT_MOMENT.underway, fight.updates.length);
    const html = composeShotPage(fight.updates, entry);
    await Deno.mkdir(flags.into, { recursive: true });
    const browser = await launchShotBrowser(flags.browser);
    const written: string[] = [];
    try {
        for (const region of flags.regions) {
            const bundle = await readGivingWayBundle([region]);
            const shot = composeGivingWayShot(region);
            const path = `${flags.into}/${shot.name}`;
            await writeShot(browser, html, bundle, shot, path);
            written.push(path);
        }
    } finally {
        await browser.close();
    }
    assertStrictEquals(written.length, flags.regions.length, "one picture per region asked for");
    return written;
}

if (import.meta.main) {
    const flags = readGivingWayFlags(Deno.args);
    if (flags.doesShoot) {
        for (const path of await writeGivingWayShots(flags)) console.log(path);
        console.log(`${flags.regions.length} of them, each a panel nobody installs`);
    } else {
        const bundle = await readGivingWayBundle(flags.regions);
        const preview = initPreviewServer({
            port: flags.port,
            shouldWatch: false,
            readBundle: () => Promise.resolve(bundle),
        });
        console.log(`preview  ${preview.url}`);
        console.log(`giving way: ${flags.regions.join(", ")}`);
        console.log("nothing here reaches what a reader installs; the tree is untouched");
    }
}
