/**
 * What the round stands on: the geometry the published page lays itself out by, the words its
 * band carries today, and the fight its landing copy opens on.
 *
 * Run by hand, and it earns no `deno task` entry because it has one consumer (**C9**):
 *
 *     deno task preview:site
 *     deno run -A design/instalacja/measure.ts
 */

import { assert } from "@std/assert";
import { PLACE, STANDING } from "@/src/ui/panel-look.ts";
import { PANEL_GAP, PANEL_INSET, getSheetPixels } from "@/tools/preview-windows.ts";
import { PREVIEW_INSTALL_OPENING } from "@/tools/preview-page.ts";
import { composeFightReplay } from "@/tools/fight-replay.ts";
import {
    getPreviewRecordedFight,
    getRecordedFights,
    type RecordedFight,
} from "@/tools/recorded-fights.ts";
import { PreviewBuildError } from "@/tools/margometer-tool-error.ts";

/**
 * The built page and not the module that writes it: `composeSiteInstall` is private to
 * `tools/preview-site.ts`, and what a visitor is handed is the file, not the function.
 */
const BUILT_PAGE = "dist/preview/index.html";
const MEASURED_FILE = "design/instalacja/measured.json";

/** The widths a desktop Chrome really opens at, which is the browser Margonem is played in. */
const VIEWPORT_WIDTHS = [1920, 1600, 1440, 1366, 1280, 1152, 1024, 900, 800];

/**
 * What one recording a visitor may watch takes, end to end, at the rate the page's own driver
 * steps at. The rate is a raw number inside the emitted script and is read off the built page.
 */
const MILLISECONDS_IN_A_SECOND = 1000;

/** More of anything than the page carries, so every walk below states its bound (**S2**). */
const MAXIMUM_STEPS = 64;
const MAXIMUM_CHARACTERS = 1_000_000;

interface MeasuredStep {
    order: number;
    isSilent: boolean;
    characters: number;
    links: number;
    text: string;
}

interface MeasuredColumn {
    viewportWidth: number;
    columnWidth: number;
    bandWidth: number;
    introWidth: number;
    windowsBeginAt: number;
    clearance: number;
    introClearance: number;
}

function readBuiltPage(): string {
    let page: string;
    try {
        page = Deno.readTextFileSync(BUILT_PAGE);
    } catch (cause) {
        throw new PreviewBuildError(`${BUILT_PAGE} is not there — run deno task preview:site`, {
            cause,
        });
    }
    assert(page.length > 0, "a built page carries something");
    assert(page.length < MAXIMUM_CHARACTERS, "and stays inside the size this walk is bounded by");
    return page;
}

/**
 * The digits after a marker, as the whole number they spell. **C7**: the page is walked, never
 * matched, so a marker that has moved returns null and the caller says which one.
 */
function readNumberAfter(text: string, marker: string): number | null {
    const at = text.indexOf(marker);
    if (at === -1) return null;
    let read = 0;
    let digits = 0;
    for (let index = at + marker.length; index < text.length; index += 1) {
        assert(digits < MAXIMUM_CHARACTERS, "a number stays inside the bound this walk states");
        const digit = "0123456789".indexOf(text.charAt(index));
        if (digit === -1) break;
        read = read * 10 + digit;
        digits += 1;
    }
    if (digits === 0) return null;
    return read;
}

function requireNumberAfter(text: string, marker: string): number {
    const read = readNumberAfter(text, marker);
    if (read === null) throw new PreviewBuildError(`nothing states a number after "${marker}"`);
    assert(read > 0, "and a length a page is laid out from is a length");
    return read;
}

/** One rule of the page's own sheet, so a number is read inside the rule that spends it. */
function readStyleRule(page: string, selector: string): string {
    const opens = page.indexOf(`${selector} {`);
    if (opens === -1) throw new PreviewBuildError(`the sheet states no ${selector} rule`);
    const closes = page.indexOf("}", opens);
    if (closes === -1) throw new PreviewBuildError(`the ${selector} rule is never closed`);
    const rule = page.slice(opens, closes);
    assert(rule.length > selector.length, "a rule that opened states something");
    return rule;
}

/** The band, from its own opening tag to the first close after it. */
function readInstallBand(page: string): string {
    const opens = page.indexOf(PREVIEW_INSTALL_OPENING);
    if (opens === -1) throw new PreviewBuildError("the built page opens with no install band");
    const closes = page.indexOf("</header>", opens);
    if (closes === -1) throw new PreviewBuildError("the install band is never closed");
    const band = page.slice(opens, closes);
    assert(band.length > 0, "a band that opened and closed holds something between");
    return band;
}

/** Tags dropped and entities left as the page spells them: what a person reads, in characters. */
function composeTextOfMarkup(markup: string): string {
    let text = "";
    let isInsideTag = false;
    for (const character of markup) {
        assert(text.length < MAXIMUM_CHARACTERS, "the text stays inside this walk's bound");
        if (character === "<") {
            isInsideTag = true;
            continue;
        }
        if (character === ">") {
            isInsideTag = false;
            continue;
        }
        if (isInsideTag) continue;
        text += character;
    }
    return text.trim();
}

function countOccurrences(text: string, marker: string): number {
    let found = 0;
    let at = text.indexOf(marker);
    while (at !== -1) {
        assert(found < MAXIMUM_STEPS * MAXIMUM_STEPS, "an occurrence count states its bound");
        found += 1;
        at = text.indexOf(marker, at + marker.length);
    }
    return found;
}

function composeMeasuredSteps(band: string): MeasuredStep[] {
    const steps: MeasuredStep[] = [];
    let at = band.indexOf("<li");
    while (at !== -1) {
        assert(steps.length < MAXIMUM_STEPS, "a band carries fewer steps than this walk allows");
        const closes = band.indexOf("</li>", at);
        if (closes === -1) throw new PreviewBuildError("a step in the band is never closed");
        const markup = band.slice(at, closes);
        const text = composeTextOfMarkup(markup);
        steps.push({
            order: steps.length + 1,
            isSilent: markup.indexOf('class="preview-warn"') !== -1,
            characters: text.length,
            links: countOccurrences(markup, "<a "),
            text,
        });
        at = band.indexOf("<li", closes);
    }
    assert(steps.length > 0, "the band states at least one step");
    return steps;
}

/**
 * What the band's column comes to at a width, and what is left between it and the windows.
 * `max-width` binds the content box, so the padding stands outside it — which is why a clearance
 * measured off the column alone would be 40px kinder than the page.
 */
function composeMeasuredColumns(
    emMaximum: number,
    fontPixels: number,
    reserved: number,
    paddingAcross: number,
    takenAcross: number,
    introPaddingAcross: number,
): MeasuredColumn[] {
    const columnMaximum = emMaximum * fontPixels;
    return VIEWPORT_WIDTHS.map((viewportWidth) => {
        const columnWidth = Math.min(columnMaximum, viewportWidth - reserved);
        const bandWidth = columnWidth + paddingAcross;
        const introWidth = columnMaximum + introPaddingAcross;
        const windowsBeginAt = viewportWidth - takenAcross;
        return {
            viewportWidth,
            columnWidth,
            bandWidth,
            introWidth,
            windowsBeginAt,
            clearance: windowsBeginAt - bandWidth,
            introClearance: windowsBeginAt - introWidth,
        };
    });
}

/**
 * How long each recording runs if a visitor presses play, and what the landing one comes to. The
 * driver feeds one engine call per tick, so a recording's entry count **is** its length in ticks:
 * a fight of 15 calls is over before a person has read the sentence above it.
 */
function composeMeasuredReplays(fights: readonly RecordedFight[], tick: number) {
    assert(tick > 0, "a replay steps at a rate somebody stated");
    const running = fights.map((fight) => ({
        name: fight.name,
        entries: fight.calls.length,
        seconds: Number((fight.calls.length * tick / MILLISECONDS_IN_A_SECOND).toFixed(2)),
    }));
    running.sort((one, other) => one.entries - other.entries);
    assert(running.length > 0, "there is a recording to time");
    return running;
}

/**
 * How far the hand travels between the control strip and the thing it controls. The strip is
 * anchored bottom-left and the panel top-right, so the two are in opposite corners and the
 * horizontal leg alone is decidable without a window height.
 */
function composeMeasuredReach(stripLeft: number, panelWidth: number, inset: number) {
    assert(stripLeft >= 0, "the strip stands off the edge it is anchored to");
    return VIEWPORT_WIDTHS.map((viewportWidth) => ({
        viewportWidth,
        stripLeft,
        panelLeft: viewportWidth - inset - panelWidth,
        travelAcross: viewportWidth - inset - panelWidth - stripLeft,
    }));
}

function composeMeasuredFight() {
    const fight = getPreviewRecordedFight(getRecordedFights());
    const replay = composeFightReplay(fight);
    const combatants = [...replay.roster.byId.values()].map((one) => {
        const figures = replay.statistics.byCombatantId.get(one.id);
        return {
            name: one.name,
            side: one.side,
            profession: one.profession,
            level: one.level,
            damageDealtApplied: figures === undefined ? 0 : figures.damageDealtApplied,
            damageTakenApplied: figures === undefined ? 0 : figures.damageTakenApplied,
            healthGiven: figures === undefined ? 0 : figures.healthGiven,
        };
    });
    combatants.sort((one, other) => other.damageDealtApplied - one.damageDealtApplied);
    assert(combatants.length > 0, "the fight the landing page opens on has a cast");
    return {
        name: replay.name,
        payloads: replay.reading.payloads,
        events: replay.reading.events.length,
        messagesRead: replay.reading.messagesRead,
        messagesLost: replay.reading.messagesLost,
        isOver: replay.reading.isOver,
        readerSide: replay.reading.readerSide,
        combatants,
        totals: {
            damageDealtApplied: replay.statistics.totals.damageDealtApplied,
            healthGiven: replay.statistics.totals.healthGiven,
            dealtByNobody: replay.statistics.dealtByNobody,
            takenByNobody: replay.statistics.takenByNobody,
            byNeitherEnd: replay.statistics.byNeitherEnd,
        },
    };
}

function composeMeasured() {
    const page = readBuiltPage();
    const bandMarkup = readInstallBand(page);
    const steps = composeMeasuredSteps(bandMarkup);

    const band = readStyleRule(page, ".preview-install");
    /**
     * The paragraph under the band takes the same `46em` and **not** the band's
     * `calc(100vw - …)` cap, so the two stop agreeing the moment the cap binds.
     */
    const intro = readStyleRule(page, ".preview-intro");

    const fontPixels = requireNumberAfter(page, "font: ");
    const emMaximum = requireNumberAfter(band, "max-width: min(");
    const reserved = requireNumberAfter(band, "calc(100vw - ");
    const paddingAcross = requireNumberAfter(band, "padding: ") * 2;
    const introEmMaximum = requireNumberAfter(intro, "max-width: ");
    const introPaddingAcross = requireNumberAfter(intro, "padding: 18px ") * 2;
    assert(introEmMaximum === emMaximum, "both columns ask for the same measure in ems");

    const fights = getRecordedFights();
    const tick = requireNumberAfter(page, "    setPlayStopped();\n  }, ");
    const stripLeft = requireNumberAfter(readStyleRule(page, ".preview-strip"), "left: ");

    const panelWidth = getSheetPixels(PLACE.width);
    const standingWidth = getSheetPixels(STANDING.width);
    const takenAcross = PANEL_INSET + panelWidth + PANEL_GAP + standingWidth;
    const columnMaximum = emMaximum * fontPixels;

    return {
        takenAt: new Date().toISOString().slice(0, "YYYY-MM-DD".length),
        material: `${BUILT_PAGE}, src/ui/panel-look.ts, captures/`,
        windows: {
            panelWidth,
            standingWidth,
            inset: PANEL_INSET,
            gap: PANEL_GAP,
            takenAcross,
            reservedByTheSheet: reserved,
            reserveOverTaken: reserved - takenAcross,
        },
        band: {
            fontPixels,
            emMaximum,
            columnMaximum,
            paddingAcross,
            /** Below this the column is narrower than the `46em` the sheet asks for. */
            fullColumnFrom: reserved + columnMaximum,
            characters: composeTextOfMarkup(bandMarkup).length,
            steps,
            columns: composeMeasuredColumns(
                emMaximum,
                fontPixels,
                reserved,
                paddingAcross,
                takenAcross,
                introPaddingAcross,
            ),
        },
        strip: {
            left: stripLeft,
            /** Every recording the picker offers, and the longest name it has to say. */
            fights: fights.length,
            longestName: fights.reduce(
                (longest, fight) => Math.max(longest, fight.name.length),
                0,
            ),
            reach: composeMeasuredReach(stripLeft, panelWidth, PANEL_INSET),
        },
        replay: {
            /** `window.setInterval(…, 220)` in the driver `tools/preview-page.ts` emits. */
            tickMilliseconds: tick,
            opensOn: "the finished fight (**ADR 0028**)",
            running: composeMeasuredReplays(fights, tick),
        },
        fight: composeMeasuredFight(),
    };
}

if (import.meta.main) {
    const measured = composeMeasured();
    Deno.writeTextFileSync(MEASURED_FILE, `${JSON.stringify(measured, null, 4)}\n`);
    console.log(`${MEASURED_FILE} written over ${measured.material}`);
}
