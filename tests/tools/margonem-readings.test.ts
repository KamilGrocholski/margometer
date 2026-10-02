/**
 * Whether a reading is still the game's, decided over manifests and over what a freeze would
 * write rather than over a cache, and what a preview says of the development client. Every
 * verdict here is taken on a value handed in, so the gate needs no `.cache/` and no network to
 * prove the comparison. Each row is proved on a sample it must call stale and one it must not:
 * only the second catches a reader that has stopped comparing anything.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import type { CachedMargonemClientSource } from "#/tools/margonem-client-source.ts";
import type { FrozenFiles } from "#/tools/frozen-files.ts";
import {
    composeBitShifts,
    composeDumpState,
    composeFrozenState,
    composeKeyDifference,
    composeMargonemClientState,
    composeUnaskedMargonemClientState,
    EXIT_AHEAD,
    EXIT_STALE,
    EXIT_UNASKED,
    formatReadingLine,
    formatRefreshLine,
    READING_VERDICT,
} from "#/tools/margonem-readings.ts";

const HELD_BUILD = "heldBuild";
const READ_BUILD = "readBuild";
const READ_AT = "2026-08-09T12:00:00.000Z";
const READ_AT_MILLISECONDS = Date.parse(READ_AT);
const MILLISECONDS_PER_DAY = 86_400_000;

Deno.test("a row says which reading it is about and what the verdict was", () => {
    const says = "served x";
    const current = formatReadingLine({ name: "client", verdict: READING_VERDICT.current, says });
    assertStringIncludes(current, "client", "the row names its reading");
    assert(current.endsWith("current"), "and ends in the verdict");
    const stale = formatReadingLine({ name: "client", verdict: READING_VERDICT.stale, says });
    assert(stale.endsWith("STALE"), "the other verdict is the loud one");
    assert(!stale.includes("current"), "and never carries both");
    const unasked = formatReadingLine({ name: "client", verdict: READING_VERDICT.unknown, says });
    assert(unasked.endsWith("UNKNOWN"), "and a world nobody asked is neither of the two");
});

Deno.test("the cached bundle is current only where it is the one being served", () => {
    assertEquals(
        composeMargonemClientState("abc", composeCachedMargonemClient("abc")).verdict,
        "current",
    );
    assertEquals(
        composeMargonemClientState("abc", composeCachedMargonemClient("xyz")).verdict,
        "stale",
    );
    const absent = composeMargonemClientState("abc", null);
    assertEquals(absent.verdict, "stale", "a cache nobody filled is not current either");
    assertStringIncludes(absent.says, "nothing cached", "which the row says rather than implies");
});

function composeCachedMargonemClient(build: string): CachedMargonemClientSource {
    return {
        channel: "production",
        build,
        host: "https://tempest.margonem.pl",
        fetchedAt: READ_AT,
        bundlePath: ".cache/game-client/production/main.js",
    };
}

Deno.test("a frozen reading is current where a freeze off the cache would leave it standing", () => {
    const kept = composeDecidedFreeze({ hasMoved: false, heldDate: HELD_BUILD, date: HELD_BUILD });
    const current = composeFrozenState("frozen keys", "keys", kept);
    assertEquals(current.verdict, "current", "a newer build that gave the same keys");
    assertStringIncludes(current.says, READ_BUILD, "the row states the build it read");
    assertStringIncludes(current.says, HELD_BUILD, "and the one the table is still dated by");
    const moved = composeDecidedFreeze({ hasMoved: true, heldDate: HELD_BUILD, date: READ_BUILD });
    assertEquals(composeFrozenState("frozen keys", "keys", moved).verdict, "stale", "keys moved");
    const absent = composeFrozenState("frozen keys", "keys", null);
    assertEquals(absent.verdict, "stale", "a cache nobody filled is not current either");
    assertStringIncludes(absent.says, "nothing cached", "which the row says rather than implies");
});

function composeDecidedFreeze(
    decided: Pick<FrozenFiles, "hasMoved" | "heldDate" | "date">,
): FrozenFiles {
    return { paths: ["frozen/a.ts"], texts: ["a"], readDate: READ_BUILD, count: 3, ...decided };
}

Deno.test("a refresh says whether it rewrote a reading or left it standing", () => {
    const moved = composeDecidedFreeze({ hasMoved: true, heldDate: HELD_BUILD, date: READ_BUILD });
    assertStringIncludes(formatRefreshLine("frozen keys", "keys", moved), `moved to ${READ_BUILD}`);
    const kept = composeDecidedFreeze({ hasMoved: false, heldDate: HELD_BUILD, date: HELD_BUILD });
    const line = formatRefreshLine("frozen keys", "keys", kept);
    assertStringIncludes(line, `unchanged since ${HELD_BUILD}`, "the date it still stands on");
    assert(!line.includes("moved"), "and never both");
});

Deno.test("a fetched page goes stale on a floor, and the day before it does not", () => {
    const at = (days: number) => READ_AT_MILLISECONDS + days * MILLISECONDS_PER_DAY;
    assertEquals(composeDumpState("help dump", "v", READ_AT, at(0)).verdict, "current", "now");
    assertEquals(composeDumpState("help dump", "v", READ_AT, at(6)).verdict, "current", "at six");
    assertEquals(composeDumpState("help dump", "v", READ_AT, at(7)).verdict, "stale", "at seven");
    assertEquals(composeDumpState("help dump", "v", null, at(7)).verdict, "stale", "none cached");
});

Deno.test("a world that did not answer is said as that, and never as a stale reading", () => {
    // The fix for one is to wait and for the other to refresh, so the row a person reads names it.
    const unasked = composeUnaskedMargonemClientState("https://tempest.margonem.pl did not answer");
    assertEquals(unasked.verdict, "unknown", "nobody could ask, so nothing is claimed");
    assertEquals(unasked.name, "client", "and it stands in the row that needed the network");
    assert(!formatReadingLine(unasked).includes("STALE"), "never wearing the other verdict");
    assert(EXIT_STALE > 0, "a reading that went behind never ends a work round quietly");
    assert(EXIT_UNASKED > 0, "and neither does a world that could not be asked");
});

Deno.test("a preview names the keys development adds and drops, and nothing it shares", () => {
    const same = composeKeyDifference(["a", "b"], ["b", "a"]);
    assertEquals(same, { added: [], removed: [] }, "order is not a difference in a set of keys");
    const moved = composeKeyDifference(["a", "b", "c"], ["d", "b", "a"]);
    assertEquals(moved, { added: ["d"], removed: ["c"] }, "one added, one dropped");
    assert(EXIT_AHEAD > 0, "a development client ahead of the frozen one is said by the exit");
});

Deno.test("a preview names every bit that moved, since a mask is read by position", () => {
    assertEquals(composeBitShifts(["a", "b"], ["a", "b"]), [], "the same order moves nothing");
    assertEquals(
        composeBitShifts(["a", "b"], ["x", "a", "b"]),
        [
            { bit: 0, frozen: "a", lifted: "x" },
            { bit: 1, frozen: "b", lifted: "a" },
            { bit: 2, frozen: null, lifted: "b" },
        ],
        "one status inserted ahead renames every bit after it",
    );
    assertEquals(
        composeBitShifts(["a", "b"], ["a"]),
        [{ bit: 1, frozen: "b", lifted: null }],
        "and one dropped from the end is the last bit gone",
    );
});
