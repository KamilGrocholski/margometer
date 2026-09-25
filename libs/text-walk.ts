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

/** Past the longest literal any bundle read here states, so the walk stays a stated bound. */
const LITERAL_CHARACTERS_MAXIMUM = 65_536;

export function isDigitAt(text: string, index: number): boolean {
    assert(Number.isSafeInteger(index), "a character is looked for at a whole position");
    assert(index >= 0, "and inside the text");
    const character = text.charAt(index);
    if (character < "0") return false;
    return character <= "9";
}

/** Answers `from` where nothing matched, which is how a caller tells a run from none. */
export function getEndOfRun(
    text: string,
    from: number,
    isMember: (text: string, index: number) => boolean,
): number {
    assert(Number.isSafeInteger(from), "a run starts at a whole position");
    assert(from >= 0, "inside the text");
    let at = from;
    while (at < text.length) {
        if (!isMember(text, at)) break;
        at += 1;
    }
    assert(at >= from, "a run never ends before it starts");
    assert(at <= Math.max(from, text.length), "and never past the end of what it walked");
    return at;
}

/** Empty text is no run. */
export function isDigitRun(text: string): boolean {
    if (text.length === 0) return false;
    const end = getEndOfRun(text, 0, isDigitAt);
    assert(end <= text.length, "a run of digits ends inside the text it was read from");
    return end === text.length;
}

/** The text inside a quoted literal opening at `open`, and where it ends. */
export function lookupQuotedLiteral(text: string, open: number): QuotedLiteral | null {
    assert(open >= 0, "a literal is looked for inside the text");
    const opening = text.charAt(open);
    if (opening === "") return null;
    if (!JAVASCRIPT_QUOTES.includes(opening)) return null;
    let index = open + 1;
    for (let look = 0; look < LITERAL_CHARACTERS_MAXIMUM; look += 1) {
        const character = text.charAt(index);
        if (character === "") return null;
        if (JAVASCRIPT_QUOTES.includes(character)) {
            assert(index > open, "a literal closes after it opened");
            return { text: text.slice(open + 1, index), end: index + 1 };
        }
        index += 1;
    }
    return null;
}
