/**
 * What a recording adds up to, per combatant — the table the panel draws, at a terminal.
 *
 *     deno task figures [recording.json …]
 *
 * It takes what `tools/decoding-status.ts` takes and for the argument written there: the two
 * questions are asked of one file in one sitting, and neither should need intake first. The
 * figures are the replay's, so this and the panel cannot disagree about a fight
 * (`tools/fight-replay.ts`).
 */

import { assert } from "@std/assert";
import { type CombatantRoster, MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import type {
    CombatantFigures,
    FightStatistics,
    FigureCut,
    SkillFigures,
} from "@/src/core/fight-statistics.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { composeReplayedMaterial, type FightReplay } from "@/tools/fight-replay.ts";

/** As many members as the widest cut a card draws: the kinds, the defences, the procs. */
const MAXIMUM_CUT_PARTS = 64;
/** What one combatant's own skills are kept inside, measured in `src/ui/panel-reading.ts`. */
const MAXIMUM_SKILLS = 256;
const NAME_WIDTH = 26;
const NUMBER_WIDTH = 10;
const CAPTION_WIDTH = 20;
/** What a cut with nothing in it says, so an empty line is never read as a missing one. */
const NOTHING = "—";
const HEADINGS = ["raw(blow)", "applied", "taken", "prevented", "restored", "given"];

/** Descending by amount, then by the name, so two runs over one recording read alike. */
function getCutOrder(one: readonly [string, number], other: readonly [string, number]): number {
    if (one[1] !== other[1]) return other[1] - one[1];
    if (one[0] < other[0]) return -1;
    if (one[0] > other[0]) return 1;
    return 0;
}

/**
 * A cut on one line. The keys of the two cuts taken by the other end of a blow are combatant ids,
 * so they are put back through the roster — an id in a table nobody can read is a figure nobody
 * can place.
 */
function composeCutText(cut: FigureCut, roster: CombatantRoster | null): string {
    assert(cut.size <= MAXIMUM_CUT_PARTS, "a cut stays inside the parts a card draws");
    if (cut.size === 0) return NOTHING;
    const written = [...cut].sort(getCutOrder).map(([key, amount]) => {
        // Through the owner rather than through `Number`: a key that is not an id — an element,
        // a protocol key — reads as nothing rather than as `NaN` asking the roster a question.
        const id = getIntegerFromText(key);
        const named = roster === null || id === null ? null : roster.byId.get(id);
        return `${named?.name ?? key} ${composeIntegerText(amount)}`;
    });
    assert(written.length === cut.size, "every member of the cut is written down");
    return written.join("  ");
}

function composeSkillText(skills: ReadonlyMap<string, SkillFigures>): string {
    assert(skills.size <= MAXIMUM_SKILLS, "a combatant announces no more than it is bounded to");
    if (skills.size === 0) return NOTHING;
    const written = [...skills.values()]
        .sort((one, other) => other.uses - one.uses)
        .map((skill) => `${skill.name} ×${composeIntegerText(skill.uses)}`);
    assert(written.length === skills.size, "every skill announced is written down");
    return written.join("  ");
}

/** Kept off the numeric columns: these are not in one unit, and a column would say they were. */
function composeDetailLines(figures: CombatantFigures, roster: CombatantRoster): string[] {
    const details: [string, string][] = [
        ["dealt by element", composeCutText(figures.damageDealtByElement, null)],
        ["taken by element", composeCutText(figures.damageTakenByElement, null)],
        ["dealt to", composeCutText(figures.damageDealtByOpponent, roster)],
        ["taken from", composeCutText(figures.damageTakenByOpponent, roster)],
        ["restored by", composeCutText(figures.healthRestoredByGiver, roster)],
        ["given to", composeCutText(figures.healthGivenByReceiver, roster)],
        ["restored under", composeCutText(figures.healthRestoredBySource, null)],
        ["prevented by", composeCutText(figures.damagePreventedByDefence, null)],
        ["destroyed", composeCutText(figures.statisticsDestroyed, null)],
        ["procs striking", composeCutText(figures.procsWhenStriking, null)],
        ["procs struck", composeCutText(figures.procsWhenStruck, null)],
        ["skills announced", composeSkillText(figures.skills)],
    ];
    const lines = details
        .filter(([, text]) => text !== NOTHING)
        .map(([caption, text]) => `      ${caption}: ${text}`);
    assert(lines.length <= details.length, "a detail is written at most once");
    return lines;
}

/** Blows and the largest of them, which no sum can be read back out of. */
function composeBlowLines(figures: CombatantFigures): string[] {
    assert(figures.blowsWithoutSkill <= figures.blowsStruck, "a blow is one of the blows struck");
    assert(figures.blowsCritical <= figures.blowsStruck, "and so is a critical one");
    if (figures.blowsStruck === 0) return [];
    return [
        `      blows: ${composeIntegerText(figures.blowsStruck)} struck, ` +
        `${composeIntegerText(figures.blowsWithoutSkill)} behind no announcement, ` +
        `${composeIntegerText(figures.blowsCritical)} critical`,
        `      largest blow: ${composeIntegerText(figures.damageDealtBlowLargest)} dealt, ` +
        `${composeIntegerText(figures.damageTakenBlowLargest)} taken`,
    ];
}

function composeRowLines(
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
    ].map((amount) => composeIntegerText(amount).padStart(NUMBER_WIDTH)).join("");
    return [
        `    ${label.slice(0, NAME_WIDTH).padEnd(NAME_WIDTH)}${columns}`,
        ...composeDetailLines(figures, roster),
        ...composeBlowLines(figures),
    ];
}

/** Every combatant a row could be drawn for: the roster's, so nobody is left off at zero. */
function composeMembersBySide(replay: FightReplay): Map<number | null, number[]> {
    const bySide = new Map<number | null, number[]>();
    for (const combatant of replay.roster.byId.values()) {
        bySide.set(combatant.side, [...(bySide.get(combatant.side) ?? []), combatant.id]);
    }
    for (const id of replay.statistics.byCombatantId.keys()) {
        if (replay.roster.byId.has(id)) continue;
        bySide.set(null, [...(bySide.get(null) ?? []), id]);
    }
    assert(bySide.size <= replay.roster.byId.size + 1, "and on no more than one side each");
    return bySide;
}

/**
 * The sides in their own order, and **neither is called ours**: which one the reader was on takes
 * the client's own word, so it is stated once as a fact and no verdict is drawn from it
 * (`CONTEXT.md`, *Side*).
 */
function composeSideLines(replay: FightReplay): string[] {
    const empty: CombatantFigures[] = [];
    assert(empty.length === 0, "a row nothing named is a row of zeroes, not a missing row");
    const lines: string[] = [];
    const sides = [...composeMembersBySide(replay)].sort(
        (one, other) => (one[0] ?? Number.MAX_SAFE_INTEGER) - (other[0] ?? Number.MAX_SAFE_INTEGER),
    );
    const getRow = (id: number): CombatantFigures | undefined =>
        replay.statistics.byCombatantId.get(id);
    for (const [side, members] of sides) {
        const caption = side === null ? "no side the roster gives" : `side ${side}`;
        lines.push(`  —— ${caption} (${composeIntegerText(members.length)}) ——`);
        const ranked = [...members].sort((one, other) =>
            (getRow(other)?.damageDealtApplied ?? 0) - (getRow(one)?.damageDealtApplied ?? 0)
        );
        for (const id of ranked) {
            const figures = getRow(id);
            const label = replay.roster.byId.get(id)?.name ?? `id ${composeIntegerText(id)}`;
            if (figures === undefined) {
                lines.push(`    ${label.padEnd(NAME_WIDTH)}${"—".padStart(NUMBER_WIDTH)}`);
            } else lines.push(...composeRowLines(label, figures, replay.roster));
        }
    }
    assert(lines.length >= sides.length, "every side stated has a heading of its own");
    return lines;
}

/**
 * What the reading could not do, **printed at zero**. A report silent about its reading looks
 * exactly like one that never learned to state it, and most of the corpus reads zero on all of
 * these — so a suppressed line here would be suppressed everywhere.
 */
function composeReadingLines(replay: FightReplay): string[] {
    const statistics = replay.statistics;
    assert(statistics.unreadMessages >= 0, "a reading states what it could not read, even as none");
    assert(replay.reading.messagesLost >= 0, "and what never reached it, even as none");
    const counts: [string, number][] = [
        ["unread messages", statistics.unreadMessages],
        ["casts unplaced", statistics.castsUnplaced],
        ["dealt by nobody", statistics.dealtByNobody],
        ["taken by nobody", statistics.takenByNobody],
        ["given by nobody", statistics.givenByNobody],
        ["named neither end", statistics.byNeitherEnd],
        // Kept apart from what the decoder could not read, for the reason
        // `src/game/fight-report.ts` gives where it prints the same two.
        ["messages lost", replay.reading.messagesLost],
    ];
    return [
        "  —— what the reading could not do ——",
        ...counts.map(([caption, count]) =>
            `    ${caption.padEnd(CAPTION_WIDTH)}${composeIntegerText(count).padStart(6)}`
        ),
    ];
}

/** Both sides by name and no verdict: a recording does not record who recorded it. */
function composeOutcomeLines(statistics: FightStatistics): string[] {
    const outcome = statistics.outcome;
    if (outcome === null) return ["  —— the fight states no outcome ——"];
    assert(outcome.wonNames.length <= MAXIMUM_COMBATANTS, "an outcome names a bounded cast");
    assert(outcome.lostNames.length <= MAXIMUM_COMBATANTS, "at either end of it");
    return [
        "  —— how it ended ——",
        ...(outcome.isDrawn ? ["    drawn: nobody won this fight"] : []),
        `    won:  ${outcome.wonNames.join(", ") || "(nobody stated)"}`,
        `    lost: ${outcome.lostNames.join(", ") || "(nobody stated)"}`,
    ];
}

export function composeFigureReport(replay: FightReplay): string[] {
    assert(replay.name.length > 0, "a report is headed by the recording it was taken on");
    assert(replay.reading.payloads > 0, "and over a fight built from something");
    const side = replay.reading.readerSide;
    return [
        "",
        `=== ${replay.name} ===`,
        `  payloads ${composeIntegerText(replay.reading.payloads)}` +
        `   reader's side ${side === null ? "(the client never said)" : composeIntegerText(side)}` +
        `   ${replay.reading.isOver ? "over" : "still going"}` +
        `${replay.reading.hasJoinedInProgress ? "   joined in progress" : ""}`,
        `    ${"combatant".padEnd(NAME_WIDTH)}` +
        HEADINGS.map((heading) => heading.padStart(NUMBER_WIDTH)).join(""),
        ...composeSideLines(replay),
        "  —— the fight together ——",
        ...composeRowLines("everybody", replay.statistics.totals, replay.roster),
        ...composeReadingLines(replay),
        ...composeOutcomeLines(replay.statistics),
    ];
}

if (import.meta.main) {
    const replayed = composeReplayedMaterial(Deno.args);
    console.log(`material ${replayed.material}`);
    for (const replay of replayed.replays) {
        for (const line of composeFigureReport(replay)) console.log(line);
    }
}
