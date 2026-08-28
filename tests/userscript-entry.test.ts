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
import { type FightStore, readKeptFights } from "@/src/game/kept-fights.ts";
import type { PanelElement } from "@/src/ui/panel-element.ts";
import type { Scheduler } from "@/src/game/engine-attachment.ts";
import {
    composeFakeDocument,
    type FakeElement,
    getElementsWithin,
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
        now: () => {
            ticks += 1;
            return ticks;
        },
    };
    return { environment, shown, reported, held };
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
    const kept = readKeptFights(first.environment.store as FightStore, "MargoMeter-fights");
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

Deno.test("the shelf has a screen of its own, and its tab toggles", () => {
    const battle: Record<string, unknown> = { updateData: () => 1 };
    const { environment, shown } = composeEnvironment({ Engine: { battle } });
    startMargoMeter(environment);
    const update = battle.updateData;
    assert(typeof update === "function", "the wrap went on");
    for (const payload of getRecordedEngineUpdates(HILDUR)) update(payload);
    const host = shown[0] as FakeElement;

    const shelfTab = getElementsWithin(host).find((one) =>
        one.attributes.get("data-screen") === "fights"
    );
    assert(shelfTab !== undefined, "the strip carries the shelf beside the figures");
    // A block body on purpose: the recursion guard reads a one-line named arrow as a function
    // whose body never closes, and then sees every later call to it as a call to itself.
    const rows = (): FakeElement[] => {
        return getElementsWithin(host).filter((one) => one.className === "row");
    };
    const figures = rows().length;
    assert(figures > 1, "the panel is on the figures, with a row for each of them");

    pressElement(host, "pointerdown", shelfTab);
    assertEquals(rows().length, 1, "and on the shelf, with the one fight it has kept");

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
    const before = rows();
    assert(before > 0, "the screen has rows to open");

    const name = getRegion("row-name");
    assert(name !== undefined, "and a reader presses the name inside one");
    pressElement(host, "pointerdown", name);
    assert(getRegion("crumb") !== undefined, "which opens that row over the screen");
    assert(getRegion("drill-head") !== undefined, "saying whose row it is");
    assert(rows() < before, "and drawing the parts of one figure rather than the whole screen");

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
