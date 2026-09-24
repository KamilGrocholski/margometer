/**
 * A failure that can happen is returned, never thrown: `docs/design.md` §3, `AGENTS.md` E1–E4.
 *
 * The two broad catches of the add-on stand here and nowhere else. Each call to either sits at one
 * of E5's boundaries.
 */

import { assert } from "@std/assert/assert";

export interface Ok<Value> {
    readonly ok: true;
    readonly value: Value;
}

export interface Err<Failure> {
    readonly ok: false;
    readonly error: Failure;
}

export type Result<Value, Failure extends Fault> = Ok<Value> | Err<Failure>;

export interface Fault {
    readonly kind: string;
}

export const RESULT_FAILURE = {
    foreignThrew: "foreign-threw",
    invariantBroken: "invariant-broken",
} as const;

/** The only place `cause: unknown` stands for code this project did not write. */
export interface ForeignFailure extends Fault {
    readonly kind: typeof RESULT_FAILURE.foreignThrew;
    readonly cause: unknown;
}

export interface BrokenInvariant extends Fault {
    readonly kind: typeof RESULT_FAILURE.invariantBroken;
    readonly cause: unknown;
}

export function ok<Value>(value: Value): Ok<Value> {
    return { ok: true, value };
}

export function err<Failure extends Fault>(error: Failure): Err<Failure> {
    assert(error.kind.length > 0, "a failure names its kind");
    return { ok: false, error };
}

/** The `try` holds the call into somebody else's code and nothing of ours. */
export function callForeign<Value>(call: () => Value): Result<Value, ForeignFailure> {
    let value: Value;
    try {
        value = call();
    } catch (cause) {
        return { ok: false, error: { kind: RESULT_FAILURE.foreignThrew, cause } };
    }
    return ok(value);
}

/**
 * Our own code at a boundary: an assertion that fires becomes a record. Anything else thrown here
 * is a bug of ours as well, so it is not told apart (A8).
 */
export function runGuarded<Value>(step: () => Value): Result<Value, BrokenInvariant> {
    let value: Value;
    try {
        value = step();
    } catch (cause) {
        return { ok: false, error: { kind: RESULT_FAILURE.invariantBroken, cause } };
    }
    return ok(value);
}
