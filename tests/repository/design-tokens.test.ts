/**
 * `DESIGN.md`'s tables against the values the panel spends, read both ways: every row the
 * document states is one this file reads, and every entry here is still a row. A token that moves
 * in `src/ui/panel-look.ts` otherwise leaves the document quoting the number it used to be, green.
 */

import { assert, assertEquals, assertExists, assertNotStrictEquals } from "@std/assert";
import {
    CLASS,
    composeStyleSheet,
    PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM,
    PLACE,
    SHAPE,
    SPACE_PIXELS,
    SURFACE,
    TEXT,
    TIP,
} from "#/src/ui/panel-look.ts";
import { formatColour, PALETTE_COLOURS, SIGNAL } from "#/src/ui/panel-palette.ts";
import { getDeclaration, getRuleBody } from "#/tests/style-sheet.ts";

const DESIGN_PATH = "DESIGN.md";
const QUOTE = "`";
/** What `deno fmt` aligns and never wraps: a row is one line, and a cell stands between two. */
const TABLE_OPENER = "|";
const PALETTE_HEADING = "### The palette";
/** How far under that heading the hues stand: a sentence, a blank line, and the line itself. */
const PALETTE_LINES_BELOW = 8;
/** Past the widest cell the document writes, which is a `Means` column. */
const CELL_LENGTH_MAXIMUM = 400;

Deno.test("a table row is read, and a sentence that quotes a token is not one", () => {
    const sample = "| Token | Value |\n| ----- | ----- |\n| `rowHeight` | `18px` |\n";
    const rows = parseTokenRows(sample);
    assertEquals([...rows.keys()], ["rowHeight"], "the row is the one whose first cell quotes");
    assertEquals(rows.get("rowHeight"), ["18px"], "and its second cell is the values it states");
    const prose = "A `rowHeight` of `18px` is what a row costs.\n";
    assertEquals([...parseTokenRows(prose).keys()], [], "a sentence quoting a token is not a row");
    const two = "| `spaceRegion` | `5px` down the panel, `7px` across it |\n";
    assertEquals(parseTokenRows(two).get("spaceRegion"), ["5px", "7px"], "a row may state two");
});

/**
 * Each row of a token table: the name its first cell quotes, and the values its second states. A
 * heading row and the divider under it quote nothing, so neither is read as a row.
 */
function parseTokenRows(document: string): Map<string, string[]> {
    const found = new Map<string, string[]>();
    for (const line of document.split("\n")) {
        if (!line.startsWith(TABLE_OPENER)) continue;
        const cells = line.split(TABLE_OPENER);
        const named = readQuotedSpans(cells[1] ?? "");
        if (named.length !== 1) continue;
        const token = named[0];
        assertExists(token, "a cell quoting one name states it");
        assert(!found.has(token), `${token} is stated by two rows of one document`);
        found.set(token, readQuotedSpans(cells[2] ?? ""));
    }
    return found;
}

/** Every backticked span of a cell, in the order it states them. */
function readQuotedSpans(cell: string): string[] {
    assert(cell.length <= CELL_LENGTH_MAXIMUM, "a cell stays inside its stated bound");
    const found: string[] = [];
    let at = cell.indexOf(QUOTE);
    for (let tried = 0; at !== -1; tried += 1) {
        assert(tried <= cell.length, "the walk stays inside the cell's own bound");
        const ends = cell.indexOf(QUOTE, at + 1);
        if (ends === -1) return found;
        found.push(cell.slice(at + 1, ends));
        at = cell.indexOf(QUOTE, ends + 1);
    }
    return found;
}

Deno.test("a value that moved is reported, and one that stood still is not", () => {
    const spent = { rowHeight: ["18px"], spaceRegion: ["5px", "7px"] };
    const agreeing = new Map([["rowHeight", ["18px"]], ["spaceRegion", ["5px", "7px"]]]);
    assertEquals(lookupDisagreements(agreeing, spent), [], "a page quoting what the panel spends");
    const moved = new Map([["rowHeight", ["21px"]]]);
    assertEquals(lookupDisagreements(moved, spent).length, 1, "and one quoting what it used to");
    // A row short of a value it used to state is the half a reader skims past: the figure left
    // standing is still right, so nothing on the page looks wrong.
    const halved = new Map([["spaceRegion", ["5px"]]]);
    assertEquals(lookupDisagreements(halved, spent).length, 1, "a row that dropped one of two");
});

/** What the document quotes that the panel does not spend, one line per row that disagrees. */
function lookupDisagreements(
    stated: ReadonlyMap<string, readonly string[]>,
    spent: Readonly<Record<string, readonly string[]>>,
): string[] {
    const found: string[] = [];
    for (const [name, values] of stated) {
        const spending = spent[name];
        if (spending === undefined) continue;
        if (values.join(" ") === spending.join(" ")) continue;
        found.push(
            `${name}: the page says ${values.join(" ")}, the panel spends ${spending.join(" ")}`,
        );
    }
    return found;
}

Deno.test("every value DESIGN.md quotes is the one the panel spends", () => {
    const stated = parseTokenRows(Deno.readTextFileSync(DESIGN_PATH));
    assert(stated.size > 0, "the document states tokens to be checked");
    assertEquals(lookupDisagreements(stated, readTokensSpent()), [], "a value the panel left");
});

/**
 * Every row the document states, as the panel spends it and spelled as the document spells it. A
 * row carrying two values names both, in the order the document prints them.
 */
function readTokensSpent(): Record<string, readonly string[]> {
    return {
        surface: [formatColour(SURFACE.panel)],
        surfaceRaised: [formatColour(SURFACE.raised)],
        track: [formatColour(SURFACE.track)],
        border: [formatColour(SURFACE.border)],
        text: [formatColour(TEXT.plain)],
        textQuiet: [formatColour(TEXT.quiet)],
        inkDark: [formatColour(TEXT.inkDark)],
        inkLight: [formatColour(TEXT.inkLight)],
        ours: [formatColour(SIGNAL.ours)],
        theirs: [formatColour(SIGNAL.theirs)],
        suspect: [formatColour(SIGNAL.suspect)],
        caveat: [formatColour(SIGNAL.caveat)],
        defect: [formatColour(SIGNAL.defect)],
        UNKNOWN_COLOUR: [formatColour(SIGNAL.unknown)],
        spaceHalf: [`${SPACE_PIXELS.half}px`],
        spaceSmall: [`${SPACE_PIXELS.small}px`],
        spaceRegion: [`${SPACE_PIXELS.regionDown}px`, `${SPACE_PIXELS.regionAcross}px`],
        spaceWide: [`${SPACE_PIXELS.wide}px`],
        rowHeight: [`${SPACE_PIXELS.rowHeight}px`],
        maxHeightShare: [`${PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM}vh`],
        tipWidth: [`${TIP.widthPixelsMaximum}px`],
        lineHeight: [readLineHeightDrawn()],
        panelWidth: [`${PLACE.widthPixels}px`],
        panelInset: [`${PLACE.insetPixels}px`],
        panelLayer: [PLACE.layer],
        radius: [`${SHAPE.radiusPixels}px`],
        radiusSmall: [`${SHAPE.radiusSmallPixels}px`],
        windowShadow: [SHAPE.windowShadow],
    };
}

/** The line height the panel prints at. No export states it: it is the sheet's own, and private. */
function readLineHeightDrawn(): string {
    const font = getDeclaration(getRuleBody(composeStyleSheet(), `.${CLASS.panel}`), "font");
    assertExists(font, "the panel states the type it prints");
    const slash = font.indexOf("/");
    assertNotStrictEquals(slash, -1, "and states it as a size over a line height");
    const ends = font.indexOf(" ", slash);
    assertNotStrictEquals(ends, -1, "with a stack standing after it");
    return font.slice(slash + 1, ends);
}

Deno.test("the register and the document name the same rows", () => {
    const stated = parseTokenRows(Deno.readTextFileSync(DESIGN_PATH));
    const registered = Object.keys(readTokensSpent());
    const unheld = [...stated.keys()].filter((name) => !registered.includes(name));
    assertEquals(unheld, [], "a row of the document that nothing here reads");
    const vanished = registered.filter((name) => !stated.has(name));
    assertEquals(vanished, [], "the register names a row the document no longer carries");
});

Deno.test("the palette the document prints is the one the panel draws", () => {
    const sample = `${PALETTE_HEADING}\n\nSix hues:\n\n\`#000000\` \`#ffffff\`\n`;
    assertEquals(parsePaletteStated(sample), ["#000000", "#ffffff"], "the line under the heading");
    const drawn = PALETTE_COLOURS.map(formatColour);
    assertEquals(parsePaletteStated(Deno.readTextFileSync(DESIGN_PATH)), drawn, "the document's");
});

/** The hues under the palette's own heading, printed as a line of their own and not a table. */
function parsePaletteStated(document: string): string[] {
    const lines = document.split("\n");
    const at = lines.indexOf(PALETTE_HEADING);
    assertNotStrictEquals(at, -1, "the document names the palette");
    for (let step = 1; step <= PALETTE_LINES_BELOW; step += 1) {
        const line = lines[at + step] ?? "";
        if (line.startsWith(QUOTE)) return readQuotedSpans(line);
    }
    return [];
}
