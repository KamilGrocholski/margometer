/**
 * Getting the wrap onto the game, and off again.
 *
 * The wrap knows how to hold a battle object; this knows how to find one, and they are apart
 * because finding is a matter of timing and wrapping is a matter of promises. The game builds its
 * battle once, while the engine starts, and a userscript may arrive on either side of that — so
 * this looks, keeps looking, and stops when it finds one or when the game plainly is not coming.
 * A search with no end is something the page pays for forever.
 */

import { assert } from "@std/assert/assert";
import {
    type EngineBattle,
    type EngineBattleReader,
    isEngineBattleWrapped,
    wrapEngineBattle,
} from "@/src/game/engine-battle-wrap.ts";
import { isRecord } from "@/libs/unknown-reading.ts";

const BATTLE_FIELD = "battle";
/** Both spellings are in the wild, and a client renaming either breaks both readers at once. */
const ENGINE_FIELD = "Engine";
const ENGINE_CALL_FIELD = "getEngine";
/** The field and the call: a page holds a game in two spellings and no more. */
export const ENGINE_SPELLINGS = 2;
const LOOK_EVERY_MILLISECONDS = 250;
/** Four looks a second for a minute. A game that has not arrived by then is not arriving. */
const MAXIMUM_LOOKS = 240;

export interface Scheduler {
    every(step: () => void, everyMilliseconds: number): number;
    cancel(handle: number): void;
}

/**
 * **It is an `EngineBattleReader` and is handed to the wrap as one.** The three members it
 * inherits are what a wrap tells its reader; the four below are what only the search knows —
 * whether one was found, and every way finding one can end.
 */
export interface AttachmentReport extends EngineBattleReader {
    /**
     * The wrap is on and the game is being read, before any payload has arrived. A reader has to
     * be able to tell an add-on waiting for a fight from one that died on the way to the page.
     */
    handleAttached(): void;
    /** A MargoMeter was already reading, so this copy stands down and never counts. */
    handleAnotherReader(): void;
    /** The game is here and will not be wrapped: the method it was found by is gone. */
    handleRefusal(): void;
    handleSearchAbandoned(): void;
}

export interface GameAttachment {
    detach(): void;
    isAttached(): boolean;
}

/** Both spellings, in the order tried. A call into their program may throw, and that is theirs. */
export function readEnginesFromPage(page: unknown): unknown[] {
    if (!isRecord(page)) return [];
    const found: unknown[] = [page[ENGINE_FIELD]];
    const stated = page[ENGINE_CALL_FIELD];
    if (typeof stated === "function") found.push(stated.call(page));
    assert(found.length <= ENGINE_SPELLINGS, "a game is asked for in every spelling and no more");
    return found;
}

function readBattleFromPage(page: unknown): EngineBattle | null {
    const engines = readEnginesFromPage(page);
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
    hasFailed: boolean;
}

function stopLookingForEngine(search: Search, schedule: Scheduler): void {
    assert(search.looks >= 0, "a look that happened is counted");
    search.isDone = true;
    if (search.handle === null) return;
    schedule.cancel(search.handle);
    search.handle = null;
    assert(search.handle === null, "a search that stopped is holding no timer");
}

function lookForEngine(
    page: unknown,
    report: AttachmentReport,
    schedule: Scheduler,
    search: Search,
): void {
    if (search.isDone) return;
    search.looks += 1;
    assert(search.looks <= MAXIMUM_LOOKS, "the search stays inside its stated bound");
    const battle = readBattleFromPage(page);
    if (battle === null) {
        if (search.looks < MAXIMUM_LOOKS) return;
        stopLookingForEngine(search, schedule);
        report.handleSearchAbandoned();
        return;
    }
    if (isEngineBattleWrapped(battle)) {
        stopLookingForEngine(search, schedule);
        report.handleAnotherReader();
        return;
    }
    assert(!isEngineBattleWrapped(battle), "a game somebody else holds never reaches the wrap");
    search.wrap = wrapEngineBattle(battle, report);
    if (search.wrap !== null) {
        stopLookingForEngine(search, schedule);
        report.handleAttached();
        return;
    }
    // The game is here and the method it is found by is gone. Said once: the looking goes on,
    // and a caller told every time would hear it once a look for a minute. It ends where a
    // search finding nothing ends, and says nothing then — the game was there, so the look past
    // the bound is not a search abandoned, and not the assertion above.
    if (search.looks >= MAXIMUM_LOOKS) stopLookingForEngine(search, schedule);
    if (search.hasRefused) return;
    search.hasRefused = true;
    assert(search.wrap === null, "a refusal is what a page with no method to wrap answers");
    report.handleRefusal();
}

/**
 * A look that threw, marked once and charged to the search that made it (**E12**).
 *
 * The clock is the browser's, so a throw out of the step unwinds into the timer, which drops it
 * and fires again a quarter second later: one broken invariant would be reported four times a
 * second for as long as the page is open. A look that threw is still a look, so the search runs
 * out where a search finding nothing runs out, and the page stops paying for it.
 */
function handleLookFailure(
    failure: unknown,
    report: AttachmentReport,
    schedule: Scheduler,
    search: Search,
): void {
    assert(search.looks > 0, "a failure belongs to a look that happened");
    if (!search.hasFailed) {
        search.hasFailed = true;
        report.handleFirstFailure(failure);
    }
    assert(search.hasFailed, "a failure that was marked stays marked");
    if (search.looks < MAXIMUM_LOOKS) return;
    stopLookingForEngine(search, schedule);
    report.handleSearchAbandoned();
}

export function attachToGame(
    page: unknown,
    schedule: Scheduler,
    report: AttachmentReport,
): GameAttachment {
    const search: Search = {
        wrap: null,
        looks: 0,
        handle: null,
        isDone: false,
        hasRefused: false,
        hasFailed: false,
    };
    // ⚠️ **The first look runs on the stack that started the add-on**, where the only thing above
    // it is the game's own page, while every look after it lands in the browser's timer. It is
    // also the look that finds the game on a page that already had one — the common case — so it
    // is the look that mounts the panel, and a throw here reaches the game's console with no
    // add-on behind it. **One guard, spelled once**: two copies of it is how the first look goes
    // out unguarded.
    const look = (): void => {
        try {
            lookForEngine(page, report, schedule, search);
        } catch (failure) {
            handleLookFailure(failure, report, schedule, search);
        }
    };
    look();
    if (!search.isDone) search.handle = schedule.every(look, LOOK_EVERY_MILLISECONDS);
    assert(search.looks > 0, "the first look happens before any clock is asked for");
    assert(search.looks <= MAXIMUM_LOOKS, "and stays inside the bound like every other");
    return {
        detach(): void {
            stopLookingForEngine(search, schedule);
            search.wrap?.detach();
            search.wrap = null;
        },
        isAttached(): boolean {
            return search.wrap !== null;
        },
    };
}
