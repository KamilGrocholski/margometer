/**
 * The shelf as the running add-on holds it (`docs/design.md` §8): the fights, the store they are
 * kept in, what the store last answered, and each kept fight's reading, replayed once, when the
 * fight comes onto the shelf.
 *
 * ⚠️ **What stands in memory after a refusal is what the reader asked for**, as `develop` holds
 * it: a fight the store would not take stays a row until the page is left, beside the answer
 * saying it was not saved. Each answer is a different remedy, so each is held apart.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import type { SessionOptions } from "#/src/core/fight-session.ts";
import {
    initMemoryStore,
    type KeyValueStore,
    StoreUnavailable,
} from "#/src/ports/browser-store.ts";
import { DEFECT_KIND, type DefectLedger } from "./defect-ledger.ts";
import { type KeptFightState, replayKeptFight } from "./fight-state.ts";
import { writeStorageChoice } from "./settings.ts";
import {
    deleteShelf,
    EverySlotPinned,
    FightAlreadyKept,
    isShelfSuperseded,
    KEPT_MAXIMUM,
    type KeptFight,
    KeptFightsUnreadable,
    openShelf,
    rotateShelf,
    type ShelfContents,
    writeKeptFight,
    writeKeptFightPin,
    writeShelfContents,
} from "./shelf.ts";
import type { StorageChoice } from "#/src/ui/panel-choice.ts";

/** What the store last answered about the shelf, one flag an answer. */
export interface ShelfAnswers {
    isEverySlotPinned: boolean;
    hasStoreRefused: boolean;
    /** The store took the fights and asked for room: not the same answer as one that took none. */
    hasStoreMadeRoom: boolean;
    hasChoiceRefused: boolean;
    /** The place chosen would not take the fights, which stayed where they were. */
    hasMoveRefused: boolean;
    /** A pin the store would not write: every fight stands where it was, the pin in memory. */
    hasPinRefused: boolean;
}

export interface ShelfKeeper {
    getFights(): readonly KeptFight[];
    getChoice(): StorageChoice;
    getAnswers(): ShelfAnswers;
    /** One per fight on the shelf, null for one the payloads no longer read. */
    getKeptFightStates(): ReadonlyMap<number, KeptFightState | null>;
    keep(fight: KeptFight): void;
    pin(openedAt: number): void;
    moveShelf(choice: StorageChoice): void;
}

export interface ShelfKeeperOptions {
    settings: KeyValueStore;
    initShelfStore: (choice: StorageChoice) => KeyValueStore | StoreUnavailable;
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

/**
 * One answer of each kind at once: every slot pinned, a fight refused or room made for it, a move
 * refused or its choice, and a pin refused.
 */
export const SHELF_ANSWERS_MAXIMUM = 4;

export function initShelfKeeper(options: ShelfKeeperOptions): ShelfKeeper {
    let store: KeyValueStore;
    // Open the store the reader chose, or one that forgets where the browser lends none: a panel
    // that forgets between pages serves them better than one keeping fights where they did not
    // choose, and the defect says it forgets.
    {
        const chosen = options.initShelfStore(options.choice);
        if (chosen instanceof StoreUnavailable) {
            options.defects.add({ kind: DEFECT_KIND.kept, region: null, failure: chosen });
            store = initMemoryStore();
        } else store = chosen;
    }
    const opened = openShelf(store);
    if (opened instanceof Error) {
        options.defects.add({ kind: DEFECT_KIND.kept, region: null, failure: opened });
        // ⚠️ The next fight kept would write over a shelf this page could not read, so the page
        // keeps its fights in memory and the stored text stays as it was.
        if (!isShelfSuperseded(opened)) store = initMemoryStore();
    } else if (opened.fightsUnreadable > 0) {
        const failure = new KeptFightsUnreadable(opened.fightsUnreadable);
        options.defects.add({ kind: DEFECT_KIND.kept, region: null, failure });
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
            hasMoveRefused: false,
            hasPinRefused: false,
        },
        fightStatesByOpenedAt: new Map(),
    };
    assert(state.fights.length <= KEPT_MAXIMUM, "a shelf opened is inside its stated bound");
    executeShelvedFightReplays(state);
    return {
        getFights: () => state.fights,
        getChoice: () => state.choice,
        getAnswers: () => ({ ...state.answers }),
        getKeptFightStates: () => state.fightStatesByOpenedAt,
        // Keep a fight, and hold what the store answered.
        keep: (fight) => {
            const fightsAfter = [...state.fights, fight];
            const written = writeKeptFight(state.store, { fights: state.fights }, fight);
            state.answers.isEverySlotPinned = false;
            if (!(written instanceof Error)) {
                setShelfWritten(state, written.contents, rotateShelf(fightsAfter).length);
                executeShelvedFightReplays(state);
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
            // Refused: the fight stays a row, as the reader asked, beside the answer.
            {
                const asked = rotateShelf(fightsAfter);
                assert(asked.length <= KEPT_MAXIMUM, "what a reader asked for is inside the bound");
                state.answers.hasStoreRefused = true;
                state.answers.hasStoreMadeRoom = false;
                state.fights = asked;
            }
            executeShelvedFightReplays(state);
        },
        // Pin a fight, or take its pin off.
        pin: (openedAt) => {
            const fight = state.fights.find((keptFight) => keptFight.openedAt === openedAt);
            // A pin on a fight no longer kept asks for nothing: the next frame shows the shelf as
            // it is.
            if (fight === undefined) return;
            const fightsAfter = state.fights.map((keptFight) =>
                keptFight.openedAt === openedAt
                    ? { ...keptFight, isPinned: !keptFight.isPinned }
                    : keptFight
            );
            assert(
                fightsAfter.length === state.fights.length,
                "a pin moves no fight on or off the shelf",
            );
            const written = writeKeptFightPin(
                state.store,
                { fights: state.fights },
                openedAt,
                !fight.isPinned,
            );
            if (written instanceof Error) {
                // ⚠️ Not a fight refused: the store holds every fight as it did, so the answer says
                // only that the pin did not go down.
                state.answers.hasPinRefused = true;
                state.fights = fightsAfter;
            } else setShelfWritten(state, written.contents, fightsAfter.length);
            executeShelvedFightReplays(state);
        },
        // Move the shelf to the store chosen. The fights go first, the answer second, and the place
        // they came from is emptied last: a store that refuses them, or a browser that will not
        // keep the answer, leaves the reader's fights where the next page will still look.
        moveShelf: (storageChoice) => {
            // The store in effect chosen again: a choice the browser would not keep is moot.
            if (storageChoice === state.choice) {
                state.answers.hasChoiceRefused = false;
                state.answers.hasMoveRefused = false;
                return;
            }
            // A move answers once: refused, its choice refused, or taken.
            state.answers.hasChoiceRefused = false;
            const targetStore = state.options.initShelfStore(storageChoice);
            if (targetStore instanceof StoreUnavailable) {
                state.answers.hasMoveRefused = true;
                return;
            }
            const written = writeShelfContents(targetStore, { fights: state.fights });
            state.answers.hasMoveRefused = written instanceof Error;
            if (written instanceof Error) return;
            const answered = writeStorageChoice(state.options.settings, storageChoice);
            state.answers.hasChoiceRefused = answered instanceof Error;
            if (answered instanceof Error) return;
            // ⚠️ A copy the old store will not let go of is the reader's fights left where they
            // asked them not to be: nothing is lost, and the defect says a copy stayed behind.
            const deleted = deleteShelf(state.store);
            if (deleted instanceof Error) {
                state.options.defects.add({
                    kind: DEFECT_KIND.kept,
                    region: null,
                    failure: deleted,
                });
            }
            const offered = state.fights.length;
            assert(written.contents.fights.length <= offered, "a shelf moved grows by nothing");
            state.choice = storageChoice;
            state.store = targetStore;
            setShelfWritten(state, written.contents, offered);
            executeShelvedFightReplays(state);
        },
    };
}

/**
 * A reading for every fight on the shelf and for nothing else. A refusal is held as well: the shelf
 * is walked on every frame, and a fight that will not replay would otherwise be marked once per
 * frame.
 */
function executeShelvedFightReplays(state: KeeperState): void {
    assert(state.fights.length <= KEPT_MAXIMUM, "a shelf replayed is inside its stated bound");
    for (const openedAt of [...state.fightStatesByOpenedAt.keys()]) {
        if (state.fights.some((keptFight) => keptFight.openedAt === openedAt)) continue;
        state.fightStatesByOpenedAt.delete(openedAt);
    }
    const { tables, sessionOptions, defects } = state.options;
    for (const fight of state.fights) {
        if (state.fightStatesByOpenedAt.has(fight.openedAt)) continue;
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
        state.fightStatesByOpenedAt.set(fight.openedAt, fightState);
    }
    assert(
        state.fightStatesByOpenedAt.size <= state.fights.length,
        "a reading is held for a fight on the shelf, and for nothing else",
    );
}

/** What went down is what is drawn: a store that asked for less leaves the shelf a reload finds. */
function setShelfWritten(state: KeeperState, contents: ShelfContents, offered: number): void {
    assert(contents.fights.length <= offered, "a store never keeps more than it was offered");
    assert(offered <= KEPT_MAXIMUM, "and was offered a shelf inside its bound");
    state.answers.hasStoreRefused = false;
    state.answers.hasStoreMadeRoom = contents.fights.length < offered;
    // The whole shelf went down, the pin held in memory with it.
    state.answers.hasPinRefused = false;
    state.fights = contents.fights;
}
