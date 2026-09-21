/**
 * Walking text one character at a time, which is how text is read here — **C7**.
 *
 * The predicate is the caller's, so a caller's own alphabet stays its own: a minified local
 * admits `$` and `_`, and neither belongs to every reader. What is shared is the walk.
 */

import { assert } from "@std/assert/assert";

export function isDigitAt(text: string, index: number): boolean {
    const character = text.charAt(index);
    assert(character.length <= 1, "one character is looked at");
    assert(index >= 0, "and it is looked for inside the text");
    if (character < "0") return false;
    return character <= "9";
}

/** Answers `from` where nothing matched, which is how a caller tells a run from none. */
export function getEndOfRun(
    text: string,
    from: number,
    isMember: (text: string, index: number) => boolean,
): number {
    assert(from >= 0, "a run starts somewhere inside the text");
    let at = from;
    while (at < text.length) {
        if (!isMember(text, at)) break;
        at += 1;
    }
    assert(at >= from, "a run never ends before it starts");
    assert(at <= text.length, "and never past the end of what it walked");
    return at;
}

/** Whether the text is digits and nothing else. Empty text is no run, so it is not one. */
export function isDigitRun(text: string): boolean {
    if (text.length === 0) return false;
    const end = getEndOfRun(text, 0, isDigitAt);
    assert(end <= text.length, "a run of digits ends inside the text it was read from");
    return end === text.length;
}

/**
 * Any of the three quotings JavaScript has, because which one a build uses is the bundler's taste
 * and not the source's meaning. The class admits a mismatched pair, which no valid source holds,
 * and every use sits inside a longer shape that decides what it is reading.
 */
export const JAVASCRIPT_QUOTES = "\"'`";

/** Past the longest literal any bundle read here states, so the walk stays a stated bound. */
const MAXIMUM_LITERAL_CHARACTERS = 65536;

export interface QuotedLiteral {
    text: string;
    end: number;
}

/** The text inside a quoted literal opening at `open`, and where it ends. */
export function getQuotedLiteral(text: string, open: number): QuotedLiteral | null {
    assert(open >= 0, "a literal is looked for inside the text");
    const opening = text.charAt(open);
    if (opening === "") return null;
    if (!JAVASCRIPT_QUOTES.includes(opening)) return null;

    let index = open + 1;
    for (let look = 0; look < MAXIMUM_LITERAL_CHARACTERS; look += 1) {
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
