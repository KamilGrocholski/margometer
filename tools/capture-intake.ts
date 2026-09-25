/**
 * How a recording the add-on wrote becomes material: its report dropped, every player's name
 * replaced, the game's ability prose taken out, and a file named for the day, world, fight, build
 * and version it states. This branch carries no `captures/` (`docs/design.md` §11), so the file is
 * written under `dist/intake/`, and moving it into `develop:captures/` is a person's step.
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
import { callForeign } from "#/libs/result.ts";
import { isRecord, type UnknownRecord } from "#/libs/unknown-value.ts";
import { WARRIOR_FIELDS } from "#/src/game/engine-warrior.ts";
import { ENVELOPE_KEYS } from "#/src/game/payload-envelope.ts";
import { FILE_FIELD, NOTHING_STATED } from "#/src/runtime/fight-file.ts";
import {
    readRecordedFight,
    readRecordedFights,
    type RecordedFight,
} from "#/tests/recorded-fights.ts";
import { CaptureIntakeError } from "./margometer-tool-error.ts";

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

/**
 * The game's keys only intake reads, spelled once (N13): who is a monster, and the ability list
 * whose prose goes. Nothing in `src/` reads either.
 */
const INTAKE_KEYS = { nonPlayer: "npc", abilities: "skills" } as const;
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
    build: FILE_FIELD.gameBuild,
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
/** The largest recording in `develop:captures/` holds 55,095 values, measured 2026-08-29. */
const VALUES_MAXIMUM = 4_194_304;
/** A fight holds twenty, and each is named at most a handful of times. */
const NAMES_MAXIMUM = 4096;
/** A slug and a version are typed at a terminal; this is far past either. */
const OFFERED_MAXIMUM = 256;
const ADMITTED_MAXIMUM = 4096;
const CALLS_MAXIMUM = 100_000;
const DAY_SHAPE = "dddd-dd-dd";
const INTAKE_DIRECTORY = "dist/intake";
const RECORDING_SUFFIX = ".json";
/**
 * What replaces an ability description. Visible on purpose: a blank would read as "the game sent
 * nothing here", and a recording that misstates what the server said is worse than a marked gap.
 */
export const REMOVED_DESCRIPTION = "(description from the game — removed, NOTICE.md)";
/**
 * Every marker meaning a description already came out. ⚠️ The second is Polish on purpose: an
 * older tool wrote it into `develop:captures/2026-08-06-tempest-grupa-vs-hildur-…`, and knowing
 * only the current one would remove it as the game's prose and rewrite evidence to today's word.
 */
const REMOVED_DESCRIPTIONS: readonly string[] = [
    REMOVED_DESCRIPTION,
    "(opis z gry — zdjęty, NOTICE.md)",
];
/**
 * ⚠️ **A claim about the game**, measured on `develop`'s recording of 2026-08-06 (world `tempest`,
 * build `1785244275300`): 70 fields for 7 abilities, the description sixth in each group of ten.
 */
const FIELDS_PER_ABILITY = 10;
const DESCRIPTION_FIELD = 5;

/**
 * Three steps, in the order that matters. The report goes first: it only takes data away, and it
 * carries nicknames of its own. Then the names, so no step after runs while a real one is still in
 * the data. Counts a recording already carries are added to, never overwritten.
 */
export function composeIntake(recording: unknown): Intake {
    const counted = removeReport(composeRecordingInEnglish(recording));
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
    if (!text.ok) {
        throw new CaptureIntakeError("the redacted recording would not be written as text", {
            cause: text.error,
        });
    }
    return {
        text: `${text.value}\n`,
        recording: written,
        changed: named.changed,
        removed: described.removed,
        wasReportRemoved: counted.wasRemoved,
        substitutions: named.substitutions,
    };
}

/**
 * Without the figures the add-on counted: raw material only, because a computed number beside the
 * evidence is one version's arithmetic nobody can tell a test failed against (`develop ADR 0027`).
 */
function removeReport(recording: unknown): { recording: unknown; wasRemoved: boolean } {
    if (!isRecord(recording)) return { recording, wasRemoved: false };
    if (!(FILE_FIELD.report in recording)) return { recording, wasRemoved: false };
    const kept: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(recording)) {
        if (field !== FILE_FIELD.report) kept[field] = value;
    }
    assert(!(FILE_FIELD.report in kept), "a recording admitted carries no counted figure");
    return { recording: kept, wasRemoved: true };
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
    value: UnknownRecord,
    names: Readonly<Record<string, string>>,
): Record<string, unknown> {
    const renamed: Record<string, unknown> = {};
    for (const [key, held] of Object.entries(value)) renamed[names[key] ?? key] = held;
    assert(Object.keys(renamed).length <= Object.keys(value).length, "a field is renamed once");
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
    let changed = 0;
    const substitute = (text: string): string => {
        let result = text;
        for (const [name, label] of pairs) {
            const parts = result.split(name);
            if (parts.length === 1) continue;
            changed += parts.length - 1;
            result = parts.join(label);
        }
        return result;
    };
    const mapped = composeMappedValue(recording, substitute);
    assert(changed >= 0, "what was substituted is never fewer than nothing");
    return { recording: mapped, changed, substitutions };
}

function indexCombatantRoll(recording: unknown): CombatantRoll {
    const roll: CombatantRoll = { isPlayerById: new Map(), namesById: new Map() };
    for (const call of readRecordingCalls(recording)) {
        indexCombatantRollPayload(roll, call);
        indexCombatantRollSnapshots(roll, call);
    }
    assert(roll.namesById.size <= NAMES_MAXIMUM, "a roll names no more than it is bounded to");
    return roll;
}

function readRecordingCalls(recording: unknown): UnknownRecord[] {
    if (!isRecord(recording)) return [];
    const stated = recording[FILE_FIELD.calls];
    if (!Array.isArray(stated)) return [];
    assert(stated.length <= CALLS_MAXIMUM, "a recording stays inside its stated bound");
    return stated.filter(isRecord);
}

/** `npc` rides only in the payload's roster, so that is the only place a person can be told. */
function indexCombatantRollPayload(roll: CombatantRoll, call: UnknownRecord): void {
    const payload = call[FILE_FIELD.payload];
    if (!isRecord(payload)) return;
    const warriors = payload[ENVELOPE_KEYS.combatants];
    if (!isRecord(warriors)) return;
    for (const [key, stated] of Object.entries(warriors)) {
        if (!isRecord(stated)) continue;
        const id = readIdentity(stated[WARRIOR_FIELDS.id]) ?? readIdentity(key);
        if (id === null) continue;
        const nonPlayer = readIdentity(stated[INTAKE_KEYS.nonPlayer]);
        if (nonPlayer !== null) roll.isPlayerById.set(id, nonPlayer === 0);
        setRollName(roll, id, stated[WARRIOR_FIELDS.name]);
    }
}

function indexCombatantRollSnapshots(roll: CombatantRoll, call: UnknownRecord): void {
    const sides = [call[FILE_FIELD.combatantsBefore], call[FILE_FIELD.combatantsAfter]];
    for (const side of sides) {
        if (!Array.isArray(side)) continue;
        for (const stated of side) {
            if (!isRecord(stated)) continue;
            const id = readIdentity(stated[WARRIOR_FIELDS.id]);
            if (id !== null) setRollName(roll, id, stated[WARRIOR_FIELDS.name]);
        }
    }
}

/** An id as the game states one: a whole number, or its digits as text. */
function readIdentity(value: unknown): number | null {
    if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
    if (typeof value !== "string") return null;
    return parseInteger(value);
}

function setRollName(roll: CombatantRoll, id: number, name: unknown): void {
    assert(Number.isSafeInteger(id), "a name is put against an id");
    if (typeof name !== "string") return;
    if (name.length === 0) return;
    const known = roll.namesById.get(id) ?? new Set<string>();
    known.add(name);
    assert(known.size <= NAMES_MAXIMUM, "a combatant stays inside the names one is seen under");
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
        .sort((one, other) => one - other);
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
        .sort((one, other) => one - other);
    for (const [order, id] of players.entries()) {
        // A digit rather than a letter: `Gracz A`…`Gracz G` name fixed people in the repository's
        // prose (`develop:NOTICE.md`), while a label here means something in one file only.
        const label = `Gracz ${order + 1}`;
        for (const name of roll.namesById.get(id) ?? []) {
            const standing = substitutions.get(name);
            if (standing !== undefined && standing !== label) {
                throw new CaptureIntakeError(
                    `two players share the name \`${name}\` — a message carries only the text, so ` +
                        "a substitution cannot tell them apart",
                );
            }
            substitutions.set(name, label);
        }
    }
    assert(substitutions.size <= NAMES_MAXIMUM, "a name is substituted once");
    return substitutions;
}

/**
 * Longest name first, so a nickname inside another is not mutilated by it; and a label that is
 * also somebody's name is refused, since a sequential substitution over those eats itself. The
 * add-on cannot write that; a file edited by hand can.
 */
function composeSubstitutionOrder(substitutions: Map<string, string>): [string, string][] {
    const pairs = [...substitutions]
        .filter(([name, label]) => name !== label)
        .sort((one, other) => other[0].length - one[0].length);
    const labels = new Set(pairs.map(([, label]) => label));
    const collision = pairs.find(([name]) => labels.has(name));
    if (collision === undefined) return pairs;
    throw new CaptureIntakeError(
        `the name \`${collision[0]}\` is also a replacement label — the file looks hand-edited`,
    );
}

/** Every string in the document mapped, the keys left alone: they are ids, kept in order. */
function composeMappedValue(root: unknown, mapText: (text: string) => string): unknown {
    let mapped: unknown = null;
    const pending: MappingTask[] = [{ value: root, hold: (one) => void (mapped = one) }];
    let steps = 0;
    while (pending.length > 0) {
        const task = pending.pop();
        if (task === undefined) break;
        steps += 1;
        assert(steps <= VALUES_MAXIMUM, "the walk stays inside its stated bound");
        const value = task.value;
        if (typeof value === "string") {
            task.hold(mapText(value));
        } else if (Array.isArray(value)) {
            const held: unknown[] = value.map(() => null);
            task.hold(held);
            for (const [at, one] of value.entries()) {
                pending.push({ value: one, hold: (done) => void (held[at] = done) });
            }
        } else if (isRecord(value)) {
            const held: Record<string, unknown> = {};
            for (const key of Object.keys(value)) held[key] = null;
            task.hold(held);
            for (const [key, one] of Object.entries(value)) {
                pending.push({ value: one, hold: (done) => void (held[key] = done) });
            }
        } else task.hold(value);
    }
    assert(steps > 0, "a document took at least one step");
    return mapped;
}

/**
 * Without the ability descriptions the game wrote: licensing, not caution, since they are whole
 * sentences by the game's authors. An array that is not whole groups of ten is a layout this does
 * not understand, and cutting the sixth field out of it would remove the wrong thing.
 */
export function removeSkillDescriptions(recording: unknown): DescriptionRemoval {
    let removed = 0;
    for (const call of readRecordingCalls(recording)) {
        const payload = call[FILE_FIELD.payload];
        if (!isRecord(payload)) continue;
        const abilities = payload[INTAKE_KEYS.abilities];
        if (!Array.isArray(abilities)) continue;
        if (abilities.length % FIELDS_PER_ABILITY !== 0) {
            throw new CaptureIntakeError(
                `\`${FILE_FIELD.payload}.${INTAKE_KEYS.abilities}\` holds ${abilities.length} ` +
                    `fields, not whole groups of ${FIELDS_PER_ABILITY} — the layout changed`,
            );
        }
        for (let at = DESCRIPTION_FIELD; at < abilities.length; at += FIELDS_PER_ABILITY) {
            const stated = abilities[at];
            if (typeof stated !== "string") continue;
            if (stated.length === 0) continue;
            if (REMOVED_DESCRIPTIONS.includes(stated)) continue;
            abilities[at] = REMOVED_DESCRIPTION;
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
    if (readRecordedFight(path, recording).hasSnapshot) return;
    throw new CaptureIntakeError(
        `no call states \`${FILE_FIELD.combatantsBefore}\` or \`${FILE_FIELD.combatantsAfter}\`` +
            " — a fight read back off the shelf, and the snapshots are what the decoder is held to",
    );
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
    const offered = encodeRequiredJson(readRecordedFight(path, recording).updates);
    for (const fight of admitted) {
        if (encodeRequiredJson(fight.updates) !== offered) continue;
        throw new CaptureIntakeError(
            `this fight is already material as \`${fight.path}\` — the payloads are the same, ` +
                "whatever day, world and build the envelope states",
        );
    }
}

function encodeRequiredJson(value: unknown): string {
    const text = encodeJson(value, 0);
    if (!text.ok) {
        throw new CaptureIntakeError("a payload cannot be written as text to compare", {
            cause: text.error,
        });
    }
    return text.value;
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
    const build = readEnvelopeVersion(envelope, FILE_FIELD.gameBuild);
    const addOn = readEnvelopeVersion(envelope, FILE_FIELD.addOnVersion);
    return `${day}-${world}-${slug}-${build}-${addOn}${RECORDING_SUFFIX}`;
}

/** The day part of a stated moment, walked rather than parsed: `YYYY-MM-DD` and nothing else. */
function parseMomentDay(text: string): string | null {
    if (text.length < DAY_SHAPE.length) return null;
    const day = text.slice(0, DAY_SHAPE.length);
    for (const [at, wanted] of [...DAY_SHAPE].entries()) {
        const character = day.charAt(at);
        if (wanted === "-") {
            if (character !== "-") return null;
        } else if (character < "0" || character > "9") return null;
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
    for (const [at, character] of characters.entries()) {
        const isLetter = (character >= "a" && character <= "z") ||
            (character >= "A" && character <= "Z");
        const isDigit = character >= "0" && character <= "9";
        const isPunctuation = character === "." || character === "-";
        if (!isLetter && !isDigit && !isPunctuation) return false;
        if (isPunctuation) {
            if (at === 0) return false;
            if (at === characters.length - 1) return false;
        }
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
        const isLetter = character >= "a" && character <= "z";
        const isDigit = character >= "0" && character <= "9";
        const isDash = character === "-";
        if (!isLetter && !isDigit && !isDash) return false;
        if (isDash && wasDash) return false;
        wasDash = isDash;
    }
    return true;
}

/** Read, checked, redacted and written; what was substituted goes to the screen and nowhere else. */
export function writeIntake(source: string, slug: string): string {
    assert(source.length > 0, "a recording is read from somewhere");
    const text = callForeign(() => Deno.readTextFileSync(source));
    if (!text.ok) {
        throw new CaptureIntakeError(`${source} cannot be read`, { cause: text.error.cause });
    }
    const parsed = parseJson(text.value);
    if (!parsed.ok) throw new CaptureIntakeError(`${source} is not JSON`, { cause: parsed.error });
    // Spelled in English before anything is asked of it, and refused for carrying nothing before
    // it is refused for a world it never got as far as stating.
    const recording = composeRecordingInEnglish(parsed.value);
    requireCallsCarried(recording);
    requireSnapshotsCarried(source, recording);
    const target = `${INTAKE_DIRECTORY}/${composeIntakeName(recording, slug)}`;
    const standing = callForeign(() => Deno.statSync(target));
    if (standing.ok) throw new CaptureIntakeError(`${target} already exists — nothing overwritten`);
    const intake = composeIntake(recording);
    requireRecordingIsNew(source, intake.recording, readRecordedFights());
    Deno.mkdirSync(INTAKE_DIRECTORY, { recursive: true });
    Deno.writeTextFileSync(target, intake.text);
    console.log(`wrote ${target}`);
    console.log(
        `  ${intake.changed} nickname occurrences substituted, ` +
            `${intake.removed} ability descriptions removed, ` +
            `counted figures ${intake.wasReportRemoved ? "removed" : "absent"}`,
    );
    // To the screen only: a file tying a nickname to its label would be worse than the nickname.
    for (const [name, label] of intake.substitutions) console.log(`  ${name} → ${label}`);
    console.log("");
    console.log("Still yours, and no test closes it: read `txt=`, `shout=` and `loser=` in the");
    console.log("messages with your eyes. A nickname tied to no combatant id walks through.");
    console.log("Then move the file into develop's captures/ and commit it there.");
    return target;
}

if (import.meta.main) {
    const [source, flag, slug] = Deno.args;
    if (source === undefined || flag !== "--name" || slug === undefined) {
        throw new CaptureIntakeError(
            "usage: deno task capture:intake <recording.json> --name <slug>",
        );
    }
    writeIntake(source, slug);
}
