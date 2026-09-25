/**
 * Markup read as the words a person would have seen in it. Text is walked rather than matched
 * (C7), so every loop carries a stated bound. Nothing about this project is in it: it is handed
 * markup and answers with text.
 */

import { assert } from "@std/assert/assert";
import { getEndOfRun } from "./text-walk.ts";

const TAG_OPEN = "<";
const TAG_CLOSE = ">";
const TAG_TERMINATOR = "/";
const LOWER_CASE_OFFSET = 32;
const WHITESPACE = " \t\r\n\f\v";
/** Elements whose body is text to a browser and machinery to a reader. */
const RAW_TEXT_ELEMENTS = ["script", "style"];
/** Past the tag count of any page these hosts serve, so each walk carries a stated bound. */
const TAGS_MAXIMUM = 1_048_576;
/** Past the length of any page these hosts serve, one look per character, for the same reason. */
const CHARACTERS_MAXIMUM = 1_048_576;
/**
 * The named entities these pages use, in the order they are substituted. ⚠️ **The order is the
 * meaning**: each pass runs over what the one before produced, so `&amp;lt;` becomes `&lt;` and
 * then `<`. `@std/html`'s `unescape` was asked first and answers differently (C17): it substitutes
 * once, and it takes the semicolon, while these pages write `&nbsp` without one.
 */
const ENTITIES: readonly (readonly [string, string])[] = [
    ["&nbsp;", " "],
    ["&nbsp", " "],
    ["&amp;", "&"],
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", '"'],
];

/** HTML to text, in the order the steps have to run in. */
export function decodeHtmlText(html: string): string {
    let text = removeTags(removeRawTextElements(html));
    for (const [entity, character] of ENTITIES) text = text.split(entity).join(character);
    assert(text.length <= html.length, "text is never longer than the markup it was read from");
    return composeCollapsedWhitespace(text);
}

/**
 * Script and style bodies out, tag and contents together. They go first because stripping the tags
 * before their contents leaves the code in the output, where a search reports machinery as prose.
 */
function removeRawTextElements(html: string): string {
    let kept = "";
    let from = 0;
    let open = html.indexOf(TAG_OPEN);
    for (let look = 0; look < TAGS_MAXIMUM; look += 1) {
        if (open === -1) break;
        const opening = lookupRawTextOpening(html, open);
        const end = opening === null ? null : lookupRawTextClosing(html, opening.end, opening.name);
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
    assert(open === -1, "every element was walked, which is what the bound is for");
    return kept + html.slice(from);
}

/** Which raw-text element opens at `open`, and where its opening tag ends. */
function lookupRawTextOpening(html: string, open: number): { name: string; end: number } | null {
    for (const name of RAW_TEXT_ELEMENTS) {
        if (!isSameAsciiTextAt(html, open + 1, name)) continue;
        // Everything up to the first `>` belongs to the opening tag, attributes and all.
        const close = html.indexOf(TAG_CLOSE, open + 1);
        if (close === -1) return null;
        assert(close > open, "a tag closes after it opened");
        return { name, end: close + 1 };
    }
    return null;
}

/** ASCII case folding, and only ASCII: a tag name has nothing else in it. */
function isSameAsciiTextAt(text: string, from: number, expected: string): boolean {
    assert(expected.length > 0, "a comparison is against something");
    assert(from >= 0, "and starts inside the text");
    for (let index = 0; index < expected.length; index += 1) {
        const character = text.charAt(from + index);
        if (character === "") return false;
        const isUpper = character >= "A" && character <= "Z";
        const folded = isUpper
            ? String.fromCharCode(character.charCodeAt(0) + LOWER_CASE_OFFSET)
            : character;
        if (folded !== expected.charAt(index)) return false;
    }
    return true;
}

/** Where the matching `</name>` ends, or null where there is none. */
function lookupRawTextClosing(html: string, from: number, name: string): number | null {
    assert(name.length > 0, "a closing tag is looked for by name");
    assert(html.length <= CHARACTERS_MAXIMUM, "a page stays inside the length it is walked to");
    for (let index = from; index < html.length; index += 1) {
        if (html.charAt(index) !== TAG_OPEN) continue;
        if (html.charAt(index + 1) !== TAG_TERMINATOR) continue;
        if (!isSameAsciiTextAt(html, index + 2, name)) continue;
        if (html.charAt(index + 2 + name.length) !== TAG_CLOSE) continue;
        return index + 2 + name.length + 1;
    }
    return null;
}

/** Every remaining tag out. `<>` is not one: there has to be a character in it. */
function removeTags(html: string): string {
    let kept = "";
    let from = 0;
    let open = html.indexOf(TAG_OPEN);
    for (let look = 0; look < TAGS_MAXIMUM; look += 1) {
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
    assert(open === -1, "every tag was walked, which is what the bound is for");
    return kept + html.slice(from);
}

/** Every run of whitespace down to one space, and none at either end. */
function composeCollapsedWhitespace(text: string): string {
    let collapsed = "";
    let from = 0;
    let index = 0;
    for (let look = 0; look < CHARACTERS_MAXIMUM; look += 1) {
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
    assert(index >= text.length, "every character was walked, which is what the bound is for");
    return `${collapsed}${text.slice(from)}`.trim();
}

function isWhitespaceAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    if (character === "") return false;
    return WHITESPACE.includes(character);
}
