/**
 * Where the panel sits, held to the two things a reader would notice: it never leaves the screen,
 * and it is where they left it when they come back.
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import {
    composeClampedPosition,
    composeDefaultPosition,
    composePositionStyle,
    composeStoredTextFromPosition,
    composeTipAcross,
    getPositionFromStoredText,
    PANEL_WINDOW,
    type PanelWindowName,
    STANDING_WINDOW,
    type TipAcross,
    type TipWindowPlace,
} from "@/src/ui/panel-drag.ts";

const WINDOW = { width: 1280, height: 900 };

Deno.test("a position is kept inside the window, with the grab area still on screen", () => {
    assertEquals(
        composeClampedPosition({ left: 100, top: 200 }, WINDOW),
        { left: 100, top: 200 },
        "a position the window can show is the position",
    );
    // A title bar's worth each way: a panel dragged past this cannot be dragged back, because
    // what goes off the edge with it is the thing you grab.
    assertEquals(
        composeClampedPosition({ left: 5000, top: 5000 }, WINDOW),
        { left: 1216, top: 836 },
        "and one it cannot is pulled back to where the bar is still reachable",
    );
    assertEquals(
        composeClampedPosition({ left: -80, top: -80 }, WINDOW),
        { left: 0, top: 0 },
        "the top left corner is the other edge, and zero is on the screen",
    );
    assertEquals(
        composeClampedPosition({ left: 40, top: 40 }, { width: 10, height: 10 }),
        { left: 0, top: 0 },
        "a window narrower than the margin puts the panel in the corner rather than off it",
    );
    assertEquals(
        composeClampedPosition({ left: 12.4, top: 12.6 }, null),
        { left: 12, top: 13 },
        "a page that would not say how big it is clamps nothing, and states whole pixels",
    );
});

Deno.test("a panel nobody has moved opens in the middle of the window", () => {
    assertEquals(
        composeDefaultPosition(WINDOW),
        { left: 487, top: 153 },
        "centred across, and centred on the tallest body the sheet allows down",
    );
    assertEquals(
        composeDefaultPosition({ width: 200, height: 40 }),
        { left: 0, top: 0 },
        "a window smaller than the panel puts it against the corner rather than off the screen",
    );
    // Not a guess: a drag from a guessed origin snatches the panel out from under the hand.
    assertEquals(composeDefaultPosition(null), null, "and nothing where the page states no size");
});

/**
 * A window that answers with something that is not a number. `getValueWithin` refuses one, so the
 * panel used to stop being drawn over a reading nothing here can do anything with; the corner is
 * a place and the panel is still there to be grabbed — **E14**, ADR 0051.
 */
Deno.test("a window stating no size to clamp against leaves the panel where it is", () => {
    assertEquals(
        composeClampedPosition({ left: 40, top: 60 }, { width: Number.NaN, height: 900 }),
        { left: 40, top: 60 },
        "an edge nothing can be measured against clamps nothing, as a window with no size does",
    );
    assertEquals(
        composeClampedPosition({ left: Number.NaN, top: Number.NaN }, null),
        { left: 0, top: 0 },
        "and a position that is not one at all is the corner in both",
    );
});

Deno.test("a position survives a reload, and nothing else is read as one", () => {
    const written = composeStoredTextFromPosition({ left: 12, top: 34 });
    assertExists(written, "a position of two whole numbers is one that can be written down");
    assertEquals(getPositionFromStoredText(written), { left: 12, top: 34 }, "what was put in");
    assertEquals(getPositionFromStoredText(""), null, "nothing stored is no position");
    assertEquals(getPositionFromStoredText("{"), null, "and neither is text that was cut short");
    assertEquals(getPositionFromStoredText("[1,2]"), null, "nor a shape of another kind");
    assertEquals(getPositionFromStoredText('{"left":1}'), null, "a position states both numbers");
    assertEquals(getPositionFromStoredText('{"left":"1","top":2}'), null, "as numbers, not text");
    assertEquals(getPositionFromStoredText('{"left":1.5,"top":2}'), null, "and as whole ones");
    assertEquals(getPositionFromStoredText('{"left":0,"top":0}'), { left: 0, top: 0 }, "zero is a");
    // Nothing is written rather than the draw being stopped: the reader keeps the place they left,
    // and only the next visit is the poorer for it — **E14**, ADR 0051.
    assertEquals(
        composeStoredTextFromPosition({ left: Number.NaN, top: 0 }),
        null,
        "a position that is not two whole numbers is not written down at all",
    );
});

Deno.test("what puts the panel there releases the corner it was anchored to", () => {
    const style = composePositionStyle({ left: 40, top: 60 });
    assertExists(style, "a position of two whole numbers puts the panel somewhere");
    assertStringIncludes(style, "left:40px", "the panel is put where it was dragged to");
    assertStringIncludes(style, "top:60px", "in both directions");
    // The ceiling that keeps the panel above the bottom edge is the window less its top, and CSS
    // cannot read a `top` back out of an inline style — so the same number is written twice.
    assertStringIncludes(
        style,
        "--MargoMeter-panel-top:60px",
        "the ceiling is told where the top is",
    );
    assertStringIncludes(style, "right:auto", "and the corner the sheet anchored to is released");
    assertEquals(
        composePositionStyle({ left: 40, top: Number.POSITIVE_INFINITY }),
        null,
        "and a position that is not one writes no style, leaving the sheet's corner standing",
    );
});

/**
 * A round stand-in for the sheet's own bound, so the arithmetic below reads without one. It is the
 * **widest a card may be** and never the width of any one card — which is what decides the side a
 * card opens on, and the only thing about a card this arithmetic knows (**ADR 0091**).
 */
const MAXIMUM_TIP_WIDTH = 250;
/** The air between a window and the card beside it, which is `SPACE.small` written as a number. */
const GAP = 4;
/** The screen's right edge, which is what a card standing left of its window is measured from. */
function composeFromRight(windowWidth: number, windowLeft: number): TipAcross {
    return { edge: "right", at: windowWidth - windowLeft + GAP };
}

/** The screen's left edge, which is what a card flipped to the other side is measured from. */
function composeFromLeft(at: number): TipAcross {
    return { edge: "left", at };
}

/** A window to open a card beside, written the way the panel hands one over. */
function composePlace(left: number, windowName: PanelWindowName = PANEL_WINDOW): TipWindowPlace {
    return { position: { left, top: 8 }, windowName };
}

Deno.test("the detail opens on the side of the panel that has room for it", () => {
    // Where the sheet puts the panel, which is where it stays until somebody drags it: the whole
    // right-hand side of the window is behind it, so the detail opens to its left — pinned by its
    // right edge, a gap from the window's left, whatever width the card turns out to draw at.
    assertEquals(
        composeTipAcross(composePlace(1012), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromRight(WINDOW.width, 1012),
        "a panel in its own corner opens the detail to its left, a gap away",
    );
    // Dragged to the left edge there is no room on that side, and a detail that went on opening
    // leftwards would be drawn off the screen — where nothing here would measure it back on.
    assertEquals(
        composeTipAcross(composePlace(20), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(330),
        "and one against the left edge opens it to the right instead",
    );
    assertEquals(
        composeTipAcross(composePlace(254), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromRight(WINDOW.width, 254),
        "the boundary: exactly the widest a card may be and the gap is still room on the left",
    );
    assertEquals(
        composeTipAcross(composePlace(253), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(563),
        "and one pixel less is not",
    );
    assertEquals(
        composeTipAcross(null, WINDOW, MAXIMUM_TIP_WIDTH),
        null,
        "a panel nobody moved is placed",
    );
    assertEquals(
        composeTipAcross(composePlace(20), null, MAXIMUM_TIP_WIDTH),
        null,
        "by the sheet, and so is one in a page that will not say how big it is",
    );
});

/**
 * ⚠️ **The side is the bound's answer, not this card's.** A card is drawn at `max-content` since
 * **ADR 0091**, so a short one would find room where the card before it found none — and a reader
 * crossing two rows of one list would watch the card jump from one side of the window to the
 * other. Two cards, one narrow enough to fit on the left and one not, at a place where the bound
 * says there is no room: both flip, and the panel stays still.
 */
Deno.test("the side a card opens on is the same for every card the window holds", () => {
    const at = composePlace(253);
    assertEquals(
        composeTipAcross(at, WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(563),
        "the bound says there is no room on the left",
    );
    assertEquals(
        composeTipAcross(at, WINDOW, MAXIMUM_TIP_WIDTH),
        composeTipAcross(at, WINDOW, MAXIMUM_TIP_WIDTH),
        "and nothing about the card the reader is pointing at reaches this answer",
    );
});

/**
 * The second window is 248px wide against the panel's 306, so a card flipped off its left edge
 * lands 58px short of where the panel's own would — on the panel, which is what the second half of
 * this holds it against (**ADR 0090**).
 */
Deno.test("a card from the window beside the panel opens beside that window", () => {
    assertEquals(
        composeTipAcross(composePlace(758, STANDING_WINDOW), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromRight(WINDOW.width, 758),
        "with room to its left the card is pinned to that window's left edge and no other",
    );
    assertEquals(
        composeTipAcross(composePlace(20, STANDING_WINDOW), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(272),
        "and flipped right, alone in the strip, it steps over its own width and not the panel's",
    );
    assertEquals(
        composeTipAcross(composePlace(20), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(330),
        "which is where the panel's own card goes, the two being 58px apart",
    );
    assertEquals(
        composeTipAcross(composePlace(253, STANDING_WINDOW), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(505),
        "the boundary on the left is the bound and the gap, which no window decides",
    );
    assertEquals(
        composeTipAcross(composePlace(254, STANDING_WINDOW), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromRight(WINDOW.width, 254),
        "and a pixel more is room there",
    );
});

/**
 * ⚠️ **The two windows are placed apart, and nothing reads the other's corner.** A flip that
 * stepped past both put the panel's own card beyond the second window the moment the panel was
 * dragged left of it — 310 away from the panel it belongs to, at 487, against a window the reader
 * was not pointing at. Reported on the branch that introduced it (**ADR 0090**).
 */
Deno.test("a card flipped right stays with its own window, whatever the other is doing", () => {
    const WINDOW_LEFT = 235;
    assertEquals(
        composeTipAcross(composePlace(0), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(310),
        "a panel against the left edge opens its card a gap to its own right",
    );
    assertEquals(
        composeTipAcross(composePlace(WINDOW_LEFT, STANDING_WINDOW), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(487),
        "and the second window's card is where that window's own right edge puts it",
    );
    // The same two windows, the panel dragged left of the other: neither answer moved, because
    // neither was read from the other. This is the whole of what the pair is held to.
    assertEquals(
        composeTipAcross(composePlace(0), WINDOW, MAXIMUM_TIP_WIDTH),
        composeFromLeft(310),
        "the panel's answer is the panel's, whatever corner the second window is standing in",
    );
    // The clamp is the screen and outranks the window. It is reachable only on a screen narrow
    // enough to hold neither side: a window with no room on its left stands near that edge, so at
    // the widths above the flip always lands on the screen with room to spare.
    assertEquals(
        composeTipAcross(composePlace(0), { width: 500, height: 900 }, MAXIMUM_TIP_WIDTH),
        composeFromLeft(250),
        "and a screen too narrow for either side draws the card back onto it",
    );
});
