/**
 * Every protocol key the game client branches on, lifted from the production bundle.
 *
 *     deno task game:keys [freeze]
 *
 * The client decides what a message means in one `switch` over the key of each segment, so that
 * switch is the only complete answer to "what does the decoder not know about" — the recordings
 * carry only the keys that happened to occur. Keys only: they are functional names, and the
 * sentences the game composes from them stay in the cache (NOTICE.md).
 */

import { assert, assertNotStrictEquals, assertStrictEquals } from "@std/assert";
import { getEndOfRun, isDigitAt } from "@/libs/text-walk.ts";
import { composeJsonWriting } from "@/libs/json-text.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { getCachedBundle, getCachedClientSource } from "@/tools/game-client-source.ts";
import { ProtocolKeyTableError } from "@/tools/margometer-tool-error.ts";

/**
 * ⚠️ **The subject is matched by shape, and a build is why.** It was the literal `O[0]){` — the
 * name a minifier gave that local in build `1785244275300`. Build `1786441768914` calls it `y`,
 * and the tool refused the whole bundle over one renamed letter. What does not change is the
 * shape: some identifier indexed at zero, then the block.
 */
const SWITCH_ANCHOR = "manageBattleEffects(";
const SWITCH_SUBJECT_TAIL = "[0]){";
const SEGMENT_INDEX = "[0]";
const CASE_KEYWORD = "case";
const LABEL_TERMINATOR = ":";
/** A minified local. Digits are absent because the client never starts a name with one. */
const NAME_CHARACTERS = "$_";
const BLOCK_OPEN = "{";
const BLOCK_CLOSE = "}";
const ESCAPE = "\\";

/**
 * Any of the three quotings JavaScript has, because which one a build uses is the bundler's taste
 * and not the client's meaning. The class admits a mismatched pair, which no valid source holds,
 * and every use sits inside a longer shape that decides what it is reading.
 */
const QUOTES = "\"'`";

/** Past the longest literal any bundle here states, so the walk stays a stated bound. */
const MAXIMUM_LITERAL_CHARACTERS = 65536;
/** Past the label count of any switch the client has written, for the same reason. */
const MAXIMUM_CASE_LABELS = 4096;
/** Past the number of places `[0]){` or a shape's opening text occurs in three megabytes. */
const MAXIMUM_LOOKS = 65536;

const FROZEN_PATH = "frozen/protocol-keys.ts";

/**
 * Not every key is spelled out. The switch ends in a default branch recognising a whole family by
 * shape — a marker at a fixed offset, and a sign saying whose figure it is.
 */
export interface ComputedKeyFamily {
    marker: string;
    markerAt: number;
    markerLength: number;
    /** The sign meaning the actor dealt it; anything else means it was taken. */
    dealtSign: string;
}

type DefaultBranchField = "marker" | "markerAt" | "markerLength" | "dealtSign";

/**
 * One piece of a shape, in the order it is read. A capture carries the name of the field it holds,
 * so the two spellings below need no table of group numbers beside them.
 */
type ShapeStep =
    | { kind: "text"; text: string }
    /** The segment, indexed at its first character. Not captured. */
    | { kind: "segmentKey" }
    | { kind: "quoted"; field: DefaultBranchField }
    | { kind: "digits"; field: DefaultBranchField };

/**
 * The default branch in the two orders the client has written it. Both say the same thing and
 * differ in which side of `==` each operand sits on, which is a bundler's output style: build
 * `1786514810315` wrote the literal first, `53XkBRxF` writes it second.
 */
const DEFAULT_BRANCH_SHAPES: readonly (readonly ShapeStep[])[] = [
    [
        { kind: "text", text: "default:" },
        { kind: "segmentKey" },
        { kind: "text", text: ".substr(" },
        { kind: "digits", field: "markerAt" },
        { kind: "text", text: "," },
        { kind: "digits", field: "markerLength" },
        { kind: "text", text: ")==" },
        { kind: "quoted", field: "marker" },
        { kind: "text", text: "?" },
        { kind: "segmentKey" },
        { kind: "text", text: ".charAt(0)==" },
        { kind: "quoted", field: "dealtSign" },
    ],
    [
        { kind: "text", text: "default:" },
        { kind: "quoted", field: "marker" },
        { kind: "text", text: "==" },
        { kind: "segmentKey" },
        { kind: "text", text: ".substr(" },
        { kind: "digits", field: "markerAt" },
        { kind: "text", text: "," },
        { kind: "digits", field: "markerLength" },
        { kind: "text", text: ")?" },
        { kind: "quoted", field: "dealtSign" },
        { kind: "text", text: "==" },
        { kind: "segmentKey" },
        { kind: "text", text: ".charAt(0)" },
    ],
];

function isNameCharacterAt(source: string, index: number): boolean {
    const character = source.charAt(index);
    if (character === "") return false;
    assertStrictEquals(character.length, 1, "one character is looked at");
    assert(index >= 0, "and it is looked for inside the source");
    if (character >= "a" && character <= "z") return true;
    if (character >= "A" && character <= "Z") return true;
    return NAME_CHARACTERS.includes(character);
}

/** The text inside a quoted literal at `open`, and where it ends. */
function getQuotedLiteral(source: string, open: number): { text: string; end: number } | null {
    const opening = source.charAt(open);
    if (opening === "") return null;
    if (!QUOTES.includes(opening)) return null;

    let index = open + 1;
    for (let look = 0; look < MAXIMUM_LITERAL_CHARACTERS; look += 1) {
        const character = source.charAt(index);
        if (character === "") return null;
        if (QUOTES.includes(character)) {
            assert(index > open, "a literal closes after it opened");
            return { text: source.slice(open + 1, index), end: index + 1 };
        }
        index += 1;
    }
    assert(MAXIMUM_LITERAL_CHARACTERS > 0, "the walk was given a stated bound");
    return null;
}

/** The block starting at the first `{` after `from`, brace-matched, strings skipped. */
function getBlockBody(source: string, from: number): string {
    const start = source.indexOf(BLOCK_OPEN, from);
    if (start === -1) throw new ProtocolKeyTableError("no block after the switch subject");

    let depth = 0;
    let quote = "";
    for (let at = start; at < source.length; at += 1) {
        const character = source.charAt(at);
        if (quote !== "") {
            if (character === ESCAPE) at += 1;
            else if (character === quote) quote = "";
            continue;
        }
        if (QUOTES.includes(character)) quote = character;
        else if (character === BLOCK_OPEN) depth += 1;
        else if (character === BLOCK_CLOSE) {
            depth -= 1;
            if (depth === 0) {
                assert(at >= start, "a block closes after it opened");
                return source.slice(start, at + 1);
            }
        }
    }
    assertNotStrictEquals(depth, 0, "a block that never closed was walked to the end");
    throw new ProtocolKeyTableError("the switch block never closes");
}

/** The shape read straight through from `start`, or null at the first piece that does not hold. */
function getFieldsAt(
    bundle: string,
    start: number,
    steps: readonly ShapeStep[],
): Map<DefaultBranchField, string> | null {
    const fields = new Map<DefaultBranchField, string>();
    let index = start;

    for (const step of steps) {
        if (step.kind === "text") {
            if (!bundle.startsWith(step.text, index)) return null;
            index += step.text.length;
            continue;
        }
        if (step.kind === "segmentKey") {
            const name = getEndOfRun(bundle, index, isNameCharacterAt);
            if (name === index) return null;
            if (!bundle.startsWith(SEGMENT_INDEX, name)) return null;
            index = name + SEGMENT_INDEX.length;
            continue;
        }
        if (step.kind === "digits") {
            const digits = getEndOfRun(bundle, index, isDigitAt);
            if (digits === index) return null;
            fields.set(step.field, bundle.slice(index, digits));
            index = digits;
            continue;
        }
        const quoted = getQuotedLiteral(bundle, index);
        if (quoted === null) return null;
        fields.set(step.field, quoted.text);
        index = quoted.end;
    }
    assert(fields.size <= steps.length, "a shape reads no more fields than it has pieces");
    assert(index >= start, "a shape is read forwards");
    return fields;
}

/** The first place in the bundle where the shape holds, read whole. */
function getFieldsFromShape(
    bundle: string,
    steps: readonly ShapeStep[],
): Map<DefaultBranchField, string> | null {
    const head = steps[0];
    // Every shape opens with a literal, which is what the search hunts for. One that did not
    // could still be read at every position, and the cost of that over three megabytes is why
    // this refuses instead.
    if (head === undefined || head.kind !== "text") {
        throw new ProtocolKeyTableError("a default-branch shape has to open with text");
    }
    let at = bundle.indexOf(head.text);
    for (let look = 0; look < MAXIMUM_LOOKS; look += 1) {
        if (at === -1) return null;
        const fields = getFieldsAt(bundle, at, steps);
        if (fields !== null) return fields;
        at = bundle.indexOf(head.text, at + 1);
    }
    assert(MAXIMUM_LOOKS > 0, "the search was given a stated bound");
    return null;
}

export function getComputedKeyFamily(bundle: string): ComputedKeyFamily {
    const read = DEFAULT_BRANCH_SHAPES
        .map((steps) => getFieldsFromShape(bundle, steps))
        .find((fields): fields is Map<DefaultBranchField, string> => fields !== null);
    if (read === undefined) {
        throw new ProtocolKeyTableError(
            "no computed key family in the default branch — the client changed how it routes keys",
        );
    }
    const marker = read.get("marker") ?? "";
    const dealtSign = read.get("dealtSign") ?? "";
    const markerAt = getIntegerFromText(read.get("markerAt") ?? "");
    const markerLength = getIntegerFromText(read.get("markerLength") ?? "");
    // That the fields are there is ours to guarantee — the shape read them all or it read none.
    // What the client wrote inside them is not, so the offsets are refused rather than coerced.
    if (markerAt === null || markerLength === null) {
        throw new ProtocolKeyTableError(
            "the default branch's offsets do not read as numbers — the client changed" +
                " how it routes keys",
        );
    }
    assert(marker.length > 0, "a family is recognised by a marker that says something");
    assert(dealtSign.length > 0, "and by a sign saying whose figure it is");
    return { marker, markerAt, markerLength, dealtSign };
}

/**
 * Where the switch subject's name begins at or after `from`.
 *
 * Found by its tail and walked back, because the name is what a minifier renames and the tail is
 * what it cannot. The walk stops at `from`: a name running in from before the anchor is not this
 * switch's.
 */
function getSwitchSubjectStart(bundle: string, from: number): number | null {
    let at = bundle.indexOf(SWITCH_SUBJECT_TAIL, from);
    for (let look = 0; look < MAXIMUM_LOOKS; look += 1) {
        if (at === -1) return null;
        let start = at;
        while (start > from) {
            assert(start <= bundle.length, "the walk back stays inside its stated bound");
            if (!isNameCharacterAt(bundle, start - 1)) break;
            start -= 1;
        }
        if (start < at) return start;
        at = bundle.indexOf(SWITCH_SUBJECT_TAIL, at + 1);
    }
    assert(MAXIMUM_LOOKS > 0, "the search was given a stated bound");
    return null;
}

/** Every `case"key":` label in the switch body, in the order it states them. */
function getCaseLabels(body: string): string[] {
    const labels: string[] = [];
    let from = 0;
    for (let look = 0; look < MAXIMUM_CASE_LABELS; look += 1) {
        const at = body.indexOf(CASE_KEYWORD, from);
        if (at === -1) return labels;
        const quoted = getQuotedLiteral(body, at + CASE_KEYWORD.length);
        if (quoted === null || body.charAt(quoted.end) !== LABEL_TERMINATOR) {
            from = at + 1;
            continue;
        }
        labels.push(quoted.text);
        from = quoted.end + 1;
    }
    assert(labels.length <= MAXIMUM_CASE_LABELS, "a switch states no more labels than the bound");
    return labels;
}

export function getProtocolKeys(bundle: string): string[] {
    const anchor = bundle.indexOf(SWITCH_ANCHOR);
    if (anchor === -1) {
        throw new ProtocolKeyTableError(
            `no ${SWITCH_ANCHOR} in the bundle — the client was restructured`,
        );
    }
    // Searched from the anchor rather than over the whole bundle: `x[0]){` is an ordinary shape,
    // and the first one in three megabytes belongs to whatever is earliest, not to this switch.
    const subject = getSwitchSubjectStart(bundle, anchor);
    if (subject === null) {
        throw new ProtocolKeyTableError(
            `${SWITCH_ANCHOR} found but not the switch on the segment key`,
        );
    }
    const distinct = [...new Set(getCaseLabels(getBlockBody(bundle, subject)))];
    if (distinct.length === 0) throw new ProtocolKeyTableError("the switch has no case labels");
    assert(subject >= anchor, "the switch sits at or after the call that anchors it");
    assert(distinct.length > 0, "a table that was lifted names something");
    return distinct.sort();
}

/** The frozen table as the text it is written down as, or a refusal branded as this tool's. */
function requireWrittenText(value: unknown): string {
    const writing = composeJsonWriting(value);
    if (!writing.isOk) {
        throw new ProtocolKeyTableError("a value of the table cannot be written", {
            cause: writing.cause,
        });
    }
    assert(writing.text.length > 0, "a value that was written says something");
    assert(typeof writing.text === "string", "and is text by the time it is read back");
    return writing.text;
}

/** The family on one line, spaced the way this tree writes an object, since it is read here. */
function composeFamilyText(family: ComputedKeyFamily): string {
    const fields = [
        `${requireWrittenText("marker")}: ${requireWrittenText(family.marker)}`,
        `${requireWrittenText("markerAt")}: ${composeIntegerText(family.markerAt)}`,
        `${requireWrittenText("markerLength")}: ${composeIntegerText(family.markerLength)}`,
        `${requireWrittenText("dealtSign")}: ${requireWrittenText(family.dealtSign)}`,
    ];
    assertStrictEquals(fields.length, 4, "a family states four things about itself");
    assert(family.markerLength > 0, "and a marker with something in it");
    return `{ ${fields.join(", ")} }`;
}

/**
 * What stands over the frozen table, exported so a guard can hold the file to its generator
 * without the cached client a full regeneration needs — which is the drift nothing caught until
 * the banner was edited here and the file kept the old one.
 */
export const FROZEN_KEY_BANNER =
    `// Generated by \`deno task game:keys freeze\`. Do not edit by hand.
//
// Keys only, and \`tools/protocol-key-table.ts\` says what they are lifted from and why
// nothing the game composes from them comes with them.
`;

function composeFrozenKeyModule(build: string, keys: string[], family: ComputedKeyFamily): string {
    const stated = composeFamilyText(family);
    const written = keys.map((key) => `        ${requireWrittenText(key)},`).join("\n");
    assert(written.length > 0, "a table that is written down says something");
    assert(build.length > 0, "and is dated by the build it was lifted from");
    assert(FROZEN_KEY_BANNER.length > 0, "and stands under a banner saying where it came from");
    return `${FROZEN_KEY_BANNER}
export const FROZEN_PROTOCOL_KEYS = {
    gameBuild: ${requireWrittenText(build)},
    /** Keys the client recognises by shape rather than by name — see the tool. */
    computedFamily: ${stated},
    keys: [
${written}
    ],
} as const;
`;
}

/** The build the table would be lifted from, refusing rather than reading an empty cache. */
function requireCachedBuild(): string {
    const cached = getCachedClientSource("production");
    if (cached === null) {
        throw new ProtocolKeyTableError(
            "nothing cached for production — run `deno task game:client fetch production`",
        );
    }
    assert(cached.build.length > 0, "a cache that was admitted knows its own build");
    assertStrictEquals(cached.channel, "production", "and is the channel the table stands on");
    return cached.build;
}

/** The table written to `frozen/`, dated by the build its bundle was served as. */
export function writeFrozenKeyTable(): { build: string; count: number } {
    const build = requireCachedBuild();
    const bundle = getCachedBundle("production");
    const keys = getProtocolKeys(bundle);
    Deno.writeTextFileSync(
        FROZEN_PATH,
        composeFrozenKeyModule(build, keys, getComputedKeyFamily(bundle)),
    );
    assert(keys.length > 0, "a table that was written down counts something");
    assert(build.length > 0, "and says which build it was counted over");
    return { build, count: keys.length };
}

if (import.meta.main) {
    if (Deno.args.includes("freeze")) {
        const { build, count } = writeFrozenKeyTable();
        console.log(`froze ${composeIntegerText(count)} keys from build ${build} → ${FROZEN_PATH}`);
    } else {
        const bundle = getCachedBundle("production");
        const count = composeIntegerText(getProtocolKeys(bundle).length);
        const family = getComputedKeyFamily(bundle);
        console.log(
            `${count} keys plus the ${family.marker} family in build ${requireCachedBuild()}`,
        );
        console.log(`run with \`freeze\` to write ${FROZEN_PATH}`);
    }
}
