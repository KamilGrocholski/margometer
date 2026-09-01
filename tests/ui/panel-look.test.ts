/**
 * The tokens, and the two things they cannot state on their own.
 *
 * Contrast is checked by arithmetic rather than by eye, over every pairing the panel can put on
 * screen — which is what `DESIGN.md` asks for and what a screenshot cannot show.
 */

import { assert, assertEquals, assertExists, assertNotEquals } from "@std/assert";
import {
    CLASS,
    composeBarColour,
    composeStyleSheet,
    getColourForProfession,
    getContrastRatio,
    getInkForBar,
    PALETTE_COLOURS,
    SIGNAL,
    SPACE,
    SURFACE,
    TEXT,
} from "@/src/ui/panel-look.ts";
import { getWordsForProfession, PROFESSION_WORDS } from "@/src/ui/panel-words.ts";
import { getDeclaration, getRuleBody, RULES_IN_A_SHEET } from "@/tests/style-sheet.ts";

/** WCAG AA for text at the size this panel prints figures, and for a mark that is not text. */
const AA_TEXT_RATIO = 4.5;
const AA_MARK_RATIO = 3;
/** Every profession the recordings state, measured over `captures/` on 2026-08-29. */
const PROFESSIONS = ["w", "m", "h", "t", "p", "b"];
const LONGEST_DECLARATION = 200;

Deno.test("a bar's own spelling is read back as readily as a token's", () => {
    assertEquals(getContrastRatio("rgb(0 0 0)", "#ffffff"), 21, "the widest, written either way");
    assertEquals(getContrastRatio("rgb(0 0)", "#ffffff"), 1, "two channels are not a colour");
    assertEquals(getContrastRatio("rgb(0 0 300)", "#ffffff"), 1, "nor is one past a byte");
});

Deno.test("a ratio is read from the colours, and refuses what it cannot read", () => {
    assertEquals(getContrastRatio("#000000", "#ffffff"), 21, "the widest there is");
    assertEquals(getContrastRatio("#ffffff", "#ffffff"), 1, "and the narrowest");
    assertEquals(getContrastRatio("white", "#ffffff"), 1, "a colour nobody wrote passes nothing");
    assertEquals(getContrastRatio("#fff", "#000000"), 1, "and neither does a short one");
    assert(
        getContrastRatio("#000000", "#ffffff") > getContrastRatio("#17171c", "#1f1f26"),
        "order",
    );
});

Deno.test("text over every surface clears AA", () => {
    for (const surface of Object.values(SURFACE)) {
        assert(getContrastRatio(TEXT.plain, surface) >= AA_TEXT_RATIO, `${surface} under a figure`);
    }
    assert(getContrastRatio(TEXT.quiet, SURFACE.panel) >= AA_TEXT_RATIO, "and under a label");
    // The quiet ink over the raised surface: the strip's own label, and every caption the detail
    // window prints. Raised is the lighter of the two, so the panel's pairing does not cover it.
    assert(
        getContrastRatio(TEXT.quiet, SURFACE.raised) >= AA_TEXT_RATIO,
        "on what stands above it",
    );
});

Deno.test("a figure printed on a bar clears AA, whatever the bar was drawn for", () => {
    // Every hue the panel can put under a figure: a profession on a ranking row, the colourless
    // one every cut of a figure takes, and the two hues of the palette no profession spends.
    const hues = [
        ...PROFESSIONS.map((one) => getColourForProfession(one)),
        getColourForProfession(null),
        ...PALETTE_COLOURS,
    ];
    let lightest = 21;
    for (const hue of hues) {
        const bar = composeBarColour(hue);
        const ratio = getContrastRatio(getInkForBar(hue), bar);
        assert(ratio >= AA_TEXT_RATIO, `${hue}: ${ratio.toFixed(2)} on ${bar}`);
        lightest = Math.min(lightest, ratio);
    }
    assert(hues.length > PALETTE_COLOURS.length, "more pairings were checked than there are hues");
    assert(lightest >= AA_TEXT_RATIO, "the worst pairing the panel can draw still clears it");
});

Deno.test("a profession keeps its colour, and one the game did not state is colourless", () => {
    const taken = PROFESSIONS.map((one) => getColourForProfession(one));
    assertEquals(new Set(taken).size, PROFESSIONS.length, "each of the six takes a hue of its own");
    for (const one of taken) {
        assert(PALETTE_COLOURS.some((hue) => hue === one), `${one} comes out of the palette`);
    }
    assertEquals(getColourForProfession("m"), getColourForProfession("m"), "the same every fight");
    assertEquals(getColourForProfession(null), SIGNAL.unknown, "and none stated is colourless");
    assertEquals(getColourForProfession("z"), SIGNAL.unknown, "as is one nobody has a hue for");
    const eight: readonly string[] = PALETTE_COLOURS;
    assert(!eight.includes(SIGNAL.unknown), "which is not one of the eight, so it reads apart");
});

/** The letters, so a table can be asked about one it does not hold. */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

/** Every letter the panel gives a hue to, asked of the sheet rather than listed a second time. */
function getColouredProfessions(): string[] {
    const found: string[] = [];
    for (const letter of ALPHABET) {
        if (getColourForProfession(letter) !== SIGNAL.unknown) found.push(letter);
    }
    assert(found.length <= ALPHABET.length, "the walk stays inside the letters there are");
    return found;
}

/** Which letters one side of the pairing holds and the other does not, in either direction. */
function getUnpairedProfessions(worded: Record<string, string>, coloured: string[]): string[] {
    const found: string[] = [];
    for (const code of coloured) {
        if (worded[code] === undefined) found.push(code);
    }
    for (const code of Object.keys(worded)) {
        if (!coloured.includes(code)) found.push(code);
    }
    assert(found.length <= ALPHABET.length, "a letter is reported once from either side");
    return found.sort();
}

Deno.test("a profession the panel colours is one it can name, and the other way round", () => {
    // N13: the game's own letters are spelled in two files, so the failure is quiet — a card
    // reading `b` where the bar beside it is drawn, or a hue nobody can say the name of.
    assertEquals(
        getColouredProfessions().sort(),
        [...PROFESSIONS].sort(),
        "the six the recordings state are the six the panel draws",
    );
    assertEquals(
        getUnpairedProfessions(PROFESSION_WORDS, getColouredProfessions()),
        [],
        "and every one of them has a word as well as a hue",
    );
    // A reader is proved by a sample it must flag and a sample it must not.
    assertEquals(
        getUnpairedProfessions({ w: "Wojownik" }, ["w", "m"]),
        ["m"],
        "a hue with no word",
    );
    assertEquals(
        getUnpairedProfessions({ w: "W", z: "Z" }, ["w"]),
        ["z"],
        "and a word with no hue",
    );
    assertEquals(
        getUnpairedProfessions({ w: "W" }, ["w"]),
        [],
        "a letter both sides hold is paired",
    );
});

Deno.test("a profession the table does not word travels as the game wrote it", () => {
    assertEquals(getWordsForProfession("p"), "Paladyn", "a letter the table holds is worded");
    assertEquals(getWordsForProfession("z"), "z", "and a seventh the game invents is passed on");
});

Deno.test("the ink is computed, and at this tint every bar takes the light one", () => {
    const inks = new Set(PALETTE_COLOURS.map((one) => getInkForBar(one)));
    // Measured, not designed: at a tint of 0.55 over this track no bar is light enough for the
    // dark ink, which is why that token is reachable only by a lighter bar than the panel draws.
    assertEquals([...inks], [TEXT.inkLight], "every bar the panel draws takes the light ink");
});

Deno.test("the two sides are told apart by more than a hue", () => {
    const sides: string[] = [SIGNAL.ours, SIGNAL.theirs];
    assertEquals(new Set(sides).size, 2, "two sides, two colours");
    assert(
        getContrastRatio(SIGNAL.suspect, SURFACE.panel) >= AA_MARK_RATIO,
        "a mark stands off its surface",
    );
    assertEquals(SIGNAL.unknown, "#8a8a80", "unknown is desaturated: the absence of a category");
});

Deno.test("the sheet shuts the game out, and every class it selects is one the panel wears", () => {
    const sheet = composeStyleSheet();
    assert(sheet.startsWith(":host{all:initial;"), "the reset comes before anything of ours");
    for (const [name, spelling] of Object.entries(CLASS)) {
        assert(sheet.includes(`.${spelling}`), `${name} is a class no rule selects`);
    }
    const opened = [...sheet].filter((one) => one === "{").length;
    const closed = [...sheet].filter((one) => one === "}").length;
    assertEquals(opened, closed, "every rule the sheet opens is closed");
    assert(opened > 1, "and the sheet holds more than the host's own rule");
});

Deno.test("a value is written once, and every rule spends it by name", () => {
    const sheet = composeStyleSheet();
    // A value stated twice is the bug this catches, wherever the second one sits: the host's own
    // declarations spend tokens like any other rule, so one occurrence is the whole allowance.
    const twice: string[] = [];
    for (const value of [...Object.values(SURFACE), ...Object.values(TEXT), SIGNAL.suspect]) {
        const written = sheet.split(value).length - 1;
        if (written > 1) twice.push(`${value} written ${written} times`);
    }
    assertEquals(twice, [], "a value the sheet writes more than once");
    assert(sheet.includes(SURFACE.panel), "and the values it does write are the tokens");
    assert(sheet.includes("var(--MargoMeter-"), "which a rule reaches by our own name");
    assert(sheet.split("var(--MargoMeter-").length > 10, "and reaches by name many times over");
});

Deno.test("a folded panel is drawn by the one region the fold hides", () => {
    const sheet = composeStyleSheet();
    // The bug this catches was photographed rather than reasoned: a bare `.folded` ties with the
    // region's own rule at one class apiece, and the region wins on source order, so a folded
    // panel stood 49 pixels tall against the bar's 23. Two classes in the selector is what makes
    // the outcome independent of where the rule is written.
    assert(
        sheet.includes(`.${CLASS.frame}.${CLASS.folded}`),
        "the frame folds by a selector that outranks its own rule",
    );
    assert(!sheet.includes(`;}.${CLASS.folded}{`), "and never by the bare class, which would tie");
    assert(sheet.includes("display:none"), "what a folded region does is stop being drawn");
});

/** A token or a length, which is the whole of what a term can be. */
function getTermPixels(stated: string): number {
    assert(stated.length > 0, "a term says something");
    let written = stated;
    if (stated.startsWith("var(")) {
        const name = stated.slice("var(--MargoMeter-".length, stated.length - 1);
        const held = Object.entries(SPACE).find(([token]) => getTokenSpelling(token) === name);
        assertExists(held, `${stated} spends a token SPACE does not hold`);
        written = held[1];
    }
    if (written === "0") return 0;
    assert(written.endsWith("px"), `${stated} is a length this panel does not measure in`);
    const value = Number(written.slice(0, -"px".length));
    assert(Number.isFinite(value), `${stated} is not a number`);
    return value;
}

/** A term, or one subtraction of two — which is every arithmetic an inset here spends. */
function getPixels(stated: string): number {
    assert(stated.length > 0, "a length says something");
    if (!stated.startsWith("calc(")) return getTermPixels(stated);
    const inside = stated.slice("calc(".length, stated.length - 1);
    const parts = inside.split(" - ");
    assertEquals(parts.length, 2, `${stated} is not the one subtraction this reader knows`);
    return getTermPixels(parts[0] ?? "") - getTermPixels(parts[1] ?? "");
}

/** `regionDown` is spelled `region-down` in a rule, and the guard must cross that spelling once. */
function getTokenSpelling(token: string): string {
    assert(token.length > 0, "a token is named before it is spelled");
    assert(token.length <= LONGEST_DECLARATION, "a token stays inside its stated bound");
    let spelled = "";
    for (const character of token) {
        const lower = character.toLowerCase();
        spelled += lower === character ? character : `-${lower}`;
    }
    return spelled;
}

/** Split on the spaces a shorthand puts between its parts, not on the ones inside a `calc`. */
function getShorthandParts(stated: string): string[] {
    assert(stated.length > 0, "a shorthand states something");
    assert(stated.length <= LONGEST_DECLARATION, "a shorthand stays inside its stated bound");
    const parts: string[] = [];
    let held = "";
    let depth = 0;
    for (const character of stated) {
        if (character === "(") depth += 1;
        if (character === ")") depth -= 1;
        if (character === " ") {
            if (depth === 0) {
                if (held !== "") parts.push(held);
                held = "";
                continue;
            }
        }
        held += character;
    }
    if (held !== "") parts.push(held);
    assert(parts.length > 0, "and a shorthand that states something has a first part");
    return parts;
}

/** Top, then bottom, out of whichever spellings the rule uses, the longhand winning. */
function getEdgesDown(body: string, selector: string, property: string): number[] {
    const shorthand = getDeclaration(body, property);
    if (shorthand === null) return [0, 0];
    const parts = getShorthandParts(shorthand);
    const above = parts[0] ?? "";
    // One part is every side, two are down and across, and three or four state the bottom third.
    const below = parts.length >= 3 ? parts[2] ?? "" : above;
    const longhand = getDeclaration(body, `${property}-bottom`);
    assert(selector.startsWith("."), "an edge is read off a rule of a class");
    return [getPixels(above), getPixels(longhand === null ? below : longhand)];
}

/** What a reader sees above a region's first bar and below its last, the row's own margin in. */
function getAirAround(sheet: string, selector: string, margin: number): number[] {
    const body = getRuleBody(sheet, selector);
    const [insetAbove, insetBelow] = getEdgesDown(body, selector, "padding");
    const [marginAbove, marginBelow] = getEdgesDown(body, selector, "margin");
    assertExists(insetAbove, `${selector} states what insets it`);
    return [
        (marginAbove ?? 0) + (insetAbove ?? 0),
        (insetBelow ?? 0) + margin + (marginBelow ?? 0),
    ];
}

/** The operators a `calc` spends outside its own groups, which is where a stray term sits. */
function getOperatorsAtDepth(stated: string): string[] {
    assert(stated.startsWith("calc("), "a height is arithmetic before it is read as any");
    assert(stated.length <= LONGEST_DECLARATION, "a height stays inside its stated bound");
    const found: string[] = [];
    let depth = 0;
    for (const character of stated.slice("calc(".length, stated.length - 1)) {
        if (character === "(") depth += 1;
        if (character === ")") depth -= 1;
        if (depth > 0) continue;
        if (character === "*") found.push(character);
        if (character === "+") found.push(character);
        if (character === "-") found.push(character);
    }
    assertEquals(depth, 0, "a height closes every group it opens");
    return found;
}

Deno.test("what stands over a region's first bar is what stands under its last", () => {
    // The bug this catches was photographed rather than reasoned, twice over. The list asked for
    // its two paddings a second time inside a `height` that `content-box` had already put them
    // outside of, and both regions holding rows asked for `regionAcross` underneath while asking
    // for a shorter step above — so the ranking stood 5px under its top edge and 21px over its
    // bottom one, measured in Chrome 152 on 2026-08-29. Every guard stayed green: none of them
    // lays anything out, and none of them adds up what a rule spends either.
    const sheet = composeStyleSheet();
    const margin = getDeclaration(getRuleBody(sheet, `.${CLASS.row}`), "margin-bottom");
    assertExists(margin, "a row carries its own margin, which the last row carries too");
    const carried = getPixels(margin);
    assert(carried > 0, "and that margin is a length a reader can see");
    for (const region of [CLASS.list, CLASS.pinned]) {
        const selector = `.${region}`;
        const body = getRuleBody(sheet, selector);
        const [above, below] = getEdgesDown(body, selector, "padding");
        assertEquals(
            above,
            (below ?? 0) + carried,
            `${selector}: ${above}px over the first bar against ${(below ?? 0) + carried}px ` +
                `under the last`,
        );
    }
});

Deno.test("a rule between two regions has the same air on either side of it", () => {
    // The one this catches was the last one standing, and every region was already even inside
    // itself: the pinned block carried a `margin-top` of its own on top of the list's bottom
    // inset, so the dashed rule sat 9px under the ranking and 4px over the block it opened —
    // measured in Chrome 152 on 2026-08-29. A region being even says nothing about the seam
    // between two of them, and the seam is what a reader sees as a line drawn off centre.
    const sheet = composeStyleSheet();
    const stated = getDeclaration(getRuleBody(sheet, `.${CLASS.row}`), "margin-bottom");
    assertExists(stated, "a row carries its own margin into the space under the last bar");
    const margin = getPixels(stated);
    const list = getAirAround(sheet, `.${CLASS.list}`, margin);
    const pinned = getAirAround(sheet, `.${CLASS.pinned}`, margin);
    const sides = getEdgesDown(getRuleBody(sheet, `.${CLASS.sides}`), `.${CLASS.sides}`, "padding");
    assertEquals(
        list[1],
        pinned[0],
        `the dashed rule stands under ${list[1]}px of the ranking and over ${pinned[0]}px`,
    );
    assertEquals(
        pinned[1],
        sides[0],
        `the summary's rule stands under ${pinned[1]}px of the block and over ${sides[0]}px`,
    );
});

Deno.test("a list is as tall as the rows it promises, and carries no term besides", () => {
    const sheet = composeStyleSheet();
    const stated = getDeclaration(getRuleBody(sheet, `.${CLASS.list}`), "height");
    assertExists(stated, "the list states a height rather than taking one");
    // `:host` resets `box-sizing` to `content-box` and this rule does not set it, so a term added
    // for the padding is reserved twice over and lands as dead space under the last bar. What the
    // guard reads is the operators the height spends at its own depth — a row's cost is one
    // parenthesised group and carries a `+` of its own, which is not the term this is about.
    assertEquals(
        getOperatorsAtDepth(stated),
        ["*"],
        `the list reserves something besides the rows it promises: ${stated}`,
    );
    assert(stated.includes("row-height"), "and what it reserves is what a row costs");
});

/** Every line height the sheet states, which is the term after the slash in a `font` shorthand. */
function getLineHeights(sheet: string): string[] {
    const found: string[] = [];
    let at = sheet.indexOf("font:");
    let tried = 0;
    while (at !== -1) {
        assert(tried < RULES_IN_A_SHEET, "the walk stays inside the sheet's stated bound");
        tried += 1;
        const slash = sheet.indexOf("/", at);
        assertNotEquals(slash, -1, "a font shorthand here states a line height");
        const ends = sheet.indexOf(" ", slash);
        assertNotEquals(ends, -1, "and a stack after it");
        found.push(sheet.slice(slash + 1, ends));
        at = sheet.indexOf("font:", at + 1);
    }
    assert(found.length > 0, "the panel states the type it prints");
    return found;
}

Deno.test("the panel's rhythm is whole pixels, so a bar and its ink round together", () => {
    // A line height stated as a factor is a fractional line box — 11px at 1.35 is 14.85 — and
    // every box under it stands off the pixel grid by a different fraction on every screen. The
    // browser then snaps a bar one way and the glyphs inside it another: the ranking read 5
    // device rows over the figures and 5 under, while the same rows one level down read 4 and 6,
    // in Chrome 152 on 2026-08-29 against `dist/preview.html`. **ADR 0015.**
    const sheet = composeStyleSheet();
    const stated = getLineHeights(sheet);
    const factors = stated.filter((height) => !height.endsWith("px"));
    assertEquals(factors, [], "a line height stated as a factor puts every box under it off grid");
});

Deno.test("a row drops its ink onto its middle and stays the height the list counts", () => {
    // A face carries more ascent than descent, so the ink inside a centred line box sits high by
    // half the difference — 4.503px over the caps against 5.497px under the baseline, Chrome 152
    // on 2026-08-29. The drop answers that, and the parity below is what keeps the answer whole:
    // a cell that lands on a half pixel is a cell the browser rounds. **ADR 0015.**
    const sheet = composeStyleSheet();
    const body = getRuleBody(sheet, `.${CLASS.row}`);
    assertEquals(
        getDeclaration(body, "box-sizing"),
        "border-box",
        "a row reserving its drop outside its height is a row taller than the list counts",
    );
    const [above, below] = getEdgesDown(body, `.${CLASS.row}`, "padding");
    assertEquals(below, 0, "a row carries the drop over its contents and nothing under them");
    assertExists(above, "and states what it carries over them");
    assert(above > 0, "which is a length a reader can see");
    const height = getDeclaration(body, "height");
    assertExists(height, "a row states a height rather than taking one from its contents");
    assertEquals(getPixels(height), getPixels(SPACE.rowHeight), "and it is the one a row costs");
    const line = getLineHeights(getRuleBody(sheet, `.${CLASS.panel}`));
    assertExists(line[0], "the panel states the line a row's cells are drawn on");
    const spare = getPixels(SPACE.rowHeight) - (above ?? 0) - getPixels(line[0]);
    assertEquals(spare % 2, 0, `a row centres its cells onto half a pixel: ${spare}px to share`);
});

/** What a cell has to state to hold a run of text on one line and give way to its neighbour. */
const SHORTENING = ["min-width", "overflow", "text-overflow", "white-space"] as const;

/** Which of the four a rule leaves unsaid, so a failure names the declaration that is missing. */
function getShorteningMissing(sheet: string, selector: string): string[] {
    const body = getRuleBody(sheet, selector);
    const missing: string[] = [];
    for (const property of SHORTENING) {
        if (getDeclaration(body, property) === null) {
            missing.push(`${selector} states no ${property}`);
        }
    }
    return missing;
}

/**
 * A figure is one word and its cell never gives way; the words beside it are what shortens. The
 * separator inside a figure is `src/ui/panel-words.ts`'s to keep unbreakable — this holds the
 * cells around it, which is the other half of the same rule.
 */
Deno.test("a cell carrying a figure refuses to fold, and its neighbour shortens", () => {
    // A reader is proved by a sample it must flag and one it must not.
    assertEquals(
        getShorteningMissing(
            "}.a{min-width:0;overflow:hidden;text-overflow:ellipsis;" +
                "white-space:nowrap;}",
            ".a",
        ),
        [],
        "a cell stating all four is a cell that shortens",
    );
    assertEquals(
        getShorteningMissing("}.a{overflow:hidden;white-space:nowrap;}", ".a").length,
        2,
        "and one short of them is named for what it left out",
    );

    const sheet = composeStyleSheet();
    for (const selector of [`.${CLASS.figure}`, `.${CLASS.rowValue}`]) {
        const body = getRuleBody(sheet, selector);
        assertEquals(getDeclaration(body, "white-space"), "nowrap", `${selector} folds`);
        assertEquals(getDeclaration(body, "flex"), "none", `${selector} gives way`);
    }
    const beside = [CLASS.sectionWords, CLASS.sidesLabel, CLASS.rowName, CLASS.tipLabel];
    const short = beside.flatMap((className) => getShorteningMissing(sheet, `.${className}`));
    assertEquals(short, [], "the words beside a figure are the cell that shortens");
});

Deno.test("the reader adds up a rule rather than matching one", () => {
    // A reader is proved by a sample it must flag and one it must not.
    assertEquals(getPixels("7px"), 7, "a length reads as itself");
    assertEquals(getPixels("var(--MargoMeter-region-down)"), 5, "a token reads as its value");
    assertEquals(
        getPixels("calc(var(--MargoMeter-region-down) - var(--MargoMeter-half))"),
        3,
        "and one subtraction reads as the difference",
    );
    const body = getRuleBody("}.a{padding:1px 2px;padding-bottom:3px;}", ".a");
    assertEquals(getDeclaration(body, "padding-bottom"), "3px", "the longhand is found");
    assertEquals(getDeclaration(body, "margin-bottom"), null, "and what is absent is not invented");
    assertEquals(
        getEdgesDown(body, ".a", "padding"),
        [1, 3],
        "the longhand outranks the shorthand",
    );
    assertEquals(getEdgesDown(body, ".a", "margin"), [0, 0], "an edge nothing states is nothing");
    assertEquals(getPixels("0"), 0, "and a bare nought is a length like any other");
    assertEquals(getTokenSpelling("regionDown"), "region-down", "a token crosses spellings once");
});
