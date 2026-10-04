/**
 * Walking text one character at a time, which is how text is read here (C7).
 *
 * The predicate is the caller's, so a caller's own alphabet stays its own. What is shared is the
 * walk.
 */

import { assert } from "@std/assert/assert";

export interface QuotedLiteral {
    text: string;
    end: number;
}

/**
 * Any of the three quotings JavaScript has, because which one a build uses is the bundler's taste
 * and not the source's meaning. The class admits a mismatched pair, which no valid source holds,
 * and every use sits inside a longer shape that decides what it is reading.
 */
export const JAVASCRIPT_QUOTES = "\"'`";

/**
 * Past the farthest two quotes stand apart in any bundle read here, so the walk stays a stated
 * bound: 33679 characters in development build `COv-iBFt` and 15311 in production build
 * `DHSqC3Uh`, both fetched 2026-10-02.
 */
export const LITERAL_CHARACTERS_MAXIMUM = 65_536;
/**
 * Past the longest run any caller walks, so a run is a stated bound too: 64 characters of a name in
 * both builds above, 41 of whitespace, 10 of digits, and 93 of whitespace in help article 372 read
 * 2026-10-04.
 */
export const RUN_CHARACTERS_MAXIMUM = 65_536;
/** What HTML and JavaScript both treat as space between the things that mean something. */
const WHITESPACE = " \t\r\n\f\v";

export function isDigitAt(text: string, index: number): boolean {
    assert(Number.isSafeInteger(index), "a character is looked for at a whole position");
    assert(index >= 0, "never before the text");
    const character = text.charAt(index);
    if (character < "0") return false;
    return character <= "9";
}

export function isWhitespaceAt(text: string, index: number): boolean {
    assert(Number.isSafeInteger(index), "a character is looked for at a whole position");
    assert(index >= 0, "never before the text");
    const character = text.charAt(index);
    if (character === "") return false;
    return WHITESPACE.includes(character);
}

/** Answers `from` where nothing matched, which is how a caller tells a run from none. */
export function getEndOfRun(
    text: string,
    from: number,
    isMember: (text: string, index: number) => boolean,
): number {
    assert(Number.isSafeInteger(from), "a run starts at a whole position");
    assert(from >= 0, "never before the text");
    let runEnd = from;
    for (let look = 0; look < RUN_CHARACTERS_MAXIMUM; look += 1) {
        if (runEnd >= text.length) break;
        if (!isMember(text, runEnd)) break;
        runEnd += 1;
    }
    assert(runEnd - from < RUN_CHARACTERS_MAXIMUM, "a run ends inside the bound on its length");
    assert(runEnd <= Math.max(from, text.length), "and never past the end of what it walked");
    return runEnd;
}

/**
 * Empty text is no run, and neither is text past the bound on one: no number that long is read
 * exactly, so a reader of it answers no number rather than walking it.
 */
export function isDigitRun(text: string): boolean {
    if (text.length === 0) return false;
    if (text.length >= RUN_CHARACTERS_MAXIMUM) return false;
    const end = getEndOfRun(text, 0, isDigitAt);
    assert(end <= text.length, "a run of digits ends inside the text it was read from");
    return end === text.length;
}

export function lookupQuotedLiteral(text: string, open: number): QuotedLiteral | null {
    assert(Number.isSafeInteger(open), "a literal is looked for at a whole position");
    assert(open >= 0, "never before the text");
    const opening = text.charAt(open);
    if (opening === "") return null;
    if (!JAVASCRIPT_QUOTES.includes(opening)) return null;
    let index = open + 1;
    for (let look = 0; look <= LITERAL_CHARACTERS_MAXIMUM; look += 1) {
        const character = text.charAt(index);
        if (character === "") return null;
        if (JAVASCRIPT_QUOTES.includes(character)) {
            assert(index > open, "a literal closes after it opened");
            return { text: text.slice(open + 1, index), end: index + 1 };
        }
        index += 1;
    }
    assert(false, "a literal closes inside the bound on its length");
}
