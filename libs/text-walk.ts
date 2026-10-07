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

/** A literal opened and not closed inside the bound on one: text from outside answers it so. */
export class LiteralTooLong extends Error {
    override readonly name = "LiteralTooLong";
    readonly maximum: number;

    constructor(maximum: number) {
        super();
        this.maximum = maximum;
    }
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
 * both builds above, 41 of whitespace and 10 of digits, read 2026-10-04. Markup walks its own
 * runs under the bound on a page, which a page's whitespace may pass.
 */
export const RUN_CHARACTERS_MAXIMUM = 65_536;
/**
 * What HTML and JavaScript both treat as space between the things that mean something. `\v` is
 * JavaScript's alone, and neither build `hb9Z0D4r` nor `DHSqC3Uh` holds one, both fetched
 * 2026-10-06.
 */
const WHITESPACE = " \t\r\n\f";

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

/** For text past the edge that read it, where a run reaching the bound is a bug of ours (E1). */
export function getEndOfRun(
    text: string,
    from: number,
    isMember: (text: string, index: number) => boolean,
): number {
    const runEnd = lookupEndOfRun(text, from, RUN_CHARACTERS_MAXIMUM, isMember);
    assert(runEnd !== null, "a run ends inside the bound on its length");
    return runEnd;
}

/**
 * Answers `from` where nothing matched, which is how a caller tells a run from none, and null
 * where the run reaches `maximum`: text from outside answers that as its own failure (E1).
 */
export function lookupEndOfRun(
    text: string,
    from: number,
    maximum: number,
    isMember: (text: string, index: number) => boolean,
): number | null {
    assert(Number.isSafeInteger(from), "a run starts at a whole position");
    assert(from >= 0, "never before the text");
    assert(from <= text.length, "nor past its end");
    assert(Number.isSafeInteger(maximum), "a run is bounded by a whole count of characters");
    assert(maximum > 0, "of at least one");
    let runEnd = from;
    for (let look = 0; look < maximum; look += 1) {
        if (runEnd >= text.length) break;
        if (!isMember(text, runEnd)) break;
        runEnd += 1;
    }
    assert(runEnd <= text.length, "a run never ends past the text it walked");
    if (runEnd - from < maximum) return runEnd;
    return null;
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

/** Null where no literal opens at `open` or none closes before the text ends. */
export function lookupQuotedLiteral(
    text: string,
    open: number,
): QuotedLiteral | null | LiteralTooLong {
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
    return new LiteralTooLong(LITERAL_CHARACTERS_MAXIMUM);
}
