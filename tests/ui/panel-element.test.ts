/**
 * What the panel puts on the page, read back out of the document it was handed.
 *
 * The reading it draws comes from a real recording through every layer beneath it, so what is on
 * screen here is what would be on screen in play.
 */

import { assert, assertEquals } from "@std/assert";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { BUILD_VERSION } from "@/src/build-version.ts";
import { composePanelHost, type PanelPress } from "@/src/ui/panel-element.ts";
import {
    composeDrillReading,
    composePanelReading,
    type PanelReading,
} from "@/src/ui/panel-reading.ts";
import { CLASS, composeBarColour, getColourForProfession } from "@/src/ui/panel-look.ts";
import { getScreenFromName, SCREEN_ORDER, SHELF_SCREEN } from "@/src/ui/panel-screen.ts";
import { composeShareText, getWordsForElement, PANEL_WORDS } from "@/src/ui/panel-words.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    pointAtElement,
    pressElement,
} from "@/tests/fake-document.ts";
import { getRecordedCombatants, getRecordedPayloads } from "@/tests/recorded-fight.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur.json";

function readFight(): PanelReading {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    return composePanelReading(
        composeFightStatistics(events, composeTeamHeals(events, roster)),
        roster,
        "damageDealtApplied",
    );
}

function openFirstRow() {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    const reading = composePanelReading(statistics, roster, "damageDealtApplied");
    const first = reading.rows[0];
    assert(first !== undefined, "there is a row to open");
    const drill = composeDrillReading(statistics, roster, "damageDealtApplied", first.combatantId);
    assert(drill !== null, "and the screen it sits on cuts further");
    return { reading, drill, opened: first };
}

function draw(reading: PanelReading): FakeElement {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading: reading,
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill: null,
        place: null,
        isCollapsed: false,
    });
    return panel.element as FakeElement;
}

Deno.test("the panel goes into a shadow root, under a name of ours", () => {
    const host = draw(readFight());
    assertEquals(host.attributes.get("id"), "MargoMeter-Panel", "the host is named as ours");
    assert(host.shadow !== null, "and everything else is behind a root of its own");
    assertEquals(host.children.length, 0, "nothing is put beside the root");
    assertEquals(host.shadow.length, 6, "look, bar, strip, body, summary, and the detail last");
});

Deno.test("every name a reader meets before the panel's contents is ours", () => {
    const host = draw(readFight());
    const outside = [host, ...(host.shadow ?? [])];
    for (const element of outside) {
        if (element.className === "") continue;
        assert(element.className.startsWith("MargoMeter-"), `${element.className} is unprefixed`);
    }
    const inside = getElementsWithin(host).filter((one) => !outside.includes(one));
    assert(inside.length > 0, "and there is something inside the root to be exempt");
    assert(
        inside.some((one) => !one.className.startsWith("MargoMeter-")),
        "which is exempt, because the game's stylesheet cannot reach behind the root",
    );
});

Deno.test("the strip says which screen the panel is on, and marks it as more than a colour", () => {
    const host = draw(readFight());
    const tabs = getElementsWithin(host).filter((one) => one.className.startsWith("tab"));
    // The screens the figures live on, and the shelf beside them, which is not a figure.
    assertEquals(tabs.length, SCREEN_ORDER.length + 1, "one tab for each screen there is");
    const current = tabs.filter((one) => one.className.includes("tab-current"));
    assertEquals(current.length, 1, "exactly one of them is where the panel is");
    assert(current[0]?.textContent.startsWith("• "), "and it is marked, not only tinted");
    for (const tab of tabs) {
        const screen = tab.attributes.get("data-screen");
        assert(screen !== undefined, "each tab says which screen it would reach");
        // The shelf is a screen the strip draws and not a figure, so it answers to its own name
        // rather than to a metric's.
        assert(
            getScreenFromName(screen) !== null || screen === SHELF_SCREEN,
            "by a name a screen answers to",
        );
    }
});

Deno.test("a fight draws a row for everybody in it, named", () => {
    const reading = readFight();
    const host = draw(reading);
    // A pinned row is a row of the same shape, so the two are counted by the class that separates
    // them rather than by the name each carries.
    const rows = getElementsWithin(host).filter((one) => one.className === "row");
    assertEquals(rows.length, reading.rows.length, "one row for each of them");
    for (const row of rows) {
        const name = row.children.find((one) => one.className === "row-name");
        assert(name !== undefined, "each row says who it is about");
        assert(name.textContent.length > 0, "and says it in words");
    }
    const figures = getTextsByClass(host, "row-figure");
    assertEquals(figures[0], `${reading.rows[0]?.figure}`, "with the figure the reading holds");
});

Deno.test("a fight nothing has happened in says so, rather than drawing nothing", () => {
    const host = draw({ rows: [], total: 0, withoutActor: 0, withoutTarget: 0, isSuspect: false });
    assertEquals(getTextsByClass(host, "empty"), [PANEL_WORDS.nothingYet], "it says so in words");
    assertEquals(getTextsByClass(host, "row-name"), [], "and draws no row at all");
});

Deno.test("what nobody can be charged with is a row apart from the ranking", () => {
    const reading = readFight();
    const host = draw(reading);
    assert(reading.withoutActor > 0, "this fight has damage tied to no attacker");
    const pinned = getElementsWithin(host).filter((one) => one.className === "pinned");
    assertEquals(pinned.length, 1, "which stands below the ranking as a row of its own");
});

Deno.test("the fight's own strip always draws, and a doubt rides it rather than the rows", () => {
    const reading = readFight();
    const host = draw(reading);
    const strip = getElementsWithin(host).filter((one) => one.className === "MargoMeter-summary");
    assertEquals(strip.length, 1, "the strip is there whether or not anything went wrong");
    assertEquals(
        getTextsByClass(host, "summary-figure"),
        [`${reading.total}`],
        "carrying the fight's own total for the screen being read",
    );
    assertEquals(
        getTextsByClass(host, "warning"),
        [],
        "and nothing here is short, so none is said",
    );

    const short = draw({ ...reading, isSuspect: true });
    assertEquals(
        getTextsByClass(short, "warning"),
        [`△ ${PANEL_WORDS.suspect}`],
        "a doubt is said in words, behind a glyph, since colour never carries it alone",
    );
    const marks = getElementsWithin(short).filter((one) => one.className === "warning");
    assertEquals(marks.length, 1, "said once");
    const body = getElementsWithin(short).find((one) => one.className === "MargoMeter-body");
    assert(body !== undefined, "the body is a region of its own");
    const under = getElementsWithin(body).filter((one) => one.className === "warning");
    assertEquals(under, [], "and the doubt is not one of the things standing in it");
});

Deno.test("every listener sits on the root, where a press is not retargeted", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    const host = panel.element as FakeElement;
    // Outside a shadow root a press is retargeted to the host, so a listener there reads null off
    // every attribute the panel writes. `PanelElement` carries no `addEventListener` for that
    // reason; this holds the other half, which is that the root got one of each and no more.
    assertEquals(
        [...host.rootListeners.keys()],
        ["pointerdown", "pointermove", "pointerout"],
        "a press, a move that opens the detail, and the leave that closes it",
    );
    for (const type of host.rootListeners.keys()) {
        assertEquals(host.rootListeners.get(type)?.length, 1, `${type} is listened for once`);
    }
    for (const element of getElementsWithin(host)) {
        assertEquals(element.rootListeners.size, element === host ? 3 : 0, "no row carries one");
    }
});

Deno.test("a press on a tab reaches the panel, and a press on anything else does not", () => {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const tabs = getElementsWithin(host).filter((one) => one.className.startsWith("tab"));
    const other = tabs[1];
    assert(other !== undefined, "there is a screen to reach for");
    pressElement(host, "pointerdown", other);
    assertEquals(pressed, [{ kind: "screen", screen: "damageTakenApplied" }], "the tab's screen");

    const title = getElementsWithin(host).find((one) => one.className.endsWith("titlebar"));
    assert(title !== undefined, "there is something that is not a tab to press");
    pressElement(host, "pointerdown", title);
    assertEquals(pressed.length, 1, "the bar asks for nothing, so pressing it moves nothing");
});

Deno.test("the listener outlives a redraw, because the host does", () => {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const before = getElementsWithin(host).filter((one) => one.className.startsWith("tab")).length;

    panel.show({
        reading: readFight(),
        current: "healthRestored",
        shelf: [],
        isOnShelf: false,
        drill: null,
        place: null,
        isCollapsed: false,
    });
    const tabs = getElementsWithin(host).filter((one) => one.className.startsWith("tab"));
    assertEquals(tabs.length, before, "the strip is drawn again, not drawn twice");
    const current = tabs.filter((one) => one.className.includes("tab-current"));
    assertEquals(current[0]?.attributes.get("data-screen"), "healthRestored", "on the new screen");

    const tab = tabs[0];
    assert(tab !== undefined, "and the strip still has tabs");
    pressElement(host, "pointerdown", tab);
    assertEquals(
        pressed.at(-1),
        { kind: "screen", screen: "damageDealtApplied" },
        "after a redraw",
    );
});

Deno.test("a region that cannot be drawn is replaced by itself, and the rest stands", () => {
    const document = composeFakeDocument();
    const failures: unknown[] = [];
    const reading = readFight();
    const broken: PanelReading = {
        ...reading,
        get rows(): never {
            throw new RangeError("a region of ours failed");
        },
    };
    const panel = composePanelHost(document, () => {}, (failure) => failures.push(failure));
    panel.show({
        reading: broken,
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    assertEquals(failures.length, 1, "the failure is reported once");
    assertEquals(getTextsByClass(host, "undrawn"), [PANEL_WORDS.undrawn], "and marked in place");
    assertEquals(host.shadow?.length, 6, "while the panel keeps its shape");
    assertEquals(getTextsByClass(host, "title-name"), [PANEL_WORDS.title], "the title stands");
});

Deno.test("an opened row stands over the screen, and states whose it is", () => {
    const { reading, drill, opened } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const within = getElementsWithin(host);
    const head = within.filter((one) => one.className === "drill-head");
    assertEquals(head.length, 1, "one heading, saying whose row is open");
    assertEquals(getTextsByClass(host, "row-name")[0], opened.name, "and it names that combatant");
    const rows = within.filter((one) => one.className === "row");
    assertEquals(
        rows.length,
        drill.byOpponent.length + drill.byElement.length,
        "a row for each part of the figure, in either cut",
    );
    const sections = getTextsByClass(host, "section");
    assertEquals(sections, [PANEL_WORDS.dealtTo, PANEL_WORDS.damageKind], "one heading per cut");
    const named = getTextsByClass(host, "row-name");
    // The kinds this fight's top dealer carries, and none of them the physical one.
    assert(named.includes("ogień"), "and a kind is drawn in the reader's words");
    assert(!named.includes("dmgf"), "never under the token the protocol stated it on");
    assert(rows.every((one) => one.attributes.get("data-row") === undefined), "opening no further");
    const crumb = within.filter((one) => one.className === "crumb");
    assertEquals(crumb.length, 1, "and one way back");
});

Deno.test("a ranking row's bar is its profession's, and colourless without one", () => {
    const reading = readFight();
    const host = draw(reading);
    const rows = getElementsWithin(host).filter((one) => one.className === "row");
    assertEquals(rows.length, reading.rows.length, "a row for each combatant");
    for (const [at, drawn] of rows.entries()) {
        const row = reading.rows[at];
        assert(row !== undefined, "a row drawn is a row the reading holds");
        const hue = composeBarColour(getColourForProfession(row.profession));
        const bar = drawn.attributes.get("style") ?? "";
        assert(bar.includes(hue), `${row.profession}: the bar is drawn in that profession's hue`);
        assert(bar.includes(`${row.share * 100}%`), "and stops where that row's share does");
    }
    const nobody = composeBarColour(getColourForProfession(null));
    const colourless = rows.filter((one) => (one.attributes.get("style") ?? "").includes(nobody));
    // Every combatant in `captures/` states a profession, measured 2026-08-29, so the colourless
    // bar is reachable only through a roster that says nothing — which is what the next line does.
    assertEquals(colourless, [], "this fight names a profession for everybody in it");
    const unstated = draw({
        ...reading,
        rows: reading.rows.map((one) => ({ ...one, profession: null })),
    });
    const bars = getElementsWithin(unstated).filter((one) => one.className === "row");
    assert(bars.length > 0, "there are rows to draw");
    for (const one of bars) {
        assert(
            (one.attributes.get("style") ?? "").includes(nobody),
            "each takes the colourless one",
        );
    }
});

Deno.test("a kind's row carries its share as the row's own background", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const barred = getElementsWithin(host).filter((one) => {
        return one.attributes.get("style") !== undefined;
    });
    assertEquals(
        barred.length,
        drill.byOpponent.length + drill.byElement.length,
        "a bar on every row of both cuts, and on nothing that is not a row",
    );
    const first = barred[drill.byOpponent.length];
    assert(first !== undefined, "there is a kind to draw a bar for");
    const drawn = first.attributes.get("style") ?? "";
    assert(
        drawn.startsWith("background-image:"),
        "the bar is the row's background, not an element",
    );
    const largest = drill.byElement[0];
    assert(largest !== undefined, "the largest kind is the first drawn");
    assert(drawn.includes(`${largest.share * 100}%`), "and it stops where that kind's share does");
});

Deno.test("a part of a figure no kind was stated for is a row apart, below the kinds", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        // Health that went down outside a blow, which the protocol states carrying no kind.
        drill: { ...drill, withoutElement: 140 },
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const pinned = getElementsWithin(host).filter((one) => one.className === "pinned");
    assertEquals(pinned.length, 1, "one row apart from the kinds that were stated");
    const named = getTextsByClass(host, "row-name");
    assertEquals(named[named.length - 1], PANEL_WORDS.withoutKind, "drawn last, under the kinds");
    const figures = getTextsByClass(host, "row-figure");
    assertEquals(figures[figures.length - 1], "140", "at what fell outside every kind");
});

Deno.test("pressing a row asks to open it, and the way back asks to close it", () => {
    const { reading, drill } = openFirstRow();
    const pressed: PanelPress[] = [];
    const document = composeFakeDocument();
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    // The press lands on the deepest element under the pointer, which is the name inside the row.
    const name = getElementsWithin(host).find((one) => one.className === "row-name");
    assert(name !== undefined, "there is a row to press");
    pressElement(host, "pointerdown", name);
    assertEquals(pressed, [{ kind: "row", stated: `${reading.rows[0]?.combatantId}` }], "that row");

    panel.show({
        reading,
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill,
        place: null,
        isCollapsed: false,
    });
    const crumb = getElementsWithin(host).find((one) => one.className === "crumb");
    assert(crumb !== undefined, "an opened row has a way back");
    pressElement(host, "pointerdown", crumb);
    assertEquals(pressed.at(-1), { kind: "back" }, "which asks for nothing but the way back");
});

Deno.test("the bar says where the fight is being fought, and stays a bar without it", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    const view = {
        reading: readFight(),
        current: "damageDealtApplied" as const,
        shelf: [],
        isOnShelf: false,
        drill: null,
        isCollapsed: false,
    };
    panel.show({ ...view, place: "Mapa (12, 34)" });
    const host = panel.element as FakeElement;
    assertEquals(getTextsByClass(host, "place"), ["Mapa (12, 34)"], "the place, in the bar");
    assertEquals(getTextsByClass(host, "title-name"), [PANEL_WORDS.title], "beside the name");

    panel.show({ ...view, place: null });
    assertEquals(getTextsByClass(host, "place"), [], "and nothing at all where nothing was said");
    assertEquals(getTextsByClass(host, "title-name"), [PANEL_WORDS.title], "the bar standing on");
});

Deno.test("a folded panel is its bar and nothing else, and offers the way back", () => {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    const host = panel.element as FakeElement;
    const view = {
        reading: readFight(),
        current: "damageDealtApplied" as const,
        shelf: [],
        isOnShelf: false,
        drill: null,
        place: null,
        isCollapsed: false,
    };

    panel.show(view);
    // A block body, not an expression: the recursion guard reads a one-line named arrow as
    // opening no brace, and so reads every line after it as this function's body — gap 13.
    const controls = () => {
        return getElementsWithin(host).filter((one) => one.className === CLASS.control);
    };
    assertEquals(controls().length, 2, "the bar carries the save and the fold, in that order");
    const control = controls().find((one) => one.attributes.has("data-fold"));
    assert(control !== undefined, "an unfolded panel carries the control that folds it");
    assertEquals(control.textContent, "\u2014", "which says what a press would do");
    assertEquals(control.attributes.get("title"), PANEL_WORDS.collapse, "in the reader's words");
    assert(getElementsWithin(host).some((one) => one.className === "row"), "and draws a ranking");
    pressElement(host, "pointerdown", control);
    assertEquals(pressed.at(-1), { kind: "fold" }, "and a press on it asks for the fold");

    panel.show({ ...view, isCollapsed: true });
    const folded = getElementsWithin(host).filter((one) => one.className.endsWith(CLASS.folded));
    assertEquals(folded.length, 3, "the three regions under the bar are folded away");
    assertEquals(folded.map((one) => one.textContent), ["", "", ""], "each saying nothing at all");
    assertEquals(
        getElementsWithin(host).filter((one) => one.className === "row").length,
        0,
        "and no row is composed for a screen nobody is looking at",
    );
    const back = controls().find((one) => one.attributes.has("data-fold"));
    assert(back !== undefined, "the bar is still a bar, and still carries its controls");
    assertEquals(back.textContent, "+", "which now offers the way back rather than the way in");
    assertEquals(back.attributes.get("title"), PANEL_WORDS.expand, "and says so in the same words");
    assertEquals(getTextsByClass(host, "title-name"), [PANEL_WORDS.title], "the name standing on");
});

Deno.test("the panel says which build drew it, in the bar and on the host", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    const host = panel.element as FakeElement;
    assertEquals(
        host.attributes.get("data-margometer-version"),
        BUILD_VERSION,
        "the host states it where anything outside the root can read it",
    );
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill: null,
        isCollapsed: false,
        place: "Mapa (12, 34)",
    });
    assertEquals(
        getTextsByClass(host, "title-version"),
        [BUILD_VERSION],
        "and the bar says it once, beside the name",
    );
    assertEquals(getTextsByClass(host, "place"), ["Mapa (12, 34)"], "with the place still drawn");
});

/** Whatever the detail is saying right now, read back out of the root it stands in. */
function readTip(host: FakeElement): { className: string; lines: string[] } {
    const tip = (host.shadow ?? []).find((one) => one.className.startsWith(CLASS.tip));
    assert(tip !== undefined, "the detail is a region of the panel like any other");
    return {
        className: tip.className,
        lines: [
            ...getTextsByClass(tip, CLASS.tipName),
            ...getTextsByClass(tip, CLASS.tipLabel),
            ...getTextsByClass(tip, CLASS.tipValue),
        ],
    };
}

Deno.test("every row a reader can point at says which detail is its own", () => {
    const host = draw(readFight());
    const rows = getElementsWithin(host).filter((one) => one.className === "row");
    assert(rows.length > 0, "a fight draws rows");
    for (const row of rows) {
        const key = row.attributes.get("data-tip");
        assert(key !== undefined, "a row carries the name its detail is filed under");
        // A pointer lands on the deepest element under it, so every part wears the row's mark.
        for (const part of row.children) {
            assertEquals(part.attributes.get("data-tip"), key, "and so does every part of it");
        }
    }
});

Deno.test("pointing at a row opens the name it cut and the share it never printed", () => {
    const reading = readFight();
    const host = draw(reading);
    assertEquals(readTip(host).lines, [], "a panel nobody has pointed at says nothing");
    const first = reading.rows[0];
    assert(first !== undefined, "there is a row to point at");
    const name = getElementsWithin(host).find((one) => one.className === "row-name");
    assert(name !== undefined, "whose name is the deepest thing under the pointer");
    pointAtElement(host, "pointermove", name, 412);

    const shown = readTip(host);
    assertEquals(shown.className, CLASS.tip, "which opens the detail");
    assertEquals(
        shown.lines,
        [
            first.name ?? PANEL_WORDS.unknown,
            PANEL_WORDS.damageDealt,
            PANEL_WORDS.shareOfFight,
            `${first.figure}`,
            composeShareText(first.share),
        ],
        "the name in full, what the figure is, and the share the bar draws and no row spells",
    );

    pointAtElement(host, "pointerout", name, 412);
    assertEquals(readTip(host).className, `${CLASS.tip} ${CLASS.tipHidden}`, "and leaving closes");
});

Deno.test("a share inside an opened row is of that row, never of the fight", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        shelf: [],
        isOnShelf: false,
        drill,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const kind = drill.byElement[0];
    assert(kind !== undefined, "the opened row is cut by kind");
    const rows = getElementsWithin(host).filter(
        (one) => one.attributes.get("data-tip") === `kind:${kind.element}`,
    );
    const first = rows[0];
    assert(first !== undefined, "and that cut is a row somebody can point at");
    pointAtElement(host, "pointermove", first, 300);
    assertEquals(
        readTip(host).lines,
        [
            getWordsForElement(kind.element),
            PANEL_WORDS.damageDealt,
            PANEL_WORDS.shareOfFigure,
            `${kind.figure}`,
            composeShareText(kind.share),
        ],
        "a kind is a share of the figure standing open above it",
    );
});

Deno.test("a shelf row opens the place its own cell had to cut", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        shelf: [{ openedAt: 17, place: "Bagno Wisielców (128, 74)", combatants: 11 }],
        isOnShelf: true,
        drill: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const row = getElementsWithin(host).find((one) =>
        one.attributes.get("data-tip") === "shelf:17"
    );
    assert(row !== undefined, "a fight on the shelf is a row somebody can point at");
    pointAtElement(host, "pointermove", row, 120);
    assertEquals(
        readTip(host).lines,
        ["Bagno Wisielców (128, 74)", PANEL_WORDS.combatants, "11"],
        "the place whole, and how many were in it",
    );
});
