/**
 * What a hand does on the panel beyond pressing a mark: which button opens anything, how each
 * window is dragged and reported moved, and what a pointer that states no place does.
 */

import { assertEquals, assertExists } from "@std/assert";
import { PANEL_WINDOW, type PanelPosition } from "#/src/ui/panel-choice.ts";
import type { PanelEvent } from "#/src/ui/panel-document.ts";
import { PANEL_INTENT, type PanelIntent } from "#/src/ui/panel-intent.ts";
import { GestureDropped, PANEL_LISTENER, type ViewFailure } from "#/src/ui/view-failure.ts";
import {
    composeFakeDocument,
    dragOnElement,
    type FakeElement,
    getElementsWithin,
} from "#/tests/fake-document.ts";
import { initTestView, NOTHING_WAITING } from "#/tests/panel-view.ts";

const VIEWPORT = { width: 1280, height: 900 };
/** The button a browser states for a press of the second one, which opens a menu. */
const SECONDARY_BUTTON = 2;

Deno.test("only the primary button opens anything, and a press stating none is that button", () => {
    const asked: PanelIntent[] = [];
    const panel = initTestView(composeFakeDocument(), { onIntent: (one) => asked.push(one) });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const fold = getElementsWithin(host).find((one) => one.attributes.has("data-fold"));
    assertExists(fold, "the bar folds the panel");
    dispatch(host, "pointerdown", { target: fold, clientY: 10, button: SECONDARY_BUTTON });
    assertEquals(asked, [], "a second button asks for nothing");
    dispatch(host, "pointerdown", { target: fold, clientY: 10, button: 0 });
    dispatch(host, "pointerdown", { target: fold, clientY: 10 });
    const folding = { kind: PANEL_INTENT.fold, window: PANEL_WINDOW.panel };
    assertEquals(asked, [folding, folding], "the first does, stated or not");
});

function dispatch(host: FakeElement, type: string, event: PanelEvent): void {
    for (const handle of host.rootListeners.get(type) ?? []) handle(event);
}

Deno.test("each window is moved by its own bar, and reported moved under its own name", () => {
    const asked: PanelIntent[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onIntent: (one) => asked.push(one),
        placement: { position: { left: 40, top: 40 }, readViewport: () => VIEWPORT },
        standingPlacement: { position: { left: 600, top: 40 }, readViewport: () => VIEWPORT },
    });
    panel.renderStanding(null, false);
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const bar = findGrip(host, "standing");
    dragOnElement(host, "pointerdown", bar, { clientX: 610, clientY: 50 });
    dragOnElement(host, "pointermove", bar, { clientX: 650, clientY: 90 });
    dragOnElement(host, "pointerup", bar, { clientX: 650, clientY: 90 });
    const position: PanelPosition = { left: 640, top: 80 };
    assertEquals(
        asked,
        [{ kind: PANEL_INTENT.move, window: PANEL_WINDOW.helper, position }],
        "the helper's bar moves the helper, and says so",
    );
});

function findGrip(host: FakeElement, grip: string): FakeElement {
    const found = getElementsWithin(host).find((one) => one.attributes.get("data-grip") === grip);
    assertExists(found, `the ${grip} window draws a bar to drag it by`);
    return found;
}

Deno.test("a pointer stating no place starts no drag, and the panel stays where it stood", () => {
    const panel = initTestView(composeFakeDocument(), {
        placement: { position: { left: 40, top: 40 }, readViewport: () => VIEWPORT },
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const bar = findGrip(host, "panel");
    const stood = host.attributes.get("style");
    dragOnElement(host, "pointerdown", bar, { clientX: Number.NaN, clientY: 50 });
    dragOnElement(host, "pointermove", bar, { clientX: 400, clientY: 400 });
    assertEquals(host.attributes.get("style"), stood, "a grab from nowhere moves nothing");
});

Deno.test("a pointer the bar will not hold drops that hold, and the drag still moves", () => {
    const failures: ViewFailure[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onFailure: (one) => failures.push(one),
        placement: { position: { left: 40, top: 40 }, readViewport: () => VIEWPORT },
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const bar = findGrip(host, "panel");
    bar.setPointerCapture = () => {
        throw new RangeError("a pointer the browser no longer considers active");
    };
    dragOnElement(host, "pointerdown", bar, { clientX: 100, clientY: 50 });
    dragOnElement(host, "pointermove", bar, { clientX: 200, clientY: 150 });
    assertEquals(
        failures.map((one) => one instanceof GestureDropped ? one.listener : one.name),
        [PANEL_LISTENER.capture],
        "the hold is what was dropped",
    );
    assertEquals(
        host.attributes.get("style"),
        "left:140px;top:140px;--MargoMeter-panel-top:140px;right:auto",
        "and the panel went on following the hand",
    );
});
