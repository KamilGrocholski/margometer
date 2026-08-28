/**
 * The one function here that changes the running game, in a file of its own so it is visible.
 *
 * The engine's own call runs first and its value comes back untouched; a failure of ours never
 * leaves this file. The engine arrives as an argument, so the global read stays in the caller.
 */

import { assert } from "@std/assert";

/** Production build `1785244275300`: `on_f` ends with `Engine.battle.updateData(e, t)`. */
const WRAPPED_METHOD = "updateData";
/** The name is the contract, not the value: a wrap of ours from any build is a second count. */
const WRAP_MARKER = "__margometerBattleWrap";
const WRAP_VERSION = 1;

/** The battle object as this file uses it: one method, and nothing else assumed. */
export type EngineBattle = Record<string, unknown>;

type EngineUpdate = (this: unknown, ...args: unknown[]) => unknown;
type WrappedUpdate = EngineUpdate & { [WRAP_MARKER]?: unknown };

export interface EngineBattleWrap {
    /** Puts back what was there, and only where ours is still the outermost layer. */
    detach(): void;
    /** Failures of ours the wrap swallowed. The first is reported; the rest are counted. */
    getFailureCount(): number;
}

/** By the marker's presence, whatever its value: any MargoMeter is a second count. */
export function isEngineBattleWrapped(battle: EngineBattle): boolean {
    return hasMargoMeterWrap(battle[WRAPPED_METHOD]);
}

function hasMargoMeterWrap(value: unknown): boolean {
    if (typeof value !== "function") return false;
    return WRAP_MARKER in value;
}

/**
 * Null where another MargoMeter already holds the engine, which is the whole of standing down,
 * and null where the method is not a function at all.
 */
export function wrapEngineBattle(
    battle: EngineBattle,
    handlePayload: (payload: unknown) => void,
    handleFirstFailure: (failure: unknown) => void,
): EngineBattleWrap | null {
    const original = battle[WRAPPED_METHOD];
    if (typeof original !== "function") return null;
    if (hasMargoMeterWrap(original)) return null;
    // `typeof value === "function"` narrows to `Function`, whose `apply` answers `any`. Naming
    // the signature is what keeps the call below typed rather than silently untyped.
    const engineUpdate = original as EngineUpdate;
    let failures = 0;
    const wrapper: WrappedUpdate = function (this: unknown, ...args: unknown[]): unknown {
        const answer = engineUpdate.apply(this, args);
        try {
            handlePayload(args[0]);
        } catch (failure) {
            failures += 1;
            if (failures === 1) handleFirstFailure(failure);
        }
        return answer;
    };
    wrapper[WRAP_MARKER] = WRAP_VERSION;
    battle[WRAPPED_METHOD] = wrapper;
    assert(hasMargoMeterWrap(battle[WRAPPED_METHOD]), "the wrap that went on says whose it is");
    assert(battle[WRAPPED_METHOD] !== engineUpdate, "and stands where the engine's own stood");
    return {
        detach(): void {
            if (battle[WRAPPED_METHOD] !== wrapper) return;
            battle[WRAPPED_METHOD] = engineUpdate;
        },
        getFailureCount(): number {
            assert(failures >= 0, "a count of failures never falls below nothing");
            return failures;
        },
    };
}
