/**
 * The construct register in `ARCHITECTURE.md`, against the tree it describes.
 *
 * A construct with more than one spelling in JavaScript, or one that answers with a value nobody
 * wrote, belongs to one owner file so a reading has one address. Nothing held that: measuring the
 * register by hand on 2026-08-30 found three rows stale, and writing this found a fourth.
 *
 * ⚠️ **The register binds where the program is** — `libs/`, `project/`, `src/` and `tools/`, the
 * same scope **S5** measures. A test spelling `Number()` to read a written figure back is the test
 * doing its job, not the owner losing its address; the register named that question open and this
 * is the answer.
 */

import { assert, assertEquals, assertNotStrictEquals } from "@std/assert";
import { getCodeOutsideStrings } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const REGISTER_HEADING = "## Construct register";
const NEXT_HEADING = "## Protected contracts";
/** The code that ships and the code that runs, which is what the register is about. */
const SHIPPED_ROOTS = ["libs/", "project/", "src/", "tools/"];
const UNOWNED = ["planned", "nobody"];

/**
 * A spelling this guard can look for, against the row that names it. A row naming a construct in
 * prose — `typeof … === "object"`, `unary +` — states a rule no substring finds, and is read by
 * the register's own reader rather than by this one.
 */
const SEARCHED: Record<string, string> = {
    "Number()": "Number(",
    "toFixed": ".toFixed(",
    "String()": "String(",
    "parseInt": "parseInt(",
    "parseFloat": "parseFloat(",
    "JSON.parse": "JSON.parse(",
    "JSON.stringify": "JSON.stringify(",
    "Date.parse": "Date.parse(",
    "performance.now()": "performance.now(",
    "localeCompare": ".localeCompare(",
};

/**
 * A spelling outside its owner that the register accounts for, and what it is writing for. Each
 * writes for somebody else rather than for us, so the owner — which exists to make a value this
 * repository writes readable back — has nothing to say about it.
 */
const WRITTEN_FOR_SOMEBODY_ELSE: Record<string, string> = {
    "tools/preview-server.ts": "an HTTP body",
    "tools/preview-page.ts": "a value escaped into a tag, and browser script emitted as text",
    "tools/preview-state.ts": "browser script emitted as text",
    "tools/panel-screenshots.ts": "browser script emitted as text",
};

function getRegisterRows(): Array<{ names: string[]; owner: string }> {
    const document = Deno.readTextFileSync("ARCHITECTURE.md");
    const from = document.indexOf(REGISTER_HEADING);
    assertNotStrictEquals(from, -1, "the register is a section of its own");
    const until = document.indexOf(NEXT_HEADING, from);
    assert(until > from, "and it ends where the next section starts");
    const rows: Array<{ names: string[]; owner: string }> = [];
    for (const line of document.slice(from, until).split("\n")) {
        if (!line.startsWith("- `")) continue;
        const [stated, rest] = [line.slice(2).split(" — ")[0] ?? "", line.split(" — ")[1] ?? ""];
        rows.push({ names: getSpans(stated), owner: getSpans(rest)[0] ?? getUnowned(rest) });
    }
    assert(rows.length > 0, "an empty reading of the register is a finding, not a pass");
    return rows;
}

function getUnowned(rest: string): string {
    for (const word of UNOWNED) {
        if (rest.startsWith(`**${word}**`)) return word;
    }
    return "";
}

function getSpans(text: string): string[] {
    const found: string[] = [];
    let at = 0;
    for (let guard = 0; guard < text.length; guard += 1) {
        const opened = text.indexOf("`", at);
        if (opened === -1) break;
        const closed = text.indexOf("`", opened + 1);
        if (closed === -1) break;
        found.push(text.slice(opened + 1, closed));
        at = closed + 1;
    }
    return found;
}

const ROWS = getRegisterRows();

function getShippedPaths(): string[] {
    const paths = getSourcePaths().filter((one) => SHIPPED_ROOTS.some((r) => one.startsWith(r)));
    assert(paths.length > 0, "there is shipped TypeScript to measure");
    return paths;
}

function isNameCharacter(character: string): boolean {
    if (character >= "a" && character <= "z") return true;
    if (character >= "A" && character <= "Z") return true;
    if (character >= "0" && character <= "9") return true;
    return character === "_" || character === "$" || character === ".";
}

/**
 * ⚠️ **A spelling has to start at a boundary**, or `String(` is found inside `toISOString()` and
 * three files are charged with a construct none of them uses. A spelling that opens with its own
 * dot — `.toFixed(` — carries the boundary already and asks for none.
 */
function hasSpellingAt(code: string, spelling: string, at: number): boolean {
    assert(at >= 0, "a spelling found sits somewhere in the line");
    if (spelling.startsWith(".")) return true;
    if (at === 0) return true;
    return !isNameCharacter(code.charAt(at - 1));
}

function isSpelledIn(code: string, spelling: string): boolean {
    let at = code.indexOf(spelling);
    for (let guard = 0; guard < code.length; guard += 1) {
        if (at === -1) return false;
        if (hasSpellingAt(code, spelling, at)) return true;
        at = code.indexOf(spelling, at + 1);
    }
    return false;
}

function getFilesSpelling(spelling: string): string[] {
    const found = new Set<string>();
    for (const path of getShippedPaths()) {
        for (const line of Deno.readTextFileSync(path).split("\n")) {
            if (isSpelledIn(getCodeOutsideStrings(line), spelling)) found.add(path);
        }
    }
    return [...found].sort();
}

Deno.test("the register is read as rows, each naming a construct and an owner", () => {
    const owners = ROWS.map((row) => row.owner);
    assertEquals(
        owners.filter((one) => one === ""),
        [],
        "a row states an owner or says it has none",
    );
    assert(ROWS.some((row) => row.names.includes("JSON.parse")), "the reader finds a known row");
    assert(ROWS.some((row) => row.owner === "nobody"), "and a row owned by nobody");
    assertEquals(getSpans("`one` and `two`"), ["one", "two"], "spans are read in order");
    // The sample the reader must not flag, which cost three files a charge before it existed.
    assert(!isSpelledIn("new Date().toISOString()", "String("), "a name ending in one is not one");
    assert(isSpelledIn("const at = Number(key);", "Number("), "and one standing alone is");
});

Deno.test("every construct the register names an owner for is spelled only there", () => {
    const astray: string[] = [];
    for (const row of ROWS) {
        if (UNOWNED.includes(row.owner)) continue;
        for (const name of row.names) {
            const spelling = SEARCHED[name];
            if (spelling === undefined) continue;
            for (const path of getFilesSpelling(spelling)) {
                if (path === row.owner) continue;
                if (WRITTEN_FOR_SOMEBODY_ELSE[path] !== undefined) continue;
                astray.push(`${name} in ${path}, which ${row.owner} owns`);
            }
        }
    }
    assertEquals(astray, [], "a construct spelled outside the file that owns its reading");
});

Deno.test("a construct the register calls planned or nobody is spelled nowhere", () => {
    const arrived: string[] = [];
    for (const row of ROWS) {
        if (!UNOWNED.includes(row.owner)) continue;
        for (const name of row.names) {
            const spelling = SEARCHED[name];
            if (spelling === undefined) continue;
            for (const path of getFilesSpelling(spelling)) {
                arrived.push(`${name} in ${path}, and the register says ${row.owner}`);
            }
        }
    }
    assertEquals(arrived, [], "a row says nobody spells this and somebody does");
});

/**
 * The exception list from the other end. An entry that stops writing for somebody else, or stops
 * existing, is an entry nothing holds — and a list nobody prunes is how the exception becomes the
 * rule.
 */
Deno.test("every file this guard excuses still spells something the register owns", () => {
    const owned = new Set<string>();
    for (const row of ROWS) {
        if (UNOWNED.includes(row.owner)) continue;
        for (const name of row.names) {
            const spelling = SEARCHED[name];
            if (spelling !== undefined) owned.add(spelling);
        }
    }
    assert(owned.size > 0, "there are owned spellings to look for");
    for (const [path, writing] of Object.entries(WRITTEN_FOR_SOMEBODY_ELSE)) {
        assert(writing.length > 0, `${path} is excused for a stated reason`);
        const spells = [...owned].some((spelling) => getFilesSpelling(spelling).includes(path));
        assert(spells, `${path} no longer spells anything the register owns`);
    }
});
