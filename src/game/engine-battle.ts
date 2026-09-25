/**
 * The running fight on the game's page, and the one change this add-on makes to the game: a wrap
 * of its `updateData` (`docs/design.md` §5, §10.2). The wrap semantics are carried over from
 * `develop`: the engine's own call runs first and its value comes back untouched, its exception
 * reaches the game as it would have, and a failure of ours never leaves this file.
 */

import { assert } from "@std/assert/assert";
import {
    type BrokenInvariant,
    callForeign,
    err,
    type ForeignFailure,
    ok,
    type Result,
    runGuarded,
} from "@/libs/result.ts";
import { isRecord } from "@/libs/unknown-value.ts";
import type { VocabularyWord } from "@/libs/vocabulary.ts";
import {
    readWarriorSnapshot,
    type WarriorFailure,
    type WarriorSnapshot,
} from "@/src/game/warrior-snapshot.ts";

export const ENGINE_FAILURE = {
    engineAbsent: "engine-absent",
    battleAbsent: "battle-absent",
    methodAbsent: "method-absent",
    anotherReader: "another-reader",
    searchAbandoned: "search-abandoned",
    detachForeignLayer: "detach-foreign-layer",
} as const;

export type EngineFailure =
    | { kind: typeof ENGINE_FAILURE.engineAbsent }
    | { kind: typeof ENGINE_FAILURE.battleAbsent }
    | { kind: typeof ENGINE_FAILURE.methodAbsent }
    | { kind: typeof ENGINE_FAILURE.anotherReader }
    | { kind: typeof ENGINE_FAILURE.searchAbandoned; looks: number; maximum: number }
    | { kind: typeof ENGINE_FAILURE.detachForeignLayer };

export type EngineFailureKind = VocabularyWord<typeof ENGINE_FAILURE>;

/** Called in the game's stack. */
export interface PayloadListener {
    onBeforeCall(): void;
    onPayload(payload: unknown): void;
}

export interface WrapHandle {
    /** Puts back what was there, and only where ours is still the outermost layer. */
    detach(): Result<void, EngineFailure>;
    /** Failures of ours the wrap caught: the listener guards itself, so this is what escaped. */
    getFailureCount(): number;
    getFirstFailure(): BrokenInvariant | null;
}

export interface EngineBattle {
    wrap(listener: PayloadListener): Result<WrapHandle, EngineFailure>;
    readWarriors(): Result<WarriorSnapshot, WarriorFailure | ForeignFailure>;
}

export interface EnginePort {
    readBattle(): Result<EngineBattle, EngineFailure | ForeignFailure>;
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

type Wrapper = ((this: unknown, ...args: unknown[]) => unknown) & { [WRAP_MARKER]?: number };

/** The page's game, in whichever spelling answers. A call into the page may throw: theirs. */
export function initPageEngine(page: unknown): EnginePort {
    return {
        readBattle() {
            const engines = callForeign(() => readPageEngines(page));
            if (!engines.ok) return engines;
            if (engines.value.length === 0) return err({ kind: ENGINE_FAILURE.engineAbsent });
            const battle = lookupEngineBattle(engines.value);
            if (battle === null) return err({ kind: ENGINE_FAILURE.battleAbsent });
            return ok(initBattle(battle));
        },
    };
}

/** Both spellings of the game a page holds, in the order tried; a call into the page is theirs. */
export function readPageEngines(page: unknown): Record<string, unknown>[] {
    if (!isRecord(page)) return [];
    const found: unknown[] = [page[ENGINE_FIELD]];
    const stated = page[ENGINE_CALL_FIELD];
    if (typeof stated === "function") found.push(Reflect.apply(stated, page, []));
    return found.filter(isWritableRecord);
}

/** The battle a page's game holds, or null; a call into the page may throw, and it is theirs. */
export function readPageBattle(page: unknown): Record<string, unknown> | null {
    return lookupEngineBattle(readPageEngines(page));
}

function lookupEngineBattle(engines: readonly Record<string, unknown>[]) {
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

function initBattle(battle: Record<string, unknown>): EngineBattle {
    return {
        wrap: (listener) => wrapBattle(battle, listener),
        readWarriors() {
            const read = callForeign(() => readWarriorSnapshot(battle));
            if (!read.ok) return read;
            return read.value;
        },
    };
}

function isOurWrap(value: unknown): boolean {
    if (typeof value !== "function") return false;
    return WRAP_MARKER in value;
}

function wrapBattle(
    battle: Record<string, unknown>,
    listener: PayloadListener,
): Result<WrapHandle, EngineFailure> {
    const original = battle[WRAPPED_METHOD];
    if (typeof original !== "function") return err({ kind: ENGINE_FAILURE.methodAbsent });
    if (isOurWrap(original)) return err({ kind: ENGINE_FAILURE.anotherReader });
    const failures: { count: number; first: BrokenInvariant | null } = { count: 0, first: null };
    const count = (failure: BrokenInvariant): void => {
        if (failures.count >= FAILURES_MAXIMUM) return;
        failures.count += 1;
        if (failures.first === null) failures.first = failure;
    };
    // Two guards and not one: a throw before the call must not skip the reading after it.
    const wrapper: Wrapper = function (this: unknown, ...args: unknown[]): unknown {
        const before = runGuarded(() => listener.onBeforeCall());
        if (!before.ok) count(before.error);
        const answer: unknown = Reflect.apply(original, this, args);
        const after = runGuarded(() => listener.onPayload(args[0]));
        if (!after.ok) count(after.error);
        return answer;
    };
    wrapper[WRAP_MARKER] = WRAP_VERSION;
    battle[WRAPPED_METHOD] = wrapper;
    assert(isOurWrap(battle[WRAPPED_METHOD]), "the wrap that went on says whose it is");
    assert(battle[WRAPPED_METHOD] !== original, "and stands where the engine's own stood");
    return ok({
        detach() {
            if (battle[WRAPPED_METHOD] !== wrapper) {
                return err({ kind: ENGINE_FAILURE.detachForeignLayer });
            }
            battle[WRAPPED_METHOD] = original;
            return ok(undefined);
        },
        getFailureCount: () => failures.count,
        getFirstFailure: () => failures.first,
    });
}
