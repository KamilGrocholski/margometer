/**
 * HTML to the text a reader sees, walked one character at a time — **C7**.
 *
 * Tags out, entities back to their characters, whitespace down to one space. It knows nothing of
 * what any page means: a caller slices the markup it wants read and asks for the words in it.
 */

import { assert } from "@std/assert/assert";
import { getEndOfRun } from "@/libs/text-walk.ts";

const TAG_OPEN = "<";
const TAG_CLOSE = ">";
const TAG_TERMINATOR = "/";
const LOWER_CASE_OFFSET = 32;
const WHITESPACE = " \t\r\n\f\v";
/** Elements whose body is text to a browser and machinery to a reader. */
const RAW_TEXT_ELEMENTS = ["script", "style"];
/** Past the tag count of any page a caller here reads, so each walk carries a stated bound. */
const MAXIMUM_TAGS = 1048576;
/** Past the length of any run of whitespace in one, for the same reason. */
const MAXIMUM_RUNS = 1048576;

/**
 * The named entities a caller here meets, in the order they are substituted. ⚠️ **The order is the
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
