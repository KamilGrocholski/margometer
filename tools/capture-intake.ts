/**
 * How a recording from the add-on becomes material in this repository.
 *
 *     deno run -A tools/capture-intake.ts <recording.json> --name <slug>
 *
 * The add-on writes what the game sent, unredacted, to a file that never leaves the machine it
 * was made on. This is the other end: two redactions, then a file in `captures/`.
 *
 * ⚠️ **Neither redaction is complete, and no test can make one so.** Each knows one place — names
 * tied to a combatant id, and `ladunek.skills`. A nickname belonging to nobody in the roster walks
 * through untouched, which is why this ends by naming the step that is a person's.
 */

import { assert } from "@std/assert";
import { composeJsonText, getValueFromJsonText, isRecord } from "@/src/core/unknown-reading.ts";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";
import { CAPTURE_FIELDS } from "@/src/game/fight-capture.ts";
import { WARRIOR_FIELDS } from "@/src/game/engine-warrior.ts";
import { CaptureIntakeError } from "@/tools/margometer-tool-error.ts";

const CAPTURES_DIRECTORY = "captures";
/** Written by this tool and by nothing else, which is why they are spelled here. */
const SUBSTITUTED_COUNT = "pseudonimow";
const REMOVED_COUNT = "opisow";
/** The payload's ability list. Nothing in `src/` reads it, so this is where it is spelled. */
const ABILITIES_KEY = "skills";
const INDENT_SPACES = 2;
/** The largest recording in `captures/` holds 55,095 values, measured 2026-08-29. */
const MAXIMUM_VALUES = 4194304;
/** A fight holds twenty and every one of them is named at most a handful of times. */
const MAXIMUM_NAMES = 4096;

/**
 * What replaces an ability description. Visible on purpose: a blank would read as "the game sent
 * nothing here", and a recording that lies about what the server said is worse than one with a
 * gap that says so.
 */
export const REMOVED_DESCRIPTION = "(description from the game — removed, NOTICE.md)";

/**
 * Every marker meaning "a description already came out here".
 *
 * ⚠️ **The second is Polish, and it is not a slip.** It is what an older tool wrote, and it sits
 * in `captures/2026-08-06-tempest-grupa-vs-hildur.json`. Knowing only the current marker would
 * make this remove that one as if it were the game's prose — reporting descriptions taken out of
 * a file that has none left, and rewriting evidence to match today's spelling.
 */
const REMOVED_DESCRIPTIONS: readonly string[] = [
    REMOVED_DESCRIPTION,
    "(opis z gry — zdjęty, NOTICE.md)",
];

/**
 * Fields of one ability inside `ladunek.skills`, and which of them is the prose.
 *
 * ⚠️ **A claim about the game**, measured on the recording of 2026-08-06 (world `tempest`, build
 * `1785244275300`): the array holds 70 fields for 7 abilities, and within a group come id, name,
 * two numbers, one more, the description, requirements, progress, parameters and an empty.
 */
const FIELDS_PER_ABILITY = 10;
const DESCRIPTION_FIELD = 5;

export interface Pseudonymisation {
    recording: unknown;
    /** How many occurrences were replaced. Zero means there was nothing left to do. */
    changed: number;
    /** Which name became which label. Goes to the screen and nowhere else. */
    substitutions: Map<string, string>;
}

function getCallsFromRecording(recording: unknown): Record<string, unknown>[] {
    if (!isRecord(recording)) return [];
    const stated = recording[CAPTURE_FIELDS.calls];
    if (!Array.isArray(stated)) return [];
    const calls: Record<string, unknown>[] = [];
    for (const call of stated) {
        if (!isRecord(call)) continue;
        calls.push(call);
    }
    assert(calls.length <= stated.length, "a call is read once");
    return calls;
}

function getIdentityFromValue(value: unknown): number | null {
    if (typeof value === "number") return Number.isInteger(value) ? value : null;
    if (typeof value !== "string") return null;
    assert(value.length >= 0, "an id stated as text is text");
    const read = getIntegerFromText(value);
    assert(read === null || Number.isInteger(read), "and reads back as a whole number or nothing");
    return read;
}

/** Who is a person, and every name each combatant was seen under, over the whole recording. */
interface Roll {
    isPlayerById: Map<number, boolean>;
    /**
     * ⚠️ **A set of names per id, not one name.** Keeping only the last would let a nickname from
     * an earlier snapshot of the same combatant walk through untouched, unnoticed.
     */
    namesById: Map<number, Set<string>>;
}

function setNameOnRoll(roll: Roll, id: number, name: unknown): void {
    assert(Number.isInteger(id), "a name is put against an id");
    if (typeof name !== "string") return;
    if (name.length === 0) return;
    const known = roll.namesById.get(id) ?? new Set<string>();
    known.add(name);
    assert(known.size <= MAXIMUM_NAMES, "a combatant stays inside the names one may be seen under");
    roll.namesById.set(id, known);
}

/** `npc` rides only in `ladunek.w`, so that is the only place who is a person can be read. */
function addPayloadToRoll(roll: Roll, call: Record<string, unknown>): void {
    assert(WARRIOR_FIELDS.nonPlayer.length > 0, "who is a person is read by a name of the game's");
    assert(CAPTURE_FIELDS.payload.length > 0, "out of the payload, which is asked for by one too");
    const payload = call[CAPTURE_FIELDS.payload];
    if (!isRecord(payload)) return;
    const warriors = payload[WARRIOR_FIELDS.warriors];
    if (!isRecord(warriors)) return;
    for (const [key, stated] of Object.entries(warriors)) {
        if (!isRecord(stated)) continue;
        const id = getIdentityFromValue(stated[WARRIOR_FIELDS.identity]) ??
            getIdentityFromValue(key);
        if (id === null) continue;
        const nonPlayer = getIdentityFromValue(stated[WARRIOR_FIELDS.nonPlayer]);
        if (nonPlayer !== null) roll.isPlayerById.set(id, nonPlayer === 0);
        setNameOnRoll(roll, id, stated[WARRIOR_FIELDS.name]);
    }
}

function addSnapshotsToRoll(roll: Roll, call: Record<string, unknown>): void {
    const sides = [call[CAPTURE_FIELDS.combatantsBefore], call[CAPTURE_FIELDS.combatantsAfter]];
    assert(sides.length === 2, "a call carries a snapshot on either side of it");
    for (const side of sides) {
        if (!Array.isArray(side)) continue;
        for (const stated of side) {
            if (!isRecord(stated)) continue;
            const id = getIdentityFromValue(stated[WARRIOR_FIELDS.identity]);
            if (id === null) continue;
            setNameOnRoll(roll, id, stated[WARRIOR_FIELDS.name]);
        }
    }
}

function composeRoll(recording: unknown): Roll {
    const roll: Roll = { isPlayerById: new Map(), namesById: new Map() };
    for (const call of getCallsFromRecording(recording)) {
        addPayloadToRoll(roll, call);
        addSnapshotsToRoll(roll, call);
    }
    assert(
        roll.isPlayerById.size <= roll.namesById.size + roll.isPlayerById.size,
        "a roll is read",
    );
    return roll;
}

/**
 * ⚠️ **Guessing is not on the table.** "A negative id is a monster" is a claim about the game that
 * nobody measured, and it is wrong in both directions at once: guess one way and the material is
 * corrupted, guess the other and a nickname enters the repository.
 */
function requireEveryCombatantDecided(roll: Roll): void {
    // Numeric, not the default lexicographic sort: these are ids, and `-161518` sorting between
    // `-1` and `-2` would order them by their spelling.
    const undecided = [...roll.namesById.keys()]
        .filter((id) => !roll.isPlayerById.has(id))
        .sort((one, other) => one - other);
    assert(undecided.length <= roll.namesById.size, "an id is undecided once");
    if (undecided.length === 0) return;
    throw new CaptureIntakeError(
        `cannot tell whether combatant ${undecided.join(", ")} is a player or a monster — ` +
            "`npc` rides only in `ladunek.w` and those ids are not there",
    );
}

function composeSubstitutions(roll: Roll): Map<string, string> {
    assert(roll.isPlayerById.size >= 0, "a roll states who is a person, however few");
    const substitutions = new Map<string, string>();
    const players = [...roll.namesById.keys()]
        .filter((id) => roll.isPlayerById.get(id) === true)
        .sort((one, other) => one - other);
    assert(players.length <= roll.namesById.size, "a player is numbered once");
    for (const [order, id] of players.entries()) {
        // A digit rather than a letter: `Gracz A`…`Gracz G` mean fixed people throughout this
        // repository's prose (`NOTICE.md`), while a label here is local to one file.
        const label = `Gracz ${order + 1}`;
        for (const name of roll.namesById.get(id) ?? []) {
            const standing = substitutions.get(name);
            if (standing !== undefined && standing !== label) {
                throw new CaptureIntakeError(
                    `two players share the name \`${name}\` — a text substitution cannot ` +
                        "separate them, because a message carries only the text",
                );
            }
            substitutions.set(name, label);
        }
    }
    return substitutions;
}

/**
 * Longest name first, so a nickname that is a substring of another is not mutilated by it, and a
 * label that is also somebody's name refuses outright: a sequential substitution over those is a
 * permutation, and one of those eats itself. That cannot happen in a file from the add-on; it can
 * in one edited by hand.
 */
function composeSubstitutionOrder(substitutions: Map<string, string>): [string, string][] {
    const pairs = [...substitutions]
        .filter(([name, label]) => name !== label)
        .sort((one, other) => other[0].length - one[0].length);
    const labels = new Set(pairs.map(([, label]) => label));
    const collision = pairs.find(([name]) => labels.has(name));
    assert(pairs.length <= substitutions.size, "a name is substituted once");
    if (collision === undefined) return pairs;
    throw new CaptureIntakeError(
        `the name \`${collision[0]}\` is also a replacement label — the file looks hand-edited`,
    );
}

/** One value to map, and where it goes. A worklist, because **S1** forbids recursion. */
interface MappingTask {
    value: unknown;
    hold(mapped: unknown): void;
}

/**
 * Every string in the document, mapped. Object **keys** are left alone: they are ids, and their
 * order is kept because a recording is read by people.
 */
function composeMappedValue(root: unknown, composeText: (text: string) => string): unknown {
    let mapped: unknown = null;
    const pending: MappingTask[] = [{ value: root, hold: (one) => void (mapped = one) }];
    let steps = 0;
    while (pending.length > 0) {
        const task = pending.pop();
        if (task === undefined) break;
        steps += 1;
        assert(steps <= MAXIMUM_VALUES, "the walk stays inside its stated bound");
        const value = task.value;
        if (typeof value === "string") {
            task.hold(composeText(value));
            continue;
        }
        if (Array.isArray(value)) {
            const held: unknown[] = value.map(() => null);
            task.hold(held);
            for (const [at, one] of value.entries()) {
                pending.push({ value: one, hold: (done) => void (held[at] = done) });
            }
            continue;
        }
        if (!isRecord(value)) {
            task.hold(value);
            continue;
        }
        const held: Record<string, unknown> = {};
        // The keys first and in order, so the mapped record reads the way the original did.
        for (const key of Object.keys(value)) held[key] = null;
        task.hold(held);
        for (const [key, one] of Object.entries(value)) {
            pending.push({ value: one, hold: (done) => void (held[key] = done) });
        }
    }
    assert(steps > 0, "a document with something in it took at least one step");
    return mapped;
}

/**
 * The recording with every player's name replaced by `Gracz 1`, `Gracz 2`, …
 *
 * **Pseudonymisation, not anonymisation.** Ids stay: they are what the protocol identifies
 * combatants by and what the health witness stands on. What goes is what identifies a person to
 * somebody reading GitHub.
 */
export function composePseudonymisedRecording(recording: unknown): Pseudonymisation {
    const roll = composeRoll(recording);
    requireEveryCombatantDecided(roll);
    const substitutions = composeSubstitutions(roll);
    const pairs = composeSubstitutionOrder(substitutions);
    let changed = 0;
    const composeSubstitutedText = (text: string): string => {
        let result = text;
        for (const [name, label] of pairs) {
            const found = result.split(name).length - 1;
            if (found === 0) continue;
            changed += found;
            result = result.split(name).join(label);
        }
        return result;
    };
    const mapped = composeMappedValue(recording, composeSubstitutedText);
    assert(changed >= 0, "what was substituted is never fewer than nothing");
    return { recording: mapped, changed, substitutions };
}

export interface DescriptionRemoval {
    recording: unknown;
    removed: number;
}

/**
 * The recording without the ability descriptions the game wrote. **Licensing, not caution**:
 * `ladunek.skills` carries whole sentences by the game's authors, which have no business in a
 * public MIT repository. The ability's id, name, requirements, progress and parameters stay —
 * functional names, not prose.
 *
 * **An unfamiliar shape stops the write.** Groups of ten is a claim about the game, so an array
 * that does not divide by ten is a layout this does not understand, and cutting field 5 out of
 * some other one removes the wrong thing.
 */
export function removeSkillDescriptions(recording: unknown): DescriptionRemoval {
    let removed = 0;
    for (const call of getCallsFromRecording(recording)) {
        const payload = call[CAPTURE_FIELDS.payload];
        if (!isRecord(payload)) continue;
        const abilities = payload[ABILITIES_KEY];
        if (!Array.isArray(abilities)) continue;
        if (abilities.length % FIELDS_PER_ABILITY !== 0) {
            throw new CaptureIntakeError(
                `\`${CAPTURE_FIELDS.payload}.${ABILITIES_KEY}\` holds ` +
                    `${abilities.length} fields, which is not a whole number of groups of ` +
                    `${FIELDS_PER_ABILITY} — the layout this was measured against changed`,
            );
        }
        assert(abilities.length >= 0, "an ability list has a length");
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

export interface Intake {
    text: string;
    changed: number;
    removed: number;
    substitutions: Map<string, string>;
}

/**
 * What a recording already says has been redacted, for the counts this run adds to.
 *
 * ⚠️ **Absent and unreadable are different, and only one of them is zero.** A first intake carries
 * no such count. A count stored as text, as a fraction, as anything a reader refuses is a
 * recording this does not understand — and reading it as zero would write that back **onto the
 * evidence**, stating that an earlier redaction had substituted nothing.
 */
function getCarriedCount(envelope: Record<string, unknown>, field: string): number {
    const carried = envelope[field];
    if (carried === undefined) return 0;
    const count = typeof carried === "number" && Number.isInteger(carried) ? carried : null;
    assert(count === null || Number.isInteger(count), "a count that was read is a whole number");
    if (count !== null && count >= 0) return count;
    throw new CaptureIntakeError(
        `the recording states \`${field}\` as something this cannot read as a count, so what an ` +
            "earlier redaction did is unknown — a fresh count would state that nothing was done",
    );
}

/**
 * Both redactions, in the order that matters. Nicknames first: any other order leaves a step where
 * a real nickname is still in the data "only for a moment", and a moment is enough for whatever
 * runs next to write it somewhere. Counts are summed rather than overwritten.
 */
export function composeIntake(recording: unknown): Intake {
    const named = composePseudonymisedRecording(recording);
    const described = removeSkillDescriptions(named.recording);
    if (!isRecord(described.recording)) {
        throw new CaptureIntakeError("the recording is not an object");
    }
    const written = {
        ...described.recording,
        [SUBSTITUTED_COUNT]: getCarriedCount(described.recording, SUBSTITUTED_COUNT) +
            named.changed,
        [REMOVED_COUNT]: getCarriedCount(described.recording, REMOVED_COUNT) + described.removed,
    };
    const text = composeJsonText(written, INDENT_SPACES);
    if (text === null) {
        throw new CaptureIntakeError("the redacted recording would not be written as text");
    }
    assert(text.length > 0, "and what was written says something");
    return {
        text: `${text}\n`,
        changed: named.changed,
        removed: described.removed,
        substitutions: named.substitutions,
    };
}

/** Lower-case letters, digits and single dashes, with a dash at neither end. Walked — **C7**. */
export function isSlugText(text: string): boolean {
    assert(text.length >= 0, "a slug offered is text");
    if (text.length === 0) return false;
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
    assert(!wasDash, "a slug never ends on a dash");
    return true;
}

/** The day part of a stated moment, walked rather than parsed: `YYYY-MM-DD` and nothing else. */
function getDayFromMoment(text: string): string | null {
    const DAY_LENGTH = 10;
    if (text.length < DAY_LENGTH) return null;
    const day = text.slice(0, DAY_LENGTH);
    assert(day.length === DAY_LENGTH, "a day taken off the front is that long");
    const shape = "dddd-dd-dd";
    assert(shape.length === DAY_LENGTH, "a day is written to one length");
    for (const [at, wanted] of [...shape].entries()) {
        const character = day.charAt(at);
        if (wanted === "-" && character !== "-") return null;
        if (wanted === "d" && (character < "0" || character > "9")) return null;
    }
    return day;
}

/** The day it was recorded, the world it came from, and what a person called it. */
export function composeIntakePath(recording: unknown, slug: string): string {
    const envelope = isRecord(recording) ? recording : {};
    const capturedAt = envelope[CAPTURE_FIELDS.capturedAt];
    const day = typeof capturedAt === "string" ? getDayFromMoment(capturedAt) : null;
    if (day === null) {
        throw new CaptureIntakeError(
            `\`${CAPTURE_FIELDS.capturedAt}\` is not a moment — the recording says nothing of when`,
        );
    }
    const world = envelope[CAPTURE_FIELDS.world];
    if (typeof world !== "string" || world.length === 0) {
        throw new CaptureIntakeError(
            `\`${CAPTURE_FIELDS.world}\` is missing — the recording says nothing of where`,
        );
    }
    if (!isSlugText(slug)) {
        throw new CaptureIntakeError(`\`--name ${slug}\` is not a kebab-case slug`);
    }
    assert(day.length === 10, "a path is named for one day");
    return `${CAPTURES_DIRECTORY}/${day}-${world}-${slug}.json`;
}

function isPathTaken(path: string): boolean {
    assert(path.length > 0, "a path that is looked for is a path");
    assert(path.endsWith(".json"), "and material is written as one kind of file");
    try {
        Deno.statSync(path);
        return true;
    } catch {
        // Anything that is not a file there is a path free to write, which is the answer wanted.
        return false;
    }
}

function writeIntake(source: string, slug: string): void {
    assert(source.length > 0, "a recording is read from somewhere");
    const read = getValueFromJsonText(Deno.readTextFileSync(source));
    if (read === null) {
        throw new CaptureIntakeError(`${source} is not JSON this tool can read`);
    }
    const target = composeIntakePath(read, slug);
    // Material is never overwritten: a recording already here is evidence somebody has written a
    // test against.
    if (isPathTaken(target)) {
        throw new CaptureIntakeError(`${target} already exists — material is not overwritten`);
    }
    const intake = composeIntake(read);
    Deno.writeTextFileSync(target, intake.text);
    console.log(`wrote ${target}`);
    console.log(
        `  ${intake.changed} nickname occurrences substituted, ` +
            `${intake.removed} ability descriptions removed`,
    );
    // To the screen and nowhere else: a dictionary tying a nickname to a label would be worse to
    // keep than the nickname was.
    for (const [name, label] of intake.substitutions) console.log(`  ${name} → ${label}`);
    console.log("");
    console.log("Still yours, and no test closes it: read `txt=`, `shout=` and `loser=` in");
    console.log("`komunikaty` with your eyes. The substitution knows only names tied to a");
    console.log("combatant id, so a nickname belonging to nobody in the roster walks through it.");
}

if (import.meta.main) {
    const [source, flag, slug] = Deno.args;
    if (source === undefined || flag !== "--name" || slug === undefined) {
        console.log("usage: deno run -A tools/capture-intake.ts <recording.json> --name <slug>");
    } else {
        writeIntake(source, slug);
    }
}
