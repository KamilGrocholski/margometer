/**
 * `DESIGN.md`'s tables against the values the panel actually spends.
 *
 * Read both ways, because a register is two claims: every row the document states is one this
 * file reads, and every entry here is still a row. Nothing held the page before — a token could
 * move in `panel-look.ts` and the document would go on quoting the number it used to be, green,
 * with no reader anywhere to tell. Seven of its figures moved in one commit on 2026-09-15.
 */

import { assert, assertEquals, assertExists, assertNotStrictEquals } from "@std/assert";
import {
    CLASS,
    composeStyleSheet,
    PALETTE_COLOURS,
    PLACE,
    SHAPE,
    SIGNAL,
    SPACE,
    SURFACE,
    TEXT,
    TIP,
} from "@/src/ui/panel-look.ts";
import { getDeclaration, getRuleBody } from "@/tests/style-sheet.ts";

const DESIGN = Deno.readTextFileSync("DESIGN.md");
const QUOTE = "`";
/** What `deno fmt` aligns and never wraps: a row is one line, and a cell stands between two. */
const TABLE_OPENER = "|";
const PALETTE_HEADING = "### The palette";
/** How far under that heading the hues stand: a sentence, a blank line, and the line itself. */
const PALETTE_LINES_BELOW = 8;
/** Past the widest cell the document writes, which is a `Means` column — **S11**. */
const LONGEST_CELL = 400;

/** The line height the panel prints at. No export states it: it is the sheet's own, and private. */
function getLineHeightDrawn(): string {
    const body = getRuleBody(composeStyleSheet(), `.${CLASS.panel}`);
    const font = getDeclaration(body, "font");
    assertExists(font, "the panel states the type it prints");
    const slash = font.indexOf("/");
    assertNotStrictEquals(slash, -1, "and states it as a size over a line height");
    const ends = font.indexOf(" ", slash);
    assertNotStrictEquals(ends, -1, "with a stack standing after it");
    return font.slice(slash + 1, ends);
}

/**
 * Every row the document states, and where the panel keeps it. A row carrying two values names
 * both, in the order the document prints them.
 */
const TOKENS_REGISTERED: Record<string, readonly string[]> = {
    surface: [SURFACE.panel],
    surfaceRaised: [SURFACE.raised],
    track: [SURFACE.track],
    border: [SURFACE.border],
    text: [TEXT.plain],
    textQuiet: [TEXT.quiet],
    inkDark: [TEXT.inkDark],
    inkLight: [TEXT.inkLight],
    ours: [SIGNAL.ours],
    theirs: [SIGNAL.theirs],
    suspect: [SIGNAL.suspect],
    caveat: [SIGNAL.caveat],
    defect: [SIGNAL.defect],
    UNKNOWN_COLOUR: [SIGNAL.unknown],
    spaceHalf: [SPACE.half],
    spaceSmall: [SPACE.small],
    spaceRegion: [SPACE.regionDown, SPACE.regionAcross],
    spaceWide: [SPACE.wide],
    rowHeight: [SPACE.rowHeight],
    maxHeightShare: [SPACE.heightShareMaximum],
    tipWidth: [TIP.widthMaximum],
    lineHeight: [getLineHeightDrawn()],
    panelWidth: [PLACE.width],
    panelInset: [PLACE.inset],
    radius: [SHAPE.radius],
    radiusSmall: [SHAPE.radiusSmall],
    windowShadow: [SHAPE.windowShadow],
};

/**
 * The one row that states no value, and why it does not. `9999` is a claim about somebody else's
 * windows rather than a length this tree chose, and the number says nothing a reader could check.
 */
const TOKENS_WORDED = ["panelLayer"];

/** Every backticked span of a cell, in the order it states them. */
function getQuotedSpans(cell: string): string[] {
    assert(cell.length <= LONGEST_CELL, "a cell stays inside its stated bound");
    const found: string[] = [];
    let at = cell.indexOf(QUOTE);
    let tried = 0;
    while (at !== -1) {
        assert(tried <= cell.length, "the walk stays inside the cell's own bound");
        tried += 1;
        const ends = cell.indexOf(QUOTE, at + 1);
        if (ends === -1) return found;
        found.push(cell.slice(at + 1, ends));
        at = cell.indexOf(QUOTE, ends + 1);
    }
    return found;
}

/**
 * Each row of a token table: the name its first cell quotes, and the values its second states. A
 * heading row and the divider under it quote nothing, so neither is read as a row.
 */
function parseTokenRows(document: string): Map<string, string[]> {
    const found = new Map<string, string[]>();
    for (const line of document.split("\n")) {
        if (!line.startsWith(TABLE_OPENER)) continue;
        const cells = line.split(TABLE_OPENER);
        const first = cells[1];
        const second = cells[2];
        if (first === undefined) continue;
        if (second === undefined) continue;
        const named = getQuotedSpans(first);
        if (named.length !== 1) continue;
        const token = named[0];
        assertExists(token, "a cell quoting one name states it");
        assert(!found.has(token), `${token} is stated by two rows of one document`);
        found.set(token, getQuotedSpans(second));
    }
    return found;
}

/** The hues under the palette's own heading, printed as a line of its own and not as a table. */
function parsePaletteStated(document: string): string[] {
    const lines = document.split("\n");
    const at = lines.indexOf(PALETTE_HEADING);
    assertNotStrictEquals(at, -1, "the document names the palette");
    for (let step = 1; step <= PALETTE_LINES_BELOW; step += 1) {
        const line = lines[at + step] ?? "";
        if (line.startsWith(QUOTE)) return getQuotedSpans(line);
    }
    return [];
}

/** What the document quotes that the panel does not spend, one line per row that disagrees. */
function getDisagreements(
    stated: Map<string, string[]>,
    registered: Record<string, readonly string[]>,
): string[] {
    const found: string[] = [];
    for (const [name, values] of stated) {
        const spent = registered[name];
        if (spent === undefined) continue;
        if (values.length === spent.length) {
            if (values.every((value, at) => value === spent[at])) continue;
        }
        found.push(
            `${name}: the page says ${values.join(" ")}, the panel spends ${spent.join(" ")}`,
        );
    }
    return found;
}

Deno.test("a table row is read, and a sentence that quotes a token is not one", () => {
    const sample = "| Token | Value |\n| ----- | ----- |\n| `rowHeight` | `18px` |\n";
    const rows = parseTokenRows(sample);
    assertEquals([...rows.keys()], ["rowHeight"], "the row is the one whose first cell quotes");
    assertEquals(rows.get("rowHeight"), ["18px"], "and its second cell is the values it states");
    const prose = "A `rowHeight` of `18px` is what a row costs.\n";
    assertEquals([...parseTokenRows(prose).keys()], [], "a sentence quoting a token is not a row");
    const two = "| `spaceRegion` | `5px` down the panel, `7px` across it |\n";
    assertEquals(parseTokenRows(two).get("spaceRegion"), ["5px", "7px"], "a row may state two");
    const worded = "| `panelLayer` | high enough to clear the game's own windows |\n";
    assertEquals(parseTokenRows(worded).get("panelLayer"), [], "and a row may state none");
});

Deno.test("a value that moved is reported, and one that stood still is not", () => {
    const spent = { rowHeight: ["18px"], spaceRegion: ["5px", "7px"] };
    const agreeing = new Map([["rowHeight", ["18px"]], ["spaceRegion", ["5px", "7px"]]]);
    assertEquals(getDisagreements(agreeing, spent), [], "a page quoting what the panel spends");
    const moved = new Map([["rowHeight", ["21px"]]]);
    assertEquals(getDisagreements(moved, spent).length, 1, "and one quoting what it used to");
    // A row short of a value it used to state is the half a reader skims past: the figure left
    // standing is still right, so nothing on the page looks wrong.
    const halved = new Map([["spaceRegion", ["5px"]]]);
    assertEquals(getDisagreements(halved, spent).length, 1, "a row that dropped one of two");
    const unknown = new Map([["barTint", ["0.55"]]]);
    assertEquals(
        getDisagreements(unknown, spent),
        [],
        "a row nothing registers is the other test's",
    );
});

Deno.test("every value DESIGN.md quotes is the one the panel spends", () => {
    const stated = parseTokenRows(DESIGN);
    assert(stated.size > TOKENS_WORDED.length, "the document states tokens to be checked");
    assertEquals(
        getDisagreements(stated, TOKENS_REGISTERED),
        [],
        "the page quotes a value the panel does not spend",
    );
});

Deno.test("the register and the document name the same rows", () => {
    const stated = parseTokenRows(DESIGN);
    const registered = Object.keys(TOKENS_REGISTERED);
    const unheld = [...stated.keys()].filter((name) => {
        if (registered.includes(name)) return false;
        return !TOKENS_WORDED.includes(name);
    });
    assertEquals(unheld, [], "a row of the document that nothing here reads");
    const vanished = registered.filter((name) => !stated.has(name));
    assertEquals(vanished, [], "the register names a row the document no longer carries");
    for (const name of TOKENS_WORDED) {
        assertEquals(stated.get(name), [], `${name} states a value now, so the register holds it`);
    }
});

Deno.test("the palette the document prints is the one the panel draws", () => {
    const sample =
        `${PALETTE_HEADING}\n\nSix hues, and here they are:\n\n\`#000000\` \`#ffffff\`\n`;
    assertEquals(parsePaletteStated(sample), ["#000000", "#ffffff"], "the line under the heading");
    assertEquals(parsePaletteStated(DESIGN), [...PALETTE_COLOURS], "and the document's own");
});
