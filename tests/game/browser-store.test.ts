/**
 * The store a browser lends, including the browser that will not lend one.
 *
 * Both calls can throw for reasons that are none of ours — a browser set to forbid storage, a
 * quota already spent — and neither is a failure of this add-on's, so both come back as answers.
 */

import { assert, assertEquals } from "@std/assert";
import { composeBrowserStore, type PageStorage } from "@/src/game/browser-store.ts";

/**
 * A browser that refuses. It throws what one set to forbid storage actually throws — a
 * `SecurityError` — rather than anything of ours: the point of the wrapper is that a failure
 * arriving from somebody else's implementation never reaches a caller.
 */
function composeRefusingStorage(): PageStorage {
    const refuse = (): never => {
        throw new DOMException("this browser forbids storage", "SecurityError");
    };
    return { getItem: refuse, setItem: refuse, removeItem: refuse };
}

Deno.test("a store that answers reads back what was written to it", () => {
    const held = new Map<string, string>();
    const store = composeBrowserStore({
        getItem: (key) => held.get(key) ?? null,
        setItem: (key, value) => {
            held.set(key, value);
        },
        removeItem: (key) => void held.delete(key),
    });
    assertEquals(store.read("MargoMeter-folded"), null, "nothing was written, so nothing reads");
    assertEquals(store.write("MargoMeter-folded", "1"), true, "a write a browser took says so");
    assertEquals(store.read("MargoMeter-folded"), "1", "and reads back as what was written");
    assertEquals(store.write("MargoMeter-folded", ""), true, "the empty answer is written too");
    assertEquals(store.read("MargoMeter-folded"), "", "and is not the same as nothing at all");
});

Deno.test("a browser that refuses is answered, not thrown out of", () => {
    const store = composeBrowserStore(composeRefusingStorage());
    assertEquals(store.read("MargoMeter-fights"), null, "a reading that threw has nothing in it");
    assertEquals(store.write("MargoMeter-fights", "{}"), false, "and a refused write says false");
    assert(store.read("MargoMeter-folded") === null, "a second key fares no differently");
});
