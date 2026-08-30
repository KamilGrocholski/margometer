/**
 * Every column of shares the panel draws comes to a hundred (`DESIGN.md`).
 *
 * A section short of the whole is the failure this repository exists to prevent, one rung down: a
 * reader adds the rows, gets ninety-four, and has no way of knowing whether six points went
 * missing or were never there. So the rule is held over every recording, every screen, every seat
 * and every rung, rather than over the one screen a change was made on.
 */

import { assert, assertEquals, AssertionError, assertThrows } from "@std/assert";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
    composeDrillReading,
    composePairReading,
    composePanelReading,
    composeSkillReading,
    NOTHING_MISSED,
    type PanelMetric,
} from "@/src/ui/panel-reading.ts";
import { SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

const HUNDRED = 100;
/** What a row holding something too small to state a point prints, in place of a share. */
const SHARE_FLOOR = "<1%";
const NO_SHARE = "0%";

/** As a row is drawn: what it holds, beside the share it printed for it. */
interface ShareRow {
    figure: number;
    shareText: string;
}

interface Section {
    where: string;
    rows: ShareRow[];
    total: number;
}

function getPointsFromShareText(text: string): number {
    assert(text.length > 0, "a row that was drawn states a share");
    if (text === SHARE_FLOOR) return 0;
    assert(text.endsWith("%"), "and a share is written in points of a hundred");
    const points = Number(text.slice(0, -1).split(" ").join(""));
    assert(Number.isSafeInteger(points), `a share reading ${text} is not a whole number of points`);
    return points;
}

/** Null where the column is not drawn at all: a section nobody sees makes no claim. */
function getShareSum(section: Section): number | null {
    if (section.total <= 0) return null;
    if (section.rows.length === 0) return null;
    return section.rows.reduce((sum, one) => sum + getPointsFromShareText(one.shareText), 0);
}

/**
 * Nothing prints `0%` and something below a point prints `<1%`, and the two are never swapped: a
 * row saying nought where a figure stands is the panel losing it, and one saying `<1%` where none
 * does is the panel inventing it. A `<1%` row costs the column no point, so a column carrying one
 * still comes to a hundred in the numbers it prints.
 */
function expectShareTellsNothingFromSomething(where: string, row: ShareRow): void {
    assert(row.figure >= 0, `${where}: a row drawn holds no less than nothing`);
    if (row.figure === 0) {
        assertEquals(row.shareText, NO_SHARE, `${where}: a row holding nothing states a share`);
        return;
    }
    assert(row.shareText !== NO_SHARE, `${where}: ${row.figure} printed as none of the whole`);
    if (row.shareText === SHARE_FLOOR) return;
    assert(getPointsFromShareText(row.shareText) > 0, `${where}: a share of nought is not a share`);
}

function readFight(path: string) {
    const combatants = getRecordedCombatants(path);
    const roster = composeCombatantRoster(combatants);
    const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
    return { roster, statistics: composeFightStatistics(events, composeTeamHeals(events, roster)) };
}

/**
 * Every rung under one row. The closing row of each cut is part of its column: it is what the
 * rows above do not hold, so a column read without it is the shortfall itself.
 */
function composeSectionsForScreenRow(
    fight: ReturnType<typeof readFight>,
    metric: PanelMetric,
    combatantId: number,
): Section[] {
    const { roster, statistics } = fight;
    const drill = composeDrillReading(statistics, roster, metric, combatantId);
    if (drill === null) return [];
    const found: Section[] = [
        {
            where: `${metric}/drill.byOpponent`,
            rows: composeCutShares(drill.byOpponent.rows, drill.byOpponent.unnamed),
            total: drill.total,
        },
        {
            where: `${metric}/drill.bySkill`,
            rows: composeCutShares(drill.bySkill.rows, drill.bySkill.plain),
            total: drill.total,
        },
        {
            where: `${metric}/drill.byElement`,
            rows: composeCutShares(drill.byElement.rows, drill.byElement.unnamed),
            total: drill.total,
        },
    ];
    for (const other of drill.byOpponent.rows) {
        const at = [combatantId, other.combatantId] as const;
        const pair = composePairReading(statistics, roster, metric, at[0], at[1]);
        if (pair === null) continue;
        found.push({
            where: `${metric}/pair.bySkill`,
            rows: composeCutShares(pair.bySkill.rows, pair.bySkill.plain),
            total: pair.total,
        });
        found.push({
            where: `${metric}/pair.byElement`,
            rows: composeCutShares(pair.byElement.rows, pair.byElement.unnamed),
            total: pair.total,
        });
    }
    for (const named of drill.bySkill.rows) {
        const skill = composeSkillReading(statistics, roster, metric, combatantId, named.name);
        if (skill === null) continue;
        found.push({
            where: `${metric}/skill.byOpponent`,
            rows: composeCutShares(skill.byOpponent.rows, skill.byOpponent.unnamed),
            total: skill.total,
        });
    }
    return found;
}

/** The ranking of one screen for one seat, and every rung the rows on it open onto. */
function composeSectionsForScreen(
    fight: ReturnType<typeof readFight>,
    metric: PanelMetric,
    side: "everyone" | "reader" | "opposing",
    readerSide: number | null,
): Section[] {
    const { roster, statistics } = fight;
    const reading = composePanelReading(
        statistics,
        roster,
        metric,
        side,
        readerSide,
        NOTHING_MISSED,
    );
    const found: Section[] = [{
        where: `${metric}/ranking`,
        // A pinned figure standing as a cut is already inside the rows; only one standing apart
        // joins the whole, which is the arithmetic `composePanelReading` shares them by.
        rows: [
            ...reading.rows,
            ...reading.pinned.filter((one) => one.standing === "apart"),
        ],
        total: reading.total,
    }];
    for (const row of reading.rows) {
        found.push(...composeSectionsForScreenRow(fight, metric, row.combatantId));
    }
    return found;
}

function composeCutShares(
    rows: readonly ShareRow[],
    closing: ShareRow | null,
): ShareRow[] {
    const shares = rows.map((one) => ({ figure: one.figure, shareText: one.shareText }));
    if (closing === null) return shares;
    return [...shares, { figure: closing.figure, shareText: closing.shareText }];
}

Deno.test("every column of shares the panel draws comes to a hundred", () => {
    let drawn = 0;
    for (const path of getRecordingPaths()) {
        const fight = readFight(path);
        const seats = [...new Set([...fight.roster.byId.values()].map((one) => one.side))];
        for (const readerSide of [null, ...seats]) {
            for (const side of ["everyone", "reader", "opposing"] as const) {
                if (readerSide === null && side !== "everyone") continue;
                for (const metric of SCREEN_ORDER) {
                    for (
                        const section of composeSectionsForScreen(fight, metric, side, readerSide)
                    ) {
                        const sum = getShareSum(section);
                        if (sum === null) continue;
                        drawn += 1;
                        assertEquals(sum, HUNDRED, `${path}: ${section.where} comes to ${sum}`);
                        for (const row of section.rows) {
                            expectShareTellsNothingFromSomething(
                                `${path}: ${section.where}`,
                                row,
                            );
                        }
                    }
                }
            }
        }
    }
    // The reader is proved by what it found as well as by what it passed: a sweep that stopped
    // reaching the rungs would agree with every screen it never opened.
    assertEquals(drawn, 19_178, "every column the corpus draws, 2026-08-30");
});

function composeSection(where: string, rows: ShareRow[], total: number): Section {
    return { where, rows, total };
}

/** The sample it must flag, so a green run is the columns adding up and not the reader stopping. */
Deno.test("a column short of the whole is read as short", () => {
    const short = composeSection("made up", [
        { figure: 600, shareText: "60%" },
        { figure: 340, shareText: "34%" },
    ], 1000);
    assertEquals(getShareSum(short), 94, "the reader adds a column that misses the hundred");
    const floored = composeSection("made up", [
        { figure: 994, shareText: "99%" },
        { figure: 1, shareText: SHARE_FLOOR },
        { figure: 5, shareText: "1%" },
    ], 1000);
    assertEquals(getShareSum(floored), 100, "a row below a point costs the column no point");
    assertEquals(getShareSum(composeSection("made up", [], 1000)), null, "an undrawn column");
    const whole: ShareRow[] = [{ figure: 1, shareText: "100%" }];
    assertEquals(getShareSum(composeSection("made up", whole, 0)), null, "or one of nothing");
});

/** And the two the other reader must flag, which are the ways a row can misword what it holds. */
Deno.test("a row wording nothing as something, or the reverse, is read as wrong", () => {
    expectShareTellsNothingFromSomething("held", { figure: 0, shareText: NO_SHARE });
    expectShareTellsNothingFromSomething("held", { figure: 1, shareText: SHARE_FLOOR });
    expectShareTellsNothingFromSomething("held", { figure: 500, shareText: "50%" });
    assertThrows(
        () => expectShareTellsNothingFromSomething("held", { figure: 1, shareText: NO_SHARE }),
        AssertionError,
        "printed as none of the whole",
    );
    assertThrows(
        () => expectShareTellsNothingFromSomething("held", { figure: 0, shareText: SHARE_FLOOR }),
        AssertionError,
        "a row holding nothing states a share",
    );
});
