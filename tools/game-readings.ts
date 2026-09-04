/**
 * Whether the dated readings of the game are current, and the routine that makes them so.
 *
 *     deno task game:readings status | refresh
 *
 * A reading in `frozen/` is evidence a guard stands on, and the gate cannot tell that one has gone
 * behind the game: it reaches no network. So this is where staleness is an exit code — and a world
 * that did not answer is a different one. `frozen/AGENTS.md` says when it is run.
 */

import { assert, assertStrictEquals } from "@std/assert";
import { composeIntegerText } from "@/libs/number-text.ts";
import { FROZEN_HELP_PHRASES } from "@/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import { FROZEN_SKILL_DURATIONS } from "@/frozen/skill-durations.ts";
import {
    type CachedClientSource,
    type GameChannel,
    getCachedClientSource,
    readServedBuild,
    writeClientSourceCache,
} from "@/tools/game-client-source.ts";
import { GameUnreachableError } from "@/tools/margometer-tool-error.ts";
import { writeFrozenKeyTable } from "@/tools/protocol-key-table.ts";
import {
    type CachedSkillTable,
    getCachedSkillTable,
    writeFrozenSkillTable,
    writeSkillTableCache,
} from "@/tools/skill-table.ts";
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
/** What a script reads off a status: a reading behind the game, and a world nobody could ask. */
export const EXIT_STALE = 1;
export const EXIT_UNASKED = 2;
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

export interface FrozenSkillReading {
    fetchedAt: string;
    count: number;
}

/** Every frozen reading this tool reports on, which is what a refresh writes and a status reads. */
export interface LoadedReadings {
    keys: FrozenKeyReading;
    help: FrozenHelpReading;
    skills: FrozenSkillReading;
}

/** How many rows a report carries, so a reading added without a row is caught rather than lost. */
const READING_COUNT = 5;

/**
 * What a row can say. `unknown` is not a third shade of stale: it is what stands where nobody
 * could ask the question, and **W10** hangs on the two being told apart.
 */
export type ReadingVerdict = "current" | "stale" | "unknown";

export interface ReadingState {
    name: string;
    verdict: ReadingVerdict;
    says: string;
}

/** The loud ones are the ones that end a work round; `current` is the quiet one. */
const VERDICT_WORDS: Record<ReadingVerdict, string> = {
    current: "current",
    stale: "STALE",
    unknown: "UNKNOWN",
};

/** One row, in the shape the report prints it. */
export function composeReadingLine(state: ReadingState): string {
    const said = VERDICT_WORDS[state.verdict];
    assert(state.name.length > 0, "a row names the reading it is about");
    assert(state.says.length > 0, "and says what it was compared against");
    return `${state.name.padEnd(NAME_COLUMN)} ${state.says.padEnd(SAYS_COLUMN)} ${said}`;
}

/**
 * A world nobody could ask. The row says that rather than calling the reading stale: an outage
 * is not evidence that the game moved on, and **E10** asks the answer to say whether it worked.
 */
export function composeUnaskedClientState(said: string): ReadingState {
    assert(said.length > 0, "a world that could not be asked says what happened");
    assert(NAME_COLUMN > 0, "and the row it stands in has a column to stand in");
    return { name: "client", verdict: "unknown", says: `not asked: ${said}` };
}

/** The bundle in `.cache/` against what the world is serving right now. */
export function composeClientState(
    served: string,
    cached: CachedClientSource | null,
): ReadingState {
    assert(served.length > 0, "a world that answered named a build");
    assert(cached === null || cached.build.length > 0, "and a cache admitted knows its own");
    if (cached === null) {
        return { name: "client", verdict: "stale", says: `served ${served}, ${NOTHING_CACHED}` };
    }
    return {
        name: "client",
        verdict: cached.build === served ? "current" : "stale",
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
            verdict: "stale",
            says: `frozen ${frozen.build}, ${NOTHING_CACHED}`,
        };
    }
    return {
        name: "frozen keys",
        verdict: frozen.build === cached.build ? "current" : "stale",
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
            verdict: "stale",
            says: `view,${MECHANICS_ARTICLE} ${NOTHING_CACHED}`,
        };
    }
    return {
        name: "help dump",
        verdict: isDumpStale(cached.fetchedAt, now) ? "stale" : "current",
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
            verdict: "stale",
            says: `frozen ${frozen.fetchedAt}, ${NOTHING_CACHED}`,
        };
    }
    return {
        name: "frozen help",
        verdict: frozen.fetchedAt === cached.fetchedAt ? "current" : "stale",
        says: `dump ${cached.fetchedAt}  ${count} phrases`,
    };
}

/**
 * The frozen skill table against the page it was read from, which is the same question
 * `composeFrozenKeyState` asks of the bundle: a table dated by a page nobody has fetched would be
 * a claim about a page that is not on this machine. What the world serves is not asked — the page
 * carries no build id, so `refresh` fetching it is what keeps the two together.
 */
export function composeFrozenSkillState(
    frozen: FrozenSkillReading,
    cached: CachedSkillTable | null,
): ReadingState {
    const count = composeIntegerText(frozen.count);
    assert(frozen.fetchedAt.length > 0, "a frozen table is dated by the page it was read from");
    assert(frozen.count > 0, "and counts something");
    if (cached === null) {
        return {
            name: "frozen skills",
            verdict: "stale",
            says: `frozen ${frozen.fetchedAt}, ${NOTHING_CACHED}`,
        };
    }
    return {
        name: "frozen skills",
        verdict: frozen.fetchedAt === cached.fetchedAt ? "current" : "stale",
        says: `page ${cached.fetchedAt}  ${count} skills`,
    };
}

/**
 * What the frozen modules held when this process started. ⚠️ **A refresh rewrites those files and
 * these bindings do not move with them**, so the routine reports what it has just written instead
 * of asking again: a status composed from here after a refresh calls a current table STALE, which
 * is how this was found on 2026-09-03.
 */
export function getLoadedReadings(): LoadedReadings {
    const keys = { build: FROZEN_PROTOCOL_KEYS.gameBuild, count: FROZEN_PROTOCOL_KEYS.keys.length };
    const help = {
        fetchedAt: FROZEN_HELP_PHRASES.fetchedAt,
        count: Object.keys(FROZEN_HELP_PHRASES.counts).length,
    };
    const skills = {
        fetchedAt: FROZEN_SKILL_DURATIONS.fetchedAt,
        count: FROZEN_SKILL_DURATIONS.skills.length,
    };
    assert(keys.build.length > 0, "a module that was loaded is dated by a build");
    assert(help.fetchedAt.length > 0, "and the next by the dump it was counted over");
    assert(skills.fetchedAt.length > 0, "and the last by the page it was read from");
    return { keys, help, skills };
}

/**
 * The world asked, and the one row that needs the network to answer. The catch is narrow — the
 * only failure stepped over is the world not answering, and anything else is this tool's own bug.
 */
async function readClientState(cached: CachedClientSource | null): Promise<ReadingState> {
    try {
        return composeClientState(await readServedBuild(CHANNEL), cached);
    } catch (failure) {
        if (!(failure instanceof GameUnreachableError)) throw failure;
        return composeUnaskedClientState(failure.message);
    }
}

/** Every reading, in the order a refresh does them: each one dates the one after it. */
export async function readReadingStates(
    now: number,
    frozen: LoadedReadings,
): Promise<ReadingState[]> {
    const client = getCachedClientSource(CHANNEL);
    const dump = getCachedHelpArticle(MECHANICS_ARTICLE);
    const states = [
        await readClientState(client),
        composeFrozenKeyState(frozen.keys, client),
        composeHelpDumpState(dump, now),
        composeFrozenHelpState(frozen.help, dump),
        composeFrozenSkillState(frozen.skills, getCachedSkillTable()),
    ];
    assertStrictEquals(states.length, READING_COUNT, "every reading was reported on");
    assert(states.every((one) => one.name.length > 0), "and each names itself");
    return states;
}

/** How many rows are loud, by kind, so a script reads the difference and not only a reader. */
function writeReadingsReport(
    states: readonly ReadingState[],
): { stale: number; unasked: number } {
    for (const state of states) console.log(composeReadingLine(state));
    const stale = states.filter((one) => one.verdict === "stale").length;
    const unasked = states.filter((one) => one.verdict === "unknown").length;
    assert(stale >= 0, "a count of stale readings is not negative");
    assert(stale + unasked <= states.length, "and no more loud rows than there are readings");
    return { stale, unasked };
}

/**
 * In the order that makes each meaningful: a table is frozen from the bundle fetched a line above
 * it, counts from the dump fetched a line above them, and the skills from the page above those.
 */
async function writeRefreshedReadings(): Promise<LoadedReadings> {
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
    const page = await writeSkillTableCache();
    console.log(
        `skills page   ${composeIntegerText(page.pageLength)} characters → ${page.pagePath}`,
    );
    const skills = writeFrozenSkillTable();
    console.log(
        `frozen skills ${composeIntegerText(skills.count)} skills over ${skills.fetchedAt}\n`,
    );
    assertStrictEquals(client.channel, CHANNEL, "the routine refreshed the channel it decides on");
    assert(help.counts.length > 0, "and froze counts over the dump it had just fetched");
    return {
        keys: { build: keys.build, count: keys.count },
        help: { fetchedAt: help.fetchedAt, count: help.counts.length },
        skills,
    };
}

/**
 * The report, and the exit a script reads. Three answers rather than two: a reading that went
 * behind the game is invisible to the gate, so it is visible here — and a world that did not
 * answer is its own exit, because an outage is not evidence that anything moved.
 */
async function writeReadingsStatus(frozen: LoadedReadings): Promise<void> {
    const states = await readReadingStates(Date.now(), frozen);
    assertStrictEquals(states.length, READING_COUNT, "the report covers every reading");
    assert(states.every((one) => one.says.length > 0), "and each row says what it compared");
    const loud = writeReadingsReport(states);
    if (loud.stale > 0) Deno.exit(EXIT_STALE);
    if (loud.unasked > 0) Deno.exit(EXIT_UNASKED);
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
