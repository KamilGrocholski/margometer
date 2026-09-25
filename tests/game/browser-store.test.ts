/**
 * The store a browser lends, including the browser that will not lend one.
 *
 * Every call can throw for reasons that are none of ours (a browser set to forbid storage, a quota
 * already spent), and none is a failure of this add-on's, so each comes back as an answer.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { err } from "#/libs/result.ts";
import {
    initMemoryStore,
    initPageStore,
    type PageStorage,
    STORE_FAILURE,
    STORE_KEY,
    STORE_VALUE_LENGTH_MAXIMUM,
} from "#/src/game/browser-store.ts";

/**
 * A browser that refuses, throwing what one set to forbid storage actually throws: a
 * `SecurityError`, and never anything of ours.
 */
const REFUSAL = new DOMException("this browser forbids storage", "SecurityError");

Deno.test("a store that answers reads back what was written to it", () => {
    const store = initPageStore(composeAnsweringStorage());
    assertEquals(store.read(STORE_KEY.panelFolded), { ok: true, value: null }, "nothing written");
    assertEquals(store.write(STORE_KEY.panelFolded, "1"), { ok: true, value: undefined }, "taken");
    assertEquals(store.read(STORE_KEY.panelFolded), { ok: true, value: "1" }, "and read back");
    store.write(STORE_KEY.panelFolded, "");
    assertEquals(store.read(STORE_KEY.panelFolded), { ok: true, value: "" }, "empty is not none");
    assertEquals(store.remove(STORE_KEY.panelFolded), { ok: true, value: undefined }, "removed");
    assertEquals(store.read(STORE_KEY.panelFolded), { ok: true, value: null }, "and gone");
});

function composeAnsweringStorage(): PageStorage {
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
    const store = initPageStore(composeRefusingStorage());
    const refused = err({ kind: STORE_FAILURE.refused, cause: REFUSAL });
    assertEquals(store.read(STORE_KEY.fights), refused, "a reading that threw is a refusal");
    assertEquals(store.write(STORE_KEY.fights, "{}"), refused, "and so is a refused write");
    assertEquals(store.remove(STORE_KEY.fights), refused, "and a refused removal");
});

function composeRefusingStorage(): PageStorage {
    const refuse = (): never => {
        throw REFUSAL;
    };
    return { getItem: refuse, setItem: refuse, removeItem: refuse };
}

Deno.test("a page that lends no store says so on every call", () => {
    const store = initPageStore(null);
    const unavailable = err({ kind: STORE_FAILURE.unavailable });
    assertEquals(store.read(STORE_KEY.storage), unavailable, "nothing to read from");
    assertEquals(store.write(STORE_KEY.storage, "local"), unavailable, "nothing to write to");
    assertEquals(store.remove(STORE_KEY.storage), unavailable, "nothing to remove from");
});

/**
 * The bound is a refusal, so the shelf's own answer to one, offering less, runs. An assertion at
 * this bound threw out of the payload that ended a fight of twenty long ones.
 */
Deno.test("a value past the bound is refused, and one at the bound is taken", () => {
    const store = initPageStore(composeAnsweringStorage());
    const atBound = "x".repeat(STORE_VALUE_LENGTH_MAXIMUM);
    assertStrictEquals(store.write(STORE_KEY.fights, atBound).ok, true, "the bound is written");
    const past = store.write(STORE_KEY.fights, `${atBound}x`);
    const tooLong = {
        kind: STORE_FAILURE.valueTooLong,
        length: STORE_VALUE_LENGTH_MAXIMUM + 1,
        maximum: STORE_VALUE_LENGTH_MAXIMUM,
    };
    assertEquals(past, err(tooLong), "one past it is refused, by how much");
    assertEquals(store.read(STORE_KEY.fights), { ok: true, value: atBound }, "and wrote nothing");
    const memory = initMemoryStore();
    assertEquals(memory.write(STORE_KEY.fights, `${atBound}x`), past, "in memory as well");
    assertEquals(memory.read(STORE_KEY.fights), { ok: true, value: null }, "which kept nothing");
    assertStrictEquals(memory.write(STORE_KEY.fights, atBound).ok, true, "and takes the bound");
});

Deno.test("a store of this page's own reads back what it was given, and forgets on removal", () => {
    const memory = initMemoryStore();
    assertEquals(memory.read(STORE_KEY.storage), { ok: true, value: null }, "never written");
    memory.write(STORE_KEY.storage, "memory");
    assertEquals(memory.read(STORE_KEY.storage), { ok: true, value: "memory" }, "read back");
    assertEquals(
        memory.read(STORE_KEY.fights),
        { ok: true, value: null },
        "one key is not another",
    );
    memory.remove(STORE_KEY.storage);
    assertEquals(memory.read(STORE_KEY.storage), { ok: true, value: null }, "and removed");
});

Deno.test("a page answering something other than text for a key has nothing under it", () => {
    const odd: PageStorage = {
        getItem: (): string | null => {
            const answered: unknown = 5;
            return answered as string;
        },
        setItem: () => {},
        removeItem: () => {},
    };
    assertEquals(initPageStore(odd).read(STORE_KEY.storage), { ok: true, value: null }, "none");
});
