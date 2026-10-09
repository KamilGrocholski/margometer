/**
 * Markup read as the words a person would have seen in it. Text is walked rather than matched
 * (C7), so every loop carries a stated bound. Nothing about this project is in it: it is handed
 * markup and answers with text.
 */

import { assert } from "@std/assert/assert";
import { parseInteger } from "./number-text.ts";
import { isDigitAt, isWhitespaceAt, lookupEndOfRun } from "./text-walk.ts";

interface CharacterReference {
    readonly character: string;
    readonly end: number;
}

const TAG_OPEN = "<";
const TAG_CLOSE = ">";
const TAG_TERMINATOR = "/";
/** What may follow `<` for a browser to open a tag there: a letter, `/`, `!` or `?` (WHATWG). */
const TAG_NAME_OPENERS = "/!?";
/** `<!…>` and `<?…>` close at their first `>`, quotes and all (WHATWG, bogus comment). */
const BOGUS_COMMENT_OPENERS = "!?";
const COMMENT_OPEN = "<!--";
const COMMENT_CLOSE = "-->";
/** From the first dash, because `<!-->` and `<!--->` are comments closed already (WHATWG). */
const COMMENT_CLOSE_FROM = 2;
/** Only a value after `=` is quoted, and a `>` inside one closes nothing (WHATWG). */
const ATTRIBUTE_EQUALS = "=";
const ATTRIBUTE_QUOTES = "\"'";
const LOWER_CASE_OFFSET = 32;
/** Elements whose body is text to a browser and machinery to a reader. */
const RAW_TEXT_ELEMENTS = ["script", "style"];
/**
 * Past the length of any page these hosts serve, one look per character, so each walk carries a
 * stated bound: help article 372 was 645 883 characters with 16 662 `<`, and the skill table 99 896
 * with 4 662, both read 2026-10-04. Every caller refuses a longer page before it reaches here
 * (`tools/help-article.ts`, `tools/skill-table.ts`), so the assertion holds a bug of ours.
 */
export const HTML_CHARACTERS_MAXIMUM = 1_048_576;
const REFERENCE_OPEN = "&";
/**
 * The named references these pages write, each read once, as a browser reads it: `&amp;lt;` shows
 * `&lt;`. `&nbsp;` stands before `&nbsp` so the longer is taken. `&in;` is help article 372's,
 * twice, fetched 2026-10-06. `@std/html`'s `unescape` (1.0.7, read 2026-10-06) was asked first
 * and answers differently (C17): its numeric passes run over what its named pass produced, so
 * `&amp;#160;` reads through, it writes a surrogate half, and `&nbsp;` is not a space.
 */
const NAMED_REFERENCES: readonly (readonly [string, string])[] = [
    ["&nbsp;", " "],
    ["&nbsp", " "],
    ["&amp;", "&"],
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", '"'],
    ["&in;", "∈"],
];
const NUMERIC_REFERENCE_OPEN = "&#";
const NUMERIC_REFERENCE_HEXADECIMAL = "xX";
const NUMERIC_REFERENCE_CLOSE = ";";
/** The no-break space, read as the space `&nbsp;` is read as. */
const NO_BREAK_SPACE_CODE_POINT = 160;
const CODE_POINT_MAXIMUM = 0x10ffff;
const SURROGATE_FIRST = 0xd800;
const SURROGATE_LAST = 0xdfff;
/** The C1 controls, which a browser reads through windows-1252 rather than as themselves. */
const CONTROLS_C1_FIRST = 0x80;
const CONTROLS_C1_LAST = 0x9f;
/** Past `1114111`, the most digits that name a character once the zeros in front are passed. */
const REFERENCE_DIGITS_MAXIMUM = 8;
const ZERO = "0";
const HEXADECIMAL_DIGITS = "0123456789abcdefABCDEF";
const HEXADECIMAL_RADIX = 16;

export function decodeHtmlText(html: string): string {
    assert(
        html.length <= HTML_CHARACTERS_MAXIMUM,
        "a page stays inside the length it is walked to",
    );
    let text: string;
    // Take every tag out, and a script or style together with its body.
    {
        // An element goes whole at its opening, so its code never reaches a search as prose, and
        // a comment goes whole at its own, so an element inside one is never opened. A `<` a
        // browser opens no tag at is text: `<= 20`, `<>`.
        let kept = "";
        let from = 0;
        let open = html.indexOf(TAG_OPEN);
        for (let look = 0; look < HTML_CHARACTERS_MAXIMUM; look += 1) {
            if (open === -1) break;
            const opening = lookupRawTextOpening(html, open);
            const elementEnd = opening === null
                ? null
                : lookupRawTextClosing(html, opening.end, opening.name);
            // An opening with no closing loses only its tag: a departure from a browser, listed
            // over `decodeCharacterReferences`.
            const end = elementEnd === null ? lookupTagEnd(html, open) : elementEnd;
            if (end === null) {
                kept += html.slice(from, open + 1);
                from = open + 1;
            } else {
                kept += `${html.slice(from, open)} `;
                from = end;
            }
            open = html.indexOf(TAG_OPEN, from);
        }
        assert(open === -1, "every tag was walked, which is what the bound is for");
        text = decodeCharacterReferences(kept + html.slice(from));
    }
    assert(text.length <= html.length, "text is never longer than the markup it was read from");
    return composeCollapsedWhitespace(text);
}

function lookupRawTextOpening(html: string, open: number): { name: string; end: number } | null {
    for (const name of RAW_TEXT_ELEMENTS) {
        if (!isSameAsciiTextAt(html, open + 1, name)) continue;
        const nameEnd = open + 1 + name.length;
        if (!isTagNameEndAt(html, nameEnd)) continue;
        const close = lookupTagClose(html, nameEnd);
        if (close === null) return null;
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
        assert(!isAsciiUpperCase(expected.charAt(index)), "a name is compared in lower case");
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
    assert(character.length === 1, "a case is asked of one character");
    if (character < "A") return false;
    return character <= "Z";
}

/** What ends a tag's name, so `<styled-note>` is not `<style>`: a space, `/` or `>` (WHATWG). */
function isTagNameEndAt(html: string, index: number): boolean {
    assert(Number.isSafeInteger(index), "a name is ended at a whole position");
    assert(index > 0, "after the `<` that opened it");
    const character = html.charAt(index);
    if (character === TAG_TERMINATOR) return true;
    if (character === TAG_CLOSE) return true;
    return isWhitespaceAt(html, index);
}

function lookupTagClose(html: string, from: number): number | null {
    assert(
        html.length <= HTML_CHARACTERS_MAXIMUM,
        "a page stays inside the length it is walked to",
    );
    assert(Number.isSafeInteger(from), "a tag is walked from a whole position");
    assert(from > 0, "after the `<` that opened it");
    let quote = "";
    let isValueNext = false;
    for (let index = from; index < html.length; index += 1) {
        const character = html.charAt(index);
        if (quote !== "") {
            if (character === quote) quote = "";
            continue;
        }
        if (character === TAG_CLOSE) return index;
        if (isValueNext) {
            if (ATTRIBUTE_QUOTES.includes(character)) {
                quote = character;
                isValueNext = false;
                continue;
            }
            if (isWhitespaceAt(html, index)) continue;
        }
        isValueNext = character === ATTRIBUTE_EQUALS;
    }
    return null;
}

/** A closing tag carrying attributes closes the element as a bare one does (WHATWG). */
function lookupRawTextClosing(html: string, from: number, name: string): number | null {
    assert(
        html.length <= HTML_CHARACTERS_MAXIMUM,
        "a page stays inside the length it is walked to",
    );
    assert(name.length > 0, "a closing tag is looked for by name");
    assert(from > 0, "and after the opening tag it closes");
    for (let index = from; index < html.length; index += 1) {
        if (html.charAt(index) !== TAG_OPEN) continue;
        if (html.charAt(index + 1) !== TAG_TERMINATOR) continue;
        if (!isSameAsciiTextAt(html, index + 2, name)) continue;
        const nameEnd = index + 2 + name.length;
        if (!isTagNameEndAt(html, nameEnd)) continue;
        const close = lookupTagClose(html, nameEnd);
        if (close === null) return null;
        return close + 1;
    }
    return null;
}

function lookupTagEnd(html: string, open: number): number | null {
    assert(html.charAt(open) === TAG_OPEN, "a tag is looked for where one opens");
    if (html.startsWith(COMMENT_OPEN, open)) {
        const commentClose = html.indexOf(COMMENT_CLOSE, open + COMMENT_CLOSE_FROM);
        if (commentClose === -1) return null;
        return commentClose + COMMENT_CLOSE.length;
    }
    if (!isTagOpeningAt(html, open + 1)) return null;
    if (BOGUS_COMMENT_OPENERS.includes(html.charAt(open + 1))) {
        const bogusClose = html.indexOf(TAG_CLOSE, open + 1);
        if (bogusClose === -1) return null;
        return bogusClose + 1;
    }
    const close = lookupTagClose(html, open + 1);
    if (close === null) return null;
    assert(close > open, "a tag closes after it opened");
    return close + 1;
}

function isTagOpeningAt(html: string, index: number): boolean {
    assert(Number.isSafeInteger(index), "a tag is opened at a whole position");
    assert(index > 0, "after the `<` that opens it");
    const character = html.charAt(index);
    if (character === "") return false;
    if (TAG_NAME_OPENERS.includes(character)) return true;
    if (isAsciiUpperCase(character)) return true;
    if (character < "a") return false;
    return character <= "z";
}

/**
 * ⚠️ Where a browser shows U+FFFD for a reference naming no character, reads one with no `;` other
 * than `&nbsp`, or reads `&#128;`–`&#159;` through windows-1252, this keeps what was written; so it
 * does an unclosed comment, which a browser hides to the end of the page, one closed by `--!>`, and
 * the body of an unclosed `<script>` or `<style>`, which a browser runs to the end as code. A `=`
 * after an unquoted value opens a quoted one, where a browser reads it into the value. Every tag
 * reads as a space, one inside a word included, where a browser joins the word across an inline
 * one. A no-break space written as a reference reads as a space; one written as itself stays.
 */
function decodeCharacterReferences(text: string): string {
    assert(text.length <= HTML_CHARACTERS_MAXIMUM, "text stays inside the length it is walked to");
    let decoded = "";
    let from = 0;
    let open = text.indexOf(REFERENCE_OPEN);
    for (let look = 0; look < HTML_CHARACTERS_MAXIMUM; look += 1) {
        if (open === -1) break;
        const reference = text.startsWith(NUMERIC_REFERENCE_OPEN, open)
            ? lookupNumericReference(text, open)
            : lookupNamedReference(text, open);
        if (reference === null) {
            decoded += text.slice(from, open + 1);
            from = open + 1;
        } else {
            decoded += `${text.slice(from, open)}${reference.character}`;
            from = reference.end;
        }
        open = text.indexOf(REFERENCE_OPEN, from);
    }
    assert(open === -1, "every reference was walked, which is what the bound is for");
    return decoded + text.slice(from);
}

function lookupNumericReference(text: string, open: number): CharacterReference | null {
    assert(text.startsWith(NUMERIC_REFERENCE_OPEN, open), "a numeric reference opens on its mark");
    const digitsAt = open + NUMERIC_REFERENCE_OPEN.length;
    // ⚠️ `includes("")` is true, so a `&#` ending the text would read as hexadecimal past it.
    const marker = text.charAt(digitsAt);
    if (marker === "") return null;
    const isHexadecimal = NUMERIC_REFERENCE_HEXADECIMAL.includes(marker);
    const digitsFrom = isHexadecimal ? digitsAt + 1 : digitsAt;
    // A page may write any number of zeros in front, and they name nothing.
    const zerosEnd = lookupEndOfRun(text, digitsFrom, HTML_CHARACTERS_MAXIMUM, isZeroAt);
    assert(zerosEnd !== null, "a run inside the text is shorter than the text");
    const digitsEnd = lookupEndOfRun(
        text,
        zerosEnd,
        REFERENCE_DIGITS_MAXIMUM,
        isHexadecimal ? isHexadecimalDigitAt : isDigitAt,
    );
    if (digitsEnd === null) return null;
    if (text.charAt(digitsEnd) !== NUMERIC_REFERENCE_CLOSE) return null;
    const codePoint = parseReferencedCodePoint(text.slice(zerosEnd, digitsEnd), isHexadecimal);
    if (codePoint === null) return null;
    const character = codePoint === NO_BREAK_SPACE_CODE_POINT
        ? " "
        : String.fromCodePoint(codePoint);
    return { character, end: digitsEnd + NUMERIC_REFERENCE_CLOSE.length };
}

function isZeroAt(text: string, index: number): boolean {
    assert(Number.isSafeInteger(index), "a character is looked for at a whole position");
    assert(index >= 0, "never before the text");
    return text.charAt(index) === ZERO;
}

function isHexadecimalDigitAt(text: string, index: number): boolean {
    assert(Number.isSafeInteger(index), "a character is looked for at a whole position");
    assert(index >= 0, "never before the text");
    const character = text.charAt(index);
    if (character === "") return false;
    return HEXADECIMAL_DIGITS.includes(character);
}

/**
 * A surrogate half names no character on its own, and the platform would write one anyway; a C1
 * control is not the character a browser shows for it.
 */
function parseReferencedCodePoint(digits: string, isHexadecimal: boolean): number | null {
    assert(digits.length < REFERENCE_DIGITS_MAXIMUM, "digits past the longest name are not read");
    if (digits.length === 0) return null;
    const codePoint = isHexadecimal
        ? Number.parseInt(digits, HEXADECIMAL_RADIX)
        : parseInteger(digits);
    assert(codePoint !== null, "digits walked as digits read as a number");
    assert(codePoint > 0, "and as one above nothing, its zeros passed");
    if (codePoint > CODE_POINT_MAXIMUM) return null;
    if (codePoint >= CONTROLS_C1_FIRST) {
        if (codePoint <= CONTROLS_C1_LAST) return null;
    }
    if (codePoint < SURROGATE_FIRST) return codePoint;
    if (codePoint > SURROGATE_LAST) return codePoint;
    return null;
}

function lookupNamedReference(text: string, open: number): CharacterReference | null {
    assert(text.startsWith(REFERENCE_OPEN, open), "a named reference opens on its mark");
    for (const [name, character] of NAMED_REFERENCES) {
        if (text.startsWith(name, open)) return { character, end: open + name.length };
    }
    return null;
}

/**
 * ⚠️ It trims as well: a run at either end leaves no space, not one. Not by `trim`, which takes a
 * no-break space too (C17): a run at the start adds nothing, and one at the end adds one space.
 */
function composeCollapsedWhitespace(text: string): string {
    assert(text.length <= HTML_CHARACTERS_MAXIMUM, "text stays inside the length it is walked to");
    let collapsed = "";
    let from = 0;
    for (let index = 0; index < text.length; index += 1) {
        if (!isWhitespaceAt(text, index)) continue;
        // A run is cut at its first character, and the rest of it adds nothing.
        if (from < index) collapsed += `${text.slice(from, index)} `;
        from = index + 1;
    }
    assert(from <= text.length, "the last run ends inside the text");
    const joined = `${collapsed}${text.slice(from)}`;
    return joined.endsWith(" ") ? joined.slice(0, -1) : joined;
}
