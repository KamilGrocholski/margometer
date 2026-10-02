/**
 * The running fight on the game's page, and the one change this add-on makes to the game: a wrap
 * of its `updateData` (`docs/design.md` §5, §10.2). The wrap semantics are carried over from
 * `develop`: the engine's own call runs first and its value comes back untouched, its exception
 * reaches the game as it would have, and a failure of ours never leaves this file.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import {
    type MargonemEngineWarriorFailure,
    type MargonemEngineWarriorSnapshot,
    readMargonemEngineWarriorSnapshot,
} from "./margonem-engine-warriors.ts";

export class MargonemEngineAbsent extends Error {
    override readonly name = "MargonemEngineAbsent";
}

export class MargonemEngineBattleAbsent extends Error {
    override readonly name = "MargonemEngineBattleAbsent";
}

export class MargonemEngineMethodAbsent extends Error {
    override readonly name = "MargonemEngineMethodAbsent";
}

/** A wrap of ours already stands: another copy of the add-on is reading this fight. */
export class MargonemEngineAlreadyWrapped extends Error {
    override readonly name = "MargonemEngineAlreadyWrapped";
}

export class SearchAbandoned extends Error {
    override readonly name = "SearchAbandoned";
    readonly looks: number;
    readonly maximum: number;

    constructor(looks: number, maximum: number) {
        super();
        this.looks = looks;
        this.maximum = maximum;
    }
}

export class WrapCovered extends Error {
    override readonly name = "WrapCovered";
}

export type MargonemEngineFailure =
    | MargonemEngineAbsent
    | MargonemEngineBattleAbsent
    | MargonemEngineMethodAbsent
    | MargonemEngineAlreadyWrapped
    | SearchAbandoned
    | WrapCovered;

/** Called in the game's stack. */
export interface PayloadListener {
    onBeforeCall(): void;
    onPayload(payload: unknown): void;
}

export interface WrapHandle {
    /** Puts back what was there, and only where ours is still the outermost layer. */
    detach(): undefined | MargonemEngineFailure;
    /** Failures of ours the wrap caught: the listener guards itself, so this is what escaped. */
    getFailureCount(): number;
    getFirstFailure(): errors.Caught | null;
}

export interface MargonemEngineBattle {
    wrap(listener: PayloadListener): WrapHandle | MargonemEngineFailure;
    readWarriors():
        | MargonemEngineWarriorSnapshot
        | MargonemEngineWarriorFailure
        | errors.Caught;
}

export interface MargonemEngineBattlePort {
    readBattle(): MargonemEngineBattle | MargonemEngineFailure | errors.Caught;
}

/** Both spellings are in the wild, and a client renaming either breaks both readers at once. */
const ENGINE_FIELD = "Engine";
const ENGINE_CALL_FIELD = "getEngine";
const BATTLE_FIELD = "battle";
/** Production build `1785244275300`: `on_f` ends with `Engine.battle.updateData(e, t)`. */
const WRAPPED_METHOD = "updateData";
/** The name is the contract, not the value: a wrap of ours from any build is a second count. */
const WRAP_MARKER = "__margometerBattleWrap";
const WRAP_VERSION = 1;
/** Past anything a fight produces: a wrap failing this often has stopped working. */
const FAILURES_MAXIMUM = 1048576;

/** The page's game, in whichever spelling answers. A call into the page may throw: theirs. */
export function initMargonemEngineBattle(browserWindow: unknown): MargonemEngineBattlePort {
    return {
        readBattle() {
            const engines = errors.attempt(() => readMargonemEngines(browserWindow));
            if (engines instanceof Error) return engines;
            if (engines.length === 0) return new MargonemEngineAbsent();
            const battle = lookupMargonemEngineBattle(engines);
            if (battle === null) return new MargonemEngineBattleAbsent();
            return {
                // Put the wrap on the engine's own method.
                wrap: (listener): WrapHandle | MargonemEngineFailure => {
                    const original = battle[WRAPPED_METHOD];
                    if (typeof original !== "function") return new MargonemEngineMethodAbsent();
                    if (isOurWrap(original)) return new MargonemEngineAlreadyWrapped();
                    const failures: { count: number; first: errors.Caught | null } = {
                        count: 0,
                        first: null,
                    };
                    const count = (failure: errors.Caught): void => {
                        if (failures.count >= FAILURES_MAXIMUM) return;
                        failures.count += 1;
                        if (failures.first === null) failures.first = failure;
                    };
                    // Two guards and not one: a throw before the call must not skip the reading
                    // after it.
                    const wrap = function (this: unknown, ...args: unknown[]): unknown {
                        const before = errors.attempt(() => listener.onBeforeCall());
                        if (before instanceof Error) count(before);
                        const answer: unknown = Reflect.apply(original, this, args);
                        const after = errors.attempt(() => listener.onPayload(args[0]));
                        if (after instanceof Error) count(after);
                        return answer;
                    };
                    const wrapper = Object.assign(wrap, { [WRAP_MARKER]: WRAP_VERSION });
                    battle[WRAPPED_METHOD] = wrapper;
                    assert(
                        isOurWrap(battle[WRAPPED_METHOD]),
                        "the wrap that went on says whose it is",
                    );
                    assert(
                        battle[WRAPPED_METHOD] !== original,
                        "and stands where the engine's own stood",
                    );
                    return {
                        detach() {
                            if (battle[WRAPPED_METHOD] !== wrapper) return new WrapCovered();
                            battle[WRAPPED_METHOD] = original;
                            return undefined;
                        },
                        getFailureCount: () => failures.count,
                        getFirstFailure: () => failures.first,
                    };
                },
                readWarriors() {
                    return errors.attempt(() => readMargonemEngineWarriorSnapshot(battle));
                },
            };
        },
    };
}

function lookupMargonemEngineBattle(engines: readonly Record<string, unknown>[]) {
    for (const engine of engines) {
        const battle = engine[BATTLE_FIELD];
        if (isWritableRecord(battle)) return battle;
    }
    return null;
}

/** The battle is written to once, by the wrap, which `isRecord`'s read-only reading refuses. */
function isWritableRecord(value: unknown): value is Record<string, unknown> {
    return isRecord(value);
}

function isOurWrap(value: unknown): boolean {
    if (typeof value !== "function") return false;
    return WRAP_MARKER in value;
}

/** Both spellings of the game a page holds, in the order tried; a call into the page is theirs. */
export function readMargonemEngines(browserWindow: unknown): Record<string, unknown>[] {
    if (!isRecord(browserWindow)) return [];
    const engineCandidates: unknown[] = [browserWindow[ENGINE_FIELD]];
    const getEngine = browserWindow[ENGINE_CALL_FIELD];
    if (typeof getEngine === "function") {
        engineCandidates.push(Reflect.apply(getEngine, browserWindow, []));
    }
    return engineCandidates.filter(isWritableRecord);
}

/** The battle a page's game holds, or null; a call into the page may throw, and it is theirs. */
export function readMargonemEngineBattle(browserWindow: unknown): Record<string, unknown> | null {
    return lookupMargonemEngineBattle(readMargonemEngines(browserWindow));
}
