/**
 * Getting the wrap onto the game, and off again.
 *
 * The wrap knows how to hold a battle object; this knows how to find one, and they are apart
 * because finding is a matter of timing and wrapping is a matter of promises. The game builds its
 * battle once, while the engine starts, and a userscript may arrive on either side of that — so
 * this looks, keeps looking, and stops when it finds one or when the game plainly is not coming.
 * A search with no end is something the page pays for forever.
 */

import { assert } from "@std/assert";
import {
    type EngineBattle,
    isEngineBattleWrapped,
    wrapEngineBattle,
} from "@/src/game/engine-battle-wrap.ts";
import { isRecord } from "@/src/core/unknown-reading.ts";

const BATTLE_FIELD = "battle";
/** Both spellings are in the wild, and a client renaming either breaks both readers at once. */
const ENGINE_FIELD = "Engine";
const ENGINE_CALL_FIELD = "getEngine";
/** The field and the call: a page holds a game in two spellings and no more. */
export const ENGINE_SPELLINGS = 2;
const LOOK_EVERY_MS = 250;
/** Four looks a second for a minute. A game that has not arrived by then is not arriving. */
const MAXIMUM_LOOKS = 240;

export interface Scheduler {
    every(step: () => void, everyMs: number): number;
    cancel(handle: number): void;
}

export interface AttachmentReport {
    /** Handed the battle before the engine's own call, for what only that moment can be read at. */
    handleBeforeCall(battle: EngineBattle): void;
    handlePayload(payload: unknown, battle: EngineBattle): void;
    /** The first failure of ours, once. The wrap counts the rest. */
    handleFailure(failure: unknown): void;
    /** A MargoMeter was already reading, so this copy stands down and never counts. */
    handleAnotherReader(): void;
    /** The game is here and will not be wrapped: the method it was found by is gone. */
    handleRefusal(): void;
    /** The looking stopped without a game. */
    handleSearchAbandoned(): void;
}

export interface GameAttachment {
    detach(): void;
    isAttached(): boolean;
}

/** Both spellings, in the order tried. A call into their program may throw, and that is theirs. */
export function getEnginesFromPage(page: unknown): unknown[] {
    if (!isRecord(page)) return [];
    assert(isRecord(page), "a page that is asked is a page");
    const found: unknown[] = [page[ENGINE_FIELD]];
    assert(found.length === 1, "the field is asked for before the call is");
    const stated = page[ENGINE_CALL_FIELD];
    if (typeof stated === "function") found.push(stated.call(page));
    assert(found.length >= 1, "the page is asked for a game in every spelling there is");
    assert(found.length <= ENGINE_SPELLINGS, "and there are two of them");
    return found;
}

function getBattleFromPage(page: unknown): EngineBattle | null {
    const engines = getEnginesFromPage(page);
    assert(engines.length <= ENGINE_SPELLINGS, "a page holds a game in two spellings and no more");
    for (const engine of engines) {
        if (!isRecord(engine)) continue;
        const battle = engine[BATTLE_FIELD];
        if (!isRecord(battle)) continue;
        return battle;
    }
    return null;
}

interface Search {
    wrap: { detach(): void } | null;
    looks: number;
    handle: number | null;
    isDone: boolean;
    hasRefused: boolean;
}

function stopLooking(search: Search, schedule: Scheduler): void {
    assert(search.looks >= 0, "a look that happened is counted");
    search.isDone = true;
    if (search.handle === null) return;
    schedule.cancel(search.handle);
    search.handle = null;
    assert(search.handle === null, "a search that stopped is holding no timer");
}

function look(page: unknown, report: AttachmentReport, schedule: Scheduler, search: Search): void {
    if (search.isDone) return;
    search.looks += 1;
    assert(search.looks <= MAXIMUM_LOOKS, "the search stays inside its stated bound");
    const battle = getBattleFromPage(page);
    if (battle === null) {
        if (search.looks < MAXIMUM_LOOKS) return;
        stopLooking(search, schedule);
        report.handleSearchAbandoned();
        return;
    }
    if (isEngineBattleWrapped(battle)) {
        stopLooking(search, schedule);
        report.handleAnotherReader();
        return;
    }
    assert(!isEngineBattleWrapped(battle), "a game somebody else holds never reaches the wrap");
    search.wrap = wrapEngineBattle(battle, {
        handleBeforeCall: (holding) => report.handleBeforeCall(holding),
        handlePayload: (payload, holding) => report.handlePayload(payload, holding),
        handleFirstFailure: (failure) => report.handleFailure(failure),
    });
    if (search.wrap !== null) {
        stopLooking(search, schedule);
        return;
    }
    // The game is here and the method it is found by is gone. Said once: the looking goes on,
    // and a caller told every time would hear it once a look for a minute.
    if (search.hasRefused) return;
    search.hasRefused = true;
    assert(search.wrap === null, "a refusal is what a page with no method to wrap answers");
    report.handleRefusal();
}

/** Looks now, and keeps looking on the caller's own clock until it finds a game or gives up. */
export function attachToGame(
    page: unknown,
    schedule: Scheduler,
    report: AttachmentReport,
): GameAttachment {
    const search: Search = { wrap: null, looks: 0, handle: null, isDone: false, hasRefused: false };
    look(page, report, schedule, search);
    if (!search.isDone) {
        search.handle = schedule.every(() => look(page, report, schedule, search), LOOK_EVERY_MS);
    }
    assert(search.looks > 0, "the first look happens before any clock is asked for");
    assert(search.looks <= MAXIMUM_LOOKS, "and stays inside the bound like every other");
    return {
        detach(): void {
            stopLooking(search, schedule);
            search.wrap?.detach();
            search.wrap = null;
        },
        isAttached(): boolean {
            return search.wrap !== null;
        },
    };
}
