/**
 * The guard `docs/browser-support.md` names in its first sentence.
 *
 * The stylesheet is one string, so what it spells is enumerable: every property, every
 * `property: value` pair, every function and every selector. This reads that enumeration off
 * `composeStyleSheet()` and requires each one to carry an entry — in a floor table or in the
 * settled lists — and requires each entry to name something the sheet still spells. Text is walked
 * rather than matched, C7.
 */

import { assert, assertEquals, assertExists, assertNotEquals } from "@std/assert";
import { getDecimalFromText } from "@/libs/number-text.ts";
import { composeStyleSheet } from "@/src/ui/panel-look.ts";

const REGISTER = "docs/browser-support.md";
/** The four settled lists, in the order the document writes them. */
const SETTLED_LABELS = ["Properties:", "Pairs:", "Functions:", "Selectors:"];
/** The sheet at its longest, measured over `composeStyleSheet()` on 2026-08-29. */
const LONGEST_SHEET = 20000;
/** No property, keyword, function or pseudo-class the sheet spells runs anywhere near this. */
const LONGEST_NAME = 64;

interface StyleConstructs {
    properties: Set<string>;
    pairs: Set<string>;
    functions: Set<string>;
    selectors: Set<string>;
}

function isLetter(character: string): boolean {
    if (character >= "a" && character <= "z") return true;
    return character >= "A" && character <= "Z";
}

function isWordCharacter(character: string): boolean {
    if (isLetter(character)) return true;
    return character === "-";
}

/** A word another word or a digit runs into is a unit or a fragment, not a value of its own. */
function isTightCharacter(character: string): boolean {
    if (isWordCharacter(character)) return true;
    if (character >= "0" && character <= "9") return true;
    return character === ".";
}

/**
 * A token reference is not a value word. The document counts `var` among the functions and stops
 * there, and without this every custom property's name reads as a keyword.
 */
function removeTokenReferences(value: string): string {
    assert(value.length <= LONGEST_SHEET, "a value stays inside the sheet's stated bound");
    let written = "";
    let at = 0;
    while (at < value.length) {
        if (!value.startsWith("var(", at)) {
            written += value[at];
            at += 1;
            continue;
        }
        let depth = 0;
        while (at < value.length) {
            if (value[at] === "(") depth += 1;
            if (value[at] === ")") {
                depth -= 1;
                if (depth === 0) {
                    at += 1;
                    break;
                }
            }
            at += 1;
        }
        written += " ";
    }
    assert(!written.includes("var("), "every token reference is taken out of a value");
    return written;
}

/** Selector and body, one rule at a time. */
function getRules(sheet: string): Array<[string, string]> {
    assert(sheet.length > 0, "a sheet says something");
    assert(sheet.length <= LONGEST_SHEET, "and stays inside its stated bound");
    const rules: Array<[string, string]> = [];
    let at = 0;
    while (at < sheet.length) {
        const open = sheet.indexOf("{", at);
        if (open === -1) break;
        const close = sheet.indexOf("}", open);
        if (close === -1) break;
        rules.push([sheet.slice(at, open), sheet.slice(open + 1, close)]);
        at = close + 1;
    }
    return rules;
}

/** Split on the semicolons a rule puts between declarations, not on any inside a function. */
function getDeclarations(body: string): string[] {
    assert(body.length <= LONGEST_SHEET, "a rule body stays inside the sheet's stated bound");
    const declarations: string[] = [];
    let depth = 0;
    let held = "";
    for (const character of body) {
        if (character === "(") depth += 1;
        if (character === ")") depth -= 1;
        if (character === ";" && depth === 0) {
            declarations.push(held);
            held = "";
            continue;
        }
        held += character;
    }
    if (held.trim() !== "") declarations.push(held);
    assertEquals(depth, 0, "a rule closes every group it opens");
    return declarations;
}

/** The keywords a value states, which is what a `property: value` pair is a pair of. */
function getValueWords(value: string): string[] {
    assert(value.length <= LONGEST_SHEET, "a value stays inside the sheet's stated bound");
    const words: string[] = [];
    for (let at = 0; at < value.length; at += 1) {
        if (!isWordCharacter(value[at] ?? "")) continue;
        if (at > 0 && isTightCharacter(value[at - 1] ?? "")) continue;
        let end = at;
        let word = "";
        while (end < value.length && isWordCharacter(value[end] ?? "")) {
            word += value[end];
            end += 1;
        }
        if (value[end] === "(") continue;
        if (![...word].some(isLetter)) continue;
        words.push(word);
    }
    return words;
}

/** Every pseudo-class and pseudo-element a selector reaches for; a class of ours is not one. */
function getSelectorNames(selector: string): string[] {
    assert(selector.length <= LONGEST_SHEET, "a selector stays inside the sheet's stated bound");
    const names: string[] = [];
    for (let at = 0; at < selector.length; at += 1) {
        if (selector[at] !== ":") continue;
        let end = at + 1;
        while (end < selector.length && selector[end] === ":") end += 1;
        let name = "";
        while (end < selector.length && isWordCharacter(selector[end] ?? "")) {
            name += selector[end];
            end += 1;
        }
        if (name.length > 0) names.push(name);
    }
    return names;
}

function getFunctionNames(sheet: string): string[] {
    assert(sheet.length <= LONGEST_SHEET, "a sheet stays inside its stated bound");
    const names: string[] = [];
    for (let at = 0; at < sheet.length; at += 1) {
        if (sheet[at] !== "(") continue;
        let start = at - 1;
        let name = "";
        while (start >= 0 && isWordCharacter(sheet[start] ?? "")) {
            assert(name.length <= LONGEST_NAME, "a function name stays inside its stated bound");
            name = sheet[start] + name;
            start -= 1;
        }
        if (name.length > 0) names.push(name);
    }
    assert(names.length <= sheet.length, "a function opens a group that is in the sheet");
    return names;
}

export function getStyleConstructs(sheet: string): StyleConstructs {
    const held: StyleConstructs = {
        properties: new Set(),
        pairs: new Set(),
        functions: new Set(getFunctionNames(sheet)),
        selectors: new Set(),
    };
    for (const [selector, body] of getRules(sheet)) {
        for (const name of getSelectorNames(selector)) held.selectors.add(name);
        for (const declaration of getDeclarations(body)) {
            const colon = declaration.indexOf(":");
            if (colon === -1) continue;
            const property = declaration.slice(0, colon).trim();
            // A custom property is ours; the register is about what a browser has to know.
            if (property.startsWith("--")) continue;
            held.properties.add(property);
            const value = removeTokenReferences(declaration.slice(colon + 1));
            for (const word of getValueWords(value)) held.pairs.add(`${property}: ${word}`);
        }
    }
    assert(held.properties.size > 0, "the sheet spells properties");
    assert(held.pairs.size > 0, "and states values for them");
    return held;
}

/** Everything between a pair of backticks on the lines this reader was handed. */
function getQuotedNames(text: string): string[] {
    assert(text.length <= LONGEST_SHEET * 2, "a section stays inside its stated bound");
    const names: string[] = [];
    let at = 0;
    while (at < text.length) {
        const open = text.indexOf("`", at);
        if (open === -1) break;
        const shut = text.indexOf("`", open + 1);
        if (shut === -1) break;
        names.push(text.slice(open + 1, shut));
        at = shut + 1;
    }
    return names;
}

/** The first cell of every row in a table, which is where a construct is named. */
function getTableConstructs(document: string): string[] {
    const found: string[] = [];
    for (const line of document.split("\n")) {
        if (!line.startsWith("| `")) continue;
        const named = getQuotedNames(line);
        const first = named[0];
        if (first !== undefined) found.push(first);
    }
    assert(found.length > 0, "the register carries tables naming constructs");
    return found;
}

/** The four settled lists, each read from its label up to the next one. */
function getSettledConstructs(document: string): Map<string, string[]> {
    const from = document.indexOf("### Settled");
    assertNotEquals(from, -1, "the register carries a settled section");
    const to = document.indexOf("\n## ", from);
    assertNotEquals(to, -1, "and the section ends at a heading");
    const section = document.slice(from, to);
    const held = new Map<string, string[]>();
    for (const [offset, label] of SETTLED_LABELS.entries()) {
        const at = section.indexOf(label);
        assertNotEquals(at, -1, `the settled section lists ${label}`);
        const next = SETTLED_LABELS[offset + 1];
        const end = next === undefined ? section.length : section.indexOf(next);
        held.set(label, getQuotedNames(section.slice(at, end)));
    }
    assertEquals(held.size, SETTLED_LABELS.length, "every settled list is read");
    return held;
}

function getRegister(): { document: string; settled: Map<string, string[]>; tabled: string[] } {
    const document = Deno.readTextFileSync(REGISTER);
    assert(document.length > 0, "the register says something");
    return {
        document,
        settled: getSettledConstructs(document),
        tabled: getTableConstructs(document),
    };
}

/** A construct is registered where it stands in a floor table or in the list for its kind. */
function getUnregistered(held: Set<string>, tabled: string[], settled: string[]): string[] {
    assert(settled.length > 0, "a settled list holds something");
    const known = new Set([...tabled, ...settled]);
    return [...held].filter((one) => !known.has(one)).sort();
}

Deno.test("every construct the stylesheet spells carries an entry in the register", () => {
    const { settled, tabled } = getRegister();
    const held = getStyleConstructs(composeStyleSheet());
    const kinds: Array<[string, Set<string>, string]> = [
        ["a property", held.properties, "Properties:"],
        ["a pair", held.pairs, "Pairs:"],
        ["a function", held.functions, "Functions:"],
        ["a selector", held.selectors, "Selectors:"],
    ];
    for (const [what, spelled, label] of kinds) {
        const listed = settled.get(label) ?? [];
        assertEquals(
            getUnregistered(spelled, tabled, listed),
            [],
            `${what} the sheet spells and the register does not name`,
        );
    }
});

Deno.test("every entry in the register names something the stylesheet still spells", () => {
    // The other direction, and the one that catches a register going quietly stale. A row removed
    // from the panel takes its entry with it, or the document goes on describing a panel that is
    // no longer there — which is how `line-height` and `first-of-type` outlived their rules.
    const { settled } = getRegister();
    const held = getStyleConstructs(composeStyleSheet());
    const kinds: Array<[string, Set<string>, string]> = [
        ["a property", held.properties, "Properties:"],
        ["a pair", held.pairs, "Pairs:"],
        ["a function", held.functions, "Functions:"],
        ["a selector", held.selectors, "Selectors:"],
    ];
    for (const [what, spelled, label] of kinds) {
        const listed = settled.get(label) ?? [];
        assert(listed.length > 0, `${label} lists something`);
        assertEquals(
            listed.filter((one) => !spelled.has(one)).sort(),
            [],
            `${what} the register names and the sheet no longer spells`,
        );
    }
});

Deno.test("a property spelled under a prefix is spelled as often as the bare one", () => {
    // Safari answers `user-select` under no other name, and while the sheet spelled only the
    // standard property a drag by the title bar selected the text under the cursor. Counting is
    // what keeps a third rule from leaving Safari out again.
    const { document } = getRegister();
    const sheet = composeStyleSheet();
    const prefixed = getTableConstructs(document).filter((one) => one.startsWith("-webkit-"));
    assert(prefixed.length > 0, "the register carries a prefixed spelling");
    for (const spelling of prefixed) {
        const bare = spelling.slice("-webkit-".length);
        const withPrefix = sheet.split(`${spelling}:`).length - 1;
        const without = sheet.split(`${bare}:`).length - 1 - withPrefix;
        assert(without > 0, `${bare} is spelled by the sheet`);
        assertEquals(
            withPrefix,
            without,
            `${bare} is spelled ${without} times, ${spelling} is not`,
        );
    }
});

Deno.test("the reader finds its subject, and does not find what is not there", () => {
    // A reader is proved by a sample it must flag and a sample it must not: the first catches one
    // that has stopped finding its subject, only the second catches one that finds too much.
    const held = getStyleConstructs("}.a{display:flex;border:1px solid var(--MargoMeter-x);}");
    assert(held.properties.has("display"), "a property is found");
    assert(held.pairs.has("display: flex"), "and the value it states");
    assert(held.pairs.has("border: solid"), "a keyword beside a length is found");
    assert(!held.pairs.has("border: px"), "a unit is not a keyword");
    assert(!held.pairs.has("border: MargoMeter-x"), "and a token's own name is not one either");
    assert(held.functions.has("var"), "a function is found");
    assertEquals([...held.selectors], [], "and a class of ours is not a pseudo-class");

    const pseudo = getStyleConstructs("}.a:hover::before{color:currentColor;}");
    assertEquals(
        [...pseudo.selectors].sort(),
        ["before", "hover"],
        "both pseudo spellings are read",
    );
    assert(pseudo.pairs.has("color: currentColor"), "a camel-cased keyword is one word");

    assertEquals(getValueWords("calc(5px - 2px)"), [], "arithmetic states no keyword");
    assertEquals(getValueWords("-45deg"), [], "and neither does a signed unit");
    assertEquals(removeTokenReferences("var(--a) none"), "  none", "a reference leaves a gap");
});

/**
 * The JavaScript half, and the arithmetic that ties both halves to the floor at the top.
 *
 * ⚠️ **This is not the CSS half's guard and cannot be.** The stylesheet is one string, so what it
 * spells is enumerable and a construct arriving with no entry fails. The sources are not, and
 * neither compiler option that would hold them works here: `deno check` **ignores** `target` in
 * `deno.json` and says so, and narrowing `lib` to `es2022` still accepts `findLast`, which is
 * ES2023 — both measured on 2026-08-30 by probing `libs/number-text.ts` and restoring it from a
 * copy. So a **new** construct reaching past the floor still passes, and `ARCHITECTURE.md` carries
 * that. What is held here is the register going stale, which is the failure that has actually
 * happened: a row naming a construct nothing spells any more, and a floor that stopped being the
 * maximum over the rows under it.
 */
const ENGINES = ["Chrome / Edge", "Firefox", "Safari"];
/** Rows above this floor are not the tier arithmetic's — the document says so at the table. */
const PREFIXED_HEADING = "### Prefixed";
const TIERS = ["**Runs correctly**", "**Looks as designed**"];

interface FloorRow {
    construct: string;
    second: string;
    versions: number[];
}

/** `| \`name\` | second | a | b | c |`, with a version read as a number so it can be compared. */
function getFloorRows(section: string): FloorRow[] {
    const rows: FloorRow[] = [];
    for (const line of section.split("\n")) {
        if (!line.startsWith("| `")) continue;
        const cells = line.split("|").map((one) => one.trim()).filter((one) => one !== "");
        if (cells.length !== 2 + ENGINES.length) continue;
        const versions = cells.slice(2).map((one) => getDecimalFromText(one) ?? 0);
        const construct = getQuotedNames(cells[0] ?? "")[0] ?? "";
        rows.push({ construct, second: cells[1] ?? "", versions });
    }
    assert(rows.length > 0, "a floor table names constructs");
    return rows;
}

function getSection(document: string, from: string, to: string): string {
    const start = document.indexOf(from);
    assertNotEquals(start, -1, `${from} is a section of the register`);
    const end = document.indexOf(to, start);
    assert(end > start, `${from} ends where ${to} starts`);
    return document.slice(start, end);
}

function getStyleFloorRows(document: string): FloorRow[] {
    return getFloorRows(getSection(document, "### What sets the floor", PREFIXED_HEADING));
}

function getScriptFloorRows(document: string): FloorRow[] {
    return getFloorRows(getSection(document, "## JavaScript", "### Patterns"));
}

/** What the tier tables at the top state, read back as numbers. */
function getStatedFloor(document: string, tier: string): number[] {
    const section = getSection(document, "## The floor", "## The one it is developed against");
    for (const line of section.split("\n")) {
        if (!line.startsWith(`| ${tier}`)) continue;
        const cells = line.split("|").map((one) => one.trim()).filter((one) => one !== "");
        return cells.slice(1).map((one) => getDecimalFromText(one) ?? 0);
    }
    return [];
}

function getHighest(rows: readonly FloorRow[]): number[] {
    return ENGINES.map((_, at) => Math.max(...rows.map((row) => row.versions[at] ?? 0)));
}

Deno.test("every construct the JavaScript register names is still spelled where it says", () => {
    const rows = getScriptFloorRows(Deno.readTextFileSync(REGISTER));
    assert(rows.length > 0, "the register names what decides the floor");
    for (const row of rows) {
        const path = getQuotedNames(row.second)[0] ?? "";
        assert(path.startsWith("src/"), `${row.construct} names a file that ships`);
        const source = Deno.readTextFileSync(path);
        assert(source.includes(row.construct), `${path} no longer spells ${row.construct}`);
        assert(
            row.versions.every((one) => one > 0),
            `${row.construct} states a version per engine`,
        );
    }
});

/**
 * The floor at the top, re-earned rather than remembered. `Runs correctly` is the maximum over the
 * rows a failure would break, and `Looks as designed` over every row there is — the prefixed pair
 * excluded, which the document states at that table and this reads from the section boundary.
 */
Deno.test("each tier is the highest version the rows under it ask for", () => {
    const document = Deno.readTextFileSync(REGISTER);
    const style = getStyleFloorRows(document);
    const script = getScriptFloorRows(document);
    const runs = style.filter((row) => row.second === "runs");
    assert(runs.length > 0, "some style rows are a matter of running correctly");
    assertEquals(
        getStatedFloor(document, TIERS[0] ?? ""),
        getHighest([...runs, ...script]),
        "what runs correctly is the highest the correctness rows ask for",
    );
    assertEquals(
        getStatedFloor(document, TIERS[1] ?? ""),
        getHighest([...style, ...script]),
        "and what looks as designed is the highest anything asks for",
    );
});

Deno.test("the floor reader finds its subject, and reads a version rather than a word", () => {
    const sample = "| `replaceAll` | `src/game/fight-capture.ts` | 85 | 77 | 13.1 |";
    const [row] = getFloorRows(sample);
    assertExists(row, "a row is read out of a table line");
    assertEquals(row.construct, "replaceAll", "the construct is the first cell");
    assertEquals(row.versions, [85, 77, 13.1], "and a fractional version is a number");
    // The sample it must not read: a tier row names no construct and sets no floor of its own.
    assertEquals(getFloorRows(`${sample}\n| **Runs correctly** | 93 | 91 | 16 |`).length, 1, "one");
});
