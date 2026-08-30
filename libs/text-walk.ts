/**
 * Walking text one character at a time, which is how text is read here — **C7**.
 *
 * The predicate is the caller's, so a caller's own alphabet stays its own: a minified local
 * admits `$` and `_`, and neither belongs to every reader. What is shared is the walk.
 */

import { assert } from "@std/assert";

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
    assert(text.length > 0, "a digit run holds at least one digit");
    return end === text.length;
}
