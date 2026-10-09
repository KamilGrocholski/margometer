/**
 * What one skill put on a whole side, whom it stood on, and how many stood at once, against the
 * turns the published table states for it. The walk is `src/core/aura-standing.ts`'s, on the
 * tables the add-on composes at its start; what is this file's own is the counting and the text.
 *
 *     deno task fight:auras [recording.json …]
 *
 * `docs/auras-standing.md` is this report written down, and `tests/tools/aura-standing.test.ts`
 * holds the document to what this produces, both ways.
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { formatInteger } from "#/libs/number-text.ts";
import { BATTLE_EVENT, type BattleEvent } from "#/src/core/battle-event.ts";
import {
    AURA_REACH,
    type AuraReach,
    parseShoutNames,
    replayAuraStandings,
} from "#/src/core/aura-standing.ts";
import { isSideWideKey } from "#/src/core/protocol-key.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";
import {
    readRecordedMaterial,
    replayMaterialSteps,
    type SteppedFight,
} from "./recorded-material.ts";
import { RecordingReadError } from "./margometer-tool-error.ts";

/** One skill, over whatever material was replayed. */
export interface AuraRow {
    skillId: number;
    /** The game's own spelling. */
    skillName: string;
    /** Combatants ever seen carrying it. */
    casters: number;
    recordings: number;
    /** The rows the window would draw under it. */
    standingAtOnce: number;
    turnsStated: number;
    /** Which side it reaches, or null where nothing settles it. */
    reach: AuraReach | null;
}

/**
 * One effect key, and how many casts of it stood together at a moment, against the cap on sources
 * `docs/auras-standing.md` states under "How much it comes to".
 */
export interface SourceRow {
    key: string;
    /** Moments where exactly two different combatants held it together. */
    momentsWithTwo: number;
    /** Moments where three or more did, which is where the cap bites. */
    momentsPastTwo: number;
    /** Moments where one combatant held it twice, which the help counts as one source. */
    momentsFromOne: number;
    sourcesAtOnce: number;
}

/** What the two shouts come to: one state per character held, whoever shouted last. */
export interface ProvocationRow {
    skillId: number;
    skillName: string;
    /** Combatants ever seen holding somebody with it. */
    casters: number;
    /** Recordings it is the holder in at the end of at least one payload. */
    recordings: number;
    heldAtOnce: number;
    turnsStated: number;
    /** The fewest characters the published table says it covers, at any skill level. */
    coverageMinimum: number;
    /** The most characters one cast of it was ever seen to name at once. */
    namedAtOnce: number;
}

interface SkillTally<Row> {
    row: Row;
    casterIds: Set<number>;
    paths: Set<string>;
}

/** Past every skill the published table dates, so each walk carries a stated bound. */
const SKILLS_MAXIMUM = 1024;
const NAME_WIDTH = 22;
const KEY_WIDTH = 30;
const STATED_SKILLS = composeRuntimeTables().tooltip.statedSkills;
/** `—` is nothing settling it, and never both. */
const NOTHING_SETTLES = "—";
export const REACH_WORDS = {
    [AURA_REACH.castersSide]: "caster's",
    [AURA_REACH.otherSide]: "other",
    [AURA_REACH.bothSides]: "both",
} as const satisfies Record<AuraReach, string>;

/** The three reports, one after another, as a terminal prints them. */
function formatAuraReport(stepped: readonly SteppedFight[], material: string): string[] {
    assert(material.length > 0, "a report names the material it was taken over");
    return [
        `what stands, over ${material}\n`,
        ...formatAuraReportStanding(tallyAuraRows(stepped)),
        `\nwhat a shout holds\n`,
        ...formatAuraReportShouts(tallyProvocationRows(stepped)),
        `\nhow many sources of one key stand together\n`,
        ...formatAuraReportSources(tallySourceRows(stepped)),
    ];
}

function formatAuraReportStanding(rows: readonly AuraRow[]): string[] {
    assert(rows.length <= SKILLS_MAXIMUM, "a report stays inside the register's bound");
    const headings = ["on", "fights", "at once", "stated", "reaches"];
    const widths = [4, 6, 7, 6, 8];
    const lines = rows.map((row) => {
        const reach = row.reach === null ? NOTHING_SETTLES : REACH_WORDS[row.reach];
        const figures = [row.casters, row.recordings, row.standingAtOnce, row.turnsStated];
        const cells = [...figures.map(formatInteger), reach];
        return formatAuraReportLine(formatInteger(row.skillId), row.skillName, cells, widths);
    });
    return [formatAuraReportLine("id", "skill", headings, widths), ...lines];
}

/** One line of a skill's table: the id, the name, then each cell right-aligned in its width. */
function formatAuraReportLine(
    skillId: string,
    skillName: string,
    cells: readonly string[],
    widths: readonly number[],
): string {
    assertStrictEquals(cells.length, widths.length, "every cell is written in a width of its own");
    const aligned = cells.map((cell, column) => cell.padStart(widths[column] ?? 0));
    return `${skillId.padStart(4)}  ${[skillName.padEnd(NAME_WIDTH), ...aligned].join(" ")}`;
}

function formatAuraReportShouts(rows: readonly ProvocationRow[]): string[] {
    assert(rows.length <= SKILLS_MAXIMUM, "a report stays inside the register's bound");
    const headings = ["casters", "fights", "at once", "stated", "covers", "names"];
    const widths = [7, 6, 7, 6, 6, 9];
    const lines = rows.map((row) => {
        const figures = [
            row.casters,
            row.recordings,
            row.heldAtOnce,
            row.turnsStated,
            row.coverageMinimum,
            row.namedAtOnce,
        ];
        const cells = figures.map(formatInteger);
        return formatAuraReportLine(formatInteger(row.skillId), row.skillName, cells, widths);
    });
    return [formatAuraReportLine("id", "skill", headings, widths), ...lines];
}

function formatAuraReportSources(rows: readonly SourceRow[]): string[] {
    assert(rows.length <= SKILLS_MAXIMUM, "a report stays inside the register's bound");
    const widths = [6, 8, 9, 7];
    const formatSourceLine = (key: string, cells: readonly string[]): string => {
        assertStrictEquals(
            cells.length,
            widths.length,
            "every cell is written in a width of its own",
        );
        const aligned = cells.map((cell, column) => cell.padStart(widths[column] ?? 0));
        return [key.padEnd(KEY_WIDTH), ...aligned].join(" ");
    };
    const lines = rows.map((row) => {
        const figures = [
            row.momentsWithTwo,
            row.momentsPastTwo,
            row.momentsFromOne,
            row.sourcesAtOnce,
        ];
        return formatSourceLine(row.key, figures.map(formatInteger));
    });
    return [formatSourceLine("key", ["two", "past two", "one twice", "at once"]), ...lines];
}

/**
 * Every step of every recording, because what stands is a reading of a **moment**: `at once` is
 * the most that ever stood together, and by the last payload of a fight some have run out.
 */
export function tallyAuraRows(
    stepped: readonly SteppedFight[],
    skillsMaximum = SKILLS_MAXIMUM,
): AuraRow[] {
    assert(skillsMaximum <= SKILLS_MAXIMUM, "a register is bounded no further than its own bound");
    const tallies = new Map<number, SkillTally<AuraRow>>();
    for (const { fight, steps } of stepped) {
        for (const step of steps) {
            const held = replayAuraStandings(step.reading.view, STATED_SKILLS);
            // Add what stands at this moment to the register.
            {
                const atOnce = new Map<number, number>();
                for (const standing of held.auras) {
                    atOnce.set(standing.skillId, (atOnce.get(standing.skillId) ?? 0) + 1);
                    const tally = tallies.get(standing.skillId) ?? {
                        row: {
                            skillId: standing.skillId,
                            skillName: standing.skillName,
                            casters: 0,
                            recordings: 0,
                            standingAtOnce: 0,
                            turnsStated: standing.turnsStated,
                            reach: standing.reach,
                        },
                        casterIds: new Set<number>(),
                        paths: new Set<string>(),
                    };
                    tally.casterIds.add(standing.casterId);
                    tally.paths.add(fight.path);
                    tally.row.reach = standing.reach;
                    tallies.set(standing.skillId, tally);
                }
                for (const [skillId, count] of atOnce) {
                    const tally = tallies.get(skillId);
                    assertExists(tally, "a skill standing at a moment is registered by then");
                    if (count > tally.row.standingAtOnce) tally.row.standingAtOnce = count;
                }
                if (tallies.size > skillsMaximum) {
                    throw new RecordingReadError(
                        `the recordings hold more skills than the ${skillsMaximum} registered`,
                    );
                }
            }
        }
    }
    const rows: AuraRow[] = [];
    for (const tally of tallies.values()) {
        rows.push({ ...tally.row, casters: tally.casterIds.size, recordings: tally.paths.size });
    }
    assertStrictEquals(rows.length, tallies.size, "a skill is registered once");
    assert(rows.every((row) => row.turnsStated > 0), "and each carries the turns it was dated by");
    return rows.sort((left, right) => left.skillId - right.skillId);
}

/**
 * How many sources of one key stand together, over every moment of every recording. A source is a
 * combatant, not a cast, as `docs/auras-standing.md` reads the help, so the casts of one are one.
 */
export function tallySourceRows(
    stepped: readonly SteppedFight[],
    keysMaximum = SKILLS_MAXIMUM,
): SourceRow[] {
    assert(keysMaximum <= SKILLS_MAXIMUM, "a register is bounded no further than its own bound");
    const tallies = new Map<string, SourceRow>();
    for (const { steps } of stepped) {
        const keysByCast = new Map<string, readonly string[]>();
        for (const step of steps) {
            const view = step.reading.view;
            // Add the team-wide keys each cast declared, a later cast of theirs replacing it.
            {
                for (const event of view.events) {
                    if (event.kind !== BATTLE_EVENT.skillUsed) continue;
                    if (event.actorId === null) continue;
                    const keys = event.declared.map((declared) => declared.effect).filter(
                        isSideWideKey,
                    );
                    if (keys.length === 0) continue;
                    keysByCast.set(`${event.actorId}/${event.skillId}`, [...new Set(keys)]);
                }
                assert(keysByCast.size <= view.events.length, "a cast is registered off an event");
            }
            const held = replayAuraStandings(view, STATED_SKILLS).auras;
            const casterIdsByKey = new Map<string, number[]>();
            for (const aura of held) {
                for (const key of keysByCast.get(`${aura.casterId}/${aura.skillId}`) ?? []) {
                    casterIdsByKey.set(key, [...(casterIdsByKey.get(key) ?? []), aura.casterId]);
                }
            }
            if (casterIdsByKey.size > keysMaximum) {
                throw new RecordingReadError(
                    `a moment holds more keys than the ${keysMaximum} registered`,
                );
            }
            // Add this moment's sources to the register.
            {
                for (const [key, casterIds] of casterIdsByKey) {
                    const row = tallies.get(key) ?? {
                        key,
                        momentsWithTwo: 0,
                        momentsPastTwo: 0,
                        momentsFromOne: 0,
                        sourcesAtOnce: 0,
                    };
                    const sources = new Set(casterIds).size;
                    assert(sources > 0, "a key standing stands from somebody");
                    if (sources === 2) row.momentsWithTwo += 1;
                    else if (sources > 2) row.momentsPastTwo += 1;
                    if (casterIds.length > sources) row.momentsFromOne += 1;
                    if (sources > row.sourcesAtOnce) row.sourcesAtOnce = sources;
                    tallies.set(key, row);
                }
                // The keys come from the recordings, which may stand more than one moment does.
                if (tallies.size > keysMaximum) {
                    throw new RecordingReadError(
                        `the recordings stand more keys than the ${keysMaximum} registered`,
                    );
                }
            }
        }
    }
    const rows = [...tallies.values()].filter((row) => row.sourcesAtOnce > 1);
    assert(rows.length <= tallies.size, "a row reported is a row tallied");
    // Plain comparison rather than `localeCompare`: the keys are the game's own ASCII spellings,
    // and `docs/browser-support.md` registers that construct as spelled nowhere in this tree.
    return rows.sort((left, right) => (left.key < right.key ? -1 : 1));
}

/** The same walk, over what a shout holds rather than over what stands on a side. */
export function tallyProvocationRows(
    stepped: readonly SteppedFight[],
    skillsMaximum = SKILLS_MAXIMUM,
): ProvocationRow[] {
    assert(skillsMaximum <= SKILLS_MAXIMUM, "a register is bounded no further than its own bound");
    const tallies = new Map<number, SkillTally<ProvocationRow>>();
    for (const { fight, steps } of stepped) {
        for (const step of steps) {
            const view = step.reading.view;
            const held = replayAuraStandings(view, STATED_SKILLS).provocations;
            const atOnce = new Map<number, number>();
            for (const provocation of held) {
                atOnce.set(provocation.skillId, (atOnce.get(provocation.skillId) ?? 0) + 1);
                // The walk holds somebody only for a shout the same table states.
                const shoutStated = STATED_SKILLS.shoutsBySkillId.get(provocation.skillId);
                assertExists(shoutStated, "a shout holding somebody is one the table states");
                const tally = tallies.get(provocation.skillId) ?? {
                    row: {
                        skillId: provocation.skillId,
                        skillName: provocation.skillName,
                        casters: 0,
                        recordings: 0,
                        heldAtOnce: 0,
                        turnsStated: provocation.turnsStated,
                        coverageMinimum: shoutStated.coverageMinimum,
                        namedAtOnce: 0,
                    },
                    casterIds: new Set<number>(),
                    paths: new Set<string>(),
                };
                tally.casterIds.add(provocation.casterId);
                tally.paths.add(fight.path);
                tallies.set(provocation.skillId, tally);
            }
            const namedBySkillId = indexNamedBySkillId(view.events, skillsMaximum);
            // Add this moment's holding and naming to the register.
            {
                for (const [skillId, count] of atOnce) {
                    const tally = tallies.get(skillId);
                    assertExists(
                        tally,
                        "a shout holding somebody at a moment is registered by then",
                    );
                    if (count > tally.row.heldAtOnce) tally.row.heldAtOnce = count;
                }
                for (const [skillId, count] of namedBySkillId) {
                    const tally = tallies.get(skillId);
                    if (tally === undefined) continue;
                    if (count > tally.row.namedAtOnce) tally.row.namedAtOnce = count;
                }
                assert(
                    tallies.size <= SKILLS_MAXIMUM,
                    "the register stays inside its stated bound",
                );
            }
        }
    }
    const rows: ProvocationRow[] = [];
    for (const tally of tallies.values()) {
        rows.push({ ...tally.row, casters: tally.casterIds.size, recordings: tally.paths.size });
    }
    assertStrictEquals(rows.length, tallies.size, "a skill is registered once");
    return rows.sort((left, right) => left.skillId - right.skillId);
}

/** The most characters one announcement of a skill named, by the skill it was announced on. */
function indexNamedBySkillId(
    events: readonly BattleEvent[],
    skillsMaximum: number,
): Map<number, number> {
    const namedBySkillId = new Map<number, number>();
    for (const event of events) {
        if (event.kind !== BATTLE_EVENT.skillUsed) continue;
        if (event.skillId === null) continue;
        // Read the names as the panel reads them, so the register counts what the panel holds.
        const named = parseShoutNames(event.declared).length;
        if (named === 0) continue;
        if (named > (namedBySkillId.get(event.skillId) ?? 0)) {
            namedBySkillId.set(event.skillId, named);
        }
    }
    if (namedBySkillId.size > skillsMaximum) {
        throw new RecordingReadError(
            `the recordings shout more skills than the ${skillsMaximum} registered`,
        );
    }
    return namedBySkillId;
}

if (import.meta.main) {
    const material = readRecordedMaterial(Deno.args);
    const count = formatInteger(material.fights.length);
    const named = Deno.args.length === 0
        ? `${count} recordings in ${material.material}`
        : `${count} named recordings`;
    console.log(formatAuraReport(replayMaterialSteps(material), named).join("\n"));
}
