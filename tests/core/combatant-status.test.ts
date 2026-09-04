/**
 * The payload's own status mask, read bit by bit.
 *
 * The masks here are ones `captures/` states. Which bit means what is the client's, and the count
 * of each over the corpus is `docs/statuses-standing.md`'s.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import {
    decodeStatusesFromMask,
    getStatusKeyForBit,
    MAXIMUM_STATUS_BIT,
    STATUS_KEYS,
} from "@/src/core/combatant-status.ts";

Deno.test("a mask of nothing stands for nothing, and one bit for one status", () => {
    // Zero is a boundary: a combatant with nothing standing, which is a reading and not a gap.
    assertEquals(decodeStatusesFromMask(0), [], "nothing set is nothing standing");
    assertEquals(
        decodeStatusesFromMask(64),
        [{ bit: 6, key: "speed_up" }],
        "64 is the sixth bit, which is the one the corpus states most often",
    );
    assertEquals(
        decodeStatusesFromMask(40).map((one) => one.key),
        ["poisoned", "swow_down"],
        "40 is two of them, in bit order and not in the order the sum is written",
    );
});

/**
 * ⚠️ **The client's own loop stops at bit 8 and the game sets bit 10.** `1056` occurs 12 times
 * over `captures/`, 2026-09-03. A reader that stopped where the client does would lose it.
 */
Deno.test("a bit past the ones the client words is read, and named after nothing", () => {
    assertEquals(
        decodeStatusesFromMask(1056),
        [{ bit: 5, key: "swow_down" }, { bit: 10, key: null }],
        "the tenth bit arrives as a bit, with no name invented for it",
    );
    assertEquals(getStatusKeyForBit(STATUS_KEYS.length), null, "the first bit past the table");
    assertEquals(getStatusKeyForBit(0), "deep_wound", "and the first inside it");
});

Deno.test("a mask setting a bit past the walk is refused rather than quietly cut short", () => {
    const last = decodeStatusesFromMask(2 ** MAXIMUM_STATUS_BIT);
    assertEquals(last, [{ bit: MAXIMUM_STATUS_BIT, key: null }], "the last bit the walk reaches");
    assertThrows(() => decodeStatusesFromMask(2 ** (MAXIMUM_STATUS_BIT + 1)), Error);
    assertThrows(() => decodeStatusesFromMask(-1), Error);
    assert(MAXIMUM_STATUS_BIT > STATUS_KEYS.length, "the walk runs past the words there are");
});
