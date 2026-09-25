/**
 * The shelf as the running add-on holds it: what the store answered, held apart per answer because
 * each is a different remedy, and what stands in memory after a refusal. The fights here are the
 * smallest a shelf takes; the replay of a real one is `margometer-runtime.test.ts`'s.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import { initPageStore, type KeyValueStore, STORE_KEY } from "#/src/game/browser-store.ts";
import { DEFECT_KIND, initDefectLedger } from "#/src/runtime/defect-ledger.ts";
import { initShelfKeeper, type ShelfKeeperOptions } from "#/src/runtime/shelf-keeper.ts";
import { KEPT_MAXIMUM, type KeptFight } from "#/src/runtime/shelf.ts";
import { STORAGE_CHOICE, type StorageChoice } from "#/src/ui/panel-choice.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { initHeldStore, initRefusingStore } from "#/tests/runtime-world.ts";

Deno.test("a fight kept is on the shelf and in the store, and the answers say nothing", () => {
    const { keeper, getShelf } = initKeeper();
    keeper.keep(composeFight(1));
    assertEquals(keeper.getFights().map((one) => one.openedAt), [1], "the fight stands");
    assert(getShelf(STORAGE_CHOICE.local).has(STORE_KEY.fights), "where a reload will look");
    const quiet = {
        isEverySlotPinned: false,
        hasStoreRefused: false,
        hasStoreMadeRoom: false,
        hasChoiceRefused: false,
    };
    assertEquals(keeper.getAnswers(), quiet, "and nothing needed saying");
});

function initKeeper(over: Partial<ShelfKeeperOptions> = {}) {
    const lines: string[] = [];
    const shelves = new Map<StorageChoice, Map<string, string>>();
    const getShelf = (choice: StorageChoice) => {
        const held = shelves.get(choice) ?? new Map<string, string>();
        shelves.set(choice, held);
        return held;
    };
    const settings = new Map<string, string>();
    const defects = initDefectLedger({ writeBrandedLine: (kind) => void lines.push(kind) });
    const keeper = initShelfKeeper({
        settings: initHeldStore(settings),
        initShelfStore: (choice) => initHeldStore(getShelf(choice)),
        choice: STORAGE_CHOICE.local,
        tables: BLOWS_GRANTED,
        sessionOptions: SESSION_OPTIONS,
        defects,
        ...over,
    });
    return { keeper, lines, getShelf, settings, defects };
}

/** A fight of one payload that opens and closes it, which is the least a shelf keeps. */
function composeFight(openedAt: number, isPinned = false): KeptFight {
    const payload = { init: 1, m: ["0;0;winner=Gracz 1"], endBattle: 1 };
    return { openedAt, payloads: [payload], place: null, gameBuild: null, isPinned };
}

Deno.test("a fight the store refuses stays a row, beside the answer that it was not saved", () => {
    const { keeper, lines } = initKeeper({ initShelfStore: () => initRefusingStore() });
    keeper.keep(composeFight(1));
    assertEquals(keeper.getFights().map((one) => one.openedAt), [1], "what the reader asked for");
    assert(keeper.getAnswers().hasStoreRefused, "and the store's answer beside it");
    assertEquals(lines, [], "which is an answer and not a defect");
});

Deno.test("a store that asks for room takes the newest, and the answer says room was made", () => {
    const held = new Map<string, string>();
    const { keeper } = initKeeper({ initShelfStore: () => initCeilingStore(held, 400) });
    keeper.keep(composeFight(1));
    assert(!keeper.getAnswers().hasStoreMadeRoom, "one fight fits");
    keeper.keep(composeFight(2));
    keeper.keep(composeFight(3));
    assert(keeper.getAnswers().hasStoreMadeRoom, "three do not, and the store asked for less");
    assertStrictEquals(keeper.getFights().at(-1)?.openedAt, 3, "the newest is what stayed");
    assert(!keeper.getAnswers().hasStoreRefused, "which is not the same answer as a refusal");
});

/** A store taking text up to a ceiling, which is the shape a quota answers in. */
function initCeilingStore(held: Map<string, string>, lengthMaximum: number): KeyValueStore {
    return initPageStore({
        getItem: (key) => held.get(key) ?? null,
        setItem: (key, value) => {
            if (value.length > lengthMaximum) throw new DOMException("full", "QuotaExceededError");
            held.set(key, value);
        },
        removeItem: (key) => void held.delete(key),
    });
}

/** The rotation on a full shelf is not the store asking for room, and is not said as it. */
Deno.test("a shelf past its bound drops its oldest quietly, as the rotation it is", () => {
    const { keeper } = initKeeper();
    for (let at = 1; at <= KEPT_MAXIMUM + 1; at += 1) keeper.keep(composeFight(at));
    assertStrictEquals(keeper.getFights().length, KEPT_MAXIMUM, "the shelf stays at its bound");
    assertStrictEquals(keeper.getFights()[0]?.openedAt, 2, "having let the oldest go");
    assert(!keeper.getAnswers().hasStoreMadeRoom, "which is not the store asking for room");
});

Deno.test("a shelf of pins keeps them, and says the new fight had nowhere to go", () => {
    const { keeper } = initKeeper();
    for (let at = 1; at <= KEPT_MAXIMUM; at += 1) keeper.keep(composeFight(at, true));
    keeper.keep(composeFight(KEPT_MAXIMUM + 1));
    assert(keeper.getAnswers().isEverySlotPinned, "every slot held by a pin");
    assertStrictEquals(keeper.getFights().length, KEPT_MAXIMUM, "and none of them let go");
    keeper.pin(1);
    keeper.keep(composeFight(KEPT_MAXIMUM + 2));
    assert(!keeper.getAnswers().isEverySlotPinned, "a slot freed, the next fight goes on");
});

Deno.test("a pin toggles, and one the store refuses stands in memory as the reader's", () => {
    const { keeper } = initKeeper();
    keeper.keep(composeFight(1));
    keeper.pin(1);
    assertStrictEquals(keeper.getFights()[0]?.isPinned, true, "pressed once, pinned");
    keeper.pin(1);
    assertStrictEquals(keeper.getFights()[0]?.isPinned, false, "pressed again, not");
    keeper.pin(99);
    assertEquals(keeper.getFights().map((one) => one.openedAt), [1], "a pin on no fight is none");
    const refusing = initKeeper({ initShelfStore: () => initRefusingStore() });
    refusing.keeper.keep(composeFight(1));
    refusing.keeper.pin(1);
    assertStrictEquals(refusing.keeper.getFights()[0]?.isPinned, true, "the reader's answer");
    assert(refusing.keeper.getAnswers().hasStoreRefused, "beside the store's");
});

Deno.test("a choice moves the fights, then the answer, and empties the old place last", () => {
    const { keeper, getShelf, settings } = initKeeper();
    keeper.keep(composeFight(1));
    keeper.choose(STORAGE_CHOICE.session);
    assertStrictEquals(keeper.getChoice(), STORAGE_CHOICE.session, "the choice is taken");
    assert(getShelf(STORAGE_CHOICE.session).has(STORE_KEY.fights), "the fights moved");
    assert(!getShelf(STORAGE_CHOICE.local).has(STORE_KEY.fights), "and left nothing behind");
    assertStrictEquals(settings.get(STORE_KEY.storage), STORAGE_CHOICE.session, "answered");
    keeper.choose(STORAGE_CHOICE.session);
    assertStrictEquals(keeper.getChoice(), STORAGE_CHOICE.session, "choosing it again is nothing");
    assert(getShelf(STORAGE_CHOICE.session).has(STORE_KEY.fights), "and empties nothing either");
});

/** A clock that only goes forward never states two fights under one moment. */
Deno.test("a fight kept twice under one moment is kept once, and a defect", () => {
    const { keeper, lines } = initKeeper();
    keeper.keep(composeFight(1));
    keeper.keep(composeFight(1));
    assertEquals(keeper.getFights().map((one) => one.openedAt), [1], "one fight on the shelf");
    assertEquals(lines, [DEFECT_KIND.keeping], "and the second said as ours to answer for");
});

Deno.test("a store that took the next fight takes back the answer that it refused one", () => {
    const held = new Map<string, string>();
    let isRefusing = true;
    const store = initPageStore({
        getItem: (key) => held.get(key) ?? null,
        setItem: (key, value) => {
            if (isRefusing) throw new DOMException("full", "QuotaExceededError");
            held.set(key, value);
        },
        removeItem: (key) => void held.delete(key),
    });
    const { keeper } = initKeeper({ initShelfStore: () => store });
    keeper.keep(composeFight(1));
    assert(keeper.getAnswers().hasStoreRefused, "the first fight was refused");
    isRefusing = false;
    keeper.keep(composeFight(2));
    assert(!keeper.getAnswers().hasStoreRefused, "and the answer goes once the store takes one");
});

Deno.test("a reading is held for every fight on the shelf, however many went before", () => {
    const { keeper } = initKeeper();
    for (let at = 1; at <= KEPT_MAXIMUM + 1; at += 1) {
        const fight = composeFight(at);
        keeper.keep(fight);
        const read = keeper.lookupReading(fight);
        assert(read !== null, "a fight that reads is read");
        assertStrictEquals(keeper.lookupReading(fight), read, `fight ${at} is held, not replayed`);
    }
});

Deno.test("a choice the browser will not keep moves nothing, and says so", () => {
    const { keeper, getShelf } = initKeeper({ settings: initRefusingStore() });
    keeper.keep(composeFight(1));
    keeper.choose(STORAGE_CHOICE.memory);
    assertStrictEquals(keeper.getChoice(), STORAGE_CHOICE.local, "the choice stays as it was");
    assert(getShelf(STORAGE_CHOICE.local).has(STORE_KEY.fights), "and so do the fights");
    assert(keeper.getAnswers().hasChoiceRefused, "which the shelf says outright");
});

Deno.test("a shelf that does not read back is an empty one, and a defect said once", () => {
    const held = new Map([[STORE_KEY.fights, "{"]]);
    const { keeper, lines, defects } = initKeeper({ initShelfStore: () => initHeldStore(held) });
    assertEquals(keeper.getFights(), [], "nothing to stand on");
    assertEquals(lines, [DEFECT_KIND.kept], "and what it held is said to be lost");
    assertStrictEquals(defects.getCounts()[0]?.count, 1, "once");
});

Deno.test("a kept fight is replayed once, and one that will not replay is marked once", () => {
    const { keeper, defects } = initKeeper();
    const broken: KeptFight = { ...composeFight(1), payloads: [{ init: 1, m: "not a list" }] };
    keeper.keep(broken);
    assertStrictEquals(keeper.lookupReading(broken), null, "a fight that will not read is none");
    assertStrictEquals(keeper.lookupReading(broken), null, "asked again, the same answer");
    assertStrictEquals(defects.getCounts()[0]?.count, 1, "and marked once, not once per ask");
    const whole = composeFight(2);
    keeper.keep(whole);
    const read = keeper.lookupReading(whole);
    assert(read !== null, "a fight that reads is read");
    assertStrictEquals(keeper.lookupReading(whole), read, "and held rather than read again");
});
