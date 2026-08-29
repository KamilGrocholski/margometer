/**
 * A page that runs the real add-on against a recording, so the panel can be looked at.
 *
 * `DESIGN.md` puts a standing obligation on anybody committing a picture of the panel: open it
 * first. Nothing in the tree could open one. This writes a file a browser opens from disk — no
 * server, no network, no game — carrying the built bundle, every recording's engine calls, and a
 * driver that feeds one recording's calls to the wrap the add-on puts on.
 *
 * The game it stands up is this file's, not a recording's. A recording carries the world and the
 * build and no map or tile, so the place the bar draws is stubbed under a name of the tool's.
 */

import { assert } from "@std/assert";
import { BUILD_VERSION } from "@/src/build-version.ts";
import { getValueFromJsonText, isRecord } from "@/src/core/unknown-reading.ts";
import { PreviewBuildError } from "@/tools/margometer-tool-error.ts";
import { buildUserscript } from "@/tools/build-userscript.ts";

const CAPTURE_DIRECTORY = "captures";
const PREVIEW_FILE = "dist/preview.html";
const USERSCRIPT_FILE = "dist/margometer.user.js";
/** A fight holds twenty and a long one runs to thousands of calls; this is well past both. */
const MAXIMUM_CALLS = 100000;

export interface Recording {
    name: string;
    calls: unknown[];
}

function getRecordingNames(): string[] {
    const names: string[] = [];
    for (const entry of Deno.readDirSync(CAPTURE_DIRECTORY)) {
        if (!entry.name.endsWith(".json")) continue;
        names.push(entry.name);
    }
    if (names.length === 0) {
        throw new PreviewBuildError("there is no recording to draw");
    }
    assert(new Set(names).size === names.length, "a recording is listed once");
    return names.sort();
}

/** The engine calls a recording holds, in the order the game made them. */
function getRecordingCalls(name: string): unknown[] {
    const document = getValueFromJsonText(Deno.readTextFileSync(`${CAPTURE_DIRECTORY}/${name}`));
    if (!isRecord(document)) {
        throw new PreviewBuildError(`${name} is not a record`);
    }
    const entries = document.wpisy;
    if (!Array.isArray(entries)) {
        throw new PreviewBuildError(`${name} lists no calls`);
    }
    const calls: unknown[] = [];
    assert(entries.length <= MAXIMUM_CALLS, "a recording stays inside its stated bound");
    for (const entry of entries) {
        if (!isRecord(entry)) continue;
        if (!("ladunek" in entry)) continue;
        calls.push(entry.ladunek);
    }
    if (calls.length === 0) {
        throw new PreviewBuildError(`${name} carries no call the add-on would see`);
    }
    return calls;
}

function composeRecordings(): Recording[] {
    const recordings: Recording[] = [];
    for (const name of getRecordingNames()) {
        const calls = getRecordingCalls(name);
        assert(calls.length > 0, "a recording that is carried has something to play");
        recordings.push({ name, calls });
    }
    assert(recordings.length > 0, "a preview draws at least one fight");
    return recordings;
}

/**
 * A game, stood up before the add-on loads. The add-on looks for one the moment it starts and
 * only polls after that, so standing it up first is what makes the first look the one that finds
 * it — a page that sets it afterwards works too, and draws nothing for as long as the poll takes.
 */
function composePreviewGame(): string {
    const stood = `window.__margometerHeld =
  JSON.parse(document.getElementById("recordings").textContent);
window.__margometerPicked = (function () {
  const asked = decodeURIComponent(location.hash.slice(1));
  const held = window.__margometerHeld;
  return held.some((one) => one.name === asked) ? asked : held[0].name;
})();
window.Engine = {
  battle: { updateData: function () { return 1; } },
  // A place of the tool's own, named so nobody reads it as a recording's: the recordings carry
  // the world and the build and no map or tile, so there is no real place to put here.
  map: { d: { name: "Podgl\u0105d" } },
  hero: { d: { x: 1, y: 1 } }
};`;
    assert(stood.includes("window.Engine"), "a game stands where the add-on looks for one");
    assert(stood.includes("updateData"), "carrying the call the add-on puts its wrap on");
    assert(stood.includes("map"), "and a place, which no recording carries and the bar draws");
    return stood;
}

/** The calls, fed to whatever the add-on put in the game's place. */
function composePreviewDriver(): string {
    const driver = `const held = window.__margometerHeld;
const picker = document.getElementById("recording");
for (const one of held) {
  const option = document.createElement("option");
  option.value = one.name;
  option.textContent = one.name;
  picker.append(option);
}
picker.value = window.__margometerPicked;
picker.addEventListener("change", function () {
  // A fight at a time, and the page reloads between them: the add-on keeps a shelf and a screen,
  // and carrying either into the next recording would show a state no reader could reach.
  location.hash = picker.value;
  location.reload();
});
const found = held.find(function (one) { return one.name === window.__margometerPicked; });
if (found !== undefined) {
  for (const call of found.calls) window.Engine.battle.updateData(call);
}`;
    assert(driver.includes("updateData"), "the calls reach whatever took the game's place");
    assert(driver.includes("location.reload"), "and the next fight starts on a page of its own");
    return driver;
}

/** Nothing of ours reaches a page as markup, so the one thing that could is spelled out. */
function composeEscapedJson(value: unknown): string {
    const written = JSON.stringify(value);
    assert(typeof written === "string", "a recording is written out as text");
    return written.split("<").join("\\u003c");
}

export function composePreviewPage(bundle: string, recordings: readonly Recording[]): string {
    assert(bundle.length > 0, "a preview carries the add-on it is a preview of");
    assert(recordings.length > 0, "and the fights it would draw");
    const held = recordings.map((one) => ({ name: one.name, calls: one.calls }));
    return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>MargoMeter — podgląd</title>
<style>
body { margin: 0; background: #0f0f13; color: #9a9aa6; font: 12px system-ui, sans-serif; }
label { display: block; padding: 8px; }
select { font: inherit; }
</style>
</head>
<body>
<label>Zapis walki <select id="recording"></select></label>
<script id="recordings" type="application/json">${composeEscapedJson(held)}</script>
<script>${composePreviewGame()}</script>
<script>${bundle.split("<\/script").join("<\\/script")}</script>
<script>${composePreviewDriver()}</script>
</body>
</html>
`;
}

export async function buildPreview(): Promise<string> {
    assert(PREVIEW_FILE.endsWith(".html"), "a page a browser opens is written as one");
    await buildUserscript(BUILD_VERSION);
    const bundle = await Deno.readTextFile(USERSCRIPT_FILE);
    if (bundle.length === 0) {
        throw new PreviewBuildError("the built file says nothing");
    }
    const recordings = composeRecordings();
    await Deno.writeTextFile(PREVIEW_FILE, composePreviewPage(bundle, recordings));
    assert(recordings.length > 0, "a page was written for the fights that were read");
    return PREVIEW_FILE;
}

if (import.meta.main) {
    const written = await buildPreview();
    console.log(written);
}
