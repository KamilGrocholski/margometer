/**
 * What the panel could not do, and where it says so: a render reports the regions it left
 * undrawn, and whatever fails between renders — a gesture, a card opened under the pointer, a
 * window that would not open where it was told — reaches the sink the view was handed.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertInstanceOf,
    assertStrictEquals,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { CARD_LINES_MAXIMUM, DEFECTS_MAXIMUM, type PanelDefect } from "#/src/ui/panel-element.ts";
import { CHARGED_SKILL_STATE } from "#/src/core/charged-skill.ts";
import { DEFECT_KIND, initDefectLedger, ROWS_MAXIMUM } from "#/src/runtime/defect-ledger.ts";
import { SIDE_RELATION } from "#/src/ui/panel-content.ts";
import { type HelperContent, STANDING_TURN_STATE } from "#/src/ui/panel-helper.ts";
import { SIGNAL } from "#/src/ui/panel-palette.ts";
import { MarkValueUnknown, PANEL_INTENT, PANEL_MARK } from "#/src/ui/panel-intent.ts";
import { NOTHING_SUSPECT, presentScreen, type ScreenContent } from "#/src/ui/panel-content.ts";
import { PANEL_METRIC, SIDE_CHOICE } from "#/src/ui/panel-screen.ts";
import { PANEL_DEFECT_KIND, PANEL_REGION } from "#/src/ui/panel-words.ts";
import { PANEL_WINDOW } from "#/src/ui/panel-choice.ts";
import { GRIP_ATTRIBUTE } from "#/src/ui/panel-drag.ts";
import {
    CardLinesExceeded,
    CardRefused,
    GestureDropped,
    PANEL_LISTENER,
    RegionUndrawn,
    type ViewFailure,
    WindowUnplaced,
} from "#/src/ui/view-failure.ts";
import {
    composeFakeDocument,
    dragOnElement,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    pointAtElement,
    pressElement,
} from "#/tests/fake-document.ts";
import { initTestView, NOTHING_WAITING } from "#/tests/panel-view.ts";
import { tallyRecordedFight } from "#/tests/recorded-fights.ts";
import { composeShownScreen } from "#/tests/shown-screen.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** A screen the meter opens on, for the one test that opens it somewhere. */
const VIEWPORT = { width: 1280, height: 900 };

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
    const [dropped] = failures;
    assertInstanceOf(dropped, GestureDropped, "as a gesture, and one that names its listener");
    assertStrictEquals(dropped.listener, PANEL_LISTENER.press, "which is the press");
    isRefusing = false;
    pressElement(host, "pointerdown", findMarked(host, PANEL_MARK.fold));
    assertEquals(asked, [{ kind: PANEL_INTENT.fold, window: PANEL_WINDOW.meter }], "then lands");
    assertStrictEquals(failures.length, 1, "and the one that landed is no failure");
});

function findMarked(host: FakeElement, mark: string): FakeElement {
    const marked = getElementsWithin(host).find((descendant) => descendant.attributes.has(mark));
    assertExists(marked, `the panel draws something marked ${mark}`);
    return marked;
}

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
    assertStrictEquals(failures.length, 1, "and the drop is said once");
    const [dropped] = failures;
    assertInstanceOf(dropped, GestureDropped, "as a dropped gesture");
    assertStrictEquals(dropped.listener, PANEL_LISTENER.press, "of the press");
    assertInstanceOf(dropped.cause, MarkValueUnknown, "and the drop names the mark that strayed");
    assertStrictEquals(dropped.cause.mark, PANEL_MARK.screen, "which is the screen's");
});

Deno.test("a pointer over a node with nothing to read a mark off drops no gesture", () => {
    const failures: ViewFailure[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onFailure: (failure) => failures.push(failure),
    });
    panel.renderWaiting(NOTHING_WAITING);
    const host = panel.element as FakeElement;
    // A text node, as a browser can hand one: no `getAttribute` to read a card off.
    const textNode = {} as unknown as FakeElement;
    for (const type of ["pointermove", "pointerout"]) {
        for (const handle of host.rootListeners.get(type) ?? []) {
            handle({ target: textNode, relatedTarget: textNode, clientY: 0 });
        }
    }
    assertEquals(failures, [], "it states no card, and neither listener is dropped");
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
        get sides(): ScreenContent["sides"] {
            throw new RangeError("a summary that will not draw");
        },
        get suspicions(): ScreenContent["suspicions"] {
            throw new RangeError("and warnings that will not either");
        },
    };
    const report = panel.render(composeShownScreen(broken));
    assertEquals(
        report.undrawn.map((regionUndrawn) => [regionUndrawn.name, regionUndrawn.region]),
        [
            ["RegionUndrawn", PANEL_REGION.sides],
            ["RegionUndrawn", PANEL_REGION.suspicions],
        ],
        "each region it cost, in the order it was drawn",
    );
    assert(report.undrawn.every(isCaughtRangeError), "with its cause");
});

/** What a region cost, caught at its guard: a throw of ours, carried as the cause. */
function isCaughtRangeError(regionUndrawn: RegionUndrawn): boolean {
    if (!(regionUndrawn.cause instanceof errors.Caught)) return false;
    return regionUndrawn.cause.cause instanceof RangeError;
}

function readFight(): ScreenContent {
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    return presentScreen(
        statistics,
        roster,
        PANEL_METRIC.damageDealt,
        SIDE_CHOICE.everyone,
        null,
        NOTHING_SUSPECT,
    );
}

Deno.test("pinned rows that will not be read cost their own two regions, not the panel", () => {
    const panel = initTestView(composeFakeDocument());
    const reading = readFight();
    const broken = {
        ...reading,
        get pinned(): ScreenContent["pinned"] {
            throw new RangeError("pinned rows that will not be read");
        },
    };
    const report = panel.render(composeShownScreen(broken));
    assertEquals(
        report.undrawn.map((regionUndrawn) => regionUndrawn.region),
        [PANEL_REGION.pinned, PANEL_REGION.pinned],
        "each pinned row's own region, and nothing past them",
    );
});

Deno.test("a card that will not draw under the pointer is told to the sink as the card", () => {
    const document = composeFakeDocument();
    const failures: ViewFailure[] = [];
    const panel = initTestView(document, { onFailure: (failure) => failures.push(failure) });
    panel.render(composeShownScreen(readFight()));
    const host = panel.element as FakeElement;
    const row = getElementsWithin(host).find((descendant) =>
        descendant.attributes.has("data-card")
    );
    assertExists(row, "a row carries a card");
    const createElement = document.createElement;
    document.createElement = () => {
        throw new RangeError("a document that will not make one");
    };
    pointAtElement(host, "pointermove", row, 200);
    document.createElement = createElement;
    assertEquals(
        failures.map((failure) => failure instanceof RegionUndrawn ? failure.region : failure.name),
        [PANEL_REGION.card],
        "no render was running, so the card is the sink's to hear of",
    );
    const card = host.shadow?.find((shadowChild) =>
        shadowChild.className.startsWith("MargoMeter-card")
    );
    assertStrictEquals(
        card?.className,
        "MargoMeter-card card-hidden",
        "and the card standing hides",
    );
});

/**
 * The seam the card handle's own suite cannot reach: a card placed at its line bound is told to
 * the sink as the card, whose region is where a reader is told (**S11**).
 */
Deno.test("a card counted past its line bound is told to the sink as the card", () => {
    const failures: ViewFailure[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onFailure: (failure) => failures.push(failure),
    });
    const drawCharge = (combatantId: number, skillName: string) => {
        panel.renderHelper({
            turnState: STANDING_TURN_STATE.held,
            turnOrdinal: null,
            turnHolder: null,
            provocations: [],
            chargedSkills: [{
                combatantId,
                name: "Hildur",
                skillName,
                turnsElapsed: 1,
                turnsStated: 3,
                state: CHARGED_SKILL_STATE.charging,
                colour: SIGNAL.ours,
                sideRelation: SIDE_RELATION.reader,
            }],
            hasFiguresDisagreed: false,
        }, false);
        const host = panel.element as FakeElement;
        const row = getElementsWithin(host).find((descendant) =>
            descendant.attributes.get("data-card") === `helper:charge:${combatantId}`
        );
        assertExists(row, "the charge's row carries a card");
        pointAtElement(host, "pointermove", row, 200);
    };
    drawCharge(7, "Lodowe Pandemonium");
    assertEquals(failures, [], "a card of a few lines tells nothing");
    // A name runs a line for every 27 characters a card is counted at, so this one runs past it.
    drawCharge(8, "x".repeat(27 * CARD_LINES_MAXIMUM));
    assertEquals(
        failures.map((failure) => failure instanceof RegionUndrawn ? failure.region : failure.name),
        [PANEL_REGION.card],
        "one past it is the card's region, told to the sink",
    );
    const [told] = failures;
    assertInstanceOf(told, RegionUndrawn, "as a region undrawn");
    assertInstanceOf(told.cause, CardLinesExceeded, "and the bound is its cause");
});

Deno.test("a region kept after a refused replace is the one the next draw replaces", () => {
    const panel = initTestView(composeFakeDocument());
    const reading = readFight();
    panel.render(composeShownScreen(reading));
    const host = panel.element as FakeElement;
    const readHeaders = () =>
        getElementsWithin(host).filter((descendant) => descendant.className === "header");
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
    assertStrictEquals(readHeaders().length, 1, "and the panel holds one header, not two");
});

Deno.test("a window that will not open where told stays on the sheet's corner, and says so", () => {
    const failures: ViewFailure[] = [];
    const panel = initTestView(composeFakeDocument(), {
        onFailure: (failure) => failures.push(failure),
        meterPlacement: {
            position: null,
            size: null,
            readViewport: () => {
                throw new RangeError("a page that will not state its size");
            },
        },
    });
    const host = panel.element as FakeElement;
    assertStrictEquals(
        host.attributes.get("style"),
        undefined,
        "the sheet's corner, which is a place",
    );
    assertEquals(
        failures.map((failure) =>
            failure instanceof WindowUnplaced ? failure.window : failure.name
        ),
        [PANEL_WINDOW.meter],
        "and the window that did not open where it was told is named",
    );
});

/**
 * ⚠️ **A place the page would not take is not a place written.** The opening writes its style
 * under the same guard as its reads; a style remembered as written when the page refused it would
 * be skipped by the first drag that lands on the same place, and the window would stay on the
 * sheet's corner with the drag believing it had moved it.
 */
Deno.test("a window whose place the page will not take opens on the corner, and is dragged", () => {
    const failures: ViewFailure[] = [];
    const document = composeFakeDocument();
    let isRefusing = true;
    const createElement = document.createElement;
    document.createElement = (tag: string) => {
        const created = createElement(tag);
        const setAttribute = created.setAttribute;
        created.setAttribute = (name: string, attributeValue: string) => {
            if (isRefusing) {
                if (name === "style") throw new RangeError("a style the page will not take");
            }
            setAttribute(name, attributeValue);
        };
        return created;
    };
    const panel = initTestView(document, {
        onFailure: (failure) => failures.push(failure),
        meterPlacement: { position: null, size: null, readViewport: () => VIEWPORT },
    });
    isRefusing = false;
    const host = panel.element as FakeElement;
    assertStrictEquals(host.attributes.get("style"), undefined, "the sheet's corner, unwritten");
    assertEquals(
        failures.map((failure) =>
            failure instanceof WindowUnplaced ? failure.window : failure.name
        ),
        [PANEL_WINDOW.meter],
        "and the window the page refused is named",
    );
    panel.renderWaiting(NOTHING_WAITING);
    const bar = findMarked(host, GRIP_ATTRIBUTE);
    dragOnElement(host, "pointerdown", bar, { clientX: 100, clientY: 20 });
    dragOnElement(host, "pointermove", bar, { clientX: 100, clientY: 20 });
    assertExists(
        host.attributes.get("style"),
        "a drag landing where the window was to open writes that place, the refused write unheld",
    );
});

/**
 * A size the reader gave is written on the corner too, under a guard of its own: a page refusing
 * every style the window asks for leaves a panel on the sheet's corner, never no panel at all.
 */
Deno.test("a sized window whose place and size the page will not take still opens", () => {
    const failures: ViewFailure[] = [];
    let refusals = 0;
    const document = composeFakeDocument();
    const createElement = document.createElement;
    document.createElement = (tag: string) => {
        const created = createElement(tag);
        const setAttribute = created.setAttribute;
        created.setAttribute = (name: string, attributeValue: string) => {
            if (name === "style") {
                refusals += 1;
                throw new RangeError("a style the page will not take");
            }
            setAttribute(name, attributeValue);
        };
        return created;
    };
    const panel = initTestView(document, {
        onFailure: (failure) => failures.push(failure),
        meterPlacement: {
            position: null,
            size: { width: 320, height: 350 },
            readViewport: () => VIEWPORT,
        },
    });
    const host = panel.element as FakeElement;
    assertStrictEquals(host.attributes.get("style"), undefined, "the sheet's corner, unwritten");
    assertStrictEquals(refusals, 2, "the place refused, then the size alone");
    assertEquals(
        failures.map((failure) =>
            failure instanceof WindowUnplaced ? failure.window : failure.name
        ),
        [PANEL_WINDOW.meter, PANEL_WINDOW.meter],
        "and each refusal is named",
    );
});

Deno.test("a sized window whose place the page refuses keeps its size on the corner", () => {
    const failures: ViewFailure[] = [];
    let isRefusing = true;
    const document = composeFakeDocument();
    const createElement = document.createElement;
    document.createElement = (tag: string) => {
        const created = createElement(tag);
        const setAttribute = created.setAttribute;
        created.setAttribute = (name: string, attributeValue: string) => {
            if (name === "style") {
                if (isRefusing) {
                    isRefusing = false;
                    throw new RangeError("a place the page will not take");
                }
            }
            setAttribute(name, attributeValue);
        };
        return created;
    };
    const panel = initTestView(document, {
        onFailure: (failure) => failures.push(failure),
        meterPlacement: {
            position: null,
            size: { width: 320, height: 350 },
            readViewport: () => VIEWPORT,
        },
    });
    const style = (panel.element as FakeElement).attributes.get("style") ?? "";
    assert(style.includes("320px"), "the size the reader gave stands");
    assert(!style.includes("left"), "on the sheet's corner");
    assertStrictEquals(failures.length, 1, "and the refused place is named once");
});

Deno.test("every row the runtime's ledger can hold is drawn, a region's beside its kind's", () => {
    const draw = (defects: readonly PanelDefect[]): string[] => {
        const panel = initTestView(composeFakeDocument());
        panel.render({ ...composeShownScreen(readFight()), defects });
        return getTextsByClass(panel.element as FakeElement, "defect");
    };
    // Fill a ledger with every kind under every region and under none, which is all it can hold.
    const ledger = initDefectLedger({ console: { writeBrandedLine: () => {} } });
    const failure = new errors.Caught("a defect");
    for (const kind of Object.values(DEFECT_KIND)) {
        ledger.add({ kind, region: null, failure });
        for (const region of Object.values(PANEL_REGION)) ledger.add({ kind, region, failure });
    }
    const held = ledger.getCounts().map(({ kind, region, count }) => ({ kind, region, count }));
    assertStrictEquals(DEFECTS_MAXIMUM, ROWS_MAXIMUM, "the panel's bound is the ledger's own");
    assertStrictEquals(held.length, DEFECTS_MAXIMUM, "and a full ledger holds that many rows");
    assertStrictEquals(
        draw(held).length,
        DEFECTS_MAXIMUM,
        "and every row the ledger holds is said",
    );
    assertStrictEquals(
        draw([...held, held[0]!]).length,
        DEFECTS_MAXIMUM,
        "and a line past it is not",
    );
    assertEquals(
        draw([
            { kind: PANEL_DEFECT_KIND.region, region: null, count: 1 },
            { kind: PANEL_DEFECT_KIND.region, region: PANEL_REGION.list, count: 3 },
        ]),
        ["✖ Panel nie narysował jednej ze swoich części.", "✖ Panel nie narysował listy (3×)."],
        "a region's row beside its kind's own, worded with the region it cost and how often",
    );
    assertEquals(draw([]), [], "and none is no block at all");
});

Deno.test("a row whose card the register refuses leaves the card undrawn, said once a draw", () => {
    const charge = {
        combatantId: 7,
        name: "Hildur",
        skillName: "Lodowe Pandemonium",
        turnsElapsed: 1,
        turnsStated: 3,
        state: CHARGED_SKILL_STATE.charging,
        colour: SIGNAL.ours,
        sideRelation: SIDE_RELATION.reader,
    };
    const panel = initTestView(composeFakeDocument());
    const draw = (chargedSkills: HelperContent["chargedSkills"]) => {
        return panel.renderHelper({
            turnState: STANDING_TURN_STATE.held,
            turnOrdinal: null,
            turnHolder: null,
            provocations: [],
            chargedSkills,
            hasFiguresDisagreed: false,
        }, false).undrawn;
    };
    assertEquals(draw([charge]), [], "one charge a combatant is one key, and nothing is refused");
    const undrawn = draw([charge, charge, charge]);
    assertStrictEquals(undrawn.length, 1, "two rows under one key are said once, not per row");
    const [refusal] = undrawn;
    assertStrictEquals(refusal?.region, PANEL_REGION.card, "as the card's region undrawn");
    assertInstanceOf(refusal?.cause, CardRefused, "and the refusal is its cause");
    assertStrictEquals(refusal.cause.key, "helper:charge:7", "naming the key it refused");
    assertEquals(draw([charge]), [], "and the next draw starts with nothing refused");
    // The panel's own register, which the ranking fills, reports a refusal the same way.
    const meter = initTestView(composeFakeDocument());
    const reading = readFight();
    const [leader] = reading.rows;
    assertExists(leader, "the fight ranks somebody");
    const twice = meter.render(composeShownScreen({ ...reading, rows: [...reading.rows, leader] }));
    assertEquals(
        twice.undrawn.map((failure) => [failure.region, failure.cause instanceof CardRefused]),
        [[PANEL_REGION.card, true]],
        "a row ranked twice is one refusal, on the panel as beside it",
    );
    assertEquals(meter.render(composeShownScreen(reading)).undrawn, [], "and none once it is not");
});
