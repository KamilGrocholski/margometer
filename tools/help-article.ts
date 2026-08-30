/**
 * The game's published help, cached and searched.
 *
 *     deno task help status | fetch | search <phrase> … | freeze <phrase> …
 *
 * It is the only source that says what an effect *does* — the bundle says which keys exist — and
 * it prints the engine name in parentheses beside the human one, which is what makes an article
 * joinable to a protocol key. Raw slices are printed and never interpreted: a summary that missed
 * a phrase reads exactly like an article that does not carry it. What is fetched stays in
 * `.cache/` (NOTICE.md).
 */

import { assert } from "@std/assert";
import { getEndOfRun } from "@/libs/text-walk.ts";
import { composeJsonWriting, getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { HelpArticleError } from "@/tools/margometer-tool-error.ts";

const HELP_HOST = "https://pomoc.margonem.pl";

/**
 * "Mechanika walk" — the only article carrying combat mechanics. Exported so the frozen counts
 * can be held to naming the article they were taken from: pointing the tool elsewhere once left
 * every count describing a document the tool no longer read.
 */
export const MECHANICS_ARTICLE = "372";

/** Exported so a test can ask **git** whether this path is ignored, as the client cache is. */
export const CACHE_ROOT = ".cache/help/";

const MANIFEST_NAME = "provenance.json";
const TEXT_NAME = "text.txt";
const FROZEN_PATH = "frozen/help-phrases.ts";
const INDENT_SPACES = 2;
const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * A week. Past it the tool says so rather than answering quietly: an entry reading "checked, the
 * help is silent" written off an old dump is a false negative wearing a date.
 */
const STALE_AFTER_DAYS = 7;

const TAG_OPEN = "<";
const TAG_CLOSE = ">";
const TAG_TERMINATOR = "/";
const LOWER_CASE_OFFSET = 32;
const WHITESPACE = " \t\r\n\f\v";
/** Elements whose body is text to a browser and machinery to a reader. */
const RAW_TEXT_ELEMENTS = ["script", "style"];
/** Past the tag count of any article this host serves, so each walk carries a stated bound. */
const MAXIMUM_TAGS = 1048576;
/** Past the length of any run of whitespace in one, for the same reason. */
const MAXIMUM_RUNS = 1048576;

/**
 * The named entities this page uses, in the order they are substituted. ⚠️ **The order is the
 * meaning**: each pass runs over what the one before produced, so `&amp;lt;` becomes `&lt;` and
 * then `<`. One pass over the original stops at `&lt;`, which is a different answer.
 */
const ENTITIES: readonly (readonly [string, string])[] = [
    ["&nbsp;", " "],
    ["&nbsp", " "],
    ["&amp;", "&"],
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", '"'],
];

export interface CachedHelpArticle {
    article: string;
    url: string;
    fetchedAt: string;
    textPath: string;
    textLength: number;
}

/** The id names a directory, so anything but digits stops here rather than at `mkdir`. */
export function requireArticleId(text: string): string {
    if (getIntegerFromText(text) === null) {
        throw new HelpArticleError(`article id "${text}" is not a number`);
    }
    assert(text.length > 0, "an id that was admitted says something");
    assert(!text.includes("/"), "and names a directory rather than a path");
    return text;
}

function getArticleUrl(article: string): string {
    assert(article.length > 0, "an article is asked for by id");
    assert(HELP_HOST.startsWith("https://"), "and over the protocol the host serves");
    return `${HELP_HOST}/index/view,${article}`;
}

/** ASCII case folding, and only ASCII — a tag name has nothing else in it. */
function isSameAsciiTextAt(text: string, from: number, expected: string): boolean {
    assert(expected.length > 0, "a comparison is against something");
    assert(from >= 0, "and starts inside the text");
    for (let index = 0; index < expected.length; index += 1) {
        const character = text.charAt(from + index);
        if (character === "") return false;
        const folded = character >= "A" && character <= "Z"
            ? String.fromCharCode(character.charCodeAt(0) + LOWER_CASE_OFFSET)
            : character;
        if (folded !== expected.charAt(index)) return false;
    }
    return true;
}

/** Which raw-text element opens at `open`, and where its opening tag ends. */
function getRawTextOpening(html: string, open: number): { name: string; end: number } | null {
    for (const name of RAW_TEXT_ELEMENTS) {
        if (!isSameAsciiTextAt(html, open + 1, name)) continue;
        // Everything up to the first `>` belongs to the opening tag, attributes and all, and a
        // name this run out of is still this element.
        const close = html.indexOf(TAG_CLOSE, open + 1);
        if (close === -1) return null;
        assert(close > open, "a tag closes after it opened");
        return { name, end: close + 1 };
    }
    assert(RAW_TEXT_ELEMENTS.length > 0, "there are elements to recognise");
    return null;
}

/** Where the matching `</name>` ends, or null where there is none. */
function getRawTextClosing(html: string, from: number, name: string): number | null {
    assert(name.length > 0, "a closing tag is looked for by name");
    for (let index = from; index < html.length; index += 1) {
        if (html.charAt(index) !== TAG_OPEN) continue;
        if (html.charAt(index + 1) !== TAG_TERMINATOR) continue;
        if (!isSameAsciiTextAt(html, index + 2, name)) continue;
        if (html.charAt(index + 2 + name.length) !== TAG_CLOSE) continue;
        assert(index >= from, "a closing tag is found at or after where the search began");
        return index + 2 + name.length + 1;
    }
    return null;
}

/**
 * Script and style bodies out, tag and contents together. They go first because stripping the
 * tags before their contents leaves the code in the output, where a search hits page machinery
 * and reports it as documentation.
 */
function composeWithoutRawTextElements(html: string): string {
    let kept = "";
    let from = 0;
    let open = html.indexOf(TAG_OPEN);
    for (let look = 0; look < MAXIMUM_TAGS; look += 1) {
        if (open === -1) break;
        const opening = getRawTextOpening(html, open);
        const end = opening === null ? null : getRawTextClosing(html, opening.end, opening.name);
        // An opening with no closing is not an element, so the search resumes one character in.
        if (end === null) {
            kept += html.slice(from, open + 1);
            from = open + 1;
        } else {
            kept += `${html.slice(from, open)} `;
            from = end;
        }
        open = html.indexOf(TAG_OPEN, from);
    }
    assert(from <= html.length, "the walk stays inside what it walked");
    assert(MAXIMUM_TAGS > 0, "and was given a stated bound");
    return kept + html.slice(from);
}

/** Every remaining tag out. `<>` is not one — there has to be a character in it. */
function composeWithoutTags(html: string): string {
    let kept = "";
    let from = 0;
    let open = html.indexOf(TAG_OPEN);
    for (let look = 0; look < MAXIMUM_TAGS; look += 1) {
        if (open === -1) break;
        const close = html.indexOf(TAG_CLOSE, open + 1);
        if (close === -1 || close === open + 1) {
            kept += html.slice(from, open + 1);
            from = open + 1;
        } else {
            kept += `${html.slice(from, open)} `;
            from = close + 1;
        }
        open = html.indexOf(TAG_OPEN, from);
    }
    assert(from <= html.length, "the walk stays inside what it walked");
    assert(MAXIMUM_TAGS > 0, "and was given a stated bound");
    return kept + html.slice(from);
}

function isWhitespaceAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    if (character === "") return false;
    assert(character.length === 1, "one character is looked at");
    return WHITESPACE.includes(character);
}

/** Every run of whitespace down to one space, and none at either end. */
function composeCollapsedWhitespace(text: string): string {
    let collapsed = "";
    let from = 0;
    let index = 0;
    for (let look = 0; look < MAXIMUM_RUNS; look += 1) {
        if (index >= text.length) break;
        if (!isWhitespaceAt(text, index)) {
            index += 1;
            continue;
        }
        const end = getEndOfRun(text, index, isWhitespaceAt);
        collapsed += `${text.slice(from, index)} `;
        from = end;
        index = end;
    }
    assert(from <= text.length, "the walk stays inside what it walked");
    assert(MAXIMUM_RUNS > 0, "and was given a stated bound");
    return `${collapsed}${text.slice(from)}`.trim();
}

/** HTML to text, in the order the steps have to run in. */
export function getTextFromHtml(html: string): string {
    let text = composeWithoutTags(composeWithoutRawTextElements(html));
    for (const [entity, character] of ENTITIES) text = text.split(entity).join(character);
    assert(ENTITIES.length > 0, "there are entities to substitute");
    assert(text.length <= html.length + ENTITIES.length, "text is never longer than its markup");
    return composeCollapsedWhitespace(text);
}

export function getOccurrenceCount(text: string, phrase: string): number {
    assert(phrase.length > 0, "an empty phrase is counted nowhere");
    const count = text.toLocaleLowerCase("pl").split(phrase.toLocaleLowerCase("pl")).length - 1;
    assert(count >= 0, "a count is never below nothing");
    return count;
}

/**
 * Slices around each hit, without repeating one already on screen. A repeat is recognised by the
 * slices **overlapping**, never by keying on the fragment's first characters: where the same
 * content precedes two hits — a table, a repeated heading — the keys collide and hits from
 * different parts of the article vanish as duplicates, silently.
 */
export function getFragments(
    text: string,
    phrase: string,
    context: number,
    maximum: number,
): string[] {
    if (phrase === "") throw new HelpArticleError("an empty phrase matches everywhere");
    const needle = phrase.toLocaleLowerCase("pl");
    const haystack = text.toLocaleLowerCase("pl");
    const before = Math.round(context / 3);

    const found: string[] = [];
    let from = 0;
    let previousEnd = -1;
    while (found.length < maximum) {
        const hit = haystack.indexOf(needle, from);
        if (hit === -1) break;
        from = hit + needle.length;
        if (hit < previousEnd) continue;
        const end = hit + context;
        found.push(text.slice(Math.max(0, hit - before), end).trim());
        previousEnd = end;
    }
    assert(found.length <= maximum, "no more fragments than were asked for");
    assert(before <= context, "the text in front of a hit is part of its window");
    return found;
}

/** Milliseconds for an ISO instant, or null. `Date.parse` answers NaN for anything else. */
function getMillisecondsFromIsoText(text: string): number | null {
    const milliseconds = Date.parse(text);
    if (!Number.isFinite(milliseconds)) return null;
    assert(Number.isFinite(milliseconds), "an instant that was read is a number");
    assert(text.length > 0, "and was read from something");
    return milliseconds;
}

/** How old the dump is, in words, and loudly once it is worth re-fetching. */
export function composeAgeText(fetchedAt: string, now: number): string {
    const milliseconds = getMillisecondsFromIsoText(fetchedAt);
    if (milliseconds === null) return "read date unreadable — treat this dump as stale";
    // UTC is spelled out: without it a file `ls` shows at 20:30 reads here as 18:30 and looks
    // like the tool got it wrong, which puts the rest of the line in doubt.
    const when = `${fetchedAt.slice(0, 16).replace("T", " ")} UTC`;
    const days = Math.floor((now - milliseconds) / MILLISECONDS_PER_DAY);
    assert(Number.isFinite(days), "an age is a number of days");
    assert(when.endsWith("UTC"), "and is stated against a zone a reader can check");
    if (days <= 0) return `read ${when}, today`;
    if (days === 1) return `read ${when}, yesterday`;
    const warning = days >= STALE_AFTER_DAYS ? " ⚠ re-fetch before deciding" : "";
    return `read ${when}, ${composeIntegerText(days)} days ago${warning}`;
}

function getHelpCacheDirectory(article: string): string {
    assert(CACHE_ROOT.endsWith("/"), "a root a name is joined to ends in a separator");
    assert(article.length > 0, "an article names its own directory");
    return `${CACHE_ROOT}${article}/`;
}

function getHelpManifestPath(article: string): string {
    const path = `${getHelpCacheDirectory(article)}${MANIFEST_NAME}`;
    assert(path.endsWith(MANIFEST_NAME), "a manifest is named what a manifest is named");
    assert(path.startsWith(CACHE_ROOT), "and sits under the cache nothing leaves");
    return path;
}

function requireHelpArticleField(value: unknown, field: string, article: string): string {
    if (typeof value !== "string" || value === "") {
        throw new HelpArticleError(`cache manifest for ${article}: ${field} is not stated`);
    }
    assert(value.length > 0, "a field that was read says something");
    assert(field.length > 0, "and was asked for by name");
    return value;
}

/**
 * The manifest dates every claim made from this dump, so a field it does not carry stops here.
 * Cast instead and a truncated file passes as provenance, with `fetchedAt` arriving as
 * `undefined` at the age check that exists to catch exactly that.
 */
export function requireCachedHelpArticle(value: unknown, article: string): CachedHelpArticle {
    if (!isRecord(value)) {
        throw new HelpArticleError(`cache manifest for ${article} is not an object`);
    }
    const stated = requireHelpArticleField(value["article"], "article", article);
    if (stated !== article) {
        throw new HelpArticleError(`cache manifest for ${article} says it holds ${stated}`);
    }
    const textLength = getIntegerFromText(String(value["textLength"] ?? ""));
    if (textLength === null) {
        throw new HelpArticleError(`cache manifest for ${article}: textLength is not a number`);
    }
    assert(stated === article, "a manifest names the article it was asked for");
    assert(textLength >= 0, "and states a length that is one");
    return {
        article,
        url: requireHelpArticleField(value["url"], "url", article),
        fetchedAt: requireHelpArticleField(value["fetchedAt"], "fetchedAt", article),
        textPath: requireHelpArticleField(value["textPath"], "textPath", article),
        textLength,
    };
}

/** What is cached for this article, or null. Absence is an answer; an unreadable file is not. */
function getCachedHelpArticle(article: string): CachedHelpArticle | null {
    const manifest = getHelpManifestPath(article);
    let text = "";
    try {
        text = Deno.readTextFileSync(manifest);
    } catch {
        // Nothing fetched yet is not a failure: the caller says what to do about it.
        return null;
    }
    const reading = getJsonReading(text);
    if (!reading.isOk) {
        throw new HelpArticleError(`cache manifest for ${article} is unreadable`, {
            cause: reading.cause,
        });
    }
    assert(text.length > 0, "a manifest that was read says something");
    return requireCachedHelpArticle(reading.value, article);
}

/** Refuses rather than fetching behind the caller's back: a claim is dated by its dump. */
function getCachedArticleText(article: string): { cached: CachedHelpArticle; text: string } {
    const cached = getCachedHelpArticle(article);
    if (cached === null) {
        throw new HelpArticleError(
            `nothing cached for article ${article} — run \`deno task help fetch\``,
        );
    }
    const text = Deno.readTextFileSync(cached.textPath);
    assert(text.length > 0, "a dump that was cached says something");
    assert(cached.fetchedAt.length > 0, "and is dated by when it was fetched");
    return { cached, text };
}

async function writeHelpArticleCache(article: string): Promise<CachedHelpArticle> {
    const url = getArticleUrl(article);
    const response = await fetch(url);
    if (!response.ok) {
        throw new HelpArticleError(`${url} answered ${response.status}`);
    }
    const text = getTextFromHtml(await response.text());
    const directory = getHelpCacheDirectory(article);
    Deno.mkdirSync(directory, { recursive: true });
    const textPath = `${directory}${TEXT_NAME}`;
    Deno.writeTextFileSync(textPath, text);

    const cached: CachedHelpArticle = {
        article,
        url,
        fetchedAt: new Date().toISOString(),
        textPath,
        textLength: text.length,
    };
    const writing = composeJsonWriting(cached, INDENT_SPACES);
    if (!writing.isOk) {
        throw new HelpArticleError(`provenance for ${article} cannot be written`, {
            cause: writing.cause,
        });
    }
    Deno.writeTextFileSync(getHelpManifestPath(article), `${writing.text}\n`);
    assert(cached.textLength > 0, "what was cached says something");
    return cached;
}

function writeHelpStatusReport(article: string): void {
    const cached = getCachedHelpArticle(article);
    if (cached === null) {
        console.log(`view,${article}  nothing cached`);
        return;
    }
    const size = composeIntegerText(cached.textLength);
    console.log(
        `view,${article}  ${size} characters  ${composeAgeText(cached.fetchedAt, Date.now())}`,
    );
    assert(cached.article === article, "the report names the article it was asked for");
    assert(size.length > 0, "and states a size a reader can compare");
}

/** How many phrases found nothing, so the caller can make silence visible to a script. */
function writeHelpSearchReport(
    article: string,
    phrases: readonly string[],
    context: number,
    maximum: number,
): number {
    const { cached, text } = getCachedArticleText(article);
    const size = composeIntegerText(text.length);
    console.log(
        `article view,${article} — ${size} characters (${
            composeAgeText(cached.fetchedAt, Date.now())
        })\n`,
    );

    let missing = 0;
    for (const phrase of phrases) {
        const fragments = getFragments(text, phrase, context, maximum);
        const total = composeIntegerText(getOccurrenceCount(text, phrase));
        const shown = composeIntegerText(fragments.length);
        console.log("=".repeat(72));
        console.log(`"${phrase}" — ${total} occurrences, showing ${shown}`);
        console.log("=".repeat(72));
        if (fragments.length === 0) {
            // Worded so it can go into the register unchanged: "not found" is not the same claim
            // as "not documented", and the difference is the whole point of printing raw slices.
            console.log(`NOT FOUND in article view,${article}. Try the engine name — the help`);
            console.log(`prints it in parentheses beside the human one, as in "Unik ( evade )".`);
            missing += 1;
            continue;
        }
        for (const fragment of fragments) console.log(`\n… ${fragment} …`);
        console.log();
    }
    assert(missing <= phrases.length, "no more silences than phrases asked about");
    assert(size.length > 0, "the report states the size it searched");
    return missing;
}

/** How often each phrase occurs, deduplicated and sorted, so a re-freeze shows real change. */
export function getPhraseCounts(text: string, phrases: readonly string[]): [string, number][] {
    const distinct = [...new Set(phrases)].sort();
    const counts: [string, number][] = distinct.map((phrase) => [
        phrase,
        getOccurrenceCount(text, phrase),
    ]);
    assert(counts.length <= phrases.length, "deduplication never invents a phrase");
    assert(counts.every(([, count]) => count >= 0), "a count is never below nothing");
    return counts;
}

/** A value written back as the text a reader will see, refusing rather than writing `null`. */
function requireWrittenPhraseText(value: unknown): string {
    const writing = composeJsonWriting(value);
    if (!writing.isOk) {
        throw new HelpArticleError("a phrase of the table cannot be written", {
            cause: writing.cause,
        });
    }
    assert(writing.text.length > 0, "a value that was written says something");
    assert(typeof writing.text === "string", "and is text by the time it is read back");
    return writing.text;
}

/**
 * Counts, and deliberately nothing else. The help is the operator's own writing and none of its
 * sentences enter this repository (NOTICE.md); a count is our measurement of the article rather
 * than a piece of it. `fetchedAt` is the dump's date, not the day a person read it — what it is
 * for is saying which dump these counts came from.
 */
function composeFrozenHelpModule(
    article: string,
    fetchedAt: string,
    counts: readonly [string, number][],
): string {
    const written = counts
        .map(([phrase, count]) =>
            `        ${requireWrittenPhraseText(phrase)}: ${composeIntegerText(count)},`
        )
        .join("\n");
    assert(written.length > 0, "a table that is written down says something");
    assert(fetchedAt.length > 0, "and is dated by the dump it was taken from");
    return `// Generated by \`deno task help freeze <phrase> …\`. Do not edit by hand.
//
// How often each phrase the register cites occurs in the game's published help.
// Counts only — the help's own sentences stay out of this repository (NOTICE.md),
// and a count is our measurement of the article rather than a piece of it.
//
// What it is for: a claim in \`docs/protocol-keys.md\` that the help does **or does
// not** document a key is re-earned against this table on every gate. A negative
// recorded from a search nobody re-runs is how four keys came to be filed as
// undocumented while the help described all four — see the notice in that file.

export const FROZEN_HELP_PHRASES = {
    article: ${requireWrittenPhraseText(article)},
    /** When the dump these counts were taken from was fetched, not when it was read. */
    fetchedAt: ${requireWrittenPhraseText(fetchedAt)},
    counts: {
${written}
    },
} as const;
`;
}

/** Takes the flag and its value out of the arguments, leaving the phrases behind. */
function removeFlagValue(argv: string[], flag: string, fallback: number): number {
    const at = argv.indexOf(flag);
    if (at === -1) return fallback;
    const text = argv[at + 1];
    const value = text === undefined ? null : getIntegerFromText(text);
    if (value === null || value <= 0) {
        throw new HelpArticleError(`${flag} takes a positive whole number`);
    }
    argv.splice(at, 2);
    assert(value > 0, "a flag that was read states a positive number");
    assert(!argv.includes(flag), "and is taken out of what is left to read");
    return value;
}

function removeFlagText(argv: string[], flag: string, fallback: string): string {
    const at = argv.indexOf(flag);
    if (at === -1) return fallback;
    const value = argv[at + 1];
    if (value === undefined) throw new HelpArticleError(`${flag} takes a value`);
    argv.splice(at, 2);
    assert(value.length >= 0, "a flag that was read states something");
    assert(!argv.includes(flag), "and is taken out of what is left to read");
    return value;
}

if (import.meta.main) {
    const argv = [...Deno.args];
    const article = requireArticleId(removeFlagText(argv, "--article", MECHANICS_ARTICLE));
    const context = removeFlagValue(argv, "--context", 420);
    // Six rather than three: a phrase that is part of a longer word matches it too, and with a
    // low limit the real hit falls off the end and reads as its absence.
    const count = removeFlagValue(argv, "--count", 6);
    const [command, ...phrases] = argv;

    if (command === "status") {
        writeHelpStatusReport(article);
    } else if (command === "fetch") {
        const cached = await writeHelpArticleCache(article);
        const size = composeIntegerText(cached.textLength);
        console.log(`cached view,${cached.article} — ${size} characters → ${cached.textPath}`);
    } else if (command === "search") {
        if (phrases.length === 0) throw new HelpArticleError("search takes at least one phrase");
        // Non-zero exit is the point: a negative claim needs evidence as much as a positive one,
        // and silence has to be visible to a script and not only to whoever is reading along.
        if (writeHelpSearchReport(article, phrases, context, count) > 0) Deno.exit(1);
    } else if (command === "freeze") {
        if (phrases.length === 0) throw new HelpArticleError("freeze takes at least one phrase");
        const { cached, text } = getCachedArticleText(article);
        const counts = getPhraseCounts(text, phrases);
        Deno.writeTextFileSync(
            FROZEN_PATH,
            composeFrozenHelpModule(article, cached.fetchedAt, counts),
        );
        const age = composeAgeText(cached.fetchedAt, Date.now());
        console.log(
            `froze ${
                composeIntegerText(counts.length)
            } phrases from view,${article} (${age}) → ${FROZEN_PATH}`,
        );
        // A zero is a real answer, and it is the one that gets written into a register as "not
        // documented", so it is said out loud rather than left in the table.
        const silent = counts.filter(([, found]) => found === 0).map(([phrase]) => phrase);
        if (silent.length > 0) console.log(`found nothing for: ${silent.join(", ")}`);
    } else {
        console.log(
            "usage: deno task help [--article N] [--context N] [--count N]" +
                " status | fetch | search <phrase> … | freeze <phrase> …",
        );
    }
}
