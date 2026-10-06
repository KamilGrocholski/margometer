/**
 * `docs/browser-support.md` against what the bundle spells. The stylesheet is one string a step of
 * type, so every property, `property: value` pair, function and pseudo-class it spells is read off
 * it at every step and must carry an entry, and every entry must name something it still spells. A
 * property one engine answers only under a prefix is spelled under it as often as bare. Each row of
 * the DOM and JavaScript tables names a construct the file beside it still spells, and both tiers
 * at the top are re-earned as the maximum over the rows under them. Text is walked, C7.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { parseDecimal } from "#/libs/number-text.ts";
import { TYPE_STEPS } from "#/src/ui/panel-choice.ts";
import { composeStyleSheet } from "#/src/ui/panel-look.ts";
import { parseSection } from "#/tests/markdown-document.ts";
import { parseTableRows } from "#/tests/register-table.ts";
import { readBundleFiles } from "#/tests/source-tree.ts";
import { readRules } from "#/tests/style-sheet.ts";

interface StyleConstructs {
    properties: Set<string>;
    pairs: Set<string>;
    functions: Set<string>;
    selectors: Set<string>;
}

/** A row of a floor table: what it names, the cell beside that, and a version per engine. */
interface FloorRow {
    constructs: string[];
    detail: string;
    versions: number[];
}

const REGISTER_PATH = "docs/browser-support.md";
const FLOOR_HEADING = "## The floor";
const TARGET_HEADING = "## The one it is developed against";
const STYLE_FLOOR_HEADING = "### What sets the floor";
const PREFIXED_HEADING = "### Prefixed";
const SETTLED_HEADING = "### Settled";
const DOM_HEADING = "## The DOM";
const SCRIPT_HEADING = "## JavaScript";
const PATTERNS_HEADING = "### Patterns, and the part no compiler holds";
/** The four settled lists, in the order the document writes them. */
const SETTLED_LABELS = ["Properties:", "Pairs:", "Functions:", "Selectors:"];
const ENGINES = ["Chrome / Edge", "Firefox", "Safari"];
const RUNS_TIER = "**Runs correctly**";
const LOOKS_TIER = "**Looks as designed**";
const RUNS_CELL = "runs";
/** What a version cell says of an engine that never shipped the construct under that name. */
const NEVER = "never";
const PREFIX = "-webkit-";
const BACKTICK = "`";
/** A group whose content states no keyword: a token's name, or the address of an image. */
const OPAQUE_GROUP_OPENERS = ["var(", "url("];
const QUOTE = '"';
/** Between two entries of a settled list, so an entry's own words never read as another entry. */
const SETTLED_SEPARATOR = "·";
const CUSTOM_PROPERTY_OPENER = "--";
/** The sheet at its longest: 19763 characters over `composeStyleSheet` at each step, 2026-10-06. */
const SHEET_LENGTH_MAXIMUM = 32768;
/** No property, keyword, function or pseudo-class the sheet spells runs anywhere near this. */
const NAME_LENGTH_MAXIMUM = 64;

Deno.test("every construct the stylesheet spells carries an entry in the register", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const tabled = new Set(parseStyleTableConstructs(register));
    const settled = parseSettledConstructs(register);
    const spelled = composeSheetConstructs();
    const kinds: [string, Set<string>, string][] = [
        ["a property", spelled.properties, "Properties:"],
        ["a pair", spelled.pairs, "Pairs:"],
        ["a function", spelled.functions, "Functions:"],
        ["a selector", spelled.selectors, "Selectors:"],
    ];
    for (const [kind, constructs, label] of kinds) {
        const listed = new Set(settled.get(label) ?? []);
        const unregistered = [...constructs].filter((construct) => {
            if (tabled.has(construct)) return false;
            return !listed.has(construct);
        });
        assertEquals(unregistered.sort(), [], `${kind} the sheet spells carries an entry`);
    }
});

/** What every step of type spells, together: a construct one step alone spells still ships. */
function composeSheetConstructs(): StyleConstructs {
    const spelled: StyleConstructs = {
        properties: new Set(),
        pairs: new Set(),
        functions: new Set(),
        selectors: new Set(),
    };
    for (const step of TYPE_STEPS) {
        const stepConstructs = parseStyleConstructs(composeStyleSheet(step));
        for (const property of stepConstructs.properties) spelled.properties.add(property);
        for (const pair of stepConstructs.pairs) spelled.pairs.add(pair);
        for (const name of stepConstructs.functions) spelled.functions.add(name);
        for (const name of stepConstructs.selectors) spelled.selectors.add(name);
    }
    assert(spelled.properties.size > 0, "the sheet spells properties");
    return spelled;
}

function parseStyleConstructs(sheet: string): StyleConstructs {
    assert(sheet.length <= SHEET_LENGTH_MAXIMUM, "a sheet stays inside its stated bound");
    const spelled: StyleConstructs = {
        properties: new Set(),
        pairs: new Set(),
        functions: new Set(parseFunctionNames(sheet)),
        selectors: new Set(),
    };
    for (const rule of readRules(sheet)) {
        for (const name of parseSelectorNames(rule.selector)) spelled.selectors.add(name);
        for (const declaration of parseDeclarations(rule.body)) {
            const colonIndex = declaration.indexOf(":");
            if (colonIndex === -1) continue;
            const property = declaration.slice(0, colonIndex).trim();
            // A custom property is ours; the register is about what a browser has to know.
            if (property.startsWith(CUSTOM_PROPERTY_OPENER)) continue;
            spelled.properties.add(property);
            for (const word of parseValueWords(declaration.slice(colonIndex + 1))) {
                spelled.pairs.add(`${property}: ${word}`);
            }
        }
    }
    assert(spelled.properties.size > 0, "a sheet spells properties");
    return spelled;
}

function parseFunctionNames(sheet: string): string[] {
    const names: string[] = [];
    for (let index = 0; index < sheet.length; index += 1) {
        if (sheet[index] !== "(") continue;
        let name = "";
        for (let start = index - 1; start >= 0; start -= 1) {
            const character = sheet.charAt(start);
            if (!isWordCharacter(character)) break;
            name = character + name;
        }
        assert(name.length <= NAME_LENGTH_MAXIMUM, "a function name stays inside its bound");
        if (name.length > 0) names.push(name);
    }
    return names;
}

/** Every pseudo-class and pseudo-element a selector reaches for; a class of ours is not one. */
function parseSelectorNames(selector: string): string[] {
    const names: string[] = [];
    for (let index = 0; index < selector.length; index += 1) {
        if (selector[index] !== ":") continue;
        if (selector[index + 1] === ":") continue;
        const name = parseWordFrom(selector, index + 1);
        if (name.length > 0) names.push(name);
    }
    return names;
}

/** Split on the semicolons a rule puts between declarations, not on any inside a function. */
function parseDeclarations(body: string): string[] {
    const declarations: string[] = [];
    let depth = 0;
    let declarationStart = 0;
    for (let index = 0; index < body.length; index += 1) {
        const character = body.charAt(index);
        if (character === "(") depth += 1;
        else if (character === ")") depth -= 1;
        else if (character === ";") {
            if (depth === 0) {
                declarations.push(body.slice(declarationStart, index));
                declarationStart = index + 1;
            }
        }
    }
    assertStrictEquals(depth, 0, "a rule closes every group it opens");
    const trailing = body.slice(declarationStart);
    if (trailing.trim() !== "") declarations.push(trailing);
    return declarations;
}

/**
 * The keywords a value states, which is what a `property: value` pair is a pair of. A token
 * reference, an address and a string state none: the document counts `var` and `url` among the
 * functions and stops there.
 */
function parseValueWords(valueText: string): string[] {
    assert(
        valueText.length <= SHEET_LENGTH_MAXIMUM,
        "a value stays inside the sheet's stated bound",
    );
    const words: string[] = [];
    let opaqueDepth = 0;
    let isQuoted = false;
    for (let index = 0; index < valueText.length; index += 1) {
        const character = valueText.charAt(index);
        if (character === QUOTE) {
            isQuoted = !isQuoted;
            continue;
        }
        if (isQuoted) continue;
        if (opaqueDepth > 0) {
            if (character === "(") opaqueDepth += 1;
            else if (character === ")") opaqueDepth -= 1;
            continue;
        }
        const opener = OPAQUE_GROUP_OPENERS.find((candidate) =>
            valueText.startsWith(candidate, index)
        );
        if (opener !== undefined) {
            opaqueDepth = 1;
            index += opener.length - 1;
            continue;
        }
        if (!isWordCharacter(character)) continue;
        // A word another word or a digit runs into is a unit or a fragment, not a value of its own.
        if (isTightCharacter(valueText.charAt(index - 1))) continue;
        const word = parseWordFrom(valueText, index);
        if (valueText.charAt(index + word.length) === "(") continue;
        if ([...word].some(isLetter)) words.push(word);
    }
    assertStrictEquals(opaqueDepth, 0, "a value closes every group it opens");
    assert(!isQuoted, "a value closes every string it opens");
    return words;
}

function parseWordFrom(text: string, start: number): string {
    let end = start;
    for (; end < text.length; end += 1) {
        if (!isWordCharacter(text.charAt(end))) break;
    }
    assert(end - start <= NAME_LENGTH_MAXIMUM, "a word stays inside its stated bound");
    return text.slice(start, end);
}

function isLetter(character: string): boolean {
    if (character >= "a" && character <= "z") return true;
    return character >= "A" && character <= "Z";
}

function isWordCharacter(character: string): boolean {
    if (isLetter(character)) return true;
    return character === "-";
}

function isTightCharacter(character: string): boolean {
    if (isWordCharacter(character)) return true;
    if (character >= "0" && character <= "9") return true;
    return character === ".";
}

/** The first construct of every row in the two CSS tables, which is where one is named. */
function parseStyleTableConstructs(register: string): string[] {
    const sections: [string, string, number][] = [
        [STYLE_FLOOR_HEADING, PREFIXED_HEADING, 2 + ENGINES.length],
        [PREFIXED_HEADING, SETTLED_HEADING, 1 + ENGINES.length],
    ];
    const constructs: string[] = [];
    for (const [opening, closing, cells] of sections) {
        const section = parseSection(register, opening, closing);
        for (const row of parseTableRows(section, opening, cells)) {
            const [construct] = parseQuotedNames(row[0] ?? "");
            if (construct !== undefined) constructs.push(construct);
        }
    }
    assert(constructs.length > 0, "the register carries tables naming constructs");
    return constructs;
}

/** Everything between a pair of backticks. */
function parseQuotedNames(text: string): string[] {
    const names: string[] = [];
    let from = 0;
    for (let step = 0; step < text.length; step += 1) {
        const open = text.indexOf(BACKTICK, from);
        if (open === -1) break;
        const close = text.indexOf(BACKTICK, open + 1);
        if (close === -1) break;
        names.push(text.slice(open + 1, close));
        from = close + 1;
    }
    return names;
}

/** The four settled lists, each read from its label up to the next one, an entry a name apiece. */
function parseSettledConstructs(register: string): Map<string, string[]> {
    const section = parseSection(register, SETTLED_HEADING, DOM_HEADING);
    const settled = new Map<string, string[]>();
    for (const [offset, label] of SETTLED_LABELS.entries()) {
        const labelIndex = section.indexOf(label);
        assert(labelIndex !== -1, `the settled section lists ${label}`);
        const following = SETTLED_LABELS[offset + 1];
        const end = following === undefined ? section.length : section.indexOf(following);
        assert(end > labelIndex, `${label} stands before the list after it`);
        const entries = section.slice(labelIndex, end).split(SETTLED_SEPARATOR);
        settled.set(
            label,
            entries.flatMap((settledEntry) => parseQuotedNames(settledEntry).slice(0, 1)),
        );
    }
    return settled;
}

Deno.test("every entry in the register names something the stylesheet still spells", () => {
    // A register that only grows describes a panel that stopped existing.
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const settled = parseSettledConstructs(register);
    const spelled = composeSheetConstructs();
    const kinds: [string, Set<string>, string][] = [
        ["a property", spelled.properties, "Properties:"],
        ["a pair", spelled.pairs, "Pairs:"],
        ["a function", spelled.functions, "Functions:"],
        ["a selector", spelled.selectors, "Selectors:"],
    ];
    for (const [kind, constructs, label] of kinds) {
        const listed = settled.get(label) ?? [];
        assert(listed.length > 0, `the settled section lists something under ${label}`);
        const stale = listed.filter((construct) => !constructs.has(construct));
        assertEquals(stale.sort(), [], `${kind} the register settles is one the sheet spells`);
    }
    const tabledStale = parseStyleTableConstructs(register).filter((construct) => {
        if (spelled.properties.has(construct)) return false;
        return !spelled.pairs.has(construct);
    });
    assertEquals(tabledStale, [], "a construct a CSS table names is one the sheet spells");
});

Deno.test("a property an engine answers only under a prefix is spelled as often under it", () => {
    // Safari answers `user-select` under no other name: spelled bare alone, a drag by the title bar
    // selected the text under the cursor. Counting keeps a third rule from leaving Safari out.
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const section = parseSection(register, PREFIXED_HEADING, SETTLED_HEADING);
    const rows = parseTableRows(section, PREFIXED_HEADING, 1 + ENGINES.length).filter((row) =>
        (row[0] ?? "").startsWith(BACKTICK)
    );
    const prefixedNames = rows.map((row) => parseQuotedNames(row[0] ?? "")[0] ?? "");
    const bareRows = rows.filter((row) => row.slice(1).includes(NEVER));
    assert(bareRows.length > 0, "the register carries a property an engine never answers bare");
    for (const bareRow of bareRows) {
        const bare = parseQuotedNames(bareRow[0] ?? "")[0] ?? "";
        const prefixed = PREFIX + bare;
        assert(prefixedNames.includes(prefixed), `${bare} has ${prefixed} registered beside it`);
        for (const step of TYPE_STEPS) {
            const sheet = composeStyleSheet(step);
            const bareCount = countPropertyDeclarations(sheet, bare);
            assert(bareCount > 0, `${bare} is a property the ${step} sheet spells`);
            assertStrictEquals(
                countPropertyDeclarations(sheet, prefixed),
                bareCount,
                `every ${bare} the ${step} sheet declares has ${prefixed} beside it`,
            );
        }
    }
});

function countPropertyDeclarations(sheet: string, property: string): number {
    let count = 0;
    for (const rule of readRules(sheet)) {
        for (const declaration of parseDeclarations(rule.body)) {
            const colonIndex = declaration.indexOf(":");
            if (colonIndex === -1) continue;
            if (declaration.slice(0, colonIndex).trim() === property) count += 1;
        }
    }
    return count;
}

Deno.test("the sheet reader finds its subject, and does not find what is not there", () => {
    const spelled = parseStyleConstructs(".a{display:flex;border:1px solid var(--MargoMeter-x);}");
    assert(spelled.properties.has("display"), "a property is found");
    assert(spelled.pairs.has("display: flex"), "and the value it states");
    assert(spelled.pairs.has("border: solid"), "a keyword beside a length is found");
    assert(!spelled.pairs.has("border: px"), "a unit is not a keyword");
    assert(!spelled.pairs.has("border: MargoMeter-x"), "and a token's own name is not one either");
    assert(spelled.functions.has("var"), "a function is found");
    assertEquals([...spelled.selectors], [], "and a class of ours is not a pseudo-class");
    const pseudo = parseStyleConstructs(".a:hover::before{color:currentColor;--b:none;}");
    assertEquals([...pseudo.selectors].sort(), ["before", "hover"], "both pseudo spellings read");
    assert(pseudo.pairs.has("color: currentColor"), "a camel-cased keyword is one word");
    assertEquals([...pseudo.properties], ["color"], "and a custom property is not a browser's");
    assertEquals(parseValueWords("calc(5px - 2px)"), [], "arithmetic states no keyword");
    assertEquals(parseValueWords("-45deg"), [], "and neither does a signed unit");
    assertEquals(parseValueWords("var(--a,var(--b)) none"), ["none"], "a reference states none");
    assertEquals(parseValueWords("url(a b) none"), ["none"], "and an address states none");
    assertEquals(parseValueWords(`"a b" none`), ["none"], "nor does a string");
    const selection = ".a{user-select:none;-webkit-user-select:none}.b{user-select:none}";
    assertStrictEquals(countPropertyDeclarations(selection, "user-select"), 2, "bare, twice");
    assertStrictEquals(countPropertyDeclarations(selection, "-webkit-user-select"), 1, "once");
});

Deno.test("every construct a DOM or JavaScript row names is still spelled where it says", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const bundle = new Map(readBundleFiles().map((file) => [file.path, file.text]));
    const rows = [
        ...parseFloorRows(parseSection(register, DOM_HEADING, SCRIPT_HEADING), DOM_HEADING),
        ...parseScriptFloorRows(register),
    ];
    for (const row of rows) {
        const path = parseQuotedNames(row.detail)[0] ?? "";
        const text = bundle.get(path);
        assertExists(text, `${row.constructs.join(", ")} names a file that ships, not ${path}`);
        for (const construct of row.constructs) {
            assert(text.includes(construct), `${path} spells ${construct}, as its row says`);
        }
    }
});

/** `| \`name\` | detail | a | b | c |`, with each version read as a number to be compared. */
function parseFloorRows(section: string, heading: string): FloorRow[] {
    const rows: FloorRow[] = [];
    for (const cells of parseTableRows(section, heading, 2 + ENGINES.length)) {
        const constructs = parseQuotedNames(cells[0] ?? "");
        if (constructs.length === 0) continue;
        const versions = cells.slice(2).map((cell) => parseDecimal(cell));
        const stated = versions.filter((version) => version !== null);
        assertStrictEquals(
            stated.length,
            ENGINES.length,
            `${cells[0]} states a version per engine`,
        );
        rows.push({ constructs, detail: cells[1] ?? "", versions: stated });
    }
    assert(rows.length > 0, `a floor table stands under ${heading}`);
    return rows;
}

function parseScriptFloorRows(register: string): FloorRow[] {
    return parseFloorRows(parseSection(register, SCRIPT_HEADING, PATTERNS_HEADING), SCRIPT_HEADING);
}

/**
 * The floor at the top, re-earned. `Runs correctly` is the maximum over the rows a failure would
 * break, and `Looks as designed` over every row there is; the prefixed pair stands under a heading
 * of its own, which the document says is outside the arithmetic.
 */
Deno.test("each tier is the highest version the rows under it ask for", () => {
    const register = Deno.readTextFileSync(REGISTER_PATH);
    const style = parseFloorRows(
        parseSection(register, STYLE_FLOOR_HEADING, PREFIXED_HEADING),
        STYLE_FLOOR_HEADING,
    );
    const script = parseScriptFloorRows(register);
    const runs = style.filter((row) => row.detail === RUNS_CELL);
    assert(runs.length > 0, "some style rows are a matter of running correctly");
    assertEquals(
        parseStatedFloor(register, RUNS_TIER),
        composeFloorVersions([...runs, ...script]),
        "what runs correctly is the highest the correctness rows ask for",
    );
    assertEquals(
        parseStatedFloor(register, LOOKS_TIER),
        composeFloorVersions([...style, ...script]),
        "and what looks as designed is the highest anything asks for",
    );
});

/** What a tier row at the top states, read back as numbers. */
function parseStatedFloor(register: string, tier: string): number[] {
    const section = parseSection(register, FLOOR_HEADING, TARGET_HEADING);
    const [row] = parseTableRows(section, FLOOR_HEADING, 1 + ENGINES.length).filter((cells) =>
        cells[0] === tier
    );
    assertExists(row, `the floor states ${tier}`);
    return row.slice(1).map((cell) => parseDecimal(cell) ?? Number.NaN);
}

function composeFloorVersions(rows: readonly FloorRow[]): number[] {
    assert(rows.length > 0, "a floor is the highest of some rows");
    return ENGINES.map((_, engineIndex) =>
        Math.max(...rows.map((row) => row.versions[engineIndex] ?? Number.NaN))
    );
}

Deno.test("the floor reader finds its subject, and reads a version rather than a word", () => {
    const heading = "## Sample";
    const sample = `${heading}\n| \`replaceAll\`, \`at\` | \`src/sample.ts\` | 85 | 77 | 13.1 |`;
    const [row] = parseFloorRows(sample, heading);
    assertExists(row, "a row is read out of a table line");
    assertEquals(row.constructs, ["replaceAll", "at"], "every construct its first cell names");
    assertEquals(row.versions, [85, 77, 13.1], "and a fractional version is a number");
    const tier =
        `${sample}\n| **Runs correctly** | 93 | 91 | 16 |\n| Construct | Where | a | b | c |`;
    assertStrictEquals(parseFloorRows(tier, heading).length, 1, "a tier or a header is no row");
});
