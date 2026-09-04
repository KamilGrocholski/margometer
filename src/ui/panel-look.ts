/**
 * The panel's tokens, the classes its rules select, and the stylesheet built out of both.
 *
 * A class is spelled here and imported by the file that wears it: when two spellings drift the
 * failure is an unstyled row rather than anything a compiler sees.
 *
 * `DESIGN.md` owns what these values are for; this file owns what they are.
 */

import { assert } from "@std/assert/assert";
import { getIntegerFromText } from "@/libs/number-text.ts";

export const SURFACE = {
    panel: "#17171c",
    raised: "#1f1f26",
    track: "#24242a",
    border: "#2c2c35",
} as const;

export const TEXT = {
    plain: "#e7e7ea",
    quiet: "#9a9aa6",
    inkDark: "#14141a",
    inkLight: "#ffffff",
} as const;

export const SIGNAL = {
    ours: "#6fbf8b",
    theirs: "#e0736f",
    suspect: "#c98500",
    unknown: "#8a8a80",
} as const;

export const PALETTE_COLOURS = [
    "#3987e5",
    "#008300",
    "#d55181",
    "#c98500",
    "#199e70",
    "#d95926",
    "#9085e9",
    "#e66767",
] as const;

/**
 * A region a reader meets before the panel's contents carries the `MargoMeter-` prefix; what sits
 * inside a region does not, because the game's stylesheet cannot reach behind the root.
 */
export const CLASS = {
    title: "MargoMeter-titlebar",
    titleVersion: "titlebar-version",
    control: "titlebar-button",
    controlFights: "titlebar-fights",
    frame: "MargoMeter-body",
    folded: "folded",
    panel: "panel",
    slot: "slot",
    header: "header",
    headerLine: "header-line",
    headerPlace: "header-place",
    headerOutcome: "header-outcome",
    tabs: "tabs",
    tabsGap: "tabs-gap",
    tabsLabel: "tabs-label",
    tab: "tab",
    tabCurrent: "selected",
    crumb: "crumb",
    crumbBack: "crumb-back",
    crumbHere: "crumb-here",
    list: "list",
    listWaiting: "list-waiting",
    section: "section-heading",
    sectionWords: "section-words",
    row: "row",
    rowDrillable: "drillable",
    rowLeaf: "leaf",
    rowRank: "row-rank",
    rowTime: "row-time",
    rowName: "row-name",
    rowSize: "row-size",
    rowChosen: "chosen",
    rowPin: "row-pin",
    rowPinSet: "pinned",
    rowValue: "row-value",
    rowShare: "row-share",
    rowWarning: "row-warning",
    bar: "bar",
    barCap: "bar-cap",
    /** Worn by every cell that carries a figure, wherever in the panel it stands. */
    figure: "figure",
    pinned: "pinned-region",
    empty: "empty",
    undrawn: "undrawn",
    warnings: "warnings",
    warning: "warning",
    sides: "MargoMeter-sides",
    sidesLine: "sides",
    sidesLabel: "sides-label",
    sidesSpare: "sides-spare",
    sidesTrack: "sides-track",
    sidesOurs: "sides-ours",
    sidesTheirs: "sides-theirs",
    sidesNobody: "sides-nobody",
    tip: "MargoMeter-tip",
    tipHidden: "tip-hidden",
    tipName: "tip-name",
    tipSubtitle: "tip-subtitle",
    tipGroup: "tip-group",
    tipHeading: "tip-heading",
    tipLine: "tip-line",
    tipStrong: "tip-strong",
    tipSub: "tip-sub",
    tipLabel: "tip-label",
    tipValue: "tip-value",
    /** A sentence rather than a column, so the placement counts it as wrapping. */
    tipNote: "tip-note",
    tipWarning: "tip-warning",
    auras: "MargoMeter-auras",
    aurasHidden: "auras-hidden",
    aurasTitle: "auras-title",
    aurasBody: "auras-body",
    aurasSkill: "auras-skill",
    aurasRow: "auras-row",
    aurasName: "auras-name",
    aurasTurns: "auras-turns",
    aurasOurs: "auras-ours",
    aurasTheirs: "auras-theirs",
} as const;

export const SPACE = {
    half: "2px",
    small: "4px",
    regionDown: "5px",
    regionAcross: "7px",
    wide: "8px",
    rowHeight: "18px",
    heightShareMaximum: "66vh",
} as const;

export const PLACE = {
    inset: "8px",
    width: "260px",
    layer: "9999",
} as const;

export const TIP = {
    width: "250px",
} as const;

/** Narrower than the panel: the strip carries a skill, a name and two numbers, and nothing else. */
export const AURAS = {
    width: "170px",
} as const;

export const SHAPE = {
    radius: "8px",
    radiusSmall: "3px",
    windowShadow: "0 6px 20px rgb(0 0 0 / 55%)",
} as const;

/** Two digits and a stop: 17.49px in Chrome 152, 2026-08-29, and a fight holds twenty. */
const RANK_WIDTH = "22px";
/** What a row carries over its contents and not under, so its ink lands even. **ADR 0015.** */
const ROW_INK_DROP = "1px";
const BAR_TINT = 0.55;
/**
 * Pure black, and only ever as a mask. A `mask-image` reads alpha and throws the hue away, so
 * this is not a colour anybody sees — it is the opaque end of a gradient, named because a raw hex
 * in a rule is a bug and an exception nobody can see the edge of is how the next one gets written.
 */
const MASK_INK = "#000000";
const HEADING_TINT = 0.85;
const HEX_DIGITS = "0123456789abcdef";
const HEX_BASE = 16;
const HEX_DIGITS_PER_CHANNEL = 2;
/** A hash and six digits, which is the only hex spelling this panel writes or reads. */
const HEX_COLOUR_LENGTH = 7;
const RGB_OPENER = "rgb(";
const RGB_CLOSER = ")";
const CHANNELS_IN_A_COLOUR = 3;
const CHANNEL_MAXIMUM = 255;
/** The sRGB transfer function and the channel weights, as WCAG states them. */
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722];
const LOW_CHANNEL = 0.03928;
const LOW_SLOPE = 12.92;
const CHANNEL_OFFSET = 0.055;
const CHANNEL_EXPONENT = 2.4;
const LUMINANCE_OFFSET = 0.05;
const INK_DARK_CHANNELS = [0x14, 0x14, 0x1a];
const INK_LIGHT_CHANNELS = [0xff, 0xff, 0xff];

function getDigitFromHex(character: string): number | null {
    assert(character.length === 1, "a digit is one character");
    const at = HEX_DIGITS.indexOf(character.toLowerCase());
    if (at === -1) return null;
    assert(at >= 0, "a digit that was found has a place in the run");
    return at;
}

/** The other spelling, because a bar is composed as one and its ink is read back off it. */
function getChannelsFromRgb(colour: string): number[] | null {
    assert(colour.length > 0, "a colour is text that says something");
    if (!colour.startsWith(RGB_OPENER)) return null;
    if (!colour.endsWith(RGB_CLOSER)) return null;
    const channels: number[] = [];
    const inside = colour.slice(RGB_OPENER.length, colour.length - RGB_CLOSER.length);
    for (const stated of inside.split(" ")) {
        const channel = getIntegerFromText(stated);
        if (channel === null) return null;
        if (channel < 0) return null;
        if (channel > CHANNEL_MAXIMUM) return null;
        channels.push(channel);
    }
    if (channels.length !== CHANNELS_IN_A_COLOUR) return null;
    assert(channels.every((one) => one >= 0), "a channel that was read is not below nothing");
    return channels;
}

/** Null for anything that is neither spelling, because a colour nobody wrote is not a colour. */
function getChannelsFromColour(colour: string): number[] | null {
    if (colour.startsWith(RGB_OPENER)) return getChannelsFromRgb(colour);
    if (!colour.startsWith("#")) return null;
    if (colour.length !== HEX_COLOUR_LENGTH) return null;
    const channels: number[] = [];
    assert(colour.length === HEX_COLOUR_LENGTH, "a hex colour is a hash and six digits");
    for (let at = 1; at < colour.length; at += HEX_DIGITS_PER_CHANNEL) {
        const high = getDigitFromHex(colour.charAt(at));
        const low = getDigitFromHex(colour.charAt(at + 1));
        if (high === null || low === null) return null;
        channels.push(high * HEX_BASE + low);
    }
    assert(channels.length === CHANNELS_IN_A_COLOUR, "a colour is three channels");
    assert(channels.every((one) => one <= CHANNEL_MAXIMUM), "and each stays inside a byte");
    return channels;
}

function getLuminanceFromChannels(channels: readonly number[]): number {
    assert(channels.length === CHANNELS_IN_A_COLOUR, "a luminance is taken of three channels");
    let luminance = 0;
    for (const [at, channel] of channels.entries()) {
        const share = channel / CHANNEL_MAXIMUM;
        const linear = share <= LOW_CHANNEL
            ? share / LOW_SLOPE
            : ((share + CHANNEL_OFFSET) / (1 + CHANNEL_OFFSET)) ** CHANNEL_EXPONENT;
        luminance += linear * (LUMINANCE_WEIGHTS[at] ?? 0);
    }
    assert(luminance >= 0, "a luminance is never below nothing");
    assert(luminance <= 1, "and never above everything");
    return luminance;
}

function getContrastFromChannels(one: readonly number[], other: readonly number[]): number {
    const bright = Math.max(getLuminanceFromChannels(one), getLuminanceFromChannels(other));
    const dim = Math.min(getLuminanceFromChannels(one), getLuminanceFromChannels(other));
    assert(bright >= dim, "the brighter of two is not the dimmer");
    const ratio = (bright + LUMINANCE_OFFSET) / (dim + LUMINANCE_OFFSET);
    assert(ratio >= 1, "a ratio compares the brighter against the dimmer");
    assert(Number.isFinite(ratio), "and answers a number either way");
    return ratio;
}

/** One where a colour could not be read, so an unreadable pairing never passes for a good one. */
export function getContrastRatio(one: string, other: string): number {
    const first = getChannelsFromColour(one);
    const second = getChannelsFromColour(other);
    if (first === null || second === null) return 1;
    return getContrastFromChannels(first, second);
}

function getInkForChannels(channels: readonly number[]): string {
    assert(channels.length === CHANNELS_IN_A_COLOUR, "an ink is chosen against three channels");
    const onDark = getContrastFromChannels(channels, INK_DARK_CHANNELS);
    const onLight = getContrastFromChannels(channels, INK_LIGHT_CHANNELS);
    assert(onDark >= 1, "an ink is compared against what it sits on");
    if (onDark >= onLight) return TEXT.inkDark;
    return TEXT.inkLight;
}

function composeBarChannels(hue: string): number[] {
    const chosen = getChannelsFromColour(hue);
    const track = getChannelsFromColour(SURFACE.track);
    assert(chosen !== null, "the palette is written as colours");
    assert(track !== null, "and so is the track they sit on");
    assert(chosen.length === track.length, "a hue and a track are mixed channel for channel");
    return chosen.map((channel, at) =>
        Math.round((track[at] ?? 0) * (1 - BAR_TINT) + channel * BAR_TINT)
    );
}

export function composeBarColour(hue: string): string {
    assert(hue.length > 0, "a bar is drawn in a colour that was chosen");
    const mixed = composeBarChannels(hue);
    assert(mixed.length === CHANNELS_IN_A_COLOUR, "a bar is three channels like any other");
    return `rgb(${mixed[0]} ${mixed[1]} ${mixed[2]})`;
}

export function getInkForBar(hue: string): string {
    return getInkForChannels(composeBarChannels(hue));
}

/**
 * The codes are the game's own letters. Every one of the six is stated in `captures/`: 262
 * combatants over 28 recordings on 2026-08-29, none without a profession, `w` 91 of them and
 * `b` 17.
 */
const PROFESSION_HUES: Record<string, number> = {
    m: 0,
    h: 1,
    p: 2,
    t: 3,
    b: 4,
    w: 5,
};

export function getColourForProfession(profession: string | null): string {
    if (profession === null) return SIGNAL.unknown;
    assert(profession.length > 0, "a profession that was stated says something");
    const stated = PROFESSION_HUES[profession];
    if (stated === undefined) return SIGNAL.unknown;
    const held = PALETTE_COLOURS[stated];
    assert(held !== undefined, "a stated hue is a place inside the palette");
    return held;
}

/** One colour over another at an alpha, in sRGB because that is what the browser does here. */
function composeColourOver(top: string, bottom: string, alpha: number): string {
    assert(alpha >= 0, "a colour is laid over another at a share of itself");
    assert(alpha <= 1, "and never at more than the whole of itself");
    const above = getChannelsFromColour(top);
    const below = getChannelsFromColour(bottom);
    assert(above !== null, "the colour laid over another is one this file wrote");
    assert(below !== null, "and so is the one underneath it");
    const mixed = above.map((one, at) => Math.round(alpha * one + (1 - alpha) * (below[at] ?? 0)));
    return `rgb(${mixed[0]} ${mixed[1]} ${mixed[2]})`;
}

function composeHeadingColour(): string {
    const colour = composeColourOver(TEXT.quiet, SURFACE.panel, HEADING_TINT);
    assert(colour.startsWith("rgb("), "a composite is written the way a bar's colour is");
    assert(colour.endsWith(")"), "and closed like one");
    return colour;
}

const VARIABLE_PREFIX = "--MargoMeter-";
const ROWS_BY_DEFAULT = 11;
const FONT_STACK = "system-ui, sans-serif";
const FONT_SIZE = "11px";
/** Whole pixels: a fractional line box puts every box under it off the grid. **ADR 0015.** */
const LINE_HEIGHT = "15px";
const LINE_HEIGHT_TITLE = "13px";

function composeVariable(name: string, value: string): string {
    assert(name.length > 0, "a token is named");
    assert(value.length > 0, "and carries a value");
    return `${VARIABLE_PREFIX}${name}:${value};`;
}

function composeVariables(): string {
    const stated = [
        composeVariable("surface", SURFACE.panel),
        composeVariable("raised", SURFACE.raised),
        composeVariable("track", SURFACE.track),
        composeVariable("border", SURFACE.border),
        composeVariable("text", TEXT.plain),
        composeVariable("quiet", TEXT.quiet),
        composeVariable("suspect", SIGNAL.suspect),
        composeVariable("ours", SIGNAL.ours),
        composeVariable("theirs", SIGNAL.theirs),
        composeVariable("nobody", SIGNAL.unknown),
        composeVariable("heading", composeHeadingColour()),
        composeVariable("mask", MASK_INK),
        composeVariable("bar-tint", `${BAR_TINT}`),
        composeVariable("half", SPACE.half),
        composeVariable("small", SPACE.small),
        composeVariable("region-down", SPACE.regionDown),
        composeVariable("region-across", SPACE.regionAcross),
        composeVariable("wide", SPACE.wide),
        composeVariable("row-height", SPACE.rowHeight),
        composeVariable("radius", SHAPE.radius),
        composeVariable("radius-small", SHAPE.radiusSmall),
    ].join("");
    assert(stated.length > 0, "the panel spends tokens rather than values");
    assert(stated.startsWith(VARIABLE_PREFIX), "and every one of them is ours by name");
    return stated;
}

/**
 * `all: initial` resets `display` too, so every region below states its own.
 *
 * The top edge is a custom property rather than a length, because `all: initial` resets every
 * property a page can set except a custom one — which is what lets a default declared here
 * survive the line above it, and what the panel is moved by.
 */
function composeFrameRules(): string {
    assert(PLACE.width.endsWith("px"), "the panel is as wide as it was told, in pixels");
    assert(CLASS.title.startsWith("MargoMeter-"), "a region is named as ours before it is styled");
    const ceiling = `min(calc(100vh - var(${VARIABLE_PREFIX}panel-top) - ${PLACE.inset}),` +
        `${SPACE.heightShareMaximum})`;
    return `:host{all:initial;${composeVariables()}` +
        `${VARIABLE_PREFIX}panel-top:${PLACE.inset};` +
        `position:fixed;top:var(${VARIABLE_PREFIX}panel-top);right:${PLACE.inset};` +
        `z-index:${PLACE.layer};display:flex;flex-direction:column;` +
        `max-height:${ceiling};}` +
        // ⚠️ **Positioned so the strip beside the panel paints under it, never over.** The strip
        // is `position:fixed` and a positioned element paints above a static one whatever the
        // order, which left a fold button unclickable under it in Chrome, 2026-09-04.
        `.${CLASS.title}{position:relative;flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);` +
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}wide);` +
        `font:${FONT_SIZE}/${LINE_HEIGHT_TITLE} ${FONT_STACK};letter-spacing:0.06em;` +
        `color:var(${VARIABLE_PREFIX}quiet);` +
        // One line, whatever the version number is: every guard stayed green when 0.10.0 broke
        // this row, because none of them lays anything out.
        `white-space:nowrap;background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);border-bottom:none;` +
        `border-radius:var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius) 0 0;` +
        `box-sizing:border-box;width:${PLACE.width};` +
        `cursor:move;` +
        // Safari has never shipped `user-select` unprefixed, so without this a drag by the bar
        // selects the text under the cursor (`docs/browser-support.md`).
        `-webkit-user-select:none;user-select:none;touch-action:none;}` +
        `.${CLASS.titleVersion}{opacity:0.7;font-size:10px;}` +
        `.${CLASS.control}{padding:0 var(${VARIABLE_PREFIX}small);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius);` +
        `color:var(${VARIABLE_PREFIX}quiet);background:var(${VARIABLE_PREFIX}surface);` +
        `cursor:pointer;}` +
        `.${CLASS.control}:hover{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.controlFights}{margin-left:auto;}` +
        // A flex item whose overflow is visible refuses to shrink below its own content, so
        // without `min-height:0` the ceiling on the host stops here and never reaches the list.
        `.${CLASS.frame}{position:relative;display:flex;flex-direction:column;min-height:0;}` +
        // Two classes in the selector, so the outcome does not depend on where the rule is
        // written: a bare `.folded` ties with the region's own rule and loses on source order.
        `.${CLASS.frame}.${CLASS.folded}{display:none;}` +
        `.${CLASS.panel}{font:${FONT_SIZE}/${LINE_HEIGHT} ${FONT_STACK};width:${PLACE.width};` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}surface);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:0 0 var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius);` +
        `box-sizing:border-box;display:flex;flex-direction:column;min-height:0;}` +
        `.${CLASS.panel}>*{flex:none;}` +
        `.${CLASS.panel}>.${CLASS.list}{flex:0 1 auto;}` +
        `.${CLASS.slot}{display:none;}`;
}

function composeRegionRules(): string {
    assert(SPACE.regionDown.endsWith("px"), "a region is inset by a length, in pixels");
    assert(CLASS.header.length > 0, "and every region it draws is named");
    const region = `var(${VARIABLE_PREFIX}region-down) var(${VARIABLE_PREFIX}region-across)`;
    return `.${CLASS.header}{display:block;padding:${region};padding-bottom:0;}` +
        `.${CLASS.headerLine}{display:flex;justify-content:space-between;align-items:baseline;}` +
        `.${CLASS.headerPlace}{color:var(${VARIABLE_PREFIX}quiet);font-size:10px;` +
        `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
        // The upper case belongs to this rule rather than to a word: the shelf says the same
        // word a row at a time, in the case it was composed in.
        `.${CLASS.headerOutcome}{color:var(${VARIABLE_PREFIX}quiet);text-transform:uppercase;` +
        `font-size:10px;}` +
        `.${CLASS.tabs}{display:flex;flex-wrap:wrap;gap:var(${VARIABLE_PREFIX}half);` +
        `padding:${region};padding-bottom:0;}` +
        `.${CLASS.tabs}+.${CLASS.tabs}{padding-top:var(${VARIABLE_PREFIX}radius-small);}` +
        `.${CLASS.tabsGap}{flex:1;}` +
        `.${CLASS.tabsLabel}{color:var(${VARIABLE_PREFIX}quiet);align-self:center;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.tab}{white-space:nowrap;padding:1px var(${VARIABLE_PREFIX}small);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);color:var(${VARIABLE_PREFIX}quiet);` +
        `background:transparent;cursor:pointer;` +
        `-webkit-user-select:none;user-select:none;}` +
        `.${CLASS.tab}.${CLASS.tabCurrent}{color:var(${VARIABLE_PREFIX}text);` +
        `background:var(${VARIABLE_PREFIX}raised);}` +
        `.${CLASS.crumb}{display:flex;gap:var(${VARIABLE_PREFIX}wide);align-items:baseline;` +
        `padding:${region};padding-bottom:0;}` +
        `.${CLASS.crumbBack}{cursor:pointer;color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.crumbBack}:hover{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.crumbHere}{font-weight:600;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}`;
}

/** What insets a region under its rows, less the margin its last row carries. **ADR 0014.** */
function composeInsetUnderRows(inset: string): string {
    assert(inset.startsWith(VARIABLE_PREFIX), "a region's own inset is spent by name");
    const written = `calc(var(${inset}) - var(${VARIABLE_PREFIX}half))`;
    assert(written.includes("half"), "and the row's own margin is what comes off it");
    return written;
}

/** The list's height is the rows it promises times what a row costs. **ADR 0014.** */
function composeListRules(): string {
    assert(SPACE.regionDown.endsWith("px"), "a list is inset by a length, in pixels");
    assert(CLASS.list.length > 0, "and the one region that scrolls is named");
    const region = `var(${VARIABLE_PREFIX}region-down) var(${VARIABLE_PREFIX}region-across)`;
    const belowRows = composeInsetUnderRows(VARIABLE_PREFIX + "region-down");
    const rowCost = `(var(${VARIABLE_PREFIX}row-height) + var(${VARIABLE_PREFIX}half))`;
    return `.${CLASS.list}{padding:${region};` +
        `padding-bottom:${belowRows};` +
        `height:calc(var(${VARIABLE_PREFIX}rows,${ROWS_BY_DEFAULT}) * ${rowCost});` +
        `overflow-y:auto;overflow-x:hidden;` +
        `overscroll-behavior:contain;scrollbar-width:none;}` +
        // The background and the layer are not decoration: a row's bar is positioned and comes
        // later in the tree, so without both the bars paint over the sticky heading.
        // A figure is one word and its cell never gives way; the words beside it are what
        // shortens. `DESIGN.md` owns the rule, and every region that draws a figure wears this.
        `.${CLASS.figure}{flex:none;white-space:nowrap;}` +
        `.${CLASS.sectionWords}{min-width:0;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}` +
        `.${CLASS.section}{position:sticky;` +
        `top:calc(0px - var(${VARIABLE_PREFIX}region-down));z-index:1;` +
        `background:var(${VARIABLE_PREFIX}surface);display:flex;justify-content:space-between;` +
        `color:var(${VARIABLE_PREFIX}heading);letter-spacing:0.08em;font-size:10px;` +
        // Deliberately unequal, against ADR 0014's rule for every other region: the air under a
        // heading belongs to the rows it names.
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}half) ` +
        `var(${VARIABLE_PREFIX}half);}` +
        `.${CLASS.listWaiting}{display:flex;align-items:center;justify-content:center;` +
        `text-align:center;}` +
        `.${CLASS.empty}{color:var(${VARIABLE_PREFIX}quiet);` +
        `padding:var(${VARIABLE_PREFIX}wide) var(${VARIABLE_PREFIX}half);}` +
        `.${CLASS.undrawn}{color:var(${VARIABLE_PREFIX}quiet);font-style:italic;` +
        `padding:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.sides}{padding:var(${VARIABLE_PREFIX}region-down) ` +
        `var(${VARIABLE_PREFIX}region-across);` +
        `border-top:1px solid var(${VARIABLE_PREFIX}border);overflow:hidden;}` +
        `.${CLASS.sidesLine}{display:flex;justify-content:space-between;align-items:baseline;` +
        `font-variant-numeric:tabular-nums;font-weight:600;}` +
        `.${CLASS.sidesLabel}{color:var(${VARIABLE_PREFIX}quiet);font-weight:400;opacity:0.8;` +
        `min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.sidesSpare}{margin-top:var(${VARIABLE_PREFIX}small);font-size:10px;}` +
        `.${CLASS.sidesSpare} .${CLASS.sidesLabel}{color:inherit;}` +
        `.${CLASS.sidesTrack}{display:flex;height:4px;` +
        `margin-top:var(${VARIABLE_PREFIX}small);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);overflow:hidden;` +
        `background:var(${VARIABLE_PREFIX}track);}` +
        // The ink is the token and a segment paints itself with it, so no colour is written
        // onto an element.
        `.${CLASS.sidesOurs}{color:var(${VARIABLE_PREFIX}ours);}` +
        `.${CLASS.sidesTheirs}{color:var(${VARIABLE_PREFIX}theirs);}` +
        `.${CLASS.sidesNobody}{color:var(${VARIABLE_PREFIX}nobody);}` +
        `.${CLASS.sidesTrack}>*{background:currentColor;}` +
        `.${CLASS.warnings}{border-top:1px solid var(${VARIABLE_PREFIX}border);` +
        `padding-top:var(${VARIABLE_PREFIX}region-down);}` +
        `.${CLASS.warning}{color:var(${VARIABLE_PREFIX}suspect);` +
        `padding:0 var(${VARIABLE_PREFIX}region-across) var(${VARIABLE_PREFIX}region-down);}`;
}

function composeRowRules(): string {
    assert(SPACE.rowHeight.length > 0, "every row is drawn at one height");
    assert(SHAPE.radiusSmall.endsWith("px"), "what sits in a row is rounded in pixels");
    assert(ROW_INK_DROP.endsWith("px"), "and the ink is dropped onto its middle by a length");
    const cap = `var(${VARIABLE_PREFIX}radius-small) 0 0 var(${VARIABLE_PREFIX}radius-small)`;
    return `.${CLASS.row}{position:relative;display:flex;justify-content:space-between;` +
        `align-items:center;box-sizing:border-box;height:var(${VARIABLE_PREFIX}row-height);` +
        `padding:${ROW_INK_DROP} var(${VARIABLE_PREFIX}wide) 0;` +
        `margin-bottom:var(${VARIABLE_PREFIX}half);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);` +
        `background:var(${VARIABLE_PREFIX}track);overflow:hidden;}` +
        `.${CLASS.row}.${CLASS.rowDrillable}{cursor:pointer;}` +
        `.${CLASS.row}.${CLASS.rowLeaf}{cursor:help;}` +
        `.${CLASS.bar}{position:absolute;left:0;top:0;bottom:0;` +
        `opacity:var(${VARIABLE_PREFIX}bar-tint);}` +
        `.${CLASS.barCap}{position:absolute;left:0;top:0;bottom:0;width:3px;` +
        `border-radius:${cap};}` +
        `.${CLASS.rowRank},.${CLASS.rowName},.${CLASS.rowValue}{position:relative;}` +
        `.${CLASS.rowRank}{color:var(${VARIABLE_PREFIX}quiet);` +
        `font-variant-numeric:tabular-nums;flex:none;box-sizing:border-box;` +
        `width:${RANK_WIDTH};text-align:right;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.rowTime}{color:var(${VARIABLE_PREFIX}quiet);` +
        `font-variant-numeric:tabular-nums;flex:none;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.rowName}{min-width:0;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;flex:1;}` +
        // Before the name and never in place of it: the name is the cell that shortens, and a
        // mark taking width from it every row would be the cost ADR 0023 refused. This one is
        // drawn on the rows a doubt reaches, which is none of the rows in `captures/`.
        `.${CLASS.rowWarning}{position:relative;color:var(${VARIABLE_PREFIX}suspect);flex:none;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.rowSize}{flex:none;padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.row}.${CLASS.rowChosen}{box-shadow:inset 3px 0 0 var(${VARIABLE_PREFIX}text);}` +
        // ★ and ☆ measured 13.87px each in Firefox on 2026-08-26, and the row walked sideways
        // under the hand that pressed it.
        `.${CLASS.rowPin}{position:relative;cursor:pointer;color:var(${VARIABLE_PREFIX}quiet);` +
        `width:var(${VARIABLE_PREFIX}row-height);flex:none;align-self:stretch;display:flex;` +
        `align-items:center;justify-content:center;` +
        `margin-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.rowPin}:hover{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.rowPin}.${CLASS.rowPinSet}{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.rowValue}{font-variant-numeric:tabular-nums;flex:none;white-space:nowrap;` +
        `padding-left:var(${VARIABLE_PREFIX}wide);font-weight:600;}` +
        `.${CLASS.rowShare}{color:var(${VARIABLE_PREFIX}quiet);` +
        `padding-left:var(${VARIABLE_PREFIX}small);font-weight:400;}` +
        `.${CLASS.pinned}{margin:0 var(${VARIABLE_PREFIX}region-across);` +
        `padding:var(${VARIABLE_PREFIX}region-down) 0 ` +
        `${composeInsetUnderRows(VARIABLE_PREFIX + "region-down")};` +
        `border-top:1px dashed var(${VARIABLE_PREFIX}border);overflow:hidden;}` +
        `.${CLASS.pinned} .${CLASS.bar}{opacity:0.4;mask-image:repeating-linear-gradient(` +
        `-45deg,var(${VARIABLE_PREFIX}mask) 0 4px,transparent 4px 8px);}` +
        `.${CLASS.pinned} .${CLASS.barCap}{opacity:0.7;}`;
}

/**
 * **It states its own type and its own ink**, because `:host{all:initial}` reaches it and nothing
 * else does: the tip hangs off the root beside the frame, so `.panel`'s never arrive. Without the
 * two the card is drawn in the browser's serif at `medium` in black on `raised` — figures nobody
 * can read, seen in Chrome 152 on 2026-08-29.
 *
 * `position:fixed` puts its containing block at the viewport, so the host's `overflow:hidden`
 * cannot clip it: the host creates none, having no transform, filter or containment.
 */
function composeTipRules(): string {
    assert(TIP.width.endsWith("px"), "the tip is as wide as it was told, and does not reflow");
    assert(LINE_HEIGHT.endsWith("px"), "and a line of it costs whole pixels, as every line does");
    // A detail opening leftwards from the left edge of the screen would be drawn off it.
    const left = `var(${VARIABLE_PREFIX}tip-left,calc(100vw - ${PLACE.inset} - ${PLACE.width} - ` +
        `${TIP.width} - ${SPACE.small}))`;
    return `.${CLASS.tip}{position:fixed;box-sizing:border-box;pointer-events:none;` +
        `left:${left};top:${composeTipTop()};` +
        `width:${TIP.width};` +
        // A card taller than the screen has no position showing all of it, and the clamp keeps
        // the top edge over the bottom.
        `max-height:calc(100vh - ${PLACE.inset} - ${PLACE.inset});overflow:hidden;` +
        `padding:var(${VARIABLE_PREFIX}small);` +
        `font:${FONT_SIZE}/${LINE_HEIGHT} ${FONT_STACK};` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius);box-shadow:${SHAPE.windowShadow};}` +
        `.${CLASS.tipHidden}{display:none;}` +
        `.${CLASS.tipName}{font-weight:600;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}` +
        `.${CLASS.tipSubtitle}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.tipGroup}{margin-top:var(${VARIABLE_PREFIX}small);` +
        `padding-top:var(${VARIABLE_PREFIX}small);` +
        `border-top:1px solid var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.tipLine}{display:flex;justify-content:space-between;` +
        `gap:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.tipLine}.${CLASS.tipStrong}{font-weight:600;}` +
        `.${CLASS.tipLine}.${CLASS.tipSub}{padding-left:var(${VARIABLE_PREFIX}wide);}` +
        // Cut rather than wrapped, because a label that folded would stand the card wrong —
        // `MAXIMUM_LABEL_CHARACTERS` in `src/ui/panel-words.ts` is where that arithmetic is.
        `.${CLASS.tipLabel}{color:var(${VARIABLE_PREFIX}quiet);min-width:0;` +
        `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.tipValue}{font-variant-numeric:tabular-nums;flex:none;}` +
        // The same letters a cut's heading wears down the panel, so a run of parts under one
        // reads as the same kind of thing in both places. `DESIGN.md` owns the look.
        `.${CLASS.tipHeading}{color:var(${VARIABLE_PREFIX}heading);letter-spacing:0.08em;` +
        `font-size:10px;text-transform:uppercase;overflow:hidden;` +
        `text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.tipNote}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.tipNote}.${CLASS.tipWarning}{color:var(${VARIABLE_PREFIX}suspect);}`;
}

/**
 * The lines the draw counted times what a line costs, the air and the rule each run spends over
 * itself, and the padding and border the box reserves inside its own height.
 */
function composeTipHeight(): string {
    assert(LINE_HEIGHT.endsWith("px"), "a card is counted in lines of whole pixels");
    assert(SPACE.small.endsWith("px"), "and the air around them is whole pixels too");
    return `calc(var(${VARIABLE_PREFIX}tip-lines,1) * ${LINE_HEIGHT} + ` +
        `var(${VARIABLE_PREFIX}tip-groups,0) * ` +
        `(2 * var(${VARIABLE_PREFIX}small) + 1px) + ` +
        `2 * var(${VARIABLE_PREFIX}small) + 2px)`;
}

function composeTipTop(): string {
    assert(PLACE.inset.endsWith("px"), "a card stops a stated length from either edge");
    return `clamp(${PLACE.inset},var(${VARIABLE_PREFIX}tip-top,${PLACE.inset}),` +
        `calc(100vh - ${composeTipHeight()} - ${PLACE.inset}))`;
}

/**
 * **A window built the way the panel is**, and deliberately not the way the card is: a bar of
 * `raised` carrying the top two corners, a body of `surface` carrying the bottom two, one border
 * around each and **no shadow** — `DESIGN.md` gives the single shadow to the card alone.
 *
 * It states its own type and its own ink for the reason `composeTipRules` gives: it hangs off the
 * root, so `:host{all:initial}` reaches it and `.panel`'s rules never do.
 */
function composeAuraRules(): string {
    assert(AURAS.width.endsWith("px"), "the strip is as wide as it was told, and does not reflow");
    assert(LINE_HEIGHT.endsWith("px"), "and a line of it costs whole pixels, as every line does");
    // Beside the panel's own corner, so an unmoved strip stands next to an unmoved panel.
    const left = `calc(100vw - ${PLACE.inset} - ${PLACE.width} - ${SPACE.small} - ${AURAS.width})`;
    const top = `var(${VARIABLE_PREFIX}auras-top,${PLACE.inset})`;
    return `.${CLASS.auras}{position:fixed;left:${left};top:${top};` +
        `display:flex;flex-direction:column;` +
        `max-height:calc(100vh - ${top} - ${PLACE.inset});}` +
        `.${CLASS.aurasHidden}{display:none;}` +
        `.${CLASS.aurasTitle}{flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);` +
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}wide);` +
        `font:${FONT_SIZE}/${LINE_HEIGHT_TITLE} ${FONT_STACK};letter-spacing:0.06em;` +
        `color:var(${VARIABLE_PREFIX}quiet);` +
        `white-space:nowrap;background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);border-bottom:none;` +
        `border-radius:var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius) 0 0;` +
        `box-sizing:border-box;width:${AURAS.width};cursor:move;` +
        // The same reason the panel's own bar states these: a drag by the bar would otherwise
        // select the text under the cursor (`docs/browser-support.md`).
        `-webkit-user-select:none;user-select:none;touch-action:none;}` +
        `.${CLASS.aurasBody}{font:${FONT_SIZE}/${LINE_HEIGHT} ${FONT_STACK};` +
        `width:${AURAS.width};` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}surface);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:0 0 var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius);` +
        `box-sizing:border-box;display:flex;flex-direction:column;min-height:0;` +
        `overflow-y:auto;overflow-x:hidden;` +
        `padding:var(${VARIABLE_PREFIX}region-down) var(${VARIABLE_PREFIX}region-across);}` +
        `.${CLASS.aurasSkill}{color:var(${VARIABLE_PREFIX}quiet);` +
        `margin-top:var(${VARIABLE_PREFIX}half);` +
        `min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.aurasRow}{display:flex;justify-content:space-between;` +
        `gap:var(${VARIABLE_PREFIX}small);` +
        `height:var(${VARIABLE_PREFIX}row-height);align-items:center;}` +
        `.${CLASS.aurasName}{min-width:0;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}` +
        `.${CLASS.aurasTurns}{white-space:nowrap;flex:none;}` +
        `.${CLASS.aurasOurs}{color:var(${VARIABLE_PREFIX}ours);}` +
        `.${CLASS.aurasTheirs}{color:var(${VARIABLE_PREFIX}theirs);}`;
}

export function composeStyleSheet(): string {
    const sheet = `${composeFrameRules()}${composeRegionRules()}${composeListRules()}` +
        `${composeRowRules()}${composeTipRules()}${composeAuraRules()}`;
    assert(sheet.startsWith(":host{all:initial;"), "the sheet shuts the game out before anything");
    assert(!sheet.includes("}}"), "and closes each rule once");
    return sheet;
}
