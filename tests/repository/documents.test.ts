/**
 * The rule documents, checked against themselves.
 *
 * Seven rounds of editing AGENTS.md were verified by hand before this file existed; each
 * check below is one that found a real defect. Text is walked rather than matched, because
 * C7 forbids a pattern and this file is the first place that rule costs anything.
 */

import {
    assert,
    assertArrayIncludes,
    assertEquals,
    assertExists,
    assertNotStrictEquals,
    assertStrictEquals,
} from "@std/assert";
import { existsSync, walkSync } from "@std/fs";
import { isCommentLine } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";
import { CONFIGURATION_FILE } from "@/project/repository-layout.ts";

const RULE_PREFIXES = "SAENCLVWG";
const MARKER = "`by-reading`";
const REGISTER_HEADING = "## Guard register";
const GUARD_DIRECTORY = "tests/repository";
/** What a test names when it reads a document of this repository rather than its code. */
const DOCUMENT_ENDING = '.md"';
/** Deeper than this is the description column, not another level of the tree. */
const MAXIMUM_INDENT = 6;
const AGENTS = Deno.readTextFileSync("AGENTS.md");

const CANONICAL = [
    "AGENTS.md",
    "PRODUCT.md",
    "CONTEXT.md",
    "ARCHITECTURE.md",
    "SECURITY.md",
    "DESIGN.md",
    "NOTICE.md",
    "captures/AGENTS.md",
    "frozen/AGENTS.md",
    "tests/AGENTS.md",
];

/** Where a document of this repository sits, beside the root's own. */
const DOCUMENT_DIRECTORIES = [".agents", "captures", "docs", "frozen", "tests"];

/** What `deno fmt` aligns and never wraps. A row opens with one, so a row is what is excused. */
const TABLE_OPENER = "|";

/**
 * ⚠️ **What is excused is a line, not a document.** Seven documents were named here for carrying
 * "a table", and naming the file excused its prose along with it. Measured 2026-09-11: of the
 * overlong lines in those seven, **every one is a table row and none is prose** — so the whole-file
 * excuse bought nothing and cost the column rule over four thousand lines of prose. The two
 * entries left are the ones a table rule cannot reach. Read both ways: a document here whose long
 * line is gone has outlived its excuse, and one that grows a long line of prose must be named.
 */
const UNWRAPPED_LINES: Record<string, string> = {
    ".agents/skills/verify/SKILL.md": "front matter, which is one line by the format's own rule",
    "TODO.md": "the maintainer's list, which nothing here reads and no tool here writes",
};

function isDigitCode(code: number): boolean {
    return code >= 48 && code <= 57;
}

function getDigitsAt(text: string, start: number): string {
    let index = start;
    while (index < text.length && isDigitCode(text.charCodeAt(index))) index += 1;
    assert(index >= start, "a digit run never walks backwards");
    assert(!isDigitCode(text.charCodeAt(index)), "a digit run stops at the first non-digit");
    return text.slice(start, index);
}

/** `- **S3.` at the head of a line, and nothing else. */
function getRuleDefinedOnLine(line: string): string | null {
    const opening = "- **";
    if (!line.startsWith(opening)) return null;
    const prefix = line.charAt(opening.length);
    if (!RULE_PREFIXES.includes(prefix)) return null;
    const digits = getDigitsAt(line, opening.length + 1);
    if (digits.length === 0) return null;
    if (line.charAt(opening.length + 1 + digits.length) !== ".") return null;
    const identifier = prefix + digits;
    assert(identifier.length >= 2, "an identifier is a prefix and at least one digit");
    assert(!identifier.includes("."), "an identifier stops before its full stop");
    return identifier;
}

/** Every `**S3**` written as a reference, which is the spelling a pointer uses. */
function getRuleReferences(text: string): string[] {
    const found: string[] = [];
    let index = text.indexOf("**");
    let steps = 0;
    while (index !== -1) {
        steps += 1;
        assert(steps <= text.length, "the scan stays inside the document's bound");
        const start = index + 2;
        const prefix = text.charAt(start);
        const digits = getDigitsAt(text, start + 1);
        const closed = text.startsWith("**", start + 1 + digits.length);
        if (RULE_PREFIXES.includes(prefix) && digits.length > 0 && closed) {
            found.push(prefix + digits);
        }
        index = text.indexOf("**", start);
    }
    assert(found.every((one) => RULE_PREFIXES.includes(one.charAt(0))), "a reference is prefixed");
    assert(found.every((one) => one.length >= 2), "a reference carries a number");
    return found;
}

function getDefinedRules(): Set<string> {
    const defined = new Set<string>();
    for (const line of AGENTS.split("\n")) {
        const identifier = getRuleDefinedOnLine(line);
        if (identifier !== null) defined.add(identifier);
    }
    assert(defined.size > 50, "AGENTS.md defines its rules as `- **X<n>.` bullets");
    assert([...defined].every((one) => RULE_PREFIXES.includes(one.charAt(0))), "each is prefixed");
    return defined;
}

function getWordRuns(text: string, length: number): Set<string> {
    const words: string[] = [];
    let current = "";
    for (const character of text.toLowerCase()) {
        const code = character.charCodeAt(0);
        if (code >= 97 && code <= 122) current += character;
        else if (current.length > 0) {
            words.push(current);
            current = "";
        }
    }
    if (current.length > 0) words.push(current);
    const runs = new Set<string>();
    for (let index = 0; index + length <= words.length; index += 1) {
        runs.add(words.slice(index, index + length).join(" "));
    }
    assert(runs.size <= Math.max(words.length, 1), "a run set never exceeds its word count");
    assert([...runs].every((run) => run.split(" ").length === length), "each run is one length");
    return runs;
}

/**
 * Everything written for v2. The four documents carried from v1 are **not** here: their tables
 * run past 100 columns and rewrapping them would be a large diff on material this tree carries
 * rather than authors. ARCHITECTURE.md lists that under known gaps.
 */
/** Every document this repository writes, wherever it sits, the root's own included. */
function getWrittenDocuments(): string[] {
    const found: string[] = [];
    for (const entry of walkSync(".", { exts: [".md"], includeDirs: false, maxDepth: 1 })) {
        found.push(entry.path);
    }
    for (const directory of DOCUMENT_DIRECTORIES) {
        for (const entry of walkSync(directory, { exts: [".md"], includeDirs: false })) {
            found.push(entry.path);
        }
    }
    assert(found.length > CANONICAL.length, "the walk reaches past the canonical documents");
    assertStrictEquals(new Set(found).size, found.length, "a document is walked once");
    return found;
}

/** Every `AGENTS.md` below the root, which is what the root is read against. */
function getNestedAgents(): string[] {
    return getWrittenDocuments().filter((path) => {
        if (path === "AGENTS.md") return false;
        return path.endsWith("AGENTS.md");
    });
}

function getWrittenPaths(): string[] {
    const written = [...getWrittenDocuments(), ...getSourcePaths()];
    assert(written.length > CANONICAL.length, "the walk reaches past the canonical documents");
    assertStrictEquals(new Set(written).size, written.length, "a path is listed once");
    return written;
}

Deno.test("rule numbering runs without a gap", () => {
    const defined = getDefinedRules();
    for (const prefix of RULE_PREFIXES) {
        const numbers = [...defined]
            .filter((rule) => rule.startsWith(prefix))
            .map((rule) => Number(rule.slice(1)))
            .sort((left, right) => left - right);
        if (numbers.length === 0) continue;
        const highest = numbers[numbers.length - 1];
        assertExists(highest, "a non-empty run has a last member");
        assertEquals(numbers.length, highest, `${prefix} numbering has a hole or a repeat`);
        assertEquals(numbers[0], 1, `${prefix} numbering starts at 1`);
    }
});

/** The numbers a rule spells out. `deno fmt` wraps prose, so the run of words is the unit. */
const SPELLED = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export function getSpelledNumbers(text: string): number[] {
    const found: number[] = [];
    for (const word of text.split("\n").join(" ").split(" ")) {
        const bare = word.split("*").join("").split("`").join("").split(".").join("");
        const at = SPELLED.indexOf(bare.toLowerCase());
        if (at === -1) continue;
        found.push(at + 1);
    }
    return found;
}

/**
 * The rows of the **first** table standing after `from`, and of no table after that one. Counting
 * to the end of the document instead summed every table below, which is a number no sentence
 * anywhere is making a claim about.
 */
export function countFirstTableRows(text: string, from: number): number {
    let rows = 0;
    let isPastRule = false;
    for (const line of text.slice(from).split("\n")) {
        const bare = line.trim();
        if (!bare.startsWith("|")) {
            if (isPastRule) break;
            continue;
        }
        if (!isPastRule) {
            if (bare.split("-").length > 3) isPastRule = true;
            continue;
        }
        rows += 1;
    }
    return rows;
}

/**
 * ⚠️ **E4 said `five below` of E5's table, which held six.** The sixth boundary arrived with
 * **ADR 0043**: E5's own sentence moved to six, the sentence under its table went on arguing that
 * no sixth row was earned, and E4 next door was left counting five. Nothing looked wrong, because
 * a number spelled in words looks the same whatever it says — and the rule counting a table need
 * not be the rule carrying it, so reading each rule against its own table finds none of this.
 * Found 2026-09-10.
 */
Deno.test("a sentence counting what stands below it agrees with the table that does", () => {
    assertEquals(getSpelledNumbers("one of the six below"), [1, 6], "every one of them is read");
    assertEquals(getSpelledNumbers("a boundary and a mark"), [], "prose carrying none reads none");
    const sample =
        "said five below\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n| c |\n| --- |\n| 3 |\n";
    assertStrictEquals(countFirstTableRows(sample, 0), 1, "the table below, and not the one after");

    const marker = " below";
    let checked = 0;
    let at = AGENTS.indexOf(marker);
    for (let held = 0; held < AGENTS.length; held += 1) {
        if (at === -1) break;
        const opening = AGENTS.lastIndexOf(" ", at - 1);
        const spelled = getSpelledNumbers(AGENTS.slice(opening + 1, at));
        at = AGENTS.indexOf(marker, at + marker.length);
        if (spelled.length !== 1) continue;
        const stated = spelled[0];
        if (stated === undefined) continue;
        checked += 1;
        assertStrictEquals(
            countFirstTableRows(AGENTS, opening),
            stated,
            `a sentence says ${stated} stand below it, and the table below it holds otherwise`,
        );
    }
    assert(checked > 0, "some sentence counts what stands below it");
});

Deno.test("every rule reference resolves to a rule that exists", () => {
    const defined = getDefinedRules();
    const dangling: string[] = [];
    for (const path of CANONICAL) {
        for (const reference of getRuleReferences(Deno.readTextFileSync(path))) {
            if (!defined.has(reference)) dangling.push(`${path} → ${reference}`);
        }
    }
    assert(defined.size > 0, "there are rules to point at");
    assertEquals(getRuleReferences("**bold prose**"), [], "plain bold is not a pointer");
    assertEquals(getRuleReferences("see **E5** for the list"), ["E5"], "a pointer is read");
    assertEquals(dangling, [], "a pointer names a rule that is not defined");
});

Deno.test("the formatter is walled off from the maintainer's list", () => {
    const config = Deno.readTextFileSync(CONFIGURATION_FILE);
    const excludeAt = config.indexOf('"exclude"');
    assertNotStrictEquals(excludeAt, -1, "deno.json states formatter exclusions");
    assertNotStrictEquals(
        config.indexOf('"TODO.md"', excludeAt),
        -1,
        "TODO.md is excluded from deno fmt",
    );
});

Deno.test("a nested AGENTS.md never restates the root", () => {
    const root = getWordRuns(AGENTS, 7);
    assert(root.size > 100, "the root carries enough prose to compare against");
    for (const path of getNestedAgents()) {
        const shared = [...getWordRuns(Deno.readTextFileSync(path), 7)].filter((run) =>
            root.has(run)
        );
        assertEquals(shared, [], `${path} repeats the root rather than narrowing it`);
    }
});

Deno.test("no line runs past a hundred columns, and every exception is named", () => {
    const row = `| ${"x".repeat(120)} |`;
    assert(row.startsWith(TABLE_OPENER), "the sample it must not flag is a table row");
    assert(!"x".repeat(120).startsWith(TABLE_OPENER), "and the one it must is prose");

    const overlong: string[] = [];
    const excused: string[] = [];
    const walked = getWrittenPaths();
    for (const path of walked) {
        const long: string[] = [];
        for (const [offset, line] of Deno.readTextFileSync(path).split("\n").entries()) {
            if (line.length <= 100) continue;
            if (line.startsWith(TABLE_OPENER)) continue;
            long.push(`${path}:${offset + 1} at ${line.length}`);
        }
        if (UNWRAPPED_LINES[path] !== undefined) {
            if (long.length === 0) excused.push(path);
            continue;
        }
        overlong.push(...long);
    }
    assert(CANONICAL.length > 0, "there are documents to measure");
    assertEquals(overlong, [], "deno fmt aligns a table but never wraps one");
    assertEquals(excused, [], "a document excused above no longer carries the line it is excused");
    const unreached = Object.keys(UNWRAPPED_LINES).filter((path) => !walked.includes(path));
    assertEquals(unreached, [], "a document excused above is not one this walk reaches");
});

Deno.test("the canonical list covers every document at the root", () => {
    const exempt = ["README.md", "README.en.md", "CHANGELOG.md", "TODO.md", "CLAUDE.md"];
    const present = [...Deno.readDirSync(".")]
        .filter((entry) => entry.isFile && entry.name.endsWith(".md"))
        .map((entry) => entry.name)
        .filter((name) => !exempt.includes(name));
    const uncovered = present.filter((name) => !CANONICAL.includes(name));
    const vanished = CANONICAL.filter((path) => !path.includes("/") && !present.includes(path));
    assert(present.length > 0, "the root carries documents to cover");
    assertEquals(uncovered, [], "a root document is outside the canonical list");
    assertEquals(vanished, [], "the canonical list names a document that is gone");
});

Deno.test("no canonical document carries a regular expression literal", () => {
    for (const path of CANONICAL) {
        const text = Deno.readTextFileSync(path);
        assert(!text.includes("new RegExp("), `${path} names a RegExp constructor`);
        assert(text.length > 0, `${path} is not empty`);
    }
});

/** The first cell of each row in AGENTS.md's guard register, unwrapped from its backticks. */
function getRegisteredGuards(text: string): string[] {
    const found: string[] = [];
    let inside = false;
    for (const line of text.split("\n")) {
        if (line.startsWith("## Guard register")) inside = true;
        else if (inside && line.startsWith("## ")) break;
        if (!inside || !line.startsWith("| ")) continue;
        const cell = line.slice(1, line.indexOf("|", 1)).trim();
        const open = cell.indexOf("`");
        if (open === -1) continue;
        const close = cell.indexOf("`", open + 1);
        if (close === -1) continue;
        found.push(cell.slice(open + 1, close));
    }
    assert(found.every((one) => one.length > 0), "a register row names something");
    assert(!found.includes("Guard"), "the header is not a row");
    return found;
}

Deno.test("the guard register names what exists, and nothing else", () => {
    const sample = "## Guard register\n\n| Guard | Holds |\n| - | - |\n| `deno lint` | S10 |\n";
    assertEquals(getRegisteredGuards(sample), ["deno lint"], "the reader works");
    const elsewhere = "| `deno lint` | not the register |\n## Guard register\n";
    assertEquals(getRegisteredGuards(elsewhere), [], "a table outside the register is not one");

    const registered = getRegisteredGuards(AGENTS);
    const gateTask = Deno.readTextFileSync(CONFIGURATION_FILE);
    const missing: string[] = [];
    for (const entry of registered) {
        if (entry.startsWith("deno ")) {
            if (!gateTask.includes(entry)) missing.push(`${entry} is not in the gate`);
        } else if (!existsSync(entry, { isFile: true })) missing.push(`${entry} does not exist`);
    }
    assert(registered.length > 4, "the register is not empty");
    assertEquals(missing, [], "the register claims a guard that is not there");
});

/**
 * Whether a test reads a document of this repository, off its code and never its own prose.
 *
 * ⚠️ **A docblock naming a document is not a guard over it.** Every guard here opens by saying
 * which document it holds, so a reader that counted comment would call every test a guard and
 * the register would fill with names nobody holds.
 */
function hasDocumentRead(text: string): boolean {
    for (const line of text.split("\n")) {
        if (isCommentLine(line)) continue;
        if (line.includes(DOCUMENT_ENDING)) return true;
    }
    return false;
}

/** A test is a guard where it sits in the guard directory, or where it reads a document. */
function isGuardPath(path: string, text: string): boolean {
    assert(path.endsWith(".test.ts"), "only a test is asked whether it guards");
    if (path.startsWith(`${GUARD_DIRECTORY}/`)) return true;
    return hasDocumentRead(text);
}

Deno.test("every guard in the tree is in the register", () => {
    const reads = 'const REGISTER = "docs/drill-levels.md";';
    assert(hasDocumentRead(reads), "the reader finds a document being read");
    const cites = " * The guard `docs/drill-levels.md` names in its first sentence.";
    assert(!hasDocumentRead(cites), "and does not find a document merely named in prose");
    assert(isGuardPath("tests/repository/names.test.ts", ""), "the directory alone says guard");
    const unit = isGuardPath("tests/core/wound-rule.test.ts", "const key = 1;");
    assert(!unit, "and a test that reads no document is not a guard");

    const registered = getRegisteredGuards(AGENTS);
    const unregistered: string[] = [];
    for (const path of getSourcePaths()) {
        if (!path.endsWith(".test.ts")) continue;
        if (!isGuardPath(path, Deno.readTextFileSync(path))) continue;
        if (!registered.includes(path)) unregistered.push(path);
    }
    assert(registered.length > 0, "there is a register to check against");
    assertEquals(unregistered.sort(), [], "a guard runs that the register never claims");
});

/** Rules whose text ends in the marker for an observation no machine can compute. */
function getRulesHeldByReading(text: string): Set<string> {
    const found = new Set<string>();
    let current = "";
    for (const line of text.split("\n")) {
        if (line.startsWith("## Guard register")) break;
        const identifier = getRuleDefinedOnLine(line);
        if (identifier !== null) current = identifier;
        if (current !== "" && line.includes("`by-reading`")) found.add(current);
    }
    assert(found.size <= text.length, "no more marks than characters");
    assert([...found].every((one) => RULE_PREFIXES.includes(one.charAt(0))), "each is a rule");
    return found;
}

/** Each rule of `AGENTS.md`, as one run of words: `deno fmt` wraps a marker across lines. */
export function getRuleBlocks(text: string): Map<string, string> {
    const found = new Map<string, string>();
    let name = "";
    let held: string[] = [];
    for (const line of text.slice(0, text.indexOf(REGISTER_HEADING)).split("\n")) {
        const opened = getRuleDefinedOnLine(line);
        if (opened !== null) {
            if (name !== "") found.set(name, held.join(" "));
            name = opened;
            held = [];
        } else if (line.startsWith("## ")) {
            // ⚠️ A rule ends at the next rule **or at the next heading**. Without the heading the
            // last rule of a section swallowed the rest of the document, and a bare marker on it
            // read as scoped because a page of prose stood behind the marker.
            if (name !== "") found.set(name, held.join(" "));
            name = "";
            held = [];
        }
        if (name === "") continue;
        held.push(line.trim());
    }
    if (name !== "") found.set(name, held.join(" "));
    assert(found.size > 0, "the rule document defines rules");
    return found;
}

/**
 * ⚠️ **This stood as "a rule cannot be both counted and uncountable" and could not fail.** It
 * compared rule identifiers against the register's *guard* column, which holds paths, so nothing
 * ever matched. Measured 2026-09-10 by marking S13 — a rule the register names — `by-reading`:
 * the check stayed green. **W4.**
 *
 * The absolute was false as well. C15 forbids restating a document and forbids a comment block
 * standing twice; the first is a reader's and the second is counted, and its own marker says so.
 * What binds is that **the marker names the observation** — which is what makes a split rule
 * readable rather than a contradiction. `AGENTS.md` states the two states of a rule *outside* the
 * register; nothing there ever forbade one inside it being both.
 */
Deno.test("every rule a reader holds says what the reader judges", () => {
    const marked = "- **G3.** A rule. _(`by-reading` a reason)_\n";
    assertEquals([...getRulesHeldByReading(marked)], ["G3"], "the reader works");
    const afterRegister = "- **G3.** A rule.\n## Guard register\n\nThe `by-reading` marker means…";
    assertEquals([...getRulesHeldByReading(afterRegister)], [], "the register is not a rule");

    const bare: string[] = [];
    let scoped = 0;
    for (const [name, text] of getRuleBlocks(AGENTS)) {
        const at = text.indexOf(MARKER);
        if (at === -1) continue;
        const after = text.slice(at + MARKER.length).split(")").join("").split("_").join("").trim();
        if (after.length === 0) bare.push(name);
        else scoped += 1;
    }
    assert(scoped > 0, "some rule is held by a reader");
    assert(
        getDefinedRules().size > getRulesHeldByReading(AGENTS).size,
        "not every rule needs a reader",
    );
    assertEquals(bare, [], "a marker that names no observation asks a reader to guess at one");
});

/** The fenced block under ARCHITECTURE.md's current state, which claims to mirror the tree. */
function getStructureBlock(text: string): string {
    const opening = text.indexOf("```");
    assertNotStrictEquals(opening, -1, "the current state carries a fenced block");
    const closing = text.indexOf("```", opening + 3);
    assert(closing > opening, "the fence is closed");
    return text.slice(opening + 3, closing);
}

function getTrackedFiles(): string[] {
    const listing = new Deno.Command("git", { args: ["ls-files"] }).outputSync();
    assert(listing.success, "git lists what the repository carries");
    const paths = new TextDecoder().decode(listing.stdout).split("\n").filter((one) =>
        one !== "" && !one.startsWith("captures/")
    );
    assert(paths.length > 10, "the repository carries files");
    return paths;
}

/** The block is a tree drawn with two-space indents; this reads the paths back out of it. */
interface DescribedTree {
    files: string[];
    /** Directories that list no child, and so stand for everything beneath them. */
    childless: string[];
}

function getDescribedPaths(block: string): DescribedTree {
    const files: string[] = [];
    const directories: string[] = [];
    const stack: string[] = [];
    for (const line of block.split("\n")) {
        const token = line.trim().split(" ")[0] ?? "";
        if (token === "" || token.startsWith("#")) continue;
        let indent = 0;
        while (indent < line.length && line.charAt(indent) === " ") indent += 1;
        if (indent % 2 !== 0 || indent > MAXIMUM_INDENT) continue;
        const level = Math.floor(indent / 2);
        stack.length = Math.min(stack.length, level);
        const path = [...stack, token].join("");
        if (token.endsWith("/")) {
            stack[level] = token;
            directories.push(path.slice(0, -1));
        } else {
            files.push(path);
        }
    }
    const childless = directories.filter((one) =>
        !files.some((file) => file.startsWith(`${one}/`)) &&
        !directories.some((other) => other !== one && other.startsWith(`${one}/`))
    );
    assert(files.every((one) => !one.endsWith("/")), "a file never ends in a separator");
    assert(childless.length <= directories.length, "a childless directory is a directory");
    return { files, childless };
}

Deno.test("the structure block describes every file, by path and not by name", () => {
    const sample = "tests/\n  repository/\n    documents.test.ts   what it holds\n";
    const read = getDescribedPaths(sample + "src/\n  core/\n  ui/\n  game/\nAGENTS.md  rules\n");
    assertArrayIncludes(
        read.files,
        ["tests/repository/documents.test.ts"],
        "a nested path is rebuilt",
    );
    assert(!read.files.includes("documents.test.ts"), "a bare name is never a path");

    const described = getDescribedPaths(
        getStructureBlock(Deno.readTextFileSync("ARCHITECTURE.md")),
    );
    assert(described.files.length > 5, "the real block describes files");
    assert(described.childless.length > 0, "some directory stands for its contents");
    const undescribed: string[] = [];
    for (const path of getTrackedFiles()) {
        if (described.files.includes(path)) continue;
        if (described.childless.some((one) => path.startsWith(`${one}/`))) continue;
        undescribed.push(path);
    }
    assertEquals(undescribed, [], "a file the structure block never mentions");
});

Deno.test("the structure block names nothing that is gone", () => {
    const described = getDescribedPaths(
        getStructureBlock(Deno.readTextFileSync("ARCHITECTURE.md")),
    );
    const vanished: string[] = [];
    for (const path of [...described.files, ...described.childless]) {
        try {
            Deno.statSync(path);
        } catch {
            vanished.push(path);
        }
    }
    assert(described.files.length > 0, "there is something to check");
    assertEquals(vanished, [], "the block names a path the tree does not have");
});
