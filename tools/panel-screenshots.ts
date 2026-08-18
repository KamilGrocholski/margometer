/**
 * What the panel looks like, as pictures somebody can put in a README.
 *
 * The add-on's surface is a drawn panel, and `README.md` could describe it or
 * link to the published preview but could not show it. A visitor who will not
 * install an unauthorised userscript into a game — the default this repository
 * argues for on the reader's behalf — had nothing to look at.
 *
 * **It photographs one release and no more.** The set is overwritten, never
 * accumulated: `screenshots/taken-at.json` names the version it was taken at and
 * `tests/tools/panel-screenshots.test.ts` holds that against `package.json`, so a
 * version bump turns the gate red until the pictures are retaken. Which is the
 * whole of "update the screenshots after a release", moved off a checklist and
 * onto a machine.
 *
 * ⚠️ **A spec rejected this once**, and the objection was specific:
 * `docs/specs/2026-08-17-a-panel-you-can-watch-change.md` refused a `--screenshot`
 * mode inside `tools/preview-server.ts` because it would hard-wire
 * `/usr/bin/firefox` and a profile's download preferences into a server whose job
 * is to print a URL. Neither is true here — the browser is discovered and refused
 * loudly when absent, this tool downloads nothing, and the server learned one
 * option rather than a second purpose. The rejection stands for what it rejected;
 * `docs/specs/2026-08-18-a-picture-of-the-panel.md` records the difference.
 *
 * ⚠️ **Everything the browser runs is in `SHOT_SCRIPT` below, and the guards read
 * it as source.** `tests/tools/source-layout.test.ts` strips comments and leaves
 * string literals alone, so the JavaScript in that template is held to the same
 * rules as the TypeScript around it: verbs on function names, prefixes on
 * booleans, and none of the value readers `libs/` owns. It is also why no Polish
 * appears in it — the panel's own labels are Polish and this file may not spell
 * one (§3), so the tab being clicked is addressed by position, computed from
 * `composeDirectionTabs` rather than typed in.
 */

import {
  closeSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { composeJsonText } from "@/libs/json.ts";
import { composeIntegerText } from "@/libs/number.ts";
import manifest from "@/package.json";
import { composeDefaultState } from "@/src/ui/panel-state.ts";
import { composeDirectionTabs } from "@/src/ui/panel-metric.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";
import { setPreviewServer } from "@/tools/preview-server.ts";

export class PanelScreenshotError extends MargoMeterToolError {
  constructor(reason: string, options?: ErrorOptions) {
    super("PanelScreenshot", reason, options);
  }
}

export const SCREENSHOTS_DIRECTORY = new URL("../screenshots/", import.meta.url).pathname;

/** The sidecar, and the only text in that directory — everything else is an image. */
export const TAKEN_AT_NAME = "taken-at.json";

/**
 * One picture: what the driver does to reach it, and how big a window it needs.
 *
 * ⚠️ **The sizes were set by eye, not measured.** The panel is 260px wide
 * (`src/ui/panel-tokens.ts`) and as tall as the fight makes it, capped at 66vh —
 * so a window is snug for one capture and loose for the next, and there is no
 * number to compute from. They were chosen by looking at the output on the
 * capture named in the sidecar, and they are flags because the next recording
 * will want different ones.
 */
export type PanelShot = {
  name: string;
  width: number;
  height: number;
};

/**
 * Damage taken, drilled to the bottom, plus the card.
 *
 * The chain is deliberate: the ranking answers *who*, and the two levels under it
 * answer *what that figure is made of* — which is the thing prose cannot show and
 * the reason a reader is being shown a picture at all. The card is photographed
 * once because it is the same card at every level
 * (`src/ui/panel-combatant-detail.ts`), and it is the shot that needs a wide
 * window: it opens beside the panel, and `src/ui/panel-tip-placement.ts` keeps all
 * of it on screen, so too narrow a window moves it rather than clipping it and the
 * picture would be honest and useless.
 */
export const PANEL_SHOTS: PanelShot[] = [
  { name: "taken", width: 292, height: 480 },
  { name: "breakdown", width: 292, height: 656 },
  { name: "deep", width: 292, height: 448 },
  { name: "tip", width: 560, height: 488 },
];

export function composeShotFileName(shot: PanelShot): string {
  return `panel-${shot.name}.png`;
}

/**
 * Which tab in the lower strip turns the figure round.
 *
 * Computed rather than typed: the strip is drawn from `composeDirectionTabs`, so
 * asking it where `taken` sits keeps this file from spelling either the Polish
 * label or an index that a fifth screen would silently invalidate.
 */
export const TAKEN_TAB_INDEX = composeDirectionTabs(composeDefaultState().metric)
  .findIndex((tab) => tab.metric === "taken");

/**
 * The classes the driver reaches through, spelled once.
 *
 * The panel names its own nodes and this file has to name three of them to click
 * them — the §9.3 case exactly, a name two files spell with nothing catching a
 * disagreement. Nothing here would fail loudly: a renamed class means
 * `querySelector` answers `null`, the marker draws, and the only cost is a set of
 * screenshots that has to be taken again. `tests/tools/panel-screenshots.test.ts`
 * holds every one of these to what `src/ui/panel-element.ts` actually assigns, so
 * the rename is caught in the gate instead of in a picture.
 */
export const SHOT_CLASSES = {
  row: "row",
  drillable: "drillable",
  tab: "tab",
  sidesOf: "sides-of",
  tabs: "tabs",
} as const;

/**
 * The second half of the page's driver: strip gone, panel put where the shot
 * wants it.
 *
 * It runs synchronously after the replay and before `load`, which is the whole
 * reason it can be a script rather than a browser automation library — Firefox's
 * `--screenshot` waits for `load` and nothing after it, the panel mounts on its
 * first look (`src/game/engine-attachment.ts`) and re-renders inside the event
 * that caused it (`src/ui/panel-element.ts`), so every state below is reached and
 * drawn before the shutter.
 *
 * ⚠️ **`pointerdown`, never `click`.** The panel moved its tabs and rows off
 * `click` because a payload landing between a press and its release detaches the
 * pressed node and the browser then dispatches no click at all
 * (`docs/specs/2026-08-18-a-gesture-a-redraw-cannot-split.md`). `node.click()`
 * here fired nothing and cost a full set of screenshots that looked right —
 * three identical pictures of the ranking, one per drill level, and the only sign
 * was that all three files were the same size. The card is the exception and
 * genuinely wants `pointerover`.
 *
 * ⚠️ **A shot that cannot reach its state must not come back looking like a
 * panel.** A missing row is the failure with no symptom: the click does nothing,
 * the ranking photographs beautifully, and the picture goes in the README labelled
 * as a breakdown. So the page is replaced with a marker naming the shot and what
 * was missing — §9.6's rule about a figure that might be wrong, applied to the
 * tool that photographs one.
 */
const SHOT_SCRIPT = `
(function setShotApplied() {
  var shot = new URL(window.location.href).searchParams.get("shot");
  if (shot === null) return;

  function setMarked(detail) {
    document.body.innerHTML = "";
    var marker = document.createElement("pre");
    marker.style.cssText =
      "margin:0;padding:24px;background:#7a1d1d;color:#fff;font:16px/1.5 monospace;white-space:pre-wrap";
    marker.textContent = "SHOT FAILED: " + shot + "\\n" + detail;
    document.body.append(marker);
  }

  var strip = document.querySelector(".preview-strip");
  if (strip !== null) strip.remove();

  var host = document.getElementById("MargoMeter-Panel");
  if (host === null) {
    setMarked("no element with id MargoMeter-Panel — the add-on did not mount");
    return;
  }
  var root = host.shadowRoot;
  if (root === null) {
    setMarked("the panel host has no open shadow root");
    return;
  }
  host.style.maxHeight = "none";

  function setPressed(node) {
    node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
  }

  function setOpened(what) {
    var row = root.querySelector(".${SHOT_CLASSES.row}.${SHOT_CLASSES.drillable}");
    if (row === null) {
      setMarked("no drillable row to open for " + what);
      return false;
    }
    setPressed(row);
    return true;
  }

  var directions = root.querySelectorAll(
    ".${SHOT_CLASSES.tabs}.${SHOT_CLASSES.sidesOf} .${SHOT_CLASSES.tab}",
  );
  var direction = directions[${composeIntegerText(TAKEN_TAB_INDEX)}];
  if (direction === undefined) {
    setMarked("the direction strip has no tab at index ${composeIntegerText(TAKEN_TAB_INDEX)}");
    return;
  }
  setPressed(direction);

  if (shot === "breakdown" || shot === "deep") {
    if (!setOpened("the breakdown")) return;
  }
  if (shot === "deep") {
    if (!setOpened("the deepest level")) return;
  }
  if (shot === "tip") {
    var hovered = root.querySelector(".${SHOT_CLASSES.row}");
    if (hovered === null) {
      setMarked("no row to hover for the card");
      return;
    }
    hovered.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
  }
})();
`;

/**
 * Where the browser is, asked of the caller and then of the path.
 *
 * ⚠️ **Never a hard-wired `/usr/bin/firefox`** — that is the thing the spec
 * refused, and it is refused here for its own reason as well: a tool that silently
 * finds no browser and writes nothing is a tool that appears to have worked.
 */
export function getBrowserCommand(asked: string | null): string {
  const named = asked ?? process.env["MARGOMETER_BROWSER"] ?? null;
  const wanted = named === null || named === "" ? "firefox" : named;
  // Resolves a bare name against PATH and an absolute one against the file, and
  // answers null for anything that is not there or not executable — so the
  // refusal below covers both ways of naming a browser that cannot be run.
  const found = Bun.which(wanted);
  if (found === null) {
    throw new PanelScreenshotError(
      `no browser at ${wanted}: pass --browser <path>, or set MARGOMETER_BROWSER, or put firefox on PATH`,
    );
  }
  return found;
}

export function composeShotAddress(url: string, fightName: string, entryIndex: number, shot: PanelShot): string {
  const address = new URL(url);
  address.searchParams.set("fight", fightName);
  address.searchParams.set("entry", composeIntegerText(entryIndex));
  address.searchParams.set("shot", shot.name);
  return address.href;
}

/**
 * One picture, in a browser that has never seen this page before.
 *
 * A fresh profile every time, for the reason `.claude/skills/verify/SKILL.md`
 * gives: a shared one carries the panel position from the last drag, so the second
 * shot of a session would be of a panel somebody had already moved.
 *
 * ⚠️ **Asynchronous, and that is not a style choice — `spawnSync` deadlocks
 * here.** The preview server runs in this process, so a synchronous spawn blocks
 * the loop that would answer the browser's request: the page never arrives, the
 * browser waits for it, and the tool waits for the browser until its own timeout.
 * Measured both ways on the same address — 1.1 s against a server in another
 * process, and the full two minutes against this one, writing nothing. Nothing
 * about the browser or its flags is involved, which is why it looked like a
 * browser fault for as long as it was one command being blamed.
 *
 * ⚠️ **Headless comes from `MOZ_HEADLESS`, not from `--headless`.** That is the
 * recipe in the skill, which is the one that has been run.
 *
 * The output goes to a file rather than a pipe because a refusal has to be
 * readable after the fact, and because a pipe is held open by whatever content
 * process outlives the one we spawned.
 */
async function writeShot(
  browser: string,
  address: string,
  shot: PanelShot,
  path: string,
): Promise<void> {
  const profile = mkdtempSync(`${tmpdir()}/margometer-shot-`);
  const logPath = `${profile}/browser.log`;
  const log = openSync(logPath, "w");
  try {
    const child = Bun.spawn({
      cmd: [
        browser,
        "--profile", profile,
        "--no-remote",
        "--window-size", `${composeIntegerText(shot.width)},${composeIntegerText(shot.height)}`,
        "--screenshot", path,
        address,
      ],
      stdio: ["ignore", log, log],
      env: { ...process.env, MOZ_HEADLESS: "1" },
      timeout: 120_000,
    });
    const status = await child.exited;
    if (status !== 0) {
      throw new PanelScreenshotError(
        `${browser} refused shot ${shot.name}: ${readFileSync(logPath, "utf8")}`,
      );
    }
  } finally {
    closeSync(log);
    rmSync(profile, { recursive: true, force: true });
  }
}

/** What the directory says about itself, so a guard can ask which release it is of. */
export type TakenAt = {
  version: string;
  fight: string;
  takenAt: string;
  images: string[];
};

export function composeTakenAt(fightName: string, takenAt: string): TakenAt {
  return {
    version: manifest.version,
    fight: fightName,
    takenAt,
    images: PANEL_SHOTS.map(composeShotFileName),
  };
}

export function getFightByName(name: string | null): (typeof CAPTURED_FIGHTS)[number] {
  const fight = name === null ? CAPTURED_FIGHTS.at(-1) : CAPTURED_FIGHTS.find((c) => c.name === name);
  if (fight === undefined) {
    throw new PanelScreenshotError(
      name === null ? "no captured fights to photograph" : `no capture named ${name}`,
    );
  }
  return fight;
}

/**
 * Every shot, and the directory left holding exactly them.
 *
 * ⚠️ **The pictures are taken somewhere else and moved in at the end.** Removing
 * the directory first and shooting into it is the obvious order and it is wrong:
 * a browser that will not start — a wrong `--browser`, a machine with none —
 * leaves the repository with no screenshots at all and a README pointing at four
 * files that are gone. Paid for by the test that names a browser nothing can
 * find, which deleted the committed set on its way to failing.
 *
 * The set is still replaced rather than merged. A file left over from a set that
 * used to be larger would sit there looking current, which is the thing the
 * sidecar exists to make impossible.
 */
export async function writePanelScreenshots(options: {
  fightName?: string | null | undefined;
  browser?: string | null | undefined;
}): Promise<string[]> {
  const fight = getFightByName(options.fightName ?? null);
  const browser = getBrowserCommand(options.browser ?? null);

  const staging = mkdtempSync(`${tmpdir()}/margometer-shots-`);
  const server = setPreviewServer({ shouldWatch: false, appendedScript: SHOT_SCRIPT });
  const written: string[] = [];
  try {
    for (const shot of PANEL_SHOTS) {
      const name = composeShotFileName(shot);
      const address = composeShotAddress(server.url, fight.name, fight.dump.calls.length, shot);
      await writeShot(browser, address, shot, `${staging}/${name}`);
      written.push(name);
    }

    rmSync(SCREENSHOTS_DIRECTORY, { recursive: true, force: true });
    mkdirSync(SCREENSHOTS_DIRECTORY, { recursive: true });
    for (const name of written) {
      copyFileSync(`${staging}/${name}`, SCREENSHOTS_DIRECTORY + name);
    }
    const takenAt = composeTakenAt(fight.name, new Date().toISOString());
    writeFileSync(SCREENSHOTS_DIRECTORY + TAKEN_AT_NAME, `${composeJsonText(takenAt, 2)}\n`);
  } finally {
    server.stop();
    rmSync(staging, { recursive: true, force: true });
  }
  return written;
}

/** What is in the directory now, which is what the guard compares against the sidecar. */
export function getScreenshotFileNames(): string[] {
  return readdirSync(SCREENSHOTS_DIRECTORY).sort();
}

function removeFlagText(argv: string[], flag: string): string | null {
  const at = argv.indexOf(flag);
  if (at === -1) return null;
  const text = argv[at + 1];
  if (text === undefined) throw new PanelScreenshotError(`${flag} takes a value`);
  argv.splice(at, 2);
  return text;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const fightName = removeFlagText(argv, "--fight");
  const browser = removeFlagText(argv, "--browser");
  if (argv.length > 0) {
    console.log("usage: bun tools/panel-screenshots.ts [--fight <capture>] [--browser <path>]");
  } else {
    const written = await writePanelScreenshots({ fightName, browser });
    for (const name of written) console.log(`→ screenshots/${name}`);
    console.log(`→ screenshots/${TAKEN_AT_NAME}`);
  }
}
