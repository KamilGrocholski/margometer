/**
 * Whether the dated readings of the game are current, and the routine that makes them so. A
 * reading in `frozen/` is evidence a guard and the bundle stand on, and the gate reaches no network
 * and so cannot tell one has gone behind the game: here staleness is an exit code, and a world
 * that did not answer is a different one. `frozen/AGENTS.md` says when it is run (W10).
 *
 *     deno task game:readings status | refresh
 */

import { assert, assertStrictEquals } from "@std/assert";
import { formatInteger } from "#/libs/number-text.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";
import { FROZEN_HELP_PHRASES } from "#/frozen/help-phrases.ts";
import { FROZEN_PROTOCOL_KEYS } from "#/frozen/protocol-keys.ts";
import { FROZEN_SKILL_DURATIONS } from "#/frozen/skill-durations.ts";
import { writeFrozenBuffBits } from "./buff-bit-table.ts";
import {
    type CachedClientSource,
    GAME_CHANNEL,
    readCachedClientSource,
    readServedBuild,
    writeClientSourceCache,
} from "./game-client-source.ts";
import {
    formatDumpAge,
    isDumpStale,
    MECHANICS_ARTICLE,
    readCachedHelpArticle,
    writeFrozenHelpCounts,
    writeHelpArticleCache,
} from "./help-article.ts";
import { GameUnreachableError } from "./margometer-tool-error.ts";
import { writeFrozenKeyTable } from "./protocol-key-table.ts";
import {
    readCachedSkillTable,
    writeFrozenSkillTable,
    writeSkillTableCache,
} from "./skill-table.ts";

/** A table lifted from the client, dated by the build it was lifted from. */
export interface BuildReading {
    build: string;
    count: number;
}

/** A table taken over a fetched page, dated by the fetch. */
export interface FetchReading {
    fetchedAt: string;
    count: number;
}

/** What the frozen modules held when this process started, in the order a refresh writes them. */
export interface LoadedReadings {
    keys: BuildReading;
    buffs: BuildReading;
    help: FetchReading;
    skills: FetchReading;
}

/** `unknown` is not a third shade of stale: it stands where nobody could ask (W10 tells them apart). */
export const READING_VERDICT = { current: "current", stale: "stale", unknown: "unknown" } as const;
export type ReadingVerdict = VocabularyWord<typeof READING_VERDICT>;

export interface ReadingState {
    name: string;
    verdict: ReadingVerdict;
    says: string;
}

/** Production only: production decides, and every frozen reading was lifted from what it serves. */
const CHANNEL = GAME_CHANNEL.production;
const NOTHING_CACHED = "nothing cached";
/** What a script reads off a status: a reading behind the game, and a world nobody could ask. */
export const EXIT_STALE = 1;
export const EXIT_UNASKED = 2;
/** Every reading this routine reports on, so a row quietly dropped fails rather than hides. */
export const READINGS_REPORTED = 7;
const NAME_COLUMN = 14;
const SAYS_COLUMN = 66;
/** The loud ones end a work round; `current` is the quiet one. */
const VERDICT_WORDS: Readonly<Record<ReadingVerdict, string>> = {
    [READING_VERDICT.current]: "current",
    [READING_VERDICT.stale]: "STALE",
    [READING_VERDICT.unknown]: "UNKNOWN",
};

/**
 * The report, and the exit a script reads. Three answers rather than two: a reading behind the
 * game is invisible to the gate, so it is visible here; and a world that did not answer is its own
 * exit, because an outage is not evidence that anything moved.
 */
async function writeReadingsStatus(frozen: LoadedReadings): Promise<void> {
    const states = await readReadingStates(Date.now(), frozen);
    for (const state of states) console.log(formatReadingLine(state));
    const stale = states.filter((one) => one.verdict === READING_VERDICT.stale).length;
    const unasked = states.filter((one) => one.verdict === READING_VERDICT.unknown).length;
    assert(stale + unasked <= states.length, "no more loud rows than there are readings");
    if (stale > 0) Deno.exitCode = EXIT_STALE;
    else if (unasked > 0) Deno.exitCode = EXIT_UNASKED;
}

/** Every reading, in the order a refresh does them: each one dates the one after it. */
async function readReadingStates(now: number, frozen: LoadedReadings): Promise<ReadingState[]> {
    const client = readCachedClientSource(CHANNEL);
    const dump = readCachedHelpArticle(MECHANICS_ARTICLE);
    const table = readCachedSkillTable();
    const states = [
        await readClientState(client),
        composeBuildState("frozen keys", "keys", frozen.keys, client),
        composeBuildState("frozen buffs", "bits", frozen.buffs, client),
        composeDumpState("help dump", `view,${MECHANICS_ARTICLE}`, dump?.fetchedAt ?? null, now),
        composeFetchState("frozen help", "phrases", frozen.help, dump?.fetchedAt ?? null),
        composeDumpState("skill dump", "skills", table?.fetchedAt ?? null, now),
        composeFetchState("frozen skills", "skills", frozen.skills, table?.fetchedAt ?? null),
    ];
    assertStrictEquals(states.length, READINGS_REPORTED, "every reading was reported on");
    return states;
}

/** The world asked. The catch is narrow: the world not answering, and nothing else of this tool's. */
async function readClientState(cached: CachedClientSource | null): Promise<ReadingState> {
    try {
        return composeClientState(await readServedBuild(CHANNEL), cached);
    } catch (failure) {
        if (!(failure instanceof GameUnreachableError)) throw failure;
        return composeUnaskedClientState(failure.message);
    }
}

/** The bundle in `.cache/` against what the world is serving right now. */
export function composeClientState(
    served: string,
    cached: CachedClientSource | null,
): ReadingState {
    assert(served.length > 0, "a world that answered named a build");
    if (cached === null) {
        return {
            name: "client",
            verdict: READING_VERDICT.stale,
            says: `served ${served}, ${NOTHING_CACHED}`,
        };
    }
    const verdict = cached.build === served ? READING_VERDICT.current : READING_VERDICT.stale;
    return { name: "client", verdict, says: `served ${served}  cached ${cached.build}` };
}

/** A world nobody could ask: an outage is not evidence that the game moved on. */
export function composeUnaskedClientState(said: string): ReadingState {
    assert(said.length > 0, "a world that could not be asked says what happened");
    return { name: "client", verdict: READING_VERDICT.unknown, says: `not asked: ${said}` };
}

/**
 * A table lifted from the bundle, against the bundle it would be lifted from, not against what is
 * served: a table dated by a build nobody fetched is a claim about a bundle not on this machine.
 * The bits are held the same way because a mask is read by position, so a bit inserted ahead of
 * another renames every status after it without changing a count.
 */
export function composeBuildState(
    name: string,
    unit: string,
    frozen: BuildReading,
    cached: CachedClientSource | null,
): ReadingState {
    assert(frozen.build.length > 0, "a frozen table is dated by a build");
    assert(frozen.count > 0, "and counts something");
    if (cached === null) {
        return {
            name,
            verdict: READING_VERDICT.stale,
            says: `frozen ${frozen.build}, ${NOTHING_CACHED}`,
        };
    }
    const verdict = frozen.build === cached.build ? READING_VERDICT.current : READING_VERDICT.stale;
    const count = formatInteger(frozen.count);
    return {
        name,
        verdict,
        says: `cached ${cached.build}  frozen ${frozen.build}  ${count} ${unit}`,
    };
}

/** A fetched page in `.cache/`, against the week `tools/help-article.ts` states as its floor. */
export function composeDumpState(
    name: string,
    subject: string,
    fetchedAt: string | null,
    now: number,
): ReadingState {
    assert(now > 0, "an age is measured from an instant");
    if (fetchedAt === null) {
        return { name, verdict: READING_VERDICT.stale, says: `${subject} ${NOTHING_CACHED}` };
    }
    const verdict = isDumpStale(fetchedAt, now) ? READING_VERDICT.stale : READING_VERDICT.current;
    return { name, verdict, says: formatDumpAge(fetchedAt, now) };
}

/** Counts or durations taken over a page, against the page they name. */
export function composeFetchState(
    name: string,
    unit: string,
    frozen: FetchReading,
    fetchedAt: string | null,
): ReadingState {
    assert(frozen.fetchedAt.length > 0, "a frozen reading is dated by the page it came off");
    assert(frozen.count > 0, "and counts something");
    if (fetchedAt === null) {
        return {
            name,
            verdict: READING_VERDICT.stale,
            says: `frozen ${frozen.fetchedAt}, ${NOTHING_CACHED}`,
        };
    }
    const verdict = frozen.fetchedAt === fetchedAt
        ? READING_VERDICT.current
        : READING_VERDICT.stale;
    return { name, verdict, says: `page ${fetchedAt}  ${formatInteger(frozen.count)} ${unit}` };
}

/** One row, in the shape the report prints it. */
export function formatReadingLine(state: ReadingState): string {
    assert(state.name.length > 0, "a row names the reading it is about");
    assert(state.says.length > 0, "and says what it was compared against");
    const said = VERDICT_WORDS[state.verdict];
    return `${state.name.padEnd(NAME_COLUMN)} ${state.says.padEnd(SAYS_COLUMN)} ${said}`;
}

/**
 * What the frozen modules held when this process started. ⚠️ **A refresh rewrites those files and
 * these bindings do not move with them**, so a refresh reports what it has just written instead
 * of asking again: a status composed from here after one called a current table STALE (2026-09-03).
 */
export function readLoadedReadings(): LoadedReadings {
    return {
        keys: { build: FROZEN_PROTOCOL_KEYS.gameBuild, count: FROZEN_PROTOCOL_KEYS.keys.length },
        buffs: { build: FROZEN_BUFF_BITS.gameBuild, count: FROZEN_BUFF_BITS.bits.length },
        help: {
            fetchedAt: FROZEN_HELP_PHRASES.fetchedAt,
            count: Object.keys(FROZEN_HELP_PHRASES.counts).length,
        },
        skills: {
            fetchedAt: FROZEN_SKILL_DURATIONS.fetchedAt,
            count: FROZEN_SKILL_DURATIONS.skills.length,
        },
    };
}

/**
 * Each in the order that makes it meaningful: a table is frozen from the bundle fetched the line
 * above it, counts from the dump fetched above them, and durations from the page above those.
 */
async function writeRefreshedReadings(): Promise<LoadedReadings> {
    const client = await writeClientSourceCache(CHANNEL);
    console.log(`client        build ${client.build} → ${client.bundlePath}`);
    const keys = writeFrozenKeyTable();
    console.log(`frozen keys   ${formatInteger(keys.count)} keys from build ${keys.build}`);
    const buffs = writeFrozenBuffBits();
    console.log(`frozen buffs  ${formatInteger(buffs.count)} bits from build ${buffs.build}`);
    const dump = await writeHelpArticleCache(MECHANICS_ARTICLE);
    console.log(`help dump     ${formatInteger(dump.textLength)} characters → ${dump.textPath}`);
    const help = writeFrozenHelpCounts(MECHANICS_ARTICLE, []);
    console.log(
        `frozen help   ${formatInteger(help.counts.length)} phrases over ${help.fetchedAt}`,
    );
    const table = await writeSkillTableCache();
    console.log(`skill dump    ${formatInteger(table.pageLength)} characters → ${table.pagePath}`);
    const skills = writeFrozenSkillTable();
    console.log(
        `frozen skills ${formatInteger(skills.skills)} skills, ` +
            `${formatInteger(skills.auras)} reaching a side\n`,
    );
    return {
        keys: { build: keys.build, count: keys.count },
        buffs: { build: buffs.build, count: buffs.count },
        help: { fetchedAt: help.fetchedAt, count: help.counts.length },
        skills: { fetchedAt: skills.fetchedAt, count: skills.skills },
    };
}

if (import.meta.main) {
    const [command] = Deno.args;
    if (command === "refresh") await writeReadingsStatus(await writeRefreshedReadings());
    else if (command === "status") await writeReadingsStatus(readLoadedReadings());
    else console.log("usage: deno task game:readings status | refresh");
}
