/**
 * The decision records: their numbering, their index, and the lifecycle a status may name.
 *
 * Split from the rule documents because nothing links them — a change to the ADR lifecycle
 * touches no rule, and a rule renumbering touches no decision.
 */

import {
    assert,
    assertEquals,
    AssertionError,
    assertNotStrictEquals,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { getUnwrapped } from "@/tests/markdown-document.ts";

const ADR_STATUSES = ["Proposed", "Accepted", "Deprecated"];
const ADR_INDEX = "docs/adr/README.md";
const INDEX_HEADING = "## Index";
const BULLET = "- ";
const LINK_OPENER = "[";
const BOLD = "**";

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

/**
 * Every entry of the index, as one line each. **The unwrap is the whole reader.** `deno fmt` wraps
 * this index at a hundred columns and a status is the last thing on an entry, so `**Accepted**`
 * lands at the start of a continuation line as often as not — and a reader over lines would find
 * the status of some entries and none of the rest.
 */
function composeIndexEntries(index: string): string[] {
    const listed = index.indexOf(INDEX_HEADING);
    assertNotStrictEquals(listed, -1, "the index has a list in it");
    const entries: string[] = [];
    // The separator is the bullet and not the whole opener: splitting on `- [` would eat the
    // bracket every entry is then tested for, and a reader that finds nothing looks from the
    // outside exactly like an index nobody has broken.
    for (const part of index.slice(listed).split(`\n${BULLET}`)) {
        if (!part.startsWith(LINK_OPENER)) continue;
        entries.push(getUnwrapped(`${BULLET}${part}`));
    }
    assert(entries.length > 0, "an index that was read lists something");
    return entries;
}

/** The document an entry points at, and the status it states about it. */
function getIndexEntryReading(entry: string): { name: string; status: string } {
    const opens = entry.indexOf("(");
    assertNotStrictEquals(opens, -1, `${entry}: an index entry links to a document`);
    const closes = entry.indexOf(")", opens);
    assertNotStrictEquals(closes, -1, `${entry}: and the link is closed`);
    const marks = entry.split(BOLD);
    // Three parts is one bold run: what stands before it, the run, and what stands after. More
    // than one run and the last would be picked by position rather than because it is the status.
    assertStrictEquals(marks.length, 3, `${entry}: an index entry states one status`);
    return { name: entry.slice(opens + 1, closes), status: marks[1] ?? "" };
}

Deno.test("the index states the status each decision states about itself", () => {
    const sample = "- [0001](0001-a-title.md) — A title. **Accepted**";
    assertEquals(getIndexEntryReading(sample), { name: "0001-a-title.md", status: "Accepted" });
    assertThrows(
        () => getIndexEntryReading("- [0001](0001-a-title.md) — A **bold** title. **Accepted**"),
        AssertionError,
        "states one status",
    );
    const disagreed: string[] = [];
    for (const entry of composeIndexEntries(Deno.readTextFileSync(ADR_INDEX))) {
        const listed = getIndexEntryReading(entry);
        const stated = getAdrStatus(Deno.readTextFileSync(`docs/adr/${listed.name}`));
        if (listed.status === stated) continue;
        disagreed.push(
            `${listed.name}: the index says ${JSON.stringify(listed.status)}, the` +
                ` decision says ${JSON.stringify(stated)}`,
        );
    }
    assertEquals(disagreed, [], "a status stated twice and drifted");
});
