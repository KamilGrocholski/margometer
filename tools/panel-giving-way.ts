/**
 * The panel with a region that will not draw, so the states a reader meets when something
 * breaks can be looked at instead of imagined.
 *
 *     deno task preview:giveway --region list
 *     deno task panel:giveway --into dist/giving-way
 *
 * ⚠️ **Nothing here reaches what a reader installs.** The bundle is built from a copy of the
 * tree with one line added, so `src/` carries no seam and the released file is bit for bit the
 * file it would have been. `docs/adr/0083-…` says why that was chosen over a module the bundle
 * would have carried.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { composeJsonWriting } from "@/libs/json-text.ts";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { getDevelopmentVersion } from "@/tools/declared-version.ts";
import { composeUserscriptFiles } from "@/tools/build-userscript.ts";
import { PanelShotError } from "@/tools/margometer-tool-error.ts";
import { setPreviewServer } from "@/tools/preview-server.ts";
import { getPreviewRecordedFight, getRecordedFights } from "@/tools/recorded-fights.ts";
import {
    BROWSER_VARIABLE,
    composeShotScript,
    getBrowserAsked,
    readInstalledBrowser,
    UNDERWAY_ENTRY,
} from "@/tools/panel-screenshots.ts";
import { REGION_WORDS } from "@/src/ui/panel-words.ts";

/** Every region there is, taken from the words rather than spelled a second time here. */
export const GIVING_WAY_REGIONS = Object.keys(REGION_WORDS);

/** What the panel copies to build from, which is everything the bundle entry reaches. */
const COPIED = ["src", "libs", "frozen", "project", "deno.json"];
const PANEL_FILE = "src/ui/panel-element.ts";

/**
 * The three lines the added one stands in front of. Held by
 * `tests/tools/panel-giving-way.test.ts`, because a reader over source that stops finding its
 * subject builds a panel that gives nothing way and says nothing about it.
 */
export const GIVING_WAY_ANCHOR = `    try {
        return compose();
    } catch (failure) {
        handleFailure({ kind: "region", region, failure });`;

/** Past the eleven regions there are, which is what a person may ask for at once — **S11**. */
const MAXIMUM_ASKED = 32;

/**
 * The panel's own source with the regions asked for made to give way.
 *
 * ⚠️ **What is thrown is the marker itself and not an error.** `composeRegion` catches anything
 * and the defect keeper reads nothing off what it caught, so a value is enough — and **E1** binds
 * every `new Error` this tree writes, a line written into a copy of it included.
 */
export function composeGivingWaySource(source: string, regions: readonly string[]): string {
    assert(regions.length > 0, "a build that gives way is told what gives way");
    assert(regions.length <= MAXIMUM_ASKED, "and is asked inside the stated bound");
    if (!source.includes(GIVING_WAY_ANCHOR)) {
        throw new PanelShotError(`${PANEL_FILE} no longer carries the region guard this edits`);
    }
    const writing = composeJsonWriting([...regions]);
    if (!writing.isOk) {
        throw new PanelShotError("the regions asked for cannot be written into a build");
    }
    const named = writing.text;
    const given = `    try {
        if (${named}.includes(region)) throw "given way on purpose";
        return compose();
    } catch (failure) {
        handleFailure({ kind: "region", region, failure });`;
    const written = source.replace(GIVING_WAY_ANCHOR, given);
    assert(written !== source, "the panel's source came back changed");
    assert(written.includes("given way on purpose"), "and carrying the line that does it");
    return written;
}

/** Every name asked for is a region the panel has, or the run says which is not — **E7**. */
export function getRegionsUnknown(regions: readonly string[]): string[] {
    return regions.filter((one) => !GIVING_WAY_REGIONS.includes(one));
}

/**
 * A copy of the tree with that one line in it. A copy and not the tree itself: a run that failed
 * part-way through would otherwise leave `src/` carrying a panel that refuses to draw.
 */
async function composeGivingWayTree(regions: readonly string[]): Promise<string> {
    const root = await Deno.makeTempDir({ prefix: "margometer-giving-way-" });
    for (const name of COPIED) {
        await Deno.mkdir(`${root}/${name}`, { recursive: true }).catch(() => {});
        await copyInto(name, `${root}/${name}`);
    }
    const source = await Deno.readTextFile(PANEL_FILE);
    await Deno.writeTextFile(`${root}/${PANEL_FILE}`, composeGivingWaySource(source, regions));
    return root;
}

/** A file goes as a file and a directory as a directory; `deno.json` is the one file copied. */
async function copyInto(from: string, into: string): Promise<void> {
    const stat = await Deno.stat(from);
    if (!stat.isDirectory) {
        await Deno.remove(into, { recursive: true }).catch(() => {});
        await Deno.copyFile(from, into);
        return;
    }
    await Deno.mkdir(into, { recursive: true });
    for await (const entry of Deno.readDir(from)) {
        await copyInto(`${from}/${entry.name}`, `${into}/${entry.name}`);
    }
}

/** The built bundle of such a tree, and the temporary tree taken away after it. */
export async function readGivingWayBundle(regions: readonly string[]): Promise<string> {
    const unknown = getRegionsUnknown(regions);
    if (unknown.length > 0) {
        throw new PanelShotError(`no region of the panel is called ${unknown.join(", ")}`);
    }
    const root = await composeGivingWayTree(regions);
    try {
        const built = await composeUserscriptFiles(getDevelopmentVersion(), undefined, root);
        assert(built.script.length > 0, "a build that gives way is still a build");
        return built.script;
    } finally {
        await Deno.remove(root, { recursive: true });
    }
}

const SHOT_STEPS = `setPressed("[data-screen]", 0);`;

/** Beside the preview's own, so a panel that gives way and one that does not stand at once. */
const DEFAULT_PORT = 4175;

/** The picture of one such panel, taken the way `tools/panel-screenshots.ts` takes its own. */
async function writeGivingWayShot(
    browser: string,
    bundle: string,
    path: string,
): Promise<void> {
    assert(path.endsWith(".png"), "a picture is written as one");
    const fight = getPreviewRecordedFight(getRecordedFights());
    const preview = setPreviewServer({
        port: 0,
        shouldWatch: false,
        readBundle: () => Promise.resolve(bundle),
        appendedScript: composeShotScript(SHOT_STEPS),
    });
    const profile = await Deno.makeTempDir({ prefix: "margometer-giving-way-shot-" });
    try {
        const named = `fight=${encodeURIComponent(fight.name)}`;
        const at = `entry=${UNDERWAY_ENTRY}`;
        const run = await new Deno.Command(browser, {
            args: [
                "--headless",
                "--no-sandbox",
                "--disable-gpu",
                "--hide-scrollbars",
                `--user-data-dir=${profile}`,
                "--window-size=1280,900",
                `--screenshot=${path}`,
                `${preview.url}/?${named}&${at}`,
            ],
        }).output();
        if (!run.success) {
            throw new PanelShotError(
                `the browser refused: ${new TextDecoder().decode(run.stderr)}`,
            );
        }
    } finally {
        await Deno.remove(profile, { recursive: true });
        await preview.stop();
    }
}

/** One picture per region asked for, named for it, into a directory of the caller's choosing. */
export async function writeGivingWayShots(
    browser: string,
    regions: readonly string[],
    into: string,
): Promise<string[]> {
    assert(into.length > 0, "a set of pictures is written somewhere");
    await Deno.mkdir(into, { recursive: true });
    const written: string[] = [];
    for (const region of regions) {
        const bundle = await readGivingWayBundle([region]);
        const path = `${into}/giving-way-${region}.png`;
        await writeGivingWayShot(browser, bundle, path);
        await Deno.stat(path);
        written.push(path);
    }
    assertStrictEquals(written.length, regions.length, "one picture per region asked for");
    return written;
}

if (import.meta.main) {
    const parsed = parseArgs(Deno.args, {
        string: ["region", "into", "port", "browser"],
        boolean: ["shots"],
        collect: ["region"],
    });
    const asked = parsed.region ?? [];
    const regions = asked.length > 0 ? asked : GIVING_WAY_REGIONS;
    const unknown = getRegionsUnknown(regions);
    if (unknown.length > 0) {
        throw new PanelShotError(`no region of the panel is called ${unknown.join(", ")}`);
    }
    if (parsed.shots) {
        const browser = await readInstalledBrowser(
            getBrowserAsked(parsed.browser ?? null, Deno.env.get(BROWSER_VARIABLE) ?? null),
        );
        const into = parsed.into ?? "dist/giving-way";
        for (const path of await writeGivingWayShots(browser, regions, into)) console.log(path);
        console.log(`${regions.length} of them, and ${BROWSER_VARIABLE} names the browser`);
    } else {
        const bundle = await readGivingWayBundle(regions);
        const asked = parsed.port === undefined ? null : getIntegerFromText(parsed.port);
        const port = asked ?? DEFAULT_PORT;
        const preview = setPreviewServer({
            port,
            shouldWatch: false,
            readBundle: () => Promise.resolve(bundle),
        });
        console.log(`preview  ${preview.url}`);
        console.log(`giving way: ${regions.join(", ")}`);
        console.log("nothing here reaches what a reader installs; the tree is untouched");
    }
}
