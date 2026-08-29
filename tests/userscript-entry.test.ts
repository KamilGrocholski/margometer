/**
 * Every layer at once, driven the way a browser drives them.
 *
 * A page carrying a battle object, a clock the test winds, a document small enough to read, and
 * the payloads of a real recording fed through the wrapped method one call at a time. What comes
 * out is what a reader would be looking at.
 */

import { assert, assertEquals } from "@std/assert";
import { startMargoMeter, type UserscriptEnvironment } from "@/src/userscript-entry.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import type { BrowserStore } from "@/src/game/browser-store.ts";
import { readKeptFights } from "@/src/game/kept-fights.ts";
import { getValueFromJsonText, isRecord } from "@/src/core/unknown-reading.ts";
import type { PanelElement } from "@/src/ui/panel-element.ts";
import type { Scheduler } from "@/src/game/engine-attachment.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
    getTextsByClass,
    pressElement,
} from "@/tests/fake-document.ts";
import {
    getRecordedEngineUpdates,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur.json";

function composeStillClock(): Scheduler {
    return { every: () => 1, cancel: () => {} };
}

function composeEnvironment(page: unknown) {
    const shown: PanelElement[] = [];
    const reported: string[] = [];
    const document = composeFakeDocument();
    const held = new Map<string, string>();
    const saved: { name: string; text: string }[] = [];
    const copied: string[] = [];
    let ticks = 0;
    const environment: UserscriptEnvironment = {
        page,
        document,
        schedule: composeStillClock(),
        mount: { show: (panel) => shown.push(panel) },
        report: (line) => reported.push(line),
        store: {
            read: (key) => held.get(key) ?? null,
            write: (key, value) => {
                held.set(key, value);
                return true;
            },
        },
        save: (name, text) => {
            saved.push({ name, text });
        },
        copy: (text) => {
            copied.push(text);
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
    return { environment, shown, reported, held, saved, copied };
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
    const rows = getElementsWithin(panel).filter((one) => one.className === "row");
    assertEquals(rows.length, 11, "the fight's eleven combatants, each with a row");
    const figures = rows.map((row) =>
        Number(row.children.find((one) => one.className === "row-figure")?.textContent)
    );
    assert(figures[0] !== undefined && figures[0] > 0, "the largest figure is drawn first");
    const names = rows.map((row) =>
        row.children.find((one) => one.className === "row-name")?.textContent
    );
    assert(names.every((name) => name !== undefined && name.length > 0), "every row is named");
    assert(new Set(names).size === names.length, "and each row is somebody of their own");
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
            .find((one) => one.className.includes("tab-current"))
            ?.attributes.get("data-screen");
    assertEquals(current(), "damageDealtApplied", "the panel opens on what the reader did");

    const taken = getElementsWithin(host).find((one) =>
        one.attributes.get("data-screen") === "damageTakenApplied"
    );
    assert(taken !== undefined, "there is a screen to press");
    pressElement(host, "pointerdown", taken);
    assertEquals(current(), "damageTakenApplied", "and pressing it takes the panel there");

    // A stale or foreign attribute naming a screen nobody has: the press reaches the entry and
    // the entry refuses it, which is a second refusal behind the one the panel already makes.
    const stray = environment.document.createElement("div") as FakeElement;
    stray.setAttribute("data-screen", "whateverTheGameCalls");
    pressElement(host, "pointerdown", stray);
    assertEquals(current(), "damageTakenApplied", "and a screen nobody has moves nothing either");
});

Deno.test("a fight that ends goes on the shelf, once, and comes back after a reload", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const first = composeEnvironment({ Engine: { battle } });
    startMargoMeter(first.environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);

    const shelf = first.held.get("MargoMeter-fights");
    assert(shelf !== undefined, "the fight was written where a reload will look for it");
    const kept = readKeptFights(first.environment.store as BrowserStore, "MargoMeter-fights");
    assertEquals(kept.length, 1, "one fight, however many calls said it was over");
    assertEquals(kept[0]?.combatants.length, 11, "with the cast the payloads stated");
    const messages = kept[0]?.payloads.flat() ?? [];
    assertEquals(messages.length, getRecordedPayloads(HILDUR).flat().length, "and every message");

    // What is kept is what the game said, so the fight reads the same off the shelf as it did
    // live: the figures are derived again by the code that is running.
    const roster = composeCombatantRoster(kept[0]?.combatants ?? []);
    const events = (kept[0]?.payloads ?? []).flatMap((one) =>
        decodeFightMessages([...one], roster)
    );
    const live = getRecordedPayloads(HILDUR).flatMap((one) => decodeFightMessages(one, roster));
    assertEquals(events.length, live.length, "the same fight, read again");
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
    const rows = () => getElementsWithin(host).filter((one) => one.className === "row").length;
    assert(rows() > 0, "the panel opens drawing the fight");
    assertEquals(first.held.get("MargoMeter-folded"), undefined, "and nothing is stored yet");

    const folding = control();
    assert(folding !== undefined, "there is a control to press");
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
        getElementsWithin(reopened).filter((one) => one.className === "row").length,
        0,
        "and the panel comes back folded, because that is what the reader left it",
    );

    const unfolding = getElementsWithin(reopened).find((one) => one.attributes.has("data-fold"));
    assert(unfolding !== undefined, "the bar still carries its control");
    pressElement(reopened, "pointerdown", unfolding);
    assert(
        getElementsWithin(reopened).filter((one) => one.className === "row").length > 0,
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
    assert(control !== undefined, "the bar carries the control that offers the fight");
    assertEquals(saved.length, 0, "which has saved nothing until it is pressed");
    pressElement(host, "pointerdown", control);
    assertEquals(saved.length, 1, "and one file when it is");

    const file = saved[0];
    assert(file !== undefined, "a file was handed to the browser");
    assertEquals(
        file.name,
        "margometer-tempest-2026-08-29T10-00-00-000Z.json",
        "named for the world and the moment it was asked for",
    );
    const written = getValueFromJsonText(file.text);
    assert(isRecord(written), "and it reads back as a recording");
    assertEquals(written.swiat, "tempest", "which says where it came from");
    assertEquals(written.build, "53XkBRxF", "and which client stated it");
    const entries = written.wpisy;
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
    assertEquals(written.pominietych, 0, "and the file says nothing was dropped");
    const first = entries[0];
    assert(isRecord(first), "an entry is a record");
    assertEquals(Object.keys(first), [
        "nr",
        "ladunek",
        "komunikaty",
        "wojownicyPrzed",
        "wojownicyPo",
    ], "in the shape every admitted recording carries");
    const before = first.wojownicyPrzed;
    const after = first.wojownicyPo;
    assert(Array.isArray(before) && Array.isArray(after), "with a snapshot on either side");
    assertEquals(
        [isRecord(before[0]) ? before[0].hp : null, isRecord(after[0]) ? after[0].hp : null],
        [{ max: 100, value: 100 }, { max: 100, value: 90 }],
        "and they differ, which is only true if each was copied rather than referenced",
    );
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
    assert(shelfTab !== undefined, "the bar carries the way onto the shelf");
    // A block body on purpose: the recursion guard reads a one-line named arrow as a function
    // whose body never closes, and then sees every later call to it as a call to itself.
    const rows = (): FakeElement[] => {
        return getElementsWithin(host).filter((one) => one.className === "row");
    };
    const figures = rows().length;
    assert(figures > 1, "the panel is on the figures, with a row for each of them");

    pressElement(host, "pointerdown", shelfTab);
    assertEquals(rows().length, 1, "and on the shelf, with the one fight it has kept");
    // The strip summarises whatever stands above it, and here that is the shelf: the live fight's
    // own total under a list of fights already fought is a figure with no heading beside it.
    const said = getElementsWithin(host).filter((one) => one.className === "summary-name");
    const counted = getElementsWithin(host).filter((one) => one.className === "summary-figure");
    assertEquals(said.map((one) => one.textContent), ["Walki"], "the strip says what it is over");
    assertEquals(counted.map((one) => one.textContent), ["1"], "and how many are on it");

    pressElement(host, "pointerdown", shelfTab);
    assertEquals(rows().length, figures, "pressed again, the shelf gives the figures back");
});

Deno.test("a browser that will not have the shelf is answered, not argued with", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown, reported } = composeEnvironment({ Engine: { battle } });
    const refusing: UserscriptEnvironment = {
        ...environment,
        store: {
            read: () => null,
            write: () => false,
        },
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
    // running to the end of the block it sits in (`ARCHITECTURE.md`, known gap 13). The name is
    // not `find` for the same reason — a reader over source cannot tell that call from this one.
    const getRegion = (className: string) => {
        return getElementsWithin(host).find((one) => one.className === className);
    };
    const rows = () => {
        return getElementsWithin(host).filter((one) => one.className === "row").length;
    };
    const rowsThatOpen = () => {
        return getElementsWithin(host).filter((one) => {
            return one.className === "row" && one.attributes.get("data-row") !== undefined;
        }).length;
    };
    const before = rows();
    assert(before > 0, "the screen has rows to open");
    assertEquals(rowsThatOpen(), before, "every one of them openable");

    const name = getRegion("row-name");
    assert(name !== undefined, "and a reader presses the name inside one");
    pressElement(host, "pointerdown", name);
    assert(getRegion("crumb") !== undefined, "which opens that row over the screen");
    assert(getRegion("drill-head") !== undefined, "saying whose row it is");
    // Never a row count: an opened row is cut twice, and the two cuts together can come to more
    // rows than the screen it stands over. What tells them apart is that a cut opens no further.
    assert(rows() > 0, "and drawing the parts of one figure rather than the whole screen");
    assertEquals(rowsThatOpen(), 0, "none of which opens any further");

    const crumb = getRegion("crumb");
    assert(crumb !== undefined, "the way back is there");
    pressElement(host, "pointerdown", crumb);
    assertEquals(getRegion("crumb"), undefined, "and pressing it closes the row");
    assertEquals(rows(), before, "leaving the screen as it was");

    const again = getRegion("row-name");
    assert(again !== undefined, "a row opens a second time");
    pressElement(host, "pointerdown", again);
    assert(getRegion("crumb") !== undefined, "as it did the first");
    const taken = getElementsWithin(host).find((one) =>
        one.attributes.get("data-screen") === "damageTakenApplied"
    );
    assert(taken !== undefined, "there is another screen to reach for");
    pressElement(host, "pointerdown", taken);
    assertEquals(
        getRegion("crumb"),
        undefined,
        "and leaving the screen closes the row it was opened on",
    );
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
    assertEquals(getTextsByClass(host, "place"), ["Mapa Testowa (12, 34)"], "the bar says where");

    // The fight this recording holds ends, so the shelf has a row to say it of.
    const tab = getElementsWithin(host).find((one) => one.attributes.has("data-shelf"));
    assert(tab !== undefined, "the bar carries the way onto the shelf");
    pressElement(host, "pointerdown", tab);
    // Inside the row, not anywhere on the panel: the bar says the same words over the shelf, so
    // a test that asks the whole panel passes with the row saying nothing.
    const row = getElementsWithin(host).find((one) => one.className === "row");
    assert(row !== undefined, "the shelf drew the fight that ended");
    assertEquals(getTextsByClass(row, "place"), [
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
    assertEquals(getTextsByClass(host, "place"), [], "nothing known is drawn as nothing at all");
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
    assertEquals(getTextsByClass(host, "place"), ["Mapa Testowa (12, 34)"], "the first fight");

    // Between the fights the hero walked, which is the only thing that moves a place. The
    // recording opens with the payload that opens a fight, so playing it again is a second one.
    hero.x = 7;
    hero.y = 8;
    for (const payload of updates) update(payload);
    assertEquals(getTextsByClass(host, "place"), ["Mapa Testowa (7, 8)"], "and the second, asked");
});
