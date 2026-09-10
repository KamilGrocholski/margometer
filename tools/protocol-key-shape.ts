/**
 * What a key states about itself over the recordings: how often it occurs, where it sits, and
 * what it carries beside itself.
 *
 *     deno task game:shape
 *
 * The `_Shape:_` line in `docs/protocol-keys.md` is this measurement written down, and
 * `tests/tools/protocol-key-shape.test.ts` holds the register to it, both ways round.
 */

import { assert } from "@std/assert";
import {
    composeIntegerText,
    getDecimalFromText,
    getIntegerFromText,
    isIntegerText,
} from "@/libs/number-text.ts";
import { ANNOUNCEMENT_KEYS, isDamageKey, NAMED_DAMAGE_KEY } from "@/src/core/fight-decoder.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { composeReplayedMaterial } from "@/tools/fight-replay.ts";
import { ProtocolKeyShapeError } from "@/tools/margometer-tool-error.ts";
import { readRecordingPaths } from "@/project/repository-layout.ts";

/**
 * Where every occurrence of a key sits. Strongest first, which is the order a claim is picked in:
 * one phrase has to hold for **all** of them, so the strongest that still does is the true one
 * and `anywhere` is the floor for a key that fits none of the four.
 *
 * The chain is why the last two are different claims. A blow's damage is the `?dmg*` family and
 * the `thirdatt` pair; `+oth_dmg` is damage a message reports without a blow of its own carrying
 * it, so every message on a blow reports damage and not the other way round.
 */
export type KeyPlacement =
    | "alone in its message"
    | "on a skill announcement"
    | "on a blow"
    | "on a message reporting damage"
    | "anywhere";

/** What the key states beside itself, read through `libs/number-text.ts` rather than by eye. */
export type KeyValue = "no value" | "a whole number" | "a number" | "text";

/** One key, as the recordings state it. The three claims the register writes on one line. */
export interface KeyShape {
    key: string;
    occurrences: number;
    placement: KeyPlacement;
    value: KeyValue;
}

/**
 * One `### \`key\`` heading in the register, and the claim under it. A `null` shape is an entry
 * stating no `_Shape:_` line, which the document allows only for a key the recordings do not
 * carry — a claim of its own, and one the guard re-earns.
 */
export interface RegisteredKey {
    key: string;
    line: number;
    shape: KeyShape | null;
}

export const REGISTER_PATH = "docs/protocol-keys.md";
/**
 * The family entry, which is the one heading naming no key. The client has no case labels for
 * `?dmg*` and the register mirrors that rather than listing thirteen entries, so a carried key
 * the family rule reaches is documented by this heading and needs none of its own.
 */
export const DAMAGE_FAMILY_HEADING = "?dmg*";

const PLACEMENTS_STRONGEST_FIRST: readonly KeyPlacement[] = [
    "alone in its message",
    "on a skill announcement",
    "on a blow",
    "on a message reporting damage",
    "anywhere",
];

const VALUE_KINDS: readonly KeyValue[] = ["no value", "a whole number", "a number", "text"];

const HEADING_OPENER = "### ";
const BACKTICK = "`";
const SHAPE_MARKER = "_Shape:_";
const OCCURRENCE_WORD = "occurrences";
const CLAIM_SEPARATOR = ";";
const CLAIMS_PER_LINE = 3;
/** Past the 110 the corpus carries, 2026-09-10, and past what a protocol change would add. */
const MAXIMUM_KEYS = 4096;
const KEY_COLUMN = 26;
const PLACEMENT_COLUMN = 30;
const VALUE_COLUMN = 15;
const COUNT_WIDTH = 7;

/** What a key has been seen doing so far: narrowed by every occurrence, never widened. */
interface ShapeTally {
    occurrences: number;
    placements: Set<KeyPlacement>;
    values: Set<KeyValue>;
}

/** Every placement that holds for one message, judged on the keys the whole message carries. */
function composePlacementsOfMessage(carried: ReadonlySet<string>, key: string): Set<KeyPlacement> {
    assert(key.length > 0, "a placement is asked about a key the message wrote");
    assert(carried.has(key), "and about one the message it was read off carries");
    const holding = new Set<KeyPlacement>(["anywhere"]);
    if (carried.size === 1) holding.add("alone in its message");
    if (ANNOUNCEMENT_KEYS.some((one) => carried.has(one))) holding.add("on a skill announcement");
    const isOnBlow = [...carried].some((one) => isDamageKey(one));
    if (isOnBlow) {
        holding.add("on a blow");
        holding.add("on a message reporting damage");
    }
    if (carried.has(NAMED_DAMAGE_KEY)) holding.add("on a message reporting damage");
    assert(holding.has("anywhere"), "the floor holds for every message there is");
    return holding;
}

/** The most specific of the four one occurrence states. `null` is no value, never empty text. */
function getValueOfOccurrence(value: string | null): KeyValue {
    if (value === null) return "no value";
    assert(typeof value === "string", "an occurrence states its value as the text it was written");
    if (isIntegerText(value)) return "a whole number";
    if (getDecimalFromText(value) !== null) return "a number";
    return "text";
}

/**
 * The one phrase holding for every occurrence. A whole number is a number, so a key stating both
 * is `a number`; a key stating no value on one occurrence and something on another is a shape
 * this vocabulary cannot say, and is refused rather than filed under the nearest word (**E7**).
 */
function getValueFromTally(key: string, values: ReadonlySet<KeyValue>): KeyValue {
    assert(key.length > 0, "a claim is made about a key");
    assert(values.size > 0, "and about a key something was seen of");
    if (values.size === 1) {
        const only = [...values][0];
        assert(only !== undefined, "a set of one holds one");
        return only;
    }
    if (values.has("no value")) {
        throw new ProtocolKeyShapeError(`${key} states a value on some occurrences and not others`);
    }
    if (values.has("text")) return "text";
    return "a number";
}

/** The strongest phrase still standing, which is what the register writes. */
function getPlacementFromTally(key: string, holding: ReadonlySet<KeyPlacement>): KeyPlacement {
    assert(key.length > 0, "a claim is made about a key");
    assert(holding.has("anywhere"), "and the floor is never narrowed away");
    for (const placement of PLACEMENTS_STRONGEST_FIRST) {
        if (holding.has(placement)) return placement;
    }
    throw new ProtocolKeyShapeError(`${key} sits nowhere the vocabulary can name`);
}

function addMessageToTally(tally: Map<string, ShapeTally>, message: string): void {
    assert(message.length > 0, "a message read for its keys says something");
    assert(tally.size <= MAXIMUM_KEYS, "a tally stays inside its stated bound");
    const parameters = parseProtocolMessage(message).parameters;
    const carried = new Set(parameters.map((one) => one.key));
    for (const parameter of parameters) {
        const holding = composePlacementsOfMessage(carried, parameter.key);
        const value = getValueOfOccurrence(parameter.value);
        const held = tally.get(parameter.key);
        if (held === undefined) {
            tally.set(parameter.key, {
                occurrences: 1,
                placements: holding,
                values: new Set([value]),
            });
            continue;
        }
        held.occurrences += 1;
        held.values.add(value);
        for (const placement of [...held.placements]) {
            if (holding.has(placement)) continue;
            held.placements.delete(placement);
        }
    }
}

/** Ascending by key, so two runs over the same material read alike and a diff is a change. */
function getShapeOrder(one: KeyShape, other: KeyShape): number {
    assert(one.key.length > 0, "a shape is kept under a key");
    assert(other.key.length > 0, "and compared against another kept under one");
    if (one.key < other.key) return -1;
    if (one.key > other.key) return 1;
    return 0;
}

/**
 * Every key the recordings carry, and the three claims each earns. Read off the message stream
 * the session saw rather than off the files directly, so this tool and the panel cannot disagree
 * about what a fight carried.
 */
export function composeKeyShapes(paths: readonly string[]): KeyShape[] {
    assert(paths.length > 0, "a measurement is taken over something");
    const tally = new Map<string, ShapeTally>();
    for (const replay of composeReplayedMaterial(paths).replays) {
        for (const messages of replay.reading.messagesByPayload) {
            for (const message of messages) addMessageToTally(tally, message);
        }
    }
    assert(tally.size <= MAXIMUM_KEYS, "a tally stays inside its stated bound");
    const shapes: KeyShape[] = [];
    for (const [key, held] of tally) {
        shapes.push({
            key,
            occurrences: held.occurrences,
            placement: getPlacementFromTally(key, held.placements),
            value: getValueFromTally(key, held.values),
        });
    }
    assert(shapes.every((one) => one.occurrences > 0), "a key measured was seen at least once");
    return shapes.sort(getShapeOrder);
}

/** The key a `### ` heading names, or null where the line is not one. Walked, never matched. */
function getHeadingKey(line: string): string | null {
    assert(typeof line === "string", "a line read for a heading is text");
    assert(HEADING_OPENER.length > 0, "and a heading opens with something");
    if (!line.startsWith(HEADING_OPENER)) return null;
    const rest = line.slice(HEADING_OPENER.length);
    if (!rest.startsWith(BACKTICK)) return null;
    const close = rest.indexOf(BACKTICK, 1);
    if (close === -1) return null;
    const key = rest.slice(1, close);
    if (key.length === 0) return null;
    return key;
}

/**
 * The three claims one `_Shape:_` line makes, or null where the line is not one. A line inside
 * the vocabulary section states the same claims with a different marker and is deliberately not
 * read: what a reader must not flag is half of what proves it.
 */
function composeShapeOfLine(key: string, line: string): KeyShape | null {
    assert(key.length > 0, "a claim read off a line belongs to a key");
    assert(SHAPE_MARKER.length > 0, "and a claim opens with a marker");
    if (!line.startsWith(SHAPE_MARKER)) return null;
    const claims = line.slice(SHAPE_MARKER.length).split(CLAIM_SEPARATOR).map((one) => one.trim());
    if (claims.length !== CLAIMS_PER_LINE) {
        throw new ProtocolKeyShapeError(`${key} states ${claims.length} claims, not three`);
    }
    const [counted, placement, value] = claims;
    assert(counted !== undefined, "a line split in three has a first claim");
    return {
        key,
        occurrences: readOccurrences(key, counted),
        placement: readPlacement(key, placement ?? ""),
        value: readValue(key, value ?? ""),
    };
}

/** `398 occurrences`, and a refusal for anything else — a count read wrong is a claim moved. */
function readOccurrences(key: string, claim: string): number {
    assert(key.length > 0, "a count is read for a key");
    assert(OCCURRENCE_WORD.length > 0, "and states the word it counts in");
    const ending = ` ${OCCURRENCE_WORD}`;
    if (!claim.endsWith(ending)) {
        throw new ProtocolKeyShapeError(`${key} counts in a word this reader does not know`);
    }
    const counted = claim.slice(0, claim.length - ending.length);
    const occurrences = getIntegerFromText(counted);
    if (occurrences === null) {
        throw new ProtocolKeyShapeError(`${key} states "${counted}" where a count goes`);
    }
    assert(Number.isSafeInteger(occurrences), "a count read off digits is whole");
    return occurrences;
}

/** A phrase outside the list is refused rather than read as silence, which is the header's rule. */
function readPlacement(key: string, claim: string): KeyPlacement {
    assert(key.length > 0, "a placement is read for a key");
    assert(PLACEMENTS_STRONGEST_FIRST.length > 0, "and against a vocabulary that says something");
    const found = PLACEMENTS_STRONGEST_FIRST.find((one) => one === claim);
    if (found === undefined) {
        throw new ProtocolKeyShapeError(`${key} sits "${claim}", which is not one of the five`);
    }
    return found;
}

function readValue(key: string, claim: string): KeyValue {
    assert(key.length > 0, "a value kind is read for a key");
    assert(VALUE_KINDS.length > 0, "and against a vocabulary that says something");
    const found = VALUE_KINDS.find((one) => one === claim);
    if (found === undefined) {
        throw new ProtocolKeyShapeError(`${key} carries "${claim}", which is not one of the four`);
    }
    return found;
}

/**
 * Every entry the register opens, with the claim under it. The `_Shape:_` line is taken from the
 * entry it stands in and never from the next one, so an entry that omits it reads as an omission
 * rather than as a borrowed claim from the heading below.
 */
export function getRegisteredKeys(text: string): RegisteredKey[] {
    assert(text.length > 0, "a register read for its entries says something");
    assert(text.length <= Number.MAX_SAFE_INTEGER, "and is a document rather than a stream");
    const entries: RegisteredKey[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        const key = getHeadingKey(line);
        if (key !== null) {
            entries.push({ key, line: offset + 1, shape: null });
            continue;
        }
        const open = entries.at(-1);
        if (open === undefined) continue;
        if (open.shape !== null) continue;
        open.shape = composeShapeOfLine(open.key, line);
    }
    assert(entries.length <= MAXIMUM_KEYS, "a register states no more entries than the bound");
    assert(entries.every((one) => one.line > 0), "and every entry knows which line it opened on");
    return entries;
}

/** The line the register writes, composed from a measurement so nobody types one by hand. */
export function composeShapeLine(shape: KeyShape): string {
    assert(shape.key.length > 0, "a line is written for a key");
    assert(shape.occurrences > 0, "and about a key something was seen of");
    const counted = composeIntegerText(shape.occurrences);
    return `${SHAPE_MARKER} ${counted} ${OCCURRENCE_WORD}; ${shape.placement}; ${shape.value}`;
}

function writeShapeReport(shapes: readonly KeyShape[], material: string): void {
    const entries = getRegisteredKeys(Deno.readTextFileSync(REGISTER_PATH));
    const registered = new Map(entries.map((one) => [one.key, one.shape]));
    const named = new Set(entries.map((one) => one.key));
    console.log(`what a key states about itself, over ${material}\n`);
    console.log(
        `${"key".padEnd(KEY_COLUMN)} ${"occurs".padStart(COUNT_WIDTH)}` +
            ` ${"where".padEnd(PLACEMENT_COLUMN)} ${"carries".padEnd(VALUE_COLUMN)} register`,
    );
    let disagreed = 0;
    for (const shape of shapes) {
        const said = registered.get(shape.key);
        const isFamily = isDocumentedByFamily(shape.key, named);
        const doesAgree = isFamily || (said !== undefined && said !== null &&
            said.occurrences === shape.occurrences && said.placement === shape.placement &&
            said.value === shape.value);
        if (!doesAgree) disagreed += 1;
        console.log(
            `${shape.key.padEnd(KEY_COLUMN)} ${
                composeIntegerText(shape.occurrences).padStart(COUNT_WIDTH)
            }` +
                ` ${shape.placement.padEnd(PLACEMENT_COLUMN)} ${shape.value.padEnd(VALUE_COLUMN)}` +
                ` ${
                    isFamily
                        ? `— ${DAMAGE_FAMILY_HEADING}`
                        : composeRegisterNote(said, doesAgree)
                }`,
        );
    }
    console.log(
        `\n${composeIntegerText(disagreed)} of ${
            composeIntegerText(shapes.length)
        } disagree with ${REGISTER_PATH}`,
    );
    assert(material.length > 0, "a report names the material it was taken over");
    assert(disagreed <= shapes.length, "and counts no more disagreements than rows");
}

/**
 * A carried key the family entry documents rather than one of its own. The client has no case
 * label for these, so the register mirrors that with `?dmg*` — the `thirdatt` pair is the family
 * rule's one exception and does carry an entry, which is why this asks the register and not only
 * the rule.
 */
export function isDocumentedByFamily(key: string, registered: ReadonlySet<string>): boolean {
    assert(key.length > 0, "a key is asked about by name");
    assert(registered.has(DAMAGE_FAMILY_HEADING), "and against a register that opens the family");
    if (registered.has(key)) return false;
    return isDamageKey(key);
}

/** What the register says where it does not agree — the whole line, so a fix is one paste. */
function composeRegisterNote(said: KeyShape | null | undefined, doesAgree: boolean): string {
    if (doesAgree) return "";
    if (said === undefined) return "— no entry";
    if (said === null) return "— entry states no shape";
    assert(said.key.length > 0, "a claim that disagrees is still a claim about a key");
    assert(said.occurrences >= 0, "and still counts something");
    return `— states ${composeIntegerText(said.occurrences)}; ${said.placement}; ${said.value}`;
}

if (import.meta.main) {
    const paths = readRecordingPaths();
    const material = `${composeIntegerText(paths.length)} recordings in captures/`;
    writeShapeReport(composeKeyShapes(paths), material);
}
