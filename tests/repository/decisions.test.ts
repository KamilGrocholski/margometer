/**
 * The decision records: their numbering, their index, and the lifecycle a status may name.
 *
 * Split from the rule documents because nothing links them — a change to the ADR lifecycle
 * touches no rule, and a rule renumbering touches no decision.
 */

import { assert, assertEquals } from "@std/assert";

const ADR_STATUSES = ["Proposed", "Accepted", "Deprecated"];
const ADR_INDEX = "docs/adr/README.md";

function getAdrFileNames(): string[] {
    const found: string[] = [];
    for (const entry of Deno.readDirSync("docs/adr")) {
        if (entry.isFile && entry.name !== "README.md") found.push(entry.name);
    }
    found.sort();
    assert(found.length > 0, "there are decisions recorded");
    assert(found.every((name) => name.endsWith(".md")), "a decision is a document");
    return found;
}

/** The value on an ADR's `- **Status:**` line, or the empty string when it has none. */
function getAdrStatus(text: string): string {
    const opener = "- **Status:**";
    for (const line of text.split("\n")) {
        if (!line.startsWith(opener)) continue;
        const value = line.slice(opener.length).trim();
        assert(value.length > 0, "a status line carries a status");
        return value;
    }
    return "";
}

Deno.test("the index names every decision, and only decisions that exist", () => {
    const index = Deno.readTextFileSync(ADR_INDEX);
    const names = getAdrFileNames();
    const unlisted = names.filter((name) => !index.includes(`(${name})`));
    assert(names.length > 1, "there is more than one decision to index");
    assertEquals(unlisted, [], "a decision nobody can find from the index");
});

Deno.test("decision numbering runs from one without a gap", () => {
    const numbers = getAdrFileNames().map((name) => Number(name.slice(0, 4)));
    assert(numbers.every((one) => one > 0), "a decision is numbered from one");
    assertEquals(numbers, numbers.map((_, offset) => offset + 1), "a number is skipped or reused");
});

Deno.test("every decision carries a status the lifecycle allows", () => {
    assertEquals(getAdrStatus("- **Status:** Accepted"), "Accepted", "the reader works");
    assertEquals(getAdrStatus("# 0001. A title"), "", "a document with no status reads empty");
    const wrong: string[] = [];
    for (const name of getAdrFileNames()) {
        const status = getAdrStatus(Deno.readTextFileSync(`docs/adr/${name}`));
        const allowed = ADR_STATUSES.includes(status) || status.startsWith("Superseded by ");
        if (!allowed) wrong.push(`${name} says ${JSON.stringify(status)}`);
    }
    assertEquals(wrong, [], "a status the lifecycle does not allow");
});
