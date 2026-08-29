/**
 * The build id the client states in its bundle's filename, so material can be dated.
 *
 * An absent id is `null` and never a stand-in: a recording that quietly claimed a build would be
 * worse than one admitting it has none. Text is walked rather than matched — **C7**.
 */

import { assert } from "@std/assert";

/**
 * What both shapes the client has served have in common. Until 2026-08-25 a bundle was
 * `main.min1786514810315.js`, thirteen digits of timestamp; read 2026-08-25, `tempest` and
 * `luvia` both serve `/js/main.min.53XkBRxF.js` — a dot and eight characters of mixed case.
 */
const LEAST_BUILD_CHARACTERS = 8;
const SCRIPT_NAME_HEAD = "main.min";
const SCRIPT_NAME_TAIL = ".js";
const OPTIONAL_SEPARATOR = ".";
/** A page states a handful of scripts; this is far past any of them. */
const MAXIMUM_LOOKS = 256;

function isAlphanumeric(character: string): boolean {
    assert(character.length <= 1, "one character is looked at");
    assert(character.length >= 0, "and it is a character rather than nothing typed");
    if (character >= "0" && character <= "9") return true;
    if (character >= "a" && character <= "z") return true;
    return character >= "A" && character <= "Z";
}

function getEndOfAlphanumerics(text: string, from: number): number {
    assert(from >= 0, "a run starts somewhere inside the text");
    let at = from;
    while (at < text.length) {
        if (!isAlphanumeric(text.charAt(at))) break;
        at += 1;
    }
    assert(at >= from, "a run never ends before it starts");
    assert(at <= text.length, "and never past the end of what it walked");
    return at;
}

/**
 * `main.min<build>.js` or `main.min.<build>.js`, null for anything else. A `main.min` whose tail
 * does not hold is not the end of the search: a page states this name more than once.
 */
export function getGameBuildFromScriptName(text: string): string | null {
    let from = 0;
    for (let look = 0; look < MAXIMUM_LOOKS; look += 1) {
        const head = text.indexOf(SCRIPT_NAME_HEAD, from);
        if (head === -1) return null;
        from = head + 1;
        let buildStart = head + SCRIPT_NAME_HEAD.length;
        if (text.charAt(buildStart) === OPTIONAL_SEPARATOR) buildStart += 1;
        const buildEnd = getEndOfAlphanumerics(text, buildStart);
        if (buildEnd - buildStart < LEAST_BUILD_CHARACTERS) continue;
        if (!text.startsWith(SCRIPT_NAME_TAIL, buildEnd)) continue;
        assert(buildEnd > buildStart, "an id that was found says something");
        return text.slice(buildStart, buildEnd);
    }
    assert(MAXIMUM_LOOKS > 0, "the walk was given something to look at");
    return null;
}
