/**
 * What the panel could not do, and where it says so: a render reports the regions it left
 * undrawn, and whatever fails between renders — a gesture, a card opened under the pointer, a
 * window that would not open where it was told — reaches the sink the view was handed.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import type { PanelDefect } from "@/src/ui/panel-element.ts";
import { INTENT_FAILURE, PANEL_INTENT, PANEL_MARK } from "@/src/ui/panel-intent.ts";
import { NOTHING_SUSPECT, presentScreen, type ScreenReading } from "@/src/ui/panel-reading.ts";
import { PANEL_METRIC, SIDE_CHOICE } from "@/src/ui/panel-screen.ts";
import { PANEL_DEFECT_KIND, PANEL_REGION } from "@/src/ui/panel-words.ts";
import { PANEL_WINDOW } from "@/src/ui/panel-choice.ts";
import { PANEL_LISTENER, VIEW_FAILURE, type ViewFailure } from "@/src/ui/view-failure.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    pointAtElement,
    pressElement,
} from "@/tests/fake-document.ts";
import { initTestView, NOTHING_WAITING } from "@/tests/panel-view.ts";
import { tallyRecordedFight } from "@/tests/recorded-fights.ts";
import { composeShownScreen } from "@/tests/shown-screen.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

function readFight(): ScreenReading {
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    return presentScreen(
        statistics,
        roster,
        PANEL_METRIC.damageDealtApplied,
        SIDE_CHOICE.everyone,
        null,
        NOTHING_SUSPECT,
    );
}

function findMarked(host: FakeElement, mark: string): FakeElement {
    const found = getElementsWithin(host).find((one) => one.attributes.has(mark));
    assertExists(found, `the panel draws something marked ${mark}`);
    return found;
}

Deno.test("a press whose handler throws is a dropped gesture, and the next one lands", () => {
    const failures: ViewFailure[] = [];
    const asked: unknown[] = [];
    let isRefusing = true;
    const panel = initTestView(composeFakeDocument(), {
        onIntent: (intent) => {
            if (isRefusing) throw new RangeError("a runtime that refused the gesture");
            asked.push(intent);
        },
        onFailure: (failure) => failures.push(failure),
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    pressElement(host, "pointerdown", findMarked(host, PANEL_MARK.fold));
    assertStrictEquals(failures.length, 1, "the gesture is dropped, and said once");
    assertEquals(failures[0]?.kind, VIEW_FAILURE.gestureDropped, "as a gesture");
    assert(failures[0]?.kind === VIEW_FAILURE.gestureDropped, "and one that names its listener");
    assertEquals(failures[0].listener, PANEL_LISTENER.press, "which is the press");
    isRefusing = false;
    pressElement(host, "pointerdown", findMarked(host, PANEL_MARK.fold));
    assertEquals(asked, [{ kind: PANEL_INTENT.fold, window: PANEL_WINDOW.panel }], "then lands");
    assertStrictEquals(failures.length, 1, "and the one that landed is no failure");
});

Deno.test("a mark with a value nothing of ours writes drops the gesture and asks nothing", () => {
    const failures: ViewFailure[] = [];
    const asked: unknown[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onIntent: (intent) => asked.push(intent),
        onFailure: (failure) => failures.push(failure),
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    const fold = findMarked(host, PANEL_MARK.fold);
    fold.setAttribute(PANEL_MARK.screen, "nowhere");
    pressElement(host, "pointerdown", fold);
    assertEquals(asked, [], "a stray mark is never read as the first screen there is");
    assertEquals(failures, [{
        kind: VIEW_FAILURE.gestureDropped,
        listener: PANEL_LISTENER.press,
        cause: { kind: INTENT_FAILURE.markUnknown, mark: PANEL_MARK.screen },
    }], "and the drop names the mark that strayed");
});

Deno.test("a sink that throws is not the browser's to hear", () => {
    const panel = initTestView(composeFakeDocument(), {
        onIntent: () => {
            throw new RangeError("a runtime that refused the gesture");
        },
        onFailure: () => {
            throw new RangeError("and a sink that refused to hear of it");
        },
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    pressElement(host, "pointerdown", findMarked(host, PANEL_MARK.fold));
    pointAtElement(host, "contextmenu", null, 10);
});

Deno.test("a render reports every region it left undrawn, and nothing where all stood", () => {
    const panel = initTestView(composeFakeDocument());
    const reading = readFight();
    assertEquals(panel.render(composeShownScreen(reading)).undrawn, [], "a whole panel");
    const broken = {
        ...reading,
        get sides(): ScreenReading["sides"] {
            throw new RangeError("a summary that will not draw");
        },
        get suspicions(): ScreenReading["suspicions"] {
            throw new RangeError("and warnings that will not either");
        },
    };
    const report = panel.render(composeShownScreen(broken));
    assertEquals(
        report.undrawn.map((one) => [one.kind, one.region]),
        [
            [VIEW_FAILURE.regionUndrawn, PANEL_REGION.sides],
            [VIEW_FAILURE.regionUndrawn, PANEL_REGION.suspicions],
        ],
        "each region it cost, in the order it was drawn",
    );
    assert(report.undrawn.every((one) => one.cause instanceof RangeError), "with its cause");
});

Deno.test("a card that will not draw under the pointer is told to the sink as the card", () => {
    const document = composeFakeDocument();
    const failures: ViewFailure[] = [];
    const panel = initTestView(document, { onFailure: (failure) => failures.push(failure) });
    panel.render(composeShownScreen(readFight()));
    const host = panel.element as FakeElement;
    const row = getElementsWithin(host).find((one) => one.attributes.has("data-tip"));
    assertExists(row, "a row carries a card");
    const createElement = document.createElement;
    document.createElement = () => {
        throw new RangeError("a document that will not make one");
    };
    pointAtElement(host, "pointermove", row, 200);
    document.createElement = createElement;
    assertEquals(
        failures.map((one) => one.kind === VIEW_FAILURE.regionUndrawn ? one.region : one.kind),
        [PANEL_REGION.tip],
        "no render was running, so the card is the sink's to hear of",
    );
    const tip = host.shadow?.find((one) => one.className.startsWith("MargoMeter-tip"));
    assertEquals(tip?.className, "MargoMeter-tip tip-hidden", "and the card standing hides");
});

Deno.test("a region kept after a refused replace is the one the next draw replaces", () => {
    const panel = initTestView(composeFakeDocument());
    const reading = readFight();
    panel.render(composeShownScreen(reading));
    const host = panel.element as FakeElement;
    const readHeaders = () => getElementsWithin(host).filter((one) => one.className === "header");
    const [kept] = readHeaders();
    assertExists(kept, "the header stands, to be refused");
    const replaceWith = kept.replaceWith;
    kept.replaceWith = () => {
        throw new RangeError("a node the document will not let go of");
    };
    panel.render(composeShownScreen(reading));
    kept.replaceWith = replaceWith;
    panel.render(composeShownScreen(reading));
    assertExists(kept.replacedBy, "the header the reader kept is the one the next draw replaced");
    assertEquals(readHeaders().length, 1, "and the panel holds one header, not two");
});

Deno.test("a window that will not open where told stays on the sheet's corner, and says so", () => {
    const failures: ViewFailure[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onFailure: (failure) => failures.push(failure),
        placement: {
            position: null,
            readViewport: () => {
                throw new RangeError("a page that will not state its size");
            },
        },
    });
    const host = panel.element as FakeElement;
    assertEquals(host.attributes.get("style"), undefined, "the sheet's corner, which is a place");
    assertEquals(
        failures.map((one) => one.kind === VIEW_FAILURE.windowUnplaced ? one.window : one.kind),
        [PANEL_WINDOW.panel],
        "and the window that did not open where it was told is named",
    );
});

Deno.test("the defects handed in are worded here, one line per kind at most", () => {
    const kinds = Object.values(PANEL_DEFECT_KIND);
    const draw = (defects: readonly PanelDefect[]): string[] => {
        const panel = initTestView(composeFakeDocument());
        panel.render({ ...composeShownScreen(readFight()), defects });
        return getTextsByClass(panel.element as FakeElement, "defect");
    };
    const every = kinds.map((kind) => ({ kind, region: null, count: 2 }));
    assertEquals(draw(every).length, kinds.length, "every kind there is, at the bound, is said");
    assertEquals(
        draw([...every, { kind: PANEL_DEFECT_KIND.region, region: PANEL_REGION.list, count: 1 }])
            .length,
        kinds.length,
        "and a line past it is not",
    );
    assertEquals(
        draw([{ kind: PANEL_DEFECT_KIND.region, region: PANEL_REGION.list, count: 3 }]),
        ["✖ Panel nie narysował listy (3×)."],
        "worded with the region it cost and how often",
    );
    assertEquals(draw([]), [], "and none is no block at all");
});
