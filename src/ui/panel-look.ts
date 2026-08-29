/**
 * The panel's tokens, the classes its rules select, and the stylesheet built out of both.
 *
 * The rules live beside the values so that a rule can reach nothing else: a raw hex, pixel or
 * radius in a rule is a bug, and holding that mechanically means there is one file to look in.
 * A class is spelled here and imported by the file that wears it, because the failure when two
 * spellings drift is an unstyled row rather than anything a compiler sees.
 *
 * `DESIGN.md` owns what these values are for; this file owns what they are.
 */

import { assert } from "@std/assert";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";

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

/** Eight hues for the damage elements. The corpus states ten, so two of them share. */
export const ELEMENT_COLOURS = [
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
 * The classes the rules select. A region a reader meets before the panel's contents carries the
 * `MargoMeter-` prefix; what sits inside a region does not, because the game's stylesheet cannot
 * reach behind the root.
 */
export const CLASS = {
    title: "MargoMeter-titlebar",
    tabs: "MargoMeter-tabs",
    body: "MargoMeter-body",
    titleName: "title-name",
    place: "place",
    tab: "tab",
    tabCurrent: "tab-current",
    row: "row",
    rowName: "row-name",
    rowFigure: "row-figure",
    pinned: "pinned",
    section: "section",
    crumb: "crumb",
    drillHead: "drill-head",
    empty: "empty",
    undrawn: "undrawn",
    warning: "warning",
    summary: "MargoMeter-summary",
    summaryName: "summary-name",
    summaryFigure: "summary-figure",
} as const;

export const SPACE = {
    half: "2px",
    small: "4px",
    rowHeight: "18px",
    heightShareMaximum: "66vh",
} as const;

/**
 * Where the panel sits and how wide it is. Carried from v1, whose drag arithmetic needed the
 * margin and the width as one pair (`git show develop:src/ui/panel-look.ts`). The layer is high
 * enough to clear the game's own windows, which is the whole requirement — there is nothing of
 * ours for it to be relative to.
 */
export const PLACE = {
    inset: "8px",
    width: "260px",
    layer: "9999",
} as const;

export const SHAPE = {
    radius: "8px",
    radiusSmall: "3px",
    windowShadow: "0 6px 20px rgb(0 0 0 / 55%)",
} as const;

/** What keeps eight saturated hues from competing with the figures printed over them. */
const BAR_TINT = 0.55;
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

/** Computed from the colour it sits on, never chosen by hand. */
export function getInkForColour(colour: string): string {
    const channels = getChannelsFromColour(colour);
    if (channels === null) return TEXT.inkLight;
    return getInkForChannels(channels);
}

/**
 * By the key, so an element is the same colour in every fight. The eight elements `captures/`
 * states most often take a hue each; the two rarest share with the two rarest above them, which
 * is stated here rather than left to a hash — no multiplier tried separates ten keys this alike
 * into eight hues, so the collisions are chosen instead of discovered.
 */
const ELEMENT_HUES: Record<string, number> = {
    dmg: 0,
    dmgd: 1,
    dmgc: 2,
    dmga: 3,
    dmgl: 4,
    dmgf: 5,
    dmgo: 6,
    dmgg: 7,
    thirdatt: 6,
    dmgp: 7,
};

export function getColourForElement(element: string): string {
    assert(element.length > 0, "an element is named");
    assert(ELEMENT_COLOURS.length > 0, "the palette holds the hues the design states");
    const stated = ELEMENT_HUES[element];
    if (stated !== undefined) {
        const held = ELEMENT_COLOURS[stated];
        assert(held !== undefined, "a stated hue is a place inside the palette");
        return held;
    }
    // A key the register has never seen still needs a colour, and the same one every fight.
    let sum = 0;
    for (const character of element) sum += character.charCodeAt(0);
    assert(sum > 0, "a named key sums to something");
    const colour = ELEMENT_COLOURS[sum % ELEMENT_COLOURS.length];
    assert(colour !== undefined, "a place inside the palette holds a colour");
    return colour;
}

function composeBarChannels(element: string): number[] {
    const hue = getChannelsFromColour(getColourForElement(element));
    const track = getChannelsFromColour(SURFACE.track);
    assert(hue !== null, "the palette is written as colours");
    assert(track !== null, "and so is the track they sit on");
    assert(hue.length === track.length, "a hue and a track are mixed channel for channel");
    return hue.map((channel, at) =>
        Math.round((track[at] ?? 0) * (1 - BAR_TINT) + channel * BAR_TINT)
    );
}

/** The bar is the row's own background, tinted over the track rather than laid on top of it. */
export function composeBarColour(element: string): string {
    assert(element.length > 0, "a bar is drawn for an element that is named");
    const mixed = composeBarChannels(element);
    assert(mixed.length === CHANNELS_IN_A_COLOUR, "a bar is three channels like any other");
    return `rgb(${mixed[0]} ${mixed[1]} ${mixed[2]})`;
}

/** The ink a figure printed over that bar takes, computed from the bar and not from the hue. */
export function getInkForBar(element: string): string {
    return getInkForChannels(composeBarChannels(element));
}

/** Ours, because `all: initial` resets every property a page can set except a custom one. */
const VARIABLE_PREFIX = "--MargoMeter-";
const SHARE_AS_PERCENT = 100;
/** The system stack, so the panel asks a browser for no font and waits for no download. */
const FONT_STACK = "system-ui, sans-serif";
const FONT_SIZE = "11px";

function composeVariable(name: string, value: string): string {
    assert(name.length > 0, "a token is named");
    assert(value.length > 0, "and carries a value");
    return `${VARIABLE_PREFIX}${name}:${value};`;
}

/**
 * Every token, as a custom property on the host. A rule below spends one of these and reaches
 * nothing else, which is what makes a raw hex anywhere under it visible as the bug it is.
 */
function composeVariables(): string {
    const stated = [
        composeVariable("surface", SURFACE.panel),
        composeVariable("raised", SURFACE.raised),
        composeVariable("track", SURFACE.track),
        composeVariable("border", SURFACE.border),
        composeVariable("text", TEXT.plain),
        composeVariable("quiet", TEXT.quiet),
        composeVariable("suspect", SIGNAL.suspect),
        composeVariable("half", SPACE.half),
        composeVariable("small", SPACE.small),
        composeVariable("row-height", SPACE.rowHeight),
        composeVariable("radius", SHAPE.radius),
        composeVariable("radius-small", SHAPE.radiusSmall),
    ].join("");
    assert(stated.length > 0, "the panel spends tokens rather than values");
    assert(stated.startsWith(VARIABLE_PREFIX), "and every one of them is ours by name");
    return stated;
}

/**
 * The host and the three regions standing in it.
 *
 * `all: initial` is the Guest Rule's own half: nothing the game's stylesheet says reaches in, and
 * because it resets `display` too, every region below states its own.
 */
function composeFrameRules(): string {
    assert(PLACE.width.endsWith("px"), "the panel is as wide as it was told, in pixels");
    assert(CLASS.title.startsWith("MargoMeter-"), "a region is named as ours before it is styled");
    return `:host{all:initial;${composeVariables()}` +
        `position:fixed;top:${PLACE.inset};right:${PLACE.inset};width:${PLACE.width};` +
        `z-index:${PLACE.layer};display:flex;flex-direction:column;` +
        `font-family:${FONT_STACK};font-size:${FONT_SIZE};` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}surface);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius);box-shadow:${SHAPE.windowShadow};` +
        `max-height:${SPACE.heightShareMaximum};overflow:hidden;}` +
        `.${CLASS.title}{display:flex;justify-content:space-between;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);padding:var(${VARIABLE_PREFIX}small);` +
        `background:var(${VARIABLE_PREFIX}raised);` +
        `border-bottom:1px solid var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.titleName}{font-weight:600;}` +
        `.${CLASS.place}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.tabs}{display:flex;flex-wrap:wrap;gap:var(${VARIABLE_PREFIX}half);` +
        `padding:var(${VARIABLE_PREFIX}half) var(${VARIABLE_PREFIX}small);` +
        `border-bottom:1px solid var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.body}{overflow-y:auto;padding:var(${VARIABLE_PREFIX}half) 0;}` +
        `.${CLASS.summary}{display:flex;justify-content:space-between;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);padding:0 var(${VARIABLE_PREFIX}small);` +
        `height:var(${VARIABLE_PREFIX}row-height);` +
        `background:var(${VARIABLE_PREFIX}raised);` +
        `border-top:1px solid var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.summaryName}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.summaryFigure}{font-variant-numeric:tabular-nums;}`;
}

/**
 * What sits inside the body. Every row is the same height, accent included: a row whose
 * background is taller than its neighbour reads as a different kind of row, and it is not one.
 */
function composeRowRules(): string {
    assert(SPACE.rowHeight.length > 0, "every row is drawn at one height");
    assert(SHAPE.radiusSmall.endsWith("px"), "what sits in a row is rounded in pixels");
    return `.${CLASS.row},.${CLASS.pinned},.${CLASS.drillHead}{display:flex;` +
        `justify-content:space-between;gap:var(${VARIABLE_PREFIX}small);align-items:center;` +
        `height:var(${VARIABLE_PREFIX}row-height);` +
        `padding:0 var(${VARIABLE_PREFIX}small);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);` +
        `background-color:var(${VARIABLE_PREFIX}track);background-repeat:no-repeat;}` +
        `.${CLASS.rowName}{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.rowFigure}{font-variant-numeric:tabular-nums;flex:none;}` +
        `.${CLASS.pinned}{color:var(${VARIABLE_PREFIX}quiet);` +
        `margin-top:var(${VARIABLE_PREFIX}half);}` +
        `.${CLASS.drillHead}{background-color:var(${VARIABLE_PREFIX}raised);font-weight:600;}` +
        `.${CLASS.section}{color:var(${VARIABLE_PREFIX}quiet);` +
        `height:var(${VARIABLE_PREFIX}row-height);line-height:var(${VARIABLE_PREFIX}row-height);` +
        `padding:0 var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.crumb}{color:var(${VARIABLE_PREFIX}quiet);cursor:pointer;` +
        `height:var(${VARIABLE_PREFIX}row-height);line-height:var(${VARIABLE_PREFIX}row-height);` +
        `padding:0 var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.tab}{cursor:pointer;color:var(${VARIABLE_PREFIX}quiet);` +
        `padding:0 var(${VARIABLE_PREFIX}small);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);}` +
        `.${CLASS.tabCurrent}{color:var(${VARIABLE_PREFIX}text);` +
        `background:var(${VARIABLE_PREFIX}raised);}` +
        `.${CLASS.empty},.${CLASS.undrawn}{color:var(${VARIABLE_PREFIX}quiet);` +
        `padding:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.warning}{color:var(${VARIABLE_PREFIX}suspect);` +
        `padding:0 var(${VARIABLE_PREFIX}small);}`;
}

/**
 * The whole sheet, composed once. A browser is handed text rather than a list of rules, because
 * a shadow root takes one `<style>` and this panel has one look.
 */
export function composeStyleSheet(): string {
    const sheet = `${composeFrameRules()}${composeRowRules()}`;
    assert(sheet.startsWith(":host{all:initial;"), "the sheet shuts the game out before anything");
    assert(!sheet.includes("}}"), "and closes each rule once");
    return sheet;
}

/**
 * A row's share, drawn as the row's own background rather than as an element inside it, so the
 * row's height cannot disagree with the accent's. The colour stops where the share does.
 */
export function composeShareBackground(colour: string, share: number): string {
    assert(colour.length > 0, "a bar is drawn in a colour");
    assert(share >= 0, "a share is never below nothing");
    assert(share <= 1, "and never more than the whole");
    const percent = share * SHARE_AS_PERCENT;
    const stop = `${percent}%`;
    assert(stop.endsWith("%"), "a stop is written as a share of the row");
    return `linear-gradient(to right, ${colour} ${stop}, transparent ${stop})`;
}
