/**
 * Every protocol key the game client branches on, lifted from the production bundle. The client
 * decides what a message means in one `switch` over each segment's key, so that switch is the only
 * complete answer to "what does the decoder not know about": the recordings carry only the keys
 * that happened to occur. Keys only: they are functional names, and the sentences the game
 * composes from them stay in the cache (`NOTICE.md`).
 *
 *     deno task margonem:keys [freeze]
 */

import { assert, assertNotStrictEquals } from "@std/assert";
import { encodeJson } from "#/libs/json-text.ts";
import { formatInteger, parseInteger } from "#/libs/number-text.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import {
    isDigitAt,
    isWhitespaceAt,
    JAVASCRIPT_QUOTES,
    LiteralTooLong,
    lookupEndOfRun,
    lookupQuotedLiteral,
    type QuotedLiteral,
    RUN_CHARACTERS_MAXIMUM,
} from "#/libs/text-walk.ts";
import { MARGONEM_CHANNEL, readCachedBuild, readCachedBundle } from "./margonem-client-source.ts";
import { type FrozenFiles, readFrozenFiles, writeFrozenFiles } from "./frozen-files.ts";
import { ProtocolKeyTableError } from "./margometer-tool-error.ts";

/**
 * Not every key is spelled out. The switch ends in a default branch recognising a whole family by
 * shape: a marker at a fixed offset, and a sign saying whose figure it is.
 */
export interface ComputedKeyFamily {
    marker: string;
    markerAt: number;
    markerLength: number;
    /** The sign meaning the actor dealt it; anything else means it was taken. */
    dealtSign: string;
}

/** The fields the default branch states, each a field of `ComputedKeyFamily`. */
const DEFAULT_BRANCH_FIELD = {
    marker: "marker",
    markerAt: "markerAt",
    markerLength: "markerLength",
    dealtSign: "dealtSign",
} as const;
type DefaultBranchField = VocabularyWord<typeof DEFAULT_BRANCH_FIELD>;

/** One piece of a shape, in the order it is read; a capture names the field it holds. */
type ShapeStep =
    | { kind: typeof SHAPE_STEP.text; text: string }
    /** The segment, indexed at its first character. Not captured. */
    | { kind: typeof SHAPE_STEP.segmentKey }
    | { kind: typeof SHAPE_STEP.quoted; field: DefaultBranchField }
    | { kind: typeof SHAPE_STEP.digits; field: DefaultBranchField };

const SHAPE_STEP = {
    text: "text",
    segmentKey: "segment-key",
    quoted: "quoted",
    digits: "digits",
} as const;

/**
 * ⚠️ **The subject is matched by shape, and a build is why.** It was the literal `O[0]){`, the
 * name a minifier gave that local in build `1785244275300`; build `1786441768914` calls it `y`,
 * and the tool refused the whole bundle over one renamed letter. The shape does not change.
 */
const SWITCH_ANCHOR = "manageBattleEffects(";
const SWITCH_SUBJECT_TAIL = "[0])";
const SEGMENT_INDEX = "[0]";
const CASE_KEYWORD = "case";
const LABEL_TERMINATOR = ":";
/** A minified local. Digits are absent because the client never starts a name with one. */
const NAME_CHARACTERS = "$_";
const BLOCK_OPEN = "{";
const BLOCK_CLOSE = "}";
const ESCAPE = "\\";
/** Past the label count of any switch the client has written, so the walk is a stated bound. */
export const CASE_LABELS_MAXIMUM = 4096;
/**
 * Past the places `[0])` or a shape's opening text occurs in a bundle: 135 and 255 of them in the
 * 2.8 MB production bundle of build `DHSqC3Uh`, 2026-10-06.
 */
export const LOOKS_MAXIMUM = 65_536;
const FROZEN_PATH = "frozen/protocol-keys.ts";
/** The field the reading is dated by, exported so a test holds the frozen file to it. */
export const FROZEN_DATE_FIELD = "gameBuild";
/**
 * The default branch in the two orders the client has written it. Both say the same thing and
 * differ in which side of `==` each operand sits on: build `1786514810315` wrote the literal first,
 * `53XkBRxF` writes it second.
 */
const DEFAULT_BRANCH_SHAPES: readonly (readonly ShapeStep[])[] = [
    [
        { kind: SHAPE_STEP.text, text: "default:" },
        { kind: SHAPE_STEP.segmentKey },
        { kind: SHAPE_STEP.text, text: ".substr(" },
        { kind: SHAPE_STEP.digits, field: DEFAULT_BRANCH_FIELD.markerAt },
        { kind: SHAPE_STEP.text, text: "," },
        { kind: SHAPE_STEP.digits, field: DEFAULT_BRANCH_FIELD.markerLength },
        { kind: SHAPE_STEP.text, text: ")==" },
        { kind: SHAPE_STEP.quoted, field: DEFAULT_BRANCH_FIELD.marker },
        { kind: SHAPE_STEP.text, text: "?" },
        { kind: SHAPE_STEP.segmentKey },
        { kind: SHAPE_STEP.text, text: ".charAt(0)==" },
        { kind: SHAPE_STEP.quoted, field: DEFAULT_BRANCH_FIELD.dealtSign },
    ],
    [
        { kind: SHAPE_STEP.text, text: "default:" },
        { kind: SHAPE_STEP.quoted, field: DEFAULT_BRANCH_FIELD.marker },
        { kind: SHAPE_STEP.text, text: "==" },
        { kind: SHAPE_STEP.segmentKey },
        { kind: SHAPE_STEP.text, text: ".substr(" },
        { kind: SHAPE_STEP.digits, field: DEFAULT_BRANCH_FIELD.markerAt },
        { kind: SHAPE_STEP.text, text: "," },
        { kind: SHAPE_STEP.digits, field: DEFAULT_BRANCH_FIELD.markerLength },
        { kind: SHAPE_STEP.text, text: ")?" },
        { kind: SHAPE_STEP.quoted, field: DEFAULT_BRANCH_FIELD.dealtSign },
        { kind: SHAPE_STEP.text, text: "==" },
        { kind: SHAPE_STEP.segmentKey },
        { kind: SHAPE_STEP.text, text: ".charAt(0)" },
    ],
];
/**
 * What stands over the frozen table, exported so a guard holds the file to its generator without
 * the cached client a full regeneration needs: the banner once changed here and the file kept the
 * old one.
 */
export const FROZEN_KEY_BANNER =
    `// Generated by \`deno task margonem:keys freeze\`. Do not edit by hand.
//
// Keys only, and \`tools/protocol-key-table.ts\` says what they are lifted from and why
// nothing the game composes from them comes with them.
`;

/** The table written to `frozen/`, where it moved. */
export function writeFrozenKeyTable(): FrozenFiles {
    const frozen = readFrozenKeyTable();
    writeFrozenFiles(frozen);
    return frozen;
}

/** The table the cached bundle gives, dated by the first build that gave it (ADR 0011). */
export function readFrozenKeyTable(): FrozenFiles {
    const build = readCachedBuild();
    const bundle = readCachedBundle(MARGONEM_CHANNEL.production);
    const keys = requireProtocolKeys(bundle);
    const family = requireComputedKeyFamily(bundle);
    assert(keys.length > 0, "a table that is frozen counts something");
    return readFrozenFiles(
        [FROZEN_PATH],
        FROZEN_DATE_FIELD,
        build,
        keys.length,
        (date) => [encodeFrozenKeyModule(date, keys, family)],
    );
}

export function encodeFrozenKeyModule(
    build: string,
    keys: readonly string[],
    family: ComputedKeyFamily,
): string {
    const written = keys.map((key) => `        ${encodeRequiredText(key)},`).join("\n");
    assert(written.length > 0, "a table that is written down says something");
    assert(build.length > 0, "and is dated by the build it was lifted from");
    return `${FROZEN_KEY_BANNER}
export const FROZEN_PROTOCOL_KEYS = {
    ${FROZEN_DATE_FIELD}: ${encodeRequiredText(build)},
    /** Keys the client recognises by shape rather than by name — see the tool. */
    computedFamily: ${encodeFamilyText(family)},
    keys: [
${written}
    ],
} as const;
`;
}

/** The family on one line, spaced the way this tree writes an object, since it is read here. */
function encodeFamilyText(family: ComputedKeyFamily): string {
    const fields = [
        `${encodeRequiredText(DEFAULT_BRANCH_FIELD.marker)}: ${encodeRequiredText(family.marker)}`,
        `${encodeRequiredText(DEFAULT_BRANCH_FIELD.markerAt)}: ${formatInteger(family.markerAt)}`,
        `${encodeRequiredText(DEFAULT_BRANCH_FIELD.markerLength)}: ${
            formatInteger(family.markerLength)
        }`,
        `${encodeRequiredText(DEFAULT_BRANCH_FIELD.dealtSign)}: ${
            encodeRequiredText(family.dealtSign)
        }`,
    ];
    assert(family.markerLength > 0, "a marker has something in it");
    return `{ ${fields.join(", ")} }`;
}

/** A value of the table as the text it is written down as, or a refusal branded as this tool's. */
function encodeRequiredText(encodable: unknown): string {
    const text = encodeJson(encodable, 0);
    if (text instanceof Error) {
        throw new ProtocolKeyTableError("a value of the table cannot be written", { cause: text });
    }
    return text;
}

export function requireProtocolKeys(bundle: string): string[] {
    const anchor = bundle.indexOf(SWITCH_ANCHOR);
    if (anchor === -1) {
        throw new ProtocolKeyTableError(`no ${SWITCH_ANCHOR} in the bundle — it was restructured`);
    }
    // Searched from the anchor rather than over the whole bundle: `x[0]){` is an ordinary shape,
    // and the first one in the whole bundle belongs to whatever is earliest, not to this switch.
    const subject = lookupSwitchSubjectStart(bundle, anchor);
    if (subject === null) {
        throw new ProtocolKeyTableError(`${SWITCH_ANCHOR} found but not the switch on the key`);
    }
    const distinct = [...new Set(parseCaseLabels(requireBlockBody(bundle, subject)))];
    if (distinct.length === 0) throw new ProtocolKeyTableError("the switch has no case labels");
    assert(subject >= anchor, "the switch sits at or after the call that anchors it");
    return distinct.sort();
}

/**
 * Where the switch subject's name begins at or after `from`: found by its tail and walked back,
 * because the name is what a minifier renames and the tail is what it cannot. Space may stand
 * before the block, because the development channel serves the client unminified.
 */
function lookupSwitchSubjectStart(bundle: string, from: number): number | null {
    let tailAt = bundle.indexOf(SWITCH_SUBJECT_TAIL, from);
    for (let look = 0; look <= LOOKS_MAXIMUM; look += 1) {
        if (tailAt === -1) return null;
        let start = tailAt;
        while (start > from) {
            if (!isNameCharacterAt(bundle, start - 1)) break;
            start -= 1;
        }
        const block = requireEndOfRun(bundle, tailAt + SWITCH_SUBJECT_TAIL.length, isWhitespaceAt);
        if (start < tailAt) {
            if (bundle.charAt(block) === BLOCK_OPEN) return start;
        }
        tailAt = bundle.indexOf(SWITCH_SUBJECT_TAIL, tailAt + 1);
    }
    throw new ProtocolKeyTableError(
        `more than ${LOOKS_MAXIMUM} places to look for the switch — the walk would stop short`,
    );
}

/** Where a run ends, refused where it runs past what a walk reads in one go: the bundle is theirs. */
function requireEndOfRun(
    source: string,
    from: number,
    isMember: (text: string, index: number) => boolean,
): number {
    const runEnd = lookupEndOfRun(source, from, RUN_CHARACTERS_MAXIMUM, isMember);
    if (runEnd === null) {
        throw new ProtocolKeyTableError(
            `a run at ${from} goes past the ${RUN_CHARACTERS_MAXIMUM} characters read`,
        );
    }
    return runEnd;
}

function isNameCharacterAt(source: string, index: number): boolean {
    const character = source.charAt(index);
    if (character === "") return false;
    if (isCharacterWithin(character, "a", "z")) return true;
    if (isCharacterWithin(character, "A", "Z")) return true;
    return NAME_CHARACTERS.includes(character);
}

/** Whether one character stands from `lowest` to `highest`, both counted, in code-unit order. */
function isCharacterWithin(character: string, lowest: string, highest: string): boolean {
    assert(lowest <= highest, "a range runs forwards");
    if (character < lowest) return false;
    return character <= highest;
}

/**
 * Every `case"key":` label in the switch body, in the order it states them. Space may stand on
 * either side of the key, as it does in the unminified client, but not in front of `case` inside
 * a longer name.
 */
function parseCaseLabels(body: string): string[] {
    const labels: string[] = [];
    let from = 0;
    for (let look = 0; look <= CASE_LABELS_MAXIMUM; look += 1) {
        const keywordAt = body.indexOf(CASE_KEYWORD, from);
        if (keywordAt === -1) return labels;
        from = keywordAt + 1;
        if (isNameCharacterAt(body, keywordAt - 1)) continue;
        const open = requireEndOfRun(body, keywordAt + CASE_KEYWORD.length, isWhitespaceAt);
        const quoted = requireQuotedLiteral(body, open);
        if (quoted === null) continue;
        const terminator = requireEndOfRun(body, quoted.end, isWhitespaceAt);
        if (body.charAt(terminator) !== LABEL_TERMINATOR) continue;
        labels.push(quoted.text);
        from = terminator + 1;
    }
    throw new ProtocolKeyTableError(
        `more than ${CASE_LABELS_MAXIMUM} places to look for a label — the walk would stop short`,
    );
}

/** The literal opening at `open`, or null; refused where it runs past what a walk reads. */
function requireQuotedLiteral(source: string, open: number): QuotedLiteral | null {
    const literal = lookupQuotedLiteral(source, open);
    if (literal instanceof LiteralTooLong) {
        throw new ProtocolKeyTableError(
            `a literal at ${open} runs past the ${literal.maximum} characters read`,
            { cause: literal },
        );
    }
    return literal;
}

/** The block starting at the first `{` after `from`, brace-matched, strings skipped. */
function requireBlockBody(source: string, from: number): string {
    const start = source.indexOf(BLOCK_OPEN, from);
    if (start === -1) throw new ProtocolKeyTableError("no block after the switch subject");
    let depth = 0;
    let quote = "";
    for (let position = start; position < source.length; position += 1) {
        const character = source.charAt(position);
        if (quote !== "") {
            if (character === ESCAPE) position += 1;
            else if (character === quote) quote = "";
            continue;
        }
        if (JAVASCRIPT_QUOTES.includes(character)) quote = character;
        else if (character === BLOCK_OPEN) depth += 1;
        else if (character === BLOCK_CLOSE) {
            depth -= 1;
            if (depth === 0) return source.slice(start, position + 1);
        }
    }
    assertNotStrictEquals(depth, 0, "a block that never closed was walked to the end");
    throw new ProtocolKeyTableError("the switch block never closes");
}

export function requireComputedKeyFamily(bundle: string): ComputedKeyFamily {
    const familyFields = DEFAULT_BRANCH_SHAPES
        .map((steps) => lookupShapeFields(bundle, steps))
        .find((fields): fields is Map<DefaultBranchField, string> => fields !== null);
    if (familyFields === undefined) {
        throw new ProtocolKeyTableError(
            "no computed key family in the default branch — the client changed how it routes keys",
        );
    }
    const marker = familyFields.get(DEFAULT_BRANCH_FIELD.marker) ?? "";
    const dealtSign = familyFields.get(DEFAULT_BRANCH_FIELD.dealtSign) ?? "";
    const markerAt = parseInteger(familyFields.get(DEFAULT_BRANCH_FIELD.markerAt) ?? "");
    const markerLength = parseInteger(familyFields.get(DEFAULT_BRANCH_FIELD.markerLength) ?? "");
    // That the fields are there is ours to guarantee: the shape read them all or none. What the
    // client wrote inside them is not, so the offsets are refused rather than coerced.
    if (markerAt === null) {
        throw new ProtocolKeyTableError("the default branch's marker offset is not a number");
    }
    if (markerLength === null) {
        throw new ProtocolKeyTableError("the default branch's marker length is not a number");
    }
    assert(marker.length > 0, "a family is recognised by a marker that says something");
    assert(dealtSign.length > 0, "and by a sign saying whose figure it is");
    return { marker, markerAt, markerLength, dealtSign };
}

/** The first place in the bundle where the shape holds, read whole. */
function lookupShapeFields(
    bundle: string,
    steps: readonly ShapeStep[],
): Map<DefaultBranchField, string> | null {
    const head = steps[0];
    // Every shape opens with a literal, which is what the search hunts for; reading at every
    // position of the bundle instead is why one that does not is refused.
    if (head === undefined) throw new ProtocolKeyTableError("a default-branch shape is empty");
    if (head.kind !== SHAPE_STEP.text) {
        throw new ProtocolKeyTableError("a default-branch shape has to open with text");
    }
    let headAt = bundle.indexOf(head.text);
    for (let look = 0; look <= LOOKS_MAXIMUM; look += 1) {
        if (headAt === -1) return null;
        const fields = parseShapeFields(bundle, headAt, steps);
        if (fields !== null) return fields;
        headAt = bundle.indexOf(head.text, headAt + 1);
    }
    throw new ProtocolKeyTableError(
        `more than ${LOOKS_MAXIMUM} places to look for a shape — the walk would stop short`,
    );
}

/** The shape read straight through from `start`, or null at the first piece that does not hold. */
function parseShapeFields(
    bundle: string,
    start: number,
    steps: readonly ShapeStep[],
): Map<DefaultBranchField, string> | null {
    const fields = new Map<DefaultBranchField, string>();
    let index = start;
    for (const step of steps) {
        if (step.kind === SHAPE_STEP.text) {
            if (!bundle.startsWith(step.text, index)) return null;
            index += step.text.length;
        } else if (step.kind === SHAPE_STEP.segmentKey) {
            const name = requireEndOfRun(bundle, index, isNameCharacterAt);
            if (name === index) return null;
            if (!bundle.startsWith(SEGMENT_INDEX, name)) return null;
            index = name + SEGMENT_INDEX.length;
        } else if (step.kind === SHAPE_STEP.digits) {
            const digits = requireEndOfRun(bundle, index, isDigitAt);
            if (digits === index) return null;
            fields.set(step.field, bundle.slice(index, digits));
            index = digits;
        } else {
            const quoted = requireQuotedLiteral(bundle, index);
            if (quoted === null) return null;
            fields.set(step.field, quoted.text);
            index = quoted.end;
        }
    }
    assert(fields.size <= steps.length, "a shape reads no more fields than it has pieces");
    return fields;
}

if (import.meta.main) {
    if (Deno.args.includes("freeze")) {
        const frozen = writeFrozenKeyTable();
        const count = formatInteger(frozen.count);
        const moved = frozen.hasMoved ? "froze" : "unchanged:";
        console.log(`${moved} ${count} keys from build ${frozen.date} → ${FROZEN_PATH}`);
    } else {
        const bundle = readCachedBundle(MARGONEM_CHANNEL.production);
        const count = formatInteger(requireProtocolKeys(bundle).length);
        const family = requireComputedKeyFamily(bundle);
        console.log(`${count} keys plus the ${family.marker} family in ${readCachedBuild()}`);
        console.log(`run with \`freeze\` to write ${FROZEN_PATH}`);
    }
}
