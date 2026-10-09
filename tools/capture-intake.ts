/**
 * How a recording the add-on wrote becomes material: its report dropped, every player's name
 * replaced, the game's skill prose taken out, and a file in `captures/` named for the day, world,
 * fight, build and version it states. Committing it is a person's step, after reading it.
 *
 * ⚠️ **Neither redaction is complete.** Names are known only where a combatant id carries them,
 * so a nickname belonging to nobody in the roster walks through untouched: the run ends by
 * naming the reading that is a person's.
 *
 *     deno task capture:intake <recording.json> --name <slug>
 */

import { assert, assertStrictEquals } from "@std/assert";
import { encodeJson, parseJson } from "#/libs/json-text.ts";
import { parseInteger } from "#/libs/number-text.ts";
import * as errors from "#/libs/errors.ts";
import { isDigitAt } from "#/libs/text-walk.ts";
import { isRecord, type UnknownRecord } from "#/libs/unknown-value.ts";
import { CALLS_MAXIMUM } from "#/src/ports/fight-capture.ts";
import { ENVELOPE_KEYS, WARRIOR_FIELDS } from "#/src/ports/payload-envelope.ts";
import { FILE_FIELD, NOTHING_STATED } from "#/src/runtime/fight-file.ts";
import {
    readRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "#/tests/recorded-fights.ts";
import { RECORDINGS_DIRECTORY } from "#/tests/recording-sources.ts";
import { isFabricatedEnvelope } from "./fabricated-fight.ts";
import { CaptureIntakeError } from "./margometer-tool-error.ts";
import { INTAKE_KEYS, RECORDING_SUFFIX } from "./recorded-material.ts";

export interface Pseudonymisation {
    recording: unknown;
    changed: number;
    substitutions: Map<string, string>;
}

export interface DescriptionRemoval {
    recording: unknown;
    removed: number;
}

export interface Intake {
    text: string;
    /** What the text says, so a caller that must look at the result does not read it back. */
    recording: unknown;
    changed: number;
    removed: number;
    wasReportRemoved: boolean;
    substitutions: Map<string, string>;
}

/** Who each id is, as far as the recording says. */
interface CombatantRoll {
    isPlayerById: Map<number, boolean>;
    /** A set per id: keeping only the last name would let an earlier one walk through. */
    namesById: Map<number, Set<string>>;
}

/** One value to map, and where it goes. A worklist, because S1 forbids recursion. */
interface MappingTask {
    value: unknown;
    hold(mapped: unknown): void;
}

/** Written by this tool and by nothing else, which is why they are spelled here. */
const SUBSTITUTED_COUNT = "namesSubstituted";
const REMOVED_COUNT = "descriptionsRemoved";
/**
 * How a recording written before `develop ADR 0030` spells its envelope and calls: the format
 * still arriving from a reader on an old add-on. Envelope and call keys only; every key inside
 * `payload` is the game's and is left as it is.
 */
const ENVELOPE_BEFORE_ENGLISH: Readonly<Record<string, string>> = {
    wersja: FILE_FIELD.formatVersion,
    dodatek: FILE_FIELD.addOnVersion,
    przy: FILE_FIELD.capturedAt,
    swiat: FILE_FIELD.world,
    build: FILE_FIELD.margonemClientBuild,
    przegladarka: FILE_FIELD.userAgent,
    raport: FILE_FIELD.report,
    pominietych: FILE_FIELD.droppedCalls,
    urwany: FILE_FIELD.isTruncated,
    wpisy: FILE_FIELD.calls,
    pseudonimow: SUBSTITUTED_COUNT,
    opisow: REMOVED_COUNT,
};
const CALL_BEFORE_ENGLISH: Readonly<Record<string, string>> = {
    nr: FILE_FIELD.index,
    ladunek: FILE_FIELD.payload,
    komunikaty: FILE_FIELD.messages,
    wojownicyPrzed: FILE_FIELD.combatantsBefore,
    wojownicyPo: FILE_FIELD.combatantsAfter,
};
const INDENT_SPACES = 2;
/** The largest recording in `captures/` holds 55,095 values, measured 2026-08-29. */
export const VALUES_MAXIMUM = 4_194_304;
export const NAMES_MAXIMUM = 4096;
/**
 * What stands beside a name where the game writes one whole: over `captures/` on 2026-10-04 a
 * label stood at a string's start or end, or beside one of these, and nowhere else.
 */
const NAME_EDGES = ",;=() <>";
/** The longest string in `captures/` runs to 1110 characters, measured 2026-10-04. */
export const TEXT_CHARACTERS_MAXIMUM = 1_048_576;
/** Stands where a name was replaced, so what was kept never joins across it. */
const KEPT_BREAK = "\u0000";
/** A slug and a version are typed at a terminal; this is far past either. */
const OFFERED_MAXIMUM = 256;
const ADMITTED_MAXIMUM = 4096;
const DAY_SHAPE = "dddd-dd-dd";
/** What a slug is made of besides its single dashes, walked rather than matched (C7). */
const SLUG_CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";
const VERSION_CHARACTERS = `${SLUG_CHARACTERS}ABCDEFGHIJKLMNOPQRSTUVWXYZ`;
const VERSION_PUNCTUATION = ".-";
/**
 * What replaces a skill description. Visible on purpose: a blank would read as "the game sent
 * nothing here", and a recording that misstates what the server said is worse than a marked gap.
 */
export const REMOVED_DESCRIPTION = "(description from the game — removed, NOTICE.md)";
/**
 * Every marker meaning a description already came out. ⚠️ The second is Polish on purpose: an
 * older tool wrote it into `captures/2026-08-06-tempest-grupa-vs-hildur-…`, and knowing
 * only the current one would remove it as the game's prose and rewrite evidence to today's word.
 */
const REMOVED_DESCRIPTIONS: readonly string[] = [
    REMOVED_DESCRIPTION,
    "(opis z gry — zdjęty, NOTICE.md)",
];
/**
 * ⚠️ **A claim about the game**, measured on `develop`'s recording of 2026-08-06 (world `tempest`,
 * build `1785244275300`): 70 fields for 7 skills, the description sixth in each group of ten.
 */
const FIELDS_PER_SKILL = 10;
const DESCRIPTION_FIELD = 5;

/** Read, checked, redacted and written; what was substituted goes to the screen and nowhere else. */
function writeIntake(source: string, slug: string): string {
    assert(source.length > 0, "a recording is read from somewhere");
    const text = errors.attempt(() => Deno.readTextFileSync(source));
    if (text instanceof Error) {
        throw new CaptureIntakeError(`${source} cannot be read`, { cause: text });
    }
    const parsed = parseJson(text);
    if (parsed instanceof Error) {
        throw new CaptureIntakeError(`${source} is not JSON`, { cause: parsed });
    }
    // Spelled in English before anything is asked of it, and refused for carrying nothing before
    // it is refused for a world it never got as far as stating.
    const recording = composeRecordingInEnglish(parsed);
    requireRecordingFought(source, recording);
    requireCallsCarried(recording);
    requireSnapshotsCarried(source, recording);
    const target = `${RECORDINGS_DIRECTORY}${composeIntakeName(recording, slug)}`;
    // Material is never overwritten: a recording already here is evidence a test stands on.
    // A stat that fails for any reason but absence is not leave to write.
    const standing = errors.attempt(() => Deno.statSync(target));
    if (standing instanceof errors.Caught) {
        if (!(standing.cause instanceof Deno.errors.NotFound)) {
            throw new CaptureIntakeError(`${target} cannot be checked for standing material`, {
                cause: standing,
            });
        }
    } else throw new CaptureIntakeError(`${target} already exists — nothing overwritten`);
    const intake = composeIntake(recording);
    requireRecordingIsNew(source, intake.recording, readRecordedFights());
    const written = errors.attempt(() => Deno.writeTextFileSync(target, intake.text));
    if (written instanceof errors.Caught) {
        throw new CaptureIntakeError(`${target} cannot be written`, { cause: written });
    }
    console.log(`wrote ${target}`);
    console.log(
        `  ${intake.changed} nickname occurrences substituted, ` +
            `${intake.removed} skill descriptions removed, ` +
            `counted figures ${intake.wasReportRemoved ? "removed" : "absent"}`,
    );
    // To the screen only: a file tying a nickname to its label would be worse than the nickname.
    for (const [name, label] of intake.substitutions) console.log(`  ${name} → ${label}`);
    console.log("");
    console.log("Still yours, and no test closes it: read `txt=`, `shout=` and `loser=` in the");
    console.log("messages with your eyes. A nickname tied to no combatant id walks through.");
    console.log("Then run `deno task fight:decoding` over it, and commit it.");
    return target;
}

/**
 * Three steps, in the order that matters. The report goes first: it only takes data away, and it
 * carries nicknames of its own. Then the names, so no step after runs while a real one is still in
 * the data. Counts a recording already carries are added to, never overwritten.
 */
export function composeIntake(recording: unknown): Intake {
    const english = composeRecordingInEnglish(recording);
    let counted: { recording: unknown; wasRemoved: boolean };
    // Remove the figures the add-on counted, keeping raw material only.
    {
        // A computed number beside the evidence is one version's arithmetic nobody can tell a test
        // failed against (`develop ADR 0027`).
        if (isRecord(english)) {
            if (FILE_FIELD.report in english) {
                const kept: Record<string, unknown> = {};
                for (const [field, fieldValue] of Object.entries(english)) {
                    if (field !== FILE_FIELD.report) kept[field] = fieldValue;
                }
                assert(
                    !(FILE_FIELD.report in kept),
                    "a recording admitted carries no counted figure",
                );
                counted = { recording: kept, wasRemoved: true };
            } else counted = { recording: english, wasRemoved: false };
        } else counted = { recording: english, wasRemoved: false };
    }
    const named = composePseudonymisedRecording(counted.recording);
    const described = removeSkillDescriptions(named.recording);
    if (!isRecord(described.recording)) {
        throw new CaptureIntakeError("the recording is not an object");
    }
    const written = {
        ...described.recording,
        [SUBSTITUTED_COUNT]: readCarriedCount(described.recording, SUBSTITUTED_COUNT) +
            named.changed,
        [REMOVED_COUNT]: readCarriedCount(described.recording, REMOVED_COUNT) + described.removed,
    };
    const text = encodeJson(written, INDENT_SPACES);
    if (text instanceof Error) {
        throw new CaptureIntakeError("the redacted recording would not be written as text", {
            cause: text,
        });
    }
    return {
        text: `${text}\n`,
        recording: written,
        changed: named.changed,
        removed: described.removed,
        wasReportRemoved: counted.wasRemoved,
        substitutions: named.substitutions,
    };
}

/**
 * What an earlier intake says it redacted. ⚠️ **Absent and unreadable are different, and only one
 * is zero**: reading a count this cannot understand as zero would write onto the evidence that an
 * earlier redaction substituted nothing.
 */
function readCarriedCount(envelope: UnknownRecord, field: string): number {
    const carried = envelope[field];
    if (carried === undefined) return 0;
    if (typeof carried === "number") {
        if (Number.isSafeInteger(carried)) {
            if (carried >= 0) return carried;
        }
    }
    throw new CaptureIntakeError(
        `the recording states \`${field}\` as something that is not a count, so what an earlier ` +
            "redaction did is unknown",
    );
}

/** The recording with its envelope in English, whichever spelling it came in; English passes. */
export function composeRecordingInEnglish(recording: unknown): unknown {
    if (!isRecord(recording)) return recording;
    const envelope = composeRenamedRecord(recording, ENVELOPE_BEFORE_ENGLISH);
    const stated = envelope[FILE_FIELD.calls];
    if (!Array.isArray(stated)) return envelope;
    envelope[FILE_FIELD.calls] = stated.map((call) =>
        isRecord(call) ? composeRenamedRecord(call, CALL_BEFORE_ENGLISH) : call
    );
    return envelope;
}

/** One record with its keys renamed where a name is known, in the order they arrived in. */
function composeRenamedRecord(
    record: UnknownRecord,
    names: Readonly<Record<string, string>>,
): Record<string, unknown> {
    const renamed: Record<string, unknown> = {};
    for (const [key, held] of Object.entries(record)) renamed[names[key] ?? key] = held;
    assert(Object.keys(renamed).length <= Object.keys(record).length, "a field is renamed once");
    return renamed;
}

/**
 * Every player's name replaced by `Gracz 1`, `Gracz 2`, … Pseudonymisation, not anonymisation:
 * the ids stay, because the protocol names combatants by them and the health witness stands on
 * them. What goes is what names a person to somebody reading GitHub.
 */
export function composePseudonymisedRecording(recording: unknown): Pseudonymisation {
    const roll = indexCombatantRoll(recording);
    requireEveryCombatantDecided(roll);
    const substitutions = indexNameSubstitutions(roll);
    const pairs = composeSubstitutionOrder(substitutions);
    requireNoNameInsideAnother(roll, pairs);
    let changed = 0;
    // One walk, longest name first at each place, and a name only where it stands whole: a short
    // nickname inside a skill's or a monster's name is refused rather than replaced into it.
    const substituteNames = (text: string): string => {
        if (text.length > TEXT_CHARACTERS_MAXIMUM) {
            throw new CaptureIntakeError(
                `a string of ${text.length} characters, past the ${TEXT_CHARACTERS_MAXIMUM} read`,
            );
        }
        let substituted = "";
        let kept = "";
        let index = 0;
        for (let look = 0; look <= TEXT_CHARACTERS_MAXIMUM; look += 1) {
            if (index >= text.length) break;
            const pair = isNameEdgeAt(text, index - 1)
                ? lookupWholeNameAt(text, index, pairs)
                : null;
            if (pair === null) {
                substituted += text.charAt(index);
                kept += text.charAt(index);
                index += 1;
            } else {
                substituted += pair[1];
                kept += KEPT_BREAK;
                index += pair[0].length;
                changed += 1;
            }
        }
        assert(index >= text.length, "a text is walked to its end, which is what the bound is for");
        const inside = pairs.find(([name]) => kept.includes(name));
        if (inside !== undefined) {
            throw new CaptureIntakeError(
                `the name \`${inside[0]}\` stands inside a longer word — replacing it would ` +
                    "mangle that word, so a person decides",
            );
        }
        return substituted;
    };
    const mapped = composeMappedValue(recording, substituteNames);
    return { recording: mapped, changed, substitutions };
}

function indexCombatantRoll(recording: unknown): CombatantRoll {
    const roll: CombatantRoll = { isPlayerById: new Map(), namesById: new Map() };
    for (const call of readRecordingCalls(recording)) {
        // Add the payload's roster: `npc` rides only there, the one place a person can be told.
        addPayload: {
            const payload = call[FILE_FIELD.payload];
            if (!isRecord(payload)) break addPayload;
            const warriors = payload[ENVELOPE_KEYS.combatants];
            if (!isRecord(warriors)) break addPayload;
            for (const [key, stated] of Object.entries(warriors)) {
                if (!isRecord(stated)) continue;
                const id = readIdentity(stated[WARRIOR_FIELDS.id]) ?? readIdentity(key);
                if (id === null) continue;
                addRollName(roll, id, stated[WARRIOR_FIELDS.name]);
                const nonPlayer = readIdentity(stated[INTAKE_KEYS.nonPlayer]);
                if (nonPlayer === null) continue;
                // One payload saying player and another monster is a file nobody can redact with
                // certainty: the last word would decide whether a nickname is kept.
                const isPlayer = nonPlayer === 0;
                if (roll.isPlayerById.get(id) === !isPlayer) {
                    throw new CaptureIntakeError(
                        `combatant ${id} is stated both a player and a monster by ` +
                            `\`${INTAKE_KEYS.nonPlayer}\` — a person decides which`,
                    );
                }
                roll.isPlayerById.set(id, isPlayer);
            }
        }
        // Add the names the snapshots carry, which say nothing of who is a player.
        {
            const sides = [call[FILE_FIELD.combatantsBefore], call[FILE_FIELD.combatantsAfter]];
            for (const side of sides) {
                if (!Array.isArray(side)) continue;
                for (const stated of side) {
                    if (!isRecord(stated)) continue;
                    const id = readIdentity(stated[WARRIOR_FIELDS.id]);
                    if (id !== null) addRollName(roll, id, stated[WARRIOR_FIELDS.name]);
                }
            }
        }
    }
    if (roll.namesById.size > NAMES_MAXIMUM) {
        throw new CaptureIntakeError(
            `${roll.namesById.size} combatants named, past the ${NAMES_MAXIMUM} a roll holds`,
        );
    }
    return roll;
}

function readRecordingCalls(recording: unknown): UnknownRecord[] {
    if (!isRecord(recording)) return [];
    const stated = recording[FILE_FIELD.calls];
    if (!Array.isArray(stated)) return [];
    if (stated.length > CALLS_MAXIMUM) {
        throw new CaptureIntakeError(
            `\`${FILE_FIELD.calls}\` holds ${stated.length}, past the ${CALLS_MAXIMUM} read`,
        );
    }
    return stated.filter(isRecord);
}

/** An id as the game states one: a whole number, or its digits as text. */
function readIdentity(candidate: unknown): number | null {
    if (typeof candidate === "number") return Number.isSafeInteger(candidate) ? candidate : null;
    if (typeof candidate !== "string") return null;
    return parseInteger(candidate);
}

function addRollName(roll: CombatantRoll, id: number, name: unknown): void {
    assert(Number.isSafeInteger(id), "a name is put against an id");
    if (typeof name !== "string") return;
    if (name.length === 0) return;
    const known = roll.namesById.get(id) ?? new Set<string>();
    known.add(name);
    if (known.size > NAMES_MAXIMUM) {
        throw new CaptureIntakeError(
            `combatant ${id} is named ${known.size} ways, past the ${NAMES_MAXIMUM} read`,
        );
    }
    roll.namesById.set(id, known);
}

/**
 * ⚠️ **Guessing is not on the table.** "A negative id is a monster" is a claim nobody measured,
 * and it is wrong both ways at once: one way corrupts the material, the other admits a nickname.
 */
function requireEveryCombatantDecided(roll: CombatantRoll): void {
    // Numeric, not lexicographic: `-161518` would otherwise sort between `-1` and `-2`.
    const undecided = [...roll.namesById.keys()]
        .filter((id) => !roll.isPlayerById.has(id))
        .sort((id, otherId) => id - otherId);
    if (undecided.length === 0) return;
    throw new CaptureIntakeError(
        `cannot tell whether combatant ${undecided.join(", ")} is a player or a monster — ` +
            `\`${INTAKE_KEYS.nonPlayer}\` rides only in the payload's roster, and they are not there`,
    );
}

function indexNameSubstitutions(roll: CombatantRoll): Map<string, string> {
    const substitutions = new Map<string, string>();
    const players = [...roll.namesById.keys()]
        .filter((id) => roll.isPlayerById.get(id) === true)
        .sort((id, otherId) => id - otherId);
    for (const [order, id] of players.entries()) {
        // A digit rather than a letter: `Gracz A`…`Gracz G` name fixed people in the repository's
        // prose (`NOTICE.md`), while a label here means something in one file only.
        const label = `Gracz ${order + 1}`;
        for (const name of roll.namesById.get(id) ?? []) {
            const standing = substitutions.get(name);
            if (standing !== undefined) {
                if (standing !== label) {
                    throw new CaptureIntakeError(
                        `two players share the name \`${name}\` — a message carries only the ` +
                            "text, so a substitution cannot tell them apart",
                    );
                }
            }
            substitutions.set(name, label);
        }
    }
    if (substitutions.size > NAMES_MAXIMUM) {
        throw new CaptureIntakeError(
            `${substitutions.size} player names, past the ${NAMES_MAXIMUM} substituted`,
        );
    }
    return substitutions;
}

/**
 * Longest name first, so a nickname inside another is not mutilated by it; and a label that is
 * also somebody's name is refused, since a file with both cannot be told apart once substituted.
 * The add-on cannot write that; a file edited by hand can.
 */
function composeSubstitutionOrder(substitutions: ReadonlyMap<string, string>): [string, string][] {
    const pairs = [...substitutions]
        .filter(([name, label]) => name !== label)
        .sort((pair, otherPair) => otherPair[0].length - pair[0].length);
    const labels = new Set(pairs.map(([, label]) => label));
    const collision = pairs.find(([name]) => labels.has(name));
    if (collision === undefined) return pairs;
    throw new CaptureIntakeError(
        `the name \`${collision[0]}\` is also a replacement label — the file looks hand-edited`,
    );
}

/** A monster named with a player's whole name in it would lose part of its own name. */
function requireNoNameInsideAnother(
    roll: CombatantRoll,
    pairs: readonly (readonly [string, string])[],
): void {
    for (const [id, names] of roll.namesById) {
        if (roll.isPlayerById.get(id) === true) continue;
        for (const monsterName of names) {
            const held = pairs.find(([name]) => monsterName.includes(name));
            if (held === undefined) continue;
            throw new CaptureIntakeError(
                `the monster \`${monsterName}\` is named with the player name \`${held[0]}\` in ` +
                    "it — replacing it would mangle the monster, so a person decides",
            );
        }
    }
}

function isNameEdgeAt(text: string, index: number): boolean {
    if (index < 0) return true;
    if (index >= text.length) return true;
    return NAME_EDGES.includes(text.charAt(index));
}

function lookupWholeNameAt(
    text: string,
    index: number,
    pairs: readonly (readonly [string, string])[],
): readonly [string, string] | null {
    for (const pair of pairs) {
        if (!text.startsWith(pair[0], index)) continue;
        if (isNameEdgeAt(text, index + pair[0].length)) return pair;
    }
    return null;
}

/** Every string in the document mapped, the keys left alone: they are ids, kept in order. */
function composeMappedValue(root: unknown, mapText: (text: string) => string): unknown {
    let mapped: unknown = null;
    const pending: MappingTask[] = [{ value: root, hold: (done) => void (mapped = done) }];
    let steps = 0;
    while (pending.length > 0) {
        const task = pending.pop();
        if (task === undefined) break;
        steps += 1;
        if (steps > VALUES_MAXIMUM) {
            throw new CaptureIntakeError(
                `the recording holds past the ${VALUES_MAXIMUM} values read`,
            );
        }
        const walkedValue = task.value;
        if (typeof walkedValue === "string") {
            task.hold(mapText(walkedValue));
        } else if (Array.isArray(walkedValue)) {
            const held: unknown[] = walkedValue.map(() => null);
            task.hold(held);
            for (const [index, member] of walkedValue.entries()) {
                pending.push({ value: member, hold: (done) => void (held[index] = done) });
            }
        } else if (isRecord(walkedValue)) {
            const held: Record<string, unknown> = {};
            for (const key of Object.keys(walkedValue)) held[key] = null;
            task.hold(held);
            for (const [key, fieldValue] of Object.entries(walkedValue)) {
                pending.push({ value: fieldValue, hold: (done) => void (held[key] = done) });
            }
        } else task.hold(walkedValue);
    }
    assert(steps > 0, "a document took at least one step");
    return mapped;
}

/**
 * Without the skill descriptions the game wrote: licensing, not caution, since they are whole
 * sentences by the game's authors. An array that is not whole groups of ten is a layout this does
 * not understand, and cutting the sixth field out of it would remove the wrong thing.
 */
export function removeSkillDescriptions(recording: unknown): DescriptionRemoval {
    let removed = 0;
    for (const call of readRecordingCalls(recording)) {
        const payload = call[FILE_FIELD.payload];
        if (!isRecord(payload)) continue;
        const skills = payload[INTAKE_KEYS.skills];
        if (!Array.isArray(skills)) continue;
        if (skills.length % FIELDS_PER_SKILL !== 0) {
            throw new CaptureIntakeError(
                `\`${FILE_FIELD.payload}.${INTAKE_KEYS.skills}\` holds ${skills.length} ` +
                    `fields, not whole groups of ${FIELDS_PER_SKILL} — the layout changed`,
            );
        }
        for (
            let descriptionAt = DESCRIPTION_FIELD;
            descriptionAt < skills.length;
            descriptionAt += FIELDS_PER_SKILL
        ) {
            const stated = skills[descriptionAt];
            if (typeof stated !== "string") continue;
            if (stated.length === 0) continue;
            if (REMOVED_DESCRIPTIONS.includes(stated)) continue;
            skills[descriptionAt] = REMOVED_DESCRIPTION;
            removed += 1;
        }
    }
    return { recording, removed };
}

/** A recording with no call is a session that saw nothing, and evidence of nothing. */
export function requireCallsCarried(recording: unknown): void {
    if (readRecordingCalls(recording).length > 0) return;
    throw new CaptureIntakeError(
        `\`${FILE_FIELD.calls}\` carries no call the engine made — nothing here is evidence`,
    );
}

/**
 * A recording with no snapshot is a fight the panel read back off its shelf: a report, not
 * evidence, because the snapshots are the one check the decoder has that is not the decoder
 * (`develop ADR 0053`). The rule is the tests' reader's, so intake and the corpus share one.
 */
export function requireSnapshotsCarried(path: string, recording: unknown): void {
    if (readOfferedFight(path, recording).hasSnapshot) return;
    throw new CaptureIntakeError(
        `no call states \`${FILE_FIELD.combatantsBefore}\` or \`${FILE_FIELD.combatantsAfter}\`` +
            " — a fight read back off the shelf, and the snapshots are what the decoder is held to",
    );
}

/** The corpus's own reader, a shape it refuses refused with intake's class, its words the cause. */
function readOfferedFight(path: string, recording: unknown): RecordedFight {
    const fight = errors.attempt(() => readRecordedFight(path, recording));
    if (fight instanceof errors.Caught) {
        throw new CaptureIntakeError(`${path} is not a recording the corpus can read`, {
            cause: fight,
        });
    }
    return fight;
}

/** A fight nobody fought is never material, and once in `captures/` only a person takes it out. */
export function requireRecordingFought(path: string, recording: unknown): void {
    if (!isFabricatedEnvelope(recording)) return;
    throw new CaptureIntakeError(`${path} is a fabricated fight, which is never material`);
}

/**
 * A fight already in the corpus, told by its payloads. The envelope cannot answer this, since a
 * replay states the day, world and build of the replay; and the snapshots cannot, since a replay
 * rebuilds them. Compared in the redacted form, which is the form the corpus is in.
 */
export function requireRecordingIsNew(
    path: string,
    recording: unknown,
    admitted: readonly RecordedFight[],
): void {
    assert(admitted.length <= ADMITTED_MAXIMUM, "the material compared against is bounded");
    const offered = encodeRequiredJson(readOfferedFight(path, recording).updates);
    for (const fight of admitted) {
        if (encodeRequiredJson(fight.updates) !== offered) continue;
        throw new CaptureIntakeError(
            `this fight is already material as \`${fight.path}\` — the payloads are the same, ` +
                "whatever day, world and build the envelope states",
        );
    }
}

function encodeRequiredJson(encodable: unknown): string {
    const text = encodeJson(encodable, 0);
    if (text instanceof Error) {
        throw new CaptureIntakeError("a payload cannot be written as text to compare", {
            cause: text,
        });
    }
    return text;
}

/** The name the material is filed under: day, world, slug, game build and add-on version. */
export function composeIntakeName(recording: unknown, slug: string): string {
    const envelope = isRecord(recording) ? recording : {};
    const capturedAt = envelope[FILE_FIELD.capturedAt];
    const day = typeof capturedAt === "string" ? parseMomentDay(capturedAt) : null;
    if (day === null) {
        throw new CaptureIntakeError(`\`${FILE_FIELD.capturedAt}\` is not a moment`);
    }
    const world = envelope[FILE_FIELD.world];
    if (typeof world !== "string") {
        throw new CaptureIntakeError(`\`${FILE_FIELD.world}\` is missing`);
    }
    if (!isSlugText(world)) {
        throw new CaptureIntakeError(`\`${FILE_FIELD.world}\` is \`${world}\`, not a name part`);
    }
    if (!isSlugText(slug)) throw new CaptureIntakeError(`\`${slug}\` is not a kebab-case slug`);
    // The day and the world stand in front of the slug already, so a slug opening with either
    // files the fight under them twice, and only a person deleting the file undoes it.
    for (const composed of [day, world]) {
        if (slug === composed) {
            throw new CaptureIntakeError(`\`${slug}\` is what the name carries already`);
        }
        if (slug.startsWith(`${composed}-`)) {
            const rest = slug.slice(composed.length + 1);
            throw new CaptureIntakeError(
                `\`${slug}\` opens with \`${composed}\`, which the name carries already: ` +
                    `pass \`--name ${rest}\``,
            );
        }
    }
    const build = readEnvelopeVersion(envelope, FILE_FIELD.margonemClientBuild);
    const addOn = readEnvelopeVersion(envelope, FILE_FIELD.addOnVersion);
    return `${day}-${world}-${slug}-${build}-${addOn}${RECORDING_SUFFIX}`;
}

/** The day part of a stated moment, walked rather than parsed: `YYYY-MM-DD` and nothing else. */
function parseMomentDay(text: string): string | null {
    if (text.length < DAY_SHAPE.length) return null;
    const day = text.slice(0, DAY_SHAPE.length);
    for (const [position, wanted] of [...DAY_SHAPE].entries()) {
        const character = day.charAt(position);
        if (wanted === "-") {
            if (character !== "-") return null;
        } else if (!isDigitAt(day, position)) return null;
    }
    assertStrictEquals(day.length, DAY_SHAPE.length, "a day is written to one length");
    return day;
}

/**
 * A version as a name may carry it, or `none` where the file states none. Both come from outside,
 * so neither is trusted into a path: letters, digits, dots and dashes, punctuation at neither end.
 */
function readEnvelopeVersion(envelope: UnknownRecord, field: string): string {
    const stated = envelope[field];
    if (typeof stated !== "string") return NOTHING_STATED;
    if (stated.length === 0) return NOTHING_STATED;
    if (!isVersionText(stated)) {
        throw new CaptureIntakeError(`\`${field}\` is \`${stated}\`, not something a name carries`);
    }
    return stated;
}

function isVersionText(text: string): boolean {
    if (text.length > OFFERED_MAXIMUM) return false;
    const characters = [...text];
    for (const [position, character] of characters.entries()) {
        if (VERSION_PUNCTUATION.includes(character)) {
            if (position === 0) return false;
            if (position === characters.length - 1) return false;
        } else if (!VERSION_CHARACTERS.includes(character)) return false;
    }
    return characters.length > 0;
}

/** Lower-case letters, digits and single dashes, with a dash at neither end. Walked (C7). */
export function isSlugText(text: string): boolean {
    if (text.length === 0) return false;
    if (text.length > OFFERED_MAXIMUM) return false;
    if (text.startsWith("-")) return false;
    if (text.endsWith("-")) return false;
    let wasDash = false;
    for (const character of text) {
        const isDash = character === "-";
        if (isDash) {
            if (wasDash) return false;
        } else if (!SLUG_CHARACTERS.includes(character)) return false;
        wasDash = isDash;
    }
    return true;
}

if (import.meta.main) {
    const [source, flag, slug] = Deno.args;
    const usage = "usage: deno task capture:intake <recording.json> --name <slug>";
    if (source === undefined) throw new CaptureIntakeError(usage);
    if (flag !== "--name") throw new CaptureIntakeError(usage);
    if (slug === undefined) throw new CaptureIntakeError(usage);
    if (source.length === 0) throw new CaptureIntakeError("a recording is named by its path");
    writeIntake(source, slug);
}
