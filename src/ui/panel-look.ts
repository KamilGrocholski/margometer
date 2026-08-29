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

/**
 * The eight hues, spent twice over: once on the kinds of damage and once on the professions.
 * Neither list ever stands beside the other — a ranking row is a person and a cut row is a kind —
 * so a hue meaning two things in two places costs a reader nothing.
 */
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
 * The classes the rules select. A region a reader meets before the panel's contents carries the
 * `MargoMeter-` prefix; what sits inside a region does not, because the game's stylesheet cannot
 * reach behind the root.
 */
export const CLASS = {
    title: "MargoMeter-titlebar",
    titleVersion: "titlebar-version",
    control: "titlebar-button",
    controlFights: "titlebar-fights",
    controlCopy: "titlebar-copy",
    controlRaw: "titlebar-raw",
    /** The wrapper the fold hides, so a folded panel is its title bar and nothing else. */
    frame: "MargoMeter-body",
    folded: "folded",
    panel: "panel",
    /** What stands where a region would while it has nothing to draw. */
    slot: "slot",
    header: "header",
    headerLine: "header-line",
    headerPlace: "header-place",
    tabs: "tabs",
    tabsGap: "tabs-gap",
    tab: "tab",
    tabCurrent: "selected",
    crumb: "crumb",
    crumbBack: "crumb-back",
    crumbHere: "crumb-here",
    list: "list",
    listWaiting: "list-waiting",
    section: "section-heading",
    row: "row",
    rowDrillable: "drillable",
    rowLeaf: "leaf",
    rowRank: "row-rank",
    rowBadge: "row-badge",
    rowName: "row-name",
    rowValue: "row-value",
    rowShare: "row-share",
    bar: "bar",
    barCap: "bar-cap",
    pinned: "pinned-region",
    empty: "empty",
    undrawn: "undrawn",
    warning: "warning",
    summary: "MargoMeter-summary",
    summaryName: "summary-name",
    summaryFigure: "summary-figure",
    tip: "MargoMeter-tip",
    tipHidden: "tip-hidden",
    tipName: "tip-name",
    tipLine: "tip-line",
    tipLabel: "tip-label",
    tipValue: "tip-value",
} as const;

export const SPACE = {
    half: "2px",
    small: "4px",
    /** The step every region is inset by: five pixels down the panel, seven across it. */
    regionDown: "5px",
    regionAcross: "7px",
    wide: "8px",
    large: "12px",
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

/**
 * The detail window's own geometry, and the one number here that is a **maximum** rather than a
 * size. The tip is one, two or three lines; the placement clamps against the tallest it can be,
 * so a shorter one lands further from the bottom edge instead of being measured. That is the whole
 * of what replaces v1's `getBoundingClientRect` (`git show develop:src/ui/panel-element.ts`).
 */
export const TIP = {
    width: "250px",
    heightMaximum: "64px",
} as const;

export const SHAPE = {
    radius: "8px",
    radiusSmall: "3px",
    windowShadow: "0 6px 20px rgb(0 0 0 / 55%)",
} as const;

/** What keeps eight saturated hues from competing with the figures printed over them. */
const BAR_TINT = 0.55;
/**
 * Pure black, and only ever as a mask. A `mask-image` reads alpha and throws the hue away, so
 * this is not a colour anybody sees — it is the opaque end of a gradient, named because a raw hex
 * in a rule is a bug and an exception nobody can see the edge of is how the next one gets written.
 */
const MASK_INK = "#000000";
/** How much of the quiet a section heading keeps, computed rather than laid on as an opacity. */
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
    assert(PALETTE_COLOURS.length > 0, "the palette holds the hues the design states");
    const stated = ELEMENT_HUES[element];
    if (stated !== undefined) {
        const held = PALETTE_COLOURS[stated];
        assert(held !== undefined, "a stated hue is a place inside the palette");
        return held;
    }
    // A key the register has never seen still needs a colour, and the same one every fight.
    let sum = 0;
    for (const character of element) sum += character.charCodeAt(0);
    assert(sum > 0, "a named key sums to something");
    const colour = PALETTE_COLOURS[sum % PALETTE_COLOURS.length];
    assert(colour !== undefined, "a place inside the palette holds a colour");
    return colour;
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

/** The bar is the row's own background, tinted over the track rather than laid on top of it. */
export function composeBarColour(hue: string): string {
    assert(hue.length > 0, "a bar is drawn in a colour that was chosen");
    const mixed = composeBarChannels(hue);
    assert(mixed.length === CHANNELS_IN_A_COLOUR, "a bar is three channels like any other");
    return `rgb(${mixed[0]} ${mixed[1]} ${mixed[2]})`;
}

/** The ink a figure printed over that bar takes, computed from the bar and not from the hue. */
export function getInkForBar(hue: string): string {
    return getInkForChannels(composeBarChannels(hue));
}

/**
 * Profession → hue, which is the pattern damage meters have used for twenty years: the bar says
 * **what** somebody is and the name beside it says **who**. Two mages take one colour on purpose.
 *
 * The codes are the game's own single letters, kept as the game spells them. Carried from v1
 * (`git show develop:src/ui/panel-look.ts`) rather than re-chosen: the same six letters get the
 * same six hues, so a reader coming from that panel is not asked to relearn a colour. Every one
 * of them is stated in `captures/` — 262 combatants over 28 recordings on 2026-08-29, none of
 * them without a profession, `w` 91 of them and `b` 17.
 */
const PROFESSION_HUES: Record<string, number> = {
    m: 0,
    h: 1,
    p: 2,
    t: 3,
    b: 4,
    w: 5,
};

/** Colourless where the game named no profession: unknown is the absence of a category. */
export function getColourForProfession(profession: string | null): string {
    if (profession === null) return SIGNAL.unknown;
    assert(profession.length > 0, "a profession that was stated says something");
    const stated = PROFESSION_HUES[profession];
    if (stated === undefined) return SIGNAL.unknown;
    const held = PALETTE_COLOURS[stated];
    assert(held !== undefined, "a stated hue is a place inside the palette");
    return held;
}

/**
 * One colour laid over another at an alpha, the way CSS composites `opacity`, in sRGB because
 * that is what the browser does here and the point is to predict what will be on screen.
 *
 * The heading is quieted this way rather than by an `opacity`: it sticks over a scrolling row,
 * and an opacity would fade its background with its text and let a bar ghost through it.
 */
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

/** The quiet a heading keeps once it is composited onto the panel's own surface. */
function composeHeadingColour(): string {
    const colour = composeColourOver(TEXT.quiet, SURFACE.panel, HEADING_TINT);
    assert(colour.startsWith("rgb("), "a composite is written the way a bar's colour is");
    assert(colour.endsWith(")"), "and closed like one");
    return colour;
}

/** Ours, because `all: initial` resets every property a page can set except a custom one. */
const VARIABLE_PREFIX = "--MargoMeter-";
/**
 * What the list stands at when a draw states nothing, which is the ranking's own floor. The draw
 * writes the count it wants; this is what a list drawn by a document with no panel around it gets.
 */
const ROWS_BY_DEFAULT = 11;
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
        composeVariable("heading", composeHeadingColour()),
        composeVariable("mask", MASK_INK),
        composeVariable("bar-tint", `${BAR_TINT}`),
        composeVariable("half", SPACE.half),
        composeVariable("small", SPACE.small),
        composeVariable("region-down", SPACE.regionDown),
        composeVariable("region-across", SPACE.regionAcross),
        composeVariable("wide", SPACE.wide),
        composeVariable("large", SPACE.large),
        composeVariable("row-height", SPACE.rowHeight),
        composeVariable("radius", SHAPE.radius),
        composeVariable("radius-small", SHAPE.radiusSmall),
    ].join("");
    assert(stated.length > 0, "the panel spends tokens rather than values");
    assert(stated.startsWith(VARIABLE_PREFIX), "and every one of them is ours by name");
    return stated;
}

/**
 * The host, the bar over it and the panel under that.
 *
 * `all: initial` is the Guest Rule's own half: nothing the game's stylesheet says reaches in, and
 * because it resets `display` too, every region below states its own. The bar carries the top two
 * corners and the panel the bottom two, so the two read as one window with a rule between them.
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
        `.${CLASS.title}{flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);` +
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}wide);` +
        `font:${FONT_SIZE}/1.2 ${FONT_STACK};letter-spacing:0.06em;` +
        `color:var(${VARIABLE_PREFIX}quiet);` +
        // One line, whatever the version number is. Everything on this bar is text, so without
        // this the row reflows the moment its content stops fitting: 0.10.0 was one character
        // wider than 0.9.0, which broke the name after the grip and split `{ }` between its
        // braces, and every guard stayed green because none of them lays anything out.
        `white-space:nowrap;background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);border-bottom:none;` +
        `border-radius:var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius) 0 0;` +
        `box-sizing:border-box;width:${PLACE.width};}` +
        `.${CLASS.titleVersion}{opacity:0.7;font-size:10px;}` +
        `.${CLASS.control}{padding:0 var(${VARIABLE_PREFIX}small);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius);` +
        `color:var(${VARIABLE_PREFIX}quiet);background:var(${VARIABLE_PREFIX}surface);` +
        `cursor:pointer;}` +
        `.${CLASS.control}:hover{color:var(${VARIABLE_PREFIX}text);}` +
        // The copy takes the free space, so the three that act on what is drawn stand together at
        // the far edge and the shelf rides the gap the name leaves.
        `.${CLASS.controlCopy}{margin-left:auto;}` +
        `.${CLASS.controlFights}{margin-left:var(${VARIABLE_PREFIX}wide);}` +
        // Dimmed because it is not for the player: it hands over the raw material.
        `.${CLASS.controlRaw}{opacity:0.55;}` +
        `.${CLASS.controlRaw}:hover{opacity:1;}` +
        // A flex item whose overflow is visible refuses to shrink below its own content, so
        // without `min-height:0` the ceiling on the host stops here and never reaches the list.
        `.${CLASS.frame}{display:flex;flex-direction:column;min-height:0;}` +
        // Two classes in the selector, so the outcome does not depend on where the rule is
        // written: a bare `.folded` ties with the region's own rule and loses on source order.
        `.${CLASS.frame}.${CLASS.folded}{display:none;}` +
        `.${CLASS.panel}{font:${FONT_SIZE}/1.35 ${FONT_STACK};width:${PLACE.width};` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}surface);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:0 0 var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius);` +
        `box-sizing:border-box;display:flex;flex-direction:column;min-height:0;}` +
        // Only the list gives way. Every other region says the same thing at any height, so
        // there is nothing to take off them; the list has a fold and a scrollbar and takes it all.
        `.${CLASS.panel}>*{flex:none;}` +
        `.${CLASS.panel}>.${CLASS.list}{flex:0 1 auto;}` +
        `.${CLASS.slot}{display:none;}`;
}

/**
 * The regions standing inside the panel: what the fight is, what a reader picks, and the list.
 *
 * The list's height is arithmetic rather than a number typed in — the rows it promises times what
 * a row costs — so changing the type size cannot quietly break the promise. The count arrives as
 * a custom property the draw writes.
 */
function composeRegionRules(): string {
    assert(SPACE.regionDown.endsWith("px"), "a region is inset by a length, in pixels");
    assert(CLASS.list.length > 0, "and the one region that scrolls is named");
    const region = `var(${VARIABLE_PREFIX}region-down) var(${VARIABLE_PREFIX}region-across)`;
    const rowCost = `(var(${VARIABLE_PREFIX}row-height) + var(${VARIABLE_PREFIX}half))`;
    return `.${CLASS.header}{display:block;padding:${region};padding-bottom:0;}` +
        `.${CLASS.headerLine}{display:flex;justify-content:space-between;align-items:baseline;}` +
        // A line of its own: beside the size and the outcome the place had about thirty
        // characters of a 260px panel, and a map's name plus a tile runs half again that.
        `.${CLASS.headerPlace}{color:var(${VARIABLE_PREFIX}quiet);font-size:10px;` +
        `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.tabs}{display:flex;flex-wrap:wrap;gap:var(${VARIABLE_PREFIX}half);` +
        `padding:${region};padding-bottom:0;}` +
        // Every strip after the first sits closer to it: they are one control, in rows.
        `.${CLASS.tabs}+.${CLASS.tabs}{padding-top:var(${VARIABLE_PREFIX}radius-small);}` +
        `.${CLASS.tabsGap}{flex:1;}` +
        `.${CLASS.tab}{white-space:nowrap;padding:1px var(${VARIABLE_PREFIX}small);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);color:var(${VARIABLE_PREFIX}quiet);` +
        `background:transparent;cursor:pointer;}` +
        `.${CLASS.tab}.${CLASS.tabCurrent}{color:var(${VARIABLE_PREFIX}text);` +
        `background:var(${VARIABLE_PREFIX}raised);}` +
        `.${CLASS.crumb}{display:flex;gap:var(${VARIABLE_PREFIX}wide);align-items:baseline;` +
        `padding:${region};padding-bottom:0;}` +
        `.${CLASS.crumbBack}{cursor:pointer;color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.crumbBack}:hover{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.crumbHere}{font-weight:600;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}` +
        `.${CLASS.list}{padding:${region};` +
        `padding-bottom:var(${VARIABLE_PREFIX}region-across);` +
        `height:calc(var(${VARIABLE_PREFIX}rows,${ROWS_BY_DEFAULT}) * ${rowCost} + ` +
        `var(${VARIABLE_PREFIX}large));overflow-y:auto;overflow-x:hidden;` +
        // Reserved whether or not a scrollbar is showing: it appears and disappears between two
        // payloads, and rows that jump sideways while somebody reads them are worse than a gutter.
        `scrollbar-gutter:stable;overscroll-behavior:contain;scrollbar-width:thin;` +
        `scrollbar-color:var(${VARIABLE_PREFIX}border) transparent;}` +
        // It stays at the top edge while its own section scrolls, so a figure is never read under
        // the wrong heading. The background and the layer are not decoration: a row's bar is
        // positioned and comes later in the tree, so without both the bars paint over it.
        `.${CLASS.section}{position:sticky;` +
        `top:calc(0px - var(${VARIABLE_PREFIX}region-down));z-index:1;` +
        `background:var(${VARIABLE_PREFIX}surface);display:flex;justify-content:space-between;` +
        `color:var(${VARIABLE_PREFIX}heading);letter-spacing:0.08em;font-size:10px;` +
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}half) ` +
        `var(${VARIABLE_PREFIX}half);}` +
        // The one list with nothing above the sentence, so the sentence is what the box is for.
        `.${CLASS.listWaiting}{display:flex;align-items:center;justify-content:center;` +
        `text-align:center;}` +
        `.${CLASS.empty}{color:var(${VARIABLE_PREFIX}quiet);` +
        `padding:var(${VARIABLE_PREFIX}wide) var(${VARIABLE_PREFIX}half);}` +
        `.${CLASS.undrawn}{color:var(${VARIABLE_PREFIX}quiet);font-style:italic;` +
        `padding:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.summary}{display:flex;justify-content:space-between;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);padding:0 var(${VARIABLE_PREFIX}small);` +
        `height:var(${VARIABLE_PREFIX}row-height);background:var(${VARIABLE_PREFIX}raised);` +
        `border-top:1px solid var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.summaryName}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.summaryFigure}{font-variant-numeric:tabular-nums;}` +
        `.${CLASS.warning}{color:var(${VARIABLE_PREFIX}suspect);` +
        `padding:0 var(${VARIABLE_PREFIX}small);}`;
}

/**
 * What sits inside a list. Every row is the same height, bar included: a row whose background is
 * taller than its neighbour reads as a different kind of row, and it is not one.
 *
 * The bar is an element behind the text rather than the row's own background, because the cap
 * gives the hue back at full strength on the edge the bar starts from — the bar itself is tinted
 * so the figures printed over it stay readable, which costs the colour the palette was chosen at.
 */
function composeRowRules(): string {
    assert(SPACE.rowHeight.length > 0, "every row is drawn at one height");
    assert(SHAPE.radiusSmall.endsWith("px"), "what sits in a row is rounded in pixels");
    const cap = `var(${VARIABLE_PREFIX}radius-small) 0 0 var(${VARIABLE_PREFIX}radius-small)`;
    return `.${CLASS.row}{position:relative;display:flex;justify-content:space-between;` +
        `align-items:center;height:var(${VARIABLE_PREFIX}row-height);` +
        `padding:0 var(${VARIABLE_PREFIX}small);margin-bottom:var(${VARIABLE_PREFIX}half);` +
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
        `font-variant-numeric:tabular-nums;padding-right:var(${VARIABLE_PREFIX}small);}` +
        // The profession as a letter, which is the channel that survives colour blindness: six
        // professions cannot be made mutually distinguishable on this background, so it is the
        // letter and not the hue that answers who is what.
        `.${CLASS.rowBadge}{position:relative;flex:none;width:13px;height:13px;` +
        `margin-right:var(${VARIABLE_PREFIX}small);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);font-size:9px;font-weight:700;` +
        `line-height:13px;text-align:center;}` +
        `.${CLASS.rowName}{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}` +
        `.${CLASS.rowValue}{font-variant-numeric:tabular-nums;` +
        `padding-left:var(${VARIABLE_PREFIX}wide);font-weight:600;}` +
        `.${CLASS.rowShare}{color:var(${VARIABLE_PREFIX}quiet);` +
        `padding-left:var(${VARIABLE_PREFIX}small);font-weight:400;}` +
        // The row that says something is missing is drawn as what it is: a dashed rule cuts it
        // off the ranking above, and the bar is hatched rather than solid, because it is not a
        // combatant and must not look like one at a glance. The gutter is the list's own, so a
        // bar outside the list is drawn the same length as a bar inside it.
        `.${CLASS.pinned}{margin:var(${VARIABLE_PREFIX}small) ` +
        `var(${VARIABLE_PREFIX}region-across) 0;padding:var(${VARIABLE_PREFIX}small) 0 ` +
        `var(${VARIABLE_PREFIX}region-across);` +
        `border-top:1px dashed var(${VARIABLE_PREFIX}border);overflow:hidden;` +
        `scrollbar-gutter:stable;scrollbar-width:thin;}` +
        `.${CLASS.pinned} .${CLASS.bar}{opacity:0.4;mask-image:repeating-linear-gradient(` +
        `-45deg,var(${VARIABLE_PREFIX}mask) 0 4px,transparent 4px 8px);}` +
        `.${CLASS.pinned} .${CLASS.barCap}{opacity:0.7;}`;
}

/**
 * The detail window, which is the one thing here placed against the screen rather than against
 * the panel.
 *
 * **Across, it is a constant.** The host is pinned to the top right corner by the frame rules, so
 * the tip always opens on its left and there is no side to choose. v1 had to choose one, because
 * its panel was dragged — `composeTipDeclarations` in
 * `git show develop:src/ui/panel-element.ts`. A draggable panel brings that flip back with it.
 *
 * **Down, it follows the pointer and stops at the edges**, and the `clamp` is what keeps the tip
 * from being measured: the low edge wins where the two cross, which is a window hanging off the
 * bottom rather than one whose first line is off the top.
 *
 * `position:fixed` puts its containing block at the viewport rather than at the host, so the
 * host's own `overflow:hidden` does not clip it — the host creates no containing block, having no
 * transform, filter or containment. `pointer-events:none` keeps the tip from taking a pointer
 * away from the row it is describing.
 */
function composeTipRules(): string {
    assert(TIP.width.endsWith("px"), "the tip is as wide as it was told, and does not reflow");
    assert(TIP.heightMaximum.endsWith("px"), "and is clamped against the tallest it can be");
    const top = `clamp(${PLACE.inset},var(${VARIABLE_PREFIX}tip-top,${PLACE.inset}),` +
        `calc(100vh - ${TIP.heightMaximum} - ${PLACE.inset}))`;
    return `.${CLASS.tip}{position:fixed;box-sizing:border-box;pointer-events:none;` +
        `right:calc(${PLACE.inset} + ${PLACE.width} + ${SPACE.small});top:${top};` +
        `width:${TIP.width};max-height:${TIP.heightMaximum};overflow:hidden;` +
        `padding:var(${VARIABLE_PREFIX}small);` +
        `background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius);box-shadow:${SHAPE.windowShadow};}` +
        `.${CLASS.tipHidden}{display:none;}` +
        `.${CLASS.tipName}{font-weight:600;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}` +
        `.${CLASS.tipLine}{display:flex;justify-content:space-between;` +
        `gap:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.tipLabel}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.tipValue}{font-variant-numeric:tabular-nums;flex:none;}`;
}

/**
 * The whole sheet, composed once. A browser is handed text rather than a list of rules, because
 * a shadow root takes one `<style>` and this panel has one look.
 */
export function composeStyleSheet(): string {
    const sheet = `${composeFrameRules()}${composeRegionRules()}${composeRowRules()}` +
        `${composeTipRules()}`;
    assert(sheet.startsWith(":host{all:initial;"), "the sheet shuts the game out before anything");
    assert(!sheet.includes("}}"), "and closes each rule once");
    return sheet;
}
