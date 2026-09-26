/**
 * What a key states about itself over the recordings: how often it occurs, where it sits, and what
 * it carries beside itself. The messages are the ones the add-on's chain took out of each payload
 * (`tools/recorded-material.ts`), and which keys a placement stands on is what
 * `src/core/protocol-key.ts` reads them as. The `_Shape:_` line in `docs/protocol-keys.md` is this
 * measurement written down, and `tests/tools/protocol-key-shape.test.ts` holds the two together.
 *
 *     deno task game:shape
 */

import { assert } from "@std/assert";
import { formatInteger, parseDecimal, parseInteger } from "#/libs/number-text.ts";
import { isOneOf, type VocabularyWord } from "#/libs/vocabulary.ts";
import { getKeyReading, KEY_FAMILY, type KeyReading } from "#/src/core/protocol-key.ts";
import { parseProtocolMessage } from "#/src/core/protocol-message.ts";
import { RECORDINGS_DIRECTORY } from "#/tests/recording-sources.ts";
import { BACKTICK, parseBacktickedPhrases, REGISTER_PATH } from "./help-claim-register.ts";
import { ProtocolKeyShapeError } from "./margometer-tool-error.ts";
import {
    readRecordedMaterial,
    type ReplayedFight,
    replayRecordedMaterial,
} from "./recorded-material.ts";

/**
 * Where every occurrence of a key sits, strongest first, which is the order a claim is picked in.
 * The last two are a chain: a blow's damage is the damage family, and `+oth_dmg` is damage a
 * message reports with no blow of its own carrying it.
 */
export const KEY_PLACEMENT = {
    alone: "alone in its message",
    onAnnouncement: "on a skill announcement",
    onBlow: "on a blow",
    onDamage: "on a message reporting damage",
    anywhere: "anywhere",
} as const;
export type KeyPlacement = VocabularyWord<typeof KEY_PLACEMENT>;

/** What the key states beside itself, read through `libs/number-text.ts` rather than by eye. */
export const KEY_VALUE = {
    none: "no value",
    whole: "a whole number",
    number: "a number",
    text: "text",
} as const;
export type KeyValue = VocabularyWord<typeof KEY_VALUE>;

/** One key, as the recordings state it: the three claims the register writes on one line. */
export interface KeyShape {
    key: string;
    occurrences: number;
    placement: KeyPlacement;
    value: KeyValue;
}

/** One `### \`key\`` heading of the register. A `null` shape is an entry stating no `_Shape:_`. */
export interface RegisteredKey {
    key: string;
    line: number;
    verdict: string;
    shape: KeyShape | null;
}

/** A sentence of an entry's prose counting a key's occurrences, and the recordings it names. */
export interface ProseCountClaim {
    key: string;
    /** The line the paragraph opens on, which is where a reader goes to fix the sentence. */
    line: number;
    sentence: string;
    recordings: string[];
}

/** What a key has been seen doing so far: narrowed by every occurrence, never widened. */
interface ShapeTally {
    occurrences: number;
    placements: Set<KeyPlacement>;
    values: Set<KeyValue>;
}

/**
 * The family entry, the one heading naming no key: the client has no case label for the family's
 * members, and the register mirrors that rather than writing an entry per member.
 */
export const DAMAGE_FAMILY_HEADING = "?dmg*";

const KEY_PLACEMENTS = Object.values(KEY_PLACEMENT);
const KEY_VALUES = Object.values(KEY_VALUE);
/** The three families a message announcing a skill is recognised by. */
const ANNOUNCEMENT_FAMILIES: readonly KeyReading["kind"][] = [
    KEY_FAMILY.skillName,
    KEY_FAMILY.customSkillName,
    KEY_FAMILY.skillId,
];
const HEADING_OPENER = "### ";
/** What stands between a heading's key and its verdict. */
const VERDICT_DASH = "—";
/** The sentence in the preamble naming every verdict an entry may carry. */
const VERDICTS_STATED = "**A verdict is one of ";
/** Read over the text with its wrapping taken out: `deno fmt` breaks the sentence over lines. */
const COUNT_RULE_STATED = "**A count of occurrences in prose ";
const BOLD = "**";
const SHAPE_MARKER = "_Shape:_";
const OCCURRENCE_WORD = "occurrences";
/** The stem covering `occurrence` and `occurrences` at once. */
const OCCURRENCE_STEM = "occurrence";
/** Words standing where a figure would: `both` and `single` spell a count without a digit. */
const COUNT_WORDS = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "both",
    "single",
];
/** What a sentence wraps a word in: markdown emphasis, and the punctuation around a clause. */
const WORD_EDGES = "*_`.,;:()[]\"'";
const SENTENCE_END = ". ";
const RECORDING_SUFFIX = ".json";
/** Past the claims the register carries, and past what a document of its size could state. */
const CLAIMS_MAXIMUM = 1024;
const CLAIM_SEPARATOR = ";";
const CLAIMS_PER_LINE = 3;
/** The corpus carries 119 keys, 2026-09-25: this is past what a protocol change would add. */
const KEYS_MAXIMUM = 4096;
const KEY_COLUMN = 26;
const PLACEMENT_COLUMN = 30;
const VALUE_COLUMN = 15;
const COUNT_WIDTH = 7;

/** Every key the recordings carry, and the three claims each earns, in code-unit order of key. */
export function tallyKeyShapes(replayed: readonly ReplayedFight[]): KeyShape[] {
    assert(replayed.length > 0, "a measurement is taken over something");
    const tallies = new Map<string, ShapeTally>();
    for (const { fight, reading } of replayed) {
        for (const messages of reading.messagesByPayload) {
            for (const message of messages) tallyKeyShapesMessage(tallies, fight.path, message);
        }
    }
    const shapes: KeyShape[] = [];
    for (const key of [...tallies.keys()].sort()) {
        const tally = tallies.get(key);
        assert(tally !== undefined, "a key listed off the tallies has one");
        shapes.push({
            key,
            occurrences: tally.occurrences,
            placement: tallyKeyShapesPlacement(key, tally.placements),
            value: tallyKeyShapesValue(key, tally.values),
        });
    }
    assert(shapes.length === tallies.size, "every key tallied is a shape");
    return shapes;
}

function tallyKeyShapesMessage(
    tallies: Map<string, ShapeTally>,
    path: string,
    message: string,
): void {
    assert(tallies.size <= KEYS_MAXIMUM, "a tally stays inside its stated bound");
    const parsed = parseProtocolMessage(message);
    if (parsed instanceof Error) {
        throw new ProtocolKeyShapeError(`${path}: the grammar refused a message, ${parsed.name}`, {
            cause: parsed,
        });
    }
    const parameters = parsed.parameters;
    const placements = tallyKeyShapesMessagePlacements(new Set(parameters.map((one) => one.key)));
    for (const parameter of parameters) {
        const value = tallyKeyShapesMessageValue(parameter.value);
        const tally = tallies.get(parameter.key);
        if (tally === undefined) {
            tallies.set(parameter.key, {
                occurrences: 1,
                placements: new Set(placements),
                values: new Set([value]),
            });
            continue;
        }
        tally.occurrences += 1;
        tally.values.add(value);
        for (const placement of [...tally.placements]) {
            if (!placements.has(placement)) tally.placements.delete(placement);
        }
    }
}

/** Every placement that holds for one message, judged on the keys the whole message carries. */
function tallyKeyShapesMessagePlacements(carried: ReadonlySet<string>): Set<KeyPlacement> {
    assert(carried.size > 0, "a placement is asked of a message carrying a key");
    const families = new Set([...carried].map((key) => getKeyReading(key)?.kind ?? null));
    const placements = new Set<KeyPlacement>([KEY_PLACEMENT.anywhere]);
    if (carried.size === 1) placements.add(KEY_PLACEMENT.alone);
    if (ANNOUNCEMENT_FAMILIES.some((family) => families.has(family))) {
        placements.add(KEY_PLACEMENT.onAnnouncement);
    }
    if (families.has(KEY_FAMILY.damage)) {
        placements.add(KEY_PLACEMENT.onBlow);
        placements.add(KEY_PLACEMENT.onDamage);
    } else if (families.has(KEY_FAMILY.namedDamage)) {
        placements.add(KEY_PLACEMENT.onDamage);
    }
    return placements;
}

/** The most specific of the four one occurrence states. `null` is no value, never empty text. */
function tallyKeyShapesMessageValue(value: string | null): KeyValue {
    if (value === null) return KEY_VALUE.none;
    if (parseInteger(value) !== null) return KEY_VALUE.whole;
    if (parseDecimal(value) !== null) return KEY_VALUE.number;
    return KEY_VALUE.text;
}

/** The strongest phrase still standing, which is what the register writes. */
function tallyKeyShapesPlacement(key: string, placements: ReadonlySet<KeyPlacement>): KeyPlacement {
    assert(placements.has(KEY_PLACEMENT.anywhere), "the floor is never narrowed away");
    const strongest = KEY_PLACEMENTS.find((placement) => placements.has(placement));
    assert(strongest !== undefined, `${key} sits somewhere, if only at the floor`);
    return strongest;
}

/**
 * The one phrase holding for every occurrence. A whole number is a number, so a key stating both
 * is `a number`; a value on some occurrences and none on others is a shape this vocabulary cannot
 * say, and is refused rather than filed under the nearest word.
 */
function tallyKeyShapesValue(key: string, values: ReadonlySet<KeyValue>): KeyValue {
    assert(values.size > 0, "a claim is made about a key something was seen of");
    const [only] = values;
    assert(only !== undefined, "a set holding something has a first member");
    if (values.size === 1) return only;
    if (values.has(KEY_VALUE.none)) {
        throw new ProtocolKeyShapeError(`${key} states a value on some occurrences and not others`);
    }
    return values.has(KEY_VALUE.text) ? KEY_VALUE.text : KEY_VALUE.number;
}

/**
 * Every entry the register opens, with the claim under it. The `_Shape:_` line is taken from the
 * entry it stands in and never from the next one, so an omission reads as one.
 */
export function parseRegisteredKeys(text: string): RegisteredKey[] {
    assert(text.length > 0, "a register read for its entries says something");
    const entries: RegisteredKey[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        const heading = parseRegisterHeading(line, offset + 1);
        if (heading !== null) {
            entries.push(heading);
            continue;
        }
        const open = entries.at(-1);
        if (open === undefined) continue;
        if (open.shape !== null) continue;
        open.shape = parseShapeLine(open.key, line);
    }
    assert(entries.length <= KEYS_MAXIMUM, "a register states no more entries than the bound");
    return entries;
}

/**
 * The key and verdict a `### ` heading states, or null where the line is not one. The verdict
 * keeps every word after the dash: `not a battle key` is four of them.
 */
function parseRegisterHeading(line: string, at: number): RegisteredKey | null {
    assert(at > 0, "a line number is one-based");
    if (!line.startsWith(HEADING_OPENER)) return null;
    const rest = line.slice(HEADING_OPENER.length);
    if (!rest.startsWith(BACKTICK)) return null;
    const close = rest.indexOf(BACKTICK, BACKTICK.length);
    if (close === -1) return null;
    const key = rest.slice(BACKTICK.length, close);
    if (key.length === 0) return null;
    const verdict = rest.slice(close + BACKTICK.length).split(VERDICT_DASH).join("").trim();
    return { key, line: at, verdict, shape: null };
}

/**
 * The three claims one `_Shape:_` line makes, or null where the line is not one. The vocabulary
 * section writes the same claims under a bold marker, and is deliberately not read.
 */
function parseShapeLine(key: string, line: string): KeyShape | null {
    assert(key.length > 0, "a claim read off a line belongs to a key");
    if (!line.startsWith(SHAPE_MARKER)) return null;
    const claims = line.slice(SHAPE_MARKER.length).split(CLAIM_SEPARATOR).map((one) => one.trim());
    if (claims.length !== CLAIMS_PER_LINE) {
        throw new ProtocolKeyShapeError(`${key} states ${claims.length} claims, not three`);
    }
    const [counted, placement, value] = claims;
    assert(counted !== undefined, "a line split in three has a first claim");
    assert(placement !== undefined, "and a second");
    assert(value !== undefined, "and a third");
    return {
        key,
        occurrences: parseShapeLineOccurrences(key, counted),
        placement: parseShapeLinePlacement(key, placement),
        value: parseShapeLineValue(key, value),
    };
}

/** `398 occurrences`, and a refusal for anything else: a count read wrong is a claim moved. */
function parseShapeLineOccurrences(key: string, claim: string): number {
    const ending = ` ${OCCURRENCE_WORD}`;
    if (!claim.endsWith(ending)) {
        throw new ProtocolKeyShapeError(`${key} counts in a word this reader does not know`);
    }
    const counted = claim.slice(0, claim.length - ending.length);
    const occurrences = parseInteger(counted);
    if (occurrences === null) {
        throw new ProtocolKeyShapeError(`${key} states "${counted}" where a count goes`);
    }
    assert(Number.isSafeInteger(occurrences), "a count read off digits is whole");
    return occurrences;
}

/** A phrase outside the list is refused rather than read as silence. */
function parseShapeLinePlacement(key: string, claim: string): KeyPlacement {
    if (!isOneOf(KEY_PLACEMENTS, claim)) {
        throw new ProtocolKeyShapeError(`${key} sits "${claim}", which is not one of the five`);
    }
    assert(claim.length > 0, "a placement read is one of the phrases");
    return claim;
}

function parseShapeLineValue(key: string, claim: string): KeyValue {
    if (!isOneOf(KEY_VALUES, claim)) {
        throw new ProtocolKeyShapeError(`${key} carries "${claim}", which is not one of the four`);
    }
    assert(claim.length > 0, "a value kind read is one of the phrases");
    return claim;
}

/**
 * The verdicts the register says it uses, read off the one sentence that states them rather than
 * spelled a second time here (**C15**): a verdict the document stops naming stops being legal.
 */
export function parseStatedVerdicts(text: string): string[] {
    assert(text.length > 0, "a register read for its vocabulary says something");
    for (const line of text.split("\n")) {
        if (!line.startsWith(VERDICTS_STATED)) continue;
        const stated = parseBacktickedPhrases(line);
        assert(stated.length > 0, "the sentence naming the verdicts names at least one");
        return stated;
    }
    throw new ProtocolKeyShapeError(
        `${REGISTER_PATH}: no sentence states which verdicts an entry may carry`,
    );
}

/**
 * What the register says a count in prose has to name, read off the register rather than written
 * down here (**C15**). The sentence going missing throws, so deleting it turns the rule off loudly.
 */
export function parseStatedCountRule(text: string): string {
    assert(text.length > 0, "a register read for its rule says something");
    const flowing = text.split("\n").map((line) => line.trim()).join(" ");
    const at = flowing.indexOf(COUNT_RULE_STATED);
    if (at === -1) {
        throw new ProtocolKeyShapeError(
            `${REGISTER_PATH}: no sentence states what a count written in prose has to name`,
        );
    }
    const opened = at + BOLD.length;
    const end = flowing.indexOf(BOLD, opened);
    if (end === -1) {
        throw new ProtocolKeyShapeError(`${REGISTER_PATH}: the count rule never closes its bold`);
    }
    assert(end > opened, "a rule that closes says something between its markers");
    return flowing.slice(opened, end);
}

/**
 * Every sentence of the register's prose that counts occurrences of a key, with the recordings it
 * names. Walked as paragraphs, because `deno fmt` wraps a sentence over lines and a reader over
 * lines sees a count and its material as two separate claims.
 */
export function parseProseCountClaims(text: string): ProseCountClaim[] {
    assert(text.length > 0, "a register read for its prose says something");
    const claims: ProseCountClaim[] = [];
    let key = "";
    let paragraph = "";
    let opened = 0;
    for (const [offset, line] of text.split("\n").entries()) {
        const heading = parseRegisterHeading(line, offset + 1);
        if (heading !== null) {
            parseProseCountClaimsParagraph(claims, key, opened, paragraph);
            key = heading.key;
            paragraph = "";
            continue;
        }
        if (key.length === 0) continue;
        if (line.trim().length === 0) {
            parseProseCountClaimsParagraph(claims, key, opened, paragraph);
            paragraph = "";
            continue;
        }
        if (line.startsWith(SHAPE_MARKER)) continue;
        if (paragraph.length === 0) opened = offset + 1;
        paragraph = paragraph.length === 0 ? line.trim() : `${paragraph} ${line.trim()}`;
    }
    parseProseCountClaimsParagraph(claims, key, opened, paragraph);
    assert(claims.length <= CLAIMS_MAXIMUM, "a register states no more claims than the bound");
    return claims;
}

/** One paragraph's sentences, each asked whether it counts something the `_Shape:_` line owns. */
function parseProseCountClaimsParagraph(
    claims: ProseCountClaim[],
    key: string,
    line: number,
    paragraph: string,
): void {
    assert(claims.length <= CLAIMS_MAXIMUM, "a tally stays inside its stated bound");
    assert(line >= 0, "a paragraph knows which line it opened on");
    if (key.length === 0) return;
    if (paragraph.length === 0) return;
    for (const sentence of paragraph.split(SENTENCE_END)) {
        if (!isCountingSentence(sentence)) continue;
        claims.push({ key, line, sentence, recordings: parseRecordingsNamed(sentence) });
    }
}

/** A count stands immediately before the word it counts, which is the one shape prose uses. */
function isCountingSentence(sentence: string): boolean {
    const words: string[] = [];
    for (const raw of sentence.split(" ")) {
        const word = trimWordEdges(raw);
        if (word.length > 0) words.push(word);
    }
    assert(words.length <= CLAIMS_MAXIMUM, "a sentence holds no more words than the bound");
    for (const [at, word] of words.entries()) {
        if (!word.toLowerCase().startsWith(OCCURRENCE_STEM)) continue;
        if (at === 0) continue;
        if (isCountWord(words[at - 1] ?? "")) return true;
    }
    return false;
}

/** `**Both**` and `340,` are the same word as `both` and `340` to a reader looking for a count. */
function trimWordEdges(raw: string): string {
    let start = 0;
    for (let at = 0; at < raw.length; at += 1) {
        if (!WORD_EDGES.includes(raw.charAt(at))) break;
        start = at + 1;
    }
    let end = raw.length;
    for (let at = raw.length; at > start; at -= 1) {
        if (!WORD_EDGES.includes(raw.charAt(at - 1))) break;
        end = at - 1;
    }
    assert(end >= start, "a word trimmed from both ends has not crossed itself");
    return raw.slice(start, end);
}

/** Digits, or a word that spells a figure. `every` and `each` are neither, and are the point. */
function isCountWord(word: string): boolean {
    if (word.length === 0) return false;
    if (parseInteger(word) !== null) return true;
    return COUNT_WORDS.includes(word.toLowerCase());
}

/** Every recording path the sentence names, which is the material a count may rest on. */
function parseRecordingsNamed(sentence: string): string[] {
    const named: string[] = [];
    let at = sentence.indexOf(RECORDINGS_DIRECTORY);
    for (let look = 0; look < CLAIMS_MAXIMUM; look += 1) {
        if (at === -1) break;
        const end = sentence.indexOf(RECORDING_SUFFIX, at);
        if (end === -1) break;
        named.push(sentence.slice(at, end + RECORDING_SUFFIX.length));
        at = sentence.indexOf(RECORDINGS_DIRECTORY, end);
    }
    assert(named.length <= CLAIMS_MAXIMUM, "a sentence names no more paths than the bound");
    return named;
}

/** The line the register writes, formatted from a measurement so nobody types one by hand. */
export function formatShapeLine(shape: KeyShape): string {
    assert(shape.key.length > 0, "a line is written for a key");
    assert(shape.occurrences > 0, "and about a key something was seen of");
    const counted = formatInteger(shape.occurrences);
    return `${SHAPE_MARKER} ${counted} ${OCCURRENCE_WORD}; ${shape.placement}; ${shape.value}`;
}

/** Each measured key beside what the register states of it, and how many disagree. */
export function formatShapeReport(
    shapes: readonly KeyShape[],
    material: string,
    register: string,
): string {
    assert(material.length > 0, "a report names the material it was taken over");
    const entries = parseRegisteredKeys(register);
    const stated = new Map(entries.map((one) => [one.key, one.shape]));
    const named = new Set(entries.map((one) => one.key));
    const lines = [
        `what a key states about itself, over ${material}`,
        "",
        `${"key".padEnd(KEY_COLUMN)} ${"occurs".padStart(COUNT_WIDTH)}` +
        ` ${"where".padEnd(PLACEMENT_COLUMN)} ${"carries".padEnd(VALUE_COLUMN)} register`,
    ];
    let disagreed = 0;
    for (const shape of shapes) {
        let note: string;
        if (isDocumentedByFamily(shape.key, named)) {
            note = `— ${DAMAGE_FAMILY_HEADING}`;
        } else {
            note = formatShapeReportNote(shape, stated.get(shape.key));
            if (note.length > 0) disagreed += 1;
        }
        const counted = formatInteger(shape.occurrences).padStart(COUNT_WIDTH);
        lines.push(
            `${shape.key.padEnd(KEY_COLUMN)} ${counted} ${
                shape.placement.padEnd(PLACEMENT_COLUMN)
            }` +
                ` ${shape.value.padEnd(VALUE_COLUMN)} ${note}`,
        );
    }
    assert(disagreed <= shapes.length, "no more disagreements than rows");
    const total = formatInteger(shapes.length);
    lines.push("", `${formatInteger(disagreed)} of ${total} disagree with ${REGISTER_PATH}`);
    return `${lines.join("\n")}\n`;
}

/** Nothing where the register agrees; where it does not, what it says, so a fix is one paste. */
function formatShapeReportNote(shape: KeyShape, stated: KeyShape | null | undefined): string {
    if (stated === undefined) return "— no entry";
    if (stated === null) return "— entry states no shape";
    assert(stated.key === shape.key, "a claim is compared with the key it is about");
    const said = `— states ${
        formatInteger(stated.occurrences)
    }; ${stated.placement}; ${stated.value}`;
    if (stated.occurrences !== shape.occurrences) return said;
    if (stated.placement !== shape.placement) return said;
    if (stated.value !== shape.value) return said;
    return "";
}

/**
 * A carried key the family entry documents rather than one of its own. The `thirdatt` pair is read
 * as the family and carries entries, which is why this asks the register and not only the reading.
 */
export function isDocumentedByFamily(key: string, registered: ReadonlySet<string>): boolean {
    assert(key.length > 0, "a key is asked about by name");
    assert(registered.has(DAMAGE_FAMILY_HEADING), "and against a register that opens the family");
    if (registered.has(key)) return false;
    return getKeyReading(key)?.kind === KEY_FAMILY.damage;
}

if (import.meta.main) {
    const replayed = replayRecordedMaterial(readRecordedMaterial([]));
    const material = `${formatInteger(replayed.length)} recordings in ${RECORDINGS_DIRECTORY}`;
    const report = formatShapeReport(
        tallyKeyShapes(replayed),
        material,
        Deno.readTextFileSync(REGISTER_PATH),
    );
    await Deno.stdout.write(new TextEncoder().encode(report));
}
