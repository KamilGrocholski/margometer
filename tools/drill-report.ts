/**
 * Which rows of the panel open onto another level, measured over the recordings.
 *
 *     deno task drill --cases                 the verdicts, with the counts behind them
 *     deno task drill [recording.json …]      one recording, level by level
 *     deno task drill --screen healthGiven    one screen of it
 *
 * It composes the levels the panel composes, so a verdict here is the panel's own answer and not
 * a second reading of the rule. `docs/drill-levels.md` carries the verdicts; the counts stay here,
 * because they change with the next recording (**V5**).
 */

import { assert } from "@std/assert";
import { composeIntegerText } from "@/libs/number-text.ts";
import {
    composeDrillReading,
    composeHalfNamedDrillReading,
    composeHalfNamedReading,
    composePairReading,
    composePanelReading,
    composePartReading,
    getMetricForPinned,
    getTextForNamedPart,
    type HalfNamedDrillReading,
    type HalfNamedOpened,
    type HalfNamedReading,
    type NamedPart,
    NOTHING_MISSED,
    type PanelMetric,
    type PinnedCase,
} from "@/src/ui/panel-reading.ts";
import { getScreenFromName, SCREEN_ORDER } from "@/src/ui/panel-screen.ts";
import { composeReplayedMaterial, type FightReplay } from "@/tools/fight-replay.ts";
import { DrillReportError } from "@/tools/margometer-tool-error.ts";

/**
 * The views, named by what a reader did to get there — and three levels, because `pair` and
 * `part` are two shapes of the third rather than one under the other. Both are a press away from
 * `opened` and neither is reachable from the other. A part is a skill, a key or a kind: the level
 * under all three lists people, so one rung holds them.
 *
 * `unnamed` is the odd one and sits on the second level, off a branch of its own: it is opened
 * from a pinned row under the ranking rather than from a row on it (**ADR 0038**).
 */
export const DRILL_RUNGS = ["ranking", "opened", "pair", "part", "unnamed", "unnamed cut"] as const;
export type DrillRung = (typeof DRILL_RUNGS)[number];

/**
 * Every kind of row the panel draws below a heading. `half-named` is the end the protocol left
 * out, `closing` the row that stands for what no announcement covered, `no kind` its twin in a
 * section cut by what a figure was made of, and `neither end` the part of a half-named figure the
 * protocol named no end of at all.
 */
export const DRILL_ROWS = [
    "person",
    "half-named",
    "skill",
    "source",
    "closing",
    "kind",
    "no kind",
    "neither end",
] as const;
export type DrillRow = (typeof DRILL_ROWS)[number];

/** What the register calls a part, which is the reader's word for it and not the type's. */
function getRowForPart(part: NamedPart): DrillRow {
    if (part.kind === "skill") return "skill";
    if (part.kind === "source") return "source";
    return "kind";
}

/** `sometimes` is the only verdict that needs a rule written beside it. */
export const DRILL_VERDICTS = ["always", "sometimes", "never"] as const;
export type DrillVerdict = (typeof DRILL_VERDICTS)[number];

export interface DrillCase {
    screen: PanelMetric;
    rung: DrillRung;
    row: DrillRow;
    verdict: DrillVerdict;
    /** How many rows of this kind the material drew, on each side of the answer. */
    opens: number;
    shut: number;
}

/**
 * A case is kept under all three of the things that name it, and nothing else tells two apart.
 *
 * ⚠️ **The separator is a printing character.** It was `\0` until 2026-08-31, which is a byte git
 * reads as binary: the file stopped carrying a diff at all, and a review of it saw `Bin 14286 ->
 * 15229 bytes`. No name in the three vocabularies holds a bar, and only the last field holds a
 * space, so no two triples come to one key.
 */
function composeCaseKey(screen: PanelMetric, rung: DrillRung, row: DrillRow): string {
    assert(SCREEN_ORDER.includes(screen), "a case is counted for a screen the strips draw");
    return `${screen} | ${rung} | ${row}`;
}

interface CaseTally {
    screen: PanelMetric;
    rung: DrillRung;
    row: DrillRow;
    opens: number;
    shut: number;
}

/** What the walk writes into, so the same row kind seen twice is one case with two counts. */
type DrillTally = Map<string, CaseTally>;

function addToTally(
    tally: DrillTally,
    screen: PanelMetric,
    where: { rung: DrillRung; row: DrillRow },
    opens: boolean,
): void {
    const key = composeCaseKey(screen, where.rung, where.row);
    const held = tally.get(key) ?? { screen, rung: where.rung, row: where.row, opens: 0, shut: 0 };
    if (opens) held.opens += 1;
    else held.shut += 1;
    tally.set(key, held);
    assert(held.opens + held.shut > 0, "a case counted was counted at least once");
}

/**
 * The last two rungs, walked only where the row above them opened. A level nobody can reach makes
 * no claim about what a reader sees, and counting it would put verdicts in the register for rows
 * the panel never draws.
 */
function addDeepRungsToTally(
    tally: DrillTally,
    replay: FightReplay,
    screen: PanelMetric,
    combatantId: number,
): void {
    const { roster, statistics } = replay;
    const drill = composeDrillReading(statistics, roster, screen, combatantId);
    if (drill === null) return;
    for (const other of drill.byOpponent.rows) {
        addToTally(tally, screen, { rung: "opened", row: "person" }, other.opensPair);
        if (!other.opensPair) continue;
        const pair = composePairReading(statistics, roster, screen, combatantId, other.combatantId);
        if (pair === null) continue;
        for (const part of pair.parts) {
            const row = part.part.kind === "plain" ? "closing" : getRowForPart(part.part);
            addToTally(tally, screen, { rung: "pair", row }, false);
        }
        for (const kind of pair.byElement.rows) {
            assert(kind.figure >= 0, "a kind drawn in a pair holds no less than nothing");
            addToTally(tally, screen, { rung: "pair", row: "kind" }, false);
        }
        if (pair.byElement.unnamed !== null) {
            addToTally(tally, screen, { rung: "pair", row: "no kind" }, false);
        }
    }
    addSectionsToTally(tally, replay, screen, combatantId);
}

/** The two cross-sections of an opened row, and the level a skill of it opens onto. */
function addSectionsToTally(
    tally: DrillTally,
    replay: FightReplay,
    screen: PanelMetric,
    combatantId: number,
): void {
    const { roster, statistics } = replay;
    const drill = composeDrillReading(statistics, roster, screen, combatantId);
    if (drill === null) return;
    if (drill.byOpponent.unnamed !== null) {
        addToTally(tally, screen, { rung: "opened", row: "half-named" }, false);
    }
    for (const skill of drill.bySkill.rows) {
        const row = getRowForPart(skill.part);
        addToTally(tally, screen, { rung: "opened", row }, skill.opensPart);
        if (skill.opensPart) addPartRungToTally(tally, replay, screen, combatantId, skill.part);
    }
    if (drill.bySkill.plain !== null) {
        addToTally(tally, screen, { rung: "opened", row: "closing" }, false);
    }
    for (const kind of drill.byElement.rows) {
        assert(kind.figure >= 0, "a kind drawn in a section holds no less than nothing");
        const part = { kind: "element" as const, element: kind.element };
        addToTally(tally, screen, { rung: "opened", row: "kind" }, kind.opensPart);
        if (kind.opensPart) addPartRungToTally(tally, replay, screen, combatantId, part);
    }
    if (drill.byElement.unnamed !== null) {
        addToTally(tally, screen, { rung: "opened", row: "no kind" }, false);
    }
}

/** The level a part of an opened figure opens onto: people, and the end the protocol left out. */
function addPartRungToTally(
    tally: DrillTally,
    replay: FightReplay,
    screen: PanelMetric,
    combatantId: number,
    part: NamedPart,
): void {
    const { roster, statistics } = replay;
    const held = composePartReading(statistics, roster, screen, combatantId, part);
    if (held === null) return;
    for (const one of held.byOpponent.rows) {
        assert(one.figure >= 0, "a person a part reached holds no less than nothing");
        addToTally(tally, screen, { rung: "part", row: "person" }, false);
    }
    if (held.byOpponent.unnamed !== null) {
        addToTally(tally, screen, { rung: "part", row: "half-named" }, false);
    }
}

/** What a pinned row opens onto: the end the game did name, and what named neither. */
function addUnnamedRungToTally(tally: DrillTally, replay: FightReplay, kase: PinnedCase): void {
    const { roster, statistics } = replay;
    const screen = getMetricForPinned(kase);
    const held = composeHalfNamedReading(
        statistics,
        roster,
        kase,
        "everyone",
        replay.reading.readerSide,
    );
    assert(held !== null, "a pinned row that is drawn has a level under it");
    for (const one of held.rows) {
        assert(one.figure > 0, "a person under a pinned row carries some of its figure");
        // Always: their share of the figure is keyed throughout, which `src/core/` asserts.
        addToTally(tally, screen, { rung: "unnamed", row: "person" }, true);
    }
    if (held.neither !== null) {
        addToTally(tally, screen, { rung: "unnamed", row: "neither end" }, false);
    }
    for (const one of held.kinds.rows) {
        assert(one.figure > 0, "and a kind under it carries some of it too");
        addToTally(tally, screen, { rung: "unnamed", row: "kind" }, one.opensPart);
    }
    if (held.kinds.unnamed !== null) {
        addToTally(tally, screen, { rung: "unnamed", row: "no kind" }, false);
    }
    addUnnamedCutToTally(tally, replay, kase, held);
}

/** And the level under each row of that one, which is the same fold read both ways round. */
function addUnnamedCutToTally(
    tally: DrillTally,
    replay: FightReplay,
    kase: PinnedCase,
    held: HalfNamedReading,
): void {
    const screen = getMetricForPinned(kase);
    for (const person of held.rows) {
        const opened = { kind: "person" as const, combatantId: person.combatantId };
        const under = composeUnnamedCut(replay, kase, opened);
        if (under === null) continue;
        assert(under.opened === "person", "a person opens onto what their share was dealt with");
        for (const one of under.kinds.rows) {
            addToTally(tally, screen, { rung: "unnamed cut", row: "kind" }, one.opensPart);
        }
    }
    for (const kind of held.kinds.rows) {
        if (!kind.opensPart) continue;
        const under = composeUnnamedCut(replay, kase, { kind: "element", element: kind.element });
        if (under === null) continue;
        assert(under.opened === "element", "and a key onto whoever carries it");
        for (const one of under.rows) {
            assert(one.figure > 0, "each carrying some of that key");
            addToTally(tally, screen, { rung: "unnamed cut", row: "person" }, false);
        }
        if (under.neither !== null) {
            addToTally(tally, screen, { rung: "unnamed cut", row: "neither end" }, false);
        }
    }
}

function composeUnnamedCut(
    replay: FightReplay,
    kase: PinnedCase,
    opened: HalfNamedOpened,
): HalfNamedDrillReading | null {
    assert(replay.name.length > 0, "a level is read off a recording with a name");
    return composeHalfNamedDrillReading(
        replay.statistics,
        replay.roster,
        kase,
        "everyone",
        replay.reading.readerSide,
        opened,
    );
}

function addScreenToTally(tally: DrillTally, replay: FightReplay, screen: PanelMetric): void {
    const reading = composePanelReading(
        replay.statistics,
        replay.roster,
        screen,
        "everyone",
        replay.reading.readerSide,
        NOTHING_MISSED,
    );
    // The one verdict no reading can answer: a ranking row's mark is written by the element layer
    // without asking anybody, so it is stated here and held against the drawn panel by
    // `tests/tools/drill-report.test.ts`. A register written off this file alone would agree with
    // a ranking that had stopped marking its rows.
    for (const row of reading.rows) {
        assert(Number.isSafeInteger(row.combatantId), "a ranking row names somebody by number");
        addToTally(tally, screen, { rung: "ranking", row: "person" }, true);
    }
    for (const pinned of reading.pinned) {
        assert(pinned.figure > 0, "a figure is pinned because there is one to pin");
        addToTally(tally, screen, { rung: "ranking", row: "half-named" }, true);
        addUnnamedRungToTally(tally, replay, pinned.case);
    }
    for (const row of reading.rows) addDeepRungsToTally(tally, replay, screen, row.combatantId);
}

/** Descending by screen in the order the strips draw them, then by rung, then by row. */
function compareCases(one: DrillCase, other: DrillCase): number {
    const screens = SCREEN_ORDER.indexOf(one.screen) - SCREEN_ORDER.indexOf(other.screen);
    if (screens !== 0) return screens;
    const rungs = DRILL_RUNGS.indexOf(one.rung) - DRILL_RUNGS.indexOf(other.rung);
    if (rungs !== 0) return rungs;
    return DRILL_ROWS.indexOf(one.row) - DRILL_ROWS.indexOf(other.row);
}

function getVerdict(tally: CaseTally): DrillVerdict {
    assert(tally.opens + tally.shut > 0, "a case with no row behind it is not a case");
    if (tally.shut === 0) return "always";
    if (tally.opens === 0) return "never";
    return "sometimes";
}

/**
 * Every case the material produces. A kind of row no recording carries is absent rather than
 * `never`: a verdict nobody has seen is a guess, and `docs/drill-levels.md` says so in prose.
 */
export function composeDrillCases(replays: readonly FightReplay[]): DrillCase[] {
    assert(replays.length > 0, "a register is measured over something");
    const tally: DrillTally = new Map();
    for (const replay of replays) {
        for (const screen of SCREEN_ORDER) addScreenToTally(tally, replay, screen);
    }
    const cases = [...tally.values()].map((one) => ({
        screen: one.screen,
        rung: one.rung,
        row: one.row,
        verdict: getVerdict(one),
        opens: one.opens,
        shut: one.shut,
    }));
    cases.sort(compareCases);
    assert(cases.length > 0, "and produces at least one case");
    return cases;
}

/** A run names a screen and a handful of recordings; this is far past that. */
const MAXIMUM_ARGUMENTS = 256;
const SCREEN_WIDTH = 20;
const RUNG_WIDTH = 13;
const ROW_WIDTH = 12;
const VERDICT_WIDTH = 10;
const COUNT_WIDTH = 8;

export function composeCaseReport(cases: readonly DrillCase[]): string[] {
    assert(cases.length > 0, "a report states the cases it was handed");
    const lines = [
        `  ${"screen".padEnd(SCREEN_WIDTH)}${"rung".padEnd(RUNG_WIDTH)}${"row".padEnd(ROW_WIDTH)}${
            "verdict".padEnd(VERDICT_WIDTH)
        }${"opens".padStart(COUNT_WIDTH)}${"shut".padStart(COUNT_WIDTH)}`,
    ];
    for (const one of cases) {
        lines.push(
            `  ${one.screen.padEnd(SCREEN_WIDTH)}${one.rung.padEnd(RUNG_WIDTH)}${
                one.row.padEnd(ROW_WIDTH)
            }${one.verdict.padEnd(VERDICT_WIDTH)}${
                composeIntegerText(one.opens).padStart(COUNT_WIDTH)
            }${composeIntegerText(one.shut).padStart(COUNT_WIDTH)}`,
        );
    }
    return lines;
}

/** One opened row, as a reader would walk it: the cut, and what each row of it opens onto. */
function composeOpenedLines(
    replay: FightReplay,
    screen: PanelMetric,
    combatantId: number,
): string[] {
    const { roster, statistics } = replay;
    const drill = composeDrillReading(statistics, roster, screen, combatantId);
    if (drill === null) return [];
    const lines = [`    ${drill.name ?? "(nobody named)"} — ${composeIntegerText(drill.total)}`];
    for (const other of drill.byOpponent.rows) {
        const named = other.name ?? "(nobody named)";
        const opens = other.opensPair ? "opens" : "leaf ";
        lines.push(`      person  ${opens}  ${named} ${composeIntegerText(other.figure)}`);
    }
    if (drill.byOpponent.unnamed !== null) lines.push("      half-named  leaf");
    for (const skill of drill.bySkill.rows) {
        const opens = skill.opensPart ? "opens" : "leaf ";
        const named = getTextForNamedPart(skill.part);
        lines.push(
            `      ${getRowForPart(skill.part).padEnd(7)}${opens}  ${named} ${
                composeIntegerText(skill.figure)
            }`,
        );
    }
    if (drill.bySkill.plain !== null) lines.push("      closing  leaf");
    for (const kind of drill.byElement.rows) {
        const opens = kind.opensPart ? "opens" : "leaf ";
        lines.push(
            `      kind    ${opens}  ${kind.element} ${composeIntegerText(kind.figure)}`,
        );
    }
    if (drill.byElement.unnamed !== null) lines.push("      no kind  leaf");
    return lines;
}

export function composeDrillReport(
    replay: FightReplay,
    screens: readonly PanelMetric[],
): string[] {
    assert(replay.name.length > 0, "a report is headed by the recording it was taken on");
    assert(screens.length > 0, "and walks at least one screen");
    const lines = ["", `=== ${replay.name} ===`];
    for (const screen of screens) {
        lines.push(`  --- ${screen} ---`);
        const reading = composePanelReading(
            replay.statistics,
            replay.roster,
            screen,
            "everyone",
            replay.reading.readerSide,
            NOTHING_MISSED,
        );
        for (const row of reading.rows) {
            lines.push(...composeOpenedLines(replay, screen, row.combatantId));
        }
        for (const pinned of reading.pinned) {
            lines.push(...composeUnnamedLines(replay, pinned.case));
        }
    }
    return lines;
}

/** One pinned row opened: the end the game did name, and what named neither. */
function composeUnnamedLines(replay: FightReplay, kase: PinnedCase): string[] {
    const held = composeHalfNamedReading(
        replay.statistics,
        replay.roster,
        kase,
        "everyone",
        replay.reading.readerSide,
    );
    if (held === null) return [];
    const lines = [`    ${kase} — ${composeIntegerText(held.total)}`];
    for (const one of held.rows) {
        const named = one.name ?? "(nobody named)";
        lines.push(`      person  opens  ${named} ${composeIntegerText(one.figure)}`);
        const opened = { kind: "person" as const, combatantId: one.combatantId };
        const under = composeUnnamedCut(replay, kase, opened);
        if (under === null || under.opened !== "person") continue;
        for (const kind of under.kinds.rows) {
            lines.push(`        kind    leaf   ${kind.element} ${composeIntegerText(kind.figure)}`);
        }
    }
    if (held.neither !== null) lines.push("      neither end  leaf");
    for (const one of held.kinds.rows) {
        const verdict = one.opensPart ? "opens" : "leaf ";
        lines.push(`      kind    ${verdict}  ${one.element} ${composeIntegerText(one.figure)}`);
        if (!one.opensPart) continue;
        const under = composeUnnamedCut(replay, kase, { kind: "element", element: one.element });
        if (under === null || under.opened !== "element") continue;
        for (const row of under.rows) {
            const named = row.name ?? "(nobody named)";
            lines.push(`        person  leaf   ${named} ${composeIntegerText(row.figure)}`);
        }
        if (under.neither !== null) lines.push("        neither end  leaf");
    }
    if (held.kinds.unnamed !== null) lines.push("      no kind  leaf");
    return lines;
}

/** The screen named on the command line, or every one of them. A name nobody draws is loud. */
function getScreensFromArguments(stated: string | null): readonly PanelMetric[] {
    if (stated === null) return SCREEN_ORDER;
    const screen = getScreenFromName(stated);
    if (screen === null) throw new DrillReportError(`${stated} is not a screen the panel draws`);
    return [screen];
}

interface DrillArguments {
    isCases: boolean;
    screen: string | null;
    paths: string[];
}

function getArguments(stated: readonly string[]): DrillArguments {
    const held: DrillArguments = { isCases: false, screen: null, paths: [] };
    let wantsScreen = false;
    assert(stated.length <= MAXIMUM_ARGUMENTS, "a run is given no more arguments than are read");
    for (const one of stated) {
        if (wantsScreen) {
            held.screen = one;
            wantsScreen = false;
            continue;
        }
        if (one === "--cases") held.isCases = true;
        else if (one === "--screen") wantsScreen = true;
        else held.paths.push(one);
    }
    if (wantsScreen) throw new DrillReportError("--screen was given no screen to walk");
    return held;
}

if (import.meta.main) {
    const asked = getArguments(Deno.args);
    const replayed = composeReplayedMaterial(asked.paths);
    console.log(`material ${replayed.material}`);
    if (asked.isCases) {
        for (const line of composeCaseReport(composeDrillCases(replayed.replays))) {
            console.log(line);
        }
    } else {
        const screens = getScreensFromArguments(asked.screen);
        for (const replay of replayed.replays) {
            for (const line of composeDrillReport(replay, screens)) console.log(line);
        }
    }
}
