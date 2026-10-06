/**
 * What the panel puts on the page, read back out of the document it was handed.
 *
 * The reading it draws comes from a real recording through every layer beneath it, so what is on
 * screen here is what would be on screen in play.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertExists,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import { tallyFightStatistics } from "#/src/core/fight-statistics.ts";
import { isOneOf } from "#/libs/vocabulary.ts";
import {
    PANEL_WINDOW,
    STORAGE_CHOICE,
    TYPE_STEP,
    TYPE_STEP_DEFAULT,
} from "#/src/ui/panel-choice.ts";
import type { PanelDefect, PanelView, ShownScreen } from "#/src/ui/panel-element.ts";
import { PANEL_INTENT, type PanelIntent } from "#/src/ui/panel-intent.ts";
import { composeShownScreen, SHOWN_LIST } from "#/tests/shown-screen.ts";
import { initTestView, NOTHING_WAITING, TEST_VERSION } from "#/tests/panel-view.ts";
import { readCard } from "#/tests/drawn-card.ts";
import {
    NOTHING_SUSPECT,
    type PinnedRow,
    presentOpenedLevel,
    presentPairLevel,
    presentPartLevel,
    presentScreen,
    presentUnnamedCutLevel,
    presentUnnamedLevel,
    presentUnnamedPairLevel,
    RANKING_ROWS,
    type ScreenContent,
    SIDE_RELATION,
    UNNAMED_END,
} from "#/src/ui/panel-content.ts";
import { CLASS, composeStyleSheet, SPACE_PIXELS, TYPE_TOKENS } from "#/src/ui/panel-look.ts";
import { formatColour, lookupColourForProfession, SIGNAL } from "#/src/ui/panel-palette.ts";
import {
    getNounForMetric,
    getWordsForMetric,
    OPENED_PART,
    type PanelMetric,
    type PanelSideChoice,
    presentDirectionStrips,
    presentNounStrips,
    presentSideStrips,
    SCREEN_ORDER,
} from "#/src/ui/panel-screen.ts";
import {
    CARD_WORDS,
    CHOICE_REFUSED_ANSWER,
    FIGHT_CARD_WORDS,
    formatCardSubtitle,
    formatFigure,
    formatSideCounts,
    formatUndrawn,
    getCaveatForUnannounced,
    getNoteForCaveat,
    getNoteForNoKind,
    getNoteForOpenedUnnamedStanding,
    getNoteForUnnamedEnd,
    getWordsForCardMetric,
    getWordsForDamageKind,
    getWordsForHealthSource,
    getWordsForNothing,
    getWordsForNoun,
    getWordsForOutcome,
    getWordsForPinnedScope,
    getWordsForPinnedStanding,
    getWordsForProfession,
    getWordsForStorage,
    getWordsForStorageMeaning,
    getWordsForTypeStep,
    getWordsForUnannounced,
    getWordsForWindow,
    PANEL_DEFECT_KIND,
    PANEL_REGION,
    PANEL_WORDS,
    SUSPECT_MARK,
    TURN_MARK,
} from "#/src/ui/panel-words.ts";
import {
    composeFakeDocument,
    dragOnElement,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    getWholeTextsByClass,
    pointAtElement,
    pressElement,
} from "#/tests/fake-document.ts";
import { tallyRecordedFight } from "#/tests/recorded-fights.ts";
import { getDeclaration, getRuleBody } from "#/tests/style-sheet.ts";

/**
 * The place these views stand in. Every test here reads what was drawn rather than where the
 * region was left, so one name says they are all the same place; the scroll tests name their own.
 */
/** Somewhere down a list, for a test that cares that the number came back rather than which. */
const SOMEWHERE_DOWN = 240;

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** Whose row on _leczenie dane_ opens onto a skill that reached somebody else. */
const HEALER = 469657;
/**
 * A fight whose hardest-hit row opens onto both kinds of opponent: one the level under says more
 * about, and one it says exactly the row again about. On `HILDUR` every pair opens, because the
 * boss both strikes and wounds each member (`src/core/fight-statistics.ts`, develop ADR 0022).
 */
const BOTH_KINDS_OF_PAIR = "captures/2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none.json";
/** The widest spread of keys behind a half-named figure in the corpus: four of them. */
const FOUR_KINDS = "captures/2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0.json";

/** Every heading a level may draw, and there is no sixth: none of them is a name out of a fight. */
const CUT_HEADINGS: string[] = [
    PANEL_WORDS.dealtTo,
    PANEL_WORDS.takenFrom,
    PANEL_WORDS.skills,
    PANEL_WORDS.damageKind,
    PANEL_WORDS.healthSource,
];

/**
 * The marks a row may wear before its name, each drawn only on the rows it reaches. They are named
 * here rather than filtered by shape: a cell appearing before a name for any other reason is the
 * bug the check below was written for, and a filter that could not tell the two apart would let
 * it back in.
 */
const ROW_MARK_CELLS = ["row-suspect", "row-caveat", "row-turn"];

Deno.test("the panel goes into a shadow root, under a name of ours", () => {
    const host = draw(readFight());
    assertStrictEquals(host.attributes.get("id"), "MargoMeter-Panel", "the host is named as ours");
    assertExists(host.shadow, "and everything else is behind a root of its own");
    assertStrictEquals(host.children.length, 0, "nothing is put beside the root");
    assertStrictEquals(
        host.shadow.length,
        5,
        "the look, the bar, the panel, the detail, and the window beside it",
    );
});

function draw(
    reading: ScreenContent,
    defects: readonly PanelDefect[] = [],
    place: { readerSide: number | null; turnHolderId: number | null } = {
        readerSide: null,
        turnHolderId: null,
    },
): FakeElement {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading),
        readerSide: place.readerSide,
        turnHolderId: place.turnHolderId,
        defects,
    });
    return panel.element as FakeElement;
}

function readFight(): ScreenContent {
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    return presentScreen(
        statistics,
        roster,
        "damageDealt",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
}

Deno.test("every name a reader meets before the panel's contents is ours", () => {
    const host = draw(readFight());
    const outside = [host, ...(host.shadow ?? [])];
    for (const outer of outside) {
        if (outer.className === "") continue;
        assert(outer.className.startsWith("MargoMeter-"), `${outer.className} is unprefixed`);
    }
    const inside = getElementsWithin(host).filter((drawn) => !outside.includes(drawn));
    assert(inside.length > 0, "and there is something inside the root to be exempt");
    assert(
        inside.some((drawn) => !drawn.className.startsWith("MargoMeter-")),
        "which is exempt, because the game's stylesheet cannot reach behind the root",
    );
});

Deno.test("the strips say which screen the panel is on, and mark it as more than a colour", () => {
    const host = draw(readFight());
    const strips = getElementsWithin(host).filter((strip) => strip.className === "strips");
    // Two rows: which quantity, then which way round. Nothing said which side is the reader's
    // own, so the second row carries no side strips beside the directions.
    assertStrictEquals(strips.length, 2, "which quantity, and which way round");
    const drawn = getElementsWithin(host).filter((strip) =>
        strip.className.split(" ")[0] === "strip"
    );
    assertStrictEquals(
        drawn.length,
        presentNounStrips("damageDealt").length +
            presentDirectionStrips("damageDealt").length,
        "one strip for each thing the two rows offer",
    );
    const selectedStrips = drawn.filter((strip) => strip.className.includes("selected"));
    assertStrictEquals(selectedStrips.length, 2, "one on each strip is where the panel is");
    for (const marked of selectedStrips) {
        // More than a hue: the marked strip stands on the raised surface, which is a shape.
        assert(marked.className.split(" ").length > 1, "and it is marked, not only tinted");
    }
    for (const strip of drawn) {
        const screen = strip.attributes.get("data-screen");
        assertExists(screen, "each strip says which screen it would reach");
        assert(isOneOf(SCREEN_ORDER, screen), "by a name a screen answers to");
    }
});

Deno.test("the side strip is drawn where the client said which side is the reader's own", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(readFight()), side: "reader", readerSide: 1 });
    const host = panel.element as FakeElement;
    const strips = getElementsWithin(host).filter((drawn) => drawn.className === "strips");
    assertStrictEquals(strips.length, 2, "two rows, and whose rows shares the lower one");
    const sides = getElementsWithin(host).filter(
        (drawn) => drawn.attributes.get("data-side") !== undefined,
    );
    assertStrictEquals(
        sides.length,
        presentSideStrips("reader").length,
        "one strip for each choice",
    );
    const lower = strips[1];
    assertExists(lower, "the lower row is drawn");
    assertArrayIncludes(lower.children, [sides[0] ?? lower], "and the side strips stand on it");
    assert(
        lower.children.some((child) => child.className === "strips-gap"),
        "behind the gap that holds them against the right edge",
    );
    const marked = sides.filter((strip) => strip.className.includes("selected"));
    assertStrictEquals(
        marked[0]?.attributes.get("data-side"),
        "reader",
        "and the chosen one is marked",
    );
});

/**
 * The shelf covers the screen rather than being one of them, so nothing on the strips claims the
 * reader is on a screen they cannot see.
 */
Deno.test("the shelf is a screen of its own, with the way back and no strips at all", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(readFight()),
        readerSide: 1,
        isOnShelf: true,
        fightPlace: { name: "Mapa", tile: "(1, 2)" },
    });
    const host = panel.element as FakeElement;
    // A header saying how this fight went, over a list of other fights, answers a question
    // nobody asked of that list; a strip picking a figure of it is the same thing twice. Where
    // the shelf is kept is asked in the options (ADR 0013), so no strip stands here at all.
    const strips = getElementsWithin(host).filter((drawn) => drawn.className === "strips");
    assertStrictEquals(strips.length, 0, "no strip, neither the fight's nor the storage's");
    assertEquals(getWholeTextsByClass(host, "header-place"), [], "and no header of the fight's");
    assertEquals(getTextsByClass(host, "crumb-here"), [PANEL_WORDS.fights], "the shelf says so");
    assertEquals(
        getTextsByClass(host, "crumb-back"),
        [`‹ ${PANEL_WORDS.backFromFights}`],
        "and the way off it goes back to the fight rather than up the shelf",
    );

    const shelf = getElementsWithin(host).filter(
        (drawn) => drawn.attributes.get("data-shelf") !== undefined,
    );
    assertStrictEquals(shelf.length, 1, "the shelf is reached by one control, on the bar");
    assert(shelf[0]?.className.startsWith("titlebar-button"), "a control and not a strip");
});

Deno.test("the options cover the screen, a heading over each question, with the way back", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(readFight()),
        readerSide: 1,
        fightPlace: { name: "Mapa", tile: "(1, 2)" },
        options: { storage: STORAGE_CHOICE.session, answers: [CHOICE_REFUSED_ANSWER] },
    });
    const host = panel.element as FakeElement;
    assertEquals(
        getElementsWithin(host).filter((drawn) => drawn.className === "strips"),
        [],
        "no strip, and so none of the fight's",
    );
    assertEquals(
        getTextsByClass(host, "options-heading"),
        [PANEL_WORDS.typeSize, PANEL_WORDS.windowSize, PANEL_WORDS.storage],
        "a heading over each question — the type, the size, where the shelf is kept",
    );
    assertEquals(getWholeTextsByClass(host, "header-place"), [], "no header of the fight's");
    assertEquals(
        getElementsWithin(host).filter((drawn) => drawn.className.startsWith("row")),
        [],
        "and no row of it",
    );
    assertEquals(getTextsByClass(host, "crumb-here"), [PANEL_WORDS.options], "the cover says so");
    assertEquals(
        getTextsByClass(host, "crumb-back"),
        [`‹ ${PANEL_WORDS.backFromOptions}`],
        "and carries the way off it",
    );
    assertEquals(
        getTextsByClass(host, "suspicion"),
        [`⚠ ${CHOICE_REFUSED_ANSWER}`],
        "with what the store answered standing under the strip that asked it",
    );
});

Deno.test("the options answer each question in the shape its answers need", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(readFight()),
        options: { storage: STORAGE_CHOICE.session, answers: [] },
    });
    const host = panel.element as FakeElement;
    assertEquals(
        getTextsByClass(host, "options-window-name"),
        [getWordsForWindow("meter"), getWordsForWindow("helper")],
        "a line for each window",
    );
    assertEquals(
        getTextsByClass(host, "options-window-state"),
        [PANEL_WORDS.sizeDefault, PANEL_WORDS.sizeDefault],
        "and neither was sized, which each line says",
    );
    assertEquals(
        getElementsWithin(host).filter((drawn) =>
            drawn.attributes.get("data-reset-size") !== undefined
        ),
        [],
        "so there is none to give back",
    );
    assertEquals(
        getTextsByClass(host, "options-meaning"),
        [PANEL_WORDS.resizeHint, getWordsForStorageMeaning("session")],
        "how a window is sized, and what the answer taken means for the fights kept",
    );
    assertEquals(
        getElementsWithin(host).filter((drawn) =>
            drawn.attributes.get("data-type-step") !== undefined
        )
            .map((drawn) => drawn.attributes.get("data-type-step")),
        ["small", "medium", "large"],
        "the three steps of type, smallest first",
    );
    assertEquals(
        getElementsWithin(host).filter((drawn) =>
            drawn.attributes.get("data-storage") !== undefined
        )
            .map((drawn) => drawn.attributes.get("data-storage")),
        ["local", "session", "memory"],
        "the three places a shelf can be kept, in the order they keep longest",
    );
    assertEquals(
        getChosenTexts(host, "data-type-step"),
        [getWordsForTypeStep(TYPE_STEP_DEFAULT)],
        "with the reader's own step marked",
    );
    assertEquals(
        getChosenTexts(host, "data-storage"),
        [getWordsForStorage("session")],
        "and the reader's own place",
    );
});

/** The words of the answers carrying `mark` that stand marked as the reader's own. */
function getChosenTexts(host: FakeElement, mark: string): string[] {
    return getElementsWithin(host)
        .filter((drawn) => drawn.attributes.get(mark) !== undefined)
        .filter((drawn) => drawn.className.split(" ").includes("selected"))
        .map((drawn) => drawn.textContent);
}

Deno.test("the options stand before any fight, since the choices in them are not a fight's", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.renderWaiting({
        ...NOTHING_WAITING,
        options: { storage: STORAGE_CHOICE.local, answers: [] },
    });
    const host = panel.element as FakeElement;
    assertEquals(getTextsByClass(host, "crumb-here"), [PANEL_WORDS.options], "the cover stands");
    assertEquals(
        getChosenTexts(host, "data-type-step"),
        [getWordsForTypeStep(TYPE_STEP_DEFAULT)],
        "with its answers",
    );
    assertEquals(getChosenTexts(host, "data-storage"), [getWordsForStorage("local")], "both");
    assertEquals(getTextsByClass(host, "empty"), [], "and not the sentence saying nothing came");
    panel.renderWaiting(NOTHING_WAITING);
    assertEquals(getTextsByClass(host, "crumb-here"), [], "closed, the cover is gone");
    assertEquals(getTextsByClass(host, "empty"), [PANEL_WORDS.noFightYet], "and waiting says so");
});

/**
 * The side strip narrows a ranking, is not drawn over a shelf, and narrows no shelf — so a shelf
 * standing at whichever height that strip last answered was following a choice about a list it is
 * not. The reader's own answer survives leaving the shelf, so it is a press and a press away.
 */
Deno.test("the shelf stands at its own height, whatever the side strip was last asked", () => {
    const readShelfHeight = (side: PanelSideChoice) => {
        const { reading } = readPinnedFight("damageDealt", side);
        const document = composeFakeDocument();
        const panel = initTestView(document);
        panel.render({
            ...composeShownScreen(reading),
            side,
            isOnShelf: true,
            readerSide: 1,
            turnHolderId: null,
        });
        const host = panel.element as FakeElement;
        return getElementsWithin(host).find((drawn) => drawn.className.startsWith("list"))
            ?.attributes.get("style");
    };
    const everyone = readShelfHeight("everyone");
    assertExists(everyone, "the shelf is a list, and a list states how tall it stands");
    assertStrictEquals(readShelfHeight("reader"), everyone, "a side chosen shortens no shelf");
    assertStrictEquals(readShelfHeight("opposing"), everyone, "and neither does the other one");
});

/** The fight the pinned tests are read from, on the screen each of them asks about. */
function readPinnedFight(
    metric: PanelMetric,
    choice: PanelSideChoice = "everyone",
    path: string = HILDUR,
) {
    const { roster, statistics } = tallyRecordedFight(path);
    const readerSide = [...roster.byId.values()][0]?.side ?? null;
    const reading = presentScreen(
        statistics,
        roster,
        metric,
        choice,
        readerSide,
        NOTHING_SUSPECT,
    );
    return { reading, statistics, roster, readerSide };
}

Deno.test("a fight draws a row for everybody in it, named", () => {
    const reading = readFight();
    const host = draw(reading);
    // A pinned row is a row of the same shape and opens like one, so the cursor separates neither
    // of them: what does is the mark, and a person's names them by id. It wears `apart` as well,
    // which is why this reads the mark rather than matching the class list whole.
    const rows = getElementsWithin(host).filter((drawn) =>
        drawn.className.split(" ").includes(CLASS.rowDrillable) &&
        drawn.attributes.get("data-row") !== undefined
    );
    assertStrictEquals(rows.length, reading.rows.length, "one row for each of them");
    for (const row of rows) {
        const name = row.children.find((cell) => cell.className === "row-name");
        assertExists(name, "each row says who it is about");
        assert(name.textContent.length > 0, "and says it in words");
    }
    const figures = getTextsByClass(host, `${CLASS.rowValue} ${CLASS.figure}`);
    const topRow = reading.rows[0];
    assertExists(topRow, "there is a first row");
    assertStrictEquals(
        figures[0],
        formatFigure(topRow.figure),
        "with the figure the reading holds",
    );
    const ranks = getTextsByClass(host, "row-rank");
    assertStrictEquals(ranks[0], "1.", "and its place in the ranking before the name");
    const shares = getTextsByClass(host, "row-share");
    assertStrictEquals(
        shares[0],
        `(${topRow.shareText})`,
        "and the share the bar draws, in brackets",
    );
});

Deno.test("a fight nothing has happened in says so, rather than drawing nothing", () => {
    const host = draw({
        rows: [],
        outcome: null,
        sizes: [],
        unplaced: 0,
        total: 0,
        pinned: [],
        outsideRanking: null,
        suspicions: [],
        hasFiguresDisagreed: false,
        sides: null,
        rowsVisibleCount: 11,
    });
    assertEquals(getTextsByClass(host, "empty"), [PANEL_WORDS.nothingYet], "it says so in words");
    assertEquals(getTextsByClass(host, "row-name"), [], "and draws no row at all");
});

Deno.test("what nobody can be charged with is a row apart from the ranking", () => {
    const reading = readFight();
    const host = draw(reading);
    assert(reading.pinned.length > 0, "this fight has damage tied to no attacker");
    const blocks = getElementsWithin(host).filter((drawn) => drawn.className === "pinned-region");
    assertStrictEquals(blocks.length, 1, "which stands below the ranking in a block of its own");
    const inside = blocks[0]?.children ?? [];
    assertStrictEquals(inside.length, 1, "holding one row");
    assert(inside[0]?.className.includes("row"), "which is a row like any other");
    const list = getElementsWithin(host).find((drawn) => drawn.className === "list");
    assertExists(list, "and the list is a region of its own");
    assertEquals(
        getElementsWithin(list).filter((drawn) => drawn.className === "pinned-region"),
        [],
        "which the pinned row stands outside, so it never scrolls away",
    );
});

/**
 * The two questions a pinned row raises, answered where a reader asks them. The second is the one
 * that was a trap: `Otrzymane` states a figure the rows above it already hold, and nothing on
 * screen said so. `develop ADR 0038`.
 */
Deno.test("a pinned row says what the game left out, and where its figure stands", () => {
    const held = readPinned("damageDealt", "everyone");
    assertStrictEquals(held.pinned.end, "actor", "this fight leaves the striker out");
    assertEquals(
        held.card.notes,
        [
            getNoteForUnnamedEnd("actor", "damage"),
            getWordsForPinnedStanding(held.pinned.case),
            CARD_WORDS.gesture,
        ],
        "under everybody it says two things, and that pressing leads somewhere",
    );
    assertArrayIncludes(
        held.card.lines,
        [PANEL_WORDS.share],
        "over the share it takes of the screen",
    );

    const narrowed = readPinned("damageDealt", "reader");
    assertStrictEquals(
        narrowed.card.notes[2],
        getWordsForPinnedScope(narrowed.pinned.case),
        "and a chosen side adds what that side is to the figure",
    );
    assertStrictEquals(narrowed.card.notes.length, 4, "which is the third sentence and the last");
});

/** A pinned row on one screen and one choice of side, with the card a pointer opens on it. */
function readPinned(
    metric: PanelMetric,
    choice: PanelSideChoice,
    path: string = HILDUR,
): { pinned: PinnedRow; card: ReturnType<typeof readCard> } {
    const { reading } = readPinnedFight(metric, choice, path);
    return readPinnedCard(reading, metric, choice);
}

/** The same, off a reading built by hand: no recording pins a figure on either healing screen. */
function readPinnedCard(
    reading: ScreenContent,
    metric: PanelMetric,
    choice: PanelSideChoice,
): { pinned: PinnedRow; card: ReturnType<typeof readCard> } {
    const pinned = reading.pinned[0];
    assertExists(pinned, `${metric} ${choice}: this fight pins a figure`);
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading, metric), side: choice });
    const host = panel.element as FakeElement;
    const pinnedCell = getElementsWithin(host).find(
        (drawn) => drawn.attributes.get("data-card") === `pinned:${pinned.end}`,
    );
    assertExists(pinnedCell, `${metric} ${choice}: the pinned row is drawn`);
    pointAtElement(host, "pointermove", pinnedCell, 300);
    return { pinned, card: readCard(host) };
}

/**
 * The sentence a screen showing a cut owes, and the one it must not repeat: the figure there is
 * already inside the rows above it, and the wording says so rather than saying it stands apart.
 */
Deno.test("a pinned row already counted in the list above it says so", () => {
    const held = readPinned("damageTaken", "everyone");
    assertStrictEquals(held.pinned.placing, "cut", "on this screen the rows hold the figure");
    const said = getWordsForPinnedStanding(held.pinned.case);
    assertArrayIncludes(held.card.notes, [said], "and the card says it is counted there");
    const apart = readPinned("damageDealt", "everyone");
    assert(
        !held.card.notes.includes(getWordsForPinnedStanding(apart.pinned.case)),
        "never the sentence for a figure standing apart",
    );
});

/**
 * ⚠️ **The question a reader opens this row to answer, answered before they open it.** develop ADR
 * 0039 kept the cut and put it a press away; the card states the same rows, worded by the same
 * table and ranked the same way, so the run under the heading and the level under the row are one
 * answer read in two places. `develop ADR 0041`.
 */
Deno.test("a pinned row says what its figure was dealt with, before anybody presses it", () => {
    const held = readPinned("damageDealt", "everyone", FOUR_KINDS);
    assertEquals(held.card.headings, [PANEL_WORDS.damageKind], "the card heads the run it draws");
    assertStrictEquals(held.card.groups, 3, "the figure, what it was made of, and the sentences");
    const kinds = held.pinned.kinds.rows;
    assert(kinds.length > 1, "this fight states more than one key for what it names nobody for");
    const said = held.card.stated.filter((line) => line.isSub);
    assertEquals(
        said.map((line) => line.label),
        kinds.map((kind) => getWordsForDamageKind(kind.element)),
        "one line per kind, in the order the level under the row draws them",
    );
    assertEquals(
        said.map((line) => line.value),
        kinds.map((kind) => `${formatFigure(kind.figure)} (${kind.shareText})`),
        "each stating the figure and the share that level states for it",
    );
    const total = kinds.reduce((sum, kind) => sum + kind.figure, 0);
    assertStrictEquals(total, held.pinned.figure, "and the run comes to the figure over it");
});

/**
 * The other noun's heading, on a figure built for it: no recording pins either healing screen, so
 * the word `OD CZEGO` reaches a card nowhere in the material. A key restoring health is not a kind
 * of damage, and one heading over both would be two quantities under one word.
 */
Deno.test("a pinned row on a healing screen heads its run with the key, not the kind", () => {
    const { roster } = tallyRecordedFight(HILDUR);
    const [healed] = [...roster.byId.keys()];
    assertExists(healed, "the fight holds somebody to heal");
    const statistics = tallyFightStatistics([{
        kind: "health-change",
        combatantId: healed,
        amount: 400,
        healthPercent: null,
        source: "bandage",
        declared: [],
        announced: null,
    }], new Map());
    const reading = presentScreen(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const held = readPinnedCard(reading, "healthGiven", "everyone");
    assertEquals(held.card.headings, [PANEL_WORDS.healthSource], "the key is what put it back");
    assertEquals(
        held.card.stated.filter((line) => line.isSub).map((line) => line.label),
        [getWordsForHealthSource("bandage")],
        "and it is worded out of the table that screen's rows are worded from",
    );
});

/**
 * The card is a preview and the level is the whole of it, so what will not fit on the card is
 * summed rather than dropped: a run short of the figure over it is a run that lies about it. No
 * recording reaches this — the widest pinned row over `captures/` states four keys on
 * 2026-09-01 — so the seven are built here. `develop ADR 0041`.
 */
Deno.test("a pinned row with more kinds than the card holds sums the rest into one line", () => {
    const { roster } = tallyRecordedFight(HILDUR);
    const [struck] = [...roster.byId.keys()];
    assertExists(struck, "the fight holds somebody to strike");
    const keys = ["poison", "fire", "light", "injure", "wound", "anguish", "heal"];
    const statistics = tallyFightStatistics(
        keys.map((source, keyIndex) => ({
            kind: "health-change" as const,
            combatantId: struck,
            amount: -(keys.length - keyIndex) * 100,
            healthPercent: null,
            source,
            declared: [],
            announced: null,
        })),
        new Map(),
    );
    const reading = presentScreen(
        statistics,
        roster,
        "damageTaken",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const held = readPinnedCard(reading, "damageTaken", "everyone");
    assertStrictEquals(
        held.pinned.kinds.rows.length,
        keys.length,
        "the level holds every key of it",
    );
    const said = held.card.stated.filter((line) => line.isSub);
    assertStrictEquals(said.length, 7, "and the card holds six of them, and one line for the rest");
    assertStrictEquals(
        said[6]?.label,
        PANEL_WORDS.restOfKinds,
        "which says it is the rest of them",
    );
    assertStrictEquals(said[6]?.value, formatFigure(100), "at what those keys came to");
    const kinds = held.pinned.kinds.rows.reduce((sum, kind) => sum + kind.figure, 0);
    assertStrictEquals(
        kinds,
        held.pinned.figure,
        "and the level under it is still the whole figure",
    );
});

/**
 * A pinned row opens like any other, and is marked unlike any other: nobody stands behind it to
 * be named by an id, so the mark names the end it leaves out.
 */
Deno.test("a pinned row is pressed by the end it leaves out, from any part of it", () => {
    const reading = readFight();
    const pressed: PanelIntent[] = [];
    const document = composeFakeDocument();
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    panel.render({ ...composeShownScreen(reading), side: "everyone" as const });
    const host = panel.element as FakeElement;
    const block = getElementsWithin(host).find((drawn) => drawn.className === "pinned-region");
    assertExists(block, "the pinned row stands in a block of its own");
    const row = block.children[0];
    assertExists(row, "and there is a row inside it");
    assertStringIncludes(row.className, "drillable", "which wears the cursor of a row that opens");
    for (const cell of [row, ...row.children]) {
        assertStrictEquals(
            cell.attributes.get("data-unnamed"),
            "actor",
            "every cell carries the mark",
        );
    }
    const name = row.children.find((cell) => cell.className === "row-name");
    assertExists(name, "the row names what it stands for");
    pressElement(host, "pointerdown", name);
    assertEquals(
        pressed,
        [{ kind: PANEL_INTENT.openUnnamed, end: UNNAMED_END.actor }],
        "and a press asks for that end",
    );
});

/**
 * What the level says. The people are the end the game **did** name, headed by the row rather than
 * by the screen, so a figure with no striker is headed by whom it reached. The kinds are the one
 * question a row naming nobody can still answer, and both cut the same figure.
 */
Deno.test("a pinned row opens onto the end the game did name, under its own heading", () => {
    const { reading, statistics, roster } = readPinnedFight("damageDealt");
    const pinned = reading.pinned[0];
    assertExists(pinned, "this fight pins a figure");
    const halfNamed = presentUnnamedLevel(statistics, roster, pinned.case, "everyone", null);
    assertExists(halfNamed, "which opens onto a level");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading), unnamed: halfNamed });
    const host = panel.element as FakeElement;
    const sections = getElementsWithin(host)
        .filter((heading) => heading.className === "section-heading")
        .map((heading) => heading.children[0]?.textContent);
    assertEquals(
        sections,
        [PANEL_WORDS.dealtTo, PANEL_WORDS.damageKind],
        "two sections: whom the health went from, and what it was taken with",
    );
    const named = getTextsByClass(host, "row-name");
    assertEquals(
        named,
        [
            ...halfNamed.rows.map((row) => row.name ?? PANEL_WORDS.unknown),
            ...halfNamed.kinds.rows.map((kind) => getWordsForDamageKind(kind.element)),
        ],
        "and lists both, each in the order the reading ranked it",
    );
    const doesOpen = getElementsWithin(host)
        .filter((drawn) => drawn.className === "row drillable")
        .map((drawn) => drawn.attributes.get("data-row") ?? drawn.attributes.get("data-kind"));
    assertEquals(
        doesOpen,
        [
            ...halfNamed.rows.map((row) => `${row.combatantId}`),
            ...halfNamed.kinds.rows.map((kind) => kind.element),
        ],
        "every row of it opens: each is one of the two folds read the other way round",
    );
    const crumb = getTextsByClass(host, "crumb-here");
    assertEquals(crumb, [PANEL_WORDS.withoutActor], "and the way back says which row is open");
});

/**
 * What the pinned row says, one level down, worded for a level about one person: what was left
 * out, that it is inside the figure over the section, and which row under the list holds it too.
 * Never the side sentence, because no side narrows one person's figure (ADR 0034).
 */
Deno.test("an end left out inside an opened figure says what was left out, and where it stands", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading),
        side: "reader" as const,
        opened: {
            ...drill,
            byOtherEnd: {
                ...drill.byOtherEnd,
                halfNamed: {
                    figure: 120,
                    fill: 0.1,
                    shareText: "<1%",
                    doesOpenPair: false,
                    kinds: null,
                },
            },
        },
    });
    const host = panel.element as FakeElement;
    const unnamedCell = getElementsWithin(host).find(
        (drawn) => drawn.attributes.get("data-card") === "to:nobody",
    );
    assertExists(unnamedCell, "the row for the end nobody was named at is drawn");
    assertStringIncludes(
        unnamedCell.className,
        "leaf",
        "and one with no level under it opens nothing",
    );
    assertStrictEquals(
        unnamedCell.attributes.get("data-unnamed"),
        undefined,
        "so it carries no mark",
    );
    pointAtElement(host, "pointermove", unnamedCell, 300);
    const card = readCard(host);
    const standing = getNoteForOpenedUnnamedStanding("damageDealt");
    assertExists(standing, "a dealing screen says which row under the list holds it");
    assertStringIncludes(standing, PANEL_WORDS.withoutTarget, "the row for the same end");
    assertEquals(
        card.notes,
        [getNoteForUnnamedEnd("target", "damage"), CARD_WORDS.insideSection, standing],
        "what the game did not say, that the section counts it, and where else it stands",
    );
    assert(
        !card.notes.includes(getWordsForPinnedScope("takenWithNoTarget")),
        "never the side sentence: a level about one person is narrowed by no side",
    );
    assertEquals(card.headings, [], "and no run of kinds where no level under it is kept");
});

function openFirstRow() {
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    const reading = presentScreen(
        statistics,
        roster,
        "damageDealt",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const topRow = reading.rows[0];
    assertExists(topRow, "there is a row to open");
    const drill = presentOpenedLevel(statistics, roster, "damageDealt", topRow.combatantId);
    assertExists(drill, "and the screen it sits on cuts further");
    return { reading, drill, opened: topRow };
}

/**
 * Where the level under it is kept, the card states that level's kinds before the press, as the
 * pinned row does: the same rows, worded by the same table (ADR 0034, `develop ADR 0041`).
 */
Deno.test("an end left out inside an opened figure states its kinds where the level under it is kept", () => {
    const { reading, statistics, roster } = readPinnedFight("damageTaken");
    const opened = reading.rows
        .map((row) => presentOpenedLevel(statistics, roster, "damageTaken", row.combatantId))
        .find((drill) => drill?.byOtherEnd.halfNamed?.doesOpenPair === true);
    assertExists(opened, "somebody on the screen lost health nobody was named for");
    const halfNamed = opened.byOtherEnd.halfNamed;
    assertExists(halfNamed, "and the row for it is drawn");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading, "damageTaken"), opened });
    const card = readCardByKey(panel.element as FakeElement, "to:nobody");
    assertEquals(card.headings, [PANEL_WORDS.damageKind], "the card heads the run it draws");
    assertStrictEquals(card.groups, 3, "the figure, what it was made of, and the sentences");
    const standing = getNoteForOpenedUnnamedStanding("damageTaken");
    assertExists(standing, "a receiving screen says which row under the list holds it");
    assertStringIncludes(standing, PANEL_WORDS.withoutActor, "the row for the same end");
    assertArrayIncludes(card.notes, [standing], "and the card says it");
    const kinds = halfNamed.kinds?.rows ?? [];
    assert(kinds.length > 0, "the level under the row holds kinds");
    const said = card.stated.filter((line) => line.isSub);
    assertEquals(
        said.map((line) => line.label),
        kinds.map((kind) => getWordsForDamageKind(kind.element)),
        "one line per kind, in the order the level under the row draws them",
    );
    assertEquals(
        said.map((line) => line.value),
        kinds.map((kind) => `${formatFigure(kind.figure)} (${kind.shareText})`),
        "each stating the figure and the share that level states for it",
    );
    const total = kinds.reduce((sum, kind) => sum + kind.figure, 0);
    assertStrictEquals(total, halfNamed.figure, "and the run comes to the figure over it");
});

/** The card a row opens, read off the row drawn under the given key. */
function readCardByKey(host: FakeElement, key: string): ReturnType<typeof readCard> {
    const cell = getElementsWithin(host).find((drawn) => drawn.attributes.get("data-card") === key);
    assertExists(cell, `the row carded ${key} is drawn`);
    pointAtElement(host, "pointermove", cell, 300);
    return readCard(host);
}

/** A part keeps no cut by the end it left out, so its card says the sentences and states no run. */
Deno.test("an end left out under an opened part says where it stands, and states no kinds", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading),
        opened: drill,
        part: {
            part: { kind: "plain" as const },
            total: 120,
            byOtherEnd: {
                rows: [],
                halfNamed: {
                    figure: 120,
                    fill: 1,
                    shareText: "100%",
                    doesOpenPair: false,
                    kinds: null,
                },
            },
        },
    });
    const card = readCardByKey(panel.element as FakeElement, "reached:nobody");
    const standing = getNoteForOpenedUnnamedStanding("damageDealt");
    assertExists(standing, "a dealing screen says which row under the list holds it");
    assertEquals(
        card.notes,
        [getNoteForUnnamedEnd("target", "damage"), CARD_WORDS.insideSection, standing],
        "the same three sentences as inside the opened figure",
    );
    assertEquals(card.headings, [], "and no run of kinds");
});

/**
 * Where the level under it totals it, the same row opens, and it is pressed as a pinned row is: by
 * the end it leaves out, from any cell of it.
 */
Deno.test("an end left out inside an opened figure is pressed by that end, from any part of it", () => {
    const { reading, drill } = openFirstRow();
    const pressed: PanelIntent[] = [];
    const document = composeFakeDocument();
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    panel.render({
        ...composeShownScreen(reading),
        opened: {
            ...drill,
            byOtherEnd: {
                ...drill.byOtherEnd,
                halfNamed: {
                    figure: 120,
                    fill: 0.1,
                    shareText: "<1%",
                    doesOpenPair: true,
                    kinds: null,
                },
            },
        },
    });
    const host = panel.element as FakeElement;
    const row = getElementsWithin(host).find(
        (drawn) => drawn.attributes.get("data-card") === "to:nobody",
    );
    assertExists(row, "the row for the end nobody was named at is drawn");
    assertStringIncludes(row.className, "drillable", "and wears the cursor of a row that opens");
    for (const cell of [row, ...row.children]) {
        assertStrictEquals(
            cell.attributes.get("data-unnamed"),
            "target",
            "every cell carries the mark",
        );
    }
    pointAtElement(host, "pointermove", row, 300);
    assertArrayIncludes(readCard(host).notes, [CARD_WORDS.gesture], "its card says it opens");
    const name = row.children.find((cell) => cell.className === "row-name");
    assertExists(name, "the row names what it stands for");
    pressElement(host, "pointerdown", name);
    assertEquals(
        pressed,
        [{ kind: PANEL_INTENT.openUnnamed, end: UNNAMED_END.target }],
        "and a press asks for that end",
    );
});

/**
 * The level under it is the person's own keys, and the way back is to the person: the level is
 * about the end their figure left out, so that is what the crumb says is open.
 */
Deno.test("an end left out inside an opened figure opens onto its keys, and back to the person", () => {
    const { reading, statistics, roster } = readPinnedFight("damageTaken");
    const opened = reading.rows
        .map((row) => presentOpenedLevel(statistics, roster, "damageTaken", row.combatantId))
        .find((drill) => drill?.byOtherEnd.halfNamed?.doesOpenPair === true);
    assertExists(opened, "somebody on the screen lost health nobody was named for");
    const under = presentUnnamedPairLevel(statistics, roster, "damageTaken", opened.combatantId);
    assertExists(under, "and the level under that row is composed");
    assertStrictEquals(under.opened, "person", "as that person's own keys");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading, "damageTaken"),
        opened: opened,
        unnamedCut: under,
    });
    const host = panel.element as FakeElement;
    assertEquals(
        getTextsByClass(host, "row-name"),
        under.kinds.rows.map((kind) => getWordsForDamageKind(kind.element)),
        "the level lists the keys, each in the order the reading ranked it",
    );
    assertEquals(
        getElementsWithin(host).filter((drawn) => drawn.className === "row drillable"),
        [],
        "and nothing on it opens",
    );
    const [firstKind] = under.kinds.rows;
    assertExists(firstKind, "the level holds a key");
    assertEquals(
        readCardByKey(host, `kind:${firstKind.element}`).notes,
        [getNoteForUnnamedEnd("actor", "damage")],
        "and each key says the game did not name who dealt it",
    );
    assertEquals(getTextsByClass(host, "crumb-here"), [PANEL_WORDS.withoutActor], "it says what");
    assertEquals(
        getTextsByClass(host, "crumb-back").map((crumb) => crumb.includes(opened.name ?? "")),
        [true],
        "and the way back names the person it was opened from",
    );
});

/**
 * Every row under a row naming nobody stands under that same absence, so each says it — a person's
 * card before the sentence about the fight's figures, a key's beside the instruction (ADR 0034).
 */
Deno.test("every row under a pinned row says which end the game left out", () => {
    const { reading, statistics, roster } = readPinnedFight("damageDealt");
    const pinned = reading.pinned[0];
    assertExists(pinned, "this fight pins a figure");
    const halfNamed = presentUnnamedLevel(statistics, roster, pinned.case, "everyone", null);
    assertExists(halfNamed, "which opens onto a level");
    const [person] = halfNamed.rows;
    const [kind] = halfNamed.kinds.rows;
    assertExists(person, "the level lists somebody");
    assertExists(kind, "and a key");
    const note = getNoteForUnnamedEnd("actor", "damage");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading),
        unnamed: {
            ...halfNamed,
            kinds: {
                ...halfNamed.kinds,
                rest: { figure: 10, fill: 0.1, shareText: "<1%" },
            },
        },
    });
    const host = panel.element as FakeElement;
    const personNotes = readCardByKey(host, `named:${person.combatantId}`).notes;
    assertEquals(
        personNotes.slice(personNotes.indexOf(note)),
        [note, CARD_WORDS.scope, CARD_WORDS.gesture],
        "a person says it, then that the card's figures are the fight's, then that it opens",
    );
    assertEquals(
        readCardByKey(host, `kind:${kind.element}`).notes,
        [note, CARD_WORDS.gesture],
        "a key says it, and that it opens",
    );
    assertEquals(
        readCardByKey(host, "kind:rest").notes,
        [PANEL_WORDS.restNote, note],
        "and the keys summed past the bound say it after what they are",
    );

    const cut = presentUnnamedCutLevel(statistics, roster, pinned.case, "everyone", null, {
        kind: "element",
        element: kind.element,
    });
    assertExists(cut, "a key opens onto its own people");
    assertStrictEquals(cut.opened, "element", "listed person by person");
    const [carrier] = cut.rows;
    assertExists(carrier, "and somebody carries it");
    panel.render({ ...composeShownScreen(reading), unnamed: halfNamed, unnamedCut: cut });
    const carrierNotes = readCardByKey(host, `named:${carrier.combatantId}`).notes;
    assertEquals(
        carrierNotes.slice(carrierNotes.indexOf(note)),
        [note, CARD_WORDS.scope],
        "a person on the third level says it too, and opens nothing",
    );
});

/** The rows of a figure both ends of which the game named carry none of it. */
Deno.test("no row inside an opened figure says an end was left out but the row that stands for it", () => {
    const { reading, drill } = openFirstRow();
    const [opponent] = drill.byOtherEnd.rows;
    const [kind] = drill.byElement.rows;
    assertExists(opponent, "the opened figure reached somebody");
    assertExists(kind, "and was dealt with something");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading), opened: drill });
    const host = panel.element as FakeElement;
    const notes = [
        ...readCardByKey(host, `to:${opponent.combatantId}`).notes,
        ...readCardByKey(host, `kind:${kind.element}`).notes,
    ];
    for (const end of Object.values(UNNAMED_END)) {
        assert(
            !notes.includes(getNoteForUnnamedEnd(end, "damage")),
            `none says the ${end} is unknown`,
        );
    }
});

Deno.test("the fight is totalled in two figures, and a suspicion is said under them", () => {
    const reading = readFight();
    const sides = { reader: 300, opposing: 700, nobody: 0 };
    const host = draw({ ...reading, sides });
    const strip = getElementsWithin(host).filter((drawn) => drawn.className === "MargoMeter-sides");
    assertStrictEquals(strip.length, 1, "the strip is there whether or not anything went wrong");
    const line = getElementsWithin(host).find((drawn) => drawn.className === "sides");
    assertEquals(
        line?.children.map((child) => child.textContent),
        [formatFigure(300), "My / Oni", formatFigure(700)],
        "the reader's own side, what the two are, and the other side",
    );
    const track = getElementsWithin(host).find((drawn) => drawn.className === "sides-track");
    assertEquals(
        track?.children.map((child) => child.attributes.get("style")),
        ["width:30.0%", "width:70.0%"],
        "and a track split where the fight is split, with no segment for a part of nothing",
    );
    assertEquals(getTextsByClass(host, "sides-spare"), [], "and nothing said about no side");
    assertEquals(getTextsByClass(host, "suspicion"), [], "nothing here is short, so none is said");

    // Colour never carries a meaning alone: each figure stands beside its own label, in its own
    // fixed place, and the ink is what the segment of the track paints itself with.
    const ours = getElementsWithin(host).find((drawn) =>
        drawn.className === `${CLASS.sidesOurs} ${CLASS.figure}`
    );
    assertExists(ours, "the reader's own side is named as theirs");
    assertStrictEquals(ours.attributes.get("style"), undefined, "and no colour is written onto it");
});

/**
 * The strip totals the whole fight whatever the list under it is showing, so wherever the two
 * differ the label has to say so. The pinned row's level was the one that did not: it is reached
 * without opening a row, and the question was spelled as `drill === null`.
 */
Deno.test("the strip says it is the whole fight wherever the list under it is not", () => {
    const { reading, statistics, roster, readerSide } = readPinnedFight("damageDealt");
    const opened = reading.rows[0];
    assertExists(opened, "there is a row to open");
    const drill = presentOpenedLevel(statistics, roster, "damageDealt", opened.combatantId);
    assertExists(drill, "and it opens");
    const halfNamed = presentUnnamedLevel(
        statistics,
        roster,
        "dealtWithNoActor",
        "everyone",
        readerSide,
    );
    assertExists(halfNamed, "and this fight pins a figure that opens too");

    const readLabel = (over: Partial<ShownScreen>) => {
        const document = composeFakeDocument();
        const panel = initTestView(document);
        panel.render({ ...composeShownScreen(reading), ...over });
        return getTextsByClass(panel.element as FakeElement, CLASS.sidesLabel);
    };
    const whole = `${PANEL_WORDS.wholeFight} · ${PANEL_WORDS.ourSide} / ${PANEL_WORDS.theirSide}`;
    const both = `${PANEL_WORDS.ourSide} / ${PANEL_WORDS.theirSide}`;

    assertEquals(readLabel({}), [both], "on the ranking the strip and the list are one fight");
    assertEquals(
        readLabel({ opened: drill }),
        [whole],
        "inside a row the strip is wider than the list",
    );
    assertEquals(
        readLabel({ unnamed: halfNamed }),
        [whole],
        "and inside a pinned row it is wider too, which is what the label has to say",
    );
});

Deno.test("what belongs to neither side is drawn as belonging to neither", () => {
    const reading = readFight();
    const host = draw({ ...reading, sides: { reader: 300, opposing: 600, nobody: 100 } });
    assertEquals(
        getTextsByClass(host, "sides-spare"),
        [],
        "not a line of its own text: the label and the figure are two cells inside it",
    );
    const spare = getElementsWithin(host).find((drawn) => drawn.className.includes("sides-spare"));
    assertEquals(
        spare?.children.map((child) => child.textContent),
        [PANEL_WORDS.withoutSide, formatFigure(100)],
        "below the two, saying what cannot be charged and how much of it there is",
    );
    const track = getElementsWithin(host).find((drawn) => drawn.className === "sides-track");
    assertStrictEquals(track?.children.length, 3, "and the track states it as a third segment");
});

Deno.test("a suspicion about the reading is said under the strip, in words and once", () => {
    const reading = readFight();
    const said = "Nie udało się odczytać wszystkiego.";
    const short = draw({ ...reading, suspicions: [said] });
    assertEquals(
        getTextsByClass(short, "suspicion"),
        [`⚠ ${said}`],
        "in words, behind a glyph, since colour never carries a meaning alone",
    );
    const list = getElementsWithin(short).find((drawn) => drawn.className === "list");
    assertExists(list, "the list is a region of its own");
    const under = getElementsWithin(list).filter((drawn) => drawn.className === "suspicion");
    assertEquals(under, [], "and the suspicion is not a row, so it never scrolls away with one");
});

/**
 * A defect is a claim about the add-on and a suspicion is a claim about the fight, so the panel
 * keeps them in two blocks. Collapsing them is how a reader learns to skip both —
 * `CONTEXT.md`.
 */
Deno.test("what the panel could not do stands apart from what the reading leaves suspect", () => {
    const reading = readFight();
    const suspicion = "Nie udało się odczytać wszystkiego.";
    const defect = { kind: PANEL_DEFECT_KIND.region, region: PANEL_REGION.list, count: 1 };
    const host = draw({ ...reading, suspicions: [suspicion] }, [defect]);
    assertEquals(
        getTextsByClass(host, "defect"),
        ["✖ Panel nie narysował listy."],
        "in words, behind a glyph of its own, since colour never carries a meaning alone",
    );
    assertEquals(
        getTextsByClass(host, "suspicion"),
        [`⚠ ${suspicion}`],
        "and the suspicion keeps its own block and its own glyph",
    );
});

Deno.test("a panel with nothing to admit to draws no block at all", () => {
    const host = draw(readFight());
    assertEquals(getTextsByClass(host, "defect"), [], "the block is drawn only where there is one");
});

/**
 * The one thing this whole surface exists for: a region that will not draw costs its own place and
 * nothing else, and the reader is told rather than left reading a panel that is quietly short.
 */
Deno.test("a region that throws is marked in place, and said once however often it happens", () => {
    const document = composeFakeDocument();
    const marks: string[] = [];
    const panel = initTestView(document);
    const reading = readFight();
    const broken = {
        ...reading,
        get sides(): ScreenContent["sides"] {
            throw new RangeError("a region that will not draw");
        },
    };
    for (let time = 0; time < 2; time += 1) {
        const report = panel.render({ ...composeShownScreen(broken) });
        marks.push(...report.undrawn.map((failure) => `${failure.name}/${failure.region}`));
    }
    assertEquals(
        marks,
        ["RegionUndrawn/sides", "RegionUndrawn/sides"],
        "the failure says which part of the panel it cost, every time it happens",
    );
    const host = panel.element as FakeElement;
    assertEquals(
        getTextsByClass(host, "undrawn"),
        [formatUndrawn("sides")],
        "and that part stands as a marker of its own size, in place",
    );
    assert(getTextsByClass(host, "row-name").length > 0, "while the ranking is drawn as it was");
});

/**
 * The document's own call is a region's to lose as well: a draw that could not put a region in
 * place leaves the one a reader already has, and the rest of the panel moves on without it.
 */
Deno.test("a region the document will not replace is kept as it was, and said", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const reading = readFight();
    panel.render({ ...composeShownScreen(reading) });
    const host = panel.element as FakeElement;
    const standing = getElementsWithin(host).filter((drawn) => drawn.className === CLASS.header);
    assertStrictEquals(standing.length, 1, "the header stands once, to be refused");
    for (const header of standing) {
        header.replaceWith = () => {
            throw new RangeError("a node the document will not let go of");
        };
    }
    const report = panel.render({ ...composeShownScreen(reading) });
    const marks = report.undrawn.map((failure) => `${failure.name}/${failure.region}`);
    assertEquals(
        marks,
        ["RegionUndrawn/header"],
        "the failure names the region it cost, and only that",
    );
    assertStrictEquals(standing[0]?.replacedBy, null, "and the header a reader had stays put");
    assert(getTextsByClass(host, "row-name").length > 0, "while the ranking is drawn again");
});

/**
 * A size of type asks both windows how wide they stand before the sheet changes, and the drag
 * answers off the page. A page that throws there costs the window beside the panel its move, and
 * the panel is drawn in the new type all the same.
 */
Deno.test("a page that throws as a size of type is read costs the helper, and only it", () => {
    const document = composeFakeDocument();
    let willThrow = false;
    const viewport = () => {
        if (willThrow) throw new RangeError("a page that will not say how big it is");
        return { width: 1280, height: 900 };
    };
    const size = { width: 300, height: 400 };
    const panel = initTestView(document, {
        meterPlacement: { position: null, size, readViewport: viewport },
        helperPlacement: { position: null, size, readViewport: viewport },
    });
    willThrow = true;
    const report = panel.render({ ...composeShownScreen(readFight()), typeStep: TYPE_STEP.large });
    const regions = new Set(report.undrawn.map((failure) => failure.region));
    assert(regions.has(PANEL_REGION.helper), "the failure is charged to the window beside");
    assertStrictEquals(regions.has(PANEL_REGION.list), false, "and never to the list");
    const host = panel.element as FakeElement;
    assert(getTextsByClass(host, "row-name").length > 0, "which is drawn");
    const sheet = getElementsWithin(host).find((drawn) => drawn.tag === "style");
    assertStrictEquals(
        sheet?.textContent,
        composeStyleSheet(TYPE_STEP.large),
        "in the type the reader asked for",
    );
});

/**
 * A suspicion about one person goes on their row and nowhere else: a sentence under the list
 * qualifies every row on it, and a reader looking at one of them could not tell whether it meant
 * theirs. `DESIGN.md` — put a suspicion where its consequence is.
 */
Deno.test("a suspicion about one person is a mark on their row, and on nobody else's", () => {
    const reading = readFight();
    const topRow = reading.rows[0];
    assertExists(topRow, "there is a row to mark");
    const host = draw({
        ...reading,
        rows: reading.rows.map((row) =>
            row.combatantId === topRow.combatantId
                ? { ...row, detail: { ...row.detail, unreadMessagesUnknownKey: 2 } }
                : row
        ),
    });
    const marks = getElementsWithin(host).filter((drawn) => drawn.className === CLASS.rowSuspect);
    assertStrictEquals(marks.length, 1, "one row wears it, out of a fight of eleven");
    assertStrictEquals(marks[0]?.textContent, SUSPECT_MARK, "as a glyph, never as a colour alone");
    assertEquals(
        getTextsByClass(host, "suspicion"),
        [],
        "and nothing about it stands under the list",
    );

    const unmarked = draw(reading);
    assertEquals(
        getElementsWithin(unmarked).filter((drawn) => drawn.className === CLASS.rowSuspect),
        [],
        "a fight nothing went unread in draws no mark at all",
    );
});

Deno.test("every listener sits on the root, where a press is not retargeted", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
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
        assertStrictEquals(host.rootListeners.get(type)?.length, 1, `${type} is listened for once`);
    }
    for (const drawn of getElementsWithin(host)) {
        assertStrictEquals(drawn.rootListeners.size, drawn === host ? 4 : 0, "no row carries one");
    }
});

Deno.test("a press on a strip reaches the panel, and a press on anything else does not", () => {
    const document = composeFakeDocument();
    const pressed: PanelIntent[] = [];
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    panel.render(composeShownScreen(readFight()));
    const host = panel.element as FakeElement;
    const strips = getElementsWithin(host).filter((drawn) =>
        drawn.className.split(" ")[0] === "strip"
    );
    const takenStrip = strips.find((strip) =>
        strip.attributes.get("data-screen") === "damageTaken"
    );
    assertExists(takenStrip, "there is a screen to reach for");
    pressElement(host, "pointerdown", takenStrip);
    assertEquals(
        pressed,
        [{ kind: PANEL_INTENT.metric, metric: "damageTaken" }],
        "the strip's screen",
    );

    const title = getElementsWithin(host).find((drawn) => drawn.className.endsWith("titlebar"));
    assertExists(title, "there is something that is not a strip to press");
    pressElement(host, "pointerdown", title);
    assertStrictEquals(pressed.length, 1, "the bar asks for nothing, so pressing it moves nothing");
});

/** A side is not a screen, and the one listener has to hand the two over as different presses. */
Deno.test("a press on a side asks for that side, and on the shelf for the shelf", () => {
    const document = composeFakeDocument();
    const pressed: PanelIntent[] = [];
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    panel.render({ ...composeShownScreen(readFight()), readerSide: 1 });
    const host = panel.element as FakeElement;
    const opposing = getElementsWithin(host).find(
        (drawn) => drawn.attributes.get("data-side") === "opposing",
    );
    assertExists(opposing, "the side strip offers the other side");
    pressElement(host, "pointerdown", opposing);
    assertEquals(
        pressed.at(-1),
        { kind: PANEL_INTENT.side, side: "opposing" },
        "and asks for it by name",
    );

    const shelf = getElementsWithin(host).find((drawn) => drawn.attributes.has("data-shelf"));
    assertExists(shelf, "the bar carries the shelf control");
    pressElement(host, "pointerdown", shelf);
    assertEquals(
        pressed.at(-1),
        { kind: PANEL_INTENT.shelf },
        "which asks for the shelf and nothing else",
    );
});

Deno.test("the listener outlives a redraw, because the host does", () => {
    const document = composeFakeDocument();
    const pressed: PanelIntent[] = [];
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    panel.render(composeShownScreen(readFight()));
    const host = panel.element as FakeElement;
    const before = getElementsWithin(host).filter((drawn) => drawn.className === "strips").length;

    panel.render(composeShownScreen(readFight(), "healthRestored"));
    const strips = getElementsWithin(host).filter((drawn) =>
        drawn.className.split(" ")[0] === "strip"
    );
    assertStrictEquals(
        getElementsWithin(host).filter((drawn) => drawn.className === "strips").length,
        before,
        "the strips are drawn again, not drawn twice",
    );
    assertStrictEquals(
        strips.length,
        presentNounStrips("healthRestored").length +
            presentDirectionStrips("healthRestored").length,
        "and each carries what the new screen puts on it",
    );
    const selectedStrips = strips.filter((strip) => strip.className.includes("selected"));
    // The marked noun carries the screen it would cross to, which for the noun already being
    // read is the screen itself: crossing back keeps the direction rather than turning it round.
    assertEquals(
        selectedStrips.map((strip) => strip.attributes.get("data-screen")),
        ["healthRestored", "healthRestored"],
        "both strips are on the new screen",
    );

    const strip = strips[0];
    assertExists(strip, "and the rows still have strips");
    pressElement(host, "pointerdown", strip);
    // The damage noun, which from healing received crosses to damage received: a press reaches
    // the listener the host has carried since before either redraw.
    assertEquals(
        pressed.at(-1),
        { kind: PANEL_INTENT.metric, metric: "damageTaken" },
        "after a redraw",
    );
});

Deno.test("a region that cannot be drawn is replaced by itself, and the rest stands", () => {
    const document = composeFakeDocument();
    const failures: unknown[] = [];
    const reading = readFight();
    const broken: ScreenContent = {
        ...reading,
        get rows(): never {
            throw new RangeError("a region of ours failed");
        },
    };
    const panel = initTestView(document, { onFailure: (failure) => failures.push(failure) });
    failures.push(...panel.render(composeShownScreen(broken)).undrawn);
    const host = panel.element as FakeElement;
    assertStrictEquals(failures.length, 1, "the failure is reported once");
    assertEquals(
        getTextsByClass(host, "undrawn"),
        [formatUndrawn("list")],
        "and the region that failed says so in its own place, naming itself",
    );
    assertStrictEquals(host.shadow?.length, 5, "while both windows keep their shape");
    const bar = getElementsWithin(host).find((drawn) => drawn.className === "MargoMeter-titlebar");
    assert(
        bar?.textContent.endsWith(PANEL_WORDS.title),
        "the bar stands, saying whose panel it is",
    );
});

Deno.test("an opened row stands over the screen, and states whose it is", () => {
    const { reading, drill, opened } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading), opened: drill });
    const host = panel.element as FakeElement;
    const within = getElementsWithin(host);
    const crumbs = getTextsByClass(host, "crumb-here");
    assertEquals(crumbs, [opened.name], "the way back names whose row stands open");
    const rows = within.filter((drawn) => drawn.className.split(" ")[0] === "row");
    assertStrictEquals(
        rows.length,
        countDrillRows(drill),
        "a row for each part of it, in each cut",
    );
    // A person opens where the pair says something; a kind and a skill open nothing at all.
    const opening = rows.filter((drawn) => drawn.attributes.get("data-row") !== undefined);
    assertStrictEquals(
        opening.length,
        drill.byOtherEnd.rows.filter((otherEnd) => otherEnd.doesOpenPair).length,
        "and the ones that open are the people the level under them would say something about",
    );
    const sections = getElementsWithin(host).filter((drawn) =>
        drawn.className === "section-heading"
    );
    assertEquals(
        sections.map((section) => section.children[0]?.textContent),
        [PANEL_WORDS.dealtTo, PANEL_WORDS.skills, PANEL_WORDS.damageKind],
        "one heading per cut: whom it reached, what it was done with, what it was made of",
    );
    for (const section of sections) {
        assertStrictEquals(
            section.children[1]?.textContent,
            formatFigure(drill.total),
            "each standing over the figure it cuts, so a share is read against what it is of",
        );
    }
    const named = getTextsByClass(host, "row-name");
    // The kinds this fight's top dealer carries, and none of them the physical one.
    assertArrayIncludes(named, ["ogień"], "and a kind is drawn in the reader's words");
    assert(!named.includes("dmgf"), "never under the token the protocol stated it on");
    // ⚠️ **Every row of this level opens, and the closing one was the last to.** It was the single
    // leaf here until `develop ADR 0081` gave it the cut of whoever stood at the other end; this
    // fight's other cuts all hold something a level under them would say. A leaf surviving on this
    // level is a row that lost its level rather than one that never had one.
    const leaves = rows.filter((drawn) => drawn.className.split(" ").includes(CLASS.rowLeaf));
    assertStrictEquals(leaves.length, 0, "nothing on this level of this fight stays shut");
    const closing = rows.find((drawn) => drawn.attributes.get("data-plain") !== undefined);
    assertExists(closing, "and the row that closes the cut is one of the rows that open");
    const crumb = within.filter((drawn) => drawn.className === "crumb");
    assertStrictEquals(crumb.length, 1, "and one way back");
});

/** How many rows an opened figure draws, over all three of its cuts. */
function countDrillRows(drill: {
    byOtherEnd: { rows: unknown[]; halfNamed: unknown };
    bySkill: { rows: unknown[]; closing: unknown };
    byElement: { rows: unknown[]; noKind: unknown };
}): number {
    const held = (rows: unknown[], extra: unknown) => rows.length + (extra === null ? 0 : 1);
    return held(drill.byOtherEnd.rows, drill.byOtherEnd.halfNamed) +
        held(drill.bySkill.rows, drill.bySkill.closing) +
        held(drill.byElement.rows, drill.byElement.noKind);
}

Deno.test("a ranking row says which side it stands on, on the edge opposite the cap", () => {
    const reading = readFight();
    const sides = new Set(reading.rows.map((row) => row.side));
    assert(sides.size > 1, "this fight has two sides to tell apart");
    const readerSide = reading.rows[0]?.side ?? null;
    assertExists(readerSide, "and a side to read it from");
    const host = draw(reading, [], { readerSide, turnHolderId: null });
    const rows = getElementsWithin(host).filter((drawn) =>
        drawn.className === "row drillable" && drawn.attributes.get("data-row") !== undefined
    );
    assertStrictEquals(rows.length, reading.rows.length, "a row for each combatant");
    for (const [rowIndex, drawn] of rows.entries()) {
        const row = reading.rows[rowIndex];
        assertExists(row, "a row drawn is a row the reading holds");
        const rule = drawn.children.find((cell) => cell.className === "row-side");
        assertExists(rule, "every row the roster places wears one");
        const ink = formatColour(row.side === readerSide ? SIGNAL.ours : SIGNAL.theirs);
        assertStrictEquals(
            rule.attributes.get("style"),
            `color:${ink}`,
            "in the ink for that side",
        );
        // The mark goes on every part of a row and not the row alone: a listener reads what was
        // pressed off the node under the hand, so a rule that swallowed a press would be a row
        // that stopped opening at its right edge.
        assertStrictEquals(
            rule.attributes.get("data-row"),
            `${row.combatantId}`,
            "and carries the row's own press mark",
        );
        assertExists(rule.attributes.get("data-card"), "and the row's card with it");
    }
    // ⚠️ **W5: zero is a boundary.** A fight the client named no side of the reader's own on gets
    // no rule at all — not a grey one. A panel that cannot place somebody says nothing.
    const seatless = getElementsWithin(draw(reading)).filter((drawn) =>
        drawn.className === "row-side"
    );
    assertEquals(seatless, [], "and a fight with no seat to read from draws none of them");
});

Deno.test("the ranking marks whose turn it is, and marks nobody else", () => {
    const reading = readFight();
    const held = reading.rows[1]?.combatantId;
    assertExists(held, "somebody past the top row, so the mark is not the first row by accident");
    const host = draw(reading, [], { readerSide: null, turnHolderId: held });
    const marks = getElementsWithin(host).filter((drawn) => drawn.className === "row-turn");
    assertEquals(marks.map((mark) => mark.textContent), [TURN_MARK], "one row wears it");
    assertStrictEquals(
        marks[0]?.attributes.get("data-row"),
        `${held}`,
        "and it is the row of the combatant the game is numbering",
    );
    // A fight already over numbers nobody's turn, which the entry answers by handing null: the
    // panel then draws no mark, and every name keeps the width the mark would have taken.
    const none = getElementsWithin(draw(reading)).filter((drawn) => drawn.className === "row-turn");
    assertEquals(none, [], "a fight numbering nobody marks nobody");
});

Deno.test("a ranking row's bar is its profession's, and colourless without one", () => {
    const reading = readFight();
    const host = draw(reading);
    const rows = getElementsWithin(host).filter((drawn) =>
        drawn.className === "row drillable" && drawn.attributes.get("data-row") !== undefined
    );
    assertStrictEquals(rows.length, reading.rows.length, "a row for each combatant");
    for (const [rowIndex, drawn] of rows.entries()) {
        const row = reading.rows[rowIndex];
        assertExists(row, "a row drawn is a row the reading holds");
        const hue = formatColour(lookupColourForProfession(row.profession));
        const bar = drawn.children.find((cell) => cell.className === "bar");
        const drawnBar = bar?.attributes.get("style") ?? "";
        assertStringIncludes(
            drawnBar,
            hue,
            `${row.profession}: the bar wears that profession's hue`,
        );
        // Against the biggest figure on the screen and never against the whole: the top row is a
        // full bar, which is the length every row below it is read against.
        assertStringIncludes(drawnBar, `${(row.fill * 100).toFixed(1)}%`, "and is that long");
        const cap = drawn.children.find((cell) => cell.className === "bar-cap");
        assert((cap?.attributes.get("style") ?? "").includes(hue), "and the cap is the full hue");
    }
    const nobody = formatColour(lookupColourForProfession(null));
    const colourless = rows.filter((drawn) =>
        (drawn.children.find((cell) => cell.className === "bar")?.attributes.get("style") ?? "")
            .includes(nobody)
    );
    // Every combatant in `captures/` states a profession, measured 2026-08-29, so the
    // colourless bar is reachable only through a roster that says nothing — which is what the next
    // line does.
    assertEquals(colourless, [], "this fight names a profession for everybody in it");
    const unstated = draw({
        ...reading,
        rows: reading.rows.map((row) => ({ ...row, profession: null })),
    });
    const bars = getElementsWithin(unstated).filter((drawn) => drawn.className === "bar");
    assert(bars.length > 0, "there are rows to draw");
    for (const bar of bars) {
        assert((bar.attributes.get("style") ?? "").includes(nobody), "each takes the colourless");
    }
});

/**
 * The bar's width goes through a writer that asserts a number, and a row is drawn inside the
 * list's guard: a fill that is none would take every row with it. It draws an empty bar instead,
 * and the rows around it are drawn as they were.
 */
Deno.test("a row whose fill is no number draws an empty bar, and the list stands", () => {
    const reading = readFight();
    for (const fill of [Number.NaN, Number.POSITIVE_INFINITY]) {
        const host = draw({
            ...reading,
            rows: reading.rows.map((row, rowIndex) => rowIndex === 0 ? { ...row, fill } : row),
        });
        assertEquals(getTextsByClass(host, "undrawn"), [], `${fill}: no region is undrawn`);
        const rows = getElementsWithin(host).filter((drawn) =>
            drawn.className === "row drillable" && drawn.attributes.get("data-row") !== undefined
        );
        const bars = rows.map((row) => row.children.find((cell) => cell.className === "bar"));
        assertStrictEquals(rows.length, reading.rows.length, `${fill}: every row is drawn`);
        assertStrictEquals(bars.includes(undefined), false, `${fill}: each with its bar`);
        assertStringIncludes(
            bars[0]?.attributes.get("style") ?? "",
            "width:0.0%",
            `${fill}: and that one empty`,
        );
    }
});

Deno.test("a kind's row carries a bar of its own, measured against its own cut", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading), opened: drill });
    const host = panel.element as FakeElement;
    const bars = getElementsWithin(host).filter((drawn) => drawn.className === "bar");
    assertStrictEquals(
        bars.length,
        countDrillRows(drill),
        "a bar on every row of every cut, and no more",
    );
    const largest = drill.byElement.rows[0];
    assertExists(largest, "the largest kind is the first drawn");
    assertStrictEquals(largest.fill, 1, "and fills its row, being the biggest of its own cut");
    const before = drill.byOtherEnd.rows.length + unnamedBefore(drill) +
        drill.bySkill.rows.length + (drill.bySkill.closing === null ? 0 : 1);
    const drawn = bars[before];
    assertExists(drawn, "there is a kind to draw a bar for");
    const style = drawn.attributes.get("style") ?? "";
    // Colourless, like every row that names no combatant: the hue on this panel says who.
    assertStringIncludes(
        style,
        formatColour(lookupColourForProfession(null)),
        "in the colour of no category at all",
    );
    assertStringIncludes(style, "width:100.0%", "and the length its share of the cut states");
});

/** How many rows the cut by whom drew before the kinds start, its unnamed part included. */
function unnamedBefore(drill: { byOtherEnd: { halfNamed: unknown } }): number {
    return drill.byOtherEnd.halfNamed === null ? 0 : 1;
}

Deno.test("a part of a figure no kind was stated for is drawn last, under the kinds", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading),
        // Health that went down outside a blow, which the protocol states carrying no kind.
        opened: {
            ...drill,
            byElement: {
                ...drill.byElement,
                noKind: { figure: 140, fill: 0.1, shareText: "<1%" },
            },
        },
    });
    const host = panel.element as FakeElement;
    const named = getTextsByClass(host, "row-name");
    assertStrictEquals(
        named[named.length - 1],
        PANEL_WORDS.withoutKind,
        "drawn last, under the kinds",
    );
    const figures = getTextsByClass(host, `${CLASS.rowValue} ${CLASS.figure}`);
    assertStrictEquals(figures[figures.length - 1], "140", "at what fell outside every kind");
    assertEquals(
        readCardByKey(host, "kind:nobody").notes,
        [getNoteForNoKind("damage")],
        "its card says the game named no kind, and nothing about an end it did name",
    );
    assertStringIncludes(
        getNoteForNoKind("damage"),
        getWordsForNoun("damage").toLowerCase(),
        "in the words of damage",
    );
});

/** The other noun's sentence, on a figure built for it: a key restoring health is not a kind. */
Deno.test("a part of healing no key was stated for says so in the healing's words", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading, "healthRestored"),
        opened: {
            ...drill,
            byElement: {
                rows: [],
                rest: null,
                noKind: { figure: 140, fill: 0.1, shareText: "<1%" },
            },
        },
    });
    assertEquals(
        readCardByKey(panel.element as FakeElement, "kind:nobody").notes,
        [getNoteForNoKind("healing")],
        "the healing sentence, never the damage one",
    );
    assertStringIncludes(
        getNoteForNoKind("healing"),
        getWordsForNoun("healing").toLowerCase(),
        "in the words of healing",
    );
});

Deno.test("pressing a row asks to open it, and the way back asks to close it", () => {
    const { reading, drill } = openFirstRow();
    const pressed: PanelIntent[] = [];
    const document = composeFakeDocument();
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    panel.render(composeShownScreen(reading));
    const host = panel.element as FakeElement;
    // The press lands on the deepest element under the pointer, which is the name inside the row.
    const name = getElementsWithin(host).find((drawn) => drawn.className === "row-name");
    assertExists(name, "there is a row to press");
    pressElement(host, "pointerdown", name);
    const combatantId = reading.rows[0]?.combatantId;
    assertExists(combatantId, "the row pressed is somebody's");
    assertEquals(pressed, [{ kind: PANEL_INTENT.openRow, combatantId }], "that row");

    panel.render({ ...composeShownScreen(reading), opened: drill });
    const back = getElementsWithin(host).find((drawn) => drawn.className === "crumb-back");
    assertExists(back, "an opened row has a way back");
    pressElement(host, "pointerdown", back);
    assertEquals(
        pressed.at(-1),
        { kind: PANEL_INTENT.close },
        "which asks for nothing but the way back",
    );

    // One gesture in, one gesture out: the way out works from anywhere on the panel, so the
    // cheapest gesture is not the one that has to be aimed at a control.
    const anywhere = getElementsWithin(host).find((drawn) => drawn.className === "list");
    assertExists(anywhere, "there is somewhere on the panel to press");
    pointAtElement(host, "contextmenu", anywhere, 0);
    assertEquals(
        pressed.at(-1),
        { kind: PANEL_INTENT.close },
        "and a right press anywhere asks for it too",
    );
});

Deno.test("the fight's line says where it is fought, after how it went, and stands without it", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const shown = composeShownScreen({ ...readFight(), outcome: "won" });
    panel.render({ ...shown, fightPlace: { name: "Mapa", tile: "(12, 34)" } });
    const host = panel.element as FakeElement;
    assertEquals(
        getWholeTextsByClass(host, "header-place"),
        ["Mapa (12, 34)"],
        "the place, reading as one text",
    );
    const line = getElementsWithin(host).find((drawn) => drawn.className === "header-line");
    assertEquals(
        Array.from(line?.children ?? []).map((child) => child.className),
        ["", "header-outcome", "header-place"],
        "on the line saying what the fight was, after how it went (ADR 0014)",
    );
    assertEquals(getTextsByClass(host, "header-place-name"), ["Mapa"], "the name that gives way");
    assertEquals(
        getTextsByClass(host, "header-place-tile"),
        [" (12, 34)"],
        "the tile that does not",
    );
    const header = getElementsWithin(host).find((drawn) => drawn.className === "header");
    assertStrictEquals(header?.children.length, 1, "and the header is that one line");

    panel.render({ ...shown, fightPlace: { name: null, tile: "(12, 34)" } });
    assertEquals(
        getWholeTextsByClass(host, "header-place"),
        ["(12, 34)"],
        "a tile alone has no space",
    );
    panel.render({ ...shown, fightPlace: null });
    assertEquals(
        getWholeTextsByClass(host, "header-place"),
        [],
        "and nothing where nothing was said",
    );
    assertStrictEquals(
        getElementsWithin(host).find((drawn) => drawn.className === "header-line")?.children.length,
        2,
        "the line standing on without it",
    );
});

Deno.test("pointing at the fight's line opens the card saying which fight it was", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const shown = composeShownScreen({ ...readFight(), outcome: "won" });
    panel.render({
        ...shown,
        fightPlace: { name: "Mapa", tile: "(12, 34)" },
        card: {
            ...shown.card,
            at: { day: 13, month: 9, hour: 21, minute: 5 },
            place: "Mapa (12, 34)",
            world: "tempest",
            reader: { name: "Gracz 1", profession: "m", level: 64 },
        },
    });
    const host = panel.element as FakeElement;
    const tile = getElementsWithin(host).find((drawn) => drawn.className === "header-place-tile");
    assertExists(tile, "the tile is drawn");
    pointAtElement(host, "pointermove", tile, 20);
    const card = readCard(host);
    assertEquals(card.name, ["Mapa (12, 34)"], "named by the place, whole, as a name may wrap");
    assertEquals(
        card.subtitle,
        [`${formatSideCounts(shown.ranking.sizes, shown.ranking.unplaced)} · wygrana`],
        "under it the line itself",
    );
    assertEquals(
        card.stated.map((line) => [line.label, line.value]),
        [
            [FIGHT_CARD_WORDS.when, "13 wrz 21:05"],
            [FIGHT_CARD_WORDS.world, "tempest"],
            [FIGHT_CARD_WORDS.character, "Gracz 1"],
            [FIGHT_CARD_WORDS.profession, `${getWordsForProfession("m")} (64)`],
        ],
        "when, the world and the reader's character, from the innermost part pointed at",
    );
});

Deno.test("a fight's card with no place is named by its line, and states only what was read", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const shown = composeShownScreen({ ...readFight(), outcome: null });
    panel.render({ ...shown, card: { ...shown.card, isLive: true } });
    const host = panel.element as FakeElement;
    const line = getElementsWithin(host).find((drawn) => drawn.className === "header-line");
    assertExists(line, "the line is drawn");
    pointAtElement(host, "pointermove", line, 20);
    const card = readCard(host);
    const counted = formatSideCounts(shown.ranking.sizes, shown.ranking.unplaced);
    assertEquals(card.name, [`${counted} · trwa`], "a fight going on, said as the shelf says it");
    assertEquals(card.subtitle, [], "with nothing under it to repeat");
    assertStrictEquals(card.groups, 0, "and no line for anything nobody read");
});

Deno.test("a folded panel is its bar and nothing else, and offers the way back", () => {
    const document = composeFakeDocument();
    const pressed: PanelIntent[] = [];
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    const host = panel.element as FakeElement;
    const shown = composeShownScreen(readFight());

    panel.render(shown);
    // A block body, not an expression: the recursion guard reads a one-line named arrow as
    // opening no brace, and so reads every line after it as this function's body — gap 13.
    const controls = () => {
        const bar = getElementsWithin(host).find((drawn) => drawn.className === CLASS.title);
        return getElementsWithin(bar ?? host).filter((drawn) =>
            drawn.className.startsWith(CLASS.control)
        );
    };
    assertEquals(
        controls().map((control) =>
            [...control.attributes.keys()].find((key) => key.startsWith("data-"))
        ),
        ["data-options", "data-shelf", "data-save", "data-fold"],
        "the bar carries the four controls, the options first so the rest keep their places",
    );
    assertStrictEquals(
        controls().filter((control) => control.className.includes(CLASS.controlLead)).length,
        1,
        "and one of them leads the rest to the far end of the bar",
    );
    assert(controls()[0]?.className.includes(CLASS.controlLead), "which is the first");
    const control = controls().find((drawn) => drawn.attributes.has("data-fold"));
    assertExists(control, "an unfolded panel carries the control that folds it");
    assertStrictEquals(control.textContent, "\u2014", "which says what a press would do");
    assertStrictEquals(
        control.attributes.get("title"),
        PANEL_WORDS.collapse,
        "in the reader's words",
    );
    assert(
        getElementsWithin(host).some((drawn) => drawn.className.startsWith("row ")),
        "a ranking",
    );
    pressElement(host, "pointerdown", control);
    assertEquals(
        pressed.at(-1),
        { kind: PANEL_INTENT.fold, window: PANEL_WINDOW.meter },
        "and a press on it asks for the fold",
    );

    panel.render({ ...shown, isMeterCollapsed: true });
    const folded = getElementsWithin(host).filter((drawn) =>
        drawn.className.endsWith(CLASS.folded)
    );
    assertStrictEquals(folded.length, 1, "everything under the bar is folded away in one region");
    assertStrictEquals(
        getElementsWithin(host).filter((drawn) => drawn.className.startsWith("row ")).length,
        0,
        "and no row is composed for a screen nobody is looking at",
    );
    const back = controls().find((control) => control.attributes.has("data-fold"));
    assertExists(back, "the bar is still a bar, and still carries its controls");
    assertStrictEquals(
        back.textContent,
        "+",
        "which now offers the way back rather than the way in",
    );
    assertStrictEquals(
        back.attributes.get("title"),
        PANEL_WORDS.expand,
        "and says so in the same words",
    );
    const bar = getElementsWithin(host).find((drawn) => drawn.className === CLASS.title);
    assert(bar?.textContent.endsWith(PANEL_WORDS.title), "the name standing on");
});

Deno.test("the panel says which build drew it, in the bar and on the host", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const host = panel.element as FakeElement;
    assertStrictEquals(
        host.attributes.get("data-margometer-version"),
        TEST_VERSION,
        "the host states it where anything outside the root can read it",
    );
    panel.render({
        ...composeShownScreen(readFight()),
        fightPlace: { name: "Mapa", tile: "(12, 34)" },
    });
    assertEquals(
        getTextsByClass(host, "titlebar-version"),
        [TEST_VERSION],
        "and the bar says it once, beside the name",
    );
    assertEquals(
        getWholeTextsByClass(host, "header-place"),
        ["Mapa (12, 34)"],
        "with the place still drawn, on the header where it belongs",
    );
});

Deno.test("a region hanging off the root states its own type and its own ink", () => {
    // The detail window stated neither, and was drawn in the browser's serif at `medium` in black
    // on `raised` — figures nobody could read. Seen in Chrome 152 on 2026-08-29.
    const host = draw(readFight());
    const regions = (host.shadow ?? [])
        .filter((region) => region.className.length > 0)
        .map((region) => region.className.split(" ")[0] ?? "");
    assertArrayIncludes(
        regions,
        [CLASS.card],
        "the detail window hangs there with the rest of them",
    );
    assertEquals(
        getUndressedRegions(composeStyleSheet(TYPE_STEP_DEFAULT), regions),
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

/**
 * Which regions are undressed for the ground they paint.
 *
 * `:host{all:initial}` reaches every child of the root and nothing else does, so a region hanging
 * there is drawn in the browser's own serif at `medium`, in `canvastext`, unless it says
 * otherwise. A box painting no ground of its own puts no text on one either, so it is exempt.
 */
function getUndressedRegions(sheet: string, classNames: readonly string[]): string[] {
    const undressed: string[] = [];
    for (const className of classNames) {
        const body = getRuleBody(sheet, `.${className}`);
        if (getDeclaration(body, "background") === null) continue;
        const font = getDeclaration(body, "font");
        if (font === null) {
            undressed.push(className);
            continue;
        }
        if (!isLineWhole(font)) {
            undressed.push(className);
            continue;
        }
        if (getDeclaration(body, "color") === null) undressed.push(className);
    }
    return undressed;
}

/** Whether a `font` shorthand states the whole-pixel line the rest of the panel is drawn on. */
function isLineWhole(font: string): boolean {
    const slash = font.indexOf("/");
    if (slash === -1) return false;
    const ends = font.indexOf(" ", slash);
    if (ends === -1) return false;
    return font.slice(slash + 1, ends).endsWith("px");
}

Deno.test("every row a reader can point at says which detail is its own", () => {
    const host = draw(readFight());
    // Read by the class it carries rather than by its whole list: the pinned row opens like the
    // rest and states a detail like the rest, and matching `row drillable` whole dropped it off
    // this walk the moment a row standing apart from the ranking started saying so.
    const rows = getElementsWithin(host).filter((drawn) =>
        drawn.className.split(" ").includes(CLASS.rowDrillable)
    );
    assert(rows.length > 0, "a fight draws rows");
    for (const row of rows) {
        const key = row.attributes.get("data-card");
        assertExists(key, "a row carries the name its detail is filed under");
        // A pointer lands on the deepest element under it, so every part wears the row's mark.
        for (const cell of row.children) {
            assertStrictEquals(
                cell.attributes.get("data-card"),
                key,
                "and so does every part of it",
            );
        }
    }
});

Deno.test("pointing at a ranking row opens everything that row had to leave out", () => {
    const reading = readFight();
    const host = draw(reading);
    assertEquals(readCard(host).lines, [], "a panel nobody has pointed at says nothing");
    const topRow = reading.rows[0];
    assertExists(topRow, "there is a row to point at");
    const name = getElementsWithin(host).find((drawn) => drawn.className === "row-name");
    assertExists(name, "whose name is the deepest thing under the pointer");
    pointAtElement(host, "pointermove", name, 412);

    const shown = readCard(host);
    assertStrictEquals(shown.className, CLASS.card, "which opens the detail");
    assertEquals(
        shown.name,
        [topRow.name ?? PANEL_WORDS.unknown],
        "the name in full, which the row itself may have cut",
    );
    assertEquals(
        shown.subtitle,
        [formatCardSubtitle(topRow.profession, topRow.detail.level, SIDE_RELATION.nobody)],
        "and what they are beside how far along, off the roster the fight was fought by",
    );
    const figures = shown.stated.filter((line) => !line.isSub);
    assertEquals(
        figures.slice(0, SCREEN_ORDER.length).map((line) => line.label),
        SCREEN_ORDER.map((metric) => getWordsForCardMetric(metric)),
        "and all four figures, in the order the strip over the list puts them",
    );
    assertEquals(
        figures.slice(0, SCREEN_ORDER.length).map((line) => line.value),
        SCREEN_ORDER.map((metric) => formatFigure(topRow.detail[metric])),
        "each stating what the statistics hold for this combatant, not what this screen shows",
    );
    assertEquals(
        shown.stated.filter((line) => line.isStrong).map((line) => line.label),
        [getWordsForCardMetric("damageDealt")],
        "with the one on screen in bold, and no other",
    );
    assert(
        shown.stated.some((line) => line.isSub),
        "and the part of a figure the protocol could say less than the whole of stands under it",
    );

    pointAtElement(host, "pointerout", name, 412, null);
    assertStrictEquals(
        readCard(host).className,
        `${CLASS.card} ${CLASS.cardHidden}`,
        "and leaving closes",
    );
});

Deno.test("crossing from one part of a row to another is not leaving it", () => {
    const host = draw(readFight());
    const parts = getElementsWithin(host).filter((drawn) => drawn.attributes.has("data-card"));
    const [name, figureCell] = [
        parts.find((drawn) => drawn.className === "row-name"),
        parts.find((drawn) => drawn.className === `${CLASS.rowValue} ${CLASS.figure}`),
    ];
    assertExists(name, "a row draws a name");
    assertExists(figureCell, "and a figure beside it, each its own element under the pointer");
    assertStrictEquals(
        name.attributes.get("data-card"),
        figureCell.attributes.get("data-card"),
        "both of them filed under the one row they are parts of",
    );
    pointAtElement(host, "pointermove", name, 412);
    const opened = readCard(host);
    assertStrictEquals(opened.className, CLASS.card, "pointing at one of them opens the card");

    // `pointerout` bubbles, so it fires on every crossing inside the row as well as on leaving it.
    pointAtElement(host, "pointerout", name, 412, figureCell);
    assertStrictEquals(
        readCard(host).className,
        CLASS.card,
        "and a crossing that lands on the same row's mark leaves the card standing",
    );
    assertEquals(readCard(host).lines, opened.lines, "saying what it was already saying");
});

/**
 * The same card at every level a person stands on, and its figures are the fight's: the card is
 * about the person, and the row it stands over is one cut of them. `develop ADR 0032`.
 */
Deno.test("a person inside an opened row opens the card the ranking opens", () => {
    const { reading, drill, opened } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading), opened: drill });
    const host = panel.element as FakeElement;
    const otherEnd = drill.byOtherEnd.rows[0];
    assertExists(otherEnd, "the opened figure reached somebody");
    const listed = reading.rows.find((row) => row.combatantId === otherEnd.combatantId);
    assertExists(listed, "and the ranking holds them too");
    const pointAt = (key: string) => {
        const pointedCell = getElementsWithin(host).find(
            (drawn) => drawn.attributes.get("data-card") === key,
        );
        assertExists(pointedCell, `${key} is a row on the panel`);
        pointAtElement(host, "pointermove", pointedCell, 300);
        return readCard(host);
    };
    const card = pointAt(`to:${otherEnd.combatantId}`);
    assertEquals(card.name, [otherEnd.name ?? PANEL_WORDS.unknown], "the card names them in full");
    assertEquals(
        SCREEN_ORDER.map(getWordsForCardMetric).filter((words) => !card.lines.includes(words)),
        [],
        "and states all four of their figures, the way the ranking's card does",
    );
    const words = getWordsForCardMetric("damageDealt");
    const dealt = card.stated.find((line) => line.label === words);
    assertExists(dealt, "the screen's own figure among them");
    assertStrictEquals(
        dealt.value,
        formatFigure(listed.detail.damageDealt),
        "read off the whole fight, and not off the cut the row under it states",
    );
    assert(
        dealt.value !== formatFigure(otherEnd.figure),
        "which on this recording is a different number, so the two cannot be confused",
    );
    assertArrayIncludes(
        card.notes,
        [CARD_WORDS.scope],
        "and the card says which of the two it means",
    );
    // The one card whose figures are its row's: on the ranking the two are the same number, so
    // the sentence saying otherwise would answer nobody's question.
    const ranking = draw(reading);
    const listedPart = getElementsWithin(ranking).find(
        (drawn) => drawn.attributes.get("data-card") === `row:${opened.combatantId}`,
    );
    assertExists(listedPart, "the row this level was opened from is one of the ranking's");
    pointAtElement(ranking, "pointermove", listedPart, 300);
    assert(!readCard(ranking).notes.includes(CARD_WORDS.scope), "and says no such thing");
});

/**
 * The other rung a person stands on, and the last: whom one skill reached. Nothing there opens
 * (`docs/drill-levels.md`), so the card carries the figures and not the instruction.
 */
Deno.test("a person under an opened skill opens a card promising no gesture", () => {
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    const reading = presentScreen(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const drill = presentOpenedLevel(statistics, roster, "healthGiven", HEALER);
    assertExists(drill, "the healer's row opens");
    const announced = drill.bySkill.rows.find((skillRow) => skillRow.doesOpenPart);
    assertExists(announced, "onto a skill that reached somebody else");
    assertStrictEquals(announced.part.kind, "skill", "and one the game announced by name");
    const skill = presentPartLevel(statistics, roster, "healthGiven", HEALER, announced.part);
    assertExists(skill, "which opens onto the people it reached");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading, "healthGiven"), opened: drill, part: skill });
    const host = panel.element as FakeElement;
    const reached = skill.byOtherEnd.rows[0];
    assertExists(reached, "somebody it reached");
    const reachedCell = getElementsWithin(host).find(
        (drawn) => drawn.attributes.get("data-card") === `reached:${reached.combatantId}`,
    );
    assertExists(reachedCell, "and they are a row somebody can point at");
    pointAtElement(host, "pointermove", reachedCell, 300);
    const card = readCard(host);
    assertEquals(
        SCREEN_ORDER.map(getWordsForCardMetric).filter((words) => !card.lines.includes(words)),
        [getWordsForCardMetric("damageDealt")],
        "the card states every figure they have here too, and the one they have not is dropped",
    );
    assertArrayIncludes(
        card.lines,
        [getWordsForCardMetric("healthGiven")],
        "the screen's own among them, which is the figure this row was pointed at for",
    );
    assertArrayIncludes(
        card.notes,
        [CARD_WORDS.scope],
        "and says the figures are the whole fight's",
    );
    assert(!card.notes.includes(CARD_WORDS.gesture), "and promises nothing, because nothing opens");
});

Deno.test("a share inside an opened row is of that row, never of the fight", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading), opened: drill });
    const host = panel.element as FakeElement;
    const kind = drill.byElement.rows[0];
    assertExists(kind, "the opened row is cut by kind");
    const rows = getElementsWithin(host).filter(
        (drawn) => drawn.attributes.get("data-card") === `kind:${kind.element}`,
    );
    const kindCell = rows[0];
    assertExists(kindCell, "and that cut is a row somebody can point at");
    pointAtElement(host, "pointermove", kindCell, 300);
    assertEquals(
        readCard(host).lines,
        [
            getWordsForDamageKind(kind.element),
            getWordsForMetric("damageDealt"),
            PANEL_WORDS.shareOfFigure,
            formatFigure(kind.figure),
            kind.shareText,
        ],
        "a kind is a share of the figure standing open above it",
    );
    assertStrictEquals(
        readCard(host).groups,
        1,
        "and a row with no cut kept for it says it in one run",
    );
});

Deno.test("a shelf row opens the fight's card, with the place its own cell had to cut", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(readFight()),
        shelf: [{
            openedAt: 17,
            at: { day: 13, month: 9, hour: 21, minute: 5 },
            sizes: [10, 1],
            place: "Bagno Wisielców (128, 74)",
            outcome: "lost",
            isLive: false,
            isChosen: false,
            isPinned: false,
            isPinnable: true,
            card: {
                sizes: [10, 1],
                unplaced: 0,
                outcome: "lost",
                isLive: false,
                at: { day: 13, month: 9, hour: 21, minute: 5 },
                place: "Bagno Wisielców (128, 74)",
                world: null,
                reader: null,
            },
        }],
        isOnShelf: true,
    });
    const host = panel.element as FakeElement;
    const row = getElementsWithin(host).find((drawn) =>
        drawn.attributes.get("data-card") === "shelf:17"
    );
    assertExists(row, "the fight is a row a reader can point at");
    assertEquals(
        [getTextsByClass(host, "row-time")[0], getTextsByClass(host, "row-size")[0]],
        ["13 wrz 21:05", "10×1"],
        "when it was, to the day, and how big it was, before the place that can be cut",
    );
    assertStrictEquals(getTextsByClass(host, "row-value")[0], "przegrana", "and how it went, last");
    pointAtElement(host, "pointermove", row, 120);
    const card = readCard(host);
    assertEquals(
        card.name,
        ["Bagno Wisielców (128, 74)"],
        "the place whole, which is the half the row loses to an ellipsis",
    );
    assertEquals(card.subtitle, ["10 vs 1 · przegrana"], "under it the fight, as its line says");
    assertEquals(
        card.stated.map((line) => [line.label, line.value]),
        [[FIGHT_CARD_WORDS.when, "13 wrz 21:05"]],
        "and no line for anything nobody could read",
    );
});

/**
 * The live row is the live fight's, whatever moment it carries: kept, it has one and a pin acts on
 * it; with no moment from the clock it is a row nothing has kept, so there is nothing to pin, and
 * its card and its press stand on the live fight's word, which no kept fight's moment can be.
 */
Deno.test("the live row is pressed and pointed at by its word, with a moment and without", () => {
    const moment = { day: 13, month: 9, hour: 21, minute: 5 };
    const card = {
        sizes: [10, 1],
        unplaced: 0,
        outcome: null,
        isLive: true,
        at: moment,
        place: null,
        world: null,
        reader: null,
    };
    const timedRow = {
        openedAt: 17,
        at: moment,
        sizes: [10, 1],
        place: null,
        outcome: null,
        isLive: true,
        isChosen: true,
        isPinned: false,
        isPinnable: true,
        card,
    };
    const untimedRow = {
        ...timedRow,
        openedAt: null,
        at: null,
        isPinnable: false,
        card: { ...card, at: null },
    };
    for (const [shelfRow, pinnedAt] of [[timedRow, "17"], [untimedRow, undefined]] as const) {
        const said = shelfRow.openedAt === null ? "with no moment" : "with a moment";
        const document = composeFakeDocument();
        const pressed: PanelIntent[] = [];
        const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
        panel.render({ ...composeShownScreen(readFight()), shelf: [shelfRow], isOnShelf: true });
        const host = panel.element as FakeElement;
        const drawn = getElementsWithin(host);
        const row = drawn.find((element) => element.attributes.get("data-card") === "shelf:live");
        assertExists(row, `${said}: the live row is a card under the live fight's word`);
        assertStrictEquals(row.attributes.get("data-fight"), "live", `${said}: and pressed by it`);
        const pins = drawn.filter((element) => element.attributes.has("data-pin"));
        assertEquals(
            pins.map((pin) => pin.attributes.get("data-pin")),
            pinnedAt === undefined ? [] : [pinnedAt],
            `${said}: a pin stands on the moment it was kept by, and on nothing else`,
        );
        pointAtElement(host, "pointermove", row, 120);
        assertEquals(
            readCard(host).stated.map((line) => line.label),
            pinnedAt === undefined ? [] : [FIGHT_CARD_WORDS.when],
            `${said}: its card states a time only where there was one`,
        );
        pressElement(host, "pointerdown", row);
        assertEquals(pressed, [{ kind: PANEL_INTENT.showLive }], `${said}: a press shows it`);
    }
});

Deno.test("a panel that has seen no fight says so, at the height a ranking stands at", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const host = panel.element as FakeElement;
    panel.renderWaiting(NOTHING_WAITING);
    const list = getElementsWithin(host).find((drawn) => drawn.className.startsWith("list"));
    assertExists(list, "the list is drawn");
    assertStrictEquals(
        list.className,
        "list list-waiting",
        "as the one list its sentence is centred in",
    );
    assertEquals(
        getTextsByClass(host, "empty"),
        [PANEL_WORDS.noFightYet],
        "saying what is missing",
    );
    assertStrictEquals(
        list.attributes.get("style"),
        `--MargoMeter-rows:${RANKING_ROWS}`,
        "at the ranking's height",
    );
    // Nothing else: there is no screen to pick, no row to open and nothing to total, so a strip
    // would be a control over a fight that is not on.
    assertEquals(
        getElementsWithin(host).filter((drawn) => drawn.className === "strips"),
        [],
        "no strips",
    );
    assertEquals(getTextsByClass(host, "MargoMeter-summary"), [], "and no strip under it");
    const bar = getElementsWithin(host).find((drawn) => drawn.className === CLASS.title);
    assert(bar?.textContent.endsWith(PANEL_WORDS.title), "while the bar stands as it always does");

    panel.renderWaiting({ ...NOTHING_WAITING, isMeterCollapsed: true });
    const folded = getElementsWithin(host).filter((drawn) =>
        drawn.className.endsWith(CLASS.folded)
    );
    assertStrictEquals(folded.length, 1, "a reader who folded the meter away keeps it folded");
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
    const line = getElementsWithin(won).find((drawn) => drawn.className === "header-line");
    assertStrictEquals(
        line?.children.length,
        2,
        "beside what the fight is, at the other end of it",
    );
    const fled = draw({ ...reading, outcome: "fled" });
    assertEquals(
        getTextsByClass(fled, "header-outcome"),
        [getWordsForOutcome("fled")],
        "and a fight an escape broke off says so in the same place",
    );
    const unsaid = draw({ ...reading, outcome: null });
    assertEquals(getTextsByClass(unsaid, "header-outcome"), [], "and nothing at all where none");
    assertStrictEquals(
        getElementsWithin(unsaid).find((drawn) => drawn.className === "header-line")?.children
            .length,
        1,
        "no gap reserved for a word that was never said",
    );
});

Deno.test("the bar is what moves the panel, and where it was let go is reported once", () => {
    const document = composeFakeDocument();
    const moved: Array<{ left: number; top: number }> = [];
    const panel = initTestView(document, {
        typeStep: TYPE_STEP.small,
        onIntent: (intent) => {
            if (intent.kind === PANEL_INTENT.move) moved.push(intent.position);
        },
        meterPlacement: {
            position: null,
            size: null,
            readViewport: () => ({ width: 1280, height: 900 }),
        },
    });
    const host = panel.element as FakeElement;
    panel.render({ ...composeShownScreen(readFight()), typeStep: TYPE_STEP.small });
    const bar = getElementsWithin(host).find((drawn) => drawn.className === CLASS.title);
    assertExists(bar, "the bar is drawn");
    assertStrictEquals(
        bar.attributes.get("data-grip"),
        "meter",
        "and it says which window it drags",
    );

    // Nobody has moved this one, so it stands in the middle of the window from the first frame,
    // which is also the place the first grab starts from.
    assertStrictEquals(
        host.attributes.get("style"),
        "left:510px;top:153px;--MargoMeter-meter-top:153px;right:auto",
        "a panel nobody has moved is put in the middle of the window it was drawn into",
    );

    dragOnElement(host, "pointerdown", bar, { clientX: 1100, clientY: 20 });
    dragOnElement(host, "pointermove", bar, { clientX: 1000, clientY: 120 });
    assertStrictEquals(
        host.attributes.get("style"),
        "left:410px;top:253px;--MargoMeter-meter-top:253px;right:auto",
        "the panel follows the hand, by the distance the hand moved",
    );
    assertEquals(moved, [], "and nothing is stored while it is still being dragged");

    dragOnElement(host, "pointerup", bar, { clientX: 1000, clientY: 120 });
    assertEquals(moved, [{ left: 410, top: 253 }], "where it was let go is reported, once");

    dragOnElement(host, "pointermove", bar, { clientX: 500, clientY: 500 });
    assertStrictEquals(
        host.attributes.get("style"),
        "left:410px;top:253px;--MargoMeter-meter-top:253px;right:auto",
        "and a pointer moving with nothing held moves nothing",
    );
});

Deno.test("a size of type moves the window beside the panel off it, and says where", () => {
    const document = composeFakeDocument();
    const moved: { window: string; left: number }[] = [];
    const viewport = () => ({ width: 1280, height: 900 });
    const panel = initTestView(document, {
        onIntent: (intent) => {
            if (intent.kind === PANEL_INTENT.move) {
                moved.push({ window: intent.window, left: intent.position.left });
            }
        },
        meterPlacement: { position: null, size: null, readViewport: viewport },
        helperPlacement: { position: null, size: null, readViewport: viewport },
    });
    const host = panel.element as FakeElement;
    const standing = () =>
        getElementsWithin(host).find((drawn) => drawn.className.startsWith(CLASS.helper));
    const standard = TYPE_TOKENS[TYPE_STEP_DEFAULT];
    const large = TYPE_TOKENS[TYPE_STEP.large];
    // Nobody moved either window: the panel is centred and the other opens against its left.
    const panelLeft = (1280 - standard.meterWidthPixels) / 2;
    const opened = panelLeft - standard.helperWidthPixels - SPACE_PIXELS.small;
    assertStringIncludes(standing()?.attributes.get("style") ?? "", `left:${opened}px`, "beside");
    panel.render({ ...composeShownScreen(readFight()), typeStep: TYPE_STEP.large });
    const shifted = opened - (large.helperWidthPixels - standard.helperWidthPixels);
    assertStringIncludes(
        standing()?.attributes.get("style") ?? "",
        `left:${shifted}px`,
        "the window grown by the larger type keeps its right edge off the panel",
    );
    assertEquals(moved, [{ window: PANEL_WINDOW.helper, left: shifted }], "and the move is told");
    panel.render({ ...composeShownScreen(readFight()), typeStep: TYPE_STEP.large });
    assertStrictEquals(moved.length, 1, "the same size drawn again moves nothing");
});

Deno.test("a window is sized by its corner, told once, and held through a frame", () => {
    const document = composeFakeDocument();
    const sized: PanelIntent[] = [];
    const panel = initTestView(document, {
        typeStep: TYPE_STEP.small,
        onIntent: (intent) => {
            if (intent.kind === PANEL_INTENT.resize) sized.push(intent);
        },
        meterPlacement: {
            position: { left: 40, top: 40 },
            size: null,
            readViewport: () => ({ width: 1280, height: 900 }),
        },
    });
    const host = panel.element as FakeElement;
    const shown = { ...composeShownScreen(readFight()), typeStep: TYPE_STEP.small };
    panel.render(shown);
    const grip = getElementsWithin(host).find((drawn) =>
        drawn.attributes.get("data-size-grip") === "meter"
    );
    assertExists(grip, "the panel carries its corner");
    // The corner stands where the press lands when the event says nothing more: a panel 260 wide
    // at 40, and a body of 300 under a bar of 24 at 40.
    dragOnElement(host, "pointerdown", grip, { clientX: 300, clientY: 364 });
    dragOnElement(host, "pointermove", grip, { clientX: 360, clientY: 414 });
    const style = () => host.attributes.get("style") ?? "";
    assertStringIncludes(style(), "--MargoMeter-meter-width:320px", "the corner widens it");
    assertStringIncludes(style(), "--MargoMeter-meter-height:350px", "and lengthens its body");
    assertEquals(sized, [], "and nothing is told while the hand is on it");
    panel.render(shown);
    assertStringIncludes(
        style(),
        "--MargoMeter-meter-width:320px",
        "a frame does not undo the hand",
    );
    dragOnElement(host, "pointerup", grip, { clientX: 360, clientY: 414 });
    assertEquals(
        sized,
        [{
            kind: PANEL_INTENT.resize,
            window: PANEL_WINDOW.meter,
            size: { width: 320, height: 350 },
        }],
        "let go, the size is told once",
    );
    panel.render({ ...shown, windowSizes: { meter: { width: 320, height: 350 }, helper: null } });
    assertStringIncludes(
        style(),
        "--MargoMeter-meter-width:320px",
        "and a frame carrying it keeps it",
    );
    panel.render(shown);
    assertStrictEquals(
        style().includes("--MargoMeter-meter-width"),
        false,
        "one without it gives it back",
    );
    dragOnElement(host, "pointerdown", grip, { clientX: 300, clientY: 364 });
    dragOnElement(host, "pointermove", grip, { clientX: 100, clientY: 100 });
    assertStringIncludes(style(), "--MargoMeter-meter-width:260px", "never narrower than its bar");
    dragOnElement(host, "pointerup", grip, { clientX: 100, clientY: 100 });
});

Deno.test("the options give back only a window a reader sized, and name which", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const options = { storage: STORAGE_CHOICE.local, answers: [] };
    panel.render({
        ...composeShownScreen(readFight()),
        options,
        windowSizes: { meter: null, helper: { width: 300, height: 200 } },
    });
    const host = panel.element as FakeElement;
    const resets = () =>
        getElementsWithin(host).filter((drawn) =>
            drawn.attributes.get("data-reset-size") !== undefined
        );
    assertEquals(
        resets().map((control) => control.attributes.get("data-reset-size")),
        ["helper"],
        "one",
    );
    assertStrictEquals(resets()[0]?.textContent, PANEL_WORDS.sizeReset, "on the helper's own line");
    assertEquals(
        getTextsByClass(host, "options-window-state options-window-own"),
        [PANEL_WORDS.sizeOwn],
        "which says the size is the reader's",
    );
    panel.render({
        ...composeShownScreen(readFight()),
        options,
        windowSizes: { meter: { width: 300, height: 400 }, helper: { width: 300, height: 200 } },
    });
    assertStrictEquals(resets().length, 2, "and both where both were");
});

Deno.test("the version label on the bar is a handle, like the bar around it", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document, {
        meterPlacement: {
            position: { left: 40, top: 40 },
            size: null,
            readViewport: () => ({ width: 1280, height: 900 }),
        },
    });
    const host = panel.element as FakeElement;
    panel.renderWaiting(NOTHING_WAITING);
    const version = getElementsWithin(host).find((drawn) => drawn.className === CLASS.titleVersion);
    assertExists(version, "the bar states the version it was built at");
    assertStrictEquals(
        version.attributes.get("data-grip"),
        "meter",
        "and a drag may start from it",
    );

    dragOnElement(host, "pointerdown", version, { clientX: 100, clientY: 100 });
    dragOnElement(host, "pointermove", version, { clientX: 400, clientY: 300 });
    assertStrictEquals(
        host.attributes.get("style"),
        "left:340px;top:240px;--MargoMeter-meter-top:240px;right:auto",
        "the panel follows a hand that took hold of the label",
    );
});

Deno.test("a press on a control is not a drag, whatever the pointer does next", () => {
    const document = composeFakeDocument();
    const panel = initTestView(document, {
        meterPlacement: {
            position: { left: 40, top: 40 },
            size: null,
            readViewport: () => ({ width: 1280, height: 900 }),
        },
    });
    const host = panel.element as FakeElement;
    panel.renderWaiting(NOTHING_WAITING);
    const fold = getElementsWithin(host).find((drawn) => drawn.attributes.has("data-fold"));
    assertExists(fold, "the bar carries the control that folds the panel");
    dragOnElement(host, "pointerdown", fold, { clientX: 100, clientY: 100 });
    dragOnElement(host, "pointermove", fold, { clientX: 400, clientY: 400 });
    assertStrictEquals(
        host.attributes.get("style"),
        "left:40px;top:40px;--MargoMeter-meter-top:40px;right:auto",
        "the panel stays where the reader left it: a press on a control is that control's",
    );
});

/**
 * The twin of the press that outlives a redraw: a press is one moment and cannot be broken by a
 * payload landing, a drag is three, and what carries it across them is the pointer held by a bar
 * every draw replaces.
 */
Deno.test("a draw landing mid-drag does not take the panel out of the hand", () => {
    const document = composeFakeDocument();
    const moved: Array<{ left: number; top: number }> = [];
    const panel = initTestView(document, {
        onIntent: (intent) => {
            if (intent.kind === PANEL_INTENT.move) moved.push(intent.position);
        },
        meterPlacement: {
            position: { left: 40, top: 40 },
            size: null,
            readViewport: () => ({ width: 1280, height: 900 }),
        },
    });
    const host = panel.element as FakeElement;
    const readBar = () => getElementsWithin(host).find((drawn) => drawn.className === CLASS.title);
    panel.renderWaiting(NOTHING_WAITING);
    const held = readBar();
    assertExists(held, "the bar is drawn");
    dragOnElement(host, "pointerdown", held, { clientX: 100, clientY: 20 });
    assertEquals(held.pointersHeld, [1], "the bar takes hold of the pointer that pressed it");

    panel.renderWaiting(NOTHING_WAITING);
    const drawn = readBar();
    assertExists(drawn, "a payload landing draws the bar again");
    assertStrictEquals(held.replacedBy, drawn, "and the one holding the pointer has left the tree");
    assertEquals(drawn.pointersHeld, [1], "so the hold is taken again, on the bar standing now");

    dragOnElement(host, "pointermove", drawn, { clientX: 300, clientY: 220 });
    assertStrictEquals(
        host.attributes.get("style"),
        "left:240px;top:240px;--MargoMeter-meter-top:240px;right:auto",
        "the panel goes on following the hand across the draw",
    );
    dragOnElement(host, "pointerup", drawn, { clientX: 300, clientY: 220 });
    assertEquals(moved, [{ left: 240, top: 240 }], "where it was let go is reported, once");
    assertEquals(drawn.pointersReleased, [1], "let go of by the bar that was holding it");
    assertEquals(held.pointersReleased, [], "and never by the one that left the tree");
});

/** Healing opens onto who, what with, and — on the receiving side alone — under which key. */
Deno.test("a healing row opens, and says whose the health was and what put it back", () => {
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    const open = (screen: "healthGiven" | "healthRestored") => {
        const reading = presentScreen(
            statistics,
            roster,
            screen,
            "everyone",
            null,
            NOTHING_SUSPECT,
        );
        const topRow = reading.rows[0];
        assertExists(topRow, `${screen}: there is a row to open`);
        const drill = presentOpenedLevel(statistics, roster, screen, topRow.combatantId);
        assertExists(drill, `${screen}: and it opens`);
        const document = composeFakeDocument();
        const panel = initTestView(document);
        panel.render({ ...composeShownScreen(reading, screen), opened: drill });
        const host = panel.element as FakeElement;
        return getElementsWithin(host)
            .filter((heading) => heading.className === "section-heading")
            .map((heading) => heading.children[0]?.textContent);
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
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading, "healthGiven"),
        // The same person, carried onto a screen they did nothing on: one press of a strip away,
        // because the strips carry an opened row from screen to screen.
        opened: { ...drill, total: 0, byOtherEnd: { rows: [], halfNamed: null } },
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
        const panel = initTestView(document);
        panel.render({ ...composeShownScreen(reading), opened: open });
        const host = panel.element as FakeElement;
        const list = getElementsWithin(host).find((drawn) => drawn.className.startsWith("list"));
        return list?.attributes.get("style");
    };
    const ranking = drawOpened(null);
    assertStrictEquals(
        ranking,
        `--MargoMeter-rows:${reading.rowsVisibleCount}`,
        "the ranking is its own floor",
    );

    // Two cuts, each costing its rows, the part named for nobody and the heading over them.
    const heads = (
        rows: unknown[],
        extra: unknown,
    ) => (rows.length === 0 && extra === null ? 0 : 1);
    const needed = countDrillRows(drill) +
        heads(drill.byOtherEnd.rows, drill.byOtherEnd.halfNamed) +
        heads(drill.bySkill.rows, drill.bySkill.closing) +
        heads(drill.byElement.rows, drill.byElement.noKind);
    assert(
        needed > reading.rowsVisibleCount,
        "this fight opens onto more rows than the ranking has",
    );
    assertStrictEquals(
        drawOpened(drill),
        `--MargoMeter-rows:${needed}`,
        "so the list grows to hold them",
    );

    // And a cut that needs less keeps the floor: pressing a row must not shorten the window
    // under the hand that pressed it.
    const small = {
        ...drill,
        byOtherEnd: { rows: [], halfNamed: null },
        bySkill: { rows: [], rest: null, closing: null, hasFiguresDisagreed: false },
        byElement: { rows: drill.byElement.rows.slice(0, 2), rest: null, noKind: null },
    };
    assertStrictEquals(
        drawOpened(small),
        `--MargoMeter-rows:${reading.rowsVisibleCount}`,
        "a shorter breakdown is drawn at the ranking's height rather than below it",
    );
});

/**
 * ⚠️ **The same place, drawn again, which is what a payload landing on an open level is.** The
 * region is kept rather than replaced there (`develop ADR 0052`), so a height carried on the
 * element rather than composed onto the new one froze at whatever the first draw of that place
 * asked for: a level that grew as the fight went on went on being drawn at the ranking's eleven,
 * and the section was cut off in the middle — the one thing counting the rows exists to stop.
 *
 * The test above draws each state on a panel of its own, which is the one path where nothing is
 * kept, and that is why it stayed green through it.
 */
Deno.test("a level that grows while the fight goes on grows the region it is drawn in", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const shown = {
        ...composeShownScreen(reading),
        // One place, whatever the level under it has come to: a payload moves no field of the
        // name, which is exactly `composeListName`'s answer while a row stands open.
        listName: SHOWN_LIST,
    };
    // The level as it stands early in a fight: fewer rows than the ranking promised.
    const early = {
        ...drill,
        byOtherEnd: { rows: drill.byOtherEnd.rows.slice(0, 1), halfNamed: null },
        bySkill: { rows: [], rest: null, closing: null, hasFiguresDisagreed: false },
        byElement: { rows: [], rest: null, noKind: null },
    };
    panel.render({ ...shown, opened: early });
    const host = panel.element as FakeElement;
    const readHeight = () =>
        getElementsWithin(host).find((drawn) => drawn.className.startsWith("list"))
            ?.attributes.get("style");
    assertStrictEquals(
        readHeight(),
        `--MargoMeter-rows:${reading.rowsVisibleCount}`,
        "a level shorter than the ranking is drawn at the ranking's height",
    );

    const heads = (
        rows: unknown[],
        extra: unknown,
    ) => (rows.length === 0 && extra === null ? 0 : 1);
    const needed = countDrillRows(drill) +
        heads(drill.byOtherEnd.rows, drill.byOtherEnd.halfNamed) +
        heads(drill.bySkill.rows, drill.bySkill.closing) +
        heads(drill.byElement.rows, drill.byElement.noKind);
    assert(
        needed > reading.rowsVisibleCount,
        "and the whole of it needs more rows than the ranking",
    );

    panel.render({ ...shown, opened: drill });
    assertStrictEquals(
        readHeight(),
        `--MargoMeter-rows:${needed}`,
        "so the region the reader is standing in grows with the level, rather than cutting it off",
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
        const panel = initTestView(document);
        panel.render({ ...composeShownScreen(reading, "damageTaken"), opened: open });
        const host = panel.element as FakeElement;
        return getElementsWithin(host)
            .filter((heading) => heading.className === "section-heading")
            .map((heading) => heading.children[0]?.textContent);
    };
    const onlyKind = drill.byElement.rows[0];
    assertExists(onlyKind, "the fight cuts this figure by kind");
    // One kind carrying the whole figure is that figure again under another heading.
    const repeated = {
        ...drill,
        total: onlyKind.figure,
        bySkill: { rows: [], rest: null, closing: null, hasFiguresDisagreed: false },
        byElement: { rows: [onlyKind], rest: null, noKind: null },
    };
    assertEquals(
        headings(repeated),
        [PANEL_WORDS.takenFrom, PANEL_WORDS.damageKind],
        "so the cut of one is drawn under its own heading",
    );

    const two = drill.byElement.rows.slice(0, 2);
    assertStrictEquals(two.length, 2, "and the fight cuts it by more than one");
    const split = {
        ...drill,
        total: two.reduce((sum, row) => sum + row.figure, 0),
        bySkill: { rows: [], rest: null, closing: null, hasFiguresDisagreed: false },
        byElement: { rows: two, rest: null, noKind: null },
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
        const panel = initTestView(document);
        panel.render({ ...composeShownScreen(reading), opened: open });
        return getElementsWithin(panel.element as FakeElement)
            .filter((heading) => heading.className === "section-heading")
            .map((heading) => heading.children[0]?.textContent);
    };
    const only = drill.bySkill.rows[0];
    assertExists(only, "the fight cuts this figure by the skills it was dealt with");
    assertStrictEquals(only.part.kind, "skill", "and the row standing first is an announcement");
    const alone = {
        ...drill,
        total: only.figure,
        byOtherEnd: { rows: [], halfNamed: null },
        byElement: { rows: [], rest: null, noKind: null },
        bySkill: { rows: [only], rest: null, closing: null, hasFiguresDisagreed: false },
    };
    assertEquals(headings(alone), [PANEL_WORDS.skills], "so the section is drawn all the same");

    const key = { ...only, part: { kind: "source" as const, source: "heal" } };
    const keyed = {
        ...alone,
        bySkill: { rows: [key], rest: null, closing: null, hasFiguresDisagreed: false },
    };
    assertEquals(headings(keyed), [PANEL_WORDS.skills], "and so is a lone key row");
});

/**
 * ⚠️ **A heading is two cells and a constant, at every level.** Both were class-less spans until
 * 2026-09-01, so nothing held the figure beside a heading to one line and nothing stopped a heading
 * growing a name out of the recording — which is how `111111` came to be read as `111` over `111`.
 * `DESIGN.md` owns the rule; this holds the DOM to it, `tests/ui/panel-look.test.ts` the
 * sheet.
 */
Deno.test("a heading is its words and a figure, and says only what its level is cut by", () => {
    const { reading, drill } = openFirstRow();
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    const healer = 469657;
    const healing = presentScreen(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const opened = presentOpenedLevel(statistics, roster, "healthGiven", healer);
    assertExists(opened, "the healer's row opens");
    const announced = opened.bySkill.rows.find((skillRow) => skillRow.doesOpenPart);
    assertExists(announced, "onto a skill that reached somebody else");
    const skillLevel = presentPartLevel(statistics, roster, "healthGiven", healer, announced.part);
    assertExists(skillLevel, "which opens onto the people it reached");
    const pair = presentPairLevel(statistics, roster, "healthGiven", healer, healer);
    assertExists(pair, "and the person inside it opens onto the pair");

    const levels = [
        { ranking: reading, metric: "damageDealt" as const, opened: drill, pair: null, part: null },
        { ranking: healing, metric: "healthGiven" as const, opened, pair, part: null },
        { ranking: healing, metric: "healthGiven" as const, opened, pair: null, part: skillLevel },
    ];
    let counted = 0;
    for (const level of levels) {
        const document = composeFakeDocument();
        const panel = initTestView(document);
        panel.render({ ...composeShownScreen(reading), ...level });
        const cells = getHeadingCells(panel.element as FakeElement);
        assert(cells.length > 0, "a level that cuts a figure draws a heading over each cut");
        counted += cells.length;
        assertEquals(
            cells.filter(([words]) => !CUT_HEADINGS.includes(words)).map(([words]) => words),
            [],
            "every heading is one of the five, and never a name the recording carries",
        );
        assertEquals(
            cells.filter(([, classes]) =>
                classes.join(" ") !== `${CLASS.sectionWords} ${CLASS.figure}`
            ).map(([words]) => words),
            [],
            "each of them the words that shorten and the figure that does not",
        );
    }
    assert(counted >= levels.length, "and every level drawn was measured, not skipped");
});

/** What each heading is made of: the words it wears, and the classes of its two cells. */
function getHeadingCells(host: FakeElement): Array<[string, string[]]> {
    return getElementsWithin(host)
        .filter((section) => section.className === CLASS.section)
        .map((section) => [
            section.children[0]?.textContent ?? "",
            section.children.map((cell) => cell.className),
        ]);
}

/** The figures under the list are cells like any other, and the class is what says so. */
Deno.test("both totals and what belongs to neither side are drawn as figures", () => {
    const host = draw({ ...readFight(), sides: { reader: 300, opposing: 600, nobody: 100 } });
    const figures = getElementsWithin(host).filter((drawn) =>
        drawn.className.split(" ").includes(CLASS.figure)
    );
    const under = figures.filter((figure) => !figure.className.includes(CLASS.rowValue));
    assertEquals(
        under.map((figure) => figure.textContent),
        [formatFigure(300), formatFigure(600), formatFigure(100)],
        "the two sides and the spare, each wearing the class that holds it to one line",
    );
});

Deno.test("a blow nothing announced closes the skills, and says how many there were", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading),
        // Three blows that were all blocked are three blows: the row is drawn at nothing, and a
        // section that skipped it would say the combatant never swung.
        opened: {
            ...drill,
            bySkill: {
                rows: [],
                rest: null,
                closing: {
                    blows: 3,
                    rank: 1,
                    doesOpenPart: false,
                    figure: 0,
                    fill: 0,
                    shareText: "0%",
                },
                hasFiguresDisagreed: false,
            },
        },
    });
    const host = panel.element as FakeElement;
    const named = getTextsByClass(host, "row-name");
    const closing = getWordsForUnannounced("damageDealt");
    assertArrayIncludes(named, [closing], "the closing row stands in its own section");
    const shares = getTextsByClass(host, "row-share");
    assertArrayIncludes(
        shares,
        ["(0% · ×3)"],
        "carrying the count only its absence of a skill states",
    );
});

/**
 * ⚠️ **The mark goes on every span of the row, and this is why.** A listener reads what was
 * pressed off the node under the hand and walks no ancestors, so a mark on the row alone left the
 * name and the figure swallowing the press — the two thirds of a row a reader actually aims at.
 */
/**
 * The row a bound leaves behind stands **between** the named rows and the one that closes the
 * section, because it is neither: what it holds the game named, and what the closing row holds it
 * named nothing for. It opens nothing — a sum of parts nobody can list is a level of no figure.
 * `develop ADR 0055`.
 */
Deno.test("what a section could not draw is a row of its own, over the one that closes it", () => {
    const { reading, drill } = openFirstRow();
    const rows = drill.bySkill.rows.slice(0, 2);
    assert(rows.length > 0, "there are named rows to stand over");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading),
        opened: {
            ...drill,
            bySkill: {
                rows,
                rest: { blows: null, figure: 300, fill: 0.5, shareText: "30%" },
                closing: {
                    blows: 4,
                    rank: 3,
                    doesOpenPart: false,
                    figure: 100,
                    fill: 0.2,
                    shareText: "10%",
                },
                hasFiguresDisagreed: false,
            },
        },
    });
    const host = panel.element as FakeElement;

    const said = getTextsByClass(host, CLASS.rowName);
    const restIndex = said.indexOf(PANEL_WORDS.restOfKinds);
    assert(restIndex !== -1, "the sum is drawn as a row a reader can see and add up");
    const closing = said.indexOf(getWordsForUnannounced("damageDealt"));
    // ⚠️ **It stands last, and until 2026-09-12 it stood over the closing row.** `develop ADR 0055`
    // put it between the named rows and the closing one while both held no place; the closing row
    // has taken one since (`develop ADR 0079`) and this has not, so the sum is the only row of the
    // section left outside the order. What develop ADR 0055 settled is unmoved: it is never folded
    // into the row it now stands under.
    assert(
        restIndex > closing,
        "and it stands outside the order, under the rows that hold a place",
    );

    const marked = getElementsWithin(host).filter((drawn) =>
        drawn.textContent === PANEL_WORDS.restOfKinds
    );
    for (const cell of marked) {
        assertStrictEquals(cell.attributes.get("data-skill"), undefined, "and nothing on it opens");
        assertStrictEquals(cell.attributes.get("data-row"), undefined, "in any of the three ways");
        assertStrictEquals(cell.attributes.get("data-kind"), undefined, "a part row can open");
    }
});

/** And the same in the section cut by key, whose closing row claims the game stated no kind. */
Deno.test("a cut by key draws what it could not key, over the row saying none was stated", () => {
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({
        ...composeShownScreen(reading),
        opened: {
            ...drill,
            byElement: {
                rows: drill.byElement.rows.slice(0, 2),
                rest: { figure: 300, fill: 0.5, shareText: "30%" },
                noKind: { figure: 100, fill: 0.2, shareText: "10%" },
            },
        },
    });
    const host = panel.element as FakeElement;

    const said = getTextsByClass(host, CLASS.rowName);
    const restIndex = said.indexOf(PANEL_WORDS.restOfKinds);
    assert(restIndex !== -1, "the sum a fold could not key is drawn");
    const closing = said.indexOf(PANEL_WORDS.withoutKind);
    assert(closing > restIndex, "over the row for what the game stated no kind of at all");
});

Deno.test("a skill that opens asks for itself by name, wherever the press lands on it", () => {
    const { reading, drill } = openFirstRow();
    const pressed: PanelIntent[] = [];
    const document = composeFakeDocument();
    const panel = initTestView(document, { onIntent: (intent) => pressed.push(intent) });
    const rows = [
        {
            part: { kind: "skill" as const, name: "Dotyk anioła" },
            uses: 1,
            figure: 500,
            fill: 1,
            shareText: "50%",
            doesOpenPart: true,
        },
        {
            part: { kind: "skill" as const, name: "Zmrrożenie" },
            uses: 8,
            figure: 500,
            fill: 1,
            shareText: "50%",
            doesOpenPart: false,
        },
    ];
    panel.render({
        ...composeShownScreen(reading, "healthGiven"),
        opened: {
            ...drill,
            total: 1000,
            bySkill: { rows, rest: null, closing: null, hasFiguresDisagreed: false },
        },
    });
    const host = panel.element as FakeElement;
    const named = getElementsWithin(host).filter((drawn) => drawn.className === "row-name");
    const opening = named.filter((nameCell) => nameCell.textContent === "Dotyk anioła");
    assertStrictEquals(opening.length, 1, "the skill that reached somebody else is drawn");
    const marked = getElementsWithin(host).filter((drawn) => drawn.attributes.has("data-skill"));
    assertEquals(
        [...new Set(marked.map((drawn) => drawn.attributes.get("data-skill")))],
        ["Dotyk anioła"],
        "and it is the one thing on the screen that opens",
    );
    // The name first, which is where a reader aims and where a press is most easily swallowed,
    // and the count beside the value: a press that lands nowhere leaves the one before it standing.
    for (const [pressIndex, cell] of [opening[0], marked[0]].entries()) {
        assertExists(cell, "the row and the name a reader aims at both carry the mark");
        pressElement(host, "pointerdown", cell);
        assertStrictEquals(pressed.length, pressIndex + 1, "every press on the row lands");
        assertEquals(
            pressed.at(-1),
            {
                kind: PANEL_INTENT.openPart,
                part: { kind: OPENED_PART.skill, name: "Dotyk anioła" },
            },
            "asking for itself by the name it was announced under, which is not a number",
        );
    }
});

Deno.test("every row in a list draws the same cells before its name", () => {
    // The bug this catches was photographed. A ranking row's place held the space before its
    // name and a drilled row had a profession badge holding the same space; when the badge went,
    // the drill's names slid 14.5px left of the ranking's and sat on the bar's own cap, while
    // the ranking read as it always had. Nothing went red, because a row's parts are drawn from
    // whatever the reading happens to carry rather than from a shape every row keeps.
    const { reading, drill } = openFirstRow();
    const document = composeFakeDocument();
    const panel = initTestView(document);
    const shown = composeShownScreen(reading);
    const shapes = new Map<string, string[]>();
    const marked = new Set<string>();
    for (const [screen, opened] of [["ranking", null], ["drilled", drill]] as const) {
        panel.render({ ...shown, opened: opened });
        const host = panel.element as FakeElement;
        for (const row of getElementsWithin(host)) {
            if (row.className.split(" ")[0] !== "row") continue;
            if (row.children.length === 0) continue;
            const kept = getCellsBeforeMarks(row);
            shapes.set(`${screen}: ${kept.join(",")}`, kept);
            for (const cell of getCellsBeforeName(row)) {
                if (kept.includes(cell)) continue;
                marked.add(cell);
            }
        }
    }
    assertEquals(
        [...shapes.keys()].sort(),
        ["drilled: bar,bar-cap,row-rank", "ranking: bar,bar-cap,row-rank"],
        "a row on one screen is built of the cells a row on the other is",
    );
    // The half a shape check cannot state: what a row wears on top of that shape is a mark, and
    // a mark is one of three. A badge slipping back in reads as a cell nobody registered.
    for (const cell of marked) {
        assertArrayIncludes(ROW_MARK_CELLS, [cell], `${cell}: a cell before a name and no mark`);
    }
});

/** The same cells with the marks taken out, which is the shape every row keeps whatever it says. */
function getCellsBeforeMarks(row: FakeElement): string[] {
    return getCellsBeforeName(row).filter((cell) => !ROW_MARK_CELLS.includes(cell));
}

/** Where a row's name starts, which is the sum of every cell drawn before it. */
function getCellsBeforeName(row: FakeElement): string[] {
    const before: string[] = [];
    for (const cell of row.children) {
        const named = cell.className.split(" ")[0] ?? "";
        if (named === "row-name") return before;
        before.push(named);
    }
    return before;
}

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`, the healer at 469657: two announced
 * skills and
 * health that moved under `heal`, which nothing announced.
 *
 * The key is drawn under the reader's own word for it and never under the token, and never under
 * a row saying nothing was said — the game said `heal`, and the help calls it a regeneration.
 */
Deno.test("a healing section draws the key the game named, not a row saying it did not", () => {
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    const reading = presentScreen(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const drill = presentOpenedLevel(statistics, roster, "healthGiven", 469657);
    assertExists(drill, "the healer's row opens");
    assertStrictEquals(drill.bySkill.closing, null, "onto a section closing against nothing");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading, "healthGiven"), opened: drill });
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
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    const healer = 469657;
    const reading = presentScreen(
        statistics,
        roster,
        "healthGiven",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const drill = presentOpenedLevel(statistics, roster, "healthGiven", healer);
    assertExists(drill, "the healer's row opens");
    const pair = presentPairLevel(statistics, roster, "healthGiven", healer, healer);
    assertExists(pair, "and the person inside it opens onto the pair");
    assert(pair.parts.length > 1, "which says more than the row that was pressed");

    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading, "healthGiven"), opened: drill, pair });
    const host = panel.element as FakeElement;
    const headings = getElementsWithin(host).filter((drawn) =>
        drawn.className === "section-heading"
    );
    assertStrictEquals(
        headings.length,
        1,
        "one section, holding the whole of what passed between them",
    );
    assertStrictEquals(
        headings[0]?.children[0]?.textContent,
        PANEL_WORDS.skills,
        "saying what it cuts, and leaving whom to the crumb over it",
    );
    assertStrictEquals(
        headings[0]?.children[1]?.textContent,
        formatFigure(pair.total),
        "and standing over the figure the row that opened it stated",
    );
    const rows = getElementsWithin(host).filter((drawn) => drawn.className.split(" ")[0] === "row");
    assertStrictEquals(rows.length, pair.parts.length, "a row for each part, and no other");
    assert(
        rows.every((drawn) => drawn.attributes.get("data-row") === undefined),
        "and nothing on this rung opens any further",
    );
    const named = getTextsByClass(host, "row-name");
    assertArrayIncludes(
        named,
        [getWordsForHealthSource("heal")],
        "a key is drawn in the reader's words",
    );
    assert(!named.includes("heal"), "never under the token the protocol stated it on");
    assert(
        named.some((name) => name === "Zdrowa atmosfera"),
        "and an announcement under the name it was announced by",
    );
});

/**
 * A reader inside an opened row meets rows that open and rows that do not, and only the cursor
 * ever told the two apart. What stays shut is what the statistics keep no second cut of: damage
 * that ticked with nobody named at the other end has no level of people to open onto.
 */
Deno.test("a row that opens says so, and a row that does not says nothing of the kind", () => {
    const { roster, statistics } = tallyRecordedFight(BOTH_KINDS_OF_PAIR);
    const reading = presentScreen(
        statistics,
        roster,
        "damageTaken",
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const topRow = reading.rows[0];
    assertExists(topRow, "there is a row to open");
    const drill = presentOpenedLevel(statistics, roster, "damageTaken", topRow.combatantId);
    assertExists(drill, "and it opens");
    const opening = drill.byOtherEnd.rows.find((otherEnd) => otherEnd.doesOpenPair);
    const shut = drill.byElement.rows.find((kind) => !kind.doesOpenPart);
    assertExists(opening, "onto everybody it passed between, all of whom open");
    assertExists(shut, "and onto a kind of it nobody was named at the other end of");

    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading, "damageTaken"), opened: drill });
    const host = panel.element as FakeElement;
    const pointAtRow = (key: string) => {
        const nameCell = getElementsWithin(host).find((drawn) => {
            if (drawn.className !== "row-name") return false;
            return drawn.attributes.get("data-card") === key;
        });
        assertExists(nameCell, `${key} is a row on the panel`);
        pointAtElement(host, "pointermove", nameCell, 412);
        const card = (host.shadow ?? []).find((region) => region.className.startsWith(CLASS.card));
        assertExists(card, "and pointing at it opens the detail");
        return getTextsByClass(card, CLASS.cardNote);
    };
    assertStrictEquals(
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
    for (const row of drill.byOtherEnd.rows) {
        assert(
            pointAtRow(`to:${row.combatantId}`).includes(CARD_WORDS.scope),
            "and every person row says the figures over them are the fight's",
        );
    }
});

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

/**
 * The notes on the rows of one opened figure, read off the drawn panel: the name a row is drawn
 * under, and what its detail says about pressing it.
 */
function composeNotesForOpenedRow(
    metric: PanelMetric,
    combatantId: number,
): Map<string, string[]> {
    const { roster, statistics } = tallyRecordedFight(HILDUR);
    const reading = presentScreen(
        statistics,
        roster,
        metric,
        "everyone",
        null,
        NOTHING_SUSPECT,
    );
    const drill = presentOpenedLevel(statistics, roster, metric, combatantId);
    assertExists(drill, "the row opens");
    const document = composeFakeDocument();
    const panel = initTestView(document);
    panel.render({ ...composeShownScreen(reading, metric), opened: drill });
    const host = panel.element as FakeElement;
    const notesByRowName = new Map<string, string[]>();
    for (const row of getElementsWithin(host).filter((drawn) => drawn.className === "row-name")) {
        pointAtElement(host, "pointermove", row, 412);
        const card = (host.shadow ?? []).find((region) => region.className.startsWith(CLASS.card));
        assertExists(card, "and pointing at a row of it opens the detail");
        notesByRowName.set(row.textContent, getTextsByClass(card, CLASS.cardNote));
    }
    return notesByRowName;
}

Deno.test("a redraw of the same place puts the region back where the reader left it", () => {
    const { panel, shown } = composeScrolledPanel();
    panel.render(shown);
    const host = panel.element as FakeElement;
    readList(host).scrollTop = SOMEWHERE_DOWN;

    panel.render(shown);

    const after = readList(host);
    assertStrictEquals(
        after.scrollTop,
        SOMEWHERE_DOWN,
        "the payload left the reader where they were",
    );
    assertStrictEquals(after.replacedBy, null, "and it is the region that was just drawn");
});

/** A panel with a fight on it, and the reading its views are drawn from. */
function composeScrolledPanel(): {
    panel: PanelView;
    shown: ShownScreen;
} {
    const document = composeFakeDocument();
    const panel = initTestView(document);
    return { panel, shown: { ...composeShownScreen(readFight()), listName: "ranking" } };
}

/** The one region that scrolls, as it stands in the panel right now. */
function readList(host: FakeElement): FakeElement {
    const list = getElementsWithin(host).find((drawn) => drawn.className.includes(CLASS.list));
    assertExists(list, "the panel draws the one region that scrolls");
    return list;
}

/**
 * The list a reader is turning is swapped under them rather than replaced, and that swap is the
 * document's own calls like a replacement is: a refusal there costs the list, and the regions
 * drawn after it are drawn all the same.
 */
Deno.test("a list the document will not swap the rows of is kept as it was, and said", () => {
    const { panel, shown } = composeScrolledPanel();
    panel.render(shown);
    const host = panel.element as FakeElement;
    const standing = readList(host);
    const rowsBefore = standing.children.length;
    const meter = getElementsWithin(host).find((drawn) => drawn.children.includes(standing));
    assertExists(meter, "the list stands in the panel's own window");
    // The grip is the window's own and never redrawn, so it is no region under the list.
    const under = meter.children.slice(meter.children.indexOf(standing) + 1)
        .filter((drawn) => drawn.className !== CLASS.sizeGrip);
    assert(under.length > 0, "with regions under it");
    standing.replaceChildren = () => {
        throw new RangeError("a node the document will not let go of");
    };
    const report = panel.render({ ...shown, defects: [] });
    assertEquals(
        report.undrawn.map((failure) => `${failure.name}/${failure.region}`),
        ["RegionUndrawn/list"],
        "the failure names the list, and only the list",
    );
    assertStrictEquals(readList(host), standing, "and the list a reader had stays put");
    assertStrictEquals(standing.children.length, rowsBefore, "with the rows it had");
    assertEquals(
        under.filter((region) => region.replacedBy === null).map((region) => region.className),
        [],
        "while every region under it is drawn again",
    );
});

Deno.test("a place nobody has been starts at the top, and the one left keeps its position", () => {
    const { panel, shown } = composeScrolledPanel();
    panel.render(shown);
    const host = panel.element as FakeElement;
    readList(host).scrollTop = SOMEWHERE_DOWN;

    panel.render({ ...shown, listName: "opened" });
    assertStrictEquals(readList(host).scrollTop, 0, "a level opened is read from its top");

    panel.render(shown);
    assertStrictEquals(
        readList(host).scrollTop,
        SOMEWHERE_DOWN,
        "and the way back is where it was",
    );
});

Deno.test("a fold keeps the place, and unfolding gives the reader it back", () => {
    const { panel, shown } = composeScrolledPanel();
    panel.render(shown);
    const host = panel.element as FakeElement;
    readList(host).scrollTop = SOMEWHERE_DOWN;

    panel.render({ ...shown, isMeterCollapsed: true });
    assertEquals(
        getElementsWithin(host).filter((drawn) => drawn.className.includes(CLASS.list)),
        [],
        "a panel folded away draws no list at all",
    );

    panel.render(shown);
    assertStrictEquals(readList(host).scrollTop, SOMEWHERE_DOWN, "and unfolding is where it was");
});

Deno.test("the bar a panel waits behind carries nobody's position", () => {
    const { panel, shown } = composeScrolledPanel();
    panel.render(shown);
    const host = panel.element as FakeElement;
    readList(host).scrollTop = SOMEWHERE_DOWN;

    panel.renderWaiting(NOTHING_WAITING);
    const waiting = readList(host);
    assert(waiting.className.includes(CLASS.listWaiting), "the panel is back to waiting for one");
    assertStrictEquals(waiting.scrollTop, 0, "and the bar it waits behind stands at its own top");

    panel.render(shown);
    assertStrictEquals(readList(host).scrollTop, SOMEWHERE_DOWN, "the fight is where it was left");
});

/**
 * ⚠️ **A sentence nothing reads is a sentence nobody is told.** `tests/ui/panel-words.test.ts`
 * proves this one is allowed in front of a player; only a walk over the drawn panel proves it
 * reaches the row it was written for. And it is written for the damage screens alone — a healing
 * section closes against nothing, so there is no row there to carry it (`develop ADR 0080`).
 */
Deno.test("the closing row's card says what the game did not, and only on a damage screen", () => {
    for (const metric of SCREEN_ORDER) {
        const { reading, statistics, roster } = readPinnedFight(metric, "everyone");
        const opened = reading.rows[0];
        assertExists(opened, `${metric}: the ranking holds a row to open`);
        const drill = presentOpenedLevel(statistics, roster, metric, opened.combatantId);
        assertExists(drill, `${metric}: the first row opens`);
        const document = composeFakeDocument();
        const panel = initTestView(document);
        panel.render({ ...composeShownScreen(reading, metric), opened: drill });
        const host = panel.element as FakeElement;
        const row = getElementsWithin(host).find(
            (drawn) => drawn.attributes.get("data-card") === "skill:plain",
        );
        const caveat = getCaveatForUnannounced(getNounForMetric(metric));
        if (row === undefined) {
            assertStrictEquals(
                caveat,
                null,
                `${metric}: a screen drawing no closing row owes nothing`,
            );
            continue;
        }
        assertExists(caveat, `${metric}: a screen drawing the row has a sentence for it`);
        pointAtElement(host, "pointermove", row, 300);
        // The sentence alone: the ring opening it is a node of its own, drawn from the tone, and
        // never a character inside the text (`develop ADR 0092`).
        assertArrayIncludes(
            readCard(host).notes,
            [getNoteForCaveat(caveat)],
            `${metric}: the card says what the game did not say about these blows`,
        );
        // The glyph and the sentence are one answer, so the row wears the mark the card explains.
        assertStrictEquals(
            row.children.filter((cell) => cell.className === CLASS.rowCaveat).length,
            1,
            `${metric}: and the row wears the mark that sentence is the foot of`,
        );
    }
});

/**
 * ⚠️ **The same row, one rung down.** A pair's section closes against the same blows and the
 * caveat rides the same field, so a level that drops it hands a reader at the bottom of the drill
 * a figure that means narrower with nothing saying so — no ring, and no sentence on its card. A
 * walk over the level above reads none of this rung, which is where every other claim about the
 * mark is made (`develop ADR 0089`).
 */
Deno.test("a row closing a pair says what it says one level up, and its neighbours do not", () => {
    let drawn = 0;
    for (const metric of SCREEN_ORDER) {
        const { reading, statistics, roster } = readPinnedFight(metric, "everyone");
        const opened = reading.rows[0];
        assertExists(opened, `${metric}: the ranking holds a row to open`);
        const drill = presentOpenedLevel(statistics, roster, metric, opened.combatantId);
        assertExists(drill, `${metric}: the first row opens`);
        const otherEnd = drill.byOtherEnd.rows.find((row) => row.doesOpenPair);
        if (otherEnd === undefined) continue;
        const pair = presentPairLevel(
            statistics,
            roster,
            metric,
            opened.combatantId,
            otherEnd.combatantId,
        );
        assertExists(pair, `${metric}: the end inside that row opens onto the pair`);
        const document = composeFakeDocument();
        const panel = initTestView(document);
        panel.render({ ...composeShownScreen(reading, metric), opened: drill, pair });
        const host = panel.element as FakeElement;
        const rows = getElementsWithin(host).filter(
            (row) => row.attributes.get("data-card")?.startsWith("pair-") === true,
        );
        const closing = rows.find((row) => row.attributes.get("data-card") === "pair-skill:plain");
        // Every other part of a pair names what it was, so a mark on one would point at nothing.
        for (const row of rows) {
            if (row === closing) continue;
            assertStrictEquals(
                row.children.filter((cell) => cell.className === CLASS.rowCaveat).length,
                0,
                `${metric}: a part the game named wears no mark`,
            );
        }
        if (closing === undefined) continue;
        const caveat = getCaveatForUnannounced(getNounForMetric(metric));
        assertExists(caveat, `${metric}: a screen drawing the row has a sentence for it`);
        drawn += 1;
        assertStrictEquals(
            closing.children.filter((cell) => cell.className === CLASS.rowCaveat).length,
            1,
            `${metric}: the row closing a pair wears the mark it wears one level up`,
        );
        pointAtElement(host, "pointermove", closing, 300);
        assertArrayIncludes(
            readCard(host).notes,
            [getNoteForCaveat(caveat)],
            `${metric}: and its card says what the game did not say about these blows`,
        );
    }
    assert(drawn > 0, "a screen of this fight drew the row, so the walk above read one");
});

/**
 * The section under the list, drawn. **Both halves are held here**: that it reaches the page at
 * all, and that it does not when there is nothing for it to say — a section standing empty under
 * every fight would be a claim the panel makes about all of them.
 */
Deno.test("what no row holds stands under the list, hatched, and says so on its card", () => {
    const reading = readFight();
    assertStrictEquals(
        reading.outsideRanking,
        null,
        "the recording leaves nothing outside the ranking",
    );
    const quiet = draw(reading);
    assertEquals(
        getTextsByClass(quiet, "section-words").filter(
            (words) => words === PANEL_WORDS.outsideRanking,
        ),
        [],
        "so the section is not drawn at all",
    );

    const outside = { figure: 1000, fill: 0.5, shareText: "10%" };
    const host = draw({ ...reading, outsideRanking: outside });
    assertArrayIncludes(
        getTextsByClass(host, "section-words"),
        [PANEL_WORDS.outsideRanking],
        "a figure on nobody's row brings the section with it",
    );
    assertArrayIncludes(
        getTextsByClass(host, "row-name"),
        [PANEL_WORDS.outsideRow],
        "and the row inside it is named",
    );
    const row = getElementsWithin(host).find(
        (drawn) => drawn.attributes.get("data-card") === "outside",
    );
    assertExists(row, "the row is drawn with a card to open");
    // ⚠️ **The hatch is read off this row and not off the panel**, which is the whole visual
    // claim: it holds no place in the order above it. Asking whether anything on the screen wears
    // the accent is a reader the pinned rows answer for, whatever this row does.
    const hatched = getElementsWithin(host).find((drawn) =>
        drawn.children.some((child) =>
            child.className === "row-name" && child.textContent === PANEL_WORDS.outsideRow
        )
    );
    assertExists(hatched, "the row itself is on the page");
    assert(hatched.className.includes("apart"), "wearing the accent every placeless row wears");
    pointAtElement(host, "pointermove", row, 300);
    const card = readCard(host);
    assertArrayIncludes(
        card.notes,
        [PANEL_WORDS.outsideNote],
        "and its card says what cannot be known about it",
    );
});

Deno.test("what no row holds goes with the fight, when the panel folds or waits again", () => {
    const outside = { figure: 1000, fill: 0.5, shareText: "10%" };
    const shown = composeShownScreen({ ...readFight(), outsideRanking: outside });
    const isSectionDrawn = (host: FakeElement) =>
        getTextsByClass(host, "section-words").includes(PANEL_WORDS.outsideRanking);

    const waiting = initTestView(composeFakeDocument());
    waiting.render(shown);
    assert(isSectionDrawn(waiting.element as FakeElement), "the section stands under the fight");
    waiting.renderWaiting(NOTHING_WAITING);
    assert(!isSectionDrawn(waiting.element as FakeElement), "and a panel waiting again drops it");

    const folded = initTestView(composeFakeDocument());
    folded.render(shown);
    folded.render({ ...shown, isMeterCollapsed: true });
    assert(!isSectionDrawn(folded.element as FakeElement), "and so does a panel folded over it");
});
