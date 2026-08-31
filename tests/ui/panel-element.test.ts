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
    composePairReading,
    composePanelReading,
    composePartReading,
    NOTHING_MISSED,
    type PanelMetric,
    type PanelReading,
} from "@/src/ui/panel-reading.ts";
import { CLASS, composeStyleSheet, getColourForProfession } from "@/src/ui/panel-look.ts";
import {
    composeDirectionTabs,
    composeNounTabs,
    composeSideTabs,
    getScreenFromName,
    getWordsForScreen,
    SCREEN_ORDER,
} from "@/src/ui/panel-screen.ts";
import {
    CARD_WORDS,
    composeCardSubtitleText,
    composeFigureText,
    composeUndrawnText,
    getWordsForCardMetric,
    getWordsForDamageKind,
    getWordsForHealthSource,
    getWordsForNothing,
    getWordsForOutcome,
    getWordsForStorage,
    getWordsForUnannounced,
    PANEL_WORDS,
    WARNING_MARK,
} from "@/src/ui/panel-words.ts";
import {
    composeFakeDocument,
    dragOnElement,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    pointAtElement,
    pressElement,
} from "@/tests/fake-document.ts";
import { getRecordedCombatants, getRecordedPayloads } from "@/tests/recorded-fight.ts";
import { getDeclaration, getRuleBody } from "@/tests/style-sheet.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** Whose row on _leczenie dane_ opens onto a skill that reached somebody else. */
const HEALER = 469657;
/**
 * A fight whose hardest-hit row opens onto both kinds of opponent: one the level under says more
 * about, and one it says exactly the row again about. On `HILDUR` every pair opens, because the
 * boss both strikes and wounds each member (`src/core/fight-statistics.ts`, ADR 0022).
 */
const BOTH_KINDS_OF_PAIR = "captures/2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none.json";

function readFight(): PanelReading {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    return composePanelReading(
        composeFightStatistics(events, composeTeamHeals(events, roster)),
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
}

function openFirstRow() {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    const reading = composePanelReading(
        statistics,
        roster,
        "damageDealtApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
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
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
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
    assertEquals(host.shadow.length, 4, "the look, the bar, the panel, and the detail last");
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

Deno.test("the strips say which screen the panel is on, and mark it as more than a colour", () => {
    const host = draw(readFight());
    const strips = getElementsWithin(host).filter((one) => one.className === "tabs");
    // Two rows: which quantity, then which way round. Nothing said which side is the reader's
    // own, so the second row carries no side tabs beside the directions.
    assertEquals(strips.length, 2, "which quantity, and which way round");
    const tabs = getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "tab");
    assertEquals(
        tabs.length,
        composeNounTabs("damageDealtApplied").length +
            composeDirectionTabs("damageDealtApplied").length,
        "one tab for each thing the two strips offer",
    );
    const current = tabs.filter((one) => one.className.includes("selected"));
    assertEquals(current.length, 2, "one on each strip is where the panel is");
    for (const marked of current) {
        // More than a hue: the marked tab stands on the raised surface, which is a shape.
        assert(marked.className.split(" ").length > 1, "and it is marked, not only tinted");
    }
    for (const tab of tabs) {
        const screen = tab.attributes.get("data-screen");
        assert(screen !== undefined, "each tab says which screen it would reach");
        assert(getScreenFromName(screen) !== null, "by a name a screen answers to");
    }
});

Deno.test("the side strip is drawn where the client said which side is the reader's own", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        side: "reader",
        hasReaderSide: true,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const strips = getElementsWithin(host).filter((one) => one.className === "tabs");
    assertEquals(strips.length, 2, "two rows, and whose rows shares the lower one");
    const sides = getElementsWithin(host).filter(
        (one) => one.attributes.get("data-side") !== undefined,
    );
    assertEquals(sides.length, composeSideTabs("reader").length, "one tab for each choice");
    const lower = strips[1];
    assert(lower !== undefined, "the lower row is drawn");
    assert(lower.children.includes(sides[0] ?? lower), "and the side tabs stand on it");
    assert(
        lower.children.some((one) => one.className === "tabs-gap"),
        "behind the gap that holds them against the right edge",
    );
    const marked = sides.filter((one) => one.className.includes("selected"));
    assertEquals(marked[0]?.attributes.get("data-side"), "reader", "and the chosen one is marked");
});

/**
 * The shelf covers the screen rather than being one of them, so nothing on the strips claims the
 * reader is on a screen they cannot see.
 */
Deno.test("the shelf is a screen of its own, with the way back and no strips at all", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        side: "everyone",
        hasReaderSide: true,
        shelf: [],
        isOnShelf: true,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: "Mapa (1, 2)",
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    // A header saying how this fight went, over a list of other fights, answers a question
    // nobody asked of that list; a strip picking a figure of it is the same thing twice. The one
    // strip here is the shelf's own, and it asks about the list rather than about a fight.
    const strips = getElementsWithin(host).filter((one) => one.className === "tabs");
    assertEquals(strips.length, 1, "one strip, and it is not one of the fight's");
    assertEquals(getTextsByClass(host, "tabs-label"), [PANEL_WORDS.storage], "what it asks");
    assertEquals(
        getElementsWithin(host).filter((one) => one.attributes.get("data-storage") !== undefined)
            .map((one) => one.attributes.get("data-storage")),
        ["local", "session", "memory"],
        "the three places a shelf can be kept, in the order they keep longest",
    );
    assertEquals(
        getElementsWithin(host).filter((one) => one.className === "tab selected").map((one) =>
            one.textContent
        ),
        [getWordsForStorage("local")],
        "with the reader's own answer marked as more than a colour",
    );
    assertEquals(getTextsByClass(host, "header-place"), [], "and no header of the fight's");
    assertEquals(getTextsByClass(host, "crumb-here"), [PANEL_WORDS.fights], "the shelf says so");
    assertEquals(
        getTextsByClass(host, "crumb-back"),
        [`‹ ${PANEL_WORDS.backFromFights}`],
        "and the way off it goes back to the fight rather than up the shelf",
    );

    const shelf = getElementsWithin(host).filter(
        (one) => one.attributes.get("data-shelf") !== undefined,
    );
    assertEquals(shelf.length, 1, "the shelf is reached by one control, on the bar");
    assert(shelf[0]?.className.startsWith("titlebar-button"), "a control and not a tab");
});

Deno.test("a fight draws a row for everybody in it, named", () => {
    const reading = readFight();
    const host = draw(reading);
    // A pinned row is a row of the same shape, so the two are counted by the class that separates
    // them rather than by the name each carries.
    const rows = getElementsWithin(host).filter((one) => one.className === "row drillable");
    assertEquals(rows.length, reading.rows.length, "one row for each of them");
    for (const row of rows) {
        const name = row.children.find((one) => one.className === "row-name");
        assert(name !== undefined, "each row says who it is about");
        assert(name.textContent.length > 0, "and says it in words");
    }
    const figures = getTextsByClass(host, "row-value");
    const first = reading.rows[0];
    assert(first !== undefined, "there is a first row");
    assertEquals(figures[0], composeFigureText(first.figure), "with the figure the reading holds");
    const ranks = getTextsByClass(host, "row-rank");
    assertEquals(ranks[0], "1.", "and its place in the ranking before the name");
    const shares = getTextsByClass(host, "row-share");
    assertEquals(shares[0], `(${first.shareText})`, "and the share the bar draws, in brackets");
});

Deno.test("a fight nothing has happened in says so, rather than drawing nothing", () => {
    const host = draw({
        rows: [],
        outcome: null,
        sizes: [],
        unplaced: 0,
        total: 0,
        pinned: [],
        warnings: [],
        sides: null,
        visibleRows: 11,
    });
    assertEquals(getTextsByClass(host, "empty"), [PANEL_WORDS.nothingYet], "it says so in words");
    assertEquals(getTextsByClass(host, "row-name"), [], "and draws no row at all");
});

Deno.test("what nobody can be charged with is a row apart from the ranking", () => {
    const reading = readFight();
    const host = draw(reading);
    assert(reading.pinned.length > 0, "this fight has damage tied to no attacker");
    const blocks = getElementsWithin(host).filter((one) => one.className === "pinned-region");
    assertEquals(blocks.length, 1, "which stands below the ranking in a block of its own");
    const inside = blocks[0]?.children ?? [];
    assertEquals(inside.length, 1, "holding one row");
    assert(inside[0]?.className.includes("row"), "which is a row like any other");
    const list = getElementsWithin(host).find((one) => one.className === "list");
    assert(list !== undefined, "and the list is a region of its own");
    assertEquals(
        getElementsWithin(list).filter((one) => one.className === "pinned-region"),
        [],
        "which the pinned row stands outside, so it never scrolls away",
    );
});

Deno.test("the fight is totalled in two figures, and a doubt is said under them", () => {
    const reading = readFight();
    const sides = { ours: 300, theirs: 700, nobody: 0 };
    const host = draw({ ...reading, sides });
    const strip = getElementsWithin(host).filter((one) => one.className === "MargoMeter-sides");
    assertEquals(strip.length, 1, "the strip is there whether or not anything went wrong");
    const line = getElementsWithin(host).find((one) => one.className === "sides");
    assertEquals(
        line?.children.map((one) => one.textContent),
        [composeFigureText(300), "My / Oni", composeFigureText(700)],
        "the reader's own side, what the two are, and the other side",
    );
    const track = getElementsWithin(host).find((one) => one.className === "sides-track");
    assertEquals(
        track?.children.map((one) => one.attributes.get("style")),
        ["width:30.0%", "width:70.0%"],
        "and a track split where the fight is split, with no segment for a part of nothing",
    );
    assertEquals(getTextsByClass(host, "sides-spare"), [], "and nothing said about no side");
    assertEquals(getTextsByClass(host, "warning"), [], "nothing here is short, so none is said");

    // Colour never carries a meaning alone: each figure stands beside its own label, in its own
    // fixed place, and the ink is what the segment of the track paints itself with.
    const ours = getElementsWithin(host).find((one) => one.className === "sides-ours");
    assert(ours !== undefined, "the reader's own side is named as theirs");
    assertEquals(ours.attributes.get("style"), undefined, "and no colour is written onto it");
});

Deno.test("what belongs to neither side is drawn as belonging to neither", () => {
    const reading = readFight();
    const host = draw({ ...reading, sides: { ours: 300, theirs: 600, nobody: 100 } });
    assertEquals(
        getTextsByClass(host, "sides-spare"),
        [],
        "not a line of its own text: the label and the figure are two cells inside it",
    );
    const spare = getElementsWithin(host).find((one) => one.className.includes("sides-spare"));
    assertEquals(
        spare?.children.map((one) => one.textContent),
        [PANEL_WORDS.withoutSide, composeFigureText(100)],
        "below the two, saying what cannot be charged and how much of it there is",
    );
    const track = getElementsWithin(host).find((one) => one.className === "sides-track");
    assertEquals(track?.children.length, 3, "and the track states it as a third segment");
});

Deno.test("a doubt about the reading is said under the strip, in words and once", () => {
    const reading = readFight();
    const said = "Nie udało się odczytać wszystkiego.";
    const short = draw({ ...reading, warnings: [said] });
    assertEquals(
        getTextsByClass(short, "warning"),
        [`⚠ ${said}`],
        "in words, behind a glyph, since colour never carries a meaning alone",
    );
    const list = getElementsWithin(short).find((one) => one.className === "list");
    assert(list !== undefined, "the list is a region of its own");
    const under = getElementsWithin(list).filter((one) => one.className === "warning");
    assertEquals(under, [], "and the doubt is not a row, so it never scrolls away with one");
});

/**
 * A doubt about one person goes on their row and nowhere else: a sentence under the list qualifies
 * every row on it, and a reader looking at one of them could not tell whether it meant theirs.
 * `DESIGN.md` — put a warning where its consequence is.
 */
Deno.test("a doubt about one person is a mark on their row, and on nobody else's", () => {
    const reading = readFight();
    const first = reading.rows[0];
    assert(first !== undefined, "there is a row to mark");
    const host = draw({
        ...reading,
        rows: reading.rows.map((row) =>
            row.combatantId === first.combatantId
                ? { ...row, detail: { ...row.detail, unreadMessages: 2 } }
                : row
        ),
    });
    const marks = getElementsWithin(host).filter((one) => one.className === CLASS.rowWarning);
    assertEquals(marks.length, 1, "one row wears it, out of a fight of eleven");
    assertEquals(marks[0]?.textContent, WARNING_MARK, "as a glyph, never as a colour alone");
    assertEquals(
        getTextsByClass(host, "warning"),
        [],
        "and nothing about it stands under the list",
    );

    const unmarked = draw(reading);
    assertEquals(
        getElementsWithin(unmarked).filter((one) => one.className === CLASS.rowWarning),
        [],
        "a fight nothing went unread in draws no mark at all",
    );
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
        ["pointerdown", "contextmenu", "pointermove", "pointerout"],
        "a press, the way back, a move that opens the detail, and the leave that closes it",
    );
    for (const type of host.rootListeners.keys()) {
        assertEquals(host.rootListeners.get(type)?.length, 1, `${type} is listened for once`);
    }
    for (const element of getElementsWithin(host)) {
        assertEquals(element.rootListeners.size, element === host ? 4 : 0, "no row carries one");
    }
});

Deno.test("a press on a tab reaches the panel, and a press on anything else does not", () => {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const tabs = getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "tab");
    const other = tabs.find((one) => one.attributes.get("data-screen") === "damageTakenApplied");
    assert(other !== undefined, "there is a screen to reach for");
    pressElement(host, "pointerdown", other);
    assertEquals(pressed, [{ kind: "screen", screen: "damageTakenApplied" }], "the tab's screen");

    const title = getElementsWithin(host).find((one) => one.className.endsWith("titlebar"));
    assert(title !== undefined, "there is something that is not a tab to press");
    pressElement(host, "pointerdown", title);
    assertEquals(pressed.length, 1, "the bar asks for nothing, so pressing it moves nothing");
});

/** A side is not a screen, and the one listener has to hand the two over as different presses. */
Deno.test("a press on a side asks for that side, and on the shelf for the shelf", () => {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: true,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const opposing = getElementsWithin(host).find(
        (one) => one.attributes.get("data-side") === "opposing",
    );
    assert(opposing !== undefined, "the side strip offers the other side");
    pressElement(host, "pointerdown", opposing);
    assertEquals(pressed.at(-1), { kind: "side", side: "opposing" }, "and asks for it by name");

    const shelf = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assert(shelf !== undefined, "the bar carries the shelf control");
    pressElement(host, "pointerdown", shelf);
    assertEquals(pressed.at(-1), { kind: "shelf" }, "which asks for the shelf and nothing else");
});

Deno.test("the listener outlives a redraw, because the host does", () => {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const before = getElementsWithin(host).filter((one) => one.className === "tabs").length;

    panel.show({
        reading: readFight(),
        current: "healthRestored",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const tabs = getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "tab");
    assertEquals(
        getElementsWithin(host).filter((one) => one.className === "tabs").length,
        before,
        "the strips are drawn again, not drawn twice",
    );
    assertEquals(
        tabs.length,
        composeNounTabs("healthRestored").length + composeDirectionTabs("healthRestored").length,
        "and each carries what the new screen puts on it",
    );
    const current = tabs.filter((one) => one.className.includes("selected"));
    // The marked noun carries the screen it would cross to, which for the noun already being
    // read is the screen itself: crossing back keeps the direction rather than turning it round.
    assertEquals(
        current.map((one) => one.attributes.get("data-screen")),
        ["healthRestored", "healthRestored"],
        "both strips are on the new screen",
    );

    const tab = tabs[0];
    assert(tab !== undefined, "and the strips still have tabs");
    pressElement(host, "pointerdown", tab);
    // The damage noun, which from healing received crosses to damage received: a press reaches
    // the listener the host has carried since before either redraw.
    assertEquals(
        pressed.at(-1),
        { kind: "screen", screen: "damageTakenApplied" },
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
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    assertEquals(failures.length, 1, "the failure is reported once");
    assertEquals(
        getTextsByClass(host, "undrawn"),
        [composeUndrawnText("list")],
        "and the region that failed says so in its own place, naming itself",
    );
    assertEquals(host.shadow?.length, 4, "while the panel keeps its shape");
    const bar = getElementsWithin(host).find((one) => one.className === "MargoMeter-titlebar");
    assert(
        bar?.textContent.endsWith(PANEL_WORDS.title),
        "the bar stands, saying whose panel it is",
    );
});

/** How many rows an opened figure draws, over all three of its cuts. */
function countDrillRows(drill: {
    byOpponent: { rows: unknown[]; unnamed: unknown };
    bySkill: { rows: unknown[]; plain: unknown };
    byElement: { rows: unknown[]; unnamed: unknown };
}): number {
    const held = (rows: unknown[], extra: unknown) => rows.length + (extra === null ? 0 : 1);
    return held(drill.byOpponent.rows, drill.byOpponent.unnamed) +
        held(drill.bySkill.rows, drill.bySkill.plain) +
        held(drill.byElement.rows, drill.byElement.unnamed);
}

Deno.test("an opened row stands over the screen, and states whose it is", () => {
    const { reading, drill, opened } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const within = getElementsWithin(host);
    const crumbs = getTextsByClass(host, "crumb-here");
    assertEquals(crumbs, [opened.name], "the way back names whose row stands open");
    const rows = within.filter((one) => one.className.split(" ")[0] === "row");
    assertEquals(rows.length, countDrillRows(drill), "a row for each part of it, in each cut");
    // A person opens where the pair says something; a kind and a skill open nothing at all.
    const opening = rows.filter((one) => one.attributes.get("data-row") !== undefined);
    assertEquals(
        opening.length,
        drill.byOpponent.rows.filter((one) => one.opensPair).length,
        "and the ones that open are the people the level under them would say something about",
    );
    const sections = getElementsWithin(host).filter((one) => one.className === "section-heading");
    assertEquals(
        sections.map((one) => one.children[0]?.textContent),
        [PANEL_WORDS.dealtTo, PANEL_WORDS.skills, PANEL_WORDS.damageKind],
        "one heading per cut: whom it reached, what it was done with, what it was made of",
    );
    for (const section of sections) {
        assertEquals(
            section.children[1]?.textContent,
            composeFigureText(drill.total),
            "each standing over the figure it cuts, so a share is read against what it is of",
        );
    }
    const named = getTextsByClass(host, "row-name");
    // The kinds this fight's top dealer carries, and none of them the physical one.
    assert(named.includes("ogień"), "and a kind is drawn in the reader's words");
    assert(!named.includes("dmgf"), "never under the token the protocol stated it on");
    const kinds = rows.filter((one) => one.className === "row leaf");
    assert(kinds.length > 0, "a kind and a skill are leaves");
    assert(
        kinds.every((one) => one.attributes.get("data-row") === undefined),
        "and neither of them opens any further",
    );
    const crumb = within.filter((one) => one.className === "crumb");
    assertEquals(crumb.length, 1, "and one way back");
});

Deno.test("a ranking row's bar is its profession's, and colourless without one", () => {
    const reading = readFight();
    const host = draw(reading);
    const rows = getElementsWithin(host).filter((one) => one.className === "row drillable");
    assertEquals(rows.length, reading.rows.length, "a row for each combatant");
    for (const [at, drawn] of rows.entries()) {
        const row = reading.rows[at];
        assert(row !== undefined, "a row drawn is a row the reading holds");
        const hue = getColourForProfession(row.profession);
        const bar = drawn.children.find((one) => one.className === "bar");
        const drawnBar = bar?.attributes.get("style") ?? "";
        assert(drawnBar.includes(hue), `${row.profession}: the bar wears that profession's hue`);
        // Against the biggest figure on the screen and never against the whole: the top row is a
        // full bar, which is the length every row below it is read against.
        assert(drawnBar.includes(`${(row.fill * 100).toFixed(1)}%`), "and is that long");
        const cap = drawn.children.find((one) => one.className === "bar-cap");
        assert((cap?.attributes.get("style") ?? "").includes(hue), "and the cap is the full hue");
    }
    const nobody = getColourForProfession(null);
    const colourless = rows.filter((one) =>
        (one.children.find((part) => part.className === "bar")?.attributes.get("style") ?? "")
            .includes(nobody)
    );
    // Every combatant in `captures/` states a profession, measured 2026-08-29, so the colourless
    // bar is reachable only through a roster that says nothing — which is what the next line does.
    assertEquals(colourless, [], "this fight names a profession for everybody in it");
    const unstated = draw({
        ...reading,
        rows: reading.rows.map((one) => ({ ...one, profession: null })),
    });
    const bars = getElementsWithin(unstated).filter((one) => one.className === "bar");
    assert(bars.length > 0, "there are rows to draw");
    for (const one of bars) {
        assert((one.attributes.get("style") ?? "").includes(nobody), "each takes the colourless");
    }
});

Deno.test("a kind's row carries a bar of its own, measured against its own cut", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const bars = getElementsWithin(host).filter((one) => one.className === "bar");
    assertEquals(
        bars.length,
        countDrillRows(drill),
        "a bar on every row of every cut, and no more",
    );
    const largest = drill.byElement.rows[0];
    assert(largest !== undefined, "the largest kind is the first drawn");
    assertEquals(largest.fill, 1, "and fills its row, being the biggest of its own cut");
    const before = drill.byOpponent.rows.length + unnamedBefore(drill) +
        drill.bySkill.rows.length + (drill.bySkill.plain === null ? 0 : 1);
    const drawn = bars[before];
    assert(drawn !== undefined, "there is a kind to draw a bar for");
    const style = drawn.attributes.get("style") ?? "";
    // Colourless, like every row that names no combatant: the hue on this panel says who.
    assert(style.includes(getColourForProfession(null)), "in the colour of no category at all");
    assert(style.includes("width:100.0%"), "and the length its share of the cut states");
});

/** How many rows the cut by whom drew before the kinds start, its unnamed part included. */
function unnamedBefore(drill: { byOpponent: { unnamed: unknown } }): number {
    return drill.byOpponent.unnamed === null ? 0 : 1;
}

Deno.test("a part of a figure no kind was stated for is drawn last, under the kinds", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        // Health that went down outside a blow, which the protocol states carrying no kind.
        drill: {
            ...drill,
            byElement: {
                ...drill.byElement,
                unnamed: { figure: 140, fill: 0.1, shareText: "<1%" },
            },
        },
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const named = getTextsByClass(host, "row-name");
    assertEquals(named[named.length - 1], PANEL_WORDS.withoutKind, "drawn last, under the kinds");
    const figures = getTextsByClass(host, "row-value");
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
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
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
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const back = getElementsWithin(host).find((one) => one.className === "crumb-back");
    assert(back !== undefined, "an opened row has a way back");
    pressElement(host, "pointerdown", back);
    assertEquals(pressed.at(-1), { kind: "back" }, "which asks for nothing but the way back");

    // One gesture in, one gesture out: the way out works from anywhere on the panel, so the
    // cheapest gesture is not the one that has to be aimed at a control.
    const anywhere = getElementsWithin(host).find((one) => one.className === "list");
    assert(anywhere !== undefined, "there is somewhere on the panel to press");
    pointAtElement(host, "contextmenu", anywhere, 0);
    assertEquals(pressed.at(-1), { kind: "back" }, "and a right press anywhere asks for it too");
});

Deno.test("the bar says where the fight is being fought, and stays a bar without it", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    const view = {
        reading: readFight(),
        current: "damageDealtApplied" as const,
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        isCollapsed: false,
    };
    panel.show({ ...view, place: "Mapa (12, 34)" });
    const host = panel.element as FakeElement;
    // A line of its own under the headcount, because it is the one thing on the header whose
    // length this panel does not choose.
    assertEquals(
        getTextsByClass(host, "header-place"),
        ["Mapa (12, 34)"],
        "the place, its own line",
    );
    const header = getElementsWithin(host).find((one) => one.className === "header");
    assertEquals(header?.children.length, 2, "under the line that says what the fight is");

    panel.show({ ...view, place: null });
    assertEquals(getTextsByClass(host, "header-place"), [], "and nothing where nothing was said");
    assertEquals(
        getElementsWithin(host).find((one) => one.className === "header")?.children.length,
        1,
        "the header standing on, at the size it always has",
    );
});

Deno.test("a folded panel is its bar and nothing else, and offers the way back", () => {
    const document = composeFakeDocument();
    const pressed: PanelPress[] = [];
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    const host = panel.element as FakeElement;
    const view = {
        reading: readFight(),
        current: "damageDealtApplied" as const,
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    };

    panel.show(view);
    // A block body, not an expression: the recursion guard reads a one-line named arrow as
    // opening no brace, and so reads every line after it as this function's body — gap 13.
    const controls = () => {
        return getElementsWithin(host).filter((one) => one.className.startsWith(CLASS.control));
    };
    assertEquals(
        controls().map((one) => [...one.attributes.keys()].find((key) => key.startsWith("data-"))),
        ["data-shelf", "data-save", "data-fold"],
        "the bar carries the three controls, in that order",
    );
    const control = controls().find((one) => one.attributes.has("data-fold"));
    assert(control !== undefined, "an unfolded panel carries the control that folds it");
    assertEquals(control.textContent, "\u2014", "which says what a press would do");
    assertEquals(control.attributes.get("title"), PANEL_WORDS.collapse, "in the reader's words");
    assert(getElementsWithin(host).some((one) => one.className.startsWith("row ")), "a ranking");
    pressElement(host, "pointerdown", control);
    assertEquals(pressed.at(-1), { kind: "fold" }, "and a press on it asks for the fold");

    panel.show({ ...view, isCollapsed: true });
    const folded = getElementsWithin(host).filter((one) => one.className.endsWith(CLASS.folded));
    assertEquals(folded.length, 1, "everything under the bar is folded away in one region");
    assertEquals(
        getElementsWithin(host).filter((one) => one.className.startsWith("row ")).length,
        0,
        "and no row is composed for a screen nobody is looking at",
    );
    const back = controls().find((one) => one.attributes.has("data-fold"));
    assert(back !== undefined, "the bar is still a bar, and still carries its controls");
    assertEquals(back.textContent, "+", "which now offers the way back rather than the way in");
    assertEquals(back.attributes.get("title"), PANEL_WORDS.expand, "and says so in the same words");
    const bar = getElementsWithin(host).find((one) => one.className === CLASS.title);
    assert(bar?.textContent.endsWith(PANEL_WORDS.title), "the name standing on");
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
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        isCollapsed: false,
        place: "Mapa (12, 34)",
    });
    assertEquals(
        getTextsByClass(host, "titlebar-version"),
        [BUILD_VERSION],
        "and the bar says it once, beside the name",
    );
    assertEquals(
        getTextsByClass(host, "header-place"),
        ["Mapa (12, 34)"],
        "with the place still drawn, on the header where it belongs",
    );
});

/** Whatever the detail is saying right now, read back out of the root it stands in. */
/** One line of the card as a reader meets it: what it is of, what it says, and how it is drawn. */
interface TipLineRead {
    label: string;
    value: string;
    isStrong: boolean;
    isSub: boolean;
}

function readTip(host: FakeElement): {
    className: string;
    name: string[];
    subtitle: string[];
    notes: string[];
    lines: string[];
    stated: TipLineRead[];
} {
    const tip = (host.shadow ?? []).find((one) => one.className.startsWith(CLASS.tip));
    assert(tip !== undefined, "the detail is a region of the panel like any other");
    const name = getTextsByClass(tip, CLASS.tipName);
    return {
        className: tip.className,
        name,
        subtitle: getTextsByClass(tip, CLASS.tipSubtitle),
        notes: getTextsByClass(tip, CLASS.tipNote),
        lines: [
            ...name,
            ...getTextsByClass(tip, CLASS.tipLabel),
            ...getTextsByClass(tip, CLASS.tipValue),
        ],
        stated: getElementsWithin(tip)
            .filter((one) => one.className.startsWith(CLASS.tipLine))
            .map((one) => ({
                label: getTextsByClass(one, CLASS.tipLabel)[0] ?? "",
                value: getTextsByClass(one, CLASS.tipValue)[0] ?? "",
                isStrong: one.className.includes(CLASS.tipStrong),
                isSub: one.className.includes(CLASS.tipSub),
            })),
    };
}

/** Whether a `font` shorthand states the whole-pixel line the rest of the panel is drawn on. */
function getIsLineWhole(font: string): boolean {
    const slash = font.indexOf("/");
    if (slash === -1) return false;
    const ends = font.indexOf(" ", slash);
    if (ends === -1) return false;
    return font.slice(slash + 1, ends).endsWith("px");
}

/**
 * Which regions are undressed for the ground they paint.
 *
 * `:host{all:initial}` reaches every child of the root and nothing else does, so a region hanging
 * there is drawn in the browser's own serif at `medium`, in `canvastext`, unless it says
 * otherwise. A box painting no ground of its own puts no text on one either, so it is exempt.
 */
function getUndressedRegions(sheet: string, classNames: readonly string[]): string[] {
    const found: string[] = [];
    for (const className of classNames) {
        const body = getRuleBody(sheet, `.${className}`);
        if (getDeclaration(body, "background") === null) continue;
        const font = getDeclaration(body, "font");
        if (font === null) {
            found.push(className);
            continue;
        }
        if (!getIsLineWhole(font)) {
            found.push(className);
            continue;
        }
        if (getDeclaration(body, "color") === null) found.push(className);
    }
    return found;
}

Deno.test("a region hanging off the root states its own type and its own ink", () => {
    // The detail window stated neither, and was drawn in the browser's serif at `medium` in black
    // on `raised` — figures nobody could read. Seen in Chrome 152 on 2026-08-29.
    const host = draw(readFight());
    const regions = (host.shadow ?? [])
        .filter((one) => one.className.length > 0)
        .map((one) => one.className.split(" ")[0] ?? "");
    assert(regions.includes(CLASS.tip), "the detail window hangs there with the rest of them");
    assertEquals(
        getUndressedRegions(composeStyleSheet(), regions),
        [],
        "`all: initial` reaches a root's children, so a ground of its own needs an ink of its own",
    );
    // A reader is proved by a sample it must flag and a sample it must not.
    assertEquals(getUndressedRegions(".a{background:red;}", ["a"]), ["a"], "a ground with no ink");
    assertEquals(
        getUndressedRegions(".a{background:red;color:blue;font:11px/1.4 x y;}", ["a"]),
        ["a"],
        "and a line stated as a factor is not the rhythm the rest of the panel is drawn on",
    );
    assertEquals(
        getUndressedRegions(".a{background:red;color:blue;font:11px/15px x y;}", ["a"]),
        [],
        "a region that says all three is dressed for what it paints",
    );
    assertEquals(getUndressedRegions(".a{display:flex;}", ["a"]), [], "and one painting no ground");
});

Deno.test("every row a reader can point at says which detail is its own", () => {
    const host = draw(readFight());
    const rows = getElementsWithin(host).filter((one) => one.className === "row drillable");
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

Deno.test("pointing at a ranking row opens everything that row had to leave out", () => {
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
        shown.name,
        [first.name ?? PANEL_WORDS.unknown],
        "the name in full, which the row itself may have cut",
    );
    assertEquals(
        shown.subtitle,
        [composeCardSubtitleText(first.profession, first.detail.level)],
        "and what they are beside how far along, off the roster the fight was fought by",
    );
    const figures = shown.stated.filter((one) => !one.isSub);
    assertEquals(
        figures.slice(0, SCREEN_ORDER.length).map((one) => one.label),
        SCREEN_ORDER.map((metric) => getWordsForCardMetric(metric)),
        "and all four figures, in the order the strip over the list puts them",
    );
    assertEquals(
        figures.slice(0, SCREEN_ORDER.length).map((one) => one.value),
        SCREEN_ORDER.map((metric) => composeFigureText(first.detail[metric])),
        "each stating what the statistics hold for this combatant, not what this screen shows",
    );
    assertEquals(
        shown.stated.filter((one) => one.isStrong).map((one) => one.label),
        [getWordsForCardMetric("damageDealtApplied")],
        "with the one on screen in bold, and no other",
    );
    assert(
        shown.stated.some((one) => one.isSub),
        "and the part of a figure the protocol could say less than the whole of stands under it",
    );

    pointAtElement(host, "pointerout", name, 412, null);
    assertEquals(readTip(host).className, `${CLASS.tip} ${CLASS.tipHidden}`, "and leaving closes");
});

Deno.test("crossing from one part of a row to another is not leaving it", () => {
    const host = draw(readFight());
    const parts = getElementsWithin(host).filter((one) => one.attributes.has("data-tip"));
    const [name, other] = [
        parts.find((one) => one.className === "row-name"),
        parts.find((one) => one.className === CLASS.rowValue),
    ];
    assert(name !== undefined, "a row draws a name");
    assert(other !== undefined, "and a figure beside it, each its own element under the pointer");
    assertEquals(
        name.attributes.get("data-tip"),
        other.attributes.get("data-tip"),
        "both of them filed under the one row they are parts of",
    );
    pointAtElement(host, "pointermove", name, 412);
    const opened = readTip(host);
    assertEquals(opened.className, CLASS.tip, "pointing at one of them opens the card");

    // `pointerout` bubbles, so it fires on every crossing inside the row as well as on leaving it.
    pointAtElement(host, "pointerout", name, 412, other);
    assertEquals(
        readTip(host).className,
        CLASS.tip,
        "and a crossing that lands on the same row's mark leaves the card standing",
    );
    assertEquals(readTip(host).lines, opened.lines, "saying what it was already saying");
});

/**
 * The same card at every level a person stands on, and its figures are the fight's: the card is
 * about the person, and the row it stands over is one cut of them. **ADR 0032.**
 */
Deno.test("a person inside an opened row opens the card the ranking opens", () => {
    const { reading, drill, opened } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const other = drill.byOpponent.rows[0];
    assert(other !== undefined, "the opened figure reached somebody");
    const listed = reading.rows.find((one) => one.combatantId === other.combatantId);
    assert(listed !== undefined, "and the ranking holds them too");
    const pointAt = (key: string) => {
        const part = getElementsWithin(host).find(
            (one) => one.attributes.get("data-tip") === key,
        );
        assert(part !== undefined, `${key} is a row on the panel`);
        pointAtElement(host, "pointermove", part, 300);
        return readTip(host);
    };
    const card = pointAt(`to:${other.combatantId}`);
    assertEquals(card.name, [other.name ?? PANEL_WORDS.unknown], "the card names them in full");
    assertEquals(
        SCREEN_ORDER.map(getWordsForCardMetric).filter((words) => !card.lines.includes(words)),
        [],
        "and states all four of their figures, the way the ranking's card does",
    );
    const words = getWordsForCardMetric("damageDealtApplied");
    const dealt = card.stated.find((line) => line.label === words);
    assert(dealt !== undefined, "the screen's own figure among them");
    assertEquals(
        dealt.value,
        composeFigureText(listed.detail.damageDealtApplied),
        "read off the whole fight, and not off the cut the row under it states",
    );
    assert(
        dealt.value !== composeFigureText(other.figure),
        "which on this recording is a different number, so the two cannot be confused",
    );
    assert(card.notes.includes(CARD_WORDS.scope), "and the card says which of the two it means");
    // The one card whose figures are its row's: on the ranking the two are the same number, so
    // the sentence saying otherwise would answer nobody's question.
    const ranking = draw(reading);
    const listedPart = getElementsWithin(ranking).find(
        (one) => one.attributes.get("data-tip") === `row:${opened.combatantId}`,
    );
    assert(listedPart !== undefined, "the row this level was opened from is one of the ranking's");
    pointAtElement(ranking, "pointermove", listedPart, 300);
    assert(!readTip(ranking).notes.includes(CARD_WORDS.scope), "and says no such thing");
});

/**
 * The other rung a person stands on, and the last: whom one skill reached. Nothing there opens
 * (`docs/drill-levels.md`), so the card carries the figures and not the instruction.
 */
Deno.test("a person under an opened skill opens a card promising no gesture", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    const reading = composePanelReading(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const drill = composeDrillReading(statistics, roster, "healthGiven", HEALER);
    assert(drill !== null, "the healer's row opens");
    const announced = drill.bySkill.rows.find((one) => one.opensPart);
    assert(announced !== undefined, "onto a skill that reached somebody else");
    assert(announced.part.kind === "skill", "and one the game announced by name");
    const skill = composePartReading(statistics, roster, "healthGiven", HEALER, announced.part);
    assert(skill !== null, "which opens onto the people it reached");
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "healthGiven",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: skill,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const reached = skill.byOpponent.rows[0];
    assert(reached !== undefined, "somebody it reached");
    const part = getElementsWithin(host).find(
        (one) => one.attributes.get("data-tip") === `reached:${reached.combatantId}`,
    );
    assert(part !== undefined, "and they are a row somebody can point at");
    pointAtElement(host, "pointermove", part, 300);
    const card = readTip(host);
    assertEquals(
        SCREEN_ORDER.map(getWordsForCardMetric).filter((words) => !card.lines.includes(words)),
        [],
        "the card states all four of their figures here too",
    );
    assert(card.notes.includes(CARD_WORDS.scope), "and says the figures are the whole fight's");
    assert(!card.notes.includes(CARD_WORDS.gesture), "and promises nothing, because nothing opens");
});

Deno.test("a share inside an opened row is of that row, never of the fight", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const kind = drill.byElement.rows[0];
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
            getWordsForDamageKind(kind.element),
            getWordsForScreen("damageDealtApplied"),
            PANEL_WORDS.shareOfFigure,
            composeFigureText(kind.figure),
            kind.shareText,
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
        side: "everyone",
        hasReaderSide: false,
        shelf: [{
            openedAt: 17,
            at: { hour: 21, minute: 5 },
            sizes: [10, 1],
            place: "Bagno Wisielców (128, 74)",
            outcome: "lost",
            isLive: false,
            isChosen: false,
            isPinned: false,
            isPinnable: true,
        }],
        isOnShelf: true,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const row = getElementsWithin(host).find((one) =>
        one.attributes.get("data-tip") === "shelf:17"
    );
    assert(row !== undefined, "the fight is a row a reader can point at");
    assertEquals(
        [getTextsByClass(host, "row-time")[0], getTextsByClass(host, "row-size")[0]],
        ["21:05", "10×1"],
        "when it was, and how big it was, before the place that can be cut",
    );
    assertEquals(getTextsByClass(host, "row-value")[0], "przegrana", "and how it went, last");
    pointAtElement(host, "pointermove", row, 120);
    assertEquals(
        readTip(host).lines,
        ["Bagno Wisielców (128, 74)"],
        "and the place whole, which is the half the row loses to an ellipsis",
    );
});

Deno.test("a panel that has seen no fight says so, at the height a ranking stands at", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    const host = panel.element as FakeElement;
    panel.showWaiting(false);
    const list = getElementsWithin(host).find((one) => one.className.startsWith("list"));
    assert(list !== undefined, "the list is drawn");
    assertEquals(list.className, "list list-waiting", "as the one list its sentence is centred in");
    assertEquals(
        getTextsByClass(host, "empty"),
        [PANEL_WORDS.noFightYet],
        "saying what is missing",
    );
    assertEquals(list.attributes.get("style"), "--MargoMeter-rows:11", "at the ranking's height");
    // Nothing else: there is no screen to pick, no row to open and nothing to total, so a strip
    // would be a control over a fight that is not on.
    assertEquals(getElementsWithin(host).filter((one) => one.className === "tabs"), [], "no tabs");
    assertEquals(getTextsByClass(host, "MargoMeter-summary"), [], "and no strip under it");
    const bar = getElementsWithin(host).find((one) => one.className === CLASS.title);
    assert(bar?.textContent.endsWith(PANEL_WORDS.title), "while the bar stands as it always does");

    panel.showWaiting(true);
    const folded = getElementsWithin(host).filter((one) => one.className.endsWith(CLASS.folded));
    assertEquals(folded.length, 1, "a reader who folded the panel away keeps it folded");
    assertEquals(getTextsByClass(host, "empty"), [], "and nothing under the bar is composed");
});

Deno.test("the header says how the fight went, and says nothing where nobody could tell", () => {
    const reading = readFight();
    const won = draw({ ...reading, outcome: "won" });
    assertEquals(
        getTextsByClass(won, "header-outcome"),
        [getWordsForOutcome("won")],
        "in the word the shelf uses too, shouted by the sheet rather than by the words",
    );
    const line = getElementsWithin(won).find((one) => one.className === "header-line");
    assertEquals(line?.children.length, 2, "beside what the fight is, at the other end of it");
    const unsaid = draw({ ...reading, outcome: null });
    assertEquals(getTextsByClass(unsaid, "header-outcome"), [], "and nothing at all where none");
    assertEquals(
        getElementsWithin(unsaid).find((one) => one.className === "header-line")?.children.length,
        1,
        "no gap reserved for a word that was never said",
    );
});

Deno.test("the bar is what moves the panel, and where it was let go is reported once", () => {
    const document = composeFakeDocument();
    const moved: Array<{ left: number; top: number }> = [];
    const panel = composePanelHost(document, () => {}, () => {}, {
        position: null,
        getViewport: () => ({ width: 1280, height: 900 }),
        handleMoved: (position) => moved.push(position),
    });
    const host = panel.element as FakeElement;
    panel.show({
        reading: readFight(),
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: null,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const bar = getElementsWithin(host).find((one) => one.className === CLASS.title);
    assert(bar !== undefined, "the bar is drawn");
    assertEquals(bar.attributes.get("data-grip"), "", "and it is what a drag is started from");

    // Nobody has moved this one, so it stands in the middle of the window from the first frame,
    // which is also the place the first grab starts from.
    assertEquals(
        host.attributes.get("style"),
        "left:510px;top:153px;--MargoMeter-panel-top:153px;right:auto",
        "a panel nobody has moved is put in the middle of the window it was drawn into",
    );

    dragOnElement(host, "pointerdown", bar, { clientX: 1100, clientY: 20 });
    dragOnElement(host, "pointermove", bar, { clientX: 1000, clientY: 120 });
    assertEquals(
        host.attributes.get("style"),
        "left:410px;top:253px;--MargoMeter-panel-top:253px;right:auto",
        "the panel follows the hand, by the distance the hand moved",
    );
    assertEquals(moved, [], "and nothing is stored while it is still being dragged");

    dragOnElement(host, "pointerup", bar, { clientX: 1000, clientY: 120 });
    assertEquals(moved, [{ left: 410, top: 253 }], "where it was let go is reported, once");

    dragOnElement(host, "pointermove", bar, { clientX: 500, clientY: 500 });
    assertEquals(
        host.attributes.get("style"),
        "left:410px;top:253px;--MargoMeter-panel-top:253px;right:auto",
        "and a pointer moving with nothing held moves nothing",
    );
});

Deno.test("a press on a control is not a drag, whatever the pointer does next", () => {
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {}, {
        position: { left: 40, top: 40 },
        getViewport: () => ({ width: 1280, height: 900 }),
        handleMoved: () => {},
    });
    const host = panel.element as FakeElement;
    panel.showWaiting(false);
    const fold = getElementsWithin(host).find((one) => one.attributes.has("data-fold"));
    assert(fold !== undefined, "the bar carries the control that folds the panel");
    dragOnElement(host, "pointerdown", fold, { clientX: 100, clientY: 100 });
    dragOnElement(host, "pointermove", fold, { clientX: 400, clientY: 400 });
    assertEquals(
        host.attributes.get("style"),
        "left:40px;top:40px;--MargoMeter-panel-top:40px;right:auto",
        "the panel stays where the reader left it: a press on a control is that control's",
    );
});

/** Healing opens onto who, what with, and — on the receiving side alone — under which key. */
Deno.test("a healing row opens, and says whose the health was and what put it back", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    const open = (screen: "healthGiven" | "healthRestored") => {
        const reading = composePanelReading(
            statistics,
            roster,
            screen,
            "everyone",
            null,
            NOTHING_MISSED,
        );
        const first = reading.rows[0];
        assert(first !== undefined, `${screen}: there is a row to open`);
        const drill = composeDrillReading(statistics, roster, screen, first.combatantId);
        assert(drill !== null, `${screen}: and it opens`);
        const document = composeFakeDocument();
        const panel = composePanelHost(document, () => {}, () => {});
        panel.show({
            reading,
            current: screen,
            side: "everyone" as const,
            hasReaderSide: false,
            shelf: [],
            isOnShelf: false,
            storage: "local" as const,
            shelfWarnings: [],
            drill,
            pair: null,
            part: null,
            place: null,
            isCollapsed: false,
        });
        const host = panel.element as FakeElement;
        return getElementsWithin(host)
            .filter((one) => one.className === "section-heading")
            .map((one) => one.children[0]?.textContent);
    };
    assertEquals(
        open("healthRestored"),
        [PANEL_WORDS.takenFrom, PANEL_WORDS.skills, PANEL_WORDS.healthSource],
        "health received is cut by who put it back, what put it back and the key it came under",
    );
    // No cut by key: the keys the protocol names belong to whoever received the health, so a
    // giver's row cut by one would be worded with somebody else's cause.
    assertEquals(
        open("healthGiven"),
        [PANEL_WORDS.dealtTo, PANEL_WORDS.skills],
        "and health given by whom it reached and what it was given with",
    );
});

Deno.test("a row opened on a screen its own figure is nothing on says so, about them", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "healthGiven",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        // The same person, carried onto a screen they did nothing on: one press of a strip away,
        // because the strips carry an opened row from screen to screen.
        drill: { ...drill, total: 0, byOpponent: { rows: [], unnamed: null } },
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    assertEquals(
        getTextsByClass(host, "empty"),
        [getWordsForNothing("healthGiven")],
        "a sentence about that person rather than an empty box",
    );
    assertEquals(getTextsByClass(host, "crumb-here"), [drill.name], "and they are still open");
});

Deno.test("an opened row grows the list to what its cuts need, and never shortens it", () => {
    const { reading, drill } = openFirstRow();
    const drawOpened = (open: typeof drill | null) => {
        const document = composeFakeDocument();
        const panel = composePanelHost(document, () => {}, () => {});
        panel.show({
            reading,
            current: "damageDealtApplied",
            side: "everyone" as const,
            hasReaderSide: false,
            shelf: [],
            isOnShelf: false,
            storage: "local" as const,
            shelfWarnings: [],
            drill: open,
            pair: null,
            part: null,
            place: null,
            isCollapsed: false,
        });
        const host = panel.element as FakeElement;
        const list = getElementsWithin(host).find((one) => one.className.startsWith("list"));
        return list?.attributes.get("style");
    };
    const ranking = drawOpened(null);
    assertEquals(
        ranking,
        `--MargoMeter-rows:${reading.visibleRows}`,
        "the ranking is its own floor",
    );

    // Two cuts, each costing its rows, the part named for nobody and the heading over them.
    const heads = (
        rows: unknown[],
        extra: unknown,
    ) => (rows.length === 0 && extra === null ? 0 : 1);
    const needed = countDrillRows(drill) + heads(drill.byOpponent.rows, drill.byOpponent.unnamed) +
        heads(drill.bySkill.rows, drill.bySkill.plain) +
        heads(drill.byElement.rows, drill.byElement.unnamed);
    assert(needed > reading.visibleRows, "this fight opens onto more rows than the ranking has");
    assertEquals(
        drawOpened(drill),
        `--MargoMeter-rows:${needed}`,
        "so the list grows to hold them",
    );

    // And a cut that needs less keeps the floor: pressing a row must not shorten the window
    // under the hand that pressed it.
    const small = {
        ...drill,
        byOpponent: { rows: [], unnamed: null },
        bySkill: { rows: [], plain: null },
        byElement: { rows: drill.byElement.rows.slice(0, 2), unnamed: null },
    };
    assertEquals(
        drawOpened(small),
        `--MargoMeter-rows:${reading.visibleRows}`,
        "a shorter breakdown is drawn at the ranking's height rather than below it",
    );
});

/**
 * A cut of one row states the whole of the figure over it, and states what that figure was made
 * of — which the heading does not. Drawn, therefore, and pressable: the row a reader cannot press
 * is the row that answers nothing.
 */
Deno.test("a cut that repeats the figure above it is drawn all the same", () => {
    const { reading, drill } = openFirstRow();
    const headings = (open: typeof drill) => {
        const document = composeFakeDocument();
        const panel = composePanelHost(document, () => {}, () => {});
        panel.show({
            reading,
            current: "damageTakenApplied",
            side: "everyone" as const,
            hasReaderSide: false,
            shelf: [],
            isOnShelf: false,
            storage: "local" as const,
            shelfWarnings: [],
            drill: open,
            pair: null,
            part: null,
            place: null,
            isCollapsed: false,
        });
        const host = panel.element as FakeElement;
        return getElementsWithin(host)
            .filter((one) => one.className === "section-heading")
            .map((one) => one.children[0]?.textContent);
    };
    const one = drill.byElement.rows[0];
    assert(one !== undefined, "the fight cuts this figure by kind");
    // One kind carrying the whole figure is that figure again under another heading.
    const repeated = {
        ...drill,
        total: one.figure,
        bySkill: { rows: [], plain: null },
        byElement: { rows: [one], unnamed: null },
    };
    assertEquals(
        headings(repeated),
        [PANEL_WORDS.takenFrom, PANEL_WORDS.damageKind],
        "so the cut of one is drawn under its own heading",
    );

    const two = drill.byElement.rows.slice(0, 2);
    assert(two.length === 2, "and the fight cuts it by more than one");
    const split = {
        ...drill,
        total: two.reduce((sum, row) => sum + row.figure, 0),
        bySkill: { rows: [], plain: null },
        byElement: { rows: two, unnamed: null },
    };
    assertEquals(
        headings(split),
        [PANEL_WORDS.takenFrom, PANEL_WORDS.damageKind],
        "while a cut that says more than the figure above it is drawn",
    );
});

/**
 * The heading carries the figure and never what it was dealt with, so one row holding the whole
 * of it is where a reader learns which skill that was — and a key row answers the same question
 * in the game's own word for it. Neither is a repetition, and the keys standing a section lower
 * on one screen is no reason to take the answer off this one.
 */
Deno.test("a lone row of a section names what the heading over it never does", () => {
    const { reading, drill } = openFirstRow();
    const headings = (open: typeof drill) => {
        const document = composeFakeDocument();
        const panel = composePanelHost(document, () => {}, () => {});
        panel.show({
            reading,
            current: "damageDealtApplied",
            side: "everyone" as const,
            hasReaderSide: false,
            shelf: [],
            isOnShelf: false,
            storage: "local" as const,
            shelfWarnings: [],
            drill: open,
            pair: null,
            part: null,
            place: null,
            isCollapsed: false,
        });
        return getElementsWithin(panel.element as FakeElement)
            .filter((one) => one.className === "section-heading")
            .map((one) => one.children[0]?.textContent);
    };
    const only = drill.bySkill.rows[0];
    assert(only !== undefined, "the fight cuts this figure by the skills it was dealt with");
    assertEquals(only.part.kind, "skill", "and the row standing first is an announcement");
    const alone = {
        ...drill,
        total: only.figure,
        byOpponent: { rows: [], unnamed: null },
        byElement: { rows: [], unnamed: null },
        bySkill: { rows: [only], plain: null },
    };
    assertEquals(headings(alone), [PANEL_WORDS.skills], "so the section is drawn all the same");

    const key = { ...only, part: { kind: "source" as const, source: "heal" } };
    const keyed = { ...alone, bySkill: { rows: [key], plain: null } };
    assertEquals(headings(keyed), [PANEL_WORDS.skills], "and so is a lone key row");
});

Deno.test("a blow nothing announced closes the skills, and says how many there were", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageDealtApplied",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        // Three blows that were all blocked are three blows: the row is drawn at nothing, and a
        // section that skipped it would say the combatant never swung.
        drill: {
            ...drill,
            bySkill: { rows: [], plain: { blows: 3, figure: 0, fill: 0, shareText: "0%" } },
        },
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const named = getTextsByClass(host, "row-name");
    const closing = getWordsForUnannounced("damageDealtApplied");
    assert(named.includes(closing), "the closing row stands in its own section");
    const shares = getTextsByClass(host, "row-share");
    assert(shares.includes("(0% · ×3)"), "carrying the count only its absence of a skill states");
});

/**
 * ⚠️ **The mark goes on every span of the row, and this is why.** A listener reads what was
 * pressed off the node under the hand and walks no ancestors, so a mark on the row alone left the
 * name and the figure swallowing the press — the two thirds of a row a reader actually aims at.
 */
Deno.test("a skill that opens asks for itself by name, wherever the press lands on it", () => {
    const { reading, drill } = openFirstRow();
    const pressed: PanelPress[] = [];
    const document = composeFakeDocument();
    const panel = composePanelHost(document, (press) => pressed.push(press), () => {});
    const rows = [
        {
            part: { kind: "skill" as const, name: "Dotyk anioła" },
            uses: 1,
            figure: 500,
            fill: 1,
            shareText: "50%",
            opensPart: true,
        },
        {
            part: { kind: "skill" as const, name: "Zmrrożenie" },
            uses: 8,
            figure: 500,
            fill: 1,
            shareText: "50%",
            opensPart: false,
        },
    ];
    panel.show({
        reading,
        current: "healthGiven",
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill: { ...drill, total: 1000, bySkill: { rows, plain: null } },
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const named = getElementsWithin(host).filter((one) => one.className === "row-name");
    const opening = named.filter((one) => one.textContent === "Dotyk anioła");
    assertEquals(opening.length, 1, "the skill that reached somebody else is drawn");
    const marked = getElementsWithin(host).filter((one) => one.attributes.has("data-skill"));
    assertEquals(
        [...new Set(marked.map((one) => one.attributes.get("data-skill")))],
        ["Dotyk anioła"],
        "and it is the one thing on the screen that opens",
    );
    // The name first, which is where a reader aims and where the press used to be swallowed, and
    // the count beside the value: a press that lands nowhere leaves the one before it standing.
    for (const [at, part] of [opening[0], marked[0]].entries()) {
        assert(part !== undefined, "the row and the name a reader aims at both carry the mark");
        pressElement(host, "pointerdown", part);
        assertEquals(pressed.length, at + 1, "every press on the row lands");
        assertEquals(
            pressed.at(-1),
            { kind: "part", part: { kind: "skill", name: "Dotyk anioła" } },
            "asking for itself by the name it was announced under, which is not a number",
        );
    }
});

/** Where a row's name starts, which is the sum of every cell drawn before it. */
function getCellsBeforeName(row: FakeElement): string[] {
    const before: string[] = [];
    for (const part of row.children) {
        const named = part.className.split(" ")[0] ?? "";
        if (named === "row-name") return before;
        before.push(named);
    }
    return before;
}

Deno.test("every row in a list draws the same cells before its name", () => {
    // The bug this catches was photographed. A ranking row's place held the space before its
    // name and a drilled row had a profession badge holding the same space; when the badge went,
    // the drill's names slid 14.5px left of the ranking's and sat on the bar's own cap, while
    // the ranking read as it always had. Nothing went red, because a row's parts are drawn from
    // whatever the reading happens to carry rather than from a shape every row keeps.
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    const shown = {
        reading,
        current: "damageDealtApplied" as const,
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    };
    const shapes = new Map<string, string[]>();
    for (const [screen, opened] of [["ranking", null], ["drilled", drill]] as const) {
        panel.show({ ...shown, drill: opened });
        const host = panel.element as FakeElement;
        for (const row of getElementsWithin(host)) {
            if (row.className.split(" ")[0] !== "row") continue;
            if (row.children.length === 0) continue;
            shapes.set(`${screen}: ${getCellsBeforeName(row).join(",")}`, getCellsBeforeName(row));
        }
    }
    assertEquals(
        [...shapes.keys()].sort(),
        ["drilled: bar,bar-cap,row-rank", "ranking: bar,bar-cap,row-rank"],
        "a row on one screen is built of the cells a row on the other is",
    );
});

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, the healer at 469657: two announced
 * skills and
 * health that moved under `heal`, which nothing announced.
 *
 * The key is drawn under the reader's own word for it and never under the token, and never under
 * a row saying nothing was said — the game said `heal`, and the help calls it a regeneration.
 */
Deno.test("a healing section draws the key the game named, not a row saying it did not", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    const reading = composePanelReading(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const drill = composeDrillReading(statistics, roster, "healthGiven", 469657);
    assert(drill !== null, "the healer's row opens");
    assertEquals(drill.bySkill.plain, null, "onto a section closing against nothing");
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "healthGiven" as const,
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const named = getTextsByClass(panel.element as FakeElement, "row-name");
    assert(
        named.includes(getWordsForHealthSource("heal")),
        "the key stands under the word a player reads",
    );
    assert(!named.includes("heal"), "never under the token the protocol stated it on");
    assert(
        !named.includes(getWordsForUnannounced("healthGiven")),
        "and no row says the game left it unsaid, because the game did not",
    );
    assert(
        named.includes("Leczenie ran"),
        "with the announcements beside it under their own names",
    );
});

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, the combatant at 469657 and
 * themselves: health they
 * put back into themselves under one announcement and under `heal`, which nothing announced.
 *
 * One section, because the two kinds of row are two parts of one figure — drawn apart they would
 * be two columns each coming to some fraction of a hundred.
 */
Deno.test("an opened healing pair draws its announcements and its keys as one section", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    const healer = 469657;
    const reading = composePanelReading(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const drill = composeDrillReading(statistics, roster, "healthGiven", healer);
    assert(drill !== null, "the healer's row opens");
    const pair = composePairReading(statistics, roster, "healthGiven", healer, healer);
    assert(pair !== null, "and the person inside it opens onto the pair");
    assert(pair.parts.length > 1, "which says more than the row that was pressed");

    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "healthGiven" as const,
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const headings = getElementsWithin(host).filter((one) => one.className === "section-heading");
    assertEquals(headings.length, 1, "one section, holding the whole of what passed between them");
    assertEquals(
        headings[0]?.children[0]?.textContent,
        `${PANEL_WORDS.skillsAgainst} — ${pair.otherName}`,
        "saying what it cuts and whom it is about",
    );
    assertEquals(
        headings[0]?.children[1]?.textContent,
        composeFigureText(pair.total),
        "and standing over the figure the row that opened it stated",
    );
    const rows = getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "row");
    assertEquals(rows.length, pair.parts.length, "a row for each part, and no other");
    assert(
        rows.every((one) => one.attributes.get("data-row") === undefined),
        "and nothing on this rung opens any further",
    );
    const named = getTextsByClass(host, "row-name");
    assert(named.includes(getWordsForHealthSource("heal")), "a key is drawn in the reader's words");
    assert(!named.includes("heal"), "never under the token the protocol stated it on");
    assert(
        named.some((one) => one === "Zdrowa atmosfera"),
        "and an announcement under the name it was announced by",
    );
});

/**
 * A reader inside an opened row meets rows that open and rows that do not, and only the cursor
 * ever told the two apart. What stays shut is what the statistics keep no second cut of: damage
 * that ticked with nobody named at the other end has no level of people to open onto.
 */
Deno.test("a row that opens says so, and a row that does not says nothing of the kind", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(BOTH_KINDS_OF_PAIR));
    const events = getRecordedPayloads(BOTH_KINDS_OF_PAIR)
        .flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    const reading = composePanelReading(
        statistics,
        roster,
        "damageTakenApplied",
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const first = reading.rows[0];
    assert(first !== undefined, "there is a row to open");
    const drill = composeDrillReading(statistics, roster, "damageTakenApplied", first.combatantId);
    assert(drill !== null, "and it opens");
    const opening = drill.byOpponent.rows.find((one) => one.opensPair);
    const shut = drill.byElement.rows.find((one) => !one.opensPart);
    assert(opening !== undefined, "onto everybody it passed between, all of whom open");
    assert(shut !== undefined, "and onto a kind of it nobody was named at the other end of");

    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: "damageTakenApplied" as const,
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const pointAtRow = (key: string) => {
        const part = getElementsWithin(host).find((one) => {
            if (one.className !== "row-name") return false;
            return one.attributes.get("data-tip") === key;
        });
        assert(part !== undefined, `${key} is a row on the panel`);
        pointAtElement(host, "pointermove", part, 412);
        const tip = (host.shadow ?? []).find((one) => one.className.startsWith(CLASS.tip));
        assert(tip !== undefined, "and pointing at it opens the detail");
        return getTextsByClass(tip, CLASS.tipNote);
    };
    assertEquals(
        pointAtRow(`to:${opening.combatantId}`).at(-1),
        CARD_WORDS.gesture,
        "the row that opens says what pressing it does, last of the card's sentences",
    );
    assert(
        !pointAtRow(`kind:${shut.element}`).includes(CARD_WORDS.gesture),
        "and the one that does not promises no gesture",
    );
    // Said at every level the card stands on, because the row under it states a cut of the figure
    // the card holds and nothing else on screen says the card means the whole fight.
    for (const row of drill.byOpponent.rows) {
        assert(
            pointAtRow(`to:${row.combatantId}`).includes(CARD_WORDS.scope),
            "and every person row says the figures over them are the fight's",
        );
    }
});

/**
 * The notes on the rows of one opened figure, read off the drawn panel: the name a row is drawn
 * under, and what its detail says about pressing it.
 */
function composeNotesForOpenedRow(
    metric: PanelMetric,
    combatantId: number,
): Map<string, string[]> {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    const reading = composePanelReading(
        statistics,
        roster,
        metric,
        "everyone",
        null,
        NOTHING_MISSED,
    );
    const drill = composeDrillReading(statistics, roster, metric, combatantId);
    assert(drill !== null, "the row opens");
    const document = composeFakeDocument();
    const panel = composePanelHost(document, () => {}, () => {});
    panel.show({
        reading,
        current: metric,
        side: "everyone" as const,
        hasReaderSide: false,
        shelf: [],
        isOnShelf: false,
        storage: "local" as const,
        shelfWarnings: [],
        drill,
        pair: null,
        part: null,
        place: null,
        isCollapsed: false,
    });
    const host = panel.element as FakeElement;
    const found = new Map<string, string[]>();
    for (const row of getElementsWithin(host).filter((one) => one.className === "row-name")) {
        pointAtElement(host, "pointermove", row, 412);
        const tip = (host.shadow ?? []).find((one) => one.className.startsWith(CLASS.tip));
        assert(tip !== undefined, "and pointing at a row of it opens the detail");
        found.set(row.textContent, getTextsByClass(tip, CLASS.tipNote));
    }
    return found;
}

/** The other mark, on the sections that open by it: a part states the same instruction. */
Deno.test("a part that opens says so under the same words a person does", () => {
    const given = composeNotesForOpenedRow("healthGiven", 469657);
    assertEquals(
        given.get("Zdrowa atmosfera"),
        [CARD_WORDS.gesture],
        "an announcement says pressing it opens",
    );
    assertEquals(
        given.get(getWordsForHealthSource("heal")),
        [CARD_WORDS.gesture],
        "and so does the key beside it, which opens onto whom the health reached",
    );
    // The same key on the screen about what reached this combatant: a key names whoever received
    // the health, so the receiving side keeps no giver to list and the row promises nothing.
    const restored = composeNotesForOpenedRow("healthRestored", 469657);
    assertEquals(
        restored.get(getWordsForHealthSource("heal")),
        [],
        "the key promises nothing where the statistics keep no cut of it",
    );
});
