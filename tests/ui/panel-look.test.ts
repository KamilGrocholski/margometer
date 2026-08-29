/**
 * The tokens, and the two things they cannot state on their own.
 *
 * Contrast is checked by arithmetic rather than by eye, over every pairing the panel can put on
 * screen — which is what `DESIGN.md` asks for and what a screenshot cannot show.
 */

import { assert, assertEquals } from "@std/assert";
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

/** WCAG AA for text at the size this panel prints figures, and for a mark that is not text. */
const AA_TEXT_RATIO = 4.5;
const AA_MARK_RATIO = 3;
/** Every profession the recordings state, measured over `captures/` on 2026-08-29. */
const PROFESSIONS = ["w", "m", "h", "t", "p", "b"];
/** What the sheet holds at its widest, measured over `composeStyleSheet()` on 2026-08-29. */
const RULES_IN_A_SHEET = 200;
const LONGEST_RULE = 600;
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

/**
 * The sheet is read rather than matched, so a length typed straight into a rule is caught the same
 * way a token spent wrongly is. Nothing here lays anything out; what it holds is the arithmetic
 * that decides a layout, which is the part a browser would only confirm.
 */
function getRuleBody(sheet: string, selector: string): string {
    assert(selector.startsWith("."), "a rule is looked up by the class it selects");
    const opener = `${selector}{`;
    // The selector has to stand on its own: `.list{` sits inside `.panel>.list{` too, and that
    // rule states a `flex` and nothing this guard adds up.
    let at = sheet.indexOf(opener);
    let tried = 0;
    while (at > 0) {
        assert(tried < RULES_IN_A_SHEET, "a lookup stays inside the sheet's stated bound");
        tried += 1;
        if (sheet[at - 1] === "}") break;
        at = sheet.indexOf(opener, at + 1);
    }
    assert(at !== -1, `${selector} is a rule of its own the sheet does not carry`);
    const from = at + opener.length;
    const to = sheet.indexOf("}", from);
    assert(to !== -1, `${selector} opens a rule the sheet never closes`);
    return sheet.slice(from, to);
}

/** The last one written wins, which is what a browser does with the same rule. */
function getDeclaration(body: string, property: string): string | null {
    assert(property.length > 0, "a declaration is looked up by name");
    assert(body.length <= LONGEST_RULE, "a rule stays inside its stated bound");
    let found: string | null = null;
    for (const stated of body.split(";")) {
        const at = stated.indexOf(":");
        if (at === -1) continue;
        if (stated.slice(0, at).trim() !== property) continue;
        found = stated.slice(at + 1).trim();
    }
    return found;
}

/** A token or a length, which is the whole of what a term can be. */
function getTermPixels(stated: string): number {
    assert(stated.length > 0, "a term says something");
    let written = stated;
    if (stated.startsWith("var(")) {
        const name = stated.slice("var(--MargoMeter-".length, stated.length - 1);
        const held = Object.entries(SPACE).find(([token]) => getTokenSpelling(token) === name);
        assert(held !== undefined, `${stated} spends a token SPACE does not hold`);
        written = held[1];
    }
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
function getInsetsDown(body: string, selector: string): number[] {
    const shorthand = getDeclaration(body, "padding");
    assert(shorthand !== null, `${selector} states no padding`);
    const parts = getShorthandParts(shorthand);
    const above = parts[0] ?? "";
    // One part is every side, two are down and across, and three or four state the bottom third.
    const below = parts.length >= 3 ? parts[2] ?? "" : above;
    const longhand = getDeclaration(body, "padding-bottom");
    return [getPixels(above), getPixels(longhand === null ? below : longhand)];
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
    assert(depth === 0, "a height closes every group it opens");
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
    assert(margin !== null, "a row carries its own margin, which the last row carries too");
    const carried = getPixels(margin);
    assert(carried > 0, "and that margin is a length a reader can see");
    for (const region of [CLASS.list, CLASS.pinned]) {
        const selector = `.${region}`;
        const [above, below] = getInsetsDown(getRuleBody(sheet, selector), selector);
        assertEquals(
            above,
            (below ?? 0) + carried,
            `${selector}: ${above}px over the first bar against ${(below ?? 0) + carried}px ` +
                `under the last`,
        );
    }
});

Deno.test("a list is as tall as the rows it promises, and carries no term besides", () => {
    const sheet = composeStyleSheet();
    const stated = getDeclaration(getRuleBody(sheet, `.${CLASS.list}`), "height");
    assert(stated !== null, "the list states a height rather than taking one");
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
    assertEquals(getTokenSpelling("regionDown"), "region-down", "a token crosses spellings once");
});
