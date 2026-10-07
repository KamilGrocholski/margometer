/**
 * Which rows of the panel open onto another level, measured over the recordings. Every level is
 * the panel's own reading (`src/ui/panel-content.ts`) of the fight the runtime's chain replays.
 * Where a reading carries whether a row opens, that is the verdict; where it does not, the tool
 * states one, and the ranking's and the pinned rows' are held against the drawn panel by
 * `tests/tools/drill-report.test.ts`. `docs/drill-levels.md` carries the verdicts; the counts stay
 * here (**V5**).
 *
 *     deno task panel:drill --cases                 the verdicts, with the counts behind them
 *     deno task panel:drill [recording.json …]      one recording, level by level
 *     deno task panel:drill --screen healthGiven    one screen of it
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { formatInteger } from "#/libs/number-text.ts";
import { isOneOf, type VocabularyWord } from "#/libs/vocabulary.ts";
import type { CombatantRoster } from "#/src/core/combatant-roster.ts";
import type { FightStatistics } from "#/src/core/fight-statistics.ts";
import {
    getMetricForPinned,
    getTextForNamedPart,
    HALF_NAMED_OPENED,
    type HalfNamedOpened,
    NOTHING_SUSPECT,
    type OpenedLevelContent,
    type OpenedPart,
    type PinnedCase,
    presentOpenedLevel,
    presentPairLevel,
    presentPartLevel,
    presentScreen,
    presentUnnamedCutLevel,
    presentUnnamedLevel,
    presentUnnamedPairLevel,
    type ScreenContent,
    type UnnamedCutLevelContent,
    type UnnamedLevelContent,
} from "#/src/ui/panel-content.ts";
import { OPENED_PART, type PanelMetric, SCREEN_ORDER, SIDE_CHOICE } from "#/src/ui/panel-screen.ts";
import {
    formatRecordingName,
    lookupRecordingPaths,
    readRecordedMaterial,
    type ReplayedFight,
    replayRecordedMaterial,
} from "./recorded-material.ts";
import { DrillReportError } from "./margometer-tool-error.ts";

/**
 * The levels, named by what a reader did to get there. `pair`, `part` and `unnamed pair` are three
 * shapes of the third level rather than one under the other, and `unnamed` is opened from a pinned
 * row under the ranking rather than from a row on it (`develop ADR 0038`).
 */
export const DRILL_RUNG = {
    ranking: "ranking",
    opened: "opened",
    pair: "pair",
    part: "part",
    unnamedPair: "unnamed pair",
    unnamed: "unnamed",
    unnamedCut: "unnamed cut",
} as const;
export type DrillRung = VocabularyWord<typeof DRILL_RUNG>;

/** Every kind of row the panel draws below a heading; `docs/drill-levels.md` says what each is. */
const DRILL_ROW = {
    person: "person",
    halfNamed: "half-named",
    skill: "skill",
    source: "source",
    closing: "closing",
    kind: "kind",
    noKind: "no kind",
    neitherEnd: "neither end",
} as const;
export type DrillRow = VocabularyWord<typeof DRILL_ROW>;

export const DRILL_VERDICT = { always: "always", sometimes: "sometimes", never: "never" } as const;
export type DrillVerdict = VocabularyWord<typeof DRILL_VERDICT>;

export interface DrillCase {
    screen: PanelMetric;
    rung: DrillRung;
    row: DrillRow;
    verdict: DrillVerdict;
    /** How many rows of this kind the material drew, on each side of the answer. */
    opens: number;
    shut: number;
}

interface CaseTally {
    screen: PanelMetric;
    rung: DrillRung;
    row: DrillRow;
    opens: number;
    shut: number;
}

interface CasePlace {
    rung: DrillRung;
    row: DrillRow;
}

/** Keyed by the three names of a case, so the same row kind seen twice is one case. */
type DrillTally = Map<string, CaseTally>;

/** One fight as every reading of the panel is handed it. */
interface PanelFight {
    name: string;
    statistics: FightStatistics;
    roster: CombatantRoster;
    readerSide: number | null;
}

interface DrillArguments {
    isCases: boolean;
    screen: string | null;
    paths: string[];
}

export const DRILL_RUNGS = Object.values(DRILL_RUNG);
export const DRILL_ROWS = Object.values(DRILL_ROW);
export const DRILL_VERDICTS = Object.values(DRILL_VERDICT);
/** A run names a screen and a handful of recordings; this is far past that. */
export const ARGUMENTS_MAXIMUM = 256;
/** The row each part of a figure opens onto; the part no announcement stood behind closes it. */
const ROW_BY_PART: Record<OpenedPart["kind"], DrillRow> = {
    [OPENED_PART.skill]: DRILL_ROW.skill,
    [OPENED_PART.source]: DRILL_ROW.source,
    [OPENED_PART.element]: DRILL_ROW.kind,
    [OPENED_PART.plain]: DRILL_ROW.closing,
};
/** No name in the three vocabularies holds a bar, so no two cases come to one key. */
const CASE_KEY_SEPARATOR = " | ";
const SCREEN_WIDTH = 20;
const RUNG_WIDTH = 13;
const ROW_WIDTH = 12;
const VERDICT_WIDTH = 10;
const COUNT_WIDTH = 8;
const PART_WIDTH = 7;
const NOBODY_NAMED = "(nobody named)";
const OPENS_WORD = "opens";
const LEAF_WORD = "leaf ";

/**
 * Every case the material produces. A kind of row no recording carries is absent rather than
 * `never`: a verdict nobody has seen is a guess, and `docs/drill-levels.md` says so in prose.
 */
export function tallyDrillCases(
    replayed: readonly ReplayedFight[],
): DrillCase[] {
    assert(replayed.length > 0, "a register is measured over something");
    const tally: DrillTally = new Map();
    for (const walked of replayed) {
        const fight = getPanelFight(walked);
        for (const screen of SCREEN_ORDER) {
            // Add every case one screen of the fight draws.
            const reading = presentScreenForEveryone(fight, screen);
            // A verdict no reading answers: a ranking row's mark is written by the
            // element layer without asking anybody, so it is stated here and held against the
            // drawn panel by `tests/tools/drill-report.test.ts`.
            for (const row of reading.rows) {
                assert(
                    Number.isSafeInteger(row.combatantId),
                    "a ranking row names somebody by number",
                );
                addCaseToTally(tally, screen, {
                    rung: DRILL_RUNG.ranking,
                    row: DRILL_ROW.person,
                }, true);
            }
            for (const pinned of reading.pinned) {
                assert(
                    pinned.figure > 0,
                    "a figure is pinned because there is one to pin",
                );
                addCaseToTally(tally, screen, {
                    rung: DRILL_RUNG.ranking,
                    row: DRILL_ROW.halfNamed,
                }, true);
                addPinnedLevelToTally(tally, fight, pinned.case);
            }
            for (const row of reading.rows) {
                addOpenedLevelToTally(tally, fight, screen, row.combatantId);
            }
        }
    }
    const cases = [...tally.values()].map((counted): DrillCase => ({
        screen: counted.screen,
        rung: counted.rung,
        row: counted.row,
        verdict: getVerdictForTally(counted),
        opens: counted.opens,
        shut: counted.shut,
    }));
    cases.sort(compareCases);
    assertStrictEquals(
        cases.length,
        tally.size,
        "every case counted is stated once",
    );
    return cases;
}

/** Add what a pinned row opens onto: the named end, and what named neither. */
function addPinnedLevelToTally(tally: DrillTally, fight: PanelFight, pinnedCase: PinnedCase): void {
    const pinnedScreen = getMetricForPinned(pinnedCase);
    const held = presentHalfNamedForEveryone(fight, pinnedCase);
    assertExists(
        held,
        "a pinned row that is drawn has a level under it",
    );
    for (const person of held.rows) {
        assert(
            person.figure > 0,
            "a person under a pinned row carries some of its figure",
        );
        // Always: their share of the figure is keyed throughout, which `src/core/` asserts.
        addCaseToTally(tally, pinnedScreen, {
            rung: DRILL_RUNG.unnamed,
            row: DRILL_ROW.person,
        }, true);
    }
    if (held.neitherEnd !== null) {
        const place = {
            rung: DRILL_RUNG.unnamed,
            row: DRILL_ROW.neitherEnd,
        };
        addCaseToTally(tally, pinnedScreen, place, false);
    }
    for (const kind of held.kinds.rows) {
        assert(
            kind.figure > 0,
            "and a kind under it carries some of it too",
        );
        const place = { rung: DRILL_RUNG.unnamed, row: DRILL_ROW.kind };
        addCaseToTally(tally, pinnedScreen, place, kind.doesOpenPart);
    }
    if (held.kinds.noKind !== null) {
        const place = { rung: DRILL_RUNG.unnamed, row: DRILL_ROW.noKind };
        addCaseToTally(tally, pinnedScreen, place, false);
    }
    // Add the level under each row of that one, the fold read both ways.
    {
        const cut = DRILL_RUNG.unnamedCut;
        for (const person of held.rows) {
            const opened = {
                kind: HALF_NAMED_OPENED.person,
                combatantId: person.combatantId,
            };
            const under = presentUnnamedCut(fight, pinnedCase, opened);
            if (under === null) continue;
            assertStrictEquals(
                under.opened,
                HALF_NAMED_OPENED.person,
                "a person opens onto their own keys",
            );
            for (const kind of under.kinds.rows) {
                addCaseToTally(tally, pinnedScreen, {
                    rung: cut,
                    row: DRILL_ROW.kind,
                }, kind.doesOpenPart);
            }
        }
        for (const kind of held.kinds.rows) {
            if (!kind.doesOpenPart) continue;
            const opened = {
                kind: HALF_NAMED_OPENED.element,
                element: kind.element,
            };
            const under = presentUnnamedCut(fight, pinnedCase, opened);
            if (under === null) continue;
            assertStrictEquals(
                under.opened,
                HALF_NAMED_OPENED.element,
                "and a key onto whoever carries it",
            );
            for (const person of under.rows) {
                assert(person.figure > 0, "each carrying some of that key");
                addCaseToTally(tally, pinnedScreen, {
                    rung: cut,
                    row: DRILL_ROW.person,
                }, false);
            }
            if (under.neitherEnd !== null) {
                addCaseToTally(tally, pinnedScreen, {
                    rung: cut,
                    row: DRILL_ROW.neitherEnd,
                }, false);
            }
        }
    }
}

/**
 * Add the third level, walked only where the row above it opened. A level nobody can reach makes
 * no claim about what a reader sees, and counting it would put verdicts in the register for rows
 * the panel never draws.
 */
function addOpenedLevelToTally(
    tally: DrillTally,
    fight: PanelFight,
    screen: PanelMetric,
    combatantId: number,
): void {
    const { roster, statistics } = fight;
    const drill = presentOpenedLevel(statistics, roster, screen, combatantId);
    if (drill === null) return;
    for (const otherEnd of drill.byOtherEnd.rows) {
        const place = { rung: DRILL_RUNG.opened, row: DRILL_ROW.person };
        addCaseToTally(tally, screen, place, otherEnd.doesOpenPair);
        if (!otherEnd.doesOpenPair) continue;
        const pair = presentPairLevel(
            statistics,
            roster,
            screen,
            combatantId,
            otherEnd.combatantId,
        );
        if (pair === null) continue;
        for (const pairPart of pair.parts) {
            const partRow = ROW_BY_PART[pairPart.part.kind];
            addCaseToTally(tally, screen, {
                rung: DRILL_RUNG.pair,
                row: partRow,
            }, false);
        }
        for (const kind of pair.byElement.rows) {
            assert(
                kind.figure >= 0,
                "a kind drawn in a pair holds no less than nothing",
            );
            addCaseToTally(tally, screen, {
                rung: DRILL_RUNG.pair,
                row: DRILL_ROW.kind,
            }, kind.doesOpenPart);
        }
        if (pair.byElement.noKind !== null) {
            addCaseToTally(tally, screen, {
                rung: DRILL_RUNG.pair,
                row: DRILL_ROW.noKind,
            }, false);
        }
    }
    // Add the two cross-sections of the opened row, and a part's level under.
    {
        const opened = DRILL_RUNG.opened;
        const unnamed = drill.byOtherEnd.halfNamed;
        if (unnamed !== null) {
            const place = { rung: opened, row: DRILL_ROW.halfNamed };
            addCaseToTally(tally, screen, place, unnamed.doesOpenPair);
            if (unnamed.doesOpenPair) {
                // Add the end the opened figure left out: their own keys.
                const held = presentUnnamedPairLevel(
                    statistics,
                    roster,
                    screen,
                    combatantId,
                );
                assertExists(held, "a row that opens has a level under it");
                assertStrictEquals(
                    held.opened,
                    HALF_NAMED_OPENED.person,
                    "and the level is one person's own keys",
                );
                const kindPlace = {
                    rung: DRILL_RUNG.unnamedPair,
                    row: DRILL_ROW.kind,
                };
                for (const kind of held.kinds.rows) {
                    addCaseToTally(
                        tally,
                        screen,
                        kindPlace,
                        kind.doesOpenPart,
                    );
                }
                if (held.kinds.noKind !== null) {
                    addCaseToTally(
                        tally,
                        screen,
                        {
                            rung: DRILL_RUNG.unnamedPair,
                            row: DRILL_ROW.noKind,
                        },
                        false,
                    );
                }
            }
        }
        for (const skill of drill.bySkill.rows) {
            const skillRow = ROW_BY_PART[skill.part.kind];
            addCaseToTally(
                tally,
                screen,
                { rung: opened, row: skillRow },
                skill.doesOpenPart,
            );
            if (skill.doesOpenPart) {
                addPartRungToTally(
                    tally,
                    fight,
                    screen,
                    combatantId,
                    skill.part,
                );
            }
        }
        const closing = drill.bySkill.closing;
        if (closing !== null) {
            const place = { rung: opened, row: DRILL_ROW.closing };
            addCaseToTally(tally, screen, place, closing.doesOpenPart);
            if (closing.doesOpenPart) {
                addPartRungToTally(tally, fight, screen, combatantId, {
                    kind: OPENED_PART.plain,
                });
            }
        }
        for (const kind of drill.byElement.rows) {
            assert(
                kind.figure >= 0,
                "a kind drawn in a section holds no less than nothing",
            );
            const openedPart = {
                kind: OPENED_PART.element,
                element: kind.element,
            };
            addCaseToTally(tally, screen, {
                rung: opened,
                row: DRILL_ROW.kind,
            }, kind.doesOpenPart);
            if (kind.doesOpenPart) {
                addPartRungToTally(tally, fight, screen, combatantId, openedPart);
            }
        }
        if (drill.byElement.noKind !== null) {
            addCaseToTally(tally, screen, {
                rung: opened,
                row: DRILL_ROW.noKind,
            }, false);
        }
    }
}

function getPanelFight(replayed: ReplayedFight): PanelFight {
    const { view, figures } = replayed.reading;
    assert(
        view.payloadsApplied > 0,
        "a fight walked was replayed from something",
    );
    return {
        name: formatRecordingName(replayed.fight.path),
        statistics: figures.statistics,
        roster: view.roster,
        readerSide: view.readerSide,
    };
}

/** The ranking as it stands under `Wszyscy`, with nothing suspect: the rows a reader can press. */
function presentScreenForEveryone(
    fight: PanelFight,
    screen: PanelMetric,
): ScreenContent {
    assert(fight.name.length > 0, "a screen is read off a recording with a name");
    return presentScreen(
        fight.statistics,
        fight.roster,
        screen,
        SIDE_CHOICE.everyone,
        fight.readerSide,
        NOTHING_SUSPECT,
    );
}

function addCaseToTally(
    tally: DrillTally,
    screen: PanelMetric,
    place: CasePlace,
    doesOpen: boolean,
): void {
    const key = [screen, place.rung, place.row].join(CASE_KEY_SEPARATOR);
    const held = tally.get(key) ??
        { screen, rung: place.rung, row: place.row, opens: 0, shut: 0 };
    if (doesOpen) held.opens += 1;
    else held.shut += 1;
    tally.set(key, held);
    assert(
        held.opens + held.shut > 0,
        "a case counted was counted at least once",
    );
}

function presentHalfNamedForEveryone(
    fight: PanelFight,
    pinnedCase: PinnedCase,
): UnnamedLevelContent | null {
    assert(
        fight.name.length > 0,
        "a pinned level is read off a recording with a name",
    );
    return presentUnnamedLevel(
        fight.statistics,
        fight.roster,
        pinnedCase,
        SIDE_CHOICE.everyone,
        fight.readerSide,
    );
}

function presentUnnamedCut(
    fight: PanelFight,
    pinnedCase: PinnedCase,
    opened: HalfNamedOpened,
): UnnamedCutLevelContent | null {
    assert(fight.name.length > 0, "a level is read off a recording with a name");
    return presentUnnamedCutLevel(
        fight.statistics,
        fight.roster,
        pinnedCase,
        SIDE_CHOICE.everyone,
        fight.readerSide,
        opened,
    );
}

/** The level a part of an opened figure opens onto: people, and the end the protocol left out. */
function addPartRungToTally(
    tally: DrillTally,
    fight: PanelFight,
    screen: PanelMetric,
    combatantId: number,
    openedPart: OpenedPart,
): void {
    const held = presentPartLevel(
        fight.statistics,
        fight.roster,
        screen,
        combatantId,
        openedPart,
    );
    if (held === null) return;
    for (const person of held.byOtherEnd.rows) {
        assert(
            person.figure >= 0,
            "a person a part reached holds no less than nothing",
        );
        addCaseToTally(tally, screen, {
            rung: DRILL_RUNG.part,
            row: DRILL_ROW.person,
        }, false);
    }
    if (held.byOtherEnd.halfNamed !== null) {
        const place = { rung: DRILL_RUNG.part, row: DRILL_ROW.halfNamed };
        addCaseToTally(tally, screen, place, false);
    }
}

/** By screen in the order the strips draw them, then by rung, then by row. */
function compareCases(drillCase: DrillCase, otherDrillCase: DrillCase): number {
    const screens = SCREEN_ORDER.indexOf(drillCase.screen) -
        SCREEN_ORDER.indexOf(otherDrillCase.screen);
    if (screens !== 0) return screens;
    const rungs = DRILL_RUNGS.indexOf(drillCase.rung) - DRILL_RUNGS.indexOf(otherDrillCase.rung);
    if (rungs !== 0) return rungs;
    return DRILL_ROWS.indexOf(drillCase.row) - DRILL_ROWS.indexOf(otherDrillCase.row);
}

function getVerdictForTally(tally: CaseTally): DrillVerdict {
    assert(tally.opens + tally.shut > 0, "a case with no row behind it is not a case");
    if (tally.shut === 0) return DRILL_VERDICT.always;
    if (tally.opens === 0) return DRILL_VERDICT.never;
    return DRILL_VERDICT.sometimes;
}

export function formatCaseReport(cases: readonly DrillCase[]): string[] {
    assert(cases.length > 0, "a report states the cases it was handed");
    const lines = [
        `  ${"screen".padEnd(SCREEN_WIDTH)}${"rung".padEnd(RUNG_WIDTH)}` +
        `${"row".padEnd(ROW_WIDTH)}${"verdict".padEnd(VERDICT_WIDTH)}` +
        `${"opens".padStart(COUNT_WIDTH)}${"shut".padStart(COUNT_WIDTH)}`,
    ];
    for (const drillCase of cases) {
        lines.push(
            `  ${drillCase.screen.padEnd(SCREEN_WIDTH)}${drillCase.rung.padEnd(RUNG_WIDTH)}` +
                `${drillCase.row.padEnd(ROW_WIDTH)}${drillCase.verdict.padEnd(VERDICT_WIDTH)}` +
                `${formatInteger(drillCase.opens).padStart(COUNT_WIDTH)}` +
                `${formatInteger(drillCase.shut).padStart(COUNT_WIDTH)}`,
        );
    }
    assertStrictEquals(lines.length, cases.length + 1, "a line per case, under one heading");
    return lines;
}

/** One recording, level by level, as a reader would walk it. */
export function formatDrillReport(
    replayed: ReplayedFight,
    screens: readonly PanelMetric[],
): string[] {
    assert(screens.length > 0, "a report walks at least one screen");
    const fight = getPanelFight(replayed);
    const lines = ["", `=== ${fight.name} ===`];
    for (const screen of screens) {
        lines.push(`  --- ${screen} ---`);
        const reading = presentScreenForEveryone(fight, screen);
        for (const row of reading.rows) {
            lines.push(...formatOpenedLines(fight, screen, row.combatantId));
        }
        for (const pinned of reading.pinned) {
            lines.push(...formatUnnamedLines(fight, pinned.case));
        }
    }
    return lines;
}

/** One opened row: the cut, and what each row of it opens onto. */
function formatOpenedLines(fight: PanelFight, screen: PanelMetric, combatantId: number): string[] {
    const drill = presentOpenedLevel(fight.statistics, fight.roster, screen, combatantId);
    if (drill === null) return [];
    const lines = [`    ${drill.name ?? NOBODY_NAMED} — ${formatInteger(drill.total)}`];
    for (const otherEnd of drill.byOtherEnd.rows) {
        const opens = otherEnd.doesOpenPair ? OPENS_WORD : LEAF_WORD;
        const named = otherEnd.name ?? NOBODY_NAMED;
        lines.push(`      person  ${opens}  ${named} ${formatInteger(otherEnd.figure)}`);
    }
    lines.push(...formatUnnamedPairLines(fight, screen, drill));
    for (const skill of drill.bySkill.rows) {
        const opens = skill.doesOpenPart ? OPENS_WORD : LEAF_WORD;
        const row = ROW_BY_PART[skill.part.kind].padEnd(PART_WIDTH);
        const named = getTextForNamedPart(skill.part);
        lines.push(`      ${row}${opens}  ${named} ${formatInteger(skill.figure)}`);
    }
    const closing = drill.bySkill.closing;
    if (closing !== null) {
        lines.push(`      closing ${closing.doesOpenPart ? OPENS_WORD : LEAF_WORD}`);
    }
    for (const kind of drill.byElement.rows) {
        const opens = kind.doesOpenPart ? OPENS_WORD : LEAF_WORD;
        lines.push(`      kind    ${opens}  ${kind.element} ${formatInteger(kind.figure)}`);
    }
    if (drill.byElement.noKind !== null) lines.push("      no kind  leaf");
    return lines;
}

/** The end an opened figure left out, and the keys it opens onto where it opens. */
function formatUnnamedPairLines(
    fight: PanelFight,
    screen: PanelMetric,
    drill: OpenedLevelContent,
): string[] {
    const unnamed = drill.byOtherEnd.halfNamed;
    if (unnamed === null) return [];
    if (!unnamed.doesOpenPair) return ["      half-named  leaf"];
    const lines = [`      half-named  opens  ${formatInteger(unnamed.figure)}`];
    const held = presentUnnamedPairLevel(fight.statistics, fight.roster, screen, drill.combatantId);
    assertExists(held, "a row that opens has a level under it");
    assertStrictEquals(
        held.opened,
        HALF_NAMED_OPENED.person,
        "and the level is one person's own keys",
    );
    for (const kind of held.kinds.rows) {
        const opens = kind.doesOpenPart ? OPENS_WORD : LEAF_WORD;
        lines.push(`        kind    ${opens}  ${kind.element} ${formatInteger(kind.figure)}`);
    }
    return lines;
}

/** One pinned row opened: the end the game did name, and what named neither. */
function formatUnnamedLines(fight: PanelFight, pinnedCase: PinnedCase): string[] {
    const held = presentHalfNamedForEveryone(fight, pinnedCase);
    assertExists(held, "a pinned row that is drawn has a level under it");
    const lines = [`    ${pinnedCase} — ${formatInteger(held.total)}`];
    for (const person of held.rows) {
        const named = person.name ?? NOBODY_NAMED;
        lines.push(`      person  opens  ${named} ${formatInteger(person.figure)}`);
        const opened = { kind: HALF_NAMED_OPENED.person, combatantId: person.combatantId };
        const under = presentUnnamedCut(fight, pinnedCase, opened);
        if (under === null) continue;
        assertStrictEquals(
            under.opened,
            HALF_NAMED_OPENED.person,
            "a person opens onto their own keys",
        );
        for (const kind of under.kinds.rows) {
            const opens = kind.doesOpenPart ? OPENS_WORD : LEAF_WORD;
            lines.push(`        kind    ${opens}  ${kind.element} ${formatInteger(kind.figure)}`);
        }
    }
    if (held.neitherEnd !== null) lines.push("      neither end  leaf");
    for (const kind of held.kinds.rows) {
        const opens = kind.doesOpenPart ? OPENS_WORD : LEAF_WORD;
        lines.push(`      kind    ${opens}  ${kind.element} ${formatInteger(kind.figure)}`);
        if (!kind.doesOpenPart) continue;
        const opened = { kind: HALF_NAMED_OPENED.element, element: kind.element };
        const under = presentUnnamedCut(fight, pinnedCase, opened);
        if (under === null) continue;
        assertStrictEquals(
            under.opened,
            HALF_NAMED_OPENED.element,
            "and a key onto whoever carries it",
        );
        for (const row of under.rows) {
            const named = row.name ?? NOBODY_NAMED;
            lines.push(`        person  leaf   ${named} ${formatInteger(row.figure)}`);
        }
        if (under.neitherEnd !== null) lines.push("        neither end  leaf");
    }
    if (held.kinds.noKind !== null) lines.push("      no kind  leaf");
    return lines;
}

export function parseDrillArguments(stated: readonly string[]): DrillArguments {
    if (stated.length > ARGUMENTS_MAXIMUM) {
        throw new DrillReportError(`more than ${ARGUMENTS_MAXIMUM} arguments`);
    }
    const parsed = parseArgs([...stated], {
        boolean: ["cases"],
        string: ["screen"],
        unknown: (argument, flag) => {
            // A flag misspelt would be kept as a key nobody reads, and the run would answer
            // something else than was asked; a path is read from `_`.
            if (flag === undefined) return true;
            throw new DrillReportError(`${argument} is not a flag this reads`);
        },
    });
    if (parsed.screen === "") throw new DrillReportError("--screen was given no screen to walk");
    const paths = lookupRecordingPaths(parsed._);
    if (paths === null) {
        throw new DrillReportError("a recording is named by a path and never by a number");
    }
    return { isCases: parsed.cases, screen: parsed.screen ?? null, paths };
}

/** The screen named on the command line, or every one of them. A name nobody draws is loud. */
function requireScreens(stated: string | null): readonly PanelMetric[] {
    if (stated === null) return SCREEN_ORDER;
    if (!isOneOf(SCREEN_ORDER, stated)) {
        throw new DrillReportError(`${stated} is not a screen the panel draws`);
    }
    return [stated];
}

if (import.meta.main) {
    const asked = parseDrillArguments(Deno.args);
    const material = readRecordedMaterial(asked.paths);
    const replayed = replayRecordedMaterial(material);
    console.log(`material ${material.material}`);
    if (asked.isCases) {
        for (const line of formatCaseReport(tallyDrillCases(replayed))) console.log(line);
    } else {
        const screens = requireScreens(asked.screen);
        for (const replayedFight of replayed) {
            for (const line of formatDrillReport(replayedFight, screens)) console.log(line);
        }
    }
}
