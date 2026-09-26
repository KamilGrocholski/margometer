/**
 * A failure that can happen is returned as an `Error` of its own class, never thrown: `AGENTS.md`
 * E1–E4, ADR 0008. Shaped like Go's `errors`, and holding only what this tree calls.
 *
 * The one broad catch of the add-on stands here, and each call to it sits at one of E5's
 * boundaries.
 */

/** What a `catch` held, whatever was thrown, as the `cause`. */
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

/**
 * The `try` holds a call into somebody else's code, or our own at a boundary, where an assertion
 * that fires is a bug of ours and is not told apart from any other throw (A8).
 */
export function attempt<Value>(call: () => Value): Known<Value> | Caught;
export function attempt<Value>(call: () => Value): Value | Caught {
    try {
        return call();
    } catch (cause) {
        return new Caught(cause);
    }
}
