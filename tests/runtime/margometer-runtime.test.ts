/**
 * Every layer at once, driven the way a browser drives them: a page carrying a battle object, a
 * frame the test lets fall, a document small enough to read, and the payloads of a real recording
 * fed through the wrapped method one call at a time. What comes out is what a reader would see.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertInstanceOf,
    assertNotStrictEquals,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import * as errors from "#/libs/errors.ts";
import { parseJson } from "#/libs/json-text.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import { MESSAGES_MAXIMUM } from "#/src/core/fight-decoder.ts";
import { composeFightView } from "#/src/core/fight-session.ts";
import { initBrowserStore, type KeyValueStore, STORE_KEY } from "#/src/ports/browser-store.ts";
import { initBrowserFrames } from "#/src/ports/browser-time.ts";
import { LOOKS_MAXIMUM, type RuntimeTables } from "#/src/runtime/margometer-runtime.ts";
import { MargonemEngineTooltipRefused } from "#/src/runtime/panel-frame.ts";
import { KEPT_MAXIMUM } from "#/src/runtime/shelf.ts";
import { CLASS, composeStyleSheet } from "#/src/ui/panel-look.ts";
import { TYPE_STEP, TYPE_STEP_DEFAULT } from "#/src/ui/panel-choice.ts";
import { STANDING_TURN_STATE } from "#/src/ui/panel-helper.ts";
import {
    DEFECT_MARK,
    EVERY_SLOT_PINNED_ANSWER,
    FIGHT_CARD_WORDS,
    formatDefect,
    formatKeptUnread,
    formatPlace,
    getWordsForTurnState,
    HELPER_WORDS,
    MOVE_REFUSED_ANSWER,
    PANEL_DEFECT_KIND,
    PANEL_WORDS,
    PIN_REFUSED_ANSWER,
    STORE_MADE_ROOM_ANSWER,
    STORE_REFUSED_ANSWER,
} from "#/src/ui/panel-words.ts";
import {
    type FakeElement,
    getElementsWithin,
    getPanelWithin,
    getTextsByClass,
    getWholeTextsByClass,
    pointAtElement,
} from "#/tests/fake-document.ts";
import { readCard } from "#/tests/drawn-card.ts";
import { TEST_VERSION } from "#/tests/panel-view.ts";
import {
    lookupRecordedFight,
    readRecordedFights,
    replayRecordedFight,
} from "#/tests/recorded-fights.ts";
import {
    CAPTURED_AT,
    initHeldStore,
    initRefusingStore,
    initRuntimeWorld,
    MARGONEM_CLIENT_BUILD,
    readKeptFights,
    RUNTIME_TABLES,
    type RuntimeWorld,
    WORLD,
} from "#/tests/runtime-world.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** Another fight, so a shelf and a session can hold different figures at the same moment. */
const ANOTHER = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
/** A third, so two fights are on the shelf at once while a fourth is the one going on. */
const THIRD = "captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json";
/** Two fights of one party: ten combatants are shared between them, read 2026-08-31. */
const FIRST_OF_A_PAIR = "captures/2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none.json";
const SECOND_OF_A_PAIR = "captures/2026-08-15-tempest-grupa-vs-hildur-2-1786514810315-none.json";

/** Stated skills that date a cast for no turns, which the walk refuses on the first team cast. */
const TABLES_DATING_NOTHING: RuntimeTables = {
    ...RUNTIME_TABLES,
    tooltip: {
        ...RUNTIME_TABLES.tooltip,
        statedSkills: {
            ...RUNTIME_TABLES.tooltip.statedSkills,
            auraTurnsBySkillId: { get: () => 0 } as unknown as ReadonlyMap<number, number>,
        },
    },
};

Deno.test("a recording played through the add-on ends on the panel a reader would see", () => {
    const battle: Record<string, unknown> = { updateData: () => "the engine's own answer" };
    const engineOwn = battle.updateData;
    const world = initRuntimeWorld(composeBattlePage(battle));
    assertNotStrictEquals(battle.updateData, engineOwn, "the game was found and wrapped");
    for (const payload of readUpdates(HILDUR)) {
        assertEquals(world.update(payload), "the engine's own answer", "its value is untouched");
    }
    assertEquals(world.lines, [], "and nothing of ours failed along the way");
    assertEquals(world.shown.length, 1, "one panel on the page, however many calls arrived");
    const rows = getElementsWithin(findList(world.getHost())).filter((fakeElement) =>
        fakeElement.className.split(" ")[0] === CLASS.row
    );
    assertEquals(rows.length, 11, "the fight's eleven combatants, each with a row");
    // The panel spaces its thousands on a gap that does not break.
    const figures = rows.map((row) =>
        Number(
            (row.children.find((child) => child.className === `${CLASS.rowValue} ${CLASS.figure}`)
                ?.textContent ?? "").split(" ").join(""),
        )
    );
    assert((figures[0] ?? 0) > 0, "the largest figure is above nothing");
    for (const [rank, figure] of figures.entries()) {
        if (rank === 0) continue;
        assert((figures[rank - 1] ?? 0) >= figure, "and the rest fall away from it");
    }
    const names = rows.map((row) =>
        row.children.find((child) => child.className === CLASS.rowName)?.textContent ?? ""
    );
    assertStrictEquals(new Set(names).size, names.length, "each row is somebody of their own");
    assertStrictEquals(world.runtime.deinit(), undefined, "the wrap comes off");
    assertStrictEquals(battle.updateData, engineOwn, "and the game's own method is back");
});

function composeBattlePage(battle: Record<string, unknown> = { updateData: () => 1 }) {
    return { Engine: { battle } };
}

function readUpdates(path: string): readonly unknown[] {
    return lookupRecordedFight(path).updates;
}

function findList(host: FakeElement): FakeElement {
    const list = getElementsWithin(host).find((fakeElement) =>
        fakeElement.className.split(" ")[0] === CLASS.list
    );
    assertExists(list, "the panel drew its list");
    return list;
}

Deno.test("every recording plays through without a word of failure", () => {
    for (const fight of readRecordedFights()) {
        const world = initRuntimeWorld(composeBattlePage());
        for (const payload of fight.updates) world.update(payload);
        assertEquals(world.lines, [], `${fight.path}: something of ours failed`);
        assert(world.shown.length > 0, `${fight.path}: nothing was ever drawn`);
    }
});

Deno.test("a panel goes up when the reading starts, saying there has been no fight yet", () => {
    const world = initRuntimeWorld(composeBattlePage());
    assertEquals(world.shown.length, 1, "one panel, put up the moment the reading started");
    const host = world.getHost();
    assertEquals(
        getTextsByClass(findList(host), CLASS.empty),
        [PANEL_WORDS.noFightYet],
        "waiting, said",
    );
    assertEquals(
        getElementsWithin(host).filter((fakeElement) => fakeElement.className === CLASS.strips),
        [],
        "no strips",
    );
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertEquals(world.shown.length, 1, "the same panel is still the one on the page");
    assert(countRows(findList(host)) > 0, "which now draws the fight");
});

function countRows(within: FakeElement): number {
    return getElementsWithin(within).filter((fakeElement) =>
        fakeElement.className.split(" ")[0] === CLASS.row
    )
        .length;
}

Deno.test("the ranking marks whose turn it is, and stops the moment the fight is over", () => {
    const world = initRuntimeWorld(composeBattlePage());
    const payloads = readUpdates(HILDUR);
    const marksNow = () => {
        return getElementsWithin(world.getHost()).filter((fakeElement) =>
            fakeElement.className === CLASS.rowTurn
        );
    };
    let marked = 0;
    for (const [payloadIndex, payload] of payloads.entries()) {
        world.update(payload);
        // The last payload ends the fight, and a fight over numbers nobody's turn.
        if (payloadIndex === payloads.length - 1) continue;
        const marks = marksNow();
        assert(marks.length <= 1, "never more than one row at a time takes a turn");
        marked += marks.length;
    }
    assert(marked > 0, "this recording states a turn while it is going on");
    assertEquals(marksNow(), [], "and the fight ending takes the mark off the ranking");
});

/**
 * The failure this whole surface was built for: composing a screen reaches `core/`, which throws,
 * and a reading that will not compose must cost that frame's panel and say so, never stop it.
 */
Deno.test("a fight the panel cannot read leaves it saying so, not saying nothing", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => ({
        clock: {
            ...built.ports.clock,
            readMoment: () => {
                throw new RangeError("a clock this browser will not answer");
            },
        },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertStrictEquals(world.shown.length, 1, "its panel is still the one on the page");
    const host = world.getHost();
    assertEquals(
        getTextsByClass(host, CLASS.empty),
        [getWordsForTurnState(STANDING_TURN_STATE.afterFight), PANEL_WORDS.fightUnread],
        "which says this fight cannot be shown, and never that there has not been one",
    );
    const said = getTextsByClass(host, CLASS.defect);
    assertStrictEquals(said.length, 1, "with one line saying what the panel could not do");
    assertStringIncludes(said[0] ?? "", "×", "and a tally, because it happened on every frame");
    assertStrictEquals(world.lines.length, 1, "E9: the console hears it once");
});

Deno.test("a page answering with no size and no clock still draws its fight", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => ({
        readViewport: () => null,
        clock: { ...built.ports.clock, readMoment: () => null },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    assertStrictEquals(countRows(findList(host)), 11, "every one of the fight's combatants");
    assertEquals(getTextsByClass(host, CLASS.defect), [], "and nothing of ours failed drawing it");
    assertEquals(world.lines, [], "nor reached the console");
});

Deno.test("a document that will not take the panel is tried again, and said once it does", () => {
    let refusals = 0;
    const world = initRuntimeWorld(composeBattlePage(), (_, base) => ({
        mountPanel: (panel) => {
            refusals += 1;
            if (refusals === 1) return new errors.Caught("torn");
            return base.mountPanel(panel);
        },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertStrictEquals(world.shown.length, 1, "the panel got its place on the next frame");
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.mount, null, 1)}`],
        "which says so in the past, because by the time it is read the panel is standing",
    );
    assertStrictEquals(world.lines.length, 1, "E9: the console heard it once");
});

Deno.test("a failure that escaped the payload's guards into the wrap is a defect all the same", () => {
    let writes = 0;
    const world = initRuntimeWorld(composeBattlePage(), (built) => ({
        console: {
            writeBrandedLine: (kind) => {
                writes += 1;
                if (writes === 1) throw new RangeError("a console that refused its first line");
                built.lines.push(kind);
            },
        },
    }));
    // A payload that throws when read is a reading defect whose report is the first console line,
    // so the console refusing it throws past the payload's guards and into the wrap.
    const everyTrapThrows = new Proxy({}, {
        get: () => () => {
            throw new RangeError("a payload that throws when it is read");
        },
    });
    const throwing = new Proxy({}, everyTrapThrows);
    world.update(throwing);
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.reading, null, 2)}`],
        "the reading that failed, and what its report threw on the way out",
    );
});

Deno.test("a page that throws when it is looked at leaves the add-on standing, and says so", () => {
    const page = {
        get Engine(): unknown {
            throw new RangeError("a page that will not be read");
        },
    };
    const world = initRuntimeWorld(page);
    assertStrictEquals(world.shown.length, 0, "no panel went up over a game nobody found");
    assertStrictEquals(world.lines.length, 1, "the failure was said once, rather than thrown");
    assertStrictEquals(world.runtime.deinit(), undefined, "and there is no wrap to take off");
});

/**
 * Standing up reads what the browser kept, and every reader of it degrades on its own: a store
 * somebody edited costs what was in it, and never the add-on.
 */
Deno.test("a store nothing can be read out of costs what was in it, and not the add-on", () => {
    const tooMany: unknown[] = [];
    for (let fightIndex = 0; fightIndex < 40; fightIndex += 1) {
        tooMany.push({ openedAt: fightIndex + 1, payloads: [{ a: "1=100;0" }], isPinned: false });
    }
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        const edited = JSON.stringify({ version: 3, fights: tooMany });
        for (const key of Object.values(STORE_KEY)) {
            built.held.set(key, key.includes("place") ? "{" : edited);
            built.getShelf("local").set(key, edited);
        }
        return {};
    });
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertStrictEquals(countRows(findList(world.getHost())), 11, "the fight is drawn in full");
    assert(world.lines.length <= 1, "and whatever could not be read was said once");
});

Deno.test("a reader presses a screen and the panel goes there, and nowhere else", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const currentScreen = () =>
        getElementsWithin(host)
            .find((fakeElement) => fakeElement.className.includes(CLASS.stripCurrent))
            ?.attributes.get("data-screen");
    assertEquals(currentScreen(), "damageDealt", "the panel opens on what the reader did");
    const taken = findByMark(host, "data-screen", "damageTaken");
    assertExists(taken, "there is a screen to press");
    world.press(taken);
    assertEquals(currentScreen(), "damageTaken", "and pressing it takes the panel there");
    const stray = world.ports.document.createElement("div") as FakeElement;
    stray.setAttribute("data-screen", "whateverTheGameCalls");
    world.press(stray);
    assertEquals(currentScreen(), "damageTaken", "and a screen nobody has moves nothing");
});

/** The add-on stood up on a page of its own, with a recording replayed through its wrap. */
function playRecordedFight(path: string = HILDUR): RuntimeWorld {
    const world = initRuntimeWorld(composeBattlePage());
    for (const payload of readUpdates(path)) world.update(payload);
    return world;
}

function findByMark(host: FakeElement, mark: string, markValue?: string): FakeElement | undefined {
    return getElementsWithin(host).find((fakeElement) => {
        const stated = fakeElement.attributes.get(mark);
        if (stated === undefined) return false;
        return markValue === undefined ? true : stated === markValue;
    });
}

Deno.test("a reader presses the other side of a fight against one, and the panel answers", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const chosen = () =>
        getElementsWithin(host)
            .find((fakeElement) => {
                if (!fakeElement.className.includes(CLASS.stripCurrent)) return false;
                return fakeElement.attributes.has("data-side");
            })
            ?.attributes.get("data-side");
    assertEquals(chosen(), "everyone", "the panel opens on everybody in the fight");
    const opposing = findByMark(host, "data-side", "opposing");
    assertExists(opposing, "there is a side to press");
    world.press(opposing);
    assertEquals(chosen(), "opposing", "and pressing it takes the panel to the other side");
    const reader = findByMark(host, "data-side", "reader");
    assertExists(reader, "and a side of the reader's own to press");
    world.press(reader);
    assertEquals(chosen(), "reader", "which the panel goes to as well");
    assertEquals(world.lines, [], "with nothing of ours failing either way");
});

Deno.test("a fight that ends goes on the shelf, once, and comes back after a reload", () => {
    const world = playRecordedFight();
    const kept = readKeptFights(world.getShelf("local"));
    assertEquals(kept.length, 1, "one fight, however many calls said it was over");
    assertEquals(
        kept[0]?.margonemClientBuild,
        MARGONEM_CLIENT_BUILD,
        "under the build the page stated it on",
    );
    const again = reloadRuntimeWorld(world);
    openShelfScreen(again);
    assertEquals(getTextsByClass(again.getHost(), CLASS.rowSize), ["10×1"], "and comes back");
    const back = findByMark(again.getHost(), "data-fight");
    assertExists(back, "as a row to open");
    again.press(back);
    assertEquals(
        getRankingTexts(again.getHost()),
        getRankingTexts(world.getHost()),
        "which draws the same fight, read again off what the game delivered",
    );
});

/** The reader comes back: a second start over the stores the first one left behind. */
function reloadRuntimeWorld(firstWorld: RuntimeWorld, page = composeBattlePage()): RuntimeWorld {
    return initRuntimeWorld(page, (second) => {
        for (const [key, stored] of firstWorld.held) second.held.set(key, stored);
        for (const choice of ["local", "session"]) {
            for (const [key, stored] of firstWorld.getShelf(choice)) {
                second.getShelf(choice).set(key, stored);
            }
        }
        return {};
    });
}

function openShelfScreen(world: RuntimeWorld): void {
    const strip = findByMark(world.getHost(), "data-shelf");
    assertExists(strip, "the bar carries the way onto the shelf");
    world.press(strip);
}

/** Every row of the ranking as a reader reads it, name and figure, in the order drawn. */
function getRankingTexts(host: FakeElement): string[] {
    return getElementsWithin(findList(host))
        .filter((fakeElement) => fakeElement.className.split(" ")[0] === CLASS.row)
        .map((row) => row.children.map((child) => child.textContent).join(" | "));
}

/** Three fights, because the newest is the live row and never looked up on the shelf. */
Deno.test("each fight on the shelf says its own size, not the one before it", () => {
    const world = initRuntimeWorld(composeBattlePage());
    for (const path of [HILDUR, ANOTHER, THIRD]) {
        for (const payload of readUpdates(path)) world.update(payload);
    }
    openShelfScreen(world);
    const sizes = getTextsByClass(world.getHost(), CLASS.rowSize);
    assertEquals(sizes, ["1×1", "1×3", "10×1"], "newest first, each fight its own size");
});

Deno.test("a reader folds the panel away, and it is still folded when they come back", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const rows = (within: FakeElement) => countRows(getPanelWithin(within));
    assert(rows(host) > 0, "the panel opens drawing the fight");
    assertEquals(world.held.get(STORE_KEY.meterFolded), undefined, "and nothing is stored yet");
    const folding = findByMark(host, "data-fold");
    assertExists(folding, "there is a control to press");
    world.press(folding);
    assertEquals(rows(host), 0, "pressing it folds the panel to its bar");
    assertEquals(world.held.get(STORE_KEY.meterFolded), "1", "and says so where a reload looks");

    const again = reloadRuntimeWorld(world);
    for (const payload of readUpdates(HILDUR)) again.update(payload);
    const reopened = again.getHost();
    assertEquals(rows(reopened), 0, "the panel comes back folded, as the reader left it");
    const unfolding = findByMark(reopened, "data-fold");
    assertExists(unfolding, "the bar still carries its control");
    again.press(unfolding);
    assert(rows(reopened) > 0, "which brings the fight back");
    assertEquals(again.held.get(STORE_KEY.meterFolded), "", "and stores the unfolding too");
});

Deno.test("the fight is handed over counted as well as raw, and the two agree", () => {
    const world = initRuntimeWorld(composeBattlePage(composeRecordingBattle()));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    pressSave(world);
    const written = readSavedFile(world);
    const entries = written.calls;
    assert(Array.isArray(entries), "the calls the game made are in the file");
    const report = written.report;
    assert(isRecord(report), "and the figures the panel drew from them stand beside them");
    assertEquals(report.payloads, entries.length, "built from every call the file carries");
    assertEquals(report.isOver, true, "of a fight this one saw the end of");
    const counted = report.combatants;
    assert(isRecord(counted), "with a row for each combatant the aggregate counted");
    const totals = report.totals;
    assert(isRecord(totals), "and the fight's own totals beside them");
    const summed = Object.values(counted).reduce((sum: number, row) => {
        if (!isRecord(row)) return sum;
        return sum + (typeof row.damageDealtApplied === "number" ? row.damageDealtApplied : 0);
    }, 0);
    assertEquals(totals.damageDealtApplied, summed, "which come to what the rows come to");
    // Each row's dealt is its health and what a pool took, which this fight holds a row of.
    let drained = 0;
    for (const row of Object.values(counted)) {
        if (!isRecord(row)) continue;
        const { damageDealt, damageDealtApplied, damageDealtAbsorbed } = row;
        assert(typeof damageDealtAbsorbed === "number", "a row states what a pool took");
        assert(typeof damageDealtApplied === "number", "and the health");
        assertEquals(damageDealt, damageDealtApplied + damageDealtAbsorbed, "which are its dealt");
        drained += damageDealtAbsorbed;
    }
    assert(drained > 0, "and a pool took part of what somebody dealt in it");
});

/**
 * A battle carrying what a running fight carries: combatants whose health the game moves **in
 * place** while its own call runs, which is what makes a recording's two snapshots independent.
 */
function composeRecordingBattle(): Record<string, unknown> {
    const health: Record<string, unknown> = { max: 100, value: 100 };
    const warriors = { 1: { id: 1, name: "somebody", team: 1, prof: "w", lvl: 60, hp: health } };
    return {
        warriorsList: warriors,
        updateData: () => {
            health.value = 90;
            return 1;
        },
    };
}

function pressSave(world: RuntimeWorld): void {
    const control = findByMark(world.getHost(), "data-save");
    assertExists(control, "the bar carries the control that offers the fight");
    world.press(control);
}

function readSavedFile(world: RuntimeWorld, savedIndex = 0): Record<string, unknown> {
    const parsed = parseJson(world.saved[savedIndex]?.text ?? "");
    assert(!(parsed instanceof Error), "what it handed over reads back as JSON");
    assert(isRecord(parsed), "and as a recording");
    return parsed;
}

Deno.test("a reader asks for the fight, and gets the recording the intake tool reads", () => {
    const world = initRuntimeWorld(composeBattlePage(composeRecordingBattle()));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertEquals(world.lines, [], "nothing of ours failed while it recorded");
    assertEquals(world.saved.length, 0, "and nothing is saved until the control is pressed");
    pressSave(world);
    assertEquals(world.saved.length, 1, "one file when it is");
    const capturedStamp = CAPTURED_AT.split(":").join("-").split(".").join("-");
    assertEquals(
        world.saved[0]?.name,
        `margometer-${WORLD}-${MARGONEM_CLIENT_BUILD}-${TEST_VERSION}-${capturedStamp}.json`,
        "named for the world, both builds and the moment it was asked for",
    );
    const written = readSavedFile(world);
    assertEquals(
        [written.world, written.gameBuild],
        [WORLD, MARGONEM_CLIENT_BUILD],
        "where, and which client",
    );
    const entries = written.calls;
    assert(Array.isArray(entries), "carrying the calls the game made");
    assertEquals(entries.length, readUpdates(HILDUR).length, "every call, as material thinned");
    assertEquals(written.droppedCalls, 0, "and the file says nothing was dropped");
    const firstCall = entries[0];
    assert(isRecord(firstCall), "an entry is a record");
    const keys = ["index", "payload", "messages", "combatantsBefore", "combatantsAfter"];
    assertEquals(Object.keys(firstCall), keys, "in the shape every admitted recording carries");
    const before = firstCall.combatantsBefore;
    const after = firstCall.combatantsAfter;
    assert(Array.isArray(before), "with a snapshot before the call");
    assert(Array.isArray(after), "and one after it");
    assertEquals(
        [isRecord(before[0]) ? before[0].hp : null, isRecord(after[0]) ? after[0].hp : null],
        [{ max: 100, value: 100 }, { max: 100, value: 90 }],
        "and they differ, which is only true if each was copied rather than referenced",
    );
});

Deno.test("a panel with no fight anywhere carries no control to hand one over", () => {
    const world = initRuntimeWorld(composeBattlePage(composeRecordingBattle()));
    assertEquals(findByMark(world.getHost(), "data-save"), undefined, "no control for nothing");
    const [opening] = readUpdates(HILDUR);
    world.update(opening);
    pressSave(world);
    assertEquals(world.saved.length, 1, "one call is a fight, and the bar hands it over");
});

/** The file that started this: an envelope with no call in it, off a panel on a kept fight. */
Deno.test("the fight handed over is the one on screen, kept ones included", () => {
    const world = playRecordedFight();
    const again = reloadRuntimeWorld(world);
    pressSave(again);
    assertEquals(
        again.saved.length,
        1,
        "the bar offers the fight it is drawing, and hands it over",
    );
    const written = readSavedFile(again);
    const calls = written.calls;
    assert(Array.isArray(calls), "carrying the calls the shelf kept");
    assert(calls.length > 0, "which is a fight and not an empty envelope");
    assert(calls.length <= readUpdates(HILDUR).length, "and no more than were made");
    const report = written.report;
    assert(isRecord(report), "with the figures the panel drew beside them");
    assertEquals(report.payloads, calls.length, "built from every call the file carries");
    assertEquals(report.isOver, true, "of a fight this one saw the end of");
    const firstCall = calls[0];
    assert(isRecord(firstCall), "and each call is a record");
    assertEquals(firstCall.combatantsBefore, null, "a snapshot the shelf never kept is absent");
    assertEquals(firstCall.combatantsAfter, null, "on either side of the call");
    assert(Array.isArray(firstCall.messages), "while the messages come back out of the payload");
    assertEquals(written.droppedCalls, null, "and what nobody counted is not counted as none");
});

Deno.test("the shelf has a screen of its own, and its control toggles", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const rows = () => countRows(getPanelWithin(host));
    const figures = rows();
    assert(figures > 1, "the panel is on the figures, with a row for each of them");
    openShelfScreen(world);
    assertEquals(rows(), 1, "and on the shelf, where the live and the kept fight are one row");
    assertEquals(getTextsByClass(host, CLASS.rowTime), ["teraz"], "the one going on now");
    const pins = getElementsWithin(host).filter((fakeElement) =>
        fakeElement.className.startsWith(CLASS.rowPin)
    );
    assertEquals(pins.length, 1, "and it carries a pin, being a fight the rotation can drop");
    assertEquals(getTextsByClass(host, CLASS.crumbHere), ["Walki"], "the shelf says what it is");
    assertEquals(
        getElementsWithin(host).filter((fakeElement) => fakeElement.className === CLASS.sides),
        [],
        "and totals nothing, being a list of fights rather than a screen of one",
    );
    const back = getRegion(host, CLASS.crumbBack);
    assertExists(back, "the shelf carries the way back");
    world.press(back);
    assertEquals(rows(), figures, "which gives the figures back");
    openShelfScreen(world);
    openShelfScreen(world);
    assertEquals(rows(), figures, "and so does the control that put the shelf up");
});

function getRegion(host: FakeElement, className: string): FakeElement | undefined {
    return getElementsWithin(getPanelWithin(host)).find((fakeElement) =>
        fakeElement.className === className
    );
}

Deno.test("a browser that will not have the shelf is answered, not argued with", () => {
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        settings: initRefusingStore(),
        initShelfStore: () => initRefusingStore(),
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertEquals(world.lines, [], "a refusal is not a failure of ours");
    assertEquals(world.shown.length, 1, "and the panel goes on drawing the fight it is watching");
});

Deno.test("a page with no game draws nothing and says why, once", () => {
    const world = initRuntimeWorld({});
    assertEquals(world.shown, [], "there was nothing to wrap, so nothing is drawn");
    assertEquals(world.lines, [], "and nothing is said until the looking gives up");
});

Deno.test("a second copy of the add-on stands down and never draws", () => {
    const page = composeBattlePage();
    const firstWorld = initRuntimeWorld(page);
    const secondWorld = initRuntimeWorld(page);
    assertEquals(secondWorld.lines.length, 1, "the second copy stands down, and says so once");
    firstWorld.update({ init: 1, m: [], mi: [] });
    assertEquals(secondWorld.shown, [], "while it never puts a panel on the page");
    assertEquals(firstWorld.shown.length, 1, "and the first has the one panel there is");
});

Deno.test("a reader opens a row, and every way out of it leads back to the screen", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const before = countListRows(host);
    assert(before > 0, "the screen has rows to open");
    assertEquals(countRowsThatOpen(host), before, "every one of them openable");
    const name = getRegion(host, CLASS.rowName);
    assertExists(name, "and a reader presses the name inside one");
    world.press(name);
    assertExists(getRegion(host, CLASS.crumb), "which opens that row over the screen");
    const person = getRegion(host, CLASS.crumbHere)?.textContent;
    assertExists(person, "saying whose row it is");
    assert(countListRows(host) > 0, "and drawing the parts of one figure");
    assert(countRowsThatOpen(host) > 0, "some of which open onto what passed between two people");
    const otherName = getElementsWithin(getPanelWithin(host)).find((fakeElement) => {
        if (fakeElement.className !== CLASS.rowName) return false;
        return fakeElement.attributes.get("data-row") !== undefined;
    });
    assertExists(otherName, "there is somebody to open");
    world.press(otherName);
    assertEquals(countRowsThatOpen(host), 0, "and on that rung nothing opens any further");
    world.press(getRegion(host, CLASS.crumbBack) ?? host);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, person, "one rung at a time");
    world.press(getRegion(host, CLASS.crumbBack) ?? host);
    assertEquals(getRegion(host, CLASS.crumb), undefined, "and pressing it again closes the row");
    assertEquals(countListRows(host), before, "leaving the screen as it was");

    // What survives a change of screen: the person a reader went into stays, and a side does not.
    const again = getRegion(host, CLASS.rowName);
    assertExists(again, "a row opens a second time");
    world.press(again);
    const opened = getRegion(host, CLASS.crumbHere)?.textContent;
    const taken = findByMark(host, "data-screen", "damageTaken");
    assertExists(taken, "there is another screen to reach for");
    world.press(taken);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, opened, "the same person stays");
    const side = findByMark(host, "data-side", "reader");
    assertExists(side, "and a side to narrow to");
    world.press(side);
    assertEquals(getRegion(host, CLASS.crumb), undefined, "which closes it: it may not hold them");
});

function countListRows(host: FakeElement): number {
    const list = getRegion(host, CLASS.list);
    return list === undefined ? 0 : countRows(list);
}

function countRowsThatOpen(host: FakeElement): number {
    return getElementsWithin(getPanelWithin(host)).filter((fakeElement) => {
        if (fakeElement.className.split(" ")[0] !== CLASS.row) return false;
        return fakeElement.attributes.get("data-row") !== undefined;
    }).length;
}

/** The way back is the whole panel's, so it lands on the ranking as readily as on a level. */
Deno.test("a way back with no rung to leave moves nothing, and redraws nothing", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const getBar = () =>
        getElementsWithin(host).find((fakeElement) => fakeElement.className === CLASS.title);
    const bar = getBar();
    assertExists(bar, "the bar is drawn, and a draw is what replaces it");
    world.press(host, "contextmenu");
    assertStrictEquals(bar.replacedBy, null, "a way back off the ranking leaves the panel alone");
    const name = getRegion(host, CLASS.rowName);
    assertExists(name, "and there is a row to open");
    world.press(name);
    const opened = getBar();
    assertExists(opened, "the bar standing after that draw");
    world.press(host, "contextmenu");
    assertExists(opened.replacedBy, "a way back off a rung is a draw");
    assertEquals(getRegion(host, CLASS.crumb), undefined, "and the rung is left");
});

/** The four screens pin five different figures, so the row of that name there is another one. */
Deno.test("a reader opens a pinned row, and it does not follow them to the next screen", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const pinnedName = () => {
        const block = getRegion(host, CLASS.pinned);
        if (block === undefined) return undefined;
        return getElementsWithin(block).find((fakeElement) =>
            fakeElement.className === CLASS.rowName
        );
    };
    const name = pinnedName();
    assertExists(name, "this fight pins a figure nobody was named for");
    assertEquals(name.textContent, PANEL_WORDS.withoutActor, "and says which end it left out");
    assertEquals(name.attributes.get("data-unnamed"), "actor", "marked by that end");
    world.press(name);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, PANEL_WORDS.withoutActor, "open");
    assertEquals(pinnedName(), undefined, "and the pinned row itself is off the screen");
    const person = getElementsWithin(host).find((fakeElement) => {
        if (fakeElement.className !== CLASS.rowName) return false;
        return fakeElement.attributes.get("data-row") !== undefined;
    });
    assertExists(person, "the level names whom the game did state, each opening further");
    world.press(person);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, person.textContent, "one rung");
    const kinds = getElementsWithin(host).filter((fakeElement) => {
        return (fakeElement.attributes.get("data-card") ?? "").startsWith("kind:");
    });
    assert(kinds.length > 0, "which is the keys their share of the figure moved under");
    world.press(getRegion(host, CLASS.crumbBack) ?? host);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, PANEL_WORDS.withoutActor, "back");
    world.press(getRegion(host, CLASS.crumbBack) ?? host);
    assertEquals(getRegion(host, CLASS.crumb), undefined, "the way back closes it");
    const reopened = pinnedName();
    assertExists(reopened, "and puts the pinned row back under the ranking");
    world.press(reopened);
    const taken = findByMark(host, "data-screen", "damageTaken");
    assertExists(taken, "there is another screen to reach for");
    world.press(taken);
    assertEquals(getRegion(host, CLASS.crumb), undefined, "a change of screen closes it");
});

Deno.test("a reader opens what a figure was made of, and the way back is one rung", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const name = getRegion(host, CLASS.rowName);
    assertExists(name, "a reader presses a row of the ranking");
    world.press(name);
    const person = getRegion(host, CLASS.crumbHere)?.textContent;
    assertExists(person, "which opens onto their figure, and says whose it is");
    const announcementName = getElementsWithin(host).find((fakeElement) => {
        if (fakeElement.className !== CLASS.rowName) return false;
        return fakeElement.attributes.get("data-skill") !== undefined;
    });
    assertExists(announcementName, "an announcement inside it is pressed by its own name");
    const named = announcementName.textContent;
    world.press(announcementName);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, named, "that announcement");
    assert(countRows(getPanelWithin(host)) > 0, "listing whom it reached");
    world.press(getRegion(host, CLASS.crumbBack) ?? host);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, person, "back one rung");
    world.press(getRegion(host, CLASS.crumbBack) ?? host);
    assertEquals(getRegion(host, CLASS.crumb), undefined, "and the next press closes the row");
});

Deno.test("a row belonging to nobody in the fight opens nothing", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const stray = world.ports.document.createElement("div") as FakeElement;
    stray.setAttribute("data-row", "whoeverTheGameCalls");
    world.press(stray);
    assertEquals(
        getRegion(host, CLASS.crumb),
        undefined,
        "a row that is not a number opens nothing",
    );
    const absent = world.ports.document.createElement("div") as FakeElement;
    absent.setAttribute("data-row", "0");
    world.press(absent);
    assertEquals(getRegion(host, CLASS.crumb), undefined, "and neither does one nobody holds");
});

Deno.test("the place a fight is fought reaches the bar, and goes on the shelf with it", () => {
    const world = initRuntimeWorld(composePlacedPage());
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    assertEquals(
        getWholeTextsByClass(host, CLASS.headerPlace),
        ["Mapa Testowa (12, 34)"],
        "the bar",
    );
    openShelfScreen(world);
    const row = getElementsWithin(getPanelWithin(host))
        .find((fakeElement) => fakeElement.className.split(" ")[0] === CLASS.row);
    assertExists(row, "the shelf drew the fight that ended");
    assertEquals(getTextsByClass(row, CLASS.rowName), ["Mapa Testowa (12, 34)"], "and its row");
});

function composePlacedPage(hero: Record<string, unknown> = { x: 12, y: 34 }) {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    return { Engine: { battle, map: { d: { name: "Mapa Testowa" } }, hero: { d: hero } } };
}

Deno.test("a client that says nothing about the place leaves the bar saying nothing", () => {
    const world = playRecordedFight();
    assertEquals(
        getWholeTextsByClass(world.getHost(), CLASS.headerPlace),
        [],
        "nothing, as nothing",
    );
});

Deno.test("a second fight is asked where it is, not told where the one before it was", () => {
    const hero: Record<string, unknown> = { x: 12, y: 34 };
    const world = initRuntimeWorld(composePlacedPage(hero));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    assertEquals(
        getWholeTextsByClass(host, CLASS.headerPlace),
        ["Mapa Testowa (12, 34)"],
        "the first",
    );
    hero.x = 7;
    hero.y = 8;
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertEquals(
        getWholeTextsByClass(host, CLASS.headerPlace),
        ["Mapa Testowa (7, 8)"],
        "the second",
    );
});

Deno.test("a panel reloaded between fights opens on the shelf rather than on nothing", () => {
    const world = playRecordedFight();
    assert(world.getShelf("local").size > 0, "the fight was kept where a reload will look");
    const again = reloadRuntimeWorld(world);
    const host = again.getHost();
    assertEquals(
        getTextsByClass(host, CLASS.empty),
        [HELPER_WORDS.nothingHappens],
        "neither window says there was none, and the one beside it says nothing is going on",
    );
    assert(countRows(findList(host)) > 0, "it draws the newest fight it kept");
    openShelfScreen(again);
    assertEquals(getTextsByClass(host, CLASS.rowSize), ["10×1"], "which opens onto the fight kept");
});

/**
 * The newest kept fight is what a reload between fights stands on, and one that no longer reads
 * (a version later, say) is named for what it is: never "there has been no fight", which the
 * shelf itself would contradict. When and where come off the shelf, and no outcome is claimed.
 */
Deno.test("a reload onto a kept fight that no longer reads says so, and when and where it was", () => {
    const over = new Array(MESSAGES_MAXIMUM + 1).fill("0;0;txt=c");
    const place = { mapName: "Grota", x: 34, y: 12 };
    for (const [stated, where] of [[place, formatPlace("Grota", 34, 12)], [null, null]] as const) {
        const world = initRuntimeWorld(composeBattlePage(), (built) => {
            const fights = [{ openedAt: 1, payloads: [{ init: 1, m: over }], place: stated }];
            const shelf = {
                version: 3,
                fights: fights.map((fight) => ({ ...fight, isPinned: false })),
            };
            built.getShelf("local").set(STORE_KEY.fights, JSON.stringify(shelf));
            return {};
        });
        const moment = world.ports.clock.readMoment(1);
        assertEquals(getTextsByClass(findList(world.getHost()), CLASS.empty), [
            PANEL_WORDS.keptUnread,
            formatKeptUnread(moment, where),
        ], `${where}: the fight is named, not denied`);
    }
});

/** A row is opened by the game's own id, and a party keeps its ids from one fight to the next. */
Deno.test("a fight that opens puts the reader back on the ranking", () => {
    const world = initRuntimeWorld(composeBattlePage());
    for (const payload of readUpdates(FIRST_OF_A_PAIR)) world.update(payload);
    const host = world.getHost();
    // A player's row: the opponent is an NPC, whose id the game states afresh for each fight.
    const name = getElementsWithin(host).find((fakeElement) => {
        if (fakeElement.className !== CLASS.rowName) return false;
        const stated = fakeElement.attributes.get("data-row");
        if (stated === undefined) return false;
        return !stated.startsWith("-");
    });
    assertExists(name, "there is a player's row to open");
    world.press(name);
    const person = getRegion(host, CLASS.crumbHere)?.textContent;
    assertExists(person, "the crumb says whose row it is");
    for (const payload of readUpdates(SECOND_OF_A_PAIR)) world.update(payload);
    assertEquals(
        getRegion(host, CLASS.crumb),
        undefined,
        "the next fight is drawn from its ranking",
    );
    assert(getTextsByClass(host, CLASS.rowName).includes(person), "with that person in it");
});

Deno.test("a pin is the reader's own answer, and the shelf keeps it", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    openShelfScreen(world);
    const pin = (): FakeElement => {
        const drawnPin = getElementsWithin(host).find((fakeElement) =>
            fakeElement.className.startsWith(CLASS.rowPin)
        );
        assertExists(drawnPin, "the fight on the shelf carries a pin");
        return drawnPin;
    };
    assertEquals(pin().textContent, "☆", "which starts saying nothing was pinned");
    const before = countRows(getPanelWithin(host));
    world.press(pin());
    assertEquals(pin().textContent, "★", "and says so after it is pressed");
    assertEquals(countRows(getPanelWithin(host)), before, "a pin opens no fight");
    assertEquals(readKeptFights(world.getShelf("local"))[0]?.isPinned, true, "written down");
    world.press(pin());
    assertEquals(pin().textContent, "☆", "pressed again it is the other answer");
    assertEquals(readKeptFights(world.getShelf("local"))[0]?.isPinned, false, "written as readily");
});

Deno.test("where the shelf is kept is the reader's answer, and the fights travel with it", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    openOptions(world);
    assert(world.getShelf("local").has(STORE_KEY.fights), "the fight is where nothing was asked");
    chooseStorage(world, "session");
    assertEquals(readKeptFights(world.getShelf("session")).length, 1, "where the reader asked");
    assertEquals(world.getShelf("local").has(STORE_KEY.fights), false, "and the old place emptied");
    assertEquals(world.held.get(STORE_KEY.storage), "session", "the answer itself is kept");
    assertEquals(
        getStorageChosen(host),
        ["do zamknięcia karty"],
        "and the strip marks it",
    );
    chooseStorage(world, "memory");
    assertEquals(world.getShelf("session").has(STORE_KEY.fights), false, "what was there is gone");
    openShelfScreen(world);
    assertEquals(countRows(getPanelWithin(host)), 1, "and the fight is still on the shelf");
});

function chooseStorage(world: RuntimeWorld, name: string): void {
    const storageOption = findByMark(world.getHost(), "data-storage", name);
    assertExists(storageOption, `the strip offers ${name}`);
    world.press(storageOption);
}

/** The storage strip's answer, read by its mark: the options carry the type's strip beside it. */
function getStorageChosen(host: FakeElement): string[] {
    return getElementsWithin(host)
        .filter((fakeElement) => fakeElement.attributes.get("data-storage") !== undefined)
        .filter((fakeElement) => fakeElement.className.includes(CLASS.stripCurrent))
        .map((fakeElement) => fakeElement.textContent);
}

function openOptions(world: RuntimeWorld): void {
    const control = findByMark(world.getHost(), "data-options");
    assertExists(control, "the bar carries the way into the options");
    world.press(control);
}

Deno.test("a browser that will not keep the answer moves nothing, and says so", () => {
    const world = initRuntimeWorld(composeBattlePage(), () => ({ settings: initRefusingStore() }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    openOptions(world);
    chooseStorage(world, "memory");
    assertEquals(world.getShelf("local").has(STORE_KEY.fights), true, "the fights stay put");
    assertEquals(
        getStorageChosen(host),
        ["na stałe"],
        "and the strip goes on saying where they are",
    );
    assertEquals(
        getTextsByClass(host, CLASS.suspicion),
        ["⚠ Przeglądarka nie zapisała tego wyboru — zostaje tak, jak było."],
        "which the options say outright rather than drawing a choice as taken",
    );
});

Deno.test("a store that will not take the fights leaves them where they were", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => ({
        initShelfStore: (choice) =>
            choice === "session" ? initRefusingStore() : initHeldStore(built.getShelf(choice)),
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    openOptions(world);
    chooseStorage(world, "session");
    assertEquals(world.getShelf("local").has(STORE_KEY.fights), true, "where the next page looks");
    assertEquals(world.held.get(STORE_KEY.storage), undefined, "and so does the answer");
    assertEquals(
        getStorageChosen(world.getHost()),
        ["na stałe"],
        "which the strip says",
    );
    const said = getTextsByClass(world.getHost(), CLASS.suspicion);
    assert(
        said.some((suspicion) => suspicion.includes(MOVE_REFUSED_ANSWER)),
        "and the options say the place would not take them",
    );
    assert(
        !said.some((suspicion) => suspicion.includes(STORE_REFUSED_ANSWER)),
        "never that a fight went unsaved",
    );
});

Deno.test("the options open from the bar, and every way off a screen leaves them", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const here = () => getTextsByClass(host, CLASS.crumbHere);
    openOptions(world);
    assertEquals(here(), [PANEL_WORDS.options], "the options cover the screen");
    assertEquals(countRows(getPanelWithin(host)), 0, "with no row of the fight's beside them");
    openShelfScreen(world);
    assertEquals(here(), [PANEL_WORDS.fights], "the shelf takes their place rather than stacking");
    openOptions(world);
    assertEquals(here(), [PANEL_WORDS.options], "and they take the shelf's");
    openOptions(world);
    assertEquals(here(), [], "their own control puts them away");
    openOptions(world);
    world.press(host, "contextmenu");
    assertEquals(here(), [], "and so does the way back, from anywhere on the panel");
    assert(countRows(getPanelWithin(host)) > 1, "onto the ranking they covered");
});

Deno.test("the options answer before any fight has come, and the answer is kept", () => {
    const world = initRuntimeWorld(composeBattlePage());
    const host = world.getHost();
    openOptions(world);
    assertEquals(getTextsByClass(host, CLASS.crumbHere), [PANEL_WORDS.options], "they stand");
    chooseStorage(world, "memory");
    assertEquals(world.held.get(STORE_KEY.storage), "memory", "and a choice made there is kept");
    assertEquals(
        getStorageChosen(host),
        ["tylko teraz"],
        "which the strip marks",
    );
});

Deno.test("a fight off the shelf is read back, and the live one is a press away", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const drawnFigures = () =>
        getTextsByClass(getPanelWithin(host), `${CLASS.rowValue} ${CLASS.figure}`);
    const live = drawnFigures();
    assert(live.length > 0, "the panel is drawing the fight that just ended");
    openShelfScreen(world);
    assertEquals(countRows(getPanelWithin(host)), 1, "the fight that ended, as the one going on");
    openShelfScreen(world);
    for (const payload of readUpdates(ANOTHER)) world.update(payload);
    const now = drawnFigures();
    assertNotStrictEquals(now[0], live[0], "the second fight states figures of its own");
    openShelfScreen(world);
    const kepts = getElementsWithin(getPanelWithin(host)).filter((fakeElement) => {
        if (fakeElement.className.split(" ")[0] !== CLASS.row) return false;
        return fakeElement.attributes.get("data-fight") !== "live";
    });
    assertEquals(kepts.length, 1, "the shelf holds the fight that ended before this one");
    const held = kepts[0];
    assertExists(held, "and it is the one this test opened with");
    world.press(held);
    assertEquals(getTextsByClass(host, CLASS.crumbHere), [], "the shelf gives way to the figures");
    assertEquals(drawnFigures(), live, "which are the first fight's, read back off what was kept");
    openShelfScreen(world);
    const marked = getElementsWithin(host).filter((fakeElement) =>
        fakeElement.className.includes(CLASS.rowChosen)
    );
    assertEquals(marked.length, 1, "and the shelf marks which fight is on screen");
    assertEquals(marked[0]?.attributes.get("data-fight") === "live", false, "the kept one");
});

Deno.test("a fight that has ended is handed over whole, snapshots and all", () => {
    const world = playRecordedFight();
    openShelfScreen(world);
    const row = getElementsWithin(getPanelWithin(world.getHost()))
        .find((fakeElement) => fakeElement.className.split(" ")[0] === CLASS.row);
    assertExists(row, "the shelf holds the fight that just ended");
    world.press(row);
    pressSave(world);
    const written = readSavedFile(world);
    const calls = written.calls;
    assert(Array.isArray(calls), "carrying its calls");
    const firstCall = calls[0];
    assert(isRecord(firstCall), "and each of them a record");
    assert(Array.isArray(firstCall.combatantsBefore), "with the snapshots the shelf never keeps");
    assert(Array.isArray(firstCall.combatantsAfter), "on either side of the call");
    assertEquals(written.droppedCalls, 0, "and a dropped count that was really counted");
});

Deno.test("a fight the reader walked into says so on the panel", () => {
    const world = initRuntimeWorld(composeBattlePage({ updateData: () => null }));
    const [opening, ...rest] = readUpdates(HILDUR);
    assertExists(opening, "the recording opens with a payload");
    for (const payload of rest) world.update(payload);
    const drawn = getElementsWithin(world.getHost()).find((fakeElement) =>
        fakeElement.className === CLASS.suspicions
    );
    assertExists(drawn, "the panel drew the region a suspicion is said in");
    const said = getElementsWithin(drawn).map((fakeElement) => fakeElement.textContent ?? "").join(
        " ",
    );
    assertStringIncludes(said, "w trakcie", "and says the reading began after the fight did");
});

/** A kept fight that will not replay costs its own row, and the live fight nothing. */
Deno.test("a kept fight that will not replay costs its row, and not the live fight", () => {
    const over = new Array(MESSAGES_MAXIMUM + 1).fill("0;0;txt=c");
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        const fights = [{ openedAt: 1, payloads: [{ init: 1, m: over }], isPinned: false }];
        built.getShelf("local").set(STORE_KEY.fights, JSON.stringify({ version: 3, fights }));
        return {};
    });
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    assertStrictEquals(countRows(findList(host)), 11, "the live fight is drawn in full");
    assertEquals(
        getTextsByClass(host, CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.kept, null, 1)}`],
        "one defect, for the shelf",
    );
    assertEquals(world.lines.length, 1, "said once on the console, however many frames walked it");
});

Deno.test("a call that is no payload is recorded under no messages but its own", () => {
    const world = initRuntimeWorld(composeBattlePage());
    const [opening] = readUpdates(HILDUR);
    world.update(opening);
    world.update("not a payload");
    pressSave(world);
    const calls = readSavedFile(world).calls;
    assert(Array.isArray(calls), "carrying the calls");
    assertEquals(calls.length, 2, "both of them, the second for the shape nobody had seen");
    const second = calls[1];
    assert(isRecord(second), "each a record");
    assertEquals(second.messages, [], "and the second carries no messages, having stated none");
});

Deno.test("a battle that cannot be snapshotted costs the file and the tooltips, and the panel reads on", () => {
    const clean = playRecordedFight();
    const battle = { updateData: () => 1, warriorsList: composeCastPastItsBound() };
    const world = initRuntimeWorld(composeBattlePage(battle));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    assertEquals(getRankingTexts(host), getRankingTexts(clean.getHost()), "the fight read whole");
    const said = getTextsByClass(host, CLASS.defect);
    assertStrictEquals(said.length, 2, "and a line says each thing that could not be done");
    const fileSaid = formatDefect(PANEL_DEFECT_KIND.file, null, 1).slice(0, -1);
    assert(said.some((line) => line.includes(fileSaid)), "the file, which needs the board");
    const regionSaid = formatDefect(PANEL_DEFECT_KIND.region, null, 1).slice(0, -1);
    assert(said.some((line) => line.includes(regionSaid)), "and the tooltips, written to nobody");
    assertEquals(
        [...world.lines].sort(),
        [PANEL_DEFECT_KIND.file, PANEL_DEFECT_KIND.region],
        "E9: the console hears each once",
    );
});

/** One more fighter than a fight holds, which every reader of a cast refuses. */
function composeCastPastItsBound(): Record<string, unknown> {
    const warriors: Record<string, unknown> = {};
    for (let id = 1; id <= 21; id += 1) {
        warriors[id] = { id, name: `fighter ${id}`, team: 1, prof: "w", lvl: 60, hp: { max: 1 } };
    }
    return warriors;
}

Deno.test("a payload the fight refuses is said on the panel, and the next one is read", () => {
    const clean = playRecordedFight();
    const world = initRuntimeWorld(composeBattlePage());
    const payloads = readUpdates(HILDUR);
    const middle = Math.floor(payloads.length / 2);
    for (const [payloadIndex, payload] of payloads.entries()) {
        if (payloadIndex === middle) world.update({ w: composeCastPastItsBound() });
        world.update(payload);
    }
    const host = world.getHost();
    assertEquals(getRankingTexts(host), getRankingTexts(clean.getHost()), "the fight around it");
    const said = getTextsByClass(host, CLASS.defect);
    assertStrictEquals(said.length, 2, "one line says the panel refused it, one what that cost");
    assertStringIncludes(said[0] ?? "", formatDefect(PANEL_DEFECT_KIND.reading, null, 1));
    assertStringIncludes(said[1] ?? "", formatDefect(PANEL_DEFECT_KIND.keeping, null, 1));
    assertEquals(
        world.getShelf("local").has(STORE_KEY.fights),
        false,
        "a fight with a gap is not kept",
    );
    assertStrictEquals(world.lines.length, 2, "E9: the console hears each kind once");
});

Deno.test("a window that will not say its size costs the panel its place, and no more", () => {
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        readViewport: () => {
            throw new RangeError("a window torn down while it was asked");
        },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const said = getTextsByClass(world.getHost(), CLASS.defect);
    assertStrictEquals(said.length, 1, "one line says it did not stand where it was meant to");
    assertStringIncludes(
        said[0] ?? "",
        formatDefect(PANEL_DEFECT_KIND.mount, null, 1).slice(0, -1),
    );
});

/** `docs/design.md` §10.5: a panel waiting for a game says what it cannot see. */
Deno.test("a game that never comes puts the panel up saying so, once the looking stops", () => {
    const { world, fire } = initSearchingWorld({});
    fire(LOOKS_MAXIMUM - 2);
    assertEquals(world.shown, [], "no panel while the looking goes on");
    fire(1);
    assertStrictEquals(world.shown.length, 1, "and one when it gives up");
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.engine, null, 1)}`],
        "saying the game cannot be seen",
    );
    assertEquals(world.lines, [PANEL_DEFECT_KIND.engine], "and the console heard it once");
});

/** A search that runs to its bound: the step the page's timer holds, fired by the test. */
function initSearchingWorld(page: Record<string, unknown>) {
    const steps: (() => void)[] = [];
    const world = initRuntimeWorld(page, () => ({
        interval: {
            every: (step) => {
                steps.push(step);
                return { cancel: () => undefined };
            },
        },
    }));
    const fire = (times: number): void => {
        for (let fired = 0; fired < times; fired += 1) steps[0]?.();
        world.flush();
    };
    return { world, fire };
}

Deno.test("a game whose method is gone puts the panel up saying so, once the looking stops", () => {
    const { world, fire } = initSearchingWorld(composeBattlePage({}));
    fire(LOOKS_MAXIMUM - 2);
    assertEquals(world.shown, [], "no panel while the looking goes on");
    assertEquals(world.lines, [], "and nothing said");
    fire(1);
    assertStrictEquals(world.shown.length, 1, "the panel stands over a game it cannot read");
    assertEquals(world.lines, [PANEL_DEFECT_KIND.engine], "and says why, once");
});

/** `docs/design.md` §10.1: a copy that stood down puts no panel up, refused at first or not. */
Deno.test("a copy refused at first stands down when another wraps the game, and shows nothing", () => {
    const battle: Record<string, unknown> = {};
    const page = composeBattlePage(battle);
    const holdingCopy = initSearchingWorld(page);
    const refusedCopy = initSearchingWorld(page);
    holdingCopy.fire(3);
    refusedCopy.fire(3);
    assertEquals(refusedCopy.world.shown, [], "a refused copy puts nothing up while it looks");
    battle.updateData = () => 1;
    holdingCopy.fire(1);
    refusedCopy.fire(LOOKS_MAXIMUM);
    assertEquals(refusedCopy.world.shown, [], "and the copy that stood down never puts a panel up");
    assertEquals(refusedCopy.world.lines.length, 1, "saying it stood down, once");
    holdingCopy.world.update({ init: 1, m: [], mi: [] });
    assertStrictEquals(holdingCopy.world.shown.length, 1, "while the copy holding the game draws");
});

Deno.test("a page that lends no frame is drawn at once, and says so once", () => {
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        frames: { requestFrame: () => new errors.Caught("none") },
    }));
    assertStrictEquals(world.shown.length, 1, "the panel went up without a frame");
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertStrictEquals(countRows(findList(world.getHost())), 11, "and draws the fight at once");
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.region, null, 1)}`],
        "with one line, counted once however many draws went without a frame",
    );
});

Deno.test("a stopped add-on takes its wrap off and draws no frame it had asked for", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const engineOwn = battle.updateData;
    const world = initRuntimeWorld(composeBattlePage(battle));
    const [opening] = readUpdates(HILDUR);
    const wrapped = battle.updateData;
    assert(typeof wrapped === "function", "the wrap went on");
    wrapped(opening);
    assertStrictEquals(world.runtime.deinit(), undefined, "the wrap came off");
    world.flush();
    assertStrictEquals(battle.updateData, engineOwn, "the game's own method is back");
    assertEquals(
        getTextsByClass(findList(world.getHost()), CLASS.empty),
        [PANEL_WORDS.noFightYet],
        "unmoved",
    );
});

Deno.test("a stopped add-on whose frame the page would not cancel draws nothing when it falls", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const world = initRuntimeWorld(composeBattlePage(battle), (_, base) => ({
        frames: {
            requestFrame: (step, onStepFailure) => {
                const requested = base.frames.requestFrame(step, onStepFailure);
                if (requested instanceof Error) return requested;
                return { cancel: () => undefined };
            },
        },
    }));
    const [opening] = readUpdates(HILDUR);
    const wrapped = battle.updateData;
    assert(typeof wrapped === "function", "the wrap went on");
    wrapped(opening);
    assertStrictEquals(world.runtime.deinit(), undefined, "the wrap came off");
    world.flush();
    assertEquals(
        getTextsByClass(findList(world.getHost()), CLASS.empty),
        [PANEL_WORDS.noFightYet],
        "the frame that still fell drew nothing",
    );
});

/** `docs/design.md` §9: a mark stating a value nothing of ours writes is a dropped gesture. */
Deno.test("a mark nothing of ours writes drops the gesture, and the next frame says so", () => {
    const world = playRecordedFight();
    const stray = world.ports.document.createElement("div") as FakeElement;
    stray.setAttribute("data-screen", "whateverTheGameCalls");
    world.press(stray);
    const taken = findByMark(world.getHost(), "data-screen", "damageTaken");
    assertExists(taken, "there is a screen to press");
    world.press(taken);
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.gesture, null, 1)}`],
        "one gesture dropped, said on the next frame",
    );
});

/**
 * A failure met outside a frame — a gesture dropped, a card that would not draw under a pointer —
 * asks for the frame that says it. Without that ask a reader who only hovers never sees the line.
 */
Deno.test("a gesture dropped with nothing pressed after it is said on the frame it asks for", () => {
    const world = playRecordedFight();
    const stray = world.ports.document.createElement("div") as FakeElement;
    stray.setAttribute("data-screen", "whateverTheGameCalls");
    world.press(stray);
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.gesture, null, 1)}`],
        "said at once, without waiting for another press",
    );
});

Deno.test("two calls before a frame falls ask for one frame, and it draws both", () => {
    let requested = 0;
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const world = initRuntimeWorld(composeBattlePage(battle), (_, base) => ({
        frames: {
            requestFrame: (step, onStepFailure) => {
                requested += 1;
                return base.frames.requestFrame(step, onStepFailure);
            },
        },
    }));
    const updateData = battle.updateData;
    assert(typeof updateData === "function", "the wrap went on");
    const [opening, ...rest] = readUpdates(HILDUR);
    world.update(opening);
    const before = requested;
    for (const payload of rest) updateData(payload);
    assertStrictEquals(requested - before, 1, "one frame for every call made before it fell");
    world.flush();
    const clean = playRecordedFight();
    assertEquals(getRankingTexts(world.getHost()), getRankingTexts(clean.getHost()), "all drawn");
});

/** Stopped, the panel left on the page is a picture: a press on it changes nothing kept. */
Deno.test("a stopped copy answers no press, and draws no call that still reaches it", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const world = playRecordedFightOn(battle);
    const theirs = battle.updateData;
    assert(typeof theirs === "function", "the wrap went on");
    // Somebody wrapped over ours, so ours cannot come off and goes on being called.
    battle.updateData = (payload: unknown) => Reflect.apply(theirs, battle, [payload]);
    const folding = findByMark(world.getHost(), "data-fold");
    assertExists(folding, "there is a control to press");
    assertInstanceOf(world.runtime.deinit(), Error, "ours cannot come off from under theirs");
    world.press(folding);
    assertEquals(world.held.get(STORE_KEY.meterFolded), undefined, "the press kept nothing");
    world.update({ init: 1, m: ["0;0;txt=a"] });
    const drawn = countRows(findList(world.getHost()));
    assert(drawn > 0, "no frame drew the fight that call opened, which has nobody in it");
});

function playRecordedFightOn(battle: Record<string, unknown>): RuntimeWorld {
    const world = initRuntimeWorld(composeBattlePage(battle));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    return world;
}

Deno.test("a size of type chosen redraws both windows in it, and comes back after a reload", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const sheet = () =>
        getElementsWithin(host).find((fakeElement) => fakeElement.tag === "style")?.textContent;
    const drawn = sheet();
    assertStrictEquals(drawn, composeStyleSheet(TYPE_STEP_DEFAULT), "it opens at the default");
    assertEquals(world.held.get(STORE_KEY.typeStep), undefined, "with nothing stored");
    openOptions(world);
    const large = findByMark(host, "data-type-step", TYPE_STEP.large);
    assertExists(large, "the options offer the largest step");
    world.press(large);
    assertStrictEquals(sheet(), composeStyleSheet(TYPE_STEP.large), "the sheet is that step's");
    assertEquals(world.held.get(STORE_KEY.typeStep), TYPE_STEP.large, "and the choice is kept");
    const bar = getElementsWithin(host).find((fakeElement) =>
        fakeElement.className === CLASS.title
    );
    const again = findByMark(host, "data-type-step", TYPE_STEP.large);
    assertExists(again, "the step stands marked where it was pressed");
    world.press(again);
    assertStrictEquals(bar?.replacedBy, null, "the same step again redraws nothing");
    const reloaded = reloadRuntimeWorld(world);
    const style = getElementsWithin(reloaded.getHost()).find((fakeElement) =>
        fakeElement.tag === "style"
    );
    assertStrictEquals(
        style?.textContent,
        composeStyleSheet(TYPE_STEP.large),
        "a reader who comes back reads at the step they chose",
    );
});

Deno.test("a size of type the browser kept unreadable costs that size, and says so", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        built.held.set(STORE_KEY.typeStep, "enormous");
        return {};
    });
    const host = world.getHost();
    const style = getElementsWithin(host).find((fakeElement) => fakeElement.tag === "style");
    assertStrictEquals(style?.textContent, composeStyleSheet(TYPE_STEP_DEFAULT), "the default");
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertEquals(
        getTextsByClass(host, CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.kept, null, 1)}`],
        "and the panel says what it had kept could not be read",
    );
});

Deno.test("a window sized is kept with no frame, comes back after a reload, and goes back", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const bar = getElementsWithin(host).find((fakeElement) =>
        fakeElement.className === CLASS.title
    );
    const size = { width: 320, height: 350 };
    world.runtime.onIntent({ kind: "resize", window: "meter", size });
    assertEquals(world.held.get(STORE_KEY.meterSize), '{"width":320,"height":350}', "kept");
    world.flush();
    assertStrictEquals(
        bar?.replacedBy,
        null,
        "and the window already standing that size is not redrawn",
    );
    const reloaded = reloadRuntimeWorld(world);
    const style = () => reloaded.getHost().attributes.get("style") ?? "";
    assertStringIncludes(style(), "--MargoMeter-meter-width:320px", "it comes back that wide");
    assertStringIncludes(style(), "--MargoMeter-meter-height:350px", "and that tall");
    openOptions(reloaded);
    const reset = findByMark(reloaded.getHost(), "data-reset-size", "meter");
    assertExists(reset, "the options offer the size back");
    reloaded.press(reset);
    assertEquals(reloaded.held.get(STORE_KEY.meterSize), undefined, "given back, nothing is kept");
    assertEquals(style().includes("--MargoMeter-meter-width"), false, "and it stands at its type");
    assertEquals(
        findByMark(reloaded.getHost(), "data-reset-size", "meter"),
        undefined,
        "with nothing left to give back",
    );
});

Deno.test("a window sized while the options stand open is offered back in the same frame", () => {
    const world = playRecordedFight();
    openOptions(world);
    assertEquals(findByMark(world.getHost(), "data-reset-size", "meter"), undefined, "unsized");
    world.runtime.onIntent({ kind: "resize", window: "meter", size: { width: 320, height: 350 } });
    world.flush();
    assertExists(
        findByMark(world.getHost(), "data-reset-size", "meter"),
        "the options redrawn on release offer the size back",
    );
});

Deno.test("a window sized stays that size through the frames after it, and can be given back", () => {
    const battle = composeBattlePage();
    const world = initRuntimeWorld(battle);
    const updates = readUpdates(HILDUR);
    const half = Math.floor(updates.length / 2);
    for (const payload of updates.slice(0, half)) world.update(payload);
    world.runtime.onIntent({ kind: "resize", window: "meter", size: { width: 320, height: 350 } });
    for (const payload of updates.slice(half)) world.update(payload);
    const style = world.getHost().attributes.get("style") ?? "";
    assertStringIncludes(
        style,
        "--MargoMeter-meter-width:320px",
        "the next payload keeps the size",
    );
    openOptions(world);
    assertExists(
        findByMark(world.getHost(), "data-reset-size", "meter"),
        "and the options offer it back without a reload",
    );
});

Deno.test("a window's size the browser kept unreadable costs the size, and says so", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        built.held.set(STORE_KEY.helperSize, '{"width":-3,"height":200}');
        return {};
    });
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    const standing = getElementsWithin(host).find((fakeElement) =>
        fakeElement.className.startsWith(CLASS.helper)
    );
    assertEquals(
        (standing?.attributes.get("style") ?? "").includes("--MargoMeter-helper-width"),
        false,
        "the window stands at its type",
    );
    assertEquals(
        getTextsByClass(host, CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.kept, null, 1)}`],
        "and the panel says what it had kept could not be read",
    );
});

Deno.test("a window's fold the browser kept unreadable costs the fold, and says so", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        built.held.set(STORE_KEY.meterFolded, "folded, perhaps");
        return {};
    });
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    assert(countRows(getPanelWithin(host)) > 0, "the panel stands unfolded, which is the default");
    assertEquals(
        getTextsByClass(host, CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.kept, null, 1)}`],
        "and says what it had kept could not be read",
    );
});

Deno.test("where a reader lets go of a window is kept where a reload will look for it", () => {
    const world = playRecordedFight();
    world.runtime.onIntent({ kind: "move", window: "meter", position: { left: 40, top: 60 } });
    assertEquals(
        world.held.get(STORE_KEY.meterPosition),
        '{"left":40,"top":60}',
        "written once, where a reload will look",
    );
    assertEquals(world.lines, [], "and nothing of ours failed keeping it");
});

Deno.test("a file the browser will not take is said on the panel at once", () => {
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        file: { writeFile: () => new errors.Caught("no room") },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    pressSave(world);
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.file, null, 1)}`],
        "the press asks for a frame of its own, so the reader is told before the next call",
    );
});

Deno.test("a fight still going on is on the shelf with nothing to pin", () => {
    const world = initRuntimeWorld(composeBattlePage());
    const payloads = readUpdates(HILDUR);
    for (const payload of payloads.slice(0, 3)) world.update(payload);
    openShelfScreen(world);
    const pins = getElementsWithin(world.getHost()).filter((fakeElement) =>
        fakeElement.className.startsWith(CLASS.rowPin)
    );
    assertEquals(pins, [], "a fight nothing has written down has no pin to press");
});

/** The protocol's own statement of the reader's side, with that side numbered after the other. */
Deno.test("a shelf row states the reader's side first, whatever the game numbers it", () => {
    const warrior = (id: number, team: number) => ({ id, name: `fighter ${id}`, team, lvl: 1 });
    const world = initRuntimeWorld(composeBattlePage());
    world.update({
        init: 1,
        myteam: 2,
        w: { 1: warrior(1, 1), 2: warrior(2, 2), 3: warrior(3, 2) },
    });
    openShelfScreen(world);
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.rowSize),
        ["2×1"],
        "the reader's two first",
    );
});

Deno.test("a fight read back off the shelf says where it was fought, not where the page is", () => {
    const hero: Record<string, unknown> = { x: 12, y: 34 };
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const map = { d: { name: "Mapa Testowa" } };
    const world = initRuntimeWorld({ Engine: { battle, map, hero: { d: hero } } });
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const again = reloadRuntimeWorld(world);
    assertEquals(
        getWholeTextsByClass(again.getHost(), CLASS.headerPlace),
        ["Mapa Testowa (12, 34)"],
        "the bar says the kept fight's place, with no fight going on to ask",
    );
});

Deno.test("the fight's line and its shelf row say who the reader was, and it outlives a reload", () => {
    const view = composeFightView(replayRecordedFight(lookupRecordedFight(HILDUR)));
    assertExists(view, "the recording is a fight");
    const reader = [...view.roster.byId.values()].find((combatant) =>
        combatant.side === view.readerSide
    );
    assertExists(reader, "with somebody on the reader's side");
    const world = initRuntimeWorld(composePlacedPage({ x: 12, y: 34, id: reader.id }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const said = readFightCard(world);
    assertEquals(readCard(world.getHost()).name, ["Mapa Testowa (12, 34)"], "where, whole");
    assertEquals(said.get(FIGHT_CARD_WORDS.world), WORLD, "on the world the page is on");
    const character = said.get(FIGHT_CARD_WORDS.character);
    assertEquals(character, reader.name, "as the combatant the hero's id keys");
    assert(said.has(FIGHT_CARD_WORDS.profession), "with their profession and level under it");
    assert(said.has(FIGHT_CARD_WORDS.when), "and when it opened");
    const again = reloadRuntimeWorld(world);
    assertEquals(
        readFightCard(again).get(FIGHT_CARD_WORDS.character),
        character,
        "a kept fight names the reader it was read with, with no fight going on to ask",
    );
    openShelfRowCard(again);
    const card = readCard(again.getHost());
    assertEquals(
        new Map(card.stated.map((statement) => [statement.label, statement.value])).get(
            FIGHT_CARD_WORDS.character,
        ),
        character,
        "and its row opens the same card",
    );
});

/** The card the fight's line opens, as label to value. */
function readFightCard(world: RuntimeWorld): Map<string, string> {
    const host = world.getHost();
    const line = getElementsWithin(host).find((fakeElement) =>
        fakeElement.className === CLASS.headerLine
    );
    assertExists(line, "the fight's line is drawn");
    pointAtElement(host, "pointermove", line, 20);
    return new Map(readCard(host).stated.map((statement) => [statement.label, statement.value]));
}

/** Points at the shelf's first row, which opens its card. */
function openShelfRowCard(world: RuntimeWorld): void {
    openShelfScreen(world);
    const row = getElementsWithin(getPanelWithin(world.getHost()))
        .find((fakeElement) => fakeElement.className.split(" ")[0] === CLASS.row);
    assertExists(row, "the shelf drew the fight");
    pointAtElement(world.getHost(), "pointermove", row, 120);
}

/** A blow from somebody the roster never seated, so the line counts one unplaced. */
Deno.test("a shelf row's card counts the unplaced the fight's line counts, live and kept", () => {
    const warrior = (id: number, team: number) => ({ id, name: `fighter ${id}`, team, lvl: 1 });
    const world = initRuntimeWorld(composeBattlePage());
    world.update({
        init: 1,
        myteam: 1,
        w: { 1: warrior(1, 1), 2: warrior(2, 2) },
        m: ["3=100.00;2=90.00;+dmgf=100"],
    });
    world.update({ endBattle: 1 });
    readFightCard(world);
    const counted = readCardCounts(world);
    assertEquals(counted, "1 vs 1 +1", "the line's card counts the one the roster never seated");
    openShelfRowCard(world);
    assertEquals(readCardCounts(world), counted, "and the live row's card counts them too");
    const again = reloadRuntimeWorld(world);
    openShelfRowCard(again);
    assertEquals(readCardCounts(again), counted, "as does the kept row's, after a reload");
});

/** The headcount the open card names, without how the fight went. */
function readCardCounts(world: RuntimeWorld): string | undefined {
    return readCard(world.getHost()).name[0]?.split(" · ")[0];
}

Deno.test("a shelf row's card counts nobody unplaced where the fight's line counts none", () => {
    const world = initRuntimeWorld(composeBattlePage());
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    readFightCard(world);
    const counted = readCardCounts(world);
    assertEquals(counted, "10 vs 1", "the line's card counts everybody seated, and nobody else");
    openShelfRowCard(world);
    assertEquals(readCardCounts(world), counted, "and so does the live row's card");
    const again = reloadRuntimeWorld(world);
    openShelfRowCard(again);
    assertEquals(readCardCounts(again), counted, "as does the kept row's, after a reload");
});

Deno.test("a page stating no hero leaves the card with no character, and says nothing of it", () => {
    const world = initRuntimeWorld(composePlacedPage());
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const said = readFightCard(world);
    assertEquals(said.has(FIGHT_CARD_WORDS.character), false, "no line for nobody");
    assertEquals(world.lines, [], "and no defect");
});

Deno.test("a panel reloaded after two fights stands on the newer of them", () => {
    const world = initRuntimeWorld(composeBattlePage());
    for (const path of [HILDUR, ANOTHER]) {
        for (const payload of readUpdates(path)) world.update(payload);
    }
    const newest = getRankingTexts(world.getHost());
    const again = reloadRuntimeWorld(world);
    assertEquals(getRankingTexts(again.getHost()), newest, "the fight fought last");
});

Deno.test("a region the document will not draw is said on the next frame, and names it", () => {
    const world = playRecordedFight();
    const document = world.ports.document;
    const createElement = document.createElement;
    document.createElement = () => {
        throw new RangeError("a document being torn down");
    };
    const taken = findByMark(world.getHost(), "data-screen", "damageTaken");
    assertExists(taken, "there is a screen to press");
    world.press(taken);
    document.createElement = createElement;
    const back = findByMark(world.getHost(), "data-screen", "damageDealt");
    assertExists(back, "and a screen to press after the document recovers");
    world.press(back);
    const said = getTextsByClass(world.getHost(), CLASS.defect);
    assert(said.length > 0, "the panel says a part of it was not drawn");
    assert(said.every((line) => line.startsWith(`${DEFECT_MARK}Panel nie narysował`)), "which");
});

Deno.test("a file asked for with no fight on screen is said, not written", () => {
    const world = initRuntimeWorld(composeBattlePage());
    world.runtime.onIntent({ kind: "save-file" });
    world.flush();
    assertEquals(world.saved, [], "no file of nothing");
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.file, null, 1)}`],
        "and the panel says it could not make one",
    );
});

Deno.test("a key under a pinned row opens whom it reached, and the way back is one rung", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const pinned = getRegion(host, CLASS.pinned);
    assertExists(pinned, "this fight pins a figure nobody was named for");
    const name = getElementsWithin(pinned).find((fakeElement) =>
        fakeElement.className === CLASS.rowName
    );
    assertExists(name, "and a row of it to open");
    world.press(name);
    const key = getElementsWithin(getPanelWithin(host)).find((fakeElement) => {
        if (fakeElement.className !== CLASS.rowName) return false;
        return fakeElement.attributes.get("data-kind") !== undefined;
    });
    assertExists(key, "the level names the keys its figure moved under");
    world.press(key);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, key.textContent, "opened by key");
    world.press(getRegion(host, CLASS.crumbBack) ?? host);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, PANEL_WORDS.withoutActor, "back");
});

/** A copy that stood down holds no panel, so an intent reaching it is somebody else's mistake. */
Deno.test("a copy that stood down answers an intent with nothing drawn and nothing kept", () => {
    const page = composeBattlePage();
    initRuntimeWorld(page);
    const second = initRuntimeWorld(page);
    second.runtime.onIntent({ kind: "fold", window: "meter" });
    second.flush();
    assertEquals(second.shown, [], "no panel goes up for it");
    assertEquals(second.held.get(STORE_KEY.meterFolded), undefined, "and nothing is written down");
});

Deno.test("each window goes back where the reader left it, and never where the other was", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        built.held.set(STORE_KEY.meterPosition, '{"left":40,"top":60}');
        built.held.set(STORE_KEY.helperPosition, '{"left":300,"top":400}');
        return {};
    });
    const styles = getElementsWithin(world.getHost()).map((fakeElement) => ({
        className: fakeElement.className.split(" ")[0],
        style: fakeElement.attributes.get("style") ?? "",
    }));
    const standing = styles.find((styled) => styled.className === CLASS.helper);
    assertStringIncludes(standing?.style ?? "", "left:300px", "the window beside the panel");
    const placed = styles.filter((styled) => styled.style.includes("left:40px"));
    assertStrictEquals(placed.length, 1, "and the panel, each at its own");
});

/** `AGENTS.md` E10: the frame is handed to the page, so a throw out of it is caught there. */
Deno.test("a frame that breaks is said on the panel at the next one, and not thrown", () => {
    const queue: (() => void)[] = [];
    let mounts = 0;
    const world = initRuntimeWorld(composeBattlePage(), (_, base) => ({
        frames: initBrowserFrames({
            requestAnimationFrame: (step) => queue.push(step),
            cancelAnimationFrame: () => {},
        }),
        mountPanel: (panel) => {
            mounts += 1;
            if (mounts === 1) throw new RangeError("a document torn down under the frame");
            return base.mountPanel(panel);
        },
    }));
    queue.shift()?.();
    assertEquals(world.shown, [], "the frame that broke put nothing up");
    const [opening] = readUpdates(HILDUR);
    world.update(opening);
    queue.shift()?.();
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.region, null, 1)}`],
        "the next frame says one was lost",
    );
});

Deno.test("a standing that will not replay costs the tooltips and the window, and says both", () => {
    const world = initRuntimeWorld(composeBattlePage(), undefined, TABLES_DATING_NOTHING);
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertStrictEquals(countRows(findList(world.getHost())), 11, "the panel draws the fight");
    assertEquals(
        [...world.lines].sort(),
        [PANEL_DEFECT_KIND.reading, PANEL_DEFECT_KIND.region],
        "while the tooltips and the window beside it each leave a mark",
    );
});

Deno.test("a tooltip the client will not take is said on the panel, and the fight is drawn", () => {
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        tooltip: { writeRows: () => new errors.Caught("gone") },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertStrictEquals(countRows(findList(world.getHost())), 11, "the panel draws the fight");
    assertEquals(world.lines, [PANEL_DEFECT_KIND.region], "and the tooltips are said, once");
});

Deno.test("a tooltip the client lets nothing onto is said on the panel, though nothing threw", () => {
    const heard: unknown[] = [];
    const world = initRuntimeWorld(composeBattlePage(), (world) => ({
        tooltip: { writeRows: () => ({ written: 3, refused: 1 }) },
        console: {
            writeBrandedLine: (kind, detail) => {
                world.lines.push(kind);
                heard.push(detail);
            },
        },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    assertStrictEquals(countRows(findList(world.getHost())), 11, "the panel draws the fight");
    assertEquals(world.lines, [PANEL_DEFECT_KIND.region], "and the refusal is said, once");
    assertInstanceOf(heard[0], MargonemEngineTooltipRefused, "as the refusal it is");
    assertStrictEquals(heard[0].refused, 1, "counting the fighters it cost");
    const quiet = initRuntimeWorld(composeBattlePage(), () => ({
        tooltip: { writeRows: () => ({ written: 3, refused: 0 }) },
    }));
    for (const payload of readUpdates(HILDUR)) quiet.update(payload);
    assertEquals(quiet.lines, [], "while blocks that all landed say nothing");
});

Deno.test("a kept fight opens at its own top, whatever place the live one was left at", () => {
    const world = initRuntimeWorld(composeBattlePage());
    for (const path of [HILDUR, ANOTHER]) {
        for (const payload of readUpdates(path)) world.update(payload);
    }
    const host = world.getHost();
    findList(host).scrollTop = 240;
    world.press(findKeptShelfRow(world));
    assertStrictEquals(findList(host).scrollTop, 0, "a fight nobody scrolled stands at its top");
});

/** The row of the fight before the one going on, found on the shelf screen it opens. */
function findKeptShelfRow(world: RuntimeWorld): FakeElement {
    openShelfScreen(world);
    const kept = getElementsWithin(getPanelWithin(world.getHost())).find((fakeElement) => {
        if (fakeElement.className.split(" ")[0] !== CLASS.row) return false;
        return fakeElement.attributes.get("data-fight") !== "live";
    });
    assertExists(kept, "the shelf holds the fight before this one");
    return kept;
}

Deno.test("a store that made room for the fight says so on the shelf", () => {
    const held = new Map([[STORE_KEY.fights as string, composeSmallShelf(1, false)]]);
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        initShelfStore: () => initStoreRefusingOnce(held),
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const said = readShelfAnswers(world);
    assert(said.some((answer) => answer.includes(STORE_MADE_ROOM_ANSWER)), "the older fight went");
});

/** A shelf of the smallest fights there are, kept from moments before any a test plays. */
function composeSmallShelf(count: number, isPinned: boolean): string {
    const fights = [];
    for (let fightNumber = 1; fightNumber <= count; fightNumber += 1) {
        const payloads = [{ init: 1, m: ["0;0;winner=Gracz 1"], endBattle: 1 }];
        fights.push({ openedAt: fightNumber, payloads, isPinned });
    }
    return JSON.stringify({ version: 3, fights });
}

/** A store that refuses once, as a quota does until the rotation has dropped a fight. */
function initStoreRefusingOnce(held: Map<string, string>): KeyValueStore {
    let refusals = 1;
    return initBrowserStore({
        getItem: (key) => held.get(key) ?? null,
        setItem: (key, stored) => {
            if (refusals > 0) {
                refusals -= 1;
                throw new DOMException("full", "QuotaExceededError");
            }
            held.set(key, stored);
        },
        removeItem: (key) => void held.delete(key),
    });
}

function readShelfAnswers(world: RuntimeWorld): string[] {
    openShelfScreen(world);
    return getTextsByClass(world.getHost(), CLASS.suspicion);
}

Deno.test("a store that will not take the fight says it was not saved", () => {
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        initShelfStore: () => initRefusingStore(),
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const said = readShelfAnswers(world);
    assert(said.some((answer) => answer.includes(STORE_REFUSED_ANSWER)), "the fight is not kept");
});

Deno.test("a pin the store will not write is said as a pin, and not as a fight lost", () => {
    const held = new Map<string, string>();
    let isRefusing = false;
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        initShelfStore: () =>
            initBrowserStore({
                getItem: (key) => held.get(key) ?? null,
                setItem: (key, stored) => {
                    if (isRefusing) throw new DOMException("full", "QuotaExceededError");
                    held.set(key, stored);
                },
                removeItem: (key) => void held.delete(key),
            }),
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    isRefusing = true;
    openShelfScreen(world);
    const pin = getElementsWithin(world.getHost()).find((fakeElement) =>
        fakeElement.className.startsWith(CLASS.rowPin)
    );
    assertExists(pin, "the fight on the shelf carries a pin");
    world.press(pin);
    const said = getTextsByClass(world.getHost(), CLASS.suspicion);
    assert(said.some((answer) => answer.includes(PIN_REFUSED_ANSWER)), "the pin did not go down");
    assert(!said.some((answer) => answer.includes(STORE_REFUSED_ANSWER)), "the fight still did");
});

Deno.test("a shelf of pins says the fight had nowhere to go", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        built.getShelf("local").set(STORE_KEY.fights, composeSmallShelf(KEPT_MAXIMUM, true));
        return {};
    });
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const said = readShelfAnswers(world);
    assert(said.some((answer) => answer.includes(EVERY_SLOT_PINNED_ANSWER)), "every slot is a pin");
});

/**
 * A kept fight on screen that leaves the shelf is no fight to stand on, and a row opened in it
 * would find the same person in the next: a party keeps its ids from one fight to the next.
 */
Deno.test("a fight on screen the rotation drops gives the screen back, with nothing open", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        const payloads = [{ init: 1, m: ["0;0;winner=Gracz 1"], endBattle: 1 }];
        const fights = [{ openedAt: 1, payloads: readUpdates(FIRST_OF_A_PAIR), isPinned: false }];
        for (let openedAt = 2; openedAt <= KEPT_MAXIMUM; openedAt += 1) {
            fights.push({ openedAt, payloads, isPinned: false });
        }
        built.getShelf("local").set(STORE_KEY.fights, JSON.stringify({ version: 3, fights }));
        return {};
    });
    const host = world.getHost();
    openShelfScreen(world);
    const oldest = findByMark(host, "data-fight", "1");
    assertExists(oldest, "the oldest fight kept is a row");
    world.press(oldest);
    const name = getElementsWithin(host).find((fakeElement) => {
        if (fakeElement.className !== CLASS.rowName) return false;
        const stated = fakeElement.attributes.get("data-row");
        if (stated === undefined) return false;
        return !stated.startsWith("-");
    });
    assertExists(name, "it has a player's row to open");
    world.press(name);
    assertExists(getRegion(host, CLASS.crumb), "which stands open");
    for (const payload of readUpdates(SECOND_OF_A_PAIR)) world.update(payload);
    const keptOpenedAts = readKeptFights(world.getShelf("local")).map((fight) => fight.openedAt);
    assert(!keptOpenedAts.includes(1), "the fight ending pushed the oldest off a full shelf");
    assertEquals(getRegion(host, CLASS.crumb), undefined, "and the panel left it, closed");
});

/** A store that made room on a move or a pin can drop the fight on screen as the rotation can. */
Deno.test("a fight on screen a store made room by gives the screen back, on a move", () => {
    const sessionHeld = new Map<string, string>();
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        built.getShelf("local").set(STORE_KEY.fights, composeSmallShelf(2, false));
        return {
            initShelfStore: (choice) =>
                choice === "session"
                    ? initStoreRefusingOnce(sessionHeld)
                    : initHeldStore(built.getShelf(choice)),
        };
    });
    chooseKeptFight(world, "1");
    openOptions(world);
    chooseStorage(world, "session");
    assertEquals(readKeptFights(sessionHeld).map((fight) => fight.openedAt), [2], "room was made");
    openShelfScreen(world);
    assertEquals(readChosenFights(world), ["2"], "by the fight on screen, so the newest stands");
});

function chooseKeptFight(world: RuntimeWorld, openedAt: string): void {
    openShelfScreen(world);
    const row = findByMark(world.getHost(), "data-fight", openedAt);
    assertExists(row, `the shelf draws the fight kept at ${openedAt}`);
    world.press(row);
}

/** The fights the shelf screen standing open marks as the one on screen. */
function readChosenFights(world: RuntimeWorld): (string | undefined)[] {
    return getElementsWithin(world.getHost())
        .filter((fakeElement) => fakeElement.className.includes(CLASS.rowChosen))
        .map((fakeElement) => fakeElement.attributes.get("data-fight"));
}

Deno.test("a fight on screen a store made room by gives the screen back, on a pin", () => {
    const held = new Map([[STORE_KEY.fights as string, composeSmallShelf(2, false)]]);
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        initShelfStore: () => initStoreRefusingOnce(held),
    }));
    chooseKeptFight(world, "1");
    openShelfScreen(world);
    const pin = findByMark(world.getHost(), "data-pin", "2");
    assertExists(pin, "the newer fight carries a pin");
    world.press(pin);
    assertEquals(readKeptFights(held).map((fight) => fight.openedAt), [2], "room was made");
    assertEquals(readChosenFights(world), ["2"], "by the fight on screen, so the newest stands");
});

/** A fight kept at nought is a moment like any other, so the live row's key is never one. */
Deno.test("a page whose clock will not say now draws its fight, and keeps and hands over none", () => {
    const world = initRuntimeWorld(composeBattlePage(), (built) => {
        const payloads = [{ init: 1, m: ["0;0;winner=Gracz 1"], endBattle: 1 }];
        const shelf = { version: 3, fights: [{ openedAt: 0, payloads, isPinned: false }] };
        built.getShelf("local").set(STORE_KEY.fights, JSON.stringify(shelf));
        const clock = { ...built.ports.clock, readNowMilliseconds: () => new errors.Caught("") };
        return { clock };
    });
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const host = world.getHost();
    assertStrictEquals(countRows(findList(host)), 11, "every one of the fight's combatants");
    const keptOpenedAts = readKeptFights(world.getShelf("local")).map((fight) => fight.openedAt);
    assertEquals(keptOpenedAts, [0], "and no row kept under no moment");
    openShelfRowCard(world);
    assertStrictEquals(countRows(getPanelWithin(host)), 2, "the shelf holds the fight going on");
    assertEquals(readCardCounts(world), "10 vs 1", "whose row opens its own card");
    openShelfScreen(world);
    pressSave(world);
    assertEquals(world.saved, [], "a file states when it was taken, and none is");
    assertEquals(world.lines, [PANEL_DEFECT_KIND.keeping, PANEL_DEFECT_KIND.file], "each said");
});

Deno.test("the helper folds on its own, and is kept folded apart from the meter", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const control = findByMark(host, "data-helper-fold");
    assertExists(control, "the window carries a fold of its own");
    world.press(control);
    assertEquals(world.held.get(STORE_KEY.helperFolded), "1", "written where a reload looks");
    assertEquals(world.held.get(STORE_KEY.meterFolded), undefined, "and the panel's left alone");
    const standing = getElementsWithin(host)
        .find((fakeElement) => fakeElement.className.split(" ")[0] === CLASS.helper);
    assertExists(standing, "the window stands beside the panel");
    assert(standing.className.split(" ").includes(CLASS.helperFolded), "folded to its bar");
    assert(countRows(getPanelWithin(host)) > 0, "while the panel goes on drawing the fight");
});

Deno.test("a file writer that throws costs the file, and the panel says so", () => {
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        file: {
            writeFile: () => {
                throw new RangeError("a sink broken under the press");
            },
        },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    pressSave(world);
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.file, null, 1)}`],
        "one line for the file",
    );
});

Deno.test("a window let go of is written down, and costs no frame", () => {
    let requested = 0;
    const world = initRuntimeWorld(composeBattlePage(), (_, base) => ({
        frames: {
            requestFrame: (step, onStepFailure) => {
                requested += 1;
                return base.frames.requestFrame(step, onStepFailure);
            },
        },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const before = requested;
    world.runtime.onIntent({ kind: "move", window: "meter", position: { left: 40, top: 60 } });
    assertStrictEquals(requested, before, "the panel already stands where it was let go");
});

Deno.test("a file the browser lets go of badly later is said at the next frame", () => {
    const late: ((failure: errors.Caught) => void)[] = [];
    const world = initRuntimeWorld(composeBattlePage(), () => ({
        file: {
            writeFile: (_name, _text, onLateFailure) => {
                late.push(onLateFailure);
                return undefined;
            },
        },
    }));
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    pressSave(world);
    assertEquals(getTextsByClass(world.getHost(), CLASS.defect), [], "the file went, so far");
    late[0]?.(new errors.Caught("a URL the page would not release"));
    openShelfScreen(world);
    assertEquals(
        getTextsByClass(world.getHost(), CLASS.defect),
        [`${DEFECT_MARK}${formatDefect(PANEL_DEFECT_KIND.file, null, 1)}`],
        "and what the browser said after is said on the panel",
    );
});

Deno.test("a change of screen keeps the person opened, and lets go of the pair", () => {
    const world = playRecordedFight();
    const host = world.getHost();
    const name = getRegion(host, CLASS.rowName);
    assertExists(name, "a row to open");
    world.press(name);
    const person = getRegion(host, CLASS.crumbHere)?.textContent;
    const otherName = getElementsWithin(getPanelWithin(host)).find((fakeElement) => {
        if (fakeElement.className !== CLASS.rowName) return false;
        return fakeElement.attributes.get("data-row") !== undefined;
    });
    assertExists(otherName, "somebody inside it to open");
    world.press(otherName);
    assertNotStrictEquals(getRegion(host, CLASS.crumbHere)?.textContent, person, "a pair opened");
    const taken = findByMark(host, "data-screen", "damageTaken");
    assertExists(taken, "another screen to reach for");
    world.press(taken);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, person, "the person, alone");
    world.press(getRegion(host, CLASS.crumbBack) ?? host);
    assertEquals(getRegion(host, CLASS.crumb), undefined, "so one way back closes the row");
});

Deno.test("a screen chosen while the shelf is up takes the panel off the shelf", () => {
    const world = playRecordedFight();
    openShelfScreen(world);
    world.runtime.onIntent({ kind: "metric", metric: "damageTaken" });
    world.flush();
    const host = world.getHost();
    assertEquals(getTextsByClass(host, CLASS.crumbHere), [], "the shelf gives way to the screen");
    assert(countRows(findList(host)) > 1, "which draws the fight's rows");
});

Deno.test("a fight that opens leaves a reader on a kept fight where they were", () => {
    const world = initRuntimeWorld(composeBattlePage());
    for (const path of [HILDUR, ANOTHER]) {
        for (const payload of readUpdates(path)) world.update(payload);
    }
    const host = world.getHost();
    world.press(findKeptShelfRow(world));
    const name = getRegion(host, CLASS.rowName);
    assertExists(name, "a row of the kept fight to open");
    world.press(name);
    const person = getRegion(host, CLASS.crumbHere)?.textContent;
    assertExists(person, "open");
    const [opening] = readUpdates(THIRD);
    world.update(opening);
    assertEquals(getRegion(host, CLASS.crumbHere)?.textContent, person, "and still open");
});

Deno.test("a kept fight's file says which client it was fought under, and where", () => {
    const world = initRuntimeWorld(composePlacedPage());
    for (const payload of readUpdates(HILDUR)) world.update(payload);
    const again = reloadRuntimeWorld(world);
    pressSave(again);
    const written = readSavedFile(again);
    assertEquals(written.gameBuild, MARGONEM_CLIENT_BUILD, "the build kept beside the fight");
    const report = written.report;
    assert(isRecord(report), "with the report beside the calls");
    assertEquals(report.place, { mapName: "Mapa Testowa", x: 12, y: 34 }, "and its place");
});

Deno.test("a file says which browser wrote it, in the browser's own words", () => {
    const world = playRecordedFight();
    pressSave(world);
    assertEquals(readSavedFile(world).userAgent, "a browser that said so", "as it said");
});
