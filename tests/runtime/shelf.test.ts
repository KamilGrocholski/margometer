/**
 * The shelf, over a store that answers, refuses, holds something nobody wrote, or runs out of room.
 *
 * What goes on the shelf is what the game delivered, so a fight read back off it goes through the
 * same chain a live one does, which the test naming both of them holds it to. The text written is
 * the one `develop` writes, byte for byte, so a shelf moves between the two.
 */

import {
    assert,
    assertEquals,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { encodeJson } from "#/libs/json-text.ts";
import { err, ok } from "#/libs/result.ts";
import {
    initMemoryStore,
    initPageStore,
    type KeyValueStore,
    STORE_FAILURE,
    STORE_KEY,
} from "#/src/game/browser-store.ts";
import { getFightView } from "#/src/core/fight-session.ts";
import {
    keepFight,
    KEPT_MAXIMUM,
    type KeptFight,
    openShelf,
    pinFight,
    removeKeptFight,
    SHELF_FAILURE,
    type ShelfContents,
} from "#/src/runtime/shelf.ts";
import { readRecordedFights, replayRecordedFight } from "#/tests/recorded-fights.ts";

const EMPTY: ShelfContents = { fights: [] };

/** `develop`'s `writeKeptFights` of `composeFight(7)`, as it stood in a store on 2026-09-24. */
const DEVELOP_SHELF = '{"version":3,"fights":[{"openedAt":7,"payloads":[{"init":1,"w":{"1":' +
    '{"id":1,"name":"Gracz 1","team":1}}},{"m":["1=100.00;0;heal=99"]}],"place":{"mapName":' +
    '"Mapa","x":12,"y":34},"gameBuild":"1786441768914","isPinned":false}]}';

Deno.test("what is written comes back as it went on, in develop's own text", () => {
    const store = initMemoryStore();
    const kept = keepFight(store, EMPTY, composeFight(7));
    assertEquals(kept, ok({ contents: { fights: [composeFight(7)] }, droppedOpenedAt: [] }), "all");
    assertEquals(store.read(STORE_KEY.fights), ok(DEVELOP_SHELF), "the text develop writes");
    assertEquals(openShelf(store), ok({ fights: [composeFight(7)] }), "and gives it back whole");
    const fromDevelop = composeStoreHolding(DEVELOP_SHELF);
    assertEquals(openShelf(fromDevelop), ok({ fights: [composeFight(7)] }), "a develop shelf too");
});

function composeFight(openedAt: number, isPinned = false): KeptFight {
    return {
        openedAt,
        payloads: [{ init: 1, w: { 1: { id: 1, name: "Gracz 1", team: 1 } } }, {
            m: ["1=100.00;0;heal=99"],
        }],
        place: { mapName: "Mapa", x: 12, y: 34 },
        gameBuild: "1786441768914",
        isPinned,
    };
}

function composeStoreHolding(text: string): KeyValueStore {
    const store = initMemoryStore();
    store.write(STORE_KEY.fights, text);
    return store;
}

Deno.test("a store that will not have it says so, rather than throwing", () => {
    const refusing = composeStoreWithCeiling(0);
    const kept = keepFight(refusing, EMPTY, composeFight(1));
    const refused = err({ kind: SHELF_FAILURE.refusedAfterRotation, attempts: 2 });
    assertEquals(kept, refused, "room for nothing keeps nothing, not even an empty shelf");
    assertEquals(openShelf(refusing), ok(EMPTY), "and the shelf reads back empty");
    const absent = initPageStore(null);
    const unavailable = err({ kind: STORE_FAILURE.unavailable });
    assertEquals(keepFight(absent, EMPTY, composeFight(1)), unavailable, "no store is an answer");
    assertEquals(openShelf(absent), unavailable, "on reading as on writing");
});

/** A store with a ceiling on the text it takes, which is the shape a quota answers in. */
function composeStoreWithCeiling(lengthMaximum: number): KeyValueStore {
    const held = new Map<string, string>();
    return initPageStore({
        getItem: (key) => held.get(key) ?? null,
        setItem: (key, value) => {
            if (value.length > lengthMaximum) throw new DOMException("full", "QuotaExceededError");
            held.set(key, value);
        },
        removeItem: (key) => void held.delete(key),
    });
}

Deno.test("a shelf nobody can read is refused, never trusted into a figure", () => {
    const broken = composeStoreHolding("{ this is not json");
    assertEquals(openShelf(broken), err({ kind: SHELF_FAILURE.unreadable }), "no parse, no shelf");
    const listed = composeStoreHolding("[1,2]");
    assertEquals(openShelf(listed), err({ kind: SHELF_FAILURE.unreadable }), "a list is no shelf");
    // The fight inside reads back perfectly: it is the version that refuses it, and a sample
    // holding an empty shelf could not tell the two apart.
    const older = composeStoreHolding(
        '{"version":2,"fights":[{"openedAt":1,"payloads":[{"init":1}]}]}',
    );
    const version = err({ kind: SHELF_FAILURE.versionUnknown, version: 2 });
    assertEquals(openShelf(older), version, "a shelf of another version, naming which");
    const unstated = composeStoreHolding('{"fights":[]}');
    const none = err({ kind: SHELF_FAILURE.versionUnknown, version: null });
    assertEquals(openShelf(unstated), none, "and one stating none");
    const notListed = composeStoreHolding('{"version":3,"fights":"none"}');
    assertEquals(openShelf(notListed), err({ kind: SHELF_FAILURE.unreadable }), "fights, a list");
    assertEquals(openShelf(initMemoryStore()), ok(EMPTY), "while nothing stored is an empty shelf");
});

/**
 * A payload nobody can read costs the whole fight: a gap in the middle decodes to figures that
 * look like a fight.
 */
Deno.test("a fight is kept from one payload and dropped where it has none", () => {
    const one = '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1}]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(one)), [1], "one payload is a fight");
    const none = '{"version":3,"fights":[{"openedAt":1,"payloads":[]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(none)), [], "a fight kept from nothing is none");
    const holed = '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1},"gone"]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(holed)), [], "a payload nobody reads takes it");
});

function readOpenedAt(store: KeyValueStore): number[] {
    const opened = openShelf(store);
    assert(opened.ok, "the shelf reads back");
    return opened.value.fights.map((one) => one.openedAt);
}

Deno.test("one fight nobody can read costs that fight and not the shelf", () => {
    const half = '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1}]},' +
        '{"openedAt":2,"payloads":"none"},{"openedAt":"soon","payloads":[{"init":1}]},' +
        '{"openedAt":-1,"payloads":[{"init":1}]},{"openedAt":0,"payloads":[{"init":1}]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(half)), [1, 0], "the whole ones, zero included");
});

Deno.test("the shelf holds its stated maximum, oldest dropped first, and says which went", () => {
    const store = initMemoryStore();
    const shelf = keepAll(store, Array.from({ length: KEPT_MAXIMUM }, (_, at) => composeFight(at)));
    assertEquals(shelf.fights.length, KEPT_MAXIMUM, "twenty fit without dropping one");
    const next = keepFight(store, shelf, composeFight(KEPT_MAXIMUM));
    assert(next.ok, "the twenty-first is kept");
    assertEquals(next.value.droppedOpenedAt, [0], "and the oldest went, which the answer names");
    assertEquals(readOpenedAt(store)[0], 1, "as a reload finds");
    assertEquals(readOpenedAt(store).length, KEPT_MAXIMUM, "at the bound");
});

/** Every fight kept in turn onto one shelf, as the runtime keeps them. */
function keepAll(store: KeyValueStore, fights: readonly KeptFight[]): ShelfContents {
    let shelf = EMPTY;
    for (const fight of fights) {
        const kept = keepFight(store, shelf, fight);
        assert(kept.ok, `fight ${fight.openedAt} is kept`);
        shelf = kept.value.contents;
    }
    return shelf;
}

Deno.test("a pin outranks the rotation, and the oldest unpinned goes instead", () => {
    const store = initMemoryStore();
    const fights = Array.from({ length: KEPT_MAXIMUM }, (_, at) => composeFight(at, at < 2));
    const shelf = keepAll(store, fights);
    const next = keepFight(store, shelf, composeFight(KEPT_MAXIMUM));
    assert(next.ok, "the twenty-first is kept");
    assertEquals(next.value.droppedOpenedAt, [2], "the oldest nobody pinned went");
    assertEquals(readOpenedAt(store).slice(0, 3), [0, 1, 3], "the pinned two stayed");
    const opened = openShelf(store);
    assert(opened.ok, "the shelf reads back");
    assertEquals(opened.value.fights.filter((one) => one.isPinned).length, 2, "pins survive");
});

Deno.test("a shelf with every slot pinned refuses the newest rather than dropping one", () => {
    const store = initMemoryStore();
    const nearly = Array.from({ length: KEPT_MAXIMUM - 1 }, (_, at) => composeFight(at, true));
    let shelf = keepAll(store, nearly);
    const twentieth = keepFight(store, shelf, composeFight(KEPT_MAXIMUM - 1, true));
    assert(twentieth.ok, "nineteen pinned leave a slot, and a twentieth pinned fight takes it");
    shelf = twentieth.value.contents;
    const refused = keepFight(store, shelf, composeFight(KEPT_MAXIMUM));
    const pinned = err({ kind: SHELF_FAILURE.everySlotPinned, maximum: KEPT_MAXIMUM });
    assertEquals(refused, pinned, "the twenty-first has nowhere to go");
    assertEquals(readOpenedAt(store).length, KEPT_MAXIMUM, "and what the reader pinned is there");
    const released = pinFight(store, shelf, 0, false);
    assert(released.ok, "one slot unpinned");
    const arrives = keepFight(store, released.value.contents, composeFight(KEPT_MAXIMUM));
    assert(arrives.ok, "and the newest arrives");
    assertEquals(arrives.value.droppedOpenedAt, [0], "in the place the unpinned one gave up");
});

/** No quota is assumed, so a shelf that will not fit asks for less. */
Deno.test("a store with no room takes fewer fights, and says what it took", () => {
    const four = [0, 1, 2, 3].map((one) => composeFight(one));
    const two = encodeJson({ version: 3, fights: four.slice(2) }, 0);
    assert(two.ok, "the newest two of four are text");
    const store = composeStoreWithCeiling(two.value.length);
    const shelf = keepAll(store, four.slice(0, 3));
    const kept = keepFight(store, shelf, four[3] ?? composeFight(3));
    assert(kept.ok, "a shelf that fits at some size is written at that size");
    assertEquals(kept.value.contents.fights.map((one) => one.openedAt), [2, 3], "the newest");
    assertEquals(readOpenedAt(store), [2, 3], "and what a reload finds is what the answer said");
});

Deno.test("a pin outranks the store's refusal, and a shelf of pins too long is refused", () => {
    const four = [0, 1, 2, 3].map((one) => composeFight(one, one === 0));
    const room = encodeJson({ version: 3, fights: [four[0], four[3]] }, 0);
    assert(room.ok, "a pinned fight beside the newest is text");
    const store = composeStoreWithCeiling(room.value.length);
    const shelf = keepAll(store, four.slice(0, 3));
    const kept = keepFight(store, shelf, four[3] ?? composeFight(3));
    assert(kept.ok, "and it is what fits");
    assertEquals(kept.value.contents.fights.map((one) => one.openedAt), [0, 3], "pinned stayed");
    const both = [composeFight(0, true), composeFight(3, true)];
    const pinnedText = encodeJson({ version: 3, fights: both }, 0);
    assert(pinnedText.ok, "two pinned fights are text");
    const cramped = composeStoreWithCeiling(pinnedText.value.length - 1);
    const first = keepFight(cramped, EMPTY, composeFight(0, true));
    assert(first.ok, "one pinned fight fits");
    const pins = keepFight(cramped, first.value.contents, composeFight(3, true));
    assertEquals(
        pins,
        err({ kind: SHELF_FAILURE.refusedAfterRotation, attempts: 1 }),
        "only pins are left to offer, so the store's refusal stands",
    );
});

Deno.test("a fight is kept once, and a fight not kept is neither pinned nor removed", () => {
    const store = initMemoryStore();
    const shelf = keepAll(store, [composeFight(1)]);
    const again = keepFight(store, shelf, composeFight(1));
    assertEquals(again, err({ kind: SHELF_FAILURE.fightAlreadyKept, openedAt: 1 }), "one moment");
    const absent = err({ kind: SHELF_FAILURE.fightNotKept, openedAt: 2 });
    assertEquals(pinFight(store, shelf, 2, true), absent, "a pin on nobody's fight");
    assertEquals(removeKeptFight(store, shelf, 2), absent, "and a removal");
    const removed = removeKeptFight(store, shelf, 1);
    assertEquals(removed, ok({ contents: EMPTY, droppedOpenedAt: [] }), "the kept one goes");
    assertEquals(readOpenedAt(store), [], "and a reload finds it gone");
    assertThrows(
        () => keepFight(store, EMPTY, { ...composeFight(3), payloads: [] }),
        AssertionError,
        "a fight kept was kept from something",
    );
});

Deno.test("a fight keeps where it was fought and its build, and reads back without either", () => {
    const store = initMemoryStore();
    keepAll(store, [composeFight(1)]);
    const whole = openShelf(store);
    assert(whole.ok, "the shelf reads back");
    assertEquals(whole.value.fights[0]?.place, { mapName: "Mapa", x: 12, y: 34 }, "whole");
    assertStrictEquals(whole.value.fights[0]?.gameBuild, "1786441768914", "as it was stated");
    const partial = '{"version":3,"fights":[{"openedAt":3,"payloads":[{"init":1}],' +
        '"place":{"mapName":"Mapa"}}]}';
    const read = openShelf(composeStoreHolding(partial));
    assert(read.ok, "a fight with part of a place reads back");
    assertEquals(read.value.fights[0]?.place, { mapName: "Mapa", x: null, y: null }, "that part");
    assertStrictEquals(read.value.fights[0]?.gameBuild, null, "and a build nobody said is none");
    const yOnly = '{"version":3,"fights":[{"openedAt":4,"payloads":[{"init":1}],"place":{"y":7}}]}';
    const alone = openShelf(composeStoreHolding(yOnly));
    assert(alone.ok, "a place stating one number reads back");
    assertEquals(alone.value.fights[0]?.place, { mapName: null, x: null, y: 7 }, "as that one");
    const bare = '{"version":3,"fights":[{"openedAt":5,"payloads":[{"init":1}],"place":{}}]}';
    const nowhere = openShelf(composeStoreHolding(bare));
    assert(nowhere.ok, "a place stating nothing");
    assertStrictEquals(
        nowhere.value.fights[0]?.place,
        null,
        "is a fight fought nobody knows where",
    );
    assertStrictEquals(nowhere.value.fights[0]?.isPinned, false, "and nobody pinned it");
});

/** The reason the shelf holds payloads at all: a fight off it is the fight that went on it. */
Deno.test("a fight off the shelf reads as the fight that went on it, through one chain", () => {
    const [fight] = readRecordedFights();
    assert(fight !== undefined, "a recording to keep");
    const store = initMemoryStore();
    const payloads = [...fight.updates];
    const kept = keepFight(store, EMPTY, { ...composeFight(1), payloads, place: null });
    assert(kept.ok, "kept");
    const opened = openShelf(store);
    assert(opened.ok, "and read back");
    const offShelf = opened.value.fights[0];
    assert(offShelf !== undefined, "one fight");
    const read = getFightView(replayRecordedFight({ ...fight, updates: offShelf.payloads }));
    const watched = getFightView(replayRecordedFight(fight));
    assert(read !== null, "a fight off the shelf is a fight");
    assert(watched !== null, "and so is the one that was watched");
    assertEquals(read.payloadsApplied, payloads.length, "every call went on and came back");
    assertEquals(read.events, watched.events, "the same events, by the code that is running now");
    assertEquals(read.roster.byId.size, watched.roster.byId.size, "and the same cast");
    assertEquals(read.readerSide, watched.readerSide, "the reader's own side included");
    assertEquals(read.messagesLost, watched.messagesLost, "and what nobody read is re-counted");
    assert(watched.events.length > 0, "over a recording that decodes to something");
});

/**
 * A shelf holding more fights than one can is not one this version wrote, so it is refused whole
 * rather than cut to size: which twenty of them a reader meant is not a question the text answers.
 */
Deno.test("a shelf past its bound is unreadable, and one at its bound is read whole", () => {
    const listed = (count: number) =>
        Array.from({ length: count }, (_, at) => composeFight(at * 1000));
    const atBound = encodeJson({ version: 3, fights: listed(KEPT_MAXIMUM) }, 0);
    const pastBound = encodeJson({ version: 3, fights: listed(KEPT_MAXIMUM + 1) }, 0);
    assert(atBound.ok, "a full shelf is written as text");
    assert(pastBound.ok, "and so is one past it");
    const read = openShelf(composeStoreHolding(atBound.value));
    assert(read.ok, "twenty fights read back");
    assertStrictEquals(read.value.fights.length, KEPT_MAXIMUM, "every one of them");
    const refused = openShelf(composeStoreHolding(pastBound.value));
    assertEquals(refused, err({ kind: SHELF_FAILURE.unreadable }), "twenty-one are refused whole");
});
