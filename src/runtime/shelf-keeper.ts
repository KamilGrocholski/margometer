/**
 * The shelf as the running add-on holds it (`docs/design.md` §8): the fights, the store they are
 * kept in, what the store last answered, and each kept fight's reading, replayed once.
 *
 * ⚠️ **What stands in memory after a refusal is what the reader asked for**, as `develop` holds
 * it: a fight the store would not take stays a row until the page is left, beside the answer
 * saying it was not saved. Each answer is a different remedy, so each is held apart.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import type { SessionOptions } from "#/src/core/fight-session.ts";
import type { KeyValueStore } from "#/src/game/browser-store.ts";
import { DEFECT_KIND, type DefectLedger } from "./defect-ledger.ts";
import { type KeptFightState, replayKeptFight } from "./fight-state.ts";
import { writeStorageChoice } from "./settings.ts";
import {
    deleteShelf,
    EverySlotPinned,
    FightAlreadyKept,
    KEPT_MAXIMUM,
    type KeptFight,
    openShelf,
    rotateShelf,
    type ShelfContents,
    writeKeptFight,
    writeKeptFightPin,
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
    lookupKeptFightState(fight: KeptFight): KeptFightState | null;
    keep(fight: KeptFight): void;
    pin(openedAt: number): void;
    moveShelf(choice: StorageChoice): void;
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
    fightStatesByOpenedAt: Map<number, KeptFightState | null>;
}

export function initShelfKeeper(options: ShelfKeeperOptions): ShelfKeeper {
    const store = options.initShelfStore(options.choice);
    const opened = openShelf(store);
    if (opened instanceof Error) {
        options.defects.add({ kind: DEFECT_KIND.kept, region: null, failure: opened });
    }
    const state: KeeperState = {
        options,
        store,
        choice: options.choice,
        fights: opened instanceof Error ? [] : opened.fights,
        answers: {
            isEverySlotPinned: false,
            hasStoreRefused: false,
            hasStoreMadeRoom: false,
            hasChoiceRefused: false,
        },
        fightStatesByOpenedAt: new Map(),
    };
    assert(state.fights.length <= KEPT_MAXIMUM, "a shelf opened is inside its stated bound");
    return {
        getFights: () => state.fights,
        getChoice: () => state.choice,
        getAnswers: () => ({ ...state.answers }),
        // A refusal is held as well: the shelf is walked on every frame, and a fight that will not
        // replay would otherwise be replayed, and marked, once per frame.
        lookupKeptFightState: (fight) => {
            const rememberedFightState = state.fightStatesByOpenedAt.get(fight.openedAt);
            if (rememberedFightState !== undefined) return rememberedFightState;
            const { tables, sessionOptions, defects } = state.options;
            const ran = errors.attempt(() => replayKeptFight(fight, tables, sessionOptions));
            let fightState: KeptFightState | null = null;
            if (ran instanceof Error) {
                defects.add({ kind: DEFECT_KIND.kept, region: null, failure: ran });
            } else fightState = ran;
            if (fightState !== null) {
                const payloadsReplayedCount = fightState.messagesByPayload.length;
                assert(
                    payloadsReplayedCount === fight.payloads.length,
                    "a kept fight is replayed payload by payload",
                );
            }
            if (state.fightStatesByOpenedAt.size < KEPT_MAXIMUM) {
                state.fightStatesByOpenedAt.set(fight.openedAt, fightState);
            }
            return fightState;
        },
        // Keep a fight, and hold what the store answered.
        keep: (fight) => {
            const next = [...state.fights, fight];
            const written = writeKeptFight(state.store, { fights: state.fights }, fight);
            state.answers.isEverySlotPinned = false;
            if (!(written instanceof Error)) {
                setShelfWritten(state, written.contents, rotateShelf(next).length);
                return;
            }
            if (written instanceof EverySlotPinned) {
                state.answers.isEverySlotPinned = true;
                return;
            }
            // Two fights under one moment, which a clock that only goes forward never states.
            if (written instanceof FightAlreadyKept) {
                state.options.defects.add({
                    kind: DEFECT_KIND.keeping,
                    region: null,
                    failure: written,
                });
                return;
            }
            setShelfRefused(state, rotateShelf(next));
        },
        // Pin a fight, or take its pin off.
        pin: (openedAt) => {
            const fight = state.fights.find((one) => one.openedAt === openedAt);
            // A pin on a fight no longer kept asks for nothing: the next frame shows the shelf as
            // it is.
            if (fight === undefined) return;
            const next = state.fights.map((one) =>
                one.openedAt === openedAt ? { ...one, isPinned: !one.isPinned } : one
            );
            assert(next.length === state.fights.length, "a pin moves no fight on or off the shelf");
            const written = writeKeptFightPin(
                state.store,
                { fights: state.fights },
                openedAt,
                !fight.isPinned,
            );
            if (written instanceof Error) setShelfRefused(state, next);
            else setShelfWritten(state, written.contents, next.length);
        },
        // Move the shelf to the store chosen. The fights go first, the answer second, and the place
        // they came from is emptied last: a store that refuses them, or a browser that will not
        // keep the answer, leaves the reader's fights where the next page will still look.
        moveShelf: (storageChoice) => {
            if (storageChoice === state.choice) return;
            const targetStore = state.options.initShelfStore(storageChoice);
            const written = writeShelfContents(targetStore, { fights: state.fights });
            if (written instanceof Error) {
                state.answers.hasStoreRefused = true;
                state.answers.hasStoreMadeRoom = false;
                return;
            }
            const answered = writeStorageChoice(state.options.settings, storageChoice);
            state.answers.hasChoiceRefused = answered instanceof Error;
            if (answered instanceof Error) return;
            // ⚠️ A copy the old store will not let go of is the reader's fights left where they
            // were, which `develop` leaves unsaid as well: nothing is lost, and the answer already
            // stands.
            void deleteShelf(state.store);
            const offered = state.fights.length;
            assert(written.contents.fights.length <= offered, "a shelf moved grows by nothing");
            state.choice = storageChoice;
            state.store = targetStore;
            setShelfWritten(state, written.contents, offered);
        },
    };
}

/** What went down is what is drawn: a store that asked for less leaves the shelf a reload finds. */
function setShelfWritten(state: KeeperState, contents: ShelfContents, offered: number): void {
    assert(contents.fights.length <= offered, "a store never keeps more than it was offered");
    assert(offered <= KEPT_MAXIMUM, "and was offered a shelf inside its bound");
    state.answers.hasStoreRefused = false;
    state.answers.hasStoreMadeRoom = contents.fights.length < offered;
    state.fights = contents.fights;
    removeUnshelvedFightStates(state);
}

function removeUnshelvedFightStates(state: KeeperState): void {
    for (const openedAt of [...state.fightStatesByOpenedAt.keys()]) {
        if (state.fights.some((one) => one.openedAt === openedAt)) continue;
        state.fightStatesByOpenedAt.delete(openedAt);
    }
    assert(
        state.fightStatesByOpenedAt.size <= KEPT_MAXIMUM,
        "a reading is held for a fight on the shelf",
    );
}

function setShelfRefused(state: KeeperState, asked: readonly KeptFight[]): void {
    assert(asked.length <= KEPT_MAXIMUM, "what a reader asked for is inside the shelf's bound");
    state.answers.hasStoreRefused = true;
    state.answers.hasStoreMadeRoom = false;
    state.fights = asked;
    removeUnshelvedFightStates(state);
}
