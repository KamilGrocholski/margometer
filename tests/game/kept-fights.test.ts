/**
 * The shelf, over a store that answers, refuses, or holds something nobody wrote.
 *
 * What goes on the shelf is what the game said, so a fight read back off it decodes through the
 * same path a live one does — which the last test here holds it to.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { composeJsonWriting } from "@/libs/json-text.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import type { BrowserStore } from "@/src/game/browser-store.ts";
import {
    composeKeptRotation,
    getIsEverySlotPinned,
    type KeptFight,
    readKeptFights,
    writeKeptFights,
} from "@/src/game/kept-fights.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const KEY = "MargoMeter-fights";

function composeStore(refuses = false): BrowserStore {
    const held = new Map<string, string>();
    return {
        read: (key) => held.get(key) ?? null,
        write: (key, value) => {
            if (refuses) return false;
            held.set(key, value);
            return true;
        },
        remove: (key) => void held.delete(key),
    };
}

function composeFight(openedAt: number): KeptFight {
    return {
        openedAt,
        combatants: [{
            id: 1,
            name: "Gracz 1",
            side: 1,
            profession: "w",
            level: 40,
            healthMaximum: 745,
        }],
        payloads: [["1=100.00;0;heal=99"]],
        readerSide: 1,
        outcome: { wonNames: ["Gracz 1"], lostNames: ["Odyniec"], isDrawn: false },
        place: { mapName: "Mapa", x: 12, y: 34 },
        isPinned: false,
        messagesLost: 0,
        hasJoinedInProgress: false,
    };
}

Deno.test("what is written comes back as it went on", () => {
    const store = composeStore();
    assert(writeKeptFights(store, KEY, [composeFight(7)]), "the store took it");
    assertEquals(readKeptFights(store, KEY), [composeFight(7)], "and gives it back whole");
});

Deno.test("a store that will not have it says so, rather than throwing", () => {
    const refusing = composeStore(true);
    assertEquals(
        writeKeptFights(refusing, KEY, [composeFight(1)]),
        false,
        "a refusal is an answer",
    );
    assertEquals(readKeptFights(refusing, KEY), [], "and the shelf reads back empty");
});

Deno.test("a shelf nobody can read is dropped, never trusted into a figure", () => {
    const broken: BrowserStore = {
        read: () => "{ this is not json",
        write: () => true,
        remove: () => {},
    };
    assertEquals(readKeptFights(broken, KEY), [], "text that will not parse holds nothing");
    // The fight inside it reads back perfectly: it is the version that refuses it, and a sample
    // holding an empty shelf could not tell the two apart.
    const older: BrowserStore = {
        read: () => '{"version":0,"fights":[{"openedAt":1,"combatants":[],"payloads":[]}]}',
        write: () => true,
        remove: () => {},
    };
    assertEquals(readKeptFights(older, KEY), [], "and neither does a shelf of another version");
    const wrong: BrowserStore = {
        read: () => '{"version":1,"fights":[{"openedAt":"soon","combatants":[],"payloads":[]}]}',
        write: () => true,
        remove: () => {},
    };
    assertEquals(readKeptFights(wrong, KEY), [], "a fight stating a moment nobody wrote is gone");
});

Deno.test("one fight nobody can read costs that fight and not the shelf", () => {
    const half: BrowserStore = {
        read: () =>
            '{"version":2,"fights":[{"openedAt":1,"combatants":[],"payloads":[["0;0;txt=a"]]},' +
            '{"openedAt":2,"combatants":[],"payloads":"none"}]}',
        write: () => true,
        remove: () => {},
    };
    const kept = readKeptFights(half, KEY);
    assertEquals(kept.length, 1, "the one that reads back is kept");
    assertEquals(kept[0]?.openedAt, 1, "and it is the one that was whole");
});

Deno.test("the shelf holds its stated maximum, oldest dropped first", () => {
    const store = composeStore();
    const many: KeptFight[] = [];
    for (let one = 0; one < 25; one += 1) many.push(composeFight(one));
    assert(writeKeptFights(store, KEY, many), "the store took what it was handed");
    const kept = readKeptFights(store, KEY);
    assertEquals(kept.length, 20, "twenty of them, which is the bound");
    assertEquals(kept[0]?.openedAt, 5, "and the oldest five went, not the newest");
});

Deno.test("a pin outranks the rotation, and the oldest unpinned goes instead", () => {
    const store = composeStore();
    const many: KeptFight[] = [];
    for (let one = 0; one < 22; one += 1) {
        // The two oldest, which is what the rotation would take first if a pin meant nothing.
        many.push({ ...composeFight(one), isPinned: one < 2 });
    }
    assert(writeKeptFights(store, KEY, many), "the store took what it was handed");
    const kept = readKeptFights(store, KEY);
    assertEquals(kept.length, 20, "twenty of them, which is the bound a pin does not raise");
    assertEquals(kept.map((one) => one.openedAt).slice(0, 3), [0, 1, 4], "the pinned two stayed");
    assertEquals(
        kept.filter((one) => one.isPinned).length,
        2,
        "and a pin survives being written down and read back",
    );
});

Deno.test("a shelf with every slot pinned refuses the newest rather than dropping one", () => {
    const full: KeptFight[] = [];
    for (let one = 0; one < 20; one += 1) full.push({ ...composeFight(one), isPinned: true });
    assertEquals(getIsEverySlotPinned(full), false, "twenty pinned fights are twenty fights");
    const over = [...full, composeFight(20)];
    assertEquals(getIsEverySlotPinned(over), true, "the twenty-first has nowhere to go");
    assertEquals(
        composeKeptRotation(over).map((one) => one.openedAt),
        full.map((one) => one.openedAt),
        "and what the reader pinned is what is still there",
    );
    // One unpinned among them and the rotation has something to take, which is the boundary the
    // sentence about every slot being pinned sits on.
    const [oldest, ...rest] = full;
    assert(oldest !== undefined, "there is an oldest");
    const nearly = [{ ...oldest, isPinned: false }, ...rest, composeFight(20)];
    assertEquals(getIsEverySlotPinned(nearly), false, "one unpinned slot is a slot");
    assertEquals(
        composeKeptRotation(nearly).map((one) => one.openedAt).includes(20),
        true,
        "and the newest arrives, in the place the one nobody pinned gave up",
    );
});

Deno.test("a shelf written before pins existed reads back as one with nothing pinned", () => {
    const older: BrowserStore = {
        read: () =>
            '{"version":2,"fights":[{"openedAt":1,"combatants":[],"payloads":[["0;0;txt=a"]]}]}',
        write: () => true,
        remove: () => {},
    };
    const kept = readKeptFights(older, KEY);
    assertEquals(kept.length, 1, "the fight reads back whole");
    assertEquals(kept[0]?.isPinned, false, "and nothing pinned is what nobody pinned");
});

Deno.test("a fight off the shelf decodes as the fight that went on it", () => {
    const [path] = getRecordingPaths();
    assert(path !== undefined, "a recording to keep");
    const store = composeStore();
    const combatants = getRecordedCombatants(path);
    const payloads = getRecordedPayloads(path);
    assert(
        writeKeptFights(store, KEY, [{
            openedAt: 1,
            combatants,
            payloads,
            place: null,
            readerSide: null,
            outcome: null,
            isPinned: false,
            messagesLost: 0,
            hasJoinedInProgress: false,
        }]),
        "kept",
    );
    const kept = readKeptFights(store, KEY)[0];
    assert(kept !== undefined, "and read back");
    const roster = composeCombatantRoster(kept.combatants);
    let events = 0;
    for (const payload of kept.payloads) events += decodeFightMessages(payload, roster).length;
    let live = 0;
    for (const payload of payloads) {
        live += decodeFightMessages(payload, composeCombatantRoster(combatants)).length;
    }
    assertEquals(events, live, "the same fight, read by the code that is running now");
});

Deno.test("a fight keeps where it was fought, and reads back without it", () => {
    const store = composeStore();
    assert(writeKeptFights(store, KEY, [composeFight(1)]), "a fight with a place is kept");
    assertEquals(readKeptFights(store, KEY)[0]?.place, { mapName: "Mapa", x: 12, y: 34 }, "whole");

    // A fight is worth keeping without a place: the three fields fail apart, as they do when
    // they are read off the client, and a fight is not dropped for missing one.
    assert(
        writeKeptFights(store, KEY, [{
            ...composeFight(2),
            place: { mapName: "Mapa", x: 1, y: 2 },
        }]),
        "a place is written as it stands",
    );
    const partial = composeJsonWriting({
        version: 2,
        fights: [{ openedAt: 3, combatants: [], payloads: [], place: { mapName: "Mapa" } }],
    });
    assert(partial.isOk, "a shelf missing two fields of a place is text");
    store.write(KEY, partial.text);
    assertEquals(
        readKeptFights(store, KEY)[0]?.place,
        { mapName: "Mapa", x: null, y: null },
        "what was said is kept and what was not is nobody's",
    );
    const none = composeJsonWriting({
        version: 2,
        fights: [{ openedAt: 4, combatants: [], payloads: [] }],
    });
    assert(none.isOk, "a shelf that states no place at all is text too");
    store.write(KEY, none.text);
    assertEquals(readKeptFights(store, KEY).length, 1, "a fight with no place at all still reads");
    assertEquals(
        readKeptFights(store, KEY)[0]?.place,
        null,
        "as a fight fought nobody knows where",
    );
});

/**
 * A shelf written by another version is dropped whole rather than read in halves.
 *
 * That is this store's whole migration, and it is what the protected contract asks for: a stored
 * value whose meaning changes needs a new key or a migration, and a fight kept before the shelf
 * learned the seat and the outcome would draw a row that says nothing about how it went.
 */
Deno.test("a shelf of another version is dropped, and the reader is left with none", () => {
    const older = composeJsonWriting({
        version: 1,
        fights: [{ openedAt: 1, combatants: [], payloads: [["0;0;txt=a"]] }],
    });
    assert(older.isOk, "a shelf of the version before this one is text");
    const store = composeStore();
    store.write(KEY, older.text);
    assertEquals(readKeptFights(store, KEY), [], "and nothing of it is read as this one");

    const kept = composeFight(7);
    assert(writeKeptFights(store, KEY, [kept]), "while a shelf this version wrote reads back");
    assertEquals(readKeptFights(store, KEY)[0]?.readerSide, kept.readerSide, "with the seat");
    assertEquals(readKeptFights(store, KEY)[0]?.outcome, kept.outcome, "and how it ended");
});

Deno.test("what a reading was short of goes on the shelf with the fight", () => {
    const store = composeStore();
    assert(
        writeKeptFights(store, KEY, [{
            ...composeFight(1),
            messagesLost: 4,
            hasJoinedInProgress: true,
        }]),
        "a fight that was short is written as it stands",
    );
    const read = readKeptFights(store, KEY)[0];
    assertEquals(read?.messagesLost, 4, "a count that was short comes back short");
    assertEquals(read?.hasJoinedInProgress, true, "and a fight joined in progress says so again");

    const older = composeJsonWriting({
        version: 2,
        fights: [{ openedAt: 5, combatants: [], payloads: [] }],
    });
    assert(older.isOk, "a shelf written before either existed is text");
    store.write(KEY, older.text);
    assertEquals(readKeptFights(store, KEY)[0]?.messagesLost, 0, "it states no count");
    assertEquals(
        readKeptFights(store, KEY)[0]?.hasJoinedInProgress,
        false,
        "and reads back as a fight watched whole, which is what it claimed by saying nothing",
    );
});

/**
 * A message the game sent as empty text is text, and a shelf carrying one used to vanish whole:
 * the reader folded "text saying nothing" into "not text", and a payload that would not read
 * back whole took its fight with it. The live path drops such a message and keeps the fight.
 */
Deno.test("a shelf carrying a message that says nothing keeps its fight", () => {
    const written = composeJsonWriting({
        version: 2,
        fights: [{ openedAt: 9, combatants: [], payloads: [["0;0;txt=a", ""]] }],
    });
    assert(written.isOk, "a shelf holding an empty message is text");
    const store = composeStore();
    store.write(KEY, written.text);

    const kept = readKeptFights(store, KEY);
    assertEquals(kept.length, 1, "the fight is still on the shelf");
    assertEquals(kept[0]?.payloads[0]?.length, 2, "with the payload read back whole");
    assertEquals(kept[0]?.payloads[0]?.[1], "", "the message saying nothing included");
});
