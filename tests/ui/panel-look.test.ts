/**
 * The tokens, and the two things they cannot state on their own.
 *
 * Contrast is checked by arithmetic rather than by eye, over every pairing the panel can put on
 * screen — which is what `DESIGN.md` asks for and what a screenshot cannot show.
 */

import { assert, assertEquals } from "@std/assert";
import {
    composeBarColour,
    ELEMENT_COLOURS,
    getColourForElement,
    getContrastRatio,
    getInkForBar,
    getInkForColour,
    SIGNAL,
    SURFACE,
    TEXT,
} from "@/src/ui/panel-look.ts";

/** WCAG AA for text at the size this panel prints figures, and for a mark that is not text. */
const AA_TEXT_RATIO = 4.5;
const AA_MARK_RATIO = 3;
/** Every element the recordings state, measured over `captures/` on 2026-08-28. */
const ELEMENTS = [
    "dmg",
    "dmgd",
    "dmgc",
    "dmga",
    "dmgl",
    "dmgf",
    "dmgo",
    "dmgg",
    "thirdatt",
    "dmgp",
];

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
});

Deno.test("a figure printed on a bar clears AA, whatever the element", () => {
    let lightest = 21;
    for (const element of ELEMENTS) {
        const bar = composeBarColour(element);
        const ink = getInkForBar(element);
        const ratio = getContrastRatio(ink, bar);
        assert(ratio >= AA_TEXT_RATIO, `${element}: ${ratio.toFixed(2)} on ${bar}`);
        lightest = Math.min(lightest, ratio);
    }
    assert(lightest >= AA_TEXT_RATIO, "the worst pairing the panel can draw still clears it");
});

Deno.test("an element keeps its colour, and the palette is smaller than the protocol", () => {
    assertEquals(getColourForElement("dmgf"), getColourForElement("dmgf"), "the same every fight");
    const common = ELEMENTS.slice(0, ELEMENT_COLOURS.length);
    const spread = new Set(common.map((one) => getColourForElement(one)));
    assertEquals(spread.size, ELEMENT_COLOURS.length, "the eight most stated take a hue each");
    const taken = new Set(ELEMENTS.map((one) => getColourForElement(one)));
    assertEquals(taken.size, ELEMENT_COLOURS.length, "and the two rarest share with two of them");
    assert(ELEMENTS.length > ELEMENT_COLOURS.length, "ten keys into eight hues means two share");
    const unseen = getColourForElement("dmgx");
    assertEquals(unseen, getColourForElement("dmgx"), "a key nobody has seen still keeps a hue");
    assert(ELEMENT_COLOURS.some((one) => one === unseen), "and takes one from the palette");
});

Deno.test("the ink is computed, and at this tint every bar takes the light one", () => {
    assertEquals(getInkForColour("#ffffff"), TEXT.inkDark, "a light surface takes the dark ink");
    assertEquals(getInkForColour("#000000"), TEXT.inkLight, "and a dark one takes the light");
    assertEquals(getInkForColour("nothing"), TEXT.inkLight, "an unreadable colour takes the light");
    const inks = new Set(ELEMENTS.map((one) => getInkForBar(one)));
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
