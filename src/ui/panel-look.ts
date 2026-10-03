/**
 * The panel's tokens, the classes its rules select, and the stylesheet built out of both.
 *
 * A class is spelled here and imported by the file that wears it: when two spellings drift the
 * failure is an unstyled row rather than anything a compiler sees.
 *
 * `DESIGN.md` owns what these values are for; this file owns what they are.
 */

import { clampNumber } from "#/libs/number-range.ts";
import {
    PANEL_WINDOW,
    type PanelWindow,
    TYPE_STEP,
    TYPE_STEPS,
    type TypeStep,
} from "./panel-choice.ts";
import { type Colour, formatColour, SIGNAL } from "./panel-palette.ts";

/**
 * What follows the type: every length the sheet and the panel spend that a step of type moves.
 * Each step is its own row of measurements, never another row scaled (ADR 0013): a ring of nine
 * pixels carries no letter although the ratio says it would (`develop ADR 0092`).
 */
export interface TypeTokens {
    fontPixels: number;
    /**
     * Whole pixels: a fractional line box puts every box under it off the grid. `develop ADR 0015`.
     */
    lineHeightPixels: number;
    lineHeightTitlePixels: number;
    /** The one smaller type: the version, the place, an outcome, a section's heading. */
    fontSmallPixels: number;
    /** What a row carries over its line, less the drop, is even: its ink lands mid-row. */
    rowHeightPixels: number;
    /** Two digits and a stop, and a fight holds twenty. */
    rankWidthPixels: number;
    /** A dot small enough that four of them and a figure fit the window's own width. */
    pipSizePixels: number;
    /**
     * The least an okrzyk's name is drawn at, so a long nickname on the same row cannot erase it:
     * the two okrzyki differ from their first letter, so this shows enough of either to say which.
     */
    castWidthPixelsMinimum: number;
    /** The caveat mark's ring, across and down, and the letter inside it. */
    markSizePixels: number;
    markLetterPixels: number;
    meterWidthPixels: number;
    /**
     * How wide a card may stand — **a maximum and not a width**. The card is drawn at `max-content`
     * and this clamps it, so one saying two words is as wide as two words, and a ranking card fills
     * the bound. What that was measured to cost is `develop ADR 0091`'s, and the widths a browser
     * really draws are `tests/e2e/panel-card.spec.ts`'s.
     */
    cardWidthPixelsMaximum: number;
    /**
     * The window beside the panel. Narrower than the panel because it carries a name and a figure
     * and never a rank or a share, and it is the second thing standing over somebody else's game.
     */
    helperWidthPixels: number;
}

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
    /** The first control on the bar, which pushes every control after it to the far end. */
    controlLead: "titlebar-lead",
    frame: "MargoMeter-body",
    folded: "folded",
    meter: "meter",
    slot: "slot",
    header: "header",
    headerLine: "header-line",
    headerPlace: "header-place",
    headerPlaceName: "header-place-name",
    headerPlaceTile: "header-place-tile",
    headerOutcome: "header-outcome",
    strips: "strips",
    stripsGap: "strips-gap",
    strip: "strip",
    stripCurrent: "selected",
    crumb: "crumb",
    crumbBack: "crumb-back",
    crumbHere: "crumb-here",
    /** One question of the options: a heading, then its answers in the shape they need. */
    optionsQuestion: "options-question",
    optionsHeading: "options-heading",
    optionsSteps: "options-steps",
    optionsStep: "options-step",
    optionsWindow: "options-window",
    optionsWindowName: "options-window-name",
    optionsWindowState: "options-window-state",
    optionsWindowOwn: "options-window-own",
    optionsReset: "options-reset",
    optionsAnswer: "options-answer",
    optionsMeaning: "options-meaning",
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
    card: "MargoMeter-card",
    cardHidden: "card-hidden",
    /** A card too tall for the window in one column, drawn in two (ADR 0033). */
    cardWide: "card-wide",
    cardColumns: "card-columns",
    cardColumn: "card-column",
    cardName: "card-name",
    cardSubtitle: "card-subtitle",
    cardGroup: "card-group",
    cardHeading: "card-heading",
    cardLine: "card-line",
    cardStrong: "card-strong",
    cardSub: "card-sub",
    cardLabel: "card-label",
    cardCaveat: "card-caveat",
    cardValue: "card-value",
    /** A sentence rather than a column, so the placement counts it as wrapping. */
    cardNote: "card-note",
    cardSuspect: "card-suspect",
    /** The sentence's own, and never `cardCaveat` — that one is the glyph cell beside a figure. */
    cardCaveatNote: "card-caveat-note",
    /** The helper: its own bar, its own body, and the rows under each heading. */
    helper: "MargoMeter-helper",
    helperBar: "helper-bar",
    helperBody: "helper-body",
    helperFolded: "helper-folded",
    /** A row nested under the one above it, whoever stands in either. */
    helperUnder: "helper-under",
    /** The okrzyk a holder is holding somebody with, drawn on their row (`develop ADR 0097`). */
    helperCast: "helper-cast",
    /** The row that carries one, which is the only row where the name gives way last. */
    helperHolding: "helper-holding",
    helperPips: "helper-pips",
    helperPip: "helper-pip",
    helperPipLit: "helper-pip-lit",
    /** The corner a window is sized by, in either window (ADR 0013). */
    sizeGrip: "size-grip",
} as const;

export const SPACE_PIXELS = {
    half: 2,
    small: 4,
    regionDown: 5,
    regionAcross: 7,
    wide: 8,
} as const;
/** The tallest the meter stands, as a share of the browser window's height. */
export const METER_HEIGHT_VIEWPORT_PERCENT_MAXIMUM = 66;

export const PLACE = {
    insetPixels: 8,
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
    helper: "2",
    card: "3",
} as const;

/**
 * One row per step. The small one is the size the panel shipped at, and every figure in it was
 * measured in Chrome 152: the rank cell's `20.` at 17.50px on 2026-09-15; the cast floor on
 * 2026-09-18, where `Wyzywa` is 49px and `Prowok` 44px, and a 25-character nickname left a cast
 * with no floor 4px; the ring on 2026-09-15, where a smaller one reads as a speck beside a figure
 * and nine carries no letter at all, and seven is the largest letter that leaves it untouched.
 *
 * The other two were measured in Chrome 154 on 2026-09-28 through this sheet, the method first
 * reproducing the small row: `20.` at 17.50px, 19.09 and 20.69, each cell that plus its 4px of air
 * and rounded up; `Wyzywa` at 49.33px and 53.44, each floor the whole word (the same Chrome reads
 * it 45.22px at the small step, against the 49 above); and the largest letter whose ink stands a
 * clear pixel inside the ring, which is seven in a ring of ten and eight meets it — the small row
 * again — and seven in a ring of twelve at both. A ring of eleven holds only six: an odd ring sets
 * the letter off the half pixel. The widest step's panel is `596f95f`'s. The middle one's bar asks
 * 270px for the name, `0.20.0-dev` and four controls on one line, where the small bar holds them
 * in its 258 and the widest in its 304; the panel is 274 because at 272 `Zwykły cios` behind a
 * caveat mark was drawn in 69.25px of the 70 it needs (Chrome 154, 2026-09-29, the browser suite's
 * recording).
 */
export const TYPE_TOKENS: { readonly [Step in TypeStep]: TypeTokens } = {
    [TYPE_STEP.small]: {
        fontPixels: 11,
        lineHeightPixels: 15,
        lineHeightTitlePixels: 13,
        fontSmallPixels: 10,
        rowHeightPixels: 18,
        rankWidthPixels: 22,
        pipSizePixels: 5,
        castWidthPixelsMinimum: 48,
        markSizePixels: 10,
        markLetterPixels: 7,
        meterWidthPixels: 260,
        cardWidthPixelsMaximum: 250,
        helperWidthPixels: 210,
    },
    [TYPE_STEP.medium]: {
        fontPixels: 12,
        lineHeightPixels: 16,
        lineHeightTitlePixels: 14,
        fontSmallPixels: 11,
        rowHeightPixels: 19,
        rankWidthPixels: 24,
        pipSizePixels: 5,
        castWidthPixelsMinimum: 50,
        markSizePixels: 12,
        markLetterPixels: 7,
        meterWidthPixels: 274,
        cardWidthPixelsMaximum: 272,
        helperWidthPixels: 228,
    },
    [TYPE_STEP.large]: {
        fontPixels: 13,
        lineHeightPixels: 18,
        lineHeightTitlePixels: 15,
        fontSmallPixels: 12,
        rowHeightPixels: 21,
        rankWidthPixels: 25,
        pipSizePixels: 6,
        castWidthPixelsMinimum: 54,
        markSizePixels: 12,
        markLetterPixels: 7,
        meterWidthPixels: 306,
        cardWidthPixelsMaximum: 296,
        helperWidthPixels: 248,
    },
};

export const SHAPE = {
    radiusPixels: 8,
    radiusSmallPixels: 3,
    windowShadow: "0 6px 20px rgb(0 0 0 / 55%)",
} as const;

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
/** What a border costs the box it is on, at the one width this panel draws one. */
const RULE_WIDTH = 1;
/**
 * The corner a window is sized by, drawn inside the window's own corner. Inside, because a box
 * standing past the window is overflow the window then reports, measured in Chrome 154 on
 * 2026-09-28; and at twelve it covers the air under the sides' figures at the panel's foot, and in
 * the window beside it the stripe and the air at the side of the last row, and no figure.
 */
export const SIZE_GRIP = {
    sizePixels: 12,
} as const;
/**
 * What a sized meter states beside its size, and what the sheet reads to lay it out that way: its
 * list starts from nothing and keeps a few rows, and its ceiling is the browser window's alone.
 */
const SIZED_METER_VARIABLES = {
    listBasis: "--MargoMeter-list-basis",
    listRowsLeast: "--MargoMeter-list-rows-least",
    share: "--MargoMeter-meter-share",
} as const;
const LIST_ROWS_SIZED_MINIMUM = 3;

/** Where a window's size is written, on the window, and read by the sheet with a fallback. */
export const SIZE_VARIABLES: {
    readonly [Window in PanelWindow]: { readonly width: string; readonly height: string };
} = {
    [PANEL_WINDOW.meter]: {
        width: "--MargoMeter-meter-width",
        height: "--MargoMeter-meter-height",
    },
    [PANEL_WINDOW.helper]: {
        width: "--MargoMeter-helper-width",
        height: "--MargoMeter-helper-height",
    },
};
/** Where a window's top is written. One each: a shared one has the second move the first's top. */
export const TOP_VARIABLES: { readonly [Window in PanelWindow]: string } = {
    [PANEL_WINDOW.meter]: "--MargoMeter-meter-top",
    [PANEL_WINDOW.helper]: "--MargoMeter-helper-top",
};
/** How many rows a list stands, written on the list. */
export const ROWS_VARIABLE = "--MargoMeter-rows";
/** Where a card is placed, written on the card, which is the one kind the reset leaves standing. */
export const CARD_VARIABLES = {
    top: "--MargoMeter-card-top",
    left: "--MargoMeter-card-left",
    right: "--MargoMeter-card-right",
    height: "--MargoMeter-card-height",
} as const;

/**
 * A press that leaves text selected behind it is an accident, which is why the bar and the
 * strips refuse one too. Safari has never shipped `user-select` unprefixed
 * (`docs/browser-support.md`), so both spellings stand.
 */
const NO_SELECTION = "-webkit-user-select:none;user-select:none;";

/**
 * **No production caller**: this and the two bar readings below are what hold `DESIGN.md`'s
 * contrast floor, measured by `tests/ui/panel-look.test.ts` over the tokens and the palette.
 */
export function getContrastRatio(ink: Colour, ground: Colour): number {
    const bright = Math.max(getLuminance(ink), getLuminance(ground));
    const dim = Math.min(getLuminance(ink), getLuminance(ground));
    return (bright + LUMINANCE_OFFSET) / (dim + LUMINANCE_OFFSET);
}

function getLuminance(colour: Colour): number {
    let luminance = 0;
    for (const [channelIndex, channel] of colour.entries()) {
        const share = channel / CHANNEL_VALUE_MAXIMUM;
        const linear = share <= LOW_CHANNEL
            ? share / LOW_SLOPE
            : ((share + CHANNEL_OFFSET) / (1 + CHANNEL_OFFSET)) ** CHANNEL_EXPONENT;
        luminance += linear * (LUMINANCE_WEIGHTS[channelIndex] ?? 0);
    }
    return luminance;
}

/**
 * A bar drawn in its own track states its length and says nothing about whose it is.
 *
 * **Nothing draws a bar through this pair.** The shipped bar takes its hue from
 * `lookupColourForProfession` and its tint from the stylesheet, which spells
 * `opacity:var(--MargoMeter-bar-tint)` over the same `BAR_TINT`. What the two compute is the ink a
 * bar *would* take, which is the pair `DESIGN.md` names as the proof that the tint keeps
 * every hue readable — see its text tokens, which own that decision.
 */
export function composeBarColour(hue: Colour): Colour {
    return composeColourOver(hue, SURFACE.track, BAR_TINT);
}

/** One colour over another at an alpha, in sRGB because that is what the browser does here. */
function composeColourOver(top: Colour, bottom: Colour, alpha: number): Colour {
    const share = clampNumber(alpha, 0, 1);
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
 * (`src/ui/panel-element.ts`) — and a trim and a clamp at two heights would put the notice on a
 * card that fitted, or leave one that did not without it.
 */
export function getCardHeight(
    size: { lines: number; groups: number },
    tokens: TypeTokens,
): number | null {
    const line = tokens.lineHeightPixels;
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
/**
 * The widest a card of so many columns may stand: the bound for each, and the air between them. One
 * number for the sheet that draws it and the placement that decides its side, because two
 * spellings of the bound drifted once already (`src/ui/panel-element.ts`).
 */
export function getCardWidthForColumns(tokens: TypeTokens, columns: number): number {
    const counted = Number.isSafeInteger(columns) ? Math.max(1, columns) : 1;
    return counted * tokens.cardWidthPixelsMaximum + (counted - 1) * SPACE_PIXELS.small;
}

export function getCardHeightAvailable(viewportHeight: number | null): number | null {
    if (viewportHeight === null) return null;
    if (!Number.isFinite(viewportHeight)) return null;
    const room = viewportHeight - 2 * PLACE.insetPixels;
    if (room <= 0) return null;
    return room;
}

/** The properties a panel states once a reader sized it, written beside the size itself. */
export function composeSizedPanelStyle(): string {
    const { listBasis, listRowsLeast, share } = SIZED_METER_VARIABLES;
    return `${listBasis}:0px;${listRowsLeast}:${LIST_ROWS_SIZED_MINIMUM};${share}:100vh`;
}

/**
 * How tall a window's bar stands: its line, the rules its controls carry over and under it — a
 * control is the tallest thing on the bar — the air over and under that, and the bar's top rule.
 */
export function getBarHeight(tokens: TypeTokens): number {
    const control = tokens.lineHeightTitlePixels + 2 * RULE_WIDTH;
    return control + 2 * SPACE_PIXELS.small + RULE_WIDTH;
}

/** The class a step of type wears in the options, so each is written in the size it gives. */
export function composeOptionsStepClass(step: TypeStep): string {
    return `${CLASS.optionsStep}-${step}`;
}

export function composeStyleSheet(step: TypeStep): string {
    const tokens = TYPE_TOKENS[step];
    return `${composeFrameRules(tokens)}${composeRegionRules(tokens)}` +
        `${composeOptionsRules(tokens)}` +
        `${composeListRules(tokens)}${composeRowRules(tokens)}${composeUnderListRules()}` +
        `${composeCardRules(tokens)}${composeHelperRules(tokens)}`;
}

/**
 * `all: initial` resets `display` too, so every region below states its own.
 *
 * The top edge is a custom property rather than a length, because `all: initial` resets every
 * property a page can set except a custom one — which is what lets a default declared here
 * survive the line above it, and what the panel is moved by.
 */
function composeFrameRules(tokens: TypeTokens): string {
    // The share binds a meter nobody sized; a sized one, the browser window alone (ADR 0013).
    const share = `var(${SIZED_METER_VARIABLES.share},${METER_HEIGHT_VIEWPORT_PERCENT_MAXIMUM}vh)`;
    const ceiling = `min(calc(100vh - var(${TOP_VARIABLES.meter}) - ${PLACE.insetPixels}px),` +
        `${share})`;
    const width = `var(${SIZE_VARIABLES.meter.width},${tokens.meterWidthPixels}px)`;
    return `:host{all:initial;${composeVariables(tokens)}` +
        `${TOP_VARIABLES.meter}:${PLACE.insetPixels}px;` +
        `position:fixed;top:var(${TOP_VARIABLES.meter});right:${PLACE.insetPixels}px;` +
        `z-index:${PLACE.layer};display:flex;flex-direction:column;` +
        `max-height:${ceiling};}` +
        `.${CLASS.title}{flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);` +
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}wide);` +
        `font:${composeFontTitle(tokens)};letter-spacing:0.06em;` +
        `color:var(${VARIABLE_PREFIX}quiet);` +
        // One line whatever the version says: no guard here lays anything out, so a wrap is
        // invisible to the gate.
        `white-space:nowrap;background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);border-bottom:none;` +
        `border-radius:var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius) 0 0;` +
        `box-sizing:border-box;width:${width};` +
        `cursor:move;` +
        // Safari has never shipped `user-select` unprefixed, so without this a drag by the bar
        // selects the text under the cursor (`docs/browser-support.md`).
        `-webkit-user-select:none;user-select:none;touch-action:none;}` +
        // Every width in `TYPE_TOKENS` is a bar measured in one font, and a reader's may ask more:
        // on CI's Ubuntu runner on 2026-09-29 the middle step's bar asked 0.44px past its width and
        // pushed the fold off it.
        // The version is what gives way, because a control cut off is one a reader cannot press.
        `.${CLASS.titleVersion}{opacity:0.7;font-size:${tokens.fontSmallPixels}px;` +
        `min-width:0;overflow:hidden;text-overflow:ellipsis;}` +
        `.${CLASS.control}{padding:0 var(${VARIABLE_PREFIX}small);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius);` +
        `color:var(${VARIABLE_PREFIX}quiet);background:var(${VARIABLE_PREFIX}surface);` +
        `cursor:pointer;}` +
        `.${CLASS.control}:hover{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.controlLead}{margin-left:auto;}` +
        // A flex item whose overflow is visible refuses to shrink below its own content, so
        // without `min-height:0` the ceiling on the host stops here and never reaches the list.
        `.${CLASS.frame}{display:flex;flex-direction:column;min-height:0;}` +
        // Two classes in the selector, so the outcome does not depend on where the rule is
        // written: a bare `.folded` ties with the region's own rule and loses on source order.
        `.${CLASS.frame}.${CLASS.folded}{display:none;}` +
        `.${CLASS.meter}{font:${composeFontBody(tokens)};width:${width};position:relative;` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}surface);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:0 0 var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius);` +
        // As tall as a reader made it **at least**: a height is a floor and never a box, because the
        // regions over and under the list do not give way, and a panel shorter than they are drew
        // them past its own foot with no ground under them.
        `box-sizing:border-box;display:flex;flex-direction:column;` +
        `min-height:var(${SIZE_VARIABLES.meter.height},0);}` +
        `.${CLASS.meter}>*{flex:none;}` +
        // In a sized panel the list takes the room the rest leave it, and never fewer than a few
        // rows; in one nobody sized it is as tall as the rows it promises, and there is no room.
        `.${CLASS.meter}>.${CLASS.list}{flex:1 1 var(${SIZED_METER_VARIABLES.listBasis},auto);` +
        `min-height:calc(var(${SIZED_METER_VARIABLES.listRowsLeast},0) * ` +
        `(var(${VARIABLE_PREFIX}row-height) + var(${VARIABLE_PREFIX}half)));}` +
        `.${CLASS.slot}{display:none;}`;
}

function composeFontBody(tokens: TypeTokens): string {
    return `${tokens.fontPixels}px/${tokens.lineHeightPixels}px ${FONT_STACK}`;
}

function composeFontTitle(tokens: TypeTokens): string {
    return `${tokens.fontPixels}px/${tokens.lineHeightTitlePixels}px ${FONT_STACK}`;
}

function composeVariables(tokens: TypeTokens): string {
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
        composeVariable("row-height", `${tokens.rowHeightPixels}px`),
        composeVariable("radius", `${SHAPE.radiusPixels}px`),
        composeVariable("radius-small", `${SHAPE.radiusSmallPixels}px`),
    ].join("");
    return stated;
}

function composeVariable(name: string, variableValue: string): string {
    return `${VARIABLE_PREFIX}${name}:${variableValue};`;
}

/**
 * The other spelling a rule takes, kept for the one colour this sheet composes rather than states.
 */
function formatRgbColour(colour: Colour): string {
    return `rgb(${colour[0]} ${colour[1]} ${colour[2]})`;
}

function composeRegionRules(tokens: TypeTokens): string {
    const region = `var(${VARIABLE_PREFIX}region-down) var(${VARIABLE_PREFIX}region-across)`;
    return `.${CLASS.header}{display:block;padding:${region};padding-bottom:0;}` +
        // One line holds what the fight was and where, and only the map's name gives way on it
        // (ADR 0014): the headcount and the outcome keep their width, the tile keeps its own.
        `.${CLASS.headerLine}{display:flex;align-items:baseline;gap:var(${VARIABLE_PREFIX}wide);}` +
        `.${CLASS.headerLine}>*{flex:none;}` +
        `.${CLASS.headerPlace}{flex:1 1 auto;min-width:0;display:flex;justify-content:flex-end;` +
        `color:var(${VARIABLE_PREFIX}quiet);font-size:${tokens.fontSmallPixels}px;` +
        `white-space:nowrap;}` +
        // `pre` keeps the space the tile opens with, which a line starting a box would drop.
        `.${CLASS.headerPlaceName}{overflow:hidden;text-overflow:ellipsis;}` +
        `.${CLASS.headerPlaceTile}{white-space:pre;}` +
        // The upper case belongs to this rule rather than to a word: the shelf says the same
        // word a row at a time, in the case it was composed in.
        `.${CLASS.headerOutcome}{color:var(${VARIABLE_PREFIX}quiet);text-transform:uppercase;` +
        `font-size:${tokens.fontSmallPixels}px;}` +
        `.${CLASS.strips}{display:flex;flex-wrap:wrap;gap:var(${VARIABLE_PREFIX}half);` +
        `padding:${region};padding-bottom:0;}` +
        `.${CLASS.strips}+.${CLASS.strips}{padding-top:var(${VARIABLE_PREFIX}radius-small);}` +
        `.${CLASS.stripsGap}{flex:1;}` +
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

/**
 * Each question of the options under a heading lettered as a section of the list is, and its
 * answers in the shape they need (ADR 0015): the three steps of type side by side, each in its
 * own size; a line per window; a row per place a shelf is kept, since those words are too long to
 * stand three abreast at the small step. The answer taken is marked by more than colour.
 */
function composeOptionsRules(tokens: TypeTokens): string {
    const chosen = CLASS.stripCurrent;
    const stepSizes = TYPE_STEPS.map((step) =>
        `.${composeOptionsStepClass(step)}{font-size:${TYPE_TOKENS[step].fontPixels}px;}`
    ).join("");
    return `.${CLASS.optionsQuestion}{padding:var(${VARIABLE_PREFIX}wide) ` +
        `var(${VARIABLE_PREFIX}region-across) 0;}` +
        `.${CLASS.optionsHeading}{color:var(${VARIABLE_PREFIX}heading);letter-spacing:0.08em;` +
        `font-size:${tokens.fontSmallPixels}px;text-transform:uppercase;}` +
        `.${CLASS.optionsSteps}{display:flex;margin-top:var(${VARIABLE_PREFIX}half);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);overflow:hidden;}` +
        `.${CLASS.optionsStep}{flex:1 1 0;height:var(${VARIABLE_PREFIX}row-height);` +
        `line-height:var(${VARIABLE_PREFIX}row-height);text-align:center;white-space:nowrap;` +
        `color:var(${VARIABLE_PREFIX}quiet);border-left:1px solid var(${VARIABLE_PREFIX}border);` +
        `cursor:pointer;-webkit-user-select:none;user-select:none;}` +
        `.${CLASS.optionsStep}:first-child{border-left:none;}` +
        stepSizes +
        `.${CLASS.optionsWindow}{display:flex;align-items:center;gap:var(${VARIABLE_PREFIX}small);` +
        `height:var(${VARIABLE_PREFIX}row-height);margin-top:var(${VARIABLE_PREFIX}half);` +
        `padding-left:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.optionsWindowName}{flex:1;min-width:0;overflow:hidden;` +
        `text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.optionsWindowState}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.optionsWindowState}.${CLASS.optionsWindowOwn}{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.optionsReset}{padding:0 var(${VARIABLE_PREFIX}small);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);` +
        `background:var(${VARIABLE_PREFIX}raised);color:var(${VARIABLE_PREFIX}text);` +
        `font-size:${tokens.fontSmallPixels}px;` +
        `line-height:calc(var(${VARIABLE_PREFIX}row-height) - var(${VARIABLE_PREFIX}small));` +
        `cursor:pointer;-webkit-user-select:none;user-select:none;}` +
        `.${CLASS.optionsAnswer}{display:flex;align-items:center;` +
        `height:var(${VARIABLE_PREFIX}row-height);margin-top:var(${VARIABLE_PREFIX}half);` +
        `padding:0 var(${VARIABLE_PREFIX}small) 0 var(${VARIABLE_PREFIX}half);` +
        `border-radius:var(${VARIABLE_PREFIX}radius-small);color:var(${VARIABLE_PREFIX}quiet);` +
        `white-space:nowrap;cursor:pointer;-webkit-user-select:none;user-select:none;}` +
        // The mark is drawn by the sheet rather than written into the row, so the row stays one
        // node carrying its answer's mark, and a press on the tick is a press on the answer.
        `.${CLASS.optionsAnswer}::before{content:"";flex:none;text-align:center;` +
        `width:calc(var(${VARIABLE_PREFIX}wide) + var(${VARIABLE_PREFIX}small));}` +
        `.${CLASS.optionsAnswer}.${chosen}::before{content:"✓";}` +
        `.${CLASS.optionsStep}:hover,.${CLASS.optionsAnswer}:hover` +
        `{color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.optionsStep}.${chosen},.${CLASS.optionsAnswer}.${chosen}` +
        `{color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}track);` +
        `font-weight:600;}` +
        `.${CLASS.optionsMeaning}{margin-top:var(${VARIABLE_PREFIX}small);` +
        `padding:0 var(${VARIABLE_PREFIX}half);color:var(${VARIABLE_PREFIX}quiet);` +
        `font-size:${tokens.fontSmallPixels}px;}`;
}

/** The list's height is the rows it promises times what a row costs. `develop ADR 0014`. */
function composeListRules(tokens: TypeTokens): string {
    const region = `var(${VARIABLE_PREFIX}region-down) var(${VARIABLE_PREFIX}region-across)`;
    const belowRows = composeInsetUnderRows(VARIABLE_PREFIX + "region-down");
    const rowCost = `(var(${VARIABLE_PREFIX}row-height) + var(${VARIABLE_PREFIX}half))`;
    return `.${CLASS.list}{padding:${region};` +
        `padding-bottom:${belowRows};` +
        `height:calc(var(${ROWS_VARIABLE},${ROWS_BY_DEFAULT}) * ${rowCost});` +
        `overflow-y:auto;overflow-x:hidden;` +
        `overscroll-behavior:contain;scrollbar-width:none;}` +
        // The background and the layer are not decoration: a row's bar is positioned and comes
        // later in the tree, so without both the bars paint over the sticky heading. A figure is
        // one word and its cell never gives way; the words beside it are what shortens.
        // `DESIGN.md` owns the rule, and every region that draws a figure wears this.
        `.${CLASS.figure}{flex:none;white-space:nowrap;}` +
        `.${CLASS.sectionWords}{min-width:0;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;}` +
        `.${CLASS.section}{position:sticky;` +
        `top:calc(0px - var(${VARIABLE_PREFIX}region-down));z-index:1;` +
        `background:var(${VARIABLE_PREFIX}surface);display:flex;justify-content:space-between;` +
        `color:var(${VARIABLE_PREFIX}heading);letter-spacing:0.08em;` +
        `font-size:${tokens.fontSmallPixels}px;` +
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
        `.${CLASS.sidesSpare}{margin-top:var(${VARIABLE_PREFIX}small);` +
        `font-size:${tokens.fontSmallPixels}px;}` +
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

function composeRowRules(tokens: TypeTokens): string {
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
        `width:${tokens.rankWidthPixels}px;text-align:right;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.rowTime}{color:var(${VARIABLE_PREFIX}quiet);` +
        `font-variant-numeric:tabular-nums;flex:none;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.rowName}{min-width:0;overflow:hidden;text-overflow:ellipsis;` +
        `white-space:nowrap;flex:1;}` +
        // Before the name and never in place of it: the name is the cell that shortens, and a mark
        // taking width from it every row would be the cost develop ADR 0023 refused. This one is
        // drawn on the rows a suspicion reaches, which is none of the rows in `captures/`.
        `.${CLASS.rowSuspect}{position:relative;color:var(${VARIABLE_PREFIX}suspect);flex:none;` +
        `padding-right:var(${VARIABLE_PREFIX}small);}` +
        // Beside the suspect mark and under the same argument: it reaches the row closing a damage
        // section and no other. A mark on every row was measured and refused: `DESIGN.md`
        // has the share, `develop ADR 0089` the decision. The ring is drawn once for both places
        // it stands, below; margin and not padding, because the ring is this box's border.
        `.${CLASS.rowCaveat}{position:relative;` +
        `margin-right:var(${VARIABLE_PREFIX}small);}` +
        // Beside the suspect mark and under the same argument: it reaches the one row whose turn
        // the game is numbering, never every row. `DESIGN.md` owns the rule,
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
        // that earned them the accent, are `DESIGN.md`'s — spelled there and not again
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

/**
 * **It states its own type and its own ink**, because `:host{all:initial}` reaches it and nothing
 * else does: the card hangs off the root beside the frame, so `.panel`'s never arrive. Without the
 * two the card is drawn in the browser's serif at `medium` in black on `raised` — figures nobody
 * can read, seen in Chrome 152 on 2026-08-29.
 *
 * `position:fixed` puts its containing block at the viewport, so the host's `overflow:hidden`
 * cannot clip it: the host creates none, having no transform, filter or containment.
 */
function composeCardRules(tokens: TypeTokens): string {
    // Where a card stands before any window has been moved: against the panel's own corner. It is
    // a distance from the **right** edge, and every placement across is, because a card narrower
    // than the bound has to keep the edge facing its window and not float the difference away.
    const right = `var(${CARD_VARIABLES.right},calc(${PLACE.insetPixels}px + ` +
        `var(${SIZE_VARIABLES.meter.width},${tokens.meterWidthPixels}px) + ` +
        `${SPACE_PIXELS.small}px))`;
    return `.${CLASS.card}{position:fixed;box-sizing:border-box;pointer-events:none;` +
        `left:var(${CARD_VARIABLES.left},auto);right:${right};` +
        `top:${composeCardTop()};z-index:${LAYER.card};` +
        // As wide as what it says, up to the bound — and never wider than the screen it stands
        // on, which is the case the bound on its own does not answer.
        `width:max-content;` +
        `max-width:min(${tokens.cardWidthPixelsMaximum}px,` +
        `calc(100vw - ${PLACE.insetPixels}px - ${PLACE.insetPixels}px));` +
        // A card taller than the screen has no position showing all of it, and the clamp keeps
        // the top edge over the bottom.
        `max-height:calc(100vh - ${PLACE.insetPixels}px - ${PLACE.insetPixels}px);` +
        `overflow:hidden;` +
        `padding:var(${VARIABLE_PREFIX}small);` +
        `font:${composeFontBody(tokens)};` +
        `color:var(${VARIABLE_PREFIX}text);background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:var(${VARIABLE_PREFIX}radius);box-shadow:${SHAPE.windowShadow};}` +
        `.${CLASS.cardHidden}{display:none;}` +
        // Two columns of the one bound each, laid out at the width of both rather than at what
        // they say: a column at `max-content` would draw its own width and the side the card
        // opens on is decided by this one (`composeCardAcross` in `src/ui/panel-drag.ts`).
        `.${CLASS.card}.${CLASS.cardWide}{width:min(${getCardWidthForColumns(tokens, 2)}px,` +
        `calc(100vw - ${PLACE.insetPixels}px - ${PLACE.insetPixels}px));max-width:none;}` +
        `.${CLASS.cardColumns}{display:flex;align-items:flex-start;` +
        `gap:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.cardColumn}{flex:1 1 0;min-width:0;}` +
        // The one cell on this panel that folds rather than shortening: it is the answer to
        // the name a row had to cut, and an answer cut again is no answer (`DESIGN.md`).
        // `break-word` and not `break-all`, which splits a word where a space was free, nor
        // `anywhere`, which shrinks the min-content width the card is laid out against
        // (`develop ADR 0091`). ⚠️ The lines it folds to are counted in `src/ui/panel-element.ts`,
        // and a rule folding here while the count reserves one line is a card off the screen.
        `.${CLASS.cardName}{font-weight:600;overflow-wrap:break-word;}` +
        `.${CLASS.cardSubtitle}{color:var(${VARIABLE_PREFIX}quiet);}` +
        `.${CLASS.cardGroup}{margin-top:var(${VARIABLE_PREFIX}small);` +
        `padding-top:var(${VARIABLE_PREFIX}small);` +
        `border-top:1px solid var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.cardLine}{display:flex;justify-content:space-between;` +
        `gap:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.cardLine}.${CLASS.cardStrong}{font-weight:600;}` +
        `.${CLASS.cardLine}.${CLASS.cardSub}{padding-left:var(${VARIABLE_PREFIX}wide);}` +
        // Cut rather than wrapped, because a label that folded would stand the card wrong —
        // `LABEL_CHARACTERS_MAXIMUM` in `src/ui/panel-words.ts` is where that arithmetic is.
        // `flex:1` and not `auto`: the mark a caveated figure wears sits between this and the
        // value, and a label at its natural width leaves it stranded mid-line, beside the words
        // rather than beside the figure it is about (`DESIGN.md`). Grown, the label pushes
        // the mark against the value wherever the label is short.
        `.${CLASS.cardLabel}{color:var(${VARIABLE_PREFIX}quiet);flex:1;min-width:0;` +
        `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.cardValue}{font-variant-numeric:tabular-nums;flex:none;}` +
        composeCaveatMarkRule(tokens) +
        // The same letters a cut's heading wears down the panel, so a run of parts under one
        // reads as the same kind of thing in both places. `DESIGN.md` owns the look.
        `.${CLASS.cardHeading}{color:var(${VARIABLE_PREFIX}heading);letter-spacing:0.08em;` +
        `font-size:${tokens.fontSmallPixels}px;text-transform:uppercase;overflow:hidden;` +
        `text-overflow:ellipsis;white-space:nowrap;}` +
        `.${CLASS.cardNote}{color:var(${VARIABLE_PREFIX}quiet);}` +
        // The sentence is this box's own text and the ring is a child appended after it, so the
        // sheet is what stands the ring first: `order` over a flex row. It buys the hanging indent
        // as well — a sentence running to a second line aligns under its own first word rather
        // than under the ring.
        `.${CLASS.cardNote}.${CLASS.cardCaveatNote}{display:flex;align-items:flex-start;` +
        `gap:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.cardNote} .${CLASS.cardCaveat}{order:-1;align-self:flex-start;` +
        // Onto the optical centre of the first line: the line box less the ring, halved.
        `margin-top:${Math.floor((tokens.lineHeightPixels - tokens.markSizePixels) / 2)}px;}` +
        `.${CLASS.cardNote}.${CLASS.cardSuspect}{color:var(${VARIABLE_PREFIX}suspect);}` +
        `.${CLASS.cardNote}.${CLASS.cardCaveatNote}{color:var(${VARIABLE_PREFIX}caveat);}`;
}

function composeCardTop(): string {
    return `clamp(${PLACE.insetPixels}px,var(${CARD_VARIABLES.top},${PLACE.insetPixels}px),` +
        `calc(100vh - var(${CARD_VARIABLES.height},0px) - ${PLACE.insetPixels}px))`;
}

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
function composeCaveatMarkRule(tokens: TypeTokens): string {
    return `.${CLASS.rowCaveat},.${CLASS.cardCaveat}{box-sizing:border-box;display:inline-flex;` +
        `align-items:center;justify-content:center;align-self:center;flex:none;` +
        `width:${tokens.markSizePixels}px;height:${tokens.markSizePixels}px;` +
        // An ink of its own, as the other three severities have: drawn in the label's colour it was
        // invisible against the label it qualifies. `DESIGN.md` owns the rule and carries
        // the measured distance to every other hue the panel spends.
        `color:var(${VARIABLE_PREFIX}caveat);` +
        `border:1px solid currentColor;border-radius:50%;` +
        // The letter inside the ring, and the smallest type on the panel: an `i` at the body's own
        // size leaves no ring to draw around it, and one a pixel too large meets it at the top.
        `font-size:${tokens.markLetterPixels}px;font-weight:600;font-style:normal;` +
        `line-height:1;}`;
}

/**
 * The second window under the one root. It states its own type and its own ink for the reason the
 * card does — `:host{all:initial}` reaches it and `.panel`'s rules never do — and it is
 * `position:fixed` for the same reason too: the host is a flex column as wide as the panel, and a plain
 * child of it would stand inside that column and ride the panel's own drag.
 *
 * ⚠️ **Positioned, and deliberately so.** A positioned element paints over a static one whatever
 * the tree order, so a window laid out any other way could cover a control of the panel's and
 * take its press. The layer is stated rather than left to chance.
 */
function composeHelperRules(tokens: TypeTokens): string {
    const top =
        `clamp(${PLACE.insetPixels}px,var(${TOP_VARIABLES.helper},${PLACE.insetPixels}px),` +
        `calc(100vh - ${PLACE.insetPixels}px))`;
    const left = `var(${VARIABLE_PREFIX}helper-left,calc(100vw - ${PLACE.insetPixels}px - ` +
        `var(${SIZE_VARIABLES.meter.width},${tokens.meterWidthPixels}px) - ` +
        `var(${SIZE_VARIABLES.helper.width},${tokens.helperWidthPixels}px) - ` +
        `${SPACE_PIXELS.small}px))`;
    return `.${CLASS.helper}{position:fixed;box-sizing:border-box;` +
        `left:${left};top:${top};z-index:${LAYER.helper};` +
        `width:var(${SIZE_VARIABLES.helper.width},${tokens.helperWidthPixels}px);` +
        `display:flex;flex-direction:column;` +
        `max-height:calc(100vh - ${PLACE.insetPixels}px - ${PLACE.insetPixels}px);` +
        `font:${composeFontBody(tokens)};` +
        `color:var(${VARIABLE_PREFIX}text);}` +
        `.${CLASS.helperBar}{flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}small);` +
        `padding:var(${VARIABLE_PREFIX}small) var(${VARIABLE_PREFIX}wide);` +
        `font:${composeFontTitle(tokens)};letter-spacing:0.06em;` +
        `color:var(${VARIABLE_PREFIX}quiet);white-space:nowrap;` +
        `background:var(${VARIABLE_PREFIX}raised);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);border-bottom:none;` +
        `border-radius:var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius) 0 0;` +
        `cursor:move;-webkit-user-select:none;user-select:none;touch-action:none;}` +
        `.${CLASS.helperBar} .${CLASS.control}{margin-left:auto;}` +
        `.${CLASS.helperBody}{min-height:0;overflow-y:auto;overflow-x:hidden;` +
        `box-sizing:border-box;height:var(${SIZE_VARIABLES.helper.height},auto);` +
        `overscroll-behavior:contain;scrollbar-width:none;` +
        `padding:var(${VARIABLE_PREFIX}region-down) var(${VARIABLE_PREFIX}region-across);` +
        `padding-bottom:calc(var(${VARIABLE_PREFIX}region-down) - ` +
        `var(${VARIABLE_PREFIX}half));` +
        `background:var(${VARIABLE_PREFIX}surface);` +
        `border:1px solid var(${VARIABLE_PREFIX}border);` +
        `border-radius:0 0 var(${VARIABLE_PREFIX}radius) var(${VARIABLE_PREFIX}radius);}` +
        `.${CLASS.helper}.${CLASS.helperFolded} .${CLASS.helperBody}{display:none;}` +
        `.${CLASS.helperUnder}{margin-left:var(${VARIABLE_PREFIX}wide);}` +
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
        `.${CLASS.helperHolding} .${CLASS.rowName}{flex:0 1 auto;}` +
        `.${CLASS.helperCast}{color:var(${VARIABLE_PREFIX}quiet);flex:1 1 0;` +
        `min-width:min(${tokens.castWidthPixelsMinimum}px,100%);` +
        `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;` +
        `padding-left:var(${VARIABLE_PREFIX}small);}` +
        // One dot per turn of the charge, which is how the game's own bar is cut: it draws
        // `total_turns - 1` dividers across it (build `Cl9U89Zr`, read 2026-09-09). Nothing
        // else in the panel is round, so the shape means this and nothing else.
        `.${CLASS.helperPips}{position:relative;flex:none;display:flex;align-items:center;` +
        `gap:var(${VARIABLE_PREFIX}half);padding-left:var(${VARIABLE_PREFIX}small);}` +
        `.${CLASS.helperPip}{width:${tokens.pipSizePixels}px;height:${tokens.pipSizePixels}px;` +
        `border-radius:50%;` +
        `flex:none;background:var(${VARIABLE_PREFIX}border);}` +
        `.${CLASS.helperPip}.${CLASS.helperPipLit}{background:currentColor;}` +
        `.${CLASS.helper}.${CLASS.helperFolded} .${CLASS.sizeGrip}{display:none;}` +
        composeSizeGripRules();
}

/**
 * The corner, drawn as the two strokes a text box's own corner is drawn with, in the ink that
 * says a control is there; a finer drawing reads as a speck at twelve pixels.
 */
function composeSizeGripRules(): string {
    const strokes = "transparent 0 50%,currentColor 50% 60%,transparent 60% 72%," +
        "currentColor 72% 82%,transparent 82%";
    // A box is placed against its parent's padding edge, inside the border: the meter draws one and
    // the helper does not, so the meter's corner stands a rule further out to meet the window's
    // edge. Measured in Chrome 154 on 2026-09-28, where at one offset a 60px drag made the meter
    // 59px wider.
    const meterOutside = `-${RULE_WIDTH}px`;
    return `.${CLASS.sizeGrip}{position:absolute;right:0;bottom:0;` +
        `width:${SIZE_GRIP.sizePixels}px;height:${SIZE_GRIP.sizePixels}px;z-index:1;` +
        `color:var(${VARIABLE_PREFIX}quiet);background:linear-gradient(135deg,${strokes});` +
        `cursor:nwse-resize;touch-action:none;-webkit-user-select:none;user-select:none;}` +
        `.${CLASS.meter}>.${CLASS.sizeGrip}{right:${meterOutside};bottom:${meterOutside};}` +
        `.${CLASS.sizeGrip}:hover{color:var(${VARIABLE_PREFIX}text);}`;
}
