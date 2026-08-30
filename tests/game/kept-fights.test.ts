/**
 * The shelf, over a store that answers, refuses, holds something nobody wrote, or runs out of room.
 *
 * What goes on the shelf is what the game delivered, so a fight read back off it goes through the
 * same chain a live one does — which the test naming both of them holds it to.
 */

import { assert, assertEquals } from "@std/assert";
import { composeJsonWriting } from "@/libs/json-text.ts";
import {
    addPayloadToSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import type { BrowserStore } from "@/src/game/browser-store.ts";
import {
    composeKeptRotation,
    getIsEverySlotPinned,
    type KeptFight,
    readKeptFights,
    writeKeptFights,
} from "@/src/game/kept-fights.ts";
import { getRecordedEngineUpdates, getRecordingPaths } from "@/tests/recorded-fight.ts";

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

/** A store with a ceiling on the text it takes, which is the shape a quota answers in. */
function composeStoreWithCeiling(lengthMaximum: number): BrowserStore {
    const held = new Map<string, string>();
    return {
        read: (key) => held.get(key) ?? null,
        write: (key, value) => {
            if (value.length > lengthMaximum) return false;
            held.set(key, value);
            return true;
        },
        remove: (key) => void held.delete(key),
    };
}

function composeFight(openedAt: number): KeptFight {
    return {
        openedAt,
        payloads: [{ init: 1, w: { 1: { id: 1, name: "Gracz 1", team: 1 } } }, {
            m: ["1=100.00;0;heal=99"],
        }],
        place: { mapName: "Mapa", x: 12, y: 34 },
        gameBuild: "1786441768914",
        isPinned: false,
    };
}

Deno.test("what is written comes back as it went on", () => {
    const store = composeStore();
    const writing = writeKeptFights(store, KEY, [composeFight(7)]);
    assert(writing.isOk, "the store took it");
    assertEquals(writing.fights.length, 1, "and took all of what it was handed");
    assertEquals(readKeptFights(store, KEY), [composeFight(7)], "and gives it back whole");
});

Deno.test("a store that will not have it says so, rather than throwing", () => {
    const refusing = composeStore(true);
    const writing = writeKeptFights(refusing, KEY, [composeFight(1)]);
    assertEquals(writing.isOk, false, "a refusal is an answer");
    assertEquals(writing.isOk ? "" : writing.error, "refused", "and names which answer it is");
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
        read: () => '{"version":2,"fights":[{"openedAt":1,"payloads":[{"init":1}]}]}',
        write: () => true,
        remove: () => {},
    };
    assertEquals(readKeptFights(older, KEY), [], "and neither does a shelf of another version");
    const wrong: BrowserStore = {
        read: () => '{"version":3,"fights":[{"openedAt":"soon","payloads":[{"init":1}]}]}',
        write: () => true,
        remove: () => {},
    };
    assertEquals(readKeptFights(wrong, KEY), [], "a fight stating a moment nobody wrote is gone");
});

/**
 * A payload nobody can read costs the whole fight, and it is the one place the shelf is stricter
 * than the reader of a recording: a gap in the middle decodes to figures that look like a fight.
 */
Deno.test("a fight is kept from one payload and dropped where it has none", () => {
    const none: BrowserStore = {
        read: () => '{"version":3,"fights":[{"openedAt":1,"payloads":[]}]}',
        write: () => true,
        remove: () => {},
    };
    assertEquals(readKeptFights(none, KEY), [], "a fight kept from nothing is not a fight");
    const one: BrowserStore = {
        read: () => '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1}]}]}',
        write: () => true,
        remove: () => {},
    };
    assertEquals(readKeptFights(one, KEY).length, 1, "and one payload is a fight");
    const holed: BrowserStore = {
        read: () => '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1},"gone"]}]}',
        write: () => true,
        remove: () => {},
    };
    assertEquals(readKeptFights(holed, KEY), [], "a payload nobody reads takes its fight with it");
});

Deno.test("one fight nobody can read costs that fight and not the shelf", () => {
    const half: BrowserStore = {
        read: () =>
            '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1}]},' +
            '{"openedAt":2,"payloads":"none"}]}',
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
    assert(writeKeptFights(store, KEY, many).isOk, "the store took what it was handed");
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
    assert(writeKeptFights(store, KEY, many).isOk, "the store took what it was handed");
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

/**
 * No quota is assumed, so a shelf that will not fit asks for less rather than holding a constant
 * chosen against a figure nobody measured. **ADR 0026.**
 */
Deno.test("a store with no room takes fewer fights, and says what it took", () => {
    const four = [0, 1, 2, 3].map((one) => composeFight(one));
    const whole = composeJsonWriting({ version: 3, fights: four });
    assert(whole.isOk, "four fights are text");
    const two = composeJsonWriting({ version: 3, fights: four.slice(2) });
    assert(two.isOk, "and so are the newest two of them");

    const store = composeStoreWithCeiling(two.text.length);
    const writing = writeKeptFights(store, KEY, four);
    assert(writing.isOk, "a shelf that fits at some size is written at that size");
    assertEquals(writing.fights.map((one) => one.openedAt), [2, 3], "the newest, which is which");
    assertEquals(
        readKeptFights(store, KEY).map((one) => one.openedAt),
        [2, 3],
        "and what a reload finds is what the answer said",
    );
});

Deno.test("a pin outranks the store's refusal as it outranks the rotation", () => {
    const four = [0, 1, 2, 3].map((one) => ({ ...composeFight(one), isPinned: one === 0 }));
    const room = composeJsonWriting({ version: 3, fights: [four[0], four[3]] });
    assert(room.isOk, "a pinned fight beside the newest is text");

    const store = composeStoreWithCeiling(room.text.length);
    const writing = writeKeptFights(store, KEY, four);
    assert(writing.isOk, "and it is what fits");
    assertEquals(writing.fights.map((one) => one.openedAt), [0, 3], "the pinned one stayed");
});

Deno.test("a store with room for nothing keeps nothing, and does not pretend otherwise", () => {
    const store = composeStoreWithCeiling(0);
    const writing = writeKeptFights(store, KEY, [composeFight(1)]);
    assertEquals(writing.isOk, false, "a shelf that fits at no size is not written");
    assertEquals(writing.isOk ? "" : writing.error, "refused", "and the store is why");
    assertEquals(readKeptFights(store, KEY), [], "so a reload finds nothing");
});

/**
 * The reason the shelf holds payloads at all: a fight off it is the fight that went on it, read
 * by whatever version is running. **ADR 0026.**
 */
Deno.test("a fight off the shelf reads as the fight that went on it, through one chain", () => {
    const [path] = getRecordingPaths();
    assert(path !== undefined, "a recording to keep");
    const payloads = getRecordedEngineUpdates(path);
    const store = composeStore();
    assert(
        writeKeptFights(store, KEY, [{
            openedAt: 1,
            payloads,
            place: null,
            gameBuild: null,
            isPinned: false,
        }]).isOk,
        "kept",
    );
    const kept = readKeptFights(store, KEY)[0];
    assert(kept !== undefined, "and read back");

    const offShelf = composeBattleSession();
    for (const payload of kept.payloads) addPayloadToSession(offShelf, payload);
    const live = composeBattleSession();
    for (const payload of payloads) addPayloadToSession(live, payload);

    const read = getFightFromSession(offShelf);
    const watched = getFightFromSession(live);
    assert(read !== null, "a fight off the shelf is a fight");
    assert(watched !== null, "and so is the one that was watched");
    assertEquals(read.payloads, payloads.length, "every call the game made went on and came back");
    assertEquals(read.events, watched.events, "the same events, by the code that is running now");
    assertEquals(read.roster.byId.size, watched.roster.byId.size, "and the same cast");
    assertEquals(read.readerSide, watched.readerSide, "the reader's own side included");
    assertEquals(read.messagesLost, watched.messagesLost, "and what nobody read is re-counted");
    assertEquals(read.hasJoinedInProgress, watched.hasJoinedInProgress, "as is walking into one");
    assert(watched.events.length > 0, "over a recording that decodes to something");
});

Deno.test("a fight keeps where it was fought, and reads back without it", () => {
    const store = composeStore();
    assert(writeKeptFights(store, KEY, [composeFight(1)]).isOk, "a fight with a place is kept");
    assertEquals(readKeptFights(store, KEY)[0]?.place, { mapName: "Mapa", x: 12, y: 34 }, "whole");

    // A fight is worth keeping without a place: the three fields fail apart, as they do when
    // they are read off the client, and a fight is not dropped for missing one.
    const partial = composeJsonWriting({
        version: 3,
        fights: [{ openedAt: 3, payloads: [{ init: 1 }], place: { mapName: "Mapa" } }],
    });
    assert(partial.isOk, "a shelf missing two fields of a place is text");
    store.write(KEY, partial.text);
    assertEquals(
        readKeptFights(store, KEY)[0]?.place,
        { mapName: "Mapa", x: null, y: null },
        "what was said is kept and what was not is nobody's",
    );
    const none = composeJsonWriting({
        version: 3,
        fights: [{ openedAt: 4, payloads: [{ init: 1 }] }],
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

/** Which client a fight was read off, so a fight re-read later says what it is re-reading. */
Deno.test("a fight keeps the build it was read off, and reads back without one", () => {
    const store = composeStore();
    assert(writeKeptFights(store, KEY, [composeFight(1)]).isOk, "a fight with a build is kept");
    assertEquals(readKeptFights(store, KEY)[0]?.gameBuild, "1786441768914", "as it was stated");
    const silent = composeJsonWriting({
        version: 3,
        fights: [{ openedAt: 2, payloads: [{ init: 1 }] }],
    });
    assert(silent.isOk, "a shelf whose page never said is text");
    store.write(KEY, silent.text);
    assertEquals(readKeptFights(store, KEY)[0]?.gameBuild, null, "and a build nobody said is none");
});

/**
 * A shelf written by another version is dropped whole rather than read in halves.
 *
 * That is this store's whole migration, and it is what the protected contract asks for: a stored
 * value whose meaning changes needs a new key or a migration, and version 2 held this repository's
 * reading of a fight where version 3 holds what the game sent.
 */
Deno.test("a shelf of another version is dropped, and the reader is left with none", () => {
    const older = composeJsonWriting({
        version: 2,
        fights: [{ openedAt: 1, combatants: [], payloads: [["0;0;txt=a"]] }],
    });
    assert(older.isOk, "a shelf of the version before this one is text");
    const store = composeStore();
    store.write(KEY, older.text);
    assertEquals(readKeptFights(store, KEY), [], "and nothing of it is read as this one");

    const kept = composeFight(7);
    assert(writeKeptFights(store, KEY, [kept]).isOk, "while a shelf this version wrote reads back");
    assertEquals(readKeptFights(store, KEY)[0]?.payloads.length, 2, "with the payloads it held");
});
