/**
 * `AGENTS.md`, checked against itself and against the tree it describes: its rules are numbered
 * without a gap and every reference to one resolves, its register names exactly the guards that
 * exist, its list of documents names exactly the documents that exist, `docs/structure.md` names
 * every tracked file, every skill is named for its directory, and the two walls in front of
 * `TODO.md` still stand. Text is walked rather than matched (C7).
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { parse as parseJsonc } from "@std/jsonc";
import { isRecord } from "#/libs/unknown-value.ts";

interface RuleName {
    prefix: string;
    number: number;
}

interface SkillHeader {
    name: string;
    description: string;
}

const RULES_PATH = "AGENTS.md";
const RULE_OPENER = "- **";
const BOLD_MARK = "**";
const RULE_CLOSER = ".";
const QUOTE = "`";
const CELL_MARK = "|";
const REGISTER_HEADING = "## Guard register";
const DOCUMENTS_LEAD = "The documents this tree carries:";
const DOCUMENT_OPENER = "- [`";
const GUARD_DIRECTORY = "tests/repository/";
const GUARD_ENDING = ".test.ts";
/** At the root and no canonical document: the rules, their pointer, the front pages, the list. */
const ROOT_DOCUMENTS_OTHER = ["AGENTS.md", "CLAUDE.md", "README.en.md", "README.md", "TODO.md"];
const HAND_KEPT_LIST = "TODO.md";
const DENIED_TOOLS = ["Edit", "Write"];
const NESTED_RULES_NAME = "/AGENTS.md";
const STRUCTURE_PATH = "docs/structure.md";
const STRUCTURE_HEADING = "# Structure";
const STRUCTURE_OPENER = "| `";
const SECTION_OPENER = "## ";
const SKILLS_DIRECTORY = ".agents/skills/";
const SKILL_FILE_NAME = "/SKILL.md";
const SKILLS_LINK = ".claude/skills";
const SKILLS_LINK_TARGET = "../.agents/skills";
const FRONTMATTER_MARK = "---";
const SKILL_NAME_OPENER = "name: ";
const SKILL_DESCRIPTION_OPENER = "description: ";
/** Where the structure takes a directory rather than its files, and how deep: a suite apiece. */
const STRUCTURE_DEPTH_BY_ROOT: ReadonlyMap<string, number> = new Map([
    ["tests", 2],
    ["captures", 1],
    ["screenshots", 1],
]);

Deno.test("a rule is read off the line that opens it, and a sentence naming one is not", () => {
    assertEquals(readRuleName("- **S1.** Only simple control flow."), { prefix: "S", number: 1 });
    assertEquals(readRuleName("- **E12. Nothing the bundle carries may stop the add-on.**"), {
        prefix: "E",
        number: 12,
    }, "a rule whose name is bold with its title");
    assertEquals(readRuleName("- **Send anything over the network**"), null, "a Never is not");
    assertEquals(readRuleName("  the rule **E4** names"), null, "nor a reference");
});

/** The rule a line opens, or null where it opens none. */
function readRuleName(line: string): RuleName | null {
    if (!line.startsWith(RULE_OPENER)) return null;
    return readRuleNameText(line.slice(RULE_OPENER.length), RULE_CLOSER);
}

/** A prefix of capitals and a number, closed by what is asked; null where the text is not one. */
function readRuleNameText(text: string, closer: string): RuleName | null {
    let characterIndex = 0;
    for (; characterIndex < text.length; characterIndex += 1) {
        const character = text.charAt(characterIndex);
        if (character < "A") break;
        if (character > "Z") break;
    }
    const prefix = text.slice(0, characterIndex);
    const digitsFrom = characterIndex;
    for (; characterIndex < text.length; characterIndex += 1) {
        const character = text.charAt(characterIndex);
        if (character < "0") break;
        if (character > "9") break;
    }
    if (prefix.length !== 1) return null;
    if (characterIndex === digitsFrom) return null;
    if (!text.startsWith(closer, characterIndex)) return null;
    return { prefix, number: Number(text.slice(digitsFrom, characterIndex)) };
}

Deno.test("rule numbering runs from one without a gap, prefix by prefix", () => {
    const numbers = new Map<string, number[]>();
    for (const line of Deno.readTextFileSync(RULES_PATH).split("\n")) {
        const rule = readRuleName(line);
        if (rule === null) continue;
        numbers.set(rule.prefix, [...(numbers.get(rule.prefix) ?? []), rule.number]);
    }
    assert(numbers.size > 0, "the rules were read");
    for (const [prefix, stated] of numbers) {
        const expected = stated.map((_, index) => index + 1);
        assertEquals(stated, expected, `${prefix}: numbered in order, from one, without a gap`);
    }
});

Deno.test("every rule a document names in bold is a rule AGENTS.md states", () => {
    const stated = new Set<string>();
    for (const line of Deno.readTextFileSync(RULES_PATH).split("\n")) {
        const rule = readRuleName(line);
        if (rule !== null) stated.add(formatRuleName(rule));
    }
    const dangling: string[] = [];
    for (const path of readTrackedPaths(["*.md"])) {
        if (path === HAND_KEPT_LIST) continue;
        for (const named of readBoldRuleNames(Deno.readTextFileSync(path))) {
            if (!stated.has(named)) dangling.push(`${path} → ${named}`);
        }
    }
    assertEquals(dangling, [], "a rule named in bold that no rule here is");
});

function formatRuleName(rule: RuleName): string {
    return `${rule.prefix}${rule.number}`;
}

/**
 * Every bold span that is a rule's name alone, `**E4**`. A rule a document cites by `develop`'s
 * numbering is written `develop ADR` or `develop:AGENTS.md`, never bold, so it is not read here.
 */
function readBoldRuleNames(text: string): string[] {
    const ruleNames: string[] = [];
    let markIndex = text.indexOf(BOLD_MARK);
    for (let tried = 0; markIndex !== -1; tried += 1) {
        assert(tried <= text.length, "the walk stays inside the text");
        const rule = readRuleNameText(text.slice(markIndex + BOLD_MARK.length), BOLD_MARK);
        if (rule !== null) ruleNames.push(formatRuleName(rule));
        markIndex = text.indexOf(BOLD_MARK, markIndex + BOLD_MARK.length);
    }
    return ruleNames;
}

function readTrackedPaths(patterns: string[]): string[] {
    const asked = new Deno.Command("git", { args: ["ls-files", ...patterns], stdout: "piped" })
        .outputSync();
    assert(asked.success, "git names what it tracks");
    const paths = new TextDecoder().decode(asked.stdout).split("\n").filter((line) => line !== "");
    assert(paths.length > 0, "and it tracks something");
    return paths;
}

Deno.test("the bold reader takes a rule's name, and not a sentence or an ADR", () => {
    const sample = "held by **E4**, and **Ask first**, and **C9**. **develop ADR 0051.**";
    assertEquals(readBoldRuleNames(sample), ["E4", "C9"], "the two rules");
});

Deno.test("the guard register names every guard in the tree, and nothing else", () => {
    const registered = readRegisterGuards(Deno.readTextFileSync(RULES_PATH));
    assert(registered.length > 0, "the register was read");
    const guards = readTrackedPaths([GUARD_DIRECTORY])
        .filter((path) => path.endsWith(GUARD_ENDING))
        .filter((path) => !path.slice(GUARD_DIRECTORY.length).includes("/"));
    assertEquals(registered.filter((path) => !guards.includes(path)), [], "a row naming no guard");
    assertEquals(guards.filter((path) => !registered.includes(path)), [], "a guard nobody lists");
});

/** The guard files the register's first column names, in the order it names them. */
function readRegisterGuards(text: string): string[] {
    const lines = text.split("\n");
    const opened = lines.indexOf(REGISTER_HEADING);
    assert(opened !== -1, "the rules carry a register");
    const guards: string[] = [];
    for (const line of lines.slice(opened)) {
        if (!line.startsWith(CELL_MARK)) continue;
        const cell = line.split(CELL_MARK)[1] ?? "";
        const quoted = cell.indexOf(QUOTE);
        if (quoted === -1) continue;
        const named = cell.slice(quoted + 1, cell.indexOf(QUOTE, quoted + 1));
        if (named.startsWith(GUARD_DIRECTORY)) guards.push(named);
    }
    return guards;
}

Deno.test("the list of documents names every document in the tree, and nothing else", () => {
    const listed = readListedDocuments(Deno.readTextFileSync(RULES_PATH));
    assert(listed.length > 0, "the list was read");
    const documents = readTrackedPaths(["*.md", "docs/*.md"]).filter(isCanonicalPlace);
    assertEquals(listed.filter((path) => !documents.includes(path)), [], "a line naming nothing");
    assertEquals(documents.filter((path) => !listed.includes(path)), [], "a document unlisted");
});

/** The paths the list under its lead quotes, up to the blank line that ends it. */
function readListedDocuments(text: string): string[] {
    const lines = text.split("\n");
    const lead = lines.indexOf(DOCUMENTS_LEAD);
    assert(lead !== -1, "the rules list the documents they stand on");
    const documents: string[] = [];
    for (const line of lines.slice(lead + 2)) {
        if (line === "") break;
        if (!line.startsWith(DOCUMENT_OPENER)) continue;
        const from = DOCUMENT_OPENER.length;
        documents.push(line.slice(from, line.indexOf(QUOTE, from)));
    }
    return documents;
}

/** A document at the root or directly under `docs/`, where a canonical one stands. */
function isCanonicalPlace(path: string): boolean {
    if (path.endsWith(NESTED_RULES_NAME)) return false;
    if (ROOT_DOCUMENTS_OTHER.includes(path)) return false;
    if (!path.includes("/")) return true;
    return path.startsWith("docs/") ? !path.slice("docs/".length).includes("/") : false;
}

Deno.test("the structure is read off its own section, one path to a row", () => {
    const sample = [
        STRUCTURE_HEADING,
        "",
        "| Path   | For                |",
        "| ------ | ------------------ |",
        "| `a.ts` | one, beside `b.ts` |",
        "",
        "| Path          | For |",
        "| ------------- | --- |",
        "| `tests/core/` | two |",
        "",
        "## Safety",
        "| `c.ts` | past the section |",
    ].join("\n");
    assertEquals(readStructurePaths(sample), ["a.ts", "tests/core/"], "the two rows it opens");
});

/** The paths the section's rows open with, up to the next section. */
function readStructurePaths(text: string): string[] {
    const lines = text.split("\n");
    const heading = lines.indexOf(STRUCTURE_HEADING);
    assert(heading !== -1, "the document maps the tree");
    const structurePaths: string[] = [];
    for (const line of lines.slice(heading + 1)) {
        if (line.startsWith(SECTION_OPENER)) break;
        if (!line.startsWith(STRUCTURE_OPENER)) continue;
        const from = STRUCTURE_OPENER.length;
        structurePaths.push(line.slice(from, line.indexOf(QUOTE, from)));
    }
    return structurePaths;
}

Deno.test("a file is mapped by itself, or by the directory the structure takes whole", () => {
    const tracked = ["src/a.ts", "tests/fake.ts", "tests/core/b.test.ts", "captures/x/y.json"];
    assertEquals(
        tracked.map(composeStructureEntry),
        ["src/a.ts", "tests/", "tests/core/", "captures/"],
        "a file, the directory of tests, one under it, and the recordings",
    );
});

/** The line a tracked file stands under: its own, or its directory's where one is taken whole. */
function composeStructureEntry(path: string): string {
    const parts = path.split("/");
    for (const [root, depth] of STRUCTURE_DEPTH_BY_ROOT) {
        if (parts[0] !== root) continue;
        const directories = parts.slice(0, -1).slice(0, depth);
        return `${directories.join("/")}/`;
    }
    return path;
}

Deno.test("the structure names every file in the tree, and nothing else", () => {
    const listed = readStructurePaths(Deno.readTextFileSync(STRUCTURE_PATH));
    assert(listed.length > 0, "the structure was read");
    const entries = [...new Set(readTrackedPaths([]).map(composeStructureEntry))];
    assertEquals(listed.filter((path) => !entries.includes(path)), [], "a line naming nothing");
    assertEquals(entries.filter((path) => !listed.includes(path)), [], "a file unlisted");
});

Deno.test("a skill's header is read off its frontmatter, and a line of its body is not", () => {
    const sample = ["---", "name: gate", "description: Run it.", "---", "", "name: other"];
    assertEquals(readSkillHeader(sample.join("\n")), {
        name: "gate",
        description: "Run it.",
    }, "the two fields the frontmatter states");
    assertEquals(readSkillHeader(sample.slice(4).join("\n")), null, "a body with no frontmatter");
    assertEquals(
        readSkillHeader(sample.slice(0, 3).join("\n")),
        null,
        "a frontmatter never closed",
    );
});

/** The name and description a skill's frontmatter states, or null where it opens with none. */
function readSkillHeader(text: string): SkillHeader | null {
    const lines = text.split("\n");
    if (lines[0] !== FRONTMATTER_MARK) return null;
    const closed = lines.indexOf(FRONTMATTER_MARK, 1);
    if (closed === -1) return null;
    const header = lines.slice(1, closed);
    return {
        name: readSkillHeaderField(header, SKILL_NAME_OPENER),
        description: readSkillHeaderField(header, SKILL_DESCRIPTION_OPENER),
    };
}

/** The rest of the line a field opens; empty where the frontmatter does not state it. */
function readSkillHeaderField(header: string[], opener: string): string {
    const line = header.find((headerLine) => headerLine.startsWith(opener)) ?? opener;
    return line.slice(opener.length);
}

Deno.test("every skill is named for its directory, says when it is used, and is found", () => {
    const paths = readTrackedPaths([SKILLS_DIRECTORY])
        .filter((path) => path.endsWith(SKILL_FILE_NAME));
    assert(paths.length > 0, "the tree carries skills");
    for (const path of paths) {
        const directory = path.slice(SKILLS_DIRECTORY.length, -SKILL_FILE_NAME.length);
        const header = readSkillHeader(Deno.readTextFileSync(path));
        assertExists(header, `${path} opens on its frontmatter`);
        assertStrictEquals(header.name, directory, `${path} is named for its directory`);
        assert(header.description.length > 0, `${path} says when it is used`);
    }
    assertStrictEquals(
        Deno.readLinkSync(SKILLS_LINK),
        SKILLS_LINK_TARGET,
        "Claude Code finds them",
    );
});

Deno.test("the maintainer's list stands behind both walls the Never names", () => {
    const configuration = parseJsonc(Deno.readTextFileSync("deno.json"));
    assert(isRecord(configuration), "deno.json is a configuration");
    const format = configuration.fmt;
    assert(isRecord(format), "which configures the formatter");
    const excluded = format.exclude;
    assert(Array.isArray(excluded), "and names what it leaves alone");
    assert(excluded.includes(HAND_KEPT_LIST), "the formatter never rewrites TODO.md");
    const settings = parseJsonc(Deno.readTextFileSync(".claude/settings.json"));
    assert(isRecord(settings), "the agent's settings are a record");
    const permissions = settings.permissions;
    assert(isRecord(permissions), "which grant and deny");
    const denied = permissions.deny;
    assertExists(denied, "and deny something");
    assert(Array.isArray(denied), "as a list");
    for (const tool of DENIED_TOOLS) {
        assert(denied.includes(`${tool}(${HAND_KEPT_LIST})`), `${tool} is denied on TODO.md`);
    }
});
