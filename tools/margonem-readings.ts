/**
 * Whether the dated readings of the game are current, and the routine that makes them so. A
 * reading in `frozen/` is evidence a guard and the bundle stand on, and the gate reaches no network
 * and so cannot tell one has gone behind the game: here staleness is an exit code, and a world
 * that did not answer is a different one. A preview reads the development channel's client against
 * what production froze, and writes nothing under `frozen/`. `frozen/AGENTS.md` says when each is
 * run (W10).
 *
 *     deno task margonem:readings status | refresh | preview
 */

import { assert, assertNotStrictEquals, assertStrictEquals } from "@std/assert";
import { formatInteger } from "#/libs/number-text.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { FROZEN_STATUS_BITS } from "#/frozen/status-bits.ts";
import { FROZEN_PROTOCOL_KEYS } from "#/frozen/protocol-keys.ts";
import { STATUS_BITS_MAXIMUM } from "#/src/core/carried-status.ts";
import {
    readFrozenStatusBits,
    requireStatusBits,
    writeFrozenStatusBits,
} from "./status-bit-table.ts";
import type { FrozenFiles } from "./frozen-files.ts";
import {
    type CachedMargonemClientSource,
    MARGONEM_CHANNEL,
    readCachedBundle,
    readCachedMargonemClientSource,
    readServedBuild,
    writeMargonemClientSourceCache,
} from "./margonem-client-source.ts";
import {
    formatDumpAge,
    isDumpStale,
    MECHANICS_ARTICLE,
    readCachedHelpArticle,
    readFrozenHelpCounts,
    writeFrozenHelpCounts,
    writeHelpArticleCache,
} from "./help-article.ts";
import { MargonemReadingsError, MargonemUnreachableError } from "./margometer-tool-error.ts";
import {
    readFrozenKeyTable,
    requireProtocolKeys,
    writeFrozenKeyTable,
} from "./protocol-key-table.ts";
import {
    readCachedSkillTable,
    readFrozenSkillTable,
    writeFrozenSkillTable,
    writeSkillTableCache,
} from "./skill-table.ts";

/** `unknown` is not a third shade of stale: it stands where nobody could ask (W10 tells them apart). */
export const READING_VERDICT = { current: "current", stale: "stale", unknown: "unknown" } as const;
export type ReadingVerdict = VocabularyWord<typeof READING_VERDICT>;

export interface ReadingState {
    name: string;
    verdict: ReadingVerdict;
    says: string;
}

/** Keys one list has and the other lacks, each sorted. */
export interface KeyDifference {
    added: string[];
    removed: string[];
}

/** A position whose status differs between two bit orders; null where one order is shorter. */
export interface BitShift {
    bit: number;
    frozen: string | null;
    lifted: string | null;
}

/** Production only: production decides, and every frozen reading was lifted from what it serves. */
const CHANNEL = MARGONEM_CHANNEL.production;
/** The channel a preview reads: it serves what production has not shipped yet. */
const PREVIEW_CHANNEL = MARGONEM_CHANNEL.development;
const NOTHING_CACHED = "nothing cached";
/** What a script reads off a status: a reading behind the game, and a world nobody could ask. */
export const EXIT_STALE = 1;
export const EXIT_UNASKED = 2;
/** What a script reads off a preview: the development client differs from what is frozen. */
export const EXIT_AHEAD = 1;
/** Every reading this routine reports on, so a row quietly dropped fails rather than hides. */
const READINGS_REPORTED = 7;
const NAME_COLUMN = 16;
const SAYS_COLUMN = 80;
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
async function writeReadingsStatus(): Promise<void> {
    let states: ReadingState[];
    // Read every reading, in the order a refresh does them: each one dates the one after it.
    {
        // A frozen row asks what a freeze off the cache would write, so it is current where that
        // is what stands.
        const now = Date.now();
        const client = readCachedMargonemClientSource(CHANNEL);
        const dump = readCachedHelpArticle(MECHANICS_ARTICLE);
        const table = readCachedSkillTable();
        let clientState: ReadingState;
        // Ask the world, catching its not answering and nothing else of this tool's.
        {
            try {
                clientState = composeMargonemClientState(await readServedBuild(CHANNEL), client);
            } catch (failure) {
                if (!(failure instanceof MargonemUnreachableError)) throw failure;
                clientState = composeUnaskedMargonemClientState(failure.message);
            }
        }
        states = [
            clientState,
            composeFrozenState(
                "frozen keys",
                "keys",
                client === null ? null : readFrozenKeyTable(),
            ),
            composeFrozenState(
                "frozen statuses",
                "bits",
                client === null ? null : readFrozenStatusBits(),
            ),
            composeDumpState(
                "help dump",
                `view,${MECHANICS_ARTICLE}`,
                dump?.fetchedAt ?? null,
                now,
            ),
            composeFrozenState(
                "frozen help",
                "phrases",
                dump === null ? null : readFrozenHelpCounts(MECHANICS_ARTICLE, []),
            ),
            composeDumpState("skill dump", "skills", table?.fetchedAt ?? null, now),
            composeFrozenState(
                "frozen skills",
                "skills",
                table === null ? null : readFrozenSkillTable(),
            ),
        ];
        assertStrictEquals(states.length, READINGS_REPORTED, "every reading was reported on");
    }
    for (const state of states) console.log(formatReadingLine(state));
    const stale = states.filter((state) => state.verdict === READING_VERDICT.stale).length;
    const unasked = states.filter((state) => state.verdict === READING_VERDICT.unknown).length;
    assert(stale + unasked <= states.length, "no more loud rows than there are readings");
    if (stale > 0) Deno.exitCode = EXIT_STALE;
    else if (unasked > 0) Deno.exitCode = EXIT_UNASKED;
}

/** The bundle in `.cache/` against what the world is serving right now. */
export function composeMargonemClientState(
    served: string,
    cached: CachedMargonemClientSource | null,
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
export function composeUnaskedMargonemClientState(said: string): ReadingState {
    assert(said.length > 0, "a world that could not be asked says what happened");
    return { name: "client", verdict: READING_VERDICT.unknown, says: `not asked: ${said}` };
}

/**
 * A frozen reading against what a freeze off the cache would write. Its date is not the question:
 * a later fetch that gave the same content leaves the date where it was (ADR 0011).
 */
export function composeFrozenState(
    name: string,
    unit: string,
    frozen: FrozenFiles | null,
): ReadingState {
    assert(name.length > 0, "a row names its reading");
    if (frozen === null) return { name, verdict: READING_VERDICT.stale, says: NOTHING_CACHED };
    const verdict = frozen.hasMoved ? READING_VERDICT.stale : READING_VERDICT.current;
    const held = frozen.heldDate ?? "nothing";
    const count = formatInteger(frozen.count);
    return { name, verdict, says: `read ${frozen.readDate}  frozen ${held}  ${count} ${unit}` };
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

/** One row, in the shape the report prints it. */
export function formatReadingLine(state: ReadingState): string {
    assert(state.name.length > 0, "a row names the reading it is about");
    assert(state.says.length > 0, "and says what it was compared against");
    const said = VERDICT_WORDS[state.verdict];
    return `${state.name.padEnd(NAME_COLUMN)} ${state.says.padEnd(SAYS_COLUMN)} ${said}`;
}

/**
 * Each in the order that makes it meaningful: a table is frozen from the bundle fetched the line
 * above it, counts from the dump fetched above them, and durations from the page above those.
 */
async function writeRefreshedReadings(): Promise<void> {
    const client = await writeMargonemClientSourceCache(CHANNEL);
    console.log(`${"client".padEnd(NAME_COLUMN)} build ${client.build} → ${client.bundlePath}`);
    console.log(formatRefreshLine("frozen keys", "keys", writeFrozenKeyTable()));
    console.log(formatRefreshLine("frozen statuses", "bits", writeFrozenStatusBits()));
    const dump = await writeHelpArticleCache(MECHANICS_ARTICLE);
    const dumped = `${formatInteger(dump.textLength)} characters → ${dump.textPath}`;
    console.log(`${"help dump".padEnd(NAME_COLUMN)} ${dumped}`);
    console.log(
        formatRefreshLine("frozen help", "phrases", writeFrozenHelpCounts(MECHANICS_ARTICLE, [])),
    );
    const table = await writeSkillTableCache();
    const paged = `${formatInteger(table.pageLength)} characters → ${table.pagePath}`;
    console.log(`${"skill dump".padEnd(NAME_COLUMN)} ${paged}`);
    const skills = writeFrozenSkillTable();
    console.log(formatRefreshLine("frozen skills", "skills", skills));
    console.log(`${"".padEnd(NAME_COLUMN)} ${formatInteger(skills.auras)} reaching a side\n`);
}

/** What a freeze did: rewrote its files under a new date, or left them standing under the old. */
export function formatRefreshLine(name: string, unit: string, frozen: FrozenFiles): string {
    assert(name.length > 0, "a row names its reading");
    assert(frozen.count > 0, "and a reading counts something");
    const did = frozen.hasMoved ? `moved to ${frozen.date}` : `unchanged since ${frozen.date}`;
    return `${name.padEnd(NAME_COLUMN)} ${did}, ${formatInteger(frozen.count)} ${unit}`;
}

/**
 * The development client against what production froze: the keys and the bit order the next
 * release may bring. Nothing is written under `frozen/`, because production decides.
 */
async function writeDevelopmentPreview(): Promise<void> {
    let cached: CachedMargonemClientSource;
    try {
        cached = await writeMargonemClientSourceCache(PREVIEW_CHANNEL);
    } catch (failure) {
        if (!(failure instanceof MargonemUnreachableError)) throw failure;
        console.log(`${PREVIEW_CHANNEL.padEnd(NAME_COLUMN)} not asked: ${failure.message}`);
        Deno.exitCode = EXIT_UNASKED;
        return;
    }
    const bundle = readCachedBundle(PREVIEW_CHANNEL);
    const keys = composeKeyDifference(FROZEN_PROTOCOL_KEYS.keys, requireProtocolKeys(bundle));
    const bits = composeBitShifts(FROZEN_STATUS_BITS.bits, requireStatusBits(bundle));
    const frozenBuild = FROZEN_PROTOCOL_KEYS.gameBuild;
    console.log(
        `${PREVIEW_CHANNEL.padEnd(NAME_COLUMN)} build ${cached.build}, frozen ${frozenBuild}`,
    );
    console.log(formatPreviewKeys(keys));
    for (const key of keys.added) console.log(`  + ${key}`);
    for (const key of keys.removed) console.log(`  - ${key}`);
    console.log(`${"bits".padEnd(NAME_COLUMN)} ${bits.length === 0 ? "same order" : "reordered"}`);
    for (const shift of bits) console.log(formatBitShift(shift));
    const isAhead = keys.added.length + keys.removed.length + bits.length > 0;
    if (isAhead) Deno.exitCode = EXIT_AHEAD;
}

function formatPreviewKeys(keys: KeyDifference): string {
    const added = formatInteger(keys.added.length);
    const removed = formatInteger(keys.removed.length);
    assert(keys.added.every((key) => key.length > 0), "an added key is named");
    return `${"keys".padEnd(NAME_COLUMN)} ${added} added, ${removed} removed`;
}

function formatBitShift(shift: BitShift): string {
    assert(shift.bit >= 0, "a bit is a position");
    assertNotStrictEquals(shift.frozen, shift.lifted, "a shift is a position that differs");
    const bit = formatInteger(shift.bit);
    return `  bit ${bit}  frozen ${shift.frozen ?? "-"}  development ${shift.lifted ?? "-"}`;
}

/** Keys the development client branches on that production does not, and the other way round. */
export function composeKeyDifference(
    frozen: readonly string[],
    lifted: readonly string[],
): KeyDifference {
    const frozenKeys = new Set(frozen);
    const liftedKeys = new Set(lifted);
    const added = lifted.filter((key) => !frozenKeys.has(key)).sort();
    const removed = frozen.filter((key) => !liftedKeys.has(key)).sort();
    assert(added.length <= lifted.length, "no more keys added than were lifted");
    assert(removed.length <= frozen.length, "no more keys removed than were frozen");
    return { added, removed };
}

/** Every position a status differs at. A bit is read by position, so one inserted moves the rest. */
export function composeBitShifts(
    frozen: readonly string[],
    lifted: readonly string[],
): BitShift[] {
    assert(frozen.length <= STATUS_BITS_MAXIMUM, "a frozen mask fits an integer");
    assert(lifted.length <= STATUS_BITS_MAXIMUM, "and so does a lifted one");
    const shifts: BitShift[] = [];
    const length = Math.max(frozen.length, lifted.length);
    for (let bit = 0; bit < length; bit += 1) {
        const frozenName = frozen[bit] ?? null;
        const liftedName = lifted[bit] ?? null;
        if (frozenName === liftedName) continue;
        shifts.push({ bit, frozen: frozenName, lifted: liftedName });
    }
    return shifts;
}

if (import.meta.main) {
    const [command] = Deno.args;
    if (command === "refresh") {
        await writeRefreshedReadings();
        await writeReadingsStatus();
    } else if (command === "status") {
        await writeReadingsStatus();
    } else if (command === "preview") {
        await writeDevelopmentPreview();
    } else {
        throw new MargonemReadingsError(
            "usage: deno task margonem:readings status | refresh | preview",
        );
    }
}
