/**
 * Whether the dated readings of the game are current, and the routine that makes them so.
 *
 *     deno task game:readings status | refresh
 *
 * A reading in `frozen/` is evidence a guard stands on, and the gate cannot tell that one has gone
 * behind the game: it reaches no network. So this is where staleness is an exit code, and
 * `frozen/AGENTS.md` says when it is run.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { composeIntegerText } from "@/libs/number-text.ts";
import { FROZEN_HELP_PHRASES } from "@/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import {
    type CachedClientSource,
    type GameChannel,
    getCachedClientSource,
    readServedBuild,
    writeClientSourceCache,
} from "@/tools/game-client-source.ts";
import { writeFrozenKeyTable } from "@/tools/protocol-key-table.ts";
import {
    type CachedHelpArticle,
    composeAgeText,
    getCachedHelpArticle,
    isDumpStale,
    MECHANICS_ARTICLE,
    writeFrozenHelpCounts,
    writeHelpArticleCache,
} from "@/tools/help-article.ts";

/**
 * Production only. `tools/game-client-source.ts` states that production decides and development is
 * for reading, and both frozen readings were lifted from what production serves.
 */
const CHANNEL: GameChannel = "production";

const NOTHING_CACHED = "nothing cached";
const NAME_COLUMN = 14;
const SAYS_COLUMN = 66;

export interface FrozenKeyReading {
    build: string;
    count: number;
}

export interface FrozenHelpReading {
    fetchedAt: string;
    count: number;
}

export interface ReadingState {
    name: string;
    isCurrent: boolean;
    says: string;
}

/** One row, in the shape the report prints it. */
export function composeReadingLine(state: ReadingState): string {
    const verdict = state.isCurrent ? "current" : "STALE";
    assert(state.name.length > 0, "a row names the reading it is about");
    assert(state.says.length > 0, "and says what it was compared against");
    return `${state.name.padEnd(NAME_COLUMN)} ${state.says.padEnd(SAYS_COLUMN)} ${verdict}`;
}

/** The bundle in `.cache/` against what the world is serving right now. */
export function composeClientState(
    served: string,
    cached: CachedClientSource | null,
): ReadingState {
    assert(served.length > 0, "a world that answered named a build");
    assert(cached === null || cached.build.length > 0, "and a cache admitted knows its own");
    if (cached === null) {
        return { name: "client", isCurrent: false, says: `served ${served}, ${NOTHING_CACHED}` };
    }
    return {
        name: "client",
        isCurrent: cached.build === served,
        says: `served ${served}  cached ${cached.build}`,
    };
}

/**
 * The frozen key table against the bundle it was lifted from — not against what is served. A table
 * dated by a build nobody has fetched would be a claim about a bundle that is not on this machine.
 */
export function composeFrozenKeyState(
    frozen: FrozenKeyReading,
    cached: CachedClientSource | null,
): ReadingState {
    const count = composeIntegerText(frozen.count);
    assert(frozen.build.length > 0, "a frozen table is dated by a build");
    assert(frozen.count > 0, "and counts something");
    if (cached === null) {
        return {
            name: "frozen keys",
            isCurrent: false,
            says: `frozen ${frozen.build}, ${NOTHING_CACHED}`,
        };
    }
    return {
        name: "frozen keys",
        isCurrent: frozen.build === cached.build,
        says: `cached ${cached.build}  frozen ${frozen.build}  ${count} keys`,
    };
}

/** The published help in `.cache/`, against the floor `tools/help-article.ts` states. */
export function composeHelpDumpState(cached: CachedHelpArticle | null, now: number): ReadingState {
    assert(MECHANICS_ARTICLE.length > 0, "an article is asked for by name");
    assert(now > 0, "and its age is measured from an instant");
    if (cached === null) {
        return {
            name: "help dump",
            isCurrent: false,
            says: `view,${MECHANICS_ARTICLE} ${NOTHING_CACHED}`,
        };
    }
    return {
        name: "help dump",
        isCurrent: !isDumpStale(cached.fetchedAt, now),
        says: composeAgeText(cached.fetchedAt, now),
    };
}

/**
 * The frozen counts against the dump they name. Whether they count the phrases the register cites
 * is `tests/repository/protocol-keys.test.ts`'s, which runs in the gate and needs no network.
 */
export function composeFrozenHelpState(
    frozen: FrozenHelpReading,
    cached: CachedHelpArticle | null,
): ReadingState {
    const count = composeIntegerText(frozen.count);
    assert(frozen.fetchedAt.length > 0, "frozen counts are dated by the dump they were taken over");
    assert(frozen.count > 0, "and count something");
    if (cached === null) {
        return {
            name: "frozen help",
            isCurrent: false,
            says: `frozen ${frozen.fetchedAt}, ${NOTHING_CACHED}`,
        };
    }
    return {
        name: "frozen help",
        isCurrent: frozen.fetchedAt === cached.fetchedAt,
        says: `dump ${cached.fetchedAt}  ${count} phrases`,
    };
}

/**
 * What the frozen modules held when this process started. ⚠️ **A refresh rewrites those files and
 * these bindings do not move with them**, so the routine reports what it has just written instead
 * of asking again: a status composed from here after a refresh calls a current table STALE, which
 * is how this was found on 2026-09-03.
 */
export function getLoadedReadings(): { keys: FrozenKeyReading; help: FrozenHelpReading } {
    const keys = { build: FROZEN_PROTOCOL_KEYS.gameBuild, count: FROZEN_PROTOCOL_KEYS.keys.length };
    const help = {
        fetchedAt: FROZEN_HELP_PHRASES.fetchedAt,
        count: Object.keys(FROZEN_HELP_PHRASES.counts).length,
    };
    assert(keys.build.length > 0, "a module that was loaded is dated by a build");
    assert(help.fetchedAt.length > 0, "and the other by the dump it was counted over");
    return { keys, help };
}

/** Every reading, in the order a refresh does them: each one dates the one after it. */
export async function readReadingStates(
    now: number,
    frozen: { keys: FrozenKeyReading; help: FrozenHelpReading },
): Promise<ReadingState[]> {
    const served = await readServedBuild(CHANNEL);
    const client = getCachedClientSource(CHANNEL);
    const dump = getCachedHelpArticle(MECHANICS_ARTICLE);
    const states = [
        composeClientState(served, client),
        composeFrozenKeyState(frozen.keys, client),
        composeHelpDumpState(dump, now),
        composeFrozenHelpState(frozen.help, dump),
    ];
    assertStrictEquals(states.length, 4, "every reading was reported on");
    assert(states.every((one) => one.name.length > 0), "and each names itself");
    return states;
}

/** How many are stale, so the caller can make that visible to a script and not only to a reader. */
function writeReadingsReport(states: readonly ReadingState[]): number {
    for (const state of states) console.log(composeReadingLine(state));
    const stale = states.filter((one) => !one.isCurrent).length;
    assert(stale >= 0, "a count of stale readings is not negative");
    assert(stale <= states.length, "and no more of them than there are readings");
    return stale;
}

/**
 * The four in the order that makes each meaningful: a table is frozen from the bundle fetched a
 * line above it, and counts from the dump fetched a line above them.
 */
async function writeRefreshedReadings(): Promise<
    { keys: FrozenKeyReading; help: FrozenHelpReading }
> {
    const client = await writeClientSourceCache(CHANNEL);
    console.log(`client        build ${client.build} → ${client.bundlePath}`);
    const keys = writeFrozenKeyTable();
    console.log(`frozen keys   ${composeIntegerText(keys.count)} keys from build ${keys.build}`);
    const dump = await writeHelpArticleCache(MECHANICS_ARTICLE);
    console.log(
        `help dump     ${composeIntegerText(dump.textLength)} characters → ${dump.textPath}`,
    );
    const help = writeFrozenHelpCounts(MECHANICS_ARTICLE, []);
    console.log(
        `frozen help   ${composeIntegerText(help.counts.length)} phrases over ${help.fetchedAt}\n`,
    );
    assertStrictEquals(client.channel, CHANNEL, "the routine refreshed the channel it decides on");
    assert(help.counts.length > 0, "and froze counts over the dump it had just fetched");
    return {
        keys: { build: keys.build, count: keys.count },
        help: { fetchedAt: help.fetchedAt, count: help.counts.length },
    };
}

/**
 * The report, and the exit a script reads. Non-zero is the point: a reading that has gone behind
 * the game is invisible to the gate, so it is visible to whatever runs this before a work round.
 */
async function writeReadingsStatus(
    frozen: { keys: FrozenKeyReading; help: FrozenHelpReading },
): Promise<void> {
    const states = await readReadingStates(Date.now(), frozen);
    assertStrictEquals(states.length, 4, "the report covers every reading");
    assert(states.every((one) => one.says.length > 0), "and each row says what it compared");
    if (writeReadingsReport(states) > 0) Deno.exit(1);
}

if (import.meta.main) {
    const [command] = Deno.args;
    if (command === "refresh") {
        await writeReadingsStatus(await writeRefreshedReadings());
    } else if (command === "status") {
        await writeReadingsStatus(getLoadedReadings());
    } else {
        console.log("usage: deno task game:readings status | refresh");
    }
}
