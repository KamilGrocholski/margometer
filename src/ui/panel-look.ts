/**
 * The panel's tokens, the classes its rules select, and the stylesheet built out of both.
 *
 * A class is spelled here and imported by the file that wears it: when two spellings drift the
 * failure is an unstyled row rather than anything a compiler sees.
 *
 * `develop:DESIGN.md` owns what these values are for; this file owns what they are.
 */

import { clamp } from "#/libs/number-range.ts";
import { type Colour, formatColour, SIGNAL } from "./panel-palette.ts";

export const SURFACE = {
    panel: [0x0f, 0x16, 0x1d],
    raised: [0x17, 0x1e, 0x25],
    track: [0x1b, 0x23, 0x2a],
    border: [0x23, 0x2b, 0x33],
} as const;

export const TEXT = {
    plain: [0xe3, 0xe7, 0xea],
    quiet: [0x97, 0x9f, 0xa8],
    inkDark: [0x0d, 0x13, 0x19],
    inkLight: [0xff, 0xff, 0xff],
} as const;

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
    strips: "strips",
    stripsGap: "strips-gap",
    stripsLabel: "strips-label",
    strip: "strip",
    stripCurrent: "selected",
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
    rowApart: "apart",
    rowPin: "row-pin",
    rowPinSet: "pinned",
    rowValue: "row-value",
    rowShare: "row-share",
    rowSuspect: "row-suspect",
    rowCaveat: "row-caveat",
    rowTurn: "row-turn",
    rowSide: "row-side",
    bar: "bar",
    barCap: "bar-cap",
    /** Worn by every cell that carries a figure, wherever in the panel it stands. */
    figure: "figure",
    pinned: "pinned-region",
    /** The section under the pinned rows: what the screen's own count holds and no row does. */
    outside: "outside-region",
    empty: "empty",
    undrawn: "undrawn",
    suspicions: "suspicions",
    suspicion: "suspicion",
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
    tipCaveat: "tip-caveat",
    tipValue: "tip-value",
    /** A sentence rather than a column, so the placement counts it as wrapping. */
    tipNote: "tip-note",
    tipSuspect: "tip-suspect",
    /** The sentence's own, and never `tipCaveat` — that one is the glyph cell beside a figure. */
    tipCaveatNote: "tip-caveat-note",
    /** The window beside the panel: its own bar, its own body, and the rows under each heading. */
    standing: "MargoMeter-standing",
    standingBar: "standing-bar",
    standingBody: "standing-body",
    standingFolded: "standing-folded",
    /** A row nested under the one above it, whoever stands in either. */
    standingUnder: "standing-under",
    /** The okrzyk a holder is holding somebody with, drawn on their row (`develop ADR 0097`). */
    standingCast: "standing-cast",
    /** The row that carries one, which is the only row where the name gives way last. */
    standingHolding: "standing-holding",
    standingPips: "standing-pips",
    standingPip: "standing-pip",
    standingPipLit: "standing-pip-lit",
} as const;

export const SPACE_PIXELS = {
    half: 2,
    small: 4,
    regionDown: 5,
    regionAcross: 7,
    wide: 8,
    rowHeight: 18,
} as const;
/** The tallest the panel stands, as a share of the window's height. */
export const PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM = 66;

export const PLACE = {
    insetPixels: 8,
    widthPixels: 260,
    /**
     * The host against the game's own page, and nothing inside the root: the game's interface
     * layer, won by standing after it in `body`, and under every window of theirs —
     * `develop ADR 0114`.
     */
    layer: "10",
} as const;

/**
 * What stands over what **inside** the root, where three things overlap and the order is a
 * decision: the window beside the panel may be dragged over the panel, and the card stands over
 * both. A card is the one thing a reader asked for by pointing, so nothing they did not point at
 * covers it. The frame takes no layer of its own and sits under both.
 */
export const LAYER = {
    standing: "2",
    tip: "3",
} as const;

/**
 * How wide a card may stand — **a maximum and not a width**. The card is drawn at `max-content` and
 * this clamps it, so one saying two words is as wide as two words, and a ranking card fills the
 * bound. What that was measured to cost is `develop ADR 0091`'s, and the widths a browser really
 * draws are `tests/e2e/panel-tip.spec.ts`'s.
 */
export const TIP = {
    widthPixelsMaximum: 250,
} as const;

/**
 * The window beside the panel. Narrower than the panel because it carries a name and a figure
 * and never a rank or a share, and it is the second thing standing over somebody else's game.
 */
export const STANDING = {
    widthPixels: 210,
} as const;

/** A dot small enough that four of them and a figure fit the window's own width. */
const PIP_SIZE_PIXELS = 5;
/**
 * The least an okrzyk's name is drawn at, so a long nickname on the same row cannot erase it.
 *
 * Measured in Chrome at the panel's own size on 2026-09-18: `Wyzywa` is 49px and `Prowok` 44px,
 * and the two okrzyki differ from their first letter — so this shows enough of either to say
 * which. Without it a 25-character nickname left the cast 4px, which is the feature gone.
 */
const CAST_WIDTH_PIXELS_MINIMUM = 48;
/**
 * The caveat mark's ring, across and down. Ten against an 11px body and an 18px row: smaller
 * reads as a speck beside a figure, larger sits taller than the digits it stands next to — and
 * nine carries no letter at all, measured in Chrome 152 on 2026-09-15.
 */
const MARK_SIZE_PIXELS = 10;
/** What drops the ring onto the first line of a sentence: the line box less the ring, halved. */
const MARK_DROP_PIXELS = 2;

export const SHAPE = {
    radiusPixels: 8,
    radiusSmallPixels: 3,
    windowShadow: "0 6px 20px rgb(0 0 0 / 55%)",
} as const;

/** Two digits and a stop: 17.50px in Chrome 152, 2026-09-15, and a fight holds twenty. */
const RANK_WIDTH_PIXELS = 22;
/**
 * What a row carries over its contents and not under, so its ink lands even. `develop ADR 0015`.
 */
const ROW_INK_DROP_PIXELS = 1;
const BAR_TINT = 0.55;
/**
 * Pure black, and only ever as a mask. A `mask-image` reads alpha and throws the hue away, so
 * this is not a colour anybody sees — it is the opaque end of a gradient, named because a raw hex
 * in a rule is a bug and an exception nobody can see the edge of is how the next one gets written.
 */
const MASK_INK: Colour = [0x00, 0x00, 0x00];
const HEADING_TINT = 0.85;
const CHANNEL_VALUE_MAXIMUM = 255;
/** The sRGB transfer function and the channel weights, as WCAG states them. */
const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722];
const LOW_CHANNEL = 0.03928;
const LOW_SLOPE = 12.92;
const CHANNEL_OFFSET = 0.055;
const CHANNEL_EXPONENT = 2.4;
const LUMINANCE_OFFSET = 0.05;

const VARIABLE_PREFIX = "--MargoMeter-";
const ROWS_BY_DEFAULT = 11;
const FONT_STACK = "system-ui, sans-serif";
const FONT_SIZE_PIXELS = 11;
/** Whole pixels: a fractional line box puts every box under it off the grid. `develop ADR 0015`. */
const LINE_HEIGHT_PIXELS = 15;
/** What a border costs the box it is on, at the one width this panel draws one. */
const RULE_WIDTH = 1;
const LINE_HEIGHT_TITLE_PIXELS = 13;
const FONT_BODY = `${FONT_SIZE_PIXELS}px/${LINE_HEIGHT_PIXELS}px ${FONT_STACK}`;
const FONT_TITLE = `${FONT_SIZE_PIXELS}px/${LINE_HEIGHT_TITLE_PIXELS}px ${FONT_STACK}`;

/**
 * A press that leaves text selected behind it is an accident, which is why the bar and the
 * strips refuse one too. Safari has never shipped `user-select` unprefixed
 * (`develop:docs/browser-support.md`), so both spellings stand.
 */
const NO_SELECTION = "-webkit-user-select:none;user-select:none;";

/**
 * **No production caller**: this and the two bar readings below are what hold `develop:DESIGN.md`'s
 * contrast floor, measured by `tests/ui/panel-look.test.ts` over the tokens and the palette.
 */
export function getContrastRatio(one: Colour, other: Colour): number {
    const bright = Math.max(getLuminance(one), getLuminance(other));
    const dim = Math.min(getLuminance(one), getLuminance(other));
    return (bright + LUMINANCE_OFFSET) / (dim + LUMINANCE_OFFSET);
}

function getLuminance(colour: Colour): number {
    let luminance = 0;
    for (const [at, channel] of colour.entries()) {
        const share = channel / CHANNEL_VALUE_MAXIMUM;
        const linear = share <= LOW_CHANNEL
            ? share / LOW_SLOPE
            : ((share + CHANNEL_OFFSET) / (1 + CHANNEL_OFFSET)) ** CHANNEL_EXPONENT;
        luminance += linear * (LUMINANCE_WEIGHTS[at] ?? 0);
    }
    return luminance;
}

/**
 * A bar drawn in its own track states its length and says nothing about whose it is.
 *
 * **Nothing draws a bar through this pair.** The shipped bar takes its hue from
 * `lookupColourForProfession` and its tint from the stylesheet, which spells
 * `opacity:var(--MargoMeter-bar-tint)` over the same `BAR_TINT`. What the two compute is the ink a
 * bar *would* take, which is the pair `develop:DESIGN.md` names as the proof that the tint keeps
 * every hue readable — see its text tokens, which own that decision.
 */
export function composeBarColour(hue: Colour): Colour {
    return composeColourOver(hue, SURFACE.track, BAR_TINT);
}

/** One colour over another at an alpha, in sRGB because that is what the browser does here. */
function composeColourOver(top: Colour, bottom: Colour, alpha: number): Colour {
    const share = clamp(alpha, 0, 1);
    return [
        composeColourOverChannel(top[0], bottom[0], share),
        composeColourOverChannel(top[1], bottom[1], share),
        composeColourOverChannel(top[2], bottom[2], share),
    ];
}

function composeColourOverChannel(above: number, below: number, share: number): number {
    return Math.round(share * above + (1 - share) * below);
}

export function getInkForBar(hue: Colour): Colour {
    const bar = composeBarColour(hue);
    const onDark = getContrastRatio(bar, TEXT.inkDark);
    const onLight = getContrastRatio(bar, TEXT.inkLight);
    if (onDark >= onLight) return TEXT.inkDark;
    return TEXT.inkLight;
}

/**
 * How tall a card of so many lines and runs stands: the lines times what a line costs, the air and
 * the rule each run spends over itself, and the padding and border the box reserves inside its own
 * height. Null where the counts handed in are no whole numbers.
 *
 * ⚠️ **One arithmetic, where there were two.** The sheet worked this out again from the counts the
 * draw wrote, which was enough while nothing else needed the number. The panel needs it now — a
 * card taller than the window is cut to the room there is rather than clipped
 * (`src/ui/panel-tip.ts`) — and a trim and a clamp at two heights would put the notice on a card
 * that fitted, or leave one that did not without it.
 */
export function getTipHeight(size: { lines: number; groups: number }): number | null {
    const line = LINE_HEIGHT_PIXELS;
    const air = SPACE_PIXELS.small;
    if (!Number.isSafeInteger(size.lines)) return null;
    if (!Number.isSafeInteger(size.groups)) return null;
    const runs = size.groups * (2 * air + RULE_WIDTH);
    return size.lines * line + runs + 2 * air + 2 * RULE_WIDTH;
}

/**
 * What a card has to stand in: the window, less the air the sheet keeps at either end of it. Null
 * where the page states no height, which is a window nothing here may reason about.
 */
export function getTipRoom(viewportHeight: number | null): number | null {
    if (viewportHeight === null) return null;
    if (!Number.isFinite(viewportHeight)) return null;
    const room = viewportHeight - 2 * PLACE.insetPixels;
    if (room <= 0) return null;
    return room;
}

export function composeStyleSheet(): string {
    return `${composeFrameRules()}${composeRegionRules()}${composeListRules()}` +
        `${composeRowRules()}${composeUnderListRules()}` +
        `${composeTipRules()}${composeStandingRules()}`;
}

/**
 * `all: initial` resets `display` too, so every region below states its own.
 *
 * The top edge is a custom property rather than a length, because `all: initial` resets every
 * property a page can set except a custom one — which is what lets a default declared here
 * survive the line above it, and what the panel is moved by.
 */
function composeFrameRules(): string {
    const ceiling = `min(calc(100vh - var(${VARIABLE_PREFIX}panel-top) - ${PLACE.insetPixels}px),` +
        `${PANEL_HEIGHT_VIEWPORT_PERCENT_MAXIMUM}vh)`;
    return `:host{all:initial;${composeVariables()}` +
        `${VARIABLE_PREFIX}panel-top:${PLACE.insetPixels}px;` +
        `position:fixed;top:var(${VARIABLE_PREFIX}panel-top);right:${PLACE.insetPixels}px;` +
        `z-index:${PLACE.layer};display:flex;flex-direction:column;` +
        `max-height:${ceiling};}` +
        `.${CLASS.title}{flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);` +
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}wide);` +
        `font:${FONT_TITLE};letter-spacing:0.06em;` +
        `color:var(${VARIABLE_PREFIX}quiet);` +
        // One line whatever the version says: no guard here lays anything out, so a wrap is
        // invisible to the gate.
        `white-space:nowrap;background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);border-bottom:none;` +
        `border-radius:var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius) 0 0;` +
        `box-sizing:border-box;width:${PLACE.widthPixels}px;` +
        `cursor:move;` +
        // Safari has never shipped `user-select` unprefixed, so without this a drag by the bar
        // selects the text under the cursor (`develop:docs/browser-support.md`).
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
        `.${CLASS.panel}{font:${FONT_BODY};width:${PLACE.widthPixels}px;` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}surface);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:0 0 var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius);` +
        `box-sizing:border-box;display:flex;flex-direction:column;min-height:0;}` +
        `.${CLASS.panel}>*{flex:none;}` +
        `.${CLASS.panel}>.${CLASS.list}{flex:0 1 auto;}` +
        `.${CLASS.slot}{display:none;}`;
}

function composeVariables(): string {
    const stated = [
        composeVariable("surface", formatColour(SURFACE.panel)),
        composeVariable("raised", formatColour(SURFACE.raised)),
        composeVariable("track", formatColour(SURFACE.track)),
        composeVariable("border", formatColour(SURFACE.border)),
        composeVariable("text", formatColour(TEXT.plain)),
        composeVariable("quiet", formatColour(TEXT.quiet)),
        composeVariable("suspect", formatColour(SIGNAL.suspect)),
        composeVariable("caveat", formatColour(SIGNAL.caveat)),
        composeVariable("defect", formatColour(SIGNAL.defect)),
        composeVariable("ours", formatColour(SIGNAL.ours)),
        composeVariable("theirs", formatColour(SIGNAL.theirs)),
        composeVariable("nobody", formatColour(SIGNAL.unknown)),
        composeVariable(
            "heading",
            formatRgbColour(composeColourOver(TEXT.quiet, SURFACE.panel, HEADING_TINT)),
        ),
        composeVariable("mask", formatColour(MASK_INK)),
        composeVariable("bar-tint", `${BAR_TINT}`),
        composeVariable("half", `${SPACE_PIXELS.half}px`),
        composeVariable("small", `${SPACE_PIXELS.small}px`),
        composeVariable("region-down", `${SPACE_PIXELS.regionDown}px`),
        composeVariable("region-across", `${SPACE_PIXELS.regionAcross}px`),
        composeVariable("wide", `${SPACE_PIXELS.wide}px`),
        composeVariable("row-height", `${SPACE_PIXELS.rowHeight}px`),
        composeVariable("radius", `${SHAPE.radiusPixels}px`),
        composeVariable("radius-small", `${SHAPE.radiusSmallPixels}px`),
    ].join("");
    return stated;
}

function composeVariable(name: string, value: string): string {
    return `${VARIABLE_PREFIX}${name}:${value};`;
}

/** The other spelling a rule takes, kept for the one colour this sheet composes rather than states. */
function formatRgbColour(colour: Colour): string {
    return `rgb(${colour[0]} ${colour[1]} ${colour[2]})`;
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
        `.${CLASS.strips}{display:flex;flex-wrap:wrap;gap:var(${VARIABLE_PREFIX}half);` +
        `padding:${region};padding-bottom:0;}` +
        `.${CLASS.strips}+.${CLASS.strips}{padding-top:var(${VARIABLE_PREFIX}radius-small);}` +
        `.${CLASS.stripsGap}{flex:1;}` +
        `.${CLASS.stripsLabel}{color:var(${VARIABLE_PREFIX}quiet);align-self:center;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.strip}{white-space:nowrap;padding:1px var(${VARIABLE_PREFIX}small);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);color:var(${VARIABLE_PREFIX}quiet);` +
        `background:transparent;cursor:pointer;` +
        `-webkit-user-select:none;user-select:none;}` +
        `.${CLASS.strip}.${CLASS.stripCurrent}{color:var(${VARIABLE_PREFIX}text);` +
        `background:var(${VARIABLE_PREFIX}raised);}` +
        `.${CLASS.crumb}{display:flex;gap:var(${VARIABLE_PREFIX}wide);align-items:baseline;` +
        `padding:${region};padding-bottom:0;}` +
        `.${CLASS.crumbBack}{cursor:pointer;color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.crumbBack}:hover{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.crumbHere}{font-weight:600;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}`;
}

/** The list's height is the rows it promises times what a row costs. `develop ADR 0014`. */
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
        // later in the tree, so without both the bars paint over the sticky heading. A figure is
        // one word and its cell never gives way; the words beside it are what shortens.
        // `develop:DESIGN.md` owns the rule, and every region that draws a figure wears this.
        `.${CLASS.figure}{flex:none;white-space:nowrap;}` +
        `.${CLASS.sectionWords}{min-width:0;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}` +
        `.${CLASS.section}{position:sticky;` +
        `top:calc(0px - var(${VARIABLE_PREFIX}region-down));z-index:1;` +
        `background:var(${VARIABLE_PREFIX}surface);display:flex;justify-content:space-between;` +
        `color:var(${VARIABLE_PREFIX}heading);letter-spacing:0.08em;font-size:10px;` +
        // Deliberately unequal, against develop ADR 0014's rule for every other region: the air
        // under a heading belongs to the rows it names.
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
        `.${CLASS.suspicions}{border-top:1px solid var(${VARIABLE_PREFIX}border);` +
        `padding-top:var(${VARIABLE_PREFIX}region-down);}` +
        `.${CLASS.suspicion}{color:var(${VARIABLE_PREFIX}suspect);` +
        `padding:0 var(${VARIABLE_PREFIX}region-across) var(${VARIABLE_PREFIX}region-down);}` +
        `.${CLASS.defects}{border-top:1px solid var(${VARIABLE_PREFIX}border);` +
        `padding-top:var(${VARIABLE_PREFIX}region-down);}` +
        `.${CLASS.defect}{color:var(${VARIABLE_PREFIX}defect);` +
        `padding:0 var(${VARIABLE_PREFIX}region-across) var(${VARIABLE_PREFIX}region-down);}`;
}

/**
 * What insets a region under its rows, less the margin its last row carries. `develop ADR 0014`.
 */
function composeInsetUnderRows(inset: string): string {
    const written = `calc(var(${inset}) - var(${VARIABLE_PREFIX}half))`;
    return written;
}

function composeRowRules(): string {
    const capRight = `var(${VARIABLE_PREFIX}radius-small)`;
    const cap = `${capRight} 0 0 ${capRight}`;
    return `.${CLASS.row}{position:relative;display:flex;justify-content:space-between;` +
        `align-items:center;box-sizing:border-box;height:var(${VARIABLE_PREFIX}row-height);` +
        `padding:${ROW_INK_DROP_PIXELS}px var(${VARIABLE_PREFIX}wide) 0;` +
        `margin-bottom:var(${VARIABLE_PREFIX}half);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);` +
        `background:var(${VARIABLE_PREFIX}track);overflow:hidden;` +
        `${NO_SELECTION}}` +
        `.${CLASS.row}.${CLASS.rowDrillable}{cursor:pointer;}` +
        `.${CLASS.row}.${CLASS.rowLeaf}{cursor:help;}` +
        `.${CLASS.bar}{position:absolute;left:0;top:0;bottom:0;` +
        `opacity:var(${VARIABLE_PREFIX}bar-tint);}` +
        `.${CLASS.barCap}{position:absolute;left:0;top:0;bottom:0;width:3px;` +
        `border-radius:${cap};}` +
        `.${CLASS.rowRank},.${CLASS.rowName},.${CLASS.rowValue}{position:relative;}` +
        `.${CLASS.rowRank}{color:var(${VARIABLE_PREFIX}quiet);` +
        `font-variant-numeric:tabular-nums;flex:none;box-sizing:border-box;` +
        `width:${RANK_WIDTH_PIXELS}px;text-align:right;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.rowTime}{color:var(${VARIABLE_PREFIX}quiet);` +
        `font-variant-numeric:tabular-nums;flex:none;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.rowName}{min-width:0;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;flex:1;}` +
        // Before the name and never in place of it: the name is the cell that shortens, and a mark
        // taking width from it every row would be the cost develop ADR 0023 refused. This one is
        // drawn on the rows a suspicion reaches, which is none of the rows in `develop:captures/`.
        `.${CLASS.rowSuspect}{position:relative;color:var(${VARIABLE_PREFIX}suspect);flex:none;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        // Beside the suspect mark and under the same argument: it reaches the row closing a damage
        // section and no other. A mark on every row was measured and refused: `develop:DESIGN.md`
        // has the share, `develop ADR 0089` the decision. The ring is drawn once for both places
        // it stands, below; margin and not padding, because the ring is this box's border.
        `.${CLASS.rowCaveat}{position:relative;` +
        `margin-right:var(${VARIABLE_PREFIX}small);}` +
        // Beside the suspect mark and under the same argument: it reaches the one row whose turn
        // the game is numbering, never every row. `develop:DESIGN.md` owns the rule,
        // `develop ADR 0066` the cost.
        `.${CLASS.rowTurn}{position:relative;color:var(${VARIABLE_PREFIX}quiet);flex:none;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        // The edge opposite the cap: the left three pixels are the profession's, and the open
        // row's inset shadow is on that side too. `develop ADR 0065`.
        `.${CLASS.rowSide}{position:absolute;right:0;top:0;bottom:0;width:2px;` +
        `border-radius:0 ${capRight} ${capRight} 0;background:currentColor;}` +
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
        // Worn by the row and not by the region under the list, because the rows that earn it stand
        // inside a section too: a sum a bound left undrawn stands there, and a solid bar on it
        // would read as a place in an order it holds none of. Which rows those are, and the figure
        // that earned them the accent, are `develop:DESIGN.md`'s — spelled there and not again
        // here, because the two copies of that figure had already drifted apart once (**C15**).
        `.${CLASS.row}.${CLASS.rowApart} .${CLASS.bar}{opacity:0.4;` +
        `mask-image:repeating-linear-gradient(` +
        `-45deg,var(${VARIABLE_PREFIX}mask) 0 4px,transparent 4px 8px);}` +
        `.${CLASS.row}.${CLASS.rowApart} .${CLASS.barCap}{opacity:0.7;}`;
}

/**
 * The two regions standing under the list, which wear one rule because they say one thing: what is
 * below the dashed line is outside it. The section carries a heading where the pinned rows do not,
 * so a reader meeting a figure belonging to nobody is told what it is before they read it.
 */
function composeUnderListRules(): string {
    const inset = composeInsetUnderRows(VARIABLE_PREFIX + "region-down");
    const shape = `margin:0 var(${VARIABLE_PREFIX}region-across);` +
        `padding:var(${VARIABLE_PREFIX}region-down) 0 ${inset};` +
        `border-top:1px dashed var(${VARIABLE_PREFIX}border);overflow:hidden;`;
    return `.${CLASS.pinned}{${shape}}` + `.${CLASS.outside}{${shape}}`;
}

function composeTipRules(): string {
    // Where a card stands before any window has been moved: against the panel's own corner. It is
    // a distance from the **right** edge, and every placement across is, because a card narrower
    // than the bound has to keep the edge facing its window and not float the difference away.
    const right =
        `var(${VARIABLE_PREFIX}tip-right,calc(${PLACE.insetPixels}px + ${PLACE.widthPixels}px + ` +
        `${SPACE_PIXELS.small}px))`;
    return `.${CLASS.tip}{position:fixed;box-sizing:border-box;pointer-events:none;` +
        `left:var(${VARIABLE_PREFIX}tip-left,auto);right:${right};` +
        `top:${composeTipTop()};z-index:${LAYER.tip};` +
        // As wide as what it says, up to the bound — and never wider than the screen it stands
        // on, which is the case the bound on its own does not answer.
        `width:max-content;` +
        `max-width:min(${TIP.widthPixelsMaximum}px,` +
        `calc(100vw - ${PLACE.insetPixels}px - ${PLACE.insetPixels}px));` +
        // A card taller than the screen has no position showing all of it, and the clamp keeps
        // the top edge over the bottom.
        `max-height:calc(100vh - ${PLACE.insetPixels}px - ${PLACE.insetPixels}px);` +
        `overflow:hidden;` +
        `padding:var(${VARIABLE_PREFIX}small);` +
        `font:${FONT_BODY};` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius);box-shadow:${SHAPE.windowShadow};}` +
        `.${CLASS.tipHidden}{display:none;}` +
        // The one cell on this panel that folds rather than shortening: it is the answer to
        // the name a row had to cut, and an answer cut again is no answer (`develop:DESIGN.md`).
        // `break-word` and not `break-all`, which splits a word where a space was free, nor
        // `anywhere`, which shrinks the min-content width the card is laid out against
        // (`develop ADR 0091`). ⚠️ The lines it folds to are counted in `src/ui/panel-tip.ts`, and
        // a rule folding here while the count reserves one line is a card off the screen.
        `.${CLASS.tipName}{font-weight:600;overflow-wrap:break-word;}` +
        `.${CLASS.tipSubtitle}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.tipGroup}{margin-top:var(${VARIABLE_PREFIX}small);` +
        `padding-top:var(${VARIABLE_PREFIX}small);` +
        `border-top:1px solid var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.tipLine}{display:flex;justify-content:space-between;` +
        `gap:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.tipLine}.${CLASS.tipStrong}{font-weight:600;}` +
        `.${CLASS.tipLine}.${CLASS.tipSub}{padding-left:var(${VARIABLE_PREFIX}wide);}` +
        // Cut rather than wrapped, because a label that folded would stand the card wrong —
        // `LABEL_CHARACTERS_MAXIMUM` in `src/ui/panel-words.ts` is where that arithmetic is.
        // `flex:1` and not `auto`: the mark a caveated figure wears sits between this and the
        // value, and a label at its natural width leaves it stranded mid-line, beside the words
        // rather than beside the figure it is about (`develop:DESIGN.md`). Grown, the label pushes
        // the mark against the value wherever the label is short.
        `.${CLASS.tipLabel}{color:var(${VARIABLE_PREFIX}quiet);flex:1;min-width:0;` +
        `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.tipValue}{font-variant-numeric:tabular-nums;flex:none;}` +
        composeCaveatMarkRule() +
        // The same letters a cut's heading wears down the panel, so a run of parts under one
        // reads as the same kind of thing in both places. `develop:DESIGN.md` owns the look.
        `.${CLASS.tipHeading}{color:var(${VARIABLE_PREFIX}heading);letter-spacing:0.08em;` +
        `font-size:10px;text-transform:uppercase;overflow:hidden;` +
        `text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.tipNote}{color:var(${VARIABLE_PREFIX}quiet);}` +
        // The sentence is this box's own text and the ring is a child appended after it, so the
        // sheet is what stands the ring first: `order` over a flex row. It buys the hanging indent
        // as well — a sentence running to a second line aligns under its own first word rather
        // than under the ring.
        `.${CLASS.tipNote}.${CLASS.tipCaveatNote}{display:flex;align-items:flex-start;` +
        `gap:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.tipNote} .${CLASS.tipCaveat}{order:-1;align-self:flex-start;` +
        // Onto the optical centre of the first line: a 15px line box less a 10px ring, halved.
        `margin-top:${MARK_DROP_PIXELS}px;}` +
        `.${CLASS.tipNote}.${CLASS.tipSuspect}{color:var(${VARIABLE_PREFIX}suspect);}` +
        `.${CLASS.tipNote}.${CLASS.tipCaveatNote}{color:var(${VARIABLE_PREFIX}caveat);}`;
}

function composeTipTop(): string {
    return `clamp(${PLACE.insetPixels}px,var(${VARIABLE_PREFIX}tip-top,${PLACE.insetPixels}px),` +
        `calc(100vh - var(${VARIABLE_PREFIX}tip-height,0px) - ${PLACE.insetPixels}px))`;
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
/**
 * The caveat mark, **drawn and not spelled**, in the one rule both places it stands read from.
 *
 * ⚠️ **No font can be relied on for this shape.** Measured in Chrome 152 on 2026-09-15: `ⓘ` comes
 * to 5.5px against 8.67 for `O` at the panel's own 11px. No family this machine offers carries
 * U+24D8, so every one falls back to a single condensed face, and `develop ADR 0092` carries that
 * sweep and the nine it was taken over. A ring with a border is a circle wherever the panel is
 * opened, which a codepoint is not.
 *
 * `align-self` because both parents are flex rows that stretch a child by default, and a ring
 * stretched to the line box is the ellipse this rule exists to stop being.
 */
function composeCaveatMarkRule(): string {
    return `.${CLASS.rowCaveat},.${CLASS.tipCaveat}{box-sizing:border-box;display:inline-flex;` +
        `align-items:center;justify-content:center;align-self:center;flex:none;` +
        `width:${MARK_SIZE_PIXELS}px;height:${MARK_SIZE_PIXELS}px;` +
        // An ink of its own, as the other three severities have: drawn in the label's colour it was
        // invisible against the label it qualifies. `develop:DESIGN.md` owns the rule and carries
        // the measured distance to every other hue the panel spends.
        `color:var(${VARIABLE_PREFIX}caveat);` +
        `border:1px solid currentColor;border-radius:50%;` +
        // The letter inside the ring, and it is the only type on the panel below the body size:
        // an `i` at the body's own 11px leaves no ring to draw around it. Seven is the largest
        // that leaves the ring untouched: at eight the stem meets it at the top.
        `font-size:7px;font-weight:600;font-style:normal;line-height:1;}`;
}

/**
 * The second window under the one root. It states its own type and its own ink for the reason the
 * card does — `:host{all:initial}` reaches it and `.panel`'s rules never do — and it is
 * `position:fixed` for the same reason too: the host is a flex column 260px wide, and a plain
 * child of it would stand inside that column and ride the panel's own drag.
 *
 * ⚠️ **Positioned, and deliberately so.** A positioned element paints over a static one whatever
 * the tree order, so a window laid out any other way could cover a control of the panel's and
 * take its press. The layer is stated rather than left to chance.
 */
function composeStandingRules(): string {
    const top =
        `clamp(${PLACE.insetPixels}px,var(${VARIABLE_PREFIX}standing-top,${PLACE.insetPixels}px),` +
        `calc(100vh - ${PLACE.insetPixels}px))`;
    const left = `var(${VARIABLE_PREFIX}standing-left,calc(100vw - ${PLACE.insetPixels}px - ` +
        `${PLACE.widthPixels}px - ${STANDING.widthPixels}px - ${SPACE_PIXELS.small}px))`;
    return `.${CLASS.standing}{position:fixed;box-sizing:border-box;` +
        `left:${left};top:${top};z-index:${LAYER.standing};` +
        `width:${STANDING.widthPixels}px;display:flex;flex-direction:column;` +
        `max-height:calc(100vh - ${PLACE.insetPixels}px - ${PLACE.insetPixels}px);` +
        `font:${FONT_BODY};` +
        `color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.standingBar}{flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);` +
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}wide);` +
        `font:${FONT_TITLE};letter-spacing:0.06em;` +
        `color:var(${VARIABLE_PREFIX}quiet);white-space:nowrap;` +
        `background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);border-bottom:none;` +
        `border-radius:var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius) 0 0;` +
        `cursor:move;-webkit-user-select:none;user-select:none;touch-action:none;}` +
        `.${CLASS.standingBar} .${CLASS.control}{margin-left:auto;}` +
        `.${CLASS.standingBody}{min-height:0;overflow-y:auto;overflow-x:hidden;` +
        `overscroll-behavior:contain;scrollbar-width:none;` +
        `padding:var(${VARIABLE_PREFIX}region-down) var(${VARIABLE_PREFIX}region-across);` +
        `padding-bottom:calc(var(${VARIABLE_PREFIX}region-down) - ` +
        `var(${VARIABLE_PREFIX}half));` +
        `background:var(${VARIABLE_PREFIX}surface);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:0 0 var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius);}` +
        `.${CLASS.standing}.${CLASS.standingFolded} .${CLASS.standingBody}{display:none;}` +
        `.${CLASS.standingUnder}{margin-left:var(${VARIABLE_PREFIX}wide);}` +
        // ⚠️ **Three cells on one row, and the order they give way in is stated here rather than
        // left to the panel's own rule.** That rule gives a row's name `flex:1`, which is basis
        // `0` — the name takes what is left rather than what it needs — and measured in Chrome on
        // 2026-09-18 it drew `Gracz 4` at 3px of the 42 it wanted, because the okrzyk beside it
        // had claimed the row's width as its basis first. A nickname cut to `Gracz…` has lost the
        // digit that tells two players apart, which is the whole of what a name is for here.
        //
        // So on this row the name is sized by its own text and the **cast** takes what is left:
        // cutting the okrzyk costs less, because the two spellings differ in their first word —
        // `Prowokujący okrzyk` against `Wyzywający okrzyk` — so a clipped end still tells them
        // apart. The name keeps its shrink, so a nickname too long for the row still folds rather
        // than running off it. Scoped to the row that carries a cast, because every other row in
        // this window has two cells and wants the panel's rule (`develop ADR 0097`).
        `.${CLASS.standingHolding} .${CLASS.rowName}{flex:0 1 auto;}` +
        `.${CLASS.standingCast}{color:var(${VARIABLE_PREFIX}quiet);flex:1 1 0;` +
        `min-width:min(${CAST_WIDTH_PIXELS_MINIMUM}px,100%);` +
        `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;` +
        `padding-left:var(${VARIABLE_PREFIX}small);}` +
        // One dot per turn of the charge, which is how the game's own bar is cut: it draws
        // `total_turns - 1` dividers across it (build `Cl9U89Zr`, read 2026-09-09). Nothing
        // else in the panel is round, so the shape means this and nothing else.
        `.${CLASS.standingPips}{position:relative;flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}half);padding-left:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.standingPip}{width:${PIP_SIZE_PIXELS}px;height:${PIP_SIZE_PIXELS}px;` +
        `border-radius:50%;` +
        `flex:none;background:var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.standingPip}.${CLASS.standingPipLit}{background:currentColor;}`;
}
