/**
 * Getting the wrap onto the game (`docs/design.md` §10.1). The game builds its battle once, while
 * its engine starts, and a userscript may arrive on either side of that: so this looks, keeps
 * looking, and stops when it finds one or when the game plainly is not coming. A search with no
 * end is something the page pays for forever.
 */

import { assert } from "@std/assert/assert";
import {
    type BrokenInvariant,
    type ForeignFailure,
    RESULT_FAILURE,
    runGuarded,
} from "#/libs/result.ts";
import {
    ENGINE_FAILURE,
    type EngineFailure,
    type EnginePort,
    type PayloadListener,
    type WrapHandle,
} from "#/src/game/engine-battle.ts";
import type { IntervalHandle, IntervalScheduler } from "#/src/game/page-interval.ts";

/** How a search ends, and the one thing it says on the way. Each is said once. */
export interface SearchReport {
    onAttached(wrap: WrapHandle): void;
    /** A MargoMeter already holds the game, so this copy stands down and never counts. */
    onStoodDown(failure: EngineFailure): void;
    /** The game is here, and the method it is read by is not: said once, the looking goes on. */
    onRefused(failure: EngineFailure): void;
    onAbandoned(failure: EngineFailure): void;
    /** A look that failed, the first time one does. The looking goes on to its bound. */
    onLookFailed(failure: BrokenInvariant | ForeignFailure): void;
}

export interface EngineSearch {
    /** Stops looking. A wrap already on stays on: taking it off is the wrap's own `detach`. */
    stop(): void;
    isDone(): boolean;
}

interface Search {
    looks: number;
    isDone: boolean;
    hasRefused: boolean;
    hasFailed: boolean;
    handle: IntervalHandle | null;
}

const LOOK_EVERY_MILLISECONDS = 250;
/** Four looks a second for a minute. A game that has not arrived by then is not arriving. */
export const LOOKS_MAXIMUM = 240;

export function startEngineSearch(
    engine: EnginePort,
    interval: IntervalScheduler,
    listener: PayloadListener,
    report: SearchReport,
): EngineSearch {
    const search: Search = {
        looks: 0,
        isDone: false,
        hasRefused: false,
        hasFailed: false,
        handle: null,
    };
    // ⚠️ The report is ours and may break, and two of its calls stand on the stack that started
    // the add-on, outside any look's guard. One guard here covers all of them: a report that
    // breaks has nowhere further to go, and the search has already counted the look it failed on.
    const onLookFailure = (failure: BrokenInvariant | ForeignFailure): void => {
        void runGuarded(() => failLook(search, report, failure));
    };
    // ⚠️ The first look runs on the stack that started the add-on, where only the game's own page
    // stands above it; every look after it runs in the browser's timer. One guard for both.
    const first = runGuarded(() => look(search, engine, listener, report));
    if (!first.ok) onLookFailure(first.error);
    if (!search.isDone) {
        const started = interval.every(
            () => look(search, engine, listener, report),
            LOOK_EVERY_MILLISECONDS,
            onLookFailure,
        );
        if (started.ok) search.handle = started.value;
        else onLookFailure(started.error);
    }
    return {
        stop: () => stopLooking(search),
        isDone: () => search.isDone,
    };
}

/** A look that failed is still a look, so the search runs out where one finding nothing does. */
function failLook(
    search: Search,
    report: SearchReport,
    failure: BrokenInvariant | ForeignFailure,
): void {
    if (!search.hasFailed) {
        search.hasFailed = true;
        report.onLookFailed(failure);
    }
    abandonAtBound(search, report);
}

function abandonAtBound(search: Search, report: SearchReport): void {
    if (search.looks < LOOKS_MAXIMUM) return;
    if (search.isDone) return;
    stopLooking(search);
    const looks = search.looks;
    report.onAbandoned({ kind: ENGINE_FAILURE.searchAbandoned, looks, maximum: LOOKS_MAXIMUM });
}

/**
 * ⚠️ The clock is the page's, and a cancel it refuses leaves a search that is done and a timer that
 * finds it done at every tick, which is the one thing the refusal can cost; so it is not reported.
 */
function stopLooking(search: Search): void {
    search.isDone = true;
    const handle = search.handle;
    search.handle = null;
    if (handle === null) return;
    void handle.cancel();
}

function look(
    search: Search,
    engine: EnginePort,
    listener: PayloadListener,
    report: SearchReport,
): void {
    if (search.isDone) return;
    search.looks += 1;
    assert(search.looks <= LOOKS_MAXIMUM, "the search stays inside its stated bound");
    const battle = engine.readBattle();
    if (!battle.ok) {
        if (battle.error.kind === RESULT_FAILURE.foreignThrew) {
            failLook(search, report, battle.error);
        } else abandonAtBound(search, report);
        return;
    }
    const wrapped = battle.value.wrap(listener);
    if (wrapped.ok) {
        stopLooking(search);
        report.onAttached(wrapped.value);
        return;
    }
    if (wrapped.error.kind === ENGINE_FAILURE.anotherReader) {
        stopLooking(search);
        report.onStoodDown(wrapped.error);
        return;
    }
    // The game is here and its method is gone. Said once; the looking ends where a search
    // finding nothing ends, and says nothing then: the game was there, so it was not abandoned.
    if (search.looks >= LOOKS_MAXIMUM) stopLooking(search);
    if (search.hasRefused) return;
    search.hasRefused = true;
    report.onRefused(wrapped.error);
}
