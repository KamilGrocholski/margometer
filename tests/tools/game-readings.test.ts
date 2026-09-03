/**
 * Whether a reading is still the game's, decided over manifests rather than over a cache.
 *
 * Every verdict here is taken on a value handed in, so the gate needs no `.cache/` and no
 * network to prove the comparison. Each reader is proved on a sample it must call stale and one
 * it must not: only the second catches a reader that has stopped comparing anything.
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { FROZEN_HELP_PHRASES } from "@/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import type { CachedClientSource } from "@/tools/game-client-source.ts";
import type { CachedHelpArticle } from "@/tools/help-article.ts";
import type { FrozenHelpReading, FrozenKeyReading } from "@/tools/game-readings.ts";
import {
    composeClientState,
    composeFrozenHelpState,
    composeFrozenKeyState,
    composeHelpDumpState,
    composeReadingLine,
    composeUnaskedClientState,
    EXIT_STALE,
    EXIT_UNASKED,
    getLoadedReadings,
} from "@/tools/game-readings.ts";

const OTHER_BUILD = "notTheBuild";
const FROZEN_KEYS: FrozenKeyReading = {
    build: FROZEN_PROTOCOL_KEYS.gameBuild,
    count: FROZEN_PROTOCOL_KEYS.keys.length,
};
const FROZEN_HELP: FrozenHelpReading = {
    fetchedAt: FROZEN_HELP_PHRASES.fetchedAt,
    count: Object.keys(FROZEN_HELP_PHRASES.counts).length,
};
const READ_AT = "2026-08-09T12:00:00.000Z";
const READ_AT_MILLISECONDS = Date.parse(READ_AT);
const MILLISECONDS_PER_DAY = 86_400_000;

function composeCachedClient(build: string): CachedClientSource {
    return {
        channel: "production",
        build,
        host: "https://tempest.margonem.pl",
        fetchedAt: READ_AT,
        bundlePath: ".cache/game-client/production/main.js",
    };
}

function composeCachedDump(fetchedAt: string): CachedHelpArticle {
    return {
        article: FROZEN_HELP_PHRASES.article,
        url: "https://pomoc.margonem.pl/index/view,372",
        fetchedAt,
        textPath: ".cache/help/372/text.txt",
        textLength: 400132,
    };
}

Deno.test("a row says which reading it is about and what the verdict was", () => {
    const current = composeReadingLine({ name: "client", verdict: "current", says: "served x" });
    assertStringIncludes(current, "client", "the row names its reading");
    assert(current.endsWith("current"), "and ends in the verdict");
    const stale = composeReadingLine({ name: "client", verdict: "stale", says: "served x" });
    assert(stale.endsWith("STALE"), "the other verdict is the loud one");
    assert(!stale.includes("current"), "and never carries both");
    const unasked = composeReadingLine({ name: "client", verdict: "unknown", says: "served x" });
    assert(unasked.endsWith("UNKNOWN"), "and a world nobody asked is neither of the two");
});

Deno.test("the cached bundle is current only where it is the one being served", () => {
    const same = composeClientState("abc", composeCachedClient("abc"));
    assertEquals(same.verdict, "current", "the build it was cached at");
    const other = composeClientState("abc", composeCachedClient("xyz"));
    assertEquals(other.verdict, "stale", "and a world serving another one");
    const absent = composeClientState("abc", null);
    assertEquals(absent.verdict, "stale", "and a cache nobody filled is not current either");
    assertStringIncludes(absent.says, "nothing cached", "which the row says rather than implies");
});

Deno.test("the frozen key table is dated by the bundle it was lifted from", () => {
    const cached = composeCachedClient(FROZEN_PROTOCOL_KEYS.gameBuild);
    const current = composeFrozenKeyState(FROZEN_KEYS, cached);
    assertEquals(current.verdict, "current", "the build it was frozen from");
    const behind = composeFrozenKeyState(FROZEN_KEYS, composeCachedClient(OTHER_BUILD));
    assertEquals(behind.verdict, "stale", "a bundle fetched since, and never re-frozen");
    assertStringIncludes(behind.says, FROZEN_PROTOCOL_KEYS.gameBuild, "the row states both builds");
    assertStringIncludes(behind.says, OTHER_BUILD, "so a reader can see which way it drifted");
});

Deno.test("the help dump goes stale on a floor, and the day before it does not", () => {
    const dump = composeCachedDump(READ_AT);
    assertEquals(
        composeHelpDumpState(dump, READ_AT_MILLISECONDS).verdict,
        "current",
        "fetched now",
    );
    const six = READ_AT_MILLISECONDS + 6 * MILLISECONDS_PER_DAY;
    assertEquals(composeHelpDumpState(dump, six).verdict, "current", "the day before the floor");
    const seven = READ_AT_MILLISECONDS + 7 * MILLISECONDS_PER_DAY;
    assertEquals(composeHelpDumpState(dump, seven).verdict, "stale", "and the floor itself");
    assertEquals(
        composeHelpDumpState(null, seven).verdict,
        "stale",
        "nothing cached is not current",
    );
});

Deno.test("the frozen counts are dated by the dump they name, not by their own age", () => {
    const named = composeCachedDump(FROZEN_HELP_PHRASES.fetchedAt);
    const current = composeFrozenHelpState(FROZEN_HELP, named);
    assertEquals(current.verdict, "current", "the dump they were counted over");
    // A dump fetched since is exactly the case the routine exists for: the counts still describe
    // the old one, and nothing about them looks wrong until the two dates are put side by side.
    const refetched = composeFrozenHelpState(FROZEN_HELP, composeCachedDump(READ_AT));
    assertEquals(refetched.verdict, "stale", "a dump fetched since, and never re-counted");
    assertStringIncludes(refetched.says, READ_AT, "the row states the dump on disk");
    assertEquals(
        composeFrozenHelpState(FROZEN_HELP, null).verdict,
        "stale",
        "no dump, not current",
    );
});

Deno.test("a refresh states what it wrote, and the loaded modules are what a status asks", () => {
    // The modules are bound once, at import. A refresh rewrites the files under them and the
    // bindings do not move, so what `getLoadedReadings` answers is what was on disk when this
    // process started — which is the right answer for a status and the wrong one after a refresh.
    const loaded = getLoadedReadings();
    assertEquals(loaded.keys.build, FROZEN_PROTOCOL_KEYS.gameBuild, "the build the table names");
    assertEquals(loaded.keys.count, FROZEN_PROTOCOL_KEYS.keys.length, "and how many it counts");
    assertEquals(loaded.help.fetchedAt, FROZEN_HELP_PHRASES.fetchedAt, "the dump the counts name");
    assertEquals(
        loaded.help.count,
        Object.keys(FROZEN_HELP_PHRASES.counts).length,
        "and how many phrases stand under it",
    );
    const written: FrozenKeyReading = { build: OTHER_BUILD, count: 1 };
    const state = composeFrozenKeyState(written, composeCachedClient(OTHER_BUILD));
    assertEquals(state.verdict, "current", "a table written from the cached bundle reads current");
});

Deno.test("a world that did not answer is said as that, and never as a stale reading", () => {
    // The row a person reads has to name the world's silence, because the fix for it is not the
    // fix for a reading that went behind: one waits, the other runs a refresh.
    const unasked = composeUnaskedClientState("https://tempest.margonem.pl did not answer");
    assertEquals(unasked.verdict, "unknown", "nobody could ask, so nothing is claimed");
    assertEquals(unasked.name, "client", "and it stands in the row that needed the network");
    assertStringIncludes(unasked.says, "did not answer", "saying what happened");
    assert(!composeReadingLine(unasked).includes("STALE"), "and never wearing the other verdict");

    // That the two exits differ is the compiler's — they are literal types, and asserting it here
    // is a comparison it refuses to compile. What is left to hold is that neither is a quiet zero.
    assert(EXIT_STALE > 0, "a reading that went behind never ends a work round quietly");
    assert(EXIT_UNASKED > 0, "and neither does a world that could not be asked");
});
