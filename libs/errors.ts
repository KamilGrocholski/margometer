/**
 * What a returned failure is built from (`AGENTS.md` E1–E4, ADR 0008), shaped like Go's `errors`
 * and holding only what this tree calls: `Caught`, `Known` and `attempt`, the broad catch E4 names.
 */

export class Caught extends Error {
    override readonly name = "Caught";

    constructor(cause: unknown) {
        super(undefined, { cause });
    }
}

/**
 * `unknown | Caught` is `unknown`, and nothing then asks the caller to check: a call answering
 * `unknown` or `any` narrows inside the call, where it still knows what it read.
 */
export type Known<Value> = unknown extends Value ? never : Value;

/** What `call` may hold is E4's, and what a throw out of it becomes is A8's. */
export function attempt<Value>(call: () => Value): Known<Value> | Caught;
export function attempt<Value>(call: () => Value): Value | Caught {
    try {
        return call();
    } catch (cause) {
        return new Caught(cause);
    }
}
