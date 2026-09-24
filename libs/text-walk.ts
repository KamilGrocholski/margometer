/**
 * Walking text one character at a time, which is how text is read here (C7).
 *
 * The predicate is the caller's, so a caller's own alphabet stays its own. What is shared is the
 * walk.
 */

import { assert } from "@std/assert/assert";

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
