/**
 * Every layer at once, driven the way a browser drives them.
 *
 * A page carrying a battle object, a clock the test winds, a document small enough to read, and
 * the payloads of a real recording fed through the wrapped method one call at a time. What comes
 * out is what a reader would be looking at.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertNotStrictEquals,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import { BUILD_VERSION } from "@/src/build-version.ts";
import { startMargoMeter, type UserscriptEnvironment } from "@/src/userscript-entry.ts";
import {
    addPayloadToSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import type { BrowserStore } from "@/src/game/browser-store.ts";
import { readKeptFights } from "@/src/game/kept-fights.ts";
import { getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import type { PanelElement } from "@/src/ui/panel-element.ts";
import { PANEL_WORDS } from "@/src/ui/panel-words.ts";
import type { Scheduler } from "@/src/game/engine-attachment.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    pressElement,
} from "@/tests/fake-document.ts";
import { getRecordedEngineUpdates, getRecordingPaths } from "@/tests/recorded-fight.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";
/** Another fight, so a shelf and a session can hold different figures at the same moment. */
const ANOTHER = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";
/** A third, so two fights are on the shelf at once while a fourth is the one going on. */
const THIRD = "captures/2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none.json";
/**
 * Two fights of one party, so a row opened in the first is opened by an id the second states too:
 * ten combatants are shared between them, read 2026-08-31.
 */
const FIRST_OF_A_PAIR = "captures/2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none.json";
const SECOND_OF_A_PAIR = "captures/2026-08-15-tempest-grupa-vs-hildur-2-1786514810315-none.json";

function composeStillClock(): Scheduler {
    return { every: () => 1, cancel: () => {} };
}

/** A store over a map somebody else holds, so a test can look in the place it wrote to. */
function composeHeldStore(held: Map<string, string>): BrowserStore {
    return {
        read: (key) => held.get(key) ?? null,
        write: (key, value) => {
            held.set(key, value);
            return true;
        },
        remove: (key) => void held.delete(key),
    };
}

function composeEnvironment(page: unknown) {
    const shown: PanelElement[] = [];
    const reported: string[] = [];
    const document = composeFakeDocument();
    const held = new Map<string, string>();
    // Three stores, kept apart the way a browser keeps them: what a choice moves is only visible
    // where the place it moved from is a different map from the place it moved to.
    const shelves = new Map<string, Map<string, string>>();
    const getShelf = (choice: string): Map<string, string> => {
        const standing = shelves.get(choice) ?? new Map<string, string>();
        shelves.set(choice, standing);
        return standing;
    };
    const saved: { name: string; text: string }[] = [];
    let ticks = 0;
    const environment: UserscriptEnvironment = {
        page,
        document,
        schedule: composeStillClock(),
        mount: { show: (panel) => shown.push(panel) },
        // A window of a size, so a drag has something to be clamped against.
        readViewport: () => ({ width: 1280, height: 900 }),
        // A clock that answers the same moment every time, so a row's time is a fact of the test.
        readClock: () => ({ hour: 21, minute: 5 }),
        report: (line) => reported.push(line),
        store: composeHeldStore(held),
        composeShelfStore: (choice) => composeHeldStore(getShelf(choice)),
        save: (name, text) => {
            saved.push({ name, text });
        },
        readSurroundings: () => ({
            world: "tempest",
            gameBuild: "53XkBRxF",
            capturedAt: "2026-08-29T10:00:00.000Z",
            userAgent: "a browser that said so",
        }),
        now: () => {
            ticks += 1;
            return ticks;
        },
    };
    return { environment, shown, reported, held, shelves, getShelf, saved };
}

Deno.test("a recording played through the add-on ends on the panel a reader would see", () => {
    const battle: Record<string, unknown> = { updateData: () => "the engine's own answer" };
    const engineOwn = battle.updateData;
    const { environment, shown, reported } = composeEnvironment({ Engine: { battle } });
    const attachment = startMargoMeter(environment);
    assert(attachment.isAttached(), "the game was found and wrapped");
    const update = battle.updateData;
    assert(typeof update === "function", "and left a function behind it");

    for (const payload of getRecordedEngineUpdates(HILDUR)) {
        assertEquals(update(payload), "the engine's own answer", "the engine's value is untouched");
    }
    assertEquals(reported, [], "and nothing of ours failed along the way");
    // One panel, put on the page once and redrawn in place: the host outlives every payload, so
    // the listener on it does too.
    assertEquals(shown.length, 1, "one panel on the page, however many calls arrived");

    const panel = shown[0] as FakeElement;
    // Inside the list: what stands below it is the row for a figure nobody can be charged with,
    // which is a row of the same shape and not one of the fight's combatants.
    const list = getElementsWithin(panel).find((one) => one.className === "list");
    assertExists(list, "the panel drew its list");
    const rows = getElementsWithin(list).filter((one) => one.className.split(" ")[0] === "row");
    assertEquals(rows.length, 11, "the fight's eleven combatants, each with a row");
    // The panel spaces its thousands on a gap that does not break, so what a reader adds up is
    // read back with that gap taken out.
    const figures = rows.map((row) =>
        Number(
            (row.children.find((one) => one.className === "row-value figure")?.textContent ?? "")
                .split("\u00a0").join(""),
        )
    );
    assert(figures[0] !== undefined && figures[0] > 0, "the largest figure is drawn first");
    const names = rows.map((row) =>
        row.children.find((one) => one.className === "row-name")?.textContent
    );
    assert(names.every((name) => name !== undefined && name.length > 0), "every row is named");
    assertStrictEquals(new Set(names).size, names.length, "and each row is somebody of their own");
    for (const [at, figure] of figures.entries()) {
        if (at === 0) continue;
        const above = figures[at - 1];
        assert(above !== undefined && above >= figure, "and the rest fall away from it");
    }
    attachment.detach();
    assertEquals(battle.updateData, engineOwn, "and detaching puts the game's own method back");
});

Deno.test("a reader presses a screen and the panel goes there, and nowhere else", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;

    const current = () =>
        getElementsWithin(host)
            .find((one) => one.className.includes("selected"))
            ?.attributes.get("data-screen");
    assertEquals(current(), "damageDealtApplied", "the panel opens on what the reader did");

    const taken = getElementsWithin(host).find((one) =>
        one.attributes.get("data-screen") === "damageTakenApplied"
    );
    assertExists(taken, "there is a screen to press");
    pressElement(host, "pointerdown", taken);
    assertEquals(current(), "damageTakenApplied", "and pressing it takes the panel there");

    // A stale or foreign attribute naming a screen nobody has: the press reaches the entry and
    // the entry refuses it, which is a second refusal behind the one the panel already makes.
    const stray = environment.document.createElement("div") as FakeElement;
    stray.setAttribute("data-screen", "whateverTheGameCalls");
    pressElement(host, "pointerdown", stray);
    assertEquals(current(), "damageTakenApplied", "and a screen nobody has moves nothing either");
});

/**
 * A group against one boss is the corpus's commonest shape, and pressing the strip's other side
 * leaves the ranking drawing a single row. Nothing about that is exceptional, so nothing of ours
 * may fail on it — the press is what a reader does, and a dropped press is a panel that has
 * stopped answering.
 */
Deno.test("a reader presses the other side of a fight against one, and the panel answers", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown, reported } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;

    const chosen = () =>
        getElementsWithin(host)
            .find((one) => one.className.includes("selected") && one.attributes.has("data-side"))
            ?.attributes.get("data-side");
    assertEquals(chosen(), "everyone", "the panel opens on everybody in the fight");

    const opposing = getElementsWithin(host).find((one) =>
        one.attributes.get("data-side") === "opposing"
    );
    assertExists(opposing, "there is a side to press");
    pressElement(host, "pointerdown", opposing);
    assertEquals(chosen(), "opposing", "and pressing it takes the panel to the other side");
    assertEquals(reported, [], "and nothing of ours failed drawing one row against ten");

    // The other direction, which is the same shape seen from a solo fight's seat: one row on the
    // reader's own side against three of them.
    const reader = getElementsWithin(host).find((one) =>
        one.attributes.get("data-side") === "reader"
    );
    assertExists(reader, "and a side of the reader's own to press");
    pressElement(host, "pointerdown", reader);
    assertEquals(chosen(), "reader", "which the panel goes to as well");
    assertEquals(reported, [], "with nothing of ours failing there either");
});

Deno.test("a fight that ends goes on the shelf, once, and comes back after a reload", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const first = composeEnvironment({ Engine: { battle } });
    startMargoMeter(first.environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);

    const shelf = first.getShelf("local").get("MargoMeter-fights");
    assertExists(shelf, "the fight was written where a reload will look for it");
    const kept = readKeptFights(composeHeldStore(first.getShelf("local")), "MargoMeter-fights");
    assertEquals(kept.length, 1, "one fight, however many calls said it was over");
    assertEquals(kept[0]?.gameBuild, "53XkBRxF", "under the build the page stated it on");

    // What is kept is what the game delivered, so the fight reads the same off the shelf as it
    // did live: every figure is derived again by the code that is running. ADR 0026.
    const offShelf = composeBattleSession();
    for (const payload of kept[0]?.payloads ?? []) addPayloadToSession(offShelf, payload);
    const watched = composeBattleSession();
    for (const payload of getRecordedEngineUpdates(HILDUR)) addPayloadToSession(watched, payload);
    const read = getFightFromSession(offShelf);
    const live = getFightFromSession(watched);
    assertExists(read, "a fight off the shelf is a fight");
    assertExists(live, "and so is the one that was watched");
    assertEquals(read.roster.byId.size, 11, "with the cast the payloads stated");
    assertEquals(read.events, live.events, "the same fight, read again");
    assertEquals(read.readerSide, live.readerSide, "the reader's own side included");
});

/**
 * Two fights on the shelf, each row stating its own figures.
 *
 * A row's outcome and the sizes of its sides are derived through the live chain and held for as
 * long as the tab is (**ADR 0026**), so a memo that answered with the wrong fight's figures would
 * draw two rows that agree — which is what this reads back and refuses.
 */
Deno.test("each fight on the shelf says its own size, not the one before it", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    // Three fights, because the newest is drawn as the live row and never looked up: two of them
    // have to be on the shelf at once for two lookups to be told apart.
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    for (const payload of getRecordedEngineUpdates(ANOTHER)) update(payload);
    for (const payload of getRecordedEngineUpdates(THIRD)) update(payload);
    const host = shown[0] as FakeElement;

    const shelfTab = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assertExists(shelfTab, "the bar carries the way onto the shelf");
    pressElement(host, "pointerdown", shelfTab);

    const sizes = getTextsByClass(host, "row-size");
    assertEquals(sizes.length, 3, "three fights were fought, so the shelf draws three rows");
    assertEquals(sizes[0], "1×1", "the newest, which is the live row and the tracker's duel");
    assertEquals(sizes[1], "1×3", "the hunter against three of them");
    assertEquals(sizes[2], "10×1", "and the group against Hildur, oldest and still its own size");
});

Deno.test("a reader folds the panel away, and it is still folded when they come back", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const first = composeEnvironment({ Engine: { battle } });
    startMargoMeter(first.environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = first.shown[0] as FakeElement;

    const control = () => getElementsWithin(host).find((one) => one.attributes.has("data-fold"));
    const rows = () =>
        getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "row").length;
    assert(rows() > 0, "the panel opens drawing the fight");
    assertEquals(first.held.get("MargoMeter-folded"), undefined, "and nothing is stored yet");

    const folding = control();
    assertExists(folding, "there is a control to press");
    pressElement(host, "pointerdown", folding);
    assertEquals(rows(), 0, "pressing it folds the panel to its bar");
    assertEquals(first.held.get("MargoMeter-folded"), "1", "and says so where a reload will look");

    // The reader comes back: a second start over the store the first one left behind.
    const second = composeEnvironment({ Engine: { battle: { updateData: () => 1 } } });
    for (const [key, value] of first.held) second.held.set(key, value);
    startMargoMeter(second.environment);
    const again = second.environment.page as { Engine: { battle: { updateData: unknown } } };
    const next = again.Engine.battle.updateData;
    assert(typeof next === "function", "the second copy wrapped its own game");
    for (const payload of getRecordedEngineUpdates(HILDUR)) next(payload);
    const reopened = second.shown[0] as FakeElement;
    assertEquals(
        getElementsWithin(reopened).filter((one) => one.className.split(" ")[0] === "row").length,
        0,
        "and the panel comes back folded, because that is what the reader left it",
    );

    const unfolding = getElementsWithin(reopened).find((one) => one.attributes.has("data-fold"));
    assertExists(unfolding, "the bar still carries its control");
    pressElement(reopened, "pointerdown", unfolding);
    assert(
        getElementsWithin(reopened).filter((one) => one.className.split(" ")[0] === "row").length >
            0,
        "which brings the fight back",
    );
    assertEquals(second.held.get("MargoMeter-folded"), "", "and stores the unfolding too");
});

/**
 * A battle that carries what a running fight carries: a collection of combatants whose health the
 * game moves **in place** while its own call runs. That is what makes the two snapshots in a
 * recording the independent check `captures/AGENTS.md` calls them — and what a snapshot holding
 * the game's own reference would show identically on both sides of a call.
 */
function composeRecordingBattle(): Record<string, unknown> {
    const health: Record<string, unknown> = { max: 100, value: 100 };
    const warriors = {
        1: { id: 1, name: "somebody", team: 1, prof: "w", lvl: 60, hp: health },
    };
    return {
        warriorsList: warriors,
        updateData: () => {
            health.value = 90;
            return 1;
        },
    };
}

/** One recording played through and asked for, as the file the browser was handed. */
function composeSavedFight(): Record<string, unknown> {
    const battle = composeRecordingBattle();
    const { environment, shown, saved } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    const control = getElementsWithin(host).find((one) => one.attributes.has("data-save"));
    assertExists(control, "the bar carries the control that offers the fight");
    pressElement(host, "pointerdown", control);
    const reading = getJsonReading(saved[0]?.text ?? "");
    assert(reading.isOk, "and what it handed over reads back as JSON");
    assert(isRecord(reading.value), "and as a recording");
    return reading.value;
}

Deno.test("the fight is handed over counted as well as raw, and the two agree", () => {
    const written = composeSavedFight();
    const entries = written.calls;
    assert(Array.isArray(entries), "the calls the game made are in the file");
    // What a reader hands over answers both "what did the game say" and "what did this make of
    // it", which is why the counted half travels with the raw one (ADR 0027).
    const report = written.report;
    assert(isRecord(report), "and the figures the panel drew from those calls stand beside them");
    assertEquals(report.payloads, entries.length, "built from every call the file carries");
    assertEquals(report.isOver, true, "of a fight this one saw the end of");
    const counted = report.combatants;
    assert(isRecord(counted), "with a row for each combatant the aggregate counted");
    assert(Object.keys(counted).length > 0, "and this fight had a cast");
    const totals = report.totals;
    assert(isRecord(totals), "and the fight's own totals beside them");
    assertEquals(
        totals.damageDealtApplied,
        Object.values(counted).reduce(
            (sum: number, row) =>
                sum +
                (isRecord(row) && typeof row.damageDealtApplied === "number"
                    ? row.damageDealtApplied
                    : 0),
            0,
        ),
        "which come to what the rows under them come to",
    );
});

Deno.test("a reader asks for the fight, and gets the recording the intake tool reads", () => {
    const battle = composeRecordingBattle();
    const { environment, shown, saved, reported } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    assertEquals(reported, [], "and nothing of ours failed while it recorded");

    const host = shown[0] as FakeElement;
    const control = getElementsWithin(host).find((one) => one.attributes.has("data-save"));
    assertExists(control, "the bar carries the control that offers the fight");
    assertEquals(saved.length, 0, "which has saved nothing until it is pressed");
    pressElement(host, "pointerdown", control);
    assertEquals(saved.length, 1, "and one file when it is");

    const file = saved[0];
    assertExists(file, "a file was handed to the browser");
    assertEquals(
        file.name,
        `margometer-tempest-53XkBRxF-${BUILD_VERSION}-2026-08-29T10-00-00-000Z.json`,
        "named for the world, both builds and the moment it was asked for",
    );
    const reading = getJsonReading(file.text);
    assert(reading.isOk, "and it reads back as JSON");
    const written = reading.value;
    assert(isRecord(written), "and it reads back as a recording");
    assertEquals(written.world, "tempest", "which says where it came from");
    assertEquals(written.gameBuild, "53XkBRxF", "and which client stated it");
    const entries = written.calls;
    assert(Array.isArray(entries), "carrying the calls the game made");
    assert(entries.length > 0, "at least one of them");
    // Every one of them, and that is the right answer: a recording on disk is already thinned,
    // so each of its calls carries messages or a shape nobody had seen. What the thinning drops
    // is shown in `tests/game/fight-capture.test.ts`, on calls that repeat.
    assertEquals(
        entries.length,
        getRecordedEngineUpdates(HILDUR).length,
        "every call, because material already thinned has nothing left to drop",
    );
    assertEquals(written.droppedCalls, 0, "and the file says nothing was dropped");
    const first = entries[0];
    assert(isRecord(first), "an entry is a record");
    assertEquals(Object.keys(first), [
        "index",
        "payload",
        "messages",
        "combatantsBefore",
        "combatantsAfter",
    ], "in the shape every admitted recording carries");
    const before = first.combatantsBefore;
    const after = first.combatantsAfter;
    assert(Array.isArray(before) && Array.isArray(after), "with a snapshot on either side");
    assertEquals(
        [isRecord(before[0]) ? before[0].hp : null, isRecord(after[0]) ? after[0].hp : null],
        [{ max: 100, value: 100 }, { max: 100, value: 90 }],
        "and they differ, which is only true if each was copied rather than referenced",
    );
});

Deno.test("a fight nobody has read is handed over as one, rather than as a fight of zeroes", () => {
    const battle = composeRecordingBattle();
    const { environment, shown, saved } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const host = shown[0] as FakeElement;
    const control = getElementsWithin(host).find((one) => one.attributes.has("data-save"));
    assertExists(control, "the bar carries the control before a payload ever arrives");
    pressElement(host, "pointerdown", control);
    assertEquals(saved.length, 1, "and a press hands a file over even then");

    const reading = getJsonReading(saved[0]?.text ?? "");
    assert(reading.isOk, "which reads back as JSON");
    const written = reading.value;
    assert(isRecord(written), "and as a recording");
    assertEquals(written.report, null, "saying no fight was read, which is an answer");
    assertEquals(written.calls, [], "beside the calls it has, which are none");
});

Deno.test("the shelf has a screen of its own, and its control toggles", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;

    // On the bar, not on a strip: what it changes is which fight is being read, and the strips
    // are about which figure of the one fight.
    const shelfTab = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assertExists(shelfTab, "the bar carries the way onto the shelf");
    // A block body on purpose: the recursion guard reads a one-line named arrow as a function
    // whose body never closes, and then sees every later call to it as a call to itself.
    const rows = (): FakeElement[] => {
        return getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "row");
    };
    const figures = rows().length;
    assert(figures > 1, "the panel is on the figures, with a row for each of them");

    pressElement(host, "pointerdown", shelfTab);
    // One row: the fight this recording ended is both the live one and a kept one until the next
    // begins, and drawing it twice is one fight in two places. A shelf that hid the live one
    // would answer *which fight am I reading* with a list the answer is not on.
    assertEquals(rows().length, 1, "and on the shelf, where the two of them are one row");
    assertEquals(
        getTextsByClass(host, "row-time"),
        ["teraz"],
        "the one going on now saying so, in the live row's own wording",
    );
    // It is on the shelf as well, so there is something to pin — which is what the pin is for.
    const pins = getElementsWithin(host).filter((one) => one.className.startsWith("row-pin"));
    assertEquals(pins.length, 1, "and it carries a pin, being a fight the rotation can drop");
    // The shelf is not one of the fight's screens, so it says its own name and totals nothing:
    // the live fight's two sides under a list of fights already fought are figures about neither.
    assertEquals(getTextsByClass(host, "crumb-here"), ["Walki"], "the shelf says what it is");
    assertEquals(
        getElementsWithin(host).filter((one) => one.className === "MargoMeter-sides"),
        [],
        "and totals nothing, being a list of fights rather than a screen of one",
    );

    const back = getElementsWithin(host).find((one) => one.className === "crumb-back");
    assertExists(back, "the shelf carries the way back");
    pressElement(host, "pointerdown", back);
    assertEquals(rows().length, figures, "which gives the figures back");

    pressElement(host, "pointerdown", shelfTab);
    pressElement(host, "pointerdown", shelfTab);
    assertEquals(rows().length, figures, "and so does the control that put the shelf up");
});

Deno.test("a browser that will not have the shelf is answered, not argued with", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown, reported } = composeEnvironment({ Engine: { battle } });
    const refusing: UserscriptEnvironment = {
        ...environment,
        store: { read: () => null, write: () => false, remove: () => {} },
        composeShelfStore: () => ({ read: () => null, write: () => false, remove: () => {} }),
    };
    startMargoMeter(refusing);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    assertEquals(reported, [], "a refusal is not a failure of ours");
    assertEquals(shown.length, 1, "and the panel goes on drawing the fight it is watching");
});

Deno.test("a page with no game draws nothing and says why, once", () => {
    const { environment, shown, reported } = composeEnvironment({});
    const attachment = startMargoMeter(environment);
    assert(!attachment.isAttached(), "there was nothing to wrap");
    assertEquals(shown, [], "so nothing is drawn");
    assertEquals(reported, [], "and nothing is said until the looking gives up");
});

Deno.test("a second copy of the add-on stands down and never draws", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const page = { Engine: { battle } };
    const first = composeEnvironment(page);
    startMargoMeter(first.environment);
    const second = composeEnvironment(page);
    const attachment = startMargoMeter(second.environment);
    assert(!attachment.isAttached(), "the second copy stands down");
    assertEquals(second.reported.length, 1, "and says so once");
    const update = battle.updateData;
    assert(typeof update === "function", "the first copy still holds the game");
    update({ init: 1, m: [], mi: [] });
    assertEquals(second.shown, [], "while the second never puts a panel on the page");
    assertEquals(first.shown.length, 1, "and the first has the one panel there is");
});

Deno.test("every recording plays through without a word of failure", () => {
    for (const path of getRecordingPaths()) {
        const battle: Record<string, unknown> = { updateData: () => 1 };
        const { environment, shown, reported } = composeEnvironment({ Engine: { battle } });
        startMargoMeter(environment);
        const update = battle.updateData;
        assert(typeof update === "function", `${path}: the wrap went on`);
        for (const payload of getRecordedEngineUpdates(path)) update(payload);
        assertEquals(reported, [], `${path}: something of ours failed`);
        assert(shown.length > 0, `${path}: nothing was ever drawn`);
    }
});

Deno.test("a reader opens a row, and every way out of it leads back to the screen", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    // A block body, not a one-line arrow: the recursion guard reads a one-line named arrow as
    // running to the end of the block it sits in (`ARCHITECTURE.md`, known gap 12). The name is
    // not `find` for the same reason — a reader over source cannot tell that call from this one.
    const getRegion = (className: string) => {
        return getElementsWithin(host).find((one) => one.className === className);
    };
    const rows = () => {
        const list = getRegion("list");
        if (list === undefined) return 0;
        return getElementsWithin(list).filter((one) => one.className.split(" ")[0] === "row")
            .length;
    };
    const rowsThatOpen = () => {
        return getElementsWithin(host).filter((one) => {
            if (one.className.split(" ")[0] !== "row") return false;
            return one.attributes.get("data-row") !== undefined;
        }).length;
    };
    const before = rows();
    assert(before > 0, "the screen has rows to open");
    assertEquals(rowsThatOpen(), before, "every one of them openable");

    const name = getRegion("row-name");
    assertExists(name, "and a reader presses the name inside one");
    pressElement(host, "pointerdown", name);
    assertExists(getRegion("crumb"), "which opens that row over the screen");
    const person = getRegion("crumb-here")?.textContent;
    assertExists(person, "saying whose row it is");
    // Never a row count: an opened row is cut twice, and the two cuts together can come to more
    // rows than the screen it stands over. What tells them apart is that a cut opens no further.
    assert(rows() > 0, "and drawing the parts of one figure rather than the whole screen");
    // A person inside an opened row opens the pair of the two of them, which is the last rung.
    assert(rowsThatOpen() > 0, "some of which open onto what passed between the two of them");
    const other = getElementsWithin(host).find((one) => {
        if (one.className !== "row-name") return false;
        return one.attributes.get("data-row") !== undefined;
    });
    assertExists(other, "there is somebody to open");
    pressElement(host, "pointerdown", other);
    assertEquals(rowsThatOpen(), 0, "and on that rung nothing opens any further");
    const deep = getRegion("crumb-here");
    assertExists(deep, "which says whom it is about");
    pressElement(host, "pointerdown", getRegion("crumb-back") ?? host);
    assertEquals(
        getRegion("crumb-here")?.textContent,
        person,
        "and the way back off it goes to the person it was opened from, one rung at a time",
    );

    const crumb = getRegion("crumb-back");
    assertExists(crumb, "the way back is there");
    pressElement(host, "pointerdown", crumb);
    assertEquals(getRegion("crumb"), undefined, "and pressing it closes the row");
    assertEquals(rows(), before, "leaving the screen as it was");
    setScreenKept(host, getRegion, rows, before);
});

/**
 * What survives a change of screen, and what does not: the person a reader went into stays,
 * because the strips are how they ask the next question about them.
 */
function setScreenKept(
    host: FakeElement,
    getRegion: (className: string) => FakeElement | undefined,
    rows: () => number,
    before: number,
): void {
    assertEquals(rows(), before, "the screen is as it was before any of this");
    const again = getRegion("row-name");
    assertExists(again, "a row opens a second time");
    pressElement(host, "pointerdown", again);
    assertExists(getRegion("crumb"), "as it did the first");
    const opened = getRegion("crumb-here")?.textContent;
    assertExists(opened, "the row that stands open names somebody");
    const taken = getElementsWithin(host).find((one) =>
        one.attributes.get("data-screen") === "damageTakenApplied"
    );
    assertExists(taken, "there is another screen to reach for");
    pressElement(host, "pointerdown", taken);
    // The reader went into somebody and is reading that somebody: the strips are how they ask
    // the next question about them, so the person survives the question.
    assertExists(getRegion("crumb"), "the row stays open across a change of screen");
    assertEquals(getRegion("crumb-here")?.textContent, opened, "and it is the same person");

    const side = getElementsWithin(host).find((one) =>
        one.attributes.get("data-side") === "reader"
    );
    if (side !== undefined) {
        pressElement(host, "pointerdown", side);
        assertEquals(
            getRegion("crumb"),
            undefined,
            "narrowing to a side closes it, because that side may not hold them",
        );
    }
}

/**
 * The pinned row end to end: a press opens the level, a press inside it opens the level under
 * that, the way back is one rung at a time, and a change of screen closes the lot. The last is the
 * one that differs from a person's row — the four screens pin five different figures, so the row
 * of that name on the next screen is not this one. **ADR 0038**, **ADR 0039**.
 */
Deno.test("a reader opens a pinned row, and it does not follow them to the next screen", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    const getRegion = (className: string) => {
        return getElementsWithin(host).find((one) => one.className === className);
    };
    const pinnedName = () => {
        const block = getRegion("pinned-region");
        if (block === undefined) return undefined;
        return getElementsWithin(block).find((one) => one.className === "row-name");
    };
    const name = pinnedName();
    assertExists(name, "this fight pins a figure nobody was named for");
    assertEquals(name.textContent, PANEL_WORDS.withoutActor, "and says which end it left out");
    assertEquals(name.attributes.get("data-unnamed"), "actor", "marked by that end");

    pressElement(host, "pointerdown", name);
    assertEquals(
        getRegion("crumb-here")?.textContent,
        PANEL_WORDS.withoutActor,
        "pressing it opens the level, under the row's own name",
    );
    assertEquals(pinnedName(), undefined, "and the pinned row itself is off the screen");
    const named = getElementsWithin(host).filter((one) => one.className === "row-name");
    assert(named.length > 0, "the level names whoever the game did state at the other end");
    const person = named.find((one) => one.attributes.get("data-row") !== undefined);
    assertExists(person, "and each of them opens onto what their own share was dealt with");

    pressElement(host, "pointerdown", person);
    assertEquals(
        getRegion("crumb-here")?.textContent,
        person.textContent,
        "pressing one opens the level under it, under that person's own name",
    );
    const kinds = getElementsWithin(host).filter((one) => {
        return (one.attributes.get("data-tip") ?? "").startsWith("kind:");
    });
    assert(kinds.length > 0, "which is the keys their share of the figure moved under");
    pressElement(host, "pointerdown", getRegion("crumb-back") ?? host);
    assertEquals(
        getRegion("crumb-here")?.textContent,
        PANEL_WORDS.withoutActor,
        "and the way back out of it is one rung, onto the pinned row's own level",
    );

    pressElement(host, "pointerdown", getRegion("crumb-back") ?? host);
    assertEquals(getRegion("crumb"), undefined, "the way back closes it");
    assertExists(pinnedName(), "and puts the pinned row back under the ranking");

    const reopened = pinnedName();
    assertExists(reopened, "it opens a second time");
    pressElement(host, "pointerdown", reopened);
    assertExists(getRegion("crumb"), "as it did the first");
    const taken = getElementsWithin(host).find((one) =>
        one.attributes.get("data-screen") === "damageTakenApplied"
    );
    assertExists(taken, "there is another screen to reach for");
    pressElement(host, "pointerdown", taken);
    assertEquals(
        getRegion("crumb"),
        undefined,
        "a change of screen closes it: the row of that name there states another figure",
    );
});

/**
 * The other shape of the third level, and the way out of it. The two are entered by different
 * marks and left by the same control, so a way back that knew only about the pair walked a reader
 * to the ranking while the crumb beside it named the person they had opened.
 */
Deno.test("a reader opens what a figure was made of, and the way back is one rung", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    const getRegion = (className: string) => {
        return getElementsWithin(host).find((one) => one.className === className);
    };
    const name = getRegion("row-name");
    assertExists(name, "a reader presses a row of the ranking");
    pressElement(host, "pointerdown", name);
    const person = getRegion("crumb-here")?.textContent;
    assertExists(person, "which opens onto their figure, and says whose it is");

    const part = getElementsWithin(host).find((one) => {
        if (one.className !== "row-name") return false;
        return one.attributes.get("data-skill") !== undefined;
    });
    assertExists(part, "an announcement inside it is pressed by its own name");
    const named = part.textContent;
    pressElement(host, "pointerdown", part);
    assertEquals(
        getRegion("crumb-here")?.textContent,
        named,
        "and the level over the screen is that announcement",
    );
    assert(
        getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "row").length > 0,
        "listing whom it reached",
    );

    pressElement(host, "pointerdown", getRegion("crumb-back") ?? host);
    assertEquals(
        getRegion("crumb-here")?.textContent,
        person,
        "and the way back off it goes to the person it was opened from, one rung at a time",
    );
    pressElement(host, "pointerdown", getRegion("crumb-back") ?? host);
    assertEquals(getRegion("crumb"), undefined, "and the next press closes the row");
});

Deno.test("a row belonging to nobody in the fight opens nothing", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    const getRegion = (className: string) => {
        return getElementsWithin(host).find((one) => one.className === className);
    };

    // A stale or foreign attribute where a row's would be: the press reaches the entry, and what
    // the entry cannot place it refuses rather than opening an empty row over the screen.
    const stray = environment.document.createElement("div") as FakeElement;
    stray.setAttribute("data-row", "whoeverTheGameCalls");
    pressElement(host, "pointerdown", stray);
    assertEquals(getRegion("crumb"), undefined, "a row that is not a number opens nothing");
    const absent = environment.document.createElement("div") as FakeElement;
    absent.setAttribute("data-row", "0");
    pressElement(host, "pointerdown", absent);
    assertEquals(getRegion("crumb"), undefined, "and neither does one nobody in the fight holds");
});

Deno.test("the place a fight is fought reaches the bar, and goes on the shelf with it", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    // The client's own state, in the spelling `engine-place.ts` states it was read in.
    const page = {
        Engine: { battle, map: { d: { name: "Mapa Testowa" } }, hero: { d: { x: 12, y: 34 } } },
    };
    const { environment, shown } = composeEnvironment(page);
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    assertEquals(
        getTextsByClass(host, "header-place"),
        ["Mapa Testowa (12, 34)"],
        "the bar says where",
    );

    // The fight this recording holds ends, so the shelf has a row to say it of.
    const tab = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assertExists(tab, "the bar carries the way onto the shelf");
    pressElement(host, "pointerdown", tab);
    // Inside the row, not anywhere on the panel: the bar says the same words over the shelf, so
    // a test that asks the whole panel passes with the row saying nothing.
    const row = getElementsWithin(host).find((one) => one.className.split(" ")[0] === "row");
    assertExists(row, "the shelf drew the fight that ended");
    assertEquals(getTextsByClass(row, "row-name"), [
        "Mapa Testowa (12, 34)",
    ], "and the row kept on the shelf says where it was fought");
});

Deno.test("a client that says nothing about the place leaves the bar saying nothing", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    assertEquals(
        getTextsByClass(host, "header-place"),
        [],
        "nothing known is drawn as nothing at all",
    );
});

Deno.test("a second fight is asked where it is, not told where the one before it was", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const hero: Record<string, unknown> = { x: 12, y: 34 };
    const page = { Engine: { battle, map: { d: { name: "Mapa Testowa" } }, hero: { d: hero } } };
    const { environment, shown } = composeEnvironment(page);
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    const updates = getRecordedEngineUpdates(HILDUR);
    for (const payload of updates) update(payload);
    const host = shown[0] as FakeElement;
    assertEquals(
        getTextsByClass(host, "header-place"),
        ["Mapa Testowa (12, 34)"],
        "the first fight",
    );

    // Between the fights the hero walked, which is the only thing that moves a place. The
    // recording opens with the payload that opens a fight, so playing it again is a second one.
    hero.x = 7;
    hero.y = 8;
    for (const payload of updates) update(payload);
    assertEquals(
        getTextsByClass(host, "header-place"),
        ["Mapa Testowa (7, 8)"],
        "and the second, asked",
    );
});

Deno.test("a panel goes up when the reading starts, saying there has been no fight yet", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    // Before any payload: the wrap is on, so the panel is on the page. A page that draws nothing
    // until a fight arrives cannot be told from an add-on that died on the way to it.
    assertEquals(shown.length, 1, "one panel, put up the moment the reading started");
    const host = shown[0] as FakeElement;
    assertEquals(
        getTextsByClass(host, "empty"),
        [PANEL_WORDS.noFightYet],
        "saying what it is waiting for, in the reader's words",
    );
    assertEquals(getElementsWithin(host).filter((one) => one.className === "tabs"), [], "no tabs");

    const update = battle.updateData;
    assert(typeof update === "function", "the wrap left a function behind it");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    assertEquals(shown.length, 1, "the same panel is still the one on the page");
    const list = getElementsWithin(host).find((one) => one.className === "list");
    assertExists(list, "which now draws the fight");
    assert(
        getElementsWithin(list).some((one) => one.className.split(" ")[0] === "row"),
        "with a row for somebody in it, rather than the sentence it opened on",
    );
});

/**
 * A page reloaded between fights, which is a page with a shelf and no session.
 *
 * Answering *no fight yet* there put both the fights and the strip saying where they are kept
 * behind a control that redrew the waiting screen on every press.
 */
Deno.test("a panel reloaded between fights opens on the shelf rather than on nothing", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const first = composeEnvironment({ Engine: { battle } });
    startMargoMeter(first.environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    assert(first.getShelf("local").size > 0, "the fight was kept where a reload will look");

    // The reader comes back, and no fight has started yet: no payload reaches this copy at all.
    const second = composeEnvironment({ Engine: { battle: { updateData: () => 1 } } });
    for (const [key, value] of first.held) second.held.set(key, value);
    for (const [key, value] of first.getShelf("local")) second.getShelf("local").set(key, value);
    startMargoMeter(second.environment);
    const host = second.shown[0] as FakeElement;
    assertEquals(getTextsByClass(host, "empty"), [], "the panel does not say there has been none");
    const list = getElementsWithin(host).find((one) => one.className === "list");
    assertExists(list, "it draws the newest fight it kept");
    assert(
        getElementsWithin(list).some((one) => one.className.split(" ")[0] === "row"),
        "with that fight's own rows on it",
    );

    const control = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assertExists(control, "the bar carries the way onto the shelf");
    pressElement(host, "pointerdown", control);
    assertEquals(getTextsByClass(host, "row-size"), ["10×1"], "which opens onto the fight kept");
});

/**
 * The next fight starts while a row is open. A row is opened by the game's own combatant id and a
 * party keeps its ids, so a row left open finds somebody in the new fight and draws it opened on a
 * rung nobody asked for.
 */
Deno.test("a fight that opens puts the reader back on the ranking", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(FIRST_OF_A_PAIR)) update(payload);
    const host = shown[0] as FakeElement;
    // A block body, and not named `find`, for the reason the row test beside this one gives.
    const getRegion = (className: string) => {
        return getElementsWithin(host).find((one) => one.className === className);
    };
    // A player's row and not the first one on the list: the opponent in these two recordings is
    // an NPC, whose id the game states afresh for each fight (`-10000545`, then `-10000547`), so a
    // row opened on it closes by itself and would prove nothing about what carries over.
    const name = getElementsWithin(host).find((one) => {
        if (one.className !== "row-name") return false;
        const stated = one.attributes.get("data-row");
        if (stated === undefined) return false;
        return !stated.startsWith("-");
    });
    assertExists(name, "there is a player's row to open");
    pressElement(host, "pointerdown", name);
    assertExists(getRegion("crumb"), "and pressing it opens that row");
    const person = getRegion("crumb-here")?.textContent;
    assertExists(person, "the crumb says whose row it is");

    for (const payload of getRecordedEngineUpdates(SECOND_OF_A_PAIR)) update(payload);
    assertEquals(getRegion("crumb"), undefined, "the next fight is drawn from its own ranking");
    assert(
        getTextsByClass(host, "row-name").includes(person),
        "and that person is in it, so the id the row was opened by would have been found",
    );
});

Deno.test("a pin is the reader's own answer, and the shelf keeps it", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const kept = composeEnvironment({ Engine: { battle } });
    startMargoMeter(kept.environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = kept.shown[0] as FakeElement;
    const tab = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assertExists(tab, "the bar carries the way onto the shelf");
    pressElement(host, "pointerdown", tab);

    const pin = (): FakeElement => {
        const found = getElementsWithin(host).find((one) => one.className.startsWith("row-pin"));
        assertExists(found, "the fight on the shelf carries a pin");
        return found;
    };
    assertEquals(pin().textContent, "☆", "which starts saying nothing was pinned");
    const rows = (): number => {
        return getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "row")
            .length;
    };
    const before = rows();
    pressElement(host, "pointerdown", pin());
    assertEquals(pin().textContent, "★", "and says so after it is pressed");
    assertEquals(rows(), before, "a pin opens no fight, though it sits inside a row that does");
    assertEquals(
        readKeptFights(composeHeldStore(kept.getShelf("local")), "MargoMeter-fights")[0]?.isPinned,
        true,
        "and what the reader answered is where a reload will look for it",
    );

    pressElement(host, "pointerdown", pin());
    assertEquals(pin().textContent, "☆", "pressed again it is the other answer");
    assertEquals(
        readKeptFights(composeHeldStore(kept.getShelf("local")), "MargoMeter-fights")[0]?.isPinned,
        false,
        "which is written down as readily as the first",
    );
});

Deno.test("where the shelf is kept is the reader's answer, and the fights travel with it", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const held = composeEnvironment({ Engine: { battle } });
    startMargoMeter(held.environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = held.shown[0] as FakeElement;
    const tab = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assertExists(tab, "the bar carries the way onto the shelf");
    pressElement(host, "pointerdown", tab);
    assert(held.getShelf("local").has("MargoMeter-fights"), "the fight is where nothing was asked");

    const choose = (name: string): void => {
        const found = getElementsWithin(host).find((one) =>
            one.attributes.get("data-storage") === name
        );
        assertExists(found, `the strip offers ${name}`);
        pressElement(host, "pointerdown", found);
    };
    choose("session");
    assertEquals(
        readKeptFights(composeHeldStore(held.getShelf("session")), "MargoMeter-fights").length,
        1,
        "the fights are in the place the reader asked for",
    );
    assertEquals(
        held.getShelf("local").has("MargoMeter-fights"),
        false,
        "and the place they came from is emptied, which is what the answer asked for",
    );
    assertEquals(held.held.get("MargoMeter-storage"), "session", "the answer itself is kept");
    assertEquals(
        getElementsWithin(host).filter((one) => one.className === "tab selected").map((one) =>
            one.textContent
        ),
        ["do zamknięcia karty"],
        "and the strip marks it",
    );

    // The one that keeps nothing: a store of its own, which no browser reads back.
    choose("memory");
    assertEquals(
        held.getShelf("session").has("MargoMeter-fights"),
        false,
        "what was there is gone, because that is what the reader answered",
    );
    assertEquals(
        getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "row").length,
        1,
        "and the fight is still on screen, being the reader's own",
    );
});

Deno.test("a browser that will not keep the answer moves nothing, and says so", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown, getShelf } = composeEnvironment({ Engine: { battle } });
    const refusing: UserscriptEnvironment = {
        ...environment,
        store: { read: () => null, write: () => false, remove: () => {} },
    };
    startMargoMeter(refusing);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    const tab = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assertExists(tab, "the bar carries the way onto the shelf");
    pressElement(host, "pointerdown", tab);
    const chosen = getElementsWithin(host).find((one) =>
        one.attributes.get("data-storage") === "memory"
    );
    assertExists(chosen, "the strip offers the store that keeps nothing");
    pressElement(host, "pointerdown", chosen);

    assertEquals(
        getShelf("local").has("MargoMeter-fights"),
        true,
        "the fights stay where they are, because nothing may move on a refused answer",
    );
    assertEquals(
        getTextsByClass(host, "tab selected"),
        ["na stałe"],
        "and the strip goes on saying where they are",
    );
    assertEquals(
        getTextsByClass(host, "warning"),
        ["⚠ Przeglądarka nie zapisała tego wyboru — zostaje tak, jak było."],
        "which the shelf says outright rather than drawing a choice as taken",
    );
});

Deno.test("a fight off the shelf is read back, and the live one is a press away", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;
    const drawnFigures = (): string[] => {
        return getTextsByClass(host, "row-value figure");
    };
    const live = drawnFigures();
    assert(live.length > 0, "the panel is drawing the fight that just ended");

    const tab = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assertExists(tab, "the bar carries the way onto the shelf");
    pressElement(host, "pointerdown", tab);
    const rows = getElementsWithin(host).filter((one) => one.className.split(" ")[0] === "row");
    // One row for one fight: what just ended is the live one and a kept one at once, until the
    // next begins.
    assertEquals(rows.length, 1, "the shelf holds the fight that ended, as the one going on");

    // A second fight, so the live session and the shelf hold different figures: reading the kept
    // one off the session would pass on one fight and be wrong on the next.
    pressElement(host, "pointerdown", tab);
    const second = getRecordedEngineUpdates(ANOTHER);
    for (const payload of second) update(payload);
    const now = drawnFigures();
    assert(now.length > 0, "the panel is drawing the second fight");
    assertNotStrictEquals(now[0], live[0], "which states figures of its own");

    // What was kept is the cast and the messages, so what is drawn is decoded again rather than
    // restored from figures somebody stored.
    pressElement(host, "pointerdown", tab);
    // The row itself rather than every part of it: a press lands on the deepest element, so each
    // cell wears the row's mark too.
    const kepts = getElementsWithin(host).filter((one) => {
        if (one.className.split(" ")[0] !== "row") return false;
        return one.attributes.get("data-fight") !== "live";
    });
    // Newest first, and the newest is the live row: what is left is the fight before it.
    assertEquals(kepts.length, 1, "the shelf holds the fight that ended before this one");
    const held = kepts[kepts.length - 1];
    assertExists(held, "and the older of them is the one this test opened with");
    pressElement(host, "pointerdown", held);
    assertEquals(getTextsByClass(host, "crumb-here"), [], "the shelf gives way to the figures");
    assertEquals(drawnFigures(), live, "which are the first fight's, read back off what was kept");

    pressElement(host, "pointerdown", tab);
    const marked = getElementsWithin(host).filter((one) => one.className.includes("chosen"));
    assertEquals(marked.length, 1, "and the shelf marks which fight is on screen");
    assertEquals(
        marked[0]?.attributes.get("data-fight") === "live",
        false,
        "which is the kept one, not the fight going on",
    );
});

Deno.test("a fight the reader walked into says so on the panel", () => {
    const battle: Record<string, unknown> = { updateData: () => null };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    // Everything but the payload that opened the fight, which is what walking into one leaves.
    const [opening, ...rest] = getRecordedEngineUpdates(HILDUR);
    assertExists(opening, "the recording opens with a payload");
    for (const payload of rest) update(payload);
    const host = shown[0] as FakeElement;
    const getWarnings = () => {
        return getElementsWithin(host).find((one) => one.className === "warnings");
    };
    const drawn = getWarnings();
    assertExists(drawn, "the panel drew the region a doubt is said in");
    const said = getElementsWithin(drawn).map((one) => one.textContent ?? "").join(" ");
    assertStringIncludes(said, "w trakcie", "and says the reading began after the fight did");
});
