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
    const current = composeReadingLine({ name: "client", isCurrent: true, says: "served x" });
    assertStringIncludes(current, "client", "the row names its reading");
    assert(current.endsWith("current"), "and ends in the verdict");
    const stale = composeReadingLine({ name: "client", isCurrent: false, says: "served x" });
    assert(stale.endsWith("STALE"), "the other verdict is the loud one");
    assert(!stale.includes("current"), "and never carries both");
});

Deno.test("the cached bundle is current only where it is the one being served", () => {
    assertEquals(composeClientState("abc", composeCachedClient("abc")).isCurrent, true, "the same");
    assertEquals(composeClientState("abc", composeCachedClient("xyz")).isCurrent, false, "a build");
    const absent = composeClientState("abc", null);
    assertEquals(absent.isCurrent, false, "and a cache nobody filled is not current either");
    assertStringIncludes(absent.says, "nothing cached", "which the row says rather than implies");
});

Deno.test("the frozen key table is dated by the bundle it was lifted from", () => {
    const cached = composeCachedClient(FROZEN_PROTOCOL_KEYS.gameBuild);
    const current = composeFrozenKeyState(FROZEN_KEYS, cached);
    assertEquals(current.isCurrent, true, "the build it was frozen from");
    const behind = composeFrozenKeyState(FROZEN_KEYS, composeCachedClient(OTHER_BUILD));
    assertEquals(behind.isCurrent, false, "a bundle fetched since, and never re-frozen");
    assertStringIncludes(behind.says, FROZEN_PROTOCOL_KEYS.gameBuild, "the row states both builds");
    assertStringIncludes(behind.says, OTHER_BUILD, "so a reader can see which way it drifted");
});

Deno.test("the help dump goes stale on a floor, and the day before it does not", () => {
    const dump = composeCachedDump(READ_AT);
    assertEquals(composeHelpDumpState(dump, READ_AT_MILLISECONDS).isCurrent, true, "fetched now");
    const six = READ_AT_MILLISECONDS + 6 * MILLISECONDS_PER_DAY;
    assertEquals(composeHelpDumpState(dump, six).isCurrent, true, "the day before the floor");
    const seven = READ_AT_MILLISECONDS + 7 * MILLISECONDS_PER_DAY;
    assertEquals(composeHelpDumpState(dump, seven).isCurrent, false, "and the floor itself");
    assertEquals(
        composeHelpDumpState(null, seven).isCurrent,
        false,
        "nothing cached is not current",
    );
});

Deno.test("the frozen counts are dated by the dump they name, not by their own age", () => {
    const named = composeCachedDump(FROZEN_HELP_PHRASES.fetchedAt);
    const current = composeFrozenHelpState(FROZEN_HELP, named);
    assertEquals(current.isCurrent, true, "the dump they were counted over");
    // A dump fetched since is exactly the case the routine exists for: the counts still describe
    // the old one, and nothing about them looks wrong until the two dates are put side by side.
    const refetched = composeFrozenHelpState(FROZEN_HELP, composeCachedDump(READ_AT));
    assertEquals(refetched.isCurrent, false, "a dump fetched since, and never re-counted");
    assertStringIncludes(refetched.says, READ_AT, "the row states the dump on disk");
    assertEquals(
        composeFrozenHelpState(FROZEN_HELP, null).isCurrent,
        false,
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
    assert(state.isCurrent, "a table just written from the cached bundle reads as current");
});
