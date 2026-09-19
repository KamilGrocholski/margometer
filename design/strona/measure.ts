/**
 * What the round stands on: the stylesheet the published page invents for itself, the set of
 * pages it is, the material behind them, and what a press on a row buys.
 *
 * Run by hand, and it earns no `deno task` entry because it has one consumer (**C9**):
 *
 *     deno run -A design/strona/measure.ts
 *
 * ⚠️ **The site is composed here rather than read off `dist/`.** Nothing empties that directory
 * between builds, so a walk of it counted 62 pages on 2026-09-19 where the site is 34 — the other
 * 28 were an older build's, under names no recording carries any more. `composePreviewSitePages`
 * is what the guards read too, so the round and the gate measure one thing.
 *
 * What `design/instalacja/` already measured is cited rather than counted again (`design/README.md`).
 */

import { assert } from "@std/assert";
import { PALETTE_COLOURS, PLACE, SHAPE, SIGNAL, SPACE, STANDING, SURFACE, TEXT } from
    "@/src/ui/panel-look.ts";
import {
    composeDrillReading,
    composePairReading,
    composePanelReading,
    type NamedPart,
} from "@/src/ui/panel-reading.ts";
import { composeDrillCases, DRILL_RUNGS, type DrillRung } from "@/tools/drill-report.ts";
import { composeFightReplay } from "@/tools/fight-replay.ts";
import { PREVIEW_INSTALL_OPENING } from "@/tools/preview-page.ts";
import { composePreviewSitePages, type PreviewSiteFile } from "@/tools/preview-site.ts";
import { getVersionForRun } from "@/tools/declared-version.ts";
import { getPreviewRecordedFight, getRecordedFights } from "@/tools/recorded-fights.ts";
import { PreviewBuildError } from "@/tools/margometer-tool-error.ts";

const LANDING_PAGE = "index.html";
const MEASURED_FILE = "design/strona/measured.json";
/** What the other round counted, and this one quotes rather than counting a second time. */
const CITED_MEASURED = "design/instalacja/measured.json";
/** The two files that bind the page's markup, read as text so a sheet can cite a real title. */
const GUARD_FILES = ["tests/tools/preview-site.test.ts", "tests/tools/preview-page.test.ts"];

/** More of anything than the tree carries, so every walk below states its bound (**S2**). */
const MAXIMUM_PAGES = 64;
const MAXIMUM_CHARACTERS = 1_000_000;
const MAXIMUM_RULES = 256;

const HEX_DIGITS = "0123456789abcdefABCDEF";
const SHORT_HEX_LENGTH = 3;
const LONG_HEX_LENGTH = 6;

interface MeasuredRule {
    selector: string;
    widthMaximum: string | null;
}

interface MeasuredGuard {
    file: string;
    title: string;
}

/** The page a visitor lands on, out of the set the site composes. */
function requireLandingPage(pages: readonly PreviewSiteFile[]): string {
    const landing = pages.find((page) => page.name === LANDING_PAGE);
    if (landing === undefined) throw new PreviewBuildError(`the site composes no ${LANDING_PAGE}`);
    return landing.text;
}

/** The text between two markers, or null where the page carries neither. */
function readBetween(text: string, opening: string, closing: string): string | null {
    const opened = text.indexOf(opening);
    if (opened < 0) return null;
    const closed = text.indexOf(closing, opened + opening.length);
    if (closed < 0) return null;
    return text.slice(opened + opening.length, closed);
}

function requireBetween(text: string, opening: string, closing: string): string {
    const read = readBetween(text, opening, closing);
    if (read === null) throw new PreviewBuildError(`the page carries no ${opening}`);
    return read;
}

function isHexDigitAt(text: string, at: number): boolean {
    const one = text.charAt(at);
    if (one.length === 0) return false;
    return HEX_DIGITS.includes(one);
}

/** How many hex digits run from here, counted rather than matched (**C7**). */
function getHexRunLength(text: string, from: number): number {
    let length = 0;
    while (length < LONG_HEX_LENGTH) {
        if (!isHexDigitAt(text, from + length)) break;
        length += 1;
    }
    return length;
}

/**
 * Every colour the page spells, lower-cased so `#E6EAF1` and `#e6eaf1` are one colour. A short
 * hex is kept as written: nothing here needs it widened, and widening it would invent a spelling
 * the page does not carry.
 */
function composePageColours(text: string): string[] {
    const found = new Set<string>();
    let at = 0;
    while (at < MAXIMUM_CHARACTERS) {
        const hash = text.indexOf("#", at);
        if (hash < 0) break;
        const run = getHexRunLength(text, hash + 1);
        if (run === LONG_HEX_LENGTH || run === SHORT_HEX_LENGTH) {
            found.add(text.slice(hash, hash + 1 + run).toLowerCase());
        }
        at = hash + 1;
    }
    return [...found].sort();
}

/** Every token the panel states, as the one vocabulary a page could have taken. */
function composePanelColours(): string[] {
    const stated = [
        ...Object.values(SURFACE),
        ...Object.values(TEXT),
        ...Object.values(SIGNAL),
        ...PALETTE_COLOURS,
    ];
    return [...new Set(stated.map((one) => one.toLowerCase()))].sort();
}

/** Every rule the page's own sheet states, with the width it caps itself at. */
function composeMeasuredRules(sheet: string): MeasuredRule[] {
    const rules: MeasuredRule[] = [];
    let selector = "";
    for (const line of sheet.split("\n")) {
        assert(rules.length < MAXIMUM_RULES, "the sheet states no more rules than a sheet does");
        const opened = line.indexOf(" {");
        if (opened > 0) {
            selector = line.slice(0, opened).trim();
            rules.push({ selector, widthMaximum: null });
        }
        const stated = line.indexOf("max-width: ");
        if (stated < 0) continue;
        const rest = line.slice(stated + "max-width: ".length);
        const closed = rest.indexOf(";");
        const width = closed < 0 ? rest.trim() : rest.slice(0, closed).trim();
        const last = rules[rules.length - 1];
        if (last !== undefined) last.widthMaximum = width;
    }
    return rules;
}

/**
 * The stylesheet the page writes for itself, and the one figure this round turns on: how much of
 * its colour the panel already names, and how much it made up. A page inventing its own greys is
 * a page with no design system, which is what `DESIGN.md` never claimed to give it.
 */
function composeMeasuredSheet(landing: string) {
    const sheet = requireBetween(landing, "<style>", "</style>");
    const shorthand = requireBetween(sheet, "font: ", ";");
    const known = new Set(composePanelColours());
    const spelled = composePageColours(sheet);
    const invented = spelled.filter((one) => !known.has(one));
    assert(spelled.length > 0, "the page states a colour of its own");
    return {
        rules: composeMeasuredRules(sheet),
        fontShorthand: shorthand,
        fontStack: shorthand.slice(shorthand.indexOf(" ") + 1),
        coloursSpelled: spelled.length,
        /** The vocabulary the page could have taken, so a sheet draws both sides off one file. */
        panelPalette: [...known],
        inPanelPalette: spelled.filter((one) => known.has(one)),
        inventedByThePage: invented,
        inventedShare: Number((invented.length / spelled.length).toFixed(3)),
    };
}

/** The set the site is: how big each page runs, and whether the landing one is a copy. */
function composeMeasuredPages(pages: readonly PreviewSiteFile[]) {
    assert(pages.length <= MAXIMUM_PAGES, "the site is no larger than a site");
    const opened = `${getPreviewRecordedFight(getRecordedFights()).name}.html`;
    const bands = new Set<string>();
    const sizes: number[] = [];
    for (const page of pages) {
        sizes.push(page.text.length);
        const band = readBetween(page.text, PREVIEW_INSTALL_OPENING, "</header>");
        if (band !== null) bands.add(band);
    }
    sizes.sort((one, other) => one - other);
    const middle = sizes[Math.floor(sizes.length / 2)];
    assert(middle !== undefined, "a set of pages has a middle one");
    const openedText = pages.find((page) => page.name === opened);
    assert(openedText !== undefined, "the fight the landing page opens on has a page of its own");
    return {
        count: pages.length,
        charactersLeast: sizes[0] ?? 0,
        charactersMost: sizes[sizes.length - 1] ?? 0,
        charactersMiddle: middle,
        openedFightPage: opened,
        landingEqualsOpenedFight: requireLandingPage(pages) === openedText.text,
        distinctBands: bands.size,
    };
}

/** What each recording comes to, so the corpus can be a subject rather than a dropdown. */
function composeMeasuredCorpus() {
    const fights = getRecordedFights();
    assert(fights.length > 0, "there is material to state");
    return fights.map((fight) => {
        const replay = composeFightReplay(fight);
        const bySide = new Map<number, number>();
        for (const one of replay.roster.byId.values()) {
            bySide.set(one.side, (bySide.get(one.side) ?? 0) + 1);
        }
        const reading = composePanelReading(
            replay.statistics,
            replay.roster,
            "damageDealtApplied",
            "everyone",
            replay.reading.readerSide,
            {
                messagesLost: replay.reading.messagesLost,
                hasJoinedInProgress: replay.reading.hasJoinedInProgress,
                messagesRead: replay.reading.messagesRead,
            },
        );
        return {
            name: fight.name,
            calls: fight.calls.length,
            events: replay.reading.events.length,
            combatants: replay.roster.byId.size,
            headcountBySide: [...bySide.entries()].sort((one, other) => one[0] - other[0]).map((
                [side, count],
            ) => ({ side, count })),
            outcome: reading.outcome,
            rowsDrawn: reading.rows.length,
            /**
             * The panel's own window on the ranking and never this fight's size: it is a
             * constant, and a sheet reading it as a row count states 11 for a fight of two.
             */
            rowsOnScreen: reading.visibleRows,
            total: reading.total,
        };
    });
}

/**
 * What a press buys, per rung of the panel — how many rows of the whole corpus open onto another
 * level and how many stay shut. `docs/drill-levels.md` owns the verdicts; this counts the rows
 * behind them, because a sheet claiming the panel is three levels deep has to say how deep the
 * material actually goes.
 */
function composeMeasuredLevels() {
    const replays = getRecordedFights().map((fight) => composeFightReplay(fight));
    const cases = composeDrillCases(replays);
    const opens = new Map<DrillRung, number>();
    const shut = new Map<DrillRung, number>();
    for (const one of cases) {
        opens.set(one.rung, (opens.get(one.rung) ?? 0) + one.opens);
        shut.set(one.rung, (shut.get(one.rung) ?? 0) + one.shut);
    }
    return {
        citedFrom: "docs/drill-levels.md",
        rungs: DRILL_RUNGS.map((rung) => ({
            rung,
            opens: opens.get(rung) ?? 0,
            shut: shut.get(rung) ?? 0,
        })),
    };
}

/** What the game called a part, as the one word a sheet prints for it. */
function getPartName(part: NamedPart): string {
    if (part.kind === "skill") return part.name;
    if (part.kind === "source") return part.source;
    return part.element;
}

/**
 * The landing fight opened, and then opened again — the second and third levels for the row that
 * stands at the top of it. A sheet claiming the panel is three deep has to draw three, and a
 * third level drawn from memory is a fabricated fight by another name (`design/README.md`).
 */
function composeMeasuredDeep() {
    const replay = composeFightReplay(getPreviewRecordedFight(getRecordedFights()));
    const opened = [...replay.roster.byId.values()].reduce((most, one) => {
        const figures = replay.statistics.byCombatantId.get(one.id);
        const mine = replay.statistics.byCombatantId.get(most.id);
        const here = figures === undefined ? 0 : figures.damageDealtApplied;
        const there = mine === undefined ? 0 : mine.damageDealtApplied;
        return here > there ? one : most;
    });
    const drill = composeDrillReading(
        replay.statistics,
        replay.roster,
        "damageDealtApplied",
        opened.id,
    );
    assert(drill !== null, "the row the landing panel puts first opens onto something");
    const other = drill.byOpponent.rows[0];
    assert(other !== undefined, "and onto somebody it was dealt to");
    const pair = composePairReading(
        replay.statistics,
        replay.roster,
        "damageDealtApplied",
        opened.id,
        other.combatantId,
    );
    return {
        opened: {
            name: drill.name,
            profession: drill.profession,
            total: drill.total,
            byOpponent: drill.byOpponent.rows.map((row) => ({
                name: row.name,
                figure: row.figure,
                fill: row.fill,
                shareText: row.shareText,
                doesOpenPair: row.doesOpenPair,
            })),
            bySkill: drill.bySkill.rows.map((row) => ({
                name: getPartName(row.part),
                uses: row.uses,
                figure: row.figure,
                fill: row.fill,
                shareText: row.shareText,
                doesOpenPart: row.doesOpenPart,
            })),
            byElement: drill.byElement.rows.map((row) => ({
                figure: row.figure,
                fill: row.fill,
                shareText: row.shareText,
            })),
        },
        pair: pair === null ? null : {
            otherName: pair.otherName,
            total: pair.total,
            parts: pair.parts.map((row) => ({
                name: row.part.kind === "plain" ? null : getPartName(row.part),
                figure: row.figure,
                fill: row.fill,
                shareText: row.shareText,
            })),
        },
    };
}

/** Every guard title the two preview test files state, so a sheet cites one rather than recalls it. */
function composeMeasuredGuards(): MeasuredGuard[] {
    const guards: MeasuredGuard[] = [];
    for (const file of GUARD_FILES) {
        const text = Deno.readTextFileSync(file);
        let at = 0;
        while (at < MAXIMUM_CHARACTERS) {
            const opened = text.indexOf('Deno.test("', at);
            if (opened < 0) break;
            const from = opened + 'Deno.test("'.length;
            const closed = text.indexOf('"', from);
            if (closed < 0) break;
            guards.push({ file, title: text.slice(from, closed) });
            at = closed + 1;
        }
    }
    assert(guards.length > 0, "the page is held by something a sheet can name");
    return guards;
}

/** The holes the other round measured, quoted whole rather than counted again (**V4**, **V5**). */
function composeCitedPlaces() {
    const cited = JSON.parse(Deno.readTextFileSync(CITED_MEASURED));
    assert(typeof cited === "object", "the cited reading is a reading");
    assert(cited !== null, "and it is there to be cited");
    const band = cited.band;
    const strip = cited.strip;
    assert(band !== undefined, "the cited reading states the columns");
    assert(strip !== undefined, "and how far the strip stands from the panel");
    return {
        citedFrom: CITED_MEASURED,
        takenAt: cited.takenAt,
        columns: band.columns,
        reach: strip.reach,
    };
}

/**
 * The panel the landing page draws, composed here rather than cited.
 *
 * `design/instalacja/` measured this once and it was quoted from there until 2026-09-19, when the
 * recording the page opens on changed (`PREVIEW_FIGHT_NAME`). A citation holds while both rounds
 * mean the same fight and stops holding the moment they do not — so the geometry above is still
 * quoted, because widths did not move, and the rows are read again here.
 *
 * A share is `shareText` off the shipped reading and never a division done on a sheet: the screen
 * is counted a second time from the statistics, so a row's percent is not its figure over the sum
 * of the rows.
 */
function composeMeasuredLanding() {
    const fight = getPreviewRecordedFight(getRecordedFights());
    const replay = composeFightReplay(fight);
    const reading = composePanelReading(
        replay.statistics,
        replay.roster,
        "damageDealtApplied",
        "everyone",
        replay.reading.readerSide,
        {
            messagesLost: replay.reading.messagesLost,
            hasJoinedInProgress: replay.reading.hasJoinedInProgress,
            messagesRead: replay.reading.messagesRead,
        },
    );
    const bySide = new Map<number, number>();
    for (const one of replay.roster.byId.values()) {
        bySide.set(one.side, (bySide.get(one.side) ?? 0) + 1);
    }
    assert(reading.rows.length > 0, "the fight the landing page opens on draws rows");
    return {
        name: fight.name,
        entries: fight.calls.length,
        outcome: reading.outcome,
        headcountBySide: [...bySide.entries()].sort((one, other) => one[0] - other[0]).map((
            [side, count],
        ) => ({ side, count })),
        total: reading.total,
        rows: reading.rows.map((row, at) => ({
            rank: at + 1,
            name: row.name,
            side: row.side,
            profession: row.profession,
            figure: row.figure,
            fill: row.fill,
            shareText: row.shareText,
        })),
        pinned: reading.pinned.map((one) => ({
            case: one.case,
            standing: one.standing,
            figure: one.figure,
            fill: one.fill,
            shareText: one.shareText,
        })),
        sides: reading.sides,
    };
}

function composeMeasuredTokens() {
    return {
        surface: SURFACE,
        text: TEXT,
        signal: SIGNAL,
        palette: PALETTE_COLOURS,
        panelWidth: PLACE.width,
        panelInset: PLACE.inset,
        standingWidth: STANDING.width,
        rowHeight: SPACE.rowHeight,
        spaceWide: SPACE.wide,
        spaceSmall: SPACE.small,
        radius: SHAPE.radius,
        radiusSmall: SHAPE.radiusSmall,
    };
}

function composeMeasured() {
    const pages = composePreviewSitePages(getVersionForRun(Deno.args));
    return {
        takenAt: new Date().toISOString().slice(0, "YYYY-MM-DD".length),
        material:
            `tools/preview-site.ts, src/ui/panel-look.ts, captures/, ${GUARD_FILES.join(", ")}`,
        tokens: composeMeasuredTokens(),
        sheet: composeMeasuredSheet(requireLandingPage(pages)),
        pages: composeMeasuredPages(pages),
        places: composeCitedPlaces(),
        landing: composeMeasuredLanding(),
        corpus: composeMeasuredCorpus(),
        levels: composeMeasuredLevels(),
        deep: composeMeasuredDeep(),
        guards: composeMeasuredGuards(),
    };
}

if (import.meta.main) {
    const measured = composeMeasured();
    Deno.writeTextFileSync(MEASURED_FILE, `${JSON.stringify(measured, null, 4)}\n`);
    console.log(`${MEASURED_FILE} written over ${measured.material}`);
}
