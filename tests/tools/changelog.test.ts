/**
 * The changelog against the version being released, which is the release gate moved into the
 * tests: a version bumped without a section would publish a release saying nothing about itself.
 * The declaration it is asked about is `tests/tools/declared-version.test.ts`'s.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertStringIncludes,
    assertThrows,
} from "@std/assert";
import { CHANGELOG_FILE, CONFIGURATION_FILE } from "@/project/repository-layout.ts";
import { composeReleaseNotes, getChangelogSection } from "@/tools/changelog.ts";
import { getDeclaredVersion } from "@/tools/declared-version.ts";
import { ChangelogError } from "@/tools/margometer-tool-error.ts";

const CHANGELOG = Deno.readTextFileSync(CHANGELOG_FILE);
const DECLARED = getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
/** The three words an entry may open with, each drawn in bold. */
const ENTRY_KINDS = ["**Nowość**", "**Zmiana**", "**Poprawka**"];
/** What opens a version's own heading, and so what a section must stop before. */
const VERSION_HEADING = "## [";

Deno.test("the declared version has a section, and it says something", () => {
    const section = getChangelogSection(CHANGELOG, DECLARED);
    assertExists(section, `${CHANGELOG_FILE} says nothing about ${DECLARED}`);
    assert(
        ENTRY_KINDS.some((kind) => section.includes(kind)),
        "a section carries at least one entry, opened with its kind",
    );
});

Deno.test("a section stops where the next one opens", () => {
    const section = getChangelogSection(CHANGELOG, DECLARED) ?? "";
    const headings = section.split("\n").filter((line) => line.startsWith(VERSION_HEADING));
    assertEquals(headings, [], "a section that runs on announces its neighbour as its own");
    const sample = "## [1.0.0]\n\n- one\n\n## [0.9.0]\n\n- other\n";
    assertEquals(getChangelogSection(sample, "1.0.0"), "- one", "the reader stops on its sample");
    assertEquals(getChangelogSection(sample, "0.9.0"), "- other", "and reads the last one whole");
});

/**
 * A released section is frozen — somebody already has that release — so it is the safe place to
 * check that the boundaries run where they should. `0.4.0` carries entries of two kinds, and the
 * section under it is `0.3.0`.
 */
Deno.test("a released section covers its own version and no neighbour", () => {
    const released = getChangelogSection(CHANGELOG, "0.4.0") ?? "";
    assertStringIncludes(released, "**Nowość**", "0.4.0 opens with what it added");
    assertStringIncludes(released, "**Zmiana**", "and states what it changed");
    assert(!released.includes("## [0.3.0]"), "the heading below it is not part of it");
    assert(!released.includes("da się pobrać"), "and neither is what that section says");
});

/**
 * ⚠️ **A number inside an entry is not a heading.** The `0.2.0` section says a tab was withdrawn
 * from the `0.1.0` release notes, so a search for the bare number lands inside a neighbour's
 * section and the release for `0.1.0` would announce the tail of `0.2.0`.
 */
Deno.test("a version number in the middle of an entry is not mistaken for its heading", () => {
    const first = getChangelogSection(CHANGELOG, "0.1.0") ?? "";
    assertStringIncludes(
        first,
        "Nakładka z licznikiem obrażeń",
        "0.1.0 is read from its own heading",
    );
    assert(!first.includes("wycofana z opisu wydania"), "and never from a mention of its number");
});

Deno.test("a version with no section is null rather than empty text", () => {
    assertEquals(getChangelogSection(CHANGELOG, "9.9.9"), null, "nothing is said about it");
    assertThrows(
        () => composeReleaseNotes(CHANGELOG, "9.9.9"),
        ChangelogError,
        "9.9.9",
    );
});

Deno.test("the notes carry the section and say which file to click", () => {
    const notes = composeReleaseNotes(CHANGELOG, DECLARED);
    assertStringIncludes(
        notes,
        getChangelogSection(CHANGELOG, DECLARED) ?? "",
        "the section is in it",
    );
    assertStringIncludes(notes, "**Instalacja:** kliknij", "and a player is told what to press");
    assertStringIncludes(notes, "margometer.user.js", "the file they install is named");
    assertStringIncludes(notes, "margometer.meta.js", "and so is the one they must not");
});

/**
 * Every entry in the file, typed. A reader skimming for **Zmiana** before updating is why the
 * rule at the top of the file exists, and an untyped entry is invisible to them.
 */
Deno.test("every entry in the file opens with its kind", () => {
    const untyped = CHANGELOG.split("\n")
        .filter((line) => line.startsWith("- "))
        .filter((line) => !ENTRY_KINDS.some((kind) => line.includes(kind)));
    assertEquals(untyped, [], "an entry nobody can skim");
});

/** Where a version's entries stop running in the order the file's own header states. */
function getKindOrderFaults(text: string): string[] {
    const faults: string[] = [];
    let section = "";
    let reached = 0;
    for (const line of text.split("\n")) {
        if (line.startsWith(VERSION_HEADING)) {
            section = line;
            reached = 0;
            continue;
        }
        if (!line.startsWith("- ")) continue;
        const kind = ENTRY_KINDS.findIndex((one) => line.includes(one));
        if (kind === -1) continue;
        if (kind >= reached) {
            reached = kind;
            continue;
        }
        faults.push(`${section}: ${ENTRY_KINDS[kind]} stands under ${ENTRY_KINDS[reached]}`);
    }
    return faults;
}

/**
 * The one section this rule arrived too late for. A section past its tag is not touched — somebody
 * already has that release — so the two entries out of order in it stay where a player who
 * installed `0.7.0` saw them, and the guard says so rather than being narrowed to hide them.
 */
const SECTIONS_PAST_THEIR_TAG = ["## [0.7.0] — 2026-08-18"];

/**
 * The order inside a version, which the file's header states and nothing held: Nowość, then
 * Zmiana, then Poprawka. A reader deciding whether to update reads down until the kinds stop
 * being the one they came for, so an entry out of order is one they stop before.
 *
 * Proved both ways, on a section that holds the order and one that breaks it.
 */
Deno.test("the kinds run in the stated order inside every version", () => {
    const kept = "## [1.0.0]\n\n- **Nowość** — a\n\n- **Zmiana** — b\n\n- **Poprawka** — c\n";
    assertEquals(getKindOrderFaults(kept), [], "a section in order states no fault");
    const broken = "## [1.0.0]\n\n- **Poprawka** — a\n\n- **Nowość** — b\n";
    assertEquals(getKindOrderFaults(broken).length, 1, "and one out of order states one");

    const faults = getKindOrderFaults(CHANGELOG)
        .filter((one) => !SECTIONS_PAST_THEIR_TAG.some((past) => one.startsWith(`${past}:`)));
    assertEquals(faults, [], "an entry a skimming reader stops before");
});

/**
 * The exception from the other end: a section that stops breaking the order, or stops existing,
 * is one nothing excuses any more — and a list nobody prunes is how an exception becomes a rule.
 */
Deno.test("every section this file excuses is still there, and still out of order", () => {
    const faults = getKindOrderFaults(CHANGELOG);
    for (const past of SECTIONS_PAST_THEIR_TAG) {
        assertStringIncludes(CHANGELOG, past, "a section excused here is still in the file");
        const found = faults.some((one) => one.startsWith(`${past}:`));
        assert(found, `${past} runs in order now and no longer needs excusing`);
    }
    assert(SECTIONS_PAST_THEIR_TAG.length > 0, "the list is read rather than assumed empty");
});

/** An entry, with the heading of the section it stands in. */
interface ChangelogEntry {
    section: string;
    entry: string;
}

/**
 * Every entry in the file, unwrapped. `deno fmt` breaks an entry at 100 columns, so a reader that
 * takes a line takes the first third of a long one and calls it the whole entry.
 */
function getEntries(text: string): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
    let section = "";
    let open = false;
    for (const line of text.split("\n")) {
        if (line.startsWith(VERSION_HEADING)) {
            section = line;
            open = false;
            continue;
        }
        if (line.startsWith("- ")) {
            entries.push({ section, entry: line.slice(2) });
            open = true;
            continue;
        }
        if (!open) continue;
        if (!line.startsWith("  ")) {
            open = false;
            continue;
        }
        const last = entries.at(-1);
        if (last === undefined) continue;
        last.entry = `${last.entry} ${line.trim()}`;
    }
    return entries;
}

/** What a sentence may close on, and what may stand after the one that closes an entry. */
const SENTENCE_ENDS = [".", "!", "?"];
const ENTRY_CLOSERS = ['"', ")", " "];

/**
 * Whether a sentence closing here closes the entry — everything after it is punctuation.
 */
function isEndAtTheClose(entry: string, index: number): boolean {
    for (const character of entry.slice(index + 1)) {
        if (!ENTRY_CLOSERS.includes(character)) return false;
    }
    return true;
}

/**
 * Where a sentence closes inside an entry, walked rather than matched — **C7**.
 *
 * ⚠️ **A full stop is not a sentence end on its own.** `0.17.0` carries two of them and a quoted
 * sentence of the game's — `„Walka się skończyła." i tyle` — carries a third. A close is a stop
 * that ends the text, or one followed by a space and then a capital.
 */
function getSentenceEnds(entry: string): number[] {
    const ends: number[] = [];
    for (let index = 0; index < entry.length; index += 1) {
        if (!SENTENCE_ENDS.includes(entry.charAt(index))) continue;
        if (index === entry.length - 1) {
            ends.push(index);
            continue;
        }
        if (entry.charAt(index + 1) !== " ") continue;
        const next = entry.slice(index + 2).trimStart();
        const opener = next.startsWith("„") ? next.slice(1) : next;
        const first = opener.charAt(0);
        if (first === "") continue;
        if (first === first.toLowerCase()) continue;
        ends.push(index);
    }
    return ends;
}

/**
 * The last section written before the rule. The file is newest-first, which its own header
 * states, so everything above this heading is bound and this one and everything below it is not
 * — a section past its tag is not touched.
 *
 * **Named from the old side on purpose.** The heading under the boundary never moves again,
 * while the first version written under the rule is a number this line would have to be edited
 * for at the release after it, and at every release after that.
 */
const SECTIONS_BEFORE_THE_RULE = "## [0.17.0]";

/** Where an entry carries a second sentence, reading down to `floor` or to the end of the file. */
function getSentenceFaults(text: string, floor: string | null): string[] {
    const faults: string[] = [];
    for (const { section, entry } of getEntries(text)) {
        if (floor !== null) {
            if (section.startsWith(floor)) break;
        }
        const early = getSentenceEnds(entry).filter((end) => !isEndAtTheClose(entry, end));
        if (early.length === 0) continue;
        faults.push(`${section}: ${entry.slice(0, 40)}`);
    }
    return faults;
}

/**
 * One sentence per entry, which the file's header states and nothing held: a player reads a
 * section to decide whether to update, and the sentence after the first is written for us.
 *
 * Proved both ways, on entries that keep the rule and entries that break it — a version number
 * and a quotation of the game's are the two stops that are not sentence ends.
 */
Deno.test("an entry from the rule down is one sentence", () => {
    const kept = "## [1.0.0]\n\n- **Nowość** — Panel liczy tury, a karta je pokazuje.\n";
    assertEquals(getSentenceFaults(kept, null), [], "one sentence states no fault");
    const numbered = "## [1.0.0]\n\n- **Zmiana** — Panel mówi 0.17.0 zamiast 0.16.0.\n";
    assertEquals(getSentenceFaults(numbered, null), [], "a version number is not a sentence end");
    const quoted = '## [1.0.0]\n\n- **Zmiana** — Panel mówi „Walka się skończyła." i tyle.\n';
    assertEquals(getSentenceFaults(quoted, null), [], "and neither is a quotation of the game's");

    const broken = "## [1.0.0]\n\n- **Nowość** — Panel liczy tury. Karta je pokazuje.\n";
    assertEquals(getSentenceFaults(broken, null).length, 1, "a second sentence states a fault");
    const wrapped = "## [1.0.0]\n\n- **Nowość** — Panel liczy tury.\n  Karta je pokazuje.\n";
    assertEquals(getSentenceFaults(wrapped, null).length, 1, "and states it across a wrap too");

    const faults = getSentenceFaults(CHANGELOG, SECTIONS_BEFORE_THE_RULE);
    assertEquals(faults, [], "a sentence a player reads past the line they came for");
});

/**
 * The floor from the other end: a boundary below which every entry already keeps the rule is a
 * boundary nothing needs, and a floor nobody prunes is how an exception becomes the rule.
 */
Deno.test("the sections this rule arrived too late for are still there", () => {
    assertStringIncludes(CHANGELOG, SECTIONS_BEFORE_THE_RULE, "the floor is a heading in the file");
    const whole = getSentenceFaults(CHANGELOG, null);
    const below = whole.some((one) => one.startsWith(SECTIONS_BEFORE_THE_RULE));
    assert(below, `${SECTIONS_BEFORE_THE_RULE} keeps the rule already and needs no floor`);
});
