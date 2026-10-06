/**
 * What a hand does on the panel beyond pressing a mark: which button opens anything, how each
 * window is dragged and reported moved, and what a pointer that states no place does.
 */

import { assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { PANEL_WINDOW, type PanelPosition } from "#/src/ui/panel-choice.ts";
import type { PanelEvent } from "#/src/ui/panel-document.ts";
import { PANEL_INTENT, type PanelIntent } from "#/src/ui/panel-intent.ts";
import { HELPER_ABSENCE } from "#/src/ui/panel-helper.ts";
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
    const panel = initTestView(composeFakeDocument(), { onIntent: (intent) => asked.push(intent) });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const fold = getElementsWithin(host).find((descendant) =>
        descendant.attributes.has("data-fold")
    );
    assertExists(fold, "the bar folds the panel");
    dispatch(host, "pointerdown", { target: fold, clientY: 10, button: SECONDARY_BUTTON });
    assertEquals(asked, [], "a second button asks for nothing");
    dispatch(host, "pointerdown", { target: fold, clientY: 10, button: 0 });
    dispatch(host, "pointerdown", { target: fold, clientY: 10 });
    const folding = { kind: PANEL_INTENT.fold, window: PANEL_WINDOW.meter };
    assertEquals(asked, [folding, folding], "the first does, stated or not");
});

function dispatch(host: FakeElement, type: string, event: PanelEvent): void {
    for (const handle of host.rootListeners.get(type) ?? []) handle(event);
}

Deno.test("each window is moved by its own bar, and reported moved under its own name", () => {
    const asked: PanelIntent[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onIntent: (intent) => asked.push(intent),
        meterPlacement: {
            position: { left: 40, top: 40 },
            size: null,
            readViewport: () => VIEWPORT,
        },
        helperPlacement: {
            position: { left: 600, top: 40 },
            size: null,
            readViewport: () => VIEWPORT,
        },
    });
    panel.renderHelper(HELPER_ABSENCE.noFightYet, false);
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const bar = findGrip(host, "helper");
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
    const bar = getElementsWithin(host).find((descendant) =>
        descendant.attributes.get("data-grip") === grip
    );
    assertExists(bar, `the ${grip} window draws a bar to drag it by`);
    return bar;
}

Deno.test("a window opened with no place is dragged from its own opening, not the panel's", () => {
    const drag = (isSizedAtOpening: boolean): PanelIntent[] => {
        const asked: PanelIntent[] = [];
        let isPageSized = isSizedAtOpening;
        const panel = initTestView(composeFakeDocument(), {
            onIntent: (intent) => asked.push(intent),
            helperPlacement: {
                position: null,
                size: null,
                readViewport: () => isPageSized ? VIEWPORT : null,
            },
        });
        panel.renderHelper(HELPER_ABSENCE.noFightYet, false);
        isPageSized = true;
        const host = panel.element as FakeElement;
        const bar = findGrip(host, "helper");
        dragOnElement(host, "pointerdown", bar, { clientX: 610, clientY: 50 });
        dragOnElement(host, "pointermove", bar, { clientX: 650, clientY: 90 });
        dragOnElement(host, "pointerup", bar, { clientX: 650, clientY: 90 });
        return asked;
    };
    const opened = drag(true);
    assertStrictEquals(opened.length, 1, "a window opened in its place reports the one move");
    assertEquals(drag(false), opened, "and one the page gave no size to moves from the same place");
});

Deno.test("a pointer stating no place starts no drag, and the panel stays where it stood", () => {
    const panel = initTestView(composeFakeDocument(), {
        meterPlacement: {
            position: { left: 40, top: 40 },
            size: null,
            readViewport: () => VIEWPORT,
        },
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const bar = findGrip(host, "meter");
    const stood = host.attributes.get("style");
    dragOnElement(host, "pointerdown", bar, { clientX: Number.NaN, clientY: 50 });
    dragOnElement(host, "pointermove", bar, { clientX: 400, clientY: 400 });
    assertStrictEquals(host.attributes.get("style"), stood, "a grab from nowhere moves nothing");
});

Deno.test("a grab on a bar keeps the browser's own drag off it, and a press that grabs nothing not", () => {
    const panel = initTestView(composeFakeDocument(), {
        meterPlacement: {
            position: { left: 40, top: 40 },
            size: null,
            readViewport: () => VIEWPORT,
        },
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const bar = findGrip(host, "meter");
    let prevented = 0;
    const press = (clientX: number): void => {
        dispatch(host, "pointerdown", {
            target: bar,
            clientX,
            clientY: 50,
            pointerId: 1,
            preventDefault: () => void (prevented += 1),
        });
    };
    press(Number.NaN);
    assertStrictEquals(prevented, 0, "a press from nowhere leaves the browser its own drag");
    press(100);
    assertStrictEquals(prevented, 1, "and a grab takes it, once");
});

Deno.test("a pointer the bar will not hold drops that hold, and the drag still moves", () => {
    const failures: ViewFailure[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onFailure: (failure) => failures.push(failure),
        meterPlacement: {
            position: { left: 40, top: 40 },
            size: null,
            readViewport: () => VIEWPORT,
        },
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const bar = findGrip(host, "meter");
    bar.setPointerCapture = () => {
        throw new RangeError("a pointer the browser no longer considers active");
    };
    dragOnElement(host, "pointerdown", bar, { clientX: 100, clientY: 50 });
    dragOnElement(host, "pointermove", bar, { clientX: 200, clientY: 150 });
    assertEquals(
        failures.map((failure) =>
            failure instanceof GestureDropped ? failure.listener : failure.name
        ),
        [PANEL_LISTENER.capture],
        "the hold is what was dropped",
    );
    assertStrictEquals(
        host.attributes.get("style"),
        "left:140px;top:140px;--MargoMeter-meter-top:140px;right:auto",
        "and the panel went on following the hand",
    );
});
