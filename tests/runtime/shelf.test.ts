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
    assertInstanceOf,
    AssertionError,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { encodeJson } from "#/libs/json-text.ts";
import {
    initBrowserStore,
    initMemoryStore,
    type KeyValueStore,
    STORE_KEY,
    StoreUnavailable,
} from "#/src/ports/browser-store.ts";
import { composeFightView } from "#/src/core/fight-session.ts";
import {
    EverySlotPinned,
    FightAlreadyKept,
    KEPT_MAXIMUM,
    type KeptFight,
    openShelf,
    RotationRefused,
    type ShelfContents,
    type ShelfOpened,
    ShelfUnreadable,
    ShelfVersionUnknown,
    writeKeptFight,
    writeKeptFightPin,
} from "#/src/runtime/shelf.ts";
import { readRecordedFights, replayRecordedFight } from "#/tests/recorded-fights.ts";

const EMPTY: ShelfContents = { fights: [] };
const OPENED_EMPTY: ShelfOpened = { fights: [], fightsUnreadable: 0 };

/** `develop`'s `writeKeptFights` of `composeFight(7)`, as it stood in a store on 2026-09-24. */
const DEVELOP_SHELF = '{"version":3,"fights":[{"openedAt":7,"payloads":[{"init":1,"w":{"1":' +
    '{"id":1,"name":"Gracz 1","team":1}}},{"m":["1=100.00;0;heal=99"]}],"place":{"mapName":' +
    '"Mapa","x":12,"y":34},"gameBuild":"1786441768914","isPinned":false}]}';

Deno.test("what is written comes back as it went on, in develop's own text", () => {
    const store = initMemoryStore();
    const kept = writeKeptFight(store, EMPTY, composeFight(7));
    assertEquals(kept, { contents: { fights: [composeFight(7)] }, droppedOpenedAt: [] }, "all");
    assertEquals(store.read(STORE_KEY.fights), DEVELOP_SHELF, "the text develop writes");
    assertEquals(openShelf(store), composeOpened([composeFight(7)]), "and gives it back whole");
    const fromDevelop = composeStoreHolding(DEVELOP_SHELF);
    assertEquals(openShelf(fromDevelop), composeOpened([composeFight(7)]), "a develop shelf too");
});

function composeFight(openedAt: number, isPinned = false): KeptFight {
    return {
        openedAt,
        payloads: [{ init: 1, w: { 1: { id: 1, name: "Gracz 1", team: 1 } } }, {
            m: ["1=100.00;0;heal=99"],
        }],
        place: { mapName: "Mapa", x: 12, y: 34 },
        readerId: null,
        margonemClientBuild: "1786441768914",
        isPinned,
    };
}

function composeOpened(fights: readonly KeptFight[]): ShelfOpened {
    return { fights, fightsUnreadable: 0 };
}

function composeStoreHolding(text: string): KeyValueStore {
    const store = initMemoryStore();
    store.write(STORE_KEY.fights, text);
    return store;
}

Deno.test("the reader's id goes on beside the fight and comes back, and only where it was read", () => {
    const store = initMemoryStore();
    const withReader = { ...composeFight(7), readerId: 1 };
    writeKeptFight(store, EMPTY, withReader);
    const text = store.read(STORE_KEY.fights);
    assert(typeof text === "string", "the shelf is written");
    assertStrictEquals(
        text,
        `${DEVELOP_SHELF.slice(0, -3)},"readerId":1}]}`,
        "after everything develop wrote, so a develop shelf is this one less a field (ADR 0014)",
    );
    assertEquals(openShelf(store), composeOpened([withReader]), "and it comes back with the fight");
});

Deno.test("an id that does not read back is nobody's, and the fight stands without it", () => {
    for (const stated of ["0", "-1", "1.5", '"1"', "null", "true"]) {
        const text = `${DEVELOP_SHELF.slice(0, -3)},"readerId":${stated}}]}`;
        assertEquals(
            openShelf(composeStoreHolding(text)),
            composeOpened([composeFight(7)]),
            `${stated} is no id, and costs the fight nothing`,
        );
    }
});

Deno.test("a store that will not have it says so, rather than throwing", () => {
    const refusing = composeStoreWithCeiling(0);
    const kept = writeKeptFight(refusing, EMPTY, composeFight(1));
    assertInstanceOf(kept, RotationRefused, "room for nothing keeps nothing");
    assertStrictEquals(kept.attempts, 2, "not even an empty shelf");
    assertEquals(openShelf(refusing), OPENED_EMPTY, "and the shelf reads back empty");
    const absent = initBrowserStore(null);
    const written = writeKeptFight(absent, EMPTY, composeFight(1));
    assertInstanceOf(written, StoreUnavailable, "no store is an answer");
    assertInstanceOf(openShelf(absent), StoreUnavailable, "on reading as on writing");
});

/** A store with a ceiling on the text it takes, which is the shape a quota answers in. */
function composeStoreWithCeiling(lengthMaximum: number): KeyValueStore {
    const held = new Map<string, string>();
    return initBrowserStore({
        getItem: (key) => held.get(key) ?? null,
        setItem: (key, stored) => {
            if (stored.length > lengthMaximum) throw new DOMException("full", "QuotaExceededError");
            held.set(key, stored);
        },
        removeItem: (key) => void held.delete(key),
    });
}

Deno.test("a shelf nobody can read is refused, never trusted into a figure", () => {
    const broken = composeStoreHolding("{ this is not json");
    assertInstanceOf(openShelf(broken), ShelfUnreadable, "no parse, no shelf");
    const listed = composeStoreHolding("[1,2]");
    assertInstanceOf(openShelf(listed), ShelfUnreadable, "a list is no shelf");
    // The fight inside reads back perfectly: it is the version that refuses it, and a sample
    // holding an empty shelf could not tell the two apart.
    const older = composeStoreHolding(
        '{"version":2,"fights":[{"openedAt":1,"payloads":[{"init":1}]}]}',
    );
    const version = openShelf(older);
    assertInstanceOf(version, ShelfVersionUnknown, "a shelf of another version");
    assertStrictEquals(version.version, 2, "naming which");
    const unstated = composeStoreHolding('{"fights":[]}');
    const none = openShelf(unstated);
    assertInstanceOf(none, ShelfVersionUnknown, "and one stating none");
    assertStrictEquals(none.version, null, "as none");
    const notListed = composeStoreHolding('{"version":3,"fights":"none"}');
    assertInstanceOf(openShelf(notListed), ShelfUnreadable, "fights, a list");
    assertEquals(
        openShelf(initMemoryStore()),
        OPENED_EMPTY,
        "while nothing stored is an empty shelf",
    );
});

/**
 * A payload nobody can read costs the whole fight: a gap in the middle decodes to figures that
 * look like a fight.
 */
Deno.test("a fight is kept from one payload and dropped where it has none", () => {
    const onePayload = '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1}]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(onePayload)), [1], "one payload is a fight");
    const none = '{"version":3,"fights":[{"openedAt":1,"payloads":[]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(none)), [], "a fight kept from nothing is none");
    const holed = '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1},"gone"]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(holed)), [], "a payload nobody reads takes it");
});

function readOpenedAt(store: KeyValueStore): number[] {
    const opened = openShelf(store);
    assert(!(opened instanceof Error), "the shelf reads back");
    return opened.fights.map((fight) => fight.openedAt);
}

Deno.test("one fight nobody can read costs that fight and not the shelf", () => {
    const half = '{"version":3,"fights":[{"openedAt":1,"payloads":[{"init":1}]},' +
        '{"openedAt":2,"payloads":"none"},{"openedAt":"soon","payloads":[{"init":1}]},' +
        '{"openedAt":-1,"payloads":[{"init":1}]},{"openedAt":0,"payloads":[{"init":1}]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(half)), [1, 0], "the whole ones, zero included");
    const opened = openShelf(composeStoreHolding(half));
    assert(!(opened instanceof Error), "the shelf reads back");
    assertStrictEquals(opened.fightsUnreadable, 3, "and counts the three it could not");
    const whole = openShelf(composeStoreHolding(DEVELOP_SHELF));
    assert(!(whole instanceof Error), "a whole shelf reads back");
    assertStrictEquals(whole.fightsUnreadable, 0, "and counts none");
});

/** A moment is the key a row's marks carry, and a mark reads a whole number back or nothing. */
Deno.test("a fight kept at a fraction of a moment is dropped, and one at a whole moment is read", () => {
    const fraction = '{"version":3,"fights":[{"openedAt":1.5,"payloads":[{"init":1}]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(fraction)), [], "a moment no mark can carry");
    const whole = '{"version":3,"fights":[{"openedAt":2,"payloads":[{"init":1}]}]}';
    assertEquals(readOpenedAt(composeStoreHolding(whole)), [2], "and the whole one beside it");
    const past = Number.MAX_SAFE_INTEGER + 1;
    const huge = `{"version":3,"fights":[{"openedAt":${past},"payloads":[{"init":1}]}]}`;
    assertEquals(readOpenedAt(composeStoreHolding(huge)), [], "and one past whole numbers' reach");
});

Deno.test("the shelf holds its stated maximum, oldest dropped first, and says which went", () => {
    const store = initMemoryStore();
    const shelf = keepAll(
        store,
        Array.from({ length: KEPT_MAXIMUM }, (_, openedAt) => composeFight(openedAt)),
    );
    assertEquals(shelf.fights.length, KEPT_MAXIMUM, "twenty fit without dropping one");
    const written = writeKeptFight(store, shelf, composeFight(KEPT_MAXIMUM));
    assert(!(written instanceof Error), "the twenty-first is kept");
    assertEquals(written.droppedOpenedAt, [0], "and the oldest went, which the answer names");
    assertEquals(readOpenedAt(store)[0], 1, "as a reload finds");
    assertEquals(readOpenedAt(store).length, KEPT_MAXIMUM, "at the bound");
});

/** Every fight kept in turn onto one shelf, as the runtime keeps them. */
function keepAll(store: KeyValueStore, fights: readonly KeptFight[]): ShelfContents {
    let shelf = EMPTY;
    for (const fight of fights) {
        const kept = writeKeptFight(store, shelf, fight);
        assert(!(kept instanceof Error), `fight ${fight.openedAt} is kept`);
        shelf = kept.contents;
    }
    return shelf;
}

Deno.test("a pin outranks the rotation, and the oldest unpinned goes instead", () => {
    const store = initMemoryStore();
    const fights = Array.from(
        { length: KEPT_MAXIMUM },
        (_, openedAt) => composeFight(openedAt, openedAt < 2),
    );
    const shelf = keepAll(store, fights);
    const written = writeKeptFight(store, shelf, composeFight(KEPT_MAXIMUM));
    assert(!(written instanceof Error), "the twenty-first is kept");
    assertEquals(written.droppedOpenedAt, [2], "the oldest nobody pinned went");
    assertEquals(readOpenedAt(store).slice(0, 3), [0, 1, 3], "the pinned two stayed");
    const opened = openShelf(store);
    assert(!(opened instanceof Error), "the shelf reads back");
    assertEquals(opened.fights.filter((fight) => fight.isPinned).length, 2, "pins survive");
});

Deno.test("a shelf with every slot pinned refuses the newest rather than dropping one", () => {
    const store = initMemoryStore();
    const nearly = Array.from(
        { length: KEPT_MAXIMUM - 1 },
        (_, openedAt) => composeFight(openedAt, true),
    );
    let shelf = keepAll(store, nearly);
    const twentieth = writeKeptFight(store, shelf, composeFight(KEPT_MAXIMUM - 1, true));
    assert(
        !(twentieth instanceof Error),
        "nineteen pinned leave a slot, and a twentieth pinned fight takes it",
    );
    shelf = twentieth.contents;
    const refused = writeKeptFight(store, shelf, composeFight(KEPT_MAXIMUM));
    assertInstanceOf(refused, EverySlotPinned, "the twenty-first has nowhere to go");
    assertStrictEquals(refused.maximum, KEPT_MAXIMUM, "past the shelf's bound");
    assertEquals(readOpenedAt(store).length, KEPT_MAXIMUM, "and what the reader pinned is there");
    const released = writeKeptFightPin(store, shelf, 0, false);
    assert(!(released instanceof Error), "one slot unpinned");
    const arrives = writeKeptFight(store, released.contents, composeFight(KEPT_MAXIMUM));
    assert(!(arrives instanceof Error), "and the newest arrives");
    assertEquals(arrives.droppedOpenedAt, [0], "in the place the unpinned one gave up");
});

/** No quota is assumed, so a shelf that will not fit asks for less. */
Deno.test("a store with no room takes fewer fights, and says what it took", () => {
    const four = [0, 1, 2, 3].map((openedAt) => composeFight(openedAt));
    const two = encodeWrittenShelf(four.slice(2));
    assert(!(two instanceof Error), "the newest two of four are text");
    const store = composeStoreWithCeiling(two.length);
    const shelf = keepAll(store, four.slice(0, 3));
    const kept = writeKeptFight(store, shelf, four[3] ?? composeFight(3));
    assert(!(kept instanceof Error), "a shelf that fits at some size is written at that size");
    assertEquals(kept.contents.fights.map((fight) => fight.openedAt), [2, 3], "the newest");
    assertEquals(readOpenedAt(store), [2, 3], "and what a reload finds is what the answer said");
});

/**
 * Fights as the shelf writes them, under the keys it stores: an id nobody stated is left out, as
 * `develop` wrote a fight.
 */
function encodeWrittenShelf(fights: readonly KeptFight[]): string | Error {
    const written = fights.map(({ readerId, margonemClientBuild, isPinned, ...rest }) => {
        const stored = { ...rest, gameBuild: margonemClientBuild, isPinned };
        return readerId === null ? stored : { ...stored, readerId };
    });
    return encodeJson({ version: 3, fights: written }, 0);
}

Deno.test("a pin outranks the store's refusal, and a shelf of pins too long is refused", () => {
    const four = [0, 1, 2, 3].map((openedAt) => composeFight(openedAt, openedAt === 0));
    const room = encodeWrittenShelf([four[0] ?? composeFight(0), four[3] ?? composeFight(3)]);
    assert(!(room instanceof Error), "a pinned fight beside the newest is text");
    const store = composeStoreWithCeiling(room.length);
    const shelf = keepAll(store, four.slice(0, 3));
    const kept = writeKeptFight(store, shelf, four[3] ?? composeFight(3));
    assert(!(kept instanceof Error), "and it is what fits");
    assertEquals(kept.contents.fights.map((fight) => fight.openedAt), [0, 3], "pinned stayed");
    const both = [composeFight(0, true), composeFight(3, true)];
    const pinnedText = encodeWrittenShelf(both);
    assert(!(pinnedText instanceof Error), "two pinned fights are text");
    const cramped = composeStoreWithCeiling(pinnedText.length - 1);
    const firstPinned = writeKeptFight(cramped, EMPTY, composeFight(0, true));
    assert(!(firstPinned instanceof Error), "one pinned fight fits");
    const pins = writeKeptFight(cramped, firstPinned.contents, composeFight(3, true));
    assertInstanceOf(
        pins,
        RotationRefused,
        "only pins are left to offer, so the store's refusal stands",
    );
    assertStrictEquals(pins.attempts, 1, "after the one offer");
});

Deno.test("a fight is kept once, and a pin on a fight not kept is a bug of the caller's", () => {
    const store = initMemoryStore();
    const shelf = keepAll(store, [composeFight(1)]);
    const again = writeKeptFight(store, shelf, composeFight(1));
    assertInstanceOf(again, FightAlreadyKept, "one moment");
    assertStrictEquals(again.openedAt, 1, "named by it");
    assertThrows(
        () => writeKeptFightPin(store, shelf, 2, true),
        AssertionError,
        "a pin is asked of a fight the shelf keeps",
    );
    const pinned = writeKeptFightPin(store, shelf, 1, true);
    assert(!(pinned instanceof Error), "the kept one takes its pin");
    assertEquals(readOpenedAt(store), [1], "and a reload finds it still kept");
    assertThrows(
        () => writeKeptFight(store, EMPTY, { ...composeFight(3), payloads: [] }),
        AssertionError,
        "a fight kept was kept from something",
    );
});

Deno.test("a fight keeps where it was fought and its build, and reads back without either", () => {
    const store = initMemoryStore();
    keepAll(store, [composeFight(1)]);
    const whole = openShelf(store);
    assert(!(whole instanceof Error), "the shelf reads back");
    assertEquals(whole.fights[0]?.place, { mapName: "Mapa", x: 12, y: 34 }, "whole");
    assertStrictEquals(whole.fights[0]?.margonemClientBuild, "1786441768914", "as it was stated");
    const partial = '{"version":3,"fights":[{"openedAt":3,"payloads":[{"init":1}],' +
        '"place":{"mapName":"Mapa"}}]}';
    const openedShelf = openShelf(composeStoreHolding(partial));
    assert(!(openedShelf instanceof Error), "a fight with part of a place reads back");
    assertEquals(openedShelf.fights[0]?.place, { mapName: "Mapa", x: null, y: null }, "that part");
    assertStrictEquals(
        openedShelf.fights[0]?.margonemClientBuild,
        null,
        "and a build nobody said is none",
    );
    const yOnly = '{"version":3,"fights":[{"openedAt":4,"payloads":[{"init":1}],"place":{"y":7}}]}';
    const alone = openShelf(composeStoreHolding(yOnly));
    assert(!(alone instanceof Error), "a place stating one number reads back");
    assertEquals(alone.fights[0]?.place, { mapName: null, x: null, y: 7 }, "as that one");
    const bare = '{"version":3,"fights":[{"openedAt":5,"payloads":[{"init":1}],"place":{}}]}';
    const nowhere = openShelf(composeStoreHolding(bare));
    assert(!(nowhere instanceof Error), "a place stating nothing");
    assertStrictEquals(nowhere.fights[0]?.place, null, "is a fight fought nobody knows where");
    assertStrictEquals(nowhere.fights[0]?.isPinned, false, "and nobody pinned it");
});

/** The reason the shelf holds payloads at all: a fight off it is the fight that went on it. */
Deno.test("a fight off the shelf reads as the fight that went on it, through one chain", () => {
    const [fight] = readRecordedFights();
    assert(fight !== undefined, "a recording to keep");
    const store = initMemoryStore();
    const payloads = [...fight.updates];
    const kept = writeKeptFight(store, EMPTY, { ...composeFight(1), payloads, place: null });
    assert(!(kept instanceof Error), "kept");
    const opened = openShelf(store);
    assert(!(opened instanceof Error), "and read back");
    const offShelf = opened.fights[0];
    assert(offShelf !== undefined, "one fight");
    const replayedOffShelf = composeFightView(
        replayRecordedFight({ ...fight, updates: offShelf.payloads }),
    );
    const watched = composeFightView(replayRecordedFight(fight));
    assert(replayedOffShelf !== null, "a fight off the shelf is a fight");
    assert(watched !== null, "and so is the one that was watched");
    assertEquals(
        replayedOffShelf.payloadsApplied,
        payloads.length,
        "every call went on and came back",
    );
    assertEquals(
        replayedOffShelf.events,
        watched.events,
        "the same events, by the code that is running now",
    );
    assertEquals(replayedOffShelf.roster.byId.size, watched.roster.byId.size, "and the same cast");
    assertEquals(replayedOffShelf.readerSide, watched.readerSide, "the reader's own side included");
    assertEquals(
        replayedOffShelf.messagesLost,
        watched.messagesLost,
        "and what nobody read is re-counted",
    );
    assert(watched.events.length > 0, "over a recording that decodes to something");
});

/**
 * A shelf holding more fights than one can is not one this version wrote, so it is refused whole
 * rather than cut to size: which twenty of them a reader meant is not a question the text answers.
 */
Deno.test("a shelf past its bound is unreadable, and one at its bound is read whole", () => {
    const listed = (count: number) =>
        Array.from({ length: count }, (_, index) => composeFight(index * 1000));
    const atBound = encodeJson({ version: 3, fights: listed(KEPT_MAXIMUM) }, 0);
    const pastBound = encodeJson({ version: 3, fights: listed(KEPT_MAXIMUM + 1) }, 0);
    assert(!(atBound instanceof Error), "a full shelf is written as text");
    assert(!(pastBound instanceof Error), "and so is one past it");
    const openedShelf = openShelf(composeStoreHolding(atBound));
    assert(!(openedShelf instanceof Error), "twenty fights read back");
    assertStrictEquals(openedShelf.fights.length, KEPT_MAXIMUM, "every one of them");
    const refused = openShelf(composeStoreHolding(pastBound));
    assertInstanceOf(refused, ShelfUnreadable, "twenty-one are refused whole");
});
