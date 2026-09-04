/**
 * What stands in the fight right now, as the window beside the panel reads it: what one skill put
 * on a side, what the other side is making ready, whose Ostatni Ratunek has been spent, and what
 * the payload's own mask leaves standing.
 *
 * One group per watched subject, one row per bearer inside it. No DOM: the window is composed here
 * and drawn in `src/ui/panel-element.ts`, the way every other reading is.
 */

import { assert } from "@std/assert/assert";
import type { AuraStanding } from "@/src/core/aura-standing.ts";
import type { ChargeStanding } from "@/src/core/charge-standing.ts";
import type { CombatantRoster } from "@/src/core/combatant-roster.ts";
import type { FightStatistics } from "@/src/core/fight-statistics.ts";
import type { StatusRun } from "@/src/core/combatant-status.ts";
import { getWordsForStatus, LAST_RESORT_KEY, STANDING_WORDS } from "@/src/ui/panel-words.ts";

/** The bound `src/core/fight-statistics.ts` counts inside, read here as rows. */
const MAXIMUM_STANDING_ROWS = 512;

/**
 * The subjects this panel names itself, as against the ones the game names — an aura's subject is
 * the skill's own name, so it is spelled by the game and never here (**N13**).
 */
export const SUBJECT = {
    charge: "charge",
    lastResort: "last-resort",
    status: "status",
} as const;

/**
 * Statuses are the one subject that starts off: they are read per combatant rather than per cast,
 * so in a ten-on-ten they cost more rows than everything else together.
 */
export const SUBJECTS_OFF_BY_DEFAULT: readonly string[] = [SUBJECT.status];

export type StandingFigure =
    /** What has passed, of what the published table states. Never a countdown — **ADR 0053**. */
    | { kind: "elapsed"; turnsElapsed: number; turnsStated: number }
    /** The game's own figure for a charge. Never turned into turns — **ADR 0054**. */
    | { kind: "percent"; percent: number }
    /** Something standing that states no end at all, said in words instead of drawn as a bar. */
    | { kind: "words"; words: string };

export interface StandingRow {
    /** Null where the roster cannot place them: a row is drawn under whoever the game named. */
    name: string | null;
    /** Null where the game never said which side is the reader's, so neither hue is earned. */
    isReaderSide: boolean | null;
    figure: StandingFigure;
}

export interface StandingGroup {
    subject: string;
    title: string;
    rows: readonly StandingRow[];
}

/** One line of the watchlist: what it is, whether it is watched, and how much of it stands. */
export interface StandingSubject {
    key: string;
    title: string;
    isWatched: boolean;
    standing: number;
}

export interface StandingReading {
    groups: readonly StandingGroup[];
    rows: number;
    subjects: readonly StandingSubject[];
}

/** What the reader has turned off, by subject key. Absent means the subject's own default. */
export type WatchChoices = Readonly<Record<string, boolean>>;

export function getIsWatched(choices: WatchChoices, key: string): boolean {
    assert(key.length > 0, "a subject is asked about by name");
    const chosen = choices[key];
    if (chosen !== undefined) return chosen;
    return !SUBJECTS_OFF_BY_DEFAULT.includes(key);
}

/**
 * Null rather than a name of our own where the roster cannot place somebody: a row is drawn under
 * whoever the game named, and never under a guess (`PRODUCT.md`).
 */
function getName(roster: CombatantRoster, combatantId: number): string | null {
    const combatant = roster.byId.get(combatantId);
    if (combatant === undefined) return null;
    assert(combatant.name.length > 0, "a combatant the roster holds is named");
    return combatant.name;
}

function getIsReaderSide(
    roster: CombatantRoster,
    combatantId: number,
    readerSide: number | null,
): boolean | null {
    if (readerSide === null) return null;
    const combatant = roster.byId.get(combatantId);
    if (combatant === undefined) return null;
    assert(Number.isFinite(combatant.side), "a combatant the roster holds stands on a side");
    return combatant.side === readerSide;
}

function composeRow(
    roster: CombatantRoster,
    combatantId: number,
    readerSide: number | null,
    figure: StandingFigure,
): StandingRow {
    assert(Number.isSafeInteger(combatantId), "a row is about somebody the game numbered");
    assert(figure.kind.length > 0, "and carries a figure of a kind this window draws");
    return {
        name: getName(roster, combatantId),
        isReaderSide: getIsReaderSide(roster, combatantId, readerSide),
        figure,
    };
}

/** One group per skill, in the order the statistics already put the casts in. */
function composeAuraGroups(
    standings: readonly AuraStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingGroup[] {
    const byName = new Map<string, StandingRow[]>();
    for (const standing of standings) {
        assert(standing.turnsStated > 0, "a cast that is drawn runs for a stated number of turns");
        assert(standing.turnsElapsed >= 0, "and has run no fewer than none of them");
        const held = byName.get(standing.skillName) ?? [];
        held.push(composeRow(roster, standing.casterId, readerSide, {
            kind: "elapsed",
            turnsElapsed: standing.turnsElapsed,
            turnsStated: standing.turnsStated,
        }));
        byName.set(standing.skillName, held);
    }
    const groups: StandingGroup[] = [];
    for (const [skillName, rows] of byName) {
        assert(rows.length > 0, "a group that was made holds a cast");
        assert(skillName.length > 0, "and is filed under the skill the game named");
        groups.push({ subject: skillName, title: skillName, rows });
    }
    assert(groups.length <= standings.length, "no group was made for a cast that was not standing");
    return groups;
}

/** Every charge in one group: it is the other side's move, and the skill is the row rather than
 * the heading — a reader asks what is coming, not how many of one thing there are. */
function composeChargeGroup(
    standings: readonly ChargeStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingGroup | null {
    if (standings.length === 0) return null;
    const rows = standings.map((standing) => {
        assert(standing.skillName.length > 0, "a charge names the skill the game named");
        const row = composeRow(roster, standing.combatantId, readerSide, {
            kind: "percent",
            percent: standing.percent,
        });
        return { ...row, name: standing.skillName };
    });
    assert(rows.length === standings.length, "every charge standing is a row and none is two");
    assert(
        rows.every((row) => row.figure.kind === "percent"),
        "and each says the game's own figure",
    );
    return { subject: SUBJECT.charge, title: STANDING_WORDS.charge, rows };
}

/** Whose Ostatni Ratunek has fired. The protocol never says who carries one, only whom it saved. */
function composeLastResortGroup(
    statistics: FightStatistics,
    roster: CombatantRoster,
    readerSide: number | null,
): StandingGroup | null {
    const rows: StandingRow[] = [];
    for (const [combatantId, figures] of statistics.byCombatantId) {
        const restored = figures.healthRestoredBySource.get(LAST_RESORT_KEY);
        if (restored === undefined) continue;
        assert(restored !== 0, "a bonus that fired restored something");
        rows.push(composeRow(roster, combatantId, readerSide, {
            kind: "words",
            words: STANDING_WORDS.spent,
        }));
    }
    if (rows.length === 0) return null;
    assert(rows.length <= statistics.byCombatantId.size, "nobody is saved twice on one list");
    return { subject: SUBJECT.lastResort, title: STANDING_WORDS.lastResort, rows };
}

/**
 * One group per status, and the length is how long the bit has stood — never how long it has left,
 * because the payload states no remainder (**ADR 0050**). A bit the client words nowhere is drawn
 * as the bit it is rather than under a name of ours.
 */
function composeStatusGroups(
    runs: readonly StatusRun[],
    roster: CombatantRoster,
    readerSide: number | null,
): StandingGroup[] {
    const byTitle = new Map<string, StandingRow[]>();
    for (const run of runs) {
        if (!run.isStanding) continue;
        assert(run.turns >= 0, "a status never runs back a turn");
        const title = getWordsForStatus(run.key, run.bit);
        const held = byTitle.get(title) ?? [];
        held.push(composeRow(roster, run.combatantId, readerSide, {
            kind: "words",
            words: STANDING_WORDS.forTurns(run.turns),
        }));
        byTitle.set(title, held);
    }
    const groups: StandingGroup[] = [];
    for (const [title, rows] of byTitle) {
        assert(title.length > 0, "a status that is drawn is worded or named by its own bit");
        assert(rows.length > 0, "and a group that was made holds a bearer");
        groups.push({ subject: SUBJECT.status, title, rows });
    }
    assert(groups.length <= runs.length, "no group was made for a status that was not standing");
    return groups;
}

/**
 * The watchlist: every subject this fight has offered, plus the ones the reader has an answer for
 * already. A subject the reader has never met is not on it — the skills that reach a side are
 * named by the game and by nothing in this repository, so a fixed list would have to invent them.
 */
function composeSubjects(
    groups: readonly StandingGroup[],
    choices: WatchChoices,
): StandingSubject[] {
    const standingByKey = new Map<string, number>();
    const titleByKey = new Map<string, string>();
    for (const group of groups) {
        standingByKey.set(
            group.subject,
            (standingByKey.get(group.subject) ?? 0) + group.rows.length,
        );
        // ⚠️ **The list is titled by the subject, never by the first group under it.** Every
        // status shares one key, so a row reading „Spowolnienie" would turn the whole mask off
        // under the name of one bit of it.
        if (!titleByKey.has(group.subject)) {
            titleByKey.set(group.subject, STANDING_WORDS.forSubject(group.subject));
        }
    }
    for (const key of [SUBJECT.charge, SUBJECT.lastResort, SUBJECT.status]) {
        if (!titleByKey.has(key)) titleByKey.set(key, STANDING_WORDS.forSubject(key));
    }
    for (const key of Object.keys(choices)) {
        if (!titleByKey.has(key)) titleByKey.set(key, STANDING_WORDS.forSubject(key));
    }
    const subjects: StandingSubject[] = [];
    for (const [key, title] of titleByKey) {
        subjects.push({
            key,
            title,
            isWatched: getIsWatched(choices, key),
            standing: standingByKey.get(key) ?? 0,
        });
    }
    assert(subjects.length >= 0, "a watchlist is a list even when the fight has offered nothing");
    return subjects;
}

/**
 * Everything standing, and what the reader is watching of it. The groups are composed whatever the
 * watchlist says and filtered after, so the list can state how much stands under a subject that is
 * turned off — a reader who cannot see that has no way to tell a quiet fight from a hidden one.
 */
export function composeStandingReading(
    statistics: FightStatistics,
    roster: CombatantRoster,
    readerSide: number | null,
    choices: WatchChoices = {},
): StandingReading {
    const composed: StandingGroup[] = [
        ...composeAuraGroups(statistics.auraStandings, roster, readerSide),
    ];
    const charge = composeChargeGroup(statistics.chargeStandings, roster, readerSide);
    if (charge !== null) composed.push(charge);
    const lastResort = composeLastResortGroup(statistics, roster, readerSide);
    if (lastResort !== null) composed.push(lastResort);
    composed.push(...composeStatusGroups(statistics.statusRuns, roster, readerSide));
    const subjects = composeSubjects(composed, choices);
    const groups = composed.filter((group) => getIsWatched(choices, group.subject));
    let rows = 0;
    for (const group of groups) rows += group.rows.length;
    assert(rows <= MAXIMUM_STANDING_ROWS, "a fight stays inside its stated bound");
    assert(
        groups.length <= composed.length,
        "and the watchlist takes rows away rather than adding",
    );
    return { groups, rows, subjects };
}
