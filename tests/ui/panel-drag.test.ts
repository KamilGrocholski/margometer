/**
 * Where the panel sits, held to the two things a reader would notice: it never leaves the screen,
 * and it is where they left it when they come back.
 */

import { assert, assertEquals } from "@std/assert";
import {
    composeClampedPosition,
    composeDefaultPosition,
    composePositionStyle,
    composeStoredTextFromPosition,
    composeTipLeft,
    getPositionFromStoredText,
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

Deno.test("the first grab starts where the stylesheet already put the panel", () => {
    assertEquals(
        composeDefaultPosition(WINDOW),
        { left: 1012, top: 8 },
        "the corner the sheet anchors to, as a left this arithmetic can move",
    );
    // Not a guess: a drag from a guessed origin snatches the panel out from under the hand.
    assertEquals(composeDefaultPosition(null), null, "and nothing where the page states no size");
});

Deno.test("a position survives a reload, and nothing else is read as one", () => {
    const written = composeStoredTextFromPosition({ left: 12, top: 34 });
    assertEquals(getPositionFromStoredText(written), { left: 12, top: 34 }, "what was put in");
    assertEquals(getPositionFromStoredText(""), null, "nothing stored is no position");
    assertEquals(getPositionFromStoredText("{"), null, "and neither is text that was cut short");
    assertEquals(getPositionFromStoredText("[1,2]"), null, "nor a shape of another kind");
    assertEquals(getPositionFromStoredText('{"left":1}'), null, "a position states both numbers");
    assertEquals(getPositionFromStoredText('{"left":"1","top":2}'), null, "as numbers, not text");
    assertEquals(getPositionFromStoredText('{"left":1.5,"top":2}'), null, "and as whole ones");
    assertEquals(getPositionFromStoredText('{"left":0,"top":0}'), { left: 0, top: 0 }, "zero is a");
});

Deno.test("what puts the panel there releases the corner it was anchored to", () => {
    const style = composePositionStyle({ left: 40, top: 60 });
    assert(style.includes("left:40px"), "the panel is put where it was dragged to");
    assert(style.includes("top:60px"), "in both directions");
    // The ceiling that keeps the panel above the bottom edge is the window less its top, and CSS
    // cannot read a `top` back out of an inline style — so the same number is written twice.
    assert(style.includes("--MargoMeter-panel-top:60px"), "the ceiling is told where the top is");
    assert(style.includes("right:auto"), "and the corner the sheet anchored to is released");
});

/** 250 pixels, which is what the sheet draws the detail window at. */
const TIP_WIDTH = 250;

Deno.test("the detail opens on the side of the panel that has room for it", () => {
    // Where the sheet puts the panel, which is where it stays until somebody drags it: the whole
    // right-hand side of the window is behind it, so the detail opens to its left.
    assertEquals(
        composeTipLeft({ left: 1012, top: 8 }, WINDOW, TIP_WIDTH),
        758,
        "a panel in its own corner opens the detail to its left, a gap away",
    );
    // Dragged to the left edge there is no room on that side, and a detail that went on opening
    // leftwards would be drawn off the screen — where nothing here would measure it back on.
    assertEquals(
        composeTipLeft({ left: 20, top: 40 }, WINDOW, TIP_WIDTH),
        284,
        "and one against the left edge opens it to the right instead",
    );
    assertEquals(
        composeTipLeft({ left: 254, top: 0 }, WINDOW, TIP_WIDTH),
        0,
        "the boundary: exactly the detail's width and the gap is still room on the left",
    );
    assertEquals(
        composeTipLeft({ left: 253, top: 0 }, WINDOW, TIP_WIDTH),
        517,
        "and one pixel less is not",
    );
    assertEquals(composeTipLeft(null, WINDOW, TIP_WIDTH), null, "a panel nobody moved is placed");
    assertEquals(
        composeTipLeft({ left: 20, top: 0 }, null, TIP_WIDTH),
        null,
        "by the sheet, and so is one in a page that will not say how big it is",
    );
});
