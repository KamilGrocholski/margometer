/**
 * The shelf as the running add-on holds it (`docs/design.md` §8): the fights, the store they are
 * kept in, what the store last answered, and each kept fight's reading, replayed once.
 *
 * ⚠️ **What stands in memory after a refusal is what the reader asked for**, as `develop` holds
 * it: a fight the store would not take stays a row until the page is left, beside the answer
 * saying it was not saved. Each answer is a different remedy, so each is held apart.
 */

import { assert } from "@std/assert/assert";
import { runGuarded } from "#/libs/result.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import type { SessionOptions } from "#/src/core/fight-session.ts";
import type { KeyValueStore } from "#/src/game/browser-store.ts";
import { DEFECT_KIND, type DefectLedger } from "./defect-ledger.ts";
import { type KeptReading, replayKeptFight } from "./fight-reading.ts";
import { writeStorageChoice } from "./settings.ts";
import {
    deleteShelf,
    keepFight,
    KEPT_MAXIMUM,
    type KeptFight,
    openShelf,
    pinFight,
    rotateShelf,
    SHELF_FAILURE,
    type ShelfContents,
    writeShelfContents,
} from "./shelf.ts";
import type { StorageChoice } from "#/src/ui/panel-choice.ts";

/** The four things that can go wrong with a shelf, of which at most three ever hold at once. */
export interface ShelfAnswers {
    isEverySlotPinned: boolean;
    hasStoreRefused: boolean;
    /** The store took the fights and asked for room: not the same answer as one that took none. */
    hasStoreMadeRoom: boolean;
    hasChoiceRefused: boolean;
}

export interface ShelfKeeper {
    getFights(): readonly KeptFight[];
    getChoice(): StorageChoice;
    getAnswers(): ShelfAnswers;
    /** Null for a fight the payloads no longer read, which is a fight to stand on no longer. */
    lookupReading(fight: KeptFight): KeptReading | null;
    keep(fight: KeptFight): void;
    pin(openedAt: number): void;
    choose(choice: StorageChoice): void;
}

export interface ShelfKeeperOptions {
    settings: KeyValueStore;
    initShelfStore: (choice: StorageChoice) => KeyValueStore;
    choice: StorageChoice;
    tables: DecoderTables;
    sessionOptions: SessionOptions;
    defects: DefectLedger;
}

interface KeeperState {
    options: ShelfKeeperOptions;
    store: KeyValueStore;
    choice: StorageChoice;
    fights: readonly KeptFight[];
    answers: ShelfAnswers;
    /** In memory and never in the store: a figure that survives a reload is an older version's. */
    readings: Map<number, KeptReading | null>;
}

export function initShelfKeeper(options: ShelfKeeperOptions): ShelfKeeper {
    const store = options.initShelfStore(options.choice);
    const opened = openShelf(store);
    if (!opened.ok) {
        options.defects.add({ kind: DEFECT_KIND.kept, region: null, failure: opened.error });
    }
    const state: KeeperState = {
        options,
        store,
        choice: options.choice,
        fights: opened.ok ? opened.value.fights : [],
        answers: {
            isEverySlotPinned: false,
            hasStoreRefused: false,
            hasStoreMadeRoom: false,
            hasChoiceRefused: false,
        },
        readings: new Map(),
    };
    assert(state.fights.length <= KEPT_MAXIMUM, "a shelf opened is inside its stated bound");
    return {
        getFights: () => state.fights,
        getChoice: () => state.choice,
        getAnswers: () => ({ ...state.answers }),
        lookupReading: (fight) => lookupKeptReading(state, fight),
        keep: (fight) => keepShelfFight(state, fight),
        pin: (openedAt) => pinShelfFight(state, openedAt),
        choose: (choice) => chooseShelfStore(state, choice),
    };
}

/**
 * A refusal is held as well: the shelf is walked on every frame, and a fight that will not replay
 * would otherwise be replayed, and marked, once per frame.
 */
function lookupKeptReading(state: KeeperState, fight: KeptFight): KeptReading | null {
    const held = state.readings.get(fight.openedAt);
    if (held !== undefined) return held;
    const { tables, sessionOptions, defects } = state.options;
    const ran = runGuarded(() => replayKeptFight(fight, tables, sessionOptions));
    let reading: KeptReading | null = null;
    if (!ran.ok) defects.add({ kind: DEFECT_KIND.kept, region: null, failure: ran.error });
    else if (!ran.value.ok) {
        defects.add({ kind: DEFECT_KIND.kept, region: null, failure: ran.value.error });
    } else reading = ran.value.value;
    if (reading !== null) {
        const read = reading.messagesByPayload.length;
        assert(read === fight.payloads.length, "a kept fight is replayed payload by payload");
    }
    if (state.readings.size < KEPT_MAXIMUM) state.readings.set(fight.openedAt, reading);
    return reading;
}

function keepShelfFight(state: KeeperState, fight: KeptFight): void {
    const next = [...state.fights, fight];
    const kept = keepFight(state.store, { fights: state.fights }, fight);
    state.answers.isEverySlotPinned = false;
    if (kept.ok) {
        setShelfWritten(state, kept.value.contents, rotateShelf(next).length);
        return;
    }
    if (kept.error.kind === SHELF_FAILURE.everySlotPinned) {
        state.answers.isEverySlotPinned = true;
        return;
    }
    // Two fights under one moment, which a clock that only goes forward never states.
    if (kept.error.kind === SHELF_FAILURE.fightAlreadyKept) {
        state.options.defects.add({ kind: DEFECT_KIND.keeping, region: null, failure: kept.error });
        return;
    }
    setShelfRefused(state, rotateShelf(next));
}

/** What went down is what is drawn: a store that asked for less leaves the shelf a reload finds. */
function setShelfWritten(state: KeeperState, contents: ShelfContents, offered: number): void {
    assert(contents.fights.length <= offered, "a store never keeps more than it was offered");
    assert(offered <= KEPT_MAXIMUM, "and was offered a shelf inside its bound");
    state.answers.hasStoreRefused = false;
    state.answers.hasStoreMadeRoom = contents.fights.length < offered;
    state.fights = contents.fights;
    keepShelfReadings(state);
}

function keepShelfReadings(state: KeeperState): void {
    for (const openedAt of [...state.readings.keys()]) {
        if (state.fights.some((one) => one.openedAt === openedAt)) continue;
        state.readings.delete(openedAt);
    }
    assert(state.readings.size <= KEPT_MAXIMUM, "a reading is held for a fight on the shelf");
}

function setShelfRefused(state: KeeperState, asked: readonly KeptFight[]): void {
    assert(asked.length <= KEPT_MAXIMUM, "what a reader asked for is inside the shelf's bound");
    state.answers.hasStoreRefused = true;
    state.answers.hasStoreMadeRoom = false;
    state.fights = asked;
    keepShelfReadings(state);
}

function pinShelfFight(state: KeeperState, openedAt: number): void {
    const held = state.fights.find((one) => one.openedAt === openedAt);
    // A pin on a fight no longer kept asks for nothing: the next frame shows the shelf as it is.
    if (held === undefined) return;
    const next = state.fights.map((one) =>
        one.openedAt === openedAt ? { ...one, isPinned: !one.isPinned } : one
    );
    assert(next.length === state.fights.length, "a pin moves no fight on or off the shelf");
    const pinned = pinFight(state.store, { fights: state.fights }, openedAt, !held.isPinned);
    if (pinned.ok) setShelfWritten(state, pinned.value.contents, next.length);
    else setShelfRefused(state, next);
}

/**
 * The fights go first, the answer second, and the place they came from is emptied last: a store
 * that refuses them, or a browser that will not keep the answer, leaves the reader's fights where
 * the next page will still look.
 */
function chooseShelfStore(state: KeeperState, choice: StorageChoice): void {
    if (choice === state.choice) return;
    const moved = state.options.initShelfStore(choice);
    const written = writeShelfContents(moved, { fights: state.fights });
    if (!written.ok) {
        state.answers.hasStoreRefused = true;
        state.answers.hasStoreMadeRoom = false;
        return;
    }
    const answered = writeStorageChoice(state.options.settings, choice);
    state.answers.hasChoiceRefused = !answered.ok;
    if (!answered.ok) return;
    // ⚠️ A copy the old store will not let go of is the reader's fights left where they were,
    // which `develop` leaves unsaid as well: nothing is lost, and the answer already stands.
    void deleteShelf(state.store);
    const offered = state.fights.length;
    assert(written.value.contents.fights.length <= offered, "a shelf moved grows by nothing");
    state.choice = choice;
    state.store = moved;
    setShelfWritten(state, written.value.contents, offered);
}
