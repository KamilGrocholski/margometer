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
    composeShareBackground,
    composeStyleSheet,
    getColourForElement,
    getColourForProfession,
    getContrastRatio,
    getInkForBar,
    getInkForColour,
    PALETTE_COLOURS,
    SIGNAL,
    SURFACE,
    TEXT,
} from "@/src/ui/panel-look.ts";

/** WCAG AA for text at the size this panel prints figures, and for a mark that is not text. */
const AA_TEXT_RATIO = 4.5;
const AA_MARK_RATIO = 3;
/** Every profession the recordings state, measured over `captures/` on 2026-08-29. */
const PROFESSIONS = ["w", "m", "h", "t", "p", "b"];
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

Deno.test("a figure printed on a bar clears AA, whatever the bar was drawn for", () => {
    // Every hue the panel can put under a figure: a kind of damage in a cut, a profession on a
    // ranking row, and the colourless one a combatant the game named no profession for takes.
    const hues = [
        ...ELEMENTS.map((one) => getColourForElement(one)),
        ...PROFESSIONS.map((one) => getColourForProfession(one)),
        getColourForProfession(null),
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

Deno.test("an element keeps its colour, and the palette is smaller than the protocol", () => {
    assertEquals(getColourForElement("dmgf"), getColourForElement("dmgf"), "the same every fight");
    const common = ELEMENTS.slice(0, PALETTE_COLOURS.length);
    const spread = new Set(common.map((one) => getColourForElement(one)));
    assertEquals(spread.size, PALETTE_COLOURS.length, "the eight most stated take a hue each");
    const taken = new Set(ELEMENTS.map((one) => getColourForElement(one)));
    assertEquals(taken.size, PALETTE_COLOURS.length, "and the two rarest share with two of them");
    assert(ELEMENTS.length > PALETTE_COLOURS.length, "ten keys into eight hues means two share");
    const unseen = getColourForElement("dmgx");
    assertEquals(unseen, getColourForElement("dmgx"), "a key nobody has seen still keeps a hue");
    assert(PALETTE_COLOURS.some((one) => one === unseen), "and takes one from the palette");
});

Deno.test("the ink is computed, and at this tint every bar takes the light one", () => {
    assertEquals(getInkForColour("#ffffff"), TEXT.inkDark, "a light surface takes the dark ink");
    assertEquals(getInkForColour("#000000"), TEXT.inkLight, "and a dark one takes the light");
    assertEquals(getInkForColour("nothing"), TEXT.inkLight, "an unreadable colour takes the light");
    const inks = new Set(ELEMENTS.map((one) => getInkForBar(getColourForElement(one))));
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

Deno.test("a bar is the row's own background, and it stops where the share does", () => {
    const whole = composeShareBackground(PALETTE_COLOURS[0] ?? "", 1);
    assert(whole.includes("100%"), "a whole share runs the width of the row");
    const none = composeShareBackground(PALETTE_COLOURS[0] ?? "", 0);
    assert(none.includes("0%"), "and nothing measured draws nothing, which is not unknown");
    const half = composeShareBackground(PALETTE_COLOURS[0] ?? "", 0.5);
    assert(half.includes("50%"), "a half share stops halfway");
    assert(half.startsWith("linear-gradient("), "the bar is the background, not an element in it");
    assertEquals(half.split("transparent").length, 2, "and the row behind it shows past the stop");
});
