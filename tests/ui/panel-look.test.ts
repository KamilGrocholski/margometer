/**
 * The tokens, and the two things they cannot state on their own.
 *
 * Contrast is checked by arithmetic rather than by eye, over every pairing the panel can put on
 * screen — which is what `DESIGN.md` asks for and what a screenshot cannot show.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertExists,
    AssertionError,
    assertNotStrictEquals,
    assertStrictEquals,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import {
    BAR_ICON,
    CLASS,
    composeBarColour,
    composeBarIconClass,
    composeOptionsStepClass,
    composeStyleSheet,
    getCardHeightAvailable,
    getCardWidthAvailable,
    getCardWidthForColumns,
    getContrastRatio,
    getControlHeightPixels,
    getInkForBar,
    LAYER,
    PLACE,
    SIZE_VARIABLES,
    SPACE_PIXELS,
    SURFACE,
    TEXT,
    TYPE_TOKENS,
} from "#/src/ui/panel-look.ts";
import { TYPE_STEP, TYPE_STEP_DEFAULT, TYPE_STEPS } from "#/src/ui/panel-choice.ts";
import {
    type Colour,
    formatColour,
    lookupColourForProfession,
    PALETTE_COLOURS,
    SIGNAL,
} from "#/src/ui/panel-palette.ts";
import { NOTHING_SUSPECT, presentScreen } from "#/src/ui/panel-content.ts";
import { parseInteger } from "#/libs/number-text.ts";
import { DEVELOP_REVISION } from "#/tests/recording-sources.ts";
import { tallyRecordedFight } from "#/tests/recorded-fights.ts";
import { composeFakeDocument, type FakeElement, getElementsWithin } from "#/tests/fake-document.ts";
import { initTestView } from "#/tests/panel-view.ts";
import { composeShownScreen } from "#/tests/shown-screen.ts";
import {
    getDeclaration,
    getRuleBody,
    readRules,
    RULES_IN_A_SHEET,
    type SheetRule,
} from "#/tests/style-sheet.ts";

/**
 * A rule `develop` wrote that this sheet does not, and the rule written in its place, if any. Where
 * both name one selector and `moved` names properties, the rule stays held to `develop`'s but for
 * those properties, and the rest of it is still compared to the byte.
 */
interface SheetDeparture {
    develop: string | null;
    here: string | null;
    moved?: readonly string[];
}

/** A token a rule names for its words, and the opacity the element wearing it is drawn through. */
interface PaintedInk {
    selector: string;
    name: string;
    opacity: number;
}

/** A ground a test draws on, and the words it is reported in. */
interface NamedGround {
    named: string;
    colour: Colour;
}

/** WCAG AA for text at the size this panel prints figures, and for a mark that is not text. */
const AA_TEXT_RATIO = 4.5;
const AA_MARK_RATIO = 3;
/** Every profession the recordings state, measured over `captures/` on 2026-08-29. */
const PROFESSIONS = ["w", "m", "h", "t", "p", "b"];
const LONGEST_DECLARATION = 200;

const VARIABLE_OPENER = "--MargoMeter-";
const HEX_DIGITS = "0123456789abcdef";
const HEX_BASE = 16;
/** A hash and six digits, which is the only hex spelling the sheet writes. */
const HEX_COLOUR_LENGTH = 7;
const RGB_OPENER = "rgb(";
const RGB_CLOSER = ")";
const CHANNEL_VALUE_MAXIMUM = 255;
const BAR_ICONS = Object.values(BAR_ICON);
/** Both places the caveat mark stands, which one rule draws. */
const CAVEAT_MARKS = `.${CLASS.rowCaveat},.${CLASS.cardCaveat}`;
/** The letter drawn in it: the dot, and the stem under it. */
const CAVEAT_DOT = `.${CLASS.rowCaveat}::before,.${CLASS.cardCaveat}::before`;
const CAVEAT_STEM = `.${CLASS.rowCaveat}::after,.${CLASS.cardCaveat}::after`;
/** The size of text that is kept and never shown, which the caveat mark's letter is. */
const UNSHOWN_SIZE = "0";
/**
 * `develop`'s sheet and the whole of what it imports, at the revision the recordings are read at.
 */
const DEVELOP_SHEET_FILES = [
    "src/ui/panel-look.ts",
    "libs/number-range.ts",
    "libs/number-text.ts",
    "libs/text-walk.ts",
];
const DEVELOP_ROOT_PREFIX = '"@/';
/**
 * `develop`'s words for the two windows and the card, and ours (ADR 0024): its sheet is spelled
 * ours before the comparison, so a name is no departure and anything else still is.
 */
const DEVELOP_SPELLINGS: readonly (readonly [string, string])[] = [
    ["MargoMeter-standing", "MargoMeter-helper"],
    [".standing-", ".helper-"],
    ["--MargoMeter-panel-top", "--MargoMeter-meter-top"],
    [".panel{", ".meter{"],
    [".panel>", ".meter>"],
    ["MargoMeter-tip", "MargoMeter-card"],
    [".tip-", ".card-"],
];

/**
 * ADR 0013, 0014, 0015, 0033, 0036, 0046 and 0048: the rules the options, the sizing, the fight's
 * line, the card in two columns, the bar's controls and the caveat letter, the shelf's outcome,
 * and the inks a bar or an opacity held under the floor move.
 */
const SHEET_DEPARTURES: readonly SheetDeparture[] = [
    // The options control stands first on the bar and leads the rest to its far end.
    { develop: ".titlebar-fights", here: ".titlebar-lead" },
    // Each step's width is its bar measured in one font; where a reader's asks more, the version
    // gives way and no control does. Its ink is drawn through no opacity (ADR 0048).
    {
        develop: ".titlebar-version",
        here: ".titlebar-version",
        moved: ["opacity", "min-width", "overflow", "text-overflow"],
    },
    // A window sized by its corner: its width and its body's height are the reader's, a sized
    // panel stands past the share of the window, and its list takes the room it is given.
    { develop: ":host", here: ":host", moved: ["max-height"] },
    { develop: ".MargoMeter-titlebar", here: ".MargoMeter-titlebar", moved: ["width"] },
    { develop: ".meter", here: ".meter", moved: ["width", "position", "min-height"] },
    { develop: ".meter>.list", here: ".meter>.list", moved: ["flex", "min-height"] },
    { develop: ".MargoMeter-card", here: ".MargoMeter-card", moved: ["right"] },
    { develop: ".MargoMeter-helper", here: ".MargoMeter-helper", moved: ["left", "width"] },
    { develop: ".helper-body", here: ".helper-body", moved: ["box-sizing", "height"] },
    { develop: null, here: ".MargoMeter-helper.helper-folded .size-grip" },
    { develop: null, here: ".size-grip" },
    { develop: null, here: ".meter>.size-grip" },
    { develop: null, here: ".size-grip:hover" },
    // The place joins the fight's line, and only the map's name gives way on it (ADR 0014).
    { develop: ".header-line", here: ".header-line", moved: ["justify-content", "gap"] },
    {
        develop: ".header-place",
        here: ".header-place",
        moved: ["flex", "min-width", "display", "justify-content", "overflow", "text-overflow"],
    },
    { develop: null, here: ".header-line>*" },
    { develop: null, here: ".header-place-name" },
    { develop: null, here: ".header-place-tile" },
    // Each question of the options under a heading, its answers in the shape they need (ADR 0015).
    { develop: ".strips-label", here: null },
    { develop: null, here: ".options-question" },
    { develop: null, here: ".options-heading" },
    { develop: null, here: ".options-steps" },
    { develop: null, here: ".options-step" },
    { develop: null, here: ".options-step:first-child" },
    { develop: null, here: ".options-step-small" },
    { develop: null, here: ".options-step-medium" },
    { develop: null, here: ".options-step-large" },
    { develop: null, here: ".options-window" },
    { develop: null, here: ".options-window-name" },
    { develop: null, here: ".options-window-state" },
    { develop: null, here: ".options-window-state.options-window-own" },
    { develop: null, here: ".options-reset" },
    { develop: null, here: ".options-answer" },
    { develop: null, here: ".options-answer::before" },
    { develop: null, here: ".options-answer.selected::before" },
    { develop: null, here: ".options-step:hover,.options-answer:hover" },
    { develop: null, here: ".options-step.selected,.options-answer.selected" },
    { develop: null, here: ".options-meaning" },
    // A card too tall for the window in one column stands in two (ADR 0033).
    { develop: null, here: ".MargoMeter-card.card-wide" },
    { develop: null, here: ".card-columns" },
    { develop: null, here: ".card-column" },
    { develop: null, here: ".card-column+.card-column" },
    // Every bar control one box with its mark centred in it, and the caveat letter drawn as a dot
    // over a stem rather than spelled (ADR 0036).
    {
        develop: ".titlebar-button",
        here: ".titlebar-button",
        moved: [
            "padding",
            "display",
            "align-items",
            "justify-content",
            "flex",
            "box-sizing",
            "font-size",
            "width",
            "height",
        ],
    },
    { develop: null, here: `.${CLASS.control}::before` },
    ...BAR_ICONS.map((icon) => ({ develop: null, here: `.${composeBarIconClass(icon)}::before` })),
    {
        develop: CAVEAT_MARKS,
        here: CAVEAT_MARKS,
        moved: [
            "align-items",
            "justify-content",
            "position",
            "font-size",
            "font-weight",
            "font-style",
            "line-height",
        ],
    },
    { develop: null, here: `${CAVEAT_DOT},${CAVEAT_STEM}` },
    { develop: null, here: CAVEAT_DOT },
    { develop: null, here: CAVEAT_STEM },
    // How a fight went in the ink of the side that took it, a shelf row's letter in a box of its
    // own, a kept fight that will not read kept as a row, and the note its card says (ADR 0046).
    { develop: null, here: ".header-outcome.outcome-won" },
    { develop: null, here: ".header-outcome.outcome-lost" },
    { develop: null, here: ".row-outcome" },
    { develop: null, here: ".row-outcome.outcome-won" },
    { develop: null, here: ".row-outcome.outcome-lost" },
    { develop: null, here: ".row.unread .row-name" },
    { develop: null, here: ".row.unread .row-outcome" },
    { develop: null, here: ".card-note.card-defect" },
    { develop: null, here: ".card-outcome.outcome-won" },
    { develop: null, here: ".card-outcome.outcome-lost" },
    // Every cell a bar reaches in an ink that clears AA over it, a signal mark on a ground of its
    // own, and no word drawn through an opacity (ADR 0048).
    { develop: ".sides-label", here: ".sides-label", moved: ["opacity"] },
    { develop: ".row-rank", here: ".row-rank", moved: ["color"] },
    { develop: ".row-suspect", here: ".row-suspect", moved: ["background", "border-radius"] },
    { develop: ".row-caveat", here: ".row-caveat", moved: ["background"] },
    { develop: ".row-turn", here: ".row-turn", moved: ["color"] },
    { develop: ".row-share", here: ".row-share", moved: ["color"] },
    { develop: null, here: ".helper-holding .row-share" },
];
const BLACK: Colour = [0, 0, 0];
const WHITE: Colour = [255, 255, 255];

/**
 * ⚠️ **`DESIGN.md` says AA holds on every text-over-colour pairing, and a check of the tokens
 * alone reaches few of them.** The sheet prints words in nine inks, and the ground each one is
 * drawn on is named here rather than assumed. A row's bar is the ground this register cannot
 * name, because its hue is the row's own: what stands over one is `BAR_CELLS`'. Measured
 * 2026-10-08, the thinnest pairing registered here is `heading` over `raised` at 4.82, and the
 * thinnest of the signal inks is `defect` over `track` at 6.61.
 */
const INK_GROUNDS: Record<string, readonly string[]> = {
    text: ["surface", "raised", "track"],
    quiet: ["surface", "raised", "track"],
    suspect: ["surface", "raised", "track"],
    caveat: ["surface", "raised", "track"],
    // A section's heading over the list, and a run's on a card.
    heading: ["surface", "raised"],
    // The defects block in the panel body, a kept fight's mark on its shelf row, and the note on
    // that fight's card (ADR 0046).
    defect: ["surface", "raised", "track"],
    // How a fight went: a shelf row's letter on `track`, the header's word on `surface`, a fight
    // card's on `raised` (ADR 0046). The text floor holds them as the sides bar's fills too, which
    // stand on `track`.
    ours: ["surface", "raised", "track"],
    theirs: ["surface", "raised", "track"],
    // ⚠️ **One `color:` doing two jobs**: the segment of the sides bar nobody's share fills, on
    // `track`, and the line under it naming that share, whose words take the ink the line wears.
    nobody: ["surface", "track"],
};

/**
 * The cells a ranking row draws after its bar, each as the classes it wears (`renderRow` in
 * `src/ui/panel-element.ts`). A bar reaches any of them: the rank's at a fill of a tenth, the
 * share's at a full one.
 */
const BAR_CELLS: readonly (readonly string[])[] = [
    [CLASS.rowRank],
    [CLASS.rowSuspect],
    [CLASS.rowCaveat],
    [CLASS.rowTurn],
    [CLASS.rowName],
    [CLASS.rowValue, CLASS.figure],
    [CLASS.rowShare],
];
/** What a row draws that prints no word: its bar, the bar's cap, and the side's edge. */
const BAR_FILLS: readonly string[] = [CLASS.bar, CLASS.barCap];
const ROW_FILLS: readonly string[] = [...BAR_FILLS, CLASS.rowSide];
/**
 * What a row with a bar and the regions holding it can wear. A rule selecting a bar cell through
 * any other class — a shelf row's `unread`, the helper's holding row — selects a row with no bar.
 */
const BAR_ROW_CLASSES: readonly string[] = [
    CLASS.meter,
    CLASS.list,
    CLASS.pinned,
    CLASS.outside,
    CLASS.row,
    CLASS.rowDrillable,
    CLASS.rowLeaf,
    CLASS.rowChosen,
    CLASS.rowApart,
    CLASS.bar,
    CLASS.rowValue,
    CLASS.figure,
];
const VARIABLE_CALL_OPENER = `var(${VARIABLE_OPENER}`;
/** A selector's combinators, which part one element from the next. */
const COMBINATORS = [">", "~", "+"];
/** A fight of eleven, whose ranking rows a turn mark and a suspicion are drawn onto. */
const RANKED_FIGHT = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

/** What a cell has to state to hold a run of text on one line and give way to its neighbour. */
const SHORTENING = ["min-width", "overflow", "text-overflow", "white-space"] as const;

/**
 * ⚠️ **A row is pressed, so a press must not leave text selected behind it.** Both windows draw
 * their rows under one class, and the panel already refuses selection where it is dragged — the
 * bar and the strips. A row was the one press target that did not, which is what a reader met in
 * the window beside the panel. The prefixed spelling stands beside the plain one because Safari
 * has never shipped it unprefixed (`docs/browser-support.md`).
 */
Deno.test("a row refuses to have its text selected, in either window", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const rule = sheet.slice(sheet.indexOf(`.${CLASS.row}{`));
        const own = rule.slice(0, rule.indexOf("}"));
        assertStringIncludes(own, "user-select:none", "a press leaves no selection behind it");
        assertStringIncludes(
            own,
            "-webkit-user-select:none",
            "and Safari is told in its own words",
        );
    }
});

Deno.test("a colour the sheet writes is read back in either spelling, and nothing else is", () => {
    assertEquals(parseSheetColour("#0f161d"), [0x0f, 0x16, 0x1d], "a token's spelling");
    assertEquals(parseSheetColour("rgb(0 0 255)"), [0, 0, 255], "and a composed one's, to a byte");
    assertStrictEquals(parseSheetColour("rgb(0 0 256)"), null, "but not one past a byte");
    assertStrictEquals(parseSheetColour("rgb(0 0)"), null, "two channels are not a colour");
    assertStrictEquals(parseSheetColour("white"), null, "a colour nobody wrote is not read");
    assertStrictEquals(parseSheetColour("#fff"), null, "and neither is a short one");
    assertStrictEquals(parseSheetColour("#gggggg"), null, "nor one of letters past the digits");
});

/** What the sheet writes a colour as, read back: `#rrggbb`, or `rgb(r g b)` for one it composed. */
function parseSheetColour(text: string): Colour | null {
    if (text.startsWith(RGB_OPENER)) return parseSheetColourRgb(text);
    if (!text.startsWith("#")) return null;
    if (text.length !== HEX_COLOUR_LENGTH) return null;
    const channels: number[] = [];
    for (let index = 1; index < text.length; index += 2) {
        const high = HEX_DIGITS.indexOf(text.charAt(index));
        const low = HEX_DIGITS.indexOf(text.charAt(index + 1));
        if (high === -1) return null;
        if (low === -1) return null;
        channels.push(high * HEX_BASE + low);
    }
    return composeSheetColour(channels);
}

function parseSheetColourRgb(text: string): Colour | null {
    if (!text.endsWith(RGB_CLOSER)) return null;
    const channels: number[] = [];
    const inside = text.slice(RGB_OPENER.length, text.length - RGB_CLOSER.length);
    for (const stated of inside.split(" ")) {
        const channel = parseInteger(stated);
        if (channel === null) return null;
        if (channel < 0) return null;
        if (channel > CHANNEL_VALUE_MAXIMUM) return null;
        channels.push(channel);
    }
    return composeSheetColour(channels);
}

function composeSheetColour(channels: readonly number[]): Colour | null {
    const [red, green, blue, past] = channels;
    if (red === undefined) return null;
    if (green === undefined) return null;
    if (blue === undefined) return null;
    if (past !== undefined) return null;
    return [red, green, blue];
}

Deno.test("a ratio runs from one, for a colour on itself, to twenty-one", () => {
    assertStrictEquals(getContrastRatio(BLACK, WHITE), 21, "the widest there is");
    assertStrictEquals(getContrastRatio(WHITE, WHITE), 1, "and the narrowest");
    assert(
        getContrastRatio(BLACK, WHITE) > getContrastRatio(SURFACE.panel, SURFACE.raised),
        "order",
    );
});

Deno.test("every ink the sheet paints with clears its floor over the ground it is drawn on", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const values = readSheetVariables(sheet);
        assertStrictEquals(
            values.get("surface"),
            formatColour(SURFACE.panel),
            "the sheet ships the surface it is read for",
        );

        const painted = readPaintedInks(sheet, values);
        const grounds = readNamesUsedBy(sheet, "background");
        assert(painted.length > 0, "the sheet paints with something");
        let checked = 0;
        for (const ink of painted) {
            const over = INK_GROUNDS[ink.name];
            assertExists(
                over,
                `${ink.name}: the sheet paints with it and the register omits it`,
            );
            checked += countPairingsClearing(values, ink, over);
            for (const where of over) {
                assertArrayIncludes(
                    [...grounds],
                    [where],
                    `${where}: a ground nothing paints`,
                );
            }
        }
        assert(checked > 0, "some pairing was asked");
        const names = painted.map((ink) => ink.name);
        for (const name of Object.keys(INK_GROUNDS)) {
            assertArrayIncludes(
                names,
                [name],
                `${name}: registered, and painted with never`,
            );
        }
    }
});

/** Every `--MargoMeter-x:y;` the sheet declares, as the name and the value it ships. */
function readSheetVariables(sheet: string): Map<string, string> {
    const valueByName = new Map<string, string>();
    let openerIndex = sheet.indexOf(VARIABLE_OPENER);
    for (let held = 0; held < sheet.length; held += 1) {
        if (openerIndex === -1) break;
        const colon = sheet.indexOf(":", openerIndex);
        const shut = sheet.indexOf(";", openerIndex);
        const name = sheet.slice(openerIndex + VARIABLE_OPENER.length, colon);
        openerIndex = sheet.indexOf(
            VARIABLE_OPENER,
            openerIndex + VARIABLE_OPENER.length,
        );
        if (colon === -1) continue;
        if (shut === -1) continue;
        if (shut < colon) continue;
        if (name.includes(")")) continue;
        valueByName.set(name, sheet.slice(colon + 1, shut).trim());
    }
    return valueByName;
}

/**
 * Every token the sheet names for `color`, rule by rule, at the lowest opacity any rule gives an
 * element that rule selects. ⚠️ **An opacity dims what a reader sees, and the token does not say
 * so**: `opacity:0.7` stood the version 3.77 off its bar while the token read 6.28 (ADR 0048). An
 * element dimmed whose ink no rule names, or names as `inherit`, is a pairing nobody can check,
 * and is refused rather than read at full strength. A bar's fill is dimmed and prints no word.
 */
function readPaintedInks(
    sheet: string,
    values: ReadonlyMap<string, string>,
): PaintedInk[] {
    const rules = readRules(sheet);
    const opacityByClass = new Map<string, number>();
    for (const rule of rules) {
        const stated = readOpacity(rule.body, values);
        if (stated === null) continue;
        for (const name of readSelectedClasses(rule.selector).flat()) {
            opacityByClass.set(name, Math.min(stated, opacityByClass.get(name) ?? 1));
        }
    }
    const painted: PaintedInk[] = [];
    const inked = new Set<string>();
    for (const rule of rules) {
        if (!rule.body.includes("color:")) continue;
        const stated = getDeclaration(rule.body, "color");
        if (stated === null) continue;
        const classes = readSelectedClasses(rule.selector).flat();
        const opacity = Math.min(
            1,
            ...classes.map((name) => opacityByClass.get(name) ?? 1),
        );
        const name = readVariableName(stated);
        if (name === null) {
            assertStrictEquals(
                opacity,
                1,
                `${rule.selector}: dims an ink it names as ${stated}`,
            );
            continue;
        }
        for (const selected of classes) inked.add(selected);
        painted.push({ selector: rule.selector, name, opacity });
    }
    for (const [dimmed, opacity] of opacityByClass) {
        if (BAR_FILLS.includes(dimmed)) continue;
        assert(
            inked.has(dimmed),
            `.${dimmed}: drawn at ${opacity} in an ink no rule names`,
        );
    }
    return painted;
}

/** The opacity a rule states, a token's read through, or null where it states none. */
function readOpacity(
    body: string,
    values: ReadonlyMap<string, string>,
): number | null {
    if (!body.includes("opacity:")) return null;
    const stated = getDeclaration(body, "opacity");
    if (stated === null) return null;
    const name = readVariableName(stated);
    const opacity = Number(name === null ? stated : values.get(name));
    assert(Number.isFinite(opacity), `opacity ${stated} is a number`);
    assert(opacity >= 0, `opacity ${stated} is no less than none`);
    assert(opacity <= 1, `opacity ${stated} is no more than whole`);
    return opacity;
}

/** The token a value spends, or null where it is no `var(--MargoMeter-…)`. */
function readVariableName(stated: string): string | null {
    if (!stated.startsWith(VARIABLE_CALL_OPENER)) return null;
    if (!stated.endsWith(")")) return null;
    return stated.slice(VARIABLE_CALL_OPENER.length, -1);
}

/** The classes of the element each part of a selector lands on: its last compound's. */
function readSelectedClasses(selector: string): string[][] {
    return selector.split(",").map((selected) => readCompounds(selected).at(-1) ?? []);
}

/** A selector's compounds, each as its classes, a pseudo-class or -element set aside. */
function readCompounds(selected: string): string[][] {
    let spaced = selected;
    for (const combinator of COMBINATORS) {
        spaced = spaced.replaceAll(combinator, " ");
    }
    return spaced.split(" ").filter((compound) => compound.length > 0).map((
        compound,
    ) => (compound.split(":")[0] ?? "").split(".").filter((name) => name.length > 0));
}

/** The variables named after one property, so `color:` and `background:` are asked apart. */
function readNamesUsedBy(sheet: string, property: string): Set<string> {
    const names = new Set<string>();
    const opener = `${property}:var(${VARIABLE_OPENER}`;
    let openerIndex = sheet.indexOf(opener);
    for (let held = 0; held < sheet.length; held += 1) {
        if (openerIndex === -1) break;
        const shut = sheet.indexOf(")", openerIndex);
        if (shut !== -1) names.add(sheet.slice(openerIndex + opener.length, shut));
        openerIndex = sheet.indexOf(opener, openerIndex + opener.length);
    }
    return names;
}

/** Each pairing of an ink, drawn through its opacity, held to the text floor; how many were. */
function countPairingsClearing(
    values: ReadonlyMap<string, string>,
    ink: PaintedInk,
    grounds: readonly string[],
): number {
    const token = parseSheetColour(values.get(ink.name) ?? "");
    assertExists(
        token,
        `${ink.name}: painted with, and never declared as a colour`,
    );
    let counted = 0;
    for (const where of grounds) {
        const ground = parseSheetColour(values.get(where) ?? "");
        assertExists(ground, `${where}: drawn on, and never declared as a colour`);
        const ratio = getContrastRatio(
            composeInkOver(token, ground, ink.opacity),
            ground,
        );
        assert(
            ratio >= AA_TEXT_RATIO,
            `${ink.selector} in ${ink.name} at ${ink.opacity} on ${where}: ` +
                `${ratio.toFixed(2)} under ${AA_TEXT_RATIO}`,
        );
        counted += 1;
    }
    return counted;
}

/** One colour over another at an alpha, a channel at a time and rounded, as a browser draws it. */
function composeInkOver(top: Colour, bottom: Colour, alpha: number): Colour {
    const mix = (above: number, below: number) => Math.round(alpha * above + (1 - alpha) * below);
    return [mix(top[0], bottom[0]), mix(top[1], bottom[1]), mix(top[2], bottom[2])];
}

Deno.test("an ink is read through the opacity it is drawn at, and an unnamed one is refused", () => {
    const values = new Map([["text", "#ffffff"], ["tint", "0.5"]]);
    const dimmed = readPaintedInks(
        ".a{color:var(--MargoMeter-text);opacity:0.5;}",
        values,
    );
    assertEquals(dimmed.map((ink) => ink.opacity), [0.5], "a rule's own opacity");
    const apart = readPaintedInks(
        ".a{color:var(--MargoMeter-text);}.x .a{opacity:var(--MargoMeter-tint);}",
        values,
    );
    assertEquals(
        apart.map((ink) => ink.opacity),
        [0.5],
        "and one another rule gives it",
    );
    const whole = readPaintedInks(".a{color:var(--MargoMeter-text);}", values);
    assertEquals(
        whole.map((ink) => ink.opacity),
        [1],
        "and none, which is whole",
    );
    assertThrows(
        () => readPaintedInks(".a{opacity:0.7;}", values),
        AssertionError,
        "in an ink no rule names",
    );
    assertThrows(
        () =>
            readPaintedInks(
                ".a{color:var(--MargoMeter-text);opacity:0.8;}.b .a{color:inherit;}",
                values,
            ),
        AssertionError,
        "dims an ink it names as inherit",
    );
    assertEquals(
        readPaintedInks(".bar{opacity:0.4;}", values),
        [],
        "a bar's fill prints nothing",
    );
    assertEquals(readSelectedClasses(".a .b.c>.d::before,.e:hover"), [["d"], [
        "e",
    ]], "the element");
});

/**
 * ⚠️ **A bar is the ground a row's cells stand on, and its hue is the row's.** Every cell the bar
 * reaches is held over every bar the sheet can draw: each profession's and the colourless one a
 * cut of a figure takes, at each strength a bar is drawn at. A cell that paints a ground of its
 * own stands on that instead. The quiet ink over the colourless bar reads 2.25 (ADR 0048).
 */
Deno.test("every cell a bar reaches clears AA over every bar the panel draws", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const values = readSheetVariables(sheet);
        const bars = readBarGrounds(sheet, values);
        let checked = 0;
        for (const cell of BAR_CELLS) {
            const paint = readCellPaint(sheet, values, cell);
            const under = paint.grounds.length > 0 ? paint.grounds : bars;
            for (const ink of paint.inks) {
                const token = parseSheetColour(values.get(ink.name) ?? "");
                assertExists(
                    token,
                    `${ink.name}: painted with, and never declared as a colour`,
                );
                for (const ground of under) {
                    const drawn = composeInkOver(token, ground.colour, ink.opacity);
                    const ratio = getContrastRatio(drawn, ground.colour);
                    assert(
                        ratio >= AA_TEXT_RATIO,
                        `.${cell.join(".")} in ${ink.name} on ${ground.named}: ` +
                            `${ratio.toFixed(2)} under ${AA_TEXT_RATIO}`,
                    );
                    checked += 1;
                }
            }
        }
        assert(checked > BAR_CELLS.length * bars.length / 2, "most cells were asked over a bar");
    }
});

/**
 * Every bar the sheet can draw: each hue over the row's own ground, at each opacity a rule gives
 * a bar. The tint is read off the sheet and composed here, and tied to `composeBarColour`.
 */
function readBarGrounds(
    sheet: string,
    values: ReadonlyMap<string, string>,
): NamedGround[] {
    const rowGround = getDeclaration(getRuleBody(sheet, `.${CLASS.row}`), "background") ?? "";
    const trackName = readVariableName(rowGround);
    assertExists(trackName, "a row paints its own ground with a token");
    const track = parseSheetColour(values.get(trackName) ?? "");
    assertExists(track, `${trackName}: a row's ground, and declared as a colour`);
    const tints = readRules(sheet).filter((rule) =>
        readSelectedClasses(rule.selector).some((element) => element.includes(CLASS.bar))
    ).map((rule) => readOpacity(rule.body, values)).filter((tint) => tint !== null);
    assert(
        tints.length > 1,
        "a bar is drawn at the ranking's strength, and apart at another",
    );
    const hues = [
        ...PROFESSIONS.map((profession) => lookupColourForProfession(profession)),
        lookupColourForProfession(null),
    ];
    const grounds: NamedGround[] = [];
    for (const tint of tints) {
        for (const hue of hues) {
            const named = `${formatColour(hue)} at ${tint}`;
            grounds.push({ named, colour: composeInkOver(hue, track, tint) });
        }
    }
    for (const hue of hues) {
        assertArrayIncludes(
            grounds.map((ground) => ground.colour),
            [composeBarColour(hue)],
            `${formatColour(hue)}: the bar this test draws is the one the look composes`,
        );
    }
    return grounds;
}

/**
 * What a bar cell is painted in and on, from every rule that can reach it in a row with a bar:
 * the inks those rules name, or the one it inherits where they name none, and the grounds they
 * paint under it, which it then stands on rather than on the bar.
 */
function readCellPaint(
    sheet: string,
    values: ReadonlyMap<string, string>,
    cell: readonly string[],
): { inks: PaintedInk[]; grounds: NamedGround[] } {
    const inks: PaintedInk[] = [];
    const grounds: NamedGround[] = [];
    for (const rule of readRules(sheet)) {
        const reaching = rule.selector.split(",").filter((selected) => {
            if (selected.includes("::")) return false;
            const compounds = readCompounds(selected);
            const element = compounds.at(-1) ?? [];
            if (element.length === 0) return false;
            if (!element.every((name) => cell.includes(name))) return false;
            return compounds.slice(0, -1).flat().every((name) => BAR_ROW_CLASSES.includes(name));
        });
        if (reaching.length === 0) continue;
        const opacity = readOpacity(rule.body, values) ?? 1;
        const stated = rule.body.includes("color:") ? getDeclaration(rule.body, "color") : null;
        if (stated !== null) {
            const name = readVariableName(stated);
            assertExists(
                name,
                `${rule.selector}: a bar cell's ink is a token, never ${stated}`,
            );
            inks.push({ selector: rule.selector, name, opacity });
        }
        const painted = readVariableName(
            getDeclaration(rule.body, "background") ?? "",
        );
        if (painted !== null) {
            const colour = parseSheetColour(values.get(painted) ?? "");
            assertExists(
                colour,
                `${painted}: a cell's own ground, and declared as a colour`,
            );
            grounds.push({ named: painted, colour });
        }
    }
    if (inks.length === 0) {
        const inherited = readVariableName(
            getDeclaration(getRuleBody(sheet, `.${CLASS.meter}`), "color") ?? "",
        );
        assertExists(
            inherited,
            "a cell naming no ink inherits the panel's, which is a token",
        );
        inks.push({ selector: `.${CLASS.meter}`, name: inherited, opacity: 1 });
    }
    return { inks, grounds };
}

/**
 * ⚠️ **`BAR_CELLS` is a register, and a register goes stale the day a row draws a cell more.**
 * So a fight's ranking is drawn, with a turn mark and a suspicion on its top row, and every cell
 * standing beside a bar has to be one the register names or a fill that prints no word.
 */
Deno.test("every cell a ranking row draws beside its bar is one the contrast check holds", () => {
    const { roster, statistics } = tallyRecordedFight(RANKED_FIGHT);
    const reading = presentScreen(
        statistics,
        roster,
        "damageDealt",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const topRow = reading.rows[0];
    assertExists(topRow, "the fight ranks somebody");
    const marked = reading.rows.map((row) =>
        row === topRow ? { ...row, detail: { ...row.detail, unreadMessagesUnknownKey: 2 } } : row
    );
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen({ ...reading, rows: marked }),
        readerSide: 1,
        turnHolderId: topRow.combatantId,
    });
    const rows = getElementsWithin(panel.element as FakeElement).filter((drawn) =>
        drawn.children.some((child) => child.className === CLASS.bar)
    );
    assert(rows.length > 1, "the ranking draws its rows with a bar each");
    const registered = BAR_CELLS.map((cell) => cell.join(" "));
    const drawn = new Set<string>();
    for (const row of rows) {
        const cells = row.children.flatMap((child) => [child, ...child.children]);
        for (const cell of cells) {
            if (ROW_FILLS.includes(cell.className)) continue;
            drawn.add(cell.className);
            assertArrayIncludes(
                registered,
                [cell.className],
                `${cell.className}: unregistered`,
            );
        }
    }
    for (
        const mark of [
            CLASS.rowTurn,
            CLASS.rowSuspect,
            CLASS.rowShare,
            CLASS.rowRank,
        ]
    ) {
        assert(
            drawn.has(mark),
            `${mark}: drawn, so the walk reached what it is asked about`,
        );
    }
});

Deno.test("text over every surface clears AA", () => {
    for (const surface of Object.values(SURFACE)) {
        assert(
            getContrastRatio(TEXT.plain, surface) >= AA_TEXT_RATIO,
            `${formatColour(surface)} under a figure`,
        );
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
    // Every hue the panel can put under a figure: a profession on a ranking row, and the
    // colourless one every cut of a figure takes.
    const hues = [
        ...PROFESSIONS.map((profession) => lookupColourForProfession(profession)),
        lookupColourForProfession(null),
    ];
    let lightest = 21;
    for (const hue of hues) {
        const bar = composeBarColour(hue);
        const ratio = getContrastRatio(getInkForBar(hue), bar);
        const named = `${formatColour(hue)}: ${ratio.toFixed(2)} on ${formatColour(bar)}`;
        assert(ratio >= AA_TEXT_RATIO, named);
        lightest = Math.min(lightest, ratio);
    }
    assert(hues.length > PALETTE_COLOURS.length, "more pairings were checked than there are hues");
    assert(lightest >= AA_TEXT_RATIO, "the worst pairing the panel can draw still clears it");
});

Deno.test("the ink is computed, and at this tint every bar takes the light one", () => {
    const inks = new Set(PALETTE_COLOURS.map((hue) => getInkForBar(hue)));
    // Measured, not designed: at a tint of 0.55 over this track no bar is light enough for the
    // dark ink, which is why that token is reachable only by a lighter bar than the panel draws.
    assertEquals([...inks], [TEXT.inkLight], "every bar the panel draws takes the light ink");
});

Deno.test("the two sides are told apart by more than a hue", () => {
    const sides = [formatColour(SIGNAL.ours), formatColour(SIGNAL.theirs)];
    assertStrictEquals(new Set(sides).size, 2, "two sides, two colours");
    assert(
        getContrastRatio(SIGNAL.suspect, SURFACE.panel) >= AA_MARK_RATIO,
        "a mark stands off its surface",
    );
    // The one it was drawn in until it got an ink of its own, and the reason it needed one: a
    // glyph in the label's colour stands 1.00 from the words it qualifies.
    assert(
        getContrastRatio(SIGNAL.caveat, TEXT.quiet) > getContrastRatio(TEXT.quiet, TEXT.quiet),
        "and off the label it stands beside, which is what a caveat mark is read against",
    );
    assertStrictEquals(
        formatColour(SIGNAL.unknown),
        "#9299a0",
        "unknown is desaturated: the absence of a category",
    );
});

/**
 * The sheet is `develop`'s, rule for rule and to the byte (**W8**), but for the rules a decision
 * record names: every token, every colour and every other rule, in the order `develop` writes them.
 * A token written in another spelling here has to write the same text, and a value that moved
 * without a record naming it is a finding in one of the two. The windows' names are `develop`'s
 * spelled ours first (ADR 0024).
 */
Deno.test("the style sheet is develop's, but for the rules its decision records move", async () => {
    let develop = await readDevelopStyleSheet();
    for (const [was, is] of DEVELOP_SPELLINGS) {
        assert(develop.includes(was), `develop's sheet spells ${was}, which is why it is renamed`);
        develop = develop.replaceAll(was, is);
    }
    assertEquals(
        findSheetDepartures(develop, composeStyleSheet(TYPE_STEP.small), SHEET_DEPARTURES),
        [],
        `the sheet develop @ ${DEVELOP_REVISION} ships, but for what a record names`,
    );
});

/**
 * Where the sheet differs from `develop`'s, one finding per difference, and nothing where each one
 * is a departure a record names. After the named rules are set aside, the rest compare in order,
 * and the first rule that differs is the one reported: every rule after it would differ too.
 */
function findSheetDepartures(
    develop: string,
    here: string,
    departures: readonly SheetDeparture[],
): string[] {
    const findings: string[] = [];
    const developRules = readRules(develop);
    const hereRules = readRules(here);
    const movedBySelector = new Map<string, readonly string[]>();
    for (const departure of departures) {
        const { develop: was, here: is } = departure;
        if (was !== null) {
            if (!developRules.some((rule) => rule.selector === was)) {
                findings.push(`${was} unknown`);
            }
        }
        if (is !== null) {
            if (!hereRules.some((rule) => rule.selector === is)) findings.push(`${is} not written`);
        }
        if (departure.moved !== undefined) {
            if (was !== null) movedBySelector.set(was, departure.moved);
        }
    }
    const isWhole = (departure: SheetDeparture) => departure.moved === undefined;
    const set = (pick: (departure: SheetDeparture) => string | null) =>
        departures.filter(isWhole).map(pick);
    const kept = (rules: readonly SheetRule[], gone: readonly (string | null)[]) =>
        rules.filter((rule) => !gone.includes(rule.selector)).map((rule) => {
            const moved = movedBySelector.get(rule.selector) ?? [];
            return `${rule.selector}{${composeBodyWithout(rule.body, moved)}}`;
        });
    const developKept = kept(developRules, set((departure) => departure.develop));
    const hereKept = kept(hereRules, set((departure) => departure.here));
    for (const [selector, moved] of movedBySelector) {
        const was = developRules.find((rule) => rule.selector === selector)?.body;
        const is = hereRules.find((rule) => rule.selector === selector)?.body;
        if (was === is) findings.push(`${selector} moved nothing of ${moved.join(", ")}`);
    }
    const length = Math.max(developKept.length, hereKept.length);
    for (let index = 0; index < length; index += 1) {
        if (developKept[index] === hereKept[index]) continue;
        findings.push(`rule ${index}: develop ${developKept[index]} against ${hereKept[index]}`);
        break;
    }
    return findings;
}

/** A rule's declarations but those a record names, in the order they were written. */
function composeBodyWithout(body: string, moved: readonly string[]): string {
    if (moved.length === 0) return body;
    return body.split(";").filter((stated) => {
        const colon = stated.indexOf(":");
        return colon === -1 || !moved.includes(stated.slice(0, colon));
    }).join(";");
}

/**
 * `develop`'s modules written out of git into a directory of their own, and the sheet asked for.
 */
async function readDevelopStyleSheet(): Promise<string> {
    const root = Deno.makeTempDirSync({ prefix: "margometer-develop-sheet-" });
    for (const path of DEVELOP_SHEET_FILES) {
        const shown = new Deno.Command("git", {
            args: ["show", `${DEVELOP_REVISION}:${path}`],
            stdout: "piped",
        }).outputSync();
        assert(shown.success, `develop:${path} is there at ${DEVELOP_REVISION}`);
        const upward = "../".repeat(path.split("/").length - 1);
        const text = new TextDecoder().decode(shown.stdout);
        const target = `${root}/${path}`;
        Deno.mkdirSync(target.slice(0, target.lastIndexOf("/")), { recursive: true });
        Deno.writeTextFileSync(target, text.replaceAll(DEVELOP_ROOT_PREFIX, `"./${upward}`));
    }
    const module = await import(`file://${root}/${DEVELOP_SHEET_FILES[0]}`);
    Deno.removeSync(root, { recursive: true });
    const compose = module.composeStyleSheet;
    assertStrictEquals(typeof compose, "function", "develop's sheet module composes a sheet");
    const sheet = compose();
    assertStrictEquals(typeof sheet, "string", "and what it composes is text");
    return sheet;
}

/** What the comparison with `develop` answers, proved on a sheet small enough to read whole. */
Deno.test("a rule moved away from develop's is found, and one a record names is not", () => {
    const develop = ".a{x:1}.b{y:2}.c{z:3}";
    const renamed = [{ develop: ".b", here: ".d" }];
    assertEquals(findSheetDepartures(develop, develop, []), [], "the same sheet is no departure");
    assertEquals(findSheetDepartures(develop, ".a{x:1}.d{y:2}.c{z:3}", renamed), [], "named");
    assertStrictEquals(
        findSheetDepartures(develop, ".a{x:1}.b{y:9}.c{z:3}", []).length,
        1,
        "a value moved with no record naming it",
    );
    assertStrictEquals(
        findSheetDepartures(develop, ".a{x:1}.c{z:3}.b{y:2}", []).length,
        1,
        "two rules written in another order",
    );
    assertStrictEquals(
        findSheetDepartures(develop, `${develop}.e{w:4}`, []).length,
        1,
        "a rule written that develop never wrote",
    );
    assertArrayIncludes(
        findSheetDepartures(develop, develop, renamed),
        [".d not written"],
        "a record naming a rule the sheet no longer writes, which is a record gone stale",
    );
    const moved = [{ develop: ".b", here: ".b", moved: ["y"] }];
    assertEquals(findSheetDepartures(develop, ".a{x:1}.b{y:9}.c{z:3}", moved), [], "a named value");
    assertStrictEquals(
        findSheetDepartures(develop, ".a{x:1}.b{y:9;w:4}.c{z:3}", moved).length,
        1,
        "and one beside it that no record names",
    );
    assertArrayIncludes(
        findSheetDepartures(develop, develop, moved),
        [".b moved nothing of y"],
        "and a record naming a value that did not move",
    );
});

Deno.test("the sheet shuts the game out, and every class it selects is one the panel wears", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        assert(sheet.startsWith(":host{all:initial;"), "the reset comes before anything of ours");
        for (const [name, spelling] of Object.entries(CLASS)) {
            assertStringIncludes(sheet, `.${spelling}`, `${name} is a class no rule selects`);
        }
        const opened = [...sheet].filter((character) => character === "{").length;
        const closed = [...sheet].filter((character) => character === "}").length;
        assertStrictEquals(opened, closed, "every rule the sheet opens is closed");
        assert(opened > 1, "and the sheet holds more than the host's own rule");
    }
});

Deno.test("a value is written once, and every rule spends it by name", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        // A value stated twice is the bug this catches, wherever the second one sits: the host's own
        // declarations spend tokens like any other rule, so one occurrence is the whole allowance.
        const twice: string[] = [];
        const signals = [SIGNAL.suspect, SIGNAL.caveat, SIGNAL.defect];
        const colours = [...Object.values(SURFACE), ...Object.values(TEXT), ...signals];
        for (const colourText of colours.map(formatColour)) {
            const written = sheet.split(colourText).length - 1;
            if (written > 1) twice.push(`${colourText} written ${written} times`);
        }
        assertEquals(twice, [], "a value the sheet writes more than once");
        assertStringIncludes(
            sheet,
            formatColour(SURFACE.panel),
            "and the values it does write are the tokens",
        );
        assertStringIncludes(sheet, "var(--MargoMeter-", "which a rule reaches by our own name");
        assert(sheet.split("var(--MargoMeter-").length > 10, "and reaches by name many times over");
    }
});

Deno.test("the card stands over the window beside the panel, and both over the frame", () => {
    // ⚠️ The window carried the host's own layer and the card carried none, so a window dragged
    // over the panel covered the card a reader had just pointed at. `develop ADR 0068`.
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const layerOf = (selector: string) => {
            const selectorIndex = sheet.indexOf(selector);
            assert(selectorIndex >= 0, `the sheet spells ${selector}`);
            const rule = sheet.slice(selectorIndex, sheet.indexOf("}", selectorIndex));
            const written = rule.split("z-index:")[1] ?? "";
            return Number(written.split(";")[0]);
        };
        const helper = layerOf(`.${CLASS.helper}{`);
        const card = layerOf(`.${CLASS.card}{`);
        assertStrictEquals(
            helper,
            Number(LAYER.helper),
            "the window takes the layer it is given",
        );
        assertStrictEquals(card, Number(LAYER.card), "and so does the card");
        assert(card > helper, "a card is what a reader pointed at, so nothing else covers it");
        // The frame takes none of its own: it is what both of the others may be dragged over.
        const frame = sheet.slice(
            sheet.indexOf(":host{"),
            sheet.indexOf("}", sheet.indexOf(":host{")),
        );
        assertStringIncludes(
            frame,
            `z-index:${PLACE.layer}`,
            "the host takes its layer on the page",
        );
        // A positioned host with a layer is a stacking context of its own, which is what keeps the
        // numbers inside the root from ever meeting the game's (`develop ADR 0114`).
        assertStringIncludes(
            frame,
            "position:fixed",
            "and what stands inside it stands in it alone",
        );
    }
});

Deno.test("a folded panel is drawn by the one region the fold hides", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        // The bug this catches was photographed rather than reasoned: a bare `.folded` ties with the
        // region's own rule at one class apiece, and the region wins on source order, so a folded
        // panel stood 49 pixels tall against the bar's 23. Two classes in the selector is what makes
        // the outcome independent of where the rule is written.
        assert(
            sheet.includes(`.${CLASS.frame}.${CLASS.folded}`),
            "the frame folds by a selector that outranks its own rule",
        );
        assert(
            !sheet.includes(`;}.${CLASS.folded}{`),
            "and never by the bare class, which would tie",
        );
        assertStringIncludes(
            sheet,
            "display:none",
            "what a folded region does is stop being drawn",
        );
    }
});

Deno.test("what stands over a region's first bar is what stands under its last", () => {
    // The bug this catches was photographed rather than reasoned, twice over. The list asked for
    // its two paddings a second time inside a `height` that `content-box` had already put them
    // outside of, and both regions holding rows asked for `regionAcross` underneath while asking
    // for a shorter step above — so the ranking stood 5px under its top edge and 21px over its
    // bottom one, measured in Chrome 152 on 2026-08-29. Every guard stayed green: none of them
    // lays anything out, and none of them adds up what a rule spends either.
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const margin = getDeclaration(getRuleBody(sheet, `.${CLASS.row}`), "margin-bottom");
        assertExists(margin, "a row carries its own margin, which the last row carries too");
        const carried = getPixels(margin);
        assert(carried > 0, "and that margin is a length a reader can see");
        for (const region of [CLASS.list, CLASS.pinned]) {
            const selector = `.${region}`;
            const body = getRuleBody(sheet, selector);
            const [above, below] = getEdgesDown(body, selector, "padding");
            assertStrictEquals(
                above,
                (below ?? 0) + carried,
                `${selector}: ${above}px over the first bar against ${(below ?? 0) + carried}px ` +
                    `under the last`,
            );
        }
    }
});

/** A term, or one subtraction of two — which is every arithmetic an inset here spends. */
function getPixels(stated: string): number {
    assert(stated.length > 0, "a length says something");
    if (!stated.startsWith("calc(")) return getTermPixels(stated);
    const inside = stated.slice("calc(".length, stated.length - 1);
    const parts = inside.split(" - ");
    assertStrictEquals(parts.length, 2, `${stated} is not the one subtraction this reader knows`);
    return getTermPixels(parts[0] ?? "") - getTermPixels(parts[1] ?? "");
}

/** A token or a length, which is the whole of what a term can be. */
function getTermPixels(stated: string): number {
    assert(stated.length > 0, "a term says something");
    if (stated.startsWith("var(")) {
        const name = stated.slice("var(--MargoMeter-".length, stated.length - 1);
        const held = Object.entries(SPACE_PIXELS).find(([token]) =>
            getTokenSpelling(token) === name
        );
        assertExists(held, `${stated} spends a token SPACE_PIXELS does not hold`);
        return held[1];
    }
    if (stated === "0") return 0;
    assert(stated.endsWith("px"), `${stated} is a length this panel does not measure in`);
    const pixels = Number(stated.slice(0, -"px".length));
    assert(Number.isFinite(pixels), `${stated} is not a number`);
    return pixels;
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

Deno.test("a rule between two regions has the same air on either side of it", () => {
    // The one this catches was the last one standing, and every region was already even inside
    // itself: the pinned block carried a `margin-top` of its own on top of the list's bottom
    // inset, so the dashed rule sat 9px under the ranking and 4px over the block it opened —
    // measured in Chrome 152 on 2026-08-29. A region being even says nothing about the seam
    // between two of them, and the seam is what a reader sees as a line drawn off centre.
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const stated = getDeclaration(getRuleBody(sheet, `.${CLASS.row}`), "margin-bottom");
        assertExists(stated, "a row carries its own margin into the space under the last bar");
        const margin = getPixels(stated);
        const list = getAirAround(sheet, `.${CLASS.list}`, margin);
        const pinned = getAirAround(sheet, `.${CLASS.pinned}`, margin);
        const sides = getEdgesDown(
            getRuleBody(sheet, `.${CLASS.sides}`),
            `.${CLASS.sides}`,
            "padding",
        );
        assertStrictEquals(
            list[1],
            pinned[0],
            `the dashed rule stands under ${list[1]}px of the ranking and over ${pinned[0]}px`,
        );
        assertStrictEquals(
            pinned[1],
            sides[0],
            `the summary's rule stands under ${pinned[1]}px of the block and over ${sides[0]}px`,
        );
    }
});

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

Deno.test("a list is as tall as the rows it promises, and carries no term besides", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
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
        assertStringIncludes(stated, "row-height", "and what it reserves is what a row costs");
    }
});

/** The operators a `calc` spends outside its own groups, which is where a stray term sits. */
function getOperatorsAtDepth(stated: string): string[] {
    assert(stated.startsWith("calc("), "a height is arithmetic before it is read as any");
    assert(stated.length <= LONGEST_DECLARATION, "a height stays inside its stated bound");
    const operators: string[] = [];
    let depth = 0;
    for (const character of stated.slice("calc(".length, stated.length - 1)) {
        if (character === "(") depth += 1;
        if (character === ")") depth -= 1;
        if (depth > 0) continue;
        if (character === "*") operators.push(character);
        if (character === "+") operators.push(character);
        if (character === "-") operators.push(character);
    }
    assertStrictEquals(depth, 0, "a height closes every group it opens");
    return operators;
}

Deno.test("the panel's rhythm is whole pixels, so a bar and its ink round together", () => {
    // A line height stated as a factor is a fractional line box — 11px at 1.35 is 14.85 — and
    // every box under it stands off the pixel grid by a different fraction on every screen. The
    // browser then snaps a bar one way and the glyphs inside it another: the ranking read 5
    // device rows over the figures and 5 under, while the same rows one level down read 4 and 6,
    // in Chrome 152 on 2026-08-29 against `dist/preview.html`. `develop ADR 0015`.
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const stated = getLineHeights(sheet);
        const factors = stated.filter((height) => !height.endsWith("px"));
        assertEquals(
            factors,
            [],
            "a line height stated as a factor puts every box under it off grid",
        );
    }
});

/** Every line height the sheet states, which is the term after the slash in a `font` shorthand. */
function getLineHeights(sheet: string): string[] {
    const lineHeights: string[] = [];
    let fontIndex = sheet.indexOf("font:");
    let tried = 0;
    while (fontIndex !== -1) {
        assert(tried < RULES_IN_A_SHEET, "the walk stays inside the sheet's stated bound");
        tried += 1;
        const slash = sheet.indexOf("/", fontIndex);
        assertNotStrictEquals(slash, -1, "a font shorthand here states a line height");
        const ends = sheet.indexOf(" ", slash);
        assertNotStrictEquals(ends, -1, "and a stack after it");
        lineHeights.push(sheet.slice(slash + 1, ends));
        fontIndex = sheet.indexOf("font:", fontIndex + 1);
    }
    assert(lineHeights.length > 0, "the panel states the type it prints");
    return lineHeights;
}

Deno.test("a row drops its ink onto its middle and stays the height the list counts", () => {
    // A face carries more ascent than descent, so the ink inside a centred line box sits high by
    // half the difference — 4.503px over the caps against 5.497px under the baseline, Chrome 152
    // on 2026-08-29. The drop answers that, and the parity below is what keeps the answer whole:
    // a cell that lands on a half pixel is a cell the browser rounds. `develop ADR 0015`.
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const body = getRuleBody(sheet, `.${CLASS.row}`);
        assertStrictEquals(
            getDeclaration(body, "box-sizing"),
            "border-box",
            "a row reserving its drop outside its height is a row taller than the list counts",
        );
        const [above, below] = getEdgesDown(body, `.${CLASS.row}`, "padding");
        assertStrictEquals(
            below,
            0,
            "a row carries the drop over its contents and nothing under them",
        );
        assertExists(above, "and states what it carries over them");
        assert(above > 0, "which is a length a reader can see");
        const height = getDeclaration(body, "height");
        assertExists(height, "a row states a height rather than taking one from its contents");
        assertStrictEquals(
            height,
            `var(${VARIABLE_OPENER}row-height)`,
            "and it is the one the list counts",
        );
        const rowHeight = getPixels(readSheetVariable(sheet, "row-height"));
        assertStrictEquals(rowHeight, TYPE_TOKENS[step].rowHeightPixels, "which is the step's own");
        const line = getLineHeights(getRuleBody(sheet, `.${CLASS.meter}`));
        assertExists(line[0], "the panel states the line a row's cells are drawn on");
        const spare = rowHeight - (above ?? 0) - getPixels(line[0]);
        assertStrictEquals(
            spare % 2,
            0,
            `a row centres its cells onto half a pixel: ${spare}px to share`,
        );
    }
});

/** A token the host declares, as the sheet spells its value. */
function readSheetVariable(sheet: string, name: string): string {
    const host = readRules(sheet).find((rule) => rule.selector === ":host");
    assertExists(host, "the sheet declares its tokens on the host");
    const declared = getDeclaration(host.body, `${VARIABLE_OPENER}${name}`);
    assertExists(declared, `the host declares ${name}`);
    return declared;
}

/**
 * A step moves both windows and the card at once: one size of type, never two beside each other.
 */
Deno.test("every step draws both windows and the card in its own type, at its own widths", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const tokens = TYPE_TOKENS[step];
        const body = `${tokens.fontPixels}px/${tokens.lineHeightPixels}px`;
        for (const drawn of [CLASS.meter, CLASS.helper, CLASS.card]) {
            const font = getDeclaration(getRuleBody(sheet, `.${drawn}`), "font");
            assert(font?.startsWith(body), `${step}: ${drawn} prints ${font}, not ${body}`);
        }
        // As wide as the step says, until a reader sizes the window by its corner.
        const meter = `var(${SIZE_VARIABLES.meter.width},${tokens.meterWidthPixels}px)`;
        const helper = `var(${SIZE_VARIABLES.helper.width},${tokens.helperWidthPixels}px)`;
        const widths = [[CLASS.meter, meter], [CLASS.title, meter], [CLASS.helper, helper]];
        for (const [drawn, width] of widths) {
            const stated = getDeclaration(getRuleBody(sheet, `.${drawn}`), "width");
            assertStrictEquals(stated, width, `${step}: ${drawn} stands as wide as the step says`);
        }
        const card = getDeclaration(getRuleBody(sheet, `.${CLASS.card}`), "max-width");
        assertStringIncludes(card ?? "", `${tokens.cardWidthPixelsMaximum}px`, `${step}: the card`);
        // Every smaller type the sheet spells is the step's own, and the ring's letter is drawn,
        // so its text stands at no size at all (ADR 0036).
        const ring = readRules(sheet).find((rule) => rule.selector === CAVEAT_MARKS);
        assertExists(ring, `${step}: the ring is one rule for both places it stands`);
        assertStrictEquals(
            getDeclaration(ring.body, "font-size"),
            UNSHOWN_SIZE,
            `${step}: the ring's letter is not spelled`,
        );
        // The one exception is the options' three steps, each written in the size it gives, in
        // every sheet (ADR 0015): held to those sizes here and left out of the rule below.
        const samples = TYPE_STEPS.map((sample) => `.${composeOptionsStepClass(sample)}`);
        for (const sample of TYPE_STEPS) {
            const sampled = getRuleBody(sheet, `.${composeOptionsStepClass(sample)}`);
            assertStrictEquals(
                getDeclaration(sampled, "font-size"),
                `${TYPE_TOKENS[sample].fontPixels}px`,
                `${step}: the step ${sample} in the options is written in its own size`,
            );
        }
        const small = readRules(sheet)
            .filter((rule) => !samples.includes(rule.selector))
            .map((rule) => getDeclaration(rule.body, "font-size"))
            .filter((stated) => stated !== null)
            .filter((stated) => stated !== UNSHOWN_SIZE);
        assert(small.length > 0, `${step}: the sheet spells a smaller type`);
        assertEquals(
            [...new Set(small)],
            [`${tokens.fontSmallPixels}px`],
            `${step}: and every rule spelling one spells the step's`,
        );
    }
});

Deno.test("two columns stand only where the sheet leaves them their width", () => {
    const sheet = composeStyleSheet(TYPE_STEP_DEFAULT);
    const stated = getDeclaration(getRuleBody(sheet, `.${CLASS.card}.${CLASS.cardWide}`), "width");
    assertExists(stated, "the sheet states how wide a card of two columns stands");
    const twoWide = getCardWidthForColumns(TYPE_TOKENS[TYPE_STEP_DEFAULT], 2);
    const opener = `min(${twoWide}px,calc(100vw - `;
    assert(stated.startsWith(opener), `${stated} is two bounds, held to the window's width`);
    const terms = stated.slice(opener.length, stated.length - 2).split(" - ");
    const air = terms.reduce((sum, term) => sum + getPixels(term), 0);
    assertStrictEquals(
        getCardWidthAvailable(1366),
        1366 - air,
        "the layout spends the air the sheet spends",
    );
    assertStrictEquals(
        getCardWidthAvailable(air),
        null,
        "a window no wider than the air has no room",
    );
    assertStrictEquals(getCardWidthAvailable(air + 1), 1, "and a pixel past it has that pixel");
    assertStrictEquals(
        getCardWidthAvailable(null),
        null,
        "a page stating no width has none either",
    );
});

Deno.test("a card is trimmed to the room the sheet leaves it, the window less its air", () => {
    const sheet = composeStyleSheet(TYPE_STEP_DEFAULT);
    const stated = getDeclaration(getRuleBody(sheet, `.${CLASS.card}`), "max-height");
    assertExists(stated, "the sheet holds a card inside the window");
    const opener = "calc(100vh - ";
    assert(stated.startsWith(opener), `${stated} is a bound on the window's height`);
    const terms = stated.slice(opener.length, stated.length - 1).split(" - ");
    const air = terms.reduce((sum, term) => sum + getPixels(term), 0);
    assertStrictEquals(
        getCardHeightAvailable(900),
        900 - air,
        "the trim spends the air the sheet spends",
    );
    assertStrictEquals(
        getCardHeightAvailable(air),
        null,
        "a window no taller than the air has no room",
    );
    assertStrictEquals(getCardHeightAvailable(air + 1), 1, "and a pixel past it has that pixel");
    assertStrictEquals(
        getCardHeightAvailable(null),
        null,
        "a page stating no height has no room to reason about",
    );
});

/**
 * The other side of the rule below, and the one cell written against it. Every other run of words
 * on this panel is cut where it will not fit, because its height is counted as one line. The name a
 * card opens with is the **answer** to a name a row had to cut (`develop ADR 0084`), and an answer
 * cut again answers nothing — so it folds, and `src/ui/panel-element.ts` counts the lines it folds
 * to.
 */
Deno.test("the name a card opens with folds rather than shortening", () => {
    // A reader is proved by a sample it must flag and one it must not.
    assertStrictEquals(
        getShorteningMissing("}.a{font-weight:600;overflow-wrap:break-word;}", ".a").length,
        SHORTENING.length,
        "a rule stating none of the four is one that shortens nothing",
    );
    assertEquals(
        getShorteningMissing(
            "}.a{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
            ".a",
        ),
        [],
        "and one stating all four still reads as a cell that shortens",
    );

    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        assertStrictEquals(
            getShorteningMissing(sheet, `.${CLASS.cardName}`).length,
            SHORTENING.length,
            "the name states none of them, so nothing cuts it",
        );
        const body = getRuleBody(sheet, `.${CLASS.cardName}`);
        assertStrictEquals(
            getDeclaration(body, "overflow-wrap"),
            "break-word",
            "and a word with no space to break at breaks rather than running off the card",
        );
    }
});

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
    assertStrictEquals(
        getShorteningMissing("}.a{overflow:hidden;white-space:nowrap;}", ".a").length,
        2,
        "and one short of them is named for what it left out",
    );

    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        for (const selector of [`.${CLASS.figure}`, `.${CLASS.rowValue}`]) {
            const body = getRuleBody(sheet, selector);
            assertStrictEquals(getDeclaration(body, "white-space"), "nowrap", `${selector} folds`);
            assertStrictEquals(getDeclaration(body, "flex"), "none", `${selector} gives way`);
        }
        const beside = [CLASS.sectionWords, CLASS.sidesLabel, CLASS.rowName, CLASS.cardLabel];
        const short = beside.flatMap((className) => getShorteningMissing(sheet, `.${className}`));
        assertEquals(short, [], "the words beside a figure are the cell that shortens");
    }
});

Deno.test("the reader adds up a rule rather than matching one", () => {
    // A reader is proved by a sample it must flag and one it must not.
    assertStrictEquals(getPixels("7px"), 7, "a length reads as itself");
    assertStrictEquals(getPixels("var(--MargoMeter-region-down)"), 5, "a token reads as its value");
    assertStrictEquals(
        getPixels("calc(var(--MargoMeter-region-down) - var(--MargoMeter-half))"),
        3,
        "and one subtraction reads as the difference",
    );
    const body = getRuleBody("}.a{padding:1px 2px;padding-bottom:3px;}", ".a");
    assertStrictEquals(getDeclaration(body, "padding-bottom"), "3px", "the longhand is found");
    assertStrictEquals(
        getDeclaration(body, "margin-bottom"),
        null,
        "and what is absent is not invented",
    );
    assertEquals(
        getEdgesDown(body, ".a", "padding"),
        [1, 3],
        "the longhand outranks the shorthand",
    );
    assertEquals(getEdgesDown(body, ".a", "margin"), [0, 0], "an edge nothing states is nothing");
    assertStrictEquals(getPixels("0"), 0, "and a bare nought is a length like any other");
    assertStrictEquals(
        getTokenSpelling("regionDown"),
        "region-down",
        "a token crosses spellings once",
    );
});

Deno.test("the hatch is worn by the row standing apart, and spelled once", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const bar = getRuleBody(sheet, `.${CLASS.row}.${CLASS.rowApart} .${CLASS.bar}`);
        const hatch = getDeclaration(bar, "mask-image");
        assertExists(hatch, "a row with no place in the ranking hatches its bar");
        assertStringIncludes(hatch, "repeating-linear-gradient", "and the hatch is the gradient");
        assertExists(
            getDeclaration(bar, "opacity"),
            "which is drawn back from the ranking's strength",
        );
        // The region is where a pinned row stands, never what draws its bar: the rows that earn the
        // hatch stand inside the list too, and a second copy of the gradient is a second thing to
        // move. `.bar` itself keeps a solid one, which is what a named row draws.
        assertStrictEquals(
            sheet.split("repeating-linear-gradient").length - 1,
            1,
            "the gradient is written once, whatever wears it",
        );
        assertStrictEquals(
            getDeclaration(getRuleBody(sheet, `.${CLASS.bar}`), "mask-image"),
            null,
            "and a row that holds a place in the ranking draws its bar solid",
        );
    }
});

/**
 * ⚠️ **Each mark on the bar is a different width**, so padded alike the controls stood at as many
 * widths (ADR 0036). A box of one size centring its mark makes them a row of equals; that the
 * browser draws them so is `tests/e2e/panel-type.spec.ts`'s to say.
 */
Deno.test("every control on a bar is one box with its icon centred, at every step", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const control = getRuleBody(sheet, `.${CLASS.control}`);
        assertStrictEquals(
            getDeclaration(control, "padding"),
            "0",
            `${step}: no air makes a width`,
        );
        const width = getPixels(getDeclaration(control, "width") ?? "");
        const height = getPixels(getDeclaration(control, "height") ?? "");
        assertStrictEquals(
            height,
            getControlHeightPixels(TYPE_TOKENS[step]),
            `${step}: a control is as tall as the bar's height counts it`,
        );
        assert(width >= height, `${step}: and at least as wide, so the widest mark has air`);
        for (const axis of ["justify-content", "align-items"]) {
            assertStrictEquals(
                getDeclaration(control, axis),
                "center",
                `${step}: its icon is centred`,
            );
        }
        // Centred on whole pixels: the air either side of the icon is the same in every axis.
        const icon = getPixels(
            getDeclaration(getRuleBody(sheet, `.${CLASS.control}::before`), "width") ?? "",
        );
        const border = getPixels((getDeclaration(control, "border") ?? "").split(" ")[0] ?? "");
        for (const across of [width, height]) {
            const air = (across - 2 * border - icon) / 2;
            assert(
                Number.isInteger(air),
                `${step}: ${icon}px stands in ${across}px on whole pixels`,
            );
        }
        for (const drawn of BAR_ICONS) {
            const body = getRuleBody(sheet, `.${composeBarIconClass(drawn)}::before`);
            const mask = getDeclaration(body, "mask-image");
            assertStringIncludes(mask ?? "", "data:image/svg+xml,", `${step}: ${drawn} is drawn`);
            assertStrictEquals(
                getDeclaration(body, "-webkit-mask-image"),
                mask,
                `${step}: and ${drawn} is drawn where only the prefix is read`,
            );
        }
    }
});

/**
 * ⚠️ **A glyph's ink sits where its face puts it**, and the ring's `i` sat off its middle (ADR
 * 0036). The letter is drawn, and what holds it mid-ring is arithmetic: the air either side of the
 * stem, and over the dot against under the stem.
 */
Deno.test("the caveat mark's letter is drawn in the middle of its ring, at every step", () => {
    for (const step of TYPE_STEPS) {
        const sheet = composeStyleSheet(step);
        const ring = getRuleBody(sheet, CAVEAT_MARKS);
        const size = getPixels(getDeclaration(ring, "width") ?? "");
        assertStrictEquals(
            getPixels(getDeclaration(ring, "height") ?? ""),
            size,
            `${step}: a ring`,
        );
        const border = getPixels((getDeclaration(ring, "border") ?? "").split(" ")[0] ?? "");
        const inside = size - 2 * border;
        const letter = getRuleBody(sheet, `${CAVEAT_DOT},${CAVEAT_STEM}`);
        const left = getPixels(getDeclaration(letter, "left") ?? "");
        const stemWidth = getPixels(getDeclaration(letter, "width") ?? "");
        assertStrictEquals(
            left,
            inside - left - stemWidth,
            `${step}: as much air right of it as left`,
        );
        assert(Number.isInteger(left), `${step}: and the letter stands on whole pixels`);
        const dot = getRuleBody(sheet, CAVEAT_DOT);
        const stem = getRuleBody(sheet, CAVEAT_STEM);
        const dotTop = getPixels(getDeclaration(dot, "top") ?? "");
        const dotHeight = getPixels(getDeclaration(dot, "height") ?? "");
        const stemTop = getPixels(getDeclaration(stem, "top") ?? "");
        const stemHeight = getPixels(getDeclaration(stem, "height") ?? "");
        assert(dotTop > 0, `${step}: the letter stands clear of the ring`);
        assert(dotTop + dotHeight < stemTop, `${step}: and the dot clear of the stem`);
        assertStrictEquals(
            dotTop,
            inside - stemTop - stemHeight,
            `${step}: as much air under the letter as over it`,
        );
    }
});
