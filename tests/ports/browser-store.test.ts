/**
 * The store a browser lends, including the browser that will not lend one.
 *
 * Every call can throw for reasons that are none of ours (a browser set to forbid storage, a quota
 * already spent), and none is a failure of this add-on's, so each comes back as an answer.
 */

import { assertInstanceOf, assertNotInstanceOf, assertStrictEquals } from "@std/assert";
import * as errors from "#/libs/errors.ts";
import {
    type BrowserStorage,
    initBrowserStore,
    initMemoryStore,
    STORE_KEY,
    STORE_VALUE_LENGTH_MAXIMUM,
    StoreRefused,
    StoreUnavailable,
    StoreValueTooLong,
} from "#/src/ports/browser-store.ts";

/**
 * A browser that refuses, throwing what one set to forbid storage actually throws: a
 * `SecurityError`, and never anything of ours.
 */
const REFUSAL = new DOMException("this browser forbids storage", "SecurityError");

Deno.test("a store that answers reads back what was written to it", () => {
    const store = initBrowserStore(composeAnsweringStorage());
    assertStrictEquals(store.read(STORE_KEY.meterFolded), null, "nothing written");
    assertStrictEquals(store.write(STORE_KEY.meterFolded, "1"), undefined, "taken");
    assertStrictEquals(store.read(STORE_KEY.meterFolded), "1", "and read back");
    store.write(STORE_KEY.meterFolded, "");
    assertStrictEquals(store.read(STORE_KEY.meterFolded), "", "empty is not none");
    assertStrictEquals(store.delete(STORE_KEY.meterFolded), undefined, "removed");
    assertStrictEquals(store.read(STORE_KEY.meterFolded), null, "and gone");
});

function composeAnsweringStorage(): BrowserStorage {
    const held = new Map<string, string>();
    return {
        getItem: (key) => held.get(key) ?? null,
        setItem: (key, value) => {
            held.set(key, value);
        },
        removeItem: (key) => void held.delete(key),
    };
}

Deno.test("a browser that refuses is answered with its own cause, not thrown out of", () => {
    const store = initBrowserStore(composeRefusingStorage());
    expectRefused(store.read(STORE_KEY.fights), "a reading that threw is a refusal");
    expectRefused(store.write(STORE_KEY.fights, "{}"), "and so is a refused write");
    expectRefused(store.delete(STORE_KEY.fights), "and a refused removal");
});

function expectRefused(answer: unknown, message: string): void {
    assertInstanceOf(answer, StoreRefused, message);
    assertInstanceOf(answer.cause, errors.Caught, `${message}, caught at the call`);
    assertStrictEquals(answer.cause.cause, REFUSAL, `${message}, with the browser's own cause`);
}

function composeRefusingStorage(): BrowserStorage {
    const refuse = (): never => {
        throw REFUSAL;
    };
    return { getItem: refuse, setItem: refuse, removeItem: refuse };
}

Deno.test("a page that lends no store says so on every call", () => {
    const store = initBrowserStore(null);
    assertInstanceOf(store.read(STORE_KEY.storage), StoreUnavailable, "nothing to read from");
    const written = store.write(STORE_KEY.storage, "local");
    assertInstanceOf(written, StoreUnavailable, "nothing to write to");
    assertInstanceOf(store.delete(STORE_KEY.storage), StoreUnavailable, "nothing to remove from");
});

/**
 * The bound is a refusal, so the shelf's own answer to one, offering less, runs. An assertion at
 * this bound threw out of the payload that ended a fight of twenty long ones.
 */
Deno.test("a value past the bound is refused, and one at the bound is taken", () => {
    const store = initBrowserStore(composeAnsweringStorage());
    const atBound = "x".repeat(STORE_VALUE_LENGTH_MAXIMUM);
    assertStrictEquals(store.write(STORE_KEY.fights, atBound), undefined, "the bound is written");
    expectTooLong(
        store.write(STORE_KEY.fights, `${atBound}x`),
        "one past it is refused, by how much",
    );
    assertStrictEquals(store.read(STORE_KEY.fights), atBound, "and wrote nothing");
    const memory = initMemoryStore();
    expectTooLong(memory.write(STORE_KEY.fights, `${atBound}x`), "in memory as well");
    assertStrictEquals(memory.read(STORE_KEY.fights), null, "which kept nothing");
    assertStrictEquals(memory.write(STORE_KEY.fights, atBound), undefined, "and takes the bound");
});

function expectTooLong(answer: unknown, message: string): void {
    assertInstanceOf(answer, StoreValueTooLong, message);
    assertStrictEquals(answer.length, STORE_VALUE_LENGTH_MAXIMUM + 1, `${message}: its length`);
    assertStrictEquals(answer.maximum, STORE_VALUE_LENGTH_MAXIMUM, `${message}: the bound`);
}

Deno.test("a store of this page's own reads back what it was given, and forgets on removal", () => {
    const memory = initMemoryStore();
    assertStrictEquals(memory.read(STORE_KEY.storage), null, "never written");
    memory.write(STORE_KEY.storage, "memory");
    assertStrictEquals(memory.read(STORE_KEY.storage), "memory", "read back");
    assertStrictEquals(memory.read(STORE_KEY.fights), null, "one key is not another");
    memory.delete(STORE_KEY.storage);
    assertStrictEquals(memory.read(STORE_KEY.storage), null, "and removed");
});

Deno.test("a page answering something other than text for a key has nothing under it", () => {
    const odd: BrowserStorage = {
        getItem: (): string | null => {
            const answered: unknown = 5;
            return answered as string;
        },
        setItem: () => {},
        removeItem: () => {},
    };
    const read = initBrowserStore(odd).read(STORE_KEY.storage);
    assertNotInstanceOf(read, Error, "an odd answer is no failure");
    assertStrictEquals(read, null, "none");
});
