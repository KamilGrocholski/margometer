/**
 * The panel's tokens, the classes its rules select, and the stylesheet built out of both.
 *
 * A class is spelled here and imported by the file that wears it: when two spellings drift the
 * failure is an unstyled row rather than anything a compiler sees.
 *
 * `DESIGN.md` owns what these values are for; this file owns what they are.
 */

import { getValueWithin } from "@/libs/number-range.ts";
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
    defect: "#c25ce0",
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
    defects: "defects",
    defect: "defect",
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
/**
 * ⚠️ **Three, held by the compiler rather than by a check.** Everything here writes its answers
 * straight into a rule, and a list one short puts the word `undefined` inside `rgb(…)` — which a
 * browser drops, leaving the element on whatever it inherits with nothing saying so. A guard at
 * each writer was the first answer and it was dead code: nothing could reach it. **ADR 0051.**
 */
type ColourChannels = readonly [number, number, number];

const INK_DARK_CHANNELS: ColourChannels = [0x14, 0x14, 0x1a];
const INK_LIGHT_CHANNELS: ColourChannels = [0xff, 0xff, 0xff];

function getDigitFromHex(character: string): number | null {
    const at = HEX_DIGITS.indexOf(character.toLowerCase());
    if (at === -1) return null;
    return at;
}

/** The other spelling, because a bar is composed as one and its ink is read back off it. */
function getChannelsFromRgb(colour: string): ColourChannels | null {
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
    return composeChannels(channels);
}

/** Null for anything that is neither spelling, because a colour nobody wrote is not a colour. */
function getChannelsFromColour(colour: string): ColourChannels | null {
    if (colour.startsWith(RGB_OPENER)) return getChannelsFromRgb(colour);
    if (!colour.startsWith("#")) return null;
    if (colour.length !== HEX_COLOUR_LENGTH) return null;
    const channels: number[] = [];
    for (let at = 1; at < colour.length; at += HEX_DIGITS_PER_CHANNEL) {
        const high = getDigitFromHex(colour.charAt(at));
        const low = getDigitFromHex(colour.charAt(at + 1));
        if (high === null || low === null) return null;
        channels.push(high * HEX_BASE + low);
    }
    return composeChannels(channels);
}

/** The one place a list becomes three channels, so no writer downstream has to ask again. */
function composeChannels(read: readonly number[]): ColourChannels | null {
    if (read.length !== CHANNELS_IN_A_COLOUR) return null;
    const [red, green, blue] = read;
    if (red === undefined) return null;
    if (green === undefined) return null;
    if (blue === undefined) return null;
    return [red, green, blue];
}

function getLuminanceFromChannels(channels: ColourChannels): number {
    let luminance = 0;
    for (const [at, channel] of channels.entries()) {
        const share = channel / CHANNEL_MAXIMUM;
        const linear = share <= LOW_CHANNEL
            ? share / LOW_SLOPE
            : ((share + CHANNEL_OFFSET) / (1 + CHANNEL_OFFSET)) ** CHANNEL_EXPONENT;
        luminance += linear * (LUMINANCE_WEIGHTS[at] ?? 0);
    }

    return luminance;
}

function getContrastFromChannels(one: ColourChannels, other: ColourChannels): number {
    const bright = Math.max(getLuminanceFromChannels(one), getLuminanceFromChannels(other));
    const dim = Math.min(getLuminanceFromChannels(one), getLuminanceFromChannels(other));
    const ratio = (bright + LUMINANCE_OFFSET) / (dim + LUMINANCE_OFFSET);
    return ratio;
}

/** One where a colour could not be read, so an unreadable pairing never passes for a good one. */
export function getContrastRatio(one: string, other: string): number {
    const first = getChannelsFromColour(one);
    const second = getChannelsFromColour(other);
    if (first === null || second === null) return 1;
    return getContrastFromChannels(first, second);
}

function getInkForChannels(channels: ColourChannels): string {
    const onDark = getContrastFromChannels(channels, INK_DARK_CHANNELS);
    const onLight = getContrastFromChannels(channels, INK_LIGHT_CHANNELS);
    if (onDark >= onLight) return TEXT.inkDark;
    return TEXT.inkLight;
}

/** A colour nothing could be read from is the track, which is a colour and not a dropped rule. */
function composeRgbText(channels: ColourChannels | null): string {
    if (channels === null) return SURFACE.track;
    const [red, green, blue] = channels;
    return `rgb(${red} ${green} ${blue})`;
}

/** Null for a hue that is not a colour this file wrote, which is the caller's to answer for. */
function composeBarChannels(hue: string): ColourChannels | null {
    const chosen = getChannelsFromColour(hue);
    const track = getChannelsFromColour(SURFACE.track);
    if (chosen === null) return null;
    if (track === null) return null;
    return composeChannels(
        chosen.map((channel, at) =>
            Math.round((track[at] ?? 0) * (1 - BAR_TINT) + channel * BAR_TINT)
        ),
    );
}

/** A bar drawn in its own track states its length and says nothing about whose it is. */
export function composeBarColour(hue: string): string {
    return composeRgbText(composeBarChannels(hue));
}

export function getInkForBar(hue: string): string {
    const mixed = composeBarChannels(hue);
    if (mixed === null) return TEXT.inkLight;
    return getInkForChannels(mixed);
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
    const stated = PROFESSION_HUES[profession];
    if (stated === undefined) return SIGNAL.unknown;
    return PALETTE_COLOURS[stated] ?? SIGNAL.unknown;
}

/** One colour over another at an alpha, in sRGB because that is what the browser does here. */
function composeColourOver(top: string, bottom: string, alpha: number): string {
    const above = getChannelsFromColour(top);
    const below = getChannelsFromColour(bottom);
    // Nothing to lay over anything: what is underneath stands, which is a colour and not a rule
    // the browser will drop.
    if (above === null) return bottom;
    if (below === null) return bottom;
    const share = getValueWithin(alpha, 0, 1);
    const mixed = above.map((one, at) => Math.round(share * one + (1 - share) * (below[at] ?? 0)));
    return composeRgbText(composeChannels(mixed));
}

function composeHeadingColour(): string {
    return composeColourOver(TEXT.quiet, SURFACE.panel, HEADING_TINT);
}

const VARIABLE_PREFIX = "--MargoMeter-";
const ROWS_BY_DEFAULT = 11;
const FONT_STACK = "system-ui, sans-serif";
const FONT_SIZE = "11px";
/** Whole pixels: a fractional line box puts every box under it off the grid. **ADR 0015.** */
const LINE_HEIGHT = "15px";
const LINE_HEIGHT_TITLE = "13px";

function composeVariable(name: string, value: string): string {
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
        composeVariable("defect", SIGNAL.defect),
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
    const ceiling = `min(calc(100vh - var(${VARIABLE_PREFIX}panel-top) - ${PLACE.inset}),` +
        `${SPACE.heightShareMaximum})`;
    return `:host{all:initial;${composeVariables()}` +
        `${VARIABLE_PREFIX}panel-top:${PLACE.inset};` +
        `position:fixed;top:var(${VARIABLE_PREFIX}panel-top);right:${PLACE.inset};` +
        `z-index:${PLACE.layer};display:flex;flex-direction:column;` +
        `max-height:${ceiling};}` +
        `.${CLASS.title}{flex:none;display:flex;align-items:center;` +
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
        `.${CLASS.frame}{display:flex;flex-direction:column;min-height:0;}` +
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
    const written = `calc(var(${inset}) - var(${VARIABLE_PREFIX}half))`;
    return written;
}

/** The list's height is the rows it promises times what a row costs. **ADR 0014.** */
function composeListRules(): string {
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
        `padding:0 var(${VARIABLE_PREFIX}region-across) var(${VARIABLE_PREFIX}region-down);}` +
        `.${CLASS.defects}{border-top:1px solid var(${VARIABLE_PREFIX}border);` +
        `padding-top:var(${VARIABLE_PREFIX}region-down);}` +
        `.${CLASS.defect}{color:var(${VARIABLE_PREFIX}defect);` +
        `padding:0 var(${VARIABLE_PREFIX}region-across) var(${VARIABLE_PREFIX}region-down);}`;
}

function composeRowRules(): string {
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
    return `calc(var(${VARIABLE_PREFIX}tip-lines,1) * ${LINE_HEIGHT} + ` +
        `var(${VARIABLE_PREFIX}tip-groups,0) * ` +
        `(2 * var(${VARIABLE_PREFIX}small) + 1px) + ` +
        `2 * var(${VARIABLE_PREFIX}small) + 2px)`;
}

function composeTipTop(): string {
    return `clamp(${PLACE.inset},var(${VARIABLE_PREFIX}tip-top,${PLACE.inset}),` +
        `calc(100vh - ${composeTipHeight()} - ${PLACE.inset}))`;
}

export function composeStyleSheet(): string {
    return `${composeFrameRules()}${composeRegionRules()}${composeListRules()}` +
        `${composeRowRules()}${composeTipRules()}`;
}
