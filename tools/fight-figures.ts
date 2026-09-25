/**
 * What a recording adds up to, per combatant, as a terminal table: `develop:tools/fight-figures.ts`
 * at `RECORDINGS_REVISION`, written line for line, so `tools/develop-figures.ts` can hold the two
 * branches to one text (`docs/design.md` §12). The fight is the add-on's own reading of it, every
 * call through the envelope and the session, and a path names a recording at that revision.
 *
 *     deno task fight:figures [captures/<recording>.json …]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { formatInteger, parseInteger } from "#/libs/number-text.ts";
import { type CombatantRoster, COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { tallyFightFigures } from "#/src/core/fight-figures.ts";
import { getFightView } from "#/src/core/fight-session.ts";
import {
    type CombatantFigures,
    countUnreadMessages,
    type FightStatistics,
    type FigureCut,
    type SkillFigures,
} from "#/src/core/fight-statistics.ts";
import { getRankedOrder } from "#/src/ui/ranked-order.ts";
import {
    readRecordedFights,
    type RecordedFight,
    replayRecordedFight,
} from "#/tests/recorded-fights.ts";
import { RECORDINGS_DIRECTORY, RECORDINGS_REVISION } from "#/tests/recording-revision.ts";
import { RecordingReadError } from "./margometer-tool-error.ts";

/** As many members as the widest cut a card draws: the kinds, the defences, the procs. */
const CUT_PARTS_MAXIMUM = 64;
/** What one combatant's own skills are kept inside, as `develop` bounds them. */
const SKILLS_MAXIMUM = 256;
const RECORDINGS_MAXIMUM = 1_000;
const NAME_WIDTH = 26;
const NUMBER_WIDTH = 10;
/** Past the longest caption below, so the column of figures is a column. */
const CAPTION_WIDTH = 24;
const COUNT_WIDTH = 6;
/** What a cut with nothing in it says, so an empty line is never read as a missing one. */
const NOTHING = "—";
const HEADINGS = ["raw(blow)", "applied", "taken", "prevented", "restored", "given"];
const RECORDING_SUFFIX = ".json";
const PATH_SEPARATOR = "/";
const DETAIL_INDENT = "      ";

/** The lines `develop` prints for one recording, from the blank line over its heading down. */
export function formatFigureReport(fight: RecordedFight): string[] {
    const view = getFightView(replayRecordedFight(fight));
    if (view === null) {
        throw new RecordingReadError(`${fight.path} carries no payload the add-on would read`);
    }
    const statistics = tallyFightFigures(view).statistics;
    const side = view.readerSide;
    const lines = [
        "",
        `=== ${formatRecordingName(fight.path)} ===`,
        `  payloads ${formatInteger(view.payloadsApplied)}` +
        `   reader's side ${side === null ? "(the client never said)" : formatInteger(side)}` +
        `   ${view.isOver ? "over" : "still going"}` +
        `${view.hasJoinedInProgress ? "   joined in progress" : ""}`,
        `    ${"combatant".padEnd(NAME_WIDTH)}` +
        HEADINGS.map((heading) => heading.padStart(NUMBER_WIDTH)).join(""),
        ...formatSideLines(statistics, view.roster),
        "  —— the fight together ——",
        ...formatRowLines("everybody", statistics.totals, view.roster),
        ...formatReadingLines(statistics, view.messagesLost),
        ...formatOutcomeLines(statistics),
    ];
    assert(view.payloadsApplied > 0, "a report stands over a fight built from something");
    return lines;
}

/**
 * The sides in their own order, and **neither is called ours**: which one the reader was on is
 * stated once in the heading, and no verdict is drawn from it (`develop:CONTEXT.md`, _Side_).
 */
function formatSideLines(statistics: FightStatistics, roster: CombatantRoster): string[] {
    const lines: string[] = [];
    const sides = [...indexMembersBySide(statistics, roster)].sort(
        (one, other) => (one[0] ?? Number.MAX_SAFE_INTEGER) - (other[0] ?? Number.MAX_SAFE_INTEGER),
    );
    const readDealt = (id: number): number =>
        statistics.byCombatantId.get(id)?.damageDealtApplied ?? 0;
    for (const [side, members] of sides) {
        const caption = side === null ? "no side the roster gives" : `side ${side}`;
        lines.push(`  —— ${caption} (${formatInteger(members.length)}) ——`);
        const ranked = [...members].sort((one, other) => readDealt(other) - readDealt(one));
        for (const id of ranked) {
            const figures = statistics.byCombatantId.get(id);
            const label = roster.byId.get(id)?.name ?? `id ${formatInteger(id)}`;
            if (figures === undefined) {
                lines.push(`    ${label.padEnd(NAME_WIDTH)}${NOTHING.padStart(NUMBER_WIDTH)}`);
            } else lines.push(...formatRowLines(label, figures, roster));
        }
    }
    assert(lines.length >= sides.length, "every side stated has a heading of its own");
    return lines;
}

/** Every combatant a row could be drawn for: the roster's, so nobody is left off at zero. */
function indexMembersBySide(
    statistics: FightStatistics,
    roster: CombatantRoster,
): Map<number | null, number[]> {
    const bySide = new Map<number | null, number[]>();
    for (const combatant of roster.byId.values()) {
        bySide.set(combatant.side, [...(bySide.get(combatant.side) ?? []), combatant.id]);
    }
    for (const id of statistics.byCombatantId.keys()) {
        if (roster.byId.has(id)) continue;
        bySide.set(null, [...(bySide.get(null) ?? []), id]);
    }
    assert(bySide.size <= roster.byId.size + 1, "and on no more than one side each");
    return bySide;
}

function formatRowLines(
    label: string,
    figures: CombatantFigures,
    roster: CombatantRoster,
): string[] {
    assert(label.length > 0, "a row is drawn under a label");
    assert(figures.damageDealtRaw >= 0, "and never below nothing");
    const columns = [
        figures.damageDealtRaw,
        figures.damageDealtApplied,
        figures.damageTakenApplied,
        figures.damagePrevented,
        figures.healthRestored,
        figures.healthGiven,
    ].map((amount) => formatInteger(amount).padStart(NUMBER_WIDTH)).join("");
    return [
        `    ${label.slice(0, NAME_WIDTH).padEnd(NAME_WIDTH)}${columns}`,
        ...formatDetailLines(figures, roster),
        ...formatBlowLines(figures),
    ];
}

/** Kept off the numeric columns: these are not in one unit, and a column would say they were. */
function formatDetailLines(figures: CombatantFigures, roster: CombatantRoster): string[] {
    const details: [string, string][] = [
        ["dealt by element", formatCutText(figures.damageDealtByElement, null)],
        ["taken by element", formatCutText(figures.damageTakenByElement, null)],
        ["dealt to", formatCutText(figures.damageDealtByOpponent, roster)],
        ["taken from", formatCutText(figures.damageTakenByOpponent, roster)],
        ["restored by", formatCutText(figures.healthRestoredByGiver, roster)],
        ["given to", formatCutText(figures.healthGivenByReceiver, roster)],
        ["restored under", formatCutText(figures.healthRestoredBySource, null)],
        ["prevented by", formatCutText(figures.damagePreventedByDefence, null)],
        ["destroyed", formatCutText(figures.statisticsDestroyed, null)],
        ["procs striking", formatCutText(figures.procsWhenStriking, null)],
        ["procs struck", formatCutText(figures.procsWhenStruck, null)],
        ["skills announced", formatSkillText(figures.skills)],
    ];
    const lines = details
        .filter(([, text]) => text !== NOTHING)
        .map(([caption, text]) => `${DETAIL_INDENT}${caption}: ${text}`);
    assert(lines.length <= details.length, "a detail is written at most once");
    return lines;
}

function formatSkillText(skills: ReadonlyMap<string, SkillFigures>): string {
    assert(skills.size <= SKILLS_MAXIMUM, "a combatant announces no more than it is bounded to");
    if (skills.size === 0) return NOTHING;
    const written = [...skills.values()]
        .sort((one, other) => other.uses - one.uses)
        .map((skill) => `${skill.name} ×${formatInteger(skill.uses)}`);
    assertStrictEquals(written.length, skills.size, "every skill announced is written down");
    return written.join("  ");
}

/** Blows and the largest of them, which no sum can be read back out of. */
function formatBlowLines(figures: CombatantFigures): string[] {
    assert(figures.blowsWithoutSkill <= figures.blowsStruck, "a blow is one of the blows struck");
    assert(figures.blowsCritical <= figures.blowsStruck, "and so is a critical one");
    if (figures.blowsStruck === 0) return [];
    return [
        `${DETAIL_INDENT}blows: ${formatInteger(figures.blowsStruck)} struck, ` +
        `${formatInteger(figures.blowsWithoutSkill)} behind no announcement, ` +
        `${formatInteger(figures.blowsCritical)} critical`,
        `${DETAIL_INDENT}largest blow: ${formatInteger(figures.damageDealtBlowLargest)} dealt, ` +
        `${formatInteger(figures.damageTakenBlowLargest)} taken`,
    ];
}

/**
 * What the reading could not do, **printed at zero**: most of the corpus reads zero on all of
 * these, and a report silent about one looks exactly like one that never learned to state it.
 */
function formatReadingLines(statistics: FightStatistics, messagesLost: number): string[] {
    assert(countUnreadMessages(statistics) >= 0, "a reading states what it could not read");
    assert(messagesLost >= 0, "and what never reached it, even as none");
    const counts: [string, number][] = [
        ["unread, key unknown", statistics.unreadMessagesUnknownKey],
        ["unread, no parameter", statistics.unreadMessagesNoParameter],
        ["unread, grammar refused", statistics.unreadMessagesGrammarRefused],
        ["casts unplaced", statistics.castsUnplaced],
        ["casts stated", statistics.castsStated],
        ["dealt by nobody", statistics.dealtByNobody],
        ["taken by nobody", statistics.takenByNobody],
        ["given by nobody", statistics.givenByNobody],
        ["named neither end", statistics.byNeitherEnd],
        ["messages lost", messagesLost],
    ];
    return [
        "  —— what the reading could not do ——",
        ...counts.map(([caption, count]) =>
            `    ${caption.padEnd(CAPTION_WIDTH)}${formatInteger(count).padStart(COUNT_WIDTH)}`
        ),
    ];
}

/** Both sides by name and no verdict: a recording does not record who recorded it. */
function formatOutcomeLines(statistics: FightStatistics): string[] {
    const outcome = statistics.outcome;
    if (outcome === null) return ["  —— the fight states no outcome ——"];
    assert(outcome.wonNames.length <= COMBATANTS_MAXIMUM, "an outcome names a bounded cast");
    assert(outcome.lostNames.length <= COMBATANTS_MAXIMUM, "at either end of it");
    return [
        "  —— how it ended ——",
        ...(outcome.isDrawn ? ["    drawn: nobody won this fight"] : []),
        ...(outcome.isFled ? ["    fled:  an escape broke this fight off"] : []),
        `    won:  ${outcome.wonNames.join(", ") || "(nobody stated)"}`,
        `    lost: ${outcome.lostNames.join(", ") || "(nobody stated)"}`,
    ];
}

/**
 * A cut on one line, largest first and ties by key. The keys of the cuts taken by the other end of
 * a blow are combatant ids, put back through the roster: an id nobody can read places nothing.
 */
export function formatCutText(cut: FigureCut, roster: CombatantRoster | null): string {
    assert(cut.size <= CUT_PARTS_MAXIMUM, "a cut stays inside the parts a card draws");
    if (cut.size === 0) return NOTHING;
    const written = [...cut]
        .sort((one, other) => getRankedOrder(one[1], other[1], one[0], other[0]))
        .map(([key, amount]) => {
            // Through the reader rather than `Number`: a key that is not an id reads as nothing
            // rather than as `NaN` asking the roster a question.
            const id = parseInteger(key);
            const named = roster === null || id === null ? null : roster.byId.get(id);
            return `${named?.name ?? key} ${formatInteger(amount)}`;
        });
    assertStrictEquals(written.length, cut.size, "every member of the cut is written down");
    return written.join("  ");
}

/** The heading a report stands under: the file's own name, the directory and suffix off. */
export function formatRecordingName(path: string): string {
    assert(path.length > 0, "a recording is named by its path");
    const last = path.split(PATH_SEPARATOR).at(-1) ?? path;
    const name = last.endsWith(RECORDING_SUFFIX)
        ? last.slice(0, last.length - RECORDING_SUFFIX.length)
        : last;
    assert(name.length > 0, "and answers under a name that says something");
    return name;
}

/**
 * Every recording where no path was named, the named ones otherwise, as the whole text a terminal
 * prints. A path is one under `captures/` at the revision, and one that is not there is refused.
 */
export function formatRecordedFigures(paths: readonly string[]): string {
    const fights = readRecordedFights();
    assert(fights.length <= RECORDINGS_MAXIMUM, "the recordings stay inside their stated bound");
    const chosen = paths.length === 0 ? fights : paths.map((path) => {
        const found = fights.find((fight) => fight.path === path);
        if (found === undefined) {
            throw new RecordingReadError(
                `${path} is no recording under ${RECORDINGS_DIRECTORY} at ${RECORDINGS_REVISION}`,
            );
        }
        return found;
    });
    const material = paths.length === 0 ? RECORDINGS_DIRECTORY : paths.join(" ");
    const lines = [`material ${material}`, ...chosen.flatMap(formatFigureReport)];
    assert(lines.length > chosen.length, "every recording chosen is reported");
    return `${lines.join("\n")}\n`;
}

if (import.meta.main) {
    const text = formatRecordedFigures(Deno.args);
    await Deno.stdout.write(new TextEncoder().encode(text));
}
