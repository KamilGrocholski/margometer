/**
 * Whether a reading is still the game's, decided over manifests rather than over a cache. Every
 * verdict here is taken on a value handed in, so the gate needs no `.cache/` and no network to
 * prove the comparison. Each row is proved on a sample it must call stale and one it must not:
 * only the second catches a reader that has stopped comparing anything.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { FROZEN_HELP_PHRASES } from "#/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "#/frozen/protocol-keys.ts";
import type { CachedClientSource } from "#/tools/game-client-source.ts";
import {
    type BuildReading,
    composeBuildState,
    composeClientState,
    composeDumpState,
    composeFetchState,
    composeUnaskedClientState,
    EXIT_STALE,
    EXIT_UNASKED,
    type FetchReading,
    formatReadingLine,
    READING_VERDICT,
    readLoadedReadings,
} from "#/tools/game-readings.ts";

const OTHER_BUILD = "notTheBuild";
const FROZEN_KEYS: BuildReading = {
    build: FROZEN_PROTOCOL_KEYS.gameBuild,
    count: FROZEN_PROTOCOL_KEYS.keys.length,
};
const FROZEN_HELP: FetchReading = {
    fetchedAt: FROZEN_HELP_PHRASES.fetchedAt,
    count: Object.keys(FROZEN_HELP_PHRASES.counts).length,
};
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
    assertEquals(composeClientState("abc", composeCachedClient("abc")).verdict, "current");
    assertEquals(composeClientState("abc", composeCachedClient("xyz")).verdict, "stale");
    const absent = composeClientState("abc", null);
    assertEquals(absent.verdict, "stale", "a cache nobody filled is not current either");
    assertStringIncludes(absent.says, "nothing cached", "which the row says rather than implies");
});

function composeCachedClient(build: string): CachedClientSource {
    return {
        channel: "production",
        build,
        host: "https://tempest.margonem.pl",
        fetchedAt: READ_AT,
        bundlePath: ".cache/game-client/production/main.js",
    };
}

Deno.test("a table lifted from the client is dated by the bundle it was lifted from", () => {
    const cached = composeCachedClient(FROZEN_PROTOCOL_KEYS.gameBuild);
    const current = composeBuildState("frozen keys", "keys", FROZEN_KEYS, cached);
    assertEquals(current.verdict, "current", "the build it was frozen from");
    const other = composeCachedClient(OTHER_BUILD);
    const behind = composeBuildState("frozen keys", "keys", FROZEN_KEYS, other);
    assertEquals(behind.verdict, "stale", "a bundle fetched since, and never re-frozen");
    assertStringIncludes(behind.says, FROZEN_PROTOCOL_KEYS.gameBuild, "the row states both builds");
    assertStringIncludes(behind.says, OTHER_BUILD, "so a reader can see which way it drifted");
    assertEquals(composeBuildState("frozen keys", "keys", FROZEN_KEYS, null).verdict, "stale");
});

Deno.test("a fetched page goes stale on a floor, and the day before it does not", () => {
    const at = (days: number) => READ_AT_MILLISECONDS + days * MILLISECONDS_PER_DAY;
    assertEquals(composeDumpState("help dump", "v", READ_AT, at(0)).verdict, "current", "now");
    assertEquals(composeDumpState("help dump", "v", READ_AT, at(6)).verdict, "current", "at six");
    assertEquals(composeDumpState("help dump", "v", READ_AT, at(7)).verdict, "stale", "at seven");
    assertEquals(composeDumpState("help dump", "v", null, at(7)).verdict, "stale", "none cached");
});

Deno.test("frozen counts are dated by the page they name, not by their own age", () => {
    const named = FROZEN_HELP_PHRASES.fetchedAt;
    const current = composeFetchState("frozen help", "phrases", FROZEN_HELP, named);
    assertEquals(current.verdict, "current", "the page they were counted over");
    // A page fetched since is the case the routine exists for: the counts still describe the old
    // one, and nothing about them looks wrong until the two dates stand side by side.
    const refetched = composeFetchState("frozen help", "phrases", FROZEN_HELP, READ_AT);
    assertEquals(refetched.verdict, "stale", "a page fetched since, and never re-counted");
    assertStringIncludes(refetched.says, READ_AT, "the row states the page on disk");
    assertEquals(composeFetchState("frozen help", "phrases", FROZEN_HELP, null).verdict, "stale");
});

Deno.test("a status asks what was loaded, and a table written from the cache reads current", () => {
    // The modules are bound once, at import; a refresh rewrites the files under them, so what
    // `readLoadedReadings` answers is right for a status and wrong after a refresh.
    const loaded = readLoadedReadings();
    assertEquals(loaded.keys, FROZEN_KEYS, "the build the table names and how many it counts");
    assertEquals(loaded.help, FROZEN_HELP, "the page the counts name and how many stand under it");
    const written: BuildReading = { build: OTHER_BUILD, count: 1 };
    const state = composeBuildState(
        "frozen keys",
        "keys",
        written,
        composeCachedClient(OTHER_BUILD),
    );
    assertEquals(state.verdict, "current", "a table written from the cached bundle reads current");
});

Deno.test("a world that did not answer is said as that, and never as a stale reading", () => {
    // The fix for one is to wait and for the other to refresh, so the row a person reads names it.
    const unasked = composeUnaskedClientState("https://tempest.margonem.pl did not answer");
    assertEquals(unasked.verdict, "unknown", "nobody could ask, so nothing is claimed");
    assertEquals(unasked.name, "client", "and it stands in the row that needed the network");
    assert(!formatReadingLine(unasked).includes("STALE"), "never wearing the other verdict");
    assert(EXIT_STALE > 0, "a reading that went behind never ends a work round quietly");
    assert(EXIT_UNASKED > 0, "and neither does a world that could not be asked");
});
