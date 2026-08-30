/**
 * The panel, photographed, one picture per state worth showing.
 *
 * `DESIGN.md` owns the rule this obeys — _The Frame Is Not A Screen Rule_: a screenshot is a crop
 * of a real screen, so this refuses to shoot while `src/` carries anything not in a commit and
 * writes the commit beside the set. Whether the state shown is **reachable** no picture can say,
 * which is why opening every one before committing it stays a standing obligation.
 */

import { assert } from "@std/assert";
import { BUILD_VERSION } from "@/src/build-version.ts";
import { composeJsonWriting, getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { composeUserscriptFiles } from "@/tools/build-userscript.ts";
import { PanelShotError } from "@/tools/margometer-tool-error.ts";
import { setPreviewServer } from "@/tools/preview-server.ts";
import { getNewestRecordedFight, getRecordedFights } from "@/tools/recorded-fights.ts";

export const SHOT_DIRECTORY = "screenshots";
/** What the set was taken from, beside the set. The guard reads it, and so does a reader. */
export const SIDECAR_NAME = "taken-at.json";
/**
 * The sidecar is read by a person checking what a set was taken on, so it is indented — and at the
 * width `deno.json` states, because the gate formats every JSON file it tracks. Written narrower,
 * this tool left the tree unformatted after every run and `deno fmt` quietly widened it back.
 */
const SIDECAR_INDENT_SPACES = 4;
const BROWSER_VARIABLE = "MARGOMETER_BROWSER";
/** Chrome first: it is the browser Margonem is played in, and where the panel is measured. */
const BROWSER_CANDIDATES = ["google-chrome", "google-chrome-stable", "chromium"];
/**
 * What the measuring run is asked for, and the page says what it actually got: measured on
 * Chrome 152 (2026-08-29), `--dump-dom` floors the window at 500px wide while `--screenshot`
 * honours whatever it is given. So the frame is derived from the **viewport the page reported**,
 * never from this number — the two are the same only by accident.
 */
const MEASURING_WIDTH = 500;
/** `DESIGN.md`'s `panelInset`: the air the panel keeps from the corner it is anchored to. */
const PANEL_INSET = 8;
/** More than any frame this repository photographs, so a measurement past it is a finding. */
const MAXIMUM_FRAME_SIDE = 4000;

/** One picture, and the presses that reach the state it is of. */
export interface PanelShot {
    name: string;
    steps: string;
}

/**
 * What the set names, so the sidecar and the directory can be held to each other.
 *
 * The commit is written because a picture cannot say which build drew it, and the recording
 * because a figure in a picture means nothing without the fight it was counted over.
 */
export interface PanelShotRecord {
    commit: string;
    fight: string;
    takenAt: string;
    shots: string[];
}

/**
 * Tabs are addressed by position, never by their label: the labels are Polish and this file is
 * English (**L2**), and a strip that gains a tab is then caught by a guard rather than by a
 * picture of the wrong screen. The order is `composeNounTabs` then `composeDirectionTabs`
 * (`src/ui/panel-screen.ts`), so two nouns are followed by two directions.
 */
const TAB_DAMAGE_TAKEN = 3;

export function composePanelShots(): PanelShot[] {
    const shots: PanelShot[] = [
        { name: "panel-ranking.png", steps: `setPressed("[data-screen]", ${TAB_DAMAGE_TAKEN});` },
        {
            name: "panel-opened.png",
            steps:
                `setPressed("[data-screen]", ${TAB_DAMAGE_TAKEN});\nsetPressed("[data-row]", 0);`,
        },
        {
            name: "panel-deep.png",
            steps: `setPressed("[data-screen]", ${TAB_DAMAGE_TAKEN});\n` +
                `setPressed("[data-row]", 0);\nsetPressed("[data-row]", 0);`,
        },
        {
            name: "panel-card.png",
            steps:
                `setPressed("[data-screen]", ${TAB_DAMAGE_TAKEN});\nsetHovered("[data-tip]", 0);`,
        },
        { name: "panel-shelf.png", steps: `setPressed("[data-shelf]", 0);` },
    ];
    assert(shots.length > 1, "a set is more than one picture");
    assert(new Set(shots.map((shot) => shot.name)).size === shots.length, "each named once");
    return shots;
}

/**
 * The presses that reach a state, with the helpers under them. A press and never a click: the
 * panel listens for `pointerdown` (`src/ui/panel-element.ts`), and `node.click()` fires nothing
 * at all — which in v1 reported four successful shots of three identical pictures.
 */
export function composeShotScript(steps: string): string {
    assert(steps.length > 0, "a picture is of a state something reached");
    assert(steps.includes("set"), "and a state is reached by doing something");
    return `var getPanelHost = function () {
  var host = document.getElementById("MargoMeter-Panel");
  if (host === null) throw new ReferenceError("there is no panel on this page");
  return host;
};

var setPressed = function (selector, at) {
  var found = getPanelHost().shadowRoot.querySelectorAll(selector);
  if (found[at] === undefined) return false;
  found[at].dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, composed: true, button: 0
  }));
  return true;
};

var setHovered = function (selector, at) {
  var found = getPanelHost().shadowRoot.querySelectorAll(selector);
  if (found[at] === undefined) return false;
  var over = found[at].getBoundingClientRect();
  found[at].dispatchEvent(new PointerEvent("pointermove", {
    bubbles: true, composed: true, clientY: over.top + over.height / 2
  }));
  return true;
};

${steps}

// The card region stands in the panel whether or not a card is open, and an unopened one
// measures nothing — so a rect of no width is not a card to make room for.
var strip = document.querySelector(".preview-strip");
if (strip !== null) strip.style.display = "none";
var intro = document.querySelector(".preview-intro");
if (intro !== null) intro.style.display = "none";

var shownHost = getPanelHost();
shownHost.style.maxHeight = "none";

var report = document.createElement("pre");
report.id = "preview-report";
report.hidden = true;
var box = shownHost.getBoundingClientRect();
var card = shownHost.shadowRoot.querySelector(".MargoMeter-tip");
var over = card === null ? null : card.getBoundingClientRect();
if (over !== null && over.width === 0) over = null;
report.textContent = JSON.stringify({
  viewport: window.innerWidth,
  left: Math.floor(over === null ? box.left : Math.min(box.left, over.left)),
  bottom: Math.ceil(over === null ? box.bottom : Math.max(box.bottom, over.bottom)),
  rows: shownHost.shadowRoot.querySelectorAll("[data-row]").length
});
document.body.append(report);`;
}

/** The report the page wrote, read out of a dumped document by walking it — **C7**. */
export function getReportFromDom(dom: string): Record<string, unknown> {
    const marked = dom.indexOf(`id="preview-report"`);
    if (marked === -1) throw new PanelShotError("the page wrote down nothing about the panel");
    const opened = dom.indexOf(">", marked);
    const closed = dom.indexOf("</pre>", opened);
    if (opened === -1) throw new PanelShotError("the report never closed its own tag");
    if (closed === -1) throw new PanelShotError("the report never closed its own element");
    const reading = getJsonReading(dom.slice(opened + 1, closed));
    if (!reading.isOk) {
        throw new PanelShotError("the report is not JSON this tool can read", {
            cause: reading.cause,
        });
    }
    const written = reading.value;
    if (!isRecord(written)) throw new PanelShotError("the report is not a record");
    assert(closed > opened, "a report ends after it begins");
    assert(isRecord(written), "and what it holds is keyed");
    return written;
}

function getEdgeFromReport(report: Record<string, unknown>, name: string): number {
    const stated = report[name];
    if (typeof stated !== "number") throw new PanelShotError(`the page stated no ${name}`);
    if (!Number.isFinite(stated)) throw new PanelShotError(`the page stated no real ${name}`);
    assert(Number.isFinite(stated), "an edge that was read is a number");
    assert(Math.abs(stated) <= MAXIMUM_FRAME_SIDE, "and one a frame could hold");
    return stated;
}

/**
 * The frame the shot is taken at, from where the panel and its card landed while measuring.
 *
 * Everything drawn is anchored to the right edge of the viewport — the panel at its inset, the
 * card at a fixed distance further left — so the distance from the leftmost edge to that right
 * edge is what a frame has to hold, whatever width it was measured at.
 */
export function composeFrameFromReport(report: Record<string, unknown>): [number, number] {
    const viewport = getEdgeFromReport(report, "viewport");
    const left = getEdgeFromReport(report, "left");
    const bottom = getEdgeFromReport(report, "bottom");
    if (viewport <= 0) throw new PanelShotError("the page stood in no viewport at all");
    if (bottom <= 0) throw new PanelShotError("a panel nobody can see is not a picture");
    const width = Math.ceil(viewport - left + PANEL_INSET);
    const height = Math.ceil(bottom + PANEL_INSET);
    assert(width > PANEL_INSET, "a frame holds the panel and the air beside it");
    assert(height > PANEL_INSET, "on both sides of it");
    return [width, height];
}

/**
 * Which browser takes the pictures: what was asked for, then what the environment names, then
 * whatever is on the path. Chrome leads the candidates because it is the browser the game is
 * played in, and a picture taken in another engine is a picture of another layout.
 */
export function getBrowserAsked(argued: string | null, named: string | null): string[] {
    const candidates: string[] = [];
    if (argued !== null) candidates.push(argued);
    if (named !== null) candidates.push(named);
    for (const candidate of BROWSER_CANDIDATES) candidates.push(candidate);
    assert(candidates.length >= BROWSER_CANDIDATES.length, "there is somewhere to look");
    assert(candidates.every((one) => one.length > 0), "and each place looked in is named");
    return candidates;
}

async function getBrowserFound(candidates: readonly string[]): Promise<string> {
    assert(candidates.length > 0, "somewhere to look was named");
    for (const candidate of candidates) {
        try {
            const asked = await new Deno.Command(candidate, { args: ["--version"] }).output();
            if (asked.success) return candidate;
        } catch {
            // Not on the path under that name, which is the question this was asking.
            continue;
        }
    }
    throw new PanelShotError(`no browser to photograph with: tried ${candidates.join(", ")}`);
}

async function readBrowserOutput(browser: string, args: readonly string[]): Promise<string> {
    assert(browser.length > 0, "a browser was found before it is run");
    // A profile of its own, always: a shared one is shared state between two runs.
    const profile = await Deno.makeTempDir({ prefix: "margometer-profile-" });
    try {
        const run = await new Deno.Command(browser, {
            args: [
                "--headless=new",
                "--disable-gpu",
                "--no-first-run",
                "--hide-scrollbars",
                `--user-data-dir=${profile}`,
                ...args,
            ],
        }).output();
        if (!run.success) {
            const said = new TextDecoder().decode(run.stderr);
            throw new PanelShotError(`the browser refused: ${said}`);
        }
        return new TextDecoder().decode(run.stdout);
    } finally {
        await Deno.remove(profile, { recursive: true });
    }
}

/**
 * The panel measured, then photographed at the size it measured. Two runs rather than one: a
 * window taller than the panel photographs background, and nothing here can crop an image.
 */
async function writeShotOfAddress(browser: string, address: string, path: string): Promise<void> {
    assert(path.endsWith(".png"), "a picture is written as one");
    const dumped = await readBrowserOutput(browser, [
        `--window-size=${MEASURING_WIDTH},900`,
        "--dump-dom",
        address,
    ]);
    const [width, height] = composeFrameFromReport(getReportFromDom(dumped));
    const frame = `--window-size=${width},${height}`;
    await readBrowserOutput(browser, [frame, `--screenshot=${path}`, address]);
    assert(width > 0, "a picture was asked for at a frame something was measured into");
    assert(height > 0, "on both sides of it");
}

async function readGitSaying(args: readonly string[]): Promise<string> {
    assert(args.length > 0, "git is asked something");
    const asked = await new Deno.Command("git", { args: [...args] }).output();
    if (!asked.success) {
        throw new PanelShotError(`git would not answer ${args.join(" ")}`);
    }
    assert(asked.success, "and answered before its answer is read");
    return new TextDecoder().decode(asked.stdout).trim();
}

/**
 * The commit the set comes from, or a refusal. `DESIGN.md`: a set taken over a tree carrying
 * uncommitted work says it came from a build nobody can check out.
 */
async function getCommitForShots(): Promise<string> {
    const carried = await readGitSaying(["status", "--porcelain", "--", "src"]);
    if (carried.length > 0) {
        throw new PanelShotError(`src/ carries what no commit holds:\n${carried}`);
    }
    const commit = await readGitSaying(["rev-parse", "HEAD"]);
    assert(commit.length > 0, "a commit the set can be checked against was named");
    assert(!commit.includes("\n"), "and it is one commit");
    return commit;
}

/** Everything the set names, and nothing else: a leftover picture must not look current. */
async function setShotsMovedIn(staging: string, record: PanelShotRecord): Promise<void> {
    assert(record.shots.length > 0, "a set that is moved in has pictures in it");
    await Deno.mkdir(SHOT_DIRECTORY, { recursive: true });
    const kept = new Set<string>([...record.shots, SIDECAR_NAME]);
    for (const entry of Deno.readDirSync(SHOT_DIRECTORY)) {
        if (kept.has(entry.name)) continue;
        await Deno.remove(`${SHOT_DIRECTORY}/${entry.name}`);
    }
    for (const name of record.shots) {
        await Deno.copyFile(`${staging}/${name}`, `${SHOT_DIRECTORY}/${name}`);
    }
    const writing = composeJsonWriting(record, SIDECAR_INDENT_SPACES);
    if (!writing.isOk) {
        throw new PanelShotError("the sidecar naming the set cannot be written", {
            cause: writing.cause,
        });
    }
    await Deno.writeTextFile(`${SHOT_DIRECTORY}/${SIDECAR_NAME}`, `${writing.text}\n`);
    assert(kept.size === record.shots.length + 1, "the sidecar stands beside the set it names");
}

/**
 * The whole set, into a directory of its own first. A run that fails part-way must not take the
 * pictures with it: a machine with no browser would otherwise be left holding a `screenshots/`
 * that a README points at and that is empty.
 */
export async function writePanelShots(browser: string): Promise<PanelShotRecord> {
    const commit = await getCommitForShots();
    const fight = getNewestRecordedFight(getRecordedFights());
    const shots = composePanelShots();
    const built = await composeUserscriptFiles(BUILD_VERSION);
    const staging = await Deno.makeTempDir({ prefix: "margometer-shots-" });
    try {
        for (const shot of shots) {
            const preview = setPreviewServer({
                port: 0,
                shouldWatch: false,
                readBundle: () => Promise.resolve(built.script),
                appendedScript: composeShotScript(shot.steps),
            });
            try {
                const at = `entry=${fight.calls.length}`;
                const named = `fight=${encodeURIComponent(fight.name)}`;
                await writeShotOfAddress(
                    browser,
                    `${preview.url}/?${named}&${at}`,
                    `${staging}/${shot.name}`,
                );
            } finally {
                await preview.stop();
            }
        }
        for (const shot of shots) await Deno.stat(`${staging}/${shot.name}`);
        const record: PanelShotRecord = {
            commit,
            fight: fight.name,
            takenAt: new Date().toISOString(),
            shots: shots.map((shot) => shot.name),
        };
        await setShotsMovedIn(staging, record);
        assert(record.shots.length === shots.length, "every picture asked for was moved in");
        return record;
    } finally {
        await Deno.remove(staging, { recursive: true });
    }
}

if (import.meta.main) {
    const browserAt = Deno.args.indexOf("--browser");
    const argued = browserAt === -1 ? null : (Deno.args[browserAt + 1] ?? null);
    const browser = await getBrowserFound(
        getBrowserAsked(argued, Deno.env.get(BROWSER_VARIABLE) ?? null),
    );
    const record = await writePanelShots(browser);
    console.log(`${SHOT_DIRECTORY}, ${record.shots.length} pictures, taken with ${browser}`);
    console.log(`over ${record.fight}, at ${record.commit}`);
    console.log("open every one before committing it — DESIGN.md leaves nobody an exemption");
}
