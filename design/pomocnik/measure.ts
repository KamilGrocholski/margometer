/**
 * What `captures/` says about every subject the Pomocnik window could draw, written to
 * `measured.json` so the artboards beside it state readings rather than remembered numbers.
 *
 * Run by hand — `deno run -A design/pomocnik/measure.ts`. It has one consumer, this design
 * round, so it earns no `deno task` entry (**C9**).
 */

import { assert } from "@std/assert";
import { getJsonReading } from "@/libs/json-text.ts";
import {
    getNumberFromUnknown,
    getStatedTextFromUnknown,
    isRecord,
} from "@/libs/unknown-reading.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

const WRITTEN_TO = "design/pomocnik/measured.json";
/** Far past any roster the game fields, so a walk stays bounded (**S2**, **S11**). */
const MAXIMUM_WARRIORS = 64;
/** A mask is read to the last bit a shift reaches below the sign, not to the nine the client reads. */
const MAXIMUM_BIT = 30;
/** The nine the client tips, in bit order — `updateWarriorBuffs` and `buffNames`, build 1781609507010. */
const STATUS_NAMES = [
    "deep_wound",
    "wound",
    "critical_deep_wound",
    "poisoned",
    "fire",
    "swow_down",
    "speed_up",
    "frostbite",
    "shock",
];
/** Which message keys reach more than one combatant. The shapes, then the four that carry neither. */
const TEAM_WIDE_OPENING = "aura-";
const TEAM_WIDE_ENDINGS = ["-all", "-allies", "-enemies"];
const TEAM_WIDE_NAMES = ["shout", "allslow_per", "alllowdmg", "healall_per"];
const WARRIOR_FIELDS = [
    "hp",
    "poolTime",
    "buffs",
    "ac",
    "resfire",
    "resfrost",
    "reslight",
    "act",
    "focus",
    "fast",
    "mana",
    "energy",
    "combo",
    "cooldowns",
    "doublecastcost",
    "super_cast",
    "name",
    "lvl",
    "prof",
    "team",
    "npc",
    "wt",
    "y",
];
const RESISTANCE_FIELDS = ["resfire", "resfrost", "reslight"];

interface Tally {
    statements: number;
    recordings: number;
}

interface Measured {
    readAt: string;
    recordings: number;
    payloads: number;
    warriorRecords: number;
    widestRoster: { combatants: number; recording: string };
    fields: Record<string, Tally>;
    statuses: {
        masksRead: number;
        masksAbsent: number;
        distinctValues: number[];
        byBit: { bit: number; name: string | null; statements: number; combatants: number }[];
        widestStanding: { combatants: number; recording: string };
    };
    armour: {
        statements: number;
        destroyedStated: number;
        destroyedAnnounced: number;
        combatantsWhoseArmourFell: number;
        combatantsSeen: number;
        widestFallen: { combatants: number; recording: string };
    };
    resistances: {
        statements: number;
        combatantsWhoseResistanceFell: number;
        widestFallen: { combatants: number; recording: string };
    };
    superCast: {
        statements: number;
        bySkill: { name: string; totalTurns: number; statements: number }[];
        prepareMessages: number;
    };
    readerOwn: {
        cooldownStatements: number;
        warriorsCarryingCooldowns: number;
        distinctSkillIds: number[];
        longestCooldown: number;
        comboStatements: number;
        comboLargest: number;
    };
    queue: {
        payloadsStatingQueue: number;
        payloadsStatingCurrent: number;
        longestQueue: number;
        poolTimeStatements: number;
        poolTimeLargest: number;
        poolTimeSmallest: number;
        forecast: { step: number; graded: number; wrong: number }[];
    };
    casts: {
        teamWideMessages: number;
        distinctTeamWideSkills: number;
        mostSkillsInOneRecording: { skills: number; recording: string };
        distinctTeamWideKeys: string[];
    };
}

function isTeamWideKey(key: string): boolean {
    if (key.startsWith(TEAM_WIDE_OPENING)) return true;
    for (const ending of TEAM_WIDE_ENDINGS) {
        if (key.endsWith(ending)) return true;
    }
    return TEAM_WIDE_NAMES.includes(key);
}

/** `turns_warriors` is ordinal -> combatant, and its least ordinal is the turn in hand. */
function readQueue(payload: Record<string, unknown>): { ordinal: number; combatantId: number }[] {
    const stated = payload["turns_warriors"];
    if (!isRecord(stated)) return [];
    const found: { ordinal: number; combatantId: number }[] = [];
    for (const [key, value] of Object.entries(stated)) {
        const ordinal = Number(key);
        const combatantId = getNumberFromUnknown(value);
        if (!Number.isFinite(ordinal)) continue;
        if (combatantId === null) continue;
        found.push({ ordinal, combatantId });
    }
    return found.sort((left, right) => left.ordinal - right.ordinal);
}

function readWarriors(payload: Record<string, unknown>): Record<string, unknown>[] {
    const stated = payload["w"];
    if (!isRecord(stated)) return [];
    const found: Record<string, unknown>[] = [];
    for (const one of Object.values(stated)) {
        assert(found.length <= MAXIMUM_WARRIORS, "a payload stays inside the stated bound");
        if (isRecord(one)) found.push(one);
    }
    return found;
}

function getBitsSet(mask: number): number[] {
    const bits: number[] = [];
    for (let bit = 0; bit <= MAXIMUM_BIT; bit += 1) {
        if ((mask >> bit & 1) === 1) bits.push(bit);
    }
    assert(bits.length <= MAXIMUM_BIT + 1, "a mask sets no more bits than it is walked for");
    return bits;
}

function getCurrent(record: Record<string, unknown>, field: string): number | null {
    const stated = record[field];
    if (!isRecord(stated)) return null;
    return getNumberFromUnknown(stated["cur"]);
}

function addTally(into: Map<string, Tally>, key: string, seen: Set<string>): void {
    const held = into.get(key) ?? { statements: 0, recordings: 0 };
    held.statements += 1;
    if (!seen.has(key)) {
        held.recordings += 1;
        seen.add(key);
    }
    into.set(key, held);
}

function readPayloadsFromFile(path: string): Record<string, unknown>[] {
    const reading = getJsonReading(Deno.readTextFileSync(path));
    if (!reading.isOk) throw new Error(`${path} is not JSON: ${String(reading.cause)}`);
    const envelope = reading.value;
    if (!isRecord(envelope)) return [];
    const calls = envelope["calls"];
    if (!Array.isArray(calls)) return [];
    const payloads: Record<string, unknown>[] = [];
    for (const call of calls) {
        if (!isRecord(call)) continue;
        const payload = call["payload"];
        if (isRecord(payload)) payloads.push(payload);
    }
    return payloads;
}

function readMessages(payload: Record<string, unknown>): string[] {
    const stated = payload["m"];
    if (!Array.isArray(stated)) return [];
    const found: string[] = [];
    for (const one of stated) {
        const text = getStatedTextFromUnknown(one);
        if (text !== null) found.push(text);
    }
    return found;
}

/** The grammar only: `actor;target;key=value;key`, and this reader wants the keys. */
function readKeys(message: string): { key: string; value: string | null }[] {
    const found: { key: string; value: string | null }[] = [];
    for (const part of message.split(";")) {
        const at = part.indexOf("=");
        if (at === -1) found.push({ key: part, value: null });
        else found.push({ key: part.slice(0, at), value: part.slice(at + 1) });
    }
    return found;
}

function compose(): Measured {
    const paths = readRecordingPaths();
    const fields = new Map<string, Tally>();
    const distinctMasks = new Set<number>();
    const bitStatements = new Map<number, number>();
    const bitCombatants = new Map<number, Set<string>>();
    const teamWideKeys = new Set<string>();
    const teamWideSkills = new Set<string>();
    const cooldownSkills = new Set<number>();
    const superCasts = new Map<string, { totalTurns: number; statements: number }>();

    let payloads = 0;
    let warriorRecords = 0;
    let masksRead = 0;
    let masksAbsent = 0;
    let armourStatements = 0;
    let armourDestroyedStated = 0;
    let armourDestroyedAnnounced = 0;
    let resistanceStatements = 0;
    let superCastStatements = 0;
    let prepareMessages = 0;
    let cooldownStatements = 0;
    let warriorsCarryingCooldowns = 0;
    let longestCooldown = 0;
    let comboStatements = 0;
    let comboLargest = 0;
    let payloadsStatingQueue = 0;
    let payloadsStatingCurrent = 0;
    let longestQueue = 0;
    let poolTimeStatements = 0;
    let poolTimeLargest = 0;
    let poolTimeSmallest = Number.POSITIVE_INFINITY;
    let teamWideMessages = 0;
    let widestRoster = { combatants: 0, recording: "" };
    let widestStanding = { combatants: 0, recording: "" };
    let widestArmourFallen = { combatants: 0, recording: "" };
    let widestResistanceFallen = { combatants: 0, recording: "" };
    let mostSkillsInOneRecording = { skills: 0, recording: "" };
    let combatantsWhoseArmourFell = 0;
    let combatantsWhoseResistanceFell = 0;
    let combatantsSeen = 0;

    const graded = new Map<number, { graded: number; wrong: number }>();

    for (const path of paths) {
        const seen = new Set<string>();
        const heldByOrdinal = new Map<number, number>();
        const forecastByOrdinal = new Map<number, Map<number, number>>();
        const skillsHere = new Set<string>();
        const armourFirst = new Map<string, number>();
        const armourFallen = new Set<string>();
        const resistanceFirst = new Map<string, Map<string, number>>();
        const resistanceFallen = new Set<string>();
        const rosterHere = new Set<string>();

        for (const payload of readPayloadsFromFile(path)) {
            payloads += 1;
            if (Array.isArray(payload["turns_warriors"]) || isRecord(payload["turns_warriors"])) {
                payloadsStatingQueue += 1;
                const queue = payload["turns_warriors"];
                const length = isRecord(queue) ? Object.keys(queue).length : 0;
                if (length > longestQueue) longestQueue = length;
            }
            if (getNumberFromUnknown(payload["current"]) !== null) payloadsStatingCurrent += 1;

            const queue = readQueue(payload);
            const head = queue[0];
            if (head !== undefined) {
                heldByOrdinal.set(head.ordinal, head.combatantId);
                for (const [step, entry] of queue.entries()) {
                    if (step === 0) continue;
                    const held = forecastByOrdinal.get(entry.ordinal) ?? new Map<number, number>();
                    if (!held.has(step)) held.set(step, entry.combatantId);
                    forecastByOrdinal.set(entry.ordinal, held);
                }
            }

            let standingHere = 0;
            const warriors = readWarriors(payload);
            for (const warrior of warriors) {
                warriorRecords += 1;
                const id = String(getNumberFromUnknown(warrior["id"]) ?? "");
                rosterHere.add(id);
                for (const field of WARRIOR_FIELDS) {
                    if (warrior[field] === undefined) continue;
                    addTally(fields, field, seen);
                }

                const mask = getNumberFromUnknown(warrior["buffs"]);
                if (mask === null) masksAbsent += 1;
                else {
                    masksRead += 1;
                    distinctMasks.add(mask);
                    const bits = getBitsSet(mask);
                    if (bits.length > 0) standingHere += 1;
                    for (const bit of bits) {
                        bitStatements.set(bit, (bitStatements.get(bit) ?? 0) + 1);
                        const who = bitCombatants.get(bit) ?? new Set<string>();
                        who.add(`${path}#${id}`);
                        bitCombatants.set(bit, who);
                    }
                }

                const armour = getCurrent(warrior, "ac");
                if (armour !== null) {
                    armourStatements += 1;
                    const first = armourFirst.get(id);
                    if (first === undefined) armourFirst.set(id, armour);
                    else if (armour < first) armourFallen.add(id);
                    const holder = warrior["ac"];
                    if (isRecord(holder) && holder["destroyed"] !== undefined) {
                        armourDestroyedStated += 1;
                    }
                }

                let resistanceFellHere = false;
                for (const field of RESISTANCE_FIELDS) {
                    const value = getCurrent(warrior, field);
                    if (value === null) continue;
                    resistanceStatements += 1;
                    const held = resistanceFirst.get(id) ?? new Map<string, number>();
                    const first = held.get(field);
                    if (first === undefined) held.set(field, value);
                    else if (value < first) resistanceFellHere = true;
                    resistanceFirst.set(id, held);
                }
                if (resistanceFellHere) resistanceFallen.add(id);

                const superCast = warrior["super_cast"];
                if (isRecord(superCast)) {
                    superCastStatements += 1;
                    const name = getStatedTextFromUnknown(superCast["name"]);
                    const total = getNumberFromUnknown(superCast["total_turns"]);
                    if (name !== null && total !== null) {
                        const held = superCasts.get(name) ?? { totalTurns: total, statements: 0 };
                        held.statements += 1;
                        superCasts.set(name, held);
                    }
                }

                const cooldowns = warrior["cooldowns"];
                if (Array.isArray(cooldowns)) {
                    warriorsCarryingCooldowns += 1;
                    for (const pair of cooldowns) {
                        if (!Array.isArray(pair)) continue;
                        cooldownStatements += 1;
                        const skillId = getNumberFromUnknown(pair[0]);
                        const left = getNumberFromUnknown(pair[1]);
                        if (skillId !== null) cooldownSkills.add(skillId);
                        if (left !== null && left > longestCooldown) longestCooldown = left;
                    }
                }

                const combo = getNumberFromUnknown(warrior["combo"]);
                if (combo !== null) {
                    comboStatements += 1;
                    if (combo > comboLargest) comboLargest = combo;
                }

                const pool = warrior["poolTime"];
                if (isRecord(pool)) {
                    const left = getNumberFromUnknown(pool["left"]);
                    if (left !== null) {
                        poolTimeStatements += 1;
                        if (left > poolTimeLargest) poolTimeLargest = left;
                        if (left < poolTimeSmallest) poolTimeSmallest = left;
                    }
                }
            }

            if (warriors.length > widestRoster.combatants) {
                widestRoster = { combatants: warriors.length, recording: path };
            }
            if (standingHere > widestStanding.combatants) {
                widestStanding = { combatants: standingHere, recording: path };
            }

            for (const message of readMessages(payload)) {
                let skillHere: string | null = null;
                let teamWideHere = false;
                for (const { key, value } of readKeys(message)) {
                    if (key === "tspell" || key === "tcustom") skillHere = value;
                    if (key === "prepare") prepareMessages += 1;
                    if (key === "+acdmg_destroyed") armourDestroyedAnnounced += 1;
                    if (!isTeamWideKey(key)) continue;
                    teamWideHere = true;
                    teamWideKeys.add(key);
                }
                if (!teamWideHere) continue;
                teamWideMessages += 1;
                if (skillHere === null) continue;
                teamWideSkills.add(skillHere);
                skillsHere.add(skillHere);
            }
        }

        for (const [ordinal, bySteps] of forecastByOrdinal) {
            const took = heldByOrdinal.get(ordinal);
            if (took === undefined) continue;
            for (const [step, forecast] of bySteps) {
                const held = graded.get(step) ?? { graded: 0, wrong: 0 };
                held.graded += 1;
                if (forecast !== took) held.wrong += 1;
                graded.set(step, held);
            }
        }

        combatantsSeen += rosterHere.size;
        combatantsWhoseArmourFell += armourFallen.size;
        combatantsWhoseResistanceFell += resistanceFallen.size;
        if (armourFallen.size > widestArmourFallen.combatants) {
            widestArmourFallen = { combatants: armourFallen.size, recording: path };
        }
        if (resistanceFallen.size > widestResistanceFallen.combatants) {
            widestResistanceFallen = { combatants: resistanceFallen.size, recording: path };
        }
        if (skillsHere.size > mostSkillsInOneRecording.skills) {
            mostSkillsInOneRecording = { skills: skillsHere.size, recording: path };
        }
    }

    assert(paths.length > 0, "there are recordings to read");
    assert(payloads > 0, "and they carry payloads");

    const byBit = [...bitStatements.keys()].sort((left, right) => left - right).map((bit) => ({
        bit,
        name: STATUS_NAMES[bit] ?? null,
        statements: bitStatements.get(bit) ?? 0,
        combatants: (bitCombatants.get(bit) ?? new Set<string>()).size,
    }));

    return {
        readAt: new Date().toISOString().slice(0, 10),
        recordings: paths.length,
        payloads,
        warriorRecords,
        widestRoster,
        fields: Object.fromEntries([...fields.entries()].sort()),
        statuses: {
            masksRead,
            masksAbsent,
            distinctValues: [...distinctMasks].sort((left, right) => left - right),
            byBit,
            widestStanding,
        },
        armour: {
            statements: armourStatements,
            destroyedStated: armourDestroyedStated,
            destroyedAnnounced: armourDestroyedAnnounced,
            combatantsWhoseArmourFell,
            combatantsSeen,
            widestFallen: widestArmourFallen,
        },
        resistances: {
            statements: resistanceStatements,
            combatantsWhoseResistanceFell,
            widestFallen: widestResistanceFallen,
        },
        superCast: {
            statements: superCastStatements,
            bySkill: [...superCasts.entries()]
                .map(([name, held]) => ({
                    name,
                    totalTurns: held.totalTurns,
                    statements: held.statements,
                }))
                .sort((left, right) => right.statements - left.statements),
            prepareMessages,
        },
        readerOwn: {
            cooldownStatements,
            warriorsCarryingCooldowns,
            distinctSkillIds: [...cooldownSkills].sort((left, right) => left - right),
            longestCooldown,
            comboStatements,
            comboLargest,
        },
        queue: {
            payloadsStatingQueue,
            payloadsStatingCurrent,
            longestQueue,
            poolTimeStatements,
            poolTimeLargest,
            poolTimeSmallest: Number.isFinite(poolTimeSmallest) ? poolTimeSmallest : 0,
            forecast: [...graded.entries()]
                .sort((left, right) => left[0] - right[0])
                .map(([step, held]) => ({ step, graded: held.graded, wrong: held.wrong })),
        },
        casts: {
            teamWideMessages,
            distinctTeamWideSkills: teamWideSkills.size,
            mostSkillsInOneRecording,
            distinctTeamWideKeys: [...teamWideKeys].sort(),
        },
    };
}

if (import.meta.main) {
    const measured = compose();
    Deno.writeTextFileSync(WRITTEN_TO, `${JSON.stringify(measured, null, 4)}\n`);
    console.log(`${WRITTEN_TO}: ${measured.recordings} recordings, ${measured.payloads} payloads`);
}
