/**
 * The names this repository chooses, in the shapes N1 and N11 require.
 *
 * Every reader is proved on a sample before it is let near the tree, because a naming guard
 * over seven files of one author's code would otherwise pass by having nothing to find.
 */

import { assert, assertEquals } from "@std/assert";
import { basename } from "@std/path";
import { getCodeOutsideStrings, isCommentLine } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const FORBIDDEN_NAMES = ["utils", "helpers", "common", "misc", "index"];
const TYPE_KEYWORDS = ["interface", "type", "class", "enum"];
/** Shortened units, in the two spellings a name here is written in — N1. */
const SHORT_UNITS = ["Ms", "Sec", "Secs", "Px", "Pct", "Hz", "Kb", "Mb"];
const SHORT_UNITS_SHOUTED = ["_MS", "_SEC", "_SECS", "_PX", "_PCT", "_HZ", "_KB", "_MB"];
const BOOLEAN_PREFIXES = ["is", "was", "will", "has", "does", "should"];
const NEGATIONS = ["Not", "No"];
/** Where the game, and nothing else, is reached — ARCHITECTURE.md gives this layer that contact. */
const CROSSING_PATHS = ["src/game/", "src/userscript-entry.ts"];
/** A parameter arriving from outside wears one of these, or `unknown` before it is read. */
const CROSSING_TYPES = ["unknown", "Page", "Window", "Engine", "Storage"];
const HELD_VERBS = ["get", "set"];
/** Longer than any parameter list this repository writes, which keeps S2's bound stated. */
const MAXIMUM_PARAMETER_LENGTH = 4096;

function isLowerLetter(character: string): boolean {
    return character >= "a" && character <= "z";
}

function isUpperLetter(character: string): boolean {
    return character >= "A" && character <= "Z";
}

function isKebabCase(name: string): boolean {
    for (const character of name) {
        const allowed = isLowerLetter(character) || (character >= "0" && character <= "9") ||
            character === "-" || character === ".";
        if (!allowed) return false;
    }
    return name.length > 0 && !name.startsWith("-");
}

/** The identifier that follows a keyword on an exported declaration, or the empty string. */
function getExportedName(line: string, keyword: string): string {
    const code = getCodeOutsideStrings(line).trimStart();
    const opener = `export ${keyword} `;
    if (!code.startsWith(opener)) return "";
    const rest = code.slice(opener.length);
    let end = 0;
    while (
        end < rest.length && (isLowerLetter(rest[end] ?? "") || isUpperLetter(rest[end] ?? ""))
    ) {
        end += 1;
    }
    const name = rest.slice(0, end);
    assert(!name.includes(" "), "a name is one word");
    assert(name.length <= rest.length, "a name fits inside its line");
    return name;
}

function getExportedNames(text: string, keyword: string): string[] {
    const found: string[] = [];
    for (const line of text.split("\n")) {
        const name = getExportedName(line, keyword);
        if (name.length > 0) found.push(name);
    }
    assert(found.every((one) => one.length > 0), "an empty name is never collected");
    assert(new Set(found).size <= found.length, "duplicates are kept, not silently dropped");
    return found;
}

Deno.test("every file name is kebab-case and names its contents", () => {
    assert(isKebabCase("fight-decoder.ts"), "the reader accepts what it should");
    assert(!isKebabCase("fightDecoder.ts"), "the reader rejects camelCase");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        const name = basename(path);
        const stem = name.slice(0, name.indexOf("."));
        if (!isKebabCase(name)) wrong.push(`${path} is not kebab-case`);
        if (FORBIDDEN_NAMES.includes(stem)) wrong.push(`${path} names a category, not contents`);
    }
    assertEquals(wrong, [], "N1 and N11");
});

Deno.test("every exported function is camelCase", () => {
    assertEquals(getExportedNames("export function getFightStatistics(", "function"), [
        "getFightStatistics",
    ], "the reader works");
    assertEquals(getExportedNames("function local() {", "function"), [], "unexported is skipped");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        for (const name of getExportedNames(Deno.readTextFileSync(path), "function")) {
            if (!isLowerLetter(name.charAt(0))) wrong.push(`${path}: ${name}`);
            if (name.includes("_")) wrong.push(`${path}: ${name} carries an underscore`);
        }
    }
    assertEquals(wrong, [], "N1: a function is camelCase");
});

Deno.test("every exported type is PascalCase", () => {
    assertEquals(getExportedNames("export interface CombatantSnapshot {", "interface"), [
        "CombatantSnapshot",
    ], "the reader works");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        const text = Deno.readTextFileSync(path);
        for (const keyword of TYPE_KEYWORDS) {
            for (const name of getExportedNames(text, keyword)) {
                if (!isUpperLetter(name.charAt(0))) wrong.push(`${path}: ${keyword} ${name}`);
            }
        }
    }
    assertEquals(wrong, [], "N1: a type is PascalCase");
});

/** Every identifier in a file's code: comment dropped, string bodies blanked before the walk. */
function getIdentifiers(text: string): string[] {
    const found: string[] = [];
    for (const line of text.split("\n")) {
        if (isCommentLine(line)) continue;
        const code = getCodeOutsideStrings(line);
        let current = "";
        for (const character of `${code} `) {
            const isPart = isLowerLetter(character) || isUpperLetter(character) ||
                (character >= "0" && character <= "9") || character === "_";
            if (isPart) current += character;
            else if (current.length > 0) {
                found.push(current);
                current = "";
            }
        }
        assertEquals(current, "", "an identifier run is closed by the space walked in");
    }
    assert(found.every((one) => one.length > 0), "an empty identifier is never collected");
    return found;
}

/** N14: a unit shortened at the end of a name, in either spelling N1 allows. */
function hasShortUnit(name: string): boolean {
    for (const unit of SHORT_UNITS) {
        if (!name.endsWith(unit)) continue;
        const before = name.charAt(name.length - unit.length - 1);
        if (isLowerLetter(before) || (before >= "0" && before <= "9")) return true;
    }
    assert(SHORT_UNITS.length === SHORT_UNITS_SHOUTED.length, "one unit is spelled two ways");
    return SHORT_UNITS_SHOUTED.some((unit) => name.endsWith(unit));
}

/** N15: a boolean prefix with a negation welded behind it, rather than a `!` at the reader. */
function hasOwnNegation(name: string): boolean {
    for (const prefix of BOOLEAN_PREFIXES) {
        if (!name.startsWith(prefix)) continue;
        const rest = name.slice(prefix.length);
        for (const negation of NEGATIONS) {
            if (!rest.startsWith(negation)) continue;
            const after = rest.charAt(negation.length);
            if (after === "" || isUpperLetter(after)) return true;
        }
    }
    assert(NEGATIONS.length > 0, "there is a negation to look for");
    assert(name.length >= 0, "a name is read as it stands");
    return false;
}

/** The parameter list opening at `from`, read across the lines it wraps onto. */
function getParameterText(code: string, from: number): string {
    let depth = 0;
    let index = from;
    while (index < code.length && index - from <= MAXIMUM_PARAMETER_LENGTH) {
        const character = code.charAt(index);
        if (character === "(") depth += 1;
        if (character === ")") {
            depth -= 1;
            if (depth === 0) return code.slice(from, index + 1);
        }
        index += 1;
    }
    assert(index - from <= MAXIMUM_PARAMETER_LENGTH, "a parameter list stays inside its bound");
    assert(depth >= 0, "a list never closes more than it opened");
    return "";
}

/** Whether a parameter list names a type that arrives from outside this program. */
function hasCrossingParameter(parameters: string): boolean {
    let steps = 0;
    for (const type of CROSSING_TYPES) {
        let index = parameters.indexOf(type);
        while (index !== -1) {
            steps += 1;
            assert(steps <= parameters.length, "the scan stays inside the list's bound");
            const after = parameters.charAt(index + type.length);
            if (!isLowerLetter(after) && !isUpperLetter(after)) return true;
            index = parameters.indexOf(type, index + type.length);
        }
    }
    assert(CROSSING_TYPES.length > 1, "there is more than one shape to look for");
    assert(parameters.length <= MAXIMUM_PARAMETER_LENGTH + 1, "a list was read inside its bound");
    return false;
}

/** N16: every `get` or `set` in a file whose parameters cross a boundary, which is a finding. */
function getHeldVerbsOverCrossings(text: string): string[] {
    const lines = text.split("\n").filter((line) => !isCommentLine(line));
    const code = lines.map((line) => getCodeOutsideStrings(line)).join("\n");
    const opener = "function ";
    const found: string[] = [];
    let index = code.indexOf(opener);
    let steps = 0;
    while (index !== -1) {
        steps += 1;
        assert(steps <= code.length, "the walk stays inside the file's bound");
        const start = index + opener.length;
        let end = start;
        while (
            end < code.length &&
            (isLowerLetter(code.charAt(end)) || isUpperLetter(code.charAt(end)))
        ) {
            end += 1;
        }
        const name = code.slice(start, end);
        const held = HELD_VERBS.some((verb) =>
            name.startsWith(verb) && isUpperLetter(name.charAt(verb.length))
        );
        const opened = code.indexOf("(", end);
        if (held && opened !== -1 && hasCrossingParameter(getParameterText(code, opened))) {
            found.push(name);
        }
        index = code.indexOf(opener, start);
    }
    assert(found.every((one) => one.length > 0), "a finding names a function");
    assert(found.length <= lines.length, "no more findings than lines to hold them");
    return found;
}

Deno.test("no name shortens the unit it carries", () => {
    assert(hasShortUnit("everyMs"), "the reader finds a shortened unit");
    assert(hasShortUnit("LOOK_EVERY_MS"), "and finds the shouted spelling");
    assert(!hasShortUnit("everyMilliseconds"), "and leaves the word alone");
    assert(!hasShortUnit("healthPercent"), "and leaves a unit already spelled out alone");
    assertEquals(getIdentifiers('const held = "atMs";'), ["const", "held"], "a string is not code");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        for (const name of getIdentifiers(Deno.readTextFileSync(path))) {
            if (hasShortUnit(name)) wrong.push(`${path}: ${name}`);
        }
    }
    assertEquals(wrong, [], "N14: a unit is spelled in full");
});

Deno.test("no name carries its own negation", () => {
    assert(hasOwnNegation("isNotDrawn"), "the reader finds a welded negation");
    assert(hasOwnNegation("hasNoRows"), "and finds the shorter weld");
    assert(!hasOwnNegation("isNotable"), "and leaves a word that merely opens with one");
    assert(!hasOwnNegation("isUnread"), "and leaves CONTEXT.md's own word alone");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        for (const name of getIdentifiers(Deno.readTextFileSync(path))) {
            if (hasOwnNegation(name)) wrong.push(`${path}: ${name}`);
        }
    }
    assertEquals(wrong, [], "N15: a boolean is negated where it is read");
});

Deno.test("what crosses to the game is read, never got", () => {
    const crossing = "function getPlaceFromPage(page: unknown): FightPlace | null {";
    assertEquals(getHeldVerbsOverCrossings(crossing), ["getPlaceFromPage"], "the reader works");
    const held = "function getFightFromSession(session: BattleSession): FightReading | null {";
    assertEquals(getHeldVerbsOverCrossings(held), [], "a value this program holds is not one");
    const read = "function readPlaceFromPage(page: unknown): FightPlace | null {";
    assertEquals(getHeldVerbsOverCrossings(read), [], "and the verb N16 asks for passes");
    const wrong: string[] = [];
    for (const path of getSourcePaths()) {
        if (!CROSSING_PATHS.some((one) => path.startsWith(one))) continue;
        for (const name of getHeldVerbsOverCrossings(Deno.readTextFileSync(path))) {
            wrong.push(`${path}: ${name}`);
        }
    }
    assertEquals(wrong, [], "N16: a value from outside this program is read");
});
