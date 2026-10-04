/**
 * Markup read as the words a person would have seen in it. Text is walked rather than matched
 * (C7), so every loop carries a stated bound. Nothing about this project is in it: it is handed
 * markup and answers with text.
 */

import { assert } from "@std/assert/assert";
import { parseInteger } from "./number-text.ts";
import { getEndOfRun, isDigitAt, isWhitespaceAt } from "./text-walk.ts";

const TAG_OPEN = "<";
const TAG_CLOSE = ">";
const TAG_TERMINATOR = "/";
/** What may follow `<` for a browser to open a tag there: a letter, `/`, `!` or `?` (WHATWG). */
const TAG_NAME_OPENERS = "/!?";
const LOWER_CASE_OFFSET = 32;
/** Elements whose body is text to a browser and machinery to a reader. */
const RAW_TEXT_ELEMENTS = ["script", "style"];
/**
 * Past the length of any page these hosts serve, one look per character, so each walk carries a
 * stated bound: help article 372 was 645 883 characters with 16 662 `<`, and the skill table 99 896
 * with 4 662, both read 2026-10-04. A page past it is refused by the tool that reads it.
 */
export const HTML_CHARACTERS_MAXIMUM = 1_048_576;
/**
 * The named entities these pages use, in the order they are substituted. ⚠️ **The order is the
 * meaning**: each pass runs over what the one before produced, so `&amp;lt;` becomes `&lt;` and
 * then `<`. `@std/html`'s `unescape` was asked first and answers differently (C17): it substitutes
 * once, and it takes the semicolon, while these pages write `&nbsp` without one. Numeric references
 * it decodes as well, and so does this, after `&amp;`, where `NUMERIC_REFERENCE_OPEN` stands.
 */
const ENTITIES: readonly (readonly [string, string])[] = [
    ["&nbsp;", " "],
    ["&nbsp", " "],
    ["&amp;", "&"],
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", '"'],
];
const ENTITY_AMPERSAND = "&amp;";
const NUMERIC_REFERENCE_OPEN = "&#";
const NUMERIC_REFERENCE_HEXADECIMAL = "xX";
const NUMERIC_REFERENCE_CLOSE = ";";
/** The no-break space, read as the space `&nbsp;` is read as. */
const NO_BREAK_SPACE_CODE_POINT = 160;
const CODE_POINT_MAXIMUM = 0x10ffff;
const SURROGATE_FIRST = 0xd800;
const SURROGATE_LAST = 0xdfff;
/** Past `&#x10FFFF;` and `&#1114111;`, the longest a reference that names a character runs. */
const REFERENCE_DIGITS_MAXIMUM = 8;
const HEXADECIMAL_DIGITS = "0123456789abcdefABCDEF";
const HEXADECIMAL_RADIX = 16;

/** HTML to text, in the order the steps have to run in. */
export function decodeHtmlText(html: string): string {
    assert(
        html.length <= HTML_CHARACTERS_MAXIMUM,
        "a page stays inside the length it is walked to",
    );
    let withoutRawText: string;
    // Take script and style bodies out, tag and contents together.
    {
        // They go first because stripping the tags before their contents leaves the code in the
        // output, where a search reports machinery as prose.
        let kept = "";
        let from = 0;
        let open = html.indexOf(TAG_OPEN);
        for (let look = 0; look < HTML_CHARACTERS_MAXIMUM; look += 1) {
            if (open === -1) break;
            const opening = lookupRawTextOpening(html, open);
            const end = opening === null
                ? null
                : lookupRawTextClosing(html, opening.end, opening.name);
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
        withoutRawText = kept + html.slice(from);
    }
    let text: string;
    // Take every remaining tag out. A `<` a browser opens no tag at is text: `<= 20`, `<>`.
    {
        let kept = "";
        let from = 0;
        let open = withoutRawText.indexOf(TAG_OPEN);
        for (let look = 0; look < HTML_CHARACTERS_MAXIMUM; look += 1) {
            if (open === -1) break;
            const close = isTagOpeningAt(withoutRawText, open + 1)
                ? withoutRawText.indexOf(TAG_CLOSE, open + 1)
                : -1;
            if (close > open + 1) {
                kept += `${withoutRawText.slice(from, open)} `;
                from = close + 1;
            } else {
                kept += withoutRawText.slice(from, open + 1);
                from = open + 1;
            }
            open = withoutRawText.indexOf(TAG_OPEN, from);
        }
        assert(open === -1, "every tag was walked, which is what the bound is for");
        text = kept + withoutRawText.slice(from);
    }
    for (const [entity, character] of ENTITIES) {
        text = text.split(entity).join(character);
        if (entity === ENTITY_AMPERSAND) text = composeNumericReferencesDecoded(text);
    }
    assert(text.length <= html.length, "text is never longer than the markup it was read from");
    return composeCollapsedWhitespace(text);
}

function isTagOpeningAt(html: string, index: number): boolean {
    const character = html.charAt(index);
    if (character === "") return false;
    if (TAG_NAME_OPENERS.includes(character)) return true;
    if (isAsciiUpperCase(character)) return true;
    if (character < "a") return false;
    return character <= "z";
}

/**
 * `&#160;` and `&#x2202;` read as the characters they name; one naming no character, or never
 * closed, stays as it was written. The no-break space reads as a space, as `&nbsp;` does.
 */
function composeNumericReferencesDecoded(text: string): string {
    let decoded = "";
    let from = 0;
    let open = text.indexOf(NUMERIC_REFERENCE_OPEN);
    for (let look = 0; look < HTML_CHARACTERS_MAXIMUM; look += 1) {
        if (open === -1) break;
        const digitsAt = open + NUMERIC_REFERENCE_OPEN.length;
        const isHexadecimal = NUMERIC_REFERENCE_HEXADECIMAL.includes(text.charAt(digitsAt));
        const digitsFrom = isHexadecimal ? digitsAt + 1 : digitsAt;
        const digitsEnd = getEndOfRun(
            text,
            digitsFrom,
            isHexadecimal ? isHexadecimalDigitAt : isDigitAt,
        );
        const digits = text.slice(digitsFrom, digitsEnd);
        const codePoint = text.charAt(digitsEnd) === NUMERIC_REFERENCE_CLOSE
            ? lookupReferencedCodePoint(digits, isHexadecimal)
            : null;
        if (codePoint === null) {
            decoded += text.slice(from, digitsAt);
            from = digitsAt;
        } else {
            const character = codePoint === NO_BREAK_SPACE_CODE_POINT
                ? " "
                : String.fromCodePoint(codePoint);
            decoded += `${text.slice(from, open)}${character}`;
            from = digitsEnd + NUMERIC_REFERENCE_CLOSE.length;
        }
        open = text.indexOf(NUMERIC_REFERENCE_OPEN, from);
    }
    assert(open === -1, "every reference was walked, which is what the bound is for");
    return decoded + text.slice(from);
}

function isHexadecimalDigitAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    if (character === "") return false;
    return HEXADECIMAL_DIGITS.includes(character);
}

/** A surrogate half names no character on its own, and the platform would write one anyway. */
function lookupReferencedCodePoint(digits: string, isHexadecimal: boolean): number | null {
    if (digits.length === 0) return null;
    if (digits.length > REFERENCE_DIGITS_MAXIMUM) return null;
    const codePoint = isHexadecimal
        ? Number.parseInt(digits, HEXADECIMAL_RADIX)
        : parseInteger(digits);
    if (codePoint === null) return null;
    assert(Number.isSafeInteger(codePoint), "digits short enough read as a whole number");
    if (codePoint === 0) return null;
    if (codePoint > CODE_POINT_MAXIMUM) return null;
    if (codePoint < SURROGATE_FIRST) return codePoint;
    if (codePoint > SURROGATE_LAST) return codePoint;
    return null;
}

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
    assert(Number.isSafeInteger(from), "a comparison starts at a whole position");
    assert(from >= 0, "never before the text");
    for (let index = 0; index < expected.length; index += 1) {
        const character = text.charAt(from + index);
        if (character === "") return false;
        const folded = isAsciiUpperCase(character)
            ? String.fromCharCode(character.charCodeAt(0) + LOWER_CASE_OFFSET)
            : character;
        if (folded !== expected.charAt(index)) return false;
    }
    return true;
}

function isAsciiUpperCase(character: string): boolean {
    if (character < "A") return false;
    return character <= "Z";
}

function lookupRawTextClosing(html: string, from: number, name: string): number | null {
    assert(name.length > 0, "a closing tag is looked for by name");
    assert(from > 0, "and after the opening tag it closes");
    for (let index = from; index < html.length; index += 1) {
        if (html.charAt(index) !== TAG_OPEN) continue;
        if (html.charAt(index + 1) !== TAG_TERMINATOR) continue;
        if (!isSameAsciiTextAt(html, index + 2, name)) continue;
        if (html.charAt(index + 2 + name.length) !== TAG_CLOSE) continue;
        return index + 2 + name.length + 1;
    }
    return null;
}

/** Every run of whitespace down to one space, and none at either end. */
function composeCollapsedWhitespace(text: string): string {
    let collapsed = "";
    let from = 0;
    let index = 0;
    for (let look = 0; look < HTML_CHARACTERS_MAXIMUM; look += 1) {
        if (index === text.length) break;
        if (!isWhitespaceAt(text, index)) {
            index += 1;
            continue;
        }
        const end = getEndOfRun(text, index, isWhitespaceAt);
        collapsed += `${text.slice(from, index)} `;
        from = end;
        index = end;
    }
    assert(index === text.length, "every character was walked, which is what the bound is for");
    return `${collapsed}${text.slice(from)}`.trim();
}
